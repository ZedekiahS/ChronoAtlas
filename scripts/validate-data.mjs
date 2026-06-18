import events from "../data/events-180-280.sample.json" with { type: "json" };
import chinaBlocks from "../data/china-admin-blocks-190-280.json" with { type: "json" };
import chinaControlTimeline from "../data/china-block-control-timeline-190-280.json" with { type: "json" };
import chinaMap from "../data/china-three-kingdoms-map.json" with { type: "json" };
import chinaPersonLifeEvents from "../data/china-person-life-events.json" with { type: "json" };
import chinaPersonRelations from "../data/china-person-relations.json" with { type: "json" };
import chinaPersons from "../data/china-persons.json" with { type: "json" };
import chinaSources from "../data/china-sources.json" with { type: "json" };
import naturalEarthChinaPhysical from "../data/natural-earth-china-physical.json" with { type: "json" };
import regions from "../data/regions-180-280.json" with { type: "json" };

const regionIds = new Set(["china", "rome", "sasanian-persia", "india"]);
const boundaryTypes = new Set(["effective-control", "nominal", "cultural-influence"]);
const blockLevels = new Set(["province", "commandery", "county-seat"]);
const controlStatuses = new Set(["effective-control", "contested", "frontier", "nominal-control"]);
const confidenceValues = new Set(["high", "medium", "low"]);
const personLifeEventTypes = new Set([
  "abdication",
  "birth",
  "campaign",
  "death",
  "diplomacy",
  "later-tradition",
  "office",
  "politics",
  "service",
  "strategy",
  "turning-point",
]);
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
const requiredDeepDetailEventIds = new Set([
  "china-184-yellow-turban-rebellion",
  "china-189-dong-zhuo-enters-luoyang",
  "china-194-lu-bu-seizes-yan",
  "china-199-lu-bu-defeated",
  "china-200-guandu",
  "china-208-red-cliffs",
  "china-214-liu-bei-takes-yi",
  "china-215-cao-cao-takes-hanzhong",
  "china-219-hanzhong-and-jingzhou-crisis",
  "china-222-yiling",
  "china-234-wuzhang-plains",
  "china-263-shu-han-conquered",
  "china-265-jin-replaces-wei",
  "china-280-jin-conquers-wu",
]);

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

function validateSourceRefs(sourceRefs, refId, sourceIds) {
  assert(Array.isArray(sourceRefs) && sourceRefs.length > 0, `sourceRefs must be a non-empty array: ${refId}`);

  for (const [index, ref] of sourceRefs.entries()) {
    const itemId = `${refId}:${index}`;
    assert(ref && typeof ref === "object", `sourceRef must be an object: ${itemId}`);
    assert(typeof ref.sourceId === "string" && ref.sourceId.length > 0, `sourceRef needs sourceId: ${itemId}`);
    assert(sourceIds.has(ref.sourceId), `sourceRef uses unknown sourceId: ${itemId}:${ref.sourceId}`);

    if ("locator" in ref) {
      assert(typeof ref.locator === "string" && ref.locator.length > 0, `sourceRef locator must be string: ${itemId}`);
    }

    if ("note" in ref) {
      assert(typeof ref.note === "string" && ref.note.length > 0, `sourceRef note must be string: ${itemId}`);
    }
  }
}

function validateOptionalTextList(items, listId) {
  if (items === undefined) {
    return false;
  }

  assert(Array.isArray(items) && items.length > 0, `Detail list must be a non-empty array: ${listId}`);
  for (const [index, item] of items.entries()) {
    assert(typeof item === "string" && item.length > 0, `Detail list item must be string: ${listId}:${index}`);
  }

  return true;
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

assert(Array.isArray(chinaSources) && chinaSources.length > 0, "China sources must be a non-empty array");
const sourceIds = new Set();

for (const source of chinaSources) {
  assert(typeof source.id === "string" && source.id.length > 0, "Source needs id");
  assert(!sourceIds.has(source.id), `Duplicate source id: ${source.id}`);
  sourceIds.add(source.id);
  assert(typeof source.title === "string" && source.title.length > 0, `Source needs title: ${source.id}`);
  assert(typeof source.author === "string" && source.author.length > 0, `Source needs author: ${source.id}`);
  assert(typeof source.type === "string" && source.type.length > 0, `Source needs type: ${source.id}`);
  assert(typeof source.citationShort === "string" && source.citationShort.length > 0, `Source needs citationShort: ${source.id}`);
  assert(typeof source.note === "string" && source.note.length > 0, `Source needs note: ${source.id}`);
}

assert(Array.isArray(chinaPersons) && chinaPersons.length > 0, "China persons must be a non-empty array");
const personIds = new Set();

for (const person of chinaPersons) {
  assert(typeof person.id === "string" && person.id.length > 0, "Person needs id");
  assert(!personIds.has(person.id), `Duplicate person id: ${person.id}`);
  personIds.add(person.id);
  assert(typeof person.name === "string" && person.name.length > 0, `Person needs name: ${person.id}`);
  assert(person.courtesyName === null || typeof person.courtesyName === "string", `Invalid courtesyName: ${person.id}`);
  assert(person.life === null || typeof person.life === "string", `Invalid life: ${person.id}`);
  assert(typeof person.primaryPolity === "string" && person.primaryPolity.length > 0, `Person needs primaryPolity: ${person.id}`);
  assert(Array.isArray(person.roles) && person.roles.length > 0, `Person needs roles: ${person.id}`);
  for (const role of person.roles) {
    assert(typeof role === "string" && role.length > 0, `Person role must be string: ${person.id}`);
  }
  assert(typeof person.summary === "string" && person.summary.length > 0, `Person needs summary: ${person.id}`);
  validateSourceRefs(person.sourceRefs, `${person.id}:sourceRefs`, sourceIds);
}

assert(Array.isArray(chinaPersonRelations), "China person relations must be an array");
const relationIds = new Set();

for (const relation of chinaPersonRelations) {
  assert(typeof relation.id === "string" && relation.id.length > 0, "Relation needs id");
  assert(!relationIds.has(relation.id), `Duplicate relation id: ${relation.id}`);
  relationIds.add(relation.id);
  assert(personIds.has(relation.sourcePersonId), `Relation uses unknown sourcePersonId: ${relation.id}`);
  assert(personIds.has(relation.targetPersonId), `Relation uses unknown targetPersonId: ${relation.id}`);
  assert(relation.sourcePersonId !== relation.targetPersonId, `Relation cannot point to itself: ${relation.id}`);
  assert(typeof relation.type === "string" && relation.type.length > 0, `Relation needs type: ${relation.id}`);
  if ("startYear" in relation) {
    assert(Number.isInteger(relation.startYear), `Relation startYear must be an integer: ${relation.id}`);
  }
  if ("endYear" in relation) {
    assert(Number.isInteger(relation.endYear), `Relation endYear must be an integer: ${relation.id}`);
  }
  if ("startYear" in relation && "endYear" in relation) {
    assert(relation.startYear <= relation.endYear, `Relation starts after it ends: ${relation.id}`);
  }
  assert(typeof relation.summary === "string" && relation.summary.length > 0, `Relation needs summary: ${relation.id}`);
  validateSourceRefs(relation.sourceRefs, `${relation.id}:sourceRefs`, sourceIds);
}

assert(Array.isArray(chinaPersonLifeEvents), "China person life events must be an array");
const lifeEventIds = new Set();
const lifeEventsByPersonId = new Map();

const eventIds = new Set();

for (const event of events) {
  assert(typeof event.id === "string" && event.id.length > 0, "Event needs id");
  assert(!eventIds.has(event.id), `Duplicate event id: ${event.id}`);
  eventIds.add(event.id);
  assert(regionIds.has(event.region), `Unknown event region: ${event.id}`);
  assert(Number.isInteger(event.startYear), `Event startYear must be an integer: ${event.id}`);
  assert(Number.isInteger(event.endYear), `Event endYear must be an integer: ${event.id}`);
  assert(event.startYear <= event.endYear, `Event starts after it ends: ${event.id}`);
  assert(Array.isArray(event.people), `Event people must be an array: ${event.id}`);
  assert(Array.isArray(event.polities) && event.polities.length > 0, `Event needs polities: ${event.id}`);
  assert(Array.isArray(event.relatedEvents), `Event relatedEvents must be an array: ${event.id}`);
  assert(Array.isArray(event.tags), `Event tags must be an array: ${event.id}`);
  assert(confidenceValues.has(event.confidence), `Unknown event confidence: ${event.id}`);
  validateSources(event.sources, `${event.id}:sources`);

  if (event.personIds) {
    assert(Array.isArray(event.personIds), `Event personIds must be an array: ${event.id}`);
    for (const personId of event.personIds) {
      assert(personIds.has(personId), `Event uses unknown personId: ${event.id}:${personId}`);
    }
  }

  if (event.sourceRefs) {
    validateSourceRefs(event.sourceRefs, `${event.id}:sourceRefs`, sourceIds);
  }

  if (event.detail) {
    assert(typeof event.detail === "object", `Event detail must be an object: ${event.id}`);
    const detailFields = ["background", "process", "result", "impact", "sourceNotes", "uncertainty"];
    const presentFields = detailFields.filter((field) => validateOptionalTextList(event.detail[field], `${event.id}:detail:${field}`));
    assert(presentFields.length > 0, `Event detail needs at least one populated field: ${event.id}`);
  }
}

for (const lifeEvent of chinaPersonLifeEvents) {
  assert(typeof lifeEvent.id === "string" && lifeEvent.id.length > 0, "Life event needs id");
  assert(!lifeEventIds.has(lifeEvent.id), `Duplicate life event id: ${lifeEvent.id}`);
  lifeEventIds.add(lifeEvent.id);
  assert(personIds.has(lifeEvent.personId), `Life event uses unknown personId: ${lifeEvent.id}:${lifeEvent.personId}`);
  assert(Number.isInteger(lifeEvent.year) || lifeEvent.year === null, `Life event year must be integer or null: ${lifeEvent.id}`);
  if ("endYear" in lifeEvent) {
    assert(Number.isInteger(lifeEvent.endYear) || lifeEvent.endYear === null, `Life event endYear must be integer or null: ${lifeEvent.id}`);
  }
  if (Number.isInteger(lifeEvent.year) && Number.isInteger(lifeEvent.endYear)) {
    assert(lifeEvent.year <= lifeEvent.endYear, `Life event starts after it ends: ${lifeEvent.id}`);
  }
  assert(typeof lifeEvent.displayYear === "string" && lifeEvent.displayYear.length > 0, `Life event needs displayYear: ${lifeEvent.id}`);
  assert(personLifeEventTypes.has(lifeEvent.type), `Unknown life event type: ${lifeEvent.id}:${lifeEvent.type}`);
  assert(typeof lifeEvent.title === "string" && lifeEvent.title.length > 0, `Life event needs title: ${lifeEvent.id}`);
  assert(typeof lifeEvent.summary === "string" && lifeEvent.summary.length > 0, `Life event needs summary: ${lifeEvent.id}`);
  assert(Array.isArray(lifeEvent.relatedEventIds), `Life event relatedEventIds must be an array: ${lifeEvent.id}`);
  assert(confidenceValues.has(lifeEvent.confidence), `Unknown life event confidence: ${lifeEvent.id}`);
  validateSourceRefs(lifeEvent.sourceRefs, `${lifeEvent.id}:sourceRefs`, sourceIds);

  for (const relatedEventId of lifeEvent.relatedEventIds) {
    assert(eventIds.has(relatedEventId), `Life event uses unknown relatedEventId: ${lifeEvent.id}:${relatedEventId}`);
  }

  const personLifeEvents = lifeEventsByPersonId.get(lifeEvent.personId) ?? [];
  personLifeEvents.push(lifeEvent);
  lifeEventsByPersonId.set(lifeEvent.personId, personLifeEvents);
}

for (const personId of personIds) {
  assert(lifeEventsByPersonId.has(personId), `Person has no life events: ${personId}`);
}

for (const event of events) {
  for (const relatedId of event.relatedEvents) {
    assert(eventIds.has(relatedId), `Event uses unknown relatedEvent: ${event.id}:${relatedId}`);
  }
}

for (const eventId of requiredDeepDetailEventIds) {
  const event = events.find((item) => item.id === eventId);
  assert(event?.detail, `Missing required deep event detail: ${eventId}`);
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
