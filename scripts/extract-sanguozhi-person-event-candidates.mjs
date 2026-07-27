import { createOfficialHistoryExtractorConfig } from "./lib/china-official-history-candidate-configs.mjs";
import { runRuleBasedSourceCandidateExtractor } from "./lib/rule-based-source-candidate-extractor.mjs";

runRuleBasedSourceCandidateExtractor(createOfficialHistoryExtractorConfig({
  batchId: "auto-sanguozhi-person-event-candidates",
  candidatePrefix: "sanguozhi-auto-candidate",
  cardPrefix: "card:sanguozhi-auto",
  filePrefix: "sanguozhi-auto-file",
  workTitle: "三国志",
  quotedWork: "三国志",
  defaultAuthor: "陈寿",
  sourceWhereSql: "s.id LIKE 'sanguozhi%' OR s.title LIKE '%三国志%' OR s.citation_short LIKE '%三国志%'",
  sourceRoot: "sqlite:sources/source_passages:sanguozhi%",
  corpusHint: "china-three-kingdoms",
  collectionHint: "sanguozhi-person-event-candidates",
  periodHint: "china-three-kingdoms",
  notes: "Rule-based full-pass extraction of Sanguozhi person/event candidates. Candidates are not reviewed facts and must be merged before promotion.",
  personRange: { startYear: 150, endYear: 300 },
  commentaryAuthorForSentence: (sentence) => (sentence.includes("松之") ? "裴松之" : null),
  extraStopNameTokens: ["三国志", "魏书", "蜀书", "吴书", "先主", "后主", "太祖", "文帝", "明帝", "武帝", "献帝", "黄初", "建安", "青龙", "景初", "嘉平", "正始", "甘露", "景元", "咸熙", "赤乌", "黄武", "黄龙", "建兴", "延熙", "景耀", "炎兴"],
  sectionRules: [
    { pattern: /魏书/u, type: "wei-biography", label: "魏书" },
    { pattern: /蜀书/u, type: "shu-biography", label: "蜀书" },
    { pattern: /吴书/u, type: "wu-biography", label: "吴书" },
  ],
}));
