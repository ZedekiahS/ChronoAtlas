import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

import { canonicalizeRelatedEventReferences } from "./lib/event-reference-canonicalization.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const now = new Date().toISOString();

function stableId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 20);
}

function parseJson(value, fallback = {}) {
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

function normalizeForMatch(value) {
  return compact(value)
    .toLowerCase()
    .replace(/[《》〈〉「」『』（）()【】\[\]、，。；：:！？!?“”"‘’'·\-—\s]/gu, "")
    .replace(/^(事件|军事|内政|外交|政治|继承|宫廷|法律|行政|文化|社会|边疆|战争|战事|来源|史料)/u, "")
    .slice(0, 180);
}

function eventTypeFromCluster(type) {
  const normalized = String(type ?? "").toLowerCase();
  if (["military", "campaign", "war", "rebellion"].includes(normalized)) return "war";
  if (["succession", "politics", "administration", "law"].includes(normalized)) return "politics";
  if (["diplomacy", "frontier"].includes(normalized)) return normalized;
  if (["culture", "economy", "religion", "society"].includes(normalized)) return normalized;
  return "politics";
}

function inferMentionId(cardId) {
  if (cardId.startsWith("card:hanshu-auto:")) {
    return `hanshu-auto-candidate:${cardId.slice("card:hanshu-auto:".length)}`;
  }
  if (cardId.startsWith("card:houhanshu-auto:")) {
    return `houhanshu-auto-candidate:${cardId.slice("card:houhanshu-auto:".length)}`;
  }
  if (cardId.startsWith("card:houhanshu-eastern-han-auto:")) {
    return `houhanshu-eastern-han-auto-candidate:${cardId.slice("card:houhanshu-eastern-han-auto:".length)}`;
  }
  if (cardId.startsWith("card:sanguozhi-auto:")) {
    return `sanguozhi-auto-candidate:${cardId.slice("card:sanguozhi-auto:".length)}`;
  }
  if (cardId.startsWith("card:jinshu-auto:")) {
    return `jinshu-auto-candidate:${cardId.slice("card:jinshu-auto:".length)}`;
  }
  return null;
}

function confidenceRank(value) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function eventCanonicalScore(db, event) {
  const raw = parseJson(event.raw_json);
  const evidenceCount = db.prepare("SELECT COUNT(*) AS count FROM evidence_links WHERE subject_table = 'events' AND subject_id = ?").get(event.id).count;
  const entityCount = db.prepare("SELECT COUNT(*) AS count FROM event_entities WHERE event_id = ?").get(event.id).count;
  const searchCount = db.prepare("SELECT COUNT(*) AS count FROM search_documents WHERE subject_table = 'events' AND subject_id = ?").get(event.id).count;
  return (
    (event.review_status === "reviewed" ? 1000 : 0) +
    (raw?.detail ? 180 : 0) +
    (raw?.importance === "major" ? 120 : 0) +
    evidenceCount * 35 +
    entityCount * 25 +
    searchCount * 10 +
    confidenceRank(event.confidence) * 8 +
    compact(event.summary).length / 20 +
    (event.id.startsWith("china-") ? 12 : 0)
  );
}

function mergeRawAlias(rawJson, duplicateId, duplicateTitle, reason) {
  const raw = parseJson(rawJson);
  const aliases = Array.isArray(raw.mergedEventAliases) ? raw.mergedEventAliases : [];
  if (!aliases.some((item) => item?.id === duplicateId)) {
    aliases.push({ id: duplicateId, title: duplicateTitle, reason, mergedAt: now });
  }
  return toJson({ ...raw, mergedEventAliases: aliases });
}

function mergedEventAliasReplacements(db) {
  const replacements = new Map();
  for (const event of db.prepare("SELECT id, raw_json FROM events").all()) {
    const aliases = parseJson(event.raw_json).mergedEventAliases;
    if (!Array.isArray(aliases)) continue;
    for (const alias of aliases) {
      if (alias?.id && alias.id !== event.id) replacements.set(alias.id, event.id);
    }
  }
  return replacements;
}

function repairRelatedEventReferences(db) {
  const replacements = mergedEventAliasReplacements(db);
  if (!replacements.size) return 0;
  const updateEvent = db.prepare("UPDATE events SET raw_json = ? WHERE id = ?");
  let changed = 0;
  for (const event of db.prepare("SELECT id, raw_json FROM events").all()) {
    const result = canonicalizeRelatedEventReferences(parseJson(event.raw_json), event.id, replacements);
    if (!result.changed) continue;
    updateEvent.run(toJson(result.raw), event.id);
    changed += 1;
  }
  return changed;
}

function mergeHistoricalEvent(db, canonicalId, duplicateId) {
  const canonicalExists = db.prepare("SELECT 1 FROM historical_events WHERE id = ?").get(canonicalId);
  const duplicate = db.prepare("SELECT id, title, raw_json FROM historical_events WHERE id = ?").get(duplicateId);
  if (!canonicalExists || !duplicate) {
    return false;
  }

  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM historical_event_people WHERE event_id = ?").get(canonicalId).max_order;
  const existingPeople = new Set(
    db.prepare("SELECT COALESCE(person_id, '') || '|' || COALESCE(display_name, '') AS key FROM historical_event_people WHERE event_id = ?")
      .all(canonicalId)
      .map((row) => row.key),
  );
  const duplicatePeople = db.prepare("SELECT person_id, display_name, sort_order FROM historical_event_people WHERE event_id = ? ORDER BY sort_order").all(duplicateId);
  const insertPerson = db.prepare("INSERT OR IGNORE INTO historical_event_people (event_id, person_id, display_name, sort_order) VALUES (?, ?, ?, ?)");
  let nextOrder = maxOrder + 1;
  for (const person of duplicatePeople) {
    const key = `${person.person_id ?? ""}|${person.display_name ?? ""}`;
    if (existingPeople.has(key)) {
      continue;
    }
    insertPerson.run(canonicalId, person.person_id, person.display_name, nextOrder++);
    existingPeople.add(key);
  }

  db.prepare(`
    INSERT OR IGNORE INTO historical_event_sources (event_id, source_id, locator, raw_json)
    SELECT ?, source_id, locator, raw_json
    FROM historical_event_sources
    WHERE event_id = ?
  `).run(canonicalId, duplicateId);
  db.prepare(`
    INSERT OR IGNORE INTO historical_event_i18n (event_id, locale, title, location_name, summary, raw_json)
    SELECT ?, locale, title, location_name, summary, raw_json
    FROM historical_event_i18n
    WHERE event_id = ?
  `).run(canonicalId, duplicateId);

  db.prepare("UPDATE source_mention_events SET event_id = ? WHERE event_id = ?").run(canonicalId, duplicateId);
  db.prepare("UPDATE person_life_event_historical_events SET event_id = ? WHERE event_id = ?").run(canonicalId, duplicateId);
  db.prepare("DELETE FROM historical_event_people WHERE event_id = ?").run(duplicateId);
  db.prepare("DELETE FROM historical_event_sources WHERE event_id = ?").run(duplicateId);
  db.prepare("DELETE FROM historical_event_i18n WHERE event_id = ?").run(duplicateId);
  db.prepare("UPDATE historical_events SET raw_json = ? WHERE id = ?").run(
    mergeRawAlias(db.prepare("SELECT raw_json FROM historical_events WHERE id = ?").get(canonicalId).raw_json, duplicateId, duplicate.title, "exact-title-year-dedupe"),
    canonicalId,
  );
  db.prepare("DELETE FROM historical_events WHERE id = ?").run(duplicateId);
  return true;
}

function mergeEventEntities(db, canonicalId, duplicateId) {
  db.prepare(`
    INSERT OR IGNORE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    SELECT ?, entity_id, role, sort_order, raw_json
    FROM event_entities
    WHERE event_id = ?
  `).run(canonicalId, duplicateId);
  db.prepare("DELETE FROM event_entities WHERE event_id = ?").run(duplicateId);
}

function mergeEvents(db) {
  const duplicateGroups = db.prepare(`
    SELECT
      region_id,
      COALESCE(time_start, -99999) AS time_start_key,
      COALESCE(time_end, time_start, -99999) AS time_end_key,
      lower(replace(replace(replace(replace(title, ' ', ''), '，', ','), '：', ':'), '、', ',')) AS title_key,
      COUNT(*) AS count
    FROM events
    WHERE id NOT LIKE 'life:%'
    GROUP BY region_id, time_start_key, time_end_key, title_key
    HAVING count > 1
  `).all();

  let merged = 0;
  for (const group of duplicateGroups) {
    const rows = db.prepare(`
      SELECT *
      FROM events
      WHERE id NOT LIKE 'life:%'
        AND region_id = ?
        AND COALESCE(time_start, -99999) = ?
        AND COALESCE(time_end, time_start, -99999) = ?
        AND lower(replace(replace(replace(replace(title, ' ', ''), '，', ','), '：', ':'), '、', ',')) = ?
    `).all(group.region_id, group.time_start_key, group.time_end_key, group.title_key);
    if (rows.length < 2) {
      continue;
    }
    rows.sort((left, right) => eventCanonicalScore(db, right) - eventCanonicalScore(db, left) || left.id.localeCompare(right.id));
    const canonical = rows[0];
    const duplicates = rows.slice(1);

    for (const duplicate of duplicates) {
      mergeEventEntities(db, canonical.id, duplicate.id);
      db.prepare("UPDATE evidence_links SET subject_id = ? WHERE subject_table = 'events' AND subject_id = ?").run(canonical.id, duplicate.id);
      db.prepare("UPDATE evidence_claim_subjects SET subject_id = ? WHERE subject_table = 'events' AND subject_id = ?").run(canonical.id, duplicate.id);
      db.prepare("UPDATE map_feature_events SET event_id = ? WHERE event_id = ?").run(canonical.id, duplicate.id);
      db.prepare("UPDATE search_documents SET subject_id = ?, raw_json = ? WHERE subject_table = 'events' AND subject_id = ?").run(
        canonical.id,
        toJson({
          ...parseJson(db.prepare("SELECT raw_json FROM events WHERE id = ?").get(canonical.id)?.raw_json),
          canonicalEventId: canonical.id,
          mergedFromEventId: duplicate.id,
          mergedFromEventTitle: duplicate.title,
        }),
        duplicate.id,
      );
      db.prepare("UPDATE document_chunks SET subject_id = ? WHERE subject_table = 'events' AND subject_id = ?").run(canonical.id, duplicate.id);
      mergeHistoricalEvent(db, canonical.id, duplicate.id);
      db.prepare("UPDATE events SET raw_json = ? WHERE id = ?").run(mergeRawAlias(canonical.raw_json, duplicate.id, duplicate.title, "exact-title-year-dedupe"), canonical.id);
      db.prepare("DELETE FROM event_i18n WHERE event_id = ?").run(duplicate.id);
      db.prepare("DELETE FROM events WHERE id = ?").run(duplicate.id);
      merged += 1;
    }
  }
  return merged;
}

function ensurePersonEntities(db) {
  const regionIds = new Set(db.prepare("SELECT id FROM regions").all().map((row) => row.id));
  const insertEntity = db.prepare(`
    INSERT INTO entities (
      id, entity_type, primary_label, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    ) VALUES (?, 'person', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      primary_label = excluded.primary_label,
      region_id = COALESCE(entities.region_id, excluded.region_id),
      time_start = COALESCE(entities.time_start, excluded.time_start),
      time_end = COALESCE(entities.time_end, excluded.time_end),
      summary = COALESCE(NULLIF(entities.summary, ''), excluded.summary),
      confidence = COALESCE(entities.confidence, excluded.confidence),
      review_status = COALESCE(entities.review_status, excluded.review_status),
      raw_json = CASE
        WHEN entities.raw_json IS NULL OR entities.raw_json = '{}' THEN excluded.raw_json
        ELSE entities.raw_json
      END
  `);
  const insertAlias = db.prepare(`
    INSERT OR IGNORE INTO entity_aliases (id, entity_id, value, alias_type, language, raw_json)
    VALUES (?, ?, ?, ?, 'zh-Hans', ?)
  `);

  let created = 0;
  for (const person of db.prepare("SELECT * FROM persons").all()) {
    const entityId = `person:${person.id}`;
    const existed = db.prepare("SELECT 1 FROM entities WHERE id = ?").get(entityId);
    const raw = parseJson(person.raw_json);
    const result = insertEntity.run(
      entityId,
      person.name,
      regionIds.has(person.region) ? person.region : null,
      person.birth_year,
      person.death_year,
      person.summary,
      "medium",
      person.coverage_status ?? "draft",
      toJson({
        ...raw,
        generatedFrom: raw.generatedFrom ?? "canonicalize-events:persons",
        legacyPersonId: person.id,
        courtesyName: person.courtesy_name ?? raw.courtesyName ?? null,
        primaryPolity: person.primary_polity ?? raw.primaryPolity ?? "",
        life: person.life ?? raw.life ?? null,
      }),
    );
    if (!existed && result.changes > 0) {
      created += 1;
    }
    insertAlias.run(`alias:${entityId}:name`, entityId, person.name, "name", "{}");
    if (person.courtesy_name) {
      insertAlias.run(`alias:${entityId}:courtesy`, entityId, person.courtesy_name, "courtesy", "{}");
    }
  }
  return created;
}

function scoreClusterMatch(cluster, event) {
  if (event.region_id !== cluster.region_id) {
    return 0;
  }
  const eventYear = event.time_start ?? event.time_end;
  if (eventYear === null || eventYear === undefined) {
    return 0;
  }
  if (cluster.time_start !== null && eventYear < cluster.time_start) {
    return 0;
  }
  if (cluster.time_end !== null && eventYear > cluster.time_end) {
    return 0;
  }

  const title = normalizeForMatch(event.title);
  const label = normalizeForMatch(cluster.canonical_label);
  const text = normalizeForMatch(`${cluster.canonical_label} ${cluster.summary ?? ""}`);
  if (!title || !text) {
    return 0;
  }
  if (text.includes(title)) {
    return 0.94;
  }
  if (label && title.includes(label) && label.length >= 4) {
    return 0.9;
  }
  const titleChars = [...new Set([...title])];
  const textChars = new Set([...text]);
  const overlap = titleChars.filter((char) => textChars.has(char)).length / Math.max(1, titleChars.length);
  if (overlap >= 0.92 && title.length >= 5) {
    return 0.84;
  }
  if (overlap >= 0.82 && title.length >= 6) {
    return 0.74;
  }
  return 0;
}

function selectBestClusterMatch(cluster, events) {
  let best = null;
  for (const event of events) {
    const score = scoreClusterMatch(cluster, event);
    if (score > 0 && (!best || score > best.score)) {
      best = { event, score };
    }
  }
  return best;
}

function inferPeriodId(cluster) {
  if (cluster.region_id !== "china") {
    return null;
  }
  const start = cluster.time_start ?? cluster.time_end;
  const end = cluster.time_end ?? cluster.time_start;
  if (start === null || end === null) {
    return null;
  }
  if (start <= 280 && end >= 184) return "china-three-kingdoms-180-280";
  return null;
}

function clusterDocumentBody(cluster, members) {
  const snippets = members
    .map((member) => compact(member.fact_brief ?? member.original_text ?? member.event_label))
    .filter(Boolean)
    .slice(0, 8);
  return compact([
    cluster.canonical_label,
    cluster.summary,
    snippets.length ? `候选片段：${snippets.join("；")}` : "",
  ]);
}

function upsertClusterSearchDocument(db, cluster, members, canonicalEvent) {
  const id = `event-cluster:${cluster.id}`;
  const raw = parseJson(cluster.raw_json);
  const eventLabel = canonicalEvent?.title ?? cluster.canonical_label;
  db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, 'import_event_clusters', ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      region_id = excluded.region_id,
      period_id = excluded.period_id,
      topic_id = excluded.topic_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `).run(
    id,
    cluster.id,
    eventLabel,
    clusterDocumentBody(cluster, members),
    cluster.region_id,
    inferPeriodId(cluster),
    null,
    cluster.time_start,
    cluster.time_end,
    canonicalEvent ? "reviewed" : "needs-review",
    toJson({
      ...raw,
      generatedFrom: "canonicalize-events",
      eventClusterId: cluster.id,
      eventClusterLabel: cluster.canonical_label,
      eventLabel,
      macroEvent: eventLabel,
      canonicalEventId: canonicalEvent?.id ?? null,
      eventId: canonicalEvent?.id ?? null,
      candidateCount: cluster.candidate_count,
      sourceCount: cluster.source_count,
      personCount: cluster.person_count,
    }),
  );
  return id;
}

function promoteClusterToEvent(db, cluster, members) {
  const eventId = `auto-event:${stableId(`${cluster.region_id}:${cluster.time_start}:${cluster.time_end}:${cluster.normalized_key}`)}`;
  const raw = parseJson(cluster.raw_json);
  const sourceRefs = members
    .map((member) => ({
      sourceId: member.source_id,
      locator: member.locator,
      mentionId: member.mention_id,
    }))
    .filter((item) => item.sourceId && item.locator)
    .slice(0, 16);
  const title = compact(cluster.canonical_label).slice(0, 80) || "未命名事件候选";
  db.prepare(`
    INSERT INTO events (
      id, title, event_type, time_start, time_end, display_time, region_id,
      place_entity_id, summary, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'needs-review', ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      event_type = excluded.event_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      display_time = excluded.display_time,
      region_id = excluded.region_id,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `).run(
    eventId,
    title,
    eventTypeFromCluster(cluster.event_type),
    cluster.time_start,
    cluster.time_end,
    cluster.time_start === cluster.time_end ? String(cluster.time_start) : `${cluster.time_start ?? "?"}-${cluster.time_end ?? "?"}`,
    cluster.region_id,
    cluster.summary ?? title,
    cluster.confidence ?? "low",
    toJson({
      ...raw,
      generatedFrom: "canonicalize-events:cluster-promotion",
      eventClusterId: cluster.id,
      title,
      titleZh: title,
      startYear: cluster.time_start,
      endYear: cluster.time_end,
      region: cluster.region_id,
      category: eventTypeFromCluster(cluster.event_type),
      summary: cluster.summary ?? title,
      confidence: cluster.confidence ?? "low",
      sourceRefs,
      machinePromoted: true,
      promotionPolicy: "exact-year-or-reviewed-cluster-only",
    }),
  );
  return eventId;
}

function shouldPromoteUnmatchedCluster(cluster) {
  const raw = parseJson(cluster.raw_json);
  if (raw.mergeStrategy !== "exact-event-key" || cluster.review_status !== "approved") {
    return false;
  }
  if (cluster.time_start === null || cluster.time_end === null || cluster.time_start !== cluster.time_end) {
    return false;
  }
  if (cluster.candidate_count < 2 && cluster.person_count < 2) {
    return false;
  }
  if ((cluster.canonical_label ?? "").length < 4) {
    return false;
  }
  return cluster.confidence === "high" || cluster.confidence === "medium" || cluster.candidate_count >= 3;
}

function insertSourceMentionPeople(db, mentionId, people) {
  if (!people.length) {
    return 0;
  }
  const personRows = db.prepare("SELECT id, name FROM persons").all();
  const byName = new Map(personRows.map((person) => [person.name, person.id]));
  const insert = db.prepare("INSERT OR IGNORE INTO source_mention_people (mention_id, person_id, sort_order) VALUES (?, ?, ?)");
  let inserted = 0;
  [...new Set(people)].forEach((name, index) => {
    const personId = byName.get(name);
    if (!personId) {
      return;
    }
    const result = insert.run(mentionId, personId, index);
    inserted += result.changes;
  });
  return inserted;
}

function linkClusterMembers(db, cluster, members, canonicalEvent) {
  const updateMention = db.prepare("UPDATE source_mentions SET raw_json = ? WHERE id = ?");
  const updateSearchDocument = db.prepare("UPDATE search_documents SET time_start = COALESCE(time_start, ?), time_end = COALESCE(time_end, ?), raw_json = ? WHERE id = ?");
  const updateCard = db.prepare("UPDATE import_evidence_cards SET macro_event = ?, event_label = ?, raw_json = ? WHERE id = ?");
  const insertEvidence = db.prepare(`
    INSERT OR IGNORE INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    ) VALUES (?, 'events', ?, ?, ?, ?, ?, ?, 'support', ?, ?)
  `);
  const insertMentionEvent = db.prepare("INSERT OR IGNORE INTO source_mention_events (mention_id, event_id, sort_order) VALUES (?, ?, ?)");
  const insertEventEntity = db.prepare(`
    INSERT OR IGNORE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, 'mentioned-source', ?, ?)
  `);
  const historicalEventExists = canonicalEvent
    ? Boolean(db.prepare("SELECT 1 FROM historical_events WHERE id = ?").get(canonicalEvent.id))
    : false;

  let linkedMentions = 0;
  let linkedPeople = 0;
  let evidenceLinks = 0;
  for (const [index, member] of members.entries()) {
    const mentionId = member.mention_id;
    const mention = mentionId ? db.prepare("SELECT * FROM source_mentions WHERE id = ?").get(mentionId) : null;
    const cardRaw = parseJson(member.card_raw_json);
    const extractedPeople = Array.isArray(cardRaw.extractedPeople) ? cardRaw.extractedPeople : [];
    const eventLabel = canonicalEvent?.title ?? cluster.canonical_label;
    const rawPatch = {
      eventClusterId: cluster.id,
      eventClusterLabel: cluster.canonical_label,
      eventClusterCandidateCount: cluster.candidate_count,
      canonicalEventId: canonicalEvent?.id ?? null,
      eventId: canonicalEvent?.id ?? null,
      eventTitle: canonicalEvent?.title ?? null,
      eventLabel,
      macroEvent: eventLabel,
      archiveStatus: canonicalEvent ? "matched" : "clustered",
      canonicalizedAt: now,
    };

    updateCard.run(
      eventLabel,
      member.event_label ?? cluster.canonical_label,
      toJson({ ...cardRaw, ...rawPatch }),
      member.card_id,
    );

    if (!mention) {
      continue;
    }
    const mentionRaw = parseJson(mention.raw_json);
    updateMention.run(toJson({ ...mentionRaw, ...rawPatch }), mentionId);
    updateSearchDocument.run(
      cluster.time_start,
      cluster.time_end,
      toJson({ ...parseJson(db.prepare("SELECT raw_json FROM search_documents WHERE id = ?").get(mentionId)?.raw_json), ...rawPatch }),
      mentionId,
    );
    linkedPeople += insertSourceMentionPeople(db, mentionId, extractedPeople);

    if (canonicalEvent) {
      const evidenceId = `event-cluster-mention:${canonicalEvent.id}:${mentionId}`;
      const result = insertEvidence.run(
        evidenceId,
        canonicalEvent.id,
        mention.source_id,
        mention.passage_id,
        mentionId,
        mention.locator,
        mention.text,
        cluster.confidence ?? mention.confidence ?? "medium",
        toJson({
          generatedFrom: "canonicalize-events",
          eventClusterId: cluster.id,
          eventClusterLabel: cluster.canonical_label,
          memberCardId: member.card_id,
        }),
      );
      evidenceLinks += result.changes;
      if (historicalEventExists) {
        insertMentionEvent.run(mentionId, canonicalEvent.id, index);
      }
      for (const person of db.prepare("SELECT person_id, sort_order FROM source_mention_people WHERE mention_id = ? ORDER BY sort_order").all(mentionId)) {
        const entityId = `person:${person.person_id}`;
        if (!db.prepare("SELECT 1 FROM entities WHERE id = ?").get(entityId)) {
          continue;
        }
        insertEventEntity.run(
          canonicalEvent.id,
          entityId,
          1000 + person.sort_order,
          toJson({ generatedFrom: "source_mention_people", mentionId, eventClusterId: cluster.id }),
        );
      }
    }
    linkedMentions += 1;
  }
  return { linkedMentions, linkedPeople, evidenceLinks };
}

async function rebuildDocumentChunks(db) {
  const migrationPath = path.join(rootDir, "db", "migrations", "007-document-chunks-fts.mjs");
  const migration = await import(`${pathToFileURL(migrationPath).href}?canonicalize=${Date.now()}`);
  await migration.default(db);
}

async function main() {
  const db = new DatabaseSync(dbPath);
  const repairRelatedEventRefsOnly = process.argv.includes("--repair-related-event-refs-only");
  const stats = {
    exactDuplicateEventsMerged: 0,
    clustersProcessed: 0,
    clustersMatched: 0,
    clustersPossible: 0,
    clustersPromoted: 0,
    clusterSearchDocuments: 0,
    linkedMentions: 0,
    linkedPeople: 0,
    evidenceLinks: 0,
    personEntitiesCreated: 0,
    relatedEventReferencesRewritten: 0,
  };

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA busy_timeout = 15000;");
    db.exec("BEGIN;");
    if (repairRelatedEventRefsOnly) {
      stats.relatedEventReferencesRewritten = repairRelatedEventReferences(db);
      db.exec("COMMIT;");
      console.log(JSON.stringify({
        generatedAt: now,
        repairRelatedEventRefsOnly,
        stats,
      }, null, 2));
      return;
    }
    stats.personEntitiesCreated = ensurePersonEntities(db);
    stats.exactDuplicateEventsMerged = mergeEvents(db);
    stats.relatedEventReferencesRewritten = repairRelatedEventReferences(db);

    const events = db.prepare(`
      SELECT id, title, event_type, time_start, COALESCE(time_end, time_start) AS time_end, region_id, summary, confidence, review_status, raw_json
      FROM events
      WHERE id NOT LIKE 'life:%'
    `).all();
    const eventById = new Map(events.map((event) => [event.id, event]));

    const clusters = db.prepare(`
      SELECT *
      FROM import_event_clusters
      WHERE review_status <> 'rejected'
      ORDER BY batch_id, time_start, id
    `).all();
    const clusterUpdate = db.prepare(`
      UPDATE import_event_clusters
      SET matched_event_id = ?,
          match_status = ?,
          review_status = ?,
          raw_json = ?
      WHERE id = ?
    `);
    const memberRows = db.prepare(`
      SELECT
        m.cluster_id,
        m.card_id,
        m.sort_order,
        COALESCE(sm.source_id, json_extract(c.raw_json, '$.sourceId')) AS source_id,
        COALESCE(sm.locator, c.locator) AS locator,
        c.original_text,
        c.event_label,
        c.fact_brief,
        c.raw_json AS card_raw_json,
        CASE
          WHEN c.id LIKE 'card:hanshu-auto:%'
            THEN 'hanshu-auto-candidate:' || substr(c.id, length('card:hanshu-auto:') + 1)
          WHEN c.id LIKE 'card:houhanshu-auto:%'
            THEN 'houhanshu-auto-candidate:' || substr(c.id, length('card:houhanshu-auto:') + 1)
          WHEN c.id LIKE 'card:houhanshu-eastern-han-auto:%'
            THEN 'houhanshu-eastern-han-auto-candidate:' || substr(c.id, length('card:houhanshu-eastern-han-auto:') + 1)
          WHEN c.id LIKE 'card:sanguozhi-auto:%'
            THEN 'sanguozhi-auto-candidate:' || substr(c.id, length('card:sanguozhi-auto:') + 1)
          WHEN c.id LIKE 'card:jinshu-auto:%'
            THEN 'jinshu-auto-candidate:' || substr(c.id, length('card:jinshu-auto:') + 1)
          ELSE NULL
        END AS mention_id
      FROM import_event_cluster_members m
      JOIN import_evidence_cards c ON c.id = m.card_id
      LEFT JOIN source_mentions sm ON sm.id = CASE
        WHEN c.id LIKE 'card:hanshu-auto:%'
          THEN 'hanshu-auto-candidate:' || substr(c.id, length('card:hanshu-auto:') + 1)
        WHEN c.id LIKE 'card:houhanshu-auto:%'
          THEN 'houhanshu-auto-candidate:' || substr(c.id, length('card:houhanshu-auto:') + 1)
        WHEN c.id LIKE 'card:houhanshu-eastern-han-auto:%'
          THEN 'houhanshu-eastern-han-auto-candidate:' || substr(c.id, length('card:houhanshu-eastern-han-auto:') + 1)
        WHEN c.id LIKE 'card:sanguozhi-auto:%'
          THEN 'sanguozhi-auto-candidate:' || substr(c.id, length('card:sanguozhi-auto:') + 1)
        WHEN c.id LIKE 'card:jinshu-auto:%'
          THEN 'jinshu-auto-candidate:' || substr(c.id, length('card:jinshu-auto:') + 1)
        ELSE NULL
      END
      WHERE m.cluster_id = ?
      ORDER BY m.sort_order, m.card_id
    `);

    for (const cluster of clusters) {
      const raw = parseJson(cluster.raw_json);
      const members = memberRows.all(cluster.id);
      let canonicalEvent = cluster.matched_event_id ? eventById.get(cluster.matched_event_id) : null;
      let matchStatus = canonicalEvent ? "matched" : "unmatched";
      let matchScore = canonicalEvent ? 1 : 0;

      if (!canonicalEvent) {
        const best = selectBestClusterMatch(cluster, events);
        if (best?.score >= 0.88) {
          canonicalEvent = best.event;
          matchStatus = "matched";
          matchScore = best.score;
        } else if (best?.score >= 0.72) {
          matchStatus = "possible";
          matchScore = best.score;
          canonicalEvent = null;
        }
      }

      if (!canonicalEvent && shouldPromoteUnmatchedCluster(cluster)) {
        const eventId = promoteClusterToEvent(db, cluster, members);
        canonicalEvent = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
        events.push(canonicalEvent);
        eventById.set(eventId, canonicalEvent);
        matchStatus = "promoted";
        matchScore = 1;
        stats.clustersPromoted += 1;
      }

      clusterUpdate.run(
        canonicalEvent?.id ?? null,
        matchStatus === "promoted" ? "promoted" : matchStatus,
        canonicalEvent ? "promoted" : matchStatus === "possible" ? "needs-review" : cluster.review_status,
        toJson({
          ...raw,
          canonicalizedAt: now,
          canonicalEventId: canonicalEvent?.id ?? null,
          canonicalEventTitle: canonicalEvent?.title ?? null,
          matchScore,
        }),
        cluster.id,
      );

      const clusterDocId = upsertClusterSearchDocument(db, cluster, members, canonicalEvent);
      const linkStats = linkClusterMembers(db, cluster, members, canonicalEvent);
      stats.clustersProcessed += 1;
      stats.clusterSearchDocuments += clusterDocId ? 1 : 0;
      stats.linkedMentions += linkStats.linkedMentions;
      stats.linkedPeople += linkStats.linkedPeople;
      stats.evidenceLinks += linkStats.evidenceLinks;
      if (matchStatus === "matched") stats.clustersMatched += 1;
      if (matchStatus === "possible") stats.clustersPossible += 1;
    }

    db.exec("COMMIT;");
    await rebuildDocumentChunks(db);

    const report = {
      ...stats,
      events: db.prepare("SELECT COUNT(*) AS count FROM events WHERE id NOT LIKE 'life:%'").get().count,
      importEventClusters: db.prepare("SELECT COUNT(*) AS count FROM import_event_clusters").get().count,
      sourceMentionPeople: db.prepare("SELECT COUNT(*) AS count FROM source_mention_people").get().count,
      generatedAt: now,
    };
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // Ignore rollback failures after a successful commit.
    }
    throw error;
  } finally {
    db.close();
  }
}

await main();
