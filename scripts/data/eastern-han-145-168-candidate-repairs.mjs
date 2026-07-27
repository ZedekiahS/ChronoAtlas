export const easternHan145168ProfileId = "china-eastern-han-25-183-v1";
export const easternHan145168BatchId = "auto-houhanshu-eastern-han-145-168-candidates";
export const easternHan145168PeriodId = "china-eastern-han-25-184";
export const easternHan145168Generator = "official-history-candidate-repair:eastern-han-145-168-v1";

const card = (suffix) => `card:houhanshu-eastern-han-145-168:${suffix}`;
const binding = (personId, canonicalName, sourceNames = [canonicalName]) => ({
  personId,
  canonicalName,
  sourceNames,
});
const context = (suffix, reason = "例行制度、普通宗室薨逝、人物履历或重复证据，保留为史料上下文而不单独晋级。", options = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  reason,
  ...(options.title ? { title: options.title } : {}),
  ...(options.personBindings?.length ? { personBindings: options.personBindings } : {}),
});
const promote = (suffix, title, options = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: options.reason ?? "主体、行动与精确纪年均可由《后汉书》原文直接核定。",
  ...(options.personBindings?.length ? { personBindings: options.personBindings } : {}),
  ...(Object.hasOwn(options, "matchedEventId") ? { matchedEventId: options.matchedEventId } : {}),
  ...(options.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
});
const collective = (suffix, title, options = {}) => promote(suffix, title, {
  ...options,
  allowCollectiveEvent: true,
  reason: options.reason ?? "集体主体、行动、地点与精确纪年明确，可作为独立事件晋级。",
});

export const easternHan145168CanonicalPeople = [
  {
    id: "eh-liu-zan-zhidi",
    name: "刘缵",
    aliases: ["汉质帝", "孝质皇帝", "建平侯"],
    deathYear: 146,
    primaryPolity: "东汉",
    summary: "东汉质帝，冲帝去世后于永憙元年即位。",
  },
  {
    id: "eh-han-zhao-nanyang",
    name: "韩昭",
    deathYear: 145,
    primaryPolity: "东汉",
    summary: "东汉南阳太守，永憙元年因贪赃下狱死。",
  },
  {
    id: "eh-liu-shuo-pingyuan",
    name: "刘硕",
    aliases: ["帝弟硕", "都乡侯硕", "平原王硕"],
    primaryPolity: "东汉",
    summary: "汉桓帝之弟，建和二年受封平原王。",
  },
  {
    id: "eh-chen-jing-changping",
    name: "陈景",
    deathYear: 148,
    primaryPolity: "东汉",
    summary: "长平人，建和二年自号黄帝子并谋举兵，事败伏诛。",
  },
  {
    id: "eh-guan-bo-nandun",
    name: "管伯",
    deathYear: 148,
    primaryPolity: "东汉",
    summary: "南顿人，建和二年自称真人并谋举兵，事败伏诛。",
  },
  {
    id: "eh-liang-na",
    name: "梁妠",
    aliases: ["梁太后", "顺烈皇后"],
    deathYear: 150,
    primaryPolity: "东汉",
    summary: "汉顺帝皇后，冲帝、质帝和桓帝初年临朝称制。",
  },
  {
    id: "eh-mao-kai-yiwu",
    name: "毛恺",
    aliases: ["伊吾司马毛恺"],
    primaryPolity: "东汉",
    summary: "东汉伊吾司马，元嘉元年遣兵救援伊吾屯城。",
  },
  {
    id: "eh-zhan-shan-wuling",
    name: "詹山",
    primaryPolity: "武陵蛮",
    summary: "元嘉元年率武陵蛮众反叛并拘执县令。",
  },
  {
    id: "eh-liu-guang-jinan",
    name: "刘广",
    aliases: ["济南王广"],
    deathYear: 153,
    primaryPolity: "东汉",
    summary: "东汉济南王，永兴元年去世且无子，封国被撤除。",
  },
  {
    id: "eh-li-ying",
    name: "李膺",
    aliases: ["度辽将军李膺"],
    primaryPolity: "东汉",
    summary: "东汉名士与将领，永寿二年鲜卑寇云中后出任度辽将军。",
  },
  {
    id: "eh-zhu-da-jiuzhen",
    name: "朱达",
    primaryPolity: "东汉",
    summary: "居风县人，永寿三年聚众杀县令并进攻九真。",
  },
  {
    id: "eh-er-shi-jiuzhen",
    name: "儿式",
    aliases: ["九真太守儿式"],
    deathYear: 157,
    primaryPolity: "东汉",
    summary: "东汉九真太守，永寿三年讨伐叛众时战死。",
  },
  {
    id: "eh-zhang-huan",
    name: "张奂",
    aliases: ["匈奴中郎将张奂", "中郎将张奂"],
    primaryPolity: "东汉",
    summary: "东汉边将，桓帝时多次参与北边与三辅平乱作战。",
  },
  {
    id: "eh-liu-hua-yangan",
    name: "刘华",
    aliases: ["皇女华", "阳安长公主"],
    primaryPolity: "东汉",
    summary: "汉顺帝之女，延熹元年受封阳安长公主并嫁伏完。",
  },
  {
    id: "eh-fu-wan",
    name: "伏完",
    aliases: ["辅国将军伏完", "不其侯伏完"],
    primaryPolity: "东汉",
    summary: "东汉外戚与辅国将军，尚阳安长公主刘华。",
  },
  {
    id: "eh-zheng-shichou",
    name: "郑石仇",
    aliases: ["石仇"],
    primaryPolity: "东汉",
    summary: "郑众曾孙，延熹二年获封关内侯。",
  },
  {
    id: "eh-shan-chao",
    name: "单超",
    aliases: ["中常侍单超"],
    primaryPolity: "东汉",
    summary: "东汉宦官，参与诛除梁冀后受封列侯。",
  },
  {
    id: "eh-zhou-xie",
    name: "周勰",
    deathYear: 159,
    primaryPolity: "东汉",
    summary: "东汉隐士，延熹二年梁冀被诛后不久去世。",
  },
  {
    id: "eh-duan-jiong",
    name: "段颎",
    aliases: ["护羌校尉段颎"],
    primaryPolity: "东汉",
    summary: "东汉边将，桓帝时长期参与镇压羌乱。",
  },
  {
    id: "eh-deng-mengnu",
    name: "邓猛女",
    aliases: ["邓皇后", "桓帝邓皇后"],
    deathYear: 165,
    primaryPolity: "东汉",
    summary: "汉桓帝皇后，延熹八年被废后死于暴室。",
  },
  {
    id: "eh-antoninus-daqin",
    name: "安敦",
    aliases: ["大秦王安敦"],
    primaryPolity: "大秦",
    summary: "《后汉书》所称大秦王，延熹九年使者由日南入汉贡献。",
  },
  {
    id: "eh-anwei-qiang",
    name: "岸尾",
    primaryPolity: "东羌",
    summary: "永康元年胁迫同种连寇三辅的东羌首领。",
  },
  {
    id: "eh-futai-buyeo",
    name: "夫台",
    aliases: ["王夫台", "夫余王夫台"],
    primaryPolity: "夫余",
    summary: "夫余王，永康元年率军进攻玄菟。",
  },
  {
    id: "eh-gongsun-yu-xuantu",
    name: "公孙域",
    aliases: ["玄菟太守公孙域"],
    primaryPolity: "东汉",
    summary: "东汉玄菟太守，永康元年击破夫余王夫台。",
  },
  {
    id: "eh-cao-jie",
    name: "曹节",
    aliases: ["中常侍曹节"],
    primaryPolity: "东汉",
    summary: "东汉宦官，建宁元年矫诏诛杀窦武、陈蕃等人。",
  },
  {
    id: "eh-dou-wu",
    name: "窦武",
    aliases: ["大将军窦武"],
    deathYear: 168,
    primaryPolity: "东汉",
    summary: "东汉外戚与大将军，建宁元年与宦官集团冲突失败被杀。",
  },
  {
    id: "eh-chen-fan",
    name: "陈蕃",
    aliases: ["太傅陈蕃"],
    deathYear: 168,
    primaryPolity: "东汉",
    summary: "东汉名臣与太傅，建宁元年被曹节矫诏诛杀。",
  },
  {
    id: "eh-yin-xun",
    name: "尹勋",
    aliases: ["尚书令尹勋"],
    deathYear: 168,
    primaryPolity: "东汉",
    summary: "东汉尚书令，建宁元年与窦武、陈蕃同时遇害。",
  },
  {
    id: "eh-liu-yu-shizhong",
    name: "刘瑜",
    aliases: ["侍中刘瑜"],
    deathYear: 168,
    primaryPolity: "东汉",
    summary: "东汉侍中，建宁元年与窦武、陈蕃同时遇害。",
  },
  {
    id: "eh-feng-shu-tunqi",
    name: "冯述",
    aliases: ["屯骑校尉冯述"],
    deathYear: 168,
    primaryPolity: "东汉",
    summary: "东汉屯骑校尉，建宁元年与窦武、陈蕃同时遇害。",
  },
  {
    id: "eh-hede-shule",
    name: "和得",
    aliases: ["疏勒王和得"],
    primaryPolity: "疏勒",
    summary: "疏勒王臣槃的季父，建宁元年射杀臣槃后自立为王。",
  },
];

export const easternHan145168CandidateRepairs = [
  promote("f9f0c91d5d30e2c1b9cd8b3f", "刘缵即位为汉质帝", {
    personBindings: [binding("eh-liu-zan-zhidi", "刘缵", ["刘缵", "缵", "建平侯"])],
  }),
  context("7a2739318ef74c8ce64ce16d"),
  context("556efa736550b002a19b2b95"),
  context("15d2e391e7f101f847e08fe1"),
  promote("ea47829ed5688610f374ba6e", "韩昭因贪赃下狱死", {
    personBindings: [binding("eh-han-zhao-nanyang", "韩昭")],
  }),
  context("e2e62da3571a119e284a3810"),
  context("22a538eb15caae2ff0bebe43"),
  context("d936937c364f077c39396673"),
  context("8d9b6cab784f3d22be120fd5"),
  promote("87018fce8d72359c6584880f", "封刘硕为平原王", {
    personBindings: [binding("eh-liu-shuo-pingyuan", "刘硕", ["刘硕", "硕", "帝弟硕"])],
  }),
  promote("5704c99d7b29a39338279f63", "陈景与管伯图谋举兵", {
    personBindings: [
      binding("eh-chen-jing-changping", "陈景"),
      binding("eh-guan-bo-nandun", "管伯"),
    ],
  }),
  promote("da29390d3c10e7937aa8182f", "封刘硕为平原王", {
    personBindings: [binding("eh-liu-shuo-pingyuan", "刘硕", ["刘硕", "硕", "帝弟硕", "都乡侯硕"])],
    reason: "本条与本纪同年封刘硕为平原王的记载相互印证。",
  }),
  collective("a828b6907a1045cfb0620946", "白马羌寇广汉属国"),
  collective("bb0e8c3ea2c019960cf2e470", "白马羌寇广汉属国", {
    reason: "本条补充益州刺史率板楯蛮击破白马羌的结果，与同簇本纪记载合并。",
  }),
  context("5f989e3e2c21244c0526d016"),
  context("087b6ed48c1f211e1e5e6cd1"),
  promote("d137da3fc3ed045ae6a4ba36", "梁妠去世", {
    personBindings: [binding("eh-liang-na", "梁妠", ["梁妠", "梁太后"])],
    reason: "梁妠长期临朝，其去世具有明确的政局阶段意义。",
  }),
  context("1be427e1a087b0478b298b05"),
  context("0e95ebbe5b7293cc5fc5683e"),
  context("6b5120dfdeee0ef032ab1066"),
  context("3f02fcacbb854ba9b947522c"),
  collective("b70392497b26047b90891333", "北匈奴呼衍王攻伊吾屯城", {
    personBindings: [binding("eh-mao-kai-yiwu", "毛恺")],
  }),
  promote("0c31187bf6e634eb0886b124", "詹山等武陵蛮反叛", {
    personBindings: [binding("eh-zhan-shan-wuling", "詹山")],
  }),
  context("96d15f48d0092441bcd51f5d"),
  context("424d9d13b208370c3501b336"),
  promote("a936b04872976663ba0c47b9", "刘广无后济南国除", {
    personBindings: [binding("eh-liu-guang-jinan", "刘广", ["刘广", "济南王广"])],
  }),
  collective("b87756ee33a3fb1848f3e241", "车师后王反叛并攻屯营"),
  context("72f1a55fedb1f0cb7fb8658a"),
  context("c7e6cda11a4f7f30efd23bed"),
  context("31b590ac33d2bc588bb3fd23"),
  collective("433d7d26926ca154b470fd09", "蜀郡夷反叛并杀掠吏民", {
    matchedEventId: "official-history-event:570e1651346a4060719a",
    reason: "与同年蜀郡夷杀掠吏民条属于同一叛乱，合并为同一正式事件的独立证据。",
  }),
  collective("21596b7714bbd5c1b91a3238", "鲜卑寇云中", {
    matchedEventId: "official-history-event:6f40ce42fe29aa608067",
    reason: "与李膺传鲜卑寇云中条属于同一入寇，合并为同一正式事件的独立证据。",
  }),
  collective("e9244cf9bf4dd0ce65bcfb71", "蜀郡夷反叛并杀掠吏民"),
  collective("2f55c67e342f28ca1d117ba6", "鲜卑寇云中", {
    personBindings: [binding("eh-li-ying", "李膺", ["李膺", "膺"])],
  }),
  context("c77ef50769899aebe8350a41"),
  collective("4bb462fa7a0875715bd955d3", "朱达等攻九真并击杀儿式", {
    matchedEventId: "official-history-event:166bdcc77c12e38f17a5",
    reason: "与朱达等攻九真并导致儿式战死条属于同一事件，合并为同一正式事件的独立证据。",
    personBindings: [binding("eh-er-shi-jiuzhen", "儿式")],
  }),
  collective("f1d9cd50c56502baa7b6db28", "长沙蛮反叛并屯益阳"),
  promote("0b8f11125aea0515d9a92a63", "朱达等攻九真并击杀儿式", {
    personBindings: [
      binding("eh-zhu-da-jiuzhen", "朱达"),
      binding("eh-er-shi-jiuzhen", "儿式"),
    ],
  }),
  collective("a4f949f04f3449d49c9336dd", "张奂击退鲜卑边寇", {
    matchedEventId: "official-history-event:799249dee2f0842c8501",
    reason: "与张奂率南匈奴击退鲜卑条属于同一次边寇，合并为同一正式事件的独立证据。",
  }),
  promote("53140a4a7e958ae5ebc82f0f", "张奂击退鲜卑边寇", {
    personBindings: [binding("eh-zhang-huan", "张奂", ["张奂", "奂"])],
  }),
  promote("6483e989c6accee8de183ca7", "刘华受封阳安长公主并嫁伏完", {
    personBindings: [
      binding("eh-liu-hua-yangan", "刘华", ["刘华", "皇女华", "华"]),
      binding("eh-fu-wan", "伏完"),
    ],
  }),
  context("45c9e6592de45effd831718a", "郑众后裔的例行绍封记录，不单独晋级。", {
    title: "郑石仇受封关内侯",
    personBindings: [binding("eh-zheng-shichou", "郑石仇", ["郑石仇", "石仇"])],
  }),
  context("127e710075fe5e57301c5da8", "前代功臣后裔的例行绍封记录，不单独晋级。"),
  context("a3d84e231274e33fccf7a74c", "前代功臣后裔的例行绍封记录，不单独晋级。"),
  context("e22c6847661912e83c721c2b", "梁冀被诛已有已审核正式事件，本条保留为五侯受封与宦官专权的补充上下文。", {
    title: "梁冀被诛与单超等受封",
    personBindings: [
      binding("eh-liang-ji", "梁冀"),
      binding("eh-shan-chao", "单超"),
    ],
  }),
  context("692a24584e602cd5c57e8161", "周勰传中的卒年记录，保留为人物生平上下文。", {
    title: "周勰去世",
    personBindings: [binding("eh-zhou-xie", "周勰", ["周勰", "勰"])],
  }),
  collective("e257ab6f90dba305bfa4c1e3", "蜀郡三襄夷寇蚕陵"),
  collective("6da63ca92303707e60585c33", "夫余遣使朝贺汉廷"),
  collective("e28d275fcfbf057ff9998035", "零吾等羌寇关中", {
    personBindings: [binding("eh-duan-jiong", "段颎", ["段颎", "颎"])],
  }),
  collective("b847709e347fa675d19641ea", "长沙与零陵蛮反叛"),
  promote("0de50f42970b1622bd6448f6", "邓猛女被废黜皇后位", {
    personBindings: [binding("eh-deng-mengnu", "邓猛女", ["邓猛女", "邓皇后"])],
  }),
  promote("627ce508bafc9e7978656b9c", "张奂击退乌桓鲜卑与南匈奴边寇", {
    personBindings: [binding("eh-zhang-huan", "张奂")],
  }),
  promote("e2b61afe77f052831e8dab6c", "大秦王安敦遣使来汉", {
    personBindings: [binding("eh-antoninus-daqin", "安敦", ["安敦", "大秦王安敦"])],
  }),
  promote("8a0bc316fb9aa8ba60cb53c1", "张奂平定三辅先零羌入寇", {
    matchedEventId: "official-history-event:929ff1aae5ee20dd435d",
    personBindings: [binding("eh-zhang-huan", "张奂")],
  }),
  collective("0f92735ae0264d3ea77fd8d3", "夏季先零羌再寇三辅"),
  promote("b9348329d43acd1620700872", "刘志废除党锢", {
    personBindings: [binding("eh-liu-zhi", "刘志", ["刘志", "桓帝"])],
    reason: "本条虽同时记大赦与改元，但明确记载解除党锢，具有独立政治事件意义。",
  }),
  context("ba66175815dac0f05dc168b2"),
  promote("dcb8fa34f87c191ab0c5e3ad", "张奂于三辅击破岸尾等羌军", {
    matchedEventId: "official-history-event:e8d91e7b113af019c374",
    personBindings: [binding("eh-zhang-huan", "张奂")],
  }),
  promote("0471841b31f7135a1b20ac8a", "张奂于三辅击破岸尾等羌军", {
    matchedEventId: "official-history-event:e8d91e7b113af019c374",
    reason: "与冬季张奂击破先零羌条属于同一轮战事，合并为同一正式事件的独立证据。",
    personBindings: [
      binding("eh-anwei-qiang", "岸尾"),
      binding("eh-zhang-huan", "张奂"),
    ],
  }),
  collective("9818334bcaa68b7129dbb621", "张奂平定三辅先零羌入寇", {
    matchedEventId: "official-history-event:929ff1aae5ee20dd435d",
    reason: "与春季张奂平定先零羌条属于同一轮入寇，合并为同一正式事件的独立证据。",
  }),
  promote("90176e46d12d19b129022398", "段颎击破当煎羌于鸾鸟", {
    personBindings: [binding("eh-duan-jiong", "段颎", ["段颎", "颎"])],
  }),
  promote("0bb976befb559bf0abc62aed", "公孙域击破夫台于玄菟", {
    personBindings: [
      binding("eh-futai-buyeo", "夫台", ["夫台", "王夫台"]),
      binding("eh-gongsun-yu-xuantu", "公孙域"),
    ],
  }),
  promote("4e870d79ea79e1ff036d8fab", "曹节矫诏诛杀窦武与陈蕃", {
    personBindings: [
      binding("eh-cao-jie", "曹节"),
      binding("eh-dou-wu", "窦武"),
      binding("eh-chen-fan", "陈蕃"),
      binding("eh-yin-xun", "尹勋"),
      binding("eh-liu-yu-shizhong", "刘瑜"),
      binding("eh-feng-shu-tunqi", "冯述"),
    ],
  }),
  promote("11662ba352ce43a7b5e0b6d3", "和得在疏勒射杀臣槃并自立为王", {
    personBindings: [
      binding("eh-chen-pan-shule", "臣槃", ["臣槃", "汉大都尉"]),
      binding("eh-hede-shule", "和得"),
    ],
    reason: "传记上文明确汉大都尉为疏勒王臣槃；“于猎中”是遇害场景，不是人物名。",
  }),
  context("3b0fc66f7dfbec9445ab59b2", "与曹节矫诏诛杀窦武、陈蕃条重复，短记保留为旁证上下文。", {
    title: "陈蕃与窦武遇害",
    personBindings: [
      binding("eh-chen-fan", "陈蕃"),
      binding("eh-dou-wu", "窦武"),
    ],
  }),  promote("68d182549c06d37871ce505c", "汉冲帝崩于玉堂前殿"),
  context("4b65fb5e228d9e37af0ccee6"),
  promote("7e7be5417017a5eacf060c01", "刘宏即位为汉灵帝"),
  promote("50433fabdf331c50e37fa695", "汉桓帝崩于德阳前殿"),
  collective("72cf71f0c011ef510a44c269", "劳丙与叔孙无忌攻掠琅邪"),
  promote("03ac9a21fb31f09378e2916e", "刘缵即位为汉质帝"),
  context("52c7f4e580603a0cf4e8b62f"),
  collective("a21642099d7ce33ff4ba8f4a", "长沙蛮反叛屯益阳"),
  context("7712cc40c888a6c3d370fed9"),
  context("29452a33a30fe90c1b0d42bf"),
  collective("5cca5f842a5eff620918ce2d", "鲜卑与濊貊寇幽并二州"),
  context("8a1ba1b25d98024c8d1b2ee2"),
  promote("bd84d8a4cde0bbcd71ee4361", "段颎追击当煎诸种于鸾鸟"),
  collective("77e73a7d2b1de570bfcd1696", "鲜卑寇代郡"),
  context("58fb6a21c5ce83584651ef12"),
  context("6f74a904d519c2f456d3945f"),
  promote("2552fb995e902a6e2891f254", "滕抚击破广陵贼张婴"),
  context("0e33f51c3ba725adca7193b4"),
  context("13238709654d5138aa10e768"),
  promote("f52eebf4f5f56b0fb19c4f6f", "梁冀鸩弑汉质帝"),
  collective("d17a73669cf1629aed76c9a7", "武陵蛮叛乱"),
  collective("40dec70a17374bf147031ac8", "鲜卑寇云中"),
  context("760b72ae3560510492a07141"),
  collective("f4688a7a1cdcbdeacebf31df", "九真蛮夷叛乱并杀太守儿式"),
  context("79b5c20112ad4598cc150eb4"),
  context("d6e43c028a6f45f64448773b"),
  collective("2dd86cc19a435126136eae62", "夫余王遣使来献"),
  collective("2f28cdb147c8f32e27a37a8b", "沈氐羌寇张掖酒泉"),
  context("748988872c94121ee8726984"),
  context("21a2dbba82a54da734ffaff2"),
  promote("1de471e46b6fb2aab6c0a04d", "冯绲大破武陵叛蛮"),
  context("ea8aefa1a8ad89dd09557bed"),
  collective("43db8dcc0512ff56ba59dd8f", "鲜卑寇辽东属国"),
  context("b8617219f3edee4c20ff27cf"),
  context("d5ef2489c80aee0fd6dc0b71"),
  promote("4c08551477b98ca6b812a881", "邓皇后被废"),
  context("f0f7466e48719264d634c0b6"),
  promote("0ec320d597c4b6d7effbf34a", "段颎大破当煎羌于湟中"),
  promote("1253327ac519538aaeb0e71e", "窦贵人立为皇后"),
  collective("abc311fc5ab1ea45d7e3c334", "南匈奴乌桓鲜卑寇缘边九郡"),
  collective("9930bfe286bb6e731bf4b3b9", "沈氐羌寇武威张掖"),
  collective("eff0b0d5f902de48041cd7a0", "先零羌寇三辅"),
  promote("26b6f7f5c8939c43f2ff05ae", "汉桓帝崩于德阳前殿"),
];

export const officialHistoryCandidateRepairConfig = {
  coverageMode: "partial",
  decisionRebinding: { strategy: "legacy-source-mention" },
  profileId: easternHan145168ProfileId,
  batchId: easternHan145168BatchId,
  periodId: easternHan145168PeriodId,
  generator: easternHan145168Generator,
  canonicalPeople: easternHan145168CanonicalPeople,
  decisions: easternHan145168CandidateRepairs,
  batchNotes: "Adjudicated all Eastern Han 145-168 candidates with stable secondary people, explicit places, and event-level promotion decisions.",
};

export default officialHistoryCandidateRepairConfig;
