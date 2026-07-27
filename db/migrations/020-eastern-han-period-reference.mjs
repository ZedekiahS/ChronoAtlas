const periodId = "china-eastern-han-25-184";

export const runAfterRuntimeSeeds = true;

export default function migrate(db) {
  db.prepare(`
    INSERT INTO periods (
      id, label, time_start, time_end, region_id, civilization_id,
      period_type, summary, raw_json
    ) VALUES (?, ?, 25, 184, 'china', NULL, 'historical-period', ?, ?)
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
    "东汉主体 25-184",
    "刘秀称帝重建汉室至黄巾起义爆发；机器正史晋级窗口止于183年，184年由汉末三国模板承接。",
    JSON.stringify({
      generatedFrom: "eastern-han-period-reference",
      promotionProfile: "china-eastern-han-25-183-v1",
      promotionWindow: [25, 183],
      boundaryYear: 184,
      boundaryEventId: "eh-184-yellow-turban-rebellion",
    }),
  );

  db.prepare(`
    UPDATE search_documents
    SET period_id = ?
    WHERE subject_table = 'events'
      AND region_id = 'china'
      AND time_start BETWEEN 25 AND 184
      AND COALESCE(time_end, time_start) BETWEEN 25 AND 184
      AND review_status <> 'rejected'
  `).run(periodId);
}
