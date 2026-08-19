/**
 * enrich-daily-verses.js
 *
 * Run this script to ensure daily verses are fully populated and
 * start from today going forward. It will:
 *   1. Delete all past-date dailyVerses (before today)
 *   2. Enrich any existing verses missing rich fields
 *   3. Create fully-populated verses for every day from today through
 *      3 weeks out (21 days) that doesn't already have one
 *
 * Run:  node prisma/enrich-daily-verses.js
 */
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

// ─── Rich content library (keyed by bookName|chapter|verseNumber) ───────────
const verseLibrary = [
  {
    bookName: "Acts", chapter: 16, verseNumber: 10, bibleVersion: "NKJ",
    verseText: "Now after he had seen the vision, immediately we sought to go to Macedonia, concluding that the Lord had called us to preach the gospel to them.",
    explanation: "This verse records the immediate and unified response to God's revealed will. After Paul receives the Macedonian vision, there is no delay, debate, or hesitation. Luke shifts the narrative to 'we', indicating that the entire missionary team is in agreement. They carefully conclude that the vision is from the Lord, showing discernment rather than impulsiveness. The call is not merely to travel, but to preach the gospel, confirming that mission, not movement, is the priority.",
    application: "When God's will becomes clear, believers should respond with obedience and unity. Delayed obedience often weakens the impact of God's direction.",
    verseIntroduction: "Acts 16:10 demonstrates how revelation leads to responsibility. God's guidance demands a response, and faithful servants act decisively once His will is confirmed.",
    backgroundAuthor: "Luke writes Acts as both a historian and eyewitness, evident in his use of 'we', showing his direct involvement in the mission.",
    backgroundBook: "The Book of Acts traces the spread of the gospel through Spirit-led obedience, highlighting missionary expansion and unity.",
    backgroundContext: "This verse follows the Macedonian vision at Troas during Paul's second missionary journey. It marks the gospel's first intentional move into Europe.",
    wordStudies: JSON.stringify([{ word: "Immediately", strongs: "eutheōs – Strong's G2112", definition: "Means at once, instantly, or without delay." }, { word: "Sought", strongs: "zēteō – Strong's G2212", definition: "Means to seek, pursue, desire, or search earnestly." }, { word: "Concluding", strongs: "symbibazō – Strong's G4822", definition: "Means to bring together, reason out, or arrive at an understanding." }, { word: "Called", strongs: "proskaleō – Strong's G4341", definition: "Means to summon, invite, or call near." }, { word: "Preach the gospel", strongs: "euangelizō – Strong's G2097", definition: "Means to proclaim, announce, or share the good news." }]),
    practicalApplications: JSON.stringify(["Respond promptly when God's direction is confirmed.", "Practice discernment before acting on spiritual experiences.", "Walk in unity with other believers when pursuing God's call.", "Keep the gospel central in every mission and decision.", "Trust that God opens new fields when His timing is right."]),
    keyThemes: JSON.stringify(["Immediate obedience", "Discernment and unity", "Divine calling", "Missionary urgency", "Gospel proclamation"]),
    crossReferences: JSON.stringify(["Acts 13:2–3 – The Spirit calls and sends.", "James 1:22 – Be doers of the word.", "Romans 10:15 – Sent to preach the gospel.", "Isaiah 6:8 – The willing response to God's call."]),
    finalThoughts: "Acts 16:10 shows that God's guidance is meant to be acted upon. When revelation is met with obedience, the gospel advances powerfully into new territory.",
    takeaways: JSON.stringify(["God expects prompt obedience to clear direction.", "Discernment confirms divine calling.", "Unity strengthens the mission of the gospel."]),
  },
  {
    bookName: "John", chapter: 3, verseNumber: 16, bibleVersion: "NKJ",
    verseText: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.",
    explanation: "Often called 'the Gospel in a nutshell,' this verse summarizes the entire message of salvation. It reveals God's motive: love — not an abstract attribute but a self-giving, sacrificial love that takes the initiative before any human response. The scope of this love is universal: 'the world,' meaning all humanity without distinction.",
    application: "Receive this gift by faith rather than by effort, and let that same self-giving love flow through you toward someone else today.",
    verseIntroduction: "John 3:16 reveals the heart of the gospel: a love that moves God to give, and a faith that opens the door to eternal life.",
    backgroundAuthor: "The apostle John wrote his Gospel so that his readers might believe that Jesus is the Christ and, by believing, have life in His name.",
    backgroundBook: "The Gospel of John emphasizes the deity of Christ and the new birth, leading every reader to faith as the avenue of eternal life.",
    backgroundContext: "Jesus speaks these words in His conversation with Nicodemus, a teacher of Israel, explaining the necessity of rebirth.",
    wordStudies: JSON.stringify([{ word: "Loved", strongs: "agapaō – Strong's G25", definition: "To love in a selfless, willful manner." }, { word: "World", strongs: "kosmos – Strong's G2889", definition: "The created order and all humanity." }, { word: "Gave", strongs: "didōmi – Strong's G1325", definition: "To give freely as a gift." }, { word: "Only begotten", strongs: "monogenēs – Strong's G3439", definition: "Only, unique, one-of-a-kind." }, { word: "Believes", strongs: "pisteuō – Strong's G4100", definition: "To trust, rely upon, and fully commit to a person." }]),
    practicalApplications: JSON.stringify(["Receive the gift of salvation by faith, not by earning it.", "Marvel daily at the cost God was willing to pay for love.", "Stop living as if salvation depends on your performance.", "Show one selfless act of love toward someone today.", "Tell someone before the day ends that God loves the whole world."]),
    keyThemes: JSON.stringify(["God's sacrificial love", "The gift of the Son", "Faith as the way to life", "Salvation intended for the whole world", "Grace that precedes every work"]),
    crossReferences: JSON.stringify(["John 1:12 – Believing grants the right to become children of God.", "Romans 5:8 – God shows His love in that Christ died for us.", "Ephesians 2:8–9 – Saved by grace through faith, not works.", "1 John 4:9–10 – Love stands revealed in the gift of the Son."]),
    finalThoughts: "God's love is not a distant sentiment but a costly, given gift. Faith is not mere agreement but the humble 'yes' that opens the door to life.",
    takeaways: JSON.stringify(["Salvation originates in God's love.", "Eternal life is received through trusting Christ.", "The scope of God's love is the whole world."]),
  },
  {
    bookName: "Romans", chapter: 8, verseNumber: 28, bibleVersion: "NKJ",
    verseText: "And we know that all things work together for good to those who love God, to those who are the called according to His purpose.",
    explanation: "This verse is among the most encouraging promises in all of Scripture. The promise that 'all things work together for good' assures us that God, in His sovereignty, weaves even the hardest circumstances into His redemptive plan.",
    application: "When life is confusing, you do not need to see the whole pattern to trust the Weaver. Hold to Christlikeness as the good God is producing in your story.",
    verseIntroduction: "Romans 8:28 anchors hope in a certainty we can know: God's providence runs beneath every detail, turning all things toward the shape of Christ in His people.",
    backgroundAuthor: "Paul, the apostle to the Gentiles, wrote this epistle to set forth the gospel of God and the security granted to all whom God has called.",
    backgroundBook: "Romans unfolds the message of righteousness from God, climaxing in chapters of assurance.",
    backgroundContext: "This promise crowns the Spirit's chapter, contrasting the weakness of the flesh with the purpose of God.",
    wordStudies: JSON.stringify([{ word: "Know", strongs: "oida – Strong's G1492", definition: "To know with certainty." }, { word: "All things", strongs: "panta – Strong's G3956", definition: "The whole span of a believer's life." }, { word: "Work together", strongs: "synergeō – Strong's G4903", definition: "To cooperate toward a common result." }, { word: "Called", strongs: "klētos – Strong's G2822", definition: "Invited and appointed by God." }, { word: "Purpose", strongs: "prothesis – Strong's G4286", definition: "A purpose laid down beforehand." }]),
    practicalApplications: JSON.stringify(["Rehearse this promise when events appear meaningless.", "Ask not only why a hardship happened, but what God may be shaping.", "Pray that affliction conforms you to Christ rather than hardens you.", "Trust God's end rather than the trend of the day.", "Serve others from the certainty that your life is being worked toward good."]),
    keyThemes: JSON.stringify(["Anchored certainty in God", "Sovereign providence", "Divine calling and purpose", "Conformity to Christ as the 'good'"]),
    crossReferences: JSON.stringify(["Genesis 50:20 – What was meant for evil, God used for good.", "Romans 8:29 – Predestined to be conformed to the likeness of the Son.", "Ephesians 1:11 – God works all things according to the counsel of His will.", "2 Corinthians 4:17 – Our light affliction works an eternal weight of glory."]),
    finalThoughts: "The certainty of Romans 8:28 is not that every day will feel good, but that every day is being worked toward good.",
    takeaways: JSON.stringify(["God works all things toward His good purpose.", "The ultimate good is conformity to Christ.", "This promise belongs to those who love God and are called by Him."]),
  },
  {
    bookName: "Proverbs", chapter: 3, verseNumber: 5, bibleVersion: "NKJ",
    verseText: "Trust in the LORD with all your heart, And lean not on your own understanding.",
    explanation: "This wisdom saying strikes at the heart of self-life. To 'trust in the LORD with all your heart' means to place complete reliance on God's character, promises, and sovereignty rather than on our limited, shifting understanding.",
    application: "Begin each uncertain step by handing the decision to God. Do not rely only on what you currently see — rely on the One who sees it all.",
    verseIntroduction: "The path of wisdom is opened not by accumulating our own reason, but by surrendering our reasoning to the LORD, who knows the whole road.",
    backgroundAuthor: "Solomon, the wise king of Israel, composed these proverbs to guide a life of wisdom in the fear of the LORD.",
    backgroundBook: "Proverbs grounds daily decision-making in the fear of the LORD, contrasting the way of the wise with the way of the fool.",
    backgroundContext: "This verse opens a series of counsel on trusting God in wealth and daily life.",
    wordStudies: JSON.stringify([{ word: "Trust", strongs: "bāṭach – Strong's H982", definition: "To put confident reliance upon." }, { word: "Heart", strongs: "lēb – Strong's H3820", definition: "The inner man — mind, will, and emotions." }, { word: "Lean", strongs: "shāʿan – Strong's H8172", definition: "To rest upon, to support oneself as on a staff." }, { word: "Understanding", strongs: "bînā – Strong's H998", definition: "Insight, discernment, comprehension." }]),
    practicalApplications: JSON.stringify(["Place today's decisions under prayer before you move.", "Choose the Word's path over the short-term pull of your own reasoning.", "When anxious, turn the will over to God.", "Thank God for leading even when the way is not yet obvious.", "Confess the tendency to lean on your own wisdom."]),
    keyThemes: JSON.stringify(["Whole-hearted trust", "Humility over self-sufficiency", "God's direction over human insight", "The daily discipline of reliance"]),
    crossReferences: JSON.stringify(["Proverbs 3:7 – Fear the LORD and turn away from evil.", "Psalm 37:5 – Commit your way to the LORD.", "Jeremiah 17:7–8 – Blessed is the one who trusts in the LORD.", "Isaiah 55:9 – As the heavens are higher than the earth, so are His ways."]),
    finalThoughts: "Faith places the whole of life into the LORD's hands. The way that seems wisest to human eyes becomes, under His care, the road of true wisdom.",
    takeaways: JSON.stringify(["Trust is a decision of the whole heart, not the margin of life.", "Human understanding is partial; God's wisdom is perfect.", "Dependence on God is the beginning of the wise path."]),
  },
  {
    bookName: "Philippians", chapter: 4, verseNumber: 13, bibleVersion: "NKJ",
    verseText: "I can do all things through Christ who strengthens me.",
    explanation: "'I can do all things' is not the boast of a limitless self, but the confidence of a limited self resting in an all-sufficient Christ. Paul writes from prison, having learned contentment in every situation.",
    application: "Whatever God has set before you today — scarcity, an unsung task, or a burden — ask for the strength He gives; it is yours in Christ.",
    verseIntroduction: "This verse is the secret of kingdom contentment: Christ is not only the destination, He is the enabling by which we live each circumstance for His glory.",
    backgroundAuthor: "Paul wrote this letter from prison chains, yet it is his most joyful epistle.",
    backgroundBook: "Philippians is the epistle of joy; satisfaction is found in union with Christ regardless of outward condition.",
    backgroundContext: "Philippians 4:13 summarizes Paul's learned secret — contentment in every condition through the strength of Christ.",
    wordStudies: JSON.stringify([{ word: "All things", strongs: "panta – Strong's G3956", definition: "Every circumstance that God's will requires." }, { word: "Christ", strongs: "Christos – Strong's G5547", definition: "The Anointed One, the source of the believer's strength." }, { word: "Strengthens", strongs: "endunamoō – Strong's G1743", definition: "To empower, to infuse with strength." }]),
    practicalApplications: JSON.stringify(["Devote today's labor to Christ's enabling.", "Do not seek strength in self-discipline alone; draw from the risen Christ.", "In a season of plenty, keep the posture of humble dependence.", "In a season of lack, remember His grace is sufficient.", "Live the mission God assigned, trusting His strength for each step."]),
    keyThemes: JSON.stringify(["Christ as the source of strength", "Contentment learned", "Endurance in dependence", "Everyday grace for everyday obedience"]),
    crossReferences: JSON.stringify(["Philippians 4:12 – I know how to be abased, and I know how to abound.", "2 Corinthians 12:9 – My grace is sufficient.", "Ephesians 3:16 – Strengthened with power through His Spirit.", "Psalm 28:8 – The LORD is the strength of His people."]),
    finalThoughts: "Strength does not come from the absence of difficulty but from the presence of Christ.",
    takeaways: JSON.stringify(["The 'all things' is every circumstance, not every desire.", "Strength is not self-made but Christ-bestowed.", "Contentment is found in Christ in whatever place you stand."]),
  },
  {
    bookName: "Psalms", chapter: 23, verseNumber: 1, bibleVersion: "NKJ",
    verseText: "The LORD is my shepherd; I shall not want.",
    explanation: "This beloved opening verse presents the LORD as the Shepherd who tends His sheep with personal, watchful care. The name 'LORD' (Yahweh) recalls the covenant-keeping God; 'my shepherd' speaks of an intimate relationship; 'I shall not want' expresses complete trust.",
    application: "Bring your anxiety over provision to the Shepherd. Receive all that is needful from His care.",
    verseIntroduction: "Psalm 23:1 is the summary of a shepherded life: the reality of a personal Shepherd, and the promise that His flock is never left in want.",
    backgroundAuthor: "David — shepherd, warrior, and king — writes from the language of a shepherd's life.",
    backgroundBook: "The Psalms are the prayer book of God's people, giving voice to trust and worship across every season of life.",
    backgroundContext: "This verse opens the psalm that celebrates the LORD's guidance, provision, and protection.",
    wordStudies: JSON.stringify([{ word: "LORD", strongs: "Yahweh – Strong's H3068", definition: "The covenant name of God." }, { word: "Shepherd", strongs: "rāʿāh – Strong's H7462", definition: "To feed, lead, guard, and care for the flock." }, { word: "Want", strongs: "ḥāsēr – Strong's H2637", definition: "To fail, to lack, to be in need." }]),
    practicalApplications: JSON.stringify(["Lay today's needs before the Shepherd.", "See the guardian hand of God in the ordinary routines of the day.", "Do not let anxiety over lack lead you away from the flock.", "Measure your fears against the faithfulness of the Shepherd.", "Rest in the Shepherd's presence, and fear no lasting want."]),
    keyThemes: JSON.stringify(["The LORD as personal Shepherd", "Fully sufficient provision", "Rest and security in His care", "Belonging to the flock of God"]),
    crossReferences: JSON.stringify(["John 10:11 – The good Shepherd lays down His life for the sheep.", "Psalm 100:3 – We are His people, the sheep of His pasture.", "Isaiah 40:11 – He gathers the lambs and leads those with young.", "1 Peter 2:25 – Christ is the Shepherd and Overseer of your souls."]),
    finalThoughts: "When the LORD is your Shepherd, there is no lasting want.",
    takeaways: JSON.stringify(["A personal Shepherd means nothing essential is missing.", "Provision is found in His care, not in our own striving.", "The joy of the sheep is to have the Shepherd."]),
  },
  {
    bookName: "Jeremiah", chapter: 29, verseNumber: 11, bibleVersion: "NKJ",
    verseText: "For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.",
    explanation: "Jeremiah wrote to the exiles in Babylon who had assumed their hope was over. Against false prophets promising an immediate return, the LORD declares that His thoughts toward His people are thoughts of peace and that He has a future and a hope for them.",
    application: "While you wait through seasons that feel like exile, trust the One with an eternal plan.",
    verseIntroduction: "This is not a promise of immediate relief but a promise of a good future to a people God has not abandoned.",
    backgroundAuthor: "Jeremiah, called the weeping prophet, spoke God's word of judgment while also holding out the promise of restoration.",
    backgroundBook: "The Book of Jeremiah records the prophetic call to repentance and the promise of restoration.",
    backgroundContext: "These words come from a letter to the Jews already deported to Babylon, urging them to trust God's long-term plan.",
    wordStudies: JSON.stringify([{ word: "Know", strongs: "yādaʿ – Strong's H3045", definition: "To know intimately and with certainty." }, { word: "Thoughts (plans)", strongs: "machashabah – Strong's H4284", definition: "Plans, devices, intentions." }, { word: "Peace", strongs: "shalom – Strong's H7965", definition: "Wholeness, welfare, security, prosperity." }, { word: "Future and hope", strongs: "ʾaḥărît wĕtiqwâ – Strong's H319/H8615", definition: "A latter end and an expectation." }]),
    practicalApplications: JSON.stringify(["Keep living as one with a future in God's hand.", "Do not turn the promise of peace into a demand for ease.", "Live in the long view of God's promises.", "Let a God-given future set the direction of today's choices.", "Speak hope — the LORD holds the future."]),
    keyThemes: JSON.stringify(["God's faithful plans", "The sovereign mercy of God", "Hope in the midst of judgment", "A God-kept future and hope"]),
    crossReferences: JSON.stringify(["Jeremiah 29:13 – You will seek Me and find Me.", "Lamentations 3:22–23 – His mercies are new every morning.", "Psalm 30:5 – Weeping endures for a night, but joy comes in the morning.", "Romans 8:28 – All things work together for good."]),
    finalThoughts: "What shapes our peace is not being spared exile, but being sustained by the LORD who has already written the end.",
    takeaways: JSON.stringify(["God's plan for His people is a future of hope.", "His thoughts toward you are peace, not evil.", "Whatever looks like an end is a chapter on the way to a future."]),
  },
  {
    bookName: "John", chapter: 10, verseNumber: 10, bibleVersion: "NKJ",
    verseText: "The thief does not come except to steal, and to kill, and to destroy. I have come that they may have life, and that they may have it more abundantly.",
    explanation: "Jesus contrasts the thief with Himself, the Good Shepherd. The thief comes only to steal, kill, and destroy. Jesus states His own purpose with complete clarity: to give abundant life — the full, overflowing life of the kingdom.",
    application: "Test every voice by its effect on your life: does it steal, kill, and destroy, or does it point you to the abundant life Christ gives?",
    verseIntroduction: "John 10:10 draws the sharpest line in the chapter: the thief takes life; the Shepherd gives it — and gives it in overflowing abundance.",
    backgroundAuthor: "The apostle John wrote his Gospel so that readers might believe Jesus is the Christ and have life in His name.",
    backgroundBook: "The Gospel of John is built around life: Jesus is the Life, the Light, and the Resurrection.",
    backgroundContext: "This verse sits inside the Good Shepherd discourse, spoken after healing a man born blind.",
    wordStudies: JSON.stringify([{ word: "Thief", strongs: "kleptēs – Strong's G2812", definition: "One who steals secretly." }, { word: "Life", strongs: "zōē – Strong's G2222", definition: "Life in its fullest sense." }, { word: "More abundantly", strongs: "perissos – Strong's G4053", definition: "Exceeding, overflowing, beyond measure." }]),
    practicalApplications: JSON.stringify(["Reject the voices that promise gain but leave you empty.", "Receive the life Christ offers as today's reality.", "Measure your choices by whether they enlarge the life God gave you.", "Protect the flock: be a voice that builds up.", "Rest in the Shepherd's purpose — He is for you."]),
    keyThemes: JSON.stringify(["The thief vs. the Shepherd", "Abundant life in Christ", "The purpose of Jesus' coming", "Protection for the flock"]),
    crossReferences: JSON.stringify(["John 10:11 – The good Shepherd gives His life for the sheep.", "Psalm 23:1 – The LORD is my shepherd; I shall not want.", "John 14:6 – I am the way, the truth, and the life.", "Colossians 2:9–10 – You are complete in Him."]),
    finalThoughts: "The enemy's signature is subtraction; the Shepherd's signature is abundance.",
    takeaways: JSON.stringify(["Jesus came to give life, not to take it.", "Abundant life is found in the Shepherd.", "Test every influence by whether it brings life or takes it."]),
  },
  {
    bookName: "Psalms", chapter: 19, verseNumber: 14, bibleVersion: "NKJ",
    verseText: "Let the words of my mouth and the meditation of my heart be acceptable in Your sight, O LORD, my strength and my Redeemer.",
    explanation: "This closing verse of Psalm 19 turns worship into a prayer. David prays about the two things that most reveal a person: the words of the mouth and the meditation of the heart.",
    application: "Before you speak today, pause and ask: are these words acceptable to God?",
    verseIntroduction: "Psalm 19:14 is the worshiper's daily surrender: that every word and thought would find its home in the presence of God.",
    backgroundAuthor: "David, Israel's shepherd-king and psalmist, wrote from the deep well of personal experience with God.",
    backgroundBook: "The Psalms give language to the whole range of the believer's life before the living God.",
    backgroundContext: "This verse closes a psalm that moves from God's glory in the heavens to His perfection in the law.",
    wordStudies: JSON.stringify([{ word: "Words of my mouth", strongs: "ʾimrê-fî – Strong's H561", definition: "The uttered sayings of the lips." }, { word: "Meditation", strongs: "hegyôn – Strong's H1902", definition: "The inner murmur and musing of the heart." }, { word: "Acceptable", strongs: "rātsôn – Strong's H7522", definition: "Delight, pleasure, acceptance." }, { word: "Strength", strongs: "tsûr – Strong's H6697", definition: "Rock, crag, cliff — a firm refuge." }, { word: "Redeemer", strongs: "gāʾal – Strong's H1350", definition: "The kinsman-redeemer who sets the enslaved free." }]),
    practicalApplications: JSON.stringify(["Begin the day by offering your speech and thoughts to God.", "When tempted toward harsh words, pause and recall that God hears.", "Guard the quiet meditations of the heart.", "End the day with the same prayer you began it with.", "Remind yourself that God is your strength and Redeemer."]),
    keyThemes: JSON.stringify(["Speech and heart surrender", "Living before the sight of God", "God as strength and Redeemer", "Worship as the whole of life"]),
    crossReferences: JSON.stringify(["Psalm 51:15 – O Lord, open my lips.", "Psalm 141:3 – Set a guard, O LORD, over my mouth.", "Matthew 12:34 – Out of the abundance of the heart the mouth speaks.", "Colossians 3:16 – Let the word of Christ dwell in you richly."]),
    finalThoughts: "True worship is not only sung but spoken and thought.",
    takeaways: JSON.stringify(["God cares about both your words and your thoughts.", "Acceptance with God comes through His grace, not our perfection.", "God is our strength to stand and our Redeemer to save."]),
  },
  {
    bookName: "1 Peter", chapter: 5, verseNumber: 7, bibleVersion: "NKJ",
    verseText: "Casting all your care upon Him, for He cares for you.",
    explanation: "Peter invites the believer to a radical transfer of anxiety. 'Casting' pictures throwing a burden onto someone else — a deliberate, decisive action. 'All your care' leaves nothing out.",
    application: "Take the worry you have been carrying and deliberately hand it to God in prayer.",
    verseIntroduction: "1 Peter 5:7 turns anxiety into an act of worship: the believer throws every care onto a God who is personally concerned.",
    backgroundAuthor: "Peter, the apostle who had himself known fear and failure, writes to strengthen believers under pressure.",
    backgroundBook: "First Peter is a letter of hope and holiness for believers facing suffering.",
    backgroundContext: "These words close a section on humility and watchfulness.",
    wordStudies: JSON.stringify([{ word: "Casting", strongs: "epirriptō – Strong's G1977", definition: "To throw upon, a deliberate and complete transfer." }, { word: "All your care", strongs: "merimna – Strong's G3308", definition: "Anxiety, worry, every one of them." }, { word: "He cares for you", strongs: "melei – Strong's G3199", definition: "He is concerned about you — personal, active interest." }]),
    practicalApplications: JSON.stringify(["Name your biggest worry today and hand it to God.", "When anxiety returns, treat it as a reminder to pray.", "Practice releasing control of what you cannot control.", "Share a burden with a trusted brother or sister.", "Let God's care change how you view your problems."]),
    keyThemes: JSON.stringify(["The transfer of anxiety to God", "The personal care of the Father", "Humility and dependence", "Freedom from worry"]),
    crossReferences: JSON.stringify(["Psalm 55:22 – Cast your burden on the LORD.", "Matthew 6:25–34 – Do not worry; your Father knows.", "Philippians 4:6–7 – In everything by prayer.", "Psalm 37:5 – Commit your way to the LORD."]),
    finalThoughts: "The size of the burden matters less than the strength of the One who carries it.",
    takeaways: JSON.stringify(["Anxiety is a burden to be transferred, not carried.", "God's care for you is personal and active.", "Casting your care on God is both a command and a relief."]),
  },
  {
    bookName: "Psalms", chapter: 91, verseNumber: 1, bibleVersion: "NKJ",
    verseText: "He who dwells in the secret place of the Most High shall abide under the shadow of the Almighty.",
    explanation: "This verse opens one of Scripture's great psalms of protection. The 'secret place of the Most High' is the place of intimate communion with God.",
    application: "Make the presence of God your dwelling place today, not just your emergency shelter.",
    verseIntroduction: "Psalm 91:1 describes the secret of security: not the absence of danger, but the presence of God as the dwelling place of the soul.",
    backgroundAuthor: "Traditionally attributed to Moses or David, this psalm reflects a life sheltered under God.",
    backgroundBook: "The Psalms are the hymnbook of God's people, giving voice to trust in God's protection.",
    backgroundContext: "This psalm stands as a song of confidence for the people of God.",
    wordStudies: JSON.stringify([{ word: "Dwells", strongs: "yāshab – Strong's H3427", definition: "To sit, remain, inhabit — to make permanent home." }, { word: "Secret place", strongs: "sēther – Strong's H5643", definition: "A covering, hiding place, shelter." }, { word: "Most High", strongs: "ʿElyôn – Strong's H5945", definition: "The Highest, exalted above all." }, { word: "Shadow", strongs: "tsēl – Strong's H6738", definition: "Shade, protection." }, { word: "Almighty", strongs: "Shaddai – Strong's H7706", definition: "The All-Sufficient One." }]),
    practicalApplications: JSON.stringify(["Begin each morning by entering the presence of God.", "Return to that secret place throughout the day.", "Let the shadow of the Almighty be your answer to fear.", "Live as one who is sheltered, not exposed.", "Teach someone else the refuge you have found."]),
    keyThemes: JSON.stringify(["God as the believer's refuge", "Intimate communion with God", "Divine protection and shelter", "The Most High and the Almighty"]),
    crossReferences: JSON.stringify(["Psalm 27:5 – He shall hide me in His pavilion.", "Psalm 32:7 – You are my hiding place.", "Psalm 121:5 – The LORD is your keeper.", "Isaiah 4:6 – A tabernacle for a shadow."]),
    finalThoughts: "Security is found not in a place without storms but in a Presence within the storm.",
    takeaways: JSON.stringify(["The secret place is a lifestyle, not a location.", "God's shelter is available to all who make Him home.", "The Most High is also the Almighty."]),
  },
  {
    bookName: "Ephesians", chapter: 2, verseNumber: 8, bibleVersion: "NKJ",
    verseText: "For by grace you have been saved through faith, and that not of yourselves; it is the gift of God.",
    explanation: "This verse states the heart of the gospel with unmatched precision. Salvation is 'by grace' and 'through faith' — not of yourselves, and it is the gift of God.",
    application: "Stop measuring your standing with God by your performance. Salvation is a finished gift — receive it and rest.",
    verseIntroduction: "Ephesians 2:8 is the clearest single sentence on how a person is saved: entirely by God's grace, received through faith.",
    backgroundAuthor: "Paul wrote Ephesians while in prison, unfolding the eternal purposes of God.",
    backgroundBook: "Ephesians moves from the riches of grace in Christ to the practical walk that flows from that grace.",
    backgroundContext: "These words follow Paul's description of humanity's spiritual death and God's mercy.",
    wordStudies: JSON.stringify([{ word: "Grace", strongs: "charis – Strong's G5485", definition: "Unmerited favor, kindness freely bestowed." }, { word: "Saved", strongs: "sōzō – Strong's G4982", definition: "To rescue, deliver, and make whole." }, { word: "Through faith", strongs: "dia pisteōs – Strong's G1223/G4102", definition: "By means of faith." }, { word: "Not of yourselves", strongs: "ouk ex hymōn – Strong's G3756/G1537/G5216", definition: "Not originating from you." }, { word: "Gift of God", strongs: "dōron – Strong's G1435", definition: "A present, a free gift." }]),
    practicalApplications: JSON.stringify(["Receive salvation as a gift and stop trying to earn it.", "When guilt accuses you, answer it with the finished work of Christ.", "Let gratitude, not obligation, be the engine of obedience.", "Extend to others the same grace you have received.", "Remind yourself daily: it is by grace, through faith."]),
    keyThemes: JSON.stringify(["Salvation by grace alone", "Faith as the receiving hand", "The gift that excludes boasting", "Grace as the foundation of the Christian life"]),
    crossReferences: JSON.stringify(["Romans 3:23–24 – Justified freely by His grace.", "Titus 3:5 – Saved according to His mercy.", "2 Timothy 1:9 – Saved not according to our works.", "Romans 11:6 – If by grace, then not of works."]),
    finalThoughts: "The gospel does not ask you to become good enough to be saved; it announces that in Christ you already are.",
    takeaways: JSON.stringify(["Salvation is by grace, through faith, not by works.", "The entire gift is from God.", "Grace removes boasting and replaces it with gratitude."]),
  },
  {
    bookName: "Psalms", chapter: 118, verseNumber: 24, bibleVersion: "NKJ",
    verseText: "This is the day the LORD has made; we will rejoice and be glad in it.",
    explanation: "This verse declares that the present day is not an accident but a gift. The response is a decision, not a feeling: 'we will rejoice.'",
    application: "Before the day's circumstances are known, decide: this is the day the LORD has made, and I will rejoice.",
    verseIntroduction: "Psalm 118:24 turns every morning into a declaration: the day is God's gift, and the fitting response is chosen gladness.",
    backgroundAuthor: "This psalm celebrates deliverance and the goodness of the LORD.",
    backgroundBook: "The Psalms form the worship book of Israel.",
    backgroundContext: "The verse follows the imagery of the stone the builders rejected.",
    wordStudies: JSON.stringify([{ word: "This is the day", strongs: "zeh hayyôm – Strong's H2088/H3117", definition: "This very day, received as the LORD's gift." }, { word: "The LORD has made", strongs: "ʿāśâ – Strong's H6213", definition: "To make, to do, to appoint." }, { word: "Rejoice and be glad", strongs: "gîl, śāmach – Strong's H1523/H8055", definition: "To spin with joy and to brighten with gladness." }]),
    practicalApplications: JSON.stringify(["Greet the morning with a decision to rejoice.", "Receive your day as a gift from God's hand.", "When the day disappoints, return to the verse that made it first.", "Let your gladness be rooted in God's presence.", "Share the joy: the day God made is meant to be enjoyed."]),
    keyThemes: JSON.stringify(["The day as God's gift", "Chosen joy", "Receiving each day from His hand", "The gladness of the redeemed"]),
    crossReferences: JSON.stringify(["Psalm 118:23 – This was the LORD's doing.", "Lamentations 3:22–23 – His mercies are new every morning.", "Matthew 6:34 – Do not worry about tomorrow.", "Philippians 4:4 – Rejoice in the Lord always."]),
    finalThoughts: "Joy is not the reward of a good day but the decision of a God-fearing heart.",
    takeaways: JSON.stringify(["Every day is made and given by God.", "Gladness is a choice before it is a feeling.", "The day God makes is worth rejoicing in."]),
  },
  {
    bookName: "Hebrews", chapter: 11, verseNumber: 1, bibleVersion: "NKJ",
    verseText: "Now faith is the substance of things hoped for, the evidence of things not seen.",
    explanation: "Hebrews 11 gives faith its most famous definition. 'Substance' means the foundation, the reality, the title-deed of what is hoped for.",
    application: "Let faith be the ground under your hope today. Act on what God has promised even before you see it.",
    verseIntroduction: "Hebrews 11:1 is the lens through which all of Scripture's heroes are viewed.",
    backgroundAuthor: "The author of Hebrews, writing to Jewish believers under pressure.",
    backgroundBook: "Hebrews presents Christ as the fulfillment of all that came before.",
    backgroundContext: "This definition opens the great chapter of faith.",
    wordStudies: JSON.stringify([{ word: "Faith", strongs: "pistis – Strong's G4102", definition: "Trust, conviction, reliance." }, { word: "Substance", strongs: "hypostasis – Strong's G5287", definition: "That which stands under, foundation, title-deed." }, { word: "Hoped for", strongs: "elpizō – Strong's G1679", definition: "That which is confidently expected." }, { word: "Evidence", strongs: "elenchos – Strong's G1650", definition: "Proof, conviction, demonstration." }]),
    practicalApplications: JSON.stringify(["Build today's decisions on what God has promised.", "When hope feels thin, return to the promises that give it substance.", "Let faith be the evidence that sustains you.", "Study the hall of faith — your story joins theirs.", "Practice small acts of obedience."]),
    keyThemes: JSON.stringify(["Faith as substance and evidence", "Living by the unseen realities of God", "Hope anchored in promise", "The faithfulness of God's people"]),
    crossReferences: JSON.stringify(["Hebrews 11:6 – Without faith it is impossible to please Him.", "2 Corinthians 5:7 – We walk by faith, not by sight.", "Romans 8:24–25 – Hope that is seen is not hope.", "James 2:17 – Faith without works is dead."]),
    finalThoughts: "Faith does not make the unseen visible; it makes the unseen reliable.",
    takeaways: JSON.stringify(["Faith gives hope its foundation.", "Faith is the conviction that makes the unseen real.", "God's people have always lived by faith, not by sight."]),
  },
  {
    bookName: "1 John", chapter: 4, verseNumber: 19, bibleVersion: "NKJ",
    verseText: "We love Him because He first loved us.",
    explanation: "This short verse explains the origin of all genuine love for God. Our love does not begin with us; it is a response — the echo of a love that started in God.",
    application: "When your love for God feels cold, return to the cross and receive His love for you.",
    verseIntroduction: "1 John 4:19 is the heartbeat of the gospel's effect on us.",
    backgroundAuthor: "The apostle John writes to deepen the believers' assurance and love.",
    backgroundBook: "First John is a letter about fellowship with God, built on truth and love.",
    backgroundContext: "This verse concludes a passage on love as the evidence of knowing God.",
    wordStudies: JSON.stringify([{ word: "We love", strongs: "agapaō – Strong's G25", definition: "The believer's love for God." }, { word: "Because", strongs: "hoti – Strong's G3754", definition: "Marking God's love as the ground and cause." }, { word: "He first loved us", strongs: "autos prōtos ēgapēsen – Strong's G846/G4413/G25", definition: "He loved us first — before we deserved it." }]),
    practicalApplications: JSON.stringify(["Let your love for God be a response to His love.", "When you fail, return to the truth that He loved you first.", "Receive His love before you try to give it.", "Love others out of the overflow of being loved.", "Remind yourself daily: my love is an echo of His."]),
    keyThemes: JSON.stringify(["God's initiating love", "Love as response to grace", "Assurance rooted in being loved", "Love flowing from love received"]),
    crossReferences: JSON.stringify(["John 3:16 – God so loved the world.", "Romans 5:8 – God demonstrates His love toward us.", "1 John 4:10 – He loved us.", "Ephesians 2:4–5 – Because of His great love."]),
    finalThoughts: "Love for God is not a ladder we climb to reach Him; it is the echo of a love that reached us first.",
    takeaways: JSON.stringify(["God's love for us comes first — always.", "Our love is a response, not an origin.", "Being loved by God is the source of loving Him and others."]),
  },
  {
    bookName: "2 Corinthians", chapter: 5, verseNumber: 17, bibleVersion: "NKJ",
    verseText: "Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new.",
    explanation: "Paul announces the radical result of being united to Christ: a new creation. Conversion is not renovation; it is new creation.",
    application: "Stop defining yourself by who you used to be. In Christ you are a new creation.",
    verseIntroduction: "2 Corinthians 5:17 is the believer's new birth certificate: union with Christ means new creation.",
    backgroundAuthor: "Paul wrote 2 Corinthians to defend his apostolic ministry.",
    backgroundBook: "Second Corinthians is deeply personal, showing Paul's own life as a demonstration of new-creation power.",
    backgroundContext: "This verse follows Paul's statement that Christ died for all.",
    wordStudies: JSON.stringify([{ word: "In Christ", strongs: "en Christō – Strong's G1722/G5547", definition: "United to Christ by faith." }, { word: "New creation", strongs: "kainē ktisis – Strong's G2537/G2937", definition: "A fresh act of creation." }, { word: "Passed away", strongs: "parēlthen – Strong's G3928", definition: "To go by, to pass away." }, { word: "Become new", strongs: "kainos – Strong's G2537", definition: "New in kind and quality." }]),
    practicalApplications: JSON.stringify(["Begin each day by declaring your identity: in Christ, I am a new creation.", "Refuse to let past failures define your standing.", "Live in the newness the Spirit produces.", "Treat other believers as new creations.", "Let new creation change how you face old habits."]),
    keyThemes: JSON.stringify(["Union with Christ", "New creation", "The passing of the old life", "Identity transformed by the gospel"]),
    crossReferences: JSON.stringify(["Romans 6:4 – Walk in newness of life.", "Galatians 6:15 – A new creation.", "Ephesians 4:22–24 – Put on the new man.", "John 3:3 – Born again."]),
    finalThoughts: "The gospel does not make bad people good; it makes dead people alive.",
    takeaways: JSON.stringify(["Being in Christ makes you a new creation.", "The old life has passed away.", "New identity calls for new living."]),
  },
  {
    bookName: "Psalms", chapter: 119, verseNumber: 105, bibleVersion: "NKJ",
    verseText: "Your word is a lamp to my feet and a light to my path.",
    explanation: "This beloved verse pictures the Word of God as light for the journey of life. A 'lamp to my feet' speaks of step-by-step guidance.",
    application: "When you cannot see the whole road, take the next step by the light of God's word.",
    verseIntroduction: "Psalm 119:105 promises that Scripture is sufficient light for the whole path of life.",
    backgroundAuthor: "This psalm, the longest in the Psalter, is a sustained meditation on God's word.",
    backgroundBook: "Psalm 119 celebrates the word of God as the delight of the godly.",
    backgroundContext: "This verse sits in a psalm written by one who discovered that God's word held him steady.",
    wordStudies: JSON.stringify([{ word: "Word", strongs: "dābār – Strong's H1697", definition: "God's spoken revelation." }, { word: "Lamp", strongs: "nēr – Strong's H5216", definition: "A small, portable light." }, { word: "Feet", strongs: "regel – Strong's H7272", definition: "The next step." }, { word: "Light", strongs: "ʾôr – Strong's H216", definition: "Light, brightness." }, { word: "Path", strongs: "nĕtîbâ – Strong's H5410", definition: "A track, way, or course." }]),
    practicalApplications: JSON.stringify(["Read Scripture daily for the light you need today.", "Take the next step you can see.", "When the road seems dark, return to the word.", "Let Scripture set your direction.", "Share the light with someone looking for the path."]),
    keyThemes: JSON.stringify(["The word as guidance", "Step-by-step direction", "Scripture as sufficient light", "Walking in the way of the word"]),
    crossReferences: JSON.stringify(["Proverbs 6:23 – The commandment is a lamp.", "Psalm 119:130 – The entrance of Your words gives light.", "2 Peter 1:19 – A lamp shining in a dark place.", "John 8:12 – I am the light of the world."]),
    finalThoughts: "God does not always show the whole road, but He always shows the next step.",
    takeaways: JSON.stringify(["God's word lights both the step and the path.", "You do not need to see the whole journey.", "Scripture is sufficient guidance."]),
  },
  {
    bookName: "Isaiah", chapter: 40, verseNumber: 31, bibleVersion: "NKJ",
    verseText: "But those who wait on the LORD shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint.",
    explanation: "Isaiah promises strength to those who wait on the LORD. 'Waiting' is active, expectant trust — the posture of a servant watching for the master's word.",
    application: "If today feels heavy, stop striving and wait on the LORD.",
    verseIntroduction: "Isaiah 40:31 is the promise of exchanged strength for soaring, running, and walking.",
    backgroundAuthor: "Isaiah, the prophet of judgment and hope.",
    backgroundBook: "The Book of Isaiah announces both coming judgment and glorious restoration.",
    backgroundContext: "This verse closes a passage of comfort to weary Israel.",
    wordStudies: JSON.stringify([{ word: "Wait", strongs: "qāwâ – Strong's H6960", definition: "To wait for, to look expectantly." }, { word: "Renew", strongs: "ḥālaph – Strong's H2498", definition: "To renew, to exchange." }, { word: "Mount up", strongs: "ʿālâ – Strong's H5927", definition: "To ascend, to rise up." }, { word: "Weary / faint", strongs: "yāgaʿ, ʿāyap – Strong's H3021/H3286", definition: "To grow tired or exhausted." }]),
    practicalApplications: JSON.stringify(["Begin the day with a season of waiting on the LORD.", "When strength fails, exchange your effort for trust.", "Expect God for vision, service, and endurance.", "Do not despise the walking stage.", "Encourage a weary believer with this promise."]),
    keyThemes: JSON.stringify(["Waiting on the LORD", "Renewed strength", "God's power in human weakness", "Endurance for the long road"]),
    crossReferences: JSON.stringify(["Psalm 27:14 – Wait on the LORD.", "Psalm 103:5 – Your youth is renewed like the eagle's.", "Lamentations 3:25 – The LORD is good to those who wait.", "2 Corinthians 4:16 – The inward man is renewed day by day."]),
    finalThoughts: "Strength is not found in hurrying but in waiting.",
    takeaways: JSON.stringify(["Waiting on the LORD is active trust.", "God renews the strength of those who wait.", "His strength covers soaring, running, and walking."]),
  },
  {
    bookName: "Joshua", chapter: 1, verseNumber: 9, bibleVersion: "NKJ",
    verseText: "Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the LORD your God is with you wherever you go.",
    explanation: "God speaks words of commission and courage to Joshua. The ground of courage is not Joshua's ability but God's presence.",
    application: "Name what makes you afraid today, then set against it the promise: the LORD your God is with you.",
    verseIntroduction: "Joshua 1:9 is God's commission to every successor and every step of faith.",
    backgroundAuthor: "Joshua, Moses' successor, led Israel into the Promised Land.",
    backgroundBook: "The Book of Joshua shows God fulfilling His promises to Abraham.",
    backgroundContext: "God speaks these words to Joshua at the border of the land.",
    wordStudies: JSON.stringify([{ word: "Be strong", strongs: "ḥāzaq – Strong's H2388", definition: "To be strong, to strengthen oneself." }, { word: "Good courage", strongs: "ʾāmaṣ – Strong's H553", definition: "To be stout, bold, courageous." }, { word: "Afraid", strongs: "yārēʾ – Strong's H3372", definition: "To fear, to be terrified." }, { word: "Dismayed", strongs: "ḥātat – Strong's H2865", definition: "To be shattered, broken, discouraged." }, { word: "With you", strongs: "ʿimmekā – Strong's H5973", definition: "Alongside you — God's covenant presence." }]),
    practicalApplications: JSON.stringify(["Face the task ahead by rehearsing God's presence.", "Replace fear of the unknown with certainty of His company.", "Take the step obedience requires.", "Speak God's word to yourself.", "Lead with the awareness that God goes before you."]),
    keyThemes: JSON.stringify(["The command to courage", "God's presence as the ground of strength", "Leadership in faith", "Fear displaced by God's presence"]),
    crossReferences: JSON.stringify(["Deuteronomy 31:6 – Be strong and courageous; the LORD goes with you.", "Deuteronomy 31:8 – The LORD goes before you.", "Isaiah 41:10 – Fear not, for I am with you.", "Matthew 28:20 – I am with you always."]),
    finalThoughts: "Courage is not a feeling we manufacture; it is the settled confidence that comes from knowing who walks beside us.",
    takeaways: JSON.stringify(["God commands strength and courage — and supplies the presence.", "Fear is displaced by the certainty of God with us.", "Obedience is the path where His presence is promised."]),
  },
  {
    bookName: "Psalms", chapter: 46, verseNumber: 10, bibleVersion: "NKJ",
    verseText: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth!",
    explanation: "In the midst of chaos, God speaks one word: 'Be still, and know that I am God.' The call to stillness is a summons to cease striving.",
    application: "When the world feels loud and your soul feels frantic, obey the command: be still.",
    verseIntroduction: "Psalm 46:10 is God's quiet command in the chaos: stop striving, know that He is God.",
    backgroundAuthor: "This psalm, attributed to the sons of Korah.",
    backgroundBook: "The Psalms give voice to trust in God as refuge and strength.",
    backgroundContext: "Written against a backdrop of war and shaking nations.",
    wordStudies: JSON.stringify([{ word: "Be still", strongs: "rāpâ – Strong's H7503", definition: "To sink down, to let go." }, { word: "Know", strongs: "yādaʿ – Strong's H3045", definition: "To know intimately and with certainty." }, { word: "I am God", strongs: "ʾănî ʾĕlōhîm – Strong's H589/H430", definition: "The self-declaration of the covenant God." }, { word: "Exalted", strongs: "rûm – Strong's H7311", definition: "To be lifted up, raised high." }]),
    practicalApplications: JSON.stringify(["Set aside a few minutes to be still before God.", "When anxiety rises, remind yourself that God is God.", "Cease trying to control what only God can govern.", "Let God's promise of exaltation calm your fear.", "Return to stillness as a discipline."]),
    keyThemes: JSON.stringify(["Stillness before God", "God's sovereign rule", "Trust that ceases striving", "The exaltation of God's name"]),
    crossReferences: JSON.stringify(["Psalm 46:1 – God is our refuge and strength.", "Psalm 37:7 – Rest in the LORD.", "Exodus 14:14 – The LORD will fight for you.", "Isaiah 2:11 – The LORD alone shall be exalted."]),
    finalThoughts: "The storm does not determine who God is; His exaltation does.",
    takeaways: JSON.stringify(["Stillness is the posture of trust in chaos.", "Knowing God personally changes how we face the storm.", "God will be exalted — no power can stop it."]),
  },
  {
    bookName: "Matthew", chapter: 11, verseNumber: 28, bibleVersion: "NKJ",
    verseText: "Come to Me, all you who labor and are heavy laden, and I will give you rest.",
    explanation: "Jesus extends an open invitation to the weary. Rest is not a technique Jesus teaches but a person Jesus gives.",
    application: "Bring your exhaustion to Jesus today — come to Him as you are, and receive the rest He gives.",
    verseIntroduction: "Matthew 11:28 is the open door of the gospel: every weary soul is invited to find rest.",
    backgroundAuthor: "Matthew wrote his Gospel to show that Jesus is the promised Messiah.",
    backgroundBook: "The Gospel of Matthew presents Jesus as the King who invites the weary.",
    backgroundContext: "Jesus speaks these words after pronouncing woe on unrepentant cities.",
    wordStudies: JSON.stringify([{ word: "Come", strongs: "deute – Strong's G1205", definition: "Come here! An imperative invitation." }, { word: "Labor", strongs: "kopiaō – Strong's G2872", definition: "To toil, to grow weary with effort." }, { word: "Heavy laden", strongs: "phortizō – Strong's G5412", definition: "To be loaded down, burdened." }, { word: "Rest", strongs: "anapauō – Strong's G373", definition: "To refresh, to give rest and relief." }]),
    practicalApplications: JSON.stringify(["Bring your tiredness to Jesus.", "Stop striving to earn what Jesus freely gives.", "Receive rest as a gift, not a reward.", "Come honestly — your burdens qualify you.", "Point others to the same rest."]),
    keyThemes: JSON.stringify(["The invitation of Jesus", "Rest for the weary", "Grace instead of striving", "Jesus as the giver of rest"]),
    crossReferences: JSON.stringify(["Matthew 11:29–30 – My yoke is easy and My burden is light.", "John 7:37 – If anyone thirsts, let him come to Me.", "Psalm 55:22 – Cast your burden on the LORD.", "Hebrews 4:9–10 – There remains a rest for the people of God."]),
    finalThoughts: "Rest is not the reward of the finished but the gift to the weary.",
    takeaways: JSON.stringify(["Jesus invites the weary to come to Him.", "Rest is given by Jesus, not earned by effort.", "Your burdens qualify you for His invitation."]),
  },
  {
    bookName: "Psalms", chapter: 37, verseNumber: 4, bibleVersion: "NKJ",
    verseText: "Delight yourself also in the LORD, and He shall give you the desires of your heart.",
    explanation: "This verse promises that the heart that delights in God will receive its desires — but the order is everything.",
    application: "Do not run after your desires first — run after God.",
    verseIntroduction: "Psalm 37:4 puts the order of blessing in place: delight in God first.",
    backgroundAuthor: "David instructs the godly in the patient way of the righteous.",
    backgroundBook: "Psalm 37 is an acrostic wisdom psalm contrasting the way of the righteous with the way of the wicked.",
    backgroundContext: "This verse sits among encouragements to trust and do good.",
    wordStudies: JSON.stringify([{ word: "Delight yourself", strongs: "ʿānag – Strong's H6026", definition: "To take exquisite pleasure." }, { word: "In the LORD", strongs: "ʿal-YHWH – Strong's H5921/H3068", definition: "Delight grounded in God Himself." }, { word: "Desires", strongs: "mishʾālâ – Strong's H4862", definition: "Requests, longings, petitions." }, { word: "Heart", strongs: "lēb – Strong's H3820", definition: "The inner person — the seat of desire." }]),
    practicalApplications: JSON.stringify(["Begin with delight: practice enjoying God.", "Let your desires be examined in His presence.", "Trust God with the timing and form of His answers.", "Find satisfaction in God before circumstances.", "Celebrate when God reshapes a desire."]),
    keyThemes: JSON.stringify(["Delight in God", "Desires transformed and granted", "The joy of knowing God", "Trust instead of fretting"]),
    crossReferences: JSON.stringify(["Psalm 37:5 – Commit your way to the LORD.", "Psalm 16:11 – In Your presence is fullness of joy.", "Matthew 6:33 – Seek first the kingdom.", "Psalm 145:19 – He will fulfill the desire of those who fear Him."]),
    finalThoughts: "Delight and desire belong together — but delight comes first.",
    takeaways: JSON.stringify(["Delight in God is the path to fulfilled desire.", "God transforms the desires of those who delight in Him.", "Joy in God is the deepest satisfaction."]),
  },
  {
    bookName: "Romans", chapter: 8, verseNumber: 31, bibleVersion: "NKJ",
    verseText: "What then shall we say to these things? If God is for us, who can be against us?",
    explanation: "Paul's rhetorical question is the hinge of the greatest assurance passage in Scripture.",
    application: "When opposition feels overwhelming, rehearse the question: if God is for me, who can be against me?",
    verseIntroduction: "Romans 8:31 is the confidence of the believer: with God on our side, no adversary can stand.",
    backgroundAuthor: "Paul wrote Romans to set forth the gospel of God.",
    backgroundBook: "Romans unfolds justification by faith and its consequences.",
    backgroundContext: "This verse begins the concluding celebration of the chapter.",
    wordStudies: JSON.stringify([{ word: "For us", strongs: "hyper hēmōn – Strong's G5228/G2257", definition: "On our behalf, in our favor." }, { word: "Against us", strongs: "kath' hēmōn – Strong's G2596/G2257", definition: "Opposed to us, against us." }, { word: "God", strongs: "theos – Strong's G2316", definition: "The Sovereign Creator and Judge." }]),
    practicalApplications: JSON.stringify(["Face your accusers with the question of this verse.", "Measure your problems against the size of God.", "When you feel alone, remember the Almighty is on your side.", "Let this assurance free you to obey.", "Speak this truth over a friend who feels outnumbered."]),
    keyThemes: JSON.stringify(["God for us", "The security of the justified", "No adversary can prevail", "The certainty of God's purposes"]),
    crossReferences: JSON.stringify(["Romans 8:32 – He will freely give us all things.", "Romans 8:33–34 – God who justifies.", "Psalm 118:6 – The LORD is on my side.", "Isaiah 41:10 – Fear not, for I am with you."]),
    finalThoughts: "The outcome is decided by which side God is on — and in Christ, He is decisively for us.",
    takeaways: JSON.stringify(["God's being for us outweighs every adversary.", "This assurance is grounded in the gospel.", "With God on our side, we can face anything."]),
  },
  {
    bookName: "Psalms", chapter: 27, verseNumber: 1, bibleVersion: "NKJ",
    verseText: "The LORD is my light and my salvation; whom shall I fear? The LORD is the strength of my life; of whom shall I be afraid?",
    explanation: "David opens this psalm with a confession of confidence that banishes fear.",
    application: "Meet every fear today with the titles of God: He is my light, my salvation, the strength of my life.",
    verseIntroduction: "Psalm 27:1 is the believer's declaration of confidence.",
    backgroundAuthor: "David wrote this psalm in a season of threat.",
    backgroundBook: "The Psalms record the prayers and praises of God's people.",
    backgroundContext: "This opening verse frames a psalm of trust sung in the face of enemies.",
    wordStudies: JSON.stringify([{ word: "Light", strongs: "ʾôr – Strong's H216", definition: "Illumination — God dispels darkness." }, { word: "Salvation", strongs: "yeshaʿ – Strong's H3468", definition: "Deliverance, help, victory." }, { word: "Strength", strongs: "maʿôz – Strong's H4581", definition: "Stronghold, fortress, refuge." }, { word: "Fear", strongs: "yārēʾ – Strong's H3372", definition: "To fear, to be afraid." }]),
    practicalApplications: JSON.stringify(["Name your fear, then answer it with God's title.", "Let God's light guide the next step.", "Run to God as the strength of your life.", "Sing or speak this verse when anxiety speaks.", "Salvation belongs to the LORD — the outcome is safe."]),
    keyThemes: JSON.stringify(["The LORD as light, salvation, and strength", "Fear displaced by the knowledge of God", "Confidence in God's protection", "The fearlessness of the trusting heart"]),
    crossReferences: JSON.stringify(["Psalm 18:28 – You will light my lamp.", "Isaiah 12:2 – God is my salvation; I will trust.", "Psalm 28:8 – The LORD is their strength.", "Micah 7:8 – The LORD will be a light to me."]),
    finalThoughts: "Fear asks, 'What could happen?' Faith answers, 'Who is my God?'",
    takeaways: JSON.stringify(["God's character is the answer to every fear.", "Light, salvation, and strength are found in the LORD.", "The trusting heart has nothing left to fear."]),
  },
  {
    bookName: "John", chapter: 14, verseNumber: 6, bibleVersion: "NKJ",
    verseText: "Jesus said to him, 'I am the way, the truth, and the life. No one comes to the Father except through Me.'",
    explanation: "Jesus answers Thomas's question with one of the great 'I am' sayings. He does not say He knows the way; He says, 'I am the way.'",
    application: "Stop searching for a way to God through your own efforts. Jesus is the way.",
    verseIntroduction: "John 14:6 is the boldest claim of the gospel.",
    backgroundAuthor: "The apostle John recorded Jesus' farewell discourse.",
    backgroundBook: "The Gospel of John is built on the 'I am' sayings of Jesus.",
    backgroundContext: "Jesus speaks these words in the upper room on the night before His death.",
    wordStudies: JSON.stringify([{ word: "The way", strongs: "hē hodos – Strong's G3598", definition: "The road — not a teacher of the way but the way itself." }, { word: "The truth", strongs: "hē alētheia – Strong's G225", definition: "Reality, truth — all that is real about God." }, { word: "The life", strongs: "hē zōē – Strong's G2222", definition: "Life itself — the source of spiritual vitality." }, { word: "No one... except through Me", strongs: "oudeis... ei mē di' emou", definition: "Nobody — unless through Me." }]),
    practicalApplications: JSON.stringify(["Place your confidence in Jesus as the way.", "Receive the truth about God that Jesus reveals.", "Live from the life Jesus gives.", "Share the way with others — it is good news.", "When you doubt, return to who Jesus is."]),
    keyThemes: JSON.stringify(["Jesus as the way, the truth, and the life", "Access to the Father through Christ alone", "The exclusive claim of the gospel", "Comfort for troubled hearts"]),
    crossReferences: JSON.stringify(["John 10:9 – I am the door.", "Acts 4:12 – No other name under heaven.", "1 Timothy 2:5 – One Mediator between God and men.", "John 11:25 – I am the resurrection and the life."]),
    finalThoughts: "The way to God is not a path we find but a Person we come to.",
    takeaways: JSON.stringify(["Jesus is the way to the Father.", "In Him we have truth and life.", "Access to the Father is through Christ alone."]),
  },
  {
    bookName: "Psalms", chapter: 136, verseNumber: 26, bibleVersion: "NKJ",
    verseText: "Give thanks to the God of heaven, for His mercy endures forever.",
    explanation: "Psalm 136 is built on a repeated refrain: 'for His mercy endures forever.' Verse 26 closes the psalm by directing thanksgiving to the sovereign Ruler of all.",
    application: "Walk through your history giving thanks that God's mercy endures forever.",
    verseIntroduction: "Psalm 136:26 gathers the whole story of God's faithfulness into one refrain.",
    backgroundAuthor: "This psalm was sung responsively in temple worship.",
    backgroundBook: "The Psalms give voice to the corporate memory of God's people.",
    backgroundContext: "The final verse crowns a psalm of remembrance that recounts creation and redemption.",
    wordStudies: JSON.stringify([{ word: "Give thanks", strongs: "yādâ – Strong's H3034", definition: "To confess, to praise, to give thanks." }, { word: "God of heaven", strongs: "ʾēl haš-šāmayim – Strong's H410/H8064", definition: "The God who rules the heavens." }, { word: "Mercy", strongs: "ḥesed – Strong's H2617", definition: "Covenant love, steadfast kindness." }, { word: "Endures forever", strongs: "lĕʿôlām – Strong's H5769", definition: "For eternity, perpetually, without end." }]),
    practicalApplications: JSON.stringify(["Make thanksgiving a rhythm.", "Rehearse God's faithfulness in your own history.", "When circumstances change, remember the refrain.", "Let gratitude for past mercy fuel trust for the future.", "Teach the next generation the chorus."]),
    keyThemes: JSON.stringify(["The eternal mercy of God", "Thanksgiving as worship", "Remembering God's mighty acts", "God's sovereignty"]),
    crossReferences: JSON.stringify(["Psalm 107:1 – Give thanks, for His mercy endures forever.", "Psalm 118:1 – Give thanks, for His mercy endures forever.", "Lamentations 3:22 – His compassions are new every morning.", "1 Chronicles 16:34 – Give thanks, for His mercy endures forever."]),
    finalThoughts: "Mercy that endures forever means there is no day beyond the reach of God's faithful love.",
    takeaways: JSON.stringify(["God's mercy is the refrain of all history.", "Thanksgiving is the fitting response to enduring love.", "The God of heaven is faithful in every generation."]),
  },
  {
    bookName: "Psalms", chapter: 150, verseNumber: 6, bibleVersion: "NKJ",
    verseText: "Let everything that has breath praise the LORD. Praise the LORD!",
    explanation: "This final verse of the Psalter is the climax of all worship. 'Let everything that has breath praise the LORD' summons the entire created order to the one activity that fits our existence: praise.",
    application: "Let your very breathing remind you of your purpose today: you exist to praise.",
    verseIntroduction: "Psalm 150:6 is the final word of the Psalter and the purpose statement of every human life.",
    backgroundAuthor: "The Psalter was shaped over centuries by many writers.",
    backgroundBook: "The Psalms carry the whole range of human experience into God's presence.",
    backgroundContext: "This verse crowns a psalm of escalating praise.",
    wordStudies: JSON.stringify([{ word: "Everything that has breath", strongs: "kol han-nĕshāmâ – Strong's H3605/H5397", definition: "All that breathes — every living creature." }, { word: "Praise", strongs: "hālal – Strong's H1984", definition: "To boast, to shine, to celebrate." }, { word: "The LORD", strongs: "Yāh – Strong's H3050", definition: "A shortened form of Yahweh." }]),
    practicalApplications: JSON.stringify(["Start the day with a deliberate act of praise.", "Turn ordinary moments into occasions of thanksgiving.", "When words fail, let music carry your praise.", "Include others: praise is meant to be shared.", "Let your final thought tonight be: praise the LORD."]),
    keyThemes: JSON.stringify(["Praise as the purpose of life", "The universality of worship", "The God who is worthy of all praise", "Hallelujah as the final word"]),
    crossReferences: JSON.stringify(["Psalm 148:5 – Let them praise the name of the LORD.", "Psalm 103:1 – Bless the LORD, O my soul.", "Revelation 5:13 – Every creature: blessing and honor.", "Philippians 2:10–11 – Every knee should bow."]),
    finalThoughts: "The last word of the Psalter is not a problem to solve but a praise to offer.",
    takeaways: JSON.stringify(["Praise is the purpose for which we were made.", "Every breath is an invitation to worship.", "The book of life ends — and begins — with Hallelujah."]),
  },
  {
    bookName: "Philippians", chapter: 4, verseNumber: 6, bibleVersion: "NKJ",
    verseText: "Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God.",
    explanation: "Paul commands the believer to trade anxiety for prayer. 'Be anxious for nothing' is a command, not a suggestion.",
    application: "The next time worry rises, convert it into a specific prayer with thanksgiving.",
    verseIntroduction: "Philippians 4:6 gives the believer a weapon against anxiety.",
    backgroundAuthor: "Paul wrote this letter from prison, yet it overflows with joy.",
    backgroundBook: "Philippians is the epistle of joy in Christ.",
    backgroundContext: "This verse precedes the promise of God's peace.",
    wordStudies: JSON.stringify([{ word: "Anxious", strongs: "merimnaō – Strong's G3309", definition: "To be divided in mind, distracted by care." }, { word: "Prayer", strongs: "proseuchē – Strong's G4335", definition: "Worshipful prayer — the turning of the soul to God." }, { word: "Supplication", strongs: "deēsis – Strong's G1162", definition: "Earnest entreaty for a particular need." }, { word: "Thanksgiving", strongs: "eucharistia – Strong's G2169", definition: "Gratitude, thankfulness." }, { word: "Made known", strongs: "gnōrizō – Strong's G1107", definition: "To make known, to declare." }]),
    practicalApplications: JSON.stringify(["When worry comes, name it and turn it into prayer.", "Thank God before you ask.", "Bring small needs to God, not only large ones.", "Refuse anxious rehearsal; choose prayer.", "After you pray, trust that God heard."]),
    keyThemes: JSON.stringify(["The refusal of anxiety", "Prayer as the alternative to worry", "Thanksgiving in every request", "The peace that follows surrender"]),
    crossReferences: JSON.stringify(["Philippians 4:7 – The peace of God will guard your hearts.", "Matthew 6:25–34 – Do not worry about tomorrow.", "1 Peter 5:7 – Cast all your care upon Him.", "Psalm 55:22 – Cast your burden on the LORD."]),
    finalThoughts: "Worry and prayer cannot occupy the same heart for long.",
    takeaways: JSON.stringify(["Anxiety is to be refused, not entertained.", "Everything is a candidate for prayer.", "Thanksgiving keeps asking humble and hope alive."]),
  },
  {
    bookName: "Hebrews", chapter: 13, verseNumber: 8, bibleVersion: "NKJ",
    verseText: "Jesus Christ is the same yesterday, today, and forever.",
    explanation: "This verse declares the unchanging nature of Christ. While circumstances shift, cultures change, and human emotions fluctuate, Jesus Christ remains constant. His character, His promises, His power, and His love do not vary. This is the anchor of the believer's hope: the One who saved us yesterday sustains us today and will keep us forever.",
    application: "When everything around you is changing, anchor your heart in the One who never changes. What He did before, He will do again.",
    verseIntroduction: "Hebrews 13:8 is the believer's unshakable anchor: Jesus Christ does not change, and neither does His faithfulness.",
    backgroundAuthor: "The author of Hebrews writes to Jewish believers tempted to return to the old covenant.",
    backgroundBook: "Hebrews presents Christ as the fulfillment of all that came before, superior to angels, Moses, and the priesthood.",
    backgroundContext: "This verse follows a call to be content with what one has and to trust that God will never leave nor forsake.",
    wordStudies: JSON.stringify([{ word: "Same", strongs: "autos – Strong's G846", definition: "The same, unchanged, identical — no variation or shadow of turning." }, { word: "Yesterday", strongs: "chthēs – Strong's G5504", definition: "The day before — the past in all its events." }, { word: "Today", strongs: "sēmeron – Strong's G4594", definition: "This present day — the now of current experience." }, { word: "Forever", strongs: "eis tous aiōnas – Strong's G1519/G3588/G165", definition: "Into the ages — the endless future." }]),
    practicalApplications: JSON.stringify(["When fear rises about the future, remember: Jesus is the same.", "Do not measure God's faithfulness by yesterday's feelings.", "Return to what He has done before — He will do it again.", "Let the immutability of Christ steady your shifting emotions.", "Teach your children that the God who was faithful yesterday is faithful today."]),
    keyThemes: JSON.stringify(["The immutability of Christ", "God's faithfulness across all time", "The unchanging foundation of faith", "Comfort in the midst of change"]),
    crossReferences: JSON.stringify(["Malachi 3:6 – I am the LORD; I do not change.", "Numbers 23:19 – God is not a man that He should lie.", "James 1:17 – Every good gift comes from the Father of lights, with whom there is no variation.", "Psalm 102:25–27 – The same; Your years have no end."]),
    finalThoughts: "The only constant in the universe is the character of Christ. What He was, He is; what He is, He will be — forever.",
    takeaways: JSON.stringify(["Jesus Christ does not change — yesterday, today, or forever.", "His faithfulness is not dependent on our circumstances.", "The immutability of Christ is the anchor of our hope."]),
  },
  {
    bookName: "Galatians", chapter: 5, verseNumber: 22, bibleVersion: "NKJ",
    verseText: "But the fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control. Against such there is no law.",
    explanation: "Paul describes the fruit that the Holy Spirit produces in the life of a believer. This is not a checklist of virtues to manufacture but a description of what naturally grows when the Spirit is in control. The fruit is singular — 'the fruit' — suggesting these qualities are interconnected, all growing from the same root: union with Christ through the Spirit. Each quality flows from the character of God Himself being expressed through His people.",
    application: "Rather than striving to produce these qualities by willpower, surrender to the Spirit and let Him produce His fruit in you.",
    verseIntroduction: "Galatians 5:22-23 is the portrait of a Spirit-controlled life: nine qualities that no law can produce but the Spirit freely gives.",
    backgroundAuthor: "Paul wrote Galatians to defend the gospel of grace against legalism.",
    backgroundBook: "Galatians is the declaration of Christian freedom from the law and bondage.",
    backgroundContext: "This verse follows Paul's contrast between the works of the flesh and the fruit of the Spirit.",
    wordStudies: JSON.stringify([{ word: "Fruit", strongs: "karpos – Strong's G2590", definition: "The natural product of a living thing — what grows when the Spirit is in control." }, { word: "Love", strongs: "agapē – Strong's G26", definition: "Selfless, sacrificial love — the love of God expressed through His people." }, { word: "Joy", strongs: "chara – Strong's G5479", definition: "Deep delight, gladness — not dependent on circumstances but rooted in God." }, { word: "Peace", strongs: "eirēnē – Strong's G1515", definition: "Wholeness, harmony, tranquility — the peace of God that surpasses understanding." }, { word: "Longsuffering", strongs: "makrothymia – Strong's G3166", definition: "Patience under provocation, slowness to anger." }, { word: "Kindness", strongs: "chrēstotēs – Strong's G5544", definition: "Gentle goodness, benevolence toward others." }, { word: "Goodness", strongs: "agathōsynē – Strong's G19", definition: "Moral excellence, virtue — doing what is right." }, { word: "Faithfulness", strongs: "pistis – Strong's G4102", definition: "Trustworthiness, reliability — being true to one's word." }, { word: "Gentleness", strongs: "praÿtēs – Strong's G4240", definition: "Meekness under control — strength that chooses not to retaliate." }, { word: "Self-control", strongs: "egkrateia – Strong's G1466", definition: "Mastery over desires and impulses — the Spirit's power to say no." }]),
    practicalApplications: JSON.stringify(["Surrender to the Spirit daily and let Him produce His fruit.", "Do not manufacture these qualities by willpower alone.", "When you see these growing in your life, give credit to the Spirit.", "Ask the Spirit to reveal which fruit is weakest and needs growth.", "Remember: these qualities are evidence of the Spirit's presence, not our effort."]),
    keyThemes: JSON.stringify(["The fruit of the Spirit", "Character produced by the Spirit", "The evidence of Spirit-control", "Freedom from legalism", "The interconnectedness of spiritual virtues"]),
    crossReferences: JSON.stringify(["John 15:4–5 – Abide in Me, and you will bear much fruit.", "Romans 8:9–11 – The Spirit of God dwells in you.", "Ephesians 5:9 – The fruit of the Spirit is in all goodness, righteousness, and truth.", "Colossians 1:10 – Bearing fruit in every good work."]),
    finalThoughts: "The fruit of the Spirit is not a list to check off but a life to live. When we abide in Christ, His Spirit produces what no amount of self-effort can achieve.",
    takeaways: JSON.stringify(["The fruit of the Spirit is produced by the Spirit, not by self-effort.", "These nine qualities are interconnected, all growing from the same root.", "Against such fruit, there is no law — they are the evidence of true freedom."]),
  },
];

// Build lookup map
const verseMap = new Map();
for (const v of verseLibrary) {
  verseMap.set(`${v.bookName}|${v.chapter}|${v.verseNumber}`, v);
}

const RICH_FIELDS = [
  "explanation", "application", "verseIntroduction",
  "backgroundAuthor", "backgroundBook", "backgroundContext",
  "wordStudies", "practicalApplications", "keyThemes",
  "crossReferences", "finalThoughts", "takeaways", "learnMore",
  "reflection", "bibleVersion",
];

async function main() {
  const getAdminUserId = async () => {
    const admin = await prisma.systemUser.findFirst({
      where: { OR: [{ userRole: 1n }, { email: "apps.himfirstmedia@gmail.com" }] },
      orderBy: { createdOn: "asc" },
    });
    if (admin) return admin.id;
    const anyUser = await prisma.systemUser.findFirst({ orderBy: { createdOn: "asc" } });
    return anyUser?.id || "bbb2816c-62d0-4e5d-bd9d-54c82e6baf6c";
  };

  const adminId = await getAdminUserId();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // ── Step 1: Delete all past-date verses ────────────────────────────────
  const pastResult = await prisma.dailyVerse.deleteMany({
    where: { displayDate: { lt: today } },
  });
  console.log(`Deleted ${pastResult.count} past-date verses`);

  // ── Step 2: Enrich existing verses missing rich fields ──────────────────
  const existingVerses = await prisma.dailyVerse.findMany({
    orderBy: { displayDate: "asc" },
  });

  let enriched = 0;
  for (const v of existingVerses) {
    const key = `${v.bookName}|${Number(v.chapter)}|${Number(v.verseNumber)}`;
    const lib = verseMap.get(key);
    if (!lib) continue;

    const needsEnrichment = RICH_FIELDS.some((f) => {
      const current = v[f];
      return current === null || current === undefined || current === "";
    });

    if (!needsEnrichment) continue;

    const updateData = {};
    for (const f of RICH_FIELDS) {
      const current = v[f];
      if ((current === null || current === undefined || current === "") && lib[f] !== undefined) {
        updateData[f] = lib[f];
      }
    }
    updateData.updatedBy = adminId;

    if (Object.keys(updateData).length > 1) {
      await prisma.dailyVerse.update({
        where: { id: v.id },
        data: updateData,
      });
      enriched++;
    }
  }
  console.log(`Enriched ${enriched} existing verses`);

  // ── Step 3: Create verses for today through 21 days out ─────────────────
  let created = 0;
  for (let dayOffset = 0; dayOffset <= 21; dayOffset++) {
    const targetDate = new Date(today);
    targetDate.setUTCDate(targetDate.getUTCDate() + dayOffset);

    const dateStr = targetDate.toISOString().split("T")[0];

    const existing = await prisma.dailyVerse.findFirst({
      where: {
        displayDate: {
          gte: new Date(dateStr + "T00:00:00.000Z"),
          lt: new Date(dateStr + "T23:59:59.999Z"),
        },
      },
    });

    if (existing) continue;

    const libIndex = dayOffset % verseLibrary.length;
    const lib = verseLibrary[libIndex];

    await prisma.dailyVerse.create({
      data: {
        bookName: lib.bookName,
        chapter: BigInt(lib.chapter),
        verseNumber: BigInt(lib.verseNumber),
        bibleVersion: lib.bibleVersion || "NKJ",
        displayDate: targetDate,
        displayTime: null,
        reflection: lib.verseText || null,
        explanation: lib.explanation || null,
        application: lib.application || null,
        verseIntroduction: lib.verseIntroduction || null,
        backgroundAuthor: lib.backgroundAuthor || null,
        backgroundBook: lib.backgroundBook || null,
        backgroundContext: lib.backgroundContext || null,
        wordStudies: lib.wordStudies || null,
        practicalApplications: lib.practicalApplications || null,
        keyThemes: lib.keyThemes || null,
        crossReferences: lib.crossReferences || null,
        finalThoughts: lib.finalThoughts || null,
        takeaways: lib.takeaways || null,
        learnMore: lib.learnMore || null,
        createdBy: adminId,
        isPublished: true,
      },
    });
    created++;
  }
  console.log(`Created ${created} new verses`);

  // ── Summary ─────────────────────────────────────────────────────────────
  const finalCount = await prisma.dailyVerse.count();
  const threeWeekEnd = new Date(today);
  threeWeekEnd.setUTCDate(threeWeekEnd.getUTCDate() + 21);

  const inRange = await prisma.dailyVerse.findMany({
    where: { displayDate: { gte: today, lte: threeWeekEnd }, isPublished: true },
  });

  const FULL_FIELDS = [
    "explanation", "application", "verseIntroduction",
    "backgroundAuthor", "backgroundBook", "backgroundContext",
    "wordStudies", "practicalApplications", "keyThemes",
    "crossReferences", "finalThoughts", "takeaways",
  ];
  let fullCount = 0;
  for (const v of inRange) {
    if (FULL_FIELDS.every((f) => v[f])) fullCount++;
  }

  console.log(`\n=== Daily Verse Enrichment Complete ===`);
  console.log(`Total in DB: ${finalCount}`);
  console.log(`Published in next 3 weeks: ${inRange.length}`);
  console.log(`Fully populated: ${fullCount}/${inRange.length}`);
  console.log(`Date range: ${today.toISOString().split("T")[0]} → ${threeWeekEnd.toISOString().split("T")[0]}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
