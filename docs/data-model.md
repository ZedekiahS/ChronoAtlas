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
