import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'xml2js';
import Redis from 'ioredis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const XML_DIR = path.join(__dirname, 'Holy-Bible-XML-Format');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;
const CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL) || 86400; // 24 hours default

let redisClient = null;
let isRedisReady = false;

const getRedisClient = () => {
  if (!redisClient) {
    try {
      redisClient = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.log('Redis retry limit exceeded, disabling cache');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      redisClient.on('error', (err) => {
        isRedisReady = false;
        console.log('Redis connection error (will use file cache):', err.message);
      });

      redisClient.on('ready', () => {
        isRedisReady = true;
        console.log('Bible translations Redis connected');
      });

      redisClient.on('close', () => {
        isRedisReady = false;
        console.log('Redis connection closed');
      });

      redisClient.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });
    } catch (err) {
      console.log('Redis init failed:', err.message);
      return null;
    }
  }
  return redisClient;
};

const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return null;
    await client.ping(); // This will trigger connection if not ready
    const data = await client.get(`bible:${key}`);
    isRedisReady = true;
    if (data) return JSON.parse(data);
  } catch (err) {
    isRedisReady = false;
    console.log('Cache get error:', err.message);
  }
  return null;
};

const cacheSet = async (key, data, ttl = CACHE_TTL) => {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.ping(); // This will trigger connection if not ready
    isRedisReady = true;
    await client.setex(`bible:${key}`, ttl, JSON.stringify(data));
  } catch (err) {
    isRedisReady = false;
    console.log('Cache set error:', err.message);
  }
};

export const BOOK_NAMES = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
  15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
  20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
  24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
  28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
  33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
  38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians',
  49: 'Ephesians', 50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians',
  53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy', 56: 'Titus',
  57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter', 61: '2 Peter',
  62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation'
};

export const BOOK_NAME_TO_NUMBER = Object.fromEntries(
  Object.entries(BOOK_NAMES).map(([num, name]) => [name.toLowerCase(), parseInt(num)])
);

export const SHORT_IDS = {
  'ASV': 'EnglishASVBible',
  'Amplified': 'EnglishAmplifiedBible',
  'AmplifiedClassic': 'EnglishAmplifiedClassicBible',
  'Berean': 'EnglishBereanBible',
  'CSB': 'EnglishCSBBible',
  'Darby': 'EnglishDarbyBible',
  'EASY': 'EnglishEASYBible',
  'ERV': 'EnglishERVBible',
  'ESV': 'EnglishESVBible',
  'GNT': 'EnglishGNTBible',
  'GW': 'EnglishGWBible',
  'HCSB': 'EnglishHCSBBible',
  'KJV': 'EnglishKJBible',
  'LSB': 'EnglishLSBBible',
  'MEV': 'EnglishMEVBible',
  'NASB': 'EnglishNASBBible',
  'NASU': 'EnglishNASUBible',
  'NET': 'EnglishNETBible',
  'NIRV': 'EnglishNIRVBible',
  'NIV': 'EnglishNIVBible',
  'NKJ': 'EnglishNKJBible',
  'NLT': 'EnglishNLTBible',
  'NRSV': 'EnglishNRSVBible',
  'Passion': 'EnglishPassionBible',
  'RSV': 'EnglishRSVBible',
  'TL': 'EnglishTLBible',
  'Tyndale': 'EnglishTyndale1537Bible',
  'YLT': 'EnglishYLTBible'
};

export const TRANSLATION_DISPLAY_NAMES = {
  'ASV': { name: 'American Standard Version', year: '1901' },
  'Amplified': { name: 'Amplified Bible', year: '2015' },
  'AmplifiedClassic': { name: 'Amplified Classic', year: '1987' },
  'Berean': { name: 'Berean Standard Bible', year: '2016' },
  'CSB': { name: 'Christian Standard Bible', year: '2017' },
  'Darby': { name: "Darby Translation", year: '1890' },
  'EASY': { name: 'Easy-to-Read Version', year: '2024' },
  'ERV': { name: 'English Revised Version', year: '2006' },
  'ESV': { name: 'English Standard Version', year: '2016' },
  'GNT': { name: 'Good News Translation', year: '1992' },
  'GW': { name: "God's Word", year: '1995' },
  'HCSB': { name: 'Holman Christian Standard', year: '2004' },
  'KJV': { name: 'King James Version', year: '1769' },
  'LSB': { name: 'Legacy Standard Bible', year: '2021' },
  'MEV': { name: 'Modern English Version', year: '2014' },
  'NASB': { name: 'New American Standard Bible', year: '1995' },
  'NASU': { name: 'New American Standard Update', year: '1989' },
  'NET': { name: 'NET Bible', year: '2005' },
  'NIRV': { name: 'New International Reader\'s Version', year: '1996' },
  'NIV': { name: 'New International Version', year: '2011' },
  'NKJ': { name: 'New King James Version', year: '1982' },
  'NLT': { name: 'New Living Translation', year: '2004' },
  'NRSV': { name: 'New Revised Standard Version', year: '1989' },
  'Passion': { name: 'The Passion Translation', year: '2020' },
  'RSV': { name: 'Revised Standard Version', year: '1971' },
  'TL': { name: 'The Living Bible', year: '1971' },
  'Tyndale': { name: 'Tyndale Bible', year: '1537' },
  'YLT': { name: "Young's Literal Translation", year: '1898' }
};

export const getTranslationDisplayName = (id) => {
  const display = TRANSLATION_DISPLAY_NAMES[id];
  if (display) {
    return display.name;
  }
  return id;
};

const toShortId = (fileName) => {
  const fullName = fileName.replace('.xml', '');
  const entry = Object.entries(SHORT_IDS).find(([k, v]) => v === fullName);
  return entry ? entry[0] : fullName;
};

const toFullId = (id) => {
  return SHORT_IDS[id] || id;
};

const parseXml = (xmlContent) => {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const getXmlPath = (id) => {
  const fullId = toFullId(id);
  const filePath = path.join(XML_DIR, `${fullId}.xml`);
  if (!fs.existsSync(filePath)) {
    throw new Error('Translation not found');
  }
  return filePath;
};

const parseBibleXml = async (id) => {
  const filePath = getXmlPath(id);
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  return parseXml(xmlContent);
};

const extractBooks = (testaments) => {
  const books = [];
  for (const testament of testaments) {
    const testamentName = testament.$.name;
    const testamentBooks = Array.isArray(testament.book) ? testament.book : [testament.book];
    
    for (const book of testamentBooks) {
      const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
      const totalVerses = chapters.reduce((sum, ch) => {
        const verses = Array.isArray(ch.verse) ? ch.verse : [ch.verse];
        return sum + verses.length;
      }, 0);
      
      books.push({
        bookNumber: parseInt(book.$.number),
        bookName: BOOK_NAMES[parseInt(book.$.number)],
        testament: testamentName,
        chaptersCount: chapters.length,
        totalVerses
      });
    }
  }
  return books;
};

const findBook = (testaments, bookNumber) => {
  for (const testament of testaments) {
    const testamentBooks = Array.isArray(testament.book) ? testament.book : [testament.book];
    const book = testamentBooks.find(b => parseInt(b.$.number) === bookNumber);
    if (book) return book;
  }
  return null;
};

const findChapter = (book, chapterNumber) => {
  const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
  return chapters.find(ch => parseInt(ch.$.number) === chapterNumber);
};

export const getAllTranslations = async () => {
  const cacheKey = 'translations:all:v2';
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const files = fs.readdirSync(XML_DIR).filter(f => f.endsWith('.xml'));
  const translations = [];

  for (const file of files) {
    const xmlContent = fs.readFileSync(path.join(XML_DIR, file), 'utf-8');
    const parsed = await parseXml(xmlContent);
    const bible = parsed.bible;
    const shortId = toShortId(file);
    const displayInfo = TRANSLATION_DISPLAY_NAMES[shortId];
    
    translations.push({
      id: shortId,
      name: displayInfo ? displayInfo.name : (bible.$.translation || bible.$.name || shortId),
      shortName: shortId,
      year: displayInfo?.year || null,
      description: bible.$.title || null,
      copyright: bible.$.status || null,
      link: bible.$.link || null
    });
  }

  await cacheSet(cacheKey, translations);
  return translations;
};

export const getTranslationInfo = async (id) => {
  const cacheKey = `translation:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const parsed = await parseBibleXml(id);
  const bible = parsed.bible;
  const shortId = toShortId(toFullId(id) + '.xml');

  const result = {
    id: shortId,
    name: bible.$.translation || bible.$.name || shortId,
    shortName: shortId,
    description: bible.$.title || null,
    copyright: bible.$.status || null,
    link: bible.$.link || null
  };

  await cacheSet(cacheKey, result);
  return result;
};

export const getBooks = async (id) => {
  const cacheKey = `books:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const parsed = await parseBibleXml(id);
  const testaments = Array.isArray(parsed.bible.testament) 
    ? parsed.bible.testament 
    : [parsed.bible.testament];
  const result = extractBooks(testaments);
  
  await cacheSet(cacheKey, result);
  return result;
};

export const getBooksWithMaxChapters = async (id) => {
  const cacheKey = `books:${id}:with-max`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const parsed = await parseBibleXml(id);
  const testaments = Array.isArray(parsed.bible.testament) 
    ? parsed.bible.testament 
    : [parsed.bible.testament];
  
  const result = extractBooks(testaments).map(book => ({
    ...book,
    maxChapter: book.chaptersCount
  }));
  
  await cacheSet(cacheKey, result);
  return result;
};

export const getChapters = async (id, bookName) => {
  const bookNumber = BOOK_NAME_TO_NUMBER[bookName.toLowerCase()];
  if (!bookNumber) {
    throw new Error('Invalid book name');
  }

  const cacheKey = `chapters:${id}:${bookName}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const parsed = await parseBibleXml(id);
  const testaments = Array.isArray(parsed.bible.testament) 
    ? parsed.bible.testament 
    : [parsed.bible.testament];
  
  const book = findBook(testaments, bookNumber);
  if (!book) {
    throw new Error('Book not found');
  }

  const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
  const result = {
    bookNumber,
    bookName: BOOK_NAMES[bookNumber],
    chapters: chapters.map(ch => ({
      chapterNumber: parseInt(ch.$.number),
      versesCount: (Array.isArray(ch.verse) ? ch.verse : [ch.verse]).length
    }))
  };

  await cacheSet(cacheKey, result);
  return result;
};

export const getVerses = async (id, bookName, chapterNumber) => {
  const bookNumber = BOOK_NAME_TO_NUMBER[bookName.toLowerCase()];
  if (!bookNumber) {
    throw new Error('Invalid book name');
  }

  const cacheKey = `verses:${id}:${bookName}:${chapterNumber}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const parsed = await parseBibleXml(id);
  const testaments = Array.isArray(parsed.bible.testament) 
    ? parsed.bible.testament 
    : [parsed.bible.testament];
  
  const book = findBook(testaments, bookNumber);
  if (!book) {
    throw new Error('Book not found');
  }

  const chapter = findChapter(book, chapterNumber);
  if (!chapter) {
    throw new Error('Chapter not found');
  }

  const verses = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];
  const result = {
    bookNumber,
    bookName: BOOK_NAMES[bookNumber],
    chapterNumber,
    verses: verses.map(v => ({
      verseNumber: parseInt(v.$.number),
      text: typeof v === 'string' ? v : (v._ || v)
    }))
  };

  await cacheSet(cacheKey, result);
  return result;
};

export const getVerse = async (id, bookName, chapter, verseNumber) => {
  const verses = await getVerses(id, bookName, chapter);
  const verse = verses.verses.find(v => v.verseNumber === verseNumber);

  if (!verse) {
    throw new Error('Verse not found');
  }

  return {
    ...verse,
    bookNumber: verses.bookNumber,
    bookName,
    chapterNumber: chapter
  };
};

export const searchVerses = async (id, query, limit = 50) => {
  const parsed = await parseBibleXml(id);
  const testaments = Array.isArray(parsed.bible.testament) 
    ? parsed.bible.testament 
    : [parsed.bible.testament];

  const results = [];
  const searchLower = query.toLowerCase();

  for (const testament of testaments) {
    if (results.length >= limit) break;
    
    const testamentBooks = Array.isArray(testament.book) ? testament.book : [testament.book];
    
    for (const book of testamentBooks) {
      if (results.length >= limit) break;
      
      const bookNum = parseInt(book.$.number);
      const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
      
      for (const chapter of chapters) {
        if (results.length >= limit) break;
        
        const chapterNum = parseInt(chapter.$.number);
        const chapterVerses = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];
        
        for (const verse of chapterVerses) {
          const text = typeof verse === 'string' ? verse : (verse._ || verse);
          
          if (text && text.toLowerCase().includes(searchLower)) {
            results.push({
              bookNumber: bookNum,
              bookName: BOOK_NAMES[bookNum],
              chapter: chapterNum,
              verse: parseInt(verse.$.number),
              text
            });
          }
        }
      }
    }
  }

  return results;
};

export const getChapterRange = async (id, bookName, startChapter, endChapter) => {
  const bookNumber = BOOK_NAME_TO_NUMBER[bookName.toLowerCase()];
  if (!bookNumber) {
    throw new Error('Invalid book name');
  }

  const verses = [];
  
  for (let ch = startChapter; ch <= endChapter; ch++) {
    const chapterData = await getVerses(id, bookName, ch);
    verses.push(...chapterData.verses);
  }

  return {
    bookNumber,
    bookName,
    startChapter,
    endChapter,
    verses
  };
};

export const getReadingProgress = async (id, startBookName, startChapter, endBookName, endChapter) => {
  const startBookNumber = BOOK_NAME_TO_NUMBER[startBookName.toLowerCase()];
  const endBookNumber = BOOK_NAME_TO_NUMBER[endBookName.toLowerCase()];
  
  if (!startBookNumber || !endBookNumber) {
    throw new Error('Invalid book name');
  }

  const books = [];
  
  for (let book = startBookNumber; book <= endBookNumber; book++) {
    const chapters = [];
    const startCh = book === startBookNumber ? startChapter : 1;
    const endCh = book === endBookNumber ? endChapter : null;
    
    const bookData = await getChapters(id, BOOK_NAMES[book]);
    
    for (let ch = startCh; ch <= (endCh || bookData.chapters.length); ch++) {
      const chapterData = await getVerses(id, BOOK_NAMES[book], ch);
      chapters.push({
        chapterNumber: ch,
        verses: chapterData.verses
      });
    }
    
    books.push({
      bookNumber: book,
      bookName: BOOK_NAMES[book],
      chapters
    });
  }

  return {
    translationId: id,
    startBook: startBookName,
    startChapter,
    endBook: endBookName,
    endChapter,
    books
  };
};