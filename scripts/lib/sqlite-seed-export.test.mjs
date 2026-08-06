import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import { buildSeedStatements } from "./sqlite-seed-export.mjs";

const tableNames = ["keyed_rows", "unkeyed_rows"];

function createDatabase(reverseInsertionOrder = false) {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE keyed_rows (
      scope TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      label TEXT NOT NULL,
      PRIMARY KEY (scope, sequence)
    );
    CREATE TABLE unkeyed_rows (
      category TEXT COLLATE NOCASE,
      ordinal INTEGER,
      note TEXT
    );
  `);

  const keyedRows = [
    ["beta", 1, "第三"],
    ["alpha", 2, "第二"],
    ["alpha", 1, "第一"],
  ];
  const unkeyedRows = [
    ["a", 1, "lowercase"],
    ["A", 1, "uppercase"],
    [null, 3, "null-first"],
  ];
  const insertionOrder = (rows) => reverseInsertionOrder ? rows.toReversed() : rows;
  const keyedInsert = db.prepare("INSERT INTO keyed_rows (scope, sequence, label) VALUES (?, ?, ?)");
  const unkeyedInsert = db.prepare("INSERT INTO unkeyed_rows (category, ordinal, note) VALUES (?, ?, ?)");

  for (const row of insertionOrder(keyedRows)) {
    keyedInsert.run(...row);
  }
  for (const row of insertionOrder(unkeyedRows)) {
    unkeyedInsert.run(...row);
  }

  return db;
}

function exportStatements(db) {
  return buildSeedStatements(db, {
    orderedTables: tableNames,
    tables: new Set(tableNames),
    label: "Deterministic export fixture",
  });
}

test("consecutive exports of the same database are byte-identical", () => {
  const db = createDatabase();
  try {
    assert.equal(exportStatements(db).join("\n"), exportStatements(db).join("\n"));
  } finally {
    db.close();
  }
});

test("logical rows export identically regardless of insertion order", () => {
  const forwardDb = createDatabase(false);
  const reverseDb = createDatabase(true);
  try {
    const forward = exportStatements(forwardDb);
    const reverse = exportStatements(reverseDb);
    assert.deepEqual(forward, reverse);

    const inserts = forward.filter((statement) => statement.startsWith("INSERT"));
    assert.deepEqual(inserts, [
      `INSERT INTO "keyed_rows" ("scope", "sequence", "label") VALUES ('alpha', 1, '第一');`,
      `INSERT INTO "keyed_rows" ("scope", "sequence", "label") VALUES ('alpha', 2, '第二');`,
      `INSERT INTO "keyed_rows" ("scope", "sequence", "label") VALUES ('beta', 1, '第三');`,
      `INSERT INTO "unkeyed_rows" ("category", "ordinal", "note") VALUES (NULL, 3, 'null-first');`,
      `INSERT INTO "unkeyed_rows" ("category", "ordinal", "note") VALUES ('A', 1, 'uppercase');`,
      `INSERT INTO "unkeyed_rows" ("category", "ordinal", "note") VALUES ('a', 1, 'lowercase');`,
    ]);
  } finally {
    forwardDb.close();
    reverseDb.close();
  }
});
