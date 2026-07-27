import {
  extractExplicitOfficialHistoryPeople,
  findPlaceMentions,
  isJinPrincelyTitlePersonOverlap,
} from "./china-official-history-reference-resolver.mjs";
import { createChinaRegnalSequenceResolver } from "./china-regnal-sequence-resolver.mjs";
import { createOfficialHistoryPersonSequenceResolver } from "./china-official-history-person-sequence-resolver.mjs";
import {
  isOfficialHistoryCommentaryText,
  normalizeOfficialHistoryEventTitle,
} from "./china-official-history-promotion-policy.mjs";
import { isolateOfficialHistoryNarrativeText } from "./official-history-source-cleaning.mjs";

const commonClassifiers = [
  {
    factType: "military",
    label: "军事",
    keywords: ["兵", "军", "軍", "战", "戰", "攻", "击", "擊", "伐", "讨", "討", "征", "破", "围", "圍", "守", "拒", "降", "斩", "斬", "杀", "殺", "害", "败", "敗", "走", "屯", "拔", "掠", "略", "寇", "陷", "叛", "反"],
  },
  {
    factType: "succession",
    label: "继承与政权",
    keywords: ["即位", "即皇帝位", "卽皇帝位", "立为", "立為", "立", "嗣", "崩", "薨", "卒", "禅", "禪", "受禅", "受禪", "称帝", "稱帝", "称王", "稱王", "太子", "废", "廢", "诛", "誅", "践阼", "踐阼", "改元", "元服"],
  },
  {
    factType: "administration",
    label: "内政与任官",
    keywords: ["拜", "迁", "遷", "除", "表", "辟", "举", "舉", "署", "领", "領", "封", "诏", "詔", "令", "赦", "置", "设", "設", "失火", "火灾", "火災", "阁火", "閣火", "刻石", "禁锢", "禁錮", "下狱", "下獄", "捕系", "捕繫", "卖官", "賣官", "太守", "刺史", "将军", "將軍", "丞相", "都督", "郡", "县", "縣"],
  },
  {
    factType: "diplomacy",
    label: "外交与边疆",
    keywords: ["使", "遣", "盟", "和", "约", "約", "质", "質", "归", "歸", "降", "纳", "納", "附", "连", "連", "结", "結", "贡献", "貢獻", "内属", "內屬", "通好", "修好", "单于", "單于", "匈奴", "西域", "羌", "鲜卑", "鮮卑"],
  },
  {
    factType: "elite_network",
    label: "士人网络",
    keywords: ["与", "从", "友", "客", "门下", "宾客", "荐", "称", "善", "奇", "知", "见", "会", "语"],
  },
  {
    factType: "service",
    label: "仕宦经历",
    keywords: ["为", "历", "仕", "事", "从事", "功曹", "主簿", "郎", "掾", "令", "长", "参军"],
  },
];

const commonStopNameTokens = [
  "中国",
  "天子",
  "将军",
  "太守",
  "刺史",
  "丞相",
  "尚书",
  "侍中",
  "都督",
  "校尉",
  "太子",
  "皇帝",
  "单于",
  "匈奴",
  "西域",
  "郡国",
  "功曹",
  "主簿",
];

const explicitCollectiveConflictPattern = /(?:(?:蛮夷|蠻夷|蛮|蠻|羌|氐|夷|乌桓|烏桓|鲜卑|鮮卑|匈奴|西域|高句骊|高句麗|夫余|夫餘|濊貊|秽貊|馬韓|马韩)[^，。；]{0,16}(?:反叛|叛乱|叛亂|叛|反|寇|攻|围|圍|侵扰|侵擾)|[\p{Script=Han}]{2,10}(?:谋反|謀反)|[\p{Script=Han}]{2,16}(?:击|擊|讨|討|伐).{0,10}(?:蛮|蠻|羌|氐|夷|乌桓|烏桓|鲜卑|鮮卑|匈奴)|[\p{Script=Han}]{1,8}贼起[^。；]{0,12}攻[\p{Script=Han}]{1,8})/u;
const explicitLocativeBattlePattern = /(?:围|圍)[^，。；]{1,12}(?:于|於)[^，。；]{1,12}，大破之/u;
const explicitCollectiveDiplomacyPattern = /(?:[\p{Script=Han}]{1,8}国|[\p{Script=Han}]{1,8}國|徼外国|徼外國|蛮夷|蠻夷|蛮|蠻|夷)[^。；]{0,20}(?:遣使[^。；]{0,8}(?:贡献|貢獻)|重译贡献|重譯貢獻|相率内属|相率內屬|来朝|來朝)/u;
const explicitInstitutionalActionPattern = /(?:立.{0,12}(?:皇后|太子)|皇后.{0,6}(?:废|廢)|(?:始|初)(?:置|设|設|开|開).{1,18}(?:学|學|官|署|邸)|(?:罢|罷).{1,18}(?:郡|官|陵|刺史)|(?:更置|改置).{0,8}(?:州牧|刺史)|(?:尚书|尚書)(?:员|員)|御史大夫.{0,8}(?:大司空)|(?:賢良文學|贤良文学)[^。；]{0,24}(?:疾苦|鹽鐵|盐铁)|(?:議罷|议罢)(?:鹽鐵|盐铁)(?:榷酤)?|(?:诏|詔)[^。；]{0,30}(?:刻石|禁锢|禁錮)|(?:大举|大舉)(?:钩党|鉤黨)|(?:卖官|賣官)|(?:捕系|捕繫)(?:太学诸生|太學諸生)|(?:下狱|下獄)|(?:弃市|棄市)|自(?:称|稱).{0,10}太子[^。；]{0,16}(?:斩|斬)|帝加元服|(?:設|设)常平倉|(?:講|讲)五經同異|宣室閣火|立皇子.{0,10}(?:为|為).{0,8}王|(?:复|復).{0,18}(?:盐铁官|鹽鐵官|博士弟子)|西羌平|孝宣皇帝葬杜陵|(?:昭儀|昭仪)趙氏害(?:後宮|后宫)皇子)/u;

export function isExplicitCollectiveOfficialHistoryAction({ sentence, classification } = {}) {
  const text = String(sentence ?? "");
  if (classification?.factType === "military") {
    return explicitCollectiveConflictPattern.test(text) || explicitLocativeBattlePattern.test(text);
  }
  if (classification?.factType === "diplomacy") {
    return explicitCollectiveConflictPattern.test(text) || explicitCollectiveDiplomacyPattern.test(text);
  }
  return false;
}

export function isExplicitInstitutionalOfficialHistoryAction({ sentence, classification } = {}) {
  return ["succession", "administration", "military", "service"].includes(classification?.factType)
    && explicitInstitutionalActionPattern.test(String(sentence ?? ""));
}

export function topicIdForOfficialHistoryFactType(factType) {
  if (factType === "military") {
    return "military";
  }
  if (factType === "elite_network") {
    return "elite_network";
  }
  if (["succession", "administration", "diplomacy", "service"].includes(factType)) {
    return "political_structure";
  }
  return "source_criticism";
}

export function macroEventForWork(workTitle) {
  return (classification) => {
    if (classification.factType === "military") {
      return `${workTitle}军事候选`;
    }
    if (classification.factType === "succession") {
      return `${workTitle}政权继承候选`;
    }
    if (classification.factType === "diplomacy") {
      return `${workTitle}外交边疆候选`;
    }
    if (classification.factType === "administration") {
      return `${workTitle}任官内政候选`;
    }
    return `${workTitle}人物事件候选`;
  };
}

export function sectionFromRules(title, rules, fallbackLabel) {
  for (const rule of rules) {
    if (rule.pattern.test(title)) {
      return { type: rule.type, label: rule.label };
    }
  }
  return { type: "source", label: fallbackLabel };
}

export function officialHistoryCandidateTitle(sentence, people, classification) {
  const preferredNames = people.flatMap((person) => [person.name, person.matched]).filter(Boolean);
  const title = normalizeOfficialHistoryEventTitle(
    sentence,
    sentence,
    classification.factType,
    classification.eventScale,
    preferredNames,
  );
  if (!title) {
    const locativeBattle = sentence.match(/(?:围|圍)[^，。；]{1,12}(?:于|於)([^，。；]{1,12})，大破之/u);
    if (locativeBattle) return `${locativeBattle[1]}之战`;
    const decisiveVictory = sentence.match(/大破([\p{Script=Han}]{2,5})(?:，|。|$)/u);
    if (decisiveVictory) {
      const actionIndex = decisiveVictory.index ?? sentence.length;
      const actor = people.find((person) => {
        const surface = compactSemanticPersonSurface(person);
        const matchIndex = surface ? sentence.indexOf(surface) : -1;
        return matchIndex >= 0 && matchIndex < actionIndex;
      });
      if (actor?.name) return `${actor.name}大破${decisiveVictory[1]}`;
    }
    if (/(?:^|[，、])(?:帝|皇帝)(?:崩|驾崩|駕崩)(?:于|於|，|。|$)/u.test(sentence)) return "皇帝驾崩";
    if (/(?:即|卽)皇帝位/u.test(sentence)) return "皇帝即位";
    return null;
  }
  if (people.some((person) => [person.name, person.matched].some((name) => name && title.includes(name)))) return title;
  const actionIndex = sentence.search(/起兵|举兵|興兵|兴兵|反叛|谋叛|謀叛|讨|討|伐|攻|击|擊|围|圍|破|败|敗|斩|斬|杀|殺|诛|誅|降|即位|称|稱|废|廢|封|徙封|进爵|進爵/u);
  if (actionIndex < 0 || !/^(?:封|徙封|进爵|進爵)/u.test(title)) return title;
  const actor = people.find((person) => {
    const matched = compactSemanticPersonSurface(person);
    const matchIndex = matched ? sentence.indexOf(matched) : -1;
    return matchIndex >= 0 && matchIndex < actionIndex;
  });
  return actor?.name ? `${actor.name}${title}` : title;
}

function compactSemanticPersonSurface(person) {
  return String(person?.matched ?? person?.name ?? "").trim();
}

export function createOfficialHistoryExtractorConfig(options) {
  const workTitle = options.workTitle;
  return {
    regionId: "china",
    promotionProfile: "china-official-history-v1",
    chronologySystem: "china-regnal",
    excludeQuotedContinuations: true,
    minSentenceLength: 5,
    createSentenceChronologyResolver: ({ eras }) => createChinaRegnalSequenceResolver(eras, options.regnalSequenceOptions),
    classifiers: commonClassifiers,
    stopNameTokens: new Set([...commonStopNameTokens, ...(options.extraStopNameTokens ?? [])]),
    sourceSectionType: (title) => sectionFromRules(title, options.sectionRules ?? [], workTitle),
    candidateNarrativeText: (sentence) => isolateOfficialHistoryNarrativeText(sentence, { minimumLength: 5 }),
    rejectSentence: (sentence) => isOfficialHistoryCommentaryText(sentence),
    allowMinorWithoutPeople: (context) => (
      isExplicitCollectiveOfficialHistoryAction(context)
      || isExplicitInstitutionalOfficialHistoryAction(context)
    ),
    candidateTitle: officialHistoryCandidateTitle,
    discoverPeople: (sentence, knownPeople, context) => extractExplicitOfficialHistoryPeople(
      sentence,
      knownPeople.flatMap((person) => [person.name, person.matched]).filter(Boolean),
      {
        contextKey: context.source.id,
        excludedNames: context.places?.flatMap((place) => [place.label, ...(place.aliases ?? [])]) ?? [],
      },
    ),
    findPlaces: (sentence, placeRecords) => findPlaceMentions(sentence, placeRecords),
    macroEventForClassification: macroEventForWork(workTitle),
    topicIdForFactType: topicIdForOfficialHistoryFactType,
    reviewGuidance: "machine-candidate; merge duplicate/similar events and verify source context before promotion",
    reviewQuestions: ["核对人物是否为核心参与者", "合并同一事件的多条表述", "必要时补充精确年份、地点、起因、经过、结果"],
    stripPatterns: [
      /^(首页|经部|史部|子部|集部|专题|今人新著|目录页|下一页)\s*/u,
      /国学导航\s*/gu,
      /^(?:汉书|漢書|后汉书|晋书|三国志)?卷[一二三四五六七八九十百上下\d]+(?:\s+|　+)[^。！？；;\n]{0,70}(?:\s+|　+)/u,
    ],
    scaleBoostPattern: /(天下|天子|帝|王|丞相|州|郡|大军|诸侯|都督|受禅|称帝|官渡|赤壁|夷陵|汉中|荆州|益州|关中|辽东|淮南|洛阳|长安|匈奴|西域|永嘉|八王|五胡)/u,
    ...options,
  };
}

const hanshuExtraStopNameTokens = [
  "汉书", "漢書", "武帝", "孝武皇帝", "昭帝", "孝昭皇帝", "建元", "元光", "元朔", "元狩", "元鼎", "元封",
  "太初", "天汉", "天漢", "太始", "征和", "后元", "後元", "始元", "元凤", "元鳳", "元平",
  "宣帝", "孝宣皇帝", "本始", "地节", "地節", "元康", "神爵", "五凤", "五鳳", "甘露", "黄龙", "黃龍",

  "元帝", "孝元皇帝", "初元", "永光", "建昭", "竟宁", "竟寧",
  "成帝", "孝成皇帝", "建始", "河平", "阳朔", "陽朔", "鸿嘉", "鴻嘉", "永始", "元延", "绥和", "綏和",
];

const hanshuSectionRules = [
  { pattern: /纪|紀/u, type: "annal", label: "纪" },
  { pattern: /志/u, type: "treatise", label: "志" },
  { pattern: /表/u, type: "table", label: "表" },
  { pattern: /传|傳/u, type: "biography", label: "列传" },
];

function hanshuCandidateNarrativeText(sentence) {
  const quotedAction = String(sentence ?? "").match(
    /(?:其)?立[\p{Script=Han}]{1,8}(?:为|為)皇太子|其(?:罢|罷)[\p{Script=Han}]{1,8}(?:，[^。」”]{0,32})?/u,
  );
  if (quotedAction) return quotedAction[0];
  return isolateOfficialHistoryNarrativeText(sentence, { minimumLength: 5 });
}

function hanshuCandidateTitle(sentence, people, classification) {
  if (/匈奴入上谷/u.test(sentence) && /衛青|卫青/u.test(sentence) && /龍城|龙城/u.test(sentence)) return "卫青龙城之战";
  if (/馬邑谷中|马邑谷中/u.test(sentence) && /誘致單于|诱致单于/u.test(sentence)) return "马邑之谋";
  if (/數河南地|收復河南地|收复河南地/u.test(sentence) && /置朔方/u.test(sentence)) return "汉收复河南地并置朔方五原郡";
  if (/衛青|卫青/u.test(sentence) && /河南地/u.test(sentence) && /朔方/u.test(sentence)) return "卫青收复河南地";
  if (/衛青|卫青/u.test(sentence) && /龍城|龙城/u.test(sentence)) return "卫青龙城之战";
  if (/衛青|卫青/u.test(sentence) && /六將軍|六将军/u.test(sentence) && /朔方|高闕|高阙/u.test(sentence)) return "卫青出朔方击匈奴";
  if (/霍去病/u.test(sentence) && /隴西|陇西|皋蘭|皋兰/u.test(sentence)) return "霍去病河西之战";
  if (/衛青|卫青/u.test(sentence) && /去病|霍去病/u.test(sentence) && /定襄|代郡|幕北|絕幕|绝幕/u.test(sentence)) return "漠北之战";
  if (/置五經博士|置五经博士/u.test(sentence)) return "置五经博士";
  if (/初令郡國舉孝廉|初令郡国举孝廉/u.test(sentence)) return "郡国始举孝廉";
  if (/立皇后上官氏/u.test(sentence)) return "立上官氏为皇后";
  if (/賢良文學|贤良文学/u.test(sentence) && /民所疾苦/u.test(sentence)) return "诏问贤良文学民所疾苦";
  if (/(?:議罷|议罢)(?:鹽鐵|盐铁)(?:榷酤)?/u.test(sentence)) return "盐铁会议";
  if (/罷榷酤官|罢榷酤官/u.test(sentence)) return "罢榷酤官";
  if (/罷儋耳、?真番郡|罢儋耳、?真番郡/u.test(sentence)) return "撤销儋耳、真番郡";
  if (/蘇武|苏武/u.test(sentence) && /十九歲乃還|十九岁乃还/u.test(sentence)) return "苏武归汉";
  if (/武都氐人反/u.test(sentence)) return "武都氐人反叛";
  if (/遼東烏桓反|辽东乌桓反/u.test(sentence) && /范明友/u.test(sentence)) return "范明友出击辽东乌桓";
  if (/自稱衛太子|自称卫太子/u.test(sentence) && /要斬|要斩/u.test(sentence)) return "张延年冒充卫太子被诛";
  if (/帝加元服/u.test(sentence)) return "昭帝加元服";
  if (/立(?:倢伃)?許氏為皇后|立(?:倢伃)?许氏为皇后/u.test(sentence)) return "许皇后册立";
  if (/立皇后霍氏/u.test(sentence)) return "霍皇后册立";
  if (/立皇太子/u.test(sentence)) return "皇太子册立";
  if (/大司馬大將軍光薨|大司马大将军光薨/u.test(sentence)) return "霍光去世";
  if (/大司馬霍禹謀反|大司马霍禹谋反/u.test(sentence)) return "霍禹等谋反汉廷";
  if (/河東霍徵史等謀反|河东霍征史等谋反/u.test(sentence)) return "霍征史等谋反汉廷";
  if (/西羌反/u.test(sentence)) return "西羌叛乱";
  if (/西羌反/u.test(sentence) && /趙充國|赵充国/u.test(sentence)) return "赵充国等平西羌叛乱";
  if (/趙充國|赵充国/u.test(sentence) && /擊西羌|击西羌/u.test(sentence)) return "赵充国与许延寿出击西羌";
  if (/日逐王先賢撣|日逐王先贤掸/u.test(sentence) && /來降|来降/u.test(sentence)) return "匈奴日逐王先贤掸归降汉廷";
  if (/置西域都護|置西域都护/u.test(sentence)) return "汉置西域都护";
  if (/鄭吉迎日逐|郑吉迎日逐/u.test(sentence) && /破車師|破车师/u.test(sentence)) return "郑吉迎日逐王并破车师";
  if (/設常平倉|设常平仓/u.test(sentence)) return "汉设常平仓";
  if (/詔諸儒講五經同異|诏诸儒讲五经同异/u.test(sentence)) return "汉廷召开五经异同会议";
  if (/呼韓邪單于|呼韩邪单于/u.test(sentence) && /朝天子/u.test(sentence)) return "呼韩邪单于入朝";
  if (/未央宮宣室閣火|未央宫宣室阁火/u.test(sentence)) return "未央宫宣室阁失火";
  if (/帝崩于未央宮|帝崩于未央宫/u.test(sentence)) return "皇帝驾崩于未央宫";
  if (/孝宣皇帝葬杜陵/u.test(sentence)) return "汉宣帝葬于杜陵";
  if (/立皇后王氏|立皇後王氏/u.test(sentence)) return "王政君册立为皇后";
  if (/封皇太后兄.{0,12}王舜.{0,4}安平侯/u.test(sentence)) return "王舜封安平侯";
  if (/立廣陵厲王太子霸|立广陵厉王太子霸/u.test(sentence)) return "刘霸封广陵王";
  if (/立長沙煬王弟宗|立长沙炀王弟宗/u.test(sentence)) return "刘宗封长沙王";
  if (/西羌反/u.test(sentence) && /馮奉世|冯奉世/u.test(sentence)) return "冯奉世率军出击西羌";
  if (/西羌平[^。；]{0,8}軍罷|西羌平[^。；]{0,8}军罢/u.test(sentence)) return "西羌叛乱平定";
  if (/罷.{0,40}鹽鐵官.{0,8}常平倉|罢.{0,40}盐铁官.{0,8}常平仓/u.test(sentence)) return "汉廷罢盐铁官与常平仓";
  if (/復鹽鐵官.{0,8}博士弟子員|复盐铁官.{0,8}博士弟子员/u.test(sentence)) return "汉廷恢复盐铁官与博士弟子员";
  if (/河間王元.{0,8}廢遷房陵|河间王元.{0,8}废迁房陵/u.test(sentence)) return "河间王刘元被废迁房陵";
  if (/太皇太后上官氏崩|太皇太後上官氏崩/u.test(sentence)) return "上官太皇太后去世";
  if (/丞相玄成薨/u.test(sentence)) return "韦玄成去世";
  if (/中山王竟薨/u.test(sentence)) return "中山王刘竟去世";
  if (/虖韓邪單于|虖韩邪单于/u.test(sentence) && /來朝|来朝/u.test(sentence)) return "呼韩邪单于来朝汉廷";
  if (/罷中書宦官|罢中书宦官/u.test(sentence) && /尚書員五人|尚书员五人/u.test(sentence)) return "汉廷罢中书宦官并增置尚书";
  if (/王莽/u.test(sentence) && /新都侯/u.test(sentence)) return "王莽封新都侯";
  if (/立皇后趙氏|立皇后赵氏/u.test(sentence)) return "赵飞燕册立为皇后";
  if (/其罷昌陵|其罢昌陵/u.test(sentence)) return "汉成帝罢建昌陵";
  if (/立欣(?:為|为)皇太子/u.test(sentence)) return "刘欣被立为皇太子";
  if (/御史大夫(?:為|为)大司空/u.test(sentence)) return "汉廷改御史大夫为大司空";
  if (/罷部刺史|罢部刺史/u.test(sentence) && /州牧/u.test(sentence)) return "汉廷罢刺史改置州牧";
  if (/昭儀趙氏害後宮皇子|昭仪赵氏害后宫皇子/u.test(sentence)) return "赵昭仪残害后宫皇子";
  return officialHistoryCandidateTitle(sentence, people, classification);
}

export function createHanshuExtractorConfig(overrides = {}) {
  return createOfficialHistoryExtractorConfig({
    batchId: "auto-hanshu-person-event-candidates",
    candidatePrefix: "hanshu-auto-candidate",
    cardPrefix: "card:hanshu-auto",
    filePrefix: "hanshu-auto-file",
    workTitle: "汉书",
    quotedWork: "汉书",
    defaultAuthor: "班固",
    sourceWhereSql: "s.id LIKE 'hanshu-guoxue123-%' OR s.title LIKE '%汉书%' OR s.title LIKE '%漢書%'",
    sourceRoot: "sqlite:sources/source_passages:hanshu-guoxue123-%",
    corpusHint: "china-western-han",
    collectionHint: "hanshu-person-event-candidates",
    periodHint: "china-western-han--202--9",
    notes: "Rule-based full-pass extraction of Hanshu person/event candidates. Candidates are not reviewed facts and must be merged before promotion.",
    personRange: { startYear: -206, endYear: 23 },
    createSentencePersonResolver: () => createOfficialHistoryPersonSequenceResolver(),
    candidateNarrativeText: hanshuCandidateNarrativeText,
    quotedContinuationPattern: /(?:其)?立[\p{Script=Han}]{1,8}(?:为|為)皇太子|其(?:罢|罷)[\p{Script=Han}]{1,8}/u,
    candidateTitle: hanshuCandidateTitle,
    ...overrides,
    extraStopNameTokens: [...hanshuExtraStopNameTokens, ...(overrides.extraStopNameTokens ?? [])],
    sectionRules: overrides.sectionRules ?? hanshuSectionRules,
  });
}

const houhanshuExtraStopNameTokens = [
  "后汉书", "後漢書", "光武帝", "明帝", "章帝", "和帝", "殇帝", "殤帝", "安帝", "顺帝", "順帝",
  "冲帝", "沖帝", "质帝", "質帝", "桓帝", "灵帝", "靈帝", "献帝", "獻帝", "建武", "中元",
  "永平", "建初", "元和", "章和", "永元", "元兴", "元興", "延平", "永初", "元初", "永宁", "永寧",
  "建光", "延光", "永建", "阳嘉", "陽嘉", "永和", "汉安", "漢安", "建康", "永憙", "永喜", "本初", "建和",
  "和平", "元嘉", "永兴", "永興", "永寿", "永壽", "延熹", "永康", "建宁", "建寧", "熹平", "光和",
  "中平", "初平", "建安",
];

const houhanshuSectionRules = [
  { pattern: /纪|紀/u, type: "annal", label: "纪" },
  { pattern: /志/u, type: "treatise", label: "志" },
  { pattern: /列传|列傳|传|傳/u, type: "biography", label: "列传" },
];

export function createHouhanshuExtractorConfig(overrides = {}) {
  return createOfficialHistoryExtractorConfig({
    batchId: "auto-houhanshu-person-event-candidates",
    candidatePrefix: "houhanshu-auto-candidate",
    cardPrefix: "card:houhanshu-auto",
    filePrefix: "houhanshu-auto-file",
    workTitle: "后汉书",
    quotedWork: "后汉书",
    defaultAuthor: "范晔",
    sourceWhereSql: "s.id LIKE 'houhanshu%' OR s.title LIKE '%后汉书%' OR s.citation_short LIKE '%后汉书%'",
    sourceRoot: "sqlite:sources/source_passages:houhanshu%",
    corpusHint: "china-eastern-han",
    collectionHint: "houhanshu-person-event-candidates",
    periodHint: "china-eastern-han",
    notes: "Rule-based full-pass extraction of Houhanshu person/event candidates. Candidates are not reviewed facts and must be merged before promotion.",
    personRange: { startYear: 0, endYear: 230 },
    createSentencePersonResolver: () => createOfficialHistoryPersonSequenceResolver(),
    ...overrides,
    extraStopNameTokens: [...houhanshuExtraStopNameTokens, ...(overrides.extraStopNameTokens ?? [])],
    sectionRules: overrides.sectionRules ?? houhanshuSectionRules,
  });
}

const jinshuExtraStopNameTokens = [
  "晋书", "晉書", "武帝", "惠帝", "怀帝", "懷帝", "愍帝", "元帝", "明帝", "成帝",
  "康帝", "穆帝", "哀帝", "废帝", "廢帝", "简文帝", "簡文帝", "孝武帝", "安帝", "恭帝",
  "泰始", "咸宁", "咸寧", "太康", "太熙", "永熙", "永平", "元康", "永康", "永宁", "永寧",
  "太安", "永安", "建武", "永兴", "永興", "光熙", "永嘉", "建兴", "建興",
];

const jinshuSectionRules = [
  { pattern: /帝纪|帝紀|纪|紀/u, type: "annal", label: "纪" },
  { pattern: /志/u, type: "treatise", label: "志" },
  { pattern: /载记|載記/u, type: "record", label: "载记" },
  { pattern: /列传|列傳|传|傳/u, type: "biography", label: "列传" },
];

export function createJinshuExtractorConfig(overrides = {}) {
  return createOfficialHistoryExtractorConfig({
    batchId: "auto-jinshu-person-event-candidates",
    candidatePrefix: "jinshu-auto-candidate",
    cardPrefix: "card:jinshu-auto",
    filePrefix: "jinshu-auto-file",
    workTitle: "晋书",
    quotedWork: "晋书",
    defaultAuthor: "房玄龄等",
    sourceWhereSql: "s.id LIKE 'jinshu%' OR s.title LIKE '%晋书%' OR s.citation_short LIKE '%晋书%'",
    sourceRoot: "sqlite:sources/source_passages:jinshu%",
    corpusHint: "china-jin",
    collectionHint: "jinshu-person-event-candidates",
    periodHint: "china-jin",
    notes: "Rule-based full-pass extraction of Jinshu person/event candidates. Candidates are not reviewed facts and must be merged before promotion.",
    personRange: { startYear: 220, endYear: 430 },
    createSentencePersonResolver: () => createOfficialHistoryPersonSequenceResolver(),
    ...overrides,
    rejectPersonMatch: overrides.rejectPersonMatch ?? isJinPrincelyTitlePersonOverlap,
    extraStopNameTokens: [...jinshuExtraStopNameTokens, ...(overrides.extraStopNameTokens ?? [])],
    sectionRules: overrides.sectionRules ?? jinshuSectionRules,
  });
}
