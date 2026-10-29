import { recoverOverviewTranslation } from './pack-recovery.js';
const source = { author: 'Moses', keyPeople: ['Abraham'] };
const job = (text, field = 'summary') => ({ text, field, key: field });

test('recovers transient empty responses with bounded individual retries', async () => {
  const translate = jest.fn().mockResolvedValueOnce(['']).mockResolvedValueOnce(['Gott erforscht jedes Herz.']);
  const onRetry = jest.fn();
  expect(await recoverOverviewTranslation(job('God searches every heart.'), source, 'de', translate, { retryDelayMs: 0, onRetry })).toBe('Gott erforscht jedes Herz.');
  expect(translate).toHaveBeenCalledTimes(2);
  expect(onRetry).toHaveBeenCalledTimes(2);
});
test('splits failed long prose into smaller validated sentences/chunks without dropping content', async () => {
  const text = 'This is a paragraph about prayer and faith. '.repeat(20).trim();
  const translate = jest.fn(async texts => texts.map(value => value.length > 250 ? '' : `traduit:${value}`));
  const result = await recoverOverviewTranslation(job(text), source, 'fr', translate, { retryDelayMs: 0 });
  expect(result).toBeTruthy();
  expect(result.match(/prayer and faith/g)).toHaveLength(20);
  expect(translate.mock.calls.slice(1).every(([texts]) => texts.every(value => value.length <= 250))).toBe(true);
});
test('recovers an echoed short contrast heading by translating meaningful parts, not whole paragraphs word by word', async () => {
  const dictionary = { Pride: 'pagmamataas', versus: 'laban sa', humility: 'pagpapakumbaba' };
  const translate = jest.fn(async texts => texts.map(text => dictionary[text] || text));
  expect(await recoverOverviewTranslation(job('Pride versus humility', 'mainThemes'), source, 'fil', translate, { retryDelayMs: 0 }))
    .toBe('pagmamataas laban sa pagpapakumbaba');
});
test('persistent empty results and echoed prose remain failures after exactly three attempts', async () => {
  for (const response of ['', 'God is faithful.']) {
    const translate = jest.fn().mockResolvedValue([response]);
    const onFailure = jest.fn();
    expect(await recoverOverviewTranslation(job('God is faithful.'), source, 'fr', translate, { retryDelayMs: 0, onFailure })).toBeNull();
    expect(translate).toHaveBeenCalledTimes(3);
    expect(onFailure).toHaveBeenCalledWith({ reason: response ? 'UNCHANGED_SOURCE' : 'EMPTY_TRANSLATION' });
  }
});
test('aborting recovery propagates immediately rather than consuming the retry budget', async () => {
  const controller = new AbortController();
  const translate = jest.fn(async () => { controller.abort(); return ['']; });
  await expect(recoverOverviewTranslation(job('God is faithful.'), source, 'fr', translate, { signal: controller.signal, retryDelayMs: 0 })).rejects.toThrow('interrupted');
  expect(translate).toHaveBeenCalledTimes(1);
});
test('shared provider cooldown escapes immediately instead of retrying every chunk', async () => {
  const translate = jest.fn().mockRejectedValue(Object.assign(new Error('cooldown'), { code: 'FREE_PROVIDER_COOLDOWN', providerReason: 'HTTP_429' }));
  await expect(recoverOverviewTranslation(job('God is faithful.'), source, 'fr', translate, { retryDelayMs: 0 })).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN' });
  expect(translate).toHaveBeenCalledTimes(1);
});
test('provider diagnostics distinguish safe HTTP errors from generic failures', async () => {
  const translate = jest.fn().mockRejectedValue(Object.assign(new Error('private message'), { code: 'HTTP_503' }));
  const onRetry = jest.fn();
  await recoverOverviewTranslation(job('God is faithful.'), source, 'fr', translate, { retryDelayMs: 0, onRetry });
  expect(onRetry).toHaveBeenLastCalledWith({ attempt: 3, reason: 'HTTP_503' });
});
