import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSemanticCandidateRecords,
  normalizeSemanticIdentity,
  SEMANTIC_CANDIDATE_PIPELINE,
  stableSemanticId,
} from "./lib/official-history-semantic-candidate-contract.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultRunDir = path.join(rootDir, "data", "import-drafts", "luna");

function argumentValue(name, fallback = null) {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
  return value === undefined ? fallback : value;
}

function argumentPath(name, fallback) {
  return path.resolve(rootDir, argumentValue(name, fallback));
}

function readJsonLines(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at ${path.relative(rootDir, filePath)}:${index + 1}: ${error.message}`);
      }
    });
}

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function parseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function tableExists(db, tableName) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName));
}

function assertTables(db) {
  const required = [
    "import_batches",
    "import_draft_files",
    "import_evidence_cards",
    "import_event_clusters",
    "import_event_cluster_members",
    "source_mentions",
    "source_mention_people",
    "source_mention_places",
    "source_mention_tags",
    "search_documents",
  ];
  const missing = required.filter((tableName) => !tableExists(db, tableName));
  if (missing.length) throw new Error(`Database is missing candidate tables: ${missing.join(", ")}`);
}

function isProtectedCardStatus(status) {
  return ["approved", "rejected", "promoted"].includes(status);
}

function isProtectedClusterStatus(status) {
  return ["approved", "rejected", "promoted"].includes(status);
}

function isProtectedFileStatus(status) {
  return ["approved", "rejected", "promoted"].includes(status);
}

function removeGeneratedMention(db, mentionId) {
  if (!mentionId) return;
  if (tableExists(db, "document_chunks")) {
    db.prepare("DELETE FROM document_chunks WHERE search_document_id = ?").run(mentionId);
  }
  db.prepare("DELETE FROM search_documents WHERE id = ?").run(mentionId);
  db.prepare("DELETE FROM source_mentions WHERE id = ?").run(mentionId);
}

function validateBeforeImport(inputPath, outputPath, summaryPath, expectedCount) {
  if (process.argv.includes("--skip-validation")) return;
  const validatorPath = path.join(rootDir, "scripts", "validate-official-history-extraction.mjs");
  const result = spawnSync(process.execPath, [
    "--no-warnings",
    validatorPath,
    `--input=${inputPath}`,
    `--output=${outputPath}`,
    `--summary=${summaryPath}`,
    `--expected=${expectedCount}`,
  ], { cwd: rootDir, stdio: "inherit" });
  if (result.status !== 0) throw new Error("Semantic extraction validation failed; candidate import aborted");
}

const inputPath = argumentPath("--input", path.join(defaultRunDir, "xin-transition--8-24-pilot-input.jsonl"));
const outputPath = argumentPath("--output", path.join(defaultRunDir, "xin-transition--8-24-pilot-output.jsonl"));
const summaryPath = argumentPath("--summary", path.join(defaultRunDir, "xin-transition--8-24-pilot-summary.json"));
const dbPath = argumentPath("--db", path.join(rootDir, "db", "chronoatlas.sqlite"));
const dryRun = process.argv.includes("--dry-run");
const inputRecords = readJsonLines(inputPath);
const outputRecords = readJsonLines(outputPath);
validateBeforeImport(inputPath, outputPath, summaryPath, inputRecords.length);

const inferredProfileId = inputRecords[0]?.profile?.profile_id ?? "official-history-semantic-v1";
const batchId = argumentValue("--batch", `semantic-${inferredProfileId}`);
const promotionProfile = argumentValue("--promotion-profile", inferredProfileId);
const provider = argumentValue("--provider", "chronoatlas-semantic-extractor");
const periodId = argumentValue("--period", null);
const regionId = argumentValue("--region", "china");
const outputLabel = path.relative(rootDir, outputPath).replaceAll("\\", "/");
const records = buildSemanticCandidateRecords(inputRecords, outputRecords, {
  batchId,
  promotionProfile,
  periodId,
  regionId,
  outputLabel,
});

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
assertTables(db);

const sourceById = new Map(db.prepare(`
  SELECT id, title, citation_short, author
  FROM sources
  ORDER BY id
`).all().map((source) => [source.id, source]));
const passageIds = new Set(db.prepare("SELECT id FROM source_passages").all().map((passage) => passage.id));
const personIds = new Set(db.prepare("SELECT id FROM persons").all().map((person) => person.id));
for (const card of records.cards) {
  if (!sourceById.has(card.source.source_id)) throw new Error(`Unknown source_id for ${card.taskId}: ${card.source.source_id}`);
  if (card.source.passage_id && !passageIds.has(card.source.passage_id)) {
    throw new Error(`Unknown passage_id for ${card.taskId}: ${card.source.passage_id}`);
  }
  for (const person of card.knownPeople) {
    if (!personIds.has(person.id)) throw new Error(`Unknown known_person_id for ${card.taskId}: ${person.id}`);
  }
}

const currentCards = new Map(db.prepare(`
  SELECT id, review_status, raw_json
  FROM import_evidence_cards
  WHERE batch_id = ?
`).all(batchId).map((card) => [card.id, card]));
const currentClusters = new Map(db.prepare(`
  SELECT id, review_status
  FROM import_event_clusters
  WHERE batch_id = ?
`).all(batchId).map((cluster) => [cluster.id, cluster]));
const currentFiles = new Map(db.prepare(`
  SELECT id, import_status
  FROM import_draft_files
  WHERE batch_id = ?
`).all(batchId).map((file) => [file.id, file]));
const desiredCardIds = new Set(records.cards.map((card) => card.cardId));
const desiredClusterIds = new Set(records.cards.map((card) => card.clusterId));
const desiredFileIds = new Set(records.files.map((file) => file.id));

const report = {
  dryRun,
  batchId,
  profileId: inferredProfileId,
  promotionProfile,
  files: records.files.length,
  cards: records.cards.length,
  eligible: records.cards.filter((card) => card.recommendation === "eligible").length,
  candidateOnly: records.cards.filter((card) => card.recommendation === "candidate_only").length,
  rejected: records.cards.filter((card) => card.recommendation === "reject").length,
  noEventTasks: records.files.filter((file) => file.cardCount === 0).length,
  preservedCards: records.cards.filter((card) => isProtectedCardStatus(currentCards.get(card.cardId)?.review_status)).length,
  preservedClusters: records.cards.filter((card) => isProtectedClusterStatus(currentClusters.get(card.clusterId)?.review_status)).length,
  staleCardsRemoved: [...currentCards.values()].filter(
    (card) => !desiredCardIds.has(card.id) && !isProtectedCardStatus(card.review_status),
  ).length,
  staleCardsPreserved: [...currentCards.values()].filter(
    (card) => !desiredCardIds.has(card.id) && isProtectedCardStatus(card.review_status),
  ).length,
};

if (dryRun) {
  console.log(JSON.stringify(report, null, 2));
  db.close();
  process.exit(0);
}

const now = new Date().toISOString();
const insertBatch = db.prepare(`
  INSERT INTO import_batches (id, created_at, source_provider, source_root, status, notes, raw_json)
  VALUES (?, ?, ?, ?, 'staged', ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    source_provider = CASE WHEN import_batches.status IN ('approved', 'rejected', 'promoted') THEN import_batches.source_provider ELSE excluded.source_provider END,
    source_root = CASE WHEN import_batches.status IN ('approved', 'rejected', 'promoted') THEN import_batches.source_root ELSE excluded.source_root END,
    notes = CASE WHEN import_batches.status IN ('approved', 'rejected', 'promoted') THEN import_batches.notes ELSE excluded.notes END,
    raw_json = CASE WHEN import_batches.status IN ('approved', 'rejected', 'promoted') THEN import_batches.raw_json ELSE excluded.raw_json END
`);
const insertFile = db.prepare(`
  INSERT INTO import_draft_files (
    id, batch_id, relative_path, sha256, source_provider, corpus_hint, collection_hint,
    card_count, error_count, warning_count, import_status, raw_json, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    relative_path = excluded.relative_path,
    sha256 = excluded.sha256,
    source_provider = excluded.source_provider,
    corpus_hint = excluded.corpus_hint,
    collection_hint = excluded.collection_hint,
    card_count = excluded.card_count,
    error_count = excluded.error_count,
    warning_count = excluded.warning_count,
    import_status = excluded.import_status,
    raw_json = excluded.raw_json,
    created_at = import_draft_files.created_at
`);
const insertCard = db.prepare(`
  INSERT INTO import_evidence_cards (
    id, batch_id, file_id, card_index, source_title, source_type, author, commentary_author,
    quoted_work, section, locator, year, display_date, original_text, translation,
    people_core_json, people_mentioned_json, places_json, macro_event, event_label,
    fact_brief, fact_detailed, fact_type, confidence, questions_json, review_status,
    validation_errors_json, validation_warnings_json, raw_json, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    file_id = excluded.file_id,
    card_index = excluded.card_index,
    source_title = excluded.source_title,
    source_type = excluded.source_type,
    author = excluded.author,
    quoted_work = excluded.quoted_work,
    section = excluded.section,
    locator = excluded.locator,
    year = excluded.year,
    original_text = excluded.original_text,
    people_core_json = excluded.people_core_json,
    people_mentioned_json = excluded.people_mentioned_json,
    places_json = excluded.places_json,
    macro_event = excluded.macro_event,
    event_label = excluded.event_label,
    fact_brief = excluded.fact_brief,
    fact_detailed = excluded.fact_detailed,
    fact_type = excluded.fact_type,
    confidence = excluded.confidence,
    questions_json = excluded.questions_json,
    review_status = excluded.review_status,
    validation_errors_json = excluded.validation_errors_json,
    validation_warnings_json = excluded.validation_warnings_json,
    raw_json = excluded.raw_json,
    created_at = import_evidence_cards.created_at
`);
const insertMention = db.prepare(`
  INSERT INTO source_mentions (
    id, source_id, passage_id, work_title, book_title, chapter_title, locator,
    year, text, translation, confidence, review_status, raw_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'draft', ?)
  ON CONFLICT(id) DO UPDATE SET
    source_id = excluded.source_id,
    passage_id = excluded.passage_id,
    work_title = excluded.work_title,
    book_title = excluded.book_title,
    chapter_title = excluded.chapter_title,
    locator = excluded.locator,
    year = excluded.year,
    text = excluded.text,
    confidence = excluded.confidence,
    raw_json = excluded.raw_json
`);
const insertMentionPerson = db.prepare(`
  INSERT OR REPLACE INTO source_mention_people (mention_id, person_id, sort_order)
  VALUES (?, ?, ?)
`);
const insertMentionPlace = db.prepare(`
  INSERT OR REPLACE INTO source_mention_places (mention_id, place_id, sort_order)
  VALUES (?, ?, ?)
`);
const insertTag = db.prepare(`
  INSERT OR REPLACE INTO source_mention_tags (mention_id, tag, sort_order)
  VALUES (?, ?, ?)
`);
const insertSearchDocument = db.prepare(`
  INSERT INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id,
    topic_id, time_start, time_end, review_status, raw_json
  ) VALUES (?, 'source_mentions', ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'draft', ?)
  ON CONFLICT(id) DO UPDATE SET
    subject_table = excluded.subject_table,
    subject_id = excluded.subject_id,
    title = excluded.title,
    body = excluded.body,
    region_id = excluded.region_id,
    period_id = excluded.period_id,
    topic_id = excluded.topic_id,
    time_start = excluded.time_start,
    time_end = excluded.time_end,
    raw_json = excluded.raw_json
`);
const insertCluster = db.prepare(`
  INSERT INTO import_event_clusters (
    id, batch_id, region_id, canonical_label, normalized_key, event_type, event_scale,
    time_start, time_end, candidate_count, source_count, person_count, matched_event_id,
    match_status, confidence, review_status, summary, raw_json, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, NULL, 'unmatched', ?, 'needs-review', ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    region_id = excluded.region_id,
    canonical_label = excluded.canonical_label,
    normalized_key = excluded.normalized_key,
    event_type = excluded.event_type,
    event_scale = excluded.event_scale,
    time_start = excluded.time_start,
    time_end = excluded.time_end,
    candidate_count = excluded.candidate_count,
    source_count = excluded.source_count,
    person_count = excluded.person_count,
    confidence = excluded.confidence,
    review_status = excluded.review_status,
    summary = excluded.summary,
    raw_json = excluded.raw_json,
    created_at = import_event_clusters.created_at
`);
const insertClusterMember = db.prepare(`
  INSERT OR REPLACE INTO import_event_cluster_members (
    cluster_id, card_id, sort_order, similarity_score, role, raw_json
  ) VALUES (?, ?, 0, 1, 'evidence', ?)
`);

db.exec("BEGIN IMMEDIATE;");
try {
  for (const current of currentCards.values()) {
    if (desiredCardIds.has(current.id) || isProtectedCardStatus(current.review_status)) continue;
    const mentionId = parseJson(current.raw_json).mentionId;
    removeGeneratedMention(db, mentionId);
    db.prepare("DELETE FROM import_evidence_cards WHERE id = ?").run(current.id);
  }
  for (const current of currentClusters.values()) {
    if (desiredClusterIds.has(current.id) || isProtectedClusterStatus(current.review_status)) continue;
    db.prepare("DELETE FROM import_event_clusters WHERE id = ?").run(current.id);
  }
  for (const current of currentFiles.values()) {
    if (desiredFileIds.has(current.id) || isProtectedFileStatus(current.import_status)) continue;
    db.prepare("DELETE FROM import_draft_files WHERE id = ?").run(current.id);
  }

  insertBatch.run(
    batchId,
    now,
    provider,
    outputLabel,
    `Validated semantic extraction candidates for ${inferredProfileId}; formal promotion requires eligible recommendation and normal review gates.`,
    toJson({
      pipeline: SEMANTIC_CANDIDATE_PIPELINE,
      schemaVersion: outputRecords[0]?.schema_version ?? "chronoatlas-official-history-extraction-v1",
      profileId: inferredProfileId,
      promotionProfile,
      regionId,
      periodId,
      sourceScope: outputLabel,
      taskCount: records.files.length,
      candidateCount: records.cards.length,
    }),
  );

  for (const file of records.files) {
    if (isProtectedFileStatus(currentFiles.get(file.id)?.import_status)) continue;
    insertFile.run(
      file.id,
      batchId,
      file.relativePath,
      stableSemanticId(JSON.stringify(file.raw), 64),
      provider,
      file.profileId,
      `${file.profileId}-semantic-candidates`,
      file.cardCount,
      file.importStatus,
      toJson(file.raw),
      now,
    );
  }

  for (const card of records.cards) {
    if (isProtectedCardStatus(currentCards.get(card.cardId)?.review_status)) continue;
    const source = sourceById.get(card.source.source_id);
    const cardReviewStatus = card.recommendation === "eligible" ? "staged" : "needs-fix";
    insertCard.run(
      card.cardId,
      batchId,
      card.fileId,
      card.eventIndex,
      source.citation_short || source.title,
      card.source.section_type ?? "source",
      source.author ?? null,
      card.source.work_title ?? source.title,
      card.source.section_label ?? "史料",
      card.source.locator ?? card.source.passage_id,
      card.year,
      card.evidence,
      toJson(card.primaryPeople),
      toJson(card.secondaryPeople),
      toJson(card.places.map((place) => place.label)),
      `${card.source.work_title ?? source.title}语义候选`,
      card.title,
      card.summary,
      card.evidence,
      card.factType,
      card.confidence,
      toJson(["核对人物与地点绑定", "核对同事件合并目标", "人工确认后再晋级"]),
      cardReviewStatus,
      toJson(card.flags),
      toJson(card.raw),
      now,
    );

    const currentMention = db.prepare("SELECT review_status FROM source_mentions WHERE id = ?").get(card.mentionId);
    if (!currentMention || currentMention.review_status === "draft") {
      insertMention.run(
        card.mentionId,
        card.source.source_id,
        card.source.passage_id,
        card.source.work_title ?? source.title,
        card.source.book_title ?? source.title,
        card.source.section_label ?? "史料",
        card.source.locator ?? card.source.passage_id,
        card.year,
        card.evidence,
        card.confidence,
        toJson(card.raw),
      );
      db.prepare("DELETE FROM source_mention_people WHERE mention_id = ?").run(card.mentionId);
      db.prepare("DELETE FROM source_mention_places WHERE mention_id = ?").run(card.mentionId);
      db.prepare("DELETE FROM source_mention_tags WHERE mention_id = ?").run(card.mentionId);
      card.knownPeople.forEach((person, index) => insertMentionPerson.run(card.mentionId, person.id, index));
      card.places.filter((place) => place.id).forEach((place, index) => insertMentionPlace.run(card.mentionId, place.id, index));
      const tags = [
        `fact:${card.factType}`,
        `scale:${card.eventScale}`,
        `recommendation:${card.recommendation}`,
        `source-section:${card.source.section_type ?? "source"}`,
        ...[...card.primaryPeople, ...card.secondaryPeople].map((name) => `person:${name}`),
        ...card.places.map((place) => `place:${place.label}`),
      ];
      tags.forEach((tag, index) => insertTag.run(card.mentionId, tag, index));
      if (card.recommendation !== "reject") {
        insertSearchDocument.run(
          card.searchDocumentId,
          card.mentionId,
          card.title,
          [`候选：${card.title}`, `出处：${source.citation_short || source.title} ${card.source.locator ?? ""}`, card.summary, card.evidence].join("\n"),
          regionId,
          periodId,
          card.factType === "military" ? "military" : "political_structure",
          card.year,
          card.year,
          toJson(card.raw),
        );
      }
    }

    if (!isProtectedClusterStatus(currentClusters.get(card.clusterId)?.review_status)) {
      insertCluster.run(
        card.clusterId,
        batchId,
        regionId,
        card.title,
        `${card.year ?? "unknown"}:${normalizeSemanticIdentity(card.title)}`,
        card.factType,
        card.eventScale,
        card.year,
        card.year,
        card.primaryPeople.length + card.secondaryPeople.length,
        card.confidence,
        card.summary,
        toJson({
          pipeline: SEMANTIC_CANDIDATE_PIPELINE,
          taskId: card.taskId,
          eventIndex: card.eventIndex,
          recommendation: card.recommendation,
          flags: card.flags,
          reasons: card.reasons,
        }),
        now,
      );
      insertClusterMember.run(
        card.clusterId,
        card.cardId,
        toJson({ pipeline: SEMANTIC_CANDIDATE_PIPELINE, recommendation: card.recommendation }),
      );
    }
  }
  db.exec("COMMIT;");
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
} finally {
  db.close();
}

console.log(JSON.stringify(report, null, 2));
