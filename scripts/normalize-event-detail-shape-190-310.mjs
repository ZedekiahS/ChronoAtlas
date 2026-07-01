import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-normalize-event-detail-shape-190-310";
const requiredArrayFields = ["background", "process", "result", "impact", "sourceNotes", "uncertainty"];

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function hasNonEmptyDetail(detail) {
  return detail && typeof detail === "object" && !Array.isArray(detail) && Object.keys(detail).length > 0;
}

function normalizeDetail(detail, summary) {
  const next = { ...detail };
  if (typeof next.overview !== "string" || !next.overview.trim()) {
    next.overview = summary || [
      ...(Array.isArray(next.result) ? next.result : []),
      ...(Array.isArray(next.impact) ? next.impact : []),
      ...(Array.isArray(next.background) ? next.background : []),
    ].find((item) => typeof item === "string" && item.trim()) || "";
  }

  for (const field of requiredArrayFields) {
    if (!Array.isArray(next[field])) next[field] = [];
  }

  return {
    overview: next.overview,
    background: next.background,
    process: next.process,
    result: next.result,
    impact: next.impact,
    sourceNotes: next.sourceNotes,
    uncertainty: next.uncertainty,
  };
}

const historicalRows = db.prepare(`
  SELECT id, summary, detail_json, raw_json
  FROM historical_events
  WHERE start_year BETWEEN 180 AND 310
    AND region IN ('china', 'rome', 'sasanian-persia')
`).all();

const eventRows = db.prepare(`
  SELECT id, summary, raw_json
  FROM events
  WHERE time_start BETWEEN 180 AND 310
    AND region_id IN ('china', 'rome', 'sasanian-persia')
    AND id NOT LIKE 'life:%'
`).all();

const updateHistorical = db.prepare(`
  UPDATE historical_events
  SET detail_json = ?, raw_json = ?
  WHERE id = ?
`);

const updateEvent = db.prepare(`
  UPDATE events
  SET raw_json = ?
  WHERE id = ?
`);

db.exec("BEGIN");
try {
  let historicalUpdated = 0;
  let eventUpdated = 0;

  for (const row of historicalRows) {
    const raw = parseJson(row.raw_json);
    const detailFromColumn = parseJson(row.detail_json, null);
    const detail = hasNonEmptyDetail(detailFromColumn) ? detailFromColumn : raw.detail;
    if (!hasNonEmptyDetail(detail)) continue;

    const normalized = normalizeDetail(detail, row.summary ?? raw.summary ?? "");
    raw.detail = normalized;
    raw.reviewedBy = raw.reviewedBy ?? batchId;
    updateHistorical.run(JSON.stringify(normalized, null, 2), JSON.stringify(raw, null, 2), row.id);
    historicalUpdated += 1;
  }

  for (const row of eventRows) {
    const raw = parseJson(row.raw_json);
    if (!hasNonEmptyDetail(raw.detail)) continue;

    const normalized = normalizeDetail(raw.detail, row.summary ?? raw.summary ?? "");
    raw.detail = normalized;
    raw.reviewedBy = raw.reviewedBy ?? batchId;
    updateEvent.run(JSON.stringify(raw, null, 2), row.id);
    eventUpdated += 1;
  }

  db.exec("COMMIT");
  console.log(`Normalized event detail shape: historical=${historicalUpdated}, events=${eventUpdated}`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
