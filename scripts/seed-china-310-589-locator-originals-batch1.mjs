import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-china-310-589-locator-originals-batch1";

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

const upgrades = [
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-311-yongjia-luoyang:locator:palace-fall",
    sourceUrl: "https://zh.wikisource.org/wiki/晉書/卷005",
    quote:
      "丁酉、劉曜、王彌入京師。帝開華林園門，出河陰藕池，欲幸長安，爲曜等所追及。",
    translation:
      "刘曜、王弥进入洛阳，晋怀帝出华林园门欲奔长安，被刘曜等追及。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-316-changan-falls-western-jin:locator:emperor-min",
    sourceUrl: "https://ctext.org/wiki.pl?chapter=265825&if=gb&remap=gb",
    quote:
      "十一月乙末，使侍中宋敞送笺于曜，帝乘羊车，肉袒衔壁，舆榇出降。群臣号泣攀车，执帝之手，帝亦悲不自胜。",
    translation:
      "晋愍帝派侍中宋敞向刘曜递书，随后乘羊车、肉袒衔璧、舆榇出降。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-317-eastern-jin-jiankang:locator:yuan-emperor",
    sourceUrl: "https://zh.wikisource.org/wiki/晉書/卷006",
    quote:
      "羣臣乃不敢逼，請依魏晉故事爲晉王，許之。辛卯，卽王位，大赦，改元。",
    translation:
      "群臣请司马睿依魏晋旧例为晋王，司马睿同意；辛卯即王位，大赦改元。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-420-liu-yu-founds-song:locator:jin-gongdi",
    sourceUrl: "https://zh.wikisource.org/wiki/晉書/卷010",
    quote:
      "二年夏六月壬戌，劉裕至于京師。傅亮承裕密旨，諷帝禪位，草詔，請帝書之。",
    translation:
      "元熙二年六月刘裕至京师，傅亮承刘裕密旨劝晋恭帝禅位，并草诏请帝书写。",
  },
  {
    mentionId: "china-wei-jin-northern-southern-310-589:china-420-liu-yu-founds-song:locator:song-wudi",
    sourceUrl: "https://zh.wikisource.org/wiki/宋書/卷3",
    quote:
      "夏六月丁卯，設壇於南郊，即皇帝位，柴燎告天。",
    translation:
      "永初元年六月丁卯，刘裕设坛南郊，即皇帝位，柴燎告天。",
  },
];

const getMention = db.prepare("SELECT * FROM source_mentions WHERE id = ?");
const getEventEvidence = db.prepare("SELECT subject_id FROM evidence_links WHERE mention_id = ? AND subject_table = 'events' LIMIT 1");
const getEvent = db.prepare("SELECT id, title, event_type, time_start, time_end, summary FROM events WHERE id = ?");
const updateMention = db.prepare(`
  UPDATE source_mentions
  SET text = ?, translation = ?, confidence = 'high', review_status = 'reviewed', raw_json = ?
  WHERE id = ?
`);
const getEvidenceRows = db.prepare("SELECT id, raw_json FROM evidence_links WHERE mention_id = ?");
const updateEvidence = db.prepare(`
  UPDATE evidence_links
  SET quote = ?, confidence = 'high', raw_json = ?
  WHERE mention_id = ?
`);
const getSearchDocument = db.prepare("SELECT * FROM search_documents WHERE id = ?");
const updateSearchDocument = db.prepare(`
  UPDATE search_documents
  SET body = ?, review_status = 'reviewed', raw_json = ?
  WHERE id = ?
`);

db.exec("BEGIN");
try {
  for (const upgrade of upgrades) {
    const mention = getMention.get(upgrade.mentionId);
    if (!mention) throw new Error(`Missing mention: ${upgrade.mentionId}`);
    const eventEvidence = getEventEvidence.get(upgrade.mentionId);
    const event = eventEvidence ? getEvent.get(eventEvidence.subject_id) : null;
    const rawPatch = {
      originalTextStatus: "verified-transcribed",
      transcriptionSource: upgrade.sourceUrl.includes("ctext.org") ? "Chinese Text Project" : "Wikisource",
      transcriptionSourceUrl: upgrade.sourceUrl,
      disputeNote: null,
    };
    updateMention.run(upgrade.quote, upgrade.translation, mergeJson(mention.raw_json, rawPatch), upgrade.mentionId);
    for (const row of getEvidenceRows.all(upgrade.mentionId)) {
      updateEvidence.run(upgrade.quote, mergeJson(row.raw_json, rawPatch), upgrade.mentionId);
    }
    const sourceDocId = `source-mention:${upgrade.mentionId}`;
    const sourceDoc = getSearchDocument.get(sourceDocId);
    if (sourceDoc) {
      updateSearchDocument.run(
        compactText([
          sourceDoc.title,
          upgrade.quote,
          upgrade.translation,
          event ? `事件：${event.title}` : "",
        ]),
        mergeJson(sourceDoc.raw_json, {
          ...rawPatch,
          documentKind: "source-mention",
          evidenceSubjectId: event?.id ?? null,
        }),
        sourceDocId,
      );
    }
  }
  db.exec("COMMIT");
  console.log(`Upgraded ${upgrades.length} locator evidence cards to verified excerpts.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
