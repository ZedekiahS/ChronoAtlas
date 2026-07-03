import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-420-original-excerpts";
const periodId = "china-wei-jin-northern-southern-310-589";
const regionId = "china";
const corpusId = "china-wei-jin-northern-southern";

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

const sourcePatch = {
  id: "zizhi-tongjian-song",
  title: "资治通鉴·宋纪",
  author: "司马光",
  type: "chronicle",
  citation: "《资治通鉴·宋纪》",
  url: "https://zh.wikisource.org/wiki/資治通鑑/卷119",
  note: "刘宋建国前后编年主干；用于 420 年刘裕受禅建宋事件的可核原文证据。",
  originalTitle: "資治通鑑·宋紀",
  dateLabel: "北宋编年史",
  reliability: "high",
};

const excerpts = [
  {
    eventId: "china-304-liu-yuan-han-zhao",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷八十五",
    locator: "晋纪七，永兴元年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷085",
    quote:
      "淵遷都左國城，胡、晉歸之者愈眾。乃建國號曰漢。劉宣等請上尊號，淵曰：「今四方未定，且可依高祖稱漢王。」於是即漢王位，大赦，改元曰元熙。",
    translation:
      "刘渊迁都左国城，归附者增多，随后建国号为汉，先称汉王，改元元熙。",
    confidence: "high",
  },
  {
    eventId: "china-311-yongjia-luoyang",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷八十七",
    locator: "晋纪九，永嘉五年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷087",
    quote:
      "王彌、呼延晏克宣陽門，入南宮，升太極前殿，縱兵大掠。帝出華林園門，欲奔長安，漢兵追執之，幽於端門。",
    translation:
      "王弥、呼延晏攻入洛阳宫城，晋怀帝出逃不成，被汉兵追执。",
    confidence: "high",
  },
  {
    eventId: "china-316-changan-falls-western-jin",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷八十九",
    locator: "晋纪十一，建兴四年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷089",
    quote:
      "帝泣謂允曰：「今窮厄如此，外無救援，當忍恥出降，以活士民。」乙未，帝乘羊車，肉袒、銜璧、輿櫬出東門降。",
    translation:
      "晋愍帝在长安外援断绝后出降，西晋至此实际终结。",
    confidence: "high",
  },
  {
    eventId: "china-317-eastern-jin-jiankang",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷九十",
    locator: "晋纪十二，建武元年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷090",
    quote:
      "辛卯，即晉王位，大赦，改元；始備百官，立宗廟，建社稷。",
    translation:
      "司马睿即晋王位，设置百官、宗庙和社稷，江东政权制度化。",
    confidence: "high",
  },
  {
    eventId: "china-321-zu-ti-northern-expedition",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷九十",
    locator: "晋纪十二，太兴年间",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷090",
    quote:
      "逖既入譙城，石勒遣石虎圍譙，王含復遣桓宣救之，虎解去。逖表宣為譙國內史。",
    translation:
      "祖逖进入谯城后，石勒遣石虎围攻，晋方援军到来后石虎解围。",
    confidence: "medium",
    dispute:
      "此条用《资治通鉴》太兴年间战事作为祖逖北伐活动证据；321 年节点仍需后续用《晋书·祖逖传》补强。",
  },
  {
    eventId: "china-329-later-zhao-destroys-former-zhao",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷九十四",
    locator: "晋纪十六，咸和四年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷094",
    quote:
      "趙太子熙聞趙主曜被擒，大懼，與南陽王胤謀西保秦州。尚書胡勳曰：「今雖喪君，境土尚完，將士不叛，且當並力拒之。」",
    translation:
      "刘曜被擒后，前赵太子刘熙与刘胤西奔秦州，关中形势瓦解。",
    confidence: "high",
  },
  {
    eventId: "china-383-fei-river",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷一百五",
    locator: "晋纪二十七，太元八年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷105",
    quote:
      "秦兵遂退，不可復止，謝玄、謝琰、桓伊等引兵渡水擊之。融馳騎略陳，欲以帥退者，馬倒，為晉兵所殺，秦兵遂潰。",
    translation:
      "秦军后退失控，谢玄、谢琰、桓伊等渡水进击，苻融战死，秦军溃败。",
    confidence: "high",
  },
  {
    eventId: "china-420-liu-yu-founds-song",
    sourceId: "zizhi-tongjian-song",
    workTitle: "资治通鉴",
    bookTitle: "宋纪",
    chapterTitle: "卷一百一十九",
    locator: "宋纪一，永初元年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷119",
    quote:
      "宋王欲受禪而難於發言，乃集朝臣宴飲，從容言曰：「桓玄篡位，鼎命已移。我首唱大義，興復帝室，南征北伐，平定四海。」",
    translation:
      "刘裕在受禅前以平定内外、恢复晋室为功业叙述，为代晋建宋铺垫。",
    confidence: "high",
  },
];

const upsertSource = db.prepare(`
  INSERT INTO sources (
    id, title, author, type, citation_short, url, language, corpus_id, note, raw_json,
    original_title, source_type, date_label, reliability_level, review_status
  )
  VALUES (?, ?, ?, ?, ?, ?, 'zh-Hant', ?, ?, ?, ?, ?, ?, ?, 'reviewed')
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    author = excluded.author,
    type = excluded.type,
    citation_short = excluded.citation_short,
    url = excluded.url,
    language = excluded.language,
    corpus_id = excluded.corpus_id,
    note = excluded.note,
    raw_json = excluded.raw_json,
    original_title = excluded.original_title,
    source_type = excluded.source_type,
    date_label = excluded.date_label,
    reliability_level = excluded.reliability_level,
    review_status = excluded.review_status
`);

const getEvent = db.prepare("SELECT * FROM events WHERE id = ?");
const getMention = db.prepare("SELECT * FROM source_mentions WHERE id = ?");
const updateEvent = db.prepare("UPDATE events SET confidence = ?, review_status = ?, raw_json = ? WHERE id = ?");
const updateMention = db.prepare(`
  UPDATE source_mentions
  SET source_id = ?, work_title = ?, book_title = ?, chapter_title = ?, locator = ?,
      text = ?, translation = ?, confidence = ?, review_status = ?, raw_json = ?
  WHERE id = ?
`);
const updateEvidence = db.prepare(`
  UPDATE evidence_links
  SET source_id = ?, locator = ?, quote = ?, confidence = ?, raw_json = ?
  WHERE mention_id = ?
`);
const getEvidenceRows = db.prepare("SELECT id, raw_json FROM evidence_links WHERE mention_id = ?");
const getSearchDocument = db.prepare("SELECT * FROM search_documents WHERE id = ?");
const updateSearchDocument = db.prepare(`
  UPDATE search_documents
  SET body = ?, review_status = ?, raw_json = ?
  WHERE id = ?
`);

function patchSource() {
  upsertSource.run(
    sourcePatch.id,
    sourcePatch.title,
    sourcePatch.author,
    sourcePatch.type,
    sourcePatch.citation,
    sourcePatch.url,
    corpusId,
    sourcePatch.note,
    JSON.stringify({
      batchId,
      originalTextStatus: "verified-transcribed",
      transcriptionSource: "Wikisource",
      transcriptionSourceUrl: sourcePatch.url,
    }),
    sourcePatch.originalTitle,
    sourcePatch.type,
    sourcePatch.dateLabel,
    sourcePatch.reliability,
  );
}

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
    disputeNote: excerpt.dispute ?? null,
  };

  updateEvent.run(
    excerpt.confidence,
    excerpt.confidence === "high" ? "reviewed" : "draft",
    mergeJson(event.raw_json, {
      originalTextCoverage: "seeded-first-pass",
      primarySourceUrl: excerpt.sourceUrl,
      evidenceStatus: excerpt.confidence === "high" ? "primary-source-excerpt" : "primary-source-excerpt-needs-followup",
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
    excerpt.confidence,
    excerpt.confidence === "high" ? "reviewed" : "draft",
    mergeJson(mention.raw_json, rawPatch),
    mentionId,
  );

  for (const row of getEvidenceRows.all(mentionId)) {
    updateEvidence.run(
      excerpt.sourceId,
      excerpt.locator,
      excerpt.quote,
      excerpt.confidence,
      mergeJson(row.raw_json, rawPatch),
      mentionId,
    );
  }

  const sourceDocId = `source-mention:${mentionId}`;
  const sourceDoc = getSearchDocument.get(sourceDocId);
  if (sourceDoc) {
    updateSearchDocument.run(
      compactText([
        `${excerpt.workTitle}${excerpt.bookTitle ? `·${excerpt.bookTitle}` : ""} ${excerpt.locator}`,
        excerpt.quote,
        excerpt.translation,
        excerpt.dispute ? `争议说明：${excerpt.dispute}` : "",
      ]),
      excerpt.confidence === "high" ? "reviewed" : "draft",
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
      excerpt.confidence === "high" ? "reviewed" : "draft",
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
  patchSource();
  for (const excerpt of excerpts) patchExcerpt(excerpt);
  db.exec("COMMIT");
  console.log(`Seeded ${excerpts.length} verified source excerpts for 304-420.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
