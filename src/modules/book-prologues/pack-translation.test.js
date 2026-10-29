import { overviewTranslationIssue } from './pack-translation.js';

const source = { author: 'Moses', keyPeople: ['Adam and Eve', 'Abraham and Sarah', 'Isaac and Rebekah', 'Jacob and Esau', 'Joseph'] };
const job = (text, field = 'structure', key = 'title') => ({ text, field, key });
test.each(['fr', 'de', 'fil', 'id', 'ro'])('accepts unchanged metadata-derived person names in %s', language => {
  for (const name of ['Abraham', 'Isaac', 'Jacob', 'Joseph']) expect(overviewTranslationIssue(job(name), name, source, language)).toBeNull();
});
test('French name-only genealogy chains are valid without forcing a fake translation', () => {
  const text = 'Abraham → Isaac → Jacob → Joseph';
  expect(overviewTranslationIssue(job(text, 'summary', 'summary'), text, source, 'fr')).toBeNull();
});
test('ordinary unchanged prose, unknown names and English connectives are still rejected', () => {
  for (const text of ['Abraham trusts God and follows his calling.', 'Creation', 'Unknown Person', 'Abraham and Sarah']) {
    expect(overviewTranslationIssue(job(text), text, source, 'fr')).toBe('UNCHANGED_SOURCE');
  }
  expect(overviewTranslationIssue(job('Abraham'), 'Abraham', { keyPeople: [] }, 'fr')).toBe('UNCHANGED_SOURCE');
});
test('empty values and altered placeholders remain invalid', () => {
  expect(overviewTranslationIssue(job('Abraham'), '', source, 'fr')).toBe('EMPTY_TRANSLATION');
  expect(overviewTranslationIssue(job('About {name}'), 'À propos de {nom}', source, 'fr')).toBe('ALTERED_PLACEHOLDERS');
});
