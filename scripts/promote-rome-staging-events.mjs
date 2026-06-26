import { DatabaseSync } from "node:sqlite";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const eventsJsonPath = path.join(rootDir, "data", "events-180-280.sample.json");
const batchId = process.argv.find((arg) => arg.startsWith("--batch-id="))?.slice("--batch-id=".length) ?? "deepseek-rome-190-310";

function parseJson(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function slugify(value) {
  const slug = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "event";
}

function eventCategory(factType) {
  switch (factType) {
    case "military-event":
      return "war";
    case "reform":
      return "politics";
    case "source-mention":
      return "culture";
    case "person-life":
    case "political-event":
    default:
      return "politics";
  }
}

function topicForFactType(factType) {
  const value = String(factType ?? "");
  if (value.includes("military") || value.includes("war")) {
    return "military";
  }
  if (value.includes("succession") || value.includes("death") || value.includes("person-life")) {
    return "succession";
  }
  if (value.includes("source")) {
    return "source_criticism";
  }
  if (value.includes("elite") || value.includes("relation")) {
    return "elite_network";
  }
  return "political_structure";
}

const majorEventLabels = new Set([
  "Didius Julianus buys the throne; Severus proclaimed in Pannonia",
  "Constitutio Antoniniana: universal citizenship",
  "Assassination of Alexander Severus; beginning of the Third Century Crisis",
  "Year of the Six Emperors",
  "Battle of Abrittus: Decius killed by Goths",
  "Capture of Valerian by Shapur I",
  "Aurelian defeats Zenobia and recovers the East",
  "Aurelian defeats Tetricus and reunifies the Roman Empire",
  "Diocletian becomes emperor",
  "Establishment of the Tetrarchy",
  "The Great Persecution begins",
  "Abdication of Diocletian and Maximian",
]);

function eventImportance(card) {
  if (majorEventLabels.has(card.event_label)) {
    return "major";
  }
  if (card.fact_type === "source-mention") {
    return "minor";
  }
  return "medium";
}

function correctedYear(card) {
  if (card.event_label === "Establishment of the Tetrarchy") {
    return 293;
  }
  return card.year;
}

function sourceIdFor(card) {
  return `rome-source-${slugify(`${card.source_title}-${card.author ?? ""}`)}`;
}

function sourceTypeValue(value) {
  if (value === "primary") {
    return "classical-source";
  }
  if (value === "modern") {
    return "modern-scholarship";
  }
  return value || "source";
}

function eventIdFor(card, usedIds) {
  const year = correctedYear(card);
  const base = `rome-${year ?? "undated"}-${slugify(card.event_label ?? card.macro_event ?? card.fact_brief)}`;
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function buildEvent(card, id) {
  const people = [
    ...parseJson(card.people_core_json, []),
    ...parseJson(card.people_mentioned_json, []),
  ].filter((value, index, values) => typeof value === "string" && value && values.indexOf(value) === index);
  const places = parseJson(card.places_json, []);
  const year = correctedYear(card);
  const sourceLabel = card.quoted_work || [card.author, card.source_title].filter(Boolean).join(", ") || card.source_title;

  return {
    id,
    title: card.event_label || card.macro_event || card.fact_brief,
    startYear: year,
    endYear: year,
    region: "rome",
    locationName: places[0] || "Roman Empire",
    coordinates: null,
    category: eventCategory(card.fact_type),
    importance: eventImportance(card),
    summary: card.fact_brief || card.fact_detailed,
    people,
    polities: ["Roman Empire"],
    relatedEvents: [],
    tags: [
      "Roman Empire",
      card.macro_event,
      card.fact_type,
      ...places.slice(0, 3),
    ].filter((value, index, values) => typeof value === "string" && value && values.indexOf(value) === index),
    confidence: card.confidence || "medium",
    sources: [sourceLabel],
    sourceRefs: [
      {
        sourceId: sourceIdFor(card),
        locator: card.locator,
      },
    ],
    detail: {
      overview: card.fact_brief || card.fact_detailed,
      result: [],
      background: card.macro_event ? [card.macro_event] : [],
      process: [card.fact_detailed].filter(Boolean),
      impact: [],
      sourceNotes: [
        [sourceLabel, card.section, card.locator].filter(Boolean).join(" · "),
        ...parseJson(card.questions_json, []).map((question) => `待核：${question}`),
      ],
      uncertainty: [],
    },
  };
}

function documentTitle(card) {
  return card.event_label || card.macro_event || card.fact_brief || [card.source_title, card.locator].filter(Boolean).join(" ");
}

function documentBody(card) {
  const rawCard = parseJson(card.raw_json, {});
  const originalText = rawCard.originalText || rawCard.text || null;
  const translation = card.translation || rawCard.translation || null;
  const peopleCore = parseJson(card.people_core_json, []);
  const peopleMentioned = parseJson(card.people_mentioned_json, []);
  const places = parseJson(card.places_json, []);
  const questions = parseJson(card.questions_json, []);

  return [
    documentTitle(card),
    card.display_date || (Number.isInteger(card.year) ? `${card.year} CE` : null),
    card.fact_brief,
    card.fact_detailed,
    originalText ? `Original: ${originalText}` : null,
    translation ? `Translation/summary: ${translation}` : null,
    peopleCore.length ? `Core people: ${peopleCore.join(", ")}` : null,
    peopleMentioned.length ? `Related people: ${peopleMentioned.join(", ")}` : null,
    places.length ? `Places: ${places.join(", ")}` : null,
    card.macro_event ? `Macro event: ${card.macro_event}` : null,
    card.fact_type ? `Fact type: ${card.fact_type}` : null,
    questions.length ? `Questions: ${questions.join("; ")}` : null,
    [card.source_title, card.section, card.locator].filter(Boolean).join(" · "),
  ].filter((part) => typeof part === "string" && part.trim().length > 0).join("\n\n");
}

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA foreign_keys = ON;");
  const cards = db.prepare(`
    SELECT *
    FROM import_evidence_cards
    WHERE batch_id = ? AND review_status = 'staged'
    ORDER BY year, card_index
  `).all(batchId);

  if (!cards.length) {
    throw new Error(`No staged cards found for batch ${batchId}`);
  }

  const usedIds = new Set(
    db.prepare("SELECT id FROM historical_events WHERE region <> 'rome'").all().map((row) => row.id),
  );
  const events = cards.map((card) => buildEvent(card, eventIdFor(card, usedIds)));

  const now = new Date().toISOString();
  const insertSource = db.prepare(`
    INSERT INTO sources (id, title, author, type, citation_short, url, language, corpus_id, note, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      author = excluded.author,
      type = excluded.type,
      citation_short = excluded.citation_short,
      language = excluded.language,
      corpus_id = excluded.corpus_id,
      note = excluded.note,
      raw_json = excluded.raw_json
  `);
  const upsertPeriod = db.prepare(`
    INSERT INTO periods (
      id, label, time_start, time_end, region_id, civilization_id,
      period_type, summary, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      region_id = excluded.region_id,
      civilization_id = excluded.civilization_id,
      period_type = excluded.period_type,
      summary = excluded.summary,
      raw_json = excluded.raw_json
  `);
  const insertEvent = db.prepare(`
    INSERT INTO historical_events (
      id, title, region, start_year, end_year, location_name, category,
      summary, confidence, coordinates_json, detail_json, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      region = excluded.region,
      start_year = excluded.start_year,
      end_year = excluded.end_year,
      location_name = excluded.location_name,
      category = excluded.category,
      summary = excluded.summary,
      confidence = excluded.confidence,
      coordinates_json = excluded.coordinates_json,
      detail_json = excluded.detail_json,
      raw_json = excluded.raw_json
  `);
  const insertModernEvent = db.prepare(`
    INSERT INTO events (
      id, title, event_type, time_start, time_end, display_time, region_id,
      place_entity_id, summary, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'draft', ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      event_type = excluded.event_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      display_time = excluded.display_time,
      region_id = excluded.region_id,
      summary = excluded.summary,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);
  const insertEventPeople = db.prepare(`
    INSERT INTO historical_event_people (event_id, person_id, display_name, sort_order)
    VALUES (?, NULL, ?, ?)
    ON CONFLICT(event_id, sort_order) DO UPDATE SET
      person_id = NULL,
      display_name = excluded.display_name
  `);
  const insertEventSource = db.prepare(`
    INSERT INTO historical_event_sources (event_id, source_id, locator, raw_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(event_id, source_id, locator) DO UPDATE SET
      raw_json = excluded.raw_json
  `);
  const insertSearchDocument = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      title = excluded.title,
      body = excluded.body,
      language = excluded.language,
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
    ) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);

  db.exec("BEGIN;");
  try {
    upsertPeriod.run(
      "rome-190-310",
      "Roman Empire 190-310",
      190,
      310,
      "rome",
      null,
      "project-scope",
      "Roman imperial crisis from the Severan settlement through the Tetrarchy and the early Constantinian transition.",
      JSON.stringify({ generatedFrom: "scripts/promote-rome-staging-events.mjs", batchId }),
    );

    db.prepare("DELETE FROM historical_events WHERE region = 'rome'").run();
    db.prepare("DELETE FROM events WHERE region_id = 'rome'").run();

    for (const [index, card] of cards.entries()) {
      const event = events[index];
      const sourceId = sourceIdFor(card);
      const sourceLabel = event.sources[0];
      const confidence = card.confidence || "medium";
      const questions = parseJson(card.questions_json, []);
      const peopleCore = parseJson(card.people_core_json, []);
      const peopleMentioned = parseJson(card.people_mentioned_json, []);
      const places = parseJson(card.places_json, []);
      const rawCard = parseJson(card.raw_json, {});
      const originalText = rawCard.originalText || rawCard.text || null;
      const translation = card.translation || rawCard.translation || null;
      const documentId = `event:${event.id}`;
      const quote = originalText;
      const standardRaw = {
        promotedFromBatch: batchId,
        cardId: card.id,
        fileId: card.file_id,
        cardIndex: card.card_index,
        sourceId,
        sourceTitle: card.source_title,
        locator: card.locator,
        originalText,
        translation,
        originalTextMissing: !originalText,
        peopleCore,
        peopleMentioned,
        places,
        macroEvent: card.macro_event,
        eventLabel: card.event_label,
        factType: card.fact_type,
        questions,
        confidence,
        importance: event.importance,
        sourceRefs: event.sourceRefs,
        tags: event.tags,
        people: event.people,
        sources: event.sources,
        promotedAt: now,
      };

      insertSource.run(
        sourceId,
        card.source_title,
        card.author,
        sourceTypeValue(card.source_type),
        sourceLabel,
        null,
        "zh-Hans",
        "rome-imperial",
        card.quoted_work || card.section || null,
        JSON.stringify({
          promotedFromBatch: batchId,
          sourceTitle: card.source_title,
          quotedWork: card.quoted_work,
          section: card.section,
          promotedAt: now,
        }),
      );

      insertEvent.run(
        event.id,
        event.title,
        event.region,
        event.startYear,
        event.endYear,
        event.locationName,
        event.category,
        event.summary,
        event.confidence,
        null,
        JSON.stringify(event.detail),
        JSON.stringify(standardRaw),
      );

      const displayTime = event.startYear !== event.endYear ? `${event.startYear}-${event.endYear}` : String(event.startYear);
      insertModernEvent.run(
        event.id,
        event.title,
        event.category,
        event.startYear,
        event.endYear,
        displayTime,
        event.region,
        event.summary,
        event.confidence,
        JSON.stringify({
          ...event,
          ...standardRaw,
        }),
      );

      insertSearchDocument.run(
        documentId,
        "events",
        event.id,
        documentTitle(card),
        documentBody(card),
        "zh-Hans",
        "rome",
        "rome-190-310",
        topicForFactType(card.fact_type),
        event.startYear,
        event.endYear,
        "draft",
        JSON.stringify(standardRaw),
      );

      for (const [personIndex, person] of event.people.entries()) {
        insertEventPeople.run(event.id, person, personIndex);
      }

      insertEventSource.run(
        event.id,
        sourceId,
        card.locator,
        JSON.stringify({ cardId: card.id, sourceTitle: card.source_title, locator: card.locator }),
      );

      insertEvidence.run(
        `historical-event-source:${event.id}:${sourceId}:${card.locator}`,
        "events",
        event.id,
        sourceId,
        card.locator,
        quote,
        "support",
        confidence,
        JSON.stringify({ cardId: card.id, sourceTitle: card.source_title, locator: card.locator }),
      );
    }
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  const existingEvents = JSON.parse(await readFile(eventsJsonPath, "utf8"));
  const nonRomeEvents = existingEvents.filter((event) => event.region !== "rome");
  const mergedEvents = [...nonRomeEvents, ...events].sort((left, right) => {
    return left.startYear - right.startYear || left.endYear - right.endYear || left.region.localeCompare(right.region) || left.id.localeCompare(right.id);
  });
  await writeFile(eventsJsonPath, `${JSON.stringify(mergedEvents, null, 2)}\n`, "utf8");

  console.log(`Promoted ${events.length} Roman events from ${batchId}`);
  console.log(`Updated ${path.relative(rootDir, eventsJsonPath)}`);
} finally {
  db.close();
}
