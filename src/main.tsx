import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { curveLinearClosed, line } from "d3-shape";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, GeometryCollection as GeoJsonGeometryCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110 from "world-atlas/countries-110m.json";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  X,
  Compass,
  Info,
  Layers,
  Link2,
  MapPinned,
  Mountain,
  Search,
  UsersRound,
} from "lucide-react";
import eventsData from "../data/events-180-280.sample.json";
import chinaMapData from "../data/china-three-kingdoms-map.json";
import naturalEarthChinaPhysicalData from "../data/natural-earth-china-physical.json";
import regionsData from "../data/regions-180-280.json";
import "./styles.css";

type Region = "china" | "rome" | "sasanian-persia" | "india";

type EventCategory = "politics" | "war" | "society" | "culture" | "economy";
type LonLat = [number, number];

type HistoricalEvent = {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  region: Region;
  locationName?: string | null;
  coordinates?: [number, number] | null;
  category: EventCategory;
  summary: string;
  people: string[];
  polities: string[];
  relatedEvents: string[];
  tags: string[];
  confidence: "high" | "medium" | "low";
  sources: unknown[];
};

type Page = "world" | "china";
type ChinaMapMode = "political" | "terrain" | "three-d";

type RegionInfo = {
  id: Region;
  label: string;
  accent: string;
  eras: RegionEra[];
};

type RegionEra = {
  startYear: number;
  endYear: number;
  title: string;
  summary: string;
  boundaryType: "effective-control" | "nominal" | "cultural-influence";
  confidence: "high" | "medium" | "low";
  boundary?: LonLat[];
  boundaryGroups?: BoundaryGroup[];
  sources: unknown[];
};

type BoundaryGroup = {
  id: string;
  label: string;
  boundaryType: "effective-control" | "nominal" | "cultural-influence";
  confidence: "high" | "medium" | "low";
  boundary: LonLat[];
};

type ChinaPolity = BoundaryGroup & {
  accent: string;
  capitalName: string;
  capital: LonLat;
  center: LonLat;
  summary: string;
};

type ChinaMapLayer = {
  id: string;
  label: string;
  view: {
    northWest: LonLat;
    southEast: LonLat;
    padding: number;
  };
  eras: ChinaMapEra[];
  cities: Array<{
    id: string;
    label: string;
    kind: "capital" | "major" | "frontier";
    coordinates: LonLat;
    polity: string;
  }>;
  sources: string[];
};

type ChinaMapEra = {
  startYear: number;
  endYear: number;
  title: string;
  summary: string;
  polities: ChinaPolity[];
  frontierZones?: BoundaryGroup[];
};

type NaturalEarthPhysical = {
  source: string;
  license: string;
  sourceUrls: Record<string, string>;
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  land: FeatureCollection<Geometry, GeoJsonProperties>;
  rivers: FeatureCollection<Geometry, GeoJsonProperties>;
  lakes: FeatureCollection<Geometry, GeoJsonProperties>;
  geographyRegions: FeatureCollection<Geometry, GeoJsonProperties>;
};

const events = eventsData as HistoricalEvent[];
const chinaMap = chinaMapData as ChinaMapLayer;
const naturalEarthChinaPhysical = naturalEarthChinaPhysicalData as NaturalEarthPhysical;
const regions = regionsData as unknown as RegionInfo[];
type WorldAtlasTopology = Topology<{ countries: GeometryCollection }>;

const atlas = countries110 as unknown as WorldAtlasTopology;
const world = feature(atlas, atlas.objects.countries) as FeatureCollection<Geometry>;
const countries = world.features as Array<Feature<Geometry>>;
const projection = geoNaturalEarth1().fitExtent(
  [
    [28, 24],
    [972, 496],
  ],
  { type: "Sphere" },
);
const path = geoPath(projection);
const graticulePath = path(geoGraticule10());
const spherePath = path({ type: "Sphere" });
const worldViewBox = "0 0 1000 520";
const chinaViewBox = getProjectedViewBox(chinaMap.view.northWest, chinaMap.view.southEast, chinaMap.view.padding);

const categoryLabels: Record<EventCategory, string> = {
  politics: "政治",
  war: "战争",
  society: "社会",
  culture: "文化",
  economy: "经济",
};

const chinaMapModes: Array<{
  id: ChinaMapMode;
  label: string;
  Icon: typeof Layers;
}> = [
  { id: "political", label: "政治", Icon: Layers },
  { id: "terrain", label: "地形", Icon: Mountain },
  { id: "three-d", label: "3D", Icon: Box },
];

const yearMin = 180;
const yearMax = 280;

function isActiveInYear(event: HistoricalEvent, year: number) {
  return event.startYear <= year && event.endYear >= year;
}

function isNearYear(event: HistoricalEvent, year: number) {
  return Math.abs(event.startYear - year) <= 8 || Math.abs(event.endYear - year) <= 8;
}

function formatYearRange(event: HistoricalEvent) {
  return event.startYear === event.endYear
    ? `${event.startYear} 年`
    : `${event.startYear}-${event.endYear} 年`;
}

function getRegionEra(region: RegionInfo, year: number) {
  return (
    region.eras.find((era) => era.startYear <= year && era.endYear >= year) ??
    region.eras[region.eras.length - 1]
  );
}

function projectPoints(points: LonLat[]) {
  return points
    .map((point) => projection(point))
    .filter((point): point is [number, number] => Boolean(point));
}

function getBoundaryPath(boundary: LonLat[]) {
  const projectedPoints = projectPoints(boundary.slice(0, -1));

  if (projectedPoints.length < 3) {
    return null;
  }

  return line<[number, number]>()
    .x((point) => point[0])
    .y((point) => point[1])
    .curve(curveLinearClosed)(projectedPoints);
}

function getProjectedPoint(point: LonLat) {
  return projection(point);
}

function collectGeometryCoordinates(geometry: Geometry | null | undefined, collected: LonLat[] = []) {
  if (!geometry) {
    return collected;
  }

  if (geometry.type === "GeometryCollection") {
    for (const child of (geometry as GeoJsonGeometryCollection).geometries) {
      collectGeometryCoordinates(child, collected);
    }
    return collected;
  }

  collectCoordinateValues("coordinates" in geometry ? geometry.coordinates : null, collected);
  return collected;
}

function collectCoordinateValues(value: unknown, collected: LonLat[]) {
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    collected.push([value[0], value[1]]);
    return;
  }

  if (Array.isArray(value)) {
    for (const child of value) {
      collectCoordinateValues(child, collected);
    }
  }
}

function getFeatureLabelPoint(geoFeature: Feature<Geometry>) {
  const projectedPoints = collectGeometryCoordinates(geoFeature.geometry)
    .map((point) => projection(point))
    .filter((point): point is [number, number] => Boolean(point));

  if (!projectedPoints.length) {
    return null;
  }

  const xs = projectedPoints.map((point) => point[0]);
  const ys = projectedPoints.map((point) => point[1]);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ] as [number, number];
}

function getNaturalEarthProperty(geoFeature: Feature<Geometry>, keys: string[]) {
  for (const key of keys) {
    const value = geoFeature.properties?.[key];
    if (typeof value === "string" && value.length) {
      return value;
    }
  }

  return "";
}

function getNaturalEarthScaleRank(geoFeature: Feature<Geometry>) {
  const value = geoFeature.properties?.scalerank ?? geoFeature.properties?.SCALERANK;
  return typeof value === "number" ? value : 99;
}

function getNaturalEarthClass(geoFeature: Feature<Geometry>) {
  return getNaturalEarthProperty(geoFeature, ["featurecla", "FEATURECLA"]).toLowerCase();
}

function getNaturalEarthLabel(geoFeature: Feature<Geometry>) {
  return getNaturalEarthProperty(geoFeature, ["NAME_ZH", "name_zh", "NAME_EN", "name_en", "NAME", "name"]);
}

function shouldShowTerrainLabel(geoFeature: Feature<Geometry>) {
  const rank = getNaturalEarthScaleRank(geoFeature);
  const label = getNaturalEarthLabel(geoFeature);

  return (
    rank <= 2 ||
    /秦岭|青藏|黄土|塔里木|准噶尔|昆仑|祁连|天山|喜马拉雅|戈壁|阴山|大兴安|小兴安|四川|云贵|Qinling|Tibetan|Loess|Tarim|Dzungarian|Kunlun|Qilian|Tien Shan|Himalaya|Gobi|Yin Mountains|Khingan|Sichuan|Yunnan/i.test(
      label,
    )
  );
}

function getProjectedViewBox(northWest: LonLat, southEast: LonLat, padding: number) {
  const topLeft = projection(northWest);
  const bottomRight = projection(southEast);

  if (!topLeft || !bottomRight) {
    return worldViewBox;
  }

  const x = Math.min(topLeft[0], bottomRight[0]) - padding;
  const y = Math.min(topLeft[1], bottomRight[1]) - padding;
  const width = Math.abs(bottomRight[0] - topLeft[0]) + padding * 2;
  const height = Math.abs(bottomRight[1] - topLeft[1]) + padding * 2;

  return `${x} ${y} ${width} ${height}`;
}

function getBoundaryGroups(region: RegionInfo, era: RegionEra) {
  if (era.boundaryGroups?.length) {
    return era.boundaryGroups;
  }

  if (!era.boundary) {
    return [];
  }

  return [
    {
      id: region.id,
      label: region.label,
      boundaryType: era.boundaryType,
      confidence: era.confidence,
      boundary: era.boundary,
    },
  ];
}

function getChinaMapLayer(year: number) {
  return chinaMap.eras.find((era) => era.startYear <= year && era.endYear >= year) ?? null;
}

function isChinaPolity(group: BoundaryGroup | ChinaPolity): group is ChinaPolity {
  return "capitalName" in group;
}

function getRegionSummary(region: RegionInfo, regionEvents: HistoricalEvent[], year: number) {
  const era = getRegionEra(region, year);
  const activeEvent = regionEvents.find((event) => isActiveInYear(event, year));
  const nearEvent = activeEvent ?? regionEvents[0];

  if (!nearEvent) {
    return `${year} 年附近：${era.summary}`;
  }

  return `${year} 年附近：${nearEvent.title}。${era.summary}`;
}

function WorldMap({
  activeRegion,
  hoveredRegion,
  onHover,
  onSelect,
  onClearSummary,
  year,
  viewBox = worldViewBox,
}: {
  activeRegion: Region;
  hoveredRegion: Region | null;
  onHover: (region: Region | null) => void;
  onSelect: (region: Region) => void;
  onClearSummary: () => void;
  year: number;
  viewBox?: string;
}) {
  return (
    <div className="map-frame" aria-label="世界地图总览">
      <svg
        className="world-map"
        viewBox={viewBox}
        role="img"
        aria-label="世界地图"
        onClick={onClearSummary}
      >
        {spherePath && <path className="sphere" d={spherePath} onClick={onClearSummary} />}
        {graticulePath && <path className="graticule" d={graticulePath} />}
        <g>
          {countries.map((country, index) => {
            const d = path(country);
            return d ? <path className="country" d={d} key={index} onClick={onClearSummary} /> : null;
          })}
        </g>

        {regions.map((region) => {
          const isActive = region.id === activeRegion;
          const isHovered = region.id === hoveredRegion;
          const era = getRegionEra(region, year);
          const boundaryPath = era.boundary ? getBoundaryPath(era.boundary) : null;
          if (!boundaryPath) {
            return null;
          }

          return (
            <g key={region.id}>
              <path
                className={`historical-boundary confidence-${era.confidence} boundary-${era.boundaryType} ${
                  isActive ? "active" : ""
                } ${isHovered ? "hovered" : ""}`}
                d={boundaryPath}
                style={{ "--accent": region.accent } as React.CSSProperties}
                onMouseEnter={() => onHover(region.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(region.id)}
                onBlur={() => onHover(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(region.id);
                }}
                tabIndex={0}
                role="button"
                aria-label={`选择${region.label}`}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function getTerrainHeight(lon: number, lat: number) {
  const ridge = (centerLon: number, centerLat: number, lonSpread: number, latSpread: number, height: number) => {
    const lonDistance = (lon - centerLon) / lonSpread;
    const latDistance = (lat - centerLat) / latSpread;
    return height * Math.exp(-(lonDistance * lonDistance + latDistance * latDistance));
  };

  return (
    0.02 +
    ridge(88, 32, 12, 8, 1.6) +
    ridge(80, 42, 8, 3, 0.75) +
    ridge(96, 36, 9, 2.4, 0.55) +
    ridge(106, 33, 7, 1.6, 0.38) +
    ridge(101, 27, 5.5, 5, 0.55) +
    ridge(113, 42, 8, 3, 0.35) +
    ridge(116, 25, 8, 4, 0.26)
  );
}

function getLocalTerrainPoint(lon: number, lat: number, height = 0) {
  const { west, east, south, north } = naturalEarthChinaPhysical.bbox;
  const x = ((lon - west) / (east - west) - 0.5) * 10.8;
  const z = (0.5 - (lat - south) / (north - south)) * 6.5;
  return { x, y: height, z };
}

function ChinaTerrain3DMap({ onClearSummary }: { onClearSummary: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let animationFrame = 0;
    let cleanupResize = () => {};

    async function renderTerrain() {
      const THREE = await import("three");
      const canvas = canvasRef.current;
      if (!canvas || disposed) {
        return;
      }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd6e2dd);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 6.1, 8.4);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const resize = () => {
        const bounds = canvas.getBoundingClientRect();
        renderer.setSize(bounds.width, bounds.height, false);
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);
      cleanupResize = () => window.removeEventListener("resize", resize);

      scene.add(new THREE.HemisphereLight(0xf2f5eb, 0x65736d, 2.2));
      const sun = new THREE.DirectionalLight(0xffffff, 2.4);
      sun.position.set(-3, 7, 4);
      scene.add(sun);

      const terrainGroup = new THREE.Group();
      scene.add(terrainGroup);

      const width = 10.8;
      const depth = 6.5;
      const geometry = new THREE.PlaneGeometry(width, depth, 128, 82);
      const positions = geometry.attributes.position;
      const colors: number[] = [];
      const color = new THREE.Color();

      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        const planarY = positions.getY(index);
        const lon = naturalEarthChinaPhysical.bbox.west + (x / width + 0.5) * (naturalEarthChinaPhysical.bbox.east - naturalEarthChinaPhysical.bbox.west);
        const lat = naturalEarthChinaPhysical.bbox.south + (planarY / depth + 0.5) * (naturalEarthChinaPhysical.bbox.north - naturalEarthChinaPhysical.bbox.south);
        const height = getTerrainHeight(lon, lat);
        positions.setXYZ(index, x, height, -planarY);

        if (height > 1.0) {
          color.setRGB(0.62, 0.56, 0.44);
        } else if (height > 0.45) {
          color.setRGB(0.51, 0.56, 0.43);
        } else {
          color.setRGB(0.63, 0.69, 0.56);
        }
        colors.push(color.r, color.g, color.b);
      }

      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        metalness: 0,
        roughness: 0.92,
        vertexColors: true,
      });
      const terrain = new THREE.Mesh(geometry, material);
      terrainGroup.add(terrain);

      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshStandardMaterial({
          color: 0x7ea9b7,
          opacity: 0.28,
          transparent: true,
          roughness: 0.65,
        }),
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = -0.015;
      terrainGroup.add(water);

      const riverMaterial = new THREE.LineBasicMaterial({ color: 0x2b6f96, transparent: true, opacity: 0.72 });
      for (const river of naturalEarthChinaPhysical.rivers.features.filter((featureItem) => getNaturalEarthScaleRank(featureItem) <= 2)) {
        const points = collectGeometryCoordinates(river.geometry)
          .map(([lon, lat]) => {
            const local = getLocalTerrainPoint(lon, lat, getTerrainHeight(lon, lat) + 0.035);
            return new THREE.Vector3(local.x, local.y, local.z);
          })
          .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.z));

        if (points.length >= 2) {
          terrainGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), riverMaterial));
        }
      }

      const animate = () => {
        const time = performance.now() * 0.001;
        terrainGroup.rotation.y = Math.sin(time * 0.35) * 0.045;
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      };
      animate();
    }

    renderTerrain();

    return () => {
      disposed = true;
      cleanupResize();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="terrain-3d-frame" onClick={onClearSummary}>
      <canvas ref={canvasRef} aria-label="中国区域 3D 地形图" />
    </div>
  );
}

function ChinaRegionMap({
  activeGroup,
  mapMode,
  onSelectGroup,
  onClearSummary,
  year,
}: {
  activeGroup: string | null;
  mapMode: ChinaMapMode;
  onSelectGroup: (group: BoundaryGroup) => void;
  onClearSummary: () => void;
  year: number;
}) {
  const china = regions.find((region) => region.id === "china")!;
  const era = getRegionEra(china, year);
  const mapLayer = getChinaMapLayer(year);
  const boundaryGroups = mapLayer?.polities ?? getBoundaryGroups(china, era);

  if (mapMode === "three-d") {
    return <ChinaTerrain3DMap onClearSummary={onClearSummary} />;
  }

  return (
    <div className={`map-frame map-mode-${mapMode}`} aria-label="中国区域地图">
      <svg
        className="world-map regional-map"
        viewBox={chinaViewBox}
        role="img"
        aria-label="中国及周边区域地图"
        onClick={onClearSummary}
      >
        {graticulePath && <path className="graticule" d={graticulePath} />}
        {naturalEarthChinaPhysical.land.features.map((geoFeature, index) => {
          const landPath = path(geoFeature);
          if (!landPath) {
            return null;
          }

          return <path className="regional-land" d={landPath} key={`land-${index}`} onClick={onClearSummary} />;
        })}

        {(mapMode === "political" || mapMode === "terrain") && (
          <>
            {naturalEarthChinaPhysical.geographyRegions.features.map((geoFeature, index) => {
              const regionPath = path(geoFeature);
              if (!regionPath) {
                return null;
              }

              return (
                <path
                  className={`terrain-region terrain-${getNaturalEarthClass(geoFeature).replace(/[^a-z]+/g, "-")}`}
                  d={regionPath}
                  key={`terrain-${index}`}
                />
              );
            })}

            {naturalEarthChinaPhysical.lakes.features.map((geoFeature, index) => {
              const lakePath = path(geoFeature);
              if (!lakePath) {
                return null;
              }

              return <path className="physical-lake" d={lakePath} key={`lake-${index}`} />;
            })}

            {naturalEarthChinaPhysical.rivers.features.map((geoFeature, index) => {
              const riverPath = path(geoFeature);
              if (!riverPath) {
                return null;
              }

              return (
                <path
                  className={`physical-river ${getNaturalEarthScaleRank(geoFeature) <= 2 ? "major" : ""}`}
                  d={riverPath}
                  key={`river-${index}`}
                />
              );
            })}

            {mapMode === "terrain" &&
              naturalEarthChinaPhysical.geographyRegions.features.map((geoFeature, index) => {
                if (!shouldShowTerrainLabel(geoFeature)) {
                  return null;
                }

                const labelPoint = getFeatureLabelPoint(geoFeature);
                const label = getNaturalEarthLabel(geoFeature);
                if (!labelPoint || !label) {
                  return null;
                }

                return (
                  <text className="terrain-label" key={`terrain-label-${index}`} x={labelPoint[0]} y={labelPoint[1]}>
                    {label}
                  </text>
                );
              })}
          </>
        )}

        {mapMode === "political" && (
          <>
            {boundaryGroups.map((group) => {
              const boundaryPath = getBoundaryPath(group.boundary);
              if (!boundaryPath) {
                return null;
              }

              const accent = isChinaPolity(group) ? group.accent : "#b94f32";

              return (
                <path
                  className={`historical-boundary regional-boundary confidence-${group.confidence} boundary-${
                    group.boundaryType
                  } ${activeGroup === group.id ? "active" : ""}`}
                  d={boundaryPath}
                  key={group.id}
                  style={{ "--accent": accent } as React.CSSProperties}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectGroup(group);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`选择${group.label}`}
                />
              );
            })}

            {mapLayer?.polities.map((polity) => {
              const center = getProjectedPoint(polity.center);
              if (!center) {
                return null;
              }

              return (
                <text className="polity-label" key={`${polity.id}-label`} x={center[0]} y={center[1]}>
                  {polity.label}
                </text>
              );
            })}

            {chinaMap.cities.map((city) => {
              const cityPoint = getProjectedPoint(city.coordinates);
              if (!cityPoint) {
                return null;
              }

              return (
                <g className={`city-marker city-${city.kind}`} key={city.id}>
                  <circle cx={cityPoint[0]} cy={cityPoint[1]} r={city.kind === "capital" ? 1.9 : 1.25} />
                  <text x={cityPoint[0] + 2.4} y={cityPoint[1] - 1.8}>
                    {city.label}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("world");
  const [year, setYear] = useState(220);
  const [query, setQuery] = useState("");
  const [chinaMapMode, setChinaMapMode] = useState<ChinaMapMode>("political");
  const [selectedRegion, setSelectedRegion] = useState<Region>("china");
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [summaryRegion, setSummaryRegion] = useState<Region | null>("china");
  const [selectedId, setSelectedId] = useState("china-220-cao-pi-founds-wei");
  const [selectedChinaGroup, setSelectedChinaGroup] = useState<BoundaryGroup | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesYear = isActiveInYear(event, year) || isNearYear(event, year);
      const text = [
        event.title,
        event.summary,
        event.locationName,
        ...event.people,
        ...event.polities,
        ...event.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesYear && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [normalizedQuery, year]);

  const regionCounts = regions.reduce(
    (counts, region) => {
      counts[region.id] = visibleEvents.filter((event) => event.region === region.id).length;
      return counts;
    },
    {} as Record<Region, number>,
  );

  const selectedRegionInfo = regions.find((region) => region.id === selectedRegion) ?? regions[0];
  const hoverRegionInfo = regions.find((region) => region.id === hoveredRegion);
  const summaryRegionInfo = regions.find((region) => region.id === summaryRegion);
  const inspectedRegion = hoverRegionInfo ?? summaryRegionInfo;
  const inspectedEra = inspectedRegion ? getRegionEra(inspectedRegion, year) : null;
  const selectedRegionEra = getRegionEra(selectedRegionInfo, year);
  const chinaRegionInfo = regions.find((region) => region.id === "china")!;
  const chinaRegionEra = getRegionEra(chinaRegionInfo, year);
  const chinaMapLayer = getChinaMapLayer(year);
  const chinaBoundaryGroups = chinaMapLayer?.polities ?? getBoundaryGroups(chinaRegionInfo, chinaRegionEra);
  const selectedChinaGroupInView =
    chinaMapMode === "political"
      ? (chinaBoundaryGroups.find((group) => group.id === selectedChinaGroup?.id) ?? null)
      : null;

  const selectedRegionEvents = visibleEvents.filter((event) => event.region === selectedRegion);
  const selectedEvent =
    selectedRegionEvents.find((event) => event.id === selectedId) ??
    selectedRegionEvents[0] ??
    events.find((event) => event.id === selectedId) ??
    events[0];

  const relatedEvents = selectedEvent.relatedEvents
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is HistoricalEvent => Boolean(event));

  useEffect(() => {
    if (page !== "china" || chinaMapMode !== "political") {
      return;
    }

    if (!selectedChinaGroup) {
      return;
    }

    if (!selectedChinaGroupInView) {
      setSelectedChinaGroup(chinaBoundaryGroups[0] ?? null);
    }
  }, [chinaBoundaryGroups, chinaMapMode, page, selectedChinaGroup, selectedChinaGroupInView]);

  function selectRegion(region: Region) {
    if (region === "china") {
      setPage("china");
      setChinaMapMode("political");
      setSelectedRegion("china");
      setSummaryRegion(null);
      setHoveredRegion(null);
      setSelectedChinaGroup(chinaBoundaryGroups[0] ?? null);
      const firstChinaEvent = visibleEvents.find((event) => event.region === "china");
      if (firstChinaEvent) {
        setSelectedId(firstChinaEvent.id);
      }
      return;
    }

    setSelectedRegion(region);
    setSummaryRegion(region);
    const firstEvent = visibleEvents.find((event) => event.region === region);
    if (firstEvent) {
      setSelectedId(firstEvent.id);
    }
  }

  function returnToWorld() {
    setPage("world");
    setSelectedRegion("china");
    setSummaryRegion("china");
    setSelectedChinaGroup(null);
  }

  function changeChinaMapMode(mode: ChinaMapMode) {
    setChinaMapMode(mode);
    setSelectedChinaGroup(mode === "political" ? (chinaBoundaryGroups[0] ?? null) : null);
  }

  return (
    <main className="app-shell">
      <section className="map-workspace">
        <header className="topbar">
          <div>
            <p className="kicker">ChronoAtlas</p>
            <h1>{page === "china" ? "中国区域：三国格局" : "拖动时间，观察世界局势的同一瞬间"}</h1>
          </div>
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索人物、政权、事件"
            />
          </label>
        </header>

        {page === "china" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              世界总览
            </button>
            <div className="map-mode-control" role="group" aria-label="地图模式">
              {chinaMapModes.map(({ id, label, Icon }) => (
                <button
                  className={`map-mode-button ${chinaMapMode === id ? "active" : ""}`}
                  key={id}
                  type="button"
                  aria-pressed={chinaMapMode === id}
                  title={`${label}地图`}
                  onClick={() => changeChinaMapMode(id)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <span>{chinaMapLayer?.title ?? chinaRegionEra.title}</span>
          </div>
        )}

        <section className="map-stage">
          {page === "world" ? (
            <WorldMap
              activeRegion={selectedRegion}
              hoveredRegion={hoveredRegion}
              onHover={setHoveredRegion}
              onSelect={selectRegion}
              onClearSummary={() => setSummaryRegion(null)}
              year={year}
            />
          ) : (
            <ChinaRegionMap
              activeGroup={selectedChinaGroupInView?.id ?? null}
              mapMode={chinaMapMode}
              onSelectGroup={setSelectedChinaGroup}
              onClearSummary={() => setSelectedChinaGroup(null)}
              year={year}
            />
          )}

          {page === "world" && inspectedRegion && inspectedEra && (
            <aside
              className="hover-summary"
              style={{ "--accent": inspectedRegion.accent } as React.CSSProperties}
              aria-live="polite"
            >
              <div className="summary-heading">
                <MapPinned size={18} aria-hidden="true" />
                <span>{hoverRegionInfo ? "悬停区域" : "选中区域"}</span>
                <button
                  className="summary-close"
                  type="button"
                  aria-label="关闭区域信息"
                  title="关闭区域信息"
                  onClick={() => setSummaryRegion(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <h2>{inspectedRegion.label}</h2>
              <p>
                {getRegionSummary(
                  inspectedRegion,
                  visibleEvents.filter((event) => event.region === inspectedRegion.id),
                  year,
                )}
              </p>
              <div className="summary-meta">
                <span>{inspectedEra.title}</span>
                <strong>{regionCounts[inspectedRegion.id]} 个事件</strong>
              </div>
            </aside>
          )}

          {page === "china" && chinaMapMode === "political" && selectedChinaGroupInView && (
            <aside
              className="hover-summary regional-summary"
              style={
                {
                  "--accent": isChinaPolity(selectedChinaGroupInView) ? selectedChinaGroupInView.accent : "#b94f32",
                } as React.CSSProperties
              }
            >
              <div className="summary-heading">
                <MapPinned size={18} aria-hidden="true" />
                <span>区域片段</span>
                <button
                  className="summary-close"
                  type="button"
                  aria-label="关闭区域信息"
                  title="关闭区域信息"
                  onClick={() => setSelectedChinaGroup(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <h2>{selectedChinaGroupInView.label}</h2>
              <p>{isChinaPolity(selectedChinaGroupInView) ? selectedChinaGroupInView.summary : chinaRegionEra.summary}</p>
              <div className="summary-meta">
                <span>
                  {isChinaPolity(selectedChinaGroupInView)
                    ? `都城：${selectedChinaGroupInView.capitalName}`
                    : chinaRegionEra.title}
                </span>
                <strong>{selectedChinaGroupInView.confidence}</strong>
              </div>
            </aside>
          )}
        </section>

        <section className="timeline-dock" aria-label="时间线">
          <button
            className="icon-button"
            type="button"
            aria-label="上一年"
            title="上一年"
            onClick={() => setYear((current) => Math.max(yearMin, current - 1))}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="year-control">
            <div className="year-readout">
              <CalendarDays size={19} aria-hidden="true" />
              <span>{year}</span>
              <small>CE</small>
            </div>
            <input
              aria-label="选择年份"
              type="range"
              min={yearMin}
              max={yearMax}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
            <div className="range-labels">
              <span>180</span>
              <span>220</span>
              <span>260</span>
              <span>280</span>
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="下一年"
            title="下一年"
            onClick={() => setYear((current) => Math.min(yearMax, current + 1))}
          >
            <ChevronRight size={20} />
          </button>
        </section>
      </section>

      <aside className="detail-panel" aria-label="区域与事件详情">
        <div className="region-detail">
          <div className="detail-eyebrow" style={{ color: page === "china" ? "#b94f32" : selectedRegionInfo.accent }}>
            <Info size={18} aria-hidden="true" />
            <span>{page === "china" ? "中国" : selectedRegionInfo.label}</span>
          </div>
          <h2>{page === "china" ? (chinaMapLayer?.title ?? chinaRegionEra.title) : selectedRegionEra.title}</h2>
          <p className="detail-summary">
            {page === "china" ? (chinaMapLayer?.summary ?? chinaRegionEra.summary) : selectedRegionEra.summary}
          </p>
        </div>

        {page === "china" && chinaMapMode === "political" && (
          <section className="event-list">
            <h3>势力范围</h3>
            <div className="chips">
              {chinaBoundaryGroups.map((group) => (
                <button
                  className={`chip-button ${selectedChinaGroupInView?.id === group.id ? "selected" : ""}`}
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedChinaGroup(group)}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="event-list">
          <h3>区域事件</h3>
          <div className="event-stack">
            {selectedRegionEvents.length ? (
              selectedRegionEvents.map((event) => (
                <button
                  className={`event-card ${event.id === selectedEvent.id ? "selected" : ""}`}
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedId(event.id)}
                >
                  <span className="event-year">{formatYearRange(event)}</span>
                  <strong>{event.title}</strong>
                  <span>{event.summary}</span>
                </button>
              ))
            ) : (
              <div className="empty-state">这一年附近暂无样例事件</div>
            )}
          </div>
        </section>

        <section className="event-detail">
          <div className="detail-eyebrow">
            <CircleDot size={18} aria-hidden="true" />
            <span>{categoryLabels[selectedEvent.category]}</span>
          </div>
          <h2>{selectedEvent.title}</h2>
          <p className="detail-summary">{selectedEvent.summary}</p>

          <div className="facts">
            <div>
              <span>时间</span>
              <strong>{formatYearRange(selectedEvent)}</strong>
            </div>
            <div>
              <span>地点</span>
              <strong>{selectedEvent.locationName || "待补充"}</strong>
            </div>
            <div>
              <span>可信度</span>
              <strong>{selectedEvent.confidence}</strong>
            </div>
          </div>

          <section className="detail-section">
            <h3>
              <UsersRound size={17} aria-hidden="true" />
              相关人物
            </h3>
            <div className="chips">
              {selectedEvent.people.length ? (
                selectedEvent.people.map((person) => <span key={person}>{person}</span>)
              ) : (
                <span>待补充</span>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h3>
              <Compass size={17} aria-hidden="true" />
              政权与标签
            </h3>
            <div className="chips">
              {[...selectedEvent.polities, ...selectedEvent.tags].map((tag, index) => (
                <span key={`${tag}-${index}`}>{tag}</span>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>
              <Link2 size={17} aria-hidden="true" />
              关联事件
            </h3>
            <div className="related-list">
              {relatedEvents.length ? (
                relatedEvents.map((event) => (
                  <button key={event.id} type="button" onClick={() => setSelectedId(event.id)}>
                    <span>{formatYearRange(event)}</span>
                    <strong>{event.title}</strong>
                  </button>
                ))
              ) : (
                <p>暂无关联事件</p>
              )}
            </div>
          </section>
        </section>
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
