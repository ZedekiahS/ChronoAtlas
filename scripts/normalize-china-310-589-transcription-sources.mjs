import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");

const batchId = "manual-normalize-china-310-589-transcription-sources";

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function replaceAll(value, replacements) {
  let next = value ?? "";
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  return next;
}

const ctext = "Chinese Text Project";
const guoxue = "国学网";

const updates = [
  ["china-wei-jin-northern-southern-310-589:primary-source:beiqishu-northern-qi-founded", ctext, "https://ctext.org/wiki.pl?chapter=449101&if=en&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:beishi-six-garrisons", "汉典古籍", "https://gj.zdic.net/shibu/102/5170.html"],
  ["china-wei-jin-northern-southern-310-589:primary-source:chenshu-chen-founded", ctext, "https://ctext.org/wiki.pl?chapter=307691&if=en&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:china-311-yongjia-luoyang:locator:palace-fall", ctext, "https://ctext.org/wiki.pl?chapter=265825&if=gb&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:china-317-eastern-jin-jiankang:locator:yuan-emperor", ctext, "https://ctext.org/wiki.pl?chapter=521796&if=gb&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:china-420-liu-yu-founds-song:locator:jin-gongdi", ctext, "https://ctext.org/wiki.pl?chapter=449493&if=gb&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:jinshu-yongjia-luoyang", ctext, "https://ctext.org/wiki.pl?chapter=265825&if=gb&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:liangshu-liang-founded", ctext, "https://ctext.org/wiki.pl?chapter=448631&if=gb&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:nanqishu-southern-qi-founded", ctext, "https://ctext.org/wiki.pl?chapter=459493&if=gb&remap=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:nanshi-hou-jing", ctext, "https://ctext.org/wiki.pl?chapter=643565&if=gb"],
  ["china-wei-jin-northern-southern-310-589:china-420-liu-yu-founds-song:locator:song-wudi", ctext, "https://ctext.org/wiki.pl?chapter=937136&if=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:songshu-liu-yu-founds-song", ctext, "https://ctext.org/wiki.pl?chapter=937136&if=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:suishu-sui-conquers-chen", ctext, "https://ctext.org/wiki.pl?chapter=534589&if=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:weishu-northern-wei-unifies-north", ctext, "https://ctext.org/wiki.pl?chapter=469087&if=gb"],
  ["china-wei-jin-northern-southern-310-589:primary-source:zhoushu-northern-zhou-founded", ctext, "https://ctext.org/wiki.pl?chapter=625882&if=en"],
  ["china-wei-jin-northern-southern-310-589:china-557-northern-zhou-and-chen:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_167.htm"],
  ["china-wei-jin-northern-southern-310-589:china-577-northern-zhou-destroys-qi:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_173.htm"],
  ["china-wei-jin-northern-southern-310-589:china-581-sui-founded:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_175.htm"],
  ["china-wei-jin-northern-southern-310-589:primary-source:tongjian-chen-sui-founded", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_175.htm"],
  ["china-wei-jin-northern-southern-310-589:china-304-liu-yuan-han-zhao:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_085.htm"],
  ["china-wei-jin-northern-southern-310-589:china-311-yongjia-luoyang:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_087.htm"],
  ["china-wei-jin-northern-southern-310-589:china-316-changan-falls-western-jin:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_089.htm"],
  ["china-wei-jin-northern-southern-310-589:china-317-eastern-jin-jiankang:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_090.htm"],
  ["china-wei-jin-northern-southern-310-589:china-321-zu-ti-northern-expedition:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_090.htm"],
  ["china-wei-jin-northern-southern-310-589:china-329-later-zhao-destroys-former-zhao:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_094.htm"],
  ["china-wei-jin-northern-southern-310-589:china-383-fei-river:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_105.htm"],
  ["china-wei-jin-northern-southern-310-589:primary-source:tongjian-jin-fei-river", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_105.htm"],
  ["china-wei-jin-northern-southern-310-589:china-523-six-garrisons:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_149.htm"],
  ["china-wei-jin-northern-southern-310-589:china-534-northern-wei-splits:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_156.htm"],
  ["china-wei-jin-northern-southern-310-589:china-548-hou-jing-rebellion:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_161.htm"],
  ["china-wei-jin-northern-southern-310-589:china-550-northern-qi-founded:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_163.htm"],
  ["china-wei-jin-northern-southern-310-589:primary-source:tongjian-liang-six-garrisons", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_149.htm"],
  ["china-wei-jin-northern-southern-310-589:china-493-xiaowen-luoyang:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_138.htm"],
  ["china-wei-jin-northern-southern-310-589:primary-source:tongjian-qi-xiaowen-luoyang", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_138.htm"],
  ["china-wei-jin-northern-southern-310-589:china-420-liu-yu-founds-song:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_119.htm"],
  ["china-wei-jin-northern-southern-310-589:china-439-northern-wei-unifies-north:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_123.htm"],
  ["china-wei-jin-northern-southern-310-589:primary-source:tongjian-song-northern-wei-unifies-north", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_123.htm"],
  ["china-wei-jin-northern-southern-310-589:china-589-sui-conquers-chen:mention", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_177.htm"],
  ["china-wei-jin-northern-southern-310-589:primary-source:tongjian-sui-sui-conquers-chen", guoxue, "https://www.guoxue.com/shibu/zztj/content/zztj_177.htm"],
];

const getMention = db.prepare("SELECT id, raw_json FROM source_mentions WHERE id = ?");
const updateMention = db.prepare("UPDATE source_mentions SET raw_json = ? WHERE id = ?");
const getEvidenceLinks = db.prepare("SELECT id, raw_json FROM evidence_links WHERE mention_id = ?");
const updateEvidence = db.prepare("UPDATE evidence_links SET raw_json = ? WHERE id = ?");
const getDocument = db.prepare("SELECT id, body, raw_json FROM search_documents WHERE id = ?");
const updateDocument = db.prepare("UPDATE search_documents SET body = ?, raw_json = ? WHERE id = ?");

db.exec("BEGIN");
try {
  let changed = 0;
  for (const [mentionId, transcriptionSource, transcriptionSourceUrl] of updates) {
    const mention = getMention.get(mentionId);
    if (!mention) throw new Error(`Missing source mention: ${mentionId}`);

    const current = parseJson(mention.raw_json);
    const patch = {
      ...current,
      transcriptionSource,
      transcriptionSourceUrl,
      sourceNormalizationBatchId: batchId,
    };
    delete patch.previousTranscriptionSource;
    delete patch.previousTranscriptionSourceUrl;
    updateMention.run(JSON.stringify(patch), mentionId);

    for (const link of getEvidenceLinks.all(mentionId)) {
      const raw = parseJson(link.raw_json);
      const linkPatch = { ...raw, transcriptionSource, transcriptionSourceUrl, sourceNormalizationBatchId: batchId };
      delete linkPatch.previousTranscriptionSource;
      delete linkPatch.previousTranscriptionSourceUrl;
      updateEvidence.run(JSON.stringify(linkPatch), link.id);
    }

    const docId = `source-mention:${mentionId}`;
    const doc = getDocument.get(docId);
    if (doc) {
      const replacements = [];
      const docRaw = parseJson(doc.raw_json);
      if (docRaw.transcriptionSourceUrl) replacements.push([docRaw.transcriptionSourceUrl, transcriptionSourceUrl]);
      if (docRaw.transcriptionSource) replacements.push([docRaw.transcriptionSource, transcriptionSource]);
      updateDocument.run(
        replaceAll(doc.body, replacements),
        JSON.stringify({
          ...docRaw,
          transcriptionSource,
          transcriptionSourceUrl,
          sourceNormalizationBatchId: batchId,
        }),
        docId,
      );
    }

    changed += 1;
  }

  db.exec("COMMIT");
  console.log(`Normalized transcription sources for ${changed} China 310-589 source mentions.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
