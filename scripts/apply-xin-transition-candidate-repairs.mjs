import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

import migratePromotionSchema from "../db/migrations/017-event-promotion-provenance.mjs";
import migratePlaceReferences from "../db/migrations/018-china-place-reference-entities.mjs";
import migrateXinTransitionPeriod from "../db/migrations/021-xin-transition-period-reference.mjs";
import {
  xinTransitionBatchId,
  xinTransitionCandidateRepairs,
  xinTransitionCanonicalPeople,
  xinTransitionPeriodId,
  xinTransitionProfileId,
} from "./data/xin-transition-official-history-candidate-repairs.mjs";
import { normalizeIdentityText, parseJson, stableId, toJson } from "./lib/event-promotion-core.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="));
const databasePath = dbArg
  ? path.resolve(rootDir, dbArg.slice("--db=".length))
  : path.join(rootDir, "db", "chronoatlas.sqlite");
const dryRun = process.argv.includes("--dry-run");
const generator = "xin-transition-candidate-repair:v1";
const now = new Date().toISOString();

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function reviewStatusFor(disposition) {
  return disposition === "reject" ? "rejected" : "staged";
}

function recommendationFor(disposition) {
  if (disposition === "promote") return "eligible";
  if (disposition === "reject") return "reject";
  return "candidate_only";
}

function confidenceFor(disposition, current) {
  if (disposition === "promote") return "high";
  if (disposition === "reject") return "low";
  return current ?? "medium";
}

function findPersonBinding(value, bindings = []) {
  const item = typeof value === "object" && value ? value : null;
  const id = item?.id ?? null;
  const names = [item?.name, item?.matched, typeof value === "string" ? value : null]
    .map(normalizeIdentityText)
    .filter(Boolean);
  return bindings.find((binding) => (
    binding.personId === id
    || [binding.canonicalName, ...(binding.sourceNames ?? [])]
      .map(normalizeIdentityText)
      .some((name) => names.includes(name))
  ));
}

function applyPersonBindings(values, bindings = []) {
  if (!Array.isArray(values) || !bindings.length) return values;
  return values.map((value) => {
    const binding = findPersonBinding(value, bindings);
    if (!binding) return value;
    if (typeof value === "string") return binding.canonicalName;
    return {
      ...value,
      id: binding.personId,
      name: binding.canonicalName,
      canonicalPersonId: binding.personId,
      candidateKind: "known_person",
      flags: Array.isArray(value.flags)
        ? value.flags.filter((flag) => flag !== "ambiguous_person")
        : value.flags,
    };
  });
}

function applyRawPersonBindings(raw, bindings = []) {
  if (!bindings.length) return raw;
  const next = { ...raw };
  for (const field of [
    "peopleCore",
    "peopleMentioned",
    "extractedPeople",
    "discoveredPeople",
    "knownPeople",
    "provisionalPeople",
    "personRoles",
  ]) {
    if (Array.isArray(next[field])) next[field] = applyPersonBindings(next[field], bindings);
  }
  return next;
}

function updateCandidateRaw(raw, decision) {
  const boundRaw = applyRawPersonBindings(raw, decision.personBindings);
  const semanticFlags = (boundRaw.semanticFlags ?? []).filter((flag) => flag !== "chronology_unresolved");
  const nextChronology = decision.chronology
    ? {
        year: decision.chronology.year,
        expression: decision.chronology.expression,
        method: decision.chronology.method,
        confidence: decision.chronology.confidence,
        chronologyCandidateIndex: null,
        sourceContext: decision.chronology.sourceContext,
      }
    : boundRaw.sentenceChronology;
  if (decision.disposition === "promote" && semanticFlags.length) {
    throw new Error(`Promoted candidate still has blocking flags: ${decision.cardId}: ${semanticFlags.join(", ")}`);
  }
  return {
    ...boundRaw,
    periodHint: xinTransitionPeriodId,
    sentenceChronology: nextChronology,
    semanticRecommendation: recommendationFor(decision.disposition),
    semanticConfidence: confidenceFor(decision.disposition, boundRaw.semanticConfidence),
    semanticFlags,
    semanticReasons: unique([
      ...(boundRaw.semanticReasons ?? []),
      `editorial-${decision.disposition}`,
      decision.personBindings?.length ? "canonical-person-binding" : null,
    ]),
    candidateRepair: {
      generator,
      disposition: decision.disposition,
      reason: decision.reason,
      title: decision.title ?? null,
      repairedAt: now,
      chronology: decision.chronology ?? null,
      matchedEventId: decision.matchedEventId ?? null,
      personBindings: decision.personBindings ?? [],
    },
  };
}

function ensureCanonicalPeople(db) {
  const upsertPerson = db.prepare(`
    INSERT INTO persons (
      id, region, name, courtesy_name, life, birth_year, death_year,
      life_confidence, primary_polity, summary, coverage_status, raw_json
    ) VALUES (?, 'china', ?, NULL, NULL, ?, ?, 'medium', ?, ?, 'stub', ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      birth_year = COALESCE(persons.birth_year, excluded.birth_year),
      death_year = COALESCE(persons.death_year, excluded.death_year),
      primary_polity = COALESCE(persons.primary_polity, excluded.primary_polity),
      coverage_status = CASE
        WHEN json_extract(persons.raw_json, '$.generatedFrom') = ? THEN excluded.coverage_status
        ELSE persons.coverage_status
      END,
      summary = CASE
        WHEN json_extract(persons.raw_json, '$.generatedFrom') = ? THEN excluded.summary
        ELSE persons.summary
      END,
      raw_json = CASE
        WHEN json_extract(persons.raw_json, '$.generatedFrom') = ? THEN excluded.raw_json
        ELSE persons.raw_json
      END
  `);
  const upsertAlias = db.prepare(`
    INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
    VALUES (?, ?, ?, 'historical-title', '[]', ?)
    ON CONFLICT(id) DO UPDATE SET
      person_id = excluded.person_id,
      value = excluded.value,
      type = excluded.type,
      raw_json = excluded.raw_json
  `);
  let people = 0;
  let aliases = 0;
  for (const person of xinTransitionCanonicalPeople) {
    const raw = toJson({
      generatedFrom: generator,
      profileId: xinTransitionProfileId,
      reviewStatus: "needs-review",
      identityBasis: "explicit official-history title and event context",
    });
    people += upsertPerson.run(
      person.id,
      person.name,
      person.birthYear ?? null,
      person.deathYear ?? null,
      person.primaryPolity ?? null,
      person.summary,
      raw,
      generator,
      generator,
      generator,
    ).changes;
    for (const alias of person.aliases ?? []) {
      aliases += upsertAlias.run(
        `xin-transition-person-alias:${stableId(`${person.id}:${alias}`)}`,
        person.id,
        alias,
        toJson({ generator, profileId: xinTransitionProfileId }),
      ).changes;
    }
  }
  return { people, aliases };
}

function validateDecisionCoverage(db) {
  const cards = db.prepare("SELECT id FROM import_evidence_cards WHERE batch_id = ? ORDER BY id")
    .all(xinTransitionBatchId)
    .map((row) => row.id);
  const decisionIds = xinTransitionCandidateRepairs.map((decision) => decision.cardId);
  const duplicateIds = decisionIds.filter((id, index) => decisionIds.indexOf(id) !== index);
  const missing = cards.filter((id) => !decisionIds.includes(id));
  const unknown = decisionIds.filter((id) => !cards.includes(id));
  if (!cards.length || duplicateIds.length || missing.length || unknown.length) {
    throw new Error(toJson({ cards: cards.length, decisions: decisionIds.length, duplicateIds, missing, unknown }));
  }
}

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA busy_timeout = 15000");
let transactionOpen = false;

try {
  db.exec("BEGIN IMMEDIATE");
  transactionOpen = true;
  migratePromotionSchema(db);
  migratePlaceReferences(db);
  migrateXinTransitionPeriod(db);
  validateDecisionCoverage(db);

  const personStats = ensureCanonicalPeople(db);
  const updateCard = db.prepare(`
    UPDATE import_evidence_cards
    SET year = ?, event_label = ?, people_core_json = ?, people_mentioned_json = ?,
        confidence = ?, review_status = ?,
        validation_warnings_json = ?, raw_json = ?
    WHERE id = ? AND batch_id = ?
  `);
  const updateMention = db.prepare(`
    UPDATE source_mentions
    SET year = ?, confidence = ?, raw_json = ?
    WHERE id = ?
  `);
  const nextMentionPersonOrder = db.prepare(`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS sort_order
    FROM source_mention_people
    WHERE mention_id = ?
  `);
  const insertMentionPerson = db.prepare(`
    INSERT OR IGNORE INTO source_mention_people (mention_id, person_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const deleteSupersededMentionPerson = db.prepare(`
    DELETE FROM source_mention_people
    WHERE mention_id = ?
      AND person_id <> ?
      AND person_id IN (
        SELECT id
        FROM persons
        WHERE name = ?
          AND json_extract(raw_json, '$.generatedFrom') = 'official-history-secondary-person-discovery'
          AND json_extract(raw_json, '$.profileId') = ?
      )
  `);
  const selectClusters = db.prepare(`
    SELECT c.id, c.raw_json
    FROM import_event_cluster_members m
    JOIN import_event_clusters c ON c.id = m.cluster_id
    WHERE m.card_id = ?
    ORDER BY c.id
  `);
  const updateCluster = db.prepare(`
    UPDATE import_event_clusters
    SET canonical_label = ?, normalized_key = ?, time_start = ?, time_end = ?,
        matched_event_id = ?, match_status = ?, confidence = ?, review_status = ?, raw_json = ?
    WHERE id = ?
  `);
  const updateBatch = db.prepare(`
    UPDATE import_batches
    SET status = 'staged', notes = ?, raw_json = ?
    WHERE id = ?
  `);

  const stats = {
    decisions: xinTransitionCandidateRepairs.length,
    promote: 0,
    context: 0,
    reject: 0,
    chronologyResolved: 0,
    cardsUpdated: 0,
    mentionsUpdated: 0,
    clustersUpdated: 0,
    matchedCurated: 0,
    canonicalPersonBindings: 0,
    supersededMentionBindings: 0,
    ...personStats,
  };

  for (const decision of xinTransitionCandidateRepairs) {
    const card = db.prepare("SELECT * FROM import_evidence_cards WHERE id = ?").get(decision.cardId);
    if (!card) throw new Error(`Missing candidate card: ${decision.cardId}`);
    const raw = updateCandidateRaw(parseJson(card.raw_json), decision);
    const title = decision.title ?? card.event_label;
    const year = decision.chronology?.year ?? card.year;
    const peopleCore = applyPersonBindings(parseJson(card.people_core_json, []), decision.personBindings);
    const peopleMentioned = applyPersonBindings(parseJson(card.people_mentioned_json, []), decision.personBindings);
    const confidence = confidenceFor(decision.disposition, card.confidence);
    const reviewStatus = reviewStatusFor(decision.disposition);
    const warnings = raw.semanticFlags ?? [];
    const mentionId = raw.mentionId ?? null;
    const updated = updateCard.run(
      year,
      title,
      toJson(peopleCore),
      toJson(peopleMentioned),
      confidence,
      reviewStatus,
      toJson(warnings),
      toJson(raw),
      decision.cardId,
      xinTransitionBatchId,
    );
    if (updated.changes !== 1) throw new Error(`Candidate update failed: ${decision.cardId}`);
    stats.cardsUpdated += updated.changes;
    if (mentionId) {
      const mention = db.prepare("SELECT raw_json FROM source_mentions WHERE id = ?").get(mentionId);
      if (mention) {
        const mentionRaw = {
          ...parseJson(mention.raw_json),
          periodHint: xinTransitionPeriodId,
          sentenceChronology: raw.sentenceChronology,
          candidateRepair: raw.candidateRepair,
        };
        stats.mentionsUpdated += updateMention.run(year, confidence, toJson(mentionRaw), mentionId).changes;
      }
      for (const binding of decision.personBindings ?? []) {
        stats.supersededMentionBindings += deleteSupersededMentionPerson.run(
          mentionId,
          binding.personId,
          binding.canonicalName,
          xinTransitionProfileId,
        ).changes;
        const sortOrder = nextMentionPersonOrder.get(mentionId).sort_order;
        stats.canonicalPersonBindings += insertMentionPerson.run(
          mentionId,
          binding.personId,
          sortOrder,
        ).changes;
      }
    }
    for (const cluster of selectClusters.all(decision.cardId)) {
      const clusterRaw = {
        ...parseJson(cluster.raw_json),
        promotionProfile: xinTransitionProfileId,
        periodId: xinTransitionPeriodId,
        candidateRepair: raw.candidateRepair,
      };
      stats.clustersUpdated += updateCluster.run(
        title,
        normalizeIdentityText(title),
        year,
        year,
        decision.matchedEventId ?? null,
        decision.matchedEventId ? "matched" : "unmatched",
        confidence,
        reviewStatus,
        toJson(clusterRaw),
        cluster.id,
      ).changes;
    }
    stats[decision.disposition] += 1;
    if (decision.chronology) stats.chronologyResolved += 1;
    if (decision.matchedEventId) stats.matchedCurated += 1;
  }

  const batch = db.prepare("SELECT raw_json FROM import_batches WHERE id = ?").get(xinTransitionBatchId);
  updateBatch.run(
    "Adjudicated Xin-transition semantic candidates; eligible facts may enter formal promotion, contextual facts remain non-promotable.",
    toJson({
      ...parseJson(batch.raw_json),
      periodId: xinTransitionPeriodId,
      candidateRepair: {
        generator,
        repairedAt: now,
        decisions: stats.decisions,
        promote: stats.promote,
        context: stats.context,
        reject: stats.reject,
      },
    }),
    xinTransitionBatchId,
  );

  const unresolved = db.prepare(`
    SELECT COUNT(*) AS total
    FROM import_evidence_cards
    WHERE batch_id = ?
      AND review_status = 'needs-fix'
  `).get(xinTransitionBatchId).total;
  if (unresolved !== 0) throw new Error(`Xin-transition candidates still need fixes: ${unresolved}`);

  if (dryRun) db.exec("ROLLBACK");
  else db.exec("COMMIT");
  transactionOpen = false;
  console.log(JSON.stringify({ generatedAt: now, dryRun, profileId: xinTransitionProfileId, batchId: xinTransitionBatchId, ...stats }, null, 2));
} catch (error) {
  if (transactionOpen) db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
