const { normalizeSource, mergeStudy, sourceHash, editionId } = require('./normalization.js');

const daily = (extra = {}) => ({ id: 1n, bookName: 'Genesis', chapter: 3n, verseNumber: 6n, verseEnd: 10n, bibleVersion: 'BSB', explanation: 'Original explanation', takeaways: '["First\\nsecond paragraph","Another"]', ...extra });

test('preserves ranges, source text, multiline takeaways and array order', () => {
  const result = normalizeSource('verse', daily());
  expect(result.status).toBe('LINKED');
  expect(result.payload.passage).toEqual({ bookId: 1, startChapter: 3, startVerse: 6, endChapter: 3, endVerse: 10 });
  expect(result.payload.study.takeaways).toEqual(['First\nsecond paragraph', 'Another']);
});

test('equivalent legacy and structured explanation formats resolve to the same key', () => {
  const a = normalizeSource('verse', daily({ bookName: 'Psalm', chapter: 46, verseNumber: 10, verseEnd: null, bibleVersion: 'Berean' }));
  const b = normalizeSource('explanation', { bookName: 'Psalms', chapter: 46, verseNumber: 10, bibleVersion: 'BSB', exegesis: { explanationText: 'Original explanation' }, studyMetadata: { takeaways: ['First\nsecond paragraph', 'Another'] } });
  expect(a.key).toBe(b.key);
  expect(mergeStudy(a.payload.study, b.payload.study).conflicts).toEqual([]);
  expect(editionId('NKJ')).toBe(editionId('NKJV'));
});

test('only fills absent values and never partially merges conflicting content', () => {
  const a = normalizeSource('verse', daily()).payload.study;
  const b = normalizeSource('verse', daily({ application: 'New application' })).payload.study;
  expect(mergeStudy(a, b).merged.application).toBe('New application');
  b.explanation = 'Different explanation';
  const result = mergeStudy(a, b);
  expect(result.conflicts).toEqual(['explanation']);
  expect(result.merged.application).toBeNull();
});

test('does not silently discard malformed JSON or a verse-zero cross reference', () => {
  expect(normalizeSource('verse', daily({ takeaways: '[broken' })).status).toBe('INVALID');
  const result = normalizeSource('explanation', { ...daily(), crossReferences: [{ bookName: 'Isaiah', chapter: 12, verseNumber: 0 }] });
  expect(result.status).toBe('INVALID');
  expect(result.issues).toContain('passage: invalid or incomplete reference');
});

test('preserves compound Strong’s identities without inventing dictionary definitions', () => {
  const result = normalizeSource('verse', daily({ wordStudies: "I am God | ʾănî – Strong's H589/H430 | The covenant God" }));
  expect(result.status).toBe('LINKED');
  expect(result.payload.study.words[0]).toMatchObject({ strongsIds: ['H589', 'H430'], contextualMeaning: 'The covenant God' });
});

test.each([
  ['G11', ['G11']],
  ['g11', ['G11']],
  ['H0853', ['H0853']],
  ['H430a', ['H430A']],
  ['H589/H430', ['H589', 'H430']],
])('accepts real-world Strong’s variant %s', (strongsId, expected) => {
  const result = normalizeSource('verse', daily({ wordStudies: [{ surfaceText: 'Word', strongsId, customDefinition: 'Meaning' }] }));
  expect(result.status).toBe('LINKED');
  expect(result.payload.study.words[0].strongsIds).toEqual(expected);
});

test('parses en-dash references, quotations and commentary without overwriting Scripture', () => {
  const result = normalizeSource('verse', daily({ crossReferences: 'Psalm 46:1 – Keep the original quotation' }));
  expect(result.status).toBe('LINKED');
  expect(result.payload.study.crossReferences[0].quotationOverride).toBe('Keep the original quotation');
});

test('a devotion without a passage remains valid standalone content', () => {
  expect(normalizeSource('devotion', { title: 'A devotion', content: 'Original body' }).status).toBe('NO_PASSAGE');
});

test('source fingerprint ignores only migration links and detects editorial changes', () => {
  expect(sourceHash(daily())).toBe(sourceHash(daily({ sharedStudyId: 42n })));
  expect(sourceHash(daily())).not.toBe(sourceHash(daily({ explanation: 'Changed' })));
});
