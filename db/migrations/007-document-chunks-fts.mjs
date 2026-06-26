function compactText(parts) {
  return parts
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim())
    .join("\n");
}

function splitIntoChunks(text, maxLength = 1200, overlap = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxLength, normalized.length);
    if (end < normalized.length) {
      const boundary = Math.max(
        normalized.lastIndexOf("。", end),
        normalized.lastIndexOf("；", end),
        normalized.lastIndexOf("，", end),
        normalized.lastIndexOf(". ", end),
        normalized.lastIndexOf("; ", end),
      );
      if (boundary > start + Math.floor(maxLength * 0.55)) {
        end = boundary + 1;
      }
    }

    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}

function insertChunkEntities(db, chunkId, document) {
  const insert = db.prepare(`
    INSERT INTO document_chunk_entities (chunk_id, entity_id, link_role, sort_order)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(chunk_id, entity_id, link_role) DO UPDATE SET
      sort_order = excluded.sort_order
  `);

  if (document.subject_table === "entities" && document.subject_id) {
    insert.run(chunkId, document.subject_id, "subject", 0);
    return;
  }

  if (document.subject_table === "events" && document.subject_id) {
    const rows = db.prepare(`
      SELECT entity_id, role, sort_order
      FROM event_entities
      WHERE event_id = ?
      ORDER BY sort_order, entity_id
    `).all(document.subject_id);

    rows.forEach((row, index) => {
      insert.run(chunkId, row.entity_id, row.role ?? "participant", row.sort_order ?? index);
    });
    return;
  }

  if (document.subject_table === "source_mentions" && document.subject_id) {
    const rows = db.prepare(`
      SELECT person_id, sort_order
      FROM source_mention_people
      WHERE mention_id = ?
      ORDER BY sort_order, person_id
    `).all(document.subject_id);

    rows.forEach((row, index) => {
      insert.run(chunkId, `person:${row.person_id}`, "mentioned", row.sort_order ?? index);
    });
  }
}

function rebuildDocumentChunks(db) {
  db.exec(`
    DELETE FROM document_chunk_entities;
    DELETE FROM document_chunks;
  `);

  const insertChunk = db.prepare(`
    INSERT INTO document_chunks (
      id, search_document_id, chunk_index, subject_table, subject_id, title, body,
      language, region_id, period_id, topic_id, time_start, time_end,
      token_estimate, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const documents = db.prepare(`
    SELECT *
    FROM search_documents
    ORDER BY id
  `).all();

  for (const document of documents) {
    const chunkBodies = splitIntoChunks(document.body);
    chunkBodies.forEach((body, index) => {
      const chunkId = `${document.id}:chunk:${String(index).padStart(3, "0")}`;
      const title = index === 0 ? document.title : `${document.title ?? document.id} · ${index + 1}`;
      insertChunk.run(
        chunkId,
        document.id,
        index,
        document.subject_table,
        document.subject_id,
        title,
        body,
        document.language,
        document.region_id,
        document.period_id,
        document.topic_id,
        document.time_start,
        document.time_end,
        Math.ceil(body.length / 2),
        document.review_status,
        compactText([document.raw_json]) || "{}",
      );
      insertChunkEntities(db, chunkId, document);
    });
  }

  if (hasDocumentChunksFts(db)) {
    db.exec("INSERT INTO document_chunks_fts(document_chunks_fts) VALUES('rebuild');");
  }
}

function hasDocumentChunksFts(db) {
  return Boolean(
    db.prepare(`
      SELECT 1
      FROM sqlite_master
      WHERE name = 'document_chunks_fts'
        AND type IN ('table', 'virtual table')
    `).get(),
  );
}

function createOptionalFts(db) {
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
        title,
        body,
        content='document_chunks',
        content_rowid='rowid',
        tokenize='unicode61'
      );
    `);
    return true;
  } catch {
    db.exec(`
      CREATE TABLE IF NOT EXISTS rag_search_capabilities (
        id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL,
        notes TEXT,
        raw_json TEXT NOT NULL DEFAULT '{}'
      );

      INSERT INTO rag_search_capabilities (id, enabled, notes, raw_json)
      VALUES (
        'document_chunks_fts5',
        0,
        'FTS5 is not available in this SQLite runtime; API falls back to LIKE over document_chunks.',
        '{}'
      )
      ON CONFLICT(id) DO UPDATE SET
        enabled = excluded.enabled,
        notes = excluded.notes,
        raw_json = excluded.raw_json;
    `);
    return false;
  }
}

export default function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      search_document_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
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
      token_estimate INTEGER NOT NULL DEFAULT 0,
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (search_document_id) REFERENCES search_documents(id) ON DELETE CASCADE,
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (period_id) REFERENCES periods(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id),
      UNIQUE (search_document_id, chunk_index)
    );

    CREATE TABLE IF NOT EXISTS document_chunk_entities (
      chunk_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      link_role TEXT NOT NULL DEFAULT 'mentioned',
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (chunk_id, entity_id, link_role),
      FOREIGN KEY (chunk_id) REFERENCES document_chunks(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    );

    CREATE INDEX IF NOT EXISTS idx_document_chunks_document
      ON document_chunks(search_document_id, chunk_index);
    CREATE INDEX IF NOT EXISTS idx_document_chunks_subject
      ON document_chunks(subject_table, subject_id);
    CREATE INDEX IF NOT EXISTS idx_document_chunks_filter
      ON document_chunks(region_id, period_id, topic_id, time_start, time_end);
    CREATE INDEX IF NOT EXISTS idx_document_chunk_entities_entity
      ON document_chunk_entities(entity_id, link_role);
  `);

  createOptionalFts(db);
  rebuildDocumentChunks(db);
}
