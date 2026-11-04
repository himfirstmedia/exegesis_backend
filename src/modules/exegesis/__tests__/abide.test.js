import { saveAbideStage } from '../service.js';

jest.mock('../../../config/db.js', () => {
  const prisma = {
    exegesisSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    journalEntry: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
  return { prisma };
});

const { prisma } = require('../../../config/db.js');

const session = {
  id: 'session-1',
  userId: 'user-1',
  passageRef: 'John 3:16',
  bookName: 'John',
  chapter: BigInt(3),
  verseStart: BigInt(16),
  lookNotes: 'God loved the world.',
  strongsWords: JSON.stringify([{ strongsId: 'G25', surfaceText: 'agape' }]),
  strongsIds: 'G25',
  isPublic: false,
  journalEntryId: null,
  abideReflection: null,
  abidePrayer: null,
  abideApplication: null,
  abideTags: null,
};

const savedSession = {
  ...session,
  journalEntryId: BigInt(7),
  completed: true,
  currentStage: 'completed',
};

const journalEntry = {
  id: BigInt(7),
  userId: 'user-1',
  title: 'Exegesis: John 3:16',
  content: 'Reflection',
  observations: 'God loved the world.',
};

describe('saveAbideStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.exegesisSession.findFirst.mockResolvedValue(session);
    prisma.exegesisSession.update.mockResolvedValue(savedSession);
    prisma.journalEntry.findFirst.mockResolvedValue(null);
    prisma.journalEntry.create.mockResolvedValue(journalEntry);
    prisma.journalEntry.update.mockResolvedValue(journalEntry);
  });

  test('creates one journal entry with observations and studied words', async () => {
    const result = await saveAbideStage('session-1', 'user-1', {
      reflection: 'Reflection',
      prayer: 'Prayer',
      application: 'Application',
      tags: 'faith',
      isPublic: false,
    });

    expect(prisma.journalEntry.create).toHaveBeenCalledTimes(1);
    expect(prisma.journalEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        content: 'Reflection',
        observations: 'God loved the world.',
        prayers: 'Prayer',
        application: 'Application',
        tags: 'faith',
        isPublished: false,
        source: 'exegesis-lab',
        strongsIds: 'G25',
      }),
    });
    expect(result.status).toBe(200);
    expect(result.data.journalEntryId).toBe(7);
  });

  test('updates the linked entry instead of creating a duplicate on retry', async () => {
    const linkedSession = { ...session, journalEntryId: BigInt(7) };
    prisma.exegesisSession.findFirst.mockResolvedValue(linkedSession);
    prisma.journalEntry.findFirst.mockResolvedValue(journalEntry);

    const result = await saveAbideStage('session-1', 'user-1', {
      reflection: 'Updated reflection',
      prayer: 'Updated prayer',
      application: 'Updated application',
      tags: 'faith,trust',
      isPublic: true,
    });

    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
    expect(prisma.journalEntry.update).toHaveBeenCalledTimes(1);
    expect(prisma.journalEntry.update).toHaveBeenCalledWith({
      where: { id: BigInt(7) },
      data: expect.objectContaining({
        content: 'Updated reflection',
        prayers: 'Updated prayer',
        application: 'Updated application',
        tags: 'faith,trust',
        isPublished: true,
      }),
    });
    expect(result.data.journalEntryId).toBe(7);
  });

  test('recreates the entry when the linked entry was deleted', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue({
      ...session,
      journalEntryId: BigInt(7),
    });
    prisma.journalEntry.findFirst.mockResolvedValue(null);

    await saveAbideStage('session-1', 'user-1', { reflection: 'Reflection' });

    expect(prisma.journalEntry.create).toHaveBeenCalledTimes(1);
  });
});
