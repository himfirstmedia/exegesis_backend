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
        findFirst: jest.fn().mockResolvedValue({ verseText: VERSE_TEXT }),
        findMany: jest.fn().mockResolvedValue([
          { verse: 15, verseText: "so that whoever believes may in Him have eternal life." },
          { verse: 17, verseText: "For God did not send the Son into the world to judge the world." },
        ]),
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
    expect(res!.answer!).toMatch(/appears|repeated|times/);
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
    prismaMock.searchIndex.findFirst.mockResolvedValue(null);

    const res = await generatePromptAnswer("John", 3, 16, 0);
    expectAnswer(res);
    expect(res!.promptIdx).toBe(0);

    prismaMock.searchIndex.findFirst.mockResolvedValue({ verseText: ORIGINAL_VERSE_TEXT });
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
