import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import migratePromotionSchema from "../db/migrations/017-event-promotion-provenance.mjs";
import migratePlaceReferences from "../db/migrations/018-china-place-reference-entities.mjs";
import migrateWesternJinPeriod from "../db/migrations/019-western-jin-period-reference.mjs";
import migrateEasternHanPeriod from "../db/migrations/020-eastern-han-period-reference.mjs";
import migrateXinTransitionPeriod from "../db/migrations/021-xin-transition-period-reference.mjs";
import migrateWesternHanPeriod from "../db/migrations/024-western-han-period-reference.mjs";
import { normalizeIdentityText, parseJson, stableId, toJson } from "./lib/event-promotion-core.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="));
const decisionsArg = process.argv.find((argument) => argument.startsWith("--decisions="));
if (!decisionsArg) throw new Error("Missing required --decisions=<module> argument");

const databasePath = dbArg
  ? path.resolve(rootDir, dbArg.slice("--db=".length))
  : path.join(rootDir, "db", "chronoatlas.sqlite");
const decisionsPath = path.resolve(rootDir, decisionsArg.slice("--decisions=".length));
const dryRun = process.argv.includes("--dry-run");
const loaded = await import(pathToFileURL(decisionsPath));
const config = loaded.default ?? loaded.officialHistoryCandidateRepairConfig;
const now = new Date().toISOString();

for (const field of ["profileId", "batchId", "periodId", "generator", "decisions"]) {
  if (!config?.[field]) throw new Error(`Candidate repair config is missing ${field}: ${decisionsPath}`);
}
const coverageMode = config.coverageMode ?? "complete";
if (!["complete", "partial"].includes(coverageMode)) {
  throw new Error(`Unsupported candidate repair coverageMode=${coverageMode}: ${decisionsPath}`);
}

let decisions = config.decisions;
let decisionRebindingStats = null;

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

function applyPersonBindings(values, bindings = [], { appendMissing = false, removeNames = [] } = {}) {
  if (!Array.isArray(values)) return values;
  const removed = new Set(removeNames.map(normalizeIdentityText).filter(Boolean));
  const next = values.filter((value) => {
    const item = typeof value === "object" && value ? value : null;
    return ![item?.name, item?.matched, typeof value === "string" ? value : null]
      .map(normalizeIdentityText)
      .some((name) => name && removed.has(name));
  }).map((value) => {
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
  if (!appendMissing) return next;
  const known = new Set(next.flatMap((value) => {
    if (typeof value === "string") return [normalizeIdentityText(value)];
    return [normalizeIdentityText(value?.name), normalizeIdentityText(value?.matched)].filter(Boolean);
  }));
  for (const binding of bindings) {
    if (!known.has(normalizeIdentityText(binding.canonicalName))) next.push(binding.canonicalName);
  }
  return next;
}

function applyRawPersonBindings(raw, bindings = [], removeNames = []) {
  if (!bindings.length && !removeNames.length) return raw;
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
    if (Array.isArray(next[field])) {
      next[field] = applyPersonBindings(next[field], bindings, {
        appendMissing: field === "peopleMentioned",
        removeNames,
      });
    }
  }
  return next;
}

function displayReferenceName(value) {
  if (typeof value === "string") return value.trim();
  return String(
    value?.canonicalName
    ?? value?.name
    ?? value?.label
    ?? value?.matched
    ?? "",
  ).trim();
}

function candidateSearchDocumentBody(card, title, raw, peopleCore, peopleMentioned) {
  const people = unique([...peopleCore, ...peopleMentioned].map(displayReferenceName));
  const places = unique(parseJson(card.places_json, []).map(displayReferenceName));
  return [
    `候选：${title}`,
    `出处：${card.source_title} ${card.locator}`,
    `类型：${raw.eventTypeLabel ?? card.fact_type ?? "未分类"}`,
    `人物：${people.join("、") || "未识别"}`,
    `地点：${places.join("、") || "未识别"}`,
    card.original_text,
  ].join("\n");
}

function updateCandidateRaw(raw, decision) {
  const boundRaw = applyRawPersonBindings(raw, decision.personBindings, decision.removePersonNames);
  const semanticFlags = (boundRaw.semanticFlags ?? []).filter((flag) => (
    flag !== "chronology_unresolved" || !decision.chronology
  ));
  const nextChronology = decision.chronology
    ? {
        year: decision.chronology.year,
        ...(Number.isInteger(decision.chronology.endYear)
          ? { endYear: decision.chronology.endYear }
          : {}),
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
    periodHint: config.periodId,
    sentenceChronology: nextChronology,
    semanticRecommendation: recommendationFor(decision.disposition),
    semanticConfidence: confidenceFor(decision.disposition, boundRaw.semanticConfidence),
    semanticFlags,
    semanticReasons: unique([
      ...(boundRaw.semanticReasons ?? []),
      `editorial-${decision.disposition}`,
      decision.personBindings?.length ? "canonical-person-binding" : null,
      decision.removePersonNames?.length ? "invalid-person-binding-removed" : null,
      decision.allowCollectiveEvent ? "reviewed-collective-event" : null,
    ]),
    candidateRepair: {
      generator: config.generator,
      disposition: decision.disposition,
      reason: decision.reason,
      title: decision.title ?? null,
      summary: decision.summary ?? null,
      repairedAt: now,
      chronology: decision.chronology ?? null,
      matchedEventId: decision.matchedEventId ?? null,
      personBindings: decision.personBindings ?? [],
      removePersonNames: decision.removePersonNames ?? [],
      removePersonIds: decision.removePersonIds ?? [],
      placeBindings: decision.placeBindings ?? [],
      allowCollectiveEvent: decision.allowCollectiveEvent === true,
      preserveAllBoundPeople: decision.preserveAllBoundPeople === true,
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
        WHEN json_extract(persons.raw_json, '$.generatedFrom') IN (?, 'official-history-secondary-person-discovery')
          THEN excluded.coverage_status
        ELSE persons.coverage_status
      END,
      summary = CASE
        WHEN json_extract(persons.raw_json, '$.generatedFrom') IN (?, 'official-history-secondary-person-discovery')
          THEN excluded.summary
        ELSE persons.summary
      END,
      raw_json = CASE
        WHEN json_extract(persons.raw_json, '$.generatedFrom') IN (?, 'official-history-secondary-person-discovery')
          THEN excluded.raw_json
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
  for (const person of config.canonicalPeople ?? []) {
    const raw = toJson({
      generatedFrom: config.generator,
      profileId: config.profileId,
      reviewStatus: "needs-review",
      identityBasis: person.identityBasis ?? "explicit official-history title and event context",
    });
    people += upsertPerson.run(
      person.id,
      person.name,
      person.birthYear ?? null,
      person.deathYear ?? null,
      person.primaryPolity ?? null,
      person.summary ?? `${person.name}；据正史原文中的明确称名建立稳定人物身份，完整生平待补。`,
      raw,
      config.generator,
      config.generator,
      config.generator,
    ).changes;
    for (const alias of person.aliases ?? []) {
      aliases += upsertAlias.run(
        `official-history-person-alias:${stableId(`${person.id}:${alias}`)}`,
        person.id,
        alias,
        toJson({ generator: config.generator, profileId: config.profileId }),
      ).changes;
    }
  }
  return { people, aliases };
}

function validateDecisionCoverage(db) {
  const cards = db.prepare("SELECT id FROM import_evidence_cards WHERE batch_id = ? ORDER BY id")
    .all(config.batchId)
    .map((row) => row.id);
  const decisionIds = decisions.map((decision) => decision.cardId);
  const duplicateIds = decisionIds.filter((id, index) => decisionIds.indexOf(id) !== index);
  const missing = cards.filter((id) => !decisionIds.includes(id));
  const unknown = decisionIds.filter((id) => !cards.includes(id));
  const invalid = decisions.filter((decision) => (
    !["promote", "context", "reject"].includes(decision.disposition)
    || (decision.allowCollectiveEvent && decision.disposition !== "promote")
  ));
  if (
    !cards.length
    || !decisionIds.length
    || duplicateIds.length
    || (coverageMode === "complete" && missing.length)
    || unknown.length
    || invalid.length
  ) {
    throw new Error(toJson({
      coverageMode,
      cards: cards.length,
      decisions: decisionIds.length,
      duplicateIds,
      missing,
      unknown,
      invalid: invalid.map((decision) => decision.cardId),
    }));
  }
  return {
    mode: coverageMode,
    batchCards: cards.length,
    decisions: decisionIds.length,
    unaddressed: missing.length,
  };
}

function validatePersonBindings(db) {
  const findPerson = db.prepare("SELECT id FROM persons WHERE id = ?");
  const unknown = [];
  for (const decision of decisions) {
    for (const binding of decision.personBindings ?? []) {
      if (!findPerson.get(binding.personId)) unknown.push({ cardId: decision.cardId, personId: binding.personId });
    }
  }
  if (unknown.length) throw new Error(`Unknown canonical person bindings: ${toJson(unknown)}`);
}

function distinctLegacyMentions(rows) {
  return [...new Map(rows.map((row) => [
    `${row.source_id}\u0000${row.passage_id}\u0000${row.year}\u0000${row.text}`,
    row,
  ])).values()];
}

function rebindLegacySourceMentionDecisions(db) {
  const rebinding = config.decisionRebinding;
  if (rebinding?.strategy !== "legacy-source-mention") return null;

  const findCurrentCard = db.prepare("SELECT id FROM import_evidence_cards WHERE id = ? AND batch_id = ?");
  const findLegacyMentions = db.prepare(`
    SELECT source_id, passage_id, year, text
    FROM source_mentions
    WHERE id LIKE ? AND year IS NOT NULL
  `);
  const findCurrentMatches = db.prepare(`
    SELECT id
    FROM import_evidence_cards
    WHERE batch_id = ?
      AND original_text = ?
      AND json_extract(raw_json, '$.passageId') = ?
      AND year = ?
  `);
  const resolved = [];
  const unmapped = [];
  const targetIds = new Set();

  for (const decision of config.decisions) {
    if (findCurrentCard.get(decision.cardId, config.batchId)) {
      if (targetIds.has(decision.cardId)) throw new Error(`Duplicate current decision target: ${decision.cardId}`);
      targetIds.add(decision.cardId);
      resolved.push(decision);
      continue;
    }
    const suffix = String(decision.cardId).split(":").at(-1);
    const legacyMentions = distinctLegacyMentions(findLegacyMentions.all(`%:${suffix}`));
    if (legacyMentions.length !== 1) {
      unmapped.push({ cardId: decision.cardId, reason: legacyMentions.length ? "legacy-mention-ambiguous" : "legacy-mention-missing" });
      continue;
    }
    const legacy = legacyMentions[0];
    const matches = findCurrentMatches.all(config.batchId, legacy.text, legacy.passage_id, legacy.year);
    if (matches.length !== 1) {
      unmapped.push({ cardId: decision.cardId, reason: matches.length ? "current-card-ambiguous" : "current-card-missing" });
      continue;
    }
    const targetId = matches[0].id;
    if (targetIds.has(targetId)) throw new Error(`Multiple legacy decisions map to current card: ${targetId}`);
    targetIds.add(targetId);
    resolved.push({ ...decision, cardId: targetId });
  }

  decisions = resolved;
  return {
    strategy: rebinding.strategy,
    configuredDecisions: config.decisions.length,
    reboundDecisions: resolved.length,
    unmappedDecisions: unmapped.length,
    unmapped: unmapped.slice(0, 20),
  };
}
const db = new DatabaseSync(databasePath);
db.exec("PRAGMA busy_timeout = 15000");
let transactionOpen = false;

for (const decision of decisions) {
  if (!decision.chronology) continue;
  const { year, endYear = year } = decision.chronology;
  if (!Number.isInteger(year) || !Number.isInteger(endYear) || endYear < year) {
    throw new Error(`Invalid chronology for ${decision.cardId}: ${toJson(decision.chronology)}`);
  }
}

try {
  db.exec("BEGIN IMMEDIATE");
  transactionOpen = true;
  migratePromotionSchema(db);
  migratePlaceReferences(db);
  migrateWesternJinPeriod(db);
  migrateEasternHanPeriod(db);
  migrateXinTransitionPeriod(db);
  migrateWesternHanPeriod(db);
  decisionRebindingStats = rebindLegacySourceMentionDecisions(db);
  const decisionCoverage = validateDecisionCoverage(db);

  const personStats = ensureCanonicalPeople(db);
  validatePersonBindings(db);
  const updateCard = db.prepare(`
    UPDATE import_evidence_cards
    SET year = ?, event_label = ?, people_core_json = ?, people_mentioned_json = ?,
        confidence = ?, review_status = ?, validation_warnings_json = ?, raw_json = ?
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
  const deleteMentionPersonByName = db.prepare(`
    DELETE FROM source_mention_people
    WHERE mention_id = ?
      AND person_id IN (SELECT id FROM persons WHERE name = ?)
  `);
  const deleteMentionPersonById = db.prepare(`
    DELETE FROM source_mention_people WHERE mention_id = ? AND person_id = ?
  `);
  const deleteMentionPersonTag = db.prepare(`
    DELETE FROM source_mention_tags
    WHERE mention_id = ? AND tag = ?
  `);
  const nextMentionTagOrder = db.prepare(`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS sort_order
    FROM source_mention_tags
    WHERE mention_id = ?
  `);
  const insertMentionPersonTag = db.prepare(`
    INSERT OR IGNORE INTO source_mention_tags (mention_id, tag, sort_order)
    VALUES (?, ?, ?)
  `);
  const updateMentionSearchDocument = db.prepare(`
    UPDATE search_documents
    SET title = ?, body = ?, time_start = ?, time_end = ?, raw_json = ?
    WHERE subject_table = 'source_mentions' AND subject_id = ?
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
    SELECT c.id, c.matched_event_id, c.raw_json
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
    configuredDecisions: config.decisions.length,
    decisions: decisions.length,
    promote: 0,
    context: 0,
    reject: 0,
    collectivePromote: 0,
    chronologyResolved: 0,
    cardsUpdated: 0,
    mentionsUpdated: 0,
    clustersUpdated: 0,
    matchedEvents: 0,
    canonicalPersonBindings: 0,
    canonicalPersonTags: 0,
    supersededMentionBindings: 0,
    supersededPersonTags: 0,
    invalidPersonBindingsRemoved: 0,
    invalidPersonTagsRemoved: 0,
    searchDocumentsUpdated: 0,
    ...personStats,
  };

  for (const decision of decisions) {
    if (
      decision.summary !== undefined
      && (typeof decision.summary !== "string" || !decision.summary.trim() || decision.summary.length > 600)
    ) {
      throw new Error(`Invalid editorial summary for ${decision.cardId}`);
    }
    const card = db.prepare("SELECT * FROM import_evidence_cards WHERE id = ?").get(decision.cardId);
    if (!card) throw new Error(`Missing candidate card: ${decision.cardId}`);
    const raw = updateCandidateRaw(parseJson(card.raw_json), decision);
    const title = decision.title ?? card.event_label;
    const year = decision.chronology?.year ?? card.year;
    const yearEnd = decision.chronology?.endYear ?? year;
    const peopleCore = applyPersonBindings(parseJson(card.people_core_json, []), decision.personBindings, {
      removeNames: decision.removePersonNames,
    });
    const peopleMentioned = applyPersonBindings(
      parseJson(card.people_mentioned_json, []),
      decision.personBindings,
      { appendMissing: true, removeNames: decision.removePersonNames },
    );
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
      config.batchId,
    );
    if (updated.changes !== 1) throw new Error(`Candidate update failed: ${decision.cardId}`);
    stats.cardsUpdated += updated.changes;
    if (mentionId) {
      const mention = db.prepare("SELECT raw_json FROM source_mentions WHERE id = ?").get(mentionId);
      let mentionRaw = raw;
      if (mention) {
        mentionRaw = {
          ...applyRawPersonBindings(
            parseJson(mention.raw_json),
            decision.personBindings,
            decision.removePersonNames,
          ),
          periodHint: config.periodId,
          sentenceChronology: raw.sentenceChronology,
          candidateRepair: raw.candidateRepair,
        };
        stats.mentionsUpdated += updateMention.run(year, confidence, toJson(mentionRaw), mentionId).changes;
      }
      for (const name of decision.removePersonNames ?? []) {
        stats.invalidPersonBindingsRemoved += deleteMentionPersonByName.run(mentionId, name).changes;
        stats.invalidPersonTagsRemoved += deleteMentionPersonTag.run(mentionId, `person:${name}`).changes;
      }
      for (const personId of decision.removePersonIds ?? []) {
        stats.invalidPersonBindingsRemoved += deleteMentionPersonById.run(mentionId, personId).changes;
      }
      for (const binding of decision.personBindings ?? []) {
        stats.supersededMentionBindings += deleteSupersededMentionPerson.run(
          mentionId,
          binding.personId,
          binding.canonicalName,
          config.profileId,
        ).changes;
        for (const sourceName of unique(binding.sourceNames ?? [])) {
          if (normalizeIdentityText(sourceName) === normalizeIdentityText(binding.canonicalName)) continue;
          stats.supersededPersonTags += deleteMentionPersonTag.run(
            mentionId,
            `person:${sourceName}`,
          ).changes;
        }
        const sortOrder = nextMentionPersonOrder.get(mentionId).sort_order;
        stats.canonicalPersonBindings += insertMentionPerson.run(mentionId, binding.personId, sortOrder).changes;
        const tagSortOrder = nextMentionTagOrder.get(mentionId).sort_order;
        stats.canonicalPersonTags += insertMentionPersonTag.run(
          mentionId,
          `person:${binding.canonicalName}`,
          tagSortOrder,
        ).changes;
      }
      stats.searchDocumentsUpdated += updateMentionSearchDocument.run(
        title,
        candidateSearchDocumentBody(card, title, raw, peopleCore, peopleMentioned),
        year,
        yearEnd,
        toJson(mentionRaw),
        mentionId,
      ).changes;
    }
    for (const cluster of selectClusters.all(decision.cardId)) {
      const hasExplicitMatch = Object.hasOwn(decision, "matchedEventId");
      const matchedEventId = decision.disposition === "promote"
        ? (hasExplicitMatch ? decision.matchedEventId : cluster.matched_event_id)
        : null;
      const clusterRaw = {
        ...parseJson(cluster.raw_json),
        promotionProfile: config.profileId,
        periodId: config.periodId,
        candidateRepair: { ...raw.candidateRepair, matchedEventId },
      };
      stats.clustersUpdated += updateCluster.run(
        title,
        normalizeIdentityText(title),
        year,
        yearEnd,
        matchedEventId,
        matchedEventId ? "matched" : "unmatched",
        confidence,
        reviewStatus,
        toJson(clusterRaw),
        cluster.id,
      ).changes;
      if (matchedEventId) stats.matchedEvents += 1;
    }
    stats[decision.disposition] += 1;
    if (decision.allowCollectiveEvent) stats.collectivePromote += 1;
    if (decision.chronology) stats.chronologyResolved += 1;
  }

  const batch = db.prepare("SELECT raw_json FROM import_batches WHERE id = ?").get(config.batchId);
  const batchNotes = config.batchNotes
    ?? `Adjudicated ${config.periodId} official-history candidates; only explicit promote decisions may enter formal events.`;
  updateBatch.run(
    batchNotes,
    toJson({
      ...parseJson(batch.raw_json),
      periodId: config.periodId,
      candidateRepair: {
        generator: config.generator,
        repairedAt: now,
        coverageMode,
        decisions: stats.decisions,
        promote: stats.promote,
        context: stats.context,
        reject: stats.reject,
        collectivePromote: stats.collectivePromote,
        unaddressedCandidates: decisionCoverage.unaddressed,
        ...(decisionRebindingStats ? { decisionRebinding: decisionRebindingStats } : {}),
      },
    }),
    config.batchId,
  );

  const unresolved = db.prepare(`
    SELECT COUNT(*) AS total
    FROM import_evidence_cards
    WHERE batch_id = ?
      AND review_status = 'needs-fix'
  `).get(config.batchId).total;
  if (unresolved !== 0) throw new Error(`Candidates still need fixes: ${unresolved}`);

  if (dryRun) db.exec("ROLLBACK");
  else db.exec("COMMIT");
  transactionOpen = false;
  console.log(JSON.stringify({
    generatedAt: now,
    dryRun,
    decisionsPath,
    profileId: config.profileId,
    batchId: config.batchId,
    decisionCoverage,
    ...stats,
  }, null, 2));
} catch (error) {
  if (transactionOpen) db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
