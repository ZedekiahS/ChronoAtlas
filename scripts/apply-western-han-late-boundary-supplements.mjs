import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((value) => value.startsWith("--db="))?.slice(5);
const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const generatedFrom = "western-han-late-boundary-supplements-v1";
const profileId = "china-western-han-xin-transition--8-24-v1";
const periodId = "china-western-han-xin-transition--8-24";
const u = (value) => JSON.parse(`"${value}"`);
const eventId = (key) => `official-history-event:${createHash("sha256").update(`${generatedFrom}:${key}`).digest("hex").slice(0, 20)}`;

const ruzi = {
  personId: "han-liu-ying-ruzi",
  entityId: "person:han-liu-ying-ruzi",
  name: u("\u5218\u5a74"),
  aliases: [u("\u5b7a\u5b50\u5a74"), u("\u5b7a\u5b50"), u("\u5218\u5b50\u8206")],
  summary: u("\u897f\u6c49\u5b97\u5ba4\uff0c\u6c49\u5ba3\u5e1d\u7384\u5b59\u30026\u5e74\u88ab\u7acb\u4e3a\u7687\u592a\u5b50\uff0c\u53f7\u5b7a\u5b50\uff0c\u5b9e\u6743\u7531\u738b\u83bd\u638c\u63e1\u3002"),
};

const events = [
  {
    key: "aidi-accession", title: u("\u6c49\u54c0\u5e1d\u5218\u6b23\u5373\u4f4d"), year: -7, type: "succession",
    summary: u("\u7ee5\u548c\u4e8c\u5e74\u56db\u6708\uff0c\u7687\u592a\u5b50\u5218\u6b23\u5373\u7687\u5e1d\u4f4d\uff0c\u8c12\u9ad8\u5e99\u3002"),
    sourceId: "hanshu-guoxue123-012", passageId: "guoxue123:hanshu:hanshu-guoxue123-012:0001",
    locator: u("\u6c49\u4e66\u00b7\u54c0\u5e1d\u7eaa\u00b7\u7ee5\u548c\u4e8c\u5e74"),
    quote: u("\u7d8f\u548c\u4e8c\u5e74\u4e09\u6708\uff0c\u6210\u5e1d\u5d29\u3002\u56db\u6708\u4e19\u5348\uff0c\u592a\u5b50\u5373\u7687\u5e1d\u4f4d\uff0c\u8b01\u9ad8\u5edf\u3002"),
    entityIds: ["person:han-liu-xin-aidi"],
  },
  {
    key: "pingdi-accession", title: u("\u6c49\u5e73\u5e1d\u5218\u884e\u5373\u4f4d"), year: -1, type: "succession",
    summary: u("\u5143\u5bff\u4e8c\u5e74\u4e5d\u6708\uff0c\u4e2d\u5c71\u738b\u5218\u884e\u5373\u7687\u5e1d\u4f4d\uff0c\u8c12\u9ad8\u5e99\u5e76\u5927\u8d66\u5929\u4e0b\u3002"),
    sourceId: "hanshu-guoxue123-013", passageId: "guoxue123:hanshu:hanshu-guoxue123-013:0001",
    locator: u("\u6c49\u4e66\u00b7\u5e73\u5e1d\u7eaa\u00b7\u5143\u5bff\u4e8c\u5e74"),
    quote: u("\u4e5d\u6708\u8f9b\u9149\uff0c\u4e2d\u5c71\u738b\u5373\u7687\u5e1d\u4f4d\uff0c\u8b01\u9ad8\u5edf\uff0c\u5927\u8d66\u5929\u4e0b\u3002"),
    entityIds: ["person:han-liu-kan-pingdi"],
  },
  {
    key: "ruzi-installed", title: u("\u5218\u5a74\u88ab\u7acb\u4e3a\u7687\u592a\u5b50\u5e76\u53f7\u5b7a\u5b50"), year: 6, type: "succession",
    summary: u("\u5c45\u6444\u5143\u5e74\u4e09\u6708\uff0c\u6c49\u5ba3\u5e1d\u7384\u5b59\u5218\u5a74\u88ab\u7acb\u4e3a\u7687\u592a\u5b50\uff0c\u53f7\u5b7a\u5b50\u3002"),
    sourceId: "hanshu-guoxue123-116", passageId: "guoxue123:hanshu:hanshu-guoxue123-116:0013",
    locator: u("\u6c49\u4e66\u00b7\u738b\u83bd\u4f20\u4e0a\u00b7\u5c45\u6444\u5143\u5e74"),
    quote: u("\u4e09\u6708\u5df1\u4e11\uff0c\u7acb\u5ba3\u5e1d\u7384\u5b6b\u5b30\u70ba\u7687\u592a\u5b50\uff0c\u865f\u66f0\u5b7a\u5b50\u3002"),
    entityIds: [ruzi.entityId],
  },
  {
    key: "wang-mang-acting-emperor", title: u("\u738b\u83bd\u79f0\u6444\u7687\u5e1d"), year: 6, type: "politics",
    summary: u("\u5e73\u5e1d\u5d29\u540e\uff0c\u738b\u83bd\u5c45\u6444\u8df5\u795a\uff0c\u4eea\u5236\u53f7\u4ee4\u591a\u5982\u5929\u5b50\uff0c\u81e3\u6c11\u79f0\u4e4b\u4e3a\u6444\u7687\u5e1d\u3002"),
    sourceId: "hanshu-guoxue123-116", passageId: "guoxue123:hanshu:hanshu-guoxue123-116:0013",
    locator: u("\u6c49\u4e66\u00b7\u738b\u83bd\u4f20\u4e0a\u00b7\u5c45\u6444\u8bae"),
    quote: u("\u8d0a\u66f0\u300e\u5047\u7687\u5e1d\u300f\uff0c\u3014\u4e00\u4e00\u3015\u6c11\u81e3\u8b02\u4e4b\u300e\u651d\u7687\u5e1d\u300f\uff0c\u81ea\u7a31\u66f0\u300e\u4e88\u300f\u3002"),
    entityIds: ["person:han-wang-mang"],
  },
];

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
for (const event of events) {
  if (!db.prepare("SELECT 1 FROM source_passages WHERE id=? AND source_id=? AND instr(text,?)>0").get(event.passageId, event.sourceId, event.quote)) {
    throw new Error(`Missing contiguous evidence: ${event.title}`);
  }
}

db.exec("BEGIN");
try {
  const raw = JSON.stringify({ generatedFrom, profileId });
  db.prepare(`INSERT INTO persons (id,region,name,life,birth_year,death_year,life_confidence,primary_polity,summary,coverage_status,raw_json)
    VALUES (?,'china',?,'5-25',5,25,'medium',?,?, 'partial',?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,life=excluded.life,birth_year=excluded.birth_year,death_year=excluded.death_year,
      primary_polity=excluded.primary_polity,summary=excluded.summary,raw_json=excluded.raw_json`)
    .run(ruzi.personId, ruzi.name, u("\u897f\u6c49\u5b97\u5ba4"), ruzi.summary, raw);
  db.prepare(`INSERT INTO entities (id,entity_type,primary_label,region_id,time_start,time_end,summary,confidence,review_status,raw_json)
    VALUES (?,'person',?,'china',5,25,?,'medium','needs-review',?)
    ON CONFLICT(id) DO UPDATE SET primary_label=excluded.primary_label,time_start=excluded.time_start,time_end=excluded.time_end,summary=excluded.summary,
      review_status=CASE WHEN entities.review_status IN ('reviewed','approved') THEN entities.review_status ELSE excluded.review_status END,raw_json=excluded.raw_json`)
    .run(ruzi.entityId, ruzi.name, ruzi.summary, raw);

  const personAlias = db.prepare(`INSERT INTO person_aliases (id,person_id,value,type,source_refs_json,raw_json) VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET value=excluded.value,type=excluded.type,source_refs_json=excluded.source_refs_json,raw_json=excluded.raw_json`);
  const entityAlias = db.prepare(`INSERT INTO entity_aliases (id,entity_id,value,alias_type,language,raw_json) VALUES (?,?,?,?,'zh-Hans',?)
    ON CONFLICT(id) DO UPDATE SET value=excluded.value,alias_type=excluded.alias_type,raw_json=excluded.raw_json`);
  ruzi.aliases.forEach((alias,index) => {
    const type=index===2?'personal-name':'title';
    personAlias.run(`${ruzi.personId}:alias:${index}`,ruzi.personId,alias,type,JSON.stringify(['hanshu-guoxue123-116']),raw);
    entityAlias.run(`person-alias:${ruzi.personId}:alias:${index}`,ruzi.entityId,alias,type,raw);
    db.prepare("DELETE FROM entity_aliases WHERE id = ?").run(`person-alias:${ruzi.personId}:${index}`);
  });

  const upsertEvent = db.prepare(`INSERT INTO events (id,title,event_type,time_start,time_end,display_time,region_id,summary,confidence,review_status,raw_json,time_precision)
    VALUES (?,?,?,?,?,?,'china',?,'high','needs-review',?,'year') ON CONFLICT(id) DO UPDATE SET title=excluded.title,event_type=excluded.event_type,
      time_start=excluded.time_start,time_end=excluded.time_end,display_time=excluded.display_time,summary=excluded.summary,confidence=excluded.confidence,
      review_status=CASE WHEN events.review_status IN ('reviewed','approved') THEN events.review_status ELSE excluded.review_status END,raw_json=excluded.raw_json,time_precision=excluded.time_precision`);
  const upsertEntity = db.prepare(`INSERT INTO event_entities (event_id,entity_id,role,sort_order,raw_json) VALUES (?,?,'participant',?,?)
    ON CONFLICT(event_id,entity_id,role) DO UPDATE SET sort_order=excluded.sort_order,raw_json=excluded.raw_json`);
  const upsertEvidence = db.prepare(`INSERT INTO evidence_links (id,subject_table,subject_id,source_id,passage_id,mention_id,locator,quote,evidence_role,confidence,raw_json)
    VALUES (?,'events',?,?,?,NULL,?,?,'primary','high',?) ON CONFLICT(id) DO UPDATE SET subject_id=excluded.subject_id,source_id=excluded.source_id,
      passage_id=excluded.passage_id,locator=excluded.locator,quote=excluded.quote,evidence_role=excluded.evidence_role,confidence=excluded.confidence,raw_json=excluded.raw_json`);
  const upsertSearch = db.prepare(`INSERT INTO search_documents (id,subject_table,subject_id,title,body,language,region_id,period_id,topic_id,time_start,time_end,review_status,raw_json)
    VALUES (?,'events',?,?,?,'zh-Hans','china',?,NULL,?,?,'needs-review',?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,
      period_id=excluded.period_id,topic_id=excluded.topic_id,time_start=excluded.time_start,time_end=excluded.time_end,
      review_status=CASE WHEN search_documents.review_status IN ('reviewed','approved') THEN search_documents.review_status ELSE excluded.review_status END,raw_json=excluded.raw_json`);
  for (const event of events) {
    const id=eventId(event.key); const eventRaw=JSON.stringify({generatedFrom,profileId,periodId,sourceIds:[event.sourceId]});
    upsertEvent.run(id,event.title,event.type,event.year,event.year,String(event.year),event.summary,eventRaw);
    event.entityIds.forEach((entity,index)=>upsertEntity.run(id,entity,index,eventRaw));
    upsertEvidence.run(`${generatedFrom}:${event.key}:evidence`,id,event.sourceId,event.passageId,event.locator,event.quote,eventRaw);
    upsertSearch.run(`event:${id}`,id,event.title,`${event.title}\n\n${event.summary}\n\n${event.quote}`,periodId,event.year,event.year,eventRaw);
  }
  const ruziEvent=events.find((event)=>event.key==='ruzi-installed');
  db.prepare(`INSERT INTO evidence_links (id,subject_table,subject_id,source_id,passage_id,mention_id,locator,quote,evidence_role,confidence,raw_json)
    VALUES (?,'entities',?,?,?,NULL,?,?,'primary','high',?) ON CONFLICT(id) DO UPDATE SET locator=excluded.locator,quote=excluded.quote,confidence=excluded.confidence,raw_json=excluded.raw_json`)
    .run(`${generatedFrom}:ruzi-person:evidence`,ruzi.entityId,ruziEvent.sourceId,ruziEvent.passageId,ruziEvent.locator,ruziEvent.quote,raw);
  db.prepare(`INSERT INTO search_documents (id,subject_table,subject_id,title,body,language,region_id,period_id,topic_id,time_start,time_end,review_status,raw_json)
    VALUES (?,'entities',?,?,?,'zh-Hans','china',?,'person',5,25,'needs-review',?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,
      period_id=excluded.period_id,time_start=excluded.time_start,time_end=excluded.time_end,review_status=excluded.review_status,raw_json=excluded.raw_json`)
    .run(`person-card:${ruzi.entityId}`,ruzi.entityId,ruzi.name,`${ruzi.name} ${ruzi.aliases.join(' ')} ${ruzi.summary}`,periodId,raw);
  db.prepare(`DELETE FROM event_entities WHERE event_id='official-history-event:fc00bb6e5dc1d9685c87' AND entity_id='person:han-empress-fu-aidi' AND role='mentioned-source'`).run();
  db.exec("COMMIT");
} catch (error) { db.exec("ROLLBACK"); throw error; }
console.log(JSON.stringify({generatedFrom,events:events.map((event)=>({id:eventId(event.key),title:event.title,year:event.year})),person:ruzi.entityId},null,2));