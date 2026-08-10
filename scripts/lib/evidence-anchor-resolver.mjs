import { createHash } from "node:crypto";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function anchorId(identifier) {
  const prefix = "urn:chronoatlas:anchor:";
  return identifier.startsWith(prefix) ? identifier.slice(prefix.length) : identifier;
}

function parseJson(value) {
  try {
    return JSON.parse(value ?? "{}");
  } catch {
    return {};
  }
}

export function resolveEvidenceAnchor(db, identifier) {
  const id = anchorId(identifier);
  const row = db.prepare(`
    SELECT
      anchor.id AS anchor_id,
      anchor.public_urn,
      anchor.start_cp,
      anchor.end_cp,
      anchor.exact_text,
      anchor.prefix_text,
      anchor.suffix_text,
      anchor.exact_sha256,
      anchor.selector_json,
      revision.id AS revision_id,
      revision.revision_no,
      revision.content_sha256,
      revision.created_at AS revision_created_at,
      revision.created_by,
      layer.id AS layer_id,
      layer.layer_kind,
      layer.language,
      layer.script,
      layer.normalization_profile,
      node.id AS node_id,
      node.parent_id,
      node.node_type,
      node.node_key,
      node.label AS node_label,
      node.locator_path,
      node.layer_role,
      witness.id AS witness_id,
      witness.edition_statement,
      witness.fidelity_status,
      witness.catalog_uri,
      work.id AS work_id,
      work.title AS work_title,
      work.work_kind,
      asset.id AS asset_id,
      asset.asset_kind,
      asset.origin_uri,
      asset.storage_uri,
      asset.media_type,
      asset.byte_length,
      asset.sha256 AS asset_sha256
    FROM text_anchors anchor
    JOIN text_revisions revision ON revision.id = anchor.text_revision_id
    JOIN text_layers layer ON layer.id = revision.layer_id
    JOIN document_nodes node ON node.id = layer.node_id
    JOIN source_witnesses witness ON witness.id = node.witness_id
    JOIN source_works work ON work.id = witness.work_id
    JOIN source_assets asset ON asset.id = revision.source_asset_id
    WHERE anchor.id = ? OR anchor.public_urn = ?
    LIMIT 1
  `).get(id, identifier);
  if (!row) return null;

  const rights = db.prepare(`
    SELECT
      rights.id, rights.status, rights.license_uri, rights.rights_holder,
      rights.jurisdiction, rights.allow_store, rights.allow_display,
      rights.allow_index, rights.allow_quote, rights.reviewed_at, rights.note
    FROM asset_rights link
    JOIN rights_statements rights ON rights.id = link.rights_id
    WHERE link.asset_id = ?
    ORDER BY rights.reviewed_at DESC, rights.id
  `).all(row.asset_id);
  const attributions = db.prepare(`
    SELECT
      attribution.id, attribution.attribution_type, attribution.attribution_text,
      attribution.certainty, work.id AS work_id, work.title AS work_title,
      work.availability_status
    FROM anchor_attributions attribution
    JOIN source_works work ON work.id = attribution.attributed_work_id
    WHERE attribution.anchor_id = ?
    ORDER BY attribution.id
  `).all(row.anchor_id);
  const hierarchy = db.prepare(`
    WITH RECURSIVE ancestors(id, parent_id, node_type, node_key, label, locator_path, depth) AS (
      SELECT id, parent_id, node_type, node_key, label, locator_path, 0
      FROM document_nodes WHERE id = ?
      UNION ALL
      SELECT parent.id, parent.parent_id, parent.node_type, parent.node_key,
             parent.label, parent.locator_path, ancestors.depth + 1
      FROM document_nodes parent
      JOIN ancestors ON ancestors.parent_id = parent.id
    )
    SELECT id, node_type, node_key, label, locator_path, depth
    FROM ancestors ORDER BY depth DESC
  `).all(row.node_id);
  const computedExactSha256 = sha256(Buffer.from(row.exact_text, "utf8"));

  return {
    id: row.anchor_id,
    urn: row.public_urn,
    selector: {
      startCodePoint: row.start_cp,
      endCodePoint: row.end_cp,
      exact: row.exact_text,
      prefix: row.prefix_text,
      suffix: row.suffix_text,
      exactSha256: row.exact_sha256,
      selectorMetadata: parseJson(row.selector_json),
      integrityValid: computedExactSha256 === row.exact_sha256,
    },
    revision: {
      id: row.revision_id,
      number: row.revision_no,
      contentSha256: row.content_sha256,
      createdAt: row.revision_created_at,
      createdBy: row.created_by,
    },
    layer: {
      id: row.layer_id,
      kind: row.layer_kind,
      language: row.language,
      script: row.script,
      normalizationProfile: row.normalization_profile,
    },
    node: {
      id: row.node_id,
      type: row.node_type,
      key: row.node_key,
      label: row.node_label,
      locatorPath: row.locator_path,
      layerRole: row.layer_role,
      hierarchy,
    },
    witness: {
      id: row.witness_id,
      editionStatement: row.edition_statement,
      fidelityStatus: row.fidelity_status,
      catalogUri: row.catalog_uri,
    },
    work: {
      id: row.work_id,
      title: row.work_title,
      kind: row.work_kind,
    },
    asset: {
      id: row.asset_id,
      kind: row.asset_kind,
      originUri: row.origin_uri,
      storageUri: row.storage_uri,
      mediaType: row.media_type,
      byteLength: row.byte_length,
      sha256: row.asset_sha256,
      rights,
    },
    attributions,
  };
}

export function resolveWitnessReadingOrder(db, witnessId) {
  const active = db.prepare(`
    SELECT active.run_id, run.manifest_sha256, run.adapter_key, run.adapter_version
    FROM witness_active_ingests active
    JOIN ingest_runs run ON run.id = active.run_id
    WHERE active.witness_id = ? AND run.status = 'committed'
  `).get(witnessId);
  if (!active) return null;
  const rows = db.prepare(`
    SELECT
      link.ordinal,
      link.role,
      node.id AS node_id,
      node.node_key,
      node.node_type,
      node.label,
      node.locator_path,
      node.layer_role,
      layer.layer_kind,
      revision.id AS revision_id,
      revision.revision_no,
      anchor.id AS anchor_id,
      anchor.public_urn,
      anchor.exact_text
    FROM ingest_run_text_revisions link
    JOIN document_nodes node ON node.id = link.node_id
    JOIN text_revisions revision ON revision.id = link.text_revision_id
    JOIN text_layers layer ON layer.id = revision.layer_id
    LEFT JOIN text_anchors anchor
      ON anchor.text_revision_id = revision.id
     AND anchor.start_cp = 0
     AND anchor.end_cp = length(revision.content)
    WHERE link.run_id = ?
    ORDER BY link.ordinal, node.ordinal, layer.layer_kind
  `).all(active.run_id);
  return {
    witnessId,
    activeRun: {
      id: active.run_id,
      manifestSha256: active.manifest_sha256,
      adapterKey: active.adapter_key,
      adapterVersion: active.adapter_version,
    },
    nodes: rows.map((row) => ({
      ordinal: row.ordinal,
      role: row.role,
      nodeId: row.node_id,
      nodeKey: row.node_key,
      nodeType: row.node_type,
      label: row.label,
      locatorPath: row.locator_path,
      layerRole: row.layer_role,
      layerKind: row.layer_kind,
      revisionId: row.revision_id,
      revisionNumber: row.revision_no,
      anchorId: row.anchor_id,
      anchorUrn: row.public_urn,
      exactText: row.exact_text,
    })),
  };
}
