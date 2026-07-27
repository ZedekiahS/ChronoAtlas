import { compact, normalizeIdentityText, stableId } from "./event-promotion-core.mjs";

export const officialHistoryEventEnrichmentGenerator = "enrich-official-history-events:v2";

export const officialHistoryEventDetailFields = [
  "overview",
  "background",
  "process",
  "result",
  "impact",
  "sourceNotes",
  "uncertainty",
];

const actionPattern = /下狱死|下獄死|遇害|被害|自立为|自立為|起兵|举兵|興兵|兴兵|起义|起義|起事|爆发|爆發|政变|政變|出征|追击|击破|大破|讨灭|討滅|灭之|滅之|讨破|討破|破降|讨|討|伐|攻|击|取|围|圍|破|败|敗|斩|斬|杀|殺|诛|誅|叛乱|叛亂|叛|反|寇|降|废|廢|黜|立|封|绍封|紹封|卽皇帝位|即皇帝位|即位|称帝|稱帝|称皇帝|稱皇帝|称王|稱王|来朝|來朝|遣使|献|獻|赦|徙|还|還|诏|詔|率|屯|入|拜|收|裁撤|罢|罷|颁行|頒行|整理|燔烧|燔燒|杀略|殺略/u;
const resultPattern = /大破|击破|讨灭|討滅|灭之|滅之|讨破|討破|破之|破降|平之|不克|不利|败|敗|败走|敗走|战殁|戰歿|遇害|被害|失去.{0,16}控制|瓦解|崩溃|崩潰|下狱死|下獄死|自杀|乞降|请降|請降|来降|來降|诣.{0,12}降|降之|斩|斬|杀|殺|诛|誅|被废|被廢|废|廢|黜|封.{0,16}(?:王|侯|公)|立为|立為|自立为|自立為|卽皇帝位|即皇帝位|来朝|來朝|献|獻|取.{0,12}地|徙|还其|還其|赦|奉.{0,8}后|奉.{0,8}後/u;
const explicitConsequencePattern = /^(?:由是|于是|於是|遂|自是|故|因此|其后|其後|从而|從而|因而|激起|但.{0,16}使|.{2,18}(?:进入|進入).{0,16}(?:阶段|階段|时期|時期|局面)|.{2,18}从.{0,18}(?:转入|轉入)|.{2,18}升级为|.{2,18}升級為|.{2,18}脱离.{0,16}控制|.{2,18}脫離.{0,16}控制|.{2,18}形成.{0,16}政权|.{2,18}形成.{0,16}政權|.{2,18}开始出现.{0,16}裂缝|.{2,18}開始出現.{0,16}裂縫|.{2,18}成为.{0,24}(?:战场|戰場|节点|節點|标志|標誌)|.{2,18}成為.{0,24}(?:戰場|節點|標誌)|.{2,18}持续(?:坍塌|瓦解|崩溃|崩潰)|.{2,18}持續(?:坍塌|瓦解|崩潰)|.{2,18}在.{0,24}之间流离|.{2,18}在.{0,24}之間流離|.{2,18}(?:虽|雖).{0,24}已被.{0,24}包围|.{2,18}(?:随即|隨即)被|(?:是|成为|成為).{0,24}(?:节点|節點|标志|標誌|关键事件|關鍵事件)|(?:(?:东汉|東漢)?主体叙事|政治格局|边疆叙事|邊疆敘事).{0,16}(?:转入|轉入|进入|進入|改变|改變|重组|重組|延续|延續|上升))|震慑|震詧|谋欲报怨|謀欲報怨|朝廷忧之|悉诣.{0,12}降|悉詣.{0,12}降|奉贡入侍|奉貢入侍|群遂寇|羌遂寇/u;
const chronologyOnlyPattern = /^(?:[\p{Script=Han}]{2,8}[\u5143一二三四五六七八九十百]+\u5e74)?(?:\u6625|\u590f|\u79cb|\u51ac)?(?:\u95f0|\u958f)?(?:\u6b63|[\u4e00二三四五六七八九十]+)?\u6708?(?:[\u7532乙丙丁戊己庚辛壬癸][\u5b50丑寅卯辰巳午未申酉戌亥])?$/u;
const commentaryPattern = /^(?:国名|國名|县名|縣名|今曰|今[为為在隶属]|故城|属[于於]?|隸屬|案曰|注曰|臣.{0,6}曰)/u;
const sourceComparisonPattern = /^(?:《[^》]{1,48}》|标题|標題).*(?:作|称|稱|记|記|概称|概稱|详作|詳作|叙述|敘述|表述|采用|採用|对|對)/u;

const contextTerms = [
  "南匈奴左部",
  "南匈奴",
  "北匈奴",
  "烧当羌",
  "烧當羌",
  "先零羌",
  "沈氐羌",
  "巩唐羌",
  "烧何羌",
  "烒何羌",
  "武陵蛮",
  "南郡蛮",
  "益州夷",
  "高句骊",
  "高句麗",
  "乌桓",
  "烏桓",
  "鲜卑",
  "鮮卑",
  "车师",
  "車師",
  "赤眉",
  "貊人",
  "秽貊",
  "宦者",
];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function isOfficialHistoryEventEnrichment(value) {
  return String(value?.generator ?? value ?? "").startsWith("enrich-official-history-events:v");
}

export function isCompleteOfficialHistoryEventDetail(detail) {
  return Boolean(
    detail
    && typeof detail === "object"
    && !Array.isArray(detail)
    && officialHistoryEventDetailFields.every((field) => Object.hasOwn(detail, field)),
  );
}

function toSentence(value) {
  const text = compact(value).replace(/^[“”"'「」]+/u, "").replace(/[。；，]+$/u, "");
  return text ? `${text}。` : "";
}

function toSentenceList(value) {
  const values = Array.isArray(value) ? value : [value];
  return unique(values.map((item) => toSentence(item)).filter(Boolean));
}

export function mergeLegacyOfficialHistoryEventDetail(generatedDetail, legacyDetail) {
  const fields = legacyDetail?.fields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return generatedDetail;

  const overview = toSentence(fields.content);
  const result = toSentenceList(fields.result);
  const impact = toSentenceList(fields.impact);
  return {
    ...generatedDetail,
    overview: overview || generatedDetail.overview,
    result: result.length ? result : generatedDetail.result,
    impact: impact.length ? impact : generatedDetail.impact,
  };
}

export function mergeOfficialHistoryRelatedEventRefs(existingRaw, generatedRefs) {
  const previousRefs = Array.isArray(existingRaw?.relatedEventRefs) ? existingRaw.relatedEventRefs : [];
  const previousIds = Array.isArray(existingRaw?.relatedEvents) ? existingRaw.relatedEvents : [];
  const previousGeneratedIds = isOfficialHistoryEventEnrichment(existingRaw?.enrichment)
    ? new Set(
      Array.isArray(existingRaw.enrichment.generatedRelatedEventIds)
        ? existingRaw.enrichment.generatedRelatedEventIds
        : previousRefs.map((reference) => reference?.eventId).filter(Boolean),
    )
    : new Set();
  const editorialIds = previousIds.filter((eventId) => eventId && !previousGeneratedIds.has(eventId));
  const editorialRefs = previousRefs.filter((reference) =>
    reference?.eventId && !previousGeneratedIds.has(reference.eventId));
  const refsById = new Map(editorialRefs.map((reference) => [reference.eventId, reference]));

  for (const eventId of editorialIds) {
    if (!refsById.has(eventId)) {
      refsById.set(eventId, {
        eventId,
        relationType: "editorial",
        confidence: "medium",
        basis: "保留既有人工关联；该关系不由本次自动富化推断。",
      });
    }
  }
  const generatedRelatedEventIds = [];
  for (const reference of generatedRefs) {
    if (reference?.eventId && !refsById.has(reference.eventId)) {
      refsById.set(reference.eventId, reference);
      generatedRelatedEventIds.push(reference.eventId);
    }
  }

  return {
    relatedEvents: unique([...editorialIds, ...generatedRelatedEventIds]),
    relatedEventRefs: [...refsById.values()],
    generatedRelatedEventIds,
  };
}

function asSortedStrings(value) {
  return unique(Array.isArray(value) ? value.map((item) => compact(item)) : []).sort();
}

function isNarrativeClause(clause, clauseCount) {
  if (!clause || chronologyOnlyPattern.test(clause) || commentaryPattern.test(clause) || sourceComparisonPattern.test(clause)) return false;
  if (clauseCount > 1 && clause.length <= 6 && !actionPattern.test(clause) && !resultPattern.test(clause) && !explicitConsequencePattern.test(clause)) {
    return false;
  }
  return true;
}

export function splitOfficialHistoryEventClauses(value) {
  const text = compact(value).replace(/^[“”"'「」]+/u, "");
  if (!text) return [];
  const parts = text.split(/[，；。！？]/u).map((clause) => compact(clause)).filter(Boolean);
  const clauses = [];
  for (let index = 0; index < parts.length; index += 1) {
    const current = parts[index];
    const next = parts[index + 1];
    if (next && /(?:虽|雖|虽然|雖然)/u.test(current) && /^(?:却|卻)/u.test(next)) {
      clauses.push(`${current}，${next}`);
      index += 1;
    } else {
      clauses.push(current);
    }
  }
  return clauses.filter((clause) => isNarrativeClause(clause, clauses.length));
}

function sourceComparisonNotes(value) {
  return compact(value)
    .split(/[，；。！？]/u)
    .map((clause) => compact(clause))
    .filter((clause) => sourceComparisonPattern.test(clause))
    .map((clause) => `异文或编辑说明：${toSentence(clause)}`);
}

function chronologySourceNotes(event) {
  const resolutions = Array.isArray(event.raw?.timeResolution) ? event.raw.timeResolution : [];
  return unique(resolutions
    .map((resolution) => compact(resolution?.chronology?.sourceContext))
    .filter(Boolean))
    .map((note) => `年代校勘：${toSentence(note)}`);
}

export function officialHistoryEnrichmentInputFingerprint(event) {
  const sourceRefs = Array.isArray(event.sourceRefs)
    ? event.sourceRefs
      .map((ref) => `${compact(ref?.sourceId)}:${compact(ref?.locator)}`)
      .filter((value) => value !== ":")
      .sort()
    : [];
  return stableId(JSON.stringify({
    id: compact(event.id),
    title: compact(event.title ?? event.titleZh),
    startYear: event.startYear ?? event.time_start ?? null,
    endYear: event.endYear ?? event.time_end ?? event.startYear ?? event.time_start ?? null,
    summary: compact(event.summary),
    personIds: asSortedStrings(event.personIds),
    placeEntityIds: asSortedStrings(event.placeEntityIds),
    sourceRefs,
  }), 24);
}

export function preserveOfficialHistoryEventEnrichment(existingRaw, nextRaw) {
  if (
    !isOfficialHistoryEventEnrichment(existingRaw?.enrichment)
    || existingRaw.enrichment.inputFingerprint !== officialHistoryEnrichmentInputFingerprint(nextRaw)
  ) {
    return nextRaw;
  }
  return {
    ...nextRaw,
    detail: existingRaw.detail,
    relatedEvents: Array.isArray(existingRaw.relatedEvents) ? existingRaw.relatedEvents : [],
    relatedEventRefs: Array.isArray(existingRaw.relatedEventRefs) ? existingRaw.relatedEventRefs : [],
    enrichment: existingRaw.enrichment,
  };
}

function extractContextTerms(event) {
  const text = `${event.title ?? ""} ${event.summary ?? ""}`;
  const matches = contextTerms.filter((term) => text.includes(term));
  return matches.filter((term) => !matches.some((candidate) => candidate !== term && candidate.includes(term)));
}

function intersections(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function relationCandidate(left, right) {
  const yearGap = Math.abs((left.startYear ?? 0) - (right.startYear ?? 0));
  const sharedPersonIds = intersections(left.participantPersonIds ?? [], right.participantPersonIds ?? []);
  const sharedPeople = intersections(left.participantPeople ?? [], right.participantPeople ?? []);
  const sharedPlaces = intersections(left.placeEntityIds ?? [], right.placeEntityIds ?? []);
  const sharedTopics = intersections(extractContextTerms(left), extractContextTerms(right));
  const leftSummary = normalizeIdentityText(left.summary);
  const rightSummary = normalizeIdentityText(right.summary);
  const possibleDuplicate = leftSummary.length >= 8 && leftSummary === rightSummary && yearGap <= 3;

  let relationType = null;
  let score = 0;
  let confidence = "low";
  if (possibleDuplicate) {
    relationType = "possible-duplicate";
    score = 100 - yearGap;
    confidence = "high";
  } else if (sharedPersonIds.length > 0 && yearGap <= 25) {
    relationType = "shared-participant";
    score = 82 + Math.min(sharedPersonIds.length, 3) * 4 - yearGap * 0.4;
    confidence = yearGap <= 5 ? "high" : "medium";
  } else if (sharedTopics.length > 0 && yearGap <= 12) {
    relationType = "same-historical-context";
    score = 66 + Math.min(sharedTopics.length, 2) * 3 - yearGap * 0.5;
    confidence = "medium";
  } else if (sharedPlaces.length > 0 && yearGap <= 5 && left.eventType === right.eventType) {
    relationType = "same-place-context";
    score = 54 - yearGap;
    confidence = "low";
  }
  if (!relationType) return null;

  return {
    leftId: left.id,
    rightId: right.id,
    relationType,
    score,
    confidence,
    yearGap,
    sharedPersonIds,
    sharedPeople,
    sharedPlaces,
    sharedTopics,
  };
}

function relationRef(candidate, eventId) {
  const targetId = candidate.leftId === eventId ? candidate.rightId : candidate.leftId;
  const basis = candidate.relationType === "possible-duplicate"
    ? "年代接近且事件原文高度重合，需审核是否合并。"
    : candidate.relationType === "shared-participant"
      ? `共享明确参与人物：${candidate.sharedPeople.join("、") || candidate.sharedPersonIds.join("、")}。`
      : candidate.relationType === "same-historical-context"
        ? `共享历史对象：${candidate.sharedTopics.join("、")}；仅表示同一上下文，不代表因果。`
        : "地点、时间和事件类型接近；仅作为地域上下文候选。";
  return {
    eventId: targetId,
    relationType: candidate.relationType,
    confidence: candidate.confidence,
    yearGap: candidate.yearGap,
    sharedPersonIds: candidate.sharedPersonIds,
    sharedPeople: candidate.sharedPeople,
    sharedPlaceEntityIds: candidate.sharedPlaces,
    sharedTopics: candidate.sharedTopics,
    basis,
  };
}

export function buildOfficialHistoryRelatedEventRefs(events, { maxRelationsPerEvent = 4 } = {}) {
  const candidates = [];
  for (let leftIndex = 0; leftIndex < events.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < events.length; rightIndex += 1) {
      const candidate = relationCandidate(events[leftIndex], events[rightIndex]);
      if (candidate) candidates.push(candidate);
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.yearGap - right.yearGap || left.leftId.localeCompare(right.leftId));

  const refsById = new Map(events.map((event) => [event.id, []]));
  for (const candidate of candidates) {
    const leftRefs = refsById.get(candidate.leftId);
    const rightRefs = refsById.get(candidate.rightId);
    if (!leftRefs || !rightRefs || leftRefs.length >= maxRelationsPerEvent || rightRefs.length >= maxRelationsPerEvent) continue;
    leftRefs.push(relationRef(candidate, candidate.leftId));
    rightRefs.push(relationRef(candidate, candidate.rightId));
  }
  for (const refs of refsById.values()) {
    refs.sort((left, right) => left.yearGap - right.yearGap || left.eventId.localeCompare(right.eventId));
  }
  return refsById;
}

function sourceNote(evidence) {
  const sourceTitle = compact(evidence.sourceTitle ?? evidence.source_title);
  const locator = compact(evidence.locator);
  if (!sourceTitle) return null;
  return `《${sourceTitle.replace(/^[《》]|[《》]$/gu, "")}》${locator ? `（${locator}）` : ""}提供本事件的原文依据。`;
}

export function buildOfficialHistoryEventDetail(event, evidence = [], relatedEventRefs = [], eventTitleById = new Map()) {
  const clauses = splitOfficialHistoryEventClauses(event.summary);
  const titleAction = compact(event.title).match(actionPattern)?.[0] ?? null;
  let mainIndex = titleAction ? clauses.findIndex((clause) => clause.includes(titleAction)) : -1;
  if (mainIndex < 0) mainIndex = clauses.findIndex((clause) => actionPattern.test(clause));
  if (mainIndex < 0) mainIndex = 0;

  const overview = clauses.length ? `${clauses.join("，")}。` : toSentence(event.summary || event.title);
  const backgroundDirect = clauses.slice(0, mainIndex).map(toSentence).filter(Boolean);
  const processDirect = clauses
    .slice(mainIndex)
    .filter((clause) => !explicitConsequencePattern.test(clause))
    .map(toSentence)
    .filter(Boolean)
    .slice(0, 4);
  const resultDirect = clauses.filter((clause) => resultPattern.test(clause)).map(toSentence).filter(Boolean).slice(0, 3);
  const impactDirect = clauses
    .filter((clause, index) => index > mainIndex && explicitConsequencePattern.test(clause))
    .map(toSentence)
    .filter(Boolean)
    .slice(0, 3);
  const possibleDuplicate = relatedEventRefs.find((ref) => ref.relationType === "possible-duplicate");
  const sourceNotes = unique(evidence.map(sourceNote)).slice(0, 4);
  const sourceCount = new Set(evidence.map((item) => item.sourceId ?? item.source_id).filter(Boolean)).size;
  const materialLabel = event.raw
    && !event.raw.machinePromoted
    && !String(event.id ?? "").startsWith("official-history-event:")
    ? "已审核摘要"
    : "原文";

  const background = backgroundDirect.length
    ? backgroundDirect
    : [`现有${materialLabel}直接记载“${compact(event.title)}”，未交代可独立确认的前因。`];
  const process = processDirect.length ? processDirect : [toSentence(event.summary || event.title)];
  const result = resultDirect.length
    ? resultDirect
    : [`现有${materialLabel}确认了“${compact(event.title)}”，未另载可拆分的处置或结果。`];
  const impact = impactDirect.length
    ? impactDirect
    : [`现有${materialLabel}未说明“${compact(event.title)}”的长期影响，需结合后续记载核定。`];
  const uncertainty = [
    sourceCount <= 1
      ? "当前结构化证据仅绑定单一来源条目；背景与长期影响需以其他材料交叉核定。"
      : `当前结构化证据已关联 ${sourceCount} 个来源，但事件边界与人物角色仍保留人工审核。`,
    `结果和影响只收录${materialLabel}明示内容；共享人物、地点或时间接近不自动解释为因果。`,
    ...chronologySourceNotes(event),
    ...sourceComparisonNotes(event.summary),
    possibleDuplicate
      ? `本事件与“${eventTitleById.get(possibleDuplicate.eventId) ?? possibleDuplicate.eventId}”的原文高度重合，正式发布前应核定是否合并。`
      : null,
  ].filter(Boolean);

  const evidenceLinkIds = evidence.map((item) => item.id ?? item.evidenceId).filter(Boolean);
  return {
    detail: {
      overview,
      background,
      process,
      result,
      impact,
      sourceNotes: sourceNotes.length ? sourceNotes : ["当前事件已绑定史料证据，但尚缺可读的来源题名或定位。"],
      uncertainty,
    },
    fieldProvenance: {
      overview: { method: "cleaned-event-summary", evidenceLinkIds },
      background: { method: backgroundDirect.length ? "pre-action-source-clause" : "source-limitation", evidenceLinkIds },
      process: { method: "source-action-clauses", evidenceLinkIds },
      result: { method: resultDirect.length ? "explicit-source-outcome" : "source-limitation", evidenceLinkIds },
      impact: { method: impactDirect.length ? "explicit-source-consequence" : "source-limitation", evidenceLinkIds },
      sourceNotes: { method: "evidence-link-metadata", evidenceLinkIds },
      uncertainty: { method: "enrichment-policy", evidenceLinkIds },
    },
  };
}
