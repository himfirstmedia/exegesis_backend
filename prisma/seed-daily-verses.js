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
    displayDate: dateAtMidnight(1),
    reflection:
      "God's love is the foundation of our faith. He gave His only Son so that we might have eternal life through faith in Him.",
    explanation:
      "Often called 'the Gospel in a nutshell,' this verse summarizes the entire message of salvation. It reveals God's motivation is love — not merely an abstract attribute but a self-giving, sacrificial love that initiated salvation before any human response. The scope of God's love is universal: 'the world,' meaning all humanity without distinction. The gift of God's 'only begotten Son' emphasizes the immeasurable cost of redemption. Faith is the sole condition for receiving eternal life — not works, not heritage, not religious observance. This verse establishes the divine initiative in salvation while affirming human responsibility to believe.",
    learnMore: "https://www.biblegateway.com/passage/?search=John+3%3A16&version=KJV",
  },
  {
    bookName: "Jeremiah",
    chapter: 29,
    verseNumber: 11,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(2),
    reflection:
      "God has good plans for your life — plans to prosper you and give you hope and a future. Trust in His timing and purpose.",
    explanation:
      "This verse, part of Jeremiah's letter to the exiles in Babylon, assures us that God's plans are comprehensive and trustworthy. The 'plans to prosper you' refer to God's covenant faithfulness to preserve and restore His people according to His redemptive purposes. The 'hope and a future' ultimately point forward to the coming of Christ. Written during a time of judgment and displacement, this promise demonstrates that God's purposes extend beyond immediate circumstances. It reminds believers that divine discipline is never the final word — restoration always follows repentance.",
    learnMore: "https://www.biblegateway.com/passage/?search=Jeremiah+29%3A11&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 23,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(3),
    reflection:
      "The Lord is our Shepherd — He guides, provides, and protects. With Him, we lack nothing.",
    explanation:
      "This beloved psalm opens with the tender metaphor of the Lord as a shepherd. In ancient Israel, shepherds were known for their intimate care, guidance, and protection of their sheep. By declaring 'I shall not want,' David expresses complete trust in God's provision. This opening verse sets the stage for the entire psalm, portraying a life of peace, security, and blessing that flows from trusting in the Good Shepherd. The shepherd imagery anticipates Christ's own declaration, 'I am the good shepherd,' connecting the Old Testament picture to its New Testament fulfillment.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+23&version=KJV",
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 13,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(4),
    reflection:
      "Through Christ who strengthens us, we can face any circumstance with contentment and faith.",
    explanation:
      "Paul writes from prison, having learned to be content in every circumstance. 'I can do all things' is not about accomplishing any goal we set for ourselves, but about being enabled by Christ to face any circumstance with contentment and faithfulness. The secret is not self-confidence but Christ-dependence: the strength to persevere comes not from within but from Christ who empowers us. Paul had experienced both abundance and need, and in both he found Christ sufficient. This verse is a declaration of divine enablement for endurance, not a promise of unlimited personal achievement.",
    learnMore: "https://www.biblegateway.com/passage/?search=Philippians+4%3A13&version=KJV",
  },
  {
    bookName: "Romans",
    chapter: 8,
    verseNumber: 28,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(5),
    reflection:
      "God works all things together for the good of those who love Him and are called according to His purpose.",
    explanation:
      "This verse stands as one of the most comforting promises in all of Scripture. The promise that 'all things work together for good' assures us that God, in His sovereignty, is able to weave even the most painful circumstances into His redemptive purposes. The 'good' referred to is being conformed to the likeness of Christ. This verse does not promise that all things will work out according to our preferences, but that God will use all things to accomplish our ultimate good: Christlikeness and eternal glory. The condition 'to those who love God and are called according to His purpose' situates this promise within the context of a covenant relationship.",
    learnMore: "https://www.biblegateway.com/passage/?search=Romans+8%3A28&version=KJV",
  },
  {
    bookName: "Proverbs",
    chapter: 3,
    verseNumber: 5,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(6),
    reflection:
      "Trust in the Lord completely, not relying on your own understanding. He will direct your paths.",
    explanation:
      "This wisdom saying strikes at the heart of human self-sufficiency. To 'trust in the Lord with all your heart' means to rely completely on God's character, promises, and providence rather than on human understanding, which is inherently limited. The heart in Hebrew thought represents the whole inner person — mind, will, emotions, and intentions. Therefore, trusting with 'all your heart' demands total, undivided commitment. The contrast between divine trust and human understanding highlights the fundamental choice facing every believer: will we lean on our limited perspective or rest in God's infinite wisdom?",
    learnMore: "https://www.biblegateway.com/passage/?search=Proverbs+3%3A5&version=KJV",
  },
  {
    bookName: "2 Corinthians",
    chapter: 5,
    verseNumber: 17,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(7),
    reflection:
      "In Christ, you are a new creation. The old has passed away — behold, the new has come!",
    explanation:
      "Paul declares the transformative power of union with Christ. Being 'in Christ' is the central reality of the Christian life — a spiritual union that brings about an entirely new creation. The old order of life dominated by sin, guilt, and spiritual death has passed away. This is not merely moral improvement but a genuine new creation. This transformation affects every aspect of the believer's identity: old patterns of thinking, old allegiances are replaced by the new reality of life in Christ. The new creation is both a present reality and a future hope, already inaugurated but awaiting full consummation.",
    learnMore: "https://www.biblegateway.com/passage/?search=2+Corinthians+5%3A17&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 119,
    verseNumber: 105,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(8),
    reflection:
      "God's Word is a lamp that guides our steps and a light that illuminates our path. Walk in its light today.",
    explanation:
      "This verse from the longest psalm in Scripture celebrates the guiding power of God's Word. The metaphor of a lamp and light emphasizes both immediate illumination for the next step and broader guidance for life's journey. Ancient travelers depended on lamps to navigate dark paths — similarly, believers depend on Scripture to navigate a fallen world. The verse implies that without God's Word we walk in darkness, unable to see dangers or discern the right way. It affirms that Scripture is not merely informative but transformative, providing practical guidance for daily living.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+119%3A105&version=KJV",
  },
  {
    bookName: "Isaiah",
    chapter: 40,
    verseNumber: 31,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(9),
    reflection:
      "Those who wait on the Lord will be renewed with strength to rise above life's challenges. Trust in His timing.",
    explanation:
      "This verse comes from a section of Isaiah that proclaims comfort and hope to God's people in exile. 'Waiting on the Lord' does not mean passive resignation but active, expectant trust in God's promises. The promise of renewed strength pictures an eagle soaring effortlessly on thermal currents — not struggling but being carried by the wind of the Spirit. This renewal is promised to those who recognize their own limitations and depend fully on God's power. The progression from 'mount up with wings' to 'run and not be weary' to 'walk and not faint' covers every pace of life, from soaring victories to steady endurance.",
    learnMore: "https://www.biblegateway.com/passage/?search=Isaiah+40%3A31&version=KJV",
  },
  {
    bookName: "Joshua",
    chapter: 1,
    verseNumber: 9,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(10),
    reflection:
      "Be strong and courageous — God is with you wherever you go. Fear has no place in the presence of the Almighty.",
    explanation:
      "God spoke these words to Joshua as he prepared to lead Israel into the Promised Land after Moses' death. The command 'be strong and of a good courage' is repeated three times in this chapter, underscoring its importance. The basis for this courage is not Joshua's natural abilities but the promise of God's presence: 'the Lord thy God is with thee whithersoever thou goest.' This verse connects divine empowerment with human responsibility — God's presence does not eliminate the need for courage but provides the foundation for it. Every believer faces unknown territories, and this promise applies to all who step out in faith.",
    learnMore: "https://www.biblegateway.com/passage/?search=Joshua+1%3A9&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 46,
    verseNumber: 10,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(11),
    reflection:
      "Be still and know that He is God. In the chaos of life, pause and remember who holds all things together.",
    explanation:
      "This verse calls believers to cease from striving and recognize God's sovereign authority. 'Be still' translates the Hebrew word raphah, meaning to let go, relax, or surrender. It is an invitation to stop trusting in human effort and acknowledge that God alone is God. The context of Psalm 46 depicts nations in uproar and kingdoms falling — yet God remains a refuge and fortress. This command is both a comfort and a challenge: comfort because God is in control, and challenge because we must release our grip on the illusion of control. True peace begins when we stop trying to be God and let Him be God.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+46%3A10&version=KJV",
  },
  {
    bookName: "Matthew",
    chapter: 11,
    verseNumber: 28,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(12),
    reflection:
      "Jesus invites all who are weary and burdened to come to Him for rest. Lay down your heavy load at His feet.",
    explanation:
      "This tender invitation from Jesus comes immediately after His declaration that the Father has revealed truth to 'babes' rather than the wise and prudent. The 'labor and heavy laden' refers to those burdened by the weight of religious legalism, sin, and life's hardships. Jesus does not merely offer sympathy but promises genuine rest — rest from the exhausting effort of earning salvation through works. The invitation is universal: 'come unto me, all ye.' This verse reveals the heart of Christ as compassionate and accessible, contrasting with the religious leaders who loaded people with burdens they themselves would not bear.",
    learnMore: "https://www.biblegateway.com/passage/?search=Matthew+11%3A28&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 37,
    verseNumber: 4,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(13),
    reflection:
      "When you delight yourself in the Lord, He transforms your desires to align with His will. Find your joy in Him.",
    explanation:
      "This verse reveals a profound spiritual principle: as we delight in God, our desires are gradually conformed to His. The word 'delight' implies taking great pleasure in, finding satisfaction in, and making God the object of our deepest affections. The promise 'He shall give thee the desires of thine heart' is not a blank check for selfish wishes but a promise that when our hearts are aligned with God's, what we desire will be what He desires to give. This transformation of desire is the work of the Holy Spirit sanctifying our affections. The verse connects joy in God with the fulfillment of redirected, purified longings.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+37%3A4&version=KJV",
  },
  {
    bookName: "Romans",
    chapter: 8,
    verseNumber: 31,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(14),
    reflection:
      "If God is for us, no one can successfully stand against us. His support outweighs all opposition.",
    explanation:
      "Paul poses this rhetorical question at the climax of his argument about God's unwavering commitment to His people. The logic is irrefutable: if the sovereign Creator who did not spare His own Son is for us, what possible opposition could prevail? This verse does not promise the absence of opposition but the certainty of victory through God's power. The 'for us' language echoes the covenant formula 'I will be your God and you will be My people.' Paul is building a case for the believer's complete security in Christ, grounded in the Father's sacrificial love demonstrated at the cross.",
    learnMore: "https://www.biblegateway.com/passage/?search=Romans+8%3A31&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 27,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(15),
    reflection:
      "The Lord is your light, salvation, and stronghold. Whom shall you fear when He is your defender?",
    explanation:
      "David opens this psalm with a triple declaration of confidence: the Lord is light, salvation, and strength. Light represents truth, guidance, and the dispelling of darkness and confusion. Salvation points to deliverance from enemies and, ultimately, from sin and death. Strength (or stronghold) depicts God as a secure fortress against every attack. The rhetorical question 'whom shall I fear?' challenges the rationality of fear when God is on our side. This verse establishes the theme of courageous trust that runs throughout the psalm, demonstrating that fear is overcome not by denying danger but by magnifying God's greatness.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+27%3A1&version=KJV",
  },
  {
    bookName: "John",
    chapter: 14,
    verseNumber: 6,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(16),
    reflection:
      "Jesus is the only way to the Father, the ultimate truth, and the source of eternal life. There is no other path.",
    explanation:
      "Jesus makes one of the most exclusive claims in all of religious history: He alone is the way, the truth, and the life. This declaration comes in response to Thomas's question about knowing the way to the Father. 'The way' indicates that Jesus is the path to God, not merely a guide who shows the path. 'The truth' presents Jesus as the embodiment of divine reality, the full revelation of God. 'The life' points to His power to grant eternal life. The phrase 'no man cometh unto the Father but by me' establishes the absolute necessity of Christ as mediator between God and humanity.",
    learnMore: "https://www.biblegateway.com/passage/?search=John+14%3A6&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 34,
    verseNumber: 8,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(17),
    reflection:
      "Taste and see that the Lord is good — experience His goodness for yourself. Those who take refuge in Him are blessed.",
    explanation:
      "This verse uses vivid sensory language to invite personal experience of God's goodness. The word 'taste' suggests intimate, personal knowledge rather than distant observation — one cannot know the flavor of food by watching others eat. The invitation to 'see' emphasizes that experiential knowledge of God leads to understanding and faith. The verb forms imply an ongoing, repeated experience of God's goodness. The second half of the verse pronounces a blessing on those who 'trust in Him,' connecting experiential knowledge of God's goodness with the security found in taking refuge in Him. Faith is both tasted and trusted.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+34%3A8&version=KJV",
  },
  {
    bookName: "Romans",
    chapter: 15,
    verseNumber: 13,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(18),
    reflection:
      "May the God of hope fill you with joy and peace as you trust in Him. Let hope overflow in your life by the Holy Spirit.",
    explanation:
      "Paul concludes a section on unity and mutual encouragement with this beautiful benediction. He addresses God as 'the God of hope,' a title that encapsulates the forward-looking nature of Christian faith. The prayer is that believers would be filled with 'all joy and peace in believing' — joy and peace that are not dependent on circumstances but flow from faith. The phrase 'abound in hope' suggests an overflowing, superabundant confidence in God's promises. Paul grounds this hope in 'the power of the Holy Ghost,' indicating that supernatural hope is a fruit of the Spirit's work in the believer's life.",
    learnMore: "https://www.biblegateway.com/passage/?search=Romans+15%3A13&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 121,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(19),
    reflection:
      "Our help comes from the Lord, the Maker of heaven and earth. Lift your eyes to Him who never slumbers.",
    explanation:
      "This pilgrim psalm begins with the psalmist looking up to the hills — likely the hills surrounding Jerusalem, the destination of pilgrimage. The question 'from whence cometh my help' reflects the human experience of needing assistance beyond our own resources. The answer is decisive: 'my help cometh from the Lord, which made heaven and earth.' By identifying God as Creator, the psalmist grounds all hope in God's sovereign power over all creation. This opening establishes the theme of divine protection that continues through the psalm: the One who keeps Israel neither slumbers nor sleeps, watching over His people eternally.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+121%3A1&version=KJV",
  },
  {
    bookName: "Galatians",
    chapter: 5,
    verseNumber: 22,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(20),
    reflection:
      "The fruit of the Spirit — love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control — grows in those who walk by the Spirit.",
    explanation:
      "Paul contrasts the fruit of the Spirit with the works of the flesh, presenting nine virtues that characterize a life lived in step with the Holy Spirit. Unlike the gifts of the Spirit, which are distributed variously, the fruit is to be cultivated in every believer. The singular 'fruit' (not 'fruits') suggests these nine qualities form a unified character produced by the Spirit. These virtues reflect the character of Christ Himself, who perfectly exemplified each one. The fruit is not produced by human effort but by abiding in Christ — yet believers cooperate with the Spirit through obedience and spiritual disciplines.",
    learnMore: "https://www.biblegateway.com/passage/?search=Galatians+5%3A22&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 103,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(21),
    reflection:
      "Bless the Lord with all your soul and remember His benefits. Let your whole being rise in grateful worship.",
    explanation:
      "David calls his own soul to worship, commanding every part of his being to bless the Lord. The repetition of 'all that is within me' emphasizes wholehearted, undivided devotion. This self-directed call to worship acknowledges that our souls can become distracted and need to be summoned back to gratitude. The phrase 'forget not all His benefits' anticipates the catalog of blessings that follows: forgiveness, healing, redemption, crowning with lovingkindness, and renewal. The psalm teaches that worship is both a spontaneous response to God's goodness and a discipline of remembering His works.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+103%3A1&version=KJV",
  },
  {
    bookName: "Matthew",
    chapter: 6,
    verseNumber: 33,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(22),
    reflection:
      "Seek God's kingdom and righteousness first, and He will provide all you need. Prioritize what matters eternally.",
    explanation:
      "Jesus concludes His teaching about worry and material needs with this foundational principle. 'Seek ye first the kingdom of God' means making God's rule and reign the primary pursuit of your life — not one priority among many but the priority that orders all others. The promise 'all these things shall be added unto you' refers to the basic necessities that the preceding verses address: food, drink, and clothing. Jesus is not promising wealth but provision for those who prioritize God's kingdom. This verse challenges the anxiety that comes from trusting in material resources rather than in the heavenly Father who knows our needs.",
    learnMore: "https://www.biblegateway.com/passage/?search=Matthew+6%3A33&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 136,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(23),
    reflection:
      "Give thanks to the Lord, for He is good. His steadfast love endures forever — a refrain that never grows old.",
    explanation:
      "This psalm opens with a threefold call to thanksgiving, each line ending with the refrain 'for His mercy endureth for ever.' The Hebrew word chesed, translated 'mercy' or 'lovingkindness,' describes God's covenant faithfulness and steadfast love. This refrain is repeated twenty-six times throughout the psalm, creating a liturgical call-and-response pattern. Each verse recounts a different aspect of God's mighty works — creation, deliverance from Egypt, conquest of the Promised Land — and attributes them all to His enduring love. The repetition teaches that every act of God, from creation to providence to redemption, flows from His faithful, covenant-keeping love.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+136%3A1&version=KJV",
  },
  {
    bookName: "Romans",
    chapter: 12,
    verseNumber: 2,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(24),
    reflection:
      "Do not conform to the world's patterns — be transformed by renewing your mind. Let God reshape how you think.",
    explanation:
      "Paul issues a radical call to non-conformity and transformation. 'Be not conformed to this world' commands believers to resist the pressure to adopt the values, priorities, and thinking patterns of the fallen world system. The alternative is transformation through 'the renewing of your mind' — a fundamental reshaping of how we think, perceive, and evaluate. This renewal is the work of the Holy Spirit through Scripture, prayer, and the community of faith. The purpose of this transformation is 'that ye may prove what is that good, and acceptable, and perfect will of God' — to discern and live out God's will in every area of life.",
    learnMore: "https://www.biblegateway.com/passage/?search=Romans+12%3A2&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 19,
    verseNumber: 14,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(25),
    reflection:
      "Let the words of your mouth and the meditation of your heart be acceptable in God's sight. He is your Rock and Redeemer.",
    explanation:
      "David closes this majestic psalm with a prayer for personal holiness. He recognizes that true worship involves both external speech ('words of my mouth') and internal devotion ('meditation of my heart'). The psalm moves from general revelation in creation (verses 1-6) to special revelation in Scripture (verses 7-11) to personal application (verses 12-14). By asking that his words and thoughts be 'acceptable' — the same Hebrew word used for acceptable sacrifices — David presents his inner and outer life as an offering to God. Addressing God as 'my strength and my redeemer' combines the concepts of security and salvation.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+19%3A14&version=KJV",
  },
  {
    bookName: "John",
    chapter: 10,
    verseNumber: 10,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(26),
    reflection:
      "Jesus came to give you abundant life — not mere existence, but life overflowing with purpose and joy.",
    explanation:
      "Jesus contrasts His mission with the thief's purpose: the thief comes to steal, kill, and destroy, but Christ comes to give life in abundance. The 'abundant life' is not primarily material prosperity but the full, rich, eternal quality of life that flows from knowing God through Christ. This life includes forgiveness of sins, adoption as children of God, the indwelling of the Holy Spirit, and the hope of resurrection. The contrast highlights the destructive intent of Satan versus the life-giving purpose of Christ. Abundant life is both a present possession and a future hope, experienced now in part and fully at Christ's return.",
    learnMore: "https://www.biblegateway.com/passage/?search=John+10%3A10&version=KJV",
  },
  {
    bookName: "1 Peter",
    chapter: 5,
    verseNumber: 7,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(27),
    reflection:
      "Cast all your anxiety on God because He cares for you deeply. You do not need to carry your burdens alone.",
    explanation:
      "Peter instructs believers to cast 'all' their care upon God — not some worries, not the big ones only, but every anxiety and concern. The verb 'casting' suggests a deliberate, active transfer of burdens from ourselves to God. The reason for this command is God's character: 'for He careth for you.' God's care is not abstract or distant but personal and affectionate. This verse follows Peter's call to humility and stands in the context of suffering and persecution. The same God who is sovereign over all things is also intimately concerned with every detail of His children's lives.",
    learnMore: "https://www.biblegateway.com/passage/?search=1+Peter+5%3A7&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 91,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(28),
    reflection:
      "Those who dwell in the shelter of the Most High find rest under His shadow. He is your refuge and fortress.",
    explanation:
      "This psalm opens with a beautiful picture of security and protection. 'He that dwelleth in the secret place of the most High' refers to the one who makes God their habitation — not a visitor but a resident in God's presence. 'The shadow of the Almighty' evokes the image of a great bird sheltering its young under its wings, conveying both protection and intimacy. The parallel structure of the verse emphasizes that dwelling with God leads to abiding in His protection. This psalm promises supernatural protection to those who make God their refuge, though it is not a promise of a trouble-free life but of God's presence through every trial.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+91%3A1&version=KJV",
  },
  {
    bookName: "Ephesians",
    chapter: 2,
    verseNumber: 8,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(29),
    reflection:
      "You are saved by grace through faith — it is God's gift, not your own doing. Receive His grace with humble gratitude.",
    explanation:
      "Paul articulates the heart of the gospel with unsurpassed clarity: salvation is entirely God's work. 'Grace' is unmerited favor — God's goodness extended to those who deserve judgment. 'Faith' is the instrument, not the basis, of salvation — we are saved through faith, not because of faith. The phrase 'that not of yourselves: it is the gift of God' eliminates any ground for human boasting. Grace and faith together exclude works from the ground of salvation while including them as the evidence of salvation, as the next verse clarifies. This verse is the cornerstone of the Reformation's solas: sola gratia, sola fide, solus Christus.",
    learnMore: "https://www.biblegateway.com/passage/?search=Ephesians+2%3A8&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 150,
    verseNumber: 6,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(30),
    reflection:
      "Everything that has breath should praise the Lord. Let your life be a continuous offering of praise to your Creator.",
    explanation:
      "The final verse of the Psalter is a universal call to praise. 'Everything that hath breath' encompasses all living creatures — every human being endowed with the breath of life is summoned to use that breath for praise. This verse is the culmination of the five-book collection of psalms, bringing the entire Psalter to a fitting climax. The imperative 'praise ye the Lord' is the Hebrew hallelujah — a word that combines the verb 'praise' with the covenant name of God. The psalm teaches that praise is not optional but the appropriate response of every creature to the Creator who gives and sustains life itself.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+150%3A6&version=KJV",
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 6,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(31),
    reflection:
      "Do not be anxious — bring everything to God in prayer with thanksgiving. His peace will guard your heart and mind.",
    explanation:
      "Paul addresses the universal human struggle with anxiety by prescribing the antidote: prayer. He uses three overlapping terms — 'prayer,' 'supplication,' and 'thanksgiving' — to cover every mode of communication with God. 'Be careful for nothing' is a command against anxiety, not a suggestion. The phrase 'in every thing by prayer and supplication with thanksgiving' leaves no area of life outside the scope of prayer. The promised result is the 'peace of God, which passeth all understanding' — a supernatural peace that transcends human comprehension and circumstances. This peace acts as a sentinel, guarding both the mind and the emotions in Christ Jesus.",
    learnMore: "https://www.biblegateway.com/passage/?search=Philippians+4%3A6&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 136,
    verseNumber: 26,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(32),
    reflection:
      "Give thanks to the God of heaven, for His steadfast love endures forever. Let gratitude be the rhythm of your life.",
    explanation:
      "This final verse of Psalm 136 repeats the refrain that has anchored every line of the psalm: 'for His mercy endureth for ever.' The psalm concludes by addressing God as 'the God of heaven,' emphasizing His sovereignty over all creation. The cumulative effect of the twenty-six repetitions of the refrain is to impress upon the worshiper that every aspect of God's character and every act of His hand is motivated by enduring, covenant love. This psalm was likely used in corporate worship as a call-and-response, with a leader reciting each line and the congregation responding with the refrain. Thanksgiving is the appropriate response to God's steadfast, never-ending love.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+136%3A26&version=KJV",
  },
  {
    bookName: "Hebrews",
    chapter: 11,
    verseNumber: 1,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(33),
    reflection:
      "Faith is the assurance of things hoped for and the conviction of things not seen. Trust in what God has promised.",
    explanation:
      "The author of Hebrews provides the Bible's most concise definition of faith. 'The substance of things hoped for' presents faith as the solid foundation underlying our confident expectation of God's promises. 'The evidence of things not seen' portrays faith as the proof or conviction that makes invisible spiritual realities as certain as visible ones. Faith is not wishful thinking but confident trust grounded in God's character and promises. This definition introduces the great 'hall of faith' chapter, which catalogs Old Testament figures who lived by faith. True faith has both intellectual content (believing certain truths about God) and personal trust (relying on God Himself).",
    learnMore: "https://www.biblegateway.com/passage/?search=Hebrews+11%3A1&version=KJV",
  },
  {
    bookName: "Psalms",
    chapter: 118,
    verseNumber: 24,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(34),
    reflection:
      "This is the day the Lord has made — rejoice and be glad in it. Each day is a gift from His hand.",
    explanation:
      "This verse calls believers to recognize each day as a divine creation and to respond with rejoicing. The context is a victory psalm celebrating God's deliverance — the stone rejected by the builders has become the chief cornerstone, a verse Jesus would apply to Himself. The declaration that 'the Lord hath made' this day affirms God's sovereignty over time and history. The imperative to 'rejoice and be glad' is not dependent on circumstances but on the reality of God's goodness and faithfulness. This verse has been a source of strength for countless believers facing difficult days, reminding them that every day is an opportunity to experience God's grace.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+118%3A24&version=KJV",
  },
  {
    bookName: "1 John",
    chapter: 4,
    verseNumber: 19,
    bibleVersion: "KJV",
    displayDate: dateAtMidnight(35),
    reflection:
      "We love because God first loved us. Our love for others is simply a response to His amazing love for us.",
    explanation:
      "John states the foundational truth of Christian love: God is the initiator, and our love is always a response. 'We love' — the object is left unspecified, encompassing both love for God and love for others. The ground and motive of all genuine love is God's prior love for us. This verse confronts the natural tendency to think we initiate our relationship with God. It also provides the pattern for human relationships: we are called to love others the way God has loved us — sacrificially, unconditionally, and without regard for merit. The verse is simple but profound, summarizing the entire message of the letter.",
    learnMore: "https://www.biblegateway.com/passage/?search=1+John+4%3A19&version=KJV",
  },
];

const main = async () => {
  console.log("🌱 Seeding 35 daily verses for the month ahead...\n");

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
