import { readFileSync } from 'node:fs';
import { buildVerseIndex, parseExplanationDocument } from './verseExplanationImport.js';
import { formatExplanationPreview } from './verseExplanationPreview.js';
import { extractExplanationPdfText } from './verseExplanationPdf.js';

const isVerse = buildVerseIndex(readFileSync(`${__dirname}/../bible-translations/Holy-Bible-XML-Format/EnglishBereanBible.xml`, 'utf8'));
const document = (verse = 10) => `Section1. Mention the Verse
Ecclesiastes 6:${verse} (BSB)
The printed verse text in the document.
________________
Section2. Explanation
Solomon describes how the Creator knows our limits.

This is a second paragraph.
Application
Trust God with the future.
Section3. Learn More
Practical Introduction
Many people struggle with uncertainty.
Background
Author
Solomon reflects on wisdom.
Book
Ecclesiastes explores the meaning of life.
Context
The chapter describes human limitations.
Detailed Strong’s Concordance Word Study
Named (H7121 – Qara)
Meaning: To call or name.
Biblical Significance: Naming signifies authority.
Contextual Meaning: God knows creation.
Spiritual Insight: We can trust God.
1 Practical Applications for Today
1. Act with humility
Ask for help instead of relying on yourself.
Biblical Insights and Cross References
Key Themes
* Trust
* Wisdom
Cross References
Psalm 115:3 (BSB)
Our God is in heaven; He does as He pleases.
Insight: God is sovereign.
Job 9:32–33 (BSB)
They cannot meet as equals.
Insight: God's wisdom exceeds ours.
Final Thoughts
Let trust guide your choices.
1 Takeaways
1. Trust God
His wisdom is greater than ours.`;

test('extracts the editor fields, Strong’s labels and cross-reference ranges', () => {
  const [entry] = parseExplanationDocument(document().replaceAll('\n', '\r\n'), { isVerse });
  expect(entry).toMatchObject({
    bookName: 'Ecclesiastes', chapter: 6, verseNumber: 10, bibleVersion: 'BSB', createOnly: true,
    exegesis: { explanationText: expect.stringContaining('\n\nThis is a second paragraph.'), applicationText: 'Trust God with the future.' },
    studyMetadata: { backgroundAuthor: 'Solomon reflects on wisdom.', takeaways: ['Trust God\n\nHis wisdom is greater than ours.'] },
    wordStudies: [{ surfaceText: 'Named - Qara', strongsId: 'H7121', customDefinition: expect.stringContaining('Spiritual Insight:') }],
    practicalApps: [{ applicationText: 'Act with humility\n\nAsk for help instead of relying on yourself.' }],
  });
  expect(entry.crossReferences).toEqual([
    expect.objectContaining({ bookName: 'Psalms', chapter: 115, verseNumber: 3, verseEnd: null }),
    expect.objectContaining({ bookName: 'Job', chapter: 9, verseNumber: 32, verseEnd: 33 }),
  ]);
});

test.each(['BSB', '(BSB)', '— Berean Standard Bible'])('accepts mixed document headings with the %s edition label', edition => {
  const judges = document().replace('Ecclesiastes 6:10 (BSB)', `Judges 1:1 ${edition}`)
    .replace('Section2. Explanation', 'Section Section 2. Explanation')
    .replace('Author\nSolomon', 'Author; Solomon')
    .replace('Named (H7121 – Qara)', 'LORD — H3068 — YHWH')
    .replace(/Psalm 115:3 \(BSB\)[\s\S]+?(?=\nFinal Thoughts)/,
      'Psalm 115:3\nOur God is in heaven; He does as He pleases.This describes God’s authority.\n' +
      'Job 9:32–33\nJob describes the need for a mediator.');
  const [entry] = parseExplanationDocument(judges, { isVerse, range: 'Judges 1:1' });
  expect(entry).toMatchObject({
    bibleVersion: 'BSB',
    studyMetadata: { backgroundAuthor: 'Solomon reflects on wisdom.' },
    wordStudies: [{ surfaceText: 'LORD - YHWH', strongsId: 'H3068' }],
    crossReferences: [
      { referenceText: 'Our God is in heaven; He does as He pleases.', commentary: 'This describes God’s authority.' },
      { referenceText: '', commentary: 'Job describes the need for a mediator.' },
    ],
  });
});

test.each(['Cross Reference', 'Cross References', 'Cross Reference 1'])('parses the %s heading with labeled BSB quotations', heading => {
  const text = document()
    .replace('Practical Introduction', 'VerseIntroduction')
    .replace('1 Practical Applications for Today', '1. Practical Application')
    .replace('Key Themes', 'Key Theme')
    .replace('\nCross References\n', `\n${heading}\n`)
    .replace('Psalm 115:3 (BSB)\nOur', 'Psalm 115:3\nBSB: Our')
    .replace('Final Thoughts', '.Final Thought')
    .replace('1 Takeaways', '1 Takeaway');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.crossReferences[0]).toMatchObject({
    referenceText: 'Our God is in heaven; He does as He pleases.',
    commentary: 'God is sovereign.',
  });
});

test('recovers a misplaced Author delimiter and retains both IDs in a slash-separated heading', () => {
  const text = document()
    .replace('Ecclesiastes 6:10 (BSB)', 'Genesis 7:13 (BSB)')
    .replace('Author\nSolomon reflects on wisdom.', '• Autho:r Moses wrote the Book of Genesis.')
    .replace('Named (H7121 – Qara)', "• Living Thing — remes (Strong's H7431) / chayyah (Strong's H2416)");
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.studyMetadata.backgroundAuthor).toBe('Moses wrote the Book of Genesis.');
  expect(entry.wordStudies[0]).toMatchObject({
    surfaceText: 'Living Thing - remes / chayyah', strongsId: 'H7431/H2416',
  });
});

test('accepts both Genesis edition labels and preserves Strong’s IDs mentioned in prose', () => {
  const definition = 'Ben (H1121) means "son." Elohim (H430) refers to God.';
  const first = document().replace('Ecclesiastes 6:10 (BSB)', 'Genesis 6:1 (BSB)');
  const second = document()
    .replace('Ecclesiastes 6:10 (BSB)', 'Genesis 6:2 BSB')
    .replace('Detailed Strong’s Concordance Word Study', 'Strong Concordance Word Study')
    .replace(/Named \(H7121[^]*?(?=1 Practical Applications)/,
      `• Sons of God — benê hāʾĕlōhîm (Strong's H1121, H430)\n${definition}\nSee also Elohim (H430)\n` +
      "• One Hundred Twenty — mēʾâ (Strong's H3967) and ʿeśrîm (Strong's H6242)\nThe number reflects an appointed limit.\n")
    .replace('1 Practical Applications for Today', '5 – Practical Applications for Today');
  const entries = parseExplanationDocument(`${first}\n\n${second}`, { isVerse, range: 'Genesis 6:1–2' });
  expect(entries.map(({ verseNumber, bibleVersion }) => [verseNumber, bibleVersion])).toEqual([[1, 'BSB'], [2, 'BSB']]);
  expect(entries[1].practicalApps).toHaveLength(1);
  expect(entries[1].wordStudies).toEqual([
    { surfaceText: 'Sons of God - benê hāʾĕlōhîm', strongsId: 'H1121/H430', sortOrder: 0,
      customDefinition: `${definition}\nSee also Elohim (H430)` },
    { surfaceText: 'One Hundred Twenty - mēʾâ and ʿeśrîm', strongsId: 'H3967/H6242', sortOrder: 1,
      customDefinition: 'The number reflects an appointed limit.' },
  ]);
});

test('preserves a word-study concept explicitly identified as having no single original-language word', () => {
  const note = "Though not represented by a single Hebrew word in this verse, the concept reflects God's deliverance.";
  const text = document().replace('1 Practical Applications', `• Escape — ${note}\nGod provides refuge.\n1 Practical Applications`);
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.wordStudies[1]).toEqual({
    surfaceText: 'Escape', strongsId: null, customDefinition: `${note}\nGod provides refuge.`, sortOrder: 1,
  });
  expect(formatExplanationPreview([entry])).not.toContain('Escape (null)');
  expect(() => parseExplanationDocument(text.replace(note, 'A word without metadata.'), { isVerse }))
    .toThrow('A Strong’s heading is missing its ID: • Escape');
});

test('keeps numbered comma-separated Strong’s data in the correct fields', () => {
  const text = document().replace('Ecclesiastes 6:10 (BSB)', 'Judges 3:17 — Berean Standard Bible')
    .replace('Named (H7121 – Qara)', '1. Brought — H7126, Qarab')
    .replace('Meaning: To call or name.', 'To bring near or present.')
    .replace('1 Practical Applications for Today', '2. Named — H7121, H8034, Qara Shem\nA second definition.\n1 Practical Applications for Today');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.wordStudies).toEqual([
    { surfaceText: 'Brought - Qarab', strongsId: 'H7126', customDefinition: expect.stringContaining('To bring near or present.'), sortOrder: 0 },
    { surfaceText: 'Named - Qara Shem', strongsId: 'H7121/H8034', customDefinition: 'A second definition.', sortOrder: 1 },
  ]);
});

test('keeps an inline Strong’s definition separate from the transliteration', () => {
  const text = document().replace(
    /Named \(H7121[^]*?(?=1 Practical Applications)/,
    "* Strong — H2388 — chazaq: Meaning: To be strong. Context: Israel gained strength.\n" +
    "* Drive Out — H3423 — yarash: Meaning: To dispossess.\nExplanation: They did not remove the inhabitants.\n",
  );
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.wordStudies).toEqual([
    { surfaceText: 'Strong - chazaq', strongsId: 'H2388', sortOrder: 0,
      customDefinition: 'chazaq\nMeaning: To be strong. Context: Israel gained strength.' },
    { surfaceText: 'Drive Out - yarash', strongsId: 'H3423', sortOrder: 1,
      customDefinition: 'yarash\nMeaning: To dispossess.\nExplanation: They did not remove the inhabitants.' },
  ]);
});

test('recovers a missing book number only when the quotation matches an exact BSB verse', () => {
  const text = document().replace(/Psalm 115:3 \(BSB\)[\s\S]+?(?=\nJob 9:32)/,
    'Corinthians 10:12\nSo the one who thinks he is standing firm should be careful not to fall.This verse warns about overconfidence.');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.crossReferences[0]).toMatchObject({
    bookName: '1 Corinthians', chapter: 10, verseNumber: 12, commentary: 'This verse warns about overconfidence.',
  });
  expect(() => parseExplanationDocument(text.replace('So the one who thinks he is standing firm should be careful not to fall.', 'Be careful.'), { isVerse }))
    .toThrow('Invalid Bible reference: Corinthians 10:12');
});

test('imports clearly titled unnumbered lists regardless of the count in the section title', () => {
  const text = document().replace('1 Practical Applications', '5 Practical Applications')
    .replace('1. Act with humility', 'Act With Humility')
    .replace('1. Trust God', 'Trust God');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.practicalApps[0].applicationText).toBe('Act With Humility\n\nAsk for help instead of relying on yourself.');
  expect(entry.studyMetadata.takeaways[0]).toBe('Trust God\n\nHis wisdom is greater than ours.');
});

test('preserves sentence-case practical applications with mixed bullets and numbers', () => {
  const text = document().replace('Ecclesiastes 6:10 (BSB)', 'Genesis 7:1 (BSB)')
    .replace('1 Practical Applications for Today', '5 Practical Applications for Today')
    .replace('1. Act with humility', "* Respond immediately to God's invitation.")
    .replace('Biblical Insights and Cross References',
      '• Pursue righteousness through faith.\nLet faith shape your choices.\n' +
      '4) Stand faithfully in your generation.\nEncourage others by example.\nBiblical Insights and Cross References');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.practicalApps).toEqual([
    { applicationText: "Respond immediately to God's invitation.\n\nAsk for help instead of relying on yourself.", sortOrder: 0 },
    { applicationText: 'Pursue righteousness through faith.\n\nLet faith shape your choices.', sortOrder: 1 },
    { applicationText: 'Stand faithfully in your generation.\n\nEncourage others by example.', sortOrder: 2 },
  ]);
  expect(() => parseExplanationDocument(text.replace('Let faith shape your choices.\n', ''), { isVerse }))
    .toThrow('Missing text for practical applications item 2.');
});

test('keeps all practical applications and takeaways in source order even when numbering skips', () => {
  const text = document().replace('1 Practical Applications', '5 Practical Applications')
    .replace('Biblical Insights and Cross References', '3. Keep going\nStay faithful.\nBiblical Insights and Cross References')
    .replace('1 Takeaways', '3 Takeaways').replace('1. Trust God', '2. Trust God');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.practicalApps).toEqual([
    { applicationText: 'Act with humility\n\nAsk for help instead of relying on yourself.', sortOrder: 0 },
    { applicationText: 'Keep going\n\nStay faithful.', sortOrder: 1 },
  ]);
  expect(entry.studyMetadata.takeaways).toEqual(['Trust God\n\nHis wisdom is greater than ours.']);
  expect(() => parseExplanationDocument(text.replace('Stay faithful.\n', ''), { isVerse }))
    .toThrow('Missing text for practical applications item 2.');
});

test('preserves word studies and themes when their section titles are omitted', () => {
  const text = document()
    .replace('Detailed Strong’s Concordance Word Study\nNamed (H7121 – Qara)', 'Named — H7121: Qara')
    .replace('Key Themes\n', '');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry.studyMetadata.backgroundContext).toBe('The chapter describes human limitations.');
  expect(entry.wordStudies[0]).toMatchObject({ surfaceText: 'Named - Qara', strongsId: 'H7121' });
  expect(entry.themes.map(theme => theme.themeName)).toEqual(['Trust', 'Wisdom']);
});

test('rejects invalid BSB references, including the requested range and cross references', () => {
  expect(() => parseExplanationDocument(document(13), { isVerse })).toThrow('Ecclesiastes 6:13 does not exist in BSB');
  expect(() => parseExplanationDocument(document(), { isVerse, range: 'Ecclesiastes 6:10-15' })).toThrow('does not exist in BSB');
  expect(() => parseExplanationDocument(document().replace('Job 9:32–33', 'Ecclesiastes 6:15'), { isVerse })).toThrow('Cross reference does not exist in BSB');
});

test('accepts the Numbers Google Docs format, including bare edition labels and numbered Strong’s headings', () => {
  const text = document().replace('Ecclesiastes 6:10 (BSB)', 'Numbers 5:1 BSB')
    .replace('Named (H7121 – Qara)', '1. LORD — YHWH — Strong’s H3068\nThe covenant name of God.\n2. Said / Spoke — dabar — Strong’s H1696')
    .replace('Psalm 115:3 (BSB)', 'Exodus 19:3 BSB').replace('Job 9:32–33 (BSB)', 'Job 9:32–33 BSB')
    .replaceAll('Insight: ', 'Explanation:  ');
  const [entry] = parseExplanationDocument(text, { isVerse, range: 'Numbers 5:1' });
  expect(entry).toMatchObject({
    bookName: 'Numbers', chapter: 5, verseNumber: 1, bibleVersion: 'BSB',
    wordStudies: [
      { surfaceText: 'LORD - YHWH', strongsId: 'H3068', customDefinition: 'The covenant name of God.' },
      { surfaceText: 'Said / Spoke - dabar', strongsId: 'H1696' },
    ],
    crossReferences: [{ bookName: 'Exodus', verseNumber: 3 }, { bookName: 'Job', verseEnd: 33 }],
  });
  expect(() => parseExplanationDocument(text.replace('Numbers 5:1 BSB', 'Numbers 5:1 KJV'), { isVerse }))
    .toThrow('Expected a BSB verse heading');
  expect(() => parseExplanationDocument(text.replace('Strong’s H1696', 'Strong’s'), { isVerse }))
    .toThrow('Strong’s heading is missing its ID');
});

test('does not silently ignore incomplete, duplicate, or missing requested entries', () => {
  expect(() => parseExplanationDocument(document().replace('\nFinal Thoughts', ''), { isVerse })).toThrow('finalThoughts');
  expect(() => parseExplanationDocument(`${document()}\n\n${document().replace('Trust God with the future.', 'Different application.')}`, { isVerse }))
    .toThrow(/Conflicting duplicate.*source lines 1 and \d+/);
  expect(() => parseExplanationDocument(document(), { isVerse, range: 'Ecclesiastes 6:10-11' })).toThrow('missing Ecclesiastes 6:11');
  expect(parseExplanationDocument(`${document()}\n\n${document(11)}`, { isVerse, range: 'Ecclesiastes 6:11' }).map(row => row.verseNumber)).toEqual([11]);
});

test('lists only absent verses when coverage is incomplete without treating malformed entries as absent', () => {
  const source = [
    document(8).replace('1 Practical Applications for Today', 'Applications').replace('Final Thoughts', 'Closing'),
    document(10).replace('Insight: God is sovereign.', 'God is sovereign.'),
    document(12).replace('Ecclesiastes 6:12 (BSB)', 'Ecclesiastes 6:12 KJV'),
  ].join('\n\n');
  expect(() => parseExplanationDocument(source, { isVerse, range: 'Ecclesiastes 6:8–12' })).toThrow(
    /^The document is missing Ecclesiastes 6:9, Ecclesiastes 6:11\. Add the source content or use --skip-missing to omit absent verses\.$/,
  );
  const onWarning = jest.fn();
  expect(() => parseExplanationDocument(source, { isVerse, range: 'Ecclesiastes 6:8–12', skipMissing: true, onWarning }))
    .toThrow('Ecclesiastes 6:8: Missing or out-of-order sections: practical, finalThoughts.');
  expect(onWarning).toHaveBeenCalledTimes(2);
});

test('ignores identical repeated verses with different line wrapping and keeps later verses', () => {
  const onWarning = jest.fn();
  const repeated = document().replace('Solomon describes how the Creator', 'Solomon describes\nhow the Creator');
  const entries = parseExplanationDocument(`${document()}\n\n${repeated}\n\n${document(11)}`, {
    isVerse, range: 'Ecclesiastes 6:10-11', onWarning,
  });
  expect(entries.map(entry => entry.verseNumber)).toEqual([10, 11]);
  expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('repeated copy of Ecclesiastes 6:10'));
});

test('accepts the Genesis template and can explicitly skip absent verses in a range', () => {
  const genesis = document().replace('Section2. Explanation', 'Section 2 – Explain the Verse')
    .replace('Practical Introduction', 'Practical Introduction to the Verse')
    .replace('Detailed Strong’s Concordance Word Study', 'Section 4 – Detailed Strong’s Concordance Word Study')
    .replace('1 Practical Applications for Today', 'Section 5 – Practical Applications for Today')
    .replace('\nCross References\n', '\nCross References (BSB)\n')
    .replace('Psalm 115:3 (BSB)', '● Psalm 115:3').replace('Job 9:32–33 (BSB)', '● Job 9:32–33')
    .replaceAll('Insight: ', 'Explanation:\n');
  const onWarning = jest.fn();
  const [entry] = parseExplanationDocument(genesis, { isVerse, range: 'Ecclesiastes 6:10-11', skipMissing: true, onWarning });
  expect(entry.crossReferences.map(row => row.commentary)).toEqual(['God is sovereign.', "God's wisdom exceeds ours."]);
  expect(entry.studyMetadata.introduction).toBe('Many people struggle with uncertainty.');
  expect(onWarning).toHaveBeenCalledWith('Skipping Ecclesiastes 6:11: no explanation in the source document.');
});

test('prints the complete preview in aligned sections with wrapped paragraphs', () => {
  const entries = parseExplanationDocument(document(), { isVerse });
  const output = formatExplanationPreview(entries, 56);
  expect(output).toContain('[1/1] Ecclesiastes 6:10 (BSB)');
  expect(output).toContain('    Verse quotation (from the document)\n      The printed verse text in the document.');
  expect(output).toContain('    Explanation\n      Solomon describes how the Creator knows our\n      limits.\n\n      This is a second paragraph.');
  expect(output).toContain('      1. Named - Qara (H7121)');
  expect(output).toContain('      2. Job 9:32–33 (BSB)');
  expect(output).toContain('      1. Trust God\n         His wisdom is greater than ours.');
  expect(output.split('\n').every(line => line.length <= 56)).toBe(true);
});

test('accepts Esther-style headings and Strong’s labels with extra parentheses', () => {
  const text = document().replace('Section1.', 'Section 1 -').replace('Section2.', 'Section 2 -').replace('Section3.', 'Section 3 -')
    .replace('Application\nTrust', 'Application: Trust').replace('Author\nSolomon', 'Author: Solomon')
    .replace('Detailed Strong’s Concordance Word Study', 'Strong Concordance Word Study')
    .replace('Named (H7121 – Qara)', "● Named - Qara (Strong's H7121)")
    .replace('Psalm 115:3', '● Psalm 115:3');
  const [entry] = parseExplanationDocument(text, { isVerse });
  expect(entry).toMatchObject({
    exegesis: { applicationText: 'Trust God with the future.' },
    studyMetadata: { backgroundAuthor: 'Solomon reflects on wisdom.' },
    wordStudies: [{ surfaceText: 'Named - Qara', strongsId: 'H7121' }],
    crossReferences: [{ bookName: 'Psalms' }, { bookName: 'Job' }],
  });
});

test('preserves each Strong’s entry, Hebrew spelling and all IDs in mixed chapter formats', () => {
  const extra = [
    "Take to Heart (H7760 / H3820 – Sim Leb)\nMeaning: Take to heart.\nSpiritual Insight: Consider it carefully.",
    "Sad Countenance (Hebrew: רַע פָּנִים, Ra Panim, Strong's H7451 / H6440)\nMeaning: A sad face (an expression of grief).",
    "• See the Sun (Hebrew: רָאָה שֶׁמֶשׁ – Ra'ah Shemesh, Strong's H7200 + H8121)\nMeaning: To live.",
  ].join('\n\n');
  const [entry] = parseExplanationDocument(document().replace('1 Practical Applications', `${extra}\n\n1 Practical Applications`), { isVerse });
  expect(entry.wordStudies.map(({ surfaceText, strongsId }) => [surfaceText, strongsId])).toEqual([
    ['Named - Qara', 'H7121'], ['Take to Heart - Sim Leb', 'H7760/H3820'],
    ['Sad Countenance - Ra Panim', 'H7451/H6440'], ["See the Sun - Ra'ah Shemesh", 'H7200/H8121'],
  ]);
  expect(entry.wordStudies[2].customDefinition).toContain('Hebrew: רַע פָּנִים');
  expect(entry.wordStudies[2].customDefinition).toContain('(an expression of grief)');
  expect(entry.wordStudies[1].customDefinition).not.toContain('Sad Countenance');
});

test.each(['(BSB)', 'BSB', '— Berean Standard Bible'])('joins wrapped PDF lines with %s and separates bold scripture from commentary', async edition => {
  const text = await extractExplanationPdfText(`<pdf2xml><page>
    <text top="10" left="100" height="20"><b>Cross References</b></text>
    <text top="35" left="120" height="20"><b>●</b></text>
    <text top="36" left="140" height="20"><b>Psalm 115:3 ${edition}</b></text>
    <text top="70" left="100" height="20"><b>Our God is in heaven;</b></text>
    <text top="94" left="100" height="20"><b>He does as He pleases.</b></text>
    <text top="130" left="100" height="20">The psalm points to</text>
    <text top="154" left="100" height="20">God's rule.</text>
    <text top="190" left="100" height="20"><b>Final Thoughts</b></text>
  </page></pdf2xml>`);
  expect(text).toContain(`● Psalm 115:3 ${edition}`);
  expect(text).toContain('Our God is in heaven; He does as He pleases.');
  expect(text).toContain("Insight: The psalm points to God's rule.");
  await expect(extractExplanationPdfText('<pdf2xml><page /></pdf2xml>')).rejects.toThrow('Scanned PDFs need OCR');
});

test('keeps PDF Strong’s headings separate from nearby definition fields with mixed italic and bold spans', async () => {
  const text = await extractExplanationPdfText(`<pdf2xml><page>
    <text top="10" left="100" height="20"><b>Sorrow (Hebrew: כַּעַס,</b></text>
    <text top="10" left="300" height="20"><i><b>Ka'as</b></i></text>
    <text top="10" left="350" height="20"><b>, Strong's H3708)</b></text>
    <text top="34" left="100" height="20"><b>Meaning:</b></text>
    <text top="34" left="200" height="20">Grief, sorrow,</text>
    <text top="57" left="100" height="20">or distress.</text>
    <text top="80" left="100" height="20"><b>Biblical Significance:</b></text>
    <text top="80" left="300" height="20">An emotional response.</text>
  </page></pdf2xml>`);
  expect(text.split('\n')).toEqual([
    "Sorrow (Hebrew: כַּעַס, Ka'as , Strong's H3708)",
    'Meaning: Grief, sorrow, or distress.',
    'Biblical Significance: An emotional response.',
  ]);
  const [entry] = parseExplanationDocument(document().replace(
    /Named \(H7121[^]*?(?=1 Practical Applications)/, `${text}\n`,
  ), { isVerse });
  expect(entry.wordStudies[0]).toMatchObject({
    surfaceText: "Sorrow - Ka'as", strongsId: 'H3708',
    customDefinition: expect.stringContaining('Meaning: Grief, sorrow, or distress.'),
  });
});
