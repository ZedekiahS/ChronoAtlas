export const easternHan2557ProfileId = "china-eastern-han-25-183-v1";
export const easternHan2557BatchId = "auto-houhanshu-eastern-han-25-57-candidates";
export const easternHan2557PeriodId = "china-eastern-han-25-184";
export const easternHan2557Generator = "official-history-candidate-repair:eastern-han-25-57-v1";

const card = (suffix) => `card:houhanshu-eastern-han-25-57:${suffix}`;
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
  liuXiu: canonical("eh-liu-xiu", "刘秀", "东汉开国皇帝光武帝，建武年间完成政权重建与主要割据势力的平定。", {
    aliases: ["光武帝", "世祖"],
    birthYear: -5,
    deathYear: 57,
  }),
  wuHan: canonical("official-history-person-139c7486d5327aa6", "吴汉", "东汉开国功臣，建武元年至二年参与平定檀乡。", {
    aliases: ["大司马吴汉"],
  }),
  duMao: canonical("eh-du-mao", "杜茂", "东汉开国将领，建武二年参与击破檀乡贼。", {
    aliases: ["大将军杜茂"],
  }),
  wangBa: canonical("eh-wang-ba", "王霸", "东汉开国将领，建武二年参与平定檀乡，后参与讨伐刘永。", {
    aliases: ["偏将军王霸"],
  }),
  liuLongCavalry: canonical("eh-liu-long-cavalry-commandant", "刘隆（骑都尉）", "东汉建武初年骑都尉，参与建武二年击破檀乡贼；与105年即位的汉殇帝刘隆不是同一人。", {
    aliases: ["刘隆", "骑都尉刘隆"],
  }),
  cenPeng: canonical("eh-cen-peng", "岑彭", "东汉开国将领，建武二年受命进击荆州并攻下犨、叶等城。", {
    aliases: ["征南大将军岑彭"],
  }),
  guoShengtong: canonical("official-history-person-33872bdc5bdbea83", "郭圣通", "光武帝皇后，建武二年被立，建武十七年被废。", {
    aliases: ["郭皇后", "郭后"],
  }),
  liuQiang: canonical("eh-liu-qiang-donghai", "刘强", "光武帝长子，建武二年被立为皇太子，后为东海王。", {
    aliases: ["皇太子刘强", "东海王强"],
  }),
  dengYu: canonical("official-history-person-34078e2ccec9e3ed", "邓禹", "东汉开国功臣，建武二年西击赤眉，屯驻云阳。", {
    aliases: ["大司徒邓禹"],
  }),
  yanCen: canonical("eh-yan-cen", "延岑", "东汉初年割据者，建武二年再叛，攻汉中并围南郑。"),
  liuYong: canonical("eh-liu-yong", "刘永", "东汉初年割据者，建武四年遭盖延、王霸等讨伐。"),
  gaiYan: canonical("eh-gai-yan", "盖延", "东汉开国将领，建武四年参与讨伐刘永。", {
    aliases: ["虎牙将军盖延"],
  }),
  liuFu: canonical("eh-liu-fu-pei", "刘辅", "光武帝子，建武十七年进封中山王，建武二十年徙封沛王。", {
    aliases: ["中山王辅", "沛献王辅"],
  }),
  maYuan: canonical("official-history-person-10633313875767f4", "马援", "东汉将领，建武二十一年奉命出塞击乌桓，未能取胜。", {
    aliases: ["伏波将军马援"],
  }),
  jiTong: canonical("official-history-person-bc942f7a29e5d193", "祭肜", "东汉辽东太守，建武二十一年击破入寇辽东的鲜卑与匈奴。", {
    aliases: ["辽东太守祭肜"],
  }),
  liuShang: canonical("official-history-person-200601b411dc3e2a", "刘尚", "东汉武威将军，建武二十一年至二十三年先后平定益州夷、南郡蛮并讨武陵蛮。", {
    aliases: ["武威将军刘尚"],
  }),
  leiQian: canonical("eh-lei-qian", "雷迁", "南郡潳山蛮首领，建武二十三年率部反叛。", {
    aliases: ["潳山蛮雷迁"],
    primaryPolity: "南郡蛮",
  }),
  biSouthernXiongnu: canonical("eh-bi-southern-xiongnu", "南单于比", "匈奴薁鞬日逐王比，建武二十四年自立为南单于，促成南北匈奴分立。", {
    aliases: ["比", "薁鞬日逐王比", "南匈奴单于比"],
    primaryPolity: "南匈奴",
  }),
  liuXu: canonical("eh-liu-xu-longxi", "刘盱", "东汉陇西太守，中元元年遣辛都、李苞赴武都击参狼羌。", {
    aliases: ["陇西太守刘盱"],
  }),
  xinDu: canonical("eh-xin-du", "辛都", "东汉从事，中元元年率军赴武都击参狼羌。", {
    aliases: ["从事辛都"],
  }),
  liBao: canonical("eh-li-bao", "李苞", "东汉监军掾，中元元年随辛都赴武都击参狼羌。", {
    aliases: ["监军掾李苞"],
  }),
};

export const easternHan2557CanonicalPeople = Object.values(people);

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
  reason: value.reason ?? "本条为封侯履历、例行赦令、注释性补语或缺少可核定主体的叙述，保留为人物与纪年上下文，不单独晋级为正式事件。",
  ...options(value),
});
const promote = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: value.reason ?? "主体、行动、结果或制度变化与精确纪年均可由《后汉书》原文直接核定，具有独立事件边界。",
  ...options(value),
});
const collective = (suffix, title, value = {}) => promote(suffix, title, {
  ...value,
  allowCollectiveEvent: true,
  reason: value.reason ?? "集体主体、行动与精确纪年明确，可作为独立事件晋级。",
});

const tanxiangEventId = "official-history-event:814e28ce10ecab943bf7";
const dengYuEventId = "official-history-event:9741d84eb3b6fc323869";
const guoDepositionEventId = "official-history-event:2a0a79d3722196055aed";
const yizhouEventId = "official-history-event:81a3292ae845603930f8";
const maYuanEventId = "official-history-event:eebe10d47589a76a445f";
const nanjunEventId = "official-history-event:2aface1384f5c5aaf5a0";

export const easternHan2557CandidateRepairs = [
  promote("0086e4fda7a7e157eb138c80", "吴汉等击檀乡", {
    matchedEventId: tanxiangEventId,
    personBindings: [binding("wuHan")],
    placeBindings: [{ id: "tanxiang", label: "檀乡", role: "primary-location" }],
  }),
  context("d4d0dcdf2ec2cf53c9a4a903", { title: "更封灵寿侯" }),
  context("0339025ef4b02357a989965d", { title: "光武封敏为甘里侯" }),
  promote("1c80c32bd6441f3ffc90c988", "岑彭击荆州下犨叶等城", {
    personBindings: [binding("cenPeng", ["岑彭", "彭"])],
    placeBindings: [{ id: "jing-zhou", label: "荆州", role: "primary-location" }],
  }),
  context("35a41efcb0954ced9a58f72c", {
    title: "吴汉等大破檀乡",
    personBindings: [
      binding("wuHan"),
      binding("duMao"),
      binding("wangBa"),
      binding("liuLongCavalry", ["刘隆"]),
    ],
    placeBindings: [{ id: "tanxiang", label: "檀乡", role: "primary-location" }],
    reason: "本条为建武元年吴汉等击檀乡的次年战果，原候选已经包含该结局；保留为同一事件的交叉上下文，不另建重复事件。",
  }),
  context("365f73fe0b8616188f5022ed", { title: "更封中水侯" }),
  context("3e0a4c1d2dfe23851fb6d398", { title: "封为慎侯" }),
  promote("58746509d3d4aed35f348220", "光武帝立郭圣通为皇后及刘强为皇太子", {
    summary: "建武二年（26），光武帝立贵人郭圣通为皇后，皇子刘强为皇太子，并封郭况为绵蛮侯。",
    personBindings: [binding("liuXiu"), binding("guoShengtong"), binding("liuQiang")],
  }),
  context("64d99a583d736a6d82686720", { title: "定封颍阳侯" }),
  context("67813e05158597bbe80d4453", { title: "刘兴封鲁王" }),
  context("6df43714d102a3d8b22fdcad", { title: "封良为广阳王" }),
  context("70f69edff7361f17d46aeecf", { title: "封为城阳王" }),
  promote("8b7ba170a31f507aac03c5c4", "邓禹西击赤眉", {
    matchedEventId: dengYuEventId,
    personBindings: [binding("dengYu")],
    placeBindings: [{ id: "yunyang-zuopingyi", label: "云阳", role: "primary-location" }],
  }),
  promote("964f01fbf56a5ddaff208c73", "延岑再叛攻汉中并围南郑", {
    summary: "建武二年（26），延岑再叛，攻汉中、围南郑，冯嘉兵败退走。",
    personBindings: [binding("yanCen")],
    placeBindings: [
      { id: "hanzhong", label: "汉中", role: "related-location" },
      { id: "nanzheng", label: "南郑", role: "primary-location" },
    ],
  }),
  context("99603682ade6d06f0326f7bb", { title: "代王梁为大司空并封栒邑侯" }),
  context("dba8fdb7b3e8a389704d1419", { title: "封成武侯" }),
  promote("8c7dd506bfe0e21d5fd6fdc1", "王霸等讨刘永并下济阴", {
    personBindings: [
      binding("wangBa", ["王霸", "武"]),
      binding("gaiYan"),
      binding("liuYong"),
    ],
  }),
  context("1d766e44eba0e599d10044cb", { title: "封东地渠帅为县侯" }),
  collective("2a10d9a3712852a55b184d2d", "高句骊遣使朝贡并复王号", {
    personBindings: [binding("liuXiu", ["光武", "光武帝"])],
    placeBindings: [{ id: "gaogouli", label: "高句骊", role: "primary-location" }],
  }),
  context("cac60e123be8985d614a788a", {
    title: "隗嚣去世与凉州羌胡叛乱缘由议论",
    reason: "本句主体是班彪对凉州羌胡反叛缘由的奏议，隗嚣去世仅为时间背景，不将论议或孤立卒年拆作正式事件。",
  }),
  context("04a14bec827dd90c1072cc3c", { title: "刘辅封右翊公" }),
  context("7b9500fe43aa9c611c9194f7", { title: "刘苍封东平公" }),
  context("8334636fd3de32711bc72a8a", { title: "刘英封楚公" }),
  context("9b84a0de91c83dc9d5cde89c", { title: "封舞阳长公主" }),
  context("a06bed94e4e6ee91ece1f443", { title: "刘延封淮阳公" }),
  context("a670e2b6e31b5a4a2d3f1cf6", { title: "刘荆封山阳公" }),
  context("ad3fd49ed56331280fa71fd6", { title: "刘京封琅邪公" }),
  context("c2f279d5d6fa89921dccce41", { title: "刘康封济南公" }),
  context("e9f720e54e5ee1b29d3535b9", { title: "刘焉封左翊公" }),
  context("5138bf712e5d62c7561b9446", {
    title: "郭圣通被废后刘辅进封中山王",
    personBindings: [binding("guoShengtong"), binding("liuFu", ["刘辅", "辅"])],
    reason: "本条补充郭圣通被废后的宗室处置，与建武十七年废后事件同属一组政权调整，保留为交叉上下文。",
  }),
  promote("bd6f276da9c034c73e484c23", "郭皇后被废", {
    matchedEventId: guoDepositionEventId,
    personBindings: [binding("liuXiu", ["光武", "光武帝"]), binding("guoShengtong")],
  }),
  context("5b22f29edff178087a184582", { title: "中山王刘辅徙封沛王" }),
  collective("6f9ed9504120f8b1ff344011", "匈奴寇天水", {
    placeBindings: [{ id: "tianshui-commandery", label: "天水", role: "primary-location" }],
  }),
  collective("17050e3b79fd587be849be6f", "安定属国胡叛聚青山", {
    placeBindings: [
      { id: "anding", label: "安定", role: "related-location" },
      { id: "qingshan-anding", label: "青山", role: "primary-location" },
    ],
  }),
  promote("577f3fca0e7c25f3e0882d30", "马援出塞击乌桓", {
    matchedEventId: maYuanEventId,
    personBindings: [binding("maYuan")],
  }),
  collective("7ad41f7b388ebf986b42a145", "祭肜击破入寇辽东的鲜卑与匈奴", {
    personBindings: [binding("jiTong")],
    placeBindings: [{ id: "liaodong", label: "辽东", role: "primary-location" }],
  }),
  promote("f398e7cf04f77cf1fa7e8a19", "刘尚破益州夷", {
    matchedEventId: yizhouEventId,
    personBindings: [binding("liuShang")],
    placeBindings: [{ id: "yi-zhou", label: "益州", role: "primary-location" }],
  }),
  context("51a62f2d4c5793ea6a412e86", { title: "精夫相单程等寇掠郡县" }),
  promote("cc98f6f7d7085b4627ed9377", "南郡蛮叛", {
    matchedEventId: nanjunEventId,
    personBindings: [binding("leiQian", ["雷迁", "雷迁等", "雷迁等始"])],
    removePersonNames: ["雷迁等始"],
    placeBindings: [{ id: "nanjun", label: "南郡", role: "primary-location" }],
    reason: "雷迁等反叛与同年本纪所记南郡蛮叛为同一事件链，合并到既有事件并纠正“雷迁等始”的伪人物识别。",
  }),
  promote("d3d9696851cfa1c050a8d4a1", "南郡蛮叛", {
    matchedEventId: nanjunEventId,
    personBindings: [binding("liuShang")],
    removePersonNames: ["雷迁等始"],
    placeBindings: [
      { id: "nanjun", label: "南郡", role: "related-location" },
      { id: "jiangxia", label: "江夏", role: "related-location" },
    ],
  }),
  promote("eadb2c785261a5b0dbd4a8e4", "刘尚讨武陵蛮于沅水", {
    personBindings: [binding("liuShang")],
    placeBindings: [
      { id: "wuling", label: "武陵", role: "related-location" },
      { id: "yuan-river", label: "沅水", role: "primary-location" },
    ],
  }),
  context("9a90612c820dea921730dc71", { title: "大赦天下" }),
  context("fd23da9d9c3d724ce7d1d95a", {
    title: "武陵蛮寇临沅",
    placeBindings: [
      { id: "wuling", label: "武陵", role: "related-location" },
      { id: "linyuan", label: "临沅", role: "primary-location" },
    ],
    reason: "本条为刘尚讨武陵蛮后的延续性寇掠，保留为同一叛乱事件链的上下文，暂不将其误作独立战役。",
  }),
  collective("ffd432313d0e35ea5653f6ae", "薁鞬日逐王比自立为南单于", {
    summary: "建武二十四年（48），匈奴薁鞬日逐王比自立为南单于，匈奴由此分为南、北两部。",
    personBindings: [binding("biSouthernXiongnu", ["比", "薁鞬日逐王比"])],
  }),
  context("329ffacbcf93312406cd6a33", { title: "光武帝追赠郭昌并与郭主合葬" }),
  promote("7a40b6dabe8bd2d6a82fd8f6", "刘盱遣辛都李苞击破武都参狼羌", {
    summary: "中元元年（56），武都参狼羌反，陇西太守刘盱遣辛都、李苞率军赴武都，斩其酋豪，获首虏千余人。",
    personBindings: [binding("liuXu"), binding("xinDu"), binding("liBao")],
    placeBindings: [{ id: "wudu", label: "武都", role: "primary-location" }],
  }),
  context("b29765f4ca7db07f77fc5f7c", { title: "大赦天下" }),
  context("c01bc555bdeca628c14fe45a", {
    title: "伊伐于虑鞮单于汗即位",
    removePersonNames: ["于虑鞮单"],
    reason: "单于名号与个人名的断句尚未完成交叉核定，不以残缺称号建立人物实体或晋级继承事件。",
  }),
  collective("26bab50c10a2f5729a1d8de9", "东汉改置刺史"),
  context("4333c9c0b45bd8632c1772da", { title: "光武帝立郭圣通为皇后及刘强为皇太子", reason: "与已晋级的立后立太子事件为同一事实的交叉记载。" }),
  context("f0971c54f34fa97e34775ecb", { title: "封为城阳王" }),
  context("6ef9e876740b02761817d2e9", { title: "邓禹拜大司徒并封阳都侯" }),
  collective("28520faa927b542ec2b5b602", "公孙述将任满寇南郡"),
  context("71e40a52a32604fba837e1da", { title: "赦乐浪谋反大逆殊死已下" }),
  context("e639b86c21d8de7cc0b7a19b", { title: "封前河间王邵为河间王" }),
  context("658b043b6b180b2403b82258", { title: "傅抗下狱死" }),
  context("ecccf290e364c23926041db1", { title: "高句丽王遣使奉贡", reason: "与同年高句丽遣使朝贡并复王号的已晋级事件重复。" }),
  collective("eaca65671bb497450491b8d5", "王元周宗复立隗纯为王"),
  collective("a2b387bdbcabea419250bb36", "来歙大破隗纯于落门"),
  collective("9ea9a079be15b96ac00b11d4", "来歙与马成破王元环安于下辩"),
  promote("52dc50949c2733b358967037", "岑彭破侯丹于黄石", { personBindings: [binding("cenPeng", ["岑彭", "彭"])] }),
  collective("82070ba19c8ce6cb16e53fe9", "东汉废除奴婢射伤人弃市律"),
  promote("e5879dfcc499822f73a15be0", "吴汉率舟师伐公孙述", { personBindings: [binding("wuHan")] }),
  promote("f4ad962e0481172630df3ec5", "吴汉大破谢丰于广都", { personBindings: [binding("wuHan")] }),
  context("65983277d04aa55e51308765", { title: "降赵王良等为公" }),
  collective("318e66be4a165de1b80a67ef", "匈奴寇河东"),
  collective("5118c27c0cb2b8e7dbca1118", "贾丹杀尹由并归降东汉"),
  context("620239a4cfe80be6b68b5043", { title: "临淮怀公衡薨而国除" }),
  context("b4005630fd9afae1833e077a", { title: "光武帝封诸皇子为公" }),
  context("7ab0dce7caa2d722f08e0fd7", { title: "欧阳歙下狱死" }),
  collective("4f41fcc20727e9f96e431b6e", "张伋等因度田不实下狱死"),
  context("8d80eb7d23263168932a52a3", { title: "遣使者下郡国听群盗自相纠擿" }),
  context("933cc9c3319bab558e90ca91", { title: "封卢芳为代王" }),
  collective("f8f1f4b7578e95a6c1aa5f71", "昆明诸种反叛并杀长吏"),
  collective("326498f5c8c727908e23f07a", "蜀郡守将史歆叛乱"),
  context("43c61954ec5f93580319965d", { title: "赦益州所部殊死已下" }),
  collective("3f0a768f98f0b98e6cdd5fdb", "苏马諟等诣乐浪贡献"),
  context("5bfb503e6a8658ae9ad6100a", { title: "戴涉下狱死" }),
  collective("b158401ef4ee1137d81f49a0", "鄯善焉耆遣子入侍后附属匈奴"),
  context("9bc1036b2120e637626c318b", { title: "苏邺下狱死" }),
  context("999ee82a9205412699a3d095", { title: "武陵蛮叛乱与刘尚讨伐", reason: "与已审核的刘尚讨武陵蛮事件属于同一叛乱链的交叉证据。" }),
  context("63a1fe7561a5ee43c4d016ca", { title: "大赦天下" }),
  context("bd9566c456222842443097b8", { title: "沛太后郭氏薨后捕治王侯宾客" }),
  context("f339b99275a5cbbaaa1166b6", { title: "明帝即位", reason: "与已审核的光武帝崩、明帝即位事件重复。" }),
  collective("d2a0933f17e033519fa62ca0", "烧当羌寇陇西并败郡兵于允街"),
  context("02c780b9f5e3ba4d37249e77", { title: "光武帝崩于南宫前殿", reason: "与已审核的光武帝崩、明帝即位事件重复。" }),

];

export default {
  coverageMode: "partial",
  decisionRebinding: { strategy: "legacy-source-mention" },
  profileId: easternHan2557ProfileId,
  batchId: easternHan2557BatchId,
  periodId: easternHan2557PeriodId,
  generator: easternHan2557Generator,
  canonicalPeople: easternHan2557CanonicalPeople,
  decisions: easternHan2557CandidateRepairs,
  batchNotes: "东汉建武至中元二年候选按可复用规则逐条核定：明确的征伐、叛乱、边疆关系、皇后废立与政权分裂晋级；宗室封爵、例行赦令、孤立卒年、注文和缺主语残句保留为上下文。",
};
