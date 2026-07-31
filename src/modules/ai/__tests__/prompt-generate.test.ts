import { generatePromptAnswer } from "../service.js";

// ─── Mocks ───────────────────────────────────────────────────
// NOTE: jest.mock() is hoisted above ALL module code. Constants must
// be inlined inside the factory to avoid TDZ "before initialization."

const ORIGINAL_VERSE_TEXT = (() =>
  "For God so loved the world that He gave His only begotten Son, " +
  "that whoever believes in Him shall not perish but have eternal life.")();

jest.mock("../../../config/db.js", () => {
  const VERSE_TEXT =
    "For God so loved the world that He gave His only begotten Son, " +
    "that whoever believes in Him shall not perish but have eternal life.";

  const PROLOGUE = {
    bookName: "John",
    author: "John the Apostle",
    audience: "Early Christians and Greek-speaking Jews",
    dateWritten: "c. 90–95 AD",
    locationWritten: "Ephesus",
    purpose:
      "That you may believe that Jesus is the Christ, the Son of God, and that by believing you may have life in His name.",
    keyTheme: "The deity of Christ and the call to faith",
    summary:
      "The Gospel of John presents Jesus as the pre-existent Word made flesh, " +
      "calling readers to believe in Him for eternal life.",
    christConnection:
      "Jesus is presented throughout as the divine Son sent by the Father to bring salvation.",
  };

  const CHAPTER_TOOLS = [
    { toolType: "COMMAND", label: "Believe in the Son", description: "Whoever believes in Him shall not perish" },
    { toolType: "PROMISE", label: "Eternal Life", description: "Believers receive eternal life through faith in Christ" },
    { toolType: "WARNING", label: "Perishing without Faith", description: "Those who do not believe face spiritual death" },
    { toolType: "REPEATED_WORD", label: "believe", description: "The word 'believe' appears repeatedly, emphasizing faith." },
    { toolType: "CONTRAST", label: "Life vs. Perishing", description: "The passage contrasts eternal life with perishing." },
    { toolType: "TRANSITION", label: "For God so loved", description: "Transitions from Nicodemus narrative to gospel proclamation." },
  ];

  return {
    prisma: {
      searchIndex: {
        findMany: jest.fn().mockImplementation(({ where }: { where: any }) => {
          // Exact verse lookup (main verse, BSB preferred) → a BSB row.
          if (where?.verse && typeof where.verse === "number") {
            return [{ verseText: VERSE_TEXT, translation: "BSB" }];
          }
          // Range lookup (surrounding verses).
          return [
            { verse: 15, verseText: "so that whoever believes may in Him have eternal life." },
            { verse: 17, verseText: "For God did not send the Son into the world to judge the world." },
          ];
        }),
      },
      bookPrologue: { findUnique: jest.fn().mockResolvedValue(PROLOGUE) },
      dailyExegesis: { findFirst: jest.fn().mockResolvedValue(null) },
      verseExplanation: { findUnique: jest.fn().mockResolvedValue(null) },
      verseResource: { findFirst: jest.fn().mockResolvedValue(null) },
      chapterStudyTool: { findMany: jest.fn().mockResolvedValue(CHAPTER_TOOLS) },
      verseWord: {
        findMany: jest.fn().mockResolvedValue([
          { strongs: { originalWord: "ἀγαπάω", transliteration: "agapaō", shortDefinition: "to love, to cherish" } },
          { strongs: { originalWord: "κόσμος", transliteration: "kosmos", shortDefinition: "the world, the universe" } },
        ]),
      },
    },
  };
});

jest.mock("../../../services/cacheService.js", () => ({
  cache: { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined) },
}));

// ─── Tests ───────────────────────────────────────────────────

function expectAnswer(res: Awaited<ReturnType<typeof generatePromptAnswer>>): asserts res is NonNullable<typeof res> & { answer: string } {
  expect(res).toBeTruthy();
  expect(res!.answer).toBeTruthy();
}

// ─── Ruth fixture helpers (shared by the narrative-fallback tests) ──────────
// Ruth 2:1 is a history-genre verse with NO chapter tools and NO detected
// themes — the perfect fixture for testing the fallback paths. The mock setup
// and restore are factored out so every fallback test uses identical data.

const RUTH_TEXT =
  "Now Naomi had a relative on her husband's side, a prominent man of noble character from the clan of Elimelech, whose name was Boaz.";

// Matthew 5:3–5 as stored in the Amplified translation — every phrase carries
// parenthetical glosses. These must never leak into repetition analysis,
// theme detection, or the quoted text of an answer.
const BEATITUDES_AMP_TEXT =
  "Blessed (happy, to be envied, and spiritually prosperous--with life-joy and satisfaction in God's favor and salvation, regardless of their outward conditions) are the poor in spirit (the humble, who rate themselves insignificant), for theirs is the kingdom of heaven. " +
  "Blessed (forgiven, refreshed, and at peace) are those who mourn (over their sins and the world's), for they will be comforted. " +
  "Blessed (gentle, mild, and humble) are the meek, for they will inherit the earth.";

function stubRuthVerse() {
  const prismaMock = require("../../../config/db.js").prisma;
  prismaMock.searchIndex.findMany.mockImplementation(({ where }: { where: any }) => {
    if (where?.verse && typeof where.verse === "number") {
      return [{ verseText: RUTH_TEXT, translation: "BSB" }];
    }
    return [];
  });
  prismaMock.chapterStudyTool.findMany.mockResolvedValue([]);
  prismaMock.verseWord.findMany.mockResolvedValue([]);
}

function stubBeatitudesVerse() {
  const prismaMock = require("../../../config/db.js").prisma;
  prismaMock.searchIndex.findMany.mockImplementation(({ where }: { where: any }) => {
    if (where?.verse && typeof where.verse === "number") {
      return [{ verseText: BEATITUDES_AMP_TEXT, translation: "BSB" }];
    }
    return [];
  });
  prismaMock.chapterStudyTool.findMany.mockResolvedValue([]);
  prismaMock.verseWord.findMany.mockResolvedValue([]);
}

// Numbers 8:8 as stored in BSB — a law-genre ritual verse whose "sin offering"
// must NOT be misread as the judgment theme.
const NUMBERS_TEXT =
  "Then have them take a young bull with its grain offering of fine flour mixed with oil, and you are to take a second young bull for a sin offering.";

// Genesis 50:20 — a narrative verse with explicit providence language ("God
// intended it for good"). Look-stage answers must quote the providence truth.
const GEN_50_20_TEXT =
  "You intended to harm me, but God intended it for good, to accomplish what is now being done, the saving of many lives.";

function stubNumbersVerse() {
  const prismaMock = require("../../../config/db.js").prisma;
  prismaMock.searchIndex.findMany.mockImplementation(({ where }: { where: any }) => {
    if (where?.verse && typeof where.verse === "number") {
      return [{ verseText: NUMBERS_TEXT, translation: "BSB" }];
    }
    return [];
  });
  prismaMock.chapterStudyTool.findMany.mockResolvedValue([]);
  prismaMock.verseWord.findMany.mockResolvedValue([]);
}

function stubGenesis50Verse() {
  const prismaMock = require("../../../config/db.js").prisma;
  prismaMock.searchIndex.findMany.mockImplementation(({ where }: { where: any }) => {
    if (where?.verse && typeof where.verse === "number") {
      return [{ verseText: GEN_50_20_TEXT, translation: "BSB" }];
    }
    return [];
  });
  prismaMock.chapterStudyTool.findMany.mockResolvedValue([]);
  prismaMock.verseWord.findMany.mockResolvedValue([]);
}

function restoreJohnVerse() {
  const prismaMock = require("../../../config/db.js").prisma;
  prismaMock.searchIndex.findMany.mockImplementation(({ where }: { where: any }) => {
    if (where?.verse && typeof where.verse === "number") {
      return [{ verseText: ORIGINAL_VERSE_TEXT, translation: "BSB" }];
    }
    return [
      { verse: 15, verseText: "so that whoever believes may in Him have eternal life." },
      { verse: 17, verseText: "For God did not send the Son into the world to judge the world." },
    ];
  });
  prismaMock.chapterStudyTool.findMany.mockResolvedValue([
    { toolType: "COMMAND", label: "Believe in the Son", description: "Whoever believes in Him shall not perish" },
    { toolType: "PROMISE", label: "Eternal Life", description: "Believers receive eternal life through faith in Christ" },
    { toolType: "WARNING", label: "Perishing without Faith", description: "Those who do not believe face spiritual death" },
    { toolType: "REPEATED_WORD", label: "believe", description: "The word 'believe' appears repeatedly, emphasizing faith." },
    { toolType: "CONTRAST", label: "Life vs. Perishing", description: "The passage contrasts eternal life with perishing." },
    { toolType: "TRANSITION", label: "For God so loved", description: "Transitions from Nicodemus narrative to gospel proclamation." },
  ]);
  prismaMock.verseWord.findMany.mockResolvedValue([
    { strongs: { originalWord: "ἀγαπάω", transliteration: "agapaō", shortDefinition: "to love, to cherish" } },
    { strongs: { originalWord: "κόσμος", transliteration: "kosmos", shortDefinition: "the world, the universe" } },
  ]);
}

describe("generatePromptAnswer — Prompt 0 (standout words/phrases)", () => {
  it("returns verse-specific analysis with passage context", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 0);
    expectAnswer(res);
    expect(res!.promptIdx).toBe(0);
    expect(res!.answer!.length).toBeGreaterThan(100);
    expect(res!.answer!).toMatch(/Passage context|opens with|For God/);
    expect(res!.verseRef).toMatch(/John 3:16/);
  });

  it("includes word study terms from original language data", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 0);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/agapaō|kosmos|Key terms|love|world/);
  });

  it("references opening and closing phrases of the verse", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 0);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/opens with|concludes|eternal life/);
  });
});

describe("generatePromptAnswer — Prompt 1 (speaker/audience)", () => {
  it("returns prologue-based author and audience data", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 1);
    expectAnswer(res);
    expect(res!.promptIdx).toBe(1);
    expect(res!.answer!).toMatch(/John the Apostle|Author|audience|Early Christians/);
  });

  it("includes genre-aware voice analysis for gospels", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 1);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Gospel voice|eyewitness|Jesus|Word made flesh/);
  });

  it("includes purpose and key theme from prologue", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 1);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Purpose|believe|Christ|deity|Son/);
  });

  it("identifies poetry voice for Psalms", async () => {
    const res = await generatePromptAnswer("Psalms", 23, 1, 1);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Poetic voice|psalmist|heart|song/);
  });
});

describe("generatePromptAnswer — Prompt 2 (commands/promises/warnings)", () => {
  it("lists commands from chapter study tools", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 2);
    expectAnswer(res);
    expect(res!.promptIdx).toBe(2);
    expect(res!.answer!).toMatch(/Commands to obey|Believe in the Son/);
  });

  it("lists promises from chapter study tools", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 2);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Promises to claim|Eternal Life/);
  });

  it("lists warnings from chapter study tools", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 2);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Warnings to heed|Perishing|Faith/);
  });

  it("detects imperative verbs in verse text", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 2);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Directives|shall|believes|action/);
  });

  it("includes structural clues from transition tools", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 2);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Structural clues|For God so loved|transition/);
  });
});

describe("generatePromptAnswer — Prompt 2 (narrative fallback without chapter tools)", () => {
  it("produces a verse-specific truth for Ruth 2:1 instead of the generic lesson", async () => {
    stubRuthVerse();
    try {
      const res = await generatePromptAnswer("Ruth", 2, 1, 2);
      expectAnswer(res);
      expect(res!.promptIdx).toBe(2);
      // The old generic fallback must never appear…
      expect(res!.answer!).not.toMatch(/This verse reveals something essential/);
      // …and the answer must ground itself in the passage (Boaz / kinsman-redeemer).
      expect(res!.answer!).toMatch(/Boaz|kinsman|redeemer|truth to hold onto/);
    } finally {
      restoreJohnVerse();
    }
  });
});

describe("generatePromptAnswer — truth data enriches every prompt", () => {
  it("grounds Prompt 0 with a passage-specific thread", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 0);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/The thread that ties these words together/);
  });

  it("grounds Prompt 1 with the verse's own command/promise/warning words", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 1);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/What the verse's own words tell us|commands|promises|authority|faithful/);
    expect(res!.answer!).toMatch(/Beneath the voice, one truth holds steady/);
  });

  it("grounds Prompt 3 with why the repetition matters", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 3);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Why the repetition matters/);
  });

  it("grounds Prompt 4 with what the contrast calls us toward", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 4);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/What the contrast is calling us toward/);
  });

  it("grounds Prompt 5 with the heart of the passage and the text's own question", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 5);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/The heart of this passage/);
    expect(res!.answer!).toMatch(/text's own question|something to do|something to trust/);
  });
});

describe("generatePromptAnswer — law-genre ritual verse (Numbers 8:8 'sin offering')", () => {
  it("does not misread 'sin offering' as the judgment theme", async () => {
    stubNumbersVerse();
    try {
      const res = await generatePromptAnswer("Numbers", 8, 8, 0);
      expectAnswer(res);
      // The judgment-theme truth must never fire for a purification ritual.
      expect(res!.answer!).not.toMatch(/takes sin and its consequences|voice of love, not rejection/);
      // The law-genre truth grounds it instead.
      expect(res!.answer!).toMatch(/behind every command|covenant of grace/);
      // The quoted text is the BSB reading the user sees (grain offering, not cereal).
      expect(res!.answer!).toMatch(/grain offering/);
      expect(res!.answer!).not.toMatch(/cereal offering/);
      // Circling words pick the ritual's content nouns, not filler.
      expect(res!.answer!).toMatch(/offering, bull, grain, flour/);
      // Clean plain text throughout.
      expect(res!.answer!).not.toMatch(/\*\*/);
    } finally {
      restoreJohnVerse();
    }
  });

  it("reports the law truth for every prompt on the ritual verse", async () => {
    stubNumbersVerse();
    try {
      for (let idx = 0; idx < 6; idx++) {
        const res = await generatePromptAnswer("Numbers", 8, 8, idx);
        expectAnswer(res);
        expect(res!.answer!).not.toMatch(/takes sin and its consequences/);
        expect(res!.answer!).not.toMatch(/\*\*/);
      }
    } finally {
      restoreJohnVerse();
    }
  });
});

describe("generatePromptAnswer — providence truth (Genesis 50:20)", () => {
  it("quotes the providence truth in Prompt 0", async () => {
    stubGenesis50Verse();
    try {
      const res = await generatePromptAnswer("Genesis", 50, 20, 0);
      expectAnswer(res);
      // The thread section must be the providence truth (not judgment or the
      // generic lesson), quoting the verse's own "intended it for good".
      expect(res!.answer!).toMatch(/quiet providence/);
      expect(res!.answer!).toMatch(/not accident but appointment/);
      expect(res!.answer!).toMatch(/intended it for good/);
      expect(res!.answer!).not.toMatch(/takes sin and its consequences/);
      expect(res!.answer!).not.toMatch(/This verse reveals something essential/);
      // Clean plain text throughout.
      expect(res!.answer!).not.toMatch(/\*\*/);
    } finally {
      restoreJohnVerse();
    }
  });

  it("grounds every Look prompt in the providence truth", async () => {
    stubGenesis50Verse();
    try {
      for (let idx = 0; idx < 6; idx++) {
        const res = await generatePromptAnswer("Genesis", 50, 20, idx);
        expectAnswer(res);
        // Every prompt's closing truth section stays passage-specific: the
        // providence theme must surface rather than a generic fallback.
        expect(res!.answer!).toMatch(/providence/);
        expect(res!.answer!).not.toMatch(/This verse reveals something essential/);
        expect(res!.answer!).not.toMatch(/\*\*/);
      }
    } finally {
      restoreJohnVerse();
    }
  });
});

describe("generatePromptAnswer — Prompt 5 (narrative fallback without chapter tools)", () => {
  it("anchors Ruth 2:1 questions in the passage's narrative truth", async () => {
    stubRuthVerse();
    try {
      const res = await generatePromptAnswer("Ruth", 2, 1, 5);
      expectAnswer(res);
      expect(res!.promptIdx).toBe(5);
      expect(res!.answer!).toMatch(/heart of this passage|Boaz|kinsman|redeemer/);
      expect(res!.answer!).not.toMatch(/This verse reveals something essential/);
    } finally {
      restoreJohnVerse();
    }
  });
});

describe("generatePromptAnswer — Prompt 3 & 4 (genre-aware fallbacks without chapter tools)", () => {
  it("gives Ruth 2:1 (history, no tools) a genre-aware repetition guide", async () => {
    stubRuthVerse();
    try {
      const res = await generatePromptAnswer("Ruth", 2, 1, 3);
      expectAnswer(res);
      expect(res!.promptIdx).toBe(3);
      expect(res!.answer!).toMatch(/What repetition looks like in this story/);
      expect(res!.answer!).not.toMatch(/This verse reveals something essential/);
    } finally {
      restoreJohnVerse();
    }
  });

  it("gives Ruth 2:1 (history, no tools) a genre-aware contrast guide", async () => {
    stubRuthVerse();
    try {
      const res = await generatePromptAnswer("Ruth", 2, 1, 4);
      expectAnswer(res);
      expect(res!.promptIdx).toBe(4);
      expect(res!.answer!).toMatch(/What contrasts look like in this story/);
      expect(res!.answer!).not.toMatch(/This verse reveals something essential/);
    } finally {
      restoreJohnVerse();
    }
  });
});

describe("generatePromptAnswer — Amplified gloss cleanup (Beatitudes)", () => {
  it("ignores parenthetical glosses in repetition analysis — no 'and'/'the' repeats", async () => {
    stubBeatitudesVerse();
    try {
      const res = await generatePromptAnswer("Matthew", 5, 3, 3);
      expectAnswer(res);
      // The repeated-word spotlight must be about content, not gloss filler.
      expect(res!.answer!).toMatch(/"blessed" appears 3 times/i);
      expect(res!.answer!).not.toMatch(/"and" appears/);
      expect(res!.answer!).not.toMatch(/"the" appears/);
      // No Amplified gloss text may leak into the answer.
      expect(res!.answer!).not.toMatch(/to be envied|spiritually prosperous|life-joy|rate themselves/);
      // Theme detection must not be polluted by gloss words (life-joy, salvation),
      // and the correct theme for "Blessed..." is blessing/kingdom, not hope/power.
      // (The word "life" itself may legitimately appear, e.g. "a life held by
      // that favor" — what must never appear is the old false "life/hope
      // themes" claim or the life-truth's "outlasts death" line.)
      expect(res!.answer!).not.toMatch(/salvation/);
      expect(res!.answer!).not.toMatch(/life and hope themes|the life and/);
      expect(res!.answer!).not.toMatch(/outlasts death|never meant to end at the grave/);
      expect(res!.answer!).toMatch(/blessing|kingship|hope/);
    } finally {
      // Always restore the John fixture, even when an assertion fails, so a
      // leaked Beatitudes stub can't pollute the later Prompt 4 tests.
      restoreJohnVerse();
    }
  });
});

describe("generatePromptAnswer — Prompt 3 (repetition)", () => {
  it("reports repeated words from chapter study tools", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 3);
    expectAnswer(res);
    expect(res!.promptIdx).toBe(3);
    expect(res!.answer!).toMatch(/Notable repetitions|believe/);
  });

  it("analyzes word frequency from verse text", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 3);
    expectAnswer(res);
    // Stopword repeats ("that") are grammar, not emphasis — the spotlight falls
    // on content words or, when none repeat, the concepts that cluster.
    expect(res!.answer!).toMatch(/appears|times|key concepts cluster|No single word repeats/);
  });

  it("identifies thematic repetition from detected themes", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 3);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/Thematic repetition|love|faith|life/);
  });
});

describe("generatePromptAnswer — Prompt 4 (contrasts)", () => {
  it("reports contrasts from chapter study tools", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 4);
    expectAnswer(res);
    expect(res!.promptIdx).toBe(4);
    expect(res!.answer!).toMatch(/Contrast|Life vs|Perishing|life.*death|death.*life/);
  });

  it("scans verse text for contrast keywords", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 4);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/perish|eternal life|light.*dark|condemn/);
  });

  it("references verse text in contrast analysis", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 4);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/perish|eternal life|whoever believes|shall not/);
  });
});

describe("generatePromptAnswer — Prompt 5 (questions raised)", () => {
  it("generates theme-appropriate reflection questions", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 5);
    expectAnswer(res);
    expect(res!.promptIdx).toBe(5);
    expect(res!.answer!).toMatch(/\?/);
  });

  it("asks passage-specific questions about God and humanity", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 5);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/God|Father|Christ|Jesus|humanity|world|believe/);
  });

  it("grounds questions in the actual verse text", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 5);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/loved|gave|begotten|perish|eternal life/);
  });

  it("connects personal application to passage themes", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 5);
    expectAnswer(res);
    expect(res!.answer!).toMatch(/you|your|respond|live|life/);
  });
});

describe("generatePromptAnswer — data precision (template engine)", () => {
  it("deduplicates surrounding verses, preferring BSB over other translations", async () => {
    const prismaMock = require("../../../config/db.js").prisma;
    // Simulate the 28-translation search index: same verse in multiple translations.
    prismaMock.searchIndex.findMany.mockImplementation(({ where }: { where: any }) => {
      // Main verse lookup stays BSB.
      if (where?.verse && typeof where.verse === "number") {
        return [{ verseText: ORIGINAL_VERSE_TEXT, translation: "BSB" }];
      }
      return [
        { verse: 15, verseText: "so that whoever believes may in Him have eternal life.", translation: "KJV" },
        { verse: 15, verseText: "so that everyone who believes in Him may have eternal life.", translation: "BSB" },
        { verse: 17, verseText: "For God did not send the Son into the world to judge the world.", translation: "BSB" },
        { verse: 17, verseText: "For God sent not his Son into the world to condemn the world.", translation: "KJV" },
      ];
    });
    try {
      const res = await generatePromptAnswer("John", 3, 16, 0);
      expectAnswer(res);

      // Each verse number appears exactly once in the surrounding-verse section,
      // and the BSB reading is the one shown.
      const contextSection = res!.answer!.split("See it in context")[1] || "";
      expect(contextSection.match(/Verse 15/g)?.length).toBe(1);
      expect(contextSection.match(/Verse 17/g)?.length).toBe(1);
      expect(contextSection).toContain("so that everyone who believes in Him may have eternal life.");
      expect(contextSection).not.toContain("so that whoever believes may in Him have eternal life.");
    } finally {
      restoreJohnVerse();
    }
  });

  it("quotes the full verse and surfaces curated word-study terms", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 0);
    expectAnswer(res);
    // The answer should open by quoting the actual verse.
    expect(res!.answer!).toMatch(/Start with the verse itself|For God so loved/);
    expect(res!.answer!).toMatch(/Key terms to observe|agapaō|kosmos/);
  });

  it("no longer emits the old robotic phrasing", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 0);
    expectAnswer(res);
    expect(res!.answer!).not.toMatch(/these carry the weight/);
  });

  it("never trails off with ellipsis truncations", async () => {
    for (let idx = 0; idx < 6; idx++) {
      const res = await generatePromptAnswer("John", 3, 16, idx);
      expectAnswer(res);
      expect(res!.answer!).not.toMatch(/…/);
      expect(res!.answer!).not.toMatch(/\.\.\./);
    }
  });

  it("emits clean plain text without markdown markers for every prompt", async () => {
    for (let idx = 0; idx < 6; idx++) {
      const res = await generatePromptAnswer("John", 3, 16, idx);
      expectAnswer(res);
      // Prompt answers land in a plain textarea — no ** or * markers allowed.
      expect(res!.answer!).not.toMatch(/\*\*/);
      expect(res!.answer!).not.toMatch(/(^|\s)\*[^*]/);
    }
  });

  it("sizes answers to the question being asked", async () => {
    // The focused repetition prompt stays concise; the five-part reflection
    // prompt (questions) earns more room.
    const repetition = await generatePromptAnswer("John", 3, 16, 3);
    const questions = await generatePromptAnswer("John", 3, 16, 5);
    expectAnswer(repetition);
    expectAnswer(questions);
    expect(repetition!.answer!.length).toBeLessThan(questions!.answer!.length);
  });
});

describe("generatePromptAnswer — validation & edge cases", () => {
  it("returns error for promptIdx less than 0", async () => {
    const res = await generatePromptAnswer("John", 3, 16, -1);
    expect(res).toBeTruthy();
    expect(res!.error).toMatch(/Invalid prompt index/i);
  });

  it("returns error for promptIdx greater than 5", async () => {
    const res = await generatePromptAnswer("John", 3, 16, 6);
    expect(res).toBeTruthy();
    expect(res!.error).toMatch(/Invalid prompt index/i);
  });

  it("handles missing verse text gracefully", async () => {
    const prismaMock = require("../../../config/db.js").prisma;
    prismaMock.searchIndex.findMany.mockImplementation(({ where }: { where: any }) => {
      if (where?.verse && typeof where.verse === "number") {
        return []; // no verse row at all
      }
      return [
        { verse: 15, verseText: "so that whoever believes may in Him have eternal life." },
        { verse: 17, verseText: "For God did not send the Son into the world to judge the world." },
      ];
    });
    try {
      const res = await generatePromptAnswer("John", 3, 16, 0);
      expectAnswer(res);
      expect(res!.promptIdx).toBe(0);
    } finally {
      restoreJohnVerse();
    }
  });

  it("returns correct structure for all 6 prompt indices", async () => {
    for (let idx = 0; idx < 6; idx++) {
      const res = await generatePromptAnswer("John", 3, 16, idx);
      expectAnswer(res);
      expect(res!.promptIdx).toBe(idx);
      expect(res!.answer!.length).toBeGreaterThan(50);
      expect(res!.verseRef).toBeTruthy();
    }
  });

  it("produces distinct answers for each prompt type", async () => {
    const answers = await Promise.all(
      Array.from({ length: 6 }, (_, i) => generatePromptAnswer("John", 3, 16, i))
    );
    const texts = answers.filter(a => a?.answer).map(a => a!.answer!);
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        expect(texts[i]).not.toEqual(texts[j]);
      }
    }
  });
});
