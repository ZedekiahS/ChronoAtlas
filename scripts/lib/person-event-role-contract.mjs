export const personEventRoleContractVersion = "person-event-role-contract:v1";

export const contextualPersonEventRoles = new Set([
  "context",
  "mentioned-source",
  "related-context",
  "source-context",
]);

export const candidatePersonEventRoles = new Set(["participant-candidate"]);

export const directPersonEventRoles = new Set([
  "affected",
  "appointee",
  "attacker",
  "captor",
  "captured",
  "claimant",
  "commander",
  "deceased",
  "defeated",
  "defender",
  "founder",
  "issuer",
  "killed",
  "minister",
  "office-holder",
  "opponent",
  "ordered-by",
  "participant",
  "power-broker",
  "predecessor",
  "recipient",
  "rebel",
  "reformer",
  "regent",
  "ruler",
  "subject",
  "victor",
]);

export const canonicalPersonEventRoles = new Set([
  ...directPersonEventRoles,
  ...candidatePersonEventRoles,
  ...contextualPersonEventRoles,
]);

const legacyRoleMap = new Map([
  ["accession", "subject"],
  ["administration", "participant"],
  ["affected-person", "affected"],
  ["aftermath", "participant"],
  ["alignment", "participant"],
  ["campaign", "participant"],
  ["captive", "captured"],
  ["capture", "captured"],
  ["chen-founder", "founder"],
  ["crisis", "participant"],
  ["death", "deceased"],
  ["defeat", "defeated"],
  ["defeated ruler", "defeated"],
  ["defeated-commander", "defeated"],
  ["defeated-rebel", "defeated"],
  ["defeated-ruler", "defeated"],
  ["defending-ruler", "defender"],
  ["defense", "defender"],
  ["deposition", "affected"],
  ["dynastic predecessor", "predecessor"],
  ["dynastic-founder-family", "related-context"],
  ["dynastic-transition", "participant"],
  ["eastern-power", "power-broker"],
  ["enthronement", "subject"],
  ["flight", "participant"],
  ["jin-minister", "minister"],
  ["later-power-broker", "power-broker"],
  ["later-yan-ruler", "ruler"],
  ["massacre", "participant"],
  ["military-career", "participant"],
  ["military-context", "context"],
  ["northern-zhou-founder", "founder"],
  ["politics", "participant"],
  ["power", "power-broker"],
  ["power-background", "context"],
  ["precursor", "participant"],
  ["rebellion", "rebel"],
  ["reform", "participant"],
  ["reform-background", "context"],
  ["regency", "regent"],
  ["regime-founder", "founder"],
  ["related-person", "related-context"],
  ["religious rival", "opponent"],
  ["state-context", "context"],
  ["state-formation", "founder"],
  ["state-founder-background", "context"],
  ["state-founding", "founder"],
  ["statecraft", "participant"],
  ["strategy", "participant"],
  ["succession-context", "context"],
  ["unification", "ruler"],
  ["unifier", "ruler"],
  ["war", "participant"],
  ["western-power", "power-broker"],
  ["western-wei-leader", "ruler"],
  ["yan-commander", "commander"],
]);

export function normalizePersonEventRole(role) {
  const normalized = String(role ?? "").trim();
  if (canonicalPersonEventRoles.has(normalized)) return normalized;
  return legacyRoleMap.get(normalized) ?? null;
}

export function looksLikeUnresolvedChinesePersonName(value) {
  return /^[\p{Script=Han}·]{2,8}$/u.test(String(value ?? "").trim());
}

export function reducePersonEventRoles(roles) {
  const unique = new Set(roles.map((role) => normalizePersonEventRole(role) ?? role));
  const specificDirect = [...unique].filter(
    (role) => directPersonEventRoles.has(role) && role !== "participant",
  );

  if (specificDirect.length > 0) {
    unique.delete("participant");
    unique.delete("participant-candidate");
    contextualPersonEventRoles.forEach((role) => unique.delete(role));
  } else if (unique.has("participant")) {
    unique.delete("participant-candidate");
    contextualPersonEventRoles.forEach((role) => unique.delete(role));
  } else if ([...unique].some((role) => contextualPersonEventRoles.has(role))) {
    unique.delete("participant-candidate");
  }

  return [...unique].sort();
}
