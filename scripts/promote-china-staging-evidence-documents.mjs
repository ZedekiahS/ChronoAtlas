import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const dbPath = "db/chronoatlas.sqlite";
const batchId = process.argv.find((arg) => arg.startsWith("--batch-id="))?.slice("--batch-id=".length) ?? "deepseek-china-evidence";

function parseJson(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stableId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
}

function slugify(value) {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "document";
}

function confidenceValue(value) {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  if (typeof value === "number") {
    if (value >= 4) return "high";
    if (value <= 2) return "low";
  }
  return "medium";
}

function sourceTypeValue(value) {
  if (value === "史书" || value === "primary") {
    return "official-history";
  }
  if (value === "chronicle") {
    return "chronicle";
  }
  return value || "source";
}

function topicForFactType(factType) {
  const value = String(factType ?? "");
  if (value.includes("军事") || value.includes("war") || value.includes("military")) {
    return "military";
  }
  if (value.includes("继承") || value.includes("废立") || value.includes("death")) {
    return "succession";
  }
  if (value.includes("史评") || value.includes("轶事") || value.includes("source")) {
    return "source_criticism";
  }
  if (value.includes("人物") || value.includes("关系")) {
    return "elite_network";
  }
  return "political_structure";
}

function compactText(parts) {
  return parts
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim())
    .join("\n\n");
}

function sourceIdFor(card) {
  return `deepseek-source-${slugify(`${card.source_title}-${card.author ?? ""}-${card.quoted_work ?? ""}`)}`;
}

function documentTitle(card) {
  return card.event_label || card.macro_event || card.fact_brief || [card.source_title, card.locator].filter(Boolean).join(" ");
}

function documentBody(card) {
  const peopleCore = parseJson(card.people_core_json, []);
  const peopleMentioned = parseJson(card.people_mentioned_json, []);
  const places = parseJson(card.places_json, []);
  const questions = parseJson(card.questions_json, []);

  return compactText([
    documentTitle(card),
    card.display_date || (Number.isInteger(card.year) ? `${card.year} 年` : null),
    card.fact_brief,
    card.fact_detailed,
    card.original_text ? `原文：${card.original_text}` : null,
    card.translation ? `译文/释义：${card.translation}` : null,
    peopleCore.length ? `核心人物：${peopleCore.join("、")}` : null,
    peopleMentioned.length ? `相关人物：${peopleMentioned.join("、")}` : null,
    places.length ? `地点：${places.join("、")}` : null,
    card.macro_event ? `宏观事件：${card.macro_event}` : null,
    card.fact_type ? `事实类型：${card.fact_type}` : null,
    questions.length ? `待核问题：${questions.join("；")}` : null,
    [card.source_title, card.section, card.locator].filter(Boolean).join(" · "),
  ]);
}

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA foreign_keys = ON;");
  const cards = db.prepare(`
    SELECT *
    FROM import_evidence_cards
    WHERE batch_id = ?
      AND review_status = 'staged'
    ORDER BY year, file_id, card_index
  `).all(batchId);

  if (!cards.length) {
    throw new Error(`No staged evidence cards found for batch ${batchId}`);
  }

  const insertSource = db.prepare(`
    INSERT INTO sources (id, title, author, type, citation_short, url, language, corpus_id, note, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      author = excluded.author,
      type = excluded.type,
      citation_short = excluded.citation_short,
      language = excluded.language,
      corpus_id = excluded.corpus_id,
      note = excluded.note,
      raw_json = excluded.raw_json
  `);
  const insertDocument = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      title = excluded.title,
      body = excluded.body,
      language = excluded.language,
      region_id = excluded.region_id,
      period_id = excluded.period_id,
      topic_id = excluded.topic_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);
  const insertEvidence = db.prepare(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    ) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);

  db.exec("BEGIN;");
  try {
    for (const card of cards) {
      const sourceId = sourceIdFor(card);
      const sourceLabel = [card.source_title, card.section].filter(Boolean).join(" · ") || card.source_title || sourceId;
      const documentId = `deepseek-card:${stableId(card.id)}`;
      const title = documentTitle(card);
      const body = documentBody(card);
      const raw = parseJson(card.raw_json, {});
      const confidence = confidenceValue(raw.confidence ?? card.confidence);

      insertSource.run(
        sourceId,
        card.source_title || "DeepSeek evidence source",
        card.author,
        sourceTypeValue(card.source_type),
        sourceLabel,
        null,
        "zh-Hans",
        "china-three-kingdoms",
        card.quoted_work || card.section || null,
        JSON.stringify({
          importedFromBatch: batchId,
          sourceTitle: card.source_title,
          section: card.section,
          quotedWork: card.quoted_work,
        }),
      );

      insertDocument.run(
        documentId,
        "import_evidence_cards",
        card.id,
        title,
        body,
        "zh-Hans",
        "china",
        "china-three-kingdoms-180-280",
        topicForFactType(card.fact_type),
        card.year,
        card.year,
        "draft",
        JSON.stringify({
          importedFromBatch: batchId,
          cardId: card.id,
          fileId: card.file_id,
          cardIndex: card.card_index,
          sourceId,
          sourceTitle: card.source_title,
          locator: card.locator,
          originalText: card.original_text,
          translation: card.translation,
          peopleCore: parseJson(card.people_core_json, []),
          peopleMentioned: parseJson(card.people_mentioned_json, []),
          places: parseJson(card.places_json, []),
          macroEvent: card.macro_event,
          eventLabel: card.event_label,
          factType: card.fact_type,
          questions: parseJson(card.questions_json, []),
          confidence,
        }),
      );

      insertEvidence.run(
        `deepseek-evidence:${stableId(card.id)}`,
        "search_documents",
        documentId,
        sourceId,
        card.locator,
        card.original_text || card.translation || card.fact_brief,
        "support",
        confidence,
        JSON.stringify({
          importedFromBatch: batchId,
          cardId: card.id,
          sourceTitle: card.source_title,
          locator: card.locator,
        }),
      );
    }
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  console.log(`Promoted ${cards.length} DeepSeek China evidence cards to search documents`);
} finally {
  db.close();
}
