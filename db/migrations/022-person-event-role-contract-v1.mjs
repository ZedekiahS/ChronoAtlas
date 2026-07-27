import { analyzePersonEventRoles } from "../../scripts/lib/person-event-role-governance.mjs";

export const runAfterRuntimeSeeds = true;

export default function migrate(db, options = {}) {
  const table = db.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table' AND name = 'event_entities'
  `).get();
  if (!table) return;

  const analysis = analyzePersonEventRoles(db);
  if (analysis.unknownRoleRows.length || analysis.ambiguousNameRoles.length || analysis.orphanLinks.length) {
    throw new Error(`Person-event role contract has hard failures: ${JSON.stringify({
      unknownRoles: analysis.unknownRoleRows.length,
      ambiguousNameRoles: analysis.ambiguousNameRoles.length,
      orphanLinks: analysis.orphanLinks.length,
    })}`);
  }

  const deleteLink = db.prepare(`
    DELETE FROM event_entities
    WHERE event_id = ? AND entity_id = ? AND role = ?
  `);
  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const row of analysis.deletes) deleteLink.run(row.eventId, row.entityId, row.role);
  for (const row of analysis.inserts) {
    insertLink.run(row.eventId, row.entityId, row.role, row.sortOrder, row.rawJson);
  }

  options.log?.(
    `person-event roles: ${analysis.deletes.length} deleted, ${analysis.inserts.length} inserted, ` +
    `${analysis.metrics.participantCandidates} candidates queued`,
  );
}

