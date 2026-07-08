import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "sasanian-primary-source-dossiers-2026-07";
const regionId = "sasanian-persia";
const periodId = "sasanian-persia-224-310";

const sourceUpdates = [
  {
    id: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri",
    title: "SKZ / Res Gestae Divi Saporis",
    author: "Shapur I",
    type: "inscription",
    citationShort: "Shapur I, Ka'ba-ye Zardosht inscription (SKZ)",
    url: "https://sites.uci.edu/sasanika/sapur-is-inscription-kaba-ye-zartost-skz/",
    note: "Shapur I's trilingual royal inscription at Ka'ba-ye Zardosht; core first-person Sasanian evidence for royal titulature, Roman wars, captives, fires, and court lists. Stored here as a structured dossier, not a full modern translation copy.",
    originalTitle: "ŠKZ / Res Gestae Divi Saporis",
    sourceType: "royal-inscription",
    dateLabel: "c. 262 CE",
    dateStart: 260,
    dateEnd: 272,
    reliability: "high",
  },
  {
    id: "deepseek-sasanian-source-kartirs-inscriptions-collective-evidence-kartir-kirder-kkz-knrb-ksm-knrm",
    title: "Kartir's Inscriptions",
    author: "Kartir",
    type: "inscription",
    citationShort: "Kartir inscriptions: KKZ, KNRb, KSM, KNRm",
    url: "https://www.iranicaonline.org/articles/kartir/",
    note: "Collective dossier for Kartir's third-century inscriptions. Use for priestly career, Zoroastrian institutionalization, and religious policy with source-critical caution.",
    originalTitle: "Kerdir / Kartir inscription corpus",
    sourceType: "priestly-inscription",
    dateLabel: "late 3rd century CE",
    dateStart: 270,
    dateEnd: 293,
    reliability: "high",
  },
  {
    id: "deepseek-sasanian-source-kartirs-inscription-at-kaba-ye-zardosht-kkz-s-kz-kartir-kirder-kkz-karti",
    title: "Kartir's Inscription at Ka'ba-ye Zardosht (KKZ)",
    author: "Kartir",
    type: "inscription",
    citationShort: "Kartir, KKZ",
    url: "https://www.iranicaonline.org/articles/kaba-ye-zardost/",
    note: "Kartir's inscription at the Ka'ba-ye Zardosht complex. Stored as a structured source dossier because available modern translations are mediated by modern editions.",
    originalTitle: "KKZ",
    sourceType: "priestly-inscription",
    dateLabel: "late 3rd century CE",
    dateStart: 270,
    dateEnd: 293,
    reliability: "high",
  },
  {
    id: "deepseek-sasanian-source-paikuli-inscription-npi-narseh-paikuli-tower-inscription-narseh-middle-p",
    title: "Paikuli Inscription (NPi)",
    author: "Narseh",
    type: "inscription",
    citationShort: "Narseh, Paikuli inscription (NPi)",
    url: "https://sites.uci.edu/sasanika/paikuli-inscription-npi/",
    note: "Narseh's Paikuli inscription; a post-284 legitimacy dossier for succession politics and elite support. Stored as a follow-up anchor to the 224-284 Sasanian phase.",
    originalTitle: "NPi / Paikuli inscription",
    sourceType: "royal-inscription",
    dateLabel: "293 CE",
    dateStart: 293,
    dateEnd: 293,
    reliability: "high",
  },
  {
    id: "deepseek-sasanian-source-bishapur-rock-reliefs-archaeological-evidence-shapur-i-commissioner-of-r",
    title: "Bishapur and Naqsh-e Rostam rock reliefs",
    author: "Sasanian royal workshops",
    type: "archaeology",
    citationShort: "Sasanian royal rock reliefs",
    url: "https://www.iranicaonline.org/articles/sasanian-rock-reliefs/",
    note: "Material evidence for Sasanian royal victory imagery. Use as iconographic evidence, not narrative text.",
    originalTitle: "Sasanian rock reliefs",
    sourceType: "material-evidence",
    dateLabel: "3rd century CE",
    dateStart: 224,
    dateEnd: 284,
    reliability: "high",
  },
  {
    id: "deepseek-sasanian-source-sasanian-coinage-ardashir-i-ardashir-i-royal-mint-early-sasanian-coinage",
    title: "Sasanian Coinage (Ardashir I)",
    author: "Ardashir I royal mint",
    type: "numismatic",
    citationShort: "Early Sasanian coinage of Ardashir I",
    url: "https://www.iranicaonline.org/articles/coins-and-coinage-/",
    note: "Coinage dossier for Ardashir I's titulature and dynastic transition. Use as material evidence for royal claims and chronology.",
    originalTitle: "Early Sasanian coinage",
    sourceType: "material-evidence",
    dateLabel: "224-240 CE",
    dateStart: 224,
    dateEnd: 240,
    reliability: "high",
  },
];

const passages = [
  {
    id: "skz-identity-titulature",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ opening titulature",
    sequence: 1,
    yearStart: 240,
    yearEnd: 270,
    title: "SKZ: Shapur's royal identity and genealogy",
    text:
      "Source dossier: SKZ opens with Shapur I's royal identity, descent from Ardashir and Papak, and the title 'king of kings of Iran and non-Iran'. This anchors Sasanian legitimacy in dynastic genealogy and sacral kingship. Use this passage to support Shapur's place in the early Sasanian royal house, not as a neutral biography.",
    translation:
      "史料档案：SKZ 开篇以沙普尔一世的王号、阿尔达希尔与帕帕克谱系、以及“伊朗与非伊朗诸王之王”的称号建立合法性。它适合支撑早期萨珊王权谱系与王号结构，但不能当作中立传记。",
    notes: "Royal self-representation; high evidentiary value for titulature and genealogy, lower for motive.",
    confidence: "high",
    topic: "political_structure",
    years: [240, 270],
    entities: ["sasanian-shapur-i", "sasanian-ardashir-i"],
    events: [],
    tags: ["inscription", "titulature", "genealogy", "royal-legitimacy"],
  },
  {
    id: "skz-imperial-geography",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ imperial lands list",
    sequence: 2,
    yearStart: 240,
    yearEnd: 270,
    title: "SKZ: lands and imperial horizon",
    text:
      "Source dossier: the inscription lists lands under Shapur's claim, including Iranian plateau regions and western frontier zones. Treat the list as a royal claim to scope and hierarchy, not a modern administrative gazetteer. It helps explain why Sasanian expansion mattered to Armenia, Mesopotamia, Syria, and Roman eastern strategy.",
    translation:
      "史料档案：铭文列举沙普尔声称统辖的诸地，覆盖伊朗高原与西部边境方向。这里应理解为王权范围和等级秩序的宣称，而不是现代意义的行政区划清单；它能解释萨珊扩张为何牵动亚美尼亚、美索不达米亚、叙利亚和罗马东方战略。",
    notes: "Use for political geography with caution about formulaic royal claims.",
    confidence: "medium",
    topic: "political_structure",
    years: [240, 270],
    entities: ["sasanian-shapur-i"],
    events: ["sasanian-230-ardashir-roman-frontier"],
    tags: ["inscription", "imperial-geography", "armenia", "mesopotamia"],
  },
  {
    id: "skz-first-roman-war-misiche",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ first Roman campaign / Misiche",
    sequence: 3,
    yearStart: 242,
    yearEnd: 244,
    title: "SKZ: Misiche and the Gordian-Philip transition",
    text:
      "Source dossier: SKZ frames Shapur's first Roman war as a Sasanian victory connected with Gordian III and the subsequent settlement with Philip the Arab. It is the central Sasanian-side source for Misiche, but it is also a victory inscription and should be compared with Roman narrative traditions.",
    translation:
      "史料档案：SKZ 把第一次对罗马战争写成萨珊胜利，并把戈尔狄安三世、腓力阿拉伯人与战后安排纳入同一条叙事。它是米西切战役最关键的萨珊侧材料，但本身是胜利铭文，必须和罗马叙事传统互校。",
    notes: "Core primary source for Misiche; explicit victory framing.",
    confidence: "high",
    topic: "military",
    years: [242, 244],
    entities: ["sasanian-shapur-i", "rome-gordian-iii", "rome-philip-the-arab"],
    events: ["sasanian-244-battle-of-misiche"],
    tags: ["inscription", "misiche", "gordian-iii", "philip-the-arab", "roman-war"],
  },
  {
    id: "skz-second-roman-war-cities",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ second Roman campaign / captured cities",
    sequence: 4,
    yearStart: 252,
    yearEnd: 256,
    title: "SKZ: second Roman war and captured cities",
    text:
      "Source dossier: SKZ presents a second Roman war in which Shapur defeats Roman forces and lists captured cities in Syria and Mesopotamia. Use it for the scale and direction of Sasanian pressure, while treating exact numbers and city lists as royal victory rhetoric requiring archaeological and Roman-source checks.",
    translation:
      "史料档案：SKZ 叙述第二次对罗马战争，称沙普尔击败罗马军队并列举叙利亚、美索不达米亚方向的陷落城市。它适合说明萨珊压力的方向和规模，但数字与城市清单仍应结合考古与罗马侧材料校验。",
    notes: "Connects to Dura-Europos and Roman eastern frontier collapse.",
    confidence: "high",
    topic: "military",
    years: [252, 256],
    entities: ["sasanian-shapur-i"],
    events: ["sasanian-256-dura-europos"],
    tags: ["inscription", "cities", "syria", "mesopotamia", "dura-europos"],
  },
  {
    id: "skz-valerian-captured",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ third Roman campaign / Valerian",
    sequence: 5,
    yearStart: 260,
    yearEnd: 260,
    title: "SKZ: Valerian captured by Shapur I",
    text:
      "Source dossier: SKZ places the capture of the Roman emperor Valerian at the center of Shapur's third Roman campaign. This is the strongest Sasanian first-person evidence for the event and should be linked to Roman crisis narratives, Palmyrene responses, and Sasanian royal victory imagery.",
    translation:
      "史料档案：SKZ 把罗马皇帝瓦勒良被俘置于沙普尔第三次对罗马战争的核心位置。这是该事件最强的萨珊本土一手证据，应关联罗马三世纪危机、帕尔米拉反应和萨珊王权胜利图像。",
    notes: "High-confidence event fact; details of captivity require cross-source caution.",
    confidence: "high",
    topic: "military",
    years: [260, 260],
    entities: ["sasanian-shapur-i", "rome-valerian"],
    events: ["rome-sasanian-260-valerian-captured"],
    tags: ["inscription", "valerian", "edessa", "roman-crisis", "royal-victory"],
  },
  {
    id: "skz-captives-deportation-building",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ captives and settlement traditions",
    sequence: 6,
    yearStart: 260,
    yearEnd: 270,
    title: "SKZ: Roman captives, settlement, and building traditions",
    text:
      "Source dossier: SKZ and later Iranian traditions connect Roman captives with deportation, settlement, and building activity. Store this as a layered claim: the capture and deportation motif is important, but specific engineering stories and city-foundation details require separate verification.",
    translation:
      "史料档案：SKZ 与后期伊朗传统把罗马俘虏、迁徙安置和城市/工程建设联系起来。这里应作为分层命题处理：俘虏与迁徙主题很重要，但具体工程和建城故事需要单独核验。",
    notes: "Separates core inscriptional claim from later expanded tradition.",
    confidence: "medium",
    topic: "political_structure",
    years: [260, 270],
    entities: ["sasanian-shapur-i", "rome-valerian"],
    events: ["rome-sasanian-260-valerian-captured"],
    tags: ["captives", "deportation", "urban-history", "source-criticism"],
  },
  {
    id: "skz-fires-cult-royal-house",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ fires and cult foundations",
    sequence: 7,
    yearStart: 240,
    yearEnd: 270,
    title: "SKZ: fires, cult, and royal house",
    text:
      "Source dossier: SKZ describes foundations and offerings associated with sacred fires and the royal house. Use this to show that early Sasanian royal ideology integrated dynastic memory, cult practice, and public kingship, without assuming a fully centralized later Zoroastrian church already existed under Shapur.",
    translation:
      "史料档案：SKZ 叙述与圣火、祭祀和王室相关的设置。它说明早期萨珊王权意识形态已把王室记忆、祭祀实践和公共王权结合起来，但不能直接推定沙普尔时期已经存在后世形态的高度集中祆教教会。",
    notes: "Good for royal ideology; avoid over-reading later institutions backward.",
    confidence: "medium",
    topic: "political_structure",
    years: [240, 270],
    entities: ["sasanian-shapur-i", "sasanian-kartir"],
    events: [],
    tags: ["fire-cult", "royal-house", "religion", "zoroastrianism"],
  },
  {
    id: "skz-court-list-kartir",
    sourceId: sourceUpdates[0].id,
    locator: "SKZ court list",
    sequence: 8,
    yearStart: 260,
    yearEnd: 270,
    title: "SKZ: court list and Kartir's early visibility",
    text:
      "Source dossier: SKZ's court-list material helps place Kartir and other elites inside the early Sasanian courtly world. It is stronger evidence for presence and status than for later institutional power, which must be checked against Kartir's own inscriptions.",
    translation:
      "史料档案：SKZ 的宫廷名单材料有助于把卡尔提尔等精英置于早期萨珊宫廷世界中。它对人物存在和身份地位的证明较强，但对后期制度权力的证明仍需结合卡尔提尔自己的铭文。",
    notes: "Bridge between Shapur's inscription and Kartir corpus.",
    confidence: "high",
    topic: "elite_network",
    years: [260, 270],
    entities: ["sasanian-shapur-i", "sasanian-kartir"],
    events: ["sasanian-280-kartir-priestly-power"],
    tags: ["court-list", "elite-network", "kartir", "inscription"],
  },
  {
    id: "kartir-career-priestly-power",
    sourceId: sourceUpdates[1].id,
    locator: "Kartir inscriptions / career claims",
    sequence: 20,
    yearStart: 270,
    yearEnd: 293,
    title: "Kartir inscriptions: priestly career and institutional power",
    text:
      "Source dossier: Kartir's inscriptions present his career, titles, religious authority, and the expansion of priestly institutions across several Sasanian reigns. They are first-person priestly self-representation and should be treated as high-value but self-promoting evidence.",
    translation:
      "史料档案：卡尔提尔铭文展示其仕途、职衔、宗教权威以及祭司制度在数位萨珊君主时期的扩张。它们是祭司的第一人称自我呈现，史料价值高，但带有强烈自我塑造。",
    notes: "Core for Kartir and early Sasanian religious policy.",
    confidence: "high",
    topic: "political_structure",
    years: [270, 293],
    entities: ["sasanian-kartir"],
    events: ["sasanian-280-kartir-priestly-power"],
    tags: ["kartir", "priesthood", "zoroastrianism", "institutionalization"],
  },
  {
    id: "kartir-religious-communities",
    sourceId: sourceUpdates[1].id,
    locator: "Kartir inscriptions / rival communities",
    sequence: 21,
    yearStart: 270,
    yearEnd: 293,
    title: "Kartir inscriptions: religious ordering and rival communities",
    text:
      "Source dossier: Kartir's corpus describes religious ordering and pressure on rival communities. Use it to ask precise questions about Manichaeans, Christians, Jews, Buddhists, and other groups separately; do not collapse all groups into one undifferentiated persecution story.",
    translation:
      "史料档案：卡尔提尔铭文群描述宗教秩序建构和对竞争性宗教群体的压力。应分别讨论摩尼教徒、基督徒、犹太人、佛教徒等不同群体，不应压缩成单一笼统的迫害故事。",
    notes: "Good source-critical anchor for religious policy and Mani context.",
    confidence: "medium",
    topic: "source_criticism",
    years: [270, 293],
    entities: ["sasanian-kartir", "sasanian-mani"],
    events: ["sasanian-280-kartir-priestly-power"],
    tags: ["religion", "manichaeism", "christianity", "source-criticism"],
  },
  {
    id: "paikuli-succession-legitimacy",
    sourceId: sourceUpdates[3].id,
    locator: "NPi introduction and main narrative",
    sequence: 30,
    yearStart: 293,
    yearEnd: 293,
    title: "Paikuli: Narseh's succession and legitimacy",
    text:
      "Source dossier: the Paikuli inscription is a post-284 legitimacy document for Narseh's accession. It describes elite negotiations, the defeat or surrender of rival claimants, and the political language used to present Narseh as lawful king. Use it as a follow-up anchor after the 224-284 phase.",
    translation:
      "史料档案：Paikuli 铭文是 284 之后纳尔塞夺位合法性的核心文书，叙述精英协商、竞争者失败或归降，以及纳尔塞被塑造成合法君主的政治语言。它适合作为 224-284 阶段之后的后续锚点。",
    notes: "Outside 224-284, but essential for late third-century Sasanian succession.",
    confidence: "high",
    topic: "succession",
    years: [293, 293],
    entities: ["sasanian-narseh"],
    events: ["sasanian-293-narseh-paikuli"],
    tags: ["paikuli", "succession", "legitimacy", "elite-politics"],
  },
  {
    id: "material-rock-reliefs-victory-image",
    sourceId: sourceUpdates[4].id,
    locator: "Bishapur / Naqsh-e Rostam royal reliefs",
    sequence: 40,
    yearStart: 240,
    yearEnd: 270,
    title: "Sasanian rock reliefs: royal victory image",
    text:
      "Material dossier: Sasanian rock reliefs show royal victory and submission imagery around Shapur I and Roman opponents. They are visual-political evidence for how victories were represented in public landscape, not narrative accounts of battle procedure.",
    translation:
      "物证档案：萨珊岩刻浮雕展示沙普尔一世及其罗马对手相关的王权胜利和臣服图像。它们是公共景观中的视觉政治证据，而不是战役过程叙事。",
    notes: "Material evidence; use with inscriptions and Roman texts.",
    confidence: "high",
    topic: "source_criticism",
    years: [240, 270],
    entities: ["sasanian-shapur-i", "rome-valerian"],
    events: ["rome-sasanian-260-valerian-captured"],
    tags: ["rock-relief", "iconography", "victory", "material-evidence"],
  },
  {
    id: "material-ardashir-coinage-title",
    sourceId: sourceUpdates[5].id,
    locator: "early Ardashir coin types",
    sequence: 41,
    yearStart: 224,
    yearEnd: 240,
    title: "Ardashir coinage: royal title and dynastic transition",
    text:
      "Material dossier: early Sasanian coinage documents Ardashir's transition from local rulership to broader royal claims. Coins are stronger evidence for titulature, imagery, and chronology than for narrative details of the fall of Parthia.",
    translation:
      "物证档案：早期萨珊钱币记录阿尔达希尔从地方统治者走向更高层级王权宣称的过程。钱币对王号、图像和年代层级的证明强于对安息灭亡过程细节的叙事证明。",
    notes: "Use as material source for 224 transition.",
    confidence: "high",
    topic: "dynastic-transition",
    years: [224, 240],
    entities: ["sasanian-ardashir-i"],
    events: ["sasanian-224-ardashir-defeats-parthians"],
    tags: ["coinage", "ardashir", "titulature", "dynastic-transition"],
  },
];

const upsertSource = db.prepare(`
  INSERT INTO sources
    (id, title, author, type, citation_short, url, language, corpus_id, note, raw_json, original_title, source_type, date_label, date_start, date_end, reliability_level, review_status)
  VALUES
    (@id, @title, @author, @type, @citationShort, @url, 'zh-Hans', 'sasanian-persia', @note, @rawJson, @originalTitle, @sourceType, @dateLabel, @dateStart, @dateEnd, @reliability, 'reviewed')
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    author = excluded.author,
    type = excluded.type,
    citation_short = excluded.citation_short,
    url = excluded.url,
    language = excluded.language,
    corpus_id = excluded.corpus_id,
    note = excluded.note,
    raw_json = excluded.raw_json,
    original_title = excluded.original_title,
    source_type = excluded.source_type,
    date_label = excluded.date_label,
    date_start = excluded.date_start,
    date_end = excluded.date_end,
    reliability_level = excluded.reliability_level,
    review_status = excluded.review_status
`);

const upsertPassage = db.prepare(`
  INSERT OR REPLACE INTO source_passages
    (id, source_id, parent_passage_id, locator, sequence, year_start, year_end, text, translation, language, notes, confidence, review_status, raw_json, place_hint, topic_hint)
  VALUES
    (@id, @sourceId, NULL, @locator, @sequence, @yearStart, @yearEnd, @text, @translation, 'zh-Hans', @notes, @confidence, 'reviewed', @rawJson, @placeHint, @topicHint)
`);

const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents
    (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES
    (@id, 'source_passages', @subjectId, @title, @body, 'zh-Hans', @regionId, @periodId, @topicId, @timeStart, @timeEnd, 'reviewed', @rawJson)
`);

const deletePassages = db.prepare("DELETE FROM source_passages WHERE id LIKE 'sasanian-dossier:%'");
const deleteSearchDocuments = db.prepare("DELETE FROM search_documents WHERE id LIKE 'source-passage:sasanian-dossier:%'");

db.exec("BEGIN");
try {
  deleteSearchDocuments.run();
  deletePassages.run();

  for (const source of sourceUpdates) {
    upsertSource.run({
      ...source,
      rawJson: JSON.stringify({
        batchId,
        importMode: "structured-source-dossier",
        copyrightPolicy: "Stores curatorial summaries and source metadata, not full modern translations.",
      }),
    });
  }

  for (const passage of passages) {
    const source = sourceUpdates.find((item) => item.id === passage.sourceId);
    const passageId = `sasanian-dossier:${passage.id}`;
    const rawJson = JSON.stringify({
      batchId,
      sourceUrl: source?.url ?? null,
      sourceTitle: source?.title ?? passage.sourceId,
      entities: passage.entities,
      events: passage.events,
      tags: passage.tags,
      years: passage.years,
      sourceHandling: "curatorial-summary",
    });

    upsertPassage.run({
      id: passageId,
      sourceId: passage.sourceId,
      locator: passage.locator,
      sequence: passage.sequence,
      yearStart: passage.yearStart,
      yearEnd: passage.yearEnd,
      text: passage.text,
      translation: passage.translation,
      notes: passage.notes,
      confidence: passage.confidence,
      rawJson,
      placeHint: passage.tags.includes("mesopotamia") ? "Mesopotamia" : null,
      topicHint: passage.topic,
    });

    upsertSearchDocument.run({
      id: `source-passage:${passageId}`,
      subjectId: passageId,
      title: `${source?.title ?? "Sasanian dossier"} · ${passage.title}`,
      body: `${passage.title}\n${passage.text}\n${passage.translation}\nTags: ${passage.tags.join(", ")}`,
      regionId,
      periodId,
      topicId: passage.topic,
      timeStart: passage.yearStart,
      timeEnd: passage.yearEnd,
      rawJson,
    });
  }

  db.exec("COMMIT");
  console.log(JSON.stringify({ batchId, sources: sourceUpdates.length, passages: passages.length }, null, 2));
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
