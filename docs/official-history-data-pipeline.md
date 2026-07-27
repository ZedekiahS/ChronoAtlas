# 正史数据链路

ChronoAtlas 的正史处理分为三层，任何模型或规则抽取器都不能越过候选层直接写正式事件。

1. `source_passages` 保存可定位原文。
2. `import_evidence_cards`、`source_mentions` 和 `import_event_clusters` 保存候选、人物地点绑定与合并线索。
3. `promote-official-history-cards.mjs` 统一执行篇章、纪年、标题、人物角色、地点和人工审核门，之后才写正式事件卡。

## 语义抽取契约

通用输出 schema 为 `chronoatlas-official-history-extraction-v1`。导入前运行：

```powershell
node --no-warnings scripts/validate-official-history-extraction.mjs --input=<input.jsonl> --output=<output.jsonl> --summary=<summary.json> --expected=<count>
node --no-warnings scripts/import-official-history-semantic-candidates.mjs --input=<input.jsonl> --output=<output.jsonl> --summary=<summary.json> --batch=<stable-batch-id>
```

导入器使用 `batch + task_id + event_index` 生成稳定 ID。`candidate_only` 与 `reject` 不会进入正式晋级；`approved`、`rejected`、`promoted` 的候选卡或聚类不会被机器重跑覆盖。

40 条西汉末至新莽样本的精简审核基准在 `scripts/data/official-history-extraction-golden-xin-transition-40.mjs`。该文件只保存判定结果，不保存原文或模型长输出。

## 时期数据包

时期差异放在 `china-official-history-period-packs.mjs`，包括时间窗、史书、可用篇章、纪年置信度、人物和地点参考包、稳定批次 ID。扩展新时期时优先新增数据包，不在晋级核心中写时期特例。

东汉 25-57 的纵向验证命令：

```powershell
npm run extract:eastern-han-25-57-candidates
npm run archive:eastern-han-25-57-candidates
npm run audit:eastern-han-25-57-candidates
node --no-warnings scripts/promote-official-history-cards.mjs --dry-run --skip-rebuild-chunks --profile=china-eastern-han-25-183-v1 --batch=auto-houhanshu-eastern-han-25-57-candidates
```

时期包审计必须满足：候选年份在窗口内、纪年置信度达标、篇章类型允许、无注文候选、标题可规范化、每张卡已进入聚类。人物和地点绑定率作为覆盖指标报告，不作为自动放宽晋级门的理由。

东汉后续切片沿用相同流程。明帝、章帝时期使用 `china-eastern-han-58-88-v1`，对应固定命令 `extract:eastern-han-58-88-candidates`、`archive:eastern-han-58-88-candidates` 和 `audit:eastern-han-58-88-candidates`。和帝时期使用 `china-eastern-han-89-105-v1`，对应 `extract:eastern-han-89-105-candidates`、`archive:eastern-han-89-105-candidates` 和 `audit:eastern-han-89-105-candidates`。殇帝、安帝时期使用 `china-eastern-han-106-125-v1`，对应 `extract:eastern-han-106-125-candidates`、`archive:eastern-han-106-125-candidates` 和 `audit:eastern-han-106-125-candidates`。该批次归档与审计后运行 `repair:eastern-han-106-125-candidates` 和 `promote:eastern-han-106-125-cards`。

106–125 年裁决表覆盖批次内全部候选，并区分 `promote`、`context`、`reject`。只有显式 `promote` 可以进入正式事件；经人工核定的集体主体叛乱、侵扰或围城事件可用 `allowCollectiveEvent` 晋级，不再被“必须有人名”规则误挡。人物绑定、标题修订和既有事件合并均由通用裁决执行器写入，后续时间片只需新增裁决数据模块。

带 `--batch` 的时期包晋级默认使用增量模式：只追加或更新当前批次拥有的事件与证据，不清理同一 profile 的其他时期。只有完整 profile 重建才可显式传入 `--cleanup-profile`；该模式会执行全 profile 陈旧事件和人物清理，不能用于窄时期包。

新莽过渡期使用独立的 `china-western-han-xin-transition--8-24-v1` profile。该 profile 明确排除公元 0 年，并要求高置信度、精确到年的纪年。语义候选先经过固定的 28 条裁决表，只有 `promote` 项能进入正式晋级；`context` 保留为史料上下文，`reject` 不进入事件层。

```powershell
node --no-warnings scripts/apply-xin-transition-candidate-repairs.mjs --dry-run
npm run repair:xin-transition-candidates
node --no-warnings scripts/promote-official-history-cards.mjs --dry-run --skip-rebuild-chunks --profile=china-western-han-xin-transition--8-24-v1 --batch=semantic-china-western-han-xin-transition--8-24-v1
npm run promote:xin-transition-cards
npm run audit:xin-transition-events
```

## 正式事件富化

`enrich-official-history-events.mjs` 在正式晋级和去重稳定后执行，统一生成 `detail` 七段结构、`relatedEvents` 和带依据的 `relatedEventRefs`。

```powershell
node --no-warnings scripts/enrich-official-history-events.mjs --dry-run --profile=china-eastern-han-25-183-v1
npm run enrich:eastern-han-events
npm run enrich:three-kingdoms-events
npm run enrich:western-jin-events
npm run enrich:xin-transition-events
```

富化器默认只修改 `draft` 或 `needs-review` 的机器晋级事件，不覆盖完整的人工 `detail`。`--include-reviewed-missing-detail` 只允许为已审核事件补空缺详情，`--migrate-legacy-detail` 只迁移旧版 `detail.fields`；原结构会保存在 `enrichment.legacyDetail`。`--include-curated-incomplete-detail` 将同一时期内缺少七段结构的核心人工事件纳入目标，但排除 `life:*` 人物生平节点。`--refresh-generated-enrichment` 只刷新仍处于 `needs-review` 的生成详情，已经把富化状态审核为 `reviewed` 的内容不会被重写。

事件本身的审核状态与富化审核状态相互独立。自动生成或迁移后写入 `enrichment.reviewStatus = needs-review`，不修改 `events.review_status`；因此“事件已经审核”不等于“机器补写的背景、结果和影响已经审核”。经过、结果和影响只使用原文明示子句或已审核旧字段；原文没有说明时写入材料边界，不自动补写推测。

相关事件的候选池覆盖时期窗口内全部正式核心事件，以便机器正史卡和人工核心卡互相关联。已有人工 `relatedEvents` 会保留并标记为 `editorial`；机器只新增疑似重复、共享明确参与人物、共享历史对象或同地同时段等关系，这些信号不代表因果。

富化目标不依赖事件 ID 或 `raw.profileId` 单独判断。凡通过 `event_import_cards.generator` 记录为该 profile 晋级结果的事件都纳入处理，因此机器新建的 `official-history-event:*` 与机器候选匹配到的既有人工事件使用同一套详情和关系规则。

机器富化保存输入指纹。再次晋级时，只有标题、原文摘要、人物、地点和来源定位均未变化才保留旧富化；任一输入变化都要重新运行富化器。
