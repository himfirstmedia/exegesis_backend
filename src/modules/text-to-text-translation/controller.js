import { asyncHandler } from "../../middlewares/validate.middleware.js";
import { formatApiResponse } from "../../utils/helpers.js";
import * as translationService from "./service.js";

const send = (res, message, data) =>
  res.status(200).json(formatApiResponse({ status: 200, message, data }));

export const translate = asyncHandler(async (req, res) => {
  const result = await translationService.translateText(req.body);
  return send(res, "Text translated", result);
});

export const translateBatch = asyncHandler(async (req, res) => {
  const result = await translationService.translateBatch(req.body);
  return send(res, "Batch translated", result);
});

export const detect = asyncHandler(async (req, res) => {
  const result = await translationService.detectLanguage(req.body.q);
  return send(res, "Language detected", result);
});

export const languages = asyncHandler(async (_req, res) => {
  const result = await translationService.getLanguages();
  return send(res, "Languages fetched", result);
});

export const status = asyncHandler(async (_req, res) => {
  const result = await translationService.getStatus();
  return send(res, "Translation service status", result);
});
