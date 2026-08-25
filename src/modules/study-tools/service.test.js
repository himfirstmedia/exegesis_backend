import { prisma } from '../../config/db.js';
import { translateStudyTools } from './translation.js';
import { getChapterTools } from './service.js';

jest.mock('../../config/db.js', () => ({
  prisma: {
    chapterStudyTool: {
      findMany: jest.fn(),
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
