import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-420-locator-originals-batch2";
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

function mergeJson(value, patch) {
  return JSON.stringify({ ...parseJson(value), batchId, ...patch });
}

function compactText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

const ctext = "Chinese Text Project";

const upgrades = [
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-311-yongjia-luoyang:locator:liu-yao",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=419800&if=gb",
    chapterTitle: "载记第三·刘曜",
    locator: "刘曜载记，洛阳陷落背景",
    quote: "曜，字永明，元海之族子也。少孤，见养于元海。幼而聪慧，有奇度。",
    translation: "《刘曜载记》交代刘曜出身刘元海宗族、少孤而被刘元海抚养，是汉赵方面人物线的基础定位。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-316-changan-falls-western-jin:locator:liu-yao",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=540855&if=gb",
    chapterTitle: "载记第二·刘聪",
    locator: "刘聪载记，刘曜陷长安",
    quote: "刘曜陷长安外城，愍帝使侍中宋敞送笺于曜，帝肉袒牵羊，舆榇衔璧出降。",
    translation: "《晋书·刘聪载记》从汉赵侧记录刘曜攻陷长安外城，晋愍帝遣宋敞送书并出降。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-317-eastern-jin-jiankang:locator:wang-dao",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=613660&if=gb",
    chapterTitle: "列传第三十五·王导",
    locator: "王导传，江东士族归心",
    quote: "及徙镇建康，吴人不附，居月余，士庶莫有至者，导患之。会敦来朝，导谓之曰：瑯邪王仁德虽厚，而名论犹轻。",
    translation: "《王导传》说明司马睿徙镇建康初期江东士人未附，王导、王敦通过仪卫和礼遇地方名望促成江东归心。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-321-zu-ti-northern-expedition:locator:zu-ti",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=327186&if=gb",
    chapterTitle: "列传第三十二·祖逖",
    locator: "祖逖传，中流击楫至克谯城",
    quote: "逖以社稷倾覆，常怀振复之志。帝乃以逖为奋威将军、豫州刺史，给千人廪，布三千匹，不给铠仗，使自招募。仍将本流徙部曲百余家渡江，中流击楫而誓曰：祖逖不能清中原而复济者，有如大江！",
    translation: "《祖逖传》保存祖逖北伐的志向、任命和中流击楫誓言，是东晋早期北伐主证据。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-321-zu-ti-northern-expedition:locator:shi-le",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=327186&if=gb",
    chapterTitle: "列传第三十二·祖逖",
    locator: "祖逖传，石季龙围谯",
    quote: "逖既克谯，宣等乃去。石季龙闻而引众围谯，含又遣宣救逖，季龙闻宣至而退。宣遂留，助逖讨诸屯坞未附者。",
    translation: "此段记录石季龙围攻谯城、晋方救援后退兵，可补祖逖北伐与后赵方面对峙。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-329-later-zhao-destroys-former-zhao:locator:liu-yao",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=419800&if=gb",
    chapterTitle: "载记第三·刘曜",
    locator: "刘曜载记，咸和三年洛西败执",
    quote: "勒至，曜将战，饮酒数斗。至于西阳门，捴阵就平，勒将石堪因而乘之，师遂大溃。曜昏醉奔退，马陷石渠，坠于冰上，被疮十余，为堪所执。",
    translation: "《刘曜载记》从前赵侧记录刘曜洛西出战前酣饮、军溃、坠马被执，是前赵崩解的关键证据。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-329-later-zhao-destroys-former-zhao:locator:shi-le",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=815172&if=gb",
    chapterTitle: "载记第四·石勒上",
    locator: "石勒载记，平阳至赵公",
    quote: "劉曜自長安屯于蒲阪，曜復僭號，署勒大司馬、大將軍，加九錫，增封十郡，并前十三郡，進爵趙公。",
    translation: "《石勒载记》记录刘曜与石勒关系和赵公封号，是后赵坐大、最终吞并前赵的北方政权侧证。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-383-fei-river:locator:fu-jian",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=452393&if=en",
    chapterTitle: "载记第十四·苻坚下",
    locator: "苻坚载记，淝水战前后",
    quote: "时张蚝败谢石于肥南，谢玄、谢琰勒卒数万，阵于肥水。坚与苻融登城而望王师，见部阵齐整，将士精锐。",
    translation: "《苻坚载记》从前秦侧记录苻坚、苻融登城观晋军阵容，是淝水战前判断失误和前秦败局的侧证。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-383-fei-river:locator:xie-an",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=962911&if=gb",
    chapterTitle: "列传第四十九·谢安、谢玄",
    locator: "谢安传附谢玄，淝水之战",
    quote: "坚进屯寿阳，列阵临肥水，玄军不得渡。玄使谓苻融曰：君远涉吾境，而临水为阵，是不欲速战；诸君小却，令将士得周旋。遂麾使却阵，众因乱不能止。",
    translation: "《谢安传》附谢玄事，记录谢玄请秦军稍退、秦军因退阵失控，是淝水之战晋方叙事的关键段落。",
  },
];

const getMention = db.prepare("SELECT * FROM source_mentions WHERE id = ?");
const getEventEvidence = db.prepare("SELECT subject_id FROM evidence_links WHERE mention_id = ? AND subject_table = 'events' LIMIT 1");
const getEvent = db.prepare("SELECT id, title, event_type, time_start, time_end, summary FROM events WHERE id = ?");
const getSource = db.prepare("SELECT id, title FROM sources WHERE id = ?");
const updateMention = db.prepare(`
  UPDATE source_mentions
  SET chapter_title = ?, locator = ?, text = ?, translation = ?, confidence = 'high', review_status = 'reviewed', raw_json = ?
  WHERE id = ?
`);
const getEvidenceRows = db.prepare("SELECT id, raw_json FROM evidence_links WHERE mention_id = ?");
const updateEvidence = db.prepare(`
  UPDATE evidence_links
  SET locator = ?, quote = ?, confidence = 'high', raw_json = ?
  WHERE id = ?
`);
const upsertSearchDocument = db.prepare(`
  INSERT OR REPLACE INTO search_documents (
    id, subject_table, subject_id, title, body, language, region_id, period_id, topic_id,
    time_start, time_end, review_status, raw_json
  )
  VALUES (?, ?, ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'reviewed', ?)
`);
const updateI18n = db.prepare(`
  UPDATE source_mention_i18n
  SET chapter_title = ?, translation = ?, raw_json = ?
  WHERE mention_id = ? AND locale = 'zh'
`);

db.exec("BEGIN");
try {
  for (const upgrade of upgrades) {
    const mention = getMention.get(upgrade.mentionId);
    if (!mention) throw new Error(`Missing mention: ${upgrade.mentionId}`);

    const eventEvidence = getEventEvidence.get(upgrade.mentionId);
    const event = eventEvidence ? getEvent.get(eventEvidence.subject_id) : null;
    const source = getSource.get(mention.source_id);
    const rawPatch = {
      eventId: event?.id ?? parseJson(mention.raw_json).eventId ?? null,
      originalTextStatus: "verified-transcribed",
      transcriptionSource: ctext,
      transcriptionSourceUrl: upgrade.sourceUrl,
      evidenceTier: "locator-originals-batch2",
      disputeNote: null,
    };

    updateMention.run(
      upgrade.chapterTitle,
      upgrade.locator,
      upgrade.quote,
      upgrade.translation,
      mergeJson(mention.raw_json, rawPatch),
      upgrade.mentionId,
    );

    for (const row of getEvidenceRows.all(upgrade.mentionId)) {
      updateEvidence.run(upgrade.locator, upgrade.quote, mergeJson(row.raw_json, rawPatch), row.id);
    }

    updateI18n.run(
      upgrade.chapterTitle,
      upgrade.translation,
      JSON.stringify({ batchId, originalTextStatus: "verified-transcribed" }),
      upgrade.mentionId,
    );

    upsertSearchDocument.run(
      `source-mention:${upgrade.mentionId}`,
      "source_mentions",
      upgrade.mentionId,
      `${source?.title ?? mention.source_id}：${event?.title ?? mention.locator}`,
      compactText([
        `${mention.work_title}·${upgrade.chapterTitle} ${upgrade.locator}`,
        upgrade.quote,
        upgrade.translation,
        event ? `事件：${event.title}` : "",
        `来源：${ctext} ${upgrade.sourceUrl}`,
      ]),
      regionId,
      periodId,
      event?.event_type ?? "source-mention",
      event?.time_start ?? mention.year,
      event?.time_end ?? mention.year,
      JSON.stringify({ batchId, ...rawPatch, documentKind: "source-mention" }),
    );
  }

  db.exec("COMMIT");
  console.log(`Upgraded ${upgrades.length} 310-420 locator-only records to verified CText excerpts.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
