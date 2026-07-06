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
  Globe2,
  Grid3x3,
  Info,
  Layers,
  Link2,
  MapPinned,
  Menu,
  Mountain,
  Network,
  Plus,
  Search,
  UserRound,
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
type EventCompareType = "military" | "domestic" | "diplomacy";
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
  overview?: string;
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
  region?: string;
  name: string;
  en?: string;
  aliases?: string[];
  courtesyName: string | null;
  life: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
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
    | "birth"
    | "accession"
    | "abdication"
    | "campaign"
    | "crisis"
    | "death"
    | "deposition"
    | "diplomacy"
    | "later-tradition"
    | "office"
    | "politics"
    | "reform"
    | "religion"
    | "reign"
    | "service"
    | "strategy"
    | "turning-point"
    | "war";
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
  relatedEventIds?: string[];
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

type Page = "home" | "learning" | "world" | "china" | "rome" | "people" | "age" | "evidence" | "evidence-graph" | "compare" | "coverage" | "map-debug" | "rag-eval" | "ai-debug" | "ai-history";
type TopbarMenu = "people" | "sources" | "events" | "ai" | "tools";
type ChinaMapMode = "political" | "terrain" | "three-d" | "commandery";
type ThreeKingdomsFilter = "all" | "cao-wei" | "shu-han" | "sun-wu" | "late-han" | "war" | "politics";
type PersonIndexFilter = "all" | "cao-wei" | "shu-han" | "sun-wu" | "late-han" | "rome" | "sasanian-persia";
type AgeRegionFilter = "all" | "china" | "rome" | "sasanian-persia" | "india";

type EvidenceRegionFilter = "all" | Region;

type AgePerson = {
  id: string;
  name: string;
  aliases?: string[];
  region: AgeRegionFilter;
  polity: string;
  roles: string[];
  birthYear: number;
  birthYearRange?: {
    min: number;
    max: number;
  };
  deathYear?: number | null;
  summary: string;
  source: "person-index" | "age-supplement";
  agePrecision: "exact" | "estimated";
  ageNote?: string;
};

type PersonIndexItem = {
  id: string;
  name: string;
  aliases?: string[];
  courtesyName: string | null;
  life: string | null;
  primaryPolity: string;
  roles: string[];
  summary: string;
  source: "person-index" | "age-supplement";
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

type EvidenceGraphEvent = {
  schemaVersion: number;
  purpose: "frontend-evidence-graph-event" | "frontend-evidence-graph-person";
  event?: {
    id: string;
    title: string;
    display_time: string | null;
    region_id: Region | string;
    time_start: number | null;
    time_end: number | null;
    summary: string | null;
    confidence: string;
    review_status: string;
  };
  person?: {
    id: string;
    entity_type: string;
    label: string;
    region_id: Region | string | null;
    time_start: number | null;
    time_end: number | null;
    summary: string | null;
    confidence: string;
    review_status: string;
  };
  events?: Array<{
    id: string;
    title: string;
    display_time: string | null;
    region_id: Region | string;
    time_start: number | null;
    time_end: number | null;
    summary: string | null;
  }>;
  claims: Array<{
    id: string;
    claimType: string;
    statement: string;
    statementZh: string;
    statementEn: string | null;
    timeStart: number | null;
    timeEnd: number | null;
    regionId: string | null;
    periodId: string | null;
    confidence: string;
    reviewStatus: string;
    disputeStatus: string;
  }>;
  sources: Array<{
    claimId: string;
    sourceId: string | null;
    sourceTitle: string | null;
    citationShort: string | null;
    url: string | null;
    mentionId: string | null;
    passageId: string | null;
    locator: string | null;
    quote: string | null;
    translation: string | null;
    sourceRole: string;
    confidence: string;
  }>;
  subjects: Array<{
    claimId: string;
    subjectTable: string;
    subjectId: string;
    subjectRole: string;
    sortOrder: number;
    entityType: string | null;
    label: string;
    regionId: string | null;
  }>;
  summary: {
    claims: number;
    sources: number;
    linkedSubjects: number;
    linkedEvents?: number;
    reviewedClaims: number;
  };
};

type AiRetrieveItem = {
  rank: number;
  subjectTable?: string | null;
  subjectId?: string | null;
  searchDocumentId?: string | null;
  chunkId?: string | null;
  sourceId?: string | null;
  sourceTitle?: string | null;
  citationShort?: string | null;
  locator?: string | null;
  quote?: string | null;
  translation?: string | null;
  evidenceRole?: string | null;
  confidence?: "high" | "medium" | "low" | null;
  regionId?: string | null;
  timeStart?: number | null;
  timeEnd?: number | null;
  title?: string | null;
  snippet?: string | null;
  score?: number | null;
  reason?: string | null;
};

type AiRetrieveResult = {
  schemaVersion: number;
  purpose: "ai-retrieve";
  runId: string;
  question: string;
  locale: Locale;
  context: {
    eventId: string | null;
    personId: string | null;
    entityId: string | null;
    region: string | null;
    year: number | null;
    sourceId: string | null;
  };
  queryPlan: {
    strategy: string;
    steps: string[];
  };
  items: AiRetrieveItem[];
  warnings: string[];
};

type AiEvidenceAnswerResult = {
  schemaVersion: number;
  purpose: "ai-evidence-answer";
  answerId?: string;
  runId: string;
  provider: string | null;
  model: string | null;
  answer: string;
  citations: Array<{
    ref: string;
    rank: number;
    sourceId: string | null;
    sourceTitle: string | null;
    locator: string | null;
    subjectTable: string | null;
    subjectId: string | null;
    quote: string | null;
    translation: string | null;
    confidence: string | null;
  }>;
  warnings: string[];
  retrieval: AiRetrieveResult;
  qualityChecks?: {
    passed: boolean;
    grade?: "green" | "yellow" | "red";
    status?: "pass" | "review" | "fail";
    score?: number;
    citedRefs: string[];
    internalEvidenceCitationCount: number;
    missingCitationRefs: string[];
    unusedEvidenceRefs: string[];
    uncitedClaimSamples: string[];
    backgroundKnowledgeMentioned: boolean;
    externalWebSourceCount: number;
    warnings: string[];
  };
};

type AiAnswerHistoryItem = {
  id: string;
  runId: string;
  createdAt: string;
  question: string;
  locale: Locale;
  context: AiRetrieveResult["context"];
  queryPlan: AiRetrieveResult["queryPlan"] | Record<string, unknown>;
  answer: string;
  citations: AiEvidenceAnswerResult["citations"];
  citationCount: number;
  confidence: string | null;
  warnings: string[];
  provider: string | null;
  model: string | null;
  qualityChecks: AiEvidenceAnswerResult["qualityChecks"] | null;
};

type AiAnswerHistoryResult = {
  answers: AiAnswerHistoryItem[];
  total: number;
  limit: number;
  offset: number;
};

type RagEvalRunSummary = {
  id: string;
  createdAt: string;
  provider: string | null;
  model: string | null;
  retrievalStrategy: string;
  questionSetId: string;
  resultCount: number;
  averageScore: number | null;
  failureCount: number;
};

type RagEvalRunDetail = {
  run: {
    id: string;
    createdAt: string;
    provider: string | null;
    model: string | null;
    retrievalStrategy: string;
    questionSetId: string;
  };
  summary: {
    results: number;
    averageScore: number | null;
    failures: number;
  };
  results: Array<{
    questionId: string;
    questionZh: string;
    questionEn: string | null;
    questionType: string;
    regionId: string | null;
    periodId: string | null;
    expectedSubjectTable: string | null;
    expectedSubjectId: string | null;
    retrievalRunId: string | null;
    scoreTotal: number;
    scoreRetrieval: number;
    scoreCitation: number;
    scoreFactuality: number;
    scoreCoverage: number;
    scoreNoHallucination: number;
    failureType: string | null;
    judgeNote: string | null;
    raw: {
      expectedClaims?: string[];
      expectedSources?: string[];
      retrievedSources?: string[];
      retrievedSubjects?: string[];
      queryPlan?: { strategy?: string; steps?: string[] };
    };
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

type OverviewRegionTimelineEra = {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  color: string;
  status?: PeriodStatus;
  summary?: string;
  detailPeriodId?: string;
  detailEntryYear?: number;
  formalStartYear?: number;
  formalEndYear?: number;
  sourceStartYear?: number;
  keyCause?: string;
  keyClimax?: string;
  keyResult?: string;
  sources?: string[];
};

type OverviewRegionTimeline = {
  id: string;
  label: string;
  color: string;
  eras: OverviewRegionTimelineEra[];
};

type OverviewGlobalAnchor = {
  id: string;
  title: string;
  year: number;
  regionId?: string;
  importance?: "major" | "context";
};

type OverviewMapRegion = OverviewFocusRegion & {
  color: string;
  status?: PeriodStatus;
  timelineId: string;
};

type DetailPeriodContext = {
  title: string;
  summary: string;
  startYear: number;
  endYear: number;
  timelineId: string;
  regionId: Region;
  regionLabel: string;
  color: string;
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
  regionTimelines?: OverviewRegionTimeline[];
  globalAnchors?: OverviewGlobalAnchor[];
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

type CoverageTemplateAudit = {
  purpose: "period-template-audit-190-310";
  pass: boolean;
  metrics: {
    events: Record<string, number>;
    people: Record<string, number>;
    eventEvidenceLinks: Record<string, number>;
    evidenceClaims: Record<string, number>;
    ragQuestions: number;
    latestRagRun: {
      id: string | null;
      created_at: string | null;
      total_questions: number;
      passed_questions: number;
      failed_questions: number;
      average_score: number | null;
    } | null;
    mapControlRecords: number;
  };
  thresholds: Record<string, unknown>;
  checks: Array<{
    id: string;
    label: string;
    actual: number;
    threshold: number;
    pass: boolean;
  }>;
};

type FrontendCoverageDb = {
  schemaVersion: number;
  purpose: "frontend-coverage-190-310" | "frontend-coverage-310-589";
  range: [number, number];
  generatedAt: string;
  templateAudit?: CoverageTemplateAudit;
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
  displayFeatures?: Array<{
    id: string;
    name: string;
    featureType: string;
    confidence: string;
    approximate: number;
    center: [number, number] | null;
    bounds: [number, number, number, number] | null;
    geometryType: string | null;
    coordinates: number[][][] | null;
    activeControl: {
      controller_id: string;
      controller: string;
      color: string;
      start_year: number;
      end_year: number;
      confidence: string;
    } | null;
  }>;
  selectedYear?: number | null;
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
  { id: "political", label: "郡界", Icon: Grid3x3 },
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

const defaultDetailYearMin = 190;
const defaultDetailYearMax = 310;
const worldComparisonRegionOrder: Region[] = ["china", "rome", "sasanian-persia"];
const chinaFocusPersonIds = ["cao-cao", "sun-quan", "liu-bei"];
let overviewYearMin = -900;
let overviewYearMax = 1912;
let overviewPeriods: OverviewPeriod[] = [];
let overviewRegionTimelines: OverviewRegionTimeline[] = [];
let overviewGlobalAnchors: OverviewGlobalAnchor[] = [];
let overviewRegionCoordinates: Record<string, LonLat> = {};
let overviewPeriodRegionCoordinates: Record<string, Record<string, LonLat>> = {};
let overviewRegionZoneSizes: Record<string, { width: number; height: number; rotate?: number }> = {};

const emptyOverviewPeriod: OverviewPeriod = {
  id: "runtime-loading",
  title: "Overview loading",
  startYear: -900,
  endYear: 1912,
  color: "#6f766d",
  status: "background",
  focusRegions: [],
  context: [],
  snapshotYears: [-900],
  summary: "Overview period data is loading from the API.",
};
const ageRegionFilters: Array<{ id: AgeRegionFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "china", label: "中国" },
  { id: "rome", label: "罗马" },
  { id: "sasanian-persia", label: "萨珊" },
];

const ageSupplementPeople: AgePerson[] = [];

const eventImportanceLabels: Record<EventImportance, string> = {
  major: "大型事件",
  medium: "中型事件",
  minor: "小型事件",
  detail: "细节事件",
};

const eventCompareTypes: Array<{
  id: EventCompareType;
  label: string;
  hint: string;
}> = [
  { id: "military", label: "军事", hint: "战役、围攻、征伐、军事失败" },
  { id: "domestic", label: "内政", hint: "继承、禅让、政变、政策与统治调整" },
  { id: "diplomacy", label: "外交", hint: "跨政权谈判、联盟、边境冲突与和约" },
];

const coverageGapFilters: Array<{ id: CoverageGapFilter; label: Record<Locale, string> }> = [
  { id: "all", label: { zh: "全部", en: "All" } },
  { id: "below-target", label: { zh: "未达标", en: "Below target" } },
  { id: "missing-event-evidence", label: { zh: "缺事件证据", en: "Missing event evidence" } },
  { id: "missing-original", label: { zh: "缺原文", en: "Missing originals" } },
  { id: "period-mismatch", label: { zh: "时期错位", en: "Period mismatch" } },
];

type CoveragePeriodId = "190-310" | "310-589";

const coveragePeriods: Array<{ id: CoveragePeriodId; endpoint: string; label: Record<Locale, string> }> = [
  { id: "190-310", endpoint: "/api/frontend-coverage-190-310", label: { zh: "190-310 三国/罗马/萨珊", en: "190-310 China/Rome/Sasanian" } },
  { id: "310-589", endpoint: "/api/frontend-coverage-310-589", label: { zh: "310-589 魏晋南北朝", en: "310-589 Wei-Jin-Northern-Southern" } },
];

const uiText: Record<Locale, {
  nav: Partial<Record<"home" | "learning" | "people" | "age" | "evidence" | "evidenceGraph" | "compare" | "coverage" | "mapDebug" | "ragEval" | "aiDebug" | "aiHistory", string>>;
  pageTitle: Partial<Record<Page, string>>;
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
    selectedPeople: string;
    addPerson: string;
    removePerson: string;
    openProfile: string;
    openEvidence: string;
    openGraph: string;
    compareHint: string;
    livingPool: string;
    poolHint: string;
    lifeAtYear: string;
    recentLife: string;
    noLifeContext: string;
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
      learning: "学习模式",
      people: "人物索引",
      age: "年龄对比",
      evidence: "史料证据",
      evidenceGraph: "证据图谱",
      compare: "事件对比",
      coverage: "覆盖度",
      mapDebug: "地图调试",
      ragEval: "RAG 评测",
    },
    pageTitle: {
      home: "世界历史总览：前 900 至 1912",
      learning: "190-310 学习模式",
      world: "中国、罗马与萨珊同年对照",
      china: "中国",
      rome: "罗马省份控制 190-310 CE",
      people: "人物索引：跨区域人物与生年",
      age: "年龄对比：同年人物年龄",
      evidence: "史料证据：原文、译文与出处",
      "evidence-graph": "证据图谱：事件、断言与出处",
      compare: "事件对比：中国、罗马与萨珊",
      coverage: "覆盖度检查",
      "map-debug": "地图调试",
      "rag-eval": "RAG 评测",
    },
    search: {
      people: "搜索人物、字、势力",
      evidence: "搜索原文、人物、事件、出处",
      default: "搜索人物、政权、事件",
    },
    coverage: {
      aria: "覆盖度检查",
      kicker: "范例质量检查",
      title: "时期覆盖度",
      summary: "按时期和区域检查事件、人物、证据和原文缺口。这个页面只做范例质量判断，不替代正文地图和史料证据页。",
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
      selectedPeople: "已选对比",
      addPerson: "加入对比",
      removePerson: "移除对比",
      openProfile: "人物档案",
      openEvidence: "查史料",
      openGraph: "证据图谱",
      compareHint: "先从搜索结果加入人物；已选人物会固定在上方，方便跨年份对照。",
      livingPool: "在世人物池",
      poolHint: "只显示当前年份仍在世的人物；可用搜索框按姓名、字、势力继续缩小范围。",
      lifeAtYear: "本年节点",
      recentLife: "此前节点",
      noLifeContext: "此年附近暂无已整理生平节点，可打开人物档案继续查看。",
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
      learning: "Learn",
      people: "People",
      age: "Age",
      evidence: "Evidence",
      evidenceGraph: "Evidence Graph",
      compare: "Compare",
      coverage: "Coverage",
      mapDebug: "Map Debug",
      ragEval: "RAG Eval",
      aiHistory: "AI History",
    },
    pageTitle: {
      home: "World History Overview: 900 BCE to 1912",
      learning: "190-310 Learning Mode",
      world: "China, Rome, and Sasanian Persia by Year",
      china: "China",
      rome: "Roman Provincial Control, 190-310 CE",
      people: "People Index: Cross-Regional Lives",
      age: "Age Comparison: People in the Same Year",
      evidence: "Historical Evidence: Texts, Translations, Sources",
      "evidence-graph": "Evidence Graph: Events, Claims, Sources",
      compare: "Event Comparison: China, Rome, and Sasanian Persia",
      coverage: "Coverage Audit",
      "map-debug": "Map Debug",
      "rag-eval": "RAG Evaluation",
      "ai-history": "AI Answer History",
    },
    search: {
      people: "Search people, names, factions",
      evidence: "Search texts, people, events, sources",
      default: "Search people, polities, events",
    },
    coverage: {
      aria: "coverage audit",
      kicker: "Sample Quality Audit",
      title: "Period Coverage",
      summary: "Audit events, people, evidence cards, and missing original passages by period and region. This is a quality-control page for model periods.",
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
      selectedPeople: "Selected",
      addPerson: "Add",
      removePerson: "Remove",
      openProfile: "Profile",
      openEvidence: "Sources",
      openGraph: "Graph",
      compareHint: "Add people from the results; selected people stay pinned above for year-by-year comparison.",
      livingPool: "Living Pool",
      poolHint: "Only people alive in the selected year are shown. Use search to narrow by name, courtesy name, or polity.",
      lifeAtYear: "This year",
      recentLife: "Recent node",
      noLifeContext: "No life node is available around this year; open the profile for more context.",
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

function getOverviewRegionTimeline(timelineId: string) {
  return (
    overviewRegionTimelines.find((timeline) => timeline.id === timelineId) ??
    overviewRegionTimelines.find((timeline) => timeline.id === "china") ??
    null
  );
}

function getOverviewTimelineEra(timeline: OverviewRegionTimeline | null, year: number) {
  if (!timeline) {
    return null;
  }

  return (
    timeline.eras
      .filter((era) => era.startYear <= year && era.endYear >= year)
      .sort((left, right) => right.startYear - left.startYear)[0] ?? null
  );
}

function getPeriodMidpoint(period: OverviewPeriod) {
  return Math.round((Math.max(period.startYear, overviewYearMin) + Math.min(period.endYear, overviewYearMax)) / 2);
}

function getOverviewEraMidpoint(era: OverviewRegionTimelineEra) {
  return Math.round((Math.max(era.startYear, overviewYearMin) + Math.min(era.endYear, overviewYearMax)) / 2);
}

function getDetailRegionIdFromTimeline(timelineId: string): Region {
  if (timelineId === "rome") {
    return "rome";
  }

  if (timelineId === "central-asia") {
    return "sasanian-persia";
  }

  return "china";
}

function getOverviewTimelineIdFromDetailRegion(region: Region) {
  if (region === "rome") {
    return "rome";
  }

  if (region === "sasanian-persia") {
    return "central-asia";
  }

  return "china";
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
    "--period-color": "color" in region ? (region as OverviewMapRegion).color : period.color,
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

  return years;
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

function isConcreteComparableEvent(event: HistoricalEvent) {
  const text = [
    event.id,
    event.title,
    event.titleZh,
    event.eventLabel,
    event.macroEvent,
    event.summary,
    ...(event.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const overviewTerms = [
    "overview",
    "transition",
    "system",
    "phase",
    "crisis overview",
    "long-term",
    "metropolis",
    "trade empire",
    "dynasty of",
    "career of",
    "building program",
    "coinage reform",
    "military reforms",
    "mobile cavalry",
    "darkest hour",
    "the gallic empire",
    "establishment of the tetrarchy",
    "military monarchy",
    "长期",
    "概览",
    "总体",
    "体系",
    "制度化",
    "转型",
    "阶段",
    "生涯",
    "改革",
    "贸易帝国",
  ];

  if (overviewTerms.some((term) => text.includes(term))) {
    return false;
  }

  if (event.category === "society" || event.category === "economy" || event.category === "culture") {
    return false;
  }

  return (
    event.category === "war" ||
    event.category === "campaign" ||
    event.category === "succession" ||
    event.category === "politics" ||
    event.category === "diplomacy" ||
    event.category === "frontier" ||
    event.people.length > 0 ||
    Boolean(event.locationName)
  );
}

function shouldShowComparableEvent(event: HistoricalEvent, showMediumEvents: boolean) {
  if (!isConcreteComparableEvent(event)) {
    return false;
  }

  const importance = getEventImportance(event);
  return importance === "major" || importance === "medium" || (showMediumEvents && importance === "minor");
}

function getEventCompareType(event: HistoricalEvent): EventCompareType {
  const text = `${event.id} ${event.title} ${event.titleZh ?? ""} ${event.eventLabel ?? ""} ${event.macroEvent ?? ""} ${event.summary} ${(event.tags ?? []).join(" ")}`.toLowerCase();

  if (event.category === "war" || event.category === "campaign" || /battle|war|campaign|siege|defeat|sack|capture|march|战争|战|围|攻|征|破|俘虏|灭亡/.test(text)) {
    return "military";
  }

  if (event.category === "diplomacy" || /diplomacy|treaty|alliance|embassy|negotiat|和约|联盟|遣使|交涉|外交/.test(text)) {
    return "diplomacy";
  }

  return "domestic";
}

function getComparableEventKind(event: HistoricalEvent) {
  const title = `${event.title} ${event.titleZh ?? ""} ${event.eventLabel ?? ""} ${event.summary}`.toLowerCase();

  if (event.category === "war" || event.category === "campaign" || /battle|war|campaign|siege|defeat|sack|战争|战|围|攻|征|破/.test(title)) {
    return "军事冲突";
  }

  if (event.category === "succession" || /succession|proclaimed|abdication|usurp|throne|禅让|称帝|即位|继位|篡|退位/.test(title)) {
    return "权力交接";
  }

  if (/assassination|murder|court|praetorian|palace|宫廷|刺杀|政变|诛|废/.test(title)) {
    return "宫廷斗争";
  }

  if (event.category === "diplomacy") {
    return "外交关系";
  }

  return categoryLabels[event.category];
}

function getComparableEventPeople(event: HistoricalEvent) {
  const names = new Set<string>();
  event.people.forEach((name) => names.add(name));
  event.personIds?.forEach((personId) => {
    const person = chinaPersonById.get(personId);
    if (person?.name) {
      names.add(person.name);
    }
  });

  return [...names];
}

function getComparableEventImpact(event: HistoricalEvent) {
  return event.detail?.result?.[0] ?? event.detail?.impact?.[0] ?? event.summary;
}

function getComparableEventPolicy(event: HistoricalEvent) {
  return event.detail?.process?.[0] ?? event.detail?.background?.[0] ?? event.summary;
}

function getComparableEventCasualtyLabel(event: HistoricalEvent) {
  const text = [event.summary, ...(event.detail?.process ?? []), ...(event.detail?.result ?? []), ...(event.detail?.uncertainty ?? [])].join(" ");
  const match = text.match(/(?:死者|战死|斩|坑杀|casualt(?:y|ies)|killed|dead|slain)[^。；;.，,]{0,18}(?:\d+|[一二三四五六七八九十百千万数]+)[^。；;.，,]{0,12}/i);
  return match?.[0] ?? "伤亡未结构化";
}

function getEventCompareFields(event: HistoricalEvent, compareType: EventCompareType) {
  const people = getComparableEventPeople(event);
  const polities = event.polities.length ? event.polities.join("、") : "未标注";

  if (compareType === "military") {
    return [
      { label: "地点", value: event.locationName ?? event.places?.[0] ?? "未标注" },
      { label: "参战方", value: polities },
      { label: "人物", value: people.length ? people.slice(0, 5).join("、") : "未绑定" },
      { label: "伤亡", value: getComparableEventCasualtyLabel(event) },
      { label: "结果", value: getComparableEventImpact(event) },
    ];
  }

  if (compareType === "diplomacy") {
    return [
      { label: "双方", value: polities },
      { label: "场域", value: event.locationName ?? event.places?.[0] ?? "未标注" },
      { label: "人物", value: people.length ? people.slice(0, 5).join("、") : "未绑定" },
      { label: "交涉内容", value: getComparableEventPolicy(event) },
      { label: "后果", value: getComparableEventImpact(event) },
    ];
  }

  return [
    { label: "议题", value: getComparableEventKind(event) },
    { label: "核心人物", value: people.length ? people.slice(0, 5).join("、") : "未绑定" },
    { label: "涉及政权", value: polities },
    { label: "政策/行动", value: getComparableEventPolicy(event) },
    { label: "影响", value: getComparableEventImpact(event) },
  ];
}

function eventMatchesCompareQuery(event: HistoricalEvent, normalizedCompareQuery: string) {
  if (!normalizedCompareQuery) {
    return true;
  }

  const text = [
    event.id,
    event.title,
    event.titleZh,
    event.titleEn,
    event.eventLabel,
    event.macroEvent,
    event.summary,
    event.locationName,
    ...(event.places ?? []),
    ...(event.people ?? []),
    ...(event.polities ?? []),
    ...(event.tags ?? []),
    ...(event.detail?.background ?? []),
    ...(event.detail?.process ?? []),
    ...(event.detail?.result ?? []),
    ...(event.detail?.impact ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(normalizedCompareQuery);
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

function getEventsByIds(allEvents: HistoricalEvent[], eventIds: string[]) {
  const seen = new Set<string>();
  return eventIds
    .map((eventId) => allEvents.find((event) => event.id === eventId))
    .filter((event): event is HistoricalEvent => {
      if (!event || seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);
      return true;
    });
}

function getPersonRegionLabel(person?: HistoricalPerson) {
  if (!person) {
    return "";
  }

  const region = person.region === "rome" || person.region === "sasanian-persia" || person.region === "india" ? person.region : "china";
  return getAgeRegionLabel(region);
}

function eventMatchesQuery(event: HistoricalEvent, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  const linkedPeople = (event.personIds ?? [])
    .map((personId) => chinaPersonById.get(personId))
    .filter((person): person is HistoricalPerson => Boolean(person))
    .flatMap((person) => [person.name, person.courtesyName, person.primaryPolity, ...person.roles, ...(person.aliases ?? [])]);
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
          <EvidenceField label="争议" value={mention.disputeNote ?? "未标注"} />
        </div>
      )}
      {!compact && (
        <div className="source-mention-tags">
          <span>{getConfidenceLabel(mention.confidence)}</span>
          {mention.tags.slice(0, 4).map((tag, index) => (
            <span key={`${mention.id}-tag-${index}-${tag}`}>{tag}</span>
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
        {lifeEvent.sourceRefs.slice(0, 2).map((ref, index) => (
          <SourceRefLink key={`${lifeEvent.id}-ref-${index}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
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
            .map((ref, index) => (
              <div className="life-event-excerpt" key={`${lifeEvent.id}-quote-${index}-${ref.sourceId}-${ref.locator ?? ""}`}>
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
    .flatMap((person) => [person.name, person.courtesyName, person.primaryPolity, ...person.roles, ...(person.aliases ?? [])]);
  const text = [event.title, event.summary, event.locationName, ...event.people, ...linkedPeople, ...event.polities, ...event.tags]
    .filter(Boolean)
    .join(" ");

  return terms.some((term) => text.includes(term));
}

function getPersonSearchFields(person: HistoricalPerson | PersonIndexItem) {
  return [person.name, ...(person.aliases ?? []), person.courtesyName, person.primaryPolity, ...person.roles, person.summary].filter(Boolean) as string[];
}

function stemRomanLookupToken(token: string) {
  if (/[\u4e00-\u9fff]/.test(token) || token.length < 5) {
    return token;
  }

  if (token.endsWith("ianus")) {
    return token.slice(0, -2);
  }

  if (token.endsWith("anus")) {
    return token.slice(0, -2);
  }

  if (token.endsWith("ius")) {
    return token.slice(0, -3);
  }

  if (token.endsWith("us")) {
    return token.slice(0, -2);
  }

  if (token.endsWith("a") && token.length > 6) {
    return token.slice(0, -1);
  }

  return token;
}

function normalizePersonLookupText(text: string, stemRomanNames = false) {
  const normalized = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[·.'’`-]/g, " ")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!stemRomanNames) {
    return normalized;
  }

  return normalized
    .split(" ")
    .map(stemRomanLookupToken)
    .join(" ")
    .trim();
}

function getLookupKeysFromText(text?: string | null) {
  if (!text) {
    return [];
  }

  const keys = new Set<string>();
  [normalizePersonLookupText(text), normalizePersonLookupText(text, true)].forEach((key) => {
    if (!key) {
      return;
    }
    keys.add(key);
    const tokens = key.split(" ").filter(Boolean);
    if (tokens.length > 1 && /^[a-z0-9 ]+$/.test(key)) {
      for (let index = 1; index < tokens.length; index += 1) {
        const suffixTokens = tokens.slice(index);
        const suffix = suffixTokens.join(" ");
        if (suffixTokens.length > 1) {
          keys.add(suffix);
        }
      }
    }
  });

  return [...keys].filter((key) => key.length >= 2);
}

function getPersonLookupKeys(person: HistoricalPerson | PersonIndexItem | AgePerson) {
  return [person.name, ...(person.aliases ?? [])].flatMap(getLookupKeysFromText);
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
  const region = (person.region === "rome" || person.region === "sasanian-persia" || person.region === "india" ? person.region : "china") as AgeRegionFilter;
  return {
    id: person.id,
    name: person.name,
    aliases: person.aliases ?? [],
    courtesyName: person.courtesyName,
    life: person.life,
    primaryPolity: person.primaryPolity,
    roles: person.roles,
    summary: person.summary,
    source: "person-index",
    region,
    birthYear: person.birthYear ?? lifeSpan.birthYear ?? undefined,
    deathYear: person.deathYear ?? lifeSpan.deathYear,
  };
}

function agePersonToPersonIndexItem(person: AgePerson): PersonIndexItem {
  return {
    id: person.id,
    name: person.name,
    aliases: person.aliases ?? [],
    courtesyName: null,
    life: person.birthYearRange ? `${person.birthYearRange.min}-${person.birthYearRange.max}?-${person.deathYear ?? "?"}` : `${person.birthYear}-${person.deathYear ?? "?"}`,
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

function inferBirthYearRange(person: HistoricalPerson, deathYear: number | null) {
  const activityYears = chinaPersonLifeEvents
    .filter((lifeEvent) => lifeEvent.personId === person.id && !["birth", "death", "later-tradition"].includes(lifeEvent.type))
    .map(getLifeEventStartYear)
    .filter((lifeEventYear): lifeEventYear is number => lifeEventYear !== null);
  const earliestActivityYear = activityYears.length ? Math.min(...activityYears) : null;
  const lowerBounds: number[] = [];
  const upperBounds: number[] = [];

  if (earliestActivityYear !== null) {
    lowerBounds.push(earliestActivityYear - 45);
    upperBounds.push(earliestActivityYear - 20);
  }

  if (deathYear !== null) {
    lowerBounds.push(deathYear - 75);
    upperBounds.push(deathYear - 35);
  }

  if (!lowerBounds.length || !upperBounds.length) {
    return null;
  }

  const min = Math.max(...lowerBounds);
  const max = Math.min(...upperBounds);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return null;
  }

  return {
    min,
    max,
    note: earliestActivityYear !== null && deathYear !== null
      ? `按最早活动 ${earliestActivityYear} 年约 20-45 岁、卒年 ${deathYear} 年约 35-75 岁估算`
      : earliestActivityYear !== null
        ? `按最早活动 ${earliestActivityYear} 年约 20-45 岁估算`
        : `按卒年 ${deathYear} 年约 35-75 岁估算`,
  };
}

function chinaPersonToAgePerson(person: HistoricalPerson): AgePerson | null {
  const lifeSpan = parseLifeSpan(person.life);
  const birthYear = person.birthYear ?? lifeSpan.birthYear;
  const deathYear = person.deathYear ?? lifeSpan.deathYear;
  const inferredBirthYearRange = birthYear ? null : inferBirthYearRange(person, deathYear);
  if (!birthYear && !inferredBirthYearRange) {
    return null;
  }
  const region = (person.region === "rome" || person.region === "sasanian-persia" || person.region === "india" ? person.region : "china") as AgeRegionFilter;
  const displayBirthYear = birthYear ?? Math.round(((inferredBirthYearRange?.min ?? 0) + (inferredBirthYearRange?.max ?? 0)) / 2);

  return {
    id: person.id,
    name: person.name,
    aliases: person.aliases ?? [],
    region,
    polity: person.primaryPolity,
    roles: person.roles,
    birthYear: displayBirthYear,
    birthYearRange: inferredBirthYearRange ? { min: inferredBirthYearRange.min, max: inferredBirthYearRange.max } : undefined,
    deathYear,
    summary: person.summary,
    source: "person-index",
    agePrecision: birthYear ? "exact" : "estimated",
    ageNote: inferredBirthYearRange?.note,
  };
}

function getAgeRegionLabel(region: AgeRegionFilter) {
  return ageRegionFilters.find((filter) => filter.id === region)?.label ?? region;
}

function getAgePersonState(person: AgePerson, targetYear: number) {
  if (person.birthYearRange) {
    const minAge = targetYear - person.birthYearRange.max;
    const maxAge = targetYear - person.birthYearRange.min;
    const deathAgeMin = person.deathYear ? person.deathYear - person.birthYearRange.max : null;
    const deathAgeMax = person.deathYear ? person.deathYear - person.birthYearRange.min : null;

    if (targetYear < person.birthYearRange.min) {
      return {
        age: maxAge,
        category: "unborn" as const,
        label: `${person.birthYearRange.min - targetYear} 年后出生？`,
        sortRank: 2,
        precision: "estimated" as const,
      };
    }

    if (person.deathYear && targetYear > person.deathYear) {
      return {
        age: Math.round(((deathAgeMin ?? 0) + (deathAgeMax ?? 0)) / 2),
        category: "deceased" as const,
        label: `已故 ${targetYear - person.deathYear} 年，终年约 ${deathAgeMin}-${deathAgeMax} 岁`,
        sortRank: 1,
        precision: "estimated" as const,
      };
    }

    return {
      age: Math.round((minAge + maxAge) / 2),
      category: "alive" as const,
      label: `约 ${Math.max(0, minAge)}-${maxAge} 岁`,
      sortRank: 0,
      precision: "estimated" as const,
    };
  }

  const age = targetYear - person.birthYear;

  if (targetYear < person.birthYear) {
    return {
      age,
      category: "unborn" as const,
      label: `${person.birthYear - targetYear} 年后出生`,
      sortRank: 2,
      precision: "exact" as const,
    };
  }

  if (person.deathYear && targetYear > person.deathYear) {
    return {
      age: person.deathYear - person.birthYear,
      category: "deceased" as const,
      label: `已故 ${targetYear - person.deathYear} 年，终年 ${person.deathYear - person.birthYear} 岁`,
      sortRank: 1,
      precision: "exact" as const,
    };
  }

  return {
    age,
    category: "alive" as const,
    label: `${age} 岁`,
    sortRank: 0,
    precision: "exact" as const,
  };
}

function agePersonSearchRank(person: AgePerson, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const fields = [person.name, ...(person.aliases ?? []), person.polity, getAgeRegionLabel(person.region), ...person.roles]
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
  const aliases = [...(person.aliases ?? []), person.en].filter((alias): alias is string => Boolean(alias));

  return {
    ...person,
    region: person.region ?? "china",
    aliases: [...new Set(aliases)],
    courtesyName: person.courtesyName ?? null,
    life: person.life ?? null,
    birthYear: person.birthYear ?? null,
    deathYear: person.deathYear ?? null,
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
    relatedEventIds: relation.relatedEventIds ?? [],
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
  overviewYearMin = data.overviewYearMin ?? data.range?.[0] ?? -900;
  overviewYearMax = data.overviewYearMax ?? data.range?.[1] ?? 1912;
  overviewPeriods = data.periods ?? [];
  overviewRegionTimelines = data.regionTimelines ?? [];
  overviewGlobalAnchors = data.globalAnchors ?? [];
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
    accession: "即位",
    birth: "出生",
    campaign: "战事",
    crisis: "危机",
    death: "死亡",
    deposition: "失位",
    diplomacy: "外交",
    "later-tradition": "传统称呼",
    office: "任位",
    politics: "政治",
    reform: "改革",
    religion: "宗教",
    reign: "统治",
    service: "仕历",
    strategy: "谋略",
    "turning-point": "转折",
    war: "战争",
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
  const [previousPage, setPreviousPage] = useState<Page | null>(null);
  const lastPageRef = useRef<Page>("home");
  const [locale, setLocale] = useState<Locale>("zh");
  const [openTopbarMenu, setOpenTopbarMenu] = useState<TopbarMenu | null>(null);
  const [year, setYear] = useState(220);
  const [detailPeriodContext, setDetailPeriodContext] = useState<DetailPeriodContext>({
    title: "汉末三国与罗马危机前夜",
    summary: "当前模板期。中国主叙事从黄巾之乱开始，而不是从 220 年三国政权正式成立才开始。",
    startYear: defaultDetailYearMin,
    endYear: defaultDetailYearMax,
    timelineId: "china",
    regionId: "china",
    regionLabel: "中国",
    color: "#b45235",
  });
  const yearMin = detailPeriodContext.startYear;
  const yearMax = detailPeriodContext.endYear;
  const [overviewYear, setOverviewYear] = useState(190);
  const [overviewTimelineId, setOverviewTimelineId] = useState("china");
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
  const [ageRegionFilter, setAgeRegionFilter] = useState<AgeRegionFilter>("all");
  const [selectedAgePersonIds, setSelectedAgePersonIds] = useState<string[]>(["cao-cao", "liu-bei", "sun-quan", "zhuge-liang", "sima-yi"]);
  const [evidenceRegionFilter, setEvidenceRegionFilter] = useState<EvidenceRegionFilter>("all");
  const [evidenceResults, setEvidenceResults] = useState<EvidenceSearchResult[]>([]);
  const [evidenceStatus, setEvidenceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [evidenceGraphTarget, setEvidenceGraphTarget] = useState<{ type: "event" | "person"; id: string }>({ type: "event", id: "china-208-red-cliffs" });
  const [evidenceGraphData, setEvidenceGraphData] = useState<EvidenceGraphEvent | null>(null);
  const [evidenceGraphStatus, setEvidenceGraphStatus] = useState<"loading" | "ready" | "error">("loading");
  const [aiDebugQuestion, setAiDebugQuestion] = useState("赤壁之战有哪些史料依据？");
  const [aiDebugEventId, setAiDebugEventId] = useState("");
  const [aiDebugPersonId, setAiDebugPersonId] = useState("");
  const [aiDebugRegion, setAiDebugRegion] = useState<EvidenceRegionFilter>("all");
  const [aiDebugYear, setAiDebugYear] = useState(String(year));
  const [aiDebugResult, setAiDebugResult] = useState<AiRetrieveResult | null>(null);
  const [aiDebugStatus, setAiDebugStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiAnswerResult, setAiAnswerResult] = useState<AiEvidenceAnswerResult | null>(null);
  const [aiAnswerStatus, setAiAnswerStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiAnswerError, setAiAnswerError] = useState<string | null>(null);
  const [aiHistory, setAiHistory] = useState<AiAnswerHistoryResult | null>(null);
  const [aiHistoryStatus, setAiHistoryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [ragEvalRuns, setRagEvalRuns] = useState<RagEvalRunSummary[]>([]);
  const [selectedRagEvalRunId, setSelectedRagEvalRunId] = useState<string | null>(null);
  const [ragEvalDetail, setRagEvalDetail] = useState<RagEvalRunDetail | null>(null);
  const [ragEvalStatus, setRagEvalStatus] = useState<"loading" | "ready" | "error">("loading");
  const [ragEvalFilter, setRagEvalFilter] = useState<"all" | "failures" | "low-score">("all");
  const [showMediumEvents, setShowMediumEvents] = useState(false);
  const [eventCompareType, setEventCompareType] = useState<EventCompareType>("military");
  const [eventCompareQuery, setEventCompareQuery] = useState("");
  const [eventCompareStartYear, setEventCompareStartYear] = useState(year - 5);
  const [eventCompareEndYear, setEventCompareEndYear] = useState(year + 5);
  const [selectedCompareEventIds, setSelectedCompareEventIds] = useState<string[]>([]);
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
  const [coveragePeriodId, setCoveragePeriodId] = useState<CoveragePeriodId>("190-310");
  const [coverageData, setCoverageData] = useState<FrontendCoverageDb | null>(null);
  const [coverageDataStatus, setCoverageDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [coverageGapFilter, setCoverageGapFilter] = useState<CoverageGapFilter>("all");
  const [mapDebugData, setMapDebugData] = useState<FrontendMapGeometryDebugDb | null>(null);
  const [mapDebugDataStatus, setMapDebugDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapDebugYear, setMapDebugYear] = useState(310);
  void eventImportanceStatus;
  void regionsDataStatus;
  void overviewDataVersion;
  void overviewDataStatus;
  void chinaMapStatus;
  void chinaPhysicalStatus;
  void coverageDataStatus;
  void mapDebugDataStatus;
  void aiHistoryStatus;
  void ragEvalStatus;

  const t = uiText[locale];
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCompareQuery = eventCompareQuery.trim().toLowerCase();
  const compareStartYear = Math.max(yearMin, Math.min(eventCompareStartYear, eventCompareEndYear));
  const compareEndYear = Math.min(yearMax, Math.max(eventCompareStartYear, eventCompareEndYear));

  useEffect(() => {
    if (lastPageRef.current === page) {
      return;
    }

    setPreviousPage(lastPageRef.current);
    lastPageRef.current = page;
  }, [page]);

  const chinaBlocks = runtimeChinaControlDb.adminBlocks.blocks;
  const chinaControlTimeline = runtimeChinaControlDb.controlTimeline;
  const chinaBlockById = useMemo(() => new Map(chinaBlocks.map((block) => [block.id, block])), [chinaBlocks]);
  const chinaControllerColorMap = useMemo(
    () => new Map(chinaControlTimeline.controllers.map((controller) => [controller.id, controller.color])),
    [chinaControlTimeline.controllers],
  );
  const activeOverviewPeriod = getOverviewPeriod(overviewYear);
  const activeOverviewTimeline = getOverviewRegionTimeline(overviewTimelineId);
  const activeOverviewTimelineEra = getOverviewTimelineEra(activeOverviewTimeline, overviewYear);
  const activeOverviewMapRegions = overviewRegionTimelines.reduce<OverviewMapRegion[]>((regions, timeline) => {
      const era = getOverviewTimelineEra(timeline, overviewYear);

      if (!era) {
        return regions;
      }

      regions.push({
        id: timeline.id,
        label: era.title,
        tier: era.status === "background" ? "secondary" : "core",
        summary: `${timeline.label} · ${formatHistoricalYear(era.startYear)}-${formatHistoricalYear(era.endYear)}：${era.summary ?? ""}`,
        coordinates: overviewRegionCoordinates[timeline.id],
        color: era.color,
        status: era.status,
        timelineId: timeline.id,
      });

      return regions;
    }, []);
  const activeOverviewSnapshotYear =
    activeOverviewPeriod.snapshotYears
      .filter((snapshotYear) => snapshotYear >= overviewYearMin && snapshotYear <= overviewYearMax)
      .sort((left, right) => Math.abs(left - overviewYear) - Math.abs(right - overviewYear))[0] ?? overviewYear;
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
          if (eventYear < yearMin || eventYear > yearMax) {
            return;
          }

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
  }, [eventImportanceVersion, matchingEvents, regionsDataVersion, yearMax, yearMin]);
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
  const selectedEventAiAnswer =
    aiAnswerResult?.retrieval.context.eventId === selectedEvent.id ? aiAnswerResult : null;

  const relatedEvents = selectedEvent.relatedEvents
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is HistoricalEvent => Boolean(event));
  const selectedEventPersonIds = (selectedEvent.personIds ?? []).filter((id) => chinaPersonById.has(id));
  const personIndexItems = useMemo(
    () => [...chinaPersons.map(chinaPersonToPersonIndexItem), ...ageSupplementPeople.map(agePersonToPersonIndexItem)],
    [peopleDataVersion],
  );
  const personIdsByLookupKey = useMemo(() => {
    const lookup = new Map<string, string[]>();
    personIndexItems.forEach((person) => {
      getPersonLookupKeys(person).forEach((key) => {
        const ids = lookup.get(key) ?? [];
        if (!ids.includes(person.id)) {
          lookup.set(key, [...ids, person.id]);
        }
      });
    });
    return lookup;
  }, [personIndexItems]);
  const selectedPerson = selectedPersonId ? (chinaPersonById.get(selectedPersonId) ?? null) : null;
  const selectedPersonIndexItem = selectedPersonId ? (personIndexItems.find((person) => person.id === selectedPersonId) ?? null) : null;
  const activeSelectedPersonId = selectedPersonIndexItem?.id ?? selectedPerson?.id ?? null;
  const selectedPersonRelations = selectedPerson
    ? chinaPersonRelations.filter(
        (relation) => relation.sourcePersonId === selectedPerson.id || relation.targetPersonId === selectedPerson.id,
      )
    : [];
  const selectedPersonLifeEvents = selectedPerson
    ? chinaPersonLifeEvents
        .filter((lifeEvent) => lifeEvent.personId === selectedPerson.id)
        .sort((left, right) => getLifeEventSortValue(left) - getLifeEventSortValue(right) || left.displayYear.localeCompare(right.displayYear))
    : [];
  const selectedPersonEvents = selectedPerson
    ? [
        ...events.filter((event) => event.personIds?.includes(selectedPerson.id)),
        ...getEventsByIds(events, selectedPersonLifeEvents.flatMap((lifeEvent) => lifeEvent.relatedEventIds)),
        ...getEventsByIds(events, selectedPersonRelations.flatMap((relation) => relation.relatedEventIds ?? [])),
      ]
        .filter((event, index, eventList) => eventList.findIndex((item) => item.id === event.id) === index)
        .sort((left, right) => left.startYear - right.startYear || left.endYear - right.endYear)
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
    const eventIdsByPerson = new Map<string, Set<string>>();
    const addEvent = (personId: string, eventId: string) => {
      if (!eventIdsByPerson.has(personId)) {
        eventIdsByPerson.set(personId, new Set());
      }
      eventIdsByPerson.get(personId)?.add(eventId);
    };

    events.forEach((event) => {
      event.personIds?.forEach((personId) => addEvent(personId, event.id));
    });

    const knownEventIds = new Set(events.map((event) => event.id));
    chinaPersonLifeEvents.forEach((lifeEvent) => {
      lifeEvent.relatedEventIds.filter((eventId) => knownEventIds.has(eventId)).forEach((eventId) => addEvent(lifeEvent.personId, eventId));
    });
    chinaPersonRelations.forEach((relation) => {
      (relation.relatedEventIds ?? []).filter((eventId) => knownEventIds.has(eventId)).forEach((eventId) => {
        addEvent(relation.sourcePersonId, eventId);
        addEvent(relation.targetPersonId, eventId);
      });
    });

    const counts = new Map<string, number>();
    eventIdsByPerson.forEach((eventIds, personId) => counts.set(personId, eventIds.size));
    return counts;
  }, [events, peopleDataVersion]);
  const personIndexEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    personIndexItems.forEach((person) => {
      const directCount = events.filter(
        (event) =>
          event.personIds?.includes(person.id) ||
          event.personIds?.includes(person.id.replace(/^china-/, "")) ||
          event.people.includes(person.name),
      ).length;
      counts.set(person.id, Math.max(personEventCounts.get(person.id) ?? 0, directCount));
    });
    return counts;
  }, [events, personEventCounts, personIndexItems]);
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
  const agePersonById = useMemo(() => new Map(agePeople.map((person) => [person.id, person])), [agePeople]);
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
  const selectedAgeComparisonItems = selectedAgePersonIds
    .map((personId) => agePersonById.get(personId))
    .filter((person): person is AgePerson => Boolean(person))
    .map((person) => ({ person, state: getAgePersonState(person, year) }))
    .sort((left, right) => left.state.sortRank - right.state.sortRank || right.state.age - left.state.age);
  const selectedAgePersonIdSet = new Set(selectedAgeComparisonItems.map((item) => item.person.id));
  const livingAgeComparisonItems = ageComparisonItems.filter((item) => item.state.category === "alive");
  const candidateAgeComparisonItems = livingAgeComparisonItems.filter((item) => !selectedAgePersonIdSet.has(item.person.id));
  const ageLifeContextByPersonId = useMemo(() => {
    const context = new Map<string, { label: string; title: string; summary: string; year: number | null }>();
    for (const personId of selectedAgePersonIds) {
      const personEvents = chinaPersonLifeEvents
        .filter((lifeEvent) => lifeEvent.personId === personId && !["birth", "death", "later-tradition"].includes(lifeEvent.type))
        .sort((left, right) => getLifeEventSortValue(left) - getLifeEventSortValue(right));
      const exactEvent = personEvents.find((lifeEvent) => isLifeEventInYear(lifeEvent, year));
      const previousEvent = [...personEvents]
        .filter((lifeEvent) => {
          const startYear = getLifeEventStartYear(lifeEvent);
          return startYear !== null && startYear <= year;
        })
        .sort((left, right) => getLifeEventSortValue(right) - getLifeEventSortValue(left))[0];
      const lifeEvent = exactEvent ?? previousEvent;
      if (lifeEvent) {
        context.set(personId, {
          label: exactEvent ? t.agePage.lifeAtYear : t.agePage.recentLife,
          title: lifeEvent.title,
          summary: lifeEvent.summary,
          year: getLifeEventStartYear(lifeEvent),
        });
      }
    }
    return context;
  }, [selectedAgePersonIds, t.agePage.lifeAtYear, t.agePage.recentLife, year, peopleDataVersion]);
  const ageRegionCounts = Object.fromEntries(
    ageRegionFilters.map((filter) => [
      filter.id,
      agePeople.filter((person) => (filter.id === "all" || person.region === filter.id) && getAgePersonState(person, year).category === "alive").length,
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
  const compareCandidateEvents = matchingEvents
    .filter(
      (event) =>
        event.startYear >= compareStartYear &&
        event.startYear <= compareEndYear &&
        getEventCompareType(event) === eventCompareType &&
        shouldShowComparableEvent(event, showMediumEvents) &&
        eventMatchesCompareQuery(event, normalizedCompareQuery),
    )
    .sort(
      (left, right) =>
        Math.abs(left.startYear - year) - Math.abs(right.startYear - year) ||
        worldComparisonRegionOrder.indexOf(left.region) - worldComparisonRegionOrder.indexOf(right.region) ||
        sortEventsByYearThenTitle(left, right),
    );
  const compareCandidateCounts = Object.fromEntries(
    eventCompareTypes.map((type) => [
      type.id,
      matchingEvents.filter(
        (event) =>
          event.startYear >= compareStartYear &&
          event.startYear <= compareEndYear &&
          getEventCompareType(event) === type.id &&
          shouldShowComparableEvent(event, showMediumEvents) &&
          eventMatchesCompareQuery(event, normalizedCompareQuery),
      ).length,
    ]),
  ) as Record<EventCompareType, number>;
  const selectedCompareEvents = selectedCompareEventIds
    .map((eventId) => events.find((event) => event.id === eventId))
    .filter((event): event is HistoricalEvent => Boolean(event))
    .filter((event) => getEventCompareType(event) === eventCompareType && shouldShowComparableEvent(event, showMediumEvents))
    .slice(0, 3);
  const displayedCompareEvents = selectedCompareEvents;
  const selectedPersonIsInEvent = selectedPerson ? selectedEventPersonIds.includes(selectedPerson.id) : false;

  useEffect(() => {
    let cancelled = false;

    setPeopleDataStatus("loading");
    fetch(`/api/frontend-people-index?locale=${locale}`)
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
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    setSourceDataStatus("loading");
    fetch(`/api/frontend-sources?locale=${locale}`)
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
  }, [locale]);

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
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("Period overview API failed", error);
        applyPeriodOverviewData({
          schemaVersion: 2,
          model: "period-overview",
          range: [-900, 1912],
          overviewYearMin: -900,
          overviewYearMax: 1912,
          periods: [],
          regionTimelines: [],
          globalAnchors: [],
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
    fetch(`/api/frontend-events?locale=${locale}`)
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
  }, [locale]);

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
    const coveragePeriod = coveragePeriods.find((period) => period.id === coveragePeriodId) ?? coveragePeriods[0];

    setCoverageDataStatus("loading");
    setCoverageGapFilter("all");
    fetch(coveragePeriod.endpoint)
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
  }, [coveragePeriodId]);

  useEffect(() => {
    let cancelled = false;

    setMapDebugDataStatus("loading");
    fetch(`/api/frontend-map-geometry-debug?dataset=china-power-zone-map-310-589&limit=180&year=${mapDebugYear}`)
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
  }, [mapDebugYear]);

  useEffect(() => {
    let cancelled = false;

    setAiHistoryStatus("loading");
    fetch("/api/ai-answers?limit=80")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`AI answers API failed: ${response.status}`);
        }

        return response.json() as Promise<AiAnswerHistoryResult>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setAiHistory(data);
        setAiHistoryStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setAiHistory(null);
        setAiHistoryStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setRagEvalStatus("loading");
    fetch("/api/rag-eval/runs?set=sample-190-310-v1&limit=8")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`RAG eval runs API failed: ${response.status}`);
        }
        return response.json() as Promise<{ runs: RagEvalRunSummary[] }>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setRagEvalRuns(data.runs);
        setSelectedRagEvalRunId((current) => current ?? data.runs[0]?.id ?? null);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setRagEvalRuns([]);
        setRagEvalDetail(null);
        setRagEvalStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedRagEvalRunId) {
      return;
    }

    let cancelled = false;
    setRagEvalStatus("loading");
    fetch(`/api/rag-eval/runs/${encodeURIComponent(selectedRagEvalRunId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`RAG eval detail API failed: ${response.status}`);
        }
        return response.json() as Promise<RagEvalRunDetail>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setRagEvalDetail(data);
        setRagEvalStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setRagEvalDetail(null);
        setRagEvalStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRagEvalRunId]);

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
    if (page !== "evidence-graph" || !evidenceGraphTarget.id) {
      return;
    }

    const controller = new AbortController();
    setEvidenceGraphStatus("loading");
    fetch(`/api/evidence-graph/${evidenceGraphTarget.type}/${encodeURIComponent(evidenceGraphTarget.id)}?locale=${locale}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Evidence graph API failed: ${response.status}`);
        }
        return response.json() as Promise<EvidenceGraphEvent>;
      })
      .then((payload) => {
        setEvidenceGraphData(payload);
        setEvidenceGraphStatus("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setEvidenceGraphData(null);
        setEvidenceGraphStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [evidenceGraphTarget, locale, page]);

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

  function syncDetailPeriodToRegion(region: Region, entryYear = year) {
    const timelineId = getOverviewTimelineIdFromDetailRegion(region);
    const timeline = getOverviewRegionTimeline(timelineId);
    const era = getOverviewTimelineEra(timeline, entryYear);

    if (!timeline || !era) {
      return null;
    }

    const detailStartYear = Math.max(era.startYear, overviewYearMin);
    const detailEndYear = Math.min(era.endYear, overviewYearMax);
    const boundedEntryYear = Math.min(detailEndYear, Math.max(detailStartYear, entryYear));
    const detailRegionId = getDetailRegionIdFromTimeline(timeline.id);

    setDetailPeriodContext({
      title: era.title,
      summary: era.summary ?? timeline.label,
      startYear: detailStartYear,
      endYear: detailEndYear,
      timelineId: timeline.id,
      regionId: detailRegionId,
      regionLabel: timeline.label,
      color: era.color,
    });
    setOverviewTimelineId(timeline.id);
    setOverviewYear(boundedEntryYear);
    setYear(boundedEntryYear);
    setEventCompareStartYear(Math.max(detailStartYear, boundedEntryYear - 5));
    setEventCompareEndYear(Math.min(detailEndYear, boundedEntryYear + 5));

    return { detailEndYear, detailStartYear, regionId: detailRegionId };
  }

  function previewRegion(region: Region) {
    syncDetailPeriodToRegion(region);
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
      syncDetailPeriodToRegion("china");
      setPage("china");
      setChinaMapMode("political");
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
      syncDetailPeriodToRegion("rome");
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

  function returnToPreviousPage() {
    if (!previousPage || previousPage === page) {
      return;
    }

    setOpenTopbarMenu(null);
    setPage(previousPage);
  }

  function returnToHome() {
    setPage("home");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function enterOverviewEra(timeline: OverviewRegionTimeline | null, era: OverviewRegionTimelineEra | null, entryYear = overviewYear) {
    if (!timeline || !era) {
      enterOverviewPeriod(activeOverviewPeriod, entryYear);
      return;
    }

    const detailStartYear = Math.max(era.startYear, overviewYearMin);
    const detailEndYear = Math.min(era.endYear, overviewYearMax);
    const boundedEntryYear = Math.min(detailEndYear, Math.max(detailStartYear, entryYear));
    const regionId = getDetailRegionIdFromTimeline(timeline.id);

    setDetailPeriodContext({
      title: era.title,
      summary: era.summary ?? timeline.label,
      startYear: detailStartYear,
      endYear: detailEndYear,
      timelineId: timeline.id,
      regionId,
      regionLabel: timeline.label,
      color: era.color,
    });
    setOverviewYear(boundedEntryYear);
    setYear(boundedEntryYear);
    setEventCompareStartYear(Math.max(detailStartYear, boundedEntryYear - 5));
    setEventCompareEndYear(Math.min(detailEndYear, boundedEntryYear + 5));
    setPage("world");
    setSelectedRegion(regionId);
    setSummaryRegion(regionId);
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

    const detailStartYear = Math.max(period.startYear, overviewYearMin);
    const detailEndYear = Math.min(period.endYear, overviewYearMax);
    const boundedEntryYear = Math.min(detailEndYear, Math.max(detailStartYear, entryYear));

    setDetailPeriodContext({
      title: period.title,
      summary: period.summary,
      startYear: detailStartYear,
      endYear: detailEndYear,
      timelineId: "global",
      regionId: "china",
      regionLabel: "中国",
      color: period.color,
    });
    setYear(boundedEntryYear);
    setEventCompareStartYear(Math.max(detailStartYear, boundedEntryYear - 5));
    setEventCompareEndYear(Math.min(detailEndYear, boundedEntryYear + 5));
    setPage("world");
    setSelectedRegion("china");
    setSummaryRegion("china");
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function focusOverviewTimelineEra(era: OverviewRegionTimelineEra) {
    const entryYear = era.detailEntryYear ?? getOverviewEraMidpoint(era);
    setOverviewYear(Math.min(overviewYearMax, Math.max(overviewYearMin, entryYear)));
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

  function openLearningGuide() {
    setPage("learning");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openAgeComparison() {
    setPage("age");
    setQuery("");
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

  function openEvidenceGraph(event: HistoricalEvent = selectedEvent) {
    setEvidenceGraphTarget({ type: "event", id: event.id });
    setPage("evidence-graph");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openPersonEvidenceGraph(personId: string) {
    setEvidenceGraphTarget({ type: "person", id: personId });
    setPage("evidence-graph");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openEventComparison() {
    setPage("compare");
    setQuery("");
    setEventCompareStartYear(Math.max(yearMin, year - 5));
    setEventCompareEndYear(Math.min(yearMax, year + 5));
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

  function openRagEvalPanel() {
    setPage("rag-eval");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  function openAiDebugPanel() {
    setPage("ai-debug");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
    setAiDebugYear(String(year));
    if (eventsStatus === "ready") {
      setAiDebugRegion(selectedEvent.region);
      setAiDebugEventId(selectedEvent.id);
      setAiDebugQuestion(`${getEventDisplayTitle(selectedEvent, locale).primary}${locale === "zh" ? "有哪些史料依据？" : ": what evidence supports this event?"}`);
      setAiDebugEventId("");
      setAiDebugPersonId("");
      setAiDebugRegion("all");
      setAiDebugQuestion(locale === "zh" ? "当前年份有哪些史料依据？" : "What evidence is available for the current year?");
    } else {
      setAiDebugRegion("all");
      setAiDebugEventId("");
      setAiDebugPersonId("");
      setAiDebugQuestion(locale === "zh" ? "当前年份有哪些史料依据？" : "What evidence is available for the current year?");
    }
  }

  function openAiHistoryPanel() {
    setPage("ai-history");
    setQuery("");
    setSummaryRegion(null);
    setHoveredRegion(null);
    setSelectedChinaBlockId(null);
    setHoveredChinaBlockId(null);
    setSelectedRomanProvinceId(null);
  }

  async function runAiDebugRetrieve() {
    const trimmedQuestion = aiDebugQuestion.trim();
    if (!trimmedQuestion) {
      setAiDebugStatus("error");
      return;
    }

    setAiDebugStatus("loading");
    setAiDebugResult(null);
    const parsedYear = Number(aiDebugYear);
    const payload = {
      question: trimmedQuestion,
      locale,
      limit: 12,
      context: {
        eventId: aiDebugEventId.trim() || null,
        personId: aiDebugPersonId.trim() || null,
        region: aiDebugRegion === "all" ? null : aiDebugRegion,
        year: Number.isInteger(parsedYear) ? parsedYear : null,
      },
    };

    try {
      const response = await fetch("/api/ai/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`AI retrieve failed: ${response.status}`);
      }
      const result = await response.json() as AiRetrieveResult;
      setAiDebugResult(result);
      setAiDebugStatus("ready");
    } catch {
      setAiDebugResult(null);
      setAiDebugStatus("error");
    }
  }

  async function runAiEvidenceAnswer() {
    const trimmedQuestion = aiDebugQuestion.trim();
    if (!trimmedQuestion) {
      setAiAnswerStatus("error");
      setAiAnswerError(locale === "zh" ? "问题不能为空" : "Question is required");
      return;
    }

    setAiAnswerStatus("loading");
    setAiAnswerResult(null);
    setAiAnswerError(null);
    const parsedYear = Number(aiDebugYear);
    const payload = {
      question: trimmedQuestion,
      locale,
      limit: 10,
      context: {
        eventId: aiDebugEventId.trim() || null,
        personId: aiDebugPersonId.trim() || null,
        region: aiDebugRegion === "all" ? null : aiDebugRegion,
        year: Number.isInteger(parsedYear) ? parsedYear : null,
      },
    };

    try {
      const response = await fetch("/api/ai/evidence-answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? `AI answer failed: ${response.status}`);
      }
      const answerResult = result as AiEvidenceAnswerResult;
      setAiAnswerResult(answerResult);
      setAiDebugResult(answerResult.retrieval);
      setAiDebugStatus("ready");
      setAiAnswerStatus("ready");
    } catch (error) {
      setAiAnswerResult(null);
      setAiAnswerStatus("error");
      setAiAnswerError(error instanceof Error ? error.message : "AI answer failed");
    }
  }

  async function runSelectedEventAiAnswer() {
    const question = `${getEventDisplayTitle(selectedEvent, locale).primary}${locale === "zh" ? "有哪些史料依据？" : ": what evidence supports this event?"}`;
    setAiDebugQuestion(question);
    setAiDebugEventId(selectedEvent.id);
    setAiDebugPersonId("");
    setAiDebugRegion(selectedEvent.region);
    setAiDebugYear(String(selectedEvent.startYear));
    setAiAnswerStatus("loading");
    setAiAnswerResult(null);
    setAiAnswerError(null);

    try {
      const response = await fetch("/api/ai/evidence-answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          locale,
          limit: 10,
          context: {
            eventId: selectedEvent.id,
            personId: null,
            region: selectedEvent.region,
            year: selectedEvent.startYear,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? `AI answer failed: ${response.status}`);
      }
      const answerResult = result as AiEvidenceAnswerResult;
      setAiAnswerResult(answerResult);
      setAiDebugResult(answerResult.retrieval);
      setAiDebugStatus("ready");
      setAiAnswerStatus("ready");
    } catch (error) {
      setAiAnswerResult(null);
      setAiAnswerStatus("error");
      setAiAnswerError(error instanceof Error ? error.message : "AI answer failed");
    }
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
      setChinaMapMode("political");
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

  function addAgePerson(personId: string) {
    setSelectedAgePersonIds((current) => current.includes(personId) ? current : [...current, personId]);
  }

  function removeAgePerson(personId: string) {
    setSelectedAgePersonIds((current) => current.filter((id) => id !== personId));
  }

  function selectEventCompareType(compareType: EventCompareType) {
    setEventCompareType(compareType);
    setSelectedCompareEventIds([]);
  }

  function addCompareEvent(event: HistoricalEvent) {
    if (getEventCompareType(event) !== eventCompareType) {
      return;
    }

    setSelectedCompareEventIds((current) => {
      if (current.includes(event.id)) {
        return current.filter((eventId) => eventId !== event.id);
      }

      return [...current, event.id].slice(-3);
    });
  }

  function removeCompareEvent(eventId: string) {
    setSelectedCompareEventIds((current) => current.filter((id) => id !== eventId));
  }

  function getEventLinkedPersonIds(event: HistoricalEvent) {
    const ids = new Set<string>();
    event.personIds?.forEach((personId) => {
      if (chinaPersonById.has(personId) || agePersonById.has(personId)) {
        ids.add(personId);
      }
    });
    event.people.forEach((name) => {
      getLookupKeysFromText(name).forEach((key) => {
        personIdsByLookupKey.get(key)?.forEach((personId) => ids.add(personId));
      });
    });
    chinaPersonLifeEvents.forEach((lifeEvent) => {
      if (lifeEvent.relatedEventIds.includes(event.id)) {
        ids.add(lifeEvent.personId);
      }
    });
    return [...ids];
  }

  function getAgeEventPersonIds(event: HistoricalEvent) {
    const ids = new Set<string>();
    getEventLinkedPersonIds(event).forEach((personId) => {
      if (agePersonById.has(personId)) {
        ids.add(personId);
      }
    });
    return [...ids].filter((personId) => {
      const person = agePersonById.get(personId);
      return person ? getAgePersonState(person, event.startYear).category === "alive" : false;
    });
  }

  function addAgeEventPeople(event: HistoricalEvent) {
    const eventPersonIds = getAgeEventPersonIds(event);
    setYear(Math.min(yearMax, Math.max(yearMin, event.startYear)));
    setSelectedId(event.id);
    if (!eventPersonIds.length) {
      return;
    }
    setSelectedAgePersonIds((current) => {
      const next = [...current];
      eventPersonIds.forEach((personId) => {
        if (!next.includes(personId)) {
          next.push(personId);
        }
      });
      return next;
    });
  }

  function openAgePersonProfile(person: AgePerson) {
    setSelectedPersonId(person.id);
    setQuery(person.name);
    if (person.source === "age-supplement") {
      setAgeRegionFilter(person.region);
      setPage("age");
      return;
    }
    setPage("people");
  }

  function openLearningEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      return;
    }
    selectHistoricalEvent(event);
  }

  function askLearningQuestion(question: string, region: EvidenceRegionFilter = "all", questionYear = year) {
    setAiDebugQuestion(question);
    setAiDebugRegion(region);
    setAiDebugYear(String(questionYear));
    setAiDebugEventId("");
    setAiDebugPersonId("");
    setAiDebugResult(null);
    setAiAnswerResult(null);
    setAiDebugStatus("idle");
    setAiAnswerStatus("idle");
    setPage("ai-debug");
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
  const coverageTemplateAudit = coverageData?.templateAudit;
  const coverageTemplateFailedChecks = coverageTemplateAudit?.checks.filter((check) => !check.pass) ?? [];
  const mapDebugDisplayFeatures = mapDebugData?.displayFeatures?.filter((feature) => feature.coordinates && feature.bounds) ?? [];
  const mapDebugBounds = mapDebugDisplayFeatures.reduce<[number, number, number, number] | null>((bounds, feature) => {
    if (!feature.bounds) {
      return bounds;
    }
    return bounds
      ? [
          Math.min(bounds[0], feature.bounds[0]),
          Math.min(bounds[1], feature.bounds[1]),
          Math.max(bounds[2], feature.bounds[2]),
          Math.max(bounds[3], feature.bounds[3]),
        ]
      : feature.bounds;
  }, null);
  const projectMapDebugPoint = (point: [number, number]) => {
    const bounds = mapDebugBounds ?? [94, 21, 126, 43];
    const width = 760;
    const height = 360;
    const pad = 24;
    const lonSpan = Math.max(1, bounds[2] - bounds[0]);
    const latSpan = Math.max(1, bounds[3] - bounds[1]);
    const x = pad + ((point[0] - bounds[0]) / lonSpan) * (width - pad * 2);
    const y = pad + ((bounds[3] - point[1]) / latSpan) * (height - pad * 2);
    return [x, y] as const;
  };
  const pageHeadingTitle =
    page === "rome"
      ? `${locale === "zh" ? "罗马省份控制" : "Roman Provincial Control"} ${detailPeriodContext.startYear}-${detailPeriodContext.endYear} CE`
      : page === "world"
        ? `${locale === "zh" ? "中国、罗马与萨珊同年对照" : "China, Rome, and Sasanian same-year comparison"}`
        : t.pageTitle[page] ??
    (page === "ai-history"
      ? (locale === "zh" ? "AI 回答记录" : "AI Answer History")
      : (locale === "zh" ? "AI 问答" : "AI Q&A"));
  const previousPageLabel = previousPage
    ? (previousPage === "rome"
      ? `${locale === "zh" ? "罗马省份控制" : "Roman Provincial Control"} ${detailPeriodContext.startYear}-${detailPeriodContext.endYear} CE`
      : previousPage === "world"
        ? (locale === "zh" ? "同年对照" : "Same-year comparison")
        : t.pageTitle[previousPage] ?? (previousPage === "ai-history" ? (locale === "zh" ? "AI 回答记录" : "AI Answer History") : previousPage))
    : "";
  const visibleRagEvalResults = ragEvalDetail?.results.filter((result) => {
    if (ragEvalFilter === "failures") {
      return Boolean(result.failureType);
    }
    if (ragEvalFilter === "low-score") {
      return result.scoreTotal < 0.9;
    }
    return true;
  }) ?? [];
  const ragEvalTypeCounts = ragEvalDetail?.results.reduce<Record<string, number>>((counts, result) => {
    counts[result.questionType] = (counts[result.questionType] ?? 0) + 1;
    return counts;
  }, {}) ?? {};
  const showTimelineDock = page === "world" || page === "china" || page === "rome" || page === "age";
  const showDetailPanel = page === "world" || page === "china" || page === "rome" || page === "people";
  const showRegionalEventSections = page === "world" || page === "china" || page === "rome";
  const learningEventGroups = [
    {
      id: "china",
      label: locale === "zh" ? "中国主线" : "China",
      summary: locale === "zh" ? "东汉崩解、三国成形、魏晋统一，是本时期最完整的范例线。" : "Late Han collapse, Three Kingdoms formation, and Jin reunification are the most complete model line.",
      eventIds: [
        "china-190-coalition-against-dong-zhuo",
        "china-200-battle-of-guandu",
        "china-208-red-cliffs",
        "china-220-cao-pi-founds-wei",
        "china-263-shu-han-conquered",
        "china-280-jin-conquers-wu",
      ],
    },
    {
      id: "rome",
      label: locale === "zh" ? "罗马主线" : "Rome",
      summary: locale === "zh" ? "从塞维鲁王朝到三世纪危机，再到戴克里先改革和四帝共治。" : "From the Severans through the third-century crisis to Diocletian's reforms and the Tetrarchy.",
      eventIds: [
        "rome-193-didius-julianus-buys-the-throne-severus-proclaimed-in-pannonia",
        "rome-212-antonine-constitution",
        "rome-235-assassination-of-alexander-severus-beginning-of-the-third-century-crisis",
        "rome-260-capture-of-valerian-by-shapur-i",
        "rome-272-aurelian-defeats-zenobia-and-recovers-the-east",
        "rome-293-diocletian-creates-the-tetrarchy",
      ],
    },
    {
      id: "sasanian-persia",
      label: locale === "zh" ? "萨珊主线" : "Sasanian Persia",
      summary: locale === "zh" ? "安息旧秩序瓦解后，萨珊成为罗马东方最强对手。" : "After the fall of Parthia, the Sasanians became Rome's strongest eastern rival.",
      eventIds: [
        "sasanian-224-ardashir-defeats-parthians",
        "sasanian-230-ardashir-roman-frontier",
        "sasanian-244-battle-of-misiche",
        "rome-sasanian-260-valerian-captured",
        "sasanian-293-narseh-paikuli",
        "sasanian-298-peace-of-nisibis",
      ],
    },
  ].map((group) => ({
    ...group,
    events: group.eventIds.map((eventId) => events.find((event) => event.id === eventId)).filter((event): event is HistoricalEvent => Boolean(event)),
  }));
  const learningRequiredEvents = learningEventGroups.flatMap((group) => group.events);
  const learningPeopleTargets = [
    { id: "cao-cao", fallback: "曹操" },
    { id: "liu-bei", fallback: "刘备" },
    { id: "sun-quan", fallback: "孙权" },
    { id: "zhuge-liang", fallback: "诸葛亮" },
    { id: "diocletian", fallback: "Diocletian" },
    { id: "aurelian", fallback: "Aurelian" },
    { id: "shapur-i", fallback: "Shapur" },
    { id: "ardashir-i", fallback: "Ardashir" },
  ];
  const learningPeople = learningPeopleTargets
    .map((target) => (
      personIndexItems.find((person) => person.id === target.id) ??
      personIndexItems.find((person) => person.name.toLowerCase().includes(target.fallback.toLowerCase()))
    ))
    .reduce<PersonIndexItem[]>((people, person) => {
      if (person && !people.some((item) => item.id === person.id)) {
        people.push(person);
      }
      return people;
    }, []);
  const learningYearAnchors = [
    { year: 190, label: locale === "zh" ? "东汉失控" : "Late Han rupture" },
    { year: 208, label: locale === "zh" ? "赤壁之后" : "After Red Cliffs" },
    { year: 220, label: locale === "zh" ? "魏代汉" : "Wei replaces Han" },
    { year: 235, label: locale === "zh" ? "罗马危机起点" : "Roman crisis begins" },
    { year: 260, label: locale === "zh" ? "瓦勒良被俘" : "Valerian captured" },
    { year: 280, label: locale === "zh" ? "西晋统一" : "Jin reunifies China" },
    { year: 293, label: locale === "zh" ? "四帝共治" : "Tetrarchy" },
    { year: 310, label: locale === "zh" ? "范例终点" : "Model endpoint" },
  ];
  const learningQuestions = [
    {
      question: locale === "zh" ? "曹操死的时候，罗马处于什么政治阶段？" : "What was happening in Rome when Cao Cao died?",
      region: "all" as EvidenceRegionFilter,
      year: 220,
    },
    {
      question: locale === "zh" ? "260 年瓦勒良被俘为什么是罗马和萨珊关系的关键事件？" : "Why was Valerian's capture in 260 a key event in Roman-Sasanian relations?",
      region: "rome" as EvidenceRegionFilter,
      year: 260,
    },
    {
      question: locale === "zh" ? "三国到西晋统一这条线有哪些关键史料？" : "Which sources support the line from the Three Kingdoms to Jin reunification?",
      region: "china" as EvidenceRegionFilter,
      year: 280,
    },
  ];
  const detailRangeMiddleYear = Math.round((yearMin + yearMax) / 2);
  const detailRangeLabels = [
    yearMin,
    detailRangeMiddleYear,
    yearMax,
  ].filter((labelYear, index, labelYears) => labelYears.indexOf(labelYear) === index);
  const detailTimeline = getOverviewRegionTimeline(detailPeriodContext.timelineId);
  const detailTimelineEras = detailTimeline?.eras ?? [];
  const currentDetailEraIndex = detailTimelineEras.findIndex(
    (era) => era.startYear === detailPeriodContext.startYear && era.endYear === detailPeriodContext.endYear,
  );
  const previousDetailEra = currentDetailEraIndex > 0 ? detailTimelineEras[currentDetailEraIndex - 1] : null;
  const nextDetailEra =
    currentDetailEraIndex >= 0 && currentDetailEraIndex < detailTimelineEras.length - 1
      ? detailTimelineEras[currentDetailEraIndex + 1]
      : null;

  function switchDetailPeriod(targetEra: OverviewRegionTimelineEra | null, direction: -1 | 1) {
    if (!targetEra || !detailTimeline) {
      return;
    }

    const detailStartYear = Math.max(targetEra.startYear, overviewYearMin);
    const detailEndYear = Math.min(targetEra.endYear, overviewYearMax);
    const rawEntryYear = direction < 0
      ? targetEra.endYear === detailPeriodContext.startYear
        ? targetEra.endYear - 1
        : targetEra.endYear
      : targetEra.startYear;
    const entryYear = Math.min(detailEndYear, Math.max(detailStartYear, rawEntryYear));
    const regionId = getDetailRegionIdFromTimeline(detailTimeline.id);

    setDetailPeriodContext({
      title: targetEra.title,
      summary: targetEra.summary ?? detailTimeline.label,
      startYear: detailStartYear,
      endYear: detailEndYear,
      timelineId: detailTimeline.id,
      regionId,
      regionLabel: detailTimeline.label,
      color: targetEra.color,
    });
    setOverviewTimelineId(detailTimeline.id);
    setOverviewYear(entryYear);
    setYear(entryYear);
    setEventCompareStartYear(Math.max(detailStartYear, entryYear - 5));
    setEventCompareEndYear(Math.min(detailEndYear, entryYear + 5));
    setSelectedRegion(regionId);
    setSummaryRegion(page === "world" ? regionId : null);
    setHoveredRegion(null);
  }

  const timelineDock = (
    <section className={`timeline-dock ${page === "age" ? "age-timeline-dock" : ""}`} aria-label="时间轴">
      <button
        className="icon-button"
        type="button"
        aria-label={page === "age" ? "上一年" : "上一个时间段"}
        disabled={page !== "age" && !previousDetailEra}
        title={page === "age" ? "上一年" : previousDetailEra ? `上一个时间段：${previousDetailEra.title}` : "没有上一个时间段"}
        onClick={() => {
          if (page === "age") {
            setYear((current) => Math.max(yearMin, current - 1));
            return;
          }

          switchDetailPeriod(previousDetailEra, -1);
        }}
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
              {timelineMarkers.map((marker, index) => {
                const regionIndex = Math.max(0, worldComparisonRegionOrder.indexOf(marker.region.id));
                const offset = ((marker.year - yearMin) / (yearMax - yearMin)) * 100;

                return (
                  <span
                    className="timeline-marker"
                    key={`${marker.region.id}-${marker.year}-${index}`}
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
          <div className="range-labels">
            {detailRangeLabels.map((labelYear) => (
              <span key={labelYear}>{labelYear}</span>
            ))}
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
      </div>
      <button
        className="icon-button"
        type="button"
        aria-label={page === "age" ? "下一年" : "下一个时间段"}
        disabled={page !== "age" && !nextDetailEra}
        title={page === "age" ? "下一年" : nextDetailEra ? `下一个时间段：${nextDetailEra.title}` : "没有下一个时间段"}
        onClick={() => {
          if (page === "age") {
            setYear((current) => Math.min(yearMax, current + 1));
            return;
          }

          switchDetailPeriod(nextDetailEra, 1);
        }}
      >
        <ChevronRight size={20} />
      </button>
    </section>
  );

  return (
    <main className={`app-shell ${page === "home" || page === "learning" || page === "age" || page === "evidence" || page === "evidence-graph" || page === "compare" || page === "coverage" || page === "map-debug" || page === "rag-eval" || page === "ai-debug" || page === "ai-history" ? "wide-shell" : ""}`}>
      <header className="global-topbar" aria-label={locale === "zh" ? "站点工具栏" : "Site toolbar"}>
        <button
          className="utility-menu-button"
          type="button"
          aria-label={locale === "zh" ? "打开用户菜单" : "Open user menu"}
          title={locale === "zh" ? "用户、收藏与浏览记录" : "User, saved events, and history"}
          onClick={() => setOpenTopbarMenu(null)}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <button
          className="topbar-action locale-toggle topbar-language"
          type="button"
          aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
          onClick={() => {
            setOpenTopbarMenu(null);
            setLocale((current) => current === "zh" ? "en" : "zh");
          }}
        >
          <Globe2 size={17} aria-hidden="true" />
          <span>{locale === "zh" ? "EN" : "中文"}</span>
        </button>
      </header>
      <section className="map-workspace">
        <header className="workspace-header">
          <button className="brand-home" type="button" onClick={() => { setOpenTopbarMenu(null); returnToHome(); }} aria-label={t.nav.home}>
            <p className="kicker">ChronoAtlas</p>
            <h1>{pageHeadingTitle}</h1>
          </button>
          <div className="topbar-secondary">
            <div className="topbar-actions">
            <details className={`topbar-menu ${page === "people" || page === "age" ? "active" : ""}`} open={openTopbarMenu === "people"}>
              <summary onClick={(event) => {
                event.preventDefault();
                setOpenTopbarMenu((current) => current === "people" ? null : "people");
              }}>
                <UsersRound size={17} aria-hidden="true" />
                <span>{locale === "zh" ? "人物" : "People"}</span>
              </summary>
              <div className="topbar-menu-panel">
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openPeopleIndex(); }}>{t.nav.people}</button>
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openAgeComparison(); }}>{t.nav.age}</button>
              </div>
            </details>
            <details className={`topbar-menu ${page === "evidence" || page === "evidence-graph" ? "active" : ""}`} open={openTopbarMenu === "sources"}>
              <summary onClick={(event) => {
                event.preventDefault();
                setOpenTopbarMenu((current) => current === "sources" ? null : "sources");
              }}>
                <BookOpen size={17} aria-hidden="true" />
                <span>{locale === "zh" ? "史料" : "Sources"}</span>
              </summary>
              <div className="topbar-menu-panel">
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openEvidencePanel(); }}>{t.nav.evidence}</button>
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openEvidenceGraph(selectedEvent); }}>{t.nav.evidenceGraph}</button>
              </div>
            </details>
            <details className={`topbar-menu ${page === "compare" || page === "coverage" ? "active" : ""}`} open={openTopbarMenu === "events"}>
              <summary onClick={(event) => {
                event.preventDefault();
                setOpenTopbarMenu((current) => current === "events" ? null : "events");
              }}>
                <CircleDot size={17} aria-hidden="true" />
                <span>{locale === "zh" ? "事件" : "Events"}</span>
              </summary>
              <div className="topbar-menu-panel">
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openEventComparison(); }}>{t.nav.compare}</button>
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openCoveragePanel(); }}>{t.nav.coverage}</button>
              </div>
            </details>
            <details className={`topbar-menu ${page === "ai-debug" || page === "ai-history" ? "active" : ""}`} open={openTopbarMenu === "ai"}>
              <summary onClick={(event) => {
                event.preventDefault();
                setOpenTopbarMenu((current) => current === "ai" ? null : "ai");
              }}>
                <Network size={17} aria-hidden="true" />
                <span>AI</span>
              </summary>
              <div className="topbar-menu-panel">
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openAiDebugPanel(); }}>{t.nav.aiDebug ?? (locale === "zh" ? "AI 问答" : "AI Q&A")}</button>
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openAiHistoryPanel(); }}>{t.nav.aiHistory ?? (locale === "zh" ? "AI 记录" : "AI History")}</button>
              </div>
            </details>
            <details className={`topbar-menu ${page === "learning" || page === "map-debug" || page === "rag-eval" ? "active" : ""}`} open={openTopbarMenu === "tools"}>
              <summary onClick={(event) => {
                event.preventDefault();
                setOpenTopbarMenu((current) => current === "tools" ? null : "tools");
              }}>
                <Grid3x3 size={17} aria-hidden="true" />
                <span>{locale === "zh" ? "工具" : "Tools"}</span>
              </summary>
              <div className="topbar-menu-panel">
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openLearningGuide(); }}>{t.nav.learning}</button>
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openMapDebugPanel(); }}>{t.nav.mapDebug}</button>
                <button type="button" onClick={() => { setOpenTopbarMenu(null); openRagEvalPanel(); }}>{t.nav.ragEval}</button>
              </div>
            </details>
            {page !== "home" && page !== "learning" && page !== "coverage" && page !== "map-debug" && page !== "rag-eval" && page !== "ai-debug" && page !== "ai-history" && (
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
          </div>
        </header>

        {previousPage && previousPage !== page && page !== "home" && (
          <div className="page-return-row">
            <button className="back-button" type="button" onClick={returnToPreviousPage}>
              <ArrowLeft size={18} />
              返回上一页：{previousPageLabel}
            </button>
          </div>
        )}

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
            <span>{chinaMapMode === "political" ? "157郡界地图" : chinaMapMode === "commandery" ? "157郡界地图" : (chinaMapLayer?.title ?? chinaRegionEra.title)}</span>
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
            <span>{compareStartYear}-{compareEndYear} 年 · {compareCandidateEvents.length} 条候选事件</span>
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
          <section className="overview-stage" aria-label={t.pageTitle.home ?? "World history overview"}>
            <div className="overview-map-panel">
              <div className="overview-map-header">
                <div>
                  <p className="kicker">{locale === "zh" ? "世界时间轴" : "Global Timeline"}</p>
                  <h2>{formatHistoricalYearWithEra(overviewYear)}</h2>
                  <span>{activeOverviewPeriod.title}</span>
                </div>
                <button
                  className={`back-button ${activeOverviewTimelineEra?.status === "complete" ? "active" : ""}`}
                  type="button"
                  onClick={() => enterOverviewEra(activeOverviewTimeline, activeOverviewTimelineEra, overviewYear)}
                >
                  <MapPinned size={18} />
                  {t.common.openPeriod}
                </button>
              </div>

              <div className="overview-world-canvas" aria-label={t.common.roughWorldMap}>
                <OverviewWorldMap />
                {activeOverviewMapRegions.map((region) => (
                  <span
                    className="overview-region-zone"
                    key={`${region.timelineId}-${region.label}-zone`}
                    style={getOverviewRegionZoneStyle(activeOverviewPeriod, region)}
                    aria-hidden="true"
                  />
                ))}
                {activeOverviewMapRegions.map((region, index) => (
                  <button
                    className={`overview-map-pin ${region.tier !== "core" ? "secondary" : ""}`}
                    key={`${region.timelineId}-${region.label}`}
                    style={
                      {
                        "--period-color": region.color,
                        ...getOverviewRegionPosition(activeOverviewPeriod, region),
                      } as React.CSSProperties
                    }
                    type="button"
                    title={region.summary}
                    onClick={() => setOverviewTimelineId(region.timelineId)}
                    onDoubleClick={() => {
                      const timeline = getOverviewRegionTimeline(region.timelineId);
                      enterOverviewEra(timeline, getOverviewTimelineEra(timeline, overviewYear), overviewYear);
                    }}
                  >
                    <span>{index + 1}</span>
                    <strong aria-hidden="true">{region.label}</strong>
                  </button>
                ))}
              </div>

              <div className="overview-slider-card">
                <div className="overview-year-readout">
                  <CalendarDays size={19} aria-hidden="true" />
                  <strong>{formatHistoricalYearWithEra(overviewYear)}</strong>
                  <label className="overview-timeline-select">
                    <span>时间条</span>
                    <select
                      aria-label="选择区域时间条"
                      value={overviewTimelineId}
                      onChange={(event) => setOverviewTimelineId(event.target.value)}
                    >
                      {overviewRegionTimelines.map((timeline) => (
                        <option key={timeline.id} value={timeline.id}>
                          {timeline.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="overview-period-track">
                  {activeOverviewTimeline?.eras
                    .filter((era) => era.endYear >= overviewYearMin && era.startYear <= overviewYearMax)
                    .map((era) => {
                      const start = Math.max(era.startYear, overviewYearMin);
                      const end = Math.min(era.endYear, overviewYearMax);
                      const left = getOverviewYearPercent(start);
                      const width = Math.max(0.4, getOverviewYearPercent(end) - left);
                      const isActive = activeOverviewTimelineEra?.id === era.id;
                      const formalRange = era.formalStartYear !== undefined || era.formalEndYear !== undefined
                        ? `严格政权范围：${era.formalStartYear !== undefined ? formatHistoricalYear(era.formalStartYear) : "不适用"}-${era.formalEndYear !== undefined ? formatHistoricalYear(era.formalEndYear) : "不适用"}`
                        : "严格政权范围：不适用";
                      const tooltip = [
                        `${era.title}`,
                        `叙事阶段范围：${formatHistoricalYear(era.startYear)}-${formatHistoricalYear(era.endYear)}`,
                        formalRange,
                        era.sourceStartYear !== undefined ? `叙事/史书起点：${formatHistoricalYear(era.sourceStartYear)}` : "",
                        era.keyCause ? `关键起因：${era.keyCause}` : "",
                        era.keyClimax ? `高潮：${era.keyClimax}` : "",
                        era.keyResult ? `结果：${era.keyResult}` : "",
                        era.sources?.length ? `主要史书或资料：${era.sources.join("、")}` : "",
                        era.summary ?? "",
                      ].filter(Boolean).join("\n");
                      return (
                        <button
                          className={`overview-period-band ${isActive ? "selected" : ""} ${era.status ?? "planned"}`}
                          key={era.id}
                          style={{ left: `${left}%`, width: `${width}%`, "--period-color": era.color } as React.CSSProperties}
                          type="button"
                          title={tooltip}
                          onClick={() => focusOverviewTimelineEra(era)}
                        >
                          <span>{isActive ? era.title : ""}</span>
                        </button>
                      );
                    })}
                  {overviewGlobalAnchors
                    .filter((anchor) => anchor.year >= overviewYearMin && anchor.year <= overviewYearMax)
                    .map((anchor) => (
                      <span
                        className={`overview-global-anchor ${anchor.importance ?? "major"}`}
                        key={anchor.id}
                        style={{ left: `${getOverviewYearPercent(anchor.year)}%` } as React.CSSProperties}
                        title={`${anchor.title} · ${formatHistoricalYear(anchor.year)}`}
                      />
                    ))}
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
                  <span>前 900</span>
                  <span>前 221</span>
                  <span>184</span>
                  <span>755</span>
                  <span>1279</span>
                  <span>1912</span>
                </div>
              </div>
            </div>

            <aside className="detail-panel overview-detail-panel" aria-label={locale === "zh" ? "总览相关信息" : "Overview related information"}>
              <div className="region-detail overview-period-card" style={{ "--period-color": activeOverviewPeriod.color } as React.CSSProperties}>
                <div className="detail-eyebrow" style={{ color: activeOverviewPeriod.color }}>
                  <Info size={18} aria-hidden="true" />
                  <span>{getPeriodStatusLabel(activeOverviewPeriod.status)}</span>
                </div>
                <h2>{activeOverviewPeriod.title}</h2>
                <p>{activeOverviewPeriod.summary}</p>
                <div className="overview-period-meta">
                  <strong>{formatHistoricalYear(activeOverviewPeriod.startYear)}-{formatHistoricalYear(activeOverviewPeriod.endYear)}</strong>
                  <small>{activeOverviewPeriod.focusRegions.filter((region) => region.tier === "core").map((region) => region.label).join(" / ")}</small>
                </div>
              </div>

              {activeOverviewTimelineEra && (
                <section className="detail-section overview-context-list">
                  <h3>{activeOverviewTimeline?.label ?? "区域时间条"}</h3>
                  <p>
                    <strong>{activeOverviewTimelineEra.title}</strong>
                    {" · "}
                    {formatHistoricalYear(activeOverviewTimelineEra.startYear)}-{formatHistoricalYear(activeOverviewTimelineEra.endYear)}
                  </p>
                  <p>{activeOverviewTimelineEra.summary}</p>
                  {(activeOverviewTimelineEra.formalStartYear !== undefined || activeOverviewTimelineEra.formalEndYear !== undefined) && (
                    <p>
                      严格政权范围：
                      {activeOverviewTimelineEra.formalStartYear !== undefined ? formatHistoricalYear(activeOverviewTimelineEra.formalStartYear) : "不适用"}
                      -
                      {activeOverviewTimelineEra.formalEndYear !== undefined ? formatHistoricalYear(activeOverviewTimelineEra.formalEndYear) : "不适用"}
                    </p>
                  )}
                </section>
              )}

              <section className="detail-section overview-snapshot-list">
                <h3>{t.common.snapshotYears}</h3>
                <div>
                  {activeOverviewPeriod.snapshotYears
                    .filter((snapshotYear) => snapshotYear >= overviewYearMin && snapshotYear <= overviewYearMax)
                    .map((snapshotYear) => (
                      <button
                        className={snapshotYear === activeOverviewSnapshotYear ? "selected" : ""}
                        key={`${activeOverviewPeriod.id}-${snapshotYear}`}
                        type="button"
                        onClick={() => setOverviewYear(snapshotYear)}
                        onDoubleClick={() => enterOverviewEra(activeOverviewTimeline, activeOverviewTimelineEra, snapshotYear)}
                      >
                        {formatHistoricalYear(snapshotYear)}
                      </button>
                    ))}
                </div>
              </section>

              <section className="detail-section overview-context-list">
                <h3>{t.common.contextNotes}</h3>
                {activeOverviewPeriod.context.map((contextItem, index) => (
                  <p key={`${activeOverviewPeriod.id}-context-${index}`}>{contextItem}</p>
                ))}
              </section>
            </aside>
          </section>
        ) : page === "learning" ? (
          <section className="learning-stage" aria-label={locale === "zh" ? "190-310 学习模式" : "190-310 learning mode"}>
            <div className="learning-hero">
              <div>
                <p className="kicker">{locale === "zh" ? "范例时期" : "Model Period"}</p>
                <h2>{locale === "zh" ? "190-310：从三国形成到罗马三世纪危机" : "190-310: From the Three Kingdoms to Rome's Third-Century Crisis"}</h2>
                <p>
                  {locale === "zh"
                    ? "这个页面把地图、事件、人物、史料、AI 问答和覆盖度检查串成一条学习路径。后续每个正式时间段都应按这个结构复用。"
                    : "This page turns maps, events, people, evidence, AI Q&A, and coverage checks into one learning path. Future formal periods should reuse this structure."}
                </p>
              </div>
              <div className="learning-hero-metrics">
                <EvidenceField label={locale === "zh" ? "时间跨度" : "span"} value="120" />
                <EvidenceField label={locale === "zh" ? "主线" : "threads"} value={learningEventGroups.length} />
                <EvidenceField label={locale === "zh" ? "必看事件" : "core events"} value={learningRequiredEvents.length} />
                <EvidenceField label={locale === "zh" ? "关键人物" : "people"} value={learningPeople.length} />
              </div>
            </div>

            <div className="learning-layout">
              <div className="learning-main">
                <article className="learning-card learning-path-card">
                  <header>
                    <span>01</span>
                    <div>
                      <h3>{locale === "zh" ? "先看全局" : "Start with the whole picture"}</h3>
                      <p>{locale === "zh" ? "拖时间条理解同年格局，再进入事件对比。" : "Use the year slider to understand the same-year layout, then compare events."}</p>
                    </div>
                  </header>
                  <div className="learning-action-row">
                    <button className="primary-action" type="button" onClick={returnToWorld}>
                      <MapPinned size={18} aria-hidden="true" />
                      {locale === "zh" ? "打开同年地图" : "Open Year Map"}
                    </button>
                    <button className="secondary-action" type="button" onClick={openEventComparison}>
                      <CircleDot size={18} aria-hidden="true" />
                      {locale === "zh" ? "事件对比" : "Compare Events"}
                    </button>
                  </div>
                </article>

                <article className="learning-card">
                  <header>
                    <span>02</span>
                    <div>
                      <h3>{locale === "zh" ? "关键年份" : "Anchor Years"}</h3>
                      <p>{locale === "zh" ? "这些年份是本时期讲解、地图快照和问答的骨架。" : "These years form the backbone for maps, narration, and Q&A."}</p>
                    </div>
                  </header>
                  <div className="learning-year-grid">
                    {learningYearAnchors.map((anchor) => (
                      <button
                        key={`learning-year-${anchor.year}`}
                        type="button"
                        onClick={() => {
                          setYear(anchor.year);
                          setPage("world");
                        }}
                      >
                        <strong>{anchor.year}</strong>
                        <span>{anchor.label}</span>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="learning-card">
                  <header>
                    <span>03</span>
                    <div>
                      <h3>{locale === "zh" ? "三条主线" : "Three Threads"}</h3>
                      <p>{locale === "zh" ? "每条线都能点进地图事件，也能进入证据图谱。" : "Each thread can open map events or the evidence graph."}</p>
                    </div>
                  </header>
                  <div className="learning-lanes">
                    {learningEventGroups.map((group) => (
                      <section className="learning-lane" key={group.id}>
                        <h4>{group.label}</h4>
                        <p>{group.summary}</p>
                        <div className="learning-event-list">
                          {group.events.map((event) => {
                            const display = getEventDisplayTitle(event, locale);
                            return (
                              <button key={event.id} type="button" onClick={() => openLearningEvent(event.id)}>
                                <span>{event.startYear}</span>
                                <strong>{display.primary}</strong>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </article>
              </div>

              <aside className="learning-side">
                <article className="learning-card">
                  <header>
                    <span>04</span>
                    <div>
                      <h3>{locale === "zh" ? "关键人物" : "Key People"}</h3>
                      <p>{locale === "zh" ? "人物页可继续看生平、关系和年龄对比。" : "Open people pages for lives, relations, and age comparisons."}</p>
                    </div>
                  </header>
                  <div className="learning-people-grid">
                    {learningPeople.map((person) => (
                      <button
                        key={`learning-person-${person.id}`}
                        type="button"
                        onClick={() => {
                          selectPerson(person.id);
                          setPage("people");
                        }}
                      >
                        <strong>{person.name}</strong>
                        <span>{[person.life, person.primaryPolity].filter(Boolean).join(" · ")}</span>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="learning-card">
                  <header>
                    <span>05</span>
                    <div>
                      <h3>{locale === "zh" ? "史料入口" : "Evidence Entry"}</h3>
                      <p>{locale === "zh" ? "先用史料证据页查原文，再用图谱看断言和出处绑定。" : "Use evidence search for texts, then the graph for claims and source links."}</p>
                    </div>
                  </header>
                  <div className="learning-action-stack">
                    <button className="secondary-action" type="button" onClick={() => openEvidenceSearch(locale === "zh" ? "三国 西晋 罗马 萨珊" : "Three Kingdoms Jin Rome Sasanian")}>
                      <BookOpen size={18} aria-hidden="true" />
                      {locale === "zh" ? "检索史料" : "Search Evidence"}
                    </button>
                    <button className="secondary-action" type="button" onClick={() => openEvidenceGraph(learningRequiredEvents[0] ?? selectedEvent)}>
                      <Network size={18} aria-hidden="true" />
                      {locale === "zh" ? "打开证据图谱" : "Open Evidence Graph"}
                    </button>
                    <button className="secondary-action" type="button" onClick={openCoveragePanel}>
                      <Grid3x3 size={18} aria-hidden="true" />
                      {locale === "zh" ? "查看覆盖度" : "View Coverage"}
                    </button>
                  </div>
                </article>

                <article className="learning-card">
                  <header>
                    <span>06</span>
                    <div>
                      <h3>{locale === "zh" ? "AI 提问 / 自测" : "AI Q&A / Self-Test"}</h3>
                      <p>{locale === "zh" ? "问题会带年份和区域上下文，回答优先使用 SQLite 证据。" : "Questions include year and region context; answers prioritize SQLite evidence."}</p>
                    </div>
                  </header>
                  <div className="learning-question-list">
                    {learningQuestions.map((item) => (
                      <button
                        key={item.question}
                        type="button"
                        onClick={() => askLearningQuestion(item.question, item.region, item.year)}
                      >
                        {item.question}
                      </button>
                    ))}
                  </div>
                </article>
              </aside>
            </div>
          </section>
        ) : page === "ai-history" ? (
          <section className="evidence-stage ai-history-stage" aria-label={locale === "zh" ? "AI 回答记录" : "AI answer history"}>
            <div className="evidence-summary">
              <div>
                <p className="kicker">{locale === "zh" ? "AI / RAG 记录" : "AI / RAG History"}</p>
                <h2>{locale === "zh" ? "历史提问、回答、引用与评分" : "Past Questions, Answers, Citations, and Scores"}</h2>
                <p>
                  {locale === "zh"
                    ? "这里读取 SQLite 中保存的 AI 回答，不会重新调用模型。用于复核每次回答是否基于内部证据，以及红黄绿质量状态。"
                    : "This reads saved AI answers from SQLite and does not call the model again. Use it to review evidence use and quality grades."}
                </p>
              </div>
              <div className="coverage-metrics">
                <EvidenceField label={locale === "zh" ? "记录总数" : "total"} value={aiHistory?.total ?? 0} />
                <EvidenceField label={locale === "zh" ? "当前显示" : "shown"} value={aiHistory?.answers.length ?? 0} />
              </div>
            </div>

            {aiHistoryStatus === "loading" ? (
              <div className="empty-state">{locale === "zh" ? "正在读取 AI 回答记录..." : "Loading AI answer history..."}</div>
            ) : aiHistoryStatus === "error" || !aiHistory ? (
              <div className="empty-state">{locale === "zh" ? "AI 回答记录 API 暂时不可用。" : "AI answer history API is unavailable."}</div>
            ) : aiHistory.answers.length === 0 ? (
              <div className="empty-state">{locale === "zh" ? "还没有保存过 AI 回答。" : "No saved AI answers yet."}</div>
            ) : (
              <div className="ai-history-list">
                {aiHistory.answers.map((answer) => (
                  <article className={`ai-history-card ${answer.qualityChecks?.grade ?? "legacy"}`} key={answer.id}>
                    <header>
                      <div>
                        <span>
                          {new Date(answer.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")} · {answer.provider ?? "local"} / {answer.model ?? "no model"}
                        </span>
                        <h3>{answer.question || answer.id}</h3>
                      </div>
                      <strong>
                        {answer.qualityChecks
                          ? `${answer.qualityChecks.grade ?? "green"} ${answer.qualityChecks.score ?? 0}`.toUpperCase()
                          : (locale === "zh" ? "未评分" : "LEGACY")}
                      </strong>
                    </header>
                    <div className="ai-source-policy">
                      <span>{locale === "zh" ? `内部证据 ${answer.citationCount}` : `Internal evidence ${answer.citationCount}`}</span>
                      <span>{locale === "zh" ? `未引用样本 ${answer.qualityChecks?.uncitedClaimSamples.length ?? 0}` : `Uncited samples ${answer.qualityChecks?.uncitedClaimSamples.length ?? 0}`}</span>
                      <span>{answer.context?.region ?? "all"} {answer.context?.year ?? ""}</span>
                    </div>
                    <p className="ai-answer-text">{answer.answer}</p>
                    {answer.warnings.length > 0 && (
                      <div className="ai-quality-list yellow">
                        <strong>{locale === "zh" ? "Warnings" : "Warnings"}</strong>
                        <ul>
                          {answer.warnings.map((warning, index) => <li key={`${answer.id}-warning-${index}`}>{warning}</li>)}
                        </ul>
                      </div>
                    )}
                    {answer.citations.length > 0 && (
                      <details className="ai-citation-details">
                        <summary>{locale === "zh" ? "查看引用" : "View citations"}</summary>
                        <div className="ai-citation-list">
                          {answer.citations.map((citation, index) => (
                            <article key={`${answer.id}-citation-${index}-${citation.ref}-${citation.sourceId}-${citation.locator}`}>
                              <header>
                                <strong>{citation.ref}</strong>
                                <span>{[citation.sourceTitle ?? citation.sourceId, citation.locator].filter(Boolean).join(" · ")}</span>
                              </header>
                              {citation.quote && (
                                <p>
                                  <b>{locale === "zh" ? "原文" : "Original"}</b>
                                  {citation.quote}
                                </p>
                              )}
                              {citation.translation && (
                                <p>
                                  <b>{locale === "zh" ? "译文" : "Translation"}</b>
                                  {citation.translation}
                                </p>
                              )}
                            </article>
                          ))}
                        </div>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : page === "ai-debug" ? (
          <section className="evidence-stage ai-debug-stage ai-answer-stage" aria-label={locale === "zh" ? "AI 问答" : "AI Q&A"}>
            <div className="evidence-summary">
              <div>
                <p className="kicker">{locale === "zh" ? "AI / RAG 问答" : "AI / RAG Q&A"}</p>
                <h2>{locale === "zh" ? "基于 ChronoAtlas 史料回答" : "Evidence-Bound ChronoAtlas Answers"}</h2>
                <p>
                  {locale === "zh"
                    ? "直接提问。页面只展示回答和相关证据摘要；技术检索细节不放在默认界面。"
                    : "Ask directly. This page shows the answer and relevant evidence only; technical retrieval details are kept out of the default view."}
                </p>
              </div>
              <div className="coverage-metrics">
                <EvidenceField label={locale === "zh" ? "相关证据" : "evidence"} value={aiDebugResult?.items.length ?? 0} />
                <EvidenceField label={locale === "zh" ? "外部网页" : "external web"} value={0} />
              </div>
            </div>

            <div className="ai-debug-form">
              <div className="ai-source-policy" aria-label={locale === "zh" ? "回答来源规则" : "answer source rules"}>
                <span>{locale === "zh" ? "主知识库：ChronoAtlas SQLite" : "Primary: ChronoAtlas SQLite"}</span>
                <span>{locale === "zh" ? "外部网页：默认 0" : "External web: 0 by default"}</span>
                <span>{locale === "zh" ? "背景常识：少量、标准、需标注" : "Background: brief, standard, labeled"}</span>
              </div>
              <label>
                <span>{locale === "zh" ? "问题" : "Question"}</span>
                <textarea
                  value={aiDebugQuestion}
                  onChange={(event) => {
                    setAiDebugQuestion(event.target.value);
                    setAiDebugEventId("");
                    setAiDebugPersonId("");
                  }}
                  rows={3}
                />
              </label>
              <div className="ai-debug-grid">
                <label>
                  <span>eventId</span>
                  <input
                    value={aiDebugEventId}
                    onChange={(event) => setAiDebugEventId(event.target.value)}
                    placeholder="china-208-red-cliffs"
                  />
                </label>
                <label>
                  <span>personId</span>
                  <input
                    value={aiDebugPersonId}
                    onChange={(event) => setAiDebugPersonId(event.target.value)}
                    placeholder="liu-bei / person:liu-bei"
                  />
                </label>
                <label>
                  <span>{locale === "zh" ? "区域" : "Region"}</span>
                  <select value={aiDebugRegion} onChange={(event) => setAiDebugRegion(event.target.value as EvidenceRegionFilter)}>
                    <option value="all">{locale === "zh" ? "不限制" : "Any"}</option>
                    {worldComparisonRegionOrder.map((regionId) => (
                      <option key={regionId} value={regionId}>{regions.find((region) => region.id === regionId)?.label ?? regionId}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{locale === "zh" ? "年份" : "Year"}</span>
                  <input
                    value={aiDebugYear}
                    onChange={(event) => setAiDebugYear(event.target.value)}
                    inputMode="numeric"
                    placeholder="208"
                  />
                </label>
              </div>
              <div className="ai-debug-actions">
                <button className="primary-action" type="button" onClick={runAiDebugRetrieve} disabled={aiDebugStatus === "loading"}>
                  <Search size={18} aria-hidden="true" />
                  {aiDebugStatus === "loading" ? (locale === "zh" ? "检索中..." : "Retrieving...") : (locale === "zh" ? "检索证据" : "Retrieve Evidence")}
                </button>
                <button className="primary-action" type="button" onClick={runAiEvidenceAnswer} disabled={aiAnswerStatus === "loading"}>
                  <Network size={18} aria-hidden="true" />
                  {aiAnswerStatus === "loading" ? (locale === "zh" ? "生成中..." : "Answering...") : (locale === "zh" ? "生成回答" : "Generate Answer")}
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => {
                    setAiDebugQuestion(getEventDisplayTitle(selectedEvent, locale).primary);
                    setAiDebugEventId(selectedEvent.id);
                    setAiDebugRegion(selectedEvent.region);
                    setAiDebugYear(String(selectedEvent.startYear));
                  }}
                >
                  {locale === "zh" ? "使用当前事件" : "Use Current Event"}
                </button>
              </div>
            </div>

            {aiDebugStatus === "idle" ? (
              <div className="empty-state">{locale === "zh" ? "填写问题和上下文后检索证据。" : "Enter a question and context, then retrieve evidence."}</div>
            ) : aiDebugStatus === "error" ? (
              <div className="empty-state">{locale === "zh" ? "AI 检索 API 暂时不可用或问题为空。" : "AI retrieval API is unavailable or the question is empty."}</div>
            ) : aiDebugResult ? (
              <div className="ai-debug-results">
                {(aiAnswerStatus === "loading" || aiAnswerStatus === "error" || aiAnswerResult) && (
                  <article className="coverage-card ai-answer-card">
                    <header>
                      <div>
                        <span>{locale === "zh" ? "AI 回答" : "AI Answer"}</span>
                        <h3>{aiAnswerResult ? `${aiAnswerResult.provider ?? "local"} / ${aiAnswerResult.model ?? "no model"}` : aiAnswerStatus}</h3>
                      </div>
                      <strong>{aiAnswerResult?.citations.length ?? 0} refs</strong>
                    </header>
                    {aiAnswerStatus === "loading" ? (
                      <p>{locale === "zh" ? "正在基于召回证据生成回答..." : "Generating an evidence-bound answer..."}</p>
                    ) : aiAnswerStatus === "error" ? (
                      <p>{aiAnswerError ?? (locale === "zh" ? "生成回答失败" : "Answer generation failed")}</p>
                    ) : aiAnswerResult ? (
                      <>
                        <div className="ai-source-policy" aria-label={locale === "zh" ? "回答来源分级" : "answer source policy"}>
                          <span>{locale === "zh" ? `内部证据 ${aiAnswerResult.citations.length}` : `Internal evidence ${aiAnswerResult.citations.length}`}</span>
                          <span>{locale === "zh" ? "外部网页 0" : "External web 0"}</span>
                          <span>{locale === "zh" ? "背景常识 少量且需标注" : "Background brief and labeled"}</span>
                        </div>
                        {aiAnswerResult.qualityChecks && (
                          <div className={`ai-quality-list ${aiAnswerResult.qualityChecks.grade ?? (aiAnswerResult.qualityChecks.passed ? "green" : "yellow")}`}>
                            <strong>
                              {aiAnswerResult.qualityChecks.grade === "red"
                                ? (locale === "zh" ? "红：引用风险较高" : "Red: citation risk")
                                : aiAnswerResult.qualityChecks.grade === "yellow"
                                  ? (locale === "zh" ? "黄：需要复核" : "Yellow: review needed")
                                  : (locale === "zh" ? "绿：引用检查通过" : "Green: citation check passed")}
                            </strong>
                            <span>
                              {locale === "zh"
                                ? `评分 ${aiAnswerResult.qualityChecks.score ?? 0}；已引用 ${aiAnswerResult.qualityChecks.internalEvidenceCitationCount} 条内部证据，外部网页 ${aiAnswerResult.qualityChecks.externalWebSourceCount}`
                                : `Score ${aiAnswerResult.qualityChecks.score ?? 0}; ${aiAnswerResult.qualityChecks.internalEvidenceCitationCount} internal refs cited, ${aiAnswerResult.qualityChecks.externalWebSourceCount} external web sources`}
                            </span>
                            {aiAnswerResult.qualityChecks.uncitedClaimSamples.length > 0 && (
                              <ul>
                                {aiAnswerResult.qualityChecks.uncitedClaimSamples.map((sample, index) => (
                                  <li key={`uncited-claim-${index}`}>{sample}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        <p className="ai-answer-text">{aiAnswerResult.answer}</p>
                        {aiAnswerResult.citations.length > 0 && (
                          <div className="coverage-examples">
                            <div>
                              <span>citations</span>
                              {aiAnswerResult.citations.slice(0, 8).map((citation, index) => (
                                <p key={`answer-citation-${index}-${citation.ref}-${citation.sourceId}-${citation.locator}`}>
                                  {citation.ref}: {[citation.sourceId, citation.locator].filter(Boolean).join(" · ") || citation.subjectId}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </article>
                )}
                {aiDebugResult.items.length > 0 && (
                  <details className="ai-related-evidence">
                    <summary>{locale === "zh" ? `相关证据 ${aiDebugResult.items.length}` : `Relevant Evidence ${aiDebugResult.items.length}`}</summary>
                    <div className="ai-related-list">
                      {aiDebugResult.items.slice(0, 6).map((item, index) => (
                        <article key={`related-${index}-${item.rank}-${item.chunkId ?? item.subjectId ?? item.sourceId}`}>
                          <header>
                            <strong>{item.title ?? item.sourceTitle ?? item.subjectId ?? item.chunkId}</strong>
                            <span>{item.regionId ?? "n/a"} {item.timeStart ?? ""}</span>
                          </header>
                          <p>{item.translation ?? item.quote ?? item.snippet ?? item.locator ?? ""}</p>
                        </article>
                      ))}
                    </div>
                  </details>
                )}
                <article className="coverage-card ai-technical-panel">
                  <header>
                    <div>
                      <span>{locale === "zh" ? "检索策略" : "Query Plan"}</span>
                      <h3>{aiDebugResult.queryPlan.strategy}</h3>
                    </div>
                    <strong>{aiDebugResult.locale}</strong>
                  </header>
                  <div className="coverage-examples">
                    <div>
                      <span>steps</span>
                      <p>{aiDebugResult.queryPlan.steps.join(" -> ") || "none"}</p>
                    </div>
                    {aiDebugResult.warnings.length > 0 && (
                      <div>
                        <span>warnings</span>
                        {aiDebugResult.warnings.map((warning, index) => <p key={`ai-warning-${index}`}>{warning}</p>)}
                      </div>
                    )}
                  </div>
                </article>

                <div className="evidence-results ai-technical-panel">
                  {aiDebugResult.items.length ? aiDebugResult.items.map((item, index) => (
                    <article className="evidence-card" key={`debug-result-${index}-${item.rank}-${item.chunkId ?? item.subjectId ?? item.sourceId}`}>
                      <div className="evidence-card-heading">
                        <div>
                          <span>#{item.rank} · {item.reason ?? "unknown"} · score {item.score ?? "n/a"}</span>
                          <h3>{item.title ?? item.sourceTitle ?? item.subjectId ?? item.chunkId}</h3>
                        </div>
                        <strong>{item.regionId ?? "n/a"} {item.timeStart ?? ""}</strong>
                      </div>
                      <div className="evidence-card-standard">
                        <EvidenceField label="subject" value={[item.subjectTable, item.subjectId].filter(Boolean).join(": ")} />
                        <EvidenceField label="source_id" value={item.sourceId ?? "未绑定"} />
                        <EvidenceField label="source" value={[item.sourceTitle, item.locator].filter(Boolean).join(" · ")} />
                        <EvidenceField label="confidence" value={item.confidence ?? "unmarked"} />
                      </div>
                      {(item.quote || item.translation || item.snippet) && (
                        <details className="evidence-source-detail" open>
                          <summary>{locale === "zh" ? "证据内容" : "Evidence Content"}</summary>
                          {item.quote && <blockquote>{item.quote}</blockquote>}
                          {item.translation && <p>{item.translation}</p>}
                          {!item.translation && item.snippet && <p>{item.snippet}</p>}
                        </details>
                      )}
                    </article>
                  )) : (
                    <div className="empty-state">{locale === "zh" ? "没有召回证据。" : "No evidence retrieved."}</div>
                  )}
                </div>
              </div>
            ) : null}
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
              <>
                <article className="coverage-card map-debug-visual-card">
                  <header>
                    <div>
                      <span>{mapDebugData.controlDataset?.label ?? "control timeline"}</span>
                      <h3>{mapDebugYear} 年势力区块</h3>
                    </div>
                    <strong>{mapDebugDisplayFeatures.length} zones</strong>
                  </header>
                  <div className="map-debug-year-control">
                    <input
                      type="range"
                      min={mapDebugData.controlDataset?.time_start ?? 310}
                      max={mapDebugData.controlDataset?.time_end ?? 589}
                      value={mapDebugYear}
                      onChange={(event) => setMapDebugYear(Number(event.target.value))}
                      aria-label="地图调试年份"
                    />
                    <span>{mapDebugYear}</span>
                  </div>
                  <svg className="map-debug-preview" viewBox="0 0 760 360" role="img" aria-label={`${mapDebugYear} 年中国粗略势力区块`}>
                    <rect x="0" y="0" width="760" height="360" rx="8" />
                    {mapDebugDisplayFeatures.map((feature) => {
                      const ring = feature.coordinates?.[0] ?? [];
                      const points = ring
                        .map((point) => projectMapDebugPoint([point[0], point[1]]))
                        .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
                        .join(" ");
                      const labelPoint = feature.center ? projectMapDebugPoint(feature.center) : null;
                      return (
                        <g key={feature.id}>
                          <polygon
                            points={points}
                            fill={feature.activeControl?.color ?? "#8b8a80"}
                            stroke="#2b2217"
                            strokeWidth="1.4"
                            opacity={feature.approximate ? 0.82 : 0.95}
                          />
                          {labelPoint && (
                            <>
                              <text x={labelPoint[0]} y={labelPoint[1] - 5} textAnchor="middle">
                                {feature.name}
                              </text>
                              <text x={labelPoint[0]} y={labelPoint[1] + 12} textAnchor="middle" className="map-debug-controller-label">
                                {feature.activeControl?.controller ?? "无记录"}
                              </text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </article>
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
              </>
            )}
          </section>
        ) : page === "rag-eval" ? (
          <section className="coverage-stage rag-eval-stage" aria-label={locale === "zh" ? "RAG 评测" : "RAG evaluation"}>
            <div className="coverage-summary">
              <div>
                <p className="kicker">RAG eval</p>
                <h2>{locale === "zh" ? "证据召回质量仪表盘" : "Evidence Retrieval Quality Dashboard"}</h2>
                <p>
                  {locale === "zh"
                    ? "读取 SQLite 中保存的评测结果，查看每题分数、命中证据、失败原因和检索路径。"
                    : "Review saved SQLite evaluation runs, per-question scores, evidence hits, failure reasons, and retrieval plans."}
                </p>
              </div>
              <div className="coverage-metrics compact">
                <EvidenceField label={locale === "zh" ? "题目" : "questions"} value={ragEvalDetail?.summary.results ?? 0} />
                <EvidenceField label={locale === "zh" ? "均分" : "avg"} value={ragEvalDetail?.summary.averageScore ?? "n/a"} />
                <EvidenceField label={locale === "zh" ? "失败" : "failures"} value={ragEvalDetail?.summary.failures ?? 0} />
                <EvidenceField label={locale === "zh" ? "显示" : "shown"} value={visibleRagEvalResults.length} />
              </div>
            </div>

            <div className="rag-eval-toolbar">
              <div className="coverage-filter-bar compact" role="group" aria-label={locale === "zh" ? "选择评测 run" : "Select evaluation run"}>
                {ragEvalRuns.map((run) => (
                  <button
                    className={selectedRagEvalRunId === run.id ? "selected" : ""}
                    key={run.id}
                    type="button"
                    onClick={() => setSelectedRagEvalRunId(run.id)}
                  >
                    {new Date(run.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                    <small>{run.resultCount} / {run.averageScore ?? "n/a"}</small>
                  </button>
                ))}
              </div>
              <div className="coverage-filter-bar compact" role="group" aria-label={locale === "zh" ? "筛选结果" : "Filter results"}>
                {[
                  { id: "all", label: locale === "zh" ? "全部" : "All" },
                  { id: "failures", label: locale === "zh" ? "失败" : "Failures" },
                  { id: "low-score", label: locale === "zh" ? "低分" : "Low Score" },
                ].map((filter) => (
                  <button
                    className={ragEvalFilter === filter.id ? "selected" : ""}
                    key={filter.id}
                    type="button"
                    onClick={() => setRagEvalFilter(filter.id as typeof ragEvalFilter)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {ragEvalStatus === "loading" ? (
              <div className="empty-state">{locale === "zh" ? "正在读取评测结果..." : "Loading evaluation results..."}</div>
            ) : ragEvalStatus === "error" || !ragEvalDetail ? (
              <div className="empty-state">{locale === "zh" ? "RAG 评测 API 暂时不可用。" : "RAG evaluation API is unavailable."}</div>
            ) : (
              <>
                <div className="rag-eval-type-strip">
                  {Object.entries(ragEvalTypeCounts).map(([type, count]) => (
                    <span key={type}>
                      {type}
                      <strong>{count}</strong>
                    </span>
                  ))}
                </div>

                <div className="rag-eval-list">
                  {visibleRagEvalResults.map((result) => {
                    const scoreClass = result.failureType ? "fail" : result.scoreTotal >= 0.95 ? "pass" : "review";
                    const expectedSources = result.raw.expectedSources ?? [];
                    const retrievedSources = result.raw.retrievedSources ?? [];
                    const retrievedSubjects = result.raw.retrievedSubjects ?? [];
                    return (
                      <article className={`rag-eval-card ${scoreClass}`} key={result.questionId}>
                        <header>
                          <div>
                            <span>{result.questionType} · {result.regionId ?? "all"} · {result.questionId}</span>
                            <h3>{locale === "zh" ? result.questionZh : (result.questionEn ?? result.questionZh)}</h3>
                          </div>
                          <strong>{result.scoreTotal.toFixed(3)}</strong>
                        </header>
                        <div className="rag-eval-score-grid">
                          <EvidenceField label="retrieval" value={result.scoreRetrieval.toFixed(2)} />
                          <EvidenceField label="citation" value={result.scoreCitation.toFixed(2)} />
                          <EvidenceField label="factuality" value={result.scoreFactuality.toFixed(2)} />
                          <EvidenceField label="coverage" value={result.scoreCoverage.toFixed(2)} />
                        </div>
                        <div className="rag-eval-note-row">
                          <span>{result.failureType ?? (locale === "zh" ? "通过" : "pass")}</span>
                          <small>{result.judgeNote}</small>
                        </div>
                        <details className="rag-eval-detail">
                          <summary>{locale === "zh" ? "命中证据与检索路径" : "Evidence hits and query plan"}</summary>
                          <div className="rag-eval-detail-grid">
                            <div>
                              <span>expected</span>
                              <p>{[result.expectedSubjectId, ...(result.raw.expectedClaims ?? [])].filter(Boolean).join(" · ") || "none"}</p>
                            </div>
                            <div>
                              <span>expected sources</span>
                              <p>{expectedSources.length ? expectedSources.join(" · ") : "none"}</p>
                            </div>
                            <div>
                              <span>retrieved subjects</span>
                              <p>{retrievedSubjects.slice(0, 10).join(" · ") || "none"}</p>
                            </div>
                            <div>
                              <span>retrieved sources</span>
                              <p>{retrievedSources.slice(0, 10).join(" · ") || "none"}</p>
                            </div>
                            <div className="wide">
                              <span>query plan</span>
                              <p>{result.raw.queryPlan?.steps?.join(" -> ") || result.raw.queryPlan?.strategy || "none"}</p>
                            </div>
                          </div>
                        </details>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        ) : page === "coverage" ? (
          <section className="coverage-stage" aria-label={t.coverage.aria}>
            <div className="coverage-summary">
              <div>
                <p className="kicker">{t.coverage.kicker}</p>
                <h2>{t.coverage.title}</h2>
                <p>{t.coverage.summary}</p>
                <div className="coverage-filter-bar compact" role="group" aria-label={t.coverage.aria}>
                  {coveragePeriods.map((period) => (
                    <button
                      className={`event-filter-button ${coveragePeriodId === period.id ? "selected" : ""}`}
                      key={period.id}
                      type="button"
                      aria-pressed={coveragePeriodId === period.id}
                      onClick={() => setCoveragePeriodId(period.id)}
                    >
                      <span>{period.label[locale]}</span>
                    </button>
                  ))}
                </div>
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
                {coverageTemplateAudit && (
                  <article className={`coverage-template-card ${coverageTemplateAudit.pass ? "ok" : "warn"}`}>
                    <div>
                      <p className="kicker">{locale === "zh" ? "模板期验收" : "Template Audit"}</p>
                      <h3>{locale === "zh" ? "190-310 范例标准" : "190-310 Model Period Standard"}</h3>
                      <p>
                        {coverageTemplateAudit.pass
                          ? (locale === "zh"
                              ? "当前时期已满足事件、人物、证据、地图控制和 RAG 评测的模板期最低标准。"
                              : "This period meets the baseline standard for events, people, evidence, map control, and RAG evaluation.")
                          : (locale === "zh"
                              ? "当前时期还有模板期验收项未达标，优先处理下方失败项。"
                              : "This period still has failed template checks. Fix the failed items first.")}
                      </p>
                    </div>
                    <div className="coverage-template-metrics">
                      <EvidenceField
                        label={locale === "zh" ? "通过项" : "passed"}
                        value={`${coverageTemplateAudit.checks.length - coverageTemplateFailedChecks.length}/${coverageTemplateAudit.checks.length}`}
                      />
                      <EvidenceField
                        label="RAG"
                        value={`${coverageTemplateAudit.metrics.latestRagRun?.passed_questions ?? 0}/${coverageTemplateAudit.metrics.latestRagRun?.total_questions ?? coverageTemplateAudit.metrics.ragQuestions}`}
                      />
                      <EvidenceField
                        label={locale === "zh" ? "均分" : "avg"}
                        value={(coverageTemplateAudit.metrics.latestRagRun?.average_score ?? 0).toFixed(2)}
                      />
                      <EvidenceField
                        label={locale === "zh" ? "地图控制" : "map control"}
                        value={coverageTemplateAudit.metrics.mapControlRecords}
                      />
                    </div>
                    {coverageTemplateFailedChecks.length > 0 && (
                      <div className="coverage-template-failures">
                        {coverageTemplateFailedChecks.slice(0, 4).map((check) => (
                          <span key={check.id}>
                            {check.label}: {check.actual}/{check.threshold}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                )}

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
                            region.gaps.map((gap, index) => <p key={`${region.id}-gap-${index}`}>{gap}</p>)
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
        ) : page === "evidence-graph" ? (
          <section className="evidence-stage evidence-graph-stage" aria-label={locale === "zh" ? "证据图谱" : "Evidence graph"}>
            <div className="evidence-summary">
              <div>
                <p className="kicker">{locale === "zh" ? "证据图谱" : "Evidence Graph"}</p>
                <h2>{evidenceGraphData?.person?.label ?? evidenceGraphData?.event?.title ?? (locale === "zh" ? "证据图谱" : "Evidence Graph")}</h2>
                <p>
                  {locale === "zh"
                    ? "把事件或人物拆成可核查断言，并连接到原始出处、人物、政权和事件。"
                    : "Break an event or person into verifiable claims linked to source evidence, people, polities, and events."}
                </p>
              </div>
              <div className="evidence-quick-searches" aria-label={locale === "zh" ? "图谱事件切换" : "Evidence graph event switcher"}>
                <button type="button" onClick={() => openEvidenceGraph(selectedEvent)}>
                  {locale === "zh" ? "当前事件" : "Current event"}: {getEventDisplayTitle(selectedEvent, locale).primary}
                </button>
                {selectedPersonIndexItem && (
                  <button type="button" onClick={() => openPersonEvidenceGraph(selectedPersonIndexItem.id)}>
                    {locale === "zh" ? "当前人物" : "Current person"}: {selectedPersonIndexItem.name}
                  </button>
                )}
                {events
                  .filter((event) => ["china-208-red-cliffs", "rome-260-capture-of-valerian-by-shapur-i", "rome-sasanian-260-valerian-captured", "china-383-fei-river", "china-420-liu-yu-founds-song", "china-589-sui-conquers-chen"].includes(event.id))
                  .map((event) => (
                    <button key={event.id} type="button" onClick={() => openEvidenceGraph(event)}>
                      {getEventDisplayTitle(event, locale).primary}
                    </button>
                  ))}
              </div>
            </div>

            {evidenceGraphStatus === "loading" ? (
              <div className="empty-state">{locale === "zh" ? "正在读取证据图谱..." : "Loading evidence graph..."}</div>
            ) : evidenceGraphStatus === "error" || !evidenceGraphData ? (
              <div className="empty-state">{locale === "zh" ? "证据图谱 API 暂时不可用。" : "Evidence graph API is not available."}</div>
            ) : (
              <>
                <div className="coverage-metrics evidence-graph-metrics">
                  <EvidenceField label={locale === "zh" ? "断言" : "claims"} value={evidenceGraphData.summary.claims} />
                  <EvidenceField label={locale === "zh" ? "出处" : "sources"} value={evidenceGraphData.summary.sources} />
                  <EvidenceField label={locale === "zh" ? "关联对象" : "linked subjects"} value={evidenceGraphData.summary.linkedSubjects} />
                  {evidenceGraphData.person && <EvidenceField label={locale === "zh" ? "关联事件" : "linked events"} value={evidenceGraphData.summary.linkedEvents ?? evidenceGraphData.events?.length ?? 0} />}
                  <EvidenceField label={locale === "zh" ? "已审断言" : "reviewed"} value={evidenceGraphData.summary.reviewedClaims} />
                </div>

                <div className="evidence-graph-grid">
                  <article className="coverage-card evidence-graph-panel">
                    <header>
                      <div>
                        <span>{evidenceGraphData.person ? (locale === "zh" ? "人物" : "Person") : (locale === "zh" ? "事件" : "Event")}</span>
                        <h3>{evidenceGraphData.person?.label ?? evidenceGraphData.event?.title}</h3>
                      </div>
                    </header>
                    <p>{evidenceGraphData.person?.summary ?? evidenceGraphData.event?.summary}</p>
                    <div className="coverage-metrics compact">
                      <EvidenceField label={locale === "zh" ? "年份" : "year"} value={evidenceGraphData.person?.time_start ?? evidenceGraphData.event?.time_start ?? "?"} />
                      <EvidenceField label={locale === "zh" ? "区域" : "region"} value={regions.find((region) => region.id === (evidenceGraphData.person?.region_id ?? evidenceGraphData.event?.region_id))?.label ?? evidenceGraphData.person?.region_id ?? evidenceGraphData.event?.region_id} />
                      <EvidenceField label={locale === "zh" ? "状态" : "status"} value={evidenceGraphData.person?.review_status ?? evidenceGraphData.event?.review_status} />
                    </div>
                    {evidenceGraphData.person && evidenceGraphData.events?.length ? (
                      <div className="evidence-graph-mini-events">
                        {evidenceGraphData.events.map((event) => (
                          <button key={event.id} type="button" onClick={() => setEvidenceGraphTarget({ type: "event", id: event.id })}>
                            <span>{event.time_start ?? "?"}</span>
                            {event.title}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>

                  <article className="coverage-card evidence-graph-panel evidence-graph-claims">
                    <header>
                      <div>
                        <span>{locale === "zh" ? "历史断言" : "Claims"}</span>
                        <h3>{evidenceGraphData.person ? (locale === "zh" ? "此人物牵涉哪些可核查断言" : "Verifiable claims involving this person") : (locale === "zh" ? "该事件能被哪些话支撑" : "What this event asserts")}</h3>
                      </div>
                    </header>
                    <div className="evidence-graph-list">
                      {evidenceGraphData.claims.map((claim) => (
                        <div className="evidence-graph-claim" key={claim.id}>
                          <strong>{claim.statement}</strong>
                          <div>
                            <span>{claim.claimType}</span>
                            <span>{claim.confidence}</span>
                            <span>{claim.reviewStatus}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="coverage-card evidence-graph-panel">
                    <header>
                      <div>
                        <span>{locale === "zh" ? "出处" : "Sources"}</span>
                        <h3>{locale === "zh" ? "原文与定位" : "Text and locator"}</h3>
                      </div>
                    </header>
                    <div className="evidence-graph-list">
                      {evidenceGraphData.sources.map((source, index) => (
                        <div className="evidence-graph-source" key={`${source.claimId}-${source.sourceId ?? "source"}-${source.locator ?? index}`}>
                          <strong>{source.citationShort ?? source.sourceTitle ?? source.sourceId}</strong>
                          <span>{source.locator}</span>
                          {source.quote && <p>{source.quote}</p>}
                          {source.translation && <small>{source.translation}</small>}
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="coverage-card evidence-graph-panel">
                    <header>
                      <div>
                        <span>{locale === "zh" ? "关联对象" : "Linked Subjects"}</span>
                        <h3>{locale === "zh" ? "人物、政权、事件节点" : "People, polities, and event nodes"}</h3>
                      </div>
                    </header>
                    <div className="evidence-graph-subjects">
                      {evidenceGraphData.subjects
                        .filter((subject) => subject.subjectTable !== "events")
                        .map((subject) => (
                          <span key={`${subject.claimId}-${subject.subjectTable}-${subject.subjectId}-${subject.subjectRole}`}>
                            {subject.label}
                            <small>{subject.subjectRole}</small>
                          </span>
                        ))}
                    </div>
                  </article>
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
                        <EvidenceField label={t.evidencePage.source} value={[result.sourceTitle, result.locator].filter(Boolean).join(" · ")} />
                        <EvidenceField label={t.evidencePage.year} value={result.timeStart ?? (locale === "zh" ? "未定年" : "undated")} />
                        <EvidenceField label={t.evidencePage.people} value={<CompactEvidenceList values={[...new Set(relatedPeople)]} />} />
                        {(result.eventLabel || result.macroEvent) && <EvidenceField label={t.evidencePage.event} value={result.eventLabel ?? result.macroEvent} />}
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
                      <div className="evidence-card-actions">
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
                <h2>{year} 年同类事件对比</h2>
                <p>先选事件类型，再选择 2-3 个具体事件。不同类型不混比，概览性阶段条目不进入默认候选。</p>
              </div>
              <div className="age-index-metrics">
                <div>
                  <span>候选事件</span>
                  <strong>{compareCandidateEvents.length}</strong>
                </div>
                <div>
                  <span>已选对比</span>
                  <strong>{displayedCompareEvents.length}</strong>
                </div>
                <div>
                  <span>对比口径</span>
                  <strong>{eventCompareTypes.find((type) => type.id === eventCompareType)?.label}</strong>
                </div>
              </div>
            </div>

            <div className="event-compare-type-bar" role="group" aria-label="事件类型">
              {eventCompareTypes.map((type) => (
                <button
                  className={eventCompareType === type.id ? "selected" : ""}
                  key={type.id}
                  type="button"
                  aria-pressed={eventCompareType === type.id}
                  onClick={() => selectEventCompareType(type.id)}
                >
                  <strong>{type.label}</strong>
                  <span>{type.hint}</span>
                  <small>{compareCandidateCounts[type.id]}</small>
                </button>
              ))}
            </div>

            <div className="event-compare-filter-bar" aria-label="事件对比筛选">
              <label className="event-compare-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={eventCompareQuery}
                  placeholder="搜索事件、地点、人物、政权"
                  onChange={(event) => setEventCompareQuery(event.target.value)}
                />
              </label>
              <label>
                <span>起始</span>
                <input
                  type="number"
                  min={yearMin}
                  max={yearMax}
                  value={eventCompareStartYear}
                  onChange={(event) => setEventCompareStartYear(Number(event.target.value))}
                />
              </label>
              <label>
                <span>结束</span>
                <input
                  type="number"
                  min={yearMin}
                  max={yearMax}
                  value={eventCompareEndYear}
                  onChange={(event) => setEventCompareEndYear(Number(event.target.value))}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setEventCompareStartYear(Math.max(yearMin, year - 5));
                  setEventCompareEndYear(Math.min(yearMax, year + 5));
                }}
              >
                当前年前后 5 年
              </button>
              <button
                type="button"
                onClick={() => {
                  setEventCompareStartYear(yearMin);
                  setEventCompareEndYear(yearMax);
                }}
              >
                190-310 全段
              </button>
            </div>

            <div className="event-compare-workbench">
              <aside className="event-compare-picker">
                <header>
                  <span>{compareStartYear}-{compareEndYear} 年候选</span>
                  <strong>{eventCompareTypes.find((type) => type.id === eventCompareType)?.label}</strong>
                </header>
                <div className="event-compare-list">
                  {compareCandidateEvents.length ? (
                    compareCandidateEvents.slice(0, 18).map((event) => {
                      const region = regions.find((item) => item.id === event.region);
                      const isSelected = selectedCompareEventIds.includes(event.id);
                      return (
                        <article className={`event-compare-picker-item ${isSelected ? "selected" : ""}`} key={event.id}>
                          <button type="button" onClick={() => addCompareEvent(event)}>
                            <span>{event.startYear} · {region?.label ?? event.region}</span>
                            <strong>{getEventDisplayTitle(event, locale).primary}</strong>
                            <small>{isSelected ? "再次点击取消选择" : "点击加入对比"} · {getComparableEventKind(event)} · {event.locationName ?? event.places?.[0] ?? "地点未标注"}</small>
                          </button>
                          <button className="event-card-link" type="button" onClick={() => selectHistoricalEvent(event)}>
                            详情
                          </button>
                        </article>
                      );
                    })
                  ) : (
                    <div className="event-compare-empty">
                      <strong>暂无同类候选</strong>
                      <span>调整年份或打开“含小事件”再试。</span>
                    </div>
                  )}
                </div>
              </aside>

              <div className="event-compare-board">
                {displayedCompareEvents.length ? (
                  displayedCompareEvents.map((event) => {
                    const region = regions.find((item) => item.id === event.region);
                    const fields = getEventCompareFields(event, eventCompareType);
                    const isManual = selectedCompareEventIds.includes(event.id);
                    return (
                      <article className="event-compare-detail-card" key={event.id} style={{ "--accent": region?.accent ?? "#b94f32" } as React.CSSProperties}>
                        <header>
                          <div>
                            <span>{region?.label ?? event.region} · {formatYearRange(event)}</span>
                            <h3>{getEventDisplayTitle(event, locale).primary}</h3>
                          </div>
                          {isManual && (
                            <button type="button" onClick={() => removeCompareEvent(event.id)} aria-label={`移除对比：${getEventDisplayTitle(event, locale).primary}`}>
                              <X size={16} aria-hidden="true" />
                            </button>
                          )}
                        </header>
                        <div className="event-compare-field-grid">
                          {fields.map((field) => (
                            <div className={field.label === "结果" || field.label === "影响" || field.label === "后果" || field.label === "政策/行动" || field.label === "交涉内容" ? "wide" : ""} key={`${event.id}-${field.label}`}>
                              <span>{field.label}</span>
                              <p>{field.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="event-compare-actions">
                          <button className="event-card-link" type="button" onClick={() => openEventEvidence(event)}>
                            史料
                          </button>
                          <button className="event-card-link" type="button" onClick={() => selectHistoricalEvent(event)}>
                            打开事件
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="event-compare-empty">
                    <strong>选择左侧事件开始对比</strong>
                    <span>同类事件最多保留 3 个，便于横向看地点、人物、结果和影响。</span>
                  </div>
                )}
              </div>
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
                  <strong>{livingAgeComparisonItems.length}</strong>
                </div>
                <div>
                  <span>{t.agePage.selectedPeople}</span>
                  <strong>{selectedAgeComparisonItems.length}</strong>
                </div>
                <div>
                  <span>{t.agePage.currentYearEvents}</span>
                  <strong>{currentYearEvents.length}</strong>
                </div>
              </div>
            </div>

            {timelineDock}

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
                currentYearEvents.slice(0, 8).map((event) => {
                  const eventAgePersonIds = getAgeEventPersonIds(event);
                  const eventLinkedPersonCount = getEventLinkedPersonIds(event).length;
                  return (
                    <button
                      className="age-event-chip"
                      key={event.id}
                      type="button"
                      onClick={() => addAgeEventPeople(event)}
                    >
                      <strong>{event.title}</strong>
                      <span>{event.startYear} {t.common.yearSuffix} · {regions.find((region) => region.id === event.region)?.label ?? event.region}</span>
                      <small>
                        {locale === "zh"
                          ? `关联 ${eventLinkedPersonCount} 人 · 可算 ${eventAgePersonIds.length} 人`
                          : `${eventLinkedPersonCount} linked · ${eventAgePersonIds.length} age-ready`}
                      </small>
                    </button>
                  );
                })
              ) : (
                <span className="age-event-empty">{t.agePage.noEvents}</span>
              )}
            </div>

            <div className="age-workbench">
              <section className="age-selected-panel" aria-label={t.agePage.selectedPeople}>
                <header>
                  <div>
                    <span>{t.agePage.selectedPeople}</span>
                    <strong>{selectedAgeComparisonItems.length}</strong>
                  </div>
                  <p>{t.agePage.compareHint}</p>
                </header>
                {selectedAgeComparisonItems.length ? (
                  <div className="age-selected-list">
                    {selectedAgeComparisonItems.map(({ person, state }) => {
                      const lifeContext = ageLifeContextByPersonId.get(person.id);
                      return (
                        <article className={`age-card age-card-compact age-card-${state.category} ${state.precision === "estimated" ? "age-card-estimated" : ""}`} key={`selected-${person.id}`}>
                          <div className="age-card-heading">
                            <div>
                              <strong>{person.name}</strong>
                              <span>{getAgeRegionLabel(person.region)} · {person.polity}</span>
                            </div>
                            <em>{state.label}</em>
                          </div>
                          <div className="age-card-years">
                            <span>
                              {person.birthYearRange
                                ? `推断生年 ${person.birthYearRange.min}-${person.birthYearRange.max}`
                                : `${t.agePage.birthYear} ${person.birthYear}`}
                            </span>
                            <span>{person.deathYear ? `${t.agePage.deathYear} ${person.deathYear}` : t.agePage.unknownDeath}</span>
                          </div>
                          {person.agePrecision === "estimated" && <p className="age-estimate-note">{person.ageNote ?? "推断年龄，非精确生卒年"}</p>}
                          <div className="age-life-context">
                            <span>{lifeContext?.label ?? t.agePage.recentLife}</span>
                            <strong>{lifeContext ? `${lifeContext.year ?? "?"} ${t.common.yearSuffix} · ${lifeContext.title}` : t.agePage.noLifeContext}</strong>
                            {lifeContext && <p>{lifeContext.summary}</p>}
                          </div>
                          <div className="age-card-actions">
                            <button type="button" onClick={() => openAgePersonProfile(person)} title={t.agePage.openProfile} aria-label={`${t.agePage.openProfile}: ${person.name}`}>
                              <UserRound size={15} aria-hidden="true" />
                              <span>{t.agePage.openProfile}</span>
                            </button>
                            <button type="button" onClick={() => openEvidenceSearch(person.name, person.region === "all" ? "all" : person.region)} title={t.agePage.openEvidence} aria-label={`${t.agePage.openEvidence}: ${person.name}`}>
                              <BookOpen size={15} aria-hidden="true" />
                              <span>{t.agePage.openEvidence}</span>
                            </button>
                            <button type="button" onClick={() => openPersonEvidenceGraph(person.id)} title={t.agePage.openGraph} aria-label={`${t.agePage.openGraph}: ${person.name}`}>
                              <Network size={15} aria-hidden="true" />
                              <span>{t.agePage.openGraph}</span>
                            </button>
                            <button type="button" className="danger" onClick={() => removeAgePerson(person.id)} title={t.agePage.removePerson} aria-label={`${t.agePage.removePerson}: ${person.name}`}>
                              <X size={15} aria-hidden="true" />
                              <span>{t.agePage.removePerson}</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">{t.agePage.compareHint}</div>
                )}
              </section>

              <aside className="age-pool-panel" aria-label={t.agePage.livingPool}>
                <header>
                  <div>
                    <span>{t.agePage.livingPool}</span>
                    <strong>{candidateAgeComparisonItems.length}</strong>
                  </div>
                  <p>{t.agePage.poolHint}</p>
                </header>
                <div className="age-pool-list">
                  {candidateAgeComparisonItems.length ? (
                    candidateAgeComparisonItems.map(({ person, state }) => (
                      <article className={`age-pool-item ${state.precision === "estimated" ? "estimated" : ""}`} key={person.id}>
                        <div>
                          <strong>{person.name}</strong>
                          <span>{state.label} · {getAgeRegionLabel(person.region)} · {person.polity}</span>
                        </div>
                        <button type="button" onClick={() => addAgePerson(person.id)} title={t.agePage.addPerson} aria-label={`${t.agePage.addPerson}: ${person.name}`}>
                          <Plus size={15} aria-hidden="true" />
                          <span>{t.agePage.addPerson}</span>
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">{t.agePage.empty}</div>
                  )}
                </div>
              </aside>
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
                    onDoubleClick={() => openPersonEvidenceGraph(person.id)}
                  >
                    <span className="person-index-name">
                      <strong>{person.name}</strong>
                      {person.courtesyName && <small>字{person.courtesyName}</small>}
                    </span>
                    <span className="person-index-life">{person.life ?? "生卒未详"}</span>
                    <span className="person-index-polity">{getAgeRegionLabel(person.region)} · {person.primaryPolity}</span>
                    <span className="person-index-summary-text">{person.summary}</span>
                    <span className="person-index-card-stats">
                      <span>{person.source === "person-index" ? `${personLifeEventCounts.get(person.id) ?? 0} ${t.peoplePage.lifeEvents}` : t.peoplePage.calculableAge}</span>
                      <span>{person.source === "person-index" ? `${personRelationCounts.get(person.id) ?? 0} ${t.peoplePage.relations}` : getAgeRegionLabel(person.region)}</span>
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
                mapMode={chinaMapMode === "political" ? "commandery" : chinaMapMode}
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
                <h2>{year} 年的{detailPeriodContext.title}</h2>
                <p>
                  {detailPeriodContext.regionLabel}时间条 · {formatHistoricalYear(yearMin)}-{formatHistoricalYear(yearMax)}
                </p>
              </div>
              <div className="comparison-controls">
                <span>时间线显示当前详情期内各区域大型事件；空档优先显示主角动向。</span>
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

        {showTimelineDock && page !== "age" && timelineDock}
      </section>

      {showDetailPanel && (
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
              ? "三国郡界地图"
              : page === "china"
                ? (chinaMapLayer?.title ?? chinaRegionEra.title)
                : selectedRegionEra.title}
          </h2>
          <p className="detail-summary">
            {page === "people"
              ? (selectedPerson?.summary ?? "暂无选中人物")
              : page === "china" && chinaMapMode === "political"
              ? "以 190-280 年三国时期郡级区块为主地图，优先显示郡界与区块关系；控制权仅作为辅助颜色和右侧列表信息。"
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
                  <div className="person-card-actions">
                    <strong>{selectedPerson.life ?? "生卒未详"}</strong>
                    <button type="button" onClick={() => openPersonEvidenceGraph(selectedPerson.id)}>
                      {locale === "zh" ? "图谱" : "Graph"}
                    </button>
                  </div>
                </div>
                <div className="person-meta">
                  <span>{selectedPerson.primaryPolity}</span>
                  {selectedPerson.roles.map((role, index) => (
                    <span key={`${selectedPerson.id}-role-${index}-${role}`}>{role}</span>
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
                          {counterpart && (
                            <span className="relationship-counterpart-meta">
                              {getPersonRegionLabel(counterpart)} · {counterpart.primaryPolity}
                            </span>
                          )}
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
                  {selectedPerson.sourceRefs.map((ref, index) => (
                    <SourceRefLink key={`${selectedPerson.id}-source-ref-${index}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
                  ))}
                </div>
              </article>
            ) : (
              <div className="empty-state">暂无匹配人物</div>
            )}
          </section>
        )}

        {showRegionalEventSections && page === "china" && (chinaMapMode === "political" || chinaMapMode === "commandery") && (
          <section className="event-list">
            <h3>郡界区块</h3>
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

        {showRegionalEventSections && (
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

        {showRegionalEventSections && filteredRegionEvents.length > 0 && (
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

          <section className="detail-section ai-event-answer-panel">
            <div className="person-section-heading">
              <h3>
                <Network size={17} aria-hidden="true" />
                {locale === "zh" ? "AI 史料回答" : "AI Evidence Answer"}
              </h3>
              <button
                className="text-action"
                type="button"
                onClick={runSelectedEventAiAnswer}
                disabled={aiAnswerStatus === "loading"}
              >
                {aiAnswerStatus === "loading"
                  ? (locale === "zh" ? "生成中..." : "Answering...")
                  : (locale === "zh" ? "生成当前事件回答" : "Answer This Event")}
              </button>
            </div>
            {aiAnswerStatus === "error" ? (
              <p className="ai-event-answer-error">{aiAnswerError ?? (locale === "zh" ? "AI 回答生成失败" : "AI answer failed")}</p>
            ) : selectedEventAiAnswer ? (
              <div className="ai-event-answer">
                <div className="ai-source-policy" aria-label={locale === "zh" ? "回答来源分级" : "answer source policy"}>
                  <span>{locale === "zh" ? `内部证据 ${selectedEventAiAnswer.citations.length}` : `Internal evidence ${selectedEventAiAnswer.citations.length}`}</span>
                  <span>{locale === "zh" ? "外部网页 0" : "External web 0"}</span>
                  <span>
                    {selectedEventAiAnswer.qualityChecks?.passed
                      ? (locale === "zh" ? "引用检查通过" : "Citation check passed")
                      : (locale === "zh" ? "引用检查需复核" : "Citation check needs review")}
                  </span>
                </div>
                <p className="ai-answer-text">{selectedEventAiAnswer.answer}</p>
                {selectedEventAiAnswer.citations.length > 0 && (
                  <details className="ai-citation-details">
                    <summary>{locale === "zh" ? "查看引用原文/译文" : "View quoted evidence"}</summary>
                    <div className="ai-citation-list">
                      {selectedEventAiAnswer.citations.map((citation) => (
                        <article key={`${citation.ref}-${citation.sourceId}-${citation.locator}`}>
                          <header>
                            <strong>{citation.ref}</strong>
                            <span>{[citation.sourceTitle ?? citation.sourceId, citation.locator].filter(Boolean).join(" · ")}</span>
                          </header>
                          {citation.quote && (
                            <p>
                              <b>{locale === "zh" ? "原文" : "Original"}</b>
                              {citation.quote}
                            </p>
                          )}
                          {citation.translation && (
                            <p>
                              <b>{locale === "zh" ? "译文" : "Translation"}</b>
                              {citation.translation}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <p className="ai-event-answer-empty">
                {locale === "zh" ? "基于 SQLite 史料证据生成，不使用外部网页。" : "Generated from SQLite evidence; no external web sources."}
              </p>
            )}
          </section>

          {selectedEventDetail && (
            <section className="detail-section event-deep-detail">
              <div className="event-detail-heading">
                <h3>
                  <BookOpen size={17} aria-hidden="true" />
                  事件详解
                </h3>
                <span>{formatYearRange(selectedEvent)}</span>
              </div>
              <div className="event-detail-overview-card">
                <span>核心判断</span>
                <p>{selectedEventDetail.overview ?? selectedEvent.summary}</p>
                {hasDetailItems(selectedEventDetail.result) && (
                  <div className="event-detail-result-strip">
                    {selectedEventDetail.result!.slice(0, 2).map((item, index) => (
                      <strong key={`summary-result-${index}-${item}`}>{item}</strong>
                    ))}
                  </div>
                )}
              </div>
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
                  <div className="event-detail-flow">
                    {hasDetailItems(selectedEventDetail.background) && (
                      <article className="event-detail-flow-card">
                        <span>背景</span>
                        <p>{selectedEventDetail.background![0]}</p>
                      </article>
                    )}
                    {hasDetailItems(selectedEventDetail.result) && (
                      <article className="event-detail-flow-card">
                        <span>结果</span>
                        <ul>
                          {selectedEventDetail.result!.slice(0, 3).map((item, index) => (
                            <li key={`overview-result-${index}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                    {hasDetailItems(selectedEventDetail.impact) && (
                      <article className="event-detail-flow-card">
                        <span>影响</span>
                        <p>{selectedEventDetail.impact![0]}</p>
                      </article>
                    )}
                  </div>
                )}

                {eventDetailTab === "background" && (
                  <div className="event-detail-flow">
                    {selectedEventDetail.background?.map((item, index) => (
                      <article className="event-detail-flow-card" key={`background-${index}-${item}`}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{item}</p>
                      </article>
                    ))}
                  </div>
                )}

                {eventDetailTab === "process" && (
                  <div className="event-detail-flow">
                    {selectedEventDetail.process?.map((item, index) => (
                      <article className="event-detail-flow-card" key={`process-${index}-${item}`}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{item}</p>
                      </article>
                    ))}
                  </div>
                )}

                {eventDetailTab === "impact" && (
                  <div className="event-detail-grid two-column">
                    {hasDetailItems(selectedEventDetail.result) && (
                      <article>
                        <span>直接结果</span>
                        <ul>
                          {selectedEventDetail.result!.map((item, index) => (
                            <li key={`impact-result-${index}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                    {hasDetailItems(selectedEventDetail.impact) && (
                      <article>
                        <span>后续影响</span>
                        <ul>
                          {selectedEventDetail.impact!.map((item, index) => (
                            <li key={`impact-${index}-${item}`}>{item}</li>
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
                          {selectedEventDetail.sourceNotes!.map((item, index) => (
                            <li key={`source-note-${index}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                    {hasDetailItems(selectedEventDetail.uncertainty) && (
                      <article>
                        <span>不确定性</span>
                        <ul>
                          {selectedEventDetail.uncertainty!.map((item, index) => (
                            <li key={`uncertainty-${index}-${item}`}>{item}</li>
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
                selectedEvent.people.map((person, index) => <span key={`${person}-${index}`}>{person}</span>)
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
                  <div className="person-card-actions">
                    <strong>{selectedPerson.life ?? "生卒未详"}</strong>
                    <button type="button" onClick={() => openPersonEvidenceGraph(selectedPerson.id)}>
                      {locale === "zh" ? "图谱" : "Graph"}
                    </button>
                  </div>
                </div>
                <p>{selectedPerson.summary}</p>
                <div className="person-meta">
                  <span>{selectedPerson.primaryPolity}</span>
                  {selectedPerson.roles.map((role, index) => (
                    <span key={`${selectedPerson.id}-detail-role-${index}-${role}`}>{role}</span>
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
                          {counterpart && (
                            <span className="relationship-counterpart-meta">
                              {getPersonRegionLabel(counterpart)} · {counterpart.primaryPolity}
                            </span>
                          )}
                          <small>{formatYearSpan(relation.startYear, relation.endYear)}</small>
                          <span className="relationship-summary">{relation.summary}</span>
                          <span className="relationship-sources">
                            {relation.sourceRefs.slice(0, 2).map((ref, index) => (
                              <SourceRefLink interactive={false} key={`${relation.id}-ref-${index}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
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
                          {event.polities.slice(0, 2).map((polity, index) => (
                            <span key={`${event.id}-polity-${index}-${polity}`}>{polity}</span>
                          ))}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p>待补充人物事件</p>
                  )}
                </div>

                <div className="source-list compact">
                  {selectedPerson.sourceRefs.map((ref, index) => (
                    <SourceRefLink key={`${selectedPerson.id}-detail-source-ref-${index}-${ref.sourceId}-${ref.locator ?? ""}`} sourceRef={ref} />
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
                selectedEventSourceRefs.map((ref, index) => {
                  const source = chinaSourceById.get(ref.sourceId);

                  return (
                    <article className="source-item" key={`${selectedEvent.id}-source-ref-${index}-${ref.sourceId}-${ref.locator ?? ""}`}>
                      <SourceRefLink className="source-title-link" sourceRef={ref} />
                      <SourceExcerpt quote={ref.quote} />
                      {source?.note && <span>{source.note}</span>}
                    </article>
                  );
                })
              ) : selectedEvent.sources.length ? (
                selectedEvent.sources.map((source, index) => (
                  <article className="source-item" key={`${source}-${index}`}>
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

        {showRegionalEventSections && filteredRegionEvents.length === 0 && (
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

