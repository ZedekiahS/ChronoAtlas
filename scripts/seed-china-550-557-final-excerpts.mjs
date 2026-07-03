import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-550-557-final-excerpts";
const periodId = "china-wei-jin-northern-southern-310-589";

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function mergeJson(value, patch) {
  return JSON.stringify({ ...parseJson(value), batchId, ...patch });
}

function compactText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

const excerpts = [
  {
    eventId: "china-550-northern-qi-founded",
    sourceId: "zizhi-tongjian-liang",
    workTitle: "资治通鉴",
    bookTitle: "梁纪",
    chapterTitle: "卷一百六十三",
    locator: "梁纪十九，大宝元年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷163",
    quote:
      "遣太尉彭城王韶等奉璽綬，禪位於齊。戊午，齊王即皇帝位於南郊，大赦，改元天保。",
    translation:
      "东魏孝静帝遣人奉玺绶禅位于齐；高洋于南郊即皇帝位，改元天保，北齐正式建立。",
  },
  {
    eventId: "china-557-northern-zhou-and-chen",
    sourceId: "zizhi-tongjian-chen",
    workTitle: "资治通鉴",
    bookTitle: "陈纪",
    chapterTitle: "卷一百六十七",
    locator: "陈纪一，永定元年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷167",
    quote:
      "春，正月，辛丑，周公即天王位，柴燎告天，朝百官於露門。辛未，梁敬帝禪位於陳。乙亥，王即皇帝位於南郊，還宮，大赦，改元。",
    translation:
      "宇文觉正月即天王位，北周建立；同年梁敬帝禅位于陈，陈霸先即皇帝位，陈朝建立。",
  },
];

const getEvent = db.prepare("SELECT * FROM events WHERE id = ?");
const getMention = db.prepare("SELECT * FROM source_mentions WHERE id = ?");
const updateEvent = db.prepare("UPDATE events SET confidence = 'high', review_status = 'reviewed', raw_json = ? WHERE id = ?");
const updateMention = db.prepare(`
  UPDATE source_mentions
  SET source_id = ?, work_title = ?, book_title = ?, chapter_title = ?, locator = ?,
      text = ?, translation = ?, confidence = 'high', review_status = 'reviewed', raw_json = ?
  WHERE id = ?
`);
const getEvidenceRows = db.prepare("SELECT id, raw_json FROM evidence_links WHERE mention_id = ?");
const updateEvidence = db.prepare(`
  UPDATE evidence_links
  SET source_id = ?, locator = ?, quote = ?, confidence = 'high', raw_json = ?
  WHERE mention_id = ?
`);
const getSearchDocument = db.prepare("SELECT * FROM search_documents WHERE id = ?");
const updateSearchDocument = db.prepare(`
  UPDATE search_documents
  SET body = ?, review_status = 'reviewed', raw_json = ?
  WHERE id = ?
`);

function patchExcerpt(excerpt) {
  const event = getEvent.get(excerpt.eventId);
  if (!event) throw new Error(`Missing event: ${excerpt.eventId}`);

  const mentionId = `${periodId}:${excerpt.eventId}:mention`;
  const mention = getMention.get(mentionId);
  if (!mention) throw new Error(`Missing source mention: ${mentionId}`);

  const rawPatch = {
    originalTextStatus: "verified-transcribed",
    transcriptionSource: "Wikisource",
    transcriptionSourceUrl: excerpt.sourceUrl,
    disputeNote: null,
  };

  updateEvent.run(
    mergeJson(event.raw_json, {
      originalTextCoverage: "seeded-final-pass",
      primarySourceUrl: excerpt.sourceUrl,
      evidenceStatus: "primary-source-excerpt",
    }),
    excerpt.eventId,
  );

  updateMention.run(
    excerpt.sourceId,
    excerpt.workTitle,
    excerpt.bookTitle,
    excerpt.chapterTitle,
    excerpt.locator,
    excerpt.quote,
    excerpt.translation,
    mergeJson(mention.raw_json, rawPatch),
    mentionId,
  );

  for (const row of getEvidenceRows.all(mentionId)) {
    updateEvidence.run(
      excerpt.sourceId,
      excerpt.locator,
      excerpt.quote,
      mergeJson(row.raw_json, rawPatch),
      mentionId,
    );
  }

  const sourceDocId = `source-mention:${mentionId}`;
  const sourceDoc = getSearchDocument.get(sourceDocId);
  if (sourceDoc) {
    updateSearchDocument.run(
      compactText([
        `${excerpt.workTitle}·${excerpt.bookTitle} ${excerpt.locator}`,
        excerpt.quote,
        excerpt.translation,
      ]),
      mergeJson(sourceDoc.raw_json, {
        ...rawPatch,
        evidenceSubjectId: excerpt.eventId,
        documentKind: "source-mention",
      }),
      sourceDocId,
    );
  }

  const eventDocId = `event:${excerpt.eventId}`;
  const eventDoc = getSearchDocument.get(eventDocId);
  if (eventDoc) {
    updateSearchDocument.run(
      compactText([
        event.title,
        event.display_time,
        event.summary,
        `原文证据：${excerpt.quote}`,
        `出处：${excerpt.workTitle}，${excerpt.locator}`,
      ]),
      mergeJson(eventDoc.raw_json, {
        ...rawPatch,
        documentKind: "event",
        sourceId: excerpt.sourceId,
      }),
      eventDocId,
    );
  }
}

db.exec("BEGIN");
try {
  for (const excerpt of excerpts) patchExcerpt(excerpt);
  db.exec("COMMIT");
  console.log(`Finalized ${excerpts.length} 550/557 source excerpts.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
