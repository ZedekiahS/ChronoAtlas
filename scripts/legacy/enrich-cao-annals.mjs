import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function upsertById(items, item) {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    items[index] = { ...items[index], ...item };
    return "updated";
  }

  items.push(item);
  return "added";
}

function sourceRef(sourceId, locator, quote, note) {
  const ref = { sourceId, locator };
  if (quote) {
    ref.quote = quote;
  }
  if (note) {
    ref.note = note;
  }
  return ref;
}

const mentions = [
  {
    id: "mention-sgz-wei-wudi-cao-cao-xiaolian",
    sourceId: "sanguozhi-wei-wudi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "武帝纪",
    locator: "年二十",
    year: 174,
    text: "年二十，举孝廉为郎，除洛阳北部尉，迁顿丘令。",
    translation: null,
    mentionedPersonIds: ["cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang", "dunqiu"],
    tags: ["仕宦起点", "洛阳北部尉"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wudi-cao-cao-yellow-turban",
    sourceId: "sanguozhi-wei-wudi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "武帝纪",
    locator: "光和末",
    year: 184,
    text: "光和末，黄巾起。拜骑都尉，讨颍川贼。迁为济南相。",
    translation: null,
    mentionedPersonIds: ["cao-cao"],
    mentionedEventIds: ["china-184-yellow-turban-rebellion"],
    mentionedPlaceIds: ["yingchuan", "jinan"],
    tags: ["黄巾", "骑都尉", "济南相"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wudi-cao-cao-dong-zhuo-east",
    sourceId: "sanguozhi-wei-wudi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "武帝纪",
    locator: "中平六年",
    year: 189,
    text: "卓表太祖为骁骑校尉，欲与计事。太祖乃变易姓名，间行东归。",
    translation: null,
    mentionedPersonIds: ["cao-cao", "dong-zhuo"],
    mentionedEventIds: ["china-189-dong-zhuo-enters-luoyang"],
    mentionedPlaceIds: ["luoyang"],
    tags: ["董卓", "东归", "起兵前夜"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wudi-cao-cao-yanzhou-qingzhou",
    sourceId: "sanguozhi-wei-wudi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "武帝纪",
    locator: "初平三年",
    year: 192,
    text: "信乃与州吏万潜等至东郡迎太祖领兖州牧。冬，受降卒三十馀万，男女百馀万口，收其精锐者，号为青州兵。",
    translation: null,
    mentionedPersonIds: ["cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["yan-zhou", "dong-commandery", "qing-zhou"],
    tags: ["兖州牧", "青州兵", "根据地"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wudi-cao-cao-wan-defeat",
    sourceId: "sanguozhi-wei-wudi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "武帝纪",
    locator: "建安二年",
    year: 197,
    text: "二年春正月，公到宛。张绣降，旣而悔之，复反。公与战，军败，为流矢所中，长子昂、弟子安民遇害。",
    translation: null,
    mentionedPersonIds: ["cao-cao", "zhang-xiu", "cao-ang"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["wan"],
    tags: ["宛城", "张绣", "曹昂"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wudi-cao-cao-white-wolf",
    sourceId: "sanguozhi-wei-wudi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "武帝纪",
    locator: "建安十二年八月",
    year: 207,
    text: "八月，登白狼山，卒与虏遇，衆甚盛。公登高，望虏陈不整，乃纵兵击之，使张辽为先锋，虏衆大崩。",
    translation: null,
    mentionedPersonIds: ["cao-cao", "zhang-liao"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["white-wolf-mountain", "liucheng"],
    tags: ["乌桓", "白狼山", "河北收束"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wudi-cao-cao-tongguan",
    sourceId: "sanguozhi-wei-wudi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "武帝纪",
    locator: "建安十六年",
    year: 211,
    text: "超等屯潼关，公勑诸将：“关西兵精悍，坚壁勿与战。”秋七月，公西征。",
    translation: null,
    mentionedPersonIds: ["cao-cao", "ma-chao"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["tongguan", "guanzhong"],
    tags: ["潼关", "马超", "关中"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-heir",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "建安二十二年",
    year: 217,
    text: "建安十六年，为五官中郎将、副丞相。二十二年，立为魏太子。",
    translation: null,
    mentionedPersonIds: ["cao-pi", "cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["继承", "魏太子", "五官中郎将"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-birth",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "文帝纪开篇",
    year: 187,
    text: "文皇帝讳丕，字子桓，武帝太子也。中平四年冬，生于谯。",
    translation: null,
    mentionedPersonIds: ["cao-pi"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["qiao"],
    tags: ["出生", "名讳", "籍贯"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-succeeds",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "建安二十五年",
    year: 220,
    text: "太祖崩，嗣位为丞相、魏王。",
    translation: null,
    mentionedPersonIds: ["cao-pi", "cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["继位", "魏王", "丞相"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-abdication",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "黄初元年",
    year: 220,
    text: "乃为坛于繁阳。庚午，王升坛即阼，百官陪位。事讫，降坛，视燎成礼而反。改延康为黄初，大赦。",
    translation: null,
    mentionedPersonIds: ["cao-pi", "han-xiandi"],
    mentionedEventIds: ["china-220-cao-pi-founds-wei"],
    mentionedPlaceIds: ["fanyang"],
    tags: ["受禅", "黄初", "曹魏建立"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-sun-quan",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "黄初二年八月",
    year: 221,
    text: "秋八月，孙权遣使奉章，并遣于禁等还。丁巳，使太常邢贞持节拜权为大将军，封吴王，加九锡。",
    translation: null,
    mentionedPersonIds: ["cao-pi", "sun-quan", "yu-jin"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["孙权", "吴王", "魏吴关系"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-south-campaign",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "黄初三年",
    year: 222,
    text: "六月辛亥，治兵于东郊。庚午，遂南征。",
    translation: null,
    mentionedPersonIds: ["cao-pi"],
    mentionedEventIds: ["china-222-yiling"],
    mentionedPlaceIds: ["xuchang"],
    tags: ["南征", "魏吴战争", "夷陵后局势"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-guangling",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "黄初六年",
    year: 225,
    text: "冬十月，行幸广陵故城，临江观兵，戎卒十馀万，旌旗数百里。",
    translation: null,
    mentionedPersonIds: ["cao-pi"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["guangling", "yangtze"],
    tags: ["广陵", "观兵", "魏吴前线"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-wendi-cao-pi-death",
    sourceId: "sanguozhi-wei-wendi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "文帝纪",
    locator: "黄初七年五月",
    year: 226,
    text: "夏五月丙辰，帝疾笃，召中军大将军曹真、镇军大将军陈羣、征东大将军曹休、抚军大将军司马宣王，并受遗诏辅嗣主。丁巳，帝崩于嘉福殿，时年四十。",
    translation: null,
    mentionedPersonIds: ["cao-pi", "cao-zhen", "chen-qun", "cao-xiu", "sima-yi", "cao-rui"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["死亡", "辅政", "曹叡即位"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-mingdi-cao-rui-origin",
    sourceId: "sanguozhi-wei-mingdi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "明帝纪",
    locator: "明帝纪开篇",
    year: 204,
    text: "明皇帝讳睿，字元仲，文帝太子也。生而太祖爱之，常令在左右。",
    translation: null,
    mentionedPersonIds: ["cao-rui", "cao-pi", "cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["出生", "名讳", "曹魏皇室"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-mingdi-cao-rui-enfeoffment",
    sourceId: "sanguozhi-wei-mingdi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "明帝纪",
    locator: "黄初年间",
    year: 220,
    text: "年十五，封武德侯，黄初二年为齐公，三年为平原王。以其母诛，故未建为嗣。",
    translation: null,
    mentionedPersonIds: ["cao-rui", "empress-zhen"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["封爵", "继承", "甄后"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-mingdi-cao-rui-accession",
    sourceId: "sanguozhi-wei-mingdi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "明帝纪",
    locator: "黄初七年五月",
    year: 226,
    text: "七年夏五月，帝病笃，乃立为皇太子。丁巳，即皇帝位，大赦。",
    translation: null,
    mentionedPersonIds: ["cao-rui", "cao-pi"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["即位", "皇太子", "大赦"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-mingdi-cao-rui-zhuge-228",
    sourceId: "sanguozhi-wei-mingdi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "明帝纪",
    locator: "太和二年",
    year: 228,
    text: "蜀大将诸葛亮寇边，天水、南安、安定三郡吏民叛应亮。",
    translation: null,
    mentionedPersonIds: ["cao-rui", "zhuge-liang", "zhang-he", "cao-zhen"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["tianshui", "nan-an", "anding"],
    tags: ["诸葛亮北伐", "关陇", "街亭"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-mingdi-cao-rui-wuzhang",
    sourceId: "sanguozhi-wei-mingdi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "明帝纪",
    locator: "青龙二年",
    year: 234,
    text: "是月，诸葛亮出斜谷，屯渭南，司马宣王率诸军拒之。会亮卒，其军退还。",
    translation: null,
    mentionedPersonIds: ["cao-rui", "zhuge-liang", "sima-yi"],
    mentionedEventIds: ["china-234-wuzhang-plains"],
    mentionedPlaceIds: ["xiegu", "weinan", "wuzhang-plains"],
    tags: ["五丈原", "诸葛亮卒", "司马懿"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-mingdi-cao-rui-liaodong",
    sourceId: "sanguozhi-wei-mingdi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "明帝纪",
    locator: "景初二年",
    year: 238,
    text: "丙寅，司马宣王围公孙渊于襄平，大破之，传渊首于京都，海东诸郡平。",
    translation: null,
    mentionedPersonIds: ["cao-rui", "sima-yi"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["xiangping", "liaodong"],
    tags: ["辽东", "公孙渊", "司马懿"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-mingdi-cao-rui-death",
    sourceId: "sanguozhi-wei-mingdi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "明帝纪",
    locator: "景初三年正月",
    year: 239,
    text: "即日，帝崩于嘉福殿，魏书曰：殡于九龙前殿。时年三十六。",
    translation: null,
    mentionedPersonIds: ["cao-rui", "cao-fang", "cao-shuang", "sima-yi"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["死亡", "曹芳", "辅政"],
    confidence: "high",
    reviewStatus: "reviewed"
  }
];

const lifeEvents = [
  {
    id: "cao-cao-174-xiaolian",
    personId: "cao-cao",
    year: 174,
    displayYear: "约174",
    type: "office",
    title: "举孝廉，任洛阳北部尉",
    summary: "曹操二十岁左右举孝廉入仕，历任郎、洛阳北部尉、顿丘令，进入东汉官僚体系。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wudi-cao-cao-xiaolian"],
    confidence: "medium",
    sourceRefs: [sourceRef("sanguozhi-wei-wudi", "年二十", "年二十，举孝廉为郎，除洛阳北部尉，迁顿丘令。")]
  },
  {
    id: "cao-cao-184-yellow-turban",
    personId: "cao-cao",
    year: 184,
    displayYear: "184",
    type: "campaign",
    title: "讨黄巾，转任济南相",
    summary: "黄巾起义爆发后，曹操以骑都尉讨颍川黄巾，随后出任济南相，开始积累地方治理声望。",
    relatedEventIds: ["china-184-yellow-turban-rebellion"],
    sourceMentionIds: ["mention-sgz-wei-wudi-cao-cao-yellow-turban"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-wudi", "光和末", "光和末，黄巾起。拜骑都尉，讨颍川贼。迁为济南相。")]
  },
  {
    id: "cao-cao-189-dong-zhuo-east",
    personId: "cao-cao",
    year: 189,
    displayYear: "189",
    type: "politics",
    title: "拒董卓任命，变姓名东归",
    summary: "董卓控制洛阳后表曹操为骁骑校尉，曹操没有接受，而是改名潜行东归，为之后起兵讨董铺垫。",
    relatedEventIds: ["china-189-dong-zhuo-enters-luoyang"],
    sourceMentionIds: ["mention-sgz-wei-wudi-cao-cao-dong-zhuo-east"],
    confidence: "high",
    sourceRefs: [
      sourceRef("sanguozhi-wei-wudi", "中平六年", "卓表太祖为骁骑校尉，欲与计事。太祖乃变易姓名，间行东归。")
    ]
  },
  {
    id: "cao-cao-192-yanzhou-qingzhou",
    personId: "cao-cao",
    year: 192,
    displayYear: "192",
    type: "turning-point",
    title: "领兖州牧，收青州兵",
    summary: "刘岱死后，鲍信等迎曹操领兖州牧；同年收降青州黄巾，形成后来曹操军力中的重要兵源。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wudi-cao-cao-yanzhou-qingzhou"],
    confidence: "high",
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-wudi",
        "初平三年",
        "信乃与州吏万潜等至东郡迎太祖领兖州牧。冬，受降卒三十馀万，男女百馀万口，收其精锐者，号为青州兵。"
      )
    ]
  },
  {
    id: "cao-cao-197-wan-defeat",
    personId: "cao-cao",
    year: 197,
    displayYear: "197",
    type: "campaign",
    title: "宛城败于张绣",
    summary: "张绣先降后叛，曹操在宛城失利，长子曹昂与侄曹安民遇害，是曹操早期扩张中的重大挫折。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wudi-cao-cao-wan-defeat"],
    confidence: "high",
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-wudi",
        "建安二年",
        "二年春正月，公到宛。张绣降，旣而悔之，复反。公与战，军败，为流矢所中，长子昂、弟子安民遇害。"
      )
    ]
  },
  {
    id: "cao-cao-207-white-wolf",
    personId: "cao-cao",
    year: 207,
    displayYear: "207",
    type: "campaign",
    title: "白狼山破乌桓",
    summary: "曹操北征乌桓，出卢龙塞，白狼山遇敌后以张辽为先锋击破蹋顿，袁氏余部北方依托被切断。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wudi-cao-cao-white-wolf"],
    confidence: "high",
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-wudi",
        "建安十二年八月",
        "八月，登白狼山，卒与虏遇，衆甚盛。公登高，望虏陈不整，乃纵兵击之，使张辽为先锋，虏衆大崩。"
      )
    ]
  },
  {
    id: "cao-cao-211-tongguan",
    personId: "cao-cao",
    year: 211,
    displayYear: "211",
    type: "campaign",
    title: "潼关西征马超韩遂",
    summary: "关中诸将疑惧反叛后，曹操西征马超、韩遂等，先令诸将坚壁不战，再渡河展开关中战事。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wudi-cao-cao-tongguan"],
    confidence: "high",
    sourceRefs: [
      sourceRef("sanguozhi-wei-wudi", "建安十六年", "超等屯潼关，公勑诸将：“关西兵精悍，坚壁勿与战。”秋七月，公西征。")
    ]
  },
  {
    id: "cao-cao-217-cao-pi-heir",
    personId: "cao-cao",
    year: 217,
    displayYear: "217",
    type: "politics",
    title: "立曹丕为魏太子",
    summary: "曹操晚年确立曹丕为魏太子，完成魏王集团继承次序安排。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wendi-cao-pi-heir"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-wendi", "建安二十二年", "建安十六年，为五官中郎将、副丞相。二十二年，立为魏太子。")]
  },
  {
    id: "cao-pi-211-wuguan",
    personId: "cao-pi",
    year: 211,
    displayYear: "211",
    type: "office",
    title: "任五官中郎将、副丞相",
    summary: "曹丕在建安十六年任五官中郎将、副丞相，开始进入曹操集团最高层的制度化继承序列。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wendi-cao-pi-heir"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-wendi", "建安十六年", "建安十六年，为五官中郎将、副丞相。")]
  },
  {
    id: "cao-pi-217-heir",
    personId: "cao-pi",
    year: 217,
    displayYear: "217",
    type: "politics",
    title: "立为魏太子",
    summary: "曹丕被立为魏太子，正式压过曹植等竞争者，成为曹操政治遗产的继承人。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wendi-cao-pi-heir"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-wendi", "建安二十二年", "二十二年，立为魏太子。")]
  },
  {
    id: "cao-pi-220-succeeds-wei-king",
    personId: "cao-pi",
    year: 220,
    displayYear: "220",
    type: "politics",
    title: "嗣位丞相、魏王",
    summary: "曹操去世后，曹丕继承丞相与魏王地位，先接掌魏王国与汉末朝政，再推进受禅。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wendi-cao-pi-succeeds"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-wendi", "建安二十五年", "太祖崩，嗣位为丞相、魏王。")]
  },
  {
    id: "cao-pi-221-sun-quan-vassal",
    personId: "cao-pi",
    year: 221,
    displayYear: "221",
    type: "diplomacy",
    title: "册封孙权为吴王",
    summary: "孙权向魏遣使奉章并归还于禁等，曹丕册拜孙权为大将军、吴王，魏吴关系短暂转入名义臣属状态。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wendi-cao-pi-sun-quan"],
    confidence: "high",
    sourceRefs: [
      sourceRef("sanguozhi-wei-wendi", "黄初二年八月", "秋八月，孙权遣使奉章，并遣于禁等还。丁巳，使太常邢贞持节拜权为大将军，封吴王，加九锡。")
    ]
  },
  {
    id: "cao-pi-222-south-campaign",
    personId: "cao-pi",
    year: 222,
    displayYear: "222",
    type: "campaign",
    title: "治兵南征",
    summary: "夷陵战后魏吴关系重新紧张，曹丕在东郊治兵后南征，试图利用吴蜀战后格局压迫孙吴。",
    relatedEventIds: ["china-222-yiling"],
    sourceMentionIds: ["mention-sgz-wei-wendi-cao-pi-south-campaign"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-wendi", "黄初三年", "六月辛亥，治兵于东郊。庚午，遂南征。")]
  },
  {
    id: "cao-pi-225-guangling",
    personId: "cao-pi",
    year: 225,
    displayYear: "225",
    type: "campaign",
    title: "广陵临江观兵",
    summary: "曹丕东巡至广陵故城，临江陈兵十余万，展示对孙吴方向的军事压力。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-wendi-cao-pi-guangling"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-wendi", "黄初六年", "冬十月，行幸广陵故城，临江观兵，戎卒十馀万，旌旗数百里。")]
  },
  {
    id: "cao-rui-204-born",
    personId: "cao-rui",
    year: 204,
    displayYear: "204",
    type: "birth",
    title: "曹叡出生",
    summary: "曹叡为曹丕之子，字元仲；《明帝纪》称其幼年受曹操喜爱，常在左右。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-mingdi-cao-rui-origin"],
    confidence: "medium",
    sourceRefs: [sourceRef("sanguozhi-wei-mingdi", "明帝纪开篇", "明皇帝讳睿，字元仲，文帝太子也。生而太祖爱之，常令在左右。")]
  },
  {
    id: "cao-rui-220-enfeoffment",
    personId: "cao-rui",
    year: 220,
    endYear: 222,
    displayYear: "220-222",
    type: "office",
    title: "封武德侯、齐公、平原王",
    summary: "曹叡黄初年间先封武德侯，后为齐公、平原王；因甄后之事，起初未被立即确定为继嗣。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-mingdi-cao-rui-enfeoffment"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-mingdi", "黄初年间", "年十五，封武德侯，黄初二年为齐公，三年为平原王。以其母诛，故未建为嗣。")]
  },
  {
    id: "cao-rui-226-accession",
    personId: "cao-rui",
    year: 226,
    displayYear: "226",
    type: "politics",
    title: "立为皇太子并即位",
    summary: "曹丕病重时立曹叡为皇太子；同日曹叡即皇帝位，曹魏进入明帝时期。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-mingdi-cao-rui-accession"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-mingdi", "黄初七年五月", "七年夏五月，帝病笃，乃立为皇太子。丁巳，即皇帝位，大赦。")]
  },
  {
    id: "cao-rui-228-zhuge-liang-first-northern-expedition",
    personId: "cao-rui",
    year: 228,
    displayYear: "228",
    type: "campaign",
    title: "应对诸葛亮第一次北伐",
    summary: "诸葛亮攻边，天水、南安、安定响应；曹叡调度曹真、张郃等关右兵力应对，魏蜀战争进入明帝时期主轴。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-mingdi-cao-rui-zhuge-228"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-mingdi", "太和二年", "蜀大将诸葛亮寇边，天水、南安、安定三郡吏民叛应亮。")]
  },
  {
    id: "cao-rui-234-wuzhang",
    personId: "cao-rui",
    year: 234,
    displayYear: "234",
    type: "campaign",
    title: "五丈原相持，诸葛亮卒",
    summary: "诸葛亮出斜谷屯渭南，司马懿率魏军拒守；诸葛亮去世后蜀军撤退，曹魏西线压力暂缓。",
    relatedEventIds: ["china-234-wuzhang-plains"],
    sourceMentionIds: ["mention-sgz-wei-mingdi-cao-rui-wuzhang"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-mingdi", "青龙二年", "是月，诸葛亮出斜谷，屯渭南，司马宣王率诸军拒之。会亮卒，其军退还。")]
  },
  {
    id: "cao-rui-238-liaodong",
    personId: "cao-rui",
    year: 238,
    displayYear: "238",
    type: "campaign",
    title: "遣司马懿平辽东",
    summary: "曹叡决意以大兵讨公孙渊，司马懿围襄平并斩送公孙渊首级，辽东公孙氏政权灭亡。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-mingdi-cao-rui-liaodong"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-mingdi", "景初二年", "丙寅，司马宣王围公孙渊于襄平，大破之，传渊首于京都，海东诸郡平。")]
  },
  {
    id: "cao-rui-239-death",
    personId: "cao-rui",
    year: 239,
    displayYear: "239",
    type: "death",
    title: "魏明帝去世",
    summary: "曹叡临终托付曹芳、曹爽、司马懿等，随后崩于嘉福殿，曹魏进入少帝与辅政格局。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-mingdi-cao-rui-death"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-mingdi", "景初三年正月", "即日，帝崩于嘉福殿，魏书曰：殡于九龙前殿。时年三十六。")]
  }
];

const sourceMentions = readJson("data/china-source-mentions.json");
const personLifeEvents = readJson("data/china-person-life-events.json");
const persons = readJson("data/china-persons.json");
const coveragePlan = readJson("data/cao-wei-person-coverage-plan.json");

const mentionStats = { added: 0, updated: 0 };
for (const mention of mentions) {
  mentionStats[upsertById(sourceMentions, mention)] += 1;
}

const removedSeedIndex = personLifeEvents.findIndex((event) => event.id === "cao-rui-wei-shu-source-seed");
if (removedSeedIndex >= 0) {
  personLifeEvents.splice(removedSeedIndex, 1);
}

const lifeEventStats = { added: 0, updated: 0 };
for (const lifeEvent of lifeEvents) {
  lifeEventStats[upsertById(personLifeEvents, lifeEvent)] += 1;
}

const existingCaoPiBirth = personLifeEvents.find((event) => event.id === "cao-pi-187-born");
if (existingCaoPiBirth) {
  existingCaoPiBirth.sourceMentionIds = ["mention-sgz-wei-wendi-cao-pi-birth"];
  existingCaoPiBirth.sourceRefs = [
    sourceRef("sanguozhi-wei-wendi", "文帝纪开篇", "文皇帝讳丕，字子桓，武帝太子也。中平四年冬，生于谯。")
  ];
}

const existingCaoPiFounding = personLifeEvents.find((event) => event.id === "cao-pi-220-founds-wei");
if (existingCaoPiFounding) {
  existingCaoPiFounding.sourceMentionIds = ["mention-sgz-wei-wendi-cao-pi-abdication"];
  existingCaoPiFounding.sourceRefs = [
    sourceRef(
      "sanguozhi-wei-wendi",
      "黄初元年",
      "乃为坛于繁阳。庚午，王升坛即阼，百官陪位。事讫，降坛，视燎成礼而反。改延康为黄初，大赦。"
    ),
    sourceRef("houhanshu-xiandi", "延康元年")
  ];
}

const existingCaoPiDeath = personLifeEvents.find((event) => event.id === "cao-pi-226-death");
if (existingCaoPiDeath) {
  existingCaoPiDeath.sourceMentionIds = ["mention-sgz-wei-wendi-cao-pi-death"];
  existingCaoPiDeath.sourceRefs = [
    sourceRef(
      "sanguozhi-wei-wendi",
      "黄初七年五月",
      "夏五月丙辰，帝疾笃，召中军大将军曹真、镇军大将军陈羣、征东大将军曹休、抚军大将军司马宣王，并受遗诏辅嗣主。丁巳，帝崩于嘉福殿，时年四十。"
    )
  ];
}

const caoRui = persons.find((person) => person.id === "cao-rui");
if (caoRui) {
  caoRui.coverageStatus = "partial";
  caoRui.summary =
    "曹丕之子，魏明帝。226 年即位，统治期间应对诸葛亮北伐、孙吴压力和辽东公孙渊问题，239 年去世后曹芳继位。";
  caoRui.roles = ["皇帝", "魏明帝", "曹魏第二代皇帝"];
}

coveragePlan.updatedAt = "2026-06-22";
coveragePlan.phases = coveragePlan.phases.map((phase) =>
  phase.id === "wei-biography-detail-pass"
    ? {
        ...phase,
        status: "in-progress",
        note: "已完成曹操、曹丕、曹叡三代本纪第一轮年谱与原文摘录；下一步继续逐段补关系和资治通鉴互校。"
      }
    : phase
);

const batch = {
  id: "wei-ruler-annals-pass-1",
  title: "曹操、曹丕、曹叡本纪年谱第一轮",
  status: "done",
  personIds: ["cao-cao", "cao-pi", "cao-rui"],
  note: "补充三代本纪关键生平节点与《三国志·魏书》原文摘录；曹叡从 stub 升为 partial。"
};
const existingBatchIndex = coveragePlan.currentBatches.findIndex((item) => item.id === batch.id);
if (existingBatchIndex >= 0) {
  coveragePlan.currentBatches[existingBatchIndex] = batch;
} else {
  coveragePlan.currentBatches.push(batch);
}

coveragePlan.rulerAnnalsPass1 = {
  updatedAt: "2026-06-22",
  sourceIds: ["sanguozhi-wei-wudi", "sanguozhi-wei-wendi", "sanguozhi-wei-mingdi"],
  sourceMentionIds: mentions.map((mention) => mention.id),
  lifeEventIds: lifeEvents.map((event) => event.id),
  limitation: "本轮选择本纪关键节点，不等于曹操、曹丕、曹叡完整逐年精读；未涉及的年份后续继续从本纪、裴注和资治通鉴补齐。"
};

writeJson("data/china-source-mentions.json", sourceMentions);
writeJson("data/china-person-life-events.json", personLifeEvents);
writeJson("data/china-persons.json", persons);
writeJson("data/cao-wei-person-coverage-plan.json", coveragePlan);

console.log(
  JSON.stringify(
    {
      sourceMentions: mentionStats,
      lifeEvents: lifeEventStats,
      removedCaoRuiSeed: removedSeedIndex >= 0,
      caoRuiCoverageStatus: caoRui?.coverageStatus
    },
    null,
    2
  )
);
