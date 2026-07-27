import {
  chinaPlaceReference184280,
  chinaPlaceReference184280Meta,
} from "../data/china-place-reference-184-280.mjs";
import {
  chinaPlaceReferenceEasternHan25184,
  chinaPlaceReferenceEasternHan25184Meta,
} from "../data/china-place-reference-eastern-han-25-184.mjs";
import {
  chinaPlaceReferenceWesternJin281316,
  chinaPlaceReferenceWesternJin281316Meta,
} from "../data/china-place-reference-western-jin-281-316.mjs";
import {
  chinaPlaceReferenceWesternHanXinTransition824,
  chinaPlaceReferenceWesternHanXinTransition824Meta,
} from "../data/china-place-reference-western-han-xin-transition--8-24.mjs";
import {
  chinaPlaceReferenceWesternHanWudi141119,
  chinaPlaceReferenceWesternHanWudi141119Meta,
} from "../data/china-place-reference-western-han-wudi--141--119.mjs";
import {
  chinaPlaceReferenceWesternHanEarly202141,
  chinaPlaceReferenceWesternHanEarly202141Meta,
} from "../data/china-place-reference-western-han-early--202---141.mjs";
import {
  chinaPlaceReferenceWesternHanWudi11887,
  chinaPlaceReferenceWesternHanWudi11887Meta,
} from "../data/china-place-reference-western-han-wudi--118--87.mjs";
import {
  chinaPlaceReferenceWesternHanZhaodi8674,
  chinaPlaceReferenceWesternHanZhaodi8674Meta,
} from "../data/china-place-reference-western-han-zhaodi--86--74.mjs";
import {
  chinaPlaceReferenceWesternHanXuandi7349,
  chinaPlaceReferenceWesternHanXuandi7349Meta,
} from "../data/china-place-reference-western-han-xuandi--73--49.mjs";
import {
  chinaPlaceReferenceWesternHanYuandi4833,
  chinaPlaceReferenceWesternHanYuandi4833Meta,
} from "../data/china-place-reference-western-han-yuandi--48--33.mjs";
import {
  chinaPlaceReferenceWesternHanChengdi327,
  chinaPlaceReferenceWesternHanChengdi327Meta,
} from "../data/china-place-reference-western-han-chengdi--32--7.mjs";

const placePacks = [
  {
    places: chinaPlaceReferenceWesternHanEarly202141,
    meta: chinaPlaceReferenceWesternHanEarly202141Meta,
  },
  {
    places: chinaPlaceReferenceWesternHanWudi141119,
    meta: chinaPlaceReferenceWesternHanWudi141119Meta,
  },
  {
    places: chinaPlaceReferenceWesternHanWudi11887,
    meta: chinaPlaceReferenceWesternHanWudi11887Meta,
  },
  {
    places: chinaPlaceReferenceWesternHanZhaodi8674,
    meta: chinaPlaceReferenceWesternHanZhaodi8674Meta,
  },
  {
    places: chinaPlaceReferenceWesternHanXuandi7349,
    meta: chinaPlaceReferenceWesternHanXuandi7349Meta,
  },
  {
    places: chinaPlaceReferenceWesternHanYuandi4833,
    meta: chinaPlaceReferenceWesternHanYuandi4833Meta,
  },
  {
    places: chinaPlaceReferenceWesternHanChengdi327,
    meta: chinaPlaceReferenceWesternHanChengdi327Meta,
  },
  {
    places: chinaPlaceReferenceWesternHanXinTransition824,
    meta: chinaPlaceReferenceWesternHanXinTransition824Meta,
  },
  { places: chinaPlaceReferenceEasternHan25184, meta: chinaPlaceReferenceEasternHan25184Meta },
  { places: chinaPlaceReference184280, meta: chinaPlaceReference184280Meta },
  { places: chinaPlaceReferenceWesternJin281316, meta: chinaPlaceReferenceWesternJin281316Meta },
];

export const runAfterRuntimeSeeds = true;

function parseJson(value) {
  try {
    return JSON.parse(value ?? "{}");
  } catch {
    return {};
  }
}

function mergedPlaceRecords() {
  const byId = new Map();
  for (const { places, meta } of placePacks) {
    for (const place of places) {
      const record = byId.get(place.id) ?? {
        id: place.id,
        label: place.label,
        regionId: meta.regionId,
        timeStart: meta.timeStart,
        timeEnd: meta.timeEnd,
        reviewStatuses: new Set(),
        dataPackIds: new Set(),
        aliases: new Map(),
        locativeOnlyAliases: new Set(),
        mapFeatureNames: new Set(),
      };
      if (record.label !== place.label || record.regionId !== meta.regionId) {
        throw new Error(`Conflicting stable place definition: ${place.id}`);
      }
      record.timeStart = Math.min(record.timeStart, meta.timeStart);
      record.timeEnd = Math.max(record.timeEnd, meta.timeEnd);
      record.reviewStatuses.add(meta.reviewStatus);
      record.dataPackIds.add(meta.id);
      for (const value of [place.label, ...(place.aliases ?? [])]) {
        const alias = record.aliases.get(value) ?? {
          value,
          validStart: meta.timeStart,
          validEnd: meta.timeEnd,
        };
        alias.validStart = Math.min(alias.validStart, meta.timeStart);
        alias.validEnd = Math.max(alias.validEnd, meta.timeEnd);
        record.aliases.set(value, alias);
      }
      for (const alias of place.locativeOnlyAliases ?? []) record.locativeOnlyAliases.add(alias);
      for (const name of place.mapFeatureNames ?? []) record.mapFeatureNames.add(name);
      byId.set(place.id, record);
    }
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export default function migrate(db) {
  const insertEntity = db.prepare(`
    INSERT INTO entities (
      id, entity_type, primary_label, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    ) VALUES (?, 'place', ?, ?, ?, ?, ?, 'high', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      primary_label = excluded.primary_label,
      region_id = excluded.region_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = CASE
        WHEN entities.review_status IN ('approved', 'rejected') THEN entities.review_status
        ELSE excluded.review_status
      END,
      raw_json = excluded.raw_json
    WHERE json_extract(entities.raw_json, '$.generatedFrom') = 'reference-data-pack'
  `);
  const deleteManagedAliases = db.prepare(`
    DELETE FROM entity_aliases
    WHERE entity_id = ?
      AND json_extract(raw_json, '$.generatedFrom') = 'reference-data-pack'
  `);
  const insertAlias = db.prepare(`
    INSERT INTO entity_aliases (
      id, entity_id, value, alias_type, language,
      context_source_id, valid_start, valid_end, raw_json
    ) VALUES (?, ?, ?, ?, 'zh-Hans', NULL, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      entity_id = excluded.entity_id,
      value = excluded.value,
      alias_type = excluded.alias_type,
      valid_start = excluded.valid_start,
      valid_end = excluded.valid_end,
      raw_json = excluded.raw_json
  `);
  const existingEntity = db.prepare("SELECT raw_json FROM entities WHERE id = ?");

  for (const place of mergedPlaceRecords()) {
    const entityId = `place:${place.id}`;
    const existing = existingEntity.get(entityId);
    const managed = !existing || parseJson(existing.raw_json).generatedFrom === "reference-data-pack";
    const dataPackIds = [...place.dataPackIds].sort();
    const raw = {
      generatedFrom: "reference-data-pack",
      dataPackId: dataPackIds.length === 1 ? dataPackIds[0] : null,
      dataPackIds,
      stablePlaceId: place.id,
      aliases: [...place.aliases.keys()].filter((alias) => alias !== place.label),
      locativeOnlyAliases: [...place.locativeOnlyAliases],
      mapFeatureNames: [...place.mapFeatureNames],
    };
    insertEntity.run(
      entityId,
      place.label,
      place.regionId,
      place.timeStart,
      place.timeEnd,
      `${place.label}的稳定地点实体；具体行政隶属与地图几何按时期解析。`,
      place.reviewStatuses.has("needs-review") ? "needs-review" : "reviewed",
      JSON.stringify(raw),
    );
    if (!managed) continue;

    deleteManagedAliases.run(entityId);
    [...place.aliases.values()]
      .sort((left, right) => left.value === place.label ? -1 : right.value === place.label ? 1 : left.value.localeCompare(right.value))
      .forEach((alias, index) => {
        const locativeOnly = place.locativeOnlyAliases.has(alias.value);
        insertAlias.run(
          `${entityId}:reference-alias:${index}`,
          entityId,
          alias.value,
          alias.value === place.label ? "primary" : "historical-name",
          alias.validStart,
          alias.validEnd,
          JSON.stringify({
            generatedFrom: "reference-data-pack",
            dataPackIds,
            matchMode: locativeOnly ? "locative-only" : "exact-text",
          }),
        );
      });
  }
}
