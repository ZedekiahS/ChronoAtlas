export const easternHan169183ProfileId = "china-eastern-han-25-183-v1";
export const easternHan169183BatchId = "auto-houhanshu-eastern-han-169-183-candidates";
export const easternHan169183PeriodId = "china-eastern-han-25-184";
export const easternHan169183Generator = "official-history-candidate-repair:eastern-han-169-183-v1";

const card = (suffix) => `card:houhanshu-eastern-han-169-183:${suffix}`;
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
  lingdi: canonical("han-lingdi", "汉灵帝", "东汉第十二位皇帝刘宏，建宁元年至中平六年在位。", {
    birthYear: 156,
    deathYear: 189,
    aliases: ["刘宏", "灵帝"],
  }),
  bogu: canonical("eh-bogu-goguryeo", "伯固", "高句骊王，建宁二年受玄菟太守耿临讨伐后请降。", { primaryPolity: "高句骊" }),
  gengLin: canonical("eh-geng-lin", "耿临", "东汉玄菟太守，建宁二年讨伐高句骊并迫使伯固请降。"),
  duanJiong: canonical("eh-duan-jiong", "段颎", "东汉边将，建宁二年平定东羌，光和二年下狱死。", { deathYear: 179, aliases: ["破羌将军段颎", "太尉段颎"] }),
  chenYin: canonical("eh-chen-yin-danyang", "陈夤", "东汉丹阳太守，建宁二年击破围攻郡治的山越武装。", { aliases: ["丹阳太守陈夤"] }),
  houLan: canonical("eh-hou-lan", "侯览", "东汉宦官，建宁二年构陷虞放、杜密、李膺等党人。", { aliases: ["中常侍侯览"] }),
  yuFang: canonical("eh-yu-fang", "虞放", "东汉前司空，建宁二年第二次党锢之祸中被捕。", { deathYear: 169, aliases: ["前司空虞放"] }),
  duMi: canonical("eh-du-mi", "杜密", "东汉名士、太仆，建宁二年第二次党锢之祸中被捕。", { deathYear: 169, aliases: ["太仆杜密"] }),
  liYing: canonical("eh-li-ying", "李膺", "东汉名士，建宁二年第二次党锢之祸中被捕遇害。", { deathYear: 169, aliases: ["长乐少府李膺"] }),
  zhuYu: canonical("eh-zhu-yu-sili", "朱寓", "东汉司隶校尉，建宁二年第二次党锢之祸中被捕。", { deathYear: 169, aliases: ["司隶校尉朱寓"] }),
  baSu: canonical("eh-ba-su", "巴肃", "东汉颍川太守、党人，建宁二年被捕遇害。", { deathYear: 169, aliases: ["颍川太守巴肃"] }),
  xunYi: canonical("eh-xun-yi", "荀翌", "东汉沛相、党人，建宁二年被捕遇害。", { deathYear: 169, aliases: ["荀昱", "荀翌昱", "沛相荀翌"] }),
  weiLang: canonical("eh-wei-lang", "魏朗", "东汉河内太守、党人，建宁二年被捕遇害。", { deathYear: 169, aliases: ["河内太守魏朗"] }),
  zhaiChao: canonical("eh-zhai-chao", "翟超", "东汉山阳太守、党人，建宁二年被捕遇害。", { deathYear: 169, aliases: ["山阳太守翟超"] }),
  empressSong: canonical("eh-empress-song-lingdi", "灵帝宋皇后", "汉灵帝首任皇后，建宁四年立后，光和元年被废。", { deathYear: 178, aliases: ["宋氏", "宋皇后", "皇后宋氏"] }),
  dongChong: canonical("eh-dong-chong", "董宠", "东汉执金吾，建宁三年下狱死。", { deathYear: 170, aliases: ["执金吾董宠"] }),
  dongMeng: canonical("eh-dong-meng", "董萌", "东汉黄门令，因替窦太后申诉而被曹节、王甫构陷下狱。", { deathYear: 171, aliases: ["黄门令董萌"] }),
  xuZhao: canonical("eh-xu-zhao-kuaiji", "许昭", "会稽武装首领，熹平元年在句章起兵并立其父许生为越王。", { primaryPolity: "会稽武装", aliases: ["会稽许昭"] }),
  wangFu: canonical("official-history-person-5099c4b9311e14af", "王甫", "东汉中常侍，曾构陷勃海王刘悝，光和二年被阳球奏诛。", { deathYear: 179, aliases: ["中常侍王甫"] }),
  liuKui: canonical("eh-liu-kui-bohai", "刘悝", "汉桓帝之弟、勃海王，熹平元年被王甫构陷后举家自杀。", { deathYear: 172, aliases: ["勃海王悝", "勃海王刘悝"] }),
  consortSong: canonical("eh-consort-song-bohai", "勃海王妃宋氏", "勃海王刘悝之妃，熹平元年受王甫构陷后死于狱中。", { deathYear: 172, aliases: ["妃宋氏"] }),
  zhengSa: canonical("eh-zheng-sa", "郑飒", "东汉中常侍，王甫曾诬称其与勃海王刘悝交通。", { aliases: ["中常侍郑飒"] }),
  liuHui: canonical("eh-liu-hui-ganling", "刘恢", "东汉甘陵王，熹平元年去世。", { deathYear: 172, aliases: ["甘陵王恢"] }),
  yinDuan: canonical("eh-yin-duan", "尹端", "东汉会稽太守，熹平二年讨伐许昭失利。", { aliases: ["会稽太守尹端"] }),
  liuChang: canonical("eh-liu-chang-zhongshan", "刘畅", "东汉中山王，熹平三年无后去世，中山国被撤除。", { deathYear: 174, aliases: ["中山王畅"] }),
  liuLi: canonical("eh-liu-li-hejian", "刘利", "东汉河间王，刘康之父，光和二年去世。", { deathYear: 179, aliases: ["河闲王利", "河间王利"] }),
  liuKang: canonical("eh-liu-kang-jinan", "刘康", "河间王刘利之子，熹平三年受封济南王并奉孝仁皇祀。", { aliases: ["济南王康"] }),
  zangMin: canonical("eh-zang-min", "臧旻", "东汉扬州刺史，熹平三年在会稽平定许生、许昭武装，熹平六年参与征伐鲜卑。", { aliases: ["杨州刺史臧旻", "扬州刺史臧旻"] }),
  chenYin174: canonical("eh-chen-yin-danyang-174", "陈寅", "东汉丹阳太守，熹平三年随臧旻在会稽讨伐许生。", { aliases: ["丹阳太守陈寅"] }),
  xuSheng: canonical("eh-xu-sheng-kuaiji", "许生", "许昭之父，被立为越王，熹平三年在会稽兵败被杀。", { deathYear: 174, primaryPolity: "会稽武装", aliases: ["越王许生"] }),
  liuBo: canonical("eh-liu-bo-rencheng", "刘博", "东汉任城王，熹平三年去世。", { deathYear: 174, aliases: ["任城王博"] }),
  xiaYu: canonical("eh-xia-yu", "夏育", "东汉边将，熹平三年任北地太守并击破鲜卑，熹平六年参与三路征伐鲜卑。", { aliases: ["北地太守夏育", "护乌桓校尉夏育"] }),
  luZhi: canonical("eh-lu-zhi", "卢植", "东汉经学家与官员，熹平四年任九江太守并使当地蛮众归服。", { aliases: ["九江太守卢植"] }),
  anguo: canonical("eh-anguo-khotan", "安国", "东汉灵帝时于阗王，熹平四年攻破拘弥。", { primaryPolity: "于阗", aliases: ["于窴王安国", "于阗王安国"] }),
  dingxing: canonical("eh-dingxing-jumi", "定兴", "拘弥王侍子，熹平四年在汉军支持下被立为拘弥王。", { primaryPolity: "拘弥", aliases: ["拘弥侍子定兴"] }),
  liuJian: canonical("eh-liu-jian-hejian", "刘建", "汉桓帝之弟、河间王，刘佗之父。", { aliases: ["河闲王建", "河间王建"] }),
  liuTuo: canonical("eh-liu-tuo-rencheng", "刘佗", "河间王刘建之子，熹平四年受封任城王。", { aliases: ["任城王佗"] }),
  yongZhi: canonical("eh-yong-zhi-yizhou", "雍陟", "东汉益州郡太守，熹平五年在诸夷反叛中被俘。", { aliases: ["益州郡太守雍陟"] }),
  liYong: canonical("eh-li-yong-yizhou", "李颙", "东汉益州郡太守，熹平五年平定当地夷众叛乱。", { aliases: ["益州郡太守李颙"] }),
  caoLuan: canonical("eh-cao-luan", "曹鸾", "东汉永昌太守，熹平五年因替党人申诉被处死。", { deathYear: 176, aliases: ["永昌太守曹鸾"] }),
  liuDing: canonical("eh-liu-ding-ganling", "刘定", "东汉甘陵王，熹平五年去世。", { deathYear: 176, aliases: ["甘陵王定"] }),
  tianYan: canonical("eh-tian-yan", "田晏", "东汉破鲜卑中郎将，熹平六年三路征伐鲜卑时兵败。", { aliases: ["破鲜卑中郎将田晏"] }),
  wangMin: canonical("eh-wang-min-yongan", "王旻", "东汉永安太仆，熹平六年下狱死。", { deathYear: 177, aliases: ["永安太仆王旻"] }),
  songFeng: canonical("eh-song-feng", "宋酆", "灵帝宋皇后之父，任执金吾；宋皇后被废后下狱死。", { deathYear: 178, aliases: ["执金吾宋酆", "执金吾酆"] }),
  yangQiu: canonical("official-history-person-6c3faa85d66b5df1", "阳球", "东汉司隶校尉，光和二年奏诛王甫等宦官，后参与谋诛宦官失败。", { deathYear: 179, aliases: ["司隶校尉阳球", "卫尉阳球"] }),
  wangMeng: canonical("eh-wang-meng-changle", "王萌", "王甫之子、长乐少府，光和二年被阳球奏诛。", { deathYear: 179, aliases: ["长乐少府王萌"] }),
  wangJi: canonical("eh-wang-ji-pei", "王吉", "王甫之子、沛相，光和二年被阳球奏诛。", { deathYear: 179, aliases: ["沛相王吉"] }),
  xiaoYuan: canonical("eh-xiao-yuan", "萧瑗", "东汉御史中丞，光和二年督军讨伐巴郡板楯蛮而未克。", { aliases: ["御史中丞萧瑗"] }),
  liuDuan: canonical("eh-liu-duan-dongping", "刘端", "东汉东平王，光和二年去世。", { deathYear: 179, aliases: ["东平王端"] }),
  zhangXiu: canonical("eh-zhang-xiu-xiongnu", "张修", "东汉使匈奴中郎将，擅杀南单于呼微并另立羌渠，光和二年获罪处死。", { deathYear: 179, aliases: ["使匈奴中郎将张修"] }),
  huwei: canonical("eh-huwei-chanyu", "呼微", "南匈奴单于，光和二年被使匈奴中郎将张修擅杀。", { deathYear: 179, primaryPolity: "南匈奴", aliases: ["单于呼微"] }),
  qiangqu: canonical("eh-qiangqu-chanyu", "羌渠", "南匈奴贵族，光和二年被张修另立为单于。", { primaryPolity: "南匈奴", aliases: ["单于羌渠"] }),
  liuHe: canonical("official-history-person-5da22842f781ae28", "刘郃", "东汉司徒，光和二年参与谋诛宦官，事泄下狱死。", { deathYear: 179, aliases: ["司徒刘郃"] }),
  chenQiu: canonical("official-history-person-5946d3498907a7e3", "陈球", "东汉官员，光和二年任永乐少府并参与谋诛宦官。", { deathYear: 179, aliases: ["永乐少府陈球"] }),
  liuNa: canonical("official-history-person-4c9595348c56546d", "刘纳", "东汉步兵校尉，光和二年参与谋诛宦官，事泄下狱死。", { deathYear: 179, aliases: ["步兵校尉刘纳"] }),
  liuYuan: canonical("eh-liu-yuan-liang", "刘元", "东汉梁王，光和三年去世。", { deathYear: 180, aliases: ["梁王元"] }),
  empressHe: canonical("eh-empress-he-lingdi", "灵思何皇后", "汉灵帝皇后，光和三年立后，光和四年毒杀王美人。", { aliases: ["何氏", "何皇后", "皇后何氏"] }),
  wangMeiren: canonical("eh-wang-meiren", "王美人", "汉灵帝妃嫔、汉献帝生母，光和四年被何皇后毒杀。", { deathYear: 181 }),
  xiandi: canonical("han-xiandi", "汉献帝", "东汉末代皇帝刘协，王美人之子。", { aliases: ["刘协", "皇子协"] }),
  zhuJun: canonical("eh-zhu-jun", "朱儁", "东汉将领，光和四年任交址刺史并平定交址、合浦乌浒蛮叛乱。", { aliases: ["朱俊", "交址刺史朱儁", "交址刺史朱俊"] }),
  caoQian: canonical("eh-cao-qian-ba", "曹谦", "东汉巴郡太守，光和五年接受板楯蛮投降。", { aliases: ["巴郡太守曹谦"] }),
};

export const easternHan169183CanonicalPeople = Object.values(people);

const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id,
  canonicalName: people[key].name,
  sourceNames,
});
const decisionOptions = (options) => ({
  ...(options.title ? { title: options.title } : {}),
  ...(options.personBindings?.length ? { personBindings: options.personBindings } : {}),
  ...(options.removePersonNames?.length ? { removePersonNames: options.removePersonNames } : {}),
  ...(Object.hasOwn(options, "matchedEventId") ? { matchedEventId: options.matchedEventId } : {}),
  ...(options.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
});
const context = (suffix, options = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  reason: options.reason ?? "例行赦令、人物卒年、传记补充或重复结果，保留为史料上下文而不单独晋级。",
  ...decisionOptions(options),
});
const promote = (suffix, title, options = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: options.reason ?? "主体、行动与精确纪年可由《后汉书》原文直接核定，且具有独立事件边界。",
  ...decisionOptions(options),
});
const collective = (suffix, title, options = {}) => promote(suffix, title, {
  ...options,
  allowCollectiveEvent: true,
  reason: options.reason ?? "集体主体、行动、地点与精确纪年明确，可作为独立事件晋级。",
});

const partyPurgePeople = [
  binding("houLan"),
  binding("yuFang"),
  binding("duMi"),
  binding("liYing"),
  binding("zhuYu", ["朱?", "朱寓"]),
  binding("baSu"),
  binding("xunYi", ["荀翌昱", "荀翌", "荀昱"]),
  binding("weiLang"),
  binding("zhaiChao"),
];
const bohaiCasePeople = [
  binding("wangFu"),
  binding("liuKui", ["刘悝", "勃海王悝", "悝"]),
  binding("consortSong", ["勃海王妃宋氏", "妃宋氏", "宋氏"]),
  binding("zhengSa", ["郑飒交通", "郑飒"]),
];
const yangQiuPurgePeople = [
  binding("yangQiu"),
  binding("wangFu"),
  binding("wangMeng", ["王萌", "长乐少府萌", "萌"]),
  binding("wangJi", ["王吉", "沛相吉", "吉"]),
  binding("duanJiong"),
];

export const easternHan169183CandidateRepairs = [
  context("04fdcd5a12a6bc5e091c78e5"),
  promote("010fe03a85382474e5db6758", "耿临讨伐高句骊并迫使伯固降服", {
    personBindings: [binding("gengLin"), binding("bogu")],
  }),
  promote("b30d9a205e5f58747c540872", "段颎大破先零羌于射虎塞外谷", {
    personBindings: [binding("duanJiong")],
  }),
  collective("10923533a9c531511b307e48", "州郡平定江夏蛮叛乱"),
  collective("66d057a80ac73ccdae3c0cbb", "州郡平定江夏蛮叛乱"),
  promote("3a6480ead8c17d5454391325", "陈夤击破围攻丹阳的山越", {
    personBindings: [binding("chenYin")],
  }),
  promote("dee5e3ce7814c79f8027b186", "侯览构陷党人并扩大禁锢", {
    personBindings: partyPurgePeople,
    reason: "本纪与党锢列传可交叉确认第二次党锢之祸的发动者与受害者；网页缺字“朱?”据异本校为朱寓。",
  }),
  collective("df7714a98fa3779054b98307", "侯览构陷党人并扩大禁锢", {
    personBindings: partyPurgePeople,
    reason: "本条紧承党人下狱，记载州郡扩大钩党范围，与前条合并为同一政治事件。",
  }),
  collective("1cd302df4f7305b11d57454f", "鲜卑寇并州"),

  collective("3216924562e50e267eb7f80c", "烧当羌遣使贡献"),
  promote("b275ec64a06416dc11cf4299", "灵帝立宋氏为皇后", {
    personBindings: [binding("lingdi", ["灵帝", "帝"]), binding("empressSong", ["灵帝宋皇后", "宋氏"])],
    reason: "皇后纪上文明确主语为宋氏，建宁三年入掖庭，次年立后。",
  }),
  context("aacae972d3134ae2150af3d8", {
    title: "董宠下狱死",
    personBindings: [binding("dongChong")],
    reason: "单一官员下狱卒年，缺少可独立确认的政治事件边界，保留为人物生平上下文。",
  }),
  collective("4514e97d3bdd1684c04534b0", "济南贼起兵攻东平陵"),

  context("ce8805b58a0df4c52d3b351a", {
    title: "董萌被构陷下狱死",
    personBindings: [binding("dongMeng", ["董萌", "萌"])],
    reason: "皇后纪上文明确省称“萌”为黄门令董萌；本条保留为窦太后生平与宦官斗争的补充上下文。",
  }),
  context("159c8b4d06a60f7267957ede"),
  collective("c7eb4b40e2ef8865db244250", "鲜卑寇并州"),

  promote("9f6b105112c91679499498de", "王甫构陷刘悝谋反案", { personBindings: bohaiCasePeople }),
  promote("e2216b36ae51968d996da444", "许昭在句章起兵", {
    personBindings: [binding("xuZhao")],
  }),
  promote("b93b5bf2aef5ef73b9fcf1a1", "王甫构陷刘悝谋反案", {
    personBindings: bohaiCasePeople,
    reason: "皇后纪明确交代王甫构陷刘悝、王妃宋氏及所称与郑飒交通的经过。",
  }),
  context("acf6041ac2fee29eabb77229"),
  promote("b14a6e35a1cee66cb20074a3", "段颎捕系太学诸生千余人", {
    personBindings: [binding("duanJiong")],
  }),
  promote("18dd1deed1212fdf8c4b4ce7", "王甫构陷刘悝谋反案", { personBindings: bohaiCasePeople }),
  collective("282c150789e3b7f8d089afec", "鲜卑寇并州"),
  context("4abd00307ee199e6db6fc6ed", {
    title: "刘恢去世",
    personBindings: [binding("liuHui", ["刘恢", "甘陵王恢"])],
  }),

  promote("8eabd5d67bc71fef75cd1d9a", "尹端讨伐许昭兵败", {
    personBindings: [
      binding("yinDuan", ["尹端", "端"]),
      binding("xuZhao", ["许昭", "许昭失利"]),
    ],
  }),
  collective("b2e0158fb053fe21fcb85827", "日南徼外国遣使贡献"),
  context("1c02eb62e726cb27b5c1315e"),
  collective("865975eb57c04fe305fa48f9", "日南徼外国遣使贡献"),
  collective("ba7da1930bd48b3be7166a98", "鲜卑寇幽并二州"),

  collective("79d02ede420f08474a2f9320", "夫余国遣使贡献", {
    reason: "东夷列传上文明确省略主语为夫余国，与本纪同年贡使记载合并。",
  }),
  collective("d5b63ec82332434cb2a0d452", "夫余国遣使贡献"),
  context("53f1a7e3e4dac7e201d8f2c9"),
  promote("693e0acd0886b3b242a5762f", "刘畅无嗣后中山国废除", {
    personBindings: [binding("liuChang", ["刘畅", "中山王畅"])],
  }),
  promote("9af4d15a4acc20905964f2aa", "封刘康为济南王", {
    personBindings: [
      binding("liuLi", ["刘利", "河闲王利"]),
      binding("liuKang", ["刘康", "康"]),
    ],
    removePersonNames: ["郭嘉"],
  }),
  promote("75b3e23143eeb127c7571f40", "臧旻等平定许昭父子叛乱", {
    personBindings: [binding("zangMin"), binding("chenYin174"), binding("xuSheng"), binding("xuZhao")],
  }),
  context("1b45e7035ad21279f7f12c64", {
    title: "刘博去世",
    personBindings: [binding("liuBo", ["刘博", "任城王博"])],
  }),
  promote("47defe2926335326c72fd2c1", "夏育在北地击破鲜卑", {
    personBindings: [binding("xiaYu")],
  }),
  collective("6057f9b92824af7a6151ef71", "鲜卑寇并州"),

  promote("426c4550c288910b766ba989", "卢植平定九江蛮叛乱", {
    personBindings: [binding("luZhi", ["卢植", "植"])],
    reason: "列传篇题及上文明确省称“植”为卢植；任九江太守后使蛮众归服。",
  }),
  promote("df275f01f210c3209827166d", "安国攻破拘弥后汉军扶立定兴为王", {
    personBindings: [binding("anguo"), binding("dingxing")],
  }),
  collective("39d9170c702cff3cd711d105", "诏正五经文字并刻石于太学"),
  promote("a64cf82c35785c605a4d3aa9", "封刘佗为任城王", {
    personBindings: [binding("liuJian", ["刘建", "河闲王建"]), binding("liuTuo", ["刘佗", "佗"])],
  }),
  context("d91ce3a128a844bfc2a4d471"),
  collective("349042330a2167a8c34c638b", "鲜卑寇幽州"),

  collective("9bf368fb2c9bf24030fd2809", "益州郡诸夷叛乱并执雍陟", {
    personBindings: [binding("yongZhi", ["雍陟", "太守雍陟"])],
    reason: "西南夷列传上文持续以益州郡为叙事对象，故“诸夷”可稳定还原为益州郡诸夷。",
  }),
  context("03d8f67162253809c648cc59"),
  promote("d87ff45aa12992184b15592f", "李颙平定益州郡夷叛乱", {
    personBindings: [binding("liYong")],
  }),
  promote("61da61b7eea64135615cb69b", "汉灵帝处死申救党人的曹鸾", {
    personBindings: [binding("lingdi", ["汉灵帝", "灵帝", "帝"]), binding("caoLuan")],
  }),
  context("1cd5527b7806c3ccd69b3218", {
    title: "汉灵帝处死申救党人的曹鸾",
    personBindings: [binding("lingdi", ["汉灵帝", "灵帝", "帝"]), binding("caoLuan")],
    reason: "本条是曹鸾因讼党人被处死的经过补充，与前条合并理解而不另建事件。",
  }),
  collective("32b22912408c60a0bddaf17e", "党人亲属被免官禁锢"),
  context("f94b3c4cf1f46b0bcea450f9", {
    title: "刘定去世",
    personBindings: [binding("liuDing", ["刘定", "甘陵王定"])],
  }),
  collective("c1e76709c46f912428abc604", "鲜卑寇幽州"),

  context("f05f332eb7c3da9042ea779c"),
  collective("b88bdab12017c110479c9d97", "鲜卑寇三边"),
  promote("5cd7e02deb2f99b74ab59a6f", "田晏等三路征伐鲜卑大败", {
    personBindings: [binding("tianYan"), binding("zangMin"), binding("xiaYu")],
  }),
  collective("b4b2a2d4184af895730ada5b", "鲜卑寇辽西"),
  context("1238953853240f181f49e3ec", {
    title: "王旻下狱死",
    personBindings: [binding("wangMin")],
  }),

  context("c9c81212bc4fa87959053b2a", {
    reason: "虹霓记录属于灾异与注释性材料，不作为人物行动事件晋级。",
  }),
  collective("da6ddf2200aae7e5d05b4807", "交址与合浦乌浒蛮叛乱"),
  collective("021c6a1811f95cce2538613b", "交址与合浦乌浒蛮叛乱"),
  collective("9ac0097b89f04b0731e63436", "设立鸿都门学"),
  context("0a7119cfa04d4bda45ca9fff"),
  promote("630fdf9df4af60d3ef4066c4", "灵帝废黜宋皇后", {
    personBindings: [
      binding("lingdi", ["灵帝", "帝"]),
      binding("empressSong", ["灵帝宋皇后", "皇后宋氏", "宋氏"]),
      binding("songFeng", ["宋酆", "酆"]),
    ],
  }),
  collective("7d5fbc4fdf1c22fa793111ad", "鲜卑寇酒泉"),
  collective("e4ba5221e2bcd0d64ee14314", "西邸开始卖官"),

  promote("691c93ecd40d0aa1f8d36280", "阳球奏诛王甫等", {
    matchedEventId: "official-history-event:3f21392a15dd1751fbb0",
    personBindings: yangQiuPurgePeople,
  }),
  collective("c6bbd93338d3db3fe2d49e05", "巴郡板楯蛮叛乱", {
    personBindings: [binding("xiaoYuan")],
  }),
  promote("7fe10d1d53e912dd1374807f", "阳球奏诛王甫等", {
    matchedEventId: "official-history-event:3f21392a15dd1751fbb0",
    personBindings: yangQiuPurgePeople,
    reason: "本纪所记王甫、段颎同日下狱死，是阳球奏诛王甫集团的结果证据。",
  }),
  collective("eed5fa036cc3b870c5d58a85", "解除部分党人禁锢", {
    reason: "本条虽兼记大赦，但明确记载小功以下党人解除禁锢，具有独立政策意义。",
  }),
  context("691f8299386480aa74bd56d5", {
    title: "刘端去世",
    personBindings: [binding("liuDuan", ["刘端", "东平王端"])],
  }),
  promote("526043c3cb0082076ee373ed", "张修擅杀呼微并立羌渠为单于", {
    personBindings: [
      binding("zhangXiu", ["张修", "时张修擅"]),
      binding("huwei", ["呼微", "单于呼微"]),
      binding("qiangqu"),
    ],
  }),
  promote("5ff40b0e866623838aa29387", "刘郃等谋诛宦官失败", {
    matchedEventId: "official-history-event:04d8ad1528c141f9b268",
    personBindings: [binding("liuHe"), binding("chenQiu"), binding("yangQiu"), binding("liuNa")],
  }),
  collective("1710087358e5d381df2079ac", "巴郡板楯蛮叛乱", {
    personBindings: [binding("xiaoYuan")],
  }),
  collective("f3239f5d80b619db9d16609c", "鲜卑寇幽并二州"),
  context("95dd7eef7506a618d210fd53", {
    title: "刘利去世",
    personBindings: [binding("liuLi", ["刘利", "河闲王利"])],
  }),

  promote("96dfdef4c41d8d83fa38edb8", "灵帝立何氏为皇后", {
    personBindings: [binding("lingdi", ["灵帝", "帝"]), binding("empressHe", ["灵思何皇后", "何氏"])],
    reason: "皇后纪上文明确主语为生皇子辩的何贵人，光和三年被立为皇后。",
  }),
  context("a8f881c9f07db004efe511dc"),
  context("d691e9f2de4074f9525ea625", {
    title: "刘元去世",
    personBindings: [binding("liuYuan", ["刘元", "梁王元"])],
  }),
  collective("526df25fc94529f950cd31a2", "江夏蛮叛乱"),
  collective("3f551948a510efce8e4762b3", "鲜卑寇幽并二州"),

  promote("eadd3c5f0ba6ed095c8eb8a5", "何皇后毒杀王美人", {
    personBindings: [
      binding("empressHe", ["灵思何皇后", "何皇后", "后"]),
      binding("wangMeiren", ["王美人", "美人"]),
      binding("xiandi", ["汉献帝", "刘协", "皇子协"]),
    ],
    reason: "皇后纪上文明确“后”为何皇后、“美人”为王美人，皇子协即后来的汉献帝。",
  }),
  context("e7af423ec8df275b0c00321d"),
  promote("eb635431cc44f1e13f9e0ecd", "朱儁平定交址合浦乌浒蛮叛乱", {
    personBindings: [binding("zhuJun", ["朱儁", "朱俊"])],
  }),
  collective("ab2ec43203fb05829aa747dd", "鲜卑寇幽并二州"),

  context("d13678bf9273683fcf98e369", {
    title: "诏令公卿检举贪害地方官",
    reason: "该条是监察政策记载，未提供具体被举者、处置或结果，保留为制度上下文。",
  }),
  context("fc3e0cd450b8d5809d2725da"),
  collective("e74484f10217358fff175e0e", "巴郡板楯蛮向曹谦投降", {
    personBindings: [binding("caoQian")],
  }),

  collective("404c98d9ca05506555e74968", "日南徼外国遣使贡献"),
  context("9cb5bd0abe9d8147055745c8"),
  promote("1612220981c1f6b3f7a9d939", "许昭立父许生为越王并寇会稽", {
    personBindings: [binding("xuZhao"), binding("xuSheng")],
  }),
  context("e6f1f9a650789010e08ae0e6", { title: "中常侍等收葬宋皇后及宋酆父子" }),

];

export const officialHistoryCandidateRepairConfig = {
  coverageMode: "partial",
  decisionRebinding: { strategy: "legacy-source-mention" },
  profileId: easternHan169183ProfileId,
  batchId: easternHan169183BatchId,
  periodId: easternHan169183PeriodId,
  generator: easternHan169183Generator,
  canonicalPeople: easternHan169183CanonicalPeople,
  decisions: easternHan169183CandidateRepairs,
  batchNotes: "Adjudicated all Eastern Han 169-183 candidates with stable secondary people, explicit historical places, duplicate evidence merges, and event-level promotion decisions.",
};

export default officialHistoryCandidateRepairConfig;
