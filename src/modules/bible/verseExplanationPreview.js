import { referenceLabel } from './verseExplanationImport.js';

// Strip control characters from document text before displaying it in a
// terminal. The imported content itself is not modified.
const terminalText = value => String(value ?? '').replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '');

function wrap(text, indent, width) {
  const pad = ' '.repeat(indent);
  return terminalText(text).split('\n').map(line => {
    if (!line.trim()) return '';
    const rows = [];
    let row = pad;
    for (const word of line.trim().split(/\s+/)) {
      if (row !== pad && row.length + 1 + word.length > width) {
        rows.push(row);
        row = pad;
      }
      row += (row === pad ? '' : ' ') + word;
    }
    return [...rows, row].join('\n');
  }).join('\n');
}

export function formatExplanationPreview(entries, columns = 88) {
  const width = Math.min(104, Math.max(40, columns));
  const separator = '='.repeat(width);
  const output = [`Preview: ${entries.length} BSB explanation(s). No database changes.`];
  const section = (number, title) => output.push('', `  ${number}. ${title}`);
  const field = (label, value, indent = 4) => {
    output.push('', wrap(label, indent, width), wrap(value, indent + 2, width));
  };
  const items = (label, values) => {
    output.push('', `    ${label} (${values.length})`);
    values.forEach((value, index) => {
      const [title, ...body] = value.split('\n');
      output.push('', wrap(`${index + 1}. ${title}`, 6, width), wrap(body.join('\n').trim(), 9, width));
    });
  };
  entries.forEach((entry, index) => {
    const { studyMetadata: meta, exegesis } = entry;
    output.push('', separator, wrap(`[${index + 1}/${entries.length}] ${referenceLabel(entry)} (${entry.bibleVersion})`, 0, width), separator);
    section(1, 'MENTION THE VERSE');
    field('Verse quotation (from the document)', entry.sourceVerseText);
    section(2, 'EXPLANATION');
    field('Explanation', exegesis.explanationText);
    field('Application', exegesis.applicationText);
    section(3, 'LEARN MORE');
    field('Practical introduction', meta.introduction);
    field('Background — Author', meta.backgroundAuthor);
    field('Background — Book', meta.backgroundBook);
    field('Background — Context', meta.backgroundContext);
    output.push('', `    Strong’s Concordance word studies (${entry.wordStudies.length})`);
    entry.wordStudies.forEach((word, i) => {
      const id = word.strongsId ? ` (${word.strongsId})` : '';
      field(`${i + 1}. ${word.surfaceText}${id}`, word.customDefinition, 6);
    });
    items('Practical applications', entry.practicalApps.map(row => row.applicationText));
    section(4, 'INSIGHTS AND CROSS REFERENCES');
    output.push('', `    Key themes (${entry.themes.length})`, ...entry.themes.map(t => wrap(`- ${t.themeName}`, 6, width)));
    output.push('', `    Cross references (${entry.crossReferences.length})`);
    entry.crossReferences.forEach((reference, i) => {
      const label = `${i + 1}. ${referenceLabel(reference)} (BSB)`;
      if (reference.referenceText) field(label, reference.referenceText, 6);
      else output.push('', wrap(label, 6, width));
      output.push(wrap(`Insight: ${reference.commentary}`, 8, width));
    });
    field('Final thoughts', meta.finalThoughts);
    items('Takeaways', meta.takeaways);
  });
  return output.join('\n');
}
