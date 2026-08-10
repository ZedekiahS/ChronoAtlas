import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argumentValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function tableExists(db, tableName) {
  return Boolean(
    db.prepare("SELECT 1 FROM sqlite_master WHERE type IN ('table', 'view') AND name = ? LIMIT 1").get(tableName),
  );
}

function countRows(db, tableName) {
  if (!tableExists(db, tableName)) return null;
  return db.prepare(`SELECT COUNT(*) AS count FROM "${tableName}"`).get().count;
}

function rows(db, sql, ...parameters) {
  return db.prepare(sql).all(...parameters);
}

async function auditMutationEntrypoints() {
  const scriptsDir = path.join(rootDir, "scripts");
  const names = (await readdir(scriptsDir))
    .filter((name) => /^(import|promote)-.*\.mjs$/u.test(name))
    .sort((left, right) => left.localeCompare(right));
  const entries = [];

  for (const name of names) {
    const text = await readFile(path.join(scriptsDir, name), "utf8");
    entries.push({
      script: `scripts/${name}`,
      hasExplicitApplyFlag: text.includes("--apply"),
      hasExplicitPlanFlag: text.includes("--plan"),
      opensPrimaryDatabase: text.includes("chronoatlas.sqlite"),
    });
  }

  return {
    inspected: entries.length,
    explicitPlanApply: entries.filter((entry) => entry.hasExplicitApplyFlag && entry.hasExplicitPlanFlag).length,
    missingExplicitApply: entries.filter((entry) => !entry.hasExplicitApplyFlag).map((entry) => entry.script),
    entries,
  };
}

function sourceCoverage(db) {
  if (!tableExists(db, "sources") || !tableExists(db, "source_passages")) return [];
  return rows(
    db,
    `
      SELECT
        CASE
          WHEN s.id LIKE 'sanguozhi-guoxue123-%' THEN '三国志'
          WHEN s.id LIKE 'hanshu-guoxue123-%' THEN '汉书'
          WHEN s.id LIKE 'houhanshu-guoxue123-%' THEN '后汉书'
          WHEN s.id LIKE 'jinshu-guoxue123-%' THEN '晋书'
          WHEN s.id LIKE 'zizhi-tongjian-guoxue123-%' THEN '资治通鉴'
          ELSE '其他'
        END AS work,
        COUNT(DISTINCT s.id) AS sourceRows,
        COUNT(sp.id) AS passageRows,
        SUM(LENGTH(COALESCE(sp.text, ''))) AS characterCount
      FROM sources s
      LEFT JOIN source_passages sp ON sp.source_id = s.id
      GROUP BY work
      ORDER BY sourceRows DESC
    `,
  );
}

function eventOriginMix(db) {
  if (!tableExists(db, "events")) return null;
  return db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN id LIKE 'life:%' THEN 1 ELSE 0 END) AS lifeEvents,
      SUM(CASE
        WHEN json_valid(raw_json)
         AND json_extract(raw_json, '$.generatedFrom') = 'source-event-promotion-v2'
        THEN 1 ELSE 0 END) AS machinePromoted,
      SUM(CASE
        WHEN id NOT LIKE 'life:%'
         AND COALESCE(
           CASE WHEN json_valid(raw_json) THEN json_extract(raw_json, '$.generatedFrom') END,
           ''
         ) <> 'source-event-promotion-v2'
        THEN 1 ELSE 0 END) AS other
    FROM events
  `).get();
}

function legacyFrontendExposure(db) {
  if (!tableExists(db, "events")) return null;
  return db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN review_status = 'draft' THEN 1 ELSE 0 END) AS draft,
      SUM(CASE WHEN review_status = 'needs-review' THEN 1 ELSE 0 END) AS needsReview,
      SUM(CASE WHEN review_status IN ('reviewed', 'approved') THEN 1 ELSE 0 END) AS reviewedOrApproved,
      SUM(CASE
        WHEN json_valid(raw_json)
         AND json_extract(raw_json, '$.generatedFrom') = 'source-event-promotion-v2'
        THEN 1 ELSE 0 END) AS machinePromoted
    FROM events
    WHERE id NOT LIKE 'life:%'
  `).get();
}

function reviewStatusCounts(db, tableName) {
  if (!tableExists(db, tableName)) return [];
  const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
  if (!columns.some((column) => column.name === "review_status")) return [];
  return rows(
    db,
    `SELECT review_status AS status, COUNT(*) AS count FROM "${tableName}" GROUP BY review_status ORDER BY count DESC`,
  );
}

function legacyEventInventory(db) {
  if (!tableExists(db, "historical_events") || !tableExists(db, "historical_event_event_links")) return null;
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS mappings,
      COUNT(DISTINCT link.historical_event_id) AS historicalEvents,
      COUNT(DISTINCT link.event_id) AS eventRows,
      SUM(CASE WHEN event.review_status = 'draft' THEN 1 ELSE 0 END) AS draft,
      SUM(CASE WHEN event.review_status = 'needs-review' THEN 1 ELSE 0 END) AS needsReview,
      SUM(CASE WHEN event.review_status IN ('reviewed', 'approved') THEN 1 ELSE 0 END) AS reviewedOrApproved,
      SUM(CASE WHEN event.id LIKE 'life:%' THEN 1 ELSE 0 END) AS mapsToLife,
      SUM(CASE
        WHEN json_valid(event.raw_json)
         AND json_extract(event.raw_json, '$.generatedFrom') = 'source-event-promotion-v2'
        THEN 1 ELSE 0 END) AS mapsToMachinePromoted
    FROM historical_event_event_links link
    JOIN events event ON event.id = link.event_id
  `).get();
  const evidence = db.prepare(`
    SELECT
      COUNT(*) AS historicalEvents,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM historical_event_sources source
        WHERE source.event_id = historical_event.id
      ) THEN 1 ELSE 0 END) AS withLegacySources,
      SUM(CASE WHEN EXISTS (
        SELECT 1
        FROM historical_event_event_links link
        JOIN evidence_links evidence
          ON evidence.subject_table = 'events'
         AND evidence.subject_id = link.event_id
        WHERE link.historical_event_id = historical_event.id
      ) THEN 1 ELSE 0 END) AS withEvidenceLinks
    FROM historical_events historical_event
  `).get();
  const redCliffs = rows(
    db,
    `
      SELECT historical_event.id, historical_event.title,
             historical_event.start_year AS startYear,
             historical_event.end_year AS endYear,
             event.review_status AS reviewStatus
      FROM historical_events historical_event
      LEFT JOIN historical_event_event_links link ON link.historical_event_id = historical_event.id
      LEFT JOIN events event ON event.id = link.event_id
      WHERE historical_event.start_year BETWEEN 207 AND 210
         OR historical_event.title LIKE '%赤壁%'
         OR historical_event.title LIKE '%长坂%'
      ORDER BY historical_event.start_year, historical_event.id
    `,
  );
  return { summary, evidence, redCliffs };
}

function renderMarkdown(report) {
  const lines = [
    "# ChronoAtlas Phase 0 只读基线",
    "",
    `- 审计时间：${report.auditedAt}`,
    `- 数据库：\`${report.database.relativePath}\``,
    `- SHA-256：\`${report.database.sha256Before}\``,
    `- 字节数：${report.database.byteLength}`,
    `- 查询前后 hash 一致：${report.database.unchanged ? "是" : "否"}`,
    `- 外键错误：${report.integrity.foreignKeyFailures.length}`,
    "",
    "## 核心计数",
    "",
    "| 表 | 行数 |",
    "|---|---:|",
    ...Object.entries(report.tableCounts).map(([table, count]) => `| ${table} | ${count ?? "不存在"} |`),
    "",
    "## 事件来源构成",
    "",
    `- events 总数：${report.events.originMix?.total ?? "—"}`,
    `- 人物生平派生：${report.events.originMix?.lifeEvents ?? "—"}`,
    `- source-event-promotion-v2：${report.events.originMix?.machinePromoted ?? "—"}`,
    `- 其他：${report.events.originMix?.other ?? "—"}`,
    `- legacy frontend-events 当前可选行：${report.events.legacyFrontendExposure?.total ?? "—"}`,
    `- 其中 needs-review：${report.events.legacyFrontendExposure?.needsReview ?? "—"}`,
    "",
    "## 旧核心事件待审清单",
    "",
    `- 一对一映射：${report.legacyEvents?.summary?.mappings ?? "—"}`,
    `- draft：${report.legacyEvents?.summary?.draft ?? "—"}`,
    `- reviewed/approved：${report.legacyEvents?.summary?.reviewedOrApproved ?? "—"}`,
    `- 带旧来源：${report.legacyEvents?.evidence?.withLegacySources ?? "—"}`,
    `- 带 evidence_links：${report.legacyEvents?.evidence?.withEvidenceLinks ?? "—"}`,
    "",
    "## 写入入口风险",
    "",
    `- 检查 import/promote 脚本：${report.mutationEntrypoints.inspected}`,
    `- 同时显式支持 --plan/--apply：${report.mutationEntrypoints.explicitPlanApply}`,
    `- 缺少显式 --apply：${report.mutationEntrypoints.missingExplicitApply.length}`,
    "",
    "> 结论：现有 legacy 写入入口尚未全部完成 plan/apply 隔离；新 evidence-pool v2 命令必须默认 plan，且不得接入公开事件 API。",
  ];
  return `${lines.join("\n")}\n`;
}

export async function buildBaselineReport({ dbPath }) {
  const absoluteDbPath = path.resolve(dbPath);
  const before = await stat(absoluteDbPath);
  const sha256Before = await sha256File(absoluteDbPath);
  const db = new DatabaseSync(absoluteDbPath, { readOnly: true });
  db.exec("PRAGMA query_only = ON;");

  let report;
  try {
    const trackedTables = [
      "sources",
      "source_passages",
      "source_mentions",
      "import_evidence_cards",
      "import_event_clusters",
      "events",
      "historical_events",
      "historical_event_event_links",
      "evidence_links",
      "evidence_claims",
      "observations",
      "search_documents",
      "document_chunks",
    ];
    report = {
      auditedAt: new Date().toISOString(),
      database: {
        relativePath: path.relative(rootDir, absoluteDbPath).replaceAll("\\", "/"),
        byteLength: before.size,
        modifiedAt: before.mtime.toISOString(),
        sha256Before,
      },
      intendedGrain: {
        sources: "legacy source/page rows",
        sourcePassages: "legacy cleaned text chunks",
        sourceMentions: "candidate or reviewed source statements",
        events: "mixed legacy, life-derived, and machine-promoted event rows",
        historicalEvents: "legacy core event inventory",
      },
      tableCounts: Object.fromEntries(trackedTables.map((table) => [table, countRows(db, table)])),
      integrity: {
        foreignKeyFailures: db.prepare("PRAGMA foreign_key_check").all(),
      },
      sourceCoverage: sourceCoverage(db),
      events: {
        originMix: eventOriginMix(db),
        legacyFrontendExposure: legacyFrontendExposure(db),
        reviewStatus: reviewStatusCounts(db, "events"),
        sourceMentionReviewStatus: reviewStatusCounts(db, "source_mentions"),
      },
      legacyEvents: legacyEventInventory(db),
      releaseBoundary: {
        v2ReleaseTablesPresent: tableExists(db, "content_releases") && tableExists(db, "release_items"),
        v2PublicEventApiExpected: false,
        note: "Phase 0/1 does not expose v2 events; machine candidates remain outside any v2 release projection.",
      },
    };
  } finally {
    db.close();
  }

  report.mutationEntrypoints = await auditMutationEntrypoints();
  const after = await stat(absoluteDbPath);
  const sha256After = await sha256File(absoluteDbPath);
  report.database.sha256After = sha256After;
  report.database.byteLengthAfter = after.size;
  report.database.unchanged = sha256Before === sha256After && before.size === after.size;
  if (!report.database.unchanged) throw new Error("Read-only baseline audit changed the database file");
  return report;
}

async function main() {
  const dbPath = argumentValue("--db", path.join(rootDir, "db", "chronoatlas.sqlite"));
  const report = await buildBaselineReport({ dbPath });
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderMarkdown(report));
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
