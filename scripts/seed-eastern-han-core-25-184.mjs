import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(rootDir, "db", "chronoatlas.sqlite"));
const batchId = "manual-eastern-han-core-25-184";

const sourceIds = {
  guangwuA: "houhanshu-guoxue123-001",
  guangwuB: "houhanshu-guoxue123-002",
  mingdi: "houhanshu-guoxue123-003",
  zhangdi: "houhanshu-guoxue123-004",
  hedi: "houhanshu-guoxue123-005",
  andi: "houhanshu-guoxue123-006",
  shunChongZhi: "houhanshu-guoxue123-007",
  huandi: "houhanshu-guoxue123-008",
  lingdi: "houhanshu-guoxue123-009",
  queensA: "houhanshu-guoxue123-011",
  queensB: "houhanshu-guoxue123-012",
  banLiang: "houhanshu-guoxue123-052",
  douHe: "houhanshu-guoxue123-075",
  eunuchs: "houhanshu-guoxue123-085",
  party: "houhanshu-guoxue123-073",
  huangfu: "houhanshu-guoxue123-077",
  westernQiang: "houhanshu-guoxue123-096",
  westernRegions: "houhanshu-guoxue123-097",
  xiongnu: "houhanshu-guoxue123-098",
};

function json(value) {
  return JSON.stringify(value ?? {});
}

function sourceRef(sourceId, locator, note) {
  return { sourceId, locator, note };
}

const people = [
  {
    id: "eh-liu-xiu",
    name: "刘秀",
    life: "前5-57",
    birthYear: -5,
    deathYear: 57,
    primaryPolity: "东汉",
    roles: ["ruler", "military"],
    summary: "汉光武帝，重建东汉政权，平定群雄后完成天下再统一。",
    sourceRefs: [sourceRef(sourceIds.guangwuA, "光武帝纪第一上")],
    lifeEvents: [
      ["accession", 25, "称帝建立东汉", "刘秀在河北称帝，东汉政权正式成立。"],
      ["unification", 36, "基本完成统一", "公孙述败亡后，东汉完成对主要割据势力的整合。"],
      ["death", 57, "光武帝去世", "光武帝去世后，明帝继位，东汉进入稳定继承阶段。"],
    ],
  },
  {
    id: "eh-liu-zhuang",
    name: "刘庄",
    life: "28-75",
    birthYear: 28,
    deathYear: 75,
    primaryPolity: "东汉",
    roles: ["ruler"],
    summary: "汉明帝，延续光武后制度秩序，并重新经营西域。",
    sourceRefs: [sourceRef(sourceIds.mingdi, "显宗孝明帝纪第二")],
    lifeEvents: [["accession", 57, "明帝即位", "光武帝去世后，太子刘庄继位。"]],
  },
  {
    id: "eh-liu-da",
    name: "刘炟",
    life: "57-88",
    birthYear: 57,
    deathYear: 88,
    primaryPolity: "东汉",
    roles: ["ruler"],
    summary: "汉章帝，明章之治阶段的皇帝，东汉政治文化秩序继续稳定。",
    sourceRefs: [sourceRef(sourceIds.zhangdi, "肃宗孝章帝纪第三")],
    lifeEvents: [["accession", 75, "章帝即位", "明帝去世后，太子刘炟继位。"]],
  },
  {
    id: "eh-ban-chao",
    name: "班超",
    life: "32-102",
    birthYear: 32,
    deathYear: 102,
    primaryPolity: "东汉",
    roles: ["diplomat", "military"],
    summary: "东汉经营西域的核心人物，长期在西域活动，恢复汉朝影响。",
    sourceRefs: [sourceRef(sourceIds.banLiang, "班梁列传第三十七")],
    lifeEvents: [
      ["diplomacy", 73, "出使西域", "班超随窦固北征后进入西域，展开长期经营。"],
      ["death", 102, "班超去世", "班超归朝后不久去世，西域经营进入新阶段。"],
    ],
  },
  {
    id: "eh-dou-xian",
    name: "窦宪",
    life: "?-92",
    birthYear: null,
    deathYear: 92,
    primaryPolity: "东汉",
    roles: ["military", "family"],
    summary: "外戚与将领，主导北伐北匈奴，后因专权被迫自杀。",
    sourceRefs: [sourceRef(sourceIds.douHe, "窦何列传第五十九")],
    lifeEvents: [
      ["campaign", 89, "燕然勒石", "窦宪率军大破北匈奴，刻石燕然。"],
      ["death", 92, "窦宪伏诛", "和帝联合宦官夺回权力，窦宪被迫自杀。"],
    ],
  },
  {
    id: "eh-deng-sui",
    name: "邓绥",
    life: "81-121",
    birthYear: 81,
    deathYear: 121,
    primaryPolity: "东汉",
    roles: ["ruler", "family"],
    summary: "和熹皇后，和帝以后长期临朝，维持幼主时期政局。",
    sourceRefs: [sourceRef(sourceIds.queensB, "皇后纪第十下")],
    lifeEvents: [
      ["regency", 106, "邓太后临朝", "殇帝、安帝时期，邓太后长期掌握中枢决策。"],
      ["death", 121, "邓太后去世", "邓太后去世后，安帝亲政，外戚与宦官格局继续变化。"],
    ],
  },
  {
    id: "eh-cai-lun",
    name: "蔡伦",
    life: "?-121",
    birthYear: null,
    deathYear: 121,
    primaryPolity: "东汉",
    roles: ["civil", "technology"],
    summary: "东汉宦官，传统叙事中与造纸术改良和奏上相关。",
    sourceRefs: [sourceRef(sourceIds.eunuchs, "宦者列传第六十八")],
    lifeEvents: [["culture", 105, "奏上造纸法", "蔡伦以树肤、麻头、敝布、鱼网等造纸并奏上。"]],
  },
  {
    id: "eh-liang-ji",
    name: "梁冀",
    life: "?-159",
    birthYear: null,
    deathYear: 159,
    primaryPolity: "东汉",
    roles: ["family", "civil"],
    summary: "东汉外戚权臣，长期把持朝政，桓帝时被诛。",
    sourceRefs: [sourceRef(sourceIds.shunChongZhi, "孝顺孝冲孝质帝纪第六"), sourceRef(sourceIds.huandi, "孝桓帝纪第七")],
    lifeEvents: [["death", 159, "梁冀被诛", "桓帝联合宦官诛灭梁冀，外戚政治受挫，宦官势力上升。"]],
  },
  {
    id: "eh-liu-zhi",
    name: "刘志",
    life: "132-168",
    birthYear: 132,
    deathYear: 168,
    primaryPolity: "东汉",
    roles: ["ruler"],
    summary: "汉桓帝，在位时期外戚、宦官和士人冲突加剧。",
    sourceRefs: [sourceRef(sourceIds.huandi, "孝桓帝纪第七")],
    lifeEvents: [
      ["accession", 146, "桓帝即位", "质帝去世后，刘志入继帝位。"],
      ["death", 168, "桓帝去世", "桓帝去世后，灵帝继位，党锢与宦官政治继续升级。"],
    ],
  },
  {
    id: "eh-liu-hong",
    name: "刘宏",
    life: "156-189",
    birthYear: 156,
    deathYear: 189,
    primaryPolity: "东汉",
    roles: ["ruler"],
    summary: "汉灵帝，在位后期财政、宦官、士人冲突与黄巾起义共同推动汉末危机。",
    sourceRefs: [sourceRef(sourceIds.lingdi, "孝灵帝纪第八")],
    lifeEvents: [["accession", 168, "灵帝即位", "桓帝去世后，刘宏入继帝位。"]],
  },
  {
    id: "eh-zhang-jue",
    name: "张角",
    life: "?-184",
    birthYear: null,
    deathYear: 184,
    primaryPolity: "太平道 / 黄巾",
    roles: ["religion", "rebel"],
    summary: "太平道领袖，黄巾起义的核心人物。",
    sourceRefs: [sourceRef(sourceIds.huangfu, "皇甫嵩朱俊列传第六十一")],
    lifeEvents: [["rebellion", 184, "黄巾起义", "张角以太平道组织起事，东汉进入汉末三国叙事阶段。"]],
  },
];

const events = [
  {
    id: "eh-025-liu-xiu-found-eastern-han",
    title: "刘秀称帝，东汉建立",
    year: 25,
    type: "state-formation",
    category: "succession",
    importance: "major",
    summary: "刘秀在河北称帝，东汉政权建立，随后继续平定各地割据势力。",
    people: ["刘秀"],
    personIds: ["eh-liu-xiu"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.guangwuA, "光武帝纪第一上")],
  },
  {
    id: "eh-036-eastern-han-unification",
    title: "公孙述败亡，东汉基本统一",
    year: 36,
    type: "unification",
    category: "war",
    importance: "major",
    summary: "公孙述势力被平定后，东汉完成对主要割据区域的统一。",
    people: ["刘秀", "公孙述"],
    personIds: ["eh-liu-xiu"],
    polities: ["东汉", "成家"],
    sourceRefs: [sourceRef(sourceIds.guangwuB, "光武帝纪第一下"), sourceRef(sourceIds.guangwuB, "公孙述相关纪事")],
  },
  {
    id: "eh-057-mingdi-accession",
    title: "光武帝去世，明帝即位",
    year: 57,
    type: "succession",
    category: "succession",
    importance: "medium",
    summary: "光武帝去世后，刘庄继位，东汉完成第一次稳定皇位交接。",
    people: ["刘秀", "刘庄"],
    personIds: ["eh-liu-xiu", "eh-liu-zhuang"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.guangwuB, "光武帝纪第一下"), sourceRef(sourceIds.mingdi, "显宗孝明帝纪第二")],
  },
  {
    id: "eh-073-ban-chao-western-regions",
    title: "班超出使西域，东汉重开西域经营",
    year: 73,
    type: "diplomacy",
    category: "diplomacy",
    importance: "major",
    summary: "窦固北征后，班超进入西域，东汉重新恢复对西域诸国的政治影响。",
    people: ["班超", "窦固"],
    personIds: ["eh-ban-chao"],
    polities: ["东汉", "西域诸国"],
    sourceRefs: [sourceRef(sourceIds.banLiang, "班梁列传第三十七"), sourceRef(sourceIds.westernRegions, "西域传第七十八")],
  },
  {
    id: "eh-089-dou-xian-defeats-northern-xiongnu",
    title: "窦宪大破北匈奴，燕然勒石",
    year: 89,
    type: "war",
    category: "war",
    importance: "major",
    summary: "窦宪率汉军北伐，大破北匈奴并刻石燕然，是东汉北方边疆叙事的关键事件。",
    people: ["窦宪"],
    personIds: ["eh-dou-xian"],
    polities: ["东汉", "北匈奴"],
    sourceRefs: [sourceRef(sourceIds.douHe, "窦何列传第五十九"), sourceRef(sourceIds.xiongnu, "南匈奴列传第七十九")],
  },
  {
    id: "eh-092-emperor-he-removes-dou-xian",
    title: "和帝夺权，窦宪伏诛",
    year: 92,
    type: "politics",
    category: "politics",
    importance: "medium",
    summary: "和帝联合宦官力量清除窦宪集团，外戚专权受到打击。",
    people: ["刘肇", "窦宪"],
    personIds: ["eh-dou-xian"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.hedi, "孝和孝殇帝纪第四"), sourceRef(sourceIds.douHe, "窦何列传第五十九")],
  },
  {
    id: "eh-105-cai-lun-paper",
    title: "蔡伦奏上造纸法",
    year: 105,
    type: "culture",
    category: "culture",
    importance: "medium",
    summary: "蔡伦奏上改良造纸法，成为东汉技术与文书制度史上的重要节点。",
    people: ["蔡伦"],
    personIds: ["eh-cai-lun"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.eunuchs, "宦者列传第六十八")],
  },
  {
    id: "eh-106-deng-sui-regency",
    title: "邓太后临朝",
    year: 106,
    type: "politics",
    category: "politics",
    importance: "medium",
    summary: "和帝之后幼主频立，邓太后临朝处理政务，东汉进入外戚、宦官与士人互动更复杂的阶段。",
    people: ["邓绥"],
    personIds: ["eh-deng-sui"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.queensB, "皇后纪第十下"), sourceRef(sourceIds.andi, "孝安帝纪第五")],
  },
  {
    id: "eh-121-deng-sui-death",
    title: "邓太后去世，安帝亲政",
    year: 121,
    type: "politics",
    category: "politics",
    importance: "medium",
    summary: "邓太后去世后，安帝亲政，外戚与宦官政治格局继续重组。",
    people: ["邓绥", "刘祜"],
    personIds: ["eh-deng-sui"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.queensB, "皇后纪第十下"), sourceRef(sourceIds.andi, "孝安帝纪第五")],
  },
  {
    id: "eh-140s-qiang-frontier-pressure",
    title: "羌乱与西北边疆压力持续",
    year: 141,
    type: "frontier",
    category: "frontier",
    importance: "medium",
    summary: "安顺以后，西羌问题长期牵动凉州、三辅和朝廷财政军事，是东汉中后期边疆压力的重要背景。",
    people: [],
    personIds: [],
    polities: ["东汉", "西羌"],
    sourceRefs: [sourceRef(sourceIds.westernQiang, "西羌传第七十七")],
  },
  {
    id: "eh-159-liang-ji-purged",
    title: "梁冀被诛，宦官势力上升",
    year: 159,
    type: "politics",
    category: "politics",
    importance: "major",
    summary: "桓帝联合宦官诛灭梁冀集团，外戚专权结束，但宦官政治由此显著上升。",
    people: ["梁冀", "刘志"],
    personIds: ["eh-liang-ji", "eh-liu-zhi"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.huandi, "孝桓帝纪第七"), sourceRef(sourceIds.shunChongZhi, "梁冀相关纪事")],
  },
  {
    id: "eh-166-first-party-prohibition",
    title: "第一次党锢之祸",
    year: 166,
    type: "politics",
    category: "politics",
    importance: "major",
    summary: "士人与宦官冲突激化，党人被禁锢，东汉中后期政治裂痕公开化。",
    people: ["李膺"],
    personIds: [],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.party, "党锢列传第五十七"), sourceRef(sourceIds.huandi, "孝桓帝纪第七")],
  },
  {
    id: "eh-168-lingdi-accession-and-party-prohibition",
    title: "灵帝即位，党锢扩大",
    year: 168,
    type: "politics",
    category: "politics",
    importance: "major",
    summary: "桓帝去世后灵帝即位，士人、外戚、宦官冲突继续扩大，党锢影响延续。",
    people: ["刘宏"],
    personIds: ["eh-liu-hong"],
    polities: ["东汉"],
    sourceRefs: [sourceRef(sourceIds.lingdi, "孝灵帝纪第八"), sourceRef(sourceIds.party, "党锢列传第五十七")],
  },
  {
    id: "eh-184-yellow-turban-rebellion",
    title: "黄巾起义爆发",
    year: 184,
    type: "rebellion",
    category: "society",
    importance: "major",
    summary: "张角太平道起事，黄巾起义爆发，东汉主体叙事转入汉末三国阶段。",
    people: ["张角", "皇甫嵩", "朱儁"],
    personIds: ["eh-zhang-jue"],
    polities: ["东汉", "黄巾"],
    sourceRefs: [sourceRef(sourceIds.lingdi, "孝灵帝纪第八"), sourceRef(sourceIds.huangfu, "皇甫嵩朱俊列传第六十一")],
  },
];

const insertPerson = db.prepare(`
  INSERT INTO persons (id, region, name, courtesy_name, life, birth_year, death_year, life_confidence, primary_polity, summary, coverage_status, raw_json)
  VALUES (?, 'china', ?, NULL, ?, ?, ?, 'medium', ?, ?, 'seeded-core', ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    life = excluded.life,
    birth_year = excluded.birth_year,
    death_year = excluded.death_year,
    primary_polity = excluded.primary_polity,
    summary = excluded.summary,
    coverage_status = excluded.coverage_status,
    raw_json = excluded.raw_json
`);
const insertPersonI18n = db.prepare(`
  INSERT OR REPLACE INTO person_i18n (person_id, locale, name, courtesy_name, life, primary_polity, summary, raw_json)
  VALUES (?, 'zh', ?, NULL, ?, ?, ?, '{}')
`);
const insertRole = db.prepare(`
  INSERT OR REPLACE INTO person_roles (person_id, role, sort_order)
  VALUES (?, ?, ?)
`);
const insertLife = db.prepare(`
  INSERT OR REPLACE INTO person_life_events (id, person_id, year, end_year, display_year, type, title, summary, confidence, approximate, raw_json)
  VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 'medium', 0, ?)
`);
const insertLifeI18n = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_i18n (life_event_id, locale, display_year, title, summary, raw_json)
  VALUES (?, 'zh', ?, ?, ?, '{}')
`);
const insertLifeSourceRef = db.prepare(`
  INSERT OR REPLACE INTO person_life_event_source_refs (life_event_id, source_id, locator, quote, raw_json)
  VALUES (?, ?, ?, NULL, ?)
`);
const insertHistoricalEvent = db.prepare(`
  INSERT OR REPLACE INTO historical_events (id, title, region, start_year, end_year, location_name, category, summary, confidence, coordinates_json, detail_json, raw_json)
  VALUES (?, ?, 'china', ?, ?, NULL, ?, ?, 'medium', NULL, ?, ?)
`);
const insertHistoricalEventI18n = db.prepare(`
  INSERT OR REPLACE INTO historical_event_i18n (event_id, locale, title, location_name, summary, raw_json)
  VALUES (?, 'zh', ?, NULL, ?, '{}')
`);
const insertHistoricalEventPeople = db.prepare(`
  INSERT OR REPLACE INTO historical_event_people (event_id, person_id, display_name, sort_order)
  VALUES (?, ?, ?, ?)
`);
const insertHistoricalEventSource = db.prepare(`
  INSERT OR REPLACE INTO historical_event_sources (event_id, source_id, locator, raw_json)
  VALUES (?, ?, ?, ?)
`);
const insertEvent = db.prepare(`
  INSERT OR REPLACE INTO events (id, title, event_type, time_start, time_end, display_time, region_id, place_entity_id, summary, confidence, review_status, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, 'china', NULL, ?, 'medium', 'reviewed', ?)
`);
const insertEventI18n = db.prepare(`
  INSERT OR REPLACE INTO event_i18n (event_id, locale, title, display_time, summary, raw_json)
  VALUES (?, 'zh', ?, ?, ?, '{}')
`);
const insertEvidence = db.prepare(`
  INSERT OR REPLACE INTO evidence_links (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
  VALUES (?, ?, ?, ?, NULL, NULL, ?, NULL, 'support', 'medium', ?)
`);
const insertDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents (id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id, time_start, time_end, review_status, raw_json)
  VALUES (?, ?, ?, ?, ?, 'zh-Hans', 'china', NULL, ?, ?, ?, 'reviewed', ?)
`);

function eventImportanceRaw() {
  const row = db.prepare("SELECT raw_json FROM app_runtime_datasets WHERE id = 'event-importance-180-280'").get();
  if (!row?.raw_json) {
    return { model: "event-importance", defaultImportance: "minor", records: [] };
  }
  try {
    return JSON.parse(row.raw_json);
  } catch {
    return { model: "event-importance", defaultImportance: "minor", records: [] };
  }
}

db.exec("PRAGMA foreign_keys = ON;");
db.exec("BEGIN;");
try {
  for (const person of people) {
    insertPerson.run(
      person.id,
      person.name,
      person.life,
      person.birthYear,
      person.deathYear,
      person.primaryPolity,
      person.summary,
      json({ importedFromBatch: batchId, sourceRefs: person.sourceRefs }),
    );
    insertPersonI18n.run(person.id, person.name, person.life, person.primaryPolity, person.summary);
    person.roles.forEach((role, index) => insertRole.run(person.id, role, index));
    person.lifeEvents.forEach(([type, year, title, summary]) => {
      const lifeEventId = `${person.id}-${year}-${type}`;
      insertLife.run(
        lifeEventId,
        person.id,
        year,
        `${year}`,
        type,
        title,
        summary,
        json({ importedFromBatch: batchId, sourceRefs: person.sourceRefs }),
      );
      insertLifeI18n.run(lifeEventId, `${year}`, title, summary);
      person.sourceRefs.forEach((ref) => {
        insertLifeSourceRef.run(lifeEventId, ref.sourceId, ref.locator ?? "", json({ importedFromBatch: batchId, note: ref.note ?? null }));
      });
    });
  }

  for (const event of events) {
    const detail = {
      scale: event.importance,
      eventCompareType: event.category === "war" || event.category === "frontier" ? "military" : event.category === "diplomacy" ? "diplomacy" : "domestic",
      fields: event.category === "war" || event.category === "frontier"
        ? { location: event.polities.join("、"), participants: event.polities.join("、"), result: event.summary }
        : { actors: event.people.join("、"), content: event.summary, impact: event.summary },
    };
    const raw = {
      importedFromBatch: batchId,
      id: event.id,
      title: event.title,
      startYear: event.year,
      endYear: event.year,
      region: "china",
      category: event.category,
      importance: event.importance,
      summary: event.summary,
      people: event.people,
      personIds: event.personIds,
      polities: event.polities,
      relatedEvents: [],
      tags: ["东汉主体", event.category],
      sources: event.sourceRefs.map((ref) => ref.sourceId),
      sourceRefs: event.sourceRefs,
      detail,
    };
    insertHistoricalEvent.run(event.id, event.title, event.year, event.year, event.category, event.summary, json(detail), json(raw));
    insertHistoricalEventI18n.run(event.id, event.title, event.summary);
    event.personIds.forEach((personId, index) => {
      insertHistoricalEventPeople.run(event.id, personId, event.people[index] ?? null, index);
    });
    event.sourceRefs.forEach((ref) => {
      insertHistoricalEventSource.run(event.id, ref.sourceId, ref.locator ?? "", json({ importedFromBatch: batchId, note: ref.note ?? null }));
      insertEvidence.run(`${event.id}:${ref.sourceId}:event`, "events", event.id, ref.sourceId, ref.locator ?? "", json({ importedFromBatch: batchId }));
    });
    insertEvent.run(event.id, event.title, event.type, event.year, event.year, `${event.year}`, event.summary, json(raw));
    insertEventI18n.run(event.id, event.title, `${event.year}`, event.summary);
    insertDocument.run(
      `event:${event.id}`,
      "events",
      event.id,
      event.title,
      [event.title, event.summary, event.people.join("、"), event.polities.join("、")].filter(Boolean).join("\n\n"),
      event.category === "war" || event.category === "frontier" ? "military" : event.category === "succession" ? "succession" : "political_structure",
      event.year,
      event.year,
      json({ importedFromBatch: batchId, sourceRefs: event.sourceRefs }),
    );
  }

  const importance = eventImportanceRaw();
  const recordMap = new Map((importance.records ?? []).map((record) => [record.eventId, record.importance]));
  for (const event of events) {
    recordMap.set(event.id, event.importance);
  }
  importance.records = [...recordMap.entries()].map(([eventId, importance]) => ({ eventId, importance }));
  db.prepare(`
    INSERT INTO app_runtime_datasets (id, model, schema_version, raw_json, updated_at)
    VALUES ('event-importance-180-280', 'event-importance', 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      model = excluded.model,
      schema_version = excluded.schema_version,
      raw_json = excluded.raw_json,
      updated_at = excluded.updated_at
  `).run(json(importance), new Date().toISOString());

  db.exec("COMMIT;");
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
} finally {
  db.close();
}

console.log(`Seeded ${people.length} Eastern Han people and ${events.length} events for 25-184.`);
