export const easternHan126144ProfileId = "china-eastern-han-25-183-v1";
export const easternHan126144BatchId = "auto-houhanshu-eastern-han-126-144-candidates";
export const easternHan126144PeriodId = "china-eastern-han-25-184";
export const easternHan126144Generator = "official-history-candidate-repair:eastern-han-126-144-v1";

const card = (suffix) => `card:houhanshu-eastern-han-126-144:${suffix}`;
const binding = (personId, canonicalName, sourceNames = [canonicalName]) => ({
  personId,
  canonicalName,
  sourceNames,
});
const chronology = (year, expression, sourceContext) => ({
  year,
  expression,
  method: "editorial-relative-year",
  confidence: "high",
  sourceContext,
});
const context = (suffix, reason = "该条属于纪年、宗室谱系、例行制度或重复证据，保留作上下文而不单独晋级。") => ({
  cardId: card(suffix),
  disposition: "context",
  reason,
});
const reject = (suffix, reason) => ({ cardId: card(suffix), disposition: "reject", reason });
const promote = (suffix, title, options = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: options.reason ?? "主体、动作与精确纪年均可由《后汉书》原文直接核定。",
  ...(options.personBindings?.length ? { personBindings: options.personBindings } : {}),
  ...(options.matchedEventId ? { matchedEventId: options.matchedEventId } : {}),
  ...(options.chronology ? { chronology: options.chronology } : {}),
  ...(options.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
});
const collective = (suffix, title, reason) => promote(suffix, title, {
  allowCollectiveEvent: true,
  reason: reason ?? "集体主体、动作、地点与精确纪年明确，可作为独立事件晋级。",
});

export const easternHan126144CanonicalPeople = [
  {
    id: "official-history-person-78fe98fe3305c05d",
    name: "马贤",
    deathYear: 141,
    primaryPolity: "东汉",
    summary: "东汉护羌校尉、征西将军；顺帝时期长期参与西北羌乱作战，永和六年兵败射姑山。",
  },
  {
    id: "eh-liu-xian-jinan",
    name: "刘显",
    aliases: ["济南王显"],
    primaryPolity: "东汉",
    summary: "东汉宗室，济南王刘错之子；永建元年受封济南王。",
  },
  {
    id: "official-history-person-6b52cd03128cde86",
    name: "李超",
    aliases: ["代郡太守李超"],
    deathYear: 126,
    primaryPolity: "东汉",
    summary: "东汉代郡太守；永建元年抵御鲜卑入寇时战死。",
  },
  {
    id: "eh-qizhijian-xianbei",
    name: "其至鞬",
    aliases: ["鲜卑其至鞬", "鮮卑其至鞬"],
    primaryPolity: "鲜卑",
    summary: "东汉顺帝初年的鲜卑首领，永建元年入寇代郡。",
  },
  {
    id: "eh-jiatenu-cheshi",
    name: "加特奴",
    aliases: ["车师后王加特奴", "車師後王加特奴", "后部王加特奴", "後部王加特奴"],
    primaryPolity: "车师后部",
    summary: "车师后部王农奇之子；与班勇及车师后部军参与对北匈奴作战。",
  },
  {
    id: "eh-bahua-cheshi",
    name: "八滑",
    primaryPolity: "车师后部",
    summary: "《后汉书》所载车师后部人物，永建元年随班勇、加特奴击北匈奴呼衍王。",
  },
  {
    id: "eh-fangqian-khotan",
    name: "放前",
    aliases: ["于窴王放前", "于阗王放前", "于闐王放前"],
    primaryPolity: "于阗",
    summary: "东汉顺帝时期于窴王；永建四年杀拘弥王兴并干预拘弥王位。",
  },
  {
    id: "eh-xing-jumi",
    name: "拘弥王兴",
    aliases: ["拘彌王興", "兴", "興"],
    deathYear: 129,
    primaryPolity: "拘弥",
    summary: "东汉顺帝时期拘弥王，永建四年被于窴王放前杀害。",
  },
  {
    id: "eh-ban-shi",
    name: "班始",
    aliases: ["定远侯班始", "定遠侯班始"],
    deathYear: 130,
    primaryPolity: "东汉",
    summary: "班超之孙、定远侯；永建五年因杀阴城公主被腰斩。",
  },
  {
    id: "eh-yincheng-princess",
    name: "阴城公主",
    aliases: ["陰城公主"],
    deathYear: 130,
    primaryPolity: "东汉",
    summary: "汉顺帝之姑、班始之妻；永建五年被班始杀害。",
  },
  {
    id: "eh-bian-yediao",
    name: "叶调王便",
    aliases: ["葉調王便", "便"],
    primaryPolity: "叶调",
    summary: "日南徼外叶调国王；永建六年遣使向汉廷贡献。",
  },
  {
    id: "eh-xu-you-dunhuang",
    name: "徐由",
    aliases: ["敦煌太守徐由"],
    primaryPolity: "东汉",
    summary: "东汉敦煌太守；阳嘉元年遣疏勒王臣槃攻于窴。",
  },
  {
    id: "eh-chen-pan-shule",
    name: "臣槃",
    aliases: ["疏勒王臣槃"],
    primaryPolity: "疏勒",
    summary: "东汉顺帝时期疏勒王，阳嘉元年奉徐由之命率军攻于窴。",
  },
  {
    id: "eh-cheng-guo-jumi",
    name: "成国",
    aliases: ["成國"],
    primaryPolity: "拘弥",
    summary: "拘弥王兴宗人；阳嘉元年于窴战事后被立为拘弥王。",
  },
  {
    id: "official-history-person-50a6d709ce737409",
    name: "耿晔",
    aliases: ["度辽将军耿晔", "度遼將軍耿曄"],
    primaryPolity: "东汉",
    summary: "东汉度辽将军，顺帝时期参与乌桓、鲜卑边防作战。",
  },
  {
    id: "eh-rong-zhugui",
    name: "戎朱廆",
    aliases: ["乌桓亲汉都尉戎朱廆", "烏桓親漢都尉戎朱廆"],
    primaryPolity: "乌桓",
    summary: "乌桓亲汉都尉；阳嘉元年受耿晔派遣出塞袭击鲜卑。",
  },
  {
    id: "eh-duogui-wuhuan",
    name: "咄归",
    aliases: ["咄歸"],
    primaryPolity: "乌桓",
    summary: "乌桓率众王侯；阳嘉元年随戎朱廆出塞击鲜卑。",
  },
  {
    id: "eh-zeng-jing",
    name: "曾旌",
    primaryPolity: "东汉",
    summary: "阳嘉元年入寇会稽的海上武装首领。",
  },
  {
    id: "eh-zhang-he",
    name: "章河",
    primaryPolity: "东汉",
    summary: "阳嘉元年在扬州六郡活动的武装首领。",
  },
  {
    id: "official-history-person-11c9c7df8019f5d9",
    name: "王稠",
    primaryPolity: "东汉",
    summary: "东汉匈奴中郎将；阳嘉二年率左骨都侯等击破鲜卑。",
  },
  {
    id: "eh-ou-lian-xianglin",
    name: "区怜",
    aliases: ["區憐"],
    primaryPolity: "象林徼外",
    summary: "永和二年率众攻象林县的日南、象林徼外首领。",
  },
  {
    id: "official-history-person-6c0d1e3b46a6cf4a",
    name: "蔡伯流",
    primaryPolity: "东汉",
    summary: "永和三年寇九江、广陵，后率众向徐州刺史应志投降。",
  },
  {
    id: "official-history-person-a56a4c6d872a8c43",
    name: "应志",
    aliases: ["徐州刺史应志", "應志"],
    primaryPolity: "东汉",
    summary: "东汉徐州刺史，永和三年接受蔡伯流等投降。",
  },
  {
    id: "official-history-person-18ebb3cd6bb0812d",
    name: "刘安",
    aliases: ["济北王安", "濟北王安"],
    primaryPolity: "东汉",
    summary: "济北惠王刘寿之子，永和四年被封为济北王。",
  },
  {
    id: "official-history-person-b8fe39f5ca606a8c",
    name: "马续",
    primaryPolity: "东汉",
    summary: "东汉度辽将军，永和五年击破南匈奴左部吾斯、车纽叛乱。",
  },
  {
    id: "official-history-person-25cf53433a470d33",
    name: "陈龟",
    aliases: ["陳龜"],
    primaryPolity: "东汉",
    summary: "东汉匈奴中郎将，永和五年在平定南匈奴左部叛乱时迫杀南单于。",
  },
  {
    id: "eh-julong-wusi",
    name: "句龙吾斯",
    aliases: ["句龍吾斯", "吾斯"],
    deathYear: 143,
    primaryPolity: "南匈奴左部",
    summary: "南匈奴左部大人，汉安元年反叛，汉安二年被马寔遣人刺杀。",
  },
  {
    id: "eh-cheniu-xiongnu",
    name: "车纽",
    aliases: ["車紐"],
    primaryPolity: "南匈奴左部",
    summary: "与句龙吾斯共同反叛的南匈奴左部人物，永和五年被马续击破。",
  },
  {
    id: "official-history-person-465de035ccd9eaf2",
    name: "郭璜",
    deathYear: 141,
    primaryPolity: "东汉",
    summary: "东汉安定太守；马贤兵败射姑山后下狱死。",
  },
  {
    id: "official-history-person-dd6db36df6eafb6a",
    name: "赵冲",
    primaryPolity: "东汉",
    summary: "东汉武威太守、护羌校尉，永和末至汉安年间参与多次羌乱作战。",
  },
  {
    id: "official-history-person-bc529a93bb87074c",
    name: "张贡",
    primaryPolity: "东汉",
    summary: "东汉汉阳太守，汉安二年与赵冲击破烧何羌。",
  },
  {
    id: "official-history-person-300e9b2ba4155018",
    name: "马寔",
    primaryPolity: "东汉",
    summary: "东汉匈奴中郎将，汉安、建康年间平定南匈奴左部叛乱。",
  },
  {
    id: "eh-zhang-ying-guangling",
    name: "张婴",
    aliases: ["張嬰"],
    primaryPolity: "东汉",
    summary: "汉安元年寇广陵郡县的武装首领。",
  },
  {
    id: "eh-fan-rong",
    name: "范容",
    primaryPolity: "东汉",
    summary: "建康元年与周生等在扬州、徐州一带寇掠城邑。",
  },
  {
    id: "eh-zhou-sheng",
    name: "周生",
    primaryPolity: "东汉",
    summary: "建康元年与范容等在扬州、徐州一带寇掠城邑。",
  },
  {
    id: "eh-feng-she",
    name: "冯赦",
    aliases: ["馮赦", "御史中丞冯赦", "御史中丞馮赦"],
    primaryPolity: "东汉",
    summary: "东汉御史中丞，建康元年奉命督州郡兵讨范容、周生等。",
  },
  {
    id: "eh-liu-bing-chongdi",
    name: "刘炳",
    aliases: ["劉炳", "汉冲帝", "漢沖帝", "冲帝", "沖帝"],
    birthYear: 143,
    deathYear: 145,
    primaryPolity: "东汉",
    summary: "东汉冲帝刘炳；建康元年被立为皇太子并于顺帝去世后即位。",
  },
  {
    id: "official-history-person-1b0ea875f85c1a90",
    name: "夏方",
    aliases: ["交址刺史夏方"],
    primaryPolity: "东汉",
    summary: "东汉交址刺史，建康元年招降攻烧日南城邑的蛮夷。",
  },
  {
    id: "official-history-person-e0ae3495f7696537",
    name: "刘康",
    deathYear: 144,
    primaryPolity: "东汉",
    summary: "东汉零陵太守，建康元年因杀害无辜下狱死。",
  },
];

export const easternHan126144CandidateRepairs = [
  context("2b13187b95616ff28fdab171", "受封者仅以亲属集合出现，无法建立稳定人物和事件标题。"),
  promote("490c939cdb76c93c66f221df", "马贤击破陇西钟羌于临洮", {
    personBindings: [binding("official-history-person-78fe98fe3305c05d", "马贤")],
  }),
  context("4ac006939f2b7f3c78c1e290", "仅说明顺帝即位纪年，所指即位发生于上一时期。"),
  promote("820853b7832904af1e486f9e", "封刘显为济南王", {
    personBindings: [binding("eh-liu-xian-jinan", "刘显", ["刘显", "济南王显"])],
  }),
  promote("9da228c9ffdd5fa9c16bcd20", "李超抗击鲜卑战死", {
    personBindings: [binding("official-history-person-6b52cd03128cde86", "李超")],
  }),
  promote("caa8f5298e671479310b0b2a", "李超抗击鲜卑战死", {
    personBindings: [
      binding("official-history-person-6b52cd03128cde86", "李超"),
      binding("eh-qizhijian-xianbei", "其至鞬", ["其至鞬", "鲜卑其至鞬"]),
    ],
    reason: "与本纪同年条为同一事件，传记补出鲜卑首领其至鞬。",
  }),
  promote("b6b91e2e5f07d4094c9c8325", "班勇与加特奴击破北匈奴呼衍王", {
    personBindings: [
      binding("eh-ban-yong", "班勇"),
      binding("eh-jiatenu-cheshi", "加特奴", ["加特奴", "后王农奇子加特奴"]),
      binding("eh-bahua-cheshi", "八滑"),
    ],
  }),
  promote("454a876359e09ab3642c4561", "班勇击降焉耆", {
    personBindings: [binding("eh-ban-yong", "班勇")],
  }),
  context("b56ae993623417939a016947"),
  collective("895de3f2e84221f994a574ab", "鲜卑寇辽东与玄菟"),
  context("cd57c5178da010565bc885fb"),
  context("6d3699bb43190bd1f5690ade"),
  collective("798e1eef7b61943440b0796a", "鲜卑寇渔阳"),
  promote("9c58fddd215e4be527a96057", "于窴王放前杀拘弥王兴", {
    personBindings: [
      binding("eh-fangqian-khotan", "放前", ["放前", "于窴王放前"]),
      binding("eh-xing-jumi", "拘弥王兴", ["兴", "拘弥王兴"]),
    ],
  }),
  promote("eec0fb443a71d410b53e9b31", "班始杀阴城公主案", {
    personBindings: [
      binding("eh-ban-shi", "班始", ["班始", "定远侯班始"]),
      binding("eh-yincheng-princess", "阴城公主"),
    ],
  }),
  promote("376e3fc4d3ced9276f151138", "叶调王便遣使朝贡汉廷", {
    personBindings: [binding("eh-bian-yediao", "叶调王便", ["便", "叶调王便"])],
  }),
  context("938e0e3e20d1eec1fcaf0c11"),
  promote("236ce7cd1f604d963e77328a", "徐由遣臣槃攻破于窴", {
    personBindings: [
      binding("eh-xu-you-dunhuang", "徐由"),
      binding("eh-chen-pan-shule", "臣槃", ["臣槃", "疏勒王臣槃"]),
      binding("eh-cheng-guo-jumi", "成国"),
    ],
  }),
  promote("9e38f583dbe83f2fc69e6655", "耿晔遣戎朱廆与咄归出塞击鲜卑", {
    personBindings: [
      binding("official-history-person-50a6d709ce737409", "耿晔"),
      binding("eh-rong-zhugui", "戎朱廆"),
      binding("eh-duogui-wuhuan", "咄归"),
    ],
  }),
  promote("1a965c9101bf77861e8dcc43", "曾旌等寇会稽", {
    personBindings: [binding("eh-zeng-jing", "曾旌")],
  }),
  promote("87f25aced2dafa0c3a18b4c5", "章河等寇掠扬州六郡", {
    personBindings: [binding("eh-zhang-he", "章河")],
  }),
  context("a8f68bf5d69c29d05a5b23aa", "例行大赦与改元记录，作为纪年背景保留。"),
  context("cbf72834de27c0485a5e9bb0"),
  reject("8c2306b4528b7448a703fd14", "动物伤人被军事分类且句尾混入地理注文，不属于当前人物事件晋级范围。"),
  promote("db1efe18f7ae1f8f496b0943", "王稠率左骨都侯等击鲜卑", {
    matchedEventId: "official-history-event:a6efaf02f8573080f118",
    personBindings: [binding("official-history-person-11c9c7df8019f5d9", "王稠")],
  }),
  context("8a47a3aace937060ea9ec3d8", "耿氏后裔绍封和任侍中属于宗室、官职履历，不单独晋级。"),
  promote("8c76e837da7236933e35e9ab", "耿晔追击云中乌桓失利", {
    chronology: chronology(135, "明年", "阳嘉三年之后的“明年”，对应阳嘉四年。"),
    personBindings: [binding("official-history-person-50a6d709ce737409", "耿晔")],
    reason: "传记以阳嘉三年为锚点记“明年”，与阳嘉四年乌桓寇云中条相互印证。",
  }),
  collective("cbe8e81416192e464b5bafaf", "种羌寇陇西"),
  promote("cad43031d1754ce8239f3dc8", "加特奴击破北匈奴于阊吾陆谷", {
    personBindings: [binding("eh-jiatenu-cheshi", "加特奴")],
  }),
  promote("978a65437e8eb2ef3f349b1a", "加特奴击破北匈奴于阊吾陆谷", {
    personBindings: [binding("eh-jiatenu-cheshi", "加特奴", ["加特奴", "后部王加特奴"])],
    reason: "本纪与西域传所载时间、参战者和战果一致，合并为同一事件。",
  }),
  collective("568cf8af11867327b082fb83", "武都屯羌攻破屯官"),
  promote("1bdc854d7b0bc36d7593c7c6", "耿晔追击云中乌桓失利", {
    personBindings: [binding("official-history-person-50a6d709ce737409", "耿晔")],
  }),
  context("4f172b596456b692bf4143c2"),
  context("f965cbfaf4d975635e03c3fa"),
  context("1c2eac4604a4cba5404aebeb", "与同年耿晔追击乌桓条重复，短记仅保留作旁证。"),
  context("d1d5744ba20b694c333e4a6e", "代词“其王”依赖传记上文，使用本纪明确的夫余王来朝条晋级。"),
  collective("735e1c6356a2443ffb334c6d", "夫余王来朝汉廷"),
  promote("cf575db40e2e8bb0bbf19d7c", "区怜等攻陷象林县", {
    personBindings: [binding("eh-ou-lian-xianglin", "区怜")],
  }),
  collective("54e08b9158161339190afe9f", "武陵蛮围充县并寇夷道"),
  context("55a76c701a0eea4f447ecfb8"),
  context("757e267e7ed497d0ff5ad949", "例行三公薨逝记录不作为本阶段主事件晋级。"),
  context("e44b75b2a8d4998b8d26a503", "与区怜等攻象林所处同一日南动乱背景，短记不另建重复事件。"),
  context("39a9db47513d1515f88b961e", "地震与山崩保留作灾异背景，不进入当前人物事件晋级范围。"),
  promote("2060cc58d8b6a84e451cd22b", "蔡伯流转寇九江与广陵", {
    personBindings: [binding("official-history-person-6c0d1e3b46a6cf4a", "蔡伯流")],
  }),
  promote("f3f569d966d8d2234f745784", "蔡伯流等率众向应志投降", {
    matchedEventId: "official-history-event:6071f052d69481e6e7fd",
    personBindings: [
      binding("official-history-person-6c0d1e3b46a6cf4a", "蔡伯流"),
      binding("official-history-person-a56a4c6d872a8c43", "应志"),
    ],
  }),
  context("ec04cbb2591dd103c5bb37a9"),
  promote("e3333eb635b8fa8c7df7ab59", "马贤击破烧当羌于金城", {
    personBindings: [binding("official-history-person-78fe98fe3305c05d", "马贤")],
  }),
  promote("13807c1cc821d62fe1d2f0da", "马贤讨烧当羌", {
    matchedEventId: "official-history-event:9729c40552d929556c4c",
    personBindings: [binding("official-history-person-78fe98fe3305c05d", "马贤")],
  }),
  context("ad99f07cd6e12337b06478a8", "例行大赦记录不单独晋级。"),
  promote("8b47a554f228413be6adf6f9", "封刘安为济北王", {
    personBindings: [binding("official-history-person-18ebb3cd6bb0812d", "刘安", ["刘安", "济北王安"])],
  }),
  context("11b7bafb9faa73547a13fe21"),
  promote("6f4be1d99f5285aca2d987be", "马续击破吾斯与车纽叛军", {
    matchedEventId: "official-history-event:e90b96ead02e73149682",
    personBindings: [
      binding("official-history-person-b8fe39f5ca606a8c", "马续"),
      binding("official-history-person-25cf53433a470d33", "陈龟"),
      binding("eh-julong-wusi", "句龙吾斯", ["吾斯", "句龙吾斯"]),
      binding("eh-cheniu-xiongnu", "车纽"),
    ],
  }),
  promote("21a35e43b83e8c527a87882d", "马贤击西羌救援安定失利", {
    personBindings: [binding("official-history-person-78fe98fe3305c05d", "马贤")],
  }),
  promote("8990d7f489b86f18d4e5c8ac", "马贤兵败射姑山", {
    personBindings: [
      binding("official-history-person-78fe98fe3305c05d", "马贤"),
      binding("official-history-person-465de035ccd9eaf2", "郭璜"),
    ],
  }),
  collective("d9883048e1dbdd6c6fdb5737", "巩唐羌寇陇西及三辅"),
  promote("033c8d923cda8253f704dbfc", "赵冲讨巩唐羌", {
    matchedEventId: "official-history-event:4c0c24803def38571896",
    personBindings: [binding("official-history-person-dd6db36df6eafb6a", "赵冲")],
  }),
  context("428782a45fe46eb9e08b86c9"),
  context("82058771730638f5de063b72"),
  collective("716f4fe4fd07a20440119eae", "诸种羌寇武威"),
  context("74ef3a968331a8649eb59708", "例行大赦与改元汉安记录，作为纪年背景保留。"),
  promote("5faff95ffac6354ea8c61595", "张婴等寇掠广陵郡县", {
    personBindings: [binding("eh-zhang-ying-guangling", "张婴")],
  }),
  promote("9eb327a17f3b5ab648ce8d7c", "赵冲与张贡击烧何羌于参龻", {
    matchedEventId: "official-history-event:95a3a1f932b689738d87",
    personBindings: [
      binding("official-history-person-dd6db36df6eafb6a", "赵冲"),
      binding("official-history-person-bc529a93bb87074c", "张贡"),
    ],
  }),
  promote("b2e640b6b4b700d97e071842", "赵冲击烧当羌于阿阳", {
    matchedEventId: "official-history-event:c3d76f7ade1de81ea34a",
    personBindings: [binding("official-history-person-dd6db36df6eafb6a", "赵冲")],
  }),
  promote("551339d28c7346998cbc6a12", "马寔遣人刺杀句龙吾斯", {
    matchedEventId: "official-history-event:3c8bec2662f7fd580134",
    personBindings: [
      binding("official-history-person-300e9b2ba4155018", "马寔"),
      binding("eh-julong-wusi", "句龙吾斯"),
    ],
  }),
  collective("4906ef90110c37c42dc3d6cd", "日南蛮夷攻烧县邑并联结九真"),
  promote("ab9c6196e9b566cf9e8efd15", "马寔击破南匈奴左部", {
    matchedEventId: "official-history-event:6510cbaed4e72e30b141",
    personBindings: [binding("official-history-person-300e9b2ba4155018", "马寔")],
  }),
  promote("7287f39bcdd8b60a3e37eb0b", "刘炳被立为皇太子", {
    personBindings: [binding("eh-liu-bing-chongdi", "刘炳", ["刘炳", "皇子炳"])],
  }),
  context("5c06ae38f03956c8b6e46d78"),
  promote("04447115b8baa95cd005c49a", "范容与周生寇掠扬徐城邑", {
    personBindings: [
      binding("eh-fan-rong", "范容"),
      binding("eh-zhou-sheng", "周生"),
      binding("eh-feng-she", "冯赦"),
    ],
  }),
  promote("c870853ffa8fc069f9874fcd", "刘炳即位为汉冲帝", {
    personBindings: [binding("eh-liu-bing-chongdi", "刘炳", ["刘炳", "皇太子炳"])],
  }),
  promote("83d76c1b869ae7da21b9bce3", "夏方招降日南蛮夷", {
    personBindings: [binding("official-history-person-1b0ea875f85c1a90", "夏方")],
  }),
  context("90eb4dbecc8e1df97960901d"),
  promote("d7da645c20cec114127e0e80", "刘康因杀无辜下狱死", {
    matchedEventId: "official-history-event:eb697145aa42a9cdd504",
    personBindings: [binding("official-history-person-e0ae3495f7696537", "刘康")],
  }),  promote("a6f5f3299f33b99b083bcb39", "汉顺帝崩于玉堂前殿"),
  context("2f4ee29d83f089a8b2589cb5"),
  collective("83986c2bc69a688d09cb34c5", "钟羌寇陇西"),
  context("2c3bd514398c740ff51c4199"),
  promote("8987119a05b7cc07dc4834bd", "东汉立加特奴为车师后部王"),
  collective("672146bf0572000a10198536", "东汉复置玄菟郡屯田六部"),
  collective("de3217dc1583e0c92a338489", "区怜等蛮夷攻象林县"),
  collective("b159eb5ca23b1eb87186ded3", "日南蛮夷复攻县邑并扇动九真"),
  collective("3d57b607e348467279370f36", "于阗王放前遣侍子贡献"),
  collective("155986bd1cce4ba921c41bea", "元孟遣子诣阙贡献"),
  collective("fed3a2827877948eed7651ee", "鲜卑寇渔阳"),
  context("484d01eed2655c23dde13808"),
  collective("4006abe71cc3296406c5e344", "疏勒大宛莎车遣使贡献"),
  collective("30e7b01da7843457dc5e802d", "于阗王遣侍子贡献"),
  collective("de0f7b561ed78fee3a49d2f3", "叶调国与掸国遣使贡献"),
  promote("4071bd7432f8c703bc8c9b88", "东汉定郡国举孝廉年龄与资格"),
  context("8aa99e3dbbcd4b37df041b50"),
  collective("1463f559e4252785f82c5abb", "东汉复置玄菟郡屯田六部"),
  collective("ab060ad4b5b096c06e2ce640", "钟羌寇陇西"),
  collective("b7e113a48dcf79f34af277e7", "乌桓寇云中"),
  context("e3cc4471e9979e3cb1a935ba"),
  collective("550168114222fb222234aa8f", "象林蛮夷叛乱"),
  collective("90fd61510ed7328830f1376f", "武陵蛮围充县并寇夷道"),
  collective("d7a3be198f12743f880d4385", "广汉属国都尉击破白马羌"),
  context("92165895f226b59c2ae783ae"),
  context("c4adfc10c230bb0e3b5781b8"),
  collective("0e0c0eb9d6cfc4a383053b7e", "巩唐羌寇陇西及三辅"),
  collective("96407f631780f971202035a9", "诸种羌寇武威"),
  collective("546f629db2dc6ea821461eec", "鄯善国遣使贡献"),
  collective("c2f5b9d6950eb46f6051b399", "杨徐盗贼攻烧城寺"),
  context("191095325110dafdc8410729"),
  promote("e8ece4c0a53faf67719309d4", "汉顺帝崩于玉堂前殿"),
];

export const officialHistoryCandidateRepairConfig = {
  coverageMode: "partial",
  decisionRebinding: { strategy: "legacy-source-mention" },
  profileId: easternHan126144ProfileId,
  batchId: easternHan126144BatchId,
  periodId: easternHan126144PeriodId,
  generator: easternHan126144Generator,
  canonicalPeople: easternHan126144CanonicalPeople,
  decisions: easternHan126144CandidateRepairs,
  batchNotes: "Adjudicated all Eastern Han 126-144 candidates with corrected annal chronology, stable secondary people and explicit collective events.",
};

export default officialHistoryCandidateRepairConfig;
