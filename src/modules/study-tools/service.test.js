import { prisma } from '../../config/db.js';
import { translateStudyTools } from './translation.js';
import { getChapterTools, getAllTools } from './service.js';

jest.mock('../../config/db.js', () => ({
  prisma: {
    chapterStudyTool: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('./translation.js', () => ({
  translateStudyTools: jest.fn(),
}));

describe('getChapterTools translation boundary', () => {
  beforeEach(() => {
    prisma.chapterStudyTool.findMany.mockReset();
    translateStudyTools.mockReset();
    translateStudyTools.mockImplementation(async (tools) => tools);
  });

  test.each([
    [{ bookName: 'John', chapter: 3, lang: 'ar' }, 'ar'],
    [{ bookName: 'John', chapter: 3 }, 'en'],
  ])('uses the request language and defaults to English', async (body, expectedLang) => {
    prisma.chapterStudyTool.findMany.mockResolvedValueOnce([{
      id: 1n,
      toolType: 'COMMAND',
      label: 'A command',
      order: 0,
    }]);

    const result = await getChapterTools(body);

    expect(translateStudyTools).toHaveBeenCalledWith([{
      id: 1,
      toolType: 'COMMAND',
      label: 'A command',
      order: 0,
    }], expectedLang);
    expect(result.data.COMMAND).toHaveLength(1);
    expect(prisma.chapterStudyTool.findMany).toHaveBeenCalledWith(expect.objectContaining({
      include: {
        studyToolWords: expect.objectContaining({
          include: {
            strongs: {
              select: expect.objectContaining({ fullDefinition: true }),
            },
          },
        }),
      },
    }));
  });
});

describe('getAllTools admin source preservation', () => {
  beforeEach(() => {
    prisma.chapterStudyTool.findMany.mockReset();
    prisma.chapterStudyTool.count.mockReset();
    translateStudyTools.mockReset();
  });

  test('localizes rows and attaches the canonical source when opted in', async () => {
    prisma.chapterStudyTool.findMany.mockResolvedValueOnce([{
      id: 5n,
      bookName: 'John',
      chapter: 3n,
      toolType: 'PROMISE',
      label: 'Original label',
      description: 'Original description',
      order: 0,
    }]);
    prisma.chapterStudyTool.count.mockResolvedValueOnce(1);
    translateStudyTools.mockResolvedValueOnce([{
      id: 5,
      bookName: 'John',
      chapter: 3,
      toolType: 'PROMISE',
      label: 'fr:Original label',
      description: 'fr:Original description',
      order: 0,
    }]);

    const result = await getAllTools({
      page: 0,
      pageSize: 4,
      lang: 'fr',
      includeSource: true,
    });

    expect(result.data.data[0]).toMatchObject({
      label: 'fr:Original label',
      description: 'fr:Original description',
      source: {
        id: 5,
        label: 'Original label',
        description: 'Original description',
      },
    });
  });

  test('omits the source payload without the opt-in', async () => {
    prisma.chapterStudyTool.findMany.mockResolvedValueOnce([{
      id: 5n,
      bookName: 'John',
      chapter: 3n,
      toolType: 'PROMISE',
      label: 'Original label',
      description: null,
      order: 0,
    }]);
    prisma.chapterStudyTool.count.mockResolvedValueOnce(1);
    translateStudyTools.mockResolvedValueOnce([{
      id: 5,
      bookName: 'John',
      chapter: 3,
      toolType: 'PROMISE',
      label: 'fr:Original label',
      description: null,
      order: 0,
    }]);

    const result = await getAllTools({ page: 0, pageSize: 4, lang: 'fr' });

    expect(result.data.data[0].source).toBeUndefined();
  });
});
