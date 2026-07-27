import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeEventPlaceRoles } from "./lib/event-place-role-governance.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"), { readOnly: true });
const analysis = analyzeEventPlaceRoles(db);
db.close();

const failures = [
  ...analysis.unknownRoleRows.map((row) => ({ type: "unknown-role", ...row })),
  ...analysis.orphanLinks.map((row) => ({ type: "orphan-link", ...row })),
];

console.log(JSON.stringify({
  contractVersion: analysis.contractVersion,
  metrics: analysis.metrics,
  pendingDeterministicChanges: {
    deletes: analysis.deletes.length,
    inserts: analysis.inserts.length,
    eventUpdates: analysis.eventUpdates.length,
  },
  failures: failures.length,
  samples: failures.slice(0, 20),
}, null, 2));

if (failures.length) process.exitCode = 1;
