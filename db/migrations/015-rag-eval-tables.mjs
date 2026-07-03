export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rag_eval_questions (
      id TEXT PRIMARY KEY,
      question_set_id TEXT NOT NULL,
      period_id TEXT,
      region_id TEXT,
      question_zh TEXT NOT NULL,
      question_en TEXT,
      question_type TEXT NOT NULL,
      expected_subject_table TEXT,
      expected_subject_id TEXT,
      expected_claim_ids_json TEXT NOT NULL DEFAULT '[]',
      expected_source_ids_json TEXT NOT NULL DEFAULT '[]',
      difficulty TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (period_id) REFERENCES periods(id),
      FOREIGN KEY (region_id) REFERENCES regions(id)
    );

    CREATE TABLE IF NOT EXISTS rag_eval_runs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      retrieval_strategy TEXT NOT NULL,
      question_set_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS rag_eval_results (
      run_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer_id TEXT,
      retrieval_run_id TEXT,
      score_total REAL,
      score_retrieval REAL,
      score_citation REAL,
      score_factuality REAL,
      score_coverage REAL,
      score_no_hallucination REAL,
      failure_type TEXT,
      judge_note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (run_id, question_id),
      FOREIGN KEY (run_id) REFERENCES rag_eval_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES rag_eval_questions(id) ON DELETE CASCADE,
      FOREIGN KEY (answer_id) REFERENCES ai_answers(id),
      FOREIGN KEY (retrieval_run_id) REFERENCES ai_retrieval_runs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rag_eval_questions_set
      ON rag_eval_questions(question_set_id, period_id, region_id, question_type);
    CREATE INDEX IF NOT EXISTS idx_rag_eval_questions_subject
      ON rag_eval_questions(expected_subject_table, expected_subject_id);
    CREATE INDEX IF NOT EXISTS idx_rag_eval_runs_created
      ON rag_eval_runs(created_at);
  `);
}
