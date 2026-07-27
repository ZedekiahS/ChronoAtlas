export const profileId = "china-western-han-xin-transition--8-24-v1";
export const batchId = "auto-hanshu-xin-regency-6-8-candidates";
export const periodId = "china-western-han-xin-transition--8-24";
export const generator = "official-history-candidate-repair:xin-regency-6-8-v1";

export const canonicalPeople = [];

export const decisions = [
  {
    cardId: "card:hanshu-xin-regency-6-8:ff485b9a9e1e870c1ef54fd0",
    disposition: "promote",
    title: "\u5218\u5a74\u88ab\u7acb\u4e3a\u7687\u592a\u5b50\u5e76\u53f7\u5b7a\u5b50",
    reason: "The Wang Mang biography gives an explicit action and high-confidence Jushi year context.",
    matchedEventId: "official-history-event:934f79d22bd20bc9c82a",
    personBindings: [
      {
        personId: "han-liu-ying-ruzi",
        canonicalName: "\u5218\u5a74",
        sourceNames: ["\u5b30", "\u5b7a\u5b50"],
      },
    ],
    preserveAllBoundPeople: true,
  },
];

export default { profileId, batchId, periodId, generator, coverageMode: "complete", canonicalPeople, decisions };
