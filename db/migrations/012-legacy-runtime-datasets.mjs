export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS legacy_runtime_datasets (
      id TEXT PRIMARY KEY,
      legacy_table TEXT NOT NULL,
      replacement_geometry_dataset_id TEXT,
      replacement_control_dataset_id TEXT,
      reason TEXT NOT NULL,
      effective_from TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      raw_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_legacy_runtime_datasets_table
      ON legacy_runtime_datasets(legacy_table);
    CREATE INDEX IF NOT EXISTS idx_legacy_runtime_datasets_geometry
      ON legacy_runtime_datasets(replacement_geometry_dataset_id);
    CREATE INDEX IF NOT EXISTS idx_legacy_runtime_datasets_control
      ON legacy_runtime_datasets(replacement_control_dataset_id);
  `);

  const insertLegacy = db.prepare(`
    INSERT OR REPLACE INTO legacy_runtime_datasets (
      id,
      legacy_table,
      replacement_geometry_dataset_id,
      replacement_control_dataset_id,
      reason,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertLegacy.run(
    "china-admin-block-map-190-280",
    "china_admin_block_datasets",
    "china-admin-block-map-190-280",
    null,
    "Superseded by generic map_* geometry tables; retained for rebuild compatibility and historical seed comparison.",
    JSON.stringify({
      replacementTables: ["map_geometry_datasets", "map_features", "map_feature_geometries", "map_feature_sources"]
    })
  );

  insertLegacy.run(
    "china-block-control-timeline-190-280",
    "china_control_timeline_datasets",
    "china-admin-block-map-190-280",
    "china-block-control-timeline-190-280",
    "Superseded by generic map_* control tables; retained for rebuild compatibility and historical seed comparison.",
    JSON.stringify({
      replacementTables: ["map_control_datasets", "map_controllers", "map_control_records", "map_control_record_sources"]
    })
  );
}
