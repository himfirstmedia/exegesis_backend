import { prisma } from '../../config/db.js';
import { translateMany } from '../../utils/translator.js';
import { getAllBookPrologues, getBookPrologue, upsertBookPrologue, deleteBookPrologue } from './service.js';
import { requestOverviewPackPublication } from './pack-worker.js';
jest.mock('./pack-worker.js', () => ({ requestOverviewPackPublication: jest.fn() }));

jest.mock('../../config/db.js', () => ({
  prisma: {
    bookPrologue: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang) => typeof lang === 'string' ? lang : 'en'),
  translateMany: jest.fn(),
}));

const makePrologue = (overrides = {}) => ({
  bookName: 'Genesis',
  sortOrder: 1,
  author: 'Moses',
  authorDetail: 'Traditional author detail',
  audience: 'Israel',
  dateWritten: 'During the wilderness period',
  locationWritten: 'The wilderness',
  purpose: 'Reveal beginnings',
  keyTheme: 'Creation and covenant',
  summary: 'God creates and calls Abraham.',
  background: 'The first book of the Pentateuch.',
  lessons: 'Trust God.',
  chapters: 50,
  structure: [
    { range: '1-11', title: 'Early history', note: 'preserve this' },
    { range: '12-50', title: 'The patriarchs' },
  ],
  applications: ['Trust God', 'Walk by faith'],
  keyScripture: [{ reference: 'Genesis 1:1', text: 'In the beginning God created.' }],
  mainThemes: ['Creation', 'Covenant'],
  keyPeople: ['Adam and Eve', 'Abraham and Sarah'],
  keyVerses: ['Genesis 1:1 - In the beginning'],
  christConnection: 'The promised seed points to Christ.',
  createdBy: 'admin-1',
  createdOn: new Date('2026-01-01T00:00:00.000Z'),
  updatedBy: 'admin-2',
  updatedOn: new Date('2026-02-01T00:00:00.000Z'),
  ...overrides,
});

test('successful admin additions/edits and deletions wake the overview publisher', async () => {
  jest.clearAllMocks();
  prisma.bookPrologue.findUnique.mockResolvedValue(null);
  prisma.bookPrologue.upsert.mockResolvedValue(makePrologue());
  await upsertBookPrologue('admin-id', { bookName: 'Genesis', summary: 'New source' });
  expect(requestOverviewPackPublication).toHaveBeenCalledTimes(1);
  prisma.bookPrologue.findUnique.mockResolvedValue(makePrologue());
  prisma.bookPrologue.delete.mockResolvedValue(makePrologue());
  await deleteBookPrologue({ bookName: 'Genesis' });
  expect(requestOverviewPackPublication).toHaveBeenCalledTimes(2);
});

describe('prologue titles and canonical book names', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.bookPrologue.findUnique.mockResolvedValue(null);
  });

  test('creates a title and returns it when the prologue is reloaded', async () => {
    const source = makePrologue({ title: 'Beginnings and Covenant' });
    prisma.bookPrologue.upsert.mockResolvedValue(source);
    const saved = await upsertBookPrologue('editor', { bookName: 'Genesis', title: '  Beginnings and Covenant  ', summary: 'Overview' });
    expect(prisma.bookPrologue.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ bookName: 'Genesis', title: 'Beginnings and Covenant' }),
      update: expect.objectContaining({ title: 'Beginnings and Covenant' }),
    }));
    expect(saved.data.title).toBe('Beginnings and Covenant');
    prisma.bookPrologue.findUnique.mockResolvedValue(source);
    expect((await getBookPrologue({ bookName: 'Genesis' })).data.title).toBe('Beginnings and Covenant');
  });

  test('updates a title and includes it in the admin list', async () => {
    const source = makePrologue({ title: 'A New Title' });
    prisma.bookPrologue.findUnique.mockResolvedValue(makePrologue({ title: 'Old title' }));
    prisma.bookPrologue.update.mockResolvedValue(source);
    await upsertBookPrologue('editor', { bookName: 'Genesis', title: 'A New Title' });
    expect(prisma.bookPrologue.update).toHaveBeenCalledWith({
      where: { bookName: 'Genesis' }, data: { title: 'A New Title', updatedBy: 'editor' },
    });
    prisma.bookPrologue.findMany.mockResolvedValue([source]);
    prisma.bookPrologue.count.mockResolvedValue(1);
    expect((await getAllBookPrologues({})).data.data[0].title).toBe('A New Title');
  });

  test('does not clear a saved title when an older client omits it', async () => {
    const current = makePrologue({ title: 'Existing' });
    prisma.bookPrologue.findUnique.mockResolvedValue(current);
    prisma.bookPrologue.update.mockResolvedValue({ ...current, summary: 'Updated summary' });
    await upsertBookPrologue('editor', { bookName: 'Genesis', author: current.author, summary: 'Updated summary' });
    expect(prisma.bookPrologue.update).toHaveBeenCalledWith({
      where: { bookName: 'Genesis' }, data: { summary: 'Updated summary', updatedBy: 'editor' },
    });
  });

  test('does not write or republish a no-op save', async () => {
    const current = makePrologue();
    prisma.bookPrologue.findUnique.mockResolvedValue(current);
    await upsertBookPrologue('editor', { bookName: 'Genesis', summary: current.summary, structure: current.structure.map(row => ({ ...row })) });
    expect(prisma.bookPrologue.update).not.toHaveBeenCalled();
    expect(requestOverviewPackPublication).not.toHaveBeenCalled();
  });

  test('rejects invalid names and invalid titles without writing', async () => {
    for (const body of [{ bookName: 'genisis', title: 'Title' }, { bookName: 'Genesis', title: ' ' }, { bookName: 'Genesis', title: 123 }, { bookName: 'Genesis', title: 'x'.repeat(301) }]) {
      expect((await upsertBookPrologue('editor', body)).status).toBe(400);
    }
    expect(prisma.bookPrologue.upsert).not.toHaveBeenCalled();
  });
});

describe('book prologue translation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    translateMany.mockImplementation(async (texts, lang) => texts.map(text => `${lang}:${text}`));
  });

  test('get translates only approved prose fields and preserves metadata', async () => {
    const source = makePrologue();
    prisma.bookPrologue.findUnique.mockResolvedValue(source);

    const result = await getBookPrologue({ bookName: 'Genesis', lang: 'es' });

    expect(result.data).toMatchObject({
      bookName: 'Genesis',
      author: 'Moses',
      authorDetail: 'es:Traditional author detail',
      audience: 'es:Israel',
      dateWritten: 'es:During the wilderness period',
      locationWritten: 'es:The wilderness',
      purpose: 'es:Reveal beginnings',
      keyTheme: 'es:Creation and covenant',
      summary: 'es:God creates and calls Abraham.',
      background: 'es:The first book of the Pentateuch.',
      lessons: 'es:Trust God.',
      chapters: 50,
      christConnection: 'es:The promised seed points to Christ.',
      createdBy: 'admin-1',
      updatedBy: 'admin-2',
    });
    expect(result.data.structure).toEqual([
      { range: '1-11', title: 'es:Early history', note: 'preserve this' },
      { range: '12-50', title: 'es:The patriarchs' },
    ]);
    expect(result.data.applications).toEqual(['es:Trust God', 'es:Walk by faith']);
    expect(result.data.mainThemes).toEqual(['es:Creation', 'es:Covenant']);
    expect(result.data.keyPeople).toEqual(source.keyPeople);
    expect(result.data.keyScripture).toEqual(source.keyScripture);
    expect(result.data.keyVerses).toEqual(source.keyVerses);
    expect(result.data.createdOn).toBe(source.createdOn.toISOString());
    expect(result.data.updatedOn).toBe(source.updatedOn.toISOString());
    expect(source.structure[0].title).toBe('Early history');
    expect(translateMany).toHaveBeenCalledTimes(1);
    expect(translateMany.mock.calls[0][0]).not.toEqual(expect.arrayContaining([
      'Genesis',
      'Moses',
      '1-11',
      'Adam and Eve',
      'Genesis 1:1',
      'In the beginning God created.',
      'Genesis 1:1 - In the beginning',
      'admin-1',
    ]));
  });

  test('get defaults to English without invoking the translator', async () => {
    const source = makePrologue();
    prisma.bookPrologue.findUnique.mockResolvedValue(source);

    const result = await getBookPrologue({ bookName: 'Genesis' });

    expect(result.data).toEqual({
      ...source,
      createdOn: source.createdOn.toISOString(),
      updatedOn: source.updatedOn.toISOString(),
    });
    expect(translateMany).not.toHaveBeenCalled();
  });

  test('returns source content when translation exceeds its response budget', async () => {
    jest.useFakeTimers();
    process.env.BOOK_PROLOGUE_TRANSLATION_TIMEOUT_MS = '10';
    const source = makePrologue();
    prisma.bookPrologue.findUnique.mockResolvedValue(source);
    translateMany.mockImplementation(() => new Promise(() => {}));

    try {
      const request = getBookPrologue({ bookName: 'Genesis', lang: 'ta' });
      await jest.advanceTimersByTimeAsync(10);
      const result = await request;

      expect(result.status).toBe(200);
      expect(result.data.summary).toBe(source.summary);
      expect(result.data.structure).toEqual(source.structure);
    } finally {
      delete process.env.BOOK_PROLOGUE_TRANSLATION_TIMEOUT_MS;
      jest.useRealTimers();
    }
  });

  test('get-all preserves list ordering, cardinality, and pagination metadata', async () => {
    const first = makePrologue();
    const second = makePrologue({ bookName: 'Exodus', sortOrder: 2, author: 'Moses', summary: 'God delivers Israel.' });
    prisma.bookPrologue.findMany.mockResolvedValue([first, second]);
    prisma.bookPrologue.count.mockResolvedValue(3);

    const result = await getAllBookPrologues({ page: 0, pageSize: 2, lang: 'fr' });

    expect(result.data).toMatchObject({ total: 3, hasNext: true });
    expect(result.data.data).toHaveLength(2);
    expect(result.data.data.map(item => item.bookName)).toEqual(['Genesis', 'Exodus']);
    expect(result.data.data.map(item => item.summary)).toEqual([
      'fr:God creates and calls Abraham.',
      'fr:God delivers Israel.',
    ]);
    expect(result.data.data.map(item => item.author)).toEqual(['Moses', 'Moses']);
    expect(translateMany).toHaveBeenCalledTimes(2);
  });

  test('get-all attaches canonical source for admin edit flows only when opted in', async () => {
    const first = makePrologue();
    prisma.bookPrologue.findMany.mockResolvedValue([first]);
    prisma.bookPrologue.count.mockResolvedValue(1);

    const result = await getAllBookPrologues({
      page: 0,
      pageSize: 4,
      lang: 'fr',
      includeSource: true,
    });

    expect(result.data.data[0].summary).toBe('fr:God creates and calls Abraham.');
    expect(result.data.data[0].source).toMatchObject({
      bookName: 'Genesis',
      summary: 'God creates and calls Abraham.',
    });
  });

  test('keeps non-string array entries and their positions unchanged', async () => {
    const source = makePrologue({
      structure: [{ range: '1', title: 'Opening' }, null, 'legacy'],
      applications: ['Apply this', null, { text: 'legacy' }],
      mainThemes: ['Grace', 7, null],
    });
    prisma.bookPrologue.findUnique.mockResolvedValue(source);

    const result = await getBookPrologue({ bookName: 'Genesis', lang: 'de' });

    expect(result.data.structure).toEqual([{ range: '1', title: 'de:Opening' }, null, 'legacy']);
    expect(result.data.applications).toEqual(['de:Apply this', null, { text: 'legacy' }]);
    expect(result.data.mainThemes).toEqual(['de:Grace', 7, null]);
  });

  test('translates long prose as individual paragraphs and preserves spacing', async () => {
    const source = makePrologue({
      summary: 'Opening paragraph.\n\nSecond paragraph.\n\nClosing paragraph.',
    });
    prisma.bookPrologue.findUnique.mockResolvedValue(source);

    const result = await getBookPrologue({ bookName: 'Genesis', lang: 'fr' });

    expect(translateMany.mock.calls[0][0].slice(0, 3)).toEqual(['Opening paragraph.', 'Second paragraph.', 'Closing paragraph.']);
    expect(result.data.summary).toBe('fr:Opening paragraph.\n\nfr:Second paragraph.\n\nfr:Closing paragraph.');
  });
});
