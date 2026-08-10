import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import migrateEvidencePool from "../../db/migrations/031-evidence-pool-core.mjs";
import migrateAssertionClaimReview from "../../db/migrations/032-assertion-claim-review-core.mjs";
import migrateEvidenceProposals from "../../db/migrations/033-evidence-proposals-and-event-release.mjs";
import migrateEvidencePackRegistry from "../../db/migrations/034-evidence-pack-registry.mjs";
import { ingestEvidencePack, prepareEvidencePack, registerEvidencePack } from "./evidence-pack.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const packPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-source-pool-v1.json");

function count(db, table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

test("Red Cliffs source pool ingests portable raw witnesses without producing event-layer records", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "chronoatlas-red-cliffs-source-pool-"));
  const db = new DatabaseSync(path.join(tempDir, "source-pool.sqlite"));
  try {
    db.exec("PRAGMA foreign_keys = ON; CREATE TABLE entities (id TEXT PRIMARY KEY)");
    migrateEvidencePool(db);
    migrateAssertionClaimReview(db);
    migrateEvidenceProposals(db);
    migrateEvidencePackRegistry(db);

    const preparedPack = await prepareEvidencePack(packPath);
    const expectedDocumentCount = preparedPack.documents.length;
    assert.equal(preparedPack.pack.packId, "red-cliffs-source-pool-v1");
    assert.ok(expectedDocumentCount >= 10);
    assert.equal(preparedPack.documents.filter(({ definition }) => definition.required).length, expectedDocumentCount);
    assert.equal(preparedPack.pack.gates.automaticAssertionAcceptance, false);
    assert.equal(preparedPack.pack.gates.automaticClaimAcceptance, false);
    assert.equal(preparedPack.pack.gates.automaticEventGeneration, false);

    const expectedWorks = new Set();
    const expectedWitnesses = new Set();
    for (const { prepared } of preparedPack.documents) {
      expectedWorks.add(prepared.document.work.id);
      for (const work of prepared.document.relatedWorks ?? []) expectedWorks.add(work.id);
      expectedWitnesses.add(prepared.document.witness.id);
      assert.match(prepared.storageUri, /^repo:data\/evidence-pool\//u);
    }
    assert.equal(expectedWitnesses.size, expectedDocumentCount);

    const first = ingestEvidencePack(db, preparedPack);
    const firstRegistry = registerEvidencePack(db, preparedPack);
    assert.equal(first.allRequiredDocumentsCommitted, true);
    assert.equal(count(db, "source_witnesses"), expectedDocumentCount);
    assert.equal(count(db, "source_works"), expectedWorks.size);
    assert.equal(count(db, "source_assets"), expectedDocumentCount);
    assert.equal(count(db, "ingest_runs"), expectedDocumentCount);
    assert.equal(count(db, "witness_active_ingests"), expectedDocumentCount);
    assert.deepEqual(firstRegistry.additions, { packs: 1, revisions: 1, documents: expectedDocumentCount });
    assert.equal(count(db, "evidence_packs"), 1);
    assert.equal(count(db, "evidence_pack_revisions"), 1);
    assert.equal(count(db, "evidence_pack_documents"), expectedDocumentCount);
    assert.equal(count(db, "evidence_pack_active_revisions"), 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ingest_runs WHERE status = 'committed'").get().count, expectedDocumentCount);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM rights_statements WHERE allow_store = 1 AND allow_display = 0 AND allow_index = 0").get().count, expectedDocumentCount);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM source_assets WHERE storage_uri LIKE 'repo:data/evidence-pool/%'").get().count, expectedDocumentCount);
    assert.ok(count(db, "anchor_attributions") >= 8);

    const requiredWorkTitles = ["江表傳", "山陽公載記", "漢晉春秋", "獻帝春秋", "阮瑀書", "典論", "水經注", "建康實錄"];
    for (const title of requiredWorkTitles) {
      assert.ok(db.prepare("SELECT 1 FROM source_works WHERE title = ?").get(title), `missing work ${title}`);
    }

    for (const table of [
      "assertion_candidates",
      "source_assertions",
      "claim_candidates",
      "claims",
      "event_collection_candidates",
      "event_candidates_v2",
      "event_records_v2",
      "content_releases_v2",
    ]) {
      assert.equal(count(db, table), 0, `${table} must remain empty`);
    }

    const second = ingestEvidencePack(db, preparedPack);
    const secondRegistry = registerEvidencePack(db, preparedPack);
    assert.equal(second.results.every(({ result }) => result.reusedCommittedRun), true);
    assert.equal(count(db, "source_assets"), expectedDocumentCount);
    assert.equal(count(db, "ingest_runs"), expectedDocumentCount);
    assert.deepEqual(secondRegistry.additions, { packs: 0, revisions: 0, documents: 0 });
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
