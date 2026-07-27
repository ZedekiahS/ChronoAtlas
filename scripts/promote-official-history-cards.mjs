import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

import migratePromotionSchema from "../db/migrations/017-event-promotion-provenance.mjs";
import migratePlaceReferences from "../db/migrations/018-china-place-reference-entities.mjs";
import migrateWesternJinPeriod from "../db/migrations/019-western-jin-period-reference.mjs";
import migrateEasternHanPeriod from "../db/migrations/020-eastern-han-period-reference.mjs";
import migrateXinTransitionPeriod from "../db/migrations/021-xin-transition-period-reference.mjs";
import { rebuildDocumentChunks } from "../db/migrations/007-document-chunks-fts.mjs";
import {
  applyEditorialChronology,
  allowsEditorialCollectivePromotion,
  compact,
  generatedEventId,
  independentEvidenceKey,
  isCompatibleClusterMatchedEvent,
  isFullySupersededMachineEvent,
  isMachineMutableReviewStatus,
  isStaleMachineEventOwnedByRequestedBatches,
  mergePromotionProvenanceSnapshot,
  mergePromotionGenerationRaw,
  officialHistoryCandidatePromotionEligibility,
  parseJson,
  promotionBatchIdsForCards,
  resolveBoundedTime,
  selectPromotionProvenanceMatch,
  shouldCleanupEntirePromotionProfile,
  shouldReplaceOwnedPromotionData,
  stableId,
  toJson,
  truncate,
} from "./lib/event-promotion-core.mjs";
import { preserveOfficialHistoryEventEnrichment } from "./lib/official-history-event-enrichment.mjs";
import { normalizeEventPlaceRole } from "./lib/event-place-role-contract.mjs";
import {
  canPromoteWithoutNamedParticipant,
  canonicalizeOfficialHistoryTitlePersonAliases,
  canonicalizeOfficialHistoryGrantTitle,
  cleanOfficialHistorySummary,
  eventTypeForOfficialHistory,
  isOfficialHistoryCommentaryText,
  normalizeOfficialHistoryEventTitle,
  normalizedOfficialHistoryIdentity,
  officialHistoryRoleAuditReasons,
  titleHasNamedActor,
  titleHasNamedGrantRecipient,
  topicIdForOfficialHistoryEvent,
} from "./lib/china-official-history-promotion-policy.mjs";
import { requestedOfficialHistoryPromotionProfile } from "./lib/china-official-history-promotion-profiles.mjs";
import { resolveChinaRegnalDate } from "./lib/china-regnal-date-resolver.mjs";
import {
  canonicalProvisionalOfficialHistoryPersonId,
  chooseOfficialHistoryEventPlaces,
  extractExplicitOfficialHistoryPeople,
  findPlaceMentions,
  provisionalOfficialHistoryPersonId,
} from "./lib/china-official-history-reference-resolver.mjs";
import { isHistoricalPersonTemporallyPlausible } from "./lib/historical-person-matching.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="))?.slice("--db=".length);
const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const now = new Date().toISOString();
const profile = requestedOfficialHistoryPromotionProfile();
const profileId = profile.id;
const generatorId = profile.generatorId;
const dryRun = process.argv.includes("--dry-run");
const rebuildChunks = !process.argv.includes("--skip-rebuild-chunks");
const sampleLimit = Math.max(0, Number(
  process.argv.find((argument) => argument.startsWith("--sample-limit="))?.slice("--sample-limit=".length) ?? 30,
));
const requestedBatchIds = process.argv
  .filter((argument) => argument.startsWith("--batch="))
  .map((argument) => argument.slice("--batch=".length))
  .filter(Boolean);
const requestedCardIds = process.argv
  .filter((argument) => argument.startsWith("--card="))
  .map((argument) => argument.slice("--card=".length))
  .filter(Boolean);
const cleanupProfileRequested = process.argv.includes("--cleanup-profile");
if (requestedCardIds.length && cleanupProfileRequested) {
  throw new Error("--card cannot be combined with --cleanup-profile");
}
const cleanupEntireProfile = requestedCardIds.length === 0 && shouldCleanupEntirePromotionProfile({
  requestedBatchIds,
  cleanupProfile: cleanupProfileRequested,
});

function inferLegacyMentionId(cardId) {
  const patterns = [
    ["card:hanshu-auto:", "hanshu-auto-candidate:"],
    ["card:houhanshu-auto:", "houhanshu-auto-candidate:"],
    ["card:houhanshu-eastern-han-auto:", "houhanshu-eastern-han-auto-candidate:"],
    ["card:sanguozhi-auto:", "sanguozhi-auto-candidate:"],
    ["card:jinshu-auto:", "jinshu-auto-candidate:"],
    ["card:jinshu-western-jin-auto:", "jinshu-western-jin-auto-candidate:"],
  ];
  for (const [cardPrefix, mentionPrefix] of patterns) {
    if (cardId.startsWith(cardPrefix)) return `${mentionPrefix}${cardId.slice(cardPrefix.length)}`;
  }
  return null;
}

function discoverBatches(db) {
  const rows = db.prepare(`
    SELECT *
    FROM import_batches
    WHERE json_extract(raw_json, '$.promotionProfile') = ?
    ORDER BY id
  `).all(profileId);
  if (!requestedBatchIds.length) return rows;
  const requested = new Set(requestedBatchIds);
  const selected = rows.filter((row) => requested.has(row.id));
  const missing = requestedBatchIds.filter((id) => !selected.some((row) => row.id === id));
  if (missing.length) throw new Error(`Batches do not use promotion profile ${profileId}: ${missing.join(", ")}`);
  return selected;
}

function loadCards(db, batchIds) {
  const placeholders = batchIds.map(() => "?").join(",");
  return db.prepare(`
    SELECT
      c.id AS card_id,
      c.batch_id,
      c.source_title,
      c.source_type,
      c.commentary_author,
      c.locator,
      c.year AS card_year,
      c.original_text,
      c.people_core_json,
      c.people_mentioned_json,
      c.places_json,
      c.macro_event,
      c.event_label,
      c.fact_brief,
      c.fact_detailed,
      c.fact_type,
      c.confidence AS card_confidence,
      c.review_status AS card_review_status,
      c.raw_json AS card_raw_json,
      COALESCE(
        json_extract(c.raw_json, '$.mentionId'),
        CASE
          WHEN c.id LIKE 'card:hanshu-auto:%' THEN 'hanshu-auto-candidate:' || substr(c.id, length('card:hanshu-auto:') + 1)
          WHEN c.id LIKE 'card:houhanshu-auto:%' THEN 'houhanshu-auto-candidate:' || substr(c.id, length('card:houhanshu-auto:') + 1)
          WHEN c.id LIKE 'card:houhanshu-eastern-han-auto:%' THEN 'houhanshu-eastern-han-auto-candidate:' || substr(c.id, length('card:houhanshu-eastern-han-auto:') + 1)
          WHEN c.id LIKE 'card:sanguozhi-auto:%' THEN 'sanguozhi-auto-candidate:' || substr(c.id, length('card:sanguozhi-auto:') + 1)
          WHEN c.id LIKE 'card:jinshu-auto:%' THEN 'jinshu-auto-candidate:' || substr(c.id, length('card:jinshu-auto:') + 1)
          WHEN c.id LIKE 'card:jinshu-western-jin-auto:%' THEN 'jinshu-western-jin-auto-candidate:' || substr(c.id, length('card:jinshu-western-jin-auto:') + 1)
          ELSE NULL
        END
      ) AS mention_id,
      COALESCE(sm.source_id, json_extract(c.raw_json, '$.sourceId')) AS source_id,
      COALESCE(sm.passage_id, json_extract(c.raw_json, '$.passageId')) AS passage_id,
      sm.year AS mention_year,
      sm.text AS mention_text,
      sm.confidence AS mention_confidence,
      sm.work_title,
      sm.book_title,
      sp.year_start AS passage_year_start,
      sp.year_end AS passage_year_end,
      json_extract(c.raw_json, '$.sourceSectionType') AS source_section_type,
      json_extract(c.raw_json, '$.sourceSectionLabel') AS source_section_label,
      COALESCE(json_extract(c.raw_json, '$.regionId'), json_extract(b.raw_json, '$.regionId'), 'china') AS region_id,
      COALESCE(json_extract(c.raw_json, '$.eventScale'), 'minor') AS event_scale
    FROM import_evidence_cards c
    JOIN import_batches b ON b.id = c.batch_id
    LEFT JOIN source_mentions sm ON sm.id = COALESCE(
      json_extract(c.raw_json, '$.mentionId'),
      CASE
        WHEN c.id LIKE 'card:hanshu-auto:%' THEN 'hanshu-auto-candidate:' || substr(c.id, length('card:hanshu-auto:') + 1)
        WHEN c.id LIKE 'card:houhanshu-auto:%' THEN 'houhanshu-auto-candidate:' || substr(c.id, length('card:houhanshu-auto:') + 1)
        WHEN c.id LIKE 'card:houhanshu-eastern-han-auto:%' THEN 'houhanshu-eastern-han-auto-candidate:' || substr(c.id, length('card:houhanshu-eastern-han-auto:') + 1)
        WHEN c.id LIKE 'card:sanguozhi-auto:%' THEN 'sanguozhi-auto-candidate:' || substr(c.id, length('card:sanguozhi-auto:') + 1)
        WHEN c.id LIKE 'card:jinshu-auto:%' THEN 'jinshu-auto-candidate:' || substr(c.id, length('card:jinshu-auto:') + 1)
        WHEN c.id LIKE 'card:jinshu-western-jin-auto:%' THEN 'jinshu-western-jin-auto-candidate:' || substr(c.id, length('card:jinshu-western-jin-auto:') + 1)
        ELSE NULL
      END
    )
    LEFT JOIN source_passages sp ON sp.id = COALESCE(sm.passage_id, json_extract(c.raw_json, '$.passageId'))
    WHERE c.batch_id IN (${placeholders})
      AND c.review_status <> 'rejected'
      AND NOT EXISTS (
        SELECT 1
        FROM import_event_cluster_members rejected_member
        JOIN import_event_clusters rejected_cluster ON rejected_cluster.id = rejected_member.cluster_id
        WHERE rejected_member.card_id = c.id
          AND rejected_cluster.review_status = 'rejected'
      )
    ORDER BY c.batch_id, c.card_index, c.id
  `).all(...batchIds);
}

function selectRequestedCards(cards) {
  if (!requestedCardIds.length) return cards;
  const requested = new Set(requestedCardIds);
  const selected = cards.filter((card) => requested.has(card.card_id));
  const missing = requestedCardIds.filter((cardId) => !selected.some((card) => card.card_id === cardId));
  if (missing.length) {
    throw new Error(`Requested cards are missing from the selected promotion batches: ${missing.join(", ")}`);
  }
  return selected;
}

function loadClustersByCard(db, batchIds) {
  const placeholders = batchIds.map(() => "?").join(",");
  const byCard = new Map();
  for (const row of db.prepare(`
    SELECT m.card_id, m.cluster_id, c.matched_event_id, c.match_status
    FROM import_event_cluster_members m
    JOIN import_event_clusters c ON c.id = m.cluster_id
    WHERE c.batch_id IN (${placeholders})
    ORDER BY m.card_id, m.cluster_id
  `).all(...batchIds)) {
    const clusters = byCard.get(row.card_id) ?? [];
    clusters.push({
      id: row.cluster_id,
      matchedEventId: row.match_status === "matched" ? row.matched_event_id : null,
    });
    byCard.set(row.card_id, clusters);
  }
  return byCard;
}

function loadPersonIndex(db) {
  const people = db.prepare("SELECT * FROM persons ORDER BY id").all();
  const byId = new Map(people.map((person) => [person.id, { ...person, names: new Set([person.name]) }]));
  const resolvableIds = new Set(people
    .filter((person) => {
      const reviewStatus = parseJson(person.raw_json).reviewStatus;
      return person.coverage_status !== "candidate"
        && !["merged", "rejected"].includes(person.coverage_status)
        && !["merged", "rejected"].includes(reviewStatus);
    })
    .map((person) => person.id));
  const usableIds = new Set(people
    .filter((person) => {
      const reviewStatus = parseJson(person.raw_json).reviewStatus;
      return !["merged", "rejected"].includes(person.coverage_status)
        && !["merged", "rejected"].includes(reviewStatus);
    })
    .map((person) => person.id));
  const idsByName = new Map();
  const primaryNames = [];
  const addName = (name, personId) => {
    const normalized = compact(name);
    if (!normalized) return;
    const ids = idsByName.get(normalized) ?? new Set();
    ids.add(personId);
    idsByName.set(normalized, ids);
    byId.get(personId)?.names.add(normalized);
  };
  for (const person of people) {
    if (resolvableIds.has(person.id)) {
      addName(person.name, person.id);
      addName(person.courtesy_name, person.id);
      const raw = parseJson(person.raw_json);
      if (
        compact(person.name).length >= 2
        && raw.generatedFrom !== "official-history-secondary-person-discovery"
      ) {
        primaryNames.push({ id: person.id, name: compact(person.name) });
      }
    }
  }
  for (const alias of db.prepare("SELECT person_id, value, type FROM person_aliases").all()) {
    if (resolvableIds.has(alias.person_id) && alias.type !== "source-variant") addName(alias.value, alias.person_id);
  }
  primaryNames.sort((left, right) => right.name.length - left.name.length || left.name.localeCompare(right.name));
  const plausibleIds = (ids, year) => [...(ids ?? [])]
    .filter((personId) => isHistoricalPersonTemporallyPlausible(byId.get(personId), year));
  return {
    byId,
    hasUsableId(personId, year = null) {
      return usableIds.has(personId)
        && isHistoricalPersonTemporallyPlausible(byId.get(personId), year);
    },
    resolveName(name, year = null) {
      const ids = idsByName.get(compact(name));
      const plausible = plausibleIds(ids, year);
      return plausible.length === 1 ? plausible[0] : null;
    },
    findInText(value, year = null) {
      const text = compact(value);
      const found = new Map();
      const processedNames = new Set();
      for (const item of primaryNames) {
        if (processedNames.has(item.name) || !text.includes(item.name)) continue;
        processedNames.add(item.name);
        const plausible = plausibleIds(idsByName.get(item.name), year);
        if (plausible.length === 1) found.set(plausible[0], byId.get(plausible[0]));
      }
      return [...found.values()];
    },
  };
}

function loadMentionPeople(db, personIndex) {
  const byMention = new Map();
  for (const row of db.prepare(`
    SELECT smp.mention_id, smp.person_id, smp.sort_order
    FROM source_mention_people smp
    ORDER BY smp.mention_id, smp.sort_order
  `).all()) {
    const person = personIndex.byId.get(row.person_id);
    if (!person) continue;
    const items = byMention.get(row.mention_id) ?? [];
    items.push({
      id: person.id,
      name: person.name,
      names: person.names,
      via: "source_mention_people",
      provisional: person.coverage_status === "candidate",
      confidence: person.life_confidence,
    });
    byMention.set(row.mention_id, items);
  }
  return byMention;
}

function collectCardPeople(card, personIndex, mentionPeople, year) {
  const byId = new Map();
  for (const person of mentionPeople.get(card.mention_id) ?? []) {
    if (personIndex.hasUsableId(person.id, year)) byId.set(person.id, person);
  }
  for (const person of personIndex.findInText(card.original_text ?? card.fact_brief, year)) {
    byId.set(person.id, { id: person.id, name: person.name, names: person.names, via: "source-text-primary-name" });
  }
  const cardRaw = parseJson(card.card_raw_json);
  const names = [
    ...parseJson(card.people_core_json, []),
    ...parseJson(card.people_mentioned_json, []),
    ...(Array.isArray(cardRaw.extractedPeople) ? cardRaw.extractedPeople : []),
    ...(Array.isArray(cardRaw.discoveredPeople) ? cardRaw.discoveredPeople : []),
  ];
  for (const item of names) {
    const rawId = typeof item === "object" && item ? item.id : null;
    const rawName = typeof item === "object" && item ? item.name : item;
    const personId = personIndex.hasUsableId(rawId, year) ? rawId : personIndex.resolveName(rawName, year);
    const person = personId ? personIndex.byId.get(personId) : null;
    const discovered = (cardRaw.discoveredPeople ?? []).find((candidate) => compact(candidate?.name) === compact(rawName));
    if (person && !byId.has(person.id)) {
      byId.set(person.id, {
        id: person.id,
        name: person.name,
        names: new Set([...person.names, discovered?.matched].filter(Boolean)),
        via: "card_people",
        provisional: person.coverage_status === "candidate",
        confidence: person.life_confidence,
      });
    } else if (person && discovered?.matched) {
      byId.get(person.id)?.names.add(discovered.matched);
    } else if (!person && rawName) {
      const name = compact(rawName);
      if (discovered?.confidence === "high" || discovered?.evidence === "source-person-context") {
        const provisionalId = rawId || discovered.id || provisionalOfficialHistoryPersonId(name, card.source_id ?? card.source_title);
        byId.set(provisionalId, {
          id: provisionalId,
          name,
          names: new Set([name, discovered.matched].filter(Boolean)),
          via: discovered.evidence ?? "strong-text-pattern",
          provisional: true,
          confidence: discovered.confidence,
        });
      }
    }
  }
  const knownNames = [...byId.values()].flatMap((person) => [...person.names]);
  for (const discovered of extractExplicitOfficialHistoryPeople(
    card.original_text ?? card.fact_brief,
    knownNames,
    { contextKey: card.source_id ?? card.source_title },
  )) {
    if (!byId.has(discovered.id)) {
      byId.set(discovered.id, {
        ...discovered,
        names: new Set([discovered.name]),
        via: discovered.evidence,
      });
    }
  }
  return [...byId.values()];
}

function loadPlaceIndex(db) {
  const byEntityId = new Map();
  const byStableId = new Map();
  const idsByName = new Map();
  const rows = db.prepare(`
    SELECT e.*, a.value AS alias_value
    FROM entities e
    LEFT JOIN entity_aliases a ON a.entity_id = e.id
    WHERE e.entity_type = 'place' AND e.review_status <> 'rejected'
    ORDER BY e.id, a.value
  `).all();
  for (const row of rows) {
    const raw = parseJson(row.raw_json);
    const entityId = row.id;
    const place = byEntityId.get(entityId) ?? {
      id: raw.stablePlaceId ?? entityId.replace(/^place:/u, ""),
      entityId,
      label: row.primary_label,
      regionId: row.region_id,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      aliases: [],
      locativeOnlyAliases: Array.isArray(raw.locativeOnlyAliases) ? raw.locativeOnlyAliases : [],
      mapFeatureNames: Array.isArray(raw.mapFeatureNames) ? raw.mapFeatureNames : [],
    };
    if (row.alias_value && row.alias_value !== place.label && !place.aliases.includes(row.alias_value)) {
      place.aliases.push(row.alias_value);
    }
    byEntityId.set(entityId, place);
    byStableId.set(place.id, place);
  }
  for (const place of byEntityId.values()) {
    for (const name of [place.label, ...place.aliases]) {
      const normalized = compact(name);
      if (!normalized) continue;
      const ids = idsByName.get(normalized) ?? new Set();
      ids.add(place.entityId);
      idsByName.set(normalized, ids);
    }
  }
  return {
    records: [...byEntityId.values()],
    byEntityId,
    byStableId,
    resolve(value) {
      if (!value) return null;
      if (byEntityId.has(value)) return byEntityId.get(value);
      if (byStableId.has(value)) return byStableId.get(value);
      const ids = idsByName.get(compact(value));
      return ids?.size === 1 ? byEntityId.get([...ids][0]) : null;
    },
  };
}

function loadMentionPlaces(db, placeIndex) {
  const byMention = new Map();
  for (const row of db.prepare(`
    SELECT mention_id, place_id, sort_order
    FROM source_mention_places
    ORDER BY mention_id, sort_order
  `).all()) {
    const place = placeIndex.resolve(row.place_id);
    if (!place) continue;
    const places = byMention.get(row.mention_id) ?? [];
    places.push({ ...place, via: "source_mention_places" });
    byMention.set(row.mention_id, places);
  }
  return byMention;
}

function collectCardPlaces(card, placeIndex, mentionPlaces) {
  const byEntityId = new Map();
  for (const place of mentionPlaces.get(card.mention_id) ?? []) byEntityId.set(place.entityId, place);
  const cardRaw = parseJson(card.card_raw_json);
  const values = [
    ...parseJson(card.places_json, []),
    ...(Array.isArray(cardRaw.extractedPlaces) ? cardRaw.extractedPlaces : []),
    ...(Array.isArray(cardRaw.candidateRepair?.placeBindings)
      ? cardRaw.candidateRepair.placeBindings
      : []),
  ];
  for (const item of values) {
    const place = placeIndex.resolve(typeof item === "object" && item ? item.entityId ?? item.id ?? item.label : item);
    if (place) {
      byEntityId.set(place.entityId, {
        ...place,
        via: "card_places",
        eventRole: typeof item === "object" && item ? item.role ?? null : null,
      });
    }
  }
  for (const place of findPlaceMentions(card.original_text ?? card.fact_brief, placeIndex.records)) {
    if (!byEntityId.has(place.entityId)) {
      byEntityId.set(place.entityId, { ...place, via: "source-text-place" });
    }
  }
  return [...byEntityId.values()];
}

function participantAppearsInTitle(title, person) {
  return [...person.names].some((name) => name.length >= 2 && title.includes(name));
}

function scopePeopleToSelectedEvent(title, sourceText, people) {
  const titlePeople = people.filter((person) => participantAppearsInTitle(title, person));
  if (!titlePeople.length) return people;
  const action = title.match(/起兵|举兵|興兵|兴兵|出征|反叛|叛|寇|讨|討|伐|攻|取|追击|追擊|击|擊|围|圍|破|斩|斬|杀|殺|诛|誅|下狱死|下獄死|降|即位|称|稱|废|廢|黜|篡|封/u)?.[0];
  const clauses = compact(sourceText).split(/[，；;]/u).map(compact).filter(Boolean);
  const selected = clauses
    .map((clause) => ({
      clause,
      score: titlePeople.reduce(
        (sum, person) => sum + ([...person.names].some((name) => name.length >= 2 && clause.includes(name)) ? 10 : 0),
        action && clause.includes(action) ? 3 : 0,
      ),
    }))
    .sort((left, right) => right.score - left.score || left.clause.length - right.clause.length)[0];
  if (!selected?.score) return people;
  const scoped = people.filter((person) =>
    [...person.names].some((name) => name.length >= 2 && selected.clause.includes(name)));
  const selectedPeople = new Map([...titlePeople, ...scoped].map((person) => [person.id, person]));
  return selectedPeople.size ? [...selectedPeople.values()] : people;
}

function canonicalizeProfileProvisionalPeople(people) {
  if (!profile.mergeProvisionalPeopleByName) return people;
  const byId = new Map();
  for (const person of people) {
    const canonicalId = canonicalProvisionalOfficialHistoryPersonId(person, {
      profileId,
      mergeByName: profile.mergeProvisionalPeopleByName,
      scopedEvidence: profile.scopedProvisionalPersonEvidence,
    });
    const existing = byId.get(canonicalId);
    if (existing) {
      for (const name of person.names) existing.names.add(name);
      continue;
    }
    byId.set(canonicalId, { ...person, id: canonicalId, names: new Set(person.names) });
  }
  return [...byId.values()];
}

function inferPeriodId(db, regionId, year) {
  if (!Number.isInteger(year)) return null;
  return db.prepare(`
    SELECT id
    FROM periods
    WHERE region_id = ? AND time_start <= ? AND time_end >= ?
    ORDER BY (time_end - time_start), id
    LIMIT 1
  `).get(regionId, year, year)?.id ?? null;
}

function inferPersonPeriodId(db, person) {
  const lifePeriodId = inferPeriodId(db, person.region, person.birth_year ?? person.death_year);
  if (lifePeriodId) return lifePeriodId;

  const raw = parseJson(person.raw_json);
  const candidates = [raw.periodId, raw.periodHint, raw.profileId, raw.promotionProfile];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate) continue;
    const periodId = candidate.replace(/-v\d+$/u, "");
    const period = db.prepare("SELECT id FROM periods WHERE id = ? AND region_id = ? LIMIT 1").get(periodId, person.region);
    if (period) return period.id;
  }
  return null;
}

function buildProposals(cards, eras, clustersByCard, personIndex, mentionPeople, placeIndex, mentionPlaces) {
  const groups = new Map();
  const skipped = {
    commentary: 0,
    disallowedSection: 0,
    weakChronology: 0,
    weakTitle: 0,
    editorialNotEligible: 0,
    semanticNotEligible: 0,
    unresolvedDate: 0,
    nonExactDate: 0,
    excludedYear: 0,
    noPeople: 0,
    noNamedParticipant: 0,
    ambiguousRole: 0,
    outsideProfileWindow: 0,
  };
  const skippedSamples = Object.fromEntries(Object.keys(skipped).map((reason) => [reason, []]));
  const skip = (reason, card, details = {}) => {
    skipped[reason] += 1;
    if (skippedSamples[reason].length < 16) {
      skippedSamples[reason].push({
        cardId: card.card_id,
        sourceTitle: card.source_title,
        locator: card.locator,
        text: truncate(card.original_text ?? card.fact_brief, 240),
        ...details,
      });
    }
  };

  for (const card of cards) {
    const cardRaw = parseJson(card.card_raw_json);
    const sourceSectionType = cardRaw.sourceSectionType ?? null;
    const sentenceChronology = cardRaw.sentenceChronology ?? null;
    const promotionEligibility = officialHistoryCandidatePromotionEligibility(cardRaw);
    if (!promotionEligibility.eligible) {
      skip(promotionEligibility.reason, card, promotionEligibility);
      continue;
    }
    const editorialCollectiveEvent = allowsEditorialCollectivePromotion(cardRaw);
    if (card.commentary_author || isOfficialHistoryCommentaryText(card.original_text)) {
      skip("commentary", card);
      continue;
    }
    if (
      profile.allowedSourceSectionTypes?.length
      && !profile.allowedSourceSectionTypes.includes(sourceSectionType)
    ) {
      skip("disallowedSection", card, { sourceSectionType });
      continue;
    }
    if (
      profile.minimumChronologyConfidence === "high"
      && sentenceChronology?.confidence !== "high"
    ) {
      skip("weakChronology", card, {
        chronologyMethod: sentenceChronology?.method ?? null,
        chronologyConfidence: sentenceChronology?.confidence ?? null,
      });
      continue;
    }
    const resolvedRegnalDate = resolveChinaRegnalDate(card.original_text ?? card.fact_brief, eras, card);
    const resolvedTime = resolveBoundedTime({
      cardYear: card.card_year,
      mentionYear: card.mention_year,
      resolvedDate: resolvedRegnalDate,
      passageStart: card.passage_year_start,
      passageEnd: card.passage_year_end,
    });
    const time = applyEditorialChronology(resolvedTime, cardRaw.candidateRepair?.chronology);
    if (time.precision === "unknown") {
      skip("unresolvedDate", card, { time });
      continue;
    }
    const editorialExactRange = time.precision === "range"
      && Number.isInteger(cardRaw.candidateRepair?.chronology?.year)
      && Number.isInteger(cardRaw.candidateRepair?.chronology?.endYear)
      && Number.isInteger(time.start)
      && Number.isInteger(time.end);
    if ((time.precision !== "year" || time.start !== time.end) && !editorialExactRange) {
      skip("nonExactDate", card, { time });
      continue;
    }
    if (profile.excludedYears?.some((year) => year >= time.start && year <= time.end)) {
      skip("excludedYear", card, { year: time.start });
      continue;
    }
    if (
      card.region_id !== profile.regionId
      || time.start < profile.timeStart
      || time.end > profile.timeEnd
    ) {
      skip("outsideProfileWindow", card, { year: time.start });
      continue;
    }
    let people = canonicalizeProfileProvisionalPeople(
      collectCardPeople(card, personIndex, mentionPeople, time.start),
    );
    const explicitPersonIds = new Set(
      (cardRaw.candidateRepair?.personBindings ?? []).map((binding) => binding.personId),
    );
    const removedPersonNames = new Set(
      (cardRaw.candidateRepair?.removePersonNames ?? []).map(compact),
    );
    const removedPersonIds = new Set(cardRaw.candidateRepair?.removePersonIds ?? []);
    if (removedPersonNames.size || removedPersonIds.size) {
      people = people.filter((person) => (
        explicitPersonIds.has(person.id)
        || (!removedPersonIds.has(person.id) && !removedPersonNames.has(compact(person.name)))
      ));
    }
    const preferredNames = [...new Set(people.flatMap((person) => [...person.names]))];
    const editorialTitle = compact(cardRaw.candidateRepair?.title);
    const editorialSummary = compact(cardRaw.candidateRepair?.summary);
    let title = normalizeOfficialHistoryEventTitle(
      editorialTitle || card.event_label,
      editorialTitle || card.fact_brief,
      card.fact_type,
      card.event_scale,
      preferredNames,
    );
    if (!title) {
      skip("weakTitle", card, { year: time.start });
      continue;
    }
    title = canonicalizeOfficialHistoryTitlePersonAliases(
      title,
      people,
      profile.scopedProvisionalPersonEvidence,
    );
    title = canonicalizeOfficialHistoryGrantTitle(title, people);
    const preserveAllBoundPeople = cardRaw.candidateRepair?.preserveAllBoundPeople === true;
    if (!preserveAllBoundPeople) {
      people = scopePeopleToSelectedEvent(title, card.original_text ?? card.fact_brief, people);
    }
    if (!people.length && !editorialCollectiveEvent) {
      skip("noPeople", card, { title, year: time.start });
      continue;
    }
    const namedParticipants = people.filter((person) => participantAppearsInTitle(title, person));
    if (!namedParticipants.length && !canPromoteWithoutNamedParticipant(title) && !editorialCollectiveEvent) {
      skip("noNamedParticipant", card, { title, year: time.start, people: people.map((person) => person.name) });
      continue;
    }
    if (
      !titleHasNamedActor(title, people)
      && !titleHasNamedGrantRecipient(title, people)
      && !canPromoteWithoutNamedParticipant(title)
      && !editorialCollectiveEvent
    ) {
      skip("noNamedParticipant", card, { title, year: time.start, people: people.map((person) => person.name) });
      continue;
    }
    const roleAuditReasons = officialHistoryRoleAuditReasons(title, card.original_text, people)
      .filter((reason) => !(preserveAllBoundPeople && reason === "partial-coordinated-actor"));
    if (roleAuditReasons.length) {
      skip("ambiguousRole", card, { title, year: time.start, people: people.map((person) => person.name) });
      continue;
    }
    const mentionedPlaces = collectCardPlaces(card, placeIndex, mentionPlaces);
    const titlePlacePool = [...mentionedPlaces];
    for (const place of findPlaceMentions(title, placeIndex.records)) {
      const placeNames = new Set([place.label, ...(place.aliases ?? [])].map(compact).filter(Boolean));
      const conflictsWithPerson = people.some((person) =>
        [...person.names].some((name) => placeNames.has(compact(name))));
      if (conflictsWithPerson) continue;
      if (!titlePlacePool.some((item) => item.entityId === place.entityId)) titlePlacePool.push(place);
    }
    const { places: namedPlaces, primaryPlace } = chooseOfficialHistoryEventPlaces(title, titlePlacePool);

    const identityTitle = normalizedOfficialHistoryIdentity(title);
    const primaryParticipantId = namedParticipants.map((person) => person.id).sort()[0] ?? "collective";
    const identityKey = [profileId, card.region_id, time.start, time.end, identityTitle, primaryParticipantId].join(":");
    const clusters = clustersByCard.get(card.card_id) ?? [];
    const item = {
      ...card,
      title,
      time,
      people,
      namedParticipants,
      namedPlaces,
      primaryPlace,
      clusterIds: clusters.map((cluster) => cluster.id),
      clusterMatchedEventIds: clusters.map((cluster) => cluster.matchedEventId).filter(Boolean),
      editorialMatchedEventId: cardRaw.candidateRepair?.matchedEventId ?? null,
      evidenceKey: independentEvidenceKey(card),
      editorialSummary,
    };
    const group = groups.get(identityKey) ?? {
      identityKey,
      title,
      regionId: card.region_id,
      year: time.start,
      endYear: time.end,
      factType: card.fact_type,
      eventScale: card.event_scale,
      cards: [],
      peopleById: new Map(),
      namedParticipantIds: new Set(),
      placesByEntityId: new Map(),
      namedPlaceEntityIds: new Set(),
      primaryPlaceEntityId: null,
      clusterMatchedEventIds: new Set(),
      editorialMatchedEventIds: new Set(),
      editorialSummaries: new Set(),
    };
    group.cards.push(item);
    for (const person of people) group.peopleById.set(person.id, person);
    for (const person of namedParticipants) group.namedParticipantIds.add(person.id);
    for (const place of namedPlaces) group.placesByEntityId.set(place.entityId, place);
    for (const place of namedPlaces) group.namedPlaceEntityIds.add(place.entityId);
    for (const eventId of item.clusterMatchedEventIds) group.clusterMatchedEventIds.add(eventId);
    if (item.editorialMatchedEventId) group.editorialMatchedEventIds.add(item.editorialMatchedEventId);
    if (item.editorialSummary) group.editorialSummaries.add(item.editorialSummary);
    if (!group.primaryPlaceEntityId && primaryPlace) group.primaryPlaceEntityId = primaryPlace.entityId;
    groups.set(identityKey, group);
  }

  const proposals = [...groups.values()].map((group) => {
    group.cards.sort((left, right) => left.card_id.localeCompare(right.card_id));
    const uniqueEvidence = new Map(group.cards.map((card) => [card.evidenceKey, card]));
    const cardsForEvidence = [...uniqueEvidence.values()];
    const people = [...group.peopleById.values()];
    const places = [...group.placesByEntityId.values()];
    const sourceRefs = cardsForEvidence.map((card) => ({
      sourceId: card.source_id,
      sourceTitle: card.source_title,
      locator: card.locator,
      mentionId: card.mention_id,
      cardId: card.card_id,
    }));
    if (group.editorialSummaries.size > 1) {
      throw new Error(`Conflicting editorial summaries for ${group.identityKey}`);
    }
    const editorialSummary = [...group.editorialSummaries][0] ?? null;
    return {
      ...group,
      cards: cardsForEvidence,
      people,
      places,
      primaryPlace: group.primaryPlaceEntityId
        ? places.find((place) => place.entityId === group.primaryPlaceEntityId) ?? null
        : places.length === 1 ? places[0] : null,
      anchorCardId: cardsForEvidence[0].card_id,
      clusterIds: [...new Set(cardsForEvidence.flatMap((card) => card.clusterIds))],
      clusterMatchedEventIds: [...group.clusterMatchedEventIds],
      editorialMatchedEventIds: [...group.editorialMatchedEventIds],
      sourceRefs,
      sourceCount: new Set(cardsForEvidence.map((card) => card.source_id).filter(Boolean)).size,
      summary: editorialSummary
        ?? cleanOfficialHistorySummary(cardsForEvidence[0].fact_brief ?? cardsForEvidence[0].original_text, group.title),
      eventType: eventTypeForOfficialHistory(group.factType, group.title),
      confidence: cardsForEvidence.length >= 2 ? "medium" : "low",
    };
  });
  proposals.sort((left, right) => left.year - right.year || left.title.localeCompare(right.title));
  return { proposals, skipped, skippedSamples };
}

function ensureDiscoveredPeople(db, proposals) {
  const discovered = new Map();
  for (const proposal of proposals) {
    for (const person of proposal.people) {
      if (!person.provisional) continue;
      const item = discovered.get(person.id) ?? { person, proposals: [] };
      item.proposals.push(proposal);
      discovered.set(person.id, item);
    }
  }
  const insert = db.prepare(`
    INSERT INTO persons (
      id, region, name, courtesy_name, life, birth_year, death_year,
      life_confidence, primary_polity, summary, coverage_status, raw_json
    ) VALUES (?, 'china', ?, NULL, NULL, NULL, NULL, 'low', NULL, ?, 'candidate', ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      summary = excluded.summary,
      life_confidence = excluded.life_confidence,
      coverage_status = excluded.coverage_status,
      raw_json = excluded.raw_json
    WHERE json_extract(persons.raw_json, '$.generatedFrom') = 'official-history-secondary-person-discovery'
      AND COALESCE(json_extract(persons.raw_json, '$.reviewStatus'), 'needs-review')
        NOT IN ('reviewed', 'approved', 'merged', 'rejected')
  `);
  const insertAlias = db.prepare(`
    INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
    VALUES (?, ?, ?, 'historical-title', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      person_id = excluded.person_id,
      value = excluded.value,
      type = excluded.type,
      source_refs_json = excluded.source_refs_json,
      raw_json = excluded.raw_json
  `);
  let inserted = 0;
  let updated = 0;
  for (const { person, proposals: relatedProposals } of discovered.values()) {
    const existed = Boolean(db.prepare("SELECT 1 FROM persons WHERE id = ?").get(person.id));
    const sourceRefs = relatedProposals.flatMap((proposal) => proposal.sourceRefs).slice(0, 16);
    insert.run(
      person.id,
      person.name,
      `${person.name}由正史事件句中的明确官职或阵营姓名结构识别；生卒、字与完整仕历待人工核定。`,
      toJson({
        generatedFrom: "official-history-secondary-person-discovery",
        generator: generatorId,
        profileId,
        reviewStatus: "needs-review",
        discoveryConfidence: person.confidence ?? "high",
        discoveryEvidence: person.via,
        sourceRefs,
      }),
    );
    for (const alias of [...person.names].filter((name) => name && name !== person.name)) {
      insertAlias.run(
        `official-history-person-alias:${stableId(`${person.id}:${alias}`)}`,
        person.id,
        alias,
        toJson(sourceRefs),
        toJson({
          generatedFrom: "official-history-secondary-person-discovery",
          generator: generatorId,
          profileId,
          reviewStatus: "needs-review",
        }),
      );
    }
    if (existed) updated += 1;
    else inserted += 1;
  }
  return { candidates: discovered.size, inserted, updated };
}

function cleanupStaleDiscoveredPeople(db, proposals) {
  const activeIds = new Set(
    proposals.flatMap((proposal) => proposal.people.filter((person) => person.provisional).map((person) => person.id)),
  );
  const candidates = db.prepare(`
    SELECT p.id, e.id AS entity_id, e.review_status
    FROM persons p
    LEFT JOIN entities e ON e.id = 'person:' || p.id
    WHERE json_extract(p.raw_json, '$.generatedFrom') = 'official-history-secondary-person-discovery'
      AND json_extract(p.raw_json, '$.profileId') = ?
    ORDER BY p.id
  `).all(profileId);
  let deleted = 0;
  let preserved = 0;
  for (const person of candidates) {
    if (activeIds.has(person.id)) continue;
    const hasEventLinks = person.entity_id
      ? Boolean(db.prepare("SELECT 1 FROM event_entities WHERE entity_id = ? LIMIT 1").get(person.entity_id))
      : false;
    const hasMentionLinks = Boolean(db.prepare("SELECT 1 FROM source_mention_people WHERE person_id = ? LIMIT 1").get(person.id));
    const hasRelations = person.entity_id
      ? Boolean(db.prepare("SELECT 1 FROM entity_relations WHERE source_entity_id = ? OR target_entity_id = ? LIMIT 1").get(person.entity_id, person.entity_id))
      : false;
    if (hasEventLinks || hasMentionLinks || hasRelations || ["reviewed", "approved"].includes(person.review_status)) {
      preserved += 1;
      continue;
    }
    db.prepare("DELETE FROM source_mention_people WHERE person_id = ?").run(person.id);
    if (person.entity_id) {
      db.prepare("DELETE FROM document_chunk_entities WHERE entity_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM document_chunks WHERE search_document_id IN (SELECT id FROM search_documents WHERE subject_table = 'entities' AND subject_id = ?)").run(person.entity_id);
      db.prepare("DELETE FROM search_documents WHERE subject_table = 'entities' AND subject_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM map_feature_entities WHERE entity_id = ?").run(person.entity_id);
      db.prepare("UPDATE map_features SET entity_id = NULL WHERE entity_id = ?").run(person.entity_id);
      db.prepare("UPDATE map_controllers SET entity_id = NULL WHERE entity_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM entity_aliases WHERE entity_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM entities WHERE id = ?").run(person.entity_id);
    }
    db.prepare("DELETE FROM person_aliases WHERE person_id = ?").run(person.id);
    db.prepare("DELETE FROM persons WHERE id = ?").run(person.id);
    deleted += 1;
  }
  return { active: activeIds.size, deleted, preserved };
}

function cleanupOrphanedDiscoveredPeople(db, personIds) {
  const uniqueIds = [...new Set(personIds)].filter(Boolean);
  if (!uniqueIds.length) return { deleted: 0, preserved: 0 };
  const selectCandidate = db.prepare(`
    SELECT p.id, e.id AS entity_id, e.review_status
    FROM persons p
    LEFT JOIN entities e ON e.id = 'person:' || p.id
    WHERE p.id = ?
      AND json_extract(p.raw_json, '$.generatedFrom') = 'official-history-secondary-person-discovery'
      AND json_extract(p.raw_json, '$.profileId') = ?
  `);
  let deleted = 0;
  let preserved = 0;
  for (const personId of uniqueIds) {
    const person = selectCandidate.get(personId, profileId);
    if (!person) continue;
    const hasEventLinks = person.entity_id
      ? Boolean(db.prepare("SELECT 1 FROM event_entities WHERE entity_id = ? LIMIT 1").get(person.entity_id))
      : false;
    const hasMentionLinks = Boolean(db.prepare("SELECT 1 FROM source_mention_people WHERE person_id = ? LIMIT 1").get(person.id));
    const hasRelations = person.entity_id
      ? Boolean(db.prepare("SELECT 1 FROM entity_relations WHERE source_entity_id = ? OR target_entity_id = ? LIMIT 1").get(person.entity_id, person.entity_id))
      : false;
    if (hasEventLinks || hasMentionLinks || hasRelations || ["reviewed", "approved"].includes(person.review_status)) {
      preserved += 1;
      continue;
    }
    if (person.entity_id) {
      db.prepare("DELETE FROM document_chunk_entities WHERE entity_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM document_chunks WHERE search_document_id IN (SELECT id FROM search_documents WHERE subject_table = 'entities' AND subject_id = ?)").run(person.entity_id);
      db.prepare("DELETE FROM search_documents WHERE subject_table = 'entities' AND subject_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM map_feature_entities WHERE entity_id = ?").run(person.entity_id);
      db.prepare("UPDATE map_features SET entity_id = NULL WHERE entity_id = ?").run(person.entity_id);
      db.prepare("UPDATE map_controllers SET entity_id = NULL WHERE entity_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM entity_aliases WHERE entity_id = ?").run(person.entity_id);
      db.prepare("DELETE FROM entities WHERE id = ?").run(person.entity_id);
    }
    db.prepare("DELETE FROM person_aliases WHERE person_id = ?").run(person.id);
    db.prepare("DELETE FROM persons WHERE id = ?").run(person.id);
    deleted += 1;
  }
  return { deleted, preserved };
}

function ensurePersonCards(db) {
  const selectEquivalentEvidence = db.prepare(`
    SELECT id
    FROM evidence_links
    WHERE subject_table = 'events'
      AND subject_id = ?
      AND source_id = ?
      AND COALESCE(passage_id, '') = COALESCE(?, '')
      AND COALESCE(quote, '') = COALESCE(?, '')
    LIMIT 1
  `);
  const deleteDuplicateGeneratedEvidence = db.prepare(`
    DELETE FROM evidence_links
    WHERE id IN (
      SELECT duplicate.id
      FROM evidence_links duplicate
      JOIN evidence_links retained
        ON retained.subject_table = duplicate.subject_table
       AND retained.subject_id = duplicate.subject_id
       AND retained.source_id = duplicate.source_id
       AND COALESCE(retained.passage_id, '') = COALESCE(duplicate.passage_id, '')
       AND COALESCE(retained.quote, '') = COALESCE(duplicate.quote, '')
       AND retained.id < duplicate.id
      WHERE duplicate.subject_table = 'events'
        AND duplicate.subject_id = ?
        AND json_extract(duplicate.raw_json, '$.generator') = ?
        AND json_extract(retained.raw_json, '$.generator') = ?
    )
  `);
  const insertEntity = db.prepare(`
    INSERT INTO entities (
      id, entity_type, primary_label, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    ) VALUES (?, 'person', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      primary_label = excluded.primary_label,
      region_id = COALESCE(entities.region_id, excluded.region_id),
      time_start = COALESCE(entities.time_start, excluded.time_start),
      time_end = COALESCE(entities.time_end, excluded.time_end),
      summary = COALESCE(NULLIF(entities.summary, ''), excluded.summary),
      confidence = COALESCE(entities.confidence, excluded.confidence),
      review_status = CASE
        WHEN entities.review_status IN ('reviewed', 'approved', 'rejected') THEN entities.review_status
        WHEN excluded.review_status = 'needs-review' THEN 'needs-review'
        WHEN entities.review_status IN ('draft', 'needs-review') THEN entities.review_status
        ELSE 'draft'
      END,
      raw_json = CASE
        WHEN entities.raw_json IS NULL OR entities.raw_json = '{}' THEN excluded.raw_json
        ELSE entities.raw_json
      END
  `);
  const insertEntityAlias = db.prepare(`
    INSERT INTO entity_aliases (
      id, entity_id, value, alias_type, language, context_source_id,
      valid_start, valid_end, raw_json
    ) VALUES (?, ?, ?, ?, 'zh-Hans', NULL, NULL, NULL, ?)
    ON CONFLICT(id) DO UPDATE SET
      entity_id = excluded.entity_id,
      value = excluded.value,
      alias_type = excluded.alias_type,
      language = excluded.language,
      context_source_id = excluded.context_source_id,
      valid_start = excluded.valid_start,
      valid_end = excluded.valid_end,
      raw_json = excluded.raw_json
  `);
  const insertSearch = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, 'entities', ?, ?, ?, 'zh-Hans', ?, ?, 'person', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      region_id = excluded.region_id,
      period_id = excluded.period_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);
  const normalizeSearchReview = db.prepare(`
    UPDATE search_documents
    SET review_status = ?
    WHERE subject_table = 'entities'
      AND subject_id = ?
      AND review_status <> ?
  `);
  const normalizeSearchPeriod = db.prepare(`
    UPDATE search_documents
    SET region_id = ?, period_id = ?
    WHERE subject_table = 'entities'
      AND subject_id = ?
      AND period_id IS NOT ?
  `);
  const normalizeEntityCivilization = db.prepare(`
    UPDATE entities
    SET civilization_id = NULL
    WHERE id = ?
      AND entity_type = 'person'
      AND civilization_id = 'china-three-kingdoms'
      AND ? NOT LIKE 'china-three-kingdoms-%'
  `);
  const normalizeProfileEventPersonCivilizations = db.prepare(`
    UPDATE entities
    SET civilization_id = NULL
    WHERE entity_type = 'person'
      AND civilization_id = 'china-three-kingdoms'
      AND ? NOT LIKE 'china-three-kingdoms-%'
      AND (
        json_extract(entities.raw_json, '$.profileId') = ?
        OR EXISTS (
          SELECT 1
          FROM event_entities ee
          JOIN events e ON e.id = ee.event_id
          WHERE ee.entity_id = entities.id
            AND json_extract(e.raw_json, '$.profileId') = ?
        )
      )
  `);
  let entitiesUpserted = 0;
  let entityAliasesUpserted = 0;
  let searchDocsUpserted = 0;
  let searchDocsNormalized = 0;
  let searchDocsPeriodNormalized = 0;
  let entityCivilizationsNormalized = 0;
  let profileEventEntityCivilizationsNormalized = 0;
  for (const person of db.prepare("SELECT * FROM persons ORDER BY region, id").all()) {
    const entityId = `person:${person.id}`;
    const raw = parseJson(person.raw_json);
    entitiesUpserted += insertEntity.run(
      entityId,
      person.name,
      person.region,
      person.birth_year,
      person.death_year,
      person.summary,
      person.life_confidence ?? "medium",
      raw.reviewStatus === "needs-review" ? "needs-review" : "draft",
      toJson({
        ...raw,
        generatedFrom: raw.generatedFrom ?? "person-entity-projection",
        legacyPersonId: person.id,
        courtesyName: person.courtesy_name,
        primaryPolity: person.primary_polity,
        coverageStatus: person.coverage_status,
      }),
    ).changes;
    const entity = db.prepare("SELECT review_status FROM entities WHERE id = ?").get(entityId);
    const aliases = db.prepare(`
      SELECT id, value, type, raw_json
      FROM person_aliases
      WHERE person_id = ?
      ORDER BY value, id
    `).all(person.id);
    for (const alias of aliases) {
      entityAliasesUpserted += insertEntityAlias.run(
        `person-alias:${alias.id}`,
        entityId,
        alias.value,
        alias.type,
        alias.raw_json,
      ).changes;
    }
    const body = compact([
      person.name,
      person.courtesy_name ? `字 ${person.courtesy_name}` : "",
      ...aliases.map((alias) => alias.value),
      person.life,
      person.primary_polity,
      person.summary,
    ].join(" "));
    const reviewStatus = entity?.review_status ?? "draft";
    const periodId = inferPersonPeriodId(db, person);
    searchDocsUpserted += insertSearch.run(
      `person-card:${entityId}`,
      entityId,
      person.name,
      body || person.name,
      person.region,
      periodId,
      person.birth_year,
      person.death_year,
      reviewStatus,
      toJson({ generatedFrom: "person-entity-projection", entityId, legacyPersonId: person.id, coverageStatus: person.coverage_status }),
    ).changes;
    searchDocsNormalized += normalizeSearchReview.run(reviewStatus, entityId, reviewStatus).changes;
    if (periodId) {
      searchDocsPeriodNormalized += normalizeSearchPeriod.run(person.region, periodId, entityId, periodId).changes;
      entityCivilizationsNormalized += normalizeEntityCivilization.run(entityId, periodId).changes;
    }
  }
  profileEventEntityCivilizationsNormalized += normalizeProfileEventPersonCivilizations.run(profileId, profileId, profileId).changes;
  return {
    entitiesUpserted,
    entityAliasesUpserted,
    searchDocsUpserted,
    searchDocsNormalized,
    searchDocsPeriodNormalized,
    entityCivilizationsNormalized,
    profileEventEntityCivilizationsNormalized,
  };
}

function existingEventState(db) {
  const events = db.prepare("SELECT * FROM events").all();
  const byId = new Map(events.map((event) => [event.id, event]));
  const curatedByIdentity = new Map();
  const curatedEvents = [];
  for (const event of events) {
    if (event.id.startsWith("life:") || event.id.startsWith("official-history-event:")) continue;
    curatedEvents.push(event);
    if (!Number.isInteger(event.time_start) || event.time_start !== (event.time_end ?? event.time_start)) continue;
    const key = [event.region_id, event.time_start, normalizedOfficialHistoryIdentity(event.title)].join(":");
    if (!curatedByIdentity.has(key)) curatedByIdentity.set(key, event.id);
    else curatedByIdentity.set(key, null);
  }
  const linksByCard = new Map();
  for (const row of db.prepare("SELECT card_id, event_id FROM event_import_cards WHERE generator = ?").all(generatorId)) {
    const ids = linksByCard.get(row.card_id) ?? [];
    ids.push(row.event_id);
    linksByCard.set(row.card_id, ids);
  }
  return { events, byId, curatedEvents, curatedByIdentity, linksByCard };
}

function proposalRelativeIdentity(title, people) {
  let value = compact(title);
  const sortedPeople = [...people].sort((left, right) => left.id.localeCompare(right.id));
  sortedPeople.forEach((person, index) => {
    const token = `P${index}P`;
    for (const name of [...person.names].filter(Boolean).sort((left, right) => right.length - left.length)) {
      value = value.split(name).join(token);
    }
  });
  return normalizedOfficialHistoryIdentity(value.replace(/[\p{Script=Han}]{1,4}王(?=P\d+P)/gu, ""));
}

function sovereigntyIdentity(title) {
  const normalized = normalizedOfficialHistoryIdentity(title);
  if (normalized.includes("称帝")) return "称帝";
  const royalTitle = normalized.match(/称([\p{Script=Han}]{1,4}?)王/u)?.[1];
  if (royalTitle) return `称${royalTitle}`;
  if (normalized.includes("称汉")) return "称汉";
  return null;
}

function eventMentionsProposalPerson(event, proposal) {
  return proposal.people.some((person) =>
    [...person.names].some((name) => name.length >= 2 && event.title.includes(name)));
}

function chooseEventId(proposal, state) {
  const editorialMatchedIds = [...new Set(proposal.editorialMatchedEventIds)]
    .filter((eventId) => {
      const event = state.byId.get(eventId);
      return isCompatibleClusterMatchedEvent(event, {
        profileId,
        regionId: proposal.regionId,
        year: proposal.year,
        endYear: proposal.endYear,
        allowMachineChronologyCorrection: true,
        allowCrossProfileMachineEvent: true,
      });
    });
  const linkedIds = [...new Set(proposal.cards.flatMap((card) => state.linksByCard.get(card.card_id) ?? []))]
    .filter((eventId) => state.byId.has(eventId));
  if (linkedIds.length) {
    linkedIds.sort((left, right) => {
      const leftManual = isMachineMutableReviewStatus(state.byId.get(left)?.review_status) ? 1 : 0;
      const rightManual = isMachineMutableReviewStatus(state.byId.get(right)?.review_status) ? 1 : 0;
      return leftManual - rightManual || left.localeCompare(right);
    });
  }
  const provenanceMatch = selectPromotionProvenanceMatch({
    editorialMatchedEventIds: editorialMatchedIds,
    linkedEventIds: linkedIds,
  });
  if (provenanceMatch?.conflictingEventIds) {
    throw new Error(
      `Conflicting editorial event matches for ${proposal.identityKey}: ${provenanceMatch.conflictingEventIds.join(", ")}`,
    );
  }
  if (provenanceMatch) return provenanceMatch;
  const clusterCuratedIds = [...new Set(proposal.clusterMatchedEventIds)]
    .filter((eventId) => {
      const event = state.byId.get(eventId);
      return isCompatibleClusterMatchedEvent(event, {
        profileId,
        regionId: proposal.regionId,
        year: proposal.year,
        endYear: proposal.endYear,
      });
    });
  if (clusterCuratedIds.length === 1) {
    return { eventId: clusterCuratedIds[0], matchType: "cluster-curated-event" };
  }
  const curatedKey = proposal.year === proposal.endYear
    ? [proposal.regionId, proposal.year, normalizedOfficialHistoryIdentity(proposal.title)].join(":")
    : null;
  const curatedId = curatedKey ? state.curatedByIdentity.get(curatedKey) : null;
  if (curatedId) return { eventId: curatedId, matchType: "exact-curated-event" };
  const sameYearCurated = state.curatedEvents.filter((event) =>
    event.region_id === proposal.regionId
      && event.time_start === proposal.year
      && (event.time_end ?? event.time_start) === proposal.endYear,
  );
  const semanticIdentity = proposalRelativeIdentity(proposal.title, proposal.people);
  const semanticMatches = sameYearCurated.filter(
    (event) => proposalRelativeIdentity(event.title, proposal.people) === semanticIdentity,
  );
  if (semanticMatches.length === 1) {
    return { eventId: semanticMatches[0].id, matchType: "semantic-curated-event" };
  }
  const proposalSovereignty = sovereigntyIdentity(proposal.title);
  const sovereigntyMatches = proposalSovereignty
    ? sameYearCurated.filter((event) =>
      sovereigntyIdentity(event.title) === proposalSovereignty
        && eventMentionsProposalPerson(event, proposal))
    : [];
  if (sovereigntyMatches.length === 1) {
    return { eventId: sovereigntyMatches[0].id, matchType: "sovereignty-curated-event" };
  }
  const normalizedTitle = normalizedOfficialHistoryIdentity(proposal.title);
  const containmentMatches = sameYearCurated.filter((event) => {
    const eventTitle = normalizedOfficialHistoryIdentity(event.title);
    if (normalizedTitle.length < 4 || (!eventTitle.includes(normalizedTitle) && !normalizedTitle.includes(eventTitle))) return false;
    return eventMentionsProposalPerson(event, proposal);
  });
  if (containmentMatches.length === 1) {
    return { eventId: containmentMatches[0].id, matchType: "contained-curated-event" };
  }
  return { eventId: generatedEventId(profileId, proposal.anchorCardId), matchType: "generated" };
}

function resolvePlaceMapFeatures(db, place, year) {
  if (!place?.mapFeatureNames?.length || !Number.isInteger(year)) return [];
  const placeholders = place.mapFeatureNames.map(() => "?").join(",");
  const rows = db.prepare(`
    SELECT mf.id, mf.dataset_id, mf.name, mf.feature_type, mg.time_start, mg.time_end
    FROM map_features mf
    JOIN map_geometry_datasets mg ON mg.id = mf.dataset_id
    WHERE mf.name IN (${placeholders})
      AND mf.feature_type NOT LIKE '%fragment'
      AND COALESCE(mg.time_start, ?) <= ?
      AND COALESCE(mg.time_end, ?) >= ?
      AND (mg.region_id IS NULL OR mg.region_id = ?)
    ORDER BY (COALESCE(mg.time_end, ?) - COALESCE(mg.time_start, ?)), mg.time_start DESC, mf.id
  `).all(...place.mapFeatureNames, year, year, year, year, place.regionId, year, year);
  const selectedDataset = rows[0]?.dataset_id;
  return selectedDataset ? rows.filter((row) => row.dataset_id === selectedDataset) : [];
}

function writeProposals(db, proposals, state, batchIds) {
  const insertEvent = db.prepare(`
    INSERT INTO events (
      id, title, event_type, time_start, time_end, display_time, time_precision,
      region_id, place_entity_id, summary, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'needs-review', ?)
  `);
  const updateEvent = db.prepare(`
    UPDATE events
    SET title = ?, event_type = ?, time_start = ?, time_end = ?, display_time = ?,
        time_precision = ?, region_id = ?, place_entity_id = ?, summary = ?, confidence = ?,
        review_status = 'needs-review', raw_json = ?
    WHERE id = ?
  `);
  const updateEventRaw = db.prepare("UPDATE events SET raw_json = ? WHERE id = ?");
  const insertSearch = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, 'events', ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      title = excluded.title,
      body = excluded.body,
      region_id = excluded.region_id,
      period_id = excluded.period_id,
      topic_id = excluded.topic_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);
  const insertEvidence = db.prepare(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    ) VALUES (?, 'events', ?, ?, ?, ?, ?, ?, 'support', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      mention_id = excluded.mention_id,
      locator = excluded.locator,
      quote = excluded.quote,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);
  const selectEquivalentEvidence = db.prepare(`
    SELECT id
    FROM evidence_links
    WHERE subject_table = 'events'
      AND subject_id = ?
      AND source_id = ?
      AND COALESCE(passage_id, '') = COALESCE(?, '')
      AND COALESCE(quote, '') = COALESCE(?, '')
    LIMIT 1
  `);
  const deleteDuplicateGeneratedEvidence = db.prepare(`
    DELETE FROM evidence_links
    WHERE id IN (
      SELECT duplicate.id
      FROM evidence_links duplicate
      JOIN evidence_links retained
        ON retained.subject_table = duplicate.subject_table
       AND retained.subject_id = duplicate.subject_id
       AND retained.source_id = duplicate.source_id
       AND COALESCE(retained.passage_id, '') = COALESCE(duplicate.passage_id, '')
       AND COALESCE(retained.quote, '') = COALESCE(duplicate.quote, '')
       AND retained.id < duplicate.id
      WHERE duplicate.subject_table = 'events'
        AND duplicate.subject_id = ?
        AND json_extract(duplicate.raw_json, '$.generator') = ?
        AND json_extract(retained.raw_json, '$.generator') = ?
    )
  `);
  const insertEntity = db.prepare(`
    INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(event_id, entity_id, role) DO UPDATE SET
      sort_order = excluded.sort_order,
      raw_json = excluded.raw_json
  `);
  const selectEntityLinks = db.prepare(`
    SELECT role, raw_json
    FROM event_entities
    WHERE event_id = ? AND entity_id = ?
  `);
  const deleteOwnedEntityLinks = db.prepare(`
    DELETE FROM event_entities
    WHERE event_id = ? AND entity_id = ?
      AND json_extract(raw_json, '$.generator') = ?
  `);
  const deleteExcludedPersonLinks = db.prepare(`
    DELETE FROM event_entities WHERE event_id = ? AND entity_id = ?
  `);
  const insertMentionPerson = db.prepare(`
    INSERT OR IGNORE INTO source_mention_people (mention_id, person_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertMentionPlace = db.prepare(`
    INSERT OR IGNORE INTO source_mention_places (mention_id, place_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertMapFeatureEvent = db.prepare(`
    INSERT INTO map_feature_events (feature_id, event_id, relation_type, confidence, raw_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(feature_id, event_id, relation_type) DO UPDATE SET
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);
  const insertMapFeatureEntity = db.prepare(`
    INSERT INTO map_feature_entities (
      feature_id, entity_id, relation_type, time_start, time_end, confidence, raw_json
    ) VALUES (?, ?, 'contains-place', ?, ?, ?, ?)
    ON CONFLICT(feature_id, entity_id, relation_type) DO UPDATE SET
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);
  const insertCardLink = db.prepare(`
    INSERT INTO event_import_cards (event_id, card_id, generator, relation_type, sort_order, raw_json, created_at)
    VALUES (?, ?, ?, 'support', ?, ?, ?)
    ON CONFLICT(event_id, card_id, generator) DO UPDATE SET
      sort_order = excluded.sort_order,
      raw_json = excluded.raw_json,
      created_at = excluded.created_at
  `);
  const insertClusterLink = db.prepare(`
    INSERT INTO import_event_cluster_events (cluster_id, event_id, generator, relation_type, raw_json, created_at)
    VALUES (?, ?, ?, 'derived-from', ?, ?)
    ON CONFLICT(cluster_id, event_id, generator) DO UPDATE SET
      raw_json = excluded.raw_json,
      created_at = excluded.created_at
  `);
  const clearCardLinks = db.prepare("DELETE FROM event_import_cards WHERE event_id = ? AND generator = ?");
  const clearClusterLinks = db.prepare("DELETE FROM import_event_cluster_events WHERE event_id = ? AND generator = ?");
  const clearEvidence = db.prepare(`
    DELETE FROM evidence_links
    WHERE subject_table = 'events' AND subject_id = ?
      AND json_extract(raw_json, '$.generator') = ?
  `);
  const clearEntities = db.prepare(`
    DELETE FROM event_entities
    WHERE event_id = ? AND json_extract(raw_json, '$.generator') = ?
  `);
  const clearMapLinks = db.prepare(`
    DELETE FROM map_feature_events
    WHERE event_id = ? AND json_extract(raw_json, '$.generator') = ?
  `);
  const selectUnsupportedGeneratedPersonLinks = db.prepare(`
    SELECT ee.entity_id
    FROM event_entities ee
    WHERE ee.event_id = ?
      AND json_extract(raw_json, '$.generator') = ?
      AND ee.entity_id IN (
        SELECT 'person:' || p.id
        FROM persons p
        WHERE json_extract(p.raw_json, '$.generatedFrom') = 'official-history-secondary-person-discovery'
          AND json_extract(p.raw_json, '$.profileId') = ?
      )
      AND ee.entity_id NOT IN (
        SELECT 'person:' || smp.person_id
        FROM event_import_cards eic
        JOIN import_evidence_cards c ON c.id = eic.card_id
        JOIN source_mention_people smp ON smp.mention_id = json_extract(c.raw_json, '$.mentionId')
        WHERE eic.event_id = ? AND eic.generator = ?
      )
  `);
  const selectGeneratedEventEntities = db.prepare(`
    SELECT ee.entity_id, e.entity_type, e.primary_label
    FROM event_entities ee
    JOIN entities e ON e.id = ee.entity_id
    WHERE ee.event_id = ? AND e.entity_type IN ('person', 'place')
    ORDER BY CASE e.entity_type WHEN 'person' THEN 0 ELSE 1 END, ee.sort_order, e.primary_label
  `);
  const selectEventEvidenceQuotes = db.prepare(`
    SELECT quote
    FROM evidence_links
    WHERE subject_table = 'events' AND subject_id = ?
    ORDER BY id
  `);
  const selectEventCardProvenance = db.prepare(`
    SELECT eic.card_id, c.batch_id
    FROM event_import_cards eic
    LEFT JOIN import_evidence_cards c ON c.id = eic.card_id
    WHERE eic.event_id = ? AND eic.generator = ?
    ORDER BY eic.card_id
  `);

  const activeEventIds = new Set();
  const affectedClusterIds = new Set();
  const supersededEventCards = new Map();
  const initializedEventIds = new Set();
  const stats = {
    inserted: 0,
    updated: 0,
    preservedReviewed: 0,
    matchedCurated: 0,
    evidenceLinks: 0,
    evidenceLinksDeduplicated: 0,
    eventEntities: 0,
    eventEntitiesDeduplicated: 0,
    staleGeneratedPersonLinks: 0,
    orphanedGeneratedPeople: 0,
    placeEntities: 0,
    mapFeatureLinks: 0,
  };
  const upsertPromotionEntity = (eventId, entityId, role, sortOrder, rawJson) => {
    const links = selectEntityLinks.all(eventId, entityId);
    const hasUnownedLink = links.some((link) => parseJson(link.raw_json).generator !== generatorId);
    if (hasUnownedLink) {
      stats.eventEntitiesDeduplicated += deleteOwnedEntityLinks.run(eventId, entityId, generatorId).changes;
      return 0;
    }
    if (links.length) {
      stats.eventEntitiesDeduplicated += deleteOwnedEntityLinks.run(eventId, entityId, generatorId).changes;
    }
    return insertEntity.run(eventId, entityId, role, sortOrder, rawJson).changes;
  };

  for (const proposal of proposals) {
    const proposalEndYear = proposal.endYear ?? proposal.year;
    const timePrecision = proposalEndYear === proposal.year ? "year" : "range";
    const displayTime = proposalEndYear === proposal.year
      ? String(proposal.year)
      : `${proposal.year}-${proposalEndYear}`;
    const selection = chooseEventId(proposal, state);
    const eventId = selection.eventId;
    if (selection.matchType === "editorial-matched-event") {
      for (const card of proposal.cards) {
        for (const linkedEventId of state.linksByCard.get(card.card_id) ?? []) {
          if (linkedEventId === eventId) continue;
          const redirectedCards = supersededEventCards.get(linkedEventId) ?? new Set();
          redirectedCards.add(card.card_id);
          supersededEventCards.set(linkedEventId, redirectedCards);
        }
      }
    }
    activeEventIds.add(eventId);
    for (const clusterId of proposal.clusterIds) affectedClusterIds.add(clusterId);
    const existing = state.byId.get(eventId) ?? db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
    const existingRaw = mergePromotionProvenanceSnapshot(
      parseJson(existing?.raw_json),
      existing ? selectEventCardProvenance.all(eventId, generatorId) : [],
    );
    const isGeneratedEvent = eventId.startsWith("official-history-event:");
    const eventAlreadyInitialized = initializedEventIds.has(eventId);
    const existingCardIds = new Set(Array.isArray(existingRaw.cardIds) ? existingRaw.cardIds : []);
    const proposalOwnsExistingEvent = Boolean(
      existing
      && (
        existingRaw.anchorCardId === proposal.anchorCardId
        || proposal.cards.some((card) => existingCardIds.has(card.card_id))
        || proposal.editorialMatchedEventIds.includes(eventId)
      )
    );
    const replaceOwnedPromotionData = shouldReplaceOwnedPromotionData({
      cleanupEntireProfile,
      requestedBatchIds: batchIds,
      existingBatchIds: Array.isArray(existingRaw.batchIds) ? existingRaw.batchIds : [],
      proposalOwnsExistingEvent,
      isGeneratedEvent,
    });
    const replaceExistingSnapshot = replaceOwnedPromotionData && !eventAlreadyInitialized;
    const resetGeneratorLinks = (cleanupEntireProfile || replaceOwnedPromotionData)
      && !eventAlreadyInitialized;
    const sourceRefs = proposal.sourceRefs.slice(0, 16);
    const excludedPersonIds = new Set(proposal.cards.flatMap((card) => (
      parseJson(card.card_raw_json).candidateRepair?.removePersonIds ?? []
    )));
    const proposalBatchIds = promotionBatchIdsForCards(proposal.cards);
    const primaryPlaceEntityId = proposal.primaryPlace?.entityId ?? null;
    const mapFeaturesByPlace = new Map(
      proposal.places.map((place) => [place.entityId, resolvePlaceMapFeatures(db, place, proposal.year)]),
    );
    const mapFeatureIds = [...new Set([...mapFeaturesByPlace.values()].flatMap((rows) => rows.map((row) => row.id)))];
    const generationRaw = {
      id: eventId,
      title: proposal.title,
      generatedFrom: "source-event-promotion-v2",
      generator: generatorId,
      profileId,
      batchIds: proposalBatchIds,
      generatedAt: now,
      machinePromoted: true,
      reviewNotice: "机器从史料事实候选生成；正式发布前需人工核定标题、年代、人物角色与事件边界。",
      titleZh: proposal.title,
      startYear: proposal.year,
      endYear: proposalEndYear,
      region: proposal.regionId,
      category: proposal.eventType,
      summary: proposal.summary,
      confidence: proposal.confidence,
      people: proposal.people.map((person) => person.name),
      personIds: proposal.people.map((person) => person.id),
      locationName: proposal.primaryPlace?.label ?? null,
      primaryPlaceEntityId,
      places: proposal.places.map((place) => place.label),
      placeIds: proposal.places.map((place) => place.id),
      placeEntityIds: proposal.places.map((place) => place.entityId),
      mapFeatureIds,
      polities: [],
      relatedEvents: [],
      tags: ["official-history", "machine-promoted", proposal.factType].filter(Boolean),
      sources: [...new Set(proposal.cards.map((card) => card.source_title).filter(Boolean))],
      timePrecision,
      timeResolution: [...new Map(
        proposal.cards.map((card) => [JSON.stringify(card.time), card.time]),
      ).values()],
      promotionIdentity: proposal.identityKey,
      anchorCardId: proposal.anchorCardId,
      cardIds: proposal.cards.map((card) => card.card_id),
      clusterIds: proposal.clusterIds,
      evidenceCount: proposal.cards.length,
      sourceCount: proposal.sourceCount,
      personCount: proposal.people.length,
      placeCount: proposal.places.length,
      sourceRefs,
    };
    const replacementGenerationRaw = replaceExistingSnapshot
      ? {
          ...generationRaw,
          anchorCardId: existingRaw.anchorCardId ?? generationRaw.anchorCardId,
          promotionIdentity: existingRaw.promotionIdentity ?? generationRaw.promotionIdentity,
        }
      : generationRaw;
    const mergedGenerationBase = existing
      && proposalOwnsExistingEvent
      && (!replaceExistingSnapshot || eventAlreadyInitialized)
      ? mergePromotionGenerationRaw(existingRaw, generationRaw, {
          preferIncomingEditorialFields: selection.matchType === "editorial-matched-event",
        })
      : replacementGenerationRaw;
    let mergedGenerationRaw = existing && proposalOwnsExistingEvent
      ? preserveOfficialHistoryEventEnrichment(existingRaw, mergedGenerationBase)
      : mergedGenerationBase;
    if (excludedPersonIds.size) {
      const retainedIndexes = (mergedGenerationRaw.personIds ?? [])
        .map((personId, index) => ({ personId, index }))
        .filter(({ personId }) => !excludedPersonIds.has(personId));
      mergedGenerationRaw = {
        ...mergedGenerationRaw,
        personIds: retainedIndexes.map(({ personId }) => personId),
        people: retainedIndexes.map(({ index }) => mergedGenerationRaw.people?.[index]).filter(Boolean),
        personCount: retainedIndexes.length,
      };
    }
    if (!existing) {
      insertEvent.run(
        eventId,
        mergedGenerationRaw.titleZh ?? proposal.title,
        mergedGenerationRaw.category ?? proposal.eventType,
        proposal.year,
        proposalEndYear,
        displayTime,
        timePrecision,
        proposal.regionId,
        mergedGenerationRaw.primaryPlaceEntityId ?? null,
        mergedGenerationRaw.summary ?? proposal.summary,
        mergedGenerationRaw.confidence ?? proposal.confidence,
        toJson(mergedGenerationRaw),
      );
      state.byId.set(eventId, db.prepare("SELECT * FROM events WHERE id = ?").get(eventId));
      stats.inserted += 1;
    } else if (
      isGeneratedEvent
      && proposalOwnsExistingEvent
      && isMachineMutableReviewStatus(existing.review_status)
    ) {
      updateEvent.run(
        mergedGenerationRaw.titleZh ?? proposal.title,
        mergedGenerationRaw.category ?? proposal.eventType,
        proposal.year,
        proposalEndYear,
        displayTime,
        timePrecision,
        proposal.regionId,
        mergedGenerationRaw.primaryPlaceEntityId ?? null,
        mergedGenerationRaw.summary ?? proposal.summary,
        mergedGenerationRaw.confidence ?? proposal.confidence,
        toJson(mergedGenerationRaw),
        eventId,
      );
      state.byId.set(eventId, db.prepare("SELECT * FROM events WHERE id = ?").get(eventId));
      stats.updated += 1;
    } else if (selection.matchType.endsWith("curated-event")) {
      stats.matchedCurated += 1;
    } else {
      stats.preservedReviewed += 1;
    }

    if (resetGeneratorLinks) {
      clearCardLinks.run(eventId, generatorId);
      clearClusterLinks.run(eventId, generatorId);
      clearEvidence.run(eventId, generatorId);
      clearEntities.run(eventId, generatorId);
      clearMapLinks.run(eventId, generatorId);
    }
    initializedEventIds.add(eventId);
    stats.evidenceLinksDeduplicated += deleteDuplicateGeneratedEvidence.run(
      eventId,
      generatorId,
      generatorId,
    ).changes;

    for (const personId of excludedPersonIds) {
      deleteExcludedPersonLinks.run(eventId, `person:${personId}`);
    }

    proposal.cards.forEach((card, index) => {
      insertCardLink.run(
        eventId,
        card.card_id,
        generatorId,
        index,
        toJson({ identityKey: proposal.identityKey, sourceId: card.source_id, passageId: card.passage_id }),
        now,
      );
      const evidenceId = `source-event-evidence:${stableId(`${generatorId}:${eventId}:${card.card_id}`)}`;
      const quote = truncate(card.mention_text ?? card.original_text ?? card.fact_brief, 1200);
      if (!selectEquivalentEvidence.get(eventId, card.source_id, card.passage_id, quote)) {
        stats.evidenceLinks += insertEvidence.run(
          evidenceId,
          eventId,
          card.source_id,
          card.passage_id,
          card.mention_id ?? inferLegacyMentionId(card.card_id),
          card.locator,
          quote,
          card.mention_confidence ?? card.card_confidence ?? proposal.confidence,
          toJson({ generator: generatorId, profileId, cardId: card.card_id, clusterIds: card.clusterIds, timeResolution: card.time }),
        ).changes;
      }
      const mentionId = card.mention_id ?? inferLegacyMentionId(card.card_id);
      if (mentionId) {
        proposal.people.forEach((person, personIndex) => {
          insertMentionPerson.run(mentionId, person.id, personIndex);
        });
        proposal.places.forEach((place, placeIndex) => {
          insertMentionPlace.run(mentionId, place.id, placeIndex);
        });
      }
    });

    // Mixed-batch events retain other evidence cards, but not orphaned machine discoveries.
    const staleGeneratedPersonEntityIds = !resetGeneratorLinks
      ? selectUnsupportedGeneratedPersonLinks.all(
        eventId,
        generatorId,
        profileId,
        eventId,
        generatorId,
      ).map((row) => row.entity_id)
      : [];
    for (const entityId of staleGeneratedPersonEntityIds) {
      stats.staleGeneratedPersonLinks += deleteOwnedEntityLinks.run(eventId, entityId, generatorId).changes;
    }

    proposal.people.forEach((person, index) => {
      const role = proposal.namedParticipantIds.has(person.id) ? "participant-candidate" : "mentioned-source";
      stats.eventEntities += upsertPromotionEntity(
        eventId,
        `person:${person.id}`,
        role,
        index,
        toJson({ generator: generatorId, profileId, via: person.via }),
      );
    });
    proposal.places.forEach((place, index) => {
      const semanticRole = normalizeEventPlaceRole(place.eventRole);
      const role = semanticRole && semanticRole !== "source-context"
        ? semanticRole
        : place.entityId === primaryPlaceEntityId ? "primary-location" : "related-location";
      stats.eventEntities += upsertPromotionEntity(
        eventId,
        place.entityId,
        role,
        proposal.people.length + index,
        toJson({ generator: generatorId, profileId, via: place.via ?? "title-place" }),
      );
      stats.placeEntities += 1;
      for (const feature of mapFeaturesByPlace.get(place.entityId) ?? []) {
        insertMapFeatureEntity.run(
          feature.id,
          place.entityId,
          place.timeStart,
          place.timeEnd,
          place.entityId === primaryPlaceEntityId ? "medium" : "low",
          toJson({ generator: generatorId, profileId, placeId: place.id, mapFeatureName: feature.name }),
        );
        stats.mapFeatureLinks += insertMapFeatureEvent.run(
          feature.id,
          eventId,
          place.entityId === primaryPlaceEntityId ? "primary-location" : "related-location",
          place.entityId === primaryPlaceEntityId ? "medium" : "low",
          toJson({ generator: generatorId, profileId, placeId: place.id, placeEntityId: place.entityId }),
        ).changes;
      }
    });
    for (const clusterId of proposal.clusterIds) {
      insertClusterLink.run(
        clusterId,
        eventId,
        generatorId,
        toJson({ profileId, identityKey: proposal.identityKey, cardIds: proposal.cards.map((card) => card.card_id) }),
        now,
      );
    }

    if (isGeneratedEvent) {
      const linkedEntities = selectGeneratedEventEntities.all(eventId);
      const people = linkedEntities.filter((entity) => entity.entity_type === "person");
      const places = linkedEntities.filter((entity) => entity.entity_type === "place");
      const eventBeforeSnapshot = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
      const snapshotRaw = {
        ...parseJson(eventBeforeSnapshot.raw_json),
        people: people.map((person) => person.primary_label),
        personIds: people.map((person) => person.entity_id.slice("person:".length)),
        places: places.map((place) => place.primary_label),
        placeEntityIds: places.map((place) => place.entity_id),
        personCount: people.length,
        placeCount: places.length,
      };
      updateEventRaw.run(toJson(snapshotRaw), eventId);
      const orphanedPeople = cleanupOrphanedDiscoveredPeople(
        db,
        staleGeneratedPersonEntityIds.map((entityId) => entityId.slice("person:".length)),
      );
      stats.orphanedGeneratedPeople += orphanedPeople.deleted;
      const current = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
      const currentRaw = parseJson(current.raw_json);
      const body = compact([
        current.title,
        current.summary,
        ...(currentRaw.people ?? []),
        ...(currentRaw.places ?? []),
        ...Object.values(currentRaw.detail ?? {}).flat().filter((value) => typeof value === "string"),
        ...selectEventEvidenceQuotes.all(eventId).map((row) => row.quote),
      ]);
      insertSearch.run(
        `event:${eventId}`,
        eventId,
        current.title,
        body,
        current.region_id,
        inferPeriodId(db, current.region_id, current.time_start),
        topicIdForOfficialHistoryEvent(current.event_type),
        current.time_start,
        current.time_end,
        current.review_status,
        toJson({
          generator: generatorId,
          profileId,
          eventId,
          cardIds: currentRaw.cardIds ?? proposal.cards.map((card) => card.card_id),
          peopleCore: currentRaw.people ?? proposal.people.map((person) => person.name),
          places: currentRaw.places ?? proposal.places.map((place) => place.label),
          placeIds: currentRaw.placeIds ?? proposal.places.map((place) => place.id),
        }),
      );
    }
  }

  return { activeEventIds, affectedClusterIds, supersededEventCards, stats };
}

function deleteMachineGeneratedEvent(db, eventId) {
  db.prepare(`
    UPDATE import_event_clusters
    SET matched_event_id = NULL,
        match_status = 'unmatched',
        review_status = 'needs-review',
        raw_json = json_set(COALESCE(raw_json, '{}'), '$.officialHistoryEventId', NULL)
    WHERE matched_event_id = ?
  `).run(eventId);
  db.prepare("DELETE FROM evidence_links WHERE subject_table = 'events' AND subject_id = ?").run(eventId);
  db.prepare("DELETE FROM document_chunks WHERE subject_table = 'events' AND subject_id = ?").run(eventId);
  db.prepare("DELETE FROM search_documents WHERE subject_table = 'events' AND subject_id = ?").run(eventId);
  db.prepare("DELETE FROM event_i18n WHERE event_id = ?").run(eventId);
  db.prepare("DELETE FROM map_feature_events WHERE event_id = ?").run(eventId);
  return db.prepare("DELETE FROM events WHERE id = ?").run(eventId).changes;
}

function cleanupSupersededGeneratedEvents(db, supersededEventCards, activeEventIds, affectedClusterIds) {
  const stats = {
    considered: supersededEventCards.size,
    deleted: 0,
    retainedActive: 0,
    retainedPartial: 0,
    preservedReviewed: 0,
  };
  const selectEvent = db.prepare("SELECT id, review_status, raw_json FROM events WHERE id = ?");
  const selectCardIds = db.prepare(`
    SELECT card_id
    FROM event_import_cards
    WHERE event_id = ? AND generator = ?
    ORDER BY card_id
  `);
  const selectClusterIds = db.prepare(`
    SELECT cluster_id
    FROM import_event_cluster_events
    WHERE event_id = ? AND generator = ?
  `);

  for (const [eventId, redirectedCardIds] of supersededEventCards) {
    const event = selectEvent.get(eventId);
    if (!event) continue;
    if (activeEventIds.has(eventId)) {
      stats.retainedActive += 1;
      continue;
    }
    if (!isMachineMutableReviewStatus(event.review_status)) {
      stats.preservedReviewed += 1;
      continue;
    }
    const linkedCardIds = selectCardIds.all(eventId, generatorId).map((row) => row.card_id);
    if (!isFullySupersededMachineEvent({
      event,
      generatorId,
      linkedCardIds,
      redirectedCardIds: [...redirectedCardIds],
      activeEventIds,
    })) {
      stats.retainedPartial += 1;
      continue;
    }
    for (const row of selectClusterIds.all(eventId, generatorId)) affectedClusterIds.add(row.cluster_id);
    stats.deleted += deleteMachineGeneratedEvent(db, eventId);
  }
  return stats;
}

function cleanupStaleProfileLinks(db, activeEventIds) {
  const linkedEvents = db.prepare(`
    SELECT DISTINCT event_id
    FROM event_import_cards
    WHERE generator = ?
    ORDER BY event_id
  `).all(generatorId);
  const selectClusters = db.prepare(`
    SELECT cluster_id
    FROM import_event_cluster_events
    WHERE event_id = ? AND generator = ?
  `);
  const deleteCardLinks = db.prepare("DELETE FROM event_import_cards WHERE event_id = ? AND generator = ?");
  const deleteClusterLinks = db.prepare("DELETE FROM import_event_cluster_events WHERE event_id = ? AND generator = ?");
  const deleteEvidence = db.prepare(`
    DELETE FROM evidence_links
    WHERE subject_table = 'events' AND subject_id = ?
      AND json_extract(raw_json, '$.generator') = ?
  `);
  const deleteEntities = db.prepare(`
    DELETE FROM event_entities
    WHERE event_id = ? AND json_extract(raw_json, '$.generator') = ?
  `);
  const deleteMapLinks = db.prepare(`
    DELETE FROM map_feature_events
    WHERE event_id = ? AND json_extract(raw_json, '$.generator') = ?
  `);
  const affectedClusterIds = new Set();
  const stats = { events: 0, cardLinks: 0, clusterLinks: 0, evidenceLinks: 0, eventEntities: 0, mapFeatureLinks: 0 };

  for (const { event_id: eventId } of linkedEvents) {
    if (activeEventIds.has(eventId)) continue;
    for (const row of selectClusters.all(eventId, generatorId)) affectedClusterIds.add(row.cluster_id);
    stats.cardLinks += deleteCardLinks.run(eventId, generatorId).changes;
    stats.clusterLinks += deleteClusterLinks.run(eventId, generatorId).changes;
    stats.evidenceLinks += deleteEvidence.run(eventId, generatorId).changes;
    stats.eventEntities += deleteEntities.run(eventId, generatorId).changes;
    stats.mapFeatureLinks += deleteMapLinks.run(eventId, generatorId).changes;
    stats.events += 1;
  }
  return { ...stats, affectedClusterIds };
}

function cleanupStaleGeneratedEvents(db, activeEventIds) {
  const stale = db.prepare(`
    SELECT id, review_status
    FROM events
    WHERE id LIKE 'official-history-event:%'
      AND json_extract(raw_json, '$.generator') = ?
  `).all(generatorId)
    .filter((event) => !activeEventIds.has(event.id));
  let deleted = 0;
  let preservedReviewed = 0;
  for (const event of stale) {
    if (!isMachineMutableReviewStatus(event.review_status)) {
      preservedReviewed += 1;
      continue;
    }
    deleted += deleteMachineGeneratedEvent(db, event.id);
  }
  return { deleted, preservedReviewed };
}

function cleanupStaleGeneratedEventsForBatches(db, activeEventIds, requestedBatchIds) {
  const requested = new Set(requestedBatchIds.filter(Boolean));
  const affectedClusterIds = new Set();
  const stats = {
    considered: 0,
    deleted: 0,
    retainedActive: 0,
    retainedReviewed: 0,
    retainedMixedOwnership: 0,
    retainedUnownedData: 0,
    retainedUnknownOwnership: 0,
  };
  if (!requested.size) return { ...stats, affectedClusterIds };

  const events = db.prepare(`
    SELECT id, review_status, raw_json
    FROM events
    WHERE id LIKE 'official-history-event:%'
      AND json_extract(raw_json, '$.generator') = ?
    ORDER BY id
  `).all(generatorId);
  const cardBatchById = new Map(db.prepare(`
    SELECT id, batch_id
    FROM import_evidence_cards
  `).all().map((row) => [row.id, row.batch_id]));
  const linkedBatchesByEvent = new Map();
  for (const row of db.prepare(`
    SELECT eic.event_id, c.batch_id
    FROM event_import_cards eic
    JOIN import_evidence_cards c ON c.id = eic.card_id
  `).all()) {
    const batchIds = linkedBatchesByEvent.get(row.event_id) ?? new Set();
    batchIds.add(row.batch_id);
    linkedBatchesByEvent.set(row.event_id, batchIds);
  }
  const linkedClustersByEvent = new Map();
  for (const row of db.prepare(`
    SELECT event_id, cluster_id
    FROM import_event_cluster_events
    WHERE generator = ?
  `).all(generatorId)) {
    const clusterIds = linkedClustersByEvent.get(row.event_id) ?? new Set();
    clusterIds.add(row.cluster_id);
    linkedClustersByEvent.set(row.event_id, clusterIds);
  }
  const unownedEventIds = new Set(db.prepare(`
    SELECT event_id FROM event_import_cards WHERE generator <> ?
    UNION
    SELECT event_id FROM import_event_cluster_events WHERE generator <> ?
    UNION
    SELECT subject_id AS event_id FROM evidence_links
      WHERE subject_table = 'events' AND COALESCE(json_extract(raw_json, '$.generator'), '') <> ?
    UNION
    SELECT event_id FROM event_entities
      WHERE COALESCE(json_extract(raw_json, '$.generator'), '') <> ?
    UNION
    SELECT event_id FROM map_feature_events
      WHERE COALESCE(json_extract(raw_json, '$.generator'), '') <> ?
  `).all(generatorId, generatorId, generatorId, generatorId, generatorId).map((row) => row.event_id));

  for (const event of events) {
    stats.considered += 1;
    if (activeEventIds.has(event.id)) {
      stats.retainedActive += 1;
      continue;
    }
    if (!isMachineMutableReviewStatus(event.review_status)) {
      stats.retainedReviewed += 1;
      continue;
    }
    const raw = parseJson(event.raw_json);
    const eventBatchIds = [...new Set([
      ...(Array.isArray(raw.batchIds) ? raw.batchIds : []),
      ...(linkedBatchesByEvent.get(event.id) ?? []),
      ...(Array.isArray(raw.cardIds) ? raw.cardIds.map((cardId) => cardBatchById.get(cardId)) : []),
    ].filter(Boolean))];
    const hasUnownedData = unownedEventIds.has(event.id);
    if (hasUnownedData) {
      stats.retainedUnownedData += 1;
      continue;
    }
    if (!eventBatchIds.length) {
      stats.retainedUnknownOwnership += 1;
      continue;
    }
    if (!eventBatchIds.every((batchId) => requested.has(batchId))) {
      stats.retainedMixedOwnership += 1;
      continue;
    }
    if (!isStaleMachineEventOwnedByRequestedBatches({
      event,
      generatorId,
      activeEventIds,
      requestedBatchIds,
      eventBatchIds,
      hasUnownedData,
    })) continue;
    for (const clusterId of linkedClustersByEvent.get(event.id) ?? []) affectedClusterIds.add(clusterId);
    for (const clusterId of Array.isArray(raw.clusterIds) ? raw.clusterIds : []) affectedClusterIds.add(clusterId);
    stats.deleted += deleteMachineGeneratedEvent(db, event.id);
  }
  return { ...stats, affectedClusterIds };
}

function refreshClusterPointers(db, affectedClusterIds) {
  const oldClusterRows = db.prepare(`
    SELECT DISTINCT c.id
    FROM import_event_clusters c
    JOIN import_event_cluster_events ice ON ice.cluster_id = c.id
    WHERE ice.generator = ?
  `).all(generatorId);
  for (const row of oldClusterRows) affectedClusterIds.add(row.id);
  const update = db.prepare(`
    UPDATE import_event_clusters
    SET matched_event_id = ?, match_status = ?, review_status = ?, raw_json = ?
    WHERE id = ?
  `);
  let singleEvent = 0;
  let multiEvent = 0;
  let cleared = 0;
  for (const clusterId of affectedClusterIds) {
    const cluster = db.prepare("SELECT raw_json FROM import_event_clusters WHERE id = ?").get(clusterId);
    if (!cluster) continue;
    const eventIds = db.prepare(`
      SELECT DISTINCT event_id
      FROM import_event_cluster_events
      WHERE cluster_id = ? AND generator = ?
      ORDER BY event_id
    `).all(clusterId, generatorId).map((row) => row.event_id);
    const raw = parseJson(cluster.raw_json);
    const nextRaw = toJson({
      ...raw,
      promotionRelationshipModel: "many-to-many",
      promotionEventIds: eventIds,
      promotionProfile: profileId,
      promotionUpdatedAt: now,
    });
    if (eventIds.length === 1) {
      update.run(eventIds[0], "matched", "promoted", nextRaw, clusterId);
      singleEvent += 1;
    } else if (eventIds.length > 1) {
      update.run(null, "possible", "needs-review", nextRaw, clusterId);
      multiEvent += 1;
    } else {
      update.run(null, "unmatched", "needs-review", nextRaw, clusterId);
      cleared += 1;
    }
  }
  return { singleEvent, multiEvent, cleared };
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 30000");

try {
  if (!dryRun) {
    migratePromotionSchema(db);
    migratePlaceReferences(db);
    migrateWesternJinPeriod(db);
    migrateEasternHanPeriod(db);
    migrateXinTransitionPeriod(db);
  }
  const requiredTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'event_import_cards'").get();
  if (!requiredTable) throw new Error("Promotion schema is missing; run npm run db:build before --dry-run");
  const batches = discoverBatches(db);
  if (!batches.length) {
    throw new Error(`No import batches declare promotionProfile=${profileId}; rerun the official-history extractors`);
  }
  const batchIds = batches.map((batch) => batch.id);
  const cards = selectRequestedCards(loadCards(db, batchIds));
  const clustersByCard = loadClustersByCard(db, batchIds);
  const eras = db.prepare(`
    SELECT * FROM chronology_eras
    WHERE calendar_system = 'china-regnal' AND review_status <> 'rejected'
    ORDER BY length(era_label) DESC, era_label, context_key, time_start
  `).all();
  const personIndex = loadPersonIndex(db);
  const mentionPeople = loadMentionPeople(db, personIndex);
  const placeIndex = loadPlaceIndex(db);
  const mentionPlaces = loadMentionPlaces(db, placeIndex);
  const { proposals, skipped, skippedSamples } = buildProposals(
    cards,
    eras,
    clustersByCard,
    personIndex,
    mentionPeople,
    placeIndex,
    mentionPlaces,
  );

  if (dryRun) {
    const state = existingEventState(db);
    console.log(JSON.stringify({
      generatedAt: now,
      dryRun,
      profileId,
      batchIds,
      requestedCardIds,
      cleanupMode: cleanupEntireProfile ? "profile" : "incremental-batch",
      cardsConsidered: cards.length,
      proposals: proposals.length,
      skipped,
      skippedSamples,
      samples: proposals.slice(0, sampleLimit).map((proposal) => ({
        selection: chooseEventId(proposal, state),
        year: proposal.year,
        title: proposal.title,
        anchorCardId: proposal.anchorCardId,
        cards: proposal.cards.length,
        sources: proposal.sourceCount,
        people: proposal.people.map((person) => person.name),
        provisionalPeople: proposal.people.filter((person) => person.provisional).map((person) => person.name),
        places: proposal.places.map((place) => place.label),
        primaryPlace: proposal.primaryPlace?.label ?? null,
        originalText: proposal.cards[0].original_text,
        timeResolution: proposal.cards[0].time,
      })),
    }, null, 2));
  } else {
    let result;
    db.exec("BEGIN");
    try {
      const discoveredPeople = ensureDiscoveredPeople(db, proposals);
      const personCards = ensurePersonCards(db);
      const state = existingEventState(db);
      const written = writeProposals(db, proposals, state, batchIds);
      const superseded = cleanupSupersededGeneratedEvents(
        db,
        written.supersededEventCards,
        written.activeEventIds,
        written.affectedClusterIds,
      );
      const staleLinks = cleanupEntireProfile
        ? cleanupStaleProfileLinks(db, written.activeEventIds)
        : {
            events: 0,
            cardLinks: 0,
            clusterLinks: 0,
            evidenceLinks: 0,
            eventEntities: 0,
            mapFeatureLinks: 0,
            affectedClusterIds: new Set(),
          };
      for (const clusterId of staleLinks.affectedClusterIds) written.affectedClusterIds.add(clusterId);
      const stale = cleanupEntireProfile
        ? cleanupStaleGeneratedEvents(db, written.activeEventIds)
        : { deleted: 0, preservedReviewed: 0 };
      const staleBatch = cleanupEntireProfile
        ? {
            considered: 0,
            deleted: 0,
            retainedActive: 0,
            retainedReviewed: 0,
            retainedMixedOwnership: 0,
            retainedUnownedData: 0,
            retainedUnknownOwnership: 0,
            affectedClusterIds: new Set(),
          }
        : cleanupStaleGeneratedEventsForBatches(db, written.activeEventIds, batchIds);
      for (const clusterId of staleBatch.affectedClusterIds) written.affectedClusterIds.add(clusterId);
      const discoveredPeopleCleanup = cleanupStaleDiscoveredPeople(db, proposals);
      const clusters = refreshClusterPointers(db, written.affectedClusterIds);
      delete staleLinks.affectedClusterIds;
      delete staleBatch.affectedClusterIds;
      result = {
        discoveredPeople,
        discoveredPeopleCleanup,
        personCards,
        events: written.stats,
        superseded,
        staleLinks,
        stale,
        staleBatch,
        clusters,
      };
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    if (rebuildChunks) {
      rebuildDocumentChunks(db, {
        rebuildFts: true,
        log: (message) => console.log(`[promote:official-history-cards] ${message}`),
      });
    }

    console.log(JSON.stringify({
      generatedAt: now,
      dryRun,
      profileId,
      batchIds,
      requestedCardIds,
      cardsConsidered: cards.length,
      proposals: proposals.length,
      skipped,
      rebuildChunks,
      cleanupMode: cleanupEntireProfile ? "profile" : "incremental-batch",
      ...result,
    }, null, 2));
  }
} finally {
  db.close();
}
