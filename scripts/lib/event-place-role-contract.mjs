export const eventPlaceRoleContractVersion = "event-place-role-contract:v1";

export const directEventPlaceRoles = new Set([
  "primary-location",
  "battlefield",
  "origin",
  "destination",
  "route-location",
  "affected-area",
  "administrative-seat",
]);

export const contextualEventPlaceRoles = new Set([
  "related-location",
  "source-context",
]);

export const candidateEventPlaceRoles = new Set(["location-candidate"]);

export const canonicalEventPlaceRoles = new Set([
  ...directEventPlaceRoles,
  ...contextualEventPlaceRoles,
  ...candidateEventPlaceRoles,
]);

const legacyRoleMap = new Map([
  ["location", "related-location"],
  ["place", "related-location"],
  ["primary", "primary-location"],
  ["jurisdiction", "affected-area"],
  ["area", "affected-area"],
  ["mentioned", "source-context"],
  ["context", "source-context"],
  ["mentioned-source", "source-context"],
  ["related-place", "related-location"],
  ["route", "route-location"],
  ["waypoint", "route-location"],
  ["capital", "administrative-seat"],
  ["court-location", "administrative-seat"],
  ["departure", "origin"],
  ["arrival", "destination"],
]);

export function normalizeEventPlaceRole(role) {
  const normalized = String(role ?? "").trim();
  if (canonicalEventPlaceRoles.has(normalized)) return normalized;
  return legacyRoleMap.get(normalized) ?? null;
}

export function reduceEventPlaceRoles(roles) {
  const unique = new Set(roles.map((role) => normalizeEventPlaceRole(role) ?? role));
  const direct = [...unique].filter((role) => directEventPlaceRoles.has(role));
  const specificDirect = direct.filter((role) => role !== "primary-location");

  if (specificDirect.length > 0) {
    unique.delete("primary-location");
    unique.delete("related-location");
    unique.delete("location-candidate");
    unique.delete("source-context");
  } else if (direct.length > 0) {
    unique.delete("related-location");
    unique.delete("location-candidate");
    unique.delete("source-context");
  } else if (unique.has("related-location")) {
    unique.delete("location-candidate");
    unique.delete("source-context");
  } else if (unique.has("source-context")) {
    unique.delete("location-candidate");
  }

  return [...unique].sort();
}

export function eventPlaceRoleStrength(role) {
  if (directEventPlaceRoles.has(role)) return "direct";
  if (candidateEventPlaceRoles.has(role)) return "candidate";
  return "context";
}
