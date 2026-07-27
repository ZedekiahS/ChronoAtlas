import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configArg = process.argv.find((value) => value.startsWith("--config="))?.slice("--config=".length);
const dbArg = process.argv.find((value) => value.startsWith("--db="))?.slice("--db=".length);
if (!configArg) throw new Error("Missing --config=<module path>");

const config = await import(pathToFileURL(path.resolve(rootDir, configArg)).href);
const entries = config.events ?? [];
if (!config.generator || !config.profileId || !config.periodId || !entries.length) {
  throw new Error("Regnal event config requires generator, profileId, periodId, and events");
}

const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

const stableId = (value) => createHash("sha256").update(value).digest("hex").slice(0, 20);
const eventIdFor = (key) => `official-history-event:${stableId(`${config.generator}:${key}`)}`;
const compact = (value) => String(value ?? "").replace(/\s+/gu, " ").trim();
const parseJson = (value) => {
  try { return JSON.parse(value ?? "{}"); } catch { return {}; }
};

const findPassage = db.prepare("SELECT text FROM source_passages WHERE id = ? AND source_id = ?");
const findEntity = db.prepare("SELECT id, primary_label FROM entities WHERE id = ?");
const findEvent = db.prepare("SELECT id, review_status, raw_json FROM events WHERE id = ?");
const validated = entries.map((entry) => {
  for (const field of ["key", "title", "eventType", "year", "summary", "sourceId", "passageId", "locator", "quote", "chronology"]) {
    if (!entry[field]) throw new Error(`Missing ${field} in regnal event entry`);
  }
  if (!Number.isInteger(entry.year)) throw new Error(`Event year must be an integer: ${entry.key}`);
  if (!compact(entry.quote) || compact(entry.title).length > 32) throw new Error(`Invalid title or quote: ${entry.key}`);
  const passage = findPassage.get(entry.passageId, entry.sourceId);
  if (!passage?.text.includes(entry.quote)) throw new Error(`Quote not found in source passage: ${entry.key}`);
  const participants = (entry.participants ?? []).map((participant) => {
    if (!participant.entityId) throw new Error(`Missing participant entityId: ${entry.key}`);
    const entity = findEntity.get(participant.entityId);
    if (!entity) throw new Error(`Unknown participant entity: ${participant.entityId}`);
    return { ...participant, label: entity.primary_label };
  });
  const id = eventIdFor(entry.key);
  const existing = findEvent.get(id);
  if (existing && parseJson(existing.raw_json).generator !== config.generator) {
    throw new Error(`Refusing to replace event not owned by this registry: ${id}`);
  }
  return { ...entry, id, participants };
});

const upsertEvent = db.prepare(`
  INSERT INTO events (id, title, event_type, time_start, time_end, display_time, region_id, summary, confidence, review_status, raw_json, time_precision)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'high', 'needs-review', ?, 'year')
  ON CONFLICT(id) DO UPDATE SET
    title=excluded.title, event_type=excluded.event_type, time_start=excluded.time_start, time_end=excluded.time_end,
    display_time=excluded.display_time, region_id=excluded.region_id, summary=excluded.summary, confidence=excluded.confidence,
    review_status=CASE WHEN events.review_status IN ('reviewed', 'approved') THEN events.review_status ELSE excluded.review_status END,
    raw_json=excluded.raw_json, time_precision=excluded.time_precision
`);
const upsertEntity = db.prepare(`
  INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(event_id, entity_id, role) DO UPDATE SET sort_order=excluded.sort_order, raw_json=excluded.raw_json
`);
const upsertEvidence = db.prepare(`
  INSERT INTO evidence_links (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
  VALUES (?, 'events', ?, ?, ?, NULL, ?, ?, 'primary', 'high', ?)
  ON CONFLICT(id) DO UPDATE SET subject_id=excluded.subject_id, source_id=excluded.source_id, passage_id=excluded.passage_id,
    mention_id=NULL, locator=excluded.locator, quote=excluded.quote, evidence_role=excluded.evidence_role,
    confidence=excluded.confidence, raw_json=excluded.raw_json
`);
const upsertSearch = db.prepare(`
  INSERT INTO search_documents (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES (?, 'events', ?, ?, ?, 'zh-Hans', ?, ?, NULL, ?, ?, 'needs-review', ?)
  ON CONFLICT(id) DO UPDATE SET title=excluded.title, body=excluded.body, region_id=excluded.region_id, period_id=excluded.period_id,
    time_start=excluded.time_start, time_end=excluded.time_end,
    review_status=CASE WHEN search_documents.review_status IN ('reviewed', 'approved') THEN search_documents.review_status ELSE excluded.review_status END,
    raw_json=excluded.raw_json
`);

db.exec("BEGIN");
try {
  for (const entry of validated) {
    const raw = JSON.stringify({
      generator: config.generator,
      profileId: config.profileId,
      periodId: config.periodId,
      registryKey: entry.key,
      machinePromoted: true,
      people: entry.participants.map((participant) => participant.label),
      personIds: entry.participants.filter((participant) => participant.entityId.startsWith("person:")).map((participant) => participant.entityId.slice("person:".length)),
      sourceIds: [entry.sourceId],
      chronology: entry.chronology,
      sourceVerification: "source-passage-contiguous-quote",
    });
    upsertEvent.run(entry.id, entry.title, entry.eventType, entry.year, entry.year, String(entry.year), entry.regionId ?? "china", entry.summary, raw);
    entry.participants.forEach((participant, index) => {
      upsertEntity.run(entry.id, participant.entityId, participant.role ?? "participant", index, raw);
    });
    upsertEvidence.run(
      `official-history-evidence:${stableId(`${config.generator}:${entry.key}:${entry.passageId}:${entry.quote}`)}`,
      entry.id, entry.sourceId, entry.passageId, entry.locator, entry.quote, raw,
    );
    upsertSearch.run(
      `event:${entry.id}`,
      entry.id,
      entry.title,
      [entry.title, entry.summary, ...entry.participants.map((participant) => participant.label), entry.quote].filter(Boolean).join("\n\n"),
      entry.regionId ?? "china", config.periodId, entry.year, entry.year, raw,
    );
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

console.log(JSON.stringify({
  generator: config.generator,
  profileId: config.profileId,
  events: validated.map(({ id, key, title, year, passageId }) => ({ id, key, title, year, passageId })),
}, null, 2));
