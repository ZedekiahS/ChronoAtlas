import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const datasetId = "event-importance-180-280";

const sasanianImportance = [
  ["sasanian-230-ardashir-roman-frontier", "medium"],
  ["sasanian-232-alexander-severus-expedition", "medium"],
  ["sasanian-244-battle-of-misiche", "medium"],
  ["sasanian-256-dura-europos", "medium"],
  ["sasanian-262-odaenathus-counteroffensive", "medium"],
  ["sasanian-280-kartir-priestly-power", "medium"],
  ["sasanian-293-narseh-paikuli", "medium"],
  ["sasanian-298-treaty-of-nisibis", "medium"],
];

const row = db.prepare("SELECT raw_json FROM app_runtime_datasets WHERE id = ?").get(datasetId);
if (!row) {
  throw new Error(`Missing runtime dataset: ${datasetId}`);
}

const data = JSON.parse(row.raw_json);
const records = Array.isArray(data.records) ? data.records : [];
const byId = new Map(records.map((record) => [record.eventId, record]));

for (const [eventId, importance] of sasanianImportance) {
  byId.set(eventId, { eventId, importance });
}

data.records = [...byId.values()].sort((left, right) => left.eventId.localeCompare(right.eventId));

db.prepare(`
  UPDATE app_runtime_datasets
  SET raw_json = ?, updated_at = ?
  WHERE id = ?
`).run(JSON.stringify(data, null, 2), new Date().toISOString(), datasetId);

console.log(`Seeded Sasanian event importance: ${sasanianImportance.length}`);
