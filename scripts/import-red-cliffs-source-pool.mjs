import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import migrateEvidencePool from "../db/migrations/031-evidence-pool-core.mjs";
import migrateAssertionClaimReview from "../db/migrations/032-assertion-claim-review-core.mjs";
import migrateEvidenceProposals from "../db/migrations/033-evidence-proposals-and-event-release.mjs";
import migrateEvidencePackRegistry from "../db/migrations/034-evidence-pack-registry.mjs";
import {
  evidencePackPlan,
  ingestEvidencePack,
  prepareEvidencePack,
  registerEvidencePack,
} from "./lib/evidence-pack.mjs";
import { evidencePoolCounts } from "./lib/evidence-pool-pilot.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const primaryDbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const defaultPackPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-source-pool-v1.json");

function argumentValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

function tableExists(db, tableName) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName));
}

function rowCount(db, tableName) {
  return tableExists(db, tableName)
    ? db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count
    : null;
}

function protectedCounts(db) {
  return Object.fromEntries([
    "events",
    "assertion_candidates",
    "source_assertions",
    "claim_candidates",
    "claims",
    "event_collection_candidates",
    "event_candidates_v2",
    "event_records_v2",
    "content_releases_v2",
  ].map((table) => [table, rowCount(db, table)]));
}

function assertCountsUnchanged(before, after) {
  for (const table of Object.keys(before)) {
    if (before[table] !== after[table]) {
      throw new Error(`Raw source-pool import changed protected table ${table}: ${before[table]} -> ${after[table]}`);
    }
  }
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dbArgument = argumentValue("--db");
  const packPath = path.resolve(argumentValue("--pack", defaultPackPath));
  const preparedPack = await prepareEvidencePack(packPath);

  if (!apply) {
    console.log(JSON.stringify({
      ...evidencePackPlan(preparedPack),
      writesDatabase: false,
      writesAssertionsClaimsOrEvents: false,
      action: "Use --apply --standalone --db=<shadow path>, or --apply --allow-primary-db --db=db/chronoatlas.sqlite after shadow validation.",
    }, null, 2));
    return;
  }

  if (!dbArgument) throw new Error("--apply requires an explicit --db path");
  const dbPath = path.resolve(dbArgument);
  const isPrimary = samePath(dbPath, primaryDbPath);
  if (isPrimary && !process.argv.includes("--allow-primary-db")) {
    throw new Error("Writing db/chronoatlas.sqlite requires --allow-primary-db");
  }
  if (!isPrimary && !process.argv.includes("--standalone")) {
    throw new Error("A non-primary target requires --standalone acknowledgement");
  }

  await mkdir(path.dirname(dbPath), { recursive: true });
  const existedBefore = existsSync(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    if (!tableExists(db, "entities")) {
      if (existedBefore) {
        throw new Error("Existing target lacks an entities table; choose a new shadow database path or a valid ChronoAtlas database");
      }
      db.exec("CREATE TABLE entities (id TEXT PRIMARY KEY)");
    }

    migrateEvidencePool(db);
    migrateAssertionClaimReview(db);
    migrateEvidenceProposals(db);
    migrateEvidencePackRegistry(db);

    const before = {
      evidencePool: evidencePoolCounts(db),
      protected: protectedCounts(db),
    };
    const result = ingestEvidencePack(db, preparedPack);
    const registryResult = registerEvidencePack(db, preparedPack);
    const after = {
      evidencePool: evidencePoolCounts(db),
      protected: protectedCounts(db),
    };
    assertCountsUnchanged(before.protected, after.protected);

    const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyFailures.length > 0) {
      throw new Error(`Foreign-key check failed: ${JSON.stringify(foreignKeyFailures)}`);
    }

    console.log(JSON.stringify({
      mode: "apply",
      database: dbPath,
      createdNewDatabase: !existedBefore,
      packId: preparedPack.pack.packId,
      sourceFamilyDocuments: preparedPack.documents.length,
      result,
      registryResult,
      counts: { before, after },
      protectedTablesUnchanged: true,
      foreignKeyFailures,
    }, null, 2));
  } finally {
    db.close();
  }
}

await main();
