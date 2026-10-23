jest.mock('../../services/cacheService.js', () => ({ cache: { get: jest.fn(), set: jest.fn() } }));
jest.mock('../text-to-text-translation/service.js', () => ({ translateText: jest.fn() }));
import { cache } from '../../services/cacheService.js';
import { translateText } from '../text-to-text-translation/service.js';
import { translateSearchPage } from './searchTranslation.js';
import { AppError } from '../../utils/AppError.js';
import { errorHandler } from '../../middlewares/errorHandler.middleware.js';

beforeEach(() => {
  jest.resetAllMocks();
  cache.get.mockResolvedValue(null);
  cache.set.mockResolvedValue(true);
  translateText.mockImplementation(async ({ q, target }) => ({ translatedText: `HI:${q}`, target }));
});

it('returns complete translated search entries including grammar, glosses and nested prose', async () => {
  const entries = [{ strongsId: 'H1', usageCount: 12n, originalWord: 'יָדָה', language: 'Hebrew',
    shortDefinition: 'thanks', fullDefinition: 'Give thanks in Psalm 105.', partOfSpeech: 'noun',
    grammaticalCase: 'nominative', gender: 'masculine', number: 'singular',
    crossReferences: 'Psalms 1:3', contextualStudies: [{ surfaceText: 'Give Thanks — יָדָה',
      customDefinition: 'A study.', themes: ['Praise'], reference: { bookName: 'Psalms', chapter: 1 },
      crossReferences: [{ ref: 'John 1:1', text: 'A related passage.' }] }],
  }];
  const [entry] = await translateSearchPage(entries, 'hi');
  expect(entry).toMatchObject({ contentLanguage: 'hi', strongsId: 'H1', usageCount: 12, originalWord: 'יָדָה',
    shortDefinition: 'HI:thanks', fullDefinition: 'HI:Give thanks in भजन संहिता 105.',
    partOfSpeech: 'HI:noun', grammaticalCase: 'HI:nominative', gender: 'HI:masculine', number: 'HI:singular',
    crossReferences: 'Psalms 1:3',
  });
  expect(entry.contextualStudies[0]).toMatchObject({ surfaceTextGloss: 'HI:Give Thanks',
    surfaceTextOriginal: 'יָדָה', themes: ['HI:Praise'], customDefinition: 'HI:A study.',
    reference: { bookName: 'Psalms', chapter: 1 },
    crossReferences: [{ ref: 'John 1:1', text: 'HI:A related passage.' }],
  });
});

it('rejects the entire page instead of returning English or partial translations', async () => {
  translateText.mockRejectedValue(new Error('provider offline'));
  await expect(translateSearchPage([{ shortDefinition: 'Give thanks.' }], 'hi'))
    .rejects.toMatchObject({ status: 503 });
  expect(cache.set).not.toHaveBeenCalled();
});

it('rejects an unchanged English prose fallback', async () => {
  translateText.mockImplementation(async ({ q, target }) => ({ translatedText: q, target }));
  await expect(translateSearchPage([{ fullDefinition: 'Give thanks in Psalm 105.' }], 'hi'))
    .rejects.toMatchObject({ status: 503 });
});

it.each([
  ['es', 'number', 'plural'], ['es', 'number', 'singular'],
  ['pt', 'number', 'plural'], ['fr', 'gender', 'masculine'],
  ['ro', 'partOfSpeech', 'verb'], ['de', 'number', 'plural'],
])('accepts a legitimate %s grammar cognate (%s=%s) without rejecting the page', async (language, key, value) => {
  translateText.mockImplementation(async ({ q, target }) => ({
    translatedText: q === value ? value : `Translated:${q}`, target,
  }));
  const [entry] = await translateSearchPage([{ strongsId: 'H1', shortDefinition: 'God', [key]: value }], language);
  expect(entry).toMatchObject({ [key]: value, contentLanguage: language, shortDefinition: 'Translated:God' });
  expect(cache.set).toHaveBeenCalled();
});

it.each([['hi', 'number', 'plural'], ['es', 'fullDefinition', 'plural'], ['es', 'gender', 'masculine']])(
  'does not extend grammar exceptions to untranslated %s %s', async (language, key, value) => {
    translateText.mockImplementation(async ({ q, target }) => ({ translatedText: q, target }));
    await expect(translateSearchPage([{ [key]: value }], language)).rejects.toMatchObject({
      status: 503, details: { reason: 'UNCHANGED_SOURCE', key },
    });
    expect(cache.set).not.toHaveBeenCalled();
  },
);

it('returns a handled HTTP 503 with safe diagnostics when the provider is unavailable', async () => {
  translateText.mockRejectedValue(new Error('upstream private message'));
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  let failure;
  try { await translateSearchPage([{ fullDefinition: 'Give thanks.' }], 'hi'); }
  catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(AppError);
  errorHandler(failure, {}, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(503);
  expect(JSON.stringify(res.json.mock.calls)).toContain('PROVIDER_ERROR');
  expect(JSON.stringify(res.json.mock.calls)).not.toMatch(/upstream private message|Give thanks/);
});

it('recovers an echoed Browse label through a strict translated retry', async () => {
  translateText.mockImplementation(async ({ q, target, requireChanged }) => ({
    translatedText: requireChanged ? 'adverbio' : q, target,
  }));
  const [entry] = await translateSearchPage([{ partOfSpeech: 'adverb' }], 'es');
  expect(entry.partOfSpeech).toBe('adverbio');
  expect(translateText).toHaveBeenLastCalledWith(expect.objectContaining({ requireChanged: true, q: 'adverb' }));
});
