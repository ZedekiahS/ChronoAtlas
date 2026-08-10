import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import migrateEvidencePool from "../../db/migrations/031-evidence-pool-core.mjs";
import migrateAssertionClaimReview from "../../db/migrations/032-assertion-claim-review-core.mjs";
import migrateEvidenceProposals from "../../db/migrations/033-evidence-proposals-and-event-release.mjs";
import {
  extractAssertionCandidates,
  prepareAssertionCandidateSet,
} from "./evidence-assertion-workflow.mjs";
import { ingestEvidencePack, prepareEvidencePack } from "./evidence-pack.mjs";
import {
  evidenceProposalCounts,
  evidenceProposalPlan,
  ingestEvidenceProposals,
  prepareEvidenceProposalSet,
  resolveEvidenceProposalDossier,
} from "./evidence-proposal-workflow.mjs";
import { uuidV5 } from "./evidence-pool-pilot.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const packPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-multi-source-pack-v1.json");
const proposalsPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-claim-event-proposals-v1.json");

function createDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON; CREATE TABLE entities (id TEXT PRIMARY KEY);");
  migrateEvidencePool(db);
  migrateAssertionClaimReview(db);
  migrateEvidenceProposals(db);
  return db;
}

async function seedCandidates(db) {
  const pack = await prepareEvidencePack(packPath);
  ingestEvidencePack(db, pack);
  const proposals = await prepareEvidenceProposalSet(proposalsPath);
  const candidateSet = await prepareAssertionCandidateSet(proposals.assertionCandidateSet.absolutePath);
  extractAssertionCandidates(db, candidateSet);
  return proposals;
}

test("Red Cliffs proposal set creates only gated candidates and is idempotent", async () => {
  const db = createDatabase();
  try {
    const prepared = await seedCandidates(db);
    const plan = evidenceProposalPlan(db, prepared);
    assert.deepEqual(plan.intended, {
      transmissionGroups: 8,
      claims: 18,
      eventCollections: 1,
      events: 6,
    });
    assert.ok(Object.values(plan.existing).every((count) => count === 0));

    const first = ingestEvidenceProposals(db, prepared);
    assert.deepEqual(first.additions, {
      transmissionGroups: 8,
      transmissionMembers: 33,
      claims: 18,
      claimEvidenceLinks: 67,
      eventCollections: 1,
      events: 6,
      eventClaimLinks: 19,
    });
    assert.equal(first.formalRecordsCreated, false);
    assert.deepEqual(evidenceProposalCounts(db, prepared.definition.proposalSetId), {
      transmissionGroupCandidates: 8,
      transmissionGroupCandidateMembers: 33,
      claimCandidates: 18,
      claimCandidateSourceLinks: 67,
      eventCollectionCandidates: 1,
      eventCandidates: 6,
      eventCandidateClaimLinks: 19,
      formalEventRecords: 0,
      formalEventRevisions: 0,
      formalCollectionRecords: 0,
      formalCollectionRevisions: 0,
      contentReleases: 0,
      publishedReleases: 0,
    });
    assert.equal(db.prepare("SELECT COUNT(*) count FROM source_assertions").get().count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) count FROM claims").get().count, 0);

    const dossier = resolveEvidenceProposalDossier(db, prepared.definition.proposalSetId);
    assert.equal(dossier.collection.label, "赤壁之战事件簇");
    assert.equal(dossier.events.length, 6);
    assert.equal(dossier.events.reduce((sum, event) => sum + event.claims.length, 0), 19);
    assert.equal(dossier.publicationState.publicProjectionAllowed, false);
    assert.ok(dossier.events.every((event) => event.status === "pending_review"));

    const second = ingestEvidenceProposals(db, prepared);
    assert.ok(Object.values(second.additions).every((count) => count === 0));
    assert.deepEqual(evidenceProposalPlan(db, prepared).existing, plan.intended);

    const eventCandidate = db.prepare("SELECT id FROM event_candidates_v2 LIMIT 1").get();
    assert.throws(
      () => db.prepare("UPDATE event_candidates_v2 SET proposed_label = '机器覆盖' WHERE id = ?").run(eventCandidate.id),
      /event candidates are immutable/,
    );
  } finally {
    db.close();
  }
});

test("formal event and publication gates require human review and accepted evidence", async () => {
  const db = createDatabase();
  try {
    const prepared = await seedCandidates(db);
    ingestEvidenceProposals(db, prepared);
    const eventCandidate = db.prepare(`
      SELECT id, candidate_key, proposed_label, proposed_summary
      FROM event_candidates_v2 ORDER BY display_ordinal LIMIT 1
    `).get();
    const eventId = uuidV5(`test-event-record:${eventCandidate.candidate_key}`);
    db.prepare(`
      INSERT INTO event_records_v2 (id, canonical_key, event_kind, created_at, raw_json)
      VALUES (?, ?, 'background', '2026-08-09T04:00:00.000Z', '{}')
    `).run(eventId, `test:${eventCandidate.candidate_key}`);

    const systemRevisionId = uuidV5(`test-system-event-revision:${eventId}`);
    const systemDecisionId = uuidV5(`test-system-event-decision:${systemRevisionId}`);
    db.prepare(`
      INSERT INTO review_decisions (
        id, object_type, object_id, decision_type, outcome, reviewer_id,
        reviewer_kind, reason, policy_version, created_at, raw_json
      ) VALUES (?, 'event_revision', ?, 'event_review', 'accept', 'test-machine',
                'system', 'machine cannot approve', 'evidence-review-policy/test',
                '2026-08-09T04:00:01.000Z', '{}')
    `).run(systemDecisionId, systemRevisionId);
    assert.throws(() => db.prepare(`
      INSERT INTO event_revisions_v2 (
        id, event_id, revision_no, accepted_from_candidate_id, accepted_by_decision_id,
        label, summary, status, created_at, raw_json
      ) VALUES (?, ?, 1, ?, ?, ?, ?, 'accepted', '2026-08-09T04:00:02.000Z', '{}')
    `).run(
      systemRevisionId,
      eventId,
      eventCandidate.id,
      systemDecisionId,
      eventCandidate.proposed_label,
      eventCandidate.proposed_summary,
    ), /matching human review decision/);

    const revisionId = uuidV5(`test-human-event-revision:${eventId}`);
    const decisionId = uuidV5(`test-human-event-decision:${revisionId}`);
    db.prepare(`
      INSERT INTO review_decisions (
        id, object_type, object_id, decision_type, outcome, reviewer_id,
        reviewer_kind, reason, policy_version, created_at, raw_json
      ) VALUES (?, 'event_revision', ?, 'event_review', 'accept', 'test-editor',
                'human', 'explicit test-only acceptance', 'evidence-review-policy/test',
                '2026-08-09T04:01:00.000Z', '{}')
    `).run(decisionId, revisionId);
    db.prepare(`
      INSERT INTO event_revisions_v2 (
        id, event_id, revision_no, accepted_from_candidate_id, accepted_by_decision_id,
        label, summary, status, created_at, raw_json
      ) VALUES (?, ?, 1, ?, ?, ?, ?, 'accepted', '2026-08-09T04:01:01.000Z', '{}')
    `).run(
      revisionId,
      eventId,
      eventCandidate.id,
      decisionId,
      eventCandidate.proposed_label,
      eventCandidate.proposed_summary,
    );

    const releaseId = uuidV5("test-red-cliffs-release-without-evidence");
    db.prepare(`
      INSERT INTO content_releases_v2 (
        id, release_key, release_version, status, created_at, raw_json
      ) VALUES (?, 'test-red-cliffs', 1, 'draft', '2026-08-09T04:02:00.000Z', '{}')
    `).run(releaseId);
    db.prepare(`
      INSERT INTO content_release_items_v2 (
        id, release_id, item_type, item_id, ordinal, raw_json
      ) VALUES (?, ?, 'event_revision', ?, 0, '{}')
    `).run(uuidV5(`test-release-item:${releaseId}:${revisionId}`), releaseId, revisionId);
    const releaseDecisionId = uuidV5(`test-release-decision:${releaseId}`);
    db.prepare(`
      INSERT INTO review_decisions (
        id, object_type, object_id, decision_type, outcome, reviewer_id,
        reviewer_kind, reason, policy_version, created_at, raw_json
      ) VALUES (?, 'content_release', ?, 'publication_review', 'accept', 'test-publisher',
                'human', 'test publication approval', 'evidence-review-policy/test',
                '2026-08-09T04:02:01.000Z', '{}')
    `).run(releaseDecisionId, releaseId);
    assert.throws(() => db.prepare(`
      UPDATE content_releases_v2
      SET status = 'published', accepted_by_decision_id = ?, published_at = '2026-08-09T04:02:02.000Z'
      WHERE id = ?
    `).run(releaseDecisionId, releaseId), /only accepted immutable revisions/);
    assert.equal(db.prepare("SELECT status FROM content_releases_v2 WHERE id = ?").get(releaseId).status, "draft");
  } finally {
    db.close();
  }
});
