import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const outputPath = path.join(rootDir, "data", "generated", "china-person-source-index.json");

function parseJsonField(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getPersonSourceIds(db, personId) {
  const rows = db.prepare(`
    SELECT DISTINCT source_id
    FROM (
      SELECT sm.source_id AS source_id
      FROM source_mentions sm
      JOIN source_mention_people smp ON smp.mention_id = sm.id
      WHERE smp.person_id = ?
      UNION
      SELECT plsr.source_id AS source_id
      FROM person_life_events ple
      JOIN person_life_event_source_refs plsr ON plsr.life_event_id = ple.id
      WHERE ple.person_id = ?
    )
    ORDER BY source_id
  `).all(personId, personId);
  return rows.map((row) => row.source_id);
}

function getPersonMentionStats(db, personId) {
  return db.prepare(`
    SELECT
      COUNT(*) AS sourceMentionCount,
      SUM(CASE WHEN sm.review_status = 'reviewed' THEN 1 ELSE 0 END) AS reviewedMentionCount
    FROM source_mentions sm
    JOIN source_mention_people smp ON smp.mention_id = sm.id
    WHERE smp.person_id = ?
  `).get(personId);
}

function getPersonLifeEventStats(db, personId) {
  return db.prepare(`
    SELECT
      COUNT(*) AS lifeEventCount,
      MIN(year) AS firstYear,
      MAX(COALESCE(end_year, year)) AS lastYear
    FROM person_life_events
    WHERE person_id = ?
  `).get(personId);
}

function getPersonCoverage(db, personId) {
  const row = db.prepare(`
    SELECT status, last_reviewed_at, notes, raw_json
    FROM coverage_status
    WHERE person_id = ? AND corpus_id = 'china-three-kingdoms'
  `).get(personId);

  if (!row) {
    return null;
  }

  const sourceRows = db.prepare(`
    SELECT source_id, status
    FROM coverage_status_sources
    WHERE person_id = ? AND corpus_id = 'china-three-kingdoms'
    ORDER BY source_id
  `).all(personId);

  return {
    status: row.status,
    lastReviewedAt: row.last_reviewed_at,
    notes: row.notes,
    raw: parseJsonField(row.raw_json, {}),
    sources: sourceRows.map((sourceRow) => ({
      sourceId: sourceRow.source_id,
      status: sourceRow.status
    }))
  };
}

function getSourceRefsForPerson(db, personId) {
  const rows = db.prepare(`
    SELECT DISTINCT source_id
    FROM coverage_status_sources
    WHERE person_id = ? AND corpus_id = 'china-three-kingdoms'
    ORDER BY source_id
  `).all(personId);

  return rows.map((row) => ({
    sourceId: row.source_id,
    locator: "人物档案"
  }));
}

function getRolesByPersonId(db) {
  const rows = db.prepare(`
    SELECT person_id, role
    FROM person_roles
    ORDER BY person_id, sort_order
  `).all();
  const rolesByPersonId = new Map();
  for (const row of rows) {
    const roles = rolesByPersonId.get(row.person_id) ?? [];
    roles.push(row.role);
    rolesByPersonId.set(row.person_id, roles);
  }
  return rolesByPersonId;
}

function getRelatedEventIdsByLifeEventId(db) {
  const rows = db.prepare(`
    SELECT life_event_id, event_id
    FROM person_life_event_historical_events
    ORDER BY life_event_id, sort_order
  `).all();
  const eventIdsByLifeEventId = new Map();
  for (const row of rows) {
    const eventIds = eventIdsByLifeEventId.get(row.life_event_id) ?? [];
    eventIds.push(row.event_id);
    eventIdsByLifeEventId.set(row.life_event_id, eventIds);
  }
  return eventIdsByLifeEventId;
}

function getSourceRefsByLifeEventId(db) {
  const rows = db.prepare(`
    SELECT life_event_id, source_id, locator
    FROM person_life_event_source_refs
    ORDER BY life_event_id, source_id, locator
  `).all();
  const refsByLifeEventId = new Map();
  for (const row of rows) {
    const refs = refsByLifeEventId.get(row.life_event_id) ?? [];
    refs.push({
      sourceId: row.source_id,
      locator: row.locator
    });
    refsByLifeEventId.set(row.life_event_id, refs);
  }
  return refsByLifeEventId;
}

function getSourceMentionCountsByLifeEventId(db) {
  const rows = db.prepare(`
    SELECT life_event_id, COUNT(*) AS count
    FROM person_life_event_source_mentions
    GROUP BY life_event_id
  `).all();
  return new Map(rows.map((row) => [row.life_event_id, row.count]));
}

function getSourceRefsByRelationId(db) {
  const rows = db.prepare(`
    SELECT relation_id, source_id, locator
    FROM person_relation_source_refs
    ORDER BY relation_id, source_id, locator
  `).all();
  const refsByRelationId = new Map();
  for (const row of rows) {
    const refs = refsByRelationId.get(row.relation_id) ?? [];
    refs.push({
      sourceId: row.source_id,
      locator: row.locator
    });
    refsByRelationId.set(row.relation_id, refs);
  }
  return refsByRelationId;
}

function getSourceMentionCountsByPersonId(db) {
  const rows = db.prepare(`
    SELECT smp.person_id, COUNT(*) AS count
    FROM source_mention_people smp
    GROUP BY smp.person_id
  `).all();
  return new Map(rows.map((row) => [row.person_id, row.count]));
}

async function main() {
  if (!existsSync(dbPath)) {
    throw new Error("Missing db/chronoatlas.sqlite. Run npm run db:build first.");
  }

  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const persons = db.prepare(`
      SELECT id, name, courtesy_name, life, primary_polity, summary, coverage_status
      FROM persons
      WHERE region = 'china'
      ORDER BY name
    `).all();

    const personIndex = persons.map((person) => {
      const mentionStats = getPersonMentionStats(db, person.id);
      const lifeStats = getPersonLifeEventStats(db, person.id);
      return {
        id: person.id,
        name: person.name,
        courtesyName: person.courtesy_name,
        life: person.life,
        primaryPolity: person.primary_polity,
        summary: person.summary,
        coverageStatus: person.coverage_status,
        lifeEventCount: lifeStats.lifeEventCount,
        sourceMentionCount: mentionStats.sourceMentionCount,
        reviewedSourceMentionCount: mentionStats.reviewedMentionCount ?? 0,
        firstRecordedYear: lifeStats.firstYear,
        lastRecordedYear: lifeStats.lastYear,
        sourceIds: getPersonSourceIds(db, person.id),
        coverage: getPersonCoverage(db, person.id)
      };
    });

    const payload = {
      schemaVersion: 1,
      generatedFrom: "db/chronoatlas.sqlite",
      purpose: "前端人物索引和覆盖度概览；完整原文、摘录标签和引用关系保存在 SQLite 数据库中。",
      persons: personIndex
    };

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Exported ${path.relative(rootDir, outputPath)}`);

  } finally {
    db.close();
  }
}

await main();
