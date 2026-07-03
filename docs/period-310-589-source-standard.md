# 310-589 中国段史料使用标准

## 定位

`310-589 CE` 中国段是 ChronoAtlas 在 190-310 范例期之后的第一条长时段中国主线，范围从西晋崩溃、东晋十六国、南北朝对峙，到隋灭陈完成统一。它的目标不是一次性穷尽所有纪传材料，而是把事件、人物、史料、证据断言、搜索文档和后续 RAG 评测按 190-310 模板期的结构稳定下来。

本时期的正式数据必须遵守三条底线：

- 正史本纪、列传、载记是政权和人物叙事的主证据。
- 《资治通鉴》负责编年校年、跨政权事件衔接和同一年南北对照。
- 没有核对原文时，只能记录 locator-level 证据，不能用现代概述或脚本摘要冒充古籍原文。

## 主史料分层

| 层级 | 用途 | 史料 |
|---|---|---|
| Primary official histories | 政权本纪、人物列传、载记、地理志和制度志的主证据 | 《晋书》《宋书》《南齐书》《梁书》《陈书》《魏书》《北齐书》《周书》《隋书》 |
| Primary chronicle | 编年校年、跨政权事件链、同年南北对照 | 《资治通鉴》晋纪、宋纪、齐纪、梁纪、陈纪、隋纪 |
| Summary histories | 补人物脉络、南北朝合传、材料互证；不能优先替代对应正史 | 《南史》《北史》 |
| Geography and map support | 地名、水系、城邑、道路、控制区解释和地图证据 | 《中国历史地图集》《水经注》与 CHGIS；必要时再使用后续审定地理材料 |
| Modern secondary references | 只用于解释学术争议、现代地名比定、断代综述和数据校验 | 审校后的现代研究；不得替代主证据 |

## 正史负责范围

| source_id | 史料 | 主要负责范围 | 使用规则 |
|---|---|---|---|
| `jinshu` | 《晋书》 | 西晋末、东晋、十六国载记；304-420 主线人物和政权崩解 | 西晋灭亡、东晋建立、十六国人物优先使用；关键年份再用《资治通鉴·晋纪》校年。 |
| `songshu` | 《宋书》 | 刘裕北伐、刘宋建国、420-479 南朝宋本纪列传与州郡 | 刘宋本纪和刘裕相关事件优先使用；420 前后禅代应和《晋书》《资治通鉴》并挂。 |
| `nanqishu` | 《南齐书》 | 479-502 南齐宗室、权臣和短期政权更替 | 南齐建国、宗室内争、萧衍兴起使用；必要时以《资治通鉴·齐纪》补编年。 |
| `liangshu` | 《梁书》 | 502-557 梁朝、梁武帝、侯景之乱、梁末分裂 | 梁朝本纪和侯景之乱主证据；梁末跨北朝事件需加《资治通鉴·梁纪》。 |
| `chenshu` | 《陈书》 | 557-589 陈朝建国、江南后期政治、陈亡 | 陈霸先建陈、陈后主、隋灭陈江南侧证据优先使用。 |
| `weishu` | 《魏书》 | 北魏兴起、439 统一北方、孝文帝改革、北魏晚期 | 北魏本纪列传主证据；北魏分裂前后应和《资治通鉴·梁纪》互证。 |
| `beiqishu` | 《北齐书》 | 东魏至北齐高氏政权、550-577 北齐 | 高欢、高洋、北齐建国和灭亡使用；东魏阶段可与《魏书》《北史》互补。 |
| `zhoushu` | 《周书》 | 西魏、北周宇文氏政权、北周灭齐 | 宇文泰、西魏北周制度、557 北周建国、577 灭齐主证据。 |
| `suishu` | 《隋书》 | 杨坚代周、581 建隋、588-589 灭陈、统一收束 | 隋代周和灭陈主证据；制度、地理总结可作为统一后背景。 |

## 地图证据辅助材料

310-589 的地图层不直接替代事件史料。地图控制区、州郡位置、城邑、水系和道路应以史料叙事为基础，再用地图与地理资料校准。

| 材料 | 角色 | 使用规则 |
|---|---|---|
| 《中国历史地图集》 | 历史政区、疆域格局和州郡位置的主要地图参照 | 用于控制区边界、州郡位置和时期地图总览；记录版本、册次、页图或图幅。 |
| 《水经注》 | 北魏及以前地理、水系、城邑、道路和地名关系证据 | 用于解释地理定位和地名沿革；不单独证明政权事件。 |
| CHGIS | 现代 GIS 坐标、历史地名、行政层级和空间校准辅助 | 用于几何校准、坐标和地名匹配；需记录数据版本，不替代正史或《资治通鉴》。 |

地图 source_id 后续建议使用 `tan-qixiang-historical-atlas`, `shuijingzhu`, `chgis`。其中 `shuijingzhu` 已作为地理书进入来源体系；《中国历史地图集》和 CHGIS 进入正式 seed 前，应在 `sources.raw_json` 里写清楚版本、数据来源、使用范围和版权/许可状态。

## 《资治通鉴》的角色

《资治通鉴》在 310-589 不是二级装饰材料，而是编年骨架。它主要承担：

- 校年：把正史本纪、列传、载记中分散叙事归入明确年份、月日或年号。
- 串联：把同一年南朝、北朝、十六国或隋陈双方事件放进同一时间线。
- 补链：对北魏分裂、侯景之乱、北周灭齐、隋灭陈等跨政权事件建立连续事件链。
- 争议标注：当正史叙事侧重不同或后世追述色彩明显时，记录 `dispute_note` 或 raw_json 的 `disputeNote`。

使用限制：

- 《资治通鉴》可作为事件时间线主证据，但人物传记细节仍应回挂对应正史列传。
- 若事件判断依赖《资治通鉴》而非正史本纪，应在 `source_id`、`locator` 和 `evidence_role` 中明确。
- 同一关键事件最好至少保留一条正史证据和一条通鉴证据；第一轮不齐时必须列入后续补证清单。

## source_id 命名规范

310-589 中国段采用稳定、短小、可读的 `source_id`，不在 id 中混入卷号或事件名。

| 类型 | 规则 | 示例 |
|---|---|---|
| 单部正史 | 书名拼音小写，不加年代 | `jinshu`, `songshu`, `weishu`, `suishu` |
| 通鉴分纪 | `zizhi-tongjian-` 加分纪名 | `zizhi-tongjian-jin`, `zizhi-tongjian-liang` |
| 汇总史 | 书名拼音小写 | `nanshi`, `beishi` |
| 地理书 | 书名拼音小写 | `shuijingzhu` |
| 后续现代研究 | `modern-` 加作者或短题名 slug | `modern-tan-qixiang-atlas` |

不得为同一史料重复创建近似 id，例如不要同时出现 `jin-shu`、`book-of-jin`、`jinshu-official`。确需区分版本或底本时，在 `sources.raw_json` 中记录 `edition`、`transcriptionSource`、`transcriptionSourceUrl`，不要改变 canonical `source_id`。

## 证据表使用规范

### source_mentions

`source_mentions` 是史料段落或定位卡的核心表。每条记录必须尽量包含：

- `source_id`：指向 `sources.id`。
- `work_title` / `book_title` / `chapter_title`：能帮助人读懂出处层级。
- `locator`：卷、纪、传、载记、年号、页码或电子文本卷号。
- `year`：可编年的事件年份；不确定时允许为空，但要写争议说明。
- `text`：只有核过古籍原文时才放原文摘录；未核原文时必须写“原文待摘录”类说明。
- `translation`：译文、释义或现代摘要；不得替代 `text` 的原文角色。
- `raw_json.originalTextStatus`：必须存在。

推荐 `originalTextStatus`：

- `verified-transcribed`：已核对可追溯底本或电子文本，并摘录原文。
- `not-yet-transcribed`：已有可靠 locator，但尚未摘录原文。
- `locator-only`：只完成来源定位，暂不具备原文摘录。
- `needs-review`：已有摘录但底本、断句、对应事件或转录质量待复核。

### evidence_links

`evidence_links` 负责把史料证据挂到事件、人物、生平节点、断言或 source mention 上。

- 事件证据使用 `subject_table = 'events'`，`subject_id` 指向事件 id。
- 史料卡自身可使用 `subject_table = 'source_mentions'`，便于证据页和搜索页跳转。
- `mention_id` 应指向同一条 `source_mentions.id`；除非证据来自非段落型材料，否则不要只填 `source_id`。
- `quote` 只能放已核原文摘录；locator-only 阶段保持为空。
- `raw_json.originalTextStatus` 必须与对应 `source_mentions` 保持一致。

### search_documents

`search_documents` 是检索和 RAG 的入口，不是史料权威本体。

- `subject_table` 应指向 `events`、`entities` 或 `source_mentions`。
- 事件文档可以包含摘要、标签、人物和出处定位。
- source mention 文档在已摘原文后必须包含原文、释义和出处。
- locator-only 文档必须明确写出“原文状态：待摘录”或在 `raw_json.originalTextStatus` 中标注。
- 不得把未审校的长输出、二手概述或模型生成段落作为原文喂给检索。

### evidence_claims

`evidence_claims` 用于表达可被证据支撑的历史判断，而不是重复事件摘要。

- `claim_type` 应区分 `event-chain`、`dynastic-pattern`、`military-balance`、`chronology`、`map-control` 等。
- `statement_zh` 和 `statement_en` 应是可验证断言。
- `evidence_claim_sources` 至少挂一条 source mention 或明确 locator。
- `evidence_claim_subjects` 必须挂到相关事件、人物或地图控制对象。
- 断言如果只由 locator-only 证据支撑，`confidence` 不应高于 `medium`。

## 原文摘录要求

原文摘录是 310-589 继续接近 190-310 范例期的关键指标。

- 后续新补原文优先使用与 190-310 三国段一致的中文古籍来源：正史、南史、北史优先用中国哲学书电子化计划（CText），《资治通鉴》优先用国学网卷次页；Wikisource 可保留为既有记录或交叉核对来源，但不再作为新批次首选。
- 不能用事件 summary、现代白话概述、脚本生成文字冒充古籍原文。
- 未核原文时，`source_mentions.text` 可以写定位说明，但必须明示“原文待摘录”。
- `evidence_links.quote` 在未核原文时必须为空，不要填摘要。
- locator-only 或 not-yet-transcribed 证据必须在 `raw_json.originalTextStatus` 标明状态。
- 已核原文时，应同时更新 `source_mentions.text`、`source_mentions.translation`、`evidence_links.quote`、`search_documents.body` 和相关 raw_json。
- 摘录来源应记录 `transcriptionSource` 和 `transcriptionSourceUrl`，例如 Chinese Text Project 或 国学网。
- 若 CText 个别卷页无法稳定访问，可使用汉典古籍等中文古籍站作为显式 fallback；必须在 `transcriptionSource` 中写明，不得混写为 CText。
- 对断句、异文、事件对应关系有疑问时，保留摘录但将状态标为 `needs-review`，并写 `disputeNote`。

## 后续补原文优先级

补原文不按随机顺序推进，应优先处理会影响时期骨架和 RAG 答案的证据。

| 优先级 | 范围 | 目标 |
|---|---|---|
| P0 | 311 洛阳陷落、316 西晋亡、317 东晋建康、383 淝水、420 刘裕建宋、439 北魏统一、493 迁洛、523 六镇、534 北魏分裂、548 侯景之乱、557 北周/陈、577 北周灭齐、581 建隋、589 灭陈 | 保证主线 major 事件都有可引用原文。 |
| P1 | 347 桓温灭成汉、354/369 桓温北伐、376 前秦统一北方、395 参合陂、398 平城、409/417 刘裕北伐、479 南齐、502 梁、528 河阴、537 沙苑、546 玉璧、552 侯景平定、553 益州、554 江陵、580 杨坚辅政、588 伐陈 | 补齐第一轮 core expansion 的 locator-only 事件。 |
| P2 | 人物生平节点、政权内部继承、地图控制证据、地理定位 | 提升人物页、地图页和证据图谱密度。 |
| P3 | 《南史》《北史》补充材料和现代研究说明 | 处理互证、争议和地名比定，不抢主证据位置。 |

## 与 190-310 模板期一致的验收标准

310-589 暂不要求立即达到 190-310 的数据量级，但成熟结构必须一致：

- 有正式来源标准文档，并能说明每类 source 的使用边界。
- 事件、人物、证据、搜索文档、证据断言都进入 SQLite/API。
- 每条 major 事件至少有一条 `source_mentions` 和一条 `evidence_links`。
- 关键事件要逐步做到正史证据加《资治通鉴》校年证据双挂。
- 覆盖度页应能显示事件数、证据数、原文摘录缺口和模板期对照。
- RAG 默认优先召回 SQLite 证据；没有原文摘录时必须说明证据仍处 locator-level。
- 不把 `demos/`、DeepSeek 原始长输出、本地下载 PDF/扫描件/参考资料原件、未审校草稿纳入正式 seed。
- 交付前至少运行 `npm run build` 和 `npm run validate:db`；若改动 SQLite 数据，必须再运行 `npm run db:seed:export`。

后续可仿照 190-310 增加专门审计脚本，例如 `audit:period-310-589`，检查：

- major 事件是否都有事件证据链接。
- `source_mentions.raw_json.originalTextStatus` 是否齐全。
- locator-only 证据是否没有误填 `quote`。
- 已验证摘录是否同步进入 `search_documents`。
- 正史和《资治通鉴》的证据比例是否符合本标准。

## 当前 310-589 状态

截至本标准建立时，310-589 中国段已完成第一轮扩展：

- 已有 `scripts/seed-china-wei-jin-northern-southern-310-589.mjs` 建立基础时期、来源、人物、事件和 locator-level 证据。
- 已有 `scripts/seed-china-310-589-core-expansion.mjs` 扩展核心事件、人物和证据断言。
- 已有若干原文摘录补丁脚本，包括 310-420、439-589、550-557 和 locator originals batch。
- 当前数据库中 310-589 source mention 约 70 条，其中 23 条为 `verified-transcribed`，47 条仍是 `locator-only` 或 `not-yet-transcribed`。
- 主要缺口不是事件骨架，而是 locator-level 证据升级为真实古籍原文摘录。
- 证据断言已经形成初步事件链，但 locator-only 支撑的断言仍不应升为高置信度。

下一步应优先：

1. 按 P0/P1 清单补齐 47 条未摘原文证据。
2. 为 310-589 写只读审计脚本，检查 originalTextStatus、quote 误用和 major 事件证据覆盖。
3. 将覆盖度页中的 310-589 摘录缺口、证据断言和模板期对照做成稳定验收摘要。
