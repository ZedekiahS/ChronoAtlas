import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  personAnnualPilotRoleDecisions,
  pilotPersonIds,
} from "./data/person-annual-pilot-role-decisions.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const dryRun = process.argv.includes("--dry-run");
const db = new DatabaseSync(dbPath);

const existingRows = db.prepare(`
  SELECT DISTINCT substr(ee.entity_id, 8) AS person_id, ee.event_id
  FROM event_entities ee
  JOIN events ev ON ev.id = ee.event_id
  WHERE ee.entity_id IN (${pilotPersonIds.map(() => "?").join(", ")})
    AND ev.id NOT LIKE 'life:%'
  ORDER BY person_id, ee.event_id
`).all(...pilotPersonIds.map((personId) => `person:${personId}`));

const decisionByKey = new Map(
  personAnnualPilotRoleDecisions.map((decision) => [`${decision.personId}:${decision.eventId}`, decision]),
);
const existingKeys = new Set(existingRows.map((row) => `${row.person_id}:${row.event_id}`));
const missingDecisions = existingRows.filter((row) => !decisionByKey.has(`${row.person_id}:${row.event_id}`));
const staleDecisions = personAnnualPilotRoleDecisions.filter(
  (decision) => !existingKeys.has(`${decision.personId}:${decision.eventId}`),
);

if (missingDecisions.length || staleDecisions.length) {
  console.error(JSON.stringify({ missingDecisions, staleDecisions }, null, 2));
  db.close();
  process.exit(1);
}

const selectLinks = db.prepare(`
  SELECT sort_order, raw_json
  FROM event_entities
  WHERE event_id = ? AND entity_id = ?
  ORDER BY sort_order, role
`);
const deleteLinks = db.prepare("DELETE FROM event_entities WHERE event_id = ? AND entity_id = ?");
const insertLink = db.prepare(`
  INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
  VALUES (?, ?, ?, ?, ?)
`);

let linksCollapsed = 0;
let linksUpdated = 0;

db.exec("BEGIN IMMEDIATE");
try {
  for (const decision of personAnnualPilotRoleDecisions) {
    const entityId = `person:${decision.personId}`;
    const links = selectLinks.all(decision.eventId, entityId);
    linksCollapsed += Math.max(0, links.length - 1);
    linksUpdated += 1;
    if (dryRun) continue;

    const sortOrder = Math.min(...links.map((link) => link.sort_order ?? 999), 999);
    deleteLinks.run(decision.eventId, entityId);
    insertLink.run(
      decision.eventId,
      entityId,
      decision.role,
      sortOrder,
      JSON.stringify({
        generatedFrom: "person-annual-pilot-role-review:v1",
        reviewedPersonId: decision.personId,
        reviewedRole: decision.role,
      }),
    );
  }

  if (dryRun) db.exec("ROLLBACK");
  else db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

console.log(JSON.stringify({
  dryRun,
  people: pilotPersonIds.length,
  decisions: personAnnualPilotRoleDecisions.length,
  linksUpdated,
  linksCollapsed,
  missingDecisions: 0,
  staleDecisions: 0,
}, null, 2));

