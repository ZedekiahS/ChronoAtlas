import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const insertRole = db.prepare(`
  INSERT OR IGNORE INTO person_roles (person_id, role, sort_order)
  VALUES (?, ?, ?)
`);

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function inferRoles(person) {
  const raw = parseJson(person.raw_json);
  if (Array.isArray(raw.roles) && raw.roles.length > 0) {
    return raw.roles.filter((role) => typeof role === "string" && role.trim()).map((role) => role.trim());
  }

  const text = [person.id, person.name, person.primary_polity, person.summary].filter(Boolean).join(" ");

  if (person.region === "rome") {
    if (person.id.includes("julia") || includesAny(text, ["母", "皇后", "Augusta", "女性"])) return ["皇室女性"];
    if (person.id.startsWith("palmyra-") || includesAny(text, ["帕尔米拉", "Palmyra"])) return ["地方统治者"];
    if (includesAny(text, ["割据", "高卢帝国", "不列颠"])) return ["割据统治者"];
    return ["皇帝"];
  }

  if (person.region === "sasanian-persia") {
    if (includesAny(text, ["祭司", "祆教"])) return ["祭司"];
    if (includesAny(text, ["宗教", "摩尼"])) return ["宗教人物"];
    return ["国王"];
  }

  if (includesAny(text, ["太后", "皇后", "后主", "幼主", "帝纪", "高祖", "世祖", "武帝", "文帝", "明帝", "称帝", "即位", "建立"])) {
    return ["君主"];
  }

  if (includesAny(text, ["将", "军", "征", "伐", "灭", "守", "战", "北伐", "统兵", "都督", "镇恶", "擒虎"])) {
    return ["将领"];
  }

  if (includesAny(text, ["权臣", "辅政", "执政", "改革", "宰相", "尚书", "谋", "政权"])) {
    return ["政治人物"];
  }

  if (includesAny(text, ["起义", "六镇", "叛", "乱"])) {
    return ["起义领袖"];
  }

  return ["历史人物"];
}

const personsWithoutRoles = db.prepare(`
  SELECT p.*
  FROM persons p
  LEFT JOIN person_roles r ON r.person_id = p.id
  WHERE r.person_id IS NULL
  ORDER BY p.region, p.id
`).all();

let inserted = 0;
db.exec("BEGIN");
try {
  for (const person of personsWithoutRoles) {
    const roles = inferRoles(person);
    roles.forEach((role, index) => {
      const result = insertRole.run(person.id, role, index);
      inserted += result.changes;
    });
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

console.log(`Normalized person roles: persons=${personsWithoutRoles.length}, inserted=${inserted}`);
