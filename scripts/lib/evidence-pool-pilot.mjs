import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const uuidNamespace = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
const generatedFrom = "evidence-pool-phase1-pilot";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function uuidBytes(uuid) {
  return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

export function uuidV5(name, namespace = uuidNamespace) {
  const digest = createHash("sha1")
    .update(Buffer.concat([uuidBytes(namespace), Buffer.from(name, "utf8")]))
    .digest()
    .subarray(0, 16);
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function codePointLength(text) {
  return Array.from(text).length;
}

function storageUriForPath(absolutePath) {
  const relativePath = path.relative(repositoryRoot, absolutePath);
  const isRepositoryPath = relativePath.length > 0
    && relativePath !== ".."
    && !relativePath.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relativePath);
  if (isRepositoryPath) {
    return `repo:${relativePath.split(path.sep).join("/")}`;
  }
  return pathToFileURL(absolutePath).href;
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function validateAnnotatedDocument(document) {
  if (document?.format !== "chronoatlas-annotated-text/1") {
    throw new Error("Unsupported annotated text format");
  }
  requiredString(document.adapter?.key, "adapter.key");
  requiredString(document.adapter?.version, "adapter.version");
  requiredString(document.work?.id, "work.id");
  requiredString(document.witness?.id, "witness.id");
  if (document.witness.workId !== document.work.id) throw new Error("witness.workId must match work.id");
  if (!Array.isArray(document.nodes) || document.nodes.length === 0) throw new Error("nodes must not be empty");

  const workIds = new Set([document.work.id, ...(document.relatedWorks ?? []).map((work) => work.id)]);
  const nodeKeys = new Set();
  for (const node of document.nodes) {
    requiredString(node.nodeKey, "node.nodeKey");
    if (nodeKeys.has(node.nodeKey)) throw new Error(`Duplicate nodeKey: ${node.nodeKey}`);
    if (node.parentKey && !nodeKeys.has(node.parentKey)) {
      throw new Error(`Parent must precede child in reading order: ${node.nodeKey}`);
    }
    if (!Number.isInteger(node.ordinal) || node.ordinal < 0) throw new Error(`Invalid ordinal: ${node.nodeKey}`);
    for (const layer of node.layers ?? []) {
      requiredString(layer.kind, `${node.nodeKey}.layer.kind`);
      requiredString(layer.text, `${node.nodeKey}.layer.text`);
    }
    if (node.attribution && !workIds.has(node.attribution.workId)) {
      throw new Error(`Unknown attributed work for ${node.nodeKey}`);
    }
    nodeKeys.add(node.nodeKey);
  }
}

export async function prepareAnnotatedAsset(assetPath, { bytesOverride = null } = {}) {
  const absolutePath = path.resolve(assetPath);
  const bytes = bytesOverride ?? (await readFile(absolutePath));
  const document = JSON.parse(bytes.toString("utf8"));
  validateAnnotatedDocument(document);
  const assetSha256 = sha256(bytes);
  const parametersSha256 = sha256(canonicalJson(document.adapter.parameters ?? {}));
  const manifestPayload = {
    format: document.format,
    manifestVersion: document.manifestVersion,
    adapter: document.adapter,
    workId: document.work.id,
    witness: document.witness,
    assetSha256,
  };
  const manifestSha256 = sha256(canonicalJson(manifestPayload));
  const runId = uuidV5(
    `ingest:${manifestSha256}:${document.adapter.version}:${parametersSha256}`,
  );
  return {
    absolutePath,
    storageUri: storageUriForPath(absolutePath),
    bytes,
    document,
    assetSha256,
    parametersSha256,
    manifestSha256,
    runId,
    assetId: uuidV5(`asset:sha256:${assetSha256}`),
  };
}

function schemaReady(db) {
  const required = [
    "source_works",
    "source_witnesses",
    "source_assets",
    "ingest_runs",
    "document_nodes",
    "text_layers",
    "text_revisions",
    "text_anchors",
  ];
  const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
  return required.every((table) => Boolean(exists.get(table)));
}

function ensureSchema(db) {
  if (!schemaReady(db)) {
    throw new Error("Evidence-pool schema is missing; apply migration 031 to a shadow/check database first");
  }
}

function json(value) {
  return JSON.stringify(value ?? {});
}

function booleanInteger(value) {
  return value === true ? 1 : 0;
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

function insertWork(db, work, createdAt) {
  db.prepare(`
    INSERT OR IGNORE INTO source_works (
      id, title, work_kind, language, date_label, date_start, date_end,
      availability_status, evidence_domain, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    work.id,
    work.title,
    work.workKind,
    work.language,
    work.dateLabel ?? null,
    work.dateStart ?? null,
    work.dateEnd ?? null,
    work.availabilityStatus,
    work.evidenceDomain,
    json({ generatedFrom, manifestWork: work }),
    createdAt,
  );
  assertStableRow(db, "source_works", work.id, {
    title: work.title,
    work_kind: work.workKind,
    language: work.language,
  });
}

function insertWitness(db, witness, createdAt) {
  db.prepare(`
    INSERT OR IGNORE INTO source_witnesses (
      id, work_id, witness_type, edition_statement, publisher, publication_date,
      shelfmark, catalog_uri, fidelity_status, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    witness.id,
    witness.workId,
    witness.witnessType,
    witness.editionStatement,
    witness.publisher ?? null,
    witness.publicationDate ?? null,
    witness.shelfmark ?? null,
    witness.catalogUri ?? null,
    witness.fidelityStatus,
    json({ generatedFrom, note: witness.note ?? null }),
    createdAt,
  );
  assertStableRow(db, "source_witnesses", witness.id, {
    work_id: witness.workId,
    edition_statement: witness.editionStatement,
    fidelity_status: witness.fidelityStatus,
  });
}

function insertRights(db, rights, createdAt) {
  db.prepare(`
    INSERT OR IGNORE INTO rights_statements (
      id, status, license_uri, rights_holder, jurisdiction,
      allow_store, allow_display, allow_index, allow_quote,
      reviewed_at, note, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rights.id,
    rights.status,
    rights.licenseUri ?? null,
    rights.rightsHolder ?? null,
    rights.jurisdiction ?? null,
    booleanInteger(rights.allowStore),
    booleanInteger(rights.allowDisplay),
    booleanInteger(rights.allowIndex),
    booleanInteger(rights.allowQuote),
    rights.reviewedAt ?? null,
    rights.note ?? null,
    json({ generatedFrom }),
    createdAt,
  );
  assertStableRow(db, "rights_statements", rights.id, {
    status: rights.status,
    allow_store: booleanInteger(rights.allowStore),
    allow_display: booleanInteger(rights.allowDisplay),
  });
}

function planCounts(document) {
  const textNodes = document.nodes.filter((node) => (node.layers ?? []).length > 0);
  const layers = textNodes.reduce((sum, node) => sum + node.layers.length, 0);
  return {
    works: 1 + (document.relatedWorks?.length ?? 0),
    witnesses: 1,
    assets: 1,
    nodes: document.nodes.length,
    textLayers: layers,
    fullNodeAnchors: layers,
    attributions: document.nodes.filter((node) => node.attribution).length,
  };
}

export function annotatedAssetPlan(prepared) {
  return {
    mode: "plan",
    runId: prepared.runId,
    assetId: prepared.assetId,
    manifestSha256: prepared.manifestSha256,
    assetSha256: prepared.assetSha256,
    adapter: prepared.document.adapter,
    witnessId: prepared.document.witness.id,
    intended: planCounts(prepared.document),
    existingRun: null,
    wouldReuseCommittedRun: false,
  };
}

export function inspectAnnotatedAssetPlan(db, prepared) {
  ensureSchema(db);
  const existingRun = db.prepare(`
    SELECT id, status
    FROM ingest_runs
    WHERE manifest_sha256 = ? AND adapter_version = ? AND parameters_sha256 = ?
  `).get(
    prepared.manifestSha256,
    prepared.document.adapter.version,
    prepared.parametersSha256,
  );
  return {
    ...annotatedAssetPlan(prepared),
    existingRun: existingRun ?? null,
    wouldReuseCommittedRun: existingRun?.status === "committed",
  };
}

export function ingestAnnotatedAsset(db, prepared, { createdBy = "chronoatlas-phase1-pilot" } = {}) {
  ensureSchema(db);
  const document = prepared.document;
  const createdAt = new Date().toISOString();
  const existingRun = db.prepare(`
    SELECT id, status
    FROM ingest_runs
    WHERE manifest_sha256 = ? AND adapter_version = ? AND parameters_sha256 = ?
  `).get(prepared.manifestSha256, document.adapter.version, prepared.parametersSha256);
  if (existingRun?.status === "committed") {
    return {
      mode: "apply",
      runId: existingRun.id,
      reusedCommittedRun: true,
      additions: { assets: 0, revisions: 0, anchors: 0, nodes: 0 },
    };
  }
  if (existingRun) throw new Error(`Existing ingest run is not committed: ${existingRun.id} (${existingRun.status})`);

  const additions = { assets: 0, revisions: 0, anchors: 0, nodes: 0 };
  db.exec("BEGIN IMMEDIATE");
  try {
    insertWork(db, document.work, createdAt);
    for (const work of document.relatedWorks ?? []) insertWork(db, work, createdAt);

    const insertWorkRelation = db.prepare(`
      INSERT OR IGNORE INTO source_work_relations (
        id, from_work_id, to_work_id, relation_type, certainty, note, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const relation of document.workRelations ?? []) {
      const id = uuidV5(`work-relation:${relation.fromWorkId}:${relation.toWorkId}:${relation.relationType}`);
      insertWorkRelation.run(
        id,
        relation.fromWorkId,
        relation.toWorkId,
        relation.relationType,
        relation.certainty ?? "medium",
        relation.note ?? null,
        json({ generatedFrom }),
      );
    }

    insertWitness(db, document.witness, createdAt);
    insertRights(db, document.rights, createdAt);

    const assetInsert = db.prepare(`
      INSERT OR IGNORE INTO source_assets (
        id, witness_id, asset_kind, origin_uri, retrieved_at, media_type,
        byte_length, sha256, storage_uri, http_metadata_json, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      prepared.assetId,
      document.witness.id,
      document.asset.assetKind,
      document.asset.originUri ?? null,
      document.asset.retrievedAt ?? null,
      document.asset.mediaType,
      prepared.bytes.length,
      prepared.assetSha256,
      prepared.storageUri,
      json({}),
      json({ generatedFrom, note: document.asset.note ?? null }),
      createdAt,
    );
    additions.assets += assetInsert.changes;
    assertStableRow(db, "source_assets", prepared.assetId, {
      witness_id: document.witness.id,
      byte_length: prepared.bytes.length,
      sha256: prepared.assetSha256,
    });

    db.prepare(`
      INSERT OR IGNORE INTO asset_rights (id, asset_id, rights_id, raw_json)
      VALUES (?, ?, ?, ?)
    `).run(
      uuidV5(`asset-rights:${prepared.assetId}:${document.rights.id}`),
      prepared.assetId,
      document.rights.id,
      json({ generatedFrom }),
    );

    const previousActive = db.prepare(`
      SELECT run_id FROM witness_active_ingests WHERE witness_id = ?
    `).get(document.witness.id);
    db.prepare(`
      INSERT INTO ingest_runs (
        id, witness_id, manifest_sha256, adapter_key, adapter_version,
        parameters_sha256, status, started_at, supersedes_run_id, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, 'running', ?, ?, ?)
    `).run(
      prepared.runId,
      document.witness.id,
      prepared.manifestSha256,
      document.adapter.key,
      document.adapter.version,
      prepared.parametersSha256,
      createdAt,
      previousActive?.run_id ?? null,
      json({ generatedFrom, manifestVersion: document.manifestVersion }),
    );
    db.prepare(`
      INSERT INTO ingest_run_assets (id, run_id, asset_id, role, ordinal, raw_json)
      VALUES (?, ?, ?, 'primary_text_sample', 0, ?)
    `).run(
      uuidV5(`run-asset:${prepared.runId}:${prepared.assetId}`),
      prepared.runId,
      prepared.assetId,
      json({ generatedFrom }),
    );

    const insertNode = db.prepare(`
      INSERT OR IGNORE INTO document_nodes (
        id, witness_id, parent_id, node_type, node_key, ordinal, label,
        locator_path, layer_role, adapter_metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertLayer = db.prepare(`
      INSERT OR IGNORE INTO text_layers (
        id, node_id, layer_kind, language, script, base_layer_id,
        normalization_profile, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)
    `);
    const nodeIds = new Map();
    let readingOrdinal = 0;

    for (const node of document.nodes) {
      const nodeId = uuidV5(`node:${document.witness.id}:${node.nodeKey}`);
      const parentId = node.parentKey ? nodeIds.get(node.parentKey) : null;
      const result = insertNode.run(
        nodeId,
        document.witness.id,
        parentId,
        node.nodeType,
        node.nodeKey,
        node.ordinal,
        node.label,
        node.locatorPath,
        node.layerRole,
        json({ generatedFrom, readingOrdinal }),
        createdAt,
      );
      additions.nodes += result.changes;
      assertStableRow(db, "document_nodes", nodeId, {
        witness_id: document.witness.id,
        parent_id: parentId,
        node_key: node.nodeKey,
        layer_role: node.layerRole,
      });
      nodeIds.set(node.nodeKey, nodeId);

      for (const layer of node.layers ?? []) {
        const language = layer.language ?? document.work.language;
        const script = layer.script ?? "Zyyy";
        const normalizationProfile = layer.normalizationProfile ?? "";
        const layerId = uuidV5(
          `layer:${nodeId}:${layer.kind}:${language}:${script}:${normalizationProfile}`,
        );
        insertLayer.run(
          layerId,
          nodeId,
          layer.kind,
          language,
          script,
          normalizationProfile,
          json({ generatedFrom }),
          createdAt,
        );
        assertStableRow(db, "text_layers", layerId, {
          node_id: nodeId,
          layer_kind: layer.kind,
          language,
          script,
          normalization_profile: normalizationProfile,
        });

        const contentSha256 = sha256(Buffer.from(layer.text, "utf8"));
        let revision = db.prepare(`
          SELECT id, revision_no FROM text_revisions
          WHERE layer_id = ? AND content_sha256 = ?
        `).get(layerId, contentSha256);
        if (!revision) {
          const previous = db.prepare(`
            SELECT id, revision_no FROM text_revisions
            WHERE layer_id = ? ORDER BY revision_no DESC LIMIT 1
          `).get(layerId);
          revision = {
            id: uuidV5(`revision:${layerId}:${contentSha256}`),
            revision_no: (previous?.revision_no ?? 0) + 1,
          };
          db.prepare(`
            INSERT INTO text_revisions (
              id, layer_id, revision_no, content, content_sha256,
              derived_from_revision_id, source_asset_id, created_at, created_by, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            revision.id,
            layerId,
            revision.revision_no,
            layer.text,
            contentSha256,
            previous?.id ?? null,
            prepared.assetId,
            createdAt,
            createdBy,
            json({ generatedFrom }),
          );
          additions.revisions += 1;
        }

        const exactSha256 = contentSha256;
        const endCp = codePointLength(layer.text);
        const anchorId = uuidV5(`anchor:${revision.id}:0:${endCp}:${exactSha256}`);
        const anchorInsert = db.prepare(`
          INSERT OR IGNORE INTO text_anchors (
            id, text_revision_id, start_cp, end_cp, exact_text, prefix_text,
            suffix_text, exact_sha256, public_urn, selector_json, created_at
          ) VALUES (?, ?, 0, ?, ?, '', '', ?, ?, ?, ?)
        `).run(
          anchorId,
          revision.id,
          endCp,
          layer.text,
          exactSha256,
          `urn:chronoatlas:anchor:${anchorId}`,
          json({ type: "TextPositionSelector", start: 0, end: endCp, unit: "unicode-code-point" }),
          createdAt,
        );
        additions.anchors += anchorInsert.changes;

        if (node.attribution) {
          db.prepare(`
            INSERT OR IGNORE INTO anchor_attributions (
              id, anchor_id, attributed_work_id, attribution_type,
              attribution_text, certainty, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidV5(
              `attribution:${anchorId}:${node.attribution.workId}:${node.attribution.type}`,
            ),
            anchorId,
            node.attribution.workId,
            node.attribution.type,
            node.attribution.text ?? null,
            node.attribution.certainty ?? "high",
            json({ generatedFrom }),
          );
        }

        db.prepare(`
          INSERT INTO ingest_run_text_revisions (
            id, run_id, node_id, text_revision_id, role, ordinal, raw_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidV5(`run-revision:${prepared.runId}:${nodeId}:${revision.id}`),
          prepared.runId,
          nodeId,
          revision.id,
          node.layerRole,
          readingOrdinal,
          json({ generatedFrom }),
        );
      }
      readingOrdinal += 1;
    }

    const completedAt = new Date().toISOString();
    db.prepare(`
      UPDATE ingest_runs SET status = 'committed', completed_at = ? WHERE id = ?
    `).run(completedAt, prepared.runId);
    db.prepare(`
      INSERT INTO witness_active_ingests (witness_id, run_id, activated_at, raw_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(witness_id) DO UPDATE SET
        run_id = excluded.run_id,
        activated_at = excluded.activated_at,
        raw_json = excluded.raw_json
    `).run(
      document.witness.id,
      prepared.runId,
      completedAt,
      json({ generatedFrom }),
    );
    db.exec("COMMIT");
    return {
      mode: "apply",
      runId: prepared.runId,
      assetId: prepared.assetId,
      reusedCommittedRun: false,
      additions,
    };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function evidencePoolCounts(db) {
  const tables = [
    "source_works",
    "source_witnesses",
    "source_assets",
    "rights_statements",
    "ingest_runs",
    "document_nodes",
    "text_layers",
    "text_revisions",
    "text_anchors",
    "anchor_attributions",
  ];
  return Object.fromEntries(
    tables.map((table) => [table, db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]),
  );
}
