import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  Compass,
  Grid3x3,
  Info,
  Layers,
  Link2,
  MapPinned,
  Mountain,
  Network,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import "./styles.css";

type Region = "china" | "rome" | "sasanian-persia" | "india";

type EventCategory =
  | "campaign"
  | "politics"
  | "succession"
  | "war"
  | "society"
  | "culture"
  | "economy"
  | "diplomacy"
  | "religion"
  | "frontier";
type EventImportance = "major" | "medium" | "minor" | "detail";
type Locale = "zh" | "en";
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
  importance?: EventImportance;
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
  titleZh?: string | null;
  titleEn?: string | null;
  eventLabel?: string;
  places?: string[];
  macroEvent?: string;
  translation?: string;
  mapFeatureIds?: string[];
};

type EventDeepDetail = {
  background?: string[];
  process?: string[];
  result?: string[];
  impact?: string[];
  sourceNotes?: string[];
  uncertainty?: string[];
};

type EventImportanceDataset = {
  model: "event-importance";
  defaultImportance: EventImportance;
  records: Array<{
    eventId: string;
    importance: EventImportance;
  }>;
};

type EventDetailTab = "overview" | "background" | "process" | "impact" | "sources";
type CoverageGapFilter = "all" | "below-target" | "missing-event-evidence" | "missing-original" | "period-mismatch";

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

type SourceMention = {
  id: string;
  sourceId: string;
  workTitle: string;
  bookTitle: string;
  chapterTitle: string;
  locator: string;
  year: number | null;
  text: string;
  translation: string | null;
  mentionedPersonIds: string[];
  mentionedEventIds: string[];
  mentionedPlaceIds?: string[];
  tags: string[];
  confidence: "high" | "medium" | "low";
  reviewStatus: "draft" | "reviewed";
  disputeNote?: string | null;
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
  sourceMentionIds?: string[];
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

type FocusLifeEvent = {
  inferred: boolean;
  lifeEvent: PersonLifeEvent;
  person: HistoricalPerson;
  rank: number;
};

type PersonAnnualTimelineItem = {
  activities: PersonLifeEvent[];
  inferredFrom?: PersonLifeEvent;
  year: number;
};

type Page = "home" | "world" | "china" | "rome" | "people" | "age" | "evidence" | "compare" | "coverage" | "map-debug";
type ChinaMapMode = "political" | "terrain" | "three-d" | "commandery";
type ThreeKingdomsFilter = "all" | "cao-wei" | "shu-han" | "sun-wu" | "late-han" | "war" | "politics";
type PersonIndexFilter = "all" | "cao-wei" | "shu-han" | "sun-wu" | "late-han" | "rome" | "sasanian-persia";
type AgeRegionFilter = "all" | "china" | "rome" | "sasanian-persia" | "india";

type EvidenceRegionFilter = "all" | Region;

type AgePerson = {
  id: string;
  name: string;
  region: AgeRegionFilter;
  polity: string;
  roles: string[];
  birthYear: number;
  deathYear?: number | null;
  summary: string;
  source: "person-index" | "age-supplement";
};

type PersonIndexItem = {
  id: string;
  name: string;
  courtesyName: string | null;
  life: string | null;
  primaryPolity: string;
  roles: string[];
  summary: string;
  source: "china-person-index" | "age-supplement";
  region: AgeRegionFilter;
  birthYear?: number;
  deathYear?: number | null;
};

type EvidenceSearchResult = {
  id: string;
  searchDocumentId: string;
  chunkIndex: number;
  subjectTable: string;
  subjectId: string;
  title: string;
  snippet: string;
  language: string | null;
  regionId: string | null;
  periodId: string | null;
  topicId: string | null;
  timeStart: number | null;
  timeEnd: number | null;
  tokenEstimate: number;
  reviewStatus: string;
  rankBucket: number;
  sourceId?: string | null;
  sourceTitle?: string | null;
  locator?: string | null;
  quote?: string | null;
  translation?: string | null;
  confidence?: "high" | "medium" | "low" | null;
  disputeNote?: string | null;
  peopleCore?: string[];
  peopleMentioned?: string[];
  places?: string[];
  eventLabel?: string | null;
  macroEvent?: string | null;
  factType?: string | null;
  entities: Array<{
    id: string;
    entityType: string;
    label: string;
    regionId: string | null;
    role: string;
  }>;
};

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

type PeriodStatus = "complete" | "planned" | "background";

type OverviewFocusRegion = {
  id: string;
  label: string;
  tier: "core" | "secondary" | "context";
  summary: string;
  coordinates?: LonLat;
};

type OverviewPeriod = {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  color: string;
  status: PeriodStatus;
  focusRegions: OverviewFocusRegion[];
  context: string[];
  snapshotYears: number[];
  summary: string;
  detailEntryYear?: number;
};

type ChinaPolity = BoundaryGroup & {
  accent: string;
  capitalName: string;
  capital: LonLat;
  center: LonLat;
  summary: string;
};

type RomanProvince = {
  id: number;
  n: string;
  x: number;
  y: number;
  g: LonLat[][];
  family: string;
};

type RomanControlRecord = {
  pid: number;
  start: number;
  end: number;
  ctrl: string;
  color: string;
};

type FrontendRomanControlDb = {
  physical?: {
    coast?: LonLat[][];
    rivers?: LonLat[][];
  };
  provinces: RomanProvince[];
  timeline: RomanControlRecord[];
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
  controlBlockId?: string;
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

type FrontendChinaControlDb = {
  adminBlocks: ChinaAdminBlocksDataset;
  controlTimeline: ChinaControlTimeline;
};

type FrontendPeopleIndexDb = {
  persons: HistoricalPerson[];
  personLifeEvents: PersonLifeEvent[];
  personRelations: PersonRelation[];
};

type FrontendSourcesDb = {
  sources: SourceRecord[];
  sourceMentions: SourceMention[];
};

type FrontendRegionsDb = {
  generatedFrom?: string;
  regions: RegionInfo[];
};

type FrontendPeriodOverviewDb = {
  schemaVersion: number;
  model: "period-overview";
  range?: [number, number];
  overviewYearMin?: number;
  overviewYearMax?: number;
  periods?: OverviewPeriod[];
  regionCoordinates?: Record<string, LonLat>;
  periodRegionCoordinates?: Record<string, Record<string, LonLat>>;
  regionZoneSizes?: Record<string, { width: number; height: number; rotate?: number }>;
};

type CoverageRegion = {
  id: Exclude<Region, "india">;
  label: string;
  expectedPeriodIds: string[];
  minimums: {
    events: number;
    entities: number;
    evidence: number;
  };
  metrics: {
    events: number;
    eventsWithEvidence: number;
    peopleEntities: number;
    peopleWithEvidence: number;
    participantNames: number;
    evidenceDocuments: number;
    evidenceWithSource: number;
    evidenceMissingOriginal: number;
    periodMismatch: number;
  };
  gaps: string[];
  missingEvidenceEvents: Array<{ id: string; title: string; year: number | null }>;
  missingOriginalExamples: Array<{ id: string; title: string; year: number | null }>;
};

type FrontendCoverageDb = {
  schemaVersion: number;
  purpose: "frontend-coverage-190-310";
  range: [number, number];
  generatedAt: string;
  regions: CoverageRegion[];
};

type FrontendMapGeometryDebugDb = {
  purpose: "frontend-map-geometry-debug";
  dataset: {
    id: string;
    label: string;
    model: string;
    time_start: number | null;
    time_end: number | null;
    review_status: string;
  };
  controlDataset: {
    id: string;
    label: string;
    model: string;
    time_start: number;
    time_end: number;
    review_status: string;
  } | null;
  summary: {
    features: number;
    geometries: number;
    sources: number;
    controllers: number;
    controlRecords: number;
    controlSources: number;
  };
  features: Array<{
    id: string;
    name: string;
    feature_type: string;
    admin_level: string | null;
    parent_feature_id: string | null;
    control_feature_id: string | null;
    confidence: string;
    approximate: number;
    min_lon: number | null;
    min_lat: number | null;
    max_lon: number | null;
    max_lat: number | null;
    geometry_type: string | null;
    point_count: number | null;
    ring_count: number | null;
    control_record_count: number;
    source_count: number;
  }>;
  controllers: Array<{ id: string; label: string; color: string; sort_order: number }>;
  controlRecords: Array<{
    id: string;
    feature_id: string;
    feature_name: string | null;
    controller: string;
    start_year: number;
    end_year: number;
    status: string;
    confidence: string;
    source_count: number;
  }>;
  sourceSamples: Array<{
    feature_id: string;
    source_role: string;
    note: string | null;
    confidence: string;
  }>;
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

let eventImportanceDataset: EventImportanceDataset = {
  model: "event-importance",
  defaultImportance: "medium",
  records: [],
};
const emptyChinaMap: ChinaMapLayer = {
  id: "china-three-kingdoms-180-280",
  label: "China Three Kingdoms map",
  view: {
    northWest: [78, 50],
    southEast: [132, 16],
    padding: 18,
  },
  eras: [],
  cities: [],
  sources: [],
};
const emptyFeatureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
  type: "FeatureCollection",
  features: [],
};
const emptyNaturalEarthChinaPhysical: NaturalEarthPhysical = {
  source: "Natural Earth 10m physical vectors via natural-earth-vector GeoJSON",
  license: "Public domain",
  sourceUrls: {},
  bbox: {
    west: 76,
    south: 15,
    east: 134,
    north: 51,
  },
  land: emptyFeatureCollection,
  rivers: emptyFeatureCollection,
  lakes: emptyFeatureCollection,
  geographyRegions: emptyFeatureCollection,
};
const emptyRomanControlDb: FrontendRomanControlDb = { provinces: [], timeline: [] };
const emptyPeopleIndexDb: FrontendPeopleIndexDb = {
  persons: [],
  personLifeEvents: [],
  personRelations: [],
};
const emptySourcesDb: FrontendSourcesDb = {
  sources: [],
  sourceMentions: [],
};
const emptyChinaControlDb: FrontendChinaControlDb = {
  adminBlocks: {
    schemaVersion: 1,
    model: "china-admin-block-map",
    range: [190, 280],
    notes: "",
    blocks: [],
  },
  controlTimeline: {
    schemaVersion: 1,
    model: "china-block-control-timeline",
    range: [190, 280],
    keyYears: [],
    controllers: [],
    records: [],
  },
};
const emptyHistoricalEvent: HistoricalEvent = {
  id: "__empty__",
  title: "数据加载中",
  startYear: 220,
  endYear: 220,
  region: "china",
  category: "politics",
  summary: "事件数据正在从 SQLite API 载入。",
  people: [],
  polities: [],
  relatedEvents: [],
  tags: [],
  confidence: "medium",
  sources: [],
};
const emptyRegionEra: RegionEra = {
  startYear: 190,
  endYear: 310,
  title: "Runtime loading",
  summary: "Region data is loading from the API.",
  boundaryType: "effective-control",
  confidence: "low",
  boundary: [],
  sources: [],
};
const emptyRegions: RegionInfo[] = [
  { id: "china", label: "中国", accent: "#5b9279", eras: [emptyRegionEra] },
  { id: "rome", label: "罗马", accent: "#5b6fbb", eras: [emptyRegionEra] },
  { id: "sasanian-persia", label: "萨珊", accent: "#9a7a2f", eras: [emptyRegionEra] },
  { id: "india", label: "印度", accent: "#b56b4d", eras: [emptyRegionEra] },
];
let regions = emptyRegions;
let chinaSources: SourceRecord[] = [];
let chinaSourceMentions: SourceMention[] = [];
let chinaSourceById = new Map<string, SourceRecord>();
let chinaSourceMentionById = new Map<string, SourceMention>();
let chinaPersons: HistoricalPerson[] = [];
let chinaPersonLifeEvents: PersonLifeEvent[] = [];
let chinaPersonRelations: PersonRelation[] = [];
let chinaPersonById = new Map<string, HistoricalPerson>();
let eventImportanceById = new Map<string, EventImportance>();
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
  campaign: "战役",
  politics: "政治",
  succession: "继承废立",
  war: "战争",
  society: "社会",
  culture: "文化",
  economy: "经济",
  diplomacy: "外交",
  religion: "宗教",
  frontier: "边境",
};

const chinaMapModes: Array<{
  id: ChinaMapMode;
  label: string;
  Icon: typeof Layers;
}> = [
  { id: "political", label: "控制", Icon: Layers },
  { id: "terrain", label: "地形", Icon: Mountain },
  { id: "three-d", label: "3D", Icon: Box },
  { id: "commandery", label: "郡界拼图", Icon: Grid3x3 },
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
  { id: "rome", label: "罗马", terms: ["罗马", "皇帝", "塞维鲁", "奥勒良", "戴克里先", "瓦勒良"] },
  { id: "sasanian-persia", label: "萨珊", terms: ["萨珊", "波斯", "沙普尔", "阿尔达希尔", "纳尔塞", "摩尼", "卡尔提尔"] },
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
const yearMax = 310;
const worldComparisonRegionOrder: Region[] = ["china", "rome", "sasanian-persia"];
const chinaFocusPersonIds = ["cao-cao", "sun-quan", "liu-bei"];
let overviewYearMin = -550;
let overviewYearMax = 1644;
let overviewPeriods: OverviewPeriod[] = [];
let overviewRegionCoordinates: Record<string, LonLat> = {};
let overviewPeriodRegionCoordinates: Record<string, Record<string, LonLat>> = {};
let overviewRegionZoneSizes: Record<string, { width: number; height: number; rotate?: number }> = {};

const emptyOverviewPeriod: OverviewPeriod = {
  id: "runtime-loading",
  title: "Overview loading",
  startYear: -550,
  endYear: 1644,
  color: "#6f766d",
  status: "background",
  focusRegions: [],
  context: [],
  snapshotYears: [-550],
  summary: "Overview period data is loading from the API.",
};
const ageRegionFilters: Array<{ id: AgeRegionFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "china", label: "中国" },
  { id: "rome", label: "罗马" },
  { id: "sasanian-persia", label: "萨珊" },
];

const ageSupplementPeople: AgePerson[] = [
  {
    id: "rome-septimius-severus",
    name: "塞普蒂米乌斯·塞维鲁",
    region: "rome",
    polity: "罗马帝国",
    roles: ["皇帝"],
    birthYear: 145,
    deathYear: 211,
    summary: "塞维鲁王朝建立者，193 年取得帝位。",
    source: "age-supplement",
  },
  {
    id: "rome-alexander-severus",
    name: "亚历山大·塞维鲁",
    region: "rome",
    polity: "罗马帝国",
    roles: ["皇帝"],
    birthYear: 208,
    deathYear: 235,
    summary: "塞维鲁王朝末代皇帝，235 年被杀后罗马进入三世纪危机。",
    source: "age-supplement",
  },
  {
    id: "rome-maximinus-thrax",
    name: "马克西米努斯·色雷克斯",
    region: "rome",
    polity: "罗马帝国",
    roles: ["皇帝", "军事统帅"],
    birthYear: 173,
    deathYear: 238,
    summary: "235 年即位，被视作三世纪危机开端人物之一。",
    source: "age-supplement",
  },
  {
    id: "rome-aurelian",
    name: "奥勒良",
    region: "rome",
    polity: "罗马帝国",
    roles: ["皇帝", "军事统帅"],
    birthYear: 214,
    deathYear: 275,
    summary: "后来的罗马皇帝，完成帝国再统一，常被称为世界光复者。",
    source: "age-supplement",
  },
  {
    id: "rome-diocletian",
    name: "戴克里先",
    region: "rome",
    polity: "罗马帝国",
    roles: ["皇帝", "四帝共治创建者"],
    birthYear: 244,
    deathYear: 311,
    summary: "284 年即位，推行四帝共治和晚期罗马改革。",
    source: "age-supplement",
  },
  {
    id: "sasanian-ardashir-i",
    name: "阿尔达希尔一世",
    region: "sasanian-persia",
    polity: "萨珊波斯",
    roles: ["国王"],
    birthYear: 180,
    deathYear: 242,
    summary: "萨珊王朝建立者，224 年击败安息末王阿尔达班四世。",
    source: "age-supplement",
  },
  {
    id: "sasanian-shapur-i",
    name: "沙普尔一世",
    region: "sasanian-persia",
    polity: "萨珊波斯",
    roles: ["国王"],
    birthYear: 215,
    deathYear: 270,
    summary: "萨珊王朝早期君主，多次与罗马作战。",
    source: "age-supplement",
  },
  {
    id: "sasanian-narseh",
    name: "纳尔塞",
    region: "sasanian-persia",
    polity: "萨珊波斯",
    roles: ["国王"],
    birthYear: 228,
    deathYear: 303,
    summary: "萨珊国王，293 年通过 Paikuli 铭文所反映的政治联盟取得王位，后与戴克里先体系下的罗马作战。",
    source: "age-supplement",
  },
  {
    id: "sasanian-kartir",
    name: "卡尔提尔",
    region: "sasanian-persia",
    polity: "萨珊波斯",
    roles: ["祭司"],
    birthYear: 240,
    deathYear: 293,
    summary: "萨珊早期重要祆教祭司，以多处铭文记录自身宗教权力和宫廷地位。",
    source: "age-supplement",
  },
  {
    id: "sasanian-mani",
    name: "摩尼",
    region: "sasanian-persia",
    polity: "萨珊波斯",
    roles: ["宗教创立者"],
    birthYear: 216,
    deathYear: 277,
    summary: "摩尼教创立者，早期曾在萨珊宫廷环境中传教，后在巴赫拉姆一世时期遇害。",
    source: "age-supplement",
  },
];

const eventImportanceLabels: Record<EventImportance, string> = {
  major: "大型事件",
  medium: "中型事件",
  minor: "小型事件",
  detail: "细节事件",
};

const coverageGapFilters: Array<{ id: CoverageGapFilter; label: Record<Locale, string> }> = [
  { id: "all", label: { zh: "全部", en: "All" } },
  { id: "below-target", label: { zh: "未达标", en: "Below target" } },
  { id: "missing-event-evidence", label: { zh: "缺事件证据", en: "Missing event evidence" } },
  { id: "missing-original", label: { zh: "缺原文", en: "Missing originals" } },
  { id: "period-mismatch", label: { zh: "时期错位", en: "Period mismatch" } },
];

const uiText: Record<Locale, {
  nav: Record<"home" | "people" | "age" | "evidence" | "compare" | "coverage" | "mapDebug", string>;
  pageTitle: Record<Page, string>;
  search: {
    people: string;
    evidence: string;
    default: string;
  };
  coverage: {
    aria: string;
    kicker: string;
    title: string;
    summary: string;
    regions: string;
    gaps: string;
    missingOriginal: string;
    loading: string;
    error: string;
    filterAria: string;
    statusNeedsWork: string;
    statusOk: string;
    progressAriaSuffix: string;
    eventCount: string;
    peopleEntities: string;
    evidenceCards: string;
    evidenceIntegrity: string;
    eventEvidence: string;
    sourceLocator: string;
    periodMismatch: string;
    participants: string;
    currentGaps: string;
    noGaps: string;
    noFilteredGaps: string;
    noEventEvidence: string;
    missingOriginalExamples: string;
    none: string;
  };
  roman: {
    provinceFilter: string;
    showAllEvents: string;
    provinceCount: string;
    nearbyCount: string;
  };
  common: {
    worldOverview: string;
    chinaMap: string;
    peopleCount: string;
    calculablePeople: string;
    yearSuffix: string;
    openPeriod: string;
    viewPlan: string;
    roughWorldMap: string;
    nearestSnapshot: string;
    snapshotYears: string;
    contextNotes: string;
  };
  evidencePage: {
    aria: string;
    kicker: string;
    title: string;
    searchTitle: string;
    summary: string;
    currentEvent: string;
    currentPerson: string;
    regionFilterAria: string;
    all: string;
    idle: string;
    loading: string;
    error: string;
    noResults: string;
    source: string;
    year: string;
    people: string;
    event: string;
    places: string;
    confidence: string;
    dispute: string;
    originalTranslation: string;
    openEvent: string;
  };
  agePage: {
    aria: string;
    kicker: string;
    titleSuffix: string;
    summary: string;
    currentResults: string;
    alive: string;
    currentYearEvents: string;
    scopeAria: string;
    eventAriaSuffix: string;
    noEvents: string;
    birthYear: string;
    deathYear: string;
    unknownDeath: string;
    empty: string;
  };
  peoplePage: {
    aria: string;
    kicker: string;
    title: string;
    currentResults: string;
    dataPeople: string;
    crossRegionPeople: string;
    filterAria: string;
    empty: string;
    lifeEvents: string;
    relations: string;
    eventCount: string;
    calculableAge: string;
  };
}> = {
  zh: {
    nav: {
      home: "时期总览",
      people: "人物索引",
      age: "年龄对比",
      evidence: "史料证据",
      compare: "事件对比",
      coverage: "覆盖度",
      mapDebug: "地图调试",
    },
    pageTitle: {
      home: "世界历史总览：前 550 至 1644",
      world: "中国、罗马与萨珊同年对照",
      china: "中国区域：三国格局",
      rome: "罗马省份控制 190-310 CE",
      people: "人物索引：跨区域人物与生年",
      age: "年龄对比：同年人物年龄",
      evidence: "史料证据：原文、译文与出处",
      compare: "事件对比：中国、罗马与萨珊",
      coverage: "190-310 覆盖度检查",
      "map-debug": "地图调试",
    },
    search: {
      people: "搜索人物、字、势力",
      evidence: "搜索原文、人物、事件、出处",
      default: "搜索人物、政权、事件",
    },
    coverage: {
      aria: "190-310 覆盖度检查",
      kicker: "190-310 范例检查",
      title: "中国、罗马、萨珊覆盖度",
      summary: "按区域检查事件、人物、证据和原文缺口。这个页面只做范例质量判断，不替代正文地图和史料证据页。",
      regions: "区域",
      gaps: "缺口",
      missingOriginal: "缺原文",
      loading: "正在读取覆盖度数据...",
      error: "覆盖度 API 暂时不可用。",
      filterAria: "覆盖度缺口筛选",
      statusNeedsWork: "需要补",
      statusOk: "达标",
      progressAriaSuffix: "覆盖进度",
      eventCount: "事件数量",
      peopleEntities: "人物实体",
      evidenceCards: "证据卡",
      evidenceIntegrity: "证据完整性",
      eventEvidence: "事件证据",
      sourceLocator: "source/locator",
      periodMismatch: "period 错位",
      participants: "参与者姓名",
      currentGaps: "当前缺口",
      noGaps: "当前基础覆盖达标。",
      noFilteredGaps: "当前筛选下没有区域缺口。",
      noEventEvidence: "无事件证据",
      missingOriginalExamples: "缺原文示例",
      none: "无",
    },
    roman: {
      provinceFilter: "省份筛选",
      showAllEvents: "显示全部罗马事件",
      provinceCount: "省份",
      nearbyCount: "附近",
    },
    common: {
      worldOverview: "世界总览",
      chinaMap: "中国地图",
      peopleCount: "个人物",
      calculablePeople: "个可计算年龄人物",
      yearSuffix: "年",
      openPeriod: "进入详细时期",
      viewPlan: "查看规划",
      roughWorldMap: "粗略世界格局",
      nearestSnapshot: "最近快照",
      snapshotYears: "快照年份",
      contextNotes: "背景小框",
    },
    evidencePage: {
      aria: "史料证据",
      kicker: "史料证据",
      title: "检索原文、译文与出处",
      searchTitle: "检索",
      summary: "结果来自 SQLite / RAG 文档层，优先展示已经导入的正史原文、释义、人物与出处。",
      currentEvent: "当前事件",
      currentPerson: "当前人物",
      regionFilterAria: "史料区域筛选",
      all: "全部",
      idle: "输入关键词，或点上面的常用检索。",
      loading: "正在检索史料...",
      error: "史料 API 暂时不可用。",
      noResults: "没有匹配史料，换一个人物、事件或出处关键词试试。",
      source: "出处",
      year: "年份",
      people: "人物",
      event: "事件",
      places: "地点",
      confidence: "可信度",
      dispute: "争议",
      originalTranslation: "原文 / 译文",
      openEvent: "打开事件",
    },
    agePage: {
      aria: "年龄对比",
      kicker: "年龄对比",
      titleSuffix: "年人物年龄",
      summary: "按公元年份减出生年估算周岁；未按具体生日和虚岁修正。",
      currentResults: "当前结果",
      alive: "仍在世",
      currentYearEvents: "当年事件",
      scopeAria: "年龄对比范围",
      eventAriaSuffix: "年事件锚点",
      noEvents: "本年没有已标注的大事；拖动时间条或搜索人物继续对比。",
      birthYear: "生年",
      deathYear: "卒年",
      unknownDeath: "卒年未详",
      empty: "暂无匹配人物",
    },
    peoplePage: {
      aria: "人物索引",
      kicker: "人物资料",
      title: "人物索引",
      currentResults: "当前结果",
      dataPeople: "资料人物",
      crossRegionPeople: "跨区人物",
      filterAria: "人物分组筛选",
      empty: "暂无匹配人物",
      lifeEvents: "生平",
      relations: "关系",
      eventCount: "事件",
      calculableAge: "可算年龄",
    },
  },
  en: {
    nav: {
      home: "Periods",
      people: "People",
      age: "Age",
      evidence: "Evidence",
      compare: "Compare",
      coverage: "Coverage",
      mapDebug: "Map Debug",
    },
    pageTitle: {
      home: "World History Overview: 550 BCE to 1644",
      world: "China, Rome, and Sasanian Persia by Year",
      china: "China: Three Kingdoms Map",
      rome: "Roman Provincial Control, 190-310 CE",
      people: "People Index: Cross-Regional Lives",
      age: "Age Comparison: People in the Same Year",
      evidence: "Historical Evidence: Texts, Translations, Sources",
      compare: "Event Comparison: China, Rome, and Sasanian Persia",
      coverage: "190-310 Coverage Audit",
      "map-debug": "Map Debug",
    },
    search: {
      people: "Search people, names, factions",
      evidence: "Search texts, people, events, sources",
      default: "Search people, polities, events",
    },
    coverage: {
      aria: "190-310 coverage audit",
      kicker: "190-310 Sample Audit",
      title: "China, Rome, and Sasanian Coverage",
      summary: "Audit events, people, evidence cards, and missing original passages by region. This is a quality-control page for the model period.",
      regions: "Regions",
      gaps: "Gaps",
      missingOriginal: "Missing originals",
      loading: "Loading coverage data...",
      error: "Coverage API is not available.",
      filterAria: "Coverage gap filter",
      statusNeedsWork: "Needs work",
      statusOk: "OK",
      progressAriaSuffix: "coverage progress",
      eventCount: "Events",
      peopleEntities: "People",
      evidenceCards: "Evidence cards",
      evidenceIntegrity: "Evidence integrity",
      eventEvidence: "Event evidence",
      sourceLocator: "source/locator",
      periodMismatch: "period mismatch",
      participants: "Participants",
      currentGaps: "Current gaps",
      noGaps: "Baseline coverage target is met.",
      noFilteredGaps: "No regional gaps under this filter.",
      noEventEvidence: "No event evidence",
      missingOriginalExamples: "Missing original examples",
      none: "None",
    },
    roman: {
      provinceFilter: "Province filter",
      showAllEvents: "Show all Roman events",
      provinceCount: "Province",
      nearbyCount: "Nearby",
    },
    common: {
      worldOverview: "World overview",
      chinaMap: "China map",
      peopleCount: "people",
      calculablePeople: "age-computable people",
      yearSuffix: "CE",
      openPeriod: "Enter detailed period",
      viewPlan: "View plan",
      roughWorldMap: "Rough world map",
      nearestSnapshot: "Nearest snapshot",
      snapshotYears: "Snapshot years",
      contextNotes: "Context notes",
    },
    evidencePage: {
      aria: "Historical evidence",
      kicker: "Historical Evidence",
      title: "Search original texts, translations, and sources",
      searchTitle: "Search",
      summary: "Results come from the SQLite / RAG document layer, prioritizing imported source text, interpretation, people, and citations.",
      currentEvent: "Current event",
      currentPerson: "Current person",
      regionFilterAria: "Evidence region filter",
      all: "All",
      idle: "Enter a keyword or use one of the quick searches above.",
      loading: "Searching evidence...",
      error: "Evidence API is not available.",
      noResults: "No matching evidence. Try another person, event, or source keyword.",
      source: "Source",
      year: "Year",
      people: "People",
      event: "Event",
      places: "Places",
      confidence: "Confidence",
      dispute: "Dispute",
      originalTranslation: "Original / Translation",
      openEvent: "Open event",
    },
    agePage: {
      aria: "Age comparison",
      kicker: "Age Comparison",
      titleSuffix: "people by age",
      summary: "Ages are estimated by subtracting birth year from the selected CE year; exact birthdays and East Asian nominal ages are not applied.",
      currentResults: "Results",
      alive: "Alive",
      currentYearEvents: "Events this year",
      scopeAria: "Age comparison scope",
      eventAriaSuffix: "event anchors",
      noEvents: "No marked major events this year. Drag the timeline or search for people to continue comparing.",
      birthYear: "Born",
      deathYear: "Died",
      unknownDeath: "Death unknown",
      empty: "No matching people",
    },
    peoplePage: {
      aria: "People index",
      kicker: "People",
      title: "People Index",
      currentResults: "Results",
      dataPeople: "People",
      crossRegionPeople: "Cross-region",
      filterAria: "People group filter",
      empty: "No matching people",
      lifeEvents: "Life events",
      relations: "Relations",
      eventCount: "Events",
      calculableAge: "Age ready",
    },
  },
};

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

function formatHistoricalYear(year: number) {
  return year < 0 ? `前 ${Math.abs(year)}` : `${year}`;
}

function formatHistoricalYearWithEra(year: number) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

function getOverviewPeriod(year: number) {
  return (
    [...overviewPeriods].reverse().find((period) => period.startYear <= year && period.endYear >= year) ??
    overviewPeriods[overviewPeriods.length - 1] ??
    emptyOverviewPeriod
  );
}

function getPeriodMidpoint(period: OverviewPeriod) {
  return Math.round((Math.max(period.startYear, overviewYearMin) + Math.min(period.endYear, overviewYearMax)) / 2);
}

function getOverviewYearPercent(year: number) {
  return ((year - overviewYearMin) / (overviewYearMax - overviewYearMin)) * 100;
}

function getOverviewRegionCoordinate(period: OverviewPeriod, region: OverviewFocusRegion) {
  return region.coordinates ?? overviewPeriodRegionCoordinates[period.id]?.[region.id] ?? overviewRegionCoordinates[region.id] ?? [0, 20];
}

function getOverviewRegionPosition(period: OverviewPeriod, region: OverviewFocusRegion) {
  const point = projection(getOverviewRegionCoordinate(period, region));
  if (!point) {
    return { left: "50%", top: "50%" };
  }

  return {
    left: `${(point[0] / 1000) * 100}%`,
    top: `${(point[1] / 520) * 100}%`,
  };
}

function getOverviewRegionZoneStyle(period: OverviewPeriod, region: OverviewFocusRegion) {
  const size = overviewRegionZoneSizes[region.id] ?? { width: 12, height: 8, rotate: 0 };
  return {
    "--period-color": period.color,
    "--zone-width": `${size.width}%`,
    "--zone-height": `${size.height}%`,
    "--zone-rotate": `${size.rotate ?? 0}deg`,
    ...getOverviewRegionPosition(period, region),
  } as React.CSSProperties;
}

function getPeriodStatusLabel(status: PeriodStatus) {
  if (status === "complete") {
    return "已完成";
  }

  if (status === "background") {
    return "背景";
  }

  return "规划中";
}

function getOverviewPeriodShortLabel(period: OverviewPeriod) {
  const coreLabels = period.focusRegions
    .filter((region) => region.tier === "core")
    .map((region) => region.label.replace(/世界|体系|危机|转换|形成|时期/g, ""))
    .slice(0, 2);

  if (period.status === "background") {
    return "背景";
  }

  return coreLabels.join("·") || period.title.slice(0, 4);
}

function isPinnedToYear(event: HistoricalEvent, year: number) {
  return event.startYear === year || event.endYear === year;
}

function getPinnedYears(event: HistoricalEvent) {
  const years = [event.startYear];

  if (event.endYear !== event.startYear) {
    years.push(event.endYear);
  }

  return years.filter((eventYear) => eventYear >= yearMin && eventYear <= yearMax);
}

function sortEventsByYearThenTitle(left: HistoricalEvent, right: HistoricalEvent) {
  return left.startYear - right.startYear || left.endYear - right.endYear || left.title.localeCompare(right.title, "zh-Hans-CN");
}

function getEventImportance(event: HistoricalEvent): EventImportance {
  return eventImportanceById.get(event.id) ?? eventImportanceDataset.defaultImportance;
}

function shouldShowWorldEvent(event: HistoricalEvent, showMediumEvents: boolean) {
  const importance = getEventImportance(event);
  return importance === "major" || (showMediumEvents && importance === "medium");
}

function coverageRegionMatchesFilter(region: CoverageRegion, filter: CoverageGapFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "below-target") {
    return (
      region.metrics.events < region.minimums.events ||
      region.metrics.peopleEntities < region.minimums.entities ||
      region.metrics.evidenceDocuments < region.minimums.evidence
    );
  }

  if (filter === "missing-event-evidence") {
    return region.metrics.eventsWithEvidence < region.metrics.events || region.missingEvidenceEvents.length > 0;
  }

  if (filter === "missing-original") {
    return region.metrics.evidenceMissingOriginal > 0;
  }

  return region.metrics.periodMismatch > 0;
}

function getRomanEventZhTitle(event: HistoricalEvent) {
  if (event.region !== "rome") {
    return event.title;
  }

  if (event.titleZh) {
    return event.titleZh;
  }

  const summaryLead = event.summary.split(/[。；;]/)[0]?.trim();
  if (summaryLead && /[\u4e00-\u9fff]/.test(summaryLead) && summaryLead.length <= 52) {
    return summaryLead;
  }

  const processLead = event.detail?.process?.[0]?.split(/[。；;]/)[0]?.trim();
  if (processLead && /[\u4e00-\u9fff]/.test(processLead) && processLead.length <= 52) {
    return processLead;
  }

  return event.eventLabel ?? event.title;
}

function getEventDisplayTitle(event: HistoricalEvent, locale: Locale) {
  if (locale === "en" && event.region === "rome") {
    return { primary: event.titleEn ?? event.eventLabel ?? event.title, secondary: null };
  }

  if (locale === "en") {
    return { primary: event.titleEn ?? event.title, secondary: null };
  }

  return { primary: getRomanEventZhTitle(event), secondary: null };
}

function textMatchesAnyTerm(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => term && normalized.includes(term.toLowerCase()));
}

function eventMatchesRomanProvince(event: HistoricalEvent, province: RomanProvince) {
  if (event.mapFeatureIds?.includes(`roman-province:${province.id}`)) {
    return true;
  }

  const provinceTerms = [province.n, province.family, ...province.n.split(/\s+/)].filter((term): term is string => Boolean(term));
  const eventTerms = [
    event.locationName ?? "",
    event.summary,
    event.eventLabel ?? "",
    event.macroEvent ?? "",
    event.translation ?? "",
    ...(event.tags ?? []),
    ...(event.places ?? []),
    ...(event.detail?.background ?? []),
    ...(event.detail?.process ?? []),
    ...(event.detail?.sourceNotes ?? []),
  ].join(" ");

  return textMatchesAnyTerm(eventTerms, provinceTerms);
}

function getLifeEventEndYear(lifeEvent: PersonLifeEvent) {
  if (Number.isInteger(lifeEvent.endYear)) {
    return lifeEvent.endYear as number;
  }

  const rangeMatch = lifeEvent.displayYear.match(/^(\d{3})-(\d{3})$/);
  if (rangeMatch) {
    return Number(rangeMatch[2]);
  }

  return Number.isInteger(lifeEvent.year) ? (lifeEvent.year as number) : null;
}

function isLifeEventInYear(lifeEvent: PersonLifeEvent, year: number) {
  if (!Number.isInteger(lifeEvent.year)) {
    return false;
  }

  const startYear = lifeEvent.year as number;
  const endYear = getLifeEventEndYear(lifeEvent) ?? startYear;
  return startYear <= year && endYear >= year;
}

function getLifeEventStartYear(lifeEvent: PersonLifeEvent) {
  return Number.isInteger(lifeEvent.year) ? (lifeEvent.year as number) : null;
}

function getRelevantLifeEventForYear(personId: string, year: number): FocusLifeEvent | null {
  const person = chinaPersonById.get(personId);

  if (!person) {
    return null;
  }

  const personLifeEvents = chinaPersonLifeEvents
    .filter((lifeEvent) => lifeEvent.personId === personId && Number.isInteger(lifeEvent.year))
    .sort((left, right) => getLifeEventSortValue(left) - getLifeEventSortValue(right) || left.displayYear.localeCompare(right.displayYear));
  const activeLifeEvent = personLifeEvents.find((lifeEvent) => isLifeEventInYear(lifeEvent, year));

  if (activeLifeEvent) {
    return {
      inferred: false,
      lifeEvent: activeLifeEvent,
      person,
      rank: chinaFocusPersonIds.indexOf(personId),
    };
  }

  const previousLifeEvent = [...personLifeEvents]
    .reverse()
    .find((lifeEvent) => {
      const startYear = getLifeEventStartYear(lifeEvent);
      const endYear = getLifeEventEndYear(lifeEvent) ?? startYear;
      return (
        startYear !== null &&
        endYear !== null &&
        endYear < year &&
        year - endYear <= 10 &&
        !["birth", "death", "later-tradition"].includes(lifeEvent.type)
      );
    });

  if (!previousLifeEvent) {
    return null;
  }

  return {
    inferred: true,
    lifeEvent: previousLifeEvent,
    person,
    rank: chinaFocusPersonIds.indexOf(personId),
  };
}

function getChinaFocusLifeEvents(year: number) {
  return chinaFocusPersonIds
    .map((personId) => getRelevantLifeEventForYear(personId, year))
    .filter((item): item is FocusLifeEvent => Boolean(item))
    .sort((left, right) => left.rank - right.rank || getLifeEventSortValue(left.lifeEvent) - getLifeEventSortValue(right.lifeEvent))
    .slice(0, 3);
}

function getChinaLifeEventTerms(item: FocusLifeEvent) {
  return [
    item.person.id,
    item.person.name,
    item.person.courtesyName,
    item.person.primaryPolity,
    item.lifeEvent.title,
    item.lifeEvent.summary,
    item.lifeEvent.type,
    ...item.person.roles,
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesThreeKingdomsLifeEventFilter(item: FocusLifeEvent, filter: ThreeKingdomsFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "war") {
    return item.lifeEvent.type === "campaign";
  }

  if (filter === "politics") {
    return ["office", "politics", "turning-point", "abdication"].includes(item.lifeEvent.type);
  }

  const text = getChinaLifeEventTerms(item);

  if (filter === "cao-wei") {
    return (
      text.includes("曹魏") ||
      text.includes("曹操集团") ||
      text.includes("司马")
    );
  }

  if (filter === "shu-han") {
    return text.includes("蜀汉") || text.includes("刘备集团");
  }

  if (filter === "sun-wu") {
    return text.includes("孙吴") || text.includes("江东");
  }

  return item.lifeEvent.year !== null && item.lifeEvent.year < 220;
}

function getChinaLifeEventsForYear(year: number, filter: ThreeKingdomsFilter = "all") {
  return chinaPersonLifeEvents
    .filter((lifeEvent) => isLifeEventInYear(lifeEvent, year))
    .map((lifeEvent) => {
      const person = chinaPersonById.get(lifeEvent.personId);
      if (!person) {
        return null;
      }

      return {
        inferred: false,
        lifeEvent,
        person,
        rank: chinaFocusPersonIds.includes(person.id) ? chinaFocusPersonIds.indexOf(person.id) : 100,
      };
    })
    .filter((item): item is FocusLifeEvent => Boolean(item))
    .filter((item) => matchesThreeKingdomsLifeEventFilter(item, filter))
    .sort((left, right) => {
      const leftYear = getLifeEventStartYear(left.lifeEvent) ?? year;
      const rightYear = getLifeEventStartYear(right.lifeEvent) ?? year;
      return (
        left.rank - right.rank ||
        leftYear - rightYear ||
        getLifeEventSortValue(left.lifeEvent) - getLifeEventSortValue(right.lifeEvent) ||
        left.person.name.localeCompare(right.person.name, "zh-Hans-CN")
      );
    })
    .slice(0, 5);
}

function getPersonLifeRange(person: HistoricalPerson, lifeEvents: PersonLifeEvent[]) {
  const lifeMatch = person.life?.match(/^(\d{1,4}|\?)-(\d{1,4}|\?)$/);
  const knownYears = lifeEvents
    .flatMap((lifeEvent) => [getLifeEventStartYear(lifeEvent), getLifeEventEndYear(lifeEvent)])
    .filter((item): item is number => Number.isInteger(item));
  const parsedStart = lifeMatch?.[1] && lifeMatch[1] !== "?" ? Number(lifeMatch[1]) : null;
  const parsedEnd = lifeMatch?.[2] && lifeMatch[2] !== "?" ? Number(lifeMatch[2]) : null;
  const startYear = parsedStart ?? (knownYears.length ? Math.min(...knownYears) : null);
  const endYear = parsedEnd ?? (knownYears.length ? Math.max(...knownYears) : null);

  if (startYear === null || endYear === null || startYear > endYear) {
    return null;
  }

  return { startYear, endYear };
}

function getPersonAnnualTimeline(person: HistoricalPerson, lifeEvents: PersonLifeEvent[]) {
  const range = getPersonLifeRange(person, lifeEvents);

  if (!range) {
    return [];
  }

  const sortedLifeEvents = [...lifeEvents].sort(
    (left, right) => getLifeEventSortValue(left) - getLifeEventSortValue(right) || left.displayYear.localeCompare(right.displayYear),
  );
  const items: PersonAnnualTimelineItem[] = [];

  for (let year = range.startYear; year <= range.endYear; year += 1) {
    const activities = sortedLifeEvents.filter((lifeEvent) => isLifeEventInYear(lifeEvent, year));
    const inferredFrom =
      activities.length > 0
        ? undefined
        : [...sortedLifeEvents]
            .reverse()
            .find((lifeEvent) => {
              const startYear = getLifeEventStartYear(lifeEvent);
              const endYear = getLifeEventEndYear(lifeEvent) ?? startYear;
              return (
                startYear !== null &&
                endYear !== null &&
                endYear < year &&
                year - endYear <= 10 &&
                !["birth", "death", "later-tradition"].includes(lifeEvent.type)
              );
            });

    items.push({ activities, inferredFrom, year });
  }

  return items;
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

function getSourceMentionRef(mention: SourceMention): SourceRef {
  return {
    sourceId: mention.sourceId,
    locator: mention.locator,
    quote: mention.text,
  };
}

function getSourceMentionYearLabel(mention: SourceMention) {
  return mention.year === null ? "年代不详" : `${mention.year}`;
}

function EvidenceField({ label, value }: { label: string; value?: ReactNode }) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0)
  ) {
    return null;
  }

  return (
    <div className="evidence-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompactEvidenceList({ values }: { values?: string[] }) {
  const cleaned = (values ?? []).filter(Boolean);
  if (!cleaned.length) {
    return null;
  }

  return <>{cleaned.slice(0, 6).join("、")}{cleaned.length > 6 ? ` +${cleaned.length - 6}` : ""}</>;
}

function SourceMentionCard({ compact = false, mention }: { compact?: boolean; mention: SourceMention }) {
  return (
    <article className={`source-mention-card ${compact ? "compact" : ""}`} data-source-mention-id={mention.id}>
      <div className="source-mention-head">
        <span>{getSourceMentionYearLabel(mention)}</span>
        <SourceRefLink className="source-title-link" sourceRef={getSourceMentionRef(mention)} />
      </div>
      {!compact && (
        <div className="source-mention-standard">
          <EvidenceField label="source_id" value={mention.sourceId} />
          <EvidenceField label="locator" value={mention.locator} />
          <EvidenceField label="人物" value={<CompactEvidenceList values={mention.mentionedPersonIds} />} />
          <EvidenceField label="事件" value={<CompactEvidenceList values={mention.mentionedEventIds} />} />
          <EvidenceField label="地点" value={<CompactEvidenceList values={mention.mentionedPlaceIds} />} />
        </div>
      )}
      <blockquote>{mention.text}</blockquote>
      {mention.translation && !compact && <p className="source-mention-translation">{mention.translation}</p>}
      {!compact && (
        <div className="source-mention-standard">
          <EvidenceField label="可信度" value={getConfidenceLabel(mention.confidence)} />
          <EvidenceField label="审核" value={mention.reviewStatus === "reviewed" ? "已审" : "草稿"} />
          <EvidenceField label="争议" value={mention.disputeNote ?? "未标注"} />
        </div>
      )}
      {!compact && (
        <div className="source-mention-tags">
          <span>{getConfidenceLabel(mention.confidence)}</span>
          <span>{mention.reviewStatus === "reviewed" ? "已审" : "草稿"}</span>
          {mention.tags.slice(0, 4).map((tag) => (
            <span key={`${mention.id}-${tag}`}>{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}

function PersonSourceMentionPanel({ mentions }: { mentions: SourceMention[] }) {
  return (
    <>
      <div className="person-event-heading">
        <BookOpen size={16} aria-hidden="true" />
        <span>史料提及</span>
        <strong>{mentions.length}</strong>
      </div>
      <div className="source-mention-list">
        {mentions.length ? (
          mentions.map((mention) => <SourceMentionCard key={mention.id} mention={mention} />)
        ) : (
          <p>待补充史料提及</p>
        )}
      </div>
    </>
  );
}

function LifeEventSources({ lifeEvent }: { lifeEvent: PersonLifeEvent }) {
  const sourceMentions = (lifeEvent.sourceMentionIds ?? [])
    .map((mentionId) => chinaSourceMentionById.get(mentionId))
    .filter((mention): mention is SourceMention => Boolean(mention));

  return (
    <div className="life-event-source-list">
      <div className="life-event-meta">
        <span>{getConfidenceLabel(lifeEvent.confidence)}</span>
        {lifeEvent.sourceRefs.slice(0, 2).map((ref) => (
          <SourceRefLink key={`${lifeEvent.id}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
        ))}
        {sourceMentions.length > 0 && <span>{sourceMentions.length} 条原文段落</span>}
      </div>
      {sourceMentions.length > 0 && (
        <div className="life-event-source-mentions">
          {sourceMentions.map((mention) => (
            <SourceMentionCard compact key={`${lifeEvent.id}-${mention.id}`} mention={mention} />
          ))}
        </div>
      )}
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

function getPersonSearchFields(person: HistoricalPerson | PersonIndexItem) {
  return [person.name, person.courtesyName, person.primaryPolity, ...person.roles, person.summary].filter(Boolean) as string[];
}

function personContainsAny(person: HistoricalPerson | PersonIndexItem, terms: string[]) {
  const text = getPersonSearchFields(person).join(" ");
  return terms.some((term) => text.includes(term));
}

function getPersonSearchRank(person: HistoricalPerson | PersonIndexItem, normalizedQuery: string) {
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

function matchesPersonIndexFilter(person: HistoricalPerson | PersonIndexItem, filter: PersonIndexFilter) {
  if (filter === "all") {
    return true;
  }

  if ("region" in person && (filter === "rome" || filter === "sasanian-persia")) {
    return person.region === filter;
  }

  if (!("region" in person) && (filter === "rome" || filter === "sasanian-persia")) {
    return false;
  }

  const filterConfig = personIndexFilters.find((item) => item.id === filter);
  return filterConfig ? personContainsAny(person, filterConfig.terms) : true;
}

function chinaPersonToPersonIndexItem(person: HistoricalPerson): PersonIndexItem {
  const lifeSpan = parseLifeSpan(person.life);
  return {
    id: person.id,
    name: person.name,
    courtesyName: person.courtesyName,
    life: person.life,
    primaryPolity: person.primaryPolity,
    roles: person.roles,
    summary: person.summary,
    source: "china-person-index",
    region: "china",
    birthYear: lifeSpan.birthYear ?? undefined,
    deathYear: lifeSpan.deathYear,
  };
}

function agePersonToPersonIndexItem(person: AgePerson): PersonIndexItem {
  return {
    id: person.id,
    name: person.name,
    courtesyName: null,
    life: `${person.birthYear}-${person.deathYear ?? "?"}`,
    primaryPolity: person.polity,
    roles: person.roles,
    summary: person.summary,
    source: "age-supplement",
    region: person.region,
    birthYear: person.birthYear,
    deathYear: person.deathYear,
  };
}

function parseLifeSpan(life: string | null) {
  if (!life) {
    return { birthYear: null, deathYear: null };
  }

  const [birthToken, deathToken] = life.split("-");
  const birthMatch = birthToken?.match(/\d{2,4}/);
  const deathMatch = deathToken?.match(/\d{2,4}/);

  return {
    birthYear: birthMatch && !birthToken.includes("?") ? Number(birthMatch[0]) : null,
    deathYear: deathMatch ? Number(deathMatch[0]) : null,
  };
}

function chinaPersonToAgePerson(person: HistoricalPerson): AgePerson | null {
  const lifeSpan = parseLifeSpan(person.life);
  if (!lifeSpan.birthYear) {
    return null;
  }

  return {
    id: `china-${person.id}`,
    name: person.name,
    region: "china",
    polity: person.primaryPolity,
    roles: person.roles,
    birthYear: lifeSpan.birthYear,
    deathYear: lifeSpan.deathYear,
    summary: person.summary,
    source: "person-index",
  };
}

function getAgeRegionLabel(region: AgeRegionFilter) {
  return ageRegionFilters.find((filter) => filter.id === region)?.label ?? region;
}

function getAgePersonState(person: AgePerson, targetYear: number) {
  const age = targetYear - person.birthYear;

  if (targetYear < person.birthYear) {
    return {
      age,
      category: "unborn" as const,
      label: `${person.birthYear - targetYear} 年后出生`,
      sortRank: 2,
    };
  }

  if (person.deathYear && targetYear > person.deathYear) {
    return {
      age: person.deathYear - person.birthYear,
      category: "deceased" as const,
      label: `已故 ${targetYear - person.deathYear} 年，终年 ${person.deathYear - person.birthYear} 岁`,
      sortRank: 1,
    };
  }

  return {
    age,
    category: "alive" as const,
    label: `${age} 岁`,
    sortRank: 0,
  };
}

function agePersonSearchRank(person: AgePerson, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const fields = [person.name, person.polity, getAgeRegionLabel(person.region), ...person.roles]
    .filter(Boolean)
    .map((field) => field.toLowerCase());

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
    return eventContainsAny(event, ["曹操集团", "曹魏", "曹操", "曹丕", "司马", "邓艾", "钟会"]);
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

function getChinaMapLayer(map: ChinaMapLayer, year: number) {
  return map.eras.find((era) => era.startYear <= year && era.endYear >= year) ?? null;
}

function getChinaBlockControl(controlTimeline: ChinaControlTimeline, blockId: string, year: number) {
  return (
    controlTimeline.records.find(
      (record) => record.blockId === blockId && record.startYear <= year && record.endYear >= year,
    ) ?? null
  );
}

function getChinaBlockControlId(block: ChinaBlock) {
  return block.controlBlockId ?? block.id;
}

function getChinaControllerColor(controllerColorMap: Map<string, string>, controller?: string | null) {
  return controller ? (controllerColorMap.get(controller) ?? "#7d8578") : "#7d8578";
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
      return "争夺中";
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

function normalizeHistoricalEvent(event: HistoricalEvent): HistoricalEvent {
  return {
    ...event,
    people: event.people ?? [],
    personIds: event.personIds ?? [],
    polities: event.polities ?? [],
    relatedEvents: event.relatedEvents ?? [],
    tags: event.tags ?? [],
    sources: event.sources ?? [],
  };
}

function normalizeHistoricalPerson(person: HistoricalPerson): HistoricalPerson {
  return {
    ...person,
    courtesyName: person.courtesyName ?? null,
    life: person.life ?? null,
    primaryPolity: person.primaryPolity ?? "",
    roles: person.roles ?? [],
    summary: person.summary ?? "",
    sourceRefs: person.sourceRefs ?? [],
  };
}

function normalizePersonLifeEvent(lifeEvent: PersonLifeEvent): PersonLifeEvent {
  return {
    ...lifeEvent,
    relatedEventIds: lifeEvent.relatedEventIds ?? [],
    sourceMentionIds: lifeEvent.sourceMentionIds ?? [],
    confidence: lifeEvent.confidence ?? "medium",
    sourceRefs: lifeEvent.sourceRefs ?? [],
  };
}

function normalizePersonRelation(relation: PersonRelation): PersonRelation {
  return {
    ...relation,
    summary: relation.summary ?? "",
    sourceRefs: relation.sourceRefs ?? [],
  };
}

function applyPeopleIndexData(data: FrontendPeopleIndexDb) {
  chinaPersons = (data.persons ?? []).map(normalizeHistoricalPerson);
  chinaPersonLifeEvents = (data.personLifeEvents ?? []).map(normalizePersonLifeEvent);
  chinaPersonRelations = (data.personRelations ?? []).map(normalizePersonRelation);
  chinaPersonById = new Map(chinaPersons.map((person) => [person.id, person]));
}

function normalizeSourceRecord(source: SourceRecord): SourceRecord {
  return {
    ...source,
    author: source.author ?? "",
    citationShort: source.citationShort ?? source.id,
    note: source.note ?? "",
  };
}

function normalizeSourceMention(mention: SourceMention): SourceMention {
  return {
    ...mention,
    translation: mention.translation ?? null,
    mentionedPersonIds: mention.mentionedPersonIds ?? [],
    mentionedEventIds: mention.mentionedEventIds ?? [],
    mentionedPlaceIds: mention.mentionedPlaceIds ?? [],
    tags: mention.tags ?? [],
    confidence: mention.confidence ?? "medium",
    reviewStatus: mention.reviewStatus ?? "draft",
  };
}

function applySourcesData(data: FrontendSourcesDb) {
  chinaSources = (data.sources ?? []).map(normalizeSourceRecord);
  chinaSourceMentions = (data.sourceMentions ?? []).map(normalizeSourceMention);
  chinaSourceById = new Map(chinaSources.map((source) => [source.id, source]));
  chinaSourceMentionById = new Map(chinaSourceMentions.map((mention) => [mention.id, mention]));
}

function applyRegionsData(data: FrontendRegionsDb) {
  regions = data.regions?.length ? data.regions : emptyRegions;
}

function applyEventImportanceData(data: EventImportanceDataset) {
  eventImportanceDataset = {
    model: "event-importance",
    defaultImportance: data.defaultImportance ?? "medium",
    records: data.records ?? [],
  };
  eventImportanceById = new Map(eventImportanceDataset.records.map((record) => [record.eventId, record.importance]));
}

function applyPeriodOverviewData(data: FrontendPeriodOverviewDb) {
  overviewYearMin = data.overviewYearMin ?? data.range?.[0] ?? -550;
  overviewYearMax = data.overviewYearMax ?? data.range?.[1] ?? 1644;
  overviewPeriods = data.periods ?? [];
  overviewRegionCoordinates = data.regionCoordinates ?? {};
  overviewPeriodRegionCoordinates = data.periodRegionCoordinates ?? {};
  overviewRegionZoneSizes = data.regionZoneSizes ?? {};
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

function getRegionSummary(region: RegionInfo, regionEvents: HistoricalEvent[], year: number, showMediumEvents: boolean) {
  const era = getRegionEra(region, year);
  const yearEvents = regionEvents
    .filter((event) => isPinnedToYear(event, year) && shouldShowWorldEvent(event, showMediumEvents))
    .sort(sortEventsByYearThenTitle);

  if (!yearEvents.length) {
    return `${year} 年背景：${era.summary}`;
  }

  return `${year} 年：${yearEvents.map((event) => event.title).join("、")}。${era.summary}`;
}

function WorldMap({
  activeRegion,
  hoveredRegion,
  onHover,
  onSelect,
  onEnter,
  onClearSummary,
  year,
  viewBox = worldViewBox,
}: {
  activeRegion: Region;
  hoveredRegion: Region | null;
  onHover: (region: Region | null) => void;
  onSelect: (region: Region) => void;
  onEnter: (region: Region) => void;
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

        {regions.filter((region) => worldComparisonRegionOrder.includes(region.id)).map((region) => {
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
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  onEnter(region.id);
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

function getLocalTerrainPoint(physical: NaturalEarthPhysical, lon: number, lat: number, height = 0) {
  const { west, east, south, north } = physical.bbox;
  const x = ((lon - west) / (east - west) - 0.5) * 10.8;
  const z = (0.5 - (lat - south) / (north - south)) * 6.5;
  return { x, y: height, z };
}

function ChinaTerrain3DMap({ onClearSummary, physical }: { onClearSummary: () => void; physical: NaturalEarthPhysical }) {
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
        const lon = physical.bbox.west + (x / width + 0.5) * (physical.bbox.east - physical.bbox.west);
        const lat = physical.bbox.south + (planarY / depth + 0.5) * (physical.bbox.north - physical.bbox.south);
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
      for (const river of physical.rivers.features.filter((featureItem) => getNaturalEarthScaleRank(featureItem) <= 2)) {
        const points = collectGeometryCoordinates(river.geometry)
          .map(([lon, lat]) => {
            const local = getLocalTerrainPoint(physical, lon, lat, getTerrainHeight(lon, lat) + 0.035);
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
  }, [physical]);

  return (
    <div className="terrain-3d-frame" onClick={onClearSummary}>
      <canvas ref={canvasRef} aria-label="中国区域 3D 地形" />
    </div>
  );
}

// Demo-matched linear projection: lon 89?, 136?00; lat 55?, 16?0
function cmdProject(lon: number, lat: number): [number, number] {
  return [((lon - 89) / (136 - 89)) * 100, ((55 - lat) / (55 - 16)) * 80];
}

function getCommanderyCentroid(block: ChinaBlock): [number, number] | null {
  const ring = block.geometry.coordinates[0];
  if (!ring || ring.length < 4) {
    return null;
  }

  const step = Math.max(1, Math.floor(ring.length / 5));
  let cx = 0;
  let cy = 0;
  let count = 0;

  for (let index = 0; index < ring.length; index += step) {
    const projected = cmdProject(ring[index][0], ring[index][1]);
    cx += projected[0];
    cy += projected[1];
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return [cx / count, cy / count];
}

function getCommanderyArea(block: ChinaBlock): number {
  const ring = block.geometry.coordinates[0];
  if (!ring || ring.length < 3) {
    return 0;
  }

  const projected = ring.map((point) => cmdProject(point[0], point[1]));

  if (projected.length < 3) {
    return 0;
  }

  let area = 0;
  for (let index = 0; index < projected.length; index += 1) {
    const nextIndex = (index + 1) % projected.length;
    area += projected[index][0] * projected[nextIndex][1];
    area -= projected[nextIndex][0] * projected[index][1];
  }

  return Math.abs(area) / 2;
}

const PUZZLE_VIEWBOX = "0 0 100 80";

function ChinaCommanderyPuzzleMap({
  activeBlockId,
  blocks,
  blockById,
  controllerColorMap,
  controlTimeline,
  hoveredBlockId,
  onSelectBlock,
  onHoverBlock,
  onClearSummary,
  year,
}: {
  activeBlockId: string | null;
  blocks: ChinaBlock[];
  blockById: Map<string, ChinaBlock>;
  controllerColorMap: Map<string, string>;
  controlTimeline: ChinaControlTimeline;
  hoveredBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onHoverBlock: (blockId: string | null) => void;
  onClearSummary: () => void;
  year: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [puzzleViewBox, setPuzzleViewBox] = useState(PUZZLE_VIEWBOX);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; blockId: string } | null>(null);

  // Pre-cache projected path strings (same approach as demo's geoCache)
  const pathCache = useMemo(() => {
    const cache = new Map<string, string>();

    blocks.forEach((block) => {
      let pathString = "";

      block.geometry.coordinates.forEach((ring) => {
        if (ring.length < 3) {
          return;
        }

        pathString += `M${ring
          .map((point) => {
            const projected = cmdProject(point[0], point[1]);
            return `${projected[0].toFixed(2)},${projected[1].toFixed(2)}`;
          })
          .join("L")}Z`;
      });

      cache.set(block.id, pathString);
    });

    return cache;
  }, [blocks]);

  const blockEntries = useMemo(
    () =>
      blocks.map((block) => ({
        block,
        control: getChinaBlockControl(controlTimeline, getChinaBlockControlId(block), year),
      })),
    [blocks, controlTimeline, year],
  );

  const labeledBlockIds = useMemo(() => {
    const withArea = blockEntries
      .map((entry) => ({ id: entry.block.id, area: getCommanderyArea(entry.block) }))
      .filter((entry) => entry.area > 0)
      .sort((left, right) => right.area - left.area);

    return new Set(withArea.slice(0, 25).map((entry) => entry.id));
  }, [blockEntries]);

  const labelEntries = useMemo(
    () =>
      blockEntries
        .filter((entry) => labeledBlockIds.has(entry.block.id))
        .map((entry) => {
          const centroid = getCommanderyCentroid(entry.block);

          return {
            blockId: entry.block.id,
            name: entry.block.name,
            controller: entry.control?.controller ?? null,
            centroid,
          };
        })
        .filter((entry) => entry.centroid !== null),
    [blockEntries, labeledBlockIds],
  );

  const yearControllers = useMemo(() => {
    const controllerSet = new Map<string, string>();

    blockEntries.forEach(({ control }) => {
      if (control?.controller && !controllerSet.has(control.controller)) {
        controllerSet.set(control.controller, getChinaControllerColor(controllerColorMap, control.controller));
      }
    });

    return Array.from(controllerSet.entries()).sort((left, right) => left[0].localeCompare(right[0], "zh-Hans-CN"));
  }, [blockEntries, controllerColorMap]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();

    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    const scale = event.deltaY > 0 ? 1.1 : 0.9;
    const viewBox = svgElement.viewBox.baseVal;
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    const width = viewBox.width * scale;
    const height = viewBox.height * scale;
    setPuzzleViewBox(`${(centerX - width / 2).toFixed(1)} ${(centerY - height / 2).toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}`);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const element = (event.target as Element).closest("[data-block-id]");
    if (!element) {
      setTooltip(null);
      return;
    }

    const blockId = element.getAttribute("data-block-id");
    if (!blockId) {
      setTooltip(null);
      return;
    }

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setTooltip({
      x: event.clientX - rect.left + 14,
      y: event.clientY - rect.top - 35,
      blockId,
    });
  }, []);

  const tooltipBlock = tooltip ? (blockById.get(tooltip.blockId) ?? null) : null;
  const tooltipControl = tooltipBlock ? getChinaBlockControl(controlTimeline, getChinaBlockControlId(tooltipBlock), year) : null;

  return (
    <div className="map-frame map-mode-commandery">
      <svg
        ref={svgRef}
        className="commandery-puzzle-svg"
        viewBox={puzzleViewBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="157郡拼图"
        onClick={onClearSummary}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <rect x="0" y="0" width="100" height="80" fill="#1a2228" />

        {blockEntries.map(({ block }) => {
          const blockPath = pathCache.get(block.id);
          if (!blockPath) {
            return null;
          }

          return (
            <path
              className="cmd-gap-fill"
              d={blockPath}
              fill="none"
              key={`${block.id}-gap-fill`}
            />
          );
        })}

        {blockEntries.map(({ block, control }) => {
          const blockPath = pathCache.get(block.id);
          if (!blockPath) {
            return null;
          }

          const color = getChinaControllerColor(controllerColorMap, control?.controller);
          const isActive = activeBlockId === block.id;
          const isHovered = hoveredBlockId === block.id;

          return (
            <path
              className={`cmd ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
              d={blockPath}
              data-block-id={block.id}
              fill={color}
              key={block.id}
              onFocus={() => onHoverBlock(block.id)}
              onBlur={() => onHoverBlock(null)}
              onMouseEnter={() => onHoverBlock(block.id)}
              onMouseLeave={() => onHoverBlock(null)}
              onClick={(event) => {
                event.stopPropagation();
                onSelectBlock(block.id);
              }}
              tabIndex={0}
              role="button"
              aria-label={`选择郡县: ${block.name}`}
            />
          );
        })}

        {labelEntries.map((entry) => (
          <text
            className="cmd-label-text"
            key={`${entry.blockId}-label`}
            x={entry.centroid![0]}
            y={entry.centroid![1] + 0.5}
            textAnchor="middle"
          >
            {entry.name}
          </text>
        ))}
      </svg>

      {tooltip && tooltipBlock && (
        <div className="cmd-tip" style={{ left: tooltip.x, top: tooltip.y }}>
          <b>{tooltipBlock.name}</b>
          <br />
          <span>{tooltipControl?.controller ?? "未知"} · {tooltipBlock.parent ?? tooltipBlock.name}</span>
        </div>
      )}

      <div className="cmd-legend">
        {yearControllers.map(([name, color]) => (
          <span key={name}>
            <i style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChinaRegionMap({
  activeBlockId,
  blocks,
  cities,
  controllerColorMap,
  controlTimeline,
  hoveredBlockId,
  mapMode,
  onSelectBlock,
  onHoverBlock,
  onClearSummary,
  physical,
  year,
}: {
  activeBlockId: string | null;
  blocks: ChinaBlock[];
  cities: ChinaMapLayer["cities"];
  controllerColorMap: Map<string, string>;
  controlTimeline: ChinaControlTimeline;
  hoveredBlockId: string | null;
  mapMode: ChinaMapMode;
  onSelectBlock: (blockId: string) => void;
  onHoverBlock: (blockId: string | null) => void;
  onClearSummary: () => void;
  physical: NaturalEarthPhysical;
  year: number;
}) {
  const blockById = useMemo(() => new Map(blocks.map((block) => [block.id, block])), [blocks]);
  const blockEntries = blocks.map((block) => ({
    block,
    control: getChinaBlockControl(controlTimeline, getChinaBlockControlId(block), year),
  }));

  if (mapMode === "three-d") {
    return <ChinaTerrain3DMap onClearSummary={onClearSummary} physical={physical} />;
  }

  if (mapMode === "commandery") {
    return (
      <ChinaCommanderyPuzzleMap
        activeBlockId={activeBlockId}
        blocks={blocks}
        blockById={blockById}
        controllerColorMap={controllerColorMap}
        controlTimeline={controlTimeline}
        hoveredBlockId={hoveredBlockId}
        onSelectBlock={onSelectBlock}
        onHoverBlock={onHoverBlock}
        onClearSummary={onClearSummary}
        year={year}
      />
    );
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
        {physical.land.features.map((geoFeature, index) => {
          const landPath = path(geoFeature);
          if (!landPath) {
            return null;
          }

          return <path className="regional-land" d={landPath} key={`land-${index}`} onClick={onClearSummary} />;
        })}

        {(mapMode === "political" || mapMode === "terrain") && (
          <>
            {physical.geographyRegions.features.map((geoFeature, index) => {
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

            {physical.lakes.features.map((geoFeature, index) => {
              const lakePath = path(geoFeature);
              if (!lakePath) {
                return null;
              }

              return <path className="physical-lake" d={lakePath} key={`lake-${index}`} />;
            })}

            {physical.rivers.features.map((geoFeature, index) => {
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
              physical.geographyRegions.features.map((geoFeature, index) => {
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

              const color = getChinaControllerColor(controllerColorMap, control?.controller);
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

            {physical.rivers.features
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

            {cities.map((city) => {
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

function OverviewWorldMap() {
  return (
    <svg className="overview-base-map" viewBox={worldViewBox} role="img" aria-label="世界粗略底图">
      {spherePath && <path className="sphere" d={spherePath} />}
      {graticulePath && <path className="graticule" d={graticulePath} />}
      <g>
        {countries.map((country, index) => {
          const d = path(country);
          return d ? <path className="country" d={d} key={index} /> : null;
        })}
      </g>
    </svg>
  );
}

const romanViewBox = "0 0 100 68";

function projectRomanPoint([lon, lat]: LonLat) {
  return [((lon + 13) / (49 + 13)) * 100, ((58 - lat) / (58 - 16)) * 68] as [number, number];
}

function getRomanPath(rings: LonLat[][]) {
  return rings
    .map((ring) => {
      if (ring.length < 3) {
        return "";
      }

      return `M${ring
        .map((point) => {
          const projected = projectRomanPoint(point);
          return `${projected[0].toFixed(2)},${projected[1].toFixed(2)}`;
        })
        .join("L")}Z`;
    })
    .join("");
}

function getRomanLinePath(linePoints: LonLat[]) {
  if (linePoints.length < 2) {
    return "";
  }

  return `M${linePoints
    .map((point) => {
      const projected = projectRomanPoint(point);
      return `${projected[0].toFixed(2)},${projected[1].toFixed(2)}`;
    })
    .join("L")}`;
}

function getRomanControl(recordSet: RomanControlRecord[], provinceId: number, year: number) {
  return recordSet.find((record) => record.pid === provinceId && record.start <= year && record.end >= year) ?? null;
}

function RomanRegionMap({
  activeProvinceId,
  data,
  onClearSummary,
  onSelectProvince,
  year,
}: {
  activeProvinceId: number | null;
  data: FrontendRomanControlDb;
  onClearSummary: () => void;
  onSelectProvince: (provinceId: number | null) => void;
  year: number;
}) {
  const [hoveredProvinceId, setHoveredProvinceId] = useState<number | null>(null);
  const displayProvinceId = hoveredProvinceId ?? activeProvinceId;
  const activeProvince = displayProvinceId === null ? null : data.provinces.find((province) => province.id === displayProvinceId) ?? null;
  const activeControl = activeProvince ? getRomanControl(data.timeline, activeProvince.id, year) : null;
  const legendItems = Array.from(
    data.timeline
      .filter((record) => record.start <= year && record.end >= year)
      .reduce((items, record) => items.set(record.ctrl, record.color), new Map<string, string>()),
  );

  return (
    <div className="roman-map-frame">
      <svg className="roman-map" viewBox={romanViewBox} role="img" aria-label="Roman provincial control map" onClick={onClearSummary}>
        <rect className="roman-map-background" x="0" y="0" width="100" height="68" />
        {data.physical?.coast?.map((segment, index) => (
          <path className="roman-coastline" d={getRomanLinePath(segment)} key={`coast-${index}`} />
        ))}
        {data.physical?.rivers?.map((segment, index) => (
          <path className="roman-river" d={getRomanLinePath(segment)} key={`river-${index}`} />
        ))}
        <path
          className="roman-frontier"
          d={getRomanLinePath([
            [6, 47.5],
            [8, 48.2],
            [12, 48.6],
            [14, 48.0],
            [17, 47.5],
            [20, 46.8],
            [22, 46.0],
            [24, 45.5],
            [27, 45.0],
            [29, 45.5],
          ])}
        />
        {data.provinces.map((province) => {
          const control = getRomanControl(data.timeline, province.id, year);
          const isActive = displayProvinceId === province.id;

          return (
            <path
              className={`roman-province ${isActive ? "active" : ""}`}
              d={getRomanPath(province.g)}
              fill={control?.color ?? "#333333"}
              key={province.id}
              onMouseEnter={() => setHoveredProvinceId(province.id)}
              onMouseLeave={() => setHoveredProvinceId(null)}
              onFocus={() => setHoveredProvinceId(province.id)}
              onBlur={() => setHoveredProvinceId(null)}
              onClick={(event) => {
                event.stopPropagation();
                onSelectProvince(province.id);
              }}
              tabIndex={0}
              role="button"
              aria-label={`${province.n}, ${control?.ctrl ?? "Unknown"}`}
            />
          );
        })}
        {data.provinces
          .filter((province) => {
            const ring = province.g[0];
            return ring && ring.length >= 4 && Math.abs(ring.reduce((area, point, index) => {
              const next = ring[(index + 1) % ring.length];
              return area + point[0] * next[1] - next[0] * point[1];
            }, 0)) > 0.4;
          })
          .slice(0, 34)
          .map((province) => {
            const [x, y] = projectRomanPoint([province.x, province.y]);
            return (
              <text className="roman-province-label" key={`${province.id}-label`} x={x} y={y}>
                {province.n}
              </text>
            );
          })}
      </svg>
      <div className="roman-era-chip">
        <strong>{year} CE</strong>
        <span>{activeProvince ? `${activeProvince.n}: ${activeControl?.ctrl ?? "Unknown"}` : "Roman provincial control"}</span>
      </div>
      <div className="roman-legend">
        {legendItems.map(([label, color]) => (
          <span key={label}>
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const [locale, setLocale] = useState<Locale>("zh");
  const [year, setYear] = useState(220);
  const [overviewYear, setOverviewYear] = useState(190);
  const [query, setQuery] = useState("");
  const [chinaMapMode, setChinaMapMode] = useState<ChinaMapMode>("commandery");
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
  const [ageRegionFilter, setAgeRegionFilter] = useState<AgeRegionFilter>("all");
  const [evidenceRegionFilter, setEvidenceRegionFilter] = useState<EvidenceRegionFilter>("all");
  const [evidenceResults, setEvidenceResults] = useState<EvidenceSearchResult[]>([]);
  const [evidenceStatus, setEvidenceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [showMediumEvents, setShowMediumEvents] = useState(false);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [eventsStatus, setEventsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [peopleDataVersion, setPeopleDataVersion] = useState(0);
  const [peopleDataStatus, setPeopleDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sourceDataVersion, setSourceDataVersion] = useState(0);
  const [sourceDataStatus, setSourceDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [regionsDataVersion, setRegionsDataVersion] = useState(0);
  const [regionsDataStatus, setRegionsDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [eventImportanceVersion, setEventImportanceVersion] = useState(0);
  const [eventImportanceStatus, setEventImportanceStatus] = useState<"loading" | "ready" | "error">("loading");
  const [overviewDataVersion, setOverviewDataVersion] = useState(0);
  const [overviewDataStatus, setOverviewDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [runtimeChinaMap, setRuntimeChinaMap] = useState<ChinaMapLayer>(emptyChinaMap);
  const [chinaMapStatus, setChinaMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [runtimeNaturalEarthChinaPhysical, setRuntimeNaturalEarthChinaPhysical] =
    useState<NaturalEarthPhysical>(emptyNaturalEarthChinaPhysical);
  const [chinaPhysicalStatus, setChinaPhysicalStatus] = useState<"loading" | "ready" | "error">("loading");
  const [runtimeChinaControlDb, setRuntimeChinaControlDb] = useState<FrontendChinaControlDb>(emptyChinaControlDb);
  const [chinaControlDbStatus, setChinaControlDbStatus] = useState<"loading" | "ready" | "error">("loading");
  const [runtimeRomanControlDb, setRuntimeRomanControlDb] = useState<FrontendRomanControlDb>(emptyRomanControlDb);
  const [romanControlDbStatus, setRomanControlDbStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedRomanProvinceId, setSelectedRomanProvinceId] = useState<number | null>(null);
  const [coverageData, setCoverageData] = useState<FrontendCoverageDb | null>(null);
  const [coverageDataStatus, setCoverageDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [coverageGapFilter, setCoverageGapFilter] = useState<CoverageGapFilter>("all");
  const [mapDebugData, setMapDebugData] = useState<FrontendMapGeometryDebugDb | null>(null);
  const [mapDebugDataStatus, setMapDebugDataStatus] = useState<"loading" | "ready" | "error">("loading");
  void eventImportanceStatus;
  void regionsDataStatus;
  void overviewDataVersion;
  void overviewDataStatus;
  void chinaMapStatus;
  void chinaPhysicalStatus;
  void coverageDataStatus;
  void mapDebugDataStatus;

  const t = uiText[locale];
  const normalizedQuery = query.trim().toLowerCase();
  const chinaBlocks = runtimeChinaControlDb.adminBlocks.blocks;
  const chinaControlTimeline = runtimeChinaControlDb.controlTimeline;
  const chinaBlockById = useMemo(() => new Map(chinaBlocks.map((block) => [block.id, block])), [chinaBlocks]);
  const chinaControllerColorMap = useMemo(
    () => new Map(chinaControlTimeline.controllers.map((controller) => [controller.id, controller.color])),
    [chinaControlTimeline.controllers],
  );
  const activeOverviewPeriod = getOverviewPeriod(overviewYear);
  const activeOverviewSnapshotYear =
    activeOverviewPeriod.snapshotYears
      .filter((snapshotYear) => snapshotYear >= overviewYearMin && snapshotYear <= overviewYearMax)
      .sort((left, right) => Math.abs(left - overviewYear) - Math.abs(right - overviewYear))[0] ?? overviewYear;
  const activeOverviewCoreRegions = activeOverviewPeriod.focusRegions.filter((region) => region.tier === "core");
  const activeOverviewSupportRegions = activeOverviewPeriod.focusRegions.filter((region) => region.tier !== "core");
  const selectedRomanProvince = selectedRomanProvinceId === null
    ? null
    : runtimeRomanControlDb.provinces.find((province) => province.id === selectedRomanProvinceId) ?? null;

  const matchingEvents = useMemo(() => {
    return events.filter((event) => eventMatchesQuery(event, normalizedQuery));
  }, [events, normalizedQuery]);

  const visibleEvents = useMemo(() => {
    return matchingEvents.filter((event) => isActiveInYear(event, year) || isNearYear(event, year));
  }, [matchingEvents, year]);

  const currentYearRegionCounts = regions.reduce(
    (counts, region) => {
      counts[region.id] = matchingEvents.filter(
        (event) => event.region === region.id && isPinnedToYear(event, year) && shouldShowWorldEvent(event, showMediumEvents),
      ).length;
      return counts;
    },
    {} as Record<Region, number>,
  );
  const timelineMarkers = useMemo(() => {
    const markers = new Map<string, { eventCount: number; region: RegionInfo; titles: string[]; year: number }>();

    matchingEvents
      .filter((event) => getEventImportance(event) === "major")
      .forEach((event) => {
        const region = regions.find((regionInfo) => regionInfo.id === event.region);

        if (!region) {
          return;
        }

        getPinnedYears(event).forEach((eventYear) => {
          const markerKey = `${event.region}-${eventYear}`;
          const marker = markers.get(markerKey) ?? {
            eventCount: 0,
            region,
            titles: [],
            year: eventYear,
          };

          marker.eventCount += 1;
          marker.titles.push(event.title);
          markers.set(markerKey, marker);
        });
      });

    return [...markers.values()].sort((left, right) => left.year - right.year || left.region.label.localeCompare(right.region.label, "zh-Hans-CN"));
  }, [eventImportanceVersion, matchingEvents, regionsDataVersion]);
  const worldComparisonItems = worldComparisonRegionOrder
    .map((regionId) => regions.find((region) => region.id === regionId))
    .filter((region): region is RegionInfo => Boolean(region))
    .map((region) => {
      const regionEvents = matchingEvents.filter((event) => event.region === region.id);
      const yearEvents = regionEvents
        .filter((event) => isPinnedToYear(event, year) && shouldShowWorldEvent(event, showMediumEvents))
        .sort(sortEventsByYearThenTitle);
      const hiddenMediumEvents = showMediumEvents
        ? []
        : regionEvents.filter((event) => isPinnedToYear(event, year) && getEventImportance(event) === "medium").sort(sortEventsByYearThenTitle);
      const focusLifeEvents = region.id === "china" && yearEvents.length === 0 && hiddenMediumEvents.length === 0 ? getChinaFocusLifeEvents(year) : [];

      return {
        region,
        era: getRegionEra(region, year),
        yearEvents,
        hiddenMediumEvents,
        focusLifeEvents,
        eventCount: regionEvents.length,
      };
    });

  const hoverRegionInfo = regions.find((region) => region.id === hoveredRegion);
  const summaryRegionInfo = regions.find((region) => region.id === summaryRegion);
  const inspectedRegion = hoverRegionInfo ?? summaryRegionInfo;
  const detailRegionId: Region = page === "rome" ? "rome" : page === "china" ? "china" : (inspectedRegion?.id ?? selectedRegion);
  const selectedRegionInfo = regions.find((region) => region.id === detailRegionId) ?? regions[0];
  const inspectedEra = inspectedRegion ? getRegionEra(inspectedRegion, year) : null;
  const inspectedRegionCurrentEventCount = inspectedRegion ? (currentYearRegionCounts[inspectedRegion.id] ?? 0) : 0;
  const inspectedRegionHiddenMediumCount =
    inspectedRegion && !showMediumEvents
      ? matchingEvents.filter(
          (event) =>
            event.region === inspectedRegion.id &&
            isPinnedToYear(event, year) &&
            getEventImportance(event) === "medium",
        ).length
      : 0;
  const inspectedRegionMetaLabel = inspectedRegionCurrentEventCount
    ? `${inspectedRegionCurrentEventCount} 个本年事件`
    : inspectedRegionHiddenMediumCount
      ? `${inspectedRegionHiddenMediumCount} 个中型事件`
      : inspectedRegion?.id === "china"
        ? "曹孙刘动向"
        : "时代背景";
  const selectedRegionEra = getRegionEra(selectedRegionInfo, year);
  const chinaRegionInfo = regions.find((region) => region.id === "china")!;
  const chinaRegionEra = getRegionEra(chinaRegionInfo, year);
  const chinaMapLayer = getChinaMapLayer(runtimeChinaMap, year);
  const chinaBlockSnapshots = useMemo(
    () =>
      chinaBlocks.map((block) => ({
        block,
        control: getChinaBlockControl(chinaControlTimeline, getChinaBlockControlId(block), year),
      })),
    [chinaBlocks, chinaControlTimeline, year],
  );
  const selectedChinaBlock = selectedChinaBlockId ? (chinaBlockById.get(selectedChinaBlockId) ?? null) : null;
  const hoveredChinaBlock = hoveredChinaBlockId ? (chinaBlockById.get(hoveredChinaBlockId) ?? null) : null;
  const inspectedChinaBlock = (hoveredChinaBlock ?? selectedChinaBlock)!;
  const inspectedChinaControl = inspectedChinaBlock
    ? getChinaBlockControl(chinaControlTimeline, getChinaBlockControlId(inspectedChinaBlock), year)
    : null;

  const detailRegionAllEvents = matchingEvents.filter((event) => event.region === detailRegionId);
  const romanProvinceMatchedEvents =
    detailRegionId === "rome" && selectedRomanProvince
      ? detailRegionAllEvents.filter((event) => eventMatchesRomanProvince(event, selectedRomanProvince))
      : [];
  const detailRegionEvents = romanProvinceMatchedEvents.length ? romanProvinceMatchedEvents : detailRegionAllEvents;
  const isRomanProvinceEventFiltered = detailRegionId === "rome" && Boolean(selectedRomanProvince) && romanProvinceMatchedEvents.length > 0;
  const detailRegionExactEvents = detailRegionEvents
    .filter((event) => (isActiveInYear(event, year) || isPinnedToYear(event, year)) && (page !== "world" || shouldShowWorldEvent(event, showMediumEvents)))
    .sort(sortEventsByYearThenTitle);
  const detailRegionNearbyEvents =
    detailRegionId === "china" || detailRegionExactEvents.length
      ? []
      : detailRegionEvents
          .filter(
            (event) =>
              !isActiveInYear(event, year) &&
              !isPinnedToYear(event, year) &&
              (isRomanProvinceEventFiltered || isNearYear(event, year)) &&
              (page !== "world" || shouldShowWorldEvent(event, showMediumEvents)),
          )
          .sort((left, right) => Math.min(Math.abs(left.startYear - year), Math.abs(left.endYear - year)) - Math.min(Math.abs(right.startYear - year), Math.abs(right.endYear - year)) || sortEventsByYearThenTitle(left, right))
          .slice(0, 8);
  const selectedRegionEvents =
    detailRegionId === "china" && page !== "world"
      ? visibleEvents.filter((event) => event.region === detailRegionId)
      : detailRegionExactEvents.length
        ? detailRegionExactEvents
        : detailRegionNearbyEvents;
  const selectedRegionHiddenMediumEvents =
    page === "world" && !showMediumEvents
      ? matchingEvents
          .filter(
            (event) =>
              event.region === detailRegionId &&
              isPinnedToYear(event, year) &&
              getEventImportance(event) === "medium",
          )
          .sort(sortEventsByYearThenTitle)
      : [];
  const filteredRegionEvents =
    detailRegionId === "china"
      ? selectedRegionEvents.filter((event) => matchesThreeKingdomsFilter(event, eventFilter))
      : selectedRegionEvents;
  const shouldUseChinaFallbackLifeEvents = detailRegionId === "china" && selectedRegionEvents.length === 0;
  const selectedRegionFallbackLifeEvents =
    shouldUseChinaFallbackLifeEvents && filteredRegionEvents.length === 0 ? getChinaLifeEventsForYear(year, eventFilter) : [];
  const selectedRegionTotalFallbackLifeEvents =
    shouldUseChinaFallbackLifeEvents ? getChinaLifeEventsForYear(year, "all") : [];
  const selectedRegionFocusLifeEvents =
    detailRegionId === "china" &&
    filteredRegionEvents.length === 0 &&
    selectedRegionHiddenMediumEvents.length === 0
      ? selectedRegionFallbackLifeEvents.length
        ? selectedRegionFallbackLifeEvents
        : getChinaFocusLifeEvents(year).filter((item) => matchesThreeKingdomsLifeEventFilter(item, eventFilter))
      : [];
  const selectedRegionFilteredDisplayCount = filteredRegionEvents.length + selectedRegionFallbackLifeEvents.length;
  const selectedRegionTotalDisplayCount = selectedRegionEvents.length + selectedRegionTotalFallbackLifeEvents.length;
  const selectedRegionDisplayCountLabel =
    selectedRegionTotalDisplayCount > 0 ? `${selectedRegionFilteredDisplayCount}/${selectedRegionTotalDisplayCount}` : "0";
  const detailRegionEventCountLabel =
    detailRegionId === "china"
      ? selectedRegionDisplayCountLabel
      : isRomanProvinceEventFiltered
        ? `${t.roman.provinceCount} ${filteredRegionEvents.length}`
      : detailRegionNearbyEvents.length
        ? `${t.roman.nearbyCount} ${filteredRegionEvents.length}`
        : `${filteredRegionEvents.length}`;
  const eventFilterCounts = Object.fromEntries(
    threeKingdomsFilters.map((filter) => {
      const eventCount = selectedRegionEvents.filter((event) => matchesThreeKingdomsFilter(event, filter.id)).length;
      return [filter.id, eventCount || (shouldUseChinaFallbackLifeEvents ? getChinaLifeEventsForYear(year, filter.id).length : 0)];
    }),
  ) as Record<ThreeKingdomsFilter, number>;
  const selectedEvent =
    filteredRegionEvents.find((event) => event.id === selectedId) ??
    filteredRegionEvents[0] ??
    events.find((event) => event.id === selectedId) ??
    events[0] ??
    emptyHistoricalEvent;
  const selectedEventTitle = getEventDisplayTitle(selectedEvent, locale);
  const selectedEventDetail = selectedEvent.detail ?? null;

  const relatedEvents = selectedEvent.relatedEvents
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is HistoricalEvent => Boolean(event));
  const selectedEventPersonIds = (selectedEvent.personIds ?? []).filter((id) => chinaPersonById.has(id));
  const personIndexItems = useMemo(
    () => [...chinaPersons.map(chinaPersonToPersonIndexItem), ...ageSupplementPeople.map(agePersonToPersonIndexItem)],
    [peopleDataVersion],
  );
  const selectedPerson = selectedPersonId ? (chinaPersonById.get(selectedPersonId) ?? null) : null;
  const selectedPersonIndexItem = selectedPersonId ? (personIndexItems.find((person) => person.id === selectedPersonId) ?? null) : null;
  const activeSelectedPersonId = selectedPersonIndexItem?.id ?? selectedPerson?.id ?? null;
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
  const selectedPersonSourceMentions = useMemo(
    () =>
      selectedPerson
        ? chinaSourceMentions
            .filter((mention) => mention.mentionedPersonIds.includes(selectedPerson.id))
            .sort((left, right) => (left.year ?? 9999) - (right.year ?? 9999) || left.locator.localeCompare(right.locator, "zh-Hans-CN"))
        : [],
    [selectedPerson, sourceDataVersion],
  );
  const selectedPersonAnnualTimeline = selectedPerson ? getPersonAnnualTimeline(selectedPerson, selectedPersonLifeEvents) : [];
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
  }, [peopleDataVersion]);
  const personRelationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    chinaPersonRelations.forEach((relation) => {
      counts.set(relation.sourcePersonId, (counts.get(relation.sourcePersonId) ?? 0) + 1);
      counts.set(relation.targetPersonId, (counts.get(relation.targetPersonId) ?? 0) + 1);
    });
    return counts;
  }, [peopleDataVersion]);
  const personEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((event) => {
      event.personIds?.forEach((personId) => counts.set(personId, (counts.get(personId) ?? 0) + 1));
    });
    return counts;
  }, [events]);
  const personIndexEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    personIndexItems.forEach((person) => {
      counts.set(
        person.id,
        events.filter(
          (event) =>
            event.personIds?.includes(person.id) ||
            event.personIds?.includes(person.id.replace(/^china-/, "")) ||
            event.people.includes(person.name),
        ).length,
      );
    });
    return counts;
  }, [events, personIndexItems]);
  const personIndexCounts = Object.fromEntries(
    personIndexFilters.map((filter) => [
      filter.id,
      personIndexItems.filter((person) => matchesPersonIndexFilter(person, filter.id)).length,
    ]),
  ) as Record<PersonIndexFilter, number>;
  const visiblePersonIndex = useMemo(() => {
    return personIndexItems
      .map((person) => ({
        person,
        rank: getPersonSearchRank(person, normalizedQuery),
      }))
      .filter(({ person, rank }) => matchesPersonIndexFilter(person, personIndexFilter) && (!normalizedQuery || Number.isFinite(rank)))
      .sort(
        (left, right) =>
          left.rank - right.rank ||
          (personIndexEventCounts.get(right.person.id) ?? 0) - (personIndexEventCounts.get(left.person.id) ?? 0) ||
          left.person.name.localeCompare(right.person.name, "zh-Hans-CN"),
      )
      .map(({ person }) => person);
  }, [normalizedQuery, personIndexEventCounts, personIndexFilter, personIndexItems]);
  const personSearchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return personIndexItems
      .map((person) => ({ person, rank: getPersonSearchRank(person, normalizedQuery) }))
      .filter((item) => Number.isFinite(item.rank))
      .sort((left, right) => left.rank - right.rank || left.person.name.localeCompare(right.person.name, "zh-Hans-CN"))
      .map((item) => item.person)
      .slice(0, 8);
  }, [normalizedQuery, personIndexItems]);
  const agePeople = useMemo(() => {
    return [...chinaPersons.map(chinaPersonToAgePerson).filter((person): person is AgePerson => Boolean(person)), ...ageSupplementPeople];
  }, [peopleDataVersion]);
  const ageComparisonItems = useMemo(() => {
    return agePeople
      .map((person) => ({
        person,
        rank: agePersonSearchRank(person, normalizedQuery),
        state: getAgePersonState(person, year),
      }))
      .filter(({ person, rank }) => {
        const regionMatches = ageRegionFilter === "all" || person.region === ageRegionFilter;
        return regionMatches && (!normalizedQuery || Number.isFinite(rank));
      })
      .sort(
        (left, right) => {
          if (normalizedQuery) {
            return (
              left.rank - right.rank ||
              left.state.sortRank - right.state.sortRank ||
              right.state.age - left.state.age ||
              left.person.name.localeCompare(right.person.name, "zh-Hans-CN")
            );
          }

          return (
            left.state.sortRank - right.state.sortRank ||
            right.state.age - left.state.age ||
            left.person.name.localeCompare(right.person.name, "zh-Hans-CN")
          );
        },
      );
  }, [agePeople, ageRegionFilter, normalizedQuery, year]);
  const ageRegionCounts = Object.fromEntries(
    ageRegionFilters.map((filter) => [
      filter.id,
      agePeople.filter((person) => filter.id === "all" || person.region === filter.id).length,
    ]),
  ) as Record<AgeRegionFilter, number>;
  const currentYearEvents = matchingEvents
    .filter((event) => isPinnedToYear(event, year))
    .sort(sortEventsByYearThenTitle);
  const evidenceSearchTerm = page === "evidence" ? query.trim() : "";
  const evidenceRegionCounts = Object.fromEntries(
    (["all", ...worldComparisonRegionOrder] as EvidenceRegionFilter[]).map((filter) => [
      filter,
      filter === "all" ? evidenceResults.length : evidenceResults.filter((result) => result.regionId === filter).length,
    ]),
  ) as Record<EvidenceRegionFilter, number>;
  const eventComparisonItems = worldComparisonRegionOrder
    .map((regionId) => regions.find((region) => region.id === regionId))
    .filter((region): region is RegionInfo => Boolean(region))
    .map((region) => {
      const regionEvents = matchingEvents.filter((event) => event.region === region.id);
      const exactEvents = regionEvents
        .filter((event) => isPinnedToYear(event, year) && shouldShowWorldEvent(event, showMediumEvents))
        .sort(sortEventsByYearThenTitle);
      const hiddenMediumEvents = showMediumEvents
        ? []
        : regionEvents.filter((event) => isPinnedToYear(event, year) && getEventImportance(event) === "medium").sort(sortEventsByYearThenTitle);
      const nearbyEvents = regionEvents
        .filter((event) => !isPinnedToYear(event, year) && Math.abs(event.startYear - year) <= 3 && shouldShowWorldEvent(event, showMediumEvents))
        .sort((left, right) => Math.abs(left.startYear - year) - Math.abs(right.startYear - year) || sortEventsByYearThenTitle(left, right))
        .slice(0, 3);

      return {
        region,
        era: getRegionEra(region, year),
        exactEvents,
        hiddenMediumEvents,
        nearbyEvents,
        focusLifeEvents: region.id === "china" && exactEvents.length === 0 && hiddenMediumEvents.length === 0 ? getChinaFocusLifeEvents(year) : [],
      };
    });
  const eventComparisonCount = eventComparisonItems.reduce((total, item) => total + item.exactEvents.length, 0);
  const selectedPersonIsInEvent = selectedPerson ? selectedEventPersonIds.includes(selectedPerson.id) : false;

  useEffect(() => {
    let cancelled = false;

    setPeopleDataStatus("loading");
    fetch("/api/frontend-people-index")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`People index API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendPeopleIndexDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        applyPeopleIndexData(data);
        setPeopleDataVersion((version) => version + 1);
        setPeopleDataStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        applyPeopleIndexData(emptyPeopleIndexDb);
        setPeopleDataVersion((version) => version + 1);
        setPeopleDataStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setSourceDataStatus("loading");
    fetch("/api/frontend-sources")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Sources API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendSourcesDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        applySourcesData(data);
        setSourceDataVersion((version) => version + 1);
        setSourceDataStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        applySourcesData(emptySourcesDb);
        setSourceDataVersion((version) => version + 1);
        setSourceDataStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setRegionsDataStatus("loading");
    fetch("/api/frontend-regions")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Regions API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendRegionsDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        applyRegionsData(data);
        setRegionsDataVersion((version) => version + 1);
        setRegionsDataStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        applyRegionsData({ regions: emptyRegions });
        setRegionsDataVersion((version) => version + 1);
        setRegionsDataStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setEventImportanceStatus("loading");
    fetch("/api/frontend-event-importance")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Event importance API failed: ${response.status}`);
        }

        return response.json() as Promise<EventImportanceDataset>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        applyEventImportanceData(data);
        setEventImportanceVersion((version) => version + 1);
        setEventImportanceStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        applyEventImportanceData({
          model: "event-importance",
          defaultImportance: "medium",
          records: [],
        });
        setEventImportanceVersion((version) => version + 1);
        setEventImportanceStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setOverviewDataStatus("loading");
    fetch("/api/frontend-period-overview")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Period overview API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendPeriodOverviewDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        applyPeriodOverviewData(data);
        setOverviewDataVersion((version) => version + 1);
        setOverviewDataStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        applyPeriodOverviewData({
          schemaVersion: 1,
          model: "period-overview",
          range: [-550, 1644],
          periods: [],
        });
        setOverviewDataVersion((version) => version + 1);
        setOverviewDataStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setEventsStatus("loading");
    fetch("/api/frontend-events")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Events API failed: ${response.status}`);
        }

        return response.json() as Promise<{ events: HistoricalEvent[] }>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setEvents((data.events ?? []).map(normalizeHistoricalEvent));
        setEventsStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setEvents([]);
        setEventsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setChinaMapStatus("loading");
    fetch("/api/frontend-china-map")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`China map API failed: ${response.status}`);
        }

        return response.json() as Promise<ChinaMapLayer>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setRuntimeChinaMap(data);
        setChinaMapStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setRuntimeChinaMap(emptyChinaMap);
        setChinaMapStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setChinaPhysicalStatus("loading");
    fetch("/api/frontend-china-physical")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`China physical API failed: ${response.status}`);
        }

        return response.json() as Promise<NaturalEarthPhysical>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setRuntimeNaturalEarthChinaPhysical(data);
        setChinaPhysicalStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setRuntimeNaturalEarthChinaPhysical(emptyNaturalEarthChinaPhysical);
        setChinaPhysicalStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setCoverageDataStatus("loading");
    fetch("/api/frontend-coverage-190-310")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Coverage API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendCoverageDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setCoverageData(data);
        setCoverageDataStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setCoverageData(null);
        setCoverageDataStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setMapDebugDataStatus("loading");
    fetch("/api/frontend-map-geometry-debug?dataset=china-admin-block-map-190-280&limit=180")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Map geometry debug API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendMapGeometryDebugDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setMapDebugData(data);
        setMapDebugDataStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setMapDebugData(null);
        setMapDebugDataStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setChinaControlDbStatus("loading");
    fetch("/api/frontend-china-control")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`China control API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendChinaControlDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setRuntimeChinaControlDb(data);
        setChinaControlDbStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setRuntimeChinaControlDb(emptyChinaControlDb);
        setChinaControlDbStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setRomanControlDbStatus("loading");
    fetch("/api/frontend-roman-control")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Roman control API failed: ${response.status}`);
        }

        return response.json() as Promise<FrontendRomanControlDb>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setRuntimeRomanControlDb(data);
        setRomanControlDbStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setRuntimeRomanControlDb(emptyRomanControlDb);
        setRomanControlDbStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (page !== "evidence") {
      return;
    }

    if (!evidenceSearchTerm) {
      setEvidenceResults([]);
      setEvidenceStatus("idle");
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      q: evidenceSearchTerm,
      limit: "36",
    });
    if (evidenceRegionFilter !== "all") {
      params.set("region", evidenceRegionFilter);
    }

    setEvidenceStatus("loading");
    fetch(`/api/search-documents?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Evidence search failed: ${response.status}`);
        }
        return response.json() as Promise<{ results: EvidenceSearchResult[] }>;
      })
      .then((payload) => {
        setEvidenceResults(payload.results ?? []);
        setEvidenceStatus("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setEvidenceResults([]);
        setEvidenceStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [evidenceRegionFilter, evidenceSearchTerm, page]);

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
  }, [chinaBlockById, chinaMapMode, page, selectedChinaBlockId]);

  function previewRegion(region: Region) {
    setSelectedRegion(region);
    setSummaryRegion(region);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    if (region !== "rome") {
      setSelectedRomanProvinceId(null);
    }
    const firstEvent = visibleEvents.find((event) => event.region === region);
    if (firstEvent) {
      setSelectedId(firstEvent.id);
    }
  }

  function selectRegion(region: Region) {
    if (region === "china") {
      setPage("china");
      setChinaMapMode("commandery");
      setSelectedRegion("china");
      setSummaryRegion(null);
      setHoveredRegion(null);
      setSelectedChinaBlockId(null);
      setHoveredChinaBlockId(null);
      setSelectedRomanProvinceId(null);
      const firstChinaEvent = visibleEvents.find((event) => event.region === "china");
      if (firstChinaEvent) {
        setSelectedId(firstChinaEvent.id);
      }
      return;
    }

    if (region === "rome") {
      setPage("rome");
      setSelectedRegion("rome");
      setSummaryRegion(null);
      setHoveredRegion(null);
      setSelectedChinaBlockId(null);
      setHoveredChinaBlockId(null);
      const firstRomanEvent = visibleEvents.find((event) => event.region === "rome");
      if (firstRomanEvent) {
        setSelectedId(firstRomanEvent.id);
      }
      return;
    }

    setSelectedRegion(region);
    setSummaryRegion(region);
    setSelectedRomanProvinceId(null);
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
    setSelectedRomanProvinceId(null);
  }

  function returnToHome() {
    setPage("home");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function enterOverviewPeriod(period: OverviewPeriod, entryYear = period.detailEntryYear ?? getPeriodMidpoint(period)) {
    setOverviewYear(Math.min(overviewYearMax, Math.max(overviewYearMin, entryYear)));
    if (period.status !== "complete") {
      return;
    }

    setYear(Math.min(yearMax, Math.max(yearMin, entryYear)));
    setPage("world");
    setSelectedRegion("china");
    setSummaryRegion("china");
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openPeopleIndex() {
    setPage("people");
    setSelectedRegion("china");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
    setSelectedPersonId((current) => current ?? "cao-cao");
  }

  function openAgeComparison() {
    setPage("age");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openEvidencePanel() {
    setPage("evidence");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openEvidenceSearch(term: string, region?: EvidenceRegionFilter) {
    setQuery(term);
    if (region) {
      setEvidenceRegionFilter(region);
    }
    openEvidencePanel();
  }

  function openEventEvidence(event: HistoricalEvent) {
    openEvidenceSearch(event.title, event.region);
  }

  function openEventComparison() {
    setPage("compare");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openCoveragePanel() {
    setPage("coverage");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openMapDebugPanel() {
    setPage("map-debug");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function changeChinaMapMode(mode: ChinaMapMode) {
    setChinaMapMode(mode);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
  }

  function selectHistoricalEvent(event: HistoricalEvent) {
    setSelectedRegion(event.region);
    if (event.region !== "rome") {
      setSelectedRomanProvinceId(null);
    }
    if (event.region === "china") {
      setPage("china");
      setChinaMapMode("commandery");
      if (!matchesThreeKingdomsFilter(event, eventFilter)) {
        setEventFilter("all");
      }
    }
    if (event.region === "rome") {
      setPage("rome");
    }

    setSelectedId(event.id);
    setYear(Math.min(yearMax, Math.max(yearMin, event.startYear)));
  }

  function selectPerson(personId: string) {
    setSelectedPersonId(personId);
    const indexPerson = personIndexItems.find((person) => person.id === personId);
    if (indexPerson?.source === "age-supplement") {
      setAgeRegionFilter(indexPerson.region);
      setQuery(indexPerson.name);
      setPage("age");
    }
  }

  const coverageTotals = coverageData?.regions.reduce(
    (totals, region) => ({
      gaps: totals.gaps + region.gaps.length,
      missingOriginal: totals.missingOriginal + region.metrics.evidenceMissingOriginal,
      missingEvidenceEvents: totals.missingEvidenceEvents + region.missingEvidenceEvents.length,
    }),
    { gaps: 0, missingOriginal: 0, missingEvidenceEvents: 0 },
  );
  const visibleCoverageRegions = coverageData?.regions.filter((region) => coverageRegionMatchesFilter(region, coverageGapFilter)) ?? [];
  const coverageFilterCounts = Object.fromEntries(
    coverageGapFilters.map((filter) => [
      filter.id,
      coverageData?.regions.filter((region) => coverageRegionMatchesFilter(region, filter.id)).length ?? 0,
    ]),
  ) as Record<CoverageGapFilter, number>;

  return (
    <main className={`app-shell ${page === "home" || page === "evidence" || page === "compare" || page === "coverage" || page === "map-debug" ? "wide-shell" : ""}`}>
      <section className="map-workspace">
        <header className="topbar">
          <div>
            <p className="kicker">ChronoAtlas</p>
            <h1>{t.pageTitle[page]}</h1>
          </div>
          <div className="topbar-actions">
            <button
              className={`topbar-action ${page === "home" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "home"}
              onClick={returnToHome}
            >
              <Compass size={17} aria-hidden="true" />
              <span>{t.nav.home}</span>
            </button>
            <button
              className={`topbar-action ${page === "people" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "people"}
              onClick={openPeopleIndex}
            >
              <UsersRound size={17} aria-hidden="true" />
              <span>{t.nav.people}</span>
            </button>
            <button
              className={`topbar-action ${page === "age" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "age"}
              onClick={openAgeComparison}
            >
              <CalendarDays size={17} aria-hidden="true" />
              <span>{t.nav.age}</span>
            </button>
            <button
              className={`topbar-action ${page === "evidence" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "evidence"}
              onClick={openEvidencePanel}
            >
              <BookOpen size={17} aria-hidden="true" />
              <span>{t.nav.evidence}</span>
            </button>
            <button
              className={`topbar-action ${page === "compare" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "compare"}
              onClick={openEventComparison}
            >
              <CircleDot size={17} aria-hidden="true" />
              <span>{t.nav.compare}</span>
            </button>
            <button
              className={`topbar-action ${page === "coverage" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "coverage"}
              onClick={openCoveragePanel}
            >
              <Grid3x3 size={17} aria-hidden="true" />
              <span>{t.nav.coverage}</span>
            </button>
            <button
              className={`topbar-action ${page === "map-debug" ? "active" : ""}`}
              type="button"
              aria-pressed={page === "map-debug"}
              onClick={openMapDebugPanel}
            >
              <Network size={17} aria-hidden="true" />
              <span>{t.nav.mapDebug}</span>
            </button>
            <button
              className="topbar-action locale-toggle"
              type="button"
              aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
              onClick={() => setLocale((current) => current === "zh" ? "en" : "zh")}
            >
              <span>{locale === "zh" ? "English" : "中文"}</span>
            </button>
            {page !== "home" && page !== "coverage" && page !== "map-debug" && (
              <label className="search-box">
                <Search size={18} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    page === "people" || page === "age"
                      ? t.search.people
                      : page === "evidence"
                        ? t.search.evidence
                        : t.search.default
                  }
                />
              </label>
            )}
          </div>
        </header>

        {page === "china" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              {t.common.worldOverview}
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
            <span>{chinaMapMode === "political" ? "州郡区块模型" : chinaMapMode === "commandery" ? "157郡拼图" : (chinaMapLayer?.title ?? chinaRegionEra.title)}</span>
          </div>
        )}

        {page === "people" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              {t.common.worldOverview}
            </button>
            <button className="back-button" type="button" onClick={() => selectRegion("china")}>
              <MapPinned size={18} />
              {t.common.chinaMap}
            </button>
            <span>{visiblePersonIndex.length}/{personIndexItems.length} {t.common.peopleCount}</span>
          </div>
        )}

        {page === "age" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              {t.common.worldOverview}
            </button>
            <button className="back-button" type="button" onClick={openPeopleIndex}>
              <UsersRound size={18} />
              {t.nav.people}
            </button>
            <span>{ageComparisonItems.length}/{agePeople.length} {t.common.calculablePeople} · {year} {t.common.yearSuffix}</span>
          </div>
        )}

        {page === "evidence" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              {t.common.worldOverview}
            </button>
            <button className="back-button" type="button" onClick={openPeopleIndex}>
              <UsersRound size={18} />
              {t.nav.people}
            </button>
            <span>
              {evidenceSearchTerm
                ? `${evidenceResults.length} ${locale === "zh" ? "条史料片段" : "evidence passages"}`
                : t.search.evidence}
            </span>
          </div>
        )}

        {page === "compare" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              {t.common.worldOverview}
            </button>
            <button
              className={`back-button ${showMediumEvents ? "active" : ""}`}
              type="button"
              aria-pressed={showMediumEvents}
              onClick={() => setShowMediumEvents((current) => !current)}
            >
              <Layers size={18} />
              中型事件 {showMediumEvents ? "开" : "关"}
            </button>
            <span>{year} 年 · {eventComparisonCount} 条对比事件</span>
          </div>
        )}

        {page === "rome" && (
          <div className="region-toolbar">
            <button className="back-button" type="button" onClick={returnToWorld}>
              <ArrowLeft size={18} />
              {t.common.worldOverview}
            </button>
            <span>
              {runtimeRomanControlDb.provinces.length
                ? `${runtimeRomanControlDb.provinces.length} province fragments`
                : romanControlDbStatus === "loading"
                  ? "Loading Roman province map"
                  : "Roman API offline"}
            </span>
          </div>
        )}

        {page === "home" ? (
          <section className="overview-stage" aria-label={t.pageTitle.home}>
            <div className="overview-map-panel">
              <div className="overview-map-header">
                <div>
                  <p className="kicker">{locale === "zh" ? "世界时间轴" : "Global Timeline"}</p>
                  <h2>{formatHistoricalYearWithEra(overviewYear)}</h2>
                  <span>{activeOverviewPeriod.title}</span>
                </div>
                <button
                  className={`back-button ${activeOverviewPeriod.status === "complete" ? "active" : ""}`}
                  type="button"
                  onClick={() => enterOverviewPeriod(activeOverviewPeriod, overviewYear)}
                >
                  <MapPinned size={18} />
                  {activeOverviewPeriod.status === "complete" ? t.common.openPeriod : t.common.viewPlan}
                </button>
              </div>

              <div className="overview-world-canvas" aria-label={t.common.roughWorldMap}>
                <OverviewWorldMap />
                {activeOverviewCoreRegions.map((region) => (
                  <span
                    className="overview-region-zone"
                    key={`${activeOverviewPeriod.id}-${region.id}-zone`}
                    style={getOverviewRegionZoneStyle(activeOverviewPeriod, region)}
                    aria-hidden="true"
                  />
                ))}
                {activeOverviewCoreRegions.map((region, index) => (
                  <button
                    className="overview-map-pin"
                    key={`${activeOverviewPeriod.id}-${region.id}`}
                    style={
                      {
                        "--period-color": activeOverviewPeriod.color,
                        ...getOverviewRegionPosition(activeOverviewPeriod, region),
                      } as React.CSSProperties
                    }
                    type="button"
                    title={region.summary}
                    onClick={() => setOverviewYear(activeOverviewSnapshotYear)}
                    onDoubleClick={() => enterOverviewPeriod(activeOverviewPeriod, overviewYear)}
                  >
                    <span>{index + 1}</span>
                    <strong aria-hidden="true">{region.label}</strong>
                  </button>
                ))}
                {activeOverviewSupportRegions.map((region, index) => (
                  <button
                    className="overview-map-pin secondary"
                    key={`${activeOverviewPeriod.id}-${region.id}`}
                    style={
                      {
                        "--period-color": activeOverviewPeriod.color,
                        ...getOverviewRegionPosition(activeOverviewPeriod, region),
                      } as React.CSSProperties
                    }
                    type="button"
                    title={region.summary}
                    onClick={() => setOverviewYear(activeOverviewSnapshotYear)}
                    onDoubleClick={() => enterOverviewPeriod(activeOverviewPeriod, overviewYear)}
                  >
                    <span>{index + activeOverviewCoreRegions.length + 1}</span>
                    <strong aria-hidden="true">{region.label}</strong>
                  </button>
                ))}
              </div>

              <div className="overview-slider-card">
                <div className="overview-year-readout">
                  <CalendarDays size={19} aria-hidden="true" />
                  <strong>{formatHistoricalYearWithEra(overviewYear)}</strong>
                  <span>{t.common.nearestSnapshot}: {formatHistoricalYearWithEra(activeOverviewSnapshotYear)}</span>
                </div>
                <div className="overview-period-track" aria-hidden="true">
                  {overviewPeriods
                    .filter((period) => period.endYear >= overviewYearMin && period.startYear <= overviewYearMax)
                    .map((period) => {
                      const start = Math.max(period.startYear, overviewYearMin);
                      const end = Math.min(period.endYear, overviewYearMax);
                      const left = getOverviewYearPercent(start);
                      const width = Math.max(0.4, getOverviewYearPercent(end) - left);
                      return (
                        <button
                          className={`overview-period-band ${period.id === activeOverviewPeriod.id ? "selected" : ""} ${period.status}`}
                          key={period.id}
                          style={{ left: `${left}%`, width: `${width}%`, "--period-color": period.color } as React.CSSProperties}
                          type="button"
                  title={`${period.title} · ${formatHistoricalYear(start)}-${formatHistoricalYear(end)}`}
                          onClick={() => setOverviewYear(getPeriodMidpoint(period))}
                          onDoubleClick={() => enterOverviewPeriod(period, getPeriodMidpoint(period))}
                        >
                          <span>{period.id === activeOverviewPeriod.id ? getOverviewPeriodShortLabel(period) : ""}</span>
                        </button>
                      );
                    })}
                  <span className="overview-current-year" style={{ left: `${getOverviewYearPercent(overviewYear)}%` }} />
                </div>
                <input
                  aria-label={locale === "zh" ? "选择总览年份" : "Select overview year"}
                  className="overview-range"
                  type="range"
                  min={overviewYearMin}
                  max={overviewYearMax}
                  step={1}
                  value={overviewYear}
                  onInput={(event) => setOverviewYear(Number(event.currentTarget.value))}
                  onChange={(event) => setOverviewYear(Number(event.target.value))}
                />
                <div className="overview-range-labels">
                  <span>前 550</span>
                  <span>?221</span>
                  <span>190</span>
                  <span>750</span>
                  <span>1206</span>
                  <span>1644</span>
                </div>
              </div>
            </div>

            <aside className="overview-side-panel">
              <div className="overview-period-card" style={{ "--period-color": activeOverviewPeriod.color } as React.CSSProperties}>
                <span>{getPeriodStatusLabel(activeOverviewPeriod.status)}</span>
                <h3>{activeOverviewPeriod.title}</h3>
                <p>{activeOverviewPeriod.summary}</p>
                <div className="overview-period-meta">
                  <strong>{formatHistoricalYear(activeOverviewPeriod.startYear)}-{formatHistoricalYear(activeOverviewPeriod.endYear)}</strong>
                  <small>{activeOverviewPeriod.focusRegions.filter((region) => region.tier === "core").map((region) => region.label).join(" / ")}</small>
                </div>
              </div>

              <div className="overview-snapshot-list">
                <span>{t.common.snapshotYears}</span>
                <div>
                  {activeOverviewPeriod.snapshotYears
                    .filter((snapshotYear) => snapshotYear >= overviewYearMin && snapshotYear <= overviewYearMax)
                    .map((snapshotYear) => (
                      <button
                        className={snapshotYear === activeOverviewSnapshotYear ? "selected" : ""}
                        key={`${activeOverviewPeriod.id}-${snapshotYear}`}
                        type="button"
                        onClick={() => setOverviewYear(snapshotYear)}
                        onDoubleClick={() => enterOverviewPeriod(activeOverviewPeriod, snapshotYear)}
                      >
                        {formatHistoricalYear(snapshotYear)}
                      </button>
                    ))}
                </div>
              </div>

              <div className="overview-context-list">
                <span>{t.common.contextNotes}</span>
                {activeOverviewPeriod.context.map((contextItem) => (
                  <p key={`${activeOverviewPeriod.id}-${contextItem}`}>{contextItem}</p>
                ))}
              </div>
            </aside>
          </section>
        ) : page === "map-debug" ? (
          <section className="coverage-stage" aria-label="地图几何调试">
            <div className="coverage-summary">
              <div>
                <p className="kicker">SQLite map runtime</p>
                <h2>地图几何调试</h2>
                <p>只读检查通用 map_* 表里的 feature、geometry、control timeline 和 source 片段。</p>
              </div>
              <div className="age-index-metrics">
                <div>
                  <span>Feature</span>
                  <strong>{mapDebugData?.summary.features ?? 0}</strong>
                </div>
                <div>
                  <span>Control</span>
                  <strong>{mapDebugData?.summary.controlRecords ?? 0}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{mapDebugDataStatus === "ready" ? "ready" : mapDebugDataStatus}</strong>
                </div>
              </div>
            </div>

            {mapDebugDataStatus === "loading" ? (
              <div className="empty-state">正在读取地图几何调试数据...</div>
            ) : mapDebugDataStatus === "error" || !mapDebugData ? (
              <div className="empty-state">地图几何调试 API 暂时不可用。</div>
            ) : (
              <div className="coverage-grid">
                <article className="coverage-card">
                  <header>
                    <div>
                      <span>{mapDebugData.dataset.model}</span>
                      <h3>{mapDebugData.dataset.label}</h3>
                    </div>
                    <strong>{mapDebugData.dataset.review_status}</strong>
                  </header>
                  <div className="coverage-metrics">
                    <EvidenceField label="features" value={mapDebugData.summary.features} />
                    <EvidenceField label="geometries" value={mapDebugData.summary.geometries} />
                    <EvidenceField label="feature sources" value={mapDebugData.summary.sources} />
                    <EvidenceField label="controllers" value={mapDebugData.summary.controllers} />
                    <EvidenceField label="records" value={mapDebugData.summary.controlRecords} />
                    <EvidenceField label="record sources" value={mapDebugData.summary.controlSources} />
                  </div>
                  <div className="coverage-examples">
                    <span>Feature samples</span>
                    {mapDebugData.features.slice(0, 24).map((featureRow) => (
                      <button key={featureRow.id} type="button">
                        <strong>{featureRow.name}</strong>
                        <small>
                          {featureRow.feature_type} · {featureRow.admin_level ?? "n/a"} · {featureRow.point_count ?? 0} pts · {featureRow.source_count} sources
                        </small>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="coverage-card">
                  <header>
                    <div>
                      <span>{mapDebugData.controlDataset?.model ?? "no control dataset"}</span>
                      <h3>{mapDebugData.controlDataset?.label ?? "控制时间线"}</h3>
                    </div>
                    <strong>{mapDebugData.controllers.length} controllers</strong>
                  </header>
                  <div className="coverage-examples">
                    <span>Controllers</span>
                    {mapDebugData.controllers.map((controller) => (
                      <button key={controller.id} type="button" style={{ "--controller-color": controller.color } as React.CSSProperties}>
                        <strong>{controller.label}</strong>
                        <small>{controller.color}</small>
                      </button>
                    ))}
                  </div>
                  <div className="coverage-examples">
                    <span>Control record samples</span>
                    {mapDebugData.controlRecords.slice(0, 30).map((record) => (
                      <button key={record.id} type="button">
                        <strong>{record.feature_name ?? record.feature_id}</strong>
                        <small>
                          {record.start_year}-{record.end_year} · {record.controller} · {record.status} · {record.source_count} sources
                        </small>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="coverage-card">
                  <header>
                    <div>
                      <span>Sources</span>
                      <h3>几何来源样例</h3>
                    </div>
                    <strong>{mapDebugData.sourceSamples.length} samples</strong>
                  </header>
                  <div className="coverage-examples">
                    {mapDebugData.sourceSamples.map((source, index) => (
                      <button key={`${source.feature_id}-${source.source_role}-${index}`} type="button">
                        <strong>{source.feature_id}</strong>
                        <small>
                          {source.source_role} · {source.confidence} · {source.note ?? "no note"}
                        </small>
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            )}
          </section>
        ) : page === "coverage" ? (
          <section className="coverage-stage" aria-label={t.coverage.aria}>
            <div className="coverage-summary">
              <div>
                <p className="kicker">{t.coverage.kicker}</p>
                <h2>{t.coverage.title}</h2>
                <p>{t.coverage.summary}</p>
              </div>
              <div className="age-index-metrics">
                <div>
                  <span>{t.coverage.regions}</span>
                  <strong>{coverageData?.regions.length ?? 0}</strong>
                </div>
                <div>
                  <span>{t.coverage.gaps}</span>
                  <strong>{coverageTotals?.gaps ?? 0}</strong>
                </div>
                <div>
                  <span>{t.coverage.missingOriginal}</span>
                  <strong>{coverageTotals?.missingOriginal ?? 0}</strong>
                </div>
              </div>
            </div>

            {coverageDataStatus === "loading" ? (
              <div className="empty-state">{t.coverage.loading}</div>
            ) : coverageDataStatus === "error" || !coverageData ? (
              <div className="empty-state">{t.coverage.error}</div>
            ) : (
              <>
                <div className="coverage-filter-bar" role="group" aria-label={t.coverage.filterAria}>
                  {coverageGapFilters.map((filter) => (
                    <button
                      className={`event-filter-button ${coverageGapFilter === filter.id ? "selected" : ""}`}
                      key={filter.id}
                      type="button"
                      aria-pressed={coverageGapFilter === filter.id}
                      onClick={() => setCoverageGapFilter(filter.id)}
                    >
                      <span>{filter.label[locale]}</span>
                      <small>{coverageFilterCounts[filter.id]}</small>
                    </button>
                  ))}
                </div>

                <div className="coverage-stack">
                {visibleCoverageRegions.length ? visibleCoverageRegions.map((region) => {
                  const metrics = region.metrics;
                  const eventEvidencePercent = metrics.events ? Math.round((metrics.eventsWithEvidence / metrics.events) * 100) : 0;
                  const evidenceSourcePercent = metrics.evidenceDocuments ? Math.round((metrics.evidenceWithSource / metrics.evidenceDocuments) * 100) : 0;
                  const eventTargetPercent = Math.min(100, Math.round((metrics.events / region.minimums.events) * 100));
                  const entityTargetPercent = Math.min(100, Math.round((metrics.peopleEntities / region.minimums.entities) * 100));
                  const evidenceTargetPercent = Math.min(100, Math.round((metrics.evidenceDocuments / region.minimums.evidence) * 100));
                  const statusLabel = region.gaps.length ? t.coverage.statusNeedsWork : t.coverage.statusOk;

                  return (
                    <article className="coverage-card" key={region.id}>
                      <header>
                        <div>
                          <span>{region.expectedPeriodIds.join(" / ")}</span>
                          <h3>{region.label}</h3>
                        </div>
                        <strong className={region.gaps.length ? "coverage-status warn" : "coverage-status ok"}>
                          {statusLabel}
                        </strong>
                      </header>

                      <div className="coverage-card-body">
                        <div className="coverage-progress-panel" aria-label={`${region.label} ${t.coverage.progressAriaSuffix}`}>
                          <div className="coverage-progress-row">
                            <div>
                              <span>{t.coverage.eventCount}</span>
                              <strong>{metrics.events} / {region.minimums.events}</strong>
                            </div>
                            <i><b style={{ width: `${eventTargetPercent}%` }} /></i>
                          </div>
                          <div className="coverage-progress-row">
                            <div>
                              <span>{t.coverage.peopleEntities}</span>
                              <strong>{metrics.peopleEntities} / {region.minimums.entities}</strong>
                            </div>
                            <i><b style={{ width: `${entityTargetPercent}%` }} /></i>
                          </div>
                          <div className="coverage-progress-row">
                            <div>
                              <span>{t.coverage.evidenceCards}</span>
                              <strong>{metrics.evidenceDocuments} / {region.minimums.evidence}</strong>
                            </div>
                            <i><b style={{ width: `${evidenceTargetPercent}%` }} /></i>
                          </div>
                        </div>

                        <div className="coverage-check-panel">
                          <span>{t.coverage.evidenceIntegrity}</span>
                          <div className="coverage-metrics compact">
                            <EvidenceField label={t.coverage.eventEvidence} value={`${metrics.eventsWithEvidence}/${metrics.events} (${eventEvidencePercent}%)`} />
                            <EvidenceField label={t.coverage.sourceLocator} value={`${metrics.evidenceWithSource}/${metrics.evidenceDocuments} (${evidenceSourcePercent}%)`} />
                            <EvidenceField label={t.coverage.missingOriginal} value={metrics.evidenceMissingOriginal} />
                            <EvidenceField label={t.coverage.periodMismatch} value={metrics.periodMismatch} />
                            <EvidenceField label={t.coverage.peopleEntities} value={metrics.peopleWithEvidence} />
                            <EvidenceField label={t.coverage.participants} value={metrics.participantNames} />
                          </div>
                        </div>

                        <div className="coverage-gap-list">
                          <span>{t.coverage.currentGaps}</span>
                          {region.gaps.length ? (
                            region.gaps.map((gap) => <p key={`${region.id}-${gap}`}>{gap}</p>)
                          ) : (
                            <p>{t.coverage.noGaps}</p>
                          )}
                        </div>
                      </div>

                      <div className="coverage-examples">
                        <div>
                          <span>{t.coverage.noEventEvidence}</span>
                          {region.missingEvidenceEvents.length ? (
                            region.missingEvidenceEvents.map((event) => (
                              <button key={event.id} type="button" onClick={() => openEvidenceSearch(event.title, region.id)}>
                                {event.year ?? "?"} · {event.title}
                              </button>
                            ))
                          ) : (
                            <small>{t.coverage.none}</small>
                          )}
                        </div>
                        <div>
                          <span>{t.coverage.missingOriginalExamples}</span>
                          {region.missingOriginalExamples.length ? (
                            region.missingOriginalExamples.map((item) => (
                              <button key={item.id} type="button" onClick={() => openEvidenceSearch(item.title, region.id)}>
                                {item.year ?? "?"} · {item.title}
                              </button>
                            ))
                          ) : (
                            <small>{t.coverage.none}</small>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }) : (
                  <div className="empty-state">{t.coverage.noFilteredGaps}</div>
                )}
                </div>
              </>
            )}
          </section>
        ) : page === "evidence" ? (
          <section className="evidence-stage" aria-label={t.evidencePage.aria}>
            <div className="evidence-summary">
              <div>
                <p className="kicker">{t.evidencePage.kicker}</p>
                <h2>{evidenceSearchTerm ? `${t.evidencePage.searchTitle}: ${evidenceSearchTerm}` : t.evidencePage.title}</h2>
                <p>{t.evidencePage.summary}</p>
              </div>
              <div className="evidence-quick-searches" aria-label={locale === "zh" ? "常用检索" : "Quick searches"}>
                <button type="button" onClick={() => openEventEvidence(selectedEvent)}>
                  {t.evidencePage.currentEvent}: {getEventDisplayTitle(selectedEvent, locale).primary}
                </button>
                {selectedPersonIndexItem && (
                  <button type="button" onClick={() => openEvidenceSearch(selectedPersonIndexItem.name, selectedPersonIndexItem.region === "all" ? "all" : selectedPersonIndexItem.region)}>
                    {t.evidencePage.currentPerson}: {selectedPersonIndexItem.name}
                  </button>
                )}
                {["高平陵", "关羽斩颜良", "陆抗病重上疏", "赤壁", "沙普尔", "瓦勒良", "Paikuli"].map((term) => (
                  <button key={term} type="button" onClick={() => setQuery(term)}>
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <div className="person-filter-bar" role="group" aria-label={t.evidencePage.regionFilterAria}>
              {(["all", ...worldComparisonRegionOrder] as EvidenceRegionFilter[]).map((filter) => {
                const region = filter === "all" ? null : regions.find((item) => item.id === filter);
                return (
                  <button
                    className={`person-filter-button ${evidenceRegionFilter === filter ? "selected" : ""}`}
                    key={filter}
                    type="button"
                    aria-pressed={evidenceRegionFilter === filter}
                    onClick={() => setEvidenceRegionFilter(filter)}
                  >
                    <span>{region?.label ?? t.evidencePage.all}</span>
                    <small>{evidenceRegionCounts[filter] ?? 0}</small>
                  </button>
                );
              })}
            </div>

            <div className="evidence-results">
              {evidenceStatus === "idle" ? (
                <div className="empty-state">{t.evidencePage.idle}</div>
              ) : evidenceStatus === "loading" ? (
                <div className="empty-state">{t.evidencePage.loading}</div>
              ) : evidenceStatus === "error" ? (
                <div className="empty-state">{t.evidencePage.error}</div>
              ) : evidenceResults.length ? (
                evidenceResults.map((result) => {
                  const region = regions.find((item) => item.id === result.regionId);
                  const relatedPeople = [
                    ...(result.peopleCore ?? []),
                    ...(result.peopleMentioned ?? []),
                    ...result.entities
                      .filter((entity) => entity.entityType === "person")
                      .map((entity) => entity.label),
                  ];
                  return (
                    <article className="evidence-card" key={result.id}>
                      <div className="evidence-card-heading">
                        <div>
                          <span>{region?.label ?? result.regionId ?? "未分区"} · {result.timeStart ?? "年代未详"}</span>
                          <h3>{result.title}</h3>
                        </div>
                        <strong>{result.topicId ?? "source"}</strong>
                      </div>
                      <p>{result.snippet}</p>
                      <div className="evidence-card-standard">
                        <EvidenceField label="source_id" value={result.sourceId ?? "未绑定"} />
                        <EvidenceField label={t.evidencePage.source} value={[result.sourceTitle, result.locator].filter(Boolean).join(" · ")} />
                        <EvidenceField label={t.evidencePage.year} value={result.timeStart ?? (locale === "zh" ? "未定年" : "undated")} />
                        <EvidenceField label={t.evidencePage.people} value={<CompactEvidenceList values={[...new Set(relatedPeople)]} />} />
                        <EvidenceField label={t.evidencePage.event} value={result.eventLabel ?? result.macroEvent ?? result.subjectId} />
                        <EvidenceField label={t.evidencePage.places} value={<CompactEvidenceList values={result.places} />} />
                        <EvidenceField label={t.evidencePage.confidence} value={result.confidence ? getConfidenceLabel(result.confidence) : (locale === "zh" ? "未标注" : "unmarked")} />
                        <EvidenceField label={t.evidencePage.dispute} value={result.disputeNote ?? (locale === "zh" ? "未标注" : "unmarked")} />
                      </div>
                      {(result.quote || result.translation) && (
                        <details className="evidence-source-detail">
                          <summary>{t.evidencePage.originalTranslation}</summary>
                          {result.quote && <blockquote>{result.quote}</blockquote>}
                          {result.translation && <p>{result.translation}</p>}
                        </details>
                      )}
                      <div className="evidence-card-meta">
                        <span>{result.searchDocumentId}</span>
                        <span>{result.tokenEstimate} tokens</span>
                        <span>{result.reviewStatus}</span>
                        {result.subjectTable === "events" && events.some((event) => event.id === result.subjectId) && (
                          <button
                            className="evidence-meta-action"
                            type="button"
                            onClick={() => {
                              const event = events.find((item) => item.id === result.subjectId);
                              if (event) {
                                selectHistoricalEvent(event);
                              }
                            }}
                          >
                            {t.evidencePage.openEvent}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">{t.evidencePage.noResults}</div>
              )}
            </div>
          </section>
        ) : page === "compare" ? (
          <section className="event-compare-stage" aria-label="事件对比">
            <div className="event-compare-summary">
              <div>
                <p className="kicker">事件对比</p>
                <h2>{year} 年三方对照</h2>
                <p>只放中国、罗马与萨珊的同年锚点和邻近大事。打开中型事件时会补充更多细节，但不会把页面塞成完整年表。</p>
              </div>
              <div className="age-index-metrics">
                <div>
                  <span>同年事件</span>
                  <strong>{eventComparisonCount}</strong>
                </div>
                <div>
                  <span>当前年份</span>
                  <strong>{year}</strong>
                </div>
                <div>
                  <span>显示范围</span>
                  <strong>{showMediumEvents ? "中型" : "大型"}</strong>
                </div>
              </div>
            </div>

            <div className="event-compare-grid">
              {eventComparisonItems.map((item) => (
                <article
                  className="event-compare-column"
                  key={item.region.id}
                  style={{ "--accent": item.region.accent } as React.CSSProperties}
                >
                  <header>
                    <span>{item.region.label}</span>
                    <strong>{item.era.title}</strong>
                  </header>
                  <p className="event-compare-era">{item.era.summary}</p>

                  <div className="event-compare-list">
                    {item.exactEvents.length ? (
                      item.exactEvents.slice(0, 5).map((event) => (
                        <article className="event-compare-item" key={event.id}>
                          <button className="event-compare-main" type="button" onClick={() => selectHistoricalEvent(event)}>
                            <strong>{event.title}</strong>
                            <span>{formatYearRange(event)} · {eventImportanceLabels[getEventImportance(event)]} · {categoryLabels[event.category]}</span>
                            <small>{event.summary}</small>
                          </button>
                          <button className="event-card-link" type="button" onClick={() => openEventEvidence(event)}>
                            史料
                          </button>
                        </article>
                      ))
                    ) : item.hiddenMediumEvents.length ? (
                      <div className="event-compare-empty">
                        <strong>有中型事件</strong>
                        <span>打开“中型事件”查看 {item.hiddenMediumEvents.length} 条。</span>
                      </div>
                    ) : item.focusLifeEvents.length ? (
                      item.focusLifeEvents.map(({ inferred, lifeEvent, person }) => (
                        <div className="event-compare-empty" key={lifeEvent.id}>
                          <strong>{person.name}：{lifeEvent.title}</strong>
                          <span>{inferred ? "延续上一阶段：" : ""}{lifeEvent.summary}</span>
                        </div>
                      ))
                    ) : (
                      <div className="event-compare-empty">
                        <strong>无同年锚点</strong>
                        <span>可参考邻近年份事件。</span>
                      </div>
                    )}
                  </div>

                  {item.nearbyEvents.length > 0 && (
                    <footer>
                      <span>邻近年份</span>
                      {item.nearbyEvents.map((event) => (
                        <button key={event.id} type="button" onClick={() => selectHistoricalEvent(event)}>
                          {event.startYear} · {event.title}
                        </button>
                      ))}
                    </footer>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : page === "age" ? (
          <section className="age-comparison-stage" aria-label={t.agePage.aria}>
            <div className="age-comparison-summary">
              <div>
                <p className="kicker">{t.agePage.kicker}</p>
                <h2>{year} {t.agePage.titleSuffix}</h2>
                <p>{t.agePage.summary}</p>
              </div>
              <div className="age-index-metrics">
                <div>
                  <span>{t.agePage.currentResults}</span>
                  <strong>{ageComparisonItems.length}</strong>
                </div>
                <div>
                  <span>{t.agePage.alive}</span>
                  <strong>{ageComparisonItems.filter((item) => item.state.category === "alive").length}</strong>
                </div>
                <div>
                  <span>{t.agePage.currentYearEvents}</span>
                  <strong>{currentYearEvents.length}</strong>
                </div>
              </div>
            </div>

            <div className="person-filter-bar" role="group" aria-label={t.agePage.scopeAria}>
              {ageRegionFilters.map((filter) => (
                <button
                  className={`person-filter-button ${ageRegionFilter === filter.id ? "selected" : ""}`}
                  key={filter.id}
                  type="button"
                  aria-pressed={ageRegionFilter === filter.id}
                  onClick={() => setAgeRegionFilter(filter.id)}
                >
                  <span>{filter.label}</span>
                  <small>{ageRegionCounts[filter.id]}</small>
                </button>
              ))}
            </div>

            <div className="age-event-strip" aria-label={`${year} ${t.agePage.eventAriaSuffix}`}>
              {currentYearEvents.length ? (
                currentYearEvents.slice(0, 8).map((event) => (
                  <button
                    className="age-event-chip"
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setYear(event.startYear);
                      setSelectedId(event.id);
                    }}
                  >
                    <strong>{event.title}</strong>
                    <span>{event.startYear} {t.common.yearSuffix} · {regions.find((region) => region.id === event.region)?.label ?? event.region}</span>
                  </button>
                ))
              ) : (
                <span className="age-event-empty">{t.agePage.noEvents}</span>
              )}
            </div>

            <div className="age-card-grid">
              {ageComparisonItems.length ? (
                ageComparisonItems.map(({ person, state }) => (
                  <article className={`age-card age-card-${state.category}`} key={person.id}>
                    <div className="age-card-heading">
                      <div>
                        <strong>{person.name}</strong>
                        <span>{getAgeRegionLabel(person.region)} · {person.polity}</span>
                      </div>
                      <em>{state.label}</em>
                    </div>
                    <div className="age-card-years">
                      <span>{t.agePage.birthYear} {person.birthYear}</span>
                      <span>{person.deathYear ? `${t.agePage.deathYear} ${person.deathYear}` : t.agePage.unknownDeath}</span>
                    </div>
                    <p>{person.summary}</p>
                    <div className="age-card-tags">
                      {person.roles.slice(0, 3).map((role) => (
                        <span key={`${person.id}-${role}`}>{role}</span>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">{t.agePage.empty}</div>
              )}
            </div>
          </section>
        ) : page === "people" ? (
          <section className="person-index-stage" aria-label={t.peoplePage.aria}>
            <div className="person-index-summary">
              <div>
                <p className="kicker">{t.peoplePage.kicker}</p>
                <h2>{t.peoplePage.title}</h2>
              </div>
              <div className="person-index-metrics">
                <div>
                  <span>{t.peoplePage.currentResults}</span>
                  <strong>{visiblePersonIndex.length}</strong>
                </div>
                <div>
                  <span>{t.peoplePage.dataPeople}</span>
                  <strong>{personIndexItems.length}</strong>
                </div>
                <div>
                  <span>{t.peoplePage.crossRegionPeople}</span>
                  <strong>{personIndexItems.filter((person) => person.region !== "china").length}</strong>
                </div>
              </div>
            </div>

            <div className="person-filter-bar" role="group" aria-label={t.peoplePage.filterAria}>
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
                    <span className="person-index-polity">{getAgeRegionLabel(person.region)} · {person.primaryPolity}</span>
                    <span className="person-index-summary-text">{person.summary}</span>
                    <span className="person-index-card-stats">
                      <span>{person.source === "china-person-index" ? `${personLifeEventCounts.get(person.id) ?? 0} ${t.peoplePage.lifeEvents}` : t.peoplePage.calculableAge}</span>
                      <span>{person.source === "china-person-index" ? `${personRelationCounts.get(person.id) ?? 0} ${t.peoplePage.relations}` : getAgeRegionLabel(person.region)}</span>
                      <span>{personIndexEventCounts.get(person.id) ?? 0} {t.peoplePage.eventCount}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty-state">{t.peoplePage.empty}</div>
              )}
            </div>
          </section>
        ) : (
          <section className={`map-stage ${page === "world" ? "world-map-stage" : ""}`}>
          {page === "world" ? (
            <WorldMap
              activeRegion={selectedRegion}
              hoveredRegion={hoveredRegion}
              onHover={setHoveredRegion}
              onSelect={previewRegion}
              onEnter={selectRegion}
              onClearSummary={() => setSummaryRegion(null)}
              year={year}
            />
          ) : page === "rome" ? (
            runtimeRomanControlDb.provinces.length ? (
              <RomanRegionMap
                activeProvinceId={selectedRomanProvinceId}
                data={runtimeRomanControlDb}
                onClearSummary={() => {
                  setHoveredRegion(null);
                  setSelectedRomanProvinceId(null);
                }}
                onSelectProvince={setSelectedRomanProvinceId}
                year={year}
              />
            ) : (
              <div className="empty-state">
                {romanControlDbStatus === "loading" ? "Loading Roman province map" : "Roman control API is not available"}
              </div>
            )
          ) : (
            chinaBlocks.length ? (
              <ChinaRegionMap
                activeBlockId={selectedChinaBlockId}
                blocks={chinaBlocks}
                cities={runtimeChinaMap.cities}
                controllerColorMap={chinaControllerColorMap}
                controlTimeline={chinaControlTimeline}
                hoveredBlockId={hoveredChinaBlockId}
                mapMode={chinaMapMode}
                onSelectBlock={setSelectedChinaBlockId}
                onHoverBlock={setHoveredChinaBlockId}
                onClearSummary={() => {
                  setSelectedChinaBlockId(null);
                  setHoveredChinaBlockId(null);
                }}
                physical={runtimeNaturalEarthChinaPhysical}
                year={year}
              />
            ) : (
              <div className="empty-state">
                {chinaControlDbStatus === "loading" ? "Loading China commandery map" : "China control API is not available"}
              </div>
            )
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
                  showMediumEvents,
                )}
              </p>
              <div className="summary-meta">
                <span>{inspectedEra.title}</span>
                <strong>{inspectedRegionMetaLabel}</strong>
              </div>
            </aside>
          )}

          {page === "china" && (chinaMapMode === "political" || chinaMapMode === "commandery") && inspectedChinaBlock && false && (
            <aside
              className="hover-summary regional-summary"
              style={
                {
                  "--accent": getChinaControllerColor(chinaControllerColorMap, inspectedChinaControl?.controller),
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
              <h2>{inspectedChinaBlock!.name}</h2>
              <p>
                {inspectedChinaControl?.controller ?? "待补"} · {formatChinaControlRange(inspectedChinaControl)}
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
          <section className="world-comparison" aria-label={`${year} 年中国、罗马与萨珊同年对照`}>
            <div className="world-comparison-heading">
              <div>
                <p className="kicker">同年对照</p>
                <h2>{year} 年的三方局势</h2>
              </div>
              <div className="comparison-controls">
                <span>时间条只标大型事件；空档优先显示主角动向。</span>
                <button
                  className={`medium-toggle ${showMediumEvents ? "active" : ""}`}
                  type="button"
                  aria-pressed={showMediumEvents}
                  onClick={() => setShowMediumEvents((current) => !current)}
                >
                  中型事件
                  <strong>{showMediumEvents ? "开" : "关"}</strong>
                </button>
              </div>
            </div>

            <div className="comparison-grid">
              {worldComparisonItems.map((item) => {
                const isSelected = item.region.id === selectedRegion;
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
                      <strong>
                        {item.yearEvents.length
                          ? `${item.yearEvents.length} 件本年事件`
                          : item.hiddenMediumEvents.length
                            ? `${item.hiddenMediumEvents.length} 件中型事件`
                            : item.focusLifeEvents.length
                              ? "曹孙刘动向"
                              : "时代背景"}
                      </strong>
                    </div>
                    <div className="comparison-era">
                      <small>{item.era.title}</small>
                      <p>{item.era.summary}</p>
                    </div>
                    <div className={`comparison-event ${item.yearEvents.length ? "" : "empty"}`}>
                      <span>
                        {item.yearEvents.length
                          ? "本年事件"
                          : item.hiddenMediumEvents.length
                            ? "中型事件"
                            : item.focusLifeEvents.length
                              ? "曹孙刘动向"
                              : "时代背景"}
                      </span>
                      {item.yearEvents.length ? (
                        <div className="comparison-event-list">
                          {item.yearEvents.slice(0, 3).map((event) => (
                            <div className="comparison-event-item" key={event.id}>
                              <strong>{event.title}</strong>
                              <small>
                                {formatYearRange(event)} · {eventImportanceLabels[getEventImportance(event)]} · {categoryLabels[event.category]}
                              </small>
                            </div>
                          ))}
                          {item.yearEvents.length > 3 && <small>另有 {item.yearEvents.length - 3} 件</small>}
                        </div>
                      ) : item.hiddenMediumEvents.length ? (
                        <>
                          <strong>有中型事件可显示</strong>
                          <small>打开“中型事件”开关查看；时间条仍只标大型事件。</small>
                        </>
                      ) : item.focusLifeEvents.length ? (
                        <div className="comparison-event-list">
                          {item.focusLifeEvents.map(({ inferred, lifeEvent, person }) => (
                            <div className="comparison-event-item focus-note" key={lifeEvent.id}>
                              <strong>
                                {person.name}：{lifeEvent.title}
                              </strong>
                              <small>
                                {inferred ? "延续上一阶段：" : ""}
                                {lifeEvent.summary}
                              </small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <strong>{item.era.title}</strong>
                          <small>{item.era.summary}</small>
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

        {page !== "home" && page !== "people" && page !== "evidence" && (
          <section className="timeline-dock" aria-label="时间轴">
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
            <div className="timeline-track">
              {page === "world" && (
                <div className="timeline-marker-layer" aria-hidden="true">
                  {timelineMarkers.map((marker) => {
                    const regionIndex = Math.max(0, worldComparisonRegionOrder.indexOf(marker.region.id));
                    const offset = ((marker.year - yearMin) / (yearMax - yearMin)) * 100;

                    return (
                      <span
                        className="timeline-marker"
                        key={`${marker.region.id}-${marker.year}`}
                        style={
                          {
                            "--marker-color": marker.region.accent,
                            "--marker-row": regionIndex,
                            left: `${offset}%`,
                          } as React.CSSProperties
                        }
                        title={`${marker.year} 年 · ${marker.region.label} · ${marker.titles.slice(0, 2).join("、")}${
                          marker.eventCount > 2 ? `?${marker.eventCount} 件` : ""
                        }`}
                      />
                    );
                  })}
                </div>
              )}
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
            </div>
            <div className="range-labels">
              <span>190</span>
              <span>220</span>
              <span>260</span>
              <span>310</span>
            </div>
            {page === "world" && (
              <div className="timeline-region-legend" aria-label="区域颜色">
                {worldComparisonItems.map((item) => (
                  <span key={item.region.id} style={{ "--accent": item.region.accent } as React.CSSProperties}>
                    <i aria-hidden="true" />
                    {item.region.label}
                  </span>
                ))}
              </div>
            )}
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

      {page !== "home" && page !== "evidence" && page !== "compare" && (
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
                      {selectedPerson.courtesyName ? ` · ${selectedPerson.courtesyName}` : ""}
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
                <div className="person-annual-panel">
                  <div className="person-event-heading">
                    <CalendarDays size={16} aria-hidden="true" />
                    <span>逐年年表</span>
                    <strong>{selectedPersonAnnualTimeline.length}</strong>
                  </div>
                  <div className="person-annual-timeline">
                    {selectedPersonAnnualTimeline.length ? (
                      selectedPersonAnnualTimeline.map((item) => (
                        <div
                          className={`person-annual-row ${item.activities.length ? "recorded" : item.inferredFrom ? "inferred" : "unknown"}`}
                          key={`${selectedPerson.id}-${item.year}`}
                        >
                          <span>{item.year}</span>
                          <div>
                            {item.activities.length ? (
                              item.activities.map((lifeEvent) => (
                                <p key={lifeEvent.id}>
                                  <strong>{lifeEvent.title}</strong>
                                  {lifeEvent.summary}
                                </p>
                              ))
                            ) : item.inferredFrom ? (
                              <p>
                                <strong>延续：{item.inferredFrom.title}</strong>
                                {item.inferredFrom.summary}
                              </p>
                            ) : (
                              <p>
                                <strong>史料未详</strong>
                                当前资料库尚未整理这一年的明确事迹?
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>待补充逐年年表</p>
                    )}
                  </div>
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

                <PersonSourceMentionPanel mentions={selectedPersonSourceMentions} />

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
                  <span>关联大事</span>
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

        {page !== "people" && page === "china" && (chinaMapMode === "political" || chinaMapMode === "commandery") && (
          <section className="event-list">
            <h3>控制区块</h3>
            <div className="chips block-chip-list">
              {chinaBlockSnapshots.map(({ block, control }) => (
                <button
                  className={`chip-button block-chip ${selectedChinaBlockId === block.id ? "selected" : ""}`}
                  key={block.id}
                  type="button"
                  style={{ "--controller-color": getChinaControllerColor(chinaControllerColorMap, control?.controller) } as React.CSSProperties}
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
            {detailRegionId === "china" ? (
              <span>
                {selectedRegionDisplayCountLabel}
              </span>
            ) : (
              <span>{detailRegionEventCountLabel}</span>
            )}
          </div>
          {detailRegionId === "china" && (
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
          {detailRegionId === "rome" && selectedRomanProvince && (
            <div className="event-filter-note">
              <span>{t.roman.provinceFilter}</span>
              <strong>{selectedRomanProvince.n}</strong>
              <button type="button" onClick={() => setSelectedRomanProvinceId(null)}>
                {t.roman.showAllEvents}
              </button>
            </div>
          )}
          <div className="event-stack">
            {filteredRegionEvents.length ? (
              filteredRegionEvents.map((event) => {
                const eventTitle = getEventDisplayTitle(event, locale);

                return (
                  <button
                    className={`event-card ${event.id === selectedEvent.id ? "selected" : ""}`}
                    key={event.id}
                    type="button"
                    onClick={() => selectHistoricalEvent(event)}
                  >
                    <span className="event-year">{formatYearRange(event)}</span>
                    <strong>{eventTitle.primary}</strong>
                    {eventTitle.secondary && <small>{eventTitle.secondary}</small>}
                    <span>{event.summary}</span>
                  </button>
                );
              })
            ) : selectedRegionHiddenMediumEvents.length ? (
              <div className="empty-state event-stack-note">
                {selectedRegionHiddenMediumEvents.length} 个中型事件已折叠，打开中型事件开关后显示?
              </div>
            ) : selectedRegionFocusLifeEvents.length ? (
              <div className="comparison-event-list event-stack-focus">
                {selectedRegionFocusLifeEvents.map(({ inferred, lifeEvent, person }) => (
                  <article className="comparison-event-item focus-note" key={lifeEvent.id}>
                    <strong>
                      {person.name}：{lifeEvent.title}
                    </strong>
                    <small>
                      {inferred ? "延续上一阶段：" : ""}
                      {lifeEvent.summary}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state event-stack-note">
                {selectedRegionEra.title}：{selectedRegionEra.summary}
              </div>
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

        {page !== "people" && filteredRegionEvents.length > 0 && (
          <section className="event-detail">
          <div className="detail-eyebrow">
            <CircleDot size={18} aria-hidden="true" />
            <span>{categoryLabels[selectedEvent.category]}</span>
          </div>
          <h2>{selectedEventTitle.primary}</h2>
          {selectedEventTitle.secondary && <p className="detail-subtitle">{selectedEventTitle.secondary}</p>}
          <p className="detail-summary">{selectedEvent.summary}</p>

          <div className="facts">
            <div>
              <span>时间</span>
              <strong>{formatYearRange(selectedEvent)}</strong>
            </div>
            <div>
              <span>地点</span>
              <strong>{selectedEvent.locationName || "待补"}</strong>
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
                      {selectedPerson.courtesyName ? ` · ${selectedPerson.courtesyName}` : ""}
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

                <PersonSourceMentionPanel mentions={selectedPersonSourceMentions} />

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
                  <span>关联大事</span>
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
              政权与标?
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
                    <strong>{getEventDisplayTitle(event, locale).primary}</strong>
                    {getEventDisplayTitle(event, locale).secondary && <small>{getEventDisplayTitle(event, locale).secondary}</small>}
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

        {page !== "people" && filteredRegionEvents.length === 0 && (
          <section className="event-detail empty-event-detail">
            <div className="detail-eyebrow">
              <CircleDot size={18} aria-hidden="true" />
              <span>
                {selectedRegionFocusLifeEvents.length
                  ? "曹孙刘动向"
                  : selectedRegionHiddenMediumEvents.length
                    ? "中型事件"
                    : "时代背景"}
              </span>
            </div>
            <h2>
              {selectedRegionFocusLifeEvents.length
                ? `${year} 年曹孙刘动向`
                : selectedRegionHiddenMediumEvents.length
                  ? `${year} 年中型事件已折叠`
                  : `${year} 年 ${selectedRegionEra.title}`}
            </h2>
            {selectedRegionFocusLifeEvents.length ? (
              <div className="comparison-event-list detail-focus-list">
                {selectedRegionFocusLifeEvents.map(({ inferred, lifeEvent, person }) => (
                  <article className="comparison-event-item focus-note" key={lifeEvent.id}>
                    <strong>
                      {person.name}：{lifeEvent.title}
                    </strong>
                    <small>
                      {inferred ? "延续上一阶段：" : ""}
                      {lifeEvent.summary}
                    </small>
                  </article>
                ))}
              </div>
            ) : selectedRegionHiddenMediumEvents.length ? (
              <p className="detail-summary">
                {selectedRegionHiddenMediumEvents.length} 个中型事件暂未展开，打开中型事件开关后在本年对照中显示?
              </p>
            ) : (
              <p className="detail-summary">{selectedRegionEra.summary}</p>
            )}
          </section>
        )}
      </aside>
      )}
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
