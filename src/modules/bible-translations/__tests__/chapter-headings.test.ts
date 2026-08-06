import { getChapterHeadings, getBookHeadings } from '../service.js';

/** Asserts a 200 response and returns its `data` payload (type-safe). */
function expectData<T>(res: { status: number; data?: T }): T {
  expect(res.status).toBe(200);
  if (!res.data) {
    throw new Error('expected response data');
  }
  return res.data;
}

describe('chapter-headings service', () => {
  describe('getBookHeadings', () => {
    it('returns every chapter for a valid book', async () => {
      const res = await getBookHeadings({ bookName: 'Genesis' });
      const data = expectData(res);

      expect(data.bookName).toBe('Genesis');
      expect(Object.keys(data.chapters)).toHaveLength(50);

      // Genesis 2 carries the known BSB section headings
      expect(data.chapters['2']).toEqual([
        { verse: 1, heading: 'The Seventh Day' },
        { verse: 4, heading: 'Man and Woman in the Garden' },
      ]);
    });

    it('returns empty chapters for an unknown book', async () => {
      const res = await getBookHeadings({ bookName: 'NotABook' });
      const data = expectData(res);

      expect(data.chapters).toEqual({});
    });

    it('returns 400 when bookName is missing', async () => {
      const res = await getBookHeadings({});
      expect(res.status).toBe(400);
    });
  });

  describe('getChapterHeadings', () => {
    it('returns headings for a valid chapter', async () => {
      const res = await getChapterHeadings({ bookName: 'Genesis', chapter: 2 });
      const data = expectData(res);

      expect(data.chapter).toBe(2);
      expect(data.headings).toEqual([
        { verse: 1, heading: 'The Seventh Day' },
        { verse: 4, heading: 'Man and Woman in the Garden' },
      ]);
    });

    it('returns empty headings for an unknown book', async () => {
      const res = await getChapterHeadings({ bookName: 'Nope', chapter: 1 });
      const data = expectData(res);

      expect(data.headings).toEqual([]);
    });

    it('returns 400 when chapter is missing', async () => {
      const res = await getChapterHeadings({ bookName: 'Genesis' });
      expect(res.status).toBe(400);
    });
  });
});
