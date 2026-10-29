import { splitReaderText } from '../reader-stream/plan.js';
import { validUiText } from '../text-to-text-translation/ui-pack-data.js';
import { protectUiText, translateUiSpans, abortable } from '../text-to-text-translation/ui-pack-translation.js';
import { localizeBookNames } from '../../utils/localizedBookNames.js';
import { overviewTranslationIssue } from './pack-translation.js';
import { safeFreeProviderReason } from '../../../scripts/free-translation-session.mjs';

/** Bounded per-chunk recovery. Never turn failed prose into an English fallback. */
export async function recoverOverviewTranslation(job, source, language, translate, options = {}) {
  const check = () => {
    options.check?.();
    if (options.signal?.aborted) throw new Error('Overview build interrupted; checkpoints retained');
  };
  const call = (texts, target) => { check(); return abortable(translate(texts, target), options.signal); };
  const one = async text => {
    const protectedText = protectUiText(text);
    const response = await call([protectedText.text], language);
    let value = protectedText.restore(response?.[0]);
    // Literal-span recovery is useful for actual interpolation tokens, not an
    // unchanged request that merely returned an empty string.
    if (!value && protectedText.text !== text) value = await translateUiSpans(text, language, call);
    return localizeBookNames(value, language);
  };
  let issue = options.reason || 'EMPTY_TRANSLATION';
  for (let attempt = 1; attempt <= 3; attempt++) {
    check();
    if (attempt > 1) {
      let timer;
      try { await abortable(new Promise(resolve => { timer = setTimeout(resolve, (options.retryDelayMs ?? 750) * 2 ** (attempt - 2)); }), options.signal); }
      finally { clearTimeout(timer); }
    }
    options.onRetry?.({ attempt, reason: issue });
    try {
      const chunks = attempt === 1 ? [{ text: job.text, separator: '' }] : splitReaderText(job.text, attempt === 2 ? 250 : 80);
      const translated = [];
      for (const chunk of chunks) {
        const value = await one(chunk.text);
        const chunkIssue = overviewTranslationIssue({ ...job, text: chunk.text }, value, source, language);
        if (chunkIssue !== null) { issue = chunkIssue; break; }
        translated.push(`${translated.length ? chunk.separator : ''}${value}`);
      }
      if (translated.length === chunks.length && translated.length) {
        const value = translated.join('');
        if (overviewTranslationIssue(job, value, source, language) === null) return value;
      }
      // A short contrast heading can be echoed wholesale (e.g. Tagalog
      // "Pride versus humility"). Translate its semantic parts separately;
      // never apply word-by-word recovery to paragraphs or Scripture.
      if (issue === 'UNCHANGED_SOURCE' && job.text.length <= 120 &&
          ['mainThemes', 'keyTheme', 'structure'].includes(job.field) && /\s+versus\s+/i.test(job.text)) {
        const parts = job.text.split(/(\s+versus\s+)/i);
        const values = [];
        for (let i = 0; i < parts.length; i++) {
          const original = parts[i];
          const value = await one(original.trim());
          if (!validUiText(original.trim(), value) || (i % 2 === 0 && overviewTranslationIssue({ ...job, text: original.trim() }, value, source, language) !== null)) break;
          values.push(`${original.match(/^\s*/)[0]}${value.trim()}${original.match(/\s*$/)[0]}`);
        }
        const value = values.join('');
        if (values.length === parts.length && overviewTranslationIssue(job, value, source, language) === null) return value;
      }
    } catch (error) {
      check(); // Cancellation/lease loss must escape, not consume retries.
      if (error?.code === 'FREE_PROVIDER_COOLDOWN') throw error;
      issue = safeFreeProviderReason(error);
    }
  }
  options.onFailure?.({ reason: issue });
  return null;
}
