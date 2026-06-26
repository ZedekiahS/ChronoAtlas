# 190-310 范例时期标准

## 定位

`190-310 CE` 是 ChronoAtlas 的第一个完整范例时期。后续每个时期都应按这个时期的结构复制，而不是重新设计一套数据和页面。

本时期的核心目标：

- 主地图能表达同一年份下中国、罗马、萨珊波斯的粗略格局。
- 详情地图能进入省份、郡县、控制区或区域详情。
- 人物、事件、年龄对比、事件对比、史料证据能互相跳转。
- 每个重要判断都能追溯到 SQLite 里的来源、证据和审校状态。
- 前端只拿当前页面需要的数据，长期资料进入 SQLite/API，不依赖大 JSON 直塞前端。

## 区域分级

本时期只把三个区域作为核心：

| 层级 | 区域 | 要求 |
|---|---|---|
| Core | 中国 | 三国、晋初地图，主要人物、事件、生平、史料证据齐全。 |
| Core | 罗马 | 三世纪危机、四帝共治前后、行省/控制时间线、主要皇帝和军事事件。 |
| Core | 萨珊波斯 | 阿尔达希尔、沙普尔、纳尔塞、罗马-萨珊战争、铭文/钱币/后世叙事证据。 |
| Context | 印度、草原、印度洋贸易 | 只做背景或小框，不和中国/罗马同等权重。 |

## 页面结构标准

每个成熟时期至少提供这些页面：

- 首页总览：大时间条、世界粗略地图、时期入口、核心区域位置。
- 区域详情：区域地图、控制时间线、事件筛选、选中区域详情。
- 人物索引：人物卡、势力筛选、人物详情、生平节点。
- 年龄对比：同一年不同人物年龄，可跨区域筛选。
- 事件对比：同一年或相邻年份的核心区域事件并列。
- 史料证据：可按人物、事件、来源、地区搜索证据卡。

## 事件标准

事件必须分层，否则主页面会拥挤。

| 级别 | 用途 | 显示位置 |
|---|---|---|
| major | 改变区域格局的大事件 | 首页、时期地图、事件对比默认显示 |
| medium | 重要但局部的政治、军事、继承事件 | 区域详情、事件对比开启中型事件后显示 |
| detail | 年表补充、局部人物动作 | 详情面板、人物页、史料页 |
| life | 人物生平节点 | 人物页、年龄对比引用 |

每条事件至少要有：

- `id`
- `region_id`
- `period_id`
- `title`
- `time_start`
- `time_end`
- `event_type`
- `importance`
- `summary`
- `confidence`
- `related_entity_ids`
- `source_refs` 或 `evidence_links`

## 史料证据卡标准

史料证据卡是后续 AI/RAG 的基础。每条证据必须尽量关联这些字段：

| 字段 | 要求 |
|---|---|
| `id` | 稳定 ID，不能靠数组顺序。 |
| `source_id` | 必须指向 `sources.id`。 |
| `locator` | 卷、篇、章、碑铭段落、页码或编号。 |
| `original_text` | 原文或可核验摘录。没有原文时必须在清洗说明里标注。 |
| `translation` | 中文译文、释义或摘要；不能替代原文。 |
| `year` | 事件年份；不确定时允许 `null`，但要写争议说明。 |
| `mentioned_people` | 人物 ID 或导入时可解析的人名。 |
| `mentioned_events` | 关联事件 ID 或事件标签。 |
| `mentioned_places` | 地名、郡县、行省、城市或战场。 |
| `confidence` | `high`、`medium`、`low`。 |
| `review_status` | `draft`、`staged`、`reviewed`。 |
| `dispute_note` | 年份、文本传承、后世追述、二手文献依赖等争议说明。无争议也应标注为“未标注”或留空。 |

推荐 JSON 草稿格式：

```json
{
  "id": "evidence:period-190-310:example",
  "source_id": "sanguozhi-wei-wudi",
  "source_title": "三国志·魏书·武帝纪",
  "locator": "建安二十五年",
  "original_text": "庚子，王崩于洛阳，年六十六。",
  "translation": "曹操于建安二十五年正月庚子在洛阳去世，年六十六。",
  "year": 220,
  "mentioned_people": ["person:cao-cao"],
  "mentioned_events": ["china-220-cao-cao-death"],
  "mentioned_places": ["luoyang"],
  "confidence": "high",
  "review_status": "reviewed",
  "dispute_note": null
}
```

## SQLite/API 标准

证据数据进入 SQLite 后至少应落到这些表：

- `sources`：来源书目、作者、类型、简短引用。
- `source_mentions`：可直接引用的原文段落。
- `evidence_links`：把来源/段落挂到事件、人物、关系或搜索文档。
- `search_documents`：给 RAG 和证据搜索使用的聚合文本。
- `document_chunks` / `document_chunk_entities`：分块检索和实体召回。

前端 API 应输出这些关键字段：

- `sourceId`
- `sourceTitle`
- `locator`
- `quote`
- `translation`
- `timeStart`
- `confidence`
- `disputeNote`
- `peopleCore`
- `peopleMentioned`
- `places`
- `eventLabel`
- `macroEvent`

## 导入流程

1. DeepSeek 或人工产出证据草稿，只能放在不提交的草稿目录或临时文件。
2. 运行 `scripts/audit-import-drafts.mjs`，检查来源、人物、事件、年份和字段完整性。
3. 运行 `scripts/import-evidence-cards-staging.mjs`，进入 `import_evidence_cards`。
4. 人工抽查 `review_status`，必要时修改为 `staged`。
5. 运行对应 promote 脚本进入 `sources`、`search_documents`、`evidence_links`。
6. 运行 `npm run db:seed:export` 固化 seed。
7. 运行 `node --no-warnings scripts/validate-data.mjs` 和 `npm run build`。
8. 在浏览器检查史料证据页、人物页、事件详情页是否能看到证据。

## 190-310 验收清单

- 中国、罗马、萨珊三个核心区域在首页总览正确显示。
- 中国详情地图保留三国郡县范例，选中只加粗边界，双击进入详情。
- 罗马详情地图能显示 190-310 行省/控制时间线和事件。
- 萨珊作为核心区域展示，但印度只作为背景或东境上下文。
- 主页默认只显示 `major` 事件，中型事件需要显式打开。
- 人物索引、年龄对比、事件对比能跨中国/罗马/萨珊工作。
- 史料证据页能按关键词检索，并展示 source_id、原文、译文、人物、事件、年份、可信度、争议说明。
- 新增数据不把 demos、DeepSeek 临时输出、本地 PDF/参考资料提交进仓库。

## 后续时期复用规则

每做一个新时期，先复制这套结构：

1. 定核心区域和次重点区域。
2. 先做 major 事件，再做 medium/detail。
3. 先挂事件证据，再补人物生平证据。
4. 地图和事件先进入 SQLite/API，再做页面。
5. 史料证据卡必须先能被搜索，再考虑 AI/RAG 总结。
