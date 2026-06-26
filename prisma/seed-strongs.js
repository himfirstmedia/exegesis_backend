/**
 * Seed script for Strong's Concordance dictionary.
 *
 * Usage: node prisma/seed-strongs.js
 *
 * This seeds a sample of common Greek NT Strong's entries
 * and word-level mappings for Genesis 1 (BSB).
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const p = (s) => s;

const STRONGS_ENTRIES = [
  { strongsId: 'G3056', originalWord: 'λόγος', transliteration: 'logos', pronunciation: p("log'-os"), shortDefinition: 'word, speech, message', fullDefinition: p("A word, speech, divine utterance, account, reason, or message. In John 1:1, refers to Jesus Christ as the eternal Word of God."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'nominative', gender: 'masculine', number: 'singular', usageCount: 330, crossReferences: 'John 1:1, John 1:14, 1 John 1:1' },
  { strongsId: 'G0025', originalWord: 'ἀγαπάω', transliteration: 'agapao', pronunciation: p("ag-ap-ah'-o"), shortDefinition: 'to love, to cherish', fullDefinition: p("To love unconditionally, to have a deep, self-sacrificing love for. Used of God's love for humanity and the love believers are to have for God and one another."), language: 'greek', partOfSpeech: 'verb', grammaticalCase: 'infinitive', gender: null, number: null, usageCount: 143 },
  { strongsId: 'G0026', originalWord: 'ἀγάπη', transliteration: 'agape', pronunciation: p("ag-ah'-pay"), shortDefinition: 'love, unconditional love', fullDefinition: p("Unconditional, self-sacrificing love. The highest form of love, used to describe God's nature and the love He commands believers to show."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'nominative', gender: 'feminine', number: 'singular', usageCount: 116 },
  { strongsId: 'G2889', originalWord: 'κόσμος', transliteration: 'kosmos', pronunciation: p("kos'-mos"), shortDefinition: 'world, universe, earth', fullDefinition: p("The world, the universe, the earth; by extension, the world system opposed to God; humanity in general."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'accusative', gender: 'masculine', number: 'singular', usageCount: 186 },
  { strongsId: 'G4102', originalWord: 'πίστις', transliteration: 'pistis', pronunciation: p("pis'-tis"), shortDefinition: 'faith, belief, trust', fullDefinition: p("Faith, trust, confidence in God; belief in the truths of the gospel; faithfulness, reliability."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'nominative', gender: 'feminine', number: 'singular', usageCount: 244 },
  { strongsId: 'G4100', originalWord: 'πιστεύω', transliteration: 'pisteuo', pronunciation: p("pist-yoo'-o"), shortDefinition: 'to believe, to trust', fullDefinition: p("To believe, to trust in, to have faith in. Used extensively in John's Gospel for saving faith in Jesus Christ."), language: 'greek', partOfSpeech: 'verb', grammaticalCase: null, gender: null, number: null, usageCount: 248 },
  { strongsId: 'G5547', originalWord: 'Χριστός', transliteration: 'Christos', pronunciation: 'khris-tos', shortDefinition: 'Christ, Anointed One, Messiah', fullDefinition: p("The Anointed One, the Messiah, the Christ. The Greek translation of the Hebrew Messiah. Used as a title for Jesus of Nazareth."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'nominative', gender: 'masculine', number: 'singular', usageCount: 529 },
  { strongsId: 'G2962', originalWord: 'κύριος', transliteration: 'kurios', pronunciation: p("koo'-ree-os"), shortDefinition: 'Lord, master, sir', fullDefinition: p("Lord, master, owner. Used of God as the Supreme Being and of Jesus Christ as the divine Lord and Master."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'nominative', gender: 'masculine', number: 'singular', usageCount: 717 },
  { strongsId: 'G2316', originalWord: 'θεός', transliteration: 'theos', pronunciation: p("theh'-os"), shortDefinition: 'God, a god', fullDefinition: p("God, the Supreme Being; by extension, a deity, god or goddess. In the NT, primarily used for the one true God."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'nominative', gender: 'masculine', number: 'singular', usageCount: 1317 },
  { strongsId: 'G0036', originalWord: 'ἀγενεαλόγητος', transliteration: 'agenealogetos', pronunciation: p("ag-en-eh-al-og'-ay-tos"), shortDefinition: 'without genealogy', fullDefinition: p("Without genealogy, of unrecorded descent."), language: 'greek', partOfSpeech: 'adjective', usageCount: 1 },
  { strongsId: 'G0124', originalWord: 'Αἰγύπτιος', transliteration: 'Aiguptios', pronunciation: p("ahee-goop'-tee-os"), shortDefinition: 'Egyptian', fullDefinition: p("Egyptian, belonging to Egypt."), language: 'greek', partOfSpeech: 'adjective', usageCount: 5 },
  { strongsId: 'G0143', originalWord: 'αἰσθάνομαι', transliteration: 'aisthanomai', pronunciation: p("ahee-sthan'-om-ahee"), shortDefinition: 'to perceive, to understand', fullDefinition: p("To perceive, to understand, to discern. To grasp with the mind or senses."), language: 'greek', partOfSpeech: 'verb', usageCount: 1 },
  { strongsId: 'H7225', originalWord: 'רֵאשִׁית', transliteration: 'reshith', pronunciation: 'ray-sheeth', shortDefinition: 'beginning, first, chief', fullDefinition: p("Beginning, first, firstfruits, chief, choice part. Refers to the first or best portion of something."), language: 'hebrew', partOfSpeech: 'noun', gender: 'feminine', number: 'singular', usageCount: 51 },
  { strongsId: 'H0430', originalWord: 'אֱלֹהִים', transliteration: 'elohim', pronunciation: 'el-o-heem', shortDefinition: 'God, gods, judges', fullDefinition: p("God, gods, judges, divine ones. The plural form used for the one true God in the Hebrew Bible, indicating majesty and fullness."), language: 'hebrew', partOfSpeech: 'noun', gender: 'masculine', number: 'plural', usageCount: 2602 },
  { strongsId: 'H1254', originalWord: 'בָּרָא', transliteration: 'bara', pronunciation: 'baw-raw', shortDefinition: 'to create, to make', fullDefinition: p("To create, to shape, to make. Used exclusively for divine creation producing something new and bringing it into existence."), language: 'hebrew', partOfSpeech: 'verb', usageCount: 54 },
  { strongsId: 'H0804', originalWord: 'שָׁמַיִם', transliteration: 'shamayim', pronunciation: p("shaw-mah'-yim"), shortDefinition: 'heaven, heavens, sky', fullDefinition: p("Heaven, heavens, sky, the visible heavens. The abode of God and the celestial realm."), language: 'hebrew', partOfSpeech: 'noun', gender: 'masculine', number: 'plural', usageCount: 421 },
  { strongsId: 'H0776', originalWord: 'אֶרֶץ', transliteration: 'erets', pronunciation: p("eh'-rets"), shortDefinition: 'earth, land, ground', fullDefinition: p("Earth, land, ground, country. The dry ground as distinct from the heavens and the seas."), language: 'hebrew', partOfSpeech: 'noun', gender: 'feminine', number: 'singular', usageCount: 2504 },
  { strongsId: 'G0157', originalWord: 'αἰτία', transliteration: 'aitia', pronunciation: p("ahee-tee'-ah"), shortDefinition: 'cause, accusation, fault', fullDefinition: p("Cause, reason, ground; accusation, charge, fault."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'nominative', gender: 'feminine', number: 'singular', usageCount: 20 },
  { strongsId: 'G0209', originalWord: 'ἀκωλύτως', transliteration: 'akolutos', pronunciation: p("ak-o-loo'-tos"), shortDefinition: 'without hindrance, freely', fullDefinition: p("Without hindrance, freely, unhinderedly."), language: 'greek', partOfSpeech: 'adverb', usageCount: 1 },
  { strongsId: 'G0686', originalWord: 'ἄρα', transliteration: 'ara', pronunciation: p("ar'-ah"), shortDefinition: 'therefore, so, then', fullDefinition: p("Therefore, so, then, consequently. A particle expressing inference or conclusion."), language: 'greek', partOfSpeech: 'conjunction', usageCount: 49 },
  { strongsId: 'H1961', originalWord: 'הָיָה', transliteration: 'hayah', pronunciation: 'haw-yaw', shortDefinition: 'to be, become, come to pass', fullDefinition: p("To be, to exist, to happen, to become. One of the most common Hebrew verbs, used for existence, occurrence, and divine action."), language: 'hebrew', partOfSpeech: 'verb', usageCount: 3560 },
  { strongsId: 'H8414', originalWord: 'תֹהוּ', transliteration: 'tohu', pronunciation: p("to'-hoo"), shortDefinition: 'formlessness, emptiness, chaos', fullDefinition: p("Formlessness, emptiness, chaos, wasteness. Used to describe the earth before creation and things that are worthless or vain."), language: 'hebrew', partOfSpeech: 'noun', gender: 'masculine', number: 'singular', usageCount: 20 },
  { strongsId: 'H0922', originalWord: 'בֹּהוּ', transliteration: 'bohu', pronunciation: p("bo'-hoo"), shortDefinition: 'emptiness, void, waste', fullDefinition: p("Emptiness, void, waste. Used only in combination with tohu to describe the unformed state of the earth."), language: 'hebrew', partOfSpeech: 'noun', gender: 'masculine', number: 'singular', usageCount: 3 },
  { strongsId: 'G1063', originalWord: 'γάρ', transliteration: 'gar', pronunciation: 'gar', shortDefinition: 'for, because, indeed', fullDefinition: p("For, because, since, indeed, then. A causal conjunction used to introduce a reason or explanation."), language: 'greek', partOfSpeech: 'conjunction', usageCount: 1041 },
  { strongsId: 'G3779', originalWord: 'οὕτως', transliteration: 'houtos', pronunciation: p("hoo'-toce"), shortDefinition: 'so, thus, in this way', fullDefinition: p("So, thus, in this way, in like manner. An adverb of manner pointing to the way something is done."), language: 'greek', partOfSpeech: 'adverb', usageCount: 208 },
  { strongsId: 'G3754', originalWord: 'ὅτι', transliteration: 'hoti', pronunciation: p("hot'-ee"), shortDefinition: 'that, because, since', fullDefinition: p("That, because, since, for. A conjunction used to introduce indirect discourse or give a reason."), language: 'greek', partOfSpeech: 'conjunction', usageCount: 1296 },
  { strongsId: 'G0846', originalWord: 'αὐτός', transliteration: 'autos', pronunciation: p("ow-tos'"), shortDefinition: 'he, himself, same', fullDefinition: p("He, himself, herself, itself, the same. A personal pronoun used for emphasis or reference."), language: 'greek', partOfSpeech: 'pronoun', gender: 'masculine', number: 'singular', usageCount: 5597 },
  { strongsId: 'G1325', originalWord: 'δίδωμι', transliteration: 'didomi', pronunciation: p("did'-o-mee"), shortDefinition: 'to give, to grant', fullDefinition: p("To give, to grant, to bestow, to supply. Used of God giving His Son and of believers giving to others."), language: 'greek', partOfSpeech: 'verb', usageCount: 415 },
  { strongsId: 'G1520', originalWord: 'εἷς', transliteration: 'heis', pronunciation: 'hice', shortDefinition: 'one, a certain, single', fullDefinition: p("One, a certain, single, only one. The cardinal number one, used both numerically and metaphorically for unity."), language: 'greek', partOfSpeech: 'adjective', gender: 'masculine', number: 'singular', usageCount: 343 },
  { strongsId: 'G3439', originalWord: 'μονογενής', transliteration: 'monogenes', pronunciation: p("mon-og-en-ace'"), shortDefinition: 'only begotten, unique, one of a kind', fullDefinition: p("Only begotten, unique, one of a kind. Used of Jesus as the unique Son of God."), language: 'greek', partOfSpeech: 'adjective', gender: 'masculine', number: 'singular', usageCount: 9, crossReferences: 'John 1:14, John 1:18, John 3:16' },
  { strongsId: 'G5207', originalWord: 'υἱός', transliteration: 'huios', pronunciation: p("hwee-os'"), shortDefinition: 'son, offspring, descendant', fullDefinition: p("Son, offspring, descendant, child. Used literally for male children and metaphorically for relationship with God."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'accusative', gender: 'masculine', number: 'singular', usageCount: 377 },
  { strongsId: 'G3956', originalWord: 'πᾶς', transliteration: 'pas', pronunciation: 'pas', shortDefinition: 'all, every, everyone, the whole', fullDefinition: p("All, every, everyone, the whole, everything. Used to indicate totality or universality."), language: 'greek', partOfSpeech: 'adjective', gender: 'masculine', number: 'singular', usageCount: 1243 },
  { strongsId: 'G1722', originalWord: 'ἐν', transliteration: 'en', pronunciation: 'en', shortDefinition: 'in, on, among, by', fullDefinition: p("In, on, among, by, with. A primary preposition denoting position or instrumentality."), language: 'greek', partOfSpeech: 'preposition', usageCount: 2752 },
  { strongsId: 'G3361', originalWord: 'μή', transliteration: 'me', pronunciation: 'may', shortDefinition: 'not, lest, that not', fullDefinition: p("Not, lest, that not. A primary particle of negation used with non-indicative moods."), language: 'greek', partOfSpeech: 'particle', usageCount: 1042 },
  { strongsId: 'G0622', originalWord: 'ἀπόλλυμι', transliteration: 'apollumi', pronunciation: p("ap-ol'-loo-mee"), shortDefinition: 'to destroy, to perish, to lose', fullDefinition: p("To destroy, to perish, to lose, to die. Used both of physical destruction and eternal perdition."), language: 'greek', partOfSpeech: 'verb', usageCount: 90 },
  { strongsId: 'G0235', originalWord: 'ἀλλά', transliteration: 'alla', pronunciation: p("al-lah'"), shortDefinition: 'but, rather, on the contrary', fullDefinition: p("But, rather, on the contrary, nevertheless. A strong adversative conjunction."), language: 'greek', partOfSpeech: 'conjunction', usageCount: 638 },
  { strongsId: 'G2192', originalWord: 'ἔχω', transliteration: 'echo', pronunciation: p("ekh'-o"), shortDefinition: 'to have, to hold, to possess', fullDefinition: p("To have, to hold, to possess, to own. Used both literally and figuratively."), language: 'greek', partOfSpeech: 'verb', usageCount: 708 },
  { strongsId: 'G0166', originalWord: 'αἰώνιος', transliteration: 'aionios', pronunciation: p("ahee-o'-nee-os"), shortDefinition: 'eternal, everlasting, unending', fullDefinition: p("Eternal, everlasting, unending, without beginning or end. Used of God's nature and the life He gives."), language: 'greek', partOfSpeech: 'adjective', gender: 'feminine', number: 'singular', usageCount: 71 },
  { strongsId: 'G2222', originalWord: 'ζωή', transliteration: 'zoe', pronunciation: p("dzo-ay'"), shortDefinition: 'life, living, existence', fullDefinition: p("Life, living, existence. Used of physical life and especially of eternal spiritual life in Christ."), language: 'greek', partOfSpeech: 'noun', grammaticalCase: 'accusative', gender: 'feminine', number: 'singular', usageCount: 135, crossReferences: 'John 1:4, John 3:16, John 14:6' },
];

const VERSE_WORDS_GENESIS_1_1 = [
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 1, surfaceText: 'In', strongsId: 'H7225', lemma: 'reshith', morphology: 'prep' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 2, surfaceText: 'the', strongsId: 'H0430', lemma: 'elohim', morphology: 'art' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 3, surfaceText: 'beginning', strongsId: 'H7225', lemma: 'reshith', morphology: 'noun-fs' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 4, surfaceText: 'God', strongsId: 'H0430', lemma: 'elohim', morphology: 'noun-mp' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 5, surfaceText: 'created', strongsId: 'H1254', lemma: 'bara', morphology: 'verb-qal-perf-3ms' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 6, surfaceText: 'the', strongsId: 'H0804', lemma: 'shamayim', morphology: 'art' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 7, surfaceText: 'heavens', strongsId: 'H0804', lemma: 'shamayim', morphology: 'noun-mp' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 8, surfaceText: 'and', strongsId: 'H1254', lemma: 'bara', morphology: 'conj' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 9, surfaceText: 'the', strongsId: 'H0776', lemma: 'erets', morphology: 'art' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 1, wordOrder: 10, surfaceText: 'earth', strongsId: 'H0776', lemma: 'erets', morphology: 'noun-fs' },
];

const VERSE_WORDS_GENESIS_1_2 = [
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 1, surfaceText: 'Now', strongsId: 'H1961', lemma: 'hayah', morphology: 'conj' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 2, surfaceText: 'the', strongsId: 'H0776', lemma: 'erets', morphology: 'art' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 3, surfaceText: 'earth', strongsId: 'H0776', lemma: 'erets', morphology: 'noun-fs' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 4, surfaceText: 'was', strongsId: 'H1961', lemma: 'hayah', morphology: 'verb-qal-perf-3fs' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 5, surfaceText: 'formless', strongsId: 'H8414', lemma: 'tohu', morphology: 'noun-ms' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 6, surfaceText: 'and', strongsId: 'H0922', lemma: 'bohu', morphology: 'conj' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 7, surfaceText: 'void', strongsId: 'H0922', lemma: 'bohu', morphology: 'noun-ms' },
  { translation: 'Berean', bookName: 'Genesis', chapter: 1, verse: 2, wordOrder: 8, surfaceText: '.', strongsId: null, lemma: null, morphology: null },
];

const VERSE_WORDS_JOHN_3_16 = [
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 1, surfaceText: 'For', strongsId: 'G1063', lemma: 'gar', morphology: 'conj' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 2, surfaceText: 'God', strongsId: 'G2316', lemma: 'theos', morphology: 'noun-nm' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 3, surfaceText: 'so', strongsId: 'G3779', lemma: 'houtos', morphology: 'adv' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 4, surfaceText: 'loved', strongsId: 'G0025', lemma: 'agapao', morphology: 'verb-aor-act-ind-3s' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 5, surfaceText: 'the', strongsId: 'G2889', lemma: 'kosmos', morphology: 'art' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 6, surfaceText: 'world', strongsId: 'G2889', lemma: 'kosmos', morphology: 'noun-am' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 7, surfaceText: 'that', strongsId: 'G3754', lemma: 'hoti', morphology: 'conj' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 8, surfaceText: 'He', strongsId: 'G0846', lemma: 'autos', morphology: 'ppro-nm3s' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 9, surfaceText: 'gave', strongsId: 'G1325', lemma: 'didomi', morphology: 'verb-aor-act-ind-3s' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 10, surfaceText: 'His', strongsId: 'G0846', lemma: 'autos', morphology: 'ppro-gm3s' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 11, surfaceText: 'one', strongsId: 'G1520', lemma: 'heis', morphology: 'adj-am' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 12, surfaceText: 'and', strongsId: 'G3439', lemma: 'monogenes', morphology: 'conj' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 13, surfaceText: 'only', strongsId: 'G3439', lemma: 'monogenes', morphology: 'adj-am' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 14, surfaceText: 'Son', strongsId: 'G5207', lemma: 'huios', morphology: 'noun-am' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 15, surfaceText: 'that', strongsId: 'G3754', lemma: 'hoti', morphology: 'conj' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 16, surfaceText: 'whoever', strongsId: 'G3956', lemma: 'pas', morphology: 'adj-nm' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 17, surfaceText: 'believes', strongsId: 'G4100', lemma: 'pisteuo', morphology: 'verb-pres-act-part-nm' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 18, surfaceText: 'in', strongsId: 'G1722', lemma: 'en', morphology: 'prep' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 19, surfaceText: 'Him', strongsId: 'G0846', lemma: 'autos', morphology: 'ppro-am3s' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 20, surfaceText: 'shall', strongsId: 'G3361', lemma: 'me', morphology: 'part' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 21, surfaceText: 'not', strongsId: 'G3361', lemma: 'me', morphology: 'part' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 22, surfaceText: 'perish', strongsId: 'G0622', lemma: 'apollumi', morphology: 'verb-aor-mid-subj-3s' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 23, surfaceText: 'but', strongsId: 'G0235', lemma: 'alla', morphology: 'conj' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 24, surfaceText: 'have', strongsId: 'G2192', lemma: 'echo', morphology: 'verb-pres-act-subj-3s' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 25, surfaceText: 'eternal', strongsId: 'G0166', lemma: 'aionios', morphology: 'adj-afs' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 26, surfaceText: 'life', strongsId: 'G2222', lemma: 'zoe', morphology: 'noun-afs' },
  { translation: 'Berean', bookName: 'John', chapter: 3, verse: 16, wordOrder: 27, surfaceText: '.', strongsId: null, lemma: null, morphology: null },
];

async function seed() {
  console.log('Seeding Strong\'s dictionary...');

  for (const entry of STRONGS_ENTRIES) {
    await prisma.strongsDictionary.upsert({
      where: { strongsId: entry.strongsId },
      update: entry,
      create: entry,
    });
  }
  console.log(`  ✓ ${STRONGS_ENTRIES.length} Strong's entries seeded`);

  const allVerseWords = [...VERSE_WORDS_GENESIS_1_1, ...VERSE_WORDS_GENESIS_1_2, ...VERSE_WORDS_JOHN_3_16];

  // Clear existing verse words first to prevent duplicates
  await prisma.verseWord.deleteMany({});
  console.log('  ✓ Cleared existing verse word mappings');

  await prisma.verseWord.createMany({
    data: allVerseWords,
  });
  console.log(`  ✓ ${allVerseWords.length} verse word mappings seeded`);

  console.log('Seed complete!');
}

seed()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
