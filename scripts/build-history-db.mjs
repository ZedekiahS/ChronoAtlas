import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
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
const redCliffsSourcePoolPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-source-pool-v1.json");

async function loadRequiredRedCliffsSourcePool() {
  const bytes = await readFile(redCliffsSourcePoolPath);
  const pack = JSON.parse(bytes.toString("utf8"));
  if (pack.format !== "chronoatlas-evidence-pack/1" || !Array.isArray(pack.documents) || pack.documents.length === 0) {
    throw new Error("Invalid Red Cliffs source-pool manifest");
  }
  const sourceFamilies = pack.documents.map((document) => document.sourceFamily);
  if (new Set(sourceFamilies).size !== sourceFamilies.length) {
    throw new Error("Red Cliffs source-pool manifest contains duplicate source families");
  }
  return {
    packKey: pack.packId,
    packVersion: pack.packVersion,
    manifestSha256: createHash("sha256").update(bytes).digest("hex"),
    sourceFamilies,
    requiredSourceFamilies: pack.documents.filter((document) => document.required).map((document) => document.sourceFamily),
  };
}

function logStep(message) {
  console.log(`[db:build] ${message}`);
}

async function timed(label, task) {
  const startedAt = Date.now();
  logStep(`${label}...`);
  const result = await task();
  logStep(`${label} done (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`);
  return result;
}

async function readSeedSqlBundle(seedPath) {
  const seedDir = path.dirname(seedPath);
  const baseName = path.basename(seedPath, ".sql");
  const entries = await readdir(seedDir, { withFileTypes: true });
  const partPaths = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith(`${baseName}.part-`) && entry.name.endsWith(".sql"))
    .map((entry) => path.join(seedDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
  return [seedPath, ...partPaths];
}

async function applyMigrations(db) {
  const migrationsDir = path.join(rootDir, "db", "migrations");
  if (!existsSync(migrationsDir)) {
    return [];
  }

  const migrationFiles = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql") || fileName.endsWith(".mjs"))
    .sort((left, right) => left.localeCompare(right));

  const postSeedMigrations = [];
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
    await migration.default(db, {
      checkMode,
      rebuildDocumentChunks: false,
      rebuildFts: !checkMode,
      log: (message) => logStep(`${fileName}: ${message}`),
    });
    if (migration.runAfterRuntimeSeeds === true) {
      postSeedMigrations.push({ fileName, migrate: migration.default });
    }
  }

  return postSeedMigrations;
}

async function applyPostSeedMigrations(db, migrations) {
  for (const { fileName, migrate } of migrations) {
    await migrate(db, {
      checkMode,
      rebuildDocumentChunks: false,
      rebuildFts: false,
      postRuntimeSeeds: true,
      log: (message) => logStep(`${fileName} (post-seed): ${message}`),
    });
  }
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
  await migration.default(db, {
    checkMode,
    rebuildDocumentChunks: true,
    rebuildFts: !checkMode,
    log: (message) => logStep(`document chunks: ${message}`),
  });
}

function scalarCount(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function verifyRequiredChinaMapData(db) {
  const requiredDatasets = [
    {
      geometryId: "china-admin-block-map-190-280",
      controlId: "china-block-control-timeline-190-280",
    },
    {
      geometryId: "china-admin-block-map-280-317",
      controlId: "china-block-control-timeline-280-317",
    },
  ];
  const geometryDatasetExists = db.prepare("SELECT 1 FROM map_geometry_datasets WHERE id = ?");
  const geometryFeatureCount = db.prepare("SELECT COUNT(*) AS count FROM map_features WHERE dataset_id = ?");
  const geometryRecordCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM map_feature_geometries g
    JOIN map_features f ON f.id = g.feature_id
    WHERE f.dataset_id = ?
  `);
  const controlDatasetExists = db.prepare("SELECT 1 FROM map_control_datasets WHERE id = ?");
  const controllerCount = db.prepare("SELECT COUNT(*) AS count FROM map_controllers WHERE control_dataset_id = ?");
  const controlRecordCount = db.prepare("SELECT COUNT(*) AS count FROM map_control_records WHERE control_dataset_id = ?");

  for (const { geometryId, controlId } of requiredDatasets) {
    if (!geometryDatasetExists.get(geometryId)) {
      throw new Error(`Missing required map geometry dataset: ${geometryId}`);
    }
    if (geometryFeatureCount.get(geometryId).count < 1 || geometryRecordCount.get(geometryId).count < 1) {
      throw new Error(`Required map geometry dataset is empty: ${geometryId}`);
    }
    if (!controlDatasetExists.get(controlId)) {
      throw new Error(`Missing required map control dataset: ${controlId}`);
    }
    if (controllerCount.get(controlId).count < 1 || controlRecordCount.get(controlId).count < 1) {
      throw new Error(`Required map control dataset is empty: ${controlId}`);
    }
  }
}

function isPortableRepositoryStorageUri(value) {
  if (typeof value !== "string" || !value.startsWith("repo:data/evidence-pool/")) {
    return false;
  }
  const repositoryPath = value.slice("repo:".length);
  return !repositoryPath.includes("\\")
    && !path.posix.isAbsolute(repositoryPath)
    && path.posix.normalize(repositoryPath) === repositoryPath
    && !repositoryPath.split("/").includes("..");
}

function verifyRequiredRedCliffsEvidencePool(db, expected) {
  const requiredTables = [
    "source_witnesses",
    "source_assets",
    "evidence_packs",
    "evidence_pack_revisions",
    "evidence_pack_documents",
    "evidence_pack_active_revisions",
  ];
  const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
  const missingTables = requiredTables.filter((tableName) => !tableExists.get(tableName));
  if (missingTables.length > 0) {
    throw new Error(`Missing required Red Cliffs evidence-pool tables: ${missingTables.join(", ")}`);
  }

  const sourcePool = db.prepare(`
    SELECT
      revision.id,
      revision.pack_version,
      revision.manifest_sha256,
      COUNT(document.id) AS document_count,
      SUM(document.is_required) AS required_count
    FROM evidence_packs pack
    JOIN evidence_pack_active_revisions active ON active.pack_id = pack.id
    JOIN evidence_pack_revisions revision ON revision.id = active.revision_id
    LEFT JOIN evidence_pack_documents document ON document.revision_id = revision.id
    WHERE pack.pack_key = ?
    GROUP BY revision.id
  `).get(expected.packKey);
  if (!sourcePool
      || sourcePool.pack_version !== expected.packVersion
      || sourcePool.manifest_sha256 !== expected.manifestSha256
      || sourcePool.document_count !== expected.sourceFamilies.length
      || sourcePool.required_count !== expected.requiredSourceFamilies.length) {
    throw new Error(`Red Cliffs source-pool registry does not match ${expected.packKey}@${expected.packVersion}`);
  }

  const registeredDocuments = db.prepare(`
    SELECT document.witness_id, document.source_family, document.is_required
    FROM evidence_packs pack
    JOIN evidence_pack_active_revisions active ON active.pack_id = pack.id
    JOIN evidence_pack_documents document ON document.revision_id = active.revision_id
    WHERE pack.pack_key = ?
    ORDER BY document.ordinal
  `).all(expected.packKey);
  const registeredFamilies = new Set(registeredDocuments.map((document) => document.source_family));
  const missingFamilies = expected.sourceFamilies.filter((sourceFamily) => !registeredFamilies.has(sourceFamily));
  if (missingFamilies.length > 0) {
    throw new Error(`Missing required Red Cliffs source families: ${missingFamilies.join(", ")}`);
  }

  const requiredRedCliffsWitnessIds = registeredDocuments.map((document) => document.witness_id);
  const placeholders = requiredRedCliffsWitnessIds.map(() => "?").join(", ");

  const assetsByWitnessId = new Map(requiredRedCliffsWitnessIds.map((witnessId) => [witnessId, []]));
  const assetRows = db.prepare(`
    SELECT id, witness_id, storage_uri
    FROM source_assets
    WHERE witness_id IN (${placeholders})
    ORDER BY witness_id, id
  `).all(...requiredRedCliffsWitnessIds);
  for (const row of assetRows) {
    assetsByWitnessId.get(row.witness_id)?.push(row);
  }

  const witnessesWithoutAssets = requiredRedCliffsWitnessIds.filter(
    (witnessId) => assetsByWitnessId.get(witnessId).length === 0,
  );
  if (witnessesWithoutAssets.length > 0) {
    throw new Error(`Required Red Cliffs witnesses have no seeded assets: ${witnessesWithoutAssets.join(", ")}`);
  }

  const nonPortableAssets = assetRows.filter((row) => !isPortableRepositoryStorageUri(row.storage_uri));
  if (nonPortableAssets.length > 0) {
    throw new Error(`Red Cliffs source assets contain non-portable storage URIs: ${JSON.stringify(nonPortableAssets)}`);
  }

}

function verifyDatabase(db, requiredRedCliffsSourcePool) {
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

  verifyRequiredChinaMapData(db);
  verifyRequiredRedCliffsEvidencePool(db, requiredRedCliffsSourcePool);

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

  const requiredRedCliffsSourcePool = await loadRequiredRedCliffsSourcePool();
  await mkdir(path.dirname(dbPath), { recursive: true });
  if (existsSync(dbPath)) {
    await rm(dbPath, { force: true });
  }

  const db = new DatabaseSync(dbPath);
  const schemaSql = await readFile(path.join(rootDir, "db", "schema.sql"), "utf8");
  const seedSqlPaths = await readSeedSqlBundle(seedSqlPath);
  const runtimeSeedSqlPaths = await readSeedSqlBundle(runtimeSeedSqlPath);
  let seededCounts = null;

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    if (checkMode) {
      db.exec("PRAGMA journal_mode = MEMORY;");
      db.exec("PRAGMA synchronous = OFF;");
      db.exec("PRAGMA temp_store = MEMORY;");
    }
    await timed("apply base schema", async () => db.exec(schemaSql));
    await timed(`apply core seeds (${seedSqlPaths.length} files)`, async () => {
      for (const seedSqlPath of seedSqlPaths) {
        db.exec(await readFile(seedSqlPath, "utf8"));
      }
    });
    const postSeedMigrations = await timed("apply migrations", async () => applyMigrations(db));
    await timed(`apply runtime seeds (${runtimeSeedSqlPaths.length} files)`, async () => {
      for (const runtimeSeedSqlPath of runtimeSeedSqlPaths) {
        db.exec(await readFile(runtimeSeedSqlPath, "utf8"));
      }
    });
    await timed("reapply post-seed migrations", async () => applyPostSeedMigrations(db, postSeedMigrations));
    await timed(checkMode ? "refresh document chunks (FTS skipped in check mode)" : "refresh document chunks and FTS", async () =>
      refreshDocumentChunkIndex(db),
    );
    await timed("verify database", async () => verifyDatabase(db, requiredRedCliffsSourcePool));
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
