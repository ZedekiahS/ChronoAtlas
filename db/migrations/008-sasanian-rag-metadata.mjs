export default function migrate(db) {
  db.prepare(`
    INSERT INTO corpora (
      id, name, region, description, civilization_id, default_language,
      time_start, time_end, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      region = excluded.region,
      description = excluded.description,
      civilization_id = excluded.civilization_id,
      default_language = excluded.default_language,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `).run(
    "sasanian-persia",
    "萨珊波斯资料库",
    "sasanian-persia",
    "萨珊波斯、罗马-萨珊战争及相关铭文、钱币、叙事史料资料。",
    "sasanian-persia",
    "zh-Hans",
    224,
    651,
    "draft",
    "{}",
  );

  db.prepare(`
    INSERT INTO periods (
      id, label, time_start, time_end, region_id, civilization_id,
      period_type, summary, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      region_id = excluded.region_id,
      civilization_id = excluded.civilization_id,
      period_type = excluded.period_type,
      summary = excluded.summary,
      raw_json = excluded.raw_json
  `).run(
    "sasanian-persia-224-310",
    "萨珊波斯早期与三世纪罗马战争",
    224,
    310,
    "sasanian-persia",
    "sasanian-persia",
    "project-scope",
    "当前同年对照中萨珊波斯资料卡的主要时间范围。",
    "{}",
  );
}
