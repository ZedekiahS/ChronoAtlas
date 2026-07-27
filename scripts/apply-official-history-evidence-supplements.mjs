import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configArg = process.argv.find((value) => value.startsWith("--config="))?.slice("--config=".length);
const dbArg = process.argv.find((value) => value.startsWith("--db="))?.slice("--db=".length);
if (!configArg) throw new Error("Missing --config=<module path>");

const config = await import(pathToFileURL(path.resolve(rootDir, configArg)).href);
const supplements = config.supplements ?? [];
if (!config.generator || !config.profileId || !supplements.length) throw new Error("Supplement config requires generator, profileId, and supplements");

const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
const findEvent = db.prepare("SELECT id FROM events WHERE id = ?");
const findPassage = db.prepare("SELECT text FROM source_passages WHERE id = ? AND source_id = ?");
const upsertEvidence = db.prepare(`
  INSERT INTO evidence_links (id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote, evidence_role, confidence, raw_json)
  VALUES (?, 'events', ?, ?, ?, NULL, ?, ?, 'support', 'high', ?)
  ON CONFLICT(id) DO UPDATE SET subject_id=excluded.subject_id, source_id=excluded.source_id, passage_id=excluded.passage_id,
    mention_id=NULL, locator=excluded.locator, quote=excluded.quote, evidence_role=excluded.evidence_role,
    confidence=excluded.confidence, raw_json=excluded.raw_json
`);
const stableId = (value) => createHash("sha256").update(value).digest("hex").slice(0, 24);
const validated = supplements.map((supplement) => {
  for (const field of ["eventId", "sourceId", "passageId", "locator", "quote"]) if (!supplement[field]) throw new Error(`Missing ${field} in evidence supplement`);
  if (!findEvent.get(supplement.eventId)) throw new Error(`Unknown event: ${supplement.eventId}`);
  const passage = findPassage.get(supplement.passageId, supplement.sourceId);
  if (!passage?.text.includes(supplement.quote)) throw new Error(`Quote not found in source passage: ${supplement.eventId}`);
  return supplement;
});

db.exec("BEGIN");
try {
  for (const supplement of validated) {
    const id = supplement.id ?? `official-history-evidence:${stableId(`${config.generator}:${supplement.eventId}:${supplement.passageId}:${supplement.quote}`)}`;
    const raw = JSON.stringify({ generator: config.generator, profileId: config.profileId, ...(config.periodId ? { periodId: config.periodId } : {}), ...(supplement.chronology ? { chronology: supplement.chronology } : {}), sourceVerification: "source-passage-contiguous-quote" });
    upsertEvidence.run(id, supplement.eventId, supplement.sourceId, supplement.passageId, supplement.locator, supplement.quote, raw);
  }
  db.exec("COMMIT");
} catch (error) { db.exec("ROLLBACK"); throw error; }
console.log(JSON.stringify({ generator: config.generator, profileId: config.profileId, evidenceLinks: validated.length, events: validated.map(({ eventId, sourceId, passageId }) => ({ eventId, sourceId, passageId })) }, null, 2));