import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
db.exec("PRAGMA foreign_keys = ON;");

const batchId = "manual-china-310-589-persons-batch3";
const regionId = "china";
const civilizationId = "china-wei-jin-northern-southern";
const periodId = "china-wei-jin-northern-southern-310-589";
const lifePrefix = "china-310-589-life3:";

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
    id: "person:wang-dun",
    name: "王敦",
    nameEn: "Wang Dun",
    polity: "东晋",
    birth: 266,
    death: 324,
    summary: "东晋初年宗室与侨姓政治中的强藩人物，长期据长江上游，对建康朝廷形成军事压力。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·王敦传",
    life: [["317", 317, "politics", "东晋初年据上游成势", "司马睿建晋于建康后，王敦凭荆、湘军事资源成为东晋朝廷最重要的外镇强藩之一。", "china-317-eastern-jin-jiankang"]],
  },
  {
    id: "person:tao-kan",
    name: "陶侃",
    nameEn: "Tao Kan",
    polity: "东晋",
    birth: 259,
    death: 334,
    summary: "东晋早期名将与方镇，经营荆、江上游，对稳定江南政权和后续北伐格局有承接作用。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·陶侃传",
    life: [["317", 317, "statecraft", "支撑东晋早期江南秩序", "东晋建立后，陶侃等地方军政人物支撑长江中上游秩序，使建康政权获得延续空间。", "china-317-eastern-jin-jiankang"]],
  },
  {
    id: "person:yu-liang",
    name: "庾亮",
    nameEn: "Yu Liang",
    polity: "东晋",
    birth: 289,
    death: 340,
    summary: "东晋外戚与中枢重臣，代表侨姓士族掌控朝政的一面，也暴露建康中枢与方镇之间的结构矛盾。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·庾亮传",
    life: [["317", 317, "politics", "进入东晋中枢士族政治", "东晋立国后，庾氏等侨姓士族成为建康政权中枢的重要组成部分。", "china-317-eastern-jin-jiankang"]],
  },
  {
    id: "person:liu-laozhi",
    name: "刘牢之",
    nameEn: "Liu Laozhi",
    polity: "东晋",
    birth: null,
    death: 402,
    summary: "北府兵将领，淝水之战中参与前线作战，后来卷入东晋末年军政更替。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·刘牢之传",
    life: [["383", 383, "war", "参与淝水之战", "作为北府兵将领参与东晋抗击前秦的战争，反映北府兵在东晋军事体系中的关键地位。", "china-383-fei-river"]],
  },
  {
    id: "person:zhu-xu",
    name: "朱序",
    nameEn: "Zhu Xu",
    polity: "东晋",
    birth: null,
    death: 393,
    summary: "东晋将领，襄阳陷落后被前秦所得，淝水之战中其行动与战场心理变化密切相关。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·朱序传",
    life: [["383", 383, "war", "淝水阵前扰动秦军", "淝水之战中朱序相关行动被记入前秦军阵动摇的叙事链，是战役转折的重要人物线索。", "china-383-fei-river"]],
  },
  {
    id: "person:huan-chong",
    name: "桓冲",
    nameEn: "Huan Chong",
    polity: "东晋",
    birth: 328,
    death: 384,
    summary: "桓温弟，东晋荆州方镇与军政重臣，淝水前后负责长江中上游防务。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·桓冲传",
    life: [["383", 383, "defense", "淝水前后的上游防务", "前秦南下时，桓冲镇守上游，与建康、北府兵防线共同构成东晋抗秦格局。", "china-383-fei-river"]],
  },
  {
    id: "person:huan-xuan",
    name: "桓玄",
    nameEn: "Huan Xuan",
    polity: "东晋",
    birth: 369,
    death: 404,
    summary: "桓温之子，东晋末年一度篡晋建楚，其失败为刘裕进入中枢并最终代晋提供政治转折。",
    aliases: ["桓楚武悼皇帝"],
    sourceId: "jinshu",
    locator: "晋书·桓玄传",
    life: [["420", 420, "precursor", "刘裕代晋前的权力转折", "桓玄篡晋与败亡，使刘裕凭北府兵与复晋功业进入权力核心，成为宋代晋的前置环节。", "china-420-liu-yu-founds-song"]],
  },
  {
    id: "person:wang-zhene",
    name: "王镇恶",
    nameEn: "Wang Zhen'e",
    polity: "东晋",
    birth: 373,
    death: 418,
    summary: "刘裕北伐后秦时的重要将领，入关中、取长安的前线功臣。",
    aliases: [],
    sourceId: "songshu",
    locator: "宋书·王镇恶传",
    life: [["417", 417, "war", "随刘裕灭后秦入长安", "刘裕北伐后秦时，王镇恶等将领推进关中作战，促成长安陷落。", "china-417-liu-yu-destroys-later-qin"]],
  },
  {
    id: "person:tan-daoji",
    name: "檀道济",
    nameEn: "Tan Daoji",
    polity: "刘宋",
    birth: null,
    death: 436,
    summary: "东晋末至刘宋初名将，参与刘裕北伐和宋初军政，是南朝军事人物谱系中的关键节点。",
    aliases: [],
    sourceId: "songshu",
    locator: "宋书·檀道济传",
    life: [["409", 409, "war", "参与刘裕灭南燕", "刘裕北伐南燕时，檀道济参与作战，进入刘裕军事集团核心。", "china-409-liu-yu-destroys-southern-yan"], ["417", 417, "war", "参与灭后秦北伐", "后秦战役中继续随军北伐，连接东晋末北伐与刘宋建国。", "china-417-liu-yu-destroys-later-qin"], ["420", 420, "state-founding", "成为刘宋开国军事支柱", "刘裕受禅建宋后，檀道济成为宋初重要将领之一。", "china-420-liu-yu-founds-song"]],
  },
  {
    id: "person:fu-liang",
    name: "傅亮",
    nameEn: "Fu Liang",
    polity: "刘宋",
    birth: 374,
    death: 426,
    summary: "刘宋开国文臣，参与刘裕受禅制度安排，是东晋至刘宋政权转换中的中枢人物。",
    aliases: [],
    sourceId: "songshu",
    locator: "宋书·傅亮传",
    life: [["420", 420, "state-founding", "参与刘裕受禅建宋", "刘裕代晋建宋过程中，傅亮参与禅代文书与中枢制度安排。", "china-420-liu-yu-founds-song"]],
  },
  {
    id: "person:xu-xianzhi",
    name: "徐羡之",
    nameEn: "Xu Xianzhi",
    polity: "刘宋",
    birth: 364,
    death: 426,
    summary: "刘宋开国重臣，刘裕死后成为辅政核心，体现宋初从军功开国向中枢治理的转换。",
    aliases: [],
    sourceId: "songshu",
    locator: "宋书·徐羡之传",
    life: [["420", 420, "state-founding", "进入刘宋开国中枢", "刘裕建宋后，徐羡之成为宋初中枢重臣，参与新王朝政治运行。", "china-420-liu-yu-founds-song"]],
  },
  {
    id: "person:xie-hui",
    name: "谢晦",
    nameEn: "Xie Hui",
    polity: "刘宋",
    birth: 390,
    death: 426,
    summary: "刘宋开国重臣，出自陈郡谢氏，代表南朝开国集团中的士族与军政结合。",
    aliases: [],
    sourceId: "songshu",
    locator: "宋书·谢晦传",
    life: [["420", 420, "state-founding", "参与刘宋开国政治", "刘裕受禅建宋后，谢晦进入开国中枢，与徐羡之、傅亮等共同支撑宋初政局。", "china-420-liu-yu-founds-song"]],
  },
  {
    id: "person:xiao-baojuan",
    name: "萧宝卷",
    nameEn: "Xiao Baojuan",
    polity: "南齐",
    birth: 483,
    death: 501,
    summary: "南齐东昏侯，齐末政治失序为萧衍起兵和梁代齐提供直接背景。",
    aliases: ["东昏侯"],
    sourceId: "nanqishu",
    locator: "南齐书·东昏侯纪",
    life: [["502", 502, "dynastic-transition", "齐末失政与梁代齐背景", "萧宝卷统治末期的政治危机成为萧衍起兵、代齐建梁的重要背景。", "china-502-liang-founded"]],
  },
  {
    id: "person:shen-yue",
    name: "沈约",
    nameEn: "Shen Yue",
    polity: "南梁",
    birth: 441,
    death: 513,
    summary: "南朝文臣、史家，仕宋、齐、梁，参与梁初制度与文献建设，是南朝文化政治的重要人物。",
    aliases: [],
    sourceId: "liangshu",
    locator: "梁书·沈约传",
    life: [["502", 502, "state-founding", "入梁初中枢", "萧衍代齐建梁后，沈约参与梁初文教与制度建设，连接南齐旧臣与梁朝新政权。", "china-502-liang-founded"]],
  },
  {
    id: "person:fan-yun",
    name: "范云",
    nameEn: "Fan Yun",
    polity: "南梁",
    birth: 451,
    death: 503,
    summary: "梁初重臣，支持萧衍建梁，是齐梁禅代过程中重要的文臣人物。",
    aliases: [],
    sourceId: "liangshu",
    locator: "梁书·范云传",
    life: [["502", 502, "state-founding", "支持萧衍代齐建梁", "梁建立前后，范云参与政治筹划和中枢运作，代表梁初文臣集团。", "china-502-liang-founded"]],
  },
  {
    id: "person:yuan-cha",
    name: "元叉",
    nameEn: "Yuan Cha",
    polity: "北魏",
    birth: null,
    death: 525,
    summary: "北魏宗室权臣，孝明帝时期与胡太后政治相互牵制，六镇起事前后中枢失衡的重要人物。",
    aliases: [],
    sourceId: "weishu",
    locator: "魏书·元叉传",
    life: [["523", 523, "politics", "六镇起事前后的中枢权臣", "北魏后期中枢权力斗争与边镇危机交织，元叉执政背景下六镇局势恶化。", "china-523-six-garrisons"]],
  },
  {
    id: "person:empress-hu-northern-wei",
    name: "胡太后",
    nameEn: "Empress Dowager Hu",
    polity: "北魏",
    birth: null,
    death: 528,
    summary: "北魏孝明帝生母，后期临朝称制，河阴之变前的朝局震荡与其政治处境密切相关。",
    aliases: ["灵太后"],
    sourceId: "weishu",
    locator: "魏书·灵皇后传",
    life: [["523", 523, "regency", "临朝背景下边镇危机扩大", "胡太后临朝时期，北魏中枢政治和六镇边防危机相互激化。", "china-523-six-garrisons"], ["528", 528, "death", "河阴之变前后被杀", "孝明帝死后，尔朱荣入洛，胡太后被杀，北魏朝廷秩序急剧崩溃。", "china-528-heyin-massacre"]],
  },
  {
    id: "person:yuan-ziyou-xiaozhuang",
    name: "元子攸",
    nameEn: "Yuan Ziyou",
    polity: "北魏",
    birth: 507,
    death: 531,
    summary: "北魏孝庄帝，河阴之变后被尔朱荣拥立，成为北魏后期权臣拥立皇帝的典型案例。",
    aliases: ["北魏孝庄帝"],
    sourceId: "weishu",
    locator: "魏书·孝庄帝纪",
    life: [["528", 528, "enthronement", "河阴之变后即位", "尔朱荣入洛并屠杀朝臣后，元子攸被拥立为帝，北魏皇权进一步受制于军事强人。", "china-528-heyin-massacre"]],
  },
  {
    id: "person:ge-rong",
    name: "葛荣",
    nameEn: "Ge Rong",
    polity: "北魏末起义军",
    birth: null,
    death: 528,
    summary: "北魏末河北起义军首领，六镇及河北动乱扩大后形成大规模军事压力。",
    aliases: [],
    sourceId: "weishu",
    locator: "魏书·葛荣传",
    life: [["523", 523, "rebellion", "六镇动乱外溢的河北首领", "六镇起事引发北方连锁动乱，葛荣在河北形成大规模起义军势力。", "china-523-six-garrisons"], ["528", 528, "defeat", "被尔朱荣击败", "河阴之变后，尔朱荣继续以军事力量压制河北动乱，葛荣败亡。", "china-528-heyin-massacre"]],
  },
  {
    id: "person:li-bi-western-wei",
    name: "李弼",
    nameEn: "Li Bi",
    polity: "西魏",
    birth: 494,
    death: 557,
    summary: "西魏、北周关陇集团重要将领，参与沙苑、玉壁前后的军事体系建设。",
    aliases: [],
    sourceId: "zhoushu",
    locator: "周书·李弼传",
    life: [["537", 537, "war", "参与沙苑战役体系", "沙苑之战前后，李弼等关陇将领支撑宇文泰军事集团。", "china-537-battle-of-shayuan"], ["546", 546, "war", "西魏对东魏防御体系成员", "玉壁之战阶段，关陇将领体系继续支撑西魏抵御东魏。", "china-546-battle-of-yubi"]],
  },
  {
    id: "person:dugu-xin",
    name: "独孤信",
    nameEn: "Dugu Xin",
    polity: "西魏",
    birth: 503,
    death: 557,
    summary: "西魏、北周名将，关陇集团代表人物之一，家族婚姻网络后来影响北周、隋、唐政治。",
    aliases: [],
    sourceId: "zhoushu",
    locator: "周书·独孤信传",
    life: [["534", 534, "alignment", "进入西魏关陇集团", "北魏分裂后，独孤信等将领归入西魏、宇文泰军事政治体系。", "china-534-northern-wei-splits"], ["537", 537, "war", "沙苑前后的西魏将领", "沙苑之战前后，独孤信是西魏关陇军政集团的重要成员。", "china-537-battle-of-shayuan"]],
  },
  {
    id: "person:hulu-guang",
    name: "斛律光",
    nameEn: "Hulü Guang",
    polity: "北齐",
    birth: 515,
    death: 572,
    summary: "北齐名将，长期对抗北周，是北齐后期少数可支撑边防的军事核心。",
    aliases: ["明月"],
    sourceId: "beiqishu",
    locator: "北齐书·斛律光传",
    life: [["546", 546, "military-career", "高氏军事体系中的边将", "东魏、西魏对峙时期，斛律氏等军功家族进入高氏军事体系。", "china-546-battle-of-yubi"], ["577", 577, "aftermath", "北齐灭亡前的军事支柱已失", "北周灭齐前，斛律光已被北齐内政所害，北齐边防支柱削弱。", "china-577-northern-zhou-destroys-qi"]],
  },
  {
    id: "person:gao-changgong",
    name: "高长恭",
    nameEn: "Gao Changgong",
    polity: "北齐",
    birth: 541,
    death: 573,
    summary: "北齐宗室名将，后世称兰陵王，北齐后期军事声望人物，亦反映高氏政权内部猜忌。",
    aliases: ["兰陵王"],
    sourceId: "beiqishu",
    locator: "北齐书·兰陵王长恭传",
    life: [["577", 577, "aftermath", "北齐灭亡前的宗室名将已去", "高长恭被赐死后，北齐宗室军事力量继续削弱，成为北周灭齐前的背景因素。", "china-577-northern-zhou-destroys-qi"]],
  },
  {
    id: "person:yuchi-jiong",
    name: "尉迟迥",
    nameEn: "Yuchi Jiong",
    polity: "北周",
    birth: 516,
    death: 580,
    summary: "北周宗室外戚与方镇重臣，杨坚辅政后起兵反对，是周隋鼎革中的关键反抗者。",
    aliases: [],
    sourceId: "zhoushu",
    locator: "周书·尉迟迥传",
    life: [["580", 580, "rebellion", "反对杨坚辅政", "杨坚掌握北周中枢后，尉迟迥据相州起兵，成为周隋易代前最大军事反抗。", "china-580-yang-jian-regency"]],
  },
  {
    id: "person:yang-guang",
    name: "杨广",
    nameEn: "Yang Guang",
    polity: "隋",
    birth: 569,
    death: 618,
    summary: "隋文帝次子，灭陈战争中任行军元帅，后为隋炀帝。",
    aliases: ["晋王", "隋炀帝"],
    sourceId: "suishu",
    locator: "隋书·炀帝纪",
    life: [["588", 588, "campaign", "任灭陈行军元帅", "隋伐陈时，杨广以晋王身份统领大军名义，承担南征政治与军事统合角色。", "china-588-sui-launches-chen-campaign"], ["589", 589, "unification", "入建康完成灭陈", "陈亡后，杨广在灭陈叙事中成为隋朝完成南北统一的重要宗室代表。", "china-589-sui-conquers-chen"]],
  },
  {
    id: "person:yang-su",
    name: "杨素",
    nameEn: "Yang Su",
    polity: "隋",
    birth: 544,
    death: 606,
    summary: "隋初名将与重臣，参与灭陈战争和统一后的南方经营，是隋初军事政治体系核心人物。",
    aliases: [],
    sourceId: "suishu",
    locator: "隋书·杨素传",
    life: [["588", 588, "campaign", "参与隋军伐陈", "隋军大举南征时，杨素参与长江上游和灭陈战役体系。", "china-588-sui-launches-chen-campaign"], ["589", 589, "unification", "灭陈后进入统一政权核心", "陈亡后，杨素继续成为隋初处理南方和军事事务的重要重臣。", "china-589-sui-conquers-chen"]],
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
      json({ periodId, personBatch: 3, nameEn: person.nameEn, sourceId: person.sourceId, locator: person.locator }),
    );

    insertEntity.run(
      person.id,
      person.name,
      civilizationId,
      regionId,
      person.birth,
      person.death,
      person.summary,
      json({ periodId, personBatch: 3, nameEn: person.nameEn, polity: person.polity, sourceId: person.sourceId, locator: person.locator }),
    );

    insertAlias.run(`${person.id}:alias:en`, person.id, person.nameEn, "english-name", "en", json({ periodId, personBatch: 3 }));
    for (const [index, alias] of person.aliases.entries()) {
      insertAlias.run(`${person.id}:alias:zh:${index}`, person.id, alias, "alternate-name", "zh-Hans", json({ periodId, personBatch: 3 }));
    }

    const bodyParts = [
      person.summary,
      `归属：${person.polity}`,
      `史料：${person.sourceId}；${person.locator}`,
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
      json({ documentKind: "person-card", periodId, personBatch: 3, sourceId: person.sourceId, locator: person.locator }),
    );

    for (const [displayYear, year, type, title, summary, eventId] of person.life) {
      const lifeId = `${lifePrefix}${person.id.replace(/^person:/, "")}:${year}:${type}`;
      insertLifeEvent.run(lifeId, person.id, year, displayYear, type, title, summary, json({ periodId, eventId, personBatch: 3 }));
      insertLifeRef.run(lifeId, person.sourceId, person.locator, json({ periodId, personBatch: 3 }));
      insertLifeEventLink.run(lifeId, eventId);
      insertEventEntity.run(eventId, person.id, type, 300 + lifeCount, json({ periodId, personBatch: 3, generatedFrom: "core-person-life" }));
      lifeCount += 1;
      eventLinkCount += 1;
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded ${people.length} third-batch 310-589 persons, ${lifeCount} life events, ${eventLinkCount} event links.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
