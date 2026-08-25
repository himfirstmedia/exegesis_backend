import { translateMany } from '../../utils/translator.js';
import { translateResourceData } from './service.js';

jest.mock('../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang) => typeof lang === 'string' ? lang : 'en'),
  translateMany: jest.fn(),
  translateResult: jest.fn(async result => result),
}));

describe('verse resource translation', () => {
  beforeEach(() => {
    translateMany.mockReset().mockImplementation(async texts =>
      texts.map(text => `ES:${text}`),
    );
  });

  test('translates authored fields and preserves references and lexical metadata', async () => {
    const resource = {
      bookName: 'John',
      commentaries: [{ author: 'Author', title: 'Title', text: 'Commentary' }],
      crossReferences: [{ ref: 'Romans 5:8', text: 'Related explanation' }],
      wordStudies: [{ word: 'logos', strongs: 'G3056', meaning: 'word or message' }],
      dictionaryTerms: [{ term: 'Grace', definition: 'favor', description: 'God gives favor' }],
      interlinearWords: [{ original: 'logos', transliteration: 'logos', translation: 'word' }],
      relatedTopics: ['Faith', { name: 'Grace' }],
      studyTools: [{
        toolType: 'COMMAND',
        label: 'A command',
        description: 'What to do',
        verseRefs: [{ verse: 1, excerpt: 'Scripture text' }],
        studyToolWords: [{
          strongsId: 'G3056',
          surfaceText: 'Word',
          adminExplanation: 'Study explanation',
          strongs: {
            originalWord: 'logos',
            shortDefinition: 'a word',
            fullDefinition: 'a spoken message',
            adminExplanation: 'Dictionary explanation',
          },
        }],
      }],
    };

    const result = await translateResourceData(resource, 'es');

    expect(result.commentaries[0]).toEqual({
      author: 'Author', title: 'ES:Title', text: 'ES:Commentary',
    });
    expect(result.crossReferences[0].ref).toBe('Romans 5:8');
    expect(result.wordStudies[0].word).toBe('logos');
    expect(result.wordStudies[0].strongs).toBe('G3056');
    expect(result.interlinearWords[0].original).toBe('logos');
    expect(result.interlinearWords[0].translation).toBe('ES:word');
    expect(result.studyTools[0].toolType).toBe('COMMAND');
    expect(result.studyTools[0].verseRefs[0].excerpt).toBe('Scripture text');
    expect(result.studyTools[0].studyToolWords[0].surfaceText).toBe('Word');
    expect(result.studyTools[0].studyToolWords[0].strongs.shortDefinition)
      .toBe('ES:a word');
  });

  test('does not translate named Bible comparison data through this helper', async () => {
    const resource = { commentaries: [], relatedTopics: [] };
    await translateResourceData(resource, 'en');
    expect(translateMany).not.toHaveBeenCalled();
  });
});
