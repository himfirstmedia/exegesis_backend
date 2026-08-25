import { normalizeLanguage, translateMany } from '../../utils/translator.js';

const addText = (entries, value, setValue) => {
  if (typeof value === 'string' && value.trim()) {
    entries.push({ value, setValue });
  }
};

const addOptions = (record, entries) => {
  if (typeof record.optionsJson !== 'string') return;

  try {
    const options = JSON.parse(record.optionsJson);
    if (!Array.isArray(options)) return;

    const translatedOptions = [...options];
    options.forEach((option, index) => {
      addText(entries, option, value => {
        translatedOptions[index] = value;
        record.optionsJson = JSON.stringify(translatedOptions);
      });
    });
  } catch {
    // Preserve malformed stored options rather than changing the response shape.
  }
};

const translateEntries = async (entries, lang) => {
  if (!entries.length) return;
  const translated = await translateMany(entries.map(entry => entry.value), lang);
  translated.forEach((value, index) => entries[index]?.setValue(value));
};

export const translateTriviaQuestions = async (items, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!Array.isArray(items) || target.toLowerCase() === 'en') return items;

  const translatedItems = items.map(item => ({ ...item }));
  const entries = [];

  translatedItems.forEach(item => {
    addText(entries, item.question, value => { item.question = value; });
    addOptions(item, entries);
    addText(entries, item.explanation, value => { item.explanation = value; });
  });

  try {
    await translateEntries(entries, target);
    return translatedItems;
  } catch (error) {
    console.warn(`[trivia] Translation to ${target} failed:`, error.message);
    return items;
  }
};

export const translateTriviaQuestion = async (item, lang = 'en') => {
  if (!item) return item;
  const translated = await translateTriviaQuestions([item], lang);
  return translated[0];
};

export const translateSubmitResult = async (item, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!item || target.toLowerCase() === 'en') return item;

  const translated = { ...item };
  const entries = [];
  addText(entries, translated.correctAnswerText, value => { translated.correctAnswerText = value; });
  addText(entries, translated.explanation, value => { translated.explanation = value; });

  try {
    await translateEntries(entries, target);
    return translated;
  } catch (error) {
    console.warn(`[trivia] Translation to ${target} failed:`, error.message);
    return item;
  }
};

export const translateTodaysTrivia = async (item, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!item || target.toLowerCase() === 'en') return item;

  const translated = { ...item };
  const entries = [];
  ['question', 'answerA', 'answerB', 'answerC', 'answerD'].forEach(field => {
    addText(entries, translated[field], value => { translated[field] = value; });
  });

  try {
    await translateEntries(entries, target);
    return translated;
  } catch (error) {
    console.warn(`[trivia] Translation to ${target} failed:`, error.message);
    return item;
  }
};
