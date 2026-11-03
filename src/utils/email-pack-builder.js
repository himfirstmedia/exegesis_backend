// Offline/build-time generation for localized transactional-email copy. Runtime
// routes never import this builder; the email renderer only reads published
// packs. Structure mirrors ui-pack-builder.js so carry/reuse behaviour is
// identical to the other pack types.
import { cache } from "../services/cacheService.js";
import {
  readUiPackObject,
  writeUiPackObject,
} from "../services/objectStorage.js";
import { translateBatch } from "../modules/text-to-text-translation/service.js";
import {
  protectUiText,
  translateUiSpans,
  abortable,
} from "../modules/text-to-text-translation/ui-pack-translation.js";
import {
  emailSource,
  emailLanguages,
  emailPackKeys,
  emailCarryKey,
  emailTranslationMap,
  validEmailText,
  completeEmailPack,
} from "./email-pack-data.js";

export async function buildEmailPack(
  language,
  onProgress = () => {},
  options = {},
) {
  if (!emailLanguages.includes(language)) {
    throw new Error("Unsupported email language");
  }
  const rawTranslate =
    options.translate ||
    (async (texts) => {
      const response = await translateBatch({
        q: texts,
        source: "en",
        target: language,
        format: "text",
      });
      return response.translations.map((item) => item?.translatedText);
    });
  const assertActive = () => {
    if (options.signal?.aborted) {
      throw new Error("Build interrupted; checkpoint retained");
    }
  };
  const translate = (texts, target) => {
    assertActive();
    return abortable(rawTranslate(texts, target, options.signal), options.signal);
  };

  assertActive();
  const lock = await cache.acquireLock(
    `email-pack:${emailSource.revision}:${language}`,
    120,
  );
  if (!lock.acquired) {
    throw new Error(
      "Another email pack builder owns this language (interrupted old runs expire within 120 seconds; do not delete active locks)",
    );
  }
  let owned = true;
  const heartbeat = lock.renew
    ? setInterval(() => {
        lock
          .renew()
          .then((ok) => {
            if (!ok) owned = false;
          })
          .catch(() => {
            owned = false;
          });
      }, 30000)
    : null;
  heartbeat?.unref();
  try {
    const keys = emailPackKeys(language);
    const existing = await readUiPackObject(keys.final);
    const reused = !options.force && completeEmailPack(existing, language);
    const checkpoint = reused
      ? existing
      : options.force
        ? null
        : await readUiPackObject(keys.partial);
    const translations =
      checkpoint?.revision === emailSource.revision &&
      checkpoint.language === language &&
      Array.isArray(checkpoint.translations)
        ? [...checkpoint.translations]
        : Array(emailSource.texts.length).fill(null);
    translations.length = emailSource.texts.length;
    if (!reused && !options.force) {
      // Carry validated strings from the previously published revision so only
      // added or edited copy reaches the provider.
      const carried = emailTranslationMap(
        options.carry ?? (await readUiPackObject(emailCarryKey(language))),
      );
      if (carried.size) {
        emailSource.texts.forEach((text, index) => {
          if (validEmailText(text, translations[index])) return;
          const value = carried.get(text);
          if (validEmailText(text, value)) translations[index] = value;
        });
      }
    }
    const pack = {
      schemaVersion: 1,
      revision: emailSource.revision,
      language,
      translations,
    };
    const failures = [];
    for (let start = 0; start < emailSource.texts.length; ) {
      assertActive();
      if (!owned) throw new Error("Email pack generation lock lost");
      const indexes = [];
      let chars = 0;
      while (start < emailSource.texts.length && indexes.length < 50) {
        const text = emailSource.texts[start];
        if (validEmailText(text, translations[start])) {
          start++;
          continue;
        }
        if (indexes.length && chars + text.length > 10000) break;
        indexes.push(start++);
        chars += text.length;
      }
      if (!indexes.length) continue;
      const texts = indexes.map((index) => emailSource.texts[index]);
      const protectedTexts = texts.map(protectUiText);
      let values;
      try {
        values =
          language === "en"
            ? texts
            : await translate(
                protectedTexts.map((item) => item.text),
                language,
              );
      } catch (error) {
        assertActive();
        throw new Error(
          `Translation batch starting at source #${indexes[0]} failed: ${error.message}`,
        );
      }
      for (let i = 0; i < texts.length; i++) {
        let value =
          language === "en"
            ? values[i]
            : protectedTexts[i].restore(values?.[i]);
        if (!value) {
          try {
            value = await translateUiSpans(texts[i], language, translate);
          } catch (error) {
            assertActive();
            failures.push({
              index: indexes[i],
              source: texts[i].slice(0, 160),
              reason: error.message,
            });
            options.onWarning?.(failures.at(-1));
          }
        }
        if (validEmailText(texts[i], value)) translations[indexes[i]] = value;
      }
      if (!owned) throw new Error("Email pack generation lock lost");
      assertActive();
      await writeUiPackObject(keys.partial, pack);
      onProgress({
        completed: translations.filter(Boolean).length,
        total: emailSource.texts.length,
      });
    }
    if (failures.length) {
      throw new Error(
        `${failures.length} email strings remain untranslated; valid translations saved for resume. First failure: source #${failures[0].index} ${JSON.stringify(failures[0].source)} — ${failures[0].reason}`,
      );
    }
    if (!owned || !completeEmailPack(pack, language)) {
      throw new Error("Incomplete email pack");
    }
    await writeUiPackObject(keys.final, pack, {
      compress: true,
      cacheControl: "public, max-age=31536000, immutable",
    });
    assertActive();
    if (!owned) throw new Error("Email pack generation lock lost before manifest publication");
    if (language !== "en") {
      await writeUiPackObject(emailCarryKey(language), {
        schemaVersion: 1,
        revision: emailSource.revision,
        language,
        texts: emailSource.texts,
        translations,
      });
      assertActive();
      if (!owned) throw new Error("Email pack generation lock lost before manifest publication");
    }
    const manifest = {
      schemaVersion: 1,
      language,
      revision: emailSource.revision,
      totalTexts: emailSource.texts.length,
      bytes: Buffer.byteLength(JSON.stringify(pack)),
    };
    await writeUiPackObject(keys.manifest, manifest);
    return { ...manifest, reused };
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    await lock.release();
  }
}
