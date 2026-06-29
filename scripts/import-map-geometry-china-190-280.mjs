import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const adminPath = path.join(rootDir, "data", "china-admin-blocks-190-280.json");
const supplementalPath = path.join(rootDir, "data", "china-commandery-supplemental-blocks.json");
const controlPath = path.join(rootDir, "data", "china-block-control-timeline-190-280.json");

const geometryDatasetId = "china-admin-block-map-190-280";
const controlDatasetId = "china-block-control-timeline-190-280";

function loadJson(filePath) {
  return readFile(filePath, "utf8").then((text) => JSON.parse(text));
}

function isPoint(value) {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === "number"
    && typeof value[1] === "number"
    && Number.isFinite(value[0])
    && Number.isFinite(value[1]);
}

function collectPoints(value, points = []) {
  if (isPoint(value)) {
    points.push(value);
    return points;
  }
  if (Array.isArray(value)) {
    for (const child of value) {
      collectPoints(child, points);
    }
  }
  return points;
}

function collectRings(value, rings = []) {
  if (Array.isArray(value) && value.length > 0 && value.every(isPoint)) {
    rings.push(value);
    return rings;
  }
  if (Array.isArray(value)) {
    for (const child of value) {
      collectRings(child, rings);
    }
  }
  return rings;
}

function computeBbox(geometry) {
  const points = collectPoints(geometry?.coordinates);
  if (points.length === 0) {
    return null;
  }
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of points) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLon, minLat, maxLon, maxLat, pointCount: points.length };
}

function ringArea(ring) {
  if (ring.length < 3) {
    return 0;
  }
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area) / 2;
}

function computeAreaHint(geometry) {
  const rings = collectRings(geometry?.coordinates);
  if (rings.length === 0) {
    return null;
  }
  return Number(rings.reduce((total, ring) => total + ringArea(ring), 0).toFixed(6));
}

function assertHardIntegrity({ allBlocks, controlDataset }) {
  const ids = new Set();
  const duplicateIds = [];
  for (const block of allBlocks) {
    if (ids.has(block.id)) {
      duplicateIds.push(block.id);
    }
    ids.add(block.id);
  }

  const controllerIds = new Set((controlDataset.controllers ?? []).map((controller) => controller.id));
  const errors = [];

  if (duplicateIds.length > 0) {
    errors.push(`Duplicate feature ids: ${duplicateIds.join(", ")}`);
  }

  for (const block of allBlocks) {
    if (!block.id || !block.name) {
      errors.push(`Missing id/name: ${JSON.stringify(block)}`);
    }
    if (!block.geometry?.type || collectPoints(block.geometry?.coordinates).length === 0) {
      errors.push(`Invalid geometry: ${block.id}`);
    }
    if (block.controlBlockId && !ids.has(block.controlBlockId)) {
      errors.push(`Unresolved controlBlockId for ${block.id}: ${block.controlBlockId}`);
    }
  }

  for (const record of controlDataset.records ?? []) {
    if (!ids.has(record.blockId)) {
      errors.push(`Unresolved control block: ${record.blockId}`);
    }
    if (!controllerIds.has(record.controller)) {
      errors.push(`Unresolved controller for ${record.blockId}: ${record.controller}`);
    }
    if (!Number.isInteger(record.startYear) || !Number.isInteger(record.endYear) || record.startYear > record.endYear) {
      errors.push(`Invalid control years for ${record.blockId}: ${record.startYear}-${record.endYear}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`China 190-280 map geometry import blocked:\n${errors.slice(0, 20).join("\n")}`);
  }
}

function controllerPrimaryId(controllerId) {
  return `${controlDatasetId}:controller:${controllerId}`;
}

function runInsert(statement, values) {
  statement.run(...values.map((value) => value ?? null));
}

const [adminDataset, supplementalDataset, controlDataset] = await Promise.all([
  loadJson(adminPath),
  loadJson(supplementalPath),
  loadJson(controlPath),
]);

const adminBlocks = (adminDataset.blocks ?? []).map((block) => ({ ...block, featureType: "admin_block" }));
const supplementalBlocks = (supplementalDataset.blocks ?? []).map((block) => ({
  ...block,
  featureType: "admin_block_fragment",
  fragmentNote: supplementalDataset.notes ?? null,
}));
const allBlocks = [...adminBlocks, ...supplementalBlocks];
const featureIds = new Set(allBlocks.map((block) => block.id));

assertHardIntegrity({ allBlocks, controlDataset });

const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA foreign_keys = ON;");

  const insertGeometryDataset = db.prepare(`
    INSERT INTO map_geometry_datasets (
      id,
      schema_version,
      model,
      region_id,
      period_id,
      civilization_id,
      label,
      time_start,
      time_end,
      coordinate_system,
      source_note,
      review_status,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFeature = db.prepare(`
    INSERT INTO map_features (
      id,
      dataset_id,
      name,
      name_zh,
      feature_type,
      admin_level,
      parent_feature_id,
      control_feature_id,
      center_lon,
      center_lat,
      label_lon,
      label_lat,
      min_lon,
      min_lat,
      max_lon,
      max_lat,
      area_hint,
      confidence,
      approximate,
      review_status,
      notes,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGeometry = db.prepare(`
    INSERT INTO map_feature_geometries (
      id,
      feature_id,
      geometry_role,
      geometry_type,
      simplification_level,
      coordinate_system,
      coordinates_json,
      min_lon,
      min_lat,
      max_lon,
      max_lat,
      point_count,
      ring_count,
      source_feature_id,
      confidence,
      approximate,
      review_status,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFeatureSource = db.prepare(`
    INSERT INTO map_feature_sources (
      feature_id,
      source_id,
      passage_id,
      mention_id,
      locator,
      note,
      source_role,
      sort_order,
      confidence,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertControlDataset = db.prepare(`
    INSERT INTO map_control_datasets (
      id,
      schema_version,
      model,
      geometry_dataset_id,
      region_id,
      period_id,
      label,
      time_start,
      time_end,
      key_years_json,
      review_status,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertController = db.prepare(`
    INSERT INTO map_controllers (
      id,
      control_dataset_id,
      label,
      color,
      controller_type,
      sort_order,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertControlRecord = db.prepare(`
    INSERT INTO map_control_records (
      id,
      control_dataset_id,
      feature_id,
      controller_id,
      start_year,
      end_year,
      status,
      confidence,
      approximate,
      source_note,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertControlRecordSource = db.prepare(`
    INSERT INTO map_control_record_sources (
      control_record_id,
      source_id,
      passage_id,
      mention_id,
      locator,
      note,
      sort_order,
      confidence,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN;");
  db.prepare("DELETE FROM map_control_datasets WHERE id = ?").run(controlDatasetId);
  db.prepare("DELETE FROM map_geometry_datasets WHERE id = ?").run(geometryDatasetId);

  runInsert(insertGeometryDataset, [
    geometryDatasetId,
    adminDataset.schemaVersion ?? 1,
    "admin-block-map",
    null,
    null,
    null,
    "China commandery geometry 190-280",
    adminDataset.range?.[0] ?? 190,
    adminDataset.range?.[1] ?? 280,
    adminDataset.coordinateSystem ?? "wgs84-lonlat",
    adminDataset.notes ?? null,
    "reviewed-runtime",
    JSON.stringify({
      admin: {
        schemaVersion: adminDataset.schemaVersion,
        model: adminDataset.model,
        range: adminDataset.range,
        coordinateSystem: adminDataset.coordinateSystem,
        notes: adminDataset.notes,
      },
      supplemental: {
        schemaVersion: supplementalDataset.schemaVersion,
        model: supplementalDataset.model,
        notes: supplementalDataset.notes,
      },
    }),
  ]);

  for (const block of allBlocks) {
    const bbox = computeBbox(block.geometry);
    const rings = collectRings(block.geometry?.coordinates);
    const centerLon = isPoint(block.center) ? block.center[0] : null;
    const centerLat = isPoint(block.center) ? block.center[1] : null;
    const isSupplemental = block.featureType === "admin_block_fragment";

    runInsert(insertFeature, [
      block.id,
      geometryDatasetId,
      block.name,
      block.name,
      block.featureType,
      block.level,
      featureIds.has(block.parent) ? block.parent : null,
      block.controlBlockId ?? null,
      centerLon,
      centerLat,
      centerLon,
      centerLat,
      bbox?.minLon,
      bbox?.minLat,
      bbox?.maxLon,
      bbox?.maxLat,
      computeAreaHint(block.geometry),
      block.confidence ?? "medium",
      block.approximate ? 1 : 0,
      "reviewed-runtime",
      block.fragmentNote ?? null,
      JSON.stringify(block),
    ]);

    runInsert(insertGeometry, [
      `${block.id}:full`,
      block.id,
      isSupplemental ? "display-fragment" : "display",
      block.geometry.type,
      "full",
      adminDataset.coordinateSystem ?? "wgs84-lonlat",
      JSON.stringify(block.geometry.coordinates),
      bbox?.minLon,
      bbox?.minLat,
      bbox?.maxLon,
      bbox?.maxLat,
      bbox?.pointCount,
      rings.length,
      block.controlBlockId ?? null,
      block.confidence ?? "medium",
      block.approximate ? 1 : 0,
      "reviewed-runtime",
      JSON.stringify(block.geometry),
    ]);

    for (const [index, source] of (block.sources ?? []).entries()) {
      runInsert(insertFeatureSource, [
        block.id,
        null,
        null,
        null,
        null,
        source,
        isSupplemental ? "supplemental-geometry" : "geometry",
        index,
        block.confidence ?? "medium",
        JSON.stringify({ source }),
      ]);
    }
  }

  runInsert(insertControlDataset, [
    controlDatasetId,
    controlDataset.schemaVersion ?? 1,
    "control-timeline",
    geometryDatasetId,
    null,
    null,
    "China commandery control timeline 190-280",
    controlDataset.range?.[0] ?? 190,
    controlDataset.range?.[1] ?? 280,
    JSON.stringify(controlDataset.keyYears ?? []),
    "reviewed-runtime",
    JSON.stringify({
      schemaVersion: controlDataset.schemaVersion,
      model: controlDataset.model,
      range: controlDataset.range,
      keyYears: controlDataset.keyYears,
    }),
  ]);

  for (const [index, controller] of (controlDataset.controllers ?? []).entries()) {
    runInsert(insertController, [
      controllerPrimaryId(controller.id),
      controlDatasetId,
      controller.id,
      controller.color,
      null,
      index,
      JSON.stringify(controller),
    ]);
  }

  for (const [index, record] of (controlDataset.records ?? []).entries()) {
    const recordId = `${controlDatasetId}:record:${String(index + 1).padStart(4, "0")}`;
    runInsert(insertControlRecord, [
      recordId,
      controlDatasetId,
      record.blockId,
      controllerPrimaryId(record.controller),
      record.startYear,
      record.endYear,
      record.status,
      record.confidence ?? "medium",
      record.approximate ? 1 : 0,
      (record.sources ?? []).join("; "),
      JSON.stringify(record),
    ]);

    for (const [sourceIndex, source] of (record.sources ?? []).entries()) {
      runInsert(insertControlRecordSource, [
        recordId,
        null,
        null,
        null,
        null,
        source,
        sourceIndex,
        record.confidence ?? "medium",
        JSON.stringify({ source }),
      ]);
    }
  }

  db.exec("COMMIT;");

  console.log(`Imported ${allBlocks.length} China 190-280 map features.`);
  console.log(`Imported ${controlDataset.controllers?.length ?? 0} controllers and ${controlDataset.records?.length ?? 0} control records.`);
} catch (error) {
  try {
    db.exec("ROLLBACK;");
  } catch {
    // Ignore rollback errors from failures before BEGIN.
  }
  throw error;
} finally {
  db.close();
}
