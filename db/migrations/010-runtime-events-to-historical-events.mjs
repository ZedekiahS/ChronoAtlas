const events = [
  {
    id: "china-291-eight-princes-war",
    title: "八王之乱展开",
    region: "china",
    startYear: 291,
    endYear: 306,
    locationName: "洛阳及西晋核心州郡",
    category: "politics",
    summary:
      "西晋宗室诸王和外戚、朝臣围绕中央权力反复争斗，通常称为八王之乱。其主要阶段一般定为 291-306 年，是西晋由统一转入失序的关键节点。",
    confidence: "high",
    coordinates: [112.45, 34.62],
    detail: {
      background: ["280 年灭吴后，西晋实现短暂统一，但分封宗室、皇位继承和外戚干政等问题并未解决。"],
      process: ["291 年前后，围绕杨骏、贾南风和汝南王司马亮等人的冲突揭开序幕。"],
      impact: ["八王之乱是西晋迅速衰败的核心原因之一。"],
      sourceNotes: ["本条作为 310 年时间轴提醒事件，先保留总览层级。"],
    },
  },
  {
    id: "china-304-five-barbarians-begin",
    title: "五胡乱华开端",
    region: "china",
    startYear: 304,
    endYear: 304,
    locationName: "并州、巴蜀及西晋边缘州郡",
    category: "war",
    summary:
      "304 年，刘渊在并州建立汉赵政权，李雄在成都称王，通常被视为十六国局面和五胡乱华开端的关键节点。",
    confidence: "high",
    coordinates: [112.55, 37.87],
    detail: {
      background: ["八王之乱削弱西晋中央和地方军政秩序，边镇军队和地方豪强获得更大活动空间。"],
      process: ["刘渊、李雄等势力在 304 年前后分别建立政权，西晋边缘控制迅速松动。"],
      impact: ["中国北方进入更长期的分裂、迁徙和战争格局。"],
      sourceNotes: ["本条用于 310 年时间轴总览，后续可拆分为汉赵、成汉等事件。"],
    },
  },
  {
    id: "sasanian-230-ardashir-roman-frontier",
    title: "阿尔达希尔威胁罗马东方边境",
    region: "sasanian-persia",
    startYear: 230,
    endYear: 231,
    locationName: "Mesopotamia and Syria frontier",
    category: "war",
    summary: "阿尔达希尔一世在巩固萨珊王权后向罗马东方边境施压，罗马被迫准备大规模东征。",
    confidence: "medium",
    coordinates: [41.5, 36.5],
  },
  {
    id: "sasanian-232-alexander-severus-expedition",
    title: "亚历山大·塞维鲁远征波斯",
    region: "sasanian-persia",
    startYear: 231,
    endYear: 233,
    locationName: "Roman-Persian frontier",
    category: "war",
    summary: "亚历山大·塞维鲁组织对萨珊波斯的东征，但战果有限，双方边境压力并未根本解除。",
    confidence: "medium",
    coordinates: [42.0, 36.0],
  },
  {
    id: "sasanian-244-battle-of-misiche",
    title: "米西凯会战与戈尔迪安三世之死",
    region: "sasanian-persia",
    startYear: 244,
    endYear: 244,
    locationName: "Misiche / Mesopotamia",
    category: "war",
    summary: "沙普尔一世铭文宣称在米西凯击败罗马，戈尔迪安三世随后死亡，罗马与萨珊达成不利和约。",
    confidence: "medium",
    coordinates: [44.3, 32.6],
  },
  {
    id: "sasanian-256-dura-europos",
    title: "杜拉欧罗普斯陷落",
    region: "sasanian-persia",
    startYear: 256,
    endYear: 256,
    locationName: "Dura-Europos",
    category: "war",
    summary: "幼发拉底河边境要塞杜拉欧罗普斯被萨珊攻陷，考古证据显示围城战和坑道战极为激烈。",
    confidence: "high",
    coordinates: [40.73, 34.75],
  },
  {
    id: "sasanian-262-odaenathus-counteroffensive",
    title: "奥登纳图斯反击萨珊",
    region: "sasanian-persia",
    startYear: 262,
    endYear: 263,
    locationName: "Mesopotamia",
    category: "war",
    summary: "帕尔米拉的奥登纳图斯代表罗马东方反击萨珊，缓解瓦勒良被俘后的边境危机。",
    confidence: "medium",
    coordinates: [42.5, 35.0],
  },
  {
    id: "sasanian-280-kartir-priestly-power",
    title: "卡尔提尔祭司权力上升",
    region: "sasanian-persia",
    startYear: 280,
    endYear: 290,
    locationName: "Sasanian heartland",
    category: "religion",
    summary: "卡尔提尔铭文显示祆教祭司集团在萨珊国家结构中取得更突出地位，并影响王权合法性叙事。",
    confidence: "medium",
    coordinates: [53.0, 29.6],
  },
  {
    id: "sasanian-293-narseh-paikuli",
    title: "纳尔塞通过 Paikuli 政治联盟即位",
    region: "sasanian-persia",
    startYear: 293,
    endYear: 293,
    locationName: "Paikuli",
    category: "politics",
    summary: "Paikuli 铭文记录纳尔塞获得贵族和地方权力集团支持，击败巴赫拉姆三世并取得王位。",
    confidence: "high",
    coordinates: [45.7, 35.1],
  },
  {
    id: "sasanian-298-treaty-of-nisibis",
    title: "尼西比斯和约",
    region: "sasanian-persia",
    startYear: 298,
    endYear: 299,
    locationName: "Nisibis",
    category: "diplomacy",
    summary: "纳尔塞败于罗马后签订和约，罗马获得美索不达米亚和亚美尼亚方向优势，形成三世纪末东方边界新格局。",
    confidence: "high",
    coordinates: [41.22, 37.08],
  },
];

function normalizeEvent(event) {
  return {
    id: event.id,
    title: event.title,
    region: event.region,
    startYear: event.startYear,
    endYear: event.endYear ?? event.startYear,
    locationName: event.locationName ?? null,
    category: event.category ?? "politics",
    summary: event.summary ?? "",
    confidence: event.confidence ?? "medium",
    coordinatesJson: JSON.stringify(event.coordinates ?? []),
    detailJson: JSON.stringify(event.detail ?? {}),
    rawJson: JSON.stringify(event),
  };
}

export default function migrate(db) {
  const upsertEvent = db.prepare(`
    INSERT INTO historical_events (
      id, title, region, start_year, end_year, location_name, category,
      summary, confidence, coordinates_json, detail_json, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      region = excluded.region,
      start_year = excluded.start_year,
      end_year = excluded.end_year,
      location_name = excluded.location_name,
      category = excluded.category,
      summary = excluded.summary,
      confidence = excluded.confidence,
      coordinates_json = excluded.coordinates_json,
      detail_json = excluded.detail_json,
      raw_json = excluded.raw_json
  `);

  const upsertModernEvent = db.prepare(`
    INSERT INTO events (
      id, title, event_type, time_start, time_end, display_time, region_id,
      place_entity_id, summary, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'draft', ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      event_type = excluded.event_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      display_time = excluded.display_time,
      region_id = excluded.region_id,
      summary = excluded.summary,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json
  `);

  for (const event of events) {
    const normalized = normalizeEvent(event);
    upsertEvent.run(
      normalized.id,
      normalized.title,
      normalized.region,
      normalized.startYear,
      normalized.endYear,
      normalized.locationName,
      normalized.category,
      normalized.summary,
      normalized.confidence,
      normalized.coordinatesJson,
      normalized.detailJson,
      normalized.rawJson,
    );

    const displayTime =
      normalized.startYear !== null && normalized.endYear !== null && normalized.startYear !== normalized.endYear
        ? `${normalized.startYear}-${normalized.endYear}`
        : String(normalized.startYear);
    upsertModernEvent.run(
      normalized.id,
      normalized.title,
      normalized.category,
      normalized.startYear,
      normalized.endYear,
      displayTime,
      normalized.region,
      normalized.summary,
      normalized.confidence,
      normalized.rawJson,
    );
  }
}
