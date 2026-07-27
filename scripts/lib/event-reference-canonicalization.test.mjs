import assert from "node:assert/strict";
import test from "node:test";

import { canonicalizeRelatedEventReferences } from "./event-reference-canonicalization.mjs";

test("merged event aliases rewrite all related-event reference forms", () => {
  const result = canonicalizeRelatedEventReferences({
    relatedEvents: ["event:old", "event:canonical", "event:self"],
    relatedEventRefs: [
      { eventId: "event:old", relationType: "editorial" },
      { eventId: "event:canonical", relationType: "shared-participant" },
    ],
    enrichment: {
      generator: "enrich-official-history-events:v2",
      generatedRelatedEventIds: ["event:old"],
    },
  }, "event:self", new Map([["event:old", "event:canonical"]]));

  assert.equal(result.changed, true);
  assert.deepEqual(result.raw.relatedEvents, ["event:canonical"]);
  assert.deepEqual(result.raw.relatedEventRefs, [{ eventId: "event:canonical", relationType: "editorial" }]);
  assert.deepEqual(result.raw.enrichment.generatedRelatedEventIds, ["event:canonical"]);
});

test("merged event aliases resolve chains and leave unrelated raw data unchanged", () => {
  const raw = { relatedEvents: ["event:a"], title: "保留字段" };
  const result = canonicalizeRelatedEventReferences(
    raw,
    "event:self",
    new Map([["event:a", "event:b"], ["event:b", "event:c"]]),
  );

  assert.deepEqual(result.raw.relatedEvents, ["event:c"]);
  assert.equal(result.raw.title, "保留字段");
});
