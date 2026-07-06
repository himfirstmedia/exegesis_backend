import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const questions = [
  {
    question: "Who built the ark before the flood?",
    options: ["Moses", "Noah", "Abraham", "Jacob"],
    correctAnswer: 1,
    explanation:
      "Genesis 6 records that Noah built the ark in obedience to God before the flood came.",
    bookName: "Genesis",
    chapter: 6,
    verseNumber: 14,
    category: "Genesis",
    difficulty: "easy",
  },
  {
    question: "What did God create on the first day?",
    options: ["Light", "Birds", "Dry land", "The sun and moon"],
    correctAnswer: 0,
    explanation:
      'God said, "Let there be light," and there was light on the first day.',
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 3,
    category: "Creation",
    difficulty: "easy",
  },
  {
    question: "Which prophet confronted the prophets of Baal on Mount Carmel?",
    options: ["Elisha", "Isaiah", "Elijah", "Jeremiah"],
    correctAnswer: 2,
    explanation:
      "Elijah confronted the prophets of Baal on Mount Carmel, and the Lord answered by fire.",
    bookName: "1 Kings",
    chapter: 18,
    verseNumber: 36,
    category: "Prophets",
    difficulty: "medium",
  },
  {
    question:
      "In Jesus’ parable, who helped the wounded man on the road to Jericho?",
    options: ["A priest", "A Levite", "A Samaritan", "A Roman soldier"],
    correctAnswer: 2,
    explanation:
      "The Samaritan showed mercy to the wounded man, becoming the example of neighborly love.",
    bookName: "Luke",
    chapter: 10,
    verseNumber: 33,
    category: "Parables",
    difficulty: "medium",
  },
  {
    question:
      "Which king saw the writing on the wall during a feast in Babylon?",
    options: ["Nebuchadnezzar", "Belshazzar", "Cyrus", "Darius"],
    correctAnswer: 1,
    explanation:
      "Daniel 5 records that Belshazzar saw the hand writing on the wall during his feast.",
    bookName: "Daniel",
    chapter: 5,
    verseNumber: 5,
    category: "Daniel",
    difficulty: "hard",
  },
  {
    question: 'What Greek word is commonly used in John 1:1 for "Word"?',
    options: ["Agape", "Logos", "Koinonia", "Doxa"],
    correctAnswer: 1,
    explanation:
      "John 1:1 uses Logos, declaring that the Word was with God and was God.",
    bookName: "John",
    chapter: 1,
    verseNumber: 1,
    category: "Word Study",
    difficulty: "hard",
  },
];

async function main() {
  const admin = await prisma.systemUser.findFirst({
    where: {
      OR: [{ email: "admin@gmail.com" }, { username: "admin@gmail.com" }],
    },
    select: { id: true },
  });

  const createdBy = admin?.id ?? null;

  for (const item of questions) {
    const existing = await prisma.triviaQuestion.findFirst({
      where: { question: item.question },
    });

    const data = {
      question: item.question,
      optionsJson: JSON.stringify(item.options),
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      bookName: item.bookName,
      chapter: BigInt(item.chapter),
      verseNumber: BigInt(item.verseNumber),
      category: item.category,
      difficulty: item.difficulty,
      isActive: true,
      ...(createdBy ? { createdBy, updatedBy: createdBy } : {}),
    };

    if (existing) {
      await prisma.triviaQuestion.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.triviaQuestion.create({ data });
    }
  }

  console.log(`Seeded ${questions.length} trivia questions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
