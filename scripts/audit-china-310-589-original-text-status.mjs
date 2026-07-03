import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const periodPrefix = "china-wei-jin-northern-southern-310-589:%";

const summary = db
  .prepare(
    `
    SELECT COALESCE(json_extract(raw_json, '$.originalTextStatus'), '(none)') AS status,
           count(*) AS count
    FROM source_mentions
    WHERE id LIKE ?
    GROUP BY status
    ORDER BY status
  `,
  )
  .all(periodPrefix);

const remaining = db
  .prepare(
    `
    SELECT id, source_id, locator,
           json_extract(raw_json, '$.originalTextStatus') AS status
    FROM source_mentions
    WHERE id LIKE ?
      AND json_extract(raw_json, '$.originalTextStatus') IN ('locator-only', 'not-yet-transcribed')
    ORDER BY year, id
  `,
  )
  .all(periodPrefix);

console.log("310-589 original text status summary:");
console.table(summary);

if (remaining.length) {
  console.log("Remaining locator-only / not-yet-transcribed records:");
  console.table(remaining);
  process.exitCode = 1;
} else {
  console.log("No remaining locator-only or not-yet-transcribed source_mentions for 310-589.");
}

db.close();
