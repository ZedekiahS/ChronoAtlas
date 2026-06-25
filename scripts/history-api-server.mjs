import { DatabaseSync } from "node:sqlite";
import { createServer } from "node:http";
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
    "access-control-allow-methods": "GET, PATCH, OPTIONS",
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
      el.confidence
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
      el.confidence
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    WHERE el.subject_table = 'events' AND el.subject_id = ?
    ORDER BY el.locator, el.id
  `).all(eventId);

  return { event, entities, evidence };
}

function searchDocuments(db, url) {
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

function evidenceRowsForSubject(db, subjectTable, subjectId, limit = 100) {
  return db.prepare(`
    SELECT
      el.id,
      el.subject_table,
      el.subject_id,
      el.source_id,
      s.title AS source_title,
      s.citation_short,
      s.url,
      el.passage_id,
      sp.text AS passage_text,
      sp.translation AS passage_translation,
      el.mention_id,
      sm.text AS mention_text,
      sm.translation AS mention_translation,
      el.locator,
      el.quote,
      el.evidence_role,
      el.confidence
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    LEFT JOIN source_passages sp ON sp.id = el.passage_id
    LEFT JOIN source_mentions sm ON sm.id = el.mention_id
    WHERE el.subject_table = ? AND el.subject_id = ?
    ORDER BY el.locator, el.id
    LIMIT ?
  `).all(subjectTable, subjectId, limit).map((row) => ({
    id: row.id,
    subjectTable: row.subject_table,
    subjectId: row.subject_id,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    citationShort: row.citation_short ?? row.source_title ?? row.source_id,
    url: row.url,
    passageId: row.passage_id,
    mentionId: row.mention_id,
    locator: row.locator,
    quote: row.quote ?? row.mention_text ?? row.passage_text,
    translation: row.mention_translation ?? row.passage_translation,
    evidenceRole: row.evidence_role,
    confidence: row.confidence
  }));
}

function evidenceRowsForPerson(db, entityId) {
  return db.prepare(`
    SELECT
      el.id,
      el.subject_table,
      el.subject_id,
      el.source_id,
      s.title AS source_title,
      s.citation_short,
      s.url,
      el.passage_id,
      sp.text AS passage_text,
      sp.translation AS passage_translation,
      el.mention_id,
      sm.text AS mention_text,
      sm.translation AS mention_translation,
      el.locator,
      el.quote,
      el.evidence_role,
      el.confidence
    FROM evidence_links el
    LEFT JOIN sources s ON s.id = el.source_id
    LEFT JOIN source_passages sp ON sp.id = el.passage_id
    LEFT JOIN source_mentions sm ON sm.id = el.mention_id
    WHERE el.subject_id IN (
      SELECT event_id FROM event_entities WHERE entity_id = ?
      UNION
      SELECT id FROM entity_relations WHERE source_entity_id = ? OR target_entity_id = ?
    )
    ORDER BY el.subject_table, el.subject_id, el.locator
    LIMIT 200
  `).all(entityId, entityId, entityId).map((row) => ({
    id: row.id,
    subjectTable: row.subject_table,
    subjectId: row.subject_id,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    citationShort: row.citation_short ?? row.source_title ?? row.source_id,
    url: row.url,
    passageId: row.passage_id,
    mentionId: row.mention_id,
    locator: row.locator,
    quote: row.quote ?? row.mention_text ?? row.passage_text,
    translation: row.mention_translation ?? row.passage_translation,
    evidenceRole: row.evidence_role,
    confidence: row.confidence
  }));
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

function frontendPersonDetail(db, entityIdOrLegacyId) {
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
      ev.display_time,
      ev.event_type,
      ev.title,
      ev.summary,
      ev.confidence,
      ev.raw_json,
      (
        SELECT COUNT(*)
        FROM evidence_links el
        WHERE el.subject_table = 'events' AND el.subject_id = ev.id
      ) AS source_mention_count
    FROM events ev
    JOIN event_entities ee ON ee.event_id = ev.id AND ee.role = 'subject'
    WHERE ev.id LIKE 'life:%' AND ee.entity_id = ?
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
  `).all(entityId).map((row) => {
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
    SELECT ev.raw_json
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    WHERE ee.entity_id = ? AND ev.id NOT LIKE 'life:%'
    ORDER BY COALESCE(ev.time_start, 9999), ev.id
  `).all(entityId).map((row) => parseRawJson(row.raw_json));

  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:future-schema",
    purpose: "frontend-person-detail",
    personId: legacyPersonId,
    personLifeEvents,
    personRelations,
    personEvents,
    evidence: evidenceRowsForPerson(db, entityId)
  };
}

function frontendEvents(db) {
  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:future-schema",
    purpose: "frontend-events",
    events: db.prepare(`
      SELECT raw_json
      FROM events
      WHERE id NOT LIKE 'life:%'
      ORDER BY COALESCE(time_start, 9999), id
    `).all().map((row) => parseRawJson(row.raw_json))
  };
}

function frontendEventEvidence(db, eventId) {
  const event = db.prepare("SELECT id, title FROM events WHERE id = ?").get(eventId);
  if (!event) {
    return null;
  }

  return {
    schemaVersion: 2,
    generatedFrom: "sqlite:future-schema",
    purpose: "frontend-event-evidence",
    eventId,
    eventTitle: event.title,
    evidence: evidenceRowsForSubject(db, "events", eventId)
  };
}

function frontendChinaControl(db) {
  const adminDataset = db.prepare(`
    SELECT *
    FROM china_admin_block_datasets
    WHERE id = 'china-admin-block-map-190-280'
  `).get();
  const timelineDataset = db.prepare(`
    SELECT *
    FROM china_control_timeline_datasets
    WHERE id = 'china-block-control-timeline-190-280'
  `).get();

  return {
    adminBlocks: {
      schemaVersion: adminDataset?.schema_version ?? 1,
      model: adminDataset?.model ?? "china-admin-block-map",
      range: [adminDataset?.year_start ?? 190, adminDataset?.year_end ?? 280],
      notes: adminDataset?.notes ?? "",
      blocks: db.prepare(`
        SELECT *
        FROM china_admin_blocks
        WHERE dataset_id = 'china-admin-block-map-190-280'
        ORDER BY id
      `).all().map((block) => ({
        id: block.id,
        name: block.name,
        level: block.level,
        parent: block.parent_id,
        center: parseRawJson(block.center_json),
        geometry: parseRawJson(block.geometry_json),
        confidence: block.confidence,
        approximate: block.approximate === 1,
        sources: parseRawJson(block.sources_json)
      }))
    },
    controlTimeline: {
      schemaVersion: timelineDataset?.schema_version ?? 1,
      model: timelineDataset?.model ?? "china-block-control-timeline",
      range: [timelineDataset?.year_start ?? 190, timelineDataset?.year_end ?? 280],
      keyYears: parseRawJson(timelineDataset?.key_years_json),
      controllers: db.prepare(`
        SELECT id, color
        FROM china_control_controllers
        WHERE timeline_id = 'china-block-control-timeline-190-280'
        ORDER BY id
      `).all(),
      records: db.prepare(`
        SELECT block_id, start_year, end_year, controller, status, confidence, sources_json
        FROM china_control_records
        WHERE timeline_id = 'china-block-control-timeline-190-280'
        ORDER BY block_id, start_year, end_year
      `).all().map((record) => ({
        blockId: record.block_id,
        startYear: record.start_year,
        endYear: record.end_year,
        controller: record.controller,
        status: record.status,
        confidence: record.confidence,
        sources: parseRawJson(record.sources_json)
      }))
    }
  };
}

function frontendRomanControl(db) {
  const row = db.prepare(`
    SELECT raw_json
    FROM app_runtime_datasets
    WHERE id = 'roman-control-map-190-310'
  `).get();

  return row
    ? parseRawJson(row.raw_json)
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
      defaultImportance: "medium",
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

async function route(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "GET" && request.method !== "PATCH") {
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
      sendJson(response, 200, frontendEvents(db));
      return;
    }

    if (pathname.startsWith("/api/frontend-events/") && pathname.endsWith("/evidence")) {
      const eventId = pathname.slice("/api/frontend-events/".length, -"/evidence".length);
      if (!eventId) {
        badRequest(response, "Missing event id");
        return;
      }
      const detail = frontendEventEvidence(db, eventId);
      detail ? sendJson(response, 200, detail) : notFound(response);
      return;
    }

    if (pathname === "/api/frontend-china-control") {
      sendJson(response, 200, frontendChinaControl(db));
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
      const detail = frontendPersonDetail(db, id);
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

    if (pathname === "/api/search") {
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
