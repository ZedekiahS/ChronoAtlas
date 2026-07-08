import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));
const batchId = "manual-western-han-core-hanshu-links";

const sourceIds = {
  gaodiA: "hanshu-guoxue123-001",
  gaodiB: "hanshu-guoxue123-002",
  huidi: "hanshu-guoxue123-003",
  gaohou: "hanshu-guoxue123-004",
  wendi: "hanshu-guoxue123-005",
  jingdi: "hanshu-guoxue123-006",
  wudi: "hanshu-guoxue123-007",
  zhaodi: "hanshu-guoxue123-008",
  xuandi: "hanshu-guoxue123-009",
  pingdi: "hanshu-guoxue123-013",
  xingfa: "hanshu-guoxue123-027",
  shihuoA: "hanshu-guoxue123-028",
  shihuoB: "hanshu-guoxue123-029",
  liliA: "hanshu-guoxue123-024",
  chenshengXiangji: "hanshu-guoxue123-042",
  hanPengYingLuWu: "hanshu-guoxue123-045",
  xiaoHeCaoCan: "hanshu-guoxue123-050",
  zhangChenWangZhou: "hanshu-guoxue123-051",
  yuanAngChaoCuo: "hanshu-guoxue123-060",
  liGuangSuJian: "hanshu-guoxue123-065",
  weiQingHuoQubing: "hanshu-guoxue123-066",
  dongZhongshu: "hanshu-guoxue123-067",
  zhangQianLiGuangli: "hanshu-guoxue123-073",
  simaQian: "hanshu-guoxue123-074",
  wuwuzi: "hanshu-guoxue123-075",
  huoGuang: "hanshu-guoxue123-081",
  xiongnuA: "hanshu-guoxue123-108",
  xiongnuB: "hanshu-guoxue123-109",
  nanyueChaoxian: "hanshu-guoxue123-110",
  xiyuA: "hanshu-guoxue123-111",
  yuanhou: "hanshu-guoxue123-115",
  wangMangA: "hanshu-guoxue123-116",
  wangMangB: "hanshu-guoxue123-117",
  wangMangC: "hanshu-guoxue123-118",
};

const people = [
  {
    id: "han-liu-bang",
    name: "刘邦",
    life: "前256-前195",
    birthYear: -256,
    deathYear: -195,
    roles: ["ruler", "military"],
    primaryPolity: "西汉",
    summary: "汉高祖，楚汉战争胜出者，建立西汉并奠定汉初郡国并行和功臣封侯格局。",
    sourceId: sourceIds.gaodiA,
    locator: "汉书·高帝纪",
    lifeEvents: [
      ["rise", -206, "受封汉王", "秦亡后刘邦入汉中，为楚汉战争的政治起点。"],
      ["accession", -202, "即皇帝位，建立汉朝", "刘邦在楚汉战争后称帝，西汉政权成立。"],
      ["death", -195, "高祖去世", "刘邦去世后，惠帝继位，吕后逐渐掌握中枢。"],
    ],
  },
  {
    id: "han-lu-zhi",
    name: "吕雉",
    life: "前241-前180",
    birthYear: -241,
    deathYear: -180,
    roles: ["ruler", "family"],
    primaryPolity: "西汉",
    summary: "汉高后，汉初实际执政者，吕氏外戚在其称制期间掌握中枢。",
    sourceId: sourceIds.gaohou,
    locator: "汉书·高后纪",
    lifeEvents: [
      ["regency", -188, "吕后称制", "惠帝去世后，吕后临朝称制。"],
      ["death", -180, "吕后去世", "吕后去世后，诸吕被诛，汉文帝入继大统。"],
    ],
  },
  {
    id: "han-xiao-he",
    name: "萧何",
    life: "前257-前193",
    birthYear: -257,
    deathYear: -193,
    roles: ["civil", "strategist"],
    primaryPolity: "西汉",
    summary: "汉初丞相，负责关中根据地、律令和后勤体系，是汉政权制度化的关键人物。",
    sourceId: sourceIds.xiaoHeCaoCan,
    locator: "汉书·萧何曹参传",
    lifeEvents: [["office", -202, "为相国", "汉初萧何总理政务，延续秦制并重建制度秩序。"]],
  },
  {
    id: "han-cao-can",
    name: "曹参",
    life: "卒前190",
    birthYear: null,
    deathYear: -190,
    roles: ["civil", "military"],
    primaryPolity: "西汉",
    summary: "汉初功臣，继萧何为相，史称萧规曹随。",
    sourceId: sourceIds.xiaoHeCaoCan,
    locator: "汉书·萧何曹参传",
    lifeEvents: [["office", -193, "继任相国", "曹参继萧何之后为相，延续汉初治理方针。"]],
  },
  {
    id: "han-zhang-liang",
    name: "张良",
    life: "卒前186",
    birthYear: null,
    deathYear: -186,
    roles: ["strategist"],
    primaryPolity: "西汉",
    summary: "汉初谋臣，参与楚汉战争重大决策，被列为汉初三杰之一。",
    sourceId: sourceIds.zhangChenWangZhou,
    locator: "汉书·张良传",
    lifeEvents: [["strategy", -203, "佐刘邦争天下", "张良在楚汉对峙中参与战略谋划。"]],
  },
  {
    id: "han-han-xin",
    name: "韩信",
    life: "卒前196",
    birthYear: null,
    deathYear: -196,
    roles: ["military"],
    primaryPolity: "西汉",
    summary: "汉初名将，北定魏赵燕齐，是楚汉战争中决定性军事统帅之一。",
    sourceId: sourceIds.hanPengYingLuWu,
    locator: "汉书·韩信传",
    lifeEvents: [
      ["campaign", -204, "北定赵齐", "韩信在北方战场扩大汉军优势。"],
      ["death", -196, "韩信被诛", "韩信因谋反嫌疑被吕后、萧何设计诛杀。"],
    ],
  },
  {
    id: "han-xiang-yu",
    name: "项羽",
    life: "前232-前202",
    birthYear: -232,
    deathYear: -202,
    roles: ["ruler", "military"],
    primaryPolity: "西楚",
    summary: "西楚霸王，秦末反秦与楚汉战争主角之一，败于垓下后自刎。",
    sourceId: sourceIds.chenshengXiangji,
    locator: "汉书·陈胜项籍传",
    lifeEvents: [["death", -202, "垓下败亡", "项羽在楚汉战争末期败亡，刘邦统一局面形成。"]],
  },
  {
    id: "han-liu-heng",
    name: "刘恒",
    life: "前203-前157",
    birthYear: -203,
    deathYear: -157,
    roles: ["ruler"],
    primaryPolity: "西汉",
    summary: "汉文帝，吕后死后被迎立，文景之治由其奠基。",
    sourceId: sourceIds.wendi,
    locator: "汉书·文帝纪",
    lifeEvents: [["accession", -180, "入继帝位", "诸吕被诛后，代王刘恒被迎立为帝。"]],
  },
  {
    id: "han-liu-qi",
    name: "刘启",
    life: "前188-前141",
    birthYear: -188,
    deathYear: -141,
    roles: ["ruler"],
    primaryPolity: "西汉",
    summary: "汉景帝，平定七国之乱，进一步削弱诸侯王势力。",
    sourceId: sourceIds.jingdi,
    locator: "汉书·景帝纪",
    lifeEvents: [["war", -154, "平七国之乱", "景帝朝中央削藩引发七国之乱，最终平定。"]],
  },
  {
    id: "han-chao-cuo",
    name: "晁错",
    life: "卒前154",
    birthYear: null,
    deathYear: -154,
    roles: ["civil"],
    primaryPolity: "西汉",
    summary: "景帝朝重臣，主张削藩，七国之乱中被诛。",
    sourceId: sourceIds.yuanAngChaoCuo,
    locator: "汉书·爰盎晁错传",
    lifeEvents: [["policy", -154, "主张削藩被诛", "晁错削藩政策成为七国之乱的直接导火线之一。"]],
  },
  {
    id: "han-liu-che",
    name: "刘彻",
    life: "前156-前87",
    birthYear: -156,
    deathYear: -87,
    roles: ["ruler"],
    primaryPolity: "西汉",
    summary: "汉武帝，推行中央集权、经略匈奴和西域，西汉帝国扩张至高峰。",
    sourceId: sourceIds.wudi,
    locator: "汉书·武帝纪",
    lifeEvents: [["accession", -141, "武帝即位", "汉武帝即位后，西汉政治和军事路线逐步转向积极扩张。"]],
  },
  {
    id: "han-wei-qing",
    name: "卫青",
    life: "卒前106",
    birthYear: null,
    deathYear: -106,
    roles: ["military"],
    primaryPolity: "西汉",
    summary: "武帝朝大将，多次出击匈奴，改变汉匈军事格局。",
    sourceId: sourceIds.weiQingHuoQubing,
    locator: "汉书·卫青霍去病传",
    lifeEvents: [["campaign", -124, "出击匈奴", "卫青率汉军多次北击匈奴，夺取战略主动。"]],
  },
  {
    id: "han-huo-qubing",
    name: "霍去病",
    life: "前140-前117",
    birthYear: -140,
    deathYear: -117,
    roles: ["military"],
    primaryPolity: "西汉",
    summary: "武帝朝名将，河西、漠北战役主将之一。",
    sourceId: sourceIds.weiQingHuoQubing,
    locator: "汉书·卫青霍去病传",
    lifeEvents: [["campaign", -121, "河西之战", "霍去病击败匈奴，汉朝控制河西走廊的条件形成。"]],
  },
  {
    id: "han-zhang-qian",
    name: "张骞",
    life: "卒前114",
    birthYear: null,
    deathYear: -114,
    roles: ["diplomat"],
    primaryPolity: "西汉",
    summary: "武帝朝使者，出使西域，开启汉朝对西域的长期经营。",
    sourceId: sourceIds.zhangQianLiGuangli,
    locator: "汉书·张骞李广利传",
    lifeEvents: [["diplomacy", -139, "奉使西域", "张骞首次出使西域，虽历经被拘，仍带回西域地理和政治信息。"]],
  },
  {
    id: "han-dong-zhongshu",
    name: "董仲舒",
    life: "约前179-前104",
    birthYear: -179,
    deathYear: -104,
    roles: ["scholar", "civil"],
    primaryPolity: "西汉",
    summary: "西汉儒者，武帝朝政治思想转向的重要代表。",
    sourceId: sourceIds.dongZhongshu,
    locator: "汉书·董仲舒传",
    lifeEvents: [["policy", -134, "对策贤良", "董仲舒以天人政治和儒学秩序回应武帝策问。"]],
  },
  {
    id: "han-sima-qian",
    name: "司马迁",
    life: "约前145-约前86",
    birthYear: -145,
    deathYear: -86,
    roles: ["scholar"],
    primaryPolity: "西汉",
    summary: "太史令，《史记》作者，西汉史学和文化史核心人物。",
    sourceId: sourceIds.simaQian,
    locator: "汉书·司马迁传",
    lifeEvents: [["writing", -91, "完成《太史公书》", "司马迁撰述《史记》，保存上古至武帝时期历史叙事。"]],
  },
  {
    id: "han-liu-fuling",
    name: "刘弗陵",
    life: "前94-前74",
    birthYear: -94,
    deathYear: -74,
    roles: ["ruler"],
    primaryPolity: "西汉",
    summary: "汉昭帝，武帝之后继位，由霍光等辅政。",
    sourceId: sourceIds.zhaodi,
    locator: "汉书·昭帝纪",
    lifeEvents: [["accession", -87, "昭帝即位", "武帝去世后，昭帝即位，霍光等受遗诏辅政。"]],
  },
  {
    id: "han-huo-guang",
    name: "霍光",
    life: "卒前68",
    birthYear: null,
    deathYear: -68,
    roles: ["civil", "family"],
    primaryPolity: "西汉",
    summary: "武帝、昭帝、宣帝间的权臣，废昌邑王、立宣帝，是西汉中期权力交接核心人物。",
    sourceId: sourceIds.huoGuang,
    locator: "汉书·霍光金日磾传",
    lifeEvents: [["regency", -87, "受遗诏辅政", "霍光受武帝遗诏辅佐昭帝，掌握中枢。"], ["succession", -74, "废昌邑王，立宣帝", "霍光主导废立，宣帝继位。"]],
  },
  {
    id: "han-liu-xun",
    name: "刘询",
    life: "前91-前49",
    birthYear: -91,
    deathYear: -49,
    roles: ["ruler"],
    primaryPolity: "西汉",
    summary: "汉宣帝，霍光死后亲政，西汉中兴时期的代表皇帝。",
    sourceId: sourceIds.xuandi,
    locator: "汉书·宣帝纪",
    lifeEvents: [["accession", -74, "宣帝即位", "昌邑王被废后，刘询被立为帝。"]],
  },
  {
    id: "han-wang-zhengjun",
    name: "王政君",
    life: "前71-13",
    birthYear: -71,
    deathYear: 13,
    roles: ["ruler", "family"],
    primaryPolity: "西汉 / 新",
    summary: "元后，王莽姑母，西汉后期王氏外戚崛起的关键人物。",
    sourceId: sourceIds.yuanhou,
    locator: "汉书·元后传",
    lifeEvents: [["family", -33, "王氏外戚进入中枢", "王政君成为王氏家族政治地位上升的核心。"]],
  },
  {
    id: "han-wang-mang",
    name: "王莽",
    life: "前45-23",
    birthYear: -45,
    deathYear: 23,
    roles: ["ruler", "civil"],
    primaryPolity: "新",
    summary: "西汉末权臣，新朝建立者，代汉称帝后推行托古改制。",
    sourceId: sourceIds.wangMangA,
    locator: "汉书·王莽传",
    lifeEvents: [["usurpation", 9, "王莽代汉建新", "王莽以禅让形式取代西汉，建立新朝。"], ["death", 23, "新朝灭亡，王莽被杀", "绿林军入长安，新朝崩溃。"]],
  },
];

const events = [
  {
    id: "china-209-qin-uprisings",
    year: -209,
    title: "陈胜、吴广起义",
    category: "war",
    importance: "medium",
    locationName: "大泽乡",
    people: ["陈胜", "吴广", "项羽", "刘邦"],
    personIds: ["han-xiang-yu", "han-liu-bang"],
    summary: "秦末戍卒起义引发全国反秦浪潮，西汉叙事由此进入秦亡与楚汉战争前夜。",
    sourceId: sourceIds.chenshengXiangji,
    locator: "汉书·陈胜项籍传",
  },
  {
    id: "china-206-liu-bang-king-of-han",
    year: -206,
    title: "刘邦受封汉王",
    category: "succession",
    importance: "medium",
    locationName: "汉中",
    people: ["刘邦", "项羽"],
    personIds: ["han-liu-bang", "han-xiang-yu"],
    summary: "项羽分封诸王，刘邦为汉王。汉中据点成为随后争夺天下的基础。",
    sourceId: sourceIds.gaodiA,
    locator: "汉书·高帝纪",
  },
  {
    id: "china-202-han-founded",
    year: -202,
    title: "刘邦称帝，西汉建立",
    category: "succession",
    importance: "major",
    locationName: "汜水、长安",
    people: ["刘邦", "项羽", "萧何", "张良", "韩信"],
    personIds: ["han-liu-bang", "han-xiang-yu", "han-xiao-he", "han-zhang-liang", "han-han-xin"],
    summary: "楚汉战争结束后，刘邦即皇帝位，西汉建立。",
    sourceId: sourceIds.gaodiB,
    locator: "汉书·高帝纪",
  },
  {
    id: "china-200-baideng-siege",
    year: -200,
    title: "白登之围",
    category: "war",
    importance: "medium",
    locationName: "白登",
    people: ["刘邦", "冒顿单于"],
    personIds: ["han-liu-bang"],
    summary: "高祖北征匈奴被围于白登，汉初对匈奴政策转向和亲与防御并用。",
    sourceId: sourceIds.xiongnuA,
    locator: "汉书·匈奴传",
  },
  {
    id: "china-196-han-xin-killed",
    year: -196,
    title: "韩信被诛",
    category: "politics",
    importance: "minor",
    locationName: "长安",
    people: ["韩信", "吕雉", "萧何"],
    personIds: ["han-han-xin", "han-lu-zhi", "han-xiao-he"],
    summary: "汉初功臣韩信因谋反嫌疑被诛，功臣集团与皇权关系发生转折。",
    sourceId: sourceIds.hanPengYingLuWu,
    locator: "汉书·韩信传",
  },
  {
    id: "china-188-empress-lu-regency",
    year: -188,
    title: "吕后临朝称制",
    category: "politics",
    importance: "medium",
    locationName: "长安",
    people: ["吕雉", "刘盈"],
    personIds: ["han-lu-zhi"],
    summary: "惠帝去世后，吕后称制，吕氏外戚掌握中枢。",
    sourceId: sourceIds.gaohou,
    locator: "汉书·高后纪",
  },
  {
    id: "china-180-zhulu-purged-wendi-enthroned",
    year: -180,
    title: "诛诸吕，文帝入继",
    category: "succession",
    importance: "major",
    locationName: "长安",
    people: ["吕雉", "刘恒", "陈平", "周勃"],
    personIds: ["han-lu-zhi", "han-liu-heng"],
    summary: "吕后死后，功臣与宗室诛灭诸吕，代王刘恒被迎立为文帝。",
    sourceId: sourceIds.wendi,
    locator: "汉书·文帝纪",
  },
  {
    id: "china-154-rebellion-seven-states",
    year: -154,
    title: "七国之乱",
    category: "war",
    importance: "major",
    locationName: "吴楚、关东",
    people: ["刘启", "晁错"],
    personIds: ["han-liu-qi", "han-chao-cuo"],
    summary: "景帝削藩激化诸侯王叛乱，平乱后中央进一步压制诸侯王势力。",
    sourceId: sourceIds.jingdi,
    locator: "汉书·景帝纪；爰盎晁错传",
  },
  {
    id: "china-141-emperor-wu-enthroned",
    year: -141,
    title: "汉武帝即位",
    category: "succession",
    importance: "medium",
    locationName: "长安",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "汉武帝即位，西汉由文景守成转向积极中央集权和外向扩张。",
    sourceId: sourceIds.wudi,
    locator: "汉书·武帝纪",
  },
  {
    id: "china-139-zhang-qian-western-regions",
    year: -139,
    title: "张骞出使西域",
    category: "diplomacy",
    importance: "medium",
    locationName: "长安、西域",
    people: ["张骞", "刘彻"],
    personIds: ["han-zhang-qian", "han-liu-che"],
    summary: "张骞奉命出使西域，汉朝开始系统认识并经营西域交通和政治格局。",
    sourceId: sourceIds.zhangQianLiGuangli,
    locator: "汉书·张骞李广利传；西域传",
  },
  {
    id: "china-134-dong-zhongshu-policy",
    year: -134,
    title: "董仲舒对策贤良",
    category: "culture",
    importance: "minor",
    locationName: "长安",
    people: ["董仲舒", "刘彻"],
    personIds: ["han-dong-zhongshu", "han-liu-che"],
    summary: "董仲舒对策贤良，儒学政治话语在武帝朝获得更高制度地位。",
    sourceId: sourceIds.dongZhongshu,
    locator: "汉书·董仲舒传",
  },
  {
    id: "china-127-han-xiongnu-henan",
    year: -127,
    title: "卫青收复河南地",
    category: "war",
    importance: "minor",
    locationName: "河南地、朔方",
    people: ["卫青", "刘彻"],
    personIds: ["han-wei-qing", "han-liu-che"],
    summary: "卫青出击匈奴，收复河南地，汉朝在北边设置朔方等郡，边防格局改变。",
    sourceId: sourceIds.weiQingHuoQubing,
    locator: "汉书·卫青霍去病传",
  },
  {
    id: "china-121-hexi-campaign",
    year: -121,
    title: "霍去病河西之战",
    category: "war",
    importance: "medium",
    locationName: "河西走廊",
    people: ["霍去病", "刘彻"],
    personIds: ["han-huo-qubing", "han-liu-che"],
    summary: "霍去病击败匈奴，汉朝控制河西走廊的条件形成，西域交通更加稳固。",
    sourceId: sourceIds.weiQingHuoQubing,
    locator: "汉书·卫青霍去病传",
  },
  {
    id: "china-119-mobei-campaign",
    year: -119,
    title: "漠北之战",
    category: "war",
    importance: "major",
    locationName: "漠北",
    people: ["卫青", "霍去病", "刘彻"],
    personIds: ["han-wei-qing", "han-huo-qubing", "han-liu-che"],
    summary: "卫青、霍去病分道北击匈奴，汉匈力量对比出现重大变化。",
    sourceId: sourceIds.weiQingHuoQubing,
    locator: "汉书·卫青霍去病传；匈奴传",
  },
  {
    id: "china-87-emperor-zhao-huo-guang",
    year: -87,
    title: "武帝崩，霍光辅昭帝",
    category: "succession",
    importance: "major",
    locationName: "长安",
    people: ["刘彻", "刘弗陵", "霍光"],
    personIds: ["han-liu-che", "han-liu-fuling", "han-huo-guang"],
    summary: "汉武帝去世，昭帝即位，霍光等受遗诏辅政，西汉进入权臣辅政阶段。",
    sourceId: sourceIds.zhaodi,
    locator: "汉书·昭帝纪；霍光金日磾传",
  },
  {
    id: "china-74-huo-guang-enthrones-xuandi",
    year: -74,
    title: "霍光废昌邑王，立宣帝",
    category: "succession",
    importance: "medium",
    locationName: "长安",
    people: ["霍光", "刘询"],
    personIds: ["han-huo-guang", "han-liu-xun"],
    summary: "霍光主导废立，刘询即位为宣帝，西汉中期法统在权臣操作下重建。",
    sourceId: sourceIds.huoGuang,
    locator: "汉书·霍光金日磾传；宣帝纪",
  },
  {
    id: "china-60-western-regions-protectorate",
    year: -60,
    title: "西域都护设置",
    category: "frontier",
    importance: "major",
    locationName: "西域",
    people: ["刘询"],
    personIds: ["han-liu-xun"],
    summary: "西汉在西域设置都护，标志汉朝对西域交通和政治秩序的制度性经营。",
    sourceId: sourceIds.xiyuA,
    locator: "汉书·西域传",
  },
  {
    id: "china-9-wang-mang-usurps-han",
    year: 9,
    title: "王莽代汉建新",
    category: "succession",
    importance: "major",
    locationName: "长安",
    people: ["王莽", "王政君"],
    personIds: ["han-wang-mang", "han-wang-zhengjun"],
    summary: "王莽以禅让形式取代西汉，建立新朝，西汉法统结束。",
    sourceId: sourceIds.wangMangA,
    locator: "汉书·王莽传",
  },
  {
    id: "china-23-xin-dynasty-falls",
    year: 23,
    title: "新朝灭亡，王莽被杀",
    category: "war",
    importance: "major",
    locationName: "长安",
    people: ["王莽"],
    personIds: ["han-wang-mang"],
    summary: "绿林军入长安，王莽被杀，新朝灭亡，东汉重建的政治前夜形成。",
    sourceId: sourceIds.wangMangC,
    locator: "汉书·王莽传",
  },
  {
    id: "china-201-western-han-enfeoffments",
    year: -201,
    title: "汉初分封异姓诸侯王",
    category: "politics",
    importance: "medium",
    locationName: "关东诸国",
    people: ["刘邦", "韩信"],
    personIds: ["han-liu-bang", "han-han-xin"],
    summary: "刘邦称帝后分封功臣和异姓王，形成汉初郡县与诸侯国并行的政治格局，也埋下后续削平异姓王的张力。",
    sourceId: sourceIds.gaodiB,
    locator: "汉书·高帝纪；异姓诸侯王表",
  },
  {
    id: "china-191-xiao-he-dies-cao-can-succeeds",
    year: -191,
    title: "萧何卒，曹参继相",
    category: "politics",
    importance: "minor",
    locationName: "长安",
    people: ["萧何", "曹参"],
    personIds: ["han-xiao-he", "han-cao-can"],
    summary: "萧何去世后，曹参继任相国，汉初政务延续萧何旧制，后世概括为萧规曹随。",
    sourceId: sourceIds.xiaoHeCaoCan,
    locator: "汉书·萧何曹参传",
  },
  {
    id: "china-167-wendi-abolishes-mutilating-punishments",
    year: -167,
    title: "文帝废除肉刑",
    category: "politics",
    importance: "medium",
    locationName: "长安",
    people: ["刘恒"],
    personIds: ["han-liu-heng"],
    summary: "文帝改革刑制，废除部分肉刑，体现汉初轻徭薄赋和宽刑路线。",
    sourceId: sourceIds.xingfa,
    locator: "汉书·刑法志；文帝纪",
  },
  {
    id: "china-155-chao-cuo-proposes-cutting-fiefs",
    year: -155,
    title: "晁错上削藩策",
    category: "politics",
    importance: "minor",
    locationName: "长安",
    people: ["晁错", "刘启"],
    personIds: ["han-chao-cuo", "han-liu-qi"],
    summary: "晁错主张削减诸侯王封地，直接推动景帝朝中央与诸侯国矛盾激化。",
    sourceId: sourceIds.yuanAngChaoCuo,
    locator: "汉书·爰盎晁错传",
  },
  {
    id: "china-140-jianyuan-new-politics",
    year: -140,
    title: "建元新政与武帝初政",
    category: "politics",
    importance: "medium",
    locationName: "长安",
    people: ["刘彻", "董仲舒"],
    personIds: ["han-liu-che", "han-dong-zhongshu"],
    summary: "武帝初年更化改制，试图摆脱窦太后黄老政治约束，中央政治风格开始转向积极有为。",
    sourceId: sourceIds.wudi,
    locator: "汉书·武帝纪",
  },
  {
    id: "china-136-five-classics-doctors",
    year: -136,
    title: "置五经博士",
    category: "culture",
    importance: "medium",
    locationName: "长安",
    people: ["刘彻", "董仲舒"],
    personIds: ["han-liu-che", "han-dong-zhongshu"],
    summary: "武帝朝设置五经博士，儒学进入国家教育与官僚选拔体系的核心位置。",
    sourceId: sourceIds.dongZhongshu,
    locator: "汉书·董仲舒传；儒林传",
  },
  {
    id: "china-129-first-han-xiongnu-offensives",
    year: -129,
    title: "汉军首次大规模主动出击匈奴",
    category: "war",
    importance: "medium",
    locationName: "上谷、雁门、代郡、云中",
    people: ["卫青", "刘彻"],
    personIds: ["han-wei-qing", "han-liu-che"],
    summary: "武帝派多路骑兵出击匈奴，汉匈关系由和亲防御逐渐转入主动进攻。",
    sourceId: sourceIds.xiongnuA,
    locator: "汉书·匈奴传；卫青霍去病传",
  },
  {
    id: "china-124-wei-qing-longxi-campaign",
    year: -124,
    title: "卫青再击匈奴，汉军夺取主动",
    category: "war",
    importance: "minor",
    locationName: "漠南",
    people: ["卫青"],
    personIds: ["han-wei-qing"],
    summary: "卫青连续出塞作战，汉军骑兵远征能力和边防动员体系逐渐成熟。",
    sourceId: sourceIds.weiQingHuoQubing,
    locator: "汉书·卫青霍去病传",
  },
  {
    id: "china-119-salt-iron-monopoly",
    year: -119,
    title: "盐铁官营与财政扩张",
    category: "economy",
    importance: "medium",
    locationName: "长安",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "武帝朝推行盐铁等国家财政措施，以支撑长期对匈奴战争和帝国扩张。",
    sourceId: sourceIds.shihuoB,
    locator: "汉书·食货志",
  },
  {
    id: "china-117-huo-qubing-dies",
    year: -117,
    title: "霍去病去世",
    category: "society",
    importance: "minor",
    locationName: "长安",
    people: ["霍去病"],
    personIds: ["han-huo-qubing"],
    summary: "霍去病早逝，武帝朝最具突破性的骑兵统帅退场。",
    sourceId: sourceIds.weiQingHuoQubing,
    locator: "汉书·卫青霍去病传",
  },
  {
    id: "china-112-nanyue-war-begins",
    year: -112,
    title: "汉武帝发兵南越",
    category: "war",
    importance: "medium",
    locationName: "南越",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "南越内乱后，武帝发兵南征，岭南纳入汉朝郡县统治进入最后阶段。",
    sourceId: sourceIds.nanyueChaoxian,
    locator: "汉书·西南夷两粤朝鲜传",
  },
  {
    id: "china-111-nanyue-annexed",
    year: -111,
    title: "南越并入汉郡县",
    category: "frontier",
    importance: "major",
    locationName: "岭南",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "汉军灭南越，设置南海、苍梧、郁林等郡，岭南正式纳入汉帝国行政体系。",
    sourceId: sourceIds.nanyueChaoxian,
    locator: "汉书·西南夷两粤朝鲜传",
  },
  {
    id: "china-108-gojoseon-annexed",
    year: -108,
    title: "汉灭卫氏朝鲜，设四郡",
    category: "frontier",
    importance: "medium",
    locationName: "朝鲜半岛北部",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "武帝朝灭卫氏朝鲜，设乐浪等郡，东北边疆进入汉郡县体系。",
    sourceId: sourceIds.nanyueChaoxian,
    locator: "汉书·西南夷两粤朝鲜传",
  },
  {
    id: "china-104-taichu-calendar",
    year: -104,
    title: "太初改历",
    category: "culture",
    importance: "minor",
    locationName: "长安",
    people: ["刘彻", "司马迁"],
    personIds: ["han-liu-che", "han-sima-qian"],
    summary: "武帝太初年间改定历法，帝国制度、祭祀和天文历算进一步整合。",
    sourceId: sourceIds.liliA,
    locator: "汉书·律历志",
  },
  {
    id: "china-104-dayuan-campaign",
    year: -104,
    title: "李广利远征大宛",
    category: "war",
    importance: "medium",
    locationName: "大宛",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "武帝派李广利远征大宛，西域经营从外交探索转向军事干预。",
    sourceId: sourceIds.zhangQianLiGuangli,
    locator: "汉书·张骞李广利传",
  },
  {
    id: "china-99-li-ling-surrenders",
    year: -99,
    title: "李陵兵败降匈奴",
    category: "war",
    importance: "minor",
    locationName: "漠北",
    people: ["司马迁", "刘彻"],
    personIds: ["han-sima-qian", "han-liu-che"],
    summary: "李陵兵败降匈奴，司马迁为其辩护获罪，此事成为武帝晚年政治和史学史的重要节点。",
    sourceId: sourceIds.liGuangSuJian,
    locator: "汉书·李广苏建传；司马迁传",
  },
  {
    id: "china-91-witchcraft-disaster",
    year: -91,
    title: "巫蛊之祸",
    category: "politics",
    importance: "major",
    locationName: "长安",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "武帝晚年巫蛊案扩大，太子刘据起兵失败，西汉储位和中枢政治遭受重创。",
    sourceId: sourceIds.wuwuzi,
    locator: "汉书·武五子传；武帝纪",
  },
  {
    id: "china-89-luntai-edict",
    year: -89,
    title: "轮台诏",
    category: "politics",
    importance: "medium",
    locationName: "长安",
    people: ["刘彻"],
    personIds: ["han-liu-che"],
    summary: "武帝晚年下轮台诏，停止部分远征和屯田计划，政策方向出现收束。",
    sourceId: sourceIds.wudi,
    locator: "汉书·武帝纪",
  },
  {
    id: "china-81-salt-iron-debate",
    year: -81,
    title: "盐铁会议",
    category: "economy",
    importance: "medium",
    locationName: "长安",
    people: ["霍光"],
    personIds: ["han-huo-guang"],
    summary: "昭帝朝围绕盐铁官营、均输平准和对外政策展开辩论，武帝以来国家财政路线受到系统审视。",
    sourceId: sourceIds.shihuoB,
    locator: "汉书·食货志",
  },
  {
    id: "china-68-huo-guang-dies",
    year: -68,
    title: "霍光去世",
    category: "politics",
    importance: "minor",
    locationName: "长安",
    people: ["霍光", "刘询"],
    personIds: ["han-huo-guang", "han-liu-xun"],
    summary: "霍光去世后，宣帝逐渐亲政，霍氏家族的权力基础开始动摇。",
    sourceId: sourceIds.huoGuang,
    locator: "汉书·霍光金日磾传；宣帝纪",
  },
  {
    id: "china-51-huhanye-changan",
    year: -51,
    title: "呼韩邪单于入朝",
    category: "diplomacy",
    importance: "medium",
    locationName: "长安",
    people: ["刘询"],
    personIds: ["han-liu-xun"],
    summary: "呼韩邪单于入朝，汉匈关系出现以朝贡和册封为框架的新局面。",
    sourceId: sourceIds.xiongnuB,
    locator: "汉书·匈奴传",
  },
  {
    id: "china-33-wang-zhengjun-empress-dowager",
    year: -33,
    title: "王政君为皇太后，王氏外戚坐大",
    category: "politics",
    importance: "medium",
    locationName: "长安",
    people: ["王政君", "王莽"],
    personIds: ["han-wang-zhengjun", "han-wang-mang"],
    summary: "元帝去世后，王政君成为皇太后，王氏外戚逐步进入西汉后期权力核心。",
    sourceId: sourceIds.yuanhou,
    locator: "汉书·元后传",
  },
  {
    id: "china-8-wang-mang-regent",
    year: -8,
    title: "王莽进入中枢，王氏外戚权势上升",
    category: "politics",
    importance: "minor",
    locationName: "长安",
    people: ["王莽", "王政君"],
    personIds: ["han-wang-mang", "han-wang-zhengjun"],
    summary: "成哀之际，王莽凭借王氏外戚身份进入中枢并积累政治声望，为后来的摄政和代汉铺路。",
    sourceId: sourceIds.wangMangA,
    locator: "汉书·王莽传；元后传",
  },
  {
    id: "china-1-wang-mang-ankhan",
    year: 1,
    title: "王莽为安汉公",
    category: "politics",
    importance: "medium",
    locationName: "长安",
    people: ["王莽", "王政君"],
    personIds: ["han-wang-mang", "han-wang-zhengjun"],
    summary: "平帝时期王莽以安汉公身份辅政，逐步掌握国家礼制和权力资源。",
    sourceId: sourceIds.wangMangB,
    locator: "汉书·王莽传",
  },
  {
    id: "china-5-emperor-ping-dies",
    year: 5,
    title: "汉平帝去世，王莽摄政更深",
    category: "succession",
    importance: "medium",
    locationName: "长安",
    people: ["王莽"],
    personIds: ["han-wang-mang"],
    summary: "平帝去世后，王莽立孺子婴并居摄，西汉皇权进一步空心化。",
    sourceId: sourceIds.pingdi,
    locator: "汉书·平帝纪；王莽传",
  },
  {
    id: "china-14-wang-mang-reforms",
    year: 14,
    title: "王莽托古改制全面展开",
    category: "politics",
    importance: "medium",
    locationName: "长安",
    people: ["王莽"],
    personIds: ["han-wang-mang"],
    summary: "新朝推行币制、官制、地名和土地制度等托古改制，社会经济秩序剧烈震荡。",
    sourceId: sourceIds.wangMangB,
    locator: "汉书·王莽传",
  },
  {
    id: "china-18-red-eyebrows-green-woods-rise",
    year: 18,
    title: "赤眉、绿林起义兴起",
    category: "war",
    importance: "major",
    locationName: "山东、南阳",
    people: ["王莽"],
    personIds: ["han-wang-mang"],
    summary: "新朝末年灾荒和政治失序推动赤眉、绿林等起义兴起，王莽政权进入崩溃阶段。",
    sourceId: sourceIds.wangMangC,
    locator: "汉书·王莽传",
  },
];

const roleMap = {
  ruler: "ruler",
  military: "military",
  strategist: "strategist",
  civil: "civil",
  scholar: "scholar",
  family: "family",
  diplomat: "civil",
};

const upsertPerson = db.prepare(`
  INSERT OR REPLACE INTO persons
    (id, region, name, courtesy_name, life, birth_year, death_year, life_confidence, primary_polity, summary, coverage_status, raw_json)
  VALUES
    (@id, 'china', @name, NULL, @life, @birthYear, @deathYear, 'medium', @primaryPolity, @summary, 'seeded-core', @rawJson)
`);
const upsertPersonI18n = db.prepare(`
  INSERT OR REPLACE INTO person_i18n
    (person_id, locale, name, courtesy_name, life, primary_polity, summary, raw_json)
  VALUES
    (?, 'zh', ?, NULL, ?, ?, ?, '{}')
`);
const deletePersonRoles = db.prepare("DELETE FROM person_roles WHERE person_id = ?");
const insertRole = db.prepare("INSERT OR REPLACE INTO person_roles (person_id, role, sort_order) VALUES (?, ?, ?)");
const deleteLifeEvents = db.prepare("DELETE FROM person_life_events WHERE person_id = ? AND id LIKE 'western-han-life:%'");
const upsertLifeEvent = db.prepare(`
  INSERT OR REPLACE INTO person_life_events
    (id, person_id, year, end_year, display_year, type, title, summary, confidence, approximate, raw_json)
  VALUES
    (@id, @personId, @year, @year, @displayYear, @type, @title, @summary, 'medium', 0, @rawJson)
`);
const upsertLifeEventI18n = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_i18n
    (life_event_id, locale, title, summary, raw_json)
  VALUES
    (?, 'zh', ?, ?, '{}')
`);
const deleteLifeEventSourceRefs = db.prepare("DELETE FROM person_life_event_source_refs WHERE life_event_id = ?");
const insertLifeEventSourceRef = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_source_refs
    (life_event_id, source_id, locator, quote, raw_json)
  VALUES
    (?, ?, ?, NULL, ?)
`);

const upsertHistoricalEvent = db.prepare(`
  INSERT OR REPLACE INTO historical_events
    (id, title, region, start_year, end_year, location_name, category, summary, confidence, coordinates_json, detail_json, raw_json)
  VALUES
    (@id, @title, 'china', @year, @year, @locationName, @category, @summary, 'medium', NULL, @detailJson, @rawJson)
`);
const upsertHistoricalEventI18n = db.prepare(`
  INSERT OR REPLACE INTO historical_event_i18n
    (event_id, locale, title, location_name, summary, raw_json)
  VALUES
    (?, 'zh', ?, ?, ?, '{}')
`);
const deleteHistoricalPeople = db.prepare("DELETE FROM historical_event_people WHERE event_id = ?");
const insertHistoricalPerson = db.prepare(`
  INSERT OR REPLACE INTO historical_event_people
    (event_id, person_id, display_name, sort_order)
  VALUES
    (?, ?, ?, ?)
`);
const deleteHistoricalSources = db.prepare("DELETE FROM historical_event_sources WHERE event_id = ?");
const insertHistoricalSource = db.prepare(`
  INSERT OR REPLACE INTO historical_event_sources
    (event_id, source_id, locator, raw_json)
  VALUES
    (?, ?, ?, ?)
`);
const upsertEvent = db.prepare(`
  INSERT OR REPLACE INTO events
    (id, title, event_type, time_start, time_end, display_time, region_id, place_entity_id, summary, confidence, review_status, raw_json)
  VALUES
    (@id, @title, @category, @year, @year, @displayTime, 'china', NULL, @summary, 'medium', 'reviewed', @rawJson)
`);
const upsertEventI18n = db.prepare(`
  INSERT OR REPLACE INTO event_i18n
    (event_id, locale, title, display_time, summary, raw_json)
  VALUES
    (?, 'zh', ?, ?, ?, '{}')
`);
const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents
    (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES
    (@id, @subjectTable, @subjectId, @title, @body, 'zh-Hans', 'china', NULL, @topicId, @timeStart, @timeEnd, 'reviewed', @rawJson)
`);

function formatYear(year) {
  return year < 0 ? `前${Math.abs(year)}年` : `${year}年`;
}

function json(value) {
  return JSON.stringify(value);
}

function upsertEventImportance(eventId, importance) {
  const row = db.prepare("SELECT raw_json FROM app_runtime_datasets WHERE id = 'event-importance-180-280'").get();
  const payload = row ? JSON.parse(row.raw_json) : { model: "event-importance", defaultImportance: "minor", records: [] };
  payload.defaultImportance = "minor";
  const records = new Map((payload.records ?? []).map((record) => [record.eventId, record]));
  records.set(eventId, { eventId, importance });
  payload.records = [...records.values()].sort((left, right) => left.eventId.localeCompare(right.eventId));
  db.prepare(`
    INSERT OR REPLACE INTO app_runtime_datasets (id, model, schema_version, raw_json, updated_at)
    VALUES ('event-importance-180-280', 'event-importance', 1, ?, datetime('now'))
  `).run(JSON.stringify(payload));
}

function ensureSourcesExist() {
  const missing = [...new Set(Object.values(sourceIds))].filter((sourceId) => !db.prepare("SELECT 1 FROM sources WHERE id = ?").get(sourceId));
  if (missing.length) {
    throw new Error(`Missing Hanshu sources. Run npm run import:domestic-official-history-fulltext -- hanshu first. Missing: ${missing.join(", ")}`);
  }
}

db.exec("PRAGMA foreign_keys = ON;");
ensureSourcesExist();
db.exec("BEGIN;");
try {
  for (const person of people) {
    const rawJson = json({ ...person, generatedFrom: batchId });
    upsertPerson.run({
      id: person.id,
      name: person.name,
      life: person.life,
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      primaryPolity: person.primaryPolity,
      summary: person.summary,
      rawJson,
    });
    upsertPersonI18n.run(person.id, person.name, person.life, person.primaryPolity, person.summary);
    deletePersonRoles.run(person.id);
    person.roles.forEach((role, index) => insertRole.run(person.id, roleMap[role] ?? role, index));
    deleteLifeEvents.run(person.id);

    for (const [type, year, title, summary] of person.lifeEvents) {
      const lifeEventId = `western-han-life:${person.id}:${year}:${type}`;
      const lifeRawJson = json({ generatedFrom: batchId, personId: person.id, sourceId: person.sourceId, locator: person.locator });
      upsertLifeEvent.run({
        id: lifeEventId,
        personId: person.id,
        year,
        displayYear: formatYear(year),
        type,
        title,
        summary,
        rawJson: lifeRawJson,
      });
      upsertLifeEventI18n.run(lifeEventId, title, summary);
      deleteLifeEventSourceRefs.run(lifeEventId);
      insertLifeEventSourceRef.run(lifeEventId, person.sourceId, person.locator, lifeRawJson);
    }

    upsertSearchDocument.run({
      id: `search:person:${person.id}`,
      subjectTable: "persons",
      subjectId: person.id,
      title: person.name,
      body: [person.name, person.life, person.primaryPolity, person.summary, person.locator].join("\n"),
      topicId: null,
      timeStart: person.birthYear ?? -206,
      timeEnd: person.deathYear ?? 23,
      rawJson,
    });
  }

  for (const event of events) {
    const rawJson = json({
      ...event,
      startYear: event.year,
      endYear: event.year,
      region: "china",
      sources: [event.sourceId],
      sourceRefs: [{ sourceId: event.sourceId, locator: event.locator }],
      reviewStatus: "reviewed",
      reviewedBy: batchId,
    });
    const detailJson = json({
      overview: event.summary,
      sourceNotes: [`${event.sourceId}：${event.locator}`],
    });
    upsertHistoricalEvent.run({
      id: event.id,
      title: event.title,
      year: event.year,
      locationName: event.locationName,
      category: event.category,
      summary: event.summary,
      detailJson,
      rawJson,
    });
    upsertHistoricalEventI18n.run(event.id, event.title, event.locationName, event.summary);
    deleteHistoricalPeople.run(event.id);
    event.people.forEach((name, index) => insertHistoricalPerson.run(event.id, event.personIds[index] ?? null, name, index));
    deleteHistoricalSources.run(event.id);
    insertHistoricalSource.run(event.id, event.sourceId, event.locator, json({ sourceId: event.sourceId, locator: event.locator }));
    upsertEvent.run({
      id: event.id,
      title: event.title,
      category: event.category,
      year: event.year,
      displayTime: formatYear(event.year),
      summary: event.summary,
      rawJson,
    });
    upsertEventI18n.run(event.id, event.title, formatYear(event.year), event.summary);
    upsertSearchDocument.run({
      id: `search:event:${event.id}`,
      subjectTable: "events",
      subjectId: event.id,
      title: event.title,
      body: [event.title, event.summary, event.people.join(" "), event.locator].join("\n"),
      topicId: null,
      timeStart: event.year,
      timeEnd: event.year,
      rawJson,
    });
    upsertEventImportance(event.id, event.importance);
  }

  db.exec("COMMIT;");
  console.log(`Seeded ${people.length} Western Han people and ${events.length} Hanshu-linked events.`);
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
} finally {
  db.close();
}
