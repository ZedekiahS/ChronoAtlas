export const profileId = "china-western-han-xuandi--73--49-v1";
export const batchId = "auto-hanshu-western-han-xuandi--73--49-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-xuandi--73--49-v1";

const card = (suffix) => `card:hanshu-western-han-xuandi--73--49:${suffix}`;
const canonical = (id, name, summary, options = {}) => ({
  id,
  name,
  aliases: options.aliases ?? [],
  birthYear: options.birthYear,
  deathYear: options.deathYear,
  primaryPolity: options.primaryPolity ?? "西汉",
  summary,
});

const people = {
  liuXun: canonical("han-liu-xun", "刘询", "汉宣帝，汉武帝曾孙，前74年即位，在位期间整顿吏治并经营西域。", {
    aliases: ["劉詢", "宣帝", "孝宣皇帝", "帝"],
    birthYear: -91,
    deathYear: -49,
  }),
  huoGuang: canonical("han-huo-guang", "霍光", "汉武帝、昭帝、宣帝时期重臣，宣帝初年继续主持朝政。", {
    aliases: ["大司馬大將軍光", "大司马大将军光", "光"],
    deathYear: -68,
  }),
  empressHuo: canonical("wh-empress-huo-chengjun", "霍皇后", "霍光之女霍成君，前70年被立为皇后，前66年因霍氏谋反被废。", {
    aliases: ["霍成君", "皇后霍氏", "霍氏"],
  }),
  empressXu: canonical("wh-empress-xu-xuandi", "许皇后", "汉宣帝结发皇后，前71年去世。", {
    aliases: ["許皇后", "皇后許氏", "许平君"],
    deathYear: -71,
  }),
  empressWang: canonical("wh-empress-wang-xuandi", "宣帝王皇后", "汉宣帝继后，前64年被立为皇后，后在元帝即位后被尊为皇太后。", {
    aliases: ["皇后王氏", "王皇后", "孝宣王皇后"],
  }),
  liuShi: canonical("han-liu-shi", "刘奭", "汉宣帝长子，前67年被立为皇太子，后即位为汉元帝。", {
    aliases: ["劉奭", "皇太子", "太子"],
    birthYear: -75,
    deathYear: -33,
  }),
  liuJi: canonical("wh-liu-ji-guangchuan", "刘吉", "西汉广川王，前70年获罪被废迁上庸后自杀。", {
    aliases: ["劉吉", "廣川王吉", "广川王吉"],
    deathYear: -70,
  }),
  liuYanshou: canonical("wh-liu-yanshou-chu", "刘延寿", "西汉楚王，前69年谋反失败后自杀。", {
    aliases: ["劉延壽", "楚王延壽", "楚王延寿"],
    deathYear: -69,
  }),
  liuNian: canonical("wh-liu-nian-qinghe", "刘年", "西汉清河王，前66年获罪被废迁房陵。", {
    aliases: ["劉年", "清河王年"],
  }),
  huoYu: canonical("wh-huo-yu", "霍禹", "霍光之子，前66年以大司马身份谋反，事败伏诛。", {
    aliases: ["大司馬霍禹", "大司马霍禹"],
    deathYear: -66,
  }),
  huoZhengshi: canonical("wh-huo-zhengshi", "霍征史", "河东人，前63年参与谋反后被诛。", {
    aliases: ["霍徵史", "河東霍徵史", "河东霍征史"],
    deathYear: -63,
  }),
  zhaoChongguo: canonical("wh-zhao-chongguo", "赵充国", "汉宣帝朝名将，神爵元年与许延寿出击西羌。", {
    aliases: ["趙充國", "後將軍趙充國", "后将军赵充国"],
  }),
  xuYanshou: canonical("wh-xu-yanshou", "许延寿", "汉宣帝朝将领，神爵元年以强弩将军身份出击西羌。", {
    aliases: ["許延壽", "彊弩將軍許延壽", "强弩将军许延寿"],
    deathYear: -53,
  }),
  tianGuangming: canonical("wh-tian-guangming", "田广明", "汉昭帝、宣帝时期将领，本始二年任祁连将军出击匈奴。", {
    aliases: ["田廣明", "御史大夫田廣明", "祁連將軍"],
  }),
  fanMingyou: canonical("wh-fan-mingyou", "范明友", "汉昭帝、宣帝时期将领，本始二年参与五将军出击匈奴。", {
    aliases: ["度遼將軍范明友", "度辽将军范明友"],
  }),
  hanZeng: canonical("wh-han-zeng", "韩增", "西汉将领，本始二年任前将军参与出击匈奴。", {
    aliases: ["韓增", "前將軍韓增", "前将军韩增"],
  }),
  tianShun: canonical("wh-tian-shun", "田顺", "汉宣帝朝将领，本始二年由云中太守任虎牙将军出击匈奴。", {
    aliases: ["田順", "雲中太守田順", "虎牙將軍"],
  }),
  changHui: canonical("wh-chang-hui", "常惠", "西汉使者与将领，本始二年持节护乌孙兵出击匈奴。", {
    aliases: ["校尉常惠", "常惠持節"],
  }),
  xianxianchan: canonical("wh-xianxianchan", "先贤掸", "匈奴日逐王，神爵二年率万余人归降汉廷。", {
    aliases: ["先賢撣", "日逐王先賢撣", "日逐王先贤掸"],
  }),
  zhengJi: canonical("wh-zheng-ji", "郑吉", "西汉将领与西域都护，迎接日逐王并攻破车师。", {
    aliases: ["鄭吉", "都護西域騎都尉鄭吉", "都护西域骑都尉郑吉"],
  }),
  huluruo: canonical("wh-huluruo-wang-shengzhi", "呼留若王胜之", "匈奴王，神爵四年受单于派遣来朝汉廷。", {
    aliases: ["呼留若王勝之", "勝之"],
  }),
  huxulei: canonical("wh-huxulei-chanyu", "呼遬累单于", "匈奴单于，五凤二年率众归降汉廷并受封列侯。", {
    aliases: ["呼〈辶欶〉累單于", "呼遬累單于"],
  }),
  gengShouchang: canonical("wh-geng-shouchang", "耿寿昌", "汉宣帝朝财政官员，奏请设置常平仓以供北边并减少转漕。", {
    aliases: ["耿壽昌", "大司農中丞耿壽昌", "大司农中丞耿寿昌"],
  }),
  huhanye: canonical("wh-huhanye-chanyu", "呼韩邪单于", "匈奴单于，甘露三年亲自入朝汉廷，黄龙元年再次来朝。", {
    aliases: ["呼韓邪單于", "單于稽侯〈犭冊〉", "单于稽侯狦"],
  }),
  zhuluQutang: canonical("wh-zhulu-qutang", "铢娄渠堂", "呼韩邪单于之子，甘露元年以右贤王身份入侍汉廷。", {
    aliases: ["銖婁渠堂", "右賢王銖婁渠堂", "右贤王铢娄渠堂"],
  }),
  xiaoWangzhi: canonical("wh-xiao-wangzhi", "萧望之", "汉宣帝朝儒臣，甘露三年参与五经异同讨论并平奏其议。", {
    aliases: ["蕭望之", "太子太傅蕭望之", "太子太傅萧望之"],
  }),
  liuHaiyang: canonical("wh-liu-haiyang-guangchuan", "刘海阳", "西汉广川王，甘露四年获罪被废迁房陵。", {
    aliases: ["劉海陽", "廣川王海陽", "广川王海阳"],
  }),
};

const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id,
  canonicalName: people[key].name,
  sourceNames,
});
const options = (value = {}) => ({
  ...(value.summary ? { summary: value.summary } : {}),
  ...(value.personBindings?.length ? { personBindings: value.personBindings } : {}),
  ...(value.removePersonNames?.length ? { removePersonNames: value.removePersonNames } : {}),
  ...(value.placeBindings?.length ? { placeBindings: value.placeBindings } : {}),
  ...(Object.hasOwn(value, "matchedEventId") ? { matchedEventId: value.matchedEventId } : {}),
  ...(value.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
  ...(value.preserveAllBoundPeople ? { preserveAllBoundPeople: true } : {}),
});
const promote = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: value.reason ?? "《汉书·宣帝纪》所载主体、行动与精确纪年明确，具有独立事件边界。",
  ...options(value),
});
const collective = (suffix, title, value = {}) => promote(suffix, title, { ...value, allowCollectiveEvent: true });
const context = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  title,
  reason: value.reason ?? "保留为同一事件前后文、祥瑞赐予或官员卒年上下文，不单独晋级为本轮正式事件。",
  ...options(value),
});

export const decisions = [
  context("4a40ac460f5a1b9f2712f284", "匈奴侵边并进攻乌孙"),
  context("13b3360816c93c7b5ca922f6", "乌孙请求汉廷共同出击匈奴"),
  context("cde0437231d7a1fed2c67deb", "汉廷征调关东军士出征匈奴"),
  promote("d32d2e6b9da815ae4a447a2c", "田广明等五将军出击匈奴", {
    summary: "田广明、赵充国、田顺、范明友、韩增率十五万骑出击匈奴，常惠持节统护乌孙军协同行动。",
    preserveAllBoundPeople: true,
    personBindings: [
      binding("tianGuangming", ["田廣明"]),
      binding("zhaoChongguo", ["趙充國"]),
      binding("tianShun", ["田順"]),
      binding("fanMingyou", ["范明友"]),
      binding("hanZeng", ["韓增"]),
      binding("changHui", ["常惠"]),
    ],
    placeBindings: [{ id: "wusun", label: "乌孙", role: "primary-location" }],
  }),
  promote("cd371e692e870a7f97fd81f9", "许皇后去世", { summary: "皇后许氏去世。", personBindings: [binding("empressXu", ["皇后許氏", "許氏"])] }),
  context("10abf101823cf5889c4995eb", "丞相蔡义去世"),
  collective("2e321a2a5bca322824bf1d0d", "汉廷大赦天下"),
  promote("42c14b27c48f2e321d1e4899", "霍皇后册立", { personBindings: [binding("empressHuo", ["皇后霍氏", "霍氏"])] }),
  collective("4869959a46e6ae1713702645", "西汉郡国大地震山崩", { summary: "郡国四十九地震，多地山崩水出。" }),
  promote("43489f10952caa168b4b112f", "广川王刘吉被废迁上庸", { personBindings: [binding("liuJi", ["廣川王吉"])] }),
  promote("83e60adda4c58a80a503a3aa", "楚王刘延寿谋反汉廷", { personBindings: [binding("liuYanshou", ["楚王延壽"])] }),
  collective("6f334ea9fe63e9122982e912", "汉廷大赦天下"),
  promote("d8b1ae9eb7f2750f7d2dd8cf", "霍光去世", {
    matchedEventId: "china-68-huo-guang-dies",
    personBindings: [binding("huoGuang", ["大司馬大將軍光", "光"])],
  }),
  promote("6da163b93b520c6a875e78a3", "刘奭被立为皇太子", { personBindings: [binding("liuShi", ["皇太子", "太子"])] }),
  promote("1c941f5198d84c546a2a0c01", "清河王刘年被废迁房陵", { personBindings: [binding("liuNian", ["清河王年"])] }),
  promote("e55839b530149a1065602a23", "霍禹谋反汉廷", { personBindings: [binding("huoYu", ["大司馬霍禹", "霍禹"])] }),
  promote("c889cd5422442731d874e9bc", "霍皇后被废", { personBindings: [binding("empressHuo", ["皇后霍氏", "霍氏"])] }),
  context("eb4feb6b49d0d8d3fa6b743f", "凤凰甘露祥瑞与普遍赐予"),
  promote("11bcd4ec00631eae2c6aedf5", "霍征史等谋反汉廷", { personBindings: [binding("huoZhengshi", ["河東霍徵史", "霍徵史"])], placeBindings: [{ id: "hedong", label: "河东", role: "primary-location" }] }),
  context("c6b39e3ea281299d4f9142e1", "西羌叛乱与汉廷调集诸郡兵力"),
  promote("564162881f866b81210ae342", "赵充国与许延寿出击西羌", {
    preserveAllBoundPeople: true,
    personBindings: [binding("zhaoChongguo", ["趙充國"]), binding("xuYanshou", ["許延壽"])],
  }),
  promote("8e4e56e31aa77a345cb33c61", "日逐王先贤掸率众归降汉廷", { personBindings: [binding("xianxianchan", ["日逐王先賢撣", "先賢撣"])] }),
  promote("c9c889ae2facb599dfebe8f1", "郑吉任西域都护并破车师", {
    matchedEventId: "china-60-western-regions-protectorate",
    personBindings: [binding("zhengJi", ["鄭吉"])],
  }),
  promote("683fa7b74b31ccfc76f21a45", "宣帝王皇后册立", { personBindings: [binding("empressWang", ["皇后王氏", "王氏"])], removePersonNames: ["王政君", "孝平皇后王氏"] }),
  context("8cfb202017d3f4826547e2f7", "丞相魏相去世"),
  promote("2e3e2c8a32d2a7588b8afb76", "呼留若王胜之来朝汉廷", { personBindings: [binding("huluruo", ["呼留若王勝之", "勝之"])] }),
  promote("f7ab3da5e1aead6fe414ae53", "呼遬累单于率众归降汉廷并封侯", { personBindings: [binding("huxulei", ["呼〈辶欶〉累單于"])] }),
  context("5272a095303f0256576421ef", "丞相丙吉去世"),
  collective("ae3fb30196ef9771229a0c9a", "汉廷设立西河与北地属国"),
  promote("4ac7ca626c8561cd59aac173", "耿寿昌奏设常平仓", { personBindings: [binding("gengShouchang", ["耿壽昌"])] }),
  context("2a5d99ca6f6b865a557350cf", "匈奴左贤王来朝祝贺"),
  promote("a319d551e5c26c4f67618e3b", "呼韩邪单于遣子入侍汉廷", {
    preserveAllBoundPeople: true,
    personBindings: [binding("huhanye", ["呼韓邪單于"]), binding("zhuluQutang", ["銖婁渠堂"])],
  }),
  collective("3d9d62b114943d3cde399249", "汉军出击珠崖"),
  context("5a8c3814a74e09f14311c774", "丞相黄霸去世"),
  promote("c388d91bc848bf74fbc1eb5a", "呼韩邪单于来朝汉廷", {
    matchedEventId: "china-51-huhanye-changan",
    personBindings: [binding("huhanye", ["呼韓邪單于", "稽侯〈犭冊〉"])],
  }),
  collective("c66daf8bb21eacbd5c4ca2f7", "汉廷召开五经异同会议", {
    personBindings: [binding("xiaoWangzhi", ["蕭望之"])],
  }),
  promote("116a05a7ed8cb012ea14431f", "广川王刘海阳被废迁房陵", { personBindings: [binding("liuHaiyang", ["廣川王海陽"])] }),
  collective("2e9fa58f2ed511a9fc46f2fb", "未央宫宣室阁失火"),
  promote("3dac8a46d2656af5277943f7", "呼韩邪单于再次来朝汉廷", { personBindings: [binding("huhanye", ["呼韓邪單于"])] }),
  promote("82e0ec2e30890f5e5be66546", "汉宣帝刘询驾崩于未央宫", { personBindings: [binding("liuXun", ["帝"])] }),
];

export default {
  profileId,
  batchId,
  periodId,
  generator,
  coverageMode: "complete",
  canonicalPeople: Object.values(people),
  decisions,
  batchNotes: "Adjudicated Hanshu Xuandi annal candidates for 73-49 BCE; duplicate campaign clauses and routine deaths remain context while explicit succession, rebellion, war, institutional and diplomatic events are promoted.",
};
