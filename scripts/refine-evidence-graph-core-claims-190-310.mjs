import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
db.exec("PRAGMA foreign_keys = ON;");

const batchId = "manual-core-claim-refinement-190-310";

function raw(value = {}) {
  return JSON.stringify({ batchId, ...value });
}

const refinements = [
  {
    id: "claim:sample:china-190-coalition-against-dong-zhuo",
    type: "event_occurrence",
    zh: "190 年，关东州郡以讨伐董卓为名起兵，东汉朝廷的中央权威转入军阀联盟和地方军事力量公开竞争的阶段。",
    en: "In 190, eastern commandery and provincial forces rose against Dong Zhuo, marking the open militarization of late Han politics and the collapse of effective central authority.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-196-cao-cao-escorts-emperor",
    type: "person_action",
    zh: "196 年，曹操迎汉献帝至许，借东汉皇帝和朝廷名义取得号令诸侯的政治合法性。",
    en: "In 196, Cao Cao escorted Emperor Xian to Xu and used the Han court's authority to gain political legitimacy over rival warlords.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-200-guandu",
    type: "battle_result",
    zh: "200 年官渡之战后，曹操击败袁绍集团，北方统一的主动权由袁绍转向曹操。",
    en: "After the Battle of Guandu in 200, Cao Cao defeated Yuan Shao's coalition and shifted the initiative for northern unification to his own regime.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-208-red-cliffs",
    type: "battle_result",
    zh: "208 年赤壁之战中，孙权、刘备联合阻止曹操迅速吞并江南，三分格局由此获得现实基础。",
    en: "At Red Cliffs in 208, the Sun Quan-Liu Bei alliance stopped Cao Cao's rapid southern expansion, giving the tripartite order a durable political basis.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-219-hanzhong-and-jingzhou-crisis",
    type: "map_control",
    zh: "219 年，刘备称汉中王与关羽失荆州相继发生，蜀汉势力达到高点后立即失去长江中游关键支点。",
    en: "In 219, Liu Bei's assumption of the title King of Hanzhong was followed by Guan Yu's loss of Jingzhou, so Shu-Han reached a high point while losing a key middle-Yangtze base.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-220-cao-pi-founds-wei",
    type: "dynastic_transition",
    zh: "220 年，曹丕接受汉献帝禅让并建立曹魏，东汉的名义秩序正式结束。",
    en: "In 220, Cao Pi accepted Emperor Xian's abdication and founded Cao Wei, formally ending the nominal order of the Eastern Han.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-221-liu-bei-founds-shu",
    type: "dynastic_transition",
    zh: "221 年，刘备在成都称帝，以延续汉统为名建立蜀汉政权。",
    en: "In 221, Liu Bei proclaimed himself emperor at Chengdu and founded Shu-Han under the claim of continuing Han legitimacy.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-229-sun-quan-emperor",
    type: "dynastic_transition",
    zh: "229 年，孙权称帝并定都建业，孙吴完成从江东割据集团到正式帝国政权的转化。",
    en: "In 229, Sun Quan proclaimed himself emperor and established Jianye as his capital, transforming Sun Wu from a Jiangdong power base into a formal imperial state.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-263-shu-han-conquered",
    type: "battle_result",
    zh: "263 年，曹魏伐蜀，邓艾由阴平突入成都方向，刘禅投降，蜀汉灭亡。",
    en: "In 263, Cao Wei conquered Shu-Han after Deng Ai advanced through Yinping toward Chengdu and Liu Shan surrendered.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:china-280-jin-conquers-wu",
    type: "dynastic_transition",
    zh: "280 年，西晋灭吴，三国分裂结束，中国重新进入统一王朝框架。",
    en: "In 280, Western Jin conquered Wu, ending the Three Kingdoms division and restoring a unified dynastic framework in China.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-193-didius-julianus-buys-the-throne-severus-proclaimed-in-pannonia",
    type: "dynastic_transition",
    zh: "193 年，禁卫军拍卖皇位与行省军团拥立塞维鲁同时出现，罗马皇权合法性转向军队竞争。",
    en: "In 193, the auction of the throne by the Praetorians and the provincial army's proclamation of Severus exposed the military basis of imperial legitimacy.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-193-severan-military-reforms",
    type: "person_action",
    zh: "塞维鲁通过提高军饷、扩大军团和削弱禁卫军旧结构，强化军队对帝国政治的核心地位。",
    en: "Septimius Severus strengthened the army's central role in imperial politics by raising pay, expanding the legions, and dismantling the old Praetorian structure.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-212-constitutio-antoniniana-universal-citizenship",
    type: "person_action",
    zh: "212 年《安敦尼努斯敕令》将罗马公民权扩展至帝国大多数自由民，改变了帝国身份和税收结构。",
    en: "The Constitutio Antoniniana of 212 extended Roman citizenship to most free inhabitants of the empire, reshaping imperial status and taxation.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:sasanian-224-ardashir-defeats-parthians",
    type: "dynastic_transition",
    zh: "224 年，阿尔达希尔一世击败安息末王，萨珊王朝取代安息王朝成为伊朗高原的新霸权。",
    en: "In 224, Ardashir I defeated the last Parthian king and made the Sasanian dynasty the new hegemonic power on the Iranian plateau.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-235-assassination-of-alexander-severus-beginning-of-the-third-century-crisis",
    type: "dynastic_transition",
    zh: "235 年亚历山大·塞维鲁被军队杀害，塞维鲁王朝结束，罗马进入以军队拥立和频繁内战为特征的三世纪危机。",
    en: "In 235, Alexander Severus was killed by soldiers, ending the Severan dynasty and opening the Third-Century Crisis of army-made emperors and repeated civil war.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-238-year-of-the-six-emperors",
    type: "event_occurrence",
    zh: "238 年六帝之年集中暴露了元老院、禁卫军、地方军队和皇帝之间的合法性冲突。",
    en: "The Year of the Six Emperors in 238 exposed the legitimacy conflict among senate, Praetorians, provincial armies, and emperors.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:sasanian-244-battle-of-misiche",
    type: "disputed_date_assertion",
    zh: "244 年米西凯会战中戈尔迪安三世之死存在萨珊铭文与罗马传统之间的解释差异。",
    en: "Gordian III's death around the Battle of Misiche in 244 is disputed between Sasanian inscriptional claims and Roman narrative traditions.",
    confidence: "medium",
    reviewStatus: "reviewed",
    disputeStatus: "variant",
  },
  {
    id: "claim:sample:rome-260-capture-of-valerian-by-shapur-i",
    type: "battle_result",
    zh: "260 年，罗马皇帝瓦勒良被沙普尔一世俘虏，罗马东方威望遭受三世纪最严重打击之一。",
    en: "In 260, Emperor Valerian was captured by Shapur I, one of the most severe blows to Roman prestige on the eastern frontier.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-sasanian-260-valerian-captured",
    type: "battle_result",
    zh: "从萨珊视角看，260 年俘虏瓦勒良证明沙普尔一世有能力把对罗马的战争转化为王权宣传。",
    en: "From the Sasanian perspective, the capture of Valerian in 260 demonstrated Shapur I's ability to turn war against Rome into royal propaganda.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-272-aurelian-defeats-zenobia-and-recovers-the-east",
    type: "battle_result",
    zh: "272 年，奥勒良击败芝诺比娅和帕尔米拉政权，恢复罗马对帝国东部的控制。",
    en: "In 272, Aurelian defeated Zenobia and the Palmyrene regime, restoring Roman control over the eastern provinces.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-274-aurelian-defeats-tetricus-and-reunifies-the-roman-empire",
    type: "dynastic_transition",
    zh: "274 年，奥勒良击败高卢帝国的泰特里库斯，罗马帝国在政治上重新统一。",
    en: "In 274, Aurelian defeated Tetricus of the Gallic Empire and politically reunited the Roman Empire.",
    confidence: "high",
    reviewStatus: "reviewed",
  },
  {
    id: "claim:sample:rome-280-the-transition-from-soldier-emperors-to-diocletians-system",
    type: "event_occurrence",
    zh: "280 年前后，罗马正从士兵皇帝时代的反复危机转向戴克里先制度改革前的恢复阶段。",
    en: "Around 280, Rome was moving from the repeated crises of the soldier-emperors toward the recovery phase that preceded Diocletian's reforms.",
    confidence: "medium",
    reviewStatus: "reviewed",
  },
];

const updateClaim = db.prepare(`
  UPDATE evidence_claims
  SET
    claim_type = ?,
    statement_zh = ?,
    statement_en = ?,
    confidence = ?,
    review_status = ?,
    dispute_status = ?,
    raw_json = json_patch(COALESCE(raw_json, '{}'), ?)
  WHERE id = ?
`);

const getClaim = db.prepare("SELECT id FROM evidence_claims WHERE id = ?");
const getEvent = db.prepare(`
  SELECT id, time_start, time_end, region_id
  FROM events
  WHERE id = ?
`);
const insertClaim = db.prepare(`
  INSERT OR IGNORE INTO evidence_claims (
    id, claim_type, statement_zh, statement_en, time_start, time_end, region_id, period_id,
    confidence, review_status, dispute_status, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertClaimSubject = db.prepare(`
  INSERT OR IGNORE INTO evidence_claim_subjects (
    claim_id, subject_table, subject_id, subject_role, sort_order, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);
const eventSubjects = db.prepare(`
  SELECT entity_id, role, sort_order
  FROM event_entities
  WHERE event_id = ?
  ORDER BY sort_order, entity_id
  LIMIT 8
`);
const eventEvidence = db.prepare(`
  SELECT id, source_id, mention_id, passage_id, locator, quote, evidence_role, confidence
  FROM evidence_links
  WHERE subject_table = 'events' AND subject_id = ?
  ORDER BY
    CASE WHEN quote IS NOT NULL AND LENGTH(TRIM(quote)) > 0 THEN 0 ELSE 1 END,
    locator,
    id
  LIMIT 2
`);
const insertClaimSource = db.prepare(`
  INSERT OR IGNORE INTO evidence_claim_sources (
    claim_id, source_id, mention_id, passage_id, locator, quote, source_role, confidence, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function eventIdFromClaimId(claimId) {
  return claimId.replace(/^claim:sample:/, "");
}

function periodForEvent(event) {
  if (event.region_id === "china" && event.time_start >= 310 && event.time_start <= 589) return "china-wei-jin-northern-southern-310-589";
  if (event.region_id === "china") return "china-three-kingdoms-180-280";
  if (event.region_id === "rome") return "rome-190-310";
  if (event.region_id === "sasanian-persia") return "sasanian-persia-224-310";
  return null;
}

function ensureClaim(item) {
  if (getClaim.get(item.id)) {
    return false;
  }
  const eventId = eventIdFromClaimId(item.id);
  const event = getEvent.get(eventId);
  if (!event) {
    return false;
  }
  insertClaim.run(
    item.id,
    item.type,
    item.zh,
    item.en,
    event.time_start,
    event.time_end,
    event.region_id,
    periodForEvent(event),
    item.confidence,
    item.reviewStatus,
    item.disputeStatus ?? "none",
    raw({ refined: true, insertedFromEvent: eventId })
  );
  insertClaimSubject.run(item.id, "events", eventId, "event", 0, raw({ generatedFrom: "refinement" }));
  for (const subject of eventSubjects.all(eventId)) {
    insertClaimSubject.run(item.id, "entities", subject.entity_id, subject.role ?? "participant", subject.sort_order ?? 10, raw({ generatedFrom: "event_entities" }));
  }
  for (const [index, evidence] of eventEvidence.all(eventId).entries()) {
    insertClaimSource.run(
      item.id,
      evidence.source_id,
      evidence.mention_id,
      evidence.passage_id,
      evidence.locator,
      evidence.quote,
      evidence.evidence_role ?? (index === 0 ? "primary" : "parallel"),
      evidence.confidence ?? item.confidence,
      raw({ evidenceLinkId: evidence.id })
    );
  }
  return true;
}

let updated = 0;
let inserted = 0;
db.exec("BEGIN");
try {
  for (const item of refinements) {
    if (ensureClaim(item)) {
      inserted += 1;
    }
    const result = updateClaim.run(
      item.type,
      item.zh,
      item.en,
      item.confidence,
      item.reviewStatus,
      item.disputeStatus ?? "none",
      raw({ refined: true }),
      item.id
    );
    updated += result.changes;
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

console.log(`Refined core evidence claims 190-310: requested=${refinements.length}, inserted=${inserted}, updated=${updated}`);
