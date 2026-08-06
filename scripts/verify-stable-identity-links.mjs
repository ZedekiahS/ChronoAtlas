import { DatabaseSync } from "node:sqlite";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import migrateIdentityLinks from "../db/migrations/029-stable-identity-links.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkMode = process.argv.includes("--check");
const dbArgument = process.argv.find((argument) => argument.startsWith("--db="));
const sourceDbPath = path.resolve(
  rootDir,
  dbArgument ? dbArgument.slice("--db=".length) : path.join("db", "chronoatlas.sqlite"),
);
const sampleLimitArgument = process.argv.find((argument) => argument.startsWith("--sample-limit="));
const sampleLimit = Number.parseInt(sampleLimitArgument?.slice("--sample-limit=".length) ?? "10", 10);

if (!Number.isInteger(sampleLimit) || sampleLimit < 0 || sampleLimit > 100) {
  throw new Error("--sample-limit must be an integer between 0 and 100");
}

function requiredObject(db, type, name) {
  const row = db.prepare("SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?").get(type, name);
  if (!row) throw new Error(`Missing required ${type}: ${name}`);
}

function linkCounts(db) {
  return {
    persons: db.prepare("SELECT COUNT(*) AS count FROM person_entity_links").get().count,
    events: db.prepare("SELECT COUNT(*) AS count FROM historical_event_event_links").get().count,
    places: db.prepare("SELECT COUNT(*) AS count FROM place_entity_links").get().count,
  };
}

function expectConstraintFailure(label, action) {
  try {
    action();
  } catch {
    return;
  }
  throw new Error(`Expected constraint failure: ${label}`);
}

function verifyIntegrityGuards(db) {
  const personLink = db.prepare("SELECT person_id FROM person_entity_links ORDER BY person_id LIMIT 1").get();
  const eventLink = db.prepare(`
    SELECT historical_event_id
    FROM historical_event_event_links
    ORDER BY historical_event_id
    LIMIT 1
  `).get();
  const placeLink = db.prepare("SELECT place_id FROM place_entity_links ORDER BY place_id LIMIT 1").get();
  const personEntity = db.prepare(`
    SELECT id FROM entities WHERE entity_type = 'person' ORDER BY id LIMIT 1
  `).get();
  const placeEntity = db.prepare(`
    SELECT id FROM entities WHERE entity_type = 'place' ORDER BY id LIMIT 1
  `).get();

  if (personLink && placeEntity) {
    expectConstraintFailure("person link rejects a place entity", () => {
      db.prepare("UPDATE person_entity_links SET entity_id = ? WHERE person_id = ?")
        .run(placeEntity.id, personLink.person_id);
    });
  }
  if (placeLink && personEntity) {
    expectConstraintFailure("place link rejects a person entity", () => {
      db.prepare("UPDATE place_entity_links SET entity_id = ? WHERE place_id = ?")
        .run(personEntity.id, placeLink.place_id);
    });
  }
  if (eventLink) {
    expectConstraintFailure("historical event link rejects a missing runtime event", () => {
      db.prepare(`
        UPDATE historical_event_event_links
        SET event_id = 'event:missing-identity-check-target'
        WHERE historical_event_id = ?
      `).run(eventLink.historical_event_id);
    });
  }
}

function verifyMapFeatureReferenceSupport(db) {
  const feature = db.prepare("SELECT id FROM map_features ORDER BY id LIMIT 1").get();
  const placeEntity = db.prepare(`
    SELECT id
    FROM entities
    WHERE entity_type = 'place' AND id LIKE 'place:%'
    ORDER BY id
    LIMIT 1
  `).get();
  if (!feature || !placeEntity) return;

  const placeId = "identity-check-map-feature-place";
  db.exec("SAVEPOINT map_feature_identity_probe;");
  try {
    db.prepare(`
      UPDATE map_features
      SET stable_place_id = ?, entity_id = ?
      WHERE id = ?
    `).run(placeId, placeEntity.id, feature.id);
    migrateIdentityLinks(db, { postRuntimeSeeds: true });
    const usage = db.prepare(`
      SELECT map_feature_count
      FROM place_reference_usage
      WHERE place_id = ?
    `).get(placeId);
    const link = db.prepare(`
      SELECT entity_id
      FROM place_entity_links
      WHERE place_id = ?
    `).get(placeId);
    if (!usage || usage.map_feature_count < 1 || link?.entity_id !== placeEntity.id) {
      throw new Error("map_features.stable_place_id did not enter the explicit place mapping universe");
    }
  } finally {
    db.exec("ROLLBACK TO SAVEPOINT map_feature_identity_probe;");
    db.exec("RELEASE SAVEPOINT map_feature_identity_probe;");
  }
}

function auditDatabase(db) {
  for (const tableName of [
    "person_entity_links",
    "historical_event_event_links",
    "place_entity_links",
  ]) {
    requiredObject(db, "table", tableName);
  }
  for (const viewName of [
    "place_reference_usage",
    "identity_mapping_coverage",
    "identity_mapping_issues",
  ]) {
    requiredObject(db, "view", viewName);
  }
  for (const indexName of [
    "idx_person_entity_links_entity",
    "idx_historical_event_event_links_event",
    "idx_place_entity_links_entity",
    "idx_source_mention_places_place",
    "idx_map_features_stable_place",
  ]) {
    requiredObject(db, "index", indexName);
  }

  const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
  if (foreignKeyFailures.length > 0) {
    throw new Error(`Foreign key check failed: ${JSON.stringify(foreignKeyFailures.slice(0, sampleLimit))}`);
  }

  const wrongTargetTypes = db.prepare(`
    SELECT object_type, source_id, candidate_target_id
    FROM identity_mapping_issues
    WHERE issue = 'wrong-target-type'
    ORDER BY object_type, source_id
  `).all();
  if (wrongTargetTypes.length > 0) {
    throw new Error(`Identity links contain wrong target types: ${JSON.stringify(wrongTargetTypes.slice(0, sampleLimit))}`);
  }

  const coverage = db.prepare(`
    SELECT object_type, total_count, mapped_count, unmapped_count, coverage_percent
    FROM identity_mapping_coverage
    ORDER BY object_type
  `).all();
  const coverageByType = Object.fromEntries(coverage.map((row) => [row.object_type, row]));

  for (const objectType of ["person", "historical_event"]) {
    const row = coverageByType[objectType];
    if (!row || row.unmapped_count !== 0) {
      throw new Error(`${objectType} identity mapping is incomplete: ${JSON.stringify(row ?? null)}`);
    }
  }

  const missingSamples = {};
  for (const objectType of ["person", "historical_event", "place_reference"]) {
    missingSamples[objectType] = db.prepare(`
      SELECT source_id, source_label, candidate_target_id, usage_count
      FROM identity_mapping_issues
      WHERE object_type = ? AND issue = 'missing-link'
      ORDER BY usage_count DESC, source_id
      LIMIT ?
    `).all(objectType, sampleLimit);
  }

  const runtimeOnlyPeople = db.prepare(`
    SELECT target.id, target.primary_label
    FROM entities target
    LEFT JOIN person_entity_links link ON link.entity_id = target.id
    WHERE target.entity_type = 'person' AND link.entity_id IS NULL
    ORDER BY target.id
    LIMIT ?
  `).all(sampleLimit);

  const placeReferenceSources = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN mention_count > 0 THEN 1 ELSE 0 END) AS from_mentions,
      SUM(CASE WHEN map_feature_count > 0 THEN 1 ELSE 0 END) AS from_map_features,
      SUM(CASE WHEN mention_count > 0 AND map_feature_count > 0 THEN 1 ELSE 0 END) AS shared
    FROM place_reference_usage
  `).get();

  return {
    coverage,
    placeReferenceSources,
    missingSamples,
    runtimeOnlyPeople,
    linkCounts: linkCounts(db),
    foreignKeyFailures: foreignKeyFailures.length,
  };
}

async function main() {
  let temporaryDirectory = null;
  let auditDbPath = sourceDbPath;

  if (checkMode) {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "chronoatlas-identity-links-"));
    auditDbPath = path.join(temporaryDirectory, "identity-links-check.sqlite");
    await copyFile(sourceDbPath, auditDbPath);
  }

  const db = new DatabaseSync(auditDbPath, { readOnly: !checkMode });
  try {
    db.exec("PRAGMA foreign_keys = ON;");

    let firstPassCounts = null;
    if (checkMode) {
      migrateIdentityLinks(db, { postRuntimeSeeds: true });
      firstPassCounts = linkCounts(db);
      migrateIdentityLinks(db, { postRuntimeSeeds: true });
      const secondPassCounts = linkCounts(db);
      if (JSON.stringify(firstPassCounts) !== JSON.stringify(secondPassCounts)) {
        throw new Error(
          `Migration is not idempotent: ${JSON.stringify({ firstPassCounts, secondPassCounts })}`,
        );
      }
      verifyIntegrityGuards(db);
      verifyMapFeatureReferenceSupport(db);
    }

    const report = auditDatabase(db);
    console.log(JSON.stringify({
      database: checkMode ? "temporary-copy" : path.relative(rootDir, auditDbPath),
      checkMode,
      idempotent: checkMode ? true : null,
      ...report,
    }, null, 2));
  } finally {
    db.close();
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }
}

await main();
