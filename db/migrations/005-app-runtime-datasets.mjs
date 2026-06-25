export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_runtime_datasets (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      schema_version INTEGER,
      raw_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
