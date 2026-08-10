import migrateStableIdentityLinks from "./029-stable-identity-links.mjs";

const migrationId = "030-person-identity-merges";

export const runAfterRuntimeSeeds = true;

const curatedMerges = [
  {
    canonicalPersonId: "zhang-jiao",
    duplicatePersonIds: ["eh-zhang-jue"],
    expectedCanonicalName: "张角",
    expectedDuplicateNames: { "eh-zhang-jue": "张角" },
    rationale: "The Eastern Han core seed and the earlier Three Kingdoms profile describe the same Taiping Dao leader who died in 184.",
  },
  {
    canonicalPersonId: "shi-hu",
    duplicatePersonIds: ["person:shi-hu"],
    expectedCanonicalName: "石虎",
    expectedDuplicateNames: { "person:shi-hu": "石虎" },
    rationale: "The Northern Dynasties seed and the Western Jin editorial bridge describe the Later Zhao ruler Shi Hu; the prefixed legacy id was an accidental second person card.",
  },
  {
    canonicalPersonId: "han-lingdi",
    duplicatePersonIds: ["eh-liu-hong"],
    expectedCanonicalName: "汉灵帝",
    expectedDuplicateNames: { "eh-liu-hong": "刘宏" },
    rationale: "The Eastern Han core seed records Emperor Ling by personal name Liu Hong, while the official-history repair records the same 156–189 ruler by imperial title.",
  },
];

function personLinkHasUniqueEntityConstraint(db) {
  return db.prepare("PRAGMA index_list('person_entity_links')").all().some((index) => {
    if (!index.unique) return false;
    const columns = db.prepare(`PRAGMA index_info('${String(index.name).replaceAll("'", "''")}')`).all();
    return columns.length === 1 && columns[0].name === "entity_id";
  });
}

function createPersonLinkGuards(db) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_person_entity_links_entity
      ON person_entity_links(entity_id);

    CREATE TRIGGER IF NOT EXISTS trg_person_entity_links_type_insert
    BEFORE INSERT ON person_entity_links
    WHEN NOT EXISTS (
      SELECT 1 FROM entities
      WHERE id = NEW.entity_id AND entity_type = 'person'
    )
    BEGIN
      SELECT RAISE(ABORT, 'person_entity_links target must be a person entity');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_person_entity_links_type_update
    BEFORE UPDATE OF entity_id ON person_entity_links
    WHEN NOT EXISTS (
      SELECT 1 FROM entities
      WHERE id = NEW.entity_id AND entity_type = 'person'
    )
    BEGIN
      SELECT RAISE(ABORT, 'person_entity_links target must be a person entity');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_identity_link_entity_type_guard
    BEFORE UPDATE OF entity_type ON entities
    WHEN
      (NEW.entity_type <> 'person' AND EXISTS (
        SELECT 1 FROM person_entity_links WHERE entity_id = OLD.id
      ))
      OR
      (NEW.entity_type <> 'place' AND EXISTS (
        SELECT 1 FROM place_entity_links WHERE entity_id = OLD.id
      ))
    BEGIN
      SELECT RAISE(ABORT, 'entity_type conflicts with an explicit identity link');
    END;
  `);
}

function allowManyLegacyPeoplePerEntity(db) {
  if (!personLinkHasUniqueEntityConstraint(db)) {
    createPersonLinkGuards(db);
    return;
  }

  db.exec(`
    DROP VIEW IF EXISTS identity_mapping_issues;
    DROP VIEW IF EXISTS identity_mapping_coverage;

    DROP TRIGGER IF EXISTS trg_person_entity_links_type_insert;
    DROP TRIGGER IF EXISTS trg_person_entity_links_type_update;
    DROP TRIGGER IF EXISTS trg_identity_link_entity_type_guard;

    CREATE TABLE person_entity_links_next (
      person_id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      link_method TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'high',
      review_status TEXT NOT NULL DEFAULT 'auto-verified',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    INSERT INTO person_entity_links_next (
      person_id, entity_id, link_method, confidence, review_status, raw_json
    )
    SELECT person_id, entity_id, link_method, confidence, review_status, raw_json
    FROM person_entity_links
    ORDER BY person_id;

    DROP TABLE person_entity_links;
    ALTER TABLE person_entity_links_next RENAME TO person_entity_links;
  `);

  createPersonLinkGuards(db);
  migrateStableIdentityLinks(db);
}

function applyCuratedMerges(db) {
  for (const merge of curatedMerges) {
    const canonicalEntityId = `person:${merge.canonicalPersonId}`;
    const canonical = db.prepare(`
      SELECT p.id, p.name, e.entity_type
      FROM persons p
      JOIN entities e ON e.id = ?
      WHERE p.id = ?
    `).get(canonicalEntityId, merge.canonicalPersonId);

    if (!canonical) continue;
    if (canonical.name !== merge.expectedCanonicalName || canonical.entity_type !== "person") {
      throw new Error(`Curated person identity changed unexpectedly: ${merge.canonicalPersonId}`);
    }

    for (const duplicatePersonId of merge.duplicatePersonIds) {
      const duplicate = db.prepare("SELECT id, name FROM persons WHERE id = ?").get(duplicatePersonId);
      if (!duplicate) continue;
      if (duplicate.name !== merge.expectedDuplicateNames[duplicatePersonId]) {
        throw new Error(`Curated duplicate identity changed unexpectedly: ${duplicatePersonId}`);
      }

      db.prepare(`
        INSERT INTO person_entity_links (
          person_id, entity_id, link_method, confidence, review_status, raw_json
        ) VALUES (?, ?, 'curated-duplicate-merge', 'high', 'reviewed', ?)
        ON CONFLICT(person_id) DO UPDATE SET
          entity_id = excluded.entity_id,
          link_method = excluded.link_method,
          confidence = excluded.confidence,
          review_status = excluded.review_status,
          raw_json = excluded.raw_json
      `).run(
        duplicatePersonId,
        canonicalEntityId,
        JSON.stringify({
          generatedFrom: migrationId,
          canonicalPersonId: merge.canonicalPersonId,
          expectedCanonicalName: merge.expectedCanonicalName,
          expectedDuplicateName: merge.expectedDuplicateNames[duplicatePersonId],
          rationale: merge.rationale,
        }),
      );
    }
  }
}

export default function migratePersonIdentityMerges(db, options = {}) {
  db.exec("SAVEPOINT person_identity_merges;");
  try {
    allowManyLegacyPeoplePerEntity(db);
    applyCuratedMerges(db);
    db.exec("RELEASE SAVEPOINT person_identity_merges;");
    options.log?.("enabled many-to-one person identity links and applied curated duplicate merges");
  } catch (error) {
    db.exec("ROLLBACK TO SAVEPOINT person_identity_merges;");
    db.exec("RELEASE SAVEPOINT person_identity_merges;");
    throw error;
  }
}
