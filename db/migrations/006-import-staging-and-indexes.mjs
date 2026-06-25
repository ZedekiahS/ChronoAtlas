export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      source_provider TEXT NOT NULL,
      source_root TEXT,
      status TEXT NOT NULL DEFAULT 'staged'
        CHECK (status IN ('staged', 'reviewing', 'approved', 'rejected', 'promoted')),
      notes TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS import_draft_files (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      source_provider TEXT NOT NULL,
      corpus_hint TEXT,
      collection_hint TEXT,
      card_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      warning_count INTEGER NOT NULL DEFAULT 0,
      import_status TEXT NOT NULL DEFAULT 'staged'
        CHECK (import_status IN ('staged', 'needs-fix', 'approved', 'rejected', 'promoted')),
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE,
      UNIQUE (batch_id, relative_path)
    );

    CREATE TABLE IF NOT EXISTS import_evidence_cards (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      file_id TEXT NOT NULL,
      card_index INTEGER NOT NULL,
      source_title TEXT,
      source_type TEXT,
      author TEXT,
      commentary_author TEXT,
      quoted_work TEXT,
      section TEXT,
      locator TEXT,
      year INTEGER,
      display_date TEXT,
      original_text TEXT,
      translation TEXT,
      people_core_json TEXT NOT NULL DEFAULT '[]',
      people_mentioned_json TEXT NOT NULL DEFAULT '[]',
      places_json TEXT NOT NULL DEFAULT '[]',
      macro_event TEXT,
      event_label TEXT,
      fact_brief TEXT,
      fact_detailed TEXT,
      fact_type TEXT,
      confidence TEXT,
      questions_json TEXT NOT NULL DEFAULT '[]',
      review_status TEXT NOT NULL DEFAULT 'staged'
        CHECK (review_status IN ('staged', 'needs-fix', 'approved', 'rejected', 'promoted')),
      validation_errors_json TEXT NOT NULL DEFAULT '[]',
      validation_warnings_json TEXT NOT NULL DEFAULT '[]',
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE,
      FOREIGN KEY (file_id) REFERENCES import_draft_files(id) ON DELETE CASCADE,
      UNIQUE (file_id, card_index)
    );

    CREATE INDEX IF NOT EXISTS idx_import_draft_files_batch_status
      ON import_draft_files(batch_id, import_status);
    CREATE INDEX IF NOT EXISTS idx_import_draft_files_path
      ON import_draft_files(relative_path);
    CREATE INDEX IF NOT EXISTS idx_import_evidence_cards_batch_status
      ON import_evidence_cards(batch_id, review_status);
    CREATE INDEX IF NOT EXISTS idx_import_evidence_cards_source
      ON import_evidence_cards(source_title, locator);
    CREATE INDEX IF NOT EXISTS idx_import_evidence_cards_people_core
      ON import_evidence_cards(people_core_json);
    CREATE INDEX IF NOT EXISTS idx_import_evidence_cards_event
      ON import_evidence_cards(event_label, macro_event, year);
    CREATE INDEX IF NOT EXISTS idx_import_evidence_cards_fact_type
      ON import_evidence_cards(fact_type, confidence);

    CREATE INDEX IF NOT EXISTS idx_sources_review_corpus
      ON sources(review_status, corpus_id);
    CREATE INDEX IF NOT EXISTS idx_sources_title_author
      ON sources(title, author);
    CREATE INDEX IF NOT EXISTS idx_source_passages_source_locator
      ON source_passages(source_id, locator);
    CREATE INDEX IF NOT EXISTS idx_source_passages_review
      ON source_passages(review_status, confidence);
    CREATE INDEX IF NOT EXISTS idx_source_mentions_locator
      ON source_mentions(source_id, locator);
    CREATE INDEX IF NOT EXISTS idx_source_mentions_review
      ON source_mentions(review_status, confidence);
    CREATE INDEX IF NOT EXISTS idx_events_time_type
      ON events(time_start, time_end, event_type);
    CREATE INDEX IF NOT EXISTS idx_events_review
      ON events(review_status, confidence);
    CREATE INDEX IF NOT EXISTS idx_entities_civilization_type
      ON entities(civilization_id, entity_type, primary_label);
    CREATE INDEX IF NOT EXISTS idx_evidence_links_source
      ON evidence_links(source_id, passage_id, mention_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_links_confidence
      ON evidence_links(confidence, evidence_role);
  `);
}
