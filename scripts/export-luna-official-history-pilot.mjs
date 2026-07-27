import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { chinaRegnalReferenceWesternHanXinTransition824 } from "../db/data/china-regnal-reference-western-han-xin-transition--8-24.mjs";
import { sectionFromRules } from "./lib/china-official-history-candidate-configs.mjs";
import { findPlaceMentions } from "./lib/china-official-history-reference-resolver.mjs";
import { hasOfficialHistoryAbbreviatedMention } from "./lib/china-official-history-person-sequence-resolver.mjs";
import { resolveChinaRegnalDate } from "./lib/china-regnal-date-resolver.mjs";
import { createChinaRegnalSequenceResolver } from "./lib/china-regnal-sequence-resolver.mjs";
import { isHistoricalPersonTemporallyPlausible } from "./lib/historical-person-matching.mjs";
import {
  classifyOfficialHistoryTextKind,
  isolateOfficialHistoryNarrativeText,
} from "./lib/official-history-source-cleaning.mjs";
import { splitSourceSentences, stableId } from "./lib/rule-based-source-candidate-extractor.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="))?.slice("--db=".length);
const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const outputDir = path.join(rootDir, "data", "import-drafts", "luna");
const inputPath = path.join(outputDir, "xin-transition--8-24-pilot-input.jsonl");
const manifestPath = path.join(outputDir, "xin-transition--8-24-pilot-input-summary.json");

const sourceIds = [
  "hanshu-guoxue123-011",
  "hanshu-guoxue123-012",
  "hanshu-guoxue123-013",
  "hanshu-guoxue123-115",
  "hanshu-guoxue123-116",
  "hanshu-guoxue123-117",
  "hanshu-guoxue123-118",
  "houhanshu-guoxue123-001",
  "houhanshu-guoxue123-013",
];
const profile = {
  profile_id: "china-western-han-xin-transition--8-24-v1",
  period_label: "西汉末至新莽更始",
  time_start: -8,
  time_end: 24,
  no_year_zero: true,
  minimum_chronology_confidence: "high",
  allowed_source_section_types: ["annal", "biography"],
};
const sectionRules = [
  { pattern: /纪|紀/u, type: "annal", label: "纪" },
  { pattern: /列传|列傳|传|傳/u, type: "biography", label: "列传" },
  { pattern: /表/u, type: "table", label: "表" },
  { pattern: /志/u, type: "treatise", label: "志" },
];
const splitterConfig = {
  minSentenceLength: 8,
  excludeQuotedContinuations: true,
  stripPatterns: [
    /国学导航\s*/gu,
    /^(?:汉书|漢書|后汉书|後漢書)?卷[一二三四五六七八九十百上下\d]+(?:上|中|下)?(?:\s+|　+)[^。！？；;\n]{0,80}(?:\s+|　+)/u,
  ],
};
const eventSignalPattern = /起兵|举兵|舉兵|起[^，。；]{0,12}(?:兵|军|軍|绿林|綠林)|反叛|叛|攻|击|擊|战|戰|破|败|敗|杀|殺|诛|誅|斩|斬|废|廢|黜|立|即位|称帝|稱帝|受禅|受禪|篡|代汉|代漢|去汉号|去漢號|封|徙|迁|遷|降|归附|歸附|葬|崩|薨|自杀|自殺|改元|遣|来朝|來朝|围|圍|据|據|请降|請降|下狱|下獄|大赦|赦天下|罢|罷|火发|火發|大疫/u;
const transitionContextPattern = /王莽|莽|更始|圣公|聖公|刘秀|劉秀|光武|伯升|绿林|綠林|赤眉|新市|新巿|平林|下江|地皇|天凤|天鳳|始建国|始建國|居摄|居攝|初始/u;
const remoteBackgroundPattern = /年三岁|年三歲|十三世|封舜后|封舜後|黄帝|黃帝|虞舜/u;

const eras = chinaRegnalReferenceWesternHanXinTransition824.map(
  ([id, era_label, context_key, time_start, time_end]) => ({
    id,
    era_label,
    context_key,
    time_start,
    time_end,
  }),
);

function parseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function sourceWorkTitle(source) {
  return /后汉书|後漢書/u.test(source.title) ? "后汉书" : "汉书";
}

function sourceSection(source) {
  return sectionFromRules(source.title, sectionRules, sourceWorkTitle(source));
}

function chronologyCandidate(resolved) {
  if (
    !Number.isInteger(resolved?.year)
    || resolved.year === 0
    || resolved.year < profile.time_start
    || resolved.year > profile.time_end
  ) return null;
  return {
    year: resolved.year,
    expression: resolved.matchedText ?? "",
    method: resolved.method,
    confidence: resolved.confidence,
    era_id: resolved.eraId ?? null,
    inherited_within_source: resolved.inheritedWithinSource === true,
  };
}

function loadPeople(db) {
  const rows = db.prepare(`
    SELECT p.id, p.name, p.courtesy_name, p.birth_year, p.death_year,
           p.primary_polity, p.raw_json, pa.value AS alias_value
    FROM persons p
    LEFT JOIN person_aliases pa ON pa.person_id = p.id
    WHERE p.region = 'china' AND p.coverage_status <> 'candidate'
    ORDER BY p.id, pa.value
  `).all();
  const byId = new Map();
  for (const row of rows) {
    const raw = parseJson(row.raw_json);
    const person = byId.get(row.id) ?? {
      id: row.id,
      canonicalName: row.name,
      birthYear: row.birth_year,
      deathYear: row.death_year,
      primaryPolity: row.primary_polity,
      aliases: new Set(),
      sourceIds: new Set(),
    };
    for (const value of [row.name, row.courtesy_name, row.alias_value]) {
      if (value && Array.from(value).length >= 2) person.aliases.add(value);
    }
    if (raw.sourceId) person.sourceIds.add(raw.sourceId);
    byId.set(row.id, person);
  }
  return [...byId.values()];
}

function loadPlaces(db) {
  const rows = db.prepare(`
    SELECT e.id, e.primary_label, e.time_start, e.time_end, e.raw_json,
           a.value AS alias_value
    FROM entities e
    LEFT JOIN entity_aliases a ON a.entity_id = e.id
    WHERE e.entity_type = 'place'
      AND e.region_id = 'china'
      AND e.review_status <> 'rejected'
    ORDER BY e.id, a.value
  `).all();
  const byId = new Map();
  for (const row of rows) {
    const raw = parseJson(row.raw_json);
    const place = byId.get(row.id) ?? {
      id: row.id,
      entityId: row.id,
      label: row.primary_label,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      aliases: [],
      locativeOnlyAliases: Array.isArray(raw.locativeOnlyAliases) ? raw.locativeOnlyAliases : [],
    };
    if (row.alias_value && row.alias_value !== place.label && !place.aliases.includes(row.alias_value)) {
      place.aliases.push(row.alias_value);
    }
    byId.set(row.id, place);
  }
  return [...byId.values()];
}

function knownPeopleForText(input, year, people) {
  const targetText = input.targetText ?? "";
  const contextText = `${input.contextBefore ?? ""}\n${targetText}\n${input.contextAfter ?? ""}`;
  const sourceTitle = input.source?.title ?? "";
  const plausiblePeople = people.filter((person) =>
    isHistoricalPersonTemporallyPlausible(person, year, { maximumPersonLifespan: 110 }));
  const idsByShortAlias = new Map();
  for (const person of plausiblePeople) {
    const alias = Array.from(person.canonicalName).at(-1);
    if (!alias) continue;
    const ids = idsByShortAlias.get(alias) ?? [];
    ids.push(person.id);
    idsByShortAlias.set(alias, ids);
  }
  return plausiblePeople
    .flatMap((person) => {
      const exactSurfaces = [...person.aliases].filter((alias) => contextText.includes(alias));
      const sourceSubject = person.sourceIds.has(input.source?.id)
        || [...person.aliases].some((alias) => sourceTitle.includes(alias));
      const shortAlias = Array.from(person.canonicalName).at(-1);
      const uniquelyPlausibleShortAlias = Number.isInteger(year)
        && idsByShortAlias.get(shortAlias)?.length === 1;
      const abbreviatedSurface = (sourceSubject || uniquelyPlausibleShortAlias)
        && shortAlias
        && [targetText, input.contextBefore ?? "", input.contextAfter ?? ""]
          .some((text) => hasOfficialHistoryAbbreviatedMention(text, shortAlias))
        ? shortAlias
        : null;
      const titleSurface = sourceSubject
        ? targetText.match(/^(?:太皇太后|皇太后|太后|皇后|皇帝|帝|后)(?=[\p{Script=Han}，。；、])/u)?.[0] ?? null
        : null;
      const matchedSurfaces = [...new Set([
        ...exactSurfaces,
        abbreviatedSurface,
        titleSurface,
      ].filter(Boolean))]
        .sort((left, right) => contextText.indexOf(left) - contextText.indexOf(right) || right.length - left.length);
      if (!matchedSurfaces.length) return [];
      return [{
        id: person.id,
        canonical_name: person.canonicalName,
        aliases: [...person.aliases].filter((alias) => alias !== person.canonicalName),
        matched_surfaces: matchedSurfaces,
        time_start: person.birthYear,
        time_end: person.deathYear,
        source_subject: sourceSubject,
        match_basis: exactSurfaces.length
          ? "exact-context"
          : titleSurface
            ? "source-subject-title"
            : sourceSubject
              ? "source-subject-abbreviation"
              : "unique-temporal-abbreviation",
      }];
    })
    .sort((left, right) =>
      contextText.indexOf(left.matched_surfaces[0]) - contextText.indexOf(right.matched_surfaces[0])
      || left.id.localeCompare(right.id));
}

function knownPlacesForText(text, places) {
  return findPlaceMentions(text, places).map((place) => ({
    id: place.entityId ?? place.id,
    canonical_name: place.label,
    aliases: place.aliases ?? [],
    matched_surfaces: [place.matched],
    time_start: place.timeStart ?? null,
    time_end: place.timeEnd ?? null,
  }));
}

function orderedEntries(items, preferPlaces = true) {
  return [...items].sort((left, right) =>
    left.source.id.localeCompare(right.source.id)
    || (preferPlaces ? Number(right.placeCandidateCount ?? 0) - Number(left.placeCandidateCount ?? 0) : 0)
    || Number(left.passage.sequence ?? 0) - Number(right.passage.sequence ?? 0)
    || left.sentenceIndex - right.sentenceIndex
    || left.targetText.localeCompare(right.targetText));
}

function roundRobin(items, limit, used, options = {}) {
  const preferPlaces = options.preferPlaces !== false;
  const queues = new Map();
  for (const item of orderedEntries(items, preferPlaces)) {
    if (used.has(item.key)) continue;
    const queue = queues.get(item.source.id) ?? [];
    queue.push(item);
    queues.set(item.source.id, queue);
  }
  const sourceQueues = [...queues.entries()]
    .sort(([leftId, leftQueue], [rightId, rightQueue]) =>
      (preferPlaces ? Number(rightQueue[0]?.placeCandidateCount ?? 0) - Number(leftQueue[0]?.placeCandidateCount ?? 0) : 0)
      || leftId.localeCompare(rightId))
    .map(([, queue]) => queue);
  const selected = [];
  while (selected.length < limit && sourceQueues.some((queue) => queue.length)) {
    for (const queue of sourceQueues) {
      if (!queue.length || selected.length >= limit) continue;
      const item = queue.shift();
      if (used.has(item.key)) continue;
      used.add(item.key);
      selected.push(item);
    }
  }
  return selected;
}

function selectPilot(entries) {
  const eventLike = entries.filter((entry) =>
    entry.textKind === "narrative"
    && (entry.eventSignal || entry.chronology?.year === 24)
    && Array.from(entry.targetText).length <= 240
    && entry.resolvedYearInRange !== false);
  const high = eventLike.filter((entry) => entry.chronology?.confidence === "high");
  const medium = eventLike.filter((entry) => entry.chronology?.confidence === "medium");
  const unresolved = eventLike.filter((entry) =>
    !entry.chronology
    && !remoteBackgroundPattern.test(entry.targetText)
    && (
      [
        "hanshu-guoxue123-117",
        "hanshu-guoxue123-118",
        "houhanshu-guoxue123-001",
        "houhanshu-guoxue123-013",
      ].includes(entry.source.id)
      || transitionContextPattern.test(entry.targetText)
    ));
  const negatives = entries.filter((entry) =>
    entry.textKind !== "narrative"
    || (!entry.eventSignal && Array.from(entry.targetText).length >= 8 && Array.from(entry.targetText).length <= 240));

  const used = new Set();
  const selectedEvents = [];
  for (const year of [-8, -1, 1, 8, 9, 14, 20, 23, 24]) {
    selectedEvents.push(...roundRobin(
      eventLike.filter((entry) => entry.chronology?.year === year),
      1,
      used,
    ));
  }
  const selectedByConfidence = (confidence) => selectedEvents.filter(
    (entry) => entry.chronology?.confidence === confidence,
  ).length;
  selectedEvents.push(...roundRobin(high, Math.max(0, 18 - selectedByConfidence("high")), used));
  selectedEvents.push(...roundRobin(medium, Math.max(0, 6 - selectedByConfidence("medium")), used));
  selectedEvents.push(...roundRobin(unresolved, Math.max(0, 6 - selectedEvents.filter((entry) => !entry.chronology).length), used));
  if (selectedEvents.length < 30) {
    selectedEvents.push(...roundRobin(eventLike, 30 - selectedEvents.length, used));
  }
  const selectedNegatives = roundRobin(negatives, 10, used, { preferPlaces: false });
  if (selectedEvents.length !== 30 || selectedNegatives.length !== 10) {
    throw new Error(
      `Could not build a 30/10 pilot sample: events=${selectedEvents.length}, negatives=${selectedNegatives.length}`,
    );
  }
  return [...selectedEvents, ...selectedNegatives];
}

const db = new DatabaseSync(dbPath, { readOnly: true });

try {
  const placeholders = sourceIds.map(() => "?").join(", ");
  const sources = db.prepare(`
    SELECT id, title, author, type, citation_short
    FROM sources
    WHERE id IN (${placeholders})
    ORDER BY id
  `).all(...sourceIds);
  const passages = db.prepare(`
    SELECT *
    FROM source_passages
    WHERE source_id IN (${placeholders})
    ORDER BY source_id, COALESCE(sequence, 0), id
  `).all(...sourceIds);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const people = loadPeople(db);
  const places = loadPlaces(db);
  const sequenceResolver = createChinaRegnalSequenceResolver(eras, { usePassageRange: false });
  const quoteStateBySource = new Map();
  const entriesBySource = new Map();

  for (const passage of passages) {
    const source = sourceById.get(passage.source_id);
    if (!source) continue;
    const section = sourceSection(source);
    const quoteState = quoteStateBySource.get(source.id) ?? { stack: [] };
    quoteStateBySource.set(source.id, quoteState);
    const rawSentences = splitSourceSentences(passage.text, splitterConfig, quoteState);
    const sourceEntries = entriesBySource.get(source.id) ?? [];

    for (const [sentenceIndex, rawSentence] of rawSentences.entries()) {
      const textKind = classifyOfficialHistoryTextKind(rawSentence);
      const narrativeText = isolateOfficialHistoryNarrativeText(rawSentence);
      const targetText = textKind === "narrative" && narrativeText ? narrativeText : rawSentence.trim();
      if (Array.from(targetText).length < 6 || Array.from(targetText).length > 320) continue;

      const context = {
        source,
        passage,
        section,
        workTitle: sourceWorkTitle(source),
      };
      const resolved = narrativeText
        ? section.type === "annal"
          ? sequenceResolver.resolve(narrativeText, context)
          : resolveChinaRegnalDate(narrativeText, eras, {
            source_title: source.title,
            work_title: context.workTitle,
            book_title: source.citation_short,
            source_section_type: section.type,
            source_section_label: section.label,
          })
        : null;
      const chronology = chronologyCandidate(resolved);
      const resolvedYearInRange = !Number.isInteger(resolved?.year)
        ? null
        : resolved.year >= profile.time_start && resolved.year <= profile.time_end;
      const key = stableId(`${source.id}:${passage.id}:${sentenceIndex}:${targetText}`);
      sourceEntries.push({
        key,
        source,
        passage,
        section,
        sentenceIndex,
        rawSentence,
        targetText,
        textKind,
        chronology,
        resolvedYearInRange,
        eventSignal: eventSignalPattern.test(targetText),
        placeCandidateCount: narrativeText ? findPlaceMentions(narrativeText, places).length : 0,
      });
    }
    entriesBySource.set(source.id, sourceEntries);
  }

  const entries = [];
  for (const sourceEntries of entriesBySource.values()) {
    for (const [index, entry] of sourceEntries.entries()) {
      entries.push({
        ...entry,
        contextBefore: sourceEntries[index - 1]?.targetText ?? "",
        contextAfter: sourceEntries[index + 1]?.targetText ?? "",
      });
    }
  }

  const selected = selectPilot(entries);
  const inputs = selected.map((entry, selectionIndex) => {
    const chronologyCandidates = entry.chronology ? [entry.chronology] : [];
    const year = chronologyCandidates[0]?.year ?? null;
    const selectedAsNegative = selectionIndex >= 30;
    const selectionBucket = selectedAsNegative
      ? "negative"
      : entry.chronology?.confidence === "high"
        ? "event-high-chronology"
        : entry.chronology?.confidence === "medium"
          ? "event-context-chronology"
          : "event-unresolved-chronology";
    return {
      task_id: `xin-transition:${entry.source.id}:${entry.key}`,
      profile,
      source: {
        work_title: sourceWorkTitle(entry.source),
        source_id: entry.source.id,
        passage_id: entry.passage.id,
        book_title: entry.source.title,
        section_type: entry.section.type,
        section_label: entry.section.label,
        locator: entry.passage.locator,
        source_time_range: [entry.passage.year_start, entry.passage.year_end],
      },
      target_text: entry.targetText,
      context_before: entry.contextBefore,
      context_after: entry.contextAfter,
      chronology_candidates: chronologyCandidates,
      known_people: knownPeopleForText(
        {
          targetText: entry.targetText,
          contextBefore: entry.contextBefore,
          contextAfter: entry.contextAfter,
          source: entry.source,
        },
        year,
        people,
      ),
      known_places: knownPlacesForText(entry.targetText, places),
      selection: {
        bucket: selectionBucket,
        source_text_kind: entry.textKind,
        sentence_index: entry.sentenceIndex,
        raw_sentence_changed: entry.rawSentence.trim() !== entry.targetText,
      },
    };
  });

  const countBy = (items, valueForItem) => {
    const counts = {};
    for (const item of items) {
      const value = valueForItem(item);
      counts[value] = (counts[value] ?? 0) + 1;
    }
    return counts;
  };
  const manifest = {
    schema_version: "chronoatlas-official-history-pilot-input-v2",
    profile_id: profile.profile_id,
    input_count: inputs.length,
    output_generated: false,
    selection_counts: countBy(inputs, (input) => input.selection.bucket),
    source_counts: countBy(inputs, (input) => input.source.source_id),
    section_counts: countBy(inputs, (input) => input.source.section_type),
    chronology_counts: countBy(inputs, (input) => input.chronology_candidates[0]?.confidence ?? "unresolved"),
    cleaned_sentence_count: inputs.filter((input) => input.selection.raw_sentence_changed).length,
    known_people_candidates: inputs.reduce((sum, input) => sum + input.known_people.length, 0),
    known_place_candidates: inputs.reduce((sum, input) => sum + input.known_places.length, 0),
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(inputPath, `${inputs.map((input) => JSON.stringify(input)).join("\n")}\n`, "utf8");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    inputPath: path.relative(rootDir, inputPath),
    manifestPath: path.relative(rootDir, manifestPath),
    manifest,
  }, null, 2));
} finally {
  db.close();
}
