function tableColumns(db, tableName) {
  return new Set(
    db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name)
  );
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  const columns = tableColumns(db, tableName);
  if (!columns.has(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS civilizations (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      region_id TEXT,
      time_start INTEGER,
      time_end INTEGER,
      summary TEXT,
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}'
    );
  `);

  addColumnIfMissing(db, "corpora", "civilization_id", "TEXT REFERENCES civilizations(id)");
  addColumnIfMissing(db, "corpora", "default_language", "TEXT");
  addColumnIfMissing(db, "corpora", "time_start", "INTEGER");
  addColumnIfMissing(db, "corpora", "time_end", "INTEGER");
  addColumnIfMissing(db, "corpora", "review_status", "TEXT NOT NULL DEFAULT 'draft'");
  addColumnIfMissing(db, "corpora", "raw_json", "TEXT NOT NULL DEFAULT '{}'");

  addColumnIfMissing(db, "sources", "original_title", "TEXT");
  addColumnIfMissing(db, "sources", "source_type", "TEXT");
  addColumnIfMissing(db, "sources", "date_label", "TEXT");
  addColumnIfMissing(db, "sources", "date_start", "INTEGER");
  addColumnIfMissing(db, "sources", "date_end", "INTEGER");
  addColumnIfMissing(db, "sources", "reliability_level", "TEXT NOT NULL DEFAULT 'medium'");
  addColumnIfMissing(db, "sources", "review_status", "TEXT NOT NULL DEFAULT 'draft'");

  addColumnIfMissing(db, "source_passages", "place_hint", "TEXT");
  addColumnIfMissing(db, "source_passages", "topic_hint", "TEXT");

  db.exec(`
    CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      parent_region_id TEXT,
      region_type TEXT NOT NULL,
      time_start INTEGER,
      time_end INTEGER,
      summary TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (parent_region_id) REFERENCES regions(id)
    );

    CREATE TABLE IF NOT EXISTS periods (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      time_start INTEGER NOT NULL,
      time_end INTEGER NOT NULL,
      region_id TEXT,
      civilization_id TEXT,
      period_type TEXT NOT NULL,
      summary TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (civilization_id) REFERENCES civilizations(id)
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      primary_label TEXT NOT NULL,
      civilization_id TEXT,
      region_id TEXT,
      time_start INTEGER,
      time_end INTEGER,
      summary TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (civilization_id) REFERENCES civilizations(id),
      FOREIGN KEY (region_id) REFERENCES regions(id)
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

    CREATE TABLE IF NOT EXISTS entity_aliases (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      value TEXT NOT NULL,
      alias_type TEXT NOT NULL,
      language TEXT,
      context_source_id TEXT,
      valid_start INTEGER,
      valid_end INTEGER,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (context_source_id) REFERENCES sources(id)
    );

    CREATE TABLE IF NOT EXISTS entity_relations (
      id TEXT PRIMARY KEY,
      source_entity_id TEXT NOT NULL,
      target_entity_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      time_start INTEGER,
      time_end INTEGER,
      summary TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (target_entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      parent_topic_id TEXT,
      description TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (parent_topic_id) REFERENCES topics(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      event_type TEXT,
      time_start INTEGER,
      time_end INTEGER,
      display_time TEXT,
      region_id TEXT,
      place_entity_id TEXT,
      summary TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (place_entity_id) REFERENCES entities(id)
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

    CREATE TABLE IF NOT EXISTS event_entities (
      event_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      role TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (event_id, entity_id, role),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    );

    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      region_id TEXT,
      period_id TEXT,
      civilization_id TEXT,
      time_start INTEGER,
      time_end INTEGER,
      claim TEXT NOT NULL,
      analysis TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (topic_id) REFERENCES topics(id),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (period_id) REFERENCES periods(id),
      FOREIGN KEY (civilization_id) REFERENCES civilizations(id)
    );

    CREATE TABLE IF NOT EXISTS evidence_links (
      id TEXT PRIMARY KEY,
      subject_table TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      source_id TEXT,
      passage_id TEXT,
      mention_id TEXT,
      locator TEXT,
      quote TEXT,
      evidence_role TEXT NOT NULL DEFAULT 'support',
      confidence TEXT NOT NULL DEFAULT 'medium',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (source_id) REFERENCES sources(id),
      FOREIGN KEY (passage_id) REFERENCES source_passages(id),
      FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
    );

    CREATE TABLE IF NOT EXISTS search_documents (
      id TEXT PRIMARY KEY,
      subject_table TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      language TEXT,
      region_id TEXT,
      period_id TEXT,
      topic_id TEXT,
      time_start INTEGER,
      time_end INTEGER,
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (period_id) REFERENCES periods(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      id TEXT PRIMARY KEY,
      search_document_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      dimensions INTEGER NOT NULL,
      vector BLOB NOT NULL,
      created_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (search_document_id) REFERENCES search_documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_answer_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      retrieval_query_json TEXT NOT NULL DEFAULT '{}',
      cited_evidence_json TEXT NOT NULL DEFAULT '[]',
      model TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS ai_retrieval_runs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      question TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'zh',
      page_context_json TEXT NOT NULL DEFAULT '{}',
      query_plan_json TEXT NOT NULL DEFAULT '{}',
      provider TEXT,
      model TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS ai_retrieval_items (
      run_id TEXT NOT NULL,
      rank INTEGER NOT NULL,
      subject_table TEXT,
      subject_id TEXT,
      search_document_id TEXT,
      chunk_id TEXT,
      source_id TEXT,
      passage_id TEXT,
      mention_id TEXT,
      score REAL,
      reason TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (run_id, rank),
      FOREIGN KEY (run_id) REFERENCES ai_retrieval_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id),
      FOREIGN KEY (passage_id) REFERENCES source_passages(id),
      FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
    );

    CREATE TABLE IF NOT EXISTS ai_answers (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      answer TEXT NOT NULL,
      cited_items_json TEXT NOT NULL DEFAULT '[]',
      confidence TEXT,
      warnings_json TEXT NOT NULL DEFAULT '[]',
      provider TEXT,
      model TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (run_id) REFERENCES ai_retrieval_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_civilizations_region_time
      ON civilizations(region_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_regions_parent
      ON regions(parent_region_id);
    CREATE INDEX IF NOT EXISTS idx_periods_region_time
      ON periods(region_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_entities_type_label
      ON entities(entity_type, primary_label);
    CREATE INDEX IF NOT EXISTS idx_entities_region_time
      ON entities(region_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_entity_i18n_label
      ON entity_i18n(locale, primary_label);
    CREATE INDEX IF NOT EXISTS idx_entity_aliases_value
      ON entity_aliases(value);
    CREATE INDEX IF NOT EXISTS idx_entity_relations_source
      ON entity_relations(source_entity_id, relation_type);
    CREATE INDEX IF NOT EXISTS idx_entity_relations_target
      ON entity_relations(target_entity_id, relation_type);
    CREATE INDEX IF NOT EXISTS idx_events_region_time
      ON events(region_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_event_i18n_locale
      ON event_i18n(locale);
    CREATE INDEX IF NOT EXISTS idx_event_entities_entity
      ON event_entities(entity_id, role);
    CREATE INDEX IF NOT EXISTS idx_observations_query
      ON observations(topic_id, region_id, period_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_evidence_links_subject
      ON evidence_links(subject_table, subject_id);
    CREATE INDEX IF NOT EXISTS idx_search_documents_filter
      ON search_documents(region_id, period_id, topic_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_embeddings_document
      ON embeddings(search_document_id, provider, model);
    CREATE INDEX IF NOT EXISTS idx_ai_retrieval_runs_created
      ON ai_retrieval_runs(created_at);
    CREATE INDEX IF NOT EXISTS idx_ai_retrieval_items_subject
      ON ai_retrieval_items(subject_table, subject_id);
    CREATE INDEX IF NOT EXISTS idx_ai_retrieval_items_source
      ON ai_retrieval_items(source_id, mention_id, passage_id);
    CREATE INDEX IF NOT EXISTS idx_ai_answers_run
      ON ai_answers(run_id);
  `);
}
