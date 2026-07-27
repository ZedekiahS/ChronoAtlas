import { compact } from "./event-promotion-core.mjs";

const digitValues = new Map([
  ["〇", 0], ["零", 0], ["一", 1], ["二", 2], ["三", 3], ["四", 4],
  ["五", 5], ["六", 6], ["七", 7], ["八", 8], ["九", 9],
]);

export function parseChineseRegnalYear(value) {
  const text = compact(value).replace(/[０-９]/gu, (char) => String(char.charCodeAt(0) - 0xff10));
  if (text === "元") return 1;
  if (/^\d+$/u.test(text)) return Number(text);
  if (text.startsWith("廿")) return 20 + (digitValues.get(text.slice(1)) ?? 0);
  if (text.startsWith("卅")) return 30 + (digitValues.get(text.slice(1)) ?? 0);
  const tenIndex = text.indexOf("十");
  if (tenIndex >= 0) {
    const tens = tenIndex === 0 ? 1 : digitValues.get(text.slice(0, tenIndex));
    const ones = tenIndex === text.length - 1 ? 0 : digitValues.get(text.slice(tenIndex + 1));
    return tens === undefined || ones === undefined ? null : tens * 10 + ones;
  }
  if ([...text].every((char) => digitValues.has(char))) {
    return Number([...text].map((char) => digitValues.get(char)).join(""));
  }
  return null;
}

function contextHints(card) {
  const text = compact([
    card.source_title,
    card.work_title,
    card.book_title,
    card.source_section_type,
    card.source_section_label,
  ].join(" "));
  const hints = new Set();
  if (/后汉书|後漢書|汉书|漢書/u.test(text)) hints.add("han");
  if (/魏书|魏書|wei-biography/u.test(text)) hints.add("wei");
  if (/蜀书|蜀書|shu-biography/u.test(text)) hints.add("shu");
  if (/吴书|吳書|wu-biography/u.test(text)) hints.add("wu");
  if (/晋书|晉書|jinshu/u.test(text)) hints.add("jin");
  return hints;
}

export function resolveChinaRegnalDate(text, eras, card = {}) {
  const source = compact(text);
  if (!source) return null;
  const hints = contextHints(card);
  const candidates = [];
  const erasByLabel = new Map();
  for (const era of eras) {
    const list = erasByLabel.get(era.era_label) ?? [];
    list.push(era);
    erasByLabel.set(era.era_label, list);
  }

  for (const [label, labelEras] of [...erasByLabel.entries()].sort((left, right) => right[0].length - left[0].length)) {
    let offset = source.indexOf(label);
    while (offset >= 0) {
      const suffix = source.slice(offset + label.length);
      const match = suffix.match(/^(元|[一二三四五六七八九十廿卅〇零０-９\d]{1,4})年/u);
      if (match) {
        const regnalYear = parseChineseRegnalYear(match[1]);
        if (Number.isInteger(regnalYear) && regnalYear > 0) {
          for (const era of labelEras) {
            const year = era.time_start + regnalYear - 1;
            if (year > era.time_end) continue;
            if (Number.isInteger(card.passage_year_start) && year < card.passage_year_start) continue;
            if (Number.isInteger(card.passage_year_end) && year > card.passage_year_end) continue;
            let score = labelEras.length === 1 ? 2 : 0;
            if (era.context_key && hints.has(era.context_key)) score += 4;
            if (Number.isInteger(card.passage_year_start) && Number.isInteger(card.passage_year_end)) score += 1;
            candidates.push({ era, year, regnalYear, score, matchedText: `${label}${match[1]}年` });
          }
        }
      }
      offset = source.indexOf(label, offset + label.length);
    }
  }

  if (!candidates.length) return null;
  candidates.sort((left, right) => right.score - left.score || left.year - right.year || left.era.id.localeCompare(right.era.id));
  const best = candidates[0];
  const tiedYears = new Set(candidates.filter((candidate) => candidate.score === best.score).map((candidate) => candidate.year));
  if (tiedYears.size > 1) {
    return {
      year: null,
      method: "china-regnal-ambiguous",
      confidence: "low",
      candidates: candidates.filter((candidate) => candidate.score === best.score).map((candidate) => ({
        eraId: candidate.era.id,
        year: candidate.year,
        matchedText: candidate.matchedText,
      })),
    };
  }

  return {
    year: best.year,
    method: "china-regnal-era",
    confidence: best.score >= 4 ? "high" : "medium",
    eraId: best.era.id,
    eraLabel: best.era.era_label,
    contextKey: best.era.context_key,
    regnalYear: best.regnalYear,
    matchedText: best.matchedText,
  };
}
