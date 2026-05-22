import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const explanations = [
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 1,
    explanation:
      "This foundational verse declares that God is the eternal, sovereign Creator of all that exists. The Hebrew word for God used here is 'Elohim,' a plural form that hints at the triune nature of God — Father, Son, and Holy Spirit — while the verb 'created' (bara) is singular, affirming the unity of God. The phrase 'the heavens and the earth' is a merism encompassing the entire universe, from the spiritual realm to the physical world. This verse stands in stark contrast to ancient pagan creation myths which describe creation as a struggle between competing deities. Instead, Genesis presents a transcendent God who speaks creation into existence by His sovereign will, establishing the foundation for a biblical worldview that affirms the goodness, order, and purpose of the material world.",
    learnMore: "https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 3,
    explanation:
      "As God's first creative command, 'Let there be light' demonstrates that God creates by the power of His spoken word — a theme that resonates throughout Scripture (Psalm 33:6, Hebrews 11:3). This light, created before the sun and moon on the fourth day, is not merely physical illumination but signifies the beginning of order, beauty, and distinction in creation. The separation of light from darkness establishes the foundational pattern of differentiation that characterizes the entire creation week. Theologians have noted that this first creative act foreshadows the coming of Christ, who is described as 'the Light of the world' (John 8:12), and the new creation where God's people will walk in His light forever (Revelation 21:23-24).",
    learnMore: "https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Exodus",
    chapter: 20,
    verseNumber: 3,
    explanation:
      "This is the first of the Ten Commandments and establishes the foundational principle of exclusive loyalty to Yahweh. In the ancient Near Eastern context, polytheism was the norm, and each nation had its own patron deities. God's command 'You shall have no other gods before Me' demands not merely monotheistic belief but wholehearted covenant loyalty. The Hebrew phrase 'before Me' can also be translated 'besides Me' or 'in My presence,' emphasizing that God recognizes no rivals and will not share His glory with another. This commandment sets the tone for the entire Decalogue and establishes the fundamental relationship between God and His people — one of exclusive devotion, trust, and obedience.",
    learnMore: "https://www.biblegateway.com/passage/?search=Exodus+20&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Psalms",
    chapter: 23,
    verseNumber: 1,
    explanation:
      "This beloved psalm opens with the tender metaphor of the Lord as a shepherd, a image deeply familiar to David's original audience. In ancient Israel, shepherds were known for their intimate care, guidance, and protection of their sheep — animals that are completely dependent on their keeper for survival. By declaring 'I shall not want,' David expresses complete trust in God's provision, echoing God's faithfulness to Israel during their wilderness journey when He provided manna, water, and guidance. The personal pronoun 'my' makes this not just a general theological truth but a deeply personal relationship. This opening verse sets the stage for the entire psalm, which portrays a life of peace, security, and blessing that flows from trusting in the Good Shepherd — a title Jesus later applies to Himself in John 10, identifying Himself as the fulfillment of this ancient promise.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+23&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2, 3]',
  },
  {
    bookName: "Psalms",
    chapter: 119,
    verseNumber: 105,
    explanation:
      "This poetic verse uses the vivid imagery of light to describe the transformative power of God's Word in guiding human life. In ancient times, travelers would carry a lamp to illuminate their immediate steps and a larger torch or lantern to see the path ahead. Similarly, God's Word provides both immediate guidance for today's decisions ('a lamp to my feet') and broader direction for life's journey ('a light to my path'). This metaphor emphasizes that Scripture is not merely informational but practical and directional — it illuminates the moral and spiritual landscape, revealing pitfalls, showing the right way, and exposing the deceptions of sin. The verse also implies human inadequacy without divine revelation: we walk in darkness apart from God's Word, needing constant illumination to navigate the complexities of life in a fallen world.",
    learnMore: "https://www.biblegateway.com/passage/?search=Psalm+119&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Proverbs",
    chapter: 3,
    verseNumber: 5,
    explanation:
      "This wisdom saying strikes at the heart of human self-sufficiency and pride. To 'trust in the Lord with all your heart' means to rely completely on God's character, promises, and providence rather than on human understanding, which is inherently limited and corrupted by sin. The heart in Hebrew thought represents the whole inner person — mind, will, emotions, and intentions. Therefore, trusting with 'all your heart' demands total, undivided commitment. The second line, 'lean not on your own understanding,' does not forbid the use of reason but warns against making human reason the ultimate arbiter of truth and wisdom. This proverb calls believers to a posture of humble dependence, acknowledging that God's ways are higher than our ways and that true wisdom begins with the fear of the Lord (Proverbs 9:10).",
    learnMore: "https://www.biblegateway.com/passage/?search=Proverbs+3&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Isaiah",
    chapter: 40,
    verseNumber: 31,
    explanation:
      "Written to a people in exile who felt abandoned by God, this verse offers profound hope and encouragement. The metaphor of mounting up with wings like eagles draws from the observation of eagles soaring on thermal currents with seemingly effortless grace. Unlike smaller birds that constantly flap their wings, eagles catch the wind and rise above the storm. Similarly, those who 'wait upon the Lord' — the Hebrew word 'qavah' implies active, expectant waiting filled with hope and trust — receive supernatural strength that enables them to rise above life's difficulties. The progression from 'mount up' to 'run' to 'walk' is significant: faith does not always produce dramatic experiences; sometimes it provides the steady endurance needed for the ordinary, ongoing challenges of daily life. This verse assured Israel that God had not forgotten them and that those who trust in Him would find renewed strength to persevere.",
    learnMore: "https://www.biblegateway.com/passage/?search=Isaiah+40&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[3]',
  },
  {
    bookName: "Jeremiah",
    chapter: 29,
    verseNumber: 11,
    explanation:
      "This verse, part of Jeremiah's letter to the exiles in Babylon, has become one of the most quoted assurances of God's benevolent intentions toward His people. However, its original context is crucial for proper interpretation. God was speaking to a community facing 70 years of exile — not an immediate deliverance but a long-term plan involving judgment, discipline, and eventual restoration. The 'plans to prosper you' refer not to material prosperity in the modern sense but to God's covenant faithfulness to preserve and restore His people according to His redemptive purposes. The 'hope and a future' ultimately point forward to the coming of Christ and the establishment of the new covenant. This verse teaches that God's plans are comprehensive and trustworthy, working through both difficult circumstances and seasons of blessing to accomplish His good purposes for His people.",
    learnMore: "https://www.biblegateway.com/passage/?search=Jeremiah+29&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[3]',
  },
  {
    bookName: "John",
    chapter: 1,
    verseNumber: 1,
    explanation:
      "John's prologue opens with a profound theological declaration that echoes Genesis 1:1 while revealing the fuller identity of Jesus Christ. The term 'Logos' (Word) would resonate with both Jewish and Greek audiences: for Jews, it connected to the creative power of God's word and the personification of wisdom in Proverbs 8; for Greeks, it represented the rational principle that orders the universe. John's radical claim is that this Logos is not merely a concept but a divine Person — Jesus Christ — who has always existed in eternal relationship with God the Father and is Himself fully God. The phrase 'was with God' indicates distinct personhood within the Godhead, while 'was God' affirms His full deity. This verse establishes the foundation for the doctrine of the Trinity and the incarnation — that the eternal Word became flesh (verse 14) to dwell among us.",
    learnMore: "https://www.biblegateway.com/passage/?search=John+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2]',
  },
  {
    bookName: "John",
    chapter: 3,
    verseNumber: 16,
    explanation:
      "Often called 'the Gospel in a nutshell,' this verse summarizes the entire message of salvation in its most concentrated form. It reveals four essential truths about God and His plan of redemption. First, God's motivation is love — not merely an abstract attribute but a self-giving, sacrificial love that initiated salvation before any human response. Second, the scope of God's love is universal: 'the world,' meaning all humanity without distinction. Third, the cost of love is staggering: God 'gave His only begotten Son,' pointing to the incarnation and the cross as the ultimate expression of divine love. Fourth, the purpose of this gift is eternal life — not merely endless existence but a transformed quality of life in relationship with God that begins now and extends forever. The condition 'whoever believes' emphasizes that salvation is received through faith, making it accessible to anyone who trusts in Christ, regardless of background or merit.",
    learnMore: "https://www.biblegateway.com/passage/?search=John+3&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2, 3]',
  },
  {
    bookName: "Romans",
    chapter: 3,
    verseNumber: 23,
    explanation:
      "The Apostle Paul states the universal human condition with stark simplicity. 'All have sinned' means that every human being, without exception, has fallen short of God's moral standard. The Greek word for 'sin' (hamartia) originally meant 'to miss the mark,' like an archer failing to hit the target. Paul's point is that humanity was created to reflect God's glory — to live in perfect relationship with Him and to display His character — but sin has caused every person to fall short of this purpose. This verse establishes the universal need for salvation that Paul has been building toward in the first three chapters of Romans. Having demonstrated that both Jews and Gentiles are under sin, Paul levels the playing field: no one is righteous on their own merit. This diagnosis of the human condition is essential preparation for the remedy he presents in the following verses — justification by grace through faith in Jesus Christ.",
    learnMore: "https://www.biblegateway.com/passage/?search=Romans+3&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Romans",
    chapter: 8,
    verseNumber: 28,
    explanation:
      "This verse stands as one of the most comforting promises in all of Scripture, but it is often misunderstood. The promise that 'all things work together for good' is not a guarantee that everything that happens is good in itself, nor that believers will always be happy or comfortable. Rather, it assures us that God, in His sovereignty, is able to weave even the most painful and difficult circumstances into His redemptive purposes. The 'good' referred to here is defined in the next verse: being conformed to the likeness of Christ. The condition for this promise is love for God and being called according to His purpose — it is specifically for those who are in a covenant relationship with Him. This verse does not promise that all things will work out according to our preferences, but that God will use all things to accomplish our ultimate good: Christlikeness and eternal glory.",
    learnMore: "https://www.biblegateway.com/passage/?search=Romans+8&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2, 3]',
  },
  {
    bookName: "2 Corinthians",
    chapter: 5,
    verseNumber: 17,
    explanation:
      "Paul declares the transformative power of union with Christ. Being 'in Christ' is the central reality of the Christian life — a spiritual union that brings about an entirely new creation. The old order of life dominated by sin, guilt, and spiritual death has passed away, and something radically new has come into being. This is not merely moral improvement or religious reformation but a genuine new creation that is as fundamental as the original creation itself. The Greek word for 'new creation' (kaine ktisis) suggests something that is new in kind and quality, not just new in time. This transformation affects every aspect of the believer's identity: old patterns of thinking, old allegiances, old ways of relating to God and others are replaced by the new reality of life in Christ. This verse provides the foundation for Christian identity — we are not who we once were because we are united with Christ in His death and resurrection.",
    learnMore: "https://www.biblegateway.com/passage/?search=2+Corinthians+5&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 13,
    explanation:
      "This verse is often quoted as a mantra for personal achievement, but its original context reveals a much deeper meaning. Paul writes from prison, having endured hardship, persecution, and deprivation. He has just stated that he has learned to be content in every circumstance — whether well-fed or hungry, living in plenty or in need. In this context, 'I can do all things' is not about accomplishing any goal we set for ourselves, but about being enabled by Christ to face any circumstance with contentment and faithfulness. The 'all things' refers specifically to enduring both prosperity and adversity without losing faith or joy. Paul's secret is not self-confidence but Christ-dependence: the strength to persevere, to be content, and to maintain joy in every situation comes not from within but from Christ who empowers him. This verse calls believers to a radical dependence on Christ that transcends outward circumstances.",
    learnMore: "https://www.biblegateway.com/passage/?search=Philippians+4&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2, 3]',
  },
  {
    bookName: "Hebrews",
    chapter: 11,
    verseNumber: 1,
    explanation:
      "The author of Hebrews provides the most comprehensive definition of faith in Scripture. Faith is described in two complementary ways: as the 'substance of things hoped for' and the 'evidence of things not seen.' The Greek word for 'substance' (hypostasis) carries the idea of a foundation, a title deed, or the essential reality underlying something. Faith, then, is not wishful thinking but the confident assurance that brings future promises into present reality. Similarly, 'evidence' (elegchos) suggests proof or conviction — faith provides convincing proof of realities that cannot be empirically verified. This definition establishes that biblical faith is not a blind leap in the dark but a reasoned trust based on the character and faithfulness of God. The rest of Hebrews 11 provides a hall of fame of Old Testament figures who lived by this kind of faith, demonstrating that faith has always been the means by which God's people please Him and receive His promises.",
    learnMore: "https://www.biblegateway.com/passage/?search=Hebrews+11&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2]',
  },
  {
    bookName: "Revelation",
    chapter: 21,
    verseNumber: 4,
    explanation:
      "This verse paints the glorious climax of redemptive history — the final victory of God over sin, suffering, and death. John's vision of the new heaven and new earth culminates with God dwelling directly among His people, wiping away every tear from their eyes. The imagery is deeply personal and tender: God Himself will personally comfort His people, removing the very causes of their suffering. The four things listed — death, mourning, crying, and pain — encompass the totality of human misery that entered the world through sin. Their removal signals the complete reversal of the Fall and the restoration of creation to its intended state of shalom. The declaration that 'the former things have passed away' echoes Isaiah 43:18-19 and 65:17, where God promises to create a new heavens and a new earth. This promise provides hope and endurance for believers facing present suffering, assuring them that their pain is temporary and that God's ultimate purpose is complete restoration.",
    learnMore: "https://www.biblegateway.com/passage/?search=Revelation+21&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[3]',
  },
];

const main = async () => {
  console.log("Seeding verse explanations...");

  let created = 0;
  for (const exp of explanations) {
    try {
      await prisma.verseExplanation.upsert({
        where: {
          bookName_chapter_verseNumber: {
            bookName: exp.bookName,
            chapter: BigInt(exp.chapter),
            verseNumber: BigInt(exp.verseNumber),
          },
        },
        update: {
          explanation: exp.explanation,
          learnMore: exp.learnMore,
          bibleVersion: exp.bibleVersion,
          promptIds: exp.promptIds,
        },
        create: {
          bookName: exp.bookName,
          chapter: BigInt(exp.chapter),
          verseNumber: BigInt(exp.verseNumber),
          explanation: exp.explanation,
          learnMore: exp.learnMore,
          bibleVersion: exp.bibleVersion,
          promptIds: exp.promptIds,
          createdOn: new Date(),
        },
      });
      created++;
      console.log(`  ✓ ${exp.bookName} ${exp.chapter}:${exp.verseNumber}`);
    } catch (error) {
      console.error(`  ✗ ${exp.bookName} ${exp.chapter}:${exp.verseNumber} — ${error.message}`);
    }
  }

  console.log(`\nSeeded ${created} verse explanations.`);
};

main()
  .catch((e) => {
    console.error("Error seeding explanations:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
