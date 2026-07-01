import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-sasanian-ancient-knowledge-190-310";
const regionId = "sasanian-persia";
const periodId = "sasanian-persia-224-310";

const sources = {
  shkz: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri",
  shkzDura: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-dura-europos-excavation-reports-shapur-i-in",
  shkzCourt: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-dodgeon-lieu-shapur-i-s-kz-18-20-early-admi",
  shkzDeportation: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-deportation-tradition-shapur-i-inscription-",
  herodian: "deepseek-sasanian-source-history-of-the-empire-after-marcus-herodian-herodian-history-of-the-empi",
  kartirKkz: "deepseek-sasanian-source-kartirs-inscription-at-kaba-ye-zardosht-kkz-s-kz-kartir-kirder-kkz-karti",
  kartirCollective: "deepseek-sasanian-source-kartirs-inscriptions-collective-evidence-kartir-kirder-kkz-knrb-ksm-knrm",
  paikuli: "deepseek-sasanian-source-paikuli-inscription-npi-narseh-paikuli-tower-inscription-narseh-middle-p",
  mani: "deepseek-sasanian-source-mani-and-manichaeism-manichaean-texts-kephalaia-cologne-mani-codex-mani-",
  tabari: "deepseek-sasanian-source-tabari-tarikh-al-rusul-wal-muluk-history-of-prophets-and-kings-al-tabari",
  zosimusZonaras: "deepseek-sasanian-source-zosimus-historia-nova-zonaras-epitome-zosimus-c-500-ce-zonaras-12th-c-zo",
  dodgeonLieuZonaras: "deepseek-sasanian-source-dodgeon-lieu-the-roman-eastern-frontier-quoting-zonaras-zonaras-12th-cen",
  coinageArdashir: "deepseek-sasanian-source-sasanian-coinage-ardashir-i-ardashir-i-royal-mint-early-sasanian-coinage",
  coinageTabari: "deepseek-sasanian-source-sasanian-coinage-tabari-late-tradition-multiple-mints-sasanian-coinage-a",
};

const cards = [
  {
    id: "shkz-royal-genealogy",
    sourceId: sources.shkz,
    workTitle: "ŠKZ / Res Gestae Divi Saporis",
    chapterTitle: "royal genealogy and titulature",
    locator: "opening genealogy",
    year: 240,
    topicId: "political_structure",
    title: "ŠKZ：沙普尔一世把萨珊王权嵌入阿尔达希尔谱系",
    text: "Shapur identifies himself through Ardashir and Papak and frames the dynasty with royal titulature.",
    translation: "沙普尔一世铭文开篇以阿尔达希尔、帕帕克等谱系和王号说明王权来源，这是早期萨珊王朝自我合法化的核心材料。",
    interpretation: "这不是传记，而是王权声明。它能支撑阿尔达希尔一世、沙普尔一世的继承关系和萨珊王号变化。",
    confidence: "high",
    disputeNote: "铭文是王室自我叙述，合法化意图很强；具体继承细节仍需钱币和后期叙事互证。",
    people: ["sasanian-ardashir-i", "sasanian-shapur-i"],
    events: [],
    tags: ["inscription", "royal-legitimacy", "genealogy"],
  },
  {
    id: "ardashir-coinage-kingship",
    sourceId: sources.coinageArdashir,
    workTitle: "Sasanian Coinage (Ardashir I)",
    chapterTitle: "early royal coinage",
    locator: "early Ardashir types",
    year: 224,
    topicId: "political_structure",
    title: "阿尔达希尔钱币：从波斯地方王权到“伊朗诸王之王”",
    text: "Early coin types document Ardashir's transition from local dynastic rule to universal royal claims.",
    translation: "阿尔达希尔早期钱币比后期叙事更接近同时代，能显示其王号和政治身份逐步扩大。",
    interpretation: "用于补足阿尔达希尔一世传记材料不足的问题：钱币不是故事，但能证明王权身份和年代层次。",
    confidence: "high",
    disputeNote: "钱币能证明王号与统治宣称，不能单独还原具体战役经过。",
    people: ["sasanian-ardashir-i"],
    events: ["sasanian-224-ardashir-defeats-parthians"],
    tags: ["coinage", "royal-title", "chronology"],
  },
  {
    id: "herodian-ardashir-roman-frontier",
    sourceId: sources.herodian,
    workTitle: "Herodian, History of the Empire after Marcus",
    chapterTitle: "Alexander Severus and Persia",
    locator: "6.2-6.6",
    year: 230,
    topicId: "military",
    title: "Herodian：罗马视角下的阿尔达希尔东方压力",
    text: "Herodian presents the Persian threat as a challenge to Rome's eastern provinces.",
    translation: "赫罗狄安把阿尔达希尔的扩张描述为罗马东方行省面临的新波斯威胁。",
    interpretation: "它适合解释罗马为什么在亚历山大·塞维鲁时期组织东方行动，但它是罗马视角，容易放大“波斯威胁”的政治语言。",
    confidence: "medium",
    disputeNote: "Herodian 的叙事服务于罗马帝国危机背景，对波斯目标的表述需要与萨珊铭文分开看。",
    people: ["sasanian-ardashir-i", "rome-alexander-severus"],
    events: ["sasanian-230-ardashir-roman-frontier", "sasanian-232-alexander-severus-expedition"],
    tags: ["roman-source", "frontier", "campaign"],
  },
  {
    id: "shkz-misiche-gordian",
    sourceId: sources.shkz,
    workTitle: "ŠKZ / Res Gestae Divi Saporis",
    chapterTitle: "first Roman campaign",
    locator: "ŠKZ §6-8",
    year: 244,
    topicId: "military",
    title: "ŠKZ：米西切战役和戈尔迪安三世之死的萨珊叙事",
    text: "The inscription claims a Persian victory and connects the campaign with Gordian's death.",
    translation: "沙普尔一世铭文把 244 年战事叙述为萨珊胜利，并把戈尔迪安三世之死纳入这一胜利叙事。",
    interpretation: "这是米西切战役最重要的萨珊侧证据，但与罗马传统对戈尔迪安死因的表述并不完全一致。",
    confidence: "high",
    disputeNote: "铭文本身是胜利铭文，不能直接等同于中立战报；罗马资料对戈尔迪安三世死亡机制存在不同叙述。",
    people: ["sasanian-shapur-i", "rome-gordian-iii", "rome-philip-the-arab"],
    events: ["sasanian-244-battle-of-misiche"],
    tags: ["inscription", "roman-war", "misiche"],
  },
  {
    id: "shkz-philip-settlement",
    sourceId: sources.shkz,
    workTitle: "ŠKZ / Res Gestae Divi Saporis",
    chapterTitle: "settlement after Gordian",
    locator: "ŠKZ §8-9",
    year: 244,
    topicId: "political_structure",
    title: "ŠKZ：腓力与沙普尔一世的战后安排",
    text: "Shapur's inscription presents Philip as entering a settlement after Gordian's death.",
    translation: "沙普尔一世铭文把腓力阿拉伯人的继位和战后安排放在萨珊胜利之后叙述。",
    interpretation: "这条资料适合支撑“罗马在 244 年后选择停战/和约”的结构，但具体条款需要谨慎。",
    confidence: "medium",
    disputeNote: "铭文强调腓力处于不利地位；罗马政治内部继承和谈判细节不能只靠 ŠKZ 判断。",
    people: ["sasanian-shapur-i", "rome-philip-the-arab"],
    events: ["sasanian-244-battle-of-misiche"],
    tags: ["diplomacy", "treaty", "roman-war"],
  },
  {
    id: "shkz-dura-europos",
    sourceId: sources.shkzDura,
    workTitle: "ŠKZ / Res Gestae Divi Saporis + Dura-Europos archaeology",
    chapterTitle: "second campaign and frontier archaeology",
    locator: "ŠKZ §14-15; Dura-Europos final reports",
    year: 256,
    topicId: "military",
    title: "杜拉欧罗普斯：铭文与考古共同显示东方防线崩塌",
    text: "Dura-Europos provides archaeological context for the mid-third-century Sasanian offensive.",
    translation: "杜拉欧罗普斯约在 256 年陷落，考古证据与沙普尔一世战役叙事共同显示罗马东方防线承压。",
    interpretation: "这类资料比单一叙事史更可靠：城防、围攻痕迹和铭文战役列表能互相校验。",
    confidence: "high",
    disputeNote: "陷落精确年份仍有讨论，通常以约 256 年处理。",
    people: ["sasanian-shapur-i"],
    events: ["sasanian-256-dura-europos"],
    tags: ["archaeology", "frontier", "siege"],
  },
  {
    id: "shkz-valerian-capture",
    sourceId: sources.shkz,
    workTitle: "ŠKZ / Res Gestae Divi Saporis",
    chapterTitle: "third Roman campaign",
    locator: "ŠKZ §18-20",
    year: 260,
    topicId: "military",
    title: "ŠKZ：瓦勒良被俘是萨珊王权宣传的核心胜利",
    text: "The inscription places Valerian's capture at the center of Shapur's third Roman campaign.",
    translation: "沙普尔一世铭文把瓦勒良被俘置于第三次罗马战役核心，是萨珊王权宣传中最强的军事胜利证据。",
    interpretation: "这是罗马-萨珊关系里最关键的一条本土材料，可以直接关联沙普尔、瓦勒良和三世纪罗马危机。",
    confidence: "high",
    disputeNote: "战役经过和瓦勒良后续命运在罗马、基督教和后期传统中有夸张成分；被俘事实本身可信度高。",
    people: ["sasanian-shapur-i", "rome-valerian"],
    events: ["rome-sasanian-260-valerian-captured"],
    tags: ["inscription", "valerian", "roman-war"],
  },
  {
    id: "shkz-deportation-gundeshapur",
    sourceId: sources.shkzDeportation,
    workTitle: "ŠKZ / Res Gestae Divi Saporis + later deportation tradition",
    chapterTitle: "captives and deportation",
    locator: "ŠKZ §29-30; Tabari later tradition",
    year: 260,
    topicId: "political_structure",
    title: "被俘罗马人与城市建设传统：可信核心与后期扩写",
    text: "Shapur's inscription and later Iranian traditions connect Roman captives with settlement and building activity.",
    translation: "沙普尔一世铭文和后期伊朗传统都把罗马俘虏与迁徙、安置、城市建设联系起来。",
    interpretation: "这能解释为什么萨珊资料中常出现“罗马俘虏参与建设”的主题，但具体城市和工程细节应分级处理。",
    confidence: "medium",
    disputeNote: "迁徙事实有较强基础；后期关于具体工程和人物的叙述可能被文学化。",
    people: ["sasanian-shapur-i", "rome-valerian"],
    events: ["rome-sasanian-260-valerian-captured"],
    tags: ["deportation", "captives", "urban-history"],
  },
  {
    id: "kartir-shapur-court",
    sourceId: sources.shkzCourt,
    workTitle: "ŠKZ / Res Gestae Divi Saporis + court list",
    chapterTitle: "court list",
    locator: "ŠKZ §18-20 court list",
    year: 260,
    topicId: "political_structure",
    title: "ŠKZ 宫廷名单：卡尔提尔进入沙普尔一世政治世界",
    text: "The court list places Kartir within the early Sasanian court milieu.",
    translation: "沙普尔一世铭文中的宫廷名单让卡尔提尔进入可考的萨珊政治世界。",
    interpretation: "这比后期宗教传统更早，说明卡尔提尔不是纯粹后世宗教记忆，而是三世纪宫廷人物。",
    confidence: "high",
    disputeNote: "名单能证明其宫廷存在和身份，但不能单独证明其后期权力范围。",
    people: ["sasanian-shapur-i", "sasanian-kartir"],
    events: [],
    tags: ["court", "religion", "inscription"],
  },
  {
    id: "kartir-kkz-priestly-power",
    sourceId: sources.kartirKkz,
    workTitle: "Kartir's Inscription at Ka'ba-ye Zardosht",
    chapterTitle: "priestly career and institutions",
    locator: "KKZ §8-12",
    year: 280,
    topicId: "political_structure",
    title: "卡尔提尔铭文：萨珊国家宗教制度化的本土证据",
    text: "Kartir describes offices, religious authority, and expansion of priestly institutions.",
    translation: "卡尔提尔在铭文中叙述自己的职衔、宗教权力和宗教机构扩张，是早期萨珊宗教制度化的核心证据。",
    interpretation: "它能支撑“萨珊不是只有国王军事史，也有祭司与宗教制度上升”的结构。",
    confidence: "high",
    disputeNote: "铭文是卡尔提尔自我表述，权力范围可能被强化；但作为本土一手资料价值很高。",
    people: ["sasanian-kartir"],
    events: ["sasanian-280-kartir-priestly-power"],
    tags: ["kartir", "zoroastrianism", "state-religion"],
  },
  {
    id: "kartir-religious-persecution",
    sourceId: sources.kartirCollective,
    workTitle: "Kartir's Inscriptions (collective evidence)",
    chapterTitle: "non-Mazdayasnian communities",
    locator: "KKZ/KNRb/KSM/KNRm comparison",
    year: 280,
    topicId: "political_structure",
    title: "卡尔提尔资料：宗教压制不能只写成简单迫害故事",
    text: "Kartir's corpus presents religious ordering and opposition to rival communities.",
    translation: "卡尔提尔铭文群显示其推动祆教秩序、限制竞争宗教群体，但具体对象和程度需要逐条拆分。",
    interpretation: "对摩尼、基督徒、犹太人、佛教徒等群体的叙述要分开处理，不能一句话概括成统一迫害政策。",
    confidence: "medium",
    disputeNote: "卡尔提尔铭文具有强烈自我塑造性质；不同宗教群体的处境不能等量齐观。",
    people: ["sasanian-kartir", "sasanian-mani"],
    events: ["sasanian-280-kartir-priestly-power"],
    tags: ["religion", "persecution", "source-criticism"],
  },
  {
    id: "mani-court-mission",
    sourceId: sources.mani,
    workTitle: "Manichaean texts",
    chapterTitle: "Mani's life and mission",
    locator: "Cologne Mani Codex; Kephalaia",
    year: 242,
    topicId: "political_structure",
    title: "摩尼传统：沙普尔一世宫廷环境中的传教记忆",
    text: "Manichaean traditions place Mani's mission within the early Sasanian court environment.",
    translation: "摩尼教传统把摩尼早期传教放在沙普尔一世宫廷环境中，说明萨珊早期宗教空间并非一开始就是单一闭合结构。",
    interpretation: "这条资料可用来平衡卡尔提尔视角：沙普尔时期可能更开放，巴赫拉姆时期才明显转紧。",
    confidence: "medium",
    disputeNote: "摩尼教文本有圣传性质，需避免把宗教记忆直接当作宫廷档案。",
    people: ["sasanian-mani", "sasanian-shapur-i"],
    events: [],
    tags: ["manichaeism", "court", "religion"],
  },
  {
    id: "mani-death-bahram",
    sourceId: sources.mani,
    workTitle: "Manichaean texts",
    chapterTitle: "Mani's death tradition",
    locator: "Manichaean hagiographical tradition",
    year: 277,
    topicId: "political_structure",
    title: "摩尼之死：宗教圣传与萨珊政治压力的交界",
    text: "The Manichaean tradition remembers Mani's death under Bahram I as persecution.",
    translation: "摩尼教传统把摩尼在巴赫拉姆一世时期的死亡解释为受压制和殉教记忆。",
    interpretation: "可作为摩尼人物卡核心证据，但不能脱离卡尔提尔铭文和萨珊继承政治来解释。",
    confidence: "medium",
    disputeNote: "死亡年份和细节在传统中有差异；作为摩尼教内部记忆可信，但政治细节需交叉验证。",
    people: ["sasanian-mani", "sasanian-kartir"],
    events: [],
    tags: ["manichaeism", "death", "religion"],
  },
  {
    id: "paikuli-narseh-legitimacy",
    sourceId: sources.paikuli,
    workTitle: "Paikuli Inscription",
    chapterTitle: "Narseh's claim to kingship",
    locator: "NPi §1-10",
    year: 293,
    topicId: "succession",
    title: "Paikuli：纳尔塞把即位写成恢复合法秩序",
    text: "Narseh presents his accession as the correction of dynastic disorder through elite support.",
    translation: "纳尔塞在 Paikuli 铭文中把自己的即位叙述为在贵族和地方精英支持下恢复合法继承秩序。",
    interpretation: "这是 293 年萨珊继承危机的核心一手材料，比后期王表更重要。",
    confidence: "high",
    disputeNote: "铭文是胜利者纳尔塞的合法化文本，对巴赫拉姆三世一方立场呈现不足。",
    people: ["sasanian-narseh", "sasanian-kartir"],
    events: ["sasanian-293-narseh-paikuli"],
    tags: ["paikuli", "succession", "elite-politics"],
  },
  {
    id: "paikuli-nobles-list",
    sourceId: sources.paikuli,
    workTitle: "Paikuli Inscription",
    chapterTitle: "supporters and nobles",
    locator: "NPi nobles and magnates list",
    year: 293,
    topicId: "political_structure",
    title: "Paikuli 贵族名单：萨珊王权不是孤立君主制",
    text: "The inscription preserves a list of nobles and magnates supporting Narseh.",
    translation: "Paikuli 铭文保留了支持纳尔塞的贵族和权贵名单，说明萨珊王位竞争依赖地方与贵族网络。",
    interpretation: "这能支撑后续做萨珊政治结构，而不是只做国王年表。",
    confidence: "high",
    disputeNote: "名单反映纳尔塞阵营的政治展示，不能代表全部萨珊贵族结构。",
    people: ["sasanian-narseh"],
    events: ["sasanian-293-narseh-paikuli"],
    tags: ["nobility", "succession", "political-network"],
  },
  {
    id: "galerius-narseh-defeat",
    sourceId: sources.zosimusZonaras,
    workTitle: "Zosimus, Historia Nova + Zonaras, Epitome",
    chapterTitle: "Galerius and Narseh",
    locator: "Zosimus 1.27; Zonaras 12.23-24",
    year: 297,
    topicId: "military",
    title: "Zosimus/Zonaras：纳尔塞败于伽列里乌斯",
    text: "The later Greek tradition presents Galerius' victory over Narseh and the capture of the royal camp.",
    translation: "希腊-拜占庭传统叙述伽列里乌斯击败纳尔塞，并强调萨珊王室营帐和家眷被俘带来的政治冲击。",
    interpretation: "这条适合连接罗马四帝共治和萨珊 293 年后外交转向。",
    confidence: "high",
    disputeNote: "Zonaras 较晚，但可能保存早期材料；细节需与和约结果互证。",
    people: ["sasanian-narseh", "rome-galerius", "rome-diocletian"],
    events: ["sasanian-298-treaty-of-nisibis"],
    tags: ["roman-source", "galerius", "narseh"],
  },
  {
    id: "nisibis-treaty",
    sourceId: sources.dodgeonLieuZonaras,
    workTitle: "Zonaras via Dodgeon & Lieu",
    chapterTitle: "Treaty of Nisibis",
    locator: "Zonaras 12.23",
    year: 298,
    topicId: "political_structure",
    title: "尼西比斯和约：罗马-萨珊边境秩序的阶段性重置",
    text: "The treaty tradition places Nisibis at the center of the postwar diplomatic settlement.",
    translation: "尼西比斯和约传统把 298 年战后安排集中在边境、亚美尼亚和美索不达米亚秩序重置上。",
    interpretation: "这是 190-310 时间段萨珊与罗马关系的收束点，可与 224 建国、260 瓦勒良被俘形成三段结构。",
    confidence: "high",
    disputeNote: "具体条款在不同传统中细节不同，但罗马取得阶段性优势这一结构可靠。",
    people: ["sasanian-narseh", "rome-galerius", "rome-diocletian"],
    events: ["sasanian-298-treaty-of-nisibis"],
    tags: ["treaty", "nisibis", "diplomacy"],
  },
  {
    id: "tabari-ardashir-late-tradition",
    sourceId: sources.tabari,
    workTitle: "Tabari, Ta'rikh al-Rusul wa'l-Muluk",
    chapterTitle: "Sasanian section",
    locator: "Sasanian origin tradition",
    year: 224,
    topicId: "source_criticism",
    title: "Tabari：阿尔达希尔故事可补脉络，但不能替代同期证据",
    text: "Tabari preserves later Iranian traditions about Ardashir, Papak and the Sasanian rise.",
    translation: "Tabari 保存了阿尔达希尔、帕帕克和萨珊兴起的后期伊朗传统，对故事脉络有用，但年代和细节不能等同同期记录。",
    interpretation: "这张卡用于 AI 回答时提醒：后期波斯-阿拉伯传统可以补叙事，但优先级低于铭文、钱币和罗马同时代材料。",
    confidence: "medium",
    disputeNote: "Tabari 成书较晚，材料层次复杂；适合标为后期传统或低/中可信补充。",
    people: ["sasanian-ardashir-i"],
    events: ["sasanian-224-ardashir-defeats-parthians"],
    tags: ["tabari", "late-tradition", "source-criticism"],
  },
  {
    id: "coinage-succession-hormizd-bahram",
    sourceId: sources.coinageTabari,
    workTitle: "Sasanian Coinage + Tabari late tradition",
    chapterTitle: "succession after Shapur I",
    locator: "Ardashir I, Shapur I, Hormizd I, Bahram I coinage",
    year: 270,
    topicId: "succession",
    title: "钱币与后期传统：沙普尔一世后的短期继承链",
    text: "Coinage anchors the succession from Shapur I to Hormizd I and Bahram I more securely than narrative detail.",
    translation: "钱币能较稳定地固定沙普尔一世之后霍尔米兹德一世、巴赫拉姆一世等短期继承链，比后期故事细节更可靠。",
    interpretation: "后续补霍尔米兹德一世、巴赫拉姆一世、巴赫拉姆二世人物时，应以钱币/铭文确定框架，再用 Tabari 补叙事。",
    confidence: "medium",
    disputeNote: "王表顺序相对可用，但短期统治的具体事件较少，不能强行写成完整传记。",
    people: ["sasanian-shapur-i"],
    events: [],
    tags: ["coinage", "succession", "source-criticism"],
  },
];

function json(value) {
  return JSON.stringify(value);
}

function tokenEstimate(text) {
  return Math.max(80, Math.ceil(text.length / 2));
}

function documentBody(card) {
  return [
    card.title,
    `资料来源：${card.workTitle} · ${card.locator}`,
    `原始证据：${card.text}`,
    `中文释义：${card.translation}`,
    `整理判断：${card.interpretation}`,
    `争议说明：${card.disputeNote}`,
    `人物：${card.people.join(", ") || "无"}`,
    `事件：${card.events.join(", ") || "无"}`,
    `标签：${card.tags.join(", ")}`,
  ].join("\n");
}

const existingPersonIds = new Set(db.prepare("SELECT id FROM persons").all().map((row) => row.id));
const existingEventIds = new Set(db.prepare("SELECT id FROM historical_events").all().map((row) => row.id));

const deleteStatements = [
  "DELETE FROM source_mention_people WHERE mention_id LIKE 'sasanian-ancient:%'",
  "DELETE FROM source_mention_events WHERE mention_id LIKE 'sasanian-ancient:%'",
  "DELETE FROM source_mention_places WHERE mention_id LIKE 'sasanian-ancient:%'",
  "DELETE FROM source_mention_tags WHERE mention_id LIKE 'sasanian-ancient:%'",
  "DELETE FROM source_mention_i18n WHERE mention_id LIKE 'sasanian-ancient:%'",
  "DELETE FROM evidence_links WHERE id LIKE 'sasanian-ancient:%'",
  "DELETE FROM source_mentions WHERE id LIKE 'sasanian-ancient:%'",
  "DELETE FROM document_chunks WHERE search_document_id LIKE 'sasanian-ancient-doc:%'",
  "DELETE FROM search_documents WHERE id LIKE 'sasanian-ancient-doc:%'",
];

const insertMention = db.prepare(`
  INSERT OR REPLACE INTO source_mentions
    (id, source_id, passage_id, work_title, book_title, chapter_title, locator, year, text, translation, confidence, review_status, raw_json)
  VALUES (?, ?, NULL, ?, '', ?, ?, ?, ?, ?, ?, 'reviewed', ?)
`);

const insertMentionI18n = db.prepare(`
  INSERT OR REPLACE INTO source_mention_i18n
    (mention_id, locale, work_title, book_title, chapter_title, translation, dispute_note, raw_json)
  VALUES (?, 'zh', ?, '', ?, ?, ?, ?)
`);

const insertMentionPerson = db.prepare(`
  INSERT OR REPLACE INTO source_mention_people
    (mention_id, person_id, sort_order)
  VALUES (?, ?, ?)
`);

const insertMentionEvent = db.prepare(`
  INSERT OR REPLACE INTO source_mention_events
    (mention_id, event_id, sort_order)
  VALUES (?, ?, ?)
`);

const insertMentionTag = db.prepare(`
  INSERT OR REPLACE INTO source_mention_tags
    (mention_id, tag, sort_order)
  VALUES (?, ?, ?)
`);

const insertEvidenceLink = db.prepare(`
  INSERT OR REPLACE INTO evidence_links
    (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
  VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)
`);

const insertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents
    (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES (?, 'source_mentions', ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'reviewed', ?)
`);

const insertDocumentChunk = db.prepare(`
  INSERT OR REPLACE INTO document_chunks
    (id, search_document_id, chunk_index, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, token_estimate, review_status, raw_json)
  VALUES (?, ?, 0, 'source_mentions', ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, ?, 'reviewed', ?)
`);

function run() {
  db.exec("BEGIN");
  try {
    for (const sql of deleteStatements) {
      db.exec(sql);
    }

    for (const card of cards) {
      const mentionId = `sasanian-ancient:${card.id}`;
      const docId = `sasanian-ancient-doc:${card.id}`;
      const body = documentBody(card);
      const raw = {
        id: mentionId,
        cardId: card.id,
        importedFromBatch: batchId,
        regionId,
        periodId,
        topicId: card.topicId,
        peopleCore: card.people,
        eventIds: card.events,
        tags: card.tags,
        interpretation: card.interpretation,
        disputeNote: card.disputeNote,
      };

      insertMention.run(
        mentionId,
        card.sourceId,
        card.workTitle,
        card.chapterTitle,
        card.locator,
        card.year,
        card.text,
        card.translation,
        card.confidence,
        json(raw),
      );
      insertMentionI18n.run(mentionId, card.workTitle, card.chapterTitle, card.translation, card.disputeNote, json({ importedFromBatch: batchId }));

      card.people.filter((personId) => existingPersonIds.has(personId)).forEach((personId, index) => {
        insertMentionPerson.run(mentionId, personId, index);
        insertEvidenceLink.run(
          `sasanian-ancient:${card.id}:person:${personId}`,
          "persons",
          personId,
          card.sourceId,
          mentionId,
          card.locator,
          card.text,
          "supports-person-context",
          card.confidence,
          json({ importedFromBatch: batchId }),
        );
      });
      card.events.filter((eventId) => existingEventIds.has(eventId)).forEach((eventId, index) => {
        insertMentionEvent.run(mentionId, eventId, index);
        insertEvidenceLink.run(
          `sasanian-ancient:${card.id}:event:${eventId}`,
          "events",
          eventId,
          card.sourceId,
          mentionId,
          card.locator,
          card.text,
          "supports-event-context",
          card.confidence,
          json({ importedFromBatch: batchId }),
        );
      });
      card.tags.forEach((tag, index) => insertMentionTag.run(mentionId, tag, index));

      insertSearchDocument.run(
        docId,
        mentionId,
        card.title,
        body,
        regionId,
        periodId,
        card.topicId,
        card.year,
        card.year,
        json(raw),
      );
      insertDocumentChunk.run(
        `${docId}:chunk:0`,
        docId,
        mentionId,
        card.title,
        body,
        regionId,
        periodId,
        card.topicId,
        card.year,
        card.year,
        tokenEstimate(body),
        json(raw),
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

run();

const counts = {
  sourceMentions: db.prepare("SELECT COUNT(*) AS total FROM source_mentions WHERE id LIKE 'sasanian-ancient:%'").get().total,
  searchDocuments: db.prepare("SELECT COUNT(*) AS total FROM search_documents WHERE id LIKE 'sasanian-ancient-doc:%'").get().total,
  evidenceLinks: db.prepare("SELECT COUNT(*) AS total FROM evidence_links WHERE id LIKE 'sasanian-ancient:%'").get().total,
  personLinks: db.prepare("SELECT COUNT(*) AS total FROM source_mention_people WHERE mention_id LIKE 'sasanian-ancient:%'").get().total,
  eventLinks: db.prepare("SELECT COUNT(*) AS total FROM source_mention_events WHERE mention_id LIKE 'sasanian-ancient:%'").get().total,
};

console.log(`Seeded Sasanian ancient knowledge: ${JSON.stringify(counts)}`);
