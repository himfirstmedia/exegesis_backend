import { explain } from '../controller.js';
import { Request, Response } from 'express';

// Mock prisma responses
jest.mock('../../../../config/db.js', () => ({
  prisma: {
    searchIndex: {
      findFirst: jest.fn().mockResolvedValue({ verseText: 'For God so loved the world...' }),
    },
    bookPrologue: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    dailyExegesis: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    verseExplanation: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    verseResource: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    searchIndex: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    chapterStudyTool: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    verseWord: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Mock cache service (no‑op)
jest.mock('../../../../services/cacheService.js', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('POST /api/ai/explain', () => {
  it('returns AI generated sections', async () => {
    const req = {
      body: { book: 'John', chapter: 3, verse: 16, depth: 'standard' },
    } as unknown as Request;
    const jsonMock = jest.fn();
    const res = {
      json: jsonMock,
    } as unknown as Response;
    await explain(req, res);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          intro: expect.any(String),
          lesson: expect.any(String),
          application: expect.any(String),
          prayer: expect.any(String),
        }),
      })
    );
  });
});
