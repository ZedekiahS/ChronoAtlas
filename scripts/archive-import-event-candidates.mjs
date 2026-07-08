import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const batchId = process.argv[2] ?? "auto-hanshu-person-event-candidates";
const now = new Date().toISOString();

function stableId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
}

function parseJson(value, fallback) {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJson(value) {
  return JSON.stringify(value ?? {});
}

function compact(value) {
  return String(value ?? "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLabel(label, fallbackText) {
  const source = compact(label) || compact(fallbackText);
  const withoutType = source.replace(/^[^:：]{1,16}[:：]\s*/u, "");
  const withoutLeadingQuotes = withoutType.replace(/^[」』》）)\]】\s]+/u, "");
  return compact(withoutLeadingQuotes).slice(0, 96);
}

function normalizeText(value) {
  return compact(value)
    .toLowerCase()
    .replace(/[《》〈〉「」『』“”‘’：:，,。.、；;！？?!（）()\[\]【】\s]/gu, "")
    .replace(/[一二三四五六七八九十百千万０-９0-9]+/gu, "")
    .slice(0, 120);
}

function shortSummary(parts) {
  const unique = [];
  const seen = new Set();
  for (const part of parts.map(compact).filter(Boolean)) {
    const key = normalizeText(part).slice(0, 72);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(part.length > 140 ? `${part.slice(0, 140)}...` : part);
    if (unique.length >= 3) {
      break;
    }
  }
  return unique.join("\n");
}

function mode(values, fallback = null) {
  const counts = new Map();
  for (const value of values.filter((item) => item !== null && item !== undefined && item !== "")) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best = fallback;
  let bestCount = 0;
  for (const [value, count] of counts.entries()) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function inferMentionId(cardId) {
  if (cardId.startsWith("card:hanshu-auto:")) {
    return `hanshu-auto-candidate:${cardId.slice("card:hanshu-auto:".length)}`;
  }
  return null;
}

function scoreExistingEvent(cluster, event) {
  if (event.region_id !== cluster.regionId) {
    return 0;
  }
  const start = cluster.timeStart ?? Number.NEGATIVE_INFINITY;
  const end = cluster.timeEnd ?? Number.POSITIVE_INFINITY;
  if (event.time_start < start || event.time_start > end) {
    return 0;
  }

  const eventTitle = normalizeText(event.title);
  const text = cluster.normalizedText;
  if (!eventTitle || !text) {
    return 0;
  }
  if (text.includes(eventTitle) || eventTitle.includes(text)) {
    return 0.95;
  }

  const chars = new Set([...text]);
  const titleChars = [...new Set([...eventTitle])];
  if (titleChars.length === 0) {
    return 0;
  }
  const overlap = titleChars.filter((char) => chars.has(char)).length / titleChars.length;
  return overlap >= 0.86 ? 0.78 : overlap >= 0.72 ? 0.68 : 0;
}

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA foreign_keys = ON;");

  const batch = db.prepare("SELECT id FROM import_batches WHERE id = ?").get(batchId);
  if (!batch) {
    throw new Error(`Missing import batch: ${batchId}`);
  }

  const cards = db.prepare(`
    SELECT
      c.id,
      c.batch_id,
      c.source_title,
      c.source_type,
      c.locator,
      c.year,
      c.original_text,
      c.people_core_json,
      c.macro_event,
      c.event_label,
      c.fact_brief,
      c.fact_detailed,
      c.fact_type,
      c.confidence,
      c.raw_json,
      sp.source_id AS passage_source_id,
      sp.year_start AS passage_year_start,
      sp.year_end AS passage_year_end
    FROM import_evidence_cards c
    LEFT JOIN source_passages sp ON sp.id = json_extract(c.raw_json, '$.passageId')
    WHERE c.batch_id = ?
    ORDER BY c.source_title, json_extract(c.raw_json, '$.passageId'), json_extract(c.raw_json, '$.sentenceIndex'), c.id
  `).all(batchId);

  if (!cards.length) {
    throw new Error(`No import evidence cards found for batch: ${batchId}`);
  }

  const enriched = cards.map((card) => {
    const raw = parseJson(card.raw_json, {});
    const people = parseJson(card.people_core_json, []);
    const sourceId = raw.sourceId ?? card.passage_source_id ?? "unknown-source";
    const passageId = raw.passageId ?? "unknown-passage";
    const sentenceIndex = Number.isInteger(raw.sentenceIndex) ? raw.sentenceIndex : 0;
    const eventScale = raw.eventScale ?? "minor";
    const label = cleanLabel(card.event_label, card.original_text ?? card.fact_brief);
    const exactKey = normalizeText(label);
    return {
      ...card,
      raw,
      people: Array.isArray(people) ? people : [],
      sourceId,
      passageId,
      sentenceIndex,
      eventScale,
      label,
      exactKey,
      windowBaseKey: ["window", sourceId, passageId, card.fact_type ?? "unknown", eventScale].join(":"),
      windowKey: null,
      regionId: "china",
      timeStart: Number.isInteger(card.year) ? card.year : card.passage_year_start,
      timeEnd: Number.isInteger(card.year) ? card.year : card.passage_year_end,
    };
  });

  const localOrdinalCounters = new Map();
  for (const card of enriched) {
    const ordinal = localOrdinalCounters.get(card.windowBaseKey) ?? 0;
    localOrdinalCounters.set(card.windowBaseKey, ordinal + 1);
    card.localCandidateOrdinal = ordinal;
    card.windowKey = `${card.windowBaseKey}:${Math.floor(ordinal / 3)}`;
  }

  const exactCounts = new Map();
  for (const card of enriched) {
    if (card.exactKey.length >= 8) {
      exactCounts.set(card.exactKey, (exactCounts.get(card.exactKey) ?? 0) + 1);
    }
  }

  const clustersByKey = new Map();
  for (const card of enriched) {
    const useExact = card.exactKey.length >= 8 && (exactCounts.get(card.exactKey) ?? 0) > 1;
    const normalizedKey = useExact ? `exact:${card.sourceId}:${card.fact_type ?? "unknown"}:${card.exactKey}` : card.windowKey;
    const mergeStrategy = useExact ? "exact-label" : "local-window";
    const cluster = clustersByKey.get(normalizedKey) ?? {
      id: `import-cluster:${stableId(`${batchId}:${normalizedKey}`)}`,
      batchId,
      regionId: card.regionId,
      normalizedKey,
      mergeStrategy,
      cards: [],
    };
    cluster.cards.push(card);
    clustersByKey.set(normalizedKey, cluster);
  }

  const existingEvents = db.prepare(`
    SELECT id, title, region_id, time_start, COALESCE(time_end, time_start) AS time_end, event_type
    FROM events
    WHERE region_id = 'china'
  `).all();

  const clusters = [...clustersByKey.values()].map((cluster) => {
    const sortedCards = cluster.cards.sort((left, right) => left.sentenceIndex - right.sentenceIndex || left.id.localeCompare(right.id));
    const representative = sortedCards.find((card) => card.label.length >= 6) ?? sortedCards[0];
    const people = [...new Set(sortedCards.flatMap((card) => card.people))];
    const sourceIds = [...new Set(sortedCards.map((card) => card.sourceId))];
    const factBriefs = sortedCards.map((card) => card.fact_brief || card.original_text || card.label);
    const text = sortedCards.map((card) => `${card.label} ${card.fact_brief ?? ""} ${card.original_text ?? ""}`).join("\n");
    const timeStarts = sortedCards.map((card) => card.timeStart).filter(Number.isInteger);
    const timeEnds = sortedCards.map((card) => card.timeEnd).filter(Number.isInteger);
    const summary = shortSummary(factBriefs);
    const enrichedCluster = {
      ...cluster,
      canonicalLabel: representative.label || "Untitled import event candidate",
      eventType: mode(sortedCards.map((card) => card.fact_type), "unknown"),
      eventScale: mode(sortedCards.map((card) => card.eventScale), "minor"),
      timeStart: timeStarts.length ? Math.min(...timeStarts) : null,
      timeEnd: timeEnds.length ? Math.max(...timeEnds) : null,
      confidence: mode(sortedCards.map((card) => card.confidence), sortedCards.length > 1 ? "medium" : "low"),
      candidateCount: sortedCards.length,
      sourceCount: sourceIds.length,
      personCount: people.length,
      people,
      sourceIds,
      summary,
      normalizedText: normalizeText(text),
    };

    let bestMatch = null;
    for (const event of existingEvents) {
      const score = scoreExistingEvent(enrichedCluster, event);
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { event, score };
      }
    }
    enrichedCluster.bestMatch = bestMatch;
    enrichedCluster.matchStatus = bestMatch?.score >= 0.86 ? "matched" : bestMatch?.score >= 0.72 ? "possible" : "unmatched";
    return enrichedCluster;
  });

  const insertCluster = db.prepare(`
    INSERT INTO import_event_clusters (
      id, batch_id, region_id, canonical_label, normalized_key, event_type, event_scale,
      time_start, time_end, candidate_count, source_count, person_count, matched_event_id,
      match_status, confidence, review_status, summary, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMember = db.prepare(`
    INSERT INTO import_event_cluster_members (
      cluster_id, card_id, sort_order, similarity_score, role, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const updateCard = db.prepare(`
    UPDATE import_evidence_cards
    SET macro_event = ?,
        event_label = ?,
        year = COALESCE(year, ?),
        raw_json = ?
    WHERE id = ?
  `);
  const updateMention = db.prepare("UPDATE source_mentions SET raw_json = ? WHERE id = ?");
  const updateDocument = db.prepare(`
    UPDATE search_documents
    SET time_start = COALESCE(time_start, ?),
        time_end = COALESCE(time_end, ?),
        raw_json = ?
    WHERE id = ?
  `);
  const updateDocumentChunks = db.prepare(`
    UPDATE document_chunks
    SET time_start = COALESCE(time_start, ?),
        time_end = COALESCE(time_end, ?)
    WHERE search_document_id = ?
  `);

  db.exec("BEGIN;");
  try {
    const orphanSearchDocumentIds = db.prepare(`
      SELECT sd.id
      FROM search_documents sd
      LEFT JOIN import_evidence_cards c ON c.id = sd.subject_id
      WHERE sd.subject_table = 'import_evidence_cards'
        AND c.id IS NULL
    `).all().map((row) => row.id);

    const deleteChunk = db.prepare("DELETE FROM document_chunks WHERE search_document_id = ?");
    const deleteEvidenceLink = db.prepare("DELETE FROM evidence_links WHERE subject_table = 'search_documents' AND subject_id = ?");
    const deleteSearchDocument = db.prepare("DELETE FROM search_documents WHERE id = ?");
    for (const id of orphanSearchDocumentIds) {
      deleteChunk.run(id);
      deleteEvidenceLink.run(id);
      deleteSearchDocument.run(id);
    }

    db.prepare("DELETE FROM import_event_clusters WHERE batch_id = ?").run(batchId);

    for (const cluster of clusters) {
      insertCluster.run(
        cluster.id,
        cluster.batchId,
        cluster.regionId,
        cluster.canonicalLabel,
        cluster.normalizedKey,
        cluster.eventType,
        cluster.eventScale,
        cluster.timeStart,
        cluster.timeEnd,
        cluster.candidateCount,
        cluster.sourceCount,
        cluster.personCount,
        cluster.bestMatch?.event.id ?? null,
        cluster.matchStatus,
        cluster.confidence,
        "staged",
        cluster.summary,
        toJson({
          generatedFrom: "archive-import-event-candidates",
          mergeStrategy: cluster.mergeStrategy,
          sourceIds: cluster.sourceIds,
          people: cluster.people,
          matchedEventTitle: cluster.bestMatch?.event.title ?? null,
          matchScore: cluster.bestMatch?.score ?? 0,
        }),
        now,
      );

      for (const [index, card] of cluster.cards.entries()) {
        const cardRaw = {
          ...card.raw,
          originalMacroEvent: card.raw.originalMacroEvent ?? card.macro_event,
          originalEventLabel: card.raw.originalEventLabel ?? card.event_label,
          eventClusterId: cluster.id,
          eventClusterLabel: cluster.canonicalLabel,
          eventClusterKey: cluster.normalizedKey,
          eventClusterMergeStrategy: cluster.mergeStrategy,
          matchedEventId: cluster.bestMatch?.event.id ?? null,
          archiveStatus: cluster.matchStatus,
        };
        updateCard.run(
          cluster.canonicalLabel,
          card.label,
          cluster.timeStart === cluster.timeEnd ? cluster.timeStart : null,
          toJson(cardRaw),
          card.id,
        );

        insertMember.run(
          cluster.id,
          card.id,
          index,
          cluster.mergeStrategy === "exact-label" ? 1 : 0.82,
          index === 0 ? "representative" : "supporting",
          toJson({
            sentenceIndex: card.sentenceIndex,
            sourceId: card.sourceId,
            passageId: card.passageId,
            originalEventLabel: card.event_label,
          }),
        );

        const mentionId = inferMentionId(card.id);
        if (mentionId) {
          const mention = db.prepare("SELECT raw_json FROM source_mentions WHERE id = ?").get(mentionId);
          if (mention) {
            updateMention.run(
              toJson({
                ...parseJson(mention.raw_json, {}),
                eventClusterId: cluster.id,
                eventClusterLabel: cluster.canonicalLabel,
                matchedEventId: cluster.bestMatch?.event.id ?? null,
                archiveStatus: cluster.matchStatus,
              }),
              mentionId,
            );
          }
          const document = db.prepare("SELECT raw_json FROM search_documents WHERE id = ?").get(mentionId);
          if (document) {
            updateDocument.run(
              cluster.timeStart,
              cluster.timeEnd,
              toJson({
                ...parseJson(document.raw_json, {}),
                eventClusterId: cluster.id,
                eventClusterLabel: cluster.canonicalLabel,
                matchedEventId: cluster.bestMatch?.event.id ?? null,
                archiveStatus: cluster.matchStatus,
              }),
              mentionId,
            );
            updateDocumentChunks.run(cluster.timeStart, cluster.timeEnd, mentionId);
          }
        }
      }
    }

    db.exec("COMMIT;");

    const report = {
      batchId,
      cards: cards.length,
      clusters: clusters.length,
      singletonClusters: clusters.filter((cluster) => cluster.candidateCount === 1).length,
      multiCardClusters: clusters.filter((cluster) => cluster.candidateCount > 1).length,
      exactMergeClusters: clusters.filter((cluster) => cluster.mergeStrategy === "exact-label").length,
      localWindowClusters: clusters.filter((cluster) => cluster.mergeStrategy === "local-window").length,
      matchedClusters: clusters.filter((cluster) => cluster.matchStatus === "matched").length,
      possibleMatchClusters: clusters.filter((cluster) => cluster.matchStatus === "possible").length,
      orphanImportCardSearchDocumentsDeleted: orphanSearchDocumentIds.length,
      largestClusters: clusters
        .sort((left, right) => right.candidateCount - left.candidateCount)
        .slice(0, 8)
        .map((cluster) => ({
          id: cluster.id,
          label: cluster.canonicalLabel,
          candidateCount: cluster.candidateCount,
          eventType: cluster.eventType,
          timeStart: cluster.timeStart,
          timeEnd: cluster.timeEnd,
          matchStatus: cluster.matchStatus,
          matchedEventId: cluster.bestMatch?.event.id ?? null,
        })),
    };
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
} finally {
  db.close();
}
