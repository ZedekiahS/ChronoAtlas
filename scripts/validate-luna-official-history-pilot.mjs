import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractExplicitOfficialHistoryPeople } from "./lib/china-official-history-reference-resolver.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultRunDir = path.join(rootDir, "data", "import-drafts", "luna");

function argumentValue(name, fallback) {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
  return value === undefined ? fallback : value;
}

function resolveArgumentPath(name, fallback) {
  return path.resolve(rootDir, argumentValue(name, fallback));
}

const inputPath = resolveArgumentPath(
  "--input",
  path.join(defaultRunDir, "xin-transition--8-24-pilot-input.jsonl"),
);
const outputPath = resolveArgumentPath(
  "--output",
  path.join(defaultRunDir, "xin-transition--8-24-pilot-output.jsonl"),
);
const summaryPath = resolveArgumentPath(
  "--summary",
  path.join(defaultRunDir, "xin-transition--8-24-pilot-summary.json"),
);
const expectedCount = Number(argumentValue("--expected", 40));
const inputOnly = process.argv.includes("--input-only");

const allowedRecommendations = new Set(["eligible", "candidate_only", "reject"]);
const allowedPassageClasses = new Set([
  "narrative",
  "quotation",
  "commentary",
  "textual_note",
  "career_record",
  "institutional_description",
  "mixed",
  "unknown",
]);
const allowedFactTypes = new Set([
  "military",
  "succession",
  "administration",
  "diplomacy",
  "elite_network",
  "service",
]);
const allowedEventScales = new Set(["major", "medium", "minor"]);
const allowedConfidence = new Set(["high", "medium", "low"]);
const allowedPersonKinds = new Set(["known", "new_candidate", "ambiguous"]);
const allowedPersonRoles = new Set([
  "actor",
  "co_actor",
  "opponent",
  "target",
  "victim",
  "recipient",
  "ruler",
  "commander",
  "envoy",
  "participant",
]);
const allowedPlaceRoles = new Set([
  "primary",
  "origin",
  "destination",
  "battlefield",
  "capital",
  "jurisdiction",
  "mentioned",
]);
const blockingFlags = new Set([
  "commentary",
  "textual_criticism",
  "quotation_only",
  "routine_career",
  "generic_office_record",
  "unresolved_pronoun",
  "unresolved_actor",
  "unresolved_object",
  "unresolved_recipient",
  "ambiguous_person",
  "ambiguous_place",
  "chronology_unresolved",
  "title_incomplete",
  "evidence_not_exact",
  "source_section_not_allowed",
]);
const confidenceRank = new Map([
  ["low", 1],
  ["medium", 2],
  ["high", 3],
]);
const allowedSelectionBuckets = new Set([
  "event-high-chronology",
  "event-context-chronology",
  "event-unresolved-chronology",
  "negative",
]);

const failures = [];
const warnings = [];

function addIssue(target, type, details = {}) {
  target.push({ type, ...details });
}

function readJsonLines(filePath, label) {
  if (!fs.existsSync(filePath)) {
    addIssue(failures, "missing-file", { label, file: path.relative(rootDir, filePath) });
    return [];
  }
  const lines = fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.flatMap((line, index) => {
    try {
      return [{ lineNumber: index + 1, value: JSON.parse(line) }];
    } catch (error) {
      addIssue(failures, "invalid-jsonl", {
        label,
        lineNumber: index + 1,
        message: error.message,
      });
      return [];
    }
  });
}

function valuesByTaskId(records, label) {
  const byId = new Map();
  for (const record of records) {
    const taskId = record.value?.task_id;
    if (typeof taskId !== "string" || !taskId.trim()) {
      addIssue(failures, "missing-task-id", { label, lineNumber: record.lineNumber });
      continue;
    }
    if (byId.has(taskId)) {
      addIssue(failures, "duplicate-task-id", { label, taskId, lineNumber: record.lineNumber });
      continue;
    }
    byId.set(taskId, record.value);
  }
  return byId;
}

function hasText(haystack, needle) {
  return typeof needle === "string" && needle.length > 0 && String(haystack ?? "").includes(needle);
}

function validateEnum(value, allowed, type, context) {
  if (!allowed.has(value)) addIssue(failures, type, { ...context, value });
}

function validateInput(input) {
  const taskId = input?.task_id ?? null;
  if (typeof input?.target_text !== "string" || !input.target_text.trim()) {
    addIssue(failures, "missing-target-text", { taskId });
  }
  if (!Array.isArray(input?.chronology_candidates)) {
    addIssue(failures, "invalid-chronology-candidates", { taskId });
  } else {
    for (const [candidateIndex, candidate] of input.chronology_candidates.entries()) {
      if (!Number.isInteger(candidate?.year) || candidate.year === 0) {
        addIssue(failures, "invalid-input-year", { taskId, candidateIndex, year: candidate?.year ?? null });
      }
      if (
        Number.isInteger(candidate?.year)
        && (
          candidate.year < input.profile?.time_start
          || candidate.year > input.profile?.time_end
        )
      ) {
        addIssue(failures, "input-year-outside-profile", { taskId, candidateIndex, year: candidate.year });
      }
      validateEnum(candidate?.confidence, allowedConfidence, "invalid-input-chronology-confidence", {
        taskId,
        candidateIndex,
      });
    }
  }
  if (!Array.isArray(input?.known_people)) addIssue(failures, "invalid-known-people", { taskId });
  if (!Array.isArray(input?.known_places)) addIssue(failures, "invalid-known-places", { taskId });
  validateEnum(input?.selection?.bucket, allowedSelectionBuckets, "invalid-selection-bucket", { taskId });
  if (
    input?.selection?.bucket?.startsWith("event-")
    && /(?:师古|師古|应劭|應劭|臣瓒|臣瓚|校勘|[〇０零一二三四五六七八九十百千\d]{2,8}頁|[\p{Script=Han}]{1,8}(?:故城)?在今)/u.test(input.target_text)
  ) {
    addIssue(failures, "event-input-contains-commentary", { taskId, targetText: input.target_text });
  }
  const contextText = `${input?.context_before ?? ""}\n${input?.target_text ?? ""}\n${input?.context_after ?? ""}`;
  for (const [personIndex, person] of (input?.known_people ?? []).entries()) {
    const surfaces = person?.matched_surfaces ?? [];
    if (!Array.isArray(surfaces) || !surfaces.some((surface) => hasText(contextText, surface))) {
      addIssue(failures, "known-person-surface-not-found", { taskId, personIndex, personId: person?.id ?? null });
    }
  }
  for (const [placeIndex, place] of (input?.known_places ?? []).entries()) {
    const surfaces = place?.matched_surfaces ?? [];
    if (!Array.isArray(surfaces) || !surfaces.some((surface) => hasText(input.target_text, surface))) {
      addIssue(failures, "known-place-surface-not-found", { taskId, placeIndex, placeId: place?.id ?? null });
    }
  }
  const personIds = (input?.known_people ?? []).map((person) => person?.id).filter(Boolean);
  if (new Set(personIds).size !== personIds.length) addIssue(failures, "duplicate-known-person-id", { taskId });
  const placeIds = (input?.known_places ?? []).map((place) => place?.id).filter(Boolean);
  if (new Set(placeIds).size !== placeIds.length) addIssue(failures, "duplicate-known-place-id", { taskId });
  const allowedSections = new Set(input?.profile?.allowed_source_section_types ?? []);
  if (allowedSections.size && !allowedSections.has(input?.source?.section_type)) {
    addIssue(failures, "input-source-section-not-allowed", {
      taskId,
      sectionType: input?.source?.section_type ?? null,
    });
  }
}

function validateTitle(event, context) {
  if (event.recommendation !== "eligible" && event.title === null) return;
  if (typeof event.title !== "string") {
    addIssue(failures, "invalid-title", context);
    return;
  }
  const length = Array.from(event.title).length;
  if (length < 4 || length > 18) addIssue(failures, "title-length", { ...context, title: event.title, length });
  if (/[，。；、！？!?;,:：]/u.test(event.title)) {
    addIssue(failures, "title-punctuation", { ...context, title: event.title });
  }
  if (/(?:之|其|焉|尔|爾)$/u.test(event.title)) {
    addIssue(failures, "title-unresolved-object", { ...context, title: event.title });
  }
  if (/(?<!所)(?:讨|討|伐|攻|击|擊|追击|追擊|围|圍|破|斩|斬|杀|殺|诛|誅)$/u.test(event.title)) {
    addIssue(failures, "title-missing-object", { ...context, title: event.title });
  }
}

function validateTime(event, input, context) {
  const time = event.time;
  if (!time || typeof time !== "object") {
    addIssue(failures, "missing-time", context);
    return;
  }
  validateEnum(time.confidence, allowedConfidence, "invalid-time-confidence", context);
  const candidates = Array.isArray(input.chronology_candidates) ? input.chronology_candidates : [];
  const candidateYears = new Set(candidates.map((candidate) => candidate?.year).filter(Number.isInteger));
  if (time.resolved_year !== null && !Number.isInteger(time.resolved_year)) {
    addIssue(failures, "invalid-resolved-year", { ...context, resolvedYear: time.resolved_year });
  } else if (Number.isInteger(time.resolved_year) && !candidateYears.has(time.resolved_year)) {
    addIssue(failures, "year-not-in-candidates", { ...context, resolvedYear: time.resolved_year });
  }
  if (Number.isInteger(time.chronology_candidate_index)) {
    const candidate = candidates[time.chronology_candidate_index];
    if (!candidate) {
      addIssue(failures, "invalid-chronology-index", {
        ...context,
        chronologyCandidateIndex: time.chronology_candidate_index,
      });
    } else if (candidate.year !== time.resolved_year) {
      addIssue(failures, "chronology-index-year-mismatch", {
        ...context,
        chronologyCandidateIndex: time.chronology_candidate_index,
        candidateYear: candidate.year,
        resolvedYear: time.resolved_year,
      });
    }
  } else if (time.chronology_candidate_index !== null) {
    addIssue(failures, "invalid-chronology-index", {
      ...context,
      chronologyCandidateIndex: time.chronology_candidate_index,
    });
  }
}

function validatePeople(event, input, context, counters) {
  if (!Array.isArray(event.people)) {
    addIssue(failures, "invalid-people", context);
    return;
  }
  const knownIds = new Set((input.known_people ?? []).map((person) => person?.id).filter(Boolean));
  const evidenceText = event?.evidence_quote ?? "";
  for (const [personIndex, person] of event.people.entries()) {
    const personContext = { ...context, personIndex, displayName: person?.display_name ?? null };
    counters.people += 1;
    if (person?.is_secondary === true) counters.secondaryPeople += 1;
    validateEnum(person?.candidate_kind, allowedPersonKinds, "invalid-person-kind", personContext);
    validateEnum(person?.role, allowedPersonRoles, "invalid-person-role", personContext);
    validateEnum(person?.confidence, allowedConfidence, "invalid-person-confidence", personContext);
    if (typeof person?.is_secondary !== "boolean") addIssue(failures, "invalid-secondary-flag", personContext);
    if (person?.known_person_id !== null && !knownIds.has(person.known_person_id)) {
      addIssue(failures, "unknown-person-id", { ...personContext, personId: person.known_person_id });
    }
    if (person?.candidate_kind === "known" && person?.known_person_id === null) {
      addIssue(failures, "known-person-without-id", personContext);
    }
    if (person?.known_person_id !== null && person?.candidate_kind !== "known") {
      addIssue(failures, "bound-person-not-marked-known", personContext);
    }
    if (typeof person?.display_name !== "string" || !person.display_name.trim()) {
      addIssue(failures, "missing-person-display-name", personContext);
    }
    const personFlags = new Set(Array.isArray(person?.flags) ? person.flags : []);
    const allowsContext = personFlags.has("cross_context_resolution");
    const evidenceMatches = hasText(evidenceText, person?.evidence_quote)
      || (allowsContext && (
        hasText(input.target_text, person?.evidence_quote)
        ||
        hasText(input.context_before, person?.evidence_quote)
        || hasText(input.context_after, person?.evidence_quote)
      ));
    if (!evidenceMatches) addIssue(failures, "person-evidence-not-exact", personContext);
    const surfaceMatches = hasText(evidenceText, person?.surface)
      || (allowsContext && (
        hasText(input.target_text, person?.surface)
        ||
        hasText(input.context_before, person?.surface)
        || hasText(input.context_after, person?.surface)
      ));
    if (!surfaceMatches) addIssue(failures, "person-surface-not-found", personContext);
  }

  const peopleById = new Set(event.people.map((person) => person?.known_person_id).filter(Boolean));
  const idsBySurface = new Map();
  for (const knownPerson of input.known_people ?? []) {
    if (typeof knownPerson?.canonical_name === "string" && event?.title?.includes(knownPerson.canonical_name)) {
      if (!peopleById.has(knownPerson.id)) {
        addIssue(failures, "title-known-person-not-bound", {
          ...context,
          personId: knownPerson.id,
          canonicalName: knownPerson.canonical_name,
        });
      }
    }
    for (const surface of knownPerson?.matched_surfaces ?? []) {
      if (!hasText(evidenceText, surface)) continue;
      const ids = idsBySurface.get(surface) ?? new Set();
      ids.add(knownPerson.id);
      idsBySurface.set(surface, ids);
    }
  }
  for (const [surface, ids] of idsBySurface) {
    if (ids.size !== 1) continue;
    const personId = [...ids][0];
    if (!peopleById.has(personId)) {
      addIssue(failures, "known-person-in-evidence-not-bound", { ...context, surface, personId });
    }
  }
}

function validatePlaces(event, input, context, counters) {
  if (!Array.isArray(event.places)) {
    addIssue(failures, "invalid-places", context);
    return;
  }
  const knownIds = new Set((input.known_places ?? []).map((place) => place?.id).filter(Boolean));
  const evidenceText = event?.evidence_quote ?? "";
  for (const [placeIndex, place] of event.places.entries()) {
    const placeContext = { ...context, placeIndex, surface: place?.surface ?? null };
    counters.places += 1;
    validateEnum(place?.role, allowedPlaceRoles, "invalid-place-role", placeContext);
    validateEnum(place?.confidence, allowedConfidence, "invalid-place-confidence", placeContext);
    if (place?.known_place_id !== null && !knownIds.has(place.known_place_id)) {
      addIssue(failures, "unknown-place-id", { ...placeContext, placeId: place.known_place_id });
    }
    if (!hasText(evidenceText, place?.evidence_quote)) {
      addIssue(failures, "place-evidence-not-exact", placeContext);
    }
    if (!hasText(evidenceText, place?.surface)) {
      addIssue(failures, "place-surface-not-found", placeContext);
    }
  }

  const placesById = new Set(event.places.map((place) => place?.known_place_id).filter(Boolean));
  const idsBySurface = new Map();
  for (const knownPlace of input.known_places ?? []) {
    for (const surface of knownPlace?.matched_surfaces ?? []) {
      if (!hasText(evidenceText, surface)) continue;
      const ids = idsBySurface.get(surface) ?? new Set();
      ids.add(knownPlace.id);
      idsBySurface.set(surface, ids);
    }
  }
  for (const [surface, ids] of idsBySurface) {
    if (ids.size !== 1) continue;
    const placeId = [...ids][0];
    if (!placesById.has(placeId)) {
      addIssue(failures, "known-place-in-evidence-not-bound", { ...context, surface, placeId });
    }
  }
}

function validatePossiblePeople(event, input, context) {
  const extracted = extractExplicitOfficialHistoryPeople(event?.evidence_quote ?? "", [], {
    contextKey: input.source?.source_id ?? "luna-pilot",
  });
  const outputNames = new Set((event.people ?? []).flatMap((person) => [
    person?.surface,
    person?.display_name,
  ].filter(Boolean)));
  const missing = extracted
    .map((person) => person.name)
    .filter((name) => ![...outputNames].some((outputName) => outputName.includes(name) || name.includes(outputName)));
  if (missing.length) {
    addIssue(warnings, "possible-person-omission", { ...context, names: [...new Set(missing)] });
  }
}

function validateEligible(event, input, context) {
  if (event.recommendation !== "eligible") return;
  const flags = new Set(Array.isArray(event.flags) ? event.flags : []);
  const blockers = [...flags].filter((flag) => blockingFlags.has(flag));
  if (blockers.length) addIssue(failures, "eligible-with-blocking-flags", { ...context, flags: blockers });
  const profile = input.profile ?? {};
  const allowedSections = new Set(profile.allowed_source_section_types ?? []);
  if (allowedSections.size && !allowedSections.has(input.source?.section_type)) {
    addIssue(failures, "eligible-source-section-not-allowed", {
      ...context,
      sectionType: input.source?.section_type ?? null,
    });
  }
  const minimum = profile.minimum_chronology_confidence ?? "low";
  const actual = event.time?.confidence;
  if ((confidenceRank.get(actual) ?? 0) < (confidenceRank.get(minimum) ?? 0)) {
    addIssue(failures, "eligible-chronology-below-profile", { ...context, actual, minimum });
  }
  if (!Number.isInteger(event.time?.resolved_year)) {
    addIssue(failures, "eligible-without-resolved-year", context);
  }
  if (event.confidence !== "high") {
    addIssue(failures, "eligible-event-confidence-not-high", { ...context, confidence: event.confidence ?? null });
  }
  if (event.fact_type === "succession" && !event.people?.length && !/(?:改元|迁都|遷都)/u.test(event.title ?? "")) {
    addIssue(failures, "eligible-succession-without-person", context);
  }
}

function validateOutput(output, input, counters) {
  const taskId = output.task_id;
  if (output.schema_version !== "chronoatlas-official-history-extraction-v1") {
    addIssue(failures, "invalid-schema-version", { taskId, value: output.schema_version });
  }
  validateEnum(output.passage_class, allowedPassageClasses, "invalid-passage-class", { taskId });
  if (!Array.isArray(output.events)) {
    addIssue(failures, "invalid-events", { taskId });
    return;
  }
  if (!Array.isArray(output.rejection_reasons)) addIssue(failures, "invalid-rejection-reasons", { taskId });
  if (!Array.isArray(output.passage_flags)) addIssue(failures, "invalid-passage-flags", { taskId });
  if (!output.events.length && !output.rejection_reasons?.length) {
    addIssue(failures, "no-event-without-rejection-reason", { taskId });
  }
  if (output.events.length && output.rejection_reasons?.length) {
    addIssue(failures, "events-with-rejection-reasons", { taskId });
  }
  if (!output.events.length && output.rejection_reasons?.length) counters.rejectedPassages += 1;
  if (!output.events.length) counters.noEvent += 1;
  const sourceId = input.source?.source_id ?? "unknown";
  counters.sourceCounts.set(sourceId, (counters.sourceCounts.get(sourceId) ?? 0) + 1);

  const seenIndexes = new Set();
  for (const [arrayIndex, event] of output.events.entries()) {
    counters.events += 1;
    const context = { taskId, eventIndex: event?.event_index ?? arrayIndex };
    if (!Number.isInteger(event?.event_index) || event.event_index < 0 || seenIndexes.has(event.event_index)) {
      addIssue(failures, "invalid-event-index", context);
    }
    seenIndexes.add(event?.event_index);
    validateEnum(event?.recommendation, allowedRecommendations, "invalid-recommendation", context);
    validateEnum(event?.fact_type, allowedFactTypes, "invalid-fact-type", context);
    validateEnum(event?.event_scale, allowedEventScales, "invalid-event-scale", context);
    validateEnum(event?.confidence, allowedConfidence, "invalid-event-confidence", context);
    if (event?.recommendation !== "reject" && (typeof event?.summary !== "string" || !event.summary.trim())) {
      addIssue(failures, "missing-event-summary", context);
    }
    if (!Array.isArray(event?.flags)) addIssue(failures, "invalid-event-flags", context);
    if (!Array.isArray(event?.reasons)) addIssue(failures, "invalid-event-reasons", context);
    if (allowedRecommendations.has(event?.recommendation)) counters.recommendations[event.recommendation] += 1;
    if (event?.recommendation !== "reject" && !hasText(input.target_text, event?.evidence_quote)) {
      addIssue(failures, "event-evidence-not-exact", context);
    } else if (event?.recommendation === "reject" && event?.evidence_quote && !hasText(input.target_text, event.evidence_quote)) {
      addIssue(failures, "event-evidence-not-exact", context);
    }
    validateTitle(event, context);
    validateTime(event, input, context);
    validatePeople(event, input, context, counters);
    validatePlaces(event, input, context, counters);
    validatePossiblePeople(event, input, context);
    validateEligible(event, input, context);
    for (const flag of event?.flags ?? []) counters.flags.set(flag, (counters.flags.get(flag) ?? 0) + 1);
  }
}

const inputRecords = readJsonLines(inputPath, "input");
const outputRecords = inputOnly ? [] : readJsonLines(outputPath, "output");
const inputByTaskId = valuesByTaskId(inputRecords, "input");
const outputByTaskId = valuesByTaskId(outputRecords, "output");
for (const input of inputByTaskId.values()) validateInput(input);

if (inputOnly && expectedCount === 40) {
  const selectionCounts = {};
  const resolvedYears = new Set();
  for (const input of inputByTaskId.values()) {
    const bucket = input.selection?.bucket;
    selectionCounts[bucket] = (selectionCounts[bucket] ?? 0) + 1;
    for (const candidate of input.chronology_candidates ?? []) resolvedYears.add(candidate.year);
  }
  const expectedSelectionCounts = {
    "event-high-chronology": 18,
    "event-context-chronology": 6,
    "event-unresolved-chronology": 6,
    negative: 10,
  };
  for (const [bucket, expected] of Object.entries(expectedSelectionCounts)) {
    if ((selectionCounts[bucket] ?? 0) !== expected) {
      addIssue(failures, "unexpected-selection-count", {
        bucket,
        expected,
        actual: selectionCounts[bucket] ?? 0,
      });
    }
  }
  for (const boundaryYear of [-8, 24]) {
    if (!resolvedYears.has(boundaryYear)) addIssue(failures, "missing-boundary-year", { year: boundaryYear });
  }
}

if (Number.isFinite(expectedCount) && expectedCount >= 0) {
  if (inputRecords.length !== expectedCount) {
    addIssue(failures, "unexpected-input-count", { expected: expectedCount, actual: inputRecords.length });
  }
  if (!inputOnly && outputRecords.length !== expectedCount) {
    addIssue(failures, "unexpected-output-count", { expected: expectedCount, actual: outputRecords.length });
  }
}

if (!inputOnly) {
  for (let index = 0; index < Math.min(inputRecords.length, outputRecords.length); index += 1) {
    const inputTaskId = inputRecords[index].value?.task_id ?? null;
    const outputTaskId = outputRecords[index].value?.task_id ?? null;
    if (inputTaskId !== outputTaskId) {
      addIssue(failures, "output-task-order-mismatch", {
        lineNumber: index + 1,
        inputTaskId,
        outputTaskId,
      });
    }
  }
  for (const taskId of inputByTaskId.keys()) {
    if (!outputByTaskId.has(taskId)) addIssue(failures, "missing-output-task", { taskId });
  }
  for (const taskId of outputByTaskId.keys()) {
    if (!inputByTaskId.has(taskId)) addIssue(failures, "orphan-output-task", { taskId });
  }
}

const counters = {
  events: 0,
  rejectedPassages: 0,
  noEvent: 0,
  people: 0,
  secondaryPeople: 0,
  places: 0,
  recommendations: { eligible: 0, candidate_only: 0, reject: 0 },
  flags: new Map(),
  sourceCounts: new Map(),
};

for (const [taskId, output] of outputByTaskId) {
  const input = inputByTaskId.get(taskId);
  if (input) validateOutput(output, input, counters);
}

function validateSummary(summary) {
  const sortedObject = (value) => Object.fromEntries(
    Object.entries(value && typeof value === "object" && !Array.isArray(value) ? value : {})
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  const expectedRecommendations = {
    ...counters.recommendations,
    no_event: counters.noEvent,
  };
  const expectedFlags = Object.fromEntries(
    [...counters.flags.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
  const expectedSourceCounts = Object.fromEntries(
    [...counters.sourceCounts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
  const scalarFields = {
    input_count: inputRecords.length,
    output_count: outputRecords.length,
    event_count: counters.events,
    people_candidate_count: counters.people,
    secondary_people_count: counters.secondaryPeople,
    place_mention_count: counters.places,
  };
  for (const [field, expected] of Object.entries(scalarFields)) {
    if (summary?.[field] !== expected) {
      addIssue(failures, "summary-count-mismatch", { field, expected, actual: summary?.[field] ?? null });
    }
  }
  for (const [field, expected] of [
    ["recommendations", expectedRecommendations],
    ["blocking_flag_counts", expectedFlags],
    ["source_counts", expectedSourceCounts],
  ]) {
    const actual = summary?.[field] ?? null;
    if (JSON.stringify(sortedObject(actual)) !== JSON.stringify(sortedObject(expected))) {
      addIssue(failures, "summary-object-mismatch", { field, expected, actual });
    }
  }
}

if (!inputOnly && !fs.existsSync(summaryPath)) {
  addIssue(failures, "missing-file", { label: "summary", file: path.relative(rootDir, summaryPath) });
} else if (!inputOnly) {
  try {
    validateSummary(JSON.parse(fs.readFileSync(summaryPath, "utf8")));
  } catch (error) {
    addIssue(failures, "invalid-summary-json", { message: error.message });
  }
}

const report = {
  mode: inputOnly ? "input-only" : "input-output",
  files: {
    input: path.relative(rootDir, inputPath),
    output: path.relative(rootDir, outputPath),
    summary: path.relative(rootDir, summaryPath),
  },
  records: {
    input: inputRecords.length,
    output: outputRecords.length,
    paired: [...inputByTaskId.keys()].filter((taskId) => outputByTaskId.has(taskId)).length,
  },
  extraction: {
    events: counters.events,
    recommendations: counters.recommendations,
    rejectedPassages: counters.rejectedPassages,
    people: counters.people,
    secondaryPeople: counters.secondaryPeople,
    places: counters.places,
    flags: Object.fromEntries([...counters.flags.entries()].sort(([left], [right]) => left.localeCompare(right))),
    noEvent: counters.noEvent,
  },
  validation: {
    failures: failures.length,
    warnings: warnings.length,
  },
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error("\nValidation failures:");
  console.error(JSON.stringify(failures.slice(0, 50), null, 2));
  if (failures.length > 50) console.error(`... ${failures.length - 50} additional failures omitted`);
}
if (warnings.length) {
  console.warn("\nValidation warnings:");
  console.warn(JSON.stringify(warnings.slice(0, 50), null, 2));
}

process.exitCode = failures.length ? 1 : 0;
