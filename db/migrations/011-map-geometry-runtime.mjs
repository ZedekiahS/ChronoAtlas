export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS map_geometry_datasets (
      id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      model TEXT NOT NULL,
      region_id TEXT,
      period_id TEXT,
      civilization_id TEXT,
      label TEXT NOT NULL,
      time_start INTEGER,
      time_end INTEGER,
      coordinate_system TEXT NOT NULL DEFAULT 'wgs84-lonlat',
      source_note TEXT,
      source_url TEXT,
      license TEXT,
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (period_id) REFERENCES periods(id),
      FOREIGN KEY (civilization_id) REFERENCES civilizations(id)
    );

    CREATE TABLE IF NOT EXISTS map_features (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      entity_id TEXT,
      stable_place_id TEXT,
      name TEXT NOT NULL,
      name_zh TEXT,
      name_en TEXT,
      feature_type TEXT NOT NULL,
      admin_level TEXT,
      parent_feature_id TEXT,
      control_feature_id TEXT,
      center_lon REAL,
      center_lat REAL,
      label_lon REAL,
      label_lat REAL,
      min_lon REAL,
      min_lat REAL,
      max_lon REAL,
      max_lat REAL,
      area_hint REAL,
      confidence TEXT NOT NULL DEFAULT 'medium',
      approximate INTEGER NOT NULL DEFAULT 0,
      review_status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (dataset_id) REFERENCES map_geometry_datasets(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id),
      FOREIGN KEY (parent_feature_id) REFERENCES map_features(id),
      FOREIGN KEY (control_feature_id) REFERENCES map_features(id)
    );

    CREATE TABLE IF NOT EXISTS map_feature_geometries (
      id TEXT PRIMARY KEY,
      feature_id TEXT NOT NULL,
      geometry_role TEXT NOT NULL DEFAULT 'display',
      geometry_type TEXT NOT NULL,
      simplification_level TEXT NOT NULL DEFAULT 'full',
      coordinate_system TEXT NOT NULL DEFAULT 'wgs84-lonlat',
      coordinates_json TEXT NOT NULL,
      min_lon REAL,
      min_lat REAL,
      max_lon REAL,
      max_lat REAL,
      point_count INTEGER,
      ring_count INTEGER,
      source_feature_id TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      approximate INTEGER NOT NULL DEFAULT 0,
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS map_feature_aliases (
      id TEXT PRIMARY KEY,
      feature_id TEXT NOT NULL,
      value TEXT NOT NULL,
      alias_type TEXT NOT NULL,
      language TEXT,
      valid_start INTEGER,
      valid_end INTEGER,
      source_id TEXT,
      locator TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id)
    );

    CREATE TABLE IF NOT EXISTS map_control_datasets (
      id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      model TEXT NOT NULL,
      geometry_dataset_id TEXT NOT NULL,
      region_id TEXT,
      period_id TEXT,
      label TEXT NOT NULL,
      time_start INTEGER NOT NULL,
      time_end INTEGER NOT NULL,
      key_years_json TEXT NOT NULL DEFAULT '[]',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (geometry_dataset_id) REFERENCES map_geometry_datasets(id),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (period_id) REFERENCES periods(id)
    );

    CREATE TABLE IF NOT EXISTS map_controllers (
      id TEXT PRIMARY KEY,
      control_dataset_id TEXT NOT NULL,
      entity_id TEXT,
      label TEXT NOT NULL,
      color TEXT NOT NULL,
      controller_type TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (control_dataset_id) REFERENCES map_control_datasets(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    );

    CREATE TABLE IF NOT EXISTS map_control_records (
      id TEXT PRIMARY KEY,
      control_dataset_id TEXT NOT NULL,
      feature_id TEXT NOT NULL,
      controller_id TEXT NOT NULL,
      start_year INTEGER NOT NULL,
      end_year INTEGER NOT NULL,
      status TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'medium',
      approximate INTEGER NOT NULL DEFAULT 0,
      source_note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (control_dataset_id) REFERENCES map_control_datasets(id) ON DELETE CASCADE,
      FOREIGN KEY (feature_id) REFERENCES map_features(id),
      FOREIGN KEY (controller_id) REFERENCES map_controllers(id)
    );

    CREATE TABLE IF NOT EXISTS map_control_record_sources (
      control_record_id TEXT NOT NULL,
      source_id TEXT,
      passage_id TEXT,
      mention_id TEXT,
      locator TEXT,
      note TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      confidence TEXT NOT NULL DEFAULT 'medium',
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (control_record_id, sort_order),
      FOREIGN KEY (control_record_id) REFERENCES map_control_records(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id),
      FOREIGN KEY (passage_id) REFERENCES source_passages(id),
      FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
    );

    CREATE TABLE IF NOT EXISTS map_feature_sources (
      feature_id TEXT NOT NULL,
      source_id TEXT,
      passage_id TEXT,
      mention_id TEXT,
      locator TEXT,
      note TEXT,
      source_role TEXT NOT NULL DEFAULT 'geometry',
      sort_order INTEGER NOT NULL DEFAULT 0,
      confidence TEXT NOT NULL DEFAULT 'medium',
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (feature_id, source_role, sort_order),
      FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id),
      FOREIGN KEY (passage_id) REFERENCES source_passages(id),
      FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
    );

    CREATE TABLE IF NOT EXISTS map_feature_events (
      feature_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'medium',
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (feature_id, event_id, relation_type),
      FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS map_feature_entities (
      feature_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      time_start INTEGER,
      time_end INTEGER,
      confidence TEXT NOT NULL DEFAULT 'medium',
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (feature_id, entity_id, relation_type),
      FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    );

    CREATE INDEX IF NOT EXISTS idx_map_features_dataset_level
      ON map_features(dataset_id, admin_level);
    CREATE INDEX IF NOT EXISTS idx_map_features_dataset_type
      ON map_features(dataset_id, feature_type);
    CREATE INDEX IF NOT EXISTS idx_map_features_parent
      ON map_features(parent_feature_id);
    CREATE INDEX IF NOT EXISTS idx_map_features_control_feature
      ON map_features(control_feature_id);
    CREATE INDEX IF NOT EXISTS idx_map_features_entity
      ON map_features(entity_id);
    CREATE INDEX IF NOT EXISTS idx_map_features_bbox
      ON map_features(dataset_id, min_lon, min_lat, max_lon, max_lat);
    CREATE INDEX IF NOT EXISTS idx_map_feature_geometries_feature_level
      ON map_feature_geometries(feature_id, simplification_level);
    CREATE INDEX IF NOT EXISTS idx_map_feature_geometries_bbox
      ON map_feature_geometries(min_lon, min_lat, max_lon, max_lat);
    CREATE INDEX IF NOT EXISTS idx_map_control_records_feature_year
      ON map_control_records(feature_id, start_year, end_year);
    CREATE INDEX IF NOT EXISTS idx_map_control_records_controller_year
      ON map_control_records(controller_id, start_year, end_year);
    CREATE INDEX IF NOT EXISTS idx_map_control_records_dataset_year
      ON map_control_records(control_dataset_id, start_year, end_year);
    CREATE INDEX IF NOT EXISTS idx_map_control_record_sources_source
      ON map_control_record_sources(source_id);
    CREATE INDEX IF NOT EXISTS idx_map_feature_sources_source
      ON map_feature_sources(source_id);
    CREATE INDEX IF NOT EXISTS idx_map_feature_events_event
      ON map_feature_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_map_feature_entities_entity
      ON map_feature_entities(entity_id);
  `);
}
