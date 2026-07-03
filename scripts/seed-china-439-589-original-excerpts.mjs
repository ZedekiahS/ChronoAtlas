import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-439-589-original-excerpts";
const periodId = "china-wei-jin-northern-southern-310-589";
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

const sources = [
  ["zizhi-tongjian-qi", "资治通鉴·齐纪", "資治通鑑·齊紀", "南齐至北魏孝文帝时代编年主干。"],
  ["zizhi-tongjian-liang", "资治通鉴·梁纪", "資治通鑑·梁紀", "梁、东魏、西魏、北齐初年编年主干。"],
  ["zizhi-tongjian-chen", "资治通鉴·陈纪", "資治通鑑·陳紀", "陈、北周、北齐后期、隋代周前后编年主干。"],
  ["zizhi-tongjian-sui", "资治通鉴·隋纪", "資治通鑑·隋紀", "隋灭陈与南北统一编年主干。"],
];

const excerpts = [
  {
    eventId: "china-439-northern-wei-unifies-north",
    sourceId: "zizhi-tongjian-song",
    workTitle: "资治通鉴",
    bookTitle: "宋纪",
    chapterTitle: "卷一百二十三",
    locator: "宋纪五，元嘉十六年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷123",
    quote:
      "姑臧城潰，牧犍帥其文武五千人面縛請降，魏主釋其縛而禮之。收其城內戶口二十餘萬，倉庫珍寶不可勝計。",
    translation:
      "北魏攻破姑臧，北凉沮渠牧犍率文武请降，北方主要割据政权至此被北魏整合。",
    confidence: "high",
  },
  {
    eventId: "china-493-xiaowen-luoyang",
    sourceId: "zizhi-tongjian-qi",
    workTitle: "资治通鉴",
    bookTitle: "齐纪",
    chapterTitle: "卷一百三十八",
    locator: "齐纪四，永明十一年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷138",
    quote:
      "魏主以平城地寒，六月雨雪，風沙常起，將遷都洛陽；恐群臣不從，乃議大舉伐齊，欲以脅眾。",
    translation:
      "北魏孝文帝以平城不适合文治为由谋迁洛阳，并借南伐议题推动群臣接受迁都。",
    confidence: "high",
  },
  {
    eventId: "china-523-six-garrisons",
    sourceId: "zizhi-tongjian-liang",
    workTitle: "资治通鉴",
    bookTitle: "梁纪",
    chapterTitle: "卷一百四十九",
    locator: "梁纪五，普通四年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷149",
    quote:
      "未幾，沃野鎮民破六韓拔陵聚眾反，殺鎮將，改元真王，諸鎮華、夷之民往往響應。",
    translation:
      "沃野镇破六韩拔陵起兵，杀镇将并改元，各镇汉人与非汉族群相继响应，六镇之乱爆发。",
    confidence: "high",
  },
  {
    eventId: "china-534-northern-wei-splits",
    sourceId: "zizhi-tongjian-liang",
    workTitle: "资治通鉴",
    bookTitle: "梁纪",
    chapterTitle: "卷一百五十六",
    locator: "梁纪十二，中大通六年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷156",
    quote:
      "遂立清河王世子善見為帝，謂但曰：「欲立王，不如立王之子。」丙寅，孝靜帝即位於城東北，時年十一。大赦，改元天平。",
    translation:
      "高欢另立元善见为孝静帝，东魏政权形成；与关中的宇文泰集团并立，北魏分裂格局确立。",
    confidence: "high",
  },
  {
    eventId: "china-548-hou-jing-rebellion",
    sourceId: "zizhi-tongjian-liang",
    workTitle: "资治通鉴",
    bookTitle: "梁纪",
    chapterTitle: "卷一百六十一",
    locator: "梁纪十七，太清二年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷161",
    quote:
      "癸丑，黯開門納景，景遣其將分守四門，詰責黯，將斬之；既而撫手大笑，置酒極歡。",
    translation:
      "侯景败后进入寿阳并控制城防，成为其南下扰乱梁朝政局的关键转折。",
    confidence: "high",
  },
  {
    eventId: "china-550-northern-qi-founded",
    sourceId: "zizhi-tongjian-liang",
    workTitle: "资治通鉴",
    bookTitle: "梁纪",
    chapterTitle: "卷一百六十三",
    locator: "梁纪十九，大宝元年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷163",
    quote:
      "徐之才、宋景業等日陳陰陽雜占，雲宜早受命。高德政亦敦勸不已。洋使術士李密卜之，遇《大橫》，曰：「漢文之卦也。」",
    translation:
      "高洋在高德政、徐之才、宋景业等推动下准备受禅，北齐建国进入实际操作阶段。",
    confidence: "medium",
    dispute: "此条摘录支撑高洋受禅前奏；后续可再补正式即位礼文段落。",
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
      "春，正月，辛丑，周公即天王位，柴燎告天，朝百官於露門；追尊王考文公為文王，妣為文後；大赦。",
    translation:
      "宇文觉即天王位，北周正式承接西魏政权；同年南方陈朝建立，南北格局重组。",
    confidence: "medium",
    dispute: "本条先补北周建国原文；陈霸先受禅段落需继续补入同事件第二条证据。",
  },
  {
    eventId: "china-577-northern-zhou-destroys-qi",
    sourceId: "zizhi-tongjian-chen",
    workTitle: "资治通鉴",
    bookTitle: "陈纪",
    chapterTitle: "卷一百七十三",
    locator: "陈纪七，太建九年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷173",
    quote:
      "周師至鄴城下；癸巳，圍之，燒城西門。齊人出戰，周師奮擊，大破之。齊上皇從百騎東走。",
    translation:
      "北周军围邺并击溃北齐军，北齐核心政权崩解，北方重新归于北周。",
    confidence: "high",
  },
  {
    eventId: "china-581-sui-founded",
    sourceId: "zizhi-tongjian-chen",
    workTitle: "资治通鉴",
    bookTitle: "陈纪",
    chapterTitle: "卷一百七十五",
    locator: "陈纪九，太建十三年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷175",
    quote:
      "甲子，命兼太傅□巳公椿奉冊，大宗伯趙煚奉皇帝璽紱，禪位於隋。隋主冠遠遊冠；受冊、璽，改服紗帽、黃袍。",
    translation:
      "北周静帝禅位于隋，杨坚受册玺，隋朝建立并改元开皇。",
    confidence: "high",
  },
  {
    eventId: "china-589-sui-conquers-chen",
    sourceId: "zizhi-tongjian-sui",
    workTitle: "资治通鉴",
    bookTitle: "隋纪",
    chapterTitle: "卷一百七十七",
    locator: "隋纪一，开皇九年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷177",
    quote:
      "於是陳國皆平，得州三十，郡一百，縣四百，詔建康城邑宮室，並平蕩耕墾，更於石頭置蔣州。",
    translation:
      "隋灭陈后平定陈境，取得三十州、一百郡、四百县，南北统一完成。",
    confidence: "high",
  },
];

const upsertSource = db.prepare(`
  INSERT INTO sources (
    id, title, author, type, citation_short, url, language, corpus_id, note, raw_json,
    original_title, source_type, date_label, reliability_level, review_status
  )
  VALUES (?, ?, '司马光', 'chronicle', ?, NULL, 'zh-Hant', ?, ?, ?, ?, 'chronicle', '北宋编年史', 'high', 'reviewed')
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    author = excluded.author,
    type = excluded.type,
    citation_short = excluded.citation_short,
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
const getEvidenceRows = db.prepare("SELECT id, raw_json FROM evidence_links WHERE mention_id = ?");
const updateEvidence = db.prepare(`
  UPDATE evidence_links
  SET source_id = ?, locator = ?, quote = ?, confidence = ?, raw_json = ?
  WHERE mention_id = ?
`);
const getSearchDocument = db.prepare("SELECT * FROM search_documents WHERE id = ?");
const updateSearchDocument = db.prepare(`
  UPDATE search_documents
  SET body = ?, review_status = ?, raw_json = ?
  WHERE id = ?
`);

function seedSources() {
  for (const [id, title, originalTitle, note] of sources) {
    upsertSource.run(
      id,
      title,
      title.replace("资治通鉴", "《资治通鉴").replace("·", "·").concat("》"),
      corpusId,
      note,
      JSON.stringify({
        batchId,
        originalTextStatus: "verified-transcribed",
        transcriptionSource: "Wikisource",
      }),
      originalTitle,
    );
  }
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

  const reviewStatus = excerpt.confidence === "high" ? "reviewed" : "draft";

  updateEvent.run(
    excerpt.confidence,
    reviewStatus,
    mergeJson(event.raw_json, {
      originalTextCoverage: "seeded-second-pass",
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
    reviewStatus,
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
        `${excerpt.workTitle}·${excerpt.bookTitle} ${excerpt.locator}`,
        excerpt.quote,
        excerpt.translation,
        excerpt.dispute ? `争议说明：${excerpt.dispute}` : "",
      ]),
      reviewStatus,
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
      reviewStatus,
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
  seedSources();
  for (const excerpt of excerpts) patchExcerpt(excerpt);
  db.exec("COMMIT");
  console.log(`Seeded ${excerpts.length} verified source excerpts for 439-589.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
