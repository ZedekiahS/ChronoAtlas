# Data Model

## Event

历史事件是最核心的数据单元。每条事件都应该尽量结构化，方便时间轴、地图、搜索和 AI 导览共同使用。

```json
{
  "id": "china-220-cao-pi-founds-wei",
  "title": "曹丕称帝，曹魏建立",
  "startYear": 220,
  "endYear": 220,
  "region": "china",
  "locationName": "洛阳",
  "coordinates": [112.45, 34.62],
  "category": "politics",
  "summary": "曹丕接受汉献帝禅让，建立魏国，东汉正式结束。",
  "people": ["曹丕", "汉献帝"],
  "polities": ["曹魏", "东汉"],
  "relatedEvents": ["china-184-yellow-turban-rebellion"],
  "tags": ["三国", "东汉灭亡", "王朝更替"],
  "confidence": "high",
  "sources": []
}
```

## Required Fields

- `id`: 稳定唯一标识。
- `title`: 事件标题。
- `startYear`: 开始年份。
- `endYear`: 结束年份。单年事件与 `startYear` 相同。
- `region`: 主区域。
- `category`: 事件类型。
- `summary`: 面向普通用户的简短解释。
- `sources`: 来源列表，MVP 可以为空，但正式内容必须补齐。

## Optional Fields

- `locationName`
- `coordinates`
- `people`
- `polities`
- `relatedEvents`
- `tags`
- `confidence`
- `notes`

## Source

```json
{
  "title": "The Cambridge Ancient History, Volume XII",
  "author": "Alan K. Bowman et al.",
  "url": "",
  "type": "book",
  "note": "Used for Roman third-century chronology."
}
```

## AI Boundary

AI 可以基于这些字段生成解释、比较和导览，但不能把无来源内容自动写回正式事件库。任何 AI 生成的新事实都应进入待审核队列。

## Historical Region

历史区域描述某个时间段内的政治、军事或文化范围。第一版使用近似 polygon 做产品原型，不代表精确学术边界；正式版本需要补充来源并区分名义边界、实控区域和文化影响区。

```json
{
  "id": "china",
  "label": "中国",
  "accent": "#b94f32",
  "eras": [
    {
      "startYear": 220,
      "endYear": 263,
      "title": "三国形成",
      "summary": "魏蜀吴格局确立，政权竞争、边境战争和制度重建同时展开。",
      "boundaryType": "effective-control",
      "confidence": "low",
      "boundary": [
        [100, 21],
        [108, 40],
        [123, 40],
        [125, 30],
        [120, 22],
        [110, 18],
        [100, 21]
      ],
      "boundaryGroups": [
        {
          "id": "cao-wei-220",
          "label": "曹魏",
          "boundaryType": "effective-control",
          "confidence": "low",
          "boundary": [
            [103, 32],
            [110, 41],
            [123, 40],
            [123, 31],
            [116, 28],
            [108, 29],
            [103, 32]
          ]
        }
      ],
      "sources": []
    }
  ]
}
```

`boundaryGroups` 用于一个时代包含多个实际片段的情况，比如罗马的欧洲行省、北非行省、东方行省，或三国阶段的曹魏、蜀汉、孙吴。渲染层优先使用 `boundaryGroups`；没有该字段时退回使用 `boundary`。

## Boundary Types

- `effective-control`: 实控区域，表示政权或军事力量大致控制范围。
- `nominal`: 名义边界，表示宣称、法统或制度名义上的范围。
- `cultural-influence`: 文化影响区，表示语言、宗教、贸易或文化传播范围。

边界类型可以在地图上用不同视觉样式表达，比如实控区域用实线填充，名义边界用虚线，文化影响区用更淡的半透明外层。
