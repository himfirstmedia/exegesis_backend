import { explainVerses } from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";
import { asyncHandler } from "../../middlewares/validate.middleware.js";

export const explain = asyncHandler(async (req, res) => {
  const { book, chapter, verse, depth } = req.body;
  const result = await explainVerses(book, chapter, verse, depth);
  res.json(formatApiResponse({ status: 200, message: "Explanation generated", data: result }));
});
