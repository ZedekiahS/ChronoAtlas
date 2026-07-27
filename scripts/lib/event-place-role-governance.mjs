import {
  canonicalEventPlaceRoles,
  eventPlaceRoleContractVersion,
  normalizeEventPlaceRole,
  reduceEventPlaceRoles,
} from "./event-place-role-contract.mjs";

function parseJson(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function compact(value) {
  return String(value ?? "").replace(/\s+/gu, "").trim();
}

function tuple(row) {
  return `${row.eventId}\u0000${row.entityId}\u0000${row.role}`;
}

function pairKey(eventId, entityId) {
  return `${eventId}\u0000${entityId}`;
}

function generatedRawJson(previousRole, reason, evidence = null) {
  return JSON.stringify({
    generatedFrom: eventPlaceRoleContractVersion,
    previousRole,
    normalizationReason: reason,
    evidence,
  });
}

function splitPlaceLabels(value) {
  if (typeof value !== "string") return [];
  return value
    .split(/[、,，;；/]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPlaceIndex(db) {
  const records = new Map();
  const stableIds = new Map();
  const names = new Map();
  const rows = db.prepare(`
    SELECT
      en.id,
      en.primary_label,
      en.time_start,
      en.time_end,
      en.raw_json,
      ea.value AS alias_value,
      ea.valid_start,
      ea.valid_end
    FROM entities en
    LEFT JOIN entity_aliases ea ON ea.entity_id = en.id
    WHERE en.entity_type = 'place'
    ORDER BY en.id, ea.value
  `).all();

  for (const row of rows) {
    const raw = parseJson(row.raw_json);
    const record = records.get(row.id) ?? {
      id: row.id,
      label: row.primary_label,
      stableId: raw.stablePlaceId ?? row.id.replace(/^place:/u, ""),
      timeStart: row.time_start,
      timeEnd: row.time_end,
    };
    records.set(row.id, record);
    stableIds.set(record.stableId, row.id);
    stableIds.set(row.id, row.id);

    for (const candidate of [
      { value: row.primary_label, validStart: row.time_start, validEnd: row.time_end },
      { value: row.alias_value, validStart: row.valid_start, validEnd: row.valid_end },
    ]) {
      const name = compact(candidate.value);
      if (!name) continue;
      if (!names.has(name)) names.set(name, []);
      const key = `${row.id}\u0000${candidate.validStart ?? ""}\u0000${candidate.validEnd ?? ""}`;
      if (!names.get(name).some((item) => item.key === key)) {
        names.get(name).push({ key, entityId: row.id, ...candidate });
      }
    }
  }

  function resolveName(value, year) {
    const candidates = names.get(compact(value)) ?? [];
    const uniqueAll = [...new Set(candidates.map((item) => item.entityId))];
    const valid = candidates.filter((item) => (
      year == null
      || ((item.validStart == null || item.validStart <= year) && (item.validEnd == null || item.validEnd >= year))
    ));
    const uniqueValid = [...new Set(valid.map((item) => item.entityId))];
    if (uniqueValid.length === 1) return { status: "resolved", entityId: uniqueValid[0] };
    if (uniqueValid.length > 1) return { status: "ambiguous", entityIds: uniqueValid };
    if (uniqueAll.length) return { status: "out-of-range", entityIds: uniqueAll };
    return { status: "unresolved", entityIds: [] };
  }

  return { records, stableIds, resolveName };
}

function suggestSpecificRole(event, place) {
  const title = compact(event.title);
  const label = compact(place.label);
  if (!title || !label || !title.includes(label)) return null;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(?:战于|战|攻|围|寇|讨|袭|击|破|败|陷).{0,8}${escaped}`, "u").test(title)) {
    return "battlefield";
  }
  if (new RegExp(`(?:迁都|定都|徙都).{0,6}${escaped}`, "u").test(title)) {
    return "administrative-seat";
  }
  if (new RegExp(`自${escaped}`, "u").test(title)) return "origin";
  if (new RegExp(`(?:奔|入|至|迁|徙|还|归).{0,4}${escaped}`, "u").test(title)) {
    return "destination";
  }
  return null;
}

export function analyzeEventPlaceRoles(db) {
  const placeIndex = buildPlaceIndex(db);
  const events = db.prepare(`
    SELECT id, title, event_type, time_start, time_end, region_id, place_entity_id, raw_json
    FROM events
    WHERE id NOT LIKE 'life:%'
    ORDER BY COALESCE(time_start, 9999), id
  `).all();
  const eventById = new Map(events.map((event) => [event.id, event]));
  const currentRows = db.prepare(`
    SELECT ee.event_id, ee.entity_id, ee.role, ee.sort_order, ee.raw_json, en.primary_label
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    JOIN entities en ON en.id = ee.entity_id AND en.entity_type = 'place'
    WHERE ev.id NOT LIKE 'life:%'
    ORDER BY ee.event_id, ee.sort_order, ee.entity_id, ee.role
  `).all();
  const normalizedRows = [];
  const rawNameIssues = [];
  const explicitIdIssues = [];
  const normalizedLegacyRoles = [];
  const nextSortOrder = new Map();

  for (const row of currentRows) {
    const normalizedRole = normalizeEventPlaceRole(row.role);
    const event = eventById.get(row.event_id);
    const role = normalizedRole ?? row.role;
    if (normalizedRole && normalizedRole !== row.role) {
      normalizedLegacyRoles.push({
        eventId: row.event_id,
        year: event?.time_start ?? null,
        title: event?.title ?? row.event_id,
        entityId: row.entity_id,
        entityLabel: row.primary_label,
        previousRole: row.role,
        role: normalizedRole,
      });
    }
    normalizedRows.push({
      eventId: row.event_id,
      entityId: row.entity_id,
      role,
      sortOrder: row.sort_order,
      rawJson: normalizedRole && normalizedRole !== row.role
        ? generatedRawJson(row.role, "legacy-place-role-normalized")
        : row.raw_json,
      reason: normalizedRole && normalizedRole !== row.role ? "legacy-place-role-normalized" : "unchanged",
    });
    nextSortOrder.set(row.event_id, Math.max(nextSortOrder.get(row.event_id) ?? 0, row.sort_order + 1));
  }

  const pairRows = new Map();
  const addRow = (row) => {
    const key = pairKey(row.eventId, row.entityId);
    if (!pairRows.has(key)) pairRows.set(key, []);
    pairRows.get(key).push(row);
  };
  normalizedRows.forEach(addRow);

  const addGeneratedLink = (event, entityId, role, reason, evidence) => {
    if (!placeIndex.records.has(entityId)) {
      explicitIdIssues.push({
        type: "unknown-place-id",
        eventId: event.id,
        year: event.time_start,
        title: event.title,
        regionId: event.region_id,
        entityId,
        reason,
      });
      return;
    }
    const key = pairKey(event.id, entityId);
    const rows = pairRows.get(key) ?? [];
    if (rows.some((row) => row.role === role)) return;
    const sortOrder = nextSortOrder.get(event.id) ?? 0;
    nextSortOrder.set(event.id, sortOrder + 1);
    const row = {
      eventId: event.id,
      entityId,
      role,
      sortOrder,
      rawJson: generatedRawJson(null, reason, evidence),
      reason,
    };
    addRow(row);
  };

  for (const event of events) {
    const raw = parseJson(event.raw_json);
    if (event.place_entity_id) {
      addGeneratedLink(event, event.place_entity_id, "primary-location", "events-place-entity-id", event.place_entity_id);
    }

    const explicitIds = [
      ...(Array.isArray(raw.placeEntityIds) ? raw.placeEntityIds : []),
      ...(Array.isArray(raw.placeIds) ? raw.placeIds : []).map((id) => placeIndex.stableIds.get(id) ?? `place:${id}`),
    ];
    const explicitEntityIds = [...new Set(explicitIds.filter((id) => typeof id === "string" && id))];
    const inferredPrimaryEntityId = !event.place_entity_id && explicitEntityIds.length === 1
      ? explicitEntityIds[0]
      : null;
    for (const entityId of explicitEntityIds) {
      addGeneratedLink(
        event,
        entityId,
        entityId === event.place_entity_id || entityId === inferredPrimaryEntityId
          ? "primary-location"
          : "related-location",
        "structured-place-id-linked",
        entityId,
      );
    }

    const locationLabels = splitPlaceLabels(raw.locationName);
    const rawPlaceLabels = Array.isArray(raw.places)
      ? raw.places.flatMap((item) => splitPlaceLabels(typeof item === "string" ? item : item?.label))
      : [];
    const labelInputs = [
      ...locationLabels.map((label) => ({ label, field: "locationName" })),
      ...rawPlaceLabels.map((label) => ({ label, field: "places" })),
    ];
    const resolvedLocationNames = [];
    for (const input of labelInputs) {
      const resolved = placeIndex.resolveName(input.label, event.time_start);
      if (resolved.status === "resolved") {
        resolvedLocationNames.push({ ...input, entityId: resolved.entityId });
        continue;
      }
      rawNameIssues.push({
        type: `${resolved.status}-raw-place`,
        eventId: event.id,
        year: event.time_start,
        title: event.title,
        regionId: event.region_id,
        field: input.field,
        label: input.label,
        targets: resolved.entityIds,
      });
    }
    const uniqueLocationEntities = [...new Set(resolvedLocationNames.map((item) => item.entityId))];
    for (const entityId of uniqueLocationEntities) {
      const isOnlyLocationName = locationLabels.length === 1
        && uniqueLocationEntities.length === 1
        && !event.place_entity_id;
      addGeneratedLink(
        event,
        entityId,
        isOnlyLocationName ? "primary-location" : "related-location",
        "exact-structured-place-name-linked",
        resolvedLocationNames.filter((item) => item.entityId === entityId),
      );
    }
  }

  const semanticMentionRows = db.prepare(`
    SELECT DISTINCT el.subject_id AS event_id, sm.id AS mention_id, sm.raw_json
    FROM evidence_links el
    JOIN source_mentions sm ON sm.id = el.mention_id
    WHERE el.subject_table = 'events'
      AND el.mention_id IS NOT NULL
      AND json_extract(sm.raw_json, '$.extractedPlaces') IS NOT NULL
    ORDER BY el.subject_id, sm.id
  `).all();
  for (const row of semanticMentionRows) {
    const event = eventById.get(row.event_id);
    if (!event) continue;
    const raw = parseJson(row.raw_json);
    for (const place of Array.isArray(raw.extractedPlaces) ? raw.extractedPlaces : []) {
      if (!place || place.confidence === "low") continue;
      const role = normalizeEventPlaceRole(place.role);
      if (!role || role === "source-context") continue;
      const candidateId = place.entityId ?? place.id;
      const entityId = placeIndex.stableIds.get(candidateId)
        ?? (placeIndex.records.has(candidateId) ? candidateId : null);
      if (!entityId) continue;
      addGeneratedLink(
        event,
        entityId,
        role,
        "semantic-source-place-role-linked",
        { mentionId: row.mention_id, sourceRole: place.role, confidence: place.confidence ?? null },
      );
    }
  }

  const sourceContextRows = db.prepare(`
    SELECT DISTINCT el.subject_id AS event_id, smp.place_id
    FROM evidence_links el
    JOIN source_mention_places smp ON smp.mention_id = el.mention_id
    WHERE el.subject_table = 'events' AND el.mention_id IS NOT NULL
    ORDER BY el.subject_id, smp.place_id
  `).all();
  for (const row of sourceContextRows) {
    const event = eventById.get(row.event_id);
    if (!event) continue;
    const entityId = placeIndex.stableIds.get(row.place_id) ?? (placeIndex.records.has(row.place_id) ? row.place_id : null);
    if (!entityId) {
      explicitIdIssues.push({
        type: "unknown-source-mention-place-id",
        eventId: event.id,
        year: event.time_start,
        title: event.title,
        regionId: event.region_id,
        placeId: row.place_id,
      });
      continue;
    }
    addGeneratedLink(event, entityId, "source-context", "source-mention-place-linked", row.place_id);
  }

  // A populated primary-place column is authoritative when old rows contain multiple primaries.
  for (const event of events) {
    if (!event.place_entity_id) continue;
    for (const rows of pairRows.values()) {
      for (const row of rows) {
        if (row.eventId === event.id && row.entityId !== event.place_entity_id && row.role === "primary-location") {
          row.role = "related-location";
          row.rawJson = generatedRawJson("primary-location", "demoted-by-events-place-entity-id", event.place_entity_id);
          row.reason = "demoted-by-events-place-entity-id";
        }
      }
    }
  }

  const desiredRows = [];
  for (const rows of pairRows.values()) {
    const roles = reduceEventPlaceRoles(rows.map((row) => row.role));
    for (const role of roles) {
      const selected = rows
        .filter((row) => row.role === role)
        .sort((left, right) => left.sortOrder - right.sortOrder)[0] ?? rows[0];
      desiredRows.push({ ...selected, role });
    }
  }

  const primaryRowsByEvent = new Map();
  for (const row of desiredRows.filter((item) => item.role === "primary-location")) {
    if (!primaryRowsByEvent.has(row.eventId)) primaryRowsByEvent.set(row.eventId, []);
    primaryRowsByEvent.get(row.eventId).push(row);
  }
  const multiplePrimaryLocations = [];
  const eventUpdates = [];
  for (const event of events) {
    const primaries = primaryRowsByEvent.get(event.id) ?? [];
    if (primaries.length > 1) {
      multiplePrimaryLocations.push({
        eventId: event.id,
        year: event.time_start,
        title: event.title,
        regionId: event.region_id,
        entityIds: primaries.map((row) => row.entityId),
      });
    } else if (primaries.length === 1 && event.place_entity_id !== primaries[0].entityId) {
      const place = placeIndex.records.get(primaries[0].entityId);
      eventUpdates.push({
        eventId: event.id,
        entityId: primaries[0].entityId,
        placeId: place.stableId,
        label: place.label,
      });
    }
  }

  const roleSuggestions = [];
  for (const row of desiredRows) {
    if (!["primary-location", "related-location"].includes(row.role)) continue;
    const event = eventById.get(row.eventId);
    const place = placeIndex.records.get(row.entityId);
    const suggestedRole = suggestSpecificRole(event, place);
    if (suggestedRole) {
      roleSuggestions.push({
        type: "specific-place-role-suggestion",
        eventId: event.id,
        year: event.time_start,
        title: event.title,
        regionId: event.region_id,
        entityId: place.id,
        entityLabel: place.label,
        currentRole: row.role,
        suggestedRole,
      });
    }
  }

  const currentSet = new Set(currentRows.map((row) => tuple({
    eventId: row.event_id,
    entityId: row.entity_id,
    role: row.role,
  })));
  const desiredSet = new Set(desiredRows.map(tuple));
  const deletes = currentRows
    .filter((row) => !desiredSet.has(tuple({ eventId: row.event_id, entityId: row.entity_id, role: row.role })))
    .map((row) => ({ eventId: row.event_id, entityId: row.entity_id, role: row.role }));
  const inserts = desiredRows.filter((row) => !currentSet.has(tuple(row)));
  const unknownRoleRows = desiredRows.filter((row) => !canonicalEventPlaceRoles.has(row.role));
  const orphanLinks = db.prepare(`
    SELECT ee.event_id, ee.entity_id, ee.role
    FROM event_entities ee
    LEFT JOIN entities en ON en.id = ee.entity_id
    LEFT JOIN events ev ON ev.id = ee.event_id
    WHERE (en.id IS NULL OR ev.id IS NULL)
      AND (ee.entity_id LIKE 'place:%' OR en.entity_type = 'place')
  `).all();
  const candidateRows = desiredRows
    .filter((row) => row.role === "location-candidate")
    .map((row) => {
      const event = eventById.get(row.eventId);
      const place = placeIndex.records.get(row.entityId);
      return {
        type: "location-candidate",
        eventId: row.eventId,
        year: event?.time_start ?? null,
        title: event?.title ?? row.eventId,
        regionId: event?.region_id ?? null,
        entityId: row.entityId,
        entityLabel: place?.label ?? row.entityId,
      };
    });
  const reviewItems = [
    ...candidateRows,
    ...rawNameIssues,
    ...explicitIdIssues,
    ...multiplePrimaryLocations.map((item) => ({ type: "multiple-primary-locations", ...item })),
    ...roleSuggestions,
  ];

  return {
    contractVersion: eventPlaceRoleContractVersion,
    metrics: {
      placeEntities: placeIndex.records.size,
      currentLinks: currentRows.length,
      desiredLinks: desiredRows.length,
      eventsWithPlaces: new Set(desiredRows.map((row) => row.eventId)).size,
      deletes: deletes.length,
      inserts: inserts.length,
      eventUpdates: eventUpdates.length,
      normalizedLegacyRoles: normalizedLegacyRoles.length,
      sourceContextLinks: desiredRows.filter((row) => row.role === "source-context").length,
      candidates: candidateRows.length,
      rawNameIssues: rawNameIssues.length,
      explicitIdIssues: explicitIdIssues.length,
      multiplePrimaryLocations: multiplePrimaryLocations.length,
      roleSuggestions: roleSuggestions.length,
      unknownRoles: unknownRoleRows.length,
      orphanLinks: orphanLinks.length,
      reviewItems: reviewItems.length,
    },
    deletes,
    inserts,
    desiredRows,
    eventUpdates,
    normalizedLegacyRoles,
    rawNameIssues,
    explicitIdIssues,
    multiplePrimaryLocations,
    roleSuggestions,
    unknownRoleRows,
    orphanLinks,
    reviewItems,
  };
}
