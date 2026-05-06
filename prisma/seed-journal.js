import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding journal data...");

  // Get a test user ID (first user in database)
  const testUser = await prisma.systemUser.findFirst({
    where: { status: true },
  });

  if (!testUser) {
    console.log("No active user found. Creating a test user...");
  }

  const userId = testUser?.id || "00000000-0000-0000-0000-000000000001";

  // Create Journal Prompts
  const prompts = [
    {
      prompt: "What stood out to you most in your reading today?",
      category: "study",
      description: "Focus on key insights from scripture",
      order: 1,
      isActive: true,
    },
    {
      prompt: "How does this passage challenge your current thinking?",
      category: "reflection",
      description: "Identify areas for growth",
      order: 2,
      isActive: true,
    },
    {
      prompt: "What is one way you can apply this today?",
      category: "application",
      description: "Turn knowledge into action",
      order: 3,
      isActive: true,
    },
    {
      prompt: "What are you grateful for today?",
      category: "gratitude",
      description: "Cultivate thankfulness",
      order: 4,
      isActive: true,
    },
    {
      prompt: "What prayers do you want to bring before God?",
      category: "prayer",
      description: "Share your heart with God",
      order: 5,
      isActive: true,
    },
    {
      prompt: "What did you learn about God's character today?",
      category: "study",
      description: "Know God better",
      order: 6,
      isActive: true,
    },
    {
      prompt: "What is holding you back from following God fully?",
      category: "reflection",
      description: "Identify obstacles",
      order: 7,
      isActive: true,
    },
    {
      prompt: "Who can you share this with today?",
      category: "application",
      description: "Live out your faith",
      order: 8,
      isActive: true,
    },
    {
      prompt: "What verse or phrase will you carry with you?",
      category: "general",
      description: "Memorize and meditate",
      order: 9,
      isActive: true,
    },
    {
      prompt: "How has God been faithful to you this week?",
      category: "gratitude",
      description: "Remember His goodness",
      order: 10,
      isActive: true,
    },
  ];

  for (const prompt of prompts) {
    await prisma.journalPrompt.upsert({
      where: { id: BigInt(0) },
      update: {},
      create: {
        ...prompt,
        createdBy: userId,
      },
    });
  }
  console.log(`Created ${prompts.length} journal prompts`);

  // Create Journal Templates
  const templates = [
    {
      name: "Daily Bible Study",
      description: "A structured approach to studying God's Word",
      category: "study",
      promptsJson: JSON.stringify([
        "What did I learn about God?",
        "What did I learn about myself?",
        "How will I apply this today?",
        "What question do I still have?",
        "What can I share with someone?",
      ]),
      isActive: true,
      isDefault: true,
    },
    {
      name: "Prayer Journal",
      description: "Track your prayers and God's answers",
      category: "prayer",
      promptsJson: JSON.stringify([
        "What is on my heart today?",
        "Who am I praying for?",
        "What am I grateful for?",
        "What is God teaching me?",
        "How did God answer my prayers this week?",
      ]),
      isActive: true,
      isDefault: false,
    },
    {
      name: "Gratitude Journal",
      description: "Cultivate a heart of thanksgiving",
      category: "gratitude",
      promptsJson: JSON.stringify([
        "3 things I'm grateful for today",
        "How did God show up today?",
        "Who made a difference in my day?",
        "What simple blessing did I notice?",
        "What am I looking forward to tomorrow?",
      ]),
      isActive: true,
      isDefault: false,
    },
    {
      name: "Reflection (What, So What, Now What)",
      description: "Deep reflection on your spiritual journey",
      category: "reflection",
      promptsJson: JSON.stringify([
        "What happened? (What did I read, learn, experience?)",
        "So what? (What does this mean? How does it change my understanding?)",
        "Now what? (How will I respond? What will I do differently?)",
      ]),
      isActive: true,
      isDefault: false,
    },
    {
      name: "Application Focus",
      description: "Turn scripture into action",
      category: "application",
      promptsJson: JSON.stringify([
        "What verse or truth stuck with me?",
        "How does this challenge my current habits?",
        "What's one specific action I will take?",
        "Who can I share this with?",
        "When will I do this?",
      ]),
      isActive: true,
      isDefault: false,
    },
  ];

  for (const template of templates) {
    await prisma.journalTemplate.upsert({
      where: { id: BigInt(0) },
      update: {},
      create: {
        ...template,
        createdBy: userId,
      },
    });
  }
  console.log(`Created ${templates.length} journal templates`);

  // Create Sample Journal Entries
  const journalEntries = [
    {
      userId,
      title: "God's Unchanging Love",
      content: "Today I read about God's faithful love throughout the Psalms. It's amazing how David could experience such joy and peace even in difficult circumstances. He constantly turned to God for strength and comfort. This reminds me that my circumstances don't define my relationship with God - my faith does.",
      bookName: "Psalms",
      chapter: 23,
      verseNumber: 4,
      category: "study",
      mood: "peaceful",
      learnings: "God's love is unconditional and ever-present. Even in the valley of the shadow of death, He is with us.",
      application: "I will start each day with prayer, regardless of my circumstances, to keep my focus on God.",
      gratitude: "Grateful for the assurance that God is always with me.",
      isPublished: false,
      isFavorite: true,
      tags: "psalms,faith,comfort",
    },
    {
      userId,
      title: "The Power of Forgiveness",
      content: "Reading about Joseph's story was powerful. He forgave his brothers who sold him into slavery. This shows incredible grace and forgiveness. It made me think about people in my life I need to forgive.",
      bookName: "Genesis",
      chapter: 45,
      verseNumber: 15,
      category: "reflection",
      mood: "thoughtful",
      learnings: "Forgiveness is not about the other person - it's about freeing yourself from bitterness.",
      application: "I will write a letter to someone I need to forgive, even if I don't send it.",
      gratitude: "Thankful for the opportunity to show grace like God shows me.",
      isPublished: false,
      isFavorite: false,
      tags: "forgiveness,genesis,grace",
    },
    {
      userId,
      title: "Trusting God's Timing",
      content: "I've been struggling with patience lately, waiting for God's plan to unfold. Reading about Abraham waiting for Isaac was a good reminder that God's timing is perfect. Even when it doesn't make sense, I can trust Him.",
      bookName: "Genesis",
      chapter: 21,
      verseNumber: 2,
      category: "prayer",
      mood: "hopeful",
      learnings: "God's delays are not denials. His timing is always better than mine.",
      prayers: "God, help me trust Your timing. Give me patience as I wait on Your plan. Help me remember that You are always working for my good.",
      gratitude: "Thankful that God is faithful even when I don't understand His plan.",
      isPublished: false,
      isFavorite: true,
      tags: "patience,trust,faith",
    },
    {
      userId,
      title: "Love in Action",
      content: "Today's reading about John teaching about love really challenged me. It's not just about saying we love God - it's about showing it through our actions toward others. The early church's unity and care for each other is a great example.",
      bookName: "1 John",
      chapter: 3,
      verseNumber: 18,
      category: "application",
      mood: "motivated",
      learnings: "True love is demonstrated through action, not just words.",
      application: "I will look for one practical way to serve someone in my community this week.",
      gratitude: "Grateful for the opportunity to show God's love to others.",
      isPublished: false,
      isFavorite: false,
      tags: "love,action,community",
    },
    {
      userId,
      title: "God's Faithfulness",
      content: "As I look back over this month, I'm amazed at how God has provided and guided me. There were moments of uncertainty, but He was always faithful. This strengthens my trust in Him for the future.",
      bookName: null,
      chapter: null,
      verseNumber: null,
      category: "gratitude",
      mood: "grateful",
      gratitude: "Thank You, God, for: A new job opportunity, Health for my family, Friends who encourage me, Your presence every day, Your unconditional love",
      isPublished: false,
      isFavorite: true,
      tags: "faithfulness,gratitude,review",
    },
    {
      userId,
      title: "Questions About Prayer",
      content: "I've been thinking a lot about prayer lately. Why does God want us to pray? Does He already know what we need? What's the purpose of petitionary prayer if God already has a plan?",
      bookName: "Matthew",
      chapter: 6,
      verseNumber: 9,
      category: "general",
      mood: "challenged",
      learnings: "Prayer is less about telling God what to do and more about developing our relationship with Him.",
      application: "I want to spend at least 15 minutes each day in prayer just talking to God, not asking for things.",
      isPublished: false,
      isFavorite: false,
      tags: "prayer,questions,faith",
    },
    {
      userId,
      title: "Walking in the Light",
      content: "The passage about walking in the light vs darkness really spoke to me. It's a daily choice to follow Jesus. Each day I need to decide to live according to His Word.",
      bookName: "1 John",
      chapter: 1,
      verseNumber: 7,
      category: "study",
      mood: "blessed",
      learnings: "Walking in the light is a daily commitment, not a one-time decision.",
      application: "I will read my Bible every morning this week to start my day with God's truth.",
      isPublished: false,
      isFavorite: true,
      tags: "light,daily,commitment",
    },
    {
      userId,
      title: "Lessons from the Parables",
      content: "The parable of the sower shows different responses to God's Word. I want to be the good soil - receptive and bearing fruit. But I also need to check my heart for weeds of worry or worldly concerns.",
      bookName: "Matthew",
      chapter: 13,
      verseNumber: 23,
      category: "reflection",
      mood: "thoughtful",
      learnings: "The condition of my heart determines how I receive God's Word.",
      application: "I will examine my heart this week and remove anything that might choke out God's truth.",
      isPublished: false,
      isFavorite: false,
      tags: "parable,heart,fruit",
    },
  ];

  for (const entry of journalEntries) {
    await prisma.journalEntry.create({
      data: {
        ...entry,
        chapter: entry.chapter ? BigInt(entry.chapter) : null,
        verseNumber: entry.verseNumber ? BigInt(entry.verseNumber) : null,
      },
    });
  }
  console.log(`Created ${journalEntries.length} journal entries`);

  console.log("✅ Journal seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding journal data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });