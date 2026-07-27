const periodId = "china-western-han--202--9";

export const runAfterRuntimeSeeds = true;

export default function migrate(db) {
  db.prepare(`
    INSERT INTO periods (
      id, label, time_start, time_end, region_id, civilization_id,
      period_type, summary, raw_json
    ) VALUES (?, ?, -202, -9, 'china', NULL, 'historical-period', ?, ?)
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
    "西汉主体 前202至前9",
    "刘邦称帝后建立的西汉帝国主体时期；前8年起的西汉末至新莽更始由独立过渡模板承接。",
    JSON.stringify({
      generatedFrom: "western-han-period-reference",
      promotionProfiles: [
        "china-western-han-gaozu--202--195-v1",
        "china-western-han-huidi--194--188-v1",
        "china-western-han-gaohou--187--180-v1",
        "china-western-han-wendi--179--157-v1",
        "china-western-han-jingdi--156--141-v1",
        "china-western-han-wudi--141--119-v1",
        "china-western-han-wudi--118--87-v1",
        "china-western-han-zhaodi--86--74-v1",
        "china-western-han-xuandi--73--49-v1",
        "china-western-han-yuandi--48--33-v1",
        "china-western-han-yuandi-accession--49-v1",
        "china-western-han-chengdi--32--7-v1",
      ],
      promotionWindows: [
        [-202, -195],
        [-194, -188],
        [-187, -180],
        [-179, -157],
        [-156, -141],
        [-141, -119],
        [-118, -87],
        [-86, -74],
        [-73, -49],
        [-48, -33],
        [-49, -49],
        [-32, -7],
      ],
      noYearZero: true,
      nextPeriodId: "china-western-han-xin-transition--8-24",
    }),
  );

  db.prepare(`
    UPDATE search_documents
    SET period_id = ?
    WHERE subject_table = 'events'
      AND region_id = 'china'
      AND time_start BETWEEN -202 AND -9
      AND COALESCE(time_end, time_start) BETWEEN -202 AND -9
      AND review_status <> 'rejected'
  `).run(periodId);

  const insertAlias = db.prepare(`
    INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
    SELECT ?, ?, ?, 'traditional-name', '[]', ?
    WHERE EXISTS (SELECT 1 FROM persons WHERE id = ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
  `);
  for (const [personId, alias] of [
    ["han-liu-che", "劉徹"],
    ["han-wei-qing", "衛青"],
    ["han-zhang-qian", "張騫"],
    ["han-li-guang", "李廣"],
  ]) {
    insertAlias.run(
      `${personId}:western-han-traditional`,
      personId,
      alias,
      JSON.stringify({ generatedFrom: "western-han-period-reference" }),
      personId,
    );
  }
}
