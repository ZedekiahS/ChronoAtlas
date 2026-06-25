function toJson(value) {
  return JSON.stringify(value ?? {});
}

function toNullableText(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toNullableInteger(value) {
  return Number.isInteger(value) ? value : null;
}

function replaceChildRows(db, tableName, keyColumn, keyValue) {
  db.prepare(`DELETE FROM ${tableName} WHERE ${keyColumn} = ?`).run(keyValue);
}

export function upsertSources(db, sources) {
  const insert = db.prepare(`
    INSERT INTO sources (
      id, title, author, type, citation_short, url, language, corpus_id, note, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      author = excluded.author,
      type = excluded.type,
      citation_short = excluded.citation_short,
      url = excluded.url,
      language = excluded.language,
      corpus_id = excluded.corpus_id,
      note = excluded.note,
      raw_json = excluded.raw_json
  `);

  for (const source of sources) {
    insert.run(
      source.id,
      source.title,
      toNullableText(source.author),
      source.type,
      toNullableText(source.citationShort),
      toNullableText(source.url),
      source.language ?? "zh-Hans",
      source.corpusId ?? "china-three-kingdoms",
      toNullableText(source.note),
      toJson(source.rawJson ?? source),
    );
  }
}

export function upsertSourceMentions(db, mentions) {
  const insertMention = db.prepare(`
    INSERT INTO source_mentions (
      id, source_id, passage_id, work_title, book_title, chapter_title, locator,
      year, text, translation, confidence, review_status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source_id = excluded.source_id,
      passage_id = excluded.passage_id,
      work_title = excluded.work_title,
      book_title = excluded.book_title,
      chapter_title = excluded.chapter_title,
      locator = excluded.locator,
      year = excluded.year,
      text = excluded.text,
      translation = excluded.translation,
      confidence = excluded.confidence,
      review_status = excluded.review_status,
      raw_json = excluded.raw_json
  `);
  const insertPerson = db.prepare(`
    INSERT INTO source_mention_people (mention_id, person_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertEvent = db.prepare(`
    INSERT INTO source_mention_events (mention_id, event_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertPlace = db.prepare(`
    INSERT INTO source_mention_places (mention_id, place_id, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertTag = db.prepare(`
    INSERT INTO source_mention_tags (mention_id, tag, sort_order)
    VALUES (?, ?, ?)
  `);

  for (const mention of mentions) {
    insertMention.run(
      mention.id,
      mention.sourceId,
      toNullableText(mention.passageId),
      mention.workTitle,
      mention.bookTitle,
      mention.chapterTitle,
      mention.locator,
      toNullableInteger(mention.year),
      mention.text,
      toNullableText(mention.translation),
      mention.confidence ?? "medium",
      mention.reviewStatus ?? "draft",
      toJson(mention.rawJson ?? mention),
    );

    replaceChildRows(db, "source_mention_people", "mention_id", mention.id);
    replaceChildRows(db, "source_mention_events", "mention_id", mention.id);
    replaceChildRows(db, "source_mention_places", "mention_id", mention.id);
    replaceChildRows(db, "source_mention_tags", "mention_id", mention.id);

    for (const [index, personId] of (mention.personIds ?? []).entries()) {
      insertPerson.run(mention.id, personId, index);
    }
    for (const [index, eventId] of (mention.eventIds ?? []).entries()) {
      insertEvent.run(mention.id, eventId, index);
    }
    for (const [index, placeId] of (mention.placeIds ?? []).entries()) {
      insertPlace.run(mention.id, placeId, index);
    }
    for (const [index, tag] of (mention.tags ?? []).entries()) {
      insertTag.run(mention.id, tag, index);
    }
  }
}

export function upsertLifeEvents(db, lifeEvents) {
  const insert = db.prepare(`
    INSERT INTO person_life_events (
      id, person_id, year, end_year, display_year, type, title, summary,
      confidence, approximate, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      person_id = excluded.person_id,
      year = excluded.year,
      end_year = excluded.end_year,
      display_year = excluded.display_year,
      type = excluded.type,
      title = excluded.title,
      summary = excluded.summary,
      confidence = excluded.confidence,
      approximate = excluded.approximate,
      raw_json = excluded.raw_json
  `);

  for (const lifeEvent of lifeEvents) {
    insert.run(
      lifeEvent.id,
      lifeEvent.personId,
      toNullableInteger(lifeEvent.year),
      toNullableInteger(lifeEvent.endYear),
      lifeEvent.displayYear,
      lifeEvent.type,
      lifeEvent.title,
      lifeEvent.summary,
      lifeEvent.confidence ?? "medium",
      lifeEvent.approximate === true ? 1 : 0,
      toJson(lifeEvent.rawJson ?? lifeEvent),
    );
  }
}

export function linkLifeEventSourceMentions(db, links) {
  const insert = db.prepare(`
    INSERT INTO person_life_event_source_mentions (life_event_id, mention_id, sort_order)
    VALUES (?, ?, ?)
    ON CONFLICT(life_event_id, mention_id) DO UPDATE SET
      sort_order = excluded.sort_order
  `);

  for (const link of links) {
    insert.run(link.lifeEventId, link.mentionId, link.sortOrder ?? 0);
  }
}

export function upsertLifeEventSourceRefs(db, sourceRefs) {
  const insert = db.prepare(`
    INSERT INTO person_life_event_source_refs (life_event_id, source_id, locator, quote, raw_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(life_event_id, source_id, locator) DO UPDATE SET
      quote = excluded.quote,
      raw_json = excluded.raw_json
  `);

  for (const ref of sourceRefs) {
    insert.run(
      ref.lifeEventId,
      ref.sourceId,
      ref.locator,
      toNullableText(ref.quote),
      toJson(ref.rawJson ?? ref),
    );
  }
}

export function upsertRelationSourceRefs(db, sourceRefs) {
  const insert = db.prepare(`
    INSERT INTO person_relation_source_refs (relation_id, source_id, locator, raw_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(relation_id, source_id, locator) DO UPDATE SET
      raw_json = excluded.raw_json
  `);

  for (const ref of sourceRefs) {
    insert.run(ref.relationId, ref.sourceId, ref.locator, toJson(ref.rawJson ?? ref));
  }
}
