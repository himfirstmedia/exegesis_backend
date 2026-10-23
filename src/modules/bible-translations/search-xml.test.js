import { searchXmlText } from './service.js';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<bible translation="Test Bible">
  <testament name="Old">
    <book number="1">
      <chapter number="1">
        <verse number="1">In the beginning God created the heavens and the earth.</verse>
        <verse number="2">The earth was formless &amp; empty; darkness was over the deep.</verse>
      </chapter>
    </book>
    <book number="19">
      <chapter number="23">
        <verse number="1">The LORD is my shepherd; I shall not want.</verse>
      </chapter>
    </book>
  </testament>
  <testament name="New">
    <book number="43">
      <chapter number="3">
        <verse number="16">For God so loved the world that he gave his only Son.</verse>
      </chapter>
    </book>
  </testament>
</bible>`;

describe('searchXmlText (catalog translation fallback)', () => {
  test('finds case-insensitive matches with canonical references', () => {
    const page = searchXmlText(XML, 'god');
    expect(page.total).toBe(2);
    expect(page.data.map((row) => `${row.book_name} ${row.chapter}:${row.verse}`)).toEqual([
      'Genesis 1:1',
      'John 3:16',
    ]);
    expect(page.data[0]).toMatchObject({
      book_number: 1,
      verse_text: 'In the beginning God created the heavens and the earth.',
    });
  });

  test('decodes XML entities in the verse text', () => {
    const page = searchXmlText(XML, 'formless');
    expect(page.data[0].verse_text).toContain('formless & empty');
  });

  test('honours book, testament and pagination filters', () => {
    expect(searchXmlText(XML, 'god', { bookName: 'John' }).total).toBe(1);
    expect(searchXmlText(XML, 'god', { covenant: 'ot' }).data[0].book_number).toBe(1);
    expect(searchXmlText(XML, 'god', { covenant: 'nt' }).data[0].book_number).toBe(43);

    const page = searchXmlText(XML, 'god', { limit: 1, offset: 1 });
    expect(page.total).toBe(2);
    expect(page.data).toHaveLength(1);
    expect(page.data[0].book_number).toBe(43);
  });

  test('treats regex characters literally and rejects unsupported XML', () => {
    expect(searchXmlText(XML, 'God?').total).toBe(0);
    expect(searchXmlText('<bible><book>A</book></bible>', 'god')).toBeNull();
    expect(searchXmlText(XML, '')).toBeNull();
  });
});
