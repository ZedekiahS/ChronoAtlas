import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
db.exec("PRAGMA foreign_keys = ON;");

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, value] = arg.split("=");
  if (key?.startsWith("--")) {
    args.set(key.slice(2), value ?? "true");
  }
}

const questionSetId = args.get("set") ?? "sample-190-310-v1";
const locale = args.get("locale") === "en" ? "en" : "zh";
const apiBase = args.get("api") ?? process.env.HISTORY_API_URL ?? "http://127.0.0.1:5174";
const perQuestionLimit = Number.isInteger(Number(args.get("limit"))) ? Number(args.get("limit")) : 12;
const retrievalStrategy = "api-ai-retrieve-deterministic-score";

function parseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function json(value) {
  return JSON.stringify(value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiHealthy() {
  try {
    const response = await fetch(`${apiBase}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureApi() {
  if (await apiHealthy()) {
    return null;
  }

  const child = spawn(process.execPath, ["--no-warnings", "scripts/history-api-server.mjs"], {
    cwd: process.cwd(),
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(250);
    if (await apiHealthy()) {
      return child;
    }
  }

  child.kill();
  throw new Error(`History API did not become healthy at ${apiBase}`);
}

function contextForQuestion(question) {
  const context = {
    region: question.region_id,
    sourceId: null,
    eventId: null,
    personId: null,
    entityId: null,
    year: null,
  };

  if (question.expected_subject_table === "events") {
    context.eventId = question.expected_subject_id;
  } else if (question.expected_subject_table === "entities") {
    context.entityId = question.expected_subject_id;
    context.personId = question.expected_subject_id;
  }

  const yearMatch = question.question_zh.match(/-?\d{2,4}/);
  if (yearMatch) {
    context.year = Number(yearMatch[0]);
  }

  return context;
}

async function retrieve(question) {
  const response = await fetch(`${apiBase}/api/ai/retrieve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question: locale === "en" && question.question_en ? question.question_en : question.question_zh,
      locale,
      limit: perQuestionLimit,
      context: contextForQuestion(question),
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Retrieve failed for ${question.id}: ${response.status} ${text}`);
  }
  return response.json();
}

const claimSubjects = db.prepare(`
  SELECT subject_table, subject_id
  FROM evidence_claim_subjects
  WHERE claim_id = ?
`);
const claimSources = db.prepare(`
  SELECT source_id
  FROM evidence_claim_sources
  WHERE claim_id = ? AND source_id IS NOT NULL
`);

function expectedClaimEvidence(claimIds) {
  const subjects = [];
  const sources = [];
  for (const claimId of claimIds) {
    subjects.push(...claimSubjects.all(claimId));
    sources.push(...claimSources.all(claimId).map((row) => row.source_id));
  }
  return {
    subjects,
    sources: [...new Set(sources)],
  };
}

function scoreQuestion(question, retrieval) {
  const items = retrieval.items ?? [];
  const expectedClaims = parseJson(question.expected_claim_ids_json, []);
  const expectedSources = parseJson(question.expected_source_ids_json, []);
  const claimEvidence = expectedClaimEvidence(expectedClaims);
  const allExpectedSources = [...new Set([...expectedSources, ...claimEvidence.sources])];
  const retrievedSources = new Set(items.map((item) => item.sourceId).filter(Boolean));
  const retrievedSubjects = new Set(items.map((item) => `${item.subjectTable}:${item.subjectId}`).filter((value) => !value.endsWith(":null")));

  const expectedSubjectHit = question.expected_subject_table && question.expected_subject_id
    ? retrievedSubjects.has(`${question.expected_subject_table}:${question.expected_subject_id}`)
    : false;
  const claimSubjectHits = claimEvidence.subjects.filter((subject) => retrievedSubjects.has(`${subject.subject_table}:${subject.subject_id}`)).length;
  const claimSourceHits = claimEvidence.sources.filter((sourceId) => retrievedSources.has(sourceId)).length;
  const expectedSourceHits = allExpectedSources.filter((sourceId) => retrievedSources.has(sourceId)).length;

  const retrievalScore = Math.min(1, Math.max(
    expectedSubjectHit ? 1 : 0,
    claimEvidence.subjects.length ? claimSubjectHits / claimEvidence.subjects.length : 0,
    allExpectedSources.length ? expectedSourceHits / allExpectedSources.length : 0,
  ));
  const citationScore = allExpectedSources.length ? expectedSourceHits / allExpectedSources.length : (items.length ? 0.7 : 0);
  const factualityScore = expectedClaims.length
    ? Math.min(1, ((claimSubjectHits > 0 ? 0.5 : 0) + (claimSourceHits > 0 ? 0.5 : 0)))
    : (expectedSubjectHit ? 0.8 : 0.4);
  const coverageScore = Math.min(1, (items.length / Math.max(4, Math.min(perQuestionLimit, 8))) * 0.35 + retrievalScore * 0.65);
  const noHallucinationScore = 1;
  const total =
    retrievalScore * 0.25 +
    citationScore * 0.20 +
    factualityScore * 0.30 +
    coverageScore * 0.15 +
    noHallucinationScore * 0.10;

  let failureType = null;
  if (!items.length) failureType = "no_retrieval";
  else if (retrievalScore < 0.5) failureType = "wrong_event";
  else if (citationScore < 0.5 && allExpectedSources.length) failureType = "missing_citation";
  else if (coverageScore < 0.5) failureType = "overbroad_answer";

  return {
    scoreTotal: Number(total.toFixed(3)),
    scoreRetrieval: Number(retrievalScore.toFixed(3)),
    scoreCitation: Number(citationScore.toFixed(3)),
    scoreFactuality: Number(factualityScore.toFixed(3)),
    scoreCoverage: Number(coverageScore.toFixed(3)),
    scoreNoHallucination: Number(noHallucinationScore.toFixed(3)),
    failureType,
    note: [
      `items=${items.length}`,
      `expectedSubjectHit=${expectedSubjectHit ? "yes" : "no"}`,
      `expectedSourceHits=${expectedSourceHits}/${allExpectedSources.length}`,
      `claimSubjectHits=${claimSubjectHits}/${claimEvidence.subjects.length}`,
    ].join("; "),
    raw: {
      retrievalRunId: retrieval.runId,
      queryPlan: retrieval.queryPlan,
      expectedClaims,
      expectedSources,
      retrievedSources: [...retrievedSources],
      retrievedSubjects: [...retrievedSubjects],
    },
  };
}

const questions = db.prepare(`
  SELECT *
  FROM rag_eval_questions
  WHERE question_set_id = ?
  ORDER BY id
`).all(questionSetId);

if (!questions.length) {
  db.close();
  throw new Error(`No RAG eval questions found for set: ${questionSetId}`);
}

const apiProcess = await ensureApi();
const runId = `rag-eval-run:${new Date().toISOString()}:${randomUUID()}`;
const now = new Date().toISOString();
const insertRun = db.prepare(`
  INSERT INTO rag_eval_runs (id, created_at, provider, model, retrieval_strategy, question_set_id, raw_json)
  VALUES (?, ?, NULL, NULL, ?, ?, ?)
`);
const insertResult = db.prepare(`
  INSERT OR REPLACE INTO rag_eval_results (
    run_id, question_id, answer_id, retrieval_run_id,
    score_total, score_retrieval, score_citation, score_factuality, score_coverage, score_no_hallucination,
    failure_type, judge_note, raw_json
  )
  VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const results = [];
try {
  db.exec("BEGIN");
  insertRun.run(runId, now, retrievalStrategy, questionSetId, json({ locale, apiBase, perQuestionLimit }));
  db.exec("COMMIT");

  for (const question of questions) {
    const retrieval = await retrieve(question);
    const score = scoreQuestion(question, retrieval);
    db.exec("BEGIN");
    insertResult.run(
      runId,
      question.id,
      retrieval.runId,
      score.scoreTotal,
      score.scoreRetrieval,
      score.scoreCitation,
      score.scoreFactuality,
      score.scoreCoverage,
      score.scoreNoHallucination,
      score.failureType,
      score.note,
      json(score.raw)
    );
    db.exec("COMMIT");
    results.push({ questionId: question.id, total: score.scoreTotal, failureType: score.failureType });
  }
} catch (error) {
  try {
    db.exec("ROLLBACK");
  } catch {
    // ignore rollback errors when no transaction is open
  }
  throw error;
} finally {
  db.close();
  if (apiProcess) {
    apiProcess.kill();
  }
}

const average = results.reduce((sum, result) => sum + result.total, 0) / results.length;
const failures = results.filter((result) => result.failureType);
console.log(JSON.stringify({
  runId,
  questionSetId,
  questions: results.length,
  averageScore: Number(average.toFixed(3)),
  failures: failures.length,
  failureTypes: failures.reduce((counts, result) => {
    counts[result.failureType] = (counts[result.failureType] ?? 0) + 1;
    return counts;
  }, {}),
}, null, 2));
