import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { rebuildDocumentChunks } from "../db/migrations/007-document-chunks-fts.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="))?.slice("--db=".length);
const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const eventId = "official-history-event:75f347d9cb68edf0b45d";
const personId = "wh-wang-zhaojun";
const entityId = `person:${personId}`;
const generatedFrom = "western-han-boundary-supplements-v1";

const evidence = [
  {
    key: "hanshu-yuandi",
    sourceId: "hanshu-guoxue123-010",
    passageId: "guoxue123:hanshu:hanshu-guoxue123-010:0006",
    locator: "汉书·元帝纪 · 竟宁元年",
    quote: "其改元為竟寧，賜單于待詔掖庭王檣為閼氏。",
    role: "primary",
    confidence: "high",
  },
  {
    key: "hanshu-xiongnu",
    sourceId: "hanshu-guoxue123-109",
    passageId: "guoxue123:hanshu:hanshu-guoxue123-109:0003",
    locator: "汉书·匈奴传下 · 竟宁元年",
    quote: "單于自言願婿漢氏以自親。〔一〕元帝以後宮良家子王牆字昭君賜單于。",
    role: "corroboration",
    confidence: "high",
  },
  {
    key: "zizhi-tongjian",
    sourceId: "zizhi-tongjian-guoxue123-030",
    passageId: "guoxue123:zztj:zizhi-tongjian-guoxue123-030:0007",
    locator: "资治通鉴·卷二十九 · 竟宁元年",
    quote: "春，正月，匈奴呼韓邪單于來朝，自言願伲漢氏以自親。帝以後宮良家子王嬙字昭君賜單于。",
    role: "corroboration",
    confidence: "high",
  },
  {
    key: "houhanshu-nanxiongnu",
    sourceId: "houhanshu-guoxue123-098",
    passageId: "guoxue123:hhs:houhanshu-guoxue123-098:0001",
    locator: "后汉书·南匈奴列传 · 王昭君追叙",
    quote: "昭君字嫱，南郡人也。初，元帝时，以良家子选入掖庭。时呼韩邪来朝，帝来以宫女五人赐之。",
    role: "biographical-context",
    confidence: "medium",
  },
];

function parseJson(value, fallback = {}) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId)
  ?? db.prepare("SELECT * FROM events WHERE time_start = -33 AND title LIKE '%呼韩邪%' ORDER BY id LIMIT 1").get();
if (!event) throw new Error("Missing -33 Huhanye court event; promote the Yuandi pack first.");
for (const item of evidence) {
  if (!db.prepare("SELECT 1 FROM sources WHERE id = ?").get(item.sourceId)) throw new Error(`Missing source: ${item.sourceId}`);
  if (!db.prepare("SELECT 1 FROM source_passages WHERE id = ? AND source_id = ?").get(item.passageId, item.sourceId)) {
    throw new Error(`Missing source passage: ${item.passageId}`);
  }
}

const actualEventId = event.id;
const eventTitle = "呼韩邪来朝与王昭君出塞";
const eventSummary = "前33年，呼韩邪单于入朝请求与汉室结亲，汉元帝将掖庭良家子王嫱（字昭君）赐予单于为阏氏。";
const personSummary = "王昭君，名嫱，西汉南郡秭归人。前33年呼韩邪单于来朝时出塞，成为宁胡阏氏。";

db.exec("BEGIN");
try {
  db.prepare(`
    INSERT INTO persons (
      id, region, name, courtesy_name, life, birth_year, death_year,
      life_confidence, primary_polity, summary, coverage_status, raw_json
    ) VALUES (?, 'china', '王昭君', '昭君', NULL, NULL, NULL, 'medium', '西汉 / 匈奴', ?, 'partial', ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      courtesy_name = excluded.courtesy_name,
      primary_polity = excluded.primary_polity,
      summary = excluded.summary,
      raw_json = excluded.raw_json
  `).run(personId, personSummary, JSON.stringify({ generatedFrom, reviewStatus: "needs-review" }));

  db.prepare(`
    INSERT INTO entities (
      id, entity_type, primary_label, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    ) VALUES (?, 'person', '王昭君', 'china', NULL, NULL, ?, 'high', 'needs-review', ?)
    ON CONFLICT(id) DO UPDATE SET
      primary_label = excluded.primary_label,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = CASE WHEN entities.review_status IN ('reviewed', 'approved') THEN entities.review_status ELSE excluded.review_status END,
      raw_json = excluded.raw_json
  `).run(entityId, personSummary, JSON.stringify({ generatedFrom, legacyPersonId: personId, courtesyName: "昭君", primaryPolity: "西汉 / 匈奴" }));

  const insertPersonAlias = db.prepare(`
    INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, type = excluded.type, source_refs_json = excluded.source_refs_json, raw_json = excluded.raw_json
  `);
  const insertEntityAlias = db.prepare(`
    INSERT INTO entity_aliases (id, entity_id, value, alias_type, language, context_source_id, valid_start, valid_end, raw_json)
    VALUES (?, ?, ?, ?, 'zh-Hans', NULL, NULL, NULL, ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, alias_type = excluded.alias_type, raw_json = excluded.raw_json
  `);
  for (const [key, value, type] of [
    ["wang-qiang-simplified", "王嫱", "personal-name"],
    ["wang-qiang-traditional", "王嬙", "traditional-name"],
    ["wang-qiang-wall", "王牆", "source-variant"],
    ["wang-qiang-tower", "王檣", "source-variant"],
    ["ninghu-yanzhi", "宁胡阏氏", "title"],
    ["ninghu-yanzhi-traditional", "寧胡閼氏", "traditional-title"],
  ]) {
    const refs = evidence.map((item) => item.sourceId);
    const raw = JSON.stringify({ generatedFrom });
    insertPersonAlias.run(`${personId}:${key}`, personId, value, type, JSON.stringify(refs), raw);
    insertEntityAlias.run(`person-alias:${personId}:${key}`, entityId, value, type, raw);
  }

  db.prepare("UPDATE events SET title = ?, summary = ?, raw_json = ? WHERE id = ?").run(
    eventTitle,
    eventSummary,
    JSON.stringify({
      ...parseJson(event.raw_json),
      westernHanBoundarySupplement: {
        generatedFrom,
        subject: "Wang Zhaojun",
        evidenceSourceIds: evidence.map((item) => item.sourceId),
      },
    }),
    actualEventId,
  );

  db.prepare(`
    INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, 'participant', 1, ?)
    ON CONFLICT(event_id, entity_id, role) DO UPDATE SET sort_order = excluded.sort_order, raw_json = excluded.raw_json
  `).run(actualEventId, entityId, JSON.stringify({ generatedFrom, historicalRole: "bride-and-yanzhi" }));

  const insertEvidence = db.prepare(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id,
      locator, quote, evidence_role, confidence, raw_json
    ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);
  for (const item of evidence) {
    const raw = JSON.stringify({ generatedFrom, evidenceKey: item.key });
    insertEvidence.run(`western-han-zhaojun:event:${item.key}`, "events", actualEventId, item.sourceId, item.passageId, item.locator, item.quote, item.role, item.confidence, raw);
    insertEvidence.run(`western-han-zhaojun:person:${item.key}`, "entities", entityId, item.sourceId, item.passageId, item.locator, item.quote, item.role, item.confidence, raw);
  }

  db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, 'entities', ?, '王昭君', ?, 'zh-Hans', 'china', 'china-western-han--202--9',
      'person', -33, -30, 'needs-review', ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      period_id = excluded.period_id,
      topic_id = excluded.topic_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `).run(
    `person-card:${entityId}`,
    entityId,
    `王昭君 王嫱 王嬙 王牆 王檣 字昭君 宁胡阏氏 寧胡閼氏 ${personSummary}`,
    JSON.stringify({ generatedFrom, entityId, legacyPersonId: personId }),
  );
  db.prepare(`
    UPDATE search_documents
    SET title = ?, body = body || ' 王昭君 王嫱 王嬙 王牆 王檣 出塞 宁胡阏氏',
        review_status = CASE WHEN review_status = 'rejected' THEN review_status ELSE 'needs-review' END
    WHERE subject_table = 'events' AND subject_id = ?
  `).run(eventTitle, actualEventId);

  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

const chunks = rebuildDocumentChunks(db);
console.log(JSON.stringify({
  eventId: actualEventId,
  personId,
  entityId,
  evidenceLinks: evidence.length * 2,
  documentChunks: chunks,
}, null, 2));
