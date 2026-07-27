export const profileId = "china-western-han-wudi--141--119-v1";
export const batchId = "auto-hanshu-western-han-wudi--141--119-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-wudi--141--119-v1";

const card = (suffix) => `card:hanshu-western-han-wudi--141--119:${suffix}`;
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
  liuChe: canonical("han-liu-che", "刘彻", "汉武帝，西汉第七位皇帝。", { aliases: ["劉徹", "汉武帝", "漢武帝"] }),
  weiQing: canonical("han-wei-qing", "卫青", "汉武帝朝名将，多次率军出击匈奴。", { aliases: ["衛青", "大将军卫青", "大將軍衛青"] }),
  huoQubing: canonical("han-huo-qubing", "霍去病", "汉武帝朝名将，河西、漠北战役主将。", { aliases: ["骠骑将军霍去病", "驃騎將軍霍去病", "将军去病", "將軍去病"] }),
  zhangQian: canonical("han-zhang-qian", "张骞", "汉武帝朝使者，开拓汉朝与西域的交通。", { aliases: ["張騫"] }),
  liGuang: canonical("wh-li-guang", "李广", "汉武帝朝将领，长期参与汉匈边境战争。", { aliases: ["李廣", "骁骑将军李广", "驍騎將軍李廣"] }),
  zhaoWan: canonical("wh-zhao-wan", "赵绾", "汉武帝建元年间御史大夫，因主张削弱窦太后干政而下狱自杀。", { aliases: ["趙綰", "御史大夫赵绾", "御史大夫趙綰"], deathYear: -139 }),
  wangZang: canonical("wh-wang-zang", "王臧", "汉武帝建元年间郎中令，与赵绾同时下狱自杀。", { aliases: ["郎中令王臧"], deathYear: -139 }),
  minyueYing: canonical("wh-minyue-wang-ying", "闽越王郢", "闽越王，建元六年攻南越，后被越人所杀。", { aliases: ["閩越王郢", "郢"], deathYear: -135, primaryPolity: "闽越" }),
  hanAnguo: canonical("wh-han-anguo", "韩安国", "汉武帝朝大臣与将领，参与马邑之谋。", { aliases: ["韓安國", "御史大夫韓安國"] }),
  gongsunHe: canonical("wh-gongsun-he", "公孙贺", "汉武帝朝将领，参与马邑之谋。", { aliases: ["公孫賀", "太僕公孫賀"] }),
  wangHui: canonical("wh-wang-hui", "王恢", "汉武帝朝大行，马邑之谋的主要谋划者。", { aliases: ["大行王恢", "將屯將軍王恢"], deathYear: -133 }),
  liXi: canonical("wh-li-xi", "李息", "汉武帝朝将领，参与马邑之谋及北边战事。", { aliases: ["李息"] }),
  tianFen: canonical("wh-tian-fen", "田蚡", "汉武帝舅父，武帝初年丞相。", { aliases: ["田蚡", "丞相蚡", "蚡"], deathYear: -131 }),
  empressChen: canonical("wh-empress-chen", "陈皇后", "汉武帝第一任皇后，元光五年被废。", { aliases: ["陳皇后", "皇后陳氏", "陈氏", "陳氏"] }),
  nanlu: canonical("wh-nanlu", "南闾", "东夷薉君，元朔元年率众降汉。", { aliases: ["南閭", "薉君南閭"], primaryPolity: "薉" }),
  zhaoXin: canonical("wh-zhao-xin", "赵信", "汉将，元朔六年军败后降匈奴。", { aliases: ["趙信", "前將軍趙信"], primaryPolity: "西汉 / 匈奴" }),
  liuAn: canonical("wh-liu-an-huainan", "刘安", "西汉淮南王，元狩元年因谋反被诛。", { aliases: ["淮南王安", "淮南王刘安", "淮南王劉安"], deathYear: -122 }),
  liuCi: canonical("wh-liu-ci-hengshan", "刘赐", "西汉衡山王，元狩元年因谋反被诛。", { aliases: ["劉賜", "衡山王赐", "衡山王賜"], deathYear: -122 }),
  gongsunHong: canonical("wh-gongsun-hong", "公孙弘", "汉武帝朝丞相，推动博士弟子制度。", { aliases: ["公孫弘", "丞相弘", "弘"], deathYear: -121 }),
  kunxie: canonical("wh-kunxie-wang", "昆邪王", "匈奴昆邪王，元狩二年率众降汉。", { aliases: ["匈奴昆邪王"], primaryPolity: "匈奴 / 西汉" }),
  xiutu: canonical("wh-xiutu-wang", "休屠王", "匈奴休屠王，元狩二年被昆邪王所杀。", { aliases: ["匈奴休屠王"], deathYear: -121, primaryPolity: "匈奴" }),
  liuJu: canonical("wh-liu-ju", "刘据", "汉武帝太子，元狩元年被立为皇太子，后在巫蛊之祸中自杀。", { aliases: ["劉據", "太子据", "太子據", "戾太子"], birthYear: -128, deathYear: -91 }),
};

const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id,
  canonicalName: people[key].name,
  sourceNames,
});
const options = (value = {}) => ({
  ...(value.summary ? { summary: value.summary } : {}),
  ...(value.personBindings?.length ? { personBindings: value.personBindings } : {}),
  ...(Object.hasOwn(value, "matchedEventId") ? { matchedEventId: value.matchedEventId } : {}),
  ...(value.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
});
const promote = (suffix, title, value = {}) => ({
  cardId: card(suffix), disposition: "promote", title,
  reason: value.reason ?? "《汉书·武帝纪》所载主体、行动与精确纪年明确，具有独立事件边界。",
  ...options(value),
});
const collective = (suffix, title, value = {}) => promote(suffix, title, { ...value, allowCollectiveEvent: true });
const context = (suffix, value = {}) => ({
  cardId: card(suffix), disposition: "context",
  ...(value.title ? { title: value.title } : {}),
  reason: value.reason ?? "保留为宗室卒年、官员履历或连续战事上下文，不单独晋级为本轮正式事件。",
  ...options(value),
});

export const decisions = [
  promote("8ab8236f8c92fd8c0a3dbb33", "赵绾与王臧下狱死", { personBindings: [binding("zhaoWan", ["赵绾", "趙綰"]), binding("wangZang")] }),
  context("35d6d04d02db0ba15cacac12", { title: "济川王刘明因杀师傅被废徙" }),
  context("7219398c78c825e6b66fdb16", { title: "广川王刘越与清河王刘乘去世" }),
  promote("4aa90540fb3841340a158d6c", "闽越王郢攻南越", { personBindings: [binding("minyueYing", ["闽越王郢", "閩越王郢"])] }),
  context("4f134dbdf7440bb0b310091d", { title: "越人杀闽越王郢归降", personBindings: [binding("minyueYing", ["郢"])] }),
  collective("11592a85de272bacf1c8f40b", "郡国始举孝廉"),
  collective("9a7a28b59ebf43a24c72f57a", "马邑之谋", { personBindings: [binding("hanAnguo", ["韓安國"]), binding("liGuang", ["李廣"]), binding("gongsunHe", ["公孫賀"]), binding("wangHui", ["王恢"]), binding("liXi")] }),
  context("f49677cfa623087a3d99f0e6", { title: "丞相田蚡去世", personBindings: [binding("tianFen", ["蚡"])] }),
  context("2411b92361cb190b6bec00e0", { title: "河间王刘德去世" }),
  promote("3ef8ef860613abf15bca4aae", "陈皇后被废", { personBindings: [binding("empressChen", ["皇后陳氏"])] }),
  context("35054906bde09f5d03069c0d", { title: "鲁王刘余与长沙王刘发去世" }),
  context("6a58db9d9228042d706fc65a", { title: "江都王刘非去世" }),
  promote("af11fdcb0bf58bc8bfff644b", "薉君南闾率众降汉并置苍海郡", { personBindings: [binding("nanlu", ["南閭"])] }),
  collective("beb90a0dc2cf89b7f8eea9fb", "汉置朔方五原郡", { matchedEventId: "china-127-han-xiongnu-henan" }),
  promote("13eae940b8a86326cf124892", "卫青出朔方击匈奴", { matchedEventId: "china-124-wei-qing-longxi-campaign", personBindings: [binding("weiQing", ["衛青"])] }),
  promote("59ca376c1551242a51572194", "卫青出定襄击匈奴", { personBindings: [binding("weiQing", ["衛青"])] }),
  promote("65869cc7c5a47de0e44f2960", "赵信军败降匈奴", { personBindings: [binding("zhaoXin", ["趙信"])] }),
  promote("7697ceaa5f8342e186f10163", "刘安与刘赐谋反败亡", { personBindings: [binding("liuAn", ["淮南王安"]), binding("liuCi", ["衡山王賜"])] }),
  context("0870d4d0b91ceee7e77a2922", { title: "丞相公孙弘去世", personBindings: [binding("gongsunHong", ["弘"])] }),
  context("108fe4c34570f299e26799da", { title: "胶东王刘寄去世" }),
  collective("1174bcc408a03cbd2648d705", "霍去病河西之战", { matchedEventId: "china-121-hexi-campaign", personBindings: [binding("huoQubing")] }),
  promote("51db030ccd3ffbd5aebbeb38", "昆邪王杀休屠王并率众降汉", { personBindings: [binding("kunxie"), binding("xiutu")] }),
  context("a9c48c6d74a793050a2897a3", { title: "李广右北平之战失军", personBindings: [binding("liGuang", ["廣"]), binding("zhangQian", ["張騫"])] }),
  collective("9f0e85f5944f210432c4eced", "漠北之战", { matchedEventId: "china-119-mobei-campaign", personBindings: [binding("weiQing", ["衛青"]), binding("huoQubing", ["去病"])] }),
  collective("177097c3cdc82af5b8bdccbd", "汉罢苍海郡"),
  promote("6f0129abe456dd043408d6cc", "刘据被立为皇太子", { personBindings: [binding("liuJu", ["皇太子"])] }),
  collective("958ffba653970c8470ae59b6", "霍去病河西之战", { matchedEventId: "china-121-hexi-campaign", personBindings: [binding("huoQubing", ["將軍去病"])] }),
];

export default {
  profileId,
  batchId,
  periodId,
  generator,
  coverageMode: "complete",
  canonicalPeople: Object.values(people),
  decisions,
  batchNotes: "Adjudicated Hanshu Wudi annal candidates for 141-119 BCE; 14 event-bearing cards promoted and 10 contextual cards retained.",
};
