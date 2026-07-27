import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requestedOfficialHistoryPromotionProfile } from "./lib/china-official-history-promotion-profiles.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const profile = requestedOfficialHistoryPromotionProfile();
const generatorId = profile.generatorId;
const outputArg = process.argv.find((argument) => argument.startsWith("--output="))?.slice("--output=".length);
const outputPath = outputArg
  ? path.resolve(rootDir, outputArg)
  : path.join(rootDir, "data", "review-queues", `${profile.id}-cross-reference.json`);

const profileConfigs = new Map([
  ["china-western-jin-281-316-v1", {
    sourcePage(sourceId) {
      const match = String(sourceId ?? "").match(/^jinshu-guoxue123-(\d{3})$/u);
      return match ? `晉書/卷${match[1]}` : null;
    },
    chronologyPage(year) {
      if (year >= 281 && year <= 288) return "資治通鑑/卷081";
      if (year >= 289 && year <= 298) return "資治通鑑/卷082";
      if (year >= 299 && year <= 300) return "資治通鑑/卷083";
      if (year >= 301 && year <= 302) return "資治通鑑/卷084";
      if (year >= 303 && year <= 304) return "資治通鑑/卷085";
      if (year >= 305 && year <= 308) return "資治通鑑/卷086";
      if (year >= 309 && year <= 311) return "資治通鑑/卷087";
      if (year >= 312 && year <= 313) return "資治通鑑/卷088";
      if (year >= 314 && year <= 316) return "資治通鑑/卷089";
      return null;
    },
  }],
]);

const personAliases = new Map([
  ["司马玮", ["楚王玮"]],
  ["司马允", ["淮南王允"]],
  ["司马伦", ["赵王伦"]],
  ["司马肜", ["梁王肜"]],
  ["司马遹", ["太子遹", "庶人遹"]],
  ["司马颙", ["河间王颙"]],
  ["司马乂", ["长沙王乂"]],
  ["司马颖", ["成都王颖"]],
  ["司马繇", ["东安王繇"]],
  ["司马虓", ["范阳王虓"]],
  ["司马模", ["南阳王模"]],
  ["司马迪", ["汉王迪"]],
  ["刘渊", ["刘元海", "元海"]],
  ["石季龙", ["石虎", "季龙"]],
]);

const actionTerms = [
  "入朝", "来朝", "举兵", "起兵", "称帝", "称王", "攻陷", "陷", "攻", "击", "破", "败", "围",
  "杀", "害", "诛", "废", "反", "叛", "降", "讨", "走", "奔", "据", "立", "奉", "救",
];

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value ?? "{}") ?? fallback;
  } catch {
    return fallback;
  }
}

function compact(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function normalized(value) {
  return compact(value)
    .normalize("NFKC")
    .replace(/[^\p{Script=Han}\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function groupBy(rows, keyName) {
  const grouped = new Map();
  for (const row of rows) {
    const values = grouped.get(row[keyName]) ?? [];
    values.push(row);
    grouped.set(row[keyName], values);
  }
  return grouped;
}

function pageUrl(pageTitle) {
  return `https://zh.wikisource.org/zh-hans/${pageTitle.split("/").map(encodeURIComponent).join("/")}`;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchExtract(pageTitle, attempt = 1) {
  const query = new URLSearchParams({
    action: "query",
    prop: "extracts",
    explaintext: "1",
    variant: "zh-hans",
    titles: pageTitle,
    format: "json",
    formatversion: "2",
  });
  const response = await fetch(`https://zh.wikisource.org/w/api.php?${query}`, {
    headers: { "user-agent": "ChronoAtlas source cross-reference/0.1" },
  });
  if (response.status === 429 && attempt <= 5) {
    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfterSeconds)
      ? Math.max(1000, retryAfterSeconds * 1000)
      : attempt * 2000;
    await wait(delay);
    return fetchExtract(pageTitle, attempt + 1);
  }
  if (!response.ok) throw new Error(`Wikisource request failed (${response.status}): ${pageTitle}`);
  const body = await response.json();
  const page = body?.query?.pages?.[0];
  if (!page?.extract) throw new Error(`Wikisource page has no extract: ${pageTitle}`);
  return page.extract;
}

function chineseDigitYear(year) {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return String(year).split("").map((value) => digits[Number(value)]).join("");
}

function sectionForYear(text, year) {
  const marker = `公元${chineseDigitYear(year)}年`;
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return { text, markerFound: false };
  const start = Math.max(0, text.lastIndexOf("==", markerIndex));
  const nextMarkerIndex = text.indexOf("公元", markerIndex + marker.length);
  const nextHeadingIndex = nextMarkerIndex < 0 ? -1 : text.lastIndexOf("==", nextMarkerIndex);
  return {
    text: text.slice(start, nextHeadingIndex > start ? nextHeadingIndex : undefined),
    markerFound: true,
  };
}

function primaryWitnessMatch(quote, witnessText) {
  const quoteNormalized = normalized(quote);
  const witnessNormalized = normalized(witnessText);
  if (quoteNormalized.length >= 6 && witnessNormalized.includes(quoteNormalized)) {
    return { status: "exact", matchedText: compact(quote) };
  }
  const clauses = compact(quote)
    .split(/[，。；：！？]/u)
    .map((value) => normalized(value))
    .filter((value) => value.length >= 6)
    .sort((left, right) => right.length - left.length);
  const clause = clauses.find((value) => witnessNormalized.includes(value));
  return clause
    ? { status: "clause", matchedText: clause }
    : { status: "not-found", matchedText: null };
}

function aliasesForPerson(name) {
  return unique([name, ...(personAliases.get(name) ?? [])]);
}

function bestChronologyMatch(event, yearText) {
  const people = event.people.map((person) => ({
    name: person.primary_label,
    aliases: aliasesForPerson(person.primary_label),
  }));
  const places = event.places.map((place) => place.primary_label);
  const actions = actionTerms.filter((term) => event.title.includes(term) || event.summary.includes(term));
  const anchors = unique([
    ...people.flatMap((person) => person.aliases),
    ...places,
  ]).filter((value) => value.length >= 2);

  const candidates = [];
  for (const anchor of anchors) {
    let index = yearText.indexOf(anchor);
    while (index >= 0) {
      const snippet = compact(yearText.slice(Math.max(0, index - 220), Math.min(yearText.length, index + anchor.length + 420)));
      const matchedPeople = people
        .filter((person) => person.aliases.some((alias) => snippet.includes(alias)))
        .map((person) => person.name);
      const matchedPlaces = places.filter((place) => snippet.includes(place));
      const matchedActions = actions.filter((action) => snippet.includes(action));
      const score = matchedPeople.length * 3 + matchedPlaces.length * 2 + matchedActions.length;
      candidates.push({ anchor, snippet, matchedPeople, matchedPlaces, matchedActions, score });
      index = yearText.indexOf(anchor, index + anchor.length);
    }
  }

  candidates.sort((left, right) => right.score - left.score || right.snippet.length - left.snippet.length);
  const best = candidates[0];
  if (!best) {
    return {
      status: "not-found",
      score: 0,
      matchedPeople: [],
      matchedPlaces: [],
      matchedActions: [],
      snippet: null,
    };
  }
  const status = best.matchedPeople.length >= 2
    || (best.matchedPeople.length >= 1 && (best.matchedPlaces.length >= 1 || best.matchedActions.length >= 1))
    ? "strong"
    : "partial";
  return { status, ...best };
}

async function main() {
  const config = profileConfigs.get(profile.id);
  if (!config) throw new Error(`No online cross-reference config for profile: ${profile.id}`);

  const db = new DatabaseSync(dbPath, { readOnly: true });
  let events;
  let evidenceByEvent;
  let entitiesByEvent;
  try {
    events = db.prepare(`
      SELECT id, title, time_start, summary, confidence, review_status, raw_json
      FROM events
      WHERE json_extract(raw_json, '$.generator') = ?
        AND review_status <> 'rejected'
      ORDER BY time_start, title, id
    `).all(generatorId);
    evidenceByEvent = groupBy(db.prepare(`
      SELECT
        el.subject_id AS event_id,
        el.source_id,
        el.locator,
        el.quote,
        el.raw_json,
        s.title AS source_title,
        s.url AS source_url
      FROM evidence_links el
      LEFT JOIN sources s ON s.id = el.source_id
      WHERE el.subject_table = 'events'
        AND json_extract(el.raw_json, '$.generator') = ?
      ORDER BY el.subject_id, el.id
    `).all(generatorId), "event_id");
    entitiesByEvent = groupBy(db.prepare(`
      SELECT ee.event_id, e.entity_type, e.primary_label
      FROM event_entities ee
      JOIN entities e ON e.id = ee.entity_id
      WHERE json_extract(ee.raw_json, '$.generator') = ?
      ORDER BY ee.event_id, ee.sort_order, ee.entity_id
    `).all(generatorId), "event_id");
  } finally {
    db.close();
  }

  const pageTitles = unique(events.flatMap((event) => [
    ...(evidenceByEvent.get(event.id) ?? []).map((evidence) => config.sourcePage(evidence.source_id)),
    config.chronologyPage(event.time_start),
  ]));
  const pageEntries = [];
  for (const pageTitle of pageTitles) {
    pageEntries.push([pageTitle, await fetchExtract(pageTitle)]);
    await wait(750);
  }
  const pages = new Map(pageEntries);

  const results = events.map((row) => {
    const linkedEntities = entitiesByEvent.get(row.id) ?? [];
    const event = {
      id: row.id,
      title: row.title,
      year: row.time_start,
      summary: compact(row.summary),
      people: linkedEntities.filter((item) => item.entity_type === "person"),
      places: linkedEntities.filter((item) => item.entity_type === "place"),
    };
    const primaryWitnesses = (evidenceByEvent.get(row.id) ?? []).map((evidence) => {
      const pageTitle = config.sourcePage(evidence.source_id);
      const match = pageTitle && pages.has(pageTitle)
        ? primaryWitnessMatch(evidence.quote, pages.get(pageTitle))
        : { status: "unsupported-source", matchedText: null };
      return {
        sourceId: evidence.source_id,
        sourceTitle: evidence.source_title,
        sourceUrl: evidence.source_url,
        locator: evidence.locator,
        quote: compact(evidence.quote),
        witnessPage: pageTitle,
        witnessUrl: pageTitle ? pageUrl(pageTitle) : null,
        matchStatus: match.status,
      };
    });
    const chronologyPage = config.chronologyPage(event.year);
    const chronologySection = sectionForYear(pages.get(chronologyPage) ?? "", event.year);
    const chronologyMatch = bestChronologyMatch(event, chronologySection.text);
    return {
      eventId: event.id,
      year: event.year,
      title: event.title,
      summary: event.summary,
      primaryWitnesses,
      chronology: {
        page: chronologyPage,
        url: chronologyPage ? pageUrl(chronologyPage) : null,
        yearMarkerFound: chronologySection.markerFound,
        ...chronologyMatch,
      },
    };
  });

  const report = {
    schema: "chronoatlas.official-history-cross-reference.v1",
    generatedAt: new Date().toISOString(),
    profileId: profile.id,
    generatorId,
    methodology: {
      primaryWitness: "Local Guoxue123 Jinshu evidence compared with the corresponding simplified Wikisource Jinshu volume.",
      chronologyWitness: "People, places, and action terms compared within the matching year section of Wikisource Zizhi Tongjian.",
      limitation: "Automated matches support editorial review but do not replace edition/page verification or semantic judgment.",
    },
    counts: {
      events: results.length,
      primaryExact: results.filter((event) => event.primaryWitnesses.some((item) => item.matchStatus === "exact")).length,
      primaryClause: results.filter((event) => event.primaryWitnesses.some((item) => item.matchStatus === "clause")).length,
      chronologyStrong: results.filter((event) => event.chronology.status === "strong").length,
      chronologyPartial: results.filter((event) => event.chronology.status === "partial").length,
      chronologyNotFound: results.filter((event) => event.chronology.status === "not-found").length,
    },
    events: results,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: path.relative(rootDir, outputPath).replaceAll("\\", "/"),
    counts: report.counts,
  }, null, 2));
}

await main();
