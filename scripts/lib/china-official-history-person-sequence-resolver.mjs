import { compact } from "./event-promotion-core.mjs";
import { provisionalOfficialHistoryPersonId } from "./china-official-history-reference-resolver.mjs";

const biographySubjectPattern = /^[◎○]?([\p{Script=Han}]{2,4})[，,]?(?:字|一名|本名|小字)/u;
const abbreviatedSubjectFollow = /^(?:乃|遂|自|又|复|復|以|曰|欲|怒|恐|闻|聞|知|信|令|诏|詔|下|上|拜|封|免|功|积|積|率|帥|帅|遣|攻|讨|討|伐|击|擊|杀|殺|诛|誅|害|执|執|废|廢|立|即|称|稱|为|為|军|軍|众|眾|部|党|黨)/u;
const abbreviatedObjectLead = /(?:请|請|迎|奉|推|劝|勸|立|废|廢|攻|讨|討|伐|击|擊|破|杀|殺|诛|誅|害|执|執)$/u;
const rejectedAbbreviatedAliases = new Set(["上", "下", "帝", "后", "王", "公", "侯", "君", "子", "父", "母", "兄", "弟"]);

function escapeRegExp(value) {
  return value.replace(/[\^$.*+?()[\]{}|]/gu, "\\$&");
}

export function hasOfficialHistoryAbbreviatedMention(text, alias) {
  if (rejectedAbbreviatedAliases.has(alias)) return false;
  const escaped = escapeRegExp(alias);
  const subjectPattern = new RegExp(`(?:^|[，。；、])${escaped}([\\p{Script=Han}]{1,4})`, "u");
  const subjectMatch = text.match(subjectPattern);
  if (subjectMatch && abbreviatedSubjectFollow.test(subjectMatch[1])) return true;

  const officeSubjectPattern = new RegExp(
    `(?:大司馬|大司马|大將軍|大将军|將軍|将军|太守|刺史|丞相|司徒|司空|太尉|太師|太师)${escaped}([\\p{Script=Han}]{1,4})`,
    "u",
  );
  const officeSubjectMatch = text.match(officeSubjectPattern);
  if (officeSubjectMatch && abbreviatedSubjectFollow.test(officeSubjectMatch[1])) return true;

  const objectPattern = new RegExp(`([\\p{Script=Han}]{1,4})${escaped}(?=即|称|稱|为|為|于|於|，|。|；|、|$)`, "u");
  const objectMatch = text.match(objectPattern);
  return Boolean(objectMatch && abbreviatedObjectLead.test(objectMatch[1]));
}

export function createOfficialHistoryPersonSequenceResolver(options = {}) {
  const allowedSections = new Set(options.allowedSections ?? ["biography", "record"]);
  const maxDistance = options.maxDistance ?? 80;
  const stateBySource = new Map();

  function stateFor(context) {
    const sourceKey = context.source?.id ?? context.passage?.source_id ?? "unscoped";
    let state = stateBySource.get(sourceKey);
    if (!state) {
      state = { sourceKey, index: 0, people: new Map() };
      stateBySource.set(sourceKey, state);
    }
    return state;
  }

  function remember(state, people) {
    for (const person of people ?? []) {
      if (!person?.id || !person?.name || Array.from(person.name).length < 2) continue;
      state.people.set(person.id, { ...person, lastSeen: state.index });
    }
  }

  function biographySubject(text, state, context) {
    if (!allowedSections.has(context.section?.type)) return null;
    const name = text.match(biographySubjectPattern)?.[1];
    if (!name) return null;
    return {
      id: provisionalOfficialHistoryPersonId(name, state.sourceKey),
      name,
      matched: name,
      evidence: "biography-subject",
      confidence: "high",
      provisional: true,
      contextKey: state.sourceKey,
    };
  }

  return {
    resolve(value, context = {}) {
      const text = compact(value);
      const state = stateFor(context);
      state.index += 1;
      const currentPeople = context.currentPeople ?? [];
      const subject = biographySubject(text, state, context);
      if (subject) state.people.clear();
      const remembered = [...state.people.values()]
        .filter((person) => state.index - person.lastSeen <= maxDistance);
      const byShortAlias = new Map();
      for (const person of remembered) {
        const alias = Array.from(person.name).at(-1);
        const people = byShortAlias.get(alias) ?? [];
        people.push(person);
        byShortAlias.set(alias, people);
      }

      const inferred = [];
      for (const [alias, people] of byShortAlias) {
        if (people.length !== 1) continue;
        const person = people[0];
        if (text.includes(person.name) || currentPeople.some((item) => item.id === person.id)) continue;
        if (!hasOfficialHistoryAbbreviatedMention(text, alias)) continue;
        inferred.push({
          ...person,
          matched: alias,
          evidence: "source-person-context",
          confidence: "medium",
          provisional: Boolean(person.provisional),
        });
      }

      remember(state, [...currentPeople, ...(subject ? [subject] : [])]);
      return inferred;
    },
    observe(people, context = {}) {
      remember(stateFor(context), people);
    },
  };
}
