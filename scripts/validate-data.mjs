import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chinaMap from "../data/china-three-kingdoms-map.json" with { type: "json" };
import naturalEarthChinaPhysical from "../data/natural-earth-china-physical.json" with { type: "json" };

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");

const boundaryTypes = new Set(["effective-control", "nominal", "cultural-influence"]);
const confidenceValues = new Set(["high", "medium", "low"]);
const eventImportanceValues = new Set(["major", "medium", "minor"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function scalar(db, sql, params = []) {
  return db.prepare(sql).get(...params).value;
}

function scalarCount(db, tableName) {
  return scalar(db, `SELECT COUNT(*) AS value FROM ${tableName}`);
}

function validateLonLat(point, pointId) {
  assert(Array.isArray(point) && point.length === 2, `Point must be [lon, lat]: ${pointId}`);
  assert(point[0] >= -180 && point[0] <= 180, `Longitude out of range: ${pointId}`);
  assert(point[1] >= -90 && point[1] <= 90, `Latitude out of range: ${pointId}`);
}

function validateBoundary(boundary, boundaryId) {
  assert(Array.isArray(boundary) && boundary.length >= 4, `Boundary needs at least 4 points: ${boundaryId}`);
  const first = boundary[0];
  const last = boundary[boundary.length - 1];
  assert(first[0] === last[0] && first[1] === last[1], `Boundary must be closed: ${boundaryId}`);
  for (const point of boundary) {
    validateLonLat(point, boundaryId);
  }
}

function collectGeometryCoordinates(geometry, collected = []) {
  if (!geometry) {
    return collected;
  }

  if (geometry.type === "GeometryCollection") {
    for (const child of geometry.geometries) {
      collectGeometryCoordinates(child, collected);
    }
    return collected;
  }

  collectCoordinateValues(geometry.coordinates, collected);
  return collected;
}

function collectCoordinateValues(value, collected) {
  if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    collected.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const child of value) {
      collectCoordinateValues(child, collected);
    }
  }
}

function validateFeatureCollection(collection, collectionId) {
  assert(collection.type === "FeatureCollection", `Expected FeatureCollection: ${collectionId}`);
  assert(Array.isArray(collection.features) && collection.features.length > 0, `FeatureCollection needs features: ${collectionId}`);

  for (const [index, feature] of collection.features.entries()) {
    assert(feature.type === "Feature", `Expected Feature: ${collectionId}:${index}`);
    const coordinates = collectGeometryCoordinates(feature.geometry);
    assert(coordinates.length > 0, `Feature needs coordinates: ${collectionId}:${index}`);
    for (const point of coordinates) {
      validateLonLat(point, `${collectionId}:${index}`);
    }
  }
}

function validateDatabase(db) {
  const minimumCounts = [
    ["sources", 1],
    ["persons", 1],
    ["person_roles", 1],
    ["person_life_events", 1],
    ["person_relations", 1],
    ["historical_events", 1],
    ["source_mentions", 1],
    ["entities", 1],
    ["events", 1],
    ["evidence_links", 1],
    ["app_runtime_datasets", 1],
    ["china_admin_blocks", 1],
    ["china_control_records", 1],
  ];

  for (const [tableName, minimum] of minimumCounts) {
    assert(scalarCount(db, tableName) >= minimum, `Expected ${tableName} to contain at least ${minimum} rows`);
  }

  const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
  assert(foreignKeyFailures.length === 0, `Foreign key check failed: ${JSON.stringify(foreignKeyFailures)}`);

  const personsWithoutNames = scalar(
    db,
    "SELECT COUNT(*) AS value FROM persons WHERE name IS NULL OR name = ''",
  );
  assert(personsWithoutNames === 0, "Every person needs a display name");

  const personsWithoutRoles = scalar(
    db,
    `
      SELECT COUNT(*) AS value
      FROM persons p
      LEFT JOIN person_roles r ON r.person_id = p.id
      WHERE r.person_id IS NULL
    `,
  );
  assert(personsWithoutRoles === 0, "Every person needs at least one role");

  const personsWithoutLifeEvents = scalar(
    db,
    `
      SELECT COUNT(*) AS value
      FROM persons p
      LEFT JOIN person_life_events e ON e.person_id = p.id
      WHERE e.person_id IS NULL
    `,
  );
  assert(personsWithoutLifeEvents === 0, "Every person needs at least one life event");

  const invalidYears = scalar(
    db,
    `
      SELECT COUNT(*) AS value
      FROM historical_events
      WHERE start_year IS NOT NULL
        AND end_year IS NOT NULL
        AND start_year > end_year
    `,
  );
  assert(invalidYears === 0, "Historical events cannot start after they end");

  const wiksourceUrls = scalar(
    db,
    "SELECT COUNT(*) AS value FROM sources WHERE url LIKE '%wikisource.org%'",
  );
  assert(wiksourceUrls === 0, "Sources must not use Wikisource URLs");

  const evidenceWithoutAnchor = scalar(
    db,
    `
      SELECT COUNT(*) AS value
      FROM evidence_links
      WHERE source_id IS NULL
        AND passage_id IS NULL
        AND mention_id IS NULL
        AND locator IS NULL
        AND quote IS NULL
    `,
  );
  assert(evidenceWithoutAnchor === 0, "Evidence links need at least one citation anchor");
}

function validateRuntimeDatasets(db) {
  const datasets = db.prepare("SELECT id, model, raw_json FROM app_runtime_datasets ORDER BY id").all();
  const byId = new Map(datasets.map((dataset) => [dataset.id, dataset]));

  const eventImportance = parseJson(byId.get("event-importance-180-280")?.raw_json, "app_runtime_datasets:event-importance-180-280");
  assert(eventImportance.model === "event-importance", "Unexpected event importance model");
  assert(eventImportanceValues.has(eventImportance.defaultImportance), `Unknown default event importance: ${eventImportance.defaultImportance}`);
  assert(Array.isArray(eventImportance.records), "Event importance records must be an array");

  const historicalEventIds = new Set(db.prepare("SELECT id FROM historical_events").all().map((row) => row.id));
  const importanceEventIds = new Set();
  for (const record of eventImportance.records) {
    assert(typeof record.eventId === "string" && record.eventId.length > 0, "Event importance record needs eventId");
    assert(!importanceEventIds.has(record.eventId), `Duplicate event importance record: ${record.eventId}`);
    importanceEventIds.add(record.eventId);
    assert(historicalEventIds.has(record.eventId), `Event importance uses unknown eventId: ${record.eventId}`);
    assert(eventImportanceValues.has(record.importance), `Unknown event importance: ${record.eventId}:${record.importance}`);
  }

  const regions = parseJson(byId.get("regions-180-280")?.raw_json, "app_runtime_datasets:regions-180-280");
  assert(Array.isArray(regions) && regions.length > 0, "Regions runtime dataset must be a non-empty array");

  for (const region of regions) {
    assert(typeof region.id === "string" && region.id.length > 0, "Region needs id");
    assert(Array.isArray(region.eras) && region.eras.length > 0, `Region needs eras: ${region.id}`);

    for (const era of region.eras) {
      const eraId = `${region.id}:${era.startYear}-${era.endYear}`;
      assert(Number.isInteger(era.startYear), `Era startYear must be an integer: ${eraId}`);
      assert(Number.isInteger(era.endYear), `Era endYear must be an integer: ${eraId}`);
      assert(era.startYear <= era.endYear, `Era starts after it ends: ${eraId}`);
      assert(boundaryTypes.has(era.boundaryType), `Unknown boundaryType: ${eraId}`);
      assert(confidenceValues.has(era.confidence), `Unknown confidence: ${eraId}`);

      if (era.boundary) {
        validateBoundary(era.boundary, eraId);
      }

      if (era.boundaryGroups) {
        assert(Array.isArray(era.boundaryGroups), `boundaryGroups must be an array: ${eraId}`);
        for (const group of era.boundaryGroups) {
          const groupId = `${eraId}:${group.id}`;
          assert(typeof group.id === "string" && group.id.length > 0, `Boundary group needs id: ${eraId}`);
          assert(boundaryTypes.has(group.boundaryType), `Unknown group boundaryType: ${groupId}`);
          assert(confidenceValues.has(group.confidence), `Unknown group confidence: ${groupId}`);
          validateBoundary(group.boundary, groupId);
        }
      }

      assert(era.boundary || era.boundaryGroups, `Era needs boundary or boundaryGroups: ${eraId}`);
    }
  }
}

function validateImportStagingSchema(db) {
  const requiredTables = [
    "import_batches",
    "import_draft_files",
    "import_evidence_cards",
  ];
  const requiredIndexes = [
    "idx_import_draft_files_batch_status",
    "idx_import_evidence_cards_batch_status",
    "idx_import_evidence_cards_source",
    "idx_import_evidence_cards_event",
    "idx_sources_review_corpus",
    "idx_source_passages_source_locator",
    "idx_source_mentions_locator",
    "idx_events_time_type",
    "idx_entities_civilization_type",
    "idx_evidence_links_source",
  ];

  for (const tableName of requiredTables) {
    const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
    assert(Boolean(exists), `Missing import staging table: ${tableName}`);
  }

  for (const indexName of requiredIndexes) {
    const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(indexName);
    assert(Boolean(exists), `Missing SQLite index: ${indexName}`);
  }
}

function validateDeferredMapJson() {
  validateLonLat(chinaMap.view.northWest, "chinaMap.view.northWest");
  validateLonLat(chinaMap.view.southEast, "chinaMap.view.southEast");

  assert(Array.isArray(chinaMap.eras) && chinaMap.eras.length > 0, "China map needs eras");
  for (const era of chinaMap.eras) {
    const eraId = `chinaMap:${era.startYear}-${era.endYear}`;
    assert(Number.isInteger(era.startYear), `China map era startYear must be an integer: ${eraId}`);
    assert(Number.isInteger(era.endYear), `China map era endYear must be an integer: ${eraId}`);
    assert(era.startYear <= era.endYear, `China map era starts after it ends: ${eraId}`);
    assert(Array.isArray(era.polities) && era.polities.length > 0, `China map era needs polities: ${eraId}`);

    for (const polity of era.polities) {
      assert(typeof polity.id === "string" && polity.id.length > 0, `China polity needs id: ${eraId}`);
      assert(boundaryTypes.has(polity.boundaryType), `Unknown polity boundaryType: ${polity.id}`);
      assert(confidenceValues.has(polity.confidence), `Unknown polity confidence: ${polity.id}`);
      validateLonLat(polity.capital, `${polity.id}:capital`);
      validateLonLat(polity.center, `${polity.id}:center`);
      validateBoundary(polity.boundary, polity.id);
    }

    for (const zone of era.frontierZones ?? []) {
      assert(boundaryTypes.has(zone.boundaryType), `Unknown frontier boundaryType: ${zone.id}`);
      assert(confidenceValues.has(zone.confidence), `Unknown frontier confidence: ${zone.id}`);
      validateBoundary(zone.boundary, zone.id);
    }
  }

  for (const city of chinaMap.cities) {
    validateLonLat(city.coordinates, city.id);
  }

  assert(naturalEarthChinaPhysical.license === "Public domain", "Natural Earth physical data license must be public domain");
  validateFeatureCollection(naturalEarthChinaPhysical.land, "naturalEarthChinaPhysical.land");
  validateFeatureCollection(naturalEarthChinaPhysical.rivers, "naturalEarthChinaPhysical.rivers");
  validateFeatureCollection(naturalEarthChinaPhysical.lakes, "naturalEarthChinaPhysical.lakes");
  validateFeatureCollection(naturalEarthChinaPhysical.geographyRegions, "naturalEarthChinaPhysical.geographyRegions");
}

assert(existsSync(dbPath), "Missing db/chronoatlas.sqlite. Run `npm run db:build` first.");

const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  validateDatabase(db);
  validateRuntimeDatasets(db);
  validateImportStagingSchema(db);
  validateDeferredMapJson();
} finally {
  db.close();
}

console.log("Data validation OK");
