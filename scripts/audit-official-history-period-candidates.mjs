import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getChinaOfficialHistoryPeriodPack } from "./lib/china-official-history-period-packs.mjs";
import { officialHistoryProvisionalPersonNameAuditReasons } from "./lib/china-official-history-reference-resolver.mjs";
import {
  isOfficialHistoryCommentaryText,
  normalizeOfficialHistoryEventTitle,
  officialHistoryTitleAuditReasons,
} from "./lib/china-official-history-promotion-policy.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packId = process.argv
  .find((argument) => argument.startsWith("--pack="))
  ?.slice("--pack=".length) ?? "china-eastern-han-25-57-v1";
const dbArgument = process.argv.find((argument) => argument.startsWith("--db="))?.slice("--db=".length);
const dbPath = dbArgument ? path.resolve(rootDir, dbArgument) : path.join(rootDir, "db", "chronoatlas.sqlite");
const pack = getChinaOfficialHistoryPeriodPack(packId);
const db = new DatabaseSync(dbPath, { readOnly: true });
const batch = db.prepare("SELECT status, raw_json FROM import_batches WHERE id = ?").get(pack.batchId);
const batchRaw = parseJson(batch?.raw_json, {});
const batchRepair = batchRaw.candidateRepair ?? {};
const partialCoverage = batchRepair.coverageMode === "partial";

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const cards = db.prepare(`
  SELECT
    c.*,
    json_extract(c.raw_json, '$.sentenceChronology.confidence') AS chronology_confidence,
    json_extract(c.raw_json, '$.sourceSectionType') AS source_section_type,
    EXISTS (
      SELECT 1 FROM import_event_cluster_members member WHERE member.card_id = c.id
    ) AS has_cluster
  FROM import_evidence_cards c
  WHERE c.batch_id = ?
  ORDER BY c.card_index, c.id
`).all(pack.batchId);
const clusters = db.prepare(`
  SELECT COUNT(*) AS count,
         SUM(CASE WHEN match_status = 'matched' THEN 1 ELSE 0 END) AS matched,
         SUM(CASE WHEN match_status = 'possible' THEN 1 ELSE 0 END) AS possible
  FROM import_event_clusters
  WHERE batch_id = ?
`).get(pack.batchId);

const failures = [];
const samples = {};
const unreviewedCandidates = [];
function recordFailure(kind, card, details = {}) {
  failures.push({ kind, cardId: card.id, title: card.event_label, ...details });
  const items = samples[kind] ?? [];
  if (items.length < 10) items.push({ cardId: card.id, title: card.event_label, text: card.original_text, ...details });
  samples[kind] = items;
}

for (const card of cards) {
  const people = [...parseJson(card.people_core_json, []), ...parseJson(card.people_mentioned_json, [])];
  const raw = parseJson(card.raw_json, {});
  if (!Number.isInteger(card.year) || card.year < pack.timeStart || card.year > pack.timeEnd) {
    recordFailure("outside-window", card, { year: card.year });
  }
  if (card.chronology_confidence !== pack.minimumChronologyConfidence) {
    recordFailure("weak-chronology", card, { confidence: card.chronology_confidence });
  }
  if (!pack.sourceSectionTypes.includes(card.source_section_type)) {
    recordFailure("disallowed-section", card, { sectionType: card.source_section_type });
  }
  const isRepaired = raw.candidateRepair?.generator === batchRepair.generator;
  if (partialCoverage && !isRepaired) {
    unreviewedCandidates.push({ cardId: card.id, title: card.event_label, text: card.original_text });
    continue;
  }
  if (card.review_status === "rejected") continue;
  if (isOfficialHistoryCommentaryText(card.original_text)) recordFailure("commentary", card);
  const normalizedTitle = normalizeOfficialHistoryEventTitle(
    card.event_label,
    card.original_text,
    card.fact_type,
    raw.eventScale,
    people,
  );
  if (!normalizedTitle) recordFailure("weak-title", card);
  const titleAuditReasons = officialHistoryTitleAuditReasons(card.event_label);
  if (titleAuditReasons.length) recordFailure("title-audit", card, { reasons: titleAuditReasons });
  for (const person of Array.isArray(raw.discoveredPeople) ? raw.discoveredPeople : []) {
    const reasons = officialHistoryProvisionalPersonNameAuditReasons(person?.name);
    if (reasons.length) recordFailure("provisional-person-name", card, { person: person.name, reasons });
  }
}

if (!cards.length) failures.push({ kind: "empty-batch", batchId: pack.batchId });
const withPeople = cards.filter((card) => (
  parseJson(card.people_core_json, []).length + parseJson(card.people_mentioned_json, []).length
) > 0).length;
const withPlaces = cards.filter((card) => parseJson(card.places_json, []).length > 0).length;
const report = {
  pack: {
    id: pack.id,
    label: pack.label,
    timeStart: pack.timeStart,
    timeEnd: pack.timeEnd,
    promotionProfile: pack.promotionProfile,
  },
  batchId: pack.batchId,
  cards: cards.length,
  coverage: {
    mode: partialCoverage ? "partial" : "complete",
    repaired: cards.length - unreviewedCandidates.length,
    unreviewed: unreviewedCandidates.length,
    declaredUnaddressed: batchRepair.unaddressedCandidates ?? 0,
    decisionRebinding: batchRepair.decisionRebinding ?? null,
  },
  unreviewedSamples: unreviewedCandidates.slice(0, 10),
  clusters: clusters.count ?? 0,
  matchedClusters: clusters.matched ?? 0,
  possibleMatchClusters: clusters.possible ?? 0,
  peopleBinding: { count: withPeople, rate: cards.length ? Number((withPeople / cards.length).toFixed(3)) : 0 },
  placeBinding: { count: withPlaces, rate: cards.length ? Number((withPlaces / cards.length).toFixed(3)) : 0 },
  failures: failures.length,
  failureCounts: Object.fromEntries(
    [...new Set(failures.map((failure) => failure.kind))]
      .sort()
      .map((kind) => [kind, failures.filter((failure) => failure.kind === kind).length]),
  ),
  samples,
};

console.log(JSON.stringify(report, null, 2));
db.close();
if (failures.length) process.exitCode = 1;
