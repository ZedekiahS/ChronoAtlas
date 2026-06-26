import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const links = [
  ["sasanian-224-ardashir-defeats-parthians", "Ardashir I defeats Artabanus IV at Hormozdgan"],
  ["sasanian-224-ardashir-defeats-parthians", "End of the Arsacid dynasty and the establishment of the Sasanian dynasty"],
  ["sasanian-230-ardashir-roman-frontier", "Ardashir I threatens Rome's eastern frontier"],
  ["sasanian-232-alexander-severus-expedition", "Alexander Severus' Persian expedition (231-233)"],
  ["sasanian-244-battle-of-misiche", "Battle of Misiche: Gordian III killed according to Shapur"],
  ["sasanian-256-dura-europos", "Siege and destruction of Dura-Europos (c. 256)"],
  ["rome-sasanian-260-valerian-captured", "Capture of Valerian by Shapur I (260 CE)"],
  ["sasanian-262-odaenathus-counteroffensive", "Odaenathus' counter-offensive against Shapur I (c. 260-262)"],
  ["sasanian-280-kartir-priestly-power", "Kartir's rise and the establishment of Sasanian state Zoroastrianism"],
  ["sasanian-293-narseh-paikuli", "Narseh overthrows Bahram III and claims the throne"],
  ["sasanian-298-treaty-of-nisibis", "Treaty of Nisibis (298): Roman victory over Narseh"],
];

function parseJson(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const findDocument = db.prepare(`
  SELECT id, title, raw_json
  FROM search_documents
  WHERE id LIKE 'deepseek-sasanian-card:%'
    AND title = ?
  LIMIT 1
`);
const findEvidence = db.prepare(`
  SELECT quote, locator, confidence
  FROM evidence_links
  WHERE subject_table = 'search_documents'
    AND subject_id = ?
  LIMIT 1
`);
const insertEvidence = db.prepare(`
  INSERT INTO evidence_links (
    id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
    quote, evidence_role, confidence, raw_json
  ) VALUES (?, 'events', ?, ?, NULL, NULL, ?, ?, 'support', ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    subject_table = excluded.subject_table,
    subject_id = excluded.subject_id,
    source_id = excluded.source_id,
    locator = excluded.locator,
    quote = excluded.quote,
    evidence_role = excluded.evidence_role,
    confidence = excluded.confidence,
    raw_json = excluded.raw_json
`);

try {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("BEGIN;");
  let inserted = 0;
  for (const [eventId, documentTitle] of links) {
    const document = findDocument.get(documentTitle);
    if (!document) {
      throw new Error(`Missing Sasanian evidence document: ${documentTitle}`);
    }
    const raw = parseJson(document.raw_json, {});
    const evidence = findEvidence.get(document.id);
    insertEvidence.run(
      `sasanian-formal-event-evidence:${eventId}:${document.id}`,
      eventId,
      raw.sourceId,
      evidence?.locator ?? raw.locator ?? null,
      evidence?.quote ?? document.title,
      evidence?.confidence ?? raw.confidence ?? "medium",
      JSON.stringify({
        generatedFrom: "scripts/link-sasanian-formal-evidence.mjs",
        searchDocumentId: document.id,
        documentTitle,
      }),
    );
    inserted += 1;
  }
  db.exec("COMMIT;");
  console.log(`Linked ${inserted} Sasanian formal event evidence rows`);
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
} finally {
  db.close();
}
