import { listBookHeadings, listChapterHeadings } from './controller.js';
import { getBookHeadings, getChapterHeadings } from './service.js';
import { translateBookHeadings, translateChapterHeadings } from './translation.js';

jest.mock('./service.js', () => ({
  BOOK_NAMES: {},
  getBookHeadings: jest.fn(),
  getChapterHeadings: jest.fn(),
}));

jest.mock('./translation.js', () => ({
  translateBookHeadings: jest.fn(),
  translateChapterHeadings: jest.fn(),
}));

jest.mock('../../utils/translator.js', () => ({
  translateText: jest.fn(),
}));

jest.mock('../../config/db.js', () => ({
  prisma: {},
}));

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('Bible heading controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('chapter headings consume body.lang and return translated data in the existing shape', async () => {
    const source = {
      bookName: 'Genesis',
      chapter: 2,
      headings: [{ verse: 1, heading: 'The Seventh Day' }],
    };
    const translated = {
      ...source,
      headings: [{ verse: 1, heading: 'Le septieme jour' }],
    };
    getChapterHeadings.mockResolvedValue({ status: 200, data: source });
    translateChapterHeadings.mockResolvedValue(translated);
    const req = {
      params: { translationId: 'Berean' },
      body: { bookName: 'Genesis', chapter: '2', lang: 'fr' },
    };
    const res = makeResponse();

    await listChapterHeadings(req, res);

    expect(getChapterHeadings).toHaveBeenCalledWith({ bookName: 'Genesis', chapter: 2 });
    expect(translateChapterHeadings).toHaveBeenCalledWith(source, 'fr');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: translated });
  });

  test('book headings default body.lang to English', async () => {
    const source = {
      bookName: 'Genesis',
      chapters: { 1: [{ verse: 1, heading: 'The Creation' }] },
    };
    getBookHeadings.mockResolvedValue({ status: 200, data: source });
    translateBookHeadings.mockResolvedValue(source);
    const req = {
      params: { translationId: 'KJV' },
      body: { bookName: 'Genesis' },
    };
    const res = makeResponse();

    await listBookHeadings(req, res);

    expect(getBookHeadings).toHaveBeenCalledWith({ bookName: 'Genesis' });
    expect(translateBookHeadings).toHaveBeenCalledWith(source, 'en');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: source });
  });
});
