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

/**
 * Enriched daily verse entries. Each carries the full exegesis content the
 * Daily Verse screen renders (verse intro, explanation, application,
 * background, word studies, practical applications, insights, cross refs,
 * final thoughts, takeaways). Arrays are stored as JSON strings.
 */
const dailyVerses = [
  {
    bookName: "Acts",
    chapter: 16,
    verseNumber: 10,
    bibleVersion: "NKJV",
    displayDate: dateAtMidnight(0),
    verseText:
      "Now after he had seen the vision, immediately we sought to go to Macedonia, concluding that the Lord had called us to preach the gospel to them.",
    explanation:
      "This verse records the immediate and unified response to God's revealed will. After Paul receives the Macedonian vision, there is no delay, debate, or hesitation. Luke shifts the narrative to 'we', indicating that the entire missionary team is in agreement. They carefully conclude that the vision is from the Lord, showing discernment rather than impulsiveness. The call is not merely to travel, but to preach the gospel, confirming that mission, not movement, is the priority. Luke emphasizes that divine guidance requires both spiritual clarity and obedient action. This verse highlights how God's call produces unity, urgency, and purpose when it is rightly understood.",
    application:
      "When God's will becomes clear, believers should respond with obedience and unity. Delayed obedience often weakens the impact of God's direction.",
    verseIntroduction:
      "Acts 16:10 demonstrates how revelation leads to responsibility. God's guidance demands a response, and faithful servants act decisively once His will is confirmed.",
    backgroundAuthor:
      "Luke writes Acts as both a historian and eyewitness, evident in his use of 'we', showing his direct involvement in the mission.",
    backgroundBook:
      "The Book of Acts traces the spread of the gospel through Spirit-led obedience, highlighting missionary expansion and unity.",
    backgroundContext:
      "This verse follows the Macedonian vision at Troas during Paul's second missionary journey. It marks the gospel's first intentional move into Europe, initiated by divine calling rather than human planning.",
    wordStudies: [
      { word: "Immediately", strongs: "eutheōs – Strong's G2112", definition: "Means at once, instantly, or without delay. This word emphasizes prompt obedience and quick response to God's direction." },
      { word: "Sought", strongs: "zēteō – Strong's G2212", definition: "Means to seek, pursue, desire, or search earnestly. It implies active effort to follow God's will." },
      { word: "Concluding", strongs: "symbibazō – Strong's G4822", definition: "Means to bring together, reason out, or arrive at an understanding. It reflects thoughtful spiritual discernment guided by God." },
      { word: "Called", strongs: "proskaleō – Strong's G4341", definition: "Means to summon, invite, or call near. It highlights God's initiative in directing His servants toward His purposes." },
      { word: "Preach the gospel", strongs: "euangelizō – Strong's G2097", definition: "Means to proclaim, announce, or share the good news. It emphasizes the church's mission of declaring salvation in Jesus Christ." },
    ],
    practicalApplications: [
      "Respond promptly when God's direction is confirmed.",
      "Practice discernment before acting on spiritual experiences.",
      "Walk in unity with other believers when pursuing God's call.",
      "Keep the gospel central in every mission and decision.",
      "Trust that God opens new fields when His timing is right.",
    ],
    keyThemes: [
      "Immediate obedience",
      "Discernment and unity",
      "Divine calling",
      "Missionary urgency",
      "Gospel proclamation",
    ],
    crossReferences: [
      "Acts 13:2–3 – The Spirit calls and sends.",
      "James 1:22 – Be doers of the word.",
      "Romans 10:15 – Sent to preach the gospel.",
      "Isaiah 6:8 – The willing response to God's call.",
    ],
    finalThoughts:
      "Acts 16:10 shows that God's guidance is meant to be acted upon. When revelation is met with obedience, the gospel advances powerfully into new territory.",
    takeaways: [
      "God expects prompt obedience to clear direction.",
      "Discernment confirms divine calling.",
      "Unity strengthens the mission of the gospel.",
    ],
  },
  {
    bookName: "John",
    chapter: 3,
    verseNumber: 16,
    bibleVersion: "NKJV",
    displayDate: dateAtMidnight(1),
    verseText:
      "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.",
    explanation:
      "Often called 'the Gospel in a nutshell,' this verse summarizes the entire message of salvation. It reveals God's motive: love — not an abstract attribute but a self-giving, sacrificial love that takes the initiative before any human response. The scope of this love is universal: 'the world,' meaning all humanity without distinction. The gift of God's 'only begotten Son' shows the immeasurable cost of redemption. Faith is the single condition for receiving eternal life — not works, not heritage, not religious observance. Jesus here establishes the divine initiative in salvation while still affirming human responsibility to believe.",
    application:
      "Receive this gift by faith rather than by effort, and let that same self-giving love flow through you toward someone else today.",
    verseIntroduction:
      "John 3:16 reveals the heart of the gospel: a love that moves God to give, and a faith that opens the door to eternal life. It is both a declaration and an invitation.",
    backgroundAuthor:
      "The apostle John wrote his Gospel so that his readers might believe that Jesus is the Christ and, by believing, have life in His name (John 20:31).",
    backgroundBook:
      "The Gospel of John emphasizes the deity of Christ and the new birth, leading every reader to faith as the avenue of eternal life.",
    backgroundContext:
      "Jesus speaks these words in His conversation with Nicodemus, a teacher of Israel, explaining the necessity of rebirth and God's worldwide plan of salvation.",
    wordStudies: [
      { word: "Loved", strongs: "agapaō – Strong's G25", definition: "To love in a selfless, willful manner — love founded on choice and sacrifice rather than on emotion." },
      { word: "World", strongs: "kosmos – Strong's G2889", definition: "The created order and all humanity, seen here as the object of God's saving love." },
      { word: "Gave", strongs: "didōmi – Strong's G1325", definition: "To give freely as a gift; God gave His Son without compulsion or reservation." },
      { word: "Only begotten", strongs: "monogenēs – Strong's G3439", definition: "Only, unique, one-of-a-kind; it stresses the unique sonship of Christ." },
      { word: "Believes", strongs: "pisteuō – Strong's G4100", definition: "To trust, rely upon, and fully commit to a person." },
      { word: "Perish", strongs: "apollumi – Strong's G622", definition: "To be fully destroyed or eternally lost — the opposite of eternal life." },
      { word: "Everlasting life", strongs: "aionios zōē – Strong's G166/G2222", definition: "The life of abiding, eternal quality — the very life of God shared with believers." },
    ],
    practicalApplications: [
      "Receive the gift of salvation by faith, not by earning it.",
      "Marvel daily at the cost God was willing to pay for love.",
      "Stop living as if salvation depends on your performance.",
      "Show one selfless act of love toward someone today.",
      "Tell someone before the day ends that God loves the whole world.",
    ],
    keyThemes: [
      "God's sacrificial love",
      "The gift of the Son",
      "Faith as the way to life",
      "Salvation intended for the whole world",
      "Grace that precedes every work",
    ],
    crossReferences: [
      "John 1:12 – Believing grants the right to become children of God.",
      "Romans 5:8 – God shows His love in that Christ died for us.",
      "Ephesians 2:8–9 – Saved by grace through faith, not works.",
      "1 John 4:9–10 – Love stands revealed in the gift of the Son.",
    ],
    finalThoughts:
      "God's love is not a distant sentiment but a costly, given gift. Faith is not mere agreement but the humble 'yes' that opens the door to life.",
    takeaways: [
      "Salvation originates in God's love.",
      "Eternal life is received through trusting Christ.",
      "The scope of God's love is the whole world.",
    ],
  },
  {
    bookName: "Romans",
    chapter: 8,
    verseNumber: 28,
    bibleVersion: "NKJV",
    displayDate: dateAtMidnight(2),
    verseText:
      "And we know that all things work together for good to those who love God, to those who are the called according to His purpose.",
    explanation:
      "This verse is among the most encouraging promises in all of Scripture. The promise that 'all things work together for good' assures us that God, in His sovereignty, weaves even the hardest circumstances into His redemptive plan. The 'good' is not personal comfort but conformity to Christ — the good that God is producing in His people. This verse does not promise that everything will follow our preferences, only that God will use all things to conform us to His Son. And it is not a promise to everyone: it is addressed to 'those who love God, to those who are the called according to His purpose.'",
    application:
      "When life is confusing, you do not need to see the whole pattern to trust the Weaver. Hold to Christlikeness as the good God is producing in your story.",
    verseIntroduction:
      "Romans 8:28 anchors hope in a certainty we can know: God's providence runs beneath every detail, turning all things toward the shape of Christ in His people.",
    backgroundAuthor:
      "Paul, the apostle to the Gentiles, wrote this epistle to set forth the gospel of God and the security granted to all whom God has called.",
    backgroundBook:
      "Romans unfolds the message of righteousness from God, climaxing in chapters of assurance: nothing can separate us from God's love.",
    backgroundContext:
      "This promise crowns the Spirit's chapter, contrasting the weakness of the flesh with the purpose of God, who predestined believers to be conformed to Christ.",
    wordStudies: [
      { word: "Know", strongs: "oida – Strong's G1492", definition: "To know with certainty, as a settled and clear grasp of truth rather than mere opinion." },
      { word: "All things", strongs: "panta – Strong's G3956", definition: "The whole span of a believer's life — joyful and painful, triumphant and hard." },
      { word: "Work together", strongs: "synergeō – Strong's G4903", definition: "To cooperate toward a common result, moving jointly toward one end." },
      { word: "Good", strongs: "agathos – Strong's G18", definition: "That which is good and beneficial; here the ultimate good is likeness to Christ." },
      { word: "Called", strongs: "klētos – Strong's G2822", definition: "Invited and appointed by God; a calling that carries divine purpose." },
      { word: "Purpose", strongs: "prothesis – Strong's G4286", definition: "A purpose laid down beforehand — God's deliberate plan." },
    ],
    practicalApplications: [
      "Rehearse this promise when events appear meaningless — the pattern is not the purpose.",
      "Ask not only why a hardship happened, but what God may be shaping.",
      "Pray that affliction conforms you to Christ rather than hardens you.",
      "Trust God's end rather than the trend of the day.",
      "Serve others from the certainty that your life is being worked toward good.",
    ],
    keyThemes: [
      "Anchored certainty in God",
      "Sovereign providence",
      "Divine calling and purpose",
      "Conformity to Christ as the 'good'",
      "Love that is the mark of the called",
    ],
    crossReferences: [
      "Genesis 50:20 – What was meant for evil, God used for good.",
      "Romans 8:29 – Predestined to be conformed to the likeness of the Son.",
      "Ephesians 1:11 – He works all things to the counsel of His will.",
      "2 Corinthians 4:17 – Our light affliction works an eternal weight of glory.",
    ],
    finalThoughts:
      "We never need the full picture, for we know the One who holds it. Because God is sovereign and active, everything is being fitted together toward Christ.",
    takeaways: [
      "God works even painful parts together toward good.",
      "The ultimate good God intends is Christlikeness in us.",
      "This promise belongs to those called according to His purpose.",
    ],
  },
  {
    bookName: "Proverbs",
    chapter: 3,
    verseNumber: 5,
    bibleVersion: "NKJV",
    displayDate: dateAtMidnight(3),
    verseText: "Trust in the LORD with all your heart, And lean not on your own understanding.",
    explanation:
      "This wisdom saying strikes at the heart of self-life. To 'trust in the LORD with all your heart' means to place complete reliance on God's character, promises, and sovereignty rather than on our limited, shifting understanding. In Hebrew thought the heart is the whole inner person — mind, will, emotions, and motives. To trust 'with all your heart' means no compartment is kept for ourselves. The contrast is foundational: our own understanding is finite, while the LORD's knowledge is perfect. The wise choose to lean on God's all-seeing wisdom rather than rest on the partial sight of human reasoning.",
    application:
      "Begin each uncertain step by handing the decision to God. Do not rely only on what you currently see — rely on the One who sees it all.",
    verseIntroduction:
      "The path of wisdom is opened not by accumulating our own reason, but by surrendering our reasoning to the LORD, who knows the whole road.",
    backgroundAuthor:
      "Solomon, the wise king of Israel, composed these proverbs to guide a life of wisdom in the fear of the LORD.",
    backgroundBook:
      "Proverbs grounds daily decision-making in the fear of the LORD, contrasting the way of the wise with the way of the fool.",
    backgroundContext:
      "This verse opens a series of counsel on trusting God in wealth and daily life; it is the foundation for walking the path of wisdom.",
    wordStudies: [
      { word: "Trust", strongs: "bāṭach – Strong's H982", definition: "To put confident reliance upon, to feel safe in, to lean the whole weight of the heart on." },
      { word: "Heart", strongs: "lēb – Strong's H3820", definition: "The inner man — mind, will, and emotions; the whole of the hidden person." },
      { word: "Lean", strongs: "shāʿan – Strong's H8172", definition: "To rest upon, to support oneself as on a staff; to transfer one's weight." },
      { word: "Understanding", strongs: "bînā – Strong's H998", definition: "Insight, discernment, comprehension — the limited reach of human thinking." },
    ],
    practicalApplications: [
      "Place today's decisions under prayer before you move.",
      "Choose the Word's path over the short-term pull of your own reasoning.",
      "When anxious, turn the will — not just the situation — over to God.",
      "Thank God for leading even when the way is not yet obvious.",
      "Confess the tendency to lean on your own wisdom, and learn afresh to trust.",
    ],
    keyThemes: [
      "Whole-hearted trust",
      "Humility over self-sufficiency",
      "God's direction over human insight",
      "The daily discipline of reliance",
    ],
    crossReferences: [
      "Proverbs 3:7 – Fear the LORD and turn away from evil.",
      "Psalm 37:5 – Commit your way to the LORD.",
      "Jeremiah 17:7–8 – Blessed is the one who trusts in the LORD.",
      "Isaiah 55:9 – As the heavens are higher than the earth, so are His ways.",
    ],
    finalThoughts:
      "Faith places the whole of life into the LORD's hands. The way that seems wisest to human eyes becomes, under His care, the road of true wisdom.",
    takeaways: [
      "Trust is a decision of the whole heart, not the margin of life.",
      "Human understanding is partial; God's wisdom is perfect.",
      "Dependence on God is the beginning of the wise path.",
    ],
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 13,
    bibleVersion: "NKJV",
    displayDate: dateAtMidnight(4),
    verseText: "I can do all things through Christ who strengthens me.",
    explanation:
      "'I can do all things' is not the boast of a limitless self, but the confidence of a limited self resting in an all-sufficient Christ. Paul writes from prison, having learned contentment in every situation — in lack and in plenty. What he has is not a promise of effortless success, but the enabling of Christ for every circumstance God assigns: faithfulness, endurance, and contentment. This verse does not grant every worldly ambition; it assures strength for every point of the disciple's walk, mission, and obedience.",
    application:
      "Whatever God has set before you today — scarcity, an unsung task, or a burden — ask for the strength He gives; it is yours in Christ.",
    verseIntroduction:
      "This verse is the secret of kingdom contentment: Christ is not only the destination, He is the enabling by which we live each circumstance for His glory.",
    backgroundAuthor:
      "Paul wrote this letter from prison chains, yet it is his most joyful epistle — joy rooted not in circumstances but in Christ.",
    backgroundBook:
      "Philippians is the epistle of joy; satisfaction is found in union with Christ regardless of outward condition.",
    backgroundContext:
      "Philippians 4:13 summarizes Paul's learned secret — contentment in every condition through the strength of Christ.",
    wordStudies: [
      { word: "All things", strongs: "panta – Strong's G3956", definition: "Every circumstance that God's will requires — abundance, need, service, suffering." },
      { word: "Christ", strongs: "Christos – Strong's G5547", definition: "The Anointed One, the source of the believer's life and strength." },
      { word: "Strengthens", strongs: "endunamoō – Strong's G1743", definition: "To empower, to infuse with strength; the enabling that comes from Christ." },
    ],
    practicalApplications: [
      "Devote today's labor — however ordinary — to Christ's enabling.",
      "Do not seek strength in self-discipline alone; draw from the risen Christ.",
      "In a season of plenty, keep the posture of humble dependence.",
      "In a season of lack, remember His grace is sufficient.",
      "Live the mission God assigned, trusting His strength for each step.",
    ],
    keyThemes: [
      "Christ as the source of strength",
      "Contentment learned",
      "Endurance in dependence",
      "Everyday grace for everyday obedience",
    ],
    crossReferences: [
      "Philippians 4:12 – I know how to be abased, and I know how to abound.",
      "2 Corinthians 12:9 – My grace is sufficient; my strength is perfected in weakness.",
      "Ephesians 3:16 – Strengthened with power through His Spirit.",
      "Psalm 28:8 – The LORD is the strength of His people.",
    ],
    finalThoughts:
      "Strength does not come from the absence of difficulty but from the presence of Christ. What He calls you into, He strengthens you for.",
    takeaways: [
      "The 'all things' is every circumstance, not every desire.",
      "Strength is not self-made but Christ-bestowed.",
      "Contentment is found in Christ in whatever place you stand.",
    ],
  },
  {
    bookName: "Psalms",
    chapter: 23,
    verseNumber: 1,
    bibleVersion: "NKJV",
    displayDate: dateAtMidnight(5),
    verseText: "The LORD is my shepherd; I shall not want.",
    explanation:
      "This beloved opening verse presents the LORD as the Shepherd who tends His sheep with personal, watchful care. The name 'LORD' (Yahweh) recalls the covenant-keeping God; 'my shepherd' speaks of an intimate relationship; 'I shall not want' expresses complete trust. The verse does not promise the absence of need but the sufficiency of the Shepherd: those who belong to Him lack nothing that is right and good for life. This image finds its fulfillment in Christ, the good Shepherd who lays down His life for the sheep.",
    application:
      "Bring your anxiety over provision to the Shepherd. Receive all that is needful from His care, and trust the faithfulness of the flock under His hand.",
    verseIntroduction:
      "Psalm 23:1 is the summary of a shepherded life: the reality of a personal Shepherd, and the promise that His flock is never left in want.",
    backgroundAuthor:
      "David — shepherd, warrior, and king — writes from the language of a shepherd's life, drawing the metaphor from his own years of tending sheep.",
    backgroundBook:
      "The Psalms are the prayer book of God's people, giving voice to trust and worship across every season of life.",
    backgroundContext:
      "This verse opens the psalm that celebrates the LORD's guidance, provision, and protection across the whole of a believer's journey.",
    wordStudies: [
      { word: "LORD", strongs: "Yahweh – Strong's H3068", definition: "The covenant name of God; the eternal, self-existent, faithful I AM of Israel." },
      { word: "Shepherd", strongs: "rāʿāh – Strong's H7462", definition: "To feed, lead, guard, and care for the flock; the watchful care of the shepherd." },
      { word: "Want", strongs: "ḥāsēr – Strong's H2637", definition: "To fail, to lack, to be in need; under such a Shepherd nothing essential is missing." },
    ],
    practicalApplications: [
      "Lay today's needs — provision, guidance, protection — before the Shepherd.",
      "See the guardian hand of God in the ordinary routines of the day.",
      "Do not let anxiety over lack lead you away from the flock.",
      "Measure your fears against the faithfulness of the Shepherd.",
      "Rest in the Shepherd's presence, and fear no lasting want.",
    ],
    keyThemes: [
      "The LORD as personal Shepherd",
      "Fully sufficient provision",
      "Rest and security in His care",
      "Belonging to the flock of God",
    ],
    crossReferences: [
      "John 10:11 – The good Shepherd lays down His life for the sheep.",
      "Psalm 100:3 – The LORD is God; we are His people, the sheep of His pasture.",
      "Isaiah 40:11 – He gathers the lambs and leads those with young.",
      "1 Peter 2:25 – Christ is the Shepherd and Overseer of your souls.",
    ],
    finalThoughts:
      "When the LORD is your Shepherd, there is no lasting want. His care covers every path, so the heart can rest in His sufficient hand.",
    takeaways: [
      "A personal Shepherd means nothing essential is missing.",
      "Provision is found in His care, not in our own striving.",
      "The joy of the sheep is to have the Shepherd.",
    ],
  },
  {
    bookName: "Jeremiah",
    chapter: 29,
    verseNumber: 11,
    bibleVersion: "NKJV",
    displayDate: dateAtMidnight(6),
    verseText:
      "For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.",
    explanation:
      "Jeremiah wrote to the exiles in Babylon who had assumed their hope was over. Against false prophets promising an immediate return, the LORD declares through the prophet that His thoughts toward His people are thoughts of peace — not of evil — and that He has a future and a hope for them. This is not a blanket promise of trouble-free days but a covenant assurance: even within the seventy years of exile, God's plan is one of preservation and restoration. It reframes the present difficulty as a chapter, not the final word, and anchors hope in the faithfulness of God.",
    application:
      "While you wait through seasons that feel like exile, trust the One with an eternal plan. Your purpose today lies within His hands, and the future He has for you is real.",
    verseIntroduction:
      "This is not a promise of immediate relief but a promise of a good future to a people God has not abandoned — hope that holds in the heart of exile.",
    backgroundAuthor:
      "Jeremiah, called the weeping prophet, spoke God's word of judgment while also holding out the promise of restoration.",
    backgroundBook:
      "The Book of Jeremiah records the prophetic call to repentance and the promise of restoration that follows judgment.",
    backgroundContext:
      "These words come from a letter to the Jews already deported to Babylon, urging them to settle, pray, and trust God's long-term plan of restoration.",
    wordStudies: [
      { word: "Know", strongs: "yādaʿ – Strong's H3045", definition: "To know intimately and with certainty; here, the full knowledge of God's sovereign purpose." },
      { word: "Thoughts (plans)", strongs: "machashabah – Strong's H4284", definition: "Plans, devices, intentions — the deliberate designs of a purposeful mind." },
      { word: "Peace", strongs: "shalom – Strong's H7965", definition: "Wholeness, welfare, security, prosperity — the all-round wellbeing God intends." },
      { word: "Future and hope", strongs: "ʾaḥărît wĕtiqwâ – Strong's H319/H8615", definition: "A latter end and an expectation — a real, anticipated future to come." },
    ],
    practicalApplications: [
      "When the present season is hard, keep living as one with a future in God's hand.",
      "Do not turn the promise of peace into a demand for ease.",
      "Live in the long view of God's promises amid the short view of the day.",
      "Let a God-given future set the direction of today's choices.",
      "Speak hope — the LORD holds the future.",
    ],
    keyThemes: [
      "God's faithful plans",
      "The sovereign mercy of God",
      "Hope in the midst of judgment",
      "A God-kept future and hope",
    ],
    crossReferences: [
      "Jeremiah 29:13 – You will seek Me and find Me, when you search with all your heart.",
      "Lamentations 3:22–23 – His mercies are new every morning.",
      "Psalm 30:5 – Weeping endures for a night, but joy comes in the morning.",
      "Romans 8:28 – All things work together for good to those called by God.",
    ],
    finalThoughts:
      "What shapes our peace is not being spared exile, but being sustained by the LORD who has already written the end. His thoughts toward us lean toward peace, not calamity.",
    takeaways: [
      "God's plan for His people is a future of hope.",
      "His thoughts toward you are peace, not evil.",
      "Whatever looks like an end is a chapter on the way to a future.",
    ],
  },
];

const main = async () => {
  console.log("🌱 Enhancing daily verses (today + 6 weekdays)...\n");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const verse of dailyVerses) {
    const label = verse.displayDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    try {
      const adminUserId = await getAdminUserId();
      const data = {
        bookName: verse.bookName,
        chapter: BigInt(verse.chapter),
        verseNumber: BigInt(verse.verseNumber),
        bibleVersion: verse.bibleVersion,
        displayDate: verse.displayDate,
        reflection: verse.verseText,
        explanation: verse.explanation,
        learnMore: verse.verseText,
        application: verse.application,
        verseIntroduction: verse.verseIntroduction,
        backgroundAuthor: verse.backgroundAuthor,
        backgroundBook: verse.backgroundBook,
        backgroundContext: verse.backgroundContext,
        wordStudies: JSON.stringify(verse.wordStudies),
        practicalApplications: JSON.stringify(verse.practicalApplications),
        keyThemes: JSON.stringify(verse.keyThemes),
        crossReferences: JSON.stringify(verse.crossReferences),
        finalThoughts: verse.finalThoughts,
        takeaways: JSON.stringify(verse.takeaways),
        isPublished: true,
        createdBy: adminUserId,
      };

      const existing = await prisma.dailyVerse.findFirst({
        where: { displayDate: verse.displayDate },
      });

      if (existing) {
        await prisma.dailyVerse.update({ where: { id: existing.id }, data });
        console.log(`  ↻ ${label}: ${verse.bookName} ${verse.chapter}:${verse.verseNumber} — updated`);
        updated++;
      } else {
        await prisma.dailyVerse.create({ data });
        console.log(`  ✅ ${label}: ${verse.bookName} ${verse.chapter}:${verse.verseNumber} — created`);
        created++;
      }
    } catch (error) {
      console.error(`  ❌ ${verse.bookName} ${verse.chapter}:${verse.verseNumber} — ${error.message}`);
      skipped++;
    }
  }

  const total = await prisma.dailyVerse.count({ where: { isPublished: true } });
  console.log("\n" + "═".repeat(50));
  console.log("📊 Seed Summary:");
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
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