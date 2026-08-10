import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  annotatedAssetPlan,
  evidencePoolCounts,
  ingestAnnotatedAsset,
  inspectAnnotatedAssetPlan,
  prepareAnnotatedAsset,
} from "./lib/evidence-pool-pilot.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultAssetPath = path.join(rootDir, "data", "evidence-pool", "sanguozhi-wuyingdian-v54-pilot.json");
const primaryDbPath = path.join(rootDir, "db", "chronoatlas.sqlite");

function argumentValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const explicitPlan = process.argv.includes("--plan");
  if (apply && explicitPlan) throw new Error("Choose exactly one of --plan or --apply");

  const assetPath = path.resolve(argumentValue("--asset", defaultAssetPath));
  const dbArgument = argumentValue("--db");
  const prepared = await prepareAnnotatedAsset(assetPath);

  if (!apply && !dbArgument) {
    console.log(JSON.stringify({
      ...annotatedAssetPlan(prepared),
      databaseInspection: "skipped; pass --db to compare against a migrated shadow database",
    }, null, 2));
    return;
  }

  if (apply && !dbArgument) {
    throw new Error("--apply requires an explicit --db path; the primary database is never an implicit target");
  }

  const dbPath = path.resolve(dbArgument ?? primaryDbPath);
  if (apply && dbPath === primaryDbPath && !process.argv.includes("--allow-primary-db")) {
    throw new Error("Refusing to apply the pilot to db/chronoatlas.sqlite without --allow-primary-db");
  }

  const db = new DatabaseSync(dbPath, { readOnly: !apply });
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    if (!apply) db.exec("PRAGMA query_only = ON;");
    if (!apply) {
      console.log(JSON.stringify(inspectAnnotatedAssetPlan(db, prepared), null, 2));
      return;
    }

    const before = evidencePoolCounts(db);
    const result = ingestAnnotatedAsset(db, prepared);
    const after = evidencePoolCounts(db);
    const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyFailures.length > 0) {
      throw new Error(`Foreign-key check failed: ${JSON.stringify(foreignKeyFailures)}`);
    }
    console.log(JSON.stringify({ result, counts: { before, after }, foreignKeyFailures }, null, 2));
  } finally {
    db.close();
  }
}

await main();
