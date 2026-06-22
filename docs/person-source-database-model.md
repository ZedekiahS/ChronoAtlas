# ChronoAtlas 人物与史料资料库模型

本文档定义 ChronoAtlas 的人物资料库底座。目标是让中国三国区域最终覆盖《三国志》《后汉书》《资治通鉴》等正规史料中出现的人物，并在人物页展示“史料可证明的一生”：生卒、仕历、战事、政治转折、关系网络、参与事件和原文依据。罗马、萨珊、印度等区域后续应复用同一套模型，只替换史料体系和地名、人名规范。

## 判断

当前阶段不急着引入 PostgreSQL 或后端服务。ChronoAtlas 仍是前端原型，结构化 JSON 更适合版本控制、人工审校和快速迭代。

但从现在开始，JSON 必须按数据库表来设计。也就是说：

- 数据文件是临时存储形式。
- 字段设计要接近未来数据库表。
- 每条人物事迹必须能追溯到具体史料、篇章、段落或原文摘录。
- 后续迁移到 SQLite/PostgreSQL 时，不应重写内容模型。

推荐路线：

1. 第一阶段：继续使用 JSON 文件，完善 schema 和校验脚本。
2. 第二阶段：当人物和原文摘录规模明显变大时，引入本地 SQLite 作为构建期数据库。
3. 第三阶段：如果需要多人编辑、审核流、在线搜索和 AI 检索，再迁移到 PostgreSQL 或搜索索引。

## 核心原则

### 史料优先

人物页不是百科摘要，而是“从史料记录中抽出的可验证人生档案”。每个生平节点都必须有来源。

允许展示现代整理摘要，但摘要必须挂在原始来源之后，不能反过来让摘要替代来源。

### 完整一生的含义

“完整一生”不是每一年都必须有明确事件。很多人物没有生年、卒年，甚至只有一两句附见。

ChronoAtlas 中的完整一生应解释为：

- 已收录史料中能确认的全部关键记载。
- 缺年、缺地点、缺过程时显式标记。
- 没有史料的年份显示“史料未详”，不能编造。
- 对推断出的阶段，用 `inferred` 或 `approximate` 标记。

### 原文与解释分离

同一个人物节点应同时保留：

- `quote`：原文摘录或关键句。
- `summary`：现代中文解释。
- `interpretation`：项目自己的理解或归纳。
- `confidence`：可信度。
- `notes`：争议和不确定性。

原文摘录应短而关键，页面上先展示摘录，再跳转到外部全文。

### 人物、事件、关系分离

一个历史事实可能同时属于：

- 某个人的生平节点。
- 某个区域或世界年表事件。
- 两个人之间的关系变化。
- 某个政权控制变化。

这些不能只写一份纯文本。应拆成独立实体，再用 id 相互关联。

## 当前文件与未来表

当前 JSON 文件可以映射到未来数据库表：

| 当前文件 | 未来表 | 用途 |
| --- | --- | --- |
| `data/china-persons.json` | `persons` | 人物基础档案 |
| `data/china-person-life-events.json` | `person_life_events` | 人物生平节点 |
| `data/china-person-relations.json` | `person_relations` | 人物关系 |
| `data/china-sources.json` | `sources` | 史料来源 |
| `data/events-180-280.sample.json` | `historical_events` | 历史事件 |
| 待新增 `data/china-source-mentions.json` | `source_mentions` | 原文段落与人物提及 |
| 待新增 `data/china-person-aliases.json` | `person_aliases` | 名、字、谥号、官称、异名 |
| 待新增 `data/china-coverage-status.json` | `coverage_status` | 人物覆盖和审校状态 |

## 表设计

### sources

记录史料或现代参考资料。正式人物资料应优先使用正史、编年史和裴注材料。

```json
{
  "id": "sanguozhi-wei-wudi",
  "title": "三国志·魏书·武帝纪",
  "author": "陈寿",
  "type": "official-history",
  "citationShort": "《三国志·魏书·武帝纪》",
  "url": "https://ctext.org/text.pl?if=gb&node=601875&remap=gb",
  "language": "zh-Hans",
  "corpus": "china-three-kingdoms",
  "note": "曹操本纪，是建安时期曹操军政活动的核心纪年材料。"
}
```

字段说明：

- `id`：稳定来源 id。
- `type`：`official-history`、`chronicle`、`commentary`、`modern-study`、`inscription` 等。
- `corpus`：史料体系，例如 `china-three-kingdoms`、`rome-imperial`。
- `url`：优先使用简体中文全文页面；避免维基文库作为主来源。

### source_mentions

这是后续最重要的新表。它不直接等于人物生平，而是“原文中出现了某个人或某件事”的证据层。

```json
{
  "id": "mention-sgz-wei-wudi-200-guandu-001",
  "sourceId": "sanguozhi-wei-wudi",
  "workTitle": "三国志",
  "bookTitle": "魏书",
  "chapterTitle": "武帝纪",
  "locator": "建安五年",
  "year": 200,
  "text": "袁绍运谷车数千乘至，公用荀攸计...",
  "translation": null,
  "mentionedPersonIds": ["cao-cao", "yuan-shao", "xun-you"],
  "mentionedEventIds": ["china-200-guandu"],
  "mentionedPlaceIds": ["guandu"],
  "tags": ["官渡", "粮道", "谋略"],
  "confidence": "high",
  "reviewStatus": "reviewed"
}
```

用途：

- 人物页可列出“史料原文提及”。
- AI 只能基于 `source_mentions` 辅助总结，不能凭空生成事实。
- 同一段原文可支持多个生平节点、事件节点和关系节点。

### persons

人物基础档案只放稳定信息，不塞完整经历。

```json
{
  "id": "cao-cao",
  "name": "曹操",
  "courtesyName": "孟德",
  "otherNames": ["魏武帝", "曹孟德"],
  "life": "155-220",
  "birthYear": 155,
  "deathYear": 220,
  "lifeConfidence": "high",
  "primaryPolity": "曹操集团 / 曹魏",
  "roles": ["政治家", "军事统帅", "魏王"],
  "summary": "从讨董、兖州危机中起势...",
  "sourceRefs": [
    { "sourceId": "sanguozhi-wei-wudi", "locator": "武帝纪" }
  ],
  "coverageStatus": "partial"
}
```

字段补充：

- `birthYear`、`deathYear` 可以为 `null`。
- `life` 是展示字段，不能替代结构化年份。
- `coverageStatus` 见下方覆盖状态。

### person_aliases

三国人物经常以名、字、官职、爵位、谥号、称号出现。必须单独建别名表，否则原文提及难以归一。

```json
{
  "id": "alias-cao-cao-mengde",
  "personId": "cao-cao",
  "value": "孟德",
  "type": "courtesy-name",
  "sourceRefs": [
    { "sourceId": "sanguozhi-wei-wudi", "locator": "武帝纪" }
  ]
}
```

常见 `type`：

- `name`
- `courtesy-name`
- `posthumous-title`
- `temple-name`
- `office-title`
- `noble-title`
- `clan-name`
- `foreign-language-name`

罗马人物可使用同一表记录拉丁名、希腊名、皇帝称号、后世通称。

### person_life_events

人物页的主时间线来自此表。每条记录都必须能指回 `source_mentions` 或 `sourceRefs`。

```json
{
  "id": "cao-cao-200-guandu",
  "personId": "cao-cao",
  "year": 200,
  "endYear": 200,
  "displayYear": "200",
  "type": "campaign",
  "title": "官渡击败袁绍",
  "summary": "曹操在官渡战胜袁绍，北方统一方向基本确定。",
  "relatedEventIds": ["china-200-guandu"],
  "sourceMentionIds": ["mention-sgz-wei-wudi-200-guandu-001"],
  "sourceRefs": [
    {
      "sourceId": "sanguozhi-wei-wudi",
      "locator": "建安五年",
      "quote": "袁绍运谷车数千乘至..."
    }
  ],
  "confidence": "high",
  "approximate": false
}
```

`type` 可扩展：

- `birth`
- `death`
- `office`
- `campaign`
- `politics`
- `diplomacy`
- `service`
- `strategy`
- `turning-point`
- `exile`
- `appointment`
- `accession`
- `abdication`
- `later-tradition`

规则：

- 年份不详：`year: null`，`displayYear: "年代不详"`。
- 年份范围：`year` + `endYear`。
- 推断年份：设置 `approximate: true`，并在 `notes` 说明依据。
- 后世演义或传统说法：`type: "later-tradition"`，不能混入正史事实。

### historical_events

历史事件用于世界年表、区域对照和地图，不等于人物生平。一个人物生平节点可以关联多个历史事件，一个历史事件也可以关联很多人物。

```json
{
  "id": "china-200-guandu",
  "title": "官渡之战",
  "startYear": 200,
  "endYear": 200,
  "region": "china",
  "category": "war",
  "people": ["曹操", "袁绍"],
  "personIds": ["cao-cao", "yuan-shao"],
  "sourceMentionIds": ["mention-sgz-wei-wudi-200-guandu-001"],
  "confidence": "high"
}
```

主页面只显示大型事件和用户打开的中型事件；人物页面显示该人物完整生平。

### person_relations

关系图不应只做静态“朋友/敌人”。关系有时间范围和来源。

```json
{
  "id": "cao-cao-liu-bei-rivalry",
  "sourcePersonId": "cao-cao",
  "targetPersonId": "liu-bei",
  "type": "rival",
  "startYear": 198,
  "endYear": 220,
  "summary": "刘备曾与曹操协力攻吕布，也曾短暂依附曹操；此后长期对抗。",
  "relatedEventIds": ["china-199-lu-bu-defeated", "china-208-red-cliffs"],
  "sourceMentionIds": [],
  "sourceRefs": [
    { "sourceId": "sanguozhi-shu-xianzhu", "locator": "先主传徐州、荆州相关记载" }
  ],
  "confidence": "high"
}
```

常见关系：

- `family`
- `lord-vassal`
- `advisor`
- `ally`
- `rival`
- `enemy`
- `patron`
- `recommended`
- `betrayed`
- `killed`
- `captured`
- `surrendered-to`

### coverage_status

覆盖状态用于管理“我们是否已经把这个人的正史材料读完”。

```json
{
  "personId": "cao-cao",
  "corpus": "china-three-kingdoms",
  "status": "partial",
  "coveredSources": [
    { "sourceId": "sanguozhi-wei-wudi", "status": "reviewed" },
    { "sourceId": "zizhi-tongjian-63", "status": "partial" }
  ],
  "missingSources": [
    "裴松之注相关材料",
    "后汉书相关交叉记载"
  ],
  "lastReviewedAt": "2026-06-22",
  "notes": "已覆盖主传和官渡节点，尚未系统整理裴注。"
}
```

`status`：

- `stub`：只有基础档案。
- `partial`：已有若干生平节点，但未系统读完主传。
- `source-reviewed`：主传或核心来源已通读并拆分。
- `cross-checked`：已和《资治通鉴》等编年材料互校。
- `complete-for-now`：当前阶段可视为完整，后续只做修订。

## 人物页渲染

人物页应按以下结构展示：

1. 人物基础档案：姓名、字、时代、势力、角色、生卒。
2. 覆盖状态：是否已读完主传、是否已和《资治通鉴》互校。
3. 生平年表：按年份或阶段展示 `person_life_events`。
4. 原文依据：每个节点可展开“原文摘录/引用段落”。
5. 史料提及：列出 `source_mentions`，可按来源筛选。
6. 关系图：来自 `person_relations`。
7. 参与事件：来自 `relatedEventIds` 和 `historical_events.personIds`。
8. 不确定性：生年不详、卒年不详、年代争议、后世传统。

空年份的处理：

- 人物页可以展示从出生到死亡的逐年行。
- 没有明确记载的年份显示“史料未详”。
- 如果前一个阶段仍在延续，可以显示“延续上一阶段”，但必须标记为推断。

## 数据录入流程

### 1. 建立来源目录

先收录来源，不急着抽事件。

三国第一批来源：

- 《三国志》魏书、蜀书、吴书各传。
- 裴松之注中可明确区分来源的材料。
- 《后汉书》相关纪、传。
- 《资治通鉴》卷五十八至卷八十一。

### 2. 切分原文段落

把来源按篇章、年份、段落切成 `source_mentions`。每段保留：

- 原文。
- 来源。
- 篇章位置。
- 涉及人物。
- 涉及年份。
- 涉及事件。

### 3. 归一人物

把原文中的名、字、官职称谓映射到 `personId`。

例：

- “太祖” -> `cao-cao`，但只在《魏书·武帝纪》上下文中成立。
- “先主” -> `liu-bei`，但只在《蜀书·先主传》上下文中成立。
- “吴主” -> 通常是 `sun-quan`，但不同上下文要核验。

### 4. 抽取生平节点

从 `source_mentions` 抽取 `person_life_events`。一个段落可以生成多个生平节点，但每个节点必须引用原段落。

### 5. 建立关系和事件链接

从同一段原文中补：

- 人物关系。
- 历史事件。
- 政权变化。
- 地点和地图锚点。

### 6. 审校

每条记录必须有 `reviewStatus` 或 `coverageStatus`。AI 可以辅助初稿，但不能直接把未审结果标成完成。

## 校验规则

后续 `npm run validate:data` 应逐步增加这些检查：

- 所有 `person_life_events.personId` 必须存在。
- 所有 `sourceRefs.sourceId` 必须存在。
- 有 `quote` 的记录必须有 `locator`。
- `sourceMentionIds` 必须指向已存在 `source_mentions`。
- `birthYear` 不应晚于 `deathYear`。
- `person_life_events.year` 不应超出人物生卒范围，除非标记 `approximate` 或 `later-tradition`。
- `coverage_status.personId` 必须存在。
- `reviewStatus: reviewed` 的节点必须至少有一个原文或明确来源定位。

## AI 使用边界

AI 可以做：

- 从原文中建议人物、事件、关系初稿。
- 根据已有结构生成摘要。
- 帮助发现互相矛盾的年份、人物名和关系。

AI 不可以做：

- 在没有来源的情况下补事实。
- 把演义内容当成正史内容。
- 把推断内容写成确定事实。
- 把现代百科摘要当作原始出处。

所有 AI 生成内容默认 `reviewStatus: draft`。

## 罗马扩展

罗马人物资料库复用同一模型，只改变来源和命名规范。

可能来源：

- Cassius Dio
- Herodian
- Historia Augusta
- inscriptions / papyri
- modern prosopography

罗马需要特别处理：

- 拉丁名、希腊名、称号、皇帝名号。
- 同名人物和收养名。
- 执政官年份、军团职位、行省总督任期。
- 史料可信度差异，例如 Historia Augusta 的可疑材料。

因此 `source_mentions` 和 `person_aliases` 不能设计成只适配中文正史。

## 第一批实施建议

下一步可以新增：

- `data/china-source-mentions.json`
- `data/china-person-aliases.json`
- `data/china-coverage-status.json`

第一批样例人物建议：

- 曹操
- 刘备
- 孙权
- 诸葛亮
- 袁绍
- 吕布
- 陶谦
- 士燮

目标不是一次补全所有人，而是先跑通“来源段落 -> 人物提及 -> 生平节点 -> 人物页展示”的链路。等链路稳定，再批量扩展到《三国志》所有人物。
