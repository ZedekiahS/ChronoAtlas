import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-589-evidence-map-layers";
const periodId = "china-wei-jin-northern-southern-310-589";
const regionId = "china";
const corpusId = "china-wei-jin-northern-southern";
const geometryDatasetId = "china-power-zone-map-310-589";
const controlDatasetId = "china-power-zone-control-timeline-310-589";

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

function compactText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

function polygonFromBounds([west, south, east, north]) {
  return [[[west, south], [east, south], [east, north], [west, north], [west, south]]];
}

function boundsFromPolygon(coordinates) {
  const points = coordinates.flat(2);
  const lons = [];
  const lats = [];
  for (let i = 0; i < points.length; i += 2) {
    lons.push(points[i]);
    lats.push(points[i + 1]);
  }
  return {
    minLon: Math.min(...lons),
    minLat: Math.min(...lats),
    maxLon: Math.max(...lons),
    maxLat: Math.max(...lats),
    pointCount: lons.length,
    ringCount: coordinates.length,
  };
}

const supplementalEvidence = [
  ["china-311-yongjia-luoyang", 311, "palace-fall", "jinshu", "晋书", "帝纪", "怀帝纪，永嘉五年", "正史本纪定位：洛阳失守、怀帝被执。", "晋书·怀帝纪定位永嘉之乱。"],
  ["china-311-yongjia-luoyang", 311, "liu-yao", "jinshu", "晋书", "载记", "刘曜载记", "载记定位：刘曜入洛阳与西晋皇帝被迁。", "刘曜载记补充汉赵方面叙述。"],
  ["china-316-changan-falls-western-jin", 316, "emperor-min", "jinshu", "晋书", "帝纪", "愍帝纪，建兴四年", "正史本纪定位：晋愍帝出降，西晋终结。", "晋书·愍帝纪定位长安陷落。"],
  ["china-316-changan-falls-western-jin", 316, "liu-yao", "jinshu", "晋书", "载记", "刘曜载记", "载记定位：汉赵攻长安、晋帝出降。", "刘曜载记补充汉赵方面叙述。"],
  ["china-317-eastern-jin-jiankang", 317, "yuan-emperor", "jinshu", "晋书", "帝纪", "元帝纪，建武元年", "正史本纪定位：司马睿即晋王位，江东建制。", "晋书·元帝纪定位东晋建制。"],
  ["china-317-eastern-jin-jiankang", 317, "wang-dao", "jinshu", "晋书", "列传", "王导传", "人物传定位：王导辅政与江东士族格局。", "王导传补充东晋建制的人物侧证。"],
  ["china-321-zu-ti-northern-expedition", 321, "zu-ti", "jinshu", "晋书", "列传", "祖逖传", "人物传定位：祖逖渡江北伐、经营豫州。", "祖逖传是此事件后续摘录重点。"],
  ["china-321-zu-ti-northern-expedition", 321, "shi-le", "jinshu", "晋书", "载记", "石勒载记", "载记定位：后赵方面与祖逖北伐对峙。", "石勒载记补充北方对手叙述。"],
  ["china-329-later-zhao-destroys-former-zhao", 329, "liu-yao", "jinshu", "晋书", "载记", "刘曜载记", "载记定位：刘曜败亡与前赵崩溃。", "刘曜载记补前赵方面。"],
  ["china-329-later-zhao-destroys-former-zhao", 329, "shi-le", "jinshu", "晋书", "载记", "石勒载记", "载记定位：石勒集团吞并前赵。", "石勒载记补后赵方面。"],
  ["china-383-fei-river", 383, "xie-an", "jinshu", "晋书", "列传", "谢安传", "人物传定位：谢安、谢玄与淝水战役。", "谢安传补东晋方面。"],
  ["china-383-fei-river", 383, "fu-jian", "jinshu", "晋书", "载记", "苻坚载记", "载记定位：苻坚南征与前秦溃败。", "苻坚载记补前秦方面。"],
  ["china-420-liu-yu-founds-song", 420, "song-wudi", "songshu", "宋书", "本纪", "武帝纪，永初元年", "正史本纪定位：刘裕受禅，刘宋建立。", "宋书·武帝纪是南朝开端主证。"],
  ["china-420-liu-yu-founds-song", 420, "jin-gongdi", "jinshu", "晋书", "帝纪", "恭帝纪，元熙二年", "正史本纪定位：晋恭帝禅宋。", "晋书·恭帝纪补东晋终结侧证。"],
  ["china-439-northern-wei-unifies-north", 439, "wei-shizu", "weishu", "魏书", "帝纪", "世祖纪，太延五年", "正史本纪定位：北魏攻姑臧、统一北方。", "魏书·世祖纪补北魏方面。"],
  ["china-439-northern-wei-unifies-north", 439, "northern-liang", "beishi", "北史", "列传", "沮渠蒙逊、沮渠牧犍相关传", "列传定位：北凉沮渠氏政权归降。", "北史沮渠氏传补地方政权侧证。"],
  ["china-493-xiaowen-luoyang", 493, "gaozu", "weishu", "魏书", "帝纪", "高祖纪，太和十七年", "正史本纪定位：孝文帝迁都洛阳。", "魏书·高祖纪补制度改革主线。"],
  ["china-493-xiaowen-luoyang", 493, "li-chong", "weishu", "魏书", "列传", "李冲传", "人物传定位：孝文朝改革与洛阳制度建设。", "李冲传补迁洛改革背景。"],
  ["china-523-six-garrisons", 523, "suzong", "weishu", "魏书", "帝纪", "肃宗纪，正光四年", "正史本纪定位：六镇骚动和破六韩拔陵起兵。", "魏书·肃宗纪补北魏本纪侧证。"],
  ["china-523-six-garrisons", 523, "six-garrisons", "beishi", "北史", "魏本纪", "魏本纪，正光四年", "北史定位：六镇之乱爆发。", "北史补后出汇编侧证。"],
  ["china-534-northern-wei-splits", 534, "xiaojing", "weishu", "魏书", "帝纪", "孝静帝纪，天平元年", "正史本纪定位：孝静帝即位，东魏形成。", "魏书·孝静帝纪补东魏建制。"],
  ["china-534-northern-wei-splits", 534, "northern-history", "beishi", "北史", "魏本纪", "魏本纪，永熙三年至天平元年", "北史定位：孝武西入关与东魏另立。", "北史补北魏分裂叙述。"],
  ["china-548-hou-jing-rebellion", 548, "liang-wudi", "liangshu", "梁书", "本纪", "武帝纪，太清二年", "正史本纪定位：侯景叛乱进入梁朝政治核心。", "梁书·武帝纪补南朝本纪侧证。"],
  ["china-548-hou-jing-rebellion", 548, "hou-jing", "nanshi", "南史", "列传", "侯景传", "人物传定位：侯景叛梁、攻建康。", "南史·侯景传补叛乱人物线。"],
  ["china-550-northern-qi-founded", 550, "beiqi-wenxuan", "beiqishu", "北齐书", "本纪", "文宣帝纪，天保元年", "正史本纪定位：高洋受禅，北齐建立。", "北齐书·文宣帝纪补北齐本纪。"],
  ["china-550-northern-qi-founded", 550, "wei-xiaojing", "weishu", "魏书", "帝纪", "孝静帝纪，武定八年", "正史本纪定位：东魏禅齐。", "魏书·孝静帝纪补东魏终结。"],
  ["china-557-northern-zhou-and-chen", 557, "zhou-xiaomin", "zhoushu", "周书", "本纪", "孝闵帝纪，元年", "正史本纪定位：宇文觉即天王位，北周建立。", "周书·孝闵帝纪补北朝侧证。"],
  ["china-557-northern-zhou-and-chen", 557, "chen-gaozu", "chenshu", "陈书", "本纪", "高祖纪，永定元年", "正史本纪定位：陈霸先受禅，陈朝建立。", "陈书·高祖纪补南朝侧证。"],
  ["china-577-northern-zhou-destroys-qi", 577, "zhou-wudi", "zhoushu", "周书", "本纪", "武帝纪，建德六年", "正史本纪定位：北周灭北齐。", "周书·武帝纪补北周方面。"],
  ["china-577-northern-zhou-destroys-qi", 577, "qi-houzhu", "beiqishu", "北齐书", "本纪", "后主纪，承光元年", "正史本纪定位：北齐后主出奔、国亡。", "北齐书·后主纪补北齐方面。"],
  ["china-581-sui-founded", 581, "sui-gaozu", "suishu", "隋书", "本纪", "高祖纪，开皇元年", "正史本纪定位：杨坚受禅建隋。", "隋书·高祖纪补隋朝本纪。"],
  ["china-581-sui-founded", 581, "zhou-jingdi", "zhoushu", "周书", "本纪", "静帝纪，大定元年", "正史本纪定位：北周静帝禅位。", "周书·静帝纪补北周终结。"],
  ["china-589-sui-conquers-chen", 589, "sui-gaozu", "suishu", "隋书", "本纪", "高祖纪，开皇九年", "正史本纪定位：隋军平陈。", "隋书·高祖纪补隋统一主线。"],
  ["china-589-sui-conquers-chen", 589, "chen-houzhu", "chenshu", "陈书", "本纪", "后主纪，祯明三年", "正史本纪定位：陈后主降隋，陈亡。", "陈书·后主纪补陈亡侧证。"],
];

const topics = [...new Set(["source-mention", "map-control", "map-geometry"])];

const zones = [
  { id: "guanzhong", name: "关中", en: "Guanzhong", bounds: [106, 33.7, 110.8, 36.8], center: [108.8, 35.2], notes: "长安、关中与渭水流域粗略势力区。" },
  { id: "north-china-plain", name: "华北平原", en: "North China Plain", bounds: [110.3, 34, 119.8, 40.6], center: [115.2, 37.2], notes: "洛阳、邺、河北、山东一带粗略势力区。" },
  { id: "hexi", name: "河西", en: "Hexi Corridor", bounds: [94, 37, 103.8, 42.5], center: [99, 39.7], notes: "凉州、姑臧、敦煌一线粗略势力区。" },
  { id: "liaodong", name: "辽东", en: "Liaodong", bounds: [119, 39, 126, 43.5], center: [122.5, 41.3], notes: "辽西、辽东及东北边缘粗略势力区。" },
  { id: "jiangnan", name: "江南", en: "Jiangnan", bounds: [115, 28, 122.5, 33], center: [119, 31], notes: "建康、吴会、江东核心粗略势力区。" },
  { id: "middle-yangtze", name: "荆湘中游", en: "Middle Yangtze", bounds: [108.5, 27, 116, 32.5], center: [112.3, 30], notes: "荆州、江夏、湘州等中游战略区。" },
  { id: "yizhou", name: "益州", en: "Yizhou/Sichuan", bounds: [102, 28, 108.5, 33], center: [104.8, 30.7], notes: "成都平原、巴蜀粗略势力区。" },
  { id: "lingnan", name: "岭南", en: "Lingnan", bounds: [107, 21, 115.5, 26], center: [112, 23.5], notes: "交广、岭南粗略势力区。" },
];

const controllers = [
  ["western-jin", "西晋", "#6f7d55", 1],
  ["han-zhao", "汉赵/前赵", "#8f4c38", 2],
  ["later-zhao", "后赵", "#80563e", 3],
  ["former-qin", "前秦", "#8b6fb0", 4],
  ["eastern-jin", "东晋", "#4f9a82", 5],
  ["liu-song", "刘宋", "#4d8aa8", 6],
  ["southern-qi", "南齐", "#6d9c6b", 7],
  ["liang", "梁", "#b79c52", 8],
  ["chen", "陈", "#a86f4d", 9],
  ["northern-wei", "北魏", "#5578b5", 10],
  ["eastern-wei", "东魏", "#6b7fa8", 11],
  ["western-wei", "西魏", "#6e5b9c", 12],
  ["northern-qi", "北齐", "#99608a", 13],
  ["northern-zhou", "北周", "#7d6a45", 14],
  ["sui", "隋", "#bd7a34", 15],
  ["fragmented", "割据/争夺", "#777063", 99],
];

const records = [
  ["guanzhong", "western-jin", 310, 316], ["guanzhong", "han-zhao", 317, 329], ["guanzhong", "later-zhao", 330, 350],
  ["guanzhong", "former-qin", 351, 383], ["guanzhong", "fragmented", 384, 416], ["guanzhong", "eastern-jin", 417, 420],
  ["guanzhong", "northern-wei", 421, 534], ["guanzhong", "western-wei", 535, 556], ["guanzhong", "northern-zhou", 557, 580], ["guanzhong", "sui", 581, 589],
  ["north-china-plain", "western-jin", 310, 311], ["north-china-plain", "later-zhao", 312, 350], ["north-china-plain", "fragmented", 351, 369],
  ["north-china-plain", "former-qin", 370, 383], ["north-china-plain", "fragmented", 384, 397], ["north-china-plain", "northern-wei", 398, 534],
  ["north-china-plain", "eastern-wei", 535, 549], ["north-china-plain", "northern-qi", 550, 576], ["north-china-plain", "northern-zhou", 577, 580], ["north-china-plain", "sui", 581, 589],
  ["hexi", "fragmented", 310, 438], ["hexi", "northern-wei", 439, 534], ["hexi", "western-wei", 535, 556], ["hexi", "northern-zhou", 557, 580], ["hexi", "sui", 581, 589],
  ["liaodong", "fragmented", 310, 435], ["liaodong", "northern-wei", 436, 534], ["liaodong", "eastern-wei", 535, 549], ["liaodong", "northern-qi", 550, 576], ["liaodong", "northern-zhou", 577, 580], ["liaodong", "sui", 581, 589],
  ["jiangnan", "eastern-jin", 310, 419], ["jiangnan", "liu-song", 420, 478], ["jiangnan", "southern-qi", 479, 501], ["jiangnan", "liang", 502, 556], ["jiangnan", "chen", 557, 589],
  ["middle-yangtze", "eastern-jin", 310, 419], ["middle-yangtze", "liu-song", 420, 478], ["middle-yangtze", "southern-qi", 479, 501], ["middle-yangtze", "liang", 502, 548], ["middle-yangtze", "fragmented", 549, 556], ["middle-yangtze", "chen", 557, 589],
  ["yizhou", "fragmented", 310, 346], ["yizhou", "eastern-jin", 347, 419], ["yizhou", "liu-song", 420, 478], ["yizhou", "southern-qi", 479, 501], ["yizhou", "liang", 502, 552], ["yizhou", "western-wei", 553, 556], ["yizhou", "northern-zhou", 557, 580], ["yizhou", "sui", 581, 589],
  ["lingnan", "eastern-jin", 310, 419], ["lingnan", "liu-song", 420, 478], ["lingnan", "southern-qi", 479, 501], ["lingnan", "liang", 502, 556], ["lingnan", "chen", 557, 589],
];

const insertTopic = db.prepare("INSERT OR IGNORE INTO topics (id, label, raw_json) VALUES (?, ?, ?)");
const getEvent = db.prepare("SELECT id, title, event_type, time_start, time_end, summary FROM events WHERE id = ?");
const insertMention = db.prepare(`
  INSERT OR REPLACE INTO source_mentions (
    id, source_id, passage_id, work_title, book_title, chapter_title, locator, year,
    text, translation, confidence, review_status, raw_json
  )
  VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'medium', 'draft', ?)
`);
const insertEvidence = db.prepare(`
  INSERT OR REPLACE INTO evidence_links (
    id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote,
    evidence_role, confidence, raw_json
  )
  VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'support', 'medium', ?)
`);
const insertSearchDoc = db.prepare(`
  INSERT OR REPLACE INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id,
    time_start, time_end, review_status, raw_json
  )
  VALUES (?, ?, ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'draft', ?)
`);

const insertGeometryDataset = db.prepare(`
  INSERT OR REPLACE INTO map_geometry_datasets (
    id, schema_version, model, region_id, period_id, civilization_id, label, time_start, time_end,
    coordinate_system, source_note, source_url, license, review_status, raw_json
  )
  VALUES (?, 1, 'power-zone-map', ?, ?, 'china-wei-jin-northern-southern', ?, 310, 589,
    'wgs84-lonlat', ?, NULL, NULL, 'draft', ?)
`);
const insertFeature = db.prepare(`
  INSERT OR REPLACE INTO map_features (
    id, dataset_id, name, name_zh, name_en, feature_type, admin_level, center_lon, center_lat,
    label_lon, label_lat, min_lon, min_lat, max_lon, max_lat, area_hint, confidence,
    approximate, review_status, notes, raw_json
  )
  VALUES (?, ?, ?, ?, ?, 'power-zone', 'macro-region', ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'low', 1, 'draft', ?, ?)
`);
const insertGeometry = db.prepare(`
  INSERT OR REPLACE INTO map_feature_geometries (
    id, feature_id, geometry_role, geometry_type, simplification_level, coordinate_system,
    coordinates_json, min_lon, min_lat, max_lon, max_lat, point_count, ring_count,
    source_feature_id, confidence, approximate, review_status, raw_json
  )
  VALUES (?, ?, 'display', 'Polygon', 'full', 'wgs84-lonlat', ?, ?, ?, ?, ?, ?, ?, NULL, 'low', 1, 'draft', ?)
`);
const insertFeatureSource = db.prepare(`
  INSERT OR REPLACE INTO map_feature_sources (
    feature_id, source_id, passage_id, mention_id, locator, note, source_role, sort_order, confidence, raw_json
  )
  VALUES (?, ?, NULL, NULL, ?, ?, 'periodization', ?, 'medium', ?)
`);
const insertControlDataset = db.prepare(`
  INSERT OR REPLACE INTO map_control_datasets (
    id, schema_version, model, geometry_dataset_id, region_id, period_id, label,
    time_start, time_end, key_years_json, review_status, raw_json
  )
  VALUES (?, 1, 'power-zone-control-timeline', ?, ?, ?, ?, 310, 589, ?, 'draft', ?)
`);
const insertController = db.prepare(`
  INSERT OR REPLACE INTO map_controllers (
    id, control_dataset_id, label, color, controller_type, sort_order, raw_json
  )
  VALUES (?, ?, ?, ?, 'polity', ?, ?)
`);
const insertControlRecord = db.prepare(`
  INSERT OR REPLACE INTO map_control_records (
    id, control_dataset_id, feature_id, controller_id, start_year, end_year,
    status, confidence, approximate, source_note, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, 'macro-control', 'low', 1, ?, ?)
`);
const insertControlSource = db.prepare(`
  INSERT OR REPLACE INTO map_control_record_sources (
    control_record_id, source_id, passage_id, mention_id, locator, note, sort_order, confidence, raw_json
  )
  VALUES (?, ?, NULL, NULL, ?, ?, 0, 'medium', ?)
`);

db.exec("BEGIN");
try {
  for (const topic of topics) insertTopic.run(topic, topic, json({ source: "manual seed" }));

  for (const [eventId, year, key, sourceId, workTitle, bookTitle, locator, note, translation] of supplementalEvidence) {
    const event = getEvent.get(eventId);
    if (!event) throw new Error(`Missing event: ${eventId}`);
    const mentionId = `${periodId}:${eventId}:locator:${key}`;
    const title = `${event.title}：${workTitle}${bookTitle}定位`;
    const text = `原文待摘录：${workTitle}·${bookTitle}，${locator}。本条为第二轮 locator-level 证据，不以概述冒充古籍原文。`;
    const raw = json({
      eventId,
      evidenceTier: "supplemental-locator",
      originalTextStatus: "locator-only",
      sourceId,
      locator,
      note,
    });
    insertMention.run(mentionId, sourceId, workTitle, bookTitle, locator, locator, year, text, translation, raw);
    insertEvidence.run(`${mentionId}:event-evidence`, "events", eventId, sourceId, mentionId, locator, null, raw);
    insertEvidence.run(`${mentionId}:self-evidence`, "source_mentions", mentionId, sourceId, mentionId, locator, null, raw);
    insertSearchDoc.run(
      `source-mention:${mentionId}`,
      "source_mentions",
      mentionId,
      title,
      compactText([title, text, translation, `事件：${event.title}`, note]),
      regionId,
      periodId,
      event.event_type ?? "source-mention",
      year,
      year,
      raw,
    );
  }

  db.prepare("DELETE FROM map_control_datasets WHERE id = ?").run(controlDatasetId);
  db.prepare("DELETE FROM map_geometry_datasets WHERE id = ?").run(geometryDatasetId);

  insertGeometryDataset.run(
    geometryDatasetId,
    regionId,
    periodId,
    "China macro power zones 310-589",
    "Approximate macro-regional power-zone scaffolding for Wei-Jin Northern/Southern dynasties; not a commandery/province boundary dataset.",
    json({ approximate: true, replacementPlan: "Replace rectangles with historical GIS polygons later." }),
  );

  for (const zone of zones) {
    const featureId = `china-310-589-zone:${zone.id}`;
    const coordinates = polygonFromBounds(zone.bounds);
    const bounds = boundsFromPolygon(coordinates);
    insertFeature.run(
      featureId,
      geometryDatasetId,
      zone.name,
      zone.name,
      zone.en,
      zone.center[0],
      zone.center[1],
      zone.center[0],
      zone.center[1],
      bounds.minLon,
      bounds.minLat,
      bounds.maxLon,
      bounds.maxLat,
      zone.notes,
      json({ zoneId: zone.id, bounds: zone.bounds, approximate: true }),
    );
    insertGeometry.run(
      `${featureId}:geometry:full`,
      featureId,
      JSON.stringify(coordinates),
      bounds.minLon,
      bounds.minLat,
      bounds.maxLon,
      bounds.maxLat,
      bounds.pointCount,
      bounds.ringCount,
      json({ geometryKind: "macro-rectangle", zoneId: zone.id }),
    );
    insertFeatureSource.run(featureId, "shuijingzhu", "水经注；二十四史地理志相关条", "宏区地理背景定位，非精确边界。", 0, json({ zoneId: zone.id }));
  }

  insertControlDataset.run(
    controlDatasetId,
    geometryDatasetId,
    regionId,
    periodId,
    "China macro power-zone control 310-589",
    JSON.stringify([310, 316, 317, 329, 383, 420, 439, 493, 523, 534, 548, 550, 557, 577, 581, 589]),
    json({ approximate: true, modelUse: "period overview and future map scaffold" }),
  );

  for (const [id, label, color, sortOrder] of controllers) {
    insertController.run(`china-310-589-controller:${id}`, controlDatasetId, label, color, sortOrder, json({ controllerKey: id }));
  }

  for (const [zoneId, controllerId, start, end] of records) {
    const featureId = `china-310-589-zone:${zoneId}`;
    const fullControllerId = `china-310-589-controller:${controllerId}`;
    const recordId = `${controlDatasetId}:${zoneId}:${controllerId}:${start}-${end}`;
    insertControlRecord.run(
      recordId,
      controlDatasetId,
      featureId,
      fullControllerId,
      start,
      end,
      "Macro-regional control scaffold; approximate and intended for period overview, not county-level adjudication.",
      json({ zoneId, controllerId, approximate: true }),
    );
    insertControlSource.run(
      recordId,
      "zizhi-tongjian-jin",
      "资治通鉴晋纪、宋纪、齐纪、梁纪、陈纪、隋纪相关年条",
      "按本时期关键事件和编年主干建立的宏观控制层。",
      json({ sourceUse: "periodization", zoneId, controllerId }),
    );
  }

  db.exec("COMMIT");
  console.log(`Seeded ${supplementalEvidence.length} supplemental evidence cards and ${records.length} map control records.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
