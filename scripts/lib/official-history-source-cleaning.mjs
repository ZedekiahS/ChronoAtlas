const commentaryLeadPattern = /^(?:(?:师古|師古|应劭|應劭|臣瓒|臣瓚|如淳|孟康|晋灼|晉灼|颜师古|顏師古|李贤|李賢|章怀|章懷|杜预|杜預|裴松之|臣松之|松之案|史臣|太史公|赞|贊|论|論|案|注|音)曰|(?:赞|贊|论|論)曰)[：:]?/u;
const quotationLeadPattern = /^(?:制曰|诏曰|詔曰|上书曰|上書曰|奏曰|对曰|對曰|曰)[：:]?[「“『‘]?/u;
const textualNoteLeadPattern = /^(?:校勘记|校勘記|音义|音義|释文|釋文|[〇０零一二三四五六七八九十百千\d]{2,8}頁|《[^》]{1,40}》(?:曰|云|雲)[：:]?)/u;
const routineCareerPattern = /(?:累迁|累遷|历迁|歷遷|迁[^，。；]{0,10}(?:尚书|尚書|太守|少府|刺史|郎|令|掾|从事|從事)|转[^，。；]{0,10}(?:少府|太守|刺史|郎|令)|历任|歷任)/u;
const sourceHeadingPattern = /^(?:(?:汉书|漢書|后汉书|後漢書)s*)?卷[一二三四五六七八九十百上下d]+(?:上|中|下)?\s+[^。！？；;]{0,90}?\s+(?=[\p{Script=Han}〔「“])/u;
const leadingNoisePattern = /^(?:(?:[」』】”’]\s*)|(?:〔[^〕]{1,16}〕\s*))+/u;
const inlineCommentaryPatterns = [
  /[，,]\s*《[^》]{1,40}》(?:曰|云|雲)[：:]?/u,
  /[，,]\s*[\p{Script=Han}]{1,6}《[^》]{1,40}》(?:曰|云|雲)[：:]?/u,
  /[，,]\s*(?:续汉书|續漢書|前书|前書|汉书音义|漢書音義|东观汉记|東觀漢記)(?:曰|云|雲)[：:]?/u,
  /[，,]\s*(?:师古|師古|应劭|應劭|臣瓒|臣瓚|如淳|孟康|晋灼|晉灼|李贤|李賢|章怀|章懷|杜预|杜預|裴松之|臣松之)(?:曰|云|雲)[：:]?/u,
];
const inlinePlaceGlossPattern = /[，,]\s*[\p{Script=Han}]{1,8}[，,]\s*(?:县|縣|郡|国|國|城|乡|鄉)(?:名)?(?=[，,。；;]|$)/u;
const inlineModernLocatorPattern = /[，,]\s*[\p{Script=Han}]{1,8}(?:故城)?在今[\p{Script=Han}]{1,30}/u;
const inlineSpeechPattern = /[，；;]\s*[^，；;。]{0,24}(?:诏曰|詔曰|上书曰|上書曰|奏曰|对曰|對曰|曰)[：:]?[「“『‘]/u;

function stripLeadingNoise(value) {
  let text = String(value ?? "").trim();
  for (let index = 0; index < 3; index += 1) {
    const heading = text.match(sourceHeadingPattern);
    if (heading) text = text.slice(heading[0].length).trimStart();
    const noise = text.match(leadingNoisePattern);
    if (noise) text = text.slice(noise[0].length).trimStart();
    if (!heading && !noise) break;
  }
  return text;
}

export function classifyOfficialHistoryTextKind(value) {
  const text = stripLeadingNoise(value);
  if (!text) return "empty";
  if (textualNoteLeadPattern.test(text) || commentaryLeadPattern.test(text)) return "textual_note";
  if (
    quotationLeadPattern.test(text)
    || /^[\p{Script=Han}]{1,6}(?:曰|云|雲)[：:]?[「“『‘]/u.test(text)
    || /^[「“『‘《]/u.test(text)
  ) return "quotation";
  if (routineCareerPattern.test(text) && !/即位|称帝|稱帝|受禅|受禪|废|廢|立为皇|立為皇|封.{0,10}(?:王|侯|公)/u.test(text)) {
    return "career_record";
  }
  return "narrative";
}

export function isolateOfficialHistoryNarrativeText(value, options = {}) {
  let text = stripLeadingNoise(value);
  if (!text || ["textual_note", "quotation"].includes(classifyOfficialHistoryTextKind(text))) return null;

  const cuts = [];
  for (const pattern of inlineCommentaryPatterns) {
    const match = text.match(pattern);
    if (match?.index > 0) cuts.push(match.index);
  }
  const placeGloss = text.match(inlinePlaceGlossPattern);
  if (placeGloss?.index > 0) cuts.push(placeGloss.index);
  const modernLocator = text.match(inlineModernLocatorPattern);
  if (modernLocator?.index > 0) cuts.push(modernLocator.index);
  const speech = text.match(inlineSpeechPattern);
  if (speech?.index > 0) cuts.push(speech.index);
  if (cuts.length) text = text.slice(0, Math.min(...cuts));

  text = text.trim().replace(/[，,；;：:]+$/u, "").trimEnd();
  const minimumLength = options.minimumLength ?? 6;
  return Array.from(text).length >= minimumLength ? text : null;
}
