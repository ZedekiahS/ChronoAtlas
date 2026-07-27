import { analyzeEventPlaceRoles } from "../../scripts/lib/event-place-role-governance.mjs";

export const runAfterRuntimeSeeds = true;

export default function migrate(db, options = {}) {
  const table = db.prepare(`
    SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'event_entities'
  `).get();
  if (!table) return;

  const analysis = analyzeEventPlaceRoles(db);
  if (analysis.unknownRoleRows.length || analysis.orphanLinks.length) {
    throw new Error(`Event-place role contract has hard failures: ${JSON.stringify({
      unknownRoles: analysis.unknownRoleRows.length,
      orphanLinks: analysis.orphanLinks.length,
    })}`);
  }

  const deleteLink = db.prepare(`
    DELETE FROM event_entities WHERE event_id = ? AND entity_id = ? AND role = ?
  `);
  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  const updateEventPrimary = db.prepare(`
    UPDATE events SET place_entity_id = ?
    WHERE id = ? AND (place_entity_id IS NULL OR place_entity_id <> ?)
  `);
  const updateLegacyPrimary = db.prepare(`
    UPDATE historical_events SET location_name = COALESCE(location_name, ?) WHERE id = ?
  `);

  for (const row of analysis.deletes) deleteLink.run(row.eventId, row.entityId, row.role);
  for (const row of analysis.inserts) {
    insertLink.run(row.eventId, row.entityId, row.role, row.sortOrder, row.rawJson);
  }
  for (const row of analysis.eventUpdates) {
    updateEventPrimary.run(row.entityId, row.eventId, row.entityId);
    updateLegacyPrimary.run(row.label, row.eventId);
  }

  options.log?.(
    `event-place roles: ${analysis.deletes.length} deleted, ${analysis.inserts.length} inserted, ` +
    `${analysis.eventUpdates.length} event primaries synchronized`,
  );
}
