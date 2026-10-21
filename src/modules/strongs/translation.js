import { normalizeLanguage, translateMany } from '../../utils/translator.js';
import {
  withContentLanguage,
} from '../../utils/contentLanguage.js';

const STRONGS_FIELDS = new Set([
  'shortDefinition',
  'fullDefinition',
  'adminExplanation',
  'verseStudyNote',
  'customDefinition',
  'themeName',
]);

const translateFields = async (value, fields, lang) => {
  const target = normalizeLanguage(lang);
  if (target.toLowerCase() === 'en' || value == null) return value;

  const texts = [];
  const collect = (current) => {
    if (Array.isArray(current)) {
      current.forEach(collect);
      return;
    }
    if (!current || typeof current !== 'object') return;
    for (const [key, child] of Object.entries(current)) {
      if (fields.has(key) && typeof child === 'string' && child.length > 0) texts.push(child);
      else collect(child);
    }
  };
  collect(value);
  if (texts.length === 0) return value;

  try {
    const translated = await translateMany(texts, target, { throwOnFailure: true });
    let index = 0;
    const rebuild = (current) => {
      if (Array.isArray(current)) return current.map(rebuild);
      if (!current || typeof current !== 'object') return current;

      let changed = false;
      const result = {};
      for (const [key, child] of Object.entries(current)) {
        const next = fields.has(key) && typeof child === 'string' && child.length > 0
          ? translated[index++]
          : rebuild(child);
        result[key] = next;
        changed ||= next !== child;
      }
      return changed ? result : current;
    };
    return withContentLanguage(rebuild(value), target);
  } catch (error) {
    console.warn(`[strongs] Translation to ${target} failed:`, error.message);
    return value;
  }
};

export const translateStrongsData = async (data, lang) => {
  const target = normalizeLanguage(lang);
  if (!data || target.toLowerCase() === 'en') {
    return data;
  }
  const translated = await translateFields(data, STRONGS_FIELDS, target);
  return translated;
};

export const translateBibleTopics = async (data, lang) => {
  const target = normalizeLanguage(lang);
  if (!data || target.toLowerCase() === 'en') {
    return data;
  }

  const topics = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [data];
  const texts = topics.flatMap((topic) => ['topicName', 'description']
    .map((field) => topic?.[field])
    .filter((text) => typeof text === 'string' && text.length > 0));
  if (texts.length === 0) return withContentLanguage(data, target);

  try {
    const translated = await translateMany(texts, target, { throwOnFailure: true });
    let index = 0;
    const translatedTopics = topics.map((topic) => {
      let changed = false;
      const result = { ...topic };
      for (const field of ['topicName', 'description']) {
        if (typeof topic?.[field] === 'string' && topic[field].length > 0) {
          result[field] = translated[index++];
          changed = true;
        }
      }
      return changed ? result : topic;
    });

    if (Array.isArray(data)) return withContentLanguage(translatedTopics, target);
    if (Array.isArray(data.data)) {
      return withContentLanguage({ ...data, data: translatedTopics }, target);
    }
    return withContentLanguage(translatedTopics[0], target);
  } catch (error) {
    console.warn(`[strongs] Translation to ${target} failed:`, error.message);
    return data;
  }
};
