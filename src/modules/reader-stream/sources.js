import * as bible from '../bible/service.js';
import * as books from '../book-prologues/service.js';
import * as resources from '../verse-resources/service.js';
import * as strongs from '../strongs/service.js';
import { getBookHeadings as getTranslationBookHeadings } from '../bible-translations/service.js';
import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';
import { BIBLE_BOOK_NAMES } from '../bible/bookNames.js';
import { splitSurfaceText, withSurfaceGloss, withStrongsGloss } from '../strongs/surfaceText.js';

export { splitSurfaceText };

const withWordStudyGloss = data => Array.isArray(data?.wordStudies)
  ? { ...data, wordStudies: data.wordStudies.map(item => {
    const word = withSurfaceGloss(item);
    return word?.strongs ? { ...word, strongs: withStrongsGloss(word.strongs) } : word;
  }) }
  : data;

function bookDesignation(bookName) {
  const index = Object.keys(BIBLE_BOOK_NAMES.en).indexOf(bookName === 'Psalm' ? 'Psalms' : bookName) + 1;
  if (!index) return '';
  // Numeric ordinals translate reliably across providers. Word ordinals such
  // as "Twenty-Third" are occasionally misread as "Third" by public engines.
  const mod100 = index % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[index % 10] || 'th');
  return `The ${index}${suffix} Book of the Bible`;
}

const dailyVerse = ['title', 'text', 'reflection', 'verseIntroduction', 'explanation', 'application',
  'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'wordStudies', 'practicalApplications',
  'keyThemes', 'crossReferences', 'finalThoughts', 'takeaways', 'learnMore'];
const dailyDevotion = ['title', 'explanation', 'reflectionQuestions', 'prayer',
  'practicalApplications', 'learningPoints'];
const book = ['title', 'summary', 'background', 'authorDetail', 'audience', 'purpose', 'lessons',
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
      fields = ['designation', ...book]; atomicFields = ['designation', 'title', 'text']; break;
    case 'book-introduction':
      result = await books.getBookPrologue(input);
      fields = ['summary', 'author', 'audience', 'dateWritten', 'locationWritten', 'keyTheme', 'purpose', 'mainThemes', 'christConnection']; break;
    case 'daily-verse':
      result = await bible.getTodaysVerse(input);
      if (result.data) result = { ...result, data: withWordStudyGloss(result.data) };
      fields = dailyVerse; atomicFields = ['title', 'text', 'reflection']; break;
    case 'daily-devotion':
      result = await bible.getTodaysDevotion(input);
      if (result.data) result = { ...result, data: withWordStudyGloss(result.data) };
      fields = dailyDevotion; atomicFields = ['title']; break;
    case 'daily-exegesis':
      if (params.id) {
        const record = await prisma.dailyExegesis.findFirst({ where: { id: BigInt(params.id), isPublished: true } });
        result = record ? { status: 200, data: serializeBigInt(record) } : { status: 404 };
      } else result = await bible.getTodaysExegesis(input);
      fields = ['title', 'introduction', 'contextSummary', 'teachingBody', 'application', 'prayer']; break;
    case 'verse-explanation':
      result = await bible.getVerseExplanation(input);
      if (result.data) result = { ...result, data: withWordStudyGloss(result.data) };
      fields = ['exegesis', 'studyMetadata', 'wordStudies', 'practicalApps', 'crossReferences', 'themes'];
      // Older records may only carry the flattened explanation/application
      // columns. Include them only when the rich exegesis row is absent so a
      // field is never translated twice.
      if (!result.data?.exegesis) fields.push('explanation', 'application', 'learnMore');
      break;
    case 'strongs-entry':
      result = await strongs.getStrongsEntry(String(params.strongsId || '').toUpperCase(), 'en');
      if (result.data) result = { ...result, data: withStrongsGloss(serializeBigInt(result.data)) };
      fields = ['shortDefinition', 'fullDefinition', 'adminExplanation', 'crossReferences',
        'contextualStudies', 'verseReferences', 'partOfSpeech', 'grammaticalCase',
        'gender', 'number']; break;
    case 'book-headings':
      result = await getTranslationBookHeadings({ bookName: params.bookName });
      fields = ['chapters']; atomicFields = ['heading']; break;
    case 'verse-resources':
      result = await resources.getVerseResources({ ...input, section: resourceSections[scope || 'commentaries'] });
      if (result.status === 200 && result.data.sections?.studyTools > 0) {
        // The source bundle is cached internally. Avoid building unrelated
        // cross-reference/interlinear sections just to show the active tab.
        const tools = await resources.getVerseResources({ ...input, section: 'studyTools' });
        if (tools.status !== 200) throw Object.assign(new Error('Study tools unavailable'), { status: tools.status || 500 });
        result = { ...result, data: { ...result.data, studyTools: tools.data.studyTools } };
      }
      if (scope === 'wordStudies' && result.data) result = { ...result, data: withWordStudyGloss(result.data) };
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
