import { z } from 'zod/v4';

export const searchStrongsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const getBookWordsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const getVerseWordsSchema = z.object({
  bookName: z.string().min(1, 'bookName is required'),
  chapter: z.coerce.number().int().min(1),
  verseNumber: z.coerce.number().int().min(1).optional(),
  translation: z.string().optional(),
});

export const getVerseUniqueWordsSchema = z.object({
  bookName: z.string().min(1, 'bookName is required'),
  chapter: z.coerce.number().int().min(0).optional(),
  verse: z.coerce.number().int().min(0).optional(),
  translation: z.string().optional(),
  page: z.coerce.number().int().min(0).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});

export const adminUpdateEntrySchema = z.object({
  strongsId: z.string().min(1, 'strongsId is required'),
  adminExplanation: z.string().optional(),
  originalWord: z.string().optional(),
  transliteration: z.string().optional(),
  shortDefinition: z.string().optional(),
  fullDefinition: z.string().optional(),
  partOfSpeech: z.string().optional(),
  language: z.string().optional(),
});

export const adminUpsertVerseWordStudySchema = z.object({
  strongsId: z.string().min(1, 'strongsId is required'),
  bookName: z.string().min(1, 'bookName is required'),
  chapter: z.coerce.number().int().min(1, 'chapter is required'),
  verse: z.coerce.number().int().min(1, 'verse is required'),
  translation: z.string().optional(),
  surfaceText: z.string().optional(),
  adminExplanation: z.string().optional(),
});

export const adminDeleteVerseWordStudySchema = z.object({
  id: z.coerce.number().int().min(1, 'id is required'),
});

export const adminSyncVerseReferencesSchema = z.object({
  strongsId: z.string().min(1, 'strongsId is required'),
});
