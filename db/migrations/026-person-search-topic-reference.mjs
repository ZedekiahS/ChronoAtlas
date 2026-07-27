export const runAfterRuntimeSeeds = true;

export default function migrate(db) {
  db.prepare(`
    INSERT INTO topics (id, label, parent_topic_id, description, raw_json)
    VALUES ('person', '人物', NULL, '人物实体与人物卡搜索主题。', ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      description = excluded.description,
      raw_json = excluded.raw_json
  `).run(JSON.stringify({ generatedFrom: "person-search-topic-reference" }));
}
