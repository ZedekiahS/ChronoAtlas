import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { uuidV5 } from "./evidence-pool-pilot.mjs";

const generatedFrom = "evidence-assertion-workflow-v1";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function json(value) {
  return JSON.stringify(value ?? {});
}

function ensureSchema(db) {
  const required = [
    "extraction_runs",
    "assertion_candidates",
    "assertion_candidate_anchors",
    "review_decisions",
    "source_assertions",
    "claims",
    "transmission_groups",
  ];
  const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
  for (const table of required) {
    if (!exists.get(table)) throw new Error(`Assertion workflow schema is missing table: ${table}`);
  }
}

function validateCandidate(candidate, index) {
  for (const field of ["candidateKey", "sourceFamily", "witnessId", "nodeKey", "narratingWorkId", "assertionMode", "predicateKey", "proposedStatement", "polarity", "modality"]) {
    requiredString(candidate[field], `candidates[${index}].${field}`);
  }
}

export async function prepareAssertionCandidateSet(candidateSetPath) {
  const absolutePath = path.resolve(candidateSetPath);
  const bytes = await readFile(absolutePath);
  const definition = JSON.parse(bytes.toString("utf8"));
  if (definition?.format !== "chronoatlas-assertion-candidate-set/1") {
    throw new Error("Unsupported assertion-candidate-set format");
  }
  requiredString(definition.packId, "packId");
  requiredString(definition.extractor?.key, "extractor.key");
  requiredString(definition.extractor?.version, "extractor.version");
  if (!Array.isArray(definition.candidates) || definition.candidates.length === 0) {
    throw new Error("candidate set must contain candidates");
  }
  const keys = new Set();
  for (const [index, candidate] of definition.candidates.entries()) {
    validateCandidate(candidate, index);
    if (keys.has(candidate.candidateKey)) throw new Error(`Duplicate candidateKey: ${candidate.candidateKey}`);
    keys.add(candidate.candidateKey);
  }
  const candidateSetSha256 = sha256(bytes);
  const promptOrRulesSha256 = sha256(canonicalJson(definition.extractor.rules ?? []));
  const parametersSha256 = sha256(canonicalJson({
    ...(definition.extractor.parameters ?? {}),
    candidateSetSha256,
  }));
  return {
    absolutePath,
    definition,
    candidateSetSha256,
    promptOrRulesSha256,
    parametersSha256,
  };
}

function resolveActiveAnchor(db, candidate) {
  const rows = db.prepare(`
    SELECT active.run_id AS ingest_run_id,
           anchor.id AS anchor_id,
           anchor.public_urn,
           anchor.exact_text,
           node.locator_path,
           layer.layer_kind,
           host_work.id AS host_work_id,
           host_work.title AS host_work_title,
           witness.edition_statement
    FROM witness_active_ingests active
    JOIN source_witnesses witness ON witness.id = active.witness_id
    JOIN source_works host_work ON host_work.id = witness.work_id
    JOIN document_nodes node ON node.witness_id = active.witness_id
    JOIN ingest_run_text_revisions run_revision
      ON run_revision.run_id = active.run_id AND run_revision.node_id = node.id
    JOIN text_revisions revision ON revision.id = run_revision.text_revision_id
    JOIN text_layers layer ON layer.id = revision.layer_id
    JOIN text_anchors anchor ON anchor.text_revision_id = revision.id
    WHERE active.witness_id = ? AND node.node_key = ?
    ORDER BY layer.layer_kind, anchor.start_cp
  `).all(candidate.witnessId, candidate.nodeKey);
  const filtered = candidate.layerKind
    ? rows.filter((row) => row.layer_kind === candidate.layerKind)
    : rows;
  if (filtered.length !== 1) {
    throw new Error(`Expected exactly one active anchor for ${candidate.witnessId}/${candidate.nodeKey}; found ${filtered.length}`);
  }
  const narratingWork = db.prepare("SELECT id, title FROM source_works WHERE id = ?").get(candidate.narratingWorkId);
  if (!narratingWork) throw new Error(`Narrating work is not registered: ${candidate.narratingWorkId}`);
  return { ...filtered[0], narrating_work_title: narratingWork.title };
}

function candidatePayload(candidate) {
  return {
    narratingWorkId: candidate.narratingWorkId,
    assertionMode: candidate.assertionMode,
    predicateKey: candidate.predicateKey,
    proposedStatement: candidate.proposedStatement,
    polarity: candidate.polarity,
    modality: candidate.modality,
  };
}

function materializePlan(db, prepared) {
  ensureSchema(db);
  const groups = new Map();
  const items = [];
  for (const candidate of prepared.definition.candidates) {
    const anchor = resolveActiveAnchor(db, candidate);
    const extractionRunId = uuidV5(
      `extraction:${anchor.ingest_run_id}:${prepared.definition.extractor.key}:${prepared.definition.extractor.version}:${prepared.promptOrRulesSha256}:${prepared.parametersSha256}`,
    );
    const payloadSha256 = sha256(canonicalJson(candidatePayload(candidate)));
    const candidateId = uuidV5(`assertion-candidate:${extractionRunId}:${candidate.candidateKey}:${payloadSha256}`);
    const item = { candidate, anchor, extractionRunId, payloadSha256, candidateId };
    items.push(item);
    if (!groups.has(extractionRunId)) {
      groups.set(extractionRunId, { extractionRunId, ingestRunId: anchor.ingest_run_id, items: [] });
    }
    groups.get(extractionRunId).items.push(item);
  }
  return { items, groups: [...groups.values()] };
}

export function assertionCandidatePlan(db, prepared) {
  const materialized = materializePlan(db, prepared);
  const existingRun = db.prepare("SELECT status FROM extraction_runs WHERE id = ?");
  const existingCandidate = db.prepare("SELECT status FROM assertion_candidates WHERE id = ?");
  const bySourceFamily = {};
  for (const item of materialized.items) {
    bySourceFamily[item.candidate.sourceFamily] = (bySourceFamily[item.candidate.sourceFamily] ?? 0) + 1;
  }
  return {
    mode: "plan",
    packId: prepared.definition.packId,
    candidateSetSha256: prepared.candidateSetSha256,
    intendedCandidates: materialized.items.length,
    sourceFamilies: Object.keys(bySourceFamily).length,
    bySourceFamily,
    extractionRuns: materialized.groups.map((group) => ({
      id: group.extractionRunId,
      ingestRunId: group.ingestRunId,
      intendedCandidates: group.items.length,
      existingStatus: existingRun.get(group.extractionRunId)?.status ?? null,
    })),
    existingCandidates: materialized.items.filter((item) => existingCandidate.get(item.candidateId)).length,
    automaticAcceptance: false,
    createsAssertions: false,
    createsClaims: false,
    createsEvents: false,
  };
}

export function extractAssertionCandidates(db, prepared) {
  const materialized = materializePlan(db, prepared);
  const createdAt = new Date().toISOString();
  const additions = { extractionRuns: 0, candidates: 0, anchorLinks: 0 };
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const group of materialized.groups) {
      const existing = db.prepare("SELECT status FROM extraction_runs WHERE id = ?").get(group.extractionRunId);
      if (!existing) {
        db.prepare(`
          INSERT INTO extraction_runs (
            id, ingest_run_id, extractor_key, extractor_version, model_id,
            prompt_or_rules_sha256, parameters_sha256, status, started_at, raw_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'running', ?, ?)
        `).run(
          group.extractionRunId,
          group.ingestRunId,
          prepared.definition.extractor.key,
          prepared.definition.extractor.version,
          prepared.definition.extractor.modelId ?? null,
          prepared.promptOrRulesSha256,
          prepared.parametersSha256,
          createdAt,
          json({ generatedFrom, packId: prepared.definition.packId, candidateSetSha256: prepared.candidateSetSha256 }),
        );
        additions.extractionRuns += 1;
      } else if (existing.status !== "committed") {
        throw new Error(`Extraction run is not committed: ${group.extractionRunId} (${existing.status})`);
      }

      for (const item of group.items) {
        const result = db.prepare(`
          INSERT OR IGNORE INTO assertion_candidates (
            id, extraction_run_id, narrating_work_id, assertion_mode, predicate_key,
            proposed_statement, polarity, modality, payload_sha256, status, raw_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
        `).run(
          item.candidateId,
          group.extractionRunId,
          item.candidate.narratingWorkId,
          item.candidate.assertionMode,
          item.candidate.predicateKey,
          item.candidate.proposedStatement,
          item.candidate.polarity,
          item.candidate.modality,
          item.payloadSha256,
          json({
            generatedFrom,
            packId: prepared.definition.packId,
            candidateSetSha256: prepared.candidateSetSha256,
            candidateKey: item.candidate.candidateKey,
            sourceFamily: item.candidate.sourceFamily,
          }),
          createdAt,
        );
        additions.candidates += result.changes;
        const stored = db.prepare(`
          SELECT extraction_run_id, narrating_work_id, predicate_key, proposed_statement, status
          FROM assertion_candidates WHERE id = ?
        `).get(item.candidateId);
        if (!stored
            || stored.extraction_run_id !== group.extractionRunId
            || stored.narrating_work_id !== item.candidate.narratingWorkId
            || stored.predicate_key !== item.candidate.predicateKey
            || stored.proposed_statement !== item.candidate.proposedStatement) {
          throw new Error(`Candidate identity conflict: ${item.candidate.candidateKey}`);
        }
        const anchorLink = db.prepare(`
          INSERT OR IGNORE INTO assertion_candidate_anchors (
            id, candidate_id, anchor_id, role, ordinal, raw_json
          ) VALUES (?, ?, ?, 'primary', 0, ?)
        `).run(
          uuidV5(`assertion-candidate-anchor:${item.candidateId}:${item.anchor.anchor_id}:primary`),
          item.candidateId,
          item.anchor.anchor_id,
          json({ generatedFrom }),
        );
        additions.anchorLinks += anchorLink.changes;
      }

      if (!existing) {
        db.prepare("UPDATE extraction_runs SET status = 'committed', completed_at = ? WHERE id = ?")
          .run(new Date().toISOString(), group.extractionRunId);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return {
    mode: "apply",
    packId: prepared.definition.packId,
    candidateSetSha256: prepared.candidateSetSha256,
    intendedCandidates: materialized.items.length,
    additions,
    acceptedAssertionsCreated: 0,
    acceptedClaimsCreated: 0,
    eventsCreated: 0,
  };
}

export function resolveAssertionReviewQueue(db, { status = "pending_review", packId = null, limit = 200 } = {}) {
  ensureSchema(db);
  const rows = db.prepare(`
    SELECT candidate.id, candidate.predicate_key, candidate.proposed_statement,
           candidate.polarity, candidate.modality, candidate.assertion_mode, candidate.status,
           json_extract(candidate.raw_json, '$.candidateKey') AS candidate_key,
           json_extract(candidate.raw_json, '$.sourceFamily') AS source_family,
           json_extract(candidate.raw_json, '$.packId') AS pack_id,
           work.id AS narrating_work_id, work.title AS narrating_work_title,
           anchor.id AS anchor_id, anchor.public_urn, anchor.exact_text,
           node.locator_path, witness.edition_statement,
           rights.allow_display, rights.allow_index
    FROM assertion_candidates candidate
    JOIN source_works work ON work.id = candidate.narrating_work_id
    JOIN assertion_candidate_anchors link ON link.candidate_id = candidate.id AND link.role = 'primary'
    JOIN text_anchors anchor ON anchor.id = link.anchor_id
    JOIN text_revisions revision ON revision.id = anchor.text_revision_id
    JOIN text_layers layer ON layer.id = revision.layer_id
    JOIN document_nodes node ON node.id = layer.node_id
    JOIN source_witnesses witness ON witness.id = node.witness_id
    JOIN source_assets asset ON asset.id = revision.source_asset_id
    LEFT JOIN asset_rights asset_right ON asset_right.asset_id = asset.id
    LEFT JOIN rights_statements rights ON rights.id = asset_right.rights_id
    WHERE candidate.status = ?
      AND (? IS NULL OR json_extract(candidate.raw_json, '$.packId') = ?)
    ORDER BY source_family, node.locator_path, candidate_key
    LIMIT ?
  `).all(status, packId, packId, Math.max(1, Math.min(Number(limit) || 200, 1000)));
  return {
    status,
    packId,
    count: rows.length,
    candidates: rows.map((row) => ({
      id: row.id,
      candidateKey: row.candidate_key,
      sourceFamily: row.source_family,
      predicateKey: row.predicate_key,
      proposedStatement: row.proposed_statement,
      polarity: row.polarity,
      modality: row.modality,
      assertionMode: row.assertion_mode,
      status: row.status,
      narratingWork: { id: row.narrating_work_id, title: row.narrating_work_title },
      anchor: {
        id: row.anchor_id,
        urn: row.public_urn,
        exact: row.exact_text,
        locator: row.locator_path,
        editionStatement: row.edition_statement,
      },
      rights: { allowDisplay: row.allow_display ?? 0, allowIndex: row.allow_index ?? 0 },
    })),
  };
}

export function assertionWorkflowCounts(db) {
  ensureSchema(db);
  const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  return {
    extractionRuns: count("extraction_runs"),
    assertionCandidates: count("assertion_candidates"),
    reviewDecisions: count("review_decisions"),
    sourceAssertions: count("source_assertions"),
    transmissionGroups: count("transmission_groups"),
    claimCandidates: count("claim_candidates"),
    claims: count("claims"),
  };
}

export function resolveEvidencePackCoverage(db, packId) {
  ensureSchema(db);
  const rows = db.prepare(`
    SELECT json_extract(candidate.raw_json, '$.sourceFamily') AS source_family,
           work.id AS work_id, work.title AS work_title,
           witness.id AS witness_id, witness.edition_statement,
           COUNT(DISTINCT candidate.id) AS candidate_count,
           COUNT(DISTINCT assertion.id) AS accepted_assertion_count,
           COUNT(DISTINCT anchor.id) AS exact_anchor_count
    FROM assertion_candidates candidate
    JOIN source_works work ON work.id = candidate.narrating_work_id
    JOIN assertion_candidate_anchors candidate_anchor ON candidate_anchor.candidate_id = candidate.id
    JOIN text_anchors anchor ON anchor.id = candidate_anchor.anchor_id
    JOIN text_revisions revision ON revision.id = anchor.text_revision_id
    JOIN text_layers layer ON layer.id = revision.layer_id
    JOIN document_nodes node ON node.id = layer.node_id
    JOIN source_witnesses witness ON witness.id = node.witness_id
    LEFT JOIN source_assertions assertion ON assertion.accepted_from_candidate_id = candidate.id
    WHERE json_extract(candidate.raw_json, '$.packId') = ?
    GROUP BY source_family, work.id, work.title, witness.id, witness.edition_statement
    ORDER BY source_family, work.title
  `).all(packId);
  return {
    packId,
    sourceFamilyCount: new Set(rows.map((row) => row.source_family)).size,
    narratingWorkCount: new Set(rows.map((row) => row.work_id)).size,
    witnessCount: new Set(rows.map((row) => row.witness_id)).size,
    candidateCount: rows.reduce((sum, row) => sum + row.candidate_count, 0),
    acceptedAssertionCount: rows.reduce((sum, row) => sum + row.accepted_assertion_count, 0),
    rows: rows.map((row) => ({
      sourceFamily: row.source_family,
      narratingWork: { id: row.work_id, title: row.work_title },
      witness: { id: row.witness_id, editionStatement: row.edition_statement },
      candidateCount: row.candidate_count,
      acceptedAssertionCount: row.accepted_assertion_count,
      exactAnchorCount: row.exact_anchor_count,
    })),
  };
}

export function resolveClaimEvidenceGraph(db, claimId) {
  ensureSchema(db);
  const claim = db.prepare(`
    SELECT id, claim_domain, claim_type, predicate_key, statement, polarity, modality, status
    FROM claims WHERE id = ?
  `).get(claimId);
  if (!claim) return null;
  const evidence = db.prepare(`
    SELECT link.stance, link.directness, link.assessment_status, link.assessment_note,
           transmission.id AS transmission_group_id, transmission.label AS transmission_group_label,
           assertion.id AS assertion_id, assertion.statement AS assertion_statement,
           assertion.predicate_key AS assertion_predicate_key,
           work.id AS work_id, work.title AS work_title,
           anchor.id AS anchor_id, anchor.public_urn, anchor.exact_text,
           node.locator_path, witness.edition_statement
    FROM claim_assertions link
    JOIN transmission_groups transmission ON transmission.id = link.transmission_group_id
    JOIN source_assertions assertion ON assertion.id = link.assertion_id
    JOIN source_works work ON work.id = assertion.narrating_work_id
    JOIN assertion_anchors assertion_anchor ON assertion_anchor.assertion_id = assertion.id AND assertion_anchor.role = 'primary'
    JOIN text_anchors anchor ON anchor.id = assertion_anchor.anchor_id
    JOIN text_revisions revision ON revision.id = anchor.text_revision_id
    JOIN text_layers layer ON layer.id = revision.layer_id
    JOIN document_nodes node ON node.id = layer.node_id
    JOIN source_witnesses witness ON witness.id = node.witness_id
    WHERE link.claim_id = ?
    ORDER BY link.ordinal, work.title, node.locator_path
  `).all(claimId);
  return {
    claim,
    independentTransmissionGroupCount: new Set(evidence.map((item) => item.transmission_group_id)).size,
    evidence: evidence.map((row) => ({
      stance: row.stance,
      directness: row.directness,
      assessmentStatus: row.assessment_status,
      assessmentNote: row.assessment_note,
      transmissionGroup: { id: row.transmission_group_id, label: row.transmission_group_label },
      assertion: { id: row.assertion_id, statement: row.assertion_statement, predicateKey: row.assertion_predicate_key },
      narratingWork: { id: row.work_id, title: row.work_title },
      anchor: {
        id: row.anchor_id,
        urn: row.public_urn,
        exact: row.exact_text,
        locator: row.locator_path,
        editionStatement: row.edition_statement,
      },
    })),
  };
}
