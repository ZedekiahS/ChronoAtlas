const migrationId = "032-assertion-claim-review-core";

export default function migrate(db, { log = () => {} } = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_systems (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      rules_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(rules_json)),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS time_spans (
      id TEXT PRIMARY KEY,
      calendar_system_id TEXT,
      original_expression TEXT NOT NULL,
      normalized_start TEXT,
      normalized_end TEXT,
      precision TEXT NOT NULL,
      certainty TEXT NOT NULL DEFAULT 'unknown',
      interpretation_note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (calendar_system_id) REFERENCES calendar_systems(id),
      CHECK (normalized_start IS NULL OR normalized_end IS NULL OR normalized_start <= normalized_end)
    );

    CREATE TABLE IF NOT EXISTS extraction_runs (
      id TEXT PRIMARY KEY,
      ingest_run_id TEXT NOT NULL,
      extractor_key TEXT NOT NULL,
      extractor_version TEXT NOT NULL,
      model_id TEXT,
      prompt_or_rules_sha256 TEXT NOT NULL CHECK (length(prompt_or_rules_sha256) = 64),
      parameters_sha256 TEXT NOT NULL CHECK (length(parameters_sha256) = 64),
      status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'committed', 'failed')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      error_text TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (ingest_run_id, extractor_key, extractor_version, prompt_or_rules_sha256, parameters_sha256),
      FOREIGN KEY (ingest_run_id) REFERENCES ingest_runs(id)
    );

    CREATE TABLE IF NOT EXISTS review_decisions (
      id TEXT PRIMARY KEY,
      object_type TEXT NOT NULL,
      object_id TEXT NOT NULL,
      decision_type TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('accept', 'accept_with_revision', 'reject', 'needs_revision', 'supersede')),
      reviewer_id TEXT NOT NULL,
      reviewer_kind TEXT NOT NULL CHECK (reviewer_kind IN ('human', 'system')),
      reason TEXT NOT NULL,
      policy_version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      supersedes_decision_id TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      FOREIGN KEY (supersedes_decision_id) REFERENCES review_decisions(id),
      CHECK (supersedes_decision_id IS NULL OR supersedes_decision_id <> id)
    );

    CREATE TABLE IF NOT EXISTS assertion_candidates (
      id TEXT PRIMARY KEY,
      extraction_run_id TEXT NOT NULL,
      narrating_work_id TEXT NOT NULL,
      assertion_mode TEXT NOT NULL CHECK (assertion_mode IN ('historical_report', 'authorial_judgment', 'quoted_report', 'scholarly_interpretation', 'reception_narrative')),
      predicate_key TEXT NOT NULL,
      proposed_statement TEXT NOT NULL,
      polarity TEXT NOT NULL CHECK (polarity IN ('positive', 'negative', 'mixed', 'unknown')),
      modality TEXT NOT NULL CHECK (modality IN ('asserted', 'reported', 'inferred', 'possible', 'counterfactual', 'unknown')),
      payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'accepted', 'rejected', 'needs_revision', 'superseded')),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      UNIQUE (extraction_run_id, payload_sha256),
      FOREIGN KEY (extraction_run_id) REFERENCES extraction_runs(id),
      FOREIGN KEY (narrating_work_id) REFERENCES source_works(id)
    );

    CREATE TABLE IF NOT EXISTS assertion_candidate_anchors (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      anchor_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('primary', 'context', 'quoted_source', 'editorial_basis')),
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (candidate_id, anchor_id, role),
      FOREIGN KEY (candidate_id) REFERENCES assertion_candidates(id),
      FOREIGN KEY (anchor_id) REFERENCES text_anchors(id)
    );

    CREATE TABLE IF NOT EXISTS source_assertions (
      id TEXT PRIMARY KEY,
      accepted_from_candidate_id TEXT NOT NULL UNIQUE,
      accepted_by_decision_id TEXT NOT NULL,
      narrating_work_id TEXT NOT NULL,
      assertion_mode TEXT NOT NULL CHECK (assertion_mode IN ('historical_report', 'authorial_judgment', 'quoted_report', 'scholarly_interpretation', 'reception_narrative')),
      predicate_key TEXT NOT NULL,
      statement TEXT NOT NULL,
      polarity TEXT NOT NULL CHECK (polarity IN ('positive', 'negative', 'mixed', 'unknown')),
      modality TEXT NOT NULL CHECK (modality IN ('asserted', 'reported', 'inferred', 'possible', 'counterfactual', 'unknown')),
      status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'superseded', 'withdrawn')),
      supersedes_assertion_id TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (accepted_from_candidate_id) REFERENCES assertion_candidates(id),
      FOREIGN KEY (accepted_by_decision_id) REFERENCES review_decisions(id),
      FOREIGN KEY (narrating_work_id) REFERENCES source_works(id),
      FOREIGN KEY (supersedes_assertion_id) REFERENCES source_assertions(id),
      CHECK (supersedes_assertion_id IS NULL OR supersedes_assertion_id <> id)
    );

    CREATE TABLE IF NOT EXISTS assertion_anchors (
      id TEXT PRIMARY KEY,
      assertion_id TEXT NOT NULL,
      anchor_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('primary', 'context', 'quoted_source', 'editorial_basis')),
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      decision_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (assertion_id, anchor_id, role),
      FOREIGN KEY (assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (anchor_id) REFERENCES text_anchors(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS assertion_entities (
      id TEXT PRIMARY KEY,
      assertion_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      role TEXT NOT NULL,
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (assertion_id, entity_id, role),
      FOREIGN KEY (assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (entity_id) REFERENCES entities(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS assertion_times (
      id TEXT PRIMARY KEY,
      assertion_id TEXT NOT NULL,
      time_span_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'occurrence',
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (assertion_id, time_span_id, role),
      FOREIGN KEY (assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (time_span_id) REFERENCES time_spans(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS assertion_places (
      id TEXT PRIMARY KEY,
      assertion_id TEXT NOT NULL,
      place_entity_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'occurrence',
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (assertion_id, place_entity_id, role),
      FOREIGN KEY (assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (place_entity_id) REFERENCES entities(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS assertion_relations (
      id TEXT PRIMARY KEY,
      from_assertion_id TEXT NOT NULL,
      to_assertion_id TEXT NOT NULL,
      relation_type TEXT NOT NULL CHECK (relation_type IN ('restates', 'quotes', 'depends_on', 'supports', 'conflicts', 'qualifies')),
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (from_assertion_id, to_assertion_id, relation_type),
      FOREIGN KEY (from_assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (to_assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id),
      CHECK (from_assertion_id <> to_assertion_id)
    );

    CREATE TABLE IF NOT EXISTS transmission_groups (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      basis_note TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'accepted', 'rejected', 'superseded')),
      accepted_by_decision_id TEXT,
      supersedes_group_id TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (accepted_by_decision_id) REFERENCES review_decisions(id),
      FOREIGN KEY (supersedes_group_id) REFERENCES transmission_groups(id),
      CHECK (supersedes_group_id IS NULL OR supersedes_group_id <> id),
      CHECK ((review_status = 'accepted' AND accepted_by_decision_id IS NOT NULL) OR review_status <> 'accepted')
    );

    CREATE TABLE IF NOT EXISTS claim_candidates (
      id TEXT PRIMARY KEY,
      generator_key TEXT NOT NULL,
      generator_version TEXT NOT NULL,
      claim_domain TEXT NOT NULL CHECK (claim_domain IN ('historical_occurrence', 'scholarly_interpretation', 'textual_history', 'reception_history')),
      claim_type TEXT NOT NULL,
      proposed_predicate TEXT NOT NULL,
      proposed_statement TEXT NOT NULL,
      proposed_polarity TEXT NOT NULL CHECK (proposed_polarity IN ('positive', 'negative', 'mixed', 'unknown')),
      proposed_modality TEXT NOT NULL CHECK (proposed_modality IN ('asserted', 'reported', 'inferred', 'possible', 'counterfactual', 'unknown')),
      match_claim_id TEXT,
      payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'accepted', 'rejected', 'needs_revision', 'superseded')),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      UNIQUE (generator_key, generator_version, payload_sha256),
      FOREIGN KEY (match_claim_id) REFERENCES claims(id)
    );

    CREATE TABLE IF NOT EXISTS claim_candidate_assertions (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      assertion_id TEXT NOT NULL,
      proposed_stance TEXT NOT NULL CHECK (proposed_stance IN ('supports', 'conflicts', 'qualifies', 'context')),
      proposed_directness TEXT NOT NULL CHECK (proposed_directness IN ('direct', 'derived', 'restatement', 'quoted')),
      proposed_transmission_group_id TEXT,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (candidate_id, assertion_id),
      FOREIGN KEY (candidate_id) REFERENCES claim_candidates(id),
      FOREIGN KEY (assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (proposed_transmission_group_id) REFERENCES transmission_groups(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      accepted_from_candidate_id TEXT NOT NULL UNIQUE,
      accepted_by_decision_id TEXT NOT NULL,
      claim_domain TEXT NOT NULL CHECK (claim_domain IN ('historical_occurrence', 'scholarly_interpretation', 'textual_history', 'reception_history')),
      claim_type TEXT NOT NULL,
      predicate_key TEXT NOT NULL,
      statement TEXT NOT NULL,
      polarity TEXT NOT NULL CHECK (polarity IN ('positive', 'negative', 'mixed', 'unknown')),
      modality TEXT NOT NULL CHECK (modality IN ('asserted', 'reported', 'inferred', 'possible', 'counterfactual', 'unknown')),
      status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'superseded', 'withdrawn')),
      supersedes_claim_id TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (accepted_from_candidate_id) REFERENCES claim_candidates(id),
      FOREIGN KEY (accepted_by_decision_id) REFERENCES review_decisions(id),
      FOREIGN KEY (supersedes_claim_id) REFERENCES claims(id),
      CHECK (supersedes_claim_id IS NULL OR supersedes_claim_id <> id)
    );

    CREATE TABLE IF NOT EXISTS claim_assertions (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      assertion_id TEXT NOT NULL,
      stance TEXT NOT NULL CHECK (stance IN ('supports', 'conflicts', 'qualifies', 'context')),
      directness TEXT NOT NULL CHECK (directness IN ('direct', 'derived', 'restatement', 'quoted')),
      transmission_group_id TEXT NOT NULL,
      assessment_status TEXT NOT NULL DEFAULT 'accepted' CHECK (assessment_status IN ('accepted', 'contested', 'superseded')),
      assessment_note TEXT,
      decision_id TEXT NOT NULL,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (claim_id, assertion_id),
      FOREIGN KEY (claim_id) REFERENCES claims(id),
      FOREIGN KEY (assertion_id) REFERENCES source_assertions(id),
      FOREIGN KEY (transmission_group_id) REFERENCES transmission_groups(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS claim_entities (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      role TEXT NOT NULL,
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (claim_id, entity_id, role),
      FOREIGN KEY (claim_id) REFERENCES claims(id),
      FOREIGN KEY (entity_id) REFERENCES entities(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS claim_times (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      time_span_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'occurrence',
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (claim_id, time_span_id, role),
      FOREIGN KEY (claim_id) REFERENCES claims(id),
      FOREIGN KEY (time_span_id) REFERENCES time_spans(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS claim_places (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      place_entity_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'occurrence',
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (claim_id, place_entity_id, role),
      FOREIGN KEY (claim_id) REFERENCES claims(id),
      FOREIGN KEY (place_entity_id) REFERENCES entities(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS claim_relations (
      id TEXT PRIMARY KEY,
      from_claim_id TEXT NOT NULL,
      to_claim_id TEXT NOT NULL,
      relation_type TEXT NOT NULL CHECK (relation_type IN ('supports', 'conflicts', 'qualifies', 'depends_on', 'broader_than', 'narrower_than')),
      certainty TEXT NOT NULL DEFAULT 'unknown',
      decision_id TEXT NOT NULL,
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (from_claim_id, to_claim_id, relation_type),
      FOREIGN KEY (from_claim_id) REFERENCES claims(id),
      FOREIGN KEY (to_claim_id) REFERENCES claims(id),
      FOREIGN KEY (decision_id) REFERENCES review_decisions(id),
      CHECK (from_claim_id <> to_claim_id)
    );

    CREATE INDEX IF NOT EXISTS idx_extraction_runs_ingest ON extraction_runs(ingest_run_id, status);
    CREATE INDEX IF NOT EXISTS idx_assertion_candidates_status ON assertion_candidates(status, extraction_run_id);
    CREATE INDEX IF NOT EXISTS idx_assertion_candidate_anchors_anchor ON assertion_candidate_anchors(anchor_id);
    CREATE INDEX IF NOT EXISTS idx_source_assertions_work ON source_assertions(narrating_work_id, status);
    CREATE INDEX IF NOT EXISTS idx_assertion_anchors_anchor ON assertion_anchors(anchor_id);
    CREATE INDEX IF NOT EXISTS idx_review_decisions_object ON review_decisions(object_type, object_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_transmission_groups_status ON transmission_groups(review_status);
    CREATE INDEX IF NOT EXISTS idx_claim_candidates_status ON claim_candidates(status);
    CREATE INDEX IF NOT EXISTS idx_claims_domain_status ON claims(claim_domain, status);
    CREATE INDEX IF NOT EXISTS idx_claim_assertions_claim ON claim_assertions(claim_id, stance, transmission_group_id);

    CREATE TRIGGER IF NOT EXISTS trg_review_decisions_immutable
    BEFORE UPDATE ON review_decisions
    BEGIN
      SELECT RAISE(ABORT, 'review decisions are append-only');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_review_decisions_no_delete
    BEFORE DELETE ON review_decisions
    BEGIN
      SELECT RAISE(ABORT, 'review decisions cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_assertion_candidates_semantic_immutable
    BEFORE UPDATE OF extraction_run_id, narrating_work_id, assertion_mode, predicate_key, proposed_statement, polarity, modality, payload_sha256 ON assertion_candidates
    BEGIN
      SELECT RAISE(ABORT, 'assertion candidate semantics are immutable; create a new candidate');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_assertion_candidates_no_delete
    BEFORE DELETE ON assertion_candidates
    BEGIN
      SELECT RAISE(ABORT, 'assertion candidates cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_source_assertions_require_human_decision
    BEFORE INSERT ON source_assertions
    WHEN NOT EXISTS (
      SELECT 1
      FROM review_decisions decision
      WHERE decision.id = NEW.accepted_by_decision_id
        AND decision.object_type = 'assertion_candidate'
        AND decision.object_id = NEW.accepted_from_candidate_id
        AND decision.decision_type = 'assertion_review'
        AND decision.outcome IN ('accept', 'accept_with_revision')
        AND decision.reviewer_kind = 'human'
    )
    BEGIN
      SELECT RAISE(ABORT, 'accepted assertion requires a matching human review decision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_source_assertions_mark_candidate
    AFTER INSERT ON source_assertions
    BEGIN
      UPDATE assertion_candidates SET status = 'accepted' WHERE id = NEW.accepted_from_candidate_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_assertion_candidate_status_gate
    BEFORE UPDATE OF status ON assertion_candidates
    WHEN NEW.status <> OLD.status AND NOT (
      (NEW.status = 'accepted' AND EXISTS (
        SELECT 1 FROM source_assertions assertion
        WHERE assertion.accepted_from_candidate_id = NEW.id
      ))
      OR (NEW.status = 'rejected' AND EXISTS (
        SELECT 1 FROM review_decisions decision
        WHERE decision.object_type = 'assertion_candidate'
          AND decision.object_id = NEW.id
          AND decision.decision_type = 'assertion_review'
          AND decision.outcome = 'reject'
          AND decision.reviewer_kind = 'human'
      ))
      OR (NEW.status = 'needs_revision' AND EXISTS (
        SELECT 1 FROM review_decisions decision
        WHERE decision.object_type = 'assertion_candidate'
          AND decision.object_id = NEW.id
          AND decision.decision_type = 'assertion_review'
          AND decision.outcome = 'needs_revision'
          AND decision.reviewer_kind = 'human'
      ))
      OR NEW.status = 'superseded'
    )
    BEGIN
      SELECT RAISE(ABORT, 'assertion candidate status requires a matching reviewed object');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_source_assertions_immutable
    BEFORE UPDATE ON source_assertions
    BEGIN
      SELECT RAISE(ABORT, 'source assertions are immutable; supersede with a new assertion');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_source_assertions_no_delete
    BEFORE DELETE ON source_assertions
    BEGIN
      SELECT RAISE(ABORT, 'source assertions cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_rejected_assertion_candidate_status
    AFTER INSERT ON review_decisions
    WHEN NEW.object_type = 'assertion_candidate' AND NEW.decision_type = 'assertion_review'
      AND NEW.outcome = 'reject' AND NEW.reviewer_kind = 'human'
    BEGIN
      UPDATE assertion_candidates SET status = 'rejected' WHERE id = NEW.object_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_revision_assertion_candidate_status
    AFTER INSERT ON review_decisions
    WHEN NEW.object_type = 'assertion_candidate' AND NEW.decision_type = 'assertion_review'
      AND NEW.outcome = 'needs_revision' AND NEW.reviewer_kind = 'human'
    BEGIN
      UPDATE assertion_candidates SET status = 'needs_revision' WHERE id = NEW.object_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_transmission_group_require_human_decision
    BEFORE INSERT ON transmission_groups
    WHEN NEW.review_status = 'accepted' AND NOT EXISTS (
      SELECT 1
      FROM review_decisions decision
      WHERE decision.id = NEW.accepted_by_decision_id
        AND decision.object_type = 'transmission_group'
        AND decision.object_id = NEW.id
        AND decision.decision_type = 'transmission_review'
        AND decision.outcome IN ('accept', 'accept_with_revision')
        AND decision.reviewer_kind = 'human'
    )
    BEGIN
      SELECT RAISE(ABORT, 'accepted transmission group requires a matching human review decision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_transmission_group_update_require_human_decision
    BEFORE UPDATE OF review_status, accepted_by_decision_id ON transmission_groups
    WHEN NEW.review_status = 'accepted' AND NOT EXISTS (
      SELECT 1
      FROM review_decisions decision
      WHERE decision.id = NEW.accepted_by_decision_id
        AND decision.object_type = 'transmission_group'
        AND decision.object_id = NEW.id
        AND decision.decision_type = 'transmission_review'
        AND decision.outcome IN ('accept', 'accept_with_revision')
        AND decision.reviewer_kind = 'human'
    )
    BEGIN
      SELECT RAISE(ABORT, 'accepted transmission group requires a matching human review decision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_candidates_semantic_immutable
    BEFORE UPDATE OF generator_key, generator_version, claim_domain, claim_type, proposed_predicate, proposed_statement, proposed_polarity, proposed_modality, match_claim_id, payload_sha256 ON claim_candidates
    BEGIN
      SELECT RAISE(ABORT, 'claim candidate semantics are immutable; create a new candidate');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_candidates_no_delete
    BEFORE DELETE ON claim_candidates
    BEGIN
      SELECT RAISE(ABORT, 'claim candidates cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claims_require_human_decision
    BEFORE INSERT ON claims
    WHEN NOT EXISTS (
      SELECT 1
      FROM review_decisions decision
      WHERE decision.id = NEW.accepted_by_decision_id
        AND decision.object_type = 'claim_candidate'
        AND decision.object_id = NEW.accepted_from_candidate_id
        AND decision.decision_type = 'claim_review'
        AND decision.outcome IN ('accept', 'accept_with_revision')
        AND decision.reviewer_kind = 'human'
    )
    BEGIN
      SELECT RAISE(ABORT, 'accepted claim requires a matching human review decision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claims_mark_candidate
    AFTER INSERT ON claims
    BEGIN
      UPDATE claim_candidates SET status = 'accepted' WHERE id = NEW.accepted_from_candidate_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_candidate_status_gate
    BEFORE UPDATE OF status ON claim_candidates
    WHEN NEW.status <> OLD.status AND NOT (
      (NEW.status = 'accepted' AND EXISTS (
        SELECT 1 FROM claims claim WHERE claim.accepted_from_candidate_id = NEW.id
      ))
      OR (NEW.status = 'rejected' AND EXISTS (
        SELECT 1 FROM review_decisions decision
        WHERE decision.object_type = 'claim_candidate'
          AND decision.object_id = NEW.id
          AND decision.decision_type = 'claim_review'
          AND decision.outcome = 'reject'
          AND decision.reviewer_kind = 'human'
      ))
      OR (NEW.status = 'needs_revision' AND EXISTS (
        SELECT 1 FROM review_decisions decision
        WHERE decision.object_type = 'claim_candidate'
          AND decision.object_id = NEW.id
          AND decision.decision_type = 'claim_review'
          AND decision.outcome = 'needs_revision'
          AND decision.reviewer_kind = 'human'
      ))
      OR NEW.status = 'superseded'
    )
    BEGIN
      SELECT RAISE(ABORT, 'claim candidate status requires a matching reviewed object');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claims_immutable
    BEFORE UPDATE ON claims
    BEGIN
      SELECT RAISE(ABORT, 'claims are immutable; supersede with a new claim');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claims_no_delete
    BEFORE DELETE ON claims
    BEGIN
      SELECT RAISE(ABORT, 'claims cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_rejected_claim_candidate_status
    AFTER INSERT ON review_decisions
    WHEN NEW.object_type = 'claim_candidate' AND NEW.decision_type = 'claim_review'
      AND NEW.outcome = 'reject' AND NEW.reviewer_kind = 'human'
    BEGIN
      UPDATE claim_candidates SET status = 'rejected' WHERE id = NEW.object_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_revision_claim_candidate_status
    AFTER INSERT ON review_decisions
    WHEN NEW.object_type = 'claim_candidate' AND NEW.decision_type = 'claim_review'
      AND NEW.outcome = 'needs_revision' AND NEW.reviewer_kind = 'human'
    BEGIN
      UPDATE claim_candidates SET status = 'needs_revision' WHERE id = NEW.object_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_assertions_require_accepted_group
    BEFORE INSERT ON claim_assertions
    WHEN NOT EXISTS (
      SELECT 1 FROM transmission_groups transmission
      WHERE transmission.id = NEW.transmission_group_id
        AND transmission.review_status = 'accepted'
    )
    BEGIN
      SELECT RAISE(ABORT, 'claim assertion requires an accepted transmission group');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_assertions_require_human_decision
    BEFORE INSERT ON claim_assertions
    WHEN NOT EXISTS (
      SELECT 1 FROM review_decisions decision
      JOIN claims claim ON claim.id = NEW.claim_id
      WHERE decision.id = NEW.decision_id
        AND decision.object_type = 'claim_candidate'
        AND decision.object_id = claim.accepted_from_candidate_id
        AND decision.decision_type = 'claim_review'
        AND decision.outcome IN ('accept', 'accept_with_revision')
        AND decision.reviewer_kind = 'human'
    )
    BEGIN
      SELECT RAISE(ABORT, 'claim assertion assessment requires a human review decision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_assertions_immutable
    BEFORE UPDATE ON claim_assertions
    BEGIN
      SELECT RAISE(ABORT, 'claim assertion assessments are immutable; create a superseding claim');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_assertions_no_delete
    BEFORE DELETE ON claim_assertions
    BEGIN
      SELECT RAISE(ABORT, 'claim assertion assessments cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_assertion_anchors_decision_match
    BEFORE INSERT ON assertion_anchors
    WHEN NOT EXISTS (
      SELECT 1 FROM source_assertions assertion
      WHERE assertion.id = NEW.assertion_id
        AND assertion.accepted_by_decision_id = NEW.decision_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'assertion anchor must use the assertion acceptance decision');
    END;
  `);

  log(`${migrationId}: assertion, claim, transmission, and human-review gates ready`);
}
