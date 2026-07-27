export const profileId = "china-western-han-zhaodi--86--74-v1";
export const batchId = "auto-hanshu-western-han-zhaodi--86--74-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-zhaodi--86--74-v1";

const card = (suffix) => `card:hanshu-western-han-zhaodi--86--74:${suffix}`;
const canonical = (id, name, summary, options = {}) => ({
  id,
  name,
  aliases: options.aliases ?? [],
  birthYear: options.birthYear,
  deathYear: options.deathYear,
  primaryPolity: options.primaryPolity ?? "西汉",
  summary,
});

const people = {
  liuFuling: canonical("han-liu-fuling", "刘弗陵", "汉昭帝，汉武帝少子，幼年即位，由霍光等辅政。", { aliases: ["劉弗陵", "昭帝", "孝昭皇帝"], birthYear: -94, deathYear: -74 }),
  huoGuang: canonical("han-huo-guang", "霍光", "汉武帝、昭帝、宣帝时期重臣，昭帝朝主持辅政。", { aliases: ["大將軍光", "大将军光", "光"] }),
  shangguanJie: canonical("wh-shangguan-jie", "上官桀", "汉武帝、昭帝时期将领与辅政大臣，元凤元年谋反伏诛。", { aliases: ["左將軍桀", "左将军桀", "桀"], deathYear: -80 }),
  luPohu: canonical("wh-lu-pohu", "吕破胡", "汉昭帝朝水衡都尉，奉命平定益州郡叛乱。", { aliases: ["呂破胡", "水衡都尉呂破胡"] }),
  liuZe: canonical("wh-liu-ze-qi", "刘泽", "齐孝王之孙，始元元年谋反失败被诛。", { aliases: ["劉澤", "齊孝王孫劉澤"], deathYear: -86 }),
  junBuyi: canonical("wh-jun-buyi", "隽不疑", "汉昭帝朝青州刺史，刘泽谋反时为其谋害目标。", { aliases: ["雋不疑", "青州刺史雋不疑"] }),
  empressShangguan: canonical("wh-empress-shangguan", "上官皇后", "汉昭帝皇后，上官安之女，始元四年被册立。", { aliases: ["皇后上官氏", "上官氏"] }),
  tianGuangming: canonical("wh-tian-guangming", "田广明", "汉昭帝朝大鸿胪，参与平定益州郡叛乱。", { aliases: ["田廣明", "大鴻臚田廣明", "大鴻臚廣明", "廣明"] }),
  zhangYannian: canonical("wh-zhang-yannian", "张延年", "夏阳人，始元五年冒充卫太子被诛。", { aliases: ["張延年", "夏陽男子張延年"], deathYear: -82 }),
  wangPing: canonical("wh-wang-ping-junzheng", "王平", "汉昭帝朝军正，与田广明共同平定益州郡叛乱。", { aliases: ["軍正王平", "军正王平"] }),
  suWu: canonical("wh-su-wu", "苏武", "西汉使者，出使匈奴被留十九年，始元六年归汉。", { aliases: ["蘇武", "栘中監蘇武"] }),
  liuQian: canonical("wh-liu-qian-sishui", "刘前", "西汉泗水戴王，元凤元年去世后因无嗣而国除。", { aliases: ["泗水戴王前", "戴王前"], deathYear: -80 }),
  maShijian: canonical("wh-ma-shijian", "马适建", "汉昭帝朝执金吾，参与平定武都氐人叛乱。", { aliases: ["馬適建", "執金吾馬適建"] }),
  hanZeng: canonical("wh-han-zeng", "韩增", "西汉龙頟侯，参与平定武都氐人叛乱。", { aliases: ["韓增", "龍頟侯韓增", "龍雒侯韓增"] }),
  princessEyi: canonical("wh-princess-eyi", "鄂邑长公主", "汉武帝之女、汉昭帝之姊，元凤元年参与燕王旦等谋反。", { aliases: ["鄂邑長公主", "鄂邑公主"], deathYear: -80 }),
  liuDan: canonical("wh-liu-dan-yan", "刘旦", "汉武帝之子、燕王，元凤元年参与谋反伏诛。", { aliases: ["劉旦", "燕王旦"], deathYear: -80 }),
  shangguanAn: canonical("wh-shangguan-an", "上官安", "上官桀之子、汉昭帝朝骠骑将军，元凤元年谋反伏诛。", { aliases: ["上官安", "桀子票騎將軍安", "票騎將軍安"], deathYear: -80 }),
  sangHongyang: canonical("wh-sang-hongyang", "桑弘羊", "汉武帝、昭帝时期财政大臣，元凤元年参与谋反伏诛。", { aliases: ["御史大夫桑弘羊"], deathYear: -80 }),
  fanMingyou: canonical("wh-fan-mingyou", "范明友", "汉昭帝朝度辽将军，率军出击辽东乌桓。", { aliases: ["中郎將范明友", "度遼將軍范明友"] }),
};

const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id,
  canonicalName: people[key].name,
  sourceNames,
});
const options = (value = {}) => ({
  ...(value.summary ? { summary: value.summary } : {}),
  ...(value.personBindings?.length ? { personBindings: value.personBindings } : {}),
  ...(value.placeBindings?.length ? { placeBindings: value.placeBindings } : {}),
  ...(Object.hasOwn(value, "matchedEventId") ? { matchedEventId: value.matchedEventId } : {}),
  ...(value.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
  ...(value.preserveAllBoundPeople ? { preserveAllBoundPeople: true } : {}),
});
const promote = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: value.reason ?? "《汉书·昭帝纪》所载主体、行动与精确纪年明确，具有独立事件边界。",
  ...options(value),
});
const collective = (suffix, title, value = {}) => promote(suffix, title, { ...value, allowCollectiveEvent: true });
const context = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  title,
  reason: value.reason ?? "保留为封赏、官员卒年或连续事件上下文，不单独晋级为本轮正式事件。",
  ...options(value),
});
const reject = (suffix, title, reason) => ({
  cardId: card(suffix),
  disposition: "reject",
  title,
  reason,
});

export const decisions = [
  context("a6ccb7fc84f63bc0e28ab0b9", "燕王等宗室增封"),
  collective("9ed8124964af6314a347c4dc", "吕破胡平益州郡叛乱", { personBindings: [binding("luPohu", ["呂破胡"])] }),
  collective("9fa5056332da1a075c4ed796", "河内河东调整州属", { summary: "有司奏请将河内改属冀州、河东改属并州。" }),
  promote("1ca627b9b1d9e1454de4c50f", "刘泽谋反汉廷后事败身亡", { preserveAllBoundPeople: true, personBindings: [binding("liuZe", ["劉澤"]), binding("junBuyi", ["雋不疑"])] }),
  promote("e5d37d8747e2b89acffd4dee", "霍光与上官桀因功封侯", { preserveAllBoundPeople: true, personBindings: [binding("huoGuang", ["大將軍光", "光"]), binding("shangguanJie", ["左將軍桀", "桀"])] }),
  promote("681d75a642172df0884978ea", "上官皇后册立", { personBindings: [binding("empressShangguan", ["皇后上官氏", "上官氏"])] }),
  promote("af81b6b6a87fa18ef0658ea1", "田广明出击益州郡", { personBindings: [binding("tianGuangming", ["田廣明"])] }),
  promote("e8486d1d53069e4620376dd4", "张延年自称卫太子后获罪身亡", { personBindings: [binding("zhangYannian", ["張延年"])] }),
  collective("9379b7c54594e73a397ada9e", "汉廷撤销儋耳郡与真番郡"),
  promote("1fce9cb19efb7f7d7072c2bb", "田广明与王平平益州郡叛乱", { preserveAllBoundPeople: true, personBindings: [binding("tianGuangming", ["廣明"]), binding("wangPing", ["王平"])] }),
  collective("ef190eb15276482aa2c32ec6", "汉廷召开盐铁会议", { matchedEventId: "china-81-salt-iron-debate" }),
  promote("866b4f50b8db67305bd5260e", "苏武结束匈奴羁留归汉", { personBindings: [binding("suWu", ["蘇武"])] }),
  collective("d9dca0804bee1b6b9be8859b", "汉廷撤销榷酤官"),
  collective("10a80820d6d9bd08b88a4701", "汉置金城郡"),
  promote("569734ac5a8c6b950a0a1d96", "泗水戴王刘前去世并国除", { personBindings: [binding("liuQian", ["泗水戴王前"])] }),
  context("14a677b193bb99585d40d49f", "泗水国相与内史下狱"),
  promote("881d4be7f294ff3250fa7c21", "马适建等平武都氐人叛乱", { preserveAllBoundPeople: true, personBindings: [binding("maShijian", ["馬適建"]), binding("hanZeng", ["韓增"]), binding("tianGuangming", ["廣明"])] }),
  promote("89b2db808698bc501595360a", "鄂邑长公主等谋反汉廷后事败身亡", { preserveAllBoundPeople: true, personBindings: [binding("princessEyi", ["鄂邑長公主"]), binding("liuDan", ["燕王旦"]), binding("shangguanJie", ["上官桀"]), binding("shangguanAn", ["桀子票騎將軍安", "安"]), binding("sangHongyang", ["桑弘羊"])] }),
  promote("c8587c78c02fad7820f8cca2", "范明友出击辽东乌桓", { personBindings: [binding("fanMingyou", ["范明友"])] }),
  context("f079c597d2bd680821bfb925", "丞相车千秋去世"),
  promote("87a3002b593d5e481e2cf5f5", "汉昭帝刘弗陵在高庙加元服", { personBindings: [binding("liuFuling", ["帝", "昭帝"])], placeBindings: [{ id: "gao-temple-han", label: "高庙", role: "primary-location" }] }),
  context("ed1d61241399e749a1f680a0", "丞相杨敞去世"),
  collective("cdc03ec7f324dd01f75d4cff", "汉筑辽东玄菟城"),
  promote("4cf35304748f4a2c370dc024", "汉昭帝刘弗陵驾崩于未央宫", { personBindings: [binding("liuFuling", ["帝"])] }),
  reject("382a054379a74f7fa612bf50", "《昭帝纪》赞语概述盐铁政策", "该卡来自篇末赞语，是对前文盐铁会议与罢榷酤的重复概述，不作为独立事件证据晋级。"),
];

export default {
  profileId,
  batchId,
  periodId,
  generator,
  coverageMode: "complete",
  canonicalPeople: Object.values(people),
  decisions,
  batchNotes: "Adjudicated Hanshu Zhaodi annal candidates for 86-74 BCE; explicit rebellions, military actions, institutional changes, succession and major policy events are promoted while routine grants and official deaths remain context.",
};
