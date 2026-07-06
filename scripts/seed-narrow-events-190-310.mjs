import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));
const batchId = "manual-narrow-events-190-310";

const events = [
  {
    id: "china-190-yuan-shao-coalition-leader",
    title: "关东诸军推袁绍为盟主",
    titleEn: "Yuan Shao chosen as coalition leader",
    year: 190,
    locationName: "关东、酸枣一带",
    category: "diplomacy",
    summary: "袁术、韩馥、袁绍、张邈等关东州郡长官同时起兵讨董，并推袁绍为盟主，使讨董行动从各地举兵转为松散联盟。",
    people: ["袁绍", "袁术", "曹操", "董卓"],
    personIds: ["yuan-shao", "yuan-shu", "cao-cao", "dong-zhuo"],
    polities: ["关东联军", "董卓集团", "东汉"],
    relatedEvents: ["china-190-coalition-against-dong-zhuo"],
    tags: ["讨董", "关东联军", "盟主推举"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wei-wudi",
        locator: "初平元年春正月",
        quote: "同时俱起兵，众各数万，推绍为盟主。",
        mentionId: "mention-sgz-wei-wudi-cao-cao-coalition",
      },
    ],
    detail: {
      overview: "这是关东讨董中的联盟形成节点，重点不是战斗本身，而是各州郡军事集团如何以袁绍为名义盟主组织起来。",
      background: ["董卓控制洛阳朝廷后，关东州郡长官与地方军事力量开始公开反董。"],
      process: ["袁术、韩馥、孔伷、刘岱、王匡、袁绍、张邈、桥瑁、袁遗、鲍信等同时起兵，众各数万，并推袁绍为盟主。"],
      result: ["讨董行动获得共同名义，但联盟结构松散，各方仍以自身州郡和军事集团为基础。"],
      impact: ["该节点适合与其他联盟、会盟、政治推举事件比较，而父事件“关东诸军起兵讨董”仍保留为军事总览层级。"],
      sourceNotes: ["《三国志·魏书·武帝纪》明确记载各路同时起兵并推袁绍为盟主。"],
      uncertainty: ["盟主权威偏名义性，不能按中央集权式统帅关系理解。"],
    },
  },
  {
    id: "china-219-liu-bei-king-of-hanzhong",
    title: "刘备称汉中王",
    titleEn: "Liu Bei becomes King of Hanzhong",
    year: 219,
    locationName: "沔阳",
    category: "politics",
    summary: "刘备取得汉中后，群下上表推刘备为汉中王，并在沔阳设坛受王号，蜀汉政权化进程进一步推进。",
    people: ["刘备", "曹操"],
    personIds: ["liu-bei", "cao-cao"],
    polities: ["刘备集团", "曹操集团", "东汉"],
    relatedEvents: ["china-219-hanzhong-and-jingzhou-crisis"],
    tags: ["汉中", "汉中王", "政权化"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-shu-xianzhu",
        locator: "建安二十四年秋",
        quote: "先主遂有汉中。秋，群下上先主为汉中王。",
        mentionId: "mention-sgz-shu-xianzhu-liu-bei-hanzhong-king",
      },
    ],
    detail: {
      overview: "这是“刘备称汉中王，关羽失荆州”父事件中的政治节点，重点是刘备集团在汉中胜利后的名号与制度化。",
      background: ["刘备在汉中战场取得优势，曹操引军还长安，汉中归刘备所有。"],
      process: ["群下上先主为汉中王，刘备在沔阳设坛，完成受王号仪式。"],
      result: ["刘备集团获得更明确的政治名义，和曹操集团的对峙进入更制度化阶段。"],
      impact: ["该节点适合与曹丕受禅、孙权称帝等内政和政权化事件比较，而不应混入军事战役对比。"],
      sourceNotes: ["《三国志·蜀书·先主传》对汉中王仪式有较清楚的叙述。"],
      uncertainty: ["这里记录的是名号和政治程序，不等同于完整国家建制已经完成。"],
    },
  },
  {
    id: "china-219-guan-yu-defeated-by-sun-quan",
    title: "孙权袭荆州，关羽败亡",
    titleEn: "Sun Quan takes Jingzhou and Guan Yu is killed",
    year: 219,
    locationName: "荆州",
    category: "war",
    summary: "关羽北伐襄樊期间，孙权方面袭取荆州并斩关羽，刘备集团的荆州支点崩解。",
    people: ["关羽", "孙权", "吕蒙", "陆逊"],
    personIds: ["guan-yu", "sun-quan", "lu-meng", "lu-xun"],
    polities: ["刘备集团", "孙吴", "曹操集团"],
    relatedEvents: ["china-219-hanzhong-and-jingzhou-crisis"],
    tags: ["荆州", "关羽", "孙吴袭荆州"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wu-wuzhu",
        locator: "建安二十四年",
        quote: "权击斩羽，传其首。",
        mentionId: "mention-sgz-wu-wuzhu-sun-quan-jingzhou",
      },
    ],
    detail: {
      overview: "这是父事件中与汉中称王并列的军事转折，重点是荆州方向的失守和关羽败亡。",
      background: ["关羽北伐襄樊使曹魏承压，但荆州后方同时面对孙吴压力。"],
      process: ["孙权出兵袭取荆州方向，关羽败亡，其首被传送。"],
      result: ["刘备集团失去荆州支点，东西两线战略被迫收缩。"],
      impact: ["该节点适合与其他军事背刺、边界争夺、州郡失守事件比较。"],
      sourceNotes: ["《三国志·吴书·吴主传》明确记载孙权击斩关羽。"],
      uncertainty: ["父事件仍保留汉中与荆州两个方向的全局叙述；本条只处理荆州失守节点。"],
    },
  },
  {
    id: "china-220-cao-pi-accepts-abdication",
    title: "曹丕受禅即皇帝位",
    titleEn: "Cao Pi accepts abdication and becomes emperor",
    year: 220,
    locationName: "繁阳、洛阳",
    category: "politics",
    summary: "汉献帝禅位后，曹丕升坛受玺绶，即皇帝位，改元黄初，曹魏政权正式建立。",
    people: ["曹丕", "汉献帝"],
    personIds: ["cao-pi", "han-xiandi"],
    polities: ["曹魏", "东汉"],
    relatedEvents: ["china-220-cao-pi-founds-wei"],
    tags: ["受禅", "曹魏建立", "东汉结束"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wei-wendi",
        locator: "黄初元年",
        quote: "王升坛即阼，百官陪位。事讫，降坛，视燎成礼而反。改延康为黄初，大赦。",
        mentionId: "mention-sgz-wei-wendi-cao-pi-abdication",
      },
      {
        sourceId: "zizhi-tongjian-69",
        locator: "黄初元年",
        quote: "汉帝告祠高庙，使行御史大夫张音持节奉玺绶诏册，禅位于魏。辛未，升坛受玺绶，即皇帝位。",
      },
    ],
    detail: {
      overview: "这是“曹丕称帝，曹魏建立”父事件中的仪式和权力转移节点，适合做内政/政权更替对比。",
      background: ["曹操去世后，曹丕继承魏王地位，汉魏之间的名义君臣关系进入最终转换阶段。"],
      process: ["汉献帝禅位，曹丕升坛受玺绶，即皇帝位，并改元黄初。"],
      result: ["东汉名义终结，曹魏成为正式皇帝政权。"],
      impact: ["这一节点可与司马炎代魏、刘备称帝、孙权称帝等权力转移事件比较。"],
      sourceNotes: ["《三国志·魏书·文帝纪》和《资治通鉴》均保留受禅、即位、改元的关键程序。"],
      uncertainty: ["本条不展开禅让前后的政治压力和合法性争论，只记录可比的制度动作。"],
    },
  },
  {
    id: "china-263-liu-shan-surrenders-to-wei",
    title: "刘禅奉玺绶降魏",
    titleEn: "Liu Shan surrenders to Wei",
    year: 263,
    locationName: "成都",
    category: "diplomacy",
    summary: "邓艾兵至成都后，刘禅遣张绍等奉玺绶投降，并率太子、诸王、群臣至军门，蜀汉正式灭亡。",
    people: ["刘禅", "邓艾", "钟会", "姜维"],
    personIds: ["liu-shan", "deng-ai", "zhong-hui", "jiang-wei"],
    polities: ["蜀汉", "曹魏"],
    relatedEvents: ["china-263-shu-han-conquered"],
    tags: ["灭蜀", "成都", "投降"],
    sourceRefs: [
      {
        sourceId: "zizhi-tongjian-78",
        locator: "景元四年冬十月",
        quote: "汉主乃遣侍中张绍等奉玺绶以降于艾。",
        mentionId: "mention-zztj-78-263-shu-surrender",
      },
      {
        sourceId: "sanguozhi-shu-houzhu",
        locator: "景耀六年 / 炎兴元年",
      },
    ],
    detail: {
      overview: "这是灭蜀战争的投降节点，重点是刘禅政权的正式归降，而不是整场伐蜀战役。",
      background: ["钟会主力牵制剑阁，邓艾偷渡阴平后直逼成都，蜀汉中枢已难以组织有效防御。"],
      process: ["刘禅遣侍中张绍等奉玺绶降于邓艾，随后率太子、诸王及群臣至军门。"],
      result: ["成都投降，蜀汉作为三国之一结束。"],
      impact: ["该节点适合与孙皓降晋、瓦勒良被俘等政权屈服或君主失势事件比较。"],
      sourceNotes: ["《资治通鉴·卷七十八》明确记载奉玺绶投降和成都军门仪式。"],
      uncertainty: ["本条只处理投降节点；邓艾阴平行军和钟会剑阁牵制仍属于父事件军事过程。"],
    },
  },
  {
    id: "china-280-wang-jun-advances-to-jianye",
    title: "王濬楼船进逼建业",
    titleEn: "Wang Jun's fleet advances on Jianye",
    year: 280,
    locationName: "长江下游、建业",
    category: "war",
    summary: "西晋伐吴进入最后阶段，王濬水军顺江东下进逼建业，孙吴都城防线失去支撑。",
    people: ["王濬", "杜预", "司马炎", "孙皓"],
    personIds: ["wang-jun", "du-yu", "sima-yan", "sun-hao"],
    polities: ["西晋", "孙吴"],
    relatedEvents: ["china-280-jin-conquers-wu"],
    tags: ["灭吴", "王濬", "建业"],
    sourceRefs: [
      {
        sourceId: "jinshu-wang-jun-du-yu",
        locator: "杜预、王濬传灭吴相关记载",
      },
      {
        sourceId: "zizhi-tongjian-81",
        locator: "太康元年",
      },
    ],
    detail: {
      overview: "这是西晋灭吴父事件中的军事推进节点，重点是王濬水军沿长江下行对建业形成直接压力。",
      background: ["西晋多路伐吴，长江防线被逐步突破，孙吴已经难以维持纵深防御。"],
      process: ["王濬率水军顺江推进，与西晋其他方向军势共同压向建业。"],
      result: ["孙吴都城建业面临直接军事压力，孙皓投降成为可预期结局。"],
      impact: ["该节点适合与赤壁、官渡、夷陵等军事推进或决战节点比较。"],
      sourceNotes: ["父事件已有《晋书·杜预传 / 王濬传》和《资治通鉴·卷八十一》作为灭吴相关依据。"],
      uncertainty: ["本条不细拆各路晋军全部行军路线，先保留王濬水军这个最适合展示的窄军事节点。"],
    },
  },
  {
    id: "china-280-sun-hao-surrenders-to-jin",
    title: "孙皓出降西晋",
    titleEn: "Sun Hao surrenders to Western Jin",
    year: 280,
    locationName: "建业",
    category: "diplomacy",
    summary: "西晋军临建业后，孙吴末帝孙皓出降，孙吴灭亡，三国分裂局面结束。",
    people: ["孙皓", "司马炎", "王濬"],
    personIds: ["sun-hao", "sima-yan", "wang-jun"],
    polities: ["孙吴", "西晋"],
    relatedEvents: ["china-280-jin-conquers-wu"],
    tags: ["灭吴", "孙皓", "投降"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wu-sun-hao",
        locator: "孙皓传降晋相关记载",
      },
      {
        sourceId: "jinshu-wudi",
        locator: "太康元年",
      },
      {
        sourceId: "zizhi-tongjian-81",
        locator: "太康元年",
      },
    ],
    detail: {
      overview: "这是西晋灭吴的投降节点，重点是孙皓以君主身份出降，而不是整场灭吴军事行动。",
      background: ["西晋多路伐吴并进逼建业，孙吴末期政权已失去有效抵抗空间。"],
      process: ["孙皓出降西晋，孙吴中央政权终止。"],
      result: ["孙吴灭亡，三国时代在政治版图上结束。"],
      impact: ["该节点适合与刘禅降魏、曹丕受禅等政权终结或权力转移事件比较。"],
      sourceNotes: ["父事件已有《三国志·吴书·三嗣主传》《晋书·武帝纪》和《资治通鉴·卷八十一》作为降晋相关依据。"],
      uncertainty: ["本条先记录君主投降的制度和政治结果，不展开受降礼仪细节。"],
    },
  },
  {
    id: "china-200-guan-yu-slays-yan-liang",
    title: "关羽白马斩颜良",
    titleEn: "Guan Yu slays Yan Liang at Baima",
    year: 200,
    locationName: "白马",
    category: "war",
    summary: "官渡战役前期，关羽在白马阵中斩杀袁绍将颜良，解除白马之围，削弱袁绍南下攻势。",
    people: ["关羽", "颜良", "曹操", "袁绍"],
    personIds: ["guan-yu", "yan-liang", "cao-cao", "yuan-shao"],
    polities: ["曹操集团", "袁绍集团"],
    relatedEvents: ["china-200-guandu"],
    tags: ["官渡", "白马", "颜良"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-shu-guan-yu",
        locator: "关羽传白马斩颜良",
        quote: "羽望见良麾盖，策马刺良于万衆之中，斩其首还，绍诸将莫能当者，遂解白马围。",
      },
    ],
    detail: {
      overview: "这是官渡战争前期的战术节点，重点是白马围城被解，而不是整场官渡决战。",
      background: ["袁绍南下前期压迫曹操北部防线，白马成为重要前沿据点。"],
      process: ["关羽望见颜良麾盖，突入阵中斩颜良而还。"],
      result: ["白马之围被解除，袁绍前锋攻势受挫。"],
      impact: ["该节点可与其他战役中的斩将、解围、前锋受挫事件比较。"],
      sourceNotes: ["《三国志·蜀书·关羽传》对白马斩颜良有明确记载，父事件官渡已收录该 sourceRef。"],
      uncertainty: ["本条不扩展演义细节，只保留纪传中可支撑的战术结果。"],
    },
  },
  {
    id: "china-200-cao-cao-raids-wuchao",
    title: "曹操夜袭乌巢",
    titleEn: "Cao Cao's night raid on Wuchao",
    year: 200,
    locationName: "乌巢",
    category: "war",
    summary: "官渡相持阶段，曹操亲率步骑夜袭袁绍军粮屯乌巢，攻击淳于琼营，扭转官渡战局。",
    people: ["曹操", "袁绍", "徐晃"],
    personIds: ["cao-cao", "yuan-shao", "xu-huang"],
    polities: ["曹操集团", "袁绍集团"],
    relatedEvents: ["china-200-guandu"],
    tags: ["官渡", "乌巢", "粮道"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wei-wudi",
        locator: "建安五年",
        quote: "公乃留曹洪守，自将步骑五千人夜往，会明至。公急击之，琼退保营，遂攻之。",
        mentionId: "mention-sgz-wei-wudi-cao-cao-guandu",
      },
      {
        sourceId: "zizhi-tongjian-63",
        locator: "建安五年",
        quote: "绍复遣车运谷，使其将淳于琼等将兵万馀人送之，宿绍营北四十里。",
      },
    ],
    detail: {
      overview: "这是官渡之战中最适合独立比较的战术转折，重点是曹操夜袭袁绍粮屯。",
      background: ["官渡长期相持中，曹操军粮紧张，袁绍则依赖后方粮运维持大军。"],
      process: ["曹操留曹洪守营，亲率步骑五千夜行至乌巢，急攻淳于琼营。"],
      result: ["袁绍军粮体系遭重创，官渡战局由相持转向曹操有利。"],
      impact: ["该节点适合与其他补给线攻击、突袭、战役转折事件比较。"],
      sourceNotes: ["《三国志·魏书·武帝纪》和《资治通鉴》均将乌巢粮屯和曹操夜袭作为官渡转折记录。"],
      uncertainty: ["淳于琼暂未作为人物卡绑定，因为当前人物库没有对应 person_id；事件文本保留其姓名。"],
    },
  },
  {
    id: "china-208-liu-cong-surrenders-jingzhou",
    title: "刘琮举州降曹",
    titleEn: "Liu Cong surrenders Jingzhou to Cao Cao",
    year: 208,
    locationName: "襄阳、荆州",
    category: "diplomacy",
    summary: "刘表去世后刘琮继位，曹操南下至襄阳，刘琮举荆州归降，刘备被迫南撤。",
    people: ["刘琮", "曹操", "刘备"],
    personIds: ["liu-cong", "cao-cao", "liu-bei"],
    polities: ["荆州刘表集团", "曹操集团", "刘备集团"],
    relatedEvents: ["china-208-red-cliffs"],
    tags: ["荆州", "刘琮", "降曹"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wei-liu-biao",
        locator: "刘表传",
        quote: "太祖军到襄阳，琮举州降。备走奔夏口。",
      },
      {
        sourceId: "sanguozhi-wei-wudi",
        locator: "建安十三年",
      },
    ],
    detail: {
      overview: "这是赤壁前的荆州政权归降节点，和赤壁水战本身不同，适合放在外交/政权归附类对比。",
      background: ["刘表去世后，荆州内部继承和立场不稳；曹操南下使刘琮面临立即抉择。"],
      process: ["曹操军至襄阳后，刘琮举州归降。"],
      result: ["曹操迅速取得荆州资源，刘备奔夏口，孙刘联合抗曹的压力上升。"],
      impact: ["该节点解释了赤壁前曹操为何能快速压到长江中游，也解释刘备为何必须寻求孙权支持。"],
      sourceNotes: ["人物生命事件与父事件 sourceRefs 中已保留《三国志·魏书·刘表传》相关记载。"],
      uncertainty: ["本条只处理刘琮归降节点，不展开荆州内部派系争论。"],
    },
  },
  {
    id: "china-214-liu-zhang-surrenders-yizhou",
    title: "刘璋稽服，刘备取成都",
    titleEn: "Liu Zhang submits and Liu Bei takes Chengdu",
    year: 214,
    locationName: "成都",
    category: "diplomacy",
    summary: "马超兵临成都后，城中震怖，刘璋向刘备稽服，益州归刘备所有。",
    people: ["刘备", "刘璋", "马超"],
    personIds: ["liu-bei", "liu-zhang", "ma-chao"],
    polities: ["刘备集团", "刘璋集团"],
    relatedEvents: ["china-214-liu-bei-takes-yi"],
    tags: ["益州", "成都", "刘璋"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-shu-xianzhu",
        locator: "建安十九年",
        quote: "先主遣人迎超，超将兵径到城下。城中震怖，璋即稽服。",
        mentionId: "mention-sgz-shu-xianzhu-liu-bei-yizhou",
      },
    ],
    detail: {
      overview: "这是刘备攻取益州的终结节点，重点是成都归附，而不是益州战役全过程。",
      background: ["刘备与刘璋决裂后，益州战局长期拉锯；刘备逐步逼近成都。"],
      process: ["刘备迎马超入军，马超兵至成都城下，城中震怖。"],
      result: ["刘璋向刘备稽服，刘备取得益州。"],
      impact: ["该节点适合与刘琮降曹、刘禅降魏、孙皓降晋等归降事件比较。"],
      sourceNotes: ["《三国志·蜀书·先主传》明确记录马超至城下和刘璋稽服。"],
      uncertainty: ["本条不拆全部入蜀军事过程，只记录成都归附这一可比节点。"],
    },
  },
  {
    id: "china-215-zhang-lu-surrenders-hanzhong",
    title: "张鲁降曹，汉中入魏",
    titleEn: "Zhang Lu surrenders and Hanzhong enters Cao Cao's control",
    year: 215,
    locationName: "南郑、汉中",
    category: "diplomacy",
    summary: "曹操西征张鲁并入南郑后，巴、汉皆降，汉宁郡复为汉中，汉中进入曹操控制。",
    people: ["曹操", "张鲁"],
    personIds: ["cao-cao", "zhang-lu"],
    polities: ["曹操集团", "张鲁集团"],
    relatedEvents: ["china-215-cao-cao-takes-hanzhong"],
    tags: ["汉中", "张鲁", "降曹"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wei-wudi",
        locator: "建安二十年三月至十二月",
        quote: "公军入南郑，尽得鲁府库珍宝。巴、汉皆降。复汉宁郡为汉中。",
        mentionId: "mention-sgz-wei-wudi-cao-cao-hanzhong",
      },
      {
        sourceId: "sanguozhi-wei-zhang-lu",
        locator: "张鲁传",
      },
    ],
    detail: {
      overview: "这是曹操取汉中的归降节点，和汉中争夺的后续军事拉锯不同。",
      background: ["张鲁长期据汉中，汉中控制关中与益州之间的交通要道。"],
      process: ["曹操西征张鲁，入南郑并取得府库，巴、汉归降。"],
      result: ["汉宁郡复为汉中，汉中纳入曹操势力范围。"],
      impact: ["该节点为 219 年刘备夺汉中埋下军事和战略背景。"],
      sourceNotes: ["《三国志·魏书·武帝纪》对入南郑、巴汉皆降和复汉中郡有明确记录。"],
      uncertainty: ["本条以政权归附和区域控制变化为主，不展开张鲁个人待遇。"],
    },
  },
  {
    id: "china-222-lu-xun-fire-attack-yiling",
    title: "陆逊火攻破蜀营",
    titleEn: "Lu Xun breaks the Shu camps with fire attack",
    year: 222,
    locationName: "猇亭、夷陵",
    category: "war",
    summary: "夷陵相持后，陆逊判断破敌时机成熟，下令火攻蜀军营垒，蜀军四十余营被破。",
    people: ["陆逊", "刘备", "孙权"],
    personIds: ["lu-xun", "liu-bei", "sun-quan"],
    polities: ["孙吴", "蜀汉"],
    relatedEvents: ["china-222-yiling"],
    tags: ["夷陵", "火攻", "陆逊"],
    sourceRefs: [
      {
        sourceId: "sanguozhi-wu-lu-xun",
        locator: "陆逊传夷陵相关记载",
        quote: "逊曰：“吾已晓破之之术。”乃敕各持一把茅，以火攻拔之。通率诸军同时俱攻，斩张南、冯习及胡王沙摩柯等首，破其四十馀营。",
      },
      {
        sourceId: "sanguozhi-shu-xianzhu",
        locator: "章武二年春夏",
        quote: "后十余日，陆议大破先主军于猇亭。",
        mentionId: "mention-sgz-shu-xianzhu-liu-bei-yiling",
      },
    ],
    detail: {
      overview: "这是夷陵之战中最清楚的战术转折，重点是陆逊火攻和蜀营崩溃。",
      background: ["刘备东征孙吴后，双方在夷陵、猇亭一带相持，蜀军营垒拉长。"],
      process: ["陆逊判断破敌时机成熟，令诸军以火攻拔营并同时进攻。"],
      result: ["蜀军四十余营被破，冯习、张南等将领战死，刘备败退。"],
      impact: ["该节点适合与乌巢夜袭、赤壁火攻等战术突袭或火攻节点比较。"],
      sourceNotes: ["《三国志·吴书·陆逊传》记载火攻破营，《蜀书·先主传》记载陆议大破先主军于猇亭。"],
      uncertainty: ["冯习、张南等当前人物库未建卡，因此先在文本中出现，不绑定 person_id。"],
    },
  },
];

function json(value) {
  return JSON.stringify(value, null, 2);
}

function compactJson(value) {
  return JSON.stringify(value);
}

function rawFor(event) {
  return {
    id: event.id,
    title: event.title,
    titleEn: event.titleEn,
    startYear: event.year,
    endYear: event.year,
    region: "china",
    locationName: event.locationName,
    category: event.category,
    summary: event.summary,
    people: event.people,
    personIds: event.personIds,
    polities: event.polities,
    relatedEvents: event.relatedEvents,
    tags: event.tags,
    confidence: "high",
    sources: event.sourceRefs.map((ref) => ref.sourceId),
    sourceRefs: event.sourceRefs.map(({ mentionId, ...ref }) => ref),
    detail: event.detail,
    reviewStatus: "reviewed",
    reviewedBy: batchId,
  };
}

const upsertHistoricalEvent = db.prepare(`
  INSERT OR REPLACE INTO historical_events
    (id, title, region, start_year, end_year, location_name, category, summary, confidence, coordinates_json, detail_json, raw_json)
  VALUES
    (@id, @title, 'china', @year, @year, @locationName, @category, @summary, 'high', NULL, @detailJson, @rawJson)
`);
const upsertHistoricalEventI18n = db.prepare(`
  INSERT OR REPLACE INTO historical_event_i18n
    (event_id, locale, title, location_name, summary, raw_json)
  VALUES
    (?, 'zh', ?, ?, ?, '{}')
`);
const deleteHistoricalPeople = db.prepare("DELETE FROM historical_event_people WHERE event_id = ?");
const insertHistoricalPerson = db.prepare(`
  INSERT OR REPLACE INTO historical_event_people
    (event_id, person_id, display_name, sort_order)
  VALUES
    (?, ?, ?, ?)
`);
const deleteHistoricalSources = db.prepare("DELETE FROM historical_event_sources WHERE event_id = ?");
const insertHistoricalSource = db.prepare(`
  INSERT OR REPLACE INTO historical_event_sources
    (event_id, source_id, locator, raw_json)
  VALUES
    (?, ?, ?, ?)
`);
const upsertEvent = db.prepare(`
  INSERT OR REPLACE INTO events
    (id, title, event_type, time_start, time_end, display_time, region_id, place_entity_id, summary, confidence, review_status, raw_json)
  VALUES
    (@id, @title, @category, @year, @year, @displayTime, 'china', NULL, @summary, 'high', 'reviewed', @rawJson)
`);
const upsertEventI18n = db.prepare(`
  INSERT OR REPLACE INTO event_i18n
    (event_id, locale, title, display_time, summary, raw_json)
  VALUES
    (?, 'zh', ?, ?, ?, '{}')
`);
const deleteEventEntities = db.prepare("DELETE FROM event_entities WHERE event_id = ?");
const insertEventEntity = db.prepare(`
  INSERT OR REPLACE INTO event_entities
    (event_id, entity_id, role, sort_order, raw_json)
  VALUES
    (?, ?, ?, ?, ?)
`);
const deleteEvidenceLinks = db.prepare("DELETE FROM evidence_links WHERE id LIKE ?");
const insertEvidenceLink = db.prepare(`
  INSERT OR REPLACE INTO evidence_links
    (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
  VALUES
    (?, 'events', ?, ?, NULL, ?, ?, ?, 'support', 'high', ?)
`);
const upsertSourceMentionEvent = db.prepare(`
  INSERT OR REPLACE INTO source_mention_events
    (mention_id, event_id, sort_order)
  VALUES
    (?, ?, ?)
`);
const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents
    (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES
    (?, 'events', ?, ?, ?, 'zh-Hans', 'china', 'china-three-kingdoms-180-280', NULL, ?, ?, 'reviewed', ?)
`);
const selectEventRaw = db.prepare("SELECT raw_json FROM events WHERE id = ?");
const updateEventRaw = db.prepare("UPDATE events SET raw_json = ? WHERE id = ?");
const selectHistoricalRaw = db.prepare("SELECT raw_json FROM historical_events WHERE id = ?");
const updateHistoricalRaw = db.prepare("UPDATE historical_events SET raw_json = ? WHERE id = ?");

function addRelatedEvent(eventId, relatedEventIds) {
  for (const [select, update] of [
    [selectEventRaw, updateEventRaw],
    [selectHistoricalRaw, updateHistoricalRaw],
  ]) {
    const row = select.get(eventId);
    if (!row) continue;

    const raw = JSON.parse(row.raw_json);
    raw.relatedEvents = [...new Set([...(raw.relatedEvents ?? []), ...relatedEventIds])];
    update.run(json(raw), eventId);
  }
}

db.exec("BEGIN");
try {
  for (const event of events) {
    const raw = rawFor(event);
    const detailJson = json(event.detail);
    const rawJson = json(raw);
    const displayTime = String(event.year);

    upsertHistoricalEvent.run({
      id: event.id,
      title: event.title,
      year: event.year,
      locationName: event.locationName,
      category: event.category,
      summary: event.summary,
      detailJson,
      rawJson,
    });
    upsertHistoricalEventI18n.run(event.id, event.title, event.locationName, event.summary);

    deleteHistoricalPeople.run(event.id);
    event.personIds.forEach((personId, index) => {
      insertHistoricalPerson.run(event.id, personId, event.people[index] ?? personId, index);
    });

    deleteHistoricalSources.run(event.id);
    event.sourceRefs.forEach((ref) => {
      insertHistoricalSource.run(event.id, ref.sourceId, ref.locator, compactJson(ref));
    });

    upsertEvent.run({
      id: event.id,
      title: event.title,
      category: event.category,
      year: event.year,
      displayTime,
      summary: event.summary,
      rawJson,
    });
    upsertEventI18n.run(event.id, event.title, displayTime, event.summary);

    deleteEventEntities.run(event.id);
    event.personIds.forEach((personId, index) => {
      insertEventEntity.run(event.id, `person:${personId}`, event.people[index] ?? "participant", index, compactJson({ generatedFrom: batchId }));
    });

    deleteEvidenceLinks.run(`narrow-190-310:${event.id}:%`);
    event.sourceRefs.forEach((ref, index) => {
      insertEvidenceLink.run(
        `narrow-190-310:${event.id}:${ref.sourceId}:${index}`,
        event.id,
        ref.sourceId,
        ref.mentionId ?? null,
        ref.locator,
        ref.quote ?? null,
        compactJson(ref),
      );
      if (ref.mentionId) {
        upsertSourceMentionEvent.run(ref.mentionId, event.id, index);
      }
    });

    upsertSearchDocument.run(
      `event:${event.id}`,
      event.id,
      event.title,
      [
        event.title,
        event.summary,
        ...event.detail.background,
        ...event.detail.process,
        ...event.detail.result,
        ...event.detail.impact,
        event.people.join("、"),
        event.polities.join("、"),
        event.tags.join("、"),
      ].join("\n"),
      event.year,
      event.year,
      compactJson({ generatedFrom: batchId }),
    );
  }

  const childrenByParent = new Map();
  for (const event of events) {
    for (const parentId of event.relatedEvents) {
      const children = childrenByParent.get(parentId) ?? [];
      children.push(event.id);
      childrenByParent.set(parentId, children);
    }
  }
  for (const [parentId, childIds] of childrenByParent) {
    addRelatedEvent(parentId, childIds);
  }

  db.exec("COMMIT");
  console.log(`Seeded ${events.length} narrow 190-310 events.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
