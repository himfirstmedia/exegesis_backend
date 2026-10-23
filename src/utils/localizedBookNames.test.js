import { localizeBookNames } from './localizedBookNames.js';

describe('localizeBookNames', () => {
  it('replaces canonical and singular book names in translated prose', () => {
    expect(localizeBookNames('Psalm 105 opens with thanksgiving.', 'hi'))
      .toBe('भजन संहिता 105 opens with thanksgiving.');
    expect(localizeBookNames('Psalms 90–106 and 1 Chronicles 16:8–22', 'hi'))
      .toBe('भजन संहिता 90–106 and 1 इतिहास 16:8–22');
  });

  it('handles book aliases and multi-word names before shorter names', () => {
    expect(localizeBookNames('Song of Songs and Song of Solomon', 'hi'))
      .toBe('श्रेष्ठगीत and श्रेष्ठगीत');
    expect(localizeBookNames('Revelation of John and 1 John', 'hi'))
      .toBe('प्रकाशित वाक्य and 1 यूहन्ना');
  });

  it('does not change English output or split longer words', () => {
    expect(localizeBookNames('Psalm 105', 'en')).toBe('Psalm 105');
    expect(localizeBookNames('Markets and Actors', 'hi')).toBe('Markets and Actors');
  });
});
