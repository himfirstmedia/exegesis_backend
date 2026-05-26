import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

// Look up an existing admin/system user dynamically — falls back to the first user
const getAdminUserId = async () => {
  const admin = await prisma.systemUser.findFirst({
    where: { OR: [{ userRole: 1n }, { email: "apps.himfirstmedia@gmail.com" }] },
    orderBy: { createdOn: "asc" },
  });
  if (admin) return admin.id;
  // Fallback: get any user
  const anyUser = await prisma.systemUser.findFirst({
    orderBy: { createdOn: "asc" },
  });
  return anyUser?.id || "bbb2816c-62d0-4e5d-bd9d-54c82e6baf6c";
};

/**
 * Builds a Date at midnight for a given offset from today.
 * @param {number} dayOffset - Number of days from today (0 = today)
 * @returns {Date}
 */
const dateAtMidnight = (dayOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dailyVerses = [
  {
    bookName: "John",
    chapter: 3,
    verseNumber: 16,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(0), // Monday
    reflection:
      "God's love is the foundation of our faith. He gave His only Son so that we might have eternal life through faith in Him.",
    explanation:
      "Often called 'the Gospel in a nutshell,' this verse summarizes the entire message of salvation. It reveals God's motivation is love — not merely an abstract attribute but a self-giving, sacrificial love that initiated salvation before any human response. The scope of God's love is universal: 'the world,' meaning all humanity without distinction.",
    learnMore: "https://www.biblegateway.com/passage/?search=John+3%3A16&version=KJV",
  },
  {
    bookName: "Jeremiah",
    chapter: 29,
    verseNumber: 11,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(1), // Tuesday
    reflection:
      "God has good plans for your life — plans to prosper you and give you hope and a future. Trust in His timing and purpose.",
    explanation:
      "This verse, part of Jeremiah's letter to the exiles in Babylon, assures us that God's plans are comprehensive and trustworthy. The 'plans to prosper you' refer to God's covenant faithfulness to preserve and restore His people according to His redemptive purposes. The 'hope and a future' ultimately point forward to the coming of Christ.",
    learnMore: "https://www.biblegateway.com/passage/?search=Jeremiah+29%3A11&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 23,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(2), // Wednesday
    reflection:
      "The Lord is our Shepherd — He guides, provides, and protects. With Him, we lack nothing.",
    explanation:
      "This beloved psalm opens with the tender metaphor of the Lord as a shepherd. In ancient Israel, shepherds were known for their intimate care, guidance, and protection of their sheep. By declaring 'I shall not want,' David expresses complete trust in God's provision. This opening verse sets the stage for the entire psalm, portraying a life of peace, security, and blessing that flows from trusting in the Good Shepherd.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+23&version=KJV",
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 13,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(3), // Thursday
    reflection:
      "Through Christ who strengthens us, we can face any circumstance with contentment and faith.",
    explanation:
      "Paul writes from prison, having learned to be content in every circumstance. 'I can do all things' is not about accomplishing any goal we set for ourselves, but about being enabled by Christ to face any circumstance with contentment and faithfulness. The secret is not self-confidence but Christ-dependence: the strength to persevere comes not from within but from Christ who empowers us.",
    learnMore: "https://www.biblegateway.com/passage/?search=Philippians+4%3A13&version=KJV",
  },
  {
    bookName: "Romans",
    chapter: 8,
    verseNumber: 28,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(4), // Friday
    reflection:
      "God works all things together for the good of those who love Him and are called according to His purpose.",
    explanation:
      "This verse stands as one of the most comforting promises in all of Scripture. The promise that 'all things work together for good' assures us that God, in His sovereignty, is able to weave even the most painful circumstances into His redemptive purposes. The 'good' referred to is being conformed to the likeness of Christ. This verse does not promise that all things will work out according to our preferences, but that God will use all things to accomplish our ultimate good: Christlikeness and eternal glory.",
    learnMore: "https://www.biblegateway.com/passage/?search=Romans+8%3A28&version=KJV",
  },
  {
    bookName: "Proverbs",
    chapter: 3,
    verseNumber: 5,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(5), // Saturday
    reflection:
      "Trust in the Lord completely, not relying on your own understanding. He will direct your paths.",
    explanation:
      "This wisdom saying strikes at the heart of human self-sufficiency. To 'trust in the Lord with all your heart' means to rely completely on God's character, promises, and providence rather than on human understanding, which is inherently limited. The heart in Hebrew thought represents the whole inner person — mind, will, emotions, and intentions. Therefore, trusting with 'all your heart' demands total, undivided commitment.",
    learnMore: "https://www.biblegateway.com/passage/?search=Proverbs+3%3A5&version=KJV",
  },
  {
    bookName: "2 Corinthians",
    chapter: 5,
    verseNumber: 17,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(6), // Sunday
    reflection:
      "In Christ, you are a new creation. The old has passed away — behold, the new has come!",
    explanation:
      "Paul declares the transformative power of union with Christ. Being 'in Christ' is the central reality of the Christian life — a spiritual union that brings about an entirely new creation. The old order of life dominated by sin, guilt, and spiritual death has passed away. This is not merely moral improvement but a genuine new creation. This transformation affects every aspect of the believer's identity: old patterns of thinking, old allegiances are replaced by the new reality of life in Christ.",
    learnMore: "https://www.biblegateway.com/passage/?search=2+Corinthians+5%3A17&version=KJV",
  },
];

const main = async () => {
  console.log("🌱 Seeding 7 daily verses for the week...\n");

  let created = 0;
  let skipped = 0;

  for (const verse of dailyVerses) {
    try {
      // Check if a verse already exists for this display date
      const existing = await prisma.dailyVerse.findFirst({
        where: { displayDate: verse.displayDate },
      });

      if (existing) {
        console.log(
          `  ⚠ Verse for ${verse.displayDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} already exists — skipping.`
        );
        skipped++;
        continue;
      }

      const adminUserId = await getAdminUserId();
      await prisma.dailyVerse.create({
        data: {
          bookName: verse.bookName,
          chapter: BigInt(verse.chapter),
          verseNumber: BigInt(verse.verseNumber),
          bibleVersion: verse.bibleVersion,
          displayDate: verse.displayDate,
          reflection: verse.reflection,
          explanation: verse.explanation,
          learnMore: verse.learnMore,
          isPublished: true,
          createdBy: adminUserId,
        },
      });

      const dayName = verse.displayDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dateStr = verse.displayDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      console.log(
        `  ✅ ${dayName} (${dateStr}): ${verse.bookName} ${verse.chapter}:${verse.verseNumber} — ${verse.bibleVersion}`
      );
      created++;
    } catch (error) {
      console.error(
        `  ❌ ${verse.bookName} ${verse.chapter}:${verse.verseNumber} — ${error.message}`
      );
    }
  }

  // Summary
  const total = await prisma.dailyVerse.count({ where: { isPublished: true } });
  console.log("\n" + "═".repeat(50));
  console.log("📊 Seed Summary:");
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total published daily verses: ${total}`);
  console.log("═".repeat(50));
  console.log("\n✅ Daily verse seeding completed!");
};

main()
  .catch((e) => {
    console.error("\n❌ Error seeding daily verses:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
