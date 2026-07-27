export const profileId = "china-western-han-xin-transition--8-24-v1";
export const batchId = "auto-hanshu-xin-9-13-candidates";
export const periodId = "china-western-han-xin-transition--8-24";
export const generator = "official-history-candidate-repair:xin-9-13-v1";

const wangMang = { personId: "han-wang-mang", canonicalName: "\u738b\u83bd", sourceNames: ["\u83bd"] };

export const decisions = [
  { cardId: "card:hanshu-xin-9-13:8944032e0a582e02025fbf17", disposition: "promote", title: "\u738b\u83bd\u7acb\u59bb\u738b\u6c0f\u4e3a\u7687\u540e", matchedEventId: "official-history-event:c9faeb158871f4141d7d", personBindings: [wangMang], preserveAllBoundPeople: true, reason: "Explicit founding-year court action; merges additional primary evidence." },
  { cardId: "card:hanshu-xin-9-13:a4a00a32ac8fad3bf4bfae88", disposition: "promote", title: "\u738b\u83bd\u5373\u4f4d\u540e\u5927\u8d66\u5929\u4e0b", matchedEventId: "official-history-event:bb7272de8e1cd468f71f", personBindings: [wangMang], preserveAllBoundPeople: true, reason: "Explicit founding-year edict; merges additional primary evidence." },
];

export default { profileId, batchId, periodId, generator, coverageMode: "complete", canonicalPeople: [], decisions };
