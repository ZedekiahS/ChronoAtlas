import { createJinshuExtractorConfig } from "./lib/china-official-history-candidate-configs.mjs";
import { runRuleBasedSourceCandidateExtractor } from "./lib/rule-based-source-candidate-extractor.mjs";

runRuleBasedSourceCandidateExtractor(createJinshuExtractorConfig());
