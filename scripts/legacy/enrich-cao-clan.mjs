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
    id: "mention-sgz-wei-cao-zhang-early",
    sourceId: "sanguozhi-wei-cao-zhang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "任城威王彰传",
    locator: "本传开篇",
    year: null,
    text: "任城威王彰，字子文。少善射御，膂力过人，手格猛兽，不避险阻。",
    translation: null,
    mentionedPersonIds: ["cao-zhang"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["宗室", "武勇", "性格"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-zhang-daijun",
    sourceId: "sanguozhi-wei-cao-zhang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "任城威王彰传",
    locator: "建安二十三年",
    year: 218,
    text: "二十三年，代郡乌丸反，以彰为北中郎将，行骁骑将军。",
    translation: null,
    mentionedPersonIds: ["cao-zhang", "cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["dai-commandery", "you-zhou"],
    tags: ["代郡", "乌丸", "北中郎将"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-zhang-death",
    sourceId: "sanguozhi-wei-cao-zhang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "任城威王彰传",
    locator: "黄初四年",
    year: 223,
    text: "三年，立为任城王。四年，朝京都，疾薨于邸，谥曰威。",
    translation: null,
    mentionedPersonIds: ["cao-zhang", "cao-pi"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["任城王", "死亡", "谥号"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-zhi-talent",
    sourceId: "sanguozhi-wei-cao-zhi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "陈思王植传",
    locator: "本传开篇",
    year: null,
    text: "陈思王植字子建。年十岁馀，诵读诗、论及辞赋数十万言，善属文。",
    translation: null,
    mentionedPersonIds: ["cao-zhi"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["文学", "天才", "建安文学"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-zhi-copper-terrace",
    sourceId: "sanguozhi-wei-cao-zhi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "陈思王植传",
    locator: "邺铜雀台",
    year: 210,
    text: "时邺铜爵台新城，太祖悉将诸子登台，使各为赋。植援笔立成，可观，太祖甚异之。",
    translation: null,
    mentionedPersonIds: ["cao-zhi", "cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["ye"],
    tags: ["铜雀台", "赋", "曹操赏识"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-zhi-succession",
    sourceId: "sanguozhi-wei-cao-zhi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "陈思王植传",
    locator: "建安二十二年前后",
    year: 217,
    text: "植旣以才见异，而丁仪、丁廙、杨修等为之羽翼。太祖狐疑，几为太子者数矣。而植任性而行，不自雕励，饮酒不节。",
    translation: null,
    mentionedPersonIds: ["cao-zhi", "cao-cao", "cao-pi"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["继承竞争", "曹丕", "曹植"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-zhi-demotion",
    sourceId: "sanguozhi-wei-cao-zhi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "陈思王植传",
    locator: "黄初二年",
    year: 221,
    text: "黄初二年，监国谒者灌均希指，奏“植醉酒悖慢，劫胁使者”。有司请治罪，帝以太后故，贬爵安乡侯。",
    translation: null,
    mentionedPersonIds: ["cao-zhi", "cao-pi", "empress-bian"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["贬爵", "宗室管控", "曹丕时期"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-zhi-death",
    sourceId: "sanguozhi-wei-cao-zhi",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "陈思王植传",
    locator: "太和六年",
    year: 232,
    text: "其二月，以陈四县封植为陈王，邑三千五百户。植每欲求别见独谈，论及时政，幸兾试用，终不能得。旣还，怅然绝望。遂发疾薨，时年四十一。",
    translation: null,
    mentionedPersonIds: ["cao-zhi", "cao-rui"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["chen"],
    tags: ["陈王", "死亡", "宗室处境"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-chong-talent",
    sourceId: "sanguozhi-wei-cao-chong",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "邓哀王冲传",
    locator: "本传开篇",
    year: null,
    text: "邓哀王冲字仓舒。少聦察岐嶷，生五六岁，智意所及，有若成人之智。",
    translation: null,
    mentionedPersonIds: ["cao-chong"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["早慧", "宗室", "曹冲"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-chong-elephant",
    sourceId: "sanguozhi-wei-cao-chong",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "邓哀王冲传",
    locator: "称象",
    year: null,
    text: "时孙权曾致巨象，太祖欲知其斤重，访之羣下，咸莫能出其理。冲曰：“置象大船之上，而刻其水痕所至，称物以载之，则校可知矣。”",
    translation: null,
    mentionedPersonIds: ["cao-chong", "cao-cao", "sun-quan"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["称象", "智识", "孙权"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-chong-mercy",
    sourceId: "sanguozhi-wei-cao-chong",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "邓哀王冲传",
    locator: "马鞍鼠啮",
    year: null,
    text: "太祖马鞌在库，而为鼠所啮，库吏惧必死。冲谓曰：“待三日中，然后自归。”",
    translation: null,
    mentionedPersonIds: ["cao-chong", "cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["仁爱", "刑罚", "曹操"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-chong-death",
    sourceId: "sanguozhi-wei-cao-chong",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "邓哀王冲传",
    locator: "建安十三年",
    year: 208,
    text: "太祖数对羣臣称述，有欲传后意。年十三，建安十三年疾病，太祖亲为请命。及亡，哀甚。",
    translation: null,
    mentionedPersonIds: ["cao-chong", "cao-cao"],
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags: ["死亡", "曹操哀悼", "继承可能性"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-ang-life-death",
    sourceId: "sanguozhi-wei-cao-ang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "丰愍王昂传",
    locator: "本传",
    year: 197,
    text: "丰愍王昂字子修。弱冠举孝廉。随太祖南征，为张绣所害。",
    translation: null,
    mentionedPersonIds: ["cao-ang", "cao-cao", "zhang-xiu"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["wan"],
    tags: ["孝廉", "宛城", "死亡"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-shuang-early-regency",
    sourceId: "sanguozhi-wei-cao-shuang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "曹爽传",
    locator: "明帝末年",
    year: 239,
    text: "爽字昭伯，少以宗室谨重，明帝在东宫，甚亲爱之。帝寝疾，乃引爽入卧内，拜大将军，假节钺，都督中外诸军事，录尚书事，与太尉司马宣王并受遗诏辅少主。",
    translation: null,
    mentionedPersonIds: ["cao-shuang", "cao-rui", "sima-yi", "cao-fang"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["辅政", "大将军", "司马懿"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-shuang-power",
    sourceId: "sanguozhi-wei-cao-shuang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "曹爽传",
    locator: "正始初",
    year: 240,
    text: "爽弟羲为中领军，训武衞将军，彦散骑常侍侍讲，其馀诸弟皆以列侯侍从，出入禁闼，贵宠莫盛焉。",
    translation: null,
    mentionedPersonIds: ["cao-shuang"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["专权", "宗室", "禁闼"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-shuang-shu-campaign",
    sourceId: "sanguozhi-wei-cao-shuang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "曹爽传",
    locator: "正始五年",
    year: 244,
    text: "正始五年，爽乃西至长安，大发卒六七万人，从骆谷入。",
    translation: null,
    mentionedPersonIds: ["cao-shuang"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["chang-an", "luogu"],
    tags: ["伐蜀", "骆谷", "军事失败"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-shuang-gaoping",
    sourceId: "sanguozhi-wei-cao-shuang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "曹爽传",
    locator: "正始十年正月",
    year: 249,
    text: "十年正月，车驾朝高平陵，爽兄弟皆从。宣王部勒兵马，先据武库，遂出屯洛水浮桥。",
    translation: null,
    mentionedPersonIds: ["cao-shuang", "sima-yi", "cao-fang"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["gaopingling", "luoyang"],
    tags: ["高平陵", "司马懿", "政变"],
    confidence: "high",
    reviewStatus: "reviewed"
  },
  {
    id: "mention-sgz-wei-cao-shuang-death",
    sourceId: "sanguozhi-wei-cao-shuang",
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle: "曹爽传",
    locator: "正始十年",
    year: 249,
    text: "于是收爽、羲、训、晏、扬、谧、轨、胜、范、当等，皆伏诛，夷三族。",
    translation: null,
    mentionedPersonIds: ["cao-shuang"],
    mentionedEventIds: [],
    mentionedPlaceIds: ["luoyang"],
    tags: ["伏诛", "夷三族", "高平陵后"],
    confidence: "high",
    reviewStatus: "reviewed"
  }
];

const lifeEvents = [
  {
    id: "cao-zhang-early-martial",
    personId: "cao-zhang",
    year: null,
    displayYear: "早年",
    type: "service",
    title: "以武勇见称",
    summary: "曹彰字子文，少善射御、膂力过人，自陈志在为卫青、霍去病式的骑将。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhang-early"],
    confidence: "high",
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-zhang", "本传开篇", "任城威王彰，字子文。少善射御，膂力过人，手格猛兽，不避险阻。")
    ]
  },
  {
    id: "cao-zhang-218-daijun",
    personId: "cao-zhang",
    year: 218,
    displayYear: "218",
    type: "campaign",
    title: "北征代郡乌丸",
    summary: "代郡乌丸反叛时，曹彰为北中郎将、行骁骑将军，率军北征并以武勇立功。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhang-daijun"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhang", "建安二十三年", "二十三年，代郡乌丸反，以彰为北中郎将，行骁骑将军。")]
  },
  {
    id: "cao-zhang-222-rencheng",
    personId: "cao-zhang",
    year: 222,
    displayYear: "222",
    type: "office",
    title: "立为任城王",
    summary: "曹丕黄初三年立曹彰为任城王，宗室诸王分封体系进一步成形。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhang-death"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhang", "黄初三年", "三年，立为任城王。")]
  },
  {
    id: "cao-zhang-223-death",
    personId: "cao-zhang",
    year: 223,
    displayYear: "223",
    type: "death",
    title: "朝京都，疾薨于邸",
    summary: "曹彰入朝京都后病逝于邸舍，谥为威，后世围绕其入朝与暴薨有不同说法。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhang-death"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhang", "黄初四年", "四年，朝京都，疾薨于邸，谥曰威。")]
  },
  {
    id: "cao-zhi-192-birth",
    personId: "cao-zhi",
    year: 192,
    displayYear: "约192",
    type: "birth",
    title: "曹植出生",
    summary: "曹植字子建，卒年四十一，据《陈思王植传》卒年反推约生于初平三年前后。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhi-death"],
    confidence: "medium",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhi", "太和六年", "遂发疾薨，时年四十一。", "生年据卒年和享年反推。")]
  },
  {
    id: "cao-zhi-early-literary-talent",
    personId: "cao-zhi",
    year: 203,
    displayYear: "约203",
    type: "service",
    title: "少有文才",
    summary: "曹植十余岁已能诵读大量诗论辞赋，善于属文，是建安文学中最重要的曹氏宗室人物。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhi-talent"],
    confidence: "medium",
    approximate: true,
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-zhi", "本传开篇", "陈思王植字子建。年十岁馀，诵读诗、论及辞赋数十万言，善属文。", "年份据曹植生年和“年十岁馀”约推。")
    ]
  },
  {
    id: "cao-zhi-210-copper-terrace",
    personId: "cao-zhi",
    year: 210,
    displayYear: "约210",
    type: "service",
    title: "铜雀台援笔立成",
    summary: "曹操带诸子登邺城铜雀台命作赋，曹植援笔立成，受到曹操特别赏识。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhi-copper-terrace"],
    confidence: "medium",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhi", "邺铜雀台", "植援笔立成，可观，太祖甚异之。")]
  },
  {
    id: "cao-zhi-217-succession-rivalry",
    personId: "cao-zhi",
    year: 217,
    displayYear: "217 前后",
    type: "politics",
    title: "参与继承竞争并失势",
    summary: "曹植因才学被曹操看重，一度几乎成为太子候选；但其任性饮酒，与曹丕的自饰经营形成反差，最终曹丕被立为魏太子。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhi-succession"],
    confidence: "high",
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-cao-zhi",
        "建安二十二年前后",
        "太祖狐疑，几为太子者数矣。而植任性而行，不自雕励，饮酒不节。"
      )
    ]
  },
  {
    id: "cao-zhi-221-demotion",
    personId: "cao-zhi",
    year: 221,
    displayYear: "221",
    type: "politics",
    title: "贬爵安乡侯",
    summary: "曹丕即位后，曹植被奏称醉酒悖慢、胁迫使者，有司请罪；曹丕因卞太后缘故不杀，贬其爵。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhi-demotion"],
    confidence: "high",
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-cao-zhi",
        "黄初二年",
        "黄初二年，监国谒者灌均希指，奏“植醉酒悖慢，劫胁使者”。有司请治罪，帝以太后故，贬爵安乡侯。"
      )
    ]
  },
  {
    id: "cao-zhi-232-death",
    personId: "cao-zhi",
    year: 232,
    displayYear: "232",
    type: "death",
    title: "封陈王后病逝",
    summary: "曹叡太和六年，以陈四县封曹植为陈王；曹植多次求试用不得，忧郁发病而卒，年四十一。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-zhi-death"],
    confidence: "high",
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-cao-zhi",
        "太和六年",
        "其二月，以陈四县封植为陈王，邑三千五百户。植每欲求别见独谈，论及时政，幸兾试用，终不能得。旣还，怅然绝望。遂发疾薨，时年四十一。"
      )
    ]
  },
  {
    id: "cao-chong-196-birth",
    personId: "cao-chong",
    year: 196,
    displayYear: "约196",
    type: "birth",
    title: "曹冲出生",
    summary: "曹冲字仓舒，建安十三年卒时年十三，据此约生于建安元年前后。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-chong-death"],
    confidence: "medium",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-chong", "建安十三年", "年十三，建安十三年疾病。", "生年据卒年和享年反推。")]
  },
  {
    id: "cao-chong-early-talent",
    personId: "cao-chong",
    year: 201,
    endYear: 202,
    displayYear: "约201-202",
    type: "service",
    title: "幼年聪察早慧",
    summary: "曹冲五六岁时已被称有成人之智，是曹操诸子中最具早慧形象的人物之一。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-chong-talent"],
    confidence: "medium",
    approximate: true,
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-chong", "本传开篇", "少聦察岐嶷，生五六岁，智意所及，有若成人之智。", "年份据曹冲约生年和“五六岁”约推。")
    ]
  },
  {
    id: "cao-chong-elephant",
    personId: "cao-chong",
    year: 201,
    endYear: 202,
    displayYear: "约201-202",
    type: "service",
    title: "曹冲称象",
    summary: "孙权进献巨象，群臣无法测重，曹冲提出以船载象、刻水痕、再称物相校的方法。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-chong-elephant"],
    confidence: "medium",
    approximate: true,
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-cao-chong",
        "称象",
        "冲曰：“置象大船之上，而刻其水痕所至，称物以载之，则校可知矣。”",
        "本传未明纪年，置于曹冲五六岁早慧阶段。"
      )
    ]
  },
  {
    id: "cao-chong-mercy",
    personId: "cao-chong",
    year: 206,
    displayYear: "约206",
    type: "politics",
    title: "为库吏解鼠啮马鞍之罪",
    summary: "曹冲利用衣物被鼠啮的说法，替因曹操马鞍被鼠啮而恐惧受死的库吏开解，传记借此突出其仁爱与机智。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-chong-mercy"],
    confidence: "medium",
    approximate: true,
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-cao-chong",
        "马鞍鼠啮",
        "太祖马鞌在库，而为鼠所啮，库吏惧必死。冲谓曰：“待三日中，然后自归。”",
        "本传未明纪年，暂置于曹冲去世前数年。"
      )
    ]
  },
  {
    id: "cao-chong-208-death",
    personId: "cao-chong",
    year: 208,
    displayYear: "208",
    type: "death",
    title: "十三岁病逝",
    summary: "曹冲建安十三年病逝，曹操哀甚，并对曹丕说这是自己的不幸、诸子的幸运，反映曹冲曾被寄予很高期待。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-chong-death"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-chong", "建安十三年", "年十三，建安十三年疾病，太祖亲为请命。及亡，哀甚。")]
  },
  {
    id: "cao-ang-early-xiaolian",
    personId: "cao-ang",
    year: null,
    displayYear: "弱冠",
    type: "office",
    title: "弱冠举孝廉",
    summary: "曹昂字子修，弱冠时举孝廉，是曹操早年成年的长子。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-ang-life-death"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-ang", "本传", "丰愍王昂字子修。弱冠举孝廉。")]
  },
  {
    id: "cao-ang-197-death",
    personId: "cao-ang",
    year: 197,
    displayYear: "197",
    type: "death",
    title: "随曹操南征，为张绣所害",
    summary: "曹昂随曹操南征宛城，张绣复叛后遇害；《武帝纪》还记其与曹安民同死于宛城败局。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-ang-life-death", "mention-sgz-wei-wudi-cao-cao-wan-defeat"],
    confidence: "high",
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-ang", "本传", "随太祖南征，为张绣所害。"),
      sourceRef("sanguozhi-wei-wudi", "建安二年", "公与战，军败，为流矢所中，长子昂、弟子安民遇害。")
    ]
  },
  {
    id: "cao-shuang-239-regency",
    personId: "cao-shuang",
    year: 239,
    displayYear: "239",
    type: "politics",
    title: "受明帝遗诏辅少主",
    summary: "曹叡病重时拜曹爽为大将军，假节钺、都督中外诸军事、录尚书事，与司马懿共同辅佐曹芳。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-shuang-early-regency", "mention-sgz-wei-mingdi-cao-rui-death"],
    confidence: "high",
    sourceRefs: [
      sourceRef(
        "sanguozhi-wei-cao-shuang",
        "明帝末年",
        "帝寝疾，乃引爽入卧内，拜大将军，假节钺，都督中外诸军事，录尚书事，与太尉司马宣王并受遗诏辅少主。"
      )
    ]
  },
  {
    id: "cao-shuang-240-power-network",
    personId: "cao-shuang",
    year: 240,
    displayYear: "正始初",
    type: "politics",
    title: "曹氏兄弟出入禁闼，权势转盛",
    summary: "曹爽辅政后，曹羲、曹训、曹彦等兄弟分居禁军和侍从要职，何晏、邓飏、李胜、丁谧等成为腹心。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-shuang-power"],
    confidence: "high",
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-shuang", "正始初", "爽弟羲为中领军，训武衞将军，彦散骑常侍侍讲，其馀诸弟皆以列侯侍从，出入禁闼，贵宠莫盛焉。")
    ]
  },
  {
    id: "cao-shuang-244-shu-campaign",
    personId: "cao-shuang",
    year: 244,
    displayYear: "244",
    type: "campaign",
    title: "骆谷伐蜀失利",
    summary: "曹爽为立威名发动伐蜀，自长安发卒六七万人入骆谷，因转输困难和蜀军据险，最终无功而返。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-shuang-shu-campaign"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-shuang", "正始五年", "正始五年，爽乃西至长安，大发卒六七万人，从骆谷入。")]
  },
  {
    id: "cao-shuang-249-gaopingling",
    personId: "cao-shuang",
    year: 249,
    displayYear: "249",
    type: "turning-point",
    title: "高平陵政变中失势",
    summary: "曹芳谒高平陵时曹爽兄弟随行出城，司马懿据武库、屯洛水浮桥，曹爽失去洛阳中枢控制。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-shuang-gaoping"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-shuang", "正始十年正月", "十年正月，车驾朝高平陵，爽兄弟皆从。宣王部勒兵马，先据武库，遂出屯洛水浮桥。")]
  },
  {
    id: "cao-shuang-249-death",
    personId: "cao-shuang",
    year: 249,
    displayYear: "249",
    type: "death",
    title: "曹爽及党羽伏诛",
    summary: "高平陵之后，曹爽、曹羲、曹训、何晏、邓飏、丁谧等被诛并夷三族，司马氏掌握曹魏政局。",
    relatedEventIds: [],
    sourceMentionIds: ["mention-sgz-wei-cao-shuang-death"],
    confidence: "high",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-shuang", "正始十年", "于是收爽、羲、训、晏、扬、谧、轨、胜、范、当等，皆伏诛，夷三族。")]
  }
];

const relationEntries = [
  {
    id: "cao-cao-cao-ang-family",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-ang",
    type: "family",
    startYear: 197,
    endYear: 197,
    summary: "曹昂为曹操长子，随曹操南征宛城时为张绣所害。",
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-ang", "本传", "丰愍王昂字子修。弱冠举孝廉。随太祖南征，为张绣所害。"),
      sourceRef("sanguozhi-wei-wudi", "建安二年", "长子昂、弟子安民遇害。")
    ]
  },
  {
    id: "cao-cao-cao-zhang-family",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-zhang",
    type: "family",
    startYear: 218,
    endYear: 223,
    summary: "曹彰为曹操子，以武勇见长，受曹操命北征代郡乌丸。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhang", "建安二十三年", "二十三年，代郡乌丸反，以彰为北中郎将，行骁骑将军。")]
  },
  {
    id: "cao-cao-cao-zhi-family",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-zhi",
    type: "family",
    startYear: 192,
    endYear: 220,
    summary: "曹植为曹操子，以文学才华受曹操特别赏识，一度卷入魏太子继承竞争。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhi", "建安二十二年前后", "太祖狐疑，几为太子者数矣。")]
  },
  {
    id: "cao-cao-cao-chong-family",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-chong",
    type: "family",
    startYear: 196,
    endYear: 208,
    summary: "曹冲为曹操子，早慧仁爱，建安十三年早逝，曹操深为哀痛。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-chong", "建安十三年", "年十三，建安十三年疾病，太祖亲为请命。及亡，哀甚。")]
  },
  {
    id: "cao-pi-cao-zhi-succession-rivalry",
    sourcePersonId: "cao-pi",
    targetPersonId: "cao-zhi",
    type: "succession-rival",
    startYear: 211,
    endYear: 221,
    summary: "曹丕与曹植围绕魏太子地位形成继承竞争；曹丕胜出后，曹植在黄初年间受到宗室法制约束和贬爵。",
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-zhi", "建安二十二年前后", "太祖狐疑，几为太子者数矣。而植任性而行，不自雕励，饮酒不节。"),
      sourceRef("sanguozhi-wei-cao-zhi", "黄初二年", "帝以太后故，贬爵安乡侯。")
    ]
  },
  {
    id: "cao-zhen-cao-shuang-family",
    sourcePersonId: "cao-zhen",
    targetPersonId: "cao-shuang",
    type: "family-successor",
    startYear: 239,
    endYear: 249,
    summary: "曹爽为曹真之子，明帝末年受遗诏辅政，是曹真宗室军政地位在正始初年的延续。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-shuang", "明帝末年", "拜大将军，假节钺，都督中外诸军事，录尚书事。")]
  },
  {
    id: "cao-shuang-sima-yi-regency-rivalry",
    sourcePersonId: "cao-shuang",
    targetPersonId: "sima-yi",
    type: "regency-rival",
    startYear: 239,
    endYear: 249,
    summary: "曹爽与司马懿同受明帝遗诏辅少主，后曹爽转司马懿为太傅以夺实权，最终在高平陵政变中败亡。",
    sourceRefs: [
      sourceRef("sanguozhi-wei-cao-shuang", "明帝末年", "与太尉司马宣王并受遗诏辅少主。"),
      sourceRef("sanguozhi-wei-cao-shuang", "正始十年正月", "宣王部勒兵马，先据武库，遂出屯洛水浮桥。")
    ]
  },
  {
    id: "cao-shuang-cao-fang-regency",
    sourcePersonId: "cao-shuang",
    targetPersonId: "cao-fang",
    type: "regent",
    startYear: 239,
    endYear: 249,
    summary: "曹爽在齐王曹芳即位后以大将军、录尚书事辅政，实际控制曹魏中枢多年。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-shuang", "齐王即位", "明帝崩，齐王即位，加爽侍中，改封武安侯。")]
  }
];

const personUpdates = {
  "cao-zhang": {
    summary: "曹操子，字子文，以武勇见称。建安二十三年北征代郡乌丸有功，黄初三年立任城王，次年入朝病逝。",
    roles: ["曹魏宗室", "任城王", "北中郎将"],
    coverageStatus: "partial"
  },
  "cao-zhi": {
    summary: "曹操子，字子建，建安文学代表人物。因才华受曹操赏识并卷入继承竞争，曹丕即位后屡遭贬徙，太和六年封陈王后病逝。",
    roles: ["曹魏宗室", "陈思王", "文学家"],
    coverageStatus: "partial"
  },
  "cao-chong": {
    summary: "曹操子，字仓舒，幼年早慧，以称象和为库吏解罪等故事见称。建安十三年十三岁病逝，曹操深为哀痛。",
    roles: ["曹魏宗室", "邓哀王", "早慧宗室"],
    coverageStatus: "partial"
  },
  "cao-ang": {
    summary: "曹操长子，字子修，弱冠举孝廉。建安二年随曹操南征宛城，张绣复叛时遇害。",
    roles: ["曹魏宗室", "曹操长子", "孝廉"],
    coverageStatus: "partial"
  },
  "cao-shuang": {
    summary: "曹真之子，明帝末年受遗诏与司马懿同辅少主曹芳。正始年间权势极盛，244 年伐蜀失利，249 年高平陵政变后被诛。",
    roles: ["曹魏宗室", "大将军", "辅政大臣"],
    coverageStatus: "partial"
  }
};

const sourceMentions = readJson("data/china-source-mentions.json");
const personLifeEvents = readJson("data/china-person-life-events.json");
const personRelations = readJson("data/china-person-relations.json");
const persons = readJson("data/china-persons.json");
const coveragePlan = readJson("data/cao-wei-person-coverage-plan.json");

const mentionStats = { added: 0, updated: 0 };
for (const mention of mentions) {
  mentionStats[upsertById(sourceMentions, mention)] += 1;
}

const removeSeedIds = new Set([
  "cao-zhang-wei-shu-source-seed",
  "cao-zhi-wei-shu-source-seed",
  "cao-chong-wei-shu-source-seed",
  "cao-ang-wei-shu-source-seed",
  "cao-shuang-wei-shu-source-seed"
]);
let removedSeeds = 0;
for (let index = personLifeEvents.length - 1; index >= 0; index -= 1) {
  if (removeSeedIds.has(personLifeEvents[index].id)) {
    personLifeEvents.splice(index, 1);
    removedSeeds += 1;
  }
}

const lifeEventStats = { added: 0, updated: 0 };
for (const lifeEvent of lifeEvents) {
  lifeEventStats[upsertById(personLifeEvents, lifeEvent)] += 1;
}

const relationStats = { added: 0, updated: 0 };
for (const relation of relationEntries) {
  relationStats[upsertById(personRelations, relation)] += 1;
}

for (const person of persons) {
  const update = personUpdates[person.id];
  if (update) {
    Object.assign(person, update);
  }
}

coveragePlan.updatedAt = "2026-06-22";
coveragePlan.phases = coveragePlan.phases.map((phase) =>
  phase.id === "wei-biography-detail-pass"
    ? {
        ...phase,
        status: "in-progress",
        note: "已完成曹操、曹丕、曹叡三代本纪第一轮，以及曹彰、曹植、曹冲、曹昂、曹爽宗室线第一轮。"
      }
    : phase
);

const batch = {
  id: "wei-cao-clan-pass-1",
  title: "曹魏宗室线第一轮：曹彰、曹植、曹冲、曹昂、曹爽",
  status: "done",
  personIds: ["cao-zhang", "cao-zhi", "cao-chong", "cao-ang", "cao-shuang"],
  note: "补充宗室人物的传记性格、关键生平、原文摘录和基础亲属/辅政关系。"
};
const existingBatchIndex = coveragePlan.currentBatches.findIndex((item) => item.id === batch.id);
if (existingBatchIndex >= 0) {
  coveragePlan.currentBatches[existingBatchIndex] = batch;
} else {
  coveragePlan.currentBatches.push(batch);
}

coveragePlan.caoClanPass1 = {
  updatedAt: "2026-06-22",
  sourceIds: [
    "sanguozhi-wei-cao-zhang",
    "sanguozhi-wei-cao-zhi",
    "sanguozhi-wei-cao-chong",
    "sanguozhi-wei-cao-ang",
    "sanguozhi-wei-cao-shuang"
  ],
  sourceMentionIds: mentions.map((mention) => mention.id),
  lifeEventIds: lifeEvents.map((event) => event.id),
  relationIds: relationEntries.map((relation) => relation.id),
  limitation: "本轮先按《三国志·魏书》本传建立宗室线骨架；曹植诗文、曹爽高平陵相关《资治通鉴》互校和裴注扩展仍待后续。"
};

writeJson("data/china-source-mentions.json", sourceMentions);
writeJson("data/china-person-life-events.json", personLifeEvents);
writeJson("data/china-person-relations.json", personRelations);
writeJson("data/china-persons.json", persons);
writeJson("data/cao-wei-person-coverage-plan.json", coveragePlan);

console.log(
  JSON.stringify(
    {
      sourceMentions: mentionStats,
      lifeEvents: lifeEventStats,
      relations: relationStats,
      removedSeeds
    },
    null,
    2
  )
);
