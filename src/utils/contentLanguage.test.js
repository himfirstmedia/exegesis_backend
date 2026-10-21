import {
  SOURCE_LANGUAGE,
  withContentLanguage,
} from './contentLanguage.js';

describe('contentLanguage marker', () => {
  test('marks a payload with the language its text is in', () => {
    expect(withContentLanguage({ title: 'Genèse' }, 'fr')).toEqual({
      title: 'Genèse',
      contentLanguage: 'fr',
    });
  });

  test('lowercases the language tag', () => {
    expect(withContentLanguage({ title: 'Genèse' }, 'FR')).toEqual({
      title: 'Genèse',
      contentLanguage: 'fr',
    });
  });

  test('keeps a script tag because zh-Hant and zh-Hans differ', () => {
    expect(withContentLanguage({ title: '創世記' }, 'zh-Hant').contentLanguage)
      .toBe('zh-hant');
    expect(withContentLanguage({ title: '创世记' }, 'zh-Hans').contentLanguage)
      .toBe('zh-hans');
  });

  test('marks every item of an array payload', () => {
    const marked = withContentLanguage([{ id: 1 }, { id: 2 }], 'es');
    expect(marked).toEqual([
      { id: 1, contentLanguage: 'es' },
      { id: 2, contentLanguage: 'es' },
    ]);
  });

  test('defaults to the source language when none is given', () => {
    expect(withContentLanguage({ title: 'Genesis' }).contentLanguage)
      .toBe(SOURCE_LANGUAGE);
  });

  test('leaves a non-object payload untouched', () => {
    expect(withContentLanguage(null, 'fr')).toBeNull();
    expect(withContentLanguage('text', 'fr')).toBe('text');
  });

  test('does not mutate the source payload', () => {
    const source = { title: 'Genesis' };
    withContentLanguage(source, 'fr');
    expect(source).toEqual({ title: 'Genesis' });
  });
});
