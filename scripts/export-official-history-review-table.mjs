import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requestedOfficialHistoryPromotionProfile } from "./lib/china-official-history-promotion-profiles.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="))?.slice("--db=".length);
const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const templatePath = path.join(rootDir, "scripts", "templates", "official-history-review-table.html");
const profile = requestedOfficialHistoryPromotionProfile();
const generatorId = profile.generatorId;
const outputArg = process.argv.find((argument) => argument.startsWith("--output="))?.slice("--output=".length);
const outputPath = outputArg
  ? path.resolve(rootDir, outputArg)
  : path.join(rootDir, "data", "review-queues", `${profile.id}-review.html`);

const profileReviewConfig = new Map([
  ["china-western-jin-281-316-v1", {
    title: "西晋正史晋级人工审核",
    uncertainPlaceIds: ["wenshijin", "shangbai", "shicheng"],
    materials: [
      {
        id: "jinshu-edition-locators",
        priority: "高",
        item: "《晋书》正式版本定位",
        requested: "版本名、整理者或出版社、出版年、卷次和页码；可附必要的短摘录。",
        acceptedFormat: "书目信息、页码表或结构化摘录；无需把 PDF、扫描件放入仓库。",
      },
      {
        id: "zizhi-tongjian-312-316",
        priority: "高",
        item: "312-316 年《资治通鉴·晋纪》定位",
        requested: "相关卷次、纪年、原文短摘录和可核验的版本页码或 URL。",
        acceptedFormat: "逐事件定位表；优先覆盖洛阳、长安陷落及西晋末年政权变化。",
      },
      {
        id: "western-jin-person-authority",
        priority: "中",
        item: "西晋人物别名与同名消歧",
        requested: "正式姓名、字、别名、爵位称呼、同名人物区分和依据出处。",
        acceptedFormat: "可直接在人物表选择保留、改名、合并或拒绝，并补充依据。",
      },
      {
        id: "western-jin-place-authority",
        priority: "中",
        item: "西晋历史地名考证",
        requested: "汶石津、上白、石城的古今位置、同期行政隶属及考证出处。",
        acceptedFormat: "地点表中的行政区或地图目标、出处与备注；不确定时选择保持未定位。",
      },
    ],
  }],
]);

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value ?? "{}") ?? fallback;
  } catch {
    return fallback;
  }
}

function compact(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function groupBy(rows, keyName) {
  const grouped = new Map();
  for (const row of rows) {
    const rowsForKey = grouped.get(row[keyName]) ?? [];
    rowsForKey.push(row);
    grouped.set(row[keyName], rowsForKey);
  }
  return grouped;
}

function uniqueBy(rows, keyForRow) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = keyForRow(row);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</gu, "\\u003c")
    .replace(/>/gu, "\\u003e")
    .replace(/&/gu, "\\u0026")
    .replace(/\u2028/gu, "\\u2028")
    .replace(/\u2029/gu, "\\u2029");
}

function buildPayload(db) {
  const config = profileReviewConfig.get(profile.id) ?? {
    title: `${profile.label}人工审核`,
    uncertainPlaceIds: [],
    materials: [],
  };

  const eventRows = db.prepare(`
    SELECT e.*
    FROM events e
    WHERE json_extract(e.raw_json, '$.generator') = ?
      AND e.review_status = 'needs-review'
    ORDER BY e.time_start, e.title, e.id
  `).all(generatorId);
  const activeEventIds = new Set(eventRows.map((row) => row.id));

  const allEvidenceRows = db.prepare(`
    SELECT
      el.subject_id AS event_id,
      el.source_id,
      el.passage_id,
      el.mention_id,
      el.locator,
      el.quote,
      el.confidence,
      el.raw_json,
      COALESCE(sm.work_title, s.title) AS source_title,
      sm.book_title,
      sm.chapter_title,
      s.url AS source_url
    FROM evidence_links el
    LEFT JOIN source_mentions sm ON sm.id = el.mention_id
    LEFT JOIN sources s ON s.id = el.source_id
    WHERE el.subject_table = 'events'
      AND json_extract(el.raw_json, '$.generator') = ?
    ORDER BY el.subject_id, el.id
  `).all(generatorId);
  const evidenceRows = allEvidenceRows.filter((row) => activeEventIds.has(row.event_id));
  const evidenceByEvent = groupBy(evidenceRows, "event_id");
  const evidenceByCard = new Map();
  for (const row of allEvidenceRows) {
    const cardId = parseJson(row.raw_json).cardId;
    if (cardId && !evidenceByCard.has(cardId)) evidenceByCard.set(cardId, row);
  }

  const eventEntityRows = db.prepare(`
    SELECT
      ee.event_id,
      ee.entity_id,
      ee.role,
      ee.sort_order,
      e.entity_type,
      e.primary_label
    FROM event_entities ee
    JOIN entities e ON e.id = ee.entity_id
    WHERE json_extract(ee.raw_json, '$.generator') = ?
    ORDER BY ee.event_id, ee.sort_order, ee.entity_id
  `).all(generatorId).filter((row) => activeEventIds.has(row.event_id));
  const entitiesByEvent = groupBy(eventEntityRows, "event_id");

  const mergeTargetRows = db.prepare(`
    SELECT id, title, event_type, time_start, summary, review_status
    FROM events
    WHERE region_id = ?
      AND time_start BETWEEN ? AND ?
      AND review_status <> 'rejected'
      AND COALESCE(json_extract(raw_json, '$.generator'), '') <> ?
    ORDER BY time_start, title, id
  `).all(profile.regionId, profile.timeStart, profile.timeEnd, generatorId);
  const mergeTargetEntitiesByEvent = groupBy(db.prepare(`
    SELECT
      ee.event_id,
      e.entity_type,
      e.primary_label
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    JOIN entities e ON e.id = ee.entity_id
    WHERE ev.region_id = ?
      AND ev.time_start BETWEEN ? AND ?
      AND ev.review_status <> 'rejected'
      AND COALESCE(json_extract(ev.raw_json, '$.generator'), '') <> ?
    ORDER BY ee.event_id, ee.sort_order, ee.entity_id
  `).all(profile.regionId, profile.timeStart, profile.timeEnd, generatorId), "event_id");
  const mergeTargets = mergeTargetRows.map((row) => {
    const linkedEntities = mergeTargetEntitiesByEvent.get(row.id) ?? [];
    return {
      ...row,
      summary: compact(row.summary),
      people: linkedEntities
        .filter((item) => item.entity_type === "person")
        .map((item) => item.primary_label),
      places: linkedEntities
        .filter((item) => item.entity_type === "place")
        .map((item) => item.primary_label),
    };
  });
  const mergeTargetsByYear = groupBy(mergeTargets, "time_start");

  const events = eventRows.map((row) => {
    const raw = parseJson(row.raw_json);
    const linkedEntities = entitiesByEvent.get(row.id) ?? [];
    const evidence = (evidenceByEvent.get(row.id) ?? []).map((item) => ({
      sourceId: item.source_id,
      sourceTitle: compact(item.source_title),
      sourceSection: compact([item.book_title, item.chapter_title].filter(Boolean).join(" · ")),
      sourceUrl: item.source_url,
      passageId: item.passage_id,
      mentionId: item.mention_id,
      locator: compact(item.locator),
      quote: compact(item.quote),
      confidence: item.confidence,
      cardId: parseJson(item.raw_json).cardId ?? null,
    }));
    return {
      id: row.id,
      year: row.time_start,
      title: row.title,
      eventType: row.event_type,
      summary: compact(row.summary),
      confidence: row.confidence,
      reviewStatus: row.review_status,
      people: linkedEntities
        .filter((item) => item.entity_type === "person")
        .map((item) => ({ id: item.entity_id, label: item.primary_label, role: item.role })),
      places: linkedEntities
        .filter((item) => item.entity_type === "place")
        .map((item) => ({ id: item.entity_id, label: item.primary_label, role: item.role })),
      evidence,
      sourceCount: raw.sourceCount ?? new Set(evidence.map((item) => item.sourceId)).size,
      evidenceCount: evidence.length,
      anchorCardId: raw.anchorCardId ?? null,
      clusterIds: raw.clusterIds ?? [],
      mergeCandidates: (mergeTargetsByYear.get(row.time_start) ?? []).slice(0, 12),
    };
  });

  const personRows = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.summary,
      p.coverage_status,
      p.raw_json,
      e.id AS entity_id,
      e.review_status AS entity_review_status
    FROM persons p
    LEFT JOIN entities e ON e.id = 'person:' || p.id
    WHERE json_extract(p.raw_json, '$.generator') = ?
      AND json_extract(p.raw_json, '$.generatedFrom') = 'official-history-secondary-person-discovery'
      AND COALESCE(e.review_status, 'needs-review') = 'needs-review'
    ORDER BY p.name, p.id
  `).all(generatorId);
  const activePersonIds = new Set(personRows.map((row) => row.id));

  const aliasesByPerson = groupBy(db.prepare(`
    SELECT pa.person_id, pa.value, pa.type
    FROM person_aliases pa
    JOIN persons p ON p.id = pa.person_id
    WHERE json_extract(p.raw_json, '$.generator') = ?
    ORDER BY pa.person_id, pa.value
  `).all(generatorId), "person_id");

  const linkedEventsByPerson = groupBy(db.prepare(`
    SELECT
      substr(ee.entity_id, length('person:') + 1) AS person_id,
      ev.id AS event_id,
      ev.title,
      ev.time_start AS year,
      ee.role
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    WHERE ee.entity_id LIKE 'person:%'
      AND ev.review_status <> 'rejected'
    ORDER BY person_id, ev.time_start, ev.title
  `).all().filter((row) => activePersonIds.has(row.person_id)), "person_id");

  const allPeople = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.coverage_status,
      COALESCE(e.review_status, 'draft') AS review_status,
      p.raw_json
    FROM persons p
    LEFT JOIN entities e ON e.id = 'person:' || p.id
    ORDER BY p.name, p.id
  `).all();
  const allAliases = db.prepare(`
    SELECT person_id, value
    FROM person_aliases
    WHERE type <> 'source-variant'
    ORDER BY person_id, value
  `).all();
  const aliasesForAnyPerson = groupBy(allAliases, "person_id");
  const personNameIndex = new Map();
  for (const person of allPeople) {
    const names = new Set([person.name, ...(aliasesForAnyPerson.get(person.id) ?? []).map((item) => item.value)]);
    for (const name of names) {
      if (!name) continue;
      const matches = personNameIndex.get(name) ?? [];
      matches.push(person);
      personNameIndex.set(name, matches);
    }
  }

  const people = personRows.map((row) => {
    const raw = parseJson(row.raw_json);
    const aliases = (aliasesByPerson.get(row.id) ?? []).map((item) => item.value);
    const sourceRefs = uniqueBy(raw.sourceRefs ?? [], (item) => item.cardId ?? item.mentionId).map((item) => {
      const evidence = evidenceByCard.get(item.cardId);
      return {
        sourceId: item.sourceId,
        sourceTitle: item.sourceTitle,
        locator: item.locator,
        mentionId: item.mentionId,
        cardId: item.cardId,
        quote: compact(evidence?.quote),
        sourceUrl: evidence?.source_url ?? null,
      };
    });
    const nameMatches = uniqueBy(
      [row.name, ...aliases].flatMap((name) => personNameIndex.get(name) ?? []),
      (item) => item.id,
    )
      .filter((item) => item.id !== row.id)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        name: item.name,
        coverageStatus: item.coverage_status,
        reviewStatus: item.review_status,
        machineCandidate: parseJson(item.raw_json).generatedFrom === "official-history-secondary-person-discovery",
      }));
    return {
      id: row.id,
      entityId: row.entity_id,
      name: row.name,
      aliases,
      summary: compact(row.summary),
      coverageStatus: row.coverage_status,
      reviewStatus: row.entity_review_status,
      discoveryConfidence: raw.discoveryConfidence ?? "unknown",
      discoveryEvidence: raw.discoveryEvidence ?? "unknown",
      sourceRefs,
      linkedEvents: linkedEventsByPerson.get(row.id) ?? [],
      nameMatches,
    };
  });

  const uncertainEntityIds = config.uncertainPlaceIds.map((id) => `place:${id}`);
  const places = uncertainEntityIds.map((entityId) => {
    const row = db.prepare(`
      SELECT id, primary_label, summary, confidence, review_status, raw_json
      FROM entities
      WHERE id = ? AND entity_type = 'place'
    `).get(entityId);
    if (!row) {
      return {
        id: entityId,
        stablePlaceId: entityId.slice("place:".length),
        label: entityId,
        missing: true,
        aliases: [],
        mapFeatureNames: [],
        linkedEvents: [],
        evidence: [],
      };
    }
    const raw = parseJson(row.raw_json);
    const linkedEvents = db.prepare(`
      SELECT ev.id, ev.title, ev.time_start AS year, ee.role
      FROM event_entities ee
      JOIN events ev ON ev.id = ee.event_id
      WHERE ee.entity_id = ? AND ev.review_status <> 'rejected'
      ORDER BY ev.time_start, ev.title
    `).all(entityId);
    const placeEvidence = uniqueBy(
      linkedEvents.flatMap((event) => evidenceByEvent.get(event.id) ?? []),
      (item) => item.mention_id ?? item.passage_id,
    ).slice(0, 8).map((item) => ({
      sourceTitle: item.source_title,
      sourceUrl: item.source_url,
      locator: item.locator,
      quote: compact(item.quote),
    }));
    return {
      id: row.id,
      stablePlaceId: raw.stablePlaceId ?? entityId.slice("place:".length),
      label: row.primary_label,
      summary: compact(row.summary),
      confidence: row.confidence,
      reviewStatus: row.review_status,
      missing: false,
      aliases: raw.aliases ?? [],
      mapFeatureNames: raw.mapFeatureNames ?? [],
      linkedEvents,
      evidence: placeEvidence,
    };
  });

  return {
    schema: "chronoatlas.official-history-review.v1",
    generatedAt: new Date().toISOString(),
    database: path.relative(rootDir, dbPath).replaceAll("\\", "/"),
    profile: {
      id: profile.id,
      label: profile.label,
      regionId: profile.regionId,
      timeStart: profile.timeStart,
      timeEnd: profile.timeEnd,
      generatorId,
    },
    pageTitle: config.title,
    events,
    people,
    places,
    materials: config.materials,
    mergeTargets,
    counts: {
      events: events.length,
      people: people.length,
      places: places.length,
      materials: config.materials.length,
      evidence: evidenceRows.length,
    },
  };
}

function main() {
  if (!fs.existsSync(dbPath)) throw new Error(`Database not found: ${dbPath}`);
  if (!fs.existsSync(templatePath)) throw new Error(`Review template not found: ${templatePath}`);

  const db = new DatabaseSync(dbPath, { readOnly: true });
  let payload;
  try {
    payload = buildPayload(db);
  } finally {
    db.close();
  }

  const template = fs.readFileSync(templatePath, "utf8");
  const html = template
    .replaceAll("__PAGE_TITLE__", payload.pageTitle)
    .replace("__REVIEW_DATA_JSON__", () => safeJsonForHtml(payload));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, "utf8");

  console.log(JSON.stringify({
    output: path.relative(rootDir, outputPath).replaceAll("\\", "/"),
    profileId: profile.id,
    generatorId,
    counts: payload.counts,
  }, null, 2));
}

main();
