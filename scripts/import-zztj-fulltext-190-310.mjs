import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));

const ctextIndexUrl = "https://ctext.org/wiki.pl?if=gb&remap=gb&res=638056";
const batchId = "ctext-zztj-fulltext-190-310";

const volumeYears = new Map([
  [59, [188, 190]],
  [60, [191, 193]],
  [61, [194, 195]],
  [62, [196, 198]],
  [63, [199, 200]],
  [64, [201, 205]],
  [65, [206, 208]],
  [66, [209, 213]],
  [67, [214, 216]],
  [68, [217, 219]],
  [69, [220, 222]],
  [70, [223, 227]],
  [71, [228, 230]],
  [72, [231, 234]],
  [73, [235, 237]],
  [74, [238, 245]],
  [75, [246, 252]],
  [76, [253, 255]],
  [77, [256, 261]],
  [78, [262, 264]],
  [79, [265, 272]],
  [80, [273, 279]],
  [81, [280, 288]],
  [82, [289, 298]],
  [83, [299, 300]],
  [84, [301, 301]],
  [85, [302, 303]],
  [86, [304, 308]],
  [87, [309, 311]],
]);

const targetVolumes = [...volumeYears.keys()];

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([，。；：！？、」』）】])/g, "$1")
    .replace(/([「『（【])\s+/g, "$1")
    .trim();
}

function extractTitle(innerHtml) {
  return stripTags(innerHtml.replace(/<span class="translationtitle">[\s\S]*?<\/span>/g, ""));
}

function extractChineseText(cellHtml) {
  const withoutTranslation = cellHtml.includes('<span class="etext"') ? cellHtml.slice(0, cellHtml.indexOf('<span class="etext"')) : cellHtml;
  return normalizeText(stripTags(withoutTranslation));
}

function json(value) {
  return JSON.stringify(value);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ChronoAtlas local source importer",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseIndex(html) {
  const volumeLinks = new Map();
  const linkPattern = /(\d+)\.\s*<a href="([^"]+)">([\s\S]*?)<span class="translationtitle">\s*Volume\s+\1\s*<\/span><\/a>/g;
  for (const match of html.matchAll(linkPattern)) {
    const volume = Number(match[1]);
    if (!targetVolumes.includes(volume)) continue;

    const href = decodeEntities(match[2]).replace(/&amp;/g, "&");
    const title = extractTitle(match[3]);
    const url = new URL(href, "https://ctext.org/").toString();
    volumeLinks.set(volume, { volume, title, url });
  }
  return volumeLinks;
}

function parsePassages(html, volumeMeta) {
  const rows = [];
  const rowPattern = /<tr class="result"([^>]*)>([\s\S]*?)<\/tr>/g;

  for (const match of html.matchAll(rowPattern)) {
    const attrs = match[1] ?? "";
    const rowHtml = match[2];
    const idMatch = attrs.match(/\sid="([^"]+)"/);
    const rowId = idMatch?.[1] ?? null;
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cell[1]);
    if (cells.length < 2) continue;

    const lineNumber = Number(stripTags(cells[0]));
    const text = extractChineseText(cells[1]);
    if (!text) continue;
    if (/^(查看|修改|上一页|下一页)$/.test(text)) continue;

    rows.push({
      lineNumber: Number.isFinite(lineNumber) ? lineNumber : rows.length + 1,
      rowId,
      text,
      locator: `${volumeMeta.title} · 行 ${Number.isFinite(lineNumber) ? lineNumber : rows.length + 1}`,
    });
  }

  return rows;
}

const upsertSource = db.prepare(`
  INSERT INTO sources
    (id, title, author, type, citation_short, url, language, corpus_id, note, raw_json, original_title, source_type, date_label, date_start, date_end, reliability_level, review_status)
  VALUES
    (@id, @title, '司马光', 'chronicle', @citationShort, @url, 'zh-Hans', @corpusId, @note, @rawJson, @originalTitle, 'chronicle', '北宋', 1084, 1084, 'high', 'reviewed')
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    author = COALESCE(sources.author, excluded.author),
    type = COALESCE(sources.type, excluded.type),
    citation_short = excluded.citation_short,
    url = excluded.url,
    language = COALESCE(sources.language, excluded.language),
    corpus_id = excluded.corpus_id,
    note = excluded.note,
    raw_json = excluded.raw_json,
    original_title = excluded.original_title,
    source_type = COALESCE(sources.source_type, excluded.source_type),
    reliability_level = 'high',
    review_status = 'reviewed'
`);

const deleteExistingPassages = db.prepare("DELETE FROM source_passages WHERE id LIKE ?");
const upsertPassage = db.prepare(`
  INSERT OR REPLACE INTO source_passages
    (id, source_id, parent_passage_id, locator, sequence, year_start, year_end, text, translation, language, notes, confidence, review_status, raw_json, place_hint, topic_hint)
  VALUES
    (@id, @sourceId, NULL, @locator, @sequence, @yearStart, @yearEnd, @text, NULL, 'zh-Hans', @notes, 'high', 'reviewed', @rawJson, NULL, 'primary-source-fulltext')
`);

const deletePassageI18n = db.prepare("DELETE FROM source_passage_i18n WHERE passage_id LIKE ?");
const upsertPassageI18n = db.prepare(`
  INSERT OR REPLACE INTO source_passage_i18n
    (passage_id, locale, translation, notes, raw_json)
  VALUES
    (?, 'zh', NULL, ?, ?)
`);

const deleteSearchDocuments = db.prepare("DELETE FROM search_documents WHERE id LIKE ?");
const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents
    (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES
    (@id, 'source_passages', @subjectId, @title, @body, 'zh-Hans', 'china', @periodId, 'source_criticism', @timeStart, @timeEnd, 'reviewed', @rawJson)
`);

const indexHtml = await fetchText(ctextIndexUrl);
const volumeLinks = parseIndex(indexHtml);
const missingVolumes = targetVolumes.filter((volume) => !volumeLinks.has(volume));
if (missingVolumes.length > 0) {
  throw new Error(`Missing CTP links for ZZTJ volumes: ${missingVolumes.join(", ")}`);
}

let passageCount = 0;

db.exec("BEGIN");
try {
  deleteExistingPassages.run("ctext:zztj:%");
  deletePassageI18n.run("ctext:zztj:%");
  deleteSearchDocuments.run("source-passage:ctext:zztj:%");

  for (const volume of targetVolumes) {
    const volumeMeta = volumeLinks.get(volume);
    const [yearStart, yearEnd] = volumeYears.get(volume);
    const sourceId = `zizhi-tongjian-${volume}`;
    const chapterHtml = await fetchText(volumeMeta.url);
    const rows = parsePassages(chapterHtml, volumeMeta);

    if (rows.length === 0) {
      throw new Error(`No passages extracted for ${sourceId} (${volumeMeta.url})`);
    }

    upsertSource.run({
      id: sourceId,
      title: `资治通鉴·卷${volume}`,
      citationShort: `资治通鉴卷${volume}`,
      url: volumeMeta.url,
      corpusId: yearEnd <= 280 ? "china-three-kingdoms" : "china-wei-jin-northern-southern",
      note: `Full-text passages imported from Chinese Text Project for ChronoAtlas 190-310 source context.`,
      originalTitle: volumeMeta.title,
      rawJson: json({
        generatedFrom: batchId,
        ctextIndexUrl,
        ctextChapterUrl: volumeMeta.url,
        ctextTitle: volumeMeta.title,
        volume,
        yearStart,
        yearEnd,
      }),
    });

    for (const row of rows) {
      const passageId = `ctext:zztj:${String(volume).padStart(3, "0")}:${String(row.lineNumber).padStart(4, "0")}`;
      const title = `${volumeMeta.title} · 行 ${row.lineNumber}`;
      const rawJson = json({
        generatedFrom: batchId,
        sourceUrl: volumeMeta.url,
        ctextRowId: row.rowId,
        volume,
        lineNumber: row.lineNumber,
        extraction: "ctext-result-row-chinese-cell",
      });

      upsertPassage.run({
        id: passageId,
        sourceId,
        locator: row.locator,
        sequence: row.lineNumber,
        yearStart,
        yearEnd,
        text: row.text,
        notes: `完整原文层：${volumeMeta.title}，按 CTP 正文行导入；仅保留中文正文，未导入英文自动译文。`,
        rawJson,
      });
      upsertPassageI18n.run(passageId, `完整原文层：${volumeMeta.title}`, rawJson);
      upsertSearchDocument.run({
        id: `source-passage:${passageId}`,
        subjectId: passageId,
        title,
        body: `${volumeMeta.title}\n${row.locator}\n${row.text}`,
        periodId: yearEnd <= 280 ? "china-three-kingdoms-180-280" : null,
        timeStart: yearStart,
        timeEnd: yearEnd,
        rawJson,
      });
      passageCount += 1;
    }

    console.log(`Imported ${sourceId}: ${rows.length} passages`);
  }

  db.exec("COMMIT");
  console.log(`Imported ${passageCount} ZZTJ full-text passages across ${targetVolumes.length} volumes.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
