import {
  BIBLE_BOOK_NAMES,
  buildLocalizedReference,
  localizeReferenceText,
  splitCrossReference,
} from "./bookNames.js";

describe("localized Bible references", () => {
  it("has all 66 books in every supported language", () => {
    const englishBooks = Object.keys(BIBLE_BOOK_NAMES.en);
    expect(englishBooks).toHaveLength(66);
    expect(Object.keys(BIBLE_BOOK_NAMES)).toHaveLength(39);
    for (const [language, map] of Object.entries(BIBLE_BOOK_NAMES)) {
      expect(Object.keys(map)).toHaveLength(66);
      for (const book of englishBooks) {
        expect(map[book]).toBeTruthy();
      }
      expect(language).toBeTruthy();
    }
  });

  it("localizes every reference in a multi-reference string", () => {
    expect(
      localizeReferenceText("Romans 8:28; Ephesians 2:8", "zh"),
    ).toBe("罗马书 8:28; 以弗所书 2:8");
    expect(localizeReferenceText("romans 8:28", "zh")).toBe("罗马书 8:28");
    expect(localizeReferenceText("1 Cor 13:4 and John 3:16", "zh")).toBe(
      "哥林多前书 13:4 and 约翰福音 3:16",
    );
  });

  it("handles aliases without touching ordinary prose", () => {
    expect(localizeReferenceText("Psalm 23:1", "zh")).toBe("诗篇 23:1");
    expect(localizeReferenceText("Song of Songs 1:1", "zh")).toBe(
      "雅歌 1:1",
    );
    expect(localizeReferenceText("The book of Romans is great", "zh")).toBe(
      "The book of Romans is great",
    );
  });

  it("builds a reference from canonical book/chapter/verse fields", () => {
    expect(
      buildLocalizedReference(
        { bookName: "John", chapter: 3, verseNumber: 16 },
        "zh",
      ),
    ).toBe("约翰福音 3:16");
    expect(
      buildLocalizedReference({ passageReference: "Romans 8:28" }, "zh"),
    ).toBe("罗马书 8:28");
  });

  it("splits explanations on spaced or unspaced em dashes", () => {
    expect(splitCrossReference("Proverbs 3:5–6 — Trust the Lord")).toEqual({
      reference: "Proverbs 3:5–6",
      separator: " — ",
      text: "Trust the Lord",
    });
    expect(splitCrossReference("Romans 8:28—God works all things")).toEqual({
      reference: "Romans 8:28",
      separator: "—",
      text: "God works all things",
    });
    expect(splitCrossReference("Romans 8:28")).toBeNull();
  });
});
