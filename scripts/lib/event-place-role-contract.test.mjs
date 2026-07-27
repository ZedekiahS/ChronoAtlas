import assert from "node:assert/strict";
import test from "node:test";
import {
  eventPlaceRoleStrength,
  normalizeEventPlaceRole,
  reduceEventPlaceRoles,
} from "./event-place-role-contract.mjs";

test("normalizes legacy place roles", () => {
  assert.equal(normalizeEventPlaceRole("location"), "related-location");
  assert.equal(normalizeEventPlaceRole("capital"), "administrative-seat");
  assert.equal(normalizeEventPlaceRole("jurisdiction"), "affected-area");
  assert.equal(normalizeEventPlaceRole("unknown"), null);
});

test("prefers direct bindings over generic and contextual bindings", () => {
  assert.deepEqual(
    reduceEventPlaceRoles(["source-context", "location", "primary-location"]),
    ["primary-location"],
  );
  assert.deepEqual(
    reduceEventPlaceRoles(["primary-location", "battlefield"]),
    ["battlefield"],
  );
  assert.deepEqual(
    reduceEventPlaceRoles(["source-context", "location-candidate"]),
    ["source-context"],
  );
});

test("reports display strength", () => {
  assert.equal(eventPlaceRoleStrength("battlefield"), "direct");
  assert.equal(eventPlaceRoleStrength("location-candidate"), "candidate");
  assert.equal(eventPlaceRoleStrength("source-context"), "context");
});
