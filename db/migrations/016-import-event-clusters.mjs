export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_event_clusters (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      region_id TEXT,
      canonical_label TEXT NOT NULL,
      normalized_key TEXT NOT NULL,
      event_type TEXT,
      event_scale TEXT,
      time_start INTEGER,
      time_end INTEGER,
      candidate_count INTEGER NOT NULL DEFAULT 0,
      source_count INTEGER NOT NULL DEFAULT 0,
      person_count INTEGER NOT NULL DEFAULT 0,
      matched_event_id TEXT,
      match_status TEXT NOT NULL DEFAULT 'unmatched'
        CHECK (match_status IN ('unmatched', 'possible', 'matched', 'promoted', 'rejected')),
      confidence TEXT,
      review_status TEXT NOT NULL DEFAULT 'staged'
        CHECK (review_status IN ('staged', 'needs-review', 'approved', 'rejected', 'promoted')),
      summary TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE,
      FOREIGN KEY (matched_event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS import_event_cluster_members (
      cluster_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      similarity_score REAL NOT NULL DEFAULT 1,
      role TEXT NOT NULL DEFAULT 'evidence',
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (cluster_id, card_id),
      FOREIGN KEY (cluster_id) REFERENCES import_event_clusters(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES import_evidence_cards(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_import_event_clusters_batch_status
      ON import_event_clusters(batch_id, review_status, match_status);
    CREATE INDEX IF NOT EXISTS idx_import_event_clusters_region_time
      ON import_event_clusters(region_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_import_event_clusters_key
      ON import_event_clusters(batch_id, normalized_key);
    CREATE INDEX IF NOT EXISTS idx_import_event_cluster_members_card
      ON import_event_cluster_members(card_id);
  `);
}
