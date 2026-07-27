function replacementTarget(eventId, replacements) {
  let current = eventId;
  const visited = new Set();
  while (replacements.has(current) && !visited.has(current)) {
    visited.add(current);
    current = replacements.get(current);
  }
  return current;
}

function uniqueEventIds(eventIds, selfId) {
  const seen = new Set();
  return eventIds.filter((eventId) => {
    if (!eventId || eventId === selfId || seen.has(eventId)) return false;
    seen.add(eventId);
    return true;
  });
}

export function canonicalizeRelatedEventReferences(raw, eventId, replacements) {
  const relatedEvents = Array.isArray(raw?.relatedEvents) ? raw.relatedEvents : [];
  const relatedEventRefs = Array.isArray(raw?.relatedEventRefs) ? raw.relatedEventRefs : [];
  const generatedRelatedEventIds = Array.isArray(raw?.enrichment?.generatedRelatedEventIds)
    ? raw.enrichment.generatedRelatedEventIds
    : [];
  const nextRelatedEvents = uniqueEventIds(
    relatedEvents.map((relatedId) => replacementTarget(relatedId, replacements)),
    eventId,
  );
  const refIds = new Set();
  const nextRelatedEventRefs = relatedEventRefs.flatMap((reference) => {
    if (!reference?.eventId) return [reference];
    const canonicalId = replacementTarget(reference.eventId, replacements);
    if (canonicalId === eventId || refIds.has(canonicalId)) return [];
    refIds.add(canonicalId);
    return [{ ...reference, eventId: canonicalId }];
  });
  const nextGeneratedRelatedEventIds = uniqueEventIds(
    generatedRelatedEventIds.map((relatedId) => replacementTarget(relatedId, replacements)),
    eventId,
  );
  const changed = JSON.stringify(relatedEvents) !== JSON.stringify(nextRelatedEvents)
    || JSON.stringify(relatedEventRefs) !== JSON.stringify(nextRelatedEventRefs)
    || JSON.stringify(generatedRelatedEventIds) !== JSON.stringify(nextGeneratedRelatedEventIds);
  if (!changed) return { changed: false, raw };

  return {
    changed: true,
    raw: {
      ...raw,
      relatedEvents: nextRelatedEvents,
      relatedEventRefs: nextRelatedEventRefs,
      ...(raw.enrichment && generatedRelatedEventIds.length
        ? {
          enrichment: {
            ...raw.enrichment,
            generatedRelatedEventIds: nextGeneratedRelatedEventIds,
          },
        }
        : {}),
    },
  };
}
