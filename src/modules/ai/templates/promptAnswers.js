// ─────────────────────────────────────────────────────────────────────────────
// Look-stage prompt answer builders (promptIdx 0–5).
// Rewritten to read like a thoughtful study partner rather than a form letter:
// warmer connective language, the actual verse quoted, curated word-study data
// prioritized over crude regex picks, and context verses deduplicated.
//
// Answers are written as CLEAN PLAIN TEXT — no `**` or `*` markers — because
// the Look stage inserts them directly into a plain observation textarea where
// asterisks would render literally. Structure is carried by paragraph breaks,
// natural section labels, and `•` / `1.` list lines instead.
// ─────────────────────────────────────────────────────────────────────────────

import {
  GENRE_VOICES,
  GENRE_LABELS,
  GENRE_REPETITION_GUIDES,
  GENRE_CONTRAST_GUIDES,
} from "./genres.js";
import {
  THEME_QUESTIONS,
  THEME_CONTRASTS,
  CONTRAST_PAIRS,
  DEFAULT_LESSON,
} from "./themes.js";
import {
  scanVerseForCategories,
  categorizeVerse,
  buildTruthSection,
} from "./truths.js";
import {
  firstSentence,
  extractSignificantWords,
  extractPhrases,
  STOPWORDS,
  cleanVerseText,
} from "./utils.js";

// Answer-size budgets per question, in characters. A focused question (e.g.
// repetition) earns a short answer; a question-heavy prompt (5) gets room.
// This keeps answers proportional to the question being asked.
const ANSWER_BUDGETS = { 0: 2100, 1: 2200, 2: 1800, 3: 1500, 4: 1600, 5: 2400 };

/** Strip the template engine's ** and * markers for plain-text display. */
function plain(text) {
  return String(text ?? "")
    .replace(/\*\*/g, "")
    .replace(/\*([^*]+)\*/g, "$1");
}

function fitToBudget(text, budget) {
  if (text.length <= budget) return text;
  // Drop whole trailing sections (joined with \n\n) until under budget so
  // section labels, lists, and quoted blocks stay intact — never cut mid-text.
  // The first section is always kept whole (even if oversized) to avoid
  // cutting the opening verse quote.
  const sections = text.split("\n\n");
  const kept = [];
  let len = 0;
  for (const s of sections) {
    const add = kept.length === 0 ? s.length : s.length + 2;
    if (kept.length > 0 && len + add > budget) break;
    kept.push(s);
    len += add;
  }
  return kept.join("\n\n");
}

/**
 * Build a prompt-specific answer for the Look stage reflection prompts.
 * Uses existing AI analysis data to generate relevant, human observations
 * based on the prompt type (index 0–5).
 */
export function buildPromptAnswer(promptIdx, {
  ref, verseText: rawVerseText, themes, chapterTools, wordStudy, prologue, genre,
  explanation, intro, crossReferences, chapterInsights, context, contextVersesStr,
}) {
  // Strip Amplified-style parenthetical glosses before any analysis or quoting
  // so "and"/"the" gloss filler never shows up as repeated words, gloss words
  // never steer theme detection, and quotes stay clean.
  const verseText = cleanVerseText(rawVerseText);
  const theme1 = themes[0] || "";
  const theme2 = themes[1] || "";
  const genreName = genre || "scripture";
  const phrases = extractPhrases(verseText);
  const { opener, closer, wordCount } = phrases;

  const hasCommand = chapterTools?.some(t => t.toolType === "COMMAND");
  const hasPromise = chapterTools?.some(t => t.toolType === "PROMISE");
  const hasWarning = chapterTools?.some(t => t.toolType === "WARNING");
  const hasContrast = chapterTools?.some(t => t.toolType === "CONTRAST");
  const hasRepeatedWord = chapterTools?.some(t => t.toolType === "REPEATED_WORD");
  const hasTransition = chapterTools?.some(t => t.toolType === "TRANSITION");

  const answers = [
    // ── Prompt 0: "What specific words or phrases stand out to you?" ──
    () => {
      const parts = [];

      // Lead with the verse itself — let the reader see it whole first.
      if (verseText) {
        parts.push(`Start with the verse itself — ${ref}: "${verseText}"`);
      }

      if (intro) {
        parts.push(`Passage context: ${plain(firstSentence(intro))}`);
      }

      // Curated word-study data (the most precise source we have)
      if (wordStudy) {
        const studyLines = wordStudy.split("\n\n").filter(Boolean);
        if (studyLines.length > 0) {
          parts.push(`Key terms to observe:\n${studyLines.slice(0, 3).map(plain).join("\n")}`);
        }
      }

      // Significant words — prefer Strong's terms, fall back to the verse itself
      const significant = extractSignificantWords(verseText, wordStudy, themes);
      if (significant.length > 0) {
        const circled = significant.slice(0, 5).join(", ");
        parts.push(`Words worth circling: ${circled} — ${significant.length === 1 ? "this word" : "each of these"} repays a slower, closer look.`);
      }

      if (verseText && opener) {
        parts.push(`Notice how the verse opens with "${opener}" — these first words set the tone for everything that follows.`);
        if (closer && wordCount > 5) {
          parts.push(`And it concludes with "${closer}" — the closing words leave that thought ringing as the final emphasis.`);
        }
      }

      if (crossReferences) {
        const refs = crossReferences.split("\n\n").filter(Boolean);
        if (refs.length > 0) {
          parts.push(`Connected passages: These related verses shed light on the key terms:\n${refs.slice(0, 2).join("\n")}`);
        }
      }

      if (contextVersesStr) {
        parts.push(`See it in context — the verses around ${ref}:\n${contextVersesStr}`);
      }

      // Ground the observation in the passage's own truth so the answer ends
      // on what the words are actually about.
      const thread = buildTruthSection({ ref, verseText, themes, genre, phrases, lead: "The thread that ties these words together:" });
      if (thread) {
        parts.push(thread);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Read ${ref || "this passage"} slowly and let the words settle. Which words would you circle if you were marking up the page? The Hebrew and Greek behind our English translations often carry depths a single rendering can't fully show — that's a great place to begin looking.`;
    },

    // ── Prompt 1: "Who is speaking? Who is being addressed?" ──
    () => {
      const parts = [];

      if (intro) {
        const introLines = intro.split(/[.!?]+/).filter(Boolean);
        if (introLines.length > 0) {
          parts.push(plain(introLines.slice(0, 2).join(". ") + "."));
        }
      }

      if (prologue) {
        const facts = [];
        if (prologue.author) facts.push(`Author: ${prologue.author}`);
        if (prologue.audience) facts.push(`Original audience: ${prologue.audience}`);
        if (prologue.dateWritten) facts.push(`Written: ${prologue.dateWritten}`);
        if (prologue.locationWritten) facts.push(`Location: ${prologue.locationWritten}`);
        if (prologue.purpose) facts.push(`Purpose of this book: ${prologue.purpose}`);
        if (facts.length > 0) {
          parts.push(facts.join("\n"));
        }
      }

      const voice = GENRE_VOICES[genreName];
      if (voice) {
        const voiceLabel =
          genreName === "poetry" ? "Poetic" :
          genreName === "gospel" ? "Gospel" :
          genreName === "epistle" ? "Apostolic" :
          genreName === "prophecy" ? "Prophetic" :
          genreName === "law" ? "Covenant" :
          genreName === "history" ? "Narrative" : "Apocalyptic";
        parts.push(`${voiceLabel} voice: ${voice}`);
      }

      if (verseText) {
        const firstWords = verseText.split(/\s+/).slice(0, 3).join(" ");
        if (/^["']/.test(verseText.trim())) {
          parts.push(`Note: This verse is direct speech — someone is speaking. Look back a few verses to see who is being quoted, and think about who they are addressing.`);
        } else {
          parts.push(`As you read, ask who is speaking in this moment — is it a narrator, a prophet, a psalmist, or God Himself? ${firstWords ? `The opening words, "${firstWords}", are a good clue.` : ""}`);
        }
      }

      if (context) {
        parts.push(`What the surrounding verses say:\n${plain(context)}`);
      }

      // Ground the voice in the verse's own words: commands, promises, and
      // warnings reveal who is speaking and what kind of word is being spoken.
      const cat = categorizeVerse(verseText);
      if (cat.commands.length || cat.promises.length || cat.warnings.length) {
        const clues = [];
        if (cat.commands.length) clues.push(`commands ("${cat.commands.join('", "')}")`);
        if (cat.promises.length) clues.push(`promises ("${cat.promises.join('", "')}")`);
        if (cat.warnings.length) clues.push(`warnings ("${cat.warnings.join('", "')}")`);
        parts.push(`What the verse's own words tell us: the text speaks in ${clues.join(" and ")}. That mix reveals the kind of voice addressing us — a command implies one with authority, a promise implies one who is faithful, and a warning implies one who loves enough to caution.`);
      }

      // And ground the speaker in the passage's truth: the person behind the
      // voice (theme or narrative) is who this is really about.
      const voiceTruth = buildTruthSection({ ref, verseText, themes, genre, phrases, lead: "Beneath the voice, one truth holds steady:" });
      if (voiceTruth) {
        parts.push(voiceTruth);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Consider who is speaking in ${ref || "this passage"} and who the intended audience is. The ${genreName} genre shapes how we hear the message: is this a command, a story, a poem, or a promise? Naming the voice helps us respond rightly.`;
    },

    // ── Prompt 2: "What commands, promises, warnings, or truths do you see?" ──
    () => {
      const parts = [];

      // Curated chapter-level categories are the most precise source we have.
      if (hasCommand || hasPromise || hasWarning) {
        const groups = [];
        if (hasCommand) {
          const cmds = chapterTools.filter(t => t.toolType === "COMMAND");
          groups.push(`Commands to obey:\n${cmds.map(c => `• ${c.label}${c.description ? ` — ${c.description}` : ""}`).join("\n")}`);
        }
        if (hasPromise) {
          const prs = chapterTools.filter(t => t.toolType === "PROMISE");
          groups.push(`Promises to claim:\n${prs.map(p => `• ${p.label}${p.description ? ` — ${p.description}` : ""}`).join("\n")}`);
        }
        if (hasWarning) {
          const wrns = chapterTools.filter(t => t.toolType === "WARNING");
          groups.push(`Warnings to heed:\n${wrns.map(w => `• ${w.label}${w.description ? ` — ${w.description}` : ""}`).join("\n")}`);
        }
        parts.push(`Here's what this chapter sets before us:\n\n${groups.join("\n\n")}`);
      }

      if (hasTransition) {
        const trans = chapterTools.filter(t => t.toolType === "TRANSITION");
        parts.push(`Structural clues:\n${trans.map(t => `• ${t.label}${t.description ? ` — ${t.description}` : ""}`).join("\n")}`);
      }

      // Direct evidence scanned from the verse's own words — directives,
      // assurances, and cautions detected by the category markers.
      const verseEvidence = scanVerseForCategories(verseText);
      if (verseEvidence) {
        parts.push(verseEvidence);
      }

      // A truth to hold onto — always present, grounded in the passage's
      // theme, narrative, or genre. Never the generic lesson fallback.
      const truth = buildTruthSection({ ref, verseText, themes, genre, phrases });
      if (truth) {
        parts.push(truth);
      }

      if (verseText && wordCount > 5) {
        parts.push(`What the verse actually says: "${phrases.keyClause || firstSentence(verseText)}" — this is the raw material for your observation.`);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Read ${ref || "this passage"} carefully and ask: Is there a command to follow? A promise to claim? A warning to heed? A truth to believe? These four elements form the backbone of biblical teaching.`;
    },

    // ── Prompt 3: "What is repeated in this passage?" ──
    () => {
      const parts = [];
      let hasRepetitionEvidence = false;

      if (hasRepeatedWord) {
        const reps = chapterTools.filter(t => t.toolType === "REPEATED_WORD");
        parts.push(`Notable repetitions in this chapter:\n${reps.map(r => `• "${r.label}"${r.description ? ` — ${r.description}` : ""}`).join("\n")}`);
        hasRepetitionEvidence = true;
      }

      if (verseText) {
        const cleaned = verseText.toLowerCase().replace(/[^a-z\s]/g, "");
        const wordFreq = {};
        cleaned.split(/\s+/).forEach(w => {
          // Skip stopwords — "the", "and", "for" repeating is grammar, not
          // emphasis. Only content words earn a spotlight in the answer.
          if (w.length > 2 && !STOPWORDS.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
        });
        const repeated = Object.entries(wordFreq)
          .filter(([, c]) => c > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        if (repeated.length > 0) {
          parts.push(`Words repeated in this verse:\n${repeated.map(([w, c]) => `• "${w}" appears ${c} times`).join("\n")}`);
          parts.push(`Repetition in Scripture is a spotlight. When a writer repeats a word, they are saying: "Pay attention — this matters."`);
          hasRepetitionEvidence = true;
        } else if (wordCount > 3) {
          const uniqueWords = [...new Set(cleaned.split(/\s+/).filter(w => w.length > 3 && !STOPWORDS.has(w)))];
          if (uniqueWords.length > 0) {
            parts.push(`No single word repeats in this verse, but the key concepts cluster around: ${uniqueWords.slice(0, 5).join(", ")}. Notice how each one serves the verse's single message.`);
          }
        }
      }

      if (theme1 || theme2) {
        const themeNames = [theme1, theme2].filter(Boolean).join(" and ");
        parts.push(`Thematic repetition: the ${themeNames} theme${theme2 ? "s" : ""} recur${theme2 ? "" : "s"} here — and what a writer repeats is what they most want us to remember.`);
        hasRepetitionEvidence = true;
      }

      if (chapterInsights && !parts.some(p => p.includes("Notable repetitions"))) {
        const repeatedInsights = chapterInsights.split("\n\n").filter(l => l.toLowerCase().includes("repeat"));
        if (repeatedInsights.length > 0) {
          parts.push(`From study insights:\n${plain(repeatedInsights.slice(0, 2).join("\n\n"))}`);
          hasRepetitionEvidence = true;
        }
      }

      // No curated or in-text repetition evidence? Point the reader at where
      // repetition typically lives in this kind of writing instead of leaving
      // them with a blank.
      if (!hasRepetitionEvidence && GENRE_REPETITION_GUIDES[genreName]) {
        parts.push(`What repetition looks like in ${GENRE_LABELS[genreName]}: ${GENRE_REPETITION_GUIDES[genreName]}`);
      }

      // Repetition is a spotlight; name what it is shining on. When no
      // repetition exists at all, the closing lead drops the awkward "why the
      // repetition matters" frame and just says what the verse is about.
      const echoLead = hasRepetitionEvidence
        ? "Why the repetition matters:"
        : "What this verse is really about:";
      const echoTruth = buildTruthSection({ ref, verseText, themes, genre, phrases, lead: echoLead });
      if (echoTruth) {
        parts.push(echoTruth);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Read ${ref || "this passage"} again and notice what echoes. Ideas, words, or phrases that return are the author signaling their importance — Hebrew poetry and biblical teaching both lean on repetition for emphasis.`;
    },

    // ── Prompt 4: "What contrasts do you notice?" ──
    () => {
      const parts = [];
      let hasContrastEvidence = false;

      if (hasContrast) {
        const conts = chapterTools.filter(t => t.toolType === "CONTRAST");
        parts.push(`Recognized contrasts in this chapter:\n${conts.map(c => `• ${c.label}${c.description ? ` — ${c.description}` : ""}`).join("\n")}`);
        hasContrastEvidence = true;
      }

      const foundContrasts = [];
      if (verseText) {
        const lower = verseText.toLowerCase();
        for (const [a, b] of Object.entries(CONTRAST_PAIRS)) {
          if (lower.includes(a) && lower.includes(b)) {
            const matchIdx = Math.min(lower.indexOf(a), lower.indexOf(b));
            const snippet = verseText.slice(Math.max(0, matchIdx), matchIdx + 80).split(/[.!?;,]/)[0];
            foundContrasts.push(`"${snippet.trim()}" (${a}/${b})`);
          }
        }
      }

      if (foundContrasts.length > 0) {
        parts.push(`Contrasts detected in the verse itself:\n${foundContrasts.slice(0, 3).join("\n\n")}`);
        parts.push(`Biblical contrasts aren't just literary decoration — they set two paths, two natures, two destinies side by side and call for a choice. Which side is this passage urging you toward?`);
        hasContrastEvidence = true;
      }

      const contrastText = THEME_CONTRASTS[theme1];
      if (contrastText && !parts.some(p => p.includes("light/darkness") || p.includes("love/hate") || p.includes("life/death"))) {
        parts.push(contrastText);
        hasContrastEvidence = true;
      }

      // No curated or in-text contrast evidence? Point the reader at where
      // contrasts typically live in this kind of writing.
      if (!hasContrastEvidence && GENRE_CONTRAST_GUIDES[genreName]) {
        parts.push(`What contrasts look like in ${GENRE_LABELS[genreName]}: ${GENRE_CONTRAST_GUIDES[genreName]}`);
      }

      // Contrasts set two paths side by side; close on which one the passage
      // is urging us toward. When no contrast exists at all, the closing lead
      // drops the awkward "what the contrast is calling us toward" frame.
      const contrastLead = hasContrastEvidence
        ? "What the contrast is calling us toward:"
        : "What this verse is really about:";
      const contrastTruth = buildTruthSection({ ref, verseText, themes, genre, phrases, lead: contrastLead });
      if (contrastTruth) {
        parts.push(contrastTruth);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Biblical writers often sharpen meaning with contrasts — light vs. darkness, flesh vs. spirit, the way of wisdom vs. the way of folly. Read ${ref || "this passage"} looking for opposing ideas; they reveal the choices set before us and what is at stake.`;
    },

    // ── Prompt 5: "What questions does this passage raise in your mind?" ──
    () => {
      const parts = [];

      if (verseText) {
        const phrase = phrases.keyClause || firstSentence(verseText);

        const themeQ = THEME_QUESTIONS[theme1];
        if (themeQ) {
          parts.push(`Questions this passage raises for you:\n${themeQ}\n`);
        }

        // Anchor the questions in the passage's own truth before opening up.
        const heart = buildTruthSection({ ref, verseText, themes, genre, phrases, lead: "The heart of this passage:" });
        if (heart) {
          parts.push(`${heart}\n`);
        }

        parts.push(`Deeper reflection questions for ${ref}:\n`);
        parts.push(`1. About God — The text says "${phrase}". What does this reveal about God's character? Is He acting, commanding, promising, or revealing? What does this tell me about His heart toward humanity?\n`);
        parts.push(`2. About humanity — What does this say about who we are — our condition, our need, our purpose? Does it confront me, comfort me, or call me to grow?\n`);
        parts.push(`3. About response — What does this passage require of me? Is there something to believe, to do, to change, or to share? Make it specific.\n`);
        parts.push(`4. About Christ — Even when Jesus isn't named, how does this passage point to Him? All Scripture ultimately testifies of the One who fulfills every promise and answers every human need.\n`);
        parts.push(`5. The Spirit's question — The most important question is the one the Holy Spirit is pressing on your heart right now. Take a quiet moment and listen.`);

        // Ground the questions in the text's own voice: what it commands,
        // promises, or warns points to where God is already speaking.
        const cat = categorizeVerse(verseText);
        if (cat.commands.length || cat.promises.length || cat.warnings.length) {
          const clues = [];
          if (cat.commands.length) clues.push(`something to do ("${cat.commands.join('", "')}")`);
          if (cat.promises.length) clues.push(`something to trust ("${cat.promises.join('", "')}")`);
          if (cat.warnings.length) clues.push(`something to turn from ("${cat.warnings.join('", "')}")`);
          parts.push(`6. The text's own question — the verse itself speaks of ${clues.join(" and ")}. Which of these is God pressing on your life right now?\n`);
        }

        // Skip the generic fallback lesson — a vague "One more thought" adds
        // nothing when the passage-specific heart above already said it better.
        if (explanation && !explanation.startsWith(DEFAULT_LESSON)) {
          const shortExpl = explanation.split(".").slice(0, 2).join(".");
          parts.push(`One more thought: ${plain(shortExpl)}. What does this insight reveal that you hadn't considered before?`);
        }
      } else {
        parts.push(`Approach ${ref || "this passage"} with these framing questions:\n`);
        parts.push(`1. What does this teach me about God? — His character, His ways, His heart toward me.\n`);
        parts.push(`2. What does this teach me about humanity? — our condition, our need, our hope in Christ.\n`);
        parts.push(`3. How does this point to Christ? — All Scripture, in some way, testifies of Jesus.\n`);
        parts.push(`4. What must I do? — Where is the call to believe, obey, repent, or share?\n`);
        parts.push(`5. What is the Spirit saying to me? — Pause, be still, and listen for His voice.`);
      }

      return fitToBudget(parts.join("\n"), ANSWER_BUDGETS[5] || 2400);
    },
  ];

  const answer = answers[promptIdx];
  const raw = answer
    ? answer()
    : `Reflect on ${ref || "this passage"} with an open heart. What is the Spirit emphasizing to you personally as you read these words?`;
  return fitToBudget(raw, ANSWER_BUDGETS[promptIdx] || 1500);
}
