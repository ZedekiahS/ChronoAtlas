import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { prepareEvidencePack } from "./lib/evidence-pack.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultDbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const defaultPackPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-source-pool-v1.json");

function argumentValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

function tableExists(db, tableName) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName));
}

function rowCount(db, tableName) {
  return tableExists(db, tableName)
    ? db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count
    : null;
}

function ensureTables(db, tables) {
  const missing = tables.filter((table) => !tableExists(db, table));
  if (missing.length > 0) throw new Error(`Evidence-pool schema is incomplete: ${missing.join(", ")}`);
}

async function main() {
  const dbPath = path.resolve(argumentValue("--db", defaultDbPath));
  const packPath = path.resolve(argumentValue("--pack", defaultPackPath));
  const preparedPack = await prepareEvidencePack(packPath);
  const expectedWitnessIds = preparedPack.documents.map(({ prepared }) => prepared.document.witness.id);
  const expectedWorkIds = new Set();
  for (const { prepared } of preparedPack.documents) {
    expectedWorkIds.add(prepared.document.work.id);
    for (const work of prepared.document.relatedWorks ?? []) expectedWorkIds.add(work.id);
  }

  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    ensureTables(db, [
      "source_works",
      "source_witnesses",
      "source_assets",
      "asset_rights",
      "rights_statements",
      "ingest_runs",
      "ingest_run_assets",
      "witness_active_ingests",
      "document_nodes",
      "text_revisions",
      "text_anchors",
      "anchor_attributions",
      "evidence_packs",
      "evidence_pack_revisions",
      "evidence_pack_documents",
      "evidence_pack_active_revisions",
      "source_assertions",
      "claims",
      "event_records_v2",
      "content_releases_v2",
    ]);

    const failures = [];
    const witnesses = [];
    const witnessStatement = db.prepare(`
      SELECT
        witness.id AS witness_id,
        witness.work_id,
        witness.edition_statement,
        active.run_id,
        run.status AS run_status,
        asset.id AS asset_id,
        asset.storage_uri,
        rights.allow_store,
        rights.allow_display,
        rights.allow_index,
        rights.allow_quote
      FROM source_witnesses witness
      LEFT JOIN witness_active_ingests active ON active.witness_id = witness.id
      LEFT JOIN ingest_runs run ON run.id = active.run_id
      LEFT JOIN ingest_run_assets run_asset ON run_asset.run_id = active.run_id
      LEFT JOIN source_assets asset ON asset.id = run_asset.asset_id
      LEFT JOIN asset_rights asset_right ON asset_right.asset_id = asset.id
      LEFT JOIN rights_statements rights ON rights.id = asset_right.rights_id
      WHERE witness.id = ?
      ORDER BY run_asset.ordinal, asset.id
      LIMIT 1
    `);

    for (const witnessId of expectedWitnessIds) {
      const row = witnessStatement.get(witnessId);
      witnesses.push(row ?? { witness_id: witnessId, missing: true });
      if (!row) {
        failures.push(`missing witness ${witnessId}`);
        continue;
      }
      if (row.run_status !== "committed") failures.push(`witness ${witnessId} active run is ${row.run_status ?? "missing"}`);
      if (!row.asset_id) failures.push(`witness ${witnessId} has no active source asset`);
      if (!row.storage_uri?.startsWith("repo:data/evidence-pool/")) {
        failures.push(`witness ${witnessId} has non-portable storage URI ${row.storage_uri ?? "missing"}`);
      }
      if (row.allow_store !== 1 || row.allow_display !== 0 || row.allow_index !== 0) {
        failures.push(`witness ${witnessId} rights are outside the internal research policy`);
      }
    }

    const missingWorks = [...expectedWorkIds].filter((id) => !db.prepare("SELECT 1 FROM source_works WHERE id = ?").get(id));
    for (const id of missingWorks) failures.push(`missing source work ${id}`);
    const registry = db.prepare(`
      SELECT
        pack.id AS pack_id,
        revision.id AS revision_id,
        revision.pack_version,
        revision.manifest_sha256,
        COUNT(document.id) AS document_count,
        SUM(document.is_required) AS required_count
      FROM evidence_packs pack
      JOIN evidence_pack_active_revisions active ON active.pack_id = pack.id
      JOIN evidence_pack_revisions revision ON revision.id = active.revision_id
      LEFT JOIN evidence_pack_documents document ON document.revision_id = revision.id
      WHERE pack.pack_key = ?
      GROUP BY pack.id, revision.id
    `).get(preparedPack.pack.packId);
    if (!registry) {
      failures.push(`missing active evidence-pack registry for ${preparedPack.pack.packId}`);
    } else {
      if (registry.manifest_sha256 !== preparedPack.manifestSha256) failures.push("active evidence-pack manifest does not match the repository file");
      if (registry.document_count !== expectedWitnessIds.length) failures.push(`evidence-pack registry has ${registry.document_count} documents`);
      if (registry.required_count !== preparedPack.documents.filter(({ definition }) => definition.required).length) {
        failures.push(`evidence-pack registry has ${registry.required_count} required documents`);
      }
    }
    const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyFailures.length > 0) failures.push(`${foreignKeyFailures.length} foreign-key failures`);

    const formalLayerCounts = Object.fromEntries([
      "assertion_candidates",
      "source_assertions",
      "claim_candidates",
      "claims",
      "event_collection_candidates",
      "event_candidates_v2",
      "event_records_v2",
      "content_releases_v2",
    ].map((table) => [table, rowCount(db, table)]));

    const report = {
      database: dbPath,
      packId: preparedPack.pack.packId,
      expected: {
        sourceFamilies: preparedPack.documents.length,
        witnesses: expectedWitnessIds.length,
        uniqueWorks: expectedWorkIds.size,
      },
      observed: {
        witnesses: witnesses.filter((item) => !item.missing).length,
        uniqueWorks: expectedWorkIds.size - missingWorks.length,
        nodesForPackWitnesses: db.prepare(`
          SELECT COUNT(*) AS count FROM document_nodes
          WHERE witness_id IN (${expectedWitnessIds.map(() => "?").join(",")})
        `).get(...expectedWitnessIds).count,
        revisionsForPackWitnesses: db.prepare(`
          SELECT COUNT(*) AS count
          FROM text_revisions revision
          JOIN text_layers layer ON layer.id = revision.layer_id
          JOIN document_nodes node ON node.id = layer.node_id
          WHERE node.witness_id IN (${expectedWitnessIds.map(() => "?").join(",")})
        `).get(...expectedWitnessIds).count,
        attributionsForPackWitnesses: db.prepare(`
          SELECT COUNT(*) AS count
          FROM anchor_attributions attribution
          JOIN text_anchors anchor ON anchor.id = attribution.anchor_id
          JOIN text_revisions revision ON revision.id = anchor.text_revision_id
          JOIN text_layers layer ON layer.id = revision.layer_id
          JOIN document_nodes node ON node.id = layer.node_id
          WHERE node.witness_id IN (${expectedWitnessIds.map(() => "?").join(",")})
        `).get(...expectedWitnessIds).count,
      },
      witnesses,
      registry: registry ?? null,
      formalLayerCounts,
      foreignKeyFailures,
      failures,
      ok: failures.length === 0,
    };
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    db.close();
  }
}

await main();
