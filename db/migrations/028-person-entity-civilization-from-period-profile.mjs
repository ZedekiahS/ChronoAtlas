function periodIdFromRaw(rawJson) {
  try {
    const raw = JSON.parse(rawJson ?? "{}");
    for (const candidate of [raw.periodId, raw.periodHint, raw.profileId, raw.promotionProfile]) {
      if (typeof candidate !== "string" || !candidate) continue;
      return candidate.replace(/-v\d+$/u, "");
    }
  } catch {
    return null;
  }
  return null;
}

export default function migrate(db) {
  const periodExists = db.prepare("SELECT 1 FROM periods WHERE id = ? LIMIT 1");
  const clearCivilization = db.prepare("UPDATE entities SET civilization_id = NULL WHERE id = ?");
  const entities = db.prepare(`
    SELECT id, raw_json
    FROM entities
    WHERE entity_type = 'person'
      AND civilization_id = 'china-three-kingdoms'
  `).all();

  for (const entity of entities) {
    const periodId = periodIdFromRaw(entity.raw_json);
    if (!periodId || periodId.startsWith("china-three-kingdoms-")) continue;
    if (periodExists.get(periodId)) clearCivilization.run(entity.id);
  }
}

export const runAfterRuntimeSeeds = true;
