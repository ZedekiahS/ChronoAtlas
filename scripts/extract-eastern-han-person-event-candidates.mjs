import migratePromotionSchema from "../db/migrations/017-event-promotion-provenance.mjs";
import migratePlaceReferences from "../db/migrations/018-china-place-reference-entities.mjs";
import migrateEasternHanPeriod from "../db/migrations/020-eastern-han-period-reference.mjs";
import { createHouhanshuExtractorConfig } from "./lib/china-official-history-candidate-configs.mjs";
import { runRuleBasedSourceCandidateExtractor } from "./lib/rule-based-source-candidate-extractor.mjs";

runRuleBasedSourceCandidateExtractor(createHouhanshuExtractorConfig({
  batchId: "auto-houhanshu-eastern-han-25-183-candidates",
  candidatePrefix: "houhanshu-eastern-han-auto-candidate",
  cardPrefix: "card:houhanshu-eastern-han-auto",
  filePrefix: "houhanshu-eastern-han-auto-file",
  promotionProfile: "china-eastern-han-25-183-v1",
  collectionHint: "houhanshu-eastern-han-25-183-candidates",
  periodHint: "china-eastern-han-25-184",
  notes: "Eastern Han 25-183 candidate pass over the full Houhanshu corpus. The 184 boundary remains with the existing Yellow Turban transition event.",
  personRange: { startYear: 25, endYear: 184 },
  placeRange: { startYear: 25, endYear: 184 },
  candidateTimeRange: { startYear: 25, endYear: 183, requireExact: true },
  maxCandidatesPerPassage: 180,
  prepareDatabase(db) {
    migratePromotionSchema(db);
    migratePlaceReferences(db);
    migrateEasternHanPeriod(db);
  },
}));
