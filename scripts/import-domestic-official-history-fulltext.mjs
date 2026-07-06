import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const batchId = "guoxue123-official-history-fulltext";

const works = [
  {
    id: "houhanshu",
    workTitle: "后汉书",
    author: "范晔撰，李贤等注",
    baseUrl: "http://www.guoxue123.com/shibu/0101/00hhsz/",
    indexUrl: "http://www.guoxue123.com/shibu/0101/00hhsz/index.htm",
    sourcePrefix: "houhanshu-guoxue123",
    passagePrefix: "guoxue123:hhs",
    corpusId: "china-three-kingdoms",
    note: "Complete Hou Hanshu full text imported from Guoxue123 / Guoxue Daohang; Chinese source text and Li Xian annotations are retained.",
    dateLabel: "南朝宋",
    dateStart: 420,
    dateEnd: 445,
    defaultYearStart: 25,
    defaultYearEnd: 220,
    searchPeriodId: "china-three-kingdoms-180-280",
    oldPassagePatterns: ["ctext:hhs:%"],
  },
  {
    id: "jinshu",
    workTitle: "晋书",
    author: "房玄龄等撰",
    baseUrl: "http://www.guoxue123.com/shibu/0101/00jsj/",
    indexUrl: "http://www.guoxue123.com/shibu/0101/00jsj/index.htm",
    sourcePrefix: "jinshu-guoxue123",
    passagePrefix: "guoxue123:jinshu",
    corpusId: "china-three-kingdoms",
    note: "Complete Jin Shu full text imported from Guoxue123 / Guoxue Daohang; Chinese source text is retained.",
    dateLabel: "唐",
    dateStart: 646,
    dateEnd: 648,
    defaultYearStart: 265,
    defaultYearEnd: 420,
    searchPeriodId: "china-wei-jin-northern-southern-310-589",
    oldPassagePatterns: ["ctext:jinshu:%"],
  },
  {
    id: "zizhi-tongjian",
    workTitle: "资治通鉴",
    author: "司马光撰，胡三省音注",
    baseUrl: "http://www.guoxue123.com/shibu/0101/01zztjhz/",
    indexUrl: "http://www.guoxue123.com/shibu/0101/01zztjhz/index.htm",
    sourcePrefix: "zizhi-tongjian-guoxue123",
    passagePrefix: "guoxue123:zztj",
    corpusId: "china-three-kingdoms",
    note: "Complete Zizhi Tongjian full text with Hu Sanxing annotations imported from Guoxue123 / Guoxue Daohang; Chinese source text is retained.",
    dateLabel: "北宋",
    dateStart: 1065,
    dateEnd: 1084,
    defaultYearStart: -403,
    defaultYearEnd: 959,
    searchPeriodId: "china-three-kingdoms-180-280",
    oldPassagePatterns: ["ctext:zztj:%"],
  },
];

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(value) {
  return JSON.stringify(value);
}

async function fetchGb18030Text(url) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "ChronoAtlas local domestic-source importer",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      return new TextDecoder("gb18030").decode(bytes);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await wait(500 * attempt);
      }
    }
  }

  throw lastError;
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function cleanGuoxueText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<(br|p|div|tr|li|h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkChineseText(text, maxLength = 1800) {
  const units = text
    .split(/(?<=[。！？；])\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks = [];
  let current = "";

  for (const unit of units.length ? units : [text]) {
    if (current && current.length + unit.length > maxLength) {
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

    current = current ? `${current}${unit}` : unit;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function parseDirectory(html, baseUrl) {
  const entries = [];
  const seen = new Set();
  const pattern = /href=["']([^"']+\.htm)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(pattern)) {
    const href = decodeEntities(match[1]).trim();
    if (/^index\.htm$/i.test(href)) {
      continue;
    }
    if (!/^\d{3}\.htm$/i.test(href)) {
      continue;
    }

    const title = stripTags(match[2]);
    if (!title || title.length > 80) {
      continue;
    }

    const url = new URL(href, baseUrl).toString();
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    entries.push({ href, title, url });
  }

  entries.sort((left, right) => left.href.localeCompare(right.href));
  return entries;
}

function parsePage(html, fallbackTitle, workTitle) {
  const titleMarker = html.match(/<span class=["']s3["'][^>]*>([\s\S]*?)<\/span>/i);
  const h1Marker = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const titleMatch = titleMarker ?? h1Marker ?? html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).split("-")[0].trim() : fallbackTitle;
  const contentStart = titleMarker ? titleMarker.index + titleMarker[0].length : h1Marker ? h1Marker.index + h1Marker[0].length : 0;
  const footerOffset = html.slice(contentStart).search(/上一页\s*目录页\s*下一页[\s\S]*?(Copyright|版权所有)|Copyright|版权所有|Powered by|国学导航/iu);
  const bodyHtml = footerOffset >= 0 ? html.slice(contentStart, contentStart + footerOffset) : html.slice(contentStart);
  const text = cleanGuoxueText(bodyHtml)
    .replace(/^上一页\s+目录页\s+下一页\s*/u, "")
    .replace(/^目录页\s+下一页\s*/u, "")
    .replace(/^上一页\s+目录页\s*/u, "")
    .replace(new RegExp(`^${workTitle}\\s*`, "u"), "")
    .replace(new RegExp(`^${title}\\s*`, "u"), "")
    .trim();

  return { title, chunks: chunkChineseText(text) };
}

const upsertSource = db.prepare(`
  INSERT INTO sources
    (id, title, author, type, citation_short, url, language, corpus_id, note, raw_json, original_title, source_type, date_label, date_start, date_end, reliability_level, review_status)
  VALUES
    (@id, @title, @author, 'official-history', @citationShort, @url, 'zh-Hans', @corpusId, @note, @rawJson, @originalTitle, 'official-history', @dateLabel, @dateStart, @dateEnd, 'high', 'reviewed')
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
    reliability_level = 'high',
    review_status = 'reviewed'
`);

const upsertPassage = db.prepare(`
  INSERT OR REPLACE INTO source_passages
    (id, source_id, parent_passage_id, locator, sequence, year_start, year_end, text, translation, language, notes, confidence, review_status, raw_json, place_hint, topic_hint)
  VALUES
    (@id, @sourceId, NULL, @locator, @sequence, @yearStart, @yearEnd, @text, NULL, 'zh-Hans', @notes, 'high', 'reviewed', @rawJson, NULL, 'primary-source-fulltext')
`);

const upsertPassageI18n = db.prepare(`
  INSERT OR REPLACE INTO source_passage_i18n
    (passage_id, locale, translation, notes, raw_json)
  VALUES
    (?, 'zh', NULL, ?, ?)
`);

const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents
    (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES
    (@id, 'source_passages', @subjectId, @title, @body, 'zh-Hans', 'china', @periodId, 'source_criticism', @timeStart, @timeEnd, 'reviewed', @rawJson)
`);

const deletePassages = db.prepare("DELETE FROM source_passages WHERE id LIKE ?");
const deletePassageI18n = db.prepare("DELETE FROM source_passage_i18n WHERE passage_id LIKE ?");
const deleteSearchDocuments = db.prepare("DELETE FROM search_documents WHERE id LIKE ?");

async function importWork(work) {
  console.log(`Reading directory: ${work.workTitle}`);
  const indexHtml = await fetchGb18030Text(work.indexUrl);
  const entries = parseDirectory(indexHtml, work.baseUrl);

  if (entries.length === 0) {
    throw new Error(`No directory entries found for ${work.workTitle}`);
  }

  db.exec("BEGIN");
  try {
    deletePassages.run(`${work.passagePrefix}:%`);
    deletePassageI18n.run(`${work.passagePrefix}:%`);
    deleteSearchDocuments.run(`source-passage:${work.passagePrefix}:%`);

    for (const oldPattern of work.oldPassagePatterns) {
      deletePassages.run(oldPattern);
      deletePassageI18n.run(oldPattern);
      deleteSearchDocuments.run(`source-passage:${oldPattern}`);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  let importedPassages = 0;

  for (const [entryIndex, entry] of entries.entries()) {
    const html = await fetchGb18030Text(entry.url);
    const { title, chunks } = parsePage(html, entry.title, work.workTitle);

    if (chunks.length === 0) {
      console.warn(`Skipped empty page: ${work.workTitle} ${entry.href} ${title}`);
      continue;
    }

    const sourceId = `${work.sourcePrefix}-${String(entryIndex + 1).padStart(3, "0")}`;
    const sourceTitle = `${work.workTitle}·${title}`;
    const rawSourceJson = json({
      generatedFrom: batchId,
      provider: "guoxue123",
      url: entry.url,
      href: entry.href,
      title,
      workTitle: work.workTitle,
      importScope: "complete-domestic-fulltext",
    });

    db.exec("BEGIN");
    try {
      upsertSource.run({
        id: sourceId,
        title: sourceTitle,
        author: work.author,
        citationShort: `${work.workTitle} ${title}`,
        url: entry.url,
        corpusId: work.corpusId,
        note: work.note,
        rawJson: rawSourceJson,
        originalTitle: sourceTitle,
        dateLabel: work.dateLabel,
        dateStart: work.dateStart,
        dateEnd: work.dateEnd,
      });

      chunks.forEach((text, index) => {
        const sequence = index + 1;
        const passageId = `${work.passagePrefix}:${sourceId}:${String(sequence).padStart(4, "0")}`;
        const locator = `${sourceTitle} · 段 ${sequence}`;
        const rawJson = json({
          generatedFrom: batchId,
          provider: "guoxue123",
          sourceUrl: entry.url,
          href: entry.href,
          workTitle: work.workTitle,
          title,
          sequence,
          extraction: "guoxue123-gb18030-html-main-text",
          importScope: "complete-domestic-fulltext",
        });

        upsertPassage.run({
          id: passageId,
          sourceId,
          locator,
          sequence,
          yearStart: work.defaultYearStart,
          yearEnd: work.defaultYearEnd,
          text,
          notes: `Complete domestic original text layer: ${sourceTitle}; Guoxue123 source text retained.`,
          rawJson,
        });
        upsertPassageI18n.run(passageId, `Complete domestic original text layer: ${sourceTitle}`, rawJson);
        upsertSearchDocument.run({
          id: `source-passage:${passageId}`,
          subjectId: passageId,
          title: locator,
          body: `${sourceTitle}\n${locator}\n${text}`,
          periodId: work.searchPeriodId,
          timeStart: work.defaultYearStart,
          timeEnd: work.defaultYearEnd,
          rawJson,
        });
      });

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    importedPassages += chunks.length;
    console.log(`Imported ${sourceId}: ${chunks.length} passages`);
    await wait(80);
  }

  console.log(`Imported ${work.workTitle}: ${entries.length} pages, ${importedPassages} passages`);
  return { pages: entries.length, passages: importedPassages, work: work.workTitle };
}

try {
  const summaries = [];
  for (const work of works) {
    summaries.push(await importWork(work));
  }
  console.log(JSON.stringify(summaries, null, 2));
} finally {
  db.close();
}
