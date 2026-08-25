import { translateMany } from '../../utils/translator.js';
import { translateStudyTools } from './translation.js';

jest.mock('../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang) => typeof lang === 'string' ? lang : 'en'),
  translateMany: jest.fn(),
}));

describe('study tool translation', () => {
  beforeEach(() => {
    translateMany.mockReset();
    translateMany.mockImplementation(async (texts) => texts.map((text) => `AR:${text}`));
  });

  test('translates only approved prose fields in response order', async () => {
    const tools = [{
      id: '10',
      toolType: 'COMMAND',
      bookName: 'John',
      chapter: '3',
      label: 'A command',
      description: 'Do this',
      verseRefs: [{ verse: 16, excerpt: 'For God so loved' }],
      strongsIds: ['G25'],
      order: 4,
      studyToolWords: [{
        id: '20',
        strongsId: 'G25',
        surfaceText: 'loved',
        originalWord: 'agapao',
        transliteration: 'agapao',
        adminExplanation: 'Word explanation',
        wordOrder: 2,
        strongs: {
          strongsId: 'G25',
          originalWord: 'agapao',
          transliteration: 'agapao',
          shortDefinition: 'to love',
          fullDefinition: 'to welcome and love',
          adminExplanation: 'Lexicon explanation',
          language: 'greek',
          partOfSpeech: 'verb',
        },
      }],
    }];

    const result = await translateStudyTools(tools, 'ar');

    expect(translateMany).toHaveBeenCalledWith([
      'A command',
      'Do this',
      'Word explanation',
      'to love',
      'to welcome and love',
      'Lexicon explanation',
    ], 'ar');
    expect(result[0].label).toBe('AR:A command');
    expect(result[0].description).toBe('AR:Do this');
    expect(result[0].studyToolWords[0].adminExplanation).toBe('AR:Word explanation');
    expect(result[0].studyToolWords[0].strongs.shortDefinition).toBe('AR:to love');
    expect(result[0].studyToolWords[0].strongs.fullDefinition).toBe('AR:to welcome and love');
    expect(result[0].studyToolWords[0].strongs.adminExplanation).toBe('AR:Lexicon explanation');
    expect(result[0].verseRefs).toEqual(tools[0].verseRefs);
    expect(result[0].strongsIds).toEqual(['G25']);
    expect(result[0].studyToolWords[0]).toEqual(expect.objectContaining({
      id: '20',
      strongsId: 'G25',
      surfaceText: 'loved',
      originalWord: 'agapao',
      transliteration: 'agapao',
      wordOrder: 2,
    }));
    expect(result[0].studyToolWords[0].strongs).toEqual(expect.objectContaining({
      strongsId: 'G25',
      originalWord: 'agapao',
      transliteration: 'agapao',
      language: 'greek',
      partOfSpeech: 'verb',
    }));
    expect(tools[0].label).toBe('A command');
  });

  test('defaults to English and skips translation', async () => {
    const tools = [{ label: 'Original' }];

    await expect(translateStudyTools(tools)).resolves.toBe(tools);
    expect(translateMany).not.toHaveBeenCalled();
  });

  test('keeps the complete original response when translation fails', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tools = [{ label: 'Original', studyToolWords: [{ adminExplanation: 'Original detail' }] }];
    translateMany.mockRejectedValueOnce(new Error('offline'));

    await expect(translateStudyTools(tools, 'ar')).resolves.toBe(tools);
    expect(warning).toHaveBeenCalledWith('[study-tools] Translation to ar failed:', 'offline');
    warning.mockRestore();
  });
});
