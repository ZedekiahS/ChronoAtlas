import assert from "node:assert/strict";
import test from "node:test";

import {
  applyEditorialChronology,
  allowsEditorialCollectivePromotion,
  isCompatibleClusterMatchedEvent,
  isFullySupersededMachineEvent,
  isMachineMutableReviewStatus,
  isResolvedPromotionEventTime,
  isStaleMachineEventOwnedByRequestedBatches,
  mergePromotionProvenanceSnapshot,
  mergePromotionGenerationRaw,
  officialHistoryCandidatePromotionEligibility,
  promotionBatchIdsForCards,
  resolveBoundedTime,
  selectPromotionProvenanceMatch,
  shouldCleanupEntirePromotionProfile,
  shouldReplaceOwnedPromotionData,
} from "./event-promotion-core.mjs";
import {
  canPromoteWithoutNamedParticipant,
  canonicalizeOfficialHistoryTitlePersonAliases,
  canonicalizeOfficialHistoryGrantTitle,
  cleanOfficialHistorySummary,
  eventTypeForOfficialHistory,
  isOfficialHistoryCommentaryText,
  normalizeOfficialHistoryEventTitle,
  officialHistoryTitleAuditReasons,
  officialHistoryRoleAuditReasons,
  titleHasNamedActor,
  titleHasNamedGrantRecipient,
} from "./china-official-history-promotion-policy.mjs";
import {
  defaultOfficialHistoryPromotionProfileId,
  getOfficialHistoryPromotionProfile,
} from "./china-official-history-promotion-profiles.mjs";
import { xinTransitionCandidateRepairs } from "../data/xin-transition-official-history-candidate-repairs.mjs";
import easternHan106125CandidateRepairConfig from "../data/eastern-han-106-125-candidate-repairs.mjs";
import easternHan89105CandidateRepairConfig from "../data/eastern-han-89-105-candidate-repairs.mjs";
import easternHan5888CandidateRepairConfig from "../data/eastern-han-58-88-candidate-repairs.mjs";
import easternHan126144CandidateRepairConfig from "../data/eastern-han-126-144-candidate-repairs.mjs";
import easternHan169183CandidateRepairConfig from "../data/eastern-han-169-183-candidate-repairs.mjs";
import { parseChineseRegnalYear, resolveChinaRegnalDate } from "./china-regnal-date-resolver.mjs";
import { createChinaRegnalSequenceResolver } from "./china-regnal-sequence-resolver.mjs";
import {
  createOfficialHistoryPersonSequenceResolver,
  hasOfficialHistoryAbbreviatedMention,
} from "./china-official-history-person-sequence-resolver.mjs";
import {
  chronologyLeadForRejectedSentence,
  findKnownPeople,
  splitSourceSentences,
} from "./rule-based-source-candidate-extractor.mjs";
import {
  createHanshuExtractorConfig,
  createHouhanshuExtractorConfig,
  isExplicitCollectiveOfficialHistoryAction,
  isExplicitInstitutionalOfficialHistoryAction,
} from "./china-official-history-candidate-configs.mjs";
import { chinaRegnalReferenceEasternHan25184 } from "../../db/data/china-regnal-reference-eastern-han-25-184.mjs";
import { chinaPlaceReferenceEasternHan25184 } from "../../db/data/china-place-reference-eastern-han-25-184.mjs";
import { chinaRegnalReferenceWesternHanXinTransition824 } from "../../db/data/china-regnal-reference-western-han-xin-transition--8-24.mjs";
import { chinaRegnalReferenceWesternHanEarly206141 } from "../../db/data/china-regnal-reference-western-han-early--206---141.mjs";
import { chinaRegnalReferenceWesternHanWudi14087 } from "../../db/data/china-regnal-reference-western-han-wudi--140--87.mjs";
import { chinaRegnalReferenceWesternJin281316 } from "../../db/data/china-regnal-reference-western-jin-281-316.mjs";
import { getChinaOfficialHistoryPeriodPack } from "./china-official-history-period-packs.mjs";
import {
  classifyOfficialHistoryTextKind,
  isolateOfficialHistoryNarrativeText,
} from "./official-history-source-cleaning.mjs";
import {
  canonicalProvisionalOfficialHistoryPersonId,
  chooseOfficialHistoryEventPlaces,
  extractExplicitOfficialHistoryPeople,
  findPlaceMentions,
  isJinPrincelyTitlePersonOverlap,
  officialHistoryProvisionalPersonNameAuditReasons,
  provisionalOfficialHistoryPersonId,
} from "./china-official-history-reference-resolver.mjs";

test("broad source ranges never become event dates", () => {
  assert.deepEqual(
    resolveBoundedTime({ passageStart: 184, passageEnd: 280 }),
    {
      start: null,
      end: null,
      precision: "unknown",
      method: "unresolved",
      confidence: "low",
      sourceRange: [184, 280],
    },
  );
});

test("editorial candidate decisions are hard promotion gates", () => {
  assert.deepEqual(
    officialHistoryCandidatePromotionEligibility({ candidateRepair: { disposition: "context" } }),
    { eligible: false, reason: "editorialNotEligible", disposition: "context" },
  );
  assert.deepEqual(
    officialHistoryCandidatePromotionEligibility({ candidateRepair: { disposition: "reject" } }),
    { eligible: false, reason: "editorialNotEligible", disposition: "reject" },
  );
  assert.deepEqual(
    officialHistoryCandidatePromotionEligibility({
      pipeline: "official-history-semantic-candidates-v1",
      semanticRecommendation: "candidate_only",
    }),
    { eligible: false, reason: "semanticNotEligible", recommendation: "candidate_only" },
  );
  assert.equal(
    officialHistoryCandidatePromotionEligibility({ candidateRepair: { disposition: "promote" } }).eligible,
    true,
  );
  assert.equal(
    allowsEditorialCollectivePromotion({
      candidateRepair: { disposition: "promote", allowCollectiveEvent: true },
    }),
    true,
  );
  assert.equal(
    allowsEditorialCollectivePromotion({
      candidateRepair: { disposition: "context", allowCollectiveEvent: true },
    }),
    false,
  );
});

test("explicit collective actions survive the minor-candidate person gate", () => {
  assert.equal(
    isExplicitCollectiveOfficialHistoryAction({
      sentence: "越巂蛮夷及旄牛豪叛，杀长吏。",
      classification: { factType: "military" },
    }),
    true,
  );
  assert.equal(
    isExplicitCollectiveOfficialHistoryAction({
      sentence: "冬，济南贼起，攻东平陵。",
      classification: { factType: "military" },
    }),
    true,
  );
  assert.equal(
    isExplicitCollectiveOfficialHistoryAction({
      sentence: "三年春正月，夫余国遣使贡献。",
      classification: { factType: "diplomacy" },
    }),
    true,
  );
  assert.equal(
    isExplicitCollectiveOfficialHistoryAction({
      sentence: "邓太后绍封旧臣之后。",
      classification: { factType: "administration" },
    }),
    false,
  );
});

test("explicit institutional actions survive the minor-candidate person gate", () => {
  assert.equal(
    isExplicitInstitutionalOfficialHistoryAction({
      sentence: "始置鸿都门学生。",
      classification: { factType: "administration" },
    }),
    true,
  );
  assert.equal(
    isExplicitInstitutionalOfficialHistoryAction({
      sentence: "拜九江太守。",
      classification: { factType: "administration" },
    }),
    false,
  );
});

test("explicit chronology resolution wins over a broad source range", () => {
  const result = resolveBoundedTime({
    resolvedDate: { year: 208, method: "china-regnal-era", confidence: "high" },
    passageStart: 184,
    passageEnd: 280,
  });
  assert.equal(result.start, 208);
  assert.equal(result.end, 208);
  assert.equal(result.precision, "year");
});

test("editorial chronology can define a reviewed exact year range", () => {
  assert.deepEqual(
    applyEditorialChronology(
      resolveBoundedTime({ cardYear: 94 }),
      {
        year: 94,
        endYear: 95,
        method: "editorial-chronology",
        confidence: "high",
        sourceContext: "叛乱始于永元六年，军队于永元七年正月返回。",
      },
    ),
    {
      start: 94,
      end: 95,
      precision: "range",
      method: "editorial-chronology",
      confidence: "high",
      chronology: {
        year: 94,
        endYear: 95,
        method: "editorial-chronology",
        confidence: "high",
        sourceContext: "叛乱始于永元六年，军队于永元七年正月返回。",
      },
    },
  );
  assert.throws(
    () => applyEditorialChronology({}, { year: 95, endYear: 94 }),
    /Invalid editorial chronology range/u,
  );
});

test("Chinese regnal year parser handles common forms", () => {
  assert.equal(parseChineseRegnalYear("元"), 1);
  assert.equal(parseChineseRegnalYear("十三"), 13);
  assert.equal(parseChineseRegnalYear("二十四"), 24);
  assert.equal(parseChineseRegnalYear("廿三"), 23);
});

test("regnal resolver uses source context to disambiguate repeated era names", () => {
  const eras = [
    { id: "shu-jianxing", era_label: "建兴", context_key: "shu", time_start: 223, time_end: 237 },
    { id: "jin-jianxing", era_label: "建兴", context_key: "jin", time_start: 313, time_end: 316 },
  ];
  const shu = resolveChinaRegnalDate("建兴四年，诸军进发。", eras, { source_section_type: "shu-biography" });
  assert.equal(shu.year, 226);
  const ambiguous = resolveChinaRegnalDate("建兴四年，诸军进发。", eras, {});
  assert.equal(ambiguous.year, null);
  assert.equal(ambiguous.method, "china-regnal-ambiguous");
});

test("promotion profiles isolate adjacent historical windows", () => {
  const xinTransition = getOfficialHistoryPromotionProfile("china-western-han-xin-transition--8-24-v1");
  const easternHan = getOfficialHistoryPromotionProfile("china-eastern-han-25-183-v1");
  const template = getOfficialHistoryPromotionProfile(defaultOfficialHistoryPromotionProfileId);
  const westernJin = getOfficialHistoryPromotionProfile("china-western-jin-281-316-v1");
  assert.deepEqual([xinTransition.timeStart, xinTransition.timeEnd], [-8, 24]);
  assert.deepEqual(xinTransition.excludedYears, [0]);
  assert.deepEqual([easternHan.timeStart, easternHan.timeEnd], [25, 183]);
  assert.equal(easternHan.minimumChronologyConfidence, "high");
  assert.deepEqual(easternHan.allowedSourceSectionTypes, ["annal", "biography"]);
  assert.equal(easternHan.mergeProvisionalPeopleByName, true);
  assert.deepEqual([template.timeStart, template.timeEnd], [184, 280]);
  assert.deepEqual([westernJin.timeStart, westernJin.timeEnd], [281, 316]);
  assert.equal(xinTransition.timeEnd + 1, easternHan.timeStart);
  assert.equal(easternHan.timeEnd + 1, template.timeStart);
  assert.equal(template.timeEnd + 1, westernJin.timeStart);
  assert.notEqual(xinTransition.generatorId, easternHan.generatorId);
  assert.notEqual(easternHan.generatorId, template.generatorId);
  assert.notEqual(template.generatorId, westernJin.generatorId);
});

test("Xin-transition editorial decisions cover the batch and resolve missing chronology", () => {
  const ids = xinTransitionCandidateRepairs.map((decision) => decision.cardId);
  const counts = Object.fromEntries(["promote", "context", "reject"].map((disposition) => [
    disposition,
    xinTransitionCandidateRepairs.filter((decision) => decision.disposition === disposition).length,
  ]));
  const chronologyYears = xinTransitionCandidateRepairs
    .filter((decision) => decision.chronology)
    .map((decision) => decision.chronology.year)
    .sort((left, right) => left - right);
  assert.equal(ids.length, 28);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(counts, { promote: 15, context: 9, reject: 4 });
  assert.deepEqual(chronologyYears, [-1, 1, 1, 2, 6, 6, 10, 13, 21, 23, 23]);
  assert.equal(chronologyYears.includes(0), false);
});

test("Eastern Han regnal anchors resolve Houhanshu dates through 183", () => {
  const eras = chinaRegnalReferenceEasternHan25184.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const card = { source_title: "后汉书" };
  assert.equal(resolveChinaRegnalDate("建武元年，帝即位。", eras, card).year, 25);
  assert.equal(resolveChinaRegnalDate("中元二年，帝崩。", eras, card).year, 57);
  assert.equal(resolveChinaRegnalDate("永元十六年，北匈奴远遁。", eras, card).year, 104);
  assert.equal(resolveChinaRegnalDate("延光四年，安帝崩。", eras, card).year, 125);
  assert.equal(resolveChinaRegnalDate("永建七年，改元阳嘉。", eras, card).year, 132);
  assert.equal(resolveChinaRegnalDate("永喜元年，冲帝崩。", eras, card).year, 145);
  assert.equal(resolveChinaRegnalDate("元嘉三年，改元永兴。", eras, card).year, 153);
  assert.equal(resolveChinaRegnalDate("永寿四年，改元延熹。", eras, card).year, 158);
  assert.equal(resolveChinaRegnalDate("光和六年，天下大疫。", eras, card).year, 183);
});

test("Eastern Han period packs are contiguous through 183", () => {
  const packs = [
    "china-eastern-han-25-57-v1",
    "china-eastern-han-58-88-v1",
    "china-eastern-han-89-105-v1",
    "china-eastern-han-106-125-v1",
    "china-eastern-han-126-144-v1",
    "china-eastern-han-145-168-v1",
    "china-eastern-han-169-183-v1",
  ].map((id) => getChinaOfficialHistoryPeriodPack(id));
  assert.deepEqual(
    packs.map((pack) => [pack.timeStart, pack.timeEnd]),
    [[25, 57], [58, 88], [89, 105], [106, 125], [126, 144], [145, 168], [169, 183]],
  );
  assert.equal(new Set(packs.map((pack) => pack.batchId)).size, packs.length);
  assert.equal(packs.every((pack) => pack.promotionProfile === "china-eastern-han-25-183-v1"), true);
  assert.equal(packs.every((pack) => pack.periodId === "china-eastern-han-25-184"), true);
  assert.equal(packs[2].regnalSequenceOptions.annalContextConfidence, "high");
  for (let index = 1; index < packs.length; index += 1) {
    assert.equal(packs[index - 1].timeEnd + 1, packs[index].timeStart);
  }
});

test("Eastern Han 89-105 decisions cover the expanded annal slice and preserve corrected ranges", () => {
  const decisions = easternHan89105CandidateRepairConfig.decisions;
  const ids = decisions.map((decision) => decision.cardId);
  assert.equal(decisions.length, 99);
  assert.equal(new Set(ids).size, 99);
  assert.equal(decisions.filter((decision) => decision.disposition === "promote").length, 47);
  assert.equal(decisions.filter((decision) => decision.disposition === "context").length, 49);
  assert.equal(decisions.filter((decision) => decision.disposition === "reject").length, 3);
  assert.equal(decisions.some((decision) => decision.title === "耿夔大破北匈奴于金微山"), true);
  assert.equal(decisions.some((decision) => decision.title === "任尚讨灭于除鞬"), true);
  assert.equal(decisions.some((decision) => decision.title === "骨都侯喜杀南单于安国"), true);
  assert.equal(decisions.some((decision) => (
    decision.title === "逢侯叛乱及任尚追击叛军"
    && decision.chronology?.year === 94
    && decision.chronology?.endYear === 95
  )), true);
  assert.equal(decisions.filter((decision) => decision.title === "汉和帝崩与刘隆即位").length, 4);
  for (const title of [
    "耿夔大破北匈奴于金微山",
    "任尚讨灭于除鞬",
    "骨都侯喜杀南单于安国",
    "逢侯叛乱及任尚追击叛军",
    "汉和帝崩与刘隆即位",
  ]) {
    const summaries = new Set(decisions.filter((decision) => decision.title === title).map((decision) => decision.summary));
    assert.equal(summaries.size, 1);
    assert.equal(Boolean([...summaries][0]), true);
  }
  assert.deepEqual(
    decisions.find((decision) => decision.cardId.endsWith("f271969973424d5353bc5fd7"))?.placeBindings,
    [{ id: "zhangde-front-hall", label: "章德前殿", role: "primary-location" }],
  );
  const people = easternHan89105CandidateRepairConfig.canonicalPeople;
  assert.equal(people.some((person) => person.name === "南单于安国" && person.id !== "eh-anguo-khotan"), true);
  assert.equal(people.some((person) => person.name === "刘隆" && person.deathYear === 106), true);
});

test("Eastern Han 58-88 decisions cover the annal slice and retain both successions", () => {
  const decisions = easternHan5888CandidateRepairConfig.decisions;
  const ids = decisions.map((decision) => decision.cardId);
  assert.equal(decisions.length, 80);
  assert.equal(new Set(ids).size, 80);
  assert.equal(decisions.filter((decision) => decision.disposition === "promote").length, 40);
  assert.equal(decisions.filter((decision) => decision.disposition === "context").length, 40);
  assert.equal(decisions.filter((decision) => decision.title === "汉明帝崩与刘炟即位").length, 2);
  assert.equal(decisions.filter((decision) => decision.title === "汉章帝崩与刘肇即位").length, 2);
  assert.equal(decisions.some((decision) => (
    decision.title === "封刘建为千乘王"
    && decision.matchedEventId === "official-history-event:888f1c9779e36291f8ab"
  )), true);
});

test("Eastern Han 106-125 editorial decisions form a complete reviewed slice", () => {
  const decisions = easternHan106125CandidateRepairConfig.decisions;
  const ids = decisions.map((decision) => decision.cardId);
  assert.equal(decisions.length, 100);
  assert.equal(new Set(ids).size, 100);
  assert.equal(decisions.filter((decision) => decision.disposition === "promote").length, 44);
  assert.equal(decisions.filter((decision) => decision.disposition === "context").length, 51);
  assert.equal(decisions.filter((decision) => decision.disposition === "reject").length, 5);
  assert.equal(decisions.filter((decision) => decision.allowCollectiveEvent).length, 21);
  assert.equal(
    decisions.some((decision) => decision.allowCollectiveEvent && decision.disposition !== "promote"),
    false,
  );
  assert.equal(
    easternHan106125CandidateRepairConfig.canonicalPeople.some((person) => person.id === "eh-shama-cheshi"),
    true,
  );
  assert.equal(
    decisions.some((decision) => (
      decision.cardId.endsWith("f35f6e80a37f09f973a9f787")
      && decision.personBindings?.some((binding) => binding.personId === "eh-shama-cheshi")
    )),
    true,
  );
  assert.equal(
    decisions.some((decision) => /刘薨|刘遣|及旄牛豪/u.test(decision.title ?? "")),
    false,
  );
});

test("Eastern Han 126-144 editorial decisions form a complete reviewed slice", () => {
  const decisions = easternHan126144CandidateRepairConfig.decisions;
  const ids = decisions.map((decision) => decision.cardId);
  assert.equal(decisions.length, 73);
  assert.equal(new Set(ids).size, 73);
  assert.equal(decisions.filter((decision) => decision.disposition === "promote").length, 47);
  assert.equal(decisions.filter((decision) => decision.disposition === "context").length, 25);
  assert.equal(decisions.filter((decision) => decision.disposition === "reject").length, 1);
  assert.equal(decisions.filter((decision) => decision.allowCollectiveEvent).length, 9);
  assert.equal(
    decisions.some((decision) => decision.allowCollectiveEvent && decision.disposition !== "promote"),
    false,
  );
  assert.equal(
    decisions.filter((decision) => decision.matchedEventId).length,
    10,
  );
  assert.equal(
    easternHan126144CandidateRepairConfig.canonicalPeople.some((person) => person.id === "eh-jiatenu-cheshi"),
    true,
  );
  assert.equal(
    easternHan126144CandidateRepairConfig.canonicalPeople.some((person) => person.id === "eh-liu-bing-chongdi"),
    true,
  );
  const correctedRelativeYear = decisions.find((decision) => decision.cardId.endsWith("8c76e837da7236933e35e9ab"));
  assert.equal(correctedRelativeYear?.chronology?.year, 135);
  assert.equal(correctedRelativeYear?.chronology?.expression, "明年");
  assert.equal(
    decisions.some((decision) => /狼杀女子|县，属|今治/u.test(decision.title ?? "")),
    false,
  );
});

test("Eastern Han 169-183 editorial decisions form a complete reviewed slice", () => {
  const decisions = easternHan169183CandidateRepairConfig.decisions;
  const ids = decisions.map((decision) => decision.cardId);
  assert.equal(decisions.length, 89);
  assert.equal(new Set(ids).size, 89);
  assert.equal(decisions.filter((decision) => decision.disposition === "promote").length, 64);
  assert.equal(decisions.filter((decision) => decision.disposition === "context").length, 25);
  assert.equal(decisions.filter((decision) => decision.disposition === "reject").length, 0);
  assert.equal(decisions.filter((decision) => decision.allowCollectiveEvent).length, 35);
  assert.equal(
    decisions.some((decision) => decision.allowCollectiveEvent && decision.disposition !== "promote"),
    false,
  );
  assert.equal(
    easternHan169183CandidateRepairConfig.canonicalPeople.some((person) => person.id === "eh-lu-zhi"),
    true,
  );
  assert.equal(
    decisions.some((decision) => decision.removePersonNames?.includes("郭嘉")),
    true,
  );
  assert.equal(
    decisions.some((decision) => /郑飒交通|时张修擅|单于呼微|许昭失利|朱俊/u.test(decision.title ?? "")),
    false,
  );
});

test("title alias canonicalization protects complete names and ignores one-character abbreviations", () => {
  const people = [
    { name: "班勇", names: ["班勇", "勇"], via: "candidate-repair" },
    { name: "叶调王便", names: ["叶调王便", "调便", "便"], via: "candidate-repair" },
    { name: "句龙吾斯", names: ["句龙吾斯", "吾斯"], via: "candidate-repair" },
  ];
  assert.equal(
    canonicalizeOfficialHistoryTitlePersonAliases("班勇遣人刺杀句龙吾斯并会见叶调王便", people),
    "班勇遣人刺杀句龙吾斯并会见叶调王便",
  );
  assert.equal(
    canonicalizeOfficialHistoryTitlePersonAliases("调便遣使", people),
    "叶调王便遣使",
  );
  assert.equal(
    canonicalizeOfficialHistoryTitlePersonAliases(
      "灵帝立宋氏为皇后",
      [{ name: "灵帝宋皇后", names: new Set(["灵帝宋皇后", "宋氏", "宋皇后"]) }],
    ),
    "灵帝立宋氏为皇后",
  );
});

test("Western Han and Xin transition regnal anchors resolve without a year zero", () => {
  const eras = chinaRegnalReferenceWesternHanXinTransition824.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const card = { source_title: "汉书" };
  assert.equal(resolveChinaRegnalDate("永始元年，封新都侯。", eras, card).year, -16);
  assert.equal(resolveChinaRegnalDate("绥和元年，诏举贤良。", eras, card).year, -8);
  assert.equal(resolveChinaRegnalDate("建平元年，改元。", eras, card).year, -6);
  assert.equal(resolveChinaRegnalDate("太初元將元年，大赦。", eras, card).year, -5);
  assert.equal(resolveChinaRegnalDate("元壽元年，日有食之。", eras, card).year, -2);
  assert.equal(resolveChinaRegnalDate("元壽二年六月，哀帝崩。", eras, card).year, -1);
  assert.equal(resolveChinaRegnalDate("元始五年，帝崩。", eras, card).year, 5);
  assert.equal(resolveChinaRegnalDate("居攝三年，改元初始。", eras, card).year, 8);
  assert.equal(resolveChinaRegnalDate("始建國五年，大赦。", eras, card).year, 13);
  assert.equal(resolveChinaRegnalDate("天鳳六年，改元。", eras, card).year, 19);
  assert.equal(resolveChinaRegnalDate("地皇四年，王莽败。", eras, card).year, 23);
  assert.equal(resolveChinaRegnalDate("更始二年，诸军进发。", eras, card).year, 24);
});

test("biography chronology inheritance is opt-in and bounded to its passage", () => {
  const eras = chinaRegnalReferenceWesternHanXinTransition824.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const context = {
    source: { id: "hanshu-wang-mang", title: "汉书 王莽传", citation_short: "汉书 卷九十九" },
    passage: { id: "hanshu-wang-mang:001", year_start: 1, year_end: 23 },
    section: { type: "biography", label: "列传" },
    workTitle: "汉书",
  };
  const strict = createChinaRegnalSequenceResolver(eras);
  assert.equal(strict.resolve("始建国二年，遣十二将攻匈奴。", { ...context, sentenceIndex: 0 }).year, 10);
  assert.equal(strict.resolve("又发丁男十余万。", { ...context, sentenceIndex: 1 }), null);

  const resolver = createChinaRegnalSequenceResolver(eras, {
    allowBiographyChronologyContext: true,
    biographyContextConfidence: "high",
    biographyMaxSentenceGap: 2,
  });
  assert.equal(resolver.resolve("始建国二年，遣十二将攻匈奴。", { ...context, sentenceIndex: 0 }).year, 10);
  const inherited = resolver.resolve("又发丁男十余万。", { ...context, sentenceIndex: 1 });
  assert.equal(inherited.year, 10);
  assert.equal(inherited.method, "china-regnal-biography-context");
  assert.equal(inherited.confidence, "high");
  assert.equal(resolver.resolve("三年，更募兵士。", { ...context, sentenceIndex: 2 }).year, 11);
  assert.equal(resolver.resolve("继续征发。", { ...context, sentenceIndex: 5 }), null);
  assert.equal(
    resolver.resolve("另起一事。", {
      ...context,
      passage: { id: "hanshu-wang-mang:002", year_start: 1, year_end: 23 },
      sentenceIndex: 0,
    }),
    null,
  );
});
test("Western Han Wudi slice resolves BCE regnal years and uses annal-only Hanshu extraction", () => {
  const eras = chinaRegnalReferenceWesternHanWudi14087.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  assert.equal(resolveChinaRegnalDate("建元二年", eras, { work_title: "汉书" }).year, -139);
  assert.equal(resolveChinaRegnalDate("元狩四年", eras, { work_title: "汉书" }).year, -119);

  const pack = getChinaOfficialHistoryPeriodPack("china-western-han-wudi--141--119-v1");
  const config = createHanshuExtractorConfig({ sourceWhereSql: pack.sourceWhereSql });
  assert.equal(pack.extractorKind, "hanshu");
  assert.deepEqual(pack.sourceSectionTypes, ["annal"]);
  assert.equal(config.sourceWhereSql, "s.id = 'hanshu-guoxue123-007'");
});

test("early Western Han packs cover Gaozu through Jingdi without a year gap", () => {
  const ids = [
    "china-western-han-gaozu--202--195-v1",
    "china-western-han-huidi--194--188-v1",
    "china-western-han-gaohou--187--180-v1",
    "china-western-han-wendi--179--157-v1",
    "china-western-han-jingdi--156--141-v1",
  ];
  const packs = ids.map(getChinaOfficialHistoryPeriodPack);
  assert.deepEqual(packs.map((pack) => [pack.timeStart, pack.timeEnd]), [
    [-202, -195], [-194, -188], [-187, -180], [-179, -157], [-156, -141],
  ]);
  const eras = chinaRegnalReferenceWesternHanEarly206141.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const resolver = createChinaRegnalSequenceResolver(eras);
  const context = {
    source: { id: "hanshu-gaozu-annal", title: "\u6c49\u4e66 \u9ad8\u5e1d\u7eaa", citation_short: "\u6c49\u4e66 \u5377\u4e00" },
    passage: { year_start: -206, year_end: -195 },
    section: { type: "annal", label: "\u7eaa" },
    workTitle: "\u6c49\u4e66",
  };
  assert.equal(resolver.resolve("\u4e94\u5e74", context).year, -202);
  assert.equal(resolver.resolve("\u5341\u516d\u5e74", { ...context, source: { ...context.source, id: "hanshu-jingdi-annal" }, passage: { year_start: -156, year_end: -141 } }).year, -141);
});

test("transition annals can ignore an inaccurate broad passage range when explicitly configured", () => {
  const eras = chinaRegnalReferenceWesternHanXinTransition824.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const context = {
    source: { id: "hanshu-ping-annal", title: "汉书 平帝纪", citation_short: "汉书 卷十二" },
    passage: { year_start: 1, year_end: 5 },
    section: { type: "annal", label: "纪" },
    workTitle: "汉书",
  };
  const strict = createChinaRegnalSequenceResolver(eras);
  assert.equal(strict.resolve("元壽二年六月，哀帝崩。", context), null);
  const relaxed = createChinaRegnalSequenceResolver(eras, { usePassageRange: false });
  assert.equal(relaxed.resolve("元壽二年六月，哀帝崩。", context).year, -1);
});

test("annal bare years infer a unique era inside the chapter range", () => {
  const eras = chinaRegnalReferenceEasternHan25184.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const context = {
    source: { id: "houhanshu-zhang-annal", title: "后汉书 肃宗孝章帝纪", citation_short: "后汉书 卷三" },
    passage: { year_start: 75, year_end: 88 },
    section: { type: "annal", label: "纪" },
    workTitle: "后汉书",
  };
  const resolver = createChinaRegnalSequenceResolver(eras);
  const accession = resolver.resolve("十八年八月壬子，即皇帝位。", context);
  assert.equal(accession.year, 75);
  assert.equal(accession.eraId, "china-regnal:han:yongping");
  assert.equal(accession.method, "china-regnal-annal-range-inference");
});

test("Western Jin regnal anchors resolve Jinshu dates through 316", () => {
  const eras = chinaRegnalReferenceWesternJin281316.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const card = { source_title: "晋书" };
  assert.equal(resolveChinaRegnalDate("元康元年，立皇太子。", eras, card).year, 291);
  assert.equal(resolveChinaRegnalDate("永嘉五年，洛阳陷。", eras, card).year, 311);
  assert.equal(resolveChinaRegnalDate("建兴四年，帝出降。", eras, card).year, 316);
});

test("annal chronology carries a named era across bare regnal years and entries", () => {
  const eras = chinaRegnalReferenceWesternJin281316.map(
    ([id, era_label, context_key, time_start, time_end]) => ({ id, era_label, context_key, time_start, time_end }),
  );
  const resolver = createChinaRegnalSequenceResolver(eras);
  const context = {
    source: { id: "jinshu-annal", title: "晋书 卷四 帝纪第四", citation_short: "晋书 卷四" },
    passage: { year_start: 290, year_end: 306 },
    section: { type: "annal", label: "纪" },
    workTitle: "晋书",
  };
  assert.equal(resolver.resolve("元康元年，诛太傅杨骏。", context).year, 291);
  assert.equal(resolver.resolve("二年春二月，贾后弑皇太后。", context).year, 292);
  const inherited = resolver.resolve("秋八月，大赦。", context);
  assert.equal(inherited.year, 292);
  assert.equal(inherited.method, "china-regnal-annal-date-continuation");
  assert.equal(inherited.confidence, "high");
  assert.equal(resolver.resolve("丙午，赤眉君臣面缚。", context).confidence, "high");
  assert.equal(resolver.resolve("闰月戊申，三国公爵进王。", context).confidence, "high");
  assert.equal(resolver.resolve("群臣入朝。", context).confidence, "medium");

  const trustedContextResolver = createChinaRegnalSequenceResolver(eras, { annalContextConfidence: "high" });
  assert.equal(trustedContextResolver.resolve("元康元年，诛太傅杨骏。", context).year, 291);
  assert.equal(trustedContextResolver.resolve("群臣入朝。", context).confidence, "high");
  assert.equal(trustedContextResolver.resolve("” 三年春正月，大赦天下。", context).year, 293);

  const transitionResolver = createChinaRegnalSequenceResolver(eras);
  assert.equal(transitionResolver.resolve("永平元年春正月，改元。", context).year, 291);
  const changed = transitionResolver.resolve("三月壬辰，大赦，改元。", context);
  assert.equal(changed.eraId, "china-regnal:jin:yuankang");
  assert.equal(transitionResolver.resolve("七年春正月，周处战于六陌。", context).year, 297);
  assert.equal(transitionResolver.resolve("制曰：武皇承基，诞膺天命。", context), null);
  assert.equal(transitionResolver.resolve("八年春正月，马隆西伐。", context).year, 298);

  const terminalCommentaryResolver = createChinaRegnalSequenceResolver(eras);
  assert.equal(terminalCommentaryResolver.resolve("元康元年，诛太傅杨骏。", context).year, 291);
  assert.equal(terminalCommentaryResolver.resolve("史臣曰：惠帝失驭。", context), null);
  assert.equal(terminalCommentaryResolver.resolve("秋八月，大赦。", context), null);
});

test("high-signal annal actions receive compact event titles", () => {
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "四年春三月，诏诸儒正《五经》文字，刻石立于太学门外。",
      "四年春三月，诏诸儒正《五经》文字，刻石立于太学门外。",
      "administration",
      "minor",
      [],
    ),
    "诏正五经文字并刻石于太学",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "八月，遣破鲜卑中郎将田晏出云中，使匈奴中郎将臧旻出雁门，并伐鲜卑，晏等大败。",
      "八月，遣破鲜卑中郎将田晏出云中，使匈奴中郎将臧旻出雁门，并伐鲜卑，晏等大败。",
      "military",
      "major",
      ["田晏", "臧旻"],
    ),
    "田晏等征伐鲜卑大败",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "闰月，永昌太守曹鸾坐讼党人，弃市。",
      "闰月，永昌太守曹鸾坐讼党人，弃市。",
      "administration",
      "minor",
      ["曹鸾"],
    ),
    "曹鸾因讼党人被处死",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "冬，济南贼起，攻东平陵。",
      "冬，济南贼起，攻东平陵。",
      "military",
      "minor",
      [],
    ),
    "济南贼起兵攻东平陵",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "冬十月，渤海王悝被诬谋反，丁亥，悝及妻子皆自杀。",
      "冬十月，渤海王悝被诬谋反，丁亥，悝及妻子皆自杀。",
      "succession",
      "medium",
      ["刘悝", "渤海王悝"],
    ),
    "渤海王悝谋反冤案",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "鲜卑寇幽、并二州。",
      "鲜卑寇幽、并二州。",
      "military",
      "medium",
      [],
    ),
    "鲜卑寇幽并二州",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "桓帝即位，明年，追尊翼为孝崇皇。",
      "桓帝即位，明年，追尊翼为孝崇皇。",
      "succession",
      "medium",
      [],
    ),
    null,
  );
});

test("rejected quoted annal entries still expose their narrative chronology lead", () => {
  assert.equal(
    chronologyLeadForRejectedSentence("建康元年春正月辛丑，诏曰：“陇西地震。”"),
    "建康元年春正月辛丑，诏曰：",
  );
  assert.equal(chronologyLeadForRejectedSentence("《续汉书》曰：永平元年。"), null);
});

test("official-history sentence splitting excludes quoted continuations across passages", () => {
  const state = { stack: [] };
  const config = { excludeQuotedContinuations: true, minSentenceLength: 4 };
  assert.deepEqual(
    splitSourceSentences(
      "本纪叙事。《玉玺谱》曰：“传国玺出蓝田。至王莽篡位。",
      config,
      state,
    ),
    ["本纪叙事。", "《玉玺谱》曰：“传国玺出蓝田。"],
  );
  assert.deepEqual(
    splitSourceSentences("及莽败。”诏以属城门校尉。三年春正月，帝还宫。", config, state),
    ["”诏以属城门校尉。", "三年春正月，帝还宫。"],
  );
});

test("official-history extraction preserves terse annal events", () => {
  const config = createHouhanshuExtractorConfig();
  assert.equal(config.minSentenceLength, 5);
  assert.deepEqual(
    splitSourceSentences("夏四月，江夏蛮叛。鲜卑寇辽西。", config, { stack: [] }),
    ["夏四月，江夏蛮叛。", "鲜卑寇辽西。"],
  );
  const battle = "冬十一月，护乌桓校尉任尚率乌桓、鲜卑，大破逢侯";
  assert.equal(
    config.candidateTitle(
      battle,
      [{ name: "任尚", matched: "任尚" }, { name: "逢侯", matched: "逢侯" }],
      { factType: "military", eventScale: "major" },
    ),
    "任尚大破逢侯",
  );
});

test("official-history narrative cleaning removes inline commentary and speech tails", () => {
  assert.equal(
    isolateOfficialHistoryNarrativeText("护乌桓校尉任尚率乌桓、鲜卑，大破逢侯，阚駰《十三州志》曰：逢侯走塞外。"),
    "护乌桓校尉任尚率乌桓、鲜卑，大破逢侯",
  );
  assert.equal(
    isolateOfficialHistoryNarrativeText(
      "伯升又破王莽纳言将军严尤、秩宗将军陈茂于淯阳，《前书》曰，纳言，虞官也。",
    ),
    "伯升又破王莽纳言将军严尤、秩宗将军陈茂于淯阳",
  );
  assert.equal(
    isolateOfficialHistoryNarrativeText("转击云杜、安陆，安陆，县，属江夏郡，今安州县也。"),
    "转击云杜、安陆",
  );
  assert.equal(
    isolateOfficialHistoryNarrativeText("更始二年冬，崇、安自武关，宣等从陆浑关，武关在今商州上洛县东。"),
    "更始二年冬，崇、安自武关，宣等从陆浑关",
  );
  assert.equal(
    isolateOfficialHistoryNarrativeText("世祖生舂陵节侯买，舂陵，乡名，本属零陵泠道县。"),
    "世祖生舂陵节侯买",
  );
  assert.equal(
    isolateOfficialHistoryNarrativeText("元壽二年六月，哀帝崩，太皇太后詔曰：「大司馬賢年少，不合眾心。"),
    "元壽二年六月，哀帝崩",
  );
  assert.equal(classifyOfficialHistoryTextKind("〔三〕師古曰：「為使而持節也。」"), "textual_note");
  assert.equal(classifyOfficialHistoryTextKind("張晏曰：「漢哀帝即位六年。」"), "quotation");
  assert.equal(
    classifyOfficialHistoryTextKind("四０一四頁一二行 至〔哀帝元壽二年〕，哀帝崩。"),
    "textual_note",
  );
  assert.equal(classifyOfficialHistoryTextKind("累迁尚书，出为太守，后转少府。"), "career_record");
});

test("place matching does not bind a place name used inside a princely title construction", () => {
  const places = [
    { id: "chengdu", entityId: "place:chengdu", label: "成都", aliases: [], locativeOnlyAliases: [] },
    { id: "yundu", entityId: "place:yundu", label: "云杜", aliases: ["雲杜"], locativeOnlyAliases: [] },
    { id: "anlu", entityId: "place:anlu", label: "安陆", aliases: ["安陸"], locativeOnlyAliases: [] },
  ];
  assert.deepEqual(findPlaceMentions("故桃鄉頃侯子成都為中山王。", places), []);
  assert.deepEqual(findPlaceMentions("定陶恭王子即位，中山孝王薨。", [
    { id: "dingtao", entityId: "place:dingtao", label: "定陶", aliases: [], locativeOnlyAliases: [] },
    { id: "zhongshan", entityId: "place:zhongshan", label: "中山", aliases: [], locativeOnlyAliases: [] },
  ]), []);
  assert.deepEqual(findPlaceMentions("前議定陶傅太后尊號。", [
    { id: "dingtao", entityId: "place:dingtao", label: "定陶", aliases: [], locativeOnlyAliases: [] },
  ]), []);
  assert.deepEqual(
    findPlaceMentions("转击云杜、安陆。", places).map((place) => place.id),
    ["yundu", "anlu"],
  );
});

test("known-person aliases use event time and remain unbound when homonyms are ambiguous", () => {
  const aliases = [
    { id: "wei-guo-1", name: "郭皇后", alias: "郭皇后", birthYear: 184, deathYear: 235 },
    { id: "wei-guo-2", name: "郭皇后", alias: "郭皇后", birthYear: null, deathYear: 264 },
    { id: "han-guo", name: "郭圣通", alias: "郭皇后", birthYear: null, deathYear: 52 },
  ];
  assert.deepEqual(
    findKnownPeople("郭皇后废。", aliases, {}, { year: 41 }),
    [{ id: "han-guo", name: "郭圣通", matched: "郭皇后" }],
  );
  assert.deepEqual(findKnownPeople("郭皇后废。", aliases), []);
});

test("official-history title normalization removes discourse leads and rejects unresolved objects", () => {
  assert.equal(normalizeOfficialHistoryEventTitle("自王莽篡汉", "自王莽篡汉。", "succession", "major"), "王莽篡汉");
  assert.equal(normalizeOfficialHistoryEventTitle("议击匈奴", "明年春，议击匈奴。", "military", "medium"), null);
  assert.equal(normalizeOfficialHistoryEventTitle("其称邑王者七十七人", "其称邑王者七十七人。", "succession", "medium"), null);
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "赦天下系囚在四月丙子以前减死罪一等",
      "赦天下系囚在四月丙子以前减死罪一等。",
      "administration",
      "medium",
    ),
    "赦天下系囚",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "赦天下系囚",
      "章和元年，赦天下系囚在四月丙子以前减死罪一等。",
      "administration",
      "medium",
    ),
    "赦天下系囚",
  );
  assert.equal(normalizeOfficialHistoryEventTitle("太师王匡击之", "太师王匡击之。", "military", "medium"), null);
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "车师前后王遣子入侍",
      "车师震慑，前后王各遣子奉贡入侍，并赐印绶金帛。",
      "diplomacy",
      "major",
    ),
    "车师前后王遣子入侍",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "复封刘无忌为齐王",
      "永元二年，乃复封无忌为齐王，是为惠王。",
      "administration",
      "medium",
      ["刘无忌", "无忌"],
    ),
    "复封刘无忌为齐王",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("中山王刘兴去世", "中山王刘兴去世。", "succession", "major", ["刘兴"]),
    "中山王刘兴去世",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("刘广无后济南国除", "刘广无后济南国除。", "succession", "medium", ["刘广"]),
    "刘广无后济南国除",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("王莽封赏南阳有功吏民", "王莽封赏南阳有功吏民。", "administration", "major", ["王莽"]),
    "王莽封赏南阳有功吏民",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "王舜与左咸迎中山王刘衎",
      "左咸持节迎接中山王。",
      "succession",
      "major",
      ["王舜", "左咸", "刘衎", "中山王"],
    ),
    "王舜与左咸迎中山王刘衎",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("王莽代汉建新", "王莽代汉建新。", "succession", "major", ["王莽"]),
    "王莽代汉建新",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "焉耆叛杀都护但钦",
      "焉耆首先反叛并杀西域都护但钦。",
      "military",
      "major",
      ["但钦"],
    ),
    "焉耆叛杀但钦",
  );
  assert.equal(normalizeOfficialHistoryEventTitle("张奂讨除之", "张奂讨除之。", "military", "medium", ["张奂"]), null);
  assert.equal(normalizeOfficialHistoryEventTitle("李颙讨平之", "李颙讨平之。", "military", "medium", ["李颙"]), null);
  assert.equal(normalizeOfficialHistoryEventTitle("蔡讽追击", "辽东太守蔡讽追击，战殁。", "military", "medium", ["蔡讽"]), null);
  assert.equal(
    normalizeOfficialHistoryEventTitle("刘康坐杀无辜", "零陵太守刘康坐杀无辜，下狱死。", "military", "medium", ["刘康"]),
    "刘康因杀无辜下狱死",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("郭皇后废", "及郭皇后废，建武十七年废。", "succession", "major", ["郭皇后"]),
    "郭皇后被废",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("郭皇后被废", "及郭皇后被废。", "succession", "major", ["郭皇后"]),
    "郭皇后被废",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("西域假司马班超击姑墨", "西域假司马班超击姑墨。", "military", "medium", ["班超"]),
    "班超击姑墨",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("冯焕率二郡太守讨高句骊", "冯焕率二郡太守讨高句骊。", "military", "medium", ["冯焕"]),
    "冯焕讨高句骊",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "阳球奏诛王甫及子长乐少府萌",
      "司隶校尉阳球奏诛王甫及子长乐少府萌、沛相吉。",
      "military",
      "medium",
      ["阳球", "王甫"],
    ),
    "阳球奏诛王甫等",
  );
  assert.equal(normalizeOfficialHistoryEventTitle("袁绍复大攻瓒", "袁绍复大攻瓒。", "military", "medium", ["袁绍"]), null);
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "贾后矫诏使楚王玮杀太宰",
      "贾后矫诏使楚王玮杀太宰、汝南王亮。",
      "military",
      "major",
      ["贾后", "楚王玮", "汝南王亮"],
    ),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "扬州刺史曹武杀丹阳太守朱建",
      "扬州刺史曹武杀丹阳太守朱建。",
      "military",
      "medium",
      ["曹武", "朱建"],
    ),
    "曹武杀朱建",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "淮南王允并镇守要害",
      "淮南王允并镇守要害。",
      "military",
      "medium",
      ["淮南王允"],
    ),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "汉王迪皆遇害",
      "汉王迪皆遇害。",
      "military",
      "medium",
      ["汉王迪"],
    ),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("王粹战败", "王粹战败，死之。", "military", "medium", ["王粹"]),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("李雄僣号成都王", "李雄僣号成都王。", "succession", "major", ["李雄"]),
    "李雄称成都王",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "刘渊士人网络",
      "及永兴元年，刘元海僣号于平阳，称汉，于是并州之地皆为元海所有。",
      "elite_network",
      "medium",
      ["刘渊", "刘元海", "元海"],
    ),
    "刘元海称汉于平阳",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "李雄内政与任官",
      "诸将固请雄即尊位，以永兴元年僣称成都王，赦其境内。",
      "administration",
      "medium",
      ["李雄", "雄"],
    ),
    "雄称成都王",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "刘元海以惠帝永兴元年据离石称汉",
      "刘元海以惠帝永兴元年据离石称汉。",
      "succession",
      "major",
      ["刘元海"],
    ),
    "刘元海据离石称汉",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("丞相司直韦晃起兵诛曹操", "丞相司直韦晃起兵诛曹操。", "military", "major"),
    "丞相司直韦晃起兵诛曹操",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("使曹仁讨关羽於樊", "使曹仁讨关羽於樊。", "military", "major", ["曹仁", "关羽"]),
    "曹仁讨关羽于樊",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "祁弘、刘灵曜、刘渊军事",
      "将军祁弘破刘元海将刘灵曜于广宗。",
      "military",
      "medium",
      ["祁弘", "刘元海", "刘灵曜", "刘渊"],
    ),
    "祁弘破刘灵曜于广宗",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("解系军事", "雍州刺史解系又为度元所破。", "military", "medium", ["解系", "度元"]),
    "度元破解系",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("曹嶷军事", "晞为曹嶷所破。", "military", "medium", ["曹嶷"]),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("东莱人王弥起兵反", "东莱人王弥起兵反。", "military", "medium", ["王弥"]),
    "王弥起兵反",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("大凡刘元海据离石称汉", "大凡刘元海据离石称汉。", "elite_network", "medium", ["刘元海"]),
    "刘元海据离石称汉",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle("庞淳以郡降贼", "庞淳以郡降贼。", "military", "medium", ["庞淳"]),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "王浚、王申始军事",
      "王浚又遣别将王申始讨勒于汶石津。",
      "military",
      "medium",
      ["王浚", "王申始", "勒"],
    ),
    "王申始讨勒于汶石津",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "陆逊、宋谦军事",
      "黄武元年，陆逊部将军宋谦等攻蜀五屯。",
      "military",
      "major",
      ["陆逊", "宋谦"],
    ),
    "宋谦等攻蜀五屯",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "永平十六年，窦固、祭肜、耿秉、来苗等四道出击匈奴。",
      "永平十六年，窦固、祭肜、耿秉、来苗等四道出击匈奴。",
      "military",
      "major",
      ["窦固", "祭肜", "耿秉", "来苗"],
    ),
    "窦固等四道出击匈奴",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "烧当羌叛",
      "六月，烧当羌叛，金城太守郝崇讨之。",
      "rebellion",
      "major",
      ["郝崇"],
    ),
    "烧当羌叛乱",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "永元元年，车骑将军窦宪出征匈奴，宣国威德，其归附者万余人。",
      "永元元年，车骑将军窦宪出征匈奴，宣国威德，其归附者万余人。",
      "military",
      "major",
      ["窦宪"],
    ),
    "窦宪出征匈奴",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "永元元年，与车骑将军窦宪率骑八千，出朔方击北虏，大破之。",
      "永元元年，与车骑将军窦宪率骑八千，出朔方击北虏，大破之。",
      "military",
      "major",
      ["窦宪"],
    ),
    "窦宪出朔方击北虏",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "和帝即位，永元三年，以逵为左中郎将。",
      "和帝即位，永元三年，以逵为左中郎将。",
      "service",
      "minor",
      [],
    ),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "和帝永元四年冬，溇中、澧中蛮潭戎等反，杀略吏民。",
      "和帝永元四年冬，溇中、澧中蛮潭戎等反，杀略吏民。",
      "military",
      "major",
      ["潭戎"],
    ),
    "潭戎等在溇中澧中叛乱",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "和帝元兴元年春，貊人寇郡界，太守耿夔击破之。",
      "和帝元兴元年春，貊人寇郡界，太守耿夔击破之。",
      "military",
      "major",
      ["耿夔"],
    ),
    "貊人寇郡界",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "和帝永元十二年，日南、象林蛮夷二千余人寇掠百姓，余众乃降。",
      "和帝永元十二年，日南、象林蛮夷二千余人寇掠百姓，余众乃降。",
      "military",
      "major",
      [],
    ),
    "日南象林蛮夷寇掠百姓",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "四年春正月，北匈奴右谷蠡王於除鞬自立为单于，款塞乞降。",
      "四年春正月，北匈奴右谷蠡王於除鞬自立为单于，款塞乞降。",
      "diplomacy",
      "major",
      ["于除鞬", "於除鞬"],
    ),
    "于除鞬自立为单于",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "至永元六年，都护班超发诸国兵讨焉耆、危须、尉黎、山国，遂斩焉耆、尉黎二王首。",
      "至永元六年，都护班超发诸国兵讨焉耆、危须、尉黎、山国，遂斩焉耆、尉黎二王首。",
      "military",
      "major",
      ["班超"],
    ),
    "班超发诸国兵讨焉耆",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "和帝元兴元年春，复入辽东，寇略六县，斩其渠帅。",
      "和帝元兴元年春，复入辽东，寇略六县，斩其渠帅。",
      "military",
      "major",
      [],
    ),
    null,
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "己未，遣副校尉阎磐讨北匈奴，取伊吾卢地。",
      "己未，遣副校尉阎磐讨北匈奴，取伊吾卢地。",
      "military",
      "major",
      ["阎磐"],
    ),
    "阎磐取伊吾卢",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "七年春正月，行车骑将军邓鸿、度辽将军朱徽、中郎将杜崇皆下狱死。",
      "七年春正月，行车骑将军邓鸿、度辽将军朱徽、中郎将杜崇皆下狱死。",
      "succession",
      "major",
      ["邓鸿", "朱徽", "杜崇"],
    ),
    "邓鸿等下狱死",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "建武二年春，汉率大司空王梁、大将军杜茂、执金吾贾复、偏将军王霸，共击檀乡贼于邺东漳水上，大破之。",
      "建武二年春，汉率大司空王梁、大将军杜茂、执金吾贾复、偏将军王霸，共击檀乡贼于邺东漳水上，大破之。",
      "military",
      "major",
      ["王梁", "杜茂", "贾复", "王霸"],
    ),
    "王梁等击檀乡贼于邺东漳水上",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "癸丑，司徒邢穆、驸马都尉韩光坐事下狱死。",
      "癸丑，司徒邢穆、驸马都尉韩光坐事下狱死。",
      "succession",
      "major",
      ["邢穆", "韩光"],
    ),
    "邢穆与韩光下狱死",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "韩光坐事下狱死",
      "癸丑，司徒邢穆、驸马都尉韩光坐事下狱死，所连及诛死者甚众。",
      "succession",
      "minor",
      ["邢穆", "司徒邢穆", "韩光", "驸马都尉韩光"],
    ),
    "邢穆与韩光下狱死",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "肃宗建初元年，武陵澧中蛮陈从等反叛，入零阳蛮界。",
      "肃宗建初元年，武陵澧中蛮陈从等反叛，入零阳蛮界。",
      "military",
      "major",
      ["陈从"],
    ),
    "陈从等在武陵澧中叛乱",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "永元六年，郡徼外敦忍乙王莫延慕义，遣使译献犀牛、大象。",
      "永元六年，郡徼外敦忍乙王莫延慕义，遣使译献犀牛、大象。",
      "diplomacy",
      "major",
      ["莫延"],
    ),
    "莫延遣使献犀牛大象",
  );
  assert.equal(
    normalizeOfficialHistoryEventTitle(
      "灵帝立宋氏为皇后",
      "明年，立为皇后。",
      "succession",
      "major",
      ["汉灵帝", "灵帝", "灵帝宋皇后", "宋氏"],
    ),
    "灵帝立宋氏为皇后",
  );
});

test("title audit catches fragments and summary cleanup removes direct speech", () => {
  assert.deepEqual(officialHistoryTitleAuditReasons("曹操又击破之"), ["unresolved-object"]);
  assert.deepEqual(officialHistoryTitleAuditReasons("耿夔斩其渠帅"), ["unresolved-object"]);
  assert.deepEqual(officialHistoryTitleAuditReasons("寇略六县"), ["missing-actor"]);
  assert.equal(cleanOfficialHistorySummary("董卓废少帝，杀何太后，勋与书曰：足下何以终此？", "董卓废少帝"), "董卓废少帝，杀何太后。");
  assert.equal(cleanOfficialHistorySummary("明年，立为皇后。", "灵帝立宋氏为皇后"), "灵帝立宋氏为皇后。");
});

test("event type follows the normalized action instead of a noisy candidate classifier", () => {
  assert.equal(eventTypeForOfficialHistory("diplomacy", "曹仁讨关羽于樊"), "war");
  assert.equal(eventTypeForOfficialHistory("military", "汉遣使来朝"), "diplomacy");
});

test("actor and commentary checks reject context fragments", () => {
  const sunJian = { name: "孙坚", names: new Set(["孙坚"]) };
  const liuBiao = { name: "刘表", names: new Set(["刘表"]) };
  assert.equal(titleHasNamedActor("术遣孙坚击刘表于襄阳", [sunJian, liuBiao]), false);
  assert.equal(titleHasNamedActor("阎磐取伊吾卢", [{ name: "阎磐", names: new Set(["阎磐"]) }]), true);
  assert.equal(titleHasNamedActor("窦宪出征匈奴", [{ name: "窦宪", names: new Set(["窦宪"]) }]), true);
  assert.equal(titleHasNamedActor("汉成帝去世", [{ name: "刘骜", names: new Set(["刘骜", "汉成帝"]) }]), true);
  assert.equal(titleHasNamedActor("王莽封赏南阳有功吏民", [{ name: "王莽", names: new Set(["王莽"]) }]), true);
  assert.equal(titleHasNamedActor("王甫构陷刘悝谋反案", [{ name: "王甫", names: new Set(["王甫"]) }]), true);
  assert.equal(titleHasNamedActor("段颎捕系太学诸生千余人", [{ name: "段颎", names: new Set(["段颎"]) }]), true);
  assert.equal(titleHasNamedActor("汉灵帝处死曹鸾", [{ name: "汉灵帝", names: new Set(["汉灵帝"]) }]), true);
  assert.equal(titleHasNamedActor("莽何罗与马通谋反", [{ name: "莽何罗", names: new Set(["莽何罗"]) }]), true);
  assert.equal(titleHasNamedGrantRecipient("立刘弗陵为皇太子", [{ name: "刘弗陵", names: new Set(["刘弗陵"]) }]), true);
  assert.equal(canPromoteWithoutNamedParticipant("焉耆叛杀都护但钦"), true);
  assert.equal(canPromoteWithoutNamedParticipant("大司马改置官制"), false);
  assert.deepEqual(
    officialHistoryRoleAuditReasons("王莽受封安汉公", "群臣奏言大司马莽功德比周公，赐号安汉公。", [
      { name: "王莽", names: new Set(["王莽", "莽"]) },
    ]),
    [],
  );
  assert.equal(isOfficialHistoryCommentaryText("王巡出雲中，王嘉出代郡。"), false);
  assert.equal(isOfficialHistoryCommentaryText("师古云：此为注文。"), true);
  assert.equal(titleHasNamedGrantRecipient("绍封刘侧为常山王", [{ name: "刘侧", names: new Set(["刘侧"]) }]), true);
  assert.deepEqual(
    officialHistoryRoleAuditReasons(
      "复封刘无忌为齐王",
      "永元二年，乃复封无忌为齐王，是为惠王。",
      [{ name: "刘无忌", names: new Set(["刘无忌", "无忌"]) }],
    ),
    [],
  );
  assert.equal(
    canonicalizeOfficialHistoryGrantTitle(
      "和帝封刘睦庶子斟乡侯刘威为北海王",
      [
        { name: "刘睦", names: new Set(["刘睦", "睦"]) },
        { name: "刘威", names: new Set(["刘威", "威"]) },
      ],
    ),
    "封刘威为北海王",
  );
  assert.equal(
    canonicalizeOfficialHistoryGrantTitle(
      "绍封刘晃子无忌为齐王",
      [
        { name: "刘晃", names: new Set(["刘晃", "晃"]) },
        { name: "刘无忌", names: new Set(["刘无忌", "无忌"]) },
      ],
    ),
    "绍封刘无忌为齐王",
  );
  assert.equal(
    canonicalizeOfficialHistoryGrantTitle(
      "封刘党子巡为乐成王",
      [
        { name: "刘党", names: new Set(["刘党", "党"]) },
        { name: "刘巡", names: new Set(["刘巡", "巡"]) },
      ],
    ),
    "封刘巡为乐成王",
  );
  assert.equal(
    canonicalizeOfficialHistoryGrantTitle(
      "绍刘侧为常山王",
      [{ name: "刘侧", names: new Set(["刘侧"]) }],
    ),
    "绍封刘侧为常山王",
  );
  assert.equal(isOfficialHistoryCommentaryText("【九州春秋曰：建安六年，刘表攻西鄂。"), true);
  assert.equal(isOfficialHistoryCommentaryText("《古今注》曰：建武十八年，使中郎将耿遵筑城。"), true);
  assert.equal(isOfficialHistoryCommentaryText("建武六年日食，《续汉志》曰：日有食之。"), true);
  assert.equal(isOfficialHistoryCommentaryText("永兴元年，李雄僣号成都王，下令曰：大赦境内。"), false);
  assert.deepEqual(
    officialHistoryRoleAuditReasons(
      "冯柱斩右温禺犊王",
      "行度辽将军庞奋、越骑校尉冯柱追讨之，斩右温禺犊王。",
      [
        { name: "庞奋", names: new Set(["庞奋"]) },
        { name: "冯柱", names: new Set(["冯柱"]) },
      ],
    ),
    ["partial-coordinated-actor"],
  );
  const wangJun = { name: "王濬", names: new Set(["王濬"]) };
  const pollutedWangJun = { name: "王濬请", names: new Set(["王濬请"]) };
  assert.deepEqual(
    officialHistoryRoleAuditReasons("王濬请降", "皓奉书於司马伷、王浑、王濬请降。", [wangJun, pollutedWangJun]),
    ["surrender-recipient-as-actor"],
  );
  const caoQian = { name: "曹谦", names: new Set(["曹谦"]) };
  assert.deepEqual(
    officialHistoryRoleAuditReasons("巴郡板楯蛮诣太守曹谦降", "巴郡板楯蛮诣太守曹谦降。", [caoQian]),
    ["surrender-recipient-as-actor"],
  );
  assert.deepEqual(
    officialHistoryRoleAuditReasons("巴郡板楯蛮向曹谦投降", "巴郡板楯蛮诣太守曹谦降。", [caoQian]),
    [],
  );
  const zhangYing = { name: "张婴", names: new Set(["张婴"]) };
  const zhangGang = { name: "张纲", names: new Set(["张纲"]) };
  assert.deepEqual(
    officialHistoryRoleAuditReasons("广陵贼张婴等诣太守张纲降", "广陵贼张婴等诣太守张纲降。", [zhangYing, zhangGang]),
    [],
  );
  const dengSui = { name: "邓绥", names: new Set(["邓绥", "邓太后"]) };
  assert.deepEqual(
    officialHistoryRoleAuditReasons("邓太后绍封茂孙奉为安乐亭侯", "邓太后绍封茂孙奉为安乐亭侯。", [dengSui]),
    ["unresolved-grant-recipient"],
  );
  const liuYi = { name: "刘翼", names: new Set(["刘翼", "翼"]) };
  assert.deepEqual(
    officialHistoryRoleAuditReasons("邓太后封刘翼为平原王", "邓太后封刘翼为平原王。", [dengSui, liuYi]),
    [],
  );
});

test("reviewed events are immutable to machine regeneration", () => {
  assert.equal(isMachineMutableReviewStatus("needs-review"), true);
  assert.equal(isMachineMutableReviewStatus("draft"), true);
  assert.equal(isMachineMutableReviewStatus("reviewed"), false);
  assert.equal(isMachineMutableReviewStatus("approved"), false);
});

test("cluster matches reuse official-history events only inside the same profile window", () => {
  const event = {
    id: "official-history-event:existing",
    region_id: "china",
    time_start: 78,
    time_end: 78,
    review_status: "needs-review",
    raw_json: JSON.stringify({ profileId: "china-eastern-han-25-183-v1" }),
  };
  assert.equal(isCompatibleClusterMatchedEvent(event, {
    profileId: "china-eastern-han-25-183-v1",
    regionId: "china",
    year: 78,
  }), true);
  assert.equal(isCompatibleClusterMatchedEvent(event, {
    profileId: "china-official-history-v1",
    regionId: "china",
    year: 78,
  }), false);
  assert.equal(isCompatibleClusterMatchedEvent(event, {
    profileId: "china-official-history-v1",
    regionId: "china",
    year: 78,
    allowCrossProfileMachineEvent: true,
  }), true);
  assert.equal(isCompatibleClusterMatchedEvent(event, {
    profileId: "china-eastern-han-25-183-v1",
    regionId: "china",
    year: 79,
  }), false);
  assert.equal(isCompatibleClusterMatchedEvent(event, {
    profileId: "china-eastern-han-25-183-v1",
    regionId: "china",
    year: 79,
    allowMachineChronologyCorrection: true,
  }), true);
  assert.equal(isCompatibleClusterMatchedEvent({ ...event, review_status: "reviewed" }, {
    profileId: "china-eastern-han-25-183-v1",
    regionId: "china",
    year: 79,
    allowMachineChronologyCorrection: true,
  }), false);
  assert.equal(isCompatibleClusterMatchedEvent({ ...event, time_start: 94, time_end: 95 }, {
    profileId: "china-eastern-han-25-183-v1",
    regionId: "china",
    year: 94,
    endYear: 95,
  }), true);
});

test("narrow promotion batches never trigger profile-wide stale cleanup implicitly", () => {
  assert.equal(shouldCleanupEntirePromotionProfile({ requestedBatchIds: ["narrow-batch"] }), false);
  assert.equal(shouldCleanupEntirePromotionProfile({ requestedBatchIds: [] }), true);
  assert.equal(
    shouldCleanupEntirePromotionProfile({ requestedBatchIds: ["full-profile-batch"], cleanupProfile: true }),
    true,
  );
});

test("auditable event time accepts only exact years or high-confidence editorial ranges", () => {
  assert.equal(isResolvedPromotionEventTime({
    time_start: 94,
    time_end: 95,
    time_precision: "range",
    raw_json: JSON.stringify({
      timeResolution: [{
        start: 94,
        end: 95,
        precision: "range",
        method: "editorial-chronology",
        confidence: "high",
      }],
    }),
  }), true);
  assert.equal(isResolvedPromotionEventTime({
    time_start: 94,
    time_end: 95,
    time_precision: "range",
    raw_json: JSON.stringify({
      timeResolution: [{
        start: 94,
        end: 95,
        precision: "range",
        method: "source-range",
        confidence: "high",
      }],
    }),
  }), false);
  assert.equal(isResolvedPromotionEventTime({
    time_start: 105,
    time_end: 105,
    time_precision: "year",
  }), true);
});

test("incremental cleanup removes only mutable stale events fully owned by requested batches", () => {
  const event = {
    id: "official-history-event:stale",
    review_status: "needs-review",
    raw_json: JSON.stringify({ generator: "promotion:eastern-han" }),
  };
  const base = {
    event,
    generatorId: "promotion:eastern-han",
    requestedBatchIds: ["batch-89-105"],
    eventBatchIds: ["batch-89-105"],
  };
  assert.equal(isStaleMachineEventOwnedByRequestedBatches(base), true);
  assert.equal(isStaleMachineEventOwnedByRequestedBatches({
    ...base,
    eventBatchIds: ["batch-89-105", "batch-106-125"],
  }), false);
  assert.equal(isStaleMachineEventOwnedByRequestedBatches({ ...base, activeEventIds: [event.id] }), false);
  assert.equal(isStaleMachineEventOwnedByRequestedBatches({ ...base, hasUnownedData: true }), false);
  assert.equal(isStaleMachineEventOwnedByRequestedBatches({
    ...base,
    event: { ...event, review_status: "reviewed" },
  }), false);
});

test("owned promotion data is replaced only when the requested batches fully own the event", () => {
  const base = {
    requestedBatchIds: ["batch-145-168"],
    proposalOwnsExistingEvent: true,
    isGeneratedEvent: true,
  };
  assert.equal(shouldReplaceOwnedPromotionData({
    ...base,
    existingBatchIds: ["batch-145-168"],
  }), true);
  assert.equal(shouldReplaceOwnedPromotionData({
    ...base,
    existingBatchIds: ["batch-126-144", "batch-145-168"],
  }), false);
  assert.equal(shouldReplaceOwnedPromotionData({
    ...base,
    existingBatchIds: [],
  }), false);
  assert.equal(shouldReplaceOwnedPromotionData({
    ...base,
    existingBatchIds: ["batch-126-144"],
    cleanupEntireProfile: true,
  }), true);
  assert.equal(shouldReplaceOwnedPromotionData({
    ...base,
    existingBatchIds: ["batch-145-168"],
    proposalOwnsExistingEvent: false,
  }), false);
});

test("editorial event matches override stale generated provenance links", () => {
  assert.deepEqual(selectPromotionProvenanceMatch({
    editorialMatchedEventIds: ["official-history-event:correct"],
    linkedEventIds: ["official-history-event:stale"],
  }), {
    eventId: "official-history-event:correct",
    matchType: "editorial-matched-event",
  });
  assert.deepEqual(selectPromotionProvenanceMatch({
    linkedEventIds: ["official-history-event:existing"],
  }), {
    eventId: "official-history-event:existing",
    matchType: "existing-provenance",
  });
});

test("only fully superseded mutable machine events are removed after editorial rematching", () => {
  const event = {
    id: "official-history-event:stale",
    review_status: "needs-review",
    raw_json: JSON.stringify({ generator: "promotion:eastern-han" }),
  };
  assert.equal(isFullySupersededMachineEvent({
    event,
    generatorId: "promotion:eastern-han",
    linkedCardIds: ["legacy-card"],
    redirectedCardIds: ["legacy-card"],
  }), true);
  assert.equal(isFullySupersededMachineEvent({
    event,
    generatorId: "promotion:eastern-han",
    linkedCardIds: ["legacy-card", "other-card"],
    redirectedCardIds: ["legacy-card"],
  }), false);
  assert.equal(isFullySupersededMachineEvent({
    event: { ...event, review_status: "reviewed" },
    generatorId: "promotion:eastern-han",
    linkedCardIds: ["legacy-card"],
    redirectedCardIds: ["legacy-card"],
  }), false);
  assert.equal(isFullySupersededMachineEvent({
    event,
    generatorId: "promotion:eastern-han",
    linkedCardIds: ["legacy-card"],
    redirectedCardIds: ["legacy-card"],
    activeEventIds: [event.id],
  }), false);
});

test("promotion provenance records only batches that contribute cards to the event", () => {
  assert.deepEqual(promotionBatchIdsForCards([
    { batch_id: "batch-145-168" },
    { batch_id: "batch-145-168" },
    { batch_id: "batch-126-144" },
    {},
  ]), ["batch-145-168", "batch-126-144"]);
});

test("legacy promotion ownership is reconstructed from persisted card links", () => {
  assert.deepEqual(mergePromotionProvenanceSnapshot({
    cardIds: ["legacy-card"],
  }, [
    { card_id: "legacy-card", batch_id: "legacy-batch" },
    { card_id: "period-card", batch_id: "period-batch" },
  ]), {
    batchIds: ["legacy-batch", "period-batch"],
    cardIds: ["legacy-card", "period-card"],
  });
});

test("same-run promotion evidence merges without replacing the stable event anchor", () => {
  const merged = mergePromotionGenerationRaw({
    anchorCardId: "anchor-card",
    promotionIdentity: "anchor-identity",
    titleZh: "锚点事件",
    summary: "锚点原文。",
    category: "military",
    confidence: 0.92,
    locationName: "云中",
    primaryPlaceEntityId: "place:yunzhong",
    batchIds: ["batch-a"],
    cardIds: ["anchor-card"],
    people: ["张奂"],
    personIds: ["eh-zhang-huan"],
    places: ["云中"],
    placeIds: ["china-place-yunzhong"],
    placeEntityIds: ["place:yunzhong"],
    sourceRefs: [{ cardId: "anchor-card", sourceId: "source-a", locator: "卷一" }],
  }, {
    anchorCardId: "variant-card",
    promotionIdentity: "variant-identity",
    titleZh: "异文标题",
    summary: "异文原文。",
    category: "military",
    confidence: 0.85,
    locationName: null,
    primaryPlaceEntityId: null,
    batchIds: ["batch-a"],
    cardIds: ["variant-card"],
    people: ["岸尾"],
    personIds: ["eh-anwei-qiang"],
    places: [],
    placeIds: [],
    placeEntityIds: [],
    sourceRefs: [{ cardId: "variant-card", sourceId: "source-b", locator: "卷二" }],
  });
  assert.equal(merged.anchorCardId, "anchor-card");
  assert.equal(merged.titleZh, "锚点事件");
  assert.equal(merged.summary, "锚点原文。");
  assert.equal(merged.primaryPlaceEntityId, "place:yunzhong");
  assert.deepEqual(merged.cardIds, ["anchor-card", "variant-card"]);
  assert.deepEqual(merged.personIds, ["eh-zhang-huan", "eh-anwei-qiang"]);
  assert.equal(merged.evidenceCount, 2);
  assert.equal(merged.sourceCount, 2);
  assert.equal(merged.personCount, 2);
  assert.equal(merged.placeCount, 1);
});

test("editorial matches may replace stale machine display fields without changing the stable anchor", () => {
  const merged = mergePromotionGenerationRaw({
    anchorCardId: "legacy-card",
    promotionIdentity: "legacy-identity",
    titleZh: "刘纳谋诛宦者",
    summary: "旧机器摘要。",
    cardIds: ["legacy-card"],
  }, {
    anchorCardId: "reviewed-card",
    promotionIdentity: "reviewed-identity",
    titleZh: "刘郃等谋诛宦官失败",
    summary: "新审核摘要。",
    cardIds: ["reviewed-card"],
  }, { preferIncomingEditorialFields: true });
  assert.equal(merged.anchorCardId, "legacy-card");
  assert.equal(merged.promotionIdentity, "legacy-identity");
  assert.equal(merged.titleZh, "刘郃等谋诛宦官失败");
  assert.equal(merged.summary, "新审核摘要。");
  assert.deepEqual(merged.cardIds, ["legacy-card", "reviewed-card"]);
});

test("role-anchored names discover secondary people without guessing generic nouns", () => {
  const people = extractExplicitOfficialHistoryPeople(
    "黄武元年春正月，陆逊部将军宋谦等攻蜀五屯，皆破之。",
    ["陆逊"],
    { contextKey: "sanguozhi-wu" },
  );
  assert.deepEqual(people.map((person) => person.name), ["宋谦"]);
  assert.deepEqual(extractExplicitOfficialHistoryPeople("将军率众攻城。"), []);
  const homonym = extractExplicitOfficialHistoryPeople(
    "京兆虎牙都尉宋谦坐赃，下狱死。",
    [],
    { contextKey: "houhanshu-treatise" },
  );
  assert.notEqual(people[0].id, homonym[0].id);
  const jinPrince = extractExplicitOfficialHistoryPeople(
    "永宁元年，赵王伦篡位。",
    [],
    { contextKey: "jinshu-guoxue123-053" },
  );
  assert.equal(jinPrince[0].name, "司马伦");
  assert.equal(jinPrince[0].matched, "赵王伦");
  const hanPrince = extractExplicitOfficialHistoryPeople(
    "沛献王辅，建武十五年封右翊公。",
    [],
    { contextKey: "houhanshu-guoxue123-042" },
  );
  assert.equal(hanPrince[0].name, "刘辅");
  assert.equal(hanPrince[0].matched, "沛献王辅");
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "中常侍侯览讽有司奏前司空虞放、太仆杜密、长乐少府李膺、颍川太守巴肃、沛相荀昱、河内太守魏朗、山阳太守翟超皆为钩党，下狱。",
      [],
      { contextKey: "houhanshu-guoxue123-009" },
    ).map((person) => person.name),
    ["侯览", "虞放", "杜密", "李膺", "荀昱", "巴肃", "魏朗", "翟超"],
  );
  assert.equal(
    extractExplicitOfficialHistoryPeople(
      "冬十月，渤海王悝被诬谋反，丁亥，悝及妻子皆自杀。",
      [],
      { contextKey: "houhanshu-guoxue123-009" },
    )[0].name,
    "刘悝",
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "辛巳，中常侍王甫及太尉段颎并下狱死。",
      ["段颎"],
      { contextKey: "houhanshu-guoxue123-009" },
    ).map((person) => person.name),
    ["王甫"],
  );
  assert.equal(
    extractExplicitOfficialHistoryPeople(
      "二十年，中山王辅复徙封沛王。",
      [],
      { contextKey: "houhanshu-guoxue123-010" },
    )[0].name,
    "刘辅",
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "夏六月甲寅，废皇太子庆为清河王，立皇子肇为皇太子。",
      [],
      { contextKey: "houhanshu-guoxue123-003" },
    ).map((person) => person.name).sort(),
    ["刘庆", "刘肇"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "夏五月，封故广陵王荆子元寿为广陵侯。",
      [],
      { contextKey: "houhanshu-guoxue123-002" },
    ).map((person) => person.name).sort(),
    ["刘元寿", "刘荆"],
  );
  assert.equal(
    extractExplicitOfficialHistoryPeople(
      "十二月，护羌校尉窦林下狱死。",
      [],
      { contextKey: "houhanshu-guoxue123-002" },
    )[0].name,
    "窦林",
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "永平十六年，窦固、祭肜、耿秉、来苗等四道出击匈奴。",
      [],
      { contextKey: "houhanshu-guoxue123-089" },
    ).map((person) => person.name).sort(),
    ["来苗", "祭肜", "窦固", "耿秉"].sort(),
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "己未，遣副校尉阎磐讨北匈奴。",
      [],
      { contextKey: "houhanshu-guoxue123-004" },
    ).map((person) => person.name),
    ["阎磐"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "溇中、澧中蛮潭戎等反。",
      [],
      { contextKey: "houhanshu-guoxue123-086" },
    ).map((person) => person.name),
    ["潭戎"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "北匈奴右谷蠡王於除鞬自立为单于，款塞乞降。",
      [],
      { contextKey: "houhanshu-guoxue123-004" },
    ).map((person) => person.name),
    ["于除鞬"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "南单于安国从弟子逢侯率叛胡亡出塞。",
      [],
      { contextKey: "houhanshu-guoxue123-004" },
    ).map((person) => person.name),
    ["逢侯"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "郡徼外敦忍乙王莫延慕义，遣使译献犀牛、大象。",
      [],
      { contextKey: "houhanshu-guoxue123-086" },
    ).map((person) => person.name),
    ["莫延"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "辛卯，封皇弟万岁为广宗王。",
      [],
      { contextKey: "houhanshu-guoxue123-004" },
    ).map((person) => person.name),
    ["刘万岁"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "夏四月壬子，封阜陵王种兄鲂为阜陵王。",
      [],
      { contextKey: "houhanshu-guoxue123-004" },
    ).map((person) => person.name).sort(),
    ["刘种", "刘鲂"].sort(),
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "永元二年，和帝封睦庶子斟乡侯威为北海王。",
      [],
      { contextKey: "houhanshu-guoxue123-014" },
    ).map((person) => person.name).sort(),
    ["刘威", "刘睦"].sort(),
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "丙辰，封皇弟寿为济北王，开为河闲王，淑为城阳王。",
      [],
      { contextKey: "houhanshu-guoxue123-004" },
    ).map((person) => person.name).sort(),
    ["刘寿", "刘开", "刘淑"].sort(),
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "行车骑将军邓鸿、度辽将军朱徽、中郎将杜崇皆下狱死。",
      [],
      { contextKey: "houhanshu-guoxue123-004" },
    ).map((person) => person.name).sort(),
    ["邓鸿", "朱徽", "杜崇"].sort(),
  );
  assert.equal(
    extractExplicitOfficialHistoryPeople(
      "遂斩焉耆、尉黎二王首，传送京师。",
      [],
      { contextKey: "houhanshu-guoxue123-088" },
    ).some((person) => person.name === "刘首"),
    false,
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "夏四月辛酉，封皇子建为千乘王。",
      [],
      { contextKey: "houhanshu-guoxue123-002" },
    ).map((person) => person.name),
    ["刘建"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "永平元年，封苍子二人为县侯。",
      [],
      { contextKey: "houhanshu-guoxue123-047" },
    ).map((person) => person.name),
    [],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "永平元年，特封英舅子许昌为龙舒侯。",
      [],
      { contextKey: "houhanshu-guoxue123-047" },
    ).map((person) => person.name),
    [],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "肃宗建初元年，武陵澧中蛮陈从等反叛。",
      [],
      { contextKey: "houhanshu-guoxue123-095" },
    ).map((person) => person.name),
    ["陈从"],
  );
  assert.deepEqual(officialHistoryProvisionalPersonNameAuditReasons("刘二人"), ["collective-or-action-tail"]);
  assert.deepEqual(officialHistoryProvisionalPersonNameAuditReasons("刘英舅"), ["kinship-title-tail"]);
  assert.deepEqual(officialHistoryProvisionalPersonNameAuditReasons("陈从等反"), ["collective-or-action-tail"]);
  assert.deepEqual(officialHistoryProvisionalPersonNameAuditReasons("刘薨"), ["collective-or-action-tail"]);
  assert.deepEqual(officialHistoryProvisionalPersonNameAuditReasons("刘夭没"), ["collective-or-action-tail"]);
  assert.deepEqual(officialHistoryProvisionalPersonNameAuditReasons("刘遣"), ["collective-or-action-tail"]);
  assert.deepEqual(officialHistoryProvisionalPersonNameAuditReasons("及旄牛豪"), ["collective-or-action-tail"]);
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "建武八年，高句骊遣使朝贡，光武复其王号。",
      [],
      { contextKey: "houhanshu-guoxue123-085" },
    ).map((person) => person.name),
    [],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "帝崩，长子平原王有疾，而诸皇子夭没。",
      [],
      { contextKey: "houhanshu-guoxue123-011" },
    ).map((person) => person.name),
    [],
  );
  assert.equal(
    extractExplicitOfficialHistoryPeople(
      "偏将军王霸，骑都尉刘隆，共击檀乡贼。",
      [],
      { contextKey: "houhanshu-guoxue123-018" },
    ).some((person) => person.name === "刘霸"),
    false,
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "永平元年，诛太傅杨骏。",
      [],
      { contextKey: "jinshu-guoxue123-004" },
    ).map((person) => person.name),
    ["杨骏"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople(
      "十一月壬寅，大司马陈骞薨。",
      [],
      { contextKey: "jinshu-guoxue123-003" },
    ).map((person) => person.name),
    ["陈骞"],
  );
  assert.equal(
    isJinPrincelyTitlePersonOverlap("三月丙申，安平王敦薨。", { name: "王敦", alias: "王敦" }),
    true,
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("秋八月，郝散帅众降。", [], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["郝散"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("王浚遣将讨柏根。", [], { contextKey: "jinshu-annal" })
      .map((person) => person.name).sort(),
    ["柏根", "王浚"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("沈举举兵攻长安。", [], { contextKey: "jinshu-annal" }),
    [],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("马隆西伐。", [], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["马隆"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("南阳王模使其将淳于定破刘芒荡。", [], { contextKey: "jinshu-annal" })
      .map((person) => person.name).sort(),
    ["刘芒荡", "司马模", "淳于定"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("河内人乐仰执太守裴整叛。", [], { contextKey: "jinshu-annal" })
      .map((person) => person.name).sort(),
    ["乐仰", "裴整"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("刘聪从弟曜及其将石勒围怀。", ["刘聪", "石勒"], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["刘曜"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("严询败鲜卑慕容廆于昌黎。", ["严询"], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["慕容廆"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("和弟聪杀和而自立。", [], { contextKey: "jinshu-annal" }),
    [],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("安北将军王浚遣乌丸骑攻邺。", [], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["王浚"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("祁弘破刘元海将刘灵曜于广宗。", ["祁弘"], { contextKey: "jinshu-annal" })
      .map((person) => person.name).sort(),
    ["刘渊", "刘灵曜"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("贾疋讨贼张连。", ["贾疋"], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["张连"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("周处等讨万年。", ["周处"], { contextKey: "jinshu-annal" }),
    [{
      id: extractExplicitOfficialHistoryPeople("周处等讨万年。", ["周处"], { contextKey: "jinshu-annal" })[0].id,
      name: "齐万年",
      matched: "万年",
      evidence: "jin-contextual-person",
      confidence: "high",
      provisional: true,
      contextKey: "jinshu-annal",
    }],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("解系为度元所破。", ["解系"], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["郝度元"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("河间王颙遣将衙博击李特于蜀。", ["李特"], { contextKey: "jinshu-annal" })
      .map((person) => person.name).sort(),
    ["司马颙", "衙博"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("王浚遣别将王申始讨勒于汶石津。", ["王浚"], { contextKey: "jinshu-annal" })
      .map((person) => person.name).sort(),
    ["王申始", "石勒"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("东莱太守庞伉并遇害。", [], { contextKey: "jinshu-annal" })
      .map((person) => person.name),
    ["庞伉"],
  );
  assert.deepEqual(
    extractExplicitOfficialHistoryPeople("陶侃讨杜弢党杜曾于石城。", ["陶侃"], { contextKey: "jinshu-annal" })
      .map((person) => person.name).sort(),
    ["杜弢", "杜曾"],
  );
});

test("Eastern Han title and ethnic patterns do not turn action text into people", () => {
  const names = (text) => extractExplicitOfficialHistoryPeople(
    text,
    [],
    { contextKey: "houhanshu-guoxue123-006" },
  ).map((person) => person.name);
  assert.equal(names("延平元年，清河王薨。").includes("刘薨"), false);
  assert.equal(names("夫余王遣子与州郡并力讨破之。").includes("刘遣"), false);
  assert.equal(names("越巂蛮夷及旄牛豪叛，杀长吏。").includes("及旄牛豪"), false);
  assert.equal(names("徐由遣疏勒王臣槃发兵击于窴。").includes("于窴"), false);
  assert.equal(names("蔡伯流寇广陵，杀江都长。").includes("江都长"), false);
  assert.equal(names("马贤击破之，羌遂相招而叛。").includes("遂相招而"), false);
  assert.deepEqual(
    names("至建武二十三年，南郡潳山蛮雷迁等始反叛，潳音屠。"),
    ["雷迁"],
  );
});

test("Eastern Han place references cover the An-reign event slice", () => {
  const matches = findPlaceMentions(
    "乌桓寇代郡、上谷、涿郡；班勇屯伊吾，后击军就。",
    chinaPlaceReferenceEasternHan25184,
  );
  assert.deepEqual(matches.map((place) => place.label), ["代郡", "上谷", "涿郡", "伊吾卢"]);
});

test("Eastern Han place references bind the 89-105 annal additions conservatively", () => {
  assert.deepEqual(
    findPlaceMentions(
      "耿夔围北单于于金微山；和帝崩于章德前殿。",
      chinaPlaceReferenceEasternHan25184,
    ).map((place) => place.label),
    ["金微山", "章德前殿"],
  );
  const refs = chinaPlaceReferenceEasternHan25184.filter((place) => ["金微山", "章德前殿"].includes(place.label));
  assert.equal(refs.every((place) => place.mapFeatureNames.length === 0), true);
});

test("Eastern Han place references cover the Shun-reign event slice", () => {
  const matches = findPlaceMentions(
    "海贼寇会稽，蔡伯流寇九江及广陵，西羌围安定，赵冲战于射姑山。",
    chinaPlaceReferenceEasternHan25184,
  );
  assert.deepEqual(matches.map((place) => place.label), ["会稽", "九江", "广陵", "安定", "射姑山"]);
});

test("Eastern Han place references cover the Zhi-Huan-Ling transition slice", () => {
  const labels = new Set(chinaPlaceReferenceEasternHan25184.map((place) => place.label));
  for (const label of [
    "广汉属国", "蒲类海", "益阳", "蜀郡属国", "九真", "居风", "长沙", "零陵",
    "关中", "祋祤", "云阳", "鸾鸟", "济南国", "夫余", "疏勒",
  ]) {
    assert.equal(labels.has(label), true, `missing Eastern Han place reference: ${label}`);
  }
  assert.deepEqual(
    findPlaceMentions(
      "刘广无后济南国除；夫余遣使朝贺；和得在疏勒射杀臣槃并自立为王。",
      chinaPlaceReferenceEasternHan25184,
    ).map((place) => place.label),
    ["济南国", "夫余", "疏勒"],
  );
});

test("profile-wide provisional person merging preserves scoped identities", () => {
  const profileId = "china-eastern-han-25-183-v1";
  const generic = {
    id: provisionalOfficialHistoryPersonId("刘焉", "houhanshu-passage"),
    name: "刘焉",
    provisional: true,
    via: "action-actor",
  };
  assert.equal(
    canonicalProvisionalOfficialHistoryPersonId(generic, {
      profileId,
      mergeByName: true,
      scopedEvidence: ["eastern-han-princely-title"],
    }),
    provisionalOfficialHistoryPersonId("刘焉", `promotion-profile:${profileId}`),
  );
  const prince = {
    ...generic,
    id: provisionalOfficialHistoryPersonId("刘焉", "eastern-han-princely-title"),
    via: "eastern-han-princely-title",
  };
  assert.equal(
    canonicalProvisionalOfficialHistoryPersonId(prince, {
      profileId,
      mergeByName: true,
      scopedEvidence: ["eastern-han-princely-title"],
    }),
    prince.id,
  );
});

test("Eastern Han action boundaries and collective nouns do not become people", () => {
  const names = (sentence) => extractExplicitOfficialHistoryPeople(
    sentence,
    [],
    { contextKey: "houhanshu-annal" },
  ).map((person) => person.name).sort();

  assert.deepEqual(names("先零羌寇益州，遣中郎将尹就讨之。"), ["尹就"]);
  assert.deepEqual(names("任尚遣兵击破先零羌于北地。"), ["任尚"]);
  assert.deepEqual(names("辽东太守蔡讽追击高句骊。"), ["蔡讽"]);
  assert.deepEqual(names("中郎将陈龟迫杀南单于。"), ["陈龟"]);
  assert.deepEqual(names("中郎将张耽大破乌桓。"), ["张耽"]);
  assert.deepEqual(names("余众悉降。"), []);
  assert.deepEqual(names("杨、徐盗贼并起。"), []);
  assert.deepEqual(names("沈氐种羌反叛。"), []);
  assert.deepEqual(names("高句骊寇辽东。"), []);
  assert.deepEqual(names("辛卯，朱鲔举城降。"), ["朱鲔"]);
  assert.deepEqual(names("河西大将军窦融始遣使贡献。"), ["窦融"]);
  assert.deepEqual(names("张步斩苏茂以降。"), ["张步", "苏茂"]);
  assert.deepEqual(names("越巂太守任贵谋叛。"), ["任贵"]);
  assert.deepEqual(names("大将军窦宪被诛。"), ["窦宪"]);
  assert.deepEqual(names("护羌校尉张纡诱诛烧当羌迷吾等。"), ["张纡"]);
  assert.deepEqual(names("安国卒见杀。"), ["安国"]);
  assert.deepEqual(names("下邳人谢安应募击徐凤等。"), ["徐凤", "谢安"]);
  assert.deepEqual(names("武陵太守应奉招诱叛蛮。"), ["应奉"]);
  assert.deepEqual(names("步兵校尉刘纳谋诛宦者。"), ["刘纳"]);
  assert.deepEqual(names("大司徒邓禹西击赤眉。"), ["邓禹"]);
  assert.deepEqual(names("卫尉阳球谋诛宦者。"), ["阳球"]);
  assert.deepEqual(names("司隶校尉阳球奏诛王甫。"), ["王甫", "阳球"]);
  assert.deepEqual(names("刘盆子入关杀更始。"), []);
  assert.deepEqual(names("江夏蛮叛，州郡讨平之。"), []);
  assert.deepEqual(names("灵帝熹平五年，诸夷反叛。"), []);
  assert.deepEqual(names("及郭皇后废，建武十七年废。"), ["郭圣通"]);
  assert.deepEqual(names("蔡伯流等率众诣徐州刺史应志降。"), ["应志", "蔡伯流"]);
  assert.deepEqual(names("广陵贼张婴等诣太守张纲降。"), ["张婴", "张纲"]);
});

test("biography sequence context resolves single-character subject abbreviations", () => {
  const resolver = createOfficialHistoryPersonSequenceResolver();
  const context = {
    source: { id: "jinshu-guoxue123-121" },
    section: { type: "record", label: "载记" },
    currentPeople: [],
  };
  assert.deepEqual(resolver.resolve("李雄，字仲俊，特第三子也。", context), []);
  const inferred = resolver.resolve("诸将固请雄即尊位，以永兴元年僣称成都王。", context);
  assert.equal(inferred.length, 1);
  assert.equal(inferred[0].name, "李雄");
  assert.equal(inferred[0].matched, "雄");
  assert.equal(inferred[0].evidence, "source-person-context");
});

test("biography sequence context resets when a new biography subject begins", () => {
  const resolver = createOfficialHistoryPersonSequenceResolver();
  const context = {
    source: { id: "houhanshu-guoxue123-085" },
    section: { type: "biography", label: "列传" },
    currentPeople: [],
  };
  resolver.resolve("袁绍，字本初。", context);
  resolver.observe([{ id: "yuan-shao", name: "袁绍" }], context);
  resolver.resolve("郑众字季产，南阳犨人也。", context);
  assert.deepEqual(
    resolver.resolve("桓帝延熹二年，绍封众曾孙石仇为关内侯。", context),
    [],
  );
});

test("Eastern Han grammatical fragments are rejected as provisional people", () => {
  const names = (value) => extractExplicitOfficialHistoryPeople(
    value,
    [],
    { contextKey: "houhanshu-biography" },
  ).map((person) => person.name);

  assert.deepEqual(names("零陵蛮贼复反应之。"), []);
  assert.deepEqual(names("颎复追击于鸾鸟，大破之。"), []);
  assert.deepEqual(names("疏勒王汉大都尉于猎中为其季父和得所射杀。"), []);
});

test("abbreviated person matching accepts titled names and rejects ruler pronouns", () => {
  assert.equal(hasOfficialHistoryAbbreviatedMention("群臣奏言大司馬莽功德比周公。", "莽"), true);
  assert.equal(hasOfficialHistoryAbbreviatedMention("綏和元年，上即位二十餘年無繼嗣。", "上"), false);
});

test("place resolution keeps event-title locations and ignores source context locations", () => {
  const places = [
    { id: "chang-an", entityId: "place:chang-an", label: "长安", aliases: ["長安"] },
    {
      id: "fan-cheng",
      entityId: "place:fan-cheng",
      label: "樊城",
      aliases: ["樊"],
      locativeOnlyAliases: ["樊"],
    },
  ];
  assert.deepEqual(
    findPlaceMentions("太祖在长安，使曹仁讨关羽于樊。", places).map((place) => place.id),
    ["chang-an", "fan-cheng"],
  );
  const selected = chooseOfficialHistoryEventPlaces("曹仁讨关羽于樊", places);
  assert.equal(selected.primaryPlace.id, "fan-cheng");
  assert.deepEqual(selected.places.map((place) => place.id), ["fan-cheng"]);
  const routePlaces = chooseOfficialHistoryEventPlaces("王莽遣十二将攻匈奴", [
    { id: "wuyuan", entityId: "place:wuyuan", label: "五原", aliases: [], via: "card_places", eventRole: "origin" },
    { id: "yunzhong", entityId: "place:yunzhong", label: "云中", aliases: [], via: "card_places", eventRole: "origin" },
  ]);
  assert.deepEqual(routePlaces.places.map((place) => place.id), ["wuyuan", "yunzhong"]);
  assert.equal(routePlaces.primaryPlace, null);
  const invasionPlaces = [
    { id: "buyeo", entityId: "place:buyeo", label: "夫余", aliases: [] },
    { id: "lelang", entityId: "place:lelang", label: "乐浪", aliases: [] },
    { id: "shu-commandery", entityId: "place:shu-commandery", label: "蜀郡", aliases: [] },
    { id: "canling", entityId: "place:canling", label: "蚕陵", aliases: [] },
  ];
  assert.equal(
    chooseOfficialHistoryEventPlaces("夫余军寇乐浪", invasionPlaces).primaryPlace.id,
    "lelang",
  );
  assert.equal(
    chooseOfficialHistoryEventPlaces("蜀郡夷攻蚕陵并杀县令", invasionPlaces).primaryPlace.id,
    "canling",
  );
  const westernPlaces = [
    { id: "chengdu", entityId: "place:chengdu", label: "成都", aliases: [] },
    { id: "ye", entityId: "place:ye", label: "邺城", aliases: ["邺"], locativeOnlyAliases: ["邺"] },
  ];
  assert.deepEqual(findPlaceMentions("成都王颖举兵", westernPlaces), []);
  assert.equal(findPlaceMentions("成都王颖兵败，据成都自守", westernPlaces)[0].index, 8);
  assert.equal(findPlaceMentions("石季龙攻邺三台", westernPlaces)[0].id, "ye");
  assert.deepEqual(
    findPlaceMentions("鲜卑寇幽、并二州", chinaPlaceReferenceEasternHan25184).map((place) => place.id),
    ["you-zhou", "bing-zhou"],
  );
});

test("place resolution prefers the longest overlapping historical place name", () => {
  const places = [
    { id: "guanghan", entityId: "place:guanghan", label: "广汉", aliases: [] },
    {
      id: "guanghan-dependent-state",
      entityId: "place:guanghan-dependent-state",
      label: "广汉属国",
      aliases: [],
    },
  ];
  assert.deepEqual(
    findPlaceMentions("白马羌寇广汉属国", places).map((place) => place.id),
    ["guanghan-dependent-state"],
  );
});
