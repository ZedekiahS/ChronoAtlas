import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const geometryDatasetId = "roman-province-map-190-310";

function parseRawJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function firstChineseSentence(...values) {
  for (const value of values) {
    if (typeof value !== "string" || !/[\u4e00-\u9fff]/.test(value)) {
      continue;
    }
    const sentence = value.split(/[。；;]/)[0]?.trim();
    if (sentence && /[\u4e00-\u9fff]/.test(sentence)) {
      return sentence.length <= 72 ? sentence : `${sentence.slice(0, 69)}...`;
    }
  }
  return null;
}

function normalizeTerms(terms) {
  return [...new Set(terms
    .filter((term) => typeof term === "string" && term.trim().length >= 3)
    .map((term) => term.trim().toLowerCase()))];
}

function provinceTerms(feature) {
  const raw = parseRawJson(feature.raw_json, {});
  const parts = [
    feature.name,
    feature.name_en,
    raw.n,
    raw.family,
    ...(feature.name ?? "").split(/\s+/),
  ];

  const aliases = {
    "Britannia": ["Britannia", "British", "Eboracum", "York", "Hadrian"],
    "Germania": ["Germania", "German", "Rhine", "Raetia", "Alemanni", "Alamanni"],
    "Dacia": ["Dacia", "Dacian", "Danube"],
    "Moesia": ["Moesia", "Danube"],
    "Syria": ["Syria", "Syrian", "Antioch", "Palmyra", "Tadmor", "Emesa"],
    "Mesopotamia": ["Mesopotamia", "Ctesiphon", "Euphrates", "Nisibis"],
    "Aegyptus": ["Egypt", "Aegyptus", "Alexandria"],
    "Africa": ["Africa", "Leptis", "Carthage"],
    "Pannonia": ["Pannonia", "Carnuntum", "Danube"],
    "Gallia": ["Gaul", "Lugdunum", "Lyon"],
    "Asia": ["Asia", "Nicomedia", "Nicaea", "Bithynia"],
    "Achaia": ["Achaia", "Athens", "Greece"],
    "Macedonia": ["Macedonia", "Balkans"],
    "Hispania": ["Hispania", "Spain"],
    "Italia": ["Rome", "Italy", "Italia"],
  };

  for (const [key, values] of Object.entries(aliases)) {
    if (parts.some((part) => typeof part === "string" && part.includes(key))) {
      parts.push(...values);
    }
  }

  return normalizeTerms(parts);
}

function eventSearchText(row) {
  const raw = parseRawJson(row.raw_json, {});
  return [
    row.title,
    row.summary,
    raw.titleZh,
    raw.titleEn,
    raw.eventLabel,
    raw.macroEvent,
    raw.translation,
    raw.locationName,
    ...(raw.places ?? []),
    ...(raw.tags ?? []),
    ...(raw.people ?? []),
    ...(raw.detail?.background ?? []),
    ...(raw.detail?.process ?? []),
    ...(raw.detail?.sourceNotes ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
}

function titleZhForEvent(row) {
  const raw = parseRawJson(row.raw_json, {});
  return firstChineseSentence(
    raw.titleZh,
    row.summary,
    raw.summary,
    raw.detail?.overview,
    raw.detail?.process?.[0],
    raw.translation,
  ) ?? row.title;
}

const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA foreign_keys = ON;");

  const romanEvents = db.prepare(`
    SELECT id, title, summary, raw_json
    FROM events
    WHERE region_id = 'rome'
      AND id NOT LIKE 'life:%'
      AND COALESCE(time_end, time_start) >= 190
      AND COALESCE(time_start, time_end) <= 310
    ORDER BY COALESCE(time_start, 9999), id
  `).all();

  const features = db.prepare(`
    SELECT id, name, name_en, raw_json
    FROM map_features
    WHERE dataset_id = ?
    ORDER BY id
  `).all(geometryDatasetId);

  if (romanEvents.length === 0 || features.length === 0) {
    throw new Error(`Missing Roman events/features: events=${romanEvents.length}, features=${features.length}`);
  }

  const updateEventRawJson = db.prepare("UPDATE events SET raw_json = ? WHERE id = ?");
  const insertFeatureEvent = db.prepare(`
    INSERT OR REPLACE INTO map_feature_events (
      feature_id,
      event_id,
      relation_type,
      confidence,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const featureTermRows = features.map((feature) => ({
    ...feature,
    terms: provinceTerms(feature),
  }));

  db.exec("BEGIN;");
  db.prepare(`
    DELETE FROM map_feature_events
    WHERE feature_id IN (SELECT id FROM map_features WHERE dataset_id = ?)
      AND event_id IN (SELECT id FROM events WHERE region_id = 'rome')
  `).run(geometryDatasetId);

  let linkCount = 0;

  for (const event of romanEvents) {
    const raw = parseRawJson(event.raw_json, {});
    const titleZh = titleZhForEvent(event);
    const titleEn = raw.titleEn ?? raw.eventLabel ?? event.title;
    updateEventRawJson.run(JSON.stringify({ ...raw, titleZh, titleEn }), event.id);

    const text = eventSearchText({ ...event, raw_json: JSON.stringify({ ...raw, titleZh, titleEn }) });
    for (const feature of featureTermRows) {
      const matchedTerms = feature.terms.filter((term) => text.includes(term));
      if (matchedTerms.length === 0) {
        continue;
      }

      insertFeatureEvent.run(
        feature.id,
        event.id,
        "related-location",
        matchedTerms.length >= 2 ? "medium" : "low",
        JSON.stringify({
          generatedFrom: "scripts/import-roman-event-map-links.mjs",
          matchedTerms,
        }),
      );
      linkCount += 1;
    }
  }

  db.exec("COMMIT;");
  console.log(`Updated ${romanEvents.length} Roman event titles and inserted ${linkCount} province-event links`);
} catch (error) {
  try {
    db.exec("ROLLBACK;");
  } catch {
    // Ignore rollback failure when no transaction was opened.
  }
  throw error;
} finally {
  db.close();
}
