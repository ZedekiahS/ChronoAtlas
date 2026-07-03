import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite", { readOnly: true });

const coreRegions = ["china", "rome", "sasanian-persia"];

const thresholds = {
  events: {
    china: 250,
    rome: 150,
    "sasanian-persia": 20,
  },
  people: {
    china: 120,
    rome: 30,
    "sasanian-persia": 5,
  },
  eventEvidenceLinks: {
    china: 300,
    rome: 150,
    "sasanian-persia": 25,
  },
  evidenceClaims: {
    china: 20,
    rome: 35,
    "sasanian-persia": 5,
  },
  ragQuestions: 60,
  ragAverageScore: 0.95,
  ragFailedQuestions: 0,
  mapControlRecords: 1000,
};

function all(sql, ...params) {
  return db.prepare(sql).all(...params);
}

function one(sql, ...params) {
  return db.prepare(sql).get(...params);
}

function countByRegion(rows) {
  return Object.fromEntries(coreRegions.map((regionId) => [
    regionId,
    rows.find((row) => row.region_id === regionId)?.count ?? 0,
  ]));
}

function regionalChecks(metricId, label, actualByRegion, thresholdByRegion) {
  return coreRegions.map((regionId) => ({
    id: `${metricId}:${regionId}`,
    label: `${label} / ${regionId}`,
    actual: actualByRegion[regionId],
    threshold: thresholdByRegion[regionId],
    pass: actualByRegion[regionId] >= thresholdByRegion[regionId],
  }));
}

const metrics = {
  events: countByRegion(all(`
    SELECT region_id, COUNT(*) AS count
    FROM events
    WHERE region_id IN ('china', 'rome', 'sasanian-persia')
      AND time_start BETWEEN 190 AND 310
    GROUP BY region_id
  `)),
  people: countByRegion(all(`
    SELECT region_id, COUNT(*) AS count
    FROM entities
    WHERE entity_type = 'person'
      AND region_id IN ('china', 'rome', 'sasanian-persia')
      AND COALESCE(time_start, 310) <= 310
      AND COALESCE(time_end, 190) >= 190
    GROUP BY region_id
  `)),
  eventEvidenceLinks: countByRegion(all(`
    SELECT e.region_id, COUNT(*) AS count
    FROM evidence_links l
    JOIN events e ON l.subject_table = 'events' AND l.subject_id = e.id
    WHERE e.region_id IN ('china', 'rome', 'sasanian-persia')
      AND e.time_start BETWEEN 190 AND 310
    GROUP BY e.region_id
  `)),
  evidenceClaims: countByRegion(all(`
    SELECT region_id, COUNT(*) AS count
    FROM evidence_claims
    WHERE region_id IN ('china', 'rome', 'sasanian-persia')
      AND COALESCE(time_start, 310) <= 310
      AND COALESCE(time_end, 190) >= 190
    GROUP BY region_id
  `)),
  ragQuestions: one(`
    SELECT COUNT(*) AS count
    FROM rag_eval_questions
    WHERE question_set_id = 'sample-190-310-v1'
  `)?.count ?? 0,
  latestRagRun: one(`
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
  `),
  mapControlRecords: one(`
    SELECT COUNT(*) AS count
    FROM map_control_records
    WHERE start_year <= 310 AND end_year >= 190
  `)?.count ?? 0,
};

const latestRagRun = metrics.latestRagRun ?? {
  id: null,
  created_at: null,
  total_questions: 0,
  passed_questions: 0,
  failed_questions: Number.POSITIVE_INFINITY,
  average_score: 0,
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
    pass: metrics.ragQuestions >= thresholds.ragQuestions,
  },
  {
    id: "rag-latest-run-failures",
    label: "latest RAG eval failures",
    actual: latestRagRun.failed_questions,
    threshold: thresholds.ragFailedQuestions,
    pass: latestRagRun.failed_questions === thresholds.ragFailedQuestions,
  },
  {
    id: "rag-latest-run-average",
    label: "latest RAG eval average score",
    actual: Number(latestRagRun.average_score ?? 0),
    threshold: thresholds.ragAverageScore,
    pass: Number(latestRagRun.average_score ?? 0) >= thresholds.ragAverageScore,
  },
  {
    id: "map-control-records",
    label: "190-310 map control records",
    actual: metrics.mapControlRecords,
    threshold: thresholds.mapControlRecords,
    pass: metrics.mapControlRecords >= thresholds.mapControlRecords,
  },
];

const report = {
  purpose: "period-template-audit-190-310",
  generatedAt: new Date().toISOString(),
  pass: checks.every((check) => check.pass),
  metrics,
  thresholds,
  checks,
};

console.log(JSON.stringify(report, null, 2));

if (!report.pass) {
  process.exitCode = 1;
}
