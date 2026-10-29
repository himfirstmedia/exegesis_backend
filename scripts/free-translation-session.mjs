// Build-only shared request governor. Never changes runtime provider order.
export const freeProviderError = (code, details = {}) => Object.assign(new Error(code), { name: 'FreeTranslationError', code, ...details });
export const safeFreeProviderReason = error => {
  if (error?.code === 'FREE_PROVIDER_COOLDOWN') return 'FREE_PROVIDER_COOLDOWN';
  if (/^(?:HTTP_[1-5]\d\d|NETWORK_ERROR|REQUEST_TIMEOUT|INVALID_RESPONSE|EMPTY_RESPONSE)$/.test(error?.code || '')) return error.code;
  return 'PROVIDER_ERROR';
};
export function waitForFreeProvider(ms, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason || new Error('Aborted'));
  return new Promise((resolve, reject) => {
    const finish = () => { signal?.removeEventListener('abort', abort); resolve(); };
    const timer = setTimeout(finish, ms);
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(signal.reason || new Error('Aborted')); };
    signal?.addEventListener('abort', abort, { once: true });
  });
}

export function createFreeTranslationSession(options = {}) {
  const now = options.now || Date.now;
  const wait = options.wait || waitForFreeProvider;
  const request = options.fetch || ((...args) => fetch(...args));
  const interval = options.intervalMs ?? 1000;
  const cooldownMs = options.cooldownMs ?? 60000;
  let queue = Promise.resolve();
  let nextRequest = 0, failures = 0, cooldownUntil = 0, reason = 'PROVIDER_ERROR';
  const paused = () => freeProviderError('FREE_PROVIDER_COOLDOWN', {
    providerReason: reason, retryAfterMs: Math.max(0, cooldownUntil - now()),
  });
  const failure = error => {
    const code = safeFreeProviderReason(error);
    if (code === 'FREE_PROVIDER_COOLDOWN') return error;
    failures++;
    if (code === 'HTTP_429' || code === 'HTTP_403' || failures >= 3) {
      reason = code;
      cooldownUntil = Math.max(cooldownUntil, now() + Math.max(cooldownMs, error.retryAfterMs || 0));
      return paused();
    }
    return error;
  };
  const sessionFetch = (url, init = {}) => {
    const run = queue.then(async () => {
      if (init.signal?.aborted) throw init.signal.reason;
      if (cooldownUntil > now()) throw paused();
      await wait(Math.max(0, nextRequest - now()), init.signal);
      if (cooldownUntil > now()) throw paused();
      nextRequest = now() + interval;
      let response;
      try { response = await request(url, init); }
      catch (error) {
        if (init.signal?.aborted && init.signal.reason?.name !== 'TimeoutError') throw error;
        throw failure(freeProviderError(error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR'));
      }
      if (!response.ok) {
        const retry = response.headers?.get?.('retry-after');
        const seconds = retry && /^\d+(?:\.\d+)?$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry || '') - now();
        const retryAfterMs = Number.isFinite(seconds) ? Math.min(3600000, Math.max(0, seconds)) : 0;
        try { await response.body?.cancel?.(); } catch { /* Release failed HTTP connections. */ }
        throw failure(freeProviderError(`HTTP_${response.status}`, { retryAfterMs }));
      }
      return response;
    });
    queue = run.then(() => {}, () => {});
    return run;
  };
  return {
    fetch: sessionFetch, failure,
    success: () => { failures = 0; },
    get cooldown() { return cooldownUntil > now() ? paused() : null; },
    waitForCooldown: async ({ signal, onWait } = {}) => {
      const ms = Math.max(0, cooldownUntil - now());
      if (ms) { onWait?.({ milliseconds: ms, reason }); await wait(ms, signal); }
    },
  };
}
