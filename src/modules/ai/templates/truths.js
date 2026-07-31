// ─────────────────────────────────────────────────────────────────────────────
// Truth data for the AI template engine — feeds Prompt 2
// ("What commands, promises, warnings, or truths do you see?").
//
// The engine scans the verse text for command/promise/warning markers, then
// falls back to theme-specific, narrative, or genre-specific truths so the
// answer is ALWAYS specific to the passage — never the generic
// "This verse reveals something essential…" fallback.
// ─────────────────────────────────────────────────────────────────────────────

import { firstSentence } from "./utils.js";

// ── Category markers scanned from the verse text ────────────────────────────
// The strongest evidence wins: a word actually in the text beats any template.
// Leading \b only — plural/derived forms ("believes", "promises") are caught.

export const COMMAND_MARKERS =
  /\b(do not|do\b|go\b|come\b|listen|hear|see\b|believe|follow|love|keep|remember|be\b|let\b|must\b|shall\b|should\b|you shall|you will|obey|stand|arise|seek|ask|knock|pray|fear not|do not fear|rejoice|behold|give thanks|serve|worship|walk|trust|wait|watch|guard|turn|return|repent|speak|tell|write|teach|learn|strive|press on|clothe|put on|put off|consider|count|endure|resist|submit|honor|care|give|offer|sacrifice|cleanse|wash|consecrate|sanctify)/gi;

export const PROMISE_MARKERS =
  /\b(promise|covenant|blessed|blessing|eternal|everlasting|forever|inherit|redeem|redemption|shall not perish|will give|will make|will save|will be with|no longer|never again|mercy|grace|hope|shall be|will be|will keep|will provide|will restore|will heal|will comfort|will strengthen|will guide|will lead|will answer|will hear|will deliver|will reward|will bless|surely|assuredly|I am with you|I will be)/gi;

export const WARNING_MARKERS =
  /\b(woe|beware|repent|repentance|judgment|judge|condemn|wrath|perish|destruction|destroy|unless|lest|if you do not|do not forget|take heed|tribulation|affliction|famine|pestilence|sword|sorrow|weeping|gnashing|cast out|cut off|shame|disgrace|stumbling block|hypocrite|unclean|abomination)/gi;

/**
 * Split the verse's own words into the command / promise / warning markers
 * present, as deduplicated lowercase lists (max 4 each). The raw evidence lets
 * each prompt phrase its own observation from the same markers.
 */
export function categorizeVerse(verseText) {
  if (!verseText) return { commands: [], promises: [], warnings: [] };
  const unique = arr => [...new Set(arr.map(m => m.toLowerCase()))].slice(0, 4);
  return {
    commands: unique(verseText.match(COMMAND_MARKERS) || []),
    promises: unique(verseText.match(PROMISE_MARKERS) || []),
    warnings: unique(verseText.match(WARNING_MARKERS) || []),
  };
}

/**
 * Scan the verse's own words for each category and return a ready-to-display
 * section (or null when the verse carries none of these markers).
 */
export function scanVerseForCategories(verseText) {
  const { commands, promises, warnings } = categorizeVerse(verseText);
  const lines = [];

  if (commands.length) {
    lines.push(`Directives in the text: the verse itself carries action words like "${commands.join('", "')}" — these point to a response being asked of us.`);
  }

  if (promises.length) {
    lines.push(`Assurances in the text: words like "${promises.join('", "')}" carry the tone of a promise — something God commits to, no matter the circumstances.`);
  }

  if (warnings.length) {
    lines.push(`Cautions in the text: words like "${warnings.join('", "')}" wave a red flag — places where the text warns, guards, or calls for a turning back.`);
  }

  return lines.length ? lines.join("\n\n") : null;
}

// ── Per-theme truths (most specific when a theme is detected) ───────────────

export const THEME_TRUTHS = {
  love: `A truth to hold onto: this verse reveals love as the source of everything God does — not a feeling that fades, but a commitment that acts. "{{keyClause}}" turns that truth from doctrine into a reality you can stand on today.`,
  faith: `A truth to hold onto: the verse calls believing from the head into the heart — trusting God's character and promises even while the evidence is still unfolding. "{{keyClause}}" is that trust made visible in words.`,
  grace: `A truth to hold onto: grace means God's goodness reaches us before we deserve it and keeps reaching us after we fail. "{{keyClause}}" captures the gift that cannot be earned — only received.`,
  hope: `A truth to hold onto: the hope here is not optimism but certainty — the settled confidence that God keeps His word. "{{keyClause}}" is an anchor for the soul when circumstances say otherwise.`,
  life: `A truth to hold onto: the verse speaks of life that outlasts death — real, eternal, abundant life that begins now. "{{keyClause}}" is the promise that our existence was never meant to end at the grave.`,
  light: `A truth to hold onto: light and darkness are set before you as two ways to walk, and the verse makes the choice plain. "{{keyClause}}" names the realm God calls you to live in.`,
  judgment: `A truth to hold onto: the verse takes sin and its consequences seriously — but God's warnings are the voice of love, not rejection. "{{keyClause}}" holds the sober truth and the way out at once.`,
  peace: `A truth to hold onto: the peace here is not the absence of trouble but the presence of God in the middle of it. "{{keyClause}}" is where a restless heart can find rest.`,
  fear: `A truth to hold onto: the verse speaks directly into fear — and fear loses its grip when faith gets louder. "{{keyClause}}" is the antidote to the anxiety the future cannot answer.`,
  obedience: `A truth to hold onto: the verse links what we believe with how we live — obedience is not legalism but love taking action. "{{keyClause}}" marks the point where faith becomes feet.`,
  warning: `A truth to hold onto: warnings in Scripture are gifts, not threats — God alerts us to danger because He wants us safe. "{{keyClause}}" is the voice of love crying out before it is too late.`,
  praise: `A truth to hold onto: the verse calls for praise from the lips and the life — not for what God gives, but for who He is. "{{keyClause}}" is a heart turned toward its Maker.`,
  suffering: `A truth to hold onto: the verse reframes suffering — pain is not pointless when God is at work in it. "{{keyClause}}" is the promise that the valley is not the end of the road.`,
  healing: `A truth to hold onto: the verse carries the promise of restoration — God mends what is broken and makes whole what has been shattered. "{{keyClause}}" is His restoring word.`,
  death: `A truth to hold onto: the verse confronts death with gospel hope — the grave is not the final word. "{{keyClause}}" announces that because Christ lives, we shall live also.`,
  kingship: `A truth to hold onto: the verse declares that God is on the throne — not distant, but ruling all things toward His purposes. "{{keyClause}}" is the ground of confidence for every anxious heart.`,
  wisdom: `A truth to hold onto: the verse invites you to see reality from God's perspective — the fear of the Lord is where understanding begins. "{{keyClause}}" is wisdom speaking plainly.`,
  blessing: `A truth to hold onto: blessing here is not the world's luck but God's settled favor — a gift to receive and a calling to pass on. "{{keyClause}}" shows what a life held by that favor actually looks like.`,
  providence: `A truth to hold onto: what looks like chance in this story is God's quiet providence — the unseen hand arranging people, timing, and circumstances toward His purposes. "{{keyClause}}" is not accident but appointment, and it calls for trust.`,
  power: `A truth to hold onto: the power in view is not human strength but God's — made perfect in our weakness. "{{keyClause}}" is the invitation to stop living in your own strength.`,
  justice: `A truth to hold onto: God is not neutral about wrong — He sees every injustice and will set every account right. "{{keyClause}}" is the promise that righteousness finally wins, and it calls us to love what God loves: what is true, fair, and upright.`,
  humility: `A truth to hold onto: humility is the posture that receives grace — God opposes the proud but lifts up the lowly. "{{keyClause}}" marks the place where pride comes down and the door of grace opens.`,
  holiness: `A truth to hold onto: holiness is not a list of rules but belonging — you have been set apart for God. "{{keyClause}}" is the boundary that draws you out from the world and into His presence.`,
  unity: `A truth to hold onto: God's people are made to dwell together as one — not identical, but united under one Head. "{{keyClause}}" is a picture of the harmony He is building, and it begins with one reconciled relationship at a time.`,
  joy: `A truth to hold onto: joy is deeper than happiness — it is rooted in who God is, not in what happens to us. "{{keyClause}}" is a fountain that keeps flowing even in the driest season.`,
};

// ── Per-genre truths (used when no theme is detected) ───────────────────────

export const GENRE_TRUTHS = {
  history: `A truth to hold onto: in the middle of this story, God is quietly at work — guiding people, arranging circumstances, keeping His promises through ordinary days. "{{keyClause}}" is a window into a providence that never stops moving.`,
  law: `A truth to hold onto: behind every command stands the love of the God who redeemed His people first. "{{keyClause}}" is not a rule to keep for approval, but a shape for life inside a covenant of grace.`,
  poetry: `A truth to hold onto: poetry speaks to the heart before the mind — and this verse carries truth you are meant to feel, not just understand. "{{keyClause}}" is a stone the psalmist sets in your path to walk on.`,
  prophecy: `A truth to hold onto: the prophet's word carries both the warning and the hope — judgment is never God's final word. "{{keyClause}}" stands at that turning point.`,
  gospel: `A truth to hold onto: in this passage the person and work of Jesus come into focus — everything before and after points to Him. "{{keyClause}}" is the gospel breaking through the narrative.`,
  epistle: `A truth to hold onto: apostolic teaching means this truth is meant to be lived in community, not just believed alone. "{{keyClause}}" is doctrine with a pastoral heartbeat.`,
  apocalyptic: `A truth to hold onto: behind the visions stands a steady promise — the Lamb is on the throne, and His purposes will not fail. "{{keyClause}}" is heaven's perspective breaking into earth's chaos.`,
};

/**
 * For narrative (history/law) verses: detect when a person is being
 * introduced — the strongest case for a specific truth without any theme.
 * Handles "whose name was Boaz" (Ruth 2:1) with a redeemer-aware note.
 */
export function buildNarrativeTruth({ ref, verseText, keyClause }) {
  if (!verseText) return null;
  const lower = verseText.toLowerCase();

  const nameMatch = verseText.match(/whose name was ([A-Z][A-Za-z]+)/);
  if (nameMatch) {
    const person = nameMatch[1];
    return `A truth to hold onto: ${ref} quietly introduces ${person} — and Scripture rarely records a name without purpose. In the world of this story, a relative like this is a potential kinsman-redeemer, a foreshadowing of the Redeemer to come. Watch how ${person} shapes everything that follows; behind this introduction, God is already at work.`;
  }

  if (/(had a|there was a|named |a man called|son of |daughter of |wife of |father of )/.test(lower)) {
    return `A truth to hold onto: ${ref} quietly introduces a person who will matter. Scripture rarely records a name, a family line, or a character note without purpose — behind this introduction, God is already setting up His story of redemption. Watch how the person in view shapes everything that follows.`;
  }

  if (/^(and |so |now |then )?(he|she|they|the )/.test(lower)) {
    return `A truth to hold onto: this story records what happened and why it matters. "${keyClause}" is one of those details — small in the telling, significant in God's purposes. Nothing in Scripture is incidental; the writer is showing us God at work in ordinary days.`;
  }

  return null;
}

/**
 * Build the "truth to hold onto" section for the Look prompts.
 * Priority: detected theme → narrative person-introduction → genre framing →
 * a final fallback still grounded in the verse's own words.
 *
 * Each prompt passes its own `lead` label so every answer stays
 * passage-specific without sounding copy-pasted (e.g. "A truth to hold onto:"
 * for Prompt 2, "The heart of this passage:" for Prompt 5).
 */
export function buildTruthSection({ ref, verseText, themes, genre, phrases, lead = "A truth to hold onto:" }) {
  if (!verseText) return null;
  const theme1 = themes?.[0] || "";
  const keyClause = phrases?.keyClause || firstSentence(verseText);
  const opener = phrases?.opener || "";

  const fillVars = tpl =>
    tpl
      .replace(/\{\{keyClause\}\}/g, () => keyClause)
      .replace(/\{\{opener\}\}/g, () => opener);
  // Swap the default lead for this prompt's label, then fill placeholders.
  const applyLead = tpl => fillVars(tpl.replace(/^A truth to hold onto:/, lead));

  if (THEME_TRUTHS[theme1]) return applyLead(THEME_TRUTHS[theme1]);

  if (genre === "history" || genre === "law") {
    const narrative = buildNarrativeTruth({ ref, verseText, keyClause });
    if (narrative) return applyLead(narrative);
  }

  if (GENRE_TRUTHS[genre]) return applyLead(GENRE_TRUTHS[genre]);

  return applyLead(
    `A truth to hold onto: "{{keyClause}}" — let these words sit with you. Every line of Scripture is there to teach, to correct, or to comfort; ask which of these this verse is doing for you.`
  );
}
