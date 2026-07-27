export const profileId = "china-western-han-yuandi-accession--49-v1";
export const batchId = "auto-hanshu-western-han-yuandi-accession--49-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-yuandi-accession--49-v1";

const person = {
  id: "han-liu-shi",
  name: "刘奭",
  aliases: ["劉奭", "元帝", "孝元皇帝"],
  birthYear: -75,
  deathYear: -33,
  primaryPolity: "西汉",
  summary: "汉宣帝长子，前49年即位为汉元帝，前33年驾崩。",
};

export const canonicalPeople = [person];
export const decisions = [{
  cardId: "card:hanshu-western-han-yuandi-accession--49:e7da4359a2a947253e5d8427",
  disposition: "promote",
  title: "汉元帝刘奭即位",
  summary: "前49年十二月癸巳，太子刘奭即皇帝位，并谒高庙。",
  reason: "《汉书·元帝纪》明确记载宣帝崩后刘奭即位及谒高庙，是宣、元两朝的边界事件。",
  personBindings: [{ personId: person.id, canonicalName: person.name, sourceNames: ["太子", "皇帝"] }],
  placeBindings: [{ id: "gao-temple-han", label: "高庙", role: "primary-location" }],
  preserveAllBoundPeople: true,
}];

export default {
  profileId,
  batchId,
  periodId,
  generator,
  coverageMode: "complete",
  canonicalPeople,
  decisions,
  batchNotes: "Reviewed boundary event for Emperor Yuan's accession in 49 BCE.",
};
