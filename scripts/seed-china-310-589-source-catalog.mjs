import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-589-source-catalog";
const regionId = "china";
const periodId = "china-wei-jin-northern-southern-310-589";
const corpusId = "china-wei-jin-northern-southern";
const geometryDatasetId = "china-power-zone-map-310-589";

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

function compactText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

const sources = [
  {
    id: "jinshu",
    title: "晋书",
    author: "房玄龄等",
    type: "official-history",
    citation: "《晋书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "唐修正史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "西晋末、东晋、十六国载记；304-420 主线人物和政权崩解。",
    usage: "西晋灭亡、东晋建立、十六国人物与载记优先使用；关键年份再用《资治通鉴·晋纪》校年。",
  },
  {
    id: "songshu",
    title: "宋书",
    author: "沈约",
    type: "official-history",
    citation: "《宋书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "南朝梁修史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "刘裕北伐、刘宋建国、420-479 南朝宋本纪列传与州郡。",
    usage: "刘宋本纪和刘裕相关事件优先使用；420 前后禅代应和《晋书》《资治通鉴》并挂。",
  },
  {
    id: "nanqishu",
    title: "南齐书",
    author: "萧子显",
    type: "official-history",
    citation: "《南齐书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "南朝梁修史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "479-502 南齐宗室、权臣和短期政权更替。",
    usage: "南齐建国、宗室内争、萧衍兴起使用；必要时以《资治通鉴·齐纪》补编年。",
  },
  {
    id: "liangshu",
    title: "梁书",
    author: "姚思廉",
    type: "official-history",
    citation: "《梁书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "唐修正史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "502-557 梁朝、梁武帝、侯景之乱、梁末分裂。",
    usage: "梁朝本纪和侯景之乱主证据；梁末跨北朝事件需加《资治通鉴·梁纪》。",
  },
  {
    id: "chenshu",
    title: "陈书",
    author: "姚思廉",
    type: "official-history",
    citation: "《陈书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "唐修正史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "557-589 陈朝建国、江南后期政治、陈亡。",
    usage: "陈霸先建陈、陈后主、隋灭陈江南侧证据优先使用。",
  },
  {
    id: "weishu",
    title: "魏书",
    author: "魏收",
    type: "official-history",
    citation: "《魏书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "北齐修史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "北魏兴起、439 统一北方、孝文帝改革、北魏晚期。",
    usage: "北魏本纪列传主证据；北魏分裂前后应和《资治通鉴·梁纪》互证。",
  },
  {
    id: "beiqishu",
    title: "北齐书",
    author: "李百药",
    type: "official-history",
    citation: "《北齐书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "唐修正史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "东魏至北齐高氏政权、550-577 北齐。",
    usage: "高欢、高洋、北齐建国和灭亡使用；东魏阶段可与《魏书》《北史》互补。",
  },
  {
    id: "zhoushu",
    title: "周书",
    author: "令狐德棻等",
    type: "official-history",
    citation: "《周书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "唐修正史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "西魏、北周宇文氏政权、北周灭齐。",
    usage: "宇文泰、西魏北周制度、557 北周建国、577 灭齐主证据。",
  },
  {
    id: "suishu",
    title: "隋书",
    author: "魏徵等",
    type: "official-history",
    citation: "《隋书》",
    language: "zh-Hans",
    sourceType: "official-history",
    dateLabel: "唐修正史",
    reliability: "high",
    tier: "primary-official-history",
    scope: "杨坚代周、581 建隋、588-589 灭陈、统一收束。",
    usage: "隋代周和灭陈主证据；制度、地理总结可作为统一后背景。",
  },
  {
    id: "zizhi-tongjian-jin",
    title: "资治通鉴·晋纪",
    author: "司马光",
    type: "chronicle",
    citation: "《资治通鉴·晋纪》",
    language: "zh-Hans",
    sourceType: "chronicle",
    dateLabel: "北宋编年史",
    reliability: "high",
    tier: "primary-chronicle",
    scope: "310-420 编年主干。",
    usage: "用于西晋末、东晋和十六国事件校年、南北对照和跨政权时间线。",
  },
  {
    id: "zizhi-tongjian-song",
    title: "资治通鉴·宋纪",
    author: "司马光",
    type: "chronicle",
    citation: "《资治通鉴·宋纪》",
    language: "zh-Hant",
    sourceType: "chronicle",
    dateLabel: "北宋编年史",
    reliability: "high",
    tier: "primary-chronicle",
    scope: "刘宋、北魏前期和南北对峙编年主干。",
    usage: "用于 420-479 年南北事件同步、刘宋政局和北魏统一北方校年。",
  },
  {
    id: "zizhi-tongjian-qi",
    title: "资治通鉴·齐纪",
    author: "司马光",
    type: "chronicle",
    citation: "《资治通鉴·齐纪》",
    language: "zh-Hant",
    sourceType: "chronicle",
    dateLabel: "北宋编年史",
    reliability: "high",
    tier: "primary-chronicle",
    scope: "南齐至北魏孝文帝时代编年主干。",
    usage: "用于南齐短时段政治、北魏孝文帝迁洛和制度改革校年。",
  },
  {
    id: "zizhi-tongjian-liang",
    title: "资治通鉴·梁纪",
    author: "司马光",
    type: "chronicle",
    citation: "《资治通鉴·梁纪》",
    language: "zh-Hant",
    sourceType: "chronicle",
    dateLabel: "北宋编年史",
    reliability: "high",
    tier: "primary-chronicle",
    scope: "梁、东魏、西魏、北齐初年编年主干。",
    usage: "用于六镇、北魏分裂、东魏西魏对峙、侯景之乱和梁末分裂校年。",
  },
  {
    id: "zizhi-tongjian-chen",
    title: "资治通鉴·陈纪",
    author: "司马光",
    type: "chronicle",
    citation: "《资治通鉴·陈纪》",
    language: "zh-Hant",
    sourceType: "chronicle",
    dateLabel: "北宋编年史",
    reliability: "high",
    tier: "primary-chronicle",
    scope: "陈、北周、北齐后期、隋代周前后编年主干。",
    usage: "用于北周灭齐、杨坚辅政、隋代周和南北统一前夜校年。",
  },
  {
    id: "zizhi-tongjian-sui",
    title: "资治通鉴·隋纪",
    author: "司马光",
    type: "chronicle",
    citation: "《资治通鉴·隋纪》",
    language: "zh-Hant",
    sourceType: "chronicle",
    dateLabel: "北宋编年史",
    reliability: "high",
    tier: "primary-chronicle",
    scope: "隋灭陈与南北统一编年主干。",
    usage: "用于 588-589 隋伐陈、灭陈和统一收束校年。",
  },
  {
    id: "nanshi",
    title: "南史",
    author: "李延寿",
    type: "summary-history",
    citation: "《南史》",
    language: "zh-Hans",
    sourceType: "summary-history",
    dateLabel: "唐修史",
    reliability: "medium",
    tier: "summary-history",
    scope: "宋齐梁陈汇总，可补人物传记和南朝脉络。",
    usage: "只作南朝人物和脉络互证；事件校年仍优先对应正史本纪与《资治通鉴》。",
  },
  {
    id: "beishi",
    title: "北史",
    author: "李延寿",
    type: "summary-history",
    citation: "《北史》",
    language: "zh-Hans",
    sourceType: "summary-history",
    dateLabel: "唐修史",
    reliability: "medium",
    tier: "summary-history",
    scope: "北魏、北齐、北周、隋前期汇总，可补人物传记和北朝脉络。",
    usage: "只作北朝人物和脉络互证；不优先替代《魏书》《北齐书》《周书》《隋书》。",
  },
  {
    id: "shuijingzhu",
    title: "水经注",
    author: "郦道元",
    type: "geography",
    citation: "《水经注》",
    language: "zh-Hans",
    sourceType: "geography",
    dateLabel: "北魏地理注",
    reliability: "medium",
    tier: "map-geography-support",
    scope: "北魏及以前地理、水系、城邑、道路和地名关系。",
    usage: "用于解释地理定位和地名沿革；不单独证明政权事件。",
  },
  {
    id: "tan-qixiang-historical-atlas",
    title: "中国历史地图集",
    author: "谭其骧主编",
    type: "historical-atlas",
    citation: "《中国历史地图集》",
    language: "zh-Hans",
    sourceType: "historical-atlas",
    dateLabel: "现代历史地图集",
    reliability: "high",
    tier: "map-geography-support",
    scope: "历史政区、疆域格局和州郡位置的主要地图参照。",
    usage: "用于控制区边界、州郡位置和时期地图总览；入库只记录引用定位，不提交扫描件或图像原件。",
  },
  {
    id: "chgis",
    title: "China Historical Geographic Information System",
    author: "Harvard University and Fudan University project",
    type: "historical-gis",
    citation: "CHGIS",
    language: "en",
    sourceType: "historical-gis",
    dateLabel: "modern GIS dataset",
    reliability: "medium",
    tier: "map-geography-support",
    scope: "历史地名、行政层级、坐标和空间校准辅助。",
    usage: "用于几何校准、坐标和地名匹配；需记录数据版本，不替代正史或《资治通鉴》。",
  },
];

const upsertSource = db.prepare(`
  INSERT INTO sources (
    id, title, author, type, citation_short, url, language, corpus_id, note, raw_json,
    original_title, source_type, date_label, reliability_level, review_status
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reviewed')
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    author = excluded.author,
    type = excluded.type,
    citation_short = excluded.citation_short,
    url = excluded.url,
    language = excluded.language,
    corpus_id = excluded.corpus_id,
    note = excluded.note,
    raw_json = excluded.raw_json,
    original_title = excluded.original_title,
    source_type = excluded.source_type,
    date_label = excluded.date_label,
    reliability_level = excluded.reliability_level,
    review_status = excluded.review_status
`);

const upsertSourceI18n = db.prepare(`
  INSERT OR REPLACE INTO source_i18n (
    source_id, locale, title, author, citation_short, note, raw_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const upsertTopic = db.prepare(`
  INSERT OR IGNORE INTO topics (id, label, parent_topic_id, description, raw_json)
  VALUES (?, ?, NULL, ?, ?)
`);

const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id,
    time_start, time_end, review_status, raw_json
  )
  VALUES (?, 'sources', ?, ?, ?, ?, ?, ?, 'source-catalog', 310, 589, 'reviewed', ?)
`);

const upsertFeatureSource = db.prepare(`
  INSERT OR REPLACE INTO map_feature_sources (
    feature_id, source_id, passage_id, mention_id, locator, note, source_role, sort_order, confidence, raw_json
  )
  VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)
`);

const getFeatures = db.prepare("SELECT id, name_zh FROM map_features WHERE dataset_id = ? ORDER BY id");

db.exec("BEGIN");
try {
  upsertTopic.run(
    "source-catalog",
    "史料目录",
    "310-589 中国段史料来源目录和使用边界。",
    json({ periodId }),
  );

  for (const source of sources) {
    const raw = json({
      periodId,
      regionId,
      sourceTier: source.tier,
      sourceUse: "310-589 China source catalog",
      sourceScope: source.scope,
      usageRule: source.usage,
      originalTextStatus: source.tier.startsWith("map-") ? "not-applicable" : "source-catalog-only",
      noRawScansCommitted: source.id === "tan-qixiang-historical-atlas" || source.id === "chgis",
    });

    upsertSource.run(
      source.id,
      source.title,
      source.author,
      source.type,
      source.citation,
      source.url ?? null,
      source.language,
      corpusId,
      `${source.scope} ${source.usage}`,
      raw,
      source.title,
      source.sourceType,
      source.dateLabel,
      source.reliability,
    );

    upsertSourceI18n.run(
      source.id,
      "zh",
      source.title,
      source.author,
      source.citation,
      `${source.scope} ${source.usage}`,
      json({ periodId, sourceTier: source.tier }),
    );

    upsertSearchDocument.run(
      `source:${source.id}:310-589`,
      source.id,
      `${source.title}：310-589 史料使用`,
      compactText([
        source.title,
        `source_id: ${source.id}`,
        `层级：${source.tier}`,
        `负责范围：${source.scope}`,
        `使用规则：${source.usage}`,
        `引用形式：${source.citation}`,
      ]),
      source.language,
      regionId,
      periodId,
      json({
        documentKind: "source-catalog",
        sourceId: source.id,
        sourceTier: source.tier,
        sourceScope: source.scope,
        usageRule: source.usage,
      }),
    );
  }

  const features = getFeatures.all(geometryDatasetId);
  for (const [sourceId, locator, note, sourceRole, sortOrder, confidence] of [
    [
      "tan-qixiang-historical-atlas",
      "魏晋南北朝时期相关图幅；具体册次和页图待逐图补录",
      "宏区边界和政区格局参考来源；当前几何仍为近似脚手架。",
      "historical-atlas-reference",
      1,
      "medium",
    ],
    [
      "chgis",
      "CHGIS historical place and administrative datasets；版本待补录",
      "历史地名、坐标和空间校准辅助来源；不替代事件史料。",
      "gis-alignment-reference",
      2,
      "medium",
    ],
  ]) {
    for (const feature of features) {
      upsertFeatureSource.run(
        feature.id,
        sourceId,
        locator,
        `${feature.name_zh} 地图辅助来源：${note}`,
        sourceRole,
        sortOrder,
        confidence,
        json({
          periodId,
          geometryDatasetId,
          sourceId,
          featureId: feature.id,
          sourceUse: "310-589 map support",
        }),
      );
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded ${sources.length} 310-589 source catalog records and ${features.length * 2} map source links.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
