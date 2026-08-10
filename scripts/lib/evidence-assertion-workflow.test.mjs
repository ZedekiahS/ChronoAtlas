import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import migrateEvidencePool from "../../db/migrations/031-evidence-pool-core.mjs";
import migrateAssertionClaimReview from "../../db/migrations/032-assertion-claim-review-core.mjs";
import {
  assertionCandidatePlan,
  assertionWorkflowCounts,
  extractAssertionCandidates,
  prepareAssertionCandidateSet,
  resolveAssertionReviewQueue,
  resolveClaimEvidenceGraph,
} from "./evidence-assertion-workflow.mjs";
import { ingestEvidencePack, prepareEvidencePack } from "./evidence-pack.mjs";
import { uuidV5 } from "./evidence-pool-pilot.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const packPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-multi-source-pack-v1.json");
const candidatesPath = path.join(rootDir, "data", "evidence-pool", "red-cliffs-assertion-candidates-v1.json");

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function createDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON; CREATE TABLE entities (id TEXT PRIMARY KEY);");
  migrateEvidencePool(db);
  migrateAssertionClaimReview(db);
  return db;
}

function acceptAssertionCandidate(db, candidateKey, sequence) {
  const candidate = db.prepare(`
    SELECT * FROM assertion_candidates
    WHERE json_extract(raw_json, '$.candidateKey') = ?
  `).get(candidateKey);
  assert.ok(candidate, `missing candidate ${candidateKey}`);
  const decisionId = uuidV5(`test-human-assertion-decision:${sequence}:${candidate.id}`);
  const assertionId = uuidV5(`test-source-assertion:${decisionId}`);
  db.prepare(`
    INSERT INTO review_decisions (
      id, object_type, object_id, decision_type, outcome,
      reviewer_id, reviewer_kind, reason, policy_version, created_at, raw_json
    ) VALUES (?, 'assertion_candidate', ?, 'assertion_review', 'accept',
              'test-editor', 'human', 'temporary in-memory gate test',
              'evidence-review-policy/test', ?, '{}')
  `).run(decisionId, candidate.id, `2026-08-09T00:00:${String(sequence).padStart(2, "0")}.000Z`);
  db.prepare(`
    INSERT INTO source_assertions (
      id, accepted_from_candidate_id, accepted_by_decision_id, narrating_work_id,
      assertion_mode, predicate_key, statement, polarity, modality,
      status, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', '{}', ?)
  `).run(
    assertionId,
    candidate.id,
    decisionId,
    candidate.narrating_work_id,
    candidate.assertion_mode,
    candidate.predicate_key,
    candidate.proposed_statement,
    candidate.polarity,
    candidate.modality,
    `2026-08-09T00:01:${String(sequence).padStart(2, "0")}.000Z`,
  );
  const anchors = db.prepare(`
    SELECT anchor_id, role, ordinal FROM assertion_candidate_anchors WHERE candidate_id = ?
  `).all(candidate.id);
  for (const anchor of anchors) {
    db.prepare(`
      INSERT INTO assertion_anchors (id, assertion_id, anchor_id, role, ordinal, decision_id, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, '{}')
    `).run(
      uuidV5(`test-assertion-anchor:${assertionId}:${anchor.anchor_id}:${anchor.role}`),
      assertionId,
      anchor.anchor_id,
      anchor.role,
      anchor.ordinal,
      decisionId,
    );
  }
  return { candidate, decisionId, assertionId };
}

test("multi-source Red Cliffs candidates remain gated and traceable", async () => {
  const db = createDatabase();
  try {
    const preparedPack = await prepareEvidencePack(packPath);
    const expectedWorkIds = new Set();
    for (const { prepared } of preparedPack.documents) {
      expectedWorkIds.add(prepared.document.work.id);
      for (const work of prepared.document.relatedWorks ?? []) expectedWorkIds.add(work.id);
    }
    const packResult = ingestEvidencePack(db, preparedPack);
    assert.equal(packResult.allRequiredDocumentsCommitted, true);
    assert.equal(db.prepare("SELECT COUNT(*) count FROM source_witnesses").get().count, 4);
    assert.equal(db.prepare("SELECT COUNT(*) count FROM source_works").get().count, expectedWorkIds.size);

    const preparedCandidates = await prepareAssertionCandidateSet(candidatesPath);
    const intendedCandidates = preparedCandidates.definition.candidates.length;
    const intendedSourceFamilies = new Set(
      preparedCandidates.definition.candidates.map((item) => item.sourceFamily),
    ).size;
    const intendedNarratingWorks = new Set(
      preparedCandidates.definition.candidates.map((item) => item.narratingWorkId),
    ).size;
    const plan = assertionCandidatePlan(db, preparedCandidates);
    assert.equal(plan.intendedCandidates, intendedCandidates);
    assert.equal(plan.sourceFamilies, intendedSourceFamilies);
    assert.equal(plan.createsAssertions, false);
    assert.equal(plan.createsClaims, false);
    assert.equal(plan.createsEvents, false);

    const first = extractAssertionCandidates(db, preparedCandidates);
    assert.deepEqual(first.additions, {
      extractionRuns: 4,
      candidates: intendedCandidates,
      anchorLinks: intendedCandidates,
    });
    assert.deepEqual(assertionWorkflowCounts(db), {
      extractionRuns: 4,
      assertionCandidates: intendedCandidates,
      reviewDecisions: 0,
      sourceAssertions: 0,
      transmissionGroups: 0,
      claimCandidates: 0,
      claims: 0,
    });

    const mostCandidatesOnOneAnchor = db.prepare(`
      SELECT COUNT(*) count FROM assertion_candidate_anchors GROUP BY anchor_id ORDER BY count DESC LIMIT 1
    `).get().count;
    assert.ok(mostCandidatesOnOneAnchor >= 7, "one paragraph should split into multiple action candidates");

    const queue = resolveAssertionReviewQueue(db, { packId: "red-cliffs-multi-source-v1" });
    assert.equal(queue.count, intendedCandidates);
    assert.equal(
      new Set(queue.candidates.map((item) => item.narratingWork.title)).size,
      intendedNarratingWorks,
    );
    assert.ok(queue.candidates.every((item) => item.anchor.exact.length > 0));
    assert.ok(queue.candidates.every((item) => item.rights.allowDisplay === 0));

    const second = extractAssertionCandidates(db, preparedCandidates);
    assert.deepEqual(second.additions, { extractionRuns: 0, candidates: 0, anchorLinks: 0 });
    assert.equal(assertionCandidatePlan(db, preparedCandidates).existingCandidates, intendedCandidates);

    const ungated = db.prepare("SELECT * FROM assertion_candidates LIMIT 1").get();
    assert.throws(() => db.prepare(`
      INSERT INTO source_assertions (
        id, accepted_from_candidate_id, accepted_by_decision_id, narrating_work_id,
        assertion_mode, predicate_key, statement, polarity, modality, status, raw_json, created_at
      ) VALUES ('ungated', ?, 'missing-decision', ?, ?, ?, ?, ?, ?, 'accepted', '{}', '2026-08-09T01:00:00.000Z')
    `).run(
      ungated.id,
      ungated.narrating_work_id,
      ungated.assertion_mode,
      ungated.predicate_key,
      ungated.proposed_statement,
      ungated.polarity,
      ungated.modality,
    ), /matching human review decision/);

    const systemDecisionId = uuidV5(`test-system-decision:${ungated.id}`);
    db.prepare(`
      INSERT INTO review_decisions (
        id, object_type, object_id, decision_type, outcome, reviewer_id, reviewer_kind,
        reason, policy_version, created_at, raw_json
      ) VALUES (?, 'assertion_candidate', ?, 'assertion_review', 'accept', 'test-machine', 'system',
                'machine cannot approve', 'evidence-review-policy/test', '2026-08-09T01:00:01.000Z', '{}')
    `).run(systemDecisionId, ungated.id);
    assert.throws(() => db.prepare(`
      INSERT INTO source_assertions (
        id, accepted_from_candidate_id, accepted_by_decision_id, narrating_work_id,
        assertion_mode, predicate_key, statement, polarity, modality, status, raw_json, created_at
      ) VALUES ('system-gated', ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', '{}', '2026-08-09T01:00:02.000Z')
    `).run(
      ungated.id,
      systemDecisionId,
      ungated.narrating_work_id,
      ungated.assertion_mode,
      ungated.predicate_key,
      ungated.proposed_statement,
      ungated.polarity,
      ungated.modality,
    ), /matching human review decision/);

    const sgz = acceptAssertionCandidate(db, "sgz-sun-quan-dispatches-allied-force", 1);
    const zztj = acceptAssertionCandidate(db, "zztj-allied-commanders", 2);
    const sameAnchorSecond = acceptAssertionCandidate(db, "sgz-zhuge-liang-mission", 3);
    const sharedAnchorCount = db.prepare(`
      SELECT COUNT(DISTINCT assertion_id) count
      FROM assertion_anchors
      WHERE anchor_id = (SELECT anchor_id FROM assertion_anchors WHERE assertion_id = ? LIMIT 1)
    `).get(sgz.assertionId).count;
    assert.equal(sharedAnchorCount, 2, "the same exact anchor can support multiple accepted assertions");

    const groupId = uuidV5("test-transmission-group:sgz-zztj-alliance");
    const groupDecisionId = uuidV5(`test-transmission-decision:${groupId}`);
    db.prepare(`
      INSERT INTO review_decisions (
        id, object_type, object_id, decision_type, outcome, reviewer_id, reviewer_kind,
        reason, policy_version, created_at, raw_json
      ) VALUES (?, 'transmission_group', ?, 'transmission_review', 'accept', 'test-editor', 'human',
                'temporary test: treat later chronicle as same transmission group',
                'evidence-review-policy/test', '2026-08-09T02:00:00.000Z', '{}')
    `).run(groupDecisionId, groupId);
    db.prepare(`
      INSERT INTO transmission_groups (
        id, label, basis_note, review_status, accepted_by_decision_id, raw_json, created_at
      ) VALUES (?, '三国志—通鉴传承组（仅测试）',
                '用于验证不同书名不会自动增加独立传承计数，不构成项目史学判断。',
                'accepted', ?, '{}', '2026-08-09T02:00:01.000Z')
    `).run(groupId, groupDecisionId);

    const claimCandidateId = uuidV5("test-claim-candidate:allied-dispatch");
    db.prepare(`
      INSERT INTO claim_candidates (
        id, generator_key, generator_version, claim_domain, claim_type,
        proposed_predicate, proposed_statement, proposed_polarity, proposed_modality,
        payload_sha256, status, raw_json, created_at
      ) VALUES (?, 'test-generator', '1', 'historical_occurrence', 'occurrence',
                'military.allied_dispatch', '孙权集团与刘备方面形成联合军事行动。',
                'positive', 'asserted', ?, 'pending_review', '{}', '2026-08-09T02:01:00.000Z')
    `).run(claimCandidateId, digest({ claimCandidateId }));
    for (const [ordinal, item] of [sgz, zztj].entries()) {
      db.prepare(`
        INSERT INTO claim_candidate_assertions (
          id, candidate_id, assertion_id, proposed_stance, proposed_directness,
          proposed_transmission_group_id, ordinal, raw_json
        ) VALUES (?, ?, ?, 'supports', ?, ?, ?, '{}')
      `).run(
        uuidV5(`test-claim-candidate-assertion:${claimCandidateId}:${item.assertionId}`),
        claimCandidateId,
        item.assertionId,
        ordinal === 0 ? "direct" : "restatement",
        groupId,
        ordinal,
      );
    }

    assert.throws(() => db.prepare(`
      INSERT INTO claims (
        id, accepted_from_candidate_id, accepted_by_decision_id, claim_domain, claim_type,
        predicate_key, statement, polarity, modality, status, raw_json, created_at
      ) VALUES ('ungated-claim', ?, 'missing-claim-decision', 'historical_occurrence', 'occurrence',
                'military.allied_dispatch', 'test', 'positive', 'asserted', 'accepted', '{}',
                '2026-08-09T02:02:00.000Z')
    `).run(claimCandidateId), /matching human review decision/);

    const claimDecisionId = uuidV5(`test-claim-decision:${claimCandidateId}`);
    const claimId = uuidV5(`test-claim:${claimDecisionId}`);
    db.prepare(`
      INSERT INTO review_decisions (
        id, object_type, object_id, decision_type, outcome, reviewer_id, reviewer_kind,
        reason, policy_version, created_at, raw_json
      ) VALUES (?, 'claim_candidate', ?, 'claim_review', 'accept', 'test-editor', 'human',
                'temporary in-memory claim test', 'evidence-review-policy/test',
                '2026-08-09T02:03:00.000Z', '{}')
    `).run(claimDecisionId, claimCandidateId);
    db.prepare(`
      INSERT INTO claims (
        id, accepted_from_candidate_id, accepted_by_decision_id, claim_domain, claim_type,
        predicate_key, statement, polarity, modality, status, raw_json, created_at
      ) VALUES (?, ?, ?, 'historical_occurrence', 'occurrence', 'military.allied_dispatch',
                '孙权集团与刘备方面形成联合军事行动。', 'positive', 'asserted', 'accepted', '{}',
                '2026-08-09T02:03:01.000Z')
    `).run(claimId, claimCandidateId, claimDecisionId);
    for (const [ordinal, item] of [sgz, zztj].entries()) {
      db.prepare(`
        INSERT INTO claim_assertions (
          id, claim_id, assertion_id, stance, directness, transmission_group_id,
          assessment_status, assessment_note, decision_id, ordinal, raw_json
        ) VALUES (?, ?, ?, 'supports', ?, ?, 'accepted', ?, ?, ?, '{}')
      `).run(
        uuidV5(`test-claim-assertion:${claimId}:${item.assertionId}`),
        claimId,
        item.assertionId,
        ordinal === 0 ? "direct" : "restatement",
        groupId,
        ordinal === 0 ? "早期叙事" : "后世编年转述，测试中不增加独立传承数",
        claimDecisionId,
        ordinal,
      );
    }

    const graph = resolveClaimEvidenceGraph(db, claimId);
    assert.equal(graph.independentTransmissionGroupCount, 1);
    assert.equal(graph.evidence.length, 2);
    assert.deepEqual(new Set(graph.evidence.map((item) => item.narratingWork.title)), new Set(["三國志", "資治通鑑"]));
    assert.ok(graph.evidence.every((item) => item.anchor.exact.length > 0));
    assert.ok(sameAnchorSecond.assertionId);
  } finally {
    db.close();
  }
});
