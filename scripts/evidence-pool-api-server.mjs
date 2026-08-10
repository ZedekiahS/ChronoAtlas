import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { resolveEvidenceAnchor, resolveWitnessReadingOrder } from "./lib/evidence-anchor-resolver.mjs";
import {
  assertionWorkflowCounts,
  resolveAssertionReviewQueue,
  resolveClaimEvidenceGraph,
  resolveEvidencePackCoverage,
} from "./lib/evidence-assertion-workflow.mjs";
import {
  evidenceProposalCounts,
  resolveEvidenceProposalDossier,
} from "./lib/evidence-proposal-workflow.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argumentValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sendAnchorPage(response, anchor) {
  const displayAllowed = anchor.asset.rights.some((rights) => rights.allow_display === 1);
  const attribution = anchor.attributions.length > 0
    ? anchor.attributions.map((item) => `${item.work_title}（${item.attribution_type}）`).join("、")
    : "宿主作品正文/注释";
  const warning = displayAllowed
    ? "该资产的权利记录允许展示。"
    : "仅限本地内部解析：当前权利记录不允许公开展示或索引。";
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(anchor.node.label)} · ChronoAtlas 锚点</title>
  <style>
    body{font-family:system-ui,-apple-system,"Segoe UI","Noto Sans SC",sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:#17202a;line-height:1.75;background:#f7f7f3}
    article{background:white;border:1px solid #ddd8cc;border-radius:16px;padding:28px;box-shadow:0 8px 30px #0000000a}
    h1{font-size:1.35rem;margin-top:0}.text{font-family:"Noto Serif CJK SC","Songti SC",serif;font-size:1.15rem;padding:20px;background:#fbfaf6;border-left:4px solid #8d6e45;white-space:pre-wrap}
    dl{display:grid;grid-template-columns:150px 1fr;gap:6px 18px}dt{color:#6c6255}dd{margin:0;overflow-wrap:anywhere}.warning{padding:12px 16px;background:#fff3cd;border-radius:8px}code{font-size:.88em}
  </style>
</head>
<body><article>
  <h1>${escapeHtml(anchor.node.label)}</h1>
  <p class="warning">${escapeHtml(warning)}</p>
  <div class="text">${escapeHtml(anchor.selector.exact)}</div>
  <dl>
    <dt>作品</dt><dd>${escapeHtml(anchor.work.title)}</dd>
    <dt>版本</dt><dd>${escapeHtml(anchor.witness.editionStatement)}</dd>
    <dt>定位</dt><dd>${escapeHtml(anchor.node.locatorPath)}</dd>
    <dt>文本层</dt><dd>${escapeHtml(anchor.layer.kind)} / ${escapeHtml(anchor.node.layerRole)}</dd>
    <dt>字符范围</dt><dd>[${anchor.selector.startCodePoint}, ${anchor.selector.endCodePoint})，Unicode code point</dd>
    <dt>归属</dt><dd>${escapeHtml(attribution)}</dd>
    <dt>资产 SHA-256</dt><dd><code>${escapeHtml(anchor.asset.sha256)}</code></dd>
    <dt>锚点 URN</dt><dd><code>${escapeHtml(anchor.urn)}</code></dd>
    <dt>完整性</dt><dd>${anchor.selector.integrityValid ? "通过" : "失败"}</dd>
  </dl>
</article></body></html>`;
  response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  response.end(html);
}

const dbPath = path.resolve(argumentValue("--db", path.join(rootDir, "db", "chronoatlas.sqlite")));
const host = argumentValue("--host", "127.0.0.1");
const port = Number(argumentValue("--port", "8791"));
const db = new DatabaseSync(dbPath, { readOnly: true });
db.exec("PRAGMA query_only = ON;");
const requiredTables = ["text_anchors", "witness_active_ingests", "ingest_run_text_revisions"];
const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
for (const tableName of requiredTables) {
  if (!tableExists.get(tableName)) {
    db.close();
    throw new Error(`Evidence-pool resolver database is missing table: ${tableName}`);
  }
}
const phase2Tables = ["assertion_candidates", "source_assertions", "claims", "review_decisions"];
const phase2Available = phase2Tables.every((tableName) => Boolean(tableExists.get(tableName)));
const proposalTables = [
  "transmission_group_candidates",
  "claim_candidate_source_candidates",
  "event_collection_candidates",
  "event_candidates_v2",
  "event_candidate_claim_candidates",
  "content_releases_v2",
];
const proposalWorkflowAvailable = proposalTables.every((tableName) => Boolean(tableExists.get(tableName)));

const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);
    if (request.method !== "GET") return sendJson(response, 405, { error: "method-not-allowed" });
    if (url.pathname === "/health") {
      return sendJson(response, 200, {
        ok: true,
        database: dbPath,
        internalOnly: true,
        phase2AssertionWorkflow: phase2Available,
        proposalWorkflow: proposalWorkflowAvailable,
      });
    }

    if (url.pathname === "/api/v2/evidence/proposals/summary") {
      return proposalWorkflowAvailable
        ? sendJson(response, 200, {
            ...evidenceProposalCounts(db, url.searchParams.get("proposalSet")),
            internalOnly: true,
          })
        : sendJson(response, 503, { error: "evidence-proposal-schema-not-installed" });
    }

    const dossierMatch = url.pathname.match(/^\/api\/v2\/evidence\/dossiers\/([^/]+)$/u);
    if (dossierMatch) {
      if (!proposalWorkflowAvailable) {
        return sendJson(response, 503, { error: "evidence-proposal-schema-not-installed" });
      }
      const dossierKey = decodeURIComponent(dossierMatch[1]);
      const proposalSetId = dossierKey === "red-cliffs"
        ? "red-cliffs-claims-events-v1"
        : dossierKey;
      const dossier = resolveEvidenceProposalDossier(db, proposalSetId);
      return dossier
        ? sendJson(response, 200, { ...dossier, internalOnly: true })
        : sendJson(response, 404, { error: "evidence-dossier-not-found" });
    }

    if (url.pathname === "/api/v2/evidence/review/summary") {
      return phase2Available
        ? sendJson(response, 200, { ...assertionWorkflowCounts(db), internalOnly: true })
        : sendJson(response, 503, { error: "phase2-assertion-schema-not-installed" });
    }

    if (url.pathname === "/api/v2/evidence/review/assertion-candidates") {
      if (!phase2Available) return sendJson(response, 503, { error: "phase2-assertion-schema-not-installed" });
      const queue = resolveAssertionReviewQueue(db, {
        status: url.searchParams.get("status") ?? "pending_review",
        packId: url.searchParams.get("pack"),
        limit: url.searchParams.get("limit") ?? 200,
      });
      return sendJson(response, 200, { ...queue, internalOnly: true });
    }

    const packCoverageMatch = url.pathname.match(/^\/api\/v2\/evidence\/packs\/([^/]+)\/coverage$/u);
    if (packCoverageMatch) {
      return phase2Available
        ? sendJson(response, 200, {
            ...resolveEvidencePackCoverage(db, decodeURIComponent(packCoverageMatch[1])),
            internalOnly: true,
          })
        : sendJson(response, 503, { error: "phase2-assertion-schema-not-installed" });
    }

    const claimGraphMatch = url.pathname.match(/^\/api\/v2\/evidence\/claims\/([^/]+)$/u);
    if (claimGraphMatch) {
      if (!phase2Available) return sendJson(response, 503, { error: "phase2-assertion-schema-not-installed" });
      const graph = resolveClaimEvidenceGraph(db, decodeURIComponent(claimGraphMatch[1]));
      return graph
        ? sendJson(response, 200, { ...graph, internalOnly: true })
        : sendJson(response, 404, { error: "claim-not-found" });
    }

    const anchorApiMatch = url.pathname.match(/^\/api\/v2\/evidence\/anchors\/(.+)$/u);
    if (anchorApiMatch) {
      const anchor = resolveEvidenceAnchor(db, decodeURIComponent(anchorApiMatch[1]));
      return anchor
        ? sendJson(response, 200, { ...anchor, internalOnly: true })
        : sendJson(response, 404, { error: "anchor-not-found" });
    }

    const witnessMatch = url.pathname.match(/^\/api\/v2\/evidence\/witnesses\/([^/]+)\/reading-order$/u);
    if (witnessMatch) {
      const readingOrder = resolveWitnessReadingOrder(db, decodeURIComponent(witnessMatch[1]));
      return readingOrder
        ? sendJson(response, 200, { ...readingOrder, internalOnly: true })
        : sendJson(response, 404, { error: "active-witness-ingest-not-found" });
    }

    const anchorPageMatch = url.pathname.match(/^\/evidence\/anchors\/(.+)$/u);
    if (anchorPageMatch) {
      const anchor = resolveEvidenceAnchor(db, decodeURIComponent(anchorPageMatch[1]));
      return anchor ? sendAnchorPage(response, anchor) : sendJson(response, 404, { error: "anchor-not-found" });
    }

    return sendJson(response, 404, {
      error: "not-found",
      routes: [
        "/health",
        "/api/v2/evidence/review/summary",
        "/api/v2/evidence/proposals/summary?proposalSet=:proposalSetId",
        "/api/v2/evidence/dossiers/red-cliffs",
        "/api/v2/evidence/review/assertion-candidates?pack=:packId",
        "/api/v2/evidence/packs/:packId/coverage",
        "/api/v2/evidence/claims/:id",
        "/api/v2/evidence/anchors/:id-or-urn",
        "/api/v2/evidence/witnesses/:id/reading-order",
        "/evidence/anchors/:id-or-urn",
      ],
    });
  } catch (error) {
    return sendJson(response, 500, { error: "resolver-failed", message: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Evidence-pool resolver listening on http://${host}:${port}`);
  console.log(`Read-only database: ${dbPath}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
