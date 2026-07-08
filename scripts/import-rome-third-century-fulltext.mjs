import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));
const batchId = "rome-third-century-fulltext-2026-07";
const periodId = "rome-180-284";

const sources = [
  {
    id: "rome-source-history-of-the-empire-after-marcus-herodian",
    title: "History of the Empire after Marcus",
    author: "Herodian",
    citationShort: "Herodian, History of the Empire",
    url: "https://www.tertullian.org/fathers/herodian_01_book1.htm",
    language: "en",
    sourceType: "ancient historiography",
    reliability: "high",
    note: "Near-contemporary narrative from Commodus to Gordian III; imported from public-domain Tertullian Project pages.",
  },
  {
    id: "rome-source-roman-history-cassius-dio",
    title: "Roman History",
    author: "Cassius Dio",
    citationShort: "Cassius Dio, Roman History",
    url: "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cassius_Dio/home.html",
    language: "en",
    sourceType: "ancient historiography",
    reliability: "high",
    note: "Greek senatorial history, unevenly preserved in epitomes for the Severan period; imported from LacusCurtius public-domain pages.",
  },
  {
    id: "rome-source-historia-augusta-scriptores-historiae-augustae",
    title: "Historia Augusta",
    author: "Scriptores Historiae Augustae",
    citationShort: "Historia Augusta",
    url: "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Historia_Augusta/home.html",
    language: "en",
    sourceType: "late antique imperial biography",
    reliability: "low",
    note: "Late, rhetorically shaped imperial biographies; useful for gaps but flagged as low reliability.",
  },
  {
    id: "rome-source-historia-nova-zosimus",
    title: "Historia Nova",
    author: "Zosimus",
    citationShort: "Zosimus, Historia Nova",
    url: "https://www.tertullian.org/fathers/zosimus01_book1.htm",
    language: "en",
    sourceType: "late antique historiography",
    reliability: "medium",
    note: "Late antique narrative dependent on earlier lost sources; useful for Aurelian and the third-century crisis with caution.",
  },
  {
    id: "rome-source-breviarium-ab-urbe-condita-eutropius",
    title: "Breviarium ab Urbe Condita",
    author: "Eutropius",
    citationShort: "Eutropius, Breviarium",
    url: "https://www.tertullian.org/fathers/eutropius_breviarium_2_text.htm",
    language: "en",
    sourceType: "late antique epitome",
    reliability: "medium",
    note: "Fourth-century concise epitome; useful for chronology but highly compressed.",
  },
];

const pages = [
  ...Array.from({ length: 8 }, (_, index) => ({
    sourceId: "rome-source-history-of-the-empire-after-marcus-herodian",
    pageId: `book-${index + 1}`,
    title: `Book ${index + 1}`,
    locator: `Book ${index + 1}`,
    url: `https://www.tertullian.org/fathers/herodian_0${index + 1}_book${index + 1}.htm`,
    yearStart: [180, 193, 197, 211, 217, 222, 235, 238][index],
    yearEnd: [192, 197, 211, 217, 222, 235, 238, 238][index],
    cleaner: "tertullian",
    startPattern: /BOOK\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT)/i,
    endPattern: /This text was transcribed by Roger Pearse/i,
  })),
  ...Array.from({ length: 8 }, (_, index) => ({
    sourceId: "rome-source-roman-history-cassius-dio",
    pageId: `book-${73 + index}`,
    title: `Book ${73 + index}`,
    locator: `Book ${73 + index}`,
    url: `https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cassius_Dio/${73 + index}*.html`,
    yearStart: [193, 193, 193, 194, 198, 211, 217, 219][index],
    yearEnd: [193, 193, 194, 197, 211, 217, 218, 222][index],
    cleaner: "lacus",
    startPattern: /(Book|Epitome of Book)\s*(LXXIII|LXXIV|LXXV|LXXVI|LXXVII|LXXVIII|LXXIX|LXXX)|Vol\.\s*IX/i,
    endPattern: /Thayer's Note:|UP TO:|Images with borders lead/i,
  })),
  ...[
    ["Septimius_Severus*", "Septimius Severus", 193, 211],
    ["Pescennius_Niger*", "Pescennius Niger", 193, 194],
    ["Clodius_Albinus*", "Clodius Albinus", 193, 197],
    ["Caracalla*", "Caracalla", 198, 217],
    ["Geta*", "Geta", 209, 212],
    ["Macrinus*", "Macrinus", 217, 218],
    ["Diadumenianus*", "Diadumenianus", 217, 218],
    ["Elagabalus/1*", "Elagabalus 1", 218, 221],
    ["Elagabalus/2*", "Elagabalus 2", 221, 222],
    ["Severus_Alexander/1*", "Severus Alexander 1", 222, 228],
    ["Severus_Alexander/2*", "Severus Alexander 2", 229, 234],
    ["Severus_Alexander/3*", "Severus Alexander 3", 234, 235],
    ["Maximini_duo*", "The Two Maximini", 235, 238],
    ["Gordiani_tres*", "The Three Gordians", 238, 244],
    ["Maximus_et_Balbinus*", "Maximus and Balbinus", 238, 238],
    ["Valeriani_duo*", "The Two Valerians", 253, 260],
    ["Gallieni_duo*", "The Two Gallieni", 253, 268],
    ["Tyranni_XXX*", "The Thirty Pretenders", 260, 274],
    ["Claudius*", "The Deified Claudius", 268, 270],
    ["Aurelian/1*", "Aurelian 1", 270, 271],
    ["Aurelian/2*", "Aurelian 2", 271, 274],
    ["Aurelian/3*", "Aurelian 3", 274, 275],
    ["Tacitus*", "Tacitus", 275, 276],
    ["Probus*", "Probus", 276, 282],
    ["Firmus_et_al*", "Firmus, Saturninus, Proculus and Bonosus", 272, 281],
    ["Carus_et_al*", "Carus, Carinus and Numerian", 282, 285],
  ].map(([pathPart, title, yearStart, yearEnd]) => ({
    sourceId: "rome-source-historia-augusta-scriptores-historiae-augustae",
    pageId: String(pathPart).replace(/[^a-z0-9]+/gi, "-").replace(/-$/u, "").toLowerCase(),
    title,
    locator: title,
    url: `https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Historia_Augusta/${pathPart}.html`,
    yearStart,
    yearEnd,
    cleaner: "lacus",
    startPattern: new RegExp(String(title).split(" ")[0], "i"),
    endPattern: /UP TO:|Images with borders lead|Page updated:/i,
  })),
  {
    sourceId: "rome-source-historia-nova-zosimus",
    pageId: "book-1",
    title: "Book 1",
    locator: "Book 1",
    url: "https://www.tertullian.org/fathers/zosimus01_book1.htm",
    yearStart: 180,
    yearEnd: 305,
    cleaner: "tertullian",
    startPattern: /BOOK\s+ONE/i,
    endPattern: /This text was transcribed by Roger Pearse|Early Church Fathers/i,
  },
  {
    sourceId: "rome-source-breviarium-ab-urbe-condita-eutropius",
    pageId: "book-9",
    title: "Book 9",
    locator: "Book 9",
    url: "https://www.tertullian.org/fathers/eutropius_breviarium_2_text.htm",
    yearStart: 235,
    yearEnd: 305,
    cleaner: "tertullian",
    startPattern: /Book\s+IX/i,
    endPattern: /Book\s+X/i,
  },
];

const upsertPeriod = db.prepare(`
  INSERT INTO periods (id, label, time_start, time_end, region_id, civilization_id, period_type, summary, raw_json)
  VALUES (
    'rome-180-284',
    '罗马帝国失衡与三世纪危机',
    180,
    284,
    'rome',
    'rome-imperial',
    'narrative',
    '从康茂德晚期、塞维鲁王朝和军人政治前夜，到三世纪危机与戴克里先改革前夕。',
    '{"narrativeStartYear":180,"narrativeEndYear":284,"formalNote":"不是单一政权法理期，而是罗马帝国从元首制盛期后段走向三世纪危机的叙事期。","primarySources":["Herodian","Cassius Dio","Historia Augusta","Zosimus","Eutropius"]}'
  )
  ON CONFLICT(id) DO UPDATE SET
    label = excluded.label,
    time_start = excluded.time_start,
    time_end = excluded.time_end,
    region_id = excluded.region_id,
    civilization_id = excluded.civilization_id,
    period_type = excluded.period_type,
    summary = excluded.summary,
    raw_json = excluded.raw_json
`);

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&shy;/gi, "")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, "-")
    .replace(/&ndash;/gi, "-")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<(br|p|div|tr|li|h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t\f\v]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanPageText(html, page) {
  let workingHtml = html;
  if (page.cleaner === "lacus") {
    const startMatch = workingHtml.search(/<H1\b[^>]*CLASS=["']?start/i);
    if (startMatch >= 0) {
      workingHtml = workingHtml.slice(startMatch);
    } else {
      const publicDomainMatch = workingHtml.search(/public domain/i);
      const bodyStart = publicDomainMatch >= 0 ? workingHtml.slice(publicDomainMatch).search(/<H[12]\b/i) : -1;
      if (publicDomainMatch >= 0 && bodyStart >= 0) {
        workingHtml = workingHtml.slice(publicDomainMatch + bodyStart);
      }
    }
    const endMatch = workingHtml.search(/<HR\b[^>]*CLASS=["']?endnotes|Images with borders lead|Page updated:/i);
    if (endMatch > 0) {
      workingHtml = workingHtml.slice(0, endMatch);
    }
  }
  let text = htmlToText(workingHtml);
  const start = page.startPattern ? text.search(page.startPattern) : -1;
  if (start >= 0) {
    text = text.slice(start);
  }
  const end = page.endPattern ? text.search(page.endPattern) : -1;
  if (end > 0) {
    text = text.slice(0, end);
  }
  return text
    .replace(/^.*Short URL for this page:[\s\S]{0,1000}?Roman History/u, "Roman History")
    .replace(/Thayer's Note:[\s\S]*$/u, "")
    .replace(/This text was transcribed by[\s\S]*$/u, "")
    .replace(/\n\s*>\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text, maxLength = 2200) {
  const normalized = text.replace(/\n{2,}/g, "\n\n").trim();
  const units = normalized
    .split(/(?<=\.|\?|!|;|:)\s+(?=[A-Z0-9"'])/u)
    .map((unit) => unit.trim())
    .filter(Boolean);
  const chunks = [];
  let current = "";
  for (const unit of units.length ? units : [normalized]) {
    if (current && current.length + unit.length + 1 > maxLength) {
      chunks.push(current);
      current = "";
    }
    if (unit.length > maxLength) {
      for (let index = 0; index < unit.length; index += maxLength) {
        if (current) {
          chunks.push(current);
          current = "";
        }
        chunks.push(unit.slice(index, index + maxLength));
      }
      continue;
    }
    current = current ? `${current} ${unit}` : unit;
  }
  if (current) chunks.push(current);
  return chunks;
}

async function fetchText(page) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(page.url, {
        headers: {
          "User-Agent": "ChronoAtlas source importer (+local research database)",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${page.url}: ${response.status}`);
      }
      return cleanPageText(await response.text(), page);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

const upsertSource = db.prepare(`
  INSERT INTO sources (
    id, title, author, type, citation_short, url, language, corpus_id, note, raw_json,
    original_title, source_type, reliability_level, review_status
  )
  VALUES (?, ?, ?, 'classical-source', ?, ?, ?, 'rome-imperial', ?, ?, ?, ?, ?, 'reviewed')
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    author = excluded.author,
    type = excluded.type,
    citation_short = excluded.citation_short,
    url = excluded.url,
    language = excluded.language,
    corpus_id = excluded.corpus_id,
    note = excluded.note,
    raw_json = excluded.raw_json,
    original_title = excluded.original_title,
    source_type = excluded.source_type,
    reliability_level = excluded.reliability_level,
    review_status = excluded.review_status
`);

const insertPassage = db.prepare(`
  INSERT INTO source_passages (
    id, source_id, locator, sequence, year_start, year_end, text, translation,
    language, notes, confidence, review_status, raw_json, place_hint, topic_hint
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'en', ?, ?, 'reviewed', ?, NULL, 'third-century-crisis')
  ON CONFLICT(id) DO UPDATE SET
    source_id = excluded.source_id,
    locator = excluded.locator,
    sequence = excluded.sequence,
    year_start = excluded.year_start,
    year_end = excluded.year_end,
    text = excluded.text,
    translation = excluded.translation,
    language = excluded.language,
    notes = excluded.notes,
    confidence = excluded.confidence,
    review_status = excluded.review_status,
    raw_json = excluded.raw_json,
    place_hint = excluded.place_hint,
    topic_hint = excluded.topic_hint
`);

const insertDocument = db.prepare(`
  INSERT INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id,
    topic_id, time_start, time_end, review_status, raw_json
  )
  VALUES (?, 'source_passages', ?, ?, ?, 'en', 'rome', ?, 'source_criticism', ?, ?, 'reviewed', ?)
  ON CONFLICT(id) DO UPDATE SET
    subject_table = excluded.subject_table,
    subject_id = excluded.subject_id,
    title = excluded.title,
    body = excluded.body,
    language = excluded.language,
    region_id = excluded.region_id,
    period_id = excluded.period_id,
    topic_id = excluded.topic_id,
    time_start = excluded.time_start,
    time_end = excluded.time_end,
    review_status = excluded.review_status,
    raw_json = excluded.raw_json
`);

function sourceById(id) {
  const source = sources.find((item) => item.id === id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}

async function main() {
  const fetched = [];
  for (const page of pages) {
    const text = await fetchText(page);
    const chunks = chunkText(text);
    fetched.push({ page, chunks });
    console.log(`${page.sourceId} ${page.locator}: ${chunks.length} passages`);
  }

  db.exec("BEGIN");
  try {
    upsertPeriod.run();
    db.prepare("DELETE FROM search_documents WHERE id LIKE 'source-passage:rome-fulltext:%'").run();
    db.prepare("DELETE FROM source_passages WHERE id LIKE 'rome-fulltext:%'").run();

    for (const source of sources) {
      upsertSource.run(
        source.id,
        source.title,
        source.author,
        source.citationShort,
        source.url,
        source.language,
        source.note,
        JSON.stringify({
          batchId,
          sourceType: source.sourceType,
          reliability: source.reliability,
          sourceGenre: source.sourceType,
          importMode: "public-web-fulltext",
        }),
        source.title,
        source.sourceType,
        source.reliability,
      );
    }

    let sequence = 1000;
    let inserted = 0;
    for (const { page, chunks } of fetched) {
      const source = sourceById(page.sourceId);
      chunks.forEach((chunk, index) => {
        sequence += 1;
        const passageId = `rome-fulltext:${page.sourceId.replace(/^rome-source-/u, "")}:${page.pageId}:${String(index + 1).padStart(4, "0")}`;
        const documentId = `source-passage:${passageId}`;
        const locator = `${page.locator} · passage ${index + 1}`;
        const raw = {
          batchId,
          sourceId: page.sourceId,
          sourceTitle: source.title,
          sourceUrl: page.url,
          locator,
          reliability: source.reliability,
          sourceGenre: source.sourceType,
          chronology: {
            granularity: "page-range",
            method: "source-page-range",
            yearStart: page.yearStart,
            yearEnd: page.yearEnd,
          },
          translationLicense: page.url.includes("penelope.uchicago.edu")
            ? "LacusCurtius public-domain page marked by single-asterisk URL"
            : "Tertullian Project public-domain transcription page",
        };
        insertPassage.run(
          passageId,
          page.sourceId,
          locator,
          sequence,
          page.yearStart,
          page.yearEnd,
          chunk,
          `${source.title}; ${source.reliability} reliability. Imported as English source text for the Roman Third Century Crisis corpus.`,
          source.reliability === "low" ? "low" : "medium",
          JSON.stringify(raw),
        );
        insertDocument.run(
          documentId,
          passageId,
          `${source.title} · ${locator}`,
          chunk,
          periodId,
          page.yearStart,
          page.yearEnd,
          JSON.stringify(raw),
        );
        inserted += 1;
      });
    }

    db.exec("COMMIT");
    console.log(JSON.stringify({ inserted, sources: sources.length, pages: pages.length }, null, 2));
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
