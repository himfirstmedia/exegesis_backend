import { explainVerses } from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";
import { asyncHandler } from "../../middlewares/validate.middleware.js";

export const explain = asyncHandler(async (req, res) => {
  const { book, chapter, verse, verses, depth } = req.body;

  if (verses) {
    const results = await Promise.all(
      verses.map(v => explainVerses(v.book, v.chapter, v.verse, depth))
    );
    return res.json(formatApiResponse({ status: 200, message: "Explanations generated", data: results }));
  }

  const result = await explainVerses(book, chapter, verse, depth);
  res.json(formatApiResponse({ status: 200, message: "Explanation generated", data: result }));
});
