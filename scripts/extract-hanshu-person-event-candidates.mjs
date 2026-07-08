import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(rootDir, "db", "chronoatlas.sqlite");
const batchId = "auto-hanshu-person-event-candidates";
const provider = "chronoatlas-rule-extractor";
const now = new Date().toISOString();

const annotationStarts = [
  "師古曰",
  "如淳曰",
  "臣瓚曰",
  "瓚曰",
  "文穎曰",
  "服虔曰",
  "蘇林曰",
  "孟康曰",
  "應劭曰",
  "晉灼曰",
  "韋昭曰",
  "張晏曰",
  "荀悅曰",
  "李奇曰",
  "鄭氏曰",
  "臣昭曰",
];

const classifiers = [
  {
    factType: "military",
    label: "军事",
    keywords: ["攻", "擊", "战", "戰", "伐", "兵", "軍", "破", "圍", "斬", "降", "寇", "略", "將兵", "匈奴", "南越", "朝鮮", "西域", "城"],
  },
  {
    factType: "succession",
    label: "继承与宫廷",
    keywords: ["即位", "立為", "立为", "尊", "崩", "薨", "卒", "殺", "杀", "誅", "诛", "廢", "废", "王莽", "攝政", "称帝", "稱帝"],
  },
  {
    factType: "administration",
    label: "内政与行政",
    keywords: ["詔", "诏", "令", "赦", "置", "罷", "罢", "徙", "封", "郡", "縣", "县", "官", "丞相", "太尉", "御史", "都護", "都护"],
  },
  {
    factType: "diplomacy",
    label: "外交与边疆",
    keywords: ["使", "遣", "和親", "和亲", "朝", "質", "质", "單于", "单于", "烏孫", "乌孙", "大宛", "月氏", "西域", "羌", "南越", "朝鮮"],
  },
  {
    factType: "economy",
    label: "经济财政",
    keywords: ["錢", "钱", "幣", "币", "鹽", "盐", "鐵", "铁", "田", "租", "賦", "赋", "財", "财", "粟", "漕", "均輸", "平準"],
  },
  {
    factType: "law",
    label: "法律刑政",
    keywords: ["律", "令", "刑", "獄", "狱", "坐", "赦", "罪", "法", "誅", "诛"],
  },
  {
    factType: "culture",
    label: "文化制度",
    keywords: ["博士", "儒", "經", "经", "禮", "礼", "樂", "乐", "曆", "历", "書", "书", "太學", "太学", "郊祀"],
  },
];

const sourceTypeRules = [
  ["紀", "annal", "纪"],
  ["表", "table", "表"],
  ["志", "treatise", "志"],
  ["傳", "biography", "传"],
];

const titleAliasPeople = [
  ["高祖", "刘邦"],
  ["高帝", "刘邦"],
  ["沛公", "刘邦"],
  ["劉邦", "刘邦"],
  ["劉季", "刘邦"],
  ["呂后", "吕雉"],
  ["呂雉", "吕雉"],
  ["高后", "吕雉"],
  ["文帝", "刘恒"],
  ["景帝", "刘启"],
  ["武帝", "刘彻"],
  ["昭帝", "刘弗陵"],
  ["宣帝", "刘询"],
  ["元帝", "刘奭"],
  ["成帝", "刘骜"],
  ["哀帝", "刘欣"],
  ["平帝", "刘衎"],
  ["王莽", "王莽"],
  ["王政君", "王政君"],
  ["蕭何", "萧何"],
  ["萧何", "萧何"],
  ["曹參", "曹参"],
  ["曹参", "曹参"],
  ["張良", "张良"],
  ["张良", "张良"],
  ["韓信", "韩信"],
  ["韩信", "韩信"],
  ["項羽", "项羽"],
  ["项羽", "项羽"],
  ["晁錯", "晁错"],
  ["晁错", "晁错"],
  ["董仲舒", "董仲舒"],
  ["衛青", "卫青"],
  ["卫青", "卫青"],
  ["霍去病", "霍去病"],
  ["張騫", "张骞"],
  ["张骞", "张骞"],
  ["司馬遷", "司马迁"],
  ["司马迁", "司马迁"],
  ["霍光", "霍光"],
  ["陳勝", "陈胜"],
  ["陳涉", "陈胜"],
  ["吴廣", "吴广"],
  ["吳廣", "吴广"],
  ["黥布", "黥布"],
  ["彭越", "彭越"],
  ["英布", "英布"],
  ["周勃", "周勃"],
  ["陳平", "陈平"],
  ["陈平", "陈平"],
  ["賈誼", "贾谊"],
  ["贾谊", "贾谊"],
  ["袁盎", "袁盎"],
  ["李廣", "李广"],
  ["李广", "李广"],
  ["蘇武", "苏武"],
  ["苏武", "苏武"],
  ["李陵", "李陵"],
  ["李廣利", "李广利"],
  ["李广利", "李广利"],
  ["金日磾", "金日磾"],
  ["張湯", "张汤"],
  ["张汤", "张汤"],
  ["桑弘羊", "桑弘羊"],
];

function stableId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
}

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function parseJson(value, fallback = {}) {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function compactWhitespace(value) {
  return String(value ?? "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBracketNotes(value) {
  return compactWhitespace(value)
    .replace(/〔[一二三四五六七八九０十百]+〕/g, "")
    .replace(/[〈〉]/g, "");
}

function sourceSectionType(title) {
  for (const [token, type, label] of sourceTypeRules) {
    if (title.includes(token)) {
      return { type, label };
    }
  }
  return { type: "source", label: "史料" };
}

function splitSentences(text) {
  return stripBracketNotes(text)
    .split(/(?<=[。！？；;])|[\r\n]+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isAnnotation(sentence) {
  if (annotationStarts.some((start) => sentence.includes(start))) {
    return true;
  }
  return /曰：「[^」]{0,24}(音|謂|讀曰|字|反|古|今)/u.test(sentence);
}

function classifySentence(sentence) {
  const scores = classifiers.map((classifier) => ({
    ...classifier,
    score: classifier.keywords.reduce((sum, keyword) => sum + (sentence.includes(keyword) ? 1 : 0), 0),
  }));
  scores.sort((left, right) => right.score - left.score);
  const best = scores[0];
  if (!best || best.score === 0) {
    return null;
  }

  const scaleScore =
    best.score +
    (/(天下|皇帝|即位|崩|匈奴|西域|南越|朝鮮|王莽|七國|大赦|反|叛|都護|單于)/u.test(sentence) ? 2 : 0) +
    (sentence.length > 70 ? 1 : 0);
  const eventScale = scaleScore >= 5 ? "major" : scaleScore >= 3 ? "medium" : "minor";
  return {
    factType: best.factType,
    factTypeLabel: best.label,
    eventScale,
    confidence: best.score >= 3 ? "medium" : "low",
  };
}

function extractPeople(sentence, sourceTitle, knownNames) {
  const found = new Map();
  for (const [needle, label] of titleAliasPeople) {
    if (sentence.includes(needle) || sourceTitle.includes(needle)) {
      found.set(label, label);
    }
  }
  for (const name of knownNames) {
    if (name && (sentence.includes(name) || sourceTitle.includes(name))) {
      found.set(name, name);
    }
  }
  return [...found.values()].slice(0, 12);
}

function eventLabel(sentence, classification) {
  const clean = sentence
    .replace(/^([一二三四五六七八九十元後正闰閏春夏秋冬年月日，、\s]+)/u, "")
    .replace(/[。！？；;]$/u, "")
    .trim();
  const prefix = classification.factTypeLabel;
  return `${prefix}：${clean.slice(0, 34)}${clean.length > 34 ? "…" : ""}`;
}

function shouldKeepSentence(sentence) {
  if (sentence.length < 12 || sentence.length > 260) {
    return false;
  }
  if (isAnnotation(sentence)) {
    return false;
  }
  if (/^(首頁|經部|史部|子部|集部|專題|目錄頁|下一頁)/u.test(sentence)) {
    return false;
  }
  if (/(凡百篇|述漢書|述汉书|綜其行事|本紀|列傳|列传)/u.test(sentence)) {
    return false;
  }
  if (/(音|讀曰|读曰|謂|谓|字本|古字|假借|正音|故知|當作|当作|地理志|括地志|水經|水经|索隱|索隐|訓|训)/u.test(sentence)) {
    return false;
  }
  if (/(人也|者也|母曰|父曰|姓.+氏)/u.test(sentence) && !/(即位|立為|立为|尊|崩|薨|卒|殺|杀|誅|诛|廢|废|攝政|称帝|稱帝|攻|擊|击|戰|战|伐|置|封|徙)/u.test(sentence)) {
    return false;
  }
  return /(帝|王|后|侯|相|將|兵|軍|詔|令|郡|縣|匈奴|西域|南越|朝鮮|太子|皇后|單于|反|叛|殺|誅|攻|擊|戰|伐|置|罷|封|徙)/u.test(sentence);
}

function documentBody({ title, sourceTitle, locator, sentence, people, classification, section }) {
  const parts = [
    title,
    `来源：${sourceTitle}`,
    `位置：${locator}`,
    `分类：${classification.factTypeLabel}`,
    `粒度：${classification.eventScale}`,
    `卷类：${section.label}`,
    people.length ? `人物：${people.join("、")}` : null,
    sentence,
  ];
  return parts.filter(Boolean).join("\n\n");
}

function topicIdForFactType(factType) {
  switch (factType) {
    case "military":
      return "military";
    case "succession":
      return "succession";
    case "administration":
      return "political_structure";
    case "diplomacy":
      return "political_structure";
    case "economy":
      return "reform";
    case "law":
      return "reform";
    case "culture":
      return "source_criticism";
    default:
      return "source_criticism";
  }
}

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA foreign_keys = ON;");

  const knownNames = db.prepare(`
    SELECT DISTINCT name
    FROM persons
    WHERE region = 'china'
      AND length(name) BETWEEN 2 AND 4
  `).all().map((row) => row.name);

  const sources = db.prepare(`
    SELECT s.id, s.title, s.raw_json, COUNT(sp.id) AS passage_count
    FROM sources s
    JOIN source_passages sp ON sp.source_id = s.id
    WHERE s.id LIKE 'hanshu-guoxue123-%'
    GROUP BY s.id
    ORDER BY s.id
  `).all();

  if (!sources.length) {
    throw new Error("No Hanshu source passages found. Run the domestic fulltext import first.");
  }

  const passages = db.prepare(`
    SELECT sp.id, sp.source_id, sp.locator, sp.sequence, sp.text
    FROM source_passages sp
    WHERE sp.source_id LIKE 'hanshu-guoxue123-%'
    ORDER BY sp.source_id, sp.sequence
  `).all();

  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const candidates = [];
  const perSourceCounts = new Map();

  for (const passage of passages) {
    const source = sourceMap.get(passage.source_id);
    const sourceRaw = parseJson(source.raw_json, {});
    const sourceTitle = sourceRaw.title ? `汉书·${sourceRaw.title}` : source.title;
    const section = sourceSectionType(sourceTitle);

    for (const [sentenceIndex, sentence] of splitSentences(passage.text).entries()) {
      if (!shouldKeepSentence(sentence)) {
        continue;
      }
      const classification = classifySentence(sentence);
      if (!classification) {
        continue;
      }
      const people = extractPeople(sentence, sourceTitle, knownNames);
      const title = eventLabel(sentence, classification);
      const idBasis = `${passage.id}:${sentenceIndex}:${sentence}`;
      candidates.push({
        id: stableId(idBasis),
        source,
        sourceTitle,
        section,
        passage,
        sentenceIndex,
        sentence,
        title,
        people,
        classification,
      });
      perSourceCounts.set(source.id, (perSourceCounts.get(source.id) ?? 0) + 1);
    }
  }

  const insertBatch = db.prepare(`
    INSERT INTO import_batches (id, created_at, source_provider, source_root, status, notes, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      created_at = excluded.created_at,
      source_provider = excluded.source_provider,
      source_root = excluded.source_root,
      status = excluded.status,
      notes = excluded.notes,
      raw_json = excluded.raw_json
  `);
  const insertFile = db.prepare(`
    INSERT INTO import_draft_files (
      id, batch_id, relative_path, sha256, source_provider, corpus_hint, collection_hint,
      card_count, error_count, warning_count, import_status, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'staged', ?, ?)
    ON CONFLICT(batch_id, relative_path) DO UPDATE SET
      sha256 = excluded.sha256,
      source_provider = excluded.source_provider,
      corpus_hint = excluded.corpus_hint,
      collection_hint = excluded.collection_hint,
      card_count = excluded.card_count,
      import_status = excluded.import_status,
      raw_json = excluded.raw_json,
      created_at = excluded.created_at
  `);
  const insertCard = db.prepare(`
    INSERT INTO import_evidence_cards (
      id, batch_id, file_id, card_index, source_title, source_type, author, commentary_author,
      quoted_work, section, locator, year, display_date, original_text, translation,
      people_core_json, people_mentioned_json, places_json, macro_event, event_label,
      fact_brief, fact_detailed, fact_type, confidence, questions_json, review_status,
      validation_errors_json, validation_warnings_json, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, NULL, ?, NULL, ?, '[]', '[]', ?, ?, ?, ?, ?, ?, ?, 'staged', '[]', ?, ?, ?)
    ON CONFLICT(file_id, card_index) DO UPDATE SET
      source_title = excluded.source_title,
      source_type = excluded.source_type,
      quoted_work = excluded.quoted_work,
      section = excluded.section,
      locator = excluded.locator,
      original_text = excluded.original_text,
      people_core_json = excluded.people_core_json,
      macro_event = excluded.macro_event,
      event_label = excluded.event_label,
      fact_brief = excluded.fact_brief,
      fact_detailed = excluded.fact_detailed,
      fact_type = excluded.fact_type,
      confidence = excluded.confidence,
      questions_json = excluded.questions_json,
      review_status = excluded.review_status,
      validation_warnings_json = excluded.validation_warnings_json,
      raw_json = excluded.raw_json,
      created_at = excluded.created_at
  `);
  const insertMention = db.prepare(`
    INSERT INTO source_mentions (
      id, source_id, passage_id, work_title, book_title, chapter_title, locator,
      year, text, translation, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, '汉书', ?, ?, ?, NULL, ?, NULL, ?, 'draft', ?)
    ON CONFLICT(id) DO UPDATE SET
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      book_title = excluded.book_title,
      chapter_title = excluded.chapter_title,
      locator = excluded.locator,
      text = excluded.text,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);
  const insertTag = db.prepare(`
    INSERT OR REPLACE INTO source_mention_tags (mention_id, tag, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertDocument = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, 'source_mentions', ?, ?, ?, 'zh-Hans', 'china', NULL, ?, NULL, NULL, 'draft', ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_table = excluded.subject_table,
      subject_id = excluded.subject_id,
      title = excluded.title,
      body = excluded.body,
      region_id = excluded.region_id,
      period_id = excluded.period_id,
      topic_id = excluded.topic_id,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);

  db.exec("BEGIN;");
  try {
    db.prepare("DELETE FROM import_batches WHERE id = ?").run(batchId);
    db.prepare("DELETE FROM search_documents WHERE id LIKE 'hanshu-auto-candidate:%'").run();
    db.prepare("DELETE FROM source_mentions WHERE id LIKE 'hanshu-auto-candidate:%'").run();

    insertBatch.run(
      batchId,
      now,
      provider,
      "sqlite:sources/source_passages:hanshu-guoxue123-%",
      "staged",
      "Rule-based full-pass extraction of Hanshu person/event candidates. Candidates are not reviewed facts.",
      toJson({
        work: "汉书",
        sourceScope: "hanshu-guoxue123-%",
        sourceCount: sources.length,
        passageCount: passages.length,
        candidateCount: candidates.length,
      }),
    );

    const sourceCardIndexes = new Map();
    for (const source of sources) {
      const fileId = `hanshu-auto-file:${stableId(source.id)}`;
      const cardCount = perSourceCounts.get(source.id) ?? 0;
      insertFile.run(
        fileId,
        batchId,
        `sqlite/${source.id}`,
        stableId(`${source.id}:${cardCount}`),
        provider,
        "china-western-han",
        "hanshu-person-event-candidates",
        cardCount,
        toJson({ sourceId: source.id, title: source.title }),
        now,
      );
      sourceCardIndexes.set(source.id, { fileId, index: 0 });
    }

    for (const candidate of candidates) {
      const sourceIndex = sourceCardIndexes.get(candidate.source.id);
      const cardIndex = sourceIndex.index++;
      const mentionId = `hanshu-auto-candidate:${candidate.id}`;
      const cardId = `card:hanshu-auto:${candidate.id}`;
      const documentId = `hanshu-auto-candidate:${candidate.id}`;
      const raw = {
        generatedFrom: batchId,
        sourceId: candidate.source.id,
        passageId: candidate.passage.id,
        sentenceIndex: candidate.sentenceIndex,
        sourceSectionType: candidate.section.type,
      sourceSectionLabel: candidate.section.label,
        periodHint: "china-western-han",
        eventScale: candidate.classification.eventScale,
        eventTypeLabel: candidate.classification.factTypeLabel,
        extractedPeople: candidate.people,
        reviewGuidance: "machine-candidate; verify against the source before promotion",
      };
      const body = documentBody({
        title: candidate.title,
        sourceTitle: candidate.sourceTitle,
        locator: candidate.passage.locator,
        sentence: candidate.sentence,
        people: candidate.people,
        classification: candidate.classification,
        section: candidate.section,
      });

      insertCard.run(
        cardId,
        batchId,
        sourceIndex.fileId,
        cardIndex,
        candidate.sourceTitle,
        candidate.section.type,
        "班固",
        "汉书",
        candidate.section.label,
        candidate.passage.locator,
        candidate.sentence,
        toJson(candidate.people),
        "汉书全量候选抽取",
        candidate.title,
        candidate.sentence.slice(0, 96),
        candidate.sentence,
        candidate.classification.factType,
        candidate.classification.confidence,
        toJson(["核对人物是否为核心参与者", "核对该句是否能独立形成事件卡", "必要时补充精确年份"]),
        toJson([`candidateScale:${candidate.classification.eventScale}`]),
        toJson(raw),
        now,
      );

      insertMention.run(
        mentionId,
        candidate.source.id,
        candidate.passage.id,
        candidate.sourceTitle,
        candidate.section.label,
        candidate.passage.locator,
        candidate.sentence,
        candidate.classification.confidence,
        toJson(raw),
      );

      const tags = [
        `fact:${candidate.classification.factType}`,
        `scale:${candidate.classification.eventScale}`,
        `source-section:${candidate.section.type}`,
        ...candidate.people.map((name) => `person:${name}`),
      ];
      tags.forEach((tag, index) => insertTag.run(mentionId, tag, index));

      insertDocument.run(
        documentId,
        mentionId,
        candidate.title,
        body,
        topicIdForFactType(candidate.classification.factType),
        toJson(raw),
      );
    }

    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  const byType = db.prepare(`
    SELECT fact_type AS factType, COUNT(*) AS count
    FROM import_evidence_cards
    WHERE batch_id = ?
    GROUP BY fact_type
    ORDER BY count DESC
  `).all(batchId);
  const byScale = db.prepare(`
    SELECT json_extract(raw_json, '$.eventScale') AS scale, COUNT(*) AS count
    FROM import_evidence_cards
    WHERE batch_id = ?
    GROUP BY scale
    ORDER BY count DESC
  `).all(batchId);
  const peopleCount = db.prepare(`
    SELECT COUNT(DISTINCT value) AS count
    FROM import_evidence_cards, json_each(people_core_json)
    WHERE batch_id = ?
  `).get(batchId).count;

  console.log(`Extracted ${candidates.length} Hanshu person/event candidates`);
  console.log(`sources=${sources.length}, passages=${passages.length}, distinctPeople=${peopleCount}`);
  console.log(`byType=${JSON.stringify(byType)}`);
  console.log(`byScale=${JSON.stringify(byScale)}`);
} finally {
  db.close();
}
