import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isHistoricalPersonTemporallyPlausible } from "./historical-person-matching.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const requestedDbPath = process.argv
  .find((argument) => argument.startsWith("--db="))
  ?.slice("--db=".length);
const defaultProvider = "chronoatlas-rule-extractor";
const chronologyConfidenceRank = new Map([["low", 1], ["medium", 2], ["high", 3]]);

export function stableId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
}

export function compactWhitespace(value) {
  return String(value ?? "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function chronologyLeadForRejectedSentence(value) {
  const sentence = compactWhitespace(value);
  const quoteIndex = sentence.search(/[“「『]/u);
  if (quoteIndex < 0) return null;
  return compactWhitespace(sentence.slice(0, quoteIndex)) || null;
}

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stripChrome(value, config) {
  let text = compactWhitespace(value);
  for (const pattern of config.stripPatterns ?? []) {
    text = text.replace(pattern, "");
  }
  return text.replace(/\[[^\]]{1,40}\]/gu, "");
}

const quoteCloseByOpen = new Map([
  ["“", "”"],
  ["‘", "’"],
  ["「", "」"],
  ["『", "』"],
]);
const quoteCloseCharacters = new Set(quoteCloseByOpen.values());

export function splitSourceSentences(text, config = {}, quoteState = { stack: [] }) {
  const minLength = config.minSentenceLength ?? 8;
  const source = stripChrome(text, config);
  if (!config.excludeQuotedContinuations) {
    return source
      .split(config.sentenceSplitPattern ?? /(?<=[。！？；;])|[\r\n]+/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= minLength);
  }

  const stack = Array.isArray(quoteState.stack) ? quoteState.stack : [];
  quoteState.stack = stack;
  const sentences = [];
  let segment = "";
  let outsideContentLength = 0;
  const flush = () => {
    const sentence = segment.trim();
    const allowedQuotedContinuation = config.quotedContinuationPattern?.test(sentence) === true;
    if (sentence.length >= minLength && (outsideContentLength > 0 || allowedQuotedContinuation)) {
      sentences.push(sentence);
    }
    segment = "";
    outsideContentLength = 0;
  };

  for (const character of source) {
    const outsideBefore = stack.length === 0;
    segment += character;
    if (quoteCloseByOpen.has(character)) {
      stack.push(quoteCloseByOpen.get(character));
    } else if (quoteCloseCharacters.has(character)) {
      const matchingIndex = stack.lastIndexOf(character);
      if (matchingIndex >= 0) stack.splice(matchingIndex);
    } else if (outsideBefore && /[\p{Script=Han}A-Za-z0-9]/u.test(character)) {
      outsideContentLength += 1;
    }
    if (/[。！？；;]/u.test(character)) flush();
  }
  flush();
  return sentences;
}

function classifySentence(sentence, config) {
  const scores = config.classifiers.map((classifier) => ({
    ...classifier,
    score: classifier.keywords.reduce((sum, keyword) => sum + (sentence.includes(keyword) ? 1 : 0), 0),
  }));
  scores.sort((left, right) => right.score - left.score);
  const best = scores[0];
  if (!best || best.score === 0) {
    return null;
  }

  const scaleBoost = config.scaleBoostPattern?.test(sentence) ? 2 : 0;
  const scaleScore = best.score + scaleBoost + (sentence.length > (config.longSentenceLength ?? 70) ? 1 : 0);
  return {
    factType: best.factType,
    factTypeLabel: best.label,
    eventScale: scaleScore >= 5 ? "major" : scaleScore >= 3 ? "medium" : "minor",
    confidence: best.score >= 3 ? "medium" : "low",
  };
}

function buildPersonAliases(rows, config) {
  const stopNameTokens = config.stopNameTokens ?? new Set();
  const aliases = new Map();
  for (const row of rows) {
    const values = [row.name, row.courtesy_name, row.alias_value]
      .map(compactWhitespace)
      .filter((value) => value.length >= 2 && value.length <= (config.maxAliasLength ?? 4) && !stopNameTokens.has(value));
    for (const value of values) {
      aliases.set(`${row.id}:${value}`, {
        id: row.id,
        name: row.name,
        alias: value,
        birthYear: row.birth_year,
        deathYear: row.death_year,
        primaryPolity: row.primary_polity,
      });
    }
  }
  return [...aliases.values()].sort((left, right) => right.alias.length - left.alias.length || left.alias.localeCompare(right.alias));
}

export function findKnownPeople(sentence, aliases, config = {}, chronology = null) {
  const found = [];
  const seen = new Set();
  const maxPeople = config.maxPeoplePerCandidate ?? 10;
  const aliasesByValue = new Map();
  for (const alias of aliases) {
    const matches = aliasesByValue.get(alias.alias) ?? [];
    matches.push(alias);
    aliasesByValue.set(alias.alias, matches);
  }
  const orderedAliases = [...aliasesByValue.keys()]
    .sort((left, right) => right.length - left.length || left.localeCompare(right));
  for (const aliasValue of orderedAliases) {
    const matchIndex = sentence.indexOf(aliasValue);
    if (matchIndex < 0) continue;
    const candidates = aliasesByValue.get(aliasValue)
      .filter((alias) => !seen.has(alias.id))
      .filter((alias) => isHistoricalPersonTemporallyPlausible(alias, chronology?.year, config))
      .filter((alias) => !config.rejectPersonMatch?.(sentence, alias, matchIndex));
    const uniqueCandidates = candidates.filter(
      (candidate, index, items) => items.findIndex((item) => item.id === candidate.id) === index,
    );
    if (uniqueCandidates.length !== 1) continue;
    const alias = uniqueCandidates[0];
    found.push({ id: alias.id, name: alias.name, matched: alias.alias });
    seen.add(alias.id);
    if (found.length >= maxPeople) {
      break;
    }
  }
  return found;
}

function loadPlaceRecords(db, config) {
  const startYear = config.placeRange?.startYear ?? config.personRange?.startYear ?? -9999;
  const endYear = config.placeRange?.endYear ?? config.personRange?.endYear ?? 9999;
  const rows = db.prepare(`
    SELECT
      e.id,
      e.primary_label,
      e.region_id,
      e.time_start,
      e.time_end,
      e.raw_json,
      a.value AS alias_value
    FROM entities e
    LEFT JOIN entity_aliases a ON a.entity_id = e.id
    WHERE e.entity_type = 'place'
      AND e.region_id = ?
      AND COALESCE(e.time_end, ?) >= ?
      AND COALESCE(e.time_start, ?) <= ?
      AND e.review_status <> 'rejected'
    ORDER BY e.id, a.value
  `).all(config.regionId ?? "china", endYear, startYear, startYear, endYear);
  const byId = new Map();
  for (const row of rows) {
    const raw = parseJson(row.raw_json);
    const place = byId.get(row.id) ?? {
      id: raw.stablePlaceId ?? row.id.replace(/^place:/u, ""),
      entityId: row.id,
      label: row.primary_label,
      regionId: row.region_id,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      aliases: [],
      locativeOnlyAliases: Array.isArray(raw.locativeOnlyAliases) ? raw.locativeOnlyAliases : [],
      mapFeatureNames: Array.isArray(raw.mapFeatureNames) ? raw.mapFeatureNames : [],
    };
    if (row.alias_value && row.alias_value !== place.label && !place.aliases.includes(row.alias_value)) {
      place.aliases.push(row.alias_value);
    }
    byId.set(row.id, place);
  }
  return [...byId.values()];
}

function defaultCandidateTitle(sentence, people, classification) {
  const names = people.slice(0, 3).map((person) => person.name).join("、");
  const text = sentence.replace(/[。！？；;]+$/u, "");
  return names ? `${names}${classification.factTypeLabel}` : text.slice(0, 24);
}

function defaultDocumentBody(candidate) {
  return [
    `候选：${candidate.title}`,
    `出处：${candidate.sourceTitle} ${candidate.passage.locator}`,
    `类型：${candidate.classification.factTypeLabel}`,
    `人物：${candidate.allPeople.map((person) => person.name).join("、") || "未识别"}`,
    `地点：${candidate.places.map((place) => place.label).join("、") || "未识别"}`,
    candidate.sentence,
  ].join("\n");
}

function defaultSourceSectionType() {
  return { type: "source", label: "史料" };
}

function validateConfig(config) {
  const required = [
    "batchId",
    "candidatePrefix",
    "cardPrefix",
    "filePrefix",
    "workTitle",
    "quotedWork",
    "sourceWhereSql",
    "sourceRoot",
    "corpusHint",
    "collectionHint",
    "periodHint",
    "classifiers",
    "topicIdForFactType",
    "macroEventForClassification",
  ];
  for (const key of required) {
    if (config[key] === undefined || config[key] === null || config[key] === "") {
      throw new Error(`Missing extractor config field: ${key}`);
    }
  }
}

function tableExists(db, tableName) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName));
}

function runIfTableExists(db, tableName, sql, params = []) {
  if (tableExists(db, tableName)) {
    db.prepare(sql).run(...params);
  }
}

function clearExistingCandidateBatch(db, config) {
  const mentionPattern = `${config.candidatePrefix}:%`;
  const legacyDocumentPattern = mentionPattern;
  const documentPattern = `source-mention:${mentionPattern}`;
  const cardPattern = `${config.cardPrefix}:%`;

  runIfTableExists(db, "document_chunks", "DELETE FROM document_chunks WHERE search_document_id LIKE ? OR search_document_id LIKE ?", [documentPattern, legacyDocumentPattern]);
  runIfTableExists(db, "evidence_links", "DELETE FROM evidence_links WHERE mention_id LIKE ? OR subject_id LIKE ?", [mentionPattern, mentionPattern]);
  runIfTableExists(db, "evidence_claim_sources", "DELETE FROM evidence_claim_sources WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "ai_retrieval_items", "DELETE FROM ai_retrieval_items WHERE mention_id LIKE ? OR search_document_id LIKE ? OR search_document_id LIKE ?", [mentionPattern, documentPattern, legacyDocumentPattern]);
  runIfTableExists(db, "person_life_event_source_mentions", "DELETE FROM person_life_event_source_mentions WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "person_relation_source_mentions", "DELETE FROM person_relation_source_mentions WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "map_control_record_sources", "DELETE FROM map_control_record_sources WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "map_feature_sources", "DELETE FROM map_feature_sources WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "source_mention_i18n", "DELETE FROM source_mention_i18n WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "source_mention_people", "DELETE FROM source_mention_people WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "source_mention_events", "DELETE FROM source_mention_events WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "source_mention_places", "DELETE FROM source_mention_places WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "source_mention_tags", "DELETE FROM source_mention_tags WHERE mention_id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "search_documents", "DELETE FROM search_documents WHERE id LIKE ? OR id LIKE ? OR subject_id LIKE ?", [documentPattern, legacyDocumentPattern, mentionPattern]);
  runIfTableExists(db, "import_event_cluster_members", "DELETE FROM import_event_cluster_members WHERE card_id LIKE ?", [cardPattern]);
  runIfTableExists(db, "import_event_clusters", "DELETE FROM import_event_clusters WHERE batch_id = ?", [config.batchId]);
  runIfTableExists(db, "source_mentions", "DELETE FROM source_mentions WHERE id LIKE ?", [mentionPattern]);
  runIfTableExists(db, "import_batches", "DELETE FROM import_batches WHERE id = ?", [config.batchId]);
}

export function runRuleBasedSourceCandidateExtractor(config) {
  validateConfig(config);
  const databasePath = config.dbPath ?? (requestedDbPath ? path.resolve(rootDir, requestedDbPath) : dbPath);
  const db = new DatabaseSync(databasePath);
  const now = new Date().toISOString();
  const provider = config.provider ?? defaultProvider;

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA busy_timeout = 30000;");
    config.prepareDatabase?.(db);

    const sources = db.prepare(`
      SELECT id, title, author, type, citation_short
      FROM sources s
      WHERE ${config.sourceWhereSql}
      ORDER BY id
    `).all();

    const passages = db.prepare(`
      SELECT sp.*
      FROM source_passages sp
      JOIN sources s ON s.id = sp.source_id
      WHERE ${config.sourceWhereSql}
      ORDER BY sp.source_id, COALESCE(sp.sequence, 0), sp.id
    `).all();

    const personRows = db.prepare(`
      SELECT p.id, p.name, p.courtesy_name, p.birth_year, p.death_year, p.primary_polity,
             pa.value AS alias_value
      FROM persons p
      LEFT JOIN person_aliases pa ON pa.person_id = p.id
      WHERE p.region = ?
        AND p.coverage_status <> 'candidate'
        AND COALESCE(p.death_year, ?) >= ?
        AND COALESCE(p.birth_year, ?) <= ?
      ORDER BY p.id
    `).all(
      config.regionId ?? "china",
      config.personRange?.endYear ?? 9999,
      config.personRange?.startYear ?? -9999,
      config.personRange?.endYear ?? 9999,
      config.personRange?.endYear ?? 9999,
    );

    const personAliases = buildPersonAliases(personRows, config);
    const placeRecords = loadPlaceRecords(db, config);
    const chronologyEras = config.chronologySystem
      ? db.prepare(`
        SELECT *
        FROM chronology_eras
        WHERE calendar_system = ? AND review_status <> 'rejected'
        ORDER BY length(era_label) DESC, era_label, context_key, time_start
      `).all(config.chronologySystem)
      : [];
    const sentenceChronologyResolver = config.createSentenceChronologyResolver?.({
      eras: chronologyEras,
      config,
    }) ?? null;
    const sentencePersonResolver = config.createSentencePersonResolver?.({ config }) ?? null;
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const quoteStateBySource = new Map();
    const candidates = [];
    const perSourceCounts = new Map();
    const maxCandidatesPerPassage = config.maxCandidatesPerPassage ?? 8;

    for (const passage of passages) {
      const source = sourceById.get(passage.source_id);
      if (!source) {
        continue;
      }
      const section = (config.sourceSectionType ?? defaultSourceSectionType)(source.title, source);
      if (
        config.allowedSourceSectionTypes?.length
        && !config.allowedSourceSectionTypes.includes(section.type)
      ) {
        continue;
      }
      const quoteState = quoteStateBySource.get(source.id) ?? { stack: [] };
      quoteStateBySource.set(source.id, quoteState);
      const sentences = splitSourceSentences(passage.text, config, quoteState);
      let passageCount = 0;
      for (const [sentenceIndex, sourceSentence] of sentences.entries()) {
        const chronologyContext = {
          passage,
          source,
          section,
          workTitle: config.workTitle,
          sentenceIndex,
        };
        const narrativeText = config.candidateNarrativeText
          ? config.candidateNarrativeText(sourceSentence, chronologyContext)
          : sourceSentence;
        const sentence = compactWhitespace(narrativeText);
        if (!sentence) {
          const chronologyLead = chronologyLeadForRejectedSentence(sourceSentence);
          if (chronologyLead) sentenceChronologyResolver?.resolve(chronologyLead, chronologyContext);
          continue;
        }
        if (config.rejectSentence?.(sentence, { passage, source, section })) {
          const chronologyLead = chronologyLeadForRejectedSentence(sourceSentence);
          if (chronologyLead) sentenceChronologyResolver?.resolve(chronologyLead, chronologyContext);
          continue;
        }
        const sentenceChronology = sentenceChronologyResolver?.resolve(sentence, chronologyContext) ?? null;
        const currentPeople = findKnownPeople(sentence, personAliases, config, sentenceChronology);
        const personContext = {
          passage,
          source,
          section,
          workTitle: config.workTitle,
          sentenceIndex,
          currentPeople,
        };
        const contextualPeople = sentencePersonResolver?.resolve(sentence, personContext) ?? [];
        if (passageCount >= maxCandidatesPerPassage) {
          continue;
        }
        if (config.candidateTimeRange?.requireExact && !Number.isInteger(sentenceChronology?.year)) {
          continue;
        }
        if (
          config.minimumChronologyConfidence
          && (chronologyConfidenceRank.get(sentenceChronology?.confidence) ?? 0)
            < (chronologyConfidenceRank.get(config.minimumChronologyConfidence) ?? 0)
        ) {
          continue;
        }
        if (Number.isInteger(sentenceChronology?.year) && config.candidateTimeRange) {
          if (
            sentenceChronology.year < config.candidateTimeRange.startYear
            || sentenceChronology.year > config.candidateTimeRange.endYear
          ) {
            continue;
          }
        }
        const classification = classifySentence(sentence, config);
        if (!classification) {
          continue;
        }
        const people = currentPeople;
        const places = config.findPlaces?.(sentence, placeRecords, { passage, source, classification }) ?? [];
        const discoveredPeople = [
          ...contextualPeople,
          ...(config.discoverPeople?.(sentence, [...people, ...contextualPeople], {
            passage,
            source,
            classification,
            places,
          }) ?? []),
        ]
          .filter((person) => person?.name && !people.some((known) => known.name === person.name));
        const allPeople = [...people, ...discoveredPeople]
          .filter((person, index, items) => items.findIndex((item) => item.name === person.name) === index);
        sentencePersonResolver?.observe(allPeople, personContext);
        const allowMinorWithoutPeople = config.allowMinorWithoutPeople?.({
          sentence,
          classification,
          places,
          passage,
          source,
        }) === true;
        if (
          !allPeople.length
          && classification.eventScale === "minor"
          && config.requirePeopleForMinor !== false
          && !allowMinorWithoutPeople
        ) {
          continue;
        }
        const sourceTitle = source.citation_short || source.title;
        const id = stableId(`${source.id}:${passage.id}:${sentenceIndex}:${sourceSentence}`);
        const title = (config.candidateTitle ?? defaultCandidateTitle)(sentence, allPeople, classification, passage, source);
        if (!title) {
          continue;
        }
        candidates.push({
          id,
          source,
          sourceTitle,
          passage,
          sentenceIndex,
          sentence,
          sourceSentence,
          title,
          people,
          discoveredPeople,
          allPeople,
          places,
          classification,
          section,
          sentenceChronology,
        });
        passageCount += 1;
        perSourceCounts.set(source.id, (perSourceCounts.get(source.id) ?? 0) + 1);
      }
    }

    const insertBatch = db.prepare(`
      INSERT INTO import_batches (id, created_at, source_provider, source_root, status, notes, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        created_at = excluded.created_at,
        source_provider = excluded.source_provider,
        source_root = excluded.source_root,
        status = excluded.status,
        notes = excluded.notes,
        raw_json = excluded.raw_json
    `);
    const insertFile = db.prepare(`
      INSERT INTO import_draft_files (
        id, batch_id, relative_path, sha256, source_provider, corpus_hint, collection_hint,
        card_count, error_count, warning_count, import_status, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'staged', ?, ?)
      ON CONFLICT(batch_id, relative_path) DO UPDATE SET
        sha256 = excluded.sha256,
        source_provider = excluded.source_provider,
        corpus_hint = excluded.corpus_hint,
        collection_hint = excluded.collection_hint,
        card_count = excluded.card_count,
        import_status = excluded.import_status,
        raw_json = excluded.raw_json,
        created_at = excluded.created_at
    `);
    const insertCard = db.prepare(`
      INSERT INTO import_evidence_cards (
        id, batch_id, file_id, card_index, source_title, source_type, author, commentary_author,
        quoted_work, section, locator, year, display_date, original_text, translation,
        people_core_json, people_mentioned_json, places_json, macro_event, event_label,
        fact_brief, fact_detailed, fact_type, confidence, questions_json, review_status,
        validation_errors_json, validation_warnings_json, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'staged', '[]', ?, ?, ?)
      ON CONFLICT(file_id, card_index) DO UPDATE SET
        source_title = excluded.source_title,
        source_type = excluded.source_type,
        author = excluded.author,
        commentary_author = excluded.commentary_author,
        quoted_work = excluded.quoted_work,
        section = excluded.section,
        locator = excluded.locator,
        year = excluded.year,
        original_text = excluded.original_text,
        people_core_json = excluded.people_core_json,
        people_mentioned_json = excluded.people_mentioned_json,
        places_json = excluded.places_json,
        macro_event = excluded.macro_event,
        event_label = excluded.event_label,
        fact_brief = excluded.fact_brief,
        fact_detailed = excluded.fact_detailed,
        fact_type = excluded.fact_type,
        confidence = excluded.confidence,
        questions_json = excluded.questions_json,
        review_status = excluded.review_status,
        validation_warnings_json = excluded.validation_warnings_json,
        raw_json = excluded.raw_json,
        created_at = excluded.created_at
    `);
    const insertMention = db.prepare(`
      INSERT INTO source_mentions (
        id, source_id, passage_id, work_title, book_title, chapter_title, locator,
        year, text, translation, confidence, review_status, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'draft', ?)
      ON CONFLICT(id) DO UPDATE SET
        source_id = excluded.source_id,
        passage_id = excluded.passage_id,
        work_title = excluded.work_title,
        book_title = excluded.book_title,
        chapter_title = excluded.chapter_title,
        locator = excluded.locator,
        year = excluded.year,
        text = excluded.text,
        confidence = excluded.confidence,
        review_status = excluded.review_status,
        raw_json = excluded.raw_json
    `);
    const insertMentionPerson = db.prepare(`
      INSERT OR REPLACE INTO source_mention_people (mention_id, person_id, sort_order)
      VALUES (?, ?, ?)
    `);
    const insertMentionPlace = db.prepare(`
      INSERT OR REPLACE INTO source_mention_places (mention_id, place_id, sort_order)
      VALUES (?, ?, ?)
    `);
    const insertTag = db.prepare(`
      INSERT OR REPLACE INTO source_mention_tags (mention_id, tag, sort_order)
      VALUES (?, ?, ?)
    `);
    const insertDocument = db.prepare(`
      INSERT INTO search_documents (
        id, subject_table, subject_id, title, body, language, region_id, period_id,
        topic_id, time_start, time_end, review_status, raw_json
      ) VALUES (?, 'source_mentions', ?, ?, ?, 'zh-Hans', ?, NULL, ?, ?, ?, 'draft', ?)
      ON CONFLICT(id) DO UPDATE SET
        subject_table = excluded.subject_table,
        subject_id = excluded.subject_id,
        title = excluded.title,
        body = excluded.body,
        region_id = excluded.region_id,
        period_id = excluded.period_id,
        topic_id = excluded.topic_id,
        time_start = excluded.time_start,
        time_end = excluded.time_end,
        review_status = excluded.review_status,
        raw_json = excluded.raw_json
    `);

    db.exec("BEGIN;");
    try {
      clearExistingCandidateBatch(db, config);

      insertBatch.run(
        config.batchId,
        now,
        provider,
        config.sourceRoot,
        "staged",
        config.notes,
        toJson({
          pipeline: "source-event-candidates-v1",
          candidateKind: "source-event-fact",
          promotionProfile: config.promotionProfile ?? null,
          chronologySystem: config.chronologySystem ?? null,
          regionId: config.regionId ?? null,
          work: config.workTitle,
          sourceScope: config.sourceRoot,
          sourceCount: sources.length,
          passageCount: passages.length,
          candidateCount: candidates.length,
        }),
      );

      const sourceCardIndexes = new Map();
      for (const source of sources) {
        const fileId = `${config.filePrefix}:${stableId(source.id)}`;
        const cardCount = perSourceCounts.get(source.id) ?? 0;
        insertFile.run(
          fileId,
          config.batchId,
          `sqlite/${source.id}`,
          stableId(`${source.id}:${cardCount}`),
          provider,
          config.corpusHint,
          config.collectionHint,
          cardCount,
          toJson({ sourceId: source.id, title: source.title }),
          now,
        );
        sourceCardIndexes.set(source.id, { fileId, index: 0 });
      }

      for (const candidate of candidates) {
        const sourceIndex = sourceCardIndexes.get(candidate.source.id);
        const cardIndex = sourceIndex.index++;
        const mentionId = `${config.candidatePrefix}:${candidate.id}`;
        const cardId = `${config.cardPrefix}:${candidate.id}`;
        const sourceYearStart = Number.isInteger(candidate.passage.year_start) ? candidate.passage.year_start : null;
        const sourceYearEnd = Number.isInteger(candidate.passage.year_end) ? candidate.passage.year_end : sourceYearStart;
        const exactYear = Number.isInteger(candidate.sentenceChronology?.year) ? candidate.sentenceChronology.year : null;
        const yearStart = exactYear ?? sourceYearStart;
        const yearEnd = exactYear ?? sourceYearEnd;
        const raw = {
          generatedFrom: config.batchId,
          pipeline: "source-event-candidates-v1",
          candidateKind: "source-event-fact",
          promotionProfile: config.promotionProfile ?? null,
          chronologySystem: config.chronologySystem ?? null,
          regionId: config.regionId ?? null,
          mentionId,
          sourceId: candidate.source.id,
          passageId: candidate.passage.id,
          sentenceIndex: candidate.sentenceIndex,
          ...(candidate.sourceSentence !== candidate.sentence
            ? { sourceSentence: candidate.sourceSentence }
            : {}),
          sourceSectionType: candidate.section.type,
          sourceSectionLabel: candidate.section.label,
          periodHint: config.periodHint,
          sourceTimeRange: [sourceYearStart, sourceYearEnd],
          sentenceChronology: candidate.sentenceChronology,
          eventScale: candidate.classification.eventScale,
          eventTypeLabel: candidate.classification.factTypeLabel,
          extractedPeople: candidate.people,
          discoveredPeople: candidate.discoveredPeople,
          extractedPlaces: candidate.places,
          peopleCore: candidate.people.map((person) => person.name),
          peopleMentioned: candidate.discoveredPeople.map((person) => person.name),
          places: candidate.places.map((place) => place.label),
          reviewGuidance: config.reviewGuidance,
        };
        const peopleNames = candidate.people.map((person) => person.name);
        const discoveredPeopleNames = candidate.discoveredPeople.map((person) => person.name);
        const allPeopleNames = candidate.allPeople.map((person) => person.name);
        const placeNames = candidate.places.map((place) => place.label);

        insertCard.run(
          cardId,
          config.batchId,
          sourceIndex.fileId,
          cardIndex,
          candidate.sourceTitle,
          candidate.section.type,
          candidate.source.author || config.defaultAuthor || null,
          config.commentaryAuthorForSentence?.(candidate.sentence) ?? null,
          config.quotedWork,
          candidate.section.label,
          candidate.passage.locator,
          yearStart === yearEnd ? yearStart : null,
          candidate.sentence,
          toJson(peopleNames),
          toJson(discoveredPeopleNames),
          toJson(placeNames),
          config.macroEventForClassification(candidate.classification),
          candidate.title,
          candidate.sentence.slice(0, 96),
          candidate.sentence,
          candidate.classification.factType,
          candidate.classification.confidence,
          toJson(config.reviewQuestions ?? []),
          toJson([`candidateScale:${candidate.classification.eventScale}`]),
          toJson(raw),
          now,
        );

        insertMention.run(
          mentionId,
          candidate.source.id,
          candidate.passage.id,
          config.workTitle,
          candidate.sourceTitle,
          candidate.section.label,
          candidate.passage.locator,
          yearStart === yearEnd ? yearStart : null,
          candidate.sentence,
          candidate.classification.confidence,
          toJson(raw),
        );

        for (const [index, person] of candidate.people.entries()) {
          insertMentionPerson.run(mentionId, person.id, index);
        }
        for (const [index, place] of candidate.places.entries()) {
          insertMentionPlace.run(mentionId, place.id, index);
        }
        const tags = [
          `fact:${candidate.classification.factType}`,
          `scale:${candidate.classification.eventScale}`,
          `source-section:${candidate.section.type}`,
          ...allPeopleNames.map((name) => `person:${name}`),
          ...placeNames.map((name) => `place:${name}`),
        ];
        tags.forEach((tag, index) => insertTag.run(mentionId, tag, index));

        insertDocument.run(
          `source-mention:${mentionId}`,
          mentionId,
          candidate.title,
          (config.documentBody ?? defaultDocumentBody)(candidate),
          config.regionId ?? "china",
          config.topicIdForFactType(candidate.classification.factType),
          yearStart,
          yearEnd,
          toJson(raw),
        );
      }

      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }

    const report = {
      batchId: config.batchId,
      sources: sources.length,
      passages: passages.length,
      candidates: candidates.length,
      withPeople: candidates.filter((candidate) => candidate.allPeople.length > 0).length,
      withDiscoveredPeople: candidates.filter((candidate) => candidate.discoveredPeople.length > 0).length,
      withPlaces: candidates.filter((candidate) => candidate.places.length > 0).length,
      byFactType: Object.fromEntries(
        config.classifiers.map((classifier) => [
          classifier.factType,
          candidates.filter((candidate) => candidate.classification.factType === classifier.factType).length,
        ]),
      ),
      byScale: {
        major: candidates.filter((candidate) => candidate.classification.eventScale === "major").length,
        medium: candidates.filter((candidate) => candidate.classification.eventScale === "medium").length,
        minor: candidates.filter((candidate) => candidate.classification.eventScale === "minor").length,
      },
      sample: candidates.slice(0, 8).map((candidate) => ({
        title: candidate.title,
        source: candidate.sourceTitle,
        locator: candidate.passage.locator,
        type: candidate.classification.factType,
        scale: candidate.classification.eventScale,
        people: candidate.allPeople.map((person) => person.name),
        places: candidate.places.map((place) => place.label),
        text: candidate.sentence.slice(0, 80),
      })),
    };
    console.log(JSON.stringify(report, null, 2));
    return report;
  } finally {
    db.close();
  }
}
