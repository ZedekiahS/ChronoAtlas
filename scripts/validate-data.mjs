import events from "../data/events-180-280.sample.json" with { type: "json" };
import chinaMap from "../data/china-three-kingdoms-map.json" with { type: "json" };
import naturalEarthChinaPhysical from "../data/natural-earth-china-physical.json" with { type: "json" };
import regions from "../data/regions-180-280.json" with { type: "json" };

const regionIds = new Set(["china", "rome", "sasanian-persia", "india"]);
const boundaryTypes = new Set(["effective-control", "nominal", "cultural-influence"]);
const confidenceValues = new Set(["high", "medium", "low"]);

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

console.log("Data validation OK");
