import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-589-core-expansion";
const regionId = "china";
const civilizationId = "china-wei-jin-northern-southern";
const periodId = "china-wei-jin-northern-southern-310-589";
const corpusId = "china-wei-jin-northern-southern";

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

function compactText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

const fallbackSources = [
  ["jinshu", "晋书", "房玄龄等", "official-history", "《晋书》", "西晋、东晋与十六国人物和纪传的主要正史来源。"],
  ["songshu", "宋书", "沈约", "official-history", "《宋书》", "刘宋本纪、列传、州郡志是 420-479 南朝主干。"],
  ["nanqishu", "南齐书", "萧子显", "official-history", "《南齐书》", "南齐短期政权和宗室政治主干。"],
  ["liangshu", "梁书", "姚思廉", "official-history", "《梁书》", "梁武帝、侯景之乱和梁末分裂的核心纪传来源。"],
  ["weishu", "魏书", "魏收", "official-history", "《魏书》", "北魏兴起、统一北方、孝文帝改革和北魏晚期的核心正史来源。"],
  ["beiqishu", "北齐书", "李百药", "official-history", "《北齐书》", "东魏、北齐高氏政权主干。"],
  ["zhoushu", "周书", "令狐德棻等", "official-history", "《周书》", "西魏、北周宇文氏政权和北周灭齐的主干。"],
  ["suishu", "隋书", "魏徵等", "official-history", "《隋书》", "北周入隋、隋灭陈及制度地理总结的重要来源。"],
  ["zizhi-tongjian-jin", "资治通鉴·晋纪", "司马光", "chronicle", "《资治通鉴·晋纪》", "310-420 编年主干，适合事件时间线校年。"],
  ["zizhi-tongjian-song", "资治通鉴·宋纪", "司马光", "chronicle", "《资治通鉴·宋纪》", "刘宋、北魏前期和南北对峙编年主干。"],
  ["zizhi-tongjian-qi", "资治通鉴·齐纪", "司马光", "chronicle", "《资治通鉴·齐纪》", "南齐至北魏孝文帝时代编年主干。"],
  ["zizhi-tongjian-liang", "资治通鉴·梁纪", "司马光", "chronicle", "《资治通鉴·梁纪》", "梁、东魏、西魏、北齐、北周早期编年主干。"],
  ["zizhi-tongjian-chen", "资治通鉴·陈纪", "司马光", "chronicle", "《资治通鉴·陈纪》", "陈、北周、北齐后期、隋代周前后编年主干。"],
  ["zizhi-tongjian-sui", "资治通鉴·隋纪", "司马光", "chronicle", "《资治通鉴·隋纪》", "隋灭陈与南北统一编年主干。"],
];

const people = [
  ["huan-wen", "桓温", "Huan Wen", 312, 373, "东晋", "东晋权臣和北伐统帅，347 年灭成汉，后多次北伐。", ["元子"]],
  ["li-shi-cheng-han", "李势", "Li Shi", null, 361, "成汉", "成汉末主，347 年桓温入蜀后出降。", []],
  ["murong-chui", "慕容垂", "Murong Chui", 326, 396, "后燕", "后燕建立者，参合陂之战后后燕力量急剧受挫。", []],
  ["tuoba-gui", "拓跋珪", "Tuoba Gui", 371, 409, "北魏", "北魏道武帝，重建代国并奠定北魏国家形态。", ["道武帝"]],
  ["xiao-daocheng", "萧道成", "Xiao Daocheng", 427, 482, "南齐", "南齐建立者，479 年代宋建齐。", ["齐高帝"]],
  ["xiao-yan-liang-wudi", "萧衍", "Xiao Yan", 464, 549, "梁", "梁朝建立者，502 年代齐建梁，晚年遭侯景之乱。", ["梁武帝"]],
  ["gao-yang-northern-qi", "高洋", "Gao Yang", 526, 559, "北齐", "北齐文宣帝，550 年代东魏建立北齐。", ["文宣帝"]],
  ["yuwen-jue", "宇文觉", "Yuwen Jue", 542, 557, "北周", "北周孝闵帝，557 年即天王位，北周建立。", ["孝闵帝"]],
  ["chen-baxian", "陈霸先", "Chen Baxian", 503, 559, "陈", "陈朝建立者，557 年受禅称帝。", ["陈武帝"]],
  ["yuwen-yong-zhou-wudi", "宇文邕", "Yuwen Yong", 543, 578, "北周", "北周武帝，577 年灭北齐，重新统一北方。", ["周武帝"]],
  ["xiao-yi-liang-yuandi", "萧绎", "Xiao Yi", 508, 555, "梁", "梁元帝，侯景之乱后即位，554 年江陵陷落后被杀。", ["梁元帝"]],
  ["wang-sengbian", "王僧辩", "Wang Sengbian", null, 555, "梁", "梁末将领，参与平定侯景之乱。", []],
];

const events = [
  {
    id: "china-347-huan-wen-conquers-cheng-han",
    year: 347,
    title: "桓温灭成汉",
    titleEn: "Huan Wen conquers Cheng-Han",
    type: "war",
    summary: "桓温率东晋军入蜀，成汉末主李势出降，益州重新纳入东晋体系，江南政权取得重要西部支点。",
    sourceId: "jinshu",
    locator: "桓温传；李势载记；资治通鉴晋纪，永和三年",
    people: [["huan-wen", "commander"], ["li-shi-cheng-han", "defeated-ruler"]],
    tags: ["东晋", "成汉", "益州"],
  },
  {
    id: "china-354-huan-wen-guanzhong-expedition",
    year: 354,
    title: "桓温北伐入关中",
    titleEn: "Huan Wen campaigns into Guanzhong",
    type: "war",
    summary: "桓温北伐前秦，一度进入关中并逼近长安，但补给和地方响应不足，东晋北伐未能转化为长期控制。",
    sourceId: "zizhi-tongjian-jin",
    locator: "晋纪，永和十年",
    people: [["huan-wen", "commander"]],
    tags: ["东晋北伐", "关中", "前秦"],
  },
  {
    id: "china-369-huan-wen-defeated-fangtou",
    year: 369,
    title: "桓温枋头败退",
    titleEn: "Huan Wen is defeated at Fangtou",
    type: "war",
    summary: "桓温北伐前燕，在枋头受挫并退兵，东晋以北伐重塑北方秩序的努力再次失败。",
    sourceId: "zizhi-tongjian-jin",
    locator: "晋纪，太和四年",
    people: [["huan-wen", "commander"], ["murong-chui", "yan-commander"]],
    tags: ["东晋北伐", "前燕", "枋头"],
  },
  {
    id: "china-376-former-qin-unifies-north",
    year: 376,
    title: "前秦统一北方",
    titleEn: "Former Qin unifies North China",
    type: "unification",
    summary: "苻坚先后压服前凉、代等北方政权，形成淝水之战前短暂的北方统一局面。",
    sourceId: "zizhi-tongjian-jin",
    locator: "晋纪，太元元年前后",
    people: [["fu-jian", "ruler"]],
    tags: ["前秦", "北方统一", "淝水前夜"],
  },
  {
    id: "china-395-canhbei-northern-wei-defeats-later-yan",
    year: 395,
    title: "参合陂之战",
    titleEn: "Battle of Canhe Slope",
    type: "war",
    summary: "北魏在参合陂击败后燕军，后燕势力急剧衰落，拓跋氏进入扩张阶段。",
    sourceId: "weishu",
    locator: "太祖纪；资治通鉴晋纪，太元二十年",
    people: [["tuoba-gui", "victor"], ["murong-chui", "later-yan-ruler"]],
    tags: ["北魏", "后燕", "参合陂"],
  },
  {
    id: "china-398-northern-wei-pingcheng",
    year: 398,
    title: "北魏定都平城",
    titleEn: "Northern Wei establishes Pingcheng as capital",
    type: "state-formation",
    summary: "拓跋珪称帝并营建平城，北魏从部族军事联盟进一步转为稳定王朝国家。",
    sourceId: "weishu",
    locator: "太祖纪，天兴元年",
    people: [["tuoba-gui", "founder"]],
    tags: ["北魏", "平城", "国家形成"],
  },
  {
    id: "china-409-liu-yu-destroys-southern-yan",
    year: 409,
    title: "刘裕灭南燕",
    titleEn: "Liu Yu destroys Southern Yan",
    type: "war",
    summary: "刘裕北伐攻克广固，南燕灭亡，东晋控制山东南部的军事声望显著上升。",
    sourceId: "songshu",
    locator: "武帝纪；资治通鉴晋纪，义熙五年",
    people: [["liu-yu-song-wudi", "commander"]],
    tags: ["刘裕北伐", "南燕", "广固"],
  },
  {
    id: "china-417-liu-yu-destroys-later-qin",
    year: 417,
    title: "刘裕灭后秦入长安",
    titleEn: "Liu Yu destroys Later Qin and enters Chang'an",
    type: "war",
    summary: "刘裕北伐灭后秦并进入长安，短暂恢复关中控制，是东晋末年北伐的最高点。",
    sourceId: "songshu",
    locator: "武帝纪；资治通鉴晋纪，义熙十三年",
    people: [["liu-yu-song-wudi", "commander"]],
    tags: ["刘裕北伐", "后秦", "长安"],
  },
  {
    id: "china-479-southern-qi-founded",
    year: 479,
    title: "萧道成代宋建齐",
    titleEn: "Xiao Daocheng founds Southern Qi",
    type: "dynastic-transition",
    summary: "萧道成受禅建立南齐，刘宋结束，南朝进入更频繁的宗室和权臣更替阶段。",
    sourceId: "nanqishu",
    locator: "高帝纪，建元元年",
    people: [["xiao-daocheng", "founder"]],
    tags: ["南齐", "刘宋", "禅代"],
  },
  {
    id: "china-502-liang-founded",
    year: 502,
    title: "萧衍代齐建梁",
    titleEn: "Xiao Yan founds Liang",
    type: "dynastic-transition",
    summary: "萧衍受禅建立梁朝，南齐结束，江南政权进入梁武帝长期统治阶段。",
    sourceId: "liangshu",
    locator: "武帝纪，天监元年",
    people: [["xiao-yan-liang-wudi", "founder"]],
    tags: ["梁", "南齐", "禅代"],
  },
  {
    id: "china-528-heyin-massacre",
    year: 528,
    title: "河阴之变",
    titleEn: "Heyin massacre",
    type: "rebellion",
    summary: "尔朱荣入洛阳并屠杀北魏朝臣，北魏中央政治秩序遭到决定性破坏。",
    sourceId: "weishu",
    locator: "孝庄帝纪；尔朱荣传；资治通鉴梁纪，大通二年",
    people: [["erzhu-rong", "power-broker"]],
    tags: ["北魏末年", "河阴", "尔朱荣"],
  },
  {
    id: "china-537-battle-of-shayuan",
    year: 537,
    title: "沙苑之战",
    titleEn: "Battle of Shayuan",
    type: "war",
    summary: "宇文泰在沙苑击败高欢，西魏得以稳住关中，东西魏长期对峙格局形成。",
    sourceId: "zhoushu",
    locator: "文帝纪；资治通鉴梁纪，大同三年",
    people: [["yuwen-tai", "victor"], ["gao-huan", "defeated-commander"]],
    tags: ["东魏", "西魏", "沙苑"],
  },
  {
    id: "china-546-battle-of-yubi",
    year: 546,
    title: "玉壁之战",
    titleEn: "Battle of Yubi",
    type: "war",
    summary: "高欢围攻西魏玉壁不克，东魏西进受挫，东西魏力量对峙继续维持。",
    sourceId: "zhoushu",
    locator: "文帝纪；资治通鉴梁纪，大同十二年",
    people: [["gao-huan", "attacker"], ["yuwen-tai", "western-wei-leader"]],
    tags: ["东魏", "西魏", "玉壁"],
  },
  {
    id: "china-552-hou-jing-rebellion-ends",
    year: 552,
    title: "侯景之乱平定",
    titleEn: "Hou Jing rebellion is suppressed",
    type: "rebellion",
    summary: "王僧辩、陈霸先等军队收复建康，侯景败死；梁朝虽复都城，但江南政权结构已被严重削弱。",
    sourceId: "liangshu",
    locator: "侯景传；元帝纪；资治通鉴梁纪，承圣元年",
    people: [["hou-jing", "defeated-rebel"], ["wang-sengbian", "commander"], ["chen-baxian", "commander"]],
    tags: ["侯景之乱", "建康", "梁"],
  },
  {
    id: "china-553-western-wei-takes-yizhou",
    year: 553,
    title: "西魏取益州",
    titleEn: "Western Wei takes Yizhou",
    type: "war",
    summary: "西魏取得益州，梁在巴蜀的控制瓦解，关陇集团获得重要西南资源区。",
    sourceId: "zhoushu",
    locator: "文帝纪；资治通鉴梁纪，承圣二年",
    people: [["yuwen-tai", "western-wei-leader"]],
    tags: ["西魏", "益州", "梁末"],
  },
  {
    id: "china-554-western-wei-sacks-jiangling",
    year: 554,
    title: "西魏攻陷江陵",
    titleEn: "Western Wei captures Jiangling",
    type: "war",
    summary: "西魏攻陷江陵，梁元帝被杀，梁朝在长江中游的政治中心崩解。",
    sourceId: "liangshu",
    locator: "元帝纪；资治通鉴梁纪，承圣三年",
    people: [["xiao-yi-liang-yuandi", "defeated-ruler"], ["yuwen-tai", "western-wei-leader"]],
    tags: ["江陵", "梁末", "西魏"],
  },
  {
    id: "china-580-yang-jian-regency",
    year: 580,
    title: "杨坚辅政北周",
    titleEn: "Yang Jian takes the Northern Zhou regency",
    type: "dynastic-transition",
    summary: "北周宣帝死后，杨坚以外戚身份辅政并掌握朝局，为次年代周建隋铺路。",
    sourceId: "suishu",
    locator: "高祖纪；周书·宣帝纪；资治通鉴陈纪，太建十二年",
    people: [["yang-jian-sui-wendi", "regent"]],
    tags: ["北周", "杨坚", "隋前夜"],
  },
  {
    id: "china-588-sui-launches-chen-campaign",
    year: 588,
    title: "隋军大举伐陈",
    titleEn: "Sui launches the campaign against Chen",
    type: "war",
    summary: "隋朝调集诸军南下伐陈，长江防线全面承压，南北统一进入最后军事阶段。",
    sourceId: "suishu",
    locator: "高祖纪，开皇八年；资治通鉴陈纪，祯明二年",
    people: [["yang-jian-sui-wendi", "ruler"], ["chen-shubao", "defending-ruler"]],
    tags: ["隋灭陈", "长江", "统一战争"],
  },
];

const claims = [
  ["claim:china-310-589:eastern-jin-western-expansion", "event-chain", "347 年桓温灭成汉使东晋重新取得益州，是东晋南渡后少数成功扩大控制区的军事行动。", "The conquest of Cheng-Han in 347 returned Yizhou to Eastern Jin authority and became one of the few successful expansions after the southern migration.", 347, "china-347-huan-wen-conquers-cheng-han", "jinshu"],
  ["claim:china-310-589:former-qin-before-fei", "event-chain", "376 年前秦统一北方解释了 383 年苻坚为何能发动大规模南征。", "Former Qin's northern unification in 376 explains why Fu Jian could launch the large southern campaign of 383.", 376, "china-376-former-qin-unifies-north", "zizhi-tongjian-jin"],
  ["claim:china-310-589:northern-wei-rise", "event-chain", "395 年参合陂和 398 年平城建都共同标志北魏从边地政权转向北方强国。", "Canhe Slope in 395 and the Pingcheng capital in 398 mark Northern Wei's shift into a major northern power.", 398, "china-398-northern-wei-pingcheng", "weishu"],
  ["claim:china-310-589:liu-yu-northern-expeditions", "event-chain", "409 年灭南燕和 417 年灭后秦奠定刘裕受禅建宋的军事威望。", "Liu Yu's victories over Southern Yan and Later Qin created the military prestige behind his foundation of Liu Song.", 417, "china-417-liu-yu-destroys-later-qin", "songshu"],
  ["claim:china-310-589:southern-dynasty-transitions", "dynastic-pattern", "479 年南齐和 502 年梁的建立显示南朝政权更替主要通过权臣禅代完成。", "The foundations of Southern Qi and Liang show the Southern Dynasties' pattern of abdication to dominant ministers.", 502, "china-502-liang-founded", "liangshu"],
  ["claim:china-310-589:northern-wei-collapse", "event-chain", "528 年河阴之变和 534 年北魏分裂之间存在直接的北魏中央秩序崩解链条。", "The Heyin massacre and the 534 split belong to the same collapse chain of Northern Wei central authority.", 534, "china-534-northern-wei-splits", "weishu"],
  ["claim:china-310-589:east-west-wei-balance", "military-balance", "537 年沙苑和 546 年玉壁说明西魏在关中顶住东魏压力，维持了东西魏对峙。", "Shayuan and Yubi show Western Wei holding Guanzhong against Eastern Wei pressure.", 546, "china-546-battle-of-yubi", "zhoushu"],
  ["claim:china-310-589:liang-collapse-chain", "event-chain", "552 年侯景败亡并未恢复梁朝实力，553 年失蜀和 554 年江陵陷落继续推动梁朝崩解。", "Hou Jing's defeat did not restore Liang power; the loss of Yizhou and Jiangling continued Liang's collapse.", 554, "china-554-western-wei-sacks-jiangling", "liangshu"],
  ["claim:china-310-589:sui-final-unification", "event-chain", "580 年杨坚辅政、581 年建隋、588 年伐陈和 589 年灭陈构成隋完成统一的最后链条。", "Yang Jian's regency, the Sui foundation, the Chen campaign, and Chen's fall form the final reunification chain.", 589, "china-589-sui-conquers-chen", "suishu"],
];

try {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("BEGIN;");

  const insertSource = db.prepare(`
    INSERT OR IGNORE INTO sources (
      id, title, author, type, citation_short, url, language, corpus_id, note, raw_json,
      original_title, source_type, date_label, reliability_level, review_status
    )
    VALUES (?, ?, ?, ?, ?, NULL, 'zh-Hans', ?, ?, ?, ?, ?, '正史/编年', 'high', 'reviewed')
  `);
  for (const [id, title, author, type, citation, note] of fallbackSources) {
    insertSource.run(id, title, author, type, citation, corpusId, note, json({ sourceUse: "310-589 China expansion" }), title, type);
  }

  const insertEntity = db.prepare(`
    INSERT OR REPLACE INTO entities (
      id, entity_type, primary_label, civilization_id, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    )
    VALUES (?, 'person', ?, ?, ?, ?, ?, ?, 'medium', 'reviewed', ?)
  `);
  const insertEntityI18n = db.prepare(`
    INSERT OR REPLACE INTO entity_i18n (entity_id, locale, primary_label, summary, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertAlias = db.prepare(`
    INSERT OR REPLACE INTO entity_aliases (
      id, entity_id, value, alias_type, language, context_source_id, valid_start, valid_end, raw_json
    )
    VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?)
  `);
  for (const [id, name, nameEn, birth, death, polity, summary, aliases] of people) {
    const entityId = `person:${id}`;
    insertEntity.run(entityId, name, civilizationId, regionId, birth, death, `${summary} 主要政治归属：${polity}。`, json({ polity, nameEn }));
    insertEntityI18n.run(entityId, "zh", name, `${summary} 主要政治归属：${polity}。`, json({}));
    insertEntityI18n.run(entityId, "en", nameEn, `${nameEn} belongs to the ${polity} context in the 310-589 China dataset. ${summary}`, json({ machineDraft: true }));
    [nameEn, ...aliases].forEach((alias, index) => {
      insertAlias.run(`alias:${id}:core-expansion:${index}`, entityId, alias, alias === nameEn ? "english-name" : "alternate-name", alias === nameEn ? "en" : "zh-Hans", json({}));
    });
  }

  const insertTopic = db.prepare(`
    INSERT OR REPLACE INTO topics (id, label, parent_topic_id, description, raw_json)
    VALUES (?, ?, NULL, ?, ?)
  `);
  const topicLabels = {
    "dynastic-transition": "王朝更替",
    rebellion: "叛乱与内战",
    "state-formation": "政权形成",
    unification: "统一战争",
    war: "战争",
  };
  for (const type of new Set(events.map((event) => event.type))) {
    insertTopic.run(type, topicLabels[type] ?? type, `310-589 中国段事件主题：${topicLabels[type] ?? type}`, json({ periodId }));
  }

  const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO events (
      id, title, event_type, time_start, time_end, display_time, region_id, place_entity_id,
      summary, confidence, review_status, raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'reviewed', ?)
  `);
  const insertEventI18n = db.prepare(`
    INSERT OR REPLACE INTO event_i18n (event_id, locale, title, display_time, summary, raw_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertEventEntity = db.prepare(`
    INSERT OR REPLACE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMention = db.prepare(`
    INSERT OR REPLACE INTO source_mentions (
      id, source_id, passage_id, work_title, book_title, chapter_title, locator, year,
      text, translation, confidence, review_status, raw_json
    )
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'reviewed', ?)
  `);
  const insertEvidence = db.prepare(`
    INSERT OR REPLACE INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote,
      evidence_role, confidence, raw_json
    )
    VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, 'support', ?, ?)
  `);
  const insertDoc = db.prepare(`
    INSERT OR REPLACE INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id,
      time_start, time_end, review_status, raw_json
    )
    VALUES (?, ?, ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'reviewed', ?)
  `);
  const sourceLookup = new Map(db.prepare("SELECT id, title, citation_short FROM sources").all().map((source) => [source.id, source]));

  for (const event of events) {
    const source = sourceLookup.get(event.sourceId);
    const confidence = event.sourceId.startsWith("zizhi") ? "medium" : "high";
    insertEvent.run(
      event.id,
      event.title,
      event.type,
      event.year,
      event.year,
      `${event.year} 年`,
      regionId,
      event.summary,
      confidence,
      json({ tags: event.tags, sourceId: event.sourceId, locator: event.locator, expansionBatch: batchId })
    );
    insertEventI18n.run(event.id, "zh", event.title, `${event.year} 年`, event.summary, json({}));
    insertEventI18n.run(event.id, "en", event.titleEn, `${event.year} CE`, event.summary, json({ machineDraft: true }));

    event.people.forEach(([personId, role], index) => {
      insertEventEntity.run(event.id, `person:${personId}`, role, index, json({ expansionBatch: batchId }));
    });

    const mentionId = `${periodId}:${event.id}:core-expansion`;
    const workTitle = source?.title ?? event.sourceId;
    const citation = source?.citation_short ?? workTitle;
    const locatorText = `${citation}，${event.locator}`;
    const mentionText = `原文待摘录：${locatorText}。本条为 locator-level 证据，只标明古籍位置，不以概述冒充原文。`;
    insertMention.run(
      mentionId,
      event.sourceId,
      workTitle,
      citation,
      event.title,
      event.locator,
      event.year,
      mentionText,
      event.summary,
      confidence,
      json({
        eventId: event.id,
        people: event.people.map(([personId]) => personId),
        tags: event.tags,
        originalTextStatus: "not-yet-transcribed",
        evidenceTier: "locator-level",
      })
    );
    insertEvidence.run(`${mentionId}:event`, "events", event.id, event.sourceId, mentionId, event.locator, confidence, json({ originalTextStatus: "not-yet-transcribed" }));
    insertEvidence.run(`${mentionId}:mention`, "source_mentions", mentionId, event.sourceId, mentionId, event.locator, confidence, json({ originalTextStatus: "not-yet-transcribed" }));
    insertDoc.run(
      `event:${event.id}`,
      "events",
      event.id,
      event.title,
      compactText([
        event.title,
        event.summary,
        `来源：${locatorText}`,
        `人物：${event.people.map(([personId]) => people.find(([id]) => id === personId)?.[1] ?? personId).join("、")}`,
        `标签：${event.tags.join("、")}`,
      ]),
      regionId,
      periodId,
      event.type,
      event.year,
      event.year,
      json({ sourceId: event.sourceId, locator: event.locator, originalText: null, originalTextStatus: "not-yet-transcribed", tags: event.tags })
    );
    insertDoc.run(
      `source-mention:${mentionId}`,
      "source_mentions",
      mentionId,
      `${event.title}：史料定位`,
      compactText([mentionText, event.summary, `来源：${locatorText}`]),
      regionId,
      periodId,
      event.type,
      event.year,
      event.year,
      json({ sourceId: event.sourceId, locator: event.locator, originalText: null, originalTextStatus: "not-yet-transcribed" })
    );
  }

  const attachExistingEventEntity = db.prepare(`
    INSERT OR REPLACE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  const existingEventLinks = [
    ["china-550-northern-qi-founded", "person:gao-yang-northern-qi", "founder", 0],
    ["china-557-northern-zhou-and-chen", "person:yuwen-jue", "northern-zhou-founder", 0],
    ["china-557-northern-zhou-and-chen", "person:chen-baxian", "chen-founder", 1],
    ["china-577-northern-zhou-destroys-qi", "person:yuwen-yong-zhou-wudi", "ruler", 0],
  ];
  for (const [eventId, entityId, role, sortOrder] of existingEventLinks) {
    attachExistingEventEntity.run(eventId, entityId, role, sortOrder, json({ expansionBatch: batchId }));
  }

  const insertClaim = db.prepare(`
    INSERT OR REPLACE INTO evidence_claims (
      id, claim_type, statement_zh, statement_en, time_start, time_end, region_id,
      period_id, confidence, review_status, dispute_status, raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'medium', 'reviewed', 'none', ?)
  `);
  const insertClaimSource = db.prepare(`
    INSERT OR REPLACE INTO evidence_claim_sources (
      claim_id, source_id, mention_id, passage_id, locator, quote, source_role, confidence, raw_json
    )
    VALUES (?, ?, ?, NULL, ?, NULL, 'support', 'medium', ?)
  `);
  const insertClaimSubject = db.prepare(`
    INSERT OR REPLACE INTO evidence_claim_subjects (
      claim_id, subject_table, subject_id, subject_role, sort_order, raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const [claimId, claimType, statementZh, statementEn, year, eventId, sourceId] of claims) {
    const event = events.find((item) => item.id === eventId);
    const mentionId = event ? `${periodId}:${eventId}:core-expansion` : null;
    insertClaim.run(claimId, claimType, statementZh, statementEn, year, year, regionId, periodId, json({ expansionBatch: batchId }));
    insertClaimSource.run(claimId, sourceId, mentionId, event?.locator ?? null, json({ expansionBatch: batchId }));
    insertClaimSubject.run(claimId, "events", eventId, "event", 0, json({ expansionBatch: batchId }));
  }

  db.exec("COMMIT;");
  console.log(`Seeded ${people.length} people, ${events.length} events, ${claims.length} claims for 310-589 China core expansion.`);
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
} finally {
  db.close();
}
