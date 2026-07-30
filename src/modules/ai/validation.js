import { z } from "zod";
export const explainSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
});
