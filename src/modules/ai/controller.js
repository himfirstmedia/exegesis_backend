import { explainVerses, generatePromptAnswer } from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";
import { asyncHandler } from "../../middlewares/validate.middleware.js";
import { translateExplainResponse, translatePromptResponse } from "./translation.js";

export const explain = asyncHandler(async (req, res) => {
  const { book, chapter, verse, verses, depth, lang } = req.body;

  if (verses) {
    const results = await Promise.all(
      verses.map(v => explainVerses(v.book, v.chapter, v.verse, depth))
    );
    const translated = await translateExplainResponse(results, lang);
    return res.json(formatApiResponse({ status: 200, message: "Explanations generated", data: translated }));
  }

  const result = await explainVerses(book, chapter, verse, depth);
  const translated = await translateExplainResponse(result, lang);
  res.json(formatApiResponse({ status: 200, message: "Explanation generated", data: translated }));
});

export const generatePrompt = asyncHandler(async (req, res) => {
  const { book, chapter, verse, promptIdx, lang } = req.body;

  const result = await generatePromptAnswer(book, chapter, verse, promptIdx);

  if (result.error) {
    return res.status(400).json(formatApiResponse({
      status: 400,
      message: result.error,
    }));
  }

  const translated = await translatePromptResponse(result, lang);
  res.json(formatApiResponse({
    status: 200,
    message: "Prompt answer generated",
    data: translated,
  }));
});
