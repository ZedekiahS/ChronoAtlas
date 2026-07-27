import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getOfficialHistoryPromotionProfile } from "./lib/china-official-history-promotion-profiles.mjs";
import { topicIdForOfficialHistoryEvent } from "./lib/china-official-history-promotion-policy.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const rebuildChunks = process.argv.includes("--rebuild-chunks");
const dbArg = process.argv.find((argument) => argument.startsWith("--db="))?.slice("--db=".length);
const decisionsArg = process.argv.find((argument) => argument.startsWith("--decisions="))?.slice("--decisions=".length);
const crossReferenceArg = process.argv.find((argument) => argument.startsWith("--cross-reference="))?.slice("--cross-reference=".length);
const dbPath = dbArg ? path.resolve(rootDir, dbArg) : path.join(rootDir, "db", "chronoatlas.sqlite");

if (!decisionsArg) throw new Error("Missing --decisions=<module path>");

const decisionsPath = path.resolve(rootDir, decisionsArg);
const review = (await import(`${pathToFileURL(decisionsPath).href}?review=${Date.now()}`)).default;
const profile = getOfficialHistoryPromotionProfile(review.profileId);
const generatorId = profile.generatorId;
const editorialGenerator = `official-history-editorial-review:${review.reviewBatchId}`;
const crossReferencePath = crossReferenceArg
  ? path.resolve(rootDir, crossReferenceArg)
  : path.join(rootDir, "data", "review-queues", `${profile.id}-cross-reference.json`);
const crossReference = fs.existsSync(crossReferencePath)
  ? JSON.parse(fs.readFileSync(crossReferencePath, "utf8"))
  : null;
const crossReferenceByEvent = new Map((crossReference?.events ?? []).map((event) => [event.eventId, event]));
const reviewedAt = review.reviewedAt ?? new Date().toISOString();

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value ?? "{}") ?? fallback;
  } catch {
    return fallback;
  }
}

function toJson(value) {
  return JSON.stringify(value ?? {});
}

function compact(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function stableId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 20);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function editorialRecord(decision, sourceEvent) {
  const cross = crossReferenceByEvent.get(decision.eventId);
  return {
    batchId: review.reviewBatchId,
    reviewer: review.reviewer,
    reviewedAt,
    decision: decision.decision,
    sourceEventId: sourceEvent.id,
    originalTitle: sourceEvent.title,
    finalTitle: decision.title ?? sourceEvent.title,
    confidence: decision.confidence ?? sourceEvent.confidence,
    rationale: decision.rationale,
    methodology: review.methodology,
    crossReference: cross ? {
      primaryWitnesses: cross.primaryWitnesses.map((item) => ({
        sourceId: item.sourceId,
        witnessUrl: item.witnessUrl,
        matchStatus: item.matchStatus,
      })),
      chronology: {
        page: cross.chronology.page,
        url: cross.chronology.url,
        status: cross.chronology.status,
        score: cross.chronology.score,
        matchedPeople: cross.chronology.matchedPeople,
        matchedPlaces: cross.chronology.matchedPlaces,
        matchedActions: cross.chronology.matchedActions,
        snippet: compact(cross.chronology.snippet).slice(0, 800) || null,
      },
    } : null,
  };
}

function mergeAlreadyApplied(db, decision) {
  const target = db.prepare("SELECT raw_json FROM events WHERE id = ?").get(decision.mergeTargetId);
  if (!target) return false;
  const records = parseJson(target.raw_json).officialHistoryEditorialEvidence;
  return Array.isArray(records) && records.some((record) =>
    record.reviewBatchId === review.reviewBatchId && record.sourceEventId === decision.eventId);
}

function personMergeAlreadyApplied(db, decision) {
  const target = db.prepare("SELECT raw_json FROM entities WHERE id = ?").get(decision.targetEntityId);
  if (!target) return false;
  const records = parseJson(target.raw_json).officialHistoryPersonMerges;
  return Array.isArray(records) && records.some((record) =>
    record.reviewBatchId === review.reviewBatchId && record.sourcePersonId === decision.personId);
}

function validateReview(db) {
  if (review.schema !== "chronoatlas.official-history-editorial-review.v1") {
    throw new Error(`Unsupported review schema: ${review.schema}`);
  }
  const decisions = review.eventDecisions ?? [];
  const decisionIds = new Set(decisions.map((decision) => decision.eventId));
  if (decisionIds.size !== decisions.length) throw new Error("Duplicate event decisions found");

  const generatedEvents = db.prepare(`
    SELECT id, title, review_status, raw_json
    FROM events
    WHERE json_extract(raw_json, '$.generator') = ?
      AND review_status <> 'rejected'
    ORDER BY id
  `).all(generatorId);
  const missingDecisions = generatedEvents.filter((event) => !decisionIds.has(event.id));
  const pendingDecisions = [];
  const alreadyApplied = [];
  const missingEvents = [];
  for (const decision of decisions) {
    const sourceEvent = db.prepare("SELECT id, raw_json FROM events WHERE id = ?").get(decision.eventId);
    if (sourceEvent) {
      const raw = parseJson(sourceEvent.raw_json);
      if (raw.generator !== generatorId && raw.editorialReview?.batchId !== review.reviewBatchId) {
        throw new Error(`Editorial source event changed ownership: ${decision.eventId}`);
      }
      pendingDecisions.push(decision);
    } else if (decision.decision === "merge" && mergeAlreadyApplied(db, decision)) {
      alreadyApplied.push(decision);
    } else {
      missingEvents.push(decision);
    }
  }
  if (missingDecisions.length || missingEvents.length) {
    throw new Error(toJson({
      message: "Editorial review does not match the active generated event set",
      missingDecisions: missingDecisions.map((event) => ({ id: event.id, title: event.title })),
      missingEvents: missingEvents.map((decision) => decision.eventId),
    }));
  }

  const allowedDecisions = new Set(["approve", "rename", "merge"]);
  const ensuredEntityIds = new Set([
    ...(review.ensuredPeople ?? []).map((person) => person.entityId),
    ...(review.ensuredPlaces ?? []).map((place) => place.entityId),
  ]);
  for (const decision of decisions) {
    if (!allowedDecisions.has(decision.decision)) throw new Error(`Unsupported decision for ${decision.eventId}: ${decision.decision}`);
    if (decision.decision === "rename" && !compact(decision.title)) throw new Error(`Rename decision lacks title: ${decision.eventId}`);
    if (decision.decision === "merge") {
      const target = db.prepare("SELECT id, review_status FROM events WHERE id = ?").get(decision.mergeTargetId);
      if (!target || target.review_status === "rejected") throw new Error(`Invalid merge target for ${decision.eventId}: ${decision.mergeTargetId}`);
    }
    for (const targetId of decision.additionalEvidenceTargets ?? []) {
      if (!db.prepare("SELECT 1 FROM events WHERE id = ?").get(targetId)) throw new Error(`Missing additional evidence target: ${targetId}`);
    }
    for (const link of decision.addEventEntities ?? []) {
      if (!ensuredEntityIds.has(link.entityId) && !db.prepare("SELECT 1 FROM entities WHERE id = ?").get(link.entityId)) {
        throw new Error(`Missing editorial entity for ${decision.eventId}: ${link.entityId}`);
      }
    }
  }

  for (const rename of review.personRenames ?? []) {
    const person = db.prepare("SELECT id, name FROM persons WHERE id = ?").get(rename.personId);
    const entity = db.prepare("SELECT id, primary_label FROM entities WHERE id = ?").get(rename.entityId);
    if (!person || !entity) throw new Error(`Missing person rename target: ${rename.personId}`);
    if (![rename.from, rename.to].includes(person.name) || ![rename.from, rename.to].includes(entity.primary_label)) {
      throw new Error(`Person rename source changed unexpectedly: ${rename.personId}`);
    }
  }

  const personApprovals = review.personApprovals ?? [];
  const approvalIds = new Set(personApprovals.map((decision) => decision.personId));
  if (approvalIds.size !== personApprovals.length) throw new Error("Duplicate person approvals found");
  for (const decision of personApprovals) {
    const person = db.prepare("SELECT id, name FROM persons WHERE id = ?").get(decision.personId);
    const entity = db.prepare("SELECT id, primary_label FROM entities WHERE id = ?").get(`person:${decision.personId}`);
    if (!person || !entity) throw new Error(`Missing person approval target: ${decision.personId}`);
    const expectedNames = new Set([decision.expectedName, decision.canonicalName].filter(Boolean));
    if (!expectedNames.has(person.name) || !expectedNames.has(entity.primary_label)) {
      throw new Error(`Person approval name changed unexpectedly: ${decision.personId}`);
    }
  }

  const personMerges = review.personMerges ?? [];
  const mergeIds = new Set(personMerges.map((decision) => decision.personId));
  if (mergeIds.size !== personMerges.length) throw new Error("Duplicate person merges found");
  const pendingPersonMerges = [];
  const appliedPersonMerges = [];
  for (const decision of personMerges) {
    if (approvalIds.has(decision.personId)) throw new Error(`Person cannot be both approved and merged: ${decision.personId}`);
    const target = db.prepare("SELECT id, primary_label, review_status FROM entities WHERE id = ?").get(decision.targetEntityId);
    if (!target || target.review_status === "rejected") throw new Error(`Invalid person merge target: ${decision.targetEntityId}`);
    const source = db.prepare("SELECT p.name, p.raw_json, e.id AS entity_id FROM persons p LEFT JOIN entities e ON e.id = 'person:' || p.id WHERE p.id = ?")
      .get(decision.personId);
    if (source && parseJson(source.raw_json).reviewStatus !== "merged") {
      if (source.name !== decision.expectedName || !source.entity_id) {
        throw new Error(`Person merge source changed unexpectedly: ${decision.personId}`);
      }
      pendingPersonMerges.push(decision);
    } else if (personMergeAlreadyApplied(db, decision)) {
      appliedPersonMerges.push(decision);
    } else {
      throw new Error(`Missing person merge source: ${decision.personId}`);
    }
  }

  for (const override of review.eventEntityRoleOverrides ?? []) {
    if (!db.prepare("SELECT 1 FROM events WHERE id = ?").get(override.eventId)) {
      throw new Error(`Missing event role override target: ${override.eventId}`);
    }
    for (const entityId of [override.primaryPlaceEntityId, ...(override.relatedPlaceEntityIds ?? [])]) {
      const place = db.prepare("SELECT 1 FROM entities WHERE id = ? AND entity_type = 'place'").get(entityId);
      if (!place) throw new Error(`Missing place role override entity: ${entityId}`);
    }
  }

  return {
    generatedEvents,
    pendingDecisions,
    alreadyApplied,
    personApprovals,
    pendingPersonMerges,
    appliedPersonMerges,
  };
}

function ensurePeople(db, stats) {
  const upsertPerson = db.prepare(`
    INSERT INTO persons (
      id, region, name, life_confidence, summary, coverage_status, raw_json
    ) VALUES (?, 'china', ?, 'medium', ?, 'narrow-event', ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      summary = excluded.summary,
      coverage_status = excluded.coverage_status,
      raw_json = excluded.raw_json
  `);
  const upsertEntity = db.prepare(`
    INSERT INTO entities (
      id, entity_type, primary_label, region_id, summary, confidence, review_status, raw_json
    ) VALUES (?, 'person', ?, 'china', ?, 'medium', 'reviewed', ?)
    ON CONFLICT(id) DO UPDATE SET
      primary_label = excluded.primary_label,
      summary = excluded.summary,
      confidence = excluded.confidence,
      review_status = 'reviewed',
      raw_json = excluded.raw_json
  `);
  const upsertPersonAlias = db.prepare(`
    INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
    VALUES (?, ?, ?, 'historical-title', '[]', ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
  `);
  const upsertEntityAlias = db.prepare(`
    INSERT INTO entity_aliases (
      id, entity_id, value, alias_type, language, valid_start, valid_end, raw_json
    ) VALUES (?, ?, ?, 'historical-name', 'zh-Hans', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
  `);
  const upsertSearch = db.prepare(`
    INSERT INTO search_documents (
      id, subject_table, subject_id, title, body, language, region_id, period_id,
      topic_id, time_start, time_end, review_status, raw_json
    ) VALUES (?, 'entities', ?, ?, ?, 'zh-Hans', 'china', ?, 'person', ?, ?, 'reviewed', ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      review_status = 'reviewed',
      raw_json = excluded.raw_json
  `);

  for (const person of review.ensuredPeople ?? []) {
    const raw = {
      generatedFrom: "official-history-editorial-review",
      reviewBatchId: review.reviewBatchId,
      reviewer: review.reviewer,
      legacyPersonId: person.personId,
      aliases: person.aliases ?? [],
    };
    upsertPerson.run(person.personId, person.label, person.summary, toJson(raw));
    upsertEntity.run(person.entityId, person.label, person.summary, toJson(raw));
    for (const alias of person.aliases ?? []) {
      upsertPersonAlias.run(
        `editorial-person-alias:${stableId(`${person.personId}:${alias}`)}`,
        person.personId,
        alias,
        toJson(raw),
      );
      upsertEntityAlias.run(
        `editorial-entity-alias:${stableId(`${person.entityId}:${alias}`)}`,
        person.entityId,
        alias,
        profile.timeStart,
        profile.timeEnd,
        toJson(raw),
      );
    }
    upsertSearch.run(
      `entity:${person.entityId}`,
      person.entityId,
      person.label,
      compact([person.label, ...(person.aliases ?? []), person.summary].join(" ")),
      profile.periodId,
      profile.timeStart,
      profile.timeEnd,
      toJson(raw),
    );
    stats.peopleEnsured += 1;
  }
}

function renamePeople(db, stats) {
  const upsertPersonAlias = db.prepare(`
    INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
    VALUES (?, ?, ?, 'source-variant', '[]', ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
  `);
  const upsertEntityAlias = db.prepare(`
    INSERT INTO entity_aliases (
      id, entity_id, value, alias_type, language, valid_start, valid_end, raw_json
    ) VALUES (?, ?, ?, 'source-variant', 'zh-Hans', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
  `);

  for (const rename of review.personRenames ?? []) {
    const person = db.prepare("SELECT * FROM persons WHERE id = ?").get(rename.personId);
    const entity = db.prepare("SELECT * FROM entities WHERE id = ?").get(rename.entityId);
    const personRaw = {
      ...parseJson(person.raw_json),
      editorialReview: {
        batchId: review.reviewBatchId,
        reviewedAt,
        reviewer: review.reviewer,
        decision: "rename",
        originalName: rename.from,
        finalName: rename.to,
        rationale: rename.rationale,
      },
      reviewStatus: "reviewed",
    };
    const entityRaw = { ...parseJson(entity.raw_json), ...personRaw };
    db.prepare(`
      UPDATE persons
      SET name = ?, coverage_status = 'narrow-event', raw_json = ?
      WHERE id = ?
    `).run(rename.to, toJson(personRaw), rename.personId);
    db.prepare(`
      UPDATE entities
      SET primary_label = ?, review_status = 'reviewed', raw_json = ?
      WHERE id = ?
    `).run(rename.to, toJson(entityRaw), rename.entityId);

    for (const alias of unique([rename.from, ...(rename.aliases ?? [])]).filter((value) => value !== rename.to)) {
      const raw = toJson({ generatedFrom: "official-history-editorial-review", reviewBatchId: review.reviewBatchId });
      upsertPersonAlias.run(`editorial-person-alias:${stableId(`${rename.personId}:${alias}`)}`, rename.personId, alias, raw);
      upsertEntityAlias.run(
        `editorial-entity-alias:${stableId(`${rename.entityId}:${alias}`)}`,
        rename.entityId,
        alias,
        profile.timeStart,
        profile.timeEnd,
        raw,
      );
    }

    const searchRows = db.prepare(`
      SELECT id, body, raw_json
      FROM search_documents
      WHERE subject_table = 'entities' AND subject_id = ?
    `).all(rename.entityId);
    for (const search of searchRows) {
      db.prepare(`
        UPDATE search_documents
        SET title = ?, body = ?, review_status = 'reviewed', raw_json = ?
        WHERE id = ?
      `).run(
        rename.to,
        compact(`${rename.to} ${rename.from} ${search.body}`),
        toJson({ ...parseJson(search.raw_json), editorialReview: personRaw.editorialReview }),
        search.id,
      );
    }
    stats.peopleRenamed += 1;
  }
}

function updatePersonSearchDocuments(db, personId, entityId, editorial) {
  const person = db.prepare("SELECT * FROM persons WHERE id = ?").get(personId);
  const entity = db.prepare("SELECT * FROM entities WHERE id = ?").get(entityId);
  const aliases = unique([
    ...db.prepare("SELECT value FROM person_aliases WHERE person_id = ? ORDER BY value").all(personId).map((row) => row.value),
    ...db.prepare("SELECT value FROM entity_aliases WHERE entity_id = ? ORDER BY value").all(entityId).map((row) => row.value),
  ]);
  const eventTitles = db.prepare(`
    SELECT ev.title
    FROM event_entities ee
    JOIN events ev ON ev.id = ee.event_id
    WHERE ee.entity_id = ? AND ev.review_status <> 'rejected'
    ORDER BY ev.time_start, ev.title
    LIMIT 24
  `).all(entityId).map((row) => row.title);
  const body = compact([person.name, ...aliases, person.summary, entity.summary, ...eventTitles].join(" "));
  const rows = db.prepare(`
    SELECT id, raw_json FROM search_documents
    WHERE subject_table = 'entities' AND subject_id = ?
  `).all(entityId);
  if (!rows.length) {
    db.prepare(`
      INSERT INTO search_documents (
        id, subject_table, subject_id, title, body, language, region_id, period_id,
        topic_id, time_start, time_end, review_status, raw_json
      ) VALUES (?, 'entities', ?, ?, ?, 'zh-Hans', 'china', ?, 'person', ?, ?, 'reviewed', ?)
    `).run(
      `entity:${entityId}`,
      entityId,
      person.name,
      body,
      profile.periodId,
      profile.timeStart,
      profile.timeEnd,
      toJson({ editorialPersonReview: editorial }),
    );
    return;
  }
  for (const row of rows) {
    db.prepare(`
      UPDATE search_documents
      SET title = ?, body = ?, period_id = ?, topic_id = 'person',
          review_status = 'reviewed', raw_json = ?
      WHERE id = ?
    `).run(
      person.name,
      body,
      profile.periodId,
      toJson({ ...parseJson(row.raw_json), editorialPersonReview: editorial }),
      row.id,
    );
  }
}

function normalizeReviewedPersonRoles(db, entityId, editorial, stats) {
  const rows = db.prepare(`
    SELECT event_id, sort_order, raw_json
    FROM event_entities
    WHERE entity_id = ? AND role = 'participant-candidate'
  `).all(entityId);
  for (const row of rows) {
    db.prepare("DELETE FROM event_entities WHERE event_id = ? AND entity_id = ? AND role = 'participant-candidate'")
      .run(row.event_id, entityId);
    db.prepare(`
      INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
      VALUES (?, ?, 'participant', ?, ?)
      ON CONFLICT(event_id, entity_id, role) DO UPDATE SET
        sort_order = MIN(event_entities.sort_order, excluded.sort_order),
        raw_json = excluded.raw_json
    `).run(
      row.event_id,
      entityId,
      row.sort_order,
      toJson({ ...parseJson(row.raw_json), editorialPersonReview: editorial }),
    );
    stats.personRolesPromoted += 1;
  }
}

function approvePeople(db, decisions, stats) {
  for (const decision of decisions) {
    const person = db.prepare("SELECT * FROM persons WHERE id = ?").get(decision.personId);
    const entityId = `person:${decision.personId}`;
    const entity = db.prepare("SELECT * FROM entities WHERE id = ?").get(entityId);
    const finalName = decision.canonicalName ?? person.name;
    const summary = `${finalName}的姓名及其在本期事件中的角色已据对应《晋书》原文核定；生卒、字与完整仕历仍待人物专题补全。`;
    const editorial = {
      batchId: review.reviewBatchId,
      reviewer: review.reviewer,
      reviewedAt,
      decision: "approve",
      expectedName: decision.expectedName,
      canonicalName: finalName,
      scope: "name-and-event-occurrence",
    };
    db.prepare(`
      UPDATE persons
      SET name = ?, summary = ?, coverage_status = 'narrow-event', raw_json = ?
      WHERE id = ?
    `).run(
      finalName,
      summary,
      toJson({ ...parseJson(person.raw_json), reviewStatus: "reviewed", editorialPersonReview: editorial }),
      person.id,
    );
    db.prepare(`
      UPDATE entities
      SET primary_label = ?, summary = ?, confidence = 'high', review_status = 'reviewed', raw_json = ?
      WHERE id = ?
    `).run(
      finalName,
      summary,
      toJson({ ...parseJson(entity.raw_json), reviewStatus: "reviewed", editorialPersonReview: editorial }),
      entityId,
    );
    db.prepare("UPDATE person_i18n SET name = ?, summary = ? WHERE person_id = ? AND locale = 'zh'")
      .run(finalName, summary, person.id);
    db.prepare("UPDATE entity_i18n SET primary_label = ?, summary = ? WHERE entity_id = ? AND locale = 'zh'")
      .run(finalName, summary, entityId);
    normalizeReviewedPersonRoles(db, entityId, editorial, stats);
    updatePersonSearchDocuments(db, person.id, entityId, editorial);
    stats.peopleApproved += 1;
  }
}

function rewriteMergedPersonReferences(db, decision, stats) {
  const targetPerson = db.prepare("SELECT name FROM persons WHERE id = ?").get(decision.targetPersonId);
  if (!targetPerson) throw new Error(`Missing merged target person: ${decision.targetPersonId}`);
  const sourceNames = new Set([decision.expectedName, ...(decision.aliases ?? [])].filter(Boolean));
  for (const event of db.prepare("SELECT id, raw_json FROM events ORDER BY id").all()) {
    const raw = parseJson(event.raw_json);
    const personIds = Array.isArray(raw.personIds) ? raw.personIds : [];
    if (!personIds.includes(decision.personId)) continue;
    const people = Array.isArray(raw.people) ? raw.people : [];
    const finalRaw = {
      ...raw,
      personIds: unique(personIds.map((personId) =>
        personId === decision.personId ? decision.targetPersonId : personId)),
      people: unique(people.map((name) => sourceNames.has(name) ? targetPerson.name : name)),
      editorialPersonMerges: unique([
        ...(Array.isArray(raw.editorialPersonMerges) ? raw.editorialPersonMerges : []),
        `${decision.personId}->${decision.targetPersonId}`,
      ]),
    };
    db.prepare("UPDATE events SET raw_json = ? WHERE id = ?").run(toJson(finalRaw), event.id);
    db.prepare("UPDATE historical_events SET raw_json = ? WHERE id = ?").run(toJson(finalRaw), event.id);
    stats.personReferencesRewritten += 1;
  }
}

function mergePersonCandidate(db, decision, stats) {
  const sourcePerson = db.prepare("SELECT * FROM persons WHERE id = ?").get(decision.personId);
  const sourceEntityId = `person:${decision.personId}`;
  const sourceEntity = db.prepare("SELECT * FROM entities WHERE id = ?").get(sourceEntityId);
  const targetEntity = db.prepare("SELECT * FROM entities WHERE id = ?").get(decision.targetEntityId);
  const editorial = {
    batchId: review.reviewBatchId,
    reviewer: review.reviewer,
    reviewedAt,
    decision: "merge",
    sourcePersonId: sourcePerson.id,
    sourceEntityId,
    targetPersonId: decision.targetPersonId,
    targetEntityId: decision.targetEntityId,
    rationale: decision.rationale,
  };

  db.prepare(`
    INSERT INTO persons (
      id, region, name, life_confidence, summary, coverage_status, raw_json
    ) VALUES (?, 'china', ?, 'medium', ?, 'narrow-event', ?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    decision.targetPersonId,
    targetEntity.primary_label,
    targetEntity.summary,
    toJson({
      generatedFrom: "person-entity-bridge",
      entityId: decision.targetEntityId,
      reviewStatus: "reviewed",
      editorialPersonReview: editorial,
    }),
  );

  const targetPerson = db.prepare("SELECT * FROM persons WHERE id = ?").get(decision.targetPersonId);
  const targetRecords = Array.isArray(parseJson(targetEntity.raw_json).officialHistoryPersonMerges)
    ? parseJson(targetEntity.raw_json).officialHistoryPersonMerges.filter((record) => record.sourcePersonId !== sourcePerson.id)
    : [];
  targetRecords.push({
    reviewBatchId: review.reviewBatchId,
    sourcePersonId: sourcePerson.id,
    sourceEntityId,
    reviewedAt,
    rationale: decision.rationale,
  });
  db.prepare("UPDATE persons SET coverage_status = 'narrow-event', raw_json = ? WHERE id = ?").run(
    toJson({
      ...parseJson(targetPerson.raw_json),
      reviewStatus: "reviewed",
      officialHistoryPersonMerges: targetRecords,
      editorialPersonReview: editorial,
    }),
    decision.targetPersonId,
  );
  db.prepare("UPDATE entities SET review_status = 'reviewed', raw_json = ? WHERE id = ?").run(
    toJson({
      ...parseJson(targetEntity.raw_json),
      reviewStatus: "reviewed",
      officialHistoryPersonMerges: targetRecords,
      editorialPersonReview: editorial,
    }),
    decision.targetEntityId,
  );

  const personAliases = db.prepare("SELECT value, type, source_refs_json, raw_json FROM person_aliases WHERE person_id = ?")
    .all(sourcePerson.id);
  for (const alias of unique([sourcePerson.name, ...(decision.aliases ?? []), ...personAliases.map((row) => row.value)])) {
    if (!alias || alias === targetPerson.name) continue;
    const sourceAlias = personAliases.find((row) => row.value === alias);
    db.prepare(`
      INSERT INTO person_aliases (id, person_id, value, type, source_refs_json, raw_json)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
    `).run(
      `editorial-person-alias:${stableId(`${decision.targetPersonId}:${alias}`)}`,
      decision.targetPersonId,
      alias,
      sourceAlias?.type ?? "alternate-name",
      sourceAlias?.source_refs_json ?? "[]",
      toJson({ ...parseJson(sourceAlias?.raw_json), editorialPersonReview: editorial }),
    );
    db.prepare(`
      INSERT INTO entity_aliases (
        id, entity_id, value, alias_type, language, valid_start, valid_end, raw_json
      ) VALUES (?, ?, ?, 'alternate-name', 'zh-Hans', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
    `).run(
      `editorial-entity-alias:${stableId(`${decision.targetEntityId}:${alias}`)}`,
      decision.targetEntityId,
      alias,
      profile.timeStart,
      profile.timeEnd,
      toJson({ editorialPersonReview: editorial }),
    );
  }

  for (const row of db.prepare("SELECT mention_id, sort_order FROM source_mention_people WHERE person_id = ?").all(sourcePerson.id)) {
    db.prepare("INSERT OR IGNORE INTO source_mention_people (mention_id, person_id, sort_order) VALUES (?, ?, ?)")
      .run(row.mention_id, decision.targetPersonId, row.sort_order);
  }
  db.prepare("DELETE FROM source_mention_people WHERE person_id = ?").run(sourcePerson.id);

  for (const row of db.prepare("SELECT * FROM event_entities WHERE entity_id = ?").all(sourceEntityId)) {
    const hasTarget = db.prepare("SELECT 1 FROM event_entities WHERE event_id = ? AND entity_id = ? LIMIT 1")
      .get(row.event_id, decision.targetEntityId);
    if (!hasTarget) {
      db.prepare(`
        INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        row.event_id,
        decision.targetEntityId,
        row.role,
        row.sort_order,
        toJson({ ...parseJson(row.raw_json), editorialPersonReview: editorial }),
      );
    }
  }
  db.prepare("DELETE FROM event_entities WHERE entity_id = ?").run(sourceEntityId);
  db.prepare("UPDATE historical_event_people SET person_id = ?, display_name = ? WHERE person_id = ?")
    .run(decision.targetPersonId, targetPerson.name, sourcePerson.id);

  for (const row of db.prepare("SELECT role, sort_order FROM person_roles WHERE person_id = ?").all(sourcePerson.id)) {
    db.prepare("INSERT OR IGNORE INTO person_roles (person_id, role, sort_order) VALUES (?, ?, ?)")
      .run(decision.targetPersonId, row.role, row.sort_order);
  }
  db.prepare("DELETE FROM person_roles WHERE person_id = ?").run(sourcePerson.id);

  db.prepare("UPDATE entity_relations SET source_entity_id = ? WHERE source_entity_id = ?")
    .run(decision.targetEntityId, sourceEntityId);
  db.prepare("UPDATE entity_relations SET target_entity_id = ? WHERE target_entity_id = ?")
    .run(decision.targetEntityId, sourceEntityId);

  for (const row of db.prepare("SELECT * FROM map_feature_entities WHERE entity_id = ?").all(sourceEntityId)) {
    db.prepare(`
      INSERT INTO map_feature_entities (
        feature_id, entity_id, relation_type, time_start, time_end, confidence, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(feature_id, entity_id, relation_type) DO NOTHING
    `).run(
      row.feature_id,
      decision.targetEntityId,
      row.relation_type,
      row.time_start,
      row.time_end,
      row.confidence,
      toJson({ ...parseJson(row.raw_json), editorialPersonReview: editorial }),
    );
  }
  db.prepare("DELETE FROM map_feature_entities WHERE entity_id = ?").run(sourceEntityId);
  db.prepare("UPDATE evidence_links SET subject_id = ? WHERE subject_table = 'entities' AND subject_id = ?")
    .run(decision.targetEntityId, sourceEntityId);
  db.prepare("UPDATE evidence_links SET subject_id = ? WHERE subject_table = 'persons' AND subject_id = ?")
    .run(decision.targetPersonId, sourcePerson.id);
  db.prepare("DELETE FROM search_documents WHERE subject_table = 'entities' AND subject_id = ?").run(sourceEntityId);
  rewriteMergedPersonReferences(db, decision, stats);

  db.prepare("UPDATE persons SET coverage_status = 'merged', raw_json = ? WHERE id = ?").run(
    toJson({
      ...parseJson(sourcePerson.raw_json),
      reviewStatus: "merged",
      mergedIntoPersonId: decision.targetPersonId,
      mergedIntoEntityId: decision.targetEntityId,
      editorialPersonReview: editorial,
    }),
    sourcePerson.id,
  );
  db.prepare("UPDATE entities SET review_status = 'rejected', raw_json = ? WHERE id = ?").run(
    toJson({
      ...parseJson(sourceEntity.raw_json),
      reviewStatus: "merged",
      mergedIntoPersonId: decision.targetPersonId,
      mergedIntoEntityId: decision.targetEntityId,
      editorialPersonReview: editorial,
    }),
    sourceEntityId,
  );
  normalizeReviewedPersonRoles(db, decision.targetEntityId, editorial, stats);
  updatePersonSearchDocuments(db, decision.targetPersonId, decision.targetEntityId, editorial);
  stats.peopleMerged += 1;
}

function ensurePlaces(db, stats) {
  const upsertPlace = db.prepare(`
    INSERT INTO entities (
      id, entity_type, primary_label, region_id, time_start, time_end,
      summary, confidence, review_status, raw_json
    ) VALUES (?, 'place', ?, 'china', ?, ?, ?, 'medium', 'reviewed', ?)
    ON CONFLICT(id) DO UPDATE SET
      primary_label = excluded.primary_label,
      summary = excluded.summary,
      review_status = 'reviewed',
      raw_json = excluded.raw_json
  `);
  const upsertAlias = db.prepare(`
    INSERT INTO entity_aliases (
      id, entity_id, value, alias_type, language, valid_start, valid_end, raw_json
    ) VALUES (?, ?, ?, ?, 'zh-Hans', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, raw_json = excluded.raw_json
  `);

  for (const place of review.ensuredPlaces ?? []) {
    const raw = {
      generatedFrom: "official-history-editorial-review",
      reviewBatchId: review.reviewBatchId,
      stablePlaceId: place.stablePlaceId,
      aliases: place.aliases ?? [],
      mapFeatureNames: [],
      locationStatus: "entity-confirmed-map-unlocated",
    };
    upsertPlace.run(
      place.entityId,
      place.label,
      profile.timeStart,
      profile.timeEnd,
      place.summary,
      toJson(raw),
    );
    for (const [index, alias] of [place.label, ...(place.aliases ?? [])].entries()) {
      upsertAlias.run(
        `editorial-place-alias:${stableId(`${place.entityId}:${alias}`)}`,
        place.entityId,
        alias,
        index === 0 ? "primary" : "historical-name",
        profile.timeStart,
        profile.timeEnd,
        toJson(raw),
      );
    }
    stats.placesEnsured += 1;
  }
}

function eventSearchBody(db, eventId, title, summary) {
  const entities = db.prepare(`
    SELECT e.primary_label
    FROM event_entities ee
    JOIN entities e ON e.id = ee.entity_id
    WHERE ee.event_id = ?
    ORDER BY ee.sort_order, e.primary_label
  `).all(eventId).map((row) => row.primary_label);
  const quotes = db.prepare(`
    SELECT quote
    FROM evidence_links
    WHERE subject_table = 'events' AND subject_id = ?
    ORDER BY id
  `).all(eventId).map((row) => row.quote);
  return compact([title, summary, ...entities, ...quotes].join(" "));
}

function updateSearchDocuments(db, eventId, editorial) {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  const body = eventSearchBody(db, eventId, event.title, event.summary);
  const rows = db.prepare(`
    SELECT id, raw_json
    FROM search_documents
    WHERE subject_table = 'events' AND subject_id = ?
  `).all(eventId);
  if (!rows.length) {
    db.prepare(`
      INSERT INTO search_documents (
        id, subject_table, subject_id, title, body, language, region_id, period_id,
        topic_id, time_start, time_end, review_status, raw_json
      ) VALUES (?, 'events', ?, ?, ?, 'zh-Hans', ?, ?, ?, ?, ?, 'reviewed', ?)
    `).run(
      `event:${eventId}`,
      eventId,
      event.title,
      body,
      event.region_id,
      profile.periodId,
      topicIdForOfficialHistoryEvent(event.event_type),
      event.time_start,
      event.time_end,
      toJson({ editorialReview: editorial }),
    );
    return;
  }
  for (const row of rows) {
    db.prepare(`
      UPDATE search_documents
      SET title = ?, body = ?, period_id = ?, topic_id = ?, review_status = 'reviewed', raw_json = ?
      WHERE id = ?
    `).run(
      event.title,
      body,
      profile.periodId,
      topicIdForOfficialHistoryEvent(event.event_type),
      toJson({ ...parseJson(row.raw_json), editorialReview: editorial }),
      row.id,
    );
  }
}

function applyEventEntityAdditions(db, eventId, links, stats) {
  let nextSortOrder = db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM event_entities WHERE event_id = ?")
    .get(eventId).value;
  for (const link of links ?? []) {
    db.prepare(`
      DELETE FROM event_entities
      WHERE event_id = ? AND entity_id = ? AND role <> ?
        AND json_extract(raw_json, '$.generator') IN (?, ?)
    `).run(eventId, link.entityId, link.role, generatorId, editorialGenerator);
    db.prepare(`
      INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(event_id, entity_id, role) DO UPDATE SET
        sort_order = excluded.sort_order,
        raw_json = excluded.raw_json
    `).run(
      eventId,
      link.entityId,
      link.role,
      nextSortOrder,
      toJson({ generator: editorialGenerator, reviewBatchId: review.reviewBatchId }),
    );
    if (link.role === "primary-location" && link.entityId.startsWith("place:")) {
      const previousPrimaryLinks = db.prepare(`
        SELECT entity_id, sort_order, raw_json
        FROM event_entities
        WHERE event_id = ? AND role = 'primary-location' AND entity_id <> ?
      `).all(eventId, link.entityId);
      for (const previous of previousPrimaryLinks) {
        const previousGenerator = parseJson(previous.raw_json).generator;
        if (![generatorId, editorialGenerator].includes(previousGenerator)) continue;
        db.prepare("DELETE FROM event_entities WHERE event_id = ? AND entity_id = ? AND role = 'primary-location'")
          .run(eventId, previous.entity_id);
        db.prepare(`
          INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
          VALUES (?, ?, 'related-location', ?, ?)
          ON CONFLICT(event_id, entity_id, role) DO UPDATE SET
            sort_order = excluded.sort_order,
            raw_json = excluded.raw_json
        `).run(eventId, previous.entity_id, previous.sort_order, previous.raw_json);
      }
      const place = db.prepare("SELECT primary_label, raw_json FROM entities WHERE id = ?").get(link.entityId);
      const event = db.prepare("SELECT raw_json FROM events WHERE id = ?").get(eventId);
      const eventRaw = parseJson(event.raw_json);
      const placeRaw = parseJson(place.raw_json);
      const stablePlaceId = placeRaw.stablePlaceId ?? link.entityId.slice("place:".length);
      const finalRaw = {
        ...eventRaw,
        locationName: place.primary_label,
        placeEntityIds: unique([link.entityId, ...(Array.isArray(eventRaw.placeEntityIds) ? eventRaw.placeEntityIds : [])]),
        placeIds: unique([stablePlaceId, ...(Array.isArray(eventRaw.placeIds) ? eventRaw.placeIds : [])]),
        places: unique([place.primary_label, ...(Array.isArray(eventRaw.places) ? eventRaw.places : [])]),
        editorialPlaceEntityIds: unique([
          ...(Array.isArray(eventRaw.editorialPlaceEntityIds) ? eventRaw.editorialPlaceEntityIds : []),
          link.entityId,
        ]),
        editorialPlaceIds: unique([
          ...(Array.isArray(eventRaw.editorialPlaceIds) ? eventRaw.editorialPlaceIds : []),
          stablePlaceId,
        ]),
      };
      db.prepare("UPDATE events SET place_entity_id = ?, raw_json = ? WHERE id = ?")
        .run(link.entityId, toJson(finalRaw), eventId);
      db.prepare("UPDATE historical_events SET location_name = ?, raw_json = ? WHERE id = ?")
        .run(place.primary_label, toJson(finalRaw), eventId);
    }
    nextSortOrder += 1;
    stats.eventEntitiesAdded += 1;
  }
}

function applyEventEntityRoleOverrides(db, overrides, stats) {
  for (const override of overrides ?? []) {
    const editorial = {
      batchId: review.reviewBatchId,
      reviewer: review.reviewer,
      reviewedAt,
      decision: "event-entity-role-override",
      eventId: override.eventId,
      rationale: override.rationale,
    };
    let nextSortOrder = db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM event_entities WHERE event_id = ?")
      .get(override.eventId).value;
    const setPlaceRole = (entityId, role) => {
      const existing = db.prepare(`
        SELECT MIN(sort_order) AS sort_order
        FROM event_entities
        WHERE event_id = ? AND entity_id = ?
      `).get(override.eventId, entityId);
      const sortOrder = Number.isInteger(existing.sort_order) ? existing.sort_order : nextSortOrder++;
      db.prepare(`
        DELETE FROM event_entities
        WHERE event_id = ? AND entity_id = ?
          AND role IN (
            'primary-location', 'battlefield', 'origin', 'destination', 'route-location',
            'affected-area', 'administrative-seat', 'related-location', 'location-candidate',
            'source-context', 'location'
          )
      `).run(override.eventId, entityId);
      db.prepare(`
        INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        override.eventId,
        entityId,
        role,
        sortOrder,
        toJson({ generator: editorialGenerator, editorialReview: editorial }),
      );
    };

    setPlaceRole(override.primaryPlaceEntityId, "primary-location");
    for (const entityId of override.relatedPlaceEntityIds ?? []) setPlaceRole(entityId, "related-location");

    const event = db.prepare("SELECT raw_json FROM events WHERE id = ?").get(override.eventId);
    const eventRaw = parseJson(event.raw_json);
    const orderedEntityIds = unique([
      override.primaryPlaceEntityId,
      ...(override.relatedPlaceEntityIds ?? []),
      ...(Array.isArray(eventRaw.placeEntityIds) ? eventRaw.placeEntityIds : []),
    ]);
    const places = orderedEntityIds.map((entityId) => {
      const entity = db.prepare("SELECT primary_label, raw_json FROM entities WHERE id = ?").get(entityId);
      return entity ? {
        entityId,
        stablePlaceId: parseJson(entity.raw_json).stablePlaceId ?? entityId.slice("place:".length),
        label: entity.primary_label,
      } : null;
    }).filter(Boolean);
    const primaryPlace = places[0];
    const finalRaw = {
      ...eventRaw,
      locationName: primaryPlace.label,
      placeEntityIds: places.map((place) => place.entityId),
      placeIds: places.map((place) => place.stablePlaceId),
      places: places.map((place) => place.label),
      editorialEventEntityRoleOverrides: unique([
        ...(Array.isArray(eventRaw.editorialEventEntityRoleOverrides)
          ? eventRaw.editorialEventEntityRoleOverrides
          : []),
        review.reviewBatchId,
      ]),
    };
    db.prepare("UPDATE events SET place_entity_id = ?, raw_json = ? WHERE id = ?")
      .run(primaryPlace.entityId, toJson(finalRaw), override.eventId);
    db.prepare("UPDATE historical_events SET location_name = ?, raw_json = ? WHERE id = ?")
      .run(primaryPlace.label, toJson(finalRaw), override.eventId);
    updateSearchDocuments(db, override.eventId, editorial);
    stats.eventEntityRoleOverrides += 1;
  }
}

function applyRetainedDecision(db, decision, stats) {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(decision.eventId);
  const editorial = editorialRecord(decision, event);
  const raw = parseJson(event.raw_json);
  const finalTitle = compact(decision.title ?? event.title);
  const finalSummary = compact(decision.summary ?? event.summary);
  const finalType = decision.eventType ?? event.event_type;
  const relatedEvents = unique([...(raw.relatedEvents ?? []), ...(decision.relatedEvents ?? [])]);
  const finalRaw = {
    ...raw,
    title: finalTitle,
    titleZh: finalTitle,
    category: finalType,
    summary: finalSummary,
    confidence: decision.confidence ?? event.confidence,
    reviewStatus: "reviewed",
    reviewedBy: review.reviewBatchId,
    relatedEvents,
    editorialReview: editorial,
  };
  db.prepare(`
    UPDATE events
    SET title = ?, event_type = ?, summary = ?, confidence = ?, review_status = 'reviewed', raw_json = ?
    WHERE id = ?
  `).run(
    finalTitle,
    finalType,
    finalSummary,
    decision.confidence ?? event.confidence,
    toJson(finalRaw),
    event.id,
  );

  const existingI18n = db.prepare("SELECT 1 FROM event_i18n WHERE event_id = ? AND locale = 'zh'").get(event.id);
  if (existingI18n) {
    db.prepare(`
      UPDATE event_i18n SET title = ?, summary = ? WHERE event_id = ? AND locale = 'zh'
    `).run(finalTitle, finalSummary, event.id);
  }
  db.prepare(`
    UPDATE historical_events
    SET title = ?, category = ?, summary = ?, confidence = ?, raw_json = ?
    WHERE id = ?
  `).run(finalTitle, finalType, finalSummary, decision.confidence ?? event.confidence, toJson(finalRaw), event.id);
  db.prepare(`
    UPDATE historical_event_i18n SET title = ?, summary = ? WHERE event_id = ? AND locale = 'zh'
  `).run(finalTitle, finalSummary, event.id);

  applyEventEntityAdditions(db, event.id, decision.addEventEntities, stats);

  for (const clusterId of raw.clusterIds ?? []) {
    const cluster = db.prepare("SELECT raw_json FROM import_event_clusters WHERE id = ?").get(clusterId);
    if (!cluster) continue;
    db.prepare(`
      UPDATE import_event_clusters
      SET matched_event_id = ?, match_status = 'matched', review_status = 'promoted', raw_json = ?
      WHERE id = ?
    `).run(
      event.id,
      toJson({ ...parseJson(cluster.raw_json), editorialReview: editorial }),
      clusterId,
    );
  }
  updateSearchDocuments(db, event.id, editorial);
  stats.retained += 1;
  if (decision.decision === "rename") stats.renamed += 1;
  else stats.approved += 1;
}

function cloneEvidence(db, evidence, targetId, editorial) {
  const cloneId = `editorial-event-evidence:${stableId(`${review.reviewBatchId}:${targetId}:${evidence.id}`)}`;
  db.prepare(`
    INSERT INTO evidence_links (
      id, subject_table, subject_id, source_id, passage_id, mention_id, locator,
      quote, evidence_role, confidence, raw_json
    ) VALUES (?, 'events', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subject_id = excluded.subject_id,
      quote = excluded.quote,
      raw_json = excluded.raw_json
  `).run(
    cloneId,
    targetId,
    evidence.source_id,
    evidence.passage_id,
    evidence.mention_id,
    evidence.locator,
    evidence.quote,
    evidence.evidence_role,
    evidence.confidence,
    toJson({
      ...parseJson(evidence.raw_json),
      generator: editorialGenerator,
      clonedFromEvidenceId: evidence.id,
      editorialReview: editorial,
    }),
  );
}

function appendTargetEditorialRecord(db, targetId, editorial, sourceEventId) {
  const target = db.prepare("SELECT raw_json FROM events WHERE id = ?").get(targetId);
  const raw = parseJson(target.raw_json);
  const records = Array.isArray(raw.officialHistoryEditorialEvidence)
    ? raw.officialHistoryEditorialEvidence.filter((record) => record.sourceEventId !== sourceEventId)
    : [];
  records.push({
    reviewBatchId: review.reviewBatchId,
    sourceEventId,
    reviewedAt,
    reviewer: review.reviewer,
    rationale: editorial.rationale,
  });
  db.prepare("UPDATE events SET raw_json = ? WHERE id = ?")
    .run(toJson({ ...raw, officialHistoryEditorialEvidence: records }), targetId);
}

function applyMergeDecision(db, decision, stats) {
  const sourceEvent = db.prepare("SELECT * FROM events WHERE id = ?").get(decision.eventId);
  const targetEvent = db.prepare("SELECT * FROM events WHERE id = ?").get(decision.mergeTargetId);
  const editorial = editorialRecord(decision, sourceEvent);
  const evidenceRows = db.prepare(`
    SELECT * FROM evidence_links WHERE subject_table = 'events' AND subject_id = ? ORDER BY id
  `).all(sourceEvent.id);

  for (const additionalTarget of decision.additionalEvidenceTargets ?? []) {
    for (const evidence of evidenceRows) cloneEvidence(db, evidence, additionalTarget, editorial);
    appendTargetEditorialRecord(db, additionalTarget, editorial, sourceEvent.id);
    updateSearchDocuments(db, additionalTarget, editorial);
    stats.additionalEvidenceTargets += 1;
  }
  for (const evidence of evidenceRows) {
    db.prepare(`
      UPDATE evidence_links
      SET subject_id = ?, raw_json = ?
      WHERE id = ?
    `).run(
      targetEvent.id,
      toJson({ ...parseJson(evidence.raw_json), editorialReview: editorial }),
      evidence.id,
    );
    stats.evidenceMoved += 1;
  }

  const cardLinks = db.prepare("SELECT * FROM event_import_cards WHERE event_id = ?").all(sourceEvent.id);
  for (const link of cardLinks) {
    db.prepare(`
      INSERT INTO event_import_cards (
        event_id, card_id, generator, relation_type, sort_order, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(event_id, card_id, generator) DO UPDATE SET
        relation_type = excluded.relation_type,
        raw_json = excluded.raw_json
    `).run(
      targetEvent.id,
      link.card_id,
      link.generator,
      link.relation_type,
      link.sort_order,
      toJson({ ...parseJson(link.raw_json), editorialReview: editorial }),
      link.created_at,
    );
    const card = db.prepare("SELECT raw_json FROM import_evidence_cards WHERE id = ?").get(link.card_id);
    if (card) {
      db.prepare(`
        UPDATE import_evidence_cards
        SET review_status = 'promoted', raw_json = ?
        WHERE id = ?
      `).run(
        toJson({ ...parseJson(card.raw_json), officialHistoryEventId: targetEvent.id, editorialReview: editorial }),
        link.card_id,
      );
    }
  }
  db.prepare("DELETE FROM event_import_cards WHERE event_id = ?").run(sourceEvent.id);

  const clusterLinks = db.prepare("SELECT * FROM import_event_cluster_events WHERE event_id = ?").all(sourceEvent.id);
  for (const link of clusterLinks) {
    db.prepare(`
      INSERT INTO import_event_cluster_events (
        cluster_id, event_id, generator, relation_type, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(cluster_id, event_id, generator) DO UPDATE SET
        relation_type = excluded.relation_type,
        raw_json = excluded.raw_json
    `).run(
      link.cluster_id,
      targetEvent.id,
      link.generator,
      link.relation_type,
      toJson({ ...parseJson(link.raw_json), editorialReview: editorial }),
      link.created_at,
    );
    const cluster = db.prepare("SELECT raw_json FROM import_event_clusters WHERE id = ?").get(link.cluster_id);
    if (cluster) {
      db.prepare(`
        UPDATE import_event_clusters
        SET matched_event_id = ?, match_status = 'matched', review_status = 'promoted', raw_json = ?
        WHERE id = ?
      `).run(
        targetEvent.id,
        toJson({ ...parseJson(cluster.raw_json), editorialReview: editorial }),
        link.cluster_id,
      );
    }
  }
  db.prepare("DELETE FROM import_event_cluster_events WHERE event_id = ?").run(sourceEvent.id);

  const entityLinks = db.prepare("SELECT * FROM event_entities WHERE event_id = ?").all(sourceEvent.id);
  for (const link of entityLinks) {
    db.prepare(`
      INSERT INTO event_entities (event_id, entity_id, role, sort_order, raw_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(event_id, entity_id, role) DO NOTHING
    `).run(
      targetEvent.id,
      link.entity_id,
      link.role,
      link.sort_order,
      toJson({ ...parseJson(link.raw_json), editorialReview: editorial }),
    );
  }
  db.prepare("DELETE FROM event_entities WHERE event_id = ?").run(sourceEvent.id);

  const mapLinks = db.prepare("SELECT * FROM map_feature_events WHERE event_id = ?").all(sourceEvent.id);
  for (const link of mapLinks) {
    db.prepare(`
      INSERT INTO map_feature_events (feature_id, event_id, relation_type, confidence, raw_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(feature_id, event_id, relation_type) DO NOTHING
    `).run(
      link.feature_id,
      targetEvent.id,
      link.relation_type,
      link.confidence,
      toJson({ ...parseJson(link.raw_json), editorialReview: editorial }),
    );
  }
  db.prepare("DELETE FROM map_feature_events WHERE event_id = ?").run(sourceEvent.id);

  applyEventEntityAdditions(db, targetEvent.id, decision.addEventEntities, stats);
  appendTargetEditorialRecord(db, targetEvent.id, editorial, sourceEvent.id);
  db.prepare("DELETE FROM search_documents WHERE subject_table = 'events' AND subject_id = ?").run(sourceEvent.id);
  db.prepare("DELETE FROM event_i18n WHERE event_id = ?").run(sourceEvent.id);
  db.prepare("DELETE FROM historical_event_people WHERE event_id = ?").run(sourceEvent.id);
  db.prepare("DELETE FROM historical_event_sources WHERE event_id = ?").run(sourceEvent.id);
  db.prepare("DELETE FROM historical_event_i18n WHERE event_id = ?").run(sourceEvent.id);
  db.prepare("DELETE FROM historical_events WHERE id = ?").run(sourceEvent.id);
  db.prepare("DELETE FROM events WHERE id = ?").run(sourceEvent.id);
  updateSearchDocuments(db, targetEvent.id, editorial);
  stats.merged += 1;
}

async function rebuildDocumentChunks(db) {
  const migrationPath = path.join(rootDir, "db", "migrations", "007-document-chunks-fts.mjs");
  const migration = await import(`${pathToFileURL(migrationPath).href}?editorial=${Date.now()}`);
  await migration.default(db);
}

async function main() {
  const db = new DatabaseSync(dbPath);
  const stats = {
    activeGeneratedEvents: 0,
    approved: 0,
    renamed: 0,
    retained: 0,
    merged: 0,
    evidenceMoved: 0,
    additionalEvidenceTargets: 0,
    eventEntitiesAdded: 0,
    eventEntityRoleOverrides: 0,
    peopleEnsured: 0,
    peopleRenamed: 0,
    peopleApproved: 0,
    peopleMerged: 0,
    personMergesAlreadyApplied: 0,
    personReferencesRewritten: 0,
    personRolesPromoted: 0,
    placesEnsured: 0,
    alreadyAppliedRefreshed: 0,
    chunksRebuilt: false,
  };
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA busy_timeout = 30000;");
    const validation = validateReview(db);
    stats.activeGeneratedEvents = validation.generatedEvents.length;
    if (dryRun) {
      const byDecision = Object.fromEntries(
        ["approve", "rename", "merge"].map((decision) => [
          decision,
          review.eventDecisions.filter((item) => item.decision === decision).length,
        ]),
      );
      console.log(JSON.stringify({
        dryRun: true,
        profileId: profile.id,
        reviewBatchId: review.reviewBatchId,
        database: dbPath,
        activeGeneratedEvents: validation.generatedEvents.length,
        pendingDecisions: validation.pendingDecisions.length,
        alreadyApplied: validation.alreadyApplied.length,
        byDecision,
        personRenames: review.personRenames?.length ?? 0,
        personApprovals: validation.personApprovals.length,
        pendingPersonMerges: validation.pendingPersonMerges.length,
        appliedPersonMerges: validation.appliedPersonMerges.length,
        ensuredPeople: review.ensuredPeople?.length ?? 0,
        ensuredPlaces: review.ensuredPlaces?.length ?? 0,
        crossReferenceLoaded: Boolean(crossReference),
      }, null, 2));
      return;
    }

    db.exec("BEGIN;");
    try {
      ensurePeople(db, stats);
      renamePeople(db, stats);
      ensurePlaces(db, stats);
      for (const decision of validation.pendingPersonMerges) mergePersonCandidate(db, decision, stats);
      approvePeople(db, validation.personApprovals, stats);
      for (const decision of validation.appliedPersonMerges) {
        rewriteMergedPersonReferences(db, decision, stats);
        normalizeReviewedPersonRoles(db, decision.targetEntityId, {
          batchId: review.reviewBatchId,
          reviewer: review.reviewer,
          reviewedAt,
          decision: "merge",
          sourcePersonId: decision.personId,
          targetPersonId: decision.targetPersonId,
          targetEntityId: decision.targetEntityId,
          rationale: decision.rationale,
        }, stats);
        updatePersonSearchDocuments(db, decision.targetPersonId, decision.targetEntityId, {
          batchId: review.reviewBatchId,
          reviewer: review.reviewer,
          reviewedAt,
          decision: "merge",
          sourcePersonId: decision.personId,
          targetPersonId: decision.targetPersonId,
          targetEntityId: decision.targetEntityId,
          rationale: decision.rationale,
        });
        stats.personMergesAlreadyApplied += 1;
      }
      for (const decision of validation.alreadyApplied) {
        applyEventEntityAdditions(db, decision.mergeTargetId, decision.addEventEntities, stats);
        updateSearchDocuments(db, decision.mergeTargetId, {
          batchId: review.reviewBatchId,
          reviewer: review.reviewer,
          reviewedAt,
          decision: "merge",
          sourceEventId: decision.eventId,
          mergeTargetId: decision.mergeTargetId,
          rationale: decision.rationale,
        });
        stats.alreadyAppliedRefreshed += 1;
      }
      for (const decision of validation.pendingDecisions) {
        if (decision.decision === "merge") applyMergeDecision(db, decision, stats);
        else applyRetainedDecision(db, decision, stats);
      }
      applyEventEntityRoleOverrides(db, review.eventEntityRoleOverrides, stats);
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }
    if (rebuildChunks) {
      await rebuildDocumentChunks(db);
      stats.chunksRebuilt = true;
    }

    console.log(JSON.stringify({
      dryRun: false,
      profileId: profile.id,
      reviewBatchId: review.reviewBatchId,
      database: dbPath,
      alreadyApplied: validation.alreadyApplied.length,
      stats,
    }, null, 2));
  } finally {
    db.close();
  }
}

await main();
