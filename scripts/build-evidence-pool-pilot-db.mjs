import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import migrateEvidencePool from "../db/migrations/031-evidence-pool-core.mjs";
import {
  annotatedAssetPlan,
  evidencePoolCounts,
  ingestAnnotatedAsset,
  prepareAnnotatedAsset,
} from "./lib/evidence-pool-pilot.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const primaryDbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const defaultAssetPath = path.join(rootDir, "data", "evidence-pool", "sanguozhi-wuyingdian-v54-pilot.json");

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

async function main() {
  const apply = process.argv.includes("--apply");
  const dbArgument = argumentValue("--db");
  const assetPath = path.resolve(argumentValue("--asset", defaultAssetPath));
  const prepared = await prepareAnnotatedAsset(assetPath);

  if (!apply) {
    console.log(JSON.stringify({
      ...annotatedAssetPlan(prepared),
      action: "No database will be created. Use --apply --standalone --db=<explicit shadow path>.",
    }, null, 2));
    return;
  }
  if (!dbArgument) throw new Error("--apply requires an explicit --db path");
  if (!process.argv.includes("--standalone")) {
    throw new Error("Standalone pilot creation requires --standalone acknowledgement");
  }

  const dbPath = path.resolve(dbArgument);
  if (dbPath === primaryDbPath) throw new Error("Standalone pilot builder never writes db/chronoatlas.sqlite");
  await mkdir(path.dirname(dbPath), { recursive: true });
  const existedBefore = existsSync(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    if (!tableExists(db, "entities")) {
      if (existedBefore) {
        throw new Error("Existing target lacks an entities table; choose a new shadow database path");
      }
      db.exec("CREATE TABLE entities (id TEXT PRIMARY KEY)");
    }
    migrateEvidencePool(db);
    const before = evidencePoolCounts(db);
    const result = ingestAnnotatedAsset(db, prepared);
    const after = evidencePoolCounts(db);
    const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyFailures.length > 0) {
      throw new Error(`Foreign-key check failed: ${JSON.stringify(foreignKeyFailures)}`);
    }
    const sampleAnchor = db.prepare(`
      SELECT anchor.id, anchor.public_urn, node.node_key
      FROM document_nodes node
      JOIN text_layers layer ON layer.node_id = node.id
      JOIN text_revisions revision ON revision.layer_id = layer.id
      JOIN text_anchors anchor ON anchor.text_revision_id = revision.id
      WHERE node.node_key = 'sgz-v54-zhou-yu-jiangbiao-quote'
      ORDER BY revision.revision_no DESC LIMIT 1
    `).get();
    console.log(JSON.stringify({
      database: dbPath,
      createdNewDatabase: !existedBefore,
      result,
      counts: { before, after },
      sampleAnchor,
      foreignKeyFailures,
    }, null, 2));
  } finally {
    db.close();
  }
}

await main();
