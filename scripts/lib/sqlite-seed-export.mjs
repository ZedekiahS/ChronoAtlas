function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "bigint") {
    return String(value);
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function readTableInfo(db, tableName) {
  return db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all();
}

export function getStableOrderColumns(tableInfo) {
  const primaryKeyColumns = tableInfo
    .filter((column) => Number(column.pk) > 0)
    .sort((left, right) => Number(left.pk) - Number(right.pk))
    .map((column) => column.name);
  const primaryKeyColumnSet = new Set(primaryKeyColumns);

  return [
    ...primaryKeyColumns,
    ...tableInfo.map((column) => column.name).filter((columnName) => !primaryKeyColumnSet.has(columnName)),
  ];
}

export function buildDeterministicSelectSql(tableName, tableInfo) {
  const orderColumns = getStableOrderColumns(tableInfo);
  const orderBySql = orderColumns
    .map((columnName) => `${quoteIdentifier(columnName)} COLLATE BINARY ASC`)
    .join(", ");

  return `SELECT * FROM ${quoteIdentifier(tableName)}${orderBySql ? ` ORDER BY ${orderBySql}` : ""}`;
}

export function buildSeedStatements(db, {
  orderedTables,
  tables,
  label,
  insertOrReplace = false,
  baseSchemaColumns = new Map(),
  tableSelectSql = new Map(),
}) {
  const insertVerb = insertOrReplace ? "INSERT OR REPLACE" : "INSERT";
  const output = [
    "-- Generated from db/chronoatlas.sqlite. Do not edit by hand.",
    "-- Rebuild with: npm run db:seed:export",
    `-- ${label}`,
    "PRAGMA foreign_keys = OFF;",
    "BEGIN;",
  ];

  for (const tableName of orderedTables.filter((name) => tables.has(name))) {
    const tableInfo = readTableInfo(db, tableName);
    const columns = tableInfo.map((column) => column.name);
    const selectOverride = tableSelectSql.get(tableName);
    const selectSql = typeof selectOverride === "function"
      ? selectOverride(tableName, tableInfo)
      : selectOverride ?? buildDeterministicSelectSql(tableName, tableInfo);
    const rows = db.prepare(selectSql).all();

    if (rows.length === 0) {
      continue;
    }

    output.push("", `-- ${tableName}`);
    const seedColumns = baseSchemaColumns.get(tableName) ?? columns;
    const columnSql = seedColumns.map(quoteIdentifier).join(", ");
    for (const row of rows) {
      const valuesSql = seedColumns.map((column) => sqlLiteral(row[column])).join(", ");
      output.push(`${insertVerb} INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES (${valuesSql});`);
    }
  }

  output.push("COMMIT;", "PRAGMA foreign_keys = ON;");
  return output;
}
