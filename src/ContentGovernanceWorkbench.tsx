import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpenText,
  CheckCircle2,
  Database,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import "./content-governance-workbench.css";

type Locale = "zh" | "en";
type ReviewStatus = "all" | "staged" | "needs-fix" | "approved" | "rejected" | "promoted";
type WorkbenchPanel = "overview" | "review" | "identity";

type IdentityCoverage = {
  objectType: string;
  totalCount: number;
  mappedCount: number;
  unmappedCount: number;
  coveragePercent: number;
};

type IdentityIssue = {
  objectType: string;
  sourceId: string;
  sourceLabel: string | null;
  candidateTargetId: string | null;
  issue: string;
  usageCount: number;
};

type GovernanceSummary = {
  identityReady: boolean;
  identityCoverage: IdentityCoverage[];
  identityIssues: IdentityIssue[];
  totals: {
    persons: number;
    historicalEvents: number;
    sources: number;
    sourcePassages: number;
    sourceMentions: number;
    disputedMentions: number;
  };
  pendingPeople: Array<{
    id: string;
    name: string;
    summary: string | null;
    coverageStatus: string;
    lifeConfidence: string;
    entityId: string | null;
    reviewStatus: string;
    extractionNeedsReview: boolean;
  }>;
  disputeSamples: Array<{
    id: string;
    year: number | null;
    workTitle: string;
    bookTitle: string;
    locator: string;
    disputeNote: string;
  }>;
};

type ImportBatch = {
  id: string;
  createdAt: string;
  sourceProvider: string;
  sourceRoot: string;
  status: string;
  notes: string | null;
  fileCount: number;
  cardCount: number;
  counts: {
    staged: number;
    needsFix: number;
    approved: number;
    rejected: number;
    promoted: number;
  };
};

type ImportCard = {
  id: string;
  batchId: string;
  relativePath: string;
  sourceTitle: string;
  sourceType: string;
  locator: string;
  year: number | null;
  displayDate: string | null;
  peopleCore: unknown;
  peopleMentioned: unknown;
  places: unknown;
  eventLabel: string | null;
  factBrief: string | null;
  factDetailed: string | null;
  confidence: string;
  reviewStatus: Exclude<ReviewStatus, "all">;
  validationErrors: unknown;
  validationWarnings: unknown;
  originalText?: string;
  translation?: string | null;
  questions?: unknown;
};

type CoverageRegion = {
  id: string;
  label: string;
  gaps: string[];
  metrics: {
    events: number;
    peopleEntities: number;
    evidenceDocuments: number;
    evidenceMissingOriginal: number;
  };
};

type CoverageResponse = {
  regions: CoverageRegion[];
};

type ContentGovernanceWorkbenchProps = {
  locale: Locale;
  onOpenCoverage?: (period: "190-310" | "310-589") => void;
};

const reviewStatuses: ReviewStatus[] = ["all", "needs-fix", "staged", "approved", "rejected", "promoted"];
const cardPageSize = 80;
const mutableReviewStatuses: Array<Exclude<ReviewStatus, "all" | "promoted">> = [
  "staged",
  "needs-fix",
  "approved",
  "rejected",
];

const statusLabels: Record<ReviewStatus, Record<Locale, string>> = {
  all: { zh: "全部", en: "All" },
  staged: { zh: "待审", en: "Staged" },
  "needs-fix": { zh: "需修正", en: "Needs fix" },
  approved: { zh: "已通过", en: "Approved" },
  rejected: { zh: "已驳回", en: "Rejected" },
  promoted: { zh: "已晋级", en: "Promoted" },
};

function asList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : JSON.stringify(item));
  if (value === null || value === undefined || value === "") return [];
  return [typeof value === "string" ? value : JSON.stringify(value)];
}

function batchPendingCount(batch: ImportBatch) {
  return batch.counts.staged + batch.counts.needsFix;
}

function formatObjectType(value: string, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    person: { zh: "人物", en: "People" },
    historical_event: { zh: "核心事件", en: "Core events" },
    place_reference: { zh: "地点引用", en: "Place references" },
  };
  return labels[value]?.[locale] ?? value;
}

function formatIssue(value: string, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    "missing-link": { zh: "缺少映射", en: "Missing link" },
    "wrong-target-type": { zh: "目标类型错误", en: "Wrong target type" },
    "conflicting-map-feature-targets": { zh: "地图目标冲突", en: "Conflicting map targets" },
  };
  return labels[value]?.[locale] ?? value;
}

function formatGovernanceValue(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const labels: Record<string, Record<Locale, string>> = {
    high: { zh: "高", en: "High" },
    medium: { zh: "中", en: "Medium" },
    low: { zh: "低", en: "Low" },
    draft: { zh: "草稿", en: "Draft" },
    reviewed: { zh: "已复核", en: "Reviewed" },
    approved: { zh: "已通过", en: "Approved" },
    unmapped: { zh: "未映射", en: "Unmapped" },
    "auto-verified": { zh: "自动核验", en: "Auto-verified" },
  };
  return labels[value]?.[locale] ?? value;
}

export default function ContentGovernanceWorkbench({
  locale,
  onOpenCoverage,
}: ContentGovernanceWorkbenchProps) {
  const [panel, setPanel] = useState<WorkbenchPanel>("overview");
  const [summary, setSummary] = useState<GovernanceSummary | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [coverage, setCoverage] = useState<Record<string, CoverageResponse | null>>({
    "190-310": null,
    "310-589": null,
  });
  const [cards, setCards] = useState<ImportCard[]>([]);
  const [cardTotal, setCardTotal] = useState(0);
  const [cardOffset, setCardOffset] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<ImportCard | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("staged");
  const [batchId, setBatchId] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/content-governance/summary", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`governance summary ${response.status}`);
        return response.json() as Promise<GovernanceSummary>;
      }),
      fetch("/api/import-batches", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`import batches ${response.status}`);
        return response.json() as Promise<{ batches: ImportBatch[] }>;
      }),
      fetch("/api/frontend-coverage-190-310", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`coverage 190-310 ${response.status}`);
        return response.json() as Promise<CoverageResponse>;
      }),
      fetch("/api/frontend-coverage-310-589", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`coverage 310-589 ${response.status}`);
        return response.json() as Promise<CoverageResponse>;
      }),
    ])
      .then(([nextSummary, batchPayload, firstCoverage, secondCoverage]) => {
        setSummary(nextSummary);
        setBatches(batchPayload.batches);
        setCoverage({ "190-310": firstCoverage, "310-589": secondCoverage });
      })
      .catch((nextError) => {
        if (nextError instanceof DOMException && nextError.name === "AbortError") return;
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [refreshToken]);

  useEffect(() => {
    setCardOffset(0);
  }, [batchId, reviewStatus, search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ limit: String(cardPageSize), offset: String(cardOffset) });
      if (reviewStatus !== "all") params.set("status", reviewStatus);
      if (batchId !== "all") params.set("batchId", batchId);
      if (search.trim()) params.set("search", search.trim());
      setCardsLoading(true);
      fetch(`/api/import-evidence-cards?${params.toString()}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`review cards ${response.status}`);
          return response.json() as Promise<{ cards: ImportCard[]; total: number }>;
        })
        .then((payload) => {
          setCards(payload.cards);
          setCardTotal(payload.total);
          setSelectedCardId((current) => current && payload.cards.some((card) => card.id === current)
            ? current
            : payload.cards[0]?.id ?? null);
        })
        .catch((nextError) => {
          if (nextError instanceof DOMException && nextError.name === "AbortError") return;
          setError(nextError instanceof Error ? nextError.message : String(nextError));
        })
        .finally(() => setCardsLoading(false));
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [batchId, cardOffset, refreshToken, reviewStatus, search]);

  useEffect(() => {
    if (!selectedCardId) {
      setSelectedCard(null);
      return;
    }
    setSelectedCard(null);
    const controller = new AbortController();
    fetch(`/api/import-evidence-cards/${encodeURIComponent(selectedCardId)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`review card detail ${response.status}`);
        return response.json() as Promise<{ card: ImportCard }>;
      })
      .then((payload) => setSelectedCard(payload.card))
      .catch((nextError) => {
        if (nextError instanceof DOMException && nextError.name === "AbortError") return;
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      });
    return () => controller.abort();
  }, [selectedCardId, refreshToken]);

  const pendingCards = useMemo(
    () => batches.reduce((total, batch) => total + batchPendingCount(batch), 0),
    [batches],
  );
  const identityTotals = useMemo(
    () => summary?.identityCoverage.reduce(
      (totals, item) => ({
        mapped: totals.mapped + item.mappedCount,
        total: totals.total + item.totalCount,
        unmapped: totals.unmapped + item.unmappedCount,
      }),
      { mapped: 0, total: 0, unmapped: 0 },
    ) ?? { mapped: 0, total: 0, unmapped: 0 },
    [summary],
  );
  const activeSelectedCard = selectedCard?.id === selectedCardId ? selectedCard : null;

  async function updateReviewStatus(card: ImportCard, nextStatus: Exclude<ReviewStatus, "all" | "promoted">) {
    if (nextStatus === "rejected") {
      const confirmed = window.confirm(locale === "zh"
        ? `确认将“${card.factBrief ?? card.sourceTitle}”标记为已驳回？`
        : `Mark “${card.factBrief ?? card.sourceTitle}” as rejected?`);
      if (!confirmed) return;
    }
    setUpdatingCardId(card.id);
    setError(null);
    try {
      const response = await fetch(`/api/import-evidence-cards/${encodeURIComponent(card.id)}/review-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: nextStatus }),
      });
      if (!response.ok) throw new Error(`review update ${response.status}`);
      setRefreshToken((value) => value + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setUpdatingCardId(null);
    }
  }

  function renderCoveragePeriod(period: "190-310" | "310-589") {
    const payload = coverage[period];
    const regions = payload?.regions ?? [];
    const totals = regions.reduce(
      (result, region) => ({
        events: result.events + region.metrics.events,
        people: result.people + region.metrics.peopleEntities,
        evidence: result.evidence + region.metrics.evidenceDocuments,
        gaps: result.gaps + region.gaps.length,
      }),
      { events: 0, people: 0, evidence: 0, gaps: 0 },
    );
    return (
      <article className="governance-period-card" key={period}>
        <header>
          <div>
            <span>{locale === "zh" ? "内容时期" : "Content period"}</span>
            <h3>{period}</h3>
          </div>
          <strong className={totals.gaps ? "warn" : "ok"}>
            {totals.gaps ? `${totals.gaps} ${locale === "zh" ? "项缺口" : "gaps"}` : (locale === "zh" ? "达标" : "Ready")}
          </strong>
        </header>
        <div className="governance-inline-metrics">
          <span>{locale === "zh" ? "事件" : "Events"}<b>{totals.events}</b></span>
          <span>{locale === "zh" ? "人物" : "People"}<b>{totals.people}</b></span>
          <span>{locale === "zh" ? "证据" : "Evidence"}<b>{totals.evidence}</b></span>
          <span>{locale === "zh" ? "区域" : "Regions"}<b>{regions.length}</b></span>
        </div>
        <div className="governance-period-regions">
          {regions.slice(0, 6).map((region) => (
            <span className={region.gaps.length ? "warn" : "ok"} key={region.id}>
              {region.label} · {region.gaps.length || "✓"}
            </span>
          ))}
        </div>
        {onOpenCoverage && (
          <button type="button" onClick={() => onOpenCoverage(period)}>
            {locale === "zh" ? "查看完整覆盖审计" : "Open coverage audit"}
          </button>
        )}
      </article>
    );
  }

  return (
    <section className="content-governance-workbench" aria-label={locale === "zh" ? "内容审核与覆盖工作台" : "Content governance workbench"}>
      <header className="governance-hero">
        <div>
          <p className="kicker"><ShieldCheck size={16} /> CONTENT GOVERNANCE</p>
          <h2>{locale === "zh" ? "内容审核与覆盖工作台" : "Content Review & Coverage"}</h2>
          <p>
            {locale === "zh"
              ? "集中查看身份映射、史料覆盖和导入证据卡；所有状态变更均需人工明确点击，事件晋级仍由正式脚本完成。"
              : "Inspect identity mappings, source coverage, and staged evidence. Status changes require an explicit action; promotion remains script-controlled."}
          </p>
        </div>
        <button className="governance-refresh" type="button" onClick={() => setRefreshToken((value) => value + 1)}>
          <RefreshCw size={16} /> {locale === "zh" ? "刷新" : "Refresh"}
        </button>
      </header>

      {error && <div className="governance-error"><AlertTriangle size={17} /> {error}</div>}

      <div className="governance-metrics" aria-busy={loading}>
        <article><BookOpenText /><span>{locale === "zh" ? "史料提及" : "Source mentions"}</span><strong>{summary?.totals.sourceMentions ?? "—"}</strong></article>
        <article><Database /><span>{locale === "zh" ? "身份映射" : "Identity links"}</span><strong>{identityTotals.total ? `${identityTotals.mapped}/${identityTotals.total}` : "—"}</strong></article>
        <article><Archive /><span>{locale === "zh" ? "待审核卡" : "Pending cards"}</span><strong>{pendingCards}</strong></article>
        <article><UsersRound /><span>{locale === "zh" ? "待核人物样本" : "People to review"}</span><strong>{summary?.pendingPeople.length ?? "—"}</strong></article>
        <article><AlertTriangle /><span>{locale === "zh" ? "史料争议" : "Source disputes"}</span><strong>{summary?.totals.disputedMentions ?? "—"}</strong></article>
      </div>

      <nav className="governance-tabs" aria-label={locale === "zh" ? "工作台分区" : "Workbench sections"}>
        {([
          ["overview", locale === "zh" ? "总览与覆盖" : "Overview"],
          ["review", locale === "zh" ? "证据卡审核" : "Evidence review"],
          ["identity", locale === "zh" ? "身份与冲突" : "Identity & conflicts"],
        ] as Array<[WorkbenchPanel, string]>).map(([id, label]) => (
          <button className={panel === id ? "active" : ""} key={id} type="button" onClick={() => setPanel(id)}>{label}</button>
        ))}
      </nav>

      {panel === "overview" ? (
        <div className="governance-overview-grid">
          <div className="governance-period-grid">
            {renderCoveragePeriod("190-310")}
            {renderCoveragePeriod("310-589")}
          </div>
          <article className="governance-batch-panel">
            <header><div><span>{locale === "zh" ? "导入队列" : "Import queue"}</span><h3>{locale === "zh" ? "最近批次" : "Recent batches"}</h3></div><strong>{batches.length}</strong></header>
            <div>
              {batches.slice(0, 10).map((batch) => (
                <button key={batch.id} type="button" onClick={() => { setBatchId(batch.id); setReviewStatus("staged"); setPanel("review"); }}>
                  <span><b>{batch.sourceProvider}</b><small>{batch.id}</small></span>
                  <em className={batchPendingCount(batch) ? "warn" : "ok"}>{batchPendingCount(batch)} {locale === "zh" ? "待处理" : "pending"}</em>
                </button>
              ))}
            </div>
          </article>
        </div>
      ) : panel === "review" ? (
        <div className="governance-review-stage">
          <div className="governance-review-filters">
            <label><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={locale === "zh" ? "检索原文、人物、地点或事实" : "Search text, person, place, or fact"} /></label>
            <select value={batchId} onChange={(event) => setBatchId(event.target.value)} aria-label={locale === "zh" ? "导入批次" : "Import batch"}>
              <option value="all">{locale === "zh" ? "全部批次" : "All batches"}</option>
              {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.sourceProvider} · {batch.id}</option>)}
            </select>
            <div>{reviewStatuses.map((status) => <button className={reviewStatus === status ? "active" : ""} key={status} type="button" onClick={() => setReviewStatus(status)}>{statusLabels[status][locale]}</button>)}</div>
          </div>
          <div className="governance-review-layout">
            <aside className="governance-card-list" aria-busy={cardsLoading}>
              <header>
                <span>{locale === "zh" ? "审核结果" : "Review results"}</span>
                <strong>{cardTotal ? `${cardOffset + 1}–${Math.min(cardOffset + cards.length, cardTotal)} / ${cardTotal}` : "0"}</strong>
              </header>
              {cards.map((card) => (
                <button className={selectedCardId === card.id ? "selected" : ""} key={card.id} type="button" onClick={() => setSelectedCardId(card.id)}>
                  <span><em className={`status-${card.reviewStatus}`}>{statusLabels[card.reviewStatus][locale]}</em><small>{card.year ?? card.displayDate ?? "?"}</small></span>
                  <b>{card.factBrief ?? card.eventLabel ?? card.sourceTitle}</b>
                  <p>{card.sourceTitle} · {card.locator}</p>
                </button>
              ))}
              {!cardsLoading && !cards.length && <p className="governance-empty">{locale === "zh" ? "当前筛选没有证据卡。" : "No cards match this filter."}</p>}
              {cardTotal > cardPageSize && (
                <nav className="governance-pagination" aria-label={locale === "zh" ? "审核队列分页" : "Review queue pagination"}>
                  <button type="button" disabled={cardOffset === 0 || cardsLoading} onClick={() => setCardOffset((value) => Math.max(0, value - cardPageSize))}>
                    {locale === "zh" ? "上一页" : "Previous"}
                  </button>
                  <button type="button" disabled={cardOffset + cardPageSize >= cardTotal || cardsLoading} onClick={() => setCardOffset((value) => value + cardPageSize)}>
                    {locale === "zh" ? "下一页" : "Next"}
                  </button>
                </nav>
              )}
            </aside>
            <article className="governance-card-detail">
              {activeSelectedCard ? (
                <>
                  <header>
                    <div><span>{activeSelectedCard.sourceTitle} · {activeSelectedCard.locator}</span><h3>{activeSelectedCard.factBrief ?? activeSelectedCard.eventLabel ?? activeSelectedCard.id}</h3></div>
                    <em className={`status-${activeSelectedCard.reviewStatus}`}>{statusLabels[activeSelectedCard.reviewStatus][locale]}</em>
                  </header>
                  <p className="governance-card-fact">{activeSelectedCard.factDetailed ?? activeSelectedCard.factBrief}</p>
                  {activeSelectedCard.originalText && <blockquote>{activeSelectedCard.originalText}</blockquote>}
                  {activeSelectedCard.translation && <p>{activeSelectedCard.translation}</p>}
                  <div className="governance-card-entities">
                    <span>{locale === "zh" ? "核心人物" : "Core people"}<b>{asList(activeSelectedCard.peopleCore).join("、") || "—"}</b></span>
                    <span>{locale === "zh" ? "提及人物" : "Mentioned"}<b>{asList(activeSelectedCard.peopleMentioned).join("、") || "—"}</b></span>
                    <span>{locale === "zh" ? "地点" : "Places"}<b>{asList(activeSelectedCard.places).join("、") || "—"}</b></span>
                    <span>{locale === "zh" ? "置信度" : "Confidence"}<b>{formatGovernanceValue(activeSelectedCard.confidence, locale)}</b></span>
                  </div>
                  {(asList(activeSelectedCard.validationErrors).length > 0 || asList(activeSelectedCard.validationWarnings).length > 0) && (
                    <div className="governance-validation-list">
                      {asList(activeSelectedCard.validationErrors).map((item) => <p className="error" key={item}>{item}</p>)}
                      {asList(activeSelectedCard.validationWarnings).map((item) => <p className="warning" key={item}>{item}</p>)}
                    </div>
                  )}
                  {activeSelectedCard.reviewStatus !== "promoted" && (
                    <div className="governance-review-actions">
                      {mutableReviewStatuses.map((status) => (
                        <button disabled={updatingCardId === activeSelectedCard.id || activeSelectedCard.reviewStatus === status} key={status} type="button" onClick={() => updateReviewStatus(activeSelectedCard, status)}>
                          {status === "approved" && <CheckCircle2 size={15} />}{statusLabels[status][locale]}
                        </button>
                      ))}
                    </div>
                  )}
                  <small className="governance-safety-note">{locale === "zh" ? "这里只修改本机审核状态；数据晋级、合并与 Seed 导出仍通过正式脚本完成。" : "This only updates local review status. Promotion, merging, and seed export remain script-controlled."}</small>
                </>
              ) : <p className="governance-empty">{locale === "zh" ? "选择一张证据卡查看详情。" : "Select an evidence card."}</p>}
            </article>
          </div>
        </div>
      ) : (
        <div className="governance-identity-layout">
          <section className="governance-identity-coverage">
            <header><div><span>{locale === "zh" ? "稳定身份" : "Stable identity"}</span><h3>{locale === "zh" ? "显式映射覆盖" : "Explicit mapping coverage"}</h3></div><strong className={identityTotals.unmapped ? "warn" : "ok"}>{identityTotals.unmapped}</strong></header>
            {!summary?.identityReady && <p className="governance-warning">{locale === "zh" ? "当前数据库尚未应用身份映射迁移，请先运行 npm run db:build。" : "Identity migration is not present. Run npm run db:build."}</p>}
            {summary?.identityCoverage.map((item) => (
              <div className="governance-identity-row" key={item.objectType}>
                <span><b>{formatObjectType(item.objectType, locale)}</b><small>{item.mappedCount}/{item.totalCount}</small></span>
                <i><b style={{ width: `${item.coveragePercent}%` }} /></i>
                <em className={item.unmappedCount ? "warn" : "ok"}>{item.coveragePercent}%</em>
              </div>
            ))}
          </section>
          <section className="governance-issues-panel">
            <header><div><span>{locale === "zh" ? "映射审计" : "Mapping audit"}</span><h3>{locale === "zh" ? "映射问题" : "Mapping issues"}</h3></div><strong>{summary?.identityIssues.length ?? 0}</strong></header>
            <div>{summary?.identityIssues.slice(0, 35).map((issue) => (
              <article key={`${issue.objectType}:${issue.sourceId}`}>
                <span><b>{issue.sourceLabel ?? issue.sourceId}</b><small>{formatIssue(issue.issue, locale)} · {formatObjectType(issue.objectType, locale)} · {issue.usageCount}×</small></span>
                <code>{issue.candidateTargetId ?? (locale === "zh" ? "无唯一候选" : "No unique candidate")}</code>
              </article>
            ))}</div>
          </section>
          <section className="governance-people-panel">
            <header><div><span>{locale === "zh" ? "人物抽取" : "Person extraction"}</span><h3>{locale === "zh" ? "待人工核定样本" : "People needing review"}</h3></div><strong>{summary?.pendingPeople.length ?? 0}</strong></header>
            <div>{summary?.pendingPeople.slice(0, 30).map((person) => (
              <article className={person.extractionNeedsReview ? "high-priority" : ""} key={person.id}>
                <span><b>{person.name}</b><small>{formatGovernanceValue(person.reviewStatus, locale)} · {formatGovernanceValue(person.lifeConfidence, locale)}</small></span>
                <p>{person.summary}</p>
              </article>
            ))}</div>
          </section>
          <section className="governance-disputes-panel">
            <header><div><span>{locale === "zh" ? "史料冲突" : "Source conflicts"}</span><h3>{locale === "zh" ? "争议注记" : "Dispute notes"}</h3></div><strong>{summary?.totals.disputedMentions ?? 0}</strong></header>
            <div>{summary?.disputeSamples.map((item) => (
              <article key={item.id}><span><b>{item.workTitle}</b><small>{item.year ?? "?"} · {item.locator}</small></span><p>{item.disputeNote}</p></article>
            ))}</div>
          </section>
        </div>
      )}
    </section>
  );
}
