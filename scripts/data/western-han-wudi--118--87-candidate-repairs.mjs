export const profileId = "china-western-han-wudi--118--87-v1";
export const batchId = "auto-hanshu-western-han-wudi--118--87-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-wudi--118--87-v1";

const card = (suffix) => `card:hanshu-western-han-wudi--118--87:${suffix}`;
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
  huoQubing: canonical("han-huo-qubing", "霍去病", "汉武帝朝名将，河西、漠北战役主将之一。", { deathYear: -117 }),
  liuPengli: canonical("wh-liu-pengli", "刘彭离", "西汉济东王，元鼎元年因罪被废并迁往上庸。", { aliases: ["劉彭離", "濟東王彭離", "济东王彭离"] }),
  zhuangQingdi: canonical("wh-zhuang-qingdi", "庄青翟", "汉武帝朝丞相，元鼎二年下狱死。", { aliases: ["莊青翟", "丞相青翟", "青翟"], deathYear: -115 }),
  liuShun: canonical("wh-liu-shun-changshan", "刘舜", "汉景帝之子、常山王，元鼎三年去世。", { aliases: ["劉舜", "常山王舜"], deathYear: -114 }),
  liuSheng: canonical("wh-liu-sheng-zhongshan", "刘胜", "汉景帝之子、中山靖王，元鼎四年去世。", { aliases: ["劉勝", "中山王勝", "中山靖王"], deathYear: -113 }),
  zhaoZhou: canonical("wh-zhao-zhou", "赵周", "汉武帝朝丞相，因酎金案下狱死。", { aliases: ["趙周", "丞相趙周", "丞相赵周"], deathYear: -112 }),
  gongsunHe: canonical("wh-gongsun-he", "公孙贺", "汉武帝朝将领及丞相，晚年卷入巫蛊案。", { aliases: ["公孫賀", "丞相賀", "丞相贺"], deathYear: -91 }),
  zhaoPonu: canonical("wh-zhao-ponu", "赵破奴", "汉武帝朝将领，参与匈奴及西域方向战事。", { aliases: ["趙破奴", "匈河將軍趙破奴", "浚稽將軍趙破奴"] }),
  yuShan: canonical("wh-dongyue-yushan", "余善", "东越王，元封元年被东越人所杀。", { aliases: ["餘善", "王餘善", "王余善"], deathYear: -110, primaryPolity: "东越" }),
  yangPu: canonical("wh-yang-pu", "杨仆", "汉武帝朝楼船将军，参与南越及朝鲜战事。", { aliases: ["楊僕", "樓船將軍楊僕", "楼船将军杨仆"] }),
  xunZhi: canonical("wh-xun-zhi", "荀彘", "汉武帝朝左将军，参与攻灭卫氏朝鲜。", { aliases: ["左將軍荀彘", "左将军荀彘", "荀彘將"] }),
  guoChang: canonical("wh-guo-chang", "郭昌", "汉武帝朝将领，参与北边与西南地区军事行动。", { aliases: ["拔胡將軍郭昌", "拔胡将军郭昌", "郭昌將以"] }),
  shiQing: canonical("wh-shi-qing", "石庆", "汉武帝朝丞相，太初二年去世。", { aliases: ["石慶", "丞相慶", "丞相庆"], deathYear: -103 }),
  xuZiwei: canonical("wh-xu-ziwei", "徐自为", "汉武帝朝光禄勋，主持修筑五原塞外列城。", { aliases: ["徐自為", "光祿勳徐自為", "徐自"] }),
  hanYue: canonical("wh-han-yue", "韩说", "汉武帝朝将领，参与匈奴方向战事。", { aliases: ["韓說", "游擊將軍韓說", "游击将军韩说"] }),
  liGuangli: canonical("wh-li-guangli", "李广利", "汉武帝朝贰师将军，率军远征大宛并多次出击匈奴。", { aliases: ["李廣利", "貳師將軍李廣利", "贰师将军李广利"] }),
  gongsunAo: canonical("wh-gongsun-ao", "公孙敖", "汉武帝朝将领，多次参与对匈奴作战。", { aliases: ["公孫敖", "因杅將軍公孫敖", "因杅将军公孙敖"] }),
  luBode: canonical("wh-lu-bode", "路博德", "汉武帝朝将领，参与南越及匈奴方向战事。", { aliases: ["強弩都尉路博德", "强弩都尉路博德"] }),
  liuPengzu: canonical("wh-liu-pengzu", "刘彭祖", "汉景帝之子、赵王，征和元年去世。", { aliases: ["劉彭祖", "趙王彭祖", "赵王彭祖"], deathYear: -92 }),
  liuJu: canonical("wh-liu-ju", "刘据", "汉武帝太子，巫蛊之祸中起兵失败后自杀。", { aliases: ["劉據", "戾太子", "太子"], deathYear: -91 }),
  maHeluo: canonical("wh-ma-heluo", "莽何罗", "汉武帝后元年谋反者，后被金日磾等讨平。", { aliases: ["莽何羅", "馬何羅", "马何罗"], deathYear: -88 }),
  maTong: canonical("wh-ma-tong", "马通", "重合侯，参与莽何罗谋反。", { aliases: ["馬通", "重合侯通", "莽何羅弟通"], deathYear: -88 }),
  jinMidi: canonical("wh-jin-midi", "金日磾", "汉武帝朝侍中驸马都尉，参与平定莽何罗谋反。", { aliases: ["金日磾", "侍中駙馬都尉金日磾"] }),
  huoGuang: canonical("han-huo-guang", "霍光", "汉武帝朝重臣，武帝死后受遗诏辅佐昭帝。", { aliases: ["奉車都尉霍光"] }),
  shangguanJie: canonical("wh-shangguan-jie", "上官桀", "汉武帝、昭帝时期将领与辅政大臣。", { aliases: ["騎都尉上官桀", "骑都尉上官桀"] }),
  liuFuling: canonical("han-liu-fuling", "刘弗陵", "汉昭帝，武帝之后继位，由霍光等辅政。", { aliases: ["劉弗陵", "皇子弗陵", "昭帝"] }),
  liuChe: canonical("han-liu-che", "刘彻", "汉武帝，推行中央集权并经略匈奴、西域。", { aliases: ["劉徹", "汉武帝", "漢武帝", "帝"] }),
};

const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id,
  canonicalName: people[key].name,
  sourceNames,
});
const options = (value = {}) => ({
  ...(value.summary ? { summary: value.summary } : {}),
  ...(value.personBindings?.length ? { personBindings: value.personBindings } : {}),
  ...(value.removePersonNames?.length ? { removePersonNames: value.removePersonNames } : {}),
  ...(Object.hasOwn(value, "matchedEventId") ? { matchedEventId: value.matchedEventId } : {}),
  ...(value.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
  ...(value.preserveAllBoundPeople ? { preserveAllBoundPeople: true } : {}),
});
const promote = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: value.reason ?? "《汉书·武帝纪》所载主体、行动与精确纪年明确，具有独立事件边界。",
  ...options(value),
});
const collective = (suffix, title, value = {}) => promote(suffix, title, { ...value, allowCollectiveEvent: true });
const context = (suffix, value = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  ...(value.title ? { title: value.title } : {}),
  reason: value.reason ?? "保留为宗室卒年、战役准备或事件后续，不单独晋级为本轮正式事件。",
  ...options(value),
});

export const decisions = [
  promote("c90db5e5122d9ea0cd9d0bef", "霍去病去世", { matchedEventId: "china-117-huo-qubing-dies", personBindings: [binding("huoQubing", ["霍去病", "將軍去病", "去病"])] }),
  promote("39d9dfbb9f41f22e5074b80c", "刘彭离被废徙上庸", { personBindings: [binding("liuPengli", ["濟東王彭離"])] }),
  promote("e6b15bd861048f84f779a183", "庄青翟下狱死", { personBindings: [binding("zhuangQingdi", ["丞相青翟", "青翟"])] }),
  context("908bc60b699aeb0dab348c68", { title: "常山王刘舜去世", personBindings: [binding("liuShun", ["常山王舜"])] }),
  context("f0678f42241d778eadc20ed3", { title: "常山王嗣子因罪被废徙房陵" }),
  context("066dac4de22c06b9e6788853", { title: "中山王刘胜去世", personBindings: [binding("liuSheng", ["中山王勝"])] }),
  promote("235cba2570f7015b1752133f", "酎金夺爵并赵周下狱死", { personBindings: [binding("zhaoZhou", ["丞相趙周"])] }),
  collective("ab9d1f57ca17baa91ae854ba", "西羌反汉并围枹罕", { removePersonNames: ["眾十萬人"] }),
  promote("f0e16b6b1372f20d9866053a", "余善反汉并杀汉将吏", { personBindings: [binding("yuShan", ["東越王餘善", "餘善"])] }),
  context("1f2307cde9aafcf50b6119db", { title: "公孙贺与赵破奴远出未遇匈奴", personBindings: [binding("gongsunHe", ["公孫賀"]), binding("zhaoPonu", ["趙破奴"])] }),
  collective("66cb1f5b3640acae7decbf6e", "东越杀余善并降汉", { personBindings: [binding("yuShan", ["王餘善降", "王餘善", "餘善"])] }),
  context("e967589b65cb868fcfabca85", { title: "齐王刘闳去世" }),
  collective("3f3b89eae9ac2ab4131ab1cc", "汉发兵攻卫氏朝鲜"),
  context("e0d214b077a233fddee4d118", { title: "杨仆与荀彘率军攻朝鲜", personBindings: [binding("yangPu", ["樓船將軍楊僕", "楊僕"]), binding("xunZhi", ["左將軍荀彘", "荀彘將"])] }),
  collective("10cca67f950141e7130da979", "朝鲜斩右渠降汉并置四郡", { matchedEventId: "china-108-gojoseon-annexed" }),
  context("276e27427c6194447696cfd0", { title: "杨仆免官并荀彘弃市", personBindings: [binding("yangPu", ["樓船將軍楊僕", "楊僕"]), binding("xunZhi", ["左將軍荀彘", "荀彘"])] }),
  context("64db72a8cc461160db2f4460", { title: "胶西王刘端去世" }),
  collective("506328bbd41e475405702eeb", "武都氐人反叛并徙酒泉"),
  context("ff2a78803682560c08d4db78", { title: "汉遣使劝说匈奴臣服" }),
  collective("b309b87b2eb5b754b7276d3a", "匈奴寇边并令郭昌屯朔方", { personBindings: [binding("guoChang", ["郭昌"])] }),
  collective("7c9d7e19c1dc99812e23f24c", "郭昌出击昆明叛军", { personBindings: [binding("guoChang", ["郭昌將以", "郭昌"])] }),
  context("a8b9da3cce21faa805c07815", { title: "丞相石庆去世", personBindings: [binding("shiQing", ["丞相慶", "慶"])] }),
  collective("c238b150322083f2aa688c84", "赵破奴出朔方击匈奴未还", { personBindings: [binding("zhaoPonu", ["浚稽將軍趙破奴", "趙破奴"])] }),
  collective("47c90fe861a07b59b412ed49", "汉筑塞外受降城", { personBindings: [binding("gongsunAo", ["因杅將軍公孫敖", "公孫敖"])] }),
  promote("be77d9149173bee0aab7fcd9", "李广利攻破大宛获汗血马", { personBindings: [binding("liGuangli", ["貳師將軍廣利", "廣利"])] }),
  context("4062d7ff129300e5057dfc3d", { title: "匈奴入雁门并处死弃守太守" }),
  context("5a2c98e5a0e51d82a3ceeaab", { title: "匈奴归还汉使并遣使来献" }),
  context("543da514136f039880b17dc6", { title: "赵王刘彭祖去世", personBindings: [binding("liuPengzu", ["趙王彭祖"])] }),
  promote("4c0433bd7e78cf0482b87162", "公孙贺下狱死", { matchedEventId: "china-91-witchcraft-disaster", personBindings: [binding("gongsunHe", ["丞相賀", "賀"])] }),
  promote("15878f54ab4a9781934f6d15", "太子刘据兵败自尽", { matchedEventId: "china-91-witchcraft-disaster", removePersonNames: ["于湖"], personBindings: [binding("liuJu", ["太子"])] }),
  context("77d2041cf7fc813840ad8aa0", { title: "昌邑王刘髆去世" }),
  promote("081191780227ff2a367f9910", "莽何罗与马通谋反", { preserveAllBoundPeople: true, personBindings: [binding("maHeluo", ["莽何羅"]), binding("maTong", ["弟重合侯通", "重合侯通"]), binding("jinMidi", ["金日磾"]), binding("huoGuang", ["霍光"]), binding("shangguanJie", ["上官桀"])] }),
  promote("687d7871163251710a6e65f4", "立刘弗陵为皇太子", { matchedEventId: "china-87-emperor-zhao-huo-guang", personBindings: [binding("liuFuling", ["皇子弗陵", "弗陵"])] }),
  promote("b37ffda3d991a4d35edbe1a8", "汉武帝驾崩", { matchedEventId: "china-87-emperor-zhao-huo-guang", personBindings: [binding("liuChe", ["帝"])] }),
];

export default {
  profileId,
  batchId,
  periodId,
  generator,
  coverageMode: "complete",
  canonicalPeople: Object.values(people),
  decisions,
  batchNotes: "Adjudicated Hanshu Wudi annal candidates for 118-87 BCE; major campaigns, rebellions, succession and political cases promoted while routine princely deaths and campaign context remain non-event evidence.",
};
