import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const db = new DatabaseSync(dbPath, { readOnly: true });

const works = [
  {
    id: "sanguozhi",
    label: "Sanguozhi",
    sourceWhere: "id LIKE 'sanguozhi%' OR title LIKE '%三国志%'",
    mentionWhere: "s.id LIKE 'sanguozhi%' OR m.work_title LIKE '%三国志%'",
    passageWhere: "s.id LIKE 'sanguozhi%' OR s.title LIKE '%三国志%'",
    clusterWhere: "batch_id LIKE '%sanguozhi%'",
  },
  {
    id: "houhanshu",
    label: "Houhanshu",
    sourceWhere: "id LIKE 'houhanshu%' OR title LIKE '%后汉书%'",
    mentionWhere: "s.id LIKE 'houhanshu%' OR m.work_title LIKE '%后汉书%'",
    passageWhere: "s.id LIKE 'houhanshu%' OR s.title LIKE '%后汉书%'",
    clusterWhere: "batch_id LIKE '%houhanshu%'",
  },
  {
    id: "jinshu",
    label: "Jinshu",
    sourceWhere: "id LIKE 'jinshu%' OR title LIKE '%晋书%'",
    mentionWhere: "s.id LIKE 'jinshu%' OR m.work_title LIKE '%晋书%'",
    passageWhere: "s.id LIKE 'jinshu%' OR s.title LIKE '%晋书%'",
    clusterWhere: "batch_id LIKE '%jinshu%'",
  },
  {
    id: "hanshu",
    label: "Hanshu",
    sourceWhere: "(id LIKE 'hanshu%' OR title LIKE '%汉书%') AND NOT (id LIKE 'houhanshu%' OR title LIKE '%后汉书%')",
    mentionWhere:
      "(s.id LIKE 'hanshu%' OR m.work_title LIKE '%汉书%') AND NOT (s.id LIKE 'houhanshu%' OR m.work_title LIKE '%后汉书%')",
    passageWhere:
      "(s.id LIKE 'hanshu%' OR s.title LIKE '%汉书%') AND NOT (s.id LIKE 'houhanshu%' OR s.title LIKE '%后汉书%')",
    clusterWhere: "batch_id LIKE '%hanshu%' AND batch_id NOT LIKE '%houhanshu%'",
  },
];

function scalar(sql, params = []) {
  return db.prepare(sql).get(...params)?.value ?? 0;
}

function rows(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function pct(numerator, denominator) {
  if (!denominator) {
    return "n/a";
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function getWorkStats(work) {
  const sourceIds = `SELECT id FROM sources WHERE ${work.sourceWhere}`;
  const mentionIds = `
    SELECT m.id
    FROM source_mentions m
    JOIN sources s ON s.id = m.source_id
    WHERE ${work.mentionWhere}
  `;
  const mentions = scalar(`
    SELECT COUNT(*) AS value
    FROM source_mentions m
    JOIN sources s ON s.id = m.source_id
    WHERE ${work.mentionWhere}
  `);
  const anyLinkedMentions = scalar(`
    SELECT COUNT(DISTINCT mi.id) AS value
    FROM (${mentionIds}) mi
    WHERE EXISTS (SELECT 1 FROM source_mention_people smp WHERE smp.mention_id = mi.id)
       OR EXISTS (SELECT 1 FROM source_mention_events sme WHERE sme.mention_id = mi.id)
  `);
  const personLinkedMentions = scalar(`
    SELECT COUNT(DISTINCT smp.mention_id) AS value
    FROM source_mention_people smp
    WHERE smp.mention_id IN (${mentionIds})
  `);
  const eventLinkedMentions = scalar(`
    SELECT COUNT(DISTINCT sme.mention_id) AS value
    FROM source_mention_events sme
    WHERE sme.mention_id IN (${mentionIds})
  `);
  const promotedClusters = scalar(`
    SELECT COUNT(*) AS value
    FROM import_event_clusters
    WHERE ${work.clusterWhere}
      AND match_status = 'matched'
      AND review_status = 'promoted'
  `);
  const needsReviewClusters = scalar(`
    SELECT COUNT(*) AS value
    FROM import_event_clusters
    WHERE ${work.clusterWhere}
      AND review_status = 'needs-review'
  `);
  const rejectedClusters = scalar(`
    SELECT COUNT(*) AS value
    FROM import_event_clusters
    WHERE ${work.clusterWhere}
      AND review_status = 'rejected'
  `);

  return {
    work: work.label,
    sources: scalar(`SELECT COUNT(*) AS value FROM sources WHERE ${work.sourceWhere}`),
    sourcePassages: scalar(`
      SELECT COUNT(*) AS value
      FROM source_passages p
      JOIN sources s ON s.id = p.source_id
      WHERE ${work.passageWhere}
    `),
    sourceMentions: mentions,
    linkedMentions: anyLinkedMentions,
    unlinkedMentions: mentions - anyLinkedMentions,
    linkedMentionRate: pct(anyLinkedMentions, mentions),
    personLinkedMentions,
    distinctMentionPeople: scalar(`
      SELECT COUNT(DISTINCT smp.person_id) AS value
      FROM source_mention_people smp
      WHERE smp.mention_id IN (${mentionIds})
    `),
    eventLinkedMentions,
    distinctMentionEvents: scalar(`
      SELECT COUNT(DISTINCT sme.event_id) AS value
      FROM source_mention_events sme
      WHERE sme.mention_id IN (${mentionIds})
    `),
    lifeEventsWithMentionSource: scalar(`
      SELECT COUNT(DISTINCT plem.life_event_id) AS value
      FROM person_life_event_source_mentions plem
      WHERE plem.mention_id IN (${mentionIds})
    `),
    eventsWithDirectSource: scalar(`
      SELECT COUNT(DISTINCT hes.event_id) AS value
      FROM historical_event_sources hes
      WHERE hes.source_id IN (${sourceIds})
    `),
    importClustersPromoted: promotedClusters,
    importClustersNeedsReview: needsReviewClusters,
    importClustersRejected: rejectedClusters,
  };
}

function printSamples(work) {
  const samples = rows(
    `
    SELECT m.id, m.source_id AS sourceId, m.locator, m.year, substr(m.text, 1, 80) AS textStart
    FROM source_mentions m
    JOIN sources s ON s.id = m.source_id
    WHERE (${work.mentionWhere})
      AND NOT EXISTS (SELECT 1 FROM source_mention_people smp WHERE smp.mention_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM source_mention_events sme WHERE sme.mention_id = m.id)
    ORDER BY COALESCE(m.year, 999999), m.id
    LIMIT 5
    `,
  );

  if (!samples.length) {
    return;
  }

  console.log(`\n${work.label} unlinked mention samples:`);
  console.table(samples);
}

const stats = works.map(getWorkStats);

console.log(`Source card extraction audit: ${path.relative(rootDir, dbPath)}`);
console.table(stats);

const clusterSummary = rows(`
  SELECT batch_id AS batchId,
         match_status AS matchStatus,
         review_status AS reviewStatus,
         COUNT(*) AS count,
         SUM(CASE WHEN matched_event_id IS NOT NULL AND matched_event_id <> '' THEN 1 ELSE 0 END) AS matchedCount
  FROM import_event_clusters
  GROUP BY batch_id, match_status, review_status
  ORDER BY count DESC
`);

if (clusterSummary.length) {
  console.log("\nImport event cluster status:");
  console.table(clusterSummary);
}

for (const work of works) {
  printSamples(work);
}

const incompleteWorks = stats.filter((stat) => stat.unlinkedMentions > 0 || stat.importClustersNeedsReview > 0);
if (incompleteWorks.length) {
  console.log("\nIncomplete extraction remains:");
  console.table(
    incompleteWorks.map((stat) => ({
      work: stat.work,
      unlinkedMentions: stat.unlinkedMentions,
      importClustersNeedsReview: stat.importClustersNeedsReview,
    })),
  );
  process.exitCode = 1;
} else {
  console.log("\nAll audited source mentions are linked to person/event cards.");
}

db.close();
