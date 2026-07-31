import { prisma } from "../../config/db.js";
import { cache } from "../../services/cacheService.js";
import {
  normalizeBook,
  detectGenre,
  GENRE_INTROS,
  GENRE_TAGS,
} from "./templates/genres.js";
import {
  detectThemes,
  THEME_LESSONS,
  DEFAULT_LESSON,
  THEME_APPLICATIONS,
  DEFAULT_APPS,
  THEME_PRAYERS,
  DEFAULT_PRAYERS,
} from "./templates/themes.js";
import {
  idx,
  extractPhrases,
  firstSentence,
  firstSentences,
  dedupeContextVerses,
  cleanVerseText,
} from "./templates/utils.js";
import { buildPromptAnswer } from "./templates/promptAnswers.js";

const memCache = new Map();
const CACHE_TTL = 12 * 60 * 60;

// Bump when template data changes so cached responses are rebuilt with the
// new engine instead of serving stale pre-refactor output for 12h.
const TEMPLATE_VERSION = "v11";

/**
 * Fetch the primary verse text, preferring the app's default reading (BSB).
 * The search index stores the same verse in 28 translations; a bare findFirst
 * returns whichever row Prisma hits first — often AMP (with parenthetical
 * glosses) or a paraphrase. Preferring BSB keeps AI quotes consistent with
 * what the reader sees in the Bible.
 */
async function fetchVerseText(bookName, chapter, verse) {
  const rows = await prisma.searchIndex.findMany({
    where: { bookName, chapter, verse },
    select: { verseText: true, translation: true },
    orderBy: { translation: "asc" },
    take: 30,
  });
  return (rows.find(r => r.translation === "BSB") || rows[0])?.verseText || "";
}

/**
 * Fill {{placeholders}} in a template string. When a placeholder's value is
 * falsy, the whole sentence containing it is dropped so generated text never
 * says awkward things like `The phrase "" reveals...`.
 */
function fill(template, vars) {
  let out = String(template);
  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), () => value);
    } else {
      // Remove the entire sentence that references the empty placeholder.
      out = out.replace(new RegExp(`[^.!?]*\\{\\{${key}\\}\\}[^.!?]*[.!?]?\\s*`, "g"), "");
    }
  }
  return out
    .replace(/\{\{\w+\}\}/g, "")
    .replace(/…/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildIntro(ref, text, prologue, phrases, genre, contextVerses, verseNum) {
  const i = idx(ref);
  const variant = i % 4;
  const opener = phrases.opener;

  const contextNote = contextVerses?.filter(v => v.verse !== verseNum)
    .slice(0, 2).map(v => firstSentence(cleanVerseText(v.verseText))).join("; ") || "";

  if (variant === 0) {
    if (prologue) {
      const base = `${ref} opens with a profound declaration: "${text}" ${prologue.author ? `${prologue.author}, ` : ""}writing ${prologue.dateWritten ? `around ${prologue.dateWritten}` : ""}${prologue.audience ? ` to ${prologue.audience}` : ""}, sets before us a truth that has shaped the faith of believers for generations.`;
      return contextNote ? `${base} The surrounding passage reminds us that "${contextNote}"` : base;
    }
    const base = `"${opener}" — with these words, ${ref} ${GENRE_INTROS[genre] || "invites us into a truth that has resonated with believers across every generation."}`;
    return contextNote ? `${base} The surrounding verses set the scene: "${contextNote}"` : base;
  }
  if (variant === 1) {
    if (prologue) {
      const base = `The message of ${ref} emerges from ${prologue.bookName}, a book that emphasizes ${prologue.keyTheme ? prologue.keyTheme.toLowerCase() : "the character and purposes of God"}. ${prologue.purpose ? prologue.purpose.charAt(0).toUpperCase() + prologue.purpose.slice(1) + "." : ""} Here the Scripture declares: "${text}"`;
      return contextNote ? `${base} This comes in the context of: "${contextNote}"` : base;
    }
    const base = `${ref} speaks directly to the human heart: "${text}" These words carry weight far beyond their simple expression.`;
    return contextNote ? `${base} The surrounding verses remind us: "${contextNote}"` : base;
  }
  if (variant === 2) {
    if (prologue) {
      const base = `${ref} comes from a pivotal moment in redemptive history. ${prologue.summary ? prologue.summary.split(".")[0] + "." : ""} ${prologue.author ? `${prologue.author}, ` : ""}writing ${prologue.dateWritten ? `around ${prologue.dateWritten}` : ""}, brings us these words: "${text}"`;
      return contextNote ? `${base} The immediate context shows: "${contextNote}"` : base;
    }
    return `There are verses that stop us in our tracks, and ${ref} is one of them. "${text}" It demands our attention and invites our response.`;
  }
  if (prologue) {
    const base = `In ${ref}, we encounter one of the most significant statements of Scripture. "${text}" As part of ${prologue.bookName}${prologue.dateWritten ? `, written around ${prologue.dateWritten}` : ""}${prologue.author ? ` by ${prologue.author}` : ""}, this verse carries the full weight of divine revelation.`;
    return contextNote ? `${base} The context around it says: "${contextNote}"` : base;
  }
  const base = `${ref} presents a truth that has anchored believers throughout the ages. "${text}" These are words to live by.`;
  return contextNote ? `${base} The verses around it echo this: "${contextNote}"` : base;
}

function buildLesson(ref, text, prologue, phrases, themes, genre) {
  const i = idx(ref);
  const theme1 = themes[0] || "";
  const theme2 = themes[1] || "";
  const christConn = prologue?.christConnection || "";
  const genreTag = GENRE_TAGS[genre] || "";
  // Always ground the lesson in a real quote from the verse. When no
  // "so that / because" clause exists, fall back to the verse's first
  // sentence so the lesson never collapses into an empty {{keyClause}}.
  // Only the short marker-derived clause is lowercased (it reads mid-sentence);
  // the full-sentence fallback keeps its capitalization and proper nouns.
  const vars = {
    keyClause: phrases.keyClause ? phrases.keyClause.toLowerCase() : firstSentence(text),
    opener: phrases.opener,
  };

  const template = THEME_LESSONS[theme1] || DEFAULT_LESSON;
  let primary = fill(template, vars).replace(/\{\{christConn\}\}/g, "").trim();

  const extras = [];
  if (genreTag) extras.push(genreTag);
  if (christConn) extras.push(christConn);
  if (extras.length > 0) primary = `${primary}\n\n${extras.join("\n\n")}`;

  let secondary = "";
  if (theme2 && THEME_LESSONS[theme2]) {
    secondary = `\n\n${fill(THEME_LESSONS[theme2], vars).replace(/\{\{christConn\}\}/g, "").split(". ").slice(1, 3).join(". ")}`;
  }

  return primary + secondary;
}

function buildApplication(text, phrases, themes) {
  const i = idx(text || "");
  const variant = i % 3;
  const theme1 = themes[0] || "";
  const pool = THEME_APPLICATIONS[theme1] || DEFAULT_APPS;
  return fill(pool[variant % pool.length], { opener: phrases.opener, keyClause: phrases.keyClause });
}

function buildPrayer(ref, text, phrases, themes) {
  const i = idx(ref);
  const variant = i % 2;
  const theme1 = themes[0] || "";
  const pool = THEME_PRAYERS[theme1] || DEFAULT_PRAYERS;
  return fill(pool[variant % pool.length], { opener: phrases.opener, keyClause: phrases.keyClause });
}

function buildWordStudy(verseResource) {
  if (!verseResource?.wordStudies) return null;
  try {
    const raw = JSON.parse(verseResource.wordStudies);
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.slice(0, 2).map(w => {
      const term = w.word || w.term || w.strongs || "";
      const def = w.meaning || w.definition || w.text || w.description || "";
      return term && def ? `**${term}** — ${def}` : null;
    }).filter(Boolean).join("\n\n");
  } catch { return null; }
}

function buildCrossReferences(verseResource) {
  if (!verseResource?.crossReferences) return null;
  try {
    const raw = JSON.parse(verseResource.crossReferences);
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.slice(0, 3).map(r => {
      const ref = r.ref || r.reference || r.verse || "";
      const text = r.text || r.summary || r.meaning || "";
      return ref ? `${ref}${text ? `: ${text}` : ""}` : null;
    }).filter(Boolean).join("\n\n");
  } catch { return null; }
}

function buildOriginalWordStudy(wordStudyEntries) {
  if (!wordStudyEntries?.length) return null;
  const entries = wordStudyEntries
    .filter(w => w.strongs?.shortDefinition)
    .slice(0, 3);
  if (!entries.length) return null;
  return entries.map(w => {
    const s = w.strongs;
    const term = s.originalWord || w.lemma || w.surfaceText;
    const translit = s.transliteration ? ` (${s.transliteration})` : "";
    const def = s.shortDefinition;
    return term ? `**${term}**${translit} — ${def}` : null;
  }).filter(Boolean).join("\n\n");
}

function buildChapterInsights(chapterTools) {
  if (!chapterTools?.length) return null;
  const labels = {
    PROMISE: "Key Promise",
    COMMAND: "Key Command",
    WARNING: "Key Warning",
    REPEATED_WORD: "Key Repeated Word",
    TRANSITION: "Key Transition",
    CONTRAST: "Key Contrast",
  };
  return chapterTools.slice(0, 4).map(t => {
    const label = labels[t.toolType] || t.toolType;
    const desc = t.description || t.label;
    return `**${label}**: ${desc}`;
  }).join("\n\n");
}

function buildContextField(contextVerses, verseNum) {
  if (!contextVerses?.length) return null;
  const deduped = dedupeContextVerses(contextVerses, verseNum);
  if (!deduped.length) return null;
  return deduped.map(v => `**Verse ${Number(v.verse)}:** ${cleanVerseText(v.verseText)}`).join("\n\n");
}

function blendSources({ dailyExegesis, verseExplanation, verseResource, prologue, verseText, ref, depth, themes, genre, contextVerses, chapterTools, wordStudyEntries, verseNum }) {
  const phrases = extractPhrases(verseText);
  const isDetailed = depth === "detailed";
  const isBrief = depth === "brief";

  const result = { ref, text: verseText || "" };

  result.intro = (dailyExegesis?.introduction || dailyExegesis?.contextSummary)
    || buildIntro(ref, verseText, prologue, phrases, genre, contextVerses, verseNum);

  const lessonParts = [];
  if (dailyExegesis?.teachingBody) lessonParts.push(dailyExegesis.teachingBody);
  if (verseExplanation?.explanation) {
    const expl = verseExplanation.explanation;
    if (!lessonParts.length || !lessonParts[0].includes(expl.slice(0, 60))) {
      lessonParts.push(expl);
    }
  }
  if (!lessonParts.length) {
    lessonParts.push(buildLesson(ref, verseText, prologue, phrases, themes, genre));
  }
  if (isDetailed && verseResource?.commentaries) {
    try {
      const comms = JSON.parse(verseResource.commentaries);
      if (Array.isArray(comms) && comms[0]?.text) {
        const snippet = typeof comms[0].text === "string" ? comms[0].text.slice(0, 350).trim() : "";
        if (snippet) lessonParts.push(snippet);
      }
    } catch {}
  }
  if (verseExplanation?.learnMore && !lessonParts.some(p => p.includes(verseExplanation.learnMore))) {
    lessonParts.push(`For further study: ${verseExplanation.learnMore}`);
  }
  result.explanation = lessonParts.join("\n\n");

  if (!isBrief && dailyExegesis?.application) {
    result.application = dailyExegesis.application;
  } else if (!isBrief) {
    result.application = buildApplication(verseText, phrases, themes);
  }

  result.prayer = dailyExegesis?.prayer || buildPrayer(ref, verseText, phrases, themes);

  // Keep Lab notes and abide fields concise: brief/standard depth trim the
  // long sections to their opening sentences (so the notes field isn't a wall
  // of text); detailed depth stays complete for deep study.
  if (isBrief) {
    result.intro = firstSentences(result.intro, 1);
    result.explanation = firstSentences(result.explanation, 2);
    if (result.application) result.application = firstSentences(result.application, 1);
    if (result.prayer) result.prayer = firstSentences(result.prayer, 2);
  } else if (!isDetailed) {
    result.explanation = firstSentences(result.explanation, 3);
    if (result.application) result.application = firstSentences(result.application, 2);
    // Prayer stays complete at standard depth — it's used directly in the
    // Abide stage, where a truncated prayer missing its closing "Amen."
    // would feel wrong.
  }

  if (isDetailed) {
    const ws = buildWordStudy(verseResource);
    const ows = buildOriginalWordStudy(wordStudyEntries);
    if (ws) {
      result.wordStudy = ws;
    } else if (ows) {
      result.wordStudy = ows;
    } else {
      const raw = wordStudyEntries?.filter(w => w.strongs?.shortDefinition)?.slice(0, 3)
        .map(w => `**${w.strongs.originalWord || w.lemma || w.surfaceText}**${w.strongs.transliteration ? ` (${w.strongs.transliteration})` : ""} — ${w.strongs.shortDefinition}`)
        .join("\n\n");
      if (raw) result.wordStudy = raw;
    }
    const cr = buildCrossReferences(verseResource);
    if (cr) result.crossReferences = cr;
    const ctx = buildContextField(contextVerses, verseNum);
    if (ctx) result.context = ctx;
    const ci = buildChapterInsights(chapterTools);
    if (ci) result.chapterInsights = ci;
  }

  return result;
}

export async function explainVerses(book, chapter, verse, depth = "standard") {
  const bookName = normalizeBook(book);
  const cacheKey = `ai:${TEMPLATE_VERSION}:${bookName}:${chapter}:${verse}:${depth}`;

  if (memCache.has(cacheKey)) return memCache.get(cacheKey);
  const cached = await cache.get("ai", cacheKey);
  if (cached) {
    memCache.set(cacheKey, cached);
    return cached;
  }

  const ref = `${bookName} ${chapter}:${verse}`;
  const genre = detectGenre(bookName);
  const isDetailed = depth === "detailed";

  const [rawVerseText, prologue, dailyExegesis, verseExplanation, verseResource, contextVerses, chapterTools, wordStudyEntries] = await Promise.all([
    fetchVerseText(bookName, chapter, verse),
    prisma.bookPrologue.findUnique({ where: { bookName } }),
    prisma.dailyExegesis.findFirst({
      where: { passageReference: ref },
      select: { introduction: true, contextSummary: true, teachingBody: true, application: true, prayer: true },
    }),
    prisma.verseExplanation.findUnique({
      where: { bookName_chapter_verseNumber: { bookName, chapter, verseNumber: verse } },
      select: { explanation: true, learnMore: true },
    }),
    prisma.verseResource.findFirst({
      where: { bookName, chapter, verseStart: { lte: verse }, OR: [{ verseEnd: null }, { verseEnd: { gte: verse } }] },
      select: { commentaries: true, crossReferences: true, wordStudies: true },
    }),
    prisma.searchIndex.findMany({
      where: { bookName, chapter, verse: { gte: Math.max(1, verse - 2), lte: verse + 2 } },
      select: { verse: true, verseText: true, translation: true },
      orderBy: [{ verse: "asc" }, { translation: "asc" }],
      take: 150,
    }),
    isDetailed ? prisma.chapterStudyTool.findMany({
      where: { bookName: bookName, chapter },
      select: { toolType: true, label: true, description: true },
      orderBy: { order: "asc" },
    }) : [],
    isDetailed ? prisma.verseWord.findMany({
      where: { bookName: bookName, chapter, verse },
      select: {
        surfaceText: true,
        lemma: true,
        strongs: { select: { originalWord: true, transliteration: true, shortDefinition: true } },
      },
      orderBy: { wordOrder: "asc" },
    }) : [],
  ]);

  const verseText = cleanVerseText(rawVerseText);
  const themes = detectThemes(verseText);

  const result = blendSources({
    dailyExegesis, verseExplanation, verseResource, prologue,
    verseText, ref, depth, themes, genre,
    contextVerses: contextVerses || [],
    chapterTools: chapterTools || [],
    wordStudyEntries: wordStudyEntries || [],
    verseNum: verse,
  });

  memCache.set(cacheKey, result);
  await cache.set("ai", cacheKey, result, CACHE_TTL);
  return result;
}

export async function generatePromptAnswer(book, chapter, verse, promptIdx) {
  const idxNum = parseInt(promptIdx, 10);
  if (isNaN(idxNum) || idxNum < 0 || idxNum > 5) {
    return { error: "Invalid prompt index. Must be 0-5." };
  }

  const bookName = normalizeBook(book);
  const ch = parseInt(chapter, 10);
  const vs = parseInt(verse, 10);
  const genre = detectGenre(bookName);

  // Fetch prologue separately — it's NOT returned by explainVerses
  const [prologue, analysis] = await Promise.all([
    prisma.bookPrologue.findUnique({ where: { bookName } }),
    explainVerses(bookName, ch, vs, "detailed"),
  ]);

  if (!analysis) {
    return { error: "Could not generate analysis for this passage." };
  }

  // Re-fetch for the prompt builder — get full verse text and chapter-level tools
  const [rawVerseText, chapterTools, contextVerses] = await Promise.all([
    fetchVerseText(bookName, ch, vs),
    prisma.chapterStudyTool.findMany({
      where: { bookName, chapter: ch },
      select: { toolType: true, label: true, description: true },
      orderBy: { order: "asc" },
    }),
    prisma.searchIndex.findMany({
      where: { bookName, chapter: ch, verse: { gte: Math.max(1, vs - 3), lte: vs + 3 } },
      select: { verse: true, verseText: true, translation: true },
      orderBy: [{ verse: "asc" }, { translation: "asc" }],
      take: 200,
    }),
  ]);

  const verseText = cleanVerseText(rawVerseText || analysis.text || "");
  const themes = detectThemes(verseText);

  // Deduplicate surrounding verses: one reading per verse, BSB preferred,
  // so the answer never repeats the same verse in multiple translations.
  // Gloss content (Amplified parentheticals) is stripped from each reading.
  const ctxVerses = dedupeContextVerses(contextVerses, vs)
    .slice(0, 4)
    .map(v => `Verse ${v.verse}: "${cleanVerseText(v.verseText)}"`)
    .join("\n");

  const answer = buildPromptAnswer(idxNum, {
    ref: analysis.ref,
    verseText,
    themes,
    chapterTools: chapterTools || [],
    wordStudy: analysis.wordStudy,
    prologue,
    genre,
    explanation: analysis.explanation,
    intro: analysis.intro,
    crossReferences: analysis.crossReferences,
    context: analysis.context,
    chapterInsights: analysis.chapterInsights,
    contextVersesStr: ctxVerses,
  });

  return {
    promptIdx: idxNum,
    answer,
    verseRef: analysis.ref,
  };
}
