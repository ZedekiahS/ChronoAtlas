import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const now = new Date().toISOString();
const dryRun = process.argv.includes("--dry-run");
const rebuildChunks = process.argv.includes("--rebuild-chunks");
const requestedBatchIds = process.argv
  .filter((argument) => argument.startsWith("--batch="))
  .map((argument) => argument.slice("--batch=".length))
  .filter(Boolean);

const clausePunctuationRe = /[\u3001\u3002\uff0c\uff1b\uff1a\uff01\uff1f]/gu;
const quoteRe = /[\u300c\u300d\u300e\u300f\u201c\u201d\u2018\u2019]/gu;
const openQuoteRe = /[\u300c\u300e\u201c\u2018]/gu;
const closeQuoteRe = /[\u300d\u300f\u201d\u2019]/gu;
const cjkRe = /\p{Script=Han}/gu;
const eventVerbRe =
  /[\u653b\u51fb\u64ca\u7834\u6740\u6bba\u964d\u53db\u53cd\u7acb\u5e9f\u5ee2\u5f99\u5c01\u7f6e\u7f62\u8a85\u8ba8\u8a0e\u56f4\u570d\u5f81\u4f10\u5165\u9677\u5d29\u85a8\u5352\u5373\u79f0\u7a31\u5efa\u6539\u8d66\u8fc1\u9077\u62dc\u9063\u76df\u548c\u5954\u8d25\u6557\u8d70\u53d6]/u;
const speechVerbRe = /[\u66f0\u4e91\u8a00]/u;
const leadingFragmentRe = /^[\s\u300d\u300f\u201d\u2019\uff0c\u3001\u3002\uff1b\uff1a\uff01\uff1f]+/u;

function parseJson(value, fallback = {}) {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJson(value) {
  return JSON.stringify(value ?? {});
}

function compact(value) {
  return String(value ?? "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(value, re) {
  return compact(value).match(re)?.length ?? 0;
}

function charLength(value) {
  return Array.from(compact(value)).length;
}

function numeric(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function yearSpan(row) {
  if (!Number.isInteger(row.time_start) || !Number.isInteger(row.time_end)) {
    return null;
  }
  return Math.abs(row.time_end - row.time_start);
}

function classifyCluster(row) {
  const label = compact(row.canonical_label);
  const summary = compact(row.summary);
  const combined = compact(`${label} ${summary}`);
  const labelLength = charLength(label);
  const cjkCount = countMatches(label, cjkRe);
  const punctuationCount = countMatches(label, clausePunctuationRe);
  const quoteCount = countMatches(label, quoteRe);
  const openQuoteCount = countMatches(label, openQuoteRe);
  const closeQuoteCount = countMatches(label, closeQuoteRe);
  const span = yearSpan(row);
  const exactYear = span === 0;
  const broadRange = span !== null && span > 10;
  const hasEventVerb = eventVerbRe.test(combined);
  const hasSpeechVerb = speechVerbRe.test(label);
  const truncated = label.includes("...") || label.includes("\u2026");
  const leadingFragment = leadingFragmentRe.test(label);
  const unbalancedQuote = openQuoteCount !== closeQuoteCount;
  const candidateCount = numeric(row.candidate_count);
  const sourceCount = numeric(row.source_count);
  const personCount = numeric(row.person_count);
  const reasons = [];
  let score = 0;

  if (hasEventVerb) {
    score += 2;
    reasons.push("contains-event-verb");
  } else {
    score -= 2;
    reasons.push("no-event-verb");
  }

  if (labelLength >= 4 && labelLength <= 24) {
    score += 3;
    reasons.push("compact-label");
  } else if (labelLength <= 36) {
    score += 1;
    reasons.push("long-but-usable-label");
  } else {
    score -= 3;
    reasons.push("overlong-label");
  }

  if (punctuationCount <= 1) {
    score += 1;
    reasons.push("low-clause-count");
  } else {
    score -= punctuationCount;
    reasons.push("many-clauses");
  }

  if (exactYear) {
    score += 2;
    reasons.push("exact-year");
  } else if (span !== null && span <= 5) {
    score += 1;
    reasons.push("narrow-year-range");
  } else if (broadRange) {
    score -= 2;
    reasons.push("broad-source-range");
  }

  if (candidateCount >= 2) {
    score += 1;
    reasons.push("multi-card-support");
  }
  if (sourceCount >= 2) {
    score += 2;
    reasons.push("multi-source-support");
  }
  if (personCount >= 1) {
    score += 1;
    reasons.push("linked-people");
  }
  if (row.event_scale === "major" || row.event_scale === "medium") {
    score += 1;
    reasons.push("non-minor-scale");
  }
  if (quoteCount > 0) {
    score -= 1;
    reasons.push("contains-quote");
  }
  if (hasSpeechVerb && punctuationCount > 0) {
    score -= 1;
    reasons.push("speech-like-fragment");
  }
  if (truncated) {
    score -= 3;
    reasons.push("truncated-label");
  }
  if (leadingFragment) {
    score -= 3;
    reasons.push("leading-fragment-punctuation");
  }
  if (unbalancedQuote) {
    score -= 2;
    reasons.push("unbalanced-quote");
  }
  if (cjkCount < 2) {
    score -= 3;
    reasons.push("too-few-cjk-characters");
  }

  const severeFragment =
    truncated ||
    leadingFragment ||
    unbalancedQuote ||
    labelLength > 52 ||
    (punctuationCount >= 3 && labelLength > 24) ||
    (!hasEventVerb && labelLength > 18);

  if (severeFragment || score < 1) {
    return {
      reviewStatus: "rejected",
      autoStatus: "fragment-not-formal-event",
      score,
      reasons,
    };
  }

  if (exactYear && score >= 7) {
    return {
      reviewStatus: "needs-review",
      autoStatus: "ready-for-event-detail-review",
      score,
      reasons,
    };
  }

  if (!exactYear && score >= 3) {
    return {
      reviewStatus: "needs-review",
      autoStatus: "needs-date-review",
      score,
      reasons,
    };
  }

  return {
    reviewStatus: "needs-review",
    autoStatus: "weak-event-candidate",
    score,
    reasons,
  };
}

async function rebuildDocumentChunks(db) {
  const migrationPath = path.join(rootDir, "db", "migrations", "007-document-chunks-fts.mjs");
  const migration = await import(`${pathToFileURL(migrationPath).href}?review=${Date.now()}`);
  await migration.default(db);
}

async function main() {
  const db = new DatabaseSync(dbPath);
  const stats = {
    processed: 0,
    changed: 0,
    rejectedFragments: 0,
    needsReview: 0,
    readyForEventDetailReview: 0,
    needsDateReview: 0,
    weakEventCandidates: 0,
    searchDocumentsUpdated: 0,
    documentChunksUpdated: 0,
  };

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    const batchFilter = requestedBatchIds.length
      ? `AND batch_id IN (${requestedBatchIds.map(() => "?").join(",")})`
      : "";
    const rows = db.prepare(`
      SELECT *
      FROM import_event_clusters
      WHERE match_status = 'unmatched'
        AND review_status IN ('staged', 'needs-review', 'rejected')
        ${batchFilter}
      ORDER BY batch_id, time_start, id
    `).all(...requestedBatchIds);

    const updateCluster = db.prepare(`
      UPDATE import_event_clusters
      SET review_status = ?,
          raw_json = ?
      WHERE id = ?
    `);
    const documentRows = db.prepare(`
      SELECT id, subject_id, raw_json
      FROM search_documents
      WHERE subject_table = 'import_event_clusters'
    `).all();
    const documentsByCluster = new Map();
    for (const documentRow of documentRows) {
      const list = documentsByCluster.get(documentRow.subject_id) ?? [];
      list.push(documentRow);
      documentsByCluster.set(documentRow.subject_id, list);
    }
    const updateDocument = db.prepare(`
      UPDATE search_documents
      SET review_status = ?,
          raw_json = ?
      WHERE id = ?
    `);
    const updateDocumentChunks = db.prepare(`
      UPDATE document_chunks
      SET review_status = ?
      WHERE search_document_id = ?
    `);

    if (!dryRun) {
      db.exec("BEGIN;");
    }

    try {
      for (const row of rows) {
        const classification = classifyCluster(row);
        const raw = parseJson(row.raw_json);
        const nextRaw = {
          ...raw,
          review: {
            ...(raw.review ?? {}),
            generatedFrom: "review-import-event-clusters",
            reviewedAt: now,
            autoStatus: classification.autoStatus,
            score: classification.score,
            reasons: classification.reasons,
          },
        };

        stats.processed += 1;
        if (classification.reviewStatus === "rejected") {
          stats.rejectedFragments += 1;
        } else {
          stats.needsReview += 1;
        }
        if (classification.autoStatus === "ready-for-event-detail-review") {
          stats.readyForEventDetailReview += 1;
        } else if (classification.autoStatus === "needs-date-review") {
          stats.needsDateReview += 1;
        } else if (classification.autoStatus === "weak-event-candidate") {
          stats.weakEventCandidates += 1;
        }

        if (row.review_status !== classification.reviewStatus || row.raw_json !== toJson(nextRaw)) {
          stats.changed += 1;
          if (!dryRun) {
            updateCluster.run(classification.reviewStatus, toJson(nextRaw), row.id);
          }
        }

        for (const doc of documentsByCluster.get(row.id) ?? []) {
          const docRaw = parseJson(doc.raw_json);
          const nextDocRaw = {
            ...docRaw,
            clusterReview: {
              generatedFrom: "review-import-event-clusters",
              reviewedAt: now,
              autoStatus: classification.autoStatus,
              score: classification.score,
              reasons: classification.reasons,
            },
          };
          if (!dryRun) {
            updateDocument.run(classification.reviewStatus, toJson(nextDocRaw), doc.id);
            const result = updateDocumentChunks.run(classification.reviewStatus, doc.id);
            stats.documentChunksUpdated += result.changes;
          }
          stats.searchDocumentsUpdated += 1;
        }
      }

      if (!dryRun) {
        db.exec("COMMIT;");
        if (rebuildChunks) {
          await rebuildDocumentChunks(db);
        }
      }
    } catch (error) {
      if (!dryRun) {
        db.exec("ROLLBACK;");
      }
      throw error;
    }

    const byStatus = db.prepare(`
      SELECT match_status, review_status, event_scale, COUNT(*) AS count
      FROM import_event_clusters
      ${requestedBatchIds.length ? `WHERE batch_id IN (${requestedBatchIds.map(() => "?").join(",")})` : ""}
      GROUP BY match_status, review_status, event_scale
      ORDER BY match_status, review_status, event_scale
    `).all(...requestedBatchIds);

    console.log(JSON.stringify({
      ...stats,
      dryRun,
      rebuildChunks,
      batchIds: requestedBatchIds,
      byStatus,
      generatedAt: now,
    }, null, 2));
  } finally {
    db.close();
  }
}

await main();
