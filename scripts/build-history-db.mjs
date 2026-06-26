import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkMode = process.argv.includes("--check");
const dbPath = checkMode
  ? path.join(rootDir, "db", ".chronoatlas-check.sqlite")
  : path.join(rootDir, "db", "chronoatlas.sqlite");
const seedSqlPath = path.join(rootDir, "db", "seeds", "core-data.sql");
const runtimeSeedSqlPath = path.join(rootDir, "db", "seeds", "runtime-data.sql");

async function applyMigrations(db) {
  const migrationsDir = path.join(rootDir, "db", "migrations");
  if (!existsSync(migrationsDir)) {
    return [];
  }

  const migrationFiles = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql") || fileName.endsWith(".mjs"))
    .sort((left, right) => left.localeCompare(right));

  for (const fileName of migrationFiles) {
    const migrationPath = path.join(migrationsDir, fileName);
    if (fileName.endsWith(".sql")) {
      const sql = await readFile(migrationPath, "utf8");
      db.exec(sql);
      continue;
    }

    const migration = await import(pathToFileURL(migrationPath).href);
    if (typeof migration.default !== "function") {
      throw new Error(`Migration must default-export a function: ${fileName}`);
    }
    await migration.default(db);
  }

  return migrationFiles;
}

async function refreshDocumentChunkIndex(db) {
  const migrationPath = path.join(rootDir, "db", "migrations", "007-document-chunks-fts.mjs");
  if (!existsSync(migrationPath)) {
    return;
  }

  const migration = await import(`${pathToFileURL(migrationPath).href}?refresh=${Date.now()}`);
  if (typeof migration.default !== "function") {
    throw new Error("Document chunk migration must default-export a function");
  }
  await migration.default(db);
}

function scalarCount(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function verifyDatabase(db) {
  const minimumCounts = [
    ["persons", 1],
    ["person_life_events", 1],
    ["person_relations", 1],
    ["historical_events", 1],
    ["source_mentions", 1],
    ["sources", 1],
    ["entities", 1],
    ["events", 1],
    ["evidence_links", 1],
    ["app_runtime_datasets", 1],
    ["document_chunks", 1],
  ];

  for (const [tableName, expected] of minimumCounts) {
    const actual = scalarCount(db, tableName);
    if (actual < expected) {
      throw new Error(`Expected ${tableName} to contain at least ${expected} rows, got ${actual}`);
    }
  }

  const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
  if (foreignKeyFailures.length > 0) {
    throw new Error(`Foreign key check failed: ${JSON.stringify(foreignKeyFailures)}`);
  }
}

async function main() {
  if (!existsSync(seedSqlPath)) {
    throw new Error("Missing db/seeds/core-data.sql. Run `npm run db:seed:export` first.");
  }
  if (!existsSync(runtimeSeedSqlPath)) {
    throw new Error("Missing db/seeds/runtime-data.sql. Run `npm run db:seed:export` first.");
  }

  await mkdir(path.dirname(dbPath), { recursive: true });
  if (existsSync(dbPath)) {
    await rm(dbPath, { force: true });
  }

  const db = new DatabaseSync(dbPath);
  const schemaSql = await readFile(path.join(rootDir, "db", "schema.sql"), "utf8");
  const seedSql = await readFile(seedSqlPath, "utf8");
  const runtimeSeedSql = await readFile(runtimeSeedSqlPath, "utf8");
  let seededCounts = null;

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(schemaSql);
    db.exec(seedSql);
    await applyMigrations(db);
    db.exec(runtimeSeedSql);
    await refreshDocumentChunkIndex(db);
    verifyDatabase(db);
    seededCounts = {
      persons: scalarCount(db, "persons"),
      lifeEvents: scalarCount(db, "person_life_events"),
      sourceMentions: scalarCount(db, "source_mentions"),
    };
  } finally {
    db.close();
  }

  if (checkMode) {
    await rm(dbPath, { force: true });
    console.log("History database schema check passed");
  } else {
    console.log(`Built history database: ${path.relative(rootDir, dbPath)}`);
    console.log(
      `Seeded ${seededCounts.persons} persons, ${seededCounts.lifeEvents} life events, ${seededCounts.sourceMentions} source mentions`
    );
  }
}

await main();
