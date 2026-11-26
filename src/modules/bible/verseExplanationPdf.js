import { parseStringPromise } from 'xml2js';
import { isBsbCrossReferenceSection, isExplicitBsbHeading } from './verseExplanationImport.js';

const divider = /^[_─━]{3,}$/;
const inheritedVerseHeading = /^[*•●-]\s*.+?\s+\d+:\d+(?:\s*[-–—]\s*\d+)?$/i;
const studyDetail = /^(?:meaning|biblical significance|contextual meaning|context in [^:]+|spiritual insight):/i;
const heading = /^(?:section\s+\d|application:|author:|book:|context:|(?:\d+[.)]|\d+\s+(?:practical applications|takeaways))\s*|[*•●]\s*|background$|(?:practical|verse) introduction$|(?:detailed )?strong(?:['’]s)? concordance word study$|(?:biblical )?insights and cross references$|key themes$|cross references$|final thoughts$|insight:)/i;
const cleanSpan = text => text.replace(/[\u200B\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
const textOf = node => node.$$ ? node.$$.map(textOf).join('') : node._ ?? '';
const hasBold = node => node['#name'] === 'b' || (node.$$?.some(hasBold) ?? false);

function getLines(page) {
  const spans = (page.text ?? []).map(span => ({
    top: Number(span.$.top), left: Number(span.$.left), height: Number(span.$.height),
    text: cleanSpan(textOf(span)), bold: hasBold(span),
  })).filter(span => span.text).sort((a, b) => a.top - b.top || a.left - b.left);
  const groups = [];
  for (const span of spans) {
    const last = groups.at(-1);
    if (last && span.top - last[0].top < 2) last.push(span);
    else groups.push([span]);
  }
  return groups.map(group => {
    group.sort((a, b) => a.left - b.left);
    return {
      ...group[0],
      text: group.map(span => span.text).join(' '),
      bold: group.filter(span => !/^[*•●]$/.test(span.text)).every(span => span.bold),
    };
  });
}

export async function extractExplanationPdfText(xml) {
  const { pdf2xml } = await parseStringPromise(xml, {
    explicitChildren: true, preserveChildrenOrder: true, charsAsChildren: true, includeWhiteChars: true,
  });
  const output = [];
  let crossState = null;
  for (const page of pdf2xml?.page ?? []) {
    let previous;
    for (const line of getLines(page)) {
      let { text } = line;
      if (divider.test(text)) {
        if (output.at(-1) !== '') output.push('');
        previous = undefined;
        continue;
      }
      const isCrossSection = isBsbCrossReferenceSection(text);
      const isVerse = isExplicitBsbHeading(text) || Boolean(crossState && inheritedVerseHeading.test(text));
      if (isCrossSection) crossState = 'heading';
      else if (/^(?:final thoughts|section\s+1\b)/i.test(text)) crossState = null;
      else if (crossState && isVerse) crossState = 'quote';
      else if (crossState && /^(?:insight|explanation):/i.test(text)) crossState = 'insight';
      else if (crossState === 'quote' && line.bold) crossState = 'boldQuote';
      else if (crossState === 'boldQuote' && !line.bold) {
        // The Esther export uses bold scripture followed by an unbolded
        // commentary paragraph rather than an explicit “Insight:” label.
        if (!/^insight:/i.test(text)) text = `Insight: ${text}`;
        crossState = 'insight';
      }
      const wordHeading = /\b[HG]\d+[a-z]?\b/i.test(text) && line.bold;
      const block = heading.test(text) || isVerse || isCrossSection || studyDetail.test(text) || wordHeading ||
        /^(?:explanation:|practical introduction to the verse)$/i.test(text);
      const close = previous && line.top - previous.top <= Math.max(line.height, previous.height) * 1.35;
      const inlineLabel = /^(?:application|author|book|context|insight):\s+\S/i.test(previous?.text ?? '') || studyDetail.test(previous?.text ?? '');
      const wrappedTitle = /^\d+[.)]\s/.test(previous?.text ?? '') && previous.bold && line.bold &&
        Math.abs(previous.left - line.left) < 2;
      if (!block && close && (!previous.block || inlineLabel || wrappedTitle) && previous.bold === line.bold) {
        const last = output.at(-1);
        output[output.length - 1] = `${last}${/\p{L}-$/u.test(last) && /^\p{Ll}/u.test(text) ? '' : ' '}${text}`;
      } else {
        if (!block && previous && !close && output.at(-1) !== '') output.push('');
        output.push(text);
      }
      previous = { ...line, text, block };
    }
  }
  if (!output.some(Boolean)) throw new Error('No selectable text found in the PDF. Scanned PDFs need OCR before importing.');
  return output.join('\n');
}
