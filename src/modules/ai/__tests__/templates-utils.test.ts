import {
  firstSentence,
  firstSentences,
  extractSignificantWords,
  dedupeContextVerses,
  cleanVerseText,
} from "../templates/utils.js";

describe("template utils — firstSentence / firstSentences", () => {
  it("returns the first sentence without breaking inside quotes", () => {
    const text = 'The verse says "I can do all things." Then it continues.';
    expect(firstSentence(text)).toBe('The verse says "I can do all things."');
  });

  it("firstSentences caps at N sentences", () => {
    const text = "One. Two. Three. Four.";
    expect(firstSentences(text, 2)).toBe("One. Two.");
  });

  it("firstSentences returns the full text when under the cap", () => {
    const text = "Just one sentence.";
    expect(firstSentences(text, 3)).toBe("Just one sentence.");
  });

  it("firstSentences closes a dangling quote after the cut", () => {
    const text = 'He said, "This is the way." Then he walked on.';
    const out = firstSentences(text, 1);
    expect(out).toBe('He said, "This is the way."');
    expect(out.split('"').length % 2).toBe(1); // balanced quotes
  });

  it("handles empty input", () => {
    expect(firstSentence("")).toBe("");
    expect(firstSentences("", 2)).toBe("");
  });
});

describe("template utils — extractSignificantWords", () => {
  it("prefers curated word-study glosses over the verse text", () => {
    const wordStudy = "**ἀγαπάω** (agapaō) — to love, to cherish\n**κόσμος** (kosmos) — the world";
    const words = extractSignificantWords("For God so loved the world.", wordStudy, ["love"]);
    expect(words[0]).toContain("agapaō");
    expect(words.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to theme-aware ranking when no word study exists", () => {
    const verse = "For God so loved the world that He gave His only begotten Son, that whoever believes in Him shall not perish but have eternal life.";
    // "loved" and "believes" match detected themes and must rank first,
    // ahead of long-but-noise words.
    const words = extractSignificantWords(verse, null, ["love", "faith"]);
    expect(words[0]).toBe("loved");
    expect(words.slice(0, 3)).toContain("believes");
  });

  it("strips punctuation and stopwords from fallback candidates", () => {
    const words = extractSignificantWords("And the and a for of in", null, []);
    expect(words.length).toBe(0);
  });

  it("returns nothing for empty verse text", () => {
    expect(extractSignificantWords("", null, [])).toEqual([]);
  });
});

describe("template utils — cleanVerseText", () => {
  it("strips Amplified-style parenthetical glosses from a verse", () => {
    const amplified =
      "Blessed (happy, to be envied, and spiritually prosperous--with life-joy " +
      "and satisfaction in God's favor and salvation, regardless of their " +
      "outward conditions) are the poor in spirit (the humble, who rate " +
      "themselves insignificant), for theirs is the kingdom of heaven.";
    const out = cleanVerseText(amplified);
    expect(out).not.toMatch(/[()]/);
    expect(out).not.toMatch(/envi|spiritually prosperous|rate themselves|life-joy/);
    expect(out).toContain("Blessed are the poor in spirit");
    expect(out).toContain("kingdom of heaven");
    expect(out).not.toMatch(/\s{2,}/); // whitespace collapsed
  });

  it("leaves plain verse text untouched", () => {
    const plain = "For God so loved the world that He gave His only begotten Son.";
    expect(cleanVerseText(plain)).toBe(plain);
  });

  it("handles empty input", () => {
    expect(cleanVerseText("")).toBe("");
    expect(cleanVerseText(null)).toBe("");
  });
});

describe("template utils — dedupeContextVerses", () => {
  it("keeps one row per verse, preferring BSB", () => {
    const rows = [
      { verse: 15, verseText: "KJV text", translation: "KJV" },
      { verse: 15, verseText: "BSB text", translation: "BSB" },
      { verse: 17, verseText: "BSB 17", translation: "BSB" },
    ];
    const out = dedupeContextVerses(rows, 16);
    expect(out).toHaveLength(2);
    expect(out[0].verseText).toBe("BSB text");
    expect(out[1].verseText).toBe("BSB 17");
  });

  it("excludes the current verse", () => {
    const rows = [{ verse: 16, verseText: "skip me", translation: "BSB" }];
    expect(dedupeContextVerses(rows, 16)).toHaveLength(0);
  });
});
