const migrationId = "034-evidence-pack-registry";

export default function migrate(db, { log = () => {} } = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS evidence_packs (
      id TEXT PRIMARY KEY,
      pack_key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      scope TEXT NOT NULL,
      created_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json))
    );

    CREATE TABLE IF NOT EXISTS evidence_pack_revisions (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL,
      pack_version TEXT NOT NULL,
      manifest_sha256 TEXT NOT NULL CHECK (length(manifest_sha256) = 64),
      created_at TEXT NOT NULL,
      gates_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(gates_json)),
      notes_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(notes_json)),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (pack_id, manifest_sha256),
      FOREIGN KEY (pack_id) REFERENCES evidence_packs(id)
    );

    CREATE TABLE IF NOT EXISTS evidence_pack_documents (
      id TEXT PRIMARY KEY,
      revision_id TEXT NOT NULL,
      witness_id TEXT NOT NULL,
      source_family TEXT NOT NULL,
      is_required INTEGER NOT NULL CHECK (is_required IN (0, 1)),
      ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
      coverage_roles_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(coverage_roles_json)),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (revision_id, witness_id),
      UNIQUE (revision_id, source_family),
      FOREIGN KEY (revision_id) REFERENCES evidence_pack_revisions(id),
      FOREIGN KEY (witness_id) REFERENCES source_witnesses(id)
    );

    CREATE TABLE IF NOT EXISTS evidence_pack_active_revisions (
      pack_id TEXT PRIMARY KEY,
      revision_id TEXT NOT NULL UNIQUE,
      activated_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      FOREIGN KEY (pack_id) REFERENCES evidence_packs(id),
      FOREIGN KEY (revision_id) REFERENCES evidence_pack_revisions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_evidence_pack_revisions_pack
      ON evidence_pack_revisions(pack_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_evidence_pack_documents_witness
      ON evidence_pack_documents(witness_id, revision_id);

    CREATE TRIGGER IF NOT EXISTS trg_evidence_pack_revision_immutable
    BEFORE UPDATE ON evidence_pack_revisions
    BEGIN
      SELECT RAISE(ABORT, 'evidence pack revisions are immutable; create a new revision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_evidence_pack_revision_no_delete
    BEFORE DELETE ON evidence_pack_revisions
    BEGIN
      SELECT RAISE(ABORT, 'evidence pack revisions cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_evidence_pack_document_immutable
    BEFORE UPDATE ON evidence_pack_documents
    BEGIN
      SELECT RAISE(ABORT, 'evidence pack document membership is immutable; create a new revision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_evidence_pack_document_no_delete
    BEFORE DELETE ON evidence_pack_documents
    BEGIN
      SELECT RAISE(ABORT, 'evidence pack document membership cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_evidence_pack_active_revision_matches_pack_insert
    BEFORE INSERT ON evidence_pack_active_revisions
    WHEN NOT EXISTS (
      SELECT 1 FROM evidence_pack_revisions revision
      WHERE revision.id = NEW.revision_id AND revision.pack_id = NEW.pack_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'active evidence pack revision must belong to the same pack');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_evidence_pack_active_revision_matches_pack_update
    BEFORE UPDATE OF pack_id, revision_id ON evidence_pack_active_revisions
    WHEN NOT EXISTS (
      SELECT 1 FROM evidence_pack_revisions revision
      WHERE revision.id = NEW.revision_id AND revision.pack_id = NEW.pack_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'active evidence pack revision must belong to the same pack');
    END;
  `);

  log(`${migrationId}: evidence-pack registry ready`);
}
