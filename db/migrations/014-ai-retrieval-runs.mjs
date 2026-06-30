export default function migrate(db) {
  db.exec(`
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
