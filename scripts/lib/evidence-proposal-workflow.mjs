import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prepareAssertionCandidateSet } from "./evidence-assertion-workflow.mjs";
import { uuidV5 } from "./evidence-pool-pilot.mjs";

const generatedFrom = "evidence-proposal-workflow-v1";

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

function uniqueKeys(items, label) {
  const keys = new Set();
  for (const [index, item] of items.entries()) {
    requiredString(item.key, `${label}[${index}].key`);
    if (keys.has(item.key)) throw new Error(`Duplicate ${label} key: ${item.key}`);
    keys.add(item.key);
  }
  return keys;
}

function requireReference(keys, key, label) {
  if (!keys.has(key)) throw new Error(`Unknown ${label}: ${key}`);
}

function ensureSchema(db) {
  const required = [
    "assertion_candidates",
    "claim_candidates",
    "transmission_group_candidates",
    "transmission_group_candidate_members",
    "claim_candidate_source_candidates",
    "event_collection_candidates",
    "event_candidates_v2",
    "event_candidate_claim_candidates",
    "event_records_v2",
    "event_revisions_v2",
    "content_releases_v2",
  ];
  const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
  for (const table of required) {
    if (!exists.get(table)) throw new Error(`Evidence proposal schema is missing table: ${table}`);
  }
}

export async function prepareEvidenceProposalSet(proposalPath) {
  const absolutePath = path.resolve(proposalPath);
  const bytes = await readFile(absolutePath);
  const definition = JSON.parse(bytes.toString("utf8"));
  if (definition?.format !== "chronoatlas-claim-event-proposal-set/1") {
    throw new Error("Unsupported claim-event proposal-set format");
  }
  for (const field of ["proposalSetId", "packId"]) requiredString(definition[field], field);
  requiredString(definition.assertionCandidateSetPath, "assertionCandidateSetPath");
  requiredString(definition.generator?.key, "generator.key");
  requiredString(definition.generator?.version, "generator.version");
  if (!Array.isArray(definition.transmissionGroups)) throw new Error("transmissionGroups must be an array");
  if (!Array.isArray(definition.claims) || definition.claims.length === 0) throw new Error("claims must not be empty");
  if (!Array.isArray(definition.events) || definition.events.length === 0) throw new Error("events must not be empty");
  if (!definition.collection) throw new Error("collection is required");
  for (const gate of [
    "automaticTransmissionAcceptance",
    "automaticClaimAcceptance",
    "automaticEventAcceptance",
    "automaticPublication",
    "formalRecordsCreated",
  ]) {
    if (definition.gates?.[gate] !== false) throw new Error(`Proposal gate ${gate} must be false`);
  }

  const assertionCandidateSetPath = path.resolve(path.dirname(absolutePath), definition.assertionCandidateSetPath);
  const assertionCandidateSet = await prepareAssertionCandidateSet(assertionCandidateSetPath);
  if (assertionCandidateSet.definition.packId !== definition.packId) {
    throw new Error("Proposal set and assertion candidate set packId do not match");
  }
  const assertionKeys = new Set();
  for (const candidate of assertionCandidateSet.definition.candidates) {
    if (assertionKeys.has(candidate.candidateKey)) {
      throw new Error(`Duplicate assertion candidate key: ${candidate.candidateKey}`);
    }
    assertionKeys.add(candidate.candidateKey);
  }
  const transmissionKeys = uniqueKeys(definition.transmissionGroups, "transmission groups");
  const claimKeys = uniqueKeys(definition.claims, "claims");
  const eventKeys = uniqueKeys(definition.events, "events");
  requiredString(definition.collection.key, "collection.key");

  for (const group of definition.transmissionGroups) {
    requiredString(group.label, `transmissionGroups.${group.key}.label`);
    requiredString(group.assessment, `transmissionGroups.${group.key}.assessment`);
    requiredString(group.basisNote, `transmissionGroups.${group.key}.basisNote`);
    if (!Array.isArray(group.members) || group.members.length === 0) throw new Error(`Transmission group ${group.key} has no members`);
    for (const [candidateKey] of group.members) requireReference(assertionKeys, candidateKey, "assertion candidate key");
  }
  for (const claim of definition.claims) {
    for (const field of ["domain", "type", "predicateKey", "statement", "polarity", "modality"]) {
      requiredString(claim[field], `claims.${claim.key}.${field}`);
    }
    if (!Array.isArray(claim.evidence) || claim.evidence.length === 0) throw new Error(`Claim ${claim.key} has no evidence candidates`);
    for (const [candidateKey, , , transmissionKey] of claim.evidence) {
      requireReference(assertionKeys, candidateKey, "assertion candidate key");
      if (transmissionKey) requireReference(transmissionKeys, transmissionKey, "transmission group key");
    }
  }
  for (const event of definition.events) {
    for (const field of ["label", "summary", "kind", "boundaryCertainty"]) {
      requiredString(event[field], `events.${event.key}.${field}`);
    }
    if (!Array.isArray(event.claims) || event.claims.length === 0) throw new Error(`Event ${event.key} has no claim candidates`);
    for (const [claimKey] of event.claims) requireReference(claimKeys, claimKey, "claim key");
  }

  return {
    absolutePath,
    definition,
    proposalSetSha256: sha256(bytes),
    assertionCandidateSet,
    assertionKeys,
    transmissionKeys,
    claimKeys,
    eventKeys,
  };
}

function resolveAssertionCandidates(db, prepared) {
  const resolve = db.prepare(`
    SELECT id, proposed_statement, predicate_key
    FROM assertion_candidates
    WHERE json_extract(raw_json, '$.packId') = ?
      AND json_extract(raw_json, '$.candidateSetSha256') = ?
      AND json_extract(raw_json, '$.candidateKey') = ?
  `);
  const result = new Map();
  for (const candidate of prepared.assertionCandidateSet.definition.candidates) {
    const rows = resolve.all(
      prepared.definition.packId,
      prepared.assertionCandidateSet.candidateSetSha256,
      candidate.candidateKey,
    );
    if (rows.length !== 1) {
      throw new Error(`Expected one extracted assertion candidate for ${candidate.candidateKey}; found ${rows.length}`);
    }
    result.set(candidate.candidateKey, rows[0]);
  }
  return result;
}

function materialize(db, prepared) {
  ensureSchema(db);
  const assertionCandidates = resolveAssertionCandidates(db, prepared);
  const generator = prepared.definition.generator;
  const proposalSetId = prepared.definition.proposalSetId;

  const transmissionGroups = prepared.definition.transmissionGroups.map((group) => {
    const payload = {
      label: group.label,
      assessment: group.assessment,
      basisNote: group.basisNote,
      members: group.members,
    };
    const payloadSha256 = sha256(canonicalJson(payload));
    return {
      definition: group,
      payloadSha256,
      id: uuidV5(`transmission-group-candidate:${proposalSetId}:${group.key}:${payloadSha256}`),
    };
  });
  const transmissionByKey = new Map(transmissionGroups.map((group) => [group.definition.key, group]));

  const claims = prepared.definition.claims.map((claim) => {
    const payload = {
      domain: claim.domain,
      type: claim.type,
      predicateKey: claim.predicateKey,
      statement: claim.statement,
      polarity: claim.polarity,
      modality: claim.modality,
      evidence: claim.evidence,
    };
    const payloadSha256 = sha256(canonicalJson(payload));
    return {
      definition: claim,
      payloadSha256,
      id: uuidV5(`claim-candidate:${generator.key}:${generator.version}:${claim.key}:${payloadSha256}`),
    };
  });
  const claimByKey = new Map(claims.map((claim) => [claim.definition.key, claim]));

  const collectionPayload = {
    label: prepared.definition.collection.label,
    summary: prepared.definition.collection.summary,
    kind: prepared.definition.collection.kind,
    timeExpression: prepared.definition.collection.timeExpression ?? null,
    boundaryCertainty: prepared.definition.collection.boundaryCertainty,
  };
  const collectionPayloadSha256 = sha256(canonicalJson(collectionPayload));
  const collection = {
    definition: prepared.definition.collection,
    payloadSha256: collectionPayloadSha256,
    id: uuidV5(`event-collection-candidate:${proposalSetId}:${prepared.definition.collection.key}:${collectionPayloadSha256}`),
  };

  const events = prepared.definition.events.map((event, index) => {
    const payload = {
      label: event.label,
      summary: event.summary,
      kind: event.kind,
      timeExpression: event.timeExpression ?? null,
      placeExpression: event.placeExpression ?? null,
      boundaryCertainty: event.boundaryCertainty,
      boundaryNote: event.boundaryNote ?? null,
      claims: event.claims,
      displayOrdinal: index,
    };
    const payloadSha256 = sha256(canonicalJson(payload));
    return {
      definition: event,
      displayOrdinal: index,
      payloadSha256,
      id: uuidV5(`event-candidate:${proposalSetId}:${event.key}:${payloadSha256}`),
    };
  });
  return {
    assertionCandidates,
    transmissionGroups,
    transmissionByKey,
    claims,
    claimByKey,
    collection,
    events,
  };
}

export function evidenceProposalPlan(db, prepared) {
  const model = materialize(db, prepared);
  const exists = (table, id) => Boolean(db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id));
  return {
    mode: "plan",
    proposalSetId: prepared.definition.proposalSetId,
    proposalSetSha256: prepared.proposalSetSha256,
    assertionCandidateSetSha256: prepared.assertionCandidateSet.candidateSetSha256,
    intended: {
      transmissionGroups: model.transmissionGroups.length,
      claims: model.claims.length,
      eventCollections: 1,
      events: model.events.length,
    },
    existing: {
      transmissionGroups: model.transmissionGroups.filter((item) => exists("transmission_group_candidates", item.id)).length,
      claims: model.claims.filter((item) => exists("claim_candidates", item.id)).length,
      eventCollections: exists("event_collection_candidates", model.collection.id) ? 1 : 0,
      events: model.events.filter((item) => exists("event_candidates_v2", item.id)).length,
    },
    gates: prepared.definition.gates,
  };
}

function verifyStored(db, table, id, payloadSha256, label) {
  const stored = db.prepare(`SELECT payload_sha256 FROM ${table} WHERE id = ?`).get(id);
  if (!stored || stored.payload_sha256 !== payloadSha256) throw new Error(`${label} identity conflict: ${id}`);
}

export function ingestEvidenceProposals(db, prepared) {
  const model = materialize(db, prepared);
  const createdAt = new Date().toISOString();
  const additions = {
    transmissionGroups: 0,
    transmissionMembers: 0,
    claims: 0,
    claimEvidenceLinks: 0,
    eventCollections: 0,
    events: 0,
    eventClaimLinks: 0,
  };
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const group of model.transmissionGroups) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO transmission_group_candidates (
          id, proposal_set_id, candidate_key, label, proposed_assessment,
          basis_note, payload_sha256, status, raw_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
      `).run(
        group.id,
        prepared.definition.proposalSetId,
        group.definition.key,
        group.definition.label,
        group.definition.assessment,
        group.definition.basisNote,
        group.payloadSha256,
        json({ generatedFrom, proposalSetSha256: prepared.proposalSetSha256 }),
        createdAt,
      );
      additions.transmissionGroups += result.changes;
      verifyStored(db, "transmission_group_candidates", group.id, group.payloadSha256, "transmission group candidate");
      for (const [ordinal, [candidateKey, role]] of group.definition.members.entries()) {
        const assertionCandidate = model.assertionCandidates.get(candidateKey);
        additions.transmissionMembers += db.prepare(`
          INSERT OR IGNORE INTO transmission_group_candidate_members (
            id, transmission_group_candidate_id, assertion_candidate_id,
            proposed_role, ordinal, raw_json
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidV5(`transmission-group-candidate-member:${group.id}:${assertionCandidate.id}`),
          group.id,
          assertionCandidate.id,
          role,
          ordinal,
          json({ generatedFrom, candidateKey }),
        ).changes;
      }
    }

    for (const claim of model.claims) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO claim_candidates (
          id, generator_key, generator_version, claim_domain, claim_type,
          proposed_predicate, proposed_statement, proposed_polarity, proposed_modality,
          match_claim_id, payload_sha256, status, raw_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'pending_review', ?, ?)
      `).run(
        claim.id,
        prepared.definition.generator.key,
        prepared.definition.generator.version,
        claim.definition.domain,
        claim.definition.type,
        claim.definition.predicateKey,
        claim.definition.statement,
        claim.definition.polarity,
        claim.definition.modality,
        claim.payloadSha256,
        json({
          generatedFrom,
          proposalSetId: prepared.definition.proposalSetId,
          proposalSetSha256: prepared.proposalSetSha256,
          claimKey: claim.definition.key,
        }),
        createdAt,
      );
      additions.claims += result.changes;
      verifyStored(db, "claim_candidates", claim.id, claim.payloadSha256, "claim candidate");
      for (const [ordinal, [candidateKey, stance, directness, transmissionKey]] of claim.definition.evidence.entries()) {
        const assertionCandidate = model.assertionCandidates.get(candidateKey);
        const transmissionGroup = transmissionKey ? model.transmissionByKey.get(transmissionKey) : null;
        additions.claimEvidenceLinks += db.prepare(`
          INSERT OR IGNORE INTO claim_candidate_source_candidates (
            id, claim_candidate_id, assertion_candidate_id, proposed_stance,
            proposed_directness, transmission_group_candidate_id, ordinal, raw_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidV5(`claim-candidate-source-candidate:${claim.id}:${assertionCandidate.id}`),
          claim.id,
          assertionCandidate.id,
          stance,
          directness,
          transmissionGroup?.id ?? null,
          ordinal,
          json({ generatedFrom, candidateKey, transmissionKey: transmissionKey ?? null }),
        ).changes;
      }
    }

    const collectionResult = db.prepare(`
      INSERT OR IGNORE INTO event_collection_candidates (
        id, proposal_set_id, candidate_key, proposed_label, proposed_summary,
        collection_kind, time_expression, boundary_certainty, payload_sha256,
        status, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
    `).run(
      model.collection.id,
      prepared.definition.proposalSetId,
      model.collection.definition.key,
      model.collection.definition.label,
      model.collection.definition.summary,
      model.collection.definition.kind,
      model.collection.definition.timeExpression ?? null,
      model.collection.definition.boundaryCertainty,
      model.collection.payloadSha256,
      json({ generatedFrom, proposalSetSha256: prepared.proposalSetSha256 }),
      createdAt,
    );
    additions.eventCollections += collectionResult.changes;
    verifyStored(db, "event_collection_candidates", model.collection.id, model.collection.payloadSha256, "event collection candidate");

    for (const event of model.events) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO event_candidates_v2 (
          id, proposal_set_id, collection_candidate_id, candidate_key,
          proposed_label, proposed_summary, event_kind, time_expression,
          place_expression, boundary_certainty, boundary_note, display_ordinal,
          payload_sha256, status, raw_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
      `).run(
        event.id,
        prepared.definition.proposalSetId,
        model.collection.id,
        event.definition.key,
        event.definition.label,
        event.definition.summary,
        event.definition.kind,
        event.definition.timeExpression ?? null,
        event.definition.placeExpression ?? null,
        event.definition.boundaryCertainty,
        event.definition.boundaryNote ?? null,
        event.displayOrdinal,
        event.payloadSha256,
        json({ generatedFrom, proposalSetSha256: prepared.proposalSetSha256 }),
        createdAt,
      );
      additions.events += result.changes;
      verifyStored(db, "event_candidates_v2", event.id, event.payloadSha256, "event candidate");
      for (const [ordinal, [claimKey, role]] of event.definition.claims.entries()) {
        const claim = model.claimByKey.get(claimKey);
        additions.eventClaimLinks += db.prepare(`
          INSERT OR IGNORE INTO event_candidate_claim_candidates (
            id, event_candidate_id, claim_candidate_id, relation_role, ordinal, raw_json
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidV5(`event-candidate-claim-candidate:${event.id}:${claim.id}:${role}`),
          event.id,
          claim.id,
          role,
          ordinal,
          json({ generatedFrom, claimKey }),
        ).changes;
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return {
    mode: "apply",
    proposalSetId: prepared.definition.proposalSetId,
    proposalSetSha256: prepared.proposalSetSha256,
    additions,
    formalRecordsCreated: false,
  };
}

function count(db, table, where = "", parameters = []) {
  return db.prepare(`SELECT COUNT(*) count FROM ${table}${where}`).get(...parameters).count;
}

export function evidenceProposalCounts(db, proposalSetId = null) {
  ensureSchema(db);
  const proposalFilter = proposalSetId ? " WHERE proposal_set_id = ?" : "";
  const proposalParameters = proposalSetId ? [proposalSetId] : [];
  return {
    transmissionGroupCandidates: count(db, "transmission_group_candidates", proposalFilter, proposalParameters),
    transmissionGroupCandidateMembers: count(db, "transmission_group_candidate_members"),
    claimCandidates: proposalSetId
      ? count(db, "claim_candidates", " WHERE json_extract(raw_json, '$.proposalSetId') = ?", [proposalSetId])
      : count(db, "claim_candidates"),
    claimCandidateSourceLinks: count(db, "claim_candidate_source_candidates"),
    eventCollectionCandidates: count(db, "event_collection_candidates", proposalFilter, proposalParameters),
    eventCandidates: count(db, "event_candidates_v2", proposalFilter, proposalParameters),
    eventCandidateClaimLinks: count(db, "event_candidate_claim_candidates"),
    formalEventRecords: count(db, "event_records_v2"),
    formalEventRevisions: count(db, "event_revisions_v2"),
    formalCollectionRecords: count(db, "event_collection_records_v2"),
    formalCollectionRevisions: count(db, "event_collection_revisions_v2"),
    contentReleases: count(db, "content_releases_v2"),
    publishedReleases: count(db, "content_releases_v2", " WHERE status = 'published'"),
  };
}

export function resolveEvidenceProposalDossier(db, proposalSetId) {
  ensureSchema(db);
  const collection = db.prepare(`
    SELECT id, candidate_key AS candidateKey, proposed_label AS label,
           proposed_summary AS summary, collection_kind AS kind,
           time_expression AS timeExpression, boundary_certainty AS boundaryCertainty,
           status
    FROM event_collection_candidates
    WHERE proposal_set_id = ?
  `).get(proposalSetId);
  if (!collection) return null;
  const events = db.prepare(`
    SELECT id, candidate_key AS candidateKey, proposed_label AS label,
           proposed_summary AS summary, event_kind AS kind,
           time_expression AS timeExpression, place_expression AS placeExpression,
           boundary_certainty AS boundaryCertainty, boundary_note AS boundaryNote,
           display_ordinal AS displayOrdinal, status
    FROM event_candidates_v2
    WHERE proposal_set_id = ?
    ORDER BY display_ordinal
  `).all(proposalSetId).map((event) => ({
    ...event,
    claims: db.prepare(`
      SELECT claim.id, json_extract(claim.raw_json, '$.claimKey') AS claimKey,
             claim.proposed_statement AS statement, claim.proposed_predicate AS predicateKey,
             claim.proposed_polarity AS polarity, claim.proposed_modality AS modality,
             link.relation_role AS relationRole, link.ordinal,
             COUNT(source_link.id) AS evidenceCandidateCount,
             COUNT(DISTINCT assertion.narrating_work_id) AS narratingWorkCount,
             COUNT(DISTINCT source_link.transmission_group_candidate_id) AS transmissionGroupCount
      FROM event_candidate_claim_candidates link
      JOIN claim_candidates claim ON claim.id = link.claim_candidate_id
      LEFT JOIN claim_candidate_source_candidates source_link ON source_link.claim_candidate_id = claim.id
      LEFT JOIN assertion_candidates assertion ON assertion.id = source_link.assertion_candidate_id
      WHERE link.event_candidate_id = ?
      GROUP BY claim.id, link.id
      ORDER BY link.ordinal
    `).all(event.id),
  }));
  const counts = evidenceProposalCounts(db, proposalSetId);
  return {
    proposalSetId,
    collection,
    events,
    counts,
    publicationState: {
      formalEvents: counts.formalEventRevisions,
      publishedReleases: counts.publishedReleases,
      publicProjectionAllowed: counts.publishedReleases > 0,
      reason: counts.publishedReleases > 0
        ? "At least one human-approved release exists."
        : "Only pending candidates exist; human-accepted assertions, claims, event revisions, and release approval are required.",
    },
  };
}
