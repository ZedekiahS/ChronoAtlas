function toJson(value) {
  return JSON.stringify(value ?? {});
}

function toNullableText(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function compactText(parts) {
  return parts.filter((part) => typeof part === "string" && part.length > 0).join("\n\n");
}

function insertRegionSeeds(db) {
  const insert = db.prepare(`
    INSERT INTO regions (id, label, parent_region_id, region_type, time_start, time_end, summary, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      parent_region_id = excluded.parent_region_id,
      region_type = excluded.region_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      summary = excluded.summary,
      raw_json = excluded.raw_json
  `);

  const regions = [
    {
      id: "east-asia",
      label: "东亚",
      parentRegionId: null,
      regionType: "macro-region",
      timeStart: null,
      timeEnd: null,
      summary: "中国及周边历史区域的上层区域。"
    },
    {
      id: "china",
      label: "中国",
      parentRegionId: "east-asia",
      regionType: "civilization-region",
      timeStart: null,
      timeEnd: null,
      summary: "中国历史资料的区域标识。"
    },
    {
      id: "mediterranean",
      label: "地中海世界",
      parentRegionId: null,
      regionType: "macro-region",
      timeStart: null,
      timeEnd: null,
      summary: "罗马及周边历史区域的上层区域。"
    },
    {
      id: "rome",
      label: "罗马",
      parentRegionId: "mediterranean",
      regionType: "civilization-region",
      timeStart: null,
      timeEnd: null,
      summary: "罗马历史资料的区域标识。"
    },
    {
      id: "south-asia",
      label: "南亚",
      parentRegionId: null,
      regionType: "macro-region",
      timeStart: null,
      timeEnd: null,
      summary: "印度及周边历史区域的上层区域。"
    },
    {
      id: "india",
      label: "印度",
      parentRegionId: "south-asia",
      regionType: "civilization-region",
      timeStart: null,
      timeEnd: null,
      summary: "印度历史资料的区域标识。"
    },
    {
      id: "iranian-plateau",
      label: "伊朗高原",
      parentRegionId: null,
      regionType: "macro-region",
      timeStart: null,
      timeEnd: null,
      summary: "波斯及周边历史区域的上层区域。"
    },
    {
      id: "sasanian-persia",
      label: "萨珊波斯",
      parentRegionId: "iranian-plateau",
      regionType: "civilization-region",
      timeStart: null,
      timeEnd: null,
      summary: "萨珊波斯历史资料的区域标识。"
    }
  ];

  for (const region of regions) {
    insert.run(
      region.id,
      region.label,
      region.parentRegionId,
      region.regionType,
      region.timeStart,
      region.timeEnd,
      region.summary,
      toJson(region)
    );
  }
}

function insertCivilizationSeeds(db) {
  const insert = db.prepare(`
    INSERT INTO civilizations (id, label, region_id, time_start, time_end, summary, review_status, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      region_id = excluded.region_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      summary = excluded.summary,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);

  const civilizations = [
    {
      id: "china-three-kingdoms",
      label: "中国三国与魏晋",
      regionId: "china",
      timeStart: 180,
      timeEnd: 280,
      summary: "汉末、三国、西晋初期相关人物、事件和史料。",
      reviewStatus: "draft"
    },
    {
      id: "rome-imperial",
      label: "罗马帝国",
      regionId: "rome",
      timeStart: -27,
      timeEnd: 476,
      summary: "罗马帝国及相关地中海历史资料的预留文明层。",
      reviewStatus: "draft"
    },
    {
      id: "india-classical",
      label: "古典印度",
      regionId: "india",
      timeStart: 1,
      timeEnd: 600,
      summary: "印度古典时期历史资料的预留文明层。",
      reviewStatus: "draft"
    },
    {
      id: "sasanian-persia",
      label: "萨珊波斯",
      regionId: "sasanian-persia",
      timeStart: 224,
      timeEnd: 651,
      summary: "萨珊波斯历史资料的预留文明层。",
      reviewStatus: "draft"
    }
  ];

  for (const civilization of civilizations) {
    insert.run(
      civilization.id,
      civilization.label,
      civilization.regionId,
      civilization.timeStart,
      civilization.timeEnd,
      civilization.summary,
      civilization.reviewStatus,
      toJson(civilization)
    );
  }

  db.prepare(`
    UPDATE corpora
    SET civilization_id = ?,
        default_language = COALESCE(default_language, ?),
        time_start = COALESCE(time_start, ?),
        time_end = COALESCE(time_end, ?),
        review_status = COALESCE(review_status, 'draft')
    WHERE id = ?
  `).run("china-three-kingdoms", "zh-Hans", 180, 280, "china-three-kingdoms");

  db.prepare(`
    UPDATE corpora
    SET civilization_id = ?,
        default_language = COALESCE(default_language, ?),
        time_start = COALESCE(time_start, ?),
        time_end = COALESCE(time_end, ?),
        review_status = COALESCE(review_status, 'draft')
    WHERE id = ?
  `).run("rome-imperial", "la", -27, 476, "rome-imperial");
}

function insertPeriodSeeds(db) {
  const insert = db.prepare(`
    INSERT INTO periods (
      id, label, time_start, time_end, region_id, civilization_id, period_type, summary, raw_json
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
  `);

  const periods = [
    {
      id: "china-three-kingdoms-180-280",
      label: "汉末三国至西晋初期",
      timeStart: 180,
      timeEnd: 280,
      regionId: "china",
      civilizationId: "china-three-kingdoms",
      periodType: "project-scope",
      summary: "当前中国三国数据集的主要时间范围。"
    },
    {
      id: "rome-third-century-crisis-235-284",
      label: "罗马三世纪危机",
      timeStart: 235,
      timeEnd: 284,
      regionId: "rome",
      civilizationId: "rome-imperial",
      periodType: "historical-period",
      summary: "后续东西方对比查询预留的罗马三世纪时间范围。"
    }
  ];

  for (const period of periods) {
    insert.run(
      period.id,
      period.label,
      period.timeStart,
      period.timeEnd,
      period.regionId,
      period.civilizationId,
      period.periodType,
      period.summary,
      toJson(period)
    );
  }
}

function insertTopicSeeds(db) {
  const insert = db.prepare(`
    INSERT INTO topics (id, label, parent_topic_id, description, raw_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      parent_topic_id = excluded.parent_topic_id,
      description = excluded.description,
      raw_json = excluded.raw_json
  `);

  const topics = [
    ["political_structure", "政治结构", null, "政权结构、君臣关系、继承、摄政和权力运行。"],
    ["military", "军事", null, "战争、军队、征伐、叛乱和军事压力。"],
    ["succession", "继承与废立", "political_structure", "继承、拥立、废立、政变相关主题。"],
    ["elite_network", "精英网络", "political_structure", "士族、宗室、官僚和政治同盟关系。"],
    ["source_criticism", "史料与文本", null, "史料来源、文本差异、引文和可信度。"]
  ];

  for (const [id, label, parentTopicId, description] of topics) {
    insert.run(id, label, parentTopicId, description, toJson({ id, label, parentTopicId, description }));
  }
}

function updateSourcesForFutureSchema(db) {
  db.exec(`
    UPDATE sources
    SET source_type = COALESCE(source_type, type),
        reliability_level = COALESCE(reliability_level, 'medium'),
        review_status = COALESCE(review_status, 'draft');
  `);
}

function insertPersonEntities(db) {
  db.exec(`
    INSERT INTO entities (
      id, entity_type, primary_label, civilization_id, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    )
    SELECT
      'person:' || id,
      'person',
      name,
      CASE WHEN region = 'china' THEN 'china-three-kingdoms' ELSE NULL END,
      region,
      birth_year,
      death_year,
      summary,
      life_confidence,
      coverage_status,
      raw_json
    FROM persons
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      entity_type = excluded.entity_type,
      primary_label = excluded.primary_label,
      civilization_id = excluded.civilization_id,
      region_id = excluded.region_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json;
  `);

  db.exec(`
    INSERT INTO entity_aliases (
      id, entity_id, value, alias_type, language, context_source_id, valid_start, valid_end, raw_json
    )
    SELECT
      'person-alias:' || id,
      'person:' || person_id,
      value,
      type,
      'zh-Hans',
      NULL,
      NULL,
      NULL,
      raw_json
    FROM person_aliases
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      entity_id = excluded.entity_id,
      value = excluded.value,
      alias_type = excluded.alias_type,
      language = excluded.language,
      context_source_id = excluded.context_source_id,
      valid_start = excluded.valid_start,
      valid_end = excluded.valid_end,
      raw_json = excluded.raw_json;
  `);
}

function insertEntityRelations(db) {
  db.exec(`
    INSERT INTO entity_relations (
      id, source_entity_id, target_entity_id, relation_type, time_start, time_end,
      summary, confidence, review_status, raw_json
    )
    SELECT
      id,
      'person:' || source_person_id,
      'person:' || target_person_id,
      type,
      start_year,
      end_year,
      summary,
      confidence,
      'draft',
      raw_json
    FROM person_relations
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      source_entity_id = excluded.source_entity_id,
      target_entity_id = excluded.target_entity_id,
      relation_type = excluded.relation_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json;
  `);
}

function insertHistoricalEvents(db) {
  db.exec(`
    INSERT INTO events (
      id, title, event_type, time_start, time_end, display_time, region_id,
      place_entity_id, summary, confidence, review_status, raw_json
    )
    SELECT
      id,
      title,
      category,
      start_year,
      end_year,
      CASE
        WHEN start_year IS NOT NULL AND end_year IS NOT NULL AND start_year != end_year
          THEN CAST(start_year AS TEXT) || '-' || CAST(end_year AS TEXT)
        WHEN start_year IS NOT NULL
          THEN CAST(start_year AS TEXT)
        ELSE NULL
      END,
      region,
      NULL,
      summary,
      confidence,
      'draft',
      raw_json
    FROM historical_events
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      event_type = excluded.event_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      display_time = excluded.display_time,
      region_id = excluded.region_id,
      place_entity_id = excluded.place_entity_id,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json;
  `);

  db.exec(`
    INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    SELECT
      event_id,
      'person:' || person_id,
      COALESCE(display_name, 'participant'),
      sort_order,
      json_object('generatedFrom', 'historical_event_people')
    FROM historical_event_people
    WHERE person_id IS NOT NULL
    ON CONFLICT(event_id, entity_id, role) DO UPDATE SET
      sort_order = excluded.sort_order,
      raw_json = excluded.raw_json;
  `);
}

function insertLifeEventsAsEvents(db) {
  db.exec(`
    INSERT INTO events (
      id, title, event_type, time_start, time_end, display_time, region_id,
      place_entity_id, summary, confidence, review_status, raw_json
    )
    SELECT
      'life:' || e.id,
      e.title,
      e.type,
      e.year,
      e.end_year,
      e.display_year,
      p.region,
      NULL,
      e.summary,
      e.confidence,
      'draft',
      e.raw_json
    FROM person_life_events e
    JOIN persons p ON p.id = e.person_id
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      event_type = excluded.event_type,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      display_time = excluded.display_time,
      region_id = excluded.region_id,
      place_entity_id = excluded.place_entity_id,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json;
  `);

  db.exec(`
    INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
    SELECT
      'life:' || id,
      'person:' || person_id,
      'subject',
      0,
      json_object('generatedFrom', 'person_life_events')
    FROM person_life_events
    WHERE true
    ON CONFLICT(event_id, entity_id, role) DO UPDATE SET
      sort_order = excluded.sort_order,
      raw_json = excluded.raw_json;
  `);
}

function insertEvidenceLinks(db) {
  db.exec(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    )
    SELECT
      'historical-event-source:' || event_id || ':' || source_id || ':' || locator,
      'events',
      event_id,
      source_id,
      NULL,
      NULL,
      locator,
      NULL,
      'support',
      'medium',
      raw_json
    FROM historical_event_sources
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      mention_id = excluded.mention_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json;
  `);

  db.exec(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    )
    SELECT
      'life-event-mention:' || life_event_id || ':' || mention_id,
      'events',
      'life:' || life_event_id,
      m.source_id,
      m.passage_id,
      mention_id,
      m.locator,
      m.text,
      'support',
      m.confidence,
      json_object('generatedFrom', 'person_life_event_source_mentions')
    FROM person_life_event_source_mentions l
    JOIN source_mentions m ON m.id = l.mention_id
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      mention_id = excluded.mention_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json;
  `);

  db.exec(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    )
    SELECT
      'life-event-source:' || life_event_id || ':' || source_id || ':' || locator,
      'events',
      'life:' || life_event_id,
      source_id,
      NULL,
      NULL,
      locator,
      quote,
      'support',
      'medium',
      raw_json
    FROM person_life_event_source_refs
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      mention_id = excluded.mention_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json;
  `);

  db.exec(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    )
    SELECT
      'relation-mention:' || relation_id || ':' || mention_id,
      'entity_relations',
      relation_id,
      m.source_id,
      m.passage_id,
      mention_id,
      m.locator,
      m.text,
      'support',
      m.confidence,
      json_object('generatedFrom', 'person_relation_source_mentions')
    FROM person_relation_source_mentions l
    JOIN source_mentions m ON m.id = l.mention_id
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      mention_id = excluded.mention_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json;
  `);

  db.exec(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    )
    SELECT
      'relation-source:' || relation_id || ':' || source_id || ':' || locator,
      'entity_relations',
      relation_id,
      source_id,
      NULL,
      NULL,
      locator,
      NULL,
      'support',
      'medium',
      raw_json
    FROM person_relation_source_refs
    WHERE true
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      mention_id = excluded.mention_id,
      locator = excluded.locator,
      quote = excluded.quote,
      evidence_role = excluded.evidence_role,
      confidence = excluded.confidence,
      raw_json = excluded.raw_json;
  `);
}

function insertSearchDocuments(db) {
  const insert = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      title = excluded.title,
      body = excluded.body,
      language = excluded.language,
      region_id = excluded.region_id,
      period_id = excluded.period_id,
      topic_id = excluded.topic_id,
      time_start = excluded.time_start,
      time_end = excluded.time_end,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);

  for (const person of db.prepare("SELECT * FROM persons").all()) {
    insert.run(
      `entity:person:${person.id}`,
      "entities",
      `person:${person.id}`,
      person.name,
      compactText([person.name, person.courtesy_name, person.life, person.primary_polity, person.summary]),
      "zh-Hans",
      person.region,
      "china-three-kingdoms-180-280",
      null,
      person.birth_year,
      person.death_year,
      person.coverage_status,
      person.raw_json
    );
  }

  for (const event of db.prepare("SELECT * FROM historical_events").all()) {
    insert.run(
      `event:${event.id}`,
      "events",
      event.id,
      event.title,
      compactText([event.title, event.location_name, event.category, event.summary]),
      "zh-Hans",
      event.region,
      "china-three-kingdoms-180-280",
      null,
      event.start_year,
      event.end_year,
      "draft",
      event.raw_json
    );
  }

  for (const lifeEvent of db.prepare(`
    SELECT e.*, p.region
    FROM person_life_events e
    JOIN persons p ON p.id = e.person_id
  `).all()) {
    insert.run(
      `event:life:${lifeEvent.id}`,
      "events",
      `life:${lifeEvent.id}`,
      lifeEvent.title,
      compactText([lifeEvent.title, lifeEvent.display_year, lifeEvent.type, lifeEvent.summary]),
      "zh-Hans",
      lifeEvent.region,
      "china-three-kingdoms-180-280",
      null,
      lifeEvent.year,
      lifeEvent.end_year,
      "draft",
      lifeEvent.raw_json
    );
  }

  for (const mention of db.prepare("SELECT * FROM source_mentions").all()) {
    insert.run(
      `source-mention:${mention.id}`,
      "source_mentions",
      mention.id,
      `${mention.work_title} ${mention.locator}`,
      compactText([mention.work_title, mention.book_title, mention.chapter_title, mention.locator, mention.text, mention.translation]),
      mention.translation ? "zh-Hans" : null,
      "china",
      "china-three-kingdoms-180-280",
      null,
      mention.year,
      mention.year,
      mention.review_status,
      mention.raw_json
    );
  }
}

export default function migrate(db) {
  insertRegionSeeds(db);
  insertCivilizationSeeds(db);
  insertPeriodSeeds(db);
  insertTopicSeeds(db);
  updateSourcesForFutureSchema(db);
  insertPersonEntities(db);
  insertEntityRelations(db);
  insertHistoricalEvents(db);
  insertLifeEventsAsEvents(db);
  insertEvidenceLinks(db);
  insertSearchDocuments(db);
}
