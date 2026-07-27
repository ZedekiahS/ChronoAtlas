import { createHash } from "node:crypto";

export const machineMutableReviewStatuses = new Set(["draft", "needs-review"]);

export function stableId(value, length = 20) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

export function parseJson(value, fallback = {}) {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function toJson(value) {
  return JSON.stringify(value ?? {});
}

export function compact(value) {
  return String(value ?? "")
    .replace(/\u3000/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function truncate(value, maxLength) {
  const text = compact(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function normalizeIdentityText(value) {
  return compact(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[《》〈〉「」『』“”‘’：:，,。.、；;！？?!（）()\[\]【】\s]/gu, "");
}

export function isMachineMutableReviewStatus(reviewStatus) {
  return machineMutableReviewStatuses.has(String(reviewStatus ?? "draft"));
}

export function officialHistoryCandidatePromotionEligibility(raw = {}) {
  const disposition = raw.candidateRepair?.disposition ?? null;
  if (disposition) {
    return disposition === "promote"
      ? { eligible: true, reason: "editorial-promote" }
      : { eligible: false, reason: "editorialNotEligible", disposition };
  }
  if (
    raw.pipeline === "official-history-semantic-candidates-v1"
    && raw.semanticRecommendation !== "eligible"
  ) {
    return {
      eligible: false,
      reason: "semanticNotEligible",
      recommendation: raw.semanticRecommendation ?? null,
    };
  }
  return { eligible: true, reason: "rule-based-default" };
}

export function allowsEditorialCollectivePromotion(raw = {}) {
  return raw.candidateRepair?.disposition === "promote"
    && raw.candidateRepair?.allowCollectiveEvent === true;
}

export function independentEvidenceKey(card) {
  return [card.source_id ?? "unknown-source", card.passage_id ?? "unknown-passage", card.card_id].join(":");
}

export function resolveBoundedTime({ cardYear, mentionYear, resolvedDate, passageStart, passageEnd, maxInheritedSpan = 5 }) {
  for (const [year, method] of [[cardYear, "card-year"], [mentionYear, "mention-year"]]) {
    if (Number.isInteger(year)) {
      return { start: year, end: year, precision: "year", method, confidence: "high" };
    }
  }

  if (Number.isInteger(resolvedDate?.year)) {
    return {
      start: resolvedDate.year,
      end: resolvedDate.year,
      precision: "year",
      method: resolvedDate.method ?? "chronology-resolver",
      confidence: resolvedDate.confidence ?? "medium",
      chronology: resolvedDate,
    };
  }

  if (Number.isInteger(passageStart) && Number.isInteger(passageEnd)) {
    const span = Math.abs(passageEnd - passageStart);
    if (span === 0) {
      return { start: passageStart, end: passageEnd, precision: "year", method: "passage-year", confidence: "medium" };
    }
    if (span <= maxInheritedSpan) {
      return { start: passageStart, end: passageEnd, precision: "range", method: "passage-range", confidence: "low" };
    }
  }

  return {
    start: null,
    end: null,
    precision: "unknown",
    method: "unresolved",
    confidence: "low",
    sourceRange: Number.isInteger(passageStart) || Number.isInteger(passageEnd)
      ? [passageStart ?? null, passageEnd ?? passageStart ?? null]
      : null,
  };
}

export function applyEditorialChronology(time, chronology) {
  if (!chronology || !Number.isInteger(chronology.year)) return time;
  const start = chronology.year;
  const end = Number.isInteger(chronology.endYear) ? chronology.endYear : start;
  if (end < start) {
    throw new Error(`Invalid editorial chronology range: ${start}-${end}`);
  }
  return {
    start,
    end,
    precision: start === end ? "year" : "range",
    method: chronology.method ?? "editorial-chronology",
    confidence: chronology.confidence ?? "high",
    chronology,
  };
}

export function generatedEventId(profileId, anchorCardId) {
  return `official-history-event:${stableId(`${profileId}:${anchorCardId}`)}`;
}

export function isCompatibleClusterMatchedEvent(event, {
  profileId,
  regionId,
  year,
  endYear = year,
  allowMachineChronologyCorrection = false,
  allowCrossProfileMachineEvent = false,
}) {
  if (!event || event.id?.startsWith("life:")) return false;
  if (event.region_id !== regionId) return false;
  const eventEnd = event.time_end ?? event.time_start;
  const sameRange = event.time_start === year && eventEnd === endYear;
  if (!sameRange) {
    const canCorrectMachineChronology = allowMachineChronologyCorrection
      && event.id.startsWith("official-history-event:")
      && isMachineMutableReviewStatus(event.review_status)
      && parseJson(event.raw_json).profileId === profileId
      && Number.isInteger(event.time_start)
      && Number.isInteger(eventEnd)
      && Math.abs(event.time_start - year) <= 1
      && Math.abs(eventEnd - endYear) <= 1;
    if (!canCorrectMachineChronology) return false;
  }
  if (!event.id.startsWith("official-history-event:")) return true;
  return allowCrossProfileMachineEvent || parseJson(event.raw_json).profileId === profileId;
}

export function shouldCleanupEntirePromotionProfile({ requestedBatchIds = [], cleanupProfile = false } = {}) {
  return cleanupProfile || requestedBatchIds.length === 0;
}

export function isResolvedPromotionEventTime(event, raw = parseJson(event?.raw_json)) {
  const start = event?.time_start;
  const end = event?.time_end;
  if (!Number.isInteger(start) || !Number.isInteger(end)) return false;
  if (start === end) return event.time_precision === "year";
  if (event.time_precision !== "range") return false;
  return (Array.isArray(raw?.timeResolution) ? raw.timeResolution : []).some((resolution) => (
    resolution?.start === start
    && resolution?.end === end
    && resolution?.precision === "range"
    && resolution?.method === "editorial-chronology"
    && resolution?.confidence === "high"
  ));
}

export function isStaleMachineEventOwnedByRequestedBatches({
  event,
  generatorId,
  activeEventIds = [],
  requestedBatchIds = [],
  eventBatchIds = [],
  hasUnownedData = false,
} = {}) {
  if (!event?.id?.startsWith("official-history-event:")) return false;
  if (!generatorId || parseJson(event.raw_json).generator !== generatorId) return false;
  if (!isMachineMutableReviewStatus(event.review_status) || hasUnownedData) return false;
  const activeIds = activeEventIds instanceof Set ? activeEventIds : new Set(activeEventIds);
  if (activeIds.has(event.id)) return false;
  const requested = new Set(requestedBatchIds.filter(Boolean));
  const owned = [...new Set(eventBatchIds.filter(Boolean))];
  return requested.size > 0 && owned.length > 0 && owned.every((batchId) => requested.has(batchId));
}

export function selectPromotionProvenanceMatch({
  editorialMatchedEventIds = [],
  linkedEventIds = [],
} = {}) {
  const editorialIds = [...new Set(editorialMatchedEventIds.filter(Boolean))];
  if (editorialIds.length > 1) return { conflictingEventIds: editorialIds };
  if (editorialIds.length === 1) {
    return { eventId: editorialIds[0], matchType: "editorial-matched-event" };
  }
  const linkedIds = [...new Set(linkedEventIds.filter(Boolean))];
  return linkedIds.length
    ? { eventId: linkedIds[0], matchType: "existing-provenance" }
    : null;
}

export function isFullySupersededMachineEvent({
  event,
  generatorId,
  linkedCardIds = [],
  redirectedCardIds = [],
  activeEventIds = [],
} = {}) {
  if (!event?.id?.startsWith("official-history-event:")) return false;
  if (!generatorId || parseJson(event.raw_json).generator !== generatorId) return false;
  if (!isMachineMutableReviewStatus(event.review_status)) return false;
  const activeIds = activeEventIds instanceof Set ? activeEventIds : new Set(activeEventIds);
  if (activeIds.has(event.id)) return false;
  const linkedIds = new Set(linkedCardIds.filter(Boolean));
  if (!linkedIds.size) return false;
  const redirectedIds = new Set(redirectedCardIds.filter(Boolean));
  return [...linkedIds].every((cardId) => redirectedIds.has(cardId));
}

export function promotionBatchIdsForCards(cards = []) {
  return [...new Set(cards.map((card) => card?.batch_id).filter(Boolean))];
}

export function mergePromotionProvenanceSnapshot(raw = {}, provenanceRows = []) {
  return {
    ...raw,
    batchIds: [...new Set([
      ...(Array.isArray(raw.batchIds) ? raw.batchIds : []),
      ...provenanceRows.map((row) => row?.batch_id).filter(Boolean),
    ])],
    cardIds: [...new Set([
      ...(Array.isArray(raw.cardIds) ? raw.cardIds : []),
      ...provenanceRows.map((row) => row?.card_id).filter(Boolean),
    ])],
  };
}

export function shouldReplaceOwnedPromotionData({
  cleanupEntireProfile = false,
  requestedBatchIds = [],
  existingBatchIds = [],
  proposalOwnsExistingEvent = false,
  isGeneratedEvent = false,
} = {}) {
  if (!isGeneratedEvent || !proposalOwnsExistingEvent) return false;
  if (cleanupEntireProfile) return true;
  if (requestedBatchIds.length === 0 || existingBatchIds.length === 0) return false;
  const requested = new Set(requestedBatchIds);
  return existingBatchIds.every((batchId) => requested.has(batchId));
}

function uniqueArray(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined))];
}

function mergeObjectArray(existingValues, incomingValues, keyForValue) {
  return [...new Map(
    [...(Array.isArray(existingValues) ? existingValues : []), ...(Array.isArray(incomingValues) ? incomingValues : [])]
      .map((value) => [keyForValue(value), value]),
  ).values()];
}

export function mergePromotionGenerationRaw(existingRaw = {}, generationRaw = {}, options = {}) {
  const stableAnchorCardId = existingRaw.anchorCardId ?? generationRaw.anchorCardId ?? null;
  const incomingCardIds = Array.isArray(generationRaw.cardIds) ? generationRaw.cardIds : [];
  const incomingOwnsAnchor = stableAnchorCardId === null || incomingCardIds.includes(stableAnchorCardId);
  const anchorRaw = incomingOwnsAnchor || options.preferIncomingEditorialFields
    ? generationRaw
    : existingRaw;
  const sourceRefs = mergeObjectArray(
    existingRaw.sourceRefs,
    generationRaw.sourceRefs,
    (sourceRef) => sourceRef?.cardId ?? `${sourceRef?.sourceId ?? ""}:${sourceRef?.locator ?? ""}`,
  );
  const cardIds = uniqueArray([...(existingRaw.cardIds ?? []), ...incomingCardIds]);
  const people = uniqueArray([...(existingRaw.people ?? []), ...(generationRaw.people ?? [])]);
  const personIds = uniqueArray([...(existingRaw.personIds ?? []), ...(generationRaw.personIds ?? [])]);
  const places = uniqueArray([...(existingRaw.places ?? []), ...(generationRaw.places ?? [])]);
  const placeIds = uniqueArray([...(existingRaw.placeIds ?? []), ...(generationRaw.placeIds ?? [])]);
  const placeEntityIds = uniqueArray([
    ...(existingRaw.placeEntityIds ?? []),
    ...(generationRaw.placeEntityIds ?? []),
  ]);
  const sourceCount = new Set(sourceRefs.map((sourceRef) => sourceRef?.sourceId).filter(Boolean)).size;

  return {
    ...existingRaw,
    ...generationRaw,
    title: anchorRaw.title ?? generationRaw.title,
    titleZh: anchorRaw.titleZh ?? generationRaw.titleZh,
    summary: anchorRaw.summary ?? generationRaw.summary,
    category: anchorRaw.category ?? generationRaw.category,
    confidence: anchorRaw.confidence ?? generationRaw.confidence,
    locationName: anchorRaw.locationName ?? generationRaw.locationName ?? existingRaw.locationName ?? null,
    primaryPlaceEntityId: anchorRaw.primaryPlaceEntityId
      ?? generationRaw.primaryPlaceEntityId
      ?? existingRaw.primaryPlaceEntityId
      ?? null,
    batchIds: uniqueArray([...(existingRaw.batchIds ?? []), ...(generationRaw.batchIds ?? [])]),
    cardIds,
    clusterIds: uniqueArray([...(existingRaw.clusterIds ?? []), ...(generationRaw.clusterIds ?? [])]),
    sources: uniqueArray([...(existingRaw.sources ?? []), ...(generationRaw.sources ?? [])]),
    people,
    personIds,
    places,
    placeIds,
    placeEntityIds,
    mapFeatureIds: uniqueArray([...(existingRaw.mapFeatureIds ?? []), ...(generationRaw.mapFeatureIds ?? [])]),
    tags: uniqueArray([...(existingRaw.tags ?? []), ...(generationRaw.tags ?? [])]),
    polities: uniqueArray([...(existingRaw.polities ?? []), ...(generationRaw.polities ?? [])]),
    timeResolution: mergeObjectArray(
      existingRaw.timeResolution,
      generationRaw.timeResolution,
      (resolution) => JSON.stringify(resolution),
    ),
    sourceRefs,
    anchorCardId: stableAnchorCardId,
    promotionIdentity: existingRaw.promotionIdentity ?? generationRaw.promotionIdentity,
    promotionIdentities: uniqueArray([
      ...(existingRaw.promotionIdentities ?? [existingRaw.promotionIdentity]),
      ...(generationRaw.promotionIdentities ?? [generationRaw.promotionIdentity]),
    ]),
    evidenceCount: cardIds.length,
    sourceCount: sourceCount || uniqueArray([...(existingRaw.sources ?? []), ...(generationRaw.sources ?? [])]).length,
    personCount: personIds.length || people.length,
    placeCount: placeEntityIds.length || placeIds.length || places.length,
  };
}
