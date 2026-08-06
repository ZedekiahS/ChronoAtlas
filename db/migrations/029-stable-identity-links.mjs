const migrationId = "029-stable-identity-links";

export const runAfterRuntimeSeeds = true;

function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS person_entity_links (
      person_id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL UNIQUE,
      link_method TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'high',
      review_status TEXT NOT NULL DEFAULT 'auto-verified',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historical_event_event_links (
      historical_event_id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      link_method TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'high',
      review_status TEXT NOT NULL DEFAULT 'auto-verified',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (historical_event_id) REFERENCES historical_events(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS place_entity_links (
      place_id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      link_method TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'high',
      review_status TEXT NOT NULL DEFAULT 'auto-verified',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_person_entity_links_entity
      ON person_entity_links(entity_id);
    CREATE INDEX IF NOT EXISTS idx_historical_event_event_links_event
      ON historical_event_event_links(event_id);
    CREATE INDEX IF NOT EXISTS idx_place_entity_links_entity
      ON place_entity_links(entity_id);
    CREATE INDEX IF NOT EXISTS idx_source_mention_places_place
      ON source_mention_places(place_id);
    CREATE INDEX IF NOT EXISTS idx_map_features_stable_place
      ON map_features(stable_place_id);

    CREATE TRIGGER IF NOT EXISTS trg_person_entity_links_type_insert
    BEFORE INSERT ON person_entity_links
    WHEN NOT EXISTS (
      SELECT 1 FROM entities
      WHERE id = NEW.entity_id AND entity_type = 'person'
    )
    BEGIN
      SELECT RAISE(ABORT, 'person_entity_links target must be a person entity');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_person_entity_links_type_update
    BEFORE UPDATE OF entity_id ON person_entity_links
    WHEN NOT EXISTS (
      SELECT 1 FROM entities
      WHERE id = NEW.entity_id AND entity_type = 'person'
    )
    BEGIN
      SELECT RAISE(ABORT, 'person_entity_links target must be a person entity');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_place_entity_links_type_insert
    BEFORE INSERT ON place_entity_links
    WHEN NOT EXISTS (
      SELECT 1 FROM entities
      WHERE id = NEW.entity_id AND entity_type = 'place'
    )
    BEGIN
      SELECT RAISE(ABORT, 'place_entity_links target must be a place entity');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_place_entity_links_type_update
    BEFORE UPDATE OF entity_id ON place_entity_links
    WHEN NOT EXISTS (
      SELECT 1 FROM entities
      WHERE id = NEW.entity_id AND entity_type = 'place'
    )
    BEGIN
      SELECT RAISE(ABORT, 'place_entity_links target must be a place entity');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_identity_link_entity_type_guard
    BEFORE UPDATE OF entity_type ON entities
    WHEN
      (NEW.entity_type <> 'person' AND EXISTS (
        SELECT 1 FROM person_entity_links WHERE entity_id = OLD.id
      ))
      OR
      (NEW.entity_type <> 'place' AND EXISTS (
        SELECT 1 FROM place_entity_links WHERE entity_id = OLD.id
      ))
    BEGIN
      SELECT RAISE(ABORT, 'entity_type conflicts with an explicit identity link');
    END;
  `);

  db.exec(`
    DROP VIEW IF EXISTS identity_mapping_issues;
    DROP VIEW IF EXISTS identity_mapping_coverage;
    DROP VIEW IF EXISTS place_reference_usage;

    CREATE VIEW place_reference_usage AS
    WITH references_by_source AS (
      SELECT
        place_id,
        COUNT(*) AS mention_count,
        0 AS map_feature_count
      FROM source_mention_places
      GROUP BY place_id

      UNION ALL

      SELECT
        stable_place_id AS place_id,
        0 AS mention_count,
        COUNT(*) AS map_feature_count
      FROM map_features
      WHERE stable_place_id IS NOT NULL
        AND TRIM(stable_place_id) <> ''
      GROUP BY stable_place_id
    )
    SELECT
      place_id,
      SUM(mention_count) AS mention_count,
      SUM(map_feature_count) AS map_feature_count,
      SUM(mention_count) + SUM(map_feature_count) AS usage_count
    FROM references_by_source
    GROUP BY place_id;

    CREATE VIEW identity_mapping_coverage AS
    WITH coverage AS (
      SELECT
        'person' AS object_type,
        COUNT(*) AS total_count,
        COALESCE(SUM(CASE WHEN link.person_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS mapped_count
      FROM persons source
      LEFT JOIN person_entity_links link ON link.person_id = source.id

      UNION ALL

      SELECT
        'historical_event' AS object_type,
        COUNT(*) AS total_count,
        COALESCE(SUM(CASE WHEN link.historical_event_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS mapped_count
      FROM historical_events source
      LEFT JOIN historical_event_event_links link ON link.historical_event_id = source.id

      UNION ALL

      SELECT
        'place_reference' AS object_type,
        COUNT(*) AS total_count,
        COALESCE(SUM(CASE WHEN link.place_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS mapped_count
      FROM place_reference_usage source
      LEFT JOIN place_entity_links link ON link.place_id = source.place_id
    )
    SELECT
      object_type,
      total_count,
      mapped_count,
      total_count - mapped_count AS unmapped_count,
      CASE
        WHEN total_count = 0 THEN 100.0
        ELSE ROUND(mapped_count * 100.0 / total_count, 2)
      END AS coverage_percent
    FROM coverage;

    CREATE VIEW identity_mapping_issues AS
    SELECT
      'person' AS object_type,
      source.id AS source_id,
      source.name AS source_label,
      'person:' || source.id AS candidate_target_id,
      'missing-link' AS issue,
      1 AS usage_count
    FROM persons source
    LEFT JOIN person_entity_links link ON link.person_id = source.id
    WHERE link.person_id IS NULL

    UNION ALL

    SELECT
      'historical_event' AS object_type,
      source.id AS source_id,
      source.title AS source_label,
      source.id AS candidate_target_id,
      'missing-link' AS issue,
      1 AS usage_count
    FROM historical_events source
    LEFT JOIN historical_event_event_links link ON link.historical_event_id = source.id
    WHERE link.historical_event_id IS NULL

    UNION ALL

    SELECT
      'place_reference' AS object_type,
      source.place_id AS source_id,
      NULL AS source_label,
      CASE
        WHEN source.place_id LIKE 'place:%' THEN source.place_id
        ELSE 'place:' || source.place_id
      END AS candidate_target_id,
      'missing-link' AS issue,
      source.usage_count AS usage_count
    FROM place_reference_usage source
    LEFT JOIN place_entity_links link ON link.place_id = source.place_id
    WHERE link.place_id IS NULL

    UNION ALL

    SELECT
      'person' AS object_type,
      link.person_id AS source_id,
      source.name AS source_label,
      link.entity_id AS candidate_target_id,
      'wrong-target-type' AS issue,
      1 AS usage_count
    FROM person_entity_links link
    JOIN persons source ON source.id = link.person_id
    JOIN entities target ON target.id = link.entity_id
    WHERE target.entity_type <> 'person'

    UNION ALL

    SELECT
      'place_reference' AS object_type,
      link.place_id AS source_id,
      NULL AS source_label,
      link.entity_id AS candidate_target_id,
      'wrong-target-type' AS issue,
      COALESCE((
        SELECT usage_count
        FROM place_reference_usage
        WHERE place_id = link.place_id
      ), 0) AS usage_count
    FROM place_entity_links link
    JOIN entities target ON target.id = link.entity_id
    WHERE target.entity_type <> 'place'

    UNION ALL

    SELECT
      'place_reference' AS object_type,
      feature.stable_place_id AS source_id,
      MIN(COALESCE(feature.name_zh, feature.name)) AS source_label,
      NULL AS candidate_target_id,
      'conflicting-map-feature-targets' AS issue,
      COUNT(*) AS usage_count
    FROM map_features feature
    WHERE feature.stable_place_id IS NOT NULL
      AND TRIM(feature.stable_place_id) <> ''
      AND feature.entity_id IS NOT NULL
    GROUP BY feature.stable_place_id
    HAVING COUNT(DISTINCT feature.entity_id) > 1;
  `);
}

function refreshGeneratedLinks(db) {
  const managedRawJson = JSON.stringify({ generatedFrom: migrationId });

  db.exec("SAVEPOINT stable_identity_links_refresh;");
  try {
    for (const tableName of [
      "person_entity_links",
      "historical_event_event_links",
      "place_entity_links",
    ]) {
      db.prepare(`
        DELETE FROM ${tableName}
        WHERE json_extract(raw_json, '$.generatedFrom') = ?
      `).run(migrationId);
    }

    db.prepare(`
      INSERT OR IGNORE INTO person_entity_links (
        person_id, entity_id, link_method, confidence, review_status, raw_json
      )
      SELECT
        source.id,
        target.id,
        'canonical-id',
        'high',
        'auto-verified',
        ?
      FROM persons source
      JOIN entities target
        ON target.id = 'person:' || source.id
       AND target.entity_type = 'person'
      ORDER BY source.id
    `).run(managedRawJson);

    db.prepare(`
      INSERT OR IGNORE INTO historical_event_event_links (
        historical_event_id, event_id, link_method, confidence, review_status, raw_json
      )
      SELECT
        source.id,
        target.id,
        'canonical-id',
        'high',
        'auto-verified',
        ?
      FROM historical_events source
      JOIN events target ON target.id = source.id
      ORDER BY source.id
    `).run(managedRawJson);

    db.prepare(`
      INSERT OR IGNORE INTO place_entity_links (
        place_id, entity_id, link_method, confidence, review_status, raw_json
      )
      SELECT
        source.place_id,
        target.id,
        CASE
          WHEN source.place_id LIKE 'place:%' THEN 'entity-id'
          ELSE 'canonical-prefix'
        END,
        'high',
        'auto-verified',
        ?
      FROM place_reference_usage source
      JOIN entities target
        ON target.id = CASE
          WHEN source.place_id LIKE 'place:%' THEN source.place_id
          ELSE 'place:' || source.place_id
        END
       AND target.entity_type = 'place'
      ORDER BY source.place_id
    `).run(managedRawJson);

    db.prepare(`
      INSERT OR IGNORE INTO place_entity_links (
        place_id, entity_id, link_method, confidence, review_status, raw_json
      )
      SELECT
        feature.stable_place_id,
        MIN(feature.entity_id),
        'map-feature-entity',
        'high',
        'auto-verified',
        ?
      FROM map_features feature
      JOIN entities target
        ON target.id = feature.entity_id
       AND target.entity_type = 'place'
      WHERE feature.stable_place_id IS NOT NULL
        AND TRIM(feature.stable_place_id) <> ''
        AND feature.entity_id IS NOT NULL
      GROUP BY feature.stable_place_id
      HAVING COUNT(DISTINCT feature.entity_id) = 1
      ORDER BY feature.stable_place_id
    `).run(managedRawJson);

    db.exec("RELEASE SAVEPOINT stable_identity_links_refresh;");
  } catch (error) {
    db.exec("ROLLBACK TO SAVEPOINT stable_identity_links_refresh;");
    db.exec("RELEASE SAVEPOINT stable_identity_links_refresh;");
    throw error;
  }
}

export default function migrate(db, context = {}) {
  createSchema(db);
  refreshGeneratedLinks(db);

  if (context.postRuntimeSeeds === true && typeof context.log === "function") {
    const coverage = db.prepare(`
      SELECT object_type, mapped_count, total_count, coverage_percent
      FROM identity_mapping_coverage
      ORDER BY object_type
    `).all();
    context.log(
      `identity coverage ${coverage
        .map((row) => `${row.object_type}=${row.mapped_count}/${row.total_count} (${row.coverage_percent}%)`)
        .join(', ')}`,
    );
  }
}
