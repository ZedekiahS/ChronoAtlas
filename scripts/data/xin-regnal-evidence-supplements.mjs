export const generator = "official-history-evidence-supplement:xin-regnal-segments-v1";
export const profileId = "china-western-han-xin-transition--8-24-v1";
export const periodId = "china-western-han-xin-transition--8-24";

export const supplements = [
  {
    eventId: "china-18-red-eyebrows-green-woods-rise",
    sourceId: "hanshu-guoxue123-118",
    passageId: "guoxue123:hanshu:hanshu-guoxue123-118:0002",
    locator: "汉书·王莽传下·天凤五年",
    quote: "是歲，赤眉力子都、樊崇等以饑饉相聚，起於琅邪，轉鈔掠，眾皆萬數。",
    chronology: {
      year: 18,
      method: "biography-regnal-segment",
      anchors: [
        "王莽传下段1先记天凤四年五月，继记五年正月；段2的“是岁”仍属天凤五年。",
        "段2后文另起“六年春”，与赤眉起事句分属相邻年段。",
      ],
    },
  },
  {
    eventId: "china-23-xin-dynasty-falls",
    sourceId: "hanshu-guoxue123-118",
    passageId: "guoxue123:hanshu:hanshu-guoxue123-118:0013",
    locator: "汉书·王莽传下·地皇四年",
    quote: "商人杜吳殺莽，取其綬。",
    chronology: {
      year: 23,
      method: "biography-regnal-segment",
      anchors: [
        "王莽传下段8明载地皇四年，段9继记更始元年；王莽被杀叙事位于其后。",
        "同段后文另起更始二年二月，王莽被杀句在其前。",
      ],
    },
  },
];

export default { generator, profileId, periodId, supplements };