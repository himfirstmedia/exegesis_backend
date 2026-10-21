/**
 * contentLanguage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Marks a payload as holding text in a specific language.
 *
 * The app renders backend content directly. When the backend has already
 * translated a payload into the requested language, the app must NOT send
 * that text through the translation API again: the text is already in the
 * target language, so a second pass would re-translate it (degrading the
 * output) and burn a provider request on every screen open.
 *
 * To make that decidable, every payload the backend translates carries a
 * `contentLanguage` field holding the language its text is actually in:
 *
 *   contentLanguage: "en" → text is canonical English
 *   contentLanguage: "fr" → text is French
 *   absent            → treat as canonical English
 *
 * The field lives on the payload itself (inside `returnData`), not on the
 * response envelope, so it is available for single objects and for the
 * items of an array payload.
 */

/** Canonical source language for all authored content. */
export const SOURCE_LANGUAGE = 'en';

/**
 * Mark a payload as holding text in `language`.
 *
 * Arrays are marked item by item: JSON serialization drops custom
 * properties on arrays, so marking the array itself would not survive the
 * response.
 */
export const withContentLanguage = (payload, language) => {
  if (Array.isArray(payload)) {
    return payload.map((item) => withContentLanguage(item, language));
  }
  if (!payload || typeof payload !== 'object') return payload;
  return {
    ...payload,
    contentLanguage: String(language || SOURCE_LANGUAGE).trim().toLowerCase(),
  };
};
