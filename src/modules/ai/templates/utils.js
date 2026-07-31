// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for the AI template engine.
// Pure functions only — no I/O, no Prisma. Kept here so the prompt/explain
// templates can reuse identical logic and stay consistent.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stable string hash used to pick a template variant for a given verse.
 * Deterministic across restarts so the same verse always gets the same tone.
 */
export function idx(ref) {
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = ((h << 5) - h) + ref.charCodeAt(i);
  return Math.abs(h);
}

export const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "for", "nor", "so", "yet",
  "of", "in", "on", "at", "to", "by", "with", "from", "into", "upon",
  "is", "are", "was", "were", "be", "been", "being", "am",
  "he", "she", "it", "they", "them", "we", "you", "your", "our", "his", "her", "its", "their",
  "that", "this", "these", "those", "there", "which", "who", "whom", "whose", "what", "when", "where", "how", "why",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should", "can", "could", "may", "might", "must",
  "not", "no", "yes", "if", "as", "than", "then", "then", "while", "because", "all", "every", "some", "any", "many", "more",
]);

/**
 * Strip Amplified-Bible-style parenthetical and bracketed glosses from a
 * verse before analysis or quoting.
 *
 * The Amplified translation expands meaning inline, e.g.
 *   "Blessed (happy, to be envied, and spiritually prosperous--with life-joy
 *    and satisfaction in God's favor and salvation, regardless of their
 *    outward conditions) are the poor in spirit..."
 * These glosses pollute word-frequency, theme detection, and every quote of
 * the verse. This helper removes the gloss content (and collapses the
 * whitespace it leaves behind) so the engine analyzes and quotes the verse
 * itself.
 */
export function cleanVerseText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull out the structural phrases of a verse: its opening words, a key
 * "purpose/result" clause when present, and its closing words.
 */
export function extractPhrases(text) {
  if (!text) return { opener: "", keyClause: "", verseEnd: "", wordCount: 0 };
  const words = text.split(/\s+/).filter(Boolean);
  const opener = words.slice(0, Math.min(4, words.length)).join(" ");
  let keyClause = "";
  const markers = ["so that", "for God", "for the", "for theirs", "for they", "because", "but whoever", "and this", "that whoever", "that whosoever", "in order that", "that we", "that you", "so that we", "so that you", "that we may", "that you may", "not by", "but by", "but God", "yet God", "even so", "therefore", "wherefore"];
  for (const m of markers) {
    const at = text.toLowerCase().indexOf(m);
    if (at > 3 && at < text.length * 0.85) {
      keyClause = text.slice(at, at + 100).split(/[.!?;,]/)[0].trim();
      break;
    }
  }
  const verseEnd = words.slice(-3).join(" ");
  return { opener, keyClause, verseEnd, wordCount: words.length };
}

/**
 * Split text into sentences at sentence-ending punctuation followed by
 * whitespace. Handles quotes after the period ("…things." Then …) so a
 * sentence ending inside a quoted phrase is not broken mid-quote.
 */
function splitSentences(text) {
  return String(text).split(/(?<=[.!?]["')]*)\s+/);
}

/**
 * First sentence of a piece of text, without breaking inside quotation marks.
 * If the sentence ends mid-quote, the quote is closed for clean display.
 */
export function firstSentence(text) {
  if (!text) return "";
  let sentence = splitSentences(text)[0] || text;
  // If we split inside a quoted phrase (odd number of quote marks), close it.
  const quotes = (sentence.match(/["']/g) || []).length;
  if (quotes % 2 === 1) {
    sentence = sentence.replace(/[.!?]\s*$/, '"');
  }
  return sentence;
}

/**
 * First N sentences of a piece of text, without breaking inside quotes.
 * Used to keep Lab notes, applications, and prayers concise at "standard"
 * depth while detailed answers stay complete.
 */
export function firstSentences(text, count = 2) {
  if (!text) return "";
  const parts = splitSentences(text);
  if (parts.length <= count) return text;
  let out = parts.slice(0, count).join(" ");
  // Close any dangling quote introduced by the cut.
  const quotes = (out.match(/["']/g) || []).length;
  if (quotes % 2 === 1) {
    out = out.replace(/[.!?]\s*$/, '"');
  }
  return out;
}

/**
 * Pick the words worth circling in a verse.
 * 1) If curated Strong's word-study entries exist, use those terms (with their
 *    transliterations) — they are the most precise data available.
 * 2) Otherwise fall back to the longest, non-stopword words in the verse.
 */
export function extractSignificantWords(verseText, wordStudy, themes = []) {
  const significant = [];

  // Preferred source: curated word-study data ("**ἀγαπάω** (agapaō) — to love")
  if (wordStudy) {
    for (const line of String(wordStudy).split("\n")) {
      const termMatch = line.match(/\*\*([^*]+)\*\*(?:\s*\(([^)]+)\))?/);
      if (termMatch) {
        const term = termMatch[1].trim();
        const translit = termMatch[2] ? termMatch[2].trim() : "";
        if (term && term.length > 1) {
          significant.push(translit ? `${term} (${translit})` : term);
        }
      }
      if (significant.length >= 5) break;
    }
  }

  // Fallback: theme-aware, stopword-free words from the verse itself.
  // Words matching the detected themes rank first (they carry the passage's
  // weight), then words that repeat (repetition is emphasis), then longer
  // words — so "offering/bull/grain/flour" beat "second/young/fine" filler.
  if (significant.length === 0 && verseText) {
    const themeWordAliases = {
      love: ["love", "loved", "loving"],
      faith: ["faith", "believe", "believed", "believing", "trust"],
      life: ["life", "live", "living", "eternal", "salvation", "savior"],
      light: ["light", "darkness", "shine", "radiance"],
      hope: ["hope", "hoped", "promise", "promised", "covenant"],
      grace: ["grace", "gracious", "mercy", "merciful", "forgive", "forgiveness", "redemption"],
      power: ["power", "mighty", "authority", "strength"],
      peace: ["peace", "peaceful", "rest", "comfort"],
      fear: ["fear", "afraid", "anxious", "worry"],
      obedience: ["obey", "obedience", "command", "commandment", "keep"],
      warning: ["warn", "warning", "repent", "repentance"],
      praise: ["rejoice", "praise", "thank", "thanksgiving", "sing", "glory"],
      suffering: ["suffer", "suffering", "pain", "trouble", "tribulation", "affliction"],
      healing: ["heal", "healed", "healing", "whole", "restore", "restored"],
      death: ["death", "die", "dead", "grave", "perish", "destroy"],
      kingship: ["king", "kingdom", "reign", "throne", "ruler"],
      blessing: ["bless", "blessed", "blessing", "inherit", "inheritance"],
      providence: ["providence", "sovereign", "sovereignty", "orchestrate", "appointed", "prepared", "guided", "guidance", "directed", "provide", "provided", "provision", "trust", "trusting", "trusted", "rely", "confidence", "depend", "redeemer", "purpose"],
      wisdom: ["wisdom", "wise", "understanding", "knowledge", "truth"],
      judgment: ["sin", "sinner", "judgment", "condemn", "wrath", "judge"],
      justice: ["justice", "just", "righteous", "righteousness", "upright", "integrity", "equity", "oppressed", "injustice"],
      humility: ["humble", "humility", "meek", "meekness", "lowly", "gentle", "gentleness", "contrite"],
      holiness: ["holy", "holiness", "sanctify", "sanctified", "sanctification", "pure", "purity", "purify", "consecrate", "consecrated", "unclean"],
      unity: ["unity", "united", "unite", "fellowship", "harmony"],
      joy: ["joy", "joyful", "glad", "gladness", "rejoice", "rejoiced", "delight", "delighted"],
    };
    const themeWords = new Set();
    for (const t of themes || []) {
      (themeWordAliases[t] || []).forEach(w => themeWords.add(w));
    }
    // Ordinals and generic modifiers rarely carry a passage's weight on their
    // own — "second young bull" points at the bull, not the second or young.
    const weakCircleWords = new Set([
      "first", "second", "third", "fourth", "fifth", "sixth", "seventh",
      "eighth", "ninth", "tenth", "last", "next", "other", "another",
      "young", "fine", "mixed", "whole", "full", "great", "small",
      "little", "old", "new", "many", "much", "more", "most",
      // Light verbs and filler that rarely carry a verse's weight on their own.
      "take", "took", "takes", "make", "made", "makes", "give", "gave",
      "gives", "given", "let", "put", "go", "went", "come", "came",
      "say", "said", "know", "knew", "see", "saw", "seen", "want",
      "need", "use", "tell", "told", "bring", "brought", "keep",
      "kept", "keeps",
    ]);
    const seen = new Set();
    const freq = {};
    for (const raw of verseText.split(/\s+/)) {
      const w = raw.replace(/[^A-Za-z'-]/g, "").toLowerCase();
      if (w) freq[w] = (freq[w] || 0) + 1;
    }
    const candidates = [];
    for (const raw of verseText.split(/\s+/)) {
      const w = raw.replace(/[^A-Za-z'-]/g, "").toLowerCase();
      if (w.length < 4 || STOPWORDS.has(w) || weakCircleWords.has(w) || seen.has(w)) continue;
      seen.add(w);
      candidates.push(w);
    }
    candidates.sort((a, b) => {
      const aTheme = themeWords.has(a) ? 1 : 0;
      const bTheme = themeWords.has(b) ? 1 : 0;
      if (aTheme !== bTheme) return bTheme - aTheme;
      const aRep = (freq[a] || 0) > 1 ? 1 : 0;
      const bRep = (freq[b] || 0) > 1 ? 1 : 0;
      if (aRep !== bRep) return bRep - aRep;
      return b.length - a.length;
    });
    significant.push(...candidates.slice(0, 5));
  }

  return significant;
}

/**
 * Deduplicate context-verse rows by verse number, preferring the BSB
 * translation (the app's default reading text). Returns one row per verse.
 */
export function dedupeContextVerses(rows, excludeVerse) {
  if (!rows?.length) return [];
  const byVerse = {};
  for (const v of rows) {
    const key = Number(v.verse);
    if (!Number.isFinite(key) || key === Number(excludeVerse)) continue;
    const current = byVerse[key];
    // Prefer BSB; otherwise keep the first row for that verse.
    if (!current || (v.translation === "BSB" && current.translation !== "BSB")) {
      byVerse[key] = v;
    }
  }
  return Object.values(byVerse).sort((a, b) => Number(a.verse) - Number(b.verse));
}
