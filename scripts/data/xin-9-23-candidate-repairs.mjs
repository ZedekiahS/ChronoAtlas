export const profileId = "china-western-han-xin-transition--8-24-v1";
export const batchId = "auto-hanshu-xin-9-23-candidates";
export const periodId = "china-western-han-xin-transition--8-24";
export const generator = "official-history-candidate-repair:xin-9-23-v1";

const wangMangBinding = {
  personId: "han-wang-mang",
  canonicalName: "王莽",
  sourceNames: ["莽"],
};

export const decisions = [
  {
    cardId: "card:hanshu-xin-9-23:8944032e0a582e02025fbf17",
    disposition: "promote",
    title: "王莽立妻王氏为皇后",
    personBindings: [wangMangBinding],
    preserveAllBoundPeople: true,
    reason: "《王莽传》在始建国元年即位叙事中明确记载立后，是可独立定位的宫廷建制事件。",
  },
  {
    cardId: "card:hanshu-xin-9-23:a4a00a32ac8fad3bf4bfae88",
    disposition: "promote",
    title: "王莽即位后大赦天下",
    personBindings: [wangMangBinding],
    preserveAllBoundPeople: true,
    reason: "该大赦紧承始建国元年建新与封拜叙事，属于明确可定位的政令事件。",
  },
  {
    cardId: "card:hanshu-xin-9-23:0b03a26a9ede4d616efc7334",
    disposition: "promote",
    title: "刘玄被拥立为帝",
    matchedEventId: "official-history-event:77cbca041039627b152a",
    personBindings: [
      {
        personId: "han-liu-xuan-gengshi",
        canonicalName: "刘玄",
        sourceNames: ["聖公"],
      },
    ],
    preserveAllBoundPeople: true,
    reason: "The source explicitly records the enthronement, regnal change, and Liu Xuan's identity; it is additional primary evidence for the existing event.",
  },
  {
    cardId: "card:hanshu-xin-9-23:5a4065db750a96aa70d8563a",
    disposition: "context",
    title: "王莽封皇后父谌为和平侯",
    reason: "The recipient appears only as the single name Chen. Preserve this as court-appointment context instead of promoting an event with an unsafe person identity.",
  },
];

export default {
  profileId,
  batchId,
  periodId,
  generator,
  coverageMode: "complete",
  canonicalPeople: [],
  decisions,
  batchNotes: "Adjudicated rule-based Hanshu Wang Mang biography candidates for 9-23 CE.",
};