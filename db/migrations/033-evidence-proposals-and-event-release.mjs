const migrationId = "033-evidence-proposals-and-event-release";

export default function migrate(db, { log = () => {} } = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transmission_group_candidates (
      id TEXT PRIMARY KEY,
      proposal_set_id TEXT NOT NULL,
      candidate_key TEXT NOT NULL,
      label TEXT NOT NULL,
      proposed_assessment TEXT NOT NULL CHECK (proposed_assessment IN (
        'same_work_parallel', 'likely_restatement', 'likely_shared_source',
        'quoted_transmission', 'independence_uncertain'
      )),
      basis_note TEXT NOT NULL,
      payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'accepted', 'rejected', 'needs_revision', 'superseded'
      )),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      UNIQUE (proposal_set_id, candidate_key),
      UNIQUE (proposal_set_id, payload_sha256)
    );

    CREATE TABLE IF NOT EXISTS transmission_group_candidate_members (
      id TEXT PRIMARY KEY,
      transmission_group_candidate_id TEXT NOT NULL,
      assertion_candidate_id TEXT NOT NULL,
      proposed_role TEXT NOT NULL CHECK (proposed_role IN (
        'earlier_witness', 'parallel_passage', 'restatement', 'quotation',
        'dependent_synthesis', 'uncertain'
      )),
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (transmission_group_candidate_id, assertion_candidate_id),
      FOREIGN KEY (transmission_group_candidate_id) REFERENCES transmission_group_candidates(id),
      FOREIGN KEY (assertion_candidate_id) REFERENCES assertion_candidates(id)
    );

    CREATE TABLE IF NOT EXISTS claim_candidate_source_candidates (
      id TEXT PRIMARY KEY,
      claim_candidate_id TEXT NOT NULL,
      assertion_candidate_id TEXT NOT NULL,
      proposed_stance TEXT NOT NULL CHECK (proposed_stance IN (
        'supports', 'contradicts', 'qualifies', 'contextualizes', 'mentions'
      )),
      proposed_directness TEXT NOT NULL CHECK (proposed_directness IN (
        'direct', 'near_contemporary', 'later_restatement', 'quoted_fragment',
        'authorial_judgment', 'geographic_context', 'uncertain'
      )),
      transmission_group_candidate_id TEXT,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (claim_candidate_id, assertion_candidate_id),
      FOREIGN KEY (claim_candidate_id) REFERENCES claim_candidates(id),
      FOREIGN KEY (assertion_candidate_id) REFERENCES assertion_candidates(id),
      FOREIGN KEY (transmission_group_candidate_id) REFERENCES transmission_group_candidates(id)
    );

    CREATE TABLE IF NOT EXISTS event_collection_candidates (
      id TEXT PRIMARY KEY,
      proposal_set_id TEXT NOT NULL,
      candidate_key TEXT NOT NULL,
      proposed_label TEXT NOT NULL,
      proposed_summary TEXT NOT NULL,
      collection_kind TEXT NOT NULL CHECK (collection_kind IN (
        'event_cluster', 'campaign', 'war', 'reign', 'topic_dossier'
      )),
      time_expression TEXT,
      boundary_certainty TEXT NOT NULL CHECK (boundary_certainty IN (
        'exact', 'bounded', 'approximate', 'contested', 'open'
      )),
      payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'accepted', 'rejected', 'needs_revision', 'superseded'
      )),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      UNIQUE (proposal_set_id, candidate_key),
      UNIQUE (proposal_set_id, payload_sha256)
    );

    CREATE TABLE IF NOT EXISTS event_candidates_v2 (
      id TEXT PRIMARY KEY,
      proposal_set_id TEXT NOT NULL,
      collection_candidate_id TEXT,
      candidate_key TEXT NOT NULL,
      proposed_label TEXT NOT NULL,
      proposed_summary TEXT NOT NULL,
      event_kind TEXT NOT NULL CHECK (event_kind IN (
        'background', 'phase', 'subevent', 'aftermath', 'long_term_impact'
      )),
      time_expression TEXT,
      place_expression TEXT,
      boundary_certainty TEXT NOT NULL CHECK (boundary_certainty IN (
        'exact', 'bounded', 'approximate', 'contested', 'open'
      )),
      boundary_note TEXT,
      display_ordinal INTEGER NOT NULL CHECK (display_ordinal >= 0),
      payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'accepted', 'rejected', 'needs_revision', 'superseded'
      )),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      UNIQUE (proposal_set_id, candidate_key),
      UNIQUE (proposal_set_id, payload_sha256),
      FOREIGN KEY (collection_candidate_id) REFERENCES event_collection_candidates(id)
    );

    CREATE TABLE IF NOT EXISTS event_candidate_claim_candidates (
      id TEXT PRIMARY KEY,
      event_candidate_id TEXT NOT NULL,
      claim_candidate_id TEXT NOT NULL,
      relation_role TEXT NOT NULL CHECK (relation_role IN (
        'core', 'cause', 'context', 'result', 'chronology', 'location', 'contested'
      )),
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (event_candidate_id, claim_candidate_id, relation_role),
      FOREIGN KEY (event_candidate_id) REFERENCES event_candidates_v2(id),
      FOREIGN KEY (claim_candidate_id) REFERENCES claim_candidates(id)
    );

    CREATE TABLE IF NOT EXISTS event_records_v2 (
      id TEXT PRIMARY KEY,
      canonical_key TEXT NOT NULL UNIQUE,
      event_kind TEXT NOT NULL CHECK (event_kind IN (
        'background', 'phase', 'subevent', 'aftermath', 'long_term_impact'
      )),
      legacy_event_id TEXT,
      created_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json))
    );

    CREATE TABLE IF NOT EXISTS event_revisions_v2 (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      revision_no INTEGER NOT NULL CHECK (revision_no > 0),
      accepted_from_candidate_id TEXT,
      accepted_by_decision_id TEXT,
      label TEXT NOT NULL,
      summary TEXT NOT NULL,
      time_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(time_json)),
      place_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(place_json)),
      boundary_note TEXT,
      status TEXT NOT NULL CHECK (status IN ('draft', 'accepted', 'superseded')),
      created_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (event_id, revision_no),
      FOREIGN KEY (event_id) REFERENCES event_records_v2(id),
      FOREIGN KEY (accepted_from_candidate_id) REFERENCES event_candidates_v2(id),
      FOREIGN KEY (accepted_by_decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS event_revision_claims_v2 (
      id TEXT PRIMARY KEY,
      event_revision_id TEXT NOT NULL,
      claim_id TEXT NOT NULL,
      relation_role TEXT NOT NULL CHECK (relation_role IN (
        'core', 'cause', 'context', 'result', 'chronology', 'location', 'contested'
      )),
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (event_revision_id, claim_id, relation_role),
      FOREIGN KEY (event_revision_id) REFERENCES event_revisions_v2(id),
      FOREIGN KEY (claim_id) REFERENCES claims(id)
    );

    CREATE TABLE IF NOT EXISTS event_collection_records_v2 (
      id TEXT PRIMARY KEY,
      canonical_key TEXT NOT NULL UNIQUE,
      collection_kind TEXT NOT NULL CHECK (collection_kind IN (
        'event_cluster', 'campaign', 'war', 'reign', 'topic_dossier'
      )),
      created_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json))
    );

    CREATE TABLE IF NOT EXISTS event_collection_revisions_v2 (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      revision_no INTEGER NOT NULL CHECK (revision_no > 0),
      accepted_from_candidate_id TEXT,
      accepted_by_decision_id TEXT,
      label TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'accepted', 'superseded')),
      created_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (collection_id, revision_no),
      FOREIGN KEY (collection_id) REFERENCES event_collection_records_v2(id),
      FOREIGN KEY (accepted_from_candidate_id) REFERENCES event_collection_candidates(id),
      FOREIGN KEY (accepted_by_decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS event_collection_revision_members_v2 (
      id TEXT PRIMARY KEY,
      collection_revision_id TEXT NOT NULL,
      event_revision_id TEXT NOT NULL,
      member_role TEXT NOT NULL CHECK (member_role IN (
        'background', 'phase', 'core', 'aftermath', 'long_term_impact'
      )),
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (collection_revision_id, event_revision_id),
      FOREIGN KEY (collection_revision_id) REFERENCES event_collection_revisions_v2(id),
      FOREIGN KEY (event_revision_id) REFERENCES event_revisions_v2(id)
    );

    CREATE TABLE IF NOT EXISTS content_releases_v2 (
      id TEXT PRIMARY KEY,
      release_key TEXT NOT NULL,
      release_version INTEGER NOT NULL CHECK (release_version > 0),
      status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'withdrawn')),
      accepted_by_decision_id TEXT,
      created_at TEXT NOT NULL,
      published_at TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (release_key, release_version),
      FOREIGN KEY (accepted_by_decision_id) REFERENCES review_decisions(id)
    );

    CREATE TABLE IF NOT EXISTS content_release_items_v2 (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('event_revision', 'event_collection_revision')),
      item_id TEXT NOT NULL,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (release_id, item_type, item_id),
      FOREIGN KEY (release_id) REFERENCES content_releases_v2(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transmission_group_candidates_status
      ON transmission_group_candidates(status, proposal_set_id);
    CREATE INDEX IF NOT EXISTS idx_claim_candidate_source_candidates_claim
      ON claim_candidate_source_candidates(claim_candidate_id, ordinal);
    CREATE INDEX IF NOT EXISTS idx_event_candidates_v2_status
      ON event_candidates_v2(status, proposal_set_id, display_ordinal);
    CREATE INDEX IF NOT EXISTS idx_event_revisions_v2_event
      ON event_revisions_v2(event_id, revision_no DESC);

    CREATE TRIGGER IF NOT EXISTS trg_transmission_group_candidates_immutable
    BEFORE UPDATE ON transmission_group_candidates
    BEGIN
      SELECT RAISE(ABORT, 'transmission group candidates are immutable; create a superseding candidate');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_transmission_group_candidates_no_delete
    BEFORE DELETE ON transmission_group_candidates
    BEGIN
      SELECT RAISE(ABORT, 'transmission group candidates cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_transmission_group_candidate_members_immutable
    BEFORE UPDATE ON transmission_group_candidate_members
    BEGIN
      SELECT RAISE(ABORT, 'transmission candidate membership is immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_transmission_group_candidate_members_no_delete
    BEFORE DELETE ON transmission_group_candidate_members
    BEGIN
      SELECT RAISE(ABORT, 'transmission candidate membership cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_candidate_source_candidates_immutable
    BEFORE UPDATE ON claim_candidate_source_candidates
    BEGIN
      SELECT RAISE(ABORT, 'claim-to-source-candidate links are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_claim_candidate_source_candidates_no_delete
    BEFORE DELETE ON claim_candidate_source_candidates
    BEGIN
      SELECT RAISE(ABORT, 'claim-to-source-candidate links cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_collection_candidates_immutable
    BEFORE UPDATE ON event_collection_candidates
    BEGIN
      SELECT RAISE(ABORT, 'event collection candidates are immutable; create a superseding candidate');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_collection_candidates_no_delete
    BEFORE DELETE ON event_collection_candidates
    BEGIN
      SELECT RAISE(ABORT, 'event collection candidates cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_candidates_v2_immutable
    BEFORE UPDATE ON event_candidates_v2
    BEGIN
      SELECT RAISE(ABORT, 'event candidates are immutable; create a superseding candidate');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_candidates_v2_no_delete
    BEFORE DELETE ON event_candidates_v2
    BEGIN
      SELECT RAISE(ABORT, 'event candidates cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_candidate_claim_candidates_immutable
    BEFORE UPDATE ON event_candidate_claim_candidates
    BEGIN
      SELECT RAISE(ABORT, 'event candidate claim links are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_candidate_claim_candidates_no_delete
    BEFORE DELETE ON event_candidate_claim_candidates
    BEGIN
      SELECT RAISE(ABORT, 'event candidate claim links cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_revision_acceptance_gate
    BEFORE INSERT ON event_revisions_v2
    WHEN NEW.status = 'accepted' AND NOT EXISTS (
      SELECT 1 FROM review_decisions decision
      WHERE decision.id = NEW.accepted_by_decision_id
        AND decision.object_type = 'event_revision'
        AND decision.object_id = NEW.id
        AND decision.decision_type = 'event_review'
        AND decision.outcome IN ('accept', 'accept_with_revision')
        AND decision.reviewer_kind = 'human'
    )
    BEGIN
      SELECT RAISE(ABORT, 'accepted event revision requires a matching human review decision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_revisions_v2_immutable
    BEFORE UPDATE ON event_revisions_v2
    BEGIN
      SELECT RAISE(ABORT, 'event revisions are immutable; create a new revision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_revisions_v2_no_delete
    BEFORE DELETE ON event_revisions_v2
    BEGIN
      SELECT RAISE(ABORT, 'event revisions cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_revision_claims_v2_gate
    BEFORE INSERT ON event_revision_claims_v2
    WHEN NOT EXISTS (
      SELECT 1 FROM event_revisions_v2 revision
      JOIN claims claim ON claim.id = NEW.claim_id
      WHERE revision.id = NEW.event_revision_id
        AND revision.status = 'accepted'
        AND claim.status = 'accepted'
    )
    BEGIN
      SELECT RAISE(ABORT, 'formal event evidence requires an accepted event revision and accepted claim');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_revision_claims_v2_immutable
    BEFORE UPDATE ON event_revision_claims_v2
    BEGIN
      SELECT RAISE(ABORT, 'event revision claim links are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_event_revision_claims_v2_no_delete
    BEFORE DELETE ON event_revision_claims_v2
    BEGIN
      SELECT RAISE(ABORT, 'event revision claim links cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_collection_revision_acceptance_gate
    BEFORE INSERT ON event_collection_revisions_v2
    WHEN NEW.status = 'accepted' AND NOT EXISTS (
      SELECT 1 FROM review_decisions decision
      WHERE decision.id = NEW.accepted_by_decision_id
        AND decision.object_type = 'event_collection_revision'
        AND decision.object_id = NEW.id
        AND decision.decision_type = 'event_collection_review'
        AND decision.outcome IN ('accept', 'accept_with_revision')
        AND decision.reviewer_kind = 'human'
    )
    BEGIN
      SELECT RAISE(ABORT, 'accepted event collection revision requires a matching human review decision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_collection_revisions_v2_immutable
    BEFORE UPDATE ON event_collection_revisions_v2
    BEGIN
      SELECT RAISE(ABORT, 'event collection revisions are immutable; create a new revision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_collection_revisions_v2_no_delete
    BEFORE DELETE ON event_collection_revisions_v2
    BEGIN
      SELECT RAISE(ABORT, 'event collection revisions cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_collection_members_v2_gate
    BEFORE INSERT ON event_collection_revision_members_v2
    WHEN NOT EXISTS (
      SELECT 1 FROM event_collection_revisions_v2 collection_revision
      JOIN event_revisions_v2 event_revision ON event_revision.id = NEW.event_revision_id
      WHERE collection_revision.id = NEW.collection_revision_id
        AND collection_revision.status = 'accepted'
        AND event_revision.status = 'accepted'
    )
    BEGIN
      SELECT RAISE(ABORT, 'formal collection membership requires accepted collection and event revisions');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_collection_members_v2_immutable
    BEFORE UPDATE ON event_collection_revision_members_v2
    BEGIN
      SELECT RAISE(ABORT, 'event collection membership is immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_collection_members_v2_no_delete
    BEFORE DELETE ON event_collection_revision_members_v2
    BEGIN
      SELECT RAISE(ABORT, 'event collection membership cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_release_items_draft_only
    BEFORE INSERT ON content_release_items_v2
    WHEN NOT EXISTS (
      SELECT 1 FROM content_releases_v2 release
      WHERE release.id = NEW.release_id AND release.status = 'draft'
    )
    BEGIN
      SELECT RAISE(ABORT, 'release items can only be added while the release is draft');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_release_items_immutable
    BEFORE UPDATE ON content_release_items_v2
    BEGIN
      SELECT RAISE(ABORT, 'release items are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_release_items_no_delete
    BEFORE DELETE ON content_release_items_v2
    BEGIN
      SELECT RAISE(ABORT, 'release items cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_release_publish_gate
    BEFORE UPDATE OF status ON content_releases_v2
    WHEN NEW.status = 'published' AND (
      NOT EXISTS (
        SELECT 1 FROM review_decisions decision
        WHERE decision.id = NEW.accepted_by_decision_id
          AND decision.object_type = 'content_release'
          AND decision.object_id = NEW.id
          AND decision.decision_type = 'publication_review'
          AND decision.outcome IN ('accept', 'accept_with_revision')
          AND decision.reviewer_kind = 'human'
      )
      OR NOT EXISTS (
        SELECT 1 FROM content_release_items_v2 item WHERE item.release_id = NEW.id
      )
      OR EXISTS (
        SELECT 1
        FROM content_release_items_v2 item
        LEFT JOIN event_revisions_v2 event_revision
          ON item.item_type = 'event_revision' AND event_revision.id = item.item_id
        LEFT JOIN event_collection_revisions_v2 collection_revision
          ON item.item_type = 'event_collection_revision' AND collection_revision.id = item.item_id
        WHERE item.release_id = NEW.id
          AND ((item.item_type = 'event_revision' AND COALESCE(event_revision.status, '') <> 'accepted')
            OR (item.item_type = 'event_collection_revision' AND COALESCE(collection_revision.status, '') <> 'accepted'))
      )
      OR EXISTS (
        SELECT 1
        FROM content_release_items_v2 item
        WHERE item.release_id = NEW.id
          AND ((item.item_type = 'event_revision' AND NOT EXISTS (
            SELECT 1 FROM event_revision_claims_v2 evidence
            WHERE evidence.event_revision_id = item.item_id
          )) OR (item.item_type = 'event_collection_revision' AND NOT EXISTS (
            SELECT 1 FROM event_collection_revision_members_v2 member
            WHERE member.collection_revision_id = item.item_id
          )))
      )
    )
    BEGIN
      SELECT RAISE(ABORT, 'publication requires human approval and only accepted immutable revisions');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_release_semantic_immutable
    BEFORE UPDATE OF release_key, release_version, created_at, raw_json ON content_releases_v2
    BEGIN
      SELECT RAISE(ABORT, 'release identity and payload are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_release_no_delete
    BEFORE DELETE ON content_releases_v2
    BEGIN
      SELECT RAISE(ABORT, 'content releases cannot be deleted');
    END;
  `);

  log(`${migrationId}: proposal, immutable event revision, collection, and publication gates ready`);
}
