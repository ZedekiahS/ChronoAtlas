import {
  chinaRegnalReference184280,
  chinaRegnalReference184280Meta,
} from "../data/china-regnal-reference-184-280.mjs";
import {
  chinaRegnalReferenceEasternHan25184,
  chinaRegnalReferenceEasternHan25184Meta,
} from "../data/china-regnal-reference-eastern-han-25-184.mjs";
import {
  chinaRegnalReferenceWesternJin281316,
  chinaRegnalReferenceWesternJin281316Meta,
} from "../data/china-regnal-reference-western-jin-281-316.mjs";
import {
  chinaRegnalReferenceWesternHanXinTransition824,
  chinaRegnalReferenceWesternHanXinTransition824Meta,
} from "../data/china-regnal-reference-western-han-xin-transition--8-24.mjs";
import {
  chinaRegnalReferenceWesternHanWudi14087,
  chinaRegnalReferenceWesternHanWudi14087Meta,
} from "../data/china-regnal-reference-western-han-wudi--140--87.mjs";
import {
  chinaRegnalReferenceWesternHanEarly206141,
  chinaRegnalReferenceWesternHanEarly206141Meta,
} from "../data/china-regnal-reference-western-han-early--206---141.mjs";
import {
  chinaRegnalReferenceWesternHanZhaodi8674,
  chinaRegnalReferenceWesternHanZhaodi8674Meta,
} from "../data/china-regnal-reference-western-han-zhaodi--86--74.mjs";
import {
  chinaRegnalReferenceWesternHanXuandi7349,
  chinaRegnalReferenceWesternHanXuandi7349Meta,
} from "../data/china-regnal-reference-western-han-xuandi--73--49.mjs";
import {
  chinaRegnalReferenceWesternHanYuandi4833,
  chinaRegnalReferenceWesternHanYuandi4833Meta,
} from "../data/china-regnal-reference-western-han-yuandi--48--33.mjs";

function tableColumns(db, tableName) {
  return new Set(db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name));
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  if (!tableColumns(db, tableName).has(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

const eraPacks = [
  {
    eras: chinaRegnalReferenceWesternHanEarly206141,
    meta: chinaRegnalReferenceWesternHanEarly206141Meta,
  },
  {
    eras: chinaRegnalReferenceWesternHanWudi14087,
    meta: chinaRegnalReferenceWesternHanWudi14087Meta,
  },
  {
    eras: chinaRegnalReferenceWesternHanZhaodi8674,
    meta: chinaRegnalReferenceWesternHanZhaodi8674Meta,
  },
  {
    eras: chinaRegnalReferenceWesternHanXuandi7349,
    meta: chinaRegnalReferenceWesternHanXuandi7349Meta,
  },
  {
    eras: chinaRegnalReferenceWesternHanYuandi4833,
    meta: chinaRegnalReferenceWesternHanYuandi4833Meta,
  },
  {
    eras: chinaRegnalReferenceWesternHanXinTransition824,
    meta: chinaRegnalReferenceWesternHanXinTransition824Meta,
  },
  { eras: chinaRegnalReferenceEasternHan25184, meta: chinaRegnalReferenceEasternHan25184Meta },
  { eras: chinaRegnalReference184280, meta: chinaRegnalReference184280Meta },
  { eras: chinaRegnalReferenceWesternJin281316, meta: chinaRegnalReferenceWesternJin281316Meta },
];

export default function migrate(db) {
  addColumnIfMissing(db, "events", "time_precision", "TEXT NOT NULL DEFAULT 'unknown'");

  db.exec(`
    CREATE TABLE IF NOT EXISTS chronology_eras (
      id TEXT PRIMARY KEY,
      calendar_system TEXT NOT NULL,
      era_label TEXT NOT NULL,
      context_key TEXT,
      region_id TEXT,
      time_start INTEGER NOT NULL,
      time_end INTEGER NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'medium',
      review_status TEXT NOT NULL DEFAULT 'draft',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (region_id) REFERENCES regions(id),
      UNIQUE (calendar_system, era_label, context_key, time_start)
    );

    CREATE TABLE IF NOT EXISTS chronology_era_aliases (
      era_id TEXT NOT NULL,
      alias TEXT NOT NULL,
      language TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (era_id, alias),
      FOREIGN KEY (era_id) REFERENCES chronology_eras(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_import_cards (
      event_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      generator TEXT NOT NULL,
      relation_type TEXT NOT NULL DEFAULT 'support',
      sort_order INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      PRIMARY KEY (event_id, card_id, generator),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES import_evidence_cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_event_cluster_events (
      cluster_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      generator TEXT NOT NULL,
      relation_type TEXT NOT NULL DEFAULT 'derived-from',
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      PRIMARY KEY (cluster_id, event_id, generator),
      FOREIGN KEY (cluster_id) REFERENCES import_event_clusters(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chronology_eras_lookup
      ON chronology_eras(calendar_system, era_label, context_key, time_start);
    CREATE INDEX IF NOT EXISTS idx_event_import_cards_card
      ON event_import_cards(card_id, generator, event_id);
    CREATE INDEX IF NOT EXISTS idx_event_import_cards_event
      ON event_import_cards(event_id, generator);
    CREATE INDEX IF NOT EXISTS idx_import_event_cluster_events_event
      ON import_event_cluster_events(event_id, generator, cluster_id);
  `);

  db.exec(`
    UPDATE events
    SET time_precision = CASE
      WHEN time_start IS NULL AND time_end IS NULL THEN 'unknown'
      WHEN time_start IS NOT NULL AND COALESCE(time_end, time_start) = time_start THEN 'year'
      ELSE 'range'
    END
    WHERE time_precision = 'unknown'
  `);

  const insertEra = db.prepare(`
    INSERT INTO chronology_eras (
      id, calendar_system, era_label, context_key, region_id,
      time_start, time_end, confidence, review_status, raw_json
    ) VALUES (?, 'china-regnal', ?, ?, 'china', ?, ?, 'high', 'reviewed', ?)
    ON CONFLICT(id) DO UPDATE SET
      era_label = excluded.era_label,
      context_key = excluded.context_key,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);

  for (const { eras, meta } of eraPacks) {
    for (const [id, eraLabel, contextKey, timeStart, timeEnd] of eras) {
      insertEra.run(
        id,
        eraLabel,
        contextKey,
        timeStart,
        timeEnd,
        JSON.stringify({
          generatedFrom: "reference-data-pack",
          dataPackId: meta.id,
          purpose: "regnal-year-resolution",
          reusableBy: "source-event-promotion",
        }),
      );
    }
  }
}
