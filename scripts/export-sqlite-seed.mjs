import { DatabaseSync } from "node:sqlite";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const seedsDir = path.join(rootDir, "db", "seeds");
const coreOutputPath = path.join(seedsDir, "core-data.sql");
const runtimeOutputPath = path.join(seedsDir, "runtime-data.sql");

const preferredTableOrder = [
  "corpora",
  "sources",
  "source_passages",
  "persons",
  "person_roles",
  "person_aliases",
  "historical_events",
  "historical_event_people",
  "historical_event_sources",
  "source_mentions",
  "source_mention_people",
  "source_mention_events",
  "source_mention_places",
  "source_mention_tags",
  "person_life_events",
  "person_life_event_historical_events",
  "person_life_event_source_mentions",
  "person_life_event_source_refs",
  "person_relations",
  "person_relation_events",
  "person_relation_source_mentions",
  "person_relation_source_refs",
  "coverage_status",
  "coverage_status_sources",
  "coverage_status_missing",
  "import_runs",
  "china_admin_block_datasets",
  "china_admin_blocks",
  "china_control_timeline_datasets",
  "china_control_controllers",
  "china_control_records",
  "legacy_runtime_datasets",
  "app_runtime_datasets",
  "map_geometry_datasets",
  "map_features",
  "map_feature_geometries",
  "map_feature_aliases",
  "map_control_datasets",
  "map_controllers",
  "map_control_records",
  "map_control_record_sources",
  "map_feature_sources",
  "map_feature_events",
  "map_feature_entities",
  "civilizations",
  "regions",
  "periods",
  "topics",
  "entities",
  "entity_aliases",
  "entity_relations",
  "events",
  "event_entities",
  "evidence_links",
  "source_passage_entities",
  "search_documents",
];

const coreTables = new Set([
  "corpora",
  "sources",
  "source_passages",
  "persons",
  "person_roles",
  "person_aliases",
  "historical_events",
  "historical_event_people",
  "historical_event_sources",
  "source_mentions",
  "source_mention_people",
  "source_mention_events",
  "source_mention_places",
  "source_mention_tags",
  "person_life_events",
  "person_life_event_historical_events",
  "person_life_event_source_mentions",
  "person_life_event_source_refs",
  "person_relations",
  "person_relation_events",
  "person_relation_source_mentions",
  "person_relation_source_refs",
  "coverage_status",
  "coverage_status_sources",
  "coverage_status_missing",
  "import_runs",
]);

const runtimeTables = new Set([
  "china_admin_block_datasets",
  "china_admin_blocks",
  "china_control_timeline_datasets",
  "china_control_controllers",
  "china_control_records",
  "legacy_runtime_datasets",
  "app_runtime_datasets",
  "map_geometry_datasets",
  "map_features",
  "map_feature_geometries",
  "map_feature_aliases",
  "map_control_datasets",
  "map_controllers",
  "map_control_records",
  "map_control_record_sources",
  "map_feature_sources",
  "map_feature_events",
  "map_feature_entities",
  "civilizations",
  "regions",
  "periods",
  "topics",
  "entities",
  "entity_aliases",
  "entity_relations",
  "events",
  "event_entities",
  "evidence_links",
  "source_passage_entities",
  "search_documents",
]);

const baseSchemaColumns = new Map([
  ["corpora", ["id", "name", "region", "description"]],
  [
    "sources",
    [
      "id",
      "title",
      "author",
      "type",
      "citation_short",
      "url",
      "language",
      "corpus_id",
      "note",
      "raw_json",
    ],
  ],
  [
    "source_passages",
    [
      "id",
      "source_id",
      "parent_passage_id",
      "locator",
      "sequence",
      "year_start",
      "year_end",
      "text",
      "translation",
      "language",
      "notes",
      "confidence",
      "review_status",
      "raw_json",
    ],
  ],
]);

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "bigint") {
    return String(value);
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  const tableRows = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  const tableNames = tableRows.map((row) => row.name);
  const orderedTables = [
    ...preferredTableOrder.filter((tableName) => tableNames.includes(tableName)),
    ...tableNames.filter((tableName) => !preferredTableOrder.includes(tableName)),
  ];

  function buildSeedSql(tables, label, options = {}) {
    const insertVerb = options.insertOrReplace ? "INSERT OR REPLACE" : "INSERT";
    const output = [
      "-- Generated from db/chronoatlas.sqlite. Do not edit by hand.",
      "-- Rebuild with: npm run db:seed:export",
      `-- ${label}`,
      "PRAGMA foreign_keys = OFF;",
      "BEGIN;",
    ];

    for (const tableName of orderedTables.filter((name) => tables.has(name))) {
      const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
        .all()
        .map((column) => column.name);
      const rows = db.prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`).all();

      if (rows.length === 0) {
        continue;
      }

      output.push("", `-- ${tableName}`);
      const seedColumns = baseSchemaColumns.get(tableName) ?? columns;
      const columnSql = seedColumns.map(quoteIdentifier).join(", ");
      for (const row of rows) {
        const valuesSql = seedColumns.map((column) => sqlLiteral(row[column])).join(", ");
        output.push(`${insertVerb} INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES (${valuesSql});`);
      }
    }

    output.push("COMMIT;", "PRAGMA foreign_keys = ON;");
    return `${output.join("\n")}\n`;
  }

  const coreSql = buildSeedSql(coreTables, "Core base tables loaded before migrations");
  const runtimeSql = buildSeedSql(runtimeTables, "Runtime/map and AI/RAG tables loaded after migrations", {
    insertOrReplace: true,
  });

  await mkdir(seedsDir, { recursive: true });
  await writeFile(coreOutputPath, coreSql, "utf8");
  await writeFile(runtimeOutputPath, runtimeSql, "utf8");
  console.log(`Exported ${path.relative(rootDir, coreOutputPath)}`);
  console.log(`Exported ${path.relative(rootDir, runtimeOutputPath)}`);
} finally {
  db.close();
}
