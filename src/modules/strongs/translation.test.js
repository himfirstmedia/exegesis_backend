import { translateMany } from '../../utils/translator.js';
import { getVerseUniqueWordsSchema, searchStrongsSchema } from './validation.js';
import { translateBibleTopics, translateStrongsData } from './translation.js';

jest.mock('../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang, fallback = 'en') => (
    typeof lang === 'string' && /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(lang.trim())
      ? lang.trim()
      : fallback
  )),
  translateMany: jest.fn(),
}));

describe('Strongs display translation', () => {
  beforeEach(() => {
    translateMany.mockReset().mockImplementation(async (texts) => texts.map((text) => `ES:${text}`));
  });

  test('translates only approved prose while preserving lexical, verse, and pagination metadata', async () => {
    const source = {
      data: [{
        id: 17,
        strongsId: 'G3056',
        originalWord: 'logos',
        transliteration: 'logos',
        pronunciation: 'log-os',
        shortDefinition: 'a word',
        fullDefinition: 'a spoken message',
        adminExplanation: 'Dictionary explanation',
        morphology: 'N-NSM',
        grammaticalCase: 'nominative',
        grammar: 'noun singular',
        language: 'greek',
        partOfSpeech: 'noun',
        references: ['John 1:1'],
        crossReferences: ['G4487'],
        surfaceText: 'Word',
        lemma: 'logos',
        text: 'In the beginning was the Word',
        verseStudyNote: 'Verse note',
        verseReferences: [{
          id: 44,
          reference: 'John 1:1',
          surfaceText: 'Word',
          text: 'In the beginning was the Word',
          adminExplanation: 'Reference explanation',
        }],
      }],
      total: 9,
      hasNext: true,
      page: 2,
    };

    const result = await translateStrongsData(source, 'es');

    expect(translateMany).toHaveBeenCalledWith([
      'a word',
      'a spoken message',
      'Dictionary explanation',
      'Verse note',
      'Reference explanation',
    ], 'es');
    expect(result.data[0]).toEqual(expect.objectContaining({
      id: 17,
      strongsId: 'G3056',
      originalWord: 'logos',
      transliteration: 'logos',
      pronunciation: 'log-os',
      shortDefinition: 'ES:a word',
      fullDefinition: 'ES:a spoken message',
      adminExplanation: 'ES:Dictionary explanation',
      morphology: 'N-NSM',
      grammaticalCase: 'nominative',
      grammar: 'noun singular',
      language: 'greek',
      partOfSpeech: 'noun',
      references: ['John 1:1'],
      crossReferences: ['G4487'],
      surfaceText: 'Word',
      lemma: 'logos',
      text: 'In the beginning was the Word',
      verseStudyNote: 'ES:Verse note',
    }));
    expect(result.data[0].verseReferences[0]).toEqual({
      id: 44,
      reference: 'John 1:1',
      surfaceText: 'Word',
      text: 'In the beginning was the Word',
      adminExplanation: 'ES:Reference explanation',
    });
    expect(result).toEqual(expect.objectContaining({ total: 9, hasNext: true, page: 2 }));
    expect(source.data[0].shortDefinition).toBe('a word');
  });

  test('translates BibleTopic display fields without changing IDs, references, or verse text', async () => {
    const source = {
      data: [{
        id: 3,
        topicName: 'Grace',
        description: 'God gives favor',
        verseRefs: [{
          reference: 'Ephesians 2:8',
          text: 'For by grace you have been saved',
          description: 'Verse metadata must remain source text',
        }],
      }],
      total: 1,
    };

    const result = await translateBibleTopics(source, 'es');

    expect(result).toEqual({
      data: [{
        id: 3,
        topicName: 'ES:Grace',
        description: 'ES:God gives favor',
        verseRefs: [{
          reference: 'Ephesians 2:8',
          text: 'For by grace you have been saved',
          description: 'Verse metadata must remain source text',
        }],
      }],
      total: 1,
    });
  });

  test('normalizes an invalid language to English and leaves the complete object unchanged', async () => {
    const source = { strongsId: 'H1', shortDefinition: 'beginning', total: 1 };

    await expect(translateStrongsData(source, 'not a language')).resolves.toBe(source);
    expect(translateMany).not.toHaveBeenCalled();
  });

  test('keeps lang through GET query and POST body schema parsing', () => {
    expect(searchStrongsSchema.parse({ q: 'word', lang: 'es' }).lang).toBe('es');
    expect(getVerseUniqueWordsSchema.parse({ bookName: 'John', lang: 'invalid value' }).lang)
      .toBe('invalid value');
  });

  test('fails soft when translation is unavailable', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const source = { strongsId: 'G1', shortDefinition: 'first' };
    translateMany.mockRejectedValueOnce(new Error('offline'));

    await expect(translateStrongsData(source, 'es')).resolves.toBe(source);
    expect(warning).toHaveBeenCalledWith('[strongs] Translation to es failed:', 'offline');
    warning.mockRestore();
  });
});
