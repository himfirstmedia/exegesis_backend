jest.mock('../../services/cacheService.js', () => ({ cache: { get: jest.fn(), set: jest.fn() } }));
jest.mock('../text-to-text-translation/service.js', () => ({ translateText: jest.fn() }));
import { cache } from '../../services/cacheService.js';
import { translateText } from '../text-to-text-translation/service.js';
import { translateSearchPage } from './searchTranslation.js';

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
