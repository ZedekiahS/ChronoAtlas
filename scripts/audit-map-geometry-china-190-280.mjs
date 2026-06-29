import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminPath = path.join(rootDir, "data", "china-admin-blocks-190-280.json");
const supplementalPath = path.join(rootDir, "data", "china-commandery-supplemental-blocks.json");
const controlPath = path.join(rootDir, "data", "china-block-control-timeline-190-280.json");

function loadJson(filePath) {
  return readFile(filePath, "utf8").then((text) => JSON.parse(text));
}

function isPoint(value) {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === "number"
    && typeof value[1] === "number"
    && Number.isFinite(value[0])
    && Number.isFinite(value[1]);
}

function collectPoints(value, points = []) {
  if (isPoint(value)) {
    points.push(value);
    return points;
  }
  if (Array.isArray(value)) {
    for (const child of value) {
      collectPoints(child, points);
    }
  }
  return points;
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value ?? "(empty)", (counts.get(value ?? "(empty)") ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => String(left[0]).localeCompare(String(right[0])));
}

function duplicates(values) {
  const seen = new Map();
  for (const value of values) {
    seen.set(value, (seen.get(value) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1);
}

function summarize(label, rows, limit = 10) {
  if (rows.length === 0) {
    console.log(`${label}: 0`);
    return;
  }
  console.log(`${label}: ${rows.length}`);
  for (const row of rows.slice(0, limit)) {
    console.log(`  - ${row}`);
  }
  if (rows.length > limit) {
    console.log(`  ... ${rows.length - limit} more`);
  }
}

const [adminDataset, supplementalDataset, controlDataset] = await Promise.all([
  loadJson(adminPath),
  loadJson(supplementalPath),
  loadJson(controlPath),
]);

const adminBlocks = adminDataset.blocks ?? [];
const supplementalBlocks = supplementalDataset.blocks ?? [];
const allBlocks = [
  ...adminBlocks.map((block) => ({ ...block, sourceFile: "china-admin-blocks-190-280.json" })),
  ...supplementalBlocks.map((block) => ({ ...block, sourceFile: "china-commandery-supplemental-blocks.json" })),
];
const blockIds = new Set(allBlocks.map((block) => block.id));
const controllerIds = new Set((controlDataset.controllers ?? []).map((controller) => controller.id));

const duplicateIds = duplicates(allBlocks.map((block) => block.id)).map(([id, count]) => `${id} (${count})`);
const duplicateNames = duplicates(allBlocks.map((block) => block.name)).map(([name, count]) => `${name} (${count})`);
const invalidCenters = allBlocks
  .filter((block) => !isPoint(block.center))
  .map((block) => `${block.id} center=${JSON.stringify(block.center)}`);
const invalidGeometries = allBlocks
  .filter((block) => !block.geometry?.type || collectPoints(block.geometry?.coordinates).length === 0)
  .map((block) => `${block.id} geometry=${block.geometry?.type ?? "(missing)"}`);
const unresolvedParents = allBlocks
  .filter((block) => block.parent && !blockIds.has(block.parent))
  .map((block) => `${block.id} parent=${block.parent}`);
const supplementalControlIssues = supplementalBlocks
  .filter((block) => block.controlBlockId && !blockIds.has(block.controlBlockId))
  .map((block) => `${block.id} controlBlockId=${block.controlBlockId}`);
const unresolvedRecordBlocks = (controlDataset.records ?? [])
  .filter((record) => !blockIds.has(record.blockId))
  .map((record) => `${record.blockId} ${record.startYear}-${record.endYear}`);
const unresolvedRecordControllers = (controlDataset.records ?? [])
  .filter((record) => !controllerIds.has(record.controller))
  .map((record) => `${record.blockId} controller=${record.controller}`);
const invalidYearRanges = (controlDataset.records ?? [])
  .filter((record) => !Number.isInteger(record.startYear) || !Number.isInteger(record.endYear) || record.startYear > record.endYear)
  .map((record) => `${record.blockId} ${record.startYear}-${record.endYear}`);

console.log("China 190-280 map geometry audit");
console.log(`Admin blocks: ${adminBlocks.length}`);
console.log(`Supplemental fragments: ${supplementalBlocks.length}`);
console.log(`Total feature candidates: ${allBlocks.length}`);
console.log(`Control controllers: ${controlDataset.controllers?.length ?? 0}`);
console.log(`Control records: ${controlDataset.records?.length ?? 0}`);
console.log("");
console.log("Geometry types:");
for (const [type, count] of countBy(allBlocks.map((block) => block.geometry?.type))) {
  console.log(`  ${type}: ${count}`);
}
console.log("");
console.log("Levels:");
for (const [level, count] of countBy(allBlocks.map((block) => block.level))) {
  console.log(`  ${level}: ${count}`);
}
console.log("");
console.log("Control statuses:");
for (const [status, count] of countBy((controlDataset.records ?? []).map((record) => record.status))) {
  console.log(`  ${status}: ${count}`);
}
console.log("");
console.log("Confidence:");
for (const [confidence, count] of countBy(allBlocks.map((block) => block.confidence))) {
  console.log(`  features ${confidence}: ${count}`);
}
for (const [confidence, count] of countBy((controlDataset.records ?? []).map((record) => record.confidence))) {
  console.log(`  control ${confidence}: ${count}`);
}
console.log("");
summarize("Duplicate ids", duplicateIds);
summarize("Duplicate names", duplicateNames);
summarize("Invalid centers", invalidCenters);
summarize("Empty or invalid geometries", invalidGeometries);
summarize("Unresolved parent refs", unresolvedParents);
summarize("Unresolved supplemental controlBlockId refs", supplementalControlIssues);
summarize("Unresolved control record block refs", unresolvedRecordBlocks);
summarize("Unresolved control record controller refs", unresolvedRecordControllers);
summarize("Invalid control year ranges", invalidYearRanges);
console.log("");
console.log("Supplemental fragments:");
for (const block of supplementalBlocks) {
  console.log(`  - ${block.id} -> ${block.controlBlockId ?? "(none)"}`);
}
