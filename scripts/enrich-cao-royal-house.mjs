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

function mention({
  id,
  sourceId,
  chapterTitle,
  locator,
  year = null,
  text,
  mentionedPersonIds,
  tags,
  confidence = "high"
}) {
  return {
    id,
    sourceId,
    workTitle: "三国志",
    bookTitle: "魏书",
    chapterTitle,
    locator,
    year,
    text,
    translation: null,
    mentionedPersonIds,
    mentionedEventIds: [],
    mentionedPlaceIds: [],
    tags,
    confidence,
    reviewStatus: "reviewed"
  };
}

function lifeEvent({
  id,
  personId,
  year = null,
  endYear,
  displayYear,
  type,
  title,
  summary,
  sourceMentionIds,
  sourceId,
  locator,
  quote,
  confidence = "high",
  approximate,
  note
}) {
  const item = {
    id,
    personId,
    year,
    displayYear,
    type,
    title,
    summary,
    relatedEventIds: [],
    sourceMentionIds,
    confidence,
    sourceRefs: [sourceRef(sourceId, locator, quote, note)]
  };
  if (endYear !== undefined) {
    item.endYear = endYear;
  }
  if (approximate !== undefined) {
    item.approximate = approximate;
  }
  return item;
}

const importantRecords = [
  {
    personId: "cao-fang",
    sourceId: "sanguozhi-wei-qi-wang",
    chapterTitle: "齐王纪",
    events: [
      {
        key: "235-qi-wang",
        year: 235,
        displayYear: "235",
        type: "office",
        title: "立为齐王",
        locator: "青龙三年",
        quote: "青龙三年，立为齐王。",
        summary: "曹芳幼年入魏明帝后嗣体系，青龙三年被立为齐王，是其入继皇位前的身份基础。",
        tags: ["齐王", "宗室继嗣"]
      },
      {
        key: "239-enthroned",
        year: 239,
        displayYear: "239",
        type: "politics",
        title: "明帝病重，曹芳即位",
        locator: "景初三年正月",
        quote: "景初三年正月丁亥朔，帝甚病，乃立为皇太子。是日，即皇帝位，大赦。尊皇后曰皇太后。大将军曹爽、太尉司马宣王辅政。",
        summary: "魏明帝病重时立曹芳为皇太子，当日即皇帝位；曹爽与司马懿同受托辅政，曹魏进入少帝政治。",
        mentionedPersonIds: ["cao-fang", "cao-rui", "cao-shuang", "sima-yi"],
        tags: ["即位", "辅政", "曹爽", "司马懿"]
      },
      {
        key: "249-gaopingling",
        year: 249,
        displayYear: "249",
        type: "turning-point",
        title: "高平陵政变中失去曹爽辅政体系",
        locator: "嘉平元年春正月",
        quote: "嘉平元年春正月甲午，车驾谒高平陵。太傅司马宣王奏免大将军曹爽、爽弟中领军羲、武卫将军训、散骑常侍彦官，以侯就第。",
        summary: "曹芳谒高平陵时，司马懿在洛阳发动政变，奏免曹爽兄弟官职；此后曹魏中枢权力转入司马氏。",
        mentionedPersonIds: ["cao-fang", "cao-shuang", "sima-yi"],
        tags: ["高平陵", "司马氏", "曹爽"]
      },
      {
        key: "254-deposed",
        year: 254,
        displayYear: "254",
        type: "politics",
        title: "司马师谋废，曹芳归藩于齐",
        locator: "嘉平六年九月",
        quote: "秋九月，大将军司马景王将谋废帝，以闻皇太后。甲戌，太后令曰：皇帝芳春秋已长，不亲万机……遣芳归藩于齐，以避皇位。",
        summary: "司马师以郭太后令废曹芳帝位，遣其归藩为齐王；曹魏皇位转由高贵乡公曹髦继承。",
        mentionedPersonIds: ["cao-fang", "cao-mao", "empress-guo-mingyuan"],
        tags: ["废立", "司马师", "齐王"]
      }
    ],
    personUpdate: {
      summary: "曹芳，字兰卿，魏明帝养子。239 年即位后先由曹爽、司马懿辅政，高平陵政变后司马氏掌权，254 年被司马师废为齐王。",
      roles: ["皇帝", "曹魏少帝", "齐王"],
      coverageStatus: "partial"
    }
  },
  {
    personId: "cao-mao",
    sourceId: "sanguozhi-wei-gaogui-xianggong",
    chapterTitle: "高贵乡公纪",
    events: [
      {
        key: "244-gaogui",
        year: 244,
        displayYear: "244",
        type: "office",
        title: "封高贵乡公",
        locator: "正始五年",
        quote: "高贵乡公讳髦，字彦士，文帝孙，东海定王霖子也。正始五年，封歘县高贵乡公。少好学，夙成。",
        summary: "曹髦为曹丕之孙、东海定王曹霖之子，正始五年被封为高贵乡公，传称少好学、夙成。",
        mentionedPersonIds: ["cao-mao", "cao-pi", "cao-lin-donghai"],
        tags: ["高贵乡公", "好学"]
      },
      {
        key: "254-enthroned",
        year: 254,
        displayYear: "254",
        type: "politics",
        title: "齐王废后被迎立",
        locator: "正元元年十月",
        quote: "齐王废，公卿议迎立公。十月己丑，公至于玄武馆……其日即皇帝位于太极前殿。",
        summary: "曹芳被废后，公卿迎立曹髦；曹髦入洛阳时仍以人臣自处，随后在太极前殿即皇帝位。",
        mentionedPersonIds: ["cao-mao", "cao-fang"],
        tags: ["即位", "废立", "洛阳"]
      },
      {
        key: "260-sima-zhao",
        year: 260,
        displayYear: "260",
        type: "turning-point",
        title: "称“司马昭之心，路人所知”",
        locator: "甘露五年五月",
        quote: "帝见威权日去，不胜其忿。乃召侍中王沈、尚书王经、散骑常侍王业，谓曰：“司马昭之心，路人所知也。吾不能坐受废辱，今日当与卿等自出讨之。”",
        summary: "曹髦面对司马昭权势日盛，召王沈、王经、王业等言明不愿坐受废辱，决定亲自讨伐司马昭。",
        mentionedPersonIds: ["cao-mao", "sima-zhao"],
        tags: ["司马昭", "王经", "反抗"]
      },
      {
        key: "260-death",
        year: 260,
        displayYear: "260",
        type: "death",
        title: "南阙下被弑",
        locator: "甘露五年五月",
        quote: "中护军贾充又逆帝战于南阙下，帝自用剑。众欲退，太子舍人成济问充曰：“事急矣。当云何？”充曰：“畜养汝等，正谓今日。今日之事，无所问也。”济即前刺帝，刃出于背。",
        summary: "曹髦率僮仆宿卫出宫，被贾充所部阻击；太子舍人成济刺杀曹髦，曹魏皇权与司马氏矛盾公开化。",
        mentionedPersonIds: ["cao-mao", "sima-zhao"],
        tags: ["被弑", "贾充", "成济"]
      }
    ],
    personUpdate: {
      summary: "曹髦，字彦士，曹丕之孙、东海定王曹霖之子。254 年曹芳被废后即位，260 年因不满司马昭专权亲自出讨，被贾充部下成济弑杀。",
      roles: ["皇帝", "曹魏少帝", "高贵乡公"],
      coverageStatus: "partial"
    }
  },
  {
    personId: "cao-huan",
    sourceId: "sanguozhi-wei-chenliu-wang",
    chapterTitle: "陈留王",
    events: [
      {
        key: "258-changdao",
        year: 258,
        displayYear: "258",
        type: "office",
        title: "封常道乡公",
        locator: "甘露三年",
        quote: "陈留王讳奂，字景明，武帝孙，燕王宇子也。甘露三年，封安次县常道乡公。",
        summary: "曹奂为曹操之孙、燕王曹宇之子，甘露三年被封为安次县常道乡公。",
        mentionedPersonIds: ["cao-huan", "cao-cao", "cao-yu"],
        tags: ["常道乡公", "燕王宇"]
      },
      {
        key: "260-enthroned",
        year: 260,
        displayYear: "260",
        type: "politics",
        title: "曹髦死后被迎立",
        locator: "甘露五年六月",
        quote: "高贵乡公卒，公卿议迎立公。六月甲寅，入于洛阳，见皇太后，是日即皇帝位于太极前殿，大赦，改年。",
        summary: "高贵乡公曹髦被弑后，公卿迎立曹奂；他入洛阳见皇太后，当日在太极前殿即位。",
        mentionedPersonIds: ["cao-huan", "cao-mao", "empress-guo-mingyuan"],
        tags: ["即位", "曹髦", "洛阳"]
      },
      {
        key: "263-shu-surrender",
        year: 263,
        displayYear: "263",
        type: "campaign",
        title: "魏灭蜀汉",
        locator: "景元四年十一月",
        quote: "自邓艾、锺会率众伐蜀，所至辄克。是月，蜀主刘禅诣艾降，巴蜀皆平。",
        summary: "曹奂在位时，邓艾、钟会伐蜀，刘禅向邓艾投降，蜀汉灭亡；这是曹魏后期最重大的军事成果。",
        mentionedPersonIds: ["cao-huan", "deng-ai", "zhong-hui", "liu-shan"],
        tags: ["灭蜀", "邓艾", "钟会", "刘禅"]
      },
      {
        key: "265-abdication",
        year: 265,
        displayYear: "265",
        type: "abdication",
        title: "禅位于晋",
        locator: "咸熙二年十二月",
        quote: "十二月壬戌，天禄永终，历数在晋。诏群公卿士具仪设坛于南郊，使使者奉皇帝玺绶册，禅位于晋嗣王，如汉魏故事。",
        summary: "咸熙二年，曹奂下诏禅位于晋王司马炎，曹魏政权结束；曹奂随后被封为陈留王。",
        mentionedPersonIds: ["cao-huan", "sima-yan"],
        tags: ["禅让", "西晋", "曹魏灭亡"]
      }
    ],
    personUpdate: {
      summary: "曹奂，字景明，曹操之孙、燕王曹宇之子。260 年曹髦死后即位，263 年魏灭蜀汉，265 年禅位于司马炎，曹魏由此结束。",
      roles: ["皇帝", "曹魏元帝", "陈留王"],
      coverageStatus: "partial"
    }
  },
  {
    personId: "cao-ren",
    sourceId: "sanguozhi-wei-cao-ren",
    chapterTitle: "曹仁传",
    events: [
      {
        key: "early",
        year: null,
        displayYear: "早年",
        type: "service",
        title: "少好弓马，从曹操起兵",
        locator: "本传开篇",
        quote: "曹仁字子孝，太祖从弟也。少好弓马弋猎……遂从太祖，为别部司马，行厉锋校尉。",
        summary: "曹仁是曹操从弟，少好弓马，汉末豪杰并起时聚众千余人，随后从曹操起兵。",
        mentionedPersonIds: ["cao-ren", "cao-cao"],
        tags: ["宗亲将领", "从弟", "骑兵"]
      },
      {
        key: "208-jiangling",
        year: 208,
        displayYear: "208 后",
        type: "campaign",
        title: "留屯江陵，拒周瑜",
        locator: "平荆州后",
        quote: "从平荆州，以仁行征南将军，留屯江陵，拒吴将周瑜。",
        summary: "曹操平荆州后，曹仁以行征南将军留守江陵，对抗周瑜，是赤壁后曹魏南线防御核心。",
        mentionedPersonIds: ["cao-ren", "zhou-yu"],
        tags: ["江陵", "周瑜", "南线"]
      },
      {
        key: "219-fancheng",
        year: 219,
        displayYear: "219",
        type: "campaign",
        title: "襄樊危机中坚守樊城",
        locator: "关羽攻樊",
        quote: "关羽攻樊，时汉水暴溢，于禁等七军皆没，禁降羽。仁人马数千人守城，城不没者数板……徐晃救至，水亦稍减，晃从外击羽，仁得溃围出，羽退走。",
        summary: "关羽围樊城、水淹七军后，曹仁在粮尽援绝中坚守，直至徐晃救援而解围。",
        mentionedPersonIds: ["cao-ren", "guan-yu", "yu-jin", "xu-huang"],
        tags: ["襄樊", "关羽", "徐晃"]
      },
      {
        key: "222-grand-marshal",
        year: 222,
        displayYear: "222 前后",
        type: "office",
        title: "拜大将军，迁大司马",
        locator: "文帝时期",
        quote: "文帝遣使即拜仁大将军。又诏仁移屯临颍，迁大司马，复督诸军据乌江，还屯合肥。",
        summary: "曹丕时期，曹仁拜大将军、迁大司马，仍负责南线、东线军事调度。",
        mentionedPersonIds: ["cao-ren", "cao-pi"],
        tags: ["大将军", "大司马"]
      },
      {
        key: "223-death",
        year: 223,
        displayYear: "223",
        type: "death",
        title: "薨，谥忠侯",
        locator: "黄初四年",
        quote: "黄初四年薨，谥曰忠侯。魏书曰：仁时年五十六。",
        summary: "曹仁黄初四年去世，谥忠侯；传称时年五十六。",
        mentionedPersonIds: ["cao-ren"],
        tags: ["死亡", "忠侯"]
      }
    ],
    personUpdate: {
      summary: "曹仁，字子孝，曹操从弟。早年从曹操征伐，赤壁后守江陵，219 年襄樊危机中坚守樊城，曹丕时期拜大将军、迁大司马。",
      roles: ["曹魏宗室", "大司马", "征南将军", "方面统帅"],
      coverageStatus: "partial"
    }
  },
  {
    personId: "cao-hong",
    sourceId: "sanguozhi-wei-cao-hong",
    chapterTitle: "曹洪传",
    events: [
      {
        key: "190-save-cao-cao",
        year: 190,
        displayYear: "190",
        type: "campaign",
        title: "荥阳败后让马救曹操",
        locator: "讨董卓荥阳败后",
        quote: "太祖失马，贼追甚急，洪下，以马授太祖，太祖辞让，洪曰：“天下可无洪，不可无君。”遂步从到汴水。",
        summary: "曹操讨董卓至荥阳败于徐荣，曹洪下马授曹操，并称天下可无洪不可无君，是其传中最著名事迹。",
        mentionedPersonIds: ["cao-hong", "cao-cao"],
        tags: ["救曹操", "讨董卓", "荥阳"]
      },
      {
        key: "194-yan-zhou",
        year: 194,
        displayYear: "194",
        type: "campaign",
        title: "兖州危机中聚粮继军",
        locator: "张邈迎吕布",
        quote: "太祖征徐州，张邈举兖州叛迎吕布。时大饥荒，洪将兵在前，先据东平、范，聚粮谷以继军。",
        summary: "张邈迎吕布、兖州危机爆发时，曹洪先据东平、范，聚粮接济曹操军队。",
        mentionedPersonIds: ["cao-hong", "cao-cao", "zhang-miao", "lu-bu"],
        tags: ["兖州", "吕布", "军粮"]
      },
      {
        key: "226-later-office",
        year: 226,
        displayYear: "226 后",
        type: "office",
        title: "明帝即位后复任后将军、骠骑将军",
        locator: "明帝即位后",
        quote: "明帝即位，拜后将军，更封乐城侯，邑千户，位特进，复拜骠骑将军。",
        summary: "曹洪在曹丕时期曾几乎获罪，魏明帝即位后再受任用，拜后将军、特进、骠骑将军。",
        mentionedPersonIds: ["cao-hong", "cao-rui"],
        tags: ["后将军", "骠骑将军"]
      },
      {
        key: "232-death",
        year: 232,
        displayYear: "232",
        type: "death",
        title: "薨，谥恭侯",
        locator: "太和六年",
        quote: "太和六年薨，谥曰恭侯。子馥，嗣侯。",
        summary: "曹洪太和六年去世，谥恭侯，其子曹馥嗣爵。",
        mentionedPersonIds: ["cao-hong"],
        tags: ["死亡", "恭侯"]
      }
    ],
    personUpdate: {
      summary: "曹洪，字子廉，曹操从弟。讨董卓败后让马救曹操，兖州危机中聚粮继军，明帝时复拜后将军、骠骑将军，232 年去世。",
      roles: ["曹魏宗室", "骠骑将军", "曹操从弟"],
      coverageStatus: "partial"
    }
  },
  {
    personId: "cao-xiu",
    sourceId: "sanguozhi-wei-cao-xiu",
    chapterTitle: "曹休传",
    events: [
      {
        key: "early-qianliju",
        year: null,
        displayYear: "早年",
        type: "service",
        title: "归曹操，被称“千里驹”",
        locator: "早年归曹操",
        quote: "太祖谓左右曰：“此吾家千里驹也。”使与文帝同止，见待如子。常从征伐，使领虎豹骑宿卫。",
        summary: "曹休少孤避乱至吴地，后北归曹操，被称为“吾家千里驹”，与曹丕同处并领虎豹骑。",
        mentionedPersonIds: ["cao-xiu", "cao-cao", "cao-pi"],
        tags: ["千里驹", "虎豹骑", "宗亲"]
      },
      {
        key: "218-xiabian",
        year: 218,
        displayYear: "218",
        type: "campaign",
        title: "下辩战事中参曹洪军事",
        locator: "刘备遣吴兰屯下辩",
        quote: "刘备遣将吴兰屯下辩，太祖遣曹洪征之，以休为骑都尉，参洪军事。太祖谓休曰：“汝虽参军，其实帅也。”",
        summary: "刘备遣吴兰屯下辩时，曹休为骑都尉参曹洪军事，曹操实际将指挥责任寄予曹休。",
        mentionedPersonIds: ["cao-xiu", "cao-hong", "cao-cao", "liu-bei"],
        tags: ["下辩", "曹洪", "刘备"]
      },
      {
        key: "220-east-command",
        year: 220,
        displayYear: "220",
        type: "office",
        title: "文帝时都督诸军事，主持东南方向",
        locator: "文帝即王位后",
        quote: "文帝即王位，为领军将军，录前后功，封东阳亭侯。夏侯敦薨，以休为镇南将军，假节都督诸军事。",
        summary: "曹丕即王位后，曹休任领军将军；夏侯惇死后，曹休为镇南将军、假节都督诸军事。",
        mentionedPersonIds: ["cao-xiu", "cao-pi", "xiahou-dun"],
        tags: ["镇南将军", "东线"]
      },
      {
        key: "228-shiting",
        year: 228,
        displayYear: "228",
        type: "campaign",
        title: "石亭战败后病逝",
        locator: "太和二年",
        quote: "太和二年，帝为二道征吴……贼将伪降，休深入，战不利，退还宿石亭。军夜惊，士卒乱，弃甲兵辎重甚多……休因此痈发背薨，谥曰壮侯。",
        summary: "曹休在太和二年伐吴时因吴将诈降深入，石亭战败，回军后背疽发作去世。",
        mentionedPersonIds: ["cao-xiu", "cao-rui"],
        tags: ["石亭", "伐吴", "死亡"]
      }
    ],
    personUpdate: {
      summary: "曹休，字文烈，曹操族子。少孤归曹操，被称为“千里驹”，曹丕、曹叡时期长期主持东南对吴方向，228 年石亭战败后病逝。",
      roles: ["曹魏宗室", "大司马", "征东将军", "东线统帅"],
      coverageStatus: "partial"
    }
  },
  {
    personId: "cao-zhen",
    sourceId: "sanguozhi-wei-cao-zhen",
    chapterTitle: "曹真传",
    events: [
      {
        key: "early-adopted",
        year: null,
        displayYear: "早年",
        type: "service",
        title: "少孤，被曹操收养",
        locator: "本传开篇",
        quote: "太祖哀真少孤，收养与诸子同，使与文帝共止……太祖壮其鸷勇，使将虎豹骑。",
        summary: "曹真少孤后被曹操收养，与曹丕同处；因勇猛被曹操任为虎豹骑将领。",
        mentionedPersonIds: ["cao-zhen", "cao-cao", "cao-pi"],
        tags: ["收养", "虎豹骑", "宗亲"]
      },
      {
        key: "219-hanzhong",
        year: 219,
        displayYear: "219",
        type: "campaign",
        title: "汉中战后为征蜀护军",
        locator: "夏侯渊没于阳平后",
        quote: "是时，夏侯渊没于阳平，太祖忧之。以真为征蜀护军，督徐晃等破刘备别将高详于阳平。",
        summary: "夏侯渊战死后，曹真为征蜀护军，督徐晃等在阳平方向击破刘备别将高详。",
        mentionedPersonIds: ["cao-zhen", "xiahou-yuan", "cao-cao", "xu-huang", "liu-bei"],
        tags: ["汉中", "征蜀护军", "阳平"]
      },
      {
        key: "220-west-command",
        year: 220,
        displayYear: "220",
        type: "office",
        title: "镇西将军，都督雍凉",
        locator: "文帝即王位",
        quote: "文帝即王位，以真为镇西将军，假节都督雍、凉州诸军事。录前后功，进封东乡侯。",
        summary: "曹丕即王位后，曹真为镇西将军，假节都督雍凉诸军事，成为魏国西线核心宗亲将领。",
        mentionedPersonIds: ["cao-zhen", "cao-pi"],
        tags: ["雍凉", "镇西将军"]
      },
      {
        key: "226-regency",
        year: 226,
        displayYear: "226",
        type: "politics",
        title: "受文帝遗诏辅政",
        locator: "黄初七年",
        quote: "七年，文帝寝疾，真与陈群、司马宣王等受遗诏辅政。明帝即位，进封邵陵侯……迁大将军。",
        summary: "曹丕临终时，曹真与陈群、司马懿等同受遗诏辅佐明帝，随后进封邵陵侯、迁大将军。",
        mentionedPersonIds: ["cao-zhen", "cao-pi", "cao-rui", "chen-qun", "sima-yi"],
        tags: ["辅政", "大将军"]
      },
      {
        key: "228-qishan",
        year: 228,
        displayYear: "228",
        type: "campaign",
        title: "督诸军应对诸葛亮祁山之围",
        locator: "诸葛亮围祁山",
        quote: "诸葛亮围祁山，南安、天水、安定三郡反应亮。帝遣真督诸军军郿，遣张合击亮将马谡，大破之。",
        summary: "诸葛亮第一次北伐时，曹真督诸军屯郿，张郃击破马谡，魏军平定响应蜀汉的三郡。",
        mentionedPersonIds: ["cao-zhen", "zhuge-liang", "zhang-he"],
        tags: ["诸葛亮北伐", "祁山", "张郃"]
      },
      {
        key: "230-southern-campaign",
        year: 230,
        displayYear: "230",
        type: "campaign",
        title: "多路伐蜀遇雨撤军",
        locator: "太和四年",
        quote: "真以“蜀连出侵边境，宜遂伐之。数道并入，可大克也”。帝从其计……真以八月发长安，从子午道南入……会大霖雨三十馀日，或栈道断绝，诏真还军。",
        summary: "曹真建议多路伐蜀，曹叡采纳；曹真自长安从子午道南入，但连日大雨、栈道断绝，魏军奉诏撤还。",
        mentionedPersonIds: ["cao-zhen", "cao-rui", "sima-yi"],
        tags: ["伐蜀", "子午道", "撤军"]
      },
      {
        key: "231-death",
        year: 231,
        displayYear: "231",
        type: "death",
        title: "薨，谥元侯",
        locator: "太和五年前后",
        quote: "真病还洛阳，帝自幸其第省疾。真薨，谥曰元侯。子爽嗣。",
        summary: "曹真病还洛阳后，曹叡亲临其第问疾；曹真去世，谥元侯，曹爽嗣爵。",
        mentionedPersonIds: ["cao-zhen", "cao-rui", "cao-shuang"],
        tags: ["死亡", "曹爽", "元侯"]
      }
    ],
    personUpdate: {
      summary: "曹真，字子丹，曹操族子，少孤后由曹操收养。曹丕时期都督雍凉，文帝临终受遗诏辅政；明帝时任大将军、大司马，应对诸葛亮北伐并主持西线军政。",
      roles: ["曹魏宗室", "大司马", "大将军", "西线统帅", "辅政大臣"],
      coverageStatus: "partial"
    }
  }
];

const shortPrinceRecords = [
  {
    personId: "cao-xiong",
    sourceId: "sanguozhi-wei-cao-xiong",
    chapterTitle: "萧怀王熊传",
    displayName: "曹熊",
    summaryTitle: "早薨，追封萧怀王",
    quote: "萧怀王熊，早薨。黄初二年追封谥萧怀公。太和三年，又追封爵为王。",
    locator: "本传",
    year: 221,
    displayYear: "221-229",
    title: "追封萧怀公，后进王爵",
    summary: "曹熊早逝，黄初二年追封萧怀公，太和三年又追进为萧怀王。",
    roles: ["曹魏宗室", "萧怀王"],
    personSummary: "曹熊，曹操子，早逝。魏文帝黄初二年追封萧怀公，魏明帝太和三年又追进为萧怀王。"
  },
  {
    personId: "cao-shuo",
    sourceId: "sanguozhi-wei-cao-shuo",
    chapterTitle: "相殇王铄传",
    displayName: "曹铄",
    summaryTitle: "早薨，追封相殇王",
    quote: "相殇王铄，早薨，太和三年追封谥。青龙元年，子愍王潜嗣，其年薨。",
    locator: "本传",
    year: 229,
    displayYear: "229",
    title: "追封谥相殇王",
    summary: "曹铄早逝，太和三年追封谥；其后嗣曹潜、曹偃相继承袭，又皆早卒。",
    roles: ["曹魏宗室", "相殇王"],
    personSummary: "曹铄，曹操子，早逝。魏明帝太和三年追封谥，后嗣曹潜、曹偃相继承袭，终因无子国除。"
  },
  {
    personId: "cao-ju",
    sourceId: "sanguozhi-wei-cao-ju",
    chapterTitle: "彭城王据传",
    displayName: "曹据",
    summaryTitle: "多次徙封，终为彭城王",
    quote: "彭城王据，建安十六年封范阳侯。二十二年，徙封宛侯。黄初二年，进爵为公。三年，为章陵王……太和六年，改封诸王，皆以郡为国，据复封彭城。",
    locator: "本传",
    year: 211,
    endYear: 232,
    displayYear: "211-232",
    title: "由范阳侯屡徙至彭城王",
    summary: "曹据建安十六年封范阳侯，此后历宛侯、章陵王、义阳、彭城、济阴、定陶等封号，太和六年复封彭城。",
    roles: ["曹魏宗室", "彭城王"],
    personSummary: "曹据，曹操子，建安十六年封范阳侯，曹丕、曹叡时期多次徙封，最终复封彭城王；景初元年因私作禁物被削户。"
  },
  {
    personId: "cao-yu",
    sourceId: "sanguozhi-wei-cao-yu",
    chapterTitle: "燕王宇传",
    displayName: "曹宇",
    summaryTitle: "明帝末年短暂受托",
    quote: "燕王宇字彭祖。建安十六年，封都乡侯……太和六年，改封燕王。明帝少与宇同止，常爱异之……冬十二月，明帝疾笃，拜宇为大将军，属以后事。受署四日，宇深固让；帝意亦变，遂免宇官。",
    locator: "本传",
    year: 211,
    endYear: 239,
    displayYear: "211-239",
    title: "由都乡侯至燕王，明帝末年短暂受托",
    summary: "曹宇字彭祖，建安十六年封都乡侯，太和六年改封燕王；曹叡病重时曾拜其为大将军托以后事，旋因固让和帝意改变而免官。",
    roles: ["曹魏宗室", "燕王", "短期辅政候选"],
    personSummary: "曹宇，字彭祖，曹操子。太和六年改封燕王，曹叡末年曾短暂被拜为大将军、托以后事，后被免；其子曹奂后来入继帝位。"
  },
  {
    personId: "cao-lin",
    sourceId: "sanguozhi-wei-cao-lin",
    chapterTitle: "沛穆王林传",
    displayName: "曹林",
    summaryTitle: "历封至沛穆王",
    quote: "沛穆王林，建安十六年封饶阳侯……太和六年，改封沛。景初、正元、景元中，累增邑，并前四千七百户。林薨，子纬嗣。",
    locator: "本传",
    year: 211,
    endYear: 232,
    displayYear: "211-232",
    title: "由饶阳侯历封至沛王",
    summary: "曹林建安十六年封饶阳侯，后历谯王、鄄城等封号，太和六年改封沛王。",
    roles: ["曹魏宗室", "沛穆王"],
    personSummary: "曹林，曹操子，建安十六年封饶阳侯，曹魏建国后屡次徙封，太和六年改封沛王，薨后谥穆。"
  },
  {
    personId: "cao-gun",
    sourceId: "sanguozhi-wei-cao-gun",
    chapterTitle: "中山恭王衮传",
    displayName: "曹衮",
    summaryTitle: "好学谨慎的宗室王",
    quote: "中山恭王衮，建安二十一年封平乡侯。少好学，年十余岁能属文……每兄弟游娱，衮独谭思经典。",
    locator: "本传",
    year: 216,
    endYear: 232,
    displayYear: "216-232",
    title: "由平乡侯至中山王，以好学谨慎见称",
    summary: "曹衮建安二十一年封平乡侯，少好学能属文；兄弟游娱时，他常研读经典，传中形象较为正面。",
    roles: ["曹魏宗室", "中山恭王", "好学宗室"],
    personSummary: "曹衮，曹操子，中山恭王。少好学、能属文，传称其尚约俭、谨慎自守，是武文世王公传中事迹较丰富的宗室王之一。"
  },
  {
    personId: "cao-xuan",
    sourceId: "sanguozhi-wei-cao-xuan",
    chapterTitle: "济阳怀王玹传",
    displayName: "曹玹",
    summaryTitle: "早薨，无子，后人奉后",
    quote: "济阳怀王玹，建安十六年封西乡侯。早薨，无子。二十年，以沛王林子赞袭玹爵邑，早薨，无子。",
    locator: "本传",
    year: 211,
    displayYear: "211 后",
    title: "封西乡侯后早薨",
    summary: "曹玹建安十六年封西乡侯，早逝无子，后由曹林子曹赞、曹壹等奉其后。",
    roles: ["曹魏宗室", "济阳怀王"],
    personSummary: "曹玹，曹操子，建安十六年封西乡侯，早逝无子；太和年间追进爵号为济阳怀王。"
  },
  {
    personId: "cao-jun",
    sourceId: "sanguozhi-wei-cao-jun",
    chapterTitle: "陈留恭王峻传",
    displayName: "曹峻",
    summaryTitle: "历封至陈留恭王",
    quote: "陈留恭王峻字子安，建安二十一年封郿侯。二十二年，徙封襄邑。黄初二年，进爵为公。三年，为陈留王……甘露四年薨。",
    locator: "本传",
    year: 216,
    endYear: 259,
    displayYear: "216-259",
    title: "由郿侯至陈留王，甘露四年薨",
    summary: "曹峻字子安，建安二十一年封郿侯，后为陈留王，甘露四年去世。",
    roles: ["曹魏宗室", "陈留恭王"],
    personSummary: "曹峻，字子安，曹操子。建安二十一年封郿侯，黄初三年为陈留王，太和六年复封陈留，甘露四年去世。"
  },
  {
    personId: "cao-ju-fanyang",
    sourceId: "sanguozhi-wei-cao-ju-fanyang",
    chapterTitle: "范阳闵王矩传",
    displayName: "曹矩",
    summaryTitle: "早薨无子，追封范阳闵王",
    quote: "范阳闵王矩，早薨，无子。建安二十二年，以樊安公均子敏奉矩后，封临晋侯。",
    locator: "本传",
    year: 217,
    displayYear: "217 后",
    title: "早薨无子，曹敏奉后",
    summary: "曹矩早逝无子，建安二十二年以樊安公曹均之子曹敏奉其后，后追进为范阳闵王。",
    roles: ["曹魏宗室", "范阳闵王"],
    personSummary: "曹矩，曹操子，早逝无子。建安二十二年以曹敏奉其后，太和六年追进号为范阳闵王。"
  },
  {
    personId: "cao-gan",
    sourceId: "sanguozhi-wei-cao-gan",
    chapterTitle: "赵王干传",
    displayName: "曹干",
    summaryTitle: "幼年受曹丕优待，后封赵王",
    quote: "赵王干，建安二十年封高平亭侯……太和六年，改封赵王。干母有宠于太祖。及文帝为嗣，干母有力。文帝临崩，有遗诏，是以明帝常加恩意。",
    locator: "本传",
    year: 215,
    endYear: 232,
    displayYear: "215-232",
    title: "由高平亭侯至赵王",
    summary: "曹干建安二十年封高平亭侯，后历赖亭、弘农、燕公、河间王、钜鹿等封号，太和六年改封赵王；因曹丕遗诏，明帝常加恩意。",
    roles: ["曹魏宗室", "赵王"],
    personSummary: "曹干，曹操子，一名良。幼年丧母，又逢曹操病笃，曹丕因遗命亲待甚厚；太和六年改封赵王。"
  },
  {
    personId: "cao-shang",
    sourceId: "sanguozhi-wei-cao-shang",
    chapterTitle: "临邑殇公子上传",
    displayName: "曹上",
    summaryTitle: "早薨，无后",
    quote: "临邑殇公子上，早薨。太和五年，追封谥。无后。",
    locator: "本传",
    year: 231,
    displayYear: "231",
    title: "太和五年追封谥",
    summary: "曹上早逝，太和五年追封谥，传称无后。",
    roles: ["曹魏宗室", "临邑殇公子"],
    personSummary: "曹上，曹操子，早逝无后；太和五年追封谥为临邑殇公子。"
  },
  {
    personId: "cao-biao",
    sourceId: "sanguozhi-wei-cao-biao",
    chapterTitle: "楚王彪传",
    displayName: "曹彪",
    summaryTitle: "卷入王凌谋立案后被赐死",
    quote: "楚王彪字朱虎。建安二十一年，封寿春侯……嘉平元年，兖州刺史令狐愚与太尉王凌谋迎彪都许昌。语在凌传。乃遣傅及侍御史就国案验……使自图焉。",
    locator: "本传",
    year: 216,
    endYear: 251,
    displayYear: "216-251",
    title: "由寿春侯至楚王，后卷入王凌案",
    summary: "曹彪字朱虎，建安二十一年封寿春侯，太和六年改封楚；嘉平年间王凌、令狐愚谋迎曹彪都许昌，案发后曹彪被迫自尽。",
    roles: ["曹魏宗室", "楚王"],
    personSummary: "曹彪，字朱虎，曹操子。历封寿春侯、弋阳王、吴王、白马王、楚王；251 年因王凌、令狐愚谋立案被赐死。"
  },
  {
    personId: "cao-qin",
    sourceId: "sanguozhi-wei-cao-qin",
    chapterTitle: "刚殇公子勤传",
    displayName: "曹勤",
    summaryTitle: "早薨，无后",
    quote: "刚殇公子勤，早薨。太和五年追封谥。无后。",
    locator: "本传",
    year: 231,
    displayYear: "231",
    title: "太和五年追封谥",
    summary: "曹勤早逝，太和五年追封谥，传称无后。",
    roles: ["曹魏宗室", "刚殇公子"],
    personSummary: "曹勤，曹操子，早逝无后；太和五年追封谥为刚殇公子。"
  },
  {
    personId: "cao-cheng",
    sourceId: "sanguozhi-wei-cao-cheng",
    chapterTitle: "谷城殇公子乘传",
    displayName: "曹乘",
    summaryTitle: "早薨，无后",
    quote: "谷城殇公子乘，早薨。太和五年追封谥。无后。",
    locator: "本传",
    year: 231,
    displayYear: "231",
    title: "太和五年追封谥",
    summary: "曹乘早逝，太和五年追封谥，传称无后。",
    roles: ["曹魏宗室", "谷城殇公子"],
    personSummary: "曹乘，曹操子，早逝无后；太和五年追封谥为谷城殇公子。"
  },
  {
    personId: "cao-zheng",
    sourceId: "sanguozhi-wei-cao-zheng",
    chapterTitle: "郿戴公子整传",
    displayName: "曹整",
    summaryTitle: "封郿侯，建安二十三年薨",
    quote: "郿戴公子整，奉从叔父郎中绍后。建安二十二年，封郿侯。二十三年薨。无子。黄初二年追进爵，谥曰戴公。",
    locator: "本传",
    year: 217,
    endYear: 218,
    displayYear: "217-218",
    title: "封郿侯后次年薨",
    summary: "曹整奉从叔父郎中曹绍后，建安二十二年封郿侯，次年去世无子，黄初二年追进爵并谥戴公。",
    roles: ["曹魏宗室", "郿戴公子"],
    personSummary: "曹整，曹操子，奉从叔父曹绍后。建安二十二年封郿侯，二十三年去世无子，黄初二年追进爵、谥戴公。"
  },
  {
    personId: "cao-jing",
    sourceId: "sanguozhi-wei-cao-jing",
    chapterTitle: "灵殇公子京传",
    displayName: "曹京",
    summaryTitle: "早薨，无后",
    quote: "灵殇公子京，早薨。太和五年追封谥。无后。",
    locator: "本传",
    year: 231,
    displayYear: "231",
    title: "太和五年追封谥",
    summary: "曹京早逝，太和五年追封谥，传称无后。",
    roles: ["曹魏宗室", "灵殇公子"],
    personSummary: "曹京，曹操子，早逝无后；太和五年追封谥为灵殇公子。"
  },
  {
    personId: "cao-jun-fan",
    sourceId: "sanguozhi-wei-cao-jun-fan",
    chapterTitle: "樊安公均传",
    displayName: "曹均",
    summaryTitle: "奉叔父后，封樊侯",
    quote: "樊安公均，奉叔父蓟恭公彬后。建安二十二年，封樊侯。二十四年薨。子抗嗣。",
    locator: "本传",
    year: 217,
    endYear: 219,
    displayYear: "217-219",
    title: "封樊侯，建安二十四年薨",
    summary: "曹均奉叔父蓟恭公曹彬后，建安二十二年封樊侯，二十四年去世，其子曹抗嗣。",
    roles: ["曹魏宗室", "樊安公"],
    personSummary: "曹均，曹操子，奉叔父蓟恭公曹彬后。建安二十二年封樊侯，建安二十四年去世，后追进公爵。"
  },
  {
    personId: "cao-ji",
    sourceId: "sanguozhi-wei-cao-ji",
    chapterTitle: "广宗殇公子棘传",
    displayName: "曹棘",
    summaryTitle: "早薨，无后",
    quote: "广宗殇公子棘，早薨。太和五年追封谥。无后。",
    locator: "本传",
    year: 231,
    displayYear: "231",
    title: "太和五年追封谥",
    summary: "曹棘早逝，太和五年追封谥，传称无后。",
    roles: ["曹魏宗室", "广宗殇公子"],
    personSummary: "曹棘，曹操子，早逝无后；太和五年追封谥为广宗殇公子。"
  },
  {
    personId: "cao-hui",
    sourceId: "sanguozhi-wei-cao-hui",
    chapterTitle: "东平灵王徽传",
    displayName: "曹徽",
    summaryTitle: "封东平王，曾因属官殴吏被削户",
    quote: "东平灵王徽，奉叔公朗陵哀侯王后。建安二十二年，封历城侯……太和六年，改封东平。青龙二年，徽使官属檛寿张县吏，为有司所奏。诏削县一，户五百。其年复所削县。正始三年薨。",
    locator: "本传",
    year: 217,
    endYear: 242,
    displayYear: "217-242",
    title: "由历城侯至东平王",
    summary: "曹徽奉叔公朗陵哀侯后，建安二十二年封历城侯，太和六年改封东平；青龙二年曾因属官殴县吏被削户，正始三年去世。",
    roles: ["曹魏宗室", "东平灵王"],
    personSummary: "曹徽，曹操子，奉叔公朗陵哀侯后。历封历城侯、庐江王、寿张王，太和六年改封东平王，正始三年去世。"
  },
  {
    personId: "cao-mao-prince",
    sourceId: "sanguozhi-wei-cao-mao-prince",
    chapterTitle: "乐陵王茂传",
    displayName: "曹茂",
    summaryTitle: "少无宠，后封乐陵王",
    quote: "乐陵王茂，建安二十二年封万岁亭侯……茂性慠佷，少无宠于太祖。及文帝世，又独不王。太和元年，徙封聊城公，其年为王。",
    locator: "本传",
    year: 217,
    endYear: 244,
    displayYear: "217-244",
    title: "由万岁亭侯至乐陵王",
    summary: "曹茂建安二十二年封万岁亭侯，因性情骄很、少无宠于曹操，文帝时独不王；太和元年封聊城王，正始五年徙封乐陵。",
    roles: ["曹魏宗室", "乐陵王"],
    personSummary: "曹茂，曹操子。传称其性慠佷、少无宠于曹操，曹丕时独不王；曹叡时封聊城王，后徙封乐陵王。"
  },
  {
    personId: "cao-xie",
    sourceId: "sanguozhi-wei-cao-xie",
    chapterTitle: "赞哀王协传",
    displayName: "曹协",
    summaryTitle: "早薨，追改赞哀王",
    quote: "赞哀王协，早薨。太和五年追封谥曰经殇公。青龙二年，更追改号谥。三年，子殇王寻嗣。",
    locator: "本传",
    year: 231,
    endYear: 235,
    displayYear: "231-235",
    title: "追封经殇公，后改赞哀王",
    summary: "曹协早逝，太和五年追封谥经殇公，青龙二年更追改号谥，青龙三年由其子曹寻嗣。",
    roles: ["曹魏宗室", "赞哀王"],
    personSummary: "曹协，曹丕子，早逝。太和五年追封经殇公，青龙二年追改号谥为赞哀王。"
  },
  {
    personId: "cao-rui-prince",
    sourceId: "sanguozhi-wei-cao-rui-prince",
    chapterTitle: "北海悼王蕤传",
    displayName: "曹蕤",
    summaryTitle: "明帝即位后封阳平县王",
    quote: "北海悼王蕤，黄初七年，明帝即位，立为阳平县王。太和六年，改封北海。青龙元年薨。",
    locator: "本传",
    year: 226,
    endYear: 233,
    displayYear: "226-233",
    title: "封阳平县王，后改北海王",
    summary: "曹蕤在魏明帝即位后被立为阳平县王，太和六年改封北海，青龙元年去世。",
    roles: ["曹魏宗室", "北海悼王"],
    personSummary: "曹蕤，曹丕子。黄初七年魏明帝即位后立为阳平县王，太和六年改封北海，青龙元年去世。"
  },
  {
    personId: "cao-jian",
    sourceId: "sanguozhi-wei-cao-jian",
    chapterTitle: "东武阳怀王鉴传",
    displayName: "曹鉴",
    summaryTitle: "黄初六年立，其年薨",
    quote: "东武阳怀王鉴，黄初六年立。其年薨。青龙三年赐谥。无子。国除。",
    locator: "本传",
    year: 225,
    displayYear: "225",
    title: "立为东武阳王，当年薨",
    summary: "曹鉴黄初六年立为东武阳王，当年去世，青龙三年赐谥，无子国除。",
    roles: ["曹魏宗室", "东武阳怀王"],
    personSummary: "曹鉴，曹丕子。黄初六年立为东武阳王，当年去世，青龙三年赐谥，无子国除。"
  },
  {
    personId: "cao-lin-donghai",
    sourceId: "sanguozhi-wei-cao-lin-donghai",
    chapterTitle: "东海定王霖传",
    displayName: "曹霖",
    summaryTitle: "东海定王，曹髦之父",
    quote: "东海定王霖，黄初三年立为河东王。六年，改封馆陶县。明帝即位，以先帝遗意，爱宠霖异于诸国。而霖性粗暴，闺门之内，婢妾之间，多所残害。太和六年，改封东海。嘉平元年薨……高贵乡公髦，霖之子也，入继大宗。",
    locator: "本传",
    year: 222,
    endYear: 249,
    displayYear: "222-249",
    title: "由河东王改封东海，子曹髦入继大宗",
    summary: "曹霖黄初三年立为河东王，太和六年改封东海；传称其粗暴，嘉平元年去世，其子曹髦后来入继帝位。",
    roles: ["曹魏宗室", "东海定王", "曹髦之父"],
    personSummary: "曹霖，曹丕子，东海定王。黄初三年立为河东王，太和六年改封东海，嘉平元年去世；其子曹髦后入继曹魏帝位。"
  },
  {
    personId: "cao-li",
    sourceId: "sanguozhi-wei-cao-li",
    chapterTitle: "元城哀王礼传",
    displayName: "曹礼",
    summaryTitle: "由秦公至元城王",
    quote: "元城哀王礼，黄初二年封秦公，以京兆郡为国。三年，改为京兆王。六年，改封元城王。太和三年薨。",
    locator: "本传",
    year: 221,
    endYear: 229,
    displayYear: "221-229",
    title: "封秦公，后改元城王",
    summary: "曹礼黄初二年封秦公，以京兆郡为国，后改京兆王、元城王，太和三年去世。",
    roles: ["曹魏宗室", "元城哀王"],
    personSummary: "曹礼，曹丕子。黄初二年封秦公，以京兆郡为国，后改封京兆王、元城王，太和三年去世。"
  },
  {
    personId: "cao-yong",
    sourceId: "sanguozhi-wei-cao-yong",
    chapterTitle: "邯郸怀王邕传",
    displayName: "曹邕",
    summaryTitle: "由淮南公至邯郸王",
    quote: "邯郸怀王邕，黄初二年封淮南公，以九江郡为国。三年，进为淮南王。四年，改封陈。六年，改封邯郸。太和三年薨。",
    locator: "本传",
    year: 221,
    endYear: 229,
    displayYear: "221-229",
    title: "封淮南公，后改邯郸王",
    summary: "曹邕黄初二年封淮南公，以九江郡为国，后改淮南王、陈王、邯郸王，太和三年去世。",
    roles: ["曹魏宗室", "邯郸怀王"],
    personSummary: "曹邕，曹丕子。黄初二年封淮南公，后进淮南王，改封陈、邯郸，太和三年去世。"
  },
  {
    personId: "cao-gong",
    sourceId: "sanguozhi-wei-cao-gong",
    chapterTitle: "清河悼王贡传",
    displayName: "曹贡",
    summaryTitle: "黄初三年封，四年薨",
    quote: "清河悼王贡，黄初三年封。四年薨。无子。国除。",
    locator: "本传",
    year: 222,
    endYear: 223,
    displayYear: "222-223",
    title: "封清河王，次年薨",
    summary: "曹贡黄初三年受封，黄初四年去世，无子国除。",
    roles: ["曹魏宗室", "清河悼王"],
    personSummary: "曹贡，曹丕子，黄初三年封清河王，黄初四年去世，无子国除。"
  },
  {
    personId: "cao-yan",
    sourceId: "sanguozhi-wei-cao-yan",
    chapterTitle: "广平哀王俨传",
    displayName: "曹俨",
    summaryTitle: "黄初三年封，四年薨",
    quote: "广平哀王俨，黄初三年封。四年薨。无子。国除。",
    locator: "本传",
    year: 222,
    endYear: 223,
    displayYear: "222-223",
    title: "封广平王，次年薨",
    summary: "曹俨黄初三年受封，黄初四年去世，无子国除。",
    roles: ["曹魏宗室", "广平哀王"],
    personSummary: "曹俨，曹丕子，黄初三年封广平王，黄初四年去世，无子国除。"
  }
];

const relationEntries = [
  {
    id: "cao-cao-cao-ren-clan",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-ren",
    type: "clan-general",
    startYear: 190,
    endYear: 223,
    summary: "曹仁为曹操从弟，是曹操集团和曹魏早期最重要的宗亲方面统帅之一。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-ren", "本传开篇", "曹仁字子孝，太祖从弟也。")]
  },
  {
    id: "cao-cao-cao-hong-clan",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-hong",
    type: "clan-general",
    startYear: 190,
    endYear: 232,
    summary: "曹洪为曹操从弟，荥阳败后曾让马救曹操，后长期为曹魏宗亲重臣。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-hong", "本传开篇", "曹洪字子廉，太祖从弟也。")]
  },
  {
    id: "cao-cao-cao-xiu-clan",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-xiu",
    type: "clan-general",
    startYear: 190,
    endYear: 228,
    summary: "曹休为曹操族子，少孤北归后受曹操赏识，被称为“吾家千里驹”。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-xiu", "早年归曹操", "太祖谓左右曰：“此吾家千里驹也。”")]
  },
  {
    id: "cao-cao-cao-zhen-clan",
    sourcePersonId: "cao-cao",
    targetPersonId: "cao-zhen",
    type: "adoptive-clan",
    startYear: 190,
    endYear: 220,
    summary: "曹真少孤后被曹操收养，与曹丕同处，成为曹魏西线宗亲将领。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-zhen", "本传开篇", "太祖哀真少孤，收养与诸子同，使与文帝共止。")]
  },
  {
    id: "cao-pi-cao-fang-succession",
    sourcePersonId: "cao-pi",
    targetPersonId: "cao-fang",
    type: "dynastic-successor",
    startYear: 239,
    endYear: 254,
    summary: "曹芳为曹魏第三代以后少帝，承魏明帝后即位，名义上延续曹丕所开曹魏帝统。",
    sourceRefs: [sourceRef("sanguozhi-wei-qi-wang", "景初三年正月", "景初三年正月丁亥朔，帝甚病，乃立为皇太子。是日，即皇帝位。")]
  },
  {
    id: "cao-lin-donghai-cao-mao-family",
    sourcePersonId: "cao-lin-donghai",
    targetPersonId: "cao-mao",
    type: "family",
    startYear: 241,
    endYear: 260,
    summary: "曹髦为东海定王曹霖之子，曹芳被废后入继帝位。",
    sourceRefs: [sourceRef("sanguozhi-wei-gaogui-xianggong", "本纪开篇", "高贵乡公讳髦，字彦士，文帝孙，东海定王霖子也。")]
  },
  {
    id: "cao-yu-cao-huan-family",
    sourcePersonId: "cao-yu",
    targetPersonId: "cao-huan",
    type: "family",
    startYear: 246,
    endYear: 302,
    summary: "曹奂为燕王曹宇之子，曹髦死后入继曹魏帝位，后禅位于晋。",
    sourceRefs: [sourceRef("sanguozhi-wei-chenliu-wang", "本纪开篇", "陈留王讳奂，字景明，武帝孙，燕王宇子也。")]
  },
  {
    id: "cao-mao-sima-zhao-conflict",
    sourcePersonId: "cao-mao",
    targetPersonId: "sima-zhao",
    type: "political-conflict",
    startYear: 260,
    endYear: 260,
    summary: "曹髦因不满司马昭权势日盛而亲自出讨，最终被弑。",
    sourceRefs: [sourceRef("sanguozhi-wei-gaogui-xianggong", "甘露五年五月", "司马昭之心，路人所知也。吾不能坐受废辱，今日当与卿等自出讨之。")]
  },
  {
    id: "cao-huan-sima-yan-abdication",
    sourcePersonId: "cao-huan",
    targetPersonId: "sima-yan",
    type: "abdication",
    startYear: 265,
    endYear: 265,
    summary: "曹奂咸熙二年禅位于晋王司马炎，曹魏结束。",
    sourceRefs: [sourceRef("sanguozhi-wei-chenliu-wang", "咸熙二年十二月", "使使者奉皇帝玺绶册，禅位于晋嗣王，如汉魏故事。")]
  },
  {
    id: "cao-biao-wang-ling-plot",
    sourcePersonId: "cao-biao",
    targetPersonId: "wang-ling",
    type: "political-plot",
    startYear: 249,
    endYear: 251,
    summary: "王凌与令狐愚曾谋迎楚王曹彪都许昌，案发后曹彪被迫自尽。",
    sourceRefs: [sourceRef("sanguozhi-wei-cao-biao", "嘉平元年", "嘉平元年，兖州刺史令狐愚与太尉王凌谋迎彪都许昌。")]
  }
];

const sourceMentions = readJson("data/china-source-mentions.json");
const personLifeEvents = readJson("data/china-person-life-events.json");
const personRelations = readJson("data/china-person-relations.json");
const persons = readJson("data/china-persons.json");
const coveragePlan = readJson("data/cao-wei-person-coverage-plan.json");

const mentionStats = { added: 0, updated: 0 };
const lifeEventStats = { added: 0, updated: 0 };
const relationStats = { added: 0, updated: 0 };

const allRecords = [
  ...importantRecords.flatMap((record) =>
    record.events.map((event) => ({
      ...event,
      personId: record.personId,
      sourceId: record.sourceId,
      chapterTitle: record.chapterTitle,
      mentionId: `mention-${record.sourceId.replace("sanguozhi-wei-", "sgz-wei-")}-${event.key}`,
      eventId: `${record.personId}-${event.key}`,
      mentionedPersonIds: event.mentionedPersonIds || [record.personId]
    }))
  ),
  ...shortPrinceRecords.map((record) => ({
    ...record,
    key: "record",
    mentionId: `mention-${record.sourceId.replace("sanguozhi-wei-", "sgz-wei-")}-record`,
    eventId: `${record.personId}-royal-house-record`,
    type: "office",
    mentionedPersonIds: [record.personId, "cao-cao"],
    tags: ["宗室", "封国", "武文世王公传"]
  }))
];

for (const record of allRecords) {
  mentionStats[
    upsertById(
      sourceMentions,
      mention({
        id: record.mentionId,
        sourceId: record.sourceId,
        chapterTitle: record.chapterTitle,
        locator: record.locator,
        year: record.year ?? null,
        text: record.quote,
        mentionedPersonIds: record.mentionedPersonIds,
        tags: record.tags || ["宗室"]
      })
    )
  ] += 1;

  lifeEventStats[
    upsertById(
      personLifeEvents,
      lifeEvent({
        id: record.eventId,
        personId: record.personId,
        year: record.year ?? null,
        endYear: record.endYear,
        displayYear: record.displayYear,
        type: record.type,
        title: record.title,
        summary: record.summary,
        sourceMentionIds: [record.mentionId],
        sourceId: record.sourceId,
        locator: record.locator,
        quote: record.quote,
        confidence: record.confidence || "high",
        approximate: record.approximate,
        note: record.note
      })
    )
  ] += 1;
}

const seedIdsToRemove = new Set([
  "cao-fang-wei-shu-source-seed",
  "cao-mao-wei-shu-source-seed",
  "cao-huan-wei-shu-source-seed",
  "cao-hong-wei-shu-source-seed",
  ...shortPrinceRecords.map((record) => `${record.personId}-wei-shu-source-seed`)
]);
let removedSeeds = 0;
for (let index = personLifeEvents.length - 1; index >= 0; index -= 1) {
  if (seedIdsToRemove.has(personLifeEvents[index].id)) {
    personLifeEvents.splice(index, 1);
    removedSeeds += 1;
  }
}

for (const relation of relationEntries) {
  relationStats[upsertById(personRelations, relation)] += 1;
}

const personUpdates = new Map();
for (const record of importantRecords) {
  personUpdates.set(record.personId, record.personUpdate);
}
for (const record of shortPrinceRecords) {
  personUpdates.set(record.personId, {
    summary: record.personSummary,
    roles: record.roles,
    coverageStatus: "partial"
  });
}

for (const person of persons) {
  const update = personUpdates.get(person.id);
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
        note: "已完成曹操、曹丕、曹叡三代本纪第一轮，曹魏宗室线第一轮，以及宗室/帝室剩余核心人物第二轮。"
      }
    : phase
);

const batch = {
  id: "wei-cao-royal-house-pass-2",
  title: "曹魏宗室与后期帝室第二轮",
  status: "done",
  personIds: [...importantRecords.map((record) => record.personId), ...shortPrinceRecords.map((record) => record.personId)],
  note: "补全曹芳、曹髦、曹奂、曹仁、曹洪、曹休、曹真，以及武文世王公传剩余宗室诸王的来源摘录、年表节点、摘要和关键关系。"
};
const existingBatchIndex = coveragePlan.currentBatches.findIndex((item) => item.id === batch.id);
if (existingBatchIndex >= 0) {
  coveragePlan.currentBatches[existingBatchIndex] = batch;
} else {
  coveragePlan.currentBatches.push(batch);
}

coveragePlan.caoRoyalHousePass2 = {
  updatedAt: "2026-06-22",
  sourceIds: [...new Set(allRecords.map((record) => record.sourceId))],
  sourceMentionIds: allRecords.map((record) => record.mentionId),
  lifeEventIds: allRecords.map((record) => record.eventId),
  relationIds: relationEntries.map((relation) => relation.id),
  limitation: "本轮以《三国志·魏书》本纪和宗室本传为主；短传诸王只按可证封爵、徙封、薨卒和坐事记录，不强行扩写。曹芳、曹髦、曹奂仍需后续与《资治通鉴》逐年互校。"
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
      removedSeeds,
      peopleUpdated: personUpdates.size
    },
    null,
    2
  )
);
