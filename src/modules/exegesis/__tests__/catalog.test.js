import { prisma } from '../../../config/db.js';
import { listLabStudies } from '../catalog.js';

jest.mock('../../../config/db.js', () => ({ prisma: {
  labStudy: { findMany: jest.fn() },
  readingPlan: { findMany: jest.fn() },
  exegesisSession: { findMany: jest.fn() },
} }));

test('uses actual reading-plan assignments, preserves the Lab focus, and exposes only the reader’s progress', async () => {
  const passage = { bookName: 'Romans', chapter: 5, verseStart: 1, verseEnd: 5 };
  prisma.labStudy.findMany.mockResolvedValue([{ id: 'plan', pathway: 'reading-plan', active: true, sessions: [passage] }]);
  prisma.readingPlan.findMany.mockResolvedValue([{ planId: 'plan', title: 'Existing plan title',
    dailyAssignments: [{ dayNumber: 1, chaptersJson: '[{"book":"Romans","chapter":5},{"book":"Romans","chapter":6}]' }] }]);
  prisma.exegesisSession.findMany.mockResolvedValue([{ labStudyId: 'plan', labStudyPosition: 0 }]);
  expect(await listLabStudies('reader-1')).toEqual([expect.objectContaining({
    title: 'Existing plan title', firstPassage: { ...passage, assignedReading: 'Romans 5, Romans 6' }, completedPositions: [0],
  })]);
  expect(prisma.exegesisSession.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
    userId: 'reader-1', currentStage: 'completed',
  }) }));
  prisma.readingPlan.findMany.mockResolvedValue([]);
  expect(await listLabStudies('reader-1')).toEqual([]);
});
