import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Compass,
  Info,
  Link2,
  MapPinned,
  Search,
  UsersRound,
} from "lucide-react";
import eventsData from "../data/events-180-280.sample.json";
import "./styles.css";

type Region = "china" | "rome" | "sasanian-persia" | "india";

type EventCategory = "politics" | "war" | "society" | "culture" | "economy";

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
  short: string;
  status: string;
  accent: string;
  mapLabel: { x: number; y: number };
  hotspot: { x: number; y: number; width: number; height: number };
};

const events = eventsData as HistoricalEvent[];

const regions: RegionInfo[] = [
  {
    id: "rome",
    label: "罗马",
    short: "帝国承压",
    status: "地中海世界仍由罗马帝国主导，军队、财政和边境压力正在积累。",
    accent: "#5b6fbb",
    mapLabel: { x: 46, y: 43 },
    hotspot: { x: 34, y: 32, width: 18, height: 18 },
  },
  {
    id: "sasanian-persia",
    label: "萨珊波斯",
    short: "西亚重组",
    status: "萨珊势力取代安息传统，成为罗马东方最重要的对手。",
    accent: "#168069",
    mapLabel: { x: 57, y: 47 },
    hotspot: { x: 52, y: 37, width: 13, height: 17 },
  },
  {
    id: "india",
    label: "印度次大陆",
    short: "区域化",
    status: "贵霜影响力减弱，印度西北与次大陆内部的区域力量逐渐重组。",
    accent: "#9a6a16",
    mapLabel: { x: 67, y: 58 },
    hotspot: { x: 63, y: 47, width: 12, height: 18 },
  },
  {
    id: "china",
    label: "中国",
    short: "三国形成",
    status: "东汉秩序崩溃后，魏蜀吴政治格局正在形成，地方军事集团成为主角。",
    accent: "#b94f32",
    mapLabel: { x: 78, y: 47 },
    hotspot: { x: 72, y: 35, width: 14, height: 19 },
  },
];

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

function getRegionSummary(region: RegionInfo, regionEvents: HistoricalEvent[], year: number) {
  const activeEvent = regionEvents.find((event) => isActiveInYear(event, year));
  const nearEvent = activeEvent ?? regionEvents[0];

  if (!nearEvent) {
    return `${year} 年附近，${region.label}区域还没有录入足够样例事件。`;
  }

  return `${year} 年附近：${nearEvent.title}。${region.status}`;
}

function WorldMap({
  activeRegion,
  hoveredRegion,
  onHover,
  onSelect,
  regionCounts,
}: {
  activeRegion: Region;
  hoveredRegion: Region | null;
  onHover: (region: Region | null) => void;
  onSelect: (region: Region) => void;
  regionCounts: Record<Region, number>;
}) {
  return (
    <div className="map-frame" aria-label="世界地图总览">
      <svg className="world-map" viewBox="0 0 1000 520" role="img" aria-label="简化世界地图">
        <path
          className="landmass"
          d="M87 184c47-48 122-52 176-27 35 16 61 44 105 39 44-6 63-39 112-45 48-7 91 15 130 9 48-8 76-53 134-51 75 3 127 72 116 142-8 51-52 81-105 78-48-3-69-30-116-20-50 10-72 50-122 50-55 0-76-48-127-43-48 5-74 50-128 43-47-6-70-44-113-50-43-7-72 19-105 3-40-19-32-91 43-128Z"
        />
        <path
          className="landmass secondary"
          d="M179 344c38 8 61 34 62 72 1 42-24 73-59 68-35-6-54-48-45-89 6-31 20-43 42-51Z"
        />
        <path
          className="landmass secondary"
          d="M739 330c46 4 78 35 73 70-4 30-33 51-67 45-42-7-70-47-58-79 8-22 26-38 52-36Z"
        />
        <path className="sea-line" d="M115 250c127 60 248 66 363 18 131-55 253-47 363 24" />
        <path className="sea-line" d="M318 135c76 36 152 39 229 8" />

        {regions.map((region) => {
          const isActive = region.id === activeRegion;
          const isHovered = region.id === hoveredRegion;
          return (
            <g key={region.id}>
              <rect
                className={`hotspot ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
                x={region.hotspot.x * 10}
                y={region.hotspot.y * 5.2}
                width={region.hotspot.width * 10}
                height={region.hotspot.height * 5.2}
                rx="28"
                style={{ "--accent": region.accent } as React.CSSProperties}
                onMouseEnter={() => onHover(region.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(region.id)}
                onBlur={() => onHover(null)}
                onClick={() => onSelect(region.id)}
                tabIndex={0}
                role="button"
                aria-label={`选择${region.label}`}
              />
              <foreignObject
                x={region.mapLabel.x * 10 - 58}
                y={region.mapLabel.y * 5.2 - 22}
                width="116"
                height="48"
                className="map-label"
                style={{ "--accent": region.accent } as React.CSSProperties}
              >
                <button type="button" onClick={() => onSelect(region.id)}>
                  <span>{region.label}</span>
                  <strong>{regionCounts[region.id]}</strong>
                </button>
              </foreignObject>
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
  const inspectedRegion = hoverRegionInfo ?? selectedRegionInfo;

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
            regionCounts={regionCounts}
          />

          <aside
            className="hover-summary"
            style={{ "--accent": inspectedRegion.accent } as React.CSSProperties}
            aria-live="polite"
          >
            <div className="summary-heading">
              <MapPinned size={18} aria-hidden="true" />
              <span>{hoverRegionInfo ? "悬停区域" : "选中区域"}</span>
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
              <span>{inspectedRegion.short}</span>
              <strong>{regionCounts[inspectedRegion.id]} 个事件</strong>
            </div>
          </aside>
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
          <h2>{selectedRegionInfo.short}</h2>
          <p className="detail-summary">{selectedRegionInfo.status}</p>
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
