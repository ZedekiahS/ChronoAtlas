import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const overviewPath = path.join(rootDir, "data", "overview-periods-to-1644.json");

const overview = JSON.parse(await readFile(overviewPath, "utf8"));
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
  `).run("period-overview-to-1644", overview.model, overview.schemaVersion ?? 1, JSON.stringify(overview));

  console.log(`Imported ${overview.periods?.length ?? 0} overview periods.`);
} finally {
  db.close();
}
