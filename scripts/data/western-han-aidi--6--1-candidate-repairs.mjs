export const profileId = "china-western-han-xin-transition--8-24-v1";
export const batchId = "auto-hanshu-western-han-aidi--6--1-candidates";
export const periodId = "china-western-han-xin-transition--8-24";
export const generator = "official-history-candidate-repair:western-han-aidi--6--1-v1";

const card = (suffix) => "card:hanshu-western-han-aidi--6--1:" + suffix;
const person = (id, name, summary, aliases = [], extra = {}) => ({
  id, name, summary, aliases, primaryPolity: extra.primaryPolity ?? "西汉",
  birthYear: extra.birthYear, deathYear: extra.deathYear,
});
const people = {
  dingJi: person("wh-ding-ji-aidi", "丁姬", "汉哀帝刘欣之母，哀帝即位后尊为帝太后。", ["帝太后丁氏", "丁氏"], { deathYear: -5 }),
  liuMin: person("wh-liu-min-lu", "刘闵", "鲁顷王之子，原封郚乡侯，建平三年被立为鲁王。", ["郚乡侯闵", "郚鄉侯閔", "鲁王闵"]),
  pingDang: person("wh-ping-dang", "平当", "西汉丞相，建平三年去世。", ["平當", "丞相当", "丞相當"], { deathYear: -4 }),
  dongXian: person("wh-dong-xian", "董贤", "汉哀帝近臣，西汉末年历任驸马都尉、大司马。", ["董賢", "大司马董贤"], { deathYear: -1 }),
  xifuGong: person("wh-xifu-gong", "息夫躬", "西汉官员，因告发东平王案件受封列侯。"),
  sunChong: person("wh-sun-chong", "孙宠", "西汉南阳太守，因告发东平王案件受封列侯。", ["孫寵"]),
  fuDowager: person("wh-fu-dowager-aidi", "傅太后", "汉哀帝祖母，哀帝朝尊为皇太太后。", ["傅昭仪", "傅昭儀", "皇太太后傅氏"], { deathYear: -2 }),
  wuzhuliu: person("wh-wuzhuliu-chanyu", "乌珠留若鞮单于", "匈奴单于，元寿二年与乌孙大昆弥来朝。", ["烏珠留若鞮單于", "匈奴单于", "匈奴單于"], { primaryPolity: "匈奴" }),
  kongGuang: person("wh-kong-guang", "孔光", "西汉大臣，汉哀帝末年由丞相改任大司徒。"),
  pengXuan: person("wh-peng-xuan", "彭宣", "西汉大臣，汉哀帝末年由御史大夫改任大司空。"),
};
const binding = (key, sourceNames = [people[key].name]) => ({ personId: people[key].id, canonicalName: people[key].name, sourceNames });
const promote = (suffix, title, options = {}) => ({ cardId: card(suffix), disposition: "promote", title, reason: "《汉书·哀帝纪》主体、结果与纪年明确。", ...options });
const context = (suffix, title, reason) => ({ cardId: card(suffix), disposition: "context", title, reason });

export const decisions = [
  promote("2b7e128afc0d4a48d39b9e50", "帝太后丁姬去世", { personBindings: [binding("dingJi", ["帝太后丁氏"])], preserveAllBoundPeople: true }),
  promote("0ee3280fb5ca5a74c733e5b4", "刘闵被立为鲁王", { personBindings: [binding("liuMin", ["閔", "郚鄉侯閔"])], preserveAllBoundPeople: true }),
  promote("74cae28cdaf3adf6143880a2", "丞相平当去世", { personBindings: [binding("pingDang", ["丞相當", "當"])], preserveAllBoundPeople: true }),
  promote("2302b53fc3754c46aeae48ca", "董贤等三人受封列侯", { personBindings: [binding("dongXian", ["董賢"]), binding("xifuGong", ["息夫躬"]), binding("sunChong", ["孫寵"])], preserveAllBoundPeople: true }),
  promote("39569751408202000b86b0ec", "\u5085\u592a\u540e\u53bb\u4e16", { personBindings: [binding("fuDowager", ["\u7687\u592a\u592a\u540e\u5085\u6c0f"])], removePersonNames: ["\u5085\u6c0f"], removePersonIds: ["han-empress-fu-aidi"] }),
  promote("509d5bcc45d1775cde7e66af", "匈奴乌珠留若鞮单于与乌孙大昆弥来朝", { personBindings: [binding("wuzhuliu", ["匈奴單于"])], preserveAllBoundPeople: true, removePersonNames: ["复株累若鞮单于"], allowCollectiveEvent: true }),
  promote("47abd429220696db0a85d635", "董贤任大司马并改置三公", { personBindings: [binding("dongXian", ["董賢"]), binding("kongGuang", ["孔光"]), binding("pengXuan", ["彭宣"])], preserveAllBoundPeople: true }),
  context("d5825822c4bb8cc5581bdd0a", "班固评汉哀帝临朝施政", "此句是纪末史家论赞，不是独立事件。"),
  promote("fb0d552426b2a8cc8e1109d5", "汉哀帝刘欣驾崩于未央宫", { matchedEventId: "official-history-event:a7759cccd4e0a1b74d29", personBindings: [{ personId: "han-liu-xin-aidi", canonicalName: "刘欣", sourceNames: ["帝", "哀帝"] }], preserveAllBoundPeople: true, placeBindings: [{ id: "weiyang-palace", label: "未央宫", role: "primary-location" }] }),
];

export const canonicalPeople = Object.values(people);
export default { profileId, batchId, periodId, generator, coverageMode: "complete", canonicalPeople, decisions, batchNotes: "Adjudicated Hanshu Aidi annal candidates for 6-1 BCE." };