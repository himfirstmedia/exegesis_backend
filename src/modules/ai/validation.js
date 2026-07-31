import { z } from "zod";

const verseItem = z.object({
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
});

export const explainSchema = z.object({
  book: z.string().min(1).optional(),
  chapter: z.number().int().positive().optional(),
  verse: z.number().int().positive().optional(),
  verses: z.array(verseItem).min(1).optional(),
  depth: z.enum(["brief", "standard", "detailed"]).optional().default("standard"),
}).refine(
  data => (data.book && data.chapter && data.verse) || data.verses,
  { message: "Provide either (book, chapter, verse) or (verses array)" }
);

export const generatePromptSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  promptIdx: z.number().int().min(0).max(5),
});
