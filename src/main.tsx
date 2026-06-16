import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110 from "world-atlas/countries-110m.json";
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
  focus: [number, number];
  labelOffset: [number, number];
  eras: Array<{
    startYear: number;
    endYear: number;
    title: string;
    summary: string;
    boundary: LonLat[];
  }>;
};

const events = eventsData as HistoricalEvent[];
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

const regions: RegionInfo[] = [
  {
    id: "rome",
    label: "罗马",
    accent: "#5b6fbb",
    focus: [13, 42],
    labelOffset: [-62, -56],
    eras: [
      {
        startYear: 180,
        endYear: 192,
        title: "康茂德时期",
        summary: "罗马仍控制地中海世界，但皇权威信和边境压力开始显出裂纹。",
        boundary: [
          [-10, 35],
          [-3, 51],
          [13, 55],
          [31, 48],
          [42, 38],
          [32, 28],
          [13, 29],
          [-5, 31],
          [-10, 35],
        ],
      },
      {
        startYear: 193,
        endYear: 234,
        title: "塞维鲁王朝",
        summary: "军队在皇位继承中的地位上升，帝国依靠军事财政维持广阔边境。",
        boundary: [
          [-9, 35],
          [-2, 51],
          [14, 54],
          [33, 48],
          [44, 38],
          [33, 28],
          [14, 29],
          [-5, 31],
          [-9, 35],
        ],
      },
      {
        startYear: 235,
        endYear: 280,
        title: "三世纪危机",
        summary: "罗马进入皇位频繁更替、边境战争、财政压力和地方割据交织的危机期。",
        boundary: [
          [-8, 35],
          [0, 50],
          [14, 53],
          [31, 47],
          [39, 38],
          [30, 29],
          [13, 30],
          [-4, 32],
          [-8, 35],
        ],
      },
    ],
  },
  {
    id: "sasanian-persia",
    label: "萨珊波斯",
    accent: "#168069",
    focus: [53, 32],
    labelOffset: [10, -48],
    eras: [
      {
        startYear: 180,
        endYear: 223,
        title: "安息末期",
        summary: "西亚仍处在安息传统的影响下，地方贵族和新兴波斯势力逐渐拉开距离。",
        boundary: [
          [42, 26],
          [48, 39],
          [62, 39],
          [72, 31],
          [63, 22],
          [48, 24],
          [42, 26],
        ],
      },
      {
        startYear: 224,
        endYear: 240,
        title: "萨珊建立",
        summary: "阿尔达希尔击败安息王朝，新的萨珊君主制开始重塑西亚政治秩序。",
        boundary: [
          [43, 25],
          [50, 40],
          [66, 39],
          [76, 30],
          [65, 22],
          [49, 24],
          [43, 25],
        ],
      },
      {
        startYear: 241,
        endYear: 280,
        title: "沙普尔扩张",
        summary: "萨珊波斯成为罗马东方强敌，战争、外交和边境城市构成时代主线。",
        boundary: [
          [39, 25],
          [50, 42],
          [70, 40],
          [79, 31],
          [66, 20],
          [47, 23],
          [39, 25],
        ],
      },
    ],
  },
  {
    id: "india",
    label: "印度次大陆",
    accent: "#9a6a16",
    focus: [78, 22],
    labelOffset: [12, 18],
    eras: [
      {
        startYear: 180,
        endYear: 219,
        title: "贵霜后期",
        summary: "贵霜仍连接印度西北、中亚和贸易网络，但控制力已不像早期那样稳固。",
        boundary: [
          [66, 25],
          [71, 38],
          [82, 36],
          [84, 29],
          [77, 22],
          [68, 23],
          [66, 25],
        ],
      },
      {
        startYear: 220,
        endYear: 260,
        title: "区域重组",
        summary: "印度西北和次大陆内部力量分化，贵霜影响力持续减弱。",
        boundary: [
          [67, 23],
          [73, 35],
          [85, 31],
          [87, 21],
          [82, 10],
          [72, 9],
          [67, 23],
        ],
      },
      {
        startYear: 261,
        endYear: 280,
        title: "地方化加深",
        summary: "更分散的区域政权和贸易网络成为理解三世纪印度次大陆的重要线索。",
        boundary: [
          [68, 22],
          [74, 34],
          [85, 29],
          [86, 19],
          [81, 11],
          [73, 10],
          [68, 22],
        ],
      },
    ],
  },
  {
    id: "china",
    label: "中国",
    accent: "#b94f32",
    focus: [112, 34],
    labelOffset: [18, -52],
    eras: [
      {
        startYear: 180,
        endYear: 189,
        title: "东汉末年",
        summary: "黄巾起义和中央权威衰退让地方军事力量迅速坐大。",
        boundary: [
          [95, 24],
          [104, 42],
          [121, 43],
          [125, 32],
          [121, 22],
          [109, 18],
          [95, 24],
        ],
      },
      {
        startYear: 190,
        endYear: 219,
        title: "军阀割据",
        summary: "董卓之乱后，各地军事集团竞争，曹操、刘备、孙权等势力逐渐成形。",
        boundary: [
          [99, 23],
          [106, 41],
          [122, 41],
          [125, 31],
          [119, 22],
          [108, 18],
          [99, 23],
        ],
      },
      {
        startYear: 220,
        endYear: 263,
        title: "三国形成",
        summary: "魏蜀吴格局确立，政权竞争、边境战争和制度重建同时展开。",
        boundary: [
          [100, 21],
          [108, 40],
          [123, 40],
          [125, 30],
          [120, 22],
          [110, 18],
          [100, 21],
        ],
      },
      {
        startYear: 264,
        endYear: 280,
        title: "走向统一",
        summary: "蜀汉灭亡后，司马氏控制下的魏晋权力转换推动统一进程。",
        boundary: [
          [102, 21],
          [110, 40],
          [123, 39],
          [124, 29],
          [119, 22],
          [111, 18],
          [102, 21],
        ],
      },
    ],
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

function getRegionEra(region: RegionInfo, year: number) {
  return (
    region.eras.find((era) => era.startYear <= year && era.endYear >= year) ??
    region.eras[region.eras.length - 1]
  );
}

function getBoundaryPath(boundary: LonLat[]) {
  const polygon: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [boundary],
    },
  };

  return path(polygon);
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
  regionCounts,
  year,
}: {
  activeRegion: Region;
  hoveredRegion: Region | null;
  onHover: (region: Region | null) => void;
  onSelect: (region: Region) => void;
  regionCounts: Record<Region, number>;
  year: number;
}) {
  return (
    <div className="map-frame" aria-label="世界地图总览">
      <svg className="world-map" viewBox="0 0 1000 520" role="img" aria-label="世界地图">
        {spherePath && <path className="sphere" d={spherePath} />}
        {graticulePath && <path className="graticule" d={graticulePath} />}
        <g>
          {countries.map((country, index) => {
            const d = path(country);
            return d ? <path className="country" d={d} key={index} /> : null;
          })}
        </g>

        {regions.map((region) => {
          const isActive = region.id === activeRegion;
          const isHovered = region.id === hoveredRegion;
          const point = projection(region.focus);
          const era = getRegionEra(region, year);
          const boundaryPath = getBoundaryPath(era.boundary);
          if (!point) {
            return null;
          }
          const [x, y] = point;
          const [labelX, labelY] = region.labelOffset;
          if (!boundaryPath) {
            return null;
          }

          return (
            <g key={region.id}>
              <path
                className={`historical-boundary ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
                d={boundaryPath}
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
              <circle
                className={`region-marker ${isActive ? "active" : ""}`}
                cx={x}
                cy={y}
                r="6"
                style={{ "--accent": region.accent } as React.CSSProperties}
              />
              <foreignObject
                x={x + labelX}
                y={y + labelY}
                width="142"
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
  const inspectedEra = getRegionEra(inspectedRegion, year);
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
            year={year}
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
              <span>{inspectedEra.title}</span>
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
