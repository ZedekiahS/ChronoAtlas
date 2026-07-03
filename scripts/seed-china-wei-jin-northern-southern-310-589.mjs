import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-wei-jin-northern-southern-310-589";
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

const sources = [
  {
    id: "jinshu",
    title: "晋书",
    author: "房玄龄等",
    type: "official-history",
    citation: "《晋书》",
    note: "西晋、东晋与十六国人物和纪传的主要正史来源；需结合《资治通鉴》校年。",
    dateLabel: "唐修正史",
    reliability: "high",
  },
  {
    id: "zizhi-tongjian-jin",
    title: "资治通鉴·晋纪",
    author: "司马光",
    type: "chronicle",
    citation: "《资治通鉴·晋纪》",
    note: "310-420 编年主干，适合事件时间线、人物关系和政权更替校年。",
    dateLabel: "北宋编年史",
    reliability: "high",
  },
  {
    id: "songshu",
    title: "宋书",
    author: "沈约",
    type: "official-history",
    citation: "《宋书》",
    note: "刘宋本纪、列传、州郡志是 420-479 南朝主干。",
    dateLabel: "南朝梁修史",
    reliability: "high",
  },
  {
    id: "nanqishu",
    title: "南齐书",
    author: "萧子显",
    type: "official-history",
    citation: "《南齐书》",
    note: "南齐短期政权和宗室政治主干。",
    dateLabel: "南朝梁修史",
    reliability: "high",
  },
  {
    id: "liangshu",
    title: "梁书",
    author: "姚思廉",
    type: "official-history",
    citation: "《梁书》",
    note: "梁武帝、侯景之乱和梁末分裂的核心纪传来源。",
    dateLabel: "唐修正史",
    reliability: "high",
  },
  {
    id: "chenshu",
    title: "陈书",
    author: "姚思廉",
    type: "official-history",
    citation: "《陈书》",
    note: "陈朝建国、江南后期政治和隋灭陈主干。",
    dateLabel: "唐修正史",
    reliability: "high",
  },
  {
    id: "weishu",
    title: "魏书",
    author: "魏收",
    type: "official-history",
    citation: "《魏书》",
    note: "北魏兴起、统一北方、孝文帝改革和北魏晚期的核心正史来源。",
    dateLabel: "北齐修史",
    reliability: "high",
  },
  {
    id: "beiqishu",
    title: "北齐书",
    author: "李百药",
    type: "official-history",
    citation: "《北齐书》",
    note: "东魏、北齐高氏政权主干。",
    dateLabel: "唐修正史",
    reliability: "high",
  },
  {
    id: "zhoushu",
    title: "周书",
    author: "令狐德棻等",
    type: "official-history",
    citation: "《周书》",
    note: "西魏、北周宇文氏政权和北周灭齐的主干。",
    dateLabel: "唐修正史",
    reliability: "high",
  },
  {
    id: "suishu",
    title: "隋书",
    author: "魏徵等",
    type: "official-history",
    citation: "《隋书》",
    note: "北周入隋、隋灭陈及制度地理总结的重要来源。",
    dateLabel: "唐修正史",
    reliability: "high",
  },
  {
    id: "nanshi",
    title: "南史",
    author: "李延寿",
    type: "summary-history",
    citation: "《南史》",
    note: "宋齐梁陈汇总，可补人物传记和南朝脉络；事件校年仍优先正史本纪与《资治通鉴》。",
    dateLabel: "唐修史",
    reliability: "medium",
  },
  {
    id: "beishi",
    title: "北史",
    author: "李延寿",
    type: "summary-history",
    citation: "《北史》",
    note: "北魏、北齐、北周、隋前期汇总，可补人物传记和北朝脉络。",
    dateLabel: "唐修史",
    reliability: "medium",
  },
  {
    id: "shuijingzhu",
    title: "水经注",
    author: "郦道元",
    type: "geography",
    citation: "《水经注》",
    note: "北魏地理、河流、城邑和道路背景的重要辅助资料，适合后续地图证据。",
    dateLabel: "北魏地理注",
    reliability: "medium",
  },
];

const people = [
  ["liu-yuan-han-zhao", "刘渊", "Liu Yuan", 251, 310, "汉赵", "匈奴刘氏政权建立者，304 年称汉王，是西晋北方秩序崩解的重要节点。", ["元海"]],
  ["sima-chi-jin-huai", "晋怀帝", "Emperor Huai of Jin", 284, 313, "西晋", "西晋皇帝，永嘉之乱中洛阳陷落后被俘。", ["司马炽"]],
  ["sima-ye-jin-min", "晋愍帝", "Emperor Min of Jin", 300, 318, "西晋", "西晋末帝，316 年长安失守后出降汉赵。", ["司马邺"]],
  ["sima-rui-jin-yuan", "晋元帝", "Emperor Yuan of Jin", 276, 323, "东晋", "司马睿在建康建立东晋，是晋室南渡后的皇权核心。", ["司马睿"]],
  ["wang-dao", "王导", "Wang Dao", 276, 339, "东晋", "东晋建立初期的士族政治核心，协助司马睿稳定江东。", ["茂弘"]],
  ["zu-ti", "祖逖", "Zu Ti", 266, 321, "东晋", "东晋北伐代表人物，象征晋室南渡后恢复中原的努力。", ["士稚"]],
  ["shi-le", "石勒", "Shi Le", 274, 333, "后赵", "后赵建立者，329 年灭前赵，重塑十六国北方格局。", []],
  ["fu-jian", "苻坚", "Fu Jian", 338, 385, "前秦", "前秦皇帝，统一北方后南征东晋，383 年淝水战败。", ["永固"]],
  ["xie-an", "谢安", "Xie An", 320, 385, "东晋", "东晋宰辅，淝水之战前后主持朝局。", ["安石"]],
  ["liu-yu-song-wudi", "刘裕", "Liu Yu", 363, 422, "刘宋", "东晋末年军政领袖，420 年受禅建宋，开启南朝。", ["德舆", "宋武帝"]],
  ["tuoba-tao", "拓跋焘", "Tuoba Tao", 408, 452, "北魏", "北魏太武帝，439 年灭北凉，完成北方统一。", ["太武帝"]],
  ["emperor-xiaowen-northern-wei", "北魏孝文帝", "Emperor Xiaowen of Northern Wei", 467, 499, "北魏", "北魏改革核心皇帝，493 年迁都洛阳，推动制度与文化转型。", ["拓跋宏", "元宏"]],
  ["erzhu-rong", "尔朱荣", "Erzhu Rong", 493, 530, "北魏", "北魏末年军事强人，六镇之后介入朝政，推动北魏晚期崩解。", []],
  ["gao-huan", "高欢", "Gao Huan", 496, 547, "东魏", "东魏实际掌权者，北魏分裂后控制东部政权。", ["贺六浑"]],
  ["yuwen-tai", "宇文泰", "Yuwen Tai", 507, 556, "西魏", "西魏实际掌权者，北周制度和关陇集团的重要奠基者。", []],
  ["hou-jing", "侯景", "Hou Jing", 503, 552, "梁", "东魏降将，548 年发动侯景之乱，重创梁朝江南秩序。", []],
  ["yang-jian-sui-wendi", "杨坚", "Yang Jian", 541, 604, "隋", "北周外戚与权臣，581 年代周建隋，589 年完成统一。", ["隋文帝"]],
  ["chen-shubao", "陈叔宝", "Chen Shubao", 553, 604, "陈", "陈后主，589 年隋军入建康后陈亡。", ["陈后主"]],
];

const events = [
  {
    id: "china-304-liu-yuan-han-zhao",
    year: 304,
    title: "刘渊起兵称汉王",
    titleEn: "Liu Yuan proclaims Han kingship",
    type: "state-formation",
    summary: "刘渊以汉赵政权名义聚合匈奴与北方反晋力量，西晋北方控制开始出现制度性裂缝。",
    sourceId: "zizhi-tongjian-jin",
    locator: "晋纪，永兴元年前后",
    people: [["liu-yuan-han-zhao", "founder"]],
    tags: ["十六国", "汉赵", "西晋崩溃"],
  },
  {
    id: "china-311-yongjia-luoyang",
    year: 311,
    title: "永嘉之乱：洛阳陷落",
    titleEn: "Disaster of Yongjia: Luoyang falls",
    type: "war",
    summary: "汉赵军攻陷洛阳，晋怀帝被俘，西晋中枢崩溃，北方进入长期割据与迁徙阶段。",
    sourceId: "jinshu",
    locator: "怀帝纪；资治通鉴晋纪，永嘉五年",
    people: [["sima-chi-jin-huai", "captured"], ["liu-yuan-han-zhao", "regime-founder"]],
    tags: ["永嘉之乱", "洛阳", "西晋"],
  },
  {
    id: "china-316-changan-falls-western-jin",
    year: 316,
    title: "长安失守，西晋灭亡",
    titleEn: "Chang'an falls and Western Jin ends",
    type: "collapse",
    summary: "晋愍帝在长安出降汉赵，西晋政权结束，晋室重心转向江南。",
    sourceId: "jinshu",
    locator: "愍帝纪；资治通鉴晋纪，建兴四年",
    people: [["sima-ye-jin-min", "captured"]],
    tags: ["西晋灭亡", "长安", "汉赵"],
  },
  {
    id: "china-317-eastern-jin-jiankang",
    year: 317,
    title: "司马睿建晋于建康",
    titleEn: "Sima Rui establishes Eastern Jin at Jiankang",
    type: "state-formation",
    summary: "司马睿依托江东士族在建康建立东晋，形成南北分裂的长期格局。",
    sourceId: "jinshu",
    locator: "元帝纪；王导传",
    people: [["sima-rui-jin-yuan", "founder"], ["wang-dao", "minister"]],
    tags: ["东晋", "建康", "南渡"],
  },
  {
    id: "china-321-zu-ti-northern-expedition",
    year: 321,
    title: "祖逖北伐受挫",
    titleEn: "Zu Ti's northern expedition stalls",
    type: "war",
    summary: "祖逖北伐一度收复黄河以南部分地区，但东晋内部支持不足，恢复中原的早期努力难以持续。",
    sourceId: "jinshu",
    locator: "祖逖传；资治通鉴晋纪，太兴至永昌年间",
    people: [["zu-ti", "commander"]],
    tags: ["北伐", "东晋", "中原"],
  },
  {
    id: "china-329-later-zhao-destroys-former-zhao",
    year: 329,
    title: "后赵灭前赵",
    titleEn: "Later Zhao destroys Former Zhao",
    type: "war",
    summary: "石勒集团灭前赵，北方格局由汉赵残余转向后赵主导，十六国政权竞争进入新阶段。",
    sourceId: "jinshu",
    locator: "载记：刘曜、石勒；资治通鉴晋纪，咸和四年",
    people: [["shi-le", "victor"]],
    tags: ["后赵", "前赵", "十六国"],
  },
  {
    id: "china-383-fei-river",
    year: 383,
    title: "淝水之战",
    titleEn: "Battle of Fei River",
    type: "war",
    summary: "前秦苻坚南征东晋失败，北方统一局面瓦解，东晋江南政权得以延续。",
    sourceId: "zizhi-tongjian-jin",
    locator: "晋纪，太元八年；晋书·谢安传、苻坚载记",
    people: [["fu-jian", "defeated-ruler"], ["xie-an", "jin-minister"]],
    tags: ["淝水", "前秦", "东晋"],
  },
  {
    id: "china-420-liu-yu-founds-song",
    year: 420,
    title: "刘裕受禅建宋",
    titleEn: "Liu Yu founds Liu Song",
    type: "dynastic-transition",
    summary: "刘裕代晋建宋，东晋结束，南朝宋齐梁陈的政权循环开始。",
    sourceId: "songshu",
    locator: "武帝纪；资治通鉴宋纪，永初元年",
    people: [["liu-yu-song-wudi", "founder"]],
    tags: ["刘宋", "南朝", "禅代"],
  },
  {
    id: "china-439-northern-wei-unifies-north",
    year: 439,
    title: "北魏灭北凉，统一北方",
    titleEn: "Northern Wei unifies North China",
    type: "war",
    summary: "北魏太武帝灭北凉，结束十六国以来北方长期多政权并立局面，形成南北朝对峙。",
    sourceId: "weishu",
    locator: "世祖纪；资治通鉴宋纪，元嘉十六年",
    people: [["tuoba-tao", "ruler"]],
    tags: ["北魏", "北凉", "南北朝"],
  },
  {
    id: "china-493-xiaowen-luoyang",
    year: 493,
    title: "北魏孝文帝迁都洛阳",
    titleEn: "Emperor Xiaowen moves the Northern Wei capital to Luoyang",
    type: "reform",
    summary: "北魏迁都洛阳，配合官制、礼制、姓氏和婚姻政策改革，推动北魏政治文化转型。",
    sourceId: "weishu",
    locator: "高祖纪；资治通鉴齐纪，太和十七年",
    people: [["emperor-xiaowen-northern-wei", "reformer"]],
    tags: ["北魏改革", "洛阳", "孝文帝"],
  },
  {
    id: "china-523-six-garrisons",
    year: 523,
    title: "六镇起事",
    titleEn: "Six Garrisons uprising begins",
    type: "rebellion",
    summary: "北魏北边军镇矛盾爆发，六镇起事引发连锁动荡，最终撼动北魏国家结构。",
    sourceId: "weishu",
    locator: "肃宗纪；资治通鉴梁纪，正光四年",
    people: [["erzhu-rong", "later-power-broker"]],
    tags: ["六镇", "北魏末年", "军镇"],
  },
  {
    id: "china-534-northern-wei-splits",
    year: 534,
    title: "北魏分裂为东魏、西魏",
    titleEn: "Northern Wei splits into Eastern and Western Wei",
    type: "state-fragmentation",
    summary: "高欢与宇文泰分别控制东西两端，北魏分裂为东魏和西魏，北朝格局重组。",
    sourceId: "beishi",
    locator: "魏本纪；资治通鉴梁纪，中大通至大同年间",
    people: [["gao-huan", "eastern-power"], ["yuwen-tai", "western-power"]],
    tags: ["东魏", "西魏", "北魏分裂"],
  },
  {
    id: "china-548-hou-jing-rebellion",
    year: 548,
    title: "侯景之乱爆发",
    titleEn: "Hou Jing rebellion begins",
    type: "rebellion",
    summary: "侯景叛梁并围攻建康，梁朝政治和江南社会秩序遭受重创。",
    sourceId: "liangshu",
    locator: "武帝纪；侯景传；资治通鉴梁纪，太清二年",
    people: [["hou-jing", "rebel"]],
    tags: ["侯景之乱", "梁", "建康"],
  },
  {
    id: "china-550-northern-qi-founded",
    year: 550,
    title: "高氏代东魏建北齐",
    titleEn: "Gao clan founds Northern Qi",
    type: "dynastic-transition",
    summary: "高洋代东魏建北齐，东魏权力由高欢集团正式转为高氏皇朝。",
    sourceId: "beiqishu",
    locator: "文宣帝纪；资治通鉴梁纪，武定八年",
    people: [["gao-huan", "dynastic-founder-family"]],
    tags: ["北齐", "东魏", "禅代"],
  },
  {
    id: "china-557-northern-zhou-and-chen",
    year: 557,
    title: "北周、陈相继建立",
    titleEn: "Northern Zhou and Chen are founded",
    type: "dynastic-transition",
    summary: "宇文氏代西魏建北周，陈霸先代梁建陈，南北双方都进入新王朝阶段。",
    sourceId: "zhoushu",
    locator: "孝闵帝纪；陈书·高祖纪；资治通鉴陈纪，永定元年",
    people: [["yuwen-tai", "dynastic-founder-family"]],
    tags: ["北周", "陈", "南北朝"],
  },
  {
    id: "china-577-northern-zhou-destroys-qi",
    year: 577,
    title: "北周灭北齐",
    titleEn: "Northern Zhou destroys Northern Qi",
    type: "war",
    summary: "北周攻灭北齐，北方再次统一，为隋代周和南北统一创造条件。",
    sourceId: "zhoushu",
    locator: "武帝纪；资治通鉴陈纪，太建九年",
    people: [["yuwen-tai", "state-founder-background"]],
    tags: ["北周", "北齐", "北方统一"],
  },
  {
    id: "china-581-sui-founded",
    year: 581,
    title: "杨坚代周建隋",
    titleEn: "Yang Jian founds Sui",
    type: "dynastic-transition",
    summary: "杨坚受禅建立隋朝，北周结束，北方统一政权进入隋代。",
    sourceId: "suishu",
    locator: "高祖纪；资治通鉴陈纪，开皇元年",
    people: [["yang-jian-sui-wendi", "founder"]],
    tags: ["隋", "北周", "禅代"],
  },
  {
    id: "china-589-sui-conquers-chen",
    year: 589,
    title: "隋灭陈，南北统一",
    titleEn: "Sui conquers Chen and reunifies China",
    type: "unification",
    summary: "隋军攻入建康，陈后主出降，南北朝结束，重新形成统一王朝。",
    sourceId: "suishu",
    locator: "高祖纪；陈书·后主纪；资治通鉴陈纪，祯明三年",
    people: [["yang-jian-sui-wendi", "unifier"], ["chen-shubao", "defeated-ruler"]],
    tags: ["隋灭陈", "统一", "南北朝结束"],
  },
];

try {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("BEGIN;");

  db.prepare(`
    INSERT OR REPLACE INTO civilizations (id, label, region_id, time_start, time_end, summary, review_status, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, 'reviewed', ?)
  `).run(
    civilizationId,
    "魏晋南北朝中国",
    regionId,
    310,
    589,
    "西晋崩溃后，东晋十六国、南北朝对峙并最终由隋完成统一的中国历史阶段。",
    json({ kind: "civilization" })
  );

  db.prepare(`
    INSERT OR REPLACE INTO periods (id, label, time_start, time_end, region_id, civilization_id, period_type, summary, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    periodId,
    "魏晋南北朝 310-589",
    310,
    589,
    regionId,
    civilizationId,
    "macro-period",
    "五胡十六国、东晋、南北朝到隋灭陈的完整中国段；第一轮作为 190-310 三国范例之后的同构资料库骨架。",
    json({ follows: "china-three-kingdoms-180-280", sourcePlan: ["晋书", "资治通鉴", "南北朝正史"] })
  );

  db.prepare(`
    INSERT OR REPLACE INTO corpora (id, name, region, description, civilization_id, default_language, time_start, time_end, review_status, raw_json)
    VALUES (?, ?, ?, ?, ?, 'zh-Hans', 310, 589, 'reviewed', ?)
  `).run(
    corpusId,
    "中国魏晋南北朝资料库",
    regionId,
    "ChronoAtlas 310-589 中国段人物、事件、正史和编年证据骨架。",
    civilizationId,
    json({ sourceLevel: "locator-first", originalTextPolicy: "逐条补古籍原文，不伪造原文摘录" })
  );

  const insertSource = db.prepare(`
    INSERT OR REPLACE INTO sources (
      id, title, author, type, citation_short, url, language, corpus_id, note, raw_json,
      original_title, source_type, date_label, date_start, date_end, reliability_level, review_status
    )
    VALUES (?, ?, ?, ?, ?, NULL, 'zh-Hans', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 'reviewed')
  `);
  for (const source of sources) {
    insertSource.run(
      source.id,
      source.title,
      source.author,
      source.type,
      source.citation,
      corpusId,
      source.note,
      json({ sourceUse: "310-589 China", originalTextStatus: "locator-first" }),
      source.title,
      source.type,
      source.dateLabel,
      source.reliability
    );
  }

  const insertEntity = db.prepare(`
    INSERT OR REPLACE INTO entities (id, entity_type, primary_label, civilization_id, region_id, time_start, time_end, summary, confidence, review_status, raw_json)
    VALUES (?, 'person', ?, ?, ?, ?, ?, ?, 'medium', 'reviewed', ?)
  `);
  const insertEntityI18n = db.prepare(`
    INSERT OR REPLACE INTO entity_i18n (entity_id, locale, primary_label, summary, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertAlias = db.prepare(`
    INSERT OR REPLACE INTO entity_aliases (id, entity_id, value, alias_type, language, context_source_id, valid_start, valid_end, raw_json)
    VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?)
  `);
  for (const [id, name, nameEn, birth, death, polity, summary, aliases] of people) {
    insertEntity.run(`person:${id}`, name, civilizationId, regionId, birth, death, `${summary} 主要政治归属：${polity}。`, json({ polity, nameEn }));
    insertEntityI18n.run(`person:${id}`, "zh", name, `${summary} 主要政治归属：${polity}。`, json({}));
    insertEntityI18n.run(`person:${id}`, "en", nameEn, `${nameEn} belongs to the ${polity} context in the 310-589 China dataset. ${summary}`, json({ machineDraft: true }));
    let aliasIndex = 0;
    for (const alias of [nameEn, ...aliases]) {
      insertAlias.run(`alias:${id}:${aliasIndex}`, `person:${id}`, alias, alias === nameEn ? "english-name" : "alternate-name", alias === nameEn ? "en" : "zh-Hans", json({}));
      aliasIndex += 1;
    }
  }

  const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO events (id, title, event_type, time_start, time_end, display_time, region_id, place_entity_id, summary, confidence, review_status, raw_json)
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
  const insertTopic = db.prepare(`
    INSERT OR REPLACE INTO topics (id, label, parent_topic_id, description, raw_json)
    VALUES (?, ?, NULL, ?, ?)
  `);
  const insertMention = db.prepare(`
    INSERT OR REPLACE INTO source_mentions (id, source_id, passage_id, work_title, book_title, chapter_title, locator, year, text, translation, confidence, review_status, raw_json)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'reviewed', ?)
  `);
  const insertEvidence = db.prepare(`
    INSERT OR REPLACE INTO evidence_links (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
    VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, 'support', ?, ?)
  `);
  const insertDoc = db.prepare(`
    INSERT OR REPLACE INTO search_documents (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
    VALUES (?, ?, ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'reviewed', ?)
  `);

  const topicLabels = {
    collapse: "政权崩溃",
    "dynastic-transition": "王朝更替",
    person: "人物",
    rebellion: "叛乱与内战",
    reform: "制度改革",
    "state-formation": "政权形成",
    "state-fragmentation": "政权分裂",
    unification: "统一战争",
    war: "战争",
  };
  for (const eventType of new Set(events.map((event) => event.type))) {
    insertTopic.run(eventType, topicLabels[eventType] ?? eventType, `310-589 中国段事件主题：${topicLabels[eventType] ?? eventType}`, json({ periodId }));
  }
  insertTopic.run("person", topicLabels.person, "人物档案与人物索引搜索主题。", json({ periodId }));

  for (const event of events) {
    insertEvent.run(
      event.id,
      event.title,
      event.type,
      event.year,
      event.year,
      `${event.year} 年`,
      regionId,
      event.summary,
      event.sourceId === "beishi" || event.sourceId === "nanshi" ? "medium" : "high",
      json({ tags: event.tags, sourceId: event.sourceId, locator: event.locator })
    );
    insertEventI18n.run(event.id, "zh", event.title, `${event.year} 年`, event.summary, json({}));
    insertEventI18n.run(event.id, "en", event.titleEn, `${event.year} CE`, event.summary, json({ machineDraft: true }));

    event.people.forEach(([personId, role], index) => {
      insertEventEntity.run(event.id, `person:${personId}`, role, index, json({}));
    });

    const source = sources.find((item) => item.id === event.sourceId);
    const mentionId = `${periodId}:${event.id}:mention`;
    insertMention.run(
      mentionId,
      event.sourceId,
      source?.title ?? event.sourceId,
      source?.citation ?? source?.title ?? event.sourceId,
      event.title,
      event.locator,
      event.year,
      `原文待摘录：${source?.citation ?? event.sourceId}，${event.locator}。本条先按卷次/本纪定位证据，不以概述冒充古籍原文。`,
      event.summary,
      event.sourceId === "beishi" || event.sourceId === "nanshi" ? "medium" : "high",
      json({
        eventId: event.id,
        people: event.people.map(([personId]) => personId),
        tags: event.tags,
        originalTextStatus: "not-yet-transcribed",
        note: "第一轮按正史/通鉴卷次建立 locator-level 证据；后续再逐条摘录古籍原文。"
      })
    );
    insertEvidence.run(
      `${periodId}:${event.id}:evidence`,
      "events",
      event.id,
      event.sourceId,
      mentionId,
      event.locator,
      event.sourceId === "beishi" || event.sourceId === "nanshi" ? "medium" : "high",
      json({ originalTextStatus: "not-yet-transcribed" })
    );
    insertEvidence.run(
      `${periodId}:${mentionId}:evidence`,
      "source_mentions",
      mentionId,
      event.sourceId,
      mentionId,
      event.locator,
      event.sourceId === "beishi" || event.sourceId === "nanshi" ? "medium" : "high",
      json({ originalTextStatus: "not-yet-transcribed" })
    );
    insertDoc.run(
      `event:${event.id}`,
      "events",
      event.id,
      event.title,
      compactText([event.title, event.summary, `来源：${source?.citation ?? event.sourceId} ${event.locator}`, `人物：${event.people.map(([personId]) => people.find(([id]) => id === personId)?.[1] ?? personId).join("、")}`, `标签：${event.tags.join("、")}`]),
      regionId,
      periodId,
      event.type,
      event.year,
      event.year,
      json({ sourceId: event.sourceId, locator: event.locator, originalText: null, tags: event.tags })
    );
    insertDoc.run(
      `source-mention:${mentionId}`,
      "source_mentions",
      mentionId,
      `${event.title}：史料定位`,
      compactText([event.summary, `来源：${source?.citation ?? event.sourceId}`, `定位：${event.locator}`, "原文状态：待按底本摘录，不以概述冒充原文。"]),
      regionId,
      periodId,
      event.type,
      event.year,
      event.year,
      json({ sourceId: event.sourceId, locator: event.locator, originalText: null, originalTextStatus: "not-yet-transcribed" })
    );
  }

  const personDoc = db.prepare(`
    INSERT OR REPLACE INTO search_documents (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
    VALUES (?, 'entities', ?, ?, ?, 'zh-Hans', ?, ?, 'person', ?, ?, 'reviewed', ?)
  `);
  for (const [id, name, nameEn, birth, death, polity, summary, aliases] of people) {
    personDoc.run(
      `entity:person:${id}`,
      `person:${id}`,
      name,
      compactText([name, nameEn, polity, summary, aliases.join("、")]),
      regionId,
      periodId,
      birth,
      death,
      json({ nameEn, polity, aliases })
    );
  }

  db.exec("COMMIT;");

  const counts = {
    events: db.prepare("SELECT COUNT(*) AS total FROM events WHERE id LIKE 'china-%' AND time_start BETWEEN 304 AND 589").get().total,
    people: db.prepare("SELECT COUNT(*) AS total FROM entities WHERE civilization_id = ? AND entity_type = 'person'").get(civilizationId).total,
    mentions: db.prepare("SELECT COUNT(*) AS total FROM source_mentions WHERE id LIKE ?").get(`${periodId}:%`).total,
    documents: db.prepare("SELECT COUNT(*) AS total FROM search_documents WHERE period_id = ?").get(periodId).total,
  };
  console.log(`Seeded ${periodId}: ${JSON.stringify(counts)}`);
} catch (error) {
  db.exec("ROLLBACK;");
  console.error(error);
  process.exitCode = 1;
} finally {
  db.close();
}
