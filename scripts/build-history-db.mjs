import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkMode = process.argv.includes("--check");
const dbPath = checkMode
  ? path.join(rootDir, "db", ".chronoatlas-check.sqlite")
  : path.join(rootDir, "db", "chronoatlas.sqlite");

const corpora = [
  {
    id: "china-three-kingdoms",
    name: "中国三国与魏晋资料库",
    region: "china",
    description: "ChronoAtlas 中国三国前后人物、事件、原文和史料引用数据。"
  },
  {
    id: "rome-imperial",
    name: "罗马帝国资料库",
    region: "rome",
    description: "预留给罗马帝国、三世纪危机与相关拉丁/希腊史料。"
  }
];

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function toNullableText(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toNullableInteger(value) {
  return Number.isInteger(value) ? value : null;
}

function boolToInteger(value) {
  return value === true ? 1 : 0;
}

function parseLifeYear(life, index) {
  if (typeof life !== "string") {
    return null;
  }
  const parts = life.split("-");
  const token = parts[index];
  const match = token?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function sourceRefsFrom(record) {
  return Array.isArray(record.sourceRefs) ? record.sourceRefs : [];
}

function sourceMentionIdsFrom(record) {
  return Array.isArray(record.sourceMentionIds) ? record.sourceMentionIds : [];
}

async function readJson(relativePath) {
  const content = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(content);
}

function insertCorpora(db) {
  const insert = db.prepare(
    "INSERT INTO corpora (id, name, region, description) VALUES (?, ?, ?, ?)"
  );
  for (const corpus of corpora) {
    insert.run(corpus.id, corpus.name, corpus.region, corpus.description);
  }
}

function insertSources(db, sources) {
  const insert = db.prepare(`
    INSERT INTO sources (
      id, title, author, type, citation_short, url, language, corpus_id, note, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const source of sources) {
    insert.run(
      source.id,
      source.title,
      toNullableText(source.author),
      source.type,
      toNullableText(source.citationShort),
      toNullableText(source.url),
      source.language ?? "zh-Hans",
      source.corpus ?? "china-three-kingdoms",
      toNullableText(source.note),
      toJson(source)
    );
  }
}

function insertPersons(db, persons) {
  const insertPerson = db.prepare(`
    INSERT INTO persons (
      id, region, name, courtesy_name, life, birth_year, death_year,
      life_confidence, primary_polity, summary, coverage_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRole = db.prepare(`
    INSERT INTO person_roles (person_id, role, sort_order) VALUES (?, ?, ?)
  `);
  const insertAlias = db.prepare(`
    INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const person of persons) {
    insertPerson.run(
      person.id,
      person.region ?? "china",
      person.name,
      toNullableText(person.courtesyName),
      toNullableText(person.life),
      toNullableInteger(person.birthYear) ?? parseLifeYear(person.life, 0),
      toNullableInteger(person.deathYear) ?? parseLifeYear(person.life, 1),
      person.lifeConfidence ?? "medium",
      toNullableText(person.primaryPolity),
      toNullableText(person.summary),
      person.coverageStatus ?? "partial",
      toJson(person)
    );

    for (const [index, role] of (person.roles ?? []).entries()) {
      insertRole.run(person.id, role, index);
    }

    insertAlias.run(
      `alias-${person.id}-name`,
      person.id,
      person.name,
      "name",
      toJson(sourceRefsFrom(person)),
      toJson({ generatedFrom: "persons.name" })
    );

    if (person.courtesyName) {
      insertAlias.run(
        `alias-${person.id}-courtesy-name`,
        person.id,
        person.courtesyName,
        "courtesy-name",
        toJson(sourceRefsFrom(person)),
        toJson({ generatedFrom: "persons.courtesyName" })
      );
    }
  }
}

function insertHistoricalEvents(db, events) {
  const insertEvent = db.prepare(`
    INSERT INTO historical_events (
      id, title, region, start_year, end_year, location_name, category, summary,
      confidence, coordinates_json, detail_json, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEventPerson = db.prepare(`
    INSERT INTO historical_event_people (event_id, person_id, display_name, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  const insertEventSource = db.prepare(`
    INSERT INTO historical_event_sources (event_id, source_id, locator, raw_json)
    VALUES (?, ?, ?, ?)
  `);

  for (const event of events) {
    insertEvent.run(
      event.id,
      event.title,
      event.region,
      toNullableInteger(event.startYear),
      toNullableInteger(event.endYear),
      toNullableText(event.locationName),
      toNullableText(event.category),
      toNullableText(event.summary),
      event.confidence ?? "medium",
      toJson(event.coordinates),
      toJson(event.detail),
      toJson(event)
    );

    const displayPeople = Array.isArray(event.people) ? event.people : [];
    const personIds = Array.isArray(event.personIds) ? event.personIds : [];
    const rowCount = Math.max(displayPeople.length, personIds.length);
    for (let index = 0; index < rowCount; index += 1) {
      insertEventPerson.run(
        event.id,
        toNullableText(personIds[index]),
        toNullableText(displayPeople[index]),
        index
      );
    }

    for (const sourceRef of sourceRefsFrom(event)) {
      insertEventSource.run(
        event.id,
        sourceRef.sourceId,
        sourceRef.locator,
        toJson(sourceRef)
      );
    }
  }
}

function insertSourceMentions(db, sourceMentions) {
  const insertMention = db.prepare(`
    INSERT INTO source_mentions (
      id, source_id, passage_id, work_title, book_title, chapter_title, locator,
      year, text, translation, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMentionPerson = db.prepare(`
    INSERT INTO source_mention_people (mention_id, person_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertMentionEvent = db.prepare(`
    INSERT INTO source_mention_events (mention_id, event_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertMentionPlace = db.prepare(`
    INSERT INTO source_mention_places (mention_id, place_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertMentionTag = db.prepare(`
    INSERT INTO source_mention_tags (mention_id, tag, sort_order)
    VALUES (?, ?, ?)
  `);

  for (const mention of sourceMentions) {
    insertMention.run(
      mention.id,
      mention.sourceId,
      null,
      mention.workTitle,
      mention.bookTitle,
      mention.chapterTitle,
      mention.locator,
      toNullableInteger(mention.year),
      mention.text,
      toNullableText(mention.translation),
      mention.confidence ?? "medium",
      mention.reviewStatus ?? "draft",
      toJson(mention)
    );

    for (const [index, personId] of (mention.mentionedPersonIds ?? []).entries()) {
      insertMentionPerson.run(mention.id, personId, index);
    }

    for (const [index, eventId] of (mention.mentionedEventIds ?? []).entries()) {
      insertMentionEvent.run(mention.id, eventId, index);
    }

    for (const [index, placeId] of (mention.mentionedPlaceIds ?? []).entries()) {
      insertMentionPlace.run(mention.id, placeId, index);
    }

    for (const [index, tag] of (mention.tags ?? []).entries()) {
      insertMentionTag.run(mention.id, tag, index);
    }
  }
}

function insertLifeEvents(db, lifeEvents) {
  const insertLifeEvent = db.prepare(`
    INSERT INTO person_life_events (
      id, person_id, year, end_year, display_year, type, title, summary,
      confidence, approximate, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRelatedEvent = db.prepare(`
    INSERT INTO person_life_event_historical_events (life_event_id, event_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertMention = db.prepare(`
    INSERT INTO person_life_event_source_mentions (life_event_id, mention_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertSourceRef = db.prepare(`
    INSERT INTO person_life_event_source_refs (life_event_id, source_id, locator, quote, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const lifeEvent of lifeEvents) {
    insertLifeEvent.run(
      lifeEvent.id,
      lifeEvent.personId,
      toNullableInteger(lifeEvent.year),
      toNullableInteger(lifeEvent.endYear),
      lifeEvent.displayYear,
      lifeEvent.type,
      lifeEvent.title,
      lifeEvent.summary,
      lifeEvent.confidence ?? "medium",
      boolToInteger(lifeEvent.approximate),
      toJson(lifeEvent)
    );

    for (const [index, eventId] of (lifeEvent.relatedEventIds ?? []).entries()) {
      insertRelatedEvent.run(lifeEvent.id, eventId, index);
    }

    for (const [index, mentionId] of sourceMentionIdsFrom(lifeEvent).entries()) {
      insertMention.run(lifeEvent.id, mentionId, index);
    }

    for (const sourceRef of sourceRefsFrom(lifeEvent)) {
      insertSourceRef.run(
        lifeEvent.id,
        sourceRef.sourceId,
        sourceRef.locator,
        toNullableText(sourceRef.quote),
        toJson(sourceRef)
      );
    }
  }
}

function insertRelations(db, relations) {
  const insertRelation = db.prepare(`
    INSERT INTO person_relations (
      id, source_person_id, target_person_id, type, start_year, end_year,
      summary, confidence, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvent = db.prepare(`
    INSERT INTO person_relation_events (relation_id, event_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertMention = db.prepare(`
    INSERT INTO person_relation_source_mentions (relation_id, mention_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertSourceRef = db.prepare(`
    INSERT INTO person_relation_source_refs (relation_id, source_id, locator, raw_json)
    VALUES (?, ?, ?, ?)
  `);

  for (const relation of relations) {
    insertRelation.run(
      relation.id,
      relation.sourcePersonId,
      relation.targetPersonId,
      relation.type,
      toNullableInteger(relation.startYear),
      toNullableInteger(relation.endYear),
      relation.summary,
      relation.confidence ?? "medium",
      toJson(relation)
    );

    for (const [index, eventId] of (relation.relatedEventIds ?? []).entries()) {
      insertEvent.run(relation.id, eventId, index);
    }

    for (const [index, mentionId] of sourceMentionIdsFrom(relation).entries()) {
      insertMention.run(relation.id, mentionId, index);
    }

    for (const sourceRef of sourceRefsFrom(relation)) {
      insertSourceRef.run(relation.id, sourceRef.sourceId, sourceRef.locator, toJson(sourceRef));
    }
  }
}

function insertCoverageStatus(db, persons) {
  const insertCoverage = db.prepare(`
    INSERT INTO coverage_status (
      person_id, corpus_id, status, last_reviewed_at, notes, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertCoverageSource = db.prepare(`
    INSERT INTO coverage_status_sources (person_id, corpus_id, source_id, status)
    VALUES (?, ?, ?, ?)
  `);

  for (const person of persons) {
    const sourceRefs = sourceRefsFrom(person);
    insertCoverage.run(
      person.id,
      "china-three-kingdoms",
      person.coverageStatus ?? "partial",
      null,
      "由现有人物档案自动生成；后续应按《三国志》《资治通鉴》等逐条审校。",
      toJson({ generatedFrom: "china-persons.json" })
    );

    for (const sourceRef of sourceRefs) {
      insertCoverageSource.run(person.id, "china-three-kingdoms", sourceRef.sourceId, "partial");
    }
  }
}

function insertImportRun(db, counts) {
  db.prepare(`
    INSERT INTO import_runs (
      created_at, source_label, persons_count, life_events_count, relations_count,
      historical_events_count, source_mentions_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    new Date().toISOString(),
    "current-json-seed",
    counts.persons,
    counts.lifeEvents,
    counts.relations,
    counts.historicalEvents,
    counts.sourceMentions
  );
}

function scalarCount(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function verifyDatabase(db, counts) {
  const expectedCounts = [
    ["persons", counts.persons],
    ["person_life_events", counts.lifeEvents],
    ["person_relations", counts.relations],
    ["historical_events", counts.historicalEvents],
    ["source_mentions", counts.sourceMentions],
    ["sources", counts.sources]
  ];

  for (const [tableName, expected] of expectedCounts) {
    const actual = scalarCount(db, tableName);
    if (actual !== expected) {
      throw new Error(`Expected ${tableName} to contain ${expected} rows, got ${actual}`);
    }
  }
}

async function main() {
  const [sources, persons, historicalEvents, sourceMentions, lifeEvents, relations] = await Promise.all([
    readJson("data/china-sources.json"),
    readJson("data/china-persons.json"),
    readJson("data/events-180-280.sample.json"),
    readJson("data/china-source-mentions.json"),
    readJson("data/china-person-life-events.json"),
    readJson("data/china-person-relations.json")
  ]);

  await mkdir(path.dirname(dbPath), { recursive: true });
  if (existsSync(dbPath)) {
    await rm(dbPath, { force: true });
  }

  const db = new DatabaseSync(dbPath);
  const schemaSql = await readFile(path.join(rootDir, "db", "schema.sql"), "utf8");
  const counts = {
    sources: sources.length,
    persons: persons.length,
    historicalEvents: historicalEvents.length,
    sourceMentions: sourceMentions.length,
    lifeEvents: lifeEvents.length,
    relations: relations.length
  };

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(schemaSql);
    db.exec("BEGIN;");
    insertCorpora(db);
    insertSources(db, sources);
    insertPersons(db, persons);
    insertHistoricalEvents(db, historicalEvents);
    insertSourceMentions(db, sourceMentions);
    insertLifeEvents(db, lifeEvents);
    insertRelations(db, relations);
    insertCoverageStatus(db, persons);
    insertImportRun(db, counts);
    db.exec("COMMIT;");
    verifyDatabase(db, counts);
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // The transaction may not have started if schema creation failed.
    }
    throw error;
  } finally {
    db.close();
  }

  if (checkMode) {
    await rm(dbPath, { force: true });
    console.log("History database schema check passed");
  } else {
    console.log(`Built history database: ${path.relative(rootDir, dbPath)}`);
    console.log(
      `Seeded ${counts.persons} persons, ${counts.lifeEvents} life events, ${counts.sourceMentions} source mentions`
    );
  }
}

await main();
