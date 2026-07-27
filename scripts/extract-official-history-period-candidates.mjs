import migratePromotionSchema from "../db/migrations/017-event-promotion-provenance.mjs";
import migratePlaceReferences from "../db/migrations/018-china-place-reference-entities.mjs";
import migrateEasternHanPeriod from "../db/migrations/020-eastern-han-period-reference.mjs";
import migrateWesternHanPeriod from "../db/migrations/024-western-han-period-reference.mjs";
import {
  createHanshuExtractorConfig,
  createHouhanshuExtractorConfig,
} from "./lib/china-official-history-candidate-configs.mjs";
import { getChinaOfficialHistoryPeriodPack } from "./lib/china-official-history-period-packs.mjs";
import { runRuleBasedSourceCandidateExtractor } from "./lib/rule-based-source-candidate-extractor.mjs";

const packId = process.argv
  .find((argument) => argument.startsWith("--pack="))
  ?.slice("--pack=".length) ?? "china-eastern-han-25-57-v1";
const pack = getChinaOfficialHistoryPeriodPack(packId);

const extractorFactories = new Map([
  ["hanshu", createHanshuExtractorConfig],
  ["houhanshu", createHouhanshuExtractorConfig],
]);
const createExtractorConfig = extractorFactories.get(pack.extractorKind);
if (!createExtractorConfig) throw new Error(`Unsupported official-history extractor kind: ${pack.extractorKind}`);

runRuleBasedSourceCandidateExtractor(createExtractorConfig({
  batchId: pack.batchId,
  candidatePrefix: pack.candidatePrefix,
  cardPrefix: pack.cardPrefix,
  filePrefix: pack.filePrefix,
  promotionProfile: pack.promotionProfile,
  collectionHint: pack.collectionHint,
  periodHint: pack.periodId,
  notes: pack.notes,
  ...(pack.sourceWhereSql ? { sourceWhereSql: pack.sourceWhereSql } : {}),
  allowedSourceSectionTypes: pack.sourceSectionTypes,
  minimumChronologyConfidence: pack.minimumChronologyConfidence,
  regnalSequenceOptions: pack.regnalSequenceOptions,
  personRange: { startYear: pack.timeStart, endYear: pack.timeEnd },
  placeRange: { startYear: pack.timeStart, endYear: pack.timeEnd },
  candidateTimeRange: { startYear: pack.timeStart, endYear: pack.timeEnd, requireExact: true },
  maxCandidatesPerPassage: pack.maxCandidatesPerPassage,
  prepareDatabase(db) {
    migratePromotionSchema(db);
    migratePlaceReferences(db);
    migrateEasternHanPeriod(db);
    migrateWesternHanPeriod(db);
  },
}));
