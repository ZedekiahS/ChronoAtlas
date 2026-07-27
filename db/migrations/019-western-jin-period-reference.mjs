const periodId = "china-western-jin-266-316";

export const runAfterRuntimeSeeds = true;

export default function migrate(db) {
  db.prepare(`
    INSERT INTO periods (
      id, label, time_start, time_end, region_id, civilization_id,
      period_type, summary, raw_json
    ) VALUES (?, ?, 266, 316, 'china', NULL, 'historical-period', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      region_id = excluded.region_id,
      period_type = excluded.period_type,
      summary = excluded.summary,
      raw_json = excluded.raw_json
  `).run(
    periodId,
    "西晋 266-316",
    "司马氏建立西晋、统一三国至长安失守的历史时期；机器正史晋级窗口从 281 年起，以免与上一模板重叠。",
    JSON.stringify({
      generatedFrom: "western-jin-period-reference",
      promotionProfile: "china-western-jin-281-316-v1",
      promotionWindow: [281, 316],
    }),
  );

  db.prepare("UPDATE map_geometry_datasets SET period_id = ? WHERE id = ?")
    .run(periodId, "china-admin-block-map-280-317");
  db.prepare("UPDATE map_control_datasets SET period_id = ? WHERE id = ?")
    .run(periodId, "china-block-control-timeline-280-317");

  db.prepare(`
    UPDATE search_documents
    SET period_id = ?
    WHERE subject_table = 'events'
      AND region_id = 'china'
      AND time_start BETWEEN 281 AND 316
      AND COALESCE(time_end, time_start) BETWEEN 281 AND 316
      AND review_status <> 'rejected'
  `).run(periodId);
}
