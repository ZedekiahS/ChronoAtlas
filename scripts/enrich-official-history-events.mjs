import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { rebuildDocumentChunks } from "../db/migrations/007-document-chunks-fts.mjs";
import { compact, isMachineMutableReviewStatus, parseJson, toJson } from "./lib/event-promotion-core.mjs";
import { getOfficialHistoryPromotionProfile } from "./lib/china-official-history-promotion-profiles.mjs";
import {
  buildOfficialHistoryEventDetail,
  buildOfficialHistoryRelatedEventRefs,
  isCompleteOfficialHistoryEventDetail,
  isOfficialHistoryEventEnrichment,
  mergeLegacyOfficialHistoryEventDetail,
  mergeOfficialHistoryRelatedEventRefs,
  officialHistoryEnrichmentInputFingerprint,
  officialHistoryEventEnrichmentGenerator,
} from "./lib/official-history-event-enrichment.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profileArg = process.argv.find((argument) => argument.startsWith("--profile="));
const dbArg = process.argv.find((argument) => argument.startsWith("--db="));
const sampleArg = process.argv.find((argument) => argument.startsWith("--sample-limit="));
const profileId = profileArg?.slice("--profile=".length).trim();
const databasePath = dbArg
  ? path.resolve(rootDir, dbArg.slice("--db=".length))
  : path.join(rootDir, "db", "chronoatlas.sqlite");
const dryRun = process.argv.includes("--dry-run");
const rebuildChunks = !process.argv.includes("--skip-rebuild-chunks");
const includeCuratedIncompleteDetail = process.argv.includes("--include-curated-incomplete-detail");
const includeReviewedMissingDetail = process.argv.includes("--include-reviewed-missing-detail");
const migrateLegacyDetail = process.argv.includes("--migrate-legacy-detail");
const refreshGeneratedEnrichment = process.argv.includes("--refresh-generated-enrichment");
const sampleLimit = Math.max(1, Math.min(30, Number.parseInt(sampleArg?.slice("--sample-limit=".length) ?? "12", 10) || 12));
const generatedAt = new Date().toISOString();

if (!profileId) {
  throw new Error("Missing required --profile=<promotion-profile-id>");
}
const profile = getOfficialHistoryPromotionProfile(profileId);

function hasNonEmptyObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function searchBody(event, raw, detail, evidence, relatedRefs, eventTitleById) {
  return unique([
    event.title,
    event.summary,
    ...(raw.people ?? []),
    ...(raw.places ?? []),
    detail.overview,
    ...detail.background,
    ...detail.process,
    ...detail.result,
    ...detail.impact,
    ...detail.sourceNotes,
    ...detail.uncertainty,
    ...evidence.map((item) => compact(item.quote)),
    ...relatedRefs.map((ref) => eventTitleById.get(ref.eventId)),
  ]).join("\n");
}

const db = new DatabaseSync(databasePath, { readOnly: dryRun });
db.exec("PRAGMA busy_timeout = 15000");

try {
  const promotionProvenanceEventIds = new Set(db.prepare(`
    SELECT DISTINCT event_id
    FROM event_import_cards
    WHERE generator = ?
  `).all(profile.generatorId).map((row) => row.event_id));
  const contextRows = db.prepare(`
    SELECT id, title, event_type, time_start, time_end, summary, review_status, raw_json
    FROM events
    WHERE region_id = ?
      AND time_start BETWEEN ? AND ?
      AND id NOT LIKE 'life:%'
    ORDER BY COALESCE(time_start, 9999), id
  `).all(profile.regionId, profile.timeStart, profile.timeEnd);

  const selectParticipants = db.prepare(`
    SELECT ee.entity_id, e.primary_label
    FROM event_entities ee
    JOIN entities e ON e.id = ee.entity_id
    WHERE ee.event_id = ?
      AND e.entity_type = 'person'
      AND ee.role IN ('participant', 'participant-candidate', 'subject')
    ORDER BY ee.sort_order, ee.entity_id
  `);
  const selectPlaces = db.prepare(`
    SELECT ee.entity_id, e.primary_label
    FROM event_entities ee
    JOIN entities e ON e.id = ee.entity_id
    WHERE ee.event_id = ? AND e.entity_type = 'place'
    ORDER BY ee.sort_order, ee.entity_id
  `);
  const selectEvidence = db.prepare(`
    SELECT
      el.id,
      el.source_id AS sourceId,
      s.title AS sourceTitle,
      el.locator,
      el.quote,
      el.confidence
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    WHERE el.subject_table = 'events' AND el.subject_id = ?
    ORDER BY el.locator, el.id
  `);

  const events = contextRows.map((row) => {
    const raw = parseJson(row.raw_json);
    const participants = selectParticipants.all(row.id);
    const places = selectPlaces.all(row.id);
    const rawPersonIds = Array.isArray(raw.personIds) ? raw.personIds : [];
    return {
      ...row,
      raw,
      startYear: row.time_start,
      endYear: row.time_end ?? row.time_start,
      eventType: row.event_type,
      participantPersonIds: unique([
        ...rawPersonIds.map((id) => compact(id).replace(/^person:/u, "")),
        ...participants.map((item) => item.entity_id.replace(/^person:/u, "")),
      ]),
      participantPeople: unique([
        ...(Array.isArray(raw.people) ? raw.people : []),
        ...participants.map((item) => item.primary_label),
      ]),
      placeEntityIds: unique([
        ...(Array.isArray(raw.placeEntityIds) ? raw.placeEntityIds : []),
        ...places.map((item) => item.entity_id),
      ]),
      placeLabels: unique([
        ...(Array.isArray(raw.places) ? raw.places : []),
        ...places.map((item) => item.primary_label),
      ]),
      evidence: selectEvidence.all(row.id),
    };
  });
  const targetEvents = events.filter((event) => {
    const machineProfileEvent = promotionProvenanceEventIds.has(event.id)
      || (
        event.raw.profileId === profileId
        && (event.id.startsWith("official-history-event:") || event.raw.machinePromoted === true)
      );
    if (machineProfileEvent) return true;
    return includeCuratedIncompleteDetail && (
      !isCompleteOfficialHistoryEventDetail(event.raw.detail)
      || (refreshGeneratedEnrichment && isOfficialHistoryEventEnrichment(event.raw.enrichment))
    );
  });
  if (targetEvents.length === 0) {
    throw new Error(`No enrichment targets found for profile ${profileId}`);
  }
  const eventTitleById = new Map(events.map((event) => [event.id, event.title]));
  const relatedRefsById = buildOfficialHistoryRelatedEventRefs(events);
  const proposals = [];
  const stats = {
    contextEvents: events.length,
    promotionProvenanceEvents: promotionProvenanceEventIds.size,
    events: targetEvents.length,
    eligible: 0,
    enriched: 0,
    refreshed: 0,
    missingDetailFilled: 0,
    legacyDetailsMigrated: 0,
    preservedManualDetail: 0,
    preservedReviewed: 0,
    relatedEventLinks: 0,
    generatedRelatedEventLinks: 0,
    preservedEditorialLinks: 0,
    possibleDuplicates: 0,
    explicitBackground: 0,
    explicitResults: 0,
    explicitImpacts: 0,
  };

  for (const event of targetEvents) {
    const ownsExistingDetail = isOfficialHistoryEventEnrichment(event.raw.enrichment);
    const hasExistingDetail = hasNonEmptyObject(event.raw.detail);
    const hasCompleteDetail = isCompleteOfficialHistoryEventDetail(event.raw.detail);
    const canMigrateLegacyDetail = hasExistingDetail
      && !hasCompleteDetail
      && hasNonEmptyObject(event.raw.detail?.fields);
    if (!isMachineMutableReviewStatus(event.review_status)) {
      const mayFillMissing = !hasExistingDetail && includeReviewedMissingDetail;
      const mayMigrateLegacy = canMigrateLegacyDetail && migrateLegacyDetail;
      const mayRefreshGenerated = ownsExistingDetail
        && refreshGeneratedEnrichment
        && event.raw.enrichment?.reviewStatus !== "reviewed";
      if (!mayFillMissing && !mayMigrateLegacy && !mayRefreshGenerated) {
        stats.preservedReviewed += 1;
        continue;
      }
    }
    if (hasCompleteDetail && !ownsExistingDetail) {
      stats.preservedManualDetail += 1;
      continue;
    }
    if (hasExistingDetail && !ownsExistingDetail && !canMigrateLegacyDetail) {
      stats.preservedManualDetail += 1;
      continue;
    }
    if (canMigrateLegacyDetail && !migrateLegacyDetail) {
      stats.preservedManualDetail += 1;
      continue;
    }
    stats.eligible += 1;

    const generatedRelatedEventRefs = relatedRefsById.get(event.id) ?? [];
    const relationMerge = mergeOfficialHistoryRelatedEventRefs(event.raw, generatedRelatedEventRefs);
    const relatedEventRefs = relationMerge.relatedEventRefs;
    const enrichmentInput = {
      ...event.raw,
      id: event.id,
      title: event.title,
      startYear: event.time_start,
      endYear: event.time_end ?? event.time_start,
      summary: event.summary,
      personIds: event.raw.personIds ?? event.participantPersonIds,
      placeEntityIds: event.raw.placeEntityIds ?? event.placeEntityIds,
    };
    const generated = buildOfficialHistoryEventDetail(
      event,
      event.evidence,
      relatedEventRefs,
      eventTitleById,
    );
    const legacyDetail = canMigrateLegacyDetail
      ? event.raw.detail
      : event.raw.enrichment?.legacyDetail;
    const detail = legacyDetail
      ? mergeLegacyOfficialHistoryEventDetail(generated.detail, legacyDetail)
      : generated.detail;
    const fieldProvenance = { ...generated.fieldProvenance };
    if (compact(legacyDetail?.fields?.content)) {
      fieldProvenance.overview = { method: "legacy-reviewed-detail", field: "detail.fields.content" };
    }
    if (compact(legacyDetail?.fields?.result)) {
      fieldProvenance.result = { method: "legacy-reviewed-detail", field: "detail.fields.result" };
    }
    if (compact(legacyDetail?.fields?.impact)) {
      fieldProvenance.impact = { method: "legacy-reviewed-detail", field: "detail.fields.impact" };
    }
    const inputFingerprint = officialHistoryEnrichmentInputFingerprint(enrichmentInput);
    const nextRaw = {
      ...event.raw,
      detail,
      relatedEvents: relationMerge.relatedEvents,
      relatedEventRefs,
      enrichment: {
        version: 2,
        generator: officialHistoryEventEnrichmentGenerator,
        profileId,
        generatedAt,
        reviewStatus: "needs-review",
        canonicalEventReviewStatus: event.review_status,
        inputFingerprint,
        evidenceLinkIds: event.evidence.map((item) => item.id),
        fieldProvenance,
        generatedRelatedEventIds: relationMerge.generatedRelatedEventIds,
        ...(legacyDetail ? { legacyDetail } : {}),
        relationPolicy: {
          causalInference: false,
          maxRelationsPerEvent: 4,
          allowedSignals: ["possible-duplicate", "shared-participant", "same-historical-context", "same-place-context"],
        },
      },
    };
    proposals.push({ event, detail, nextRaw, relatedEventRefs, inputFingerprint });
    stats.enriched += 1;
    if (ownsExistingDetail) stats.refreshed += 1;
    if (!hasExistingDetail) stats.missingDetailFilled += 1;
    if (canMigrateLegacyDetail) stats.legacyDetailsMigrated += 1;
    stats.relatedEventLinks += relatedEventRefs.length;
    stats.generatedRelatedEventLinks += relationMerge.generatedRelatedEventIds.length;
    stats.preservedEditorialLinks += relatedEventRefs.length - relationMerge.generatedRelatedEventIds.length;
    stats.possibleDuplicates += generatedRelatedEventRefs.filter((reference) => reference.relationType === "possible-duplicate").length;
    if (fieldProvenance.background.method === "pre-action-source-clause") stats.explicitBackground += 1;
    if (fieldProvenance.result.method === "explicit-source-outcome") stats.explicitResults += 1;
    if (fieldProvenance.impact.method === "explicit-source-consequence") stats.explicitImpacts += 1;
  }

  const samples = proposals.slice(0, sampleLimit).map(({ event, detail, relatedEventRefs }) => ({
    id: event.id,
    year: event.time_start,
    title: event.title,
    detail,
    relatedEvents: relatedEventRefs.map((reference) => ({
      id: reference.eventId,
      title: eventTitleById.get(reference.eventId),
      relationType: reference.relationType,
      confidence: reference.confidence,
      basis: reference.basis,
    })),
  }));

  if (!dryRun) {
    const updateEvent = db.prepare("UPDATE events SET raw_json = ? WHERE id = ?");
    const selectSearchDocuments = db.prepare(`
      SELECT id, raw_json
      FROM search_documents
      WHERE subject_table = 'events' AND subject_id = ?
      ORDER BY id
    `);
    const updateSearchDocument = db.prepare("UPDATE search_documents SET body = ?, raw_json = ? WHERE id = ?");
    let searchDocumentsUpdated = 0;

    db.exec("BEGIN");
    try {
      for (const proposal of proposals) {
        updateEvent.run(toJson(proposal.nextRaw), proposal.event.id);
        const body = searchBody(
          proposal.event,
          proposal.nextRaw,
          proposal.detail,
          proposal.event.evidence,
          proposal.relatedEventRefs,
          eventTitleById,
        );
        for (const document of selectSearchDocuments.all(proposal.event.id)) {
          const documentRaw = parseJson(document.raw_json);
          updateSearchDocument.run(
            body,
            toJson({
              ...documentRaw,
              enrichmentGenerator: officialHistoryEventEnrichmentGenerator,
              enrichmentInputFingerprint: proposal.inputFingerprint,
            }),
            document.id,
          );
          searchDocumentsUpdated += 1;
        }
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    stats.searchDocumentsUpdated = searchDocumentsUpdated;

    if (rebuildChunks) {
      rebuildDocumentChunks(db, {
        rebuildFts: true,
        log: (message) => console.log(`[enrich:official-history-events] ${message}`),
      });
    }
  }

  console.log(JSON.stringify({
    generatedAt,
    dryRun,
    profileId,
    generator: officialHistoryEventEnrichmentGenerator,
    options: {
      includeCuratedIncompleteDetail,
      includeReviewedMissingDetail,
      migrateLegacyDetail,
      refreshGeneratedEnrichment,
    },
    rebuildChunks: !dryRun && rebuildChunks,
    stats,
    samples,
  }, null, 2));
} finally {
  db.close();
}
