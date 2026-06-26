import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(
  rootDir,
  "data",
  "import-drafts",
  "deepseek",
  "sasanian",
  "sasanian-180-310-evidence-cards.json",
);
const outputPath = path.join(
  rootDir,
  "data",
  "import-drafts",
  "generated",
  "sasanian",
  "sasanian-180-310-evidence-cards.cleaned.json",
);

const peopleCoreByIndex = new Map([
  [13, ["Valerian", "Gallienus", "Shapur I"]],
  [14, ["Ardashir I", "Shapur I"]],
  [18, ["Ardashir I", "Shapur I"]],
  [19, ["Shapur I", "Julian"]],
  [20, ["Shapur I", "Ardashir I", "Valerian"]],
  [25, ["Odaenathus", "Shapur I"]],
  [34, ["Hormizd I", "Bahram I"]],
]);

const yearByIndex = new Map([
  [5, 244],
  [6, 244],
  [7, 260],
  [9, 260],
  [10, 260],
  [13, null],
  [14, null],
  [18, null],
  [19, null],
  [20, null],
  [25, 262],
  [33, null],
  [38, 240],
]);

const sourceTypeMap = new Map([
  ["primary", "literary"],
  ["secondary", "secondary"],
  ["inscription", "inscription"],
  ["numismatic", "numismatic"],
  ["archaeology", "archaeology"],
  ["inscription + archaeology", "inscription"],
  ["inscription + tradition", "inscription"],
  ["inscription + numismatic", "inscription"],
  ["numismatic + later tradition", "numismatic"],
]);

function arrayFromValue(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function confidenceFor(card, index) {
  if (index === 13 || index === 14 || index === 18 || index === 19 || index === 20 || index === 33) {
    return "medium";
  }
  return card.confidence;
}

function normalizeCard(card, index) {
  const originalSourceType = card.sourceType;
  const sourceType = sourceTypeMap.get(originalSourceType) ?? originalSourceType ?? "source";
  const peopleCore = arrayFromValue(card.peopleCore);
  const fallbackPeople = peopleCoreByIndex.get(index);
  const cleaned = {
    ...card,
    sourceType,
    confidence: confidenceFor(card, index),
    peopleCore: peopleCore.length ? peopleCore : fallbackPeople ?? arrayFromValue(card.peopleMentioned).slice(0, 2),
    peopleMentioned: arrayFromValue(card.peopleMentioned),
    places: arrayFromValue(card.places),
    questions: arrayFromValue(card.questions),
  };

  if (yearByIndex.has(index)) {
    cleaned.year = yearByIndex.get(index);
  }

  const notes = [];
  if (originalSourceType && originalSourceType !== sourceType) {
    notes.push(`原始 sourceType: ${originalSourceType}`);
  }
  if (card.year !== cleaned.year) {
    notes.push(`原始 year: ${card.year}`);
  }
  if (!card.originalText) {
    notes.push("原始卡片缺 originalText；暂以 translation/factDetailed 参与 RAG。");
  }

  if (notes.length) {
    cleaned.factDetailed = [card.factDetailed, `清洗说明：${notes.join("；")}`]
      .filter((part) => typeof part === "string" && part.trim().length > 0)
      .join("\n\n");
  }

  return cleaned;
}

const raw = await readFile(inputPath, "utf8");
const source = JSON.parse(raw);
const cards = Array.isArray(source) ? source : source.evidenceCards;
if (!Array.isArray(cards)) {
  throw new Error("Expected an evidenceCards array");
}

const cleaned = {
  batchMeta: {
    source: "DeepSeek Sasanian evidence-card draft",
    cleanedBy: "scripts/clean-sasanian-evidence-cards.mjs",
    policy: "Preserve source draft, normalize fields for SQLite RAG import only.",
  },
  evidenceCards: cards.map(normalizeCard),
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(cleaned, null, 2)}\n`, "utf8");

const outOfRange = cleaned.evidenceCards.filter((card) => Number.isInteger(card.year) && (card.year < 180 || card.year > 310));
const missingPeople = cleaned.evidenceCards.filter((card) => arrayFromValue(card.peopleCore).length === 0);
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
console.log(`cards=${cleaned.evidenceCards.length}, outOfRangeYears=${outOfRange.length}, missingPeopleCore=${missingPeople.length}`);
