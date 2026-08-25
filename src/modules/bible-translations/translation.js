import { normalizeLanguage, translateMany } from '../../utils/translator.js';

const translateHeadingLists = async (lists, target) => {
  const entries = [];
  const translatedLists = lists.map((list) => {
    if (!Array.isArray(list)) return list;

    return list.map((item) => {
      if (!item || typeof item.heading !== 'string') return item;

      const translatedItem = { ...item };
      entries.push({
        heading: item.heading,
        setHeading: (heading) => { translatedItem.heading = heading; },
      });
      return translatedItem;
    });
  });

  if (entries.length) {
    const headings = await translateMany(entries.map((entry) => entry.heading), target);
    headings.forEach((heading, index) => entries[index]?.setHeading(heading));
  }

  return translatedLists;
};

export const translateChapterHeadings = async (data, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!data || target.toLowerCase() === 'en') return data;

  try {
    const [headings] = await translateHeadingLists([data.headings], target);
    return { ...data, headings };
  } catch (error) {
    console.warn(`[bible-translations] Heading translation to ${target} failed:`, error.message);
    return data;
  }
};

export const translateBookHeadings = async (data, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!data || target.toLowerCase() === 'en') return data;

  const chapterEntries = Object.entries(data.chapters || {});

  try {
    const translatedLists = await translateHeadingLists(
      chapterEntries.map(([, headings]) => headings),
      target,
    );
    const chapters = Object.fromEntries(
      chapterEntries.map(([chapter, headings], index) => [
        chapter,
        translatedLists[index] ?? headings,
      ]),
    );
    return { ...data, chapters };
  } catch (error) {
    console.warn(`[bible-translations] Heading translation to ${target} failed:`, error.message);
    return data;
  }
};
