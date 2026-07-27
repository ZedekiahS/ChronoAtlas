export const easternHan89105ProfileId = "china-eastern-han-25-183-v1";
export const easternHan89105BatchId = "auto-houhanshu-eastern-han-89-105-candidates";
export const easternHan89105PeriodId = "china-eastern-han-25-184";
export const easternHan89105Generator = "official-history-candidate-repair:eastern-han-89-105-v1";

const card = (suffix) => `card:houhanshu-eastern-han-89-105:${suffix}`;
const canonical = (id, name, summary, options = {}) => ({
  id,
  name,
  aliases: options.aliases ?? [],
  birthYear: options.birthYear,
  deathYear: options.deathYear,
  primaryPolity: options.primaryPolity ?? "东汉",
  summary,
});

const people = {
  hedi: canonical("han-hedi", "汉和帝", "东汉第四位皇帝刘肇，永元、元兴年间在位。", {
    aliases: ["刘肇", "和帝"],
    birthYear: 79,
    deathYear: 105,
  }),
  douXian: canonical("eh-dou-xian", "窦宪", "东汉外戚与将领，永元元年率军大破北匈奴，永元四年失势自杀。", {
    aliases: ["车骑将军窦宪", "大将军窦宪"],
    deathYear: 92,
  }),
  gengBing: canonical("official-history-person-4754c6d3ef0340dd", "耿秉", "东汉将领，永元元年随窦宪出朔方击破北匈奴。", {
    aliases: ["征西将军耿秉"],
    deathYear: 91,
  }),
  banGu: canonical("eh-ban-gu", "班固", "东汉史家与官员，随窦宪北征并撰写燕然山铭。", {
    aliases: ["兰台令史班固"],
    birthYear: 32,
    deathYear: 92,
  }),
  liangFeng: canonical("eh-liang-feng", "梁讽", "东汉官员，永元元年任军司马，奉命出使北匈奴宣示汉朝威德。"),
  weiBiao: canonical("eh-wei-biao", "韦彪", "东汉大鸿胪，永元元年去世。", { deathYear: 89 }),
  liuYanFuling: canonical("eh-liu-yan-fuling", "刘延", "东汉阜陵王，永元元年去世。", {
    aliases: ["阜陵王延"],
    deathYear: 89,
  }),
  liuShou: canonical("official-history-person-04911d354153189b", "刘寿", "汉章帝之子，永元二年受封济北王。", {
    aliases: ["济北王寿"],
  }),
  liuKai: canonical("eh-liu-kai-hejian", "刘开", "汉章帝之子，永元二年受封河间王。", {
    aliases: ["河间王开", "河闲王开"],
  }),
  liuShu: canonical("eh-liu-shu-chengyang", "刘淑", "汉章帝之子，永元二年受封城阳王，永元六年去世后国除。", {
    aliases: ["城阳王淑"],
    deathYear: 94,
  }),
  liuCe: canonical("official-history-person-c4dc093aeda1fd59", "刘侧", "淮阳王刘昞之子，永元二年承封常山王，永元十四年去世。", {
    aliases: ["常山王侧"],
    deathYear: 102,
  }),
  liuMu: canonical("official-history-person-9731a84cd49dffe1", "刘睦", "东汉北海王，刘威之父。", {
    aliases: ["北海王睦"],
  }),
  liuWei: canonical("official-history-person-295ea6aa55508380", "刘威", "北海王刘睦之子，永元二年承封北海王。", {
    aliases: ["北海王威"],
  }),
  yanPan: canonical("official-history-person-66eb1363c0c10ab9", "阎磐", "东汉副校尉，永元二年讨北匈奴并夺取伊吾卢。", {
    aliases: ["副校尉阎磐"],
  }),
  liuHuang: canonical("official-history-person-cf7e0d4ea5d5efab", "刘晃", "东汉齐王，刘无忌之父。", {
    aliases: ["齐王晃", "故齐王晃"],
  }),
  liuWuji: canonical("official-history-person-df8bb53562cb156a", "刘无忌", "齐王刘晃之子，永元二年恢复齐王封爵。", {
    aliases: ["齐王无忌"],
  }),
  liuYanZhongshan: canonical("official-history-person-c6de2fab787e1f42", "刘焉", "东汉中山王，永元二年去世。", {
    aliases: ["中山王焉"],
    deathYear: 90,
  }),
  liuZhong: canonical("official-history-person-8eabc1458fd95da3", "刘种", "东汉阜陵王，永元三年去世且无嗣。", {
    aliases: ["阜陵王种"],
    deathYear: 91,
  }),
  tanRong: canonical("official-history-person-f8a4b5cfd79643a8", "潭戎", "永元四年参与溇中、澧中蛮叛乱的首领。", {
    primaryPolity: "武陵蛮",
  }),
  yuchujian: canonical("official-history-person-c83245c40f6183b3", "于除鞬", "北匈奴右谷蠡王，永元四年自立为单于并向汉请降，永元五年叛归北方后被任尚讨灭。", {
    aliases: ["於除鞬"],
    deathYear: 93,
    primaryPolity: "北匈奴",
  }),
  renShang: canonical("official-history-person-1acec78a2cbc2701", "任尚", "东汉边将，永元五年讨灭于除鞬，永元六年率乌桓、鲜卑击败逢侯。", {
    aliases: ["护乌桓校尉任尚", "中郎将任尚"],
  }),
  anguoShanyu: canonical("eh-anguo-southern-xiongnu", "南单于安国", "南匈奴单于，永元六年因与使匈奴中郎将杜崇失和而叛乱，后被骨都侯喜杀死。", {
    aliases: ["安国", "单于安国"],
    deathYear: 94,
    primaryPolity: "南匈奴",
  }),
  guduHouXi: canonical("eh-gudu-hou-xi", "骨都侯喜", "南匈奴骨都侯，永元六年杀死叛乱的南单于安国。", {
    primaryPolity: "南匈奴",
  }),
  fenghouXiongnu: canonical("eh-fenghou-xiongnu", "逢侯", "南单于安国从弟之子，永元六年率叛胡出塞，遭汉军追击后远遁。", {
    primaryPolity: "南匈奴",
  }),
  liuFang: canonical("official-history-person-51d62193bc768f51", "刘鲂", "刘种之兄，永元五年承封阜陵王。", {
    aliases: ["阜陵王鲂"],
  }),
  liuKangQiancheng: canonical("eh-liu-kang-qiancheng", "刘伉", "东汉千乘王，永元五年去世。", {
    aliases: ["千乘王伉"],
    deathYear: 93,
  }),
  liuWansui: canonical("official-history-person-c05a27d9a87a2e9a", "刘万岁", "汉章帝之子，永元五年受封广宗王，同年去世且无后。", {
    aliases: ["广宗王万岁"],
    deathYear: 93,
  }),
  moYan: canonical("official-history-person-93a0fb0d5a7a356c", "莫延", "敦忍乙王，永元六年遣使向东汉贡献犀牛、大象。", {
    aliases: ["敦忍乙王莫延"],
    primaryPolity: "敦忍乙",
  }),
  banChao: canonical("eh-ban-chao", "班超", "东汉经营西域的核心将领，永元六年攻破焉耆、尉黎诸国。", {
    aliases: ["西域都护班超", "都护班超"],
    birthYear: 32,
    deathYear: 102,
  }),
  dengHong: canonical("official-history-person-0148a42667f8d97c", "邓鸿", "东汉行车骑将军，因南匈奴安国案于永元七年下狱死。", {
    aliases: ["行车骑将军邓鸿"],
    deathYear: 95,
  }),
  zhuHui: canonical("official-history-person-d3aca821012a30cb", "朱徽", "东汉度辽将军，因南匈奴安国案于永元七年下狱死。", {
    aliases: ["度辽将军朱徽"],
    deathYear: 95,
  }),
  duChong: canonical("official-history-person-69f4cc2aa5ed12c4", "杜崇", "东汉使匈奴中郎将，因南匈奴安国案于永元七年下狱死。", {
    aliases: ["中郎将杜崇", "使匈奴中郎将杜崇"],
    deathYear: 95,
  }),
  liuDingPei: canonical("eh-liu-ding-pei", "刘定", "东汉沛王，永元七年去世。", {
    aliases: ["沛王定", "沛王刘定"],
    deathYear: 95,
  }),
  empressYin: canonical("eh-empress-yin-hedi", "和帝阴皇后", "汉和帝皇后，永元八年立后，永元十四年因巫蛊案被废。", {
    aliases: ["阴氏", "阴皇后", "阴后", "皇后阴氏"],
    deathYear: 102,
  }),
  liuXian: canonical("eh-liu-xian-chen", "刘羡", "东汉陈王，永元八年去世。", {
    aliases: ["刘羨", "陈王羡", "陈王羨"],
    deathYear: 96,
  }),
  liuDang: canonical("official-history-person-68a239eecf1ac016", "刘党", "东汉乐成王，永元八年去世。", {
    aliases: ["乐成王党"],
    deathYear: 96,
  }),
  pangFen: canonical("eh-pang-fen-liaodong", "庞奋", "东汉边将，永元八年参与平定南匈奴右温禺犊王叛乱，后曾任河南尹。", {
    aliases: ["行度辽将军庞奋", "度辽将军庞奋"],
  }),
  fengZhu: canonical("eh-feng-zhu", "冯柱", "东汉越骑校尉，永元八年参与平定南匈奴右温禺犊王叛乱。", {
    aliases: ["越骑校尉冯柱"],
  }),
  liuXun: canonical("official-history-person-38a9b2e2a78cd98d", "刘巡", "乐成王刘党之子，永元九年承封乐成王。", {
    aliases: ["乐成王巡"],
  }),
  liuKangJinan: canonical("eh-liu-kang-jinan-anwang", "刘康", "东汉济南安王，永元九年去世；与熹平年间受封济南王的同名宗室不是同一人。", {
    aliases: ["济南安王康", "济南王康"],
    deathYear: 97,
  }),
  liuChangLiang: canonical("eh-liu-chang-liang", "刘畅", "东汉梁节王，永元十年去世；与熹平年间的中山王刘畅不是同一人。", {
    aliases: ["梁王畅", "梁节王畅"],
    deathYear: 98,
  }),
  tangZeng: canonical("eh-tang-zeng", "唐缯", "旄牛徼外白狼、楼薄诸部首领之一，永元十二年率众内属。", {
    primaryPolity: "白狼、楼薄诸部",
  }),
  liuShangRencheng: canonical("eh-liu-shang-rencheng", "刘尚", "东汉任城王，永元十三年去世。", {
    aliases: ["任城王尚"],
    deathYear: 101,
  }),
  dengSui: canonical("eh-deng-sui", "邓绥", "汉和帝皇后，永元十四年立后，和帝去世后以皇太后身份临朝。", {
    aliases: ["邓氏", "邓贵人", "邓皇后", "和熹邓皇后", "和熹皇后"],
    birthYear: 81,
    deathYear: 121,
  }),
  liuZheng: canonical("eh-liu-zheng-donghai", "刘政", "东汉东海王，永元十四年去世。", {
    aliases: ["东海王政"],
    deathYear: 102,
  }),
  liuYu: canonical("eh-liu-yu-langya", "刘宇", "东汉琅邪王，永元十五年去世。", {
    aliases: ["琅邪王宇"],
    deathYear: 103,
  }),
  liuCuo: canonical("official-history-person-81a7d9990264be2e", "刘错", "东汉济南王，永元十五年去世。", {
    aliases: ["济南王错"],
    deathYear: 103,
  }),
  liuShangZhao: canonical("eh-liu-shang-zhao", "刘商", "东汉赵王，永元十六年去世。", {
    aliases: ["赵王商"],
    deathYear: 104,
  }),
  gengKui: canonical("official-history-person-8ccf31fbb7cfb5f6", "耿夔", "东汉将领，永元三年任左校尉，深入金微山大破北匈奴；元兴元年任辽东太守并击破寇边貊人。", {
    aliases: ["左校尉耿夔", "中郎将耿夔", "辽东太守耿夔"],
  }),
  liuLong: canonical("eh-liu-long-shangdi", "刘隆", "汉和帝少子，元兴元年十二月即位，是为汉殇帝。", {
    aliases: ["汉殇帝", "殇帝", "孝殇皇帝"],
    birthYear: 105,
    deathYear: 106,
  }),
};

export const easternHan89105CanonicalPeople = Object.values(people);

const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id,
  canonicalName: people[key].name,
  sourceNames,
});
const decisionOptions = (options) => ({
  ...(options.summary ? { summary: options.summary } : {}),
  ...(options.personBindings?.length ? { personBindings: options.personBindings } : {}),
  ...(options.removePersonNames?.length ? { removePersonNames: options.removePersonNames } : {}),
  ...(options.placeBindings?.length ? { placeBindings: options.placeBindings } : {}),
  ...(options.chronology ? { chronology: options.chronology } : {}),
  ...(Object.hasOwn(options, "matchedEventId") ? { matchedEventId: options.matchedEventId } : {}),
  ...(options.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
});
const context = (suffix, options = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  ...(options.title ? { title: options.title } : {}),
  reason: options.reason ?? "宗室卒年、例行赦令或重复叙述保留为人物与纪年上下文，不单独晋级为主事件。",
  ...decisionOptions(options),
});
const promote = (suffix, title, options = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: options.reason ?? "主体、行动、结果与精确纪年可由《后汉书》原文直接核定，具有独立事件边界。",
  ...decisionOptions(options),
});
const collective = (suffix, title, options = {}) => promote(suffix, title, {
  ...options,
  allowCollectiveEvent: true,
  reason: options.reason ?? "集体主体、行动、结果与精确纪年明确，可作为独立事件晋级。",
});
const reject = (suffix, reason, options = {}) => ({
  cardId: card(suffix),
  disposition: "reject",
  reason,
  ...decisionOptions(options),
});
const chronology = (year, expression, sourceContext, endYear = year) => ({
  year,
  ...(endYear !== year ? { endYear } : {}),
  expression,
  method: "editorial-chronology",
  confidence: "high",
  sourceContext,
});

const yanranEventId = "eh-089-dou-xian-defeats-northern-xiongnu";
const anguoChronology = chronology(
  94,
  "永元六年",
  "《和帝纪》将安国被杀系于永元五年（93），《南匈奴列传》及《资治通鉴·汉纪》系于永元六年（94）；从列传，纪年误列去年。",
);
const fenghouChronology = chronology(
  94,
  "永元六年至七年正月",
  "逢侯于永元六年（94）率众出塞并遭汉军追击，《南匈奴列传》记汉军于永元七年（95）正月返回，故记为 94-95 年。",
  95,
);
const jinweiSummary = "永元三年（91），左校尉耿夔追击北匈奴至金微山，大破北单于并俘获其母阏氏。";
const yuchujianSummary = "永元五年（93），北匈奴单于於除鞬叛，汉遣中郎将任尚讨灭之。";
const anguoSummary = "永元六年（94），南单于安国因杜崇阻断奏章而惊叛，后被骨都侯喜杀死。";
const fenghouSummary = "永元六年（94），逢侯率叛胡出塞；同年十一月，任尚率乌桓、鲜卑追击并大破逢侯。";
const hediSuccessionSummary = "元兴元年（105）十二月辛未，汉和帝崩于章德前殿；皇子刘隆被立为皇太子，当夜即皇帝位，时出生百余日。";

export const easternHan89105CandidateRepairs = [
  promote("1a3d740465c2c35d6b13400a", "窦宪大破北匈奴并燕然勒石", {
    matchedEventId: yanranEventId,
    personBindings: [binding("douXian"), binding("gengBing", ["耿秉", "秉"])],
  }),
  promote("2ad6349d27073f7236a98cfd", "窦宪大破北匈奴并燕然勒石", {
    matchedEventId: yanranEventId,
    personBindings: [binding("douXian")],
    reason: "本纪补记窦宪登燕然山刻石勒功，与既有永元元年北征事件合并。",
  }),
  context("27148371e03187eb8bdad426", {
    title: "韦彪去世",
    personBindings: [binding("weiBiao")],
  }),
  context("4a0661d55395044b9e5dc2ad", {
    title: "刘延去世",
    personBindings: [binding("liuYanFuling", ["刘延", "阜陵王延"])],
  }),
  promote("a169da7960105b30cfb95971", "窦宪大破北匈奴并燕然勒石", {
    matchedEventId: yanranEventId,
    personBindings: [binding("douXian", ["窦宪", "宪"]), binding("gengBing", ["耿秉", "秉"]), binding("banGu")],
  }),
  promote("c5352a49a96b0bce5e9a3ada", "窦宪大破北匈奴并燕然勒石", {
    matchedEventId: yanranEventId,
    personBindings: [binding("douXian"), binding("liangFeng", ["梁讽", "讽"])],
    reason: "梁讽出使北单于、万余人归附是永元元年北征的同一行动链，合并到既有人工审核事件。",
  }),
  promote("e289db342640a30550f25355", "窦宪大破北匈奴并燕然勒石", {
    matchedEventId: yanranEventId,
    personBindings: [binding("douXian")],
  }),

  collective("09e33e7d0326e77755228e73", "南匈奴大破北匈奴于河云"),
  context("ad533c51dcfc65272d3e2783", {
    title: "班超击退月氏军",
    personBindings: [binding("banChao")],
    reason: "明确军事记载保留为本纪补充候选；本轮只晋级用户指定的漏项，待西域事件边界统一复核。",
  }),
  context("dfed57406c9092c8c445db15", {
    title: "车师前后王遣子入侍",
    reason: "与同年已晋级的车师遣子入侍事件重复，保留本纪交叉上下文。",
  }),
  promote("13209d15e1ac999c3bb08a85", "和帝封刘寿等四人为王", {
    matchedEventId: "official-history-event:e3e3d948b7fcc81d9367",
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuShou", ["刘寿", "寿"]), binding("liuKai", ["刘开", "开"]), binding("liuShu", ["刘淑", "淑"]), binding("liuCe", ["刘侧", "侧"])],
  }),
  promote("2e3ef532af05026bda5002b1", "和帝封刘威为北海王", {
    matchedEventId: "official-history-event:304af3145466700f22cb",
    personBindings: [binding("hedi", ["汉和帝", "和帝"]), binding("liuMu", ["刘睦", "睦"]), binding("liuWei", ["刘威", "威"])],
  }),
  collective("3cc8787fb1a2ac02856a3669", "车师前后王遣子入侍", {
    matchedEventId: "official-history-event:47aa01971254ceb0e24a",
    personBindings: [binding("douXian")],
    reason: "本条核心结果是车师前后王在北匈奴受挫后遣子入侍，按外交事件命名。",
  }),
  context("3cdd04594f0293be7a879c25"),
  promote("7fdec645667c69715d237c8e", "阎磐击北匈奴并夺取伊吾卢", {
    matchedEventId: "official-history-event:73741914746f0caaea2e",
    personBindings: [binding("yanPan")],
  }),
  promote("9d22cbb5eb8b4a554ee8a019", "复封刘无忌为齐王", {
    matchedEventId: "official-history-event:ac9faa60cae6685e11ed",
    personBindings: [binding("liuWuji", ["刘无忌", "无忌"])],
  }),
  collective("a76c5d4697183e3fbdac21fb", "北匈奴遣使称臣"),
  context("c1cb05dff97a2828ee7f325e", {
    title: "刘无忌与刘威承封齐王及北海王",
    personBindings: [binding("liuHuang", ["刘晃", "齐王晃"]), binding("liuWuji", ["刘无忌", "无忌"]), binding("liuMu", ["刘睦", "北海王睦"]), binding("liuWei", ["刘威", "威"])],
    reason: "同一句包含两项承封，分别已有本传候选晋级，本条保留为本纪交叉证据而不再新建第三张事件卡。",
  }),
  context("c6acca223dd4906ce1611127", {
    title: "刘焉去世",
    personBindings: [binding("liuYanZhongshan", ["刘焉", "中山王焉"])],
  }),

  context("dc96afd21e206d46694b32a9", {
    title: "刘种去世",
    personBindings: [binding("liuZhong", ["刘种", "阜陵王种"])],
  }),
  context("4ab72ff45aa55a18effd5f8c", {
    title: "系囚赎罪及亡命处置",
    reason: "这是刑罚与赎罪制度性处置，不作为独立主事件晋级。",
  }),
  promote("bc71d08e5c3ee8b1e08c944c", "耿夔大破北匈奴于金微山", {
    summary: jinweiSummary,
    personBindings: [binding("gengKui", ["耿夔", "左校尉耿夔"])],
    reason: "本纪上句明确窦宪遣左校尉耿夔出居延塞，本句记其围北单于于金微山并大破之；人物、地点、结果与永元三年纪年完整。",
  }),

  promote("4698a4ae42bf3487aee1bb37", "郡兵平定潭戎等溇澧蛮叛乱", {
    matchedEventId: "official-history-event:46d392a19ce16a6b8471",
    personBindings: [binding("tanRong")],
  }),
  context("641a9e8bfe797d204c47a374", {
    title: "烧当羌进犯金城",
    reason: "明确边疆事件保留为候选；本轮不扩展指定漏项之外的事件边界。",
  }),
  context("dc38c9f7e6b4d6db35537e67", {
    title: "武陵零陵澧中蛮叛乱",
    reason: "与潭戎等溇中、澧中蛮叛乱高度重合，保留本纪上下文待后续统一跨年合并。",
  }),
  context("e13b6e0ce624adc374841fd6", {
    title: "窦宪党羽下狱死",
    reason: "本句人物多为省称且依赖上文窦宪案，保留为清洗后的案件上下文，不单独晋级。",
  }),
  promote("cfa61af867cd94fb51d63912", "于除鞬自立单于并向汉请降", {
    matchedEventId: "official-history-event:51fe0495135fe103ceb5",
    personBindings: [binding("yuchujian", ["于除鞬", "於除鞬"])],
  }),

  promote("ef2cbe88d97e40630c992c8b", "任尚讨灭于除鞬", {
    summary: yuchujianSummary,
    personBindings: [binding("renShang"), binding("yuchujian", ["于除鞬", "於除鞬"])],
    reason: "《和帝纪》明确记于除鞬叛、任尚讨灭之，纪年为永元五年（93）；与永元四年请降事件分立。",
  }),
  promote("17e1decee1661a1912ac777c", "骨都侯喜杀南单于安国", {
    summary: anguoSummary,
    chronology: anguoChronology,
    personBindings: [
      binding("anguoShanyu", ["南单于安国", "单于安国", "安国"]),
      binding("guduHouXi"),
    ],
    removePersonNames: ["安国"],
    reason: "本纪原列永元五年，但《南匈奴列传》与《资治通鉴》校正为永元六年；从列传定为 94 年，并与于阗王安国消歧。",
  }),
  context("33ba9367e39aed21f4be1827"),
  context("7caf87b90ce63f535cf3cec2", {
    title: "武陵郡兵击破叛蛮",
    reason: "这是上一年武陵蛮叛乱的后续结果，待统一调整事件范围时再合并。",
  }),

  promote("b146f536074399aba86052a5", "和帝封刘鲂为阜陵王", {
    matchedEventId: "official-history-event:ff565c3f29515a462319",
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuZhong", ["刘种", "种"]), binding("liuFang", ["刘鲂", "鲂"])],
  }),
  context("b8f3d3778cf60fe60f4b814e", {
    title: "刘伉去世",
    personBindings: [binding("liuKangQiancheng", ["刘伉", "千乘王伉"])],
  }),
  promote("cd822411ce584a3c7528c376", "和帝封刘万岁为广宗王", {
    matchedEventId: "official-history-event:16ddc4fbe759461e7b51",
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuWansui", ["刘万岁", "万岁"])],
  }),
  promote("dfe6cc2ea8f361f27df575a1", "刘万岁去世后广宗国废除", {
    personBindings: [binding("liuWansui", ["刘万岁", "广宗王万岁", "万岁"])],
  }),

  promote("074807d19e6aecdce83d7296", "敦忍乙王莫延遣使贡献", {
    matchedEventId: "official-history-event:31a95d642bb73a57070c",
    personBindings: [binding("moYan")],
  }),
  context("54bab49af8d7449cf1d5a901", {
    title: "洛阳令下狱及司隶河南官员左降",
    reason: "司法与官员处分并列，主体省略且不是本轮指定主事件。",
  }),
  promote("690aaa11adba51af9dee9b23", "逢侯叛乱及任尚追击叛军", {
    summary: fenghouSummary,
    chronology: fenghouChronology,
    personBindings: [
      binding("fenghouXiongnu"),
      binding("renShang"),
      binding("anguoShanyu", ["南单于安国", "安国"]),
    ],
    removePersonNames: ["安国"],
    reason: "本纪明确逢侯于永元六年率叛胡出塞，列传记至永元七年正月军还，按 94-95 年跨年事件处理。",
  }),
  promote("a093e8d87d5e05a8983d645a", "逢侯叛乱及任尚追击叛军", {
    summary: fenghouSummary,
    chronology: fenghouChronology,
    personBindings: [binding("fenghouXiongnu"), binding("renShang")],
    reason: "清除行间《十三州志》注文后，本纪明确任尚率乌桓、鲜卑大破逢侯；与逢侯出塞叛乱合并为 94-95 年事件。",
  }),
  context("9ed72b5a367d7ca471cc7eec", {
    title: "班超破焉耆后西域诸国降服",
    reason: "这是班超攻破焉耆事件的影响性结果，保留为既有事件上下文。",
  }),
  context("bd06b03ac8970585b886f851", {
    title: "武陵溇中蛮叛乱被平定",
    reason: "与同一区域前后叛乱可能重合，保留本纪候选待统一边界审核。",
  }),
  promote("d51917065066cb0cc42ef661", "班超攻破焉耆尉黎诸国", {
    matchedEventId: "official-history-event:a8843bd22b1239b3ed65",
    personBindings: [binding("banChao")],
    reason: "本纪对班超破焉耆、尉犁的简记，与已晋级的同年西域事件合并。",
  }),
  collective("8cf5dddfdc33b5481f17c999", "蜀郡徼外羌遣使内附"),
  promote("c121b71532fa6c596297410c", "班超攻破焉耆尉黎诸国", {
    matchedEventId: "official-history-event:a8843bd22b1239b3ed65",
    personBindings: [binding("banChao")],
  }),
  context("e96bf11ab6f646d3f2bf1372", {
    title: "刘淑去世后城阳国废除",
    personBindings: [binding("liuShu", ["刘淑", "城阳王淑"])],
  }),

  promote("901c658f35e60886d9c1426c", "邓鸿等因南匈奴案下狱死", {
    matchedEventId: "official-history-event:b7c692b1862629050277",
    personBindings: [binding("dengHong"), binding("zhuHui"), binding("duChong")],
    reason: "本纪下文明确三人因错误处置南单于安国控告杜崇一案而被追责下狱。",
  }),
  context("46d3a8b25d72293650649eba", {
    title: "邓鸿等被征下狱",
    reason: "省略主体的后续处分句，与邓鸿、朱徽、杜崇下狱死事件重复。",
  }),
  promote("b4dede0dee50d4144321514c", "骨都侯喜杀南单于安国", {
    summary: anguoSummary,
    chronology: anguoChronology,
    personBindings: [
      binding("anguoShanyu", ["南单于安国", "安国"]),
      binding("guduHouXi"),
      binding("duChong", ["杜崇", "崇"]),
    ],
    removePersonNames: ["安国"],
    reason: "本句补充杜崇阻断安国奏章、安国惊叛并被杀的因果；按列传校正为永元六年，与本纪简记合并。",
  }),
  context("f905a163f7c1415084fbde28", {
    title: "沛王刘定去世",
    personBindings: [binding("liuDingPei", ["刘定", "沛王定"])],
    removePersonNames: ["刘定"],
  }),

  promote("2af116513dc2ec8ba04ad789", "和帝立阴氏为皇后", {
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("empressYin", ["和帝阴皇后", "阴氏", "皇后"])],
    reason: "皇后纪上文明确省略主语为和帝阴皇后，与本纪同年立后记载合并。",
  }),
  context("9b401fe053b25186197307ba", {
    title: "陈王刘羡去世",
    personBindings: [binding("liuXian", ["刘羡", "刘羨", "陈王羡", "陈王羨"])],
  }),
  context("a3a22edfca1ef66f8bf685ed", {
    title: "乐成王刘党去世",
    personBindings: [binding("liuDang", ["刘党", "乐成王党"])],
  }),
  promote("fbb6ded1cfe6325734bfbe84", "庞奋及冯柱平定右温禺犊王叛乱", {
    personBindings: [binding("pangFen"), binding("fengZhu")],
    reason: "本纪前句明确右温禺犊王叛乱，后句记庞奋、冯柱追讨并斩杀叛王，事件边界完整。",
  }),
  reject(
    "4e89d359fcd00c91d7ea09ed",
    "本句追叙汉高祖崩后吕太后处置戚夫人，因皇后纪连续纪年误继承为 96 年，不属于东汉和帝时期。",
  ),
  context("5185ceccda2aaae9a28def2d", {
    title: "南匈奴右温禺犊王叛乱",
    reason: "这是庞奋、冯柱追讨右温禺犊王事件的起因句，保留为既有事件上下文。",
  }),
  context("e66d100aa372c2cd7e12d0b7", {
    title: "车师后王叛乱并攻击前王",
    removePersonNames: ["刘叛"],
    reason: "明确边疆事件保留为候选；移除将动作尾部误识别成的伪人物“刘叛”。",
  }),

  collective("6ba6ff44efecf9435195ca80", "鲜卑攻掠肥如"),
  context("06a724a4e1fd411c1062897e", {
    title: "王林击杀车师后王",
    reason: "与上年车师后王叛乱属于同一行动链，待西域跨年事件统一审核。",
  }),
  context("3fd715f3428d6b6afbaf98bb", {
    title: "刘尚等击破寇陇西烧当羌",
    reason: "明确羌乱事件保留为候选；本轮不扩展指定漏项之外的事件边界。",
  }),
  context("830ab7683c1651c4105d78ea", {
    title: "辽东太守祭参下狱死",
    reason: "单独官员刑罚记录保留为人物上下文。",
  }),
  promote("9ea123e090d995a462bc639c", "和帝封刘巡为乐成王", {
    matchedEventId: "official-history-event:f847a70efe7dfcffe10a",
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuDang", ["刘党", "党"]), binding("liuXun", ["刘巡", "巡"])],
  }),
  context("c94644e9cf37f904132c2c33", {
    title: "济南安王刘康去世",
    personBindings: [binding("liuKangJinan", ["刘康", "济南王康"])],
    removePersonNames: ["刘康"],
    reason: "本条是永元九年济南安王刘康，不是熹平三年受封济南王的同名宗室。",
  }),

  context("7476613a28f277f1a3ecf825", {
    title: "梁王刘畅去世",
    personBindings: [binding("liuChangLiang", ["刘畅", "梁王畅"])],
    removePersonNames: ["刘畅"],
    reason: "本条是永元十年的梁节王刘畅，不是熹平三年去世的中山王刘畅。",
  }),

  context("1b5176c89733d407dce32e31", {
    title: "烧当羌再次叛乱",
    reason: "与次年周鲔击破烧当羌构成跨年行动链，待羌乱专题统一合并。",
  }),

  promote("6dfdc50ba2419cc2457539ee", "和帝遣使赈济受灾郡国", {
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"])],
  }),
  context("a8c4b1ec9c68c939b0345fca"),

  collective("498456e337275737e5b0c65c", "白狼及楼薄诸部十七万人内属", {
    personBindings: [binding("tangZeng")],
  }),
  collective("99d54aa8f1f4c4120e766e58", "蒙奇及兜勒两国遣使内附"),
  collective("c2344e578eb49cc1fc83e98f", "郡县平定日南象林蛮夷叛乱"),

  context("da9502de0b22edcf317fe33b", {
    title: "任城王刘尚去世",
    personBindings: [binding("liuShangRencheng", ["刘尚", "任城王尚"])],
    removePersonNames: ["刘尚"],
  }),
  context("596c459b050436b2d9ee694a", {
    title: "周鲔击破烧当羌",
    reason: "与上一年烧当羌复叛构成跨年行动链，待羌乱专题统一合并。",
  }),
  context("a350aa82be797bf7802f96b0", {
    title: "鲜卑进犯右北平及渔阳",
    reason: "明确边疆事件保留为候选；本轮不扩展指定漏项之外的事件边界。",
  }),

  promote("2947516ef3aee2acd633540d", "和帝废黜阴皇后", {
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("empressYin", ["和帝阴皇后", "阴后"])],
  }),
  promote("229b6429b283cf5098c87b82", "和帝废黜阴皇后", {
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("empressYin", ["和帝阴皇后", "阴氏", "皇后阴氏"])],
    reason: "本纪对永元十四年废阴皇后的直接记载，与皇后纪既有候选合并。",
  }),
  context("38b356da694309ea15151ce2", {
    title: "常山王刘侧去世",
    personBindings: [binding("liuCe", ["刘侧", "常山王侧"])],
  }),
  context("4c51ae64e7800d995af8c763"),
  context("d6749601f789d12cd8680ad1", {
    title: "东海王刘政去世",
    personBindings: [binding("liuZheng", ["刘政", "东海王政"])],
  }),
  promote("335064823887c381d803e7d2", "和帝立邓绥为皇后", {
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("dengSui", ["邓绥", "邓氏", "邓贵人"])],
    reason: "皇后纪上文主语为邓绥，本句“至冬，立为皇后”与同年立后记载合并。",
  }),
  collective("f5a1cfab1c1f27c4435cd7d5", "荆州军平定巫蛮叛乱"),

  context("41c2506b6cbfc391e366b7d0", {
    title: "琅邪王刘宇去世",
    personBindings: [binding("liuYu", ["刘宇", "琅邪王宇"])],
  }),
  context("d6a486acc6a2f8a4df5d0699", {
    title: "济南王刘错去世",
    personBindings: [binding("liuCuo", ["刘错", "济南王错"])],
  }),

  context("030283cae27f09af78d9cad0", {
    title: "赵王刘商去世",
    personBindings: [binding("liuShangZhao", ["刘商", "赵王商"])],
  }),
  context("84cd4e1ed97940439e3bb6bc", {
    title: "北匈奴遣使称臣贡献",
    reason: "明确外交记载保留为候选；与前后北匈奴遣使事件的边界待统一审核。",
  }),

  collective("1a7c2b97f19859a45a04f89f", "北匈奴再遣使至敦煌贡献"),
  context("0fd5372772f6c3791276a300", {
    title: "封皇兄刘胜为平原王",
    reason: "宗室封王记录保留为人物与纪年上下文，本轮不单独晋级。",
  }),
  context("1038007d9496945768e8adf7", {
    title: "北匈奴遣使至敦煌奉献",
    reason: "与同年北匈奴再遣使至敦煌贡献事件重复，保留本纪交叉上下文。",
  }),
  promote("156358fb70fa802fa4d655c5", "汉和帝崩与刘隆即位", {
    summary: hediSuccessionSummary,
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuLong", ["刘隆", "隆", "皇帝"])],
    reason: "《孝殇帝纪》明确刘隆于元兴元年十二月辛未夜即皇帝位，与同日和帝崩、立太子的本纪记载合并。",
  }),
  promote("39dc8d7475b87ab728b9e8fa", "汉和帝崩与刘隆即位", {
    summary: hediSuccessionSummary,
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuLong", ["刘隆", "隆", "皇子隆"])],
    reason: "和帝崩后本纪立即立皇子隆为皇太子，是刘隆同日即位事件的继承环节。",
  }),
  reject(
    "62a41588023d9c6e118bd701",
    "“谓诛窦宪等”是注文或解释语残片，不具备可独立核定的事件边界。",
    { removePersonNames: ["窦宪"] },
  ),
  context("751339d8cb2dfdb7341f5c83", {
    title: "赦免马窦家属禁锢",
    reason: "赦令与身份恢复记录保留为制度上下文，不并入和帝崩与刘隆即位事件。",
  }),
  context("80c05ad1d8e79146ec970c93", {
    title: "张显追击鲜卑战死",
    reason: "明确边疆事件保留为候选；本轮不扩展指定漏项之外的事件边界。",
  }),
  context("8397d17264342fa510a2d0d6", {
    title: "邓太后赦阴氏被徙者",
    personBindings: [binding("dengSui", ["邓绥", "太后"]), binding("empressYin", ["和帝阴皇后", "阴氏"])],
    reason: "皇后家族处置保留为人物关系与政策上下文。",
  }),
  promote("8835198930faf7352afe27b3", "汉和帝崩与刘隆即位", {
    summary: hediSuccessionSummary,
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuLong", ["刘隆", "隆"])],
    removePersonNames: ["刘夭没"],
    reason: "皇后纪明确和帝元兴元年崩，并交代诸皇子情况；移除由“诸皇子夭没”误识别的伪人物。",
  }),
  context("955675c425be2f25285abd07", {
    title: "高句骊进犯辽东郡界",
    reason: "与耿夔击破寇边貊人的对象是否同一仍需边疆材料核定，暂保留为上下文。",
  }),
  reject(
    "a9e4d846c3894beb3d1ba367",
    "本句是延平元年（106）汉殇帝刘隆之崩，因本纪跨段连续纪年误继承为 105 年，不属于本批时间窗。",
  ),
  promote("f271969973424d5353bc5fd7", "汉和帝崩与刘隆即位", {
    summary: hediSuccessionSummary,
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"]), binding("liuLong", ["刘隆", "隆"])],
    placeBindings: [{ id: "zhangde-front-hall", label: "章德前殿", role: "primary-location" }],
    reason: "本纪明确和帝于元兴元年十二月辛未崩于章德前殿，与随后立刘隆及刘隆即位合并为同一继承事件。",
  }),
  context("89871c042317602756306a6c", {
    title: "和帝改元元兴并大赦",
    personBindings: [binding("hedi", ["汉和帝", "和帝", "帝"])],
  }),
  promote("bd899749ef6a52b40de9dc9f", "耿夔击破寇边貊人", {
    matchedEventId: "official-history-event:d3c8fe8461e54dd2a706",
    personBindings: [binding("gengKui")],
  }),
  promote("fd4296c5806118ada731a846", "耿夔击破寇边貊人", {
    matchedEventId: "official-history-event:d3c8fe8461e54dd2a706",
    personBindings: [binding("gengKui", ["耿夔", "夔"])],
    reason: "本传补充貊人先寇郡界、耿夔追击并斩渠帅的经过，与本纪同一事件合并。",
  }),
  context("f9affbcee39425fca8a994df", { title: "皇帝加元服" }),
  context("4580c337f728eb20078e4318", { title: "汉武帝筑遮虏障于居延" }),
  collective("2d6dd8b448bf2214db64d6c2", "贯友讨烧当羌，羌遁去"),
  collective("ee7a633b238d35b1b1b28b01", "复置广阳郡"),
  collective("8f677ecdaaf3ee21104f2df7", "章德窦皇后崩"),
  context("659fd82ebeb17b027f0aa5ef", { title: "前汉更设员千人旧制" }),
  context("31ee2358cc2665bf3ba9d4a6", { title: "诏罢不合典礼祀官" }),
  collective("405eeff576db5f824bdc06b4", "汉和帝诏罢不在祀典祀官"),

];

export default {
  coverageMode: "partial",
  decisionRebinding: { strategy: "legacy-source-mention" },
  profileId: easternHan89105ProfileId,
  batchId: easternHan89105BatchId,
  periodId: easternHan89105PeriodId,
  generator: easternHan89105Generator,
  canonicalPeople: easternHan89105CanonicalPeople,
  decisions: easternHan89105CandidateRepairs,
  batchNotes: "东汉和帝时期 89-105 候选已逐条核定；宗室单纯卒年与例行赦令保留为上下文，明确战争、废立、封王、内附与救灾行动可晋级。",
};
