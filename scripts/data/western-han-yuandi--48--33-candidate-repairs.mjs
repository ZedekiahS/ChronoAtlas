export const profileId = "china-western-han-yuandi--48--33-v1";
export const batchId = "auto-hanshu-western-han-yuandi--48--33-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-yuandi--48--33-v1";

const card = (suffix) => "card:hanshu-western-han-yuandi--48--33:" + suffix;
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
  liuShi: canonical("han-liu-shi", "刘奭", "汉元帝，汉宣帝长子，前49年即位，前33年驾崩。", {
    aliases: ["劉奭", "元帝", "孝元皇帝", "帝"],
    birthYear: -75,
    deathYear: -33,
  }),
  wangShun: canonical("wh-wang-shun-yuandi", "王舜", "汉元帝朝外戚，为皇太后之兄，初元元年封安平侯。", {
    aliases: ["侍中中郎將王舜", "侍中中郎将王舜", "安平侯王舜"],
  }),
  wangZhengjun: canonical("han-wang-zhengjun", "王政君", "汉元帝皇后，汉成帝之母，西汉后期王氏外戚核心人物。", {
    aliases: ["王政君", "皇后王氏", "皇後王氏", "王氏"],
    birthYear: -71,
    deathYear: 13,
    primaryPolity: "西汉 / 新",
  }),
  liuBa: canonical("wh-liu-ba-guangling", "刘霸", "西汉广陵厉王太子，初元二年被立为广陵王。", {
    aliases: ["劉霸", "廣陵厲王太子霸", "广陵厉王太子霸"],
  }),
  liuAo: canonical("han-liu-ao-chengdi", "刘骜", "汉元帝之子，初元二年被立为皇太子，后即位为汉成帝。", {
    aliases: ["劉驁", "皇太子", "太子"],
    birthYear: -51,
    deathYear: -7,
  }),
  liuZong: canonical("wh-liu-zong-changsha", "刘宗", "西汉长沙炀王之弟，初元三年被立为长沙王。", {
    aliases: ["劉宗", "長沙煬王弟宗", "长沙炀王弟宗"],
  }),
  fengFengshi: canonical("wh-feng-fengshi", "冯奉世", "西汉将领，永光二年以右将军身份率军出击西羌。", {
    aliases: ["馮奉世", "右將軍馮奉世", "右将军冯奉世"],
  }),
  liuYuan: canonical("wh-liu-yuan-hejian", "刘元", "西汉河间王，建昭元年获罪后被废迁房陵。", {
    aliases: ["劉元", "河間王元", "河间王元"],
  }),
  empressShangguan: canonical("wh-empress-shangguan", "上官皇后", "汉昭帝皇后，建昭二年以太皇太后身份去世。", {
    aliases: ["上官氏", "太皇太后上官氏", "太皇太後上官氏"],
    deathYear: -37,
  }),
  huhanye: canonical("wh-huhanye-chanyu", "呼韩邪单于", "匈奴单于，竟宁元年再次来朝汉廷。", {
    aliases: ["呼韓邪單于", "虖韓邪單于", "虖韩邪单于"],
  }),
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
  ...(value.placeBindings?.length ? { placeBindings: value.placeBindings } : {}),
  ...(Object.hasOwn(value, "matchedEventId") ? { matchedEventId: value.matchedEventId } : {}),
  ...(value.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
  ...((value.preserveAllBoundPeople || value.personBindings?.length) ? { preserveAllBoundPeople: true } : {}),
});
const promote = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "promote",
  title,
  reason: value.reason ?? "《汉书·元帝纪》所载主体、行动与精确纪年明确，具有独立事件边界。",
  ...options(value),
});
const collective = (suffix, title, value = {}) => promote(suffix, title, { ...value, allowCollectiveEvent: true });
const context = (suffix, title, value = {}) => ({
  cardId: card(suffix),
  disposition: "context",
  title,
  reason: value.reason ?? "保留为年表上下文或官员、宗室卒年资料，不单独晋级为本轮正式事件。",
  ...options(value),
});

export const decisions = [
  collective("732ceb4af82a4f73d30c5548", "汉廷大赦天下"),
  promote("1ef2eba1e70a1df3bb5a10b8", "王舜受封安平侯", {
    personBindings: [binding("wangShun", ["王舜"])],
  }),
  promote("95200af870a2cb08e57c75b1", "王政君册立为皇后", {
    personBindings: [binding("wangZhengjun", ["皇后王氏", "王氏"])],
  }),
  collective("06e9bce1c362bb3a88dffb57", "上郡属国降胡万余人逃入匈奴"),
  promote("da18fe19e74d096a3a468cac", "刘霸被立为广陵王", {
    personBindings: [binding("liuBa", ["霸", "廣陵厲王太子霸"])],
  }),
  promote("e4cece0766ba436032848a80", "刘骜被立为皇太子", {
    personBindings: [binding("liuAo", ["皇太子"])],
    removePersonNames: ["刘奭"],
  }),
  promote("2e9304e32fb9b740845d63a8", "刘宗被立为长沙王", {
    personBindings: [binding("liuZong", ["宗", "長沙煬王弟宗"])],
    placeBindings: [{ id: "changsha-commandery", label: "长沙", role: "primary-location" }],
  }),
  promote("dcc94701ed8845f0dfafd234", "冯奉世率军出击西羌", {
    summary: "西羌反叛，汉元帝遣右将军冯奉世率军出击。",
    personBindings: [binding("fengFengshi", ["馮奉世"])],
  }),
  collective("be1144a58474bfc8711b1a63", "西羌叛乱平定", {
    summary: "永光三年春，西羌平定，汉军撤兵。",
  }),
  promote("b12d4588c358ae6cf049f0b9", "河间王刘元被废迁房陵", {
    personBindings: [binding("liuYuan", ["河間王元"])],
  }),
  promote("5bbebd94e26a189472aec30c", "上官皇后去世", {
    personBindings: [binding("empressShangguan", ["太皇太后上官氏"])],
  }),
  context("5dc41c5c84794cda32f62723", "丞相韦玄成去世"),
  context("5711564e6a9f202ffe8557ee", "中山王刘竟去世"),
  promote("1847a8a6cfe3e392ce07bb19", "呼韩邪单于来朝汉廷", {
    personBindings: [binding("huhanye", ["虖韓邪單于"])],
  }),
  promote("03173ccbeea71056a120e0d2", "汉元帝刘奭驾崩于未央宫", {
    personBindings: [binding("liuShi", ["帝"])],
  }),
  collective("d66d05a89c634da2e8ca5179", "汉廷罢郡国祖宗庙"),
];

export const canonicalPeople = Object.values(people);
export default {
  profileId,
  batchId,
  periodId,
  generator,
  coverageMode: "complete",
  canonicalPeople: Object.values(people),
  decisions,
  batchNotes: "Adjudicated Hanshu Yuandi annal candidates for 48-33 BCE; routine official and princely deaths remain context while explicit succession, frontier, military and diplomatic events are promoted.",
};
