import { prisma } from '../../config/db.js';
import { updateSingleTool } from './service.js';

jest.mock('../../config/db.js', () => ({
  prisma: { chapterStudyTool: { findUnique: jest.fn(), update: jest.fn() } },
}));

const word = { id: 88n, strongsId: 'G26', bookName: 'John', chapter: 3n, verse: 16n, surfaceText: 'love',
  originalWord: null, transliteration: null, adminExplanation: 'Before', wordOrder: 0 };
const tool = { id: 7n, bookName: 'John', chapter: 3n, label: 'Word study', studyToolWords: [word] };

beforeEach(() => {
  jest.clearAllMocks();
  prisma.chapterStudyTool.findUnique.mockResolvedValue(tool);
  prisma.chapterStudyTool.update.mockResolvedValue(tool);
});

test('edits a word in place and omits unchanged parent fields', async () => {
  const result = await updateSingleTool('admin', { id: 7, label: tool.label,
    studyToolWords: [{ ...word, adminExplanation: 'After' }] });
  expect(result.status).toBe(200);
  expect(prisma.chapterStudyTool.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 7n },
    data: { studyToolWords: { update: [{ where: { id: 88n }, data: { adminExplanation: 'After' } }] } },
  }));
});

test('leaves omitted words alone and deletes only explicitly removed words', async () => {
  await updateSingleTool('admin', { id: 7, label: tool.label });
  expect(prisma.chapterStudyTool.update).not.toHaveBeenCalled();
  await updateSingleTool('admin', { id: 7, studyToolWords: [] });
  expect(prisma.chapterStudyTool.update).toHaveBeenCalledWith(expect.objectContaining({
    data: { studyToolWords: { deleteMany: { id: { in: [88n] } } } },
  }));
});
