import events from "../data/events-180-280.sample.json" with { type: "json" };
import chinaBlocks from "../data/china-admin-blocks-190-280.json" with { type: "json" };
import chinaControlTimeline from "../data/china-block-control-timeline-190-280.json" with { type: "json" };
import chinaMap from "../data/china-three-kingdoms-map.json" with { type: "json" };
import naturalEarthChinaPhysical from "../data/natural-earth-china-physical.json" with { type: "json" };
import regions from "../data/regions-180-280.json" with { type: "json" };

const regionIds = new Set(["china", "rome", "sasanian-persia", "india"]);
const boundaryTypes = new Set(["effective-control", "nominal", "cultural-influence"]);
const blockLevels = new Set(["province", "commandery", "county-seat"]);
const controlStatuses = new Set(["effective-control", "contested", "frontier", "nominal-control"]);
const confidenceValues = new Set(["high", "medium", "low"]);
const requiredChinaBlockIds = new Set([
  "ji-zhou",
  "you-zhou",
  "bing-zhou",
  "qing-zhou",
  "yan-zhou",
  "yu-zhou",
  "xu-zhou",
  "sili",
  "yong-zhou",
  "liang-zhou",
  "jing-zhou",
  "yang-zhou",
  "huainan",
  "yi-zhou",
  "jiao-zhou",
  "hanzhong",
  "liaodong",
]);
const requiredControllers = new Set([
  "袁绍",
  "袁术",
  "曹操",
  "刘表",
  "吕布",
  "公孙瓒",
  "张鲁",
  "刘璋",
  "曹魏",
  "蜀汉",
  "孙吴",
  "西晋",
]);
const requiredChinaKeyYears = [190, 195, 200, 208, 220, 229, 234, 263, 265, 280];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

function validateLonLat(point, pointId) {
  assert(Array.isArray(point) && point.length === 2, `Point must be [lon, lat]: ${pointId}`);
  assert(point[0] >= -180 && point[0] <= 180, `Longitude out of range: ${pointId}`);
  assert(point[1] >= -90 && point[1] <= 90, `Latitude out of range: ${pointId}`);
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

function validateSources(sources, sourceId) {
  assert(Array.isArray(sources) && sources.length > 0, `Sources must be a non-empty array: ${sourceId}`);
  for (const [index, source] of sources.entries()) {
    assert(typeof source === "string" && source.length > 0, `Source must be a string: ${sourceId}:${index}`);
  }
}

function validatePolygonGeometry(geometry, geometryId) {
  assert(geometry?.type === "Polygon", `Expected Polygon geometry: ${geometryId}`);
  assert(Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0, `Polygon needs rings: ${geometryId}`);

  for (const [ringIndex, ring] of geometry.coordinates.entries()) {
    assert(Array.isArray(ring) && ring.length >= 4, `Polygon ring needs at least 4 points: ${geometryId}:${ringIndex}`);
    const first = ring[0];
    const last = ring[ring.length - 1];
    assert(first[0] === last[0] && first[1] === last[1], `Polygon ring must be closed: ${geometryId}:${ringIndex}`);

    for (const point of ring) {
      validateLonLat(point, `${geometryId}:${ringIndex}`);
    }
  }
}

function normalizeEdge(start, end) {
  const left = `${start[0]},${start[1]}`;
  const right = `${end[0]},${end[1]}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function getPolygonEdges(geometry) {
  const edges = [];
  for (const ring of geometry.coordinates) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      edges.push(normalizeEdge(ring[index], ring[index + 1]));
    }
  }
  return edges;
}

function isPointOnSegment(point, start, end) {
  const cross = (point[1] - start[1]) * (end[0] - start[0]) - (point[0] - start[0]) * (end[1] - start[1]);
  if (Math.abs(cross) > 1e-9) {
    return false;
  }

  return (
    point[0] >= Math.min(start[0], end[0]) &&
    point[0] <= Math.max(start[0], end[0]) &&
    point[1] >= Math.min(start[1], end[1]) &&
    point[1] <= Math.max(start[1], end[1])
  );
}

function isPointInPolygon(point, geometry) {
  let inside = false;
  const ring = geometry.coordinates[0];

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];

    if (isPointOnSegment(point, previousPoint, currentPoint)) {
      return true;
    }

    const intersects =
      currentPoint[1] > point[1] !== previousPoint[1] > point[1] &&
      point[0] <
        ((previousPoint[0] - currentPoint[0]) * (point[1] - currentPoint[1])) /
          (previousPoint[1] - currentPoint[1]) +
          currentPoint[0];

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

for (const event of events) {
  assert(regionIds.has(event.region), `Unknown event region: ${event.id}`);
  assert(Number.isInteger(event.startYear), `Event startYear must be an integer: ${event.id}`);
  assert(Number.isInteger(event.endYear), `Event endYear must be an integer: ${event.id}`);
  assert(event.startYear <= event.endYear, `Event starts after it ends: ${event.id}`);
}

for (const region of regions) {
  assert(regionIds.has(region.id), `Unknown region id: ${region.id}`);
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
        assert(typeof group.label === "string" && group.label.length > 0, `Boundary group needs label: ${groupId}`);
        assert(boundaryTypes.has(group.boundaryType), `Unknown group boundaryType: ${groupId}`);
        assert(confidenceValues.has(group.confidence), `Unknown group confidence: ${groupId}`);
        validateBoundary(group.boundary, groupId);
      }
    }

    assert(era.boundary || era.boundaryGroups, `Era needs boundary or boundaryGroups: ${eraId}`);
  }
}

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
    assert(typeof polity.label === "string" && polity.label.length > 0, `China polity needs label: ${polity.id}`);
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

assert(chinaBlocks.model === "china-admin-block-map", "Unexpected China block map model");
assert(Array.isArray(chinaBlocks.blocks) && chinaBlocks.blocks.length > 0, "China block map needs blocks");
const chinaBlockIds = new Set();
const chinaBlockEdgeOwners = new Map();

for (const block of chinaBlocks.blocks) {
  assert(typeof block.id === "string" && block.id.length > 0, "China block needs id");
  assert(!chinaBlockIds.has(block.id), `Duplicate China block id: ${block.id}`);
  chinaBlockIds.add(block.id);
  assert(typeof block.name === "string" && block.name.length > 0, `China block needs name: ${block.id}`);
  assert(blockLevels.has(block.level), `Unknown China block level: ${block.id}`);
  assert(block.parent === null || typeof block.parent === "string", `Invalid China block parent: ${block.id}`);
  validateLonLat(block.center, `${block.id}:center`);
  validatePolygonGeometry(block.geometry, `${block.id}:geometry`);
  for (const edge of getPolygonEdges(block.geometry)) {
    const owners = chinaBlockEdgeOwners.get(edge) ?? [];
    owners.push(block.id);
    chinaBlockEdgeOwners.set(edge, owners);
  }
  assert(confidenceValues.has(block.confidence), `Unknown China block confidence: ${block.id}`);
  assert(typeof block.approximate === "boolean", `China block approximate must be boolean: ${block.id}`);
  validateSources(block.sources, `${block.id}:sources`);
}

for (const block of chinaBlocks.blocks) {
  const sharedEdgeCount = getPolygonEdges(block.geometry).filter((edge) => (chinaBlockEdgeOwners.get(edge) ?? []).length > 1).length;
  assert(sharedEdgeCount > 0, `China admin block has no shared boundary edge: ${block.id}`);
}

for (let lon = 92.25; lon <= 129.75; lon += 0.5) {
  for (let lat = 20.25; lat <= 43.75; lat += 0.5) {
    const owners = chinaBlocks.blocks.filter((block) => isPointInPolygon([lon, lat], block.geometry)).map((block) => block.id);
    assert(owners.length <= 1, `China admin blocks overlap near ${lon},${lat}: ${owners.join(", ")}`);
  }
}

for (const blockId of requiredChinaBlockIds) {
  assert(chinaBlockIds.has(blockId), `Missing required China block: ${blockId}`);
}

assert(chinaControlTimeline.model === "china-block-control-timeline", "Unexpected China control timeline model");
assert(Array.isArray(chinaControlTimeline.controllers) && chinaControlTimeline.controllers.length > 0, "China control timeline needs controllers");
const controllerIds = new Set();

for (const controller of chinaControlTimeline.controllers) {
  assert(typeof controller.id === "string" && controller.id.length > 0, "Controller needs id");
  assert(!controllerIds.has(controller.id), `Duplicate controller id: ${controller.id}`);
  controllerIds.add(controller.id);
  assert(/^#[0-9a-f]{6}$/i.test(controller.color), `Controller color must be #rrggbb: ${controller.id}`);
}

for (const controller of requiredControllers) {
  assert(controllerIds.has(controller), `Missing required controller: ${controller}`);
}

assert(Array.isArray(chinaControlTimeline.records) && chinaControlTimeline.records.length > 0, "China control timeline needs records");

for (const record of chinaControlTimeline.records) {
  const recordId = `${record.blockId}:${record.startYear}-${record.endYear}`;
  assert(chinaBlockIds.has(record.blockId), `Control record uses unknown blockId: ${recordId}`);
  assert(Number.isInteger(record.startYear), `Control startYear must be an integer: ${recordId}`);
  assert(Number.isInteger(record.endYear), `Control endYear must be an integer: ${recordId}`);
  assert(record.startYear <= record.endYear, `Control record starts after it ends: ${recordId}`);
  assert(controllerIds.has(record.controller), `Control record uses unknown controller: ${recordId}`);
  assert(controlStatuses.has(record.status), `Unknown control status: ${recordId}`);
  assert(confidenceValues.has(record.confidence), `Unknown control confidence: ${recordId}`);
  validateSources(record.sources, `${recordId}:sources`);
}

for (const year of requiredChinaKeyYears) {
  assert(chinaControlTimeline.keyYears.includes(year), `China control timeline missing key year: ${year}`);

  for (const blockId of chinaBlockIds) {
    const matches = chinaControlTimeline.records.filter(
      (record) => record.blockId === blockId && record.startYear <= year && record.endYear >= year,
    );
    assert(matches.length === 1, `Expected exactly one control record for ${blockId} in ${year}, found ${matches.length}`);
  }
}

console.log("Data validation OK");
