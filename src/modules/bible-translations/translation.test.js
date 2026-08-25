import { normalizeLanguage, translateMany } from '../../utils/translator.js';
import {
  translateBookHeadings,
  translateChapterHeadings,
} from './translation.js';

jest.mock('../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang, fallback = 'en') => (
    typeof lang === 'string' && /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(lang.trim())
      ? lang.trim()
      : fallback
  )),
  translateMany: jest.fn(),
}));

describe('Bible heading translation', () => {
  beforeEach(() => {
    normalizeLanguage.mockClear();
    translateMany.mockReset().mockImplementation(async (headings, lang) => (
      headings.map((heading) => `${lang}:${heading}`)
    ));
  });

  test('translates only chapter heading strings and preserves all other fields', async () => {
    const data = {
      bookName: 'Genesis',
      chapter: 2,
      translationId: 'Berean',
      translationName: 'Berean Standard Bible',
      headings: [
        { verse: 1, heading: 'The Seventh Day', reference: 'Genesis 2:1' },
        { verse: 4, heading: 'Man and Woman', text: 'Scripture remains unchanged' },
      ],
    };

    const result = await translateChapterHeadings(data, 'fr');

    expect(translateMany).toHaveBeenCalledWith(
      ['The Seventh Day', 'Man and Woman'],
      'fr',
    );
    expect(result).toEqual({
      ...data,
      headings: [
        { verse: 1, heading: 'fr:The Seventh Day', reference: 'Genesis 2:1' },
        { verse: 4, heading: 'fr:Man and Woman', text: 'Scripture remains unchanged' },
      ],
    });
    expect(data.headings[0].heading).toBe('The Seventh Day');
  });

  test('batches book headings in chapter and heading order without translating keys or metadata', async () => {
    const data = {
      bookName: 'Genesis',
      translationId: 'KJV',
      chapters: {
        1: [{ verse: 1, heading: 'The Creation', reference: 'Genesis 1:1' }],
        2: [
          { verse: 1, heading: 'The Seventh Day' },
          { verse: 4, heading: 'Man and Woman', text: 'Original Scripture' },
        ],
      },
    };

    const result = await translateBookHeadings(data, 'es');

    expect(translateMany).toHaveBeenCalledWith(
      ['The Creation', 'The Seventh Day', 'Man and Woman'],
      'es',
    );
    expect(Object.keys(result.chapters)).toEqual(['1', '2']);
    expect(result).toEqual({
      ...data,
      chapters: {
        1: [{ verse: 1, heading: 'es:The Creation', reference: 'Genesis 1:1' }],
        2: [
          { verse: 1, heading: 'es:The Seventh Day' },
          { verse: 4, heading: 'es:Man and Woman', text: 'Original Scripture' },
        ],
      },
    });
  });

  test('defaults to English and leaves heading payloads unchanged', async () => {
    const chapter = { bookName: 'John', chapter: 3, headings: [{ verse: 1, heading: 'Heading' }] };
    const book = { bookName: 'John', chapters: { 3: chapter.headings } };

    await expect(translateChapterHeadings(chapter)).resolves.toBe(chapter);
    await expect(translateBookHeadings(book)).resolves.toBe(book);
    expect(normalizeLanguage).toHaveBeenCalledWith('en');
    expect(translateMany).not.toHaveBeenCalled();
  });

  test('normalizes invalid languages and preserves the original payload on provider failure', async () => {
    const data = { bookName: 'John', chapter: 3, headings: [{ verse: 1, heading: 'Heading' }] };

    await expect(translateChapterHeadings(data, '../../fr')).resolves.toBe(data);
    expect(translateMany).not.toHaveBeenCalled();

    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    translateMany.mockRejectedValueOnce(new Error('offline'));
    await expect(translateChapterHeadings(data, 'fr')).resolves.toBe(data);
    expect(warning).toHaveBeenCalledWith(
      '[bible-translations] Heading translation to fr failed:',
      'offline',
    );
    warning.mockRestore();
  });
});
