/** CLI scheduling with one shared, bounded cooldown budget across languages. */
export async function runOverviewBuildQueue({ languages, concurrency, signal, build, waitForCooldown,
  onProviderWait, onResult, onFailure, maxCooldowns = 2 }) {
  const pending = [...languages];
  let failed = 0, cooldowns = 0, cooldownWait, providerStopped = false;
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
    while (pending.length && !signal?.aborted && !providerStopped) {
      const language = pending.shift();
      try { const result = await build(language); onResult?.(language, result); }
      catch (error) {
        if (signal?.aborted) break;
        if (error?.code === 'FREE_PROVIDER_COOLDOWN' && waitForCooldown) {
          if (!cooldownWait && cooldowns >= maxCooldowns) {
            providerStopped = true; failed++; pending.unshift(language);
            onFailure?.(language, error, { cooldownExhausted: true });
            continue;
          }
          if (!cooldownWait) {
            cooldowns++;
            cooldownWait = Promise.resolve().then(() => waitForCooldown({ signal,
              onWait: item => onProviderWait?.({ ...item, cooldown: cooldowns, maxCooldowns }),
            })).finally(() => { cooldownWait = undefined; });
          }
          try { await cooldownWait; }
          catch (failure) {
            if (!signal?.aborted) { failed++; providerStopped = true; onFailure?.(language, failure, { cooldownExhausted: true }); }
            break;
          }
          if (!signal?.aborted) pending.unshift(language);
          continue;
        }
        failed++; onFailure?.(language, error);
      }
    }
  }));
  return { failed, cooldowns, providerStopped, unattempted: pending.length };
}
