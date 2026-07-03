import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
db.exec("PRAGMA foreign_keys = ON;");

const batchId = "manual-china-310-589-additional-evidence-claims";
const periodId = "china-wei-jin-northern-southern-310-589";

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

const claims = [
  {
    eventId: "china-347-huan-wen-conquers-cheng-han",
    claimType: "event_occurrence",
    statementZh: "347 年桓温攻入蜀地并迫使李势面缚舆榇请命，成汉政权由此灭亡。",
    statementEn: "In 347, Huan Wen defeated Li Shi in Shu and ended the Cheng-Han regime.",
  },
  {
    eventId: "china-376-former-qin-unifies-north",
    claimType: "dynastic_transition",
    statementZh: "376 年前秦压服前凉，张天锡面临入朝或秦兵至姑臧的抉择，前秦由此完成北方主要政权整合。",
    statementEn: "In 376, Former Qin absorbed Former Liang and consolidated the northern political field.",
  },
  {
    eventId: "china-395-canhbei-northern-wei-defeats-later-yan",
    claimType: "battle_result",
    statementZh: "395 年参合陂之战中，北魏军登山临燕营并击溃后燕军，北魏崛起取得关键军事胜利。",
    statementEn: "In 395, Northern Wei defeated Later Yan at Canhebei, a key victory in its rise.",
  },
  {
    eventId: "china-493-xiaowen-luoyang",
    claimType: "policy_change",
    statementZh: "493 年前后，孝文帝以河南洛阳为政治重心推进迁都和制度建设，李冲等官员参与洛阳宫室营缮。",
    statementEn: "Around 493, Emperor Xiaowen made Luoyang the political center and advanced institutional construction there.",
  },
  {
    eventId: "china-528-heyin-massacre",
    claimType: "event_occurrence",
    statementZh: "528 年尔朱荣在河阴召集百官迎驾并大规模诛杀，北魏中央秩序受到决定性破坏。",
    statementEn: "In 528, Erzhu Rong massacred officials at Heyin, decisively damaging Northern Wei central order.",
  },
  {
    eventId: "china-580-yang-jian-regency",
    claimType: "dynastic_transition",
    statementZh: "580 年北周静帝年幼，杨坚因众望所归入总朝政并都督内外诸军事，隋代周进入直接过渡阶段。",
    statementEn: "In 580, Yang Jian took control of Northern Zhou government and military affairs, opening the transition to Sui.",
  },
];

const getEvent = db.prepare(`
  SELECT id, title, event_type, time_start, time_end, region_id
  FROM events
  WHERE id = ?
`);

const getEvidence = db.prepare(`
  SELECT l.id, l.source_id, l.mention_id, l.passage_id, l.locator, l.quote, l.confidence
  FROM evidence_links l
  WHERE l.subject_table = 'events' AND l.subject_id = ?
    AND l.quote IS NOT NULL
    AND length(trim(l.quote)) > 0
  ORDER BY
    CASE WHEN l.confidence = 'high' THEN 0 ELSE 1 END,
    l.id
  LIMIT 2
`);

const insertClaim = db.prepare(`
  INSERT OR REPLACE INTO evidence_claims (
    id, claim_type, statement_zh, statement_en, time_start, time_end, region_id, period_id,
    confidence, review_status, dispute_status, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'high', 'reviewed', 'none', ?)
`);

const insertClaimSource = db.prepare(`
  INSERT OR REPLACE INTO evidence_claim_sources (
    claim_id, source_id, mention_id, passage_id, locator, quote, source_role, confidence, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertClaimSubject = db.prepare(`
  INSERT OR REPLACE INTO evidence_claim_subjects (
    claim_id, subject_table, subject_id, subject_role, sort_order, raw_json
  )
  VALUES (?, 'events', ?, 'event', 0, ?)
`);

db.exec("BEGIN");
try {
  for (const claim of claims) {
    const event = getEvent.get(claim.eventId);
    if (!event) throw new Error(`Missing event: ${claim.eventId}`);
    const evidenceRows = getEvidence.all(claim.eventId);
    if (!evidenceRows.length) throw new Error(`Missing quoted evidence for event: ${claim.eventId}`);

    const claimId = `claim:china-310-589:additional:${claim.eventId}`;
    insertClaim.run(
      claimId,
      claim.claimType,
      claim.statementZh,
      claim.statementEn,
      event.time_start,
      event.time_end,
      event.region_id,
      periodId,
      json({ eventId: event.id, generatedFrom: "manual-core-additional", evidenceLinkCount: evidenceRows.length }),
    );
    insertClaimSubject.run(claimId, event.id, json({ generatedFrom: "manual-core-additional" }));

    for (const [index, evidence] of evidenceRows.entries()) {
      insertClaimSource.run(
        claimId,
        evidence.source_id,
        evidence.mention_id,
        evidence.passage_id,
        evidence.locator,
        evidence.quote,
        index === 0 ? "primary" : "parallel",
        evidence.confidence ?? "medium",
        json({ evidenceLinkId: evidence.id }),
      );
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded ${claims.length} additional 310-589 evidence claims.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
