import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzePersonEventRoles } from "./lib/person-event-role-governance.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"), { readOnly: true });
const analysis = analyzePersonEventRoles(db);
db.close();

const failures = [
  ...analysis.unknownRoleRows.map((row) => ({ type: "unknown-role", ...row })),
  ...analysis.ambiguousNameRoles.map((row) => ({ type: "ambiguous-name-role", ...row })),
  ...analysis.orphanLinks.map((row) => ({ type: "orphan-link", ...row })),
];

console.log(JSON.stringify({
  contractVersion: analysis.contractVersion,
  metrics: analysis.metrics,
  pendingDeterministicChanges: {
    deletes: analysis.deletes.length,
    inserts: analysis.inserts.length,
  },
  failures: failures.length,
  samples: failures.slice(0, 20),
}, null, 2));

if (failures.length) process.exitCode = 1;

