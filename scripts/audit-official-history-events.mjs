import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isMachineMutableReviewStatus,
  isResolvedPromotionEventTime,
  parseJson,
} from "./lib/event-promotion-core.mjs";
import {
  normalizedOfficialHistoryIdentity,
  officialHistoryTitleAuditReasons,
} from "./lib/china-official-history-promotion-policy.mjs";
import { requestedOfficialHistoryPromotionProfile } from "./lib/china-official-history-promotion-profiles.mjs";
import { findPlaceMentions } from "./lib/china-official-history-reference-resolver.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="))?.slice("--db=".length);
const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const profile = requestedOfficialHistoryPromotionProfile();
const profileId = profile.id;
const generatorId = profile.generatorId;
const reportOnly = process.argv.includes("--report-only");
const argumentNumber = (name, fallback) => {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
  return value !== undefined && Number.isFinite(Number(value)) ? Number(value) : fallback;
};
const templateStart = argumentNumber("--template-start", profile.timeStart);
const templateEnd = argumentNumber("--template-end", profile.timeEnd);

const db = new DatabaseSync(dbPath, { readOnly: true });

try {
  const hasPromotionSchema = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'event_import_cards'").get();
  if (!hasPromotionSchema) throw new Error("Promotion provenance schema is missing; run npm run db:build");

  const events = db.prepare(`
    SELECT *
    FROM events e
    WHERE json_extract(e.raw_json, '$.generator') = ?
       OR EXISTS (
         SELECT 1 FROM event_import_cards eic
         WHERE eic.event_id = e.id AND eic.generator = ?
       )
    ORDER BY time_start, title, id
  `).all(generatorId, generatorId);
  const failures = [];
  const addFailure = (type, event, details = {}) => failures.push({ type, eventId: event?.id ?? null, title: event?.title ?? null, ...details });
  const identityEvents = new Map();
  const placeRecordsById = new Map();
  for (const row of db.prepare(`
    SELECT e.id, e.primary_label, e.raw_json, a.value AS alias_value
    FROM entities e
    LEFT JOIN entity_aliases a ON a.entity_id = e.id
    WHERE e.entity_type = 'place' AND e.review_status <> 'rejected'
    ORDER BY e.id, a.value
  `).all()) {
    const raw = parseJson(row.raw_json);
    const place = placeRecordsById.get(row.id) ?? {
      id: raw.stablePlaceId ?? row.id.replace(/^place:/u, ""),
      entityId: row.id,
      label: row.primary_label,
      aliases: [],
      locativeOnlyAliases: Array.isArray(raw.locativeOnlyAliases) ? raw.locativeOnlyAliases : [],
    };
    if (row.alias_value && row.alias_value !== place.label && !place.aliases.includes(row.alias_value)) {
      place.aliases.push(row.alias_value);
    }
    placeRecordsById.set(row.id, place);
  }
  const placeRecords = [...placeRecordsById.values()];

  for (const event of events) {
    const raw = parseJson(event.raw_json);
    if (!isResolvedPromotionEventTime(event, raw)) {
      addFailure("non-exact-time", event, { timeStart: event.time_start, timeEnd: event.time_end, timePrecision: event.time_precision });
    }
    if (raw.generator === generatorId && isMachineMutableReviewStatus(event.review_status)) {
      for (const reason of officialHistoryTitleAuditReasons(event.title)) addFailure(`title:${reason}`, event);
    }
    const evidence = db.prepare(`
      SELECT source_id, passage_id, mention_id
      FROM evidence_links
      WHERE subject_table = 'events' AND subject_id = ?
    `).all(event.id);
    if (!evidence.length) addFailure("missing-evidence", event);
    if (evidence.some((row) => !row.source_id)) addFailure("evidence-without-source", event);
    const cardLinks = db.prepare(`
      SELECT eic.card_id, eic.generator, json_extract(c.raw_json, '$.mentionId') AS mention_id
      FROM event_import_cards eic
      JOIN import_evidence_cards c ON c.id = eic.card_id
      WHERE eic.event_id = ?
      ORDER BY eic.sort_order, eic.card_id
    `).all(event.id);
    const profileCardLinks = cardLinks.filter((cardLink) => cardLink.generator === generatorId);
    if (raw.generator === generatorId && !profileCardLinks.length) addFailure("missing-card-provenance", event);
    const searchDocument = db.prepare(`
      SELECT sd.id,
        EXISTS (SELECT 1 FROM document_chunks dc WHERE dc.search_document_id = sd.id) AS has_chunks
      FROM search_documents sd
      WHERE sd.subject_table = 'events' AND sd.subject_id = ?
      ORDER BY sd.id
      LIMIT 1
    `).get(event.id);
    if (!searchDocument) addFailure("missing-search-document", event);
    else if (!searchDocument.has_chunks) addFailure("missing-search-chunks", event);
    const entityLinks = db.prepare(`
      SELECT ee.entity_id, ee.role, ee.raw_json, e.entity_type, e.primary_label, e.review_status AS entity_review_status
      FROM event_entities ee
      JOIN entities e ON e.id = ee.entity_id
      WHERE ee.event_id = ?
    `).all(event.id);
    const unresolvedReviewedRoles = entityLinks.filter((link) =>
      link.role === "participant-candidate" && ["reviewed", "approved"].includes(link.entity_review_status));
    for (const link of unresolvedReviewedRoles) {
      addFailure("reviewed-person-candidate-role", event, { entityId: link.entity_id });
    }
    const primaryLocationLinks = entityLinks.filter((link) =>
      link.entity_type === "place" && link.role === "primary-location");
    if (primaryLocationLinks.length > 1) {
      addFailure("multiple-primary-place-links", event, {
        placeEntityIds: primaryLocationLinks.map((link) => link.entity_id),
      });
    }
    const linkedEntityIds = new Set(entityLinks.map((link) => link.entity_id));
    const generatedPersonEntityIds = new Set(entityLinks
      .filter((link) => link.entity_type === "person" && parseJson(link.raw_json).generator === generatorId)
      .map((link) => link.entity_id));
    for (const personId of Array.isArray(raw.personIds) ? raw.personIds : []) {
      if (!linkedEntityIds.has(`person:${personId}`)) addFailure("missing-person-entity-link", event, { personId });
      if (!db.prepare("SELECT 1 FROM persons WHERE id = ?").get(personId)) addFailure("missing-person-record", event, { personId });
      const personEntityId = `person:${personId}`;
      const personEntity = db.prepare("SELECT review_status FROM entities WHERE id = ?").get(personEntityId);
      const personSearchDocuments = db.prepare(`
        SELECT id, review_status
        FROM search_documents
        WHERE subject_table = 'entities' AND subject_id = ?
        ORDER BY id
      `).all(personEntityId);
      if (!personSearchDocuments.length) addFailure("missing-person-search-document", event, { personId });
      for (const document of personSearchDocuments) {
        if (personEntity && document.review_status !== personEntity.review_status) {
          addFailure("person-search-review-mismatch", event, {
            personId,
            searchDocumentId: document.id,
            reviewStatus: document.review_status,
            expected: personEntity.review_status,
          });
        }
      }
      const mentionIds = cardLinks.map((cardLink) => cardLink.mention_id).filter(Boolean);
      if (
        mentionIds.length
        && generatedPersonEntityIds.has(personEntityId)
        && !mentionIds.some((mentionId) =>
          db.prepare("SELECT 1 FROM source_mention_people WHERE mention_id = ? AND person_id = ?").get(mentionId, personId))
      ) {
        addFailure("missing-mention-person-link", event, { personId, mentionIds });
      }
    }
    const linkedPlaceEntityIds = new Set(
      entityLinks.filter((link) => link.entity_type === "place").map((link) => link.entity_id),
    );
    const linkedPlaceLabels = new Set(
      entityLinks
        .filter((link) => link.entity_type === "place" && link.primary_label)
        .map((link) => link.primary_label),
    );
    const titleForPlaceAudit = entityLinks
      .filter((link) => link.entity_type === "person" && link.primary_label)
      .reduce((title, link) => title.split(link.primary_label).join(""), event.title);
    const titlePlaces = findPlaceMentions(titleForPlaceAudit, placeRecords);
    for (const place of titlePlaces) {
      if (!linkedPlaceEntityIds.has(place.entityId) && !linkedPlaceLabels.has(place.label)) {
        addFailure("unbound-title-place", event, { placeId: place.id, placeLabel: place.label });
      }
    }
    const rawPlaceEntityIds = Array.isArray(raw.placeEntityIds) ? raw.placeEntityIds : [];
    for (const placeEntityId of rawPlaceEntityIds) {
      if (!linkedPlaceEntityIds.has(placeEntityId)) addFailure("missing-place-entity-link", event, { placeEntityId });
    }
    const editorialPlaceIds = new Set(Array.isArray(raw.editorialPlaceIds) ? raw.editorialPlaceIds : []);
    for (const placeId of Array.isArray(raw.placeIds) ? raw.placeIds : []) {
      if (editorialPlaceIds.has(placeId)) continue;
      const mentionIds = cardLinks.map((cardLink) => cardLink.mention_id).filter(Boolean);
      if (
        mentionIds.length
        && !mentionIds.some((mentionId) =>
          db.prepare("SELECT 1 FROM source_mention_places WHERE mention_id = ? AND place_id = ?").get(mentionId, placeId))
      ) {
        addFailure("missing-mention-place-link", event, { placeId, mentionIds });
      }
    }
    if (rawPlaceEntityIds.length === 1 && event.place_entity_id !== rawPlaceEntityIds[0]) {
      addFailure("primary-place-mismatch", event, { placeEntityId: event.place_entity_id, expected: rawPlaceEntityIds[0] });
    }
    if (
      rawPlaceEntityIds.length > 1
      && event.place_entity_id !== null
      && !rawPlaceEntityIds.includes(event.place_entity_id)
    ) {
      addFailure("primary-place-not-linked", event, { placeEntityId: event.place_entity_id, linked: rawPlaceEntityIds });
    }
    const linkedMapFeatureIds = new Set(db.prepare("SELECT feature_id FROM map_feature_events WHERE event_id = ?").all(event.id).map((row) => row.feature_id));
    for (const featureId of Array.isArray(raw.mapFeatureIds) ? raw.mapFeatureIds : []) {
      if (!linkedMapFeatureIds.has(featureId)) addFailure("missing-map-feature-link", event, { featureId });
    }
    const identity = [event.region_id, event.time_start, normalizedOfficialHistoryIdentity(event.title)].join(":");
    const ids = identityEvents.get(identity) ?? [];
    ids.push(event.id);
    identityEvents.set(identity, ids);
  }

  for (const [identity, eventIds] of identityEvents) {
    if (eventIds.length > 1) failures.push({ type: "duplicate-event-identity", eventId: null, title: null, identity, eventIds });
  }

  const clusterRows = db.prepare(`
    SELECT
      c.id,
      c.matched_event_id,
      COUNT(DISTINCT ice.event_id) AS linked_event_count,
      MIN(ice.event_id) AS only_event_id
    FROM import_event_clusters c
    LEFT JOIN import_event_cluster_events ice ON ice.cluster_id = c.id
    WHERE ice.generator = ?
    GROUP BY c.id
    ORDER BY c.id
  `).all(generatorId);
  for (const cluster of clusterRows) {
    if (cluster.linked_event_count === 1 && cluster.matched_event_id !== cluster.only_event_id) {
      failures.push({ type: "cluster-pointer-mismatch", clusterId: cluster.id, matchedEventId: cluster.matched_event_id, linkedEventId: cluster.only_event_id });
    }
    if (cluster.linked_event_count > 1 && cluster.matched_event_id !== null) {
      failures.push({ type: "cluster-one-to-many-pointer", clusterId: cluster.id, matchedEventId: cluster.matched_event_id, linkedEventCount: cluster.linked_event_count });
    }
  }

  const templateEvents = events.filter((event) => event.time_start >= templateStart && event.time_start <= templateEnd);
  const sourceFamilies = {};
  for (const event of templateEvents) {
    for (const row of db.prepare(`
      SELECT source_id
      FROM evidence_links
      WHERE subject_table = 'events' AND subject_id = ?
    `).all(event.id)) {
      const family = row.source_id?.split("-")[0] ?? "unknown";
      sourceFamilies[family] = (sourceFamilies[family] ?? 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    profileId,
    generatorId,
    reportOnly,
    events: events.length,
    template: {
      start: templateStart,
      end: templateEnd,
      events: templateEvents.length,
      sourceFamilies,
    },
    failures: failures.length,
    failureCounts: Object.fromEntries(
      [...failures.reduce((counts, failure) => counts.set(failure.type, (counts.get(failure.type) ?? 0) + 1), new Map())]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])),
    ),
    samples: failures.slice(0, 40),
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length && !reportOnly) process.exitCode = 1;
} finally {
  db.close();
}
