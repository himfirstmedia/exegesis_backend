import { z } from "zod/v4";

const languageCode = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/, "Invalid language code");

const sourceLanguageCode = z.union([z.literal("auto"), languageCode]);
const requiredText = z.string().refine((value) => value.trim().length > 0, {
  message: "Text is required",
});

export const translateSchema = z.object({
  q: requiredText,
  source: sourceLanguageCode.default("auto"),
  target: languageCode,
  format: z.enum(["text", "html"]).default("text"),
  alternatives: z.coerce.number().int().min(0).max(10).optional(),
});

export const translateBatchSchema = z.object({
  q: z.array(requiredText).min(1).max(100),
  source: sourceLanguageCode.default("auto"),
  target: languageCode,
  format: z.enum(["text", "html"]).default("text"),
  alternatives: z.coerce.number().int().min(0).max(10).optional(),
});

export const detectSchema = z.object({
  q: requiredText,
});
