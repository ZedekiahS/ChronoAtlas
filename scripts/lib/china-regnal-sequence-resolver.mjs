import { compact } from "./event-promotion-core.mjs";
import { parseChineseRegnalYear, resolveChinaRegnalDate } from "./china-regnal-date-resolver.mjs";

const bareRegnalYearPattern =
  /^[」』】"“”‘’\s]*(?:[春夏秋冬])?(元|[一二三四五六七八九十廿卅〇零０-９\d]{1,4})年/u;
const annalDateContinuationPattern =
  /^[」』】"“”‘’\s]*(?:(?:[春夏秋冬])?(?:(?:闰|閏)月|(?:闰|閏)?(?:正月|[一二三四五六七八九十]+月))|[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])(?:[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]{0,2})?[，、]?/u;
const annalTerminalCommentaryPattern = /(?:^|[，。；])(?:[」』"“”‘’】]+)?(?:史臣|赞|贊|论|論|干宝|干寶)曰[：:]?/u;
const annalImperialResponsePattern = /(?:^|[，。；])(?:[」』"“”‘’】]+)?制曰[：:]?/u;

export function createChinaRegnalSequenceResolver(eras, options = {}) {
  const annalContextConfidence = options.annalContextConfidence ?? "medium";
  const allowBiographyChronologyContext = options.allowBiographyChronologyContext === true;
  const biographyContextConfidence = options.biographyContextConfidence ?? "high";
  const biographyMaxSentenceGap = options.biographyMaxSentenceGap ?? 8;
  const eraById = new Map(eras.map((era) => [era.id, era]));
  const stateBySource = new Map();
  const erasByContext = new Map();
  for (const era of eras) {
    const items = erasByContext.get(era.context_key) ?? [];
    items.push(era);
    erasByContext.set(era.context_key, items);
  }

  const eraChangeInText = (text, state) => {
    const source = compact(text);
    if (!source.includes("改元")) return null;
    const contextEras = erasByContext.get(state.era.context_key) ?? [];
    const named = contextEras
      .filter((era) => source.includes(era.era_label))
      .sort((left, right) => right.era_label.length - left.era_label.length)[0];
    if (named && named.id !== state.era.id) return named;
    if (!/改元(?:[，。；]|$)/u.test(source)) return null;
    return contextEras
      .filter((era) => era.id !== state.era.id && era.time_start === state.year)
      .sort((left, right) => right.time_end - left.time_end || left.id.localeCompare(right.id))[0] ?? null;
  };

  return {
    resolve(text, context) {
      // The Hanshu Zhaodi transcription has "六月春正月" where the annal sequence requires "六年春正月".
      text = compact(text).replace(/^六月春正月/u, "六年春正月");
      const sourceId = context.source.id;
      const usePassageRange = options.usePassageRange !== false;
      const explicit = resolveChinaRegnalDate(text, eras, {
        source_title: context.source.title,
        work_title: context.workTitle,
        book_title: context.source.citation_short,
        source_section_type: context.section.type,
        source_section_label: context.section.label,
        passage_year_start: usePassageRange ? context.passage.year_start : null,
        passage_year_end: usePassageRange ? context.passage.year_end : null,
      });
      if (Number.isInteger(explicit?.year)) {
        const era = eraById.get(explicit.eraId);
        stateBySource.set(sourceId, {
          era,
          year: explicit.year,
          commentary: false,
          passageId: context.passage?.id ?? null,
          anchorSentenceIndex: context.sentenceIndex ?? null,
        });
        return explicit;
      }

      if (context.section.type !== "annal") {
        if (!allowBiographyChronologyContext || context.section.type !== "biography") return null;
        const state = stateBySource.get(sourceId);
        const sentenceIndex = context.sentenceIndex;
        const isSamePassage = state?.passageId && state.passageId === context.passage?.id;
        const sentenceGap = Number.isInteger(sentenceIndex) && Number.isInteger(state?.anchorSentenceIndex)
          ? sentenceIndex - state.anchorSentenceIndex
          : null;
        if (
          !state?.era
          || !isSamePassage
          || !Number.isInteger(sentenceGap)
          || sentenceGap < 0
          || sentenceGap > biographyMaxSentenceGap
          || annalTerminalCommentaryPattern.test(compact(text))
          || annalImperialResponsePattern.test(compact(text))
        ) {
          return null;
        }
        const bareYear = compact(text).match(bareRegnalYearPattern);
        if (bareYear) {
          const regnalYear = parseChineseRegnalYear(bareYear[1]);
          const year = state.era.time_start + regnalYear - 1;
          if (!Number.isInteger(regnalYear) || regnalYear <= 0 || year > state.era.time_end) return null;
          state.year = year;
          state.anchorSentenceIndex = sentenceIndex;
        }
        return {
          year: state.year,
          method: bareYear
            ? "china-regnal-biography-sequence"
            : "china-regnal-biography-context",
          confidence: biographyContextConfidence,
          eraId: state.era.id,
          eraLabel: state.era.era_label,
          contextKey: state.era.context_key,
          regnalYear: state.year - state.era.time_start + 1,
          matchedText: bareYear?.[0] ?? null,
          inheritedWithinPassage: true,
        };
      }
      let state = stateBySource.get(sourceId);
      if (!state?.era) {
        const bareYear = compact(text).match(bareRegnalYearPattern);
        const regnalYear = bareYear ? parseChineseRegnalYear(bareYear[1]) : null;
        const passageStart = context.passage.year_start;
        const passageEnd = context.passage.year_end;
        const inferred = Number.isInteger(regnalYear)
          && regnalYear > 0
          && Number.isInteger(passageStart)
          && Number.isInteger(passageEnd)
          ? eras.filter((era) => {
              const year = era.time_start + regnalYear - 1;
              return year >= passageStart && year <= passageEnd && year <= era.time_end;
            })
          : [];
        if (inferred.length !== 1) return null;
        const era = inferred[0];
        const year = era.time_start + regnalYear - 1;
        state = { era, year, commentary: false };
        stateBySource.set(sourceId, state);
        return {
          year,
          method: "china-regnal-annal-range-inference",
          confidence: "high",
          eraId: era.id,
          eraLabel: era.era_label,
          contextKey: era.context_key,
          regnalYear,
          matchedText: bareYear[0],
          inheritedWithinSource: true,
        };
      }
      if (annalTerminalCommentaryPattern.test(compact(text))) {
        state.commentary = true;
        return null;
      }
      if (state.commentary) return null;
      if (annalImperialResponsePattern.test(compact(text))) return null;
      const changedEra = eraChangeInText(text, state);
      if (changedEra) {
        state.era = changedEra;
        state.year = Math.max(changedEra.time_start, Math.min(state.year, changedEra.time_end));
        return {
          year: state.year,
          method: "china-regnal-annal-era-change",
          confidence: "high",
          eraId: changedEra.id,
          eraLabel: changedEra.era_label,
          contextKey: changedEra.context_key,
          regnalYear: state.year - changedEra.time_start + 1,
          matchedText: compact(text).match(/改元[^，。；]*/u)?.[0] ?? "改元",
          inheritedWithinSource: true,
        };
      }
      const bareYear = compact(text).match(bareRegnalYearPattern);
      const datedContinuation = !bareYear && annalDateContinuationPattern.test(compact(text));
      if (bareYear) {
        const regnalYear = parseChineseRegnalYear(bareYear[1]);
        const year = state.era.time_start + regnalYear - 1;
        if (!Number.isInteger(regnalYear) || regnalYear <= 0 || year > state.era.time_end) return null;
        state.year = year;
      }
      return {
        year: state.year,
        method: bareYear
          ? "china-regnal-annal-sequence"
          : datedContinuation
            ? "china-regnal-annal-date-continuation"
            : "china-regnal-annal-context",
        confidence: bareYear || datedContinuation ? "high" : annalContextConfidence,
        eraId: state.era.id,
        eraLabel: state.era.era_label,
        contextKey: state.era.context_key,
        regnalYear: state.year - state.era.time_start + 1,
        matchedText: bareYear?.[0] ?? null,
        inheritedWithinSource: true,
      };
    },
  };
}
