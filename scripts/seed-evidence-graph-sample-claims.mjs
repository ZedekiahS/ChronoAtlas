import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
db.exec("PRAGMA foreign_keys = ON;");

const batchId = "manual-evidence-graph-sample-claims";

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

function periodForEvent(row) {
  if (row.region_id === "china" && row.time_start >= 310 && row.time_start <= 589) {
    return "china-wei-jin-northern-southern-310-589";
  }
  if (row.region_id === "china") {
    return "china-three-kingdoms-180-280";
  }
  if (row.region_id === "rome") {
    return "rome-190-310";
  }
  if (row.region_id === "sasanian-persia") {
    return "sasanian-persia-224-310";
  }
  return null;
}

function claimTypeForEvent(row) {
  const title = `${row.title ?? ""} ${row.event_type ?? ""}`.toLowerCase();
  if (title.includes("battle") || title.includes("war") || title.includes("战")) return "battle_result";
  if (title.includes("founds") || title.includes("建立") || title.includes("受禅") || title.includes("称帝")) return "dynastic_transition";
  if (title.includes("conquers") || title.includes("灭") || title.includes("falls") || title.includes("陷落")) return "event_occurrence";
  return "event_occurrence";
}

function sourceRoleForEvidence(row, index) {
  const raw = parseJson(row.evidence_raw_json);
  if (raw.sourceRole) return raw.sourceRole;
  if (raw.originalTextStatus === "locator-only") return "context";
  return index === 0 ? "primary" : "parallel";
}

function parseJson(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function statementZh(row, evidenceRows) {
  const sourceHint = firstText(evidenceRows[0]?.citation_short, evidenceRows[0]?.source_title, evidenceRows[0]?.source_id);
  const year = Number.isInteger(row.time_start) ? `${row.time_start} 年` : "";
  return `${year}${row.title}：${row.summary ?? "该事件已由结构化事件表记录"}${sourceHint ? `（据${sourceHint}）` : ""}`;
}

function statementEn(row) {
  if (!row.title_en && !row.summary_en && row.region_id === "china") {
    return null;
  }
  const year = Number.isInteger(row.time_start) ? `${row.time_start}: ` : "";
  return `${year}${row.title_en ?? row.title}. ${row.summary_en ?? row.summary ?? "This event is recorded in the structured event layer."}`;
}

const targetEvents = db.prepare(`
  SELECT
    ev.id,
    ev.title,
    evi.title AS title_en,
    ev.summary,
    evi.summary AS summary_en,
    ev.event_type,
    ev.region_id,
    ev.time_start,
    ev.time_end
  FROM events ev
  LEFT JOIN event_i18n evi ON evi.event_id = ev.id AND evi.locale = 'en'
  WHERE ev.id NOT LIKE 'life:%'
    AND ev.region_id IN ('china', 'rome', 'sasanian-persia')
    AND (
      (COALESCE(ev.time_end, ev.time_start) >= 190 AND COALESCE(ev.time_start, ev.time_end) <= 310)
      OR
      (ev.region_id = 'china' AND COALESCE(ev.time_end, ev.time_start) >= 310 AND COALESCE(ev.time_start, ev.time_end) <= 589)
    )
    AND EXISTS (
      SELECT 1 FROM evidence_links el
      WHERE el.subject_table = 'events' AND el.subject_id = ev.id
    )
  ORDER BY
    CASE
      WHEN ev.id IN (
        'china-200-guandu',
        'china-208-red-cliffs',
        'china-220-cao-pi-founds-wei',
        'china-263-shu-han-conquered',
        'china-280-jin-conquers-wu',
        'rome-235-assassination-of-alexander-severus-beginning-of-the-third-century-crisis',
        'rome-260-capture-of-valerian-by-shapur-i',
        'rome-272-aurelian-defeats-zenobia-and-recovers-the-east',
        'sasanian-224-ardashir-defeats-parthians',
        'rome-sasanian-260-valerian-captured',
        'china-383-fei-river',
        'china-420-liu-yu-founds-song',
        'china-439-northern-wei-unifies-north',
        'china-557-northern-zhou-and-chen',
        'china-589-sui-conquers-chen'
      ) THEN 0
      ELSE 1
    END,
    ev.time_start,
    ev.id
  LIMIT 80
`).all();

const evidenceForEvent = db.prepare(`
  SELECT
    el.id,
    el.source_id,
    el.passage_id,
    el.mention_id,
    el.locator,
    el.quote,
    el.confidence,
    el.raw_json AS evidence_raw_json,
    s.title AS source_title,
    s.citation_short,
    sm.text AS mention_text,
    sp.text AS passage_text
  FROM evidence_links el
  LEFT JOIN sources s ON s.id = el.source_id
  LEFT JOIN source_mentions sm ON sm.id = el.mention_id
  LEFT JOIN source_passages sp ON sp.id = el.passage_id
  WHERE el.subject_table = 'events' AND el.subject_id = ?
  ORDER BY
    CASE WHEN el.quote IS NOT NULL AND LENGTH(TRIM(el.quote)) > 0 THEN 0 ELSE 1 END,
    el.locator,
    el.id
  LIMIT 2
`);

const subjectsForEvent = db.prepare(`
  SELECT entity_id, role, sort_order
  FROM event_entities
  WHERE event_id = ?
  ORDER BY sort_order, entity_id
  LIMIT 8
`);

const insertClaim = db.prepare(`
  INSERT OR REPLACE INTO evidence_claims (
    id, claim_type, statement_zh, statement_en, time_start, time_end, region_id, period_id,
    confidence, review_status, dispute_status, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertClaimSource = db.prepare(`
  INSERT OR REPLACE INTO evidence_claim_sources (
    claim_id, source_id, mention_id, passage_id, locator, quote, source_role, confidence, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertClaimSubject = db.prepare(`
  INSERT OR REPLACE INTO evidence_claim_subjects (
    claim_id, subject_table, subject_id, subject_role, sort_order, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);

const deleteExisting = db.prepare("DELETE FROM evidence_claims WHERE id LIKE 'claim:sample:%'");

let claimCount = 0;
let sourceCount = 0;
let subjectCount = 0;

db.exec("BEGIN");
try {
  deleteExisting.run();

  for (const event of targetEvents) {
    const evidenceRows = evidenceForEvent.all(event.id);
    if (evidenceRows.length === 0) continue;

    const claimId = `claim:sample:${event.id}`;
    const confidence = evidenceRows.some((row) => row.confidence === "high") ? "high" : "medium";
    const reviewStatus = evidenceRows.some((row) => parseJson(row.evidence_raw_json).originalTextStatus === "verified-transcribed")
      ? "reviewed"
      : "draft";

    insertClaim.run(
      claimId,
      claimTypeForEvent(event),
      statementZh(event, evidenceRows),
      statementEn(event),
      event.time_start,
      event.time_end,
      event.region_id,
      periodForEvent(event),
      confidence,
      reviewStatus,
      "none",
      json({ eventId: event.id, generatedFrom: "events+evidence_links", evidenceLinkCount: evidenceRows.length })
    );
    claimCount += 1;

    insertClaimSubject.run(claimId, "events", event.id, "event", 0, json({ generatedFrom: "event" }));
    subjectCount += 1;

    for (const [index, evidence] of evidenceRows.entries()) {
      insertClaimSource.run(
        claimId,
        evidence.source_id,
        evidence.mention_id,
        evidence.passage_id,
        evidence.locator,
        firstText(evidence.quote, evidence.mention_text, evidence.passage_text),
        sourceRoleForEvidence(evidence, index),
        evidence.confidence ?? "medium",
        json({ evidenceLinkId: evidence.id })
      );
      sourceCount += 1;
    }

    for (const subject of subjectsForEvent.all(event.id)) {
      insertClaimSubject.run(
        claimId,
        "entities",
        subject.entity_id,
        subject.role ?? "participant",
        subject.sort_order ?? 10,
        json({ generatedFrom: "event_entities" })
      );
      subjectCount += 1;
    }
  }

  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

console.log(`Seeded evidence graph sample claims: claims=${claimCount}, sources=${sourceCount}, subjects=${subjectCount}`);
