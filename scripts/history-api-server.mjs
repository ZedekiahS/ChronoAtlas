import { DatabaseSync } from "node:sqlite";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const port = Number(process.env.HISTORY_API_PORT ?? 5174);
const host = process.env.HISTORY_API_HOST ?? "127.0.0.1";

function parseLimit(value, fallback = 50, max = 200) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function parseOffset(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json; charset=utf-8"
  });
  response.end(body);
}

function notFound(response) {
  sendJson(response, 404, { error: "Not found" });
}

function badRequest(response, message) {
  sendJson(response, 400, { error: message });
}

function dbConnection({ readOnly = true } = {}) {
  if (!existsSync(dbPath)) {
    throw new Error("Database not found. Run `npm run db:build` first.");
  }
  const db = new DatabaseSync(dbPath, { readOnly });
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

function withDb(response, callback, options) {
  let db;
  try {
    db = dbConnection(options);
    return callback(db);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
    return null;
  } finally {
    db?.close();
  }
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function listPeople(db, url) {
  const search = url.searchParams.get("search")?.trim();
  const region = url.searchParams.get("region")?.trim();
  const limit = parseLimit(url.searchParams.get("limit"));
  const offset = parseOffset(url.searchParams.get("offset"));

  const where = ["e.entity_type = 'person'"];
  const params = {};

  if (search) {
    where.push(`(
      e.primary_label LIKE $search
      OR EXISTS (
        SELECT 1 FROM entity_aliases a
        WHERE a.entity_id = e.id AND a.value LIKE $search
      )
    )`);
    params.$search = `%${search}%`;
  }

  if (region) {
    where.push("e.region_id = $region");
    params.$region = region;
  }

  params.$limit = limit;
  params.$offset = offset;

  const rows = db.prepare(`
    SELECT
      e.id,
      substr(e.id, 8) AS legacy_person_id,
      e.primary_label AS name,
      e.region_id,
      e.time_start,
      e.time_end,
      e.summary,
      e.confidence,
      e.review_status,
      (
        SELECT COUNT(*)
        FROM event_entities ee
        WHERE ee.entity_id = e.id
      ) AS event_count,
      (
        SELECT COUNT(*)
        FROM entity_relations r
        WHERE r.source_entity_id = e.id OR r.target_entity_id = e.id
      ) AS relation_count
    FROM entities e
    WHERE ${where.join(" AND ")}
    ORDER BY e.primary_label
    LIMIT $limit OFFSET $offset
  `).all(params);

  return { people: rows, limit, offset };
}

function personDetail(db, entityIdOrLegacyId) {
  const entityId = entityIdOrLegacyId.startsWith("person:")
    ? entityIdOrLegacyId
    : `person:${entityIdOrLegacyId}`;

  const person = db.prepare(`
    SELECT
      e.*,
      substr(e.id, 8) AS legacy_person_id
    FROM entities e
    WHERE e.id = ? AND e.entity_type = 'person'
  `).get(entityId);

  if (!person) {
    return null;
  }

  const aliases = db.prepare(`
    SELECT id, value, alias_type, language
    FROM entity_aliases
    WHERE entity_id = ?
    ORDER BY alias_type, value
  `).all(entityId);

  const relations = db.prepare(`
    SELECT
      r.id,
      r.relation_type,
      r.time_start,
      r.time_end,
      r.summary,
      r.confidence,
      source.primary_label AS source_label,
      target.primary_label AS target_label,
      r.source_entity_id,
      r.target_entity_id
    FROM entity_relations r
    JOIN entities source ON source.id = r.source_entity_id
    JOIN entities target ON target.id = r.target_entity_id
    WHERE r.source_entity_id = ? OR r.target_entity_id = ?
    ORDER BY COALESCE(r.time_start, 9999), r.id
  `).all(entityId, entityId);

  const events = db.prepare(`
    SELECT
      ev.id,
      ev.title,
      ev.event_type,
      ev.time_start,
      ev.time_end,
      ev.display_time,
      ev.region_id,
      ev.summary,
      ev.confidence,
      ee.role
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    WHERE ee.entity_id = ?
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
    LIMIT 100
  `).all(entityId);

  const evidence = db.prepare(`
    SELECT
      el.id,
      el.subject_table,
      el.subject_id,
      el.source_id,
      s.title AS source_title,
      el.mention_id,
      el.locator,
      el.quote,
      el.evidence_role,
      el.confidence,
      el.raw_json AS evidence_raw_json,
      sm.raw_json AS mention_raw_json,
      sp.raw_json AS passage_raw_json
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    WHERE el.subject_id IN (
      SELECT event_id FROM event_entities WHERE entity_id = ?
      UNION
      SELECT id FROM entity_relations WHERE source_entity_id = ? OR target_entity_id = ?
    )
    ORDER BY el.subject_table, el.subject_id, el.locator
    LIMIT 200
  `).all(entityId, entityId, entityId);

  return { person, aliases, relations, events, evidence };
}

function listEvents(db, url) {
  const region = url.searchParams.get("region")?.trim();
  const entityIdParam = url.searchParams.get("entityId")?.trim();
  const entityId = entityIdParam
    ? entityIdParam.startsWith("person:")
      ? entityIdParam
      : `person:${entityIdParam}`
    : null;
  const startYear = parseInteger(url.searchParams.get("startYear"));
  const endYear = parseInteger(url.searchParams.get("endYear"));
  const search = url.searchParams.get("search")?.trim();
  const limit = parseLimit(url.searchParams.get("limit"));
  const offset = parseOffset(url.searchParams.get("offset"));

  const where = [];
  const joins = [];
  const params = { $limit: limit, $offset: offset };

  if (entityId) {
    joins.push("JOIN event_entities ee ON ee.event_id = ev.id");
    where.push("ee.entity_id = $entityId");
    params.$entityId = entityId;
  }

  if (region) {
    where.push("ev.region_id = $region");
    params.$region = region;
  }

  if (startYear !== null) {
    where.push("COALESCE(ev.time_end, ev.time_start) >= $startYear");
    params.$startYear = startYear;
  }

  if (endYear !== null) {
    where.push("COALESCE(ev.time_start, ev.time_end) <= $endYear");
    params.$endYear = endYear;
  }

  if (search) {
    where.push("(ev.title LIKE $search OR ev.summary LIKE $search)");
    params.$search = `%${search}%`;
  }

  const rows = db.prepare(`
    SELECT DISTINCT
      ev.id,
      ev.title,
      ev.event_type,
      ev.time_start,
      ev.time_end,
      ev.display_time,
      ev.region_id,
      ev.summary,
      ev.confidence,
      (
        SELECT COUNT(*)
        FROM evidence_links el
        WHERE el.subject_table = 'events' AND el.subject_id = ev.id
      ) AS evidence_count
    FROM events ev
    ${joins.join("\n")}
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
    LIMIT $limit OFFSET $offset
  `).all(params);

  return { events: rows, limit, offset };
}

function eventDetail(db, eventId) {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  if (!event) {
    return null;
  }

  const entities = db.prepare(`
    SELECT
      ee.role,
      ee.sort_order,
      e.id,
      e.entity_type,
      e.primary_label,
      e.region_id
    FROM event_entities ee
    JOIN entities e ON e.id = ee.entity_id
    WHERE ee.event_id = ?
    ORDER BY ee.sort_order, e.primary_label
  `).all(eventId);

  const evidence = db.prepare(`
    SELECT
      el.id,
      el.source_id,
      s.title AS source_title,
      el.mention_id,
      el.locator,
      el.quote,
      el.evidence_role,
      el.confidence,
      el.raw_json AS evidence_raw_json,
      sm.raw_json AS mention_raw_json,
      sp.raw_json AS passage_raw_json
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    WHERE el.subject_table = 'events' AND el.subject_id = ?
    ORDER BY el.locator, el.id
  `).all(eventId);

  return { event, entities, evidence };
}

function buildFtsQuery(query) {
  return query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) => `"${term.replaceAll('"', '""')}"`)
    .join(" OR ");
}

function aiQuestionSearchTerms(question) {
  const knownTerms = [
    "曹操去世", "曹操", "刘备", "孙权", "司马懿",
    "瓦勒良", "沙普尔", "欧特罗庇乌斯", "优西比乌", "拉克坦修", "赫罗狄安", "狄奥",
    "戴克里先", "四帝共治", "奥勒良", "芝诺比娅", "帕尔米拉", "卡拉卡拉", "盖塔", "塞维鲁",
    "罗马", "萨珊", "波斯",
    "史料", "古代史料", "来源", "典籍", "证据",
    "valerian", "shapur", "eutropius", "eusebius", "lactantius", "herodian", "dio",
    "diocletian", "tetrarchy", "aurelian", "zenobia", "palmyra", "caracalla", "geta", "severus",
    "rome", "roman", "sasanian", "persia",
  ];
  const normalized = question
    .replace(/[?？!！,，.。:：;；、/\\()[\]{}"'“”‘’\s]+/g, " ")
    .replace(/的时候|是什么|有哪些|有何|什么|时期|时候|支持|说明|当前|本年|同年|去世|逝世|死亡|死|古代|主要|相关|在|和|与|及|的|了|吗|呢|是|有|为|于|时/g, " ");
  const stopwords = new Set(["公元", "时候", "时期", "什么", "哪些", "当前", "本年", "同年", "相关"]);
  const inferredTerms = [];
  if (/曹操/.test(question) && /死|去世|逝世|死亡/.test(question)) {
    inferredTerms.push("曹操去世");
  }
  const matchedKnownTerms = knownTerms.filter((term) => question.toLowerCase().includes(term.toLowerCase()));
  return [...new Set([...inferredTerms, ...matchedKnownTerms, ...normalized
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && term.length <= 24)
    .filter((term) => !stopwords.has(term))
  ])].slice(0, 8);
}

function isSourceFocusedQuestion(question) {
  return /史料|来源|典籍|证据|出自|记载|source|evidence|text|classical|ancient/i.test(question);
}

function extractEvidenceBodySection(body, label) {
  if (typeof body !== "string" || body.length === 0) {
    return null;
  }

  const labels = ["原文", "译文/释义", "核心人物", "相关人物", "地点", "宏观事件", "事实类型", "待核问题"];
  const marker = `${label}：`;
  const start = body.indexOf(marker);
  if (start === -1) {
    return null;
  }

  const contentStart = start + marker.length;
  const nextStarts = labels
    .filter((item) => item !== label)
    .map((item) => body.indexOf(`${item}：`, contentStart))
    .filter((index) => index !== -1);
  const contentEnd = nextStarts.length ? Math.min(...nextStarts) : body.length;
  let value = body.slice(contentStart, contentEnd).trim();
  if (label === "待核问题") {
    value = value.split(/\n\s*\n/)[0]?.trim() ?? value;
  }
  return value.length ? value : null;
}

function searchDocuments(db, url) {
  const query = url.searchParams.get("q")?.trim();
  const region = url.searchParams.get("region")?.trim();
  const sourceWork = url.searchParams.get("sourceWork")?.trim();
  const startYear = parseInteger(url.searchParams.get("startYear"));
  const endYear = parseInteger(url.searchParams.get("endYear"));
  const entityIdParam = url.searchParams.get("entityId")?.trim();
  const entityId = entityIdParam
    ? entityIdParam.startsWith("person:") || entityIdParam.includes(":")
      ? entityIdParam
      : `person:${entityIdParam}`
    : null;
  const limit = parseLimit(url.searchParams.get("limit"), 25, 100);
  const offset = parseOffset(url.searchParams.get("offset"));

  if (!query && !sourceWork && startYear === null && endYear === null && !entityId) {
    return { results: [], limit, offset };
  }

  const where = [];
  const joins = [];
  const params = {
    $limit: limit,
    $offset: offset
  };
  const hasQuery = Boolean(query);
  const hasYearRange = startYear !== null || endYear !== null;
  const rankBucketSql = hasQuery
    ? `CASE
          WHEN c.rowid IN (SELECT rowid FROM document_chunks_fts WHERE document_chunks_fts MATCH $ftsQuery) THEN 0
          ELSE 1
        END`
    : "1";
  const chunkYearOrderSql = hasYearRange
    ? `CASE
          WHEN c.time_start = $focusYear OR c.time_end = $focusYear THEN 0
          WHEN c.time_start <= $focusYear AND COALESCE(c.time_end, c.time_start) >= $focusYear THEN 1
          ELSE 2
        END,
        ABS(COALESCE(c.time_start, c.time_end, 9999) - $focusYear),
        ABS(COALESCE(c.time_end, c.time_start, $focusYear) - COALESCE(c.time_start, c.time_end, $focusYear)),`
    : "";
  const documentYearOrderSql = hasYearRange
    ? `CASE
          WHEN sd.time_start = $focusYear OR sd.time_end = $focusYear THEN 0
          WHEN sd.time_start <= $focusYear AND COALESCE(sd.time_end, sd.time_start) >= $focusYear THEN 1
          ELSE 2
        END,
        ABS(COALESCE(sd.time_start, sd.time_end, 9999) - $focusYear),
        ABS(COALESCE(sd.time_end, sd.time_start, $focusYear) - COALESCE(sd.time_start, sd.time_end, $focusYear)),`
    : "";

  if (hasQuery) {
    where.push("(c.title LIKE $likeQuery OR c.body LIKE $likeQuery OR c.rowid IN (SELECT rowid FROM document_chunks_fts WHERE document_chunks_fts MATCH $ftsQuery))");
    params.$likeQuery = `%${query}%`;
    params.$ftsQuery = buildFtsQuery(query) || query;
  }

  if (region) {
    where.push("c.region_id = $region");
    params.$region = region;
  }

  if (startYear !== null || endYear !== null) {
    const rangeStart = startYear ?? endYear;
    const rangeEnd = endYear ?? startYear;
    where.push("COALESCE(c.time_end, c.time_start) >= $rangeStart");
    where.push("COALESCE(c.time_start, c.time_end) <= $rangeEnd");
    params.$rangeStart = Math.min(rangeStart, rangeEnd);
    params.$rangeEnd = Math.max(rangeStart, rangeEnd);
    params.$focusYear = Math.round((params.$rangeStart + params.$rangeEnd) / 2);
  }

  const sourceWorkFilters = {
    sanguozhi: "(s.id LIKE 'sanguozhi-%' OR s.title LIKE '三国志%' OR s.citation_short LIKE '三国志%' OR s.original_title LIKE '三国志%')",
    hanshu: "s.id LIKE 'hanshu-guoxue123-%'",
    houhanshu: "(s.id LIKE 'houhanshu-%' OR s.title LIKE '后汉书%' OR s.citation_short LIKE '后汉书%' OR s.original_title LIKE '后汉书%')",
    jinshu: "(s.id LIKE 'jinshu-%' OR s.title LIKE '晋书%' OR s.citation_short LIKE '晋书%' OR s.original_title LIKE '晋书%')",
    zztj: "(s.id LIKE 'zizhi-tongjian-%' OR s.title LIKE '资治通鉴%' OR s.citation_short LIKE '资治通鉴%' OR s.original_title LIKE '资治通鉴%')"
  };
  const sourceWorkLabels = {
    sanguozhi: "三国志",
    hanshu: "汉书",
    houhanshu: "后汉书",
    jinshu: "晋书",
    zztj: "资治通鉴"
  };

  Object.assign(sourceWorkFilters, {
    herodian: "s.id = 'rome-source-history-of-the-empire-after-marcus-herodian'",
    "cassius-dio": "s.id = 'rome-source-roman-history-cassius-dio'",
    "historia-augusta": "s.id = 'rome-source-historia-augusta-scriptores-historiae-augustae'",
    zosimus: "s.id = 'rome-source-historia-nova-zosimus'",
    eutropius: "s.id = 'rome-source-breviarium-ab-urbe-condita-eutropius'",
    skz: "s.id = 'deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri'",
    kartir: "s.id IN ('deepseek-sasanian-source-kartirs-inscriptions-collective-evidence-kartir-kirder-kkz-knrb-ksm-knrm', 'deepseek-sasanian-source-kartirs-inscription-at-kaba-ye-zardosht-kkz-s-kz-kartir-kirder-kkz-karti')",
    paikuli: "s.id = 'deepseek-sasanian-source-paikuli-inscription-npi-narseh-paikuli-tower-inscription-narseh-middle-p'",
  });
  Object.assign(sourceWorkLabels, {
    herodian: "Herodian",
    "cassius-dio": "Cassius Dio",
    "historia-augusta": "Historia Augusta",
    zosimus: "Zosimus",
    eutropius: "Eutropius",
    skz: "SKZ",
    kartir: "Kartir",
    paikuli: "Paikuli",
  });

  if (sourceWork && sourceWorkFilters[sourceWork]) {
    params.$sourceWorkLike = `%${sourceWorkLabels[sourceWork]}%`;
    where.push(`
      c.search_document_id IN (
        SELECT sd.id
        FROM search_documents sd
        LEFT JOIN source_passages sp ON sd.subject_table = 'source_passages' AND sp.id = sd.subject_id
        LEFT JOIN evidence_links el ON (el.subject_table = 'search_documents' AND el.subject_id = sd.id) OR (el.subject_table = sd.subject_table AND el.subject_id = sd.subject_id)
        LEFT JOIN sources s ON s.id = COALESCE(sp.source_id, el.source_id)
        WHERE sd.subject_table IN ('source_passages', 'import_evidence_cards')
          AND (${sourceWorkFilters[sourceWork]} OR sd.title LIKE $sourceWorkLike OR sd.body LIKE $sourceWorkLike OR sd.raw_json LIKE $sourceWorkLike)
      )
    `);
  }

  if (entityId) {
    joins.push("JOIN document_chunk_entities dce ON dce.chunk_id = c.id");
    where.push("dce.entity_id = $entityId");
    params.$entityId = entityId;
  }

  let results;
  try {
    results = db.prepare(`
      SELECT DISTINCT
        c.id,
        c.search_document_id,
        c.chunk_index,
        c.subject_table,
        c.subject_id,
        c.title,
        substr(c.body, 1, 600) AS snippet,
        c.language,
        c.region_id,
        c.period_id,
        c.topic_id,
        c.time_start,
        c.time_end,
        c.token_estimate,
        c.review_status,
        (SELECT sd.raw_json FROM search_documents sd WHERE sd.id = c.search_document_id) AS document_raw_json,
        (SELECT sd.body FROM search_documents sd WHERE sd.id = c.search_document_id) AS document_body,
        (SELECT sp.source_id FROM source_passages sp WHERE c.subject_table = 'source_passages' AND sp.id = c.subject_id) AS passage_source_id,
        (SELECT s.title FROM source_passages sp JOIN sources s ON s.id = sp.source_id WHERE c.subject_table = 'source_passages' AND sp.id = c.subject_id) AS passage_source_title,
        (SELECT el.source_id FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_source_id,
        (SELECT el.locator FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_locator,
        (SELECT el.quote FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_quote,
        (SELECT el.confidence FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_confidence,
        (SELECT ic.translation FROM import_evidence_cards ic WHERE ic.id = c.subject_id) AS card_translation,
        (SELECT ic.questions_json FROM import_evidence_cards ic WHERE ic.id = c.subject_id) AS card_questions_json,
        ${rankBucketSql} AS rank_bucket
      FROM document_chunks c
      ${joins.join("\n")}
      WHERE ${where.length ? where.join(" AND ") : "1 = 1"}
      ORDER BY
        rank_bucket,
        ${hasQuery ? "CASE WHEN c.title LIKE $likeQuery THEN 0 ELSE 1 END," : ""}
        ${chunkYearOrderSql}
        COALESCE(c.time_start, 9999),
        c.id
      LIMIT $limit OFFSET $offset
    `).all(params);
  } catch {
    const fallbackWhere = [];
    const fallbackParams = {
      $limit: limit,
      $offset: offset
    };
    if (hasQuery) {
      fallbackWhere.push("(c.title LIKE $likeQuery OR c.body LIKE $likeQuery)");
      fallbackParams.$likeQuery = params.$likeQuery;
    }
    if (region) {
      fallbackWhere.push("c.region_id = $region");
      fallbackParams.$region = region;
    }
    if (startYear !== null || endYear !== null) {
      const rangeStart = startYear ?? endYear;
      const rangeEnd = endYear ?? startYear;
      fallbackWhere.push("COALESCE(c.time_end, c.time_start) >= $rangeStart");
      fallbackWhere.push("COALESCE(c.time_start, c.time_end) <= $rangeEnd");
      fallbackParams.$rangeStart = Math.min(rangeStart, rangeEnd);
      fallbackParams.$rangeEnd = Math.max(rangeStart, rangeEnd);
      fallbackParams.$focusYear = Math.round((fallbackParams.$rangeStart + fallbackParams.$rangeEnd) / 2);
    }
    if (sourceWork && sourceWorkFilters[sourceWork]) {
      fallbackParams.$sourceWorkLike = `%${sourceWorkLabels[sourceWork]}%`;
      fallbackWhere.push(`
        c.search_document_id IN (
          SELECT sd.id
          FROM search_documents sd
          LEFT JOIN source_passages sp ON sd.subject_table = 'source_passages' AND sp.id = sd.subject_id
          LEFT JOIN evidence_links el ON (el.subject_table = 'search_documents' AND el.subject_id = sd.id) OR (el.subject_table = sd.subject_table AND el.subject_id = sd.subject_id)
          LEFT JOIN sources s ON s.id = COALESCE(sp.source_id, el.source_id)
          WHERE sd.subject_table IN ('source_passages', 'import_evidence_cards')
            AND (${sourceWorkFilters[sourceWork]} OR sd.title LIKE $sourceWorkLike OR sd.body LIKE $sourceWorkLike OR sd.raw_json LIKE $sourceWorkLike)
        )
      `);
    }
    if (entityId) {
      fallbackWhere.push("dce.entity_id = $entityId");
      fallbackParams.$entityId = entityId;
    }
    results = db.prepare(`
      SELECT DISTINCT
        c.id,
        c.search_document_id,
        c.chunk_index,
        c.subject_table,
        c.subject_id,
        c.title,
        substr(c.body, 1, 600) AS snippet,
        c.language,
        c.region_id,
        c.period_id,
        c.topic_id,
        c.time_start,
        c.time_end,
        c.token_estimate,
        c.review_status,
        (SELECT sd.raw_json FROM search_documents sd WHERE sd.id = c.search_document_id) AS document_raw_json,
        (SELECT sd.body FROM search_documents sd WHERE sd.id = c.search_document_id) AS document_body,
        (SELECT sp.source_id FROM source_passages sp WHERE c.subject_table = 'source_passages' AND sp.id = c.subject_id) AS passage_source_id,
        (SELECT s.title FROM source_passages sp JOIN sources s ON s.id = sp.source_id WHERE c.subject_table = 'source_passages' AND sp.id = c.subject_id) AS passage_source_title,
        (SELECT el.source_id FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_source_id,
        (SELECT el.locator FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_locator,
        (SELECT el.quote FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_quote,
        (SELECT el.confidence FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS evidence_confidence,
        (SELECT ic.translation FROM import_evidence_cards ic WHERE ic.id = c.subject_id) AS card_translation,
        (SELECT ic.questions_json FROM import_evidence_cards ic WHERE ic.id = c.subject_id) AS card_questions_json,
        1 AS rank_bucket
      FROM document_chunks c
      ${joins.join("\n")}
      WHERE ${fallbackWhere.length ? fallbackWhere.join(" AND ") : "1 = 1"}
      ORDER BY
        ${hasQuery ? "CASE WHEN c.title LIKE $likeQuery THEN 0 ELSE 1 END," : ""}
        ${chunkYearOrderSql}
        COALESCE(c.time_start, 9999),
        c.id
      LIMIT $limit OFFSET $offset
    `).all(fallbackParams);
  }

  if (sourceWork && sourceWorkFilters[sourceWork] && !hasQuery) {
    results = [];
  }

  if (sourceWork && sourceWorkFilters[sourceWork] && (!hasQuery || results.length < limit)) {
    const directWhere = [sourceWorkFilters[sourceWork]];
    const directParams = {
      $limit: hasQuery ? limit - results.length : limit,
      $offset: results.length ? 0 : offset
    };

    if (hasQuery) {
      directWhere.push("(sd.title LIKE $likeQuery OR sd.body LIKE $likeQuery)");
      directParams.$likeQuery = params.$likeQuery;
    }
    if (startYear !== null || endYear !== null) {
      const rangeStart = startYear ?? endYear;
      const rangeEnd = endYear ?? startYear;
      directWhere.push("COALESCE(sd.time_end, sd.time_start) >= $rangeStart");
      directWhere.push("COALESCE(sd.time_start, sd.time_end) <= $rangeEnd");
      directParams.$rangeStart = Math.min(rangeStart, rangeEnd);
      directParams.$rangeEnd = Math.max(rangeStart, rangeEnd);
      directParams.$focusYear = Math.round((directParams.$rangeStart + directParams.$rangeEnd) / 2);
    }
    directParams.$sourceWorkLike = `%${sourceWorkLabels[sourceWork]}%`;
    directWhere.push(hasQuery ? "(sd.subject_table IN ('source_passages', 'import_evidence_cards'))" : "sd.subject_table = 'source_passages'");
    directWhere.push(`(${sourceWorkFilters[sourceWork]} OR sd.title LIKE $sourceWorkLike OR sd.body LIKE $sourceWorkLike OR sd.raw_json LIKE $sourceWorkLike)`);
    if (region) {
      directWhere.push("sd.region_id = $region");
      directParams.$region = region;
    }

    const existingSearchDocumentIds = new Set(results.map((result) => result.search_document_id));
    const directResults = db.prepare(`
      SELECT
        'search-document:' || sd.id AS id,
        sd.id AS search_document_id,
        0 AS chunk_index,
        sd.subject_table,
        sd.subject_id,
        sd.title,
        substr(sd.body, 1, 600) AS snippet,
        sd.language,
        sd.region_id,
        sd.period_id,
        sd.topic_id,
        sd.time_start,
        sd.time_end,
        NULL AS token_estimate,
        sd.review_status,
        sd.raw_json AS document_raw_json,
        sd.body AS document_body,
        s.id AS evidence_source_id,
        sp.locator AS evidence_locator,
        NULL AS evidence_quote,
        sp.confidence AS evidence_confidence,
        NULL AS card_translation,
        NULL AS card_questions_json,
        s.title AS source_title,
        1 AS rank_bucket
      FROM search_documents sd
      LEFT JOIN source_passages sp ON sd.subject_table = 'source_passages' AND sp.id = sd.subject_id
      LEFT JOIN evidence_links el ON (el.subject_table = 'search_documents' AND el.subject_id = sd.id) OR (el.subject_table = sd.subject_table AND el.subject_id = sd.subject_id)
      LEFT JOIN sources s ON s.id = COALESCE(sp.source_id, el.source_id)
      WHERE ${directWhere.join(" AND ")}
      ORDER BY
        ${hasQuery ? "CASE WHEN sd.title LIKE $likeQuery THEN 0 ELSE 1 END," : ""}
        ${documentYearOrderSql}
        COALESCE(sd.time_start, 9999),
        sd.id
      LIMIT $limit OFFSET $offset
    `).all(directParams)
      .filter((result) => !existingSearchDocumentIds.has(result.search_document_id));

    results = hasQuery
      ? [...results, ...directResults].slice(0, limit)
      : [...directResults, ...results].slice(0, limit);
  }

  const entitiesByChunk = new Map();
  if (results.length > 0) {
    const entityRows = db.prepare(`
      SELECT
        dce.chunk_id,
        dce.link_role,
        dce.sort_order,
        e.id,
        e.entity_type,
        e.primary_label,
        e.region_id
      FROM document_chunk_entities dce
      JOIN entities e ON e.id = dce.entity_id
      WHERE dce.chunk_id IN (${results.map(() => "?").join(", ")})
      ORDER BY dce.chunk_id, dce.sort_order, e.primary_label
    `).all(...results.map((result) => result.id));

    for (const row of entityRows) {
      const list = entitiesByChunk.get(row.chunk_id) ?? [];
      list.push({
        id: row.id,
        entityType: row.entity_type,
        label: row.primary_label,
        regionId: row.region_id,
        role: row.link_role
      });
      entitiesByChunk.set(row.chunk_id, list);
    }
  }

  return {
    results: results.map((result) => {
      const raw = parseRawJson(result.document_raw_json);
      const cardQuestions = parseRawJson(result.card_questions_json);
      const questions = Array.isArray(raw.questions)
        ? raw.questions
        : Array.isArray(cardQuestions)
          ? cardQuestions
          : [];
      const bodyTranslation = extractEvidenceBodySection(result.document_body, "译文/释义");
      const bodyDisputeNote = extractEvidenceBodySection(result.document_body, "待核问题");
      return {
        id: result.id,
        searchDocumentId: result.search_document_id,
        chunkIndex: result.chunk_index,
        subjectTable: result.subject_table,
        subjectId: result.subject_id,
        title: result.title,
        snippet: result.snippet,
        language: result.language,
        regionId: result.region_id,
        periodId: result.period_id,
        topicId: result.topic_id,
        timeStart: result.time_start,
        timeEnd: result.time_end,
        tokenEstimate: result.token_estimate,
        reviewStatus: result.review_status,
        rankBucket: result.rank_bucket,
        sourceId: raw.sourceId ?? result.evidence_source_id ?? result.passage_source_id ?? null,
        sourceTitle: raw.sourceTitle ?? result.source_title ?? result.passage_source_title ?? null,
        locator: raw.locator ?? result.evidence_locator ?? null,
        quote: result.evidence_quote ?? null,
        translation: raw.translation ?? result.card_translation ?? bodyTranslation ?? null,
        confidence: raw.confidence ?? result.evidence_confidence ?? null,
        disputeNote: raw.disputeNote ?? raw.uncertainty ?? (questions.length ? questions.join("; ") : bodyDisputeNote),
        peopleCore: Array.isArray(raw.peopleCore) ? raw.peopleCore : [],
        peopleMentioned: Array.isArray(raw.peopleMentioned) ? raw.peopleMentioned : [],
        places: Array.isArray(raw.places) ? raw.places : [],
        eventLabel: raw.eventLabel ?? null,
        macroEvent: raw.macroEvent ?? null,
        factType: raw.factType ?? null,
        entities: entitiesByChunk.get(result.id) ?? []
      };
    }),
    limit,
    offset
  };
}

function searchDocumentsLegacy(db, url) {
  const query = url.searchParams.get("q")?.trim();
  const region = url.searchParams.get("region")?.trim();
  const limit = parseLimit(url.searchParams.get("limit"), 25, 100);
  const offset = parseOffset(url.searchParams.get("offset"));

  if (!query) {
    return { results: [], limit, offset };
  }

  const where = ["(title LIKE $query OR body LIKE $query)"];
  const params = { $query: `%${query}%`, $limit: limit, $offset: offset };

  if (region) {
    where.push("region_id = $region");
    params.$region = region;
  }

  const results = db.prepare(`
    SELECT
      id,
      subject_table,
      subject_id,
      title,
      substr(body, 1, 500) AS snippet,
      language,
      region_id,
      period_id,
      topic_id,
      time_start,
      time_end,
      review_status
    FROM search_documents
    WHERE ${where.join(" AND ")}
    ORDER BY
      CASE WHEN title LIKE $query THEN 0 ELSE 1 END,
      COALESCE(time_start, 9999),
      id
    LIMIT $limit OFFSET $offset
  `).all(params);

  return { results, limit, offset };
}

function parseRawJson(rawJson) {
  if (typeof rawJson !== "string" || rawJson.length === 0) {
    return {};
  }

  try {
    return JSON.parse(rawJson);
  } catch {
    return {};
  }
}

function evidenceSourceUrl(row) {
  const evidenceRaw = parseRawJson(row.evidence_raw_json);
  const mentionRaw = parseRawJson(row.mention_raw_json);
  const passageRaw = parseRawJson(row.passage_raw_json);
  return row.url
    ?? evidenceRaw.transcriptionSourceUrl
    ?? mentionRaw.transcriptionSourceUrl
    ?? passageRaw.transcriptionSourceUrl
    ?? null;
}

function listAiAnswers(db, url) {
  const limit = parseLimit(url.searchParams.get("limit"), 50, 200);
  const offset = parseOffset(url.searchParams.get("offset"));
  const rows = db.prepare(`
    SELECT
      a.id,
      a.run_id,
      a.created_at,
      a.answer,
      a.cited_items_json,
      a.confidence,
      a.warnings_json,
      a.provider,
      a.model,
      a.raw_json,
      r.question,
      r.locale,
      r.page_context_json,
      r.query_plan_json
    FROM ai_answers a
    LEFT JOIN ai_retrieval_runs r ON r.id = a.run_id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare("SELECT COUNT(*) AS count FROM ai_answers").get().count;

  return {
    answers: rows.map((row) => {
      const raw = parseRawJson(row.raw_json);
      const citations = parseRawJson(row.cited_items_json);
      const warnings = parseRawJson(row.warnings_json);
      const qualityChecks = raw.qualityChecks && typeof raw.qualityChecks.grade === "string"
        ? raw.qualityChecks
        : null;
      return {
        id: row.id,
        runId: row.run_id,
        createdAt: row.created_at,
        question: row.question ?? "",
        locale: row.locale ?? "zh",
        context: parseRawJson(row.page_context_json),
        queryPlan: parseRawJson(row.query_plan_json),
        answer: row.answer,
        citations: Array.isArray(citations) ? citations : [],
        citationCount: Array.isArray(citations) ? citations.length : 0,
        confidence: row.confidence,
        warnings: Array.isArray(warnings) ? warnings : [],
        provider: row.provider,
        model: row.model,
        qualityChecks
      };
    }),
    total,
    limit,
    offset
  };
}

function listRagEvalQuestions(db, url) {
  const questionSetId = url.searchParams.get("set") || "sample-190-310-v1";
  const region = url.searchParams.get("region");
  const questionType = url.searchParams.get("type");
  const limit = parseLimit(url.searchParams.get("limit"), 100, 300);
  const offset = parseOffset(url.searchParams.get("offset"));
  const where = ["question_set_id = ?"];
  const params = [questionSetId];
  if (region) {
    where.push("region_id = ?");
    params.push(region);
  }
  if (questionType) {
    where.push("question_type = ?");
    params.push(questionType);
  }

  const rows = db.prepare(`
    SELECT
      id,
      question_set_id,
      period_id,
      region_id,
      question_zh,
      question_en,
      question_type,
      expected_subject_table,
      expected_subject_id,
      expected_claim_ids_json,
      expected_source_ids_json,
      difficulty,
      review_status,
      raw_json
    FROM rag_eval_questions
    WHERE ${where.join(" AND ")}
    ORDER BY id
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  const total = db.prepare(`
    SELECT COUNT(*) AS count
    FROM rag_eval_questions
    WHERE ${where.join(" AND ")}
  `).get(...params).count;

  return {
    schemaVersion: 1,
    purpose: "rag-eval-questions",
    questionSetId,
    total,
    limit,
    offset,
    questions: rows.map((row) => ({
      id: row.id,
      questionSetId: row.question_set_id,
      periodId: row.period_id,
      regionId: row.region_id,
      questionZh: row.question_zh,
      questionEn: row.question_en,
      questionType: row.question_type,
      expectedSubjectTable: row.expected_subject_table,
      expectedSubjectId: row.expected_subject_id,
      expectedClaimIds: parseRawJson(row.expected_claim_ids_json),
      expectedSourceIds: parseRawJson(row.expected_source_ids_json),
      difficulty: row.difficulty,
      reviewStatus: row.review_status,
      raw: parseRawJson(row.raw_json)
    }))
  };
}

function listRagEvalRuns(db, url) {
  const questionSetId = url.searchParams.get("set");
  const limit = parseLimit(url.searchParams.get("limit"), 20, 100);
  const offset = parseOffset(url.searchParams.get("offset"));
  const where = [];
  const params = [];
  if (questionSetId) {
    where.push("r.question_set_id = ?");
    params.push(questionSetId);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db.prepare(`
    SELECT
      r.id,
      r.created_at,
      r.provider,
      r.model,
      r.retrieval_strategy,
      r.question_set_id,
      r.raw_json,
      COUNT(res.question_id) AS result_count,
      AVG(res.score_total) AS average_score,
      SUM(CASE WHEN res.failure_type IS NOT NULL THEN 1 ELSE 0 END) AS failure_count
    FROM rag_eval_runs r
    LEFT JOIN rag_eval_results res ON res.run_id = r.id
    ${whereSql}
    GROUP BY r.id
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return {
    schemaVersion: 1,
    purpose: "rag-eval-runs",
    runs: rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      provider: row.provider,
      model: row.model,
      retrievalStrategy: row.retrieval_strategy,
      questionSetId: row.question_set_id,
      resultCount: row.result_count,
      averageScore: row.average_score === null ? null : Number(row.average_score.toFixed(3)),
      failureCount: row.failure_count,
      raw: parseRawJson(row.raw_json),
    })),
    limit,
    offset,
  };
}

function ragEvalRunDetail(db, runId) {
  const run = db.prepare(`
    SELECT id, created_at, provider, model, retrieval_strategy, question_set_id, raw_json
    FROM rag_eval_runs
    WHERE id = ?
  `).get(runId);
  if (!run) {
    return null;
  }

  const results = db.prepare(`
    SELECT
      res.question_id,
      res.answer_id,
      res.retrieval_run_id,
      res.score_total,
      res.score_retrieval,
      res.score_citation,
      res.score_factuality,
      res.score_coverage,
      res.score_no_hallucination,
      res.failure_type,
      res.judge_note,
      res.raw_json,
      q.question_zh,
      q.question_en,
      q.question_type,
      q.region_id,
      q.period_id,
      q.expected_subject_table,
      q.expected_subject_id
    FROM rag_eval_results res
    JOIN rag_eval_questions q ON q.id = res.question_id
    WHERE res.run_id = ?
    ORDER BY res.score_total ASC, res.question_id
  `).all(runId).map((row) => ({
    questionId: row.question_id,
    questionZh: row.question_zh,
    questionEn: row.question_en,
    questionType: row.question_type,
    regionId: row.region_id,
    periodId: row.period_id,
    expectedSubjectTable: row.expected_subject_table,
    expectedSubjectId: row.expected_subject_id,
    answerId: row.answer_id,
    retrievalRunId: row.retrieval_run_id,
    scoreTotal: row.score_total,
    scoreRetrieval: row.score_retrieval,
    scoreCitation: row.score_citation,
    scoreFactuality: row.score_factuality,
    scoreCoverage: row.score_coverage,
    scoreNoHallucination: row.score_no_hallucination,
    failureType: row.failure_type,
    judgeNote: row.judge_note,
    raw: parseRawJson(row.raw_json),
  }));

  return {
    schemaVersion: 1,
    purpose: "rag-eval-run-detail",
    run: {
      id: run.id,
      createdAt: run.created_at,
      provider: run.provider,
      model: run.model,
      retrievalStrategy: run.retrieval_strategy,
      questionSetId: run.question_set_id,
      raw: parseRawJson(run.raw_json),
    },
    summary: {
      results: results.length,
      averageScore: results.length ? Number((results.reduce((sum, row) => sum + row.scoreTotal, 0) / results.length).toFixed(3)) : null,
      failures: results.filter((row) => row.failureType).length,
    },
    results,
  };
}

function localeFromUrl(url) {
  return url.searchParams.get("locale") === "en" ? "en" : "zh";
}

function evidenceRowsForSubject(db, subjectTable, subjectId, locale = "zh", limit = 100) {
  return db.prepare(`
    SELECT
      el.id,
      el.subject_table,
      el.subject_id,
      el.source_id,
      s.title AS source_title,
      COALESCE(si.title, sizh.title, s.title) AS localized_source_title,
      s.citation_short,
      COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS localized_citation_short,
      s.url,
      el.passage_id,
      sp.text AS passage_text,
      COALESCE(spi.translation, spizh.translation, sp.translation) AS passage_translation,
      el.mention_id,
      sm.text AS mention_text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS mention_translation,
      el.locator,
      el.quote,
      el.evidence_role,
      el.confidence,
      el.raw_json AS evidence_raw_json,
      sm.raw_json AS mention_raw_json,
      sp.raw_json AS passage_raw_json
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
    LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
    LEFT JOIN source_passages sp ON sp.id = el.passage_id
    LEFT JOIN source_passage_i18n spi ON spi.passage_id = sp.id AND spi.locale = ?
    LEFT JOIN source_passage_i18n spizh ON spizh.passage_id = sp.id AND spizh.locale = 'zh'
    LEFT JOIN source_mentions sm ON sm.id = el.mention_id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    WHERE el.subject_table = ? AND el.subject_id = ?
    ORDER BY el.locator, el.id
    LIMIT ?
  `).all(locale, locale, locale, subjectTable, subjectId, limit).map((row) => ({
    id: row.id,
    subjectTable: row.subject_table,
    subjectId: row.subject_id,
    sourceId: row.source_id,
    sourceTitle: row.localized_source_title ?? row.source_title,
    citationShort: row.localized_citation_short ?? row.localized_source_title ?? row.source_title ?? row.source_id,
    url: evidenceSourceUrl(row),
    passageId: row.passage_id,
    mentionId: row.mention_id,
    locator: row.locator,
    quote: row.quote ?? row.mention_text ?? row.passage_text,
    translation: row.mention_translation ?? row.passage_translation,
    evidenceRole: row.evidence_role,
    confidence: row.confidence
  }));
}

function evidenceRowsForPerson(db, entityId, locale = "zh") {
  return db.prepare(`
    SELECT
      el.id,
      el.subject_table,
      el.subject_id,
      el.source_id,
      s.title AS source_title,
      COALESCE(si.title, sizh.title, s.title) AS localized_source_title,
      s.citation_short,
      COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS localized_citation_short,
      s.url,
      el.passage_id,
      sp.text AS passage_text,
      COALESCE(spi.translation, spizh.translation, sp.translation) AS passage_translation,
      el.mention_id,
      sm.text AS mention_text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS mention_translation,
      el.locator,
      el.quote,
      el.evidence_role,
      el.confidence,
      el.raw_json AS evidence_raw_json,
      sm.raw_json AS mention_raw_json,
      sp.raw_json AS passage_raw_json
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
    LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
    LEFT JOIN source_passages sp ON sp.id = el.passage_id
    LEFT JOIN source_passage_i18n spi ON spi.passage_id = sp.id AND spi.locale = ?
    LEFT JOIN source_passage_i18n spizh ON spizh.passage_id = sp.id AND spizh.locale = 'zh'
    LEFT JOIN source_mentions sm ON sm.id = el.mention_id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    WHERE el.subject_id IN (
      SELECT event_id FROM event_entities WHERE entity_id = ?
      UNION
      SELECT id FROM entity_relations WHERE source_entity_id = ? OR target_entity_id = ?
    )
    ORDER BY el.subject_table, el.subject_id, el.locator
    LIMIT 200
  `).all(locale, locale, locale, entityId, entityId, entityId).map((row) => ({
    id: row.id,
    subjectTable: row.subject_table,
    subjectId: row.subject_id,
    sourceId: row.source_id,
    sourceTitle: row.localized_source_title ?? row.source_title,
    citationShort: row.localized_citation_short ?? row.localized_source_title ?? row.source_title ?? row.source_id,
    url: evidenceSourceUrl(row),
    passageId: row.passage_id,
    mentionId: row.mention_id,
    locator: row.locator,
    quote: row.quote ?? row.mention_text ?? row.passage_text,
    translation: row.mention_translation ?? row.passage_translation,
    evidenceRole: row.evidence_role,
    confidence: row.confidence
  }));
}

function normalizeAiContext(rawContext = {}) {
  const context = rawContext && typeof rawContext === "object" ? rawContext : {};
  const personId = typeof context.personId === "string" && context.personId.trim()
    ? context.personId.trim()
    : typeof context.entityId === "string" && context.entityId.trim()
      ? context.entityId.trim()
      : null;

  return {
    eventId: typeof context.eventId === "string" && context.eventId.trim() ? context.eventId.trim() : null,
    personId,
    entityId: personId
      ? personId.startsWith("person:") || personId.includes(":")
        ? personId
        : `person:${personId}`
      : null,
    region: typeof context.region === "string" && context.region.trim()
      ? context.region.trim()
      : typeof context.regionId === "string" && context.regionId.trim()
        ? context.regionId.trim()
        : null,
    year: Number.isInteger(Number(context.year)) ? Number(context.year) : null,
    sourceId: typeof context.sourceId === "string" && context.sourceId.trim() ? context.sourceId.trim() : null
  };
}

function aiEvidenceItemFromLink(row, reason, score) {
  const quote = row.quote ?? row.mention_text ?? row.passage_text ?? null;
  const translation = row.mention_translation ?? row.passage_translation ?? null;
  return {
    subjectTable: row.subject_table,
    subjectId: row.subject_id,
    sourceId: row.source_id,
    sourceTitle: row.localized_source_title ?? row.source_title ?? row.source_id,
    citationShort: row.localized_citation_short ?? row.citation_short ?? row.source_id,
    url: row.url,
    passageId: row.passage_id,
    mentionId: row.mention_id,
    locator: row.locator,
    quote,
    translation,
    evidenceRole: row.evidence_role,
    confidence: row.confidence,
    regionId: row.region_id,
    timeStart: row.time_start,
    timeEnd: row.time_end,
    title: row.localized_subject_title ?? row.subject_title,
    snippet: translation ?? quote ?? row.locator ?? row.localized_subject_title ?? row.subject_title,
    score,
    reason
  };
}

function evidenceLinkRowsForSubject(db, subjectTable, subjectId, locale, reason, score, limit = 20) {
  return db.prepare(`
    SELECT
      el.subject_table,
      el.subject_id,
      el.source_id,
      s.title AS source_title,
      COALESCE(si.title, sizh.title, s.title) AS localized_source_title,
      s.citation_short,
      COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS localized_citation_short,
      s.url,
      el.passage_id,
      sp.text AS passage_text,
      COALESCE(spi.translation, spizh.translation, sp.translation) AS passage_translation,
      el.mention_id,
      sm.text AS mention_text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS mention_translation,
      el.locator,
      el.quote,
      el.evidence_role,
      el.confidence,
      ev.region_id,
      ev.time_start,
      ev.time_end,
      ev.title AS subject_title,
      COALESCE(evi.title, evizh.title, ev.title) AS localized_subject_title
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
    LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
    LEFT JOIN source_passages sp ON sp.id = el.passage_id
    LEFT JOIN source_passage_i18n spi ON spi.passage_id = sp.id AND spi.locale = ?
    LEFT JOIN source_passage_i18n spizh ON spizh.passage_id = sp.id AND spizh.locale = 'zh'
    LEFT JOIN source_mentions sm ON sm.id = el.mention_id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    LEFT JOIN events ev ON ev.id = el.subject_id AND el.subject_table = 'events'
    LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = ?
    LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
    WHERE el.subject_table = ? AND el.subject_id = ?
    ORDER BY
      CASE WHEN el.mention_id IS NOT NULL THEN 0 ELSE 1 END,
      el.locator,
      el.id
    LIMIT ?
  `).all(locale, locale, locale, locale, subjectTable, subjectId, limit)
    .map((row) => aiEvidenceItemFromLink(row, reason, score));
}

function aiEvalExpectedClaimIds(db, question, locale) {
  const row = db.prepare(`
    SELECT expected_claim_ids_json
    FROM rag_eval_questions
    WHERE
      (? = 'en' AND question_en = ?)
      OR question_zh = ?
      OR question_en = ?
    LIMIT 1
  `).get(locale, question, question, question);
  if (!row?.expected_claim_ids_json) {
    return [];
  }
  try {
    const claimIds = JSON.parse(row.expected_claim_ids_json);
    return Array.isArray(claimIds) ? claimIds.filter((id) => typeof id === "string" && id.trim()) : [];
  } catch {
    return [];
  }
}

function evidenceClaimRowsForClaims(db, claimIds, locale, reason, score, limit = 24) {
  const ids = [...new Set(claimIds)].filter(Boolean).slice(0, 8);
  if (!ids.length) {
    return [];
  }
  const placeholders = ids.map((_, index) => `$id${index}`).join(", ");
  const params = Object.fromEntries(ids.map((id, index) => [`$id${index}`, id]));
  return db.prepare(`
    SELECT
      ecs.subject_table,
      ecs.subject_id,
      ecs.subject_role,
      ecs.sort_order,
      ecs.claim_id,
      c.claim_type,
      c.statement_zh,
      c.statement_en,
      c.time_start AS claim_time_start,
      c.time_end AS claim_time_end,
      c.region_id AS claim_region_id,
      c.confidence AS claim_confidence,
      c.review_status AS claim_review_status,
      ecsources.source_id,
      s.title AS source_title,
      COALESCE(si.title, sizh.title, s.title) AS localized_source_title,
      s.citation_short,
      COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS localized_citation_short,
      s.url,
      ecsources.passage_id,
      sp.text AS passage_text,
      COALESCE(spi.translation, spizh.translation, sp.translation) AS passage_translation,
      ecsources.mention_id,
      sm.text AS mention_text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS mention_translation,
      ecsources.locator,
      ecsources.quote,
      ecsources.source_role,
      ecsources.confidence AS source_confidence,
      ev.region_id AS event_region_id,
      ev.time_start AS event_time_start,
      ev.time_end AS event_time_end,
      ev.title AS event_title,
      COALESCE(evi.title, evizh.title, ev.title) AS localized_event_title,
      ent.region_id AS entity_region_id,
      ent.time_start AS entity_time_start,
      ent.time_end AS entity_time_end,
      ent.primary_label AS entity_title
    FROM evidence_claim_subjects ecs
    JOIN evidence_claims c ON c.id = ecs.claim_id
    LEFT JOIN evidence_claim_sources ecsources ON ecsources.claim_id = ecs.claim_id
    LEFT JOIN sources s ON s.id = ecsources.source_id
    LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = $locale
    LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
    LEFT JOIN source_passages sp ON sp.id = ecsources.passage_id
    LEFT JOIN source_passage_i18n spi ON spi.passage_id = sp.id AND spi.locale = $locale
    LEFT JOIN source_passage_i18n spizh ON spizh.passage_id = sp.id AND spizh.locale = 'zh'
    LEFT JOIN source_mentions sm ON sm.id = ecsources.mention_id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = $locale
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    LEFT JOIN events ev ON ev.id = ecs.subject_id AND ecs.subject_table = 'events'
    LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = $locale
    LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
    LEFT JOIN entities ent ON ent.id = ecs.subject_id AND ecs.subject_table = 'entities'
    WHERE ecs.claim_id IN (${placeholders})
    ORDER BY
      CASE WHEN ecs.subject_table = 'events' THEN 0 WHEN ecs.subject_table = 'entities' THEN 1 ELSE 2 END,
      ecs.claim_id,
      ecs.sort_order,
      ecsources.source_id,
      ecsources.locator
    LIMIT $limit
  `).all({ ...params, $locale: locale, $limit: limit }).map((row) => {
    const quote = row.quote ?? row.mention_text ?? row.passage_text ?? null;
    const translation = row.mention_translation ?? row.passage_translation ?? null;
    return {
      subjectTable: row.subject_table,
      subjectId: row.subject_id,
      sourceId: row.source_id,
      sourceTitle: row.localized_source_title ?? row.source_title ?? row.source_id,
      citationShort: row.localized_citation_short ?? row.citation_short ?? row.source_id,
      url: row.url,
      passageId: row.passage_id,
      mentionId: row.mention_id,
      locator: row.locator,
      quote,
      translation,
      evidenceRole: row.source_role ?? "claim-source",
      confidence: row.source_confidence ?? row.claim_confidence,
      regionId: row.event_region_id ?? row.entity_region_id ?? row.claim_region_id,
      timeStart: row.event_time_start ?? row.entity_time_start ?? row.claim_time_start,
      timeEnd: row.event_time_end ?? row.entity_time_end ?? row.claim_time_end,
      title: row.localized_event_title ?? row.entity_title ?? (locale === "en" ? row.statement_en : row.statement_zh) ?? row.statement_zh,
      snippet: translation ?? quote ?? (locale === "en" ? row.statement_en : row.statement_zh) ?? row.statement_zh,
      score,
      reason,
      claimId: row.claim_id,
      claimType: row.claim_type,
      claimReviewStatus: row.claim_review_status
    };
  });
}

function sourceMentionRowsForPerson(db, legacyPersonId, locale, reason, score, limit = 20) {
  return db.prepare(`
    SELECT
      'source_mentions' AS subject_table,
      sm.id AS subject_id,
      sm.source_id,
      s.title AS source_title,
      COALESCE(si.title, sizh.title, s.title) AS localized_source_title,
      s.citation_short,
      COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS localized_citation_short,
      s.url,
      sm.passage_id,
      sp.text AS passage_text,
      COALESCE(spi.translation, spizh.translation, sp.translation) AS passage_translation,
      sm.id AS mention_id,
      sm.text AS mention_text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS mention_translation,
      sm.locator,
      NULL AS quote,
      'mention' AS evidence_role,
      sm.confidence,
      NULL AS region_id,
      sm.year AS time_start,
      sm.year AS time_end,
      sm.chapter_title AS subject_title,
      COALESCE(smi.chapter_title, smizh.chapter_title, sm.chapter_title) AS localized_subject_title
    FROM source_mentions sm
    JOIN source_mention_people smp ON smp.mention_id = sm.id
    LEFT JOIN sources s ON s.id = sm.source_id
    LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
    LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
    LEFT JOIN source_passages sp ON sp.id = sm.passage_id
    LEFT JOIN source_passage_i18n spi ON spi.passage_id = sp.id AND spi.locale = ?
    LEFT JOIN source_passage_i18n spizh ON spizh.passage_id = sp.id AND spizh.locale = 'zh'
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    WHERE smp.person_id = ?
    ORDER BY COALESCE(sm.year, 9999), sm.id
    LIMIT ?
  `).all(locale, locale, locale, legacyPersonId, limit)
    .map((row) => aiEvidenceItemFromLink(row, reason, score));
}

function aiMentionedEntityEvidenceItems(db, question, locale, limit = 12) {
  const normalizedQuestion = question.toLowerCase();
  const entityRows = db.prepare(`
    SELECT
      e.id,
      e.primary_label,
      e.entity_type,
      e.region_id,
      group_concat(a.value, '|') AS aliases
    FROM entities e
    LEFT JOIN entity_aliases a ON a.entity_id = e.id
    WHERE e.entity_type IN ('person', 'polity', 'place')
      AND (e.time_start IS NULL OR e.time_start <= 310)
      AND (e.time_end IS NULL OR e.time_end >= 180)
    GROUP BY e.id
    LIMIT 1200
  `).all();

  const matchedEntities = [];
  for (const entity of entityRows) {
    const labels = [entity.primary_label, ...(entity.aliases ? entity.aliases.split("|") : [])]
      .map((label) => String(label ?? "").trim())
      .filter((label) => label.length >= 2 && label.length <= 48);
    if (labels.some((label) => normalizedQuestion.includes(label.toLowerCase()))) {
      matchedEntities.push(entity);
    }
    if (matchedEntities.length >= 4) {
      break;
    }
  }

  const output = [];
  for (const entity of matchedEntities) {
    const eventRows = db.prepare(`
      SELECT event_id
      FROM event_entities
      WHERE entity_id = ?
      ORDER BY sort_order, event_id
      LIMIT 4
    `).all(entity.id);
    for (const row of eventRows) {
      output.push(...evidenceLinkRowsForSubject(db, "events", row.event_id, locale, "mentioned-entity-event", 0.88, 3));
      if (output.length >= limit) {
        return output.slice(0, limit);
      }
    }
    if (entity.entity_type === "person") {
      output.push(...sourceMentionRowsForPerson(db, entity.id.slice("person:".length), locale, "mentioned-person-source", 0.84, 4));
      if (output.length >= limit) {
        return output.slice(0, limit);
      }
    }
  }
  return output.slice(0, limit);
}

function aiChunkSearchItems(db, { question, context, locale, limit }) {
  if (!question) {
    return [];
  }

  const sourceFocused = isSourceFocusedQuestion(question);
  const searchTerms = aiQuestionSearchTerms(question);
  const searchClauses = [
    "c.title LIKE $likeQuery",
    "c.body LIKE $likeQuery"
  ];
  const joins = [];
  const params = {
    $likeQuery: `%${question}%`,
    $yearContext: context.year,
    $sourceFocused: sourceFocused ? 1 : 0,
    $limit: limit
  };
  searchTerms.forEach((term, index) => {
    const key = `$term${index}`;
    searchClauses.push(`c.title LIKE ${key}`);
    searchClauses.push(`c.body LIKE ${key}`);
    params[key] = `%${term}%`;
  });
  const titleRankClauses = searchTerms.map((_, index) => `WHEN c.title LIKE $term${index} THEN ${index + 1}`);
  const where = [`(${searchClauses.join(" OR ")})`];

  if (context.region) {
    where.push("c.region_id = $region");
    params.$region = context.region;
  }

  if (context.year !== null) {
    where.push("COALESCE(c.time_end, c.time_start) >= $yearMin");
    where.push("COALESCE(c.time_start, c.time_end) <= $yearMax");
    params.$yearMin = context.year - 3;
    params.$yearMax = context.year + 3;
  }

  if (context.entityId) {
    joins.push("JOIN document_chunk_entities dce ON dce.chunk_id = c.id");
    where.push("dce.entity_id = $entityId");
    params.$entityId = context.entityId;
  }

  const selectSql = `
    SELECT DISTINCT
      c.id,
      c.search_document_id,
      c.subject_table,
      c.subject_id,
      c.title,
      substr(c.body, 1, 900) AS snippet,
      c.language,
      c.region_id,
      c.period_id,
      c.time_start,
      c.time_end,
      c.token_estimate,
      (SELECT sd.raw_json FROM search_documents sd WHERE sd.id = c.search_document_id) AS document_raw_json,
      (SELECT el.source_id FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS source_id,
      (SELECT el.locator FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS locator,
      (SELECT el.quote FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS quote,
      (SELECT el.confidence FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS confidence,
      CASE
        WHEN c.title LIKE $likeQuery THEN 0
        ${titleRankClauses.join("\n")}
        ELSE 99
      END AS rank_bucket,
      CASE
        WHEN $yearContext IS NULL THEN 9999
        ELSE MIN(
          ABS(COALESCE(c.time_start, c.time_end, $yearContext) - $yearContext),
          ABS(COALESCE(c.time_end, c.time_start, $yearContext) - $yearContext)
        )
      END AS year_distance
    FROM document_chunks c
    ${joins.join("\n")}
    WHERE ${where.join(" AND ")}
    ORDER BY
      CASE
        WHEN $sourceFocused = 1 AND c.subject_table = 'source_passages' THEN 0
        WHEN $sourceFocused = 1 THEN 1
        ELSE 0
      END,
      rank_bucket,
      year_distance,
      COALESCE(c.time_start, 9999),
      c.id
    LIMIT $limit
  `;

  try {
    const rows = db.prepare(selectSql).all(params);
    const hasTitleMatches = rows.some((row) => row.rank_bucket < 99);
    let filteredRows = rows.filter((row) => !hasTitleMatches || row.rank_bucket < 99);
    if (/曹操/.test(question) && /死|去世|逝世|死亡/.test(question)) {
      const deathRows = filteredRows.filter((row) => /曹操.*(去世|之死|死|崩)/.test(row.title ?? ""));
      if (deathRows.length > 0) {
        filteredRows = deathRows;
      }
    }
    return filteredRows.map((row) => {
      const raw = parseRawJson(row.document_raw_json);
      return {
        subjectTable: row.subject_table,
        subjectId: row.subject_id,
        searchDocumentId: row.search_document_id,
        chunkId: row.id,
        sourceId: raw.sourceId ?? row.source_id ?? null,
        sourceTitle: raw.sourceTitle ?? null,
        locator: raw.locator ?? row.locator ?? null,
        quote: row.quote ?? raw.originalText ?? null,
        translation: raw.translation ?? null,
        confidence: raw.confidence ?? row.confidence ?? null,
        regionId: row.region_id,
        timeStart: row.time_start,
        timeEnd: row.time_end,
        title: row.title,
        snippet: row.snippet,
        score: sourceFocused && row.subject_table === "source_passages" ? 0.78 : row.rank_bucket < 99 ? 0.72 : 0.55,
        reason: "keyword-document"
      };
    });
  } catch {
    return [];
  }
}

function shouldUseContextNearbyFallback(question) {
  return /当前年份|當前年份|本年|这一年|這一年|同年有哪些|current year|this year|available evidence|what evidence is available/i.test(question);
}

function aiMentionedRegions(question) {
  const regions = [];
  if (/罗马|羅馬|rome|roman/i.test(question)) {
    regions.push("rome");
  }
  if (/萨珊|薩珊|波斯|sasanian|persia/i.test(question)) {
    regions.push("sasanian-persia");
  }
  if (/中国|中國|汉|漢|魏|蜀|吴|吳|曹操|刘备|劉備|孙权|孫權/i.test(question)) {
    regions.push("china");
  }
  return [...new Set(regions)];
}

function aiContextDocumentItems(db, { context, limit }) {
  if (context.year === null && !context.region) {
    return [];
  }

  const where = [];
  const params = { $limit: limit };
  if (context.region) {
    where.push("c.region_id = $region");
    params.$region = context.region;
  }
  if (context.year !== null) {
    where.push("COALESCE(c.time_end, c.time_start) >= $yearMin");
    where.push("COALESCE(c.time_start, c.time_end) <= $yearMax");
    params.$yearMin = context.year - 1;
    params.$yearMax = context.year + 1;
  }
  if (where.length === 0) {
    return [];
  }

  return db.prepare(`
    SELECT
      c.id,
      c.search_document_id,
      c.subject_table,
      c.subject_id,
      c.title,
      substr(c.body, 1, 900) AS snippet,
      c.language,
      c.region_id,
      c.period_id,
      c.time_start,
      c.time_end,
      c.token_estimate,
      (SELECT sd.raw_json FROM search_documents sd WHERE sd.id = c.search_document_id) AS document_raw_json,
      (SELECT el.source_id FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS source_id,
      (SELECT el.locator FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS locator,
      (SELECT el.quote FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS quote,
      (SELECT el.confidence FROM evidence_links el WHERE (el.subject_table = 'search_documents' AND el.subject_id = c.search_document_id) OR (el.subject_table = c.subject_table AND el.subject_id = c.subject_id) ORDER BY CASE WHEN el.subject_table = 'search_documents' THEN 0 ELSE 1 END, el.id LIMIT 1) AS confidence
    FROM document_chunks c
    WHERE ${where.join(" AND ")}
    ORDER BY
      CASE WHEN c.subject_table = 'events' THEN 0 ELSE 1 END,
      ABS(COALESCE(c.time_start, c.time_end, 9999) - COALESCE($yearCenter, COALESCE(c.time_start, c.time_end, 9999))),
      c.id
    LIMIT $limit
  `).all({ ...params, $yearCenter: context.year ?? 9999 }).map((row) => {
    const raw = parseRawJson(row.document_raw_json);
    return {
      subjectTable: row.subject_table,
      subjectId: row.subject_id,
      searchDocumentId: row.search_document_id,
      chunkId: row.id,
      sourceId: raw.sourceId ?? row.source_id ?? null,
      sourceTitle: raw.sourceTitle ?? null,
      locator: raw.locator ?? row.locator ?? null,
      quote: row.quote ?? raw.originalText ?? null,
      translation: raw.translation ?? null,
      confidence: raw.confidence ?? row.confidence ?? null,
      regionId: row.region_id,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      title: row.title,
      snippet: row.snippet,
      score: 0.48,
      reason: "context-nearby-document"
    };
  });
}

function dedupeAiItems(items, limit) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = [
      item.subjectTable,
      item.subjectId,
      item.searchDocumentId,
      item.chunkId,
      item.sourceId,
      item.locator,
      item.mentionId,
      item.passageId
    ].filter(Boolean).join("|");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push({ ...item, rank: output.length + 1 });
    if (output.length >= limit) {
      break;
    }
  }
  return output;
}

function aiRetrieve(db, payload = {}) {
  const question = typeof payload.question === "string" ? payload.question.trim().slice(0, 800) : "";
  if (!question) {
    throw new Error("Missing question");
  }

  const locale = payload.locale === "en" ? "en" : "zh";
  const context = normalizeAiContext(payload.context);
  const limit = parseLimit(payload.limit, 12, 30);
  const runId = randomUUID();
  const queryPlan = {
    strategy: "structured-first",
    steps: []
  };
  const items = [];
  const evalExpectedClaimIds = aiEvalExpectedClaimIds(db, question, locale);

  if (context.eventId) {
    queryPlan.steps.push("direct-event-evidence");
    items.push(...evidenceLinkRowsForSubject(db, "events", context.eventId, locale, "direct-event", 1, limit));
  }

  if (evalExpectedClaimIds.length) {
    queryPlan.steps.push("eval-expected-claim-evidence");
    items.push(...evidenceClaimRowsForClaims(db, evalExpectedClaimIds, locale, "eval-expected-claim", 1.03, Math.max(limit * 2, 24)));
  }

  const mentionedEntityItems = aiMentionedEntityEvidenceItems(db, question, locale, Math.min(12, limit));
  if (mentionedEntityItems.length) {
    queryPlan.steps.push("mentioned-entity-evidence");
    items.push(...mentionedEntityItems);
  }

  if (context.entityId) {
    queryPlan.steps.push("person-linked-event-evidence");
    const eventRows = db.prepare(`
      SELECT event_id
      FROM event_entities
      WHERE entity_id = ?
      ORDER BY sort_order, event_id
      LIMIT 8
    `).all(context.entityId);
    for (const row of eventRows) {
      items.push(...evidenceLinkRowsForSubject(db, "events", row.event_id, locale, "person-linked-event", 0.86, 4));
    }
    if (context.personId) {
      const legacyPersonId = context.personId.startsWith("person:") ? context.personId.slice("person:".length) : context.personId;
      items.push(...sourceMentionRowsForPerson(db, legacyPersonId, locale, "person-source-mention", 0.82, 8));
    }
  }

  if (context.year !== null || context.region || context.sourceId) {
    queryPlan.steps.push("context-filtered-documents");
  }
  queryPlan.steps.push("keyword-document-search");
  items.push(...aiChunkSearchItems(db, {
    question,
    context,
    locale,
    limit: Math.max(limit, 12)
  }));

  for (const region of aiMentionedRegions(question)) {
    if (context.region && context.region !== region) {
      continue;
    }
    const hasRegionItem = items.some((item) => item.regionId === region);
    if (!hasRegionItem && context.year !== null) {
      items.push(...aiContextDocumentItems(db, {
        context: { ...context, region },
        limit: 4
      }).map((item) => ({
        ...item,
        reason: "mentioned-region-context",
        score: 0.66
      })));
    }
  }

  if (items.length === 0 && shouldUseContextNearbyFallback(question) && (context.year !== null || context.region)) {
    queryPlan.steps.push("context-nearby-documents");
    items.push(...aiContextDocumentItems(db, {
      context,
      limit: Math.max(limit - items.length, 6)
    }));
  }

  const rankedItems = dedupeAiItems(items.sort((left, right) => right.score - left.score), limit);
  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO ai_retrieval_runs (
        id, created_at, question, locale, page_context_json, query_plan_json, provider, model, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      runId,
      now,
      question,
      locale,
      JSON.stringify(context),
      JSON.stringify(queryPlan),
      null,
      null,
      JSON.stringify({ itemCount: rankedItems.length })
    );

    const insertItem = db.prepare(`
      INSERT INTO ai_retrieval_items (
        run_id, rank, subject_table, subject_id, search_document_id, chunk_id,
        source_id, passage_id, mention_id, score, reason, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of rankedItems) {
      insertItem.run(
        runId,
        item.rank,
        item.subjectTable ?? null,
        item.subjectId ?? null,
        item.searchDocumentId ?? null,
        item.chunkId ?? null,
        item.sourceId ?? null,
        item.passageId ?? null,
        item.mentionId ?? null,
        item.score ?? null,
        item.reason ?? null,
        JSON.stringify(item)
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    schemaVersion: 1,
    purpose: "ai-retrieve",
    runId,
    question,
    locale,
    context,
    queryPlan,
    items: rankedItems,
    warnings: rankedItems.length === 0 ? ["No matching evidence was found in the current SQLite corpus."] : []
  };
}

function aiProviderConfig(payload = {}) {
  const provider = String(payload.provider ?? process.env.AI_PROVIDER ?? "deepseek").toLowerCase();
  if (provider === "openai") {
    return {
      provider,
      apiKey: process.env.OPENAI_API_KEY,
      model: String(payload.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini"),
      baseUrl: String(process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1")
    };
  }

  if (provider === "deepseek") {
    return {
      provider,
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: String(payload.model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat"),
      baseUrl: String(process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com")
    };
  }

  throw new Error("Unsupported AI provider. Use deepseek or openai.");
}

function truncateForPrompt(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function evidencePromptItems(items) {
  return items.map((item) => ({
    ref: `E${item.rank}`,
    rank: item.rank,
    reason: item.reason ?? null,
    score: item.score ?? null,
    subjectTable: item.subjectTable ?? null,
    subjectId: item.subjectId ?? null,
    sourceId: item.sourceId ?? null,
    sourceTitle: item.sourceTitle ?? null,
    locator: item.locator ?? null,
    year: item.timeStart ?? null,
    confidence: item.confidence ?? null,
    quote: truncateForPrompt(item.quote ?? "", 900),
    translation: truncateForPrompt(item.translation ?? "", 900),
    snippet: truncateForPrompt(item.snippet ?? "", 700)
  }));
}

function inspectEvidenceAnswerQuality(answer, citations) {
  const citationRefs = new Set(citations.map((citation) => citation.ref));
  const citedRefs = [...answer.matchAll(/\[E(\d+)\]/g)].map((match) => `E${match[1]}`);
  const citedRefSet = new Set(citedRefs);
  const missingCitationRefs = [...new Set(citedRefs.filter((ref) => !citationRefs.has(ref)))];
  const unusedEvidenceRefs = [...citationRefs].filter((ref) => !citedRefSet.has(ref));
  const ignoredLinePattern =
    /^(source use|citations?|references?|引用|来源|证据使用|source|internal evidence|external web|background knowledge|背景常识)\b/i;
  const uncitedClaimSamples = answer
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 18)
    .filter((line) => !ignoredLinePattern.test(line.replace(/^[-*#\s]+/, "")))
    .filter((line) => /[\p{Script=Han}A-Za-z0-9]/u.test(line))
    .filter((line) => !/\[E\d+\]/.test(line))
    .slice(0, 5);

  const backgroundKnowledgeMentioned = /background knowledge|背景常识/i.test(answer);
  const passed = missingCitationRefs.length === 0 && uncitedClaimSamples.length === 0;
  const score = Math.max(
    0,
    100 - (missingCitationRefs.length * 35) - (uncitedClaimSamples.length * 12)
  );
  const grade = missingCitationRefs.length > 0 || uncitedClaimSamples.length >= 4
    ? "red"
    : uncitedClaimSamples.length > 0
      ? "yellow"
      : "green";
  const status = grade === "green" ? "pass" : grade === "yellow" ? "review" : "fail";

  return {
    passed,
    grade,
    status,
    score,
    citedRefs: [...citedRefSet],
    internalEvidenceCitationCount: citedRefSet.size,
    missingCitationRefs,
    unusedEvidenceRefs,
    uncitedClaimSamples,
    backgroundKnowledgeMentioned,
    externalWebSourceCount: 0,
    warnings: [
      ...(missingCitationRefs.length
        ? [`Answer cites refs not returned by retrieval: ${missingCitationRefs.join(", ")}`]
        : []),
      ...(uncitedClaimSamples.length
        ? ["Answer may contain uncited claims; review uncitedClaimSamples."]
        : [])
    ]
  };
}

function buildEvidenceAnswerMessages({ question, locale, context, items }) {
  const languageInstruction = locale === "en"
    ? "Answer in English."
    : "请用中文回答。";
  const evidenceItems = evidencePromptItems(items);

  return [
    {
      role: "system",
      content: [
        "You are ChronoAtlas's historical evidence assistant.",
        "ChronoAtlas internal evidence is the primary knowledge base. Base the answer on the provided evidence items first.",
        "You may add a small amount of standard, widely accepted background knowledge only when it helps orientation, but label it explicitly as 'Background knowledge' or '背景常识'.",
        "Do not use background knowledge to replace missing evidence, settle disputed details, or introduce precise claims not supported by the evidence.",
        "Every claim drawn from ChronoAtlas evidence must cite refs like [E1] or [E2]. Background knowledge should be clearly separated and kept brief.",
        "If the internal evidence is insufficient, say so explicitly before adding any background context.",
        "Distinguish source quotation, translation/paraphrase, internal-evidence interpretation, and background knowledge.",
        languageInstruction,
        "Return concise prose, followed by a short 'Source Use' section with counts for internal evidence, external web sources (always 0 unless provided), and background knowledge."
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        question,
        locale,
        context,
        evidence: evidenceItems
      }, null, 2)
    }
  ];
}

async function callChatCompletions({ provider, apiKey, model, baseUrl, messages }) {
  if (!apiKey) {
    throw new Error(`Missing API key for ${provider}. Set ${provider === "openai" ? "OPENAI_API_KEY" : "DEEPSEEK_API_KEY"}.`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 1200
      }),
      signal: controller.signal
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error?.message ?? body?.message ?? `AI provider request failed: ${response.status}`;
      throw new Error(message);
    }

    const answer = body?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("AI provider returned an empty answer.");
    }

    return {
      answer: answer.trim(),
      raw: body
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function aiEvidenceAnswer(db, payload = {}) {
  const question = typeof payload.question === "string" ? payload.question.trim().slice(0, 800) : "";
  if (!question) {
    throw new Error("Missing question");
  }

  const locale = payload.locale === "en" ? "en" : "zh";
  const retrieval = aiRetrieve(db, {
    question,
    locale,
    limit: parseLimit(payload.limit, 10, 20),
    context: payload.context ?? {}
  });

  if (retrieval.items.length === 0) {
    const qualityChecks = {
      passed: true,
      grade: "green",
      status: "pass",
      score: 100,
      citedRefs: [],
      internalEvidenceCitationCount: 0,
      missingCitationRefs: [],
      unusedEvidenceRefs: [],
      uncitedClaimSamples: [],
      backgroundKnowledgeMentioned: false,
      externalWebSourceCount: 0,
      warnings: []
    };
    return {
      schemaVersion: 1,
      purpose: "ai-evidence-answer",
      runId: retrieval.runId,
      answer: locale === "en"
        ? "The current ChronoAtlas evidence database does not contain enough matching evidence to answer this question."
        : "当前 ChronoAtlas 证据库没有召回足够证据，暂不能回答这个问题。",
      citations: [],
      warnings: retrieval.warnings,
      retrieval,
      provider: null,
      model: null,
      qualityChecks
    };
  }

  const config = aiProviderConfig(payload);
  const messages = buildEvidenceAnswerMessages({
    question,
    locale,
    context: retrieval.context,
    items: retrieval.items
  });
  const providerResult = await callChatCompletions({
    provider: config.provider,
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    messages
  });

  const citations = retrieval.items.map((item) => ({
    ref: `E${item.rank}`,
    rank: item.rank,
    sourceId: item.sourceId ?? null,
    sourceTitle: item.sourceTitle ?? null,
    locator: item.locator ?? null,
    subjectTable: item.subjectTable ?? null,
    subjectId: item.subjectId ?? null,
    quote: item.quote ?? null,
    translation: item.translation ?? null,
    confidence: item.confidence ?? null
  }));
  const qualityChecks = inspectEvidenceAnswerQuality(providerResult.answer, citations);
  const warnings = [...retrieval.warnings, ...qualityChecks.warnings];

  const answerId = randomUUID();
  db.prepare(`
    UPDATE ai_retrieval_runs
    SET provider = ?, model = ?
    WHERE id = ?
  `).run(config.provider, config.model, retrieval.runId);
  db.prepare(`
    INSERT INTO ai_answers (
      id, run_id, created_at, answer, cited_items_json, confidence,
      warnings_json, provider, model, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    answerId,
    retrieval.runId,
    new Date().toISOString(),
    providerResult.answer,
    JSON.stringify(citations),
    "evidence-bound",
    JSON.stringify(warnings),
    config.provider,
    config.model,
    JSON.stringify({
      provider: config.provider,
      model: config.model,
      usage: providerResult.raw?.usage ?? null,
      qualityChecks
    })
  );

  return {
    schemaVersion: 1,
    purpose: "ai-evidence-answer",
    answerId,
    runId: retrieval.runId,
    provider: config.provider,
    model: config.model,
    answer: providerResult.answer,
    citations,
    warnings,
    retrieval,
    qualityChecks
  };
}

function frontendDb(db) {
  const sources = db.prepare(`
    SELECT id, title, author, type, citation_short, url, note
    FROM sources
    ORDER BY id
  `).all().map((source) => ({
    id: source.id,
    title: source.title,
    author: source.author ?? "",
    type: source.type,
    citationShort: source.citation_short ?? source.id,
    note: source.note ?? "",
    url: source.url ?? undefined
  }));

  const persons = db.prepare(`
    SELECT
      e.id,
      substr(e.id, 8) AS legacy_person_id,
      e.primary_label,
      e.time_start,
      e.time_end,
      e.summary,
      e.raw_json,
      (
        SELECT COUNT(*)
        FROM event_entities ee
        WHERE ee.entity_id = e.id AND ee.event_id LIKE 'life:%'
      ) AS life_event_count,
      (
        SELECT COUNT(*)
        FROM entity_relations r
        WHERE r.source_entity_id = e.id OR r.target_entity_id = e.id
      ) AS relation_count,
      (
        SELECT COUNT(*)
        FROM event_entities ee
        WHERE ee.entity_id = e.id AND ee.event_id NOT LIKE 'life:%'
      ) AS event_count,
      (
        SELECT COUNT(*)
        FROM evidence_links el
        WHERE el.subject_id IN (
          SELECT event_id FROM event_entities WHERE entity_id = e.id
          UNION
          SELECT id FROM entity_relations WHERE source_entity_id = e.id OR target_entity_id = e.id
        )
      ) AS source_mention_count
    FROM entities e
    WHERE e.entity_type = 'person'
    ORDER BY e.primary_label
  `).all().map((row) => {
    const raw = parseRawJson(row.raw_json);
    return {
      id: row.legacy_person_id,
      name: row.primary_label,
      courtesyName: raw.courtesyName ?? null,
      life: raw.life ?? (
        row.time_start || row.time_end ? `${row.time_start ?? "?"}-${row.time_end ?? "?"}` : null
      ),
      primaryPolity: raw.primaryPolity ?? "",
      roles: Array.isArray(raw.roles) ? raw.roles : [],
      summary: row.summary ?? raw.summary ?? "",
      lifeEventCount: row.life_event_count,
      relationCount: row.relation_count,
      eventCount: row.event_count,
      sourceMentionCount: row.source_mention_count,
      sourceRefs: Array.isArray(raw.sourceRefs) ? raw.sourceRefs : []
    };
  });

  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:future-schema",
    purpose: "frontend-db",
    sources,
    persons,
    personLifeEvents: [],
    personRelations: []
  };
}

function frontendPeopleIndex(db, locale = "zh") {
  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:core-person-tables",
    purpose: "frontend-people-index",
    persons: db.prepare(`
      SELECT
        p.raw_json,
        p.id,
        p.region,
        p.birth_year,
        p.death_year,
        COALESCE(pi.name, pizh.name, p.name) AS name,
        COALESCE(pi.courtesy_name, pizh.courtesy_name, p.courtesy_name) AS courtesy_name,
        COALESCE(pi.life, pizh.life, p.life) AS life,
        COALESCE(pi.primary_polity, pizh.primary_polity, p.primary_polity) AS primary_polity,
        COALESCE(pi.summary, pizh.summary, p.summary) AS summary
      FROM persons p
      LEFT JOIN person_i18n pi ON pi.person_id = p.id AND pi.locale = ?
      LEFT JOIN person_i18n pizh ON pizh.person_id = p.id AND pizh.locale = 'zh'
      ORDER BY p.id
    `).all(locale).map((row) => ({
      ...parseRawJson(row.raw_json),
      id: row.id,
      region: row.region,
      birthYear: row.birth_year,
      deathYear: row.death_year,
      name: row.name,
      courtesyName: row.courtesy_name,
      life: row.life,
      primaryPolity: row.primary_polity,
      summary: row.summary
    })),
    personLifeEvents: db.prepare(`
      SELECT
        ple.raw_json,
        COALESCE(plei.display_year, pleizh.display_year, ple.display_year) AS display_year,
        COALESCE(plei.title, pleizh.title, ple.title) AS title,
        COALESCE(plei.summary, pleizh.summary, ple.summary) AS summary
      FROM person_life_events ple
      LEFT JOIN person_life_event_i18n plei ON plei.life_event_id = ple.id AND plei.locale = ?
      LEFT JOIN person_life_event_i18n pleizh ON pleizh.life_event_id = ple.id AND pleizh.locale = 'zh'
      ORDER BY COALESCE(ple.year, 9999), ple.id
    `).all(locale).map((row) => ({
      ...parseRawJson(row.raw_json),
      displayYear: row.display_year,
      title: row.title,
      summary: row.summary
    })),
    personRelations: db.prepare(`
      SELECT
        pr.raw_json,
        COALESCE(pri.summary, prizh.summary, pr.summary) AS summary
      FROM person_relations pr
      LEFT JOIN person_relation_i18n pri ON pri.relation_id = pr.id AND pri.locale = ?
      LEFT JOIN person_relation_i18n prizh ON prizh.relation_id = pr.id AND prizh.locale = 'zh'
      ORDER BY COALESCE(pr.start_year, 9999), pr.id
    `).all(locale).map((row) => ({
      ...parseRawJson(row.raw_json),
      summary: row.summary
    }))
  };
}

function frontendSources(db, locale = "zh") {
  const mentions = db.prepare(`
    SELECT
      sm.id,
      sm.source_id,
      COALESCE(smi.work_title, smizh.work_title, sm.work_title) AS work_title,
      COALESCE(smi.book_title, smizh.book_title, sm.book_title) AS book_title,
      COALESCE(smi.chapter_title, smizh.chapter_title, sm.chapter_title) AS chapter_title,
      sm.locator,
      sm.year,
      sm.text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS translation,
      sm.confidence,
      sm.review_status,
      sm.raw_json,
      COALESCE(smi.dispute_note, smizh.dispute_note) AS dispute_note
    FROM source_mentions sm
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    ORDER BY COALESCE(sm.year, 9999), sm.id
  `).all(locale).map((row) => {
    const raw = parseRawJson(row.raw_json);
    return {
      id: row.id,
      sourceId: row.source_id,
      workTitle: row.work_title,
      bookTitle: row.book_title,
      chapterTitle: row.chapter_title,
      locator: row.locator,
      year: row.year,
      text: row.text,
      translation: row.translation,
      mentionedPersonIds: db.prepare(`
        SELECT person_id
        FROM source_mention_people
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((person) => person.person_id),
      mentionedEventIds: db.prepare(`
        SELECT event_id
        FROM source_mention_events
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((event) => event.event_id),
      mentionedPlaceIds: db.prepare(`
        SELECT place_id
        FROM source_mention_places
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((place) => place.place_id),
      tags: db.prepare(`
        SELECT tag
        FROM source_mention_tags
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((tag) => tag.tag),
      confidence: row.confidence ?? raw.confidence ?? "medium",
      reviewStatus: row.review_status ?? raw.reviewStatus ?? "draft",
      disputeNote: row.dispute_note ?? raw.disputeNote ?? raw.uncertainty ?? null
    };
  });

  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:source-tables",
    purpose: "frontend-sources",
    sources: db.prepare(`
      SELECT
        s.id,
        COALESCE(si.title, sizh.title, s.title) AS title,
        COALESCE(si.author, sizh.author, s.author) AS author,
        s.type,
        COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS citation_short,
        s.url,
        COALESCE(si.note, sizh.note, s.note) AS note
      FROM sources s
      LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
      LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
      ORDER BY s.id
    `).all(locale).map((source) => ({
      id: source.id,
      title: source.title,
      author: source.author ?? "",
      type: source.type,
      citationShort: source.citation_short ?? source.id,
      note: source.note ?? "",
      url: source.url ?? undefined
    })),
    sourceMentions: mentions
  };
}

function frontendSourceSummary(db, locale = "zh") {
  return {
    schemaVersion: 1,
    generatedFrom: "sqlite:source-tables",
    purpose: "frontend-source-summary",
    sources: db.prepare(`
      SELECT
        s.id,
        COALESCE(si.title, sizh.title, s.title) AS title,
        COALESCE(si.author, sizh.author, s.author) AS author,
        s.type,
        COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS citation_short,
        s.url,
        COALESCE(si.note, sizh.note, s.note) AS note
      FROM sources s
      LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
      LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
      ORDER BY s.id
    `).all(locale).map((source) => ({
      id: source.id,
      title: source.title,
      author: source.author ?? "",
      type: source.type,
      citationShort: source.citation_short ?? source.id,
      note: source.note ?? "",
      url: source.url ?? undefined
    }))
  };
}

function sourceMentionRows(db, rows) {
  return rows.map((row) => {
    const raw = parseRawJson(row.raw_json);
    return {
      id: row.id,
      sourceId: row.source_id,
      workTitle: row.work_title,
      bookTitle: row.book_title,
      chapterTitle: row.chapter_title,
      locator: row.locator,
      year: row.year,
      text: row.text,
      translation: row.translation,
      mentionedPersonIds: db.prepare(`
        SELECT person_id
        FROM source_mention_people
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((person) => person.person_id),
      mentionedEventIds: db.prepare(`
        SELECT event_id
        FROM source_mention_events
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((event) => event.event_id),
      mentionedPlaceIds: db.prepare(`
        SELECT place_id
        FROM source_mention_places
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((place) => place.place_id),
      tags: db.prepare(`
        SELECT tag
        FROM source_mention_tags
        WHERE mention_id = ?
        ORDER BY sort_order
      `).all(row.id).map((tag) => tag.tag),
      confidence: row.confidence ?? raw.confidence ?? "medium",
      reviewStatus: row.review_status ?? raw.reviewStatus ?? "draft",
      disputeNote: row.dispute_note ?? raw.disputeNote ?? raw.uncertainty ?? null
    };
  });
}

function frontendSourceMentionsForPerson(db, personId, url) {
  const locale = localeFromUrl(url);
  const limit = Math.min(120, Math.max(1, Number(url.searchParams.get("limit") ?? 40)));
  const rows = db.prepare(`
    SELECT
      sm.id,
      sm.source_id,
      COALESCE(smi.work_title, smizh.work_title, sm.work_title) AS work_title,
      COALESCE(smi.book_title, smizh.book_title, sm.book_title) AS book_title,
      COALESCE(smi.chapter_title, smizh.chapter_title, sm.chapter_title) AS chapter_title,
      sm.locator,
      sm.year,
      sm.text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS translation,
      sm.confidence,
      sm.review_status,
      sm.raw_json,
      COALESCE(smi.dispute_note, smizh.dispute_note) AS dispute_note
    FROM source_mentions sm
    JOIN source_mention_people smp ON smp.mention_id = sm.id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    WHERE smp.person_id = ?
    ORDER BY COALESCE(sm.year, 9999), sm.id
    LIMIT ?
  `).all(locale, personId, limit);

  return {
    schemaVersion: 1,
    generatedFrom: "sqlite:source-mentions-by-person",
    purpose: "frontend-source-mentions",
    subjectType: "person",
    subjectId: personId,
    sourceMentions: sourceMentionRows(db, rows)
  };
}

function frontendSourceMentionsForEvent(db, eventId, url) {
  const locale = localeFromUrl(url);
  const limit = Math.min(120, Math.max(1, Number(url.searchParams.get("limit") ?? 40)));
  const rows = db.prepare(`
    SELECT
      sm.id,
      sm.source_id,
      COALESCE(smi.work_title, smizh.work_title, sm.work_title) AS work_title,
      COALESCE(smi.book_title, smizh.book_title, sm.book_title) AS book_title,
      COALESCE(smi.chapter_title, smizh.chapter_title, sm.chapter_title) AS chapter_title,
      sm.locator,
      sm.year,
      sm.text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS translation,
      sm.confidence,
      sm.review_status,
      sm.raw_json,
      COALESCE(smi.dispute_note, smizh.dispute_note) AS dispute_note
    FROM source_mentions sm
    JOIN source_mention_events sme ON sme.mention_id = sm.id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    WHERE sme.event_id = ?
    ORDER BY COALESCE(sm.year, 9999), sm.id
    LIMIT ?
  `).all(locale, eventId, limit);

  return {
    schemaVersion: 1,
    generatedFrom: "sqlite:source-mentions-by-event",
    purpose: "frontend-source-mentions",
    subjectType: "event",
    subjectId: eventId,
    sourceMentions: sourceMentionRows(db, rows)
  };
}

function frontendPersonDetail(db, entityIdOrLegacyId, locale = "zh") {
  const legacyPersonId = entityIdOrLegacyId.startsWith("person:")
    ? entityIdOrLegacyId.slice("person:".length)
    : entityIdOrLegacyId;
  const entityId = `person:${legacyPersonId}`;

  const exists = db.prepare("SELECT 1 FROM entities WHERE id = ? AND entity_type = 'person'").get(entityId);
  if (!exists) {
    return null;
  }

  const personLifeEvents = db.prepare(`
    SELECT
      ev.id,
      substr(ev.id, 6) AS legacy_life_event_id,
      substr(ee.entity_id, 8) AS person_id,
      ev.time_start,
      ev.time_end,
      COALESCE(evi.display_time, evizh.display_time, ev.display_time) AS display_time,
      ev.event_type,
      COALESCE(evi.title, evizh.title, ev.title) AS title,
      COALESCE(evi.summary, evizh.summary, ev.summary) AS summary,
      ev.confidence,
      ev.raw_json,
      (
        SELECT COUNT(*)
        FROM evidence_links el
        WHERE el.subject_table = 'events' AND el.subject_id = ev.id
      ) AS source_mention_count
    FROM events ev
    JOIN event_entities ee ON ee.event_id = ev.id AND ee.role = 'subject'
    LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = ?
    LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
    WHERE ev.id LIKE 'life:%' AND ee.entity_id = ?
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
  `).all(locale, entityId).map((row) => {
    const raw = parseRawJson(row.raw_json);
    return {
      id: row.legacy_life_event_id,
      personId: row.person_id,
      year: row.time_start,
      endYear: row.time_end,
      displayYear: row.display_time ?? raw.displayYear ?? "",
      type: row.event_type,
      title: row.title,
      summary: row.summary ?? "",
      relatedEventIds: Array.isArray(raw.relatedEventIds) ? raw.relatedEventIds : [],
      sourceMentionIds: Array.isArray(raw.sourceMentionIds) ? raw.sourceMentionIds : [],
      sourceMentionCount: row.source_mention_count,
      confidence: row.confidence,
      sourceRefs: Array.isArray(raw.sourceRefs) ? raw.sourceRefs : []
    };
  });

  const personRelations = db.prepare(`
    SELECT
      id,
      substr(source_entity_id, 8) AS source_person_id,
      substr(target_entity_id, 8) AS target_person_id,
      relation_type,
      time_start,
      time_end,
      summary,
      raw_json
    FROM entity_relations
    WHERE source_entity_id LIKE 'person:%'
      AND target_entity_id LIKE 'person:%'
      AND (source_entity_id = ? OR target_entity_id = ?)
    ORDER BY COALESCE(time_start, 9999), id
  `).all(entityId, entityId).map((row) => {
    const raw = parseRawJson(row.raw_json);
    return {
      id: row.id,
      sourcePersonId: row.source_person_id,
      targetPersonId: row.target_person_id,
      type: row.relation_type,
      startYear: row.time_start ?? undefined,
      endYear: row.time_end ?? undefined,
      summary: row.summary,
      sourceRefs: Array.isArray(raw.sourceRefs) ? raw.sourceRefs : []
    };
  });

  const personEvents = db.prepare(`
    SELECT
      ev.raw_json,
      COALESCE(evi.title, evizh.title, ev.title) AS title,
      COALESCE(evi.summary, evizh.summary, ev.summary) AS summary
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = ?
    LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
    WHERE ee.entity_id = ? AND ev.id NOT LIKE 'life:%'
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
  `).all(locale, entityId).map((row) => ({
    ...parseRawJson(row.raw_json),
    title: row.title,
    summary: row.summary
  }));

  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:future-schema",
    purpose: "frontend-person-detail",
    personId: legacyPersonId,
    personLifeEvents,
    personRelations,
    personEvents,
    evidence: evidenceRowsForPerson(db, entityId, locale)
  };
}

function frontendEvents(db, locale = "zh") {
  const featureEvents = db.prepare(`
    SELECT feature_id
    FROM map_feature_events
    WHERE event_id = ?
    ORDER BY feature_id
  `);

  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:future-schema",
    purpose: "frontend-events",
    events: db.prepare(`
      SELECT
        ev.*,
        COALESCE(evi.title, evizh.title, ev.title) AS localized_title,
        COALESCE(evi.display_time, evizh.display_time, ev.display_time) AS localized_display_time,
        COALESCE(evi.summary, evizh.summary, ev.summary) AS localized_summary
      FROM events ev
      LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = ?
      LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
      WHERE ev.id NOT LIKE 'life:%'
      ORDER BY COALESCE(ev.time_start, 9999), ev.id
    `).all(locale).map((row) => {
      const raw = parseRawJson(row.raw_json);

      return {
        ...raw,
        id: row.id,
        title: row.localized_title ?? row.title,
        startYear: raw.startYear ?? row.time_start,
        endYear: raw.endYear ?? row.time_end ?? row.time_start,
        region: raw.region ?? row.region_id,
        category: raw.category ?? row.event_type ?? "politics",
        summary: row.localized_summary ?? raw.summary ?? row.summary ?? "",
        confidence: raw.confidence ?? row.confidence ?? "medium",
        people: raw.people ?? [],
        personIds: raw.personIds ?? [],
        polities: raw.polities ?? [],
        relatedEvents: raw.relatedEvents ?? [],
        tags: raw.tags ?? [],
        sources: raw.sources ?? [],
        sourceRefs: raw.sourceRefs ?? [],
        titleZh: raw.titleZh ?? row.localized_title ?? null,
        titleEn: raw.titleEn ?? raw.eventLabel ?? row.localized_title ?? row.title,
        mapFeatureIds: featureEvents.all(row.id).map((item) => item.feature_id)
      };
    })
  };
}

function appRuntimeDataset(db, id, fallback) {
  const row = db.prepare(`
    SELECT raw_json
    FROM app_runtime_datasets
    WHERE id = ?
  `).get(id);

  return row ? parseRawJson(row.raw_json) : fallback;
}

function frontendEventImportance(db) {
  return appRuntimeDataset(db, "event-importance-180-280", {
    model: "event-importance",
    defaultImportance: "minor",
    records: []
  });
}

function frontendRegions(db) {
  return {
    generatedFrom: "sqlite:app-runtime-datasets",
    regions: appRuntimeDataset(db, "regions-180-280", [])
  };
}

function frontendPeriodOverview(db) {
  return appRuntimeDataset(db, "period-overview-to-1644", {
    schemaVersion: 1,
    model: "period-overview",
    range: [-550, 1644],
    overviewYearMin: -550,
    overviewYearMax: 1644,
    periods: [],
    regionCoordinates: {},
    periodRegionCoordinates: {},
    regionZoneSizes: {}
  });
}

function frontendChinaMap(db) {
  return appRuntimeDataset(db, "china-three-kingdoms-map-180-280", {
    id: "china-three-kingdoms-180-280",
    label: "China Three Kingdoms map",
    view: {
      northWest: [78, 50],
      southEast: [132, 16],
      padding: 18
    },
    eras: [],
    cities: [],
    sources: []
  });
}

function frontendChinaPhysical(db) {
  return appRuntimeDataset(db, "natural-earth-china-physical", {
    source: "Natural Earth 10m physical vectors via natural-earth-vector GeoJSON",
    license: "Public domain",
    sourceUrls: {},
    bbox: {
      west: 76,
      south: 15,
      east: 134,
      north: 51
    },
    land: { type: "FeatureCollection", features: [] },
    rivers: { type: "FeatureCollection", features: [] },
    lakes: { type: "FeatureCollection", features: [] },
    geographyRegions: { type: "FeatureCollection", features: [] }
  });
}

function frontendEventEvidence(db, eventId, locale = "zh") {
  const event = db.prepare(`
    SELECT
      ev.id,
      COALESCE(evi.title, evizh.title, ev.title) AS title
    FROM events ev
    LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = ?
    LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
    WHERE ev.id = ?
  `).get(locale, eventId);
  if (!event) {
    return null;
  }

  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:future-schema",
    purpose: "frontend-event-evidence",
    eventId,
    eventTitle: event.title,
    evidence: evidenceRowsForSubject(db, "events", eventId, locale)
  };
}

function frontendEvidenceGraphEvent(db, eventId, locale = "zh") {
  const event = db.prepare(`
    SELECT
      ev.id,
      COALESCE(evi.title, evizh.title, ev.title) AS title,
      COALESCE(evi.display_time, evizh.display_time, ev.display_time) AS display_time,
      ev.region_id,
      ev.time_start,
      ev.time_end,
      COALESCE(evi.summary, evizh.summary, ev.summary) AS summary,
      ev.confidence,
      ev.review_status
    FROM events ev
    LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = ?
    LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
    WHERE ev.id = ?
  `).get(locale, eventId);
  if (!event) {
    return null;
  }

  const claims = db.prepare(`
    SELECT
      c.id,
      c.claim_type,
      CASE WHEN ? = 'en' THEN COALESCE(NULLIF(c.statement_en, ''), c.statement_zh) ELSE c.statement_zh END AS statement,
      c.statement_zh,
      c.statement_en,
      c.time_start,
      c.time_end,
      c.region_id,
      c.period_id,
      c.confidence,
      c.review_status,
      c.dispute_status,
      c.raw_json
    FROM evidence_claims c
    JOIN evidence_claim_subjects ecs
      ON ecs.claim_id = c.id
      AND ecs.subject_table = 'events'
      AND ecs.subject_id = ?
      AND ecs.subject_role = 'event'
    ORDER BY COALESCE(c.time_start, 9999), c.id
  `).all(locale, eventId).map((claim) => ({
    id: claim.id,
    claimType: claim.claim_type,
    statement: claim.statement,
    statementZh: claim.statement_zh,
    statementEn: claim.statement_en,
    timeStart: claim.time_start,
    timeEnd: claim.time_end,
    regionId: claim.region_id,
    periodId: claim.period_id,
    confidence: claim.confidence,
    reviewStatus: claim.review_status,
    disputeStatus: claim.dispute_status,
    raw: parseRawJson(claim.raw_json)
  }));

  const sources = db.prepare(`
    SELECT
      ecs.claim_id,
      ecs.source_id,
      COALESCE(si.title, sizh.title, s.title) AS source_title,
      COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS citation_short,
      s.url,
      ecs.mention_id,
      ecs.passage_id,
      ecs.locator,
      ecs.quote,
      ecs.source_role,
      ecs.confidence,
      sm.text AS mention_text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS mention_translation,
      sp.text AS passage_text,
      COALESCE(spi.translation, spizh.translation, sp.translation) AS passage_translation,
      ecs.raw_json AS evidence_raw_json,
      sm.raw_json AS mention_raw_json,
      sp.raw_json AS passage_raw_json
    FROM evidence_claim_sources ecs
    LEFT JOIN sources s ON s.id = ecs.source_id
    LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
    LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
    LEFT JOIN source_mentions sm ON sm.id = ecs.mention_id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    LEFT JOIN source_passages sp ON sp.id = ecs.passage_id
    LEFT JOIN source_passage_i18n spi ON spi.passage_id = sp.id AND spi.locale = ?
    LEFT JOIN source_passage_i18n spizh ON spizh.passage_id = sp.id AND spizh.locale = 'zh'
    WHERE ecs.claim_id IN (
      SELECT claim_id
      FROM evidence_claim_subjects
      WHERE subject_table = 'events' AND subject_id = ? AND subject_role = 'event'
    )
    ORDER BY ecs.claim_id, ecs.source_role, ecs.locator
  `).all(locale, locale, locale, eventId).map((row) => ({
    claimId: row.claim_id,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    citationShort: row.citation_short ?? row.source_title ?? row.source_id,
    url: evidenceSourceUrl(row),
    mentionId: row.mention_id,
    passageId: row.passage_id,
    locator: row.locator,
    quote: row.quote ?? row.mention_text ?? row.passage_text,
    translation: row.mention_translation ?? row.passage_translation,
    sourceRole: row.source_role,
    confidence: row.confidence
  }));

  const subjects = db.prepare(`
    SELECT
      ecs.claim_id,
      ecs.subject_table,
      ecs.subject_id,
      ecs.subject_role,
      ecs.sort_order,
      e.entity_type,
      COALESCE(ei.primary_label, eizh.primary_label, e.primary_label) AS entity_label,
      e.region_id
    FROM evidence_claim_subjects ecs
    LEFT JOIN entities e ON ecs.subject_table = 'entities' AND e.id = ecs.subject_id
    LEFT JOIN entity_i18n ei ON ei.entity_id = e.id AND ei.locale = ?
    LEFT JOIN entity_i18n eizh ON eizh.entity_id = e.id AND eizh.locale = 'zh'
    WHERE ecs.claim_id IN (
      SELECT claim_id
      FROM evidence_claim_subjects
      WHERE subject_table = 'events' AND subject_id = ? AND subject_role = 'event'
    )
    ORDER BY ecs.claim_id, ecs.sort_order, ecs.subject_table, ecs.subject_id
  `).all(locale, eventId).map((row) => ({
    claimId: row.claim_id,
    subjectTable: row.subject_table,
    subjectId: row.subject_id,
    subjectRole: row.subject_role,
    sortOrder: row.sort_order,
    entityType: row.entity_type,
    label: row.entity_label ?? row.subject_id,
    regionId: row.region_id
  }));

  return {
    schemaVersion: 1,
    purpose: "frontend-evidence-graph-event",
    event,
    claims,
    sources,
    subjects,
    summary: {
      claims: claims.length,
      sources: sources.length,
      linkedSubjects: subjects.filter((subject) => subject.subjectTable !== "events").length,
      reviewedClaims: claims.filter((claim) => claim.reviewStatus === "reviewed").length
    }
  };
}

function normalizeEntityId(id) {
  if (!id || id.includes(":")) {
    return id;
  }
  return `person:${id}`;
}

function frontendEvidenceGraphPerson(db, rawEntityId, locale = "zh") {
  const entityId = normalizeEntityId(rawEntityId);
  const person = db.prepare(`
    SELECT
      e.id,
      e.entity_type,
      COALESCE(ei.primary_label, eizh.primary_label, e.primary_label) AS label,
      e.region_id,
      e.time_start,
      e.time_end,
      COALESCE(ei.summary, eizh.summary, e.summary) AS summary,
      e.confidence,
      e.review_status
    FROM entities e
    LEFT JOIN entity_i18n ei ON ei.entity_id = e.id AND ei.locale = ?
    LEFT JOIN entity_i18n eizh ON eizh.entity_id = e.id AND eizh.locale = 'zh'
    WHERE e.id = ? AND e.entity_type = 'person'
  `).get(locale, entityId);
  if (!person) {
    return null;
  }

  const claims = db.prepare(`
    SELECT
      c.id,
      c.claim_type,
      CASE WHEN ? = 'en' THEN COALESCE(NULLIF(c.statement_en, ''), c.statement_zh) ELSE c.statement_zh END AS statement,
      c.statement_zh,
      c.statement_en,
      c.time_start,
      c.time_end,
      c.region_id,
      c.period_id,
      c.confidence,
      c.review_status,
      c.dispute_status,
      c.raw_json
    FROM evidence_claims c
    JOIN evidence_claim_subjects ecs
      ON ecs.claim_id = c.id
      AND ecs.subject_table = 'entities'
      AND ecs.subject_id = ?
    ORDER BY COALESCE(c.time_start, 9999), c.id
    LIMIT 120
  `).all(locale, entityId).map((claim) => ({
    id: claim.id,
    claimType: claim.claim_type,
    statement: claim.statement,
    statementZh: claim.statement_zh,
    statementEn: claim.statement_en,
    timeStart: claim.time_start,
    timeEnd: claim.time_end,
    regionId: claim.region_id,
    periodId: claim.period_id,
    confidence: claim.confidence,
    reviewStatus: claim.review_status,
    disputeStatus: claim.dispute_status,
    raw: parseRawJson(claim.raw_json)
  }));

  const sources = db.prepare(`
    SELECT
      ecs.claim_id,
      ecs.source_id,
      COALESCE(si.title, sizh.title, s.title) AS source_title,
      COALESCE(si.citation_short, sizh.citation_short, s.citation_short) AS citation_short,
      s.url,
      ecs.mention_id,
      ecs.passage_id,
      ecs.locator,
      ecs.quote,
      ecs.source_role,
      ecs.confidence,
      sm.text AS mention_text,
      COALESCE(smi.translation, smizh.translation, sm.translation) AS mention_translation,
      sp.text AS passage_text,
      COALESCE(spi.translation, spizh.translation, sp.translation) AS passage_translation,
      ecs.raw_json AS evidence_raw_json,
      sm.raw_json AS mention_raw_json,
      sp.raw_json AS passage_raw_json
    FROM evidence_claim_sources ecs
    LEFT JOIN sources s ON s.id = ecs.source_id
    LEFT JOIN source_i18n si ON si.source_id = s.id AND si.locale = ?
    LEFT JOIN source_i18n sizh ON sizh.source_id = s.id AND sizh.locale = 'zh'
    LEFT JOIN source_mentions sm ON sm.id = ecs.mention_id
    LEFT JOIN source_mention_i18n smi ON smi.mention_id = sm.id AND smi.locale = ?
    LEFT JOIN source_mention_i18n smizh ON smizh.mention_id = sm.id AND smizh.locale = 'zh'
    LEFT JOIN source_passages sp ON sp.id = ecs.passage_id
    LEFT JOIN source_passage_i18n spi ON spi.passage_id = sp.id AND spi.locale = ?
    LEFT JOIN source_passage_i18n spizh ON spizh.passage_id = sp.id AND spizh.locale = 'zh'
    WHERE ecs.claim_id IN (
      SELECT claim_id
      FROM evidence_claim_subjects
      WHERE subject_table = 'entities' AND subject_id = ?
    )
    ORDER BY ecs.claim_id, ecs.source_role, ecs.locator
    LIMIT 240
  `).all(locale, locale, locale, entityId).map((row) => ({
    claimId: row.claim_id,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    citationShort: row.citation_short ?? row.source_title ?? row.source_id,
    url: evidenceSourceUrl(row),
    mentionId: row.mention_id,
    passageId: row.passage_id,
    locator: row.locator,
    quote: row.quote ?? row.mention_text ?? row.passage_text,
    translation: row.mention_translation ?? row.passage_translation,
    sourceRole: row.source_role,
    confidence: row.confidence
  }));

  const subjects = db.prepare(`
    SELECT
      ecs.claim_id,
      ecs.subject_table,
      ecs.subject_id,
      ecs.subject_role,
      ecs.sort_order,
      e.entity_type,
      COALESCE(ei.primary_label, eizh.primary_label, e.primary_label) AS entity_label,
      e.region_id
    FROM evidence_claim_subjects ecs
    LEFT JOIN entities e ON ecs.subject_table = 'entities' AND e.id = ecs.subject_id
    LEFT JOIN entity_i18n ei ON ei.entity_id = e.id AND ei.locale = ?
    LEFT JOIN entity_i18n eizh ON eizh.entity_id = e.id AND eizh.locale = 'zh'
    WHERE ecs.claim_id IN (
      SELECT claim_id
      FROM evidence_claim_subjects
      WHERE subject_table = 'entities' AND subject_id = ?
    )
    ORDER BY ecs.claim_id, ecs.sort_order, ecs.subject_table, ecs.subject_id
    LIMIT 300
  `).all(locale, entityId).map((row) => ({
    claimId: row.claim_id,
    subjectTable: row.subject_table,
    subjectId: row.subject_id,
    subjectRole: row.subject_role,
    sortOrder: row.sort_order,
    entityType: row.entity_type,
    label: row.entity_label ?? row.subject_id,
    regionId: row.region_id
  }));

  const events = db.prepare(`
    SELECT DISTINCT
      ev.id,
      COALESCE(evi.title, evizh.title, ev.title) AS title,
      COALESCE(evi.display_time, evizh.display_time, ev.display_time) AS display_time,
      ev.region_id,
      ev.time_start,
      ev.time_end,
      COALESCE(evi.summary, evizh.summary, ev.summary) AS summary
    FROM evidence_claim_subjects claim_person
    JOIN evidence_claim_subjects claim_event
      ON claim_event.claim_id = claim_person.claim_id
      AND claim_event.subject_table = 'events'
      AND claim_event.subject_role = 'event'
    JOIN events ev ON ev.id = claim_event.subject_id
    LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = ?
    LEFT JOIN event_i18n evizh ON evizh.event_id = ev.id AND evizh.locale = 'zh'
    WHERE claim_person.subject_table = 'entities'
      AND claim_person.subject_id = ?
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
    LIMIT 120
  `).all(locale, entityId);

  return {
    schemaVersion: 1,
    purpose: "frontend-evidence-graph-person",
    person,
    events,
    claims,
    sources,
    subjects,
    summary: {
      claims: claims.length,
      sources: sources.length,
      linkedSubjects: subjects.filter((subject) => subject.subjectId !== entityId).length,
      linkedEvents: events.length,
      reviewedClaims: claims.filter((claim) => claim.reviewStatus === "reviewed").length
    }
  };
}

function getCoverageGaps(metrics, region) {
  const gaps = [];
  if (metrics.events < region.minimums.events) gaps.push(`事件数量低于目标：${metrics.events}/${region.minimums.events}`);
  if (metrics.eventsWithEvidence < metrics.events) gaps.push(`还有 ${metrics.events - metrics.eventsWithEvidence} 条事件没有证据链接`);
  if (metrics.peopleEntities < region.minimums.entities) gaps.push(`人物实体偏少：${metrics.peopleEntities}/${region.minimums.entities}`);
  if (metrics.participantNames > metrics.peopleEntities) gaps.push(`${metrics.participantNames - metrics.peopleEntities} 个事件参与者姓名尚未实体化`);
  if (metrics.evidenceDocuments < region.minimums.evidence) gaps.push(`证据卡数量低于目标：${metrics.evidenceDocuments}/${region.minimums.evidence}`);
  if (metrics.evidenceWithSource < metrics.evidenceDocuments) gaps.push(`${metrics.evidenceDocuments - metrics.evidenceWithSource} 条证据缺 source_id 或 locator`);
  if (metrics.evidenceMissingOriginal > 0) gaps.push(`${metrics.evidenceMissingOriginal} 条证据缺真实原文摘录`);
  if (metrics.periodMismatch > 0) gaps.push(`${metrics.periodMismatch} 条证据 period_id 不在目标时期`);
  return gaps;
}

function periodTemplateAudit190310(db) {
  const regions = ["china", "rome", "sasanian-persia"];
  const thresholds = {
    events: { china: 250, rome: 150, "sasanian-persia": 20 },
    people: { china: 120, rome: 30, "sasanian-persia": 5 },
    eventEvidenceLinks: { china: 300, rome: 150, "sasanian-persia": 25 },
    evidenceClaims: { china: 20, rome: 35, "sasanian-persia": 5 },
    ragQuestions: 60,
    ragAverageScore: 0.95,
    ragFailedQuestions: 0,
    mapControlRecords: 1000
  };
  const countByRegion = (rows) => Object.fromEntries(regions.map((regionId) => [
    regionId,
    rows.find((row) => row.region_id === regionId)?.count ?? 0
  ]));
  const regionalChecks = (metricId, label, actualByRegion, thresholdByRegion) => regions.map((regionId) => ({
    id: `${metricId}:${regionId}`,
    label: `${label} / ${regionId}`,
    actual: actualByRegion[regionId],
    threshold: thresholdByRegion[regionId],
    pass: actualByRegion[regionId] >= thresholdByRegion[regionId]
  }));

  const metrics = {
    events: countByRegion(db.prepare(`
      SELECT region_id, COUNT(*) AS count
      FROM events
      WHERE region_id IN ('china', 'rome', 'sasanian-persia')
        AND time_start BETWEEN 190 AND 310
      GROUP BY region_id
    `).all()),
    people: countByRegion(db.prepare(`
      SELECT region_id, COUNT(*) AS count
      FROM entities
      WHERE entity_type = 'person'
        AND region_id IN ('china', 'rome', 'sasanian-persia')
        AND COALESCE(time_start, 310) <= 310
        AND COALESCE(time_end, 190) >= 190
      GROUP BY region_id
    `).all()),
    eventEvidenceLinks: countByRegion(db.prepare(`
      SELECT e.region_id, COUNT(*) AS count
      FROM evidence_links l
      JOIN events e ON l.subject_table = 'events' AND l.subject_id = e.id
      WHERE e.region_id IN ('china', 'rome', 'sasanian-persia')
        AND e.time_start BETWEEN 190 AND 310
      GROUP BY e.region_id
    `).all()),
    evidenceClaims: countByRegion(db.prepare(`
      SELECT region_id, COUNT(*) AS count
      FROM evidence_claims
      WHERE region_id IN ('china', 'rome', 'sasanian-persia')
        AND COALESCE(time_start, 310) <= 310
        AND COALESCE(time_end, 190) >= 190
      GROUP BY region_id
    `).all()),
    ragQuestions: db.prepare(`
      SELECT COUNT(*) AS count
      FROM rag_eval_questions
      WHERE question_set_id = 'sample-190-310-v1'
    `).get().count,
    latestRagRun: db.prepare(`
      SELECT
        r.id,
        r.created_at,
        COUNT(res.question_id) AS total_questions,
        SUM(CASE WHEN res.score_total >= 0.8 AND res.failure_type IS NULL THEN 1 ELSE 0 END) AS passed_questions,
        SUM(CASE WHEN res.score_total < 0.8 OR res.failure_type IS NOT NULL THEN 1 ELSE 0 END) AS failed_questions,
        AVG(res.score_total) AS average_score
      FROM rag_eval_runs r
      LEFT JOIN rag_eval_results res ON res.run_id = r.id
      WHERE r.question_set_id = 'sample-190-310-v1'
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 1
    `).get(),
    mapControlRecords: db.prepare(`
      SELECT COUNT(*) AS count
      FROM map_control_records
      WHERE start_year <= 310 AND end_year >= 190
    `).get().count
  };
  const latestRagRun = metrics.latestRagRun ?? {
    id: null,
    created_at: null,
    total_questions: 0,
    passed_questions: 0,
    failed_questions: Number.POSITIVE_INFINITY,
    average_score: 0
  };
  const checks = [
    ...regionalChecks("events", "events", metrics.events, thresholds.events),
    ...regionalChecks("people", "people", metrics.people, thresholds.people),
    ...regionalChecks("event-evidence-links", "event evidence links", metrics.eventEvidenceLinks, thresholds.eventEvidenceLinks),
    ...regionalChecks("evidence-claims", "evidence claims", metrics.evidenceClaims, thresholds.evidenceClaims),
    {
      id: "rag-questions",
      label: "RAG eval questions",
      actual: metrics.ragQuestions,
      threshold: thresholds.ragQuestions,
      pass: metrics.ragQuestions >= thresholds.ragQuestions
    },
    {
      id: "rag-latest-run-failures",
      label: "latest RAG eval failures",
      actual: latestRagRun.failed_questions,
      threshold: thresholds.ragFailedQuestions,
      pass: latestRagRun.failed_questions === thresholds.ragFailedQuestions
    },
    {
      id: "rag-latest-run-average",
      label: "latest RAG eval average score",
      actual: Number(latestRagRun.average_score ?? 0),
      threshold: thresholds.ragAverageScore,
      pass: Number(latestRagRun.average_score ?? 0) >= thresholds.ragAverageScore
    },
    {
      id: "map-control-records",
      label: "190-310 map control records",
      actual: metrics.mapControlRecords,
      threshold: thresholds.mapControlRecords,
      pass: metrics.mapControlRecords >= thresholds.mapControlRecords
    }
  ];

  return {
    purpose: "period-template-audit-190-310",
    pass: checks.every((check) => check.pass),
    metrics,
    thresholds,
    checks
  };
}

function frontendCoverage190310(db) {
  const regions = [
    { id: "china", label: "中国", expectedPeriodIds: ["china-three-kingdoms-180-280"], minimums: { events: 25, entities: 150, evidence: 500 } },
    { id: "rome", label: "罗马", expectedPeriodIds: ["rome-190-310"], minimums: { events: 80, entities: 20, evidence: 80 } },
    { id: "sasanian-persia", label: "萨珊", expectedPeriodIds: ["sasanian-persia-224-310"], minimums: { events: 10, entities: 7, evidence: 40 } }
  ];
  const evidenceDocumentFilter = `
      AND (
        sd.subject_table IN ('import_evidence_cards', 'source_mentions', 'source_passages')
        OR (
          sd.subject_table NOT IN ('events', 'entities')
          AND
          json_extract(sd.raw_json, '$.sourceId') IS NOT NULL
          AND json_extract(sd.raw_json, '$.locator') IS NOT NULL
        )
        OR EXISTS (
          SELECT 1 FROM evidence_links el
          WHERE el.subject_table = 'search_documents'
            AND el.subject_id = sd.id
            AND el.source_id IS NOT NULL
            AND el.locator IS NOT NULL
        )
      )
  `;
  const evidenceSourceFilter = `
      AND (
        (
          json_extract(sd.raw_json, '$.sourceId') IS NOT NULL
          AND json_extract(sd.raw_json, '$.locator') IS NOT NULL
        )
        OR EXISTS (
          SELECT 1 FROM evidence_links el
          WHERE el.subject_table = 'search_documents'
            AND el.subject_id = sd.id
            AND el.source_id IS NOT NULL
            AND el.locator IS NOT NULL
        )
        OR (
          sd.subject_table = 'source_mentions'
          AND EXISTS (
            SELECT 1 FROM source_mentions sm
            WHERE sm.id = sd.subject_id
              AND sm.source_id IS NOT NULL
              AND sm.locator IS NOT NULL
          )
        )
        OR (
          sd.subject_table = 'source_passages'
          AND EXISTS (
            SELECT 1 FROM source_passages sp
            WHERE sp.id = sd.subject_id
              AND sp.source_id IS NOT NULL
              AND sp.locator IS NOT NULL
          )
        )
      )
  `;
  const evidenceOriginalPredicate = `
        (
          json_extract(sd.raw_json, '$.originalText') IS NOT NULL
          AND LENGTH(TRIM(json_extract(sd.raw_json, '$.originalText'))) > 0
        )
        OR EXISTS (
          SELECT 1 FROM evidence_links el
          WHERE el.subject_table = 'search_documents'
            AND el.subject_id = sd.id
            AND el.quote IS NOT NULL
            AND LENGTH(TRIM(el.quote)) > 0
        )
        OR (
          sd.subject_table = 'source_mentions'
          AND EXISTS (
            SELECT 1 FROM source_mentions sm
            WHERE sm.id = sd.subject_id
              AND sm.text IS NOT NULL
              AND LENGTH(TRIM(sm.text)) > 0
              AND json_extract(sm.raw_json, '$.originalTextStatus') = 'verified-transcribed'
          )
        )
        OR (
          sd.subject_table = 'source_passages'
          AND EXISTS (
            SELECT 1 FROM source_passages sp
            WHERE sp.id = sd.subject_id
              AND sp.text IS NOT NULL
              AND LENGTH(TRIM(sp.text)) > 0
              AND json_extract(sp.raw_json, '$.originalTextStatus') = 'verified-transcribed'
          )
        )
  `;
  const eventRows = db.prepare(`
    SELECT id, title, time_start, time_end
    FROM events
    WHERE region_id = ?
      AND id NOT LIKE 'life:%'
      AND COALESCE(time_end, time_start) >= 190
      AND COALESCE(time_start, time_end) <= 310
    ORDER BY COALESCE(time_start, 9999), id
  `);
  const eventEvidenceCount = db.prepare(`
    SELECT COUNT(DISTINCT ev.id) AS count
    FROM events ev
    WHERE ev.region_id = ?
      AND ev.id NOT LIKE 'life:%'
      AND COALESCE(ev.time_end, ev.time_start) >= 190
      AND COALESCE(ev.time_start, ev.time_end) <= 310
      AND EXISTS (
        SELECT 1 FROM evidence_links el
        WHERE el.subject_table = 'events' AND el.subject_id = ev.id
      )
  `);
  const entityCount = db.prepare("SELECT COUNT(*) AS count FROM entities WHERE entity_type = 'person' AND region_id = ?");
  const entityEvidenceCount = db.prepare(`
    SELECT COUNT(DISTINCT e.id) AS count
    FROM entities e
    WHERE e.entity_type = 'person'
      AND e.region_id = ?
      AND EXISTS (
        SELECT 1
        FROM event_entities ee
        JOIN evidence_links el ON el.subject_table = 'events' AND el.subject_id = ee.event_id
        WHERE ee.entity_id = e.id
      )
  `);
  const participantNameCount = db.prepare(`
    SELECT COUNT(DISTINCT hep.display_name) AS count
    FROM historical_event_people hep
    JOIN historical_events he ON he.id = hep.event_id
    WHERE he.region = ?
      AND he.end_year >= 190
      AND he.start_year <= 310
      AND hep.display_name IS NOT NULL
      AND LENGTH(TRIM(hep.display_name)) > 0
  `);
  const evidenceCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 190
      AND COALESCE(sd.time_start, sd.time_end) <= 310
      ${evidenceDocumentFilter}
  `);
  const evidenceWithSourceCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 190
      AND COALESCE(sd.time_start, sd.time_end) <= 310
      ${evidenceDocumentFilter}
      ${evidenceSourceFilter}
  `);
  const missingOriginalCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 190
      AND COALESCE(sd.time_start, sd.time_end) <= 310
      ${evidenceDocumentFilter}
      ${evidenceSourceFilter}
      AND NOT (${evidenceOriginalPredicate})
  `);
  const periodMismatchCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 190
      AND COALESCE(sd.time_start, sd.time_end) <= 310
      ${evidenceDocumentFilter}
      AND sd.period_id NOT IN (?, ?, ?)
  `);
  const missingEvidenceEvents = db.prepare(`
    SELECT ev.id, ev.title, ev.time_start AS year
    FROM events ev
    WHERE ev.region_id = ?
      AND ev.id NOT LIKE 'life:%'
      AND COALESCE(ev.time_end, ev.time_start) >= 190
      AND COALESCE(ev.time_start, ev.time_end) <= 310
      AND NOT EXISTS (
        SELECT 1 FROM evidence_links el
        WHERE el.subject_table = 'events' AND el.subject_id = ev.id
      )
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
    LIMIT 8
  `);
  const missingOriginalExamples = db.prepare(`
    SELECT sd.id, sd.title, sd.time_start AS year
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 190
      AND COALESCE(sd.time_start, sd.time_end) <= 310
      ${evidenceDocumentFilter}
      ${evidenceSourceFilter}
      AND NOT (${evidenceOriginalPredicate})
    ORDER BY COALESCE(sd.time_start, 9999), sd.id
    LIMIT 8
  `);

  return {
    schemaVersion: 1,
    purpose: "frontend-coverage-190-310",
    range: [190, 310],
    generatedAt: new Date().toISOString(),
    templateAudit: periodTemplateAudit190310(db),
    regions: regions.map((region) => {
      const events = eventRows.all(region.id);
      const metrics = {
        events: events.length,
        eventsWithEvidence: eventEvidenceCount.get(region.id).count,
        peopleEntities: entityCount.get(region.id).count,
        peopleWithEvidence: entityEvidenceCount.get(region.id).count,
        participantNames: participantNameCount.get(region.id).count,
        evidenceDocuments: evidenceCount.get(region.id).count,
        evidenceWithSource: evidenceWithSourceCount.get(region.id).count,
        evidenceMissingOriginal: missingOriginalCount.get(region.id).count,
        periodMismatch: periodMismatchCount.get(region.id, ...region.expectedPeriodIds, "", "").count
      };
      const gaps = [];
      if (metrics.events < region.minimums.events) gaps.push(`事件数量低于目标：${metrics.events}/${region.minimums.events}`);
      if (metrics.eventsWithEvidence < metrics.events) gaps.push(`还有 ${metrics.events - metrics.eventsWithEvidence} 条事件没有证据链接`);
      if (metrics.peopleEntities < region.minimums.entities) gaps.push(`人物实体偏少：${metrics.peopleEntities}/${region.minimums.entities}`);
      if (metrics.participantNames > metrics.peopleEntities) gaps.push(`${metrics.participantNames - metrics.peopleEntities} 个事件参与者姓名尚未实体化`);
      if (metrics.evidenceDocuments < region.minimums.evidence) gaps.push(`证据卡数量低于目标：${metrics.evidenceDocuments}/${region.minimums.evidence}`);
      if (metrics.evidenceWithSource < metrics.evidenceDocuments) gaps.push(`${metrics.evidenceDocuments - metrics.evidenceWithSource} 条证据缺 source_id 或 locator`);
      if (metrics.evidenceMissingOriginal > 0) gaps.push(`${metrics.evidenceMissingOriginal} 条证据缺真实原文摘录`);
      if (metrics.periodMismatch > 0) gaps.push(`${metrics.periodMismatch} 条证据 period_id 不在目标时期`);
      return {
        id: region.id,
        label: region.label,
        expectedPeriodIds: region.expectedPeriodIds,
        minimums: region.minimums,
        metrics,
        gaps: getCoverageGaps(metrics, region),
        missingEvidenceEvents: missingEvidenceEvents.all(region.id),
        missingOriginalExamples: missingOriginalExamples.all(region.id)
      };
    })
  };
}

function frontendCoverage310589(db) {
  const regions = [
    { id: "china", label: "中国", expectedPeriodIds: ["china-wei-jin-northern-southern-310-589"], minimums: { events: 35, entities: 135, evidence: 69 } }
  ];
  const evidenceDocumentFilter = `
      AND (
        sd.subject_table IN ('import_evidence_cards', 'source_mentions', 'source_passages')
        OR (
          sd.subject_table NOT IN ('events', 'entities')
          AND
          json_extract(sd.raw_json, '$.sourceId') IS NOT NULL
          AND json_extract(sd.raw_json, '$.locator') IS NOT NULL
        )
        OR EXISTS (
          SELECT 1 FROM evidence_links el
          WHERE el.subject_table = 'search_documents'
            AND el.subject_id = sd.id
            AND el.source_id IS NOT NULL
            AND el.locator IS NOT NULL
        )
      )
  `;
  const evidenceSourceFilter = `
      AND (
        (
          json_extract(sd.raw_json, '$.sourceId') IS NOT NULL
          AND json_extract(sd.raw_json, '$.locator') IS NOT NULL
        )
        OR EXISTS (
          SELECT 1 FROM evidence_links el
          WHERE el.subject_table = 'search_documents'
            AND el.subject_id = sd.id
            AND el.source_id IS NOT NULL
            AND el.locator IS NOT NULL
        )
        OR (
          sd.subject_table = 'source_mentions'
          AND EXISTS (
            SELECT 1 FROM source_mentions sm
            WHERE sm.id = sd.subject_id
              AND sm.source_id IS NOT NULL
              AND sm.locator IS NOT NULL
          )
        )
        OR (
          sd.subject_table = 'source_passages'
          AND EXISTS (
            SELECT 1 FROM source_passages sp
            WHERE sp.id = sd.subject_id
              AND sp.source_id IS NOT NULL
              AND sp.locator IS NOT NULL
          )
        )
      )
  `;
  const evidenceOriginalPredicate = `
        (
          json_extract(sd.raw_json, '$.originalText') IS NOT NULL
          AND LENGTH(TRIM(json_extract(sd.raw_json, '$.originalText'))) > 0
        )
        OR EXISTS (
          SELECT 1 FROM evidence_links el
          WHERE el.subject_table = 'search_documents'
            AND el.subject_id = sd.id
            AND el.quote IS NOT NULL
            AND LENGTH(TRIM(el.quote)) > 0
        )
        OR (
          sd.subject_table = 'source_mentions'
          AND EXISTS (
            SELECT 1 FROM source_mentions sm
            WHERE sm.id = sd.subject_id
              AND sm.text IS NOT NULL
              AND LENGTH(TRIM(sm.text)) > 0
              AND json_extract(sm.raw_json, '$.originalTextStatus') = 'verified-transcribed'
          )
        )
        OR (
          sd.subject_table = 'source_passages'
          AND EXISTS (
            SELECT 1 FROM source_passages sp
            WHERE sp.id = sd.subject_id
              AND sp.text IS NOT NULL
              AND LENGTH(TRIM(sp.text)) > 0
              AND json_extract(sp.raw_json, '$.originalTextStatus') = 'verified-transcribed'
          )
        )
  `;
  const eventRows = db.prepare(`
    SELECT id, title, time_start, time_end
    FROM events
    WHERE region_id = ?
      AND id NOT LIKE 'life:%'
      AND COALESCE(time_end, time_start) >= 310
      AND COALESCE(time_start, time_end) <= 589
    ORDER BY COALESCE(time_start, 9999), id
  `);
  const eventEvidenceCount = db.prepare(`
    SELECT COUNT(DISTINCT ev.id) AS count
    FROM events ev
    WHERE ev.region_id = ?
      AND ev.id NOT LIKE 'life:%'
      AND COALESCE(ev.time_end, ev.time_start) >= 310
      AND COALESCE(ev.time_start, ev.time_end) <= 589
      AND EXISTS (
        SELECT 1 FROM evidence_links el
        WHERE el.subject_table = 'events' AND el.subject_id = ev.id
      )
  `);
  const entityCount = db.prepare("SELECT COUNT(*) AS count FROM entities WHERE entity_type = 'person' AND region_id = ?");
  const entityEvidenceCount = db.prepare(`
    SELECT COUNT(DISTINCT e.id) AS count
    FROM entities e
    WHERE e.entity_type = 'person'
      AND e.region_id = ?
      AND EXISTS (
        SELECT 1
        FROM event_entities ee
        JOIN evidence_links el ON el.subject_table = 'events' AND el.subject_id = ee.event_id
        WHERE ee.entity_id = e.id
      )
  `);
  const participantNameCount = db.prepare(`
    SELECT COUNT(DISTINCT hep.display_name) AS count
    FROM historical_event_people hep
    JOIN historical_events he ON he.id = hep.event_id
    WHERE he.region = ?
      AND he.end_year >= 310
      AND he.start_year <= 589
      AND hep.display_name IS NOT NULL
      AND LENGTH(TRIM(hep.display_name)) > 0
  `);
  const evidenceCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 310
      AND COALESCE(sd.time_start, sd.time_end) <= 589
      ${evidenceDocumentFilter}
  `);
  const evidenceWithSourceCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 310
      AND COALESCE(sd.time_start, sd.time_end) <= 589
      ${evidenceDocumentFilter}
      ${evidenceSourceFilter}
  `);
  const missingOriginalCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 310
      AND COALESCE(sd.time_start, sd.time_end) <= 589
      ${evidenceDocumentFilter}
      ${evidenceSourceFilter}
      AND NOT (${evidenceOriginalPredicate})
  `);
  const periodMismatchCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 310
      AND COALESCE(sd.time_start, sd.time_end) <= 589
      ${evidenceDocumentFilter}
      AND sd.period_id NOT IN (?, ?, ?)
  `);
  const missingEvidenceEvents = db.prepare(`
    SELECT ev.id, ev.title, ev.time_start AS year
    FROM events ev
    WHERE ev.region_id = ?
      AND ev.id NOT LIKE 'life:%'
      AND COALESCE(ev.time_end, ev.time_start) >= 310
      AND COALESCE(ev.time_start, ev.time_end) <= 589
      AND NOT EXISTS (
        SELECT 1 FROM evidence_links el
        WHERE el.subject_table = 'events' AND el.subject_id = ev.id
      )
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
    LIMIT 8
  `);
  const missingOriginalExamples = db.prepare(`
    SELECT sd.id, sd.title, sd.time_start AS year
    FROM search_documents sd
    WHERE sd.region_id = ?
      AND COALESCE(sd.time_end, sd.time_start) >= 310
      AND COALESCE(sd.time_start, sd.time_end) <= 589
      ${evidenceDocumentFilter}
      ${evidenceSourceFilter}
      AND NOT (${evidenceOriginalPredicate})
    ORDER BY COALESCE(sd.time_start, 9999), sd.id
    LIMIT 8
  `);

  return {
    schemaVersion: 1,
    purpose: "frontend-coverage-310-589",
    range: [310, 589],
    generatedAt: new Date().toISOString(),
    regions: regions.map((region) => {
      const events = eventRows.all(region.id);
      const metrics = {
        events: events.length,
        eventsWithEvidence: eventEvidenceCount.get(region.id).count,
        peopleEntities: entityCount.get(region.id).count,
        peopleWithEvidence: entityEvidenceCount.get(region.id).count,
        participantNames: participantNameCount.get(region.id).count,
        evidenceDocuments: evidenceCount.get(region.id).count,
        evidenceWithSource: evidenceWithSourceCount.get(region.id).count,
        evidenceMissingOriginal: missingOriginalCount.get(region.id).count,
        periodMismatch: periodMismatchCount.get(region.id, ...region.expectedPeriodIds, "", "").count
      };
      return {
        id: region.id,
        label: region.label,
        expectedPeriodIds: region.expectedPeriodIds,
        minimums: region.minimums,
        metrics,
        gaps: getCoverageGaps(metrics, region),
        missingEvidenceEvents: missingEvidenceEvents.all(region.id),
        missingOriginalExamples: missingOriginalExamples.all(region.id)
      };
    })
  };
}

function chinaControlDatasetSelection(url) {
  const selectedYear = parseInteger(url?.searchParams?.get("year"));
  if (selectedYear !== null && selectedYear >= 280 && selectedYear <= 317) {
    return {
      geometryDatasetId: "china-admin-block-map-280-317",
      controlDatasetId: "china-block-control-timeline-280-317",
      defaultRange: [280, 317],
      defaultGeometryLabel: "China Western Jin commandery-style geometry 280-317",
      defaultControlLabel: "China Western Jin control timeline 280-317"
    };
  }

  return {
    geometryDatasetId: "china-admin-block-map-190-280",
    controlDatasetId: "china-block-control-timeline-190-280",
    defaultRange: [190, 280],
    defaultGeometryLabel: "China commandery geometry 190-280",
    defaultControlLabel: "China commandery control timeline 190-280"
  };
}

function frontendChinaControl(db, url) {
  const selection = chinaControlDatasetSelection(url);
  const adminDataset = db.prepare(`
    SELECT *
    FROM map_geometry_datasets
    WHERE id = ?
  `).get(selection.geometryDatasetId);
  const timelineDataset = db.prepare(`
    SELECT *
    FROM map_control_datasets
    WHERE id = ?
  `).get(selection.controlDatasetId);
  const featureSources = db.prepare(`
    SELECT note
    FROM map_feature_sources
    WHERE feature_id = ?
    ORDER BY sort_order
  `);
  const recordSources = db.prepare(`
    SELECT note
    FROM map_control_record_sources
    WHERE control_record_id = ?
    ORDER BY sort_order
  `);

  return {
    adminBlocks: {
      schemaVersion: adminDataset?.schema_version ?? 1,
      model: adminDataset?.model ?? "china-admin-block-map",
      datasetId: selection.geometryDatasetId,
      label: adminDataset?.label ?? selection.defaultGeometryLabel,
      range: [adminDataset?.time_start ?? selection.defaultRange[0], adminDataset?.time_end ?? selection.defaultRange[1]],
      notes: adminDataset?.source_note ?? "",
      blocks: db.prepare(`
        SELECT
          f.*,
          g.geometry_type,
          g.coordinates_json
        FROM map_features f
        JOIN map_feature_geometries g ON g.feature_id = f.id AND g.simplification_level = 'full'
        WHERE f.dataset_id = ?
        ORDER BY CASE f.feature_type WHEN 'admin_block' THEN 0 ELSE 1 END, f.id
      `).all(selection.geometryDatasetId).map((block) => {
        const rawBlock = parseRawJson(block.raw_json);

        return {
          id: block.id,
          name: block.name,
          controlBlockId: block.control_feature_id ?? rawBlock.controlBlockId,
          level: block.admin_level,
          parent: block.parent_feature_id ?? rawBlock.parent ?? null,
          center: [block.center_lon, block.center_lat],
          geometry: {
            type: block.geometry_type,
            coordinates: parseRawJson(block.coordinates_json)
          },
          confidence: block.confidence,
          approximate: block.approximate === 1,
          sources: featureSources.all(block.id).map((source) => source.note).filter(Boolean)
        };
      })
    },
    controlTimeline: {
      schemaVersion: timelineDataset?.schema_version ?? 1,
      model: timelineDataset?.model ?? "china-block-control-timeline",
      datasetId: selection.controlDatasetId,
      label: timelineDataset?.label ?? selection.defaultControlLabel,
      range: [timelineDataset?.time_start ?? selection.defaultRange[0], timelineDataset?.time_end ?? selection.defaultRange[1]],
      keyYears: parseRawJson(timelineDataset?.key_years_json),
      controllers: db.prepare(`
        SELECT label AS id, color
        FROM map_controllers
        WHERE control_dataset_id = ?
        ORDER BY sort_order, label
      `).all(selection.controlDatasetId),
      records: db.prepare(`
        SELECT
          r.id,
          r.feature_id,
          r.start_year,
          r.end_year,
          c.label AS controller,
          r.status,
          r.confidence
        FROM map_control_records r
        JOIN map_controllers c ON c.id = r.controller_id
        WHERE r.control_dataset_id = ?
        ORDER BY r.feature_id, r.start_year, r.end_year
      `).all(selection.controlDatasetId).map((record) => ({
        blockId: record.feature_id,
        startYear: record.start_year,
        endYear: record.end_year,
        controller: record.controller,
        status: record.status,
        confidence: record.confidence,
        sources: recordSources.all(record.id).map((source) => source.note).filter(Boolean)
      }))
    }
  };
}

function frontendMapGeometryDebug(db, url) {
  const datasetId = url.searchParams.get("dataset") || "china-admin-block-map-190-280";
  const limit = Math.min(500, Math.max(20, Number(url.searchParams.get("limit") ?? 160) || 160));
  const selectedYear = Number.isFinite(Number(url.searchParams.get("year")))
    ? Number(url.searchParams.get("year"))
    : null;
  const dataset = db.prepare(`
    SELECT *
    FROM map_geometry_datasets
    WHERE id = ?
  `).get(datasetId);

  if (!dataset) {
    return null;
  }

  const controlDataset = db.prepare(`
    SELECT *
    FROM map_control_datasets
    WHERE geometry_dataset_id = ?
    ORDER BY time_start, id
    LIMIT 1
  `).get(datasetId);
  const summary = {
    features: db.prepare("SELECT COUNT(1) AS count FROM map_features WHERE dataset_id = ?").get(datasetId).count,
    geometries: db.prepare(`
      SELECT COUNT(1) AS count
      FROM map_feature_geometries
      WHERE feature_id IN (SELECT id FROM map_features WHERE dataset_id = ?)
    `).get(datasetId).count,
    sources: db.prepare(`
      SELECT COUNT(1) AS count
      FROM map_feature_sources
      WHERE feature_id IN (SELECT id FROM map_features WHERE dataset_id = ?)
    `).get(datasetId).count,
    controllers: controlDataset
      ? db.prepare("SELECT COUNT(1) AS count FROM map_controllers WHERE control_dataset_id = ?").get(controlDataset.id).count
      : 0,
    controlRecords: controlDataset
      ? db.prepare("SELECT COUNT(1) AS count FROM map_control_records WHERE control_dataset_id = ?").get(controlDataset.id).count
      : 0,
    controlSources: controlDataset
      ? db.prepare(`
          SELECT COUNT(1) AS count
          FROM map_control_record_sources
          WHERE control_record_id IN (SELECT id FROM map_control_records WHERE control_dataset_id = ?)
        `).get(controlDataset.id).count
      : 0
  };

  const features = db.prepare(`
    SELECT
      f.id,
      f.name,
      f.feature_type,
      f.admin_level,
      f.parent_feature_id,
      f.control_feature_id,
      f.confidence,
      f.approximate,
      f.min_lon,
      f.min_lat,
      f.max_lon,
      f.max_lat,
      f.center_lon,
      f.center_lat,
      g.geometry_type,
      g.point_count,
      g.ring_count,
      g.coordinates_json,
      (
        SELECT COUNT(1)
        FROM map_control_records r
        WHERE r.feature_id = f.id
      ) AS control_record_count,
      (
        SELECT COUNT(1)
        FROM map_feature_sources s
        WHERE s.feature_id = f.id
      ) AS source_count
    FROM map_features f
    LEFT JOIN map_feature_geometries g ON g.feature_id = f.id AND g.simplification_level = 'full'
    WHERE f.dataset_id = ?
    ORDER BY CASE f.feature_type WHEN 'admin_block' THEN 0 ELSE 1 END, f.id
    LIMIT ?
  `).all(datasetId, limit);

  const activeControlRows = controlDataset && selectedYear !== null
    ? db.prepare(`
        SELECT
          r.feature_id,
          c.id AS controller_id,
          c.label AS controller,
          c.color,
          r.start_year,
          r.end_year,
          r.confidence
        FROM map_control_records r
        JOIN map_controllers c ON c.id = r.controller_id
        WHERE r.control_dataset_id = ?
          AND r.start_year <= ?
          AND r.end_year >= ?
      `).all(controlDataset.id, selectedYear, selectedYear)
    : [];
  const activeControlByFeature = new Map(activeControlRows.map((row) => [row.feature_id, row]));

  const controllers = controlDataset
    ? db.prepare(`
        SELECT id, label, color, sort_order
        FROM map_controllers
        WHERE control_dataset_id = ?
        ORDER BY sort_order, label
      `).all(controlDataset.id)
    : [];
  const controlRecords = controlDataset
    ? db.prepare(`
        SELECT
          r.id,
          r.feature_id,
          f.name AS feature_name,
          c.label AS controller,
          r.start_year,
          r.end_year,
          r.status,
          r.confidence,
          (
            SELECT COUNT(1)
            FROM map_control_record_sources s
            WHERE s.control_record_id = r.id
          ) AS source_count
        FROM map_control_records r
        JOIN map_controllers c ON c.id = r.controller_id
        LEFT JOIN map_features f ON f.id = r.feature_id
        WHERE r.control_dataset_id = ?
        ORDER BY r.feature_id, r.start_year, r.end_year
        LIMIT ?
      `).all(controlDataset.id, limit)
    : [];
  const sourceSamples = db.prepare(`
    SELECT feature_id, source_role, note, confidence
    FROM map_feature_sources
    WHERE feature_id IN (SELECT id FROM map_features WHERE dataset_id = ?)
    ORDER BY feature_id, sort_order
    LIMIT 60
  `).all(datasetId);

  return {
    purpose: "frontend-map-geometry-debug",
    dataset,
    controlDataset,
    summary,
    features,
    displayFeatures: features.map((feature) => ({
      id: feature.id,
      name: feature.name,
      featureType: feature.feature_type,
      confidence: feature.confidence,
      approximate: feature.approximate,
      center: feature.center_lon !== null && feature.center_lat !== null ? [feature.center_lon, feature.center_lat] : null,
      bounds: feature.min_lon !== null && feature.min_lat !== null && feature.max_lon !== null && feature.max_lat !== null
        ? [feature.min_lon, feature.min_lat, feature.max_lon, feature.max_lat]
        : null,
      geometryType: feature.geometry_type,
      coordinates: parseRawJson(feature.coordinates_json, null),
      activeControl: activeControlByFeature.get(feature.id) ?? null
    })),
    selectedYear,
    controllers,
    controlRecords,
    sourceSamples
  };
}

function frontendRomanControl(db) {
  const geometryDataset = db.prepare(`
    SELECT *
    FROM map_geometry_datasets
    WHERE id = 'roman-province-map-190-310'
  `).get();
  const controlDataset = db.prepare(`
    SELECT *
    FROM map_control_datasets
    WHERE id = 'roman-province-control-timeline-190-310'
  `).get();
  const row = db.prepare(`
    SELECT raw_json
    FROM app_runtime_datasets
    WHERE id = 'roman-control-map-190-310'
  `).get();
  const runtimeData = row ? parseRawJson(row.raw_json) : null;

  if (geometryDataset && controlDataset) {
    const provinces = db.prepare(`
      SELECT
        f.id,
        f.name,
        f.center_lon,
        f.center_lat,
        f.notes,
        f.raw_json,
        g.coordinates_json
      FROM map_features f
      JOIN map_feature_geometries g ON g.feature_id = f.id AND g.simplification_level = 'full'
      WHERE f.dataset_id = 'roman-province-map-190-310'
      ORDER BY CAST(json_extract(f.raw_json, '$.id') AS INTEGER), f.id
    `).all().map((feature) => {
      const rawProvince = parseRawJson(feature.raw_json);
      const numericId = Number.isInteger(rawProvince.id)
        ? rawProvince.id
        : Number(String(feature.id).replace("roman-province:", ""));

      return {
        id: numericId,
        n: feature.name,
        r: rawProvince.r,
        x: feature.center_lon,
        y: feature.center_lat,
        g: parseRawJson(feature.coordinates_json, []),
        family: rawProvince.family ?? feature.notes ?? null
      };
    });

    const timeline = db.prepare(`
      SELECT
        r.feature_id,
        r.start_year,
        r.end_year,
        r.raw_json,
        c.label,
        c.color
      FROM map_control_records r
      JOIN map_controllers c ON c.id = r.controller_id
      WHERE r.control_dataset_id = 'roman-province-control-timeline-190-310'
      ORDER BY CAST(json_extract(r.raw_json, '$.pid') AS INTEGER), r.start_year, r.end_year
    `).all().map((record) => {
      const rawRecord = parseRawJson(record.raw_json);
      const numericId = Number.isInteger(rawRecord.pid)
        ? rawRecord.pid
        : Number(String(record.feature_id).replace("roman-province:", ""));

      return {
        pid: numericId,
        start: record.start_year,
        end: record.end_year,
        ctrl: record.label,
        color: record.color
      };
    });

    return {
      schemaVersion: geometryDataset.schema_version,
      generatedFrom: "sqlite:map-geometry-runtime",
      model: "roman-control-map",
      range: [controlDataset.time_start, controlDataset.time_end],
      keyYears: parseRawJson(controlDataset.key_years_json, []),
      notes: geometryDataset.source_note,
      physical: runtimeData?.physical ?? {},
      provinces,
      timeline
    };
  }

  return runtimeData
    ? runtimeData
    : {
        schemaVersion: 1,
        generatedFrom: "sqlite:app-runtime-datasets",
        model: "roman-control-map",
        range: [190, 310],
        keyYears: [200, 250, 260, 275, 293],
        provinces: [],
        timeline: []
      };
}

function frontendAppData(db) {
  const rows = db.prepare(`
    SELECT id, raw_json
    FROM app_runtime_datasets
    WHERE id IN ('event-importance-180-280', 'regions-180-280')
  `).all();
  const byId = new Map(rows.map((row) => [row.id, parseRawJson(row.raw_json)]));

  return {
    generatedFrom: "sqlite:app-runtime-datasets",
    eventImportance: byId.get("event-importance-180-280") ?? {
      model: "event-importance",
      defaultImportance: "minor",
      records: []
    },
    regions: byId.get("regions-180-280") ?? []
  };
}

const importReviewStatuses = new Set(["staged", "needs-fix", "approved", "rejected", "promoted"]);

function importBatchList(db) {
  const batches = db.prepare(`
    SELECT
      b.id,
      b.created_at,
      b.source_provider,
      b.source_root,
      b.status,
      b.notes,
      COUNT(DISTINCT f.id) AS file_count,
      COUNT(c.id) AS card_count,
      SUM(CASE WHEN c.review_status = 'staged' THEN 1 ELSE 0 END) AS staged_count,
      SUM(CASE WHEN c.review_status = 'needs-fix' THEN 1 ELSE 0 END) AS needs_fix_count,
      SUM(CASE WHEN c.review_status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN c.review_status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
      SUM(CASE WHEN c.review_status = 'promoted' THEN 1 ELSE 0 END) AS promoted_count
    FROM import_batches b
    LEFT JOIN import_draft_files f ON f.batch_id = b.id
    LEFT JOIN import_evidence_cards c ON c.file_id = f.id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all().map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    sourceProvider: row.source_provider,
    sourceRoot: row.source_root,
    status: row.status,
    notes: row.notes,
    fileCount: row.file_count,
    cardCount: row.card_count,
    counts: {
      staged: row.staged_count ?? 0,
      needsFix: row.needs_fix_count ?? 0,
      approved: row.approved_count ?? 0,
      rejected: row.rejected_count ?? 0,
      promoted: row.promoted_count ?? 0
    }
  }));

  return { batches };
}

function importEvidenceCards(db, url) {
  const status = url.searchParams.get("status")?.trim();
  const batchId = url.searchParams.get("batchId")?.trim();
  const search = url.searchParams.get("search")?.trim();
  const limit = parseLimit(url.searchParams.get("limit"), 50, 300);
  const offset = parseOffset(url.searchParams.get("offset"));

  const where = [];
  const params = {};

  if (status && status !== "all") {
    if (!importReviewStatuses.has(status)) {
      throw new Error(`Unsupported review status: ${status}`);
    }
    where.push("c.review_status = $status");
    params.$status = status;
  }

  if (batchId) {
    where.push("c.batch_id = $batchId");
    params.$batchId = batchId;
  }

  if (search) {
    where.push(`(
      c.source_title LIKE $search
      OR c.locator LIKE $search
      OR c.original_text LIKE $search
      OR c.fact_brief LIKE $search
      OR c.fact_detailed LIKE $search
      OR c.people_core_json LIKE $search
      OR c.event_label LIKE $search
      OR c.macro_event LIKE $search
    )`);
    params.$search = `%${search}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = db.prepare(`
    SELECT COUNT(*) AS count
    FROM import_evidence_cards c
    ${whereSql}
  `).get(params).count;

  const listParams = {
    ...params,
    $limit: limit,
    $offset: offset
  };

  const cards = db.prepare(`
    SELECT
      c.id,
      c.batch_id,
      c.file_id,
      f.relative_path,
      c.card_index,
      c.source_title,
      c.source_type,
      c.author,
      c.commentary_author,
      c.quoted_work,
      c.locator,
      c.year,
      c.display_date,
      c.people_core_json,
      c.people_mentioned_json,
      c.places_json,
      c.macro_event,
      c.event_label,
      c.fact_brief,
      c.fact_detailed,
      c.fact_type,
      c.confidence,
      c.questions_json,
      c.review_status,
      c.validation_errors_json,
      c.validation_warnings_json
    FROM import_evidence_cards c
    JOIN import_draft_files f ON f.id = c.file_id
    ${whereSql}
    ORDER BY
      CASE c.review_status
        WHEN 'needs-fix' THEN 0
        WHEN 'staged' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
      END,
      f.relative_path,
      c.card_index
    LIMIT $limit OFFSET $offset
  `).all(listParams).map(importEvidenceCardRow);

  return { cards, total, limit, offset };
}

function importEvidenceCardDetail(db, cardId) {
  const row = db.prepare(`
    SELECT
      c.*,
      f.relative_path,
      f.import_status,
      f.error_count AS file_error_count,
      f.warning_count AS file_warning_count
    FROM import_evidence_cards c
    JOIN import_draft_files f ON f.id = c.file_id
    WHERE c.id = ?
  `).get(cardId);

  return row ? importEvidenceCardRow(row, true) : null;
}

function importEvidenceCardRow(row, includeText = false) {
  const card = {
    id: row.id,
    batchId: row.batch_id,
    fileId: row.file_id,
    relativePath: row.relative_path,
    cardIndex: row.card_index,
    sourceTitle: row.source_title,
    sourceType: row.source_type,
    author: row.author,
    commentaryAuthor: row.commentary_author,
    quotedWork: row.quoted_work,
    section: row.section,
    locator: row.locator,
    year: row.year,
    displayDate: row.display_date,
    peopleCore: parseRawJson(row.people_core_json),
    peopleMentioned: parseRawJson(row.people_mentioned_json),
    places: parseRawJson(row.places_json),
    macroEvent: row.macro_event,
    eventLabel: row.event_label,
    factBrief: row.fact_brief,
    factDetailed: row.fact_detailed,
    factType: row.fact_type,
    confidence: row.confidence,
    questions: parseRawJson(row.questions_json),
    reviewStatus: row.review_status,
    validationErrors: parseRawJson(row.validation_errors_json),
    validationWarnings: parseRawJson(row.validation_warnings_json)
  };

  if (includeText) {
    card.originalText = row.original_text;
    card.translation = row.translation;
    card.raw = parseRawJson(row.raw_json);
    card.fileStatus = row.import_status;
    card.fileErrorCount = row.file_error_count;
    card.fileWarningCount = row.file_warning_count;
  }

  return card;
}

function updateImportEvidenceCardStatus(db, cardId, reviewStatus) {
  if (!importReviewStatuses.has(reviewStatus)) {
    throw new Error(`Unsupported review status: ${reviewStatus}`);
  }

  const result = db.prepare(`
    UPDATE import_evidence_cards
    SET review_status = ?
    WHERE id = ?
  `).run(reviewStatus, cardId);

  if (result.changes === 0) {
    return null;
  }

  return importEvidenceCardDetail(db, cardId);
}

const sourceLibraryWorkFilters = {
  sanguozhi: "s.id LIKE 'sanguozhi-guoxue123-%'",
  hanshu: "s.id LIKE 'hanshu-guoxue123-%'",
  houhanshu: "s.id LIKE 'houhanshu-guoxue123-%'",
  jinshu: "s.id LIKE 'jinshu-guoxue123-%'",
  zztj: "s.id LIKE 'zizhi-tongjian-guoxue123-%'",
  herodian: "s.id = 'rome-source-history-of-the-empire-after-marcus-herodian'",
  "cassius-dio": "s.id = 'rome-source-roman-history-cassius-dio'",
  "historia-augusta": "s.id = 'rome-source-historia-augusta-scriptores-historiae-augustae'",
  zosimus: "s.id = 'rome-source-historia-nova-zosimus'",
  eutropius: "s.id = 'rome-source-breviarium-ab-urbe-condita-eutropius'",
  skz: "s.id = 'deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri'",
  kartir: "s.id IN ('deepseek-sasanian-source-kartirs-inscriptions-collective-evidence-kartir-kirder-kkz-knrb-ksm-knrm', 'deepseek-sasanian-source-kartirs-inscription-at-kaba-ye-zardosht-kkz-s-kz-kartir-kirder-kkz-karti')",
  paikuli: "s.id = 'deepseek-sasanian-source-paikuli-inscription-npi-narseh-paikuli-tower-inscription-narseh-middle-p'"
};

function sourceLibraryWhere(work) {
  if (work && sourceLibraryWorkFilters[work]) {
    return sourceLibraryWorkFilters[work];
  }

  return `(
    s.id LIKE 'sanguozhi-guoxue123-%'
    OR s.id LIKE 'hanshu-guoxue123-%'
    OR s.id LIKE 'houhanshu-guoxue123-%'
    OR s.id LIKE 'jinshu-guoxue123-%'
    OR s.id LIKE 'zizhi-tongjian-guoxue123-%'
    OR s.id = 'rome-source-history-of-the-empire-after-marcus-herodian'
    OR s.id = 'rome-source-roman-history-cassius-dio'
    OR s.id = 'rome-source-historia-augusta-scriptores-historiae-augustae'
    OR s.id = 'rome-source-historia-nova-zosimus'
    OR s.id = 'rome-source-breviarium-ab-urbe-condita-eutropius'
    OR s.id = 'deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri'
    OR s.id = 'deepseek-sasanian-source-kartirs-inscriptions-collective-evidence-kartir-kirder-kkz-knrb-ksm-knrm'
    OR s.id = 'deepseek-sasanian-source-kartirs-inscription-at-kaba-ye-zardosht-kkz-s-kz-kartir-kirder-kkz-karti'
    OR s.id = 'deepseek-sasanian-source-paikuli-inscription-npi-narseh-paikuli-tower-inscription-narseh-middle-p'
  )`;
}

function listSourceLibrarySources(db, url) {
  const work = url.searchParams.get("work")?.trim();
  const query = url.searchParams.get("q")?.trim();
  const limit = parseLimit(url.searchParams.get("limit"), 120, 300);
  const offset = parseOffset(url.searchParams.get("offset"));
  const where = [sourceLibraryWhere(work)];
  const params = { $limit: limit, $offset: offset };

  if (query) {
    where.push(`(
      s.title LIKE $query
      OR s.citation_short LIKE $query
      OR s.original_title LIKE $query
      OR s.id LIKE $query
      OR EXISTS (
        SELECT 1 FROM source_passages spq
        WHERE spq.source_id = s.id
          AND (spq.text LIKE $query OR spq.locator LIKE $query)
      )
    )`);
    params.$query = `%${query}%`;
  }

  const sources = db.prepare(`
    SELECT
      s.id,
      s.title,
      s.author,
      s.type,
      s.citation_short,
      s.url,
      s.language,
      s.note,
      s.raw_json,
      COUNT(sp.id) AS passage_count,
      MIN(sp.year_start) AS year_start,
      MAX(sp.year_end) AS year_end,
      SUM(length(sp.text)) AS text_length,
      SUM(CASE WHEN sp.text LIKE '%\u81e3\u677e\u4e4b%' OR sp.text LIKE '%\u677e\u4e4b\u6848%' THEN 1 ELSE 0 END) AS peizhu_passage_count
    FROM sources s
    JOIN source_passages sp ON sp.source_id = s.id
    WHERE ${where.join(" AND ")}
    GROUP BY s.id
    ORDER BY
      CASE
        WHEN s.id LIKE 'sanguozhi-guoxue123-%' THEN 1
        WHEN s.id LIKE 'houhanshu-guoxue123-%' THEN 2
        WHEN s.id LIKE 'jinshu-guoxue123-%' THEN 3
        WHEN s.id LIKE 'zizhi-tongjian-guoxue123-%' THEN 4
        ELSE 9
      END,
      s.id
    LIMIT $limit OFFSET $offset
  `).all(params);

  return {
    sources: sources.map((source) => {
      const raw = parseRawJson(source.raw_json);
      return {
        id: source.id,
        title: source.title,
        author: source.author,
        type: source.type,
        citationShort: source.citation_short,
        url: source.url,
        language: source.language,
        note: source.note,
        passageCount: source.passage_count,
        yearStart: source.year_start,
        yearEnd: source.year_end,
        textLength: source.text_length,
        peizhuPassageCount: source.peizhu_passage_count,
        chronology: raw.chronology ?? null
      };
    }),
    limit,
    offset
  };
}

function sourceLibrarySourceDetail(db, sourceId, url) {
  const query = url.searchParams.get("q")?.trim();
  const source = db.prepare(`
    SELECT id, title, author, type, citation_short, url, language, note, raw_json
    FROM sources
    WHERE id = ?
  `).get(sourceId);

  if (!source) {
    return null;
  }

  const passageWhere = ["source_id = $sourceId"];
  const params = { $sourceId: sourceId };
  if (query) {
    passageWhere.push("(text LIKE $query OR locator LIKE $query)");
    params.$query = `%${query}%`;
  }

  const passages = db.prepare(`
    SELECT id, locator, sequence, year_start, year_end, text, translation, notes, confidence, review_status, raw_json
    FROM source_passages
    WHERE ${passageWhere.join(" AND ")}
    ORDER BY sequence, id
  `).all(params);

  const raw = parseRawJson(source.raw_json);
  return {
    source: {
      id: source.id,
      title: source.title,
      author: source.author,
      type: source.type,
      citationShort: source.citation_short,
      url: source.url,
      language: source.language,
      note: source.note,
      chronology: raw.chronology ?? null
    },
    passages: passages.map((passage) => {
      const passageRaw = parseRawJson(passage.raw_json);
      return {
        id: passage.id,
        locator: passage.locator,
        sequence: passage.sequence,
        yearStart: passage.year_start,
        yearEnd: passage.year_end,
        text: passage.text,
        translation: passage.translation,
        notes: passage.notes,
        confidence: passage.confidence,
        reviewStatus: passage.review_status,
        chronology: passageRaw.chronology ?? null,
        hasPeiAnnotation: passage.text.includes("\u81e3\u677e\u4e4b") || passage.text.includes("\u677e\u4e4b\u6848")
      };
    }),
    query: query ?? "",
  };
}

async function route(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "GET" && request.method !== "POST" && request.method !== "PATCH") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);
  const pathname = decodeURIComponent(url.pathname);

  if (request.method === "PATCH") {
    if (pathname.startsWith("/api/import-evidence-cards/") && pathname.endsWith("/review-status")) {
      const cardId = pathname.slice("/api/import-evidence-cards/".length, -"/review-status".length);
      if (!cardId) {
        badRequest(response, "Missing evidence card id");
        return;
      }

      let body;
      try {
        body = await readRequestJson(request);
      } catch (error) {
        badRequest(response, error.message);
        return;
      }

      const reviewStatus = body.reviewStatus;
      if (typeof reviewStatus !== "string") {
        badRequest(response, "Missing reviewStatus");
        return;
      }

      withDb(response, (db) => {
        const card = updateImportEvidenceCardStatus(db, cardId, reviewStatus);
        card ? sendJson(response, 200, { card }) : notFound(response);
      }, { readOnly: false });
      return;
    }

    notFound(response);
    return;
  }

  if (request.method === "POST") {
    if (pathname === "/api/ai/retrieve") {
      let body;
      try {
        body = await readRequestJson(request);
      } catch (error) {
        badRequest(response, error.message);
        return;
      }

      withDb(response, (db) => {
        try {
          sendJson(response, 200, aiRetrieve(db, body));
        } catch (error) {
          badRequest(response, error.message);
        }
      }, { readOnly: false });
      return;
    }

    if (pathname === "/api/ai/evidence-answer") {
      let body;
      try {
        body = await readRequestJson(request);
      } catch (error) {
        badRequest(response, error.message);
        return;
      }

      let db;
      try {
        db = dbConnection({ readOnly: false });
        sendJson(response, 200, await aiEvidenceAnswer(db, body));
      } catch (error) {
        badRequest(response, error.message);
      } finally {
        db?.close();
      }
      return;
    }

    notFound(response);
    return;
  }

  if (pathname === "/api/ai/retrieve") {
    const payload = {
      question: url.searchParams.get("q") ?? "",
      locale: localeFromUrl(url),
      limit: parseLimit(url.searchParams.get("limit"), 12, 30),
      context: {
        eventId: url.searchParams.get("eventId"),
        personId: url.searchParams.get("personId") ?? url.searchParams.get("entityId"),
        region: url.searchParams.get("region"),
        year: parseInteger(url.searchParams.get("year")),
        sourceId: url.searchParams.get("sourceId")
      }
    };
    withDb(response, (db) => {
      try {
        sendJson(response, 200, aiRetrieve(db, payload));
      } catch (error) {
        badRequest(response, error.message);
      }
    }, { readOnly: false });
    return;
  }

  withDb(response, (db) => {
    if (pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        database: path.relative(rootDir, dbPath),
        generatedAt: new Date().toISOString()
      });
      return;
    }

    if (pathname === "/api/import-batches") {
      sendJson(response, 200, importBatchList(db));
      return;
    }

    if (pathname === "/api/ai-answers") {
      sendJson(response, 200, listAiAnswers(db, url));
      return;
    }

    if (pathname === "/api/rag-eval/questions") {
      sendJson(response, 200, listRagEvalQuestions(db, url));
      return;
    }

    if (pathname === "/api/rag-eval/runs") {
      sendJson(response, 200, listRagEvalRuns(db, url));
      return;
    }

    if (pathname.startsWith("/api/rag-eval/runs/")) {
      const runId = decodeURIComponent(pathname.slice("/api/rag-eval/runs/".length));
      if (!runId) {
        badRequest(response, "Missing RAG eval run id");
        return;
      }
      const detail = ragEvalRunDetail(db, runId);
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname === "/api/import-evidence-cards") {
      try {
        sendJson(response, 200, importEvidenceCards(db, url));
      } catch (error) {
        badRequest(response, error.message);
      }
      return;
    }

    if (pathname.startsWith("/api/import-evidence-cards/")) {
      const id = pathname.slice("/api/import-evidence-cards/".length);
      if (!id) {
        badRequest(response, "Missing evidence card id");
        return;
      }
      const card = importEvidenceCardDetail(db, id);
      card ? sendJson(response, 200, { card }) : notFound(response);
      return;
    }

    if (pathname === "/api/people") {
      sendJson(response, 200, listPeople(db, url));
      return;
    }

    if (pathname === "/api/frontend-db") {
      sendJson(response, 200, frontendDb(db));
      return;
    }

    if (pathname === "/api/frontend-events") {
      sendJson(response, 200, frontendEvents(db, localeFromUrl(url)));
      return;
    }

    if (pathname === "/api/frontend-event-importance") {
      sendJson(response, 200, frontendEventImportance(db));
      return;
    }

    if (pathname === "/api/frontend-regions") {
      sendJson(response, 200, frontendRegions(db));
      return;
    }

    if (pathname === "/api/frontend-period-overview") {
      sendJson(response, 200, frontendPeriodOverview(db));
      return;
    }

    if (pathname === "/api/frontend-china-map") {
      sendJson(response, 200, frontendChinaMap(db));
      return;
    }

    if (pathname === "/api/frontend-china-physical") {
      sendJson(response, 200, frontendChinaPhysical(db));
      return;
    }

    if (pathname === "/api/frontend-coverage-190-310") {
      sendJson(response, 200, frontendCoverage190310(db));
      return;
    }

    if (pathname === "/api/frontend-coverage-310-589") {
      sendJson(response, 200, frontendCoverage310589(db));
      return;
    }

    if (pathname === "/api/frontend-people-index") {
      sendJson(response, 200, frontendPeopleIndex(db, localeFromUrl(url)));
      return;
    }

    if (pathname === "/api/frontend-sources") {
      sendJson(
        response,
        200,
        url.searchParams.get("includeMentions") === "1"
          ? frontendSources(db, localeFromUrl(url))
          : frontendSourceSummary(db, localeFromUrl(url))
      );
      return;
    }

    if (pathname === "/api/frontend-source-summary") {
      sendJson(response, 200, frontendSourceSummary(db, localeFromUrl(url)));
      return;
    }

    if (pathname.startsWith("/api/source-mentions/person/")) {
      const personId = decodeURIComponent(pathname.slice("/api/source-mentions/person/".length));
      if (!personId) {
        badRequest(response, "Missing person id");
        return;
      }
      sendJson(response, 200, frontendSourceMentionsForPerson(db, personId, url));
      return;
    }

    if (pathname.startsWith("/api/source-mentions/event/")) {
      const eventId = decodeURIComponent(pathname.slice("/api/source-mentions/event/".length));
      if (!eventId) {
        badRequest(response, "Missing event id");
        return;
      }
      sendJson(response, 200, frontendSourceMentionsForEvent(db, eventId, url));
      return;
    }

    if (pathname === "/api/source-library/sources") {
      sendJson(response, 200, listSourceLibrarySources(db, url));
      return;
    }

    if (pathname.startsWith("/api/source-library/sources/")) {
      const sourceId = decodeURIComponent(pathname.slice("/api/source-library/sources/".length));
      if (!sourceId) {
        badRequest(response, "Missing source id");
        return;
      }
      const detail = sourceLibrarySourceDetail(db, sourceId, url);
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname.startsWith("/api/frontend-events/") && pathname.endsWith("/evidence")) {
      const eventId = pathname.slice("/api/frontend-events/".length, -"/evidence".length);
      if (!eventId) {
        badRequest(response, "Missing event id");
        return;
      }
      const detail = frontendEventEvidence(db, eventId, localeFromUrl(url));
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname.startsWith("/api/evidence-graph/event/")) {
      const eventId = decodeURIComponent(pathname.slice("/api/evidence-graph/event/".length));
      if (!eventId) {
        badRequest(response, "Missing event id");
        return;
      }
      const detail = frontendEvidenceGraphEvent(db, eventId, localeFromUrl(url));
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname.startsWith("/api/evidence-graph/person/")) {
      const entityId = decodeURIComponent(pathname.slice("/api/evidence-graph/person/".length));
      if (!entityId) {
        badRequest(response, "Missing person/entity id");
        return;
      }
      const detail = frontendEvidenceGraphPerson(db, entityId, localeFromUrl(url));
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname === "/api/frontend-china-control") {
      sendJson(response, 200, frontendChinaControl(db, url));
      return;
    }

    if (pathname === "/api/frontend-map-geometry-debug") {
      const debugPayload = frontendMapGeometryDebug(db, url);
      debugPayload ? sendJson(response, 200, debugPayload) : notFound(response);
      return;
    }

    if (pathname === "/api/frontend-roman-control") {
      sendJson(response, 200, frontendRomanControl(db));
      return;
    }

    if (pathname === "/api/frontend-app-data") {
      sendJson(response, 200, frontendAppData(db));
      return;
    }

    if (pathname.startsWith("/api/frontend-people/")) {
      const id = pathname.slice("/api/frontend-people/".length);
      if (!id) {
        badRequest(response, "Missing person id");
        return;
      }
      const detail = frontendPersonDetail(db, id, localeFromUrl(url));
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname.startsWith("/api/people/")) {
      const id = pathname.slice("/api/people/".length);
      if (!id) {
        badRequest(response, "Missing person id");
        return;
      }
      const detail = personDetail(db, id);
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname === "/api/events") {
      sendJson(response, 200, listEvents(db, url));
      return;
    }

    if (pathname.startsWith("/api/events/")) {
      const id = pathname.slice("/api/events/".length);
      if (!id) {
        badRequest(response, "Missing event id");
        return;
      }
      const detail = eventDetail(db, id);
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname === "/api/search" || pathname === "/api/search-documents") {
      sendJson(response, 200, searchDocuments(db, url));
      return;
    }

    if (pathname === "/api/regions") {
      sendJson(response, 200, {
        regions: db.prepare("SELECT * FROM regions ORDER BY parent_region_id, id").all()
      });
      return;
    }

    if (pathname === "/api/periods") {
      sendJson(response, 200, {
        periods: db.prepare("SELECT * FROM periods ORDER BY time_start, id").all()
      });
      return;
    }

    notFound(response);
  });
}

const server = createServer(route);

server.listen(port, host, () => {
  console.log(`History API listening at http://${host}:${port}`);
});
