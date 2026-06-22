import coveragePlan from "../data/cao-wei-person-coverage-plan.json" with { type: "json" };
import lifeEvents from "../data/china-person-life-events.json" with { type: "json" };
import persons from "../data/china-persons.json" with { type: "json" };
import relations from "../data/china-person-relations.json" with { type: "json" };

const personById = new Map(persons.map((person) => [person.id, person]));

function countLifeEvents(personId) {
  return lifeEvents.filter((lifeEvent) => lifeEvent.personId === personId).length;
}

function countRelations(personId) {
  return relations.filter(
    (relation) => relation.sourcePersonId === personId || relation.targetPersonId === personId,
  ).length;
}

console.log(`曹魏人物覆盖计划: ${coveragePlan.scope}`);
console.log(`更新日期: ${coveragePlan.updatedAt}`);
console.log("");

for (const batch of coveragePlan.currentBatches) {
  console.log(`- ${batch.title} [${batch.status}]`);

  if (batch.personIds?.length) {
    for (const personId of batch.personIds) {
      const person = personById.get(personId);
      const name = person?.name ?? personId;
      const seeded = person ? "已建档" : "缺失";
      console.log(`  ${name}: ${seeded}, 生平 ${countLifeEvents(personId)}, 关系 ${countRelations(personId)}`);
    }
  }

  if (batch.candidateNames?.length) {
    console.log(`  候选: ${batch.candidateNames.join("、")}`);
  }
}

console.log("");
const tracked = coveragePlan.trackedPeople ?? [];
const seeded = tracked.filter((item) => item.inPersonTable).length;
console.log(`追踪人物: ${seeded}/${tracked.length} 已建档`);
