import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));
const batchId = "manual-red-cliffs-diplomacy-narrow-events";

const events = [
  {
    id: "china-208-zhuge-liang-envoy-to-sun-quan",
    title: "诸葛亮使吴自结孙权",
    titleEn: "Zhuge Liang's mission to Sun Quan",
    year: 208,
    locationName: "江东、柴桑一带",
    category: "diplomacy",
    summary: "刘备南撤后派诸葛亮前往孙权处联络，寻求在曹操南下压力下建立共同抗曹的政治与军事合作。",
    people: ["刘备", "诸葛亮", "孙权", "鲁肃"],
    personIds: ["liu-bei", "zhuge-liang", "sun-quan", "lu-su"],
    polities: ["刘备集团", "孙吴", "曹操集团"],
    relatedEvents: ["china-208-red-cliffs", "china-207-longzhong-plan"],
    tags: ["诸葛亮使吴", "孙刘联盟", "联刘抗曹"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-shu-xianzhu",
        locator: "建安十三年",
        quote: "先主遣诸葛亮自结于孙权，权遣周瑜、程普等水军数万，与先主并力，与曹公战于赤壁，大破之，焚其舟船。",
        mentionId: "mention-sgz-shu-xianzhu-liu-bei-red-cliffs",
      },
    ],
    detail: {
      overview: "刘备集团在荆州失势后，需要迅速争取江东支持；诸葛亮出使孙权，是孙刘合作由战略设想转为现实接触的窄事件。",
      background: [
        "曹操南下荆州、刘琮降曹后，刘备集团失去稳定立足点，只能沿江南撤。",
        "孙权也面临是否臣服曹操、保守江东或联合刘备抵抗的选择。",
      ],
      process: [
        "刘备派诸葛亮前往孙权处联络，目标是把双方的共同安全压力转化为共同抗曹行动。",
      ],
      result: [
        "孙权最终派周瑜、程普等率军与刘备并力抗曹，为赤壁战役创造联盟前提。",
      ],
      impact: [
        "这一外交接触是赤壁之战前孙刘联盟形成的关键环节，适合与其他外交、联盟或谈判事件对比。",
      ],
      sourceNotes: [
        "《三国志·蜀书·先主传》明确记载“遣诸葛亮自结于孙权”，可支撑此窄事件。",
      ],
      uncertainty: [
        "具体会面地点与谈判细节在纪传材料中不如战役叙事完整，第一版按外交节点处理，不展开演义化细节。",
      ],
    },
  },
  {
    id: "china-208-sun-liu-alliance-formed",
    title: "孙刘联盟形成",
    titleEn: "Formation of the Sun-Liu alliance",
    year: 208,
    locationName: "江东、长江中游",
    category: "diplomacy",
    summary: "孙权集团内部抗曹意见占上风后，孙权派周瑜、程普等与刘备并力抗曹，孙刘联盟从联络转为共同军事行动。",
    people: ["孙权", "刘备", "周瑜", "鲁肃", "诸葛亮", "程普"],
    personIds: ["sun-quan", "liu-bei", "zhou-yu", "lu-su", "zhuge-liang", "cheng-pu"],
    polities: ["孙吴", "刘备集团", "曹操集团"],
    relatedEvents: ["china-208-zhuge-liang-envoy-to-sun-quan", "china-208-red-cliffs"],
    tags: ["孙刘联盟", "联刘抗曹", "赤壁前奏"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wu-wuzhu",
        locator: "建安十三年",
        quote: "惟瑜、肃执拒之议，意与权同。瑜、普为左右督，各领万人，与备俱进，遇于赤壁，大破曹公军。",
        mentionId: "mention-sgz-wu-wuzhu-sun-quan-red-cliffs",
      },
      {
        sourceId: "sanguozhi-shu-xianzhu",
        locator: "建安十三年",
        quote: "先主遣诸葛亮自结于孙权，权遣周瑜、程普等水军数万，与先主并力，与曹公战于赤壁，大破之，焚其舟船。",
        mentionId: "mention-sgz-shu-xianzhu-liu-bei-red-cliffs",
      },
    ],
    detail: {
      overview: "孙刘联盟形成是赤壁战役的外交与战略前置节点；它不同于赤壁之战本体，重点在孙权决策和孙刘合作关系确立。",
      background: [
        "曹操控制荆州后，江东面临直接压力，孙权集团内部存在降曹与抗曹之间的选择。",
        "鲁肃、周瑜等支持抗曹，刘备集团也需要江东支援以避免被曹操压垮。",
      ],
      process: [
        "孙权方面抗曹意见占上风后，周瑜、程普被派出统军，与刘备集团形成共同抗曹行动。",
      ],
      result: [
        "孙刘合作进入军事实施阶段，并在赤壁战区共同抵抗曹操。",
      ],
      impact: [
        "该联盟暂时阻止曹操南下，但荆州归属也成为后来孙刘关系紧张的根源。",
      ],
      sourceNotes: [
        "《三国志·吴书·吴主传》强调周瑜、鲁肃抗曹意见与孙权决策，《蜀书·先主传》强调刘备派诸葛亮联络孙权。",
      ],
      uncertainty: [
        "联盟不是现代条约式文本，而是基于共同抗曹压力形成的政治军事合作。",
      ],
    },
  },
];

function json(value) {
  return JSON.stringify(value, null, 2);
}

function compactJson(value) {
  return JSON.stringify(value);
}

function rawFor(event) {
  return {
    id: event.id,
    title: event.title,
    titleEn: event.titleEn,
    startYear: event.year,
    endYear: event.year,
    region: "china",
    locationName: event.locationName,
    category: event.category,
    summary: event.summary,
    people: event.people,
    personIds: event.personIds,
    polities: event.polities,
    relatedEvents: event.relatedEvents,
    tags: event.tags,
    confidence: "high",
    sources: event.sourceRefs.map((ref) => ref.sourceId),
    sourceRefs: event.sourceRefs.map(({ mentionId, ...ref }) => ref),
    detail: event.detail,
    reviewStatus: "reviewed",
    reviewedBy: batchId,
  };
}

const upsertHistoricalEvent = db.prepare(`
  INSERT OR REPLACE INTO historical_events
    (id, title, region, start_year, end_year, location_name, category, summary, confidence, coordinates_json, detail_json, raw_json)
  VALUES
    (@id, @title, 'china', @year, @year, @locationName, @category, @summary, 'high', NULL, @detailJson, @rawJson)
`);
const upsertHistoricalEventI18n = db.prepare(`
  INSERT OR REPLACE INTO historical_event_i18n
    (event_id, locale, title, location_name, summary, raw_json)
  VALUES
    (?, 'zh', ?, ?, ?, '{}')
`);
const deleteHistoricalPeople = db.prepare("DELETE FROM historical_event_people WHERE event_id = ?");
const insertHistoricalPerson = db.prepare(`
  INSERT OR REPLACE INTO historical_event_people
    (event_id, person_id, display_name, sort_order)
  VALUES
    (?, ?, ?, ?)
`);
const deleteHistoricalSources = db.prepare("DELETE FROM historical_event_sources WHERE event_id = ?");
const insertHistoricalSource = db.prepare(`
  INSERT OR REPLACE INTO historical_event_sources
    (event_id, source_id, locator, raw_json)
  VALUES
    (?, ?, ?, ?)
`);
const upsertEvent = db.prepare(`
  INSERT OR REPLACE INTO events
    (id, title, event_type, time_start, time_end, display_time, region_id, place_entity_id, summary, confidence, review_status, raw_json)
  VALUES
    (@id, @title, @category, @year, @year, @displayTime, 'china', NULL, @summary, 'high', 'reviewed', @rawJson)
`);
const upsertEventI18n = db.prepare(`
  INSERT OR REPLACE INTO event_i18n
    (event_id, locale, title, display_time, summary, raw_json)
  VALUES
    (?, 'zh', ?, ?, ?, '{}')
`);
const deleteEventEntities = db.prepare("DELETE FROM event_entities WHERE event_id = ?");
const insertEventEntity = db.prepare(`
  INSERT OR REPLACE INTO event_entities
    (event_id, entity_id, role, sort_order, raw_json)
  VALUES
    (?, ?, ?, ?, ?)
`);
const deleteEvidenceLinks = db.prepare("DELETE FROM evidence_links WHERE id LIKE ?");
const insertEvidenceLink = db.prepare(`
  INSERT OR REPLACE INTO evidence_links
    (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
  VALUES
    (?, 'events', ?, ?, NULL, ?, ?, ?, 'support', 'high', ?)
`);
const upsertSourceMentionEvent = db.prepare(`
  INSERT OR REPLACE INTO source_mention_events
    (mention_id, event_id, sort_order)
  VALUES
    (?, ?, ?)
`);
const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents
    (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES
    (?, 'events', ?, ?, ?, 'zh-Hans', 'china', 'china-three-kingdoms-180-280', NULL, ?, ?, 'reviewed', ?)
`);
const selectEventRaw = db.prepare("SELECT raw_json FROM events WHERE id = ?");
const updateEventRaw = db.prepare("UPDATE events SET raw_json = ? WHERE id = ?");
const selectHistoricalRaw = db.prepare("SELECT raw_json FROM historical_events WHERE id = ?");
const updateHistoricalRaw = db.prepare("UPDATE historical_events SET raw_json = ? WHERE id = ?");

function addRelatedEvent(eventId, relatedEventIds) {
  for (const [select, update] of [
    [selectEventRaw, updateEventRaw],
    [selectHistoricalRaw, updateHistoricalRaw],
  ]) {
    const row = select.get(eventId);
    if (!row) continue;

    const raw = JSON.parse(row.raw_json);
    raw.relatedEvents = [...new Set([...(raw.relatedEvents ?? []), ...relatedEventIds])];
    update.run(json(raw), eventId);
  }
}

db.exec("BEGIN");
try {
  for (const event of events) {
    const raw = rawFor(event);
    const detailJson = json(event.detail);
    const rawJson = json(raw);
    upsertHistoricalEvent.run({
      id: event.id,
      title: event.title,
      year: event.year,
      locationName: event.locationName,
      category: event.category,
      summary: event.summary,
      detailJson,
      rawJson,
    });
    upsertHistoricalEventI18n.run(event.id, event.title, event.locationName, event.summary);
    deleteHistoricalPeople.run(event.id);
    event.personIds.forEach((personId, index) => insertHistoricalPerson.run(event.id, personId, event.people[index] ?? personId, index));
    deleteHistoricalSources.run(event.id);
    event.sourceRefs.forEach((ref) => insertHistoricalSource.run(event.id, ref.sourceId, ref.locator, compactJson(ref)));

    upsertEvent.run({
      id: event.id,
      title: event.title,
      category: event.category,
      year: event.year,
      displayTime: String(event.year),
      summary: event.summary,
      rawJson,
    });
    upsertEventI18n.run(event.id, event.title, String(event.year), event.summary);
    deleteEventEntities.run(event.id);
    event.personIds.forEach((personId, index) => {
      insertEventEntity.run(event.id, `person:${personId}`, event.people[index] ?? "participant", index, compactJson({ generatedFrom: batchId }));
    });
    deleteEvidenceLinks.run(`red-cliffs-diplomacy:${event.id}:%`);
    event.sourceRefs.forEach((ref, index) => {
      insertEvidenceLink.run(
        `red-cliffs-diplomacy:${event.id}:${ref.sourceId}:${index}`,
        event.id,
        ref.sourceId,
        ref.mentionId,
        ref.locator,
        ref.quote ?? null,
        compactJson(ref),
      );
      if (ref.mentionId) {
        upsertSourceMentionEvent.run(ref.mentionId, event.id, index);
      }
    });
    upsertSearchDocument.run(
      `event:${event.id}`,
      event.id,
      event.title,
      [
        event.title,
        event.summary,
        ...event.detail.background,
        ...event.detail.process,
        ...event.detail.result,
        ...event.detail.impact,
        event.people.join("、"),
        event.polities.join("、"),
        event.tags.join("、"),
      ].join("\n"),
      event.year,
      event.year,
      compactJson({ generatedFrom: batchId }),
    );
  }

  addRelatedEvent("china-208-red-cliffs", events.map((event) => event.id));
  addRelatedEvent("china-207-longzhong-plan", ["china-208-zhuge-liang-envoy-to-sun-quan"]);

  db.exec("COMMIT");
  console.log(`Seeded ${events.length} Red Cliffs diplomacy narrow events.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
