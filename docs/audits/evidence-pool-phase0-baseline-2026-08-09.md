# ChronoAtlas 历史证据库 Phase 0 只读基线

审计日期：2026-08-09

本报告由 `scripts/audit-evidence-pool-baseline.mjs` 对现有 `db/chronoatlas.sqlite` 以 `readOnly + PRAGMA query_only=ON` 方式生成。查询前后重新计算数据库 SHA-256；若字节发生变化，脚本直接失败。

复现命令：

```powershell
npm run audit:evidence-pool-baseline
```

## 1. 数据集与粒度

- `sources`：现有来源网页、卷页或人工来源记录，不等同于抽象作品或明确版本。
- `source_passages`：从数字来源清洗出的文本块，不等同于不可变原始资产。
- `source_mentions`：人工或机器生成的来源陈述候选，当前混合 draft/reviewed 状态。
- `events`：混合人物生平派生事件、机器晋级事件和 legacy 核心事件。
- `historical_events`：旧核心事件库存；它是迁移与页面连续性的审计入口，不是学术审核结论。

## 2. 数据库完整性

| 项目 | 结果 |
|---|---:|
| 文件大小 | 304,963,584 bytes |
| SHA-256 | `f2677f6f8e95ce581bfda6da3d81876516dc8b10974bcf896d6d14398fd97d75` |
| 查询前后 SHA-256 一致 | 是 |
| `PRAGMA foreign_key_check` 错误 | 0 |

结论：Phase 0 审计没有改变现有数据库，现有显式外键未发现断裂。

## 3. 核心计数

| 表 | 行数 |
|---|---:|
| `sources` | 1,128 |
| `source_passages` | 7,596 |
| `source_mentions` | 26,325 |
| `import_evidence_cards` | 959 |
| `import_event_clusters` | 230 |
| `events` | 1,678 |
| `historical_events` | 296 |
| `historical_event_event_links` | 296 |
| `evidence_links` | 2,329 |
| `evidence_claims` | 0 |
| `observations` | 0 |
| `search_documents` | 29,793 |
| `document_chunks` | 29,793 |

## 4. 整书清洗文本覆盖

以下字符数是清洗文本规模，不代表经过版本校勘的原文字数。

| 作品分组 | source 行 | passage 行 | 字符数约 |
|---|---:|---:|---:|
| 《资治通鉴》 | 295 | 3,427 | 5,892,109 |
| 《晋书》 | 130 | 862 | 1,418,086 |
| 《后汉书》 | 129 | 849 | 1,412,848 |
| 《汉书》 | 120 | 1,123 | 1,949,770 |
| 《三国志》 | 66 | 510 | 846,788 |
| 其他来源 | 388 | 825 | 1,581,430 |

质量判断：有文本不等于有明确 witness。现有整书导入没有形成原始资产快照、资产 SHA-256、许可记录和版本级身份，不能直接作为新证据内核的 L1 定本。

严重度：高；置信度：高。

## 5. 事件构成与页面风险

`events` 的 1,678 行由以下部分组成：

| 类别 | 行数 | 比例 |
|---|---:|---:|
| 人物生平派生，`life:*` | 896 | 53.40% |
| `source-event-promotion-v2` 机器晋级 | 467 | 27.83% |
| 其他事件 | 315 | 18.77% |

当前 legacy `/api/frontend-events` 仅排除 `life:*`，没有 release item 或审核状态门禁，因此其查询范围为 782 行：

- 296 行 `draft`；
- 486 行 `needs-review`；
- 其中 467 行是 `source-event-promotion-v2` 机器晋级事件；
- `reviewed/approved` 为 0。

当前代码依据：`scripts/history-api-server.mjs` 的 `frontendEvents()` 查询只包含 `WHERE ev.id NOT LIKE 'life:%'`。

风险：机器候选可能被当作正式事件展示。严重度：高；置信度：高。

### 页面差异基线

| 方案 | 理论可见事件数 | 与当前 782 行相比 |
|---|---:|---:|
| 当前 legacy 查询 | 782 | 0 |
| 立即改成 `reviewed/approved` | 0 | -782 |
| 296 条旧核心事件作为待审迁移库存 | 最多 296 | 至少 -486 |

这解释了为什么 296 条只能叫“旧核心事件待审清单”：它可以防止迁移讨论失去现有页面基准，但不能绕过逐条审核成为发布白名单。

## 6. 296 条旧核心事件

- 296 条 `historical_events` 与 296 条新 `events` 一对一映射。
- 296 条映射目标全部为 `draft`。
- `reviewed/approved` 为 0。
- 250 条拥有旧 `historical_event_sources`。
- 254 条拥有至少一条 `evidence_links`。
- 0 条映射到人物生平派生事件。
- 0 条映射到 `source-event-promotion-v2` 机器晋级事件。

赤壁附近旧记录已经包含“刘琮举州降曹”“孙刘联盟形成”“诸葛亮使吴自结孙权”“赤壁之战”，后续必须保留、合并或降为阶段，而不能四条原样全部发布。

## 7. 写入命令隔离

静态检查了 18 个以 `import-` 或 `promote-` 开头的 legacy 脚本：

- 同时显式包含 `--plan` 与 `--apply`：1 个；
- 缺少显式 `--apply`：17 个。

风险：误运行 legacy 命令可能直接改变数据库。严重度：高；置信度：中高。字符串扫描不能完全判断每个脚本的实际控制流，但足以证明尚未普遍形成显式 apply 门禁。

Phase 1 新增命令遵循以下规则：

- 默认只输出 plan；
- `--apply` 必须显式给出 `--db`；
- 默认拒绝把 `db/chronoatlas.sqlite` 作为 apply 目标；
- Phase 0/1 不增加任何 v2 公开事件 API。

## 8. Phase 0 结论

1. 数据库文件与显式外键可作为只读迁移基线。
2. 现有全文只能作为 legacy 数字文本，不能冒充版本化原始资产。
3. 296 条旧核心事件适合作为逐条审核入口，不适合作为自动发布结果。
4. legacy 事件 API 仍有高风险；本阶段不修改用户正在编辑的 API 文件，v2 数据保持 shadow 隔离。
5. legacy 写入脚本尚未全部完成 plan/apply 改造；在完成逐脚本重构前，不应运行批量导入或晋级命令。
