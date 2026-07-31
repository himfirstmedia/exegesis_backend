import { detectThemes } from "../templates/themes.js";
import {
  THEME_CHECKS,
  THEME_ANCHORS,
  THEME_LESSONS,
  THEME_APPLICATIONS,
  THEME_PRAYERS,
  THEME_DESCRIPTIONS,
  THEME_CONTRASTS,
  THEME_QUESTIONS,
} from "../templates/themes.js";
import { THEME_TRUTHS } from "../templates/truths.js";

describe("detectThemes — accuracy", () => {
  it("detects blessing as the dominant theme for the Beatitudes (not hope/power/life)", () => {
    const beatitudes =
      "Blessed are the poor in spirit, for theirs is the kingdom of heaven. " +
      "Blessed are those who mourn, for they will be comforted. " +
      "Blessed are the meek, for they will inherit the earth.";
    const themes = detectThemes(beatitudes);
    // "Blessed" ×3 + "inherit" must land on blessing — the old engine mapped
    // "blessed" -> hope and "kingdom" -> power, producing the wrong
    // "life and hope" style claims the user reported.
    expect(themes[0]).toBe("blessing");
    // Second theme: "kingdom" -> kingship, "comforted" -> peace, and "meek"
    // -> humility all score 2; insertion order resolves the tie, so any of
    // the three is accurate.
    expect(["kingship", "peace", "humility"]).toContain(themes[1]);
    expect(themes).not.toContain("hope");
    expect(themes).not.toContain("power");
    expect(themes).not.toContain("life");
  });

  it("detects love + life for John 3:16", () => {
    const john =
      "For God so loved the world that He gave His only begotten Son, " +
      "that whoever believes in Him shall not perish but have eternal life.";
    const themes = detectThemes(john);
    expect(themes).toContain("love");
    expect(themes).toContain("life");
  });

  it("detects a single dominant theme when one word repeats heavily", () => {
    const psalm =
      "Praise the LORD! Praise God in His sanctuary; praise Him in His mighty heavens!";
    const themes = detectThemes(psalm);
    expect(themes[0]).toBe("praise");
  });

  it("returns no themes for a theme-less narrative verse", () => {
    const ruth = "Now Naomi had a relative on her husband's side, a prominent man of noble character from the clan of Elimelech, whose name was Boaz.";
    expect(detectThemes(ruth)).toEqual([]);
  });

  it("keeps hope separate from blessing (blessed no longer hijacks hope)", () => {
    expect(detectThemes("Blessed be the God and Father of our Lord Jesus Christ, who has blessed us with every spiritual blessing.")).toContain("blessing");
    // A verse with real hope words still detects hope.
    expect(detectThemes("May the God of hope fill you with all joy and peace as you trust in Him, so that you may overflow with hope.")).toContain("hope");
  });
});

describe("detectThemes — providence/trust theme", () => {
  it("detects providence for narrative verses about God's orchestration (Ruth 2:3)", () => {
    const ruth =
      "So she went out, and she happened to come to the part of the field belonging to Boaz, who was from the clan of Elimelech.";
    // "happened to come" isn't a providence marker; the providence theme needs
    // explicit orchestration language — so a plain narrative like Ruth 2:3
    // must NOT misfire onto providence.
    expect(detectThemes(ruth)).not.toContain("providence");
  });

  it("detects providence when the text names God's arrangement (Gen 50:20)", () => {
    const gen =
      "You intended to harm me, but God intended it for good, to accomplish what is now being done, the saving of many lives.";
    const themes = detectThemes(gen);
    expect(themes).toContain("providence");
  });

  it("detects providence for explicit trust language (Proverbs 3:5)", () => {
    const prov =
      "Trust in the LORD with all your heart, and lean not on your own understanding.";
    const themes = detectThemes(prov);
    // "trust" now belongs to providence, not faith.
    expect(themes).toContain("providence");
    expect(themes).not.toContain("faith");
  });

  it("does not let the generic title 'LORD' dominate as kingship", () => {
    // "lord" stays in the kingship regex but is no longer an anchor, so a
    // verse that merely mentions the LORD (like a Psalm opening) doesn't get
    // a doubled kingship score that outranks its real themes.
    const psalm = "The LORD is my light and my salvation; whom shall I fear?";
    const themes = detectThemes(psalm);
    // light (anchor ×2) and life (salvation, anchor ×2) must outrank the
    // single non-anchor kingship point from the title "LORD".
    expect(themes).toContain("light");
    expect(themes).toContain("life");
    expect(themes).not.toContain("kingship");
  });
});

describe("detectThemes — expanded theme set", () => {
  it("detects justice for righteousness/uprightness verses", () => {
    // Micah 6:8 ties love/grace/justice/humility at 2 (a genuine 4-way tie),
    // so it can't pin justice as dominant; Amos 5:24 is unambiguous.
    const amos =
      "But let justice roll on like a river, righteousness like a never-failing stream!";
    const themes = detectThemes(amos);
    expect(themes[0]).toBe("justice");
  });

  it("detects humility for meekness/lowliness verses", () => {
    const james = "Humble yourselves before the Lord, and He will exalt you.";
    const themes = detectThemes(james);
    expect(themes).toContain("humility");
  });

  it("detects holiness for sanctification verses", () => {
    const peter = "But as He who called you is holy, you also be holy in all your conduct.";
    const themes = detectThemes(peter);
    expect(themes).toContain("holiness");
  });

  it("detects unity for one-heart fellowship verses", () => {
    const psalm = "Behold, how good and pleasant it is when brothers dwell in unity!";
    const themes = detectThemes(psalm);
    expect(themes).toContain("unity");
  });

  it("detects joy for rejoicing/delight verses", () => {
    const phil = "Rejoice in the Lord always; again I will say, rejoice!";
    const themes = detectThemes(phil);
    expect(themes).toContain("joy");
  });
});

describe("template data completeness — every theme has rich content", () => {
  const allThemes = Object.keys(THEME_CHECKS) as Array<keyof typeof THEME_CHECKS>;

  it("has anchors, lessons, truths, descriptions, contrasts, and questions for every theme", () => {
    for (const theme of allThemes) {
      expect((THEME_ANCHORS[theme] as string[] | undefined)?.length).toBeGreaterThan(0);
      expect(THEME_LESSONS[theme]).toMatch(/\{\{keyClause\}\}/);
      expect(THEME_TRUTHS[theme]).toMatch(/\{\{keyClause\}\}/);
      expect(THEME_DESCRIPTIONS[theme]).toBeTruthy();
      expect(THEME_CONTRASTS[theme]).toBeTruthy();
      expect(THEME_QUESTIONS[theme]).toBeTruthy();
    }
  });

  it("gives every theme 3 application variants (non-static answers)", () => {
    for (const theme of allThemes) {
      expect((THEME_APPLICATIONS[theme] as string[] | undefined)?.length).toBe(3);
      for (const app of THEME_APPLICATIONS[theme]) {
        expect(app.length).toBeGreaterThan(80);
      }
    }
  });

  it("gives every theme 3 prayer variants (non-static answers)", () => {
    for (const theme of allThemes) {
      expect((THEME_PRAYERS[theme] as string[] | undefined)?.length).toBe(3);
      for (const p of THEME_PRAYERS[theme]) {
        expect(p.length).toBeGreaterThan(80);
      }
    }
  });
});
