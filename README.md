# 历史年表

<a id="中文"></a>

中文 | [English](#english)

**历史年表**（ChronoAtlas）是一个交互式世界历史年表项目，用结构化数据把同一时期不同地区的事件、人物、地图和史料证据放在同一界面里对照。

项目目标不是做普通百科，而是回答一个更直观的问题：

> 同一时间，世界不同地方正在发生什么？这些事件之间有没有可解释的联系？

## 在线预览

- Cloudflare Pages: https://chronoatlas-preview.pages.dev

当前线上版本是静态只读预览，适合浏览时间线、地图、事件、人物、史料、覆盖度和证据相关页面。本地 SQLite API、AI 问答、写入型工具和数据维护流程仍以本地开发环境为准。

## 当前范围

项目已经从早期 180-280 原型扩展为多时期数据工程：

- 世界总览：前 550 至 1644 的时间轴入口。
- 190-310 模板期：以三国、罗马三世纪危机、萨珊兴起等为第一套验收模板。
- 310-589 中国段：晋代、十六国、南北朝至隋灭陈，正在按 190-310 模板期结构扩展。
- 地图与证据：事件位置、政权空间、史料原文、证据链接和覆盖度审计逐步接入。

## 190-310 模板期

190-310 已经作为项目的标准样板期，用来定义后续时期的数据质量：

- 标准文档：`docs/period-190-310-standard.md`
- 审计脚本：`scripts/audit-period-template-190-310.mjs`
- 验收命令：`npm run audit:period-190-310`
- 覆盖度页已显示模板期验收摘要。

这一时期的作用是建立统一范式：事件、人物、史料、原文摘录、证据链、地图点位和搜索文档都需要可审计。

## 310-589 中国段

310-589 是当前重点扩展区间，覆盖西晋灭亡、东晋、十六国、南朝宋齐梁陈、北魏至东西魏、北齐、北周和隋灭陈。

当前数据已经包括：

- 35 个中国核心事件。
- 104 条 source_mentions，全部为 verified-transcribed 原文状态。
- 103 条事件证据链接。
- 20 条 evidence_claims。
- 86 张 310-589 核心人物卡。
- 109 条人物生命事件。
- 109 条人物-事件关联。
- 251 条搜索文档。
- Wikisource 来源数量为 0。

310-589 的主史料体系：

- 正史主证据：`晋书`、`宋书`、`南齐书`、`梁书`、`陈书`、`魏书`、`北齐书`、`周书`、`隋书`
- 编年校年：`资治通鉴` 晋纪、宋纪、齐纪、梁纪、陈纪、隋纪
- 辅助汇总史：`南史`、`北史`
- 地图辅助：`中国历史地图集`、`水经注`、CHGIS

310-589 的来源规范见：

- `docs/period-310-589-source-standard.md`
- `scripts/audit-period-template-310-589.mjs`
- `scripts/audit-china-310-589-original-text-status.mjs`

常用验收命令：

```bash
npm run audit:period-310-589
npm run audit:china-310-589-originals
```

## 功能模块

当前应用已经不只是单一时间轴原型，主要模块包括：

- 时间总览：按年份浏览世界与区域事件。
- 学习模式：围绕事件、人物和史料进行结构化阅读。
- 人物索引：人物卡、生命事件和关联历史事件。
- 年龄对比：比较人物在同一年或同一事件阶段的年龄与位置。
- 史料证据：展示 source_mentions、evidence_links 和原文摘录。
- 证据图谱：连接事件、人物、地点、来源和断言。
- 事件对比：横向比较同一时期不同地区的事件。
- 覆盖度：查看时期数据是否满足审计标准。
- 地图调试：检查事件点位、地图层和空间数据。
- RAG 评测、AI 问答和 AI 记录：用于后续基于结构化历史数据的解释、检索和问答。

## 数据原则

项目优先使用可审计的结构化资料，而不是把大段 AI 生成文本当作历史事实：

- 每个核心事件需要来源、证据链接和可追溯字段。
- 原文摘录不能用概述冒充。
- locator-only 或待补原文必须明确标注状态。
- 正史本纪、列传与《资治通鉴》承担不同层级的证据角色。
- 本地下载的扫描件、PDF、DeepSeek 原始长输出、未审校草稿和 demo 不进入正式提交。

## 仓库结构

- `src/`: React 前端应用。
- `scripts/history-api-server.mjs`: 本地 SQLite API。
- `scripts/audit-*.mjs`: 时期验收、导入和数据质量审计。
- `scripts/seed-*.mjs`: 核心数据 seed 脚本。
- `db/schema.sql`: SQLite schema。
- `db/seeds/`: 可重建数据库的 SQL seed。
- `docs/`: 产品、数据模型、时期标准和史料规范。
- `data/`: 项目数据与地图辅助资料。

## 本地开发

```bash
npm install
npm run validate:data
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:5173/
```

本地 API：

```bash
npm run api
```

## 常用验证

```bash
npm run build
npm run validate:db
npm run audit:period-190-310
npm run audit:period-310-589
npm run audit:china-310-589-originals
```

如果修改了 SQLite 数据，需要导出 seed：

```bash
npm run db:seed:export
```

## 下一步

短期重点：

1. 继续补 310-589 人物卡的原文级证据和生命事件细节。
2. 扩展晋代、十六国和南北朝的地图层与地点坐标。
3. 将 310-589 覆盖度页做成接近 190-310 模板期的验收视图。
4. 继续完善 RAG 评测问题，让 AI 问答只基于可追溯数据回答。

---

<a id="english"></a>

# ChronoAtlas

[中文](#中文) | English

**ChronoAtlas** is an interactive world-history timeline. It uses structured data to place events, people, maps, and source evidence from different regions into the same chronological interface.

The project is not meant to be a generic encyclopedia. It is built around a simpler question:

> What was happening in different parts of the world at the same time, and how can those events be compared responsibly?

## Live Preview

- Cloudflare Pages: https://chronoatlas-preview.pages.dev

The current online version is a static read-only preview for browsing timelines, maps, events, people, sources, coverage, and evidence views. The local SQLite API, AI Q&A, write workflows, and data maintenance tools remain local-development features.

## Current Scope

The project has grown beyond the early 180-280 prototype into a multi-period data system:

- World overview: a timeline entry point from 550 BCE to 1644 CE.
- 190-310 template period: the first acceptance-standard period, covering late Han/Three Kingdoms China, the Roman third-century crisis, and the rise of the Sasanians.
- 310-589 China segment: Western Jin collapse, Eastern Jin, Sixteen Kingdoms, Northern and Southern Dynasties, and Sui reunification.
- Maps and evidence: event locations, polity layers, primary text excerpts, evidence links, and coverage audits.

## 190-310 Template Period

The 190-310 period defines the data-quality template for later periods:

- Standard document: `docs/period-190-310-standard.md`
- Audit script: `scripts/audit-period-template-190-310.mjs`
- Acceptance command: `npm run audit:period-190-310`

This period establishes the expected shape for events, people, sources, original excerpts, evidence links, map points, and search documents.

## 310-589 China Segment

The 310-589 segment is the current main expansion area. It covers the fall of Western Jin, Eastern Jin, the Sixteen Kingdoms, Liu Song, Southern Qi, Liang, Chen, Northern Wei, Eastern Wei, Western Wei, Northern Qi, Northern Zhou, and the Sui conquest of Chen.

Current audited data includes:

- 35 core China events.
- 104 source mentions, all with verified-transcribed original text.
- 103 event evidence links.
- 20 evidence claims.
- 86 core person cards for 310-589.
- 109 person life events.
- 109 person-event links.
- 251 search documents.
- 0 Wikisource sources.

Main source hierarchy for 310-589:

- Official histories: `Jinshu`, `Songshu`, `Nanqishu`, `Liangshu`, `Chenshu`, `Weishu`, `Beiqishu`, `Zhoushu`, `Suishu`
- Chronological calibration: `Zizhi Tongjian` sections for Jin, Song, Qi, Liang, Chen, and Sui
- Auxiliary dynastic summaries: `Nanshi`, `Beishi`
- Map support: `The Historical Atlas of China`, `Shuijing Zhu`, and CHGIS

Relevant standards and audits:

- `docs/period-310-589-source-standard.md`
- `scripts/audit-period-template-310-589.mjs`
- `scripts/audit-china-310-589-original-text-status.mjs`

Common checks:

```bash
npm run audit:period-310-589
npm run audit:china-310-589-originals
```

## Product Modules

The application now includes more than a basic timeline prototype:

- Timeline overview
- Learning mode
- Person index
- Age comparison
- Source evidence views
- Evidence graph
- Event comparison
- Coverage dashboard
- Map debugging
- RAG evaluation, AI Q&A, and AI records

## Data Principles

ChronoAtlas favors auditable structured history data over unchecked generated prose:

- Core events need sources, evidence links, and traceable fields.
- Original excerpts must not be replaced with summaries.
- Locator-only or pending excerpts must be explicitly marked.
- Official histories and `Zizhi Tongjian` play different evidence roles.
- Local scans, PDFs, raw long LLM outputs, unreviewed drafts, and demos are not part of formal commits.

## Repository Map

- `src/`: React frontend.
- `scripts/history-api-server.mjs`: local SQLite API.
- `scripts/audit-*.mjs`: period acceptance and data-quality audits.
- `scripts/seed-*.mjs`: seed scripts for core data.
- `db/schema.sql`: SQLite schema.
- `db/seeds/`: SQL seed files for rebuilding the database.
- `docs/`: product notes, data model, period standards, and source standards.
- `data/`: project data and map support files.

## Local Development

```bash
npm install
npm run validate:data
npm run dev
```

Default development URL:

```text
http://127.0.0.1:5173/
```

Local API:

```bash
npm run api
```

## Common Validation

```bash
npm run build
npm run validate:db
npm run audit:period-190-310
npm run audit:period-310-589
npm run audit:china-310-589-originals
```

After changing SQLite data, export the SQL seeds:

```bash
npm run db:seed:export
```

## Next Steps

Near-term priorities:

1. Add more original-source detail to 310-589 person cards and life events.
2. Expand map layers and coordinates for Jin, Sixteen Kingdoms, and Northern/Southern Dynasties.
3. Bring the 310-589 coverage dashboard closer to the 190-310 template-period acceptance view.
4. Improve RAG evaluation so AI answers remain grounded in traceable data.
