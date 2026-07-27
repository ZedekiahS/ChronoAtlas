import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalPersonEventRoles,
  looksLikeUnresolvedChinesePersonName,
  normalizePersonEventRole,
  reducePersonEventRoles,
} from "./person-event-role-contract.mjs";

test("normalizes legacy event dimensions into person roles", () => {
  assert.equal(normalizePersonEventRole("war"), "participant");
  assert.equal(normalizePersonEventRole("defeated ruler"), "defeated");
  assert.equal(normalizePersonEventRole("state-founding"), "founder");
  assert.equal(normalizePersonEventRole("power-background"), "context");
});

test("reduces generic and contextual roles when a reviewed direct role exists", () => {
  assert.deepEqual(reducePersonEventRoles(["commander", "war", "mentioned-source"]), ["commander"]);
  assert.deepEqual(reducePersonEventRoles(["participant-candidate", "mentioned-source"]), ["mentioned-source"]);
  assert.deepEqual(reducePersonEventRoles(["participant", "participant-candidate"]), ["participant"]);
});

test("recognizes unresolved Chinese person-name roles without treating English roles as names", () => {
  assert.equal(looksLikeUnresolvedChinesePersonName("陈胜"), true);
  assert.equal(looksLikeUnresolvedChinesePersonName("participant"), false);
  assert.equal(canonicalPersonEventRoles.has("participant-candidate"), true);
});

