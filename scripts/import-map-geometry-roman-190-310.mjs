import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");

const runtimeDatasetId = "roman-control-map-190-310";
const geometryDatasetId = "roman-province-map-190-310";
const controlDatasetId = "roman-province-control-timeline-190-310";
const coordinateSystem = "wgs84-lonlat";

function parseRawJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

function computeBbox(coordinates) {
  const points = collectPoints(coordinates);
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

function computeAreaHint(coordinates) {
  const rings = collectRings(coordinates);
  if (rings.length === 0) {
    return null;
  }
  return Number(rings.reduce((total, ring) => total + ringArea(ring), 0).toFixed(6));
}

function featureIdForProvince(provinceId) {
  return `roman-province:${provinceId}`;
}

function controllerIdForName(name) {
  return `${controlDatasetId}:controller:${name}`;
}

function runInsert(statement, values) {
  statement.run(...values.map((value) => value ?? null));
}

function assertHardIntegrity(data) {
  const errors = [];
  const provinceIds = new Set();
  const duplicateProvinceIds = [];

  for (const province of data.provinces ?? []) {
    if (provinceIds.has(province.id)) {
      duplicateProvinceIds.push(province.id);
    }
    provinceIds.add(province.id);

    if (!Number.isInteger(province.id) || !province.n) {
      errors.push(`Invalid province id/name: ${JSON.stringify(province)}`);
    }
    if (!isPoint([province.x, province.y])) {
      errors.push(`Invalid province center: ${province.id}`);
    }
    if (collectPoints(province.g).length === 0) {
      errors.push(`Invalid province geometry: ${province.id}`);
    }
  }

  if (duplicateProvinceIds.length > 0) {
    errors.push(`Duplicate province ids: ${duplicateProvinceIds.join(", ")}`);
  }

  for (const record of data.timeline ?? []) {
    if (!provinceIds.has(record.pid)) {
      errors.push(`Unresolved province in timeline: ${record.pid}`);
    }
    if (!record.ctrl || !record.color) {
      errors.push(`Missing controller/color in timeline: ${JSON.stringify(record)}`);
    }
    if (!Number.isInteger(record.start) || !Number.isInteger(record.end) || record.start > record.end) {
      errors.push(`Invalid control years for province ${record.pid}: ${record.start}-${record.end}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Roman 190-310 map geometry import blocked:\n${errors.slice(0, 20).join("\n")}`);
  }
}

const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA foreign_keys = ON;");

  const runtimeRow = db.prepare(`
    SELECT raw_json
    FROM app_runtime_datasets
    WHERE id = ?
  `).get(runtimeDatasetId);

  if (!runtimeRow) {
    throw new Error(`Missing runtime dataset: ${runtimeDatasetId}`);
  }

  const data = parseRawJson(runtimeRow.raw_json, {});
  assertHardIntegrity(data);

  const rangeStart = data.range?.[0] ?? 190;
  const rangeEnd = data.range?.[1] ?? 310;

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
      name_en,
      feature_type,
      admin_level,
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      confidence,
      approximate,
      review_status,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

  db.exec("BEGIN;");
  db.prepare("DELETE FROM map_control_datasets WHERE id = ?").run(controlDatasetId);
  db.prepare("DELETE FROM map_geometry_datasets WHERE id = ?").run(geometryDatasetId);

  runInsert(insertGeometryDataset, [
    geometryDatasetId,
    data.schemaVersion ?? 1,
    "province-fragment-map",
    null,
    null,
    null,
    "Roman province fragments 190-310",
    rangeStart,
    rangeEnd,
    coordinateSystem,
    "Roman province geometry migrated from runtime map seed.",
    "reviewed-runtime",
    JSON.stringify({
      schemaVersion: data.schemaVersion,
      generatedFrom: data.generatedFrom,
      model: data.model,
      range: data.range,
      keyYears: data.keyYears,
      notes: data.notes
    })
  ]);

  for (const province of data.provinces ?? []) {
    const featureId = featureIdForProvince(province.id);
    const bbox = computeBbox(province.g);
    const rings = collectRings(province.g);

    runInsert(insertFeature, [
      featureId,
      geometryDatasetId,
      province.n,
      province.n,
      "province_fragment",
      "province",
      province.x,
      province.y,
      province.x,
      province.y,
      bbox?.minLon,
      bbox?.minLat,
      bbox?.maxLon,
      bbox?.maxLat,
      computeAreaHint(province.g),
      "medium",
      0,
      "reviewed-runtime",
      province.family ?? null,
      JSON.stringify(province)
    ]);

    runInsert(insertGeometry, [
      `${featureId}:full`,
      featureId,
      "display",
      "Polygon",
      "full",
      coordinateSystem,
      JSON.stringify(province.g),
      bbox?.minLon,
      bbox?.minLat,
      bbox?.maxLon,
      bbox?.maxLat,
      bbox?.pointCount,
      rings.length,
      "medium",
      0,
      "reviewed-runtime",
      JSON.stringify({ sourceRuntimeDatasetId: runtimeDatasetId, provinceId: province.id })
    ]);

    runInsert(insertFeatureSource, [
      featureId,
      null,
      null,
      null,
      null,
      "Roman v5 province geometry runtime seed.",
      "geometry",
      0,
      "medium",
      JSON.stringify({ sourceRuntimeDatasetId: runtimeDatasetId })
    ]);
  }

  runInsert(insertControlDataset, [
    controlDatasetId,
    data.schemaVersion ?? 1,
    "control-timeline",
    geometryDatasetId,
    null,
    null,
    "Roman province control timeline 190-310",
    rangeStart,
    rangeEnd,
    JSON.stringify(data.keyYears ?? []),
    "reviewed-runtime",
    JSON.stringify({
      schemaVersion: data.schemaVersion,
      generatedFrom: data.generatedFrom,
      model: data.model,
      range: data.range,
      keyYears: data.keyYears
    })
  ]);

  const controllers = Array.from(
    new Map((data.timeline ?? []).map((record) => [record.ctrl, { label: record.ctrl, color: record.color }])).values()
  );
  controllers.forEach((controller, index) => {
    runInsert(insertController, [
      controllerIdForName(controller.label),
      controlDatasetId,
      controller.label,
      controller.color,
      controller.label === "Barbarian" ? "external" : "polity",
      index,
      JSON.stringify(controller)
    ]);
  });

  (data.timeline ?? []).forEach((record, index) => {
    const recordId = `${controlDatasetId}:record:${String(index + 1).padStart(4, "0")}`;
    runInsert(insertControlRecord, [
      recordId,
      controlDatasetId,
      featureIdForProvince(record.pid),
      controllerIdForName(record.ctrl),
      record.start,
      record.end,
      "effective-control",
      "medium",
      0,
      null,
      JSON.stringify(record)
    ]);
  });

  db.exec("COMMIT;");

  console.log(
    `Imported ${data.provinces?.length ?? 0} Roman province fragments, ${controllers.length} controllers, ${data.timeline?.length ?? 0} control records`
  );
} catch (error) {
  try {
    db.exec("ROLLBACK;");
  } catch {
    // Ignore rollback failure when the transaction was never opened.
  }
  throw error;
} finally {
  db.close();
}
