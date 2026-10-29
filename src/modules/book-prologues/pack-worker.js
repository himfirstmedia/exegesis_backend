import { isObjectStorageConfigured, readHeadingPackObject } from '../../services/objectStorage.js';
import { overviewLanguages, overviewManifestKey, readOverviewSnapshot } from './pack-data.js';
import { buildOverviewPack, overviewFailureReason } from './pack-builder.js';
import { cache } from '../../services/cacheService.js';
import { makeOverviewFreeProvider } from './pack-provider.js';

let running;
let timer;
let rerun = false;
let stopped = false;
let controller;
const enabled = () => process.env.BOOK_OVERVIEW_PACK_AUTO_PUBLISH !== 'false' && isObjectStorageConfigured();

export async function overviewTranslator(provider = process.env.BOOK_OVERVIEW_PACK_PROVIDER || 'google-free') {
  if (provider === 'runtime') return undefined;
  if (provider !== 'google-free') throw new Error('Overview provider must be runtime or google-free');
  const { translateWithGoogleFree, translateWithGoogleFreeAlternative } = await import('../../../scripts/google-translate.mjs');
  return makeOverviewFreeProvider(translateWithGoogleFree, translateWithGoogleFreeAlternative);
}

export function publishPendingOverviewPacks() {
  if (!enabled() || stopped) return Promise.resolve();
  if (running) { rerun = true; return running; }
  controller = new AbortController();
  running = (async () => {
    await cache.waitUntilReady();
    const snapshot = await readOverviewSnapshot();
    const translate = await overviewTranslator();
    const pending = [...overviewLanguages];
    await Promise.all(Array.from({ length: 2 }, async () => {
      while (pending.length && !controller.signal.aborted) {
        const language = pending.shift();
        try {
          const manifest = await readHeadingPackObject(overviewManifestKey(language));
          if (manifest?.revision === snapshot.revision) continue;
          const result = await buildOverviewPack(language, { snapshot, translate, signal: controller.signal });
          console.info(`[overview-packs] ${language}: published ${result.bookCount} books; ${result.revision}`);
        } catch (error) {
          console.warn(`[overview-packs] ${language}: ${overviewFailureReason(error)}; publication pending, will retry`);
        }
      }
    }));
  })().catch(() => {
    console.warn('[overview-packs] Source/storage unavailable; publication will retry');
  }).finally(() => {
    running = undefined;
    if (rerun && !stopped) { rerun = false; requestOverviewPackPublication(); }
  });
  return running;
}

// Immediate wake-up after an admin mutation; no translation on the request path.
export function requestOverviewPackPublication() {
  if (!enabled() || stopped) return;
  if (running) { rerun = true; controller?.abort(); return; }
  void publishPendingOverviewPacks();
}

export function startOverviewPackPublisher() {
  if (timer || !enabled()) return;
  stopped = false;
  requestOverviewPackPublication();
  // The DB is the durable pending-work record: recover after restarts, failures,
  // and direct DB edits without a volatile queue or a schema migration.
  timer = setInterval(() => { if (!running) void publishPendingOverviewPacks(); }, 60000);
  timer.unref();
}

export async function stopOverviewPackPublisher() {
  stopped = true;
  if (timer) clearInterval(timer);
  timer = undefined;
  controller?.abort();
  await running;
}
