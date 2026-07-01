import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-rome-core-event-review-190-310";

const importanceByTitle = new Map([
  ["Didius Julianus buys the throne; Severus proclaimed in Pannonia", "major"],
  ["Battle of Lugdunum: Severus defeats Clodius Albinus", "major"],
  ["Constitutio Antoniniana: universal citizenship", "major"],
  ["Assassination of Alexander Severus; beginning of the Third Century Crisis", "major"],
  ["Year of the Six Emperors", "major"],
  ["Battle of Abrittus: Decius killed by Goths", "major"],
  ["Capture of Valerian by Shapur I", "major"],
  ["Gallienus sole reign; Gallic Empire secedes", "major"],
  ["Aurelian defeats Zenobia and recovers the East", "major"],
  ["Aurelian defeats Tetricus and reunifies the Roman Empire", "major"],
  ["Diocletian becomes emperor", "major"],
  ["Establishment of the Tetrarchy", "major"],
  ["The Great Persecution begins", "major"],
  ["Abdication of Diocletian and Maximian", "major"],
  ["Constantine proclaimed Augustus at York", "major"],
  ["Death of Constantius Chlorus; Constantine proclaimed emperor", "major"],
  ["君士坦丁和马克森提乌斯进入四帝共治继承危机 / Constantine and Maxentius enter the Tetrarchic succession crisis", "major"],
  ["Severus marches on Rome and disbands the Praetorian Guard", "medium"],
  ["Severus defeats Pescennius Niger at Issus", "medium"],
  ["Severus sacks Ctesiphon and creates province of Mesopotamia", "medium"],
  ["Caracalla murders Geta", "medium"],
  ["Macrinus assassinates Caracalla and becomes emperor", "medium"],
  ["Elagabalus introduces the cult of Elagabal to Rome", "medium"],
  ["Death of Elagabalus; Alexander Severus becomes emperor", "medium"],
  ["Alexander Severus' Persian expedition", "medium"],
  ["Death of Gordian III; Philip the Arab becomes emperor", "medium"],
  ["Gallienus' creation of a mobile cavalry army", "medium"],
  ["Claudius II defeats Goths at Naissus", "medium"],
  ["Aurelian withdraws from Dacia north of the Danube", "medium"],
  ["Carausius and the secessionist British Empire (286-296)", "medium"],
  ["Diocletian's Price Edict", "medium"],
]);

function patchRawJson(rawJson, patch) {
  let raw = {};
  try {
    raw = JSON.parse(rawJson || "{}");
  } catch {
    raw = {};
  }
  return JSON.stringify({ ...raw, ...patch });
}

try {
  db.exec("PRAGMA foreign_keys = ON;");
  const updateDoc = db.prepare(`
    UPDATE search_documents
    SET review_status = 'reviewed', raw_json = ?
    WHERE id = ?
  `);
  const updateChunk = db.prepare(`
    UPDATE document_chunks
    SET review_status = 'reviewed', raw_json = ?
    WHERE search_document_id = ?
  `);
  const updateEvent = db.prepare(`
    UPDATE historical_events
    SET raw_json = ?, confidence = CASE WHEN confidence IS NULL THEN 'medium' ELSE confidence END
    WHERE id = ?
  `);

  const rows = db.prepare(`
    SELECT id, subject_id, title, raw_json
    FROM search_documents
    WHERE region_id = 'rome'
      AND time_start BETWEEN 190 AND 310
      AND title IN (${[...importanceByTitle.keys()].map(() => "?").join(",")})
  `).all(...importanceByTitle.keys());

  db.exec("BEGIN;");
  for (const row of rows) {
    const importance = importanceByTitle.get(row.title);
    const patch = { importance, reviewStatus: "reviewed", reviewedBy: batchId };
    const raw = patchRawJson(row.raw_json, patch);
    updateDoc.run(raw, row.id);
    updateChunk.run(raw, row.id);
    if (row.subject_id?.startsWith("rome-")) {
      const eventRow = db.prepare("SELECT raw_json FROM historical_events WHERE id = ?").get(row.subject_id);
      if (eventRow) {
        updateEvent.run(patchRawJson(eventRow.raw_json, patch), row.subject_id);
      }
    }
  }
  db.exec("COMMIT;");
  console.log(`Reviewed ${rows.length} core Roman event documents.`);
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
} finally {
  db.close();
}
