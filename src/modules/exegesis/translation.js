import { normalizeLanguage, translateMany } from '../../utils/translator.js';

export const translateSessionPrompts = async (session, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!session || target.toLowerCase() === 'en' || typeof session.lookPromptsJson !== 'string') {
    return session;
  }

  let prompts;
  try {
    prompts = JSON.parse(session.lookPromptsJson);
  } catch {
    return session;
  }

  if (!Array.isArray(prompts)) return session;

  const promptIndexes = [];
  const promptStrings = [];
  prompts.forEach((prompt, index) => {
    if (typeof prompt === 'string') {
      promptIndexes.push(index);
      promptStrings.push(prompt);
    }
  });

  if (!promptStrings.length) return session;

  try {
    const translations = await translateMany(promptStrings, target);
    const translatedPrompts = [...prompts];
    promptIndexes.forEach((promptIndex, translationIndex) => {
      if (typeof translations[translationIndex] === 'string') {
        translatedPrompts[promptIndex] = translations[translationIndex];
      }
    });

    return {
      ...session,
      lookPromptsJson: JSON.stringify(translatedPrompts),
    };
  } catch (error) {
    console.warn(`[exegesis] Prompt translation to ${target} failed:`, error.message);
    return session;
  }
};
