import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-421-589-locator-and-core-originals";
const periodId = "china-wei-jin-northern-southern-310-589";
const regionId = "china";
const ctext = "Chinese Text Project";
const guoxue = "国学网";
const zdic = "汉典古籍";

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function mergeJson(value, patch) {
  return JSON.stringify({ ...parseJson(value), batchId, ...patch });
}

function compactText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

const upgrades = [
  {
    mentionId: `${periodId}:china-439-northern-wei-unifies-north:locator:northern-liang`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=143177&if=gb",
    chapterTitle: "卷九十三列传第八十一·僭伪附庸",
    locator: "沮渠牧犍传，太延五年",
    quote: "太武乃引诸军进攻，牧犍兄子万年率麾下又来降。城拔，牧犍与左右文武，面缚请罪，诏释其缚。",
    translation: "《北史》从北凉沮渠氏一侧记载姑臧陷落、牧犍面缚请罪，是北魏统一北方的地方政权侧证。",
  },
  {
    mentionId: `${periodId}:china-439-northern-wei-unifies-north:locator:wei-shizu`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=469087&if=gb",
    chapterTitle: "卷四上·世祖纪上",
    locator: "太延五年六月至八月",
    quote: "六月甲辰，车驾西讨沮渠牧犍。八月甲午，永昌王健获牧犍牛马畜产二十余万。牧犍遣弟董来率万余人拒战于城南，望尘退走。",
    translation: "《魏书·世祖纪》从北魏本纪角度记载太武帝西讨沮渠牧犍及北凉军退走。",
  },
  {
    mentionId: `${periodId}:china-493-xiaowen-luoyang:locator:gaozu`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=398523&if=gb&remap=gb",
    chapterTitle: "帝纪第七·高祖纪下",
    locator: "太和十七年至十九年，河南洛阳行幸与迁都诏意",
    quote: "壬申，行幸河南城。甲戌，讲武于华林园。庚辰，车驾南讨。",
    translation: "《魏书·高祖纪》保存孝文帝至河南洛阳并以南伐为名推进迁都的本纪线索。",
  },
  {
    mentionId: `${periodId}:china-493-xiaowen-luoyang:locator:li-chong`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=70485&if=gb&remap=gb",
    chapterTitle: "全后魏文·卷五，引《魏书·李冲传》",
    locator: "李冲传，营缮洛阳宫室",
    quote: "尚书冲器怀渊博，经度明远，可领将作大匠。司空、长乐公亮可与大匠共监兴缮。",
    translation: "《李冲传》所保存诏文说明李冲参与洛阳宫室制度与营缮，是迁洛制度建设的辅证。",
  },
  {
    mentionId: `${periodId}:china-523-six-garrisons:locator:six-garrisons`,
    sourceName: zdic,
    sourceUrl: "https://gj.zdic.net/shibu/102/5170.html",
    chapterTitle: "北史·魏本纪第四",
    locator: "正光四年三月至四月",
    quote: "三月，沃野镇人破六韩拔陵反，聚众杀镇将，号真王元年。夏四月，高平酋长胡琛反，自称高平王，攻镇以应拔陵。",
    translation: "《北史》魏本纪汇总六镇动乱初起，记破六韩拔陵与胡琛相应。",
  },
  {
    mentionId: `${periodId}:china-523-six-garrisons:locator:suzong`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=203231&if=gb",
    chapterTitle: "魏书·帝纪第九·肃宗纪",
    locator: "正光五年三月至四月，破落汗拔陵起事",
    quote: "三月，沃野镇人破落汗拔陵聚众反，杀镇将，号真王元年。诏临淮王彧为镇军将军，假征北将军，都督北征诸军事以讨之。夏四月，高平酋长胡琛反，自称高平王，攻镇以应拔陵。",
    translation: "《魏书·肃宗纪》直接记录沃野镇破落汗拔陵起事、杀镇将、改号真王，以及胡琛响应，是六镇之乱的北魏本纪主证据。",
  },
  {
    mentionId: `${periodId}:china-534-northern-wei-splits:locator:northern-history`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=809514&if=gb&remap=gb",
    chapterTitle: "北史·卷五魏本纪第五",
    locator: "永熙三年至天平元年，孝武西迁、孝静即位",
    quote: "帝与齐神武有隙，遂西入关，依宇文泰。齐神武乃立清河王亶子善见为帝，是为孝静帝。",
    translation: "《北史·魏本纪第五》直接记录孝武帝西入关与高欢另立元善见，是北魏分裂为东、西魏的本纪证据。",
  },
  {
    mentionId: `${periodId}:china-534-northern-wei-splits:locator:xiaojing`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=743225&if=gb&remap=gb",
    chapterTitle: "帝纪第十二·孝静纪",
    locator: "永熙三年至天平元年",
    quote: "出帝既入关，齐献武王奉迎不克，乃与百僚会议，推帝以奉肃宗之后，时年十一。",
    translation: "《魏书·孝静纪》记录孝武帝入关后高欢集团推立元善见，是东魏建制的本纪证据。",
  },
  {
    mentionId: `${periodId}:china-548-hou-jing-rebellion:locator:liang-wudi`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=679668&if=gb&remap=gb",
    chapterTitle: "资治通鉴卷一百六十一·梁纪十七",
    locator: "太清二年，侯景反梁",
    quote: "太清二年，春正月，慕容绍宗以铁骑五千夹击侯景。景败，遂以十三州地来降。",
    translation: "《资治通鉴·梁纪》为侯景由东魏败将转入梁朝政治军事局势提供编年定位。",
  },
  {
    mentionId: `${periodId}:china-548-hou-jing-rebellion:locator:hou-jing`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=643565&if=gb",
    chapterTitle: "南史·侯景传",
    locator: "侯景传，出身与叛乱前史",
    quote: "侯景字万景，魏之怀朔镇人也。少而不羁，为镇功曹史。魏末北方大乱，乃事边将尔朱荣，甚见器重。",
    translation: "《南史·侯景传》补侯景北镇出身、魏末军事背景和人物线索。",
  },
  {
    mentionId: `${periodId}:china-550-northern-qi-founded:locator:beiqi-wenxuan`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=449101&if=en&remap=gb",
    chapterTitle: "北齐书·文宣帝纪",
    locator: "天保元年五月",
    quote: "夏五月辛亥，帝如邺。甲寅，进相国，总百揆，封冀州之渤海长乐安德武邑、瀛州之河间高阳章武、定州之中山常山博陵十郡。",
    translation: "《北齐书·文宣帝纪》记录高洋受禅前进位相国、总百揆，是北齐建国前夜的本纪证据。",
  },
  {
    mentionId: `${periodId}:china-550-northern-qi-founded:locator:wei-xiaojing`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=743225&if=gb&remap=gb",
    chapterTitle: "帝纪第十二·孝静纪",
    locator: "武定八年五月",
    quote: "天保元年五月己未，封帝为中山王，邑一万户。",
    translation: "《魏书·孝静纪》从东魏末帝侧记录禅齐后的封王安排，是东魏终结的侧证。",
  },
  {
    mentionId: `${periodId}:china-557-northern-zhou-and-chen:locator:chen-gaozu`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=307691&if=en&remap=gb",
    chapterTitle: "陈书·高祖纪下",
    locator: "永定元年十月",
    quote: "永定元年冬十月乙亥，高祖即皇帝位于南郊，柴燎告天。",
    translation: "《陈书·高祖纪》记录陈霸先即皇帝位，是陈朝建立的本纪主证据。",
  },
  {
    mentionId: `${periodId}:china-557-northern-zhou-and-chen:locator:zhou-xiaomin`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=625882&if=en",
    chapterTitle: "周书·孝闵帝纪",
    locator: "元年正月",
    quote: "元年春正月辛丑，即天王位。柴燎告天，朝百官于路门。",
    translation: "《周书·孝闵帝纪》记录宇文觉即天王位，是北周建立的本纪主证据。",
  },
  {
    mentionId: `${periodId}:china-577-northern-zhou-destroys-qi:locator:qi-houzhu`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=498749&if=gb&remap=gb",
    chapterTitle: "北齐书·后主幼主纪",
    locator: "承光元年正月",
    quote: "周师渐逼，癸未，幼主又自邺东走。己丑，周师至紫陌桥。癸巳，烧城西门。太上皇将百余骑东走。",
    translation: "《北齐书》从北齐后主、幼主侧记录周师逼邺与北齐君主东走，是北齐灭亡侧证。",
  },
  {
    mentionId: `${periodId}:china-577-northern-zhou-destroys-qi:locator:zhou-wudi`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=429765&if=gb&remap=gb",
    chapterTitle: "周书·武帝纪",
    locator: "建德六年，北周灭北齐",
    quote: "六年春正月乙亥，齐主传位于其太子恒，改年承光，自号为太上皇。壬辰，帝至邺。齐主先于城外掘壍竖栅。癸巳，帝率诸军围之，齐人拒守，诸军奋击，大破之，遂平邺。",
    translation: "《周书·武帝纪》从北周本纪角度记录周军围邺、破齐，是北周灭北齐的主证据。",
  },
  {
    mentionId: `${periodId}:china-581-sui-founded:locator:sui-gaozu`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=703491&if=gb",
    chapterTitle: "隋书·高祖纪上",
    locator: "开皇元年二月",
    quote: "开皇元年二月甲子，上自相府常服入宫，备礼即皇帝位于临光殿。设坛于南郊，遣使柴燎告天。是日，告庙，大赦，改元。",
    translation: "《隋书·高祖纪》记录杨坚即皇帝位、改元开皇，是隋朝建立的本纪主证据。",
  },
  {
    mentionId: `${periodId}:china-581-sui-founded:locator:zhou-jingdi`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=368615&if=gb&remap=gb",
    chapterTitle: "周书·卷八帝纪第八静帝",
    locator: "大定元年二月丙辰",
    quote: "大定元年春正月壬午，改元。二月甲子，隋王始受相国、百揆、九锡之命。丙辰，逊位于隋，诏曰：「今便祗顺天命，出逊别宫，禅位于隋。」",
    translation: "《周书·静帝纪》直接记录北周静帝大定元年逊位于隋，是北周终结与隋受禅的北周侧证。",
  },
  {
    mentionId: `${periodId}:china-589-sui-conquers-chen:locator:chen-houzhu`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=102625&if=gb&remap=gb",
    chapterTitle: "陈书·卷六本纪第六后主",
    locator: "祯明三年正月，隋军入建康",
    quote: "祯明三年春正月，隋将韩擒虎自采石济江，经雀航趣宫城，自南掖门而入。后主与张贵妃、孔贵嫔并投井中，隋军出之。",
    translation: "《陈书·后主纪》从陈朝本纪侧记录韩擒虎入建康、后主被隋军获出，是陈亡的主证据。",
  },
  {
    mentionId: `${periodId}:china-589-sui-conquers-chen:locator:sui-gaozu`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=534589&if=gb",
    chapterTitle: "隋书·高祖纪下",
    locator: "开皇九年，陈平",
    quote: "陈国平，合州三十，郡一百，县四百。癸巳，遣使持节巡抚之。",
    translation: "《隋书·高祖纪》记录陈国平定后的州郡县总数与巡抚，是隋统一收束的本纪证据。",
  },
  {
    mentionId: `${periodId}:china-347-huan-wen-conquers-cheng-han:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=504489&if=gb&remap=gb",
    chapterTitle: "晋书·列传第六十八·王敦桓温",
    locator: "桓温传，永和二年至三年灭成汉",
    quote: "势于是悉众与温战于笮桥，参军龚护战没，众惧欲退，而鼓吏误鸣进鼓，于是攻之，势众大溃。温乘胜直进，焚其小城，势遂夜遁九十里，至晋寿葭萌城，其将邓嵩、昝坚劝势降，乃面缚舆榇请命。",
    translation: "《晋书·桓温传》记录桓温击溃李势并受降，是东晋灭成汉的主证据。",
  },
  {
    mentionId: `${periodId}:china-354-huan-wen-guanzhong-expedition:core-expansion`,
    sourceName: guoxue,
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_099.htm",
    chapterTitle: "资治通鉴卷九十九·晋纪二十一",
    locator: "永和十年，桓温入关中",
    quote: "温进至灞上，三辅郡县皆降，民争持牛酒迎劳，耆老有垂泣者曰：不图今日复见官军。",
    translation: "《资治通鉴》以编年方式记录桓温北伐进入灞上、三辅响应，是关中北伐的时间线主证据。",
  },
  {
    mentionId: `${periodId}:china-369-huan-wen-defeated-fangtou:core-expansion`,
    sourceName: guoxue,
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_102.htm",
    chapterTitle: "资治通鉴卷一百二·晋纪二十四",
    locator: "太和四年，枋头之败",
    quote: "温至枋头，粮运不继，焚舟而归。慕容垂追温后军于襄邑，大破之。",
    translation: "《资治通鉴》记桓温枋头退兵与慕容垂追击，是桓温北伐受挫的编年主证据。",
  },
  {
    mentionId: `${periodId}:china-376-former-qin-unifies-north:core-expansion`,
    sourceName: guoxue,
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_104.htm",
    chapterTitle: "资治通鉴卷一百四·晋纪二十六",
    locator: "太元元年，前秦灭前凉",
    quote: "秋，七月，阎负、梁殊至姑臧。张天锡会官属谋之曰：今入朝，必不返；如其不从，秦兵必至，将若之何。",
    translation: "《资治通鉴》记录前秦使者至姑臧及张天锡决策，是前秦完成北方整合的关键编年证据。",
  },
  {
    mentionId: `${periodId}:china-395-canhbei-northern-wei-defeats-later-yan:core-expansion`,
    sourceName: guoxue,
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_108.htm",
    chapterTitle: "资治通鉴卷一百八·晋纪三十",
    locator: "太元二十年，参合陂",
    quote: "丙戌，日出，魏军登山，下临燕营。燕军将东引，顾见之，士卒大惊扰乱。珪纵兵击之，燕兵走赴水，人马相腾，蹑压溺死者以万数。",
    translation: "《资治通鉴》逐年记录参合陂之战，说明北魏拓跋珪击破后燕太子宝军，是北魏崛起的关键战役证据。",
  },
  {
    mentionId: `${periodId}:china-398-northern-wei-pingcheng:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?if=gb&res=775301",
    chapterTitle: "魏书·太祖纪，引北魏道武帝资料页",
    locator: "天兴元年，迁都平城",
    quote: "天兴元年秋七月，迁都平城，始营宫室，建宗庙，立社稷。",
    translation: "《魏书·太祖纪》记录道武帝迁都平城并营建宫室、宗庙、社稷，是北魏国家形态转入都城制度的主证据。",
  },
  {
    mentionId: `${periodId}:china-409-liu-yu-destroys-southern-yan:core-expansion`,
    sourceName: guoxue,
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_115.htm",
    chapterTitle: "资治通鉴卷一百一十五·晋纪三十七",
    locator: "义熙五年，刘裕伐南燕",
    quote: "燕兵战于临朐南，日向昃，胜负犹未决。参军胡藩言于裕曰：燕悉兵出战，临朐城中留守必寡。",
    translation: "《资治通鉴》记录刘裕与南燕临朐之战，是灭南燕、攻广固前的关键编年证据。",
  },
  {
    mentionId: `${periodId}:china-417-liu-yu-destroys-later-qin:core-expansion`,
    sourceName: guoxue,
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_118.htm",
    chapterTitle: "资治通鉴卷一百一十八·晋纪四十",
    locator: "义熙十三年，刘裕入长安",
    quote: "王镇恶入自平朔门，姚泓率妻子群臣诣垒门降。镇恶送泓于裕，裕以槛车载泓还建康。",
    translation: "《资治通鉴》记录王镇恶入长安、姚泓出降，是刘裕灭后秦的编年主证据。",
  },
  {
    mentionId: `${periodId}:china-479-southern-qi-founded:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=459493&if=gb&remap=gb",
    chapterTitle: "南齐书·高帝纪下",
    locator: "建元元年四月",
    quote: "建元元年夏，四月，甲午，上即皇帝位于南郊，设坛柴燎告天。",
    translation: "《南齐书·高帝纪》记录萧道成即位，是南齐建国的本纪主证据。",
  },
  {
    mentionId: `${periodId}:china-502-liang-founded:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=448631&if=gb&remap=gb",
    chapterTitle: "梁书·武帝纪中",
    locator: "天监元年四月",
    quote: "天监元年夏四月丙寅，高祖即皇帝位于南郊。设坛柴燎，告类于天。",
    translation: "《梁书·武帝纪》记录萧衍即位，是梁朝建立的本纪主证据。",
  },
  {
    mentionId: `${periodId}:china-528-heyin-massacre:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=928546&if=gb",
    chapterTitle: "资治通鉴卷一百五十二·梁纪八",
    locator: "大通二年，河阴之变",
    quote: "尔朱荣军于邙山之北，河阴之野，召百官迎驾，至者尽诛之。",
    translation: "《资治通鉴》记录尔朱荣召百官至河阴而诛杀，是河阴之变的核心编年证据。",
  },
  {
    mentionId: `${periodId}:china-537-battle-of-shayuan:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=85995&if=gb",
    chapterTitle: "周书·文帝纪下",
    locator: "大统三年十月，沙苑",
    quote: "冬十月壬辰，至沙苑，距齐神武军六十余里。齐神武闻太祖至，引军来会。",
    translation: "《周书·文帝纪》从西魏、北周侧记录沙苑会战的地点与双方接战。",
  },
  {
    mentionId: `${periodId}:china-546-battle-of-yubi:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=185194&if=gb",
    chapterTitle: "周书·卷三十一列传第二十三·韦孝宽",
    locator: "大统十二年，韦孝宽守玉壁",
    quote: "十二年，齐神武倾山东之众，志图西入，以玉壁冲要，先命攻之。连营数十里，至于城下。",
    translation: "《周书·韦孝宽传》直接记录高欢围攻玉壁与玉壁军事地位，是玉壁之战的北周侧主证据。",
  },
  {
    mentionId: `${periodId}:china-552-hou-jing-rebellion-ends:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=426281&if=gb",
    chapterTitle: "梁书·侯景传",
    locator: "承圣元年，侯景败亡",
    quote: "王僧辩遣侯瑱率军追景。景至晋陵，劫太守徐永东奔吴郡，进次嘉兴，赵伯超据钱塘拒之。景退还吴郡，达松江，而侯瑱军掩至，景众未阵，皆举幡乞降。景不能制，乃与腹心数十人单舸走。",
    translation: "《梁书·侯景传》记录侯景败逃、部众瓦解，是侯景之乱结束的人物传主证据。",
  },
  {
    mentionId: `${periodId}:china-553-western-wei-takes-yizhou:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=126099&if=gb",
    chapterTitle: "周书·尉迟迥传",
    locator: "废帝二年，尉迟迥取蜀",
    quote: "太祖深以为然，谓迥曰：「伐蜀之事，一以委汝，计将安出？」迥曰：「蜀与中国隔绝百有余年，恃其山川险阻，不虞我师之至。」",
    translation: "《周书·尉迟迥传》记录宇文泰委任尉迟迥伐蜀及其军事判断，是西魏入蜀的主证据。",
  },
  {
    mentionId: `${periodId}:china-554-western-wei-sacks-jiangling:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=381510&if=gb",
    chapterTitle: "南史·梁本纪下",
    locator: "承圣三年十一月，魏克江陵",
    quote: "三年十一月，魏克江陵，太尉王僧辩、司空陈霸先定议，以帝为梁王、太宰、承制。",
    translation: "《南史·梁本纪》记录承圣三年魏克江陵及梁元帝之后的南朝政治处置。",
  },
  {
    mentionId: `${periodId}:china-580-yang-jian-regency:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=703491&if=gb",
    chapterTitle: "隋书·高祖纪上",
    locator: "大象二年五月，杨坚入总朝政",
    quote: "时静帝幼冲，未能亲理政事。内史上大夫郑译、御正大夫刘昉以高祖皇后之父，众望所归，遂矫诏引高祖入总朝政，都督内外诸军事。",
    translation: "《隋书·高祖纪》记录杨坚辅政并总内外军事，是北周末至隋建国的关键过渡证据。",
  },
  {
    mentionId: `${periodId}:china-588-sui-launches-chen-campaign:core-expansion`,
    sourceName: ctext,
    sourceUrl: "https://ctext.org/wiki.pl?chapter=534589&if=gb",
    chapterTitle: "隋书·高祖纪下",
    locator: "开皇八年三月，伐陈诏",
    quote: "有陈窃据江表，逆天暴物。朕初受命，陈顼尚存，思欲教之以道，不以龚行为令，往来修睦，望其迁善。",
    translation: "《隋书·高祖纪》保存开皇八年伐陈诏，是隋发动灭陈战役的本纪主证据。",
  },
];

const getMention = db.prepare("SELECT * FROM source_mentions WHERE id = ?");
const getEventEvidence = db.prepare("SELECT subject_id FROM evidence_links WHERE mention_id = ? AND subject_table = 'events' LIMIT 1");
const getEvent = db.prepare("SELECT id, title, event_type, time_start, time_end FROM events WHERE id = ?");
const getSource = db.prepare("SELECT id, title FROM sources WHERE id = ?");
const updateMention = db.prepare(`
  UPDATE source_mentions
  SET chapter_title = ?, locator = ?, text = ?, translation = ?, confidence = 'high', review_status = 'reviewed', raw_json = ?
  WHERE id = ?
`);
const getEvidenceRows = db.prepare("SELECT id, raw_json FROM evidence_links WHERE mention_id = ?");
const updateEvidence = db.prepare(`
  UPDATE evidence_links
  SET locator = ?, quote = ?, confidence = 'high', raw_json = ?
  WHERE id = ?
`);
const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id,
    time_start, time_end, review_status, raw_json
  )
  VALUES (?, ?, ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'reviewed', ?)
`);
const updateI18n = db.prepare(`
  UPDATE source_mention_i18n
  SET chapter_title = ?, translation = ?, raw_json = ?
  WHERE mention_id = ? AND locale = 'zh'
`);

db.exec("BEGIN");
try {
  for (const upgrade of upgrades) {
    const mention = getMention.get(upgrade.mentionId);
    if (!mention) throw new Error(`Missing mention: ${upgrade.mentionId}`);

    const eventEvidence = getEventEvidence.get(upgrade.mentionId);
    const event = eventEvidence ? getEvent.get(eventEvidence.subject_id) : null;
    const source = getSource.get(mention.source_id);
    const rawPatch = {
      eventId: event?.id ?? parseJson(mention.raw_json).eventId ?? null,
      originalTextStatus: "verified-transcribed",
      transcriptionSource: upgrade.sourceName,
      transcriptionSourceUrl: upgrade.sourceUrl,
      evidenceTier: "post-420-locator-core-originals",
      disputeNote: null,
    };

    updateMention.run(
      upgrade.chapterTitle,
      upgrade.locator,
      upgrade.quote,
      upgrade.translation,
      mergeJson(mention.raw_json, rawPatch),
      upgrade.mentionId,
    );

    for (const row of getEvidenceRows.all(upgrade.mentionId)) {
      updateEvidence.run(upgrade.locator, upgrade.quote, mergeJson(row.raw_json, rawPatch), row.id);
    }

    updateI18n.run(
      upgrade.chapterTitle,
      upgrade.translation,
      JSON.stringify({ batchId, originalTextStatus: "verified-transcribed" }),
      upgrade.mentionId,
    );

    upsertSearchDocument.run(
      `source-mention:${upgrade.mentionId}`,
      "source_mentions",
      upgrade.mentionId,
      `${source?.title ?? mention.source_id}：${event?.title ?? mention.locator}`,
      compactText([
        `${mention.work_title}·${upgrade.chapterTitle} ${upgrade.locator}`,
        upgrade.quote,
        upgrade.translation,
        event ? `事件：${event.title}` : "",
        `摘录来源：${upgrade.sourceName} ${upgrade.sourceUrl}`,
      ]),
      regionId,
      periodId,
      event?.event_type ?? "source-mention",
      event?.time_start ?? mention.year,
      event?.time_end ?? mention.year,
      JSON.stringify({ batchId, ...rawPatch, documentKind: "source-mention" }),
    );
  }

  db.exec("COMMIT");
  console.log(`Upgraded ${upgrades.length} 421-589 locator/core records to verified excerpts.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
