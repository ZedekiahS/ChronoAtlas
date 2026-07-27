# ChronoAtlas Codex Luna 语义复跑提示词 v2

用途：发送给打开 `C:\Users\shex\Documents\历史年表` 工作区的 Luna 任务。输入已经由高阶任务准备完成，本任务只做逐条语义抽取。

## Task prompt

```text
继续 ChronoAtlas 的“两汉之际”正史抽取试验。本轮是语义复跑，不是编码任务。

工作区：
C:\Users\shex\Documents\历史年表

抽取规范：
docs/official-history-luna-extraction-prompt-v1.md

已经准备好的唯一输入：
data/import-drafts/luna/xin-transition--8-24-pilot-input.jsonl

输入清单：
data/import-drafts/luna/xin-transition--8-24-pilot-input-summary.json

你必须直接读取 input JSONL 中的40条 target_text，逐条进行语义判断并生成输出。不要等待用户提供 target_text。

本轮禁止事项：
- 禁止修改 scripts/export-luna-official-history-pilot.mjs。
- 禁止修改任何 scripts/lib、db、src、docs 或 package.json 文件。
- 禁止编写 JavaScript、Python、PowerShell、正则或模板程序来推导 title、people、places、role、recommendation 或 summary。
- 禁止使用“第一个人物 + 第一个动词 + 第一个地点”等机械拼接。
- 禁止调用外部 API，也不要索取 API key。
- 禁止写入 SQLite、events、entities、search_documents 或种子文件。
- 禁止把 selection.bucket 当成正确答案；它只是分层抽样标签，你必须独立判断。

允许使用命令的范围：
- 分批读取 input JSONL。
- 检查 JSON 行数和语法。
- 运行已经存在的 scripts/validate-luna-official-history-pilot.mjs。
- 不得通过命令生成语义字段。

语义要求：
1. 严格按照 docs/official-history-luna-extraction-prompt-v1.md 的输出结构。
2. 一条 target_text 可以拆成多个 event，也可以完全没有 event。
3. 事件标题必须由原文语义决定，不能按词序拼接。
4. 必须辨别行动者、对象、受害者、受封者和次级人物，不能把地点、官职、军队、群体或“某等七人”当成个人。
   只要保留 event，证据中明确参与该事件的具名人物都必须写入 people，不能因为 recommendation 是 candidate_only 就省略。
5. known_person_id 和 known_place_id 只能从该条输入提供的候选中选择；候选不符合语境时必须保持 null。
   标题如果采用 known_people 的 canonical_name 补全简称，该人物必须同时出现在 people 并绑定该 ID。
6. 定陶王、中山王等王号中的定陶、中山不能自动当事件地点。
   证据中真正与事件有关的明确地点必须写入 places；唯一匹配的 known_place_id 不得无故留空。
7. context_before 和 context_after 只用于紧邻指代。依赖上下文解析时必须添加 cross_context_resolution。
8. evidence_quote 必须是 target_text 的逐字连续子串。
9. resolved_year 只能取 chronology_candidates 中的 year。没有候选时必须为 null。
10. 只有 high 纪年、完整标题、明确主体对象、来源类型允许且没有 blocking flag 时，才能推荐 eligible。
11. medium 纪年即使事件明确，也只能 candidate_only。
12. 普通履历、人物简介、议论、注文、校勘、泛泛背景和不构成独立事件的片段应无 events，并给出 rejection_reasons。
13. 不要为了凑满事件数量而保留弱事件；准确率优先于召回率。
14. 同一句若有不同参与者攻击不同目标，例如“甲攻A，乙、丙攻B”，必须拆成不同 event，并分别使用对应的连续证据子句。

输出文件：
data/import-drafts/luna/xin-transition--8-24-pilot-output.jsonl

输出必须正好40行，每行对应一条输入，task_id 完全一致且顺序一致。只写 JSON 对象，不写 Markdown 围栏或解释文字。

汇总文件：
data/import-drafts/luna/xin-transition--8-24-pilot-summary.json

汇总至少包含：
- input_count
- output_count
- event_count
- recommendations: eligible、candidate_only、reject、no_event
- people_candidate_count
- secondary_people_count
- place_mention_count
- blocking_flag_counts
- source_counts

完成后运行：
node --no-warnings scripts/validate-luna-official-history-pilot.mjs

如果校验失败，只能逐条修正 output JSONL 中对应的语义结果，不得修改校验器来绕过失败。直到校验退出码为0。

最终只报告：
- 校验是否通过
- 四类 recommendation 数量
- 人物、次级人物、地点数量
- 5条最难样本及你的处理理由
- 仍需 Terra 或人工复核的问题

不要再次实现抽取器。现在直接读取40条输入并完成语义输出。
```
