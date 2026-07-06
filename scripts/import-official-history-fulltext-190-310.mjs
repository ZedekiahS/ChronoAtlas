import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));
const batchId = "ctext-official-history-fulltext-190-310";

const sanguozhiIndexUrl = "https://ctext.org/sanguozhi/zhs";
const houhanshuIndexUrl = "https://ctext.org/hou-han-shu/zhs";
const guoxue123SanguozhiBaseUrl = "http://www.guoxue123.com/shibu/0101/00sgz/";

const sanguozhiTargets = [
  ["sanguozhi-wei-wudi", "武帝纪"],
  ["sanguozhi-wei-wendi", "文帝纪"],
  ["sanguozhi-wei-mingdi", "明帝纪"],
  ["sanguozhi-wei-qi-wang", "齐王纪"],
  ["sanguozhi-wei-gaogui-xianggong", "高贵乡公纪"],
  ["sanguozhi-wei-chenliu-wang", "陈留王"],
  ["sanguozhi-wei-dong-zhuo", "董卓传"],
  ["sanguozhi-wei-yuan-shao", "袁绍传"],
  ["sanguozhi-wei-yuan-shu", "袁术传"],
  ["sanguozhi-wei-liu-biao", "刘表传"],
  ["sanguozhi-wei-lubu", "吕布传"],
  ["sanguozhi-wei-zhang-miao", "张邈传"],
  ["sanguozhi-wei-gongsun-zan", "公孙瓒传"],
  ["sanguozhi-wei-tao-qian", "陶谦传"],
  ["sanguozhi-wei-zhang-lu", "张鲁传"],
  ["sanguozhi-wei-xiahou-dun", "夏侯敦传"],
  ["sanguozhi-wei-xiahou-yuan", "夏侯渊传"],
  ["sanguozhi-wei-cao-ren", "曹仁传"],
  ["sanguozhi-wei-cao-hong", "曹洪传"],
  ["sanguozhi-wei-cao-xiu", "曹休传"],
  ["sanguozhi-wei-cao-zhen", "曹真传"],
  ["sanguozhi-wei-cao-shuang", "曹爽传"],
  ["sanguozhi-wei-xun-yu-jia-xu", "荀彧传"],
  ["sanguozhi-wei-xun-yu-jia-xu", "荀攸传"],
  ["sanguozhi-wei-xun-yu-jia-xu", "贾诩传"],
  ["sanguozhi-wei-cheng-yu", "程昱传"],
  ["sanguozhi-wei-guo-jia", "郭嘉传"],
  ["sanguozhi-wei-dong-zhao", "董昭传"],
  ["sanguozhi-wei-liu-ye", "刘晔传"],
  ["sanguozhi-wei-jiang-ji", "蒋济传"],
  ["sanguozhi-wei-chen-qun", "陈羣传子泰"],
  ["sanguozhi-wei-zhong-yao", "锺繇传子名毓"],
  ["sanguozhi-wei-zhang-he", "张合传"],
  ["sanguozhi-wei-xu-huang", "徐晃传"],
  ["sanguozhi-wei-yue-jin", "乐进传"],
  ["sanguozhi-wei-yu-jin", "于禁传"],
  ["sanguozhi-wei-wen-pin", "文聘传"],
  ["sanguozhi-wei-deng-ai", "邓艾传"],
  ["sanguozhi-wei-zhong-hui", "锺会传"],
  ["sanguozhi-shu-xianzhu", "先主传"],
  ["sanguozhi-shu-houzhu", "后主传"],
  ["sanguozhi-shu-zhuge-liang", "诸葛亮传"],
  ["sanguozhi-shu-guan-yu", "关羽传"],
  ["sanguozhi-shu-zhang-fei", "张飞传"],
  ["sanguozhi-shu-zhang-fei", "马超传"],
  ["sanguozhi-shu-zhang-fei", "黄忠传"],
  ["sanguozhi-shu-zhang-fei", "赵云传"],
  ["sanguozhi-shu-pangtong-fa-zheng", "庞统传"],
  ["sanguozhi-shu-pangtong-fa-zheng", "法正传"],
  ["sanguozhi-shu-ma-liang", "马良传"],
  ["sanguozhi-shu-wei-yan", "魏延传"],
  ["sanguozhi-shu-jiang-wei", "姜维传"],
  ["sanguozhi-wu-sun-jian", "孙坚传"],
  ["sanguozhi-wu-sun-ce", "孙策传"],
  ["sanguozhi-wu-wuzhu", "吴主传"],
  ["sanguozhi-wu-sun-hao", "孙亮传"],
  ["sanguozhi-wu-sun-hao", "孙休传"],
  ["sanguozhi-wu-sun-hao", "孙皓传"],
  ["sanguozhi-wu-shi-xie", "士燮"],
  ["sanguozhi-wu-zhou-yu", "周瑜传"],
  ["sanguozhi-wu-zhou-yu", "鲁肃传"],
  ["sanguozhi-wu-zhou-yu", "吕蒙传"],
  ["sanguozhi-wu-cheng-pu", "程普传"],
  ["sanguozhi-wu-huang-gai", "黄盖传"],
  ["sanguozhi-wu-lu-xun", "陆逊传"],
  ["sanguozhi-wu-lu-dai", "吕岱传"],
  ["sanguozhi-wu-wei-yao", "韦曜传"],
];

const houhanshuTargets = [
  ["houhanshu-xiandi", "孝献帝纪"],
  ["houhanshu-huangfu-song", "皇甫嵩朱隽列传"],
  ["houhanshu-dong-zhuo", "董卓列传"],
  ["houhanshu-liu-yu-gongsun-zan-tao-qian", "刘虞公孙瓒陶谦列传"],
  ["houhanshu-yuan-shao-liu-biao-shang", "袁绍刘表列传上"],
  ["houhanshu-yuan-shao-liu-biao-xia", "袁绍刘表列传下"],
  ["houhanshu-liu-yan-yuan-shu-lu-bu", "刘焉袁术吕布列传"],
];

const jinshuTargets = [
  {
    sourceId: "jinshu-xuandi",
    title: "晋书·帝纪第一 宣帝",
    chapter: "346256",
    yearStart: 179,
    yearEnd: 251,
  },
  {
    sourceId: "jinshu-jingdi-wendi",
    title: "晋书·帝纪第二 景帝文帝",
    chapter: "420424",
    yearStart: 208,
    yearEnd: 265,
  },
  {
    sourceId: "jinshu-wudi",
    title: "晋书·帝纪第三 世祖武帝",
    chapter: "854352",
    yearStart: 265,
    yearEnd: 290,
  },
  {
    sourceId: "jinshu-huidi",
    title: "晋书·帝纪第四 孝惠帝",
    chapter: "982739",
    yearStart: 290,
    yearEnd: 306,
  },
  {
    sourceId: "jinshu-yang-hu-du-yu",
    title: "晋书·列传第四 羊祜杜预",
    chapter: "578546",
    yearStart: 240,
    yearEnd: 285,
  },
  {
    sourceId: "jinshu-wang-jun-du-yu",
    title: "晋书·列传第九 王沈子王濬",
    chapter: "396632",
    yearStart: 240,
    yearEnd: 290,
  },
];

const sourceTitleRestores = [
  ["sanguozhi-wei-xun-yu-jia-xu", "三国志·魏书·荀彧荀攸贾诩传"],
  ["sanguozhi-wei-zhang-he", "三国志·魏书·张乐于张徐传"],
  ["sanguozhi-shu-zhang-fei", "三国志·蜀书·关张马黄赵传"],
  ["sanguozhi-shu-pangtong-fa-zheng", "三国志·蜀书·庞统法正传"],
  ["sanguozhi-wu-sun-hao", "三国志·吴书·三嗣主传"],
  ["sanguozhi-wu-zhou-yu", "三国志·吴书·周瑜鲁肃吕蒙传"],
];

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

function extractChineseText(cellHtml) {
  const chineseHtml = cellHtml.includes('<span class="etext"') ? cellHtml.slice(0, cellHtml.indexOf('<span class="etext"')) : cellHtml;
  return normalizeText(stripTags(chineseHtml));
}

function json(value) {
  return JSON.stringify(value);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 ChronoAtlasImporter/1.0",
      },
    });
    if (response.ok) {
      return response.text();
    }

    lastError = new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    if (![403, 429, 500, 502, 503, 504].includes(response.status)) break;
    await wait(1200 * attempt);
  }

  throw lastError;
}

async function fetchGb18030Text(url) {
  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "zh-CN,zh;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ChronoAtlasImporter/1.0",
      },
    });
    if (response.ok) {
      return new TextDecoder("gb18030").decode(await response.arrayBuffer());
    }

    lastError = new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    if (![403, 429, 500, 502, 503, 504].includes(response.status)) break;
    await wait(800 * attempt);
  }

  throw lastError;
}

function cleanGuoxue123Text(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function chunkChineseText(text, maxLength = 1800) {
  const normalized = text.replace(/\n+/g, "\n").trim();
  const units = normalized
    .split(/(?<=[。！？；])\s*/u)
    .map((unit) => unit.trim())
    .filter(Boolean);
  const chunks = [];
  let current = "";

  for (const unit of units) {
    if (current && current.length + unit.length > maxLength) {
      chunks.push(current);
      current = "";
    }

    if (unit.length > maxLength) {
      for (let index = 0; index < unit.length; index += maxLength) {
        const part = unit.slice(index, index + maxLength);
        if (current) {
          chunks.push(current);
          current = "";
        }
        chunks.push(part);
      }
      continue;
    }

    current = current ? `${current}${unit}` : unit;
  }

  if (current) chunks.push(current);
  return chunks;
}

function parseGuoxue123SanguozhiPage(html, fallbackTitle) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).split("-")[0].trim() : fallbackTitle;
  const titleMarker = html.match(/<span class="s3">([\s\S]*?)<\/span>/i);
  const contentStart = titleMarker ? titleMarker.index + titleMarker[0].length : 0;
  const footerMatch = html.slice(contentStart).search(/《三国志》|Powered by|Copyright/i);
  const bodyHtml = footerMatch >= 0 ? html.slice(contentStart, contentStart + footerMatch) : html.slice(contentStart);
  const text = cleanGuoxue123Text(bodyHtml)
    .replace(/^上一页\s+目录页\s+下一页\s*/u, "")
    .replace(/^目录页\s+下一页\s*/u, "")
    .replace(/^上一页\s+目录页\s*/u, "")
    .replace(new RegExp(`^${title}\\s*`, "u"), "")
    .trim();

  return { title, chunks: chunkChineseText(text) };
}

function parseCtextDirectory(html, hrefPrefix = null) {
  const entries = new Map();
  const pattern = /href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const match of html.matchAll(pattern)) {
    const rawHref = decodeEntities(match[1]);
    if (hrefPrefix && !rawHref.startsWith(hrefPrefix)) continue;
    const title = stripTags(match[2]);
    if (!title || title.includes(" ")) continue;
    entries.set(title, new URL(rawHref, "https://ctext.org/").toString());
  }
  return entries;
}

function parseCtextDirectoryEntries(html, hrefPrefix = null) {
  const entries = [];
  const seenNodes = new Set();
  const pattern = /href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of html.matchAll(pattern)) {
    const rawHref = decodeEntities(match[1]);
    if (hrefPrefix && !rawHref.startsWith(hrefPrefix)) continue;

    const title = stripTags(match[2]);
    if (!title || title.includes(" ")) continue;

    const nodeMatch = rawHref.match(/[?&]node=(\d+)/);
    if (!nodeMatch) continue;

    const nodeId = nodeMatch[1];
    if (seenNodes.has(nodeId)) continue;
    seenNodes.add(nodeId);

    entries.push({
      nodeId,
      title,
      url: new URL(rawHref, "https://ctext.org/").toString(),
    });
  }

  return entries;
}

function parseCtextTextPage(html, title) {
  const rows = [];
  const rowPattern = /<tr id="n(\d+)">([\s\S]*?)<\/tr>\s*<tr><td class="etext/g;

  for (const match of html.matchAll(rowPattern)) {
    const nodeId = match[1];
    const rowHtml = match[2];
    const lineNumber = rows.length + 1;
    const textCells = [...rowHtml.matchAll(/<td class="ctext">([\s\S]*?)<\/td>/g)];
    const text = textCells.length > 0 ? extractChineseText(textCells[textCells.length - 1][1]) : "";
    if (!text) continue;

    rows.push({
      lineNumber,
      nodeId,
      locator: `${title} · 段 ${lineNumber}`,
      text,
    });
  }

  return rows;
}

function parseCtextWikiPage(html, title) {
  const rows = [];
  const rowPattern = /<tr class="result"[^>]*>([\s\S]*?)<\/tr>/g;

  for (const match of html.matchAll(rowPattern)) {
    const rowHtml = match[1];
    if (rowHtml.includes("wikisubsectiontitle")) continue;

    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cell[1]);
    if (cells.length === 0) continue;

    const maybeNumber = Number(stripTags(cells[0]));
    const lineNumber = Number.isFinite(maybeNumber) && cells.length > 1 ? maybeNumber : rows.length + 1;
    const textCell = cells.length > 1 ? cells[cells.length - 1] : cells[0];
    const text = extractChineseText(textCell);
    if (!text) continue;
    if (/^《.+》$/.test(text) && text.length < 30) continue;

    rows.push({
      lineNumber,
      nodeId: null,
      locator: `${title} · 段 ${lineNumber}`,
      text,
    });
  }

  return rows;
}

function periodIdFor(yearEnd) {
  if (yearEnd <= 280) return "china-three-kingdoms-180-280";
  if (yearEnd >= 310) return "china-wei-jin-northern-southern-310-589";
  return null;
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

const deletePassages = db.prepare("DELETE FROM source_passages WHERE id LIKE ?");
const deletePassageI18n = db.prepare("DELETE FROM source_passage_i18n WHERE passage_id LIKE ?");
const deleteSearchDocuments = db.prepare("DELETE FROM search_documents WHERE id LIKE ?");
const deleteNonCompleteSanguozhiPassageI18n = db.prepare("DELETE FROM source_passage_i18n WHERE passage_id LIKE 'ctext:sgz:%' AND passage_id NOT LIKE 'ctext:sgz:sanguozhi-guoxue123-%'");
const deleteNonCompleteSanguozhiSearchDocuments = db.prepare("DELETE FROM search_documents WHERE id LIKE 'source-passage:ctext:sgz:%' AND id NOT LIKE 'source-passage:ctext:sgz:sanguozhi-guoxue123-%'");
const deleteNonCompleteSanguozhiPassages = db.prepare("DELETE FROM source_passages WHERE id LIKE 'ctext:sgz:%' AND id NOT LIKE 'ctext:sgz:sanguozhi-guoxue123-%'");

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

const restoreSourceTitle = db.prepare(`
  UPDATE sources
  SET title = ?, citation_short = ?
  WHERE id = ?
`);
const countPassagesByPrefix = db.prepare("SELECT count(*) AS count FROM source_passages WHERE id LIKE ?");

async function importCtextTextTargets({ indexUrl, hrefPrefix, targets, workTitle, author, corpusId, dateLabel, dateStart, dateEnd, idPrefix, defaultYearStart, defaultYearEnd }) {
  if (targets.length === 0) return 0;

  const indexHtml = await fetchText(indexUrl);
  const directory = parseCtextDirectory(indexHtml, hrefPrefix);
  let imported = 0;

  for (const [sourceId, title] of targets) {
    const url = directory.get(title);
    if (!url) {
      console.warn(`Skipped missing ${workTitle} target: ${title}`);
      continue;
    }

    const html = await fetchText(url);
    const rows = parseCtextTextPage(html, `${workTitle}·${title}`);
    if (rows.length === 0) {
      console.warn(`Skipped empty ${workTitle} target: ${title}`);
      continue;
    }

    upsertSource.run({
      id: sourceId,
      title: `${workTitle}·${title}`,
      author,
      citationShort: `${workTitle} ${title}`,
      url,
      corpusId,
      note: `Full-text passages imported from Chinese Text Project for ChronoAtlas 190-310 source context.`,
      rawJson: json({ generatedFrom: batchId, url, title, workTitle }),
      originalTitle: `${workTitle}·${title}`,
      dateLabel,
      dateStart,
      dateEnd,
    });

    for (const row of rows) {
      const passageId = `${idPrefix}:${sourceId}:${row.nodeId ?? String(row.lineNumber).padStart(4, "0")}`;
      const rawJson = json({
        generatedFrom: batchId,
        sourceUrl: url,
        workTitle,
        title,
        ctextNodeId: row.nodeId,
        lineNumber: row.lineNumber,
        extraction: "ctext-text-page-chinese-cell",
      });

      upsertPassage.run({
        id: passageId,
        sourceId,
        locator: row.locator,
        sequence: row.lineNumber,
        yearStart: defaultYearStart,
        yearEnd: defaultYearEnd,
        text: row.text,
        notes: `完整原文层：${workTitle}·${title}，按 CTP 正文段落导入；仅保留中文正文，未导入英文自动译文。`,
        rawJson,
      });
      upsertPassageI18n.run(passageId, `完整原文层：${workTitle}·${title}`, rawJson);
      upsertSearchDocument.run({
        id: `source-passage:${passageId}`,
        subjectId: passageId,
        title: row.locator,
        body: `${workTitle}·${title}\n${row.locator}\n${row.text}`,
        periodId: periodIdFor(defaultYearEnd),
        timeStart: defaultYearStart,
        timeEnd: defaultYearEnd,
        rawJson,
      });
    }

    imported += rows.length;
    console.log(`Imported ${sourceId}: ${rows.length} passages`);
  }

  return imported;
}

async function importCompleteSanguozhi() {
  const workTitle = "\u4e09\u56fd\u5fd7";
  const author = "\u9648\u5bff\u64b0\uff0c\u88f4\u677e\u4e4b\u6ce8";
  const dateLabel = "\u897f\u664b";
  const note = "Complete Sanguozhi full-text passages imported from Chinese Text Project for ChronoAtlas source context.";
  const indexHtml = await fetchText(sanguozhiIndexUrl);
  const entries = parseCtextDirectoryEntries(indexHtml, "text.pl?node=");
  let imported = 0;

  for (const entry of entries) {
    const sourceId = `sanguozhi-ctext-${entry.nodeId}`;
    const sourceTitle = `${workTitle}\u00b7${entry.title}`;
    const html = await fetchText(entry.url);
    const rows = parseCtextTextPage(html, sourceTitle);
    if (rows.length === 0) {
      console.warn(`Skipped empty Sanguozhi target: ${entry.title}`);
      continue;
    }

    upsertSource.run({
      id: sourceId,
      title: sourceTitle,
      author,
      citationShort: `${workTitle} ${entry.title}`,
      url: entry.url,
      corpusId: "china-three-kingdoms",
      note,
      rawJson: json({ generatedFrom: batchId, url: entry.url, title: entry.title, workTitle, ctextNodeId: entry.nodeId, importScope: "complete-sanguozhi-directory" }),
      originalTitle: sourceTitle,
      dateLabel,
      dateStart: 280,
      dateEnd: 297,
    });

    for (const row of rows) {
      const passageId = `ctext:sgz:${sourceId}:${row.nodeId ?? String(row.lineNumber).padStart(4, "0")}`;
      const rawJson = json({
        generatedFrom: batchId,
        sourceUrl: entry.url,
        workTitle,
        title: entry.title,
        ctextNodeId: row.nodeId,
        lineNumber: row.lineNumber,
        extraction: "ctext-text-page-chinese-cell",
        importScope: "complete-sanguozhi-directory",
      });

      upsertPassage.run({
        id: passageId,
        sourceId,
        locator: row.locator,
        sequence: row.lineNumber,
        yearStart: 184,
        yearEnd: 280,
        text: row.text,
        notes: `Complete original text layer: ${sourceTitle}; Chinese source text only.`,
        rawJson,
      });
      upsertPassageI18n.run(passageId, `Complete original text layer: ${sourceTitle}`, rawJson);
      upsertSearchDocument.run({
        id: `source-passage:${passageId}`,
        subjectId: passageId,
        title: row.locator,
        body: `${sourceTitle}\n${row.locator}\n${row.text}`,
        periodId: "china-three-kingdoms-180-280",
        timeStart: 184,
        timeEnd: 280,
        rawJson,
      });
    }

    imported += rows.length;
    console.log(`Imported ${sourceId}: ${rows.length} passages`);
  }

  console.log(`Complete Sanguozhi directory pages: ${entries.length}`);
  return imported;
}

async function importCompleteSanguozhiFromGuoxue123() {
  const workTitle = "\u4e09\u56fd\u5fd7";
  const author = "\u9648\u5bff\u64b0\uff0c\u88f4\u677e\u4e4b\u6ce8";
  const note = "Complete Sanguozhi full text imported from Guoxue123 / Guoxue Daohang; Chinese source text and Pei Songzhi annotations are retained.";
  let imported = 0;

  for (let volumeIndex = 0; volumeIndex <= 65; volumeIndex += 1) {
    const fileName = `${String(volumeIndex).padStart(3, "0")}.htm`;
    const url = new URL(fileName, guoxue123SanguozhiBaseUrl).toString();
    const html = await fetchGb18030Text(url);
    const fallbackTitle = volumeIndex <= 64 ? `${workTitle}\u00b7\u5377${volumeIndex + 1}` : `${workTitle}\u00b7\u4e0a\u4e09\u56fd\u5fd7\u6ce8\u8868`;
    const { title, chunks } = parseGuoxue123SanguozhiPage(html, fallbackTitle);

    if (chunks.length === 0) {
      console.warn(`Skipped empty Guoxue123 Sanguozhi page: ${fileName}`);
      continue;
    }

    const sourceId = `sanguozhi-guoxue123-${String(volumeIndex).padStart(3, "0")}`;
    const sourceTitle = `${workTitle}\u00b7${title}`;
    upsertSource.run({
      id: sourceId,
      title: sourceTitle,
      author,
      citationShort: `${workTitle} ${title}`,
      url,
      corpusId: "china-three-kingdoms",
      note,
      rawJson: json({ generatedFrom: batchId, url, title, workTitle, provider: "guoxue123", importScope: "complete-sanguozhi-volumes" }),
      originalTitle: sourceTitle,
      dateLabel: "\u897f\u664b",
      dateStart: 280,
      dateEnd: 297,
    });

    chunks.forEach((text, index) => {
      const sequence = index + 1;
      const passageId = `ctext:sgz:${sourceId}:${String(sequence).padStart(4, "0")}`;
      const locator = `${sourceTitle} \u00b7 \u6bb5 ${sequence}`;
      const rawJson = json({
        generatedFrom: batchId,
        sourceUrl: url,
        workTitle,
        title,
        provider: "guoxue123",
        volumeIndex,
        sequence,
        extraction: "guoxue123-gb2312-html-main-text",
        importScope: "complete-sanguozhi-volumes",
      });

      upsertPassage.run({
        id: passageId,
        sourceId,
        locator,
        sequence,
        yearStart: 184,
        yearEnd: 280,
        text,
        notes: `Complete original text layer: ${sourceTitle}; Guoxue123 main text with Pei Songzhi annotations retained.`,
        rawJson,
      });
      upsertPassageI18n.run(passageId, `Complete original text layer: ${sourceTitle}`, rawJson);
      upsertSearchDocument.run({
        id: `source-passage:${passageId}`,
        subjectId: passageId,
        title: locator,
        body: `${sourceTitle}\n${locator}\n${text}`,
        periodId: "china-three-kingdoms-180-280",
        timeStart: 184,
        timeEnd: 280,
        rawJson,
      });
    });

    imported += chunks.length;
    console.log(`Imported ${sourceId}: ${chunks.length} passages`);
    await wait(120);
  }

  return imported;
}

async function importJinshuTargets() {
  let imported = 0;

  for (const target of jinshuTargets) {
    const url = `https://ctext.org/wiki.pl?chapter=${target.chapter}&if=gb&remap=gb`;
    const html = await fetchText(url);
    const rows = parseCtextWikiPage(html, target.title);
    if (rows.length === 0) {
      console.warn(`Skipped empty Jinshu target: ${target.title}`);
      continue;
    }

    upsertSource.run({
      id: target.sourceId,
      title: target.title,
      author: "房玄龄等",
      citationShort: target.title,
      url,
      corpusId: target.yearEnd <= 280 ? "china-three-kingdoms" : "china-wei-jin-northern-southern",
      note: `Full-text passages imported from Chinese Text Project for ChronoAtlas 190-310 source context.`,
      rawJson: json({ generatedFrom: batchId, url, title: target.title, chapter: target.chapter }),
      originalTitle: target.title,
      dateLabel: "唐",
      dateStart: 648,
      dateEnd: 648,
    });

    for (const row of rows) {
      const passageId = `ctext:jinshu:${target.sourceId}:${String(row.lineNumber).padStart(4, "0")}`;
      const rawJson = json({
        generatedFrom: batchId,
        sourceUrl: url,
        workTitle: "晋书",
        title: target.title,
        chapter: target.chapter,
        lineNumber: row.lineNumber,
        extraction: "ctext-wiki-result-row-chinese-cell",
      });

      upsertPassage.run({
        id: passageId,
        sourceId: target.sourceId,
        locator: row.locator,
        sequence: row.lineNumber,
        yearStart: target.yearStart,
        yearEnd: target.yearEnd,
        text: row.text,
        notes: `完整原文层：${target.title}，按 CTP 正文段落导入；仅保留中文正文，未导入英文自动译文。`,
        rawJson,
      });
      upsertPassageI18n.run(passageId, `完整原文层：${target.title}`, rawJson);
      upsertSearchDocument.run({
        id: `source-passage:${passageId}`,
        subjectId: passageId,
        title: row.locator,
        body: `${target.title}\n${row.locator}\n${row.text}`,
        periodId: periodIdFor(target.yearEnd),
        timeStart: target.yearStart,
        timeEnd: target.yearEnd,
        rawJson,
      });
    }

    imported += rows.length;
    console.log(`Imported ${target.sourceId}: ${rows.length} passages`);
  }

  return imported;
}

sanguozhiTargets.length = 0;
houhanshuTargets.length = 0;
jinshuTargets.length = 0;

db.exec("BEGIN");
try {
  for (const prefix of ["ctext:sgz:%"]) {
    deletePassages.run(prefix);
    deletePassageI18n.run(prefix);
    deleteSearchDocuments.run(`source-passage:${prefix}`);
  }

  let sgzCount = await importCtextTextTargets({
    indexUrl: sanguozhiIndexUrl,
    hrefPrefix: "text.pl?node=",
    targets: sanguozhiTargets,
    workTitle: "三国志",
    author: "陈寿撰，裴松之注",
    corpusId: "china-three-kingdoms",
    dateLabel: "西晋",
    dateStart: 280,
    dateEnd: 297,
    idPrefix: "ctext:sgz",
    defaultYearStart: 184,
    defaultYearEnd: 280,
  });

  const completeSgzCount = await importCompleteSanguozhiFromGuoxue123();
  sgzCount = completeSgzCount;
  deleteNonCompleteSanguozhiPassageI18n.run();
  deleteNonCompleteSanguozhiSearchDocuments.run();
  deleteNonCompleteSanguozhiPassages.run();
  console.log(`Complete Sanguozhi fulltext passages retained: ${completeSgzCount}.`);

  await importCtextTextTargets({
    indexUrl: houhanshuIndexUrl,
    hrefPrefix: "hou-han-shu/",
    targets: houhanshuTargets,
    workTitle: "后汉书",
    author: "范晔",
    corpusId: "china-three-kingdoms",
    dateLabel: "南朝宋",
    dateStart: 420,
    dateEnd: 445,
    idPrefix: "ctext:hhs",
    defaultYearStart: 180,
    defaultYearEnd: 220,
  });

  await importJinshuTargets();
  const hhsCount = countPassagesByPrefix.get("ctext:hhs:%").count;
  const jinCount = countPassagesByPrefix.get("ctext:jinshu:%").count;

  for (const [sourceId, title] of sourceTitleRestores) {
    restoreSourceTitle.run(title, title, sourceId);
  }

  db.exec("COMMIT");
  console.log(`Imported official-history fulltext passages: 三国志 ${sgzCount}, 后汉书 ${hhsCount}, 晋书 ${jinCount}.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
