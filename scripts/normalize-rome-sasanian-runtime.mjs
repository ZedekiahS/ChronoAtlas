import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

function readRuntimeDataset(id, fallback) {
  const row = db.prepare("SELECT raw_json FROM app_runtime_datasets WHERE id = ?").get(id);
  return row ? JSON.parse(row.raw_json) : fallback;
}

function writeRuntimeDataset(id, model, data) {
  db.prepare(`
    INSERT OR REPLACE INTO app_runtime_datasets (id, model, schema_version, raw_json, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(id, model, data.schemaVersion ?? 1, JSON.stringify(data));
}

const regions = readRuntimeDataset("regions-180-280", []);
const normalizedRegions = regions.map((region) => {
  if (region.id === "rome") {
    return {
      ...region,
      label: "罗马",
      eras: [
        {
          startYear: 180,
          endYear: 235,
          title: "帝国失衡与军人政治前夜",
          summary: "从康茂德晚期到塞维鲁王朝终结，罗马帝国仍维持统一，但军队、宫廷、财政和边境压力持续上升。",
          boundaryType: "effective-control",
          confidence: "medium",
          boundary: region.eras?.[0]?.boundary ?? [],
          sources: ["Herodian", "Cassius Dio", "Historia Augusta"]
        },
        {
          startYear: 235,
          endYear: 284,
          title: "罗马三世纪危机",
          summary: "从亚历山大·塞维鲁遇刺到戴克里先即位前，军队拥立、内战、外敌入侵、帕尔米拉和高卢分离政权构成危机主线。",
          boundaryType: "effective-control",
          confidence: "medium",
          boundary: region.eras?.find((era) => era.startYear <= 235 && era.endYear >= 235)?.boundary ?? [],
          sources: ["Historia Augusta", "Zosimus", "Eutropius", "Aurelius Victor", "coinage and inscriptions"]
        },
        {
          startYear: 284,
          endYear: 395,
          title: "戴克里先—君士坦丁重组",
          summary: "戴克里先、四帝共治和君士坦丁改革重塑帝国治理结构，作为三世纪危机后的后续阶段显示。",
          boundaryType: "effective-control",
          confidence: "medium",
          boundary: region.eras?.find((era) => era.endYear >= 284)?.boundary ?? [],
          sources: ["Lactantius", "Eusebius", "Zosimus", "late Roman legal and inscriptional evidence"]
        }
      ]
    };
  }

  if (region.id === "sasanian-persia") {
    return {
      ...region,
      label: "萨珊波斯",
      eras: [
        {
          startYear: 180,
          endYear: 224,
          title: "安息末期与萨珊兴起前夜",
          summary: "安息王权衰弱，波斯地方势力积累，阿尔达希尔崛起前的伊朗高原政治重组阶段。",
          boundaryType: "effective-control",
          confidence: "medium",
          boundary: region.eras?.[0]?.boundary ?? [],
          sources: ["coinage", "later Iranian-Arabic traditions", "Roman eastern narratives"]
        },
        {
          startYear: 224,
          endYear: 241,
          title: "萨珊建立与阿尔达希尔扩张",
          summary: "阿尔达希尔击败安息，建立萨珊王权，并向美索不达米亚和罗马东方边境施压。",
          boundaryType: "effective-control",
          confidence: "medium",
          boundary: region.eras?.find((era) => era.startYear <= 224 && era.endYear >= 224)?.boundary ?? [],
          sources: ["early Sasanian coinage", "rock reliefs", "Roman frontier narratives"]
        },
        {
          startYear: 241,
          endYear: 284,
          title: "沙普尔扩张与罗马战争",
          summary: "沙普尔一世时期萨珊与罗马多次冲突，米西凯、杜拉欧罗普斯、瓦勒良被俘构成东西线对照核心。",
          boundaryType: "effective-control",
          confidence: "medium",
          boundary: region.eras?.find((era) => era.endYear >= 241)?.boundary ?? [],
          sources: ["ŠKZ", "rock reliefs", "Historia Augusta", "Zosimus", "archaeology"]
        },
        {
          startYear: 284,
          endYear: 310,
          title: "纳尔塞与尼西比斯后续",
          summary: "戴克里先改革后的罗马东方政策与萨珊王位政治交织，293 Paikuli 和 298 尼西比斯和约作为后续节点。",
          boundaryType: "effective-control",
          confidence: "medium",
          boundary: region.eras?.find((era) => era.endYear >= 284)?.boundary ?? [],
          sources: ["Paikuli inscription", "Roman late summaries", "inscriptions and coinage"]
        }
      ]
    };
  }

  return region;
});

writeRuntimeDataset("regions-180-280", "regions", normalizedRegions);

const romanRuntime = readRuntimeDataset("roman-control-map-190-310", null);
if (romanRuntime) {
  romanRuntime.range = [180, 284];
  romanRuntime.keyYears = [180, 193, 212, 224, 235, 244, 260, 272, 284];
  romanRuntime.notes = "Roman 112 province fragment/control timeline. ChronoAtlas displays this map as the 180-284 Roman crisis and pre-crisis detail range; later 293/298 events remain available as event dots and source links, not as the default provincial-control range.";
  writeRuntimeDataset("roman-control-map-190-310", "roman-control-map", romanRuntime);
}

const controlDataset = db.prepare("SELECT raw_json FROM map_control_datasets WHERE id = ?")
  .get("roman-province-control-timeline-190-310");
const controlRaw = controlDataset ? JSON.parse(controlDataset.raw_json) : {};
controlRaw.displayRange = [180, 284];
controlRaw.displayNote = "ChronoAtlas normalized display range for Roman provincial control: 180-284, with 293/298 retained as later event/source context.";

db.prepare(`
  UPDATE map_control_datasets
  SET time_start = 180,
      time_end = 284,
      key_years_json = ?,
      raw_json = ?
  WHERE id = 'roman-province-control-timeline-190-310'
`).run(
  JSON.stringify([180, 193, 212, 224, 235, 244, 260, 272, 284]),
  JSON.stringify(controlRaw)
);

console.log("Normalized Rome/Sasanian runtime regions and Roman control display range.");
