import { explainVerses, generatePromptAnswer } from "./service.js";
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

export const generatePrompt = asyncHandler(async (req, res) => {
  const { book, chapter, verse, promptIdx } = req.body;

  const result = await generatePromptAnswer(book, chapter, verse, promptIdx);

  if (result.error) {
    return res.status(400).json(formatApiResponse({
      status: 400,
      message: result.error,
    }));
  }

  res.json(formatApiResponse({
    status: 200,
    message: "Prompt answer generated",
    data: result,
  }));
});
