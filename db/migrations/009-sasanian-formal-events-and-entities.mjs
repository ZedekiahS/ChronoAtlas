const entities = [
  {
    id: "person:sasanian-ardashir-i",
    type: "person",
    label: "阿尔达希尔一世",
    civilizationId: "sasanian-persia",
    regionId: "sasanian-persia",
    start: 180,
    end: 242,
    summary: "萨珊王朝建立者，击败安息末王阿尔达班四世并建立新的波斯帝国秩序。",
    confidence: "medium",
    aliases: ["Ardashir I", "Artaxerxes"],
  },
  {
    id: "person:sasanian-shapur-i",
    type: "person",
    label: "沙普尔一世",
    civilizationId: "sasanian-persia",
    regionId: "sasanian-persia",
    start: 215,
    end: 270,
    summary: "萨珊早期君主，在与罗马的战争中取得重大胜利，并留下 ŠKZ 铭文。",
    confidence: "medium",
    aliases: ["Shapur I", "Sapor I"],
  },
  {
    id: "person:sasanian-narseh",
    type: "person",
    label: "纳尔塞",
    civilizationId: "sasanian-persia",
    regionId: "sasanian-persia",
    start: 228,
    end: 303,
    summary: "萨珊国王，293 年通过 Paikuli 铭文所反映的政治联盟取得王位，后与戴克里先体系下的罗马作战。",
    confidence: "medium",
    aliases: ["Narseh", "Narses"],
  },
  {
    id: "person:sasanian-kartir",
    type: "person",
    label: "卡尔提尔",
    civilizationId: "sasanian-persia",
    regionId: "sasanian-persia",
    start: 240,
    end: 293,
    summary: "萨珊早期重要祆教祭司，以多处铭文记录自身宗教权力和宫廷地位。",
    confidence: "medium",
    aliases: ["Kartir", "Kirdir"],
  },
  {
    id: "person:sasanian-mani",
    type: "person",
    label: "摩尼",
    civilizationId: "sasanian-persia",
    regionId: "sasanian-persia",
    start: 216,
    end: 277,
    summary: "摩尼教创立者，早期曾在萨珊宫廷环境中传教，后在巴赫拉姆一世时期遇害。",
    confidence: "medium",
    aliases: ["Mani"],
  },
  {
    id: "person:sasanian-bahram-ii",
    type: "person",
    label: "巴赫拉姆二世",
    civilizationId: "sasanian-persia",
    regionId: "sasanian-persia",
    start: 276,
    end: 293,
    summary: "萨珊国王，其统治时期出现东方贵霜沙叛乱和继承危机。",
    confidence: "medium",
    aliases: ["Bahram II", "Vahram II"],
  },
  {
    id: "person:parthian-artabanus-iv",
    type: "person",
    label: "阿尔达班四世",
    civilizationId: "sasanian-persia",
    regionId: "sasanian-persia",
    start: null,
    end: 224,
    summary: "安息王朝末代君主，在与阿尔达希尔一世的决战中败亡。",
    confidence: "medium",
    aliases: ["Artabanus IV"],
  },
  {
    id: "person:rome-gordian-iii",
    type: "person",
    label: "戈尔迪安三世",
    civilizationId: "rome-imperial",
    regionId: "rome",
    start: 225,
    end: 244,
    summary: "罗马皇帝，在对萨珊战争期间死亡，其死因在罗马和萨珊材料中叙述不同。",
    confidence: "medium",
    aliases: ["Gordian III"],
  },
  {
    id: "person:rome-valerian",
    type: "person",
    label: "瓦勒良",
    civilizationId: "rome-imperial",
    regionId: "rome",
    start: 199,
    end: 260,
    summary: "罗马皇帝，260 年在与沙普尔一世的战争中被俘。",
    confidence: "medium",
    aliases: ["Valerian", "Valerianus"],
  },
  {
    id: "person:palmyra-odaenathus",
    type: "person",
    label: "奥登纳图斯",
    civilizationId: "rome-imperial",
    regionId: "rome",
    start: 220,
    end: 267,
    summary: "帕尔米拉统治者，在瓦勒良被俘后组织对萨珊的反击。",
    confidence: "medium",
    aliases: ["Odaenathus"],
  },
  {
    id: "person:rome-galerius",
    type: "person",
    label: "加莱里乌斯",
    civilizationId: "rome-imperial",
    regionId: "rome",
    start: 250,
    end: 311,
    summary: "罗马四帝共治时期的恺撒和后来的奥古斯都，297 年击败纳尔塞。",
    confidence: "medium",
    aliases: ["Galerius"],
  },
];

const events = [
  {
    id: "sasanian-224-ardashir-defeats-parthians",
    title: "阿尔达希尔击败安息王朝",
    type: "dynastic_change",
    start: 224,
    end: 224,
    display: "224 CE",
    regionId: "sasanian-persia",
    summary: "阿尔达希尔一世击败安息末代君主阿尔达班四世，萨珊波斯崛起，西亚政治格局发生重大变化。",
    confidence: "high",
    participants: [
      ["person:sasanian-ardashir-i", "victor"],
      ["person:parthian-artabanus-iv", "defeated ruler"],
    ],
  },
  {
    id: "sasanian-230-ardashir-roman-frontier",
    title: "阿尔达希尔威胁罗马东方边境",
    type: "frontier",
    start: 230,
    end: 230,
    display: "c. 230 CE",
    regionId: "sasanian-persia",
    summary: "萨珊新政权向美索不达米亚和叙利亚方向施压，罗马东方边境进入新的波斯威胁周期。",
    confidence: "medium",
    participants: [["person:sasanian-ardashir-i", "ruler"]],
  },
  {
    id: "sasanian-232-alexander-severus-expedition",
    title: "亚历山大·塞维鲁远征波斯",
    type: "campaign",
    start: 231,
    end: 233,
    display: "231-233 CE",
    regionId: "sasanian-persia",
    summary: "罗马皇帝亚历山大·塞维鲁组织东方远征，赫罗狄安叙述显示战果有限且双方均受损。",
    confidence: "medium",
    participants: [["person:sasanian-ardashir-i", "opponent"]],
  },
  {
    id: "sasanian-244-battle-of-misiche",
    title: "米西凯会战与戈尔迪安三世之死",
    type: "war",
    start: 244,
    end: 244,
    display: "244 CE",
    regionId: "sasanian-persia",
    summary: "沙普尔一世在 ŠKZ 铭文中声称于米西凯击败罗马军并导致戈尔迪安三世死亡，罗马传统则保留不同解释。",
    confidence: "high",
    participants: [
      ["person:sasanian-shapur-i", "victor"],
      ["person:rome-gordian-iii", "defeated ruler"],
    ],
  },
  {
    id: "sasanian-256-dura-europos",
    title: "杜拉欧罗普斯陷落",
    type: "war",
    start: 256,
    end: 256,
    display: "c. 256 CE",
    regionId: "sasanian-persia",
    summary: "杜拉欧罗普斯的考古证据与萨珊铭文相互印证，显示幼发拉底中游城市在沙普尔一世攻势中陷落。",
    confidence: "high",
    participants: [["person:sasanian-shapur-i", "ruler"]],
  },
  {
    id: "rome-sasanian-260-valerian-captured",
    title: "沙普尔一世俘虏罗马皇帝瓦勒良",
    type: "war",
    start: 260,
    end: 260,
    display: "260 CE",
    regionId: "sasanian-persia",
    summary: "沙普尔一世在与罗马的战争中俘虏皇帝瓦勒良，这是罗马帝国对外战争中的重大打击。",
    confidence: "high",
    participants: [
      ["person:sasanian-shapur-i", "captor"],
      ["person:rome-valerian", "captive"],
    ],
  },
  {
    id: "sasanian-262-odaenathus-counteroffensive",
    title: "奥登纳图斯反击萨珊",
    type: "campaign",
    start: 262,
    end: 262,
    display: "c. 260-262 CE",
    regionId: "sasanian-persia",
    summary: "瓦勒良被俘后，帕尔米拉的奥登纳图斯对沙普尔一世展开反击，暂时恢复罗马东方军事存在。",
    confidence: "medium",
    participants: [
      ["person:palmyra-odaenathus", "commander"],
      ["person:sasanian-shapur-i", "opponent"],
    ],
  },
  {
    id: "sasanian-280-kartir-priestly-power",
    title: "卡尔提尔祭司权力上升",
    type: "religion",
    start: 280,
    end: 290,
    display: "c. 280-290 CE",
    regionId: "sasanian-persia",
    summary: "卡尔提尔铭文呈现出萨珊早期祆教祭司权力扩大，以及宗教机构与王权之间的紧密关系。",
    confidence: "high",
    participants: [
      ["person:sasanian-kartir", "subject"],
      ["person:sasanian-mani", "religious rival"],
    ],
  },
  {
    id: "sasanian-293-narseh-paikuli",
    title: "纳尔塞通过 Paikuli 政治联盟即位",
    type: "succession",
    start: 293,
    end: 293,
    display: "293 CE",
    regionId: "sasanian-persia",
    summary: "Paikuli 铭文记录纳尔塞推翻巴赫拉姆三世、宣称合法性的过程，是理解萨珊继承政治的关键材料。",
    confidence: "high",
    participants: [
      ["person:sasanian-narseh", "claimant"],
      ["person:sasanian-bahram-ii", "dynastic predecessor"],
    ],
  },
  {
    id: "sasanian-298-treaty-of-nisibis",
    title: "尼西比斯和约",
    type: "diplomacy",
    start: 298,
    end: 298,
    display: "298 CE",
    regionId: "sasanian-persia",
    summary: "纳尔塞败于加莱里乌斯后，罗马与萨珊达成尼西比斯和约，罗马在美索不达米亚和亚美尼亚方向取得优势。",
    confidence: "high",
    participants: [
      ["person:sasanian-narseh", "defeated ruler"],
      ["person:rome-galerius", "victor"],
    ],
  },
];

function toJson(value) {
  return JSON.stringify(value ?? {});
}

function insertEntities(db) {
  const insertEntity = db.prepare(`
    INSERT INTO entities (
      id, entity_type, primary_label, civilization_id, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      entity_type = excluded.entity_type,
      primary_label = excluded.primary_label,
      civilization_id = excluded.civilization_id,
      region_id = excluded.region_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);
  const insertAlias = db.prepare(`
    INSERT INTO entity_aliases (
      id, entity_id, value, alias_type, language, context_source_id, valid_start, valid_end, raw_json
    ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?)
    ON CONFLICT(id) DO UPDATE SET
      entity_id = excluded.entity_id,
      value = excluded.value,
      alias_type = excluded.alias_type,
      language = excluded.language,
      raw_json = excluded.raw_json
  `);

  for (const entity of entities) {
    insertEntity.run(
      entity.id,
      entity.type,
      entity.label,
      entity.civilizationId,
      entity.regionId,
      entity.start,
      entity.end,
      entity.summary,
      entity.confidence,
      "draft",
      toJson(entity),
    );
    for (const [index, alias] of entity.aliases.entries()) {
      insertAlias.run(
        `${entity.id}:alias:${index}`,
        entity.id,
        alias,
        "latinized",
        "en",
        toJson({ generatedFrom: "sasanian-formal-entity-seed" }),
      );
    }
  }
}

function insertEvents(db) {
  const insertEvent = db.prepare(`
    INSERT INTO events (
      id, title, event_type, time_start, time_end, display_time, region_id,
      place_entity_id, summary, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      event_type = excluded.event_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      display_time = excluded.display_time,
      region_id = excluded.region_id,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);
  const insertEventEntity = db.prepare(`
    INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(event_id, entity_id, role) DO UPDATE SET
      sort_order = excluded.sort_order,
      raw_json = excluded.raw_json
  `);
  const insertDocument = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      title = excluded.title,
      body = excluded.body,
      language = excluded.language,
      region_id = excluded.region_id,
      period_id = excluded.period_id,
      topic_id = excluded.topic_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);

  for (const event of events) {
    insertEvent.run(
      event.id,
      event.title,
      event.type,
      event.start,
      event.end,
      event.display,
      event.regionId,
      event.summary,
      event.confidence,
      "draft",
      toJson(event),
    );
    event.participants.forEach(([entityId, role], index) => {
      insertEventEntity.run(event.id, entityId, role, index, toJson({ generatedFrom: "sasanian-formal-event-seed" }));
    });
    insertDocument.run(
      `event:${event.id}`,
      "events",
      event.id,
      event.title,
      [event.title, event.display, event.summary].join("\n\n"),
      "zh-Hans",
      event.regionId,
      "sasanian-persia-224-310",
      event.type === "war" || event.type === "campaign" || event.type === "frontier" ? "military" : event.type === "succession" ? "succession" : "political_structure",
      event.start,
      event.end,
      "draft",
      toJson(event),
    );
  }
}

export default function migrate(db) {
  insertEntities(db);
  insertEvents(db);
}
