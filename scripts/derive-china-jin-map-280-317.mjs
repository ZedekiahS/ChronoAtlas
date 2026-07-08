import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceAdminPath = path.join(rootDir, "data", "china-admin-blocks-190-280.json");
const supplementalPath = path.join(rootDir, "data", "china-commandery-supplemental-blocks.json");
const targetAdminPath = path.join(rootDir, "data", "china-admin-blocks-280-317.json");
const targetControlPath = path.join(rootDir, "data", "china-block-control-timeline-280-317.json");

const sourceAdmin = JSON.parse(await readFile(sourceAdminPath, "utf8"));
const supplementalDataset = JSON.parse(await readFile(supplementalPath, "utf8"));

const prefixBlockId = (blockId) => `jin-280-317:${blockId}`;

const westernJinSources = [
  "Derived from QGIS 262CE commandery geometry",
  "CHGIS",
  "谭其骧《中国历史地图集》三国、西晋图幅参照",
  "《晋书·地理志》州郡沿革待逐郡细校",
];

const hanZhaoCore = new Set([
  "平阳郡",
  "河东郡",
  "太原郡",
  "西河郡",
  "上党郡",
  "雁门郡",
  "新兴郡",
  "乐平郡",
  "赵国",
  "常山郡",
  "魏郡",
  "河南尹",
  "弘农郡",
  "京兆郡",
  "冯翊郡",
  "扶风郡",
  "安定郡",
  "北地郡",
]);

const chengHanCore = new Set([
  "汉中郡",
  "梓潼郡",
  "蜀郡",
  "广汉郡",
  "东广汉郡",
  "犍为郡",
  "巴郡",
  "巴西郡",
  "巴东郡",
  "江阳郡",
  "汶山郡",
  "汉嘉郡",
  "朱提郡",
  "云南郡",
  "永昌郡",
  "牂柯郡",
  "建宁郡",
]);

const zhangLiangzhouCore = new Set([
  "金城郡",
  "西平郡",
  "武威郡",
  "张掖郡",
  "西海郡",
  "酒泉郡",
  "敦煌郡",
  "西域长史府",
]);

const qinzhouJinRemnantCore = new Set([
  "广魏郡",
  "天水郡",
  "南安郡",
  "陇西郡",
]);

const diQiangCore = new Set([
  "武都郡",
  "阴平郡",
  "抚夷护军",
  "羌",
  "羌胡",
  "邓麻",
  "马儿敢",
]);

const shiLeCore = new Set([
  "赵国",
  "常山郡",
  "中山国",
  "河间郡",
  "安平郡",
  "巨鹿郡",
  "魏郡",
  "广平郡",
  "阳平郡",
  "清河郡",
  "渤海郡",
  "平原郡",
  "乐陵国",
  "乐安郡",
  "济南国",
  "齐国",
  "北海国",
  "东莱郡",
  "东郡",
  "济阴郡",
  "陈留国",
  "任城郡",
  "山阳郡",
  "东平国",
  "鲁郡",
  "济北国",
  "泰山郡",
  "东莞郡",
  "城阳郡",
]);

const murongLiaodongCore = new Set([
  "昌黎郡",
  "辽东郡",
  "辽西郡",
  "玄菟郡",
  "乐浪郡",
  "带方郡",
  "扶余",
  "高句丽",
  "挹娄",
  "濊貊",
]);

const tuobaDaiCore = new Set([
  "代郡",
  "上谷郡",
  "雁门郡",
  "鲜卑",
]);

const easternJinCoreTerms = [
  "夷洲",
  "朱崖",
  "毗陵",
  "扬州-吴",
  "丹阳",
  "吴郡",
  "会稽",
  "临海",
  "建安",
  "新都",
  "豫章",
  "临川",
  "庐陵",
  "鄱阳",
  "庐江",
  "蕲春",
  "安丰",
  "弋阳",
  "淮南",
  "广陵",
  "南海",
  "高凉",
  "苍梧",
  "郁林",
  "合浦",
  "交趾",
  "九真",
  "日南",
  "临贺",
  "长沙",
  "湘东",
  "衡阳",
  "零陵",
  "桂阳",
  "武陵",
  "南郡",
  "江夏",
  "宜都",
  "建平",
];

function isEasternJinCore(name) {
  return easternJinCoreTerms.some((term) => name.includes(term));
}

function controllerFor(blockName, startYear) {
  if (chengHanCore.has(blockName) && startYear >= 304) {
    return "成汉";
  }
  if (startYear >= 317 && isEasternJinCore(blockName)) {
    return "东晋";
  }
  if (startYear >= 317 && zhangLiangzhouCore.has(blockName)) {
    return "张氏凉州";
  }
  if (startYear >= 317 && qinzhouJinRemnantCore.has(blockName)) {
    return "秦州晋室";
  }
  if (startYear >= 317 && diQiangCore.has(blockName)) {
    return "氐羌诸部";
  }
  if (startYear >= 317 && tuobaDaiCore.has(blockName)) {
    return "拓跋代地";
  }
  if (startYear >= 317 && murongLiaodongCore.has(blockName)) {
    return "慕容辽东";
  }
  if (startYear >= 317 && shiLeCore.has(blockName)) {
    return "石勒集团";
  }
  if (hanZhaoCore.has(blockName) && startYear >= 311) {
    return "汉赵";
  }
  if (startYear >= 317) {
    return "地方势力";
  }
  if (startYear >= 311) {
    return "西晋残余";
  }
  if (startYear >= 291) {
    return "西晋诸王";
  }
  return "西晋";
}

function statusFor(controller, startYear) {
  if (controller === "西晋") {
    return "effective-control";
  }
  if (controller === "西晋残余") {
    return "residual-control";
  }
  if (controller === "地方势力") {
    return "regional-control";
  }
  if (["张氏凉州", "秦州晋室", "氐羌诸部", "拓跋代地", "慕容辽东", "石勒集团"].includes(controller)) {
    return "regional-control";
  }
  if (controller === "西晋诸王") {
    return startYear >= 304 ? "civil-war-fragmentation" : "court-fragmentation";
  }
  return "effective-control";
}

const sourceBlocks = [
  ...sourceAdmin.blocks.map((block) => ({ ...block, featureType: "admin_block" })),
  ...(supplementalDataset.blocks ?? []).map((block) => ({
    ...block,
    featureType: "admin_block_fragment",
    fragmentNote: supplementalDataset.notes ?? null,
  })),
];
const sourceBlockIds = new Set(sourceBlocks.map((block) => block.id));

const blocks = sourceBlocks.map((block) => {
  const nextId = prefixBlockId(block.id);
  const parent = block.parent && sourceBlockIds.has(block.parent) ? prefixBlockId(block.parent) : undefined;
  const controlBlockId = block.controlBlockId && sourceBlockIds.has(block.controlBlockId) ? prefixBlockId(block.controlBlockId) : undefined;

  return {
    ...block,
    id: nextId,
    name: block.name,
    parent,
    controlBlockId,
    canonicalBlockId: block.id,
    basisYear: 280,
    boundaryBasisYear: 262,
    confidence: block.confidence ?? "medium",
    approximate: true,
    notes: [
      "西晋 280-317 第一版派生图层：复用三国 262CE 郡界几何，保持既有地图风格。",
      block.featureType === "admin_block_fragment" ? "此区块为补片，用于补齐现有三国郡界几何中的显示空洞。" : null,
      "郡国拆分、复置、改隶尚需按《晋书·地理志》与《中国历史地图集》西晋图幅逐郡细校。",
    ].filter(Boolean),
    sources: Array.from(new Set([...(block.sources ?? []), ...westernJinSources])),
  };
});

const controlPeriods = [
  [280, 290],
  [291, 303],
  [304, 310],
  [311, 316],
  [317, 317],
];

const records = [];
for (const block of blocks) {
  for (const [startYear, endYear] of controlPeriods) {
    const controller = controllerFor(block.name, startYear);
    records.push({
      blockId: block.id,
      startYear,
      endYear,
      controller,
      status: statusFor(controller, startYear),
      confidence: startYear <= 290 ? "medium" : "low",
      approximate: true,
      sources: [
        "《晋书·地理志》",
        "《资治通鉴》晋纪",
        "谭其骧《中国历史地图集》西晋图幅参照",
        "Derived from QGIS 262CE commandery timeline",
      ],
      note: "第一版控制线以西晋统一、八王之乱、刘渊汉赵、成汉与东晋建康政权为粗粒度分段；不是逐郡精确政区审定。",
    });
  }
}

const adminDataset = {
  schemaVersion: 1,
  model: "china-admin-block-map",
  range: [280, 317],
  basisYear: 280,
  boundaryBasisYear: 262,
  coordinateSystem: sourceAdmin.coordinateSystem ?? "wgs84-lonlat",
  notes: "Western Jin commandery-style layer derived from the existing Three Kingdoms 262CE QGIS/CHGIS geometry to preserve ChronoAtlas map style. This is a first-pass visual layer and must be refined against Jinshu Geography and the Historical Atlas of China Western Jin plates before being treated as a precise Taikang commandery map.",
  blocks,
};

const controlDataset = {
  schemaVersion: 1,
  model: "china-block-control-timeline",
  range: [280, 317],
  keyYears: [280, 291, 304, 311, 316, 317],
  controllers: [
    { id: "西晋", color: "#7a858a" },
    { id: "西晋诸王", color: "#a88a58" },
    { id: "西晋残余", color: "#9a8f78" },
    { id: "汉赵", color: "#6f6a8e" },
    { id: "石勒集团", color: "#7d628f" },
    { id: "成汉", color: "#5f947d" },
    { id: "东晋", color: "#5c8792" },
    { id: "张氏凉州", color: "#8a8f5c" },
    { id: "秦州晋室", color: "#92745a" },
    { id: "拓跋代地", color: "#6f7f6a" },
    { id: "慕容辽东", color: "#6a8195" },
    { id: "氐羌诸部", color: "#8f7a55" },
    { id: "地方势力", color: "#8a7962" },
  ],
  notes: "First-pass Western Jin control timeline. Later iterations should replace the broad controller groups with audited commandery-level records.",
  records,
};

await writeFile(targetAdminPath, `${JSON.stringify(adminDataset, null, 2)}\n`, "utf8");
await writeFile(targetControlPath, `${JSON.stringify(controlDataset, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(rootDir, targetAdminPath)} with ${blocks.length} blocks.`);
console.log(`Wrote ${path.relative(rootDir, targetControlPath)} with ${records.length} records.`);
