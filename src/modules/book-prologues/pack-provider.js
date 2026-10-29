import { createFreeTranslationSession } from '../../../scripts/free-translation-session.mjs';

const configuredInterval = Number(process.env.BOOK_OVERVIEW_PACK_REQUEST_DELAY_MS);
// One shared governor for CLI/background workers and both free endpoints.
const session = createFreeTranslationSession({ intervalMs: Number.isFinite(configuredInterval) && configuredInterval >= 1000 ? configuredInterval : 1000 });

export function makeOverviewFreeProvider(primary, alternative) {
  const bind = ({ signal } = {}) => {
    const options = { fetch: session.fetch, onFailure: session.failure, onSuccess: session.success, signal, failFast: true };
    return Object.assign((texts, language) => primary(texts, language, () => {}, options), {
      retry: (texts, language) => alternative(texts, language, options),
    });
  };
  return Object.assign(bind(), { forBuild: bind, waitForCooldown: session.waitForCooldown });
}
