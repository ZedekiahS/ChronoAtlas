export const runAfterRuntimeSeeds = true;

export default function migrate(db) {
  const result = db.prepare(`
    UPDATE search_documents
    SET review_status = (
      SELECT entities.review_status
      FROM entities
      WHERE entities.id = search_documents.subject_id
    )
    WHERE subject_table = 'entities'
      AND EXISTS (
        SELECT 1
        FROM entities
        WHERE entities.id = search_documents.subject_id
          AND entities.review_status <> search_documents.review_status
      )
  `).run();

  console.log(
    `[db:build] search-document entity review status: ${result.changes} synchronized`,
  );
}
