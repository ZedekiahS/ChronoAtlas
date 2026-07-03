import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-589-primary-source-excerpts-batch1";
const periodId = "china-wei-jin-northern-southern-310-589";
const regionId = "china";

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function json(value) {
  return JSON.stringify({ batchId, ...value });
}

function mergeJson(value, patch) {
  return JSON.stringify({ ...parseJson(value), batchId, ...patch });
}

function compactText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

const excerpts = [
  {
    key: "jinshu-yongjia-luoyang",
    eventId: "china-311-yongjia-luoyang",
    sourceId: "jinshu",
    workTitle: "晋书",
    bookTitle: "帝纪",
    chapterTitle: "卷五·怀帝纪",
    locator: "永嘉五年六月丁酉",
    sourceUrl: "https://zh.wikisource.org/wiki/晉書/卷005",
    quote: "丁酉、劉曜、王彌入京師。帝開華林園門，出河陰藕池，欲幸長安，爲曜等所追及。",
    translation: "刘曜、王弥进入洛阳，晋怀帝出华林园门欲奔长安，被刘曜等追及。",
  },
  {
    key: "songshu-liu-yu-founds-song",
    eventId: "china-420-liu-yu-founds-song",
    sourceId: "songshu",
    workTitle: "宋书",
    bookTitle: "本纪",
    chapterTitle: "卷三·武帝纪下",
    locator: "永初元年六月丁卯",
    sourceUrl: "https://zh.wikisource.org/wiki/宋書/卷3",
    quote: "夏六月丁卯，設壇於南郊，即皇帝位，柴燎告天。",
    translation: "永初元年六月丁卯，刘裕设坛南郊，即皇帝位，柴燎告天。",
  },
  {
    key: "nanqishu-southern-qi-founded",
    eventId: "china-479-southern-qi-founded",
    sourceId: "nanqishu",
    workTitle: "南齐书",
    bookTitle: "本纪",
    chapterTitle: "卷二·高帝下",
    locator: "建元元年夏四月甲午",
    sourceUrl: "https://zh.wikisource.org/wiki/南齊書/卷2",
    quote: "建元元年夏四月甲午，上即皇帝位於南郊，設壇柴燎告天曰：「皇帝臣道成敢用玄牡，昭告皇皇后帝。」",
    translation: "建元元年四月甲午，萧道成在南郊即皇帝位，设坛柴燎告天，南齐建立。",
  },
  {
    key: "liangshu-liang-founded",
    eventId: "china-502-liang-founded",
    sourceId: "liangshu",
    workTitle: "梁书",
    bookTitle: "本纪",
    chapterTitle: "卷二·武帝中",
    locator: "天监元年夏四月丙寅",
    sourceUrl: "https://zh.wikisource.org/zh-hans/梁書/卷02",
    quote: "天监元年夏四月丙寅，高祖即皇帝位于南郊。设坛柴燎，告类于天曰：“皇帝臣衍，敢用玄牡，昭告于皇天后帝。”",
    translation: "天监元年四月丙寅，萧衍在南郊即皇帝位，设坛柴燎告天，梁朝建立。",
  },
  {
    key: "chenshu-chen-founded",
    eventId: "china-557-northern-zhou-and-chen",
    sourceId: "chenshu",
    workTitle: "陈书",
    bookTitle: "本纪",
    chapterTitle: "卷二·高祖下",
    locator: "永定元年冬十月乙亥",
    sourceUrl: "https://zh.wikisource.org/wiki/陳書/卷2",
    quote: "永定元年冬十月乙亥，高祖即皇帝位于南郊，柴燎告天曰：「皇帝臣霸先，敢用玄牡昭告于皇皇后帝。」",
    translation: "永定元年十月乙亥，陈霸先在南郊即皇帝位，柴燎告天，陈朝建立。",
  },
  {
    key: "weishu-northern-wei-unifies-north",
    eventId: "china-439-northern-wei-unifies-north",
    sourceId: "weishu",
    workTitle: "魏书",
    bookTitle: "帝纪",
    chapterTitle: "卷四上·世祖纪上",
    locator: "太延五年六月至八月",
    sourceUrl: "https://zh.wikisource.org/wiki/魏書/卷4上",
    quote: "六月甲辰，車駕西討沮渠牧犍。八月甲午，永昌王健獲牧犍牛馬畜產二十餘萬。牧犍遣弟董來率萬餘人拒戰於城南，望塵退走。",
    translation: "太武帝亲征沮渠牧犍，北魏军获其畜产，牧犍遣军拒战而退，北凉败局形成。",
  },
  {
    key: "beiqishu-northern-qi-founded",
    eventId: "china-550-northern-qi-founded",
    sourceId: "beiqishu",
    workTitle: "北齐书",
    bookTitle: "本纪",
    chapterTitle: "卷四·文宣帝纪",
    locator: "天保元年",
    sourceUrl: "https://zh.wikisource.org/zh-hans/北齊書/卷4",
    quote: "夏五月辛亥，帝如鄴。甲寅，進相國，總百揆。是日，京師獲赤雀，獻於南郊。事畢，還宮，御太極前殿。",
    translation: "高洋赴邺，被进为相国、总百揆，并在南郊完成受命仪式前后的关键礼制安排。",
  },
  {
    key: "zhoushu-northern-zhou-founded",
    eventId: "china-557-northern-zhou-and-chen",
    sourceId: "zhoushu",
    workTitle: "周书",
    bookTitle: "本纪",
    chapterTitle: "卷三·孝闵帝纪",
    locator: "元年春正月辛丑",
    sourceUrl: "https://zh.wikisource.org/wiki/周書/卷03",
    quote: "元年春正月辛丑，即天王位。柴燎告天，朝百官於路門。追尊皇考文公為文王，皇妣為文后。大赦天下。",
    translation: "宇文觉即天王位，柴燎告天并大赦天下，北周正式建立。",
  },
  {
    key: "suishu-sui-conquers-chen",
    eventId: "china-589-sui-conquers-chen",
    sourceId: "suishu",
    workTitle: "隋书",
    bookTitle: "本纪",
    chapterTitle: "卷二·高祖下",
    locator: "开皇九年春正月",
    sourceUrl: "https://zh.wikisource.org/zh-hans/隋書/卷02",
    quote: "辛未，賀若弼拔陳京口，韓擒虎拔陳南豫州。丙子，賀若弼敗陳師于蔣山，獲其將蕭摩訶。韓擒虎進師入建鄴，獲陳主叔寶。陳國平，合州三十，郡一百，縣四百。",
    translation: "贺若弼、韩擒虎攻入陈境，韩擒虎入建邺俘陈叔宝，陈国平定，南北统一完成。",
  },
  {
    key: "tongjian-jin-fei-river",
    eventId: "china-383-fei-river",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷一百五",
    locator: "晋纪二十七，太元八年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷105",
    quote: "秦兵遂退，不可復止，謝玄、謝琰、桓伊等引兵渡水擊之。融馳騎略陳，欲以帥退者，馬倒，為晉兵所殺，秦兵遂潰。",
    translation: "秦军后退失控，谢玄、谢琰、桓伊等渡水进击，苻融战死，秦军溃败。",
  },
  {
    key: "tongjian-song-northern-wei-unifies-north",
    eventId: "china-439-northern-wei-unifies-north",
    sourceId: "zizhi-tongjian-song",
    workTitle: "资治通鉴",
    bookTitle: "宋纪",
    chapterTitle: "卷一百二十三",
    locator: "宋纪五，元嘉十六年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷123",
    quote: "姑臧城潰，牧犍帥其文武五千人面縛請降，魏主釋其縛而禮之。收其城內戶口二十餘萬，倉庫珍寶不可勝計。",
    translation: "北魏攻破姑臧，北凉沮渠牧犍率文武请降，北方主要割据政权至此被北魏整合。",
  },
  {
    key: "tongjian-qi-xiaowen-luoyang",
    eventId: "china-493-xiaowen-luoyang",
    sourceId: "zizhi-tongjian-qi",
    workTitle: "资治通鉴",
    bookTitle: "齐纪",
    chapterTitle: "卷一百三十八",
    locator: "齐纪四，永明十一年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷138",
    quote: "魏主以平城地寒，六月雨雪，風沙常起，將遷都洛陽；恐群臣不從，乃議大舉伐齊，欲以脅眾。",
    translation: "北魏孝文帝以平城不适合文治为由谋迁洛阳，并借南伐议题推动群臣接受迁都。",
  },
  {
    key: "tongjian-liang-six-garrisons",
    eventId: "china-523-six-garrisons",
    sourceId: "zizhi-tongjian-liang",
    workTitle: "资治通鉴",
    bookTitle: "梁纪",
    chapterTitle: "卷一百四十九",
    locator: "梁纪五，普通四年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷149",
    quote: "未幾，沃野鎮民破六韓拔陵聚眾反，殺鎮將，改元真王，諸鎮華、夷之民往往響應。",
    translation: "沃野镇破六韩拔陵起兵，杀镇将并改元，各镇汉人与非汉族群相继响应，六镇之乱爆发。",
  },
  {
    key: "tongjian-chen-sui-founded",
    eventId: "china-581-sui-founded",
    sourceId: "zizhi-tongjian-chen",
    workTitle: "资治通鉴",
    bookTitle: "陈纪",
    chapterTitle: "卷一百七十五",
    locator: "陈纪九，太建十三年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷175",
    quote: "甲子，命兼太傅□巳公椿奉冊，大宗伯趙煚奉皇帝璽紱，禪位於隋。隋主冠遠遊冠；受冊、璽，改服紗帽、黃袍。",
    translation: "北周静帝禅位于隋，杨坚受册玺，隋朝建立并改元开皇。",
  },
  {
    key: "tongjian-sui-sui-conquers-chen",
    eventId: "china-589-sui-conquers-chen",
    sourceId: "zizhi-tongjian-sui",
    workTitle: "资治通鉴",
    bookTitle: "隋纪",
    chapterTitle: "卷一百七十七",
    locator: "隋纪一，开皇九年",
    sourceUrl: "https://zh.wikisource.org/wiki/資治通鑑/卷177",
    quote: "於是陳國皆平，得州三十，郡一百，縣四百，詔建康城邑宮室，並平蕩耕墾，更於石頭置蔣州。",
    translation: "隋灭陈后平定陈境，取得三十州、一百郡、四百县，南北统一完成。",
  },
  {
    key: "nanshi-hou-jing",
    eventId: "china-548-hou-jing-rebellion",
    sourceId: "nanshi",
    workTitle: "南史",
    bookTitle: "列传",
    chapterTitle: "卷八十·侯景传",
    locator: "侯景传开篇",
    sourceUrl: "https://zh.wikisource.org/zh-hans/南史/卷80",
    quote: "侯景，字萬景，魏之懷朔鎮人也。少而不羈，為鎮功曹史。魏末北方大亂，乃事邊將尒朱榮，甚見器重。",
    translation: "《南史》侯景传交代侯景出身怀朔镇，魏末北方大乱时依附尔朱荣，是侯景之乱人物线的背景证据。",
  },
  {
    key: "beishi-six-garrisons",
    eventId: "china-523-six-garrisons",
    sourceId: "beishi",
    workTitle: "北史",
    bookTitle: "魏本纪",
    chapterTitle: "卷四·肃宗孝明帝",
    locator: "正光五年三月",
    sourceUrl: "https://zh.wikisource.org/wiki/北史/卷004",
    quote: "三月，沃野鎮人破六韓拔陵反，聚眾殺鎮將，號真王元年。夏四月，高平酋長胡琛反，自稱高平王，攻鎮以應拔陵。",
    translation: "《北史》把破六韩拔陵起事、杀镇将、号真王元年和胡琛响应连在一起，是六镇起事的汇总史证据。",
  },
];

const getEvent = db.prepare("SELECT id, title, event_type, time_start, time_end, summary FROM events WHERE id = ?");
const getSource = db.prepare("SELECT id, title FROM sources WHERE id = ?");

const insertMention = db.prepare(`
  INSERT OR REPLACE INTO source_mentions (
    id, source_id, passage_id, work_title, book_title, chapter_title, locator, year,
    text, translation, confidence, review_status, raw_json
  )
  VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'high', 'reviewed', ?)
`);

const insertEvidence = db.prepare(`
  INSERT OR REPLACE INTO evidence_links (
    id, subject_table, subject_id, source_id, passage_id, mention_id, locator, quote,
    evidence_role, confidence, raw_json
  )
  VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'support', 'high', ?)
`);

const insertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id,
    time_start, time_end, review_status, raw_json
  )
  VALUES (?, ?, ?, ?, ?, 'zh-Hant', ?, ?, ?, ?, ?, 'reviewed', ?)
`);

const getSourceCard = db.prepare("SELECT id, body, raw_json FROM search_documents WHERE id = ?");
const updateSourceCard = db.prepare("UPDATE search_documents SET body = ?, raw_json = ? WHERE id = ?");

db.exec("BEGIN");
try {
  for (const excerpt of excerpts) {
    const source = getSource.get(excerpt.sourceId);
    if (!source) throw new Error(`Missing source: ${excerpt.sourceId}`);

    const event = getEvent.get(excerpt.eventId);
    if (!event) throw new Error(`Missing event: ${excerpt.eventId}`);

    const mentionId = `${periodId}:primary-source:${excerpt.key}`;
    const rawPatch = {
      eventId: excerpt.eventId,
      sourceId: excerpt.sourceId,
      originalTextStatus: "verified-transcribed",
      transcriptionSource: excerpt.sourceUrl.includes("wikisource.org") ? "Wikisource" : "external-transcription",
      transcriptionSourceUrl: excerpt.sourceUrl,
      evidenceTier: "primary-source-excerpt-batch1",
      disputeNote: null,
    };

    insertMention.run(
      mentionId,
      excerpt.sourceId,
      excerpt.workTitle,
      excerpt.bookTitle,
      excerpt.chapterTitle,
      excerpt.locator,
      event.time_start,
      excerpt.quote,
      excerpt.translation,
      json(rawPatch),
    );

    insertEvidence.run(
      `${mentionId}:event`,
      "events",
      excerpt.eventId,
      excerpt.sourceId,
      mentionId,
      excerpt.locator,
      excerpt.quote,
      json(rawPatch),
    );

    insertEvidence.run(
      `${mentionId}:self`,
      "source_mentions",
      mentionId,
      excerpt.sourceId,
      mentionId,
      excerpt.locator,
      excerpt.quote,
      json(rawPatch),
    );

    insertSearchDocument.run(
      `source-mention:${mentionId}`,
      "source_mentions",
      mentionId,
      `${source.title}：${event.title}`,
      compactText([
        `${excerpt.workTitle}·${excerpt.chapterTitle} ${excerpt.locator}`,
        excerpt.quote,
        excerpt.translation,
        `事件：${event.title}`,
        `来源：${excerpt.sourceUrl}`,
      ]),
      regionId,
      periodId,
      event.event_type ?? "source-mention",
      event.time_start,
      event.time_end,
      json({ ...rawPatch, documentKind: "source-mention" }),
    );

    const eventDocId = `event:${excerpt.eventId}`;
    const eventDoc = db.prepare("SELECT id, body, raw_json FROM search_documents WHERE id = ?").get(eventDocId);
    if (eventDoc) {
      const raw = parseJson(eventDoc.raw_json);
      const sourceExcerptIds = Array.from(new Set([...(raw.sourceExcerptIds ?? []), mentionId]));
      insertSearchDocument.run(
        eventDocId,
        "events",
        excerpt.eventId,
        event.title,
        compactText([
          event.title,
          event.summary,
          `原文证据：${excerpt.quote}`,
          `出处：${excerpt.workTitle}，${excerpt.locator}`,
        ]),
        regionId,
        periodId,
        event.event_type ?? "event",
        event.time_start,
        event.time_end,
        mergeJson(eventDoc.raw_json, {
          originalTextStatus: "verified-transcribed",
          sourceExcerptIds,
          latestSourceExcerptId: mentionId,
        }),
      );
    }

    const sourceCardId = `source:${excerpt.sourceId}:310-589`;
    const sourceCard = getSourceCard.get(sourceCardId);
    if (sourceCard) {
      const sourceCardBody = sourceCard.body.includes(mentionId)
        ? sourceCard.body
        : compactText([
            sourceCard.body,
            `代表摘录（${mentionId}）：${excerpt.quote}`,
            `摘录出处：${excerpt.workTitle}，${excerpt.locator}`,
          ]);
      updateSourceCard.run(
        sourceCardBody,
        mergeJson(sourceCard.raw_json, {
          hasPrimaryExcerpt: true,
          representativeMentionId: mentionId,
          representativeEventId: excerpt.eventId,
        }),
        sourceCardId,
      );
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded ${excerpts.length} verified primary-source excerpts across ${new Set(excerpts.map((item) => item.sourceId)).size} sources.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
