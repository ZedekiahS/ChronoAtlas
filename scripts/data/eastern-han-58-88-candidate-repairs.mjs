export const easternHan5888ProfileId = "china-eastern-han-25-183-v1";
export const easternHan5888BatchId = "auto-houhanshu-eastern-han-58-88-candidates";
export const easternHan5888PeriodId = "china-eastern-han-25-184";
export const easternHan5888Generator = "official-history-candidate-repair:eastern-han-58-88-v1";

const card = (suffix) => `card:houhanshu-eastern-han-58-88:${suffix}`;
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
  mingdi: canonical("eh-liu-zhuang", "刘庄", "东汉明帝，永平十八年崩，皇太子刘炟继位。", {
    aliases: ["汉明帝", "明帝", "显宗"], birthYear: 28, deathYear: 75,
  }),
  zhangdi: canonical("eh-liu-da", "刘炟", "东汉章帝，永平十八年即位，章和二年崩。", {
    aliases: ["汉章帝", "章帝", "肃宗"], birthYear: 57, deathYear: 88,
  }),
  hedi: canonical("han-hedi", "汉和帝", "东汉和帝刘肇，章和二年即位。", {
    aliases: ["刘肇", "和帝"], birthYear: 79, deathYear: 105,
  }),
  empressMa: canonical("eh-empress-ma-mingde", "明德马皇后", "汉明帝皇后，永平三年被立为皇后。", {
    aliases: ["马氏", "马皇后", "贵人马氏"], birthYear: 40, deathYear: 79,
  }),
  empressDou: canonical("eh-empress-dou-zhangde", "章德窦皇后", "汉章帝皇后，建初三年被立为皇后。", {
    aliases: ["窦氏", "窦皇后", "贵人窦氏"], deathYear: 97,
  }),
  yinLihua: canonical("eh-yin-lihua", "阴丽华", "光武帝皇后，明帝时为皇太后，永平七年崩。", {
    aliases: ["光烈皇后", "皇太后阴氏"], birthYear: 5, deathYear: 64,
  }),
  liuQing: canonical("eh-liu-qing-qinghe", "刘庆", "汉章帝子，建初四年被立为皇太子，建初七年被废为清河王。", {
    aliases: ["皇太子庆", "清河王庆"], birthYear: 78, deathYear: 106,
  }),
  liuYing: canonical("eh-liu-ying-chu", "刘英", "光武帝子、楚王，永平十三年因谋反被废并迁徙。", {
    aliases: ["楚王英"], deathYear: 71,
  }),
  pianHe: canonical("eh-pian-he", "偏何", "东汉永平初年受祭肜联络、出击鲜卑部众的首领。", {
    primaryPolity: "鲜卑",
  }),
  xinZhiben: canonical("eh-xin-zhi-ben", "歆志贲", "永平元年被偏何攻杀的鲜卑首领。", {
    primaryPolity: "鲜卑",
  }),
  huyuqiu: canonical("eh-huyu-qiu", "护于丘", "永平二年率千余人向汉朝归降的北匈奴首领。", {
    primaryPolity: "北匈奴",
  }),
  liuMao: canonical("eh-liu-mao-ailao", "柳貌", "永平十二年遣子率哀牢种人内属的哀牢王。", {
    aliases: ["哀牢王柳貌"], primaryPolity: "哀牢",
  }),
  qiuciJian: canonical("eh-qiuci-king-jian", "龟兹王建", "永平十六年攻杀疏勒王成并改立兜题的龟兹王。", {
    aliases: ["建"], primaryPolity: "龟兹",
  }),
  shuleCheng: canonical("eh-shule-king-cheng", "疏勒王成", "永平十六年被龟兹王建攻杀的疏勒王。", {
    aliases: ["成"], primaryPolity: "疏勒",
  }),
  douti: canonical("eh-douti-shule", "兜题", "永平十六年被龟兹王建改立为疏勒王。", {
    primaryPolity: "疏勒",
  }),
  bujuzheng: canonical("eh-bujuzheng", "不居征", "元和三年被匈奴立为莎车王的贤之质子。", {
    primaryPolity: "莎车",
  }),
  guangde: canonical("eh-guangde-shache", "广德", "元和三年攻杀不居征并改立齐黎的莎车王族成员。", {
    primaryPolity: "莎车",
  }),
  qili: canonical("eh-qili-shache", "齐黎", "元和三年被广德改立为莎车王。", {
    primaryPolity: "莎车",
  }),
  youliu: canonical("eh-youliu-chanyu", "优留单于", "章和元年被鲜卑击杀的北匈奴单于。", {
    primaryPolity: "北匈奴",
  }),
  miwu: canonical("eh-miwu-qiang", "迷吾", "章和二年被护羌校尉张纡诱杀的烧当羌首领。", {
    aliases: ["烧当种羌迷吾"], primaryPolity: "烧当羌",
  }),
};

export const easternHan5888CanonicalPeople = Object.values(people);

const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id,
  canonicalName: people[key].name,
  sourceNames,
});
const options = (value) => ({
  ...(value.summary ? { summary: value.summary } : {}),
  ...(value.personBindings?.length ? { personBindings: value.personBindings } : {}),
  ...(value.removePersonNames?.length ? { removePersonNames: value.removePersonNames } : {}),
  ...(value.placeBindings?.length ? { placeBindings: value.placeBindings } : {}),
  ...(Object.hasOwn(value, "matchedEventId") ? { matchedEventId: value.matchedEventId } : {}),
  ...(value.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
});
const context = (suffix, value = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  ...(value.title ? { title: value.title } : {}),
  reason: value.reason ?? "本条为孤立薨卒、普通宗室履历、例行赦令、注文或同一事件的补充证据，保留为上下文而不单独晋级。",
  ...options(value),
});
const promote = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: value.reason ?? "原文可直接核定主体、行动与精确纪年，具有独立事件边界。",
  ...options(value),
});
const collective = (suffix, title, value = {}) => promote(suffix, title, {
  ...value,
  allowCollectiveEvent: true,
  reason: value.reason ?? "集体主体、行动与精确纪年明确，可作为独立事件晋级。",
});

const mingSuccessionSummary = "永平十八年（75）八月壬子，汉明帝刘庄崩于东宫前殿；皇太子刘炟同日即皇帝位。";
const zhangSuccessionSummary = "章和二年（88）二月壬辰，汉章帝刘炟崩于章德前殿；皇太子刘肇同日即皇帝位，时年十岁。";
const wulingEventId = "official-history-event:81394835f237e94b2d52";

export const easternHan5888CandidateRepairs = [
  promote("078b1b444e101327489af903", "偏何击破赤山", { personBindings: [binding("pianHe")] }),
  promote("7362c7398dee87a673794920", "祭肜使偏何击杀歆志贲", {
    personBindings: [binding("pianHe"), binding("xinZhiben")],
  }),
  context("747601764e2a3308d071ea51", { title: "东海王刘强去世" }),
  collective("80082493274c683573d957ea", "益州军平定姑复夷叛乱"),
  promote("a42ce7eaff96d095a4729f00", "马武等击滇吾于西邯", {
    matchedEventId: "official-history-event:9ed4881fec386685082b",
  }),

  promote("a8e221ad846801e9cc53606f", "窦林下狱死", {
    matchedEventId: "official-history-event:cbb79dc36e48670c151f",
  }),
  collective("b892aa03dfddb8c6e4a7fd8d", "北匈奴护于丘率众降汉", {
    personBindings: [binding("huyuqiu")],
  }),
  context("d7c4e9b1b502b7cb3cdc1e87", { title: "皇女姬封获嘉长公主" }),

  context("81009fffd38a780ff37e27c2", { title: "刘羡封广平王" }),
  promote("b746455d9e519a6e1f5585fa", "封刘建为千乘王", {
    matchedEventId: "official-history-event:888f1c9779e36291f8ab",
    reason: "本纪明确此事在永平三年（60）；合并既有机器事件并纠正其旧年份59。",
  }),
  promote("d8db94585e282ed5f5ad1b1d", "明帝立马氏为皇后", {
    personBindings: [binding("mingdi", ["刘庄", "明帝", "帝"]), binding("empressMa", ["马氏", "贵人马氏"])],
  }),

  context("16e9ecf5d8f02b4cbea94c3f", { title: "千乘王刘建去世" }),
  context("8bb2230b5b5ec4cf594d3f7b", { title: "梁松下狱死" }),

  context("b83e0ab228f66bd0ab52fccc", { title: "明帝迎取飞廉铜马置平乐馆" }),
  collective("cd3b473cb4da52ad9155fc18", "北匈奴进攻五原"),

  context("9b053a9c08bc27e2279a8ebb", { title: "北海王刘兴去世" }),
  context("b9666fd3a9d83fc00b096d67", {
    title: "皇太后阴丽华去世",
    personBindings: [binding("yinLihua", ["皇太后阴氏", "阴氏"])],
    removePersonNames: ["和帝阴皇后"],
  }),

  context("cd4a2b4aa0315885a2e4a7c5", {
    title: "刘党赐号重熹王",
    reason: "句中同时追叙永平九年赐号和永平十五年封王，当前候选年只对应前一节点，保留为人物履历。",
  }),
  context("800b3e67ba282775fd9c50b7", { title: "郭霸下狱死" }),

  context("9696f06065ad1737710b9a88", { title: "王康下狱死" }),
  collective("9e26b50e47da6993ecdba3eb", "哀牢内属并置永昌郡", {
    personBindings: [binding("liuMao", ["柳貌", "哀牢王柳貌"])],
  }),
  context("f3d2aab5170d83b5da68794f", {
    title: "哀牢王柳貌遣子率众内属",
    personBindings: [binding("liuMao", ["柳貌", "哀牢王柳貌"])],
    reason: "这是同年哀牢内属、设置永昌郡事件的列传补充，不另建重复事件。",
  }),

  promote("2c9732386be43af2601eb74e", "楚王刘英谋反被废", {
    personBindings: [binding("liuYing", ["刘英", "楚王英"])],
  }),
  context("b52ea748322236203f3cea56", { title: "王平与宗室谋反案" }),
  context("e386267126be84ce2da0d7ba", { title: "薛昭下狱死" }),

  context("988cc5137b2e4d1302f90732", { title: "宗室与东平王谋反被除国" }),
  promote("a1ad2c2bc3678f25005db219", "封刘元寿为广陵侯", {
    matchedEventId: "official-history-event:62c444f8f2a803449103",
  }),

  context("904b4e10c34a44cc770e89c8", { title: "刘畅封汝南王" }),
  context("a20cac9bb411bb8d073505f7", { title: "宗室因楚王英案被除国" }),
  context("ba5a23093f344e2e729e603b", { title: "大赦天下" }),

  promote("0e16238d00b3dd62da7d3b78", "邢穆与韩光下狱死", {
    matchedEventId: "official-history-event:1b748d27001507783cba",
  }),
  collective("979c899809dbfc95712d6e41", "汉取伊吾卢并恢复车师内属"),
  promote("b973c2ec382fc6498c3e00e4", "窦固等四道出击匈奴", {
    matchedEventId: "official-history-event:4e7678d67317eb79154b",
  }),
  promote("bd25c59825b66641629c09c2", "龟兹王建攻杀疏勒王成并立兜题", {
    personBindings: [binding("qiuciJian"), binding("shuleCheng"), binding("douti")],
  }),
  context("e22cd70170ec2f3f53962911", { title: "刘延徙封阜陵王" }),

  promote("b606d0ad3e77ef13fbf30aed", "刘张等击降车师", {
    matchedEventId: "official-history-event:f2b3e053a8cd54de8488",
  }),

  context("100a43635fe1b9b3a3e7924d", { title: "章帝即位后大赦天下" }),
  promote("a192ceaa219b4fa76e4b44de", "汉明帝崩与刘炟即位", {
    summary: mingSuccessionSummary,
    personBindings: [binding("mingdi", ["刘庄", "明帝", "帝"]), binding("zhangdi", ["刘炟", "皇太子"])],
  }),
  promote("f8bb18940ad2fc869306f108", "汉明帝崩与刘炟即位", {
    summary: mingSuccessionSummary,
    personBindings: [binding("mingdi", ["刘庄", "明帝"]), binding("zhangdi", ["刘炟", "皇帝"])],
  }),

  collective("152badab054dfc294f890176", "武陵澧中蛮叛乱被平定", {
    matchedEventId: wulingEventId,
  }),
  collective("18df6b72cdd7d615fbdb033e", "武陵澧中蛮叛乱被平定", {
    matchedEventId: wulingEventId,
  }),
  collective("785fba044e2c8c3040450083", "武陵澧中蛮叛乱被平定", {
    matchedEventId: wulingEventId,
  }),
  collective("8918581a112f6e18bf5eb184", "汉军于柳中攻车师交河城"),
  collective("c625be6a7348ed832430e375", "永昌哀牢夷叛乱"),

  context("04223445ed6a4c6536eea4c5", {
    title: "窦氏立后与窦宪入仕",
    personBindings: [binding("empressDou", ["窦氏", "女弟", "皇后"])],
  }),
  collective("97e382a4953a3bd8936977d6", "金城陇西保塞羌反叛"),
  promote("b682a304cdbe79590a9e3b48", "烧当羌叛乱", {
    matchedEventId: "official-history-event:7606c342af5b621b6226",
    reason: "本纪顺序核定为建初二年（77）；沿用既有77年事件并替代旧批次误生的76年重复卡。",
  }),
  context("ef89f96abcc25c4ccd62baa2", { title: "章帝绍封窦勤为伊亭侯" }),

  context("007a2b7c925a0b8f8212bb4a", {
    title: "刘庆出生与次年立太子",
    personBindings: [binding("liuQing", ["刘庆", "庆"])],
    reason: "本句以建初三年出生为纪年锚点，立太子实际在次年；由79年本纪卡承载正式事件。",
  }),
  context("3f76718c218241d086c1aec2", { title: "宗室徙封江陵王" }),
  promote("5ad9b2d03e279b600d915e1f", "章帝立窦氏为皇后", {
    personBindings: [binding("zhangdi", ["刘炟", "章帝", "帝"]), binding("empressDou", ["窦氏", "贵人窦氏"])],
  }),
  context("b9bc8339ea2e4fd7c1cdfb5c", {
    title: "北海王刘基去世",
    removePersonNames: ["王基"],
    reason: "“北海王基”指宗室刘基，不是魏将王基；保留为宗室卒年上下文并移除同名误绑。",
  }),
  context("d76e4e2fea50a2b857954b61", {
    title: "班超攻破姑墨石城",
    reason: "这是同年班超击姑墨事件的列传经过，合并到本纪事件，不另建重复卡。",
  }),
  promote("f052a05bd3e7dc4111e3216e", "班超击姑墨", {
    matchedEventId: "official-history-event:d77547fb1d38889fdba0",
  }),

  context("1d3790a2d20be994686c624c", {
    title: "刘昞徙封淮阳王",
    reason: "句首同时追叙永平五年封常山王，标题与建初四年纪年不一致；保留为人物履历。",
  }),
  promote("7c7d6b3c01bb832af6d7ca25", "章帝立刘庆为皇太子", {
    personBindings: [binding("zhangdi", ["刘炟", "章帝", "帝"]), binding("liuQing", ["刘庆", "皇子庆", "庆"])],
  }),

  context("18a77e7ca0e350545086c32a", { title: "赵王刘盱去世" }),
  context("6e678159e5b8eeb38bd34383", { title: "琅邪王刘京去世" }),

  promote("bdcc112baff2168c5628a16f", "章帝废刘庆并立刘肇为皇太子", {
    personBindings: [
      binding("zhangdi", ["刘炟", "章帝", "帝"]),
      binding("liuQing", ["刘庆", "皇太子庆", "庆"]),
      binding("hedi", ["刘肇", "皇子肇", "肇"]),
    ],
  }),

  context("172b9e5d4574552c8d5cec82", { title: "东平王刘苍去世" }),
  collective("1a50e28aca22c0f39d4d8657", "北匈奴大人率众降汉"),

  context("1c535232c8e42299c6f9ea2a", { title: "封孝王孙二人为列侯" }),
  context("44cd45a8aac26f186bd639c4", { title: "沛王刘辅去世" }),
  context("6eb9791f05dbee297b812251", { title: "济阴王刘长去世" }),
  context("871c257034ddfed962e5566a", { title: "封刘尚为任城王" }),
  context("890a2c5db1bca85e408cb966", { title: "东平王刘忠去世" }),
  promote("896e9fc55da9cb541fd54582", "中山王刘焉来朝", {
    matchedEventId: "official-history-event:eb6ff2407c96ca2415f1",
  }),

  context("94fd7e6ac53683ec1ef3349f", {
    title: "遣使祭祀定陶太后及恭王陵",
    removePersonNames: ["刘陵"],
    reason: "“陵”在本句指陵墓，不是人物刘陵；该祭祀记录保留为礼制上下文。",
  }),

  collective("282d6e12dd1f0ef449594e86", "莎车王不居征被杀及齐黎被立", {
    personBindings: [binding("bujuzheng"), binding("guangde"), binding("qili")],
  }),

  promote("07ae07e191e6d2dbd1db581a", "傅育追击叛羌战死", {
    matchedEventId: "official-history-event:89d008e4fb1c5d98275b",
  }),
  context("2f13762d39ea97c47e1af747", { title: "赦天下系囚" }),
  context("3f019a2aed8f78e82dd9c487", { title: "西域遣使献师子与符拔" }),
  context("7330a701285cda6abec3bd9a", { title: "淮阳王刘昞去世" }),
  collective("ef46d02712a08d4c1c2ae7b0", "鲜卑击破北匈奴并斩优留单于", {
    personBindings: [binding("youliu", ["优留单于"])],
  }),

  promote("414bf73e4df6a3e7dda61460", "汉章帝崩与刘肇即位", {
    summary: zhangSuccessionSummary,
    personBindings: [binding("zhangdi", ["刘炟", "章帝", "帝"]), binding("hedi", ["刘肇", "皇太子"])],
    placeBindings: [{ id: "zhangde-front-hall", label: "章德前殿", role: "primary-location" }],
  }),
  context("4b6cdacdc13697e9ef0aaf14", {
    title: "鲜卑破北匈奴与南单于北伐主张",
    reason: "本条说明章和元年鲜卑击破北匈奴的后续影响，暂不拆成重复战事。",
  }),
  promote("8aba22bd4c08e3617c823f8f", "张纡诱杀迷吾等烧当羌首领", {
    matchedEventId: "official-history-event:dfee1a6c26823075d56b",
    personBindings: [binding("miwu", ["迷吾", "烧当种羌迷吾"])],
  }),
  promote("b72997b79152426cdb3e161d", "窦宪击北匈奴", {
    matchedEventId: "official-history-event:2090d9596008d03d139b",
  }),
  promote("b7a6b68e8dae54af2b73f68d", "汉章帝崩与刘肇即位", {
    summary: zhangSuccessionSummary,
    personBindings: [binding("zhangdi", ["刘炟", "章帝"]), binding("hedi", ["刘肇", "皇帝"])],
    placeBindings: [{ id: "zhangde-front-hall", label: "章德前殿", role: "primary-location" }],
  }),
  promote("bff8f23e093c17af899ee792", "窦宪击北匈奴", {
    matchedEventId: "official-history-event:2090d9596008d03d139b",
  }),
  context("a9c4033576b7827da263cf81", { title: "显宗更封平为竟陵侯" }),
  context("0c93b00b70aa548ff54946ac", { title: "东平王苍罢归藩" }),
  context("383109ad721ccc7f5ea6b267", { title: "刘庄封顺弟子为乡侯" }),
  collective("2f9b19c40702c61534cecc0d", "淮阳王延谋反案发"),
  collective("1efbee17f94ede9232e008a8", "阜陵王延谋反被贬侯"),
  context("3bd70e59b2a3bfec68eab8ed", { title: "肃宗封楚王英子种为侯" }),
  context("05ed424d7a7e66e5d520d19c", { title: "绍封阜子盱为高亭侯" }),
  promote("71715c3c43d28a8d6ffc3311", "明德马皇后崩", { personBindings: [binding("empressMa")] }),
  context("57fd3c2783111399c0eee931", { title: "诸窦谮杀梁贵人并陷梁竦" }),
  context("533ebb8ca8fd5a5aa9d38f91", { title: "章帝南巡诏禁郡县设储跱" }),
  promote("c4c70b20e7233f630b071901", "迷吾等羌反叛", { personBindings: [binding("miwu")] }),

];

export default {
  coverageMode: "partial",
  decisionRebinding: { strategy: "legacy-source-mention" },
  profileId: easternHan5888ProfileId,
  batchId: easternHan5888BatchId,
  periodId: easternHan5888PeriodId,
  generator: easternHan5888Generator,
  canonicalPeople: easternHan5888CanonicalPeople,
  decisions: easternHan5888CandidateRepairs,
  batchNotes: "东汉明帝至章帝时期候选已逐条核定：战争、叛乱、内附、废立和皇位继承晋级；孤立薨卒、普通履历、例行赦令与重复经过保留为上下文。",
};
