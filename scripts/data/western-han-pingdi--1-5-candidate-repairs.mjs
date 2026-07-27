export const profileId = "china-western-han-xin-transition--8-24-v1";
export const batchId = "auto-hanshu-western-han-pingdi--1-5-candidates";
export const periodId = "china-western-han-xin-transition--8-24";
export const generator = "official-history-candidate-repair:western-han-pingdi--1-5-v1";

const card = (suffix) => "card:hanshu-western-han-pingdi--1-5:" + suffix;
const person = (id, name, summary, aliases = []) => ({ id, name, summary, aliases, primaryPolity: "西汉" });
const people = {
  liuKaiming: person("wh-liu-kaiming-dongping", "刘开明", "东平王刘云太子，元始元年被立为东平王。", ["劉開明", "开明", "開明", "东平王开明"]),
  liuChengdu: person("wh-liu-chengdu-zhongshan", "刘成都", "桃乡顷侯之子，元始元年被立为中山王。", ["劉成都", "成都", "中山王成都"]),
  empressWang: person("wh-empress-wang-pingdi", "孝平皇后王氏", "王莽之女，元始四年被册立为汉平帝皇后。", ["王氏", "王皇后", "平帝王皇后"]),
  liuYin: person("wh-liu-yin-liang", "刘音", "梁孝王后裔，元始五年被立为梁王。", ["劉音", "音", "梁王音"]),
};
const binding = (key, sourceNames = [people[key].name]) => ({ personId: people[key].id, canonicalName: people[key].name, sourceNames });
const promote = (suffix, title, options = {}) => ({ cardId: card(suffix), disposition: "promote", title, reason: "《汉书·平帝纪》行动与纪年明确。", ...options });
const collective = (suffix, title, options = {}) => promote(suffix, title, { ...options, allowCollectiveEvent: true });
const context = (suffix, title, reason) => ({ cardId: card(suffix), disposition: "context", title, reason });

export const decisions = [
  context("c1fc658783b290f5ded3ce5e", "迎立汉平帝功臣受封", "此句追叙迎立功臣并集中赐爵，自动标题误截为即位事件。"),
  collective("ea2a6797e9bcd95a292ae5b5", "汉廷大赦天下"),
  promote("f53ed35ec8b72eba2e68c945", "刘开明受封东平王与刘成都受封中山王", { personBindings: [binding("liuKaiming", ["開明"]), binding("liuChengdu", ["成都"])], preserveAllBoundPeople: true, removePersonNames: ["刘衎"] }),
  collective("b90e67e1841d044038b15a63", "汉廷撤销呼池苑并设置安民县", { placeBindings: [{ id: "huchi-park", label: "呼池苑", role: "primary-location" }, { id: "anmin-county", label: "安民县", role: "related-location" }, { id: "anding-commandery", label: "安定", role: "related-location" }] }),
  context("de53a1940165b71f479a9ea7", "刘宇下狱身亡并诛卫氏", "原句以单名承接前文，当前候选没有保留足够身份上下文。"),
  collective("5a7185ddfd54a5722d65a00e", "汉廷设置西海郡并迁徙罪犯", { placeBindings: [{ id: "xihai-commandery", label: "西海郡", role: "primary-location" }] }),
  collective("5e6be3290ce084507f9981d2", "汉廷分界郡国并罢置改易"),
  promote("c04e323907b3255ba2a6bfec", "孝平皇后王氏册立为皇后", { personBindings: [binding("empressWang", ["皇后王氏", "王氏"])], preserveAllBoundPeople: true, removePersonNames: ["王政君"] }),
  promote("07b2c1b32970db58a7cd9644", "汉平帝刘衎驾崩于未央宫", { matchedEventId: "china-5-emperor-ping-dies", personBindings: [{ personId: "han-liu-kan-pingdi", canonicalName: "刘衎", sourceNames: ["帝", "平帝"] }], preserveAllBoundPeople: true, placeBindings: [{ id: "weiyang-palace", label: "未央宫", role: "primary-location" }] }),
  promote("a1a91258b820ca6cc7ce34bc", "刘音被立为梁王", { personBindings: [binding("liuYin", ["音"])], preserveAllBoundPeople: true }),
  collective("fed0304b5b760726414243e6", "汉廷大赦天下"),
];

export const canonicalPeople = Object.values(people);
export default { profileId, batchId, periodId, generator, coverageMode: "complete", canonicalPeople, decisions, batchNotes: "Adjudicated Hanshu Pingdi annal candidates for 1 BCE-5 CE." };