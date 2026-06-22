import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeCtextUrl(node) {
  return `https://ctext.org/text.pl?if=gb&node=${node}&remap=gb`;
}

function rolesFor(entry) {
  if (entry.roles) {
    return entry.roles;
  }

  if (entry.category === "emperor") {
    return ["皇帝", "魏书本纪人物"];
  }

  if (entry.category === "empress") {
    return ["后妃", "魏书后妃传人物"];
  }

  if (entry.category === "prince") {
    return ["曹魏宗室", "魏书宗室传人物"];
  }

  if (entry.category === "warlord") {
    return ["汉末军阀", "魏书列传人物"];
  }

  if (entry.category === "fangji") {
    return ["方技人物", "魏书方技传人物"];
  }

  if (entry.category === "general") {
    return ["曹魏将领", "魏书列传人物"];
  }

  return ["曹魏人物", "魏书列传人物"];
}

function primaryPolityFor(entry) {
  if (entry.primaryPolity) {
    return entry.primaryPolity;
  }

  if (entry.category === "warlord") {
    return "东汉末地方势力 / 曹魏相关";
  }

  if (entry.category === "emperor" || entry.category === "empress" || entry.category === "prince") {
    return "曹魏";
  }

  if (entry.category === "fangji") {
    return "东汉末 / 曹魏相关";
  }

  return "曹操集团 / 曹魏";
}

function sourceTitleFor(entry) {
  return `三国志·魏书·${entry.sourceTitle}`;
}

function citationFor(entry) {
  return `《三国志·魏书·${entry.sourceTitle}》`;
}

const weiShuEntries = [
  { id: "cao-cao", name: "曹操", sourceId: "sanguozhi-wei-wudi", sourceTitle: "武帝纪", node: 601875, category: "emperor" },
  { id: "cao-pi", name: "曹丕", sourceId: "sanguozhi-wei-wendi", sourceTitle: "文帝纪", node: 602006, category: "emperor" },
  { id: "cao-rui", name: "曹叡", sourceId: "sanguozhi-wei-mingdi", sourceTitle: "明帝纪", node: 602047, category: "emperor", courtesyName: "元仲", life: "204-239" },
  { id: "cao-fang", name: "曹芳", sourceId: "sanguozhi-wei-qi-wang", sourceTitle: "齐王纪", node: 602095, category: "emperor", life: "232-274" },
  { id: "cao-mao", name: "曹髦", sourceId: "sanguozhi-wei-gaogui-xianggong", sourceTitle: "高贵乡公纪", node: 602124, category: "emperor", courtesyName: "彦士", life: "241-260" },
  { id: "cao-huan", name: "曹奂", sourceId: "sanguozhi-wei-chenliu-wang", sourceTitle: "陈留王纪", node: 602162, category: "emperor", life: "246-302" },

  { id: "empress-bian", name: "卞皇后", sourceId: "sanguozhi-wei-empress-bian", sourceTitle: "武宣卞皇后传", node: 602190, category: "empress", life: "160-230" },
  { id: "empress-zhen", name: "甄皇后", sourceId: "sanguozhi-wei-empress-zhen", sourceTitle: "文昭甄皇后传", node: 602196, category: "empress", life: "183-221" },
  { id: "empress-guo-wende", name: "郭皇后", sourceId: "sanguozhi-wei-empress-guo-wende", sourceTitle: "文德郭皇后传", node: 602203, category: "empress", life: "184-235" },
  { id: "empress-mao", name: "毛皇后", sourceId: "sanguozhi-wei-empress-mao", sourceTitle: "明悼毛皇后传", node: 602209, category: "empress", life: "?-237" },
  { id: "empress-guo-mingyuan", name: "郭皇后", sourceId: "sanguozhi-wei-empress-guo-mingyuan", sourceTitle: "明元郭皇后传", node: 602214, category: "empress", life: "?-264" },

  { id: "dong-zhuo", name: "董卓", sourceId: "sanguozhi-wei-dong-zhuo", sourceTitle: "董卓传", node: 602219, category: "warlord", primaryPolity: "凉州军 / 东汉朝廷" },
  { id: "yuan-shao", name: "袁绍", sourceId: "sanguozhi-wei-yuan-shao", sourceTitle: "袁绍传", node: 602234, category: "warlord", primaryPolity: "袁绍集团" },
  { id: "yuan-shu", name: "袁术", sourceId: "sanguozhi-wei-yuan-shu", sourceTitle: "袁术传", node: 602248, category: "warlord", primaryPolity: "袁术集团" },
  { id: "liu-biao", name: "刘表", sourceId: "sanguozhi-wei-liu-biao", sourceTitle: "刘表传", node: 602253, category: "warlord", primaryPolity: "刘表集团" },
  { id: "lu-bu", name: "吕布", sourceId: "sanguozhi-wei-lubu", sourceTitle: "吕布传", node: 602263, category: "warlord", primaryPolity: "吕布集团" },
  { id: "zhang-miao", name: "张邈", sourceId: "sanguozhi-wei-zhang-miao", sourceTitle: "张邈传", node: 602269, category: "warlord", primaryPolity: "陈留张邈集团" },
  { id: "zang-hong", name: "臧洪", sourceId: "sanguozhi-wei-zang-hong", sourceTitle: "臧洪传", node: 602280, category: "warlord", primaryPolity: "袁绍集团相关" },
  { id: "gongsun-zan", name: "公孙瓒", sourceId: "sanguozhi-wei-gongsun-zan", sourceTitle: "公孙瓒传", node: 602294, category: "warlord", primaryPolity: "公孙瓒集团" },
  { id: "tao-qian", name: "陶谦", sourceId: "sanguozhi-wei-tao-qian", sourceTitle: "陶谦传", node: 602302, category: "warlord", primaryPolity: "徐州陶谦集团" },
  { id: "zhang-yang", name: "张杨", sourceId: "sanguozhi-wei-zhang-yang", sourceTitle: "张杨传", node: 602307, category: "warlord", primaryPolity: "河内张杨集团" },
  { id: "gongsun-du", name: "公孙度", sourceId: "sanguozhi-wei-gongsun-du", sourceTitle: "公孙度传", node: 602310, category: "warlord", primaryPolity: "辽东公孙氏" },
  { id: "zhang-yan", name: "张燕", sourceId: "sanguozhi-wei-zhang-yan", sourceTitle: "张燕传", node: 602318, category: "warlord", primaryPolity: "黑山军 / 曹操集团" },
  { id: "zhang-xiu", name: "张绣", sourceId: "sanguozhi-wei-zhang-xiu", sourceTitle: "张绣传", node: 602321, category: "warlord", primaryPolity: "张济旧部 / 曹操集团" },
  { id: "zhang-lu", name: "张鲁", sourceId: "sanguozhi-wei-zhang-lu", sourceTitle: "张鲁传", node: 602324, category: "warlord", primaryPolity: "汉中张鲁集团" },

  { id: "xiahou-dun", name: "夏侯惇", sourceId: "sanguozhi-wei-xiahou-dun", sourceTitle: "夏侯惇传", node: 602330, category: "general" },
  { id: "xiahou-yuan", name: "夏侯渊", sourceId: "sanguozhi-wei-xiahou-yuan", sourceTitle: "夏侯渊传", node: 602336, category: "general" },
  { id: "cao-ren", name: "曹仁", sourceId: "sanguozhi-wei-cao-ren", sourceTitle: "曹仁传", node: 602347, category: "general" },
  { id: "cao-hong", name: "曹洪", sourceId: "sanguozhi-wei-cao-hong", sourceTitle: "曹洪传", node: 602357, category: "general", life: "?-232" },
  { id: "cao-xiu", name: "曹休", sourceId: "sanguozhi-wei-cao-xiu", sourceTitle: "曹休传", node: 602363, category: "general" },
  { id: "cao-zhen", name: "曹真", sourceId: "sanguozhi-wei-cao-zhen", sourceTitle: "曹真传", node: 602370, category: "general" },
  { id: "cao-shuang", name: "曹爽", sourceId: "sanguozhi-wei-cao-shuang", sourceTitle: "曹爽传", node: 602375, category: "general", life: "?-249" },
  { id: "xiahou-shang", name: "夏侯尚", sourceId: "sanguozhi-wei-xiahou-shang", sourceTitle: "夏侯尚传", node: 602383, category: "general", courtesyName: "伯仁", life: "?-225" },

  { id: "xun-yu", name: "荀彧", sourceId: "sanguozhi-wei-xun-yu", sourceTitle: "荀彧传", node: 602398 },
  { id: "xun-you", name: "荀攸", sourceId: "sanguozhi-wei-xun-you", sourceTitle: "荀攸传", node: 602412 },
  { id: "jia-xu", name: "贾诩", sourceId: "sanguozhi-wei-jia-xu", sourceTitle: "贾诩传", node: 602422 },

  { id: "yuan-huan", name: "袁涣", sourceId: "sanguozhi-wei-yuan-huan", sourceTitle: "袁涣传", node: 602432 },
  { id: "zhang-fan", name: "张范", sourceId: "sanguozhi-wei-zhang-fan", sourceTitle: "张范传", node: 602439 },
  { id: "liang-mao", name: "凉茂", sourceId: "sanguozhi-wei-liang-mao", sourceTitle: "凉茂传", node: 602443 },
  { id: "guo-yuan", name: "国渊", sourceId: "sanguozhi-wei-guo-yuan", sourceTitle: "国渊传", node: 602446 },
  { id: "tian-chou", name: "田畴", sourceId: "sanguozhi-wei-tian-chou", sourceTitle: "田畴传", node: 602450 },
  { id: "wang-xiu", name: "王修", sourceId: "sanguozhi-wei-wang-xiu", sourceTitle: "王修传", node: 602456 },
  { id: "bing-yuan", name: "邴原", sourceId: "sanguozhi-wei-bing-yuan", sourceTitle: "邴原传", node: 602461 },
  { id: "guan-ning", name: "管宁", sourceId: "sanguozhi-wei-guan-ning", sourceTitle: "管宁传", node: 602466 },

  { id: "cui-yan", name: "崔琰", sourceId: "sanguozhi-wei-cui-yan", sourceTitle: "崔琰传", node: 602481 },
  { id: "mao-jie", name: "毛玠", sourceId: "sanguozhi-wei-mao-jie", sourceTitle: "毛玠传", node: 602491 },
  { id: "xu-yi", name: "徐奕", sourceId: "sanguozhi-wei-xu-yi", sourceTitle: "徐奕传", node: 602496 },
  { id: "he-kui", name: "何夔", sourceId: "sanguozhi-wei-he-kui", sourceTitle: "何夔传", node: 602500 },
  { id: "xing-yong", name: "邢颙", sourceId: "sanguozhi-wei-xing-yong", sourceTitle: "邢颙传", node: 602506 },
  { id: "bao-xun", name: "鲍勋", sourceId: "sanguozhi-wei-bao-xun", sourceTitle: "鲍勋传", node: 602510 },
  { id: "sima-zhi", name: "司马芝", sourceId: "sanguozhi-wei-sima-zhi", sourceTitle: "司马芝传", node: 602517 },

  { id: "zhong-yao", name: "钟繇", sourceId: "sanguozhi-wei-zhong-yao", sourceTitle: "钟繇传", node: 602528 },
  { id: "zhong-yu", name: "钟毓", sourceId: "sanguozhi-wei-zhong-yao", sourceTitle: "钟繇传", node: 602528, locator: "钟毓附传" },
  { id: "hua-xin", name: "华歆", sourceId: "sanguozhi-wei-hua-xin", sourceTitle: "华歆传", node: 602537 },
  { id: "wang-lang", name: "王朗", sourceId: "sanguozhi-wei-wang-lang", sourceTitle: "王朗传", node: 602545 },
  { id: "wang-su", name: "王肃", sourceId: "sanguozhi-wei-wang-lang", sourceTitle: "王朗传", node: 602545, locator: "王肃附传" },

  { id: "cheng-yu", name: "程昱", sourceId: "sanguozhi-wei-cheng-yu", sourceTitle: "程昱传", node: 602564 },
  { id: "guo-jia", name: "郭嘉", sourceId: "sanguozhi-wei-guo-jia", sourceTitle: "郭嘉传", node: 602573 },
  { id: "dong-zhao", name: "董昭", sourceId: "sanguozhi-wei-dong-zhao", sourceTitle: "董昭传", node: 602582 },
  { id: "liu-ye", name: "刘晔", sourceId: "sanguozhi-wei-liu-ye", sourceTitle: "刘晔传", node: 602594 },
  { id: "jiang-ji", name: "蒋济", sourceId: "sanguozhi-wei-jiang-ji", sourceTitle: "蒋济传", node: 602604 },
  { id: "liu-fang", name: "刘放", sourceId: "sanguozhi-wei-liu-fang-sun-zi", sourceTitle: "刘放孙资传", node: 602613 },
  { id: "sun-zi", name: "孙资", sourceId: "sanguozhi-wei-liu-fang-sun-zi", sourceTitle: "刘放孙资传", node: 602613, locator: "孙资附传" },

  { id: "liu-fu", name: "刘馥", sourceId: "sanguozhi-wei-liu-fu", sourceTitle: "刘馥传", node: 602622 },
  { id: "sima-lang", name: "司马朗", sourceId: "sanguozhi-wei-sima-lang", sourceTitle: "司马朗传", node: 602628 },
  { id: "liang-xi", name: "梁习", sourceId: "sanguozhi-wei-liang-xi", sourceTitle: "梁习传", node: 602635 },
  { id: "zhang-ji-wei", name: "张既", sourceId: "sanguozhi-wei-zhang-ji", sourceTitle: "张既传", node: 602639 },
  { id: "wen-hui", name: "温恢", sourceId: "sanguozhi-wei-wen-hui", sourceTitle: "温恢传", node: 602647 },
  { id: "jia-kui", name: "贾逵", sourceId: "sanguozhi-wei-jia-kui", sourceTitle: "贾逵传", node: 602653 },

  { id: "ren-jun", name: "任峻", sourceId: "sanguozhi-wei-ren-jun", sourceTitle: "任峻传", node: 602663 },
  { id: "su-ze", name: "苏则", sourceId: "sanguozhi-wei-su-ze", sourceTitle: "苏则传", node: 602667 },
  { id: "du-ji", name: "杜畿", sourceId: "sanguozhi-wei-du-ji", sourceTitle: "杜畿传", node: 602673 },
  { id: "zheng-hun", name: "郑浑", sourceId: "sanguozhi-wei-zheng-hun", sourceTitle: "郑浑传", node: 602699 },
  { id: "cang-ci", name: "仓慈", sourceId: "sanguozhi-wei-cang-ci", sourceTitle: "仓慈传", node: 602704 },

  { id: "zhang-liao", name: "张辽", sourceId: "sanguozhi-wei-zhang-liao", sourceTitle: "张辽传", node: 602710, category: "general" },
  { id: "yue-jin", name: "乐进", sourceId: "sanguozhi-wei-yue-jin", sourceTitle: "乐进传", node: 602719, category: "general" },
  { id: "yu-jin", name: "于禁", sourceId: "sanguozhi-wei-yu-jin", sourceTitle: "于禁传", node: 602722, category: "general" },
  { id: "zhang-he", name: "张郃", sourceId: "sanguozhi-wei-zhang-he", sourceTitle: "张郃传", node: 602727, category: "general" },
  { id: "xu-huang", name: "徐晃", sourceId: "sanguozhi-wei-xu-huang", sourceTitle: "徐晃传", node: 602734, category: "general" },
  { id: "li-dian", name: "李典", sourceId: "sanguozhi-wei-li-dian", sourceTitle: "李典传", node: 602744, category: "general" },
  { id: "li-tong", name: "李通", sourceId: "sanguozhi-wei-li-tong", sourceTitle: "李通传", node: 602750, category: "general" },
  { id: "zang-ba", name: "臧霸", sourceId: "sanguozhi-wei-zang-ba", sourceTitle: "臧霸传", node: 602756, category: "general" },
  { id: "wen-pin", name: "文聘", sourceId: "sanguozhi-wei-wen-pin", sourceTitle: "文聘传", node: 602761, category: "general" },
  { id: "lv-qian", name: "吕虔", sourceId: "sanguozhi-wei-lv-qian", sourceTitle: "吕虔传", node: 602766, category: "general" },
  { id: "xu-chu", name: "许褚", sourceId: "sanguozhi-wei-xu-chu", sourceTitle: "许褚传", node: 602769, category: "general" },
  { id: "dian-wei", name: "典韦", sourceId: "sanguozhi-wei-dian-wei", sourceTitle: "典韦传", node: 602773, category: "general" },
  { id: "pang-de", name: "庞德", sourceId: "sanguozhi-wei-pang-de", sourceTitle: "庞德传", node: 602776, category: "general" },
  { id: "pang-yu", name: "庞淯", sourceId: "sanguozhi-wei-pang-yu", sourceTitle: "庞淯传", node: 602780 },
  { id: "yan-wen", name: "阎温", sourceId: "sanguozhi-wei-yan-wen", sourceTitle: "阎温传", node: 602784 },

  { id: "cao-zhang", name: "曹彰", sourceId: "sanguozhi-wei-cao-zhang", sourceTitle: "任城威王彰传", node: 602790, category: "prince", courtesyName: "子文", life: "?-223" },
  { id: "cao-zhi", name: "曹植", sourceId: "sanguozhi-wei-cao-zhi", sourceTitle: "陈思王植传", node: 602795, category: "prince", courtesyName: "子建", life: "192-232" },
  { id: "cao-xiong", name: "曹熊", sourceId: "sanguozhi-wei-cao-xiong", sourceTitle: "萧怀王熊传", node: 602824, category: "prince" },
  { id: "cao-ang", name: "曹昂", sourceId: "sanguozhi-wei-cao-ang", sourceTitle: "丰愍王昂传", node: 602831, category: "prince", life: "?-197" },
  { id: "cao-shuo", name: "曹铄", sourceId: "sanguozhi-wei-cao-shuo", sourceTitle: "相殇王铄传", node: 602833, category: "prince" },
  { id: "cao-chong", name: "曹冲", sourceId: "sanguozhi-wei-cao-chong", sourceTitle: "邓哀王冲传", node: 602835, category: "prince", courtesyName: "仓舒", life: "196-208" },
  { id: "cao-ju", name: "曹据", sourceId: "sanguozhi-wei-cao-ju", sourceTitle: "彭城王据传", node: 602838, category: "prince" },
  { id: "cao-yu", name: "曹宇", sourceId: "sanguozhi-wei-cao-yu", sourceTitle: "燕王宇传", node: 602841, category: "prince" },
  { id: "cao-lin", name: "曹林", sourceId: "sanguozhi-wei-cao-lin", sourceTitle: "沛穆王林传", node: 602843, category: "prince" },
  { id: "cao-gun", name: "曹衮", sourceId: "sanguozhi-wei-cao-gun", sourceTitle: "中山恭王衮传", node: 602846, category: "prince" },
  { id: "cao-xuan", name: "曹玹", sourceId: "sanguozhi-wei-cao-xuan", sourceTitle: "济阳怀王玹传", node: 602850, category: "prince" },
  { id: "cao-jun", name: "曹峻", sourceId: "sanguozhi-wei-cao-jun", sourceTitle: "陈留恭王峻传", node: 602852, category: "prince" },
  { id: "cao-ju-fanyang", name: "曹矩", sourceId: "sanguozhi-wei-cao-ju-fanyang", sourceTitle: "范阳闵王矩传", node: 602854, category: "prince" },
  { id: "cao-gan", name: "曹干", sourceId: "sanguozhi-wei-cao-gan", sourceTitle: "赵王干传", node: 602856, category: "prince" },
  { id: "cao-shang", name: "曹上", sourceId: "sanguozhi-wei-cao-shang", sourceTitle: "临邑殇公子上传", node: 602859, category: "prince" },
  { id: "cao-biao", name: "曹彪", sourceId: "sanguozhi-wei-cao-biao", sourceTitle: "楚王彪传", node: 602861, category: "prince", life: "195-251" },
  { id: "cao-qin", name: "曹勤", sourceId: "sanguozhi-wei-cao-qin", sourceTitle: "刚殇公子勤传", node: 602864, category: "prince" },
  { id: "cao-cheng", name: "曹乘", sourceId: "sanguozhi-wei-cao-cheng", sourceTitle: "谷城殇公子乘传", node: 602866, category: "prince" },
  { id: "cao-zheng", name: "曹整", sourceId: "sanguozhi-wei-cao-zheng", sourceTitle: "郿戴公子整传", node: 602868, category: "prince" },
  { id: "cao-jing", name: "曹京", sourceId: "sanguozhi-wei-cao-jing", sourceTitle: "灵殇公子京传", node: 602870, category: "prince" },
  { id: "cao-jun-fan", name: "曹均", sourceId: "sanguozhi-wei-cao-jun-fan", sourceTitle: "樊安公均传", node: 602872, category: "prince" },
  { id: "cao-ji", name: "曹棘", sourceId: "sanguozhi-wei-cao-ji", sourceTitle: "广宗殇公子棘传", node: 602874, category: "prince" },
  { id: "cao-hui", name: "曹徽", sourceId: "sanguozhi-wei-cao-hui", sourceTitle: "东平灵王徽传", node: 602876, category: "prince" },
  { id: "cao-mao-prince", name: "曹茂", sourceId: "sanguozhi-wei-cao-mao-prince", sourceTitle: "乐陵王茂传", node: 602879, category: "prince" },
  { id: "cao-xie", name: "曹协", sourceId: "sanguozhi-wei-cao-xie", sourceTitle: "赞哀王协传", node: 602882, category: "prince" },
  { id: "cao-rui-prince", name: "曹蕤", sourceId: "sanguozhi-wei-cao-rui-prince", sourceTitle: "北海悼王蕤传", node: 602884, category: "prince" },
  { id: "cao-jian", name: "曹鉴", sourceId: "sanguozhi-wei-cao-jian", sourceTitle: "东武阳怀王鉴传", node: 602886, category: "prince" },
  { id: "cao-lin-donghai", name: "曹霖", sourceId: "sanguozhi-wei-cao-lin-donghai", sourceTitle: "东海定王霖传", node: 602888, category: "prince" },
  { id: "cao-li", name: "曹礼", sourceId: "sanguozhi-wei-cao-li", sourceTitle: "元城哀王礼传", node: 602890, category: "prince" },
  { id: "cao-yong", name: "曹邕", sourceId: "sanguozhi-wei-cao-yong", sourceTitle: "邯郸怀王邕传", node: 602892, category: "prince" },
  { id: "cao-gong", name: "曹贡", sourceId: "sanguozhi-wei-cao-gong", sourceTitle: "清河悼王贡传", node: 602894, category: "prince" },
  { id: "cao-yan", name: "曹俨", sourceId: "sanguozhi-wei-cao-yan", sourceTitle: "广平哀王俨传", node: 602896, category: "prince" },

  { id: "wang-can", name: "王粲", sourceId: "sanguozhi-wei-wang-can", sourceTitle: "王粲传", node: 602902 },
  { id: "wei-ji", name: "卫觊", sourceId: "sanguozhi-wei-wei-ji", sourceTitle: "卫觊传", node: 602919 },
  { id: "liu-yi", name: "刘廙", sourceId: "sanguozhi-wei-liu-yi", sourceTitle: "刘廙传", node: 602924 },
  { id: "liu-shao", name: "刘劭", sourceId: "sanguozhi-wei-liu-shao", sourceTitle: "刘劭传", node: 602929 },
  { id: "fu-gu", name: "傅嘏", sourceId: "sanguozhi-wei-fu-gu", sourceTitle: "傅嘏传", node: 602939 },

  { id: "huan-jie", name: "桓阶", sourceId: "sanguozhi-wei-huan-jie", sourceTitle: "桓阶传", node: 602947 },
  { id: "chen-qun", name: "陈群", sourceId: "sanguozhi-wei-chen-qun", sourceTitle: "陈群传", node: 602952 },
  { id: "chen-tai", name: "陈泰", sourceId: "sanguozhi-wei-chen-qun", sourceTitle: "陈群传", node: 602952, locator: "陈泰附传" },
  { id: "chen-jiao", name: "陈矫", sourceId: "sanguozhi-wei-chen-jiao", sourceTitle: "陈矫传", node: 602965 },
  { id: "xu-xuan", name: "徐宣", sourceId: "sanguozhi-wei-xu-xuan", sourceTitle: "徐宣传", node: 602972 },
  { id: "wei-zhen", name: "卫臻", sourceId: "sanguozhi-wei-wei-zhen", sourceTitle: "卫臻传", node: 602976 },
  { id: "lu-yu", name: "卢毓", sourceId: "sanguozhi-wei-lu-yu", sourceTitle: "卢毓传", node: 602982 },

  { id: "he-qia", name: "和洽", sourceId: "sanguozhi-wei-he-qia", sourceTitle: "和洽传", node: 602991 },
  { id: "chang-lin", name: "常林", sourceId: "sanguozhi-wei-chang-lin", sourceTitle: "常林传", node: 603000 },
  { id: "yang-jun", name: "杨俊", sourceId: "sanguozhi-wei-yang-jun", sourceTitle: "杨俊传", node: 603005 },
  { id: "du-xi", name: "杜袭", sourceId: "sanguozhi-wei-du-xi", sourceTitle: "杜袭传", node: 603010 },
  { id: "zhao-yan", name: "赵俨", sourceId: "sanguozhi-wei-zhao-yan", sourceTitle: "赵俨传", node: 603017 },
  { id: "pei-qian", name: "裴潜", sourceId: "sanguozhi-wei-pei-qian", sourceTitle: "裴潜传", node: 603024 },

  { id: "han-ji", name: "韩暨", sourceId: "sanguozhi-wei-han-ji", sourceTitle: "韩暨传", node: 603031 },
  { id: "cui-lin", name: "崔林", sourceId: "sanguozhi-wei-cui-lin", sourceTitle: "崔林传", node: 603036 },
  { id: "gao-rou", name: "高柔", sourceId: "sanguozhi-wei-gao-rou", sourceTitle: "高柔传", node: 603045 },
  { id: "sun-li", name: "孙礼", sourceId: "sanguozhi-wei-sun-li", sourceTitle: "孙礼传", node: 603062 },
  { id: "wang-guan", name: "王观", sourceId: "sanguozhi-wei-wang-guan", sourceTitle: "王观传", node: 603069 },

  { id: "xin-pi", name: "辛毗", sourceId: "sanguozhi-wei-xin-pi", sourceTitle: "辛毗传", node: 603074 },
  { id: "yang-fu", name: "杨阜", sourceId: "sanguozhi-wei-yang-fu", sourceTitle: "杨阜传", node: 603084 },
  { id: "gao-tang-long", name: "高堂隆", sourceId: "sanguozhi-wei-gao-tang-long", sourceTitle: "高堂隆传", node: 603099 },

  { id: "man-chong", name: "满宠", sourceId: "sanguozhi-wei-man-chong", sourceTitle: "满宠传", node: 603126, category: "general" },
  { id: "tian-yu", name: "田豫", sourceId: "sanguozhi-wei-tian-yu", sourceTitle: "田豫传", node: 603135, category: "general" },
  { id: "qian-zhao", name: "牵招", sourceId: "sanguozhi-wei-qian-zhao", sourceTitle: "牵招传", node: 603146, category: "general" },
  { id: "guo-huai", name: "郭淮", sourceId: "sanguozhi-wei-guo-huai", sourceTitle: "郭淮传", node: 603156, category: "general" },

  { id: "xu-miao", name: "徐邈", sourceId: "sanguozhi-wei-xu-miao", sourceTitle: "徐邈传", node: 603166 },
  { id: "hu-zhi", name: "胡质", sourceId: "sanguozhi-wei-hu-zhi", sourceTitle: "胡质传", node: 603172 },
  { id: "wang-chang", name: "王昶", sourceId: "sanguozhi-wei-wang-chang", sourceTitle: "王昶传", node: 603179 },
  { id: "wang-ji", name: "王基", sourceId: "sanguozhi-wei-wang-ji", sourceTitle: "王基传", node: 603189 },

  { id: "wang-ling", name: "王凌", sourceId: "sanguozhi-wei-wang-ling", sourceTitle: "王凌传", node: 603203, category: "general" },
  { id: "guanqiu-jian", name: "毌丘俭", sourceId: "sanguozhi-wei-guanqiu-jian", sourceTitle: "毌丘俭传", node: 603208, category: "general" },
  { id: "zhuge-dan", name: "诸葛诞", sourceId: "sanguozhi-wei-zhuge-dan", sourceTitle: "诸葛诞传", node: 603218, category: "general" },
  { id: "deng-ai", name: "邓艾", sourceId: "sanguozhi-wei-deng-ai", sourceTitle: "邓艾传", node: 603228, category: "general" },
  { id: "zhong-hui", name: "钟会", sourceId: "sanguozhi-wei-zhong-hui", sourceTitle: "钟会传", node: 603245, category: "general" },

  { id: "hua-tuo", name: "华佗", sourceId: "sanguozhi-wei-hua-tuo", sourceTitle: "华佗传", node: 603261, category: "fangji", life: "?-208" },
  { id: "du-kui", name: "杜夔", sourceId: "sanguozhi-wei-du-kui", sourceTitle: "杜夔传", node: 603282, category: "fangji" },
  { id: "zhu-jianping", name: "朱建平", sourceId: "sanguozhi-wei-zhu-jianping", sourceTitle: "朱建平传", node: 603288, category: "fangji" },
  { id: "zhou-xuan", name: "周宣", sourceId: "sanguozhi-wei-zhou-xuan", sourceTitle: "周宣传", node: 603293, category: "fangji" },
  { id: "guan-lu", name: "管辂", sourceId: "sanguozhi-wei-guan-lu", sourceTitle: "管辂传", node: 603298, category: "fangji", courtesyName: "公明", life: "209-256" }
];

const nonPersonWeiShuSections = [
  {
    sourceId: "sanguozhi-wei-wuwan-xianbei-dongyi",
    title: "三国志·魏书·乌丸鲜卑东夷传",
    node: 603321,
    note: "魏书三十为族群与边疆地理政治材料，暂不作为单个人物档案导入。"
  }
];

const sources = readJson("data/china-sources.json");
const persons = readJson("data/china-persons.json");
const lifeEvents = readJson("data/china-person-life-events.json");
const coveragePlan = readJson("data/cao-wei-person-coverage-plan.json");

const sourceIds = new Set(sources.map((source) => source.id));
const personIds = new Set(persons.map((person) => person.id));
const lifeEventIds = new Set(lifeEvents.map((event) => event.id));

const addedSources = [];
const addedPersons = [];
const addedLifeEvents = [];
const updatedPersons = [];

for (const entry of weiShuEntries) {
  if (!sourceIds.has(entry.sourceId)) {
    const source = {
      id: entry.sourceId,
      title: sourceTitleFor(entry),
      author: "陈寿撰，裴松之注",
      type: "official-history",
      citationShort: citationFor(entry),
      note: `${entry.sourceTitle}，本项目用于《魏书》人物基础建档与后续逐段摘录。`,
      url: normalizeCtextUrl(entry.node)
    };
    sources.push(source);
    sourceIds.add(entry.sourceId);
    addedSources.push(entry.sourceId);
  }

  const locator = entry.locator ?? entry.sourceTitle;
  const existingPerson = persons.find((person) => person.id === entry.id);
  if (existingPerson) {
    const hasSourceRef = existingPerson.sourceRefs?.some((ref) => ref.sourceId === entry.sourceId);
    if (!hasSourceRef) {
      existingPerson.sourceRefs = [...(existingPerson.sourceRefs ?? []), { sourceId: entry.sourceId, locator }];
      updatedPersons.push(entry.id);
    }
    continue;
  }

  const person = {
    id: entry.id,
    name: entry.name,
    courtesyName: entry.courtesyName ?? null,
    life: entry.life ?? null,
    primaryPolity: primaryPolityFor(entry),
    roles: rolesFor(entry),
    summary: `${entry.name}见于《三国志·魏书·${entry.sourceTitle}》。本轮先建立人物档案、原文入口和待整理状态，详细生平节点将按本传、裴注与《资治通鉴》逐段补齐。`,
    coverageStatus: "stub",
    sourceRefs: [
      {
        sourceId: entry.sourceId,
        locator
      }
    ]
  };

  persons.push(person);
  personIds.add(person.id);
  addedPersons.push(person.id);

  const lifeEventId = `${entry.id}-wei-shu-source-seed`;
  if (!lifeEventIds.has(lifeEventId)) {
    const lifeEvent = {
      id: lifeEventId,
      personId: entry.id,
      year: null,
      displayYear: "待考",
      type: "service",
      title: "《三国志·魏书》本传建档",
      summary: `${entry.name}已根据《三国志·魏书·${entry.sourceTitle}》建立基础档案；具体出生、仕历、战事、卒年等节点等待逐段整理。`,
      relatedEventIds: [],
      confidence: "low",
      sourceRefs: [
        {
          sourceId: entry.sourceId,
          locator,
          note: "基础建档来源"
        }
      ]
    };
    lifeEvents.push(lifeEvent);
    lifeEventIds.add(lifeEventId);
    addedLifeEvents.push(lifeEventId);
  }
}

for (const section of nonPersonWeiShuSections) {
  if (!sourceIds.has(section.sourceId)) {
    sources.push({
      id: section.sourceId,
      title: section.title,
      author: "陈寿撰，裴松之注",
      type: "official-history",
      citationShort: `《${section.title}》`,
      note: section.note,
      url: normalizeCtextUrl(section.node)
    });
    sourceIds.add(section.sourceId);
    addedSources.push(section.sourceId);
  }
}

coveragePlan.updatedAt = "2026-06-22";
coveragePlan.scope =
  "曹魏相关人物补全工程：以《三国志》魏书本纪、后妃传、宗室传、列传、方技传为主轴，以《资治通鉴》汉纪/魏纪相关年份互校。";

coveragePlan.phases = [
  {
    id: "wei-biography-seed",
    title: "魏书本纪/本传/附传人物基础建档",
    status: "done",
    note: "已按《三国志·魏书》目录完成基础人物档案、来源入口和待整理年表 seed；魏书三十族群传单列为非个人材料。"
  },
  {
    id: "wei-biography-detail-pass",
    title: "魏书逐传生平节点细化",
    status: "next",
    note: "从曹操、曹丕、曹叡、曹魏宗室、五子良将、淮南三叛、邓艾钟会等优先级开始，逐段补原文摘录、译注、人物关系和事件回链。"
  },
  {
    id: "zizhi-tongjian-cross-check",
    title: "资治通鉴编年互校",
    status: "pending",
    note: "按卷五十八至卷八十一，把同一人物的编年叙事补成 source_mentions 与 person_life_events。"
  },
  {
    id: "pei-commentary-expansion",
    title: "裴松之注扩展人物",
    status: "pending",
    note: "裴注中的别传、魏略、世语等人物先列为 secondary-mention，审核后再升格。"
  }
];

coveragePlan.currentBatches = [
  {
    id: "wei-shu-directory-one-shot-seed",
    title: "《三国志·魏书》目录人物基础导入",
    status: "done",
    personIds: weiShuEntries.map((entry) => entry.id),
    note: "覆盖魏书本纪、后妃、汉末群雄、曹魏宗室、文臣武将、方技人物；新增人物多为 stub，等待逐传细化。"
  },
  {
    id: "wei-shu-non-person-sections",
    title: "魏书非个人材料",
    status: "tracked",
    sourceIds: nonPersonWeiShuSections.map((section) => section.sourceId),
    note: "乌丸鲜卑东夷传先作为边疆/族群资料，不进入人物表。"
  }
];

coveragePlan.trackedPeople = weiShuEntries.map((entry) => ({
  personId: entry.id,
  inPersonTable: true,
  status: addedPersons.includes(entry.id) ? "stub-seeded" : "already-seeded",
  sourceId: entry.sourceId
}));

coveragePlan.importSummary = {
  importedAt: "2026-06-22",
  sourceCatalogue: "https://ctext.org/sanguozhi/zhs",
  sourceLanguage: "简体中文原文入口（CText remap=gb）",
  totalWeiShuPersonEntries: weiShuEntries.length,
  addedSources: addedSources.length,
  addedPersons: addedPersons.length,
  updatedExistingPersons: updatedPersons.length,
  addedStubLifeEvents: addedLifeEvents.length,
  nonPersonSections: nonPersonWeiShuSections.map((section) => section.sourceId),
  limitation:
    "本次是目录级基础建档，不等于完成逐传精读；新增 stub 人物的生卒、仕历、关系、原文摘录和资治通鉴互校仍需后续补充。"
};

writeJson("data/china-sources.json", sources);
writeJson("data/china-persons.json", persons);
writeJson("data/china-person-life-events.json", lifeEvents);
writeJson("data/cao-wei-person-coverage-plan.json", coveragePlan);

console.log(
  JSON.stringify(
    {
      addedSources: addedSources.length,
      addedPersons: addedPersons.length,
      updatedExistingPersons: updatedPersons.length,
      addedStubLifeEvents: addedLifeEvents.length,
      totalWeiShuPersonEntries: weiShuEntries.length
    },
    null,
    2
  )
);
