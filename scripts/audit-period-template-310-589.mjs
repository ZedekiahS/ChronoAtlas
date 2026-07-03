import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite", { readOnly: true });

const periodId = "china-wei-jin-northern-southern-310-589";
const periodPrefix = `${periodId}:%`;
const startYear = 310;
const endYear = 589;

const requiredSources = [
  "jinshu",
  "songshu",
  "nanqishu",
  "liangshu",
  "chenshu",
  "weishu",
  "beiqishu",
  "zhoushu",
  "suishu",
  "zizhi-tongjian-jin",
  "zizhi-tongjian-song",
  "zizhi-tongjian-qi",
  "zizhi-tongjian-liang",
  "zizhi-tongjian-chen",
  "zizhi-tongjian-sui",
  "nanshi",
  "beishi",
];

const thresholds = {
  events: 35,
  sourceMentions: 100,
  verifiedSourceMentions: 100,
  eventEvidenceLinks: 35,
  evidenceClaims: 20,
  searchDocuments: 100,
  requiredSourceMentionMinimum: 1,
  forbiddenWikisourceMentions: 0,
  locatorOnlyOrPendingMentions: 0,
  eventEvidenceWithoutQuote: 0,
  corePersons: 30,
  personLifeEvents: 35,
  personEventLinks: 35,
};

function all(sql, ...params) {
  return db.prepare(sql).all(...params);
}

function one(sql, ...params) {
  return db.prepare(sql).get(...params);
}

function check(id, label, actual, threshold, pass = actual >= threshold) {
  return { id, label, actual, threshold, pass };
}

const sourceCounts = all(
  `
    SELECT source_id, count(*) AS count
    FROM source_mentions
    WHERE id LIKE ?
    GROUP BY source_id
    ORDER BY source_id
  `,
  periodPrefix,
);

const sourceCountMap = new Map(sourceCounts.map((row) => [row.source_id, row.count]));
const requiredSourceChecks = requiredSources.map((sourceId) =>
  check(
    `source-covered:${sourceId}`,
    `required source covered / ${sourceId}`,
    sourceCountMap.get(sourceId) ?? 0,
    thresholds.requiredSourceMentionMinimum,
  ),
);

const metrics = {
  events: one(
    `
      SELECT count(*) AS count
      FROM events
      WHERE region_id = 'china'
        AND time_start BETWEEN ? AND ?
    `,
    startYear,
    endYear,
  )?.count ?? 0,
  sourceMentions: one(
    `
      SELECT count(*) AS count
      FROM source_mentions
      WHERE id LIKE ?
    `,
    periodPrefix,
  )?.count ?? 0,
  verifiedSourceMentions: one(
    `
      SELECT count(*) AS count
      FROM source_mentions
      WHERE id LIKE ?
        AND json_extract(raw_json, '$.originalTextStatus') = 'verified-transcribed'
        AND length(trim(COALESCE(text, ''))) > 0
        AND text NOT LIKE '原文待摘录%'
    `,
    periodPrefix,
  )?.count ?? 0,
  locatorOnlyOrPendingMentions: one(
    `
      SELECT count(*) AS count
      FROM source_mentions
      WHERE id LIKE ?
        AND (
          json_extract(raw_json, '$.originalTextStatus') IN ('locator-only', 'not-yet-transcribed')
          OR text LIKE '原文待摘录%'
        )
    `,
    periodPrefix,
  )?.count ?? 0,
  eventEvidenceLinks: one(
    `
      SELECT count(*) AS count
      FROM evidence_links l
      JOIN events e ON l.subject_table = 'events' AND l.subject_id = e.id
      WHERE e.region_id = 'china'
        AND e.time_start BETWEEN ? AND ?
    `,
    startYear,
    endYear,
  )?.count ?? 0,
  eventEvidenceWithoutQuote: one(
    `
      SELECT count(*) AS count
      FROM evidence_links l
      JOIN events e ON l.subject_table = 'events' AND l.subject_id = e.id
      WHERE e.region_id = 'china'
        AND e.time_start BETWEEN ? AND ?
        AND (l.quote IS NULL OR length(trim(l.quote)) = 0 OR l.quote LIKE '原文待摘录%')
    `,
    startYear,
    endYear,
  )?.count ?? 0,
  evidenceClaims: one(
    `
      SELECT count(*) AS count
      FROM evidence_claims
      WHERE period_id = ?
    `,
    periodId,
  )?.count ?? 0,
  corePersons: one(
    `
      SELECT count(*) AS count
      FROM entities
      WHERE entity_type = 'person'
        AND region_id = 'china'
        AND json_extract(raw_json, '$.periodId') = ?
    `,
    periodId,
  )?.count ?? 0,
  personLifeEvents: one(
    `
      SELECT count(*) AS count
      FROM person_life_events
      WHERE id LIKE 'china-310-589-life:%'
    `,
  )?.count ?? 0,
  personEventLinks: one(
    `
      SELECT count(*) AS count
      FROM event_entities ee
      JOIN events e ON e.id = ee.event_id
      WHERE e.region_id = 'china'
        AND e.time_start BETWEEN ? AND ?
        AND json_extract(ee.raw_json, '$.periodId') = ?
        AND json_extract(ee.raw_json, '$.generatedFrom') = 'core-person-life'
    `,
    startYear,
    endYear,
    periodId,
  )?.count ?? 0,
  searchDocuments: one(
    `
      SELECT count(*) AS count
      FROM search_documents
      WHERE period_id = ?
    `,
    periodId,
  )?.count ?? 0,
  forbiddenWikisourceMentions: one(
    `
      SELECT count(*) AS count
      FROM source_mentions
      WHERE id LIKE ?
        AND (
          json_extract(raw_json, '$.transcriptionSourceUrl') LIKE '%wikisource.org%'
          OR lower(COALESCE(text, '')) LIKE '%wikisource.org%'
        )
    `,
    periodPrefix,
  )?.count ?? 0,
  sourceCounts,
};

const checks = [
  check("events", "310-589 China events", metrics.events, thresholds.events),
  check("source-mentions", "310-589 source mentions", metrics.sourceMentions, thresholds.sourceMentions),
  check("verified-source-mentions", "verified original excerpts", metrics.verifiedSourceMentions, thresholds.verifiedSourceMentions),
  check(
    "locator-only-or-pending",
    "locator-only / pending original excerpts",
    metrics.locatorOnlyOrPendingMentions,
    thresholds.locatorOnlyOrPendingMentions,
    metrics.locatorOnlyOrPendingMentions === thresholds.locatorOnlyOrPendingMentions,
  ),
  check("event-evidence-links", "event evidence links", metrics.eventEvidenceLinks, thresholds.eventEvidenceLinks),
  check(
    "event-evidence-without-quote",
    "event evidence links without quote",
    metrics.eventEvidenceWithoutQuote,
    thresholds.eventEvidenceWithoutQuote,
    metrics.eventEvidenceWithoutQuote === thresholds.eventEvidenceWithoutQuote,
  ),
  check("evidence-claims", "evidence claims", metrics.evidenceClaims, thresholds.evidenceClaims),
  check("core-persons", "310-589 core person cards", metrics.corePersons, thresholds.corePersons),
  check("person-life-events", "310-589 person life events", metrics.personLifeEvents, thresholds.personLifeEvents),
  check("person-event-links", "310-589 person-event links", metrics.personEventLinks, thresholds.personEventLinks),
  check("search-documents", "search documents", metrics.searchDocuments, thresholds.searchDocuments),
  check(
    "forbidden-wikisource",
    "Wikisource transcription URLs",
    metrics.forbiddenWikisourceMentions,
    thresholds.forbiddenWikisourceMentions,
    metrics.forbiddenWikisourceMentions === thresholds.forbiddenWikisourceMentions,
  ),
  ...requiredSourceChecks,
];

const report = {
  purpose: "period-template-audit-310-589",
  generatedAt: new Date().toISOString(),
  pass: checks.every((item) => item.pass),
  metrics,
  thresholds,
  checks,
};

console.log(JSON.stringify(report, null, 2));

if (!report.pass) {
  process.exitCode = 1;
}

db.close();
