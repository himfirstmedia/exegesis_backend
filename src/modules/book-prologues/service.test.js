import { prisma } from '../../config/db.js';
import { translateMany } from '../../utils/translator.js';
import { getAllBookPrologues, getBookPrologue } from './service.js';

jest.mock('../../config/db.js', () => ({
  prisma: {
    bookPrologue: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
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
});
