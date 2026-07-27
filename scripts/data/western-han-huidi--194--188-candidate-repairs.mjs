export const profileId = "china-western-han-huidi--194--188-v1";
export const batchId = "auto-hanshu-western-han-huidi--194--188-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-huidi--194--188-v1";

export const canonicalPeople = [];

export const decisions = [
  {
    "cardId": "card:hanshu-western-han-huidi--194--188:66e8c749c3ca92a5626df0b0",
    "disposition": "reject",
    "reason": "The sentence is a pre-accession biography of Hui, not an event in 193 BCE."
  }
];

export default { profileId, batchId, periodId, generator, coverageMode: "complete", canonicalPeople, decisions, batchNotes: "The sole machine candidate is a biography false positive; accession and death require bounded source supplements." };
