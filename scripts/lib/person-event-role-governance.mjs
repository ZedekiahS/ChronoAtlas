import {
  canonicalPersonEventRoles,
  looksLikeUnresolvedChinesePersonName,
  normalizePersonEventRole,
  personEventRoleContractVersion,
  reducePersonEventRoles,
} from "./person-event-role-contract.mjs";

function parseRawJson(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function canonicalNestedPersonEntityId(entityId, entityIds) {
  let candidate = entityId;
  while (candidate.startsWith("person:person:")) candidate = candidate.slice("person:".length);
  return candidate !== entityId && entityIds.has(candidate) ? candidate : entityId;
}

function buildPersonNameIndex(db, entityIds) {
  const index = new Map();
  const rows = db.prepare(`
    SELECT primary_label AS name, id
    FROM entities
    WHERE entity_type = 'person'
    UNION ALL
    SELECT ea.value AS name, en.id
    FROM entity_aliases ea
    JOIN entities en ON en.id = ea.entity_id AND en.entity_type = 'person'
  `).all();

  for (const row of rows) {
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    if (!index.has(name)) index.set(name, new Set());
    index.get(name).add(canonicalNestedPersonEntityId(row.id, entityIds));
  }
  return index;
}

function roleTuple(row) {
  return `${row.eventId}\u0000${row.entityId}\u0000${row.role}`;
}

function pairKey(eventId, entityId) {
  return `${eventId}\u0000${entityId}`;
}

function generatedRawJson(previousRole, reason) {
  return JSON.stringify({
    generatedFrom: personEventRoleContractVersion,
    previousRole,
    normalizationReason: reason,
  });
}

export function analyzePersonEventRoles(db) {
  const entityLabels = new Map(
    db.prepare("SELECT id, primary_label FROM entities WHERE entity_type = 'person'")
      .all()
      .map((row) => [row.id, row.primary_label]),
  );
  const entityIds = new Set(entityLabels.keys());
  const nameIndex = buildPersonNameIndex(db, entityIds);
  const events = db.prepare(`
    SELECT id, time_start, title, region_id, raw_json
    FROM events
    WHERE id NOT LIKE 'life:%'
    ORDER BY COALESCE(time_start, 9999), id
  `).all();
  const eventById = new Map(events.map((event) => [event.id, event]));
  const currentRows = db.prepare(`
    SELECT
      ee.event_id,
      ee.entity_id,
      ee.role,
      ee.sort_order,
      ee.raw_json,
      en.primary_label
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    JOIN entities en ON en.id = ee.entity_id AND en.entity_type = 'person'
    WHERE ev.id NOT LIKE 'life:%'
    ORDER BY ee.event_id, ee.sort_order, ee.entity_id, ee.role
  `).all();
  const currentPairKeys = new Set(currentRows.map((row) => pairKey(
    row.event_id,
    canonicalNestedPersonEntityId(row.entity_id, entityIds),
  )));
  const normalizedRows = [];
  const identityRepairs = [];
  const unresolvedNameRoles = [];
  const ambiguousNameRoles = [];

  for (const row of currentRows) {
    const role = String(row.role ?? "").trim();
    const raw = parseRawJson(row.raw_json);
    const canonicalEntityId = canonicalNestedPersonEntityId(row.entity_id, entityIds);
    const nestedIdCanonicalized = canonicalEntityId !== row.entity_id;
    if (nestedIdCanonicalized) {
      identityRepairs.push({
        eventId: row.event_id,
        year: eventById.get(row.event_id)?.time_start ?? null,
        title: eventById.get(row.event_id)?.title ?? row.event_id,
        sourceEntityId: row.entity_id,
        sourceLabel: row.primary_label,
        role,
        targetEntityId: canonicalEntityId,
        targetLabel: entityLabels.get(canonicalEntityId) ?? row.primary_label,
        action: "canonicalize-nested-person-id",
      });
    }
    const matchingEntityIds = nameIndex.get(role);

    if (matchingEntityIds?.has(canonicalEntityId)) {
      normalizedRows.push({
        eventId: row.event_id,
        entityId: canonicalEntityId,
        role: "participant-candidate",
        sortOrder: row.sort_order,
        rawJson: generatedRawJson(role, "person-name-used-as-role"),
        reason: "person-name-used-as-role",
      });
      continue;
    }

    if (matchingEntityIds?.size === 1) {
      const targetEntityId = [...matchingEntityIds][0];
      const targetExists = currentPairKeys.has(pairKey(row.event_id, targetEntityId));
      identityRepairs.push({
        eventId: row.event_id,
        year: eventById.get(row.event_id)?.time_start ?? null,
        title: eventById.get(row.event_id)?.title ?? row.event_id,
        sourceEntityId: row.entity_id,
        sourceLabel: row.primary_label,
        role,
        targetEntityId,
        targetLabel: entityLabels.get(targetEntityId) ?? role,
        action: targetExists ? "drop-misbinding-use-existing-target" : "rebind-as-candidate",
      });
      if (!targetExists) {
        normalizedRows.push({
          eventId: row.event_id,
          entityId: targetEntityId,
          role: "participant-candidate",
          sortOrder: row.sort_order,
          rawJson: generatedRawJson(role, "person-name-role-rebound"),
          reason: "person-name-role-rebound",
        });
      }
      continue;
    }

    if (matchingEntityIds?.size > 1) {
      ambiguousNameRoles.push({
        eventId: row.event_id,
        entityId: canonicalEntityId,
        entityLabel: row.primary_label,
        role,
        targets: [...matchingEntityIds],
      });
      normalizedRows.push({
        eventId: row.event_id,
        entityId: canonicalEntityId,
        role,
        sortOrder: row.sort_order,
        rawJson: row.raw_json,
        reason: "ambiguous-name-role",
      });
      continue;
    }

    if (raw.generatedFrom === "historical_event_people" && looksLikeUnresolvedChinesePersonName(role)) {
      unresolvedNameRoles.push({
        eventId: row.event_id,
        year: eventById.get(row.event_id)?.time_start ?? null,
        title: eventById.get(row.event_id)?.title ?? row.event_id,
        erroneousEntityId: row.entity_id,
        erroneousEntityLabel: row.primary_label,
        unresolvedName: role,
      });
      continue;
    }

    const normalizedRole = normalizePersonEventRole(role);
    const roleChanged = normalizedRole && normalizedRole !== role;
    const normalizationReason = [
      nestedIdCanonicalized ? "nested-person-id-canonicalized" : null,
      roleChanged ? "legacy-role-normalized" : null,
    ].filter(Boolean).join("+");
    normalizedRows.push({
      eventId: row.event_id,
      entityId: canonicalEntityId,
      role: normalizedRole ?? role,
      sortOrder: row.sort_order,
      rawJson: normalizationReason
        ? generatedRawJson(role, normalizationReason)
        : row.raw_json,
      reason: normalizationReason || "unchanged",
    });
  }

  const normalizedPairKeys = new Set(normalizedRows.map((row) => pairKey(row.eventId, row.entityId)));
  const nextSortOrderByEvent = new Map();
  for (const row of currentRows) {
    nextSortOrderByEvent.set(
      row.event_id,
      Math.max(nextSortOrderByEvent.get(row.event_id) ?? 0, (row.sort_order ?? 0) + 1),
    );
  }
  const uniqueMissingRawPeople = [];
  const ambiguousRawPeople = [];
  const unresolvedRawPeople = [];

  for (const event of events) {
    const raw = parseRawJson(event.raw_json);
    const people = Array.isArray(raw.people) ? raw.people : [];
    for (const rawName of people) {
      const name = typeof rawName === "string" ? rawName.trim() : "";
      if (!name) continue;
      const targets = nameIndex.get(name);
      if (!targets) {
        unresolvedRawPeople.push({
          eventId: event.id,
          year: event.time_start,
          title: event.title,
          regionId: event.region_id,
          name,
        });
        continue;
      }
      if (targets.size > 1) {
        if (![...targets].some((target) => normalizedPairKeys.has(pairKey(event.id, target)))) {
          ambiguousRawPeople.push({
            eventId: event.id,
            year: event.time_start,
            title: event.title,
            regionId: event.region_id,
            name,
            targets: [...targets],
          });
        }
        continue;
      }

      const entityId = [...targets][0];
      const key = pairKey(event.id, entityId);
      if (normalizedPairKeys.has(key)) continue;
      const sortOrder = nextSortOrderByEvent.get(event.id) ?? 0;
      nextSortOrderByEvent.set(event.id, sortOrder + 1);
      normalizedRows.push({
        eventId: event.id,
        entityId,
        role: "participant-candidate",
        sortOrder,
        rawJson: generatedRawJson(null, "unique-raw-person-name-linked"),
        reason: "unique-raw-person-name-linked",
      });
      normalizedPairKeys.add(key);
      uniqueMissingRawPeople.push({
        eventId: event.id,
        year: event.time_start,
        title: event.title,
        regionId: event.region_id,
        name,
        entityId,
      });
    }
  }

  const rowsByPair = new Map();
  for (const row of normalizedRows) {
    const key = pairKey(row.eventId, row.entityId);
    if (!rowsByPair.has(key)) rowsByPair.set(key, []);
    rowsByPair.get(key).push(row);
  }

  const desiredRows = [];
  const multiRolePairs = [];
  for (const pairRows of rowsByPair.values()) {
    const roles = reducePersonEventRoles(pairRows.map((row) => row.role));
    if (roles.length > 1) {
      const first = pairRows[0];
      multiRolePairs.push({
        eventId: first.eventId,
        year: eventById.get(first.eventId)?.time_start ?? null,
        title: eventById.get(first.eventId)?.title ?? first.eventId,
        regionId: eventById.get(first.eventId)?.region_id ?? null,
        entityId: first.entityId,
        entityLabel: entityLabels.get(first.entityId) ?? first.entityId,
        roles,
      });
    }
    for (const role of roles) {
      const candidates = pairRows.filter((row) => row.role === role);
      const selected = candidates.sort((left, right) => left.sortOrder - right.sortOrder)[0] ?? pairRows[0];
      desiredRows.push({ ...selected, role });
    }
  }

  const currentSet = new Set(currentRows.map((row) => roleTuple({
    eventId: row.event_id,
    entityId: row.entity_id,
    role: row.role,
  })));
  const desiredSet = new Set(desiredRows.map(roleTuple));
  const deletes = currentRows
    .filter((row) => !desiredSet.has(roleTuple({ eventId: row.event_id, entityId: row.entity_id, role: row.role })))
    .map((row) => ({ eventId: row.event_id, entityId: row.entity_id, role: row.role }));
  const inserts = desiredRows.filter((row) => !currentSet.has(roleTuple(row)));
  const unknownRoleRows = desiredRows.filter((row) => !canonicalPersonEventRoles.has(row.role));
  const candidateRows = desiredRows.filter((row) => row.role === "participant-candidate").map((row) => ({
    eventId: row.eventId,
    year: eventById.get(row.eventId)?.time_start ?? null,
    title: eventById.get(row.eventId)?.title ?? row.eventId,
    regionId: eventById.get(row.eventId)?.region_id ?? null,
    entityId: row.entityId,
    entityLabel: entityLabels.get(row.entityId) ?? row.entityId,
    reason: row.reason,
  }));
  const orphanLinks = db.prepare(`
    SELECT ee.event_id, ee.entity_id, ee.role
    FROM event_entities ee
    LEFT JOIN entities en ON en.id = ee.entity_id
    LEFT JOIN events ev ON ev.id = ee.event_id
    WHERE en.id IS NULL OR ev.id IS NULL
  `).all();

  const reviewItems = [
    ...candidateRows.map((item) => ({ type: "participant-candidate", ...item })),
    ...ambiguousRawPeople.map((item) => ({ type: "ambiguous-raw-person", ...item })),
    ...unresolvedRawPeople.map((item) => ({ type: "unresolved-raw-person", ...item })),
    ...unresolvedNameRoles.map((item) => ({ type: "unresolved-person-name-role", ...item })),
    ...ambiguousNameRoles.map((item) => ({ type: "ambiguous-person-name-role", ...item })),
    ...multiRolePairs.map((item) => ({ type: "multiple-canonical-roles", ...item })),
  ];

  return {
    contractVersion: personEventRoleContractVersion,
    metrics: {
      currentLinks: currentRows.length,
      currentPairs: currentPairKeys.size,
      desiredLinks: desiredRows.length,
      desiredPairs: rowsByPair.size,
      deletes: deletes.length,
      inserts: inserts.length,
      identityRepairs: identityRepairs.length,
      normalizedUniqueRawPeople: uniqueMissingRawPeople.length,
      participantCandidates: candidateRows.length,
      ambiguousRawPeople: ambiguousRawPeople.length,
      unresolvedRawPeople: unresolvedRawPeople.length,
      unresolvedNameRoles: unresolvedNameRoles.length,
      unknownRoles: unknownRoleRows.length,
      multiRolePairs: multiRolePairs.length,
      orphanLinks: orphanLinks.length,
      reviewItems: reviewItems.length,
    },
    deletes,
    inserts,
    desiredRows,
    identityRepairs,
    uniqueMissingRawPeople,
    ambiguousRawPeople,
    unresolvedRawPeople,
    unresolvedNameRoles,
    ambiguousNameRoles,
    unknownRoleRows,
    multiRolePairs,
    orphanLinks,
    reviewItems,
  };
}
