export const xinTransitionProfileId = "china-western-han-xin-transition--8-24-v1";
export const xinTransitionBatchId = "semantic-china-western-han-xin-transition--8-24-v1";
export const xinTransitionPeriodId = "china-western-han-xin-transition--8-24";

export const xinTransitionCanonicalPeople = [
  {
    id: "han-liu-ao-chengdi",
    name: "刘骜",
    aliases: ["汉成帝", "漢成帝", "成帝"],
    deathYear: -7,
    primaryPolity: "西汉",
    summary: "西汉成帝；本轮仅建立与驾崩事件所需的稳定身份，完整生平待人物专题补全。",
  },
  {
    id: "han-liu-xin-aidi",
    name: "刘欣",
    aliases: ["汉哀帝", "漢哀帝", "哀帝"],
    deathYear: -1,
    primaryPolity: "西汉",
    summary: "西汉哀帝；本轮仅建立与驾崩事件所需的稳定身份，完整生平待人物专题补全。",
  },
  {
    id: "han-liu-xing-zhongshan",
    name: "刘兴",
    aliases: ["中山王兴", "中山王興"],
    deathYear: -8,
    primaryPolity: "西汉",
    summary: "汉宗室中山王刘兴；身份据《汉书》本期纪年事件稳定绑定。",
  },
  {
    id: "han-liu-kan-pingdi",
    name: "刘衎",
    aliases: ["汉平帝", "漢平帝", "平帝", "中山王"],
    birthYear: -9,
    deathYear: 5,
    primaryPolity: "西汉",
    summary: "西汉平帝刘衎；即位前以中山王身份被迎入中枢。",
  },
  {
    id: "han-liu-xuan-gengshi",
    name: "刘玄",
    aliases: ["圣公", "聖公", "更始帝"],
    deathYear: 25,
    primaryPolity: "更始政权",
    summary: "更始帝刘玄；本轮据拥立事件建立稳定身份，完整生平待人物专题补全。",
  },
  {
    id: "han-empress-fu-aidi",
    name: "傅氏",
    aliases: ["傅皇后", "哀帝傅皇后"],
    deathYear: -1,
    primaryPolity: "西汉",
    summary: "汉哀帝皇后傅氏；史料在本期事件中以氏族称谓记载。",
  },
];

const chronology = (year, expression, sourceContext) => ({
  year,
  expression,
  sourceContext,
  method: "chapter-sequence",
  confidence: "high",
});

export const xinTransitionCandidateRepairs = [
  {
    cardId: "card:official-history-semantic:202e1443fb5a37d5e91f9965",
    disposition: "reject",
    reason: "泛泛官制调整且没有可确认的事件主体。",
  },
  {
    cardId: "card:official-history-semantic:23fbda128e659334c09535e1",
    disposition: "reject",
    reason: "单名“景”无法稳定消歧。",
  },
  {
    cardId: "card:official-history-semantic:d2add5e49cc66e8a1a4f872e",
    disposition: "context",
    reason: "保留大赦纪年证据，不单独晋级为人物事件。",
  },
  {
    cardId: "card:official-history-semantic:d99f9a364481eca92cf43887",
    disposition: "promote",
    matchedEventId: "official-history-event:eae8045a44d8f520cebd",
    title: "中山王刘兴去世",
    personBindings: [
      { personId: "han-liu-xing-zhongshan", canonicalName: "刘兴", sourceNames: ["中山王兴", "中山王興"] },
    ],
    reason: "宗室王死亡，人物和纪年均明确。",
  },
  {
    cardId: "card:official-history-semantic:eae58a5b5f9a86d921df6ea5",
    disposition: "reject",
    reason: "受封继承人未具名，无法生成稳定人物卡。",
  },
  {
    cardId: "card:official-history-semantic:5a5e9f957daa20d1bb74a7b8",
    disposition: "promote",
    title: "傅氏被立为皇后",
    personBindings: [
      { personId: "han-empress-fu-aidi", canonicalName: "傅氏", sourceNames: ["傅氏"] },
    ],
    reason: "皇后册立事件明确。",
  },
  {
    cardId: "card:official-history-semantic:c616fe3e3192df48af7cbcfc",
    disposition: "promote",
    matchedEventId: "official-history-event:657c875b8f46f18548e9",
    title: "汉成帝去世",
    personBindings: [
      { personId: "han-liu-ao-chengdi", canonicalName: "刘骜", sourceNames: ["成帝", "汉成帝", "漢成帝"] },
    ],
    reason: "帝王死亡事件和绥和二年纪年明确。",
  },
  {
    cardId: "card:official-history-semantic:fa58ecbf994b41aba0e7630d",
    disposition: "reject",
    reason: "“满”为单名且身份不明，不晋级封侯事件。",
  },
  {
    cardId: "card:official-history-semantic:0789c9e7f2809c32f7ca2b52",
    disposition: "promote",
    title: "汉哀帝去世",
    personBindings: [
      { personId: "han-liu-xin-aidi", canonicalName: "刘欣", sourceNames: ["哀帝", "汉哀帝", "漢哀帝"] },
    ],
    reason: "帝王死亡事件和元寿二年纪年明确。",
  },
  {
    cardId: "card:official-history-semantic:bb23c7be9f9719f9272f8163",
    disposition: "context",
    chronology: chronology(1, "元始元年", "《汉书·平帝纪》元始元年条；“元寿二年”是追述横征发生时间，不是偿还行动时间。"),
    reason: "政策执行主体只可由纪年上下文推定，保留为背景证据。",
  },
  {
    cardId: "card:official-history-semantic:c126e969ff369371f4489fb5",
    disposition: "context",
    chronology: chronology(-1, "元寿二年", "《汉书·平帝纪》哀帝崩后、平帝即位前的同年纪事。"),
    reason: "具体惩处记录保留为人物背景，不扩展为主事件。",
  },
  {
    cardId: "card:official-history-semantic:c97aa17055a319fe31c61fa6",
    disposition: "promote",
    title: "王舜与左咸迎中山王刘衎",
    personBindings: [
      { personId: "han-liu-kan-pingdi", canonicalName: "刘衎", sourceNames: ["中山王"] },
    ],
    reason: "迎立前置行动、参与者和对象均可确认。",
  },
  {
    cardId: "card:official-history-semantic:d8629a48a9391f774caf9a85",
    disposition: "promote",
    chronology: chronology(2, "元始二年", "《汉书·平帝纪》元始二年条，位于“二年春”后、“三年春”前。"),
    reason: "招降行动、执行者和对象明确。",
  },
  {
    cardId: "card:official-history-semantic:156a765b7da81e86d7afcb1f",
    disposition: "promote",
    title: "王莽受封安汉公",
    chronology: chronology(1, "元始元年", "《汉书·平帝纪》元始元年条。"),
    matchedEventId: "china-1-wang-mang-ankhan",
    reason: "与既有正式事件相同，绑定原文证据而不新建重复事件。",
  },
  {
    cardId: "card:official-history-semantic:181204b809d9cc075ee1ea4d",
    disposition: "promote",
    title: "王莽代汉建新",
    matchedEventId: "china-9-wang-mang-usurps-han",
    reason: "与既有正式事件相同，绑定原文证据而不新建重复事件。",
  },
  {
    cardId: "card:official-history-semantic:8cd29cc40dea780465639862",
    disposition: "promote",
    reason: "人物、建国五年纪年和死亡事实明确。",
  },
  {
    cardId: "card:official-history-semantic:a34b2e29e6a2845a5e48d8c1",
    disposition: "context",
    reason: "县宰与吕母之子均未具名，作为吕母起事背景保留。",
  },
  {
    cardId: "card:official-history-semantic:acfc5d6cbfc7f153a942238d",
    disposition: "context",
    reason: "保留天凤元年大赦纪年证据，不单独晋级。",
  },
  {
    cardId: "card:official-history-semantic:6507ff71a3894a4a3437a79b",
    disposition: "context",
    reason: "保留地皇元年大赦纪年证据，不单独晋级。",
  },
  {
    cardId: "card:official-history-semantic:0e17d79f34278b28a634594b",
    disposition: "promote",
    title: "刘玄被拥立为帝",
    personBindings: [
      { personId: "han-liu-xuan-gengshi", canonicalName: "刘玄", sourceNames: ["圣公", "聖公"] },
    ],
    reason: "拥立、改元和参与人物均明确。",
  },
  {
    cardId: "card:official-history-semantic:f90113b9535c4cee3518012a",
    disposition: "context",
    reason: "与刘玄被拥立为帝属于同一政权建立过程，避免拆成重复事件。",
  },
  {
    cardId: "card:official-history-semantic:2be1ec4efb3f4f1f609be7e4",
    disposition: "context",
    chronology: chronology(6, "居摄元年", "《汉书·王莽传上》章内由居摄元年顺承至居摄二年之前。"),
    reason: "年代可定，但毁宅属于刘崇谋反后的惩戒细节。",
  },
  {
    cardId: "card:official-history-semantic:66358937a7bbf7425600654d",
    disposition: "promote",
    chronology: chronology(6, "居摄元年", "《汉书·王莽传上》章内由居摄元年顺承至居摄二年之前。"),
    reason: "集体封赏、主体和地域明确。",
  },
  {
    cardId: "card:official-history-semantic:53710f9c3a5dc5bc3c7caed5",
    disposition: "promote",
    title: "王莽遣十二将攻匈奴",
    chronology: chronology(10, "始建国二年", "《汉书·王莽传中》章内始建国二年纪事顺承。"),
    reason: "十二将分十道出兵，行动、主体和进军方向明确。",
  },
  {
    cardId: "card:official-history-semantic:96abd14e291ad7aeb08629b1",
    disposition: "promote",
    chronology: chronology(13, "始建国五年", "《汉书·王莽传中》载此事后称次年改元天凤。"),
    reason: "焉耆反叛并杀都护但钦，事件边界明确。",
  },
  {
    cardId: "card:official-history-semantic:3b01878e80a282602e451590",
    disposition: "context",
    chronology: chronology(21, "地皇二年", "《汉书·王莽传下》章内地皇二年纪事顺承。"),
    reason: "年代可定，但转运粮饷缺少明示行动主体，仅作军事背景。",
  },
  {
    cardId: "card:official-history-semantic:2f1d764d51727217e26aac13",
    disposition: "promote",
    chronology: chronology(23, "更始元年", "《后汉书·刘玄刘盆子列传》更始政权建立后的同年纪事。"),
    reason: "王匡攻洛阳，主客体和地点明确。",
  },
  {
    cardId: "card:official-history-semantic:715328d2b5b6861220c21e72",
    disposition: "promote",
    title: "申屠建与李松攻武关",
    chronology: chronology(23, "更始元年", "《后汉书·刘玄刘盆子列传》更始政权建立后的同年纪事。"),
    reason: "两名将领、攻击目标和地点明确。",
  },
];
