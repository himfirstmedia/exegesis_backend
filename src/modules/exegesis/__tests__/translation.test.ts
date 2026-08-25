import {
  getCurrentSession,
  getSession,
  getSessionHistory,
  startSession,
} from '../service.js';

jest.mock('../../../config/db.js', () => ({
  prisma: {
    exegesisSession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang, fallback = 'en') =>
    typeof lang === 'string' && lang.trim() ? lang.trim() : fallback),
  translateMany: jest.fn((texts: string[], lang: string) =>
    Promise.resolve(texts.map((text: string) => `[${lang}] ${text}`))),
}));

const prismaMock = require('../../../config/db.js').prisma;
const translatorMock = require('../../../utils/translator.js');

const prompts = ['What words stand out?', 'Who is speaking?'];

const makeSession = (overrides = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  passageRef: 'Ruth 2:1',
  bookName: 'Ruth',
  chapter: BigInt(2),
  verseStart: BigInt(1),
  verseEnd: null,
  currentStage: 'abide',
  completed: false,
  lookPromptsJson: JSON.stringify(prompts),
  lookNotes: JSON.stringify({ 0: 'My observation' }),
  learnNotes: 'My learning',
  abideReflection: 'My reflection',
  abidePrayer: 'My prayer',
  abideApplication: 'My application',
  abideTags: 'my-tag',
  journalEntryId: BigInt(42),
  strongsWords: JSON.stringify([{ surfaceText: 'My journal word' }]),
  strongsIds: 'H123',
  isPublic: true,
  createdOn: new Date('2026-01-01T00:00:00.000Z'),
  updatedOn: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
});

describe('field-safe exegesis translation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores canonical English prompts on start and translates only the response copy', async () => {
    prismaMock.exegesisSession.findFirst.mockResolvedValue(null);
    prismaMock.exegesisSession.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(makeSession({ ...data })));

    const result = await startSession('user-1', {
      bookName: 'Ruth',
      chapter: 2,
      verseStart: 1,
      lang: 'es',
    });

    const stored = prismaMock.exegesisSession.create.mock.calls[0][0].data;
    expect(JSON.parse(stored.lookPromptsJson)[0]).toBe(
      'What specific words or phrases stand out to you in this passage?',
    );
    expect(JSON.parse(result.data.lookPromptsJson)[0]).toBe(
      '[es] What specific words or phrases stand out to you in this passage?',
    );
    expect(JSON.parse(stored.lookPromptsJson)[0]).not.toMatch(/^\[es\]/);
    expect(result.data.passageRef).toBe('Ruth 2:1');
    expect(result.data.currentStage).toBe('look');
  });

  it('translates stored prompts while preserving all user-authored content and metadata', async () => {
    const session = makeSession();
    prismaMock.exegesisSession.findFirst.mockResolvedValue(session);

    const result = await getSession('session-1', 'user-1', 'fr');

    expect(JSON.parse(result.data.lookPromptsJson)).toEqual([
      '[fr] What words stand out?',
      '[fr] Who is speaking?',
    ]);
    expect(result.data).toEqual({
      ...makeSession(),
      chapter: 2,
      verseStart: 1,
      journalEntryId: 42,
      createdOn: '2026-01-01T00:00:00.000Z',
      updatedOn: '2026-01-02T00:00:00.000Z',
      lookPromptsJson: JSON.stringify([
        '[fr] What words stand out?',
        '[fr] Who is speaking?',
      ]),
    });
    expect(session.lookPromptsJson).toBe(JSON.stringify(prompts));
  });

  it('preserves malformed lookPromptsJson and still returns the current session', async () => {
    const session = makeSession({ lookPromptsJson: '{not-json' });
    prismaMock.exegesisSession.findFirst.mockResolvedValue(session);

    const result = await getCurrentSession('user-1', 'de');

    expect(result.status).toBe(200);
    expect(result.data.lookPromptsJson).toBe('{not-json');
    expect(result.data.lookNotes).toBe(session.lookNotes);
    expect(translatorMock.translateMany).not.toHaveBeenCalled();
  });

  it('keeps the metadata-only history response unchanged when lang is supplied', async () => {
    const historyItem = {
      id: 'session-1',
      passageRef: 'Ruth 2:1',
      bookName: 'Ruth',
      chapter: BigInt(2),
      verseStart: BigInt(1),
      verseEnd: null,
      currentStage: 'completed',
      completed: true,
      createdOn: new Date('2026-01-01T00:00:00.000Z'),
      updatedOn: new Date('2026-01-02T00:00:00.000Z'),
    };
    prismaMock.exegesisSession.findMany.mockResolvedValue([historyItem]);
    prismaMock.exegesisSession.count.mockResolvedValue(1);

    const result = await getSessionHistory('user-1', { lang: 'it' });

    expect(result.data).toEqual({
      data: [{
        ...historyItem,
        chapter: 2,
        verseStart: 1,
        createdOn: '2026-01-01T00:00:00.000Z',
        updatedOn: '2026-01-02T00:00:00.000Z',
      }],
      total: 1,
      hasNext: false,
    });
    expect(translatorMock.translateMany).not.toHaveBeenCalled();
  });

  it('fails soft without changing any field when prompt translation rejects', async () => {
    const session = makeSession();
    prismaMock.exegesisSession.findFirst.mockResolvedValue(session);
    translatorMock.translateMany.mockRejectedValueOnce(new Error('provider unavailable'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await getSession('session-1', 'user-1', 'es');

    expect(result.data).toEqual({
      ...session,
      chapter: 2,
      verseStart: 1,
      journalEntryId: 42,
      createdOn: '2026-01-01T00:00:00.000Z',
      updatedOn: '2026-01-02T00:00:00.000Z',
    });
    warn.mockRestore();
  });
});
