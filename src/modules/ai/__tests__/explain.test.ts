import { explain } from '../controller.js';
import { Request, Response } from 'express';

// Mock prisma responses
jest.mock('../../../config/db.js', () => ({
  prisma: {
    searchIndex: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        // Exact verse lookup (main verse) → a BSB row.
        if (where?.verse && typeof where.verse === 'number') {
          return [{ verseText: 'For God so loved the world...', translation: 'BSB' }];
        }
        // Range lookup (surrounding verses) → none.
        return [];
      }),
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
    chapterStudyTool: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    verseWord: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Mock cache service (no-op)
jest.mock('../../../services/cacheService.js', () => ({
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
    // asyncHandler does not return the controller's promise, so flush the
    // microtask queue before asserting on res.json.
    await new Promise((resolve) => setImmediate(resolve));
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        returnCode: 200,
        returnMessage: 'Explanation generated',
        returnData: expect.objectContaining({
          intro: expect.any(String),
          explanation: expect.any(String),
          application: expect.any(String),
          prayer: expect.any(String),
        }),
      })
    );
  });
});
