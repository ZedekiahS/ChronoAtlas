# ChronoAtlas 中国区块地图模型

上层实施方案见 `docs/china-historical-block-map-plan.md`。本文档保留为区块地图的数据模型说明；后续中国地图重构应以“固定历史区块底图 + 势力控制时间线”为准，不再继续手绘随机 polygon 或漂浮势力色块。

本文档定义中国区域页第一版“三国区块地图”模型。目标是接近策略游戏里的 province/block map，而不是精确 GIS 边界图。第一版区块形状允许简化、允许近似，但必须是共享边界的行政区块拼图，不是漂浮在地图上的势力色块。

## Block Layer

`block layer` 是中国区域页的地图基础层，文件为 `data/china-admin-blocks-190-280.json`。

- 州级区块：冀州、幽州、并州、青州、兖州、豫州、徐州、司隶、雍州、凉州、荆州、扬州、益州、交州等。
- 重点郡/国区块：第一版先单独拆出汉中、淮南、辽东这类需要独立变色的区域。
- 重点县治：洛阳、长安、成都、武昌、建业、襄阳、汉中等先作为点标注和信息锚点，不做村级或全县铺满。

区块之间需要尽量共享边界，形成行政拼图。校验脚本会检查：

- 每个区块至少有一条与其他区块共享的边。
- 采样点不能同时落入多个区块，避免大面积重叠。

每个区块包含：

- `id`：稳定机器 id。
- `name`：显示名称。
- `level`：`province`、`commandery`，后续可扩展 `county-seat`。
- `parent`：所属上级区块；没有则为 `null`。
- `center`：标签和 hover 锚点，格式为 `[lon, lat]`。
- `geometry`：简化 GeoJSON Polygon。
- `confidence`：区块几何可信度，取值 `high`、`medium`、`low`。
- `approximate`：第一版区块默认为 `true`，明确表示不是精确边界。
- `sources`：用于塑形和判断的大致来源说明。

## Control Timeline

`control timeline` 记录每个区块在不同年份由哪个势力控制，文件为 `data/china-block-control-timeline-190-280.json`。UI 根据当前时间线年份查找生效记录，并用控制者颜色给区块上色。

每条记录包含：

- `blockId`：对应区块。
- `startYear` / `endYear`：闭区间年份。
- `controller`：当前显示的控制者或势力。
- `status`：控制状态。
- `confidence`：控制权判断可信度。
- `sources`：该时间段判断依据。

第一版至少覆盖这些关键年份：`190`、`195`、`200`、`208`、`220`、`229`、`234`、`263`、`265`、`280`。数据以区间存储，所以 190-280 之间任意年份都应该能渲染。

## Status

`status` 用来区分“控制质量”，避免把所有颜色都误读成精确国界。

- `effective-control`：实际控制区。
- `contested`：争夺区，用斜线或半透明特殊样式显示。
- `frontier`：边缘控制区，控制力较薄或主要依赖军事/地方势力。
- `nominal-control`：名义控制，行政或朝贡/归附关系强于直接实控。

页面文案应使用“控制区块”“势力范围近似”这类表达，不要写成“精确国界”或“准确边境”。

## Uncertainty

第一版需要显式承认不确定性：

- `confidence` 表示控制权或几何判断的可信度。
- `approximate` 表示几何只是简化区块，不代表精确史实边线。

低可信度、边缘区和名义控制区应在视觉上比实际控制区更轻、更条件化。

## Color System

控制者颜色写在 `data/china-block-control-timeline-190-280.json` 的 `controllers` 中，保证数据和 UI 同步。

第一版至少包含这些势力颜色：

- 袁绍、袁术、曹操、刘表、吕布、公孙瓒、张鲁、刘璋、曹魏、蜀汉、孙吴、西晋。
- 陶谦、关中军阀、马腾韩遂、辽东公孙氏、士燮等地方势力可以作为补充控制者存在。

颜色只表达当前控制者；`status` 与 `confidence` 是另外的视觉通道。
