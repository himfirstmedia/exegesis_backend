jest.mock('../../services/cacheService.js', () => ({ cache: { get: jest.fn(), set: jest.fn() } }));
jest.mock('../text-to-text-translation/service.js', () => ({ translateText: jest.fn() }));
import { cache } from '../../services/cacheService.js';
import { translateText } from '../text-to-text-translation/service.js';
import { streamReaderTranslation, getReaderChunkCharacters } from './service.js';
import { buildReaderPlan, splitReaderText } from './plan.js';

const source = { id: '7', bookName: 'Genesis', chapter: 1, title: 'Authored title',
  content: Array.from({ length: 15 }, (_, i) => `Sentence ${i} explains the historical context and practical meaning.`).join(' '),
  explanation: 'A later explanation.', sourceTitle: 'Private source title', internalNotes: 'Never publish this.' };
beforeEach(() => {
  jest.resetAllMocks(); cache.get.mockResolvedValue(null); cache.set.mockResolvedValue(true);
  translateText.mockImplementation(async ({ q, target }) => ({ translatedText: `FR:${q}`, target }));
});

it('bounds chunks to 250 characters and preserves every word/separator', () => {
  const text = `${source.content}\n\nSecond paragraph. ${'x'.repeat(700)} 😀😀`;
  const chunks = splitReaderText(text);
  expect(chunks.every(chunk => chunk.text.length <= 250)).toBe(true);
  expect(chunks.map(chunk => chunk.separator + chunk.text).join('')).toBe(text);
});

it('supports smaller sentence-aware chunks without losing text or emoji', () => {
  const text = `${source.content}\n\n${'x'.repeat(119)}😀${'y'.repeat(200)}`;
  const chunks = splitReaderText(text, 120);
  expect(chunks.every(chunk => chunk.text.length <= 120)).toBe(true);
  expect(chunks.map(chunk => chunk.separator + chunk.text).join('')).toBe(text);
  expect(chunks.every(chunk => !/[\uD800-\uDBFF]$/.test(chunk.text))).toBe(true);
});

it('bounds the streaming configuration and versions plans by chunk size', () => {
  const original = process.env.READER_TRANSLATION_CHUNK_CHARACTERS;
  try {
    delete process.env.READER_TRANSLATION_CHUNK_CHARACTERS;
    expect(getReaderChunkCharacters()).toBe(180);
    process.env.READER_TRANSLATION_CHUNK_CHARACTERS = '120';
    expect(getReaderChunkCharacters()).toBe(120);
    for (const value of ['0', '-1', '251', 'NaN', '100.5']) {
      process.env.READER_TRANSLATION_CHUNK_CHARACTERS = value;
      expect(getReaderChunkCharacters()).toBe(180);
    }
  } finally {
    if (original === undefined) delete process.env.READER_TRANSLATION_CHUNK_CHARACTERS;
    else process.env.READER_TRANSLATION_CHUNK_CHARACTERS = original;
  }
  expect(buildReaderPlan(source, ['content'], [], { chunkCharacters: 120 }).sourceVersion)
    .not.toBe(buildReaderPlan(source, ['content']).sourceVersion);
});

it('streams prose in smaller chunks and still publishes the complete document', async () => {
  const events = [];
  await streamReaderTranslation({ kind: 'daily-devotion', source, fields: ['content'], language: 'ml',
    emit: async (event, data) => { events.push({ event, data }); } });
  expect(translateText.mock.calls.every(([request]) => request.q.length <= getReaderChunkCharacters())).toBe(true);
  expect(events.at(-1).event).toBe('done');
  expect(events.filter(item => item.event === 'patch').length).toBeGreaterThan(1);
});

it('strips unknown/source fields and never renders prose across an unconfirmed gap', () => {
  const plan = buildReaderPlan(source, ['title', 'content', 'explanation'], ['title']);
  const shell = plan.render([]);
  expect(shell).toMatchObject({ id: '7', bookName: 'Genesis', title: '', content: '', explanation: '' });
  expect(shell.sourceTitle).toBeUndefined(); expect(shell.internalNotes).toBeUndefined();
  const values = ['Titre traduit', 'Premier passage'];
  values[plan.jobs.length - 1] = 'Explication en cache';
  expect(plan.render(values)).toMatchObject({ title: 'Titre traduit', content: 'Premier passage', explanation: '' });
});

it('preserves JSON, HTML, canonical references and original-language words', () => {
  const original = { wordStudies: JSON.stringify([{ word: 'λόγος', strongs: 'G3056', definition: 'The meaning.' }]),
    content: `<p><b>${source.content}</b></p>`, crossReferences: JSON.stringify(['John 1:1']) };
  const plan = buildReaderPlan(original, ['wordStudies', 'content', 'crossReferences']);
  expect(plan.jobs.every(job => !job.text.includes('<') && !job.text.startsWith('[{'))).toBe(true);
  const translated = plan.render(plan.jobs.map(job => `FR:${job.text}`));
  expect(JSON.parse(translated.wordStudies)[0]).toEqual({ word: 'λόγος', strongs: 'G3056', definition: 'FR:The meaning.' });
  expect(JSON.parse(translated.crossReferences)).toEqual(['John 1:1']);
  const partial = plan.render(['Sens traduit', 'Premier passage']);
  expect(partial.content).toBe('<p><b>Premier passage</b></p>');
});

it('keeps reference lists and original-language verse words canonical', () => {
  const plan = buildReaderPlan({
    crossReferences: 'John 3:16; Romans 5:8; Ephesians 2:8-9',
    verseReferences: [{ reference: 'John 1:1', bookName: 'John', chapter: 1, verse: 1,
      translation: 'BSB', surfaceText: 'λόγος', verseText: 'In the beginning was the Word.',
      verseWords: ['λόγος', 'ἦν'] }],
  }, ['crossReferences', 'verseReferences']);
  expect(plan.jobs.map(job => job.text)).toEqual(['In the beginning was the Word.']);
  const translated = plan.render(plan.jobs.map(job => `FR:${job.text}`));
  expect(translated.crossReferences).toBe('John 3:16; Romans 5:8; Ephesians 2:8-9');
  expect(translated.verseReferences[0]).toMatchObject({ reference: 'John 1:1', surfaceText: 'λόγος',
    verseWords: ['λόγος', 'ἦν'], verseText: 'FR:In the beginning was the Word.' });
});

it('preserves structural reader metadata while translating nested prose', () => {
  const original = {
    interlinearWords: [{ original: 'λόγος', strongs: 'G3056', transliteration: 'logos', translation: 'word', grammar: 'N-NSM', lemma: 'λόγος' }],
    dictionaryTerms: [{ term: 'Grace', pronunciation: 'grayce', definition: 'Unmerited favor.', description: 'A gift.' }],
    crossReferences: [{ ref: 'John 3:16', bookName: 'John', chapter: 3, verse: 16, text: 'For God so loved the world.',
      commentary: 'A familiar summary.', verseText: 'For God so loved the world.', contextVerses: [{ verse: 15, text: 'Earlier verse.' }] }],
    studyTools: [{ id: 7, toolType: 'CONTRAST', label: 'Not X but Y', description: 'An explicit contrast.',
      verseRefs: [{ verse: 16, excerpt: 'For God so loved…' }], studyToolWords: [{ word: 'ἀλλά', order: 2 }] }],
  };
  const fields = ['interlinearWords', 'dictionaryTerms', 'crossReferences', 'studyTools'];
  const plan = buildReaderPlan(original, fields, ['crossReferences']);
  const translated = plan.render(plan.jobs.map(job => `FR:${job.text}`));
  expect(translated.interlinearWords[0]).toEqual({ original: 'λόγος', strongs: 'G3056', transliteration: 'logos',
    translation: 'FR:word', grammar: 'N-NSM', lemma: 'λόγος' });
  expect(translated.dictionaryTerms[0]).toEqual({ term: 'FR:Grace', pronunciation: 'grayce',
    definition: 'FR:Unmerited favor.', description: 'FR:A gift.' });
  expect(translated.crossReferences[0]).toMatchObject({ ref: 'John 3:16', bookName: 'John', chapter: 3,
    verse: 16, text: 'FR:For God so loved the world.', commentary: 'FR:A familiar summary.',
    verseText: 'FR:For God so loved the world.', contextVerses: [{ verse: 15, text: 'FR:Earlier verse.' }] });
  expect(translated.studyTools[0]).toMatchObject({ id: 7, toolType: 'CONTRAST', label: 'FR:Not X but Y',
    description: 'FR:An explicit contrast.', verseRefs: [{ verse: 16, excerpt: 'FR:For God so loved…' }],
    studyToolWords: [{ word: 'ἀλλά', order: 2 }] });
});

it('publishes the first translated chunk before a later provider call finishes', async () => {
  const events = []; const controller = new AbortController();
  let first; const firstPatch = new Promise(resolve => { first = resolve; });
  translateText.mockImplementationOnce(async ({ target }) => ({ translatedText: 'Titre traduit', target }));
  translateText.mockImplementation(() => new Promise(() => {}));
  const pending = streamReaderTranslation({ kind: 'daily-devotion', source, fields: ['title', 'content'], atomicFields: ['title'],
    language: 'fr', signal: controller.signal, emit: async (event, data) => { events.push({ event, data }); if (event === 'patch') first(); } });
  await firstPatch;
  expect(events[0].event).toBe('meta'); expect(events[0].data.data.title).toBe('');
  expect(events[1].data.append.title).toBe('Titre traduit');
  expect(events.some(item => item.event === 'done')).toBe(false);
  controller.abort(); await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(translateText.mock.calls.length).toBeLessThanOrEqual(2);
});

it('keeps publication ordered even when the second provider call resolves first', async () => {
  let finishFirst;
  translateText.mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve; }));
  translateText.mockResolvedValueOnce({ translatedText: 'Corps traduit', target: 'fr' });
  const events = [];
  const pending = streamReaderTranslation({ kind: 'daily-devotion', source: { title: 'Title', content: 'Body' },
    fields: ['title', 'content'], language: 'fr', emit: async (event, data) => events.push({ event, data }) });
  for (let i = 0; i < 10; i++) await Promise.resolve();
  expect(events.map(item => item.event)).toEqual(['meta']);
  finishFirst({ translatedText: 'Titre traduit', target: 'fr' }); await pending;
  expect(events.filter(item => item.event === 'patch').map(item => item.data.completed)).toEqual([1, 2]);
  expect(events.at(-1).event).toBe('done');
});

it('uses cached completed documents without invoking a provider or charging translation characters', async () => {
  const reserveCharacters = jest.fn(); const events = [];
  cache.get.mockResolvedValue({ complete: true, language: 'fr', data: { title: 'Titre', content: 'Corps' } });
  await streamReaderTranslation({ kind: 'daily-devotion', source, fields: ['title', 'content'], language: 'fr', reserveCharacters,
    emit: async (event, data) => events.push({ event, data }) });
  expect(translateText).not.toHaveBeenCalled(); expect(reserveCharacters).not.toHaveBeenCalled();
  expect(events.map(item => item.event)).toEqual(['meta', 'done']);
  expect(events[0].data.data.localizationIncomplete).toBe(false);
});

it('checkpoints before cancellation and resumes without translating the completed prefix again', async () => {
  const stored = new Map();
  cache.get.mockImplementation(async (_namespace, key) => stored.get(key) || null);
  cache.set.mockImplementation(async (_namespace, key, value) => { stored.set(key, value); });
  const controller = new AbortController();
  const original = { introduction: 'First paragraph.', summary: 'Second paragraph.', purpose: 'Third paragraph.' };
  const options = { kind: 'book-overview', source: original, fields: ['introduction', 'summary', 'purpose'], language: 'fr' };
  await expect(streamReaderTranslation({ ...options, signal: controller.signal,
    emit: async event => { if (event === 'patch') controller.abort(); },
  })).rejects.toMatchObject({ name: 'AbortError' });
  const partial = [...stored.entries()].find(([key]) => key.endsWith(':partial'))[1];
  expect(partial.values).toEqual(['FR:First paragraph.']);
  translateText.mockClear();
  const events = []; const reserveCharacters = jest.fn();
  await streamReaderTranslation({ ...options, reserveCharacters, emit: async (event, data) => events.push({ event, data }) });
  expect(events[0]).toMatchObject({ event: 'meta', data: { completed: 1, resumed: true,
    data: { introduction: 'FR:First paragraph.', summary: '' } } });
  expect(translateText.mock.calls.map(([request]) => request.q)).toEqual(['Second paragraph.', 'Third paragraph.']);
  expect(reserveCharacters).toHaveBeenCalledWith('Second paragraph.'.length + 'Third paragraph.'.length);
  expect(events.at(-1).event).toBe('done');
});

it('discards invalid checkpoints and cannot reuse partial prose across source revisions', async () => {
  const stored = new Map();
  cache.get.mockImplementation(async (_namespace, key) => stored.get(key) || null);
  cache.set.mockImplementation(async (_namespace, key, value) => { stored.set(key, value); });
  const original = { introduction: 'Original paragraph.' };
  await streamReaderTranslation({ kind: 'book-overview', source: original, fields: ['introduction'], language: 'fr', emit: async () => {} });
  translateText.mockClear();
  const events = [];
  await streamReaderTranslation({ kind: 'book-overview', source: { introduction: 'Edited paragraph.' }, fields: ['introduction'],
    language: 'fr', emit: async (event, data) => events.push({ event, data }) });
  expect(events[0].data.completed).toBe(0);
  expect(translateText).toHaveBeenCalledWith(expect.objectContaining({ q: 'Edited paragraph.' }));
  cache.get.mockImplementation(async (_namespace, key) => key.endsWith(':partial') ? { language: 'fr', values: [''] } : null);
  const invalidEvents = [];
  await streamReaderTranslation({ kind: 'book-overview', source: original, fields: ['introduction'], language: 'fr',
    emit: async (event, data) => invalidEvents.push({ event, data }) });
  expect(invalidEvents[0].data.completed).toBe(0);
});

it('localizes book names left in translated prose before publishing and caching', async () => {
  translateText.mockResolvedValue({ translatedText: 'Psalm 105 gives thanks.', target: 'hi' });
  const events = [];
  await streamReaderTranslation({
    kind: 'verse-explanation',
    source: { explanation: 'Give thanks to the LORD.' },
    fields: ['explanation'],
    language: 'hi',
    emit: async (event, data) => events.push({ event, data }),
  });
  const patch = events.find(item => item.event === 'patch');
  expect(patch.data.append.explanation).toBe('भजन संहिता 105 gives thanks.');
  expect(cache.set).toHaveBeenCalledWith('reader-stream', expect.stringContaining('v2:verse-explanation'),
    expect.objectContaining({ data: expect.objectContaining({ explanation: 'भजन संहिता 105 gives thanks.' }) }), expect.any(Number));
});

it('does not certify an unchanged English fallback or cache an incomplete document', async () => {
  translateText.mockImplementation(async ({ q, target }) => ({ translatedText: q, target }));
  const events = [];
  await streamReaderTranslation({ kind: 'daily-devotion', source, fields: ['title', 'content'], language: 'fr',
    emit: async (event, data) => events.push({ event, data }) });
  expect(events.map(item => item.event)).toEqual(['meta', 'error']);
  expect(cache.set).not.toHaveBeenCalled();
  expect(events[0].data.data.content).toBe('');
});

it('returns English directly without provider work and invalidates cached documents on source edits', async () => {
  const keys = [];
  cache.get.mockImplementation(async (_namespace, key) => { keys.push(key); return null; });
  const events = [];
  for (const content of ['First revision.', 'Edited revision.']) await streamReaderTranslation({ kind: 'daily-devotion',
    source: { content }, fields: ['content'], language: 'en', emit: async (event, data) => events.push({ event, data }) });
  expect(keys[0]).not.toBe(keys[1]); expect(translateText).not.toHaveBeenCalled();
  expect(events[0].data.data.content).toBe('First revision.');
});
