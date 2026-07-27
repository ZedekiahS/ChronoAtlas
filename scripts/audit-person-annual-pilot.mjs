import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  personAnnualPilotRoleDecisions,
  pilotPersonIds,
} from "./data/person-annual-pilot-role-decisions.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"), { readOnly: true });
const contextualRoles = new Set(["context", "mentioned-source", "related-context", "source-context"]);
const allowedRoles = new Set([
  "affected",
  "appointee",
  "commander",
  "defeated",
  "issuer",
  "office-holder",
  "ordered-by",
  "participant",
  "participant-candidate",
  "recipient",
  "ruler",
  "subject",
  "victor",
  ...contextualRoles,
]);
const decisionByKey = new Map(
  personAnnualPilotRoleDecisions.map((decision) => [`${decision.personId}:${decision.eventId}`, decision]),
);
const failures = [];
const people = [];

for (const personId of pilotPersonIds) {
  const entityId = `person:${personId}`;
  const eventRows = db.prepare(`
    SELECT ev.id, ev.time_start, ev.title, ee.role
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    WHERE ee.entity_id = ? AND ev.id NOT LIKE 'life:%'
    ORDER BY ev.time_start, ev.id, ee.role
  `).all(entityId);
  const lifeEventCount = db.prepare("SELECT count(*) AS n FROM person_life_events WHERE person_id = ?").get(personId).n;
  const duplicateRows = db.prepare(`
    SELECT event_id, count(*) AS n, group_concat(role) AS roles
    FROM event_entities
    WHERE entity_id = ? AND event_id NOT LIKE 'life:%'
    GROUP BY event_id HAVING count(*) > 1
  `).all(entityId);

  duplicateRows.forEach((row) => failures.push({ type: "duplicate-event-role", personId, ...row }));
  eventRows.forEach((row) => {
    const decision = decisionByKey.get(`${personId}:${row.id}`);
    if (!decision) failures.push({ type: "missing-decision", personId, eventId: row.id });
    else if (row.role !== decision.role) {
      failures.push({ type: "role-mismatch", personId, eventId: row.id, expected: decision.role, actual: row.role });
    }
    if (!allowedRoles.has(row.role)) failures.push({ type: "invalid-role", personId, eventId: row.id, role: row.role });
  });

  people.push({
    personId,
    lifeEvents: lifeEventCount,
    formalEvents: eventRows.length,
    directEvents: eventRows.filter((row) => !contextualRoles.has(row.role)).length,
    contextEvents: eventRows.filter((row) => contextualRoles.has(row.role)).length,
  });
}

for (const decision of personAnnualPilotRoleDecisions) {
  const row = db.prepare(`
    SELECT 1 FROM event_entities
    WHERE event_id = ? AND entity_id = ? AND role = ?
  `).get(decision.eventId, `person:${decision.personId}`, decision.role);
  if (!row) failures.push({ type: "missing-reviewed-link", ...decision });
}

db.close();
console.log(JSON.stringify({
  people,
  decisions: personAnnualPilotRoleDecisions.length,
  failures: failures.length,
  samples: failures.slice(0, 20),
}, null, 2));
if (failures.length) process.exitCode = 1;

