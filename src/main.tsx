import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Compass,
  Link2,
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

const events = eventsData as HistoricalEvent[];

const regions: Array<{ id: Region; label: string; short: string; accent: string }> = [
  { id: "china", label: "中国", short: "三国前后", accent: "#b94f32" },
  { id: "rome", label: "罗马", short: "三世纪危机", accent: "#5b6fbb" },
  { id: "sasanian-persia", label: "萨珊波斯", short: "西亚重组", accent: "#168069" },
  { id: "india", label: "印度次大陆", short: "贵霜后期", accent: "#9a6a16" },
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

function App() {
  const [year, setYear] = useState(220);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("china-220-cao-pi-founds-wei");

  const selectedEvent = events.find((event) => event.id === selectedId) ?? events[0];

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

  const relatedEvents = selectedEvent.relatedEvents
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is HistoricalEvent => Boolean(event));

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="kicker">ChronoAtlas</p>
            <h1>同一时间，世界正在发生什么？</h1>
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

        <section className="timeline-panel" aria-label="时间控制">
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

        <section className="comparison-grid" aria-label="区域对照">
          {regions.map((region) => {
            const regionEvents = visibleEvents.filter((event) => event.region === region.id);

            return (
              <section
                className="region-column"
                key={region.id}
                style={{ "--accent": region.accent } as React.CSSProperties}
              >
                <div className="region-heading">
                  <div>
                    <h2>{region.label}</h2>
                    <p>{region.short}</p>
                  </div>
                  <span>{regionEvents.length}</span>
                </div>

                <div className="event-stack">
                  {regionEvents.length ? (
                    regionEvents.map((event) => (
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
            );
          })}
        </section>
      </section>

      <aside className="detail-panel" aria-label="事件详情">
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
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
