import * as strongsService from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';
import { asyncHandler } from '../../middlewares/validate.middleware.js';
import { NotFoundError, ValidationError } from '../../utils/AppError.js';

export const getStrongsEntry = asyncHandler(async (req, res) => {
  const { strongsId } = req.params;
  const result = await strongsService.getStrongsEntry(strongsId, req.query.lang);
  res.json(formatApiResponse(result));
});

export const searchStrongs = asyncHandler(async (req, res) => {
  const { q, limit, offset, lang } = req.query;
  if (!q || q.trim().length < 1) {
    throw new ValidationError('Search query is required');
  }
  const result = await strongsService.searchStrongs(q, parseInt(limit) || 50, parseInt(offset) || 0, lang);
  res.json(formatApiResponse(result));
});

export const getRelatedWords = asyncHandler(async (req, res) => {
  const { strongsId } = req.params;
  const result = await strongsService.getRelatedWords(strongsId, req.query.lang);
  res.json(formatApiResponse(result));
});

export const getVersesByStrongs = asyncHandler(async (req, res) => {
  const { strongsId } = req.params;
  const { translation, limit, lang } = req.query;
  const result = await strongsService.getVersesByStrongs(strongsId, translation || 'Berean', limit ? parseInt(limit) : 50, lang);
  res.json(formatApiResponse(result));
});

export const getBookWords = asyncHandler(async (req, res) => {
  const { bookName } = req.params;
  if (!bookName) {
    throw new ValidationError('bookName is required');
  }
  const { limit, offset, lang } = req.query;
  const result = await strongsService.getBookWords(bookName, parseInt(limit) || 200, parseInt(offset) || 0, lang);
  res.json(formatApiResponse(result));
});

export const getVerseUniqueWords = asyncHandler(async (req, res) => {
  const { bookName, chapter, verse, translation, page, pageSize, lang } = req.body;
  if (!bookName) {
    throw new ValidationError('bookName is required');
  }
  const result = await strongsService.getVerseUniqueWords(bookName, chapter || null, verse || null, translation || 'BSB', page || 0, pageSize || 50, lang);
  res.json(formatApiResponse(result));
});

export const getVerseWords = asyncHandler(async (req, res) => {
  const { bookName, chapter, verseNumber, translation, lang } = req.body;
  const result = await strongsService.getVerseWords(bookName, chapter, verseNumber, translation || 'Berean', lang);
  res.json(formatApiResponse(result));
});

export const searchTopics = asyncHandler(async (req, res) => {
  const { q, limit, lang } = req.query;
  if (!q || q.trim().length < 1) {
    throw new ValidationError('Search query is required');
  }
  const result = await strongsService.searchTopics(q, parseInt(limit) || 50, lang);
  res.json(formatApiResponse(result));
});

export const getTopicVerses = asyncHandler(async (req, res) => {
  const { topicName } = req.params;
  const { limit, lang } = req.query;
  const result = await strongsService.getTopicVerses(topicName, parseInt(limit) || 50, lang);
  res.json(formatApiResponse(result));
});

export const adminUpdateEntry = asyncHandler(async (req, res) => {
  const { strongsId, adminExplanation, originalWord, transliteration, shortDefinition, fullDefinition, partOfSpeech, language } = req.body;
  if (!strongsId) {
    throw new ValidationError('strongsId is required');
  }
  const result = await strongsService.adminUpdateEntry(strongsId, {
    adminExplanation,
    originalWord,
    transliteration,
    shortDefinition,
    fullDefinition,
    partOfSpeech,
    language,
  });
  res.json(formatApiResponse(result));
});

export const adminGetVerseUniqueWords = asyncHandler(async (req, res) => {
  const { bookName, chapter, verse, translation, page, pageSize } = req.body;
  if (!bookName) {
    throw new ValidationError('bookName is required');
  }
  const result = await strongsService.getVerseUniqueWords(bookName, chapter || 0, verse || 0, translation || 'BSB', page || 0, pageSize || 50);
  res.json(formatApiResponse(result));
});

export const adminUpsertVerseWordStudy = asyncHandler(async (req, res) => {
  const { strongsId, bookName, chapter, verse, translation, surfaceText, adminExplanation } = req.body;
  if (!strongsId || !bookName || !chapter || !verse) {
    throw new ValidationError('strongsId, bookName, chapter, and verse are required');
  }
  const result = await strongsService.upsertVerseWordStudy({
    strongsId,
    bookName,
    chapter,
    verse,
    translation,
    surfaceText,
    adminExplanation,
    createdBy: req.user?.id || req.user?.userId,
  });
  res.json(formatApiResponse(result));
});

export const adminListVerseWordStudies = asyncHandler(async (req, res) => {
  const { bookName, chapter, verse, translation, page, pageSize } = req.body;
  if (!bookName) {
    throw new ValidationError('bookName is required');
  }
  const result = await strongsService.listVerseWordStudies({
    bookName,
    chapter: chapter || 0,
    verse: verse || 0,
    translation,
    page: page || 0,
    pageSize: pageSize || 50,
  });
  res.json(formatApiResponse(result));
});

export const adminListAllVerseWordStudies = asyncHandler(async (req, res) => {
  const { page, pageSize, search, bookName } = req.body;
  const result = await strongsService.adminListAllVerseWordStudies({
    page: page || 0,
    pageSize: pageSize || 50,
    search,
    bookName,
  });
  res.json(formatApiResponse(result));
});

export const adminDeleteVerseWordStudy = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    throw new ValidationError('id is required');
  }
  const result = await strongsService.deleteVerseWordStudy(Number(id));
  res.json(formatApiResponse(result));
});

export const adminSyncVerseReferences = asyncHandler(async (req, res) => {
  const { strongsId } = req.body;
  if (!strongsId) {
    throw new ValidationError('strongsId is required');
  }
  const result = await strongsService.syncVerseReferences(strongsId);
  res.json(formatApiResponse({
    status: 200,
    message: `Synced ${result.count} verse references for ${strongsId}`,
    data: result,
  }));
});

export const adminSyncAllVerseReferences = asyncHandler(async (req, res) => {
  const result = await strongsService.syncAllVerseReferences();
  res.json(formatApiResponse({
    status: 200,
    message: `Synced ${result.syncedCount} entries with ${result.totalReferences} total verse references`,
    data: result,
  }));
});

export const adminListEntries = asyncHandler(async (req, res) => {
  const { page, pageSize, search, language, hasAdminExplanation } = req.body;
  const result = await strongsService.adminListEntries({
    page: page || 0,
    pageSize: pageSize || 50,
    search,
    language,
    hasAdminExplanation,
  });
  res.json(formatApiResponse(result));
});

export const adminGetVerseWords = asyncHandler(async (req, res) => {
  const { bookName, chapter, verse, translation } = req.body;
  if (!bookName || !chapter) {
    throw new ValidationError('bookName and chapter are required');
  }
  const result = await strongsService.getVerseWords(bookName, chapter, verse || null, translation || 'Berean');
  res.json(formatApiResponse(result));
});
