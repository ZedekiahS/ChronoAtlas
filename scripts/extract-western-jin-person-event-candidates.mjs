import { createJinshuExtractorConfig } from "./lib/china-official-history-candidate-configs.mjs";
import { runRuleBasedSourceCandidateExtractor } from "./lib/rule-based-source-candidate-extractor.mjs";

runRuleBasedSourceCandidateExtractor(createJinshuExtractorConfig({
  batchId: "auto-jinshu-western-jin-281-316-candidates",
  candidatePrefix: "jinshu-western-jin-auto-candidate",
  cardPrefix: "card:jinshu-western-jin-auto",
  filePrefix: "jinshu-western-jin-auto-file",
  promotionProfile: "china-western-jin-281-316-v1",
  collectionHint: "jinshu-western-jin-281-316-candidates",
  periodHint: "china-western-jin-266-316",
  notes: "Western Jin 281-316 candidate pass over the full Jinshu corpus. Exact dates and profile bounds are enforced during promotion.",
  personRange: { startYear: 266, endYear: 316 },
  placeRange: { startYear: 281, endYear: 316 },
  candidateTimeRange: { startYear: 281, endYear: 316, requireExact: true },
  maxCandidatesPerPassage: 160,
}));
