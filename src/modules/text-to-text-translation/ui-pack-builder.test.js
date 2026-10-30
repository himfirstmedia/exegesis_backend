jest.mock('../../services/cacheService.js', () => ({ cache: { acquireLock: jest.fn() } }));
jest.mock('../../services/objectStorage.js', () => ({ readUiPackObject: jest.fn(), writeUiPackObject: jest.fn() }));
jest.mock('./service.js', () => ({ translateBatch: jest.fn() }));
import { buildUiPack } from './ui-pack-builder.js';
import { uiSource, uiPackKeys, completeUiPack, validUiText, uiCarryKey } from './ui-pack-data.js';
import { cache } from '../../services/cacheService.js';
import { readUiPackObject, writeUiPackObject } from '../../services/objectStorage.js';
import { translateBatch } from './service.js';
const fixture = language => ({ schemaVersion: 1, language, revision: uiSource.revision, translations: uiSource.texts.map(text => `translated:${text}`) });
beforeEach(() => {
  jest.clearAllMocks();
  cache.acquireLock.mockResolvedValue({ acquired: true, release: jest.fn() });
  readUiPackObject.mockResolvedValue(null);
  writeUiPackObject.mockResolvedValue(undefined);
  translateBatch.mockImplementation(async ({ q }) => ({ translations: q.map(text => ({ translatedText: `translated:${text}` })) }));
});
test('builds bounded batches, checkpoints, compresses final object and publishes manifest last', async () => {
  const result = await buildUiPack('fr');
  expect(result.totalTexts).toBe(uiSource.texts.length);
  for (const [request] of translateBatch.mock.calls) {
    expect(request.q.length).toBeLessThanOrEqual(50);
    expect(request.q.reduce((n, text) => n + text.length, 0)).toBeLessThanOrEqual(10000);
    expect(request.target).toBe('fr');
  }
  const calls = writeUiPackObject.mock.calls;
  const final = calls.find(([key, , options]) => key === uiPackKeys('fr').final && options?.compress);
  expect(completeUiPack(final[1], 'fr')).toBe(true);
  expect(calls.at(-1)[0]).toBe(uiPackKeys('fr').manifest);
});
test('reuses complete packs without invoking providers', async () => {
  readUiPackObject.mockResolvedValue(fixture('fr'));
  expect((await buildUiPack('fr')).reused).toBe(true);
  expect(translateBatch).not.toHaveBeenCalled();
  expect(writeUiPackObject).toHaveBeenCalledTimes(3);
});
test('English needs no provider', async () => {
  await buildUiPack('en');
  expect(translateBatch).not.toHaveBeenCalled();
});
test('authored local-script brand labels override unchanged provider and carry values', async () => {
  const carry = { texts: ['Google', 'LordsBook'], translations: ['Google', 'LordsBook'] };
  await buildUiPack('doi', () => {}, { carry });
  const pack = writeUiPackObject.mock.calls.find(([key]) => key === uiPackKeys('doi').final)[1];
  expect(pack.translations[uiSource.texts.indexOf('Google')]).toBe('गूगल');
  expect(pack.translations[uiSource.texts.indexOf('LordsBook')]).toBe('लॉर्ड्सबुक');
});
test.each([
  ['ja', 'グーグル'], ['ko', '구글'], ['uk', 'Ґуґл'],
])('keeps the corrected %s Google label in the generated catalogue', (language, expected) => {
  expect(uiSource.overrides[language].Google).toBe(expected);
});
test('resumes valid checkpoint translations and rejects the wrong language', async () => {
  const checkpoint = fixture('fr'); checkpoint.translations[0] = '';
  readUiPackObject.mockImplementation(async key => key.endsWith('-partial.json') ? checkpoint : null);
  await buildUiPack('fr');
  expect(translateBatch).toHaveBeenCalledTimes(1);
  expect(translateBatch.mock.calls[0][0].q).toHaveLength(1);
  expect(completeUiPack(checkpoint, 'sw')).toBe(false);
});
test('failure never advertises a manifest and always releases the lock', async () => {
  translateBatch.mockRejectedValue(new Error('Offline'));
  await expect(buildUiPack('fr')).rejects.toThrow('Offline');
  expect(writeUiPackObject).not.toHaveBeenCalled();
  const lock = await cache.acquireLock.mock.results[0].value;
  expect(lock.release).toHaveBeenCalledTimes(1);
});
test('missing or corrupted placeholder translations are rejected', () => {
  expect(validUiText('Hello {name}', 'Bonjour')).toBe(false);
  expect(validUiText('{count} messages', '{count} messages traduits')).toBe(true);
  expect(validUiText('Text', '')).toBe(false);
  const pack = fixture('fr'); pack.translations.pop();
  expect(completeUiPack(pack, 'fr')).toBe(false);
});
test('an upload failure never publishes the manifest', async () => {
  readUiPackObject.mockResolvedValue(fixture('fr'));
  writeUiPackObject.mockRejectedValue(new Error('Upload failed'));
  await expect(buildUiPack('fr')).rejects.toThrow('Upload failed');
  expect(writeUiPackObject).toHaveBeenCalledTimes(1);
});
test('unowned locks and unsupported languages fail explicitly', async () => {
  await expect(buildUiPack('../en')).rejects.toThrow('Unsupported');
  cache.acquireLock.mockResolvedValue({ acquired: false });
  await expect(buildUiPack('fr')).rejects.toThrow('Another');
});

test('automatically repairs provider-mangled placeholders using literal spans', async () => {
  const checkpoint = fixture('es');
  const index = uiSource.texts.findIndex(text => text === '-- Select {field} --');
  expect(index).toBeGreaterThan(-1);
  checkpoint.translations[index] = '';
  readUiPackObject.mockImplementation(async key => key.endsWith('-partial.json') ? checkpoint : null);
  const translate = jest.fn(async texts => texts.map(text => text.includes('ZXQPH') ? '-- Seleccione {campo} --' : text.replace('Select', 'Seleccione')));
  await buildUiPack('es', () => {}, { translate });
  const pack = writeUiPackObject.mock.calls.find(([key]) => key === uiPackKeys('es').final)[1];
  expect(pack.translations[index]).toBe('-- Seleccione {field} --');
  expect(translate).toHaveBeenCalledTimes(2);
  expect(completeUiPack(pack, 'es')).toBe(true);
});

test('retains good items when one item remains broken and reports its source', async () => {
  const checkpoint = fixture('es');
  checkpoint.translations[0] = ''; checkpoint.translations[1] = '';
  readUiPackObject.mockImplementation(async key => key.endsWith('-partial.json') ? checkpoint : null);
  const translate = jest.fn().mockResolvedValueOnce(['trad:first', '']).mockResolvedValue(['']);
  const onWarning = jest.fn();
  await expect(buildUiPack('es', () => {}, { translate, onWarning })).rejects.toThrow('source #1');
  const saved = writeUiPackObject.mock.calls[0];
  expect(saved[0]).toBe(uiPackKeys('es').partial);
  expect(saved[1].translations[0]).toBe('trad:first');
  expect(saved[1].translations[1]).toBe('');
  expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
  expect(writeUiPackObject.mock.calls.some(([key]) => key === uiPackKeys('es').manifest)).toBe(false);
});

test('abort while translating releases the lock without publishing a manifest', async () => {
  const controller = new AbortController();
  const translate = jest.fn().mockImplementation(() => { controller.abort(); return new Promise(() => {}); });
  await expect(buildUiPack('fr', () => {}, { translate, signal: controller.signal })).rejects.toThrow('interrupted');
  const lock = await cache.acquireLock.mock.results[0].value;
  expect(lock.release).toHaveBeenCalledTimes(1);
  expect(writeUiPackObject).not.toHaveBeenCalled();
});

test('reuses unchanged strings from the previous revision and translates only added or edited copy', async () => {
  const indexes = [0, 1, 2];
  const carriedTexts = indexes.map(index => uiSource.texts[index]);
  const carry = { schemaVersion: 1, revision: '000000000000', language: 'fr',
    texts: carriedTexts, translations: indexes.map(index => `carried:${index}`) };
  readUiPackObject.mockImplementation(async key => key === uiCarryKey('fr') ? carry : null);
  const translate = jest.fn(async texts => texts.map(text => `translated:${text}`));
  const result = await buildUiPack('fr', () => {}, { translate });
  const sent = translate.mock.calls.flatMap(([texts]) => texts);
  for (const text of carriedTexts) expect(sent).not.toContain(text);
  // Duplicate source strings may legitimately share one carried translation.
  expect(sent.length).toBeLessThanOrEqual(uiSource.texts.length - indexes.length);
  expect(result.reused).toBe(false);
  const pack = writeUiPackObject.mock.calls.find(([key]) => key === uiPackKeys('fr').final)[1];
  indexes.forEach(index => expect(pack.translations[index]).toBe(`carried:${index}`));
  expect(completeUiPack(pack, 'fr')).toBe(true);
});

test('records a per-language carry so the next revision can reuse translations', async () => {
  await buildUiPack('fr');
  const call = writeUiPackObject.mock.calls.find(([key]) => key === uiCarryKey('fr'));
  expect(call).toBeTruthy();
  expect(call[1]).toMatchObject({ schemaVersion: 1, revision: uiSource.revision, language: 'fr', texts: uiSource.texts });
  expect(call[1].translations).toHaveLength(uiSource.texts.length);
  expect(uiSource.texts.every((text, index) => validUiText(text, call[1].translations[index]))).toBe(true);
});

test('English publishes no carry object', async () => {
  await buildUiPack('en');
  expect(writeUiPackObject.mock.calls.some(([key]) => key === uiCarryKey('en'))).toBe(false);
});
