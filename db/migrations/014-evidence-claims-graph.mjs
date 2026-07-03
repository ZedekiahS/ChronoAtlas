export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS evidence_claims (
      id TEXT PRIMARY KEY,
      claim_type TEXT NOT NULL,
      statement_zh TEXT NOT NULL,
      statement_en TEXT,
      time_start INTEGER,
      time_end INTEGER,
      region_id TEXT,
      period_id TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      dispute_status TEXT NOT NULL DEFAULT 'none',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (period_id) REFERENCES periods(id)
    );

    CREATE TABLE IF NOT EXISTS evidence_claim_sources (
      claim_id TEXT NOT NULL,
      source_id TEXT,
      mention_id TEXT,
      passage_id TEXT,
      locator TEXT,
      quote TEXT,
      source_role TEXT NOT NULL DEFAULT 'primary',
      confidence TEXT NOT NULL DEFAULT 'medium',
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (claim_id, source_id, mention_id, passage_id, locator),
      FOREIGN KEY (claim_id) REFERENCES evidence_claims(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id),
      FOREIGN KEY (mention_id) REFERENCES source_mentions(id),
      FOREIGN KEY (passage_id) REFERENCES source_passages(id)
    );

    CREATE TABLE IF NOT EXISTS evidence_claim_subjects (
      claim_id TEXT NOT NULL,
      subject_table TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      subject_role TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (claim_id, subject_table, subject_id, subject_role),
      FOREIGN KEY (claim_id) REFERENCES evidence_claims(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidence_claim_relations (
      source_claim_id TEXT NOT NULL,
      target_claim_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      note TEXT,
      confidence TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (source_claim_id, target_claim_id, relation_type),
      FOREIGN KEY (source_claim_id) REFERENCES evidence_claims(id) ON DELETE CASCADE,
      FOREIGN KEY (target_claim_id) REFERENCES evidence_claims(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_evidence_claims_event_period
      ON evidence_claims(region_id, period_id, time_start);
    CREATE INDEX IF NOT EXISTS idx_evidence_claim_sources_source
      ON evidence_claim_sources(source_id, mention_id, passage_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_claim_subjects_subject
      ON evidence_claim_subjects(subject_table, subject_id, subject_role);
  `);
}
