# ChronoAtlas 历史证据库 Phase 1：卷五十四垂直切片

状态：技术垂直切片已实现；未应用到现有 `db/chronoatlas.sqlite`，未接入公开事件 API。

## 1. 样本边界

- Work：陈寿《三國志》。
- Witness：《武英殿二十四史》本《三國志》。
- 范围：卷五十四《周瑜传》中与孙权决策、孙刘联合、赤壁接战、火攻、败退和南郡后续有关的少量段落。
- 注疏：裴松之按语作为 `commentary` 节点。
- 辑佚材料：裴注所引《江表傳》作为 `quoted_fragment` 节点，归属到独立的散佚 Work；存世位置仍属于《三國志》witness。
- 不包含：整本《三國志》、其他卷、其他史书、来源陈述、规范命题和正式事件。

样本资产：`data/evidence-pool/sanguozhi-wuyingdian-v54-pilot.json`

该资产是项目内部制作的注疏分层转写小样本，不是扫描影像。Witness 的 `fidelity_status` 固定为 `pilot_pending_image_collation`；在完成逐页影像核对前，不得升级为外交转写定本。

## 2. 新增 shadow schema

迁移：`db/migrations/031-evidence-pool-core.mjs`

### 书目、版本、资产和权利

- `source_works`
- `source_work_contributors`
- `source_work_relations`
- `source_witnesses`
- `source_witness_relations`
- `source_assets`
- `rights_statements`
- `asset_rights`
- `ingest_runs`
- `ingest_run_assets`
- `witness_active_ingests`

### 结构、文本和锚点

- `document_nodes`
- `text_layers`
- `text_revisions`
- `text_anchors`
- `text_alignments`
- `anchor_attributions`
- `ingest_run_text_revisions`

这些表没有替换现有 `sources/source_passages/source_mentions/events`，也没有被 legacy API 查询。

## 3. 不可变与完整性约束

- `source_assets.sha256` 唯一；资产字节、hash、storage URI 和 witness 不允许原地更新。
- `text_revisions` 的内容、hash、layer 和来源资产不允许原地更新。
- 已被 anchor 引用的 revision 不允许删除。
- `text_anchors` 使用 Unicode code point 和左闭右开 `[start_cp,end_cp)`。
- SQLite trigger 检查 `exact_text` 必须等于 revision 对应字符范围。
- anchor ID 由 revision、范围和 exact hash 确定性生成。
- 相同 manifest、adapter version 和参数 hash 只能对应一个 ingest run。
- 文档父子节点必须属于同一 witness。
- 正文、注释和辑佚引文是不同 node/layer，不能相互覆盖。

## 4. 导入安全边界

只查看计划，不打开数据库：

```powershell
npm run plan:evidence-pool-pilot
```

创建独立 shadow pilot 数据库：

```powershell
npm run build:evidence-pool-pilot-db -- --apply --standalone --db=C:\temp\chronoatlas-evidence-pilot.sqlite
```

安全规则：

- 默认模式永远是 plan。
- apply 必须显式提供 `--db`。
- standalone builder 永远拒绝 `db/chronoatlas.sqlite`。
- 对已存在但缺少 `entities` 表的未知数据库拒绝初始化。
- 同一 asset/manifest 重跑复用 committed run，不新增记录。

## 5. 锚点解析 API

在已经建立的 shadow pilot 数据库上启动：

```powershell
npm run api:evidence-v2 -- --db=C:\temp\chronoatlas-evidence-pilot.sqlite
```

仅监听 `127.0.0.1`，提供：

- `GET /health`
- `GET /api/v2/evidence/anchors/:id-or-urn`
- `GET /api/v2/evidence/witnesses/:id/reading-order`
- `GET /evidence/anchors/:id-or-urn`

解析结果包含：

- exact text；
- Unicode code point 字符范围；
- Work、Witness、卷传层级和 locator path；
- layer kind 与 main/commentary/quoted-fragment 角色；
- revision 号和 content hash；
- asset SHA-256、storage URI 和权利记录；
- 《江表傳》等 attribution。

当前样本的 `allow_display=false`、`allow_index=false`。本地解析页会显示权利警告；它不是公开原文页面。

## 6. 自动验证

```powershell
npm run test:evidence-pool
npm run validate:db
```

测试覆盖：

1. 首次导入生成 2 个 Work、1 个 Witness、1 个 Asset、8 个 Node、6 个 Layer/Revision/Anchor 和 1 个辑佚归属。
2. 相同 manifest 第二次运行零新增。
3. 在测试副本中改动一个字后，新增 1 个 Asset、1 个 Revision 和 1 个 Anchor；旧 revision 和旧 anchor 仍可解析。
4. 正文、裴注、辑佚引文保持独立角色和阅读顺序。
5. anchor exact hash、Unicode code point 范围、rights 和 attribution 可解析。
6. revision 原地改写被数据库 trigger 拒绝。
7. `PRAGMA foreign_key_check` 为零错误。

## 7. 尚未通过的学术与发布门禁

- 尚未保存《武英殿二十四史》本卷五十四扫描页资产。
- 尚未完成逐页、逐栏、逐字影像校勘和图像区域 selector。
- 尚未核定可公开展示的数字转写许可证。
- 尚未建立 punctuated/normalized/translation 层及跨层 alignment。
- 尚未进入 Phase 2 assertion/claim 流程。
- 尚未创建赤壁正式事件、事件簇或 release item。

因此，本切片证明的是新内核的技术结构与不可变机制可行，不代表样本文字已经获得正式史料发布资格。
