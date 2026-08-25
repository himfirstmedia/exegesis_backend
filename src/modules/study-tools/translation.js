import { normalizeLanguage, translateMany } from '../../utils/translator.js';

const addText = (entries, value, setValue) => {
  if (typeof value === 'string' && value.trim()) {
    entries.push({ value, setValue });
  }
};

export const translateStudyTools = async (tools, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!Array.isArray(tools) || target.toLowerCase() === 'en') return tools;

  const entries = [];
  const translated = tools.map((tool) => {
    const nextTool = { ...tool };
    addText(entries, tool.label, (value) => { nextTool.label = value; });
    addText(entries, tool.description, (value) => { nextTool.description = value; });

    if (Array.isArray(tool.studyToolWords)) {
      nextTool.studyToolWords = tool.studyToolWords.map((word) => {
        const nextWord = { ...word };
        addText(entries, word.adminExplanation, (value) => { nextWord.adminExplanation = value; });

        if (word.strongs && typeof word.strongs === 'object') {
          const nextStrongs = { ...word.strongs };
          nextWord.strongs = nextStrongs;
          addText(entries, word.strongs.shortDefinition, (value) => { nextStrongs.shortDefinition = value; });
          addText(entries, word.strongs.fullDefinition, (value) => { nextStrongs.fullDefinition = value; });
          addText(entries, word.strongs.adminExplanation, (value) => { nextStrongs.adminExplanation = value; });
        }

        return nextWord;
      });
    }

    return nextTool;
  });

  if (!entries.length) return translated;

  try {
    const translations = await translateMany(entries.map((entry) => entry.value), target);
    entries.forEach((entry, index) => {
      if (typeof translations[index] === 'string') entry.setValue(translations[index]);
    });
    return translated;
  } catch (error) {
    console.warn(`[study-tools] Translation to ${target} failed:`, error.message);
    return tools;
  }
};
