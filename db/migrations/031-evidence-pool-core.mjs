const migrationId = "031-evidence-pool-core";

export default function migrate(db, { log = () => {} } = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS source_works (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      work_kind TEXT NOT NULL,
      language TEXT NOT NULL,
      date_label TEXT,
      date_start INTEGER,
      date_end INTEGER,
      availability_status TEXT NOT NULL DEFAULT 'extant',
      evidence_domain TEXT NOT NULL DEFAULT 'historical_source',
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      CHECK (date_start IS NULL OR date_end IS NULL OR date_start <= date_end)
    );

    CREATE TABLE IF NOT EXISTS source_work_contributors (
      id TEXT PRIMARY KEY,
      work_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      role TEXT NOT NULL,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      certainty TEXT NOT NULL DEFAULT 'high',
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (work_id, entity_id, role),
      FOREIGN KEY (work_id) REFERENCES source_works(id),
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    );

    CREATE TABLE IF NOT EXISTS source_work_relations (
      id TEXT PRIMARY KEY,
      from_work_id TEXT NOT NULL,
      to_work_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      certainty TEXT NOT NULL DEFAULT 'medium',
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (from_work_id, to_work_id, relation_type),
      FOREIGN KEY (from_work_id) REFERENCES source_works(id),
      FOREIGN KEY (to_work_id) REFERENCES source_works(id),
      CHECK (from_work_id <> to_work_id)
    );

    CREATE TABLE IF NOT EXISTS source_witnesses (
      id TEXT PRIMARY KEY,
      work_id TEXT NOT NULL,
      witness_type TEXT NOT NULL,
      edition_statement TEXT NOT NULL,
      publisher TEXT,
      publication_date TEXT,
      shelfmark TEXT,
      catalog_uri TEXT,
      fidelity_status TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (work_id) REFERENCES source_works(id)
    );

    CREATE TABLE IF NOT EXISTS source_witness_relations (
      id TEXT PRIMARY KEY,
      from_witness_id TEXT NOT NULL,
      to_witness_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (from_witness_id, to_witness_id, relation_type),
      FOREIGN KEY (from_witness_id) REFERENCES source_witnesses(id),
      FOREIGN KEY (to_witness_id) REFERENCES source_witnesses(id),
      CHECK (from_witness_id <> to_witness_id)
    );

    CREATE TABLE IF NOT EXISTS rights_statements (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      license_uri TEXT,
      rights_holder TEXT,
      jurisdiction TEXT,
      allow_store INTEGER NOT NULL CHECK (allow_store IN (0, 1)),
      allow_display INTEGER NOT NULL CHECK (allow_display IN (0, 1)),
      allow_index INTEGER NOT NULL CHECK (allow_index IN (0, 1)),
      allow_quote INTEGER NOT NULL CHECK (allow_quote IN (0, 1)),
      reviewed_at TEXT,
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS source_assets (
      id TEXT PRIMARY KEY,
      witness_id TEXT NOT NULL,
      asset_kind TEXT NOT NULL,
      origin_uri TEXT,
      retrieved_at TEXT,
      media_type TEXT NOT NULL,
      byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
      sha256 TEXT NOT NULL UNIQUE CHECK (length(sha256) = 64),
      storage_uri TEXT NOT NULL,
      http_metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(http_metadata_json)),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (witness_id) REFERENCES source_witnesses(id)
    );

    CREATE TABLE IF NOT EXISTS asset_rights (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      rights_id TEXT NOT NULL,
      effective_from TEXT,
      effective_to TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (asset_id, rights_id),
      FOREIGN KEY (asset_id) REFERENCES source_assets(id),
      FOREIGN KEY (rights_id) REFERENCES rights_statements(id)
    );

    CREATE TABLE IF NOT EXISTS ingest_runs (
      id TEXT PRIMARY KEY,
      witness_id TEXT NOT NULL,
      manifest_sha256 TEXT NOT NULL CHECK (length(manifest_sha256) = 64),
      adapter_key TEXT NOT NULL,
      adapter_version TEXT NOT NULL,
      parameters_sha256 TEXT NOT NULL CHECK (length(parameters_sha256) = 64),
      status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'committed', 'failed')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      supersedes_run_id TEXT,
      error_text TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (manifest_sha256, adapter_version, parameters_sha256),
      FOREIGN KEY (witness_id) REFERENCES source_witnesses(id),
      FOREIGN KEY (supersedes_run_id) REFERENCES ingest_runs(id)
    );

    CREATE TABLE IF NOT EXISTS ingest_run_assets (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      role TEXT NOT NULL,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (run_id, asset_id, role),
      FOREIGN KEY (run_id) REFERENCES ingest_runs(id),
      FOREIGN KEY (asset_id) REFERENCES source_assets(id)
    );

    CREATE TABLE IF NOT EXISTS document_nodes (
      id TEXT PRIMARY KEY,
      witness_id TEXT NOT NULL,
      parent_id TEXT,
      node_type TEXT NOT NULL,
      node_key TEXT NOT NULL,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      label TEXT NOT NULL,
      locator_path TEXT NOT NULL,
      layer_role TEXT NOT NULL,
      adapter_metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(adapter_metadata_json)),
      created_at TEXT NOT NULL,
      UNIQUE (witness_id, node_key),
      FOREIGN KEY (witness_id) REFERENCES source_witnesses(id),
      FOREIGN KEY (parent_id) REFERENCES document_nodes(id)
    );

    CREATE TABLE IF NOT EXISTS text_layers (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      layer_kind TEXT NOT NULL,
      language TEXT NOT NULL,
      script TEXT NOT NULL,
      base_layer_id TEXT,
      normalization_profile TEXT NOT NULL DEFAULT '',
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      created_at TEXT NOT NULL,
      UNIQUE (node_id, layer_kind, language, script, normalization_profile),
      FOREIGN KEY (node_id) REFERENCES document_nodes(id),
      FOREIGN KEY (base_layer_id) REFERENCES text_layers(id)
    );

    CREATE TABLE IF NOT EXISTS text_revisions (
      id TEXT PRIMARY KEY,
      layer_id TEXT NOT NULL,
      revision_no INTEGER NOT NULL CHECK (revision_no >= 1),
      content TEXT NOT NULL,
      content_sha256 TEXT NOT NULL CHECK (length(content_sha256) = 64),
      derived_from_revision_id TEXT,
      source_asset_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (layer_id, revision_no),
      UNIQUE (layer_id, content_sha256),
      FOREIGN KEY (layer_id) REFERENCES text_layers(id),
      FOREIGN KEY (derived_from_revision_id) REFERENCES text_revisions(id),
      FOREIGN KEY (source_asset_id) REFERENCES source_assets(id)
    );

    CREATE TABLE IF NOT EXISTS text_anchors (
      id TEXT PRIMARY KEY,
      text_revision_id TEXT NOT NULL,
      start_cp INTEGER NOT NULL CHECK (start_cp >= 0),
      end_cp INTEGER NOT NULL CHECK (end_cp >= start_cp),
      exact_text TEXT NOT NULL,
      prefix_text TEXT NOT NULL DEFAULT '',
      suffix_text TEXT NOT NULL DEFAULT '',
      exact_sha256 TEXT NOT NULL CHECK (length(exact_sha256) = 64),
      public_urn TEXT NOT NULL UNIQUE,
      selector_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(selector_json)),
      created_at TEXT NOT NULL,
      UNIQUE (text_revision_id, start_cp, end_cp, exact_sha256),
      FOREIGN KEY (text_revision_id) REFERENCES text_revisions(id)
    );

    CREATE TABLE IF NOT EXISTS text_alignments (
      id TEXT PRIMARY KEY,
      from_anchor_id TEXT NOT NULL,
      to_anchor_id TEXT NOT NULL,
      alignment_type TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'medium',
      method TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'draft',
      note TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (from_anchor_id, to_anchor_id, alignment_type),
      FOREIGN KEY (from_anchor_id) REFERENCES text_anchors(id),
      FOREIGN KEY (to_anchor_id) REFERENCES text_anchors(id),
      CHECK (from_anchor_id <> to_anchor_id)
    );

    CREATE TABLE IF NOT EXISTS anchor_attributions (
      id TEXT PRIMARY KEY,
      anchor_id TEXT NOT NULL,
      attributed_work_id TEXT NOT NULL,
      attribution_type TEXT NOT NULL,
      attribution_text TEXT,
      certainty TEXT NOT NULL DEFAULT 'high',
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (anchor_id, attributed_work_id, attribution_type),
      FOREIGN KEY (anchor_id) REFERENCES text_anchors(id),
      FOREIGN KEY (attributed_work_id) REFERENCES source_works(id)
    );

    CREATE TABLE IF NOT EXISTS ingest_run_text_revisions (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      text_revision_id TEXT NOT NULL,
      role TEXT NOT NULL,
      ordinal INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      UNIQUE (run_id, node_id, text_revision_id),
      FOREIGN KEY (run_id) REFERENCES ingest_runs(id),
      FOREIGN KEY (node_id) REFERENCES document_nodes(id),
      FOREIGN KEY (text_revision_id) REFERENCES text_revisions(id)
    );

    CREATE TABLE IF NOT EXISTS witness_active_ingests (
      witness_id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL UNIQUE,
      activated_at TEXT NOT NULL,
      raw_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(raw_json)),
      FOREIGN KEY (witness_id) REFERENCES source_witnesses(id),
      FOREIGN KEY (run_id) REFERENCES ingest_runs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_source_witnesses_work ON source_witnesses(work_id);
    CREATE INDEX IF NOT EXISTS idx_source_assets_witness ON source_assets(witness_id);
    CREATE INDEX IF NOT EXISTS idx_ingest_runs_witness ON ingest_runs(witness_id, status);
    CREATE INDEX IF NOT EXISTS idx_document_nodes_parent ON document_nodes(parent_id, ordinal);
    CREATE INDEX IF NOT EXISTS idx_text_layers_node ON text_layers(node_id);
    CREATE INDEX IF NOT EXISTS idx_text_revisions_layer ON text_revisions(layer_id, revision_no);
    CREATE INDEX IF NOT EXISTS idx_text_anchors_revision ON text_anchors(text_revision_id, start_cp, end_cp);
    CREATE INDEX IF NOT EXISTS idx_anchor_attributions_work ON anchor_attributions(attributed_work_id);

    CREATE TRIGGER IF NOT EXISTS trg_document_node_parent_witness_insert
    BEFORE INSERT ON document_nodes
    WHEN NEW.parent_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM document_nodes parent
      WHERE parent.id = NEW.parent_id AND parent.witness_id = NEW.witness_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'document node parent must belong to the same witness');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_document_node_parent_witness_update
    BEFORE UPDATE OF parent_id, witness_id ON document_nodes
    WHEN NEW.parent_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM document_nodes parent
      WHERE parent.id = NEW.parent_id AND parent.witness_id = NEW.witness_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'document node parent must belong to the same witness');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_text_anchor_exact_insert
    BEFORE INSERT ON text_anchors
    WHEN NOT EXISTS (
      SELECT 1
      FROM text_revisions revision
      WHERE revision.id = NEW.text_revision_id
        AND NEW.end_cp <= length(revision.content)
        AND NEW.exact_text = substr(revision.content, NEW.start_cp + 1, NEW.end_cp - NEW.start_cp)
    )
    BEGIN
      SELECT RAISE(ABORT, 'anchor exact text does not match the revision code-point range');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_text_anchor_exact_update
    BEFORE UPDATE OF text_revision_id, start_cp, end_cp, exact_text ON text_anchors
    WHEN NOT EXISTS (
      SELECT 1
      FROM text_revisions revision
      WHERE revision.id = NEW.text_revision_id
        AND NEW.end_cp <= length(revision.content)
        AND NEW.exact_text = substr(revision.content, NEW.start_cp + 1, NEW.end_cp - NEW.start_cp)
    )
    BEGIN
      SELECT RAISE(ABORT, 'anchor exact text does not match the revision code-point range');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_source_asset_immutable
    BEFORE UPDATE OF witness_id, byte_length, sha256, storage_uri ON source_assets
    BEGIN
      SELECT RAISE(ABORT, 'source assets are immutable; create a new asset');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_source_asset_no_delete
    BEFORE DELETE ON source_assets
    BEGIN
      SELECT RAISE(ABORT, 'source assets cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_text_revision_content_immutable
    BEFORE UPDATE OF layer_id, content, content_sha256, source_asset_id ON text_revisions
    BEGIN
      SELECT RAISE(ABORT, 'text revisions are immutable; create a new revision');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_text_revision_delete_guard
    BEFORE DELETE ON text_revisions
    WHEN EXISTS (SELECT 1 FROM text_anchors anchor WHERE anchor.text_revision_id = OLD.id)
    BEGIN
      SELECT RAISE(ABORT, 'anchored text revisions cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_committed_ingest_immutable
    BEFORE UPDATE ON ingest_runs
    WHEN OLD.status = 'committed'
    BEGIN
      SELECT RAISE(ABORT, 'committed ingest runs are immutable');
    END;
  `);

  log(`${migrationId}: evidence-pool core schema ready`);
}
