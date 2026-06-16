import events from "../data/events-180-280.sample.json" with { type: "json" };
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
    assert(Array.isArray(point) && point.length === 2, `Boundary point must be [lon, lat]: ${boundaryId}`);
    assert(point[0] >= -180 && point[0] <= 180, `Longitude out of range: ${boundaryId}`);
    assert(point[1] >= -90 && point[1] <= 90, `Latitude out of range: ${boundaryId}`);
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

console.log("Data validation OK");
