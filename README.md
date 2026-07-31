# 历史年表 / ChronoAtlas

ChronoAtlas 是一个面向历史对照阅读的交互式时间轴项目。它把同一时期不同地区的人物、事件、地图、史料原文、译文、证据链和 AI 检索结果放进同一套结构化数据流里，方便回答一个核心问题：

> 同一年或同一阶段，世界不同地区正在发生什么？这些人物和事件之间能否被负责任地比较？

[中文](#中文) | [English](#english)

## 中文

### 当前范围

- 世界总览时间跨度已调整为前 900 至 1912，其中前 770 以前保留为上古概述缓冲段。
- 中国主时间条使用“历史叙事阶段”，不是单纯朝代法理起止。例如“三国”显示为“汉末三国 184-280”，而不是只显示 220-280。
- 罗马时间条使用罗马/拜占庭叙事阶段，例如“帝国失衡与军人政治前夜 180-235”“罗马三世纪危机 235-284”。
- 全球锚点事件独立保留，不会因为切换中国、罗马或中亚时间条而消失。
- 190-310 仍是模板期，用来校准人物、事件、史料、地图、证据图谱和覆盖度结构。
- 25-184、184-280、280-317 等中国阶段已经开始接入人物、事件、地图和史料全文归档。

### 主要功能

- 世界总览时间轴与区域时间条切换
- 中国、罗马、萨珊等区域地图与阶段详情
- 人物索引、人物详情、年龄对比与事件关联
- 事件对比、事件详情、事件分类和大中小事件密度控制
- 史料证据、原文库、史书筛选、分页阅读和证据图谱
- 覆盖度检查、地图调试、RAG 评测、AI 问答和 AI 记录
- 中英文界面切换
- SQLite API 本地数据流

### 190-310 模板期

190-310 是当前验收样板期，相关标准和审计入口：

```bash
npm run audit:period-190-310
```

相关文件：

- `docs/period-190-310-standard.md`
- `scripts/audit-period-template-190-310.mjs`

该时期包含三国、罗马三世纪危机、萨珊兴起等对照数据。后续时期的数据结构、证据链、地图层和 UI 体验优先向这一模板期看齐。

### 史料与原文库

项目现在不仅保存片段化 evidence card，也保存可分页阅读的史料原文库。当前重点史料包括：

- 中国：`三国志`、`后汉书`、`晋书`、`资治通鉴`、`汉书`
- 罗马：Herodian、Cassius Dio、Historia Augusta、Zosimus、Eutropius 等
- 萨珊：ŠKZ、Kartir、Paikuli 及相关王权铭文材料

史料入口支持按史书、地区、年份和关键词筛选。原文用于用户阅读，也用于后续 AI 检索、人物事件抽取和证据图谱。

### 事件归档与去重

导入原文后产生的候选事件不会直接全部升格为正式事件。当前流程是：

1. 从史料原文中抽取独立事实候选，并由批次的 `promotionProfile` 选择晋级策略。
2. 每张事实卡默认形成单事实聚类；只有“同年、同主体、同动作、同标题”的卡才能自动合并。
3. 纪年解析器把年号、绝对年份或其他历法表达解析为带精度和来源的时间断言。整卷、整部史书的范围不能充当事件年代。
4. 抽取层先匹配已有姓名与别名，再识别“官职 + 完整姓名”等强结构。未收录的次级人物只保留为候选，只有其事件通过晋级后才生成低置信、待审核人物卡。
5. 地点先解析到稳定地点实体，再按事件年份映射到地图要素。只有标题中明确出现的地点会成为正式事件地点，原句中的任官地、出发地和背景地继续留在证据层。
6. 晋级时以事实卡为基本单位，建立 `event_import_cards`、evidence link、人物/地点关系和搜索文档；聚类与事件通过多对多表关联。
7. 已人工审核的事件不会被机器重跑覆盖。无法定年、主体不明、注文、校勘语和语义残句继续保留为 staged / needs-review。

核心晋级逻辑不包含 184-280 或任何其他固定时期。184-280 是第一个验收模板，其中国年号锚点和地点实体是首批可替换数据包；后续时期和其他文明应增加纪年、地点、来源配置与模板审计，而不是复制晋级脚本。

常用命令：

```bash
npm run extract:hanshu-candidates
npm run archive:hanshu-candidates
npm run canonicalize:events
npm run review:event-clusters
npm run promote:official-history-cards
npm run audit:official-history-events
npm run test:event-promotion
```

### 地图数据

三国地图继续以郡界地图为主入口。当前 280-317 西晋图层是基于 184-280 模板生成的研究占位与界面模拟，不是最终史实郡县地图。后续仍需依据《晋书·地理志》、历史地图集及魏晋南北朝真实郡县沿革重新校订 geometry、控制记录和缺失地块；在完成审校前保持 `derived-review-needed` 状态。

相关命令：

```bash
npm run derive:china-jin-map
npm run import:china-jin-map-geometry
npm run audit:china-map-geometry
```

### 本地开发

建议使用 Node.js 22.12 或更高版本。全新克隆应使用锁文件安装依赖，并先从已跟踪的 schema、migration 和 seed 重建本地 SQLite：

```bash
npm ci
npm run db:build
npm run api
npm run dev
```

`npm run api` 与 `npm run dev` 需要分别在两个终端运行。

默认前端地址：

```text
http://127.0.0.1:5173/
```

### 验证与数据导出

前端或 TypeScript 改动后：

```bash
npm run build
```

SQLite 数据改动后：

```bash
npm run db:seed:export
npm run validate:db
```

常用数据校验：

```bash
npm run validate:data
npm run audit:period-190-310
npm run audit:period-310-589
npm run audit:china-310-589-originals
```

### 提交原则

可以提交结构化数据、SQLite seed、审计脚本、导入脚本、前端代码和文档。不要提交：

- `public/` Cloudflare 静态快照
- `scripts/export-static-api-snapshot.mjs`
- `.codex-backups/`
- `demos/`
- DeepSeek 原始长输出
- 本地 PDF、扫描件、参考资料原件

## English

ChronoAtlas is an interactive comparative history timeline. It aligns events, people, maps, primary-source excerpts, translations, evidence links, and retrieval data across regions so the same year or narrative phase can be compared responsibly.

### Current Scope

- The world overview now spans 900 BCE to 1912 CE.
- China uses narrative historical phases rather than only formal dynastic dates. For example, the Three Kingdoms phase is represented as Late Han and Three Kingdoms, 184-280.
- Rome uses Roman and Byzantine narrative phases, including 180-235 and 235-284 for the transition into the third-century crisis.
- Global anchor events remain visible across timeline selections.
- The 190-310 period remains the acceptance template for later periods.
- The 25-184, 184-280, and 280-317 China phases now include expanding people, event, map, and source-text data.
- The current 280-317 Western Jin map is a research placeholder derived from the 184-280 template, not a final reconstruction of historical commandery boundaries. It remains `derived-review-needed` until it is re-audited against period geography and source evidence.

### Key Modules

- World overview and region-specific timelines
- Regional maps and detail panels
- Person index, person detail pages, age comparison, and person-event links
- Event comparison, event detail pages, event categories, and density controls
- Source evidence, original-text library, source filtering, pagination, and evidence graph
- Coverage audits, map debugging, RAG evaluation, AI Q&A, and AI records
- Local SQLite API data flow

### Data Workflow

Primary texts can be imported into SQLite, split into searchable passages, and used for person/event extraction. Candidate events are archived into clusters before promotion:

```bash
npm run extract:hanshu-candidates
npm run archive:hanshu-candidates
npm run canonicalize:events
npm run review:event-clusters
```

SQLite changes must be exported and validated:

```bash
npm run db:seed:export
npm run validate:db
```

Frontend changes should pass:

```bash
npm run build
```

For a reproducible fresh checkout, use Node.js 22.12 or newer:

```bash
npm ci
npm run db:build
```

Then run `npm run api` and `npm run dev` in separate terminals.
