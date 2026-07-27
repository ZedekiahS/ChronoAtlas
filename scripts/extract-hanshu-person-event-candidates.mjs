import { createOfficialHistoryExtractorConfig } from "./lib/china-official-history-candidate-configs.mjs";
import { runRuleBasedSourceCandidateExtractor } from "./lib/rule-based-source-candidate-extractor.mjs";

runRuleBasedSourceCandidateExtractor(createOfficialHistoryExtractorConfig({
  batchId: "auto-hanshu-person-event-candidates",
  candidatePrefix: "hanshu-auto-candidate",
  cardPrefix: "card:hanshu-auto",
  filePrefix: "hanshu-auto-file",
  workTitle: "汉书",
  quotedWork: "汉书",
  defaultAuthor: "班固",
  sourceWhereSql: "s.id LIKE 'hanshu-guoxue123-%' OR s.title LIKE '汉书·%' OR s.title LIKE '漢書%' OR s.citation_short LIKE '汉书 %' OR s.citation_short LIKE '漢書%'",
  sourceRoot: "sqlite:sources/source_passages:hanshu-guoxue123-%",
  corpusHint: "china-western-han",
  collectionHint: "hanshu-person-event-candidates",
  periodHint: "china-western-han",
  notes: "Rule-based full-pass extraction of Hanshu person/event candidates. Candidates are not reviewed facts and must be merged before promotion.",
  personRange: { startYear: -260, endYear: 25 },
  extraStopNameTokens: ["汉书", "漢書", "高帝", "惠帝", "文帝", "景帝", "武帝", "昭帝", "宣帝", "元帝", "成帝", "哀帝", "平帝", "王莽", "高后"],
  sectionRules: [
    { pattern: /纪|紀/u, type: "annal", label: "纪" },
    { pattern: /表/u, type: "table", label: "表" },
    { pattern: /志/u, type: "treatise", label: "志" },
    { pattern: /传|傳/u, type: "biography", label: "传" },
  ],
}));
