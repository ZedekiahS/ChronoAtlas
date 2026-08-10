# Phase 2a：赤壁多来源证据包与候选陈述审核说明

日期：2026-08-09
范围：影子 schema、最小原文证据包、候选陈述、只读治理 API
明确不在范围：主库迁移、整书批量导入、人工史学决定、规范命题发布、事件卡与事件簇发布

## 1. 本阶段修正了什么

Phase 1 的《三國志》卷五十四样本只用于验证“不可变资产 → 文献层级 → 原文 revision → exact anchor”。它不能代表赤壁事件簇的完整证据背景。

Phase 2a 改为先建立 `red-cliffs-multi-source-v1` 证据包。证据包要求四个文献家族全部形成 committed ingest，候选提取才能开始：

| 必需文献家族 | 本阶段明确载体 | 当前用途 | 状态 |
|---|---|---|---|
| 《三國志》及裴松之注 | 《武英殿二十四史》本卷五十四小样本 | 主叙事、裴注判断、《江表傳》辑佚引文 | 待影像逐字校勘；内部使用 |
| 《後漢書》 | 《武英殿二十四史》本 | 献帝纪纪年、刘表传的投降与战果叙述 | 待影像逐字校勘；内部使用 |
| 《華陽國志》 | 《欽定四庫全書》本卷六，关联 CADAL06061130 | 刘备一方的长坂、求援、赤壁与荆州后续 | 待影像逐字校勘；内部使用 |
| 《資治通鑑》及胡三省注 | 《摛藻堂四庫全書薈要》本卷六十五 | 后世编年综合、华容退军、注中《水經注》地点引文 | 待影像逐字校勘；内部使用 |

证据包内实际登记 6 个叙述作品：《三國志》《江表傳》《後漢書》《華陽國志》《資治通鑑》《水經注》。后两种嵌套引文使用 `anchor_attributions` 记录被引作品，不能把宿主书误当成引文作者。

## 2. 旧库覆盖审计

对 `db/chronoatlas.sqlite` 的只读查询显示：

- 《三国志》标题族 318 个 legacy source 记录、510 段，赤壁或乌林命中 19 段；
- 《后汉书》标题族 146 个 legacy source 记录、849 段，命中 3 段；
- 《资治通鉴》标题族 332 个 legacy source 记录、3427 段，命中 10 段；
- 《华阳国志》为 0 段；
- 《水经注》有书目记录但没有 passage。

这些数字说明旧库并非只有《三国志》，但《后汉书》《资治通鉴》等仍停留在 legacy `sources/source_passages`，没有 v2 的版本、资产 hash、不可变 revision、字符范围和权利门禁。本阶段只把赤壁最小段落重新登记为 v2 影子样本，没有把旧段落批量迁移，也没有修改原记录。

## 3. 正确的绑定方向

```mermaid
flowchart LR
  W["多部作品与明确版本"] --> A["各自不可变原文锚点"]
  A --> C["43 条待审来源陈述候选"]
  C -->|"人工逐条核对"| S["accepted source assertions"]
  S --> T["人工审核的 transmission groups"]
  T --> K["跨书规范命题 claims"]
  K --> E["Phase 3 赤壁事件与事件簇"]
```

因此不是“赤壁事件直接绑定四本书”，而是：

1. 每本书的具体版本和原文位置产生自己的来源陈述；
2. 多条来源陈述经过传承依赖判断后支持、冲突或限定同一规范命题；
3. 赤壁事件簇关联规范命题；
4. 页面可沿 `event → claim → assertion → exact anchor → witness/asset` 回溯全部文献。

这样既能让用户在同一赤壁档案中看到多书材料，又不会把《资治通鉴》对《三国志》系统的后世综合误算成一条当然独立的同时代见证。

## 4. 当前候选规模

候选清单位于 `data/evidence-pool/red-cliffs-assertion-candidates-v1.json`，共 43 条：

| 来源层 | 候选数 | 例子 |
|---|---:|---|
| 《三國志》正文 | 18 | 鲁肃接触、诸葛亮出使、初战、火攻、追击与北归 |
| 裴松之判断 | 1 | “建计拒曹始于鲁肃”作为 authorial judgment，不混入战事发生层 |
| 《江表傳》辑佚引文 | 2 | 十艘火船准备、东南风 |
| 《後漢書》献帝纪 | 3 | 刘表卒、刘琮降、乌林与赤壁战果 |
| 《後漢書》刘表传 | 2 | 刘备奔夏口、曹操败于赤壁 |
| 《華陽國志》 | 9 | 长坂追击、汉津会合、求援、三万水军、战后四郡 |
| 《資治通鑑》正文 | 7 | 联合出兵、疾疫火攻、华容道、追至南郡 |
| 胡三省注引《水經注》 | 1 | 江水流经赤壁山北的地理陈述 |

43 是“待审文献陈述”数量，不是事件数量。一个长段落会拆成多个动作候选；同一动作也会在多本书中各有一条候选。只有人工接受后，才能将相近陈述聚合为少量 claims。

## 5. 数据库门禁

迁移 `032-assertion-claim-review-core.mjs` 新增候选、来源陈述、传承组、规范命题和追加式审核决定。关键约束：

- extraction 只能写 `assertion_candidates.status=pending_review`；
- `source_assertions` 必须引用针对同一候选、结果为接受、`reviewer_kind=human` 的决定；
- `claims` 具有同样的人审门禁；
- accepted transmission group 必须有对应的人工作出决定；
- accepted assertion、claim 和 review decision 不允许原地改写或删除；修正必须新建并 supersede；
- 候选、assertion 和 claim 不被 legacy event API 或公开事件卡读取。

当前影子验证结果严格为：43 candidates、0 review decisions、0 accepted assertions、0 claim candidates、0 claims、0 events。

## 6. 只读治理接口

`scripts/evidence-pool-api-server.mjs` 在 032 可用时提供：

- `GET /api/v2/evidence/review/summary`
- `GET /api/v2/evidence/review/assertion-candidates?pack=red-cliffs-multi-source-v1`
- `GET /api/v2/evidence/packs/red-cliffs-multi-source-v1/coverage`
- `GET /api/v2/evidence/claims/:id`

这些接口只读。审核决定模板 `red-cliffs-review-decisions-template.json` 的 `decisions` 目前为空，避免把程序作者的分段建议冒充为人工史学结论。

## 7. 验证结果

- 四个必需文献资产全部在临时影子库 committed；
- 6 works、4 witnesses、4 assets、29 nodes、19 immutable revisions、19 exact anchors；
- 首次提取新增 43 candidates；同一影子库重跑新增 0；
- 外键检查为 0；
- 同一段原文可以关联多个候选和多个经人工接受的 assertion；
- 没有人工决定时，数据库触发器拒绝 accepted assertion/claim；
- 测试中把《资治通鉴》转述与《三国志》放入同一传承组后，独立传承计数为 1；该结果仅验证机制，不代表项目已经作出实际传承判断；
- 主库 SHA-256 在执行前为 `f2677f6f8e95ce581bfda6da3d81876516dc8b10974bcf896d6d14398fd97d75`，最终复核必须仍一致。

## 8. 下一次需要人工讨论的内容

下一步不是自动生成事件，而是审核以下问题：

1. 43 条候选的原子边界是否合适；
2. 《三國志》各传、《江表傳》、《後漢書》、《華陽國志》和《資治通鑑》之间哪些属于同一传承链；
3. 哪些陈述能聚合成同一 historical occurrence claim，哪些只能作为地理说明、作者判断或后世综合；
4. 是否继续补入《三國志·武帝紀》《先主傳》《諸葛亮傳》《吳主傳》《魯肅傳》等同书异传，再开始首批 claim 审核。

未经确认，不进入 Phase 3 的 6 事件 + 1 事件簇，也不写主库。
