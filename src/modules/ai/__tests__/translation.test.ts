import { translateMany } from '../../../utils/translator.js';
import { explainSchema, generatePromptSchema } from '../validation.js';
import { translateExplainResponse, translatePromptResponse } from '../translation.js';

jest.mock('../../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang) =>
    typeof lang === 'string' && /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(lang.trim())
      ? lang.trim()
      : 'en'),
  translateMany: jest.fn(),
}));

const translateManyMock = translateMany as jest.MockedFunction<typeof translateMany>;

beforeEach(() => {
  translateManyMock.mockReset().mockImplementation(async texts =>
    (texts || []).map(text => `[es]${text}`));
});

describe('AI response translation', () => {
  it('translates only allowlisted explanation prose and preserves Scripture and metadata', async () => {
    const response = {
      ref: 'John 3:16',
      text: 'For God so loved the world.',
      intro: 'John 3:16 declares: "For God so loved the world." This is good news.',
      explanation: ['God gives generously.', { insight: 'Grace is a gift.', sourceText: 'God so loved' }],
      chapterInsights: { description: 'Love is central.', reference: 'John 3:16' },
      crossReferences: [{ ref: 'Romans 5:8', text: 'While we were still sinners.' }],
      metadata: { label: 'Do not translate me', source: 'BSB' },
      promptIdx: 2,
    };

    const result = await translateExplainResponse(response, 'es');

    expect(result.ref).toBe(response.ref);
    expect(result.text).toBe(response.text);
    expect(result.intro).toContain('John 3:16');
    expect(result.intro).toContain('"For God so loved the world."');
    expect(result.intro).toContain('[es]');
    expect(result.explanation[0]).toBe('[es]God gives generously.');
    expect(result.explanation[1]).toEqual({ insight: '[es]Grace is a gift.', sourceText: 'God so loved' });
    expect(result.crossReferences).toBe(response.crossReferences);
    expect(result.metadata).toBe(response.metadata);
    expect(result.promptIdx).toBe(2);
  });

  it('translates plain word-study prose but preserves structured lexical data', async () => {
    const plain = await translateExplainResponse({ wordStudy: 'This word emphasizes steadfast love.' }, 'es');
    const structured = '**ἀγαπάω** (agapaō) — to love; Strong G25';
    const lexical = await translateExplainResponse({ wordStudy: structured }, 'es');
    const mixed = await translateExplainResponse({
      wordStudy: ['A note about steadfast love.', { originalWord: 'חֶסֶד', transliteration: 'hesed', strongs: 'H2617' }],
    }, 'es');

    expect(plain.wordStudy).toBe('[es]This word emphasizes steadfast love.');
    expect(lexical.wordStudy).toBe(structured);
    expect(mixed.wordStudy).toEqual([
      '[es]A note about steadfast love.',
      { originalWord: 'חֶסֶד', transliteration: 'hesed', strongs: 'H2617' },
    ]);
  });

  it('translates generated prose without changing quoted Scripture, references, or metadata', async () => {
    const response = {
      promptIdx: 0,
      verseRef: 'John 3:16',
      answer: 'Read John 3:16 slowly: "For God so loved the world." Then consider its meaning.',
      metadata: { title: 'Look' },
    };

    const result = await translatePromptResponse(response, 'es');

    expect(result.answer).toContain('John 3:16');
    expect(result.answer).toContain('"For God so loved the world."');
    expect(result.answer).toContain('[es]');
    expect(result.promptIdx).toBe(0);
    expect(result.verseRef).toBe('John 3:16');
    expect(result.metadata).toBe(response.metadata);
  });

  it('normalizes an invalid language to English without invoking translation', async () => {
    const response = { intro: 'Keep this unchanged.' };
    await expect(translateExplainResponse(response, '../../es')).resolves.toBe(response);
    expect(translateManyMock).not.toHaveBeenCalled();
  });

  it('defaults lang to English in both request schemas', () => {
    expect(explainSchema.parse({ book: 'John', chapter: 3, verse: 16 }).lang).toBe('en');
    expect(generatePromptSchema.parse({ book: 'John', chapter: 3, verse: 16, promptIdx: 0 }).lang).toBe('en');
  });

  it('fails soft when the translator rejects', async () => {
    const response = { intro: 'Original prose.', metadata: { source: 'BSB' } };
    translateManyMock.mockRejectedValueOnce(new Error('offline'));
    await expect(translateExplainResponse(response, 'es')).resolves.toBe(response);
  });
});
