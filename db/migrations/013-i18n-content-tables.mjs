export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS source_i18n (
      source_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      citation_short TEXT,
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (source_id, locale),
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS source_passage_i18n (
      passage_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      translation TEXT,
      notes TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (passage_id, locale),
      FOREIGN KEY (passage_id) REFERENCES source_passages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS person_i18n (
      person_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      name TEXT NOT NULL,
      courtesy_name TEXT,
      life TEXT,
      primary_polity TEXT,
      summary TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (person_id, locale),
      FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historical_event_i18n (
      event_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      location_name TEXT,
      summary TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (event_id, locale),
      FOREIGN KEY (event_id) REFERENCES historical_events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS source_mention_i18n (
      mention_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      work_title TEXT,
      book_title TEXT,
      chapter_title TEXT,
      translation TEXT,
      dispute_note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (mention_id, locale),
      FOREIGN KEY (mention_id) REFERENCES source_mentions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS person_life_event_i18n (
      life_event_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      display_year TEXT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (life_event_id, locale),
      FOREIGN KEY (life_event_id) REFERENCES person_life_events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS person_relation_i18n (
      relation_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      summary TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (relation_id, locale),
      FOREIGN KEY (relation_id) REFERENCES person_relations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS entity_i18n (
      entity_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      primary_label TEXT NOT NULL,
      summary TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (entity_id, locale),
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_i18n (
      event_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      display_time TEXT,
      summary TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (event_id, locale),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_source_i18n_locale ON source_i18n(locale);
    CREATE INDEX IF NOT EXISTS idx_person_i18n_name ON person_i18n(locale, name);
    CREATE INDEX IF NOT EXISTS idx_person_life_event_i18n_locale ON person_life_event_i18n(locale);
    CREATE INDEX IF NOT EXISTS idx_source_mention_i18n_locale ON source_mention_i18n(locale);
    CREATE INDEX IF NOT EXISTS idx_historical_event_i18n_locale ON historical_event_i18n(locale);
    CREATE INDEX IF NOT EXISTS idx_person_relation_i18n_locale ON person_relation_i18n(locale);
    CREATE INDEX IF NOT EXISTS idx_entity_i18n_label ON entity_i18n(locale, primary_label);
    CREATE INDEX IF NOT EXISTS idx_event_i18n_locale ON event_i18n(locale);

    INSERT OR IGNORE INTO source_i18n (source_id, locale, title, author, citation_short, note)
      SELECT id, 'zh', title, author, citation_short, note
      FROM sources;

    INSERT OR IGNORE INTO source_passage_i18n (passage_id, locale, translation, notes)
      SELECT id, 'zh', translation, notes
      FROM source_passages
      WHERE translation IS NOT NULL OR notes IS NOT NULL;

    INSERT OR IGNORE INTO person_i18n (person_id, locale, name, courtesy_name, life, primary_polity, summary)
      SELECT id, 'zh', name, courtesy_name, life, primary_polity, summary
      FROM persons;

    INSERT OR IGNORE INTO historical_event_i18n (event_id, locale, title, location_name, summary)
      SELECT id, 'zh', title, location_name, summary
      FROM historical_events;

    INSERT OR IGNORE INTO source_mention_i18n (mention_id, locale, work_title, book_title, chapter_title, translation, dispute_note)
      SELECT
        id,
        'zh',
        work_title,
        book_title,
        chapter_title,
        translation,
        COALESCE(json_extract(raw_json, '$.disputeNote'), json_extract(raw_json, '$.uncertainty'))
      FROM source_mentions;

    INSERT OR IGNORE INTO person_life_event_i18n (life_event_id, locale, display_year, title, summary)
      SELECT id, 'zh', display_year, title, summary
      FROM person_life_events;

    INSERT OR IGNORE INTO person_relation_i18n (relation_id, locale, summary)
      SELECT id, 'zh', summary
      FROM person_relations;

    INSERT OR IGNORE INTO entity_i18n (entity_id, locale, primary_label, summary)
      SELECT id, 'zh', primary_label, summary
      FROM entities;

    INSERT OR IGNORE INTO event_i18n (event_id, locale, title, display_time, summary)
      SELECT id, 'zh', title, display_time, summary
      FROM events;

    INSERT OR IGNORE INTO event_i18n (event_id, locale, title, display_time, summary)
      SELECT
        id,
        'en',
        COALESCE(json_extract(raw_json, '$.titleEn'), json_extract(raw_json, '$.eventLabel')),
        display_time,
        json_extract(raw_json, '$.summaryEn')
      FROM events
      WHERE COALESCE(json_extract(raw_json, '$.titleEn'), json_extract(raw_json, '$.eventLabel')) IS NOT NULL;
  `);
}
