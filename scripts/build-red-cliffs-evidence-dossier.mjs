import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import migrateEvidencePool from "../db/migrations/031-evidence-pool-core.mjs";
import migrateAssertionClaimReview from "../db/migrations/032-assertion-claim-review-core.mjs";
import migrateEvidenceProposals from "../db/migrations/033-evidence-proposals-and-event-release.mjs";
import {
  assertionCandidatePlan,
  assertionWorkflowCounts,
  extractAssertionCandidates,
  prepareAssertionCandidateSet,
} from "./lib/evidence-assertion-workflow.mjs";
import { ingestEvidencePack, prepareEvidencePack } from "./lib/evidence-pack.mjs";
import { evidencePoolCounts } from "./lib/evidence-pool-pilot.mjs";
import {
  evidenceProposalCounts,
  evidenceProposalPlan,
  ingestEvidenceProposals,
  prepareEvidenceProposalSet,
} from "./lib/evidence-proposal-workflow.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const primaryDbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const defaultPackPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-multi-source-pack-v1.json");
const defaultProposalPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-claim-event-proposals-v1.json");

function argumentValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

function tableExists(db, tableName) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName));
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dbArgument = argumentValue("--db");
  const packPath = path.resolve(argumentValue("--pack", defaultPackPath));
  const proposalPath = path.resolve(argumentValue("--proposals", defaultProposalPath));
  const preparedPack = await prepareEvidencePack(packPath);
  const preparedProposals = await prepareEvidenceProposalSet(proposalPath);
  const preparedCandidates = preparedProposals.assertionCandidateSet;
  if (preparedPack.pack.packId !== preparedProposals.definition.packId) {
    throw new Error("Evidence pack and proposal set packId do not match");
  }

  if (!apply) {
    console.log(JSON.stringify({
      mode: "plan",
      packId: preparedProposals.definition.packId,
      proposalSetId: preparedProposals.definition.proposalSetId,
      input: {
        sourceFamilyDocuments: preparedPack.documents.length,
        assertionCandidates: preparedCandidates.definition.candidates.length,
        transmissionGroupCandidates: preparedProposals.definition.transmissionGroups.length,
        claimCandidates: preparedProposals.definition.claims.length,
        eventCollectionCandidates: 1,
        eventCandidates: preparedProposals.definition.events.length,
      },
      gates: preparedProposals.definition.gates,
      writesDatabase: false,
      action: "Use --apply --standalone --db=<explicit shadow path>. The primary database is always refused.",
    }, null, 2));
    return;
  }

  if (!dbArgument) throw new Error("--apply requires an explicit --db path");
  if (!process.argv.includes("--standalone")) {
    throw new Error("Red Cliffs dossier builder requires --standalone acknowledgement");
  }
  const dbPath = path.resolve(dbArgument);
  if (dbPath === primaryDbPath) throw new Error("Red Cliffs dossier builder never writes db/chronoatlas.sqlite");
  await mkdir(path.dirname(dbPath), { recursive: true });
  const existedBefore = existsSync(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    if (!tableExists(db, "entities")) {
      if (existedBefore) throw new Error("Existing target lacks an entities table; choose a new shadow database path");
      db.exec("CREATE TABLE entities (id TEXT PRIMARY KEY)");
    }
    migrateEvidencePool(db);
    migrateAssertionClaimReview(db);
    migrateEvidenceProposals(db);
    const before = {
      evidencePool: evidencePoolCounts(db),
      assertionWorkflow: assertionWorkflowCounts(db),
      proposals: evidenceProposalCounts(db, preparedProposals.definition.proposalSetId),
    };
    const packResult = ingestEvidencePack(db, preparedPack);
    const candidatePlan = assertionCandidatePlan(db, preparedCandidates);
    if (!packResult.allRequiredDocumentsCommitted) {
      throw new Error("Proposal generation cannot start before all required evidence-pack documents are committed");
    }
    const candidateResult = extractAssertionCandidates(db, preparedCandidates);
    const proposalPlan = evidenceProposalPlan(db, preparedProposals);
    const proposalResult = ingestEvidenceProposals(db, preparedProposals);
    const after = {
      evidencePool: evidencePoolCounts(db),
      assertionWorkflow: assertionWorkflowCounts(db),
      proposals: evidenceProposalCounts(db, preparedProposals.definition.proposalSetId),
    };
    const foreignKeyFailures = db.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyFailures.length > 0) {
      throw new Error(`Foreign-key check failed: ${JSON.stringify(foreignKeyFailures)}`);
    }
    console.log(JSON.stringify({
      database: dbPath,
      createdNewDatabase: !existedBefore,
      packResult,
      candidatePlan,
      candidateResult,
      proposalPlan,
      proposalResult,
      counts: { before, after },
      foreignKeyFailures,
    }, null, 2));
  } finally {
    db.close();
  }
}

await main();
