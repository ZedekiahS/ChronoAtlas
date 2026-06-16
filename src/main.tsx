import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { curveCatmullRomClosed, line } from "d3-shape";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110 from "world-atlas/countries-110m.json";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  X,
  Compass,
  Info,
  Link2,
  MapPinned,
  Search,
  UsersRound,
} from "lucide-react";
import eventsData from "../data/events-180-280.sample.json";
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

const events = eventsData as HistoricalEvent[];
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

const categoryLabels: Record<EventCategory, string> = {
  politics: "政治",
  war: "战争",
  society: "社会",
  culture: "文化",
  economy: "经济",
};

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

function getBoundaryPath(boundary: LonLat[]) {
  const projectedPoints = boundary
    .slice(0, -1)
    .map((point) => projection(point))
    .filter((point): point is [number, number] => Boolean(point));

  if (projectedPoints.length < 3) {
    return null;
  }

  return line<[number, number]>()
    .x((point) => point[0])
    .y((point) => point[1])
    .curve(curveCatmullRomClosed.alpha(0.55))(projectedPoints);
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
}: {
  activeRegion: Region;
  hoveredRegion: Region | null;
  onHover: (region: Region | null) => void;
  onSelect: (region: Region) => void;
  onClearSummary: () => void;
  year: number;
}) {
  return (
    <div className="map-frame" aria-label="世界地图总览">
      <svg
        className="world-map"
        viewBox="0 0 1000 520"
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
          const boundaryGroups = getBoundaryGroups(region, era);

          return (
            <g key={region.id}>
              {boundaryGroups.map((group) => {
                const boundaryPath = getBoundaryPath(group.boundary);
                if (!boundaryPath) {
                  return null;
                }

                return (
                  <path
                    className={`historical-boundary confidence-${group.confidence} boundary-${group.boundaryType} ${
                      isActive ? "active" : ""
                    } ${isHovered ? "hovered" : ""}`}
                    d={boundaryPath}
                    key={group.id}
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
                    aria-label={`选择${region.label}：${group.label}`}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function App() {
  const [year, setYear] = useState(220);
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region>("china");
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [summaryRegion, setSummaryRegion] = useState<Region | null>("china");
  const [selectedId, setSelectedId] = useState("china-220-cao-pi-founds-wei");

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

  const selectedRegionEvents = visibleEvents.filter((event) => event.region === selectedRegion);
  const selectedEvent =
    selectedRegionEvents.find((event) => event.id === selectedId) ??
    selectedRegionEvents[0] ??
    events.find((event) => event.id === selectedId) ??
    events[0];

  const relatedEvents = selectedEvent.relatedEvents
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is HistoricalEvent => Boolean(event));

  function selectRegion(region: Region) {
    setSelectedRegion(region);
    setSummaryRegion(region);
    const firstEvent = visibleEvents.find((event) => event.region === region);
    if (firstEvent) {
      setSelectedId(firstEvent.id);
    }
  }

  return (
    <main className="app-shell">
      <section className="map-workspace">
        <header className="topbar">
          <div>
            <p className="kicker">ChronoAtlas</p>
            <h1>拖动时间，观察世界局势的同一瞬间</h1>
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

        <section className="map-stage">
          <WorldMap
            activeRegion={selectedRegion}
            hoveredRegion={hoveredRegion}
            onHover={setHoveredRegion}
            onSelect={selectRegion}
            onClearSummary={() => setSummaryRegion(null)}
            year={year}
          />

          {inspectedRegion && inspectedEra && (
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
          <div className="detail-eyebrow" style={{ color: selectedRegionInfo.accent }}>
            <Info size={18} aria-hidden="true" />
            <span>{selectedRegionInfo.label}</span>
          </div>
          <h2>{selectedRegionEra.title}</h2>
          <p className="detail-summary">{selectedRegionEra.summary}</p>
        </div>

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
              {[...selectedEvent.polities, ...selectedEvent.tags].map((tag) => (
                <span key={tag}>{tag}</span>
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
