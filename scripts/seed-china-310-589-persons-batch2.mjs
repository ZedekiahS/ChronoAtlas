import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
db.exec("PRAGMA foreign_keys = ON;");

const batchId = "manual-china-310-589-persons-batch2";
const regionId = "china";
const civilizationId = "china-wei-jin-northern-southern";
const periodId = "china-wei-jin-northern-southern-310-589";
const lifePrefix = "china-310-589-life2:";

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

function lifeLabel(birth, death) {
  if (birth && death) return `${birth}-${death}`;
  if (birth) return `${birth}-?`;
  if (death) return `?-${death}`;
  return "生卒未详";
}

const people = [
  {
    id: "person:sima-chi-jin-huaidi",
    name: "司马炽",
    nameEn: "Sima Chi",
    polity: "西晋",
    birth: 284,
    death: 313,
    summary: "西晋怀帝，永嘉之乱中洛阳陷落后被汉赵俘获，是西晋中央崩溃的标志性皇帝。",
    aliases: ["晋怀帝"],
    sourceId: "jinshu",
    locator: "晋书·怀帝纪",
    life: [["311", 311, "capture", "洛阳陷落被俘", "洛阳陷落后被汉赵军俘获，西晋中枢秩序崩溃。", "china-311-yongjia-luoyang"]],
  },
  {
    id: "person:sima-ye-jin-mindi",
    name: "司马邺",
    nameEn: "Sima Ye",
    polity: "西晋",
    birth: 300,
    death: 318,
    summary: "西晋愍帝，长安失守后出降，西晋由此灭亡。",
    aliases: ["晋愍帝"],
    sourceId: "jinshu",
    locator: "晋书·愍帝纪",
    life: [["316", 316, "deposition", "长安失守出降", "长安为汉赵所逼，愍帝出降，西晋灭亡。", "china-316-changan-falls-western-jin"]],
  },
  {
    id: "person:liu-cong-han-zhao",
    name: "刘聪",
    nameEn: "Liu Cong",
    polity: "汉赵",
    birth: null,
    death: 318,
    summary: "汉赵昭武帝，在永嘉之乱和长安陷落中推动对西晋的决定性打击。",
    aliases: ["汉赵昭武帝"],
    sourceId: "jinshu",
    locator: "晋书·刘聪载记",
    life: [["311", 311, "war", "攻陷洛阳", "汉赵军攻陷洛阳，俘晋怀帝。", "china-311-yongjia-luoyang"], ["316", 316, "war", "灭亡西晋", "汉赵军迫降长安，西晋灭亡。", "china-316-changan-falls-western-jin"]],
  },
  {
    id: "person:shi-hu",
    name: "石虎",
    nameEn: "Shi Hu",
    polity: "后赵",
    birth: 295,
    death: 349,
    summary: "后赵权臣、君主，后赵扩张和北方军事高压统治的重要人物。",
    aliases: ["后赵武帝"],
    sourceId: "jinshu",
    locator: "晋书·石季龙载记",
    life: [["329", 329, "war", "参与后赵灭前赵", "后赵灭前赵后，北方短期进入后赵强权阶段。", "china-329-later-zhao-destroys-former-zhao"]],
  },
  {
    id: "person:xie-xuan",
    name: "谢玄",
    nameEn: "Xie Xuan",
    polity: "东晋",
    birth: 343,
    death: 388,
    summary: "东晋北府兵统帅，淝水之战中率军击败前秦，是东晋军事转折的核心将领。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·谢玄传",
    life: [["383", 383, "war", "淝水破秦", "统率东晋军在淝水击败前秦，扭转南北形势。", "china-383-fei-river"]],
  },
  {
    id: "person:wang-meng-former-qin",
    name: "王猛",
    nameEn: "Wang Meng",
    polity: "前秦",
    birth: 325,
    death: 375,
    summary: "前秦重臣，辅佐苻坚整合关中和北方制度，是前秦统一北方的重要政治基础。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·苻坚载记",
    life: [["376", 376, "statecraft", "前秦统一北方的制度基础", "其改革和辅政为苻坚统一北方奠定基础。", "china-376-former-qin-unifies-north"]],
  },
  {
    id: "person:murong-chui",
    name: "慕容垂",
    nameEn: "Murong Chui",
    polity: "后燕",
    birth: 326,
    death: 396,
    summary: "后燕建立者，淝水后重建慕容氏政权，后燕与北魏在参合陂形成关键冲突。",
    aliases: ["后燕成武帝"],
    sourceId: "jinshu",
    locator: "晋书·慕容垂载记",
    life: [["395", 395, "war", "后燕与北魏冲突", "后燕在参合陂遭北魏重创，慕容氏北方格局急转。", "china-395-canhbei-northern-wei-defeats-later-yan"]],
  },
  {
    id: "person:murong-bao",
    name: "慕容宝",
    nameEn: "Murong Bao",
    polity: "后燕",
    birth: 355,
    death: 398,
    summary: "后燕太子、后主，参合陂之战中为后燕军主帅，败局动摇后燕国势。",
    aliases: ["后燕惠愍帝"],
    sourceId: "jinshu",
    locator: "晋书·慕容宝载记",
    life: [["395", 395, "defeat", "参合陂败绩", "率后燕军与北魏作战，在参合陂遭到决定性失败。", "china-395-canhbei-northern-wei-defeats-later-yan"]],
  },
  {
    id: "person:yao-xing",
    name: "姚兴",
    nameEn: "Yao Xing",
    polity: "后秦",
    birth: 366,
    death: 416,
    summary: "后秦君主，经营关中并与东晋、北魏长期周旋；其死后后秦迅速被刘裕攻灭。",
    aliases: ["后秦文桓帝"],
    sourceId: "jinshu",
    locator: "晋书·姚兴载记",
    life: [["417", 417, "aftermath", "后秦亡国前夜", "姚兴死后后秦继承和军事局势恶化，刘裕乘势入关。", "china-417-liu-yu-destroys-later-qin"]],
  },
  {
    id: "person:yao-hong",
    name: "姚泓",
    nameEn: "Yao Hong",
    polity: "后秦",
    birth: 388,
    death: 417,
    summary: "后秦末主，刘裕北伐入长安后出降，后秦灭亡。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·姚泓载记",
    life: [["417", 417, "deposition", "后秦灭亡", "刘裕入长安，姚泓出降，后秦政权终结。", "china-417-liu-yu-destroys-later-qin"]],
  },
  {
    id: "person:murong-de",
    name: "慕容德",
    nameEn: "Murong De",
    polity: "南燕",
    birth: 336,
    death: 405,
    summary: "南燕建立者，后燕衰落后在山东重建慕容氏政权，成为刘裕北伐的目标。",
    aliases: ["南燕献武帝"],
    sourceId: "jinshu",
    locator: "晋书·慕容德载记",
    life: [["409", 409, "state-context", "南燕被刘裕攻灭前的政权背景", "南燕据山东，后来为刘裕北伐所灭。", "china-409-liu-yu-destroys-southern-yan"]],
  },
  {
    id: "person:murong-chao",
    name: "慕容超",
    nameEn: "Murong Chao",
    polity: "南燕",
    birth: 385,
    death: 410,
    summary: "南燕末主，刘裕攻破广固后被俘，南燕灭亡。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·慕容超载记",
    life: [["409", 409, "deposition", "南燕灭亡", "刘裕围攻广固，慕容超被俘，南燕灭亡。", "china-409-liu-yu-destroys-southern-yan"]],
  },
  {
    id: "person:cui-hao",
    name: "崔浩",
    nameEn: "Cui Hao",
    polity: "北魏",
    birth: 381,
    death: 450,
    summary: "北魏太武帝时期重臣，参与军国谋划和北方统一，是北魏汉人士族政治的重要代表。",
    aliases: [],
    sourceId: "weishu",
    locator: "魏书·崔浩传",
    life: [["439", 439, "statecraft", "参与北魏统一北方", "太武帝统一北方时期，崔浩参与军国谋划和制度建设。", "china-439-northern-wei-unifies-north"]],
  },
  {
    id: "person:empress-feng-wenming",
    name: "冯太后",
    nameEn: "Empress Dowager Feng",
    polity: "北魏",
    birth: 442,
    death: 490,
    summary: "北魏文明太后，孝文帝改革前的重要摄政者，奠定北魏制度转型基础。",
    aliases: ["文明太后"],
    sourceId: "weishu",
    locator: "魏书·文明皇后冯氏传",
    life: [["493", 493, "reform-background", "孝文改革前的制度基础", "其摄政和改革为孝文帝迁都洛阳、制度转型提供前提。", "china-493-xiaowen-luoyang"]],
  },
  {
    id: "person:xiao-daocheng",
    name: "萧道成",
    nameEn: "Xiao Daocheng",
    polity: "南齐",
    birth: 427,
    death: 482,
    summary: "南齐高帝，479 年代宋建齐，开启南朝齐。",
    aliases: ["齐高帝"],
    sourceId: "nanqishu",
    locator: "南齐书·高帝纪",
    life: [["479", 479, "accession", "代宋建齐", "受禅称帝，南朝由宋入齐。", "china-479-southern-qi-founded"]],
  },
  {
    id: "person:xiao-ze",
    name: "萧赜",
    nameEn: "Xiao Ze",
    polity: "南齐",
    birth: 440,
    death: 493,
    summary: "南齐武帝，齐高帝继承者，维持南齐前期政治秩序。",
    aliases: ["齐武帝"],
    sourceId: "nanqishu",
    locator: "南齐书·武帝纪",
    life: [["479", 479, "succession-context", "南齐前期继承秩序", "作为萧道成继承者，代表南齐建国后的皇统延续。", "china-479-southern-qi-founded"]],
  },
  {
    id: "person:shen-youzhi",
    name: "沈攸之",
    nameEn: "Shen Youzhi",
    polity: "刘宋",
    birth: null,
    death: 478,
    summary: "刘宋末年将领，反萧道成失败，宋齐易代前的军事反抗由此瓦解。",
    aliases: [],
    sourceId: "songshu",
    locator: "宋书·沈攸之传",
    life: [["479", 479, "war", "宋齐易代前失败", "反萧道成失败后，刘宋末年反抗力量瓦解，萧氏代宋条件成熟。", "china-479-southern-qi-founded"]],
  },
  {
    id: "person:xiao-gang-liang-jianwendi",
    name: "萧纲",
    nameEn: "Xiao Gang",
    polity: "梁",
    birth: 503,
    death: 551,
    summary: "梁简文帝，侯景之乱中被侯景控制并遇害，反映梁朝中央权威崩溃。",
    aliases: ["梁简文帝"],
    sourceId: "liangshu",
    locator: "梁书·简文帝纪",
    life: [["548", 548, "crisis", "侯景控制建康", "侯景之乱中成为被挟持的皇帝，梁朝中央权威崩溃。", "china-548-hou-jing-rebellion"]],
  },
  {
    id: "person:chen-qingzhi",
    name: "陈庆之",
    nameEn: "Chen Qingzhi",
    polity: "梁",
    birth: 484,
    death: 539,
    summary: "梁朝名将，以北伐洛阳著称，是梁武帝时期南朝北伐能力的代表人物。",
    aliases: [],
    sourceId: "liangshu",
    locator: "梁书·陈庆之传",
    life: [["502", 502, "military-context", "梁前期军事力量", "梁武帝时期名将，代表南朝梁前期北伐和军事经营。", "china-502-liang-founded"]],
  },
  {
    id: "person:xiao-cha-western-liang",
    name: "萧詧",
    nameEn: "Xiao Cha",
    polity: "西梁",
    birth: 519,
    death: 562,
    summary: "西梁建立者，江陵陷落后依附西魏，反映梁末南方政权碎裂。",
    aliases: ["西梁宣帝"],
    sourceId: "liangshu",
    locator: "梁书·宣帝纪",
    life: [["554", 554, "state-formation", "江陵陷落后的西梁", "西魏攻陷江陵后，萧詧在西魏支持下建立西梁。", "china-554-western-wei-sacks-jiangling"]],
  },
  {
    id: "person:yu-jin-western-wei",
    name: "于谨",
    nameEn: "Yu Jin",
    polity: "西魏/北周",
    birth: 493,
    death: 568,
    summary: "西魏、北周名将，参与攻陷江陵，是关陇集团向南扩张的重要统帅。",
    aliases: [],
    sourceId: "zhoushu",
    locator: "周书·于谨传",
    life: [["554", 554, "war", "攻陷江陵", "统率西魏军南下攻陷江陵，梁元帝被杀。", "china-554-western-wei-sacks-jiangling"]],
  },
  {
    id: "person:yuwen-hu",
    name: "宇文护",
    nameEn: "Yuwen Hu",
    polity: "北周",
    birth: 513,
    death: 572,
    summary: "北周权臣，北周建立初期掌握朝政，影响北周前期皇权与关陇政治。",
    aliases: [],
    sourceId: "zhoushu",
    locator: "周书·晋荡公护传",
    life: [["557", 557, "power", "北周初年辅政", "北周建立后长期掌握朝政，是北周前期政治核心。", "china-557-northern-zhou-and-chen"]],
  },
  {
    id: "person:gao-cheng",
    name: "高澄",
    nameEn: "Gao Cheng",
    polity: "东魏/北齐",
    birth: 521,
    death: 549,
    summary: "高欢长子，东魏后期实际执政者，为高洋代魏建齐铺垫权力基础。",
    aliases: ["北齐文襄帝"],
    sourceId: "beiqishu",
    locator: "北齐书·文襄帝纪",
    life: [["550", 550, "power-background", "北齐建国前权力基础", "其执掌东魏朝政为高洋代魏建齐提供基础。", "china-550-northern-qi-founded"]],
  },
  {
    id: "person:gao-jiong",
    name: "高颎",
    nameEn: "Gao Jiong",
    polity: "隋",
    birth: 541,
    death: 607,
    summary: "隋初重臣，参与辅政、制度建设和灭陈方略，是隋统一的重要谋臣。",
    aliases: [],
    sourceId: "suishu",
    locator: "隋书·高颎传",
    life: [["580", 580, "politics", "辅佐杨坚掌权", "杨坚辅政北周时参与中枢谋划。", "china-580-yang-jian-regency"], ["589", 589, "strategy", "参与灭陈方略", "隋灭陈前后参与军国谋划，支撑统一战争。", "china-589-sui-conquers-chen"]],
  },
  {
    id: "person:han-qinhu",
    name: "韩擒虎",
    nameEn: "Han Qinhu",
    polity: "隋",
    birth: 538,
    death: 592,
    summary: "隋朝名将，平陈之役中率军入建康，俘陈后主。",
    aliases: [],
    sourceId: "suishu",
    locator: "隋书·韩擒虎传",
    life: [["589", 589, "war", "入建康俘陈后主", "平陈之役中入建康，俘陈叔宝，陈亡。", "china-589-sui-conquers-chen"]],
  },
  {
    id: "person:he-ruobi",
    name: "贺若弼",
    nameEn: "He Ruobi",
    polity: "隋",
    birth: 544,
    death: 607,
    summary: "隋朝名将，平陈之役中为主力统帅之一，与韩擒虎等共同完成南北统一。",
    aliases: [],
    sourceId: "suishu",
    locator: "隋书·贺若弼传",
    life: [["588", 588, "campaign", "大举伐陈", "隋军大举伐陈时为重要统帅。", "china-588-sui-launches-chen-campaign"], ["589", 589, "war", "平陈统一", "参与灭陈战争，隋完成南北统一。", "china-589-sui-conquers-chen"]],
  },
];

const insertPerson = db.prepare(`
  INSERT OR REPLACE INTO persons (
    id, region, name, courtesy_name, life, birth_year, death_year, life_confidence,
    primary_polity, summary, coverage_status, raw_json
  )
  VALUES (?, ?, ?, NULL, ?, ?, ?, 'medium', ?, ?, 'core', ?)
`);

const insertEntity = db.prepare(`
  INSERT OR REPLACE INTO entities (
    id, entity_type, primary_label, civilization_id, region_id, time_start, time_end,
    summary, confidence, review_status, raw_json
  )
  VALUES (?, 'person', ?, ?, ?, ?, ?, ?, 'medium', 'reviewed', ?)
`);

const insertAlias = db.prepare(`
  INSERT OR REPLACE INTO entity_aliases (
    id, entity_id, value, alias_type, language, context_source_id, valid_start, valid_end, raw_json
  )
  VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?)
`);

const insertLifeEvent = db.prepare(`
  INSERT OR REPLACE INTO person_life_events (
    id, person_id, year, end_year, display_year, type, title, summary, confidence, approximate, raw_json
  )
  VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 'medium', 0, ?)
`);

const insertLifeRef = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_source_refs (
    life_event_id, source_id, locator, quote, raw_json
  )
  VALUES (?, ?, ?, NULL, ?)
`);

const insertLifeEventLink = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_historical_events (
    life_event_id, event_id, sort_order
  )
  VALUES (?, ?, 0)
`);

const selectEvent = db.prepare(`
  SELECT id, title, event_type, time_start, time_end, region_id, summary, confidence, raw_json
  FROM events
  WHERE id = ?
`);

const insertHistoricalEvent = db.prepare(`
  INSERT OR IGNORE INTO historical_events (
    id, title, region, start_year, end_year, location_name, category, summary,
    confidence, coordinates_json, detail_json, raw_json
  )
  VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?)
`);

const insertEventEntity = db.prepare(`
  INSERT OR REPLACE INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
  VALUES (?, ?, ?, ?, ?)
`);

const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id,
    time_start, time_end, review_status, raw_json
  )
  VALUES (?, 'entities', ?, ?, ?, 'zh-Hans', ?, ?, 'person', ?, ?, 'reviewed', ?)
`);

db.exec("BEGIN");
try {
  db.prepare("DELETE FROM person_life_event_source_refs WHERE life_event_id LIKE ?").run(`${lifePrefix}%`);
  db.prepare("DELETE FROM person_life_event_historical_events WHERE life_event_id LIKE ?").run(`${lifePrefix}%`);
  db.prepare("DELETE FROM person_life_events WHERE id LIKE ?").run(`${lifePrefix}%`);

  let lifeCount = 0;
  let eventLinkCount = 0;
  const eventIds = new Set(people.flatMap((person) => person.life.map((item) => item[5])));

  for (const eventId of eventIds) {
    const event = selectEvent.get(eventId);
    if (!event) throw new Error(`Missing events row for ${eventId}`);
    insertHistoricalEvent.run(
      event.id,
      event.title,
      event.region_id,
      event.time_start,
      event.time_end,
      event.event_type,
      event.summary,
      event.confidence,
      JSON.stringify({ mirroredFrom: "events", periodId }),
      json({ periodId, sourceTable: "events", sourceEventId: event.id, eventRawJson: event.raw_json }),
    );
  }

  for (const person of people) {
    insertPerson.run(
      person.id,
      regionId,
      person.name,
      lifeLabel(person.birth, person.death),
      person.birth,
      person.death,
      person.polity,
      person.summary,
      json({ periodId, personBatch: 2, nameEn: person.nameEn, sourceId: person.sourceId, locator: person.locator }),
    );

    insertEntity.run(
      person.id,
      person.name,
      civilizationId,
      regionId,
      person.birth,
      person.death,
      person.summary,
      json({ periodId, personBatch: 2, nameEn: person.nameEn, polity: person.polity, sourceId: person.sourceId, locator: person.locator }),
    );

    insertAlias.run(`${person.id}:alias:en`, person.id, person.nameEn, "english-name", "en", json({ periodId, personBatch: 2 }));
    for (const [index, alias] of person.aliases.entries()) {
      insertAlias.run(`${person.id}:alias:zh:${index}`, person.id, alias, "alternate-name", "zh-Hans", json({ periodId, personBatch: 2 }));
    }

    const bodyParts = [
      person.summary,
      `归属：${person.polity}`,
      `史料：${person.sourceId}，${person.locator}`,
      `生命节点：${person.life.map((item) => `${item[0]} ${item[3]}`).join("；")}`,
    ];
    upsertSearchDocument.run(
      `entity:${person.id}`,
      person.id,
      person.name,
      bodyParts.join("\n"),
      regionId,
      periodId,
      person.birth,
      person.death,
      json({ documentKind: "person-card", periodId, personBatch: 2, sourceId: person.sourceId, locator: person.locator }),
    );

    for (const [displayYear, year, type, title, summary, eventId] of person.life) {
      const lifeId = `${lifePrefix}${person.id.replace(/^person:/, "")}:${year}:${type}`;
      insertLifeEvent.run(lifeId, person.id, year, displayYear, type, title, summary, json({ periodId, eventId, personBatch: 2 }));
      insertLifeRef.run(lifeId, person.sourceId, person.locator, json({ periodId, personBatch: 2 }));
      insertLifeEventLink.run(lifeId, eventId);
      insertEventEntity.run(eventId, person.id, type, 200 + lifeCount, json({ periodId, personBatch: 2, generatedFrom: "core-person-life" }));
      lifeCount += 1;
      eventLinkCount += 1;
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded ${people.length} second-batch 310-589 persons, ${lifeCount} life events, ${eventLinkCount} event links.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
