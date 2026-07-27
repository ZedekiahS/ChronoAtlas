import { createHash } from "node:crypto";

export const OFFICIAL_HISTORY_EXTRACTION_SCHEMA_VERSION = "chronoatlas-official-history-extraction-v1";
export const SEMANTIC_CANDIDATE_PIPELINE = "official-history-semantic-candidates-v1";

export function stableSemanticId(value, length = 24) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

export function compactSemanticText(value) {
  return String(value ?? "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSemanticIdentity(value) {
  return compactSemanticText(value)
    .toLowerCase()
    .replace(/[《》〈〉「」『』“”‘’：:，,。.、；;！？?!（）()\[\]【】\s]/gu, "")
    .slice(0, 120);
}

export function semanticCandidateIds(batchId, taskId, eventIndex) {
  const key = `${batchId}:${taskId}:${eventIndex}`;
  const suffix = stableSemanticId(key);
  return {
    cardId: `card:official-history-semantic:${suffix}`,
    clusterId: `cluster:official-history-semantic:${suffix}`,
    mentionId: `official-history-semantic-candidate:${suffix}`,
    searchDocumentId: `official-history-semantic-candidate:${suffix}`,
  };
}

function assertRecord(condition, message) {
  if (!condition) throw new Error(message);
}

function knownPersonRecord(person) {
  return {
    id: person.known_person_id,
    name: compactSemanticText(person.display_name),
    matched: compactSemanticText(person.surface),
    role: person.role,
    confidence: person.confidence,
    secondary: person.is_secondary === true,
  };
}

function discoveredPersonRecord(person) {
  return {
    name: compactSemanticText(person.display_name),
    matched: compactSemanticText(person.surface),
    role: person.role,
    confidence: person.confidence,
    secondary: person.is_secondary === true,
    evidence: "source-person-context",
    candidateKind: person.candidate_kind,
    flags: Array.isArray(person.flags) ? person.flags : [],
  };
}

function placeRecord(place) {
  return {
    id: place.known_place_id,
    label: compactSemanticText(place.surface),
    matched: compactSemanticText(place.surface),
    role: place.role,
    confidence: place.confidence,
    flags: Array.isArray(place.flags) ? place.flags : [],
  };
}

function sourceFileId(batchId, taskId) {
  return `official-history-semantic-file:${stableSemanticId(`${batchId}:${taskId}`)}`;
}

export function buildSemanticCandidateRecords(inputRecords, outputRecords, options) {
  const batchId = compactSemanticText(options?.batchId);
  assertRecord(batchId, "Semantic candidate import requires batchId");
  const inputByTask = new Map(inputRecords.map((record) => [record.task_id, record]));
  assertRecord(inputByTask.size === inputRecords.length, "Semantic candidate input contains duplicate task_id values");
  const outputByTask = new Map(outputRecords.map((record) => [record.task_id, record]));
  assertRecord(outputByTask.size === outputRecords.length, "Semantic candidate output contains duplicate task_id values");
  assertRecord(inputByTask.size === outputByTask.size, "Semantic candidate input/output counts differ");

  const files = [];
  const cards = [];
  for (const [taskId, input] of inputByTask) {
    const output = outputByTask.get(taskId);
    assertRecord(output, `Missing semantic output for task ${taskId}`);
    assertRecord(
      output.schema_version === OFFICIAL_HISTORY_EXTRACTION_SCHEMA_VERSION,
      `Unsupported semantic output schema for task ${taskId}`,
    );
    const events = Array.isArray(output.events) ? output.events : [];
    const profileId = input.profile?.profile_id ?? options.profileId ?? null;
    const file = {
      id: sourceFileId(batchId, taskId),
      taskId,
      profileId,
      sourceId: input.source?.source_id ?? null,
      passageId: input.source?.passage_id ?? null,
      relativePath: `${options.outputLabel ?? "semantic-output"}#${taskId}`,
      cardCount: events.length,
      importStatus: events.some((event) => event.recommendation !== "eligible") ? "needs-fix" : "staged",
      raw: {
        pipeline: SEMANTIC_CANDIDATE_PIPELINE,
        schemaVersion: output.schema_version,
        taskId,
        profileId,
        passageClass: output.passage_class,
        rejectionReasons: output.rejection_reasons ?? [],
        passageFlags: output.passage_flags ?? [],
      },
    };
    files.push(file);

    for (const event of events) {
      assertRecord(Number.isInteger(event.event_index), `Invalid event_index for task ${taskId}`);
      const ids = semanticCandidateIds(batchId, taskId, event.event_index);
      const knownPeople = (event.people ?? []).filter((person) => person.known_person_id).map(knownPersonRecord);
      const discoveredPeople = (event.people ?? []).filter((person) => !person.known_person_id).map(discoveredPersonRecord);
      const primaryPeople = (event.people ?? [])
        .filter((person) => person.is_secondary !== true)
        .map((person) => compactSemanticText(person.display_name));
      const secondaryPeople = (event.people ?? [])
        .filter((person) => person.is_secondary === true)
        .map((person) => compactSemanticText(person.display_name));
      const places = (event.places ?? []).map(placeRecord);
      const year = Number.isInteger(event.time?.resolved_year) ? event.time.resolved_year : null;
      const chronology = {
        year,
        expression: event.time?.source_expression ?? "",
        method: event.time?.basis ?? null,
        confidence: event.time?.confidence ?? "low",
        chronologyCandidateIndex: event.time?.chronology_candidate_index ?? null,
      };
      const raw = {
        generatedFrom: batchId,
        pipeline: SEMANTIC_CANDIDATE_PIPELINE,
        candidateKind: "source-event-fact",
        schemaVersion: output.schema_version,
        profileId,
        promotionProfile: options.promotionProfile ?? profileId,
        regionId: options.regionId ?? "china",
        taskId,
        eventIndex: event.event_index,
        mentionId: ids.mentionId,
        sourceId: input.source?.source_id ?? null,
        passageId: input.source?.passage_id ?? null,
        sourceSectionType: input.source?.section_type ?? null,
        sourceSectionLabel: input.source?.section_label ?? null,
        periodHint: options.periodId ?? null,
        sourceTimeRange: input.source?.source_time_range ?? [null, null],
        sentenceChronology: chronology,
        eventScale: event.event_scale,
        semanticRecommendation: event.recommendation,
        semanticConfidence: event.confidence,
        semanticFlags: event.flags ?? [],
        semanticReasons: event.reasons ?? [],
        extractedPeople: knownPeople,
        discoveredPeople,
        extractedPlaces: places,
        peopleCore: primaryPeople,
        peopleMentioned: secondaryPeople,
        places: places.map((place) => place.label),
        personRoles: (event.people ?? []).map((person) => ({
          name: compactSemanticText(person.display_name),
          role: person.role,
          secondary: person.is_secondary === true,
        })),
        placeRoles: places.map((place) => ({ label: place.label, role: place.role })),
        evidenceQuote: event.evidence_quote,
      };
      cards.push({
        ...ids,
        batchId,
        fileId: file.id,
        taskId,
        eventIndex: event.event_index,
        profileId,
        source: input.source ?? {},
        title: compactSemanticText(event.title),
        summary: compactSemanticText(event.summary),
        evidence: compactSemanticText(event.evidence_quote),
        factType: event.fact_type,
        eventScale: event.event_scale,
        confidence: event.confidence,
        recommendation: event.recommendation,
        year,
        chronology,
        primaryPeople,
        secondaryPeople,
        knownPeople,
        discoveredPeople,
        places,
        flags: event.flags ?? [],
        reasons: event.reasons ?? [],
        raw,
      });
    }
  }

  for (const taskId of outputByTask.keys()) {
    assertRecord(inputByTask.has(taskId), `Orphan semantic output for task ${taskId}`);
  }

  return { files, cards };
}

export function compactSemanticGoldenProjection(outputRecords) {
  return outputRecords.map((output) => ({
    taskId: output.task_id,
    passageClass: output.passage_class,
    rejectionReasons: output.rejection_reasons ?? [],
    events: (output.events ?? []).map((event) => ({
      index: event.event_index,
      recommendation: event.recommendation,
      title: event.title,
      year: event.time?.resolved_year ?? null,
      factType: event.fact_type,
      people: (event.people ?? []).map((person) => [
        person.display_name,
        person.known_person_id,
        person.role,
        person.is_secondary,
      ]),
      places: (event.places ?? []).map((place) => [place.surface, place.known_place_id, place.role]),
      flags: event.flags ?? [],
    })),
  }));
}
