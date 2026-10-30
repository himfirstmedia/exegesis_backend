// Offline/admin-only generation. Runtime routes never import this builder.
import { cache } from '../../services/cacheService.js';
import { readUiPackObject, writeUiPackObject } from '../../services/objectStorage.js';
import { translateBatch } from './service.js';
import { uiSource, uiLanguages, uiPackKeys, validUiText, completeUiPack, uiCarryKey, uiTranslationMap } from './ui-pack-data.js';
import { protectUiText, translateUiSpans, abortable } from './ui-pack-translation.js';

export async function buildUiPack(language, onProgress = () => {}, options = {}) {
  if (!uiLanguages.includes(language)) throw new Error('Unsupported UI language');
  const rawTranslate = options.translate || (async texts => {
    const response = await translateBatch({ q: texts, source: 'en', target: language, format: 'text' });
    return response.translations.map(item => item?.translatedText);
  });
  const assertActive = () => {
    if (options.signal?.aborted) throw new Error('Build interrupted; checkpoint retained');
  };
  const translate = (texts, target) => { assertActive(); return abortable(rawTranslate(texts, target, options.signal), options.signal); };
  assertActive();
  const lock = await cache.acquireLock(`ui-pack:${uiSource.revision}:${language}`, 120);
  if (!lock.acquired) throw new Error('Another UI pack builder owns this language (interrupted old runs expire within 120 seconds; do not delete active locks)');
  let owned = true;
  const heartbeat = lock.renew ? setInterval(() => {
    lock.renew().then(ok => { if (!ok) owned = false; }).catch(() => { owned = false; });
  }, 30000) : null;
  heartbeat?.unref();
  try {
    const keys = uiPackKeys(language);
    const existing = await readUiPackObject(keys.final);
    const reused = completeUiPack(existing, language);
    const checkpoint = reused ? existing : await readUiPackObject(keys.partial);
    const translations = checkpoint?.revision === uiSource.revision && checkpoint.language === language && Array.isArray(checkpoint.translations)
      ? [...checkpoint.translations] : Array(uiSource.texts.length).fill(null);
    translations.length = uiSource.texts.length;
    if (!reused) {
      // Carry validated strings from the previously published revision. The
      // source list is sorted, so unchanged copy keeps its translation and only
      // added or edited strings reach the provider.
      const carried = uiTranslationMap(options.carry ?? await readUiPackObject(uiCarryKey(language)));
      if (carried.size) uiSource.texts.forEach((text, index) => {
        if (validUiText(text, translations[index])) return;
        const value = carried.get(text);
        if (validUiText(text, value)) translations[index] = value;
      });
    }
    // Authored brand spellings take precedence over both machine output and
    // previous-revision carry records. Never apply them to arbitrary content.
    const overrides = uiSource.overrides?.[language] || {};
    uiSource.texts.forEach((text, index) => {
      if (validUiText(text, overrides[text])) translations[index] = overrides[text];
    });
    const pack = { schemaVersion: 1, revision: uiSource.revision, language, translations };
    const failures = [];
    for (let start = 0; start < uiSource.texts.length;) {
      assertActive();
      if (!owned) throw new Error('UI pack generation lock lost');
      // Bound both item and character counts exactly as the batch API does.
      const indexes = [];
      let chars = 0;
      while (start < uiSource.texts.length && indexes.length < 50) {
        const text = uiSource.texts[start];
        if (validUiText(text, translations[start])) { start++; continue; }
        if (indexes.length && chars + text.length > 10000) break;
        indexes.push(start++); chars += text.length;
      }
      if (!indexes.length) continue;
      const texts = indexes.map(i => uiSource.texts[i]);
      const protectedTexts = texts.map(protectUiText);
      let values;
      try {
        values = language === 'en' ? texts : await translate(protectedTexts.map(item => item.text), language);
      } catch (error) {
        assertActive();
        // Preserve earlier checkpoints on an upstream outage; do not hammer an
        // unavailable provider once per source string.
        throw new Error(`Translation batch starting at source #${indexes[0]} failed: ${error.message}`);
      }
      for (let i = 0; i < texts.length; i++) {
        let value = language === 'en' ? values[i] : protectedTexts[i].restore(values?.[i]);
        if (!value) {
          try {
            value = await translateUiSpans(texts[i], language, translate);
          } catch (error) {
            assertActive();
            failures.push({ index: indexes[i], source: texts[i].slice(0, 160), reason: error.message });
            options.onWarning?.(failures.at(-1));
          }
        }
        if (validUiText(texts[i], value)) translations[indexes[i]] = value;
      }
      if (!owned) throw new Error('UI pack generation lock lost');
      assertActive();
      await writeUiPackObject(keys.partial, pack);
      onProgress({ completed: translations.filter(Boolean).length, total: uiSource.texts.length });
    }
    if (failures.length) throw new Error(`${failures.length} UI strings remain untranslated; valid translations saved for resume. First failure: source #${failures[0].index} ${JSON.stringify(failures[0].source)} — ${failures[0].reason}`);
    if (!owned || !completeUiPack(pack, language)) throw new Error('Incomplete UI pack');
    await writeUiPackObject(keys.final, pack, { compress: true, cacheControl: 'public, max-age=31536000, immutable' });
    assertActive();
    if (!owned) throw new Error('UI pack generation lock lost before manifest publication');
    // Record source→translation for the next revision. English needs no carry:
    // its pack is always its own source.
    if (language !== 'en') {
      await writeUiPackObject(uiCarryKey(language), { schemaVersion: 1, revision: uiSource.revision, language,
        texts: uiSource.texts, translations });
      assertActive();
      if (!owned) throw new Error('UI pack generation lock lost before manifest publication');
    }
    const manifest = { schemaVersion: 1, language, revision: uiSource.revision, totalTexts: uiSource.texts.length, bytes: Buffer.byteLength(JSON.stringify(pack)) };
    await writeUiPackObject(keys.manifest, manifest);
    return { ...manifest, reused };
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    await lock.release();
  }
}
