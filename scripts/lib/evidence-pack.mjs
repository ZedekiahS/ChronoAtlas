import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ingestAnnotatedAsset,
  inspectAnnotatedAssetPlan,
  prepareAnnotatedAsset,
  uuidV5,
} from "./evidence-pool-pilot.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

export async function prepareEvidencePack(packPath) {
  const absolutePath = path.resolve(packPath);
  const bytes = await readFile(absolutePath);
  const pack = JSON.parse(bytes.toString("utf8"));
  if (pack?.format !== "chronoatlas-evidence-pack/1") throw new Error("Unsupported evidence-pack format");
  requiredString(pack.packId, "packId");
  requiredString(pack.packVersion, "packVersion");
  requiredString(pack.label, "label");
  requiredString(pack.scope, "scope");
  if (!Array.isArray(pack.documents) || pack.documents.length === 0) {
    throw new Error("evidence pack must contain documents");
  }
  const seenFamilies = new Set();
  const seenAssetPaths = new Set();
  const seenWitnesses = new Set();
  const documents = [];
  for (const [index, item] of pack.documents.entries()) {
    requiredString(item.assetPath, `documents[${index}].assetPath`);
    requiredString(item.sourceFamily, `documents[${index}].sourceFamily`);
    if (seenFamilies.has(item.sourceFamily)) throw new Error(`Duplicate source family: ${item.sourceFamily}`);
    if (seenAssetPaths.has(item.assetPath)) throw new Error(`Duplicate evidence-pack asset path: ${item.assetPath}`);
    seenFamilies.add(item.sourceFamily);
    seenAssetPaths.add(item.assetPath);
    const assetPath = path.resolve(path.dirname(absolutePath), item.assetPath);
    const prepared = await prepareAnnotatedAsset(assetPath);
    if (seenWitnesses.has(prepared.document.witness.id)) {
      throw new Error(`Duplicate evidence-pack witness: ${prepared.document.witness.id}`);
    }
    seenWitnesses.add(prepared.document.witness.id);
    documents.push({
      definition: item,
      prepared,
    });
  }
  const minimum = pack.gates?.minimumRequiredSourceFamilies ?? 0;
  const requiredFamilies = documents.filter((item) => item.definition.required).length;
  if (requiredFamilies < minimum) {
    throw new Error(`Evidence pack has ${requiredFamilies} required families; minimum is ${minimum}`);
  }
  if (pack.gates?.automaticAssertionAcceptance !== false
      || pack.gates?.automaticClaimAcceptance !== false
      || pack.gates?.automaticEventGeneration !== false) {
    throw new Error("Phase 2 evidence pack must explicitly disable automatic acceptance and event generation");
  }
  return {
    absolutePath,
    manifestSha256: sha256(bytes),
    pack,
    documents,
  };
}

export function evidencePackPlan(preparedPack, db = null) {
  const documents = preparedPack.documents.map(({ definition, prepared }) => {
    const plan = db ? inspectAnnotatedAssetPlan(db, prepared) : {
      runId: prepared.runId,
      assetId: prepared.assetId,
      manifestSha256: prepared.manifestSha256,
      wouldReuseCommittedRun: false,
    };
    return {
      sourceFamily: definition.sourceFamily,
      required: Boolean(definition.required),
      workId: prepared.document.work.id,
      workTitle: prepared.document.work.title,
      witnessId: prepared.document.witness.id,
      ...plan,
    };
  });
  return {
    mode: "plan",
    packId: preparedPack.pack.packId,
    manifestSha256: preparedPack.manifestSha256,
    sourceFamilyCount: documents.length,
    allRequiredDocumentsCommitted: documents
      .filter((item) => item.required)
      .every((item) => item.wouldReuseCommittedRun),
    gates: preparedPack.pack.gates,
    documents,
  };
}

export function ingestEvidencePack(db, preparedPack) {
  const results = [];
  for (const { definition, prepared } of preparedPack.documents) {
    results.push({
      sourceFamily: definition.sourceFamily,
      workTitle: prepared.document.work.title,
      witnessId: prepared.document.witness.id,
      result: ingestAnnotatedAsset(db, prepared, { createdBy: `evidence-pack:${preparedPack.pack.packId}` }),
    });
  }
  const plan = evidencePackPlan(preparedPack, db);
  if (!plan.allRequiredDocumentsCommitted) {
    throw new Error("Evidence pack ingest finished without all required documents committed");
  }
  return {
    mode: "apply",
    packId: preparedPack.pack.packId,
    manifestSha256: preparedPack.manifestSha256,
    allRequiredDocumentsCommitted: true,
    results,
  };
}

function evidencePackRegistryReady(db) {
  const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
  return [
    "evidence_packs",
    "evidence_pack_revisions",
    "evidence_pack_documents",
    "evidence_pack_active_revisions",
  ].every((table) => Boolean(exists.get(table)));
}

function assertStableRow(db, table, id, expected) {
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!row) throw new Error(`Expected ${table} row was not created: ${id}`);
  for (const [key, value] of Object.entries(expected)) {
    if ((row[key] ?? null) !== (value ?? null)) {
      throw new Error(`${table}.${key} conflicts for ${id}`);
    }
  }
}

export function registerEvidencePack(db, preparedPack) {
  if (!evidencePackRegistryReady(db)) {
    throw new Error("Evidence-pack registry is missing; apply migration 034 first");
  }
  const definition = preparedPack.pack;
  const packCreatedAt = definition.createdAt ?? new Date().toISOString();
  const revisionCreatedAt = definition.revisionCreatedAt ?? packCreatedAt;
  const packId = uuidV5(`evidence-pack:${definition.packId}`);
  const revisionId = uuidV5(`evidence-pack-revision:${definition.packId}:${preparedPack.manifestSha256}`);
  const additions = { packs: 0, revisions: 0, documents: 0 };

  db.exec("BEGIN IMMEDIATE");
  try {
    const existingPack = db.prepare("SELECT id FROM evidence_packs WHERE pack_key = ?").get(definition.packId);
    if (existingPack && existingPack.id !== packId) {
      throw new Error(`evidence pack key conflicts with a different stable id: ${definition.packId}`);
    }
    db.prepare(`
      INSERT INTO evidence_packs (
        id, pack_key, label, scope, created_at, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        label = excluded.label,
        scope = excluded.scope,
        raw_json = excluded.raw_json
    `).run(
      packId,
      definition.packId,
      definition.label,
      definition.scope,
      packCreatedAt,
      JSON.stringify({ format: definition.format }),
    );
    additions.packs += existingPack ? 0 : 1;
    assertStableRow(db, "evidence_packs", packId, {
      pack_key: definition.packId,
      label: definition.label,
      scope: definition.scope,
    });

    additions.revisions += db.prepare(`
      INSERT OR IGNORE INTO evidence_pack_revisions (
        id, pack_id, pack_version, manifest_sha256, created_at,
        gates_json, notes_json, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      revisionId,
      packId,
      definition.packVersion,
      preparedPack.manifestSha256,
      revisionCreatedAt,
      JSON.stringify(definition.gates ?? {}),
      JSON.stringify(definition.notes ?? []),
      JSON.stringify({ format: definition.format }),
    ).changes;
    assertStableRow(db, "evidence_pack_revisions", revisionId, {
      pack_id: packId,
      pack_version: definition.packVersion,
      manifest_sha256: preparedPack.manifestSha256,
    });

    const insertDocument = db.prepare(`
      INSERT OR IGNORE INTO evidence_pack_documents (
        id, revision_id, witness_id, source_family, is_required,
        ordinal, coverage_roles_json, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const [ordinal, { definition: document, prepared }] of preparedPack.documents.entries()) {
      const id = uuidV5(`evidence-pack-document:${revisionId}:${prepared.document.witness.id}`);
      additions.documents += insertDocument.run(
        id,
        revisionId,
        prepared.document.witness.id,
        document.sourceFamily,
        document.required ? 1 : 0,
        ordinal,
        JSON.stringify(document.coverageRoles ?? []),
        JSON.stringify({ assetPath: document.assetPath }),
      ).changes;
      assertStableRow(db, "evidence_pack_documents", id, {
        revision_id: revisionId,
        witness_id: prepared.document.witness.id,
        source_family: document.sourceFamily,
        is_required: document.required ? 1 : 0,
        ordinal,
      });
    }

    db.prepare(`
      INSERT INTO evidence_pack_active_revisions (pack_id, revision_id, activated_at, raw_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(pack_id) DO UPDATE SET
        revision_id = excluded.revision_id,
        activated_at = excluded.activated_at,
        raw_json = excluded.raw_json
    `).run(packId, revisionId, revisionCreatedAt, JSON.stringify({ packKey: definition.packId }));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return { packId, revisionId, additions };
}
