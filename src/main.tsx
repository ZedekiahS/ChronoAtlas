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
  BookOpen,
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
  Network,
  Search,
  UsersRound,
} from "lucide-react";
import eventsData from "../data/events-180-280.sample.json";
import chinaAdminBlocksData from "../data/china-admin-blocks-190-280.json";
import chinaBlockControlTimelineData from "../data/china-block-control-timeline-190-280.json";
import chinaMapData from "../data/china-three-kingdoms-map.json";
import chinaPersonLifeEventsData from "../data/china-person-life-events.json";
import chinaPersonRelationsData from "../data/china-person-relations.json";
import chinaPersonsData from "../data/china-persons.json";
import chinaSourcesData from "../data/china-sources.json";
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
  personIds?: string[];
  polities: string[];
  relatedEvents: string[];
  tags: string[];
  confidence: "high" | "medium" | "low";
  sources: string[];
  sourceRefs?: SourceRef[];
  detail?: EventDeepDetail;
};

type EventDeepDetail = {
  background?: string[];
  process?: string[];
  result?: string[];
  impact?: string[];
  sourceNotes?: string[];
  uncertainty?: string[];
};

type EventDetailTab = "overview" | "background" | "process" | "impact" | "sources";

type SourceRef = {
  sourceId: string;
  locator?: string;
  note?: string;
  quote?: string;
};

type SourceRecord = {
  id: string;
  title: string;
  author: string;
  type: string;
  citationShort: string;
  note: string;
  url?: string;
};

type HistoricalPerson = {
  id: string;
  name: string;
  courtesyName: string | null;
  life: string | null;
  primaryPolity: string;
  roles: string[];
  summary: string;
  sourceRefs: SourceRef[];
};

type PersonLifeEvent = {
  id: string;
  personId: string;
  year: number | null;
  endYear?: number | null;
  displayYear: string;
  type:
    | "abdication"
    | "birth"
    | "campaign"
    | "death"
    | "diplomacy"
    | "later-tradition"
    | "office"
    | "politics"
    | "service"
    | "strategy"
    | "turning-point";
  title: string;
  summary: string;
  relatedEventIds: string[];
  confidence: "high" | "medium" | "low";
  sourceRefs: SourceRef[];
};

type PersonRelation = {
  id: string;
  sourcePersonId: string;
  targetPersonId: string;
  type: string;
  startYear?: number;
  endYear?: number;
  summary: string;
  sourceRefs: SourceRef[];
};

type Page = "world" | "china" | "people";
type ChinaMapMode = "political" | "terrain" | "three-d";
type ThreeKingdomsFilter = "all" | "cao-wei" | "shu-han" | "sun-wu" | "late-han" | "war" | "politics";
type PersonIndexFilter = "all" | "cao-wei" | "shu-han" | "sun-wu" | "late-han";

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

type ChinaBlockLevel = "province" | "commandery" | "county-seat";
type ChinaControlStatus = "effective-control" | "contested" | "frontier" | "nominal-control";
type ChinaBlockGeometry = {
  type: "Polygon";
  coordinates: LonLat[][];
};

type ChinaBlock = {
  id: string;
  name: string;
  level: ChinaBlockLevel;
  parent: string | null;
  center: LonLat;
  geometry: ChinaBlockGeometry;
  confidence: "high" | "medium" | "low";
  approximate: boolean;
  sources: string[];
};

type ChinaAdminBlocksDataset = {
  schemaVersion: number;
  model: string;
  range: [number, number];
  notes: string;
  blocks: ChinaBlock[];
};

type ChinaController = {
  id: string;
  color: string;
};

type ChinaControlRecord = {
  blockId: string;
  startYear: number;
  endYear: number;
  controller: string;
  status: ChinaControlStatus;
  confidence: "high" | "medium" | "low";
  sources: string[];
};

type ChinaControlTimeline = {
  schemaVersion: number;
  model: string;
  range: [number, number];
  keyYears: number[];
  controllers: ChinaController[];
  records: ChinaControlRecord[];
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
const chinaSources = chinaSourcesData as SourceRecord[];
const chinaPersons = chinaPersonsData as HistoricalPerson[];
const chinaPersonLifeEvents = chinaPersonLifeEventsData as PersonLifeEvent[];
const chinaPersonRelations = chinaPersonRelationsData as PersonRelation[];
const chinaBlocksDataset = chinaAdminBlocksData as unknown as ChinaAdminBlocksDataset;
const chinaControlTimeline = chinaBlockControlTimelineData as unknown as ChinaControlTimeline;
const chinaMap = chinaMapData as ChinaMapLayer;
const naturalEarthChinaPhysical = naturalEarthChinaPhysicalData as NaturalEarthPhysical;
const regions = regionsData as unknown as RegionInfo[];
const chinaBlocks = chinaBlocksDataset.blocks;
const chinaBlockById = new Map(chinaBlocks.map((block) => [block.id, block]));
const chinaControllerColorMap = new Map(chinaControlTimeline.controllers.map((controller) => [controller.id, controller.color]));
const chinaSourceById = new Map(chinaSources.map((source) => [source.id, source]));
const chinaPersonById = new Map(chinaPersons.map((person) => [person.id, person]));
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
const chinaViewBox = getProjectedViewBox([90, 45], [130, 18], 18);

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
  { id: "political", label: "控制", Icon: Layers },
  { id: "terrain", label: "地形", Icon: Mountain },
  { id: "three-d", label: "3D", Icon: Box },
];

const threeKingdomsFilters: Array<{
  id: ThreeKingdomsFilter;
  label: string;
}> = [
  { id: "all", label: "全部" },
  { id: "cao-wei", label: "曹魏线" },
  { id: "shu-han", label: "蜀汉线" },
  { id: "sun-wu", label: "孙吴线" },
  { id: "late-han", label: "汉末群雄" },
  { id: "war", label: "战役" },
  { id: "politics", label: "政治更替" },
];

const personIndexFilters: Array<{
  id: PersonIndexFilter;
  label: string;
  terms: string[];
}> = [
  { id: "all", label: "全部人物", terms: [] },
  { id: "cao-wei", label: "曹魏线", terms: ["曹操集团", "曹魏", "曹操", "曹丕", "司马"] },
  { id: "shu-han", label: "蜀汉线", terms: ["刘备集团", "蜀汉", "刘备", "诸葛亮", "关羽", "张飞", "刘禅"] },
  { id: "sun-wu", label: "孙吴线", terms: ["孙吴", "江东", "孙权", "周瑜", "鲁肃", "吕蒙", "陆逊"] },
  {
    id: "late-han",
    label: "汉末群雄",
    terms: ["东汉", "汉末", "袁绍", "袁术", "董卓", "吕布", "刘表", "刘璋", "张鲁", "公孙瓒", "黄巾"],
  },
];

const eventDetailTabs: Array<{
  id: EventDetailTab;
  label: string;
}> = [
  { id: "overview", label: "概览" },
  { id: "background", label: "背景" },
  { id: "process", label: "经过" },
  { id: "impact", label: "影响" },
  { id: "sources", label: "史料" },
];

const yearMin = 190;
const yearMax = 280;
const worldComparisonRegionOrder: Region[] = ["china", "rome", "sasanian-persia", "india"];

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

function getEventDistanceFromYear(event: HistoricalEvent, year: number) {
  if (isActiveInYear(event, year)) {
    return 0;
  }

  return Math.min(Math.abs(event.startYear - year), Math.abs(event.endYear - year));
}

function getNearestEventForYear(regionEvents: HistoricalEvent[], year: number) {
  return [...regionEvents].sort((left, right) => {
    const distance = getEventDistanceFromYear(left, year) - getEventDistanceFromYear(right, year);
    return distance || left.startYear - right.startYear || left.title.localeCompare(right.title, "zh-Hans-CN");
  })[0];
}

function eventMatchesQuery(event: HistoricalEvent, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  const linkedPeople = (event.personIds ?? [])
    .map((personId) => chinaPersonById.get(personId))
    .filter((person): person is HistoricalPerson => Boolean(person))
    .flatMap((person) => [person.name, person.courtesyName, person.primaryPolity, ...person.roles]);
  const text = [
    event.title,
    event.summary,
    event.locationName,
    ...event.people,
    ...linkedPeople,
    ...event.polities,
    ...event.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(normalizedQuery);
}

function formatYearSpan(startYear?: number, endYear?: number) {
  if (!startYear && !endYear) {
    return "时间未定";
  }

  if (startYear && endYear && startYear !== endYear) {
    return `${startYear}-${endYear} 年`;
  }

  return `${startYear ?? endYear} 年`;
}

function formatSourceRef(ref: SourceRef) {
  const source = chinaSourceById.get(ref.sourceId);
  const citation = source?.citationShort ?? ref.sourceId;
  return [citation, ref.locator].filter(Boolean).join(" · ");
}

function getSourceRefUrl(ref: SourceRef) {
  return chinaSourceById.get(ref.sourceId)?.url ?? null;
}

function SourceRefLink({
  className,
  interactive = true,
  sourceRef,
}: {
  className?: string;
  interactive?: boolean;
  sourceRef: SourceRef;
}) {
  const label = formatSourceRef(sourceRef);
  const url = getSourceRefUrl(sourceRef);

  if (!interactive || !url) {
    return <span className={className}>{label}</span>;
  }

  return (
    <a className={className} href={url} rel="noreferrer" target="_blank" title={`打开外部全文：${label}`}>
      {label}
    </a>
  );
}

function SourceExcerpt({ quote }: { quote?: string }) {
  if (!quote) {
    return null;
  }

  return (
    <details className="source-excerpt">
      <summary>原文摘录/引用段落</summary>
      <blockquote>{quote}</blockquote>
    </details>
  );
}

function LifeEventSources({ lifeEvent }: { lifeEvent: PersonLifeEvent }) {
  return (
    <div className="life-event-source-list">
      <div className="life-event-meta">
        <span>{getConfidenceLabel(lifeEvent.confidence)}</span>
        {lifeEvent.sourceRefs.slice(0, 2).map((ref) => (
          <SourceRefLink key={`${lifeEvent.id}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
        ))}
      </div>
      {lifeEvent.sourceRefs.some((ref) => ref.quote) && (
        <div className="life-event-excerpts">
          {lifeEvent.sourceRefs
            .filter((ref) => ref.quote)
            .map((ref) => (
              <div className="life-event-excerpt" key={`${lifeEvent.id}-${ref.sourceId}-${ref.locator ?? ""}-quote`}>
                <span>{formatSourceRef(ref)}</span>
                <SourceExcerpt quote={ref.quote} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function PersonLifeEventCard({
  lifeEvent,
  linkedEvent,
  selectedEventId,
  onSelectEvent,
}: {
  lifeEvent: PersonLifeEvent;
  linkedEvent?: HistoricalEvent;
  selectedEventId: string;
  onSelectEvent: (event: HistoricalEvent) => void;
}) {
  const isSelected = linkedEvent?.id === selectedEventId;
  const mainContent = (
    <>
      <div className="life-event-year">
        <span>{lifeEvent.displayYear}</span>
        <small>{getLifeEventTypeLabel(lifeEvent.type)}</small>
      </div>
      <div className="life-event-copy">
        <strong>{lifeEvent.title}</strong>
        <p>{lifeEvent.summary}</p>
      </div>
    </>
  );

  return (
    <article
      className={`person-life-event ${linkedEvent ? "clickable" : ""} ${isSelected ? "selected" : ""}`}
      data-person-life-event-id={lifeEvent.id}
    >
      {linkedEvent ? (
        <button className="life-event-main" type="button" onClick={() => onSelectEvent(linkedEvent)}>
          {mainContent}
        </button>
      ) : (
        <div className="life-event-main">{mainContent}</div>
      )}
      <LifeEventSources lifeEvent={lifeEvent} />
    </article>
  );
}

function getRelationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    abdication: "禅让",
    advisor: "辅佐",
    "ally-rival": "联盟转竞争",
    "campaign-opponent": "战役对手",
    commander: "统帅关系",
    "core-ally": "核心同盟",
    "court-control": "朝廷控制",
    defection: "归附转投",
    "family-lineage": "家族承继",
    "family-successor": "父子继承",
    "later-tradition": "后世传统",
    regency: "辅政",
    rival: "竞争",
    enemy: "敌对",
  };

  return labels[type] ?? type;
}

function hasDetailItems(items?: string[]) {
  return Array.isArray(items) && items.length > 0;
}

function getRelationColor(type: string) {
  const colors: Record<string, string> = {
    abdication: "#7a5e9a",
    advisor: "#168069",
    "ally-rival": "#8d6d2b",
    "campaign-opponent": "#9c3f32",
    commander: "#35689a",
    "core-ally": "#2f7d4f",
    "court-control": "#8b3f2d",
    defection: "#7d5d26",
    "family-lineage": "#6f5b28",
    "family-successor": "#6f5b28",
    "later-tradition": "#6f5b91",
    regency: "#5a6f91",
    rival: "#8f6f1f",
    enemy: "#9c3f32",
  };

  return colors[type] ?? "#4b535a";
}

function eventContainsAny(event: HistoricalEvent, terms: string[]) {
  const linkedPeople = (event.personIds ?? [])
    .map((personId) => chinaPersonById.get(personId))
    .filter((person): person is HistoricalPerson => Boolean(person))
    .flatMap((person) => [person.name, person.courtesyName, person.primaryPolity, ...person.roles]);
  const text = [event.title, event.summary, event.locationName, ...event.people, ...linkedPeople, ...event.polities, ...event.tags]
    .filter(Boolean)
    .join(" ");

  return terms.some((term) => text.includes(term));
}

function getPersonSearchFields(person: HistoricalPerson) {
  return [person.name, person.courtesyName, person.primaryPolity, ...person.roles, person.summary].filter(Boolean) as string[];
}

function personContainsAny(person: HistoricalPerson, terms: string[]) {
  const text = getPersonSearchFields(person).join(" ");
  return terms.some((term) => text.includes(term));
}

function getPersonSearchRank(person: HistoricalPerson, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const fields = getPersonSearchFields(person).map((field) => field.toLowerCase());
  return fields.reduce((best, field, index) => {
    if (field === normalizedQuery) {
      return Math.min(best, index);
    }

    if (field.includes(normalizedQuery)) {
      return Math.min(best, index + 8);
    }

    return best;
  }, Number.POSITIVE_INFINITY);
}

function matchesPersonIndexFilter(person: HistoricalPerson, filter: PersonIndexFilter) {
  if (filter === "all") {
    return true;
  }

  const filterConfig = personIndexFilters.find((item) => item.id === filter);
  return filterConfig ? personContainsAny(person, filterConfig.terms) : true;
}

function matchesThreeKingdomsFilter(event: HistoricalEvent, filter: ThreeKingdomsFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "war") {
    return event.category === "war";
  }

  if (filter === "politics") {
    return event.category === "politics" || eventContainsAny(event, ["称帝", "建立", "禅让", "代魏", "控制朝廷"]);
  }

  if (filter === "cao-wei") {
    return eventContainsAny(event, ["曹操集团", "曹魏", "曹操", "曹丕", "司马懿", "邓艾", "钟会"]);
  }

  if (filter === "shu-han") {
    return eventContainsAny(event, ["刘备集团", "蜀汉", "刘备", "诸葛亮", "关羽", "刘禅", "姜维"]);
  }

  if (filter === "sun-wu") {
    return eventContainsAny(event, ["孙吴", "孙权", "周瑜", "鲁肃", "陆逊", "建业"]);
  }

  return (
    event.startYear < 220 &&
    eventContainsAny(event, ["东汉", "群雄", "袁绍", "袁术", "董卓", "吕布", "公孙瓒", "刘表", "张鲁", "刘璋"])
  );
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

function getChinaBlockControl(blockId: string, year: number) {
  return (
    chinaControlTimeline.records.find(
      (record) => record.blockId === blockId && record.startYear <= year && record.endYear >= year,
    ) ?? null
  );
}

function getChinaControllerColor(controller?: string | null) {
  return controller ? (chinaControllerColorMap.get(controller) ?? "#7d8578") : "#7d8578";
}

function getChinaBlockPath(block: ChinaBlock) {
  const blockFeature = {
    type: "Feature",
    properties: {},
    geometry: {
      ...block.geometry,
      coordinates: block.geometry.coordinates.map((ring) => [...ring].reverse()),
    },
  } as Feature<Geometry, GeoJsonProperties>;

  return path(blockFeature);
}

function formatChinaControlRange(control: ChinaControlRecord | null) {
  if (!control) {
    return "待补";
  }

  return control.startYear === control.endYear
    ? `${control.startYear} 年`
    : `${control.startYear}-${control.endYear} 年`;
}

function getChinaControlStatusLabel(status: ChinaControlStatus | undefined) {
  switch (status) {
    case "effective-control":
      return "实际控制";
    case "contested":
      return "争夺区";
    case "frontier":
      return "边缘控制";
    case "nominal-control":
      return "名义控制";
    default:
      return "待补";
  }
}

function getChinaBlockLevelLabel(level: ChinaBlockLevel) {
  switch (level) {
    case "province":
      return "州级区块";
    case "commandery":
      return "重点郡国";
    case "county-seat":
      return "重点县治";
    default:
      return "区块";
  }
}

function getConfidenceLabel(confidence: "high" | "medium" | "low" | undefined) {
  switch (confidence) {
    case "high":
      return "可信度高";
    case "medium":
      return "可信度中";
    case "low":
      return "可信度低";
    default:
      return "可信度待补";
  }
}

function getLifeEventTypeLabel(type: PersonLifeEvent["type"]) {
  const labels: Record<PersonLifeEvent["type"], string> = {
    abdication: "禅让",
    birth: "出生",
    campaign: "战事",
    death: "死亡",
    diplomacy: "外交",
    "later-tradition": "传统称呼",
    office: "任位",
    politics: "政治",
    service: "仕历",
    strategy: "谋略",
    "turning-point": "转折",
  };

  return labels[type] ?? type;
}

function getLifeEventSortValue(lifeEvent: PersonLifeEvent) {
  if (Number.isInteger(lifeEvent.year)) {
    return lifeEvent.year as number;
  }

  return lifeEvent.type === "birth" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
}

function isChinaPolity(group: BoundaryGroup | ChinaPolity): group is ChinaPolity {
  return "capitalName" in group;
}

function getRegionSummary(region: RegionInfo, regionEvents: HistoricalEvent[], year: number) {
  const era = getRegionEra(region, year);
  const activeEvent = regionEvents.find((event) => isActiveInYear(event, year));
  const nearEvent = activeEvent ?? getNearestEventForYear(regionEvents, year);

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
  activeBlockId,
  hoveredBlockId,
  mapMode,
  onSelectBlock,
  onHoverBlock,
  onClearSummary,
  year,
}: {
  activeBlockId: string | null;
  hoveredBlockId: string | null;
  mapMode: ChinaMapMode;
  onSelectBlock: (blockId: string) => void;
  onHoverBlock: (blockId: string | null) => void;
  onClearSummary: () => void;
  year: number;
}) {
  const blockEntries = chinaBlocks.map((block) => ({
    block,
    control: getChinaBlockControl(block.id, year),
  }));

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
        <defs>
          <pattern id="contested-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path className="control-hatch-line" d="M 0 0 L 0 7" />
          </pattern>
        </defs>
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
            {blockEntries.map(({ block, control }) => {
              const blockPath = getChinaBlockPath(block);
              if (!blockPath) {
                return null;
              }

              const color = getChinaControllerColor(control?.controller);
              const isActive = activeBlockId === block.id;
              const isHovered = hoveredBlockId === block.id;
              const status = control?.status ?? "frontier";
              const confidence = control?.confidence ?? block.confidence;

              return (
                <g key={block.id}>
                  <path
                    className={`control-block level-${block.level} status-${status} confidence-${confidence} ${
                      isActive ? "active" : ""
                    } ${isHovered ? "hovered" : ""}`}
                    d={blockPath}
                    style={{ "--controller-color": color } as React.CSSProperties}
                    onMouseEnter={() => onHoverBlock(block.id)}
                    onMouseLeave={() => onHoverBlock(null)}
                    onFocus={() => onHoverBlock(block.id)}
                    onBlur={() => onHoverBlock(null)}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectBlock(block.id);
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`选择控制区块：${block.name}`}
                  />
                  {status === "contested" && <path className="control-block-hatch" d={blockPath} />}
                </g>
              );
            })}

            {naturalEarthChinaPhysical.rivers.features
              .filter((geoFeature) => getNaturalEarthScaleRank(geoFeature) <= 2)
              .map((geoFeature, index) => {
                const riverPath = path(geoFeature);
                if (!riverPath) {
                  return null;
                }

                return <path className="political-river-overlay" d={riverPath} key={`river-overlay-${index}`} />;
              })}

            {blockEntries.map(({ block, control }) => {
              const center = getProjectedPoint(block.center);
              if (!center) {
                return null;
              }

              return (
                <g className="control-block-label" key={`${block.id}-label`}>
                  <text x={center[0]} y={center[1]}>
                    {block.name}
                  </text>
                  <text className="controller-name" x={center[0]} y={center[1] + 4.4}>
                    {control?.controller ?? "待补"}
                  </text>
                </g>
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
  const [eventFilter, setEventFilter] = useState<ThreeKingdomsFilter>("all");
  const [eventDetailTab, setEventDetailTab] = useState<EventDetailTab>("overview");
  const [selectedChinaBlockId, setSelectedChinaBlockId] = useState<string | null>(null);
  const [hoveredChinaBlockId, setHoveredChinaBlockId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [personIndexFilter, setPersonIndexFilter] = useState<PersonIndexFilter>("all");

  const normalizedQuery = query.trim().toLowerCase();

  const matchingEvents = useMemo(() => {
    return events.filter((event) => eventMatchesQuery(event, normalizedQuery));
  }, [normalizedQuery]);

  const visibleEvents = useMemo(() => {
    return matchingEvents.filter((event) => isActiveInYear(event, year) || isNearYear(event, year));
  }, [matchingEvents, year]);

  const regionCounts = regions.reduce(
    (counts, region) => {
      counts[region.id] = visibleEvents.filter((event) => event.region === region.id).length;
      return counts;
    },
    {} as Record<Region, number>,
  );
  const worldComparisonItems = worldComparisonRegionOrder
    .map((regionId) => regions.find((region) => region.id === regionId))
    .filter((region): region is RegionInfo => Boolean(region))
    .map((region) => {
      const regionEvents = matchingEvents.filter((event) => event.region === region.id);
      const activeEvents = regionEvents.filter((event) => isActiveInYear(event, year));
      const featuredEvent = getNearestEventForYear(regionEvents, year);

      return {
        region,
        era: getRegionEra(region, year),
        activeEvents,
        featuredEvent,
        eventCount: regionEvents.length,
      };
    });

  const selectedRegionInfo = regions.find((region) => region.id === selectedRegion) ?? regions[0];
  const hoverRegionInfo = regions.find((region) => region.id === hoveredRegion);
  const summaryRegionInfo = regions.find((region) => region.id === summaryRegion);
  const inspectedRegion = hoverRegionInfo ?? summaryRegionInfo;
  const inspectedEra = inspectedRegion ? getRegionEra(inspectedRegion, year) : null;
  const selectedRegionEra = getRegionEra(selectedRegionInfo, year);
  const chinaRegionInfo = regions.find((region) => region.id === "china")!;
  const chinaRegionEra = getRegionEra(chinaRegionInfo, year);
  const chinaMapLayer = getChinaMapLayer(year);
  const chinaBlockSnapshots = useMemo(
    () =>
      chinaBlocks.map((block) => ({
        block,
        control: getChinaBlockControl(block.id, year),
      })),
    [year],
  );
  const selectedChinaBlock = selectedChinaBlockId ? (chinaBlockById.get(selectedChinaBlockId) ?? null) : null;
  const hoveredChinaBlock = hoveredChinaBlockId ? (chinaBlockById.get(hoveredChinaBlockId) ?? null) : null;
  const inspectedChinaBlock = hoveredChinaBlock ?? selectedChinaBlock;
  const inspectedChinaControl = inspectedChinaBlock ? getChinaBlockControl(inspectedChinaBlock.id, year) : null;

  const selectedRegionEvents = visibleEvents.filter((event) => event.region === selectedRegion);
  const filteredRegionEvents =
    selectedRegion === "china"
      ? selectedRegionEvents.filter((event) => matchesThreeKingdomsFilter(event, eventFilter))
      : selectedRegionEvents;
  const eventFilterCounts = Object.fromEntries(
    threeKingdomsFilters.map((filter) => [
      filter.id,
      selectedRegionEvents.filter((event) => matchesThreeKingdomsFilter(event, filter.id)).length,
    ]),
  ) as Record<ThreeKingdomsFilter, number>;
  const selectedEvent =
    filteredRegionEvents.find((event) => event.id === selectedId) ??
    filteredRegionEvents[0] ??
    events.find((event) => event.id === selectedId) ??
    events[0];
  const selectedEventDetail = selectedEvent.detail ?? null;

  const relatedEvents = selectedEvent.relatedEvents
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is HistoricalEvent => Boolean(event));
  const selectedEventPersonIds = (selectedEvent.personIds ?? []).filter((id) => chinaPersonById.has(id));
  const selectedPerson = selectedPersonId ? (chinaPersonById.get(selectedPersonId) ?? null) : null;
  const activeSelectedPersonId = selectedPerson?.id ?? null;
  const selectedPersonRelations = selectedPerson
    ? chinaPersonRelations.filter(
        (relation) => relation.sourcePersonId === selectedPerson.id || relation.targetPersonId === selectedPerson.id,
      )
    : [];
  const selectedPersonEvents = selectedPerson
    ? events
        .filter((event) => event.personIds?.includes(selectedPerson.id))
        .sort((left, right) => left.startYear - right.startYear || left.endYear - right.endYear)
    : [];
  const selectedPersonLifeEvents = selectedPerson
    ? chinaPersonLifeEvents
        .filter((lifeEvent) => lifeEvent.personId === selectedPerson.id)
        .sort((left, right) => getLifeEventSortValue(left) - getLifeEventSortValue(right) || left.displayYear.localeCompare(right.displayYear))
    : [];
  const relationshipGraphNodes = selectedPerson
    ? selectedPersonRelations.slice(0, 6).map((relation, index, relations) => {
        const isSource = relation.sourcePersonId === selectedPerson.id;
        const counterpartId = isSource ? relation.targetPersonId : relation.sourcePersonId;
        const angle = (-90 + (360 / Math.max(relations.length, 1)) * index) * (Math.PI / 180);

        return {
          relation,
          counterpartId,
          counterpart: chinaPersonById.get(counterpartId),
          x: 50 + Math.cos(angle) * 38,
          y: 50 + Math.sin(angle) * 39,
        };
      })
    : [];
  const selectedEventSourceRefs = selectedEvent.sourceRefs ?? [];
  const personLifeEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    chinaPersonLifeEvents.forEach((lifeEvent) => counts.set(lifeEvent.personId, (counts.get(lifeEvent.personId) ?? 0) + 1));
    return counts;
  }, []);
  const personRelationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    chinaPersonRelations.forEach((relation) => {
      counts.set(relation.sourcePersonId, (counts.get(relation.sourcePersonId) ?? 0) + 1);
      counts.set(relation.targetPersonId, (counts.get(relation.targetPersonId) ?? 0) + 1);
    });
    return counts;
  }, []);
  const personEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((event) => {
      event.personIds?.forEach((personId) => counts.set(personId, (counts.get(personId) ?? 0) + 1));
    });
    return counts;
  }, []);
  const personIndexCounts = Object.fromEntries(
    personIndexFilters.map((filter) => [
      filter.id,
      chinaPersons.filter((person) => matchesPersonIndexFilter(person, filter.id)).length,
    ]),
  ) as Record<PersonIndexFilter, number>;
  const visiblePersonIndex = useMemo(() => {
    return chinaPersons
      .map((person) => ({
        person,
        rank: getPersonSearchRank(person, normalizedQuery),
      }))
      .filter(({ person, rank }) => matchesPersonIndexFilter(person, personIndexFilter) && (!normalizedQuery || Number.isFinite(rank)))
      .sort(
        (left, right) =>
          left.rank - right.rank ||
          (personEventCounts.get(right.person.id) ?? 0) - (personEventCounts.get(left.person.id) ?? 0) ||
          left.person.name.localeCompare(right.person.name, "zh-Hans-CN"),
      )
      .map(({ person }) => person);
  }, [normalizedQuery, personEventCounts, personIndexFilter]);
  const personSearchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return chinaPersons
      .map((person) => ({ person, rank: getPersonSearchRank(person, normalizedQuery) }))
      .filter((item) => Number.isFinite(item.rank))
      .sort((left, right) => left.rank - right.rank || left.person.name.localeCompare(right.person.name, "zh-Hans-CN"))
      .map((item) => item.person)
      .slice(0, 8);
  }, [normalizedQuery]);
  const selectedPersonIsInEvent = selectedPerson ? selectedEventPersonIds.includes(selectedPerson.id) : false;

  useEffect(() => {
    setSelectedPersonId((current) =>
      current && selectedEventPersonIds.includes(current) ? current : (selectedEventPersonIds[0] ?? null),
    );
  }, [selectedEvent.id, selectedEventPersonIds.join("|")]);

  useEffect(() => {
    if (page !== "people") {
      return;
    }

    if (!visiblePersonIndex.length) {
      setSelectedPersonId(null);
      return;
    }

    if (!selectedPersonId || !visiblePersonIndex.some((person) => person.id === selectedPersonId)) {
      setSelectedPersonId(visiblePersonIndex[0].id);
    }
  }, [page, selectedPersonId, visiblePersonIndex]);

  useEffect(() => {
    setEventDetailTab("overview");
  }, [selectedEvent.id]);

  useEffect(() => {
    if (page !== "china" || chinaMapMode !== "political" || !selectedChinaBlockId) {
      return;
    }

    if (!chinaBlockById.has(selectedChinaBlockId)) {
      setSelectedChinaBlockId(null);
    }
  }, [chinaMapMode, page, selectedChinaBlockId]);

  function selectRegion(region: Region) {
    if (region === "china") {
      setPage("china");
      setChinaMapMode("political");
      setSelectedRegion("china");
      setSummaryRegion(null);
      setHoveredRegion(null);
      setSelectedChinaBlockId(null);
      setHoveredChinaBlockId(null);
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
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
  }

  function openPeopleIndex() {
    setPage("people");
    setSelectedRegion("china");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedPersonId((current) => current ?? "cao-cao");
  }

  function changeChinaMapMode(mode: ChinaMapMode) {
    setChinaMapMode(mode);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
  }

  function selectHistoricalEvent(event: HistoricalEvent) {
    setSelectedRegion(event.region);
    if (event.region === "china") {
      setPage("china");
      if (!matchesThreeKingdomsFilter(event, eventFilter)) {
        setEventFilter("all");
      }
    }

    setSelectedId(event.id);
    setYear(Math.min(yearMax, Math.max(yearMin, event.startYear)));
  }

  function selectPerson(personId: string) {
    setSelectedPersonId(personId);
  }

  return (
    <main className="app-shell">
      <section className="map-workspace">
        <header className="topbar">
          <div>
            <p className="kicker">ChronoAtlas</p>
            <h1>
              {page === "people"
                ? "人物索引：三国人物关系与生平"
                : page === "china"
                  ? "中国区域：三国格局"
                  : "四大区域同年对照"}
            </h1>
          </div>
          <div className="topbar-actions">
            <button
              className={`topbar-action ${page === "people" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "people"}
              onClick={openPeopleIndex}
            >
              <UsersRound size={17} aria-hidden="true" />
              <span>人物索引</span>
            </button>
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={page === "people" ? "搜索人物、字号、势力" : "搜索人物、政权、事件"}
              />
            </label>
          </div>
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
            <span>{chinaMapMode === "political" ? "州郡区块模型" : (chinaMapLayer?.title ?? chinaRegionEra.title)}</span>
          </div>
        )}

        {page === "people" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              世界总览
            </button>
            <button className="back-button" type="button" onClick={() => selectRegion("china")}>
              <MapPinned size={18} />
              中国地图
            </button>
            <span>{visiblePersonIndex.length}/{chinaPersons.length} 个人物</span>
          </div>
        )}

        {page === "people" ? (
          <section className="person-index-stage" aria-label="人物索引">
            <div className="person-index-summary">
              <div>
                <p className="kicker">人物资料库</p>
                <h2>三国人物索引</h2>
              </div>
              <div className="person-index-metrics">
                <div>
                  <span>当前结果</span>
                  <strong>{visiblePersonIndex.length}</strong>
                </div>
                <div>
                  <span>资料人物</span>
                  <strong>{chinaPersons.length}</strong>
                </div>
                <div>
                  <span>关系记录</span>
                  <strong>{chinaPersonRelations.length}</strong>
                </div>
              </div>
            </div>

            <div className="person-filter-bar" role="group" aria-label="人物分组筛选">
              {personIndexFilters.map((filter) => (
                <button
                  className={`person-filter-button ${personIndexFilter === filter.id ? "selected" : ""}`}
                  key={filter.id}
                  type="button"
                  aria-pressed={personIndexFilter === filter.id}
                  onClick={() => setPersonIndexFilter(filter.id)}
                >
                  <span>{filter.label}</span>
                  <small>{personIndexCounts[filter.id]}</small>
                </button>
              ))}
            </div>

            <div className="person-index-grid">
              {visiblePersonIndex.length ? (
                visiblePersonIndex.map((person) => (
                  <button
                    className={`person-index-card ${activeSelectedPersonId === person.id ? "selected" : ""}`}
                    data-person-id={person.id}
                    key={person.id}
                    type="button"
                    onClick={() => selectPerson(person.id)}
                  >
                    <span className="person-index-name">
                      <strong>{person.name}</strong>
                      {person.courtesyName && <small>字{person.courtesyName}</small>}
                    </span>
                    <span className="person-index-life">{person.life ?? "生卒未详"}</span>
                    <span className="person-index-polity">{person.primaryPolity}</span>
                    <span className="person-index-summary-text">{person.summary}</span>
                    <span className="person-index-card-stats">
                      <span>{personLifeEventCounts.get(person.id) ?? 0} 生平</span>
                      <span>{personRelationCounts.get(person.id) ?? 0} 关系</span>
                      <span>{personEventCounts.get(person.id) ?? 0} 事件</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty-state">暂无匹配人物</div>
              )}
            </div>
          </section>
        ) : (
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
              activeBlockId={selectedChinaBlockId}
              hoveredBlockId={hoveredChinaBlockId}
              mapMode={chinaMapMode}
              onSelectBlock={setSelectedChinaBlockId}
              onHoverBlock={setHoveredChinaBlockId}
              onClearSummary={() => {
                setSelectedChinaBlockId(null);
                setHoveredChinaBlockId(null);
              }}
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
                  matchingEvents.filter((event) => event.region === inspectedRegion.id),
                  year,
                )}
              </p>
              <div className="summary-meta">
                <span>{inspectedEra.title}</span>
                <strong>{regionCounts[inspectedRegion.id]} 个事件</strong>
              </div>
            </aside>
          )}

          {page === "china" && chinaMapMode === "political" && inspectedChinaBlock && (
            <aside
              className="hover-summary regional-summary"
              style={
                {
                  "--accent": getChinaControllerColor(inspectedChinaControl?.controller),
                } as React.CSSProperties
              }
              aria-live="polite"
            >
              <div className="summary-heading">
                <MapPinned size={18} aria-hidden="true" />
                <span>{hoveredChinaBlock ? "悬停控制区块" : "选中控制区块"}</span>
                <button
                  className="summary-close"
                  type="button"
                  aria-label="关闭区域信息"
                  title="关闭区域信息"
                  onClick={() => {
                    setSelectedChinaBlockId(null);
                    setHoveredChinaBlockId(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <h2>{inspectedChinaBlock.name}</h2>
              <p>
                {inspectedChinaControl?.controller ?? "待补"}在 {formatChinaControlRange(inspectedChinaControl)}
                对此区块为{getChinaControlStatusLabel(inspectedChinaControl?.status)}。此层为控制区块与势力范围近似，不是精确国界。
              </p>
              <div className="summary-meta">
                <span>
                  {getChinaBlockLevelLabel(inspectedChinaBlock.level)} ·{" "}
                  {getChinaControlStatusLabel(inspectedChinaControl?.status)}
                </span>
                <strong>{getConfidenceLabel(inspectedChinaControl?.confidence ?? inspectedChinaBlock.confidence)}</strong>
              </div>
            </aside>
          )}
          </section>
        )}

        {page === "world" && (
          <section className="world-comparison" aria-label={`${year} 年四大区域同年对照`}>
            <div className="world-comparison-heading">
              <div>
                <p className="kicker">同年对照</p>
                <h2>{year} 年的四大区域局势</h2>
              </div>
              <span>当前年份决定时代背景；事件卡显示同年或最近资料节点。</span>
            </div>

            <div className="comparison-grid">
              {worldComparisonItems.map((item) => {
                const isSelected = item.region.id === selectedRegion;
                const isCurrentEvent = item.featuredEvent ? isActiveInYear(item.featuredEvent, year) : false;
                const actionLabel = item.region.id === "china" ? "进入中国三国" : "查看区域概览";

                return (
                  <article
                    className={`comparison-card ${isSelected ? "selected" : ""}`}
                    key={item.region.id}
                    role="button"
                    tabIndex={0}
                    style={{ "--accent": item.region.accent } as React.CSSProperties}
                    onClick={() => selectRegion(item.region.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectRegion(item.region.id);
                      }
                    }}
                  >
                    <div className="comparison-card-header">
                      <span>{item.region.label}</span>
                      <strong>{item.activeEvents.length ? `${item.activeEvents.length} 个当前事件` : `${item.eventCount} 个资料节点`}</strong>
                    </div>
                    <div className="comparison-era">
                      <small>{item.era.title}</small>
                      <p>{item.era.summary}</p>
                    </div>
                    <div className="comparison-event">
                      <span>{isCurrentEvent ? "当前事件" : "邻近事件"}</span>
                      {item.featuredEvent ? (
                        <>
                          <strong>{item.featuredEvent.title}</strong>
                          <small>
                            {formatYearRange(item.featuredEvent)} · {categoryLabels[item.featuredEvent.category]}
                          </small>
                        </>
                      ) : (
                        <>
                          <strong>资料待补</strong>
                          <small>当前搜索下没有匹配节点</small>
                        </>
                      )}
                    </div>
                    <span className="comparison-action">{actionLabel}</span>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {page !== "people" && (
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
              step={1}
              value={year}
              onInput={(event) => setYear(Number(event.currentTarget.value))}
              onChange={(event) => setYear(Number(event.target.value))}
            />
            <div className="range-labels">
              <span>190</span>
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
        )}
      </section>

      <aside className="detail-panel" aria-label="区域与事件详情">
        <div className="region-detail">
          <div
            className="detail-eyebrow"
            style={{ color: page === "china" || page === "people" ? "#b94f32" : selectedRegionInfo.accent }}
          >
            {page === "people" ? <UsersRound size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
            <span>{page === "people" ? "人物档案" : page === "china" ? "中国" : selectedRegionInfo.label}</span>
          </div>
          <h2>
            {page === "people"
              ? (selectedPerson?.name ?? "人物索引")
              : page === "china" && chinaMapMode === "political"
              ? "控制区块 / 势力范围近似"
              : page === "china"
                ? (chinaMapLayer?.title ?? chinaRegionEra.title)
                : selectedRegionEra.title}
          </h2>
          <p className="detail-summary">
            {page === "people"
              ? (selectedPerson?.summary ?? "暂无选中人物")
              : page === "china" && chinaMapMode === "political"
              ? `${year} 年按州与重点郡级区块显示控制者。区块颜色表示当前控制权，争夺区使用斜线样式；该层是势力范围近似，不是精确国界。`
              : page === "china"
                ? (chinaMapLayer?.summary ?? chinaRegionEra.summary)
                : selectedRegionEra.summary}
          </p>
        </div>

        {page === "people" && (
          <section className="detail-section person-detail-section standalone-person-detail">
            {selectedPerson ? (
              <article className="person-card">
                <div className="person-card-header">
                  <div>
                    <span>人物档案</span>
                    <h4>
                      {selectedPerson.name}
                      {selectedPerson.courtesyName ? ` · 字${selectedPerson.courtesyName}` : ""}
                    </h4>
                  </div>
                  <strong>{selectedPerson.life ?? "生卒未详"}</strong>
                </div>
                <div className="person-meta">
                  <span>{selectedPerson.primaryPolity}</span>
                  {selectedPerson.roles.map((role) => (
                    <span key={role}>{role}</span>
                  ))}
                </div>
                <div className="person-stats">
                  <div>
                    <span>生平节点</span>
                    <strong>{selectedPersonLifeEvents.length}</strong>
                  </div>
                  <div>
                    <span>人物关系</span>
                    <strong>{selectedPersonRelations.length}</strong>
                  </div>
                  <div>
                    <span>参与事件</span>
                    <strong>{selectedPersonEvents.length}</strong>
                  </div>
                </div>

                <div className="person-event-heading">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>生平年表</span>
                  <strong>{selectedPersonLifeEvents.length}</strong>
                </div>
                <div className="person-life-timeline">
                  {selectedPersonLifeEvents.length ? (
                    selectedPersonLifeEvents.map((lifeEvent) => {
                      const linkedEvent = lifeEvent.relatedEventIds
                        .map((eventId) => events.find((event) => event.id === eventId))
                        .find((event): event is HistoricalEvent => Boolean(event));

                      return (
                        <PersonLifeEventCard
                          key={lifeEvent.id}
                          lifeEvent={lifeEvent}
                          linkedEvent={linkedEvent}
                          selectedEventId={selectedEvent.id}
                          onSelectEvent={selectHistoricalEvent}
                        />
                      );
                    })
                  ) : (
                    <p>待补充生平年表</p>
                  )}
                </div>

                <div className="relation-heading">
                  <Network size={16} aria-hidden="true" />
                  <span>人物关系</span>
                </div>
                <div className="relationship-list">
                  {selectedPersonRelations.length ? (
                    selectedPersonRelations.map((relation) => {
                      const isSource = relation.sourcePersonId === selectedPerson.id;
                      const counterpartId = isSource ? relation.targetPersonId : relation.sourcePersonId;
                      const counterpart = chinaPersonById.get(counterpartId);

                      return (
                        <button
                          className="relationship-item"
                          data-person-relation-id={relation.id}
                          key={relation.id}
                          type="button"
                          onClick={() => selectPerson(counterpartId)}
                        >
                          <span className="relationship-title">
                            <span>{getRelationTypeLabel(relation.type)}</span>
                            <strong>{counterpart?.name ?? counterpartId}</strong>
                          </span>
                          <small>{formatYearSpan(relation.startYear, relation.endYear)}</small>
                          <span className="relationship-summary">{relation.summary}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p>待补充人物关系</p>
                  )}
                </div>

                <div className="person-event-heading">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>关联大事件</span>
                  <strong>{selectedPersonEvents.length}</strong>
                </div>
                <div className="person-event-timeline">
                  {selectedPersonEvents.length ? (
                    selectedPersonEvents.map((event) => (
                      <button
                        className={`person-event-item ${event.id === selectedEvent.id ? "selected" : ""}`}
                        data-person-event-id={event.id}
                        key={event.id}
                        type="button"
                        onClick={() => selectHistoricalEvent(event)}
                      >
                        <span>{formatYearRange(event)}</span>
                        <strong>{event.title}</strong>
                        <small>{event.locationName ?? "地点待补"}</small>
                      </button>
                    ))
                  ) : (
                    <p>待补充人物事件</p>
                  )}
                </div>

                <div className="source-list compact">
                  {selectedPerson.sourceRefs.map((ref) => (
                    <SourceRefLink key={`${selectedPerson.id}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
                  ))}
                </div>
              </article>
            ) : (
              <div className="empty-state">暂无匹配人物</div>
            )}
          </section>
        )}

        {page !== "people" && page === "china" && chinaMapMode === "political" && (
          <section className="event-list">
            <h3>控制区块</h3>
            <div className="chips block-chip-list">
              {chinaBlockSnapshots.map(({ block, control }) => (
                <button
                  className={`chip-button block-chip ${selectedChinaBlockId === block.id ? "selected" : ""}`}
                  key={block.id}
                  type="button"
                  style={{ "--controller-color": getChinaControllerColor(control?.controller) } as React.CSSProperties}
                  onMouseEnter={() => setHoveredChinaBlockId(block.id)}
                  onMouseLeave={() => setHoveredChinaBlockId(null)}
                  onClick={() => setSelectedChinaBlockId(block.id)}
                >
                  <span className="controller-swatch" aria-hidden="true" />
                  <span>{block.name}</span>
                  <small>{control?.controller ?? "待补"}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        {page !== "people" && (
          <section className="event-list">
          <div className="event-list-heading">
            <h3>区域事件</h3>
            {selectedRegion === "china" && (
              <span>
                {filteredRegionEvents.length}/{selectedRegionEvents.length}
              </span>
            )}
          </div>
          {selectedRegion === "china" && (
            <div className="event-filter-bar" role="group" aria-label="三国事件筛选">
              {threeKingdomsFilters.map((filter) => (
                <button
                  className={`event-filter-button ${eventFilter === filter.id ? "selected" : ""}`}
                  data-event-filter={filter.id}
                  key={filter.id}
                  type="button"
                  aria-pressed={eventFilter === filter.id}
                  onClick={() => setEventFilter(filter.id)}
                >
                  <span>{filter.label}</span>
                  <small>{eventFilterCounts[filter.id]}</small>
                </button>
              ))}
            </div>
          )}
          <div className="event-stack">
            {filteredRegionEvents.length ? (
              filteredRegionEvents.map((event) => (
                <button
                  className={`event-card ${event.id === selectedEvent.id ? "selected" : ""}`}
                  key={event.id}
                  type="button"
                  onClick={() => selectHistoricalEvent(event)}
                >
                  <span className="event-year">{formatYearRange(event)}</span>
                  <strong>{event.title}</strong>
                  <span>{event.summary}</span>
                </button>
              ))
            ) : (
              <div className="empty-state">当前筛选下暂无事件</div>
            )}
          </div>
          </section>
        )}

        {page === "china" && normalizedQuery && (
          <section className="event-list person-search-panel">
            <div className="event-list-heading">
              <h3>人物结果</h3>
              <span>{personSearchResults.length}</span>
            </div>
            {personSearchResults.length ? (
              <div className="person-result-grid">
                {personSearchResults.map((person) => (
                  <button
                    className={`person-result ${activeSelectedPersonId === person.id ? "selected" : ""}`}
                    data-person-id={person.id}
                    key={person.id}
                    type="button"
                    onClick={() => selectPerson(person.id)}
                  >
                    <span>{person.name}</span>
                    <small>{person.life ?? "生卒未详"} · {person.primaryPolity}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">暂无匹配人物</div>
            )}
          </section>
        )}

        {page !== "people" && (
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

          {selectedEventDetail && (
            <section className="detail-section event-deep-detail">
              <h3>
                <BookOpen size={17} aria-hidden="true" />
                事件详解
              </h3>
              <div className="event-detail-tabs" role="tablist" aria-label={`${selectedEvent.title}结构化详情`}>
                {eventDetailTabs.map((tab) => (
                  <button
                    className={`event-detail-tab ${eventDetailTab === tab.id ? "selected" : ""}`}
                    data-event-detail-tab={tab.id}
                    key={tab.id}
                    type="button"
                    aria-selected={eventDetailTab === tab.id}
                    role="tab"
                    onClick={() => setEventDetailTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="event-detail-panel" role="tabpanel">
                {eventDetailTab === "overview" && (
                  <div className="event-detail-grid">
                    <article>
                      <span>核心判断</span>
                      <p>{selectedEvent.summary}</p>
                    </article>
                    {hasDetailItems(selectedEventDetail.result) && (
                      <article>
                        <span>结果</span>
                        <ul>
                          {selectedEventDetail.result!.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                  </div>
                )}

                {eventDetailTab === "background" && (
                  <ul className="event-detail-list">
                    {selectedEventDetail.background?.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}

                {eventDetailTab === "process" && (
                  <ul className="event-detail-list">
                    {selectedEventDetail.process?.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}

                {eventDetailTab === "impact" && (
                  <div className="event-detail-grid">
                    {hasDetailItems(selectedEventDetail.result) && (
                      <article>
                        <span>直接结果</span>
                        <ul>
                          {selectedEventDetail.result!.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                    {hasDetailItems(selectedEventDetail.impact) && (
                      <article>
                        <span>后续影响</span>
                        <ul>
                          {selectedEventDetail.impact!.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                  </div>
                )}

                {eventDetailTab === "sources" && (
                  <div className="event-detail-grid">
                    {hasDetailItems(selectedEventDetail.sourceNotes) && (
                      <article>
                        <span>史料说明</span>
                        <ul>
                          {selectedEventDetail.sourceNotes!.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                    {hasDetailItems(selectedEventDetail.uncertainty) && (
                      <article>
                        <span>不确定性</span>
                        <ul>
                          {selectedEventDetail.uncertainty!.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="detail-section person-detail-section">
            <div className="person-section-heading">
              <h3>
                <UsersRound size={17} aria-hidden="true" />
                人物详情
              </h3>
              {selectedPerson && !selectedPersonIsInEvent && selectedEventPersonIds.length > 0 && (
                <button className="text-action" type="button" onClick={() => selectPerson(selectedEventPersonIds[0])}>
                  回到事件人物
                </button>
              )}
            </div>
            <div className="chips">
              {selectedEventPersonIds.length ? (
                selectedEventPersonIds.map((personId) => {
                  const person = chinaPersonById.get(personId)!;

                  return (
                    <button
                      className={`chip-button person-chip ${activeSelectedPersonId === personId ? "selected" : ""}`}
                      data-person-id={personId}
                      key={personId}
                      type="button"
                      onClick={() => selectPerson(personId)}
                    >
                      <span>{person.name}</span>
                      <small>{person.primaryPolity}</small>
                    </button>
                  );
                })
              ) : selectedEvent.people.length ? (
                selectedEvent.people.map((person) => <span key={person}>{person}</span>)
              ) : (
                <span>待补充</span>
              )}
            </div>

            {selectedPerson && (
              <article className="person-card">
                <div className="person-card-header">
                  <div>
                    <span>人物档案</span>
                    <h4>
                      {selectedPerson.name}
                      {selectedPerson.courtesyName ? ` · 字${selectedPerson.courtesyName}` : ""}
                    </h4>
                  </div>
                  <strong>{selectedPerson.life ?? "生卒未详"}</strong>
                </div>
                <p>{selectedPerson.summary}</p>
                <div className="person-meta">
                  <span>{selectedPerson.primaryPolity}</span>
                  {selectedPerson.roles.map((role) => (
                    <span key={role}>{role}</span>
                  ))}
                </div>
                <div className="person-stats">
                  <div>
                    <span>生平节点</span>
                    <strong>{selectedPersonLifeEvents.length}</strong>
                  </div>
                  <div>
                    <span>人物关系</span>
                    <strong>{selectedPersonRelations.length}</strong>
                  </div>
                  <div>
                    <span>参与事件</span>
                    <strong>{selectedPersonEvents.length}</strong>
                  </div>
                </div>

                <div className="person-event-heading">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>生平年表</span>
                  <strong>{selectedPersonLifeEvents.length}</strong>
                </div>
                <div className="person-life-timeline">
                  {selectedPersonLifeEvents.length ? (
                    selectedPersonLifeEvents.map((lifeEvent) => {
                      const linkedEvent = lifeEvent.relatedEventIds
                        .map((eventId) => events.find((event) => event.id === eventId))
                        .find((event): event is HistoricalEvent => Boolean(event));
                      return (
                        <PersonLifeEventCard
                          key={lifeEvent.id}
                          lifeEvent={lifeEvent}
                          linkedEvent={linkedEvent}
                          selectedEventId={selectedEvent.id}
                          onSelectEvent={selectHistoricalEvent}
                        />
                      );
                    })
                  ) : (
                    <p>待补充生平年表</p>
                  )}
                </div>

                <div className="relation-heading">
                  <Network size={16} aria-hidden="true" />
                  <span>人物关系</span>
                </div>
                {relationshipGraphNodes.length > 0 && (
                  <div className="relationship-graph" aria-label={`${selectedPerson.name}的人物关系图`}>
                    <svg className="relationship-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      {relationshipGraphNodes.map((node) => (
                        <line
                          key={node.relation.id}
                          x1="50"
                          y1="50"
                          x2={node.x}
                          y2={node.y}
                          style={{ "--relation-color": getRelationColor(node.relation.type) } as React.CSSProperties}
                        />
                      ))}
                    </svg>
                    <div className="graph-node center">
                      <strong>{selectedPerson.name}</strong>
                      <small>{selectedPerson.primaryPolity}</small>
                    </div>
                    {relationshipGraphNodes.map((node) => (
                      <button
                        className="graph-node relation"
                        data-person-id={node.counterpartId}
                        key={node.relation.id}
                        type="button"
                        style={
                          {
                            "--node-x": `${node.x}%`,
                            "--node-y": `${node.y}%`,
                            "--relation-color": getRelationColor(node.relation.type),
                          } as React.CSSProperties
                        }
                        onClick={() => selectPerson(node.counterpartId)}
                      >
                        <small>{getRelationTypeLabel(node.relation.type)}</small>
                        <strong>{node.counterpart?.name ?? node.counterpartId}</strong>
                      </button>
                    ))}
                  </div>
                )}
                <div className="relationship-list">
                  {selectedPersonRelations.length ? (
                    selectedPersonRelations.map((relation) => {
                      const isSource = relation.sourcePersonId === selectedPerson.id;
                      const counterpartId = isSource ? relation.targetPersonId : relation.sourcePersonId;
                      const counterpart = chinaPersonById.get(counterpartId);

                      return (
                        <button
                          className="relationship-item"
                          data-person-relation-id={relation.id}
                          key={relation.id}
                          type="button"
                          onClick={() => selectPerson(counterpartId)}
                        >
                          <span className="relationship-title">
                            <span>{getRelationTypeLabel(relation.type)}</span>
                            <strong>{counterpart?.name ?? counterpartId}</strong>
                          </span>
                          <small>{formatYearSpan(relation.startYear, relation.endYear)}</small>
                          <span className="relationship-summary">{relation.summary}</span>
                          <span className="relationship-sources">
                            {relation.sourceRefs.slice(0, 2).map((ref) => (
                              <SourceRefLink interactive={false} key={`${relation.id}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
                            ))}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p>待补充人物关系</p>
                  )}
                </div>

                <div className="person-event-heading">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>关联大事件</span>
                  <strong>{selectedPersonEvents.length}</strong>
                </div>
                <div className="person-event-timeline">
                  {selectedPersonEvents.length ? (
                    selectedPersonEvents.map((event) => (
                      <button
                        className={`person-event-item ${event.id === selectedEvent.id ? "selected" : ""}`}
                        data-person-event-id={event.id}
                        key={event.id}
                        type="button"
                        onClick={() => selectHistoricalEvent(event)}
                      >
                        <span>{formatYearRange(event)}</span>
                        <strong>{event.title}</strong>
                        <small>{event.locationName ?? "地点待补"}</small>
                        <span className="person-event-tags">
                          <span>{categoryLabels[event.category]}</span>
                          {event.polities.slice(0, 2).map((polity) => (
                            <span key={`${event.id}-${polity}`}>{polity}</span>
                          ))}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p>待补充人物事件</p>
                  )}
                </div>

                <div className="source-list compact">
                  {selectedPerson.sourceRefs.map((ref) => (
                    <SourceRefLink key={`${selectedPerson.id}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
                  ))}
                </div>
              </article>
            )}
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
                  <button key={event.id} type="button" onClick={() => selectHistoricalEvent(event)}>
                    <span>{formatYearRange(event)}</span>
                    <strong>{event.title}</strong>
                  </button>
                ))
              ) : (
                <p>暂无关联事件</p>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h3>
              <BookOpen size={17} aria-hidden="true" />
              出处
            </h3>
            <div className="source-list">
              {selectedEventSourceRefs.length ? (
                selectedEventSourceRefs.map((ref) => {
                  const source = chinaSourceById.get(ref.sourceId);

                  return (
                    <article className="source-item" key={`${ref.sourceId}-${ref.locator ?? ""}`}>
                      <SourceRefLink className="source-title-link" sourceRef={ref} />
                      <SourceExcerpt quote={ref.quote} />
                      {source?.note && <span>{source.note}</span>}
                    </article>
                  );
                })
              ) : selectedEvent.sources.length ? (
                selectedEvent.sources.map((source) => (
                  <article className="source-item" key={source}>
                    <strong>{source}</strong>
                  </article>
                ))
              ) : (
                <p>待补充出处</p>
              )}
            </div>
          </section>
          </section>
        )}
      </aside>
    </main>
  );
}

type ChronoAtlasWindow = Window & {
  __chronoAtlasRoot?: ReturnType<typeof createRoot>;
};

const rootElement = document.getElementById("root")!;
const chronoAtlasWindow = window as ChronoAtlasWindow;
const root = chronoAtlasWindow.__chronoAtlasRoot ?? createRoot(rootElement);
chronoAtlasWindow.__chronoAtlasRoot = root;

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
