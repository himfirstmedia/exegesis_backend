import { prisma } from "../../config/db.js";

/** Rank only page candidates. Dated rows can stream from the activity index;
 * undated legacy rows still use their linked study creation date. */
export function browseVerseExplanationPage(offset, size) {
  const candidates = offset + size;
  return Promise.all([
    prisma.$queryRaw`
      WITH dated AS (
        SELECT id, book_name, chapter, verse_number,
               GREATEST(created_on, updated_on) AS activity, NULL::timestamp AS study_created_on
        FROM verse_explanations
        WHERE created_on IS NOT NULL OR updated_on IS NOT NULL
        ORDER BY activity DESC, book_name, chapter, verse_number
        LIMIT ${candidates}
      ), undated AS (
        SELECT v.id, v.book_name, v.chapter, v.verse_number,
               s.created_on AS activity, s.created_on AS study_created_on
        FROM verse_explanations v
        LEFT JOIN passage_studies s ON s.id = v.shared_study_id
        WHERE v.created_on IS NULL AND v.updated_on IS NULL
        ORDER BY activity DESC NULLS LAST, v.book_name, v.chapter, v.verse_number
        LIMIT ${candidates}
      )
      SELECT id, study_created_on AS "studyCreatedOn"
      FROM (SELECT * FROM dated UNION ALL SELECT * FROM undated) AS ranked
      ORDER BY activity DESC NULLS LAST, book_name, chapter, verse_number
      LIMIT ${size} OFFSET ${offset}
    `,
    prisma.verseExplanation.count(),
  ]);
}
