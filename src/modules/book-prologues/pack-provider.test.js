import { createFreeTranslationSession, freeProviderError, safeFreeProviderReason } from '../../../scripts/free-translation-session.mjs';
import { translateWithGoogleFree, translateWithGoogleFreeAlternative } from '../../../scripts/google-translate.mjs';

const fixture = () => {
  let clock = 0;
  const fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  const wait = jest.fn(async ms => { clock += ms; });
  const session = createFreeTranslationSession({ fetch, wait, now: () => clock, intervalMs: 1000, cooldownMs: 60000 });
  return { session, fetch, wait, now: () => clock };
};
test('serializes/paces requests across both Google endpoints and concurrent languages', async () => {
  const f = fixture(); const starts = [];
  f.fetch.mockImplementation(async () => { starts.push(f.now()); return { ok: true }; });
  await Promise.all([f.session.fetch('https://clients5.google.com/first'), f.session.fetch('https://translate.googleapis.com/second'), f.session.fetch('https://clients5.google.com/third')]);
  expect(starts).toEqual([0, 1000, 2000]);
});
test('429 opens a shared circuit, respects Retry-After and sends no HTTP during cooldown', async () => {
  const f = fixture();
  f.fetch.mockResolvedValueOnce({ ok: false, status: 429, headers: { get: () => '120' }, body: { cancel: jest.fn() } });
  await expect(f.session.fetch('https://example.com')).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN', providerReason: 'HTTP_429', retryAfterMs: 120000 });
  await expect(f.session.fetch('https://other.example.com')).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN' });
  expect(f.fetch).toHaveBeenCalledTimes(1);
  const onWait = jest.fn();
  await f.session.waitForCooldown({ onWait });
  expect(onWait).toHaveBeenCalledWith({ milliseconds: 120000, reason: 'HTTP_429' });
  await f.session.fetch('https://example.com');
  expect(f.fetch).toHaveBeenCalledTimes(2);
});
test('403 blocks immediately; repeated network/invalid responses stop after three failures', async () => {
  const f = fixture();
  f.fetch.mockRejectedValue(new Error('private upstream URL with credentials'));
  await expect(f.session.fetch('first')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  await expect(f.session.fetch('second')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  await expect(f.session.fetch('third')).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN', providerReason: 'NETWORK_ERROR' });
  await expect(f.session.fetch('fourth')).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN' });
  expect(f.fetch).toHaveBeenCalledTimes(3);
  const g = fixture();
  g.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
  await expect(g.session.fetch('first')).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN', providerReason: 'HTTP_403' });
});
test('validated success resets transient failures; invalid payloads share the circuit', () => {
  const f = fixture();
  expect(f.session.failure(freeProviderError('INVALID_RESPONSE')).code).toBe('INVALID_RESPONSE');
  expect(f.session.failure(freeProviderError('INVALID_RESPONSE')).code).toBe('INVALID_RESPONSE');
  f.session.success();
  expect(f.session.failure(freeProviderError('EMPTY_RESPONSE')).code).toBe('EMPTY_RESPONSE');
  expect(f.session.cooldown).toBeNull();
  f.session.failure(freeProviderError('EMPTY_RESPONSE'));
  expect(f.session.failure(freeProviderError('EMPTY_RESPONSE')).code).toBe('FREE_PROVIDER_COOLDOWN');
});
test('safe diagnostics retain HTTP status without echoing URLs, bodies or credentials', () => {
  expect(safeFreeProviderReason(freeProviderError('HTTP_503'))).toBe('HTTP_503');
  expect(safeFreeProviderReason(new Error('credential=secret'))).toBe('PROVIDER_ERROR');
  expect(safeFreeProviderReason({ code: 'secret-token' })).toBe('PROVIDER_ERROR');
});
test('cancelled requests do not issue HTTP or increase outage counters', async () => {
  const f = fixture(); const controller = new AbortController(); controller.abort();
  await expect(f.session.fetch('https://example.com', { signal: controller.signal })).rejects.toBeDefined();
  expect(f.fetch).not.toHaveBeenCalled(); expect(f.session.cooldown).toBeNull();
});
test('managed Google clients propagate 429/403 immediately instead of hiding them behind internal retries', async () => {
  for (const status of [429, 403]) {
    const f = fixture();
    f.fetch.mockResolvedValueOnce({ ok: false, status, headers: { get: () => '60' } });
    const options = { fetch: f.session.fetch, onFailure: f.session.failure, onSuccess: f.session.success, failFast: true };
    const call = status === 429 ? translateWithGoogleFree(['A test'], 'fr', () => {}, options) : translateWithGoogleFreeAlternative(['A test'], 'fr', options);
    await expect(call).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN', providerReason: `HTTP_${status}` });
    expect(f.fetch).toHaveBeenCalledTimes(1);
  }
});
test('invalid single-item JSON is classified safely and trips the shared circuit after three attempts', async () => {
  const f = fixture();
  f.fetch.mockResolvedValue({ ok: true, json: async () => { throw new Error('private upstream response'); } });
  const options = { fetch: f.session.fetch, onFailure: f.session.failure, onSuccess: f.session.success, failFast: true };
  for (let index = 0; index < 3; index++) {
    await expect(translateWithGoogleFreeAlternative(['A test'], 'fr', options)).rejects.toMatchObject({ code: index < 2 ? 'INVALID_RESPONSE' : 'FREE_PROVIDER_COOLDOWN' });
  }
  await expect(translateWithGoogleFreeAlternative(['A test'], 'fr', options)).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN' });
  expect(f.fetch).toHaveBeenCalledTimes(3);
});
