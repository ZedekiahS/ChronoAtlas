import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
db.exec("PRAGMA foreign_keys = ON;");

const batchId = "manual-china-310-589-core-persons";
const regionId = "china";
const civilizationId = "china-wei-jin-northern-southern";
const periodId = "china-wei-jin-northern-southern-310-589";

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

function lifeLabel(birth, death) {
  if (birth && death) return `${birth}-${death}`;
  if (birth) return `${birth}-?`;
  if (death) return `?- ${death}`;
  return null;
}

const people = [
  {
    id: "person:sima-rui-jin-yuandi",
    name: "司马睿",
    nameEn: "Sima Rui",
    polity: "东晋",
    birth: 276,
    death: 323,
    summary: "东晋元帝，317 年在建康承制称晋王，318 年即皇帝位，奠定东晋南渡政权。",
    aliases: ["晋元帝"],
    sourceId: "jinshu",
    locator: "晋书·元帝纪",
    life: [["317", 317, "accession", "建康承制", "在建康承制为晋王，形成东晋政权核心。", "china-317-eastern-jin-jiankang"]],
  },
  {
    id: "person:wang-dao",
    name: "王导",
    nameEn: "Wang Dao",
    polity: "东晋",
    birth: 276,
    death: 339,
    summary: "东晋初年重臣，协助司马睿经营江东士族政治，是东晋建国的关键辅政人物。",
    aliases: ["王茂弘"],
    sourceId: "jinshu",
    locator: "晋书·王导传",
    life: [["317", 317, "politics", "辅成江东政权", "王导联络江东士族，支撑司马睿在建康建立政权。", "china-317-eastern-jin-jiankang"]],
  },
  {
    id: "person:zu-ti",
    name: "祖逖",
    nameEn: "Zu Ti",
    polity: "东晋",
    birth: 266,
    death: 321,
    summary: "东晋早期北伐将领，以中流击楫和河南经营成为南渡初期恢复中原的代表人物。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·祖逖传",
    life: [["321", 321, "war", "北伐河南", "率部渡江北伐，经营豫州、河南一线。", "china-321-zu-ti-northern-expedition"]],
  },
  {
    id: "person:liu-yao",
    name: "刘曜",
    nameEn: "Liu Yao",
    polity: "前赵",
    birth: null,
    death: 329,
    summary: "汉赵、前赵宗室和君主，参与攻陷长安，后在与后赵石勒争霸中失败。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·刘曜载记",
    life: [["316", 316, "war", "攻陷长安", "刘曜围攻长安，西晋愍帝出降。", "china-316-changan-falls-western-jin"], ["329", 329, "death", "败于后赵", "与石勒争锋失败，被后赵擒获。", "china-329-later-zhao-destroys-former-zhao"]],
  },
  {
    id: "person:shi-le",
    name: "石勒",
    nameEn: "Shi Le",
    polity: "后赵",
    birth: 274,
    death: 333,
    summary: "后赵建立者，十六国时期北方强权人物，329 年灭前赵。",
    aliases: ["后赵明帝"],
    sourceId: "jinshu",
    locator: "晋书·石勒载记",
    life: [["329", 329, "war", "灭前赵", "击败刘曜并吞并前赵势力，后赵成为北方强权。", "china-329-later-zhao-destroys-former-zhao"]],
  },
  {
    id: "person:huan-wen",
    name: "桓温",
    nameEn: "Huan Wen",
    polity: "东晋",
    birth: 312,
    death: 373,
    summary: "东晋权臣和北伐统帅，347 年灭成汉，后多次北伐。",
    aliases: ["桓元子"],
    sourceId: "jinshu",
    locator: "晋书·桓温传",
    life: [["347", 347, "war", "灭成汉", "率东晋军入蜀，迫使李势投降。", "china-347-huan-wen-conquers-cheng-han"], ["369", 369, "war", "枋头败退", "北伐前燕至枋头，因粮运不继而败退。", "china-369-huan-wen-defeated-fangtou"]],
  },
  {
    id: "person:li-shi-cheng-han",
    name: "李势",
    nameEn: "Li Shi",
    polity: "成汉",
    birth: null,
    death: 361,
    summary: "成汉末主，347 年在桓温入蜀后出降，成汉灭亡。",
    aliases: [],
    sourceId: "jinshu",
    locator: "晋书·李势载记",
    life: [["347", 347, "deposition", "出降东晋", "桓温入蜀后，李势面缚舆榇请命。", "china-347-huan-wen-conquers-cheng-han"]],
  },
  {
    id: "person:fu-jian",
    name: "苻坚",
    nameEn: "Fu Jian",
    polity: "前秦",
    birth: 338,
    death: 385,
    summary: "前秦君主，376 年统一北方，383 年淝水之战失败后政权急剧瓦解。",
    aliases: ["苻永固"],
    sourceId: "jinshu",
    locator: "晋书·苻坚载记",
    life: [["376", 376, "unification", "统一北方", "压服前凉、代等政权，形成短暂北方统一。", "china-376-former-qin-unifies-north"], ["383", 383, "war", "淝水之败", "南征东晋失败，前秦统一秩序崩解。", "china-383-fei-river"]],
  },
  {
    id: "person:xie-an",
    name: "谢安",
    nameEn: "Xie An",
    polity: "东晋",
    birth: 320,
    death: 385,
    summary: "东晋宰辅，淝水之战时主持朝局，是东晋抵御前秦的政治核心。",
    aliases: ["谢安石"],
    sourceId: "jinshu",
    locator: "晋书·谢安传",
    life: [["383", 383, "politics", "主持淝水战局", "在前秦南征时稳定东晋朝局，支持谢玄等前线作战。", "china-383-fei-river"]],
  },
  {
    id: "person:liu-yu-song-wudi",
    name: "刘裕",
    nameEn: "Liu Yu",
    polity: "刘宋",
    birth: 363,
    death: 422,
    summary: "刘宋武帝，东晋末年北伐统帅，420 年受禅建立刘宋。",
    aliases: ["宋武帝"],
    sourceId: "songshu",
    locator: "宋书·武帝纪",
    life: [["409", 409, "war", "灭南燕", "北伐攻灭南燕，提升东晋军政威望。", "china-409-liu-yu-destroys-southern-yan"], ["420", 420, "accession", "受禅建宋", "代晋建立刘宋，南朝宋开始。", "china-420-liu-yu-founds-song"]],
  },
  {
    id: "person:tuoba-gui",
    name: "拓跋珪",
    nameEn: "Tuoba Gui",
    polity: "北魏",
    birth: 371,
    death: 409,
    summary: "北魏道武帝，重建代国并奠定北魏国家形态，398 年定都平城。",
    aliases: ["魏道武帝"],
    sourceId: "weishu",
    locator: "魏书·太祖纪",
    life: [["395", 395, "war", "参合陂胜后燕", "在参合陂击败后燕军，北魏势力迅速上升。", "china-395-canhbei-northern-wei-defeats-later-yan"], ["398", 398, "state-formation", "定都平城", "称帝并营建平城，北魏进入王朝国家阶段。", "china-398-northern-wei-pingcheng"]],
  },
  {
    id: "person:tuoba-tao",
    name: "拓跋焘",
    nameEn: "Tuoba Tao",
    polity: "北魏",
    birth: 408,
    death: 452,
    summary: "北魏太武帝，439 年灭北凉，完成北方统一。",
    aliases: ["魏太武帝"],
    sourceId: "weishu",
    locator: "魏书·世祖纪",
    life: [["439", 439, "unification", "灭北凉", "西讨沮渠牧犍并攻取姑臧，北魏统一北方。", "china-439-northern-wei-unifies-north"]],
  },
  {
    id: "person:juqu-mujian",
    name: "沮渠牧犍",
    nameEn: "Juqu Mujian",
    polity: "北凉",
    birth: null,
    death: 447,
    summary: "北凉末主，439 年姑臧被北魏攻破后出降。",
    aliases: [],
    sourceId: "beishi",
    locator: "北史·僭伪附庸传",
    life: [["439", 439, "deposition", "北凉出降", "姑臧城破后面缚请罪，北凉灭亡。", "china-439-northern-wei-unifies-north"]],
  },
  {
    id: "person:yuan-hong-xiaowen",
    name: "元宏",
    nameEn: "Yuan Hong",
    polity: "北魏",
    birth: 467,
    death: 499,
    summary: "北魏孝文帝，推进迁都洛阳和汉化制度改革。",
    aliases: ["魏孝文帝", "拓跋宏"],
    sourceId: "weishu",
    locator: "魏书·高祖纪",
    life: [["493", 493, "reform", "迁都洛阳", "以河南洛阳为政治重心推进制度改革。", "china-493-xiaowen-luoyang"]],
  },
  {
    id: "person:li-chong-northern-wei",
    name: "李冲",
    nameEn: "Li Chong",
    polity: "北魏",
    birth: 450,
    death: 498,
    summary: "北魏孝文帝朝重臣，参与洛阳营缮和制度建设。",
    aliases: [],
    sourceId: "weishu",
    locator: "魏书·李冲传",
    life: [["493", 493, "administration", "参与洛阳建设", "领将作大匠，参与洛阳宫室营缮。", "china-493-xiaowen-luoyang"]],
  },
  {
    id: "person:poluohan-baling",
    name: "破六韩拔陵",
    nameEn: "Poluohan Baling",
    polity: "北魏六镇",
    birth: null,
    death: null,
    summary: "沃野镇起事首领，正光五年聚众杀镇将，号真王元年，引发六镇之乱。",
    aliases: ["破落汗拔陵"],
    sourceId: "weishu",
    locator: "魏书·肃宗纪",
    life: [["524", 524, "rebellion", "沃野镇起事", "聚众反，杀镇将，号真王元年。", "china-523-six-garrisons"]],
  },
  {
    id: "person:erzhu-rong",
    name: "尔朱荣",
    nameEn: "Erzhu Rong",
    polity: "北魏",
    birth: 493,
    death: 530,
    summary: "北魏末年权臣和军阀，528 年制造河阴之变，深刻破坏北魏中央秩序。",
    aliases: [],
    sourceId: "weishu",
    locator: "魏书·尔朱荣传",
    life: [["528", 528, "massacre", "河阴之变", "在河阴大规模诛杀朝臣，控制北魏朝局。", "china-528-heyin-massacre"]],
  },
  {
    id: "person:yuan-xiu-xiaowu",
    name: "元修",
    nameEn: "Yuan Xiu",
    polity: "北魏/西魏",
    birth: 510,
    death: 535,
    summary: "北魏孝武帝，与高欢不合后西入关中依宇文泰，北魏由此分裂。",
    aliases: ["魏孝武帝"],
    sourceId: "beishi",
    locator: "北史·魏本纪第五",
    life: [["534", 534, "flight", "西入关中", "因与高欢不合，西入关中依宇文泰。", "china-534-northern-wei-splits"]],
  },
  {
    id: "person:yuan-shanjian-xiaojing",
    name: "元善见",
    nameEn: "Yuan Shanjian",
    polity: "东魏",
    birth: 524,
    death: 552,
    summary: "东魏孝静帝，高欢集团在孝武西入关后拥立的东魏皇帝。",
    aliases: ["魏孝静帝"],
    sourceId: "weishu",
    locator: "魏书·孝静纪",
    life: [["534", 534, "accession", "被立为帝", "孝武帝入关后，高欢集团推立元善见。", "china-534-northern-wei-splits"], ["550", 550, "deposition", "禅位于齐", "高洋受禅后，元善见被封为中山王。", "china-550-northern-qi-founded"]],
  },
  {
    id: "person:gao-huan",
    name: "高欢",
    nameEn: "Gao Huan",
    polity: "东魏",
    birth: 496,
    death: 547,
    summary: "东魏实际掌权者，北魏分裂后控制东魏，并与宇文泰长期对峙。",
    aliases: ["齐神武帝"],
    sourceId: "beiqishu",
    locator: "北齐书·神武帝纪",
    life: [["534", 534, "power", "拥立东魏", "孝武西入关后，拥立元善见建立东魏。", "china-534-northern-wei-splits"], ["546", 546, "war", "围攻玉壁", "倾山东之众围玉壁不克。", "china-546-battle-of-yubi"]],
  },
  {
    id: "person:yuwen-tai",
    name: "宇文泰",
    nameEn: "Yuwen Tai",
    polity: "西魏",
    birth: 507,
    death: 556,
    summary: "西魏实际掌权者，经营关中并建立北周宇文氏政权基础。",
    aliases: ["周文帝"],
    sourceId: "zhoushu",
    locator: "周书·文帝纪",
    life: [["534", 534, "power", "承接孝武入关", "孝武帝入关依宇文泰，西魏权力基础形成。", "china-534-northern-wei-splits"], ["537", 537, "war", "沙苑胜东魏", "在沙苑击败高欢军，稳住关中。", "china-537-battle-of-shayuan"]],
  },
  {
    id: "person:wei-xiaokuan",
    name: "韦孝宽",
    nameEn: "Wei Xiaokuan",
    polity: "西魏/北周",
    birth: 509,
    death: 580,
    summary: "西魏、北周名将，以守玉壁击退高欢著称，后参与北周后期军事政治。",
    aliases: [],
    sourceId: "zhoushu",
    locator: "周书·韦孝宽传",
    life: [["546", 546, "war", "守玉壁", "高欢围攻玉壁，韦孝宽坚守不下。", "china-546-battle-of-yubi"]],
  },
  {
    id: "person:hou-jing",
    name: "侯景",
    nameEn: "Hou Jing",
    polity: "东魏/梁",
    birth: 503,
    death: 552,
    summary: "东魏降将，548 年叛梁并攻陷建康，造成梁朝秩序崩溃。",
    aliases: [],
    sourceId: "nanshi",
    locator: "南史·侯景传",
    life: [["548", 548, "rebellion", "叛梁攻建康", "侯景叛乱进入梁朝政治核心。", "china-548-hou-jing-rebellion"], ["552", 552, "death", "败亡", "建康收复后东走，部众瓦解并败亡。", "china-552-hou-jing-rebellion-ends"]],
  },
  {
    id: "person:xiao-yan-liang-wudi",
    name: "萧衍",
    nameEn: "Xiao Yan",
    polity: "梁",
    birth: 464,
    death: 549,
    summary: "梁武帝，502 年代齐建梁，晚年遭侯景之乱冲击。",
    aliases: ["梁武帝"],
    sourceId: "liangshu",
    locator: "梁书·武帝纪",
    life: [["502", 502, "accession", "代齐建梁", "受禅称帝，建立梁朝。", "china-502-liang-founded"], ["548", 548, "crisis", "侯景之乱", "侯景叛乱威胁建康，梁朝秩序崩坏。", "china-548-hou-jing-rebellion"]],
  },
  {
    id: "person:wang-sengbian",
    name: "王僧辩",
    nameEn: "Wang Sengbian",
    polity: "梁",
    birth: null,
    death: 555,
    summary: "梁末将领，参与讨平侯景并收复建康，是梁末军事重组的重要人物。",
    aliases: [],
    sourceId: "liangshu",
    locator: "梁书·王僧辩传",
    life: [["552", 552, "war", "讨平侯景", "与陈霸先等收复建康，侯景败亡。", "china-552-hou-jing-rebellion-ends"]],
  },
  {
    id: "person:xiao-yi-liang-yuandi",
    name: "萧绎",
    nameEn: "Xiao Yi",
    polity: "梁",
    birth: 508,
    death: 555,
    summary: "梁元帝，侯景之乱后在江陵即位，554 年江陵陷落后被杀。",
    aliases: ["梁元帝"],
    sourceId: "liangshu",
    locator: "梁书·元帝纪",
    life: [["554", 554, "death", "江陵陷落", "西魏攻陷江陵，梁元帝被杀。", "china-554-western-wei-sacks-jiangling"]],
  },
  {
    id: "person:gao-yang-northern-qi",
    name: "高洋",
    nameEn: "Gao Yang",
    polity: "北齐",
    birth: 526,
    death: 559,
    summary: "北齐文宣帝，550 年代东魏建立北齐。",
    aliases: ["北齐文宣帝"],
    sourceId: "beiqishu",
    locator: "北齐书·文宣帝纪",
    life: [["550", 550, "accession", "代魏建齐", "受禅称帝，北齐建立。", "china-550-northern-qi-founded"]],
  },
  {
    id: "person:yuwen-jue",
    name: "宇文觉",
    nameEn: "Yuwen Jue",
    polity: "北周",
    birth: 542,
    death: 557,
    summary: "北周孝闵帝，557 年即天王位，北周建立。",
    aliases: ["周孝闵帝"],
    sourceId: "zhoushu",
    locator: "周书·孝闵帝纪",
    life: [["557", 557, "accession", "即天王位", "宇文觉即天王位，北周建立。", "china-557-northern-zhou-and-chen"]],
  },
  {
    id: "person:chen-baxian",
    name: "陈霸先",
    nameEn: "Chen Baxian",
    polity: "陈",
    birth: 503,
    death: 559,
    summary: "陈武帝，557 年受禅建立陈朝。",
    aliases: ["陈武帝"],
    sourceId: "chenshu",
    locator: "陈书·高祖纪",
    life: [["557", 557, "accession", "受禅建陈", "即皇帝位于南郊，陈朝建立。", "china-557-northern-zhou-and-chen"]],
  },
  {
    id: "person:yuwen-yong-zhou-wudi",
    name: "宇文邕",
    nameEn: "Yuwen Yong",
    polity: "北周",
    birth: 543,
    death: 578,
    summary: "北周武帝，577 年灭北齐，重新统一北方。",
    aliases: ["周武帝"],
    sourceId: "zhoushu",
    locator: "周书·武帝纪",
    life: [["577", 577, "unification", "灭北齐", "周军围邺、破齐，北周统一北方。", "china-577-northern-zhou-destroys-qi"]],
  },
  {
    id: "person:gao-wei-northern-qi",
    name: "高纬",
    nameEn: "Gao Wei",
    polity: "北齐",
    birth: 556,
    death: 577,
    summary: "北齐后主，北周灭齐时出奔，北齐政权终结。",
    aliases: ["北齐后主"],
    sourceId: "beiqishu",
    locator: "北齐书·后主幼主纪",
    life: [["577", 577, "deposition", "北齐亡国", "周师逼邺，后主东走，北齐灭亡。", "china-577-northern-zhou-destroys-qi"]],
  },
  {
    id: "person:yang-jian-sui-wendi",
    name: "杨坚",
    nameEn: "Yang Jian",
    polity: "隋",
    birth: 541,
    death: 604,
    summary: "隋文帝，580 年辅政北周，581 年受禅建隋，589 年灭陈完成统一。",
    aliases: ["隋文帝"],
    sourceId: "suishu",
    locator: "隋书·高祖纪",
    life: [["580", 580, "regency", "辅政北周", "入总朝政，都督内外诸军事。", "china-580-yang-jian-regency"], ["589", 589, "unification", "灭陈统一", "隋军平陈，南北统一。", "china-589-sui-conquers-chen"]],
  },
  {
    id: "person:yuwen-chan-zhou-jingdi",
    name: "宇文阐",
    nameEn: "Yuwen Chan",
    polity: "北周",
    birth: 573,
    death: 581,
    summary: "北周静帝，581 年逊位于隋，北周结束。",
    aliases: ["周静帝"],
    sourceId: "zhoushu",
    locator: "周书·静帝纪",
    life: [["581", 581, "deposition", "逊位于隋", "大定元年逊位于隋，北周终结。", "china-581-sui-founded"]],
  },
  {
    id: "person:chen-shubao",
    name: "陈叔宝",
    nameEn: "Chen Shubao",
    polity: "陈",
    birth: 553,
    death: 604,
    summary: "陈后主，589 年隋军入建康后被俘，陈朝灭亡。",
    aliases: ["陈后主"],
    sourceId: "chenshu",
    locator: "陈书·后主纪",
    life: [["589", 589, "deposition", "陈亡被俘", "韩擒虎入建康，陈后主被隋军获出。", "china-589-sui-conquers-chen"]],
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
  db.prepare("DELETE FROM person_life_event_source_refs WHERE life_event_id LIKE 'china-310-589-life:%'").run();
  db.prepare("DELETE FROM person_life_event_historical_events WHERE life_event_id LIKE 'china-310-589-life:%'").run();
  db.prepare("DELETE FROM person_life_events WHERE id LIKE 'china-310-589-life:%'").run();

  let lifeCount = 0;
  let eventLinkCount = 0;
  const eventIds = new Set(people.flatMap((person) => person.life.map((item) => item[5])));

  for (const eventId of eventIds) {
    const event = selectEvent.get(eventId);
    if (!event) {
      throw new Error(`Missing events row for ${eventId}`);
    }
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
      json({ periodId, nameEn: person.nameEn, sourceId: person.sourceId, locator: person.locator }),
    );

    insertEntity.run(
      person.id,
      person.name,
      civilizationId,
      regionId,
      person.birth,
      person.death,
      person.summary,
      json({ periodId, nameEn: person.nameEn, polity: person.polity, sourceId: person.sourceId, locator: person.locator }),
    );

    insertAlias.run(`${person.id}:alias:en`, person.id, person.nameEn, "english-name", "en", json({ periodId }));
    for (const [index, alias] of person.aliases.entries()) {
      insertAlias.run(`${person.id}:alias:zh:${index}`, person.id, alias, "alternate-name", "zh-Hans", json({ periodId }));
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
      json({ documentKind: "person-card", periodId, sourceId: person.sourceId, locator: person.locator }),
    );

    for (const [displayYear, year, type, title, summary, eventId] of person.life) {
      const lifeId = `china-310-589-life:${person.id.replace(/^person:/, "")}:${year}:${type}`;
      insertLifeEvent.run(lifeId, person.id, year, displayYear, type, title, summary, json({ periodId, eventId }));
      insertLifeRef.run(lifeId, person.sourceId, person.locator, json({ periodId }));
      insertLifeEventLink.run(lifeId, eventId);
      insertEventEntity.run(eventId, person.id, type, lifeCount, json({ periodId, generatedFrom: "core-person-life" }));
      lifeCount += 1;
      eventLinkCount += 1;
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded ${people.length} 310-589 core persons, ${lifeCount} life events, ${eventLinkCount} event links.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
