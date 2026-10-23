import * as bible from '../bible/service.js';
import * as books from '../book-prologues/service.js';
import * as resources from '../verse-resources/service.js';
import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';
import { BIBLE_BOOK_NAMES } from '../bible/bookNames.js';

function bookDesignation(bookName) {
  const index = Object.keys(BIBLE_BOOK_NAMES.en).indexOf(bookName === 'Psalm' ? 'Psalms' : bookName) + 1;
  if (!index) return '';
  const first = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth',
    'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty'];
  const exact = { 20: 'Twentieth', 30: 'Thirtieth', 40: 'Fortieth', 50: 'Fiftieth', 60: 'Sixtieth' };
  const ordinal = first[index - 1] || exact[index] || `${tens[Math.floor(index / 10)]}-${first[index % 10 - 1]}`;
  return `The ${ordinal} Book of the Bible`;
}

const dailyVerse = ['title', 'text', 'reflection', 'verseIntroduction', 'explanation', 'application',
  'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'wordStudies', 'practicalApplications',
  'keyThemes', 'crossReferences', 'finalThoughts', 'takeaways', 'learnMore'];
const dailyDevotion = ['title', 'reflection', 'content', 'explanation', 'application',
  'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'wordStudies', 'practicalApplications',
  'keyThemes', 'crossReferences', 'finalThoughts', 'takeaways', 'learnMore'];
const book = ['summary', 'background', 'authorDetail', 'audience', 'purpose', 'lessons',
  'applications', 'keyScripture', 'structure', 'keyTheme', 'mainThemes', 'keyPeople',
  'keyVerses', 'christConnection', 'author', 'dateWritten', 'locationWritten'];
const resourceScopes = { commentaries: 'commentaries', crossrefs: 'crossReferences',
  wordStudies: 'wordStudies', dictionary: 'dictionaryTerms', interlinear: 'interlinearWords', topics: 'relatedTopics' };
const resourceSections = { commentaries: 'commentaries', crossrefs: 'crossReferences',
  wordStudies: 'wordStudies', dictionary: 'dictionary', interlinear: 'interlinear', topics: 'topics' };

export async function loadReaderSource({ kind, params = {}, scope }) {
  const input = { ...params, lang: 'en' };
  let result; let fields; let atomicFields = ['title'];
  switch (kind) {
    case 'book-overview':
      result = await books.getBookPrologue(input);
      if (result.data) result = { ...result, data: { ...result.data, designation: bookDesignation(params.bookName) } };
      fields = ['designation', ...book]; atomicFields = ['designation', 'text']; break;
    case 'book-introduction':
      result = await books.getBookPrologue(input);
      fields = ['summary', 'author', 'audience', 'dateWritten', 'locationWritten', 'keyTheme', 'purpose', 'mainThemes', 'christConnection']; break;
    case 'daily-verse':
      result = await bible.getTodaysVerse(input); fields = dailyVerse; atomicFields = ['title', 'text', 'reflection']; break;
    case 'daily-devotion':
      result = await bible.getTodaysDevotion(input); fields = dailyDevotion; atomicFields = ['title', 'reflection']; break;
    case 'daily-exegesis':
      if (params.id) {
        const record = await prisma.dailyExegesis.findFirst({ where: { id: BigInt(params.id), isPublished: true } });
        result = record ? { status: 200, data: serializeBigInt(record) } : { status: 404 };
      } else result = await bible.getTodaysExegesis(input);
      fields = ['title', 'introduction', 'contextSummary', 'teachingBody', 'application', 'prayer']; break;
    case 'verse-explanation':
      result = await bible.getVerseExplanation(input);
      fields = ['explanation', 'learnMore']; break;
    case 'verse-resources':
      result = await resources.getVerseResources({ ...input, section: resourceSections[scope || 'commentaries'] });
      if (result.status === 200 && result.data.sections?.studyTools > 0) {
        // The source bundle is cached internally. Avoid building unrelated
        // cross-reference/interlinear sections just to show the active tab.
        const tools = await resources.getVerseResources({ ...input, section: 'studyTools' });
        if (tools.status !== 200) throw Object.assign(new Error('Study tools unavailable'), { status: tools.status || 500 });
        result = { ...result, data: { ...result.data, studyTools: tools.data.studyTools } };
      }
      fields = [resourceScopes[scope || 'commentaries'], 'studyTools']; atomicFields = ['title', 'crossReferences']; break;
    default: throw Object.assign(new Error('Unknown reader content'), { status: 400 });
  }
  if (result?.status !== 200 || !result.data) {
    throw Object.assign(new Error('Reader content unavailable'), { status: result?.status || 404 });
  }
  const availableScopes = kind === 'verse-resources'
    ? Object.entries(resourceScopes).filter(([name, field]) => result.data[field]?.length || result.data.sections?.[resourceSections[name]] > 0).map(([name]) => name)
    : undefined;
  return { source: result.data, fields, atomicFields, availableScopes };
}

/** Series navigation needs IDs/references, never a second English article payload. */
export async function loadExegesisIndex(filters) {
  const result = await bible.getAllDailyExegesisPublic({ ...filters, lang: 'en' });
  if (result.status !== 200) return result;
  const content = result.data.content.map(item => ({ id: item.id, reference: item.reference,
    passageReference: item.passageReference, displayDate: item.displayDate }));
  return { ...result, data: { ...result.data, content } };
}

export async function loadBookIndex(filters) {
  const result = await books.getAllBookPrologues({ ...filters, lang: 'en' });
  if (result.status !== 200) return result;
  return { ...result, data: { ...result.data, data: result.data.data.map(item => ({ id: item.id, bookName: item.bookName,
    ...(filters.lang === 'en' ? { keyTheme: String(item.keyTheme || item.summary || item.purpose || '').slice(0, 250), contentLanguage: 'en' } : {}),
  })) } };
}
