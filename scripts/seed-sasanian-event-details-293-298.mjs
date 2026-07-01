import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-sasanian-event-details-293-298";

const sourceIds = {
  paikuli: "deepseek-sasanian-source-paikuli-inscription-npi-narseh-paikuli-tower-inscription-narseh-middle-p",
  zosimusZonaras:
    "deepseek-sasanian-source-zosimus-historia-nova-zonaras-epitome-zosimus-c-500-ce-zonaras-12th-c-zo",
  dodgeonLieu:
    "deepseek-sasanian-source-dodgeon-lieu-the-roman-eastern-frontier-quoting-zonaras-zonaras-12th-cen",
};

const events = [
  {
    id: "sasanian-293-narseh-paikuli",
    reviewStatus: "reviewed",
    summary:
      "Paikuli 铭文记录纳尔塞获得贵族和地方权力集团支持，击败巴赫拉姆三世并取得王位。",
    detail: {
      overview:
        "293 年，纳尔塞在萨珊王室继承竞争中取代巴赫拉姆三世。Paikuli 铭文把这场即位叙述为贵族、地方权贵和王室支系共同承认合法王权的政治事件。",
      background: [
        "沙普尔一世去世后，萨珊王位经历霍尔米兹德一世、巴赫拉姆一世、巴赫拉姆二世等短期或连续继承，王权稳定依赖王室支系与贵族网络。",
        "巴赫拉姆二世死后，巴赫拉姆三世及其支持者与纳尔塞之间出现继承竞争，争夺的核心不是单纯血统，而是谁能获得足够贵族承认。",
        "Paikuli 铭文是纳尔塞阵营留下的胜利叙述，尤其重要之处在于它保存了支持纳尔塞的权贵名单和合法化语言。"
      ],
      process: [
        "纳尔塞以亚美尼亚和西北方向的政治基础进入继承争夺，并把自己塑造成被邀请、被承认的合法继承者。",
        "反对巴赫拉姆三世的贵族、地方首领和宫廷力量陆续向纳尔塞靠拢，形成足以改变王位归属的政治联盟。",
        "纳尔塞在 Paikuli 地区建立铭文，把即位叙述为纠正不合法秩序、恢复正统王权的过程。"
      ],
      result: [
        "纳尔塞成为萨珊王，巴赫拉姆三世的短期统治结束。",
        "贵族和地方权力集团的支持被公开写入铭文，说明萨珊王权并非只由王室血统自动决定。",
        "萨珊内部政治暂时重整，但新王权随后仍要面对罗马东方边境压力。"
      ],
      impact: [
        "这个事件是理解三世纪末萨珊政治的关键节点：王权合法性来自王室资格、贵族承认和地方军事政治网络的叠加。",
        "纳尔塞即位后的对外战略与 296-298 年罗马战争相连，最终导向尼西比斯和约。",
        "Paikuli 铭文也为后续史料证据面板提供了少见的萨珊侧一手材料。"
      ],
      sourceNotes: [
        "Paikuli Inscription (NPi)：纳尔塞自述即位合法性、支持者名单和对巴赫拉姆三世阵营的政治否定。",
        "现代研究通常把 Paikuli 作为萨珊王权合法化和贵族政治网络的核心材料，但会提醒它是胜利者铭文。"
      ],
      uncertainty: [
        "Paikuli 是纳尔塞阵营的胜利叙述，对巴赫拉姆三世阵营的理由、规模和行动过程呈现不足。",
        "继承斗争的具体军事过程、各贵族倒向的时间顺序和确切日期仍有不确定性。",
        "铭文中的合法化语言不能直接等同于客观全过程，需要和钱币、后世叙述及现代研究互证。"
      ]
    },
    sourceRefs: [
      {
        sourceId: sourceIds.paikuli,
        locator: "NPi §1-10; supporter list",
        note: "核心一手证据：纳尔塞即位叙述与支持者名单。"
      }
    ],
    evidenceLinks: [
      {
        sourceId: sourceIds.paikuli,
        locator: "NPi §1-10; supporter list",
        quote: "Paikuli 铭文保存纳尔塞即位叙述和支持者名单。",
        role: "primary"
      }
    ],
    relatedEvents: ["sasanian-298-treaty-of-nisibis"],
    personIds: ["sasanian-narseh", "sasanian-bahram-iii"],
    tags: ["succession", "legitimacy", "paikuli", "sasanian"]
  },
  {
    id: "sasanian-298-treaty-of-nisibis",
    reviewStatus: "reviewed",
    summary:
      "纳尔塞败于罗马后签订尼西比斯和约，罗马在美索不达米亚和亚美尼亚方向取得阶段性优势。",
    detail: {
      overview:
        "298 年，纳尔塞在与罗马的战争中失利后达成尼西比斯和约。该和约重置罗马与萨珊在亚美尼亚、美索不达米亚和底格里斯方向的边界关系，是戴克里先四帝共治时期东方政策的高点。",
      background: [
        "293 年戴克里先正式建立四帝共治后，伽列里乌斯承担东方战区的重要军事责任，罗马需要恢复三世纪危机后在东方的威信。",
        "纳尔塞刚完成王位重组，需要通过边境战争巩固萨珊王权，并重新处理亚美尼亚和美索不达米亚问题。",
        "260 年瓦勒良被俘曾使罗马东方威望严重受挫，因此 296-298 年战争在罗马政治宣传中具有强烈象征意义。"
      ],
      process: [
        "296/297 年前后，纳尔塞与罗马在亚美尼亚、美索不达米亚方向发生战争。",
        "罗马传统称伽列里乌斯早期受挫后重新集结，并在亚美尼亚或萨塔拉附近击败纳尔塞。",
        "罗马叙述特别强调萨珊王室营帐和家眷被俘，这使纳尔塞在谈判中处于不利位置。",
        "和约以尼西比斯为重要外交节点，确立罗马在东方边界的一段优势秩序。"
      ],
      result: [
        "罗马获得或确认美索不达米亚和底格里斯方向的若干边境利益。",
        "亚美尼亚和伊比利亚方向进入更明显的亲罗马秩序。",
        "尼西比斯成为罗马与萨珊贸易、外交和边防体系中的关键节点。"
      ],
      impact: [
        "尼西比斯和约标志着罗马在三世纪末东方边境重新取得主动，是四帝共治军事改革的重要成果之一。",
        "萨珊在纳尔塞统治后期接受不利边境安排，直到四世纪沙普尔二世时期才重新挑战这一格局。",
        "在 190-310 范例结构中，它和 224 阿尔达希尔建国、260 瓦勒良被俘构成罗马-萨珊力量消长的关键对照。"
      ],
      sourceNotes: [
        "Zosimus 与 Zonaras 保存了伽列里乌斯击败纳尔塞、王室营帐被俘和战后安排的罗马/拜占庭传统。",
        "Dodgeon & Lieu 汇编罗马东方边境材料，可作为追踪晚期传统和条款叙述的参考。",
        "Paikuli 铭文不能直接证明 298 年和约，但能解释纳尔塞王权形成的政治背景。"
      ],
      uncertainty: [
        "和约具体条款在不同传统中的表述不完全一致，部分地名和边界细节需要保持审慎。",
        "战役地点、年份分期和伽列里乌斯前后两阶段战况在现代研究中仍有讨论空间。",
        "主要叙述来自罗马或后期拜占庭传统，萨珊侧对失败和谈判的直接叙述缺乏。"
      ]
    },
    sourceRefs: [
      {
        sourceId: sourceIds.zosimusZonaras,
        locator: "Zosimus 1.27; Zonaras 12.23-24",
        note: "罗马/拜占庭传统：伽列里乌斯击败纳尔塞、王室营帐被俘。"
      },
      {
        sourceId: sourceIds.dodgeonLieu,
        locator: "Zonaras 12.23",
        note: "现代汇编引用的尼西比斯和约条款传统。"
      }
    ],
    evidenceLinks: [
      {
        sourceId: sourceIds.zosimusZonaras,
        locator: "Zosimus 1.27; Zonaras 12.23-24",
        quote: "后期传统记载伽列里乌斯击败纳尔塞，并迫使萨珊接受谈判。",
        role: "textual-tradition"
      },
      {
        sourceId: sourceIds.dodgeonLieu,
        locator: "Zonaras 12.23",
        quote: "尼西比斯和约条款的后期叙述传统。",
        role: "compiled-source"
      }
    ],
    relatedEvents: [
      "sasanian-293-narseh-paikuli",
      "rome-293-establishment-of-the-tetrarchy",
      "rome-298-treaty-of-nisibis"
    ],
    personIds: ["sasanian-narseh", "rome-galerius", "rome-diocletian"],
    tags: ["war", "treaty", "nisibis", "roman-sasanian"]
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
  const sourceRefs = uniqueBy(
    [...(Array.isArray(existing.sourceRefs) ? existing.sourceRefs : []), ...event.sourceRefs],
    (ref) => `${ref.sourceId}:${ref.locator ?? ""}`
  );
  const relatedEvents = uniqueBy(
    [...(Array.isArray(existing.relatedEvents) ? existing.relatedEvents : []), ...event.relatedEvents],
    (id) => id
  );
  const personIds = uniqueBy([...(Array.isArray(existing.personIds) ? existing.personIds : []), ...event.personIds], (id) => id);
  const tags = uniqueBy([...(Array.isArray(existing.tags) ? existing.tags : []), ...event.tags], (id) => id);

  return {
    ...existing,
    summary: event.summary,
    detail: event.detail,
    sourceRefs,
    relatedEvents,
    personIds,
    tags,
    reviewStatus: event.reviewStatus,
    reviewedBy: batchId
  };
}

const updateHistorical = db.prepare(`
  UPDATE historical_events
  SET summary = ?, detail_json = ?, raw_json = ?
  WHERE id = ?
`);

const selectHistorical = db.prepare("SELECT raw_json FROM historical_events WHERE id = ?");

const updateEvent = db.prepare(`
  UPDATE events
  SET summary = ?, review_status = ?, raw_json = ?
  WHERE id = ?
`);

const selectEvent = db.prepare("SELECT raw_json FROM events WHERE id = ?");

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
  console.log(`Seeded Sasanian event details: historical=${updatedHistorical}, events=${updatedEvents}, evidenceLinks=${linkedEvidence}`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
