# ChronoAtlas 中国历史区块地图实施方案

本文档定义中国区域页接下来要做的地图方向：固定历史区块底图 + 势力控制时间线。目标接近 Europa Universalis 的 province map 思路，但第一版不追求细到县级，也不追求精确 GIS 边界。

核心原则：

- 区块是地图本身，不是覆盖在地图上的势力色块。
- 同一批区块在不同地图模式下改变颜色和信息，不更换几何。
- 第一阶段只做势力范围图，即 `political / control map`。
- 不再继续手绘随机 polygon，不再做漂浮色块，不使用现代省市边界替代三国州郡。

## 参考地图来源

第一版按“中文历史地图和历史地理资料优先”的顺序采用参考来源。图片只作为底图和区块划分依据，不直接切成静态图片资产，不直接复制第三方图像到项目中。

### 1. 《中国历史地图集》第三册：三国、西晋图组

主参考。用于确定州郡结构、三国末年政区形态、边区族群和州郡治所大致位置。

需要重点参考：

- 三国时期全图
- 魏：司州、兖州、豫州、扬州、青州、徐州、冀州、并州、幽州、雍州、凉州、荆州、西域长史府
- 蜀汉：益州北部、益州南部
- 孙吴：扬州、荆州、交州
- 三国时期鲜卑等部

在线预览可用于快速定位图幅目录，正式建模时仍以谭图体系为主。参考链接：

- https://www.dituji.com/lsdt/zglsdtj/sanguo/
- https://www.guoxue123.com/other/map/zgmap/005.htm

### 2. CHGIS 中国历史地理信息系统

用于校对历史地名、行政建置、治所、时间序列和 GIS 数据结构。CHGIS 的价值不是直接拿来当三国势力图，而是帮助我们建立可追溯的数据模型。

参考链接：

- 复旦 CHGIS 数据说明：https://yugong.fudan.edu.cn/CHGIS/sjsm.htm
- Harvard CHGIS：https://chgis.fas.harvard.edu/
- Harvard CGA CHGIS：https://gis.harvard.edu/china-historical-gis

### 3. 《中国行政区划通史：三国两晋南朝卷》

用于校对州、郡、县隶属关系，以及三国到西晋之间的建置变化。它更适合做文字和表格依据，不作为矢量边界来源。

用途：

- 判断某郡在关键年份属于哪个州或政权。
- 记录州郡废置、改隶、拆分、侨置等变化。
- 给低可信度区块补充说明。

### 4. 正史和编年资料

用于判断控制权变化，尤其是关键年份。

- 《三国志》各帝纪、诸传
- 《后汉书·郡国志》
- 《晋书·地理志》
- 《资治通鉴》建安至太康相关卷
- 清人地理考证类资料可作为补充，但不应盖过现代历史地理成果

### 5. 辅助地图站点

观沧海、地图集站点、国学导航等可以用于快速比对图面和图幅索引。若页面标注“根据谭其骧《中国历史地图集》第三册制作”，可作为视觉辅助，但不作为项目唯一依据。

## 第一版区块划分

第一版先做州级为主、关键区域细到郡级的拼图区块。目标不是“真实国界”，而是形成可点击、可换色、相邻关系清晰的历史行政区块地图。

### 粒度规则

- 州级区块：用于大范围行政区和低争夺区域。
- 重点郡级区块：用于战争频繁、控制权变化明显、三国格局关键区域。
- 边缘族群和边疆区：用 `frontier` 区块，不强行画成中原式州郡。
- 暂不做县级铺满，只保留治所点或后续信息锚点。

### 建议区块清单

北方和中原：

| id | 名称 | 级别 | 说明 |
| --- | --- | --- | --- |
| sili | 司州 | province | 洛阳、关中东缘和中原政治核心，后续可拆河南尹、河内、弘农 |
| ji-zhou | 冀州 | province | 袁绍和曹操争夺核心，第一版可州级，后续拆魏郡、邺、渤海 |
| you-zhou | 幽州 | province | 公孙瓒、袁绍、曹魏东北门户 |
| bing-zhou | 并州 | province | 太原、上党等北方边区 |
| qing-zhou | 青州 | province | 山东半岛和黄河下游东部 |
| yan-zhou | 兖州 | province | 曹操早期根据地 |
| yu-zhou | 豫州 | province | 许都周边、中原腹地 |
| xu-zhou | 徐州 | province | 陶谦、吕布、刘备、曹操多次争夺 |
| liaodong | 辽东 | commandery | 公孙氏割据，必须独立变色 |
| wuhuan-xianbei-frontier | 乌桓鲜卑边缘 | frontier | 非州郡式边疆影响区 |

关中和西北：

| id | 名称 | 级别 | 说明 |
| --- | --- | --- | --- |
| yong-zhou | 雍州 | province | 关中核心，后续可拆京兆、扶风、冯翊 |
| liang-zhou | 凉州 | province | 马腾、韩遂、曹魏西北，后续可拆金城、武威、张掖 |
| hanzhong | 汉中 | commandery | 张鲁、曹操、刘备控制权变化明显 |
| hexi-frontier | 河西边缘 | frontier | 凉州西部和西域通道，第一版低精度 |
| qiang-di-frontier | 羌氐边缘 | frontier | 不写成稳定郡县实控区 |

荆州：

| id | 名称 | 级别 | 说明 |
| --- | --- | --- | --- |
| nanyang | 南阳 | commandery | 曹操、刘表、刘备之间的重要北部荆州区 |
| xiangyang-jiangling | 襄阳江陵 | commandery | 荆州核心，赤壁前后和关羽时期关键 |
| jiangxia | 江夏 | commandery | 孙刘曹交界 |
| changsha | 长沙 | commandery | 荆南核心郡 |
| lingling | 零陵 | commandery | 荆南 |
| guiyang | 桂阳 | commandery | 荆南 |
| wuling | 武陵 | commandery | 荆南、西南通道 |

扬州和江东：

| id | 名称 | 级别 | 说明 |
| --- | --- | --- | --- |
| huainan | 淮南 | commandery | 袁术、曹操、孙权交界，必须独立 |
| lujiang | 庐江 | commandery | 江淮争夺区 |
| danyang | 丹阳 | commandery | 孙氏江东核心之一 |
| wu-kuaiji | 吴会 | commandery | 吴郡、会稽合并为第一版江东核心 |
| yuzhang | 豫章 | commandery | 江东南部与荆州、交州之间 |

益州和西南：

| id | 名称 | 级别 | 说明 |
| --- | --- | --- | --- |
| ba-commandery | 巴郡 | commandery | 益州东部门户 |
| shu-commandery | 蜀郡 | commandery | 成都平原，刘璋、刘备、蜀汉核心 |
| guanghan-zitong | 广汉梓潼 | commandery | 剑阁、汉中、成都之间的关键通道 |
| yizhou-south | 南中 | frontier | 蜀汉南中，第一版用边疆区块，不细拆郡县 |

交州和岭南：

| id | 名称 | 级别 | 说明 |
| --- | --- | --- | --- |
| jiao-zhou | 交州 | province | 第一版整体，后续再拆南海、苍梧、交趾、九真、日南 |
| lingnan-frontier | 岭南边缘 | frontier | 用于表达低密度和边缘控制 |

### 第一版目标数量

建议第一版控制在 30-40 个区块。少于 20 个会太粗，仍像大色块；超过 60 个会过早陷入县级细节和边界考据。

## 数据模型设计

数据分两层：区块底图数据和控制时间线数据。前端不能在 polygon 上写死颜色。

### A. 区块底图数据

文件建议：`data/china-historical-blocks-190-280.json`

```ts
type ChinaHistoricalBlock = {
  id: string;
  name: string;
  level: "province" | "commandery" | "frontier";
  parent: string | null;
  center: [number, number];
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  adjacentBlockIds: string[];
  sourceRefs: SourceRef[];
  confidence: "high" | "medium" | "low";
  approximate: true;
  notes?: string;
};
```

要求：

- `geometry` 必须是闭合 polygon 或 multipolygon。
- 相邻区块尽量共享边界，不能互相大面积覆盖。
- `center` 只用于标签和 hover 锚点，不用于定义区块范围。
- `sourceRefs` 必须指向地图或历史地理来源。
- `approximate` 第一版固定为 `true`，页面文案必须说明“势力范围近似”。

示例：

```json
{
  "id": "hanzhong",
  "name": "汉中",
  "level": "commandery",
  "parent": "yi-zhou",
  "center": [107.0, 33.1],
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[105.7, 32.4], [108.6, 32.5], [109.1, 33.6], [106.9, 34.1], [105.7, 32.4]]]
  },
  "adjacentBlockIds": ["yong-zhou", "ba-commandery", "guanghan-zitong"],
  "sourceRefs": [
    { "sourceId": "historical-atlas-china-vol3", "locator": "蜀汉益州北部 / 魏雍州相关图幅" }
  ],
  "confidence": "medium",
  "approximate": true,
  "notes": "第一版按汉中盆地和秦岭南缘简化，不代表郡界精确线。"
}
```

### B. 势力控制时间线数据

文件建议：`data/china-block-control-timeline-190-280.json`

```ts
type ChinaBlockControlRecord = {
  blockId: string;
  startYear: number;
  endYear: number;
  controller: string;
  status: "effective-control" | "contested" | "frontier" | "nominal-control";
  confidence: "high" | "medium" | "low";
  sourceRefs: SourceRef[];
  notes?: string;
};
```

关键年份必须可以正确换色：

- 190：董卓 / 关东群雄 / 袁绍 / 袁术 / 刘表 / 刘焉 / 张鲁前期势力雏形
- 200：曹操 vs 袁绍，袁术已亡，吕布已亡，张鲁、刘表、刘璋、孙氏分立
- 208：赤壁前后，荆州拆分逻辑开始重要
- 220：曹魏建立，刘备、孙权仍为独立集团
- 229：孙权称帝，魏蜀吴正式三国并立
- 263：蜀汉灭亡，益州控制权转向曹魏
- 265：西晋代魏
- 280：西晋灭吴

示例：

```json
{
  "blockId": "hanzhong",
  "startYear": 190,
  "endYear": 214,
  "controller": "张鲁",
  "status": "effective-control",
  "confidence": "medium",
  "sourceRefs": [
    { "sourceId": "sanguozhi-wei-zhang-lu", "locator": "张鲁传" }
  ],
  "notes": "汉中张鲁集团长期割据，年份边界第一版按主要政治事件简化。"
}
```

## 前端渲染规则

第一阶段只做一个地图模式：

- `political` / `control map`
- 区块 fill 由当前年份的 `controller` 决定
- 区块 stroke 用统一边界色
- `contested` 用斜线纹理
- `frontier` 用灰色或低饱和度
- `nominal-control` 用更低透明度或虚线边
- hover 显示区块名、当前控制者、状态、可信度
- click 固定详情卡

伪代码：

```ts
blocks.map((block) => {
  const control = getControlForYear(block.id, currentYear);
  const fill = controllerColorMap[control.controller] ?? unknownColor;
  return <path d={geoPath(block.geometry)} fill={fill} />;
});
```

## 实施步骤

1. 新增 `historical-atlas-china-vol3`、`chgis`、`china-administrative-history-three-kingdoms` 等 source records。
2. 新建 `data/china-historical-blocks-190-280.json`，先用 30-40 个区块替换旧的粗略 blocks。
3. 保留 `data/china-block-control-timeline-190-280.json` 的控制时间线思想，但重写 blockId 和关键年份记录。
4. 更新 validator：
   - block id 唯一
   - control record 的 blockId 必须存在
   - 关键年份每个 block 都能找到控制记录
   - geometry 闭合
   - adjacentBlockIds 必须互相存在
5. 前端只渲染区块底图和控制颜色，暂时移除复杂城市点和地形叠加优先级。
6. 浏览器验证 190、200、208、220、229、263、280 关键年份换色。

## 如果用户上传手绘参考图

手绘图只作为参考层，不作为最终网页素材。

处理流程：

1. 对照谭图和 CHGIS 校正州郡名称。
2. 把手绘区块抽象为 simplified vector polygon。
3. 每个 polygon 绑定 block id。
4. 控制权仍由 timeline 数据决定，不从图像颜色读取。

这样可以利用手绘表达意图，但最终仍保持 ChronoAtlas 的数据驱动地图架构。
