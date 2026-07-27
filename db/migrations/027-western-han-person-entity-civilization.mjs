export default function migrate(db) {
  db.prepare(`
    UPDATE entities
    SET civilization_id = NULL
    WHERE entity_type = 'person'
      AND civilization_id = 'china-three-kingdoms'
      AND json_extract(raw_json, '$.generatedFrom') = 'manual-western-han-core-hanshu-links'
  `).run();
}

export const runAfterRuntimeSeeds = true;
