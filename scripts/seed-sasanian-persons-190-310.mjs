import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-sasanian-persons-190-310";
const regionId = "sasanian-persia";
const civilizationId = "sasanian-persia";

const sources = {
  ardashirCoinage: "deepseek-sasanian-source-sasanian-coinage-ardashir-i-ardashir-i-royal-mint-early-sasanian-coinage",
  herodian: "deepseek-sasanian-source-history-of-the-empire-after-marcus-herodian-herodian-history-of-the-empi",
  shkz: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri",
  shkzRome: "rome-source-res-gestae-divi-saporis-shapur-i",
  paikuli: "deepseek-sasanian-source-paikuli-inscription-npi-narseh-paikuli-tower-inscription-narseh-middle-p",
  kartirCollective: "deepseek-sasanian-source-kartirs-inscriptions-collective-evidence-kartir-kirder-kkz-knrb-ksm-knrm",
  kartirKkz: "deepseek-sasanian-source-kartirs-inscription-at-kaba-ye-zardosht-kkz-s-kz-kartir-kirder-kkz-karti",
  mani: "deepseek-sasanian-source-mani-and-manichaeism-manichaean-texts-kephalaia-cologne-mani-codex-mani-",
  zosimusZonaras: "deepseek-sasanian-source-zosimus-historia-nova-zonaras-epitome-zosimus-c-500-ce-zonaras-12th-c-zo",
  dodgeonLieuZonaras: "deepseek-sasanian-source-dodgeon-lieu-the-roman-eastern-frontier-quoting-zonaras-zonaras-12th-cen",
};

const people = [
  {
    id: "sasanian-ardashir-i",
    name: "阿尔达希尔一世",
    nameEn: "Ardashir I",
    aliases: ["Ardashir", "Artaxerxes", "Ardashir son of Papak", "阿尔达希尔"],
    roles: ["国王", "王朝建立者"],
    birthYear: 180,
    deathYear: 242,
    lifeConfidence: "medium",
    summary: "萨珊王朝建立者，224 年击败安息末王阿尔达班四世，并把伊朗高原政治重心从安息体系转入萨珊体系。",
    sourceId: sources.ardashirCoinage,
    locator: "early Sasanian coinage",
  },
  {
    id: "sasanian-shapur-i",
    name: "沙普尔一世",
    nameEn: "Shapur I",
    aliases: ["Shapur", "Sapor I", "Šābuhr I", "沙卜尔一世", "沙普尔"],
    roles: ["国王"],
    birthYear: 215,
    deathYear: 270,
    lifeConfidence: "medium",
    summary: "萨珊王朝早期核心君主，多次对罗马作战；ŠKZ 铭文把戈尔迪安三世、腓力和瓦勒良相关战事纳入王权叙事。",
    sourceId: sources.shkz,
    locator: "ŠKZ",
  },
  {
    id: "sasanian-narseh",
    name: "纳尔塞",
    nameEn: "Narseh",
    aliases: ["Narses", "Narse", "Narsē", "纳尔赛"],
    roles: ["国王"],
    birthYear: 228,
    deathYear: 303,
    lifeConfidence: "medium",
    summary: "萨珊国王，293 年通过 Paikuli 铭文所反映的贵族联盟取得王位，后在罗马四帝共治体系压力下签订尼西比斯和约。",
    sourceId: sources.paikuli,
    locator: "NPi §1-10",
  },
  {
    id: "sasanian-kartir",
    name: "卡尔提尔",
    nameEn: "Kartir",
    aliases: ["Kirdir", "Kirder", "Karter", "卡提尔"],
    roles: ["祭司", "祆教权力人物"],
    birthYear: 240,
    deathYear: 293,
    lifeConfidence: "low",
    summary: "萨珊早期重要祆教祭司，以多处铭文记录自身在沙普尔一世之后逐步上升的宗教权力和宫廷地位。",
    sourceId: sources.kartirCollective,
    locator: "collective evidence from the four Kartir inscriptions",
  },
  {
    id: "sasanian-mani",
    name: "摩尼",
    nameEn: "Mani",
    aliases: ["Manes", "Manichaeus", "摩尼教创立者"],
    roles: ["宗教创立者"],
    birthYear: 216,
    deathYear: 277,
    lifeConfidence: "medium",
    summary: "摩尼教创立者，早期曾在萨珊宫廷环境中传教，后在巴赫拉姆一世时期受压制并死亡。",
    sourceId: sources.mani,
    locator: "Cologne Mani Codex; Kephalaia",
  },
];

const lifeEvents = [
  {
    personId: "sasanian-ardashir-i",
    year: 224,
    type: "accession",
    title: "击败阿尔达班四世，萨珊王朝形成",
    summary: "阿尔达希尔击败安息末王阿尔达班四世，萨珊王权由波斯地方势力上升为伊朗高原的新主导政权。",
    confidence: "high",
    sourceId: sources.ardashirCoinage,
    locator: "early Sasanian coinage; Hormozdgan tradition",
    relatedEventIds: ["sasanian-224-ardashir-defeats-parthians"],
  },
  {
    personId: "sasanian-ardashir-i",
    year: 230,
    type: "war",
    title: "向罗马东方边境施压",
    summary: "阿尔达希尔一世向美索不达米亚、叙利亚方向施压，使罗马在亚历山大·塞维鲁时期组织东方应对。",
    confidence: "medium",
    sourceId: sources.herodian,
    locator: "Herodian 6.2-6.6",
    relatedEventIds: ["sasanian-230-ardashir-roman-frontier", "sasanian-232-alexander-severus-expedition"],
  },
  {
    personId: "sasanian-ardashir-i",
    year: 242,
    type: "death",
    title: "去世，沙普尔一世继承王权",
    summary: "阿尔达希尔一世去世前后，沙普尔一世继承并延续对罗马东方边境的压力。",
    confidence: "medium",
    sourceId: sources.shkz,
    locator: "ŠKZ opening genealogy",
    relatedEventIds: [],
  },
  {
    personId: "sasanian-shapur-i",
    year: 244,
    type: "war",
    title: "米西切战役与戈尔迪安三世之死",
    summary: "ŠKZ 把 244 年战事描述为沙普尔一世击败罗马，并把戈尔迪安三世之死纳入萨珊胜利叙事；罗马传统则叙述更复杂。",
    confidence: "high",
    sourceId: sources.shkz,
    locator: "ŠKZ §6-8",
    relatedEventIds: ["sasanian-244-battle-of-misiche"],
  },
  {
    personId: "sasanian-shapur-i",
    year: 256,
    type: "war",
    title: "杜拉欧罗普斯陷落",
    summary: "杜拉欧罗普斯约在 256 年落入萨珊控制，是沙普尔一世时期罗马东方防线受压的重要考古节点。",
    confidence: "high",
    sourceId: sources.shkz,
    locator: "ŠKZ §14-15; Dura-Europos excavation evidence",
    relatedEventIds: ["sasanian-256-dura-europos"],
  },
  {
    personId: "sasanian-shapur-i",
    year: 260,
    type: "war",
    title: "俘虏罗马皇帝瓦勒良",
    summary: "沙普尔一世在埃德萨附近俘虏罗马皇帝瓦勒良，这成为三世纪罗马危机中最具象征性的东方失败。",
    confidence: "high",
    sourceId: sources.shkzRome,
    locator: "Res Gestae Divi Saporis",
    relatedEventIds: ["rome-sasanian-260-valerian-captured"],
  },
  {
    personId: "sasanian-shapur-i",
    year: 262,
    type: "war",
    title: "遭奥登纳图斯反击",
    summary: "瓦勒良被俘后，帕尔米拉强人奥登纳图斯代表罗马东方秩序反击萨珊军，限制沙普尔一世进一步扩张。",
    confidence: "medium",
    sourceId: sources.shkzRome,
    locator: "Roman eastern frontier traditions",
    relatedEventIds: ["sasanian-262-odaenathus-counteroffensive"],
  },
  {
    personId: "sasanian-shapur-i",
    year: 270,
    type: "death",
    title: "沙普尔一世去世",
    summary: "沙普尔一世去世后，萨珊王权进入连续继承与宫廷宗教权力上升的阶段。",
    confidence: "medium",
    sourceId: sources.shkz,
    locator: "ŠKZ and later succession evidence",
    relatedEventIds: [],
  },
  {
    personId: "sasanian-narseh",
    year: 293,
    type: "accession",
    title: "通过 Paikuli 联盟取得王位",
    summary: "纳尔塞在 Paikuli 铭文中把自身即位叙述为贵族与地方精英支持下纠正继承秩序的行动。",
    confidence: "high",
    sourceId: sources.paikuli,
    locator: "NPi §1-10",
    relatedEventIds: ["sasanian-293-narseh-paikuli"],
  },
  {
    personId: "sasanian-narseh",
    year: 297,
    type: "war",
    title: "败于伽列里乌斯",
    summary: "纳尔塞在与罗马的战争中被伽列里乌斯击败，罗马叙事强调其家眷与营帐被俘的政治震动。",
    confidence: "high",
    sourceId: sources.zosimusZonaras,
    locator: "Zosimus 1.27; Zonaras 12.23-24",
    relatedEventIds: ["sasanian-298-treaty-of-nisibis"],
  },
  {
    personId: "sasanian-narseh",
    year: 298,
    type: "diplomacy",
    title: "签订尼西比斯和约",
    summary: "尼西比斯和约确认罗马在亚美尼亚、美索不达米亚边境上的优势，是戴克里先体系东方安全安排的重要成果。",
    confidence: "high",
    sourceId: sources.dodgeonLieuZonaras,
    locator: "Zonaras 12.23",
    relatedEventIds: ["sasanian-298-treaty-of-nisibis"],
  },
  {
    personId: "sasanian-narseh",
    year: 303,
    type: "death",
    title: "纳尔塞去世",
    summary: "纳尔塞去世后，萨珊王位由霍尔米兹德二世继承，尼西比斯和约后的边境秩序继续影响罗马-萨珊关系。",
    confidence: "medium",
    sourceId: sources.paikuli,
    locator: "Paikuli and later succession tradition",
    relatedEventIds: [],
  },
  {
    personId: "sasanian-kartir",
    year: 260,
    type: "religion",
    title: "在沙普尔一世宫廷中上升",
    summary: "卡尔提尔的铭文把其职业生涯追溯到沙普尔一世时期，显示萨珊宫廷宗教权力正在制度化。",
    confidence: "high",
    sourceId: sources.kartirCollective,
    locator: "collective evidence from Kartir inscriptions",
    relatedEventIds: [],
  },
  {
    personId: "sasanian-kartir",
    year: 280,
    type: "religion",
    title: "铭文显示祭司权力扩大",
    summary: "卡尔提尔铭文记录其祭司权力、宗教裁判和跨地区宗教机构影响，是萨珊国家宗教制度化的核心证据。",
    confidence: "high",
    sourceId: sources.kartirKkz,
    locator: "KKZ §8-12",
    relatedEventIds: ["sasanian-280-kartir-priestly-power"],
  },
  {
    personId: "sasanian-mani",
    year: 216,
    type: "birth",
    title: "摩尼出生",
    summary: "摩尼约生于 216 年，后形成跨语际、跨区域传播的摩尼教传统。",
    confidence: "medium",
    sourceId: sources.mani,
    locator: "Cologne Mani Codex",
    relatedEventIds: [],
  },
  {
    personId: "sasanian-mani",
    year: 242,
    type: "religion",
    title: "在萨珊宫廷环境中传教",
    summary: "摩尼传统叙述其早期曾在沙普尔一世时期进入宫廷环境传教，但其地位与王权支持程度仍需谨慎表述。",
    confidence: "medium",
    sourceId: sources.mani,
    locator: "Kephalaia; Cologne Mani Codex",
    relatedEventIds: [],
  },
  {
    personId: "sasanian-mani",
    year: 277,
    type: "death",
    title: "在巴赫拉姆一世时期死亡",
    summary: "摩尼在巴赫拉姆一世时期受压制并死亡；后续摩尼教传统把这一节点视为创教者殉难记忆。",
    confidence: "medium",
    sourceId: sources.mani,
    locator: "Manichaean hagiographical tradition",
    relatedEventIds: [],
  },
];

const relations = [
  {
    sourcePersonId: "sasanian-ardashir-i",
    targetPersonId: "sasanian-shapur-i",
    type: "father-successor",
    startYear: 240,
    endYear: 242,
    summary: "沙普尔一世继承阿尔达希尔一世的王权，并延续对罗马东方边境的军事压力。",
    confidence: "high",
    sourceId: sources.shkz,
    locator: "ŠKZ opening genealogy",
  },
  {
    sourcePersonId: "sasanian-ardashir-i",
    targetPersonId: "rome-alexander-severus",
    type: "campaign-opponent",
    startYear: 230,
    endYear: 233,
    summary: "阿尔达希尔一世的东方扩张触发亚历山大·塞维鲁组织罗马东方远征。",
    confidence: "medium",
    sourceId: sources.herodian,
    locator: "Herodian 6.2-6.6",
    eventIds: ["sasanian-230-ardashir-roman-frontier", "sasanian-232-alexander-severus-expedition"],
  },
  {
    sourcePersonId: "sasanian-shapur-i",
    targetPersonId: "rome-gordian-iii",
    type: "campaign-opponent",
    startYear: 242,
    endYear: 244,
    summary: "沙普尔一世与戈尔迪安三世在罗马东方远征中对抗，萨珊铭文把米西切战役叙述为王权胜利。",
    confidence: "high",
    sourceId: sources.shkz,
    locator: "ŠKZ §6-8",
    eventIds: ["sasanian-244-battle-of-misiche"],
  },
  {
    sourcePersonId: "sasanian-shapur-i",
    targetPersonId: "rome-philip-the-arab",
    type: "treaty-counterparty",
    startYear: 244,
    endYear: 244,
    summary: "戈尔迪安三世死后，腓力阿拉伯人与沙普尔一世达成东方停战或和约安排。",
    confidence: "medium",
    sourceId: sources.shkz,
    locator: "ŠKZ §8-9",
    eventIds: ["sasanian-244-battle-of-misiche"],
  },
  {
    sourcePersonId: "sasanian-shapur-i",
    targetPersonId: "rome-valerian",
    type: "captor-opponent",
    startYear: 260,
    endYear: 260,
    summary: "沙普尔一世俘虏罗马皇帝瓦勒良，成为罗马三世纪危机和萨珊王权宣传的关键节点。",
    confidence: "high",
    sourceId: sources.shkzRome,
    locator: "Res Gestae Divi Saporis",
    eventIds: ["rome-sasanian-260-valerian-captured"],
  },
  {
    sourcePersonId: "sasanian-shapur-i",
    targetPersonId: "palmyra-odaenathus",
    type: "campaign-opponent",
    startYear: 260,
    endYear: 262,
    summary: "奥登纳图斯在瓦勒良被俘后的罗马东方真空中反击沙普尔一世，维持叙利亚与美索不达米亚方向秩序。",
    confidence: "medium",
    sourceId: sources.shkzRome,
    locator: "Roman eastern frontier traditions",
    eventIds: ["sasanian-262-odaenathus-counteroffensive"],
  },
  {
    sourcePersonId: "sasanian-shapur-i",
    targetPersonId: "sasanian-mani",
    type: "court-religious-contact",
    startYear: 242,
    endYear: 270,
    summary: "摩尼传统把早期传教置于沙普尔一世宫廷环境中，但具体支持程度需保持中等可信度。",
    confidence: "medium",
    sourceId: sources.mani,
    locator: "Kephalaia; Cologne Mani Codex",
  },
  {
    sourcePersonId: "sasanian-kartir",
    targetPersonId: "sasanian-shapur-i",
    type: "court-priest",
    startYear: 260,
    endYear: 270,
    summary: "卡尔提尔铭文把其早期上升追溯到沙普尔一世时期，显示祭司权力进入王权政治。",
    confidence: "high",
    sourceId: sources.kartirCollective,
    locator: "collective evidence from Kartir inscriptions",
  },
  {
    sourcePersonId: "sasanian-kartir",
    targetPersonId: "sasanian-mani",
    type: "religious-opponent",
    startYear: 276,
    endYear: 280,
    summary: "卡尔提尔铭文和摩尼教传统共同指向巴赫拉姆一世、巴赫拉姆二世时期的宗教压制环境，摩尼派处境恶化。",
    confidence: "medium",
    sourceId: sources.kartirKkz,
    locator: "KKZ §8-12",
    eventIds: ["sasanian-280-kartir-priestly-power"],
  },
  {
    sourcePersonId: "sasanian-narseh",
    targetPersonId: "rome-galerius",
    type: "campaign-opponent",
    startYear: 297,
    endYear: 298,
    summary: "纳尔塞在与四帝共治体系的战争中被伽列里乌斯击败，直接导致尼西比斯和约。",
    confidence: "high",
    sourceId: sources.zosimusZonaras,
    locator: "Zosimus 1.27; Zonaras 12.23-24",
    eventIds: ["sasanian-298-treaty-of-nisibis"],
  },
  {
    sourcePersonId: "sasanian-narseh",
    targetPersonId: "rome-diocletian",
    type: "treaty-counterparty",
    startYear: 298,
    endYear: 298,
    summary: "尼西比斯和约把纳尔塞的萨珊王权纳入戴克里先东方安全安排之后的边境秩序。",
    confidence: "high",
    sourceId: sources.dodgeonLieuZonaras,
    locator: "Zonaras 12.23",
    eventIds: ["sasanian-298-treaty-of-nisibis"],
  },
];

function json(value) {
  return JSON.stringify(value);
}

function relationId(relation) {
  return `sasanian-relation:${relation.sourcePersonId}:${relation.targetPersonId}:${relation.type}:${relation.startYear ?? "na"}`;
}

function lifeEventId(event, index) {
  return `sasanian-life:${event.personId}:${event.year}:${event.type}:${index}`;
}

const deleteStatements = [
  "DELETE FROM person_life_event_source_refs WHERE life_event_id LIKE 'sasanian-life:%'",
  "DELETE FROM person_life_event_historical_events WHERE life_event_id LIKE 'sasanian-life:%'",
  "DELETE FROM person_life_events WHERE id LIKE 'sasanian-life:%'",
  "DELETE FROM person_relation_source_refs WHERE relation_id LIKE 'sasanian-relation:%'",
  "DELETE FROM person_relation_events WHERE relation_id LIKE 'sasanian-relation:%'",
  "DELETE FROM person_relations WHERE id LIKE 'sasanian-relation:%'",
  "DELETE FROM document_chunk_entities WHERE entity_id LIKE 'person:sasanian-%'",
  "DELETE FROM entity_aliases WHERE entity_id LIKE 'person:sasanian-%'",
];

const insertEntity = db.prepare(`
  INSERT OR REPLACE INTO entities
    (id, entity_type, primary_label, civilization_id, region_id, time_start, time_end, summary, confidence, review_status, raw_json)
  VALUES (?, 'person', ?, ?, ?, ?, ?, ?, ?, 'reviewed', ?)
`);

const insertAlias = db.prepare(`
  INSERT OR REPLACE INTO entity_aliases
    (id, entity_id, value, alias_type, language, context_source_id, valid_start, valid_end, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPerson = db.prepare(`
  INSERT OR REPLACE INTO persons
    (id, region, name, courtesy_name, life, birth_year, death_year, life_confidence, primary_polity, summary, coverage_status, raw_json)
  VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'formal', ?)
`);

const insertLifeEvent = db.prepare(`
  INSERT OR REPLACE INTO person_life_events
    (id, person_id, year, end_year, display_year, type, title, summary, confidence, approximate, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLifeSource = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_source_refs
    (life_event_id, source_id, locator, quote, raw_json)
  VALUES (?, ?, ?, NULL, ?)
`);

const insertLifeHistoricalEvent = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_historical_events
    (life_event_id, event_id, sort_order)
  VALUES (?, ?, ?)
`);

const insertRelation = db.prepare(`
  INSERT OR REPLACE INTO person_relations
    (id, source_person_id, target_person_id, type, start_year, end_year, summary, confidence, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertRelationSource = db.prepare(`
  INSERT OR REPLACE INTO person_relation_source_refs
    (relation_id, source_id, locator, raw_json)
  VALUES (?, ?, ?, ?)
`);

const insertRelationEvent = db.prepare(`
  INSERT OR REPLACE INTO person_relation_events
    (relation_id, event_id, sort_order)
  VALUES (?, ?, ?)
`);

const insertChunkEntity = db.prepare(`
  INSERT OR REPLACE INTO document_chunk_entities
    (chunk_id, entity_id, link_role, sort_order)
  VALUES (?, ?, ?, ?)
`);

const findChunks = db.prepare(`
  SELECT id, title, body, raw_json
  FROM document_chunks
  WHERE region_id IN ('sasanian-persia', 'rome')
    AND (title LIKE ? OR body LIKE ?)
  ORDER BY time_start IS NULL, time_start, id
  LIMIT 60
`);

function run() {
  db.exec("BEGIN");
  try {
  for (const sql of deleteStatements) {
    db.exec(sql);
  }

  for (const person of people) {
    const entityId = `person:${person.id}`;
    const life = [person.birthYear, person.deathYear].filter((year) => year !== null && year !== undefined).join("-");
    const raw = {
      id: person.id,
      name: person.name,
      nameEn: person.nameEn,
      aliases: person.aliases,
      roles: person.roles,
      sourceId: person.sourceId,
      sourceLocator: person.locator,
      importedFromBatch: batchId,
    };

    insertEntity.run(
      entityId,
      person.name,
      civilizationId,
      regionId,
      person.birthYear,
      person.deathYear,
      person.summary,
      person.lifeConfidence,
      json(raw),
    );
    insertPerson.run(
      person.id,
      regionId,
      person.name,
      life,
      person.birthYear,
      person.deathYear,
      person.lifeConfidence,
      "萨珊波斯",
      person.summary,
      json(raw),
    );

    insertAlias.run(`${entityId}:alias:zh-primary`, entityId, person.name, "primary", "zh-Hans", person.sourceId, person.birthYear, person.deathYear, json({ importedFromBatch: batchId }));
    insertAlias.run(`${entityId}:alias:en-primary`, entityId, person.nameEn, "primary", "en", person.sourceId, person.birthYear, person.deathYear, json({ importedFromBatch: batchId }));
    person.aliases.forEach((alias, index) => {
      insertAlias.run(`${entityId}:alias:${index}`, entityId, alias, "alias", /[\u4e00-\u9fff]/.test(alias) ? "zh-Hans" : "en", person.sourceId, person.birthYear, person.deathYear, json({ importedFromBatch: batchId }));
    });

    const terms = [person.name, person.nameEn, ...person.aliases].filter((term) => term.length >= 3);
    const seenChunks = new Set();
    let sortOrder = 0;
    for (const term of terms) {
      const pattern = `%${term}%`;
      for (const chunk of findChunks.all(pattern, pattern)) {
        if (seenChunks.has(chunk.id)) continue;
        seenChunks.add(chunk.id);
        insertChunkEntity.run(chunk.id, entityId, "mentioned-person", sortOrder++);
      }
    }
  }

  lifeEvents.forEach((event, index) => {
    const id = lifeEventId(event, index);
    const raw = {
      id,
      personId: event.personId,
      year: event.year,
      endYear: event.endYear ?? event.year,
      displayYear: event.displayYear ?? `${event.year} 年`,
      type: event.type,
      title: event.title,
      summary: event.summary,
      confidence: event.confidence,
      approximate: Boolean(event.approximate),
      sourceRefs: [{ sourceId: event.sourceId, locator: event.locator }],
      relatedEventIds: event.relatedEventIds ?? [],
      importedFromBatch: batchId,
    };
    insertLifeEvent.run(
      id,
      event.personId,
      event.year,
      event.endYear ?? event.year,
      event.displayYear ?? `${event.year} 年`,
      event.type,
      event.title,
      event.summary,
      event.confidence,
      event.approximate ? 1 : 0,
      json(raw),
    );
    insertLifeSource.run(id, event.sourceId, event.locator, json({ importedFromBatch: batchId }));
    (event.relatedEventIds ?? []).forEach((eventId, eventIndex) => {
      insertLifeHistoricalEvent.run(id, eventId, eventIndex);
    });
  });

  for (const relation of relations) {
    const id = relationId(relation);
    const raw = {
      id,
      sourcePersonId: relation.sourcePersonId,
      targetPersonId: relation.targetPersonId,
      type: relation.type,
      startYear: relation.startYear,
      endYear: relation.endYear,
      summary: relation.summary,
      confidence: relation.confidence,
      sourceRefs: [{ sourceId: relation.sourceId, locator: relation.locator }],
      relatedEventIds: relation.eventIds ?? [],
      importedFromBatch: batchId,
    };
    insertRelation.run(
      id,
      relation.sourcePersonId,
      relation.targetPersonId,
      relation.type,
      relation.startYear,
      relation.endYear,
      relation.summary,
      relation.confidence,
      json(raw),
    );
    insertRelationSource.run(id, relation.sourceId, relation.locator, json({ importedFromBatch: batchId }));
    (relation.eventIds ?? []).forEach((eventId, index) => {
      insertRelationEvent.run(id, eventId, index);
    });
  }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

run();

const counts = {
  persons: db.prepare("SELECT COUNT(*) AS total FROM persons WHERE region = ?").get(regionId).total,
  lifeEvents: db.prepare("SELECT COUNT(*) AS total FROM person_life_events WHERE id LIKE 'sasanian-life:%'").get().total,
  relations: db.prepare("SELECT COUNT(*) AS total FROM person_relations WHERE id LIKE 'sasanian-relation:%'").get().total,
  chunkLinks: db.prepare("SELECT COUNT(*) AS total FROM document_chunk_entities WHERE entity_id LIKE 'person:sasanian-%'").get().total,
};

console.log(`Seeded Sasanian persons: ${JSON.stringify(counts)}`);
