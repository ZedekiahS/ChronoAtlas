import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzePersonEventRoles } from "./lib/person-event-role-governance.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const queuePath = path.join(rootDir, "data", "review-queues", "person-event-role-review-v1.json");
const dryRun = process.argv.includes("--dry-run");
const db = new DatabaseSync(dbPath);
const analysis = analyzePersonEventRoles(db);

function countReviewItemsBy(field) {
  return analysis.reviewItems.reduce((counts, item) => {
    const key = item[field] ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

fs.mkdirSync(path.dirname(queuePath), { recursive: true });
fs.writeFileSync(queuePath, `${JSON.stringify({
  schemaVersion: 1,
  generatedFrom: analysis.contractVersion,
  generatedAt: new Date().toISOString(),
  dryRun,
  metrics: analysis.metrics,
  reviewSummary: {
    byType: countReviewItemsBy("type"),
    byRegion: countReviewItemsBy("regionId"),
  },
  identityRepairs: analysis.identityRepairs,
  items: analysis.reviewItems,
}, null, 2)}\n`);

if (analysis.unknownRoleRows.length || analysis.ambiguousNameRoles.length || analysis.orphanLinks.length) {
  console.error(JSON.stringify({
    error: "Hard role-contract violations must be resolved before repair.",
    unknownRoleRows: analysis.unknownRoleRows.slice(0, 20),
    ambiguousNameRoles: analysis.ambiguousNameRoles.slice(0, 20),
    orphanLinks: analysis.orphanLinks.slice(0, 20),
  }, null, 2));
  db.close();
  process.exit(1);
}

const deleteLink = db.prepare(`
  DELETE FROM event_entities
  WHERE event_id = ? AND entity_id = ? AND role = ?
`);
const insertLink = db.prepare(`
  INSERT OR IGNORE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
  VALUES (?, ?, ?, ?, ?)
`);

if (!dryRun) {
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const row of analysis.deletes) deleteLink.run(row.eventId, row.entityId, row.role);
    for (const row of analysis.inserts) {
      insertLink.run(row.eventId, row.entityId, row.role, row.sortOrder, row.rawJson);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

db.close();
console.log(JSON.stringify({
  dryRun,
  queuePath: path.relative(rootDir, queuePath),
  ...analysis.metrics,
}, null, 2));
