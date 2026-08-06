import { getChapterJournalPrompts } from '../service.js';

describe('getChapterJournalPrompts', () => {
  it('returns up to 3 prompts for a valid book and chapter', async () => {
    const result = await getChapterJournalPrompts({
      bookName: 'Genesis',
      chapter: 1,
    });
    expect(result.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.length).toBeLessThanOrEqual(3);
    for (const p of result.data) {
      expect(typeof p.prompt).toBe('string');
      expect(p.prompt.length).toBeGreaterThan(0);
    }
  });

  it('tops up with general prompts when no chapter-specific prompts exist', async () => {
    // Use a book/chapter combination that is extremely unlikely to have
    // admin-curated prompts so the top-up path is exercised.
    const result = await getChapterJournalPrompts({
      bookName: 'Zephaniah',
      chapter: 999,
    });
    expect(result.status).toBe(200);
    expect(result.data.length).toBeLessThanOrEqual(3);
    // If nothing was found, the curated defaults guarantee >= 1 prompt.
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('always returns exactly 3 prompts (chapter-specific + general + curated defaults)', async () => {
    const result = await getChapterJournalPrompts({
      bookName: 'Genesis',
      chapter: 1,
    });
    expect(result.status).toBe(200);
    expect(result.data.length).toBe(3);
  });

  it('returns 400 when bookName is missing', async () => {
    const result = await getChapterJournalPrompts({ chapter: 1 });
    expect(result.status).toBe(400);
  });

  it('returns 400 when chapter is missing', async () => {
    const result = await getChapterJournalPrompts({ bookName: 'Genesis' });
    expect(result.status).toBe(400);
  });

  it('returns 400 when called with no params', async () => {
    const result = await getChapterJournalPrompts({});
    expect(result.status).toBe(400);
  });
});
