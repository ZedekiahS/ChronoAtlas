import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-589-primary-source-excerpts-batch2-ctext-guoxue";
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

const ctext = "Chinese Text Project";
const guoxue = "国学网";

const excerpts = [
  {
    key: "jinshu-min-emperor-changan",
    eventId: "china-316-changan-falls-western-jin",
    sourceId: "jinshu",
    workTitle: "晋书",
    bookTitle: "帝纪",
    chapterTitle: "卷五·愍帝纪",
    locator: "建兴四年十一月乙未",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=265825&if=gb&remap=gb",
    transcriptionSource: ctext,
    quote: "十一月乙未，使侍中宋敞送笺于曜，帝乘羊车，肉袒衔璧，舆榇出降。群臣号泣攀车，执帝之手，帝亦悲不自胜。",
    translation: "晋愍帝派宋敞向刘曜送书，随后乘羊车、肉袒衔璧、舆榇出降，西晋政权至此终结。",
  },
  {
    key: "songshu-wudi-yongchu",
    eventId: "china-420-liu-yu-founds-song",
    sourceId: "songshu",
    workTitle: "宋书",
    bookTitle: "本纪",
    chapterTitle: "卷三·武帝纪下",
    locator: "永初元年六月丁卯",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=937136&if=gb",
    transcriptionSource: ctext,
    quote: "永初元年夏六月丁卯，设坛于南郊，即皇帝位，柴燎告天。",
    translation: "刘裕在永初元年六月丁卯设坛南郊，即皇帝位，刘宋建立。",
  },
  {
    key: "nanqishu-gaodi-jianyuan",
    eventId: "china-479-southern-qi-founded",
    sourceId: "nanqishu",
    workTitle: "南齐书",
    bookTitle: "本纪",
    chapterTitle: "卷二·高帝下",
    locator: "建元元年四月甲午",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=459493&if=gb&remap=gb",
    transcriptionSource: ctext,
    quote: "建元元年夏，四月，甲午，上即皇帝位于南郊，设坛柴燎告天。",
    translation: "萧道成在建元元年四月甲午于南郊即皇帝位，南齐建立。",
  },
  {
    key: "liangshu-wudi-tianjian",
    eventId: "china-502-liang-founded",
    sourceId: "liangshu",
    workTitle: "梁书",
    bookTitle: "本纪",
    chapterTitle: "卷二·武帝中",
    locator: "天监元年四月丙寅",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=448631&if=gb&remap=gb",
    transcriptionSource: ctext,
    quote: "天监元年夏四月丙寅，高祖即皇帝位于南郊。设坛柴燎，告类于天。",
    translation: "萧衍在天监元年四月丙寅于南郊即皇帝位，梁朝建立。",
  },
  {
    key: "chenshu-gaozu-yongding",
    eventId: "china-557-northern-zhou-and-chen",
    sourceId: "chenshu",
    workTitle: "陈书",
    bookTitle: "本纪",
    chapterTitle: "卷二·高祖下",
    locator: "永定元年十月乙亥",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=307691&if=en&remap=gb",
    transcriptionSource: ctext,
    quote: "永定元年冬十月乙亥，高祖即皇帝位于南郊，柴燎告天。",
    translation: "陈霸先在永定元年十月乙亥于南郊即皇帝位，陈朝建立。",
  },
  {
    key: "weishu-western-campaign-juqu",
    eventId: "china-439-northern-wei-unifies-north",
    sourceId: "weishu",
    workTitle: "魏书",
    bookTitle: "列传",
    chapterTitle: "卷一百三·蠕蠕传",
    locator: "太延五年西伐沮渠牧犍",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=755922&if=gb",
    transcriptionSource: ctext,
    quote: "五年，车驾西伐沮渠牧犍，宜都王穆寿辅景穆居守，长乐王嵇敬、建宁王崇二万人镇漠南，以备蠕蠕。",
    translation: "《魏书》记太武帝西伐沮渠牧犍，并部署漠南防务，是北魏统一北方过程的北朝侧证。",
  },
  {
    key: "beiqishu-wenxuan-before-enthronement",
    eventId: "china-550-northern-qi-founded",
    sourceId: "beiqishu",
    workTitle: "北齐书",
    bookTitle: "本纪",
    chapterTitle: "卷四·文宣帝纪",
    locator: "天保元年五月辛亥、甲寅",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=449101&if=en&remap=gb",
    transcriptionSource: ctext,
    quote: "夏五月辛亥，帝如邺。甲寅，进相国，总百揆，封冀州之渤海长乐安德武邑、瀛州之河间高阳章武、定州之中山常山博陵十郡。",
    translation: "《北齐书》记录高洋受禅前进相国、总百揆、受封十郡，是东魏转入北齐的制度前奏。",
  },
  {
    key: "zhoushu-xiaomin-king",
    eventId: "china-557-northern-zhou-and-chen",
    sourceId: "zhoushu",
    workTitle: "周书",
    bookTitle: "本纪",
    chapterTitle: "卷三·孝闵帝纪",
    locator: "元年春正月辛丑",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=625882&if=en",
    transcriptionSource: ctext,
    quote: "元年春正月辛丑，即天王位。柴燎告天，朝百官于路门。追尊皇考文公为文王，皇妣为文后。大赦天下。",
    translation: "宇文觉在元年正月辛丑即天王位，北周建立。",
  },
  {
    key: "suishu-chen-pacified",
    eventId: "china-589-sui-conquers-chen",
    sourceId: "suishu",
    workTitle: "隋书",
    bookTitle: "本纪",
    chapterTitle: "卷二·高祖下",
    locator: "开皇九年正月",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=534589&if=gb",
    transcriptionSource: ctext,
    quote: "陈国平，合州三十，郡一百，县四百。癸巳，遣使持节巡抚之。",
    translation: "隋灭陈后取得三十州、一百郡、四百县，并遣使巡抚，南北统一完成。",
  },
  {
    key: "tongjian-jin-fei-river-guoxue",
    eventId: "china-383-fei-river",
    sourceId: "zizhi-tongjian-jin",
    workTitle: "资治通鉴",
    bookTitle: "晋纪",
    chapterTitle: "卷一百五",
    locator: "晋纪二十七，太元八年",
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_105.htm",
    transcriptionSource: guoxue,
    quote: "秦兵遂退，不可复止，谢玄、谢琰、桓伊等引兵渡水击之。融驰骑略陈，欲以帅退者，马倒，为晋兵所杀，秦兵遂溃。",
    translation: "秦军后退失控，东晋军渡水进击，苻融战死，秦军溃败。",
  },
  {
    key: "tongjian-song-guzang-guoxue",
    eventId: "china-439-northern-wei-unifies-north",
    sourceId: "zizhi-tongjian-song",
    workTitle: "资治通鉴",
    bookTitle: "宋纪",
    chapterTitle: "卷一百二十三",
    locator: "宋纪五，元嘉十六年",
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_123.htm",
    transcriptionSource: guoxue,
    quote: "姑臧城溃，牧犍帅其文武五千人面缚请降，魏主释其缚而礼之。收其城内户口二十余万，仓库珍宝不可胜计。",
    translation: "北魏攻破姑臧，沮渠牧犍率众请降，北方主要割据政权被北魏整合。",
  },
  {
    key: "tongjian-qi-luoyang-guoxue",
    eventId: "china-493-xiaowen-luoyang",
    sourceId: "zizhi-tongjian-qi",
    workTitle: "资治通鉴",
    bookTitle: "齐纪",
    chapterTitle: "卷一百三十八",
    locator: "齐纪四，永明十一年",
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_138.htm",
    transcriptionSource: guoxue,
    quote: "魏主以平城地寒，六月雨雪，风沙常起，将迁都洛阳；恐群臣不从，乃议大举伐齐，欲以胁众。",
    translation: "北魏孝文帝以平城气候不利文治为由谋迁洛阳，并借南伐议题推动群臣接受。",
  },
  {
    key: "tongjian-liang-six-garrisons-guoxue",
    eventId: "china-523-six-garrisons",
    sourceId: "zizhi-tongjian-liang",
    workTitle: "资治通鉴",
    bookTitle: "梁纪",
    chapterTitle: "卷一百四十九",
    locator: "梁纪五，普通四年",
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_149.htm",
    transcriptionSource: guoxue,
    quote: "未几，沃野镇民破六韩拔陵聚众反，杀镇将，改元真王，诸镇华、夷之民往往响应。",
    translation: "破六韩拔陵在沃野镇起事，杀镇将并改元，各镇汉人与非汉族群相继响应，六镇之乱爆发。",
  },
  {
    key: "tongjian-chen-sui-founded-guoxue",
    eventId: "china-581-sui-founded",
    sourceId: "zizhi-tongjian-chen",
    workTitle: "资治通鉴",
    bookTitle: "陈纪",
    chapterTitle: "卷一百七十五",
    locator: "陈纪九，太建十三年",
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_175.htm",
    transcriptionSource: guoxue,
    quote: "甲子，命兼太傅杞公椿奉册，大宗伯赵煚奉皇帝玺绂，禅位于隋。隋主冠远游冠；受册、玺，改服纱帽、黄袍。",
    translation: "北周静帝禅位于隋，杨坚受册玺，隋朝建立。",
  },
  {
    key: "tongjian-sui-chen-pacified-guoxue",
    eventId: "china-589-sui-conquers-chen",
    sourceId: "zizhi-tongjian-sui",
    workTitle: "资治通鉴",
    bookTitle: "隋纪",
    chapterTitle: "卷一百七十七",
    locator: "隋纪一，开皇九年",
    sourceUrl: "https://www.guoxue.com/shibu/zztj/content/zztj_177.htm",
    transcriptionSource: guoxue,
    quote: "于是陈国皆平，得州三十，郡一百，县四百，诏建康城邑宫室，并平荡耕垦，更于石头置蒋州。",
    translation: "隋灭陈后平定陈境，取得三十州、一百郡、四百县，南北统一完成。",
  },
  {
    key: "nanshi-hou-jing-ctext",
    eventId: "china-548-hou-jing-rebellion",
    sourceId: "nanshi",
    workTitle: "南史",
    bookTitle: "列传",
    chapterTitle: "卷八十·侯景传",
    locator: "侯景传开篇",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=643565&if=gb",
    transcriptionSource: ctext,
    quote: "侯景字万景，魏之怀朔镇人也。少而不羁，为镇功曹史。魏末北方大乱，乃事边将尒朱荣，甚见器重。",
    translation: "《南史》交代侯景出身怀朔镇、魏末依附尔朱荣，是侯景之乱人物线的背景证据。",
  },
  {
    key: "beishi-six-garrisons-zdic",
    eventId: "china-523-six-garrisons",
    sourceId: "beishi",
    workTitle: "北史",
    bookTitle: "魏本纪",
    chapterTitle: "卷四·魏本纪第四",
    locator: "正光五年三月",
    sourceUrl: "https://gj.zdic.net/shibu/102/5170.html",
    transcriptionSource: "汉典古籍",
    quote: "三月，沃野镇人破六韩拔陵反，聚众杀镇将，号真王元年。夏四月，高平酋长胡琛反，自称高平王，攻镇以应拔陵。",
    translation: "《北史》把破六韩拔陵起事、杀镇将、号真王元年和胡琛响应连在一起，是六镇之乱的后出汇总史证据。",
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
  VALUES (?, ?, ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'reviewed', ?)
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

    const mentionId = `${periodId}:primary-source-ctext-guoxue:${excerpt.key}`;
    const rawPatch = {
      eventId: excerpt.eventId,
      sourceId: excerpt.sourceId,
      originalTextStatus: "verified-transcribed",
      transcriptionSource: excerpt.transcriptionSource,
      transcriptionSourceUrl: excerpt.sourceUrl,
      evidenceTier: "primary-source-excerpt-batch2-ctext-guoxue",
      sourcePreference: excerpt.transcriptionSource === "国学网" ? "guoxue" : excerpt.transcriptionSource === "Chinese Text Project" ? "ctext" : "chinese-fallback",
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
        `来源：${excerpt.transcriptionSource} ${excerpt.sourceUrl}`,
      ]),
      regionId,
      periodId,
      event.event_type ?? "source-mention",
      event.time_start,
      event.time_end,
      json({ ...rawPatch, documentKind: "source-mention" }),
    );

    const eventDocId = `event:${excerpt.eventId}`;
    const eventDoc = getSourceCard.get(eventDocId);
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
          `摘录来源：${excerpt.transcriptionSource} ${excerpt.sourceUrl}`,
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
          latestTranscriptionSource: excerpt.transcriptionSource,
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
            `摘录来源：${excerpt.transcriptionSource} ${excerpt.sourceUrl}`,
          ]);
      updateSourceCard.run(
        sourceCardBody,
        mergeJson(sourceCard.raw_json, {
          hasPrimaryExcerpt: true,
          representativeMentionId: mentionId,
          representativeEventId: excerpt.eventId,
          representativeTranscriptionSource: excerpt.transcriptionSource,
        }),
        sourceCardId,
      );
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded ${excerpts.length} CText/Guoxue-preferred primary-source excerpts across ${new Set(excerpts.map((item) => item.sourceId)).size} sources.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
