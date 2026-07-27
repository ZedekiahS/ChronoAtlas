import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildSemanticCandidateRecords,
  semanticCandidateIds,
} from "./official-history-semantic-candidate-contract.mjs";
import {
  projectExtractionGoldenRecord,
  xinTransitionExtractionGolden40,
} from "../data/official-history-extraction-golden-xin-transition-40.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

test("semantic candidate IDs are stable and event-scoped", () => {
  const first = semanticCandidateIds("batch", "task", 0);
  assert.deepEqual(first, semanticCandidateIds("batch", "task", 0));
  assert.notEqual(first.cardId, semanticCandidateIds("batch", "task", 1).cardId);
  assert.match(first.cardId, /^card:official-history-semantic:[a-f0-9]{24}$/u);
});

test("semantic candidate contract separates known and provisional people", () => {
  const input = {
    task_id: "task-1",
    profile: { profile_id: "profile-1" },
    source: { source_id: "source-1", passage_id: "passage-1", section_type: "annal" },
  };
  const output = {
    schema_version: "chronoatlas-official-history-extraction-v1",
    task_id: "task-1",
    passage_class: "narrative",
    rejection_reasons: [],
    passage_flags: [],
    events: [{
      event_index: 0,
      recommendation: "eligible",
      title: "甲攻乙城",
      summary: "甲攻乙城。",
      evidence_quote: "甲攻乙城。",
      fact_type: "military",
      event_scale: "medium",
      confidence: "high",
      flags: [],
      reasons: [],
      time: { resolved_year: 25, confidence: "high", basis: "explicit" },
      people: [
        { surface: "甲", display_name: "甲", known_person_id: "person-a", role: "actor", is_secondary: false, confidence: "high", candidate_kind: "known", flags: [] },
        { surface: "乙", display_name: "乙", known_person_id: null, role: "opponent", is_secondary: true, confidence: "high", candidate_kind: "new_candidate", flags: [] },
      ],
      places: [{ surface: "乙城", known_place_id: "place:b", role: "battlefield", confidence: "high", flags: [] }],
    }],
  };
  const result = buildSemanticCandidateRecords([input], [output], { batchId: "batch-1" });
  assert.equal(result.files.length, 1);
  assert.equal(result.cards.length, 1);
  assert.deepEqual(result.cards[0].primaryPeople, ["甲"]);
  assert.deepEqual(result.cards[0].secondaryPeople, ["乙"]);
  assert.equal(result.cards[0].knownPeople[0].id, "person-a");
  assert.equal(result.cards[0].discoveredPeople[0].name, "乙");
  assert.equal(result.cards[0].raw.semanticRecommendation, "eligible");
});

test("40-record adjudicated golden set retains extraction gates", () => {
  assert.equal(xinTransitionExtractionGolden40.length, 40);
  const events = xinTransitionExtractionGolden40.flatMap((record) => record[3]);
  assert.equal(events.length, 28);
  assert.equal(events.filter((event) => event[1] === "eligible").length, 8);
  assert.equal(events.filter((event) => event[1] === "candidate_only").length, 20);
  assert.equal(xinTransitionExtractionGolden40.filter((record) => record[3].length === 0).length, 14);
  assert.equal(events.reduce((sum, event) => sum + event[5], 0), 42);
  assert.equal(events.reduce((sum, event) => sum + event[6], 0), 21);
  assert.equal(events.reduce((sum, event) => sum + event[7].length, 0), 20);
});

test("local adjudicated output matches the compact golden set when present", { skip: !fs.existsSync(path.join(rootDir, "data", "import-drafts", "luna", "xin-transition--8-24-pilot-output.jsonl")) }, () => {
  const filePath = path.join(rootDir, "data", "import-drafts", "luna", "xin-transition--8-24-pilot-output.jsonl");
  const actual = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/u).map(JSON.parse).map(projectExtractionGoldenRecord);
  assert.deepEqual(actual, xinTransitionExtractionGolden40);
});
