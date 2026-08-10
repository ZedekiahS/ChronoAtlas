import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  assertionCandidatePlan,
  assertionWorkflowCounts,
  extractAssertionCandidates,
  prepareAssertionCandidateSet,
} from "./lib/evidence-assertion-workflow.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const primaryDbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const defaultCandidatesPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-assertion-candidates-v1.json");

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
  if (apply === explicitPlan) throw new Error("Choose exactly one of --plan or --apply");
  const dbArgument = argumentValue("--db");
  if (!dbArgument) throw new Error("Candidate extraction requires an explicit migrated shadow --db path");
  const dbPath = path.resolve(dbArgument);
  if (apply && dbPath === primaryDbPath && !process.argv.includes("--allow-primary-db")) {
    throw new Error("Refusing to apply assertion candidates to db/chronoatlas.sqlite without --allow-primary-db");
  }
  const candidatesPath = path.resolve(argumentValue("--candidates", defaultCandidatesPath));
  const prepared = await prepareAssertionCandidateSet(candidatesPath);
  const db = new DatabaseSync(dbPath, { readOnly: !apply });
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    if (!apply) db.exec("PRAGMA query_only = ON;");
    const plan = assertionCandidatePlan(db, prepared);
    if (!apply) {
      console.log(JSON.stringify(plan, null, 2));
      return;
    }
    const before = assertionWorkflowCounts(db);
    const result = extractAssertionCandidates(db, prepared);
    const after = assertionWorkflowCounts(db);
    const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyFailures.length > 0) {
      throw new Error(`Foreign-key check failed: ${JSON.stringify(foreignKeyFailures)}`);
    }
    console.log(JSON.stringify({ plan, result, counts: { before, after }, foreignKeyFailures }, null, 2));
  } finally {
    db.close();
  }
}

await main();
