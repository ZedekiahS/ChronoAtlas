import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const dataPath = path.join(rootDir, "data", "china-commandery-supplemental-blocks.json");
const datasetId = "china-admin-block-map-190-280";

const dataset = JSON.parse(await readFile(dataPath, "utf8"));
const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA foreign_keys = ON;");

  const insertBlock = db.prepare(`
    INSERT OR REPLACE INTO china_admin_blocks (
      id,
      dataset_id,
      name,
      level,
      parent_id,
      center_json,
      geometry_json,
      confidence,
      approximate,
      sources_json,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN;");
  for (const block of dataset.blocks ?? []) {
    insertBlock.run(
      block.id,
      datasetId,
      block.name,
      block.level,
      null,
      JSON.stringify(block.center),
      JSON.stringify(block.geometry),
      block.confidence ?? "medium",
      block.approximate ? 1 : 0,
      JSON.stringify(block.sources ?? []),
      JSON.stringify(block),
    );
  }
  db.exec("COMMIT;");

  console.log(`Imported ${dataset.blocks?.length ?? 0} supplemental China commandery blocks.`);
} catch (error) {
  try {
    db.exec("ROLLBACK;");
  } catch {
    // Ignore rollback errors from failures before BEGIN.
  }
  throw error;
} finally {
  db.close();
}
