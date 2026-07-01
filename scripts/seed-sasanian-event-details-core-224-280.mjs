import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-sasanian-event-details-core-224-280";

const sourceIds = {
  ardashirCoinage:
    "deepseek-sasanian-source-sasanian-coinage-ardashir-i-ardashir-i-royal-mint-early-sasanian-coinage",
  cassiusDio: "deepseek-sasanian-source-cassius-dio-roman-history-cassius-dio-cassius-dio-historia-romana",
  tabari: "deepseek-sasanian-source-tabari-tarikh-al-rusul-wal-muluk-history-of-prophets-and-kings-al-tabari",
  shkz: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri",
  shkzDeportation:
    "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-deportation-tradition-shapur-i-inscription-",
  kartirKkz:
    "deepseek-sasanian-source-kartirs-inscription-at-kaba-ye-zardosht-kkz-s-kz-kartir-kirder-kkz-karti",
  kartirCollective:
    "deepseek-sasanian-source-kartirs-inscriptions-collective-evidence-kartir-kirder-kkz-knrb-ksm-knrm",
};

const events = [
  {
    id: "sasanian-224-ardashir-defeats-parthians",
    reviewStatus: "reviewed",
    summary: "阿尔达希尔一世击败安息末王阿尔达班四世，萨珊王朝由地方王权上升为伊朗高原的新帝国秩序。",
    detail: {
      overview:
        "224 年前后，阿尔达希尔一世击败安息末王阿尔达班四世，标志着安息王朝的瓦解和萨珊王朝的兴起。这个节点不是简单的王朝更替，而是伊朗高原政治、王权称号和罗马东方边境格局的重组。",
      background: [
        "三世纪初的安息王朝已经受内部分裂、地方贵族力量和罗马边境压力削弱，中央王权难以有效整合伊朗高原。",
        "阿尔达希尔以法尔斯地方王权为基础扩张，其早期钱币和称号显示他从地方统治者逐步塑造更高层级的王权身份。",
        "罗马作者把阿尔达希尔的兴起理解为“波斯人重新建立帝国”，说明这一事件在罗马东方战略视野中很快被视为重大变化。"
      ],
      process: [
        "阿尔达希尔先在法尔斯和周边地区扩大权力，逐步挑战安息阿萨息斯体系。",
        "他与阿尔达班四世发生决定性冲突，并在传统记载中通过多次战役击败安息末王。",
        "胜利后，阿尔达希尔把自身王权从地方政权提升为“伊朗诸王之王”式的帝国权力。"
      ],
      result: [
        "安息王朝的核心王权崩溃，萨珊王朝成为伊朗高原新的主导力量。",
        "萨珊王权以更集中的王朝叙事、宗教合法性和铭文/钱币表达重塑统治形象。",
        "罗马东方边界面对的不再是后期安息的松散体系，而是更具进攻性的萨珊国家。"
      ],
      impact: [
        "224 年是 190-310 时间段西亚主线的起点，后续 230 年代阿尔达希尔进攻罗马边境、240-260 年代沙普尔一世扩张都从这里展开。",
        "萨珊兴起改变了罗马、亚美尼亚、美索不达米亚和伊朗高原之间的力量平衡。",
        "这个事件也为后续解释沙普尔一世的 ŠKZ 铭文和纳尔塞 Paikuli 铭文提供王权传统背景。"
      ],
      sourceNotes: [
        "早期萨珊钱币能稳定支撑阿尔达希尔从地方王权上升为帝国王权的框架。",
        "Cassius Dio/Xiphilinus 传统记录阿尔达希尔击败安息王并建立波斯帝国，是罗马侧理解这一转折的关键材料。",
        "Tabari 保存后期伊朗传统，可补叙事脉络，但年代和细节优先级低于钱币与较早文本。"
      ],
      uncertainty: [
        "具体战役次数、路线和每次冲突的年代在不同传统中并不完全一致。",
        "后期波斯-阿拉伯传统往往带有王朝起源叙事色彩，不能直接等同同期档案。",
        "钱币可固定王权转型框架，但不能单独还原全部军事过程。"
      ]
    },
    sourceRefs: [
      { sourceId: sourceIds.ardashirCoinage, locator: "early Ardashir types", note: "阿尔达希尔王权称号和钱币证据。" },
      { sourceId: sourceIds.cassiusDio, locator: "80.3.1-80.4.2", note: "罗马侧关于安息崩溃和波斯帝国再起的叙述。" },
      { sourceId: sourceIds.tabari, locator: "Sasanian origin tradition", note: "后期伊朗传统，只作补充叙事。" }
    ],
    evidenceLinks: [
      {
        sourceId: sourceIds.ardashirCoinage,
        locator: "early Ardashir types",
        quote: "早期钱币显示阿尔达希尔从地方王权向更高层级王权转型。",
        role: "material-evidence"
      },
      {
        sourceId: sourceIds.cassiusDio,
        locator: "80.3.1-80.4.2",
        quote: "Cassius Dio 传统记录阿尔达希尔击败安息王并建立新的波斯权力。",
        role: "textual-tradition"
      }
    ],
    relatedEvents: ["sasanian-230-ardashir-roman-frontier", "rome-sasanian-260-valerian-captured"],
    personIds: ["sasanian-ardashir-i"],
    tags: ["dynastic-change", "sasanian-rise", "parthia", "coinage"]
  },
  {
    id: "rome-sasanian-260-valerian-captured",
    reviewStatus: "reviewed",
    summary: "沙普尔一世在埃德萨附近俘虏罗马皇帝瓦勒良，使罗马东方威望遭受三世纪最严重打击之一。",
    detail: {
      overview:
        "260 年，沙普尔一世在第三次对罗马战争中俘虏皇帝瓦勒良。这是罗马皇帝第一次在对外战争中被敌国君主俘虏，也是萨珊王权宣传中最具象征意义的胜利。",
      background: [
        "三世纪中叶罗马同时面对内战、边境压力、财政和疫病冲击，东方军政体系承受巨大压力。",
        "沙普尔一世继承阿尔达希尔一世的扩张方向，持续向美索不达米亚、叙利亚和亚美尼亚方向施压。",
        "瓦勒良亲自东征，说明罗马已经把萨珊威胁视为帝国级危机。"
      ],
      process: [
        "沙普尔一世在 ŠKZ 铭文中把瓦勒良被俘纳入第三次罗马战役的中心叙述。",
        "罗马军队在埃德萨附近遭遇严重失败，瓦勒良本人落入萨珊手中。",
        "萨珊随后把这一胜利用铭文和岩 relief 反复表达，形成王权合法性宣传。"
      ],
      result: [
        "瓦勒良被俘，罗马东方军政体系出现权力真空和威望危机。",
        "萨珊获得巨大的象征性胜利，并可能带走大量俘虏和工匠。",
        "帕尔米拉的奥登纳图斯随后代表罗马东方进行反击，成为 262 年后局势的关键变量。"
      ],
      impact: [
        "这件事是罗马三世纪危机的标志性节点，也是萨珊一世纪内最重要的对罗马胜利。",
        "它推动罗马东方边境出现临时性地方军事代理力量，为帕尔米拉崛起铺路。",
        "在 190-310 范例中，它位于 224 萨珊兴起和 298 尼西比斯和约之间，显示罗马-萨珊力量消长。"
      ],
      sourceNotes: [
        "ŠKZ / Res Gestae Divi Saporis 是核心萨珊侧一手证据，明确把瓦勒良被俘置于沙普尔胜利叙事中。",
        "后期罗马和拜占庭传统会扩展瓦勒良受辱细节，其中部分具有道德化或宣传色彩，需要谨慎。",
        "俘虏迁徙和工匠安置传统可解释萨珊城市与工程叙事，但具体规模和细节需单独核证。"
      ],
      uncertainty: [
        "战役的细节、瓦勒良被俘的具体谈判或军事过程存在不同传统。",
        "罗马侧关于瓦勒良受辱的部分叙述可能带有后期道德化加工。",
        "俘虏人数、迁徙地点和工程贡献不能只凭后期传统直接定量。"
      ]
    },
    sourceRefs: [
      { sourceId: sourceIds.shkz, locator: "ŠKZ §15-20", note: "沙普尔一世铭文中的瓦勒良被俘核心叙述。" },
      { sourceId: sourceIds.shkzDeportation, locator: "ŠKZ §29-30; later deportation tradition", note: "俘虏迁徙与城市建设传统。" }
    ],
    evidenceLinks: [
      {
        sourceId: sourceIds.shkz,
        locator: "ŠKZ §15-20",
        quote: "ŠKZ 将瓦勒良被俘列为沙普尔一世第三次罗马战役的核心胜利。",
        role: "primary"
      },
      {
        sourceId: sourceIds.shkzDeportation,
        locator: "ŠKZ §29-30; later deportation tradition",
        quote: "沙普尔战后迁徙罗马俘虏和工匠的传统与城市建设叙事相连。",
        role: "context"
      }
    ],
    relatedEvents: ["sasanian-224-ardashir-defeats-parthians", "sasanian-262-odaenathus-counteroffensive"],
    personIds: ["sasanian-shapur-i", "rome-valerian"],
    tags: ["war", "edessa", "valerian", "shapur-i", "roman-crisis"]
  },
  {
    id: "sasanian-280-kartir-priestly-power",
    reviewStatus: "reviewed",
    summary: "卡尔提尔铭文显示祆教祭司权力在三世纪后期明显上升，并成为萨珊王权结构的一部分。",
    detail: {
      overview:
        "三世纪后期，卡尔提尔通过多处铭文展示自己在萨珊宫廷和祆教制度中的地位上升。这个事件代表萨珊国家从早期王朝军事扩张，转向更明确的宗教制度化和王权合法性整合。",
      background: [
        "沙普尔一世时期的萨珊宗教环境相对复杂，摩尼等宗教人物仍能在一定阶段接近宫廷。",
        "沙普尔一世之后，巴赫拉姆一世、巴赫拉姆二世等统治时期，祭司集团与王权关系更紧密。",
        "卡尔提尔铭文群提供少见的萨珊本土宗教政治材料，能补足单纯王表和战争叙述的不足。"
      ],
      process: [
        "卡尔提尔在铭文中叙述自己在不同王朝阶段获得职衔、宗教权威和制度扩展机会。",
        "他把祆教秩序、祭司职权和对竞争宗教群体的限制写入自我叙述。",
        "这些铭文分布在重要王权纪念空间附近，说明宗教权威与王室公共表达相互嵌合。"
      ],
      result: [
        "祆教祭司集团在萨珊国家中的可见度和制度地位上升。",
        "宗教合法性成为王权叙事的重要组成部分，而不只是私人信仰或地方传统。",
        "摩尼教等竞争性宗教传统在后续叙述中显示出更大压力。"
      ],
      impact: [
        "卡尔提尔资料说明萨珊史不能只写成国王和战争年表，还必须纳入祭司、宗教制度和合法性语言。",
        "这个节点帮助解释纳尔塞 Paikuli 铭文中政治合法性语言和贵族支持网络的背景。",
        "对后续 AI/RAG 来说，卡尔提尔铭文是回答“萨珊是否是宗教国家”“宗教压制如何发生”的核心证据入口。"
      ],
      sourceNotes: [
        "KKZ §8-12 是卡尔提尔职衔、宗教权力和机构扩展的关键材料。",
        "KNRb/KSM/KNRm 等铭文群可互相比较，帮助区分卡尔提尔自我塑造和制度变化。",
        "摩尼教传统可补竞争宗教视角，但不能直接替代卡尔提尔铭文的本土证据。"
      ],
      uncertainty: [
        "卡尔提尔铭文是强烈自我展示文本，可能扩大自身功绩和权力范围。",
        "对其他宗教群体的压制程度不能一概而论，需要区分摩尼教、基督徒、犹太人、佛教徒等不同处境。",
        "具体年代常只能按铭文、王朝阶段和人物活动范围近似处理。"
      ]
    },
    sourceRefs: [
      { sourceId: sourceIds.kartirKkz, locator: "KKZ §8-12", note: "卡尔提尔职衔、宗教权力和机构扩展。" },
      { sourceId: sourceIds.kartirCollective, locator: "KKZ/KNRb/KSM/KNRm comparison", note: "卡尔提尔铭文群互证。" }
    ],
    evidenceLinks: [
      {
        sourceId: sourceIds.kartirKkz,
        locator: "KKZ §8-12",
        quote: "卡尔提尔自述职衔、宗教权力和祭司制度扩展。",
        role: "primary"
      },
      {
        sourceId: sourceIds.kartirCollective,
        locator: "KKZ/KNRb/KSM/KNRm comparison",
        quote: "卡尔提尔铭文群共同呈现祆教秩序和对竞争宗教群体的限制。",
        role: "corroboration"
      }
    ],
    relatedEvents: ["sasanian-293-narseh-paikuli"],
    personIds: ["sasanian-kartir", "sasanian-mani"],
    tags: ["religion", "zoroastrianism", "kartir", "legitimacy"]
  }
];

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeRaw(existing, event) {
  return {
    ...existing,
    summary: event.summary,
    detail: event.detail,
    sourceRefs: uniqueBy(
      [...(Array.isArray(existing.sourceRefs) ? existing.sourceRefs : []), ...event.sourceRefs],
      (ref) => `${ref.sourceId}:${ref.locator ?? ""}`
    ),
    relatedEvents: uniqueBy(
      [...(Array.isArray(existing.relatedEvents) ? existing.relatedEvents : []), ...event.relatedEvents],
      (id) => id
    ),
    personIds: uniqueBy([...(Array.isArray(existing.personIds) ? existing.personIds : []), ...event.personIds], (id) => id),
    tags: uniqueBy([...(Array.isArray(existing.tags) ? existing.tags : []), ...event.tags], (id) => id),
    reviewStatus: event.reviewStatus,
    reviewedBy: batchId
  };
}

const selectHistorical = db.prepare("SELECT raw_json FROM historical_events WHERE id = ?");
const updateHistorical = db.prepare(`
  UPDATE historical_events
  SET summary = ?, detail_json = ?, raw_json = ?
  WHERE id = ?
`);
const selectEvent = db.prepare("SELECT raw_json FROM events WHERE id = ?");
const updateEvent = db.prepare(`
  UPDATE events
  SET summary = ?, review_status = ?, raw_json = ?
  WHERE id = ?
`);
const insertEvidenceLink = db.prepare(`
  INSERT OR REPLACE INTO evidence_links
    (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
  VALUES (?, 'events', ?, ?, NULL, NULL, ?, ?, ?, 'medium', ?)
`);

db.exec("BEGIN");
try {
  let updatedHistorical = 0;
  let updatedEvents = 0;
  let linkedEvidence = 0;

  for (const event of events) {
    const historical = selectHistorical.get(event.id);
    if (historical) {
      const raw = mergeRaw(parseJson(historical.raw_json), event);
      updateHistorical.run(event.summary, JSON.stringify(event.detail, null, 2), JSON.stringify(raw, null, 2), event.id);
      updatedHistorical += 1;
    }

    const futureEvent = selectEvent.get(event.id);
    if (futureEvent) {
      const raw = mergeRaw(parseJson(futureEvent.raw_json), event);
      updateEvent.run(event.summary, event.reviewStatus, JSON.stringify(raw, null, 2), event.id);
      updatedEvents += 1;
    }

    event.evidenceLinks.forEach((link, index) => {
      insertEvidenceLink.run(
        `${batchId}:${event.id}:${index + 1}`,
        event.id,
        link.sourceId,
        link.locator,
        link.quote,
        link.role,
        JSON.stringify({ batchId, eventId: event.id, sourceId: link.sourceId, locator: link.locator }, null, 2)
      );
      linkedEvidence += 1;
    });
  }

  db.exec("COMMIT");
  console.log(`Seeded core Sasanian event details: historical=${updatedHistorical}, events=${updatedEvents}, evidenceLinks=${linkedEvidence}`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
