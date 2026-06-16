import fs from "node:fs/promises";
import bboxClip from "@turf/bbox-clip";

const naturalEarthBase =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const outputPath = new URL("../data/natural-earth-china-physical.json", import.meta.url);
const coordinatePrecision = 4;
const simplifyTolerance = 0.025;
const bbox = {
  west: 76,
  south: 15,
  east: 134,
  north: 51,
};

const sources = {
  rivers: `${naturalEarthBase}/ne_10m_rivers_lake_centerlines.geojson`,
  lakes: `${naturalEarthBase}/ne_10m_lakes.geojson`,
  geographyRegions: `${naturalEarthBase}/ne_10m_geography_regions_polys.geojson`,
  land: `${naturalEarthBase}/ne_10m_land.geojson`,
};

function isLonLat(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

function collectCoordinates(coordinates, collected = []) {
  if (isLonLat(coordinates)) {
    collected.push(coordinates);
    return collected;
  }

  if (Array.isArray(coordinates)) {
    for (const child of coordinates) {
      collectCoordinates(child, collected);
    }
  }

  return collected;
}

function pointInBbox(point) {
  const [lon, lat] = point;
  return lon >= bbox.west && lon <= bbox.east && lat >= bbox.south && lat <= bbox.north;
}

function featureTouchesBbox(feature) {
  if (!feature.geometry) {
    return false;
  }

  return collectCoordinates(feature.geometry.coordinates).some(pointInBbox);
}

function keepProperties(properties, keys) {
  return Object.fromEntries(keys.map((key) => [key, properties?.[key]]).filter(([, value]) => value != null));
}

function roundNumber(value) {
  return Number(value.toFixed(coordinatePrecision));
}

function squaredDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function squaredSegmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = Math.max(0, Math.min(1, ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy)));
    x += dx * t;
    y += dy * t;
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyLine(points, tolerance = simplifyTolerance) {
  if (points.length <= 2) {
    return points.map(roundPoint);
  }

  const simplified = [points[0]];
  simplifyDouglasPeucker(points, 0, points.length - 1, tolerance * tolerance, simplified);
  simplified.push(points[points.length - 1]);

  return simplified.map(roundPoint);
}

function simplifyDouglasPeucker(points, first, last, toleranceSquared, simplified) {
  let maxDistance = toleranceSquared;
  let index = -1;

  for (let i = first + 1; i < last; i += 1) {
    const distance = squaredSegmentDistance(points[i], points[first], points[last]);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (index > -1) {
    simplifyDouglasPeucker(points, first, index, toleranceSquared, simplified);
    simplified.push(points[index]);
    simplifyDouglasPeucker(points, index, last, toleranceSquared, simplified);
  }
}

function roundPoint(point) {
  return [roundNumber(point[0]), roundNumber(point[1])];
}

function simplifyRing(points) {
  if (points.length <= 4) {
    return points.map(roundPoint);
  }

  const withoutClosingPoint = points.slice(0, -1);
  const simplified = simplifyLine(withoutClosingPoint, simplifyTolerance);
  const closed = simplified.length >= 3 ? simplified : withoutClosingPoint.slice(0, 3).map(roundPoint);
  closed.push([...closed[0]]);
  return closed;
}

function simplifyGeometry(geometry) {
  if (!geometry) {
    return geometry;
  }

  if (geometry.type === "LineString") {
    return {
      ...geometry,
      coordinates: simplifyLine(geometry.coordinates),
    };
  }

  if (geometry.type === "MultiLineString") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((line) => simplifyLine(line)),
    };
  }

  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring) => simplifyRing(ring)),
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) => polygon.map((ring) => simplifyRing(ring))),
    };
  }

  if (geometry.type === "Point") {
    return {
      ...geometry,
      coordinates: roundPoint(geometry.coordinates),
    };
  }

  return geometry;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

function featureCollection(features) {
  return {
    type: "FeatureCollection",
    features,
  };
}

function simplifyFeature(feature, propertyKeys) {
  return {
    type: "Feature",
    properties: keepProperties(feature.properties, propertyKeys),
    geometry: simplifyGeometry(feature.geometry),
  };
}

function getScaleRank(feature) {
  return Number(feature.properties?.scalerank ?? feature.properties?.SCALERANK ?? feature.properties?.min_zoom ?? 99);
}

function getName(feature) {
  return String(
    feature.properties?.name ??
      feature.properties?.NAME ??
      feature.properties?.name_en ??
      feature.properties?.NAME_EN ??
      feature.properties?.namealt ??
      feature.properties?.NAMEALT ??
      "",
  );
}

function getFeatureClass(feature) {
  return String(feature.properties?.featurecla ?? feature.properties?.FEATURECLA ?? "");
}

const [riversRaw, lakesRaw, geographyRaw, landRaw] = await Promise.all(
  Object.values(sources).map((source) => fetchJson(source)),
);

const turfBbox = [bbox.west, bbox.south, bbox.east, bbox.north];

const land = landRaw.features
  .filter(featureTouchesBbox)
  .map((feature) => bboxClip(feature, turfBbox))
  .map((feature) => simplifyFeature(feature, ["featurecla", "scalerank", "min_zoom"]));

const rivers = riversRaw.features
  .filter(featureTouchesBbox)
  .filter((feature) => getScaleRank(feature) <= 7 || /Yangtze|Yellow|Mekong|Salween|Irrawaddy|Pearl|Amur/i.test(getName(feature)))
  .map((feature) =>
    simplifyFeature(feature, ["name", "name_en", "scalerank", "featurecla", "rivernum", "strokeweig"]),
  );

const lakes = lakesRaw.features
  .filter(featureTouchesBbox)
  .filter((feature) => getScaleRank(feature) <= 6 || /Qinghai|Poyang|Dongting|Taihu|Hongze/i.test(getName(feature)))
  .map((feature) => simplifyFeature(feature, ["name", "name_en", "scalerank", "featurecla"]));

const geographyRegions = geographyRaw.features
  .filter(featureTouchesBbox)
  .filter((feature) => {
    const featureClass = getFeatureClass(feature);
    const name = getName(feature);
    return (
      /Range\/mtn|Plateau|Desert|Plain|Basin|Valley/i.test(featureClass) &&
      (getScaleRank(feature) <= 6 ||
        /Qinling|Himalaya|Tibetan|Gobi|Taklamakan|Tien Shan|Altai|Kunlun|Khingan|Yunnan|Sichuan|Loess|North China|South China|Mongolian|Manchurian|Liao|Tarim|Dzungarian/i.test(
          name,
        ))
    );
  })
  .map((feature) =>
    simplifyFeature(feature, [
      "NAME",
      "NAME_EN",
      "NAME_ZH",
      "FEATURECLA",
      "SCALERANK",
      "LABEL",
      "name",
      "name_en",
      "name_zh",
      "featurecla",
      "scalerank",
      "label",
    ]),
  );

const generated = {
  source: "Natural Earth 10m physical vectors via natural-earth-vector GeoJSON",
  license: "Public domain",
  sourceUrls: sources,
  bbox,
  land: featureCollection(land),
  rivers: featureCollection(rivers),
  lakes: featureCollection(lakes),
  geographyRegions: featureCollection(geographyRegions),
};

await fs.writeFile(outputPath, `${JSON.stringify(generated, null, 2)}\n`, "utf8");
console.log(
  `Generated ${outputPath.pathname}: ${land.length} land features, ${rivers.length} rivers, ${lakes.length} lakes, ${geographyRegions.length} geography labels`,
);
