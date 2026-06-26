import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const draftsDir = path.join(rootDir, "data", "import-drafts");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const requestedFiles = process.argv.slice(2);

const collectionSpecs = [
  ["sources", "sources", "id"],
  ["sourcePassages", "source_passages", "id"],
  ["sourceMentions", "source_mentions", "id"],
  ["personLifeEvents", "person_life_events", "id"],
  ["personRelations", "person_relations", "id"],
  ["historicalEvents", "historical_events", "id"],
  ["evidenceCards", null, null],
];

function normalizeRelativePath(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, "/");
}

async function collectJsonFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJsonFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function hasText(value) {
  return typeof value === "string" && value.length > 0;
}

function firstText(...values) {
  return values.find(hasText);
}

function asDraftObject(draft) {
  if (Array.isArray(draft)) {
    return { evidenceCards: draft };
  }
  return draft ?? {};
}

function arrayFromValue(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
}

function isNeedsId(value) {
  return typeof value === "string" && value.startsWith("needs-id:");
}

function shortText(value, maxLength = 80) {
  if (!hasText(value)) {
    return "";
  }
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function tokenize(text) {
  if (!hasText(text)) {
    return [];
  }
  return [...new Set(text.match(/[\p{Script=Han}]{2,}|[a-z0-9-]{3,}/giu) ?? [])];
}

function addUnique(map, key, value) {
  if (!key) {
    return;
  }
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function hasRow(db, tableName, id) {
  if (!hasText(id)) {
    return false;
  }
  return Boolean(db.prepare(`SELECT 1 FROM ${tableName} WHERE id = ?`).get(id));
}

function getRows(db, tableName, id) {
  if (!hasText(id)) {
    return [];
  }
  return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).all(id);
}

function getExistingRows(db, tableName, ids) {
  if (!tableName) {
    return [];
  }

  const existing = [];
  for (const id of ids) {
    if (hasRow(db, tableName, id)) {
      existing.push(id);
    }
  }
  return existing;
}

function queryRows(db, sql, params = []) {
  return db.prepare(sql).all(...params);
}

function createIssueCollector() {
  const errors = [];
  const warnings = [];
  const info = [];
  return {
    errors,
    warnings,
    info,
    error(condition, message) {
      if (!condition) {
        errors.push(message);
      }
    },
    warn(condition, message) {
      if (!condition) {
        warnings.push(message);
      }
    },
    note(message) {
      info.push(message);
    },
  };
}

function collectIds(records, key = "id") {
  const ids = new Set();
  const duplicateIds = [];

  for (const record of records) {
    if (!hasText(record?.[key])) {
      continue;
    }
    if (ids.has(record[key])) {
      duplicateIds.push(record[key]);
    }
    ids.add(record[key]);
  }

  return { ids, duplicateIds };
}

function validateSource(source, index, issues) {
  const itemId = source?.id ?? `sources[${index}]`;
  issues.error(hasText(source?.id), `Source needs id: ${itemId}`);
  issues.error(hasText(source?.title), `Source needs title: ${itemId}`);
  issues.warn(hasText(source?.type) || hasText(source?.sourceType), `Source needs type/sourceType: ${itemId}`);
  issues.warn(hasText(source?.citationShort), `Source needs citationShort: ${itemId}`);
  issues.warn(hasText(source?.note), `Source should include note: ${itemId}`);
  issues.warn(!("sourceType" in source) || "type" in source, `Source uses sourceType instead of DB field type; importer must normalize it: ${itemId}`);
}

function validatePassage(passage, index, localIds, db, issues) {
  const itemId = passage?.id ?? `sourcePassages[${index}]`;
  issues.error(hasText(passage?.id), `Source passage needs id: ${itemId}`);
  issues.error(hasText(passage?.sourceId), `Source passage needs sourceId: ${itemId}`);
  issues.error(hasText(passage?.locator), `Source passage needs locator: ${itemId}`);
  issues.error(hasText(passage?.text), `Source passage needs text: ${itemId}`);
  issues.warn(passage?.translation === null || passage?.translation === undefined || hasText(passage?.translation), `Source passage translation must be string/null when present: ${itemId}`);
  issues.warn(
    localIds.sources.has(passage?.sourceId) || hasRow(db, "sources", passage?.sourceId),
    `Source passage references unknown sourceId: ${itemId}:${passage?.sourceId}`,
  );
}

function validateMention(mention, index, localIds, db, issues, referencedPeople, referencedEvents) {
  const itemId = mention?.id ?? `sourceMentions[${index}]`;
  issues.error(hasText(mention?.id), `Source mention needs id: ${itemId}`);
  issues.error(hasText(mention?.sourceId), `Source mention needs sourceId: ${itemId}`);
  issues.error(hasText(mention?.workTitle), `Source mention needs workTitle: ${itemId}`);
  issues.error(hasText(mention?.bookTitle), `Source mention needs bookTitle: ${itemId}`);
  issues.error(hasText(mention?.chapterTitle), `Source mention needs chapterTitle: ${itemId}`);
  issues.error(hasText(mention?.locator), `Source mention needs locator: ${itemId}`);
  issues.error(hasText(mention?.text), `Source mention needs text: ${itemId}`);
  issues.error(Array.isArray(mention?.mentionedPersonIds) && mention.mentionedPersonIds.length > 0, `Source mention needs mentionedPersonIds: ${itemId}`);
  issues.error(Array.isArray(mention?.mentionedEventIds), `Source mention needs mentionedEventIds array: ${itemId}`);
  issues.warn(
    localIds.sources.has(mention?.sourceId) || hasRow(db, "sources", mention?.sourceId),
    `Source mention references unknown sourceId: ${itemId}:${mention?.sourceId}`,
  );
  issues.warn(
    !mention?.passageId || localIds.sourcePassages.has(mention.passageId) || hasRow(db, "source_passages", mention.passageId),
    `Source mention references unknown passageId: ${itemId}:${mention?.passageId}`,
  );

  for (const personId of mention?.mentionedPersonIds ?? []) {
    referencedPeople.add(personId);
    issues.warn(isNeedsId(personId) || hasRow(db, "persons", personId), `Source mention references missing plain personId: ${itemId}:${personId}`);
  }

  for (const eventId of mention?.mentionedEventIds ?? []) {
    referencedEvents.add(eventId);
    issues.warn(localIds.historicalEvents.has(eventId) || hasRow(db, "historical_events", eventId), `Source mention references unknown eventId: ${itemId}:${eventId}`);
  }
}

function validateLifeEvent(lifeEvent, index, localIds, db, issues, referencedPeople, referencedEvents) {
  const itemId = lifeEvent?.id ?? `personLifeEvents[${index}]`;
  issues.error(hasText(lifeEvent?.id), `Life event needs id: ${itemId}`);
  issues.error(hasText(lifeEvent?.personId), `Life event needs personId: ${itemId}`);
  issues.error(hasText(lifeEvent?.displayYear), `Life event needs displayYear: ${itemId}`);
  issues.error(hasText(lifeEvent?.type), `Life event needs type: ${itemId}`);
  issues.error(hasText(lifeEvent?.title), `Life event needs title: ${itemId}`);
  issues.error(hasText(lifeEvent?.summary), `Life event needs summary: ${itemId}`);
  issues.warn(Number.isInteger(lifeEvent?.year) || lifeEvent?.year === null || lifeEvent?.year === undefined, `Life event year should be integer/null: ${itemId}`);
  issues.warn(Number.isInteger(lifeEvent?.endYear) || lifeEvent?.endYear === null || lifeEvent?.endYear === undefined, `Life event endYear should be integer/null: ${itemId}`);

  if (hasText(lifeEvent?.personId)) {
    referencedPeople.add(lifeEvent.personId);
    issues.warn(isNeedsId(lifeEvent.personId) || hasRow(db, "persons", lifeEvent.personId), `Life event references missing plain personId: ${itemId}:${lifeEvent.personId}`);
  }

  for (const eventId of lifeEvent?.relatedEventIds ?? []) {
    referencedEvents.add(eventId);
    issues.warn(localIds.historicalEvents.has(eventId) || hasRow(db, "historical_events", eventId), `Life event references unknown relatedEventId: ${itemId}:${eventId}`);
  }

  for (const mentionId of lifeEvent?.sourceMentionIds ?? []) {
    issues.warn(localIds.sourceMentions.has(mentionId) || hasRow(db, "source_mentions", mentionId), `Life event references unknown sourceMentionId: ${itemId}:${mentionId}`);
  }

  for (const passageId of lifeEvent?.sourcePassageIds ?? []) {
    issues.warn(localIds.sourcePassages.has(passageId) || hasRow(db, "source_passages", passageId), `Life event references unknown sourcePassageId: ${itemId}:${passageId}`);
  }
}

function validateRelation(relation, index, localIds, db, issues, referencedPeople, referencedEvents) {
  const itemId = relation?.id ?? `personRelations[${index}]`;
  issues.error(hasText(relation?.id), `Person relation needs id: ${itemId}`);
  issues.error(hasText(relation?.sourcePersonId), `Person relation needs sourcePersonId: ${itemId}`);
  issues.error(hasText(relation?.targetPersonId), `Person relation needs targetPersonId: ${itemId}`);
  issues.error(hasText(relation?.type), `Person relation needs type: ${itemId}`);
  issues.error(hasText(relation?.summary), `Person relation needs summary: ${itemId}`);
  issues.warn(relation?.sourcePersonId !== relation?.targetPersonId, `Person relation points to itself: ${itemId}`);

  for (const key of ["sourcePersonId", "targetPersonId"]) {
    if (!hasText(relation?.[key])) {
      continue;
    }
    referencedPeople.add(relation[key]);
    issues.warn(isNeedsId(relation[key]) || hasRow(db, "persons", relation[key]), `Person relation references missing plain ${key}: ${itemId}:${relation[key]}`);
  }

  for (const eventId of relation?.relatedEventIds ?? []) {
    referencedEvents.add(eventId);
    issues.warn(localIds.historicalEvents.has(eventId) || hasRow(db, "historical_events", eventId), `Person relation references unknown relatedEventId: ${itemId}:${eventId}`);
  }

  for (const mentionId of relation?.sourceMentionIds ?? []) {
    issues.warn(localIds.sourceMentions.has(mentionId) || hasRow(db, "source_mentions", mentionId), `Person relation references unknown sourceMentionId: ${itemId}:${mentionId}`);
  }

  for (const passageId of relation?.sourcePassageIds ?? []) {
    issues.warn(localIds.sourcePassages.has(passageId) || hasRow(db, "source_passages", passageId), `Person relation references unknown sourcePassageId: ${itemId}:${passageId}`);
  }
}

function validateHistoricalEvent(event, index, localIds, db, issues, referencedPeople) {
  const itemId = event?.id ?? `historicalEvents[${index}]`;
  issues.error(hasText(event?.id), `Historical event needs id: ${itemId}`);
  issues.error(hasText(event?.title), `Historical event needs title: ${itemId}`);
  issues.warn(hasText(event?.region), `Historical event should include region: ${itemId}`);
  issues.warn(Number.isInteger(event?.startYear) || event?.startYear === null || event?.startYear === undefined, `Historical event startYear should be integer/null: ${itemId}`);
  issues.warn(Number.isInteger(event?.endYear) || event?.endYear === null || event?.endYear === undefined, `Historical event endYear should be integer/null: ${itemId}`);
  issues.error(hasText(event?.summary), `Historical event needs summary: ${itemId}`);

  for (const personId of event?.personIds ?? []) {
    referencedPeople.add(personId);
    issues.warn(isNeedsId(personId) || hasRow(db, "persons", personId), `Historical event references missing plain personId: ${itemId}:${personId}`);
  }

  for (const passageId of event?.sourcePassageIds ?? []) {
    issues.warn(localIds.sourcePassages.has(passageId) || hasRow(db, "source_passages", passageId), `Historical event references unknown sourcePassageId: ${itemId}:${passageId}`);
  }
}

function findPersonNameMatches(db, name) {
  if (!hasText(name)) {
    return [];
  }

  return queryRows(
    db,
    `
      SELECT id, name, 'persons.name' AS source
      FROM persons
      WHERE name = ?
      UNION
      SELECT p.id, p.name, 'person_aliases.value' AS source
      FROM person_aliases a
      JOIN persons p ON p.id = a.person_id
      WHERE a.value = ?
      ORDER BY id
    `,
    [name, name],
  );
}

function findSourceMatches(db, sourceName) {
  if (!hasText(sourceName)) {
    return [];
  }

  return queryRows(
    db,
    `
      SELECT id, title, citation_short
      FROM sources
      WHERE title = ? OR citation_short = ? OR title LIKE ? OR citation_short LIKE ?
      ORDER BY id
      LIMIT 8
    `,
    [sourceName, sourceName, `%${sourceName}%`, `%${sourceName}%`],
  );
}

function findEventTitleMatches(db, eventName, year) {
  if (!hasText(eventName)) {
    return [];
  }

  const hasYear = Number.isInteger(year);
  const yearClause = hasYear
    ? "AND (start_year IS NULL OR start_year BETWEEN ? AND ? OR ? BETWEEN start_year AND COALESCE(end_year, start_year))"
    : "";
  const params = hasYear
    ? [eventName, eventName, `%${eventName}%`, `%${eventName}%`, year - 1, year + 1, year]
    : [eventName, eventName, `%${eventName}%`, `%${eventName}%`];

  return queryRows(
    db,
    `
      SELECT id, title, start_year, end_year, summary
      FROM historical_events
      WHERE (title = ? OR id = ? OR title LIKE ? OR summary LIKE ?)
      ${yearClause}
      ORDER BY start_year, id
      LIMIT 8
    `,
    params,
  );
}

function validateEvidenceCard(card, index, db, issues, evidenceStats) {
  const itemId = `evidenceCards[${index}]`;
  const sourceTitle = firstText(card?.sourceTitle, card?.source);
  const originalText = firstText(card?.originalText, card?.text, card?.translation);
  const eventLabel = firstText(card?.eventLabel, card?.event);
  issues.error(hasText(sourceTitle), `Evidence card needs source/sourceTitle: ${itemId}`);
  issues.error(hasText(card?.sourceType), `Evidence card needs sourceType: ${itemId}`);
  issues.warn(card?.author === null || hasText(card?.author), `Evidence card author should be string/null: ${itemId}`);
  issues.warn(card?.commentaryAuthor === null || card?.commentaryAuthor === undefined || hasText(card?.commentaryAuthor), `Evidence card commentaryAuthor should be string/null: ${itemId}`);
  issues.warn(card?.quotedWork === null || card?.quotedWork === undefined || hasText(card?.quotedWork), `Evidence card quotedWork should be string/null when present: ${itemId}`);
  issues.warn(card?.section === null || card?.section === undefined || hasText(card?.section), `Evidence card section should be string/null when present: ${itemId}`);
  issues.error(hasText(card?.locator), `Evidence card needs locator: ${itemId}`);
  issues.warn(Number.isInteger(card?.year) || card?.year === null, `Evidence card year should be integer/null: ${itemId}`);
  issues.warn(card?.displayDate === null || hasText(card?.displayDate), `Evidence card displayDate should be string/null: ${itemId}`);
  issues.error(hasText(originalText), `Evidence card needs original text: ${itemId}`);
  issues.warn(card?.translation === null || hasText(card?.translation), `Evidence card translation should be string/null: ${itemId}`);
  const hasOldPeople = arrayFromValue(card?.people).length > 0;
  const hasNewPeople = arrayFromValue(card?.peopleCore).length > 0;
  issues.error(hasOldPeople || hasNewPeople, `Evidence card needs people array/string or peopleCore array/string: ${itemId}`);
  issues.error(card?.peopleCore === undefined || Array.isArray(card.peopleCore) || hasText(card.peopleCore), `Evidence card peopleCore must be an array/string when present: ${itemId}`);
  issues.error(card?.peopleMentioned === undefined || Array.isArray(card.peopleMentioned), `Evidence card peopleMentioned must be an array when present: ${itemId}`);
  issues.error(Array.isArray(card?.places), `Evidence card places must be an array: ${itemId}`);
  issues.warn(card?.macroEvent === null || card?.macroEvent === undefined || hasText(card?.macroEvent), `Evidence card macroEvent should be string/null when present: ${itemId}`);
  issues.warn(eventLabel === null || eventLabel === undefined || hasText(eventLabel), `Evidence card event/eventLabel should be string/null: ${itemId}`);
  const hasOldFact = hasText(card?.fact);
  const hasLayeredFact = hasText(card?.factBrief) && hasText(card?.factDetailed);
  issues.error(hasOldFact || hasLayeredFact, `Evidence card needs fact or factBrief/factDetailed: ${itemId}`);
  issues.error(hasText(card?.factType), `Evidence card needs factType: ${itemId}`);
  issues.warn(["high", "medium", "low"].includes(card?.confidence), `Evidence card confidence should be high/medium/low: ${itemId}`);
  issues.error(Array.isArray(card?.questions), `Evidence card questions must be an array: ${itemId}`);

  if (hasText(sourceTitle)) {
    const sourceMatches = findSourceMatches(db, sourceTitle);
    addUnique(evidenceStats.sourceMatches, sourceTitle, sourceMatches);
    if (!sourceMatches.length) {
      evidenceStats.unmatchedSources.add(sourceTitle);
    }
  }

  const cardPeople = [
    ...arrayFromValue(card?.people),
    ...arrayFromValue(card?.peopleCore),
    ...(Array.isArray(card?.peopleMentioned) ? card.peopleMentioned : []),
  ];

  for (const personName of cardPeople) {
    if (!hasText(personName)) {
      issues.warn(false, `Evidence card has empty person name: ${itemId}`);
      continue;
    }
    const personMatches = findPersonNameMatches(db, personName);
    addUnique(evidenceStats.personMatches, personName, personMatches);
    const matchedPersonIds = new Set(personMatches.map((match) => match.id));
    if (!matchedPersonIds.size) {
      evidenceStats.unmatchedPeople.add(personName);
    }
    if (matchedPersonIds.size > 1) {
      evidenceStats.ambiguousPeople.add(personName);
    }
  }

  for (const eventName of [card?.macroEvent, eventLabel]) {
    if (!hasText(eventName)) {
      continue;
    }
    const eventMatches = findEventTitleMatches(db, eventName, card.year);
    addUnique(evidenceStats.eventMatches, eventName, eventMatches);
    if (!eventMatches.length) {
      evidenceStats.unmatchedEvents.add(eventName);
    }
  }
}

function findSemanticOverlaps(db, draft) {
  const overlaps = [];
  const candidates = [
    ...(draft.historicalEvents ?? []).map((record) => ({ kind: "historicalEvent", ...record })),
    ...(draft.personLifeEvents ?? []).map((record) => ({ kind: "lifeEvent", ...record, startYear: record.year, endYear: record.endYear })),
  ];

  for (const candidate of candidates) {
    if (candidate.kind === "lifeEvent" && !Number.isInteger(candidate.startYear)) {
      continue;
    }

    const tokens = tokenize(`${candidate.id ?? ""} ${candidate.title ?? ""} ${candidate.summary ?? ""}`).slice(0, 8);
    if (!tokens.length) {
      continue;
    }

    const startYear = Number.isInteger(candidate.startYear) ? candidate.startYear : null;
    const endYear = Number.isInteger(candidate.endYear) ? candidate.endYear : startYear;
    const clauses = tokens.map(() => "(title LIKE ? OR summary LIKE ? OR id LIKE ?)");
    const params = [];
    for (const token of tokens) {
      params.push(`%${token}%`, `%${token}%`, `%${token}%`);
    }

    const yearClause = startYear === null
      ? ""
      : "AND (start_year IS NULL OR start_year BETWEEN ? AND ? OR ? BETWEEN start_year AND COALESCE(end_year, start_year))";
    if (startYear !== null) {
      params.push(startYear - 1, (endYear ?? startYear) + 1, startYear);
    }

    const rows = queryRows(
      db,
      `
        SELECT id, title, start_year, end_year, summary
        FROM historical_events
        WHERE (${clauses.join(" OR ")})
        ${yearClause}
        ORDER BY start_year, id
        LIMIT 5
      `,
      params,
    );

    const lifeRows = queryRows(
      db,
      `
        SELECT id, person_id, year AS start_year, end_year, title, summary
        FROM person_life_events
        WHERE (${clauses.join(" OR ")})
        ${startYear === null ? "" : "AND (year IS NULL OR year BETWEEN ? AND ? OR ? BETWEEN year AND COALESCE(end_year, year))"}
        ORDER BY year, id
        LIMIT 5
      `,
      params,
    );

    if (rows.length || lifeRows.length) {
      overlaps.push({
        id: candidate.id,
        kind: candidate.kind,
        title: candidate.title,
        historicalEvents: rows,
        lifeEvents: lifeRows,
      });
    }
  }

  return overlaps;
}

async function auditFile(db, filePath) {
  const issues = createIssueCollector();
  const relativePath = normalizeRelativePath(filePath);
  let draft;

  try {
    draft = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    issues.errors.push(`Invalid JSON: ${error.message}`);
    return { file: relativePath, counts: {}, issues, conflicts: {}, references: {}, overlaps: [] };
  }
  draft = asDraftObject(draft);

  const localIds = {};
  const counts = {};
  const conflicts = {};
  const referencedPeople = new Set();
  const referencedEvents = new Set();
  const evidenceStats = {
    sourceMatches: new Map(),
    personMatches: new Map(),
    eventMatches: new Map(),
    unmatchedSources: new Set(),
    unmatchedPeople: new Set(),
    ambiguousPeople: new Set(),
    unmatchedEvents: new Set(),
  };

  for (const [jsonKey, tableName] of collectionSpecs) {
    const records = draft[jsonKey] ?? [];
    issues.error(Array.isArray(records), `${jsonKey} must be an array when present`);
    const safeRecords = Array.isArray(records) ? records : [];
    const { ids, duplicateIds } = collectIds(safeRecords);
    localIds[jsonKey] = ids;
    counts[jsonKey] = safeRecords.length;
    conflicts[jsonKey] = getExistingRows(db, tableName, ids);
    for (const id of duplicateIds) {
      issues.errors.push(`Duplicate id inside draft ${jsonKey}: ${id}`);
    }
  }

  for (const [index, source] of (draft.sources ?? []).entries()) {
    validateSource(source, index, issues);
  }
  for (const [index, passage] of (draft.sourcePassages ?? []).entries()) {
    validatePassage(passage, index, localIds, db, issues);
  }
  for (const [index, mention] of (draft.sourceMentions ?? []).entries()) {
    validateMention(mention, index, localIds, db, issues, referencedPeople, referencedEvents);
  }
  for (const [index, lifeEvent] of (draft.personLifeEvents ?? []).entries()) {
    validateLifeEvent(lifeEvent, index, localIds, db, issues, referencedPeople, referencedEvents);
  }
  for (const [index, relation] of (draft.personRelations ?? []).entries()) {
    validateRelation(relation, index, localIds, db, issues, referencedPeople, referencedEvents);
  }
  for (const [index, event] of (draft.historicalEvents ?? []).entries()) {
    validateHistoricalEvent(event, index, localIds, db, issues, referencedPeople);
  }
  for (const [index, card] of (draft.evidenceCards ?? []).entries()) {
    validateEvidenceCard(card, index, db, issues, evidenceStats);
  }

  const missingPlainPeople = [...referencedPeople]
    .filter((id) => hasText(id) && !isNeedsId(id) && !hasRow(db, "persons", id))
    .sort((left, right) => left.localeCompare(right));
  const needsIds = [...referencedPeople]
    .filter(isNeedsId)
    .sort((left, right) => left.localeCompare(right));
  const unknownEvents = [...referencedEvents]
    .filter((id) => hasText(id) && !localIds.historicalEvents.has(id) && !hasRow(db, "historical_events", id))
    .sort((left, right) => left.localeCompare(right));

  const conflictsByType = Object.fromEntries(
    Object.entries(conflicts).filter(([, ids]) => ids.length > 0),
  );

  for (const [key, ids] of Object.entries(conflictsByType)) {
    issues.warnings.push(`Existing DB ids require merge/upsert decision for ${key}: ${ids.join(", ")}`);
  }

  if (missingPlainPeople.length) {
    issues.warnings.push(`Plain person ids missing in DB: ${missingPlainPeople.join(", ")}`);
  }
  if (unknownEvents.length) {
    issues.warnings.push(`Event ids missing in DB/local historicalEvents: ${unknownEvents.join(", ")}`);
  }
  if (needsIds.length) {
    issues.info.push(`Needs-id references: ${needsIds.length}`);
  }

  return {
    file: relativePath,
    counts,
    issues,
    conflicts: conflictsByType,
    references: {
      missingPlainPeople,
      needsIds,
      unknownEvents,
    },
    evidenceSummary: Array.isArray(draft.evidenceCards)
      ? {
          unmatchedSources: [...evidenceStats.unmatchedSources].sort((left, right) => left.localeCompare(right)),
          unmatchedPeople: [...evidenceStats.unmatchedPeople].sort((left, right) => left.localeCompare(right)),
          ambiguousPeople: [...evidenceStats.ambiguousPeople].sort((left, right) => left.localeCompare(right)),
          unmatchedEvents: [...evidenceStats.unmatchedEvents].sort((left, right) => left.localeCompare(right)),
        }
      : null,
    overlaps: findSemanticOverlaps(db, draft),
  };
}

function printList(title, items, formatter = (item) => item) {
  if (!items.length) {
    return;
  }
  console.log(`  ${title}:`);
  for (const item of items) {
    console.log(`    - ${formatter(item)}`);
  }
}

function printReport(report) {
  console.log(`\n${report.file}`);
  console.log(`  counts: ${Object.entries(report.counts).map(([key, value]) => `${key}=${value}`).join(", ")}`);
  console.log(`  errors: ${report.issues.errors.length}`);
  console.log(`  warnings: ${report.issues.warnings.length}`);
  printList("errors", report.issues.errors);
  printList("warnings", report.issues.warnings);
  printList("info", report.issues.info);

  const conflictEntries = Object.entries(report.conflicts);
  if (conflictEntries.length) {
    console.log("  existing DB id conflicts:");
    for (const [key, ids] of conflictEntries) {
      console.log(`    - ${key}: ${ids.join(", ")}`);
    }
  }

  if (report.references.missingPlainPeople.length) {
    console.log(`  missing plain person ids: ${report.references.missingPlainPeople.join(", ")}`);
  }
  if (report.references.unknownEvents.length) {
    console.log(`  unknown event ids: ${report.references.unknownEvents.join(", ")}`);
  }
  if (report.references.needsIds.length) {
    console.log(`  needs-id count: ${report.references.needsIds.length}`);
  }

  if (report.evidenceSummary) {
    console.log("  evidenceCards summary:");
    console.log(`    - unmatched sources: ${report.evidenceSummary.unmatchedSources.join(", ") || "none"}`);
    console.log(`    - unmatched people: ${report.evidenceSummary.unmatchedPeople.join(", ") || "none"}`);
    console.log(`    - ambiguous people: ${report.evidenceSummary.ambiguousPeople.join(", ") || "none"}`);
    console.log(`    - unmatched events: ${report.evidenceSummary.unmatchedEvents.join(", ") || "none"}`);
  }

  if (report.overlaps.length) {
    console.log("  possible semantic overlaps:");
    for (const overlap of report.overlaps.slice(0, 10)) {
      const rows = [
        ...overlap.historicalEvents.map((row) => `historical_events:${row.id}:${row.start_year ?? "?"}:${shortText(row.title)}`),
        ...overlap.lifeEvents.map((row) => `person_life_events:${row.id}:${row.start_year ?? "?"}:${shortText(row.title)}`),
      ];
      console.log(`    - ${overlap.kind}:${overlap.id}:${shortText(overlap.title)} -> ${rows.join(" | ")}`);
    }
    if (report.overlaps.length > 10) {
      console.log(`    - ... ${report.overlaps.length - 10} more`);
    }
  }
}

if (!existsSync(dbPath)) {
  throw new Error(`SQLite database not found: ${normalizeRelativePath(dbPath)}`);
}

let files = [];
if (requestedFiles.length) {
  files = requestedFiles.map((filePath) => path.resolve(rootDir, filePath));
} else if (existsSync(draftsDir)) {
  files = await collectJsonFiles(draftsDir);
}

if (!files.length) {
  console.log("No import draft JSON files found.");
  process.exit(0);
}

const db = new DatabaseSync(dbPath, { readOnly: true });
const reports = [];
for (const file of files) {
  reports.push(await auditFile(db, file));
}
db.close();

let errorCount = 0;
let warningCount = 0;
for (const report of reports) {
  printReport(report);
  errorCount += report.issues.errors.length;
  warningCount += report.issues.warnings.length;
}

console.log(`\nAudited ${reports.length} draft file(s). errors=${errorCount}, warnings=${warningCount}`);
process.exit(errorCount > 0 ? 1 : 0);
