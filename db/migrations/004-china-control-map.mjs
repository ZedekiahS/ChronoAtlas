export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS china_admin_block_datasets (
      id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      model TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      coordinate_system TEXT,
      notes TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS china_admin_blocks (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      parent_id TEXT,
      center_json TEXT NOT NULL,
      geometry_json TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'medium',
      approximate INTEGER NOT NULL DEFAULT 0,
      sources_json TEXT NOT NULL DEFAULT '[]',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (dataset_id) REFERENCES china_admin_block_datasets(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES china_admin_blocks(id)
    );

    CREATE TABLE IF NOT EXISTS china_control_timeline_datasets (
      id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      model TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      key_years_json TEXT NOT NULL DEFAULT '[]',
      raw_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS china_control_controllers (
      id TEXT PRIMARY KEY,
      timeline_id TEXT NOT NULL,
      color TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (timeline_id) REFERENCES china_control_timeline_datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS china_control_records (
      id TEXT PRIMARY KEY,
      timeline_id TEXT NOT NULL,
      block_id TEXT NOT NULL,
      start_year INTEGER NOT NULL,
      end_year INTEGER NOT NULL,
      controller TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'medium',
      sources_json TEXT NOT NULL DEFAULT '[]',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (timeline_id) REFERENCES china_control_timeline_datasets(id) ON DELETE CASCADE,
      FOREIGN KEY (block_id) REFERENCES china_admin_blocks(id),
      FOREIGN KEY (controller) REFERENCES china_control_controllers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_china_admin_blocks_parent
      ON china_admin_blocks(parent_id);
    CREATE INDEX IF NOT EXISTS idx_china_control_records_block_year
      ON china_control_records(block_id, start_year, end_year);
    CREATE INDEX IF NOT EXISTS idx_china_control_records_controller
      ON china_control_records(controller);
  `);
}
