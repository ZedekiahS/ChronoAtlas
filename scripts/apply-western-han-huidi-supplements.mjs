import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { rebuildDocumentChunks } from "../db/migrations/007-document-chunks-fts.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = path.join(rootDir, "db", "chronoatlas.sqlite");
const db = new DatabaseSync(databasePath);
const generatedFrom = "western-han-huidi-supplements-v1";
const sourceId = "hanshu-guoxue123-003";
const personId = "han-liu-ying";
const personEntityId = `person:${personId}`;

const events = [
  {
    id: "official-history-event:western-han-huidi-accession",
    title: "\u6c49\u60e0\u5e1d\u5218\u76c8\u5373\u4f4d",
    year: -195,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0001",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u9ad8\u7956\u5341\u4e8c\u5e74\u4e94\u6708",
    quote: "\u4e94\u6708\u4e19\u5bc5\uff0c\u592a\u5b50\u5373\u7687\u5e1d\u4f4d\uff0c\u5c0a\u7687\u540e\u66f0\u7687\u592a\u540e\u3002",
    summary: "\u524d195\u5e74\uff0c\u9ad8\u7956\u5d29\u540e\uff0c\u592a\u5b50\u5218\u76c8\u5373\u7687\u5e1d\u4f4d\uff0c\u662f\u4e3a\u6c49\u60e0\u5e1d\u3002",
  },
  {
    id: "official-history-event:western-han-huidi-zhao-ruyi-dies",
    title: "\u8d75\u9690\u738b\u5218\u5982\u610f\u53bb\u4e16",
    year: -194,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0002",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u5143\u5e74\u51ac\u5341\u4e8c\u6708",
    quote: "\u5143\u5e74\u51ac\u5341\u4e8c\u6708\uff0c\u8d75\u9690\u738b\u5982\u610f\u85a8\u3002",
    summary: "\u524d194\u5e74\uff0c\u8d75\u9690\u738b\u5218\u5982\u610f\u53bb\u4e16\u3002",
  },
  {
    id: "official-history-event:western-han-huidi-xiao-he-dies",
    title: "\u8427\u4f55\u53bb\u4e16",
    year: -193,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0002",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u4e8c\u5e74\u79cb\u4e03\u6708",
    quote: "\u79cb\u4e03\u6708\u8f9b\u672a\uff0c\u76f8\u56fd\u4f55\u85a8\u3002",
    summary: "\u524d193\u5e74\uff0c\u76f8\u56fd\u8427\u4f55\u53bb\u4e16\u3002",
  },
  {
    id: "official-history-event:western-han-huidi-minyue-yu-ennobled",
    title: "\u95fd\u8d8a\u541b\u6447\u88ab\u7acb\u4e3a\u4e1c\u6d77\u738b",
    year: -192,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0002",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u4e09\u5e74\u590f\u4e94\u6708",
    quote: "\u590f\u4e94\u6708\uff0c\u7acb\u95fd\u8d8a\u541b\u6447\u4e3a\u4e1c\u6d77\u738b\u3002",
    summary: "\u524d192\u5e74\uff0c\u6c49\u5ef7\u7acb\u95fd\u8d8a\u541b\u6447\u4e3a\u4e1c\u6d77\u738b\u3002",
  },
  {
    id: "official-history-event:western-han-huidi-empress-zhang-enthroned",
    title: "\u5f20\u6c0f\u88ab\u7acb\u4e3a\u7687\u540e",
    year: -191,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0002",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u56db\u5e74\u51ac\u5341\u6708",
    quote: "\u56db\u5e74\u51ac\u5341\u6708\u58ec\u5bc5\uff0c\u7acb\u7687\u540e\u5f20\u6c0f\u3002",
    summary: "\u524d191\u5e74\uff0c\u6c49\u60e0\u5e1d\u7acb\u5f20\u6c0f\u4e3a\u7687\u540e\u3002",
  },
  {
    id: "official-history-event:western-han-huidi-abolishes-book-law",
    title: "\u6c49\u5ead\u5e9f\u9664\u631f\u4e66\u5f8b",
    year: -191,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0002",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u56db\u5e74\u4e09\u6708",
    quote: "\u4e09\u6708\u7532\u5b50\uff0c\u7687\u5e1d\u51a0\uff0c\u8d66\u5929\u4e0b\u3002\u7701\u6cd5\u4ee4\u59a8\u540f\u6c11\u8005\uff1b\u9664\u631f\u4e66\u5f8b\u3002",
    summary: "\u524d191\u5e74\uff0c\u6c49\u5ef7\u5e9f\u9664\u631f\u4e66\u5f8b\u3002",
  },
  {
    id: "official-history-event:western-han-huidi-cao-can-dies",
    title: "\u66f9\u53c2\u53bb\u4e16",
    year: -189,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0002",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u4e94\u5e74\u79cb\u516b\u6708",
    quote: "\u79cb\u516b\u6708\u5df1\u4e11\uff0c\u76f8\u56fd\u53c2\u85a8\u3002",
    summary: "\u524d189\u5e74\uff0c\u76f8\u56fd\u66f9\u53c2\u53bb\u4e16\u3002",
  },
  {
    id: "official-history-event:western-han-huidi-dies",
    title: "\u6c49\u60e0\u5e1d\u5218\u76c8\u53bb\u4e16",
    year: -188,
    passageId: "guoxue123:hanshu:hanshu-guoxue123-003:0003",
    locator: "\u6c49\u4e66\u00b7\u60e0\u5e1d\u7eaa\u00b7\u4e03\u5e74\u79cb\u516b\u6708",
    quote: "\u79cb\u516b\u6708\u620a\u5bc5\uff0c\u5e1d\u5d29\u4e8e\u672a\u592e\u5bab\u3002",
    summary: "\u524d188\u5e74\uff0c\u6c49\u60e0\u5e1d\u5218\u76c8\u53bb\u4e16\u3002",
  },
];

db.exec("BEGIN IMMEDIATE");
try {
  db.prepare(`
    INSERT INTO persons (id, region, name, birth_year, death_year, life_confidence, primary_polity, summary, coverage_status, raw_json)
    VALUES (?, 'china', '\u5218\u76c8', -210, -188, 'medium', '\u897f\u6c49', '\u897f\u6c49\u7b2c\u4e8c\u4f4d\u7687\u5e1d\u3002', 'partial', ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, death_year = excluded.death_year, summary = excluded.summary
  `).run(personId, JSON.stringify({ generatedFrom }));

  db.prepare(`
    INSERT INTO entities (id, entity_type, primary_label, region_id, time_start, time_end, summary, confidence, review_status, raw_json)
    VALUES (?, 'person', '\u5218\u76c8', 'china', -210, -188, '\u897f\u6c49\u60e0\u5e1d\u3002', 'high', 'needs-review', ?)
    ON CONFLICT(id) DO UPDATE SET primary_label = excluded.primary_label, time_start = excluded.time_start, time_end = excluded.time_end, summary = excluded.summary, raw_json = excluded.raw_json
  `).run(personEntityId, JSON.stringify({ generatedFrom, legacyPersonId: personId }));

  const upsertEvent = db.prepare(`
    INSERT INTO events (id, title, event_type, time_start, time_end, display_time, region_id, place_entity_id, summary, confidence, review_status, raw_json, time_precision)
    VALUES (?, ?, 'politics', ?, ?, ?, 'china', NULL, ?, 'high', 'needs-review', ?, 'year')
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, time_start = excluded.time_start, time_end = excluded.time_end, display_time = excluded.display_time, summary = excluded.summary, confidence = excluded.confidence, review_status = excluded.review_status, raw_json = excluded.raw_json, time_precision = excluded.time_precision
  `);
  const upsertEvidence = db.prepare(`
    INSERT INTO evidence_links (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
    VALUES (?, 'events', ?, ?, ?, NULL, ?, ?, 'primary', 'high', ?)
    ON CONFLICT(id) DO UPDATE SET subject_id = excluded.subject_id, source_id = excluded.source_id, passage_id = excluded.passage_id, locator = excluded.locator, quote = excluded.quote, confidence = excluded.confidence, raw_json = excluded.raw_json
  `);
  const upsertSearch = db.prepare(`
    INSERT INTO search_documents (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
    VALUES (?, 'events', ?, ?, ?, 'zh-Hans', 'china', 'china-western-han--202--9', 'political_structure', ?, ?, 'needs-review', ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, period_id = excluded.period_id, time_start = excluded.time_start, time_end = excluded.time_end, review_status = excluded.review_status, raw_json = excluded.raw_json
  `);
  const linkPerson = db.prepare(`
    INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, 'participant', 0, ?)
    ON CONFLICT(event_id, entity_id, role) DO UPDATE SET raw_json = excluded.raw_json
  `);

  for (const item of events) {
    upsertEvent.run(item.id, item.title, item.year, item.year, String(item.year), item.summary, JSON.stringify({ generatedFrom, sourceId, passageId: item.passageId, reviewNotice: "Manual bounded supplement from Hanshu Huidi Ji." }));
    upsertEvidence.run(`western-han-huidi:${item.id}`, item.id, sourceId, item.passageId, item.locator, item.quote, JSON.stringify({ generatedFrom }));
    upsertSearch.run(`event-card:${item.id}`, item.id, item.title, `${item.title}\n${item.summary}\n${item.quote}`, item.year, item.year, JSON.stringify({ generatedFrom }));
    if (item.id.endsWith("accession") || item.id.endsWith("huidi-dies")) {
      linkPerson.run(item.id, personEntityId, JSON.stringify({ generatedFrom, historicalRole: "emperor" }));
    }
  }

  db.prepare(`
    INSERT INTO search_documents (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
    VALUES (?, 'entities', ?, '\u5218\u76c8', '\u6c49\u60e0\u5e1d\u5218\u76c8\uff0c\u524d195\u5e74\u5373\u4f4d\uff0c\u524d188\u5e74\u53bb\u4e16\u3002', 'zh-Hans', 'china', 'china-western-han--202--9', 'person', -210, -188, 'needs-review', ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, period_id = excluded.period_id, time_start = excluded.time_start, time_end = excluded.time_end, review_status = excluded.review_status, raw_json = excluded.raw_json
  `).run(`person-card:${personEntityId}`, personEntityId, JSON.stringify({ generatedFrom, legacyPersonId: personId }));

  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

const chunks = rebuildDocumentChunks(db);
console.log(JSON.stringify({ generatedFrom, events: events.length, documentChunks: chunks }, null, 2));
