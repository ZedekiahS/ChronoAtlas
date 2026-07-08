import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));

function sourceNumber(sourceId) {
  const match = sourceId.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function digitYear(value) {
  const digitMap = new Map([
    ["〇", "0"],
    ["○", "0"],
    ["零", "0"],
    ["一", "1"],
    ["二", "2"],
    ["三", "3"],
    ["四", "4"],
    ["五", "5"],
    ["六", "6"],
    ["七", "7"],
    ["八", "8"],
    ["九", "9"],
  ]);
  const normalized = value.replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 0xff10));
  if (/^\d+$/.test(normalized)) return Number(normalized);
  if ([...normalized].every((char) => digitMap.has(char))) {
    return Number([...normalized].map((char) => digitMap.get(char)).join(""));
  }
  return null;
}

function extractZztjYears(text) {
  const years = [];
  const patterns = [
    /[（(][^）)]{0,24}?、\s*(前)?([〇○零一二三四五六七八九０-９\d]{2,4})[）)]/gu,
    /(前)?([〇○零一二三四五六七八九０-９\d]{2,4})年/gu,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const year = digitYear(match[2]);
      if (year === null || year < 1 || year > 1912) continue;
      years.push(match[1] ? -year : year);
    }
  }

  return years;
}

function parseChineseSmallNumber(value) {
  const digitMap = new Map([
    ["\u3007", 0],
    ["\u25cb", 0],
    ["\u96f6", 0],
    ["\u4e00", 1],
    ["\u4e8c", 2],
    ["\u4e09", 3],
    ["\u56db", 4],
    ["\u4e94", 5],
    ["\u516d", 6],
    ["\u4e03", 7],
    ["\u516b", 8],
    ["\u4e5d", 9],
  ]);
  const normalized = value.replace(/[\uff10-\uff19]/g, (char) => String(char.charCodeAt(0) - 0xff10));
  if (/^\d+$/.test(normalized)) return Number(normalized);
  if (normalized === "\u5341") return 10;
  const tenIndex = normalized.indexOf("\u5341");
  if (tenIndex >= 0) {
    const tensText = normalized.slice(0, tenIndex);
    const onesText = normalized.slice(tenIndex + 1);
    const tens = tensText ? digitMap.get(tensText) : 1;
    const ones = onesText ? digitMap.get(onesText) : 0;
    if (tens === undefined || ones === undefined) return null;
    return tens * 10 + ones;
  }
  if ([...normalized].every((char) => digitMap.has(char))) {
    return Number([...normalized].map((char) => digitMap.get(char)).join(""));
  }
  return null;
}

function extractZztjHeaderYears(text) {
  const years = [];
  const patterns = [
    /[\uff08(][^\uff09)]{0,80}?(\u524d)?([0-9\uff10-\uff19\u3007\u25cb\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]{1,4})[\u3001,\uff0c\uff09)]/gu,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const year = parseChineseSmallNumber(match[2]);
      if (year === null || year < 1 || year > 1912) continue;
      if (!match[1] && year < 100) continue;
      years.push(match[1] ? -year : year);
    }
  }

  return years;
}

function extractZztjRange(text) {
  const years = extractZztjHeaderYears(text);
  const usableYears = years.filter((year) => year >= -403 && year <= 959);
  if (!usableYears.length) return null;

  const startYear = Math.min(...usableYears);
  const durationMatch = text.match(/\u51e1([0-9\uff10-\uff19\u3007\u25cb\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]+)\u5e74(\u6709\u5947)?/u);
  if (!durationMatch) return [startYear, Math.max(...usableYears)];

  const duration = parseChineseSmallNumber(durationMatch[1]);
  if (!duration || duration < 1) return [startYear, Math.max(...usableYears)];

  const yearEnd = durationMatch[2] ? startYear + duration : startYear + duration - 1;
  return [startYear, yearEnd];
}

function houhanshuRange(sourceId) {
  const index = sourceNumber(sourceId);
  if (index === null) return [25, 220, "work-default"];
  if (index <= 2) return [25, 57, "annals-guangwu"];
  if (index === 3) return [58, 75, "annals-ming"];
  if (index === 4) return [76, 88, "annals-zhang"];
  if (index === 5) return [89, 105, "annals-he"];
  if (index === 6) return [106, 125, "annals-shang-an"];
  if (index === 7) return [126, 146, "annals-shun-chong-zhi"];
  if (index === 8) return [147, 167, "annals-huan"];
  if (index === 9) return [168, 189, "annals-ling"];
  if (index === 10) return [189, 220, "annals-xian"];
  return [25, 220, index >= 100 ? "treatise-work-range" : "biography-work-range"];
}

function jinshuRange(sourceId) {
  const index = sourceNumber(sourceId);
  if (index === null) return [179, 420, "work-default"];
  if (index === 1) return [179, 251, "annals-xuandi"];
  if (index === 2) return [208, 265, "annals-jing-wen"];
  if (index === 3) return [265, 290, "annals-wudi"];
  if (index === 4) return [290, 306, "annals-huidi"];
  if (index === 5) return [307, 313, "annals-huai"];
  if (index === 6) return [313, 317, "annals-min"];
  if (index === 7) return [317, 323, "annals-yuandi"];
  if (index === 8) return [323, 325, "annals-mingdi"];
  if (index === 9) return [325, 342, "annals-chengdi-kangdi"];
  if (index === 10) return [342, 361, "annals-mudi-aidi-haixi"];
  if (index === 11) return [371, 396, "annals-jianwen-xiaowu"];
  if (index === 12) return [397, 420, "annals-andi-gongdi"];
  if (index <= 30) return [265, 420, "treatise-work-range"];
  return [179, 420, "biography-work-range"];
}

const sourceRows = db.prepare(`
  SELECT
    s.id,
    s.title,
    group_concat(sp.text, '\n') AS text,
    (
      SELECT group_concat(inner_sp.text, '\n')
      FROM source_passages inner_sp
      WHERE inner_sp.source_id = s.id
        AND inner_sp.sequence <= 1
      ORDER BY inner_sp.sequence
    ) AS header_text
  FROM sources s
  JOIN source_passages sp ON sp.source_id = s.id
  WHERE s.id LIKE 'houhanshu-guoxue123-%'
     OR s.id LIKE 'jinshu-guoxue123-%'
     OR s.id LIKE 'zizhi-tongjian-guoxue123-%'
     OR s.id LIKE 'sanguozhi-guoxue123-%'
  GROUP BY s.id
  ORDER BY s.id
`).all();

const updateSource = db.prepare(`
  UPDATE sources
  SET raw_json = json_set(COALESCE(raw_json, '{}'), '$.chronology', json(?))
  WHERE id = ?
`);
const updatePassage = db.prepare(`
  UPDATE source_passages
  SET year_start = ?, year_end = ?,
      raw_json = json_set(COALESCE(raw_json, '{}'), '$.chronology', json(?))
  WHERE source_id = ?
`);
const updateSearchDocument = db.prepare(`
  UPDATE search_documents
  SET time_start = ?, time_end = ?,
      raw_json = json_set(COALESCE(raw_json, '{}'), '$.chronology', json(?))
  WHERE subject_table = 'source_passages'
    AND subject_id IN (SELECT id FROM source_passages WHERE source_id = ?)
`);
const zztjChronologies = db.prepare(`
  SELECT
    s.id,
    json_extract(s.raw_json, '$.chronology.method') AS method,
    json_extract(s.raw_json, '$.chronology.yearStart') AS yearStart,
    json_extract(s.raw_json, '$.chronology.yearEnd') AS yearEnd
  FROM sources s
  WHERE s.id LIKE 'zizhi-tongjian-guoxue123-%'
  ORDER BY s.id
`);

const summary = new Map();

db.exec("BEGIN");
try {
  for (const source of sourceRows) {
    let range;
    if (source.id.startsWith("houhanshu-guoxue123-")) {
      range = houhanshuRange(source.id);
    } else if (source.id.startsWith("jinshu-guoxue123-")) {
      range = jinshuRange(source.id);
    } else if (source.id.startsWith("zizhi-tongjian-guoxue123-")) {
      if (source.id === "zizhi-tongjian-guoxue123-001") {
        range = [null, null, "front-matter"];
      } else {
        const zztjRange = extractZztjRange(source.header_text ?? source.text ?? "");
        range = zztjRange
          ? [zztjRange[0], zztjRange[1], "annalistic-header-range"]
          : [-403, 959, "work-default"];
      }
    } else if (source.id.startsWith("sanguozhi-guoxue123-")) {
      range = [184, 280, "work-default"];
    } else {
      continue;
    }

    const [yearStart, yearEnd, method] = range;
    const chronology = JSON.stringify({
      granularity: method === "front-matter" ? "front-matter" : method.includes("work") || method.includes("biography") || method.includes("treatise") ? "work-or-section-range" : "chapter-range",
      method,
      yearStart,
      yearEnd,
      note: "ChronoAtlas domestic full-text chronology normalization for retrieval; use as source-level range, not exact event dating.",
    });
    updateSource.run(chronology, source.id);
    updatePassage.run(yearStart, yearEnd, chronology, source.id);
    updateSearchDocument.run(yearStart, yearEnd, chronology, source.id);

    const key = source.id.split("-guoxue123-")[0];
    if (yearStart === null || yearEnd === null) continue;
    const current = summary.get(key) ?? { sources: 0, minYear: yearStart, maxYear: yearEnd };
    current.sources += 1;
    current.minYear = Math.min(current.minYear, yearStart);
    current.maxYear = Math.max(current.maxYear, yearEnd);
    summary.set(key, current);
  }

  const zztjRows = zztjChronologies.all().map((row) => ({
    ...row,
    index: sourceNumber(row.id),
    yearStart: Number(row.yearStart),
    yearEnd: Number(row.yearEnd),
  }));
  for (const row of zztjRows) {
    if (row.method !== "work-default") continue;
    const previous = zztjRows
      .filter((candidate) => candidate.index < row.index && candidate.method !== "work-default")
      .at(-1);
    const next = zztjRows.find((candidate) => candidate.index > row.index && candidate.method !== "work-default");
    if (!previous || !next) continue;

    const yearStart = Math.min(previous.yearEnd, next.yearStart);
    const yearEnd = Math.max(previous.yearEnd, next.yearStart);
    const chronology = JSON.stringify({
      granularity: "chapter-range",
      method: "annalistic-neighbor-interpolation",
      yearStart,
      yearEnd,
      note: "ChronoAtlas domestic full-text chronology normalization for retrieval; interpolated from adjacent Zizhi Tongjian volume ranges, not exact event dating.",
    });
    updateSource.run(chronology, row.id);
    updatePassage.run(yearStart, yearEnd, chronology, row.id);
    updateSearchDocument.run(yearStart, yearEnd, chronology, row.id);
  }

  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

console.log(JSON.stringify(Object.fromEntries(summary), null, 2));
