import { normalizeLanguage, translateText } from "../utils/translator.js";

/** Never hold an API response for more than this long on message translation. */
const MESSAGE_BUDGET_MS = 2500;

const translateWithinBudget = async (text, lang) => {
  let timer;
  try {
    return await Promise.race([
      translateText(text, lang),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(text), MESSAGE_BUDGET_MS);
      }),
    ]);
  } catch {
    return text;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Translate the `returnMessage` envelope into the language the client asked
 * for. Controllers keep writing short English messages; this wrapper makes
 * them readable for non-English users without duplicating every string.
 *
 * Only JSON envelopes are touched. Payload text is handled by each module's
 * own localizer because it needs domain-specific field lists.
 */
export const localizeResponseMessage = ({ onlyErrors = false } = {}) => (req, res, next) => {
  // The translation endpoints are called on every device-side fallback; adding
  // an envelope translation there would double provider load for no benefit.
  if (req.path === "/translation" || req.path.startsWith("/translation/")) {
    return next();
  }
  const lang = normalizeLanguage(req.body?.lang || req.query?.lang || "en");
  if (lang === "en") return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (
      body &&
      typeof body === "object" &&
      typeof body.returnMessage === "string" &&
      body.returnMessage.trim() &&
      // Modules that already localized their message can opt out.
      body.messageLanguage !== lang &&
      (!onlyErrors || res.statusCode >= 400)
    ) {
      // Errors are swallowed so a provider outage never blocks the response.
      return translateWithinBudget(body.returnMessage, lang).then((message) =>
        originalJson({ ...body, returnMessage: message }),
      );
    }
    return originalJson(body);
  };
  next();
};
