jest.mock('../../utils/translator.js', () => ({
  normalizeLanguage: language => language || 'en',
  translateMany: jest.fn(async (texts, language) => texts.map(text => `${language}:${text}`)),
}));
import { translateMany } from '../../utils/translator.js';
import { excerpt, localizeListPreviews, PREVIEW_FIELDS } from './listPreview.js';

beforeEach(() => jest.clearAllMocks());

test.each(Object.keys(PREVIEW_FIELDS))('%s translates only bounded visible fields, never full hidden content', async kind => {
  const row = {
    id: 1, bookName: 'Psalms', chapter: 46, verseNumber: 10,
    title: 'Visible title', label: 'Visible label',
    question: 'Visible question',
    explanation: 'Visible explanation. '.repeat(100),
    content: 'Visible content. '.repeat(100),
    teachingBody: 'Visible teaching. '.repeat(100),
    summary: 'Visible summary. '.repeat(100),
    description: 'Visible description. '.repeat(100),
    keyTheme: 'Visible theme', learnMore: 'Visible learning. '.repeat(100),
    prayer: 'HIDDEN prayer', backgroundContext: 'HIDDEN background',
    studyToolWords: [{ adminExplanation: 'HIDDEN linked explanation' }],
  };
  const original = structuredClone(row);
  const [result] = await localizeListPreviews([row], 'es', kind);
  expect(row).toEqual(original);
  expect(result).toMatchObject(original);
  expect(result.preview.contentLanguage).toBe('es');
  expect(result.preview.reference).toBe('Salmos 46:10');
  const texts = translateMany.mock.calls[0][0];
  expect(texts).toEqual(Object.entries(PREVIEW_FIELDS[kind]).map(([key, limit]) => excerpt(row[key], limit)));
  expect(texts.join(' ')).not.toContain('HIDDEN');
  for (const [key, limit] of Object.entries(PREVIEW_FIELDS[kind])) {
    expect(Array.from(result.preview[key]).length).toBeLessThanOrEqual(limit + 1);
  }
});

test('English gets bounded previews without any translation requests', async () => {
  const [result] = await localizeListPreviews([{ content: 'A word '.repeat(200) }], 'en', 'devotion');
  expect(result.preview.content.length).toBeLessThanOrEqual(241);
  expect(translateMany).not.toHaveBeenCalled();
});

test('translation failure is not disguised as a successful English preview', async () => {
  translateMany.mockRejectedValueOnce(new Error('Provider down'));
  await expect(localizeListPreviews([{ explanation: 'Be still' }], 'es', 'verse')).rejects.toThrow('Provider down');
});

test('excerpts preserve Unicode characters and short text', () => {
  expect(excerpt('Short text', 80)).toBe('Short text');
  expect(excerpt('😀'.repeat(100), 80)).toBe('😀'.repeat(80) + '…');
});
