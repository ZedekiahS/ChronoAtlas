import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const physicalPath = path.join(rootDir, "data", "natural-earth-china-physical.json");

const physical = JSON.parse(await readFile(physicalPath, "utf8"));
const db = new DatabaseSync(dbPath);

try {
  db.prepare(`
    INSERT OR REPLACE INTO app_runtime_datasets (
      id,
      model,
      schema_version,
      raw_json,
      updated_at
    )
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run("natural-earth-china-physical", "natural-earth-china-physical", 1, JSON.stringify(physical));

  console.log(
    `Imported Natural Earth China physical data: ${physical.land?.features?.length ?? 0} land, ${
      physical.rivers?.features?.length ?? 0
    } rivers, ${physical.lakes?.features?.length ?? 0} lakes.`
  );
} finally {
  db.close();
}
