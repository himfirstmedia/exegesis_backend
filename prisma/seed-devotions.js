// Seed daily devotions for the coming days
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const devotions = [
  {
    title: "The Foundation of Faith",
    content: "Faith is not a feeling; it is a firm assurance based on the character of God. Hebrews 11:1 describes faith as 'the substance of things hoped for, the evidence of things not seen.' This means our faith stands on the reality of God's promises, not on our circumstances. When Abraham was called to leave his home, he went without knowing where he was going — because he knew WHOM he was following. Today, examine the foundation of your faith. Is it built on feelings that shift like sand, or on the unchanging character of God? True faith trusts God's word even when emotions disagree.",
    bookName: "Hebrews",
    chapter: 11,
    verseNumber: 1,
  },
  {
    title: "The Power of Gratitude",
    content: "Gratitude has the power to transform our perspective. When the Apostle Paul wrote from a Roman prison, he didn't focus on his chains but on the spread of the gospel. He wrote, 'Rejoice in the Lord always; again I will say, rejoice!' (Philippians 4:4). Notice he said 'in the Lord' — not in circumstances. Gratitude is not denial of hardship but the recognition of God's presence within it. Today, try starting each hour with a moment of thanks. You'll find that gratitude is like a key that unlocks the prison of discontent.",
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 4,
  },
  {
    title: "Strength in Weakness",
    content: "In a world that celebrates strength and self-sufficiency, Paul's declaration is revolutionary: 'When I am weak, then I am strong' (2 Corinthians 12:10). Paul had pleaded with the Lord to remove a thorn in his flesh, but God's answer was sufficient grace. Our weaknesses are not obstacles to God's power — they are conduits for it. When we acknowledge our limitations, we make room for God's unlimited strength. Your greatest struggles may be the very places where God's power is most visible. Embrace your weakness as the canvas for His strength.",
    bookName: "2 Corinthians",
    chapter: 12,
    verseNumber: 10,
  },
  {
    title: "The Art of Waiting",
    content: "Waiting is one of God's most effective tools for shaping our character. The Psalms are filled with the cry, 'How long, O Lord?' Yet waiting is not passive resignation; it is active trust. Isaiah 40:31 promises that those who wait on the Lord will renew their strength. The Hebrew word for wait, 'qavah,' means to bind together like a rope — waiting actually strengthens our connection to God. In seasons of waiting, we are not wasting time; we are being woven more tightly into the fabric of God's purposes.",
    bookName: "Isaiah",
    chapter: 40,
    verseNumber: 31,
  },
  {
    title: "The Gift of Today",
    content: "Psalm 118:24 declares, 'This is the day the Lord has made; let us rejoice and be glad in it.' Each day is a gift from God, untainted by yesterday's regrets and unburdened by tomorrow's worries. Jesus taught us to pray for 'daily bread' — sufficient grace for the present moment. Too often we live either in the past (what was) or the future (what might be), missing the sacredness of the present. Today is not a rehearsal for tomorrow; it is the day God has crafted for you to encounter Him. Open your eyes to the grace hidden in this ordinary day.",
    bookName: "Psalms",
    chapter: 118,
    verseNumber: 24,
  },
  {
    title: "The Discipline of Silence",
    content: "In our noisy world, silence has become a lost art. Yet Scripture repeatedly calls us to stillness: 'Be still, and know that I am God' (Psalm 46:10). Elijah encountered God not in the wind, earthquake, or fire, but in a still, small voice. Silence is not emptiness; it is the space where God speaks. In the busyness of life, we often fill every moment with noise — music, podcasts, notifications — leaving no room for divine communication. Try setting aside five minutes today for intentional silence. Turn off the noise and listen. You may be surprised by what you hear.",
    bookName: "1 Kings",
    chapter: 19,
    verseNumber: 12,
  },
  {
    title: "The Ministry of Encouragement",
    content: "Barnabas, whose name means 'son of encouragement,' stands as a model of how a few timely words can change a life. When the early church was afraid of the newly converted Saul, Barnabas vouched for him. Later, when John Mark failed on a mission trip, Barnabas saw his potential and gave him a second chance. Proverbs 16:24 says, 'Gracious words are a honeycomb, sweet to the soul and healing to the bones.' Who in your life needs a word of encouragement today? A text, a phone call, or a handwritten note might be the spark someone needs to keep going.",
    bookName: "Acts",
    chapter: 4,
    verseNumber: 36,
  },
  {
    title: "The Paradox of Giving",
    content: "Jesus turned our economic assumptions upside down when He said, 'It is more blessed to give than to receive' (Acts 20:35). This is not merely a moral platitude; it is the operating principle of God's kingdom. Generosity breaks the power of greed, loosens the grip of materialism, and aligns our hearts with the heart of God, who gave His Son. The Macedonian churches understood this: in their extreme poverty, they begged for the privilege of giving. Generosity is not about the amount but the posture of the heart. Try giving — not just money, but time, attention, and kindness — and discover the joy that flows from open hands.",
    bookName: "Acts",
    chapter: 20,
    verseNumber: 35,
  },
  {
    title: "The Peace That Passes Understanding",
    content: "Philippians 4:7 promises 'the peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus.' This is not the absence of conflict but the presence of Christ in the midst of it. The word 'guard' is a military term — picture a garrison protecting a city. God's peace stands sentinel over your heart and mind, shielding you from anxiety. This peace is accessed through prayer and thanksgiving. When anxiety knocks at your door, answer with prayer. Let gratitude be the gatekeeper of your heart.",
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 7,
  },
  {
    title: "Faithful in Small Things",
    content: "Jesus taught that faithfulness in small things is the prerequisite for greater responsibility: 'Whoever can be trusted with very little can also be trusted with much' (Luke 16:10). In our culture that chases significance, we often despise small beginnings. But God's kingdom grows from mustard seeds. The small acts of obedience — a kind word, a disciplined prayer time, honest work, faithful stewardship of time and money — are not insignificant. They are the building blocks of character. Do not despise the day of small things. Faithfulness today in the little things prepares you for the greater things tomorrow.",
    bookName: "Luke",
    chapter: 16,
    verseNumber: 10,
  },
  {
    title: "The Transforming Power of Scripture",
    content: "The Bible is not merely a historical document or a moral guide — it is living and active. Hebrews 4:12 describes it as 'sharper than any two-edged sword, piercing even to the dividing asunder of soul and spirit.' Scripture has the power to penetrate our defenses, expose our motives, and transform our lives. It is a lamp to our feet and a light to our path (Psalm 119:105). Reading Scripture is not a duty to check off but an encounter with the living God. Approach God's Word not merely to learn about Him, but to know Him. Let the Word dwell in you richly, shaping your thoughts, desires, and actions.",
    bookName: "Hebrews",
    chapter: 4,
    verseNumber: 12,
  },
  {
    title: "The Call to Community",
    content: "The Christian life was never designed to be lived in isolation. The early church devoted themselves to fellowship, breaking bread together, and sharing everything they had (Acts 2:42-47). Ecclesiastes 4:9-10 reminds us that two are better than one. In community, we find strength, accountability, comfort, and growth. When one falls, the other lifts him up. The body of Christ is interconnected — when one part suffers, all suffer; when one is honored, all rejoice. If you are walking alone, consider the invitations God may be giving you to connect with His people. We need each other.",
    bookName: "Hebrews",
    chapter: 10,
    verseNumber: 24,
  },
  {
    title: "Hope That Anchors the Soul",
    content: "Hebrews 6:19 describes hope as 'an anchor for the soul, firm and secure.' In the storms of life, hope keeps us steady. But biblical hope is not wishful thinking — it is confident expectation based on God's promises. As the saying goes, 'Hope is not a strategy' in human terms, but in God's economy, hope is everything. It is the confident assurance that what God has promised, He will fulfill. When everything around you is unstable, hope in God is the anchor that holds. Where do you need to shift from wishful thinking to anchored, biblical hope today?",
    bookName: "Hebrews",
    chapter: 6,
    verseNumber: 19,
  },
  {
    title: "The Grace of Forgiveness",
    content: "Forgiveness is one of the most difficult and most freeing commands of Scripture. Colossians 3:13 instructs us to 'forgive one another, just as the Lord forgave you.' The measure of our forgiveness is not the offense against us but the grace we have received. Unforgiveness is like drinking poison and expecting the other person to die. It imprisons us in the past and blocks the flow of God's grace in our lives. Forgiveness does not mean forgetting or excusing wrongdoing; it means releasing the debt and trusting God with the justice. Today, ask God for the grace to forgive as you have been forgiven.",
    bookName: "Colossians",
    chapter: 3,
    verseNumber: 13,
  },
];

const today = new Date();
today.setHours(0, 0, 0, 0);

try {
  // Find a user for createdBy — prefer admin, fallback to first user
  let admin = await prisma.systemUser.findFirst({
    where: { userRole: 1n },
    orderBy: { createdOn: "asc" },
    select: { id: true },
  });
  if (!admin) {
    admin = await prisma.systemUser.findFirst({
      orderBy: { createdOn: "asc" },
      select: { id: true },
    });
  }

  for (const [index, entry] of devotions.entries()) {
    const displayDate = new Date(today);
    displayDate.setDate(today.getDate() + index);

    const existing = await prisma.dailyDevotion.findFirst({
      where: { title: entry.title },
    });

    const payload = {
      title: entry.title,
      content: entry.content,
      bookName: entry.bookName,
      chapter: BigInt(entry.chapter),
      verseNumber: BigInt(entry.verseNumber),
      displayDate,
      isPublished: true,
      createdBy: admin?.id ?? "system",
      updatedBy: admin?.id ?? null,
    };

    if (existing) {
      await prisma.dailyDevotion.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.dailyDevotion.create({ data: payload });
    }
  }

  console.log(`✅ Seeded ${devotions.length} daily devotions.`);
} finally {
  await prisma.$disconnect();
}
