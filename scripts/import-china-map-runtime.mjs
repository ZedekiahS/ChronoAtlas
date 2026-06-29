import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const chinaMapPath = path.join(rootDir, "data", "china-three-kingdoms-map.json");

const chinaMap = JSON.parse(await readFile(chinaMapPath, "utf8"));
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
  `).run("china-three-kingdoms-map-180-280", "china-three-kingdoms-map", 1, JSON.stringify(chinaMap));

  console.log(`Imported ${chinaMap.eras?.length ?? 0} China map eras and ${chinaMap.cities?.length ?? 0} city markers.`);
} finally {
  db.close();
}
