const asJsonList = value => {
  if (Array.isArray(value)) return JSON.stringify(value.map(String).map(item => item.trim()).filter(Boolean));
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return JSON.stringify(parsed.map(String).map(item => item.trim()).filter(Boolean));
  } catch {}
  return JSON.stringify(value.split('\n').map(item => item.replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean));
};

export const devotionList = value => {
  const serialized = asJsonList(value);
  return serialized ? JSON.parse(serialized) : [];
};

// The public contract uses devotional language while the backing columns retain
// their historical names so existing installations do not lose published data.
export const shapeDailyDevotion = row => {
  if (!row) return row;
  const {
    content,
    reflection,
    learnMore,
    application,
    verseIntroduction,
    backgroundAuthor,
    backgroundBook,
    backgroundContext,
    wordStudies,
    keyThemes,
    crossReferences,
    finalThoughts,
    takeaways,
    ...rest
  } = row;
  return {
    ...rest,
    explanation: row.explanation || content || '',
    reflectionQuestions: asJsonList(row.reflectionQuestions || reflection),
    prayer: row.prayer || learnMore || null,
    practicalApplications: asJsonList(row.practicalApplications),
    learningPoints: asJsonList(row.learningPoints || takeaways),
  };
};

export const devotionStorageFields = data => ({
  // Keep content populated for old clients and shared-study projection while
  // making explanation the canonical API field.
  content: data.explanation,
  explanation: data.explanation,
  reflection: asJsonList(data.reflectionQuestions),
  learnMore: data.prayer || null,
  practicalApplications: asJsonList(data.practicalApplications),
  takeaways: asJsonList(data.learningPoints),
});
