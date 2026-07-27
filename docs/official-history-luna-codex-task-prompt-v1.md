# ChronoAtlas Codex Luna 执行任务提示词 v1

> 此版本已完成首次失败试验并停止使用。它允许任务自行实现导出器，导致 Luna 用简化正则伪造了模型输出。修复后的输入层与语义复跑任务见 [Codex Luna 语义复跑提示词 v2](./official-history-luna-semantic-pass-task-v2.md)。

用途：直接发送给已经打开 `C:\Users\shex\Documents\历史年表` 工作区的 Codex Luna 任务。该任务提示词会让 Luna 自行从 SQLite 取得原文，不需要用户手工提供 `target_text`。

## Task prompt

```text
继续执行 ChronoAtlas 正史候选抽取任务。你是当前仓库中的执行代理，不是等待单条 JSON 的被动 API 工作器。

工作区：
C:\Users\shex\Documents\历史年表

不要等待我手工提供 target_text。请自行从 db/chronoatlas.sqlite 的 sources 和 source_passages 读取原文，并为每条试验记录构造 target_text、相邻上下文、来源元数据和已有实体候选。

抽取规范：
docs/official-history-luna-extraction-prompt-v1.md

先阅读以下代码和数据库结构，遵循现有风格，不要凭空另造一套正式数据模型：
- scripts/lib/rule-based-source-candidate-extractor.mjs
- scripts/lib/china-official-history-promotion-policy.mjs
- scripts/lib/china-official-history-reference-resolver.mjs
- scripts/lib/china-regnal-sequence-resolver.mjs
- scripts/lib/china-official-history-promotion-profiles.mjs
- db/migrations/006-import-staging-and-indexes.mjs
- db/migrations/016-import-event-clusters.mjs

本轮目标：
为“西汉末至新莽更始，前8年至公元24年”制作第一批 40 条 Luna 试验抽取结果，用来评估事件拆分、标题、次级人物和地点提及质量。本轮只生成本地候选文件，不写正式 events，不修改现有 SQLite 数据。

优先来源范围：
- hanshu-guoxue123-011：成帝纪
- hanshu-guoxue123-012：哀帝纪
- hanshu-guoxue123-013：平帝纪
- hanshu-guoxue123-115：元后传
- hanshu-guoxue123-116：王莽传上
- hanshu-guoxue123-117：王莽传中
- hanshu-guoxue123-118：王莽传下
- houhanshu-guoxue123-001：光武帝纪上，仅用于检索23至24年的前置叙事
- houhanshu-guoxue123-013：刘玄刘盆子列传，仅用于检索23至24年的前置叙事

重要边界：
- source_passages.year_start/year_end 可能只是整卷宽泛范围，绝不能直接当作事件年份。
- 《后汉书》部分卷的数据库范围从25年开始，但正文可能回叙23至24年。只能依据明确纪年或可靠连续纪年判断。
- 公元前年使用负整数，不存在公元0年。
- 表、志、注文、校勘、评论和普通仕宦履历不得作为 eligible 事件。
- 不得利用外部历史常识补全 target_text 没有表达的人物、地点、对象或结果。

执行步骤：
1. 只读检查上述来源和 passage 数据，确认字段、文本编码和顺序。
2. 使用现有 quote-aware splitSourceSentences 逻辑切分正文；不得破坏引文边界。
3. 按稳定顺序选择 40 条试验输入：30 条含事件信号的正文，10 条可能是注文、评论、普通履历或正文碎片的负例。避免只挑容易的军事句。
4. 为每条输入生成符合抽取规范 User input template 的对象。context_before 和 context_after 只提供紧邻文本。
5. 你本身就是本轮抽取模型。逐条按照抽取规范生成严格输出，不要再次调用 OpenAI API，不要索取 API key。
6. 输出中必须覆盖事件、次级人物和地点。known_person_id、known_place_id 只能绑定数据库中已有且唯一可行的实体，否则保持 null。
7. 每条 evidence_quote 必须是对应 target_text 的逐字连续子串。resolved_year 必须来自该条 chronology_candidates，否则为 null。
8. 所有结果都只是候选。即使 recommendation 为 eligible，也不得改为人工 approved。

本地输出文件：
- data/import-drafts/luna/xin-transition--8-24-pilot-input.jsonl
- data/import-drafts/luna/xin-transition--8-24-pilot-output.jsonl
- data/import-drafts/luna/xin-transition--8-24-pilot-summary.json

data/import-drafts 已被 .gitignore 忽略。不要把原始长输出写入 docs、scripts/data、db/seeds 或其他需要提交的位置。

如果需要一个可复用的只读导出器，可以新增：
scripts/export-luna-official-history-pilot.mjs

该导出器只能读取 SQLite 和写入 data/import-drafts/luna，不得写数据库。不要修改晋级脚本、API、前端或无关文件。

完成前验证：
- 三个输出文件均存在。
- input 和 output JSONL 均为 40 行且逐行可 JSON.parse。
- task_id 一一对应且没有重复。
- 每个非空 evidence_quote 都能在对应 target_text 中找到。
- 每个非空 resolved_year 都存在于对应 chronology_candidates。
- 汇总 eligible、candidate_only、reject、人物候选、次级人物、地点提及和各类 blocking flags 数量。

本轮不运行 db:seed:export、validate:db 或前端 build，因为禁止修改数据库和前端。如果你实际修改了超出只读导出器和 ignored 输出文件的内容，必须明确报告。

不要因为没有附件中的 target_text 而停下，也不要再次向用户索取单条 JSON。先从工作区完成 40 条试验批次，再报告结果、10条代表性样本和发现的系统性问题。
```
