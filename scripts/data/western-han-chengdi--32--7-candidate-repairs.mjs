export const profileId = "china-western-han-chengdi--32--7-v1";
export const batchId = "auto-hanshu-western-han-chengdi--32--7-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-chengdi--32--7-v1";

const card = (suffix) => "card:hanshu-western-han-chengdi--32--7:" + suffix;
const canonical = (id, name, summary, aliases = [], extra = {}) => ({
  id, name, summary, aliases, primaryPolity: extra.primaryPolity ?? "西汉",
  birthYear: extra.birthYear, deathYear: extra.deathYear,
});

const people = {
  liuLiang: canonical("wh-liu-liang-hejian", "刘良", "西汉宗室，河间王刘元之弟，建始元年被立为河间王。", ["劉良", "河间王良", "河間王良", "良"]),
  wangChong: canonical("wh-wang-chong-ancheng", "王崇", "汉成帝舅，建始元年由关内侯进封安成侯。", ["安成侯王崇"]),
  fuzhulei: canonical("wh-fuzhulei-chanyu", "复株累若鞮单于", "匈奴单于雕陶莫皋，呼韩邪单于之子，河平四年来朝汉廷。", ["復株累若鞮單于", "雕陶莫皋", "匈奴单于", "匈奴單于"], { primaryPolity: "匈奴" }),
  liuXiao: canonical("wh-liu-xiao-chu", "刘嚣", "西汉楚孝王，河平四年去世。", ["劉囂", "楚王嚣", "楚王囂"]),
  liuKang: canonical("wh-liu-kang-dingtao", "刘康", "西汉定陶恭王，汉元帝之子，阳朔二年去世。", ["劉康", "定陶王康"]),
  shentuSheng: canonical("wh-shentu-sheng", "申屠圣", "阳朔三年率颍川铁官徒起事，自称将军并转掠九郡。", ["申屠聖"]),
  liuYu: canonical("wh-liu-yu-dongping", "刘宇", "西汉东平思王，阳朔四年去世。", ["劉宇", "东平王宇", "東平王宇"]),
  empressXu: canonical("wh-empress-xu-chengdi", "许皇后", "汉成帝第一任皇后，鸿嘉三年被废，绥和元年被迫饮药而死。", ["許皇后", "皇后许氏", "皇后許氏", "贵人许氏", "貴人許氏"]),
  qiongcheng: canonical("wh-empress-wang-qiongcheng", "邛成太后", "汉宣帝王皇后，元帝朝为皇太后、成帝朝为太皇太后，永始元年去世。", ["邛成皇后", "太皇太后王氏"]),
  liuLi: canonical("wh-liu-li-chengyang", "刘俚", "西汉城阳王，永始元年被立为王。", ["劉俚", "城阳王俚", "城陽王俚"]),
  zhaoFeiyan: canonical("wh-zhao-feiyan", "赵飞燕", "汉成帝皇后，永始元年册立。", ["趙飛燕", "皇后赵氏", "皇后趙氏", "婕妤赵氏", "婕妤趙氏"]),
  wangJun: canonical("wh-wang-jun-chengdi", "王骏", "西汉御史大夫，永始二年去世。", ["王駿", "御史大夫王骏", "御史大夫王駿"]),
  fanBing: canonical("wh-fan-bing", "樊并", "永始三年在尉氏与同党谋反并自称将军。", ["樊並"]),
  suLing: canonical("wh-su-ling", "苏令", "永始三年率山阳铁官徒起事，转掠郡国十九。", ["蘇令"]),
  zhaoHede: canonical("wh-zhao-hede", "赵合德", "赵飞燕之妹，汉成帝昭仪；《汉书·成帝纪》注文以昭仪赵氏为赵飞燕之妹。", ["趙合德", "昭仪赵氏", "昭儀趙氏"]),
  liuShou: canonical("wh-liu-shou-guangling", "刘守", "西汉广陵王，元延二年被立为王。", ["劉守", "广陵王守", "廣陵王守"]),
  liuXin: canonical("han-liu-xin-aidi", "刘欣", "汉成帝侄，绥和元年被立为皇太子，后即位为汉哀帝。", ["劉欣", "定陶王欣", "皇太子欣"], { deathYear: -1 }),
  liuXing: canonical("han-liu-xing-zhongshan", "刘兴", "西汉中山孝王，绥和元年去世。", ["劉興", "中山王兴", "中山王興"], { deathYear: -8 }),
  zhaiFangjin: canonical("wh-zhai-fangjin", "翟方进", "西汉丞相，绥和二年去世。", ["翟方進", "丞相翟方进", "丞相翟方進"], { deathYear: -7 }),
  liuAo: canonical("han-liu-ao-chengdi", "刘骜", "汉元帝之子，前32年至前7年在位，是为汉成帝。", ["劉驁", "成帝", "孝成皇帝", "帝"], { birthYear: -51, deathYear: -7 }),
  wangMang: canonical("han-wang-mang", "王莽", "西汉末权臣、新朝建立者；永始元年封新都侯。", ["新都侯王莽"], { birthYear: -45, deathYear: 23, primaryPolity: "西汉 / 新" }),
};
const binding = (key, sourceNames = [people[key].name]) => ({
  personId: people[key].id, canonicalName: people[key].name, sourceNames,
});
const opts = (v = {}) => ({
  ...(v.summary ? { summary: v.summary } : {}),
  ...(v.personBindings?.length ? { personBindings: v.personBindings, preserveAllBoundPeople: true } : {}),
  ...(v.removePersonNames?.length ? { removePersonNames: v.removePersonNames } : {}),
  ...(v.placeBindings?.length ? { placeBindings: v.placeBindings } : {}),
  ...(Object.hasOwn(v, "matchedEventId") ? { matchedEventId: v.matchedEventId } : {}),
  ...(v.allowCollectiveEvent ? { allowCollectiveEvent: true } : {}),
});
const promote = (suffix, title, v = {}) => ({ cardId: card(suffix), disposition: "promote", title, reason: v.reason ?? "《汉书·成帝纪》主体、行动与精确纪年明确，具有独立年表意义。", ...opts(v) });
const collective = (suffix, title, v = {}) => promote(suffix, title, { ...v, allowCollectiveEvent: true });
const context = (suffix, title, v = {}) => ({ cardId: card(suffix), disposition: "context", title, reason: v.reason ?? "保留为本纪上下文，不单独晋级为正式事件。", ...opts(v) });

export const decisions = [
  promote("0290d33c77262563b1161b22", "刘良被立为河间王", { personBindings: [binding("liuLiang", ["良", "河間王弟上郡庫令良"])] }),
  promote("30580403943b278d60a0bd1e", "王崇受封安成侯", { personBindings: [binding("wangChong", ["王崇"])] }),
  context("5d82050b49770a861eb93309", "姚尹使团遇风火", { removePersonNames: ["尹等七人"], reason: "这是出使返程中的风火事故，原抽取标题误将受难者尾语识别为人物和军事行动。" }),
  collective("b5d53e6330972d93b82672e8", "汉廷罢中书宦官并增置尚书"),
  collective("b15907199724020def2b4ea0", "汉廷大赦天下"),
  promote("65c91dd1448ff110c4b2eb67", "楚王刘嚣去世", { personBindings: [binding("liuXiao", ["楚王囂"])] }),
  promote("ea8955525157f8aa0ffe1a51", "匈奴复株累若鞮单于来朝汉廷", { personBindings: [binding("fuzhulei", ["匈奴單于"])] }),
  promote("d1260b97ca4339b32fd5c92d", "定陶王刘康去世", { personBindings: [binding("liuKang", ["定陶王康"])] }),
  collective("f079581b231731e039337055", "汉廷大赦天下"),
  promote("5ab5e5019ae5c82236c9ca68", "申屠圣率颍川铁官徒起事", { personBindings: [binding("shentuSheng", ["申屠聖"])], placeBindings: [{ id: "yingchuan", label: "颍川", role: "primary-location" }] }),
  promote("db7ea3c874b2d99c7ba00415", "东平王刘宇去世", { personBindings: [binding("liuYu", ["東平王宇"])] }),
  promote("36cc457b610c5aee5dcc02cf", "许皇后被废", { personBindings: [binding("empressXu", ["皇后許氏"])] }),
  promote("45ab3ba42da8db8186ca758d", "刘俚被立为城阳王", { personBindings: [binding("liuLi", ["俚", "城陽孝王子俚"])] }),
  promote("4e652c2bca0ef5a48b436cd9", "王莽受封新都侯", { personBindings: [binding("wangMang", ["王莽"])] }),
  collective("5abb7917616bf626ff00f554", "汉成帝停止营建昌陵", { placeBindings: [{ id: "changling-han", label: "昌陵", role: "primary-location" }] }),
  promote("608e3b51c8f2f7b049eb0b1b", "邛成太后去世", { personBindings: [binding("qiongcheng", ["太皇太后王氏"])], removePersonNames: ["王政君"] }),
  collective("c088a4b8a53ce88ab5f426e4", "汉廷大赦天下"),
  promote("f4e8d3fd709d3e9aac74035d", "赵飞燕册立为皇后", { personBindings: [binding("zhaoFeiyan", ["皇后趙氏"])] }),
  promote("ba35ae5bddb15b5053d627cf", "御史大夫王骏去世", { personBindings: [binding("wangJun", ["王駿"])] }),
  promote("c2ec008fa6f8260a5b2c5cfb", "樊并等在尉氏起事", { personBindings: [binding("fanBing", ["樊並"])], placeBindings: [{ id: "weishi", label: "尉氏", role: "primary-location" }, { id: "chenliu", label: "陈留", role: "related-location" }] }),
  promote("f217c8ce35cb229c20bd3ad1", "苏令率山阳铁官徒起事", { personBindings: [binding("suLing", ["蘇令"])], placeBindings: [{ id: "shanyang-commandery", label: "山阳", role: "primary-location" }, { id: "dongjun", label: "东郡", role: "related-location" }, { id: "runan", label: "汝南", role: "related-location" }] }),
  collective("faa6b9517764e09da71d4d1a", "汉廷大赦天下"),
  promote("2770a78faac239e2fcc4cb93", "赵合德残害后宫皇子", { personBindings: [binding("zhaoHede", ["昭儀趙氏"])] }),
  promote("a8e2a1af9d3c23fb7e5d0511", "刘守被立为广陵王", { personBindings: [binding("liuShou", ["守", "廣陵孝王子守"])] }),
  collective("51ace25729f2ec53c0eb4d38", "岷山山崩壅塞江水", { placeBindings: [{ id: "minshan", label: "岷山", role: "primary-location" }, { id: "shu-commandery", label: "蜀郡", role: "related-location" }] }),
  collective("05aba8240c0365fcc0dbd581", "汉廷罢刺史改置州牧"),
  collective("1bedd68f221ba1d1a45462ba", "汉廷大赦天下"),
  promote("9fe8b1816db102b3fed9c08d", "\u5218\u6b23\u88ab\u7acb\u4e3a\u7687\u592a\u5b50", { personBindings: [binding("liuXin", ["\u6b23", "\u5b9a\u9676\u738b\u6b23"])], removePersonNames: ["\u5218\u9a9c"] }),
  promote("ab726991e8790a0ca27d5f4b", "中山王刘兴去世", { personBindings: [binding("liuXing", ["中山王興"])], removePersonNames: ["刘衎"] }),
  collective("e75a0d1574c8a246e81d32cf", "汉廷改置大司马与大司空", { summary: "绥和元年，汉廷调整中枢官制：大司马不再兼将军号，御史大夫改为大司空并封列侯。" }),
  promote("5ffd4c61ce4e5d79beaa2a95", "丞相翟方进去世", { personBindings: [binding("zhaiFangjin", ["翟方進"])] }),
  promote("fea60e82a217a347ce493917", "汉成帝刘骜驾崩于未央宫", { personBindings: [binding("liuAo", ["帝"])], placeBindings: [{ id: "weiyang-palace", label: "未央宫", role: "primary-location" }] }),
];

export const canonicalPeople = Object.values(people);
export default {
  profileId, batchId, periodId, generator,
  coverageMode: "complete",
  canonicalPeople,
  decisions,
  batchNotes: "Adjudicated Hanshu Chengdi annal candidates for 32-7 BCE; explicit decrees, institutional reforms, succession, rebellions, disasters and dated deaths are promoted, while the misclassified diplomatic travel accident remains context.",
};
