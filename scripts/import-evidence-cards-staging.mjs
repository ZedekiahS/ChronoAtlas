import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const defaultInputDir = path.join(rootDir, "data", "import-drafts", "deepseek");

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const inputArgs = args.filter((arg) => !arg.startsWith("--"));
const providerArg = args.find((arg) => arg.startsWith("--provider="));
const batchArg = args.find((arg) => arg.startsWith("--batch-id="));
const provider = providerArg?.slice("--provider=".length) || "deepseek";
const batchId = batchArg?.slice("--batch-id=".length) || `${provider}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const confidenceValues = new Set(["high", "medium", "low"]);

function normalizeRelativePath(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, "/");
}

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function textOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function integerOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return typeof value === "string" && value.length > 0;
}

function stableId(input) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

async function collectJsonFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJsonFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function resolveInputFiles() {
  if (inputArgs.length > 0) {
    return inputArgs.map((input) => path.resolve(rootDir, input));
  }

  if (!existsSync(defaultInputDir)) {
    return [];
  }

  return collectJsonFiles(defaultInputDir);
}

function validateCard(card) {
  const errors = [];
  const warnings = [];

  if (!hasText(card?.source)) errors.push("source is required");
  if (!hasText(card?.sourceType)) errors.push("sourceType is required");
  if (!hasText(card?.locator)) errors.push("locator is required");
  if (!hasText(card?.text)) errors.push("text is required");
  if (!arrayOrEmpty(card?.people).length && !arrayOrEmpty(card?.peopleCore).length) {
    errors.push("people or peopleCore is required");
  }
  if (!Array.isArray(card?.places)) errors.push("places must be an array");
  if (!hasText(card?.fact) && !(hasText(card?.factBrief) && hasText(card?.factDetailed))) {
    errors.push("fact or factBrief/factDetailed is required");
  }
  if (!hasText(card?.factType)) errors.push("factType is required");
  if (!Array.isArray(card?.questions)) errors.push("questions must be an array");

  if (card?.year !== null && card?.year !== undefined && !Number.isInteger(card.year)) {
    warnings.push("year should be integer/null");
  }
  if (card?.confidence !== undefined && !confidenceValues.has(card.confidence)) {
    warnings.push("confidence should be high/medium/low");
  }
  if (card?.peopleCore !== undefined && !Array.isArray(card.peopleCore)) {
    errors.push("peopleCore must be an array when present");
  }
  if (card?.peopleMentioned !== undefined && !Array.isArray(card.peopleMentioned)) {
    errors.push("peopleMentioned must be an array when present");
  }
  if (card?.quotedWork !== undefined && card.quotedWork !== null && !hasText(card.quotedWork)) {
    warnings.push("quotedWork should be string/null when present");
  }

  return { errors, warnings };
}

function inferCollectionHint(relativePath, draft) {
  if (Array.isArray(draft?.evidenceCards)) {
    return "evidenceCards";
  }
  if (relativePath.includes("evidence-card")) {
    return "evidenceCards";
  }
  return "mixed";
}

function inferCorpusHint(relativePath, draft) {
  const metaText = JSON.stringify(draft?.batchMeta ?? {});
  const text = `${relativePath}\n${metaText}`;
  if (/罗马|rome|roman/i.test(text)) return "rome-imperial";
  if (/三国|蜀|魏|吴|晋|后汉|资治通鉴|china/i.test(text)) return "china-three-kingdoms";
  return null;
}

function normalizeCard(card) {
  const peopleCore = arrayOrEmpty(card.peopleCore).length ? arrayOrEmpty(card.peopleCore) : arrayOrEmpty(card.people);
  const factBrief = textOrNull(card.factBrief) ?? textOrNull(card.fact);
  const factDetailed = textOrNull(card.factDetailed) ?? textOrNull(card.fact);

  return {
    sourceTitle: textOrNull(card.source),
    sourceType: textOrNull(card.sourceType),
    author: textOrNull(card.author),
    commentaryAuthor: textOrNull(card.commentaryAuthor),
    quotedWork: textOrNull(card.quotedWork),
    section: textOrNull(card.section),
    locator: textOrNull(card.locator),
    year: integerOrNull(card.year),
    displayDate: textOrNull(card.displayDate),
    originalText: textOrNull(card.text),
    translation: textOrNull(card.translation),
    peopleCore,
    peopleMentioned: arrayOrEmpty(card.peopleMentioned),
    places: arrayOrEmpty(card.places),
    macroEvent: textOrNull(card.macroEvent),
    eventLabel: textOrNull(card.event),
    factBrief,
    factDetailed,
    factType: textOrNull(card.factType),
    confidence: confidenceValues.has(card.confidence) ? card.confidence : null,
    questions: arrayOrEmpty(card.questions),
  };
}

function requireStagingSchema(db) {
  const row = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'import_evidence_cards'").get();
  if (!row) {
    throw new Error("Missing import staging tables. Run `npm run db:build` first.");
  }
}

async function importFile(db, filePath, statements) {
  const content = await readFile(filePath, "utf8");
  const relativePath = normalizeRelativePath(filePath);
  const sha256 = createHash("sha256").update(content).digest("hex");
  const fileId = `file:${stableId(`${batchId}:${relativePath}`)}`;
  const now = new Date().toISOString();
  let draft;
  let fileErrors = [];
  let fileWarnings = [];

  try {
    draft = JSON.parse(content);
  } catch (error) {
    draft = null;
    fileErrors = [`Invalid JSON: ${error.message}`];
  }

  const cards = arrayOrEmpty(draft?.evidenceCards);
  const cardValidations = cards.map(validateCard);
  const errorCount = fileErrors.length + cardValidations.reduce((sum, result) => sum + result.errors.length, 0);
  const warningCount = fileWarnings.length + cardValidations.reduce((sum, result) => sum + result.warnings.length, 0);
  const importStatus = errorCount > 0 ? "needs-fix" : "staged";
  const corpusHint = inferCorpusHint(relativePath, draft);
  const collectionHint = inferCollectionHint(relativePath, draft);

  statements.insertFile.run(
    fileId,
    batchId,
    relativePath,
    sha256,
    provider,
    corpusHint,
    collectionHint,
    cards.length,
    errorCount,
    warningCount,
    importStatus,
    toJson(draft),
    now,
  );

  for (const [index, card] of cards.entries()) {
    const normalized = normalizeCard(card);
    const validation = cardValidations[index];
    const cardId = `card:${stableId(`${fileId}:${index}:${normalized.sourceTitle ?? ""}:${normalized.locator ?? ""}:${normalized.originalText ?? ""}`)}`;
    const reviewStatus = validation.errors.length > 0 ? "needs-fix" : "staged";

    statements.insertCard.run(
      cardId,
      batchId,
      fileId,
      index,
      normalized.sourceTitle,
      normalized.sourceType,
      normalized.author,
      normalized.commentaryAuthor,
      normalized.quotedWork,
      normalized.section,
      normalized.locator,
      normalized.year,
      normalized.displayDate,
      normalized.originalText,
      normalized.translation,
      toJson(normalized.peopleCore),
      toJson(normalized.peopleMentioned),
      toJson(normalized.places),
      normalized.macroEvent,
      normalized.eventLabel,
      normalized.factBrief,
      normalized.factDetailed,
      normalized.factType,
      normalized.confidence,
      toJson(normalized.questions),
      reviewStatus,
      toJson(validation.errors),
      toJson(validation.warnings),
      toJson(card),
      now,
    );
  }

  return { relativePath, cards: cards.length, errors: errorCount, warnings: warningCount };
}

if (!existsSync(dbPath)) {
  throw new Error("Missing db/chronoatlas.sqlite. Run `npm run db:build` first.");
}

const files = await resolveInputFiles();
if (!files.length) {
  console.log("No evidence-card draft files found.");
  process.exit(0);
}

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA foreign_keys = ON;");
  requireStagingSchema(db);

  if (reset) {
    db.prepare("DELETE FROM import_batches WHERE source_provider = ?").run(provider);
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO import_batches (id, created_at, source_provider, source_root, status, notes, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      created_at = excluded.created_at,
      source_provider = excluded.source_provider,
      source_root = excluded.source_root,
      status = excluded.status,
      notes = excluded.notes,
      raw_json = excluded.raw_json
  `).run(
    batchId,
    now,
    provider,
    normalizeRelativePath(defaultInputDir),
    "staged",
    reset ? "Imported after resetting previous provider batches." : null,
    toJson({ args, fileCount: files.length }),
  );

  const statements = {
    insertFile: db.prepare(`
      INSERT INTO import_draft_files (
        id, batch_id, relative_path, sha256, source_provider, corpus_hint,
        collection_hint, card_count, error_count, warning_count, import_status,
        raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(batch_id, relative_path) DO UPDATE SET
        sha256 = excluded.sha256,
        source_provider = excluded.source_provider,
        corpus_hint = excluded.corpus_hint,
        collection_hint = excluded.collection_hint,
        card_count = excluded.card_count,
        error_count = excluded.error_count,
        warning_count = excluded.warning_count,
        import_status = excluded.import_status,
        raw_json = excluded.raw_json,
        created_at = excluded.created_at
    `),
    insertCard: db.prepare(`
      INSERT INTO import_evidence_cards (
        id, batch_id, file_id, card_index, source_title, source_type, author,
        commentary_author, quoted_work, section, locator, year, display_date,
        original_text, translation, people_core_json, people_mentioned_json,
        places_json, macro_event, event_label, fact_brief, fact_detailed,
        fact_type, confidence, questions_json, review_status,
        validation_errors_json, validation_warnings_json, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(file_id, card_index) DO UPDATE SET
        source_title = excluded.source_title,
        source_type = excluded.source_type,
        author = excluded.author,
        commentary_author = excluded.commentary_author,
        quoted_work = excluded.quoted_work,
        section = excluded.section,
        locator = excluded.locator,
        year = excluded.year,
        display_date = excluded.display_date,
        original_text = excluded.original_text,
        translation = excluded.translation,
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
        created_at = excluded.created_at
    `),
  };

  db.exec("BEGIN;");
  const summaries = [];
  try {
    for (const file of files) {
      summaries.push(await importFile(db, file, statements));
    }
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  const totals = summaries.reduce(
    (accumulator, summary) => ({
      files: accumulator.files + 1,
      cards: accumulator.cards + summary.cards,
      errors: accumulator.errors + summary.errors,
      warnings: accumulator.warnings + summary.warnings,
    }),
    { files: 0, cards: 0, errors: 0, warnings: 0 },
  );

  console.log(`Imported staging batch ${batchId}`);
  console.log(`files=${totals.files}, cards=${totals.cards}, errors=${totals.errors}, warnings=${totals.warnings}`);
} finally {
  db.close();
}
