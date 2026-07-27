const periodId = "china-western-han-xin-transition--8-24";

export const runAfterRuntimeSeeds = true;

export default function migrate(db) {
  db.prepare(`
    INSERT INTO periods (
      id, label, time_start, time_end, region_id, civilization_id,
      period_type, summary, raw_json
    ) VALUES (?, ?, -8, 24, 'china', NULL, 'historical-period', ?, ?)
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
    "西汉末至新莽更始 -8 至 24",
    "西汉末年外戚政治、王莽代汉、新朝改革与崩溃，以及更始政权兴起至东汉重建前夜。",
    JSON.stringify({
      generatedFrom: "xin-transition-period-reference",
      promotionProfile: "china-western-han-xin-transition--8-24-v1",
      promotionWindow: [-8, 24],
      noYearZero: true,
      boundaryYear: 25,
      nextPeriodId: "china-eastern-han-25-184",
    }),
  );

  db.prepare(`
    UPDATE search_documents
    SET period_id = ?
    WHERE subject_table = 'events'
      AND region_id = 'china'
      AND time_start BETWEEN -8 AND 24
      AND COALESCE(time_end, time_start) BETWEEN -8 AND 24
      AND review_status <> 'rejected'
  `).run(periodId);
}
