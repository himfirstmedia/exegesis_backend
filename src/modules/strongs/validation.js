import { z } from 'zod/v4';
import { CANONICAL_BOOK_ORDER } from '../../constants/bible-books.js';

const strongsId = z.string().trim().toUpperCase().regex(/^[GH]\d{1,5}$/, 'Use a Strong’s ID such as H7225 or G3056');
const editorialText = z.string().max(30000).nullable().optional();

const lang = z.string().optional();

export const searchStrongsSchema = z.object({
  q: z.string().optional().default(''),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  language: z.string().optional(),
  lang,
});

export const getBookWordsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  language: z.string().optional(),
  view: z.enum(['preview']).optional(),
  lang,
});

export const getRandomWordsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  language: z.string().optional(),
  view: z.enum(['preview']).optional(),
  lang,
});

export const getStrongsEntrySchema = z.object({
  lang,
  bookName: z.enum(CANONICAL_BOOK_ORDER).optional(),
  studyOffset: z.coerce.number().int().min(0).optional(),
});

export const getRelatedWordsSchema = z.object({ lang });

export const getVersesByStrongsSchema = z.object({
  translation: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  lang,
});

export const searchTopicsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  lang,
});

export const getTopicVersesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  lang,
});

export const getVerseWordsSchema = z.object({
  bookName: z.string().min(1, 'bookName is required'),
  chapter: z.coerce.number().int().min(1),
  verseNumber: z.coerce.number().int().min(1).optional(),
  translation: z.string().optional(),
  lang,
});

export const getVerseUniqueWordsSchema = z.object({
  bookName: z.string().min(1, 'bookName is required'),
  chapter: z.coerce.number().int().min(0).optional(),
  verse: z.coerce.number().int().min(0).optional(),
  translation: z.string().optional(),
  page: z.coerce.number().int().min(0).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
  lang,
});

export const adminUpdateEntrySchema = z.object({
  strongsId,
  adminExplanation: editorialText,
  originalWord: z.string().max(1000).nullable().optional(),
  transliteration: z.string().max(1000).nullable().optional(),
  shortDefinition: z.string().optional(),
  fullDefinition: editorialText,
  partOfSpeech: z.string().max(100).nullable().optional(),
  language: z.enum(['greek', 'hebrew']).optional(),
  pronunciation: z.string().max(500).nullable().optional(),
  grammaticalCase: z.string().max(100).nullable().optional(),
  gender: z.string().max(100).nullable().optional(),
  number: z.string().max(100).nullable().optional(),
  usageCount: z.number().int().min(0).nullable().optional(),
  crossReferences: z.string().max(5000).nullable().optional(),
});

export const adminDeleteEntrySchema = z.object({ strongsId });

export const adminUpsertVerseWordStudySchema = z.object({
  strongsId,
  bookName: z.enum(CANONICAL_BOOK_ORDER),
  chapter: z.coerce.number().int().min(1).max(150),
  verse: z.coerce.number().int().min(1).max(176),
  translation: z.string().trim().min(1).max(100).optional(),
  surfaceText: z.string().optional(),
  adminExplanation: editorialText,
});

export const adminDeleteVerseWordStudySchema = z.object({
  id: z.coerce.number().int().min(1, 'id is required'),
});

export const adminSyncVerseReferencesSchema = z.object({
  strongsId: z.string().min(1, 'strongsId is required'),
});
