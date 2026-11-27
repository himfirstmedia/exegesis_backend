import {
  completeSession,
  getLabSetupStatus,
  saveAbideStage,
  saveApplyStage,
  saveLookStage,
  saveListenStage,
  saveLearnStage,
  saveProgress,
  saveSessionLedger,
  startSession,
} from '../service.js';

jest.mock('../../../config/db.js', () => {
  const prisma = {
    exegesisSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    journalEntry: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(callback => callback(prisma));
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
  verseEnd: BigInt(16),
  currentStage: 'abide',
  completed: false,
  applySavedOn: null,
  lookNotes: JSON.stringify({ 0: 'God loved the world.' }),
  observations: ['God gives His Son'],
  lookHighlights: [{ verse: 16, text: 'For God so loved the world' }],
  lookQuestions: ['Who receives eternal life?'],
  listenSelections: [{ abbreviation: 'BSB', language: 'en' }],
  listenNotes: 'Heard the contrast between life and perishing.',
  listenQuestions: ['Why does “whoever” matter here?'],
  learnSummary: 'God saves through belief in His Son.',
  learnNotes: 'Belief is more than knowing a fact.',
  learnQuestions: ['How does verse 16 relate to verse 17?'],
  abideSelectedVerse: 'John 3:16',
  abideTruth: 'God’s love gives life.',
  abideReflection: 'I can receive rather than earn this gift.',
  abidePrayer: 'Thank you for your Son.',
  abideApplication: 'Share this hope with a friend.',
  abideTags: 'faith,love',
  applyPrinciple: 'God’s grace calls for a faithful response.',
  applyResponse: 'I will trust Christ today.',
  applyChallenge: 'Tell one person why I have hope.',
  applyTiming: { day: 'Tuesday', time: '18:00' },
  applyReminder: { enabled: true, note: 'Pray for my friend' },
  applyResults: 'I had the conversation.',
  strongsWords: JSON.stringify([{ strongsId: 'G25', surfaceText: 'agape' }]),
  strongsIds: 'G25',
  isPublic: true,
  journalEntryId: null,
};

const journalEntry = {
  id: BigInt(7),
  userId: 'user-1',
  title: 'Exegesis: John 3:16',
  sourceSessionId: 'session-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.exegesisSession.findFirst.mockResolvedValue(session);
  prisma.exegesisSession.update.mockImplementation(({ data }) => Promise.resolve({ ...session, ...data }));
  prisma.journalEntry.findFirst.mockResolvedValue(null);
  prisma.journalEntry.update.mockResolvedValue(journalEntry);
  prisma.journalEntry.upsert.mockResolvedValue(journalEntry);
});

test('Lab setup status uses the authenticated account’s first stored session', async () => {
  expect((await getLabSetupStatus('user-1', 'user-2')).status).toBe(409);
  expect(prisma.exegesisSession.findFirst).not.toHaveBeenCalled();
  expect((await startSession('user-1', { expectedUserId: 'user-2' })).status).toBe(409);
  expect(prisma.exegesisSession.create).not.toHaveBeenCalled();

  expect((await getLabSetupStatus('user-1', 'user-1')).data).toEqual({
    userId: 'user-1', firstSessionId: 'session-1',
  });
  expect(prisma.exegesisSession.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: { userId: 'user-1' }, select: { id: true },
  }));
  prisma.exegesisSession.findFirst.mockResolvedValue(null);
  expect((await getLabSetupStatus('user-2', 'user-2')).data.firstSessionId).toBeNull();
});

describe('five-stage session saves', () => {
  test('Abide saves artifacts without completing or writing a Ledger entry', async () => {
    const result = await saveAbideStage('session-1', 'user-1', {
      selectedVerse: 'John 3:16',
      truth: 'God loves.',
      reflection: 'A new reflection',
      prayer: '',
      application: 'Act on it',
      tags: '',
      isPublic: true,
    });

    expect(result.status).toBe(200);
    expect(prisma.exegesisSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        currentStage: 'apply',
        abideSelectedVerse: 'John 3:16',
        abideTruth: 'God loves.',
        abideReflection: 'A new reflection',
        abidePrayer: '',
        abideApplication: 'Act on it',
        abideTags: '',
        isPublic: true,
      }),
    });
    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
    expect(prisma.journalEntry.upsert).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('Apply draft progress preserves fields but does not authorize completion', async () => {
    const result = await saveProgress('session-1', 'user-1', {
      principle: 'A principle',
      response: '',
      challenge: 'A challenge',
      timing: { day: 'Wednesday' },
      reminder: null,
      results: '',
      applySaved: true,
    });

    expect(result.status).toBe(200);
    const { data } = prisma.exegesisSession.update.mock.calls[0][0];
    expect(data).toMatchObject({
      applyPrinciple: 'A principle',
      applyResponse: '',
      applyChallenge: 'A challenge',
      applyTiming: { day: 'Wednesday' },
      applyResults: '',
    });
    expect(data).not.toHaveProperty('applySavedOn');
    expect(data).not.toHaveProperty('completed');
    expect(data).not.toHaveProperty('currentStage');

    const completion = await completeSession('session-1', 'user-1');
    expect(completion.status).toBe(409);
  });

  test('an empty explicit Apply save is valid and records its marker', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue({ ...session, currentStage: 'apply' });
    const result = await saveApplyStage('session-1', 'user-1', {});

    expect(result.status).toBe(200);
    expect(prisma.exegesisSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        applySavedOn: expect.any(Date),
        currentStage: 'apply',
      },
    });
  });

  test('completion follows a successful Apply save and is idempotent', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue({
      ...session,
      currentStage: 'apply',
      applySavedOn: new Date('2026-11-24T10:00:00Z'),
    });

    const result = await completeSession('session-1', 'user-1');

    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({ completed: true, currentStage: 'completed' });
    expect(prisma.exegesisSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        completed: true,
        completedOn: expect.any(Date),
        currentStage: 'completed',
      },
    });

    prisma.exegesisSession.findFirst.mockResolvedValue({ ...session, completed: true, currentStage: 'completed' });
    const repeated = await completeSession('session-1', 'user-1');
    expect(repeated.status).toBe(200);
    expect(prisma.exegesisSession.update).toHaveBeenCalledTimes(1);
  });

  test('replayed earlier stage saves cannot move the lifecycle backward', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue({ ...session, currentStage: 'apply' });

    await saveLookStage('session-1', 'user-1', { notes: 'Replayed notes' });

    expect(prisma.exegesisSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { currentStage: 'apply', lookNotes: 'Replayed notes' },
    });
  });
});

test('only the current or an earlier stage can be saved, and Listen requires all chosen readings', async () => {
  prisma.exegesisSession.findFirst.mockResolvedValue({ ...session, currentStage: 'look' });
  for (const save of [saveListenStage, saveLearnStage, saveAbideStage, saveApplyStage]) {
    expect((await save('session-1', 'user-1', { listenCompleted: true, repeats: 1, repeatCount: 1 })).status).toBe(409);
  }
  expect(prisma.exegesisSession.update).not.toHaveBeenCalled();
  expect((await saveLookStage('session-1', 'user-1', {})).data.currentStage).toBe('listen');

  prisma.exegesisSession.findFirst.mockResolvedValue({ ...session, currentStage: 'listen' });
  expect((await saveListenStage('session-1', 'user-1', { listenCompleted: true, repeats: 3, repeatCount: 2 })).status).toBe(409);
  expect((await saveListenStage('session-1', 'user-1', { listenCompleted: false, repeats: 3, repeatCount: 3 })).status).toBe(409);
  expect((await saveListenStage('session-1', 'user-1', { listenCompleted: true, repeats: 3, repeatCount: 3 })).data.currentStage).toBe('learn');
});

describe('Legacy Ledger save', () => {
  test('requires completion before creating an entry', async () => {
    const result = await saveSessionLedger('session-1', 'user-1');

    expect(result.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('aggregates every stage, stays private by default, and links one stable entry', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue({
      ...session,
      currentStage: 'completed',
      completed: true,
      applySavedOn: new Date(),
    });

    const result = await saveSessionLedger('session-1', 'user-1');

    expect(result.status).toBe(200);
    expect(prisma.journalEntry.upsert).toHaveBeenCalledWith({
      where: { sourceSessionId: 'session-1' },
      create: expect.objectContaining({
        userId: 'user-1',
        sourceSessionId: 'session-1',
        isPublished: false,
        source: 'exegesis-lab',
        strongsIds: 'G25',
      }),
      update: expect.objectContaining({ isPublished: false }),
    });
    const { create } = prisma.journalEntry.upsert.mock.calls[0][0];
    expect(create.content).toContain('John 3:16');
    expect(create.content).toContain('God’s love gives life.');
    expect(create.observations).toContain('God loved the world.');
    expect(create.observations).toContain('God gives His Son');
    expect(create.observations).toContain('For God so loved the world');
    expect(create.observations).toContain('BSB');
    expect(create.observations).toContain('contrast between life and perishing');
    expect(create.learnings).toContain('God saves through belief in His Son.');
    expect(create.learnings).toContain('How does verse 16 relate to verse 17?');
    expect(create.prayers).toBe('Thank you for your Son.');
    expect(create.application).toContain('Tell one person why I have hope.');
    expect(create.application).not.toContain('Pray for my friend');
    expect(create.application).toContain('I had the conversation.');
    expect(prisma.exegesisSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { journalEntryId: BigInt(7) },
    });
  });

  test('renders structured Lab fields as prose instead of raw JSON', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue({
      ...session,
      currentStage: 'completed',
      completed: true,
      applySavedOn: new Date(),
      lookPromptsJson: JSON.stringify(['What stands out?', 'Who is speaking?']),
      lookNotes: JSON.stringify({ 0: 'The shepherd and quiet waters.', 1: 'David speaks.' }),
      lookHighlights: [
        { bookName: 'John', chapter: 3, verse: 16, text: 'For God so loved the world' },
      ],
      listenSelections: [
        { version: 'Berean Standard Bible (BSB)', abbreviation: 'BSB' },
        { abbreviation: 'ASV' },
      ],
      applyTiming: { day: 'Tuesday', time: '18:00' },
      applyResults: { outcome: 'I had the conversation.' },
    });

    await saveSessionLedger('session-1', 'user-1');

    const { create } = prisma.journalEntry.upsert.mock.calls[0][0];
    expect(create.observations).toContain('What stands out?\nThe shepherd and quiet waters.');
    expect(create.observations).toContain('Who is speaking?\nDavid speaks.');
    expect(create.observations).toContain('“For God so loved the world” (John 3:16)');
    expect(create.observations).toContain('Berean Standard Bible (BSB)');
    expect(create.observations).toContain('ASV');
    expect(create.application).toContain('Tuesday · 18:00');
    expect(create.application).toContain('I had the conversation.');
    const rendered = [create.observations, create.learnings, create.application].join('\n');
    expect(rendered).not.toContain('{"');
    expect(rendered).not.toContain('"0":');
    expect(rendered).not.toContain('"abbreviation"');
  });

  test('updates the linked entry on retry and publishes only on explicit request', async () => {
    const completed = {
      ...session,
      currentStage: 'completed',
      completed: true,
      journalEntryId: BigInt(7),
    };
    prisma.exegesisSession.findFirst.mockResolvedValue(completed);
    prisma.journalEntry.findFirst.mockResolvedValue(journalEntry);

    await saveSessionLedger('session-1', 'user-1', { isPublic: true });

    expect(prisma.journalEntry.upsert).not.toHaveBeenCalled();
    expect(prisma.journalEntry.update).toHaveBeenCalledWith({
      where: { id: BigInt(7) },
      data: expect.objectContaining({ isPublished: true, updatedBy: 'user-1' }),
    });
  });

  test('a missing legacy link still converges through sourceSessionId', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue({
      ...session,
      currentStage: 'completed',
      completed: true,
      journalEntryId: BigInt(7),
    });
    prisma.journalEntry.findFirst.mockResolvedValue(null);

    await saveSessionLedger('session-1', 'user-1');

    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
    expect(prisma.journalEntry.upsert).toHaveBeenCalledTimes(1);
  });
});

test('Listen persists the selection, questions, notes and repeat count sent by mobile', async () => {
  await saveListenStage('session-1', 'user-1', {
    selections: [{ abbreviation: 'BSB' }], notes: '', questions: [], repeats: 3, repeatCount: 2,
    listenCompleted: false,
  });
  expect(prisma.exegesisSession.update).toHaveBeenCalledWith({
    where: { id: 'session-1' },
    data: expect.objectContaining({
      listenSelections: [{ abbreviation: 'BSB' }], listenNotes: '', listenQuestions: [],
      listenRepeats: 3, listenRepeatCount: 2, listenCompleted: false,
    }),
  });
});

test('Apply, completion and Ledger refuse sessions not owned by the caller', async () => {
  prisma.exegesisSession.findFirst.mockResolvedValue(null);
  expect((await saveApplyStage('session-1', 'other-user', {})).status).toBe(404);
  expect((await completeSession('session-1', 'other-user')).status).toBe(404);
  expect((await saveSessionLedger('session-1', 'other-user')).status).toBe(404);
  expect(prisma.exegesisSession.findFirst).toHaveBeenCalledTimes(3);
  expect(prisma.exegesisSession.findFirst).toHaveBeenCalledWith({
    where: { id: 'session-1', userId: 'other-user' },
  });
  expect(prisma.exegesisSession.update).not.toHaveBeenCalled();
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

describe('session passage matching', () => {
  test('resumes only the exact requested passage', async () => {
    prisma.exegesisSession.findFirst.mockResolvedValue(session);

    const result = await startSession('user-1', {
      bookName: ' John ',
      chapter: 3,
      verseStart: 16,
      verseEnd: 16,
    });

    expect(result.message).toBe('Continuing existing session');
    expect(prisma.exegesisSession.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        completed: false,
        bookName: 'John',
        chapter: BigInt(3),
        verseStart: BigInt(16),
        verseEnd: BigInt(16),
        labStudyId: null,
      },
      orderBy: [{ updatedOn: 'desc' }, { id: 'desc' }],
    });
    expect(prisma.exegesisSession.create).not.toHaveBeenCalled();
  });

  test('createNew does not silently resume an existing study', async () => {
    prisma.exegesisSession.create.mockResolvedValue(session);

    await startSession('user-1', {
      bookName: 'John', chapter: 3, verseStart: 16, verseEnd: 16, createNew: true,
    });

    expect(prisma.exegesisSession.findFirst).not.toHaveBeenCalled();
    expect(prisma.exegesisSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ bookName: 'John', artifactVersion: 2 }),
    });
  });

  test.each([
    { bookName: 'John', chapter: 'invalid' },
    { bookName: 'John', chapter: 0 },
    { bookName: 'John', chapter: 3, verseEnd: 16 },
    { bookName: 'John', chapter: 3, verseStart: 17, verseEnd: 16 },
  ])('rejects an invalid passage without a database write', async body => {
    const result = await startSession('user-1', body);

    expect(result.status).toBe(400);
    expect(prisma.exegesisSession.create).not.toHaveBeenCalled();
  });
});
