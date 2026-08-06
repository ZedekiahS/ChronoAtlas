import { DatabaseSync } from "node:sqlite";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSeedStatements } from "./lib/sqlite-seed-export.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const seedsDir = path.join(rootDir, "db", "seeds");
const coreOutputPath = path.join(seedsDir, "core-data.sql");
const runtimeOutputPath = path.join(seedsDir, "runtime-data.sql");
const maxSeedPartBytes = 45 * 1024 * 1024;

const preferredTableOrder = [
  "corpora",
  "sources",
  "source_i18n",
  "source_passages",
  "source_passage_i18n",
  "persons",
  "person_i18n",
  "person_roles",
  "person_aliases",
  "historical_events",
  "historical_event_i18n",
  "historical_event_people",
  "historical_event_sources",
  "source_mentions",
  "source_mention_i18n",
  "source_mention_people",
  "source_mention_events",
  "source_mention_places",
  "source_mention_tags",
  "person_life_events",
  "person_life_event_i18n",
  "person_life_event_historical_events",
  "person_life_event_source_mentions",
  "person_life_event_source_refs",
  "person_relations",
  "person_relation_i18n",
  "person_relation_events",
  "person_relation_source_mentions",
  "person_relation_source_refs",
  "coverage_status",
  "coverage_status_sources",
  "coverage_status_missing",
  "import_runs",
  "import_batches",
  "import_draft_files",
  "import_evidence_cards",
  "import_event_clusters",
  "import_event_cluster_members",
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
  "chronology_eras",
  "chronology_era_aliases",
  "entities",
  "entity_i18n",
  "entity_aliases",
  "entity_relations",
  "events",
  "event_i18n",
  "event_entities",
  "evidence_links",
  "event_import_cards",
  "import_event_cluster_events",
  "evidence_claims",
  "evidence_claim_sources",
  "evidence_claim_subjects",
  "evidence_claim_relations",
  "ai_retrieval_runs",
  "ai_retrieval_items",
  "rag_eval_questions",
  "rag_eval_runs",
  "rag_eval_results",
  "source_passage_entities",
  "search_documents",
];

const coreTables = new Set([
  "corpora",
  "sources",
  "source_i18n",
  "source_passages",
  "source_passage_i18n",
  "persons",
  "person_i18n",
  "person_roles",
  "person_aliases",
  "historical_events",
  "historical_event_i18n",
  "historical_event_people",
  "historical_event_sources",
  "source_mentions",
  "source_mention_i18n",
  "source_mention_people",
  "source_mention_events",
  "source_mention_places",
  "source_mention_tags",
  "person_life_events",
  "person_life_event_i18n",
  "person_life_event_historical_events",
  "person_life_event_source_mentions",
  "person_life_event_source_refs",
  "person_relations",
  "person_relation_i18n",
  "person_relation_events",
  "person_relation_source_mentions",
  "person_relation_source_refs",
  "coverage_status",
  "coverage_status_sources",
  "coverage_status_missing",
  "import_runs",
]);

const runtimeTables = new Set([
  "import_batches",
  "import_draft_files",
  "import_evidence_cards",
  "import_event_clusters",
  "import_event_cluster_members",
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
  "chronology_eras",
  "chronology_era_aliases",
  "entities",
  "entity_i18n",
  "entity_aliases",
  "entity_relations",
  "events",
  "event_i18n",
  "event_entities",
  "evidence_links",
  "event_import_cards",
  "import_event_cluster_events",
  "evidence_claims",
  "evidence_claim_sources",
  "evidence_claim_subjects",
  "evidence_claim_relations",
  "ai_retrieval_runs",
  "ai_retrieval_items",
  "rag_eval_questions",
  "rag_eval_runs",
  "rag_eval_results",
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

async function removeSeedParts(outputPath) {
  const baseName = path.basename(outputPath, ".sql");
  const entries = await readdir(path.dirname(outputPath), { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(`${baseName}.part-`) && entry.name.endsWith(".sql"))
      .map((entry) => rm(path.join(path.dirname(outputPath), entry.name), { force: true }))
  );
}

async function writeSeedStatements(outputPath, statements) {
  await removeSeedParts(outputPath);
  const byteLength = statements.reduce((total, statement) => total + Buffer.byteLength(`${statement}\n`, "utf8"), 0);
  if (byteLength <= maxSeedPartBytes) {
    await writeFile(outputPath, `${statements.join("\n")}\n`, "utf8");
    return [outputPath];
  }

  const baseName = path.basename(outputPath, ".sql");
  const parts = [];
  let currentStatements = [];
  let currentBytes = 0;

  for (const statement of statements) {
    const statementWithBreak = `${statement}\n`;
    const statementBytes = Buffer.byteLength(statementWithBreak, "utf8");
    if (currentStatements.length > 0 && currentBytes + statementBytes > maxSeedPartBytes) {
      const partPath = path.join(path.dirname(outputPath), `${baseName}.part-${String(parts.length + 1).padStart(3, "0")}.sql`);
      await writeFile(partPath, currentStatements.join(""), "utf8");
      parts.push(partPath);
      currentStatements = [];
      currentBytes = 0;
    }
    currentStatements.push(statementWithBreak);
    currentBytes += statementBytes;
  }

  if (currentStatements.length > 0) {
    const partPath = path.join(path.dirname(outputPath), `${baseName}.part-${String(parts.length + 1).padStart(3, "0")}.sql`);
    await writeFile(partPath, currentStatements.join(""), "utf8");
    parts.push(partPath);
  }

  const manifest = [
    "-- Generated from db/chronoatlas.sqlite. Do not edit by hand.",
    "-- Rebuild with: npm run db:seed:export",
    `-- Split seed manifest for ${baseName}.`,
    ...parts.map((partPath) => `-- part: ${path.basename(partPath)}`),
    "",
  ].join("\n");
  await writeFile(outputPath, manifest, "utf8");
  return [outputPath, ...parts];
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

  const coreStatements = buildSeedStatements(db, {
    orderedTables,
    tables: coreTables,
    label: "Core base tables loaded before migrations",
    baseSchemaColumns,
  });
  const runtimeStatements = buildSeedStatements(db, {
    orderedTables,
    tables: runtimeTables,
    label: "Runtime/map and AI/RAG tables loaded after migrations",
    insertOrReplace: true,
    baseSchemaColumns,
  });

  await mkdir(seedsDir, { recursive: true });
  const corePaths = await writeSeedStatements(coreOutputPath, coreStatements);
  const runtimePaths = await writeSeedStatements(runtimeOutputPath, runtimeStatements);
  for (const outputPath of [...corePaths, ...runtimePaths]) {
    console.log(`Exported ${path.relative(rootDir, outputPath)}`);
  }
} finally {
  db.close();
}
