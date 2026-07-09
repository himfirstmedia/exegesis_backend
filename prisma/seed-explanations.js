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
      `This foundational verse declares that God is the eternal, sovereign Creator of all that exists. The Hebrew word for God used here is 'Elohim,' a plural form that hints at the triune nature of God — Father, Son, and Holy Spirit — while the verb 'created' (bara) is singular, affirming the unity of God. The phrase 'the heavens and the earth' is a merism encompassing the entire universe, from the spiritual realm to the physical world. This verse stands in stark contrast to ancient pagan creation myths which describe creation as a struggle between competing deities. Instead, Genesis presents a transcendent God who speaks creation into existence by His sovereign will, establishing the foundation for a biblical worldview that affirms the goodness, order, and purpose of the material world.`,
    learnMore:
      `The doctrine of creation ex nihilo (creation out of nothing) is a cornerstone of Christian theology, affirmed by the early church fathers such as Irenaeus, Augustine, and Athanasius. Unlike Greek philosophers who believed in eternal matter or the Gnostics who viewed the material world as evil, Christianity has always maintained that God created the universe freely, out of nothing, by His word alone. This truth has profound implications for how we understand human dignity, the value of the physical world, and the basis for scientific inquiry. The phrase 'the heavens and the earth' is a merism — a figure of speech where two opposites encompass the whole, meaning everything that exists. For a deeper study of Genesis 1:1 in its original Hebrew context and how it compares with other ancient Near Eastern creation accounts, see the Berean Study Bible commentary and the works of Old Testament scholars like Gordon Wenham and John Walton at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 2,
    explanation:
      `This verse describes the initial state of creation as 'formless and void' (tohu wa-bohu in Hebrew) — not a chaotic or evil condition, but an unshaped, unpopulated raw material awaiting God's creative ordering. The deep waters (tehom) evoke the primordial oceans of ancient Near Eastern cosmology, but unlike neighboring creation myths where the sea represents a hostile chaos deity to be conquered, Genesis presents the deep as simply part of God's creation, passive and obedient before His word. The Spirit of God 'hovering' over the waters uses the Hebrew verb rachaph, which appears elsewhere only in Deuteronomy 32:11 where an eagle stirs up its nest and hovers over its young — an image of tender, life-giving care. This verse establishes that the Triune God was actively present and preparing to bring order, beauty, and life out of what was formless and empty.`,
    learnMore:
      `The Hebrew phrase 'tohu wa-bohu' appears in only one other place in the Old Testament — Jeremiah 4:23, where the prophet uses it to describe Judah's impending judgment as a return to primordial desolation. This connection reveals that God's judgment is a reversal of creation, while His salvation is a new creation. The Spirit's hovering (rachaph) is the same verb used in Deuteronomy 32:11 of an eagle stirring its nest, suggesting not passive presence but active, nurturing engagement. Early church fathers like Basil the Great in his Hexaemeron saw in this verse a revelation of the Trinity: the Father speaking, the Word creating, and the Spirit hovering. The 'deep' (tehom) connects etymologically to the Babylonian goddess Tiamat, yet Genesis deliberately demythologizes the sea. For more on the theological significance of the Spirit's role in creation, see the commentary by Derek Kidner and the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 3,
    explanation:
      `As God's first creative command, 'Let there be light' demonstrates that God creates by the power of His spoken word — a theme that resonates throughout Scripture (Psalm 33:6, Hebrews 11:3). This light, created before the sun and moon on the fourth day, is not merely physical illumination but signifies the beginning of order, beauty, and distinction in creation. The separation of light from darkness establishes the foundational pattern of differentiation that characterizes the entire creation week. Theologians have noted that this first creative act foreshadows the coming of Christ, who is described as 'the Light of the world' (John 8:12), and the new creation where God's people will walk in His light forever (Revelation 21:23-24).`,
    learnMore:
      `The light created on day one is distinct from the sun and moon created on day four, leading many theologians to identify this primordial light with the Shekinah glory of God — the same divine light that filled the tabernacle (Exodus 40:34), appeared to Moses on Mount Sinai (Exodus 34:29-35), and was manifest in the person of Jesus Christ at His transfiguration (Matthew 17:2). The Apostle Paul explicitly connects this creative light with the light of the gospel in 2 Corinthians 4:6: 'For God, who said, "Let light shine out of darkness," made His light shine in our hearts to give us the light of the knowledge of the glory of God in the face of Jesus Christ.' The Hebrew word for light appears over 200 times in the Old Testament and consistently carries moral and spiritual connotations beyond simple illumination. The rabbinic tradition understood this creation light as a special light that allowed Adam to see from one end of creation to the other, which was later hidden and reserved for the righteous in the age to come. For further study on the theological significance of light, see the Berean Study Bible notes and the detailed exposition at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 4,
    explanation:
      `Three times in this verse God makes an assessment of His creative work, and each time He declares it 'good' — a word that in Hebrew (tov) conveys not merely moral goodness but beauty, order, functionality, and delight. The separation of light from darkness is the first of several acts of division that structure the creation week, establishing boundaries and categories that bring order out of the original formlessness. This divine evaluation is significant: the material world is not inherently evil or inferior but is pronounced good by its Creator. The repeated declaration that creation is good establishes a biblical framework for appreciating the physical world, human embodiment, and the goodness of God's gifts while setting the stage for the declaration of 'very good' at the completion of creation in verse 31. God's ability to see and affirm goodness in His work serves as a model for human beings created in His image.`,
    learnMore:
      `The Hebrew word 'tov' (good) encompasses far more than moral purity — it conveys wholeness, beauty, suitability for purpose, and delight. When God sees that the light is 'tov,' He is affirming that it fulfills its designed function perfectly. This same word is used in Genesis 2:18 when God says it is not 'tov' for Adam to be alone, and in Exodus 2:2 when Moses' mother sees that her son is 'tov' (beautiful/healthy). The concept of God declaring creation good is crucial for developing a biblical theology of the body and the material world. Early church heresies like Gnosticism and Docetism denied the goodness of physical matter, but Genesis stands as a perpetual correction to such views. The separation of light from darkness is the first of three major separations in chapter one, establishing a pattern of distinction and order that undergirds the entire biblical worldview. For a comprehensive treatment of the goodness of creation in the Genesis narrative, consult the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 5,
    explanation:
      `In the act of naming, God exercises His sovereign authority over creation — in ancient Near Eastern thought, to name something was to assert dominion over it. By calling the light 'day' and the darkness 'night,' God establishes the foundational rhythm of time itself, creating the cycle of light and darkness that structures all of life. The refrain 'there was evening, and there was morning — the first day' is profoundly significant. The Hebrew day begins at evening, following the creation pattern where darkness precedes light, which Paul later reflects upon: 'For God, who said, "Let light shine out of darkness," made His light shine in our hearts' (2 Corinthians 4:6). The ordinal numbering of days establishes the seven-day week as the fundamental unit of time in Scripture, grounding the Sabbath command in the pattern of creation itself and establishing a linear, purposeful progression of history toward God's goals.`,
    learnMore:
      `The creation of the 24-hour day with its evening-morning cycle established the rhythm of life that Scripture consistently affirms. The Jewish practice of beginning the day at sunset (Leviticus 23:32) is rooted in this passage, as is the seven-day week that distinguishes Israel from surrounding cultures that used lunar months or other calendrical systems. The repeated refrain over six days serves multiple theological purposes: it emphasizes the sequential nature of creation; it reinforces that each day is a complete unit of ordinary time; and it builds anticipation for the climactic seventh day. The fact that day one is counted before the sun is created on day four refutes sun-worship practices common in Egypt and Mesopotamia. For more on the creation week structure and its relationship to the Sabbath commandment, see the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 6,
    explanation:
      `On the second day, God speaks into existence the 'expanse' (raqia in Hebrew) — a term that conveys the idea of something stretched out or spread thin, like hammered metal. The ancient Israelites understood this as a solid dome or vault that separated the waters above from the waters below, forming a cosmic canopy. While modern readers recognize this as the atmosphere or sky, the theological truth remains powerful: God establishes boundaries and order in creation, creating habitable space where life can flourish. This act of separation continues the pattern established on day one — God is a God of order who brings structure out of formlessness. The image of a firmament also carries temple imagery in Scripture, as the heavens are described as God's dwelling place and the earthly tabernacle was built as a copy of the heavenly reality (Hebrews 8:5).`,
    learnMore:
      `The Hebrew word 'raqia' comes from the verb 'raqa,' meaning to spread out, stamp, or beat thin — like a metalworker hammering gold into sheets (Exodus 39:3, Isaiah 40:19). This imagery of the sky as a solid dome was common across ancient Near Eastern cultures, but Genesis uniquely demythologizes it: the firmament is not the body of a deity but a creature made by God's word. Biblical language often uses this same verb to describe God's creative power, as in Isaiah 42:5 and Psalm 104:2. The firmament functions as a boundary that keeps the chaotic waters at bay, much like God's covenant promises hold back the chaos of sin in the lives of believers. For a careful study of the Hebrew cosmology of Genesis, see the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 7,
    explanation:
      `This verse records the execution of God's creative command from verse 6. The separation of waters above from waters below is one of the great structural divisions of the cosmos in the Genesis creation account. In the ancient world, the waters above the firmament were understood as the source of rain and precipitation, held back by the 'windows of heaven' that God could open or close (Genesis 7:11, Malachi 3:10). The obedience of the waters to God's word stands in stark contrast to ancient Near Eastern myths where the sea gods must be subdued in battle. Here, God simply speaks and it is done — there is no struggle, no resistance, no competing power. This quiet, effortless sovereignty is a profound reassurance that the God who orders the cosmos is also able to order the lives of His people.`,
    learnMore:
      `The separation of waters above from waters below establishes the hydrological cycle that sustains life on earth. While the ancient Hebrews described this in the language of their time, the underlying truth is that God established the natural order that governs weather and climate. References to the 'storehouses of snow and hail' (Job 38:22) poetically affirm God's providential control over weather patterns. The flood narrative in Genesis 7:11 describes the breaking open of the 'windows of heaven' — a reversal of the creative separation as an act of judgment. This connection between creation and judgment underscores that God is both Creator and Judge. For further study on the relationship between creation, providence, and judgment, consult the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 8,
    explanation:
      `God names the expanse 'sky' (shamayim in Hebrew), once again exercising His sovereign authority over creation through naming. The Hebrew word shamayim is dual in form, perhaps reflecting the ancient conception of multiple heavens — the atmospheric sky, the stellar heavens, and the dwelling place of God. Unlike the other days of creation week, day two receives no explicit declaration of 'it was good.' This omission has intrigued interpreters throughout church history. Some suggest it is because the work of day two was incomplete — the waters below had not yet been gathered and the dry land had not yet appeared. Others see a symbolic connection to the sky being associated with spiritual forces of darkness (Ephesians 6:12). For a thorough examination of the Hebrew concept of heaven, see the commentary resources available at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    learnMore:
      `The omission of 'it was good' on day two has generated extensive discussion. Augustine suggested that the number two symbolizes division and imperfection in contrast to the unity represented by one and the perfection represented by three. Others note that the work of day two is incomplete until day three when the dry land appears, making the week symmetrical: days one through three establish realms while days four through six populate them. The dual form of shamayim has been understood variously: some see it as a reference to two heavens (atmospheric and celestial), others as a poetic form indicating greatness. Jewish tradition in the Talmud describes seven heavens with different functions. For more on the Hebrew concept of heaven, see the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 9,
    explanation:
      `On the third day, God's creative work shifts from separating to gathering. The command for the waters under the sky to gather into one place marks the emergence of dry land from the primordial sea. This is the third great separation in the creation account: light from darkness, waters above from waters below, and dry land from the seas. The emergence of dry land from the waters echoes the exodus theme where God parts the Red Sea to bring His people into the promised land, and looks forward to the new creation where the sea will be no more (Revelation 21:1). This is the first day of creation where a second creative act follows in the same day (the appearance of vegetation in verse 11), indicating that this day carries special significance as the foundation for biological life.`,
    learnMore:
      `The gathering of the waters into 'one place' is noteworthy — although we have oceans with different names, they are all connected as one global ocean. The emergence of dry land from the sea is a powerful image of salvation throughout Scripture. The parting of the Red Sea, the crossing of the Jordan, and the stilling of the storm all echo this creative act. The prophet Isaiah connects this with the new creation, and in the new Jerusalem the sea is no more, signifying the removal of all chaos and separation. The third day also holds special significance in redemptive history as the day of resurrection: Jesus rose from the dead on the third day, inaugurating the new creation. For further study on the typological significance of the third day, see the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 3]",
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 10,
    explanation:
      `God completes the third day of creation by naming the dry land 'earth' (eretz) and the gathered waters 'seas' (yamim). The Hebrew word eretz can refer to the whole earth, a specific land, or the ground underfoot. The naming of the seas is particularly significant: in ancient Near Eastern culture, the sea was often personified as a chaotic deity (like Tiamat in Mesopotamian myth or Yam in Canaanite religion). By naming the seas, God asserts His sovereignty over them — they are not gods to be feared but part of His creation, subject to His authority. This theme of God's dominion over the sea recurs throughout Scripture in passages like Psalm 89:9 and Mark 4:39, where Jesus demonstrates His divine identity by rebuking the wind and the waves.`,
    learnMore:
      `The Hebrew word 'eretz' is remarkably flexible, appearing over 2,500 times in the Old Testament with meanings ranging from 'ground' to 'land' to 'whole earth.' This semantic range reflects that the same God who created the entire earth also cares for specific lands and places. The naming of the seas as 'yamim' (plural of yam) is a deliberate demythologization — in Ugaritic texts, Yam is a powerful sea god; by having God name the seas, Genesis declares that the supposed deities of pagan nations are merely creatures of Yahweh. The sea also serves as an important eschatological symbol in Daniel 7 and Revelation 13. For a comprehensive study of the biblical theology of the sea, see the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Exodus",
    chapter: 20,
    verseNumber: 3,
    explanation:
      `This is the first of the Ten Commandments and establishes the foundational principle of exclusive loyalty to Yahweh. In the ancient Near Eastern context, polytheism was the norm, and each nation had its own patron deities. God's command 'You shall have no other gods before Me' demands not merely monotheistic belief but wholehearted covenant loyalty. The Hebrew phrase 'before Me' emphasizes that God recognizes no rivals and will not share His glory with another. This commandment sets the tone for the entire Decalogue and establishes the fundamental relationship between God and His people — one of exclusive devotion, trust, and obedience. Just as God alone redeemed Israel from Egypt, He alone is worthy of Israel's worship.`,
    learnMore:
      `The Ten Commandments, known in Hebrew as the 'Aseret HaDibrot' (Ten Words), form the core of the Sinai covenant. The first commandment establishes monotheistic exclusive loyalty. The phrase 'before Me' (al-panai) can also be translated 'in My presence' or 'besides Me,' suggesting that God tolerates no rivals. This commandment is not merely about belief in one God but about covenant faithfulness — Israel is to worship Yahweh alone because He alone is their Redeemer. Jesus summarized this as loving God with all one's heart, soul, and mind (Matthew 22:37). For more on the historical and theological context of the Ten Commandments, see the resources at https://www.biblegateway.com/passage/?search=Exodus+20&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Psalms",
    chapter: 23,
    verseNumber: 1,
    explanation:
      `This beloved psalm opens with the tender metaphor of the Lord as a shepherd, an image deeply familiar to David's original audience. In ancient Israel, shepherds were known for their intimate care, guidance, and protection of their sheep — animals completely dependent on their keeper for survival. By declaring 'I shall not want,' David expresses complete trust in God's provision, echoing God's faithfulness to Israel during their wilderness journey. The personal pronoun 'my' makes this not just a theological truth but a deeply personal relationship. This opening verse sets the stage for the entire psalm, which portrays a life of peace, security, and blessing that flows from trusting in the Good Shepherd — a title Jesus later applies to Himself in John 10, identifying Himself as the fulfillment of this ancient promise.`,
    learnMore:
      `Psalm 23 is arguably the most beloved passage in the Old Testament. The shepherd metaphor would have been immediately meaningful to David, who himself served as a shepherd before becoming king (1 Samuel 16:11). Shepherding in ancient Israel was a demanding occupation — shepherds led their flocks to pasture and water, protected them from predators, and cared for the injured and weak. The prophets also used this imagery: Isaiah 40:11 describes God as a shepherd who 'gathers the lambs in His arms,' and Ezekiel 34 condemns the false shepherds of Israel. Jesus' declaration 'I am the good shepherd' (John 10:11) directly identifies Him with Yahweh of Psalm 23. The good shepherd 'lays down His life for the sheep,' connecting the pastoral imagery of provision to the ultimate sacrifice of the cross. For a rich devotional and theological exploration, see the resources at https://www.biblegateway.com/passage/?search=Psalm+23&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Psalms",
    chapter: 119,
    verseNumber: 105,
    explanation:
      `This poetic verse uses the vivid imagery of light to describe the transformative power of God's Word in guiding human life. In ancient times, travelers would carry a lamp to illuminate their immediate steps and a larger torch to see the path ahead. Similarly, God's Word provides both immediate guidance for today's decisions and broader direction for life's journey. This metaphor emphasizes that Scripture is not merely informational but practical and directional — it illuminates the moral and spiritual landscape, revealing pitfalls, showing the right way, and exposing the deceptions of sin. The verse also implies human inadequacy without divine revelation: we walk in darkness apart from God's Word.`,
    learnMore:
      `Psalm 119 is an acrostic poem — the longest chapter in the Bible — with 176 verses arranged in 22 stanzas corresponding to the 22 letters of the Hebrew alphabet. The psalm uses at least eight different Hebrew terms for God's revelation, each emphasizing a different facet of Scripture's character and function. The lamp (ner) mentioned in verse 105 would have been a small clay oil lamp that provided just enough light for the next step, while the light (or) for the path suggests broader illumination. This imagery is echoed in Proverbs 6:23 and 2 Peter 1:19. For an in-depth study of the theology of Psalm 119, consult the resources at https://www.biblegateway.com/passage/?search=Psalm+119&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Proverbs",
    chapter: 3,
    verseNumber: 5,
    explanation:
      `This wisdom saying strikes at the heart of human self-sufficiency and pride. To 'trust in the Lord with all your heart' means to rely completely on God's character, promises, and providence rather than on human understanding, which is inherently limited and corrupted by sin. The heart in Hebrew thought represents the whole inner person — mind, will, emotions, and intentions. Trusting with 'all your heart' demands total, undivided commitment. The second line, 'lean not on your own understanding,' does not forbid the use of reason but warns against making human reason the ultimate arbiter of truth and wisdom. This proverb calls believers to humble dependence, acknowledging that true wisdom begins with the fear of the Lord (Proverbs 9:10).`,
    learnMore:
      `Proverbs 3:5-6 is one of the most memorized passages in the wisdom literature of the Bible. The command to 'trust in the Lord with all your heart' uses the Hebrew verb 'batach,' conveying security and confident trust — the same word used in Psalm 56:11. The word 'lean' (shaan) suggests leaning on something for support, like a staff — we are not to make our own understanding our primary support. The rest of the passage promises guidance and blessing to those who honor God and trust Him completely. For a thorough exposition of Proverbs 3:5-6 in its context, see the commentary by Bruce Waltke and the resources at https://www.biblegateway.com/passage/?search=Proverbs+3&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Isaiah",
    chapter: 40,
    verseNumber: 31,
    explanation:
      `Written to a people in exile who felt abandoned by God, this verse offers profound hope and encouragement. The metaphor of mounting up with wings like eagles draws from the observation of eagles soaring on thermal currents with seemingly effortless grace. Unlike smaller birds that constantly flap their wings, eagles catch the wind and rise above the storm. Similarly, those who 'wait upon the Lord' — the Hebrew word 'qavah' implies active, expectant waiting filled with hope and trust — receive supernatural strength that enables them to rise above life's difficulties. The progression from 'mount up' to 'run' to 'walk' is significant: faith does not always produce dramatic experiences; sometimes it provides the steady endurance needed for ordinary challenges.`,
    learnMore:
      `Isaiah 40 marks a major turning point in the book of Isaiah, shifting from judgment to comfort and hope. The context of verse 31 is a contrast between human frailty and divine power. Even the strongest humans grow weary, but those who wait on the Lord receive renewed strength. The Hebrew word 'qavah' for 'wait' carries the sense of twisting together, like a rope maker, implying that waiting on God creates a connection of strength with Him. The eagle imagery symbolizes strength, speed, and royal majesty. For a comprehensive examination of the themes of comfort and hope in Isaiah 40, see the resources at https://www.biblegateway.com/passage/?search=Isaiah+40&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[3]",
  },
  {
    bookName: "Jeremiah",
    chapter: 29,
    verseNumber: 11,
    explanation:
      `This verse, part of Jeremiah's letter to the exiles in Babylon, has become one of the most quoted assurances of God's benevolent intentions toward His people. However, its original context is crucial for proper interpretation. God was speaking to a community facing 70 years of exile — not an immediate deliverance but a long-term plan involving judgment, discipline, and eventual restoration. The word 'shalom' (often translated 'prosper') means comprehensive wholeness, peace, and well-being in every dimension of life. The 'future and a hope' ultimately point forward to the coming of Christ and the establishment of the new covenant. This verse teaches that God's plans are comprehensive and trustworthy, working through both difficult circumstances and seasons of blessing.`,
    learnMore:
      `Jeremiah 29:11 must be read in its full context to avoid misinterpretation. Jeremiah wrote to the exiles in Babylon telling them to settle down, seek the peace of the city, and trust God for the long term. This was shocking advice because false prophets were telling the people the exile would be short. The Hebrew word for 'plans' (machashavah) means 'thoughts, intentions, purposes.' This verse is often quoted out of context as a promise of personal prosperity, but it was a specific promise about God's covenant faithfulness. For a faithful exposition of Jeremiah's letter to the exiles, see the resources at https://www.biblegateway.com/passage/?search=Jeremiah+29&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[3]",
  },
  {
    bookName: "John",
    chapter: 1,
    verseNumber: 1,
    explanation:
      `John's prologue opens with a profound theological declaration that echoes Genesis 1:1 while revealing the fuller identity of Jesus Christ. The term 'Logos' (Word) would resonate with both Jewish and Greek audiences. John's radical claim is that this Word is not merely a concept but a divine Person — Jesus Christ — who has always existed in eternal relationship with God the Father and is Himself fully God. The phrase 'was with God' indicates distinct personhood within the Godhead, while 'was God' affirms His full deity. This verse establishes the foundation for the doctrine of the Trinity and the incarnation.`,
    learnMore:
      `John 1:1 is one of the most theologically dense verses in all of Scripture. The Greek text uses three imperfect tense verbs emphasizing the eternal existence of the Word. The phrase 'In the beginning' deliberately echoes Genesis. The early church controversy with Arianism centered on this verse. Arius argued that 'the Word was a god' citing the absence of the definite article before 'theos' in Greek, while Athanasius argued the meaning is 'the Word was God.' Modern scholarship confirms the orthodox reading: the Word is fully God. For a comprehensive analysis, see the resources at https://www.biblegateway.com/passage/?search=John+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "John",
    chapter: 3,
    verseNumber: 16,
    explanation:
      `Often called 'the Gospel in a nutshell,' this verse summarizes the entire message of salvation. It reveals four essential truths: First, God's motivation is love — self-giving, sacrificial love that initiated salvation before any human response. Second, the scope of God's love is universal: 'the world.' Third, the cost is staggering: God gave His only begotten Son. Fourth, the purpose is eternal life — not merely endless existence but transformed life with God beginning now and extending forever. The condition 'whoever believes' emphasizes that salvation is received through faith, accessible to anyone who trusts in Christ.`,
    learnMore:
      `John 3:16 is the most famous verse in the Bible, part of Jesus' conversation with Nicodemus. The Greek word for love is 'agape' — unconditional love seeking the highest good of the beloved. 'World' (kosmos) often carries negative connotations in John's Gospel, but here it indicates the object of God's redemptive love. 'Only begotten' (monogenes) means 'unique, one of a kind.' The purpose of the Son's mission is not condemnation but salvation. This verse has been called 'the North Star of the Bible' by Martin Luther. For an in-depth study of John 3:16 in its original context, see the resources at https://www.biblegateway.com/passage/?search=John+3&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2, 3]",
  },
  {
    bookName: "Romans",
    chapter: 3,
    verseNumber: 23,
    explanation:
      `The Apostle Paul states the universal human condition: 'All have sinned and fall short of the glory of God.' The Greek word for 'sin' (hamartia) originally meant 'to miss the mark.' Paul's point is that humanity was created to reflect God's glory — to live in perfect relationship with Him — but sin has caused every person to fall short of this high calling. This verse establishes the universal need for salvation that Paul builds toward in the first three chapters of Romans. The diagnosis of the human condition prepares the remedy: justification by grace through faith in Jesus Christ.`,
    learnMore:
      `Romans 3:23 is a key verse in Paul's argument that all humanity stands condemned before God. The first three chapters are structured like a courtroom: Gentiles are guilty, Jews are guilty, and the verdict is that all have sinned. Paul's argument is devastating in its comprehensiveness — no one can claim innocence or special status before God. The good news arrives in verse 24: we are 'justified freely by His grace through the redemption that came by Christ Jesus.' This doctrine of justification by faith alone became the spark of the Protestant Reformation. For a thorough study, see the commentaries by John Stott, Douglas Moo, or the resources at https://www.biblegateway.com/passage/?search=Romans+3&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Romans",
    chapter: 8,
    verseNumber: 28,
    explanation:
      `This verse stands as one of the most comforting promises in all of Scripture. The promise that 'all things work together for good' is not a guarantee that everything that happens is in itself good, nor that believers will always be happy. Rather, it assures us that God in His sovereignty weaves even painful circumstances into His redemptive purposes. The 'good' is defined in the next verse: being conformed to the likeness of Christ. The condition is love for God and being called according to His purpose. This verse does not promise our preferences will be satisfied, but that God will use everything to accomplish our ultimate good: Christlikeness and eternal glory.`,
    learnMore:
      `Romans 8:28 must be understood within its broader context — the magnificent eighth chapter of Romans. The Greek verb 'synergei' can be read either as 'all things work together for good' or 'God works all things together for good.' Textual evidence supports the latter: God is the active agent. The 'good' is defined as being conformed to the likeness of His Son (verse 29). The golden chain of salvation in verses 29-30 provides the foundation for this promise. For a comprehensive exposition of Romans 8 and the sovereignty of God, see the resources at https://www.biblegateway.com/passage/?search=Romans+8&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "2 Corinthians",
    chapter: 5,
    verseNumber: 17,
    explanation:
      `Paul declares the transformative power of union with Christ. Being 'in Christ' brings about an entirely new creation. The old order of life dominated by sin, guilt, and spiritual death has passed away, and something radically new has come into being. This is not mere moral improvement but genuine new creation as fundamental as the original creation. The Greek word for 'new creation' (kaine ktisis) suggests newness in kind and quality, not just in time. This transformation affects every aspect of identity: old patterns of thinking, old allegiances, and old ways of relating are replaced by the new reality of life in Christ.`,
    learnMore:
      `2 Corinthians 5:17 is a pivotal verse in Paul's theology. The context presents the foundation for new creation: Christ's death for all means that all died in Him, and those who live no longer live for themselves but for Christ. The language of 'new creation' deliberately echoes the creation account of Genesis. Paul's theology of new creation is cosmic in scope — it is not just individual believers made new but the entire creation being renewed (Romans 8:19-22). The Holy Spirit is the agent of new creation, and the church is the firstfruits of this reality. For a thorough study, see the commentaries by Paul Barnett and Murray Harris, or the resources at https://www.biblegateway.com/passage/?search=2+Corinthians+5&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 13,
    explanation:
      `This verse is often quoted as a mantra for personal achievement, but its original context reveals a deeper meaning. Paul writes from prison, having endured hardship and deprivation. He has just said he has learned to be content in every circumstance. In this context, 'I can do all things' is not about accomplishing any goal but about being enabled by Christ to face any circumstance with contentment and faithfulness. The 'all things' refers to enduring both prosperity and adversity without losing faith or joy. Paul's secret is Christ-dependence: the strength to persevere comes from Christ who empowers him.`,
    learnMore:
      `Philippians 4:13 is probably the most frequently misused verse in Scripture. The original context is Paul's thank-you to the Philippians for their financial support. The Greek word for 'secret' was used in mystery religions for initiation; Paul uses it ironically for the secret he has learned: Christ-sufficiency. The 'all things' must be defined by the context — all things related to the circumstances of abundance or scarcity. For a faithful exposition of Philippians 4:13 in its original context, see the resources at https://www.biblegateway.com/passage/?search=Philippians+4&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Hebrews",
    chapter: 11,
    verseNumber: 1,
    explanation:
      `The author of Hebrews provides the most comprehensive definition of faith in Scripture. Faith is 'the assurance of things hoped for, the conviction of things not seen.' The Greek word for 'assurance' (hypostasis) carries the idea of a foundation or title deed — faith brings future promises into present reality. The word 'conviction' (elegchos) suggests proof — faith provides convincing evidence for realities that cannot be empirically verified. Biblical faith is not a blind leap but a reasoned trust based on God's character. The rest of Hebrews 11 provides a 'hall of fame' of Old Testament figures who lived by this faith.`,
    learnMore:
      `Hebrews 11 is often called the 'Faith Hall of Fame.' The Greek word 'hypostasis' appears in Hebrews 1:3 where Christ is 'the exact imprint of God's being.' In the business papyri of the ancient world, hypostasis was used for a title deed that guaranteed ownership of property not yet possessed. Faith, then, is the title deed to future realities. The chapter demonstrates that 'without faith it is impossible to please God' (verse 6). The heroes came from a death to rescind the vagaries of chance. For a comprehensive study, see the commentaries by William Lane or F.F. Bruce at https://www.biblegateway.com/passage/?search=Hebrews+11&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Revelation",
    chapter: 21,
    verseNumber: 4,
    explanation:
      `This verse paints the glorious climax of redemptive history. John's vision of the new heaven and new earth culminates with God dwelling directly among His people, wiping away every tear from their eyes. The four things listed — death, mourning, crying, and pain — encompass the totality of human misery that entered through sin. Their removal signals the complete reversal of the Fall. This promise provides hope and endurance for believers facing present suffering, assuring them that pain is temporary and God's ultimate purpose is complete restoration to shalom.`,
    learnMore:
      `Revelation 21:1-8 describes the final state of the redeemed. The Greek word for 'new' (kainos) means new in quality and character. The holy city descends from heaven to earth, showing that redeemed humanity's final dwelling is on a renewed earth where God lives with His people. Death, the 'last enemy' (1 Corinthians 15:26), is finally destroyed. The declaration 'Behold, I make all things new' comes from God Himself on the throne. For a detailed exposition of Revelation 21, see the commentaries by G.K. Beale and Craig Keener at https://www.biblegateway.com/passage/?search=Revelation+21&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[3]",
  },
  {
    bookName: "Genesis",
    chapter: 12,
    verseNumber: 1,
    explanation:
      `God's call to Abram marks a pivotal turning point in redemptive history. After the scattering at Babel, God initiates His plan of salvation by choosing one man through whom all nations will be blessed. The command to leave his country, kindred, and father's house would have been profoundly costly in the ancient Near East, where identity was tied to family and land. Abram is called to leave everything for an unspecified destination — God merely says 'to the land I will show you.' This established the pattern of faith: trusting God's promise when the destination is unknown. The promise includes a great nation, personal blessing, and the ultimate purpose that all peoples will be blessed through him, fulfilled in Jesus Christ (Galatians 3:8, 16).`,
    learnMore:
      `Genesis 12:1-3 introduces the Abrahamic covenant, the foundation of Scripture's redemptive story. The Hebrew verb 'lech lecha' ('Go') is emphatic — 'Go for yourself' — suggesting Abram's journey was one of personal transformation. God called Abram when he was 75 years old. The call is often seen as God's response to Babel: where humanity sought to make a name for themselves, God promises to make Abram's name great. The final promise — 'all peoples on earth will be blessed through you' — finds fulfillment in Christ, as Paul explains in Galatians 3:8. For a comprehensive study of the Abrahamic covenant, see the resources at https://www.biblegateway.com/passage/?search=Genesis+12&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Genesis",
    chapter: 12,
    verseNumber: 2,
    explanation:
      `God's promises to Abram expand upon the initial call. The promise of a great nation is remarkable because Abram and Sarai were already advanced in years and childless — the very situation making the promise impossible was the crucible where faith was forged. God will make Abram's name great, in contrast to the builders of Babel who sought to make a name for themselves. The ultimate purpose of blessing is not for Abram's benefit alone but so that he might be a blessing to others. This principle — blessing is received to be channeled — becomes a foundational theme in Scripture.`,
    learnMore:
      `The Abrahamic promises follow a pattern from ancient Near Eastern covenants, but the content is radically different: God, the divine King, promises universal blessing through one human family. The repetition of 'bless' (barak) occurs five times in these three verses, emphasizing the reversal of the curse of Genesis 3. Paul argues in Galatians 3 that the gospel was preached to Abraham in advance — 'all nations will be blessed through you.' Abraham is the father of all who believe (Romans 4:11). For a deeper exploration, see the commentaries by Gordon Wenham and John Walton, or the resources at https://www.biblegateway.com/passage/?search=Genesis+12&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Genesis",
    chapter: 12,
    verseNumber: 3,
    explanation:
      `This verse contains the heart of the Abrahamic covenant. God promises to deal with people based on how they treat Abraham and his descendants: blessing for those who bless, cursing for those who curse. This is the outworking of God's covenant faithfulness — to oppose God's instrument is to oppose God's redemptive purposes. The final clause, 'all peoples on earth will be blessed through you,' is the most significant promise, expanding from Abraham's personal blessing to universal blessing. Paul interprets the singular 'seed' as referring to Christ (Galatians 3:16). This is the beginning of missionary revelation: God's plan was always to reach all peoples.`,
    learnMore:
      `The phrase 'curse the one who curses you' uses two different Hebrew words: 'arar' (to pronounce a curse) and 'qalal' (to treat lightly). The distinction suggests that even casual disrespect is taken seriously by God. The final promise is the most quoted Old Testament verse in the New Testament, appearing in Galatians 3:8 and Acts 3:25. The scope is universal — 'all families of the earth' includes every nation and clan. Matthew's genealogy traces Jesus to Abraham, showing the ultimate fulfillment in Christ. For further resources on the missional nature of God's call to Abraham, see https://www.biblegateway.com/passage/?search=Genesis+12&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 3]",
  },
  {
    bookName: "Exodus",
    chapter: 14,
    verseNumber: 13,
    explanation:
      `As the Israelites stand trapped between the Red Sea and the pursuing Egyptian army, Moses speaks words of faith: 'Do not be afraid. Stand firm and you will see the deliverance the Lord will bring you today.' The Hebrew phrase 'stand firm' (hit'yatzvu) is an active posture of faith, not passive resignation. Moses calls the people to do the impossible: to stop running, stop fighting, and watch God act. This is the essence of salvation by faith — God does the work, and His people receive deliverance by trusting Him. The Red Sea deliverance became the defining event of the Old Testament.`,
    learnMore:
      `Exodus 14:13-14 is one of the most important passages in the Old Testament, establishing the pattern of redemption. The theological center is verse 14: 'The Lord will fight for you; you need only to be still.' The Hebrew verb for 'fight' (lacham) is related to 'YHWH Sabaoth' (Lord of Hosts) — God is the Divine Warrior who fights for His people. This concept repeats throughout the Old Testament (Deuteronomy 1:30, Joshua 10:14, Nehemiah 4:20). The New Testament interprets this event as a type of baptism (1 Corinthians 10:1-2) and a pattern of salvation by faith. For a comprehensive study, see the resources at https://www.biblegateway.com/passage/?search=Exodus+14&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Exodus",
    chapter: 14,
    verseNumber: 14,
    explanation:
      `The Lord will fight for you; you need only to be still.' The Hebrew word 'charash' conveys silence, stillness, and rest — the opposite of frantic self-rescue. This verse summarizes the gospel principle of salvation by grace through faith: God acts, humans trust. Throughout Scripture, God repeatedly fights for His people in ways they could not accomplish for themselves. The apostle Paul captures this in Romans 5:8: 'while we were still sinners, Christ died for us.' Salvation does not require our fighting but our receiving.`,
    learnMore:
      `The Hebrew word 'charash' can mean to be silent, still, or motionless. Here it calls God's people into active rest — not the rest of resignation but of trust. The Divine Warrior theme pervades the Old Testament. In the ancient Near East, gods were depicted as warriors fighting for their own honor, but Yahweh uniquely fights for His people. Psalm 46:10 says 'Be still, and know that I am God,' connecting stillness with knowledge of God. The writer of Hebrews develops this theme of rest in chapters 3-4. For a comprehensive study, see the resources at https://www.biblegateway.com/passage/?search=Exodus+14&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Deuteronomy",
    chapter: 6,
    verseNumber: 4,
    explanation:
      `The Shema — named for the first Hebrew word (Hear) — is the central confession of faith in Judaism. 'Hear, O Israel: The Lord our God, the Lord is One' is a radical declaration of monotheism. The Hebrew word 'echad' (one) does not mean solitary unity but composite unity — the same word used in Genesis 2:24 where a man and woman become 'one flesh.' This allows for the composite unity within the Godhead that the New Testament reveals as Father, Son, and Holy Spirit. The Shema became the daily prayer of Israel, recited morning and evening.`,
    learnMore:
      `The Shema (Deuteronomy 6:4-9) is the most important prayer in Judaism. The Hebrew word 'Shema' means 'hear' but includes the idea of obeying. The word 'echad' (one) is the same word used in Ecclesiastes 4:9 ('two are better than one'), Ezekiel 37:17 (two sticks becoming one), and Genesis 1:5 ('day one'). Jesus quoted the Shema when asked about the greatest commandment (Mark 12:29-30), linking it with love for neighbor. The early church fathers saw in the Shema a foreshadowing of the Trinity. For a thorough study, see the resources at https://www.biblegateway.com/passage/?search=Deuteronomy+6&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Deuteronomy",
    chapter: 6,
    verseNumber: 5,
    explanation:
      `This verse contains the greatest commandment according to Jesus (Mark 12:30). The command to love God with all one's heart, soul, and strength demands total devotion. The heart represents the inner person — mind, will, and emotions. The soul refers to one's very life and being. Strength implies all one's resources and abilities. The repetition of 'all' emphasizes that no part of life is excluded from God's claim. This love is not primarily an emotion but a covenant loyalty expressed in obedient actions. Because God has loved and saved His people, they respond with fully committed love.`,
    learnMore:
      `The Hebrew word for 'love' conveys covenantal loyalty, not just emotion — the same verb used in ancient treaty contexts, where 'love' means faithful covenant keeping. Jesus added 'mind' to the formula (Mark 12:30), reflecting the Septuagint translation of the Old Testament. Jesus called this the first and greatest commandment and said all the Law depends on it. The immediate context instructs parents to teach these words diligently to children, leading to the Jewish practice of wearing phylacteries and placing nmezuahs on doorposts. For more on covenant love in Deuteronomy, see the resources at https://www.biblegateway.com/passage/?search=Deuteronomy+6&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Joshua",
    chapter: 1,
    verseNumber: 9,
    explanation:
      `God's commission to Joshua includes the powerful command: 'Be strong and courageous. Do not be afraid; do not be discouraged.' The repetition three times (verses 6, 7, and 9) underscores the task's enormity and Joshua's need for divine enablement. The reason for courage is not Joshua's natural abilities but God's promise: 'The Lord your God is with you wherever you go.' The Hebrew word for 'strong' implies holding firm while 'courageous' connotes determination and resolve. Together they call for active trust that clings to God's promise even when circumstances seem overwhelming.`,
    learnMore:
      `Joshua 1:1-9 is one of the most important commissioning passages in Scripture. Joshua was taking over from Moses and facing the daunting task of conquering Canaan. The condition for courage is given in verse 8: meditating on God's Word day and night. Courage flows from knowing and obeying Scripture. The New Testament echoes this promise in Hebrews 13:5-6: 'I will never leave you nor forsake you.' For a thorough study of the commissioning of Joshua and its significance for leadership, see the resources at https://www.biblegateway.com/passage/?search=Joshua+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Psalms",
    chapter: 1,
    verseNumber: 1,
    explanation:
      `The Book of Psalms opens with a beatitude that sets the theme for the entire collection. The verse presents a threefold progression of avoidance: walking in the counsel of the wicked (casual association), standing in the way of sinners (deliberate association), and sitting in the seat of scoffers (settled association). The blessed person is defined not only by what they avoid but by what they pursue — delight in the Torah of the Lord. The word 'blessed' is in the plural intensive form, suggesting multiplied happiness for those who walk in God's ways.`,
    learnMore:
      `Psalm 1 serves as a gateway to the entire Psalter by establishing the two ways: the way of the righteous and the way of the wicked. The progression 'walk... stand... sit' describes a deteriorating pattern of influence. The key to blessedness is 'delighting' in God's Torah — not dutifully reading it but finding pleasure and satisfaction in it. This passage formed the backdrop for Jesus' Beatitudes (Matthew 5:3-12). For a comprehensive study of Psalm 1 as the introduction to the Psalter, see the resources at https://www.biblegateway.com/passage/?search=Psalm+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Psalms",
    chapter: 1,
    verseNumber: 2,
    explanation:
      `The blessed person is defined not by negative avoidance but by positive delight in God's Word. The 'law of the Lord' encompasses the entire revelation of God's will and character. 'Delight' implies desire and pleasure — the righteous person finds in God's Word what others find in their greatest pleasures. 'Meditating' (hagah) day and night means to murmur or mutter God's words under one's breath, filling the mind with divine truth. This establishes the practice of 'lectio divina' — reading, reflecting, and resting in God's Word as a way of life.`,
    learnMore:
      `The Hebrew word for 'meditate' (hagah) appears in other contexts: the lion growls over its prey, the mourning dove coos. It involves both audible and mental engagement — speaking God's words to oneself throughout the day was essential for memorization and deep absorption of the text. Psalm 119:97 echoes this delight: 'Oh how I love Your law! It is my meditation all the day.' For the Christian, the Torah is now understood through Christ. For further study on biblical mediation, see the resources at https://www.biblegateway.com/passage/?search=Psalm+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Psalms",
    chapter: 1,
    verseNumber: 3,
    explanation:
      `The righteous person is likened to a tree planted by streams of water — conveying stability, vitality, fruitfulness, and endurance. Unlike a wild tree that must search for water, this tree is deliberately transplanted by God near life-giving water. 'Fruit in its season' speaks to appropriate productivity at the right time. The leaf not withering indicates persistent vitality even in adverse conditions. The prosperity mentioned is comprehensive well-being (shalom) in whatever God calls a person to do.`,
    learnMore:
      `The tree image appears in Jeremiah 17:7-8: 'Blessed is the man who trusts in the Lord... he will be like a tree planted by the water.' In contrast, the wicked are described as chaff — light, rootless, worthless. The tree has been transplanted by a divine husbandman. Jesus used similar imagery in John 15:1-8, where branches that abide in the vine bear much fruit. For a deeper study of the tree imagery in Scripture and its connection to the life of faith, see the resources at https://www.biblegateway.com/passage/?search=Psalm+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Psalms",
    chapter: 27,
    verseNumber: 1,
    explanation:
      `David declares 'The Lord is my light and my salvation.' Light symbolizes life, truth, and God's presence. By declaring the Lord his light, David claims all these blessings flow from his relationship with God. The rhetorical question 'Whom shall I fear?' expresses the logic of faith: if God is light, salvation, and stronghold, what threat can overcome His protection? David's courage flows not from circumstances but from conviction about God's character. The progression from 'light' to 'salvation' to 'stronghold' builds a comprehensive picture of God's sufficiency.`,
    learnMore:
      `The word 'light' is the same used in Genesis 1:3, suggesting God's presence brings new creation. 'Salvation' (yeshuah) is related to the name Yeshua (Jesus), connecting this Old Testament hope to its New Testament fulfillment. The two questions express that no one can stand against the God who is light, salvation, and stronghold. For a thorough devotional study of Psalm 27 and its message of courage, see the resources at https://www.biblegateway.com/passage/?search=Psalm+27&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Proverbs",
    chapter: 1,
    verseNumber: 7,
    explanation:
      `This proverb is the foundational motto for the entire book. 'The fear of the Lord is the beginning of knowledge.' This is not craven terror but reverent awe, humble submission, and trusting dependence on God. 'Beginning' implies both the first in time and the most important in rank. Without this fear, all claimed knowledge is ultimately foolishness. The fool — not a mentally deficient person but a morally deficient one — despises wisdom and discipline. True wisdom begins with a proper relationship with God.`,
    learnMore:
      `The phrase 'fear of the Lord' is a key concept throughout the Old Testament, often called the theme of Proverbs. Proverbs 9:10 echoes: 'The fear of the Lord is the beginning of wisdom.' The word 'beginning' (reshit) is the same as in Genesis 1:1. Just as Genesis starts with the foundational act of God, Proverbs starts with the foundational attitude that enables wise living. The contrast between the wise and the fool sets up Proverbs' central theme. For an in-depth study of the fear of the Lord, see the commentary by Bruce Waltke or the resources at https://www.biblegateway.com/passage/?search=Proverbs+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Isaiah",
    chapter: 53,
    verseNumber: 5,
    explanation:
      `This is the most profound description of the atoning work of the Messiah in the Old Testament. 'He was pierced for our transgressions, He was crushed for our iniquities.' The Hebrew word for 'transgressions' implies rebellion; 'iniquities' suggests perversity. The Servant bore the punishment we deserved. 'The punishment that brought us peace was upon Him' — shalom with God is restored through His suffering. 'The worshiper Himself wounds are we healed' — spiritual healing flows from His sacrifice. This verse is the heart of the gospel in the Old Testament, fulfilled in Christ's crucifixion.`,
    learnMore:
      `Isaiah 53 is the fourth 'Suffering Servant' song. Verse 5 contains five truths: it is for our transgressions, He is crushed for our iniquities, the punishment for our shalom is upon Him, by His wounds we are healed. The New Testament writers understood this as direct prophecy of Jesus' atoning death. Matthew 8:17 quotes verse 4. 1 Peter 2:24-25 quotes verse 5: 'By His wounds you have been healed.' The Ethiopian eunuch in Acts 8 was reading this passage when Philip explained the gospel. For a detailed study of the Suffering Servant, see the resources at https://www.biblegateway.com/passage/?search=Isaiah+53&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2, 3]",
  },
  {
    bookName: "Jeremiah",
    chapter: 31,
    verseNumber: 33,
    explanation:
      `"Behold, the days are coming, declares the Lord, when I will make a new covenant." The new covenant is not a re-hashing of the Mosaic covenant but something qualitatively different. The key difference is internalization: instead of God's Law on stone tablets, it will be written on hearts. The heart represents the inner self — mind, will, and emotions — directing the person's entire being toward God. This promise looks forward to the Holy Spirit's work in the new covenant, writing God's law on human hearts.`,
    learnMore:
      `Jeremiah 31:31-34 is one of the most important prophetic passages. The new covenant is the only place in the Old Testament where God uses this term. The New Testament writers see direct fulfillment in Christ, who established the new covenant through His blood (Luke 22:20, 1 Corinthians 11:25). The writer of Hebrews quotes this passage at length (Hebrews 8:8-12) and argues the new renders the old 'obsolete.' The Mosaic covenant was conditional and external; the new covenant is unconditional and internal. The result is intimate knowledge of God. For a comprehensive study, see the resources at https://www.biblegateway.com/passage/?search=Jeremiah+31&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Jeremiah",
    chapter: 31,
    verseNumber: 34,
    explanation:
      `The new covenant ends with two extraordinary declarations. First, universal knowledge of God: 'They will all know Me, from the least to the greatest.' This eliminates the need for human mediators — direct, intimate knowledge of God is available to everyone. Second, complete forgiveness: 'For I will forgive their iniquity and will remember their sin no more.' 'Remember no more' means God chooses not to hold our sins against us. This grace is the foundation of the new covenant: forgiveness based on God's sovereign decision to pardon.`,
    learnMore:
      `The Hebrew verb 'yada' (know) means intimate knowledge, the same word used for knowledge between husband and wife (Genesis 4:1). The new covenant democratizes this knowledge. The forgiveness promise uses the strongest possible language: 'remember' includes the idea of acting on what one remembers; God will never act against us because of our sins. The author of Hebrews applies this to Christ: 'Where these have been forgiven, there is no longer any offering for sin' (Hebrews 10:18). For further study on the new covenant, see the resources at https://www.biblegateway.com/passage/?search=Jeremiah+31&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Matthew",
    chapter: 5,
    verseNumber: 14,
    explanation:
      `Jesus uses the metaphor of light to describe His disciples' identity. 'You are the light of the world' — a statement of fact, not possibility. The image of a city on a hill suggests visibility and witness. Just as a city lit at night cannot be concealed, the lives of believers shine forth the reality of the kingdom in a dark world. The light is not their own brilliance but Christ's reflected glory. Christian visibility is not about prominence but about the gospel being visible through lives of good works.`,
    learnMore:
      `This is part of the Sermon on the Mount (Matthew 5-7). The light metaphor echoes the Old Testament where light represents God's presence and the call for Israel to be a light to the nations (Isaiah 42:6, 49:6). Jesus applies the imagery directly to His disciples, showing the church has taken up Israel's mission. The point is simple: a city built on a hill cannot be hidden. For further study of the Sermon on the Mount, see the resources at https://www.biblegateway.com/passage/?search=Matthew+5&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Matthew",
    chapter: 5,
    verseNumber: 15,
    explanation:
      `Jesus continues the light image: people do not light a lamp and cover it. To light a lamp and then hide its light would be nonsensical. The lamp must be placed on a stand to illuminate the whole room. This means our faith must be visible — not hidden by the daily concerns of life. The 'basket' (modios) used to measure grain suggests that the very things we use for daily provision can conceal the light if we let them. The lampstand is where the light belongs — elevated, effective, fulfilling its purpose. The goal of visibility is not human approval but divine glory.`,
    learnMore:
      `The modios was a Roman grain measure. Jesus uses it to warn that normal life routines can obscure our witness. The lampstand was a common household item — the point is simply that light must shine where it can be seen. The ultimate purpose is not to draw attention to ourselves but to God. For more on the light metaphor in the Sermon on the Mount, see the resources at https://www.biblegateway.com/passage/?search=Matthew+5&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Matthew",
    chapter: 5,
    verseNumber: 16,
    explanation:
      `Jesus concludes His teaching on salt and light. The command is to let your light shine before others through good deeds. These 'good deeds' (kala erga) are not works done to earn salvation but the beautiful fruit of transformed lives. The watching world takes note, and the goal is doxological — people glorify the Father in heaven. God is the ultimate source of all good works. This captures the mission: our good works are the visible demonstration of invisible grace.`,
    learnMore:
      `Matthew 5:16 shows the proper relationship of faith and works: not the basis but the result of salvation. The early church fathers noted that the changed lives of Christians — their care for the poor, love for enemies, and purity — was a major factor in church growth. The world could not deny the quality of their deeds and was led to inquire about the source. For a thorough exposition of the believers' witness, see the resources at https://www.biblegateway.com/passage/?search=Matthew+5&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Matthew",
    chapter: 6,
    verseNumber: 9,
    explanation:
      `The Lord's Prayer opens with 'Our Father in heaven, hallowed be Your name.' The intimacy of 'Father' (Abba) is balanced by reverence for God's holy name. In Hebrew thought, God's name is connected to His character and presence. To 'hallow' His name is to treat it as holy and desire that God manifest His holiness in the world. The prayer begins with the highest priority — God's glory — before presenting human needs. This order teaches that prayer should begin with adoration and submission to God's majesty.`,
    learnMore:
      `The Lord's Prayer is given as a model in Matthew 6 and Luke 11. 'Our Father' establishes corporate prayer — we pray as part of God's family. 'Hallowed be Your name' recognizes that God's name is already holy, but we pray that all would recognize it as such. The three 'You' petitions come first (name, kingdom, will) followed by three 'we' petitions (bread, forgiveness, deliverance), teaching the priority of God's concerns over our own. For a comprehensive study, see the resources at https://www.biblegateway.com/passage/?search=Matthew+6&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Matthew",
    chapter: 6,
    verseNumber: 10,
    explanation:
      `'Your kingdom come, Your will be done, on earth as it is in heaven.' This petition expresses longing for God's sovereign rule to be fully manifested. 'Your kingdom come' refers to both the future consummation and the present advance of God's reign through the gospel. 'Your will be done' connects the kingdom to obedient living. In heaven, God's will is done perfectly; we pray for the same on earth. This is a prayer for submission to God's purposes and for the spread of His reign, both personal and cosmic.`,
    learnMore:
      `The kingdom of God is the central theme of Jesus' teaching, appearing over 100 times in the Gospels. Jesus taught that the kingdom is both present (Luke 17:21) and future (Matthew 25). The petition for God's will includes personal submission — Jesus' prayer in Gethsemane is the perfect model. The phrase 'on earth as it is in heaven' asks that earth's reality align with heaven's perfection. For further study, see the resources at https://www.biblegateway.com/passage/?search=Matthew+6&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Matthew",
    chapter: 6,
    verseNumber: 11,
    explanation:
      `'Give us this day our daily bread.' This petition turns from God-centered requests to human needs. The Greek word 'epiousios' (daily) is a rare word meaning 'necessary for existence' or 'for the coming day.' The request is for bread — the basic staple of life — not luxuries. The prayer is for 'us,' not 'me,' acknowledging solidarity with others. This teaches humble dependence on God for daily provision, like the manna in the wilderness (Exodus 16). We place physical needs within the larger context of God's rule and glory.`,
    learnMore:
      `The word 'epiousios' appears almost nowhere outside the Lord's Prayer. The most common translations are 'necessary for existence' or 'for the coming day.' This echoes Proverbs 30:8: 'Give me neither poverty nor riches, but only my daily bread.' The petition also carries a social dimension — praying for 'our' bread means acknowledging responsibility for the needs of all God's children. For further study on this petition, see the resources at https://www.biblegateway.com/passage/?search=Matthew+6&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Matthew",
    chapter: 6,
    verseNumber: 12,
    explanation:
      `'Forgive us our debts, as we also have forgiven our debtors.' This petition connects divine forgiveness to human forgiveness. The Greek word for 'debts' represents sins as obligations we owe to God but cannot repay. This acknowledges our ongoing need for forgiveness even after conversion. The terrifying condition 'as we also have forgiven' is not a merited bargain but a logical connection: those who experience God's forgiveness will necessarily extend it. An unforgiving heart shows one does not truly understand the forgiveness received.`,
    learnMore:
      `The parallel in Luke 11:4 uses 'sins' instead of 'debts.' Jesus reinforces this in verses 14-15: if you forgive others, you will be forgiven; if not, you won't. This is not works-righteousness but a warning that unforgiveness reveals a heart unchanged by grace. The parable of the unforgiving servant (Matthew 18:21-35) underscores this: a servant forgiven an enormous debt refused to forgive a trivial one. For a deep study of this teaching, see the resources at https://www.biblegateway.com/passage/?search=Matthew+6&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Matthew",
    chapter: 6,
    verseNumber: 13,
    explanation:
      `'Lead us not into temptation, but deliver us from evil.' This petition asks for protection. Since James 1:13 says God does not tempt anyone, the best understanding is a prayer to be kept from tests that would overwhelm our faith. The second petition, 'deliver us from evil' may refer to 'the evil one.' The believer prays for protection from both the power of evil and from Satan. The doxology — 'For Yours is the kingdom and the power and the glory forever' — redirects focus back to God's sovereignty.`,
    learnMore:
      `The Greek verb 'eisenegkes' can mean 'do not bring us into' or 'do not let us fall into.' The word for temptation can also mean 'testing' designed to strengthen faith (James 1:2-4). The doxology is not found in the oldest manuscripts and may have been a later liturgical addition, reflecting 1 Chronicles 29:11-13. For a comprehensive study of the Lord's Prayer in its original context, see the resources at https://www.biblegateway.com/passage/?search=Matthew+6&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[3]",
  },
  {
    bookName: "Matthew",
    chapter: 22,
    verseNumber: 37,
    explanation:
      `Jesus answers the Pharisee' question about the greatest commandment by quoting Deuteronomy 6:5: 'Love the Lord your God with all your heart, soul, and mind.' The heart represents the inner self — the center of will and emotions. The soul is one's very life and being. The mind represents the intellectual dimension of loving God. Jesus adds 'mind' to the original threefold formula, indicating that love for God must be comprehensive and intentional. This command shows the whole-life commitment that God's love requires.`,
    learnMore:
      `Jesus adds 'mind' to the original Shema (Deuteronomy 6:5), bringing the intellectual dimension of love into focus. The repetition of 'all' emphasizes absolute totality of devotion. Jesus did not invent a new command but reaffirmed what had always been the first and greatest. For a detailed study of Jesus' use of the Shema and its implications, see the resources at https://www.biblegateway.com/passage/?search=Matthew+22&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Matthew",
    chapter: 22,
    verseNumber: 38,
    explanation:
      `Jesus declares this the 'greatest and first commandment.' The word 'first' means both first in order and first in rank. No commandment supersedes the command to love God. All other commandments find their source in this first command. Ethics and moral obligations flow from the love of God. The preeminence of this command means loving others is possible only when it grows out of the prior love for God. The vertical relationship with God is the foundation for all horizontal relationships.`,
    learnMore:
      `The priority of the love command is reflected in the Decalogue's structure: the first four commands concern love for God, the last six concerning love for neighbor. Jesus' teaching in the Sermon on the Mount follows this pattern. The priority does not mean the second is optional but that it flows from the first. One cannot truly love God and hate one's brother. For more on the relationship between the two greatest commandments, see the resources at https://www.biblegateway.com/passage/?search=Matthew+22&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Matthew",
    chapter: 22,
    verseNumber: 39,
    explanation:
      `The second great commandment is 'Love your neighbor as yourself.' Jesus quotes Leviticus 19:18. 'As yourself' does not command self-love but sets the measure: the same care and attention we give ourselves we must give others. The parable of the Good Samaritan demonstrates this neighbor love extends beyond family, friends, and country to include those considered enemies. This command, with the first, captures the essence of the entire Old Testament law. The two are inseparable — love for God expressed through love for others.`,
    learnMore:
      `The pairing of love for God and neighbor is distinctive to Jesus' teaching. The command to love your neighbor appears in Leviticus 19:18 in the context of loving the foreigner (verse 34), showing that neighbor extends beyond the immediate community. Paul writes in Galatians 5:14 that 'the entire law is fulfilled in one word: Love your neighbor as yourself.' For a thorough study, see the resources at https://www.biblegateway.com/passage/?search=Matthew+22&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Mark",
    chapter: 10,
    verseNumber: 45,
    explanation:
      `Jesus states His mission's purpose: 'The Son of Man came not to be served but to serve, and to give His life as a ransom for many.' This overturns the world's understanding of greatness. The Greek word for 'ransom' (lytron) is a market term describing the price paid to free a slave. Jesus is the ransom that purchases our freedom. The word 'for many' (anti pollon) specifies substitution — His life in place of others. This is the clearest statement in Mark about the purpose of Jesus' death.`,
    learnMore:
      `Mark 10:45 is the most important verse for understanding Jesus' purpose in Mark. The immediate context is Jesus' teaching about how in the kingdom, greatness is measured by servanthood. The Greek preposition 'anti' means 'in place of,' emphasizing substitutionary atonement. The 'many' echoes Isaiah 53:11 -12 where the Servant bore the sins of many. This verse provides the theological framework for understanding the cross. For a deeper study, see the resources at https://www.biblegateway.com/passage/?search=Mark+10&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2, 3]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 11,
    explanation:
      `Jesus begins the parable of the Prodigal Son by introducing a man with two sons. This parable, along with the lost sheep and lost coin (Luke 15:3-10), answers the Pharisees' complaint that Jesus welcomes sinners. The younger son's request for his inheritance early was a profound insult — essentially saying 'I wish you were dead.' The father's willingness to grant it shows God's willingness to allow humans freedom. The opening sets up the drama: the tension between the son's entitlement and the father's patient love.`,
    learnMore:
      `Luke 15 is often called 'the Gospel of the Outcast.' The request for the inheritance in advance was deeply offensive in the ancient Near East. The father's compliance shows God allowing rebellion. The parable is often called 'The Prodigal Son' but might be better called 'The Loving Father,' since the father's love is the true focus. For a comprehensive study of the parables of grace in Luke 15, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 12,
    explanation:
      `The younger son's demand for his share of the estate severs family obligation. In the ancient Near East, land and inheritance were tied to family identity. By asking for his portion early, he declared his desire to sever the relationship. The father's willingness to divide the property is remarkable — against all social convention. This portrays a God who allows His children freedom. The economic sacrifice of liquidating property shows the cost of sin to those who love the sinner.`,
    learnMore:
      `The younger son's request uses a Greek phrase carrying legal weight. The division of property between sons was governed by Deuteronomy 21:17; the younger would receive about one-third of the estate. The father would have suffered genuine economic loss — demonstrating the cost of sin not only to the sinner but to those who love him. For more on the social and legal background, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 13,
    explanation:
      `The younger son journeyed to a distant country and squandered his inheritance on reckless living. The 'distant country' symbolizes the spiritual distance sin creates. The word for 'wasted' (diaskevazo) means to scatter or squander. His reckless living shows the empty pursuit of pleasure that leads to ruin. The severe famine represents sin's natural consequences: what began in prosperity ends in destitution. This illustrates sin's pattern: it promises freedom but delivers slavery.`,
    learnMore:
      `The Greek phrase for 'a distant country' appears in the Septuagint of Deuteronomy 28:64 where God warns that forsaking Him leads to scattering. The son's feeding pigs would have been the ultimate degradation for a Jewish audience, since pigs were unclean. This detail underscores how far rebellion takes us. For further study, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 17,
    explanation:
      `The turning point: 'He came to his senses.' The Greek phrase means 'came to himself' — recovering from delusion to see reality. This is the first step of repentance: seeing things as they truly are. The son compares his state with his father's hired servants; even they have bread to spare while he starves. The contrast between abundance in the Father's house and destitution away from him is a picture of life in God's presence versus life apart from Him. The son's repentance begins with honest self-awareness.`,
    learnMore:
      `The phrase 'came to his senses' describes repentance as restored rationality. Sin blinds us to God's goodness. The son's reasoning includes 'enough to spare' — there is abundance in the Father's house (v God's house is a place of provision (Psalm 23:5, John 10:10). For a deeper treatment of the nature of repentance in the parables, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 18,
    explanation:
      `The rehearsed confession: 'I have sinned against heaven and before you.' The order is significant — against heaven first, then against you. True repentance recognizes sin is ultimately against God. The phrase 'I am no longer worthy to be called your son' shows genuine humility. The son does not come with demands but acknowledges unworthiness and offers to become a hired servant. This is the model of biblical repentance: not bargaining but throwing ourselves on mercy.`,
    learnMore:
      `The confession follows the pattern of Psalm 51:4: 'Against You, You only, have I sinned.' 'Against heaven' uses the Jewish reverential circumlocution for God. The father later interrupts the speech — he does not accept the son's terms but offers far more. This mirrors the gospel: we come expecting to be slaves and receive sonship. For more on the nature of repentance, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 20,
    explanation:
      `This verse is the emotional climax. The son returns, hoping to be hired as a servant, but 'while he was still a long way off, his father saw him and was filled with compassion.' The father runs to his son, embracing and kissing him. In ancient culture, running was undignified for an adult man, but love overrides convention. This reveals God's heart: not a stern judge waiting for groveling but a loving Father who eagerly watches for our return. The son's prepared speech is interrupted by the father's unconditional acceptance.`,
    learnMore:
      `The father 'saw him' — he was watching and waiting for his son's return, depicting God as actively seeking the lost. The father's running shows love overcoming pride. The son's confession is interrupted by the father's commands for celebration — God does not wait for us to finish our confession but acts immediately with acceptance. For a deeper study of the father's love as a revelation of God's character, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 22,
    explanation:
      `The father ignores the son's suggestion of becoming a hired servant and commands the best robe, a ring, and sandals. The robe symbolizes honor and covers shame — as Christ's righteousness covers sin. The ring is a signet ring symbolizing authority and restored position in the family. Sandals distinguish a son from a servant. The father does not wait for the son to earn his way back but restores him fully. This is grace: not merely forgiveness but complete restoration to full, honored children.`,
    learnMore:
      `The 'best robe' - the first robe — was the father's own finest garment. The ring gave authority to act on the owner's behalf. The sandals ended the son's barefoot status as a servant. The father acted 'quickly' — no delay, no probation. Grace is immediate and complete. For a detailed study of this imagery and its meaning, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 23,
    explanation:
      `The father slaughters the fattened calf — saved for the most important occasion — declaring this is the greatest cause for celebration. The feast captures the biblical theme of salvation as a banquet. The father's joy is exuberant: the son who was dead is alive, lost and found. This echoes the cross's pattern: Christ's sacrifice makes possible the celebration of our restoration. The feast anticipates the 'marriage supper of the Lamb' when all God's children gather at His table.`,
    learnMore:
      `The celebration imagery connects to the biblical theme of salvation as a great feast (Isaiah 25:6-8). Jesus continually taught about the kingdom as a wedding banquet (Matthew 22:1-14). The phrase 'dead and is alive again' uses resurrection language: this is about spiritual death and new life. The parable of the prodigal son is a summary of the entire gospel. For a study of the feast metaphor in Jesus' parables, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[3]",
  },
  {
    bookName: "Luke",
    chapter: 15,
    verseNumber: 24,
    explanation:
      `'This son of mine was dead and is alive again; he was lost and is found.' This captures the movement from death to resurrection at the gospel's heart. 'Dead' and 'lost' describe the state before repentance; 'alive again' and 'found' describe what repentance accomplished. The father reclaims his son intimately — 'this son of mine' — even though the son had forfeited his claim. The celebration that began is the start of never-ending joy. The pattern of dead-alive, lost-found becomes the fourfold description of conversion.`,
    learnMore:
      `This pattern appears throughout the New Testament: believers 'dead in trespasses' made 'alive together with Christ' (Ephesians 2:5). The earlier parables in Luke 15 also end with 'found' (verse 6, 9). Jesus' table fellowship with sinners was celebration because He has power to find the lost and raise the dead. For a full theological analysis of the Prodigal Son as a summary of the gospel, see the resources at https://www.biblegateway.com/passage/?search=Luke+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 3]",
  },
  {
    bookName: "John",
    chapter: 1,
    verseNumber: 14,
    explanation:
      `The Word became flesh and dwelt among us. 'Flesh' emphasizes full humanity with all its limitations. The verb 'tabernacled' evokes the Old Testament tabernacle where God dwelt among Israel. The disciples 'beheld His glory' — the same glory that appeared on Sinai, in the tabernacle, and in the temple. This glory is marked by 'grace and truth' — italic Hebrew words describing God's character revealed to Moses (Exodus 34:6). The incarnation is the definitive revelation of God.`,
    learnMore:
      `John 1:14 is a crucial Christological verse. The verb 'became flesh' means entering full human existence — including weakness and vulnerability (Hebrews 2:14-18). The phrase 'grace and truth' translates the Hebrew 'chesed ve'emet' from Exodus 34:6 — John claims Jesus embodies all God revealed to Moses in the burning bush. For a thorough study of the incarnation in John 1:14, see the resources at https://www.biblegateway.com/passage/?search=John+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "John",
    chapter: 10,
    verseNumber: 9,
    explanation:
      `Jesus is the gate for the sheep — exclusive access and complete provision. The gate imagery comes from the sheepfold: one opening serving as entrance and exit. The shepherd would lie across the opening, becoming the gate. Jesus says whoever enters through Him will be saved, go in and out safely, and find pasture. This verse contains the three essentials of the Christian life: entry (salvation through Christ), security (protection in Christ), and sustenance (provision from Christ).`,
    learnMore:
      `John 10:9 is one of the seven 'I am' sayings in John's Gospel. The gate was immediately understandable to Jesus' Galilean audience, where sheepherding was common. The exclusivity of Jesus' claim sets Christianity apart from pluralistic religion. The freedom to 'come and go' reflects safety under the shepherd's protection. For a detailed study of the 'I am' sayings and the Good Shepherd discourse, see the resources at https://www.biblegateway.com/passage/?search=John+10&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "John",
    chapter: 10,
    verseNumber: 10,
    explanation:
      `Jesus contrasts His mission with the thief's: the thief steals, kills, and destroys; Jesus gives abundant life. The Greek word 'zoe' means eternal life — not just existence but the full, overflowing quality of life that comes from knowing God. The phrase 'to the full' means superabundant, excessive, beyond measure. This defeats any caricature of Jesus as a killjoy. His purpose is not to restrict but to liberate into full, God-intended expression.`,
    learnMore:
      `The word 'zoe' appears over 30 times in John and is always more than biological life — it's the life of God given to believers. 'Abundant life' is often misunderstood as material prosperity, but the context shows it's spiritual abundance flowing from union with Christ (the true vine). For a comprehensive study of the abundant life theme, see the resources at https://www.biblegateway.com/passage/?search=John+10&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "John",
    chapter: 10,
    verseNumber: 11,
    explanation:
      `'I am the good shepherd.' The Greek word 'kalos' means good, beautiful, noble, and ideal. The Good Shepherd does what no hired hand would do: He lays down His life for the sheep, fulfilling the Old Testament imagery of God as Shepherd (Psalm 23, Isaiah 40:11, Ezekiel 34). The willingness to die demonstrates the severity of the danger and the depth of the Shepherd's love. This is the first explicit prediction of Jesus' death in this discourse.`,
    learnMore:
      `Ezekiel 34 is crucial background: God condemns Israel's leaders as false shepherds and promises, 'I Myself will search for My sheep.' The Good Shepherd has two distinct traits: He knows His sheep intimately (verse 14) and He lays down His life for them. The Greek 'kalos' adds beauty and nobility to the concept of goodness. This connects to the Suffering Servant of Isaiah 53 who pours out His life. For a thorough study, see the resources at https://www.biblegateway.com/passage/?search=John+10&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "John",
    chapter: 14,
    verseNumber: 6,
    explanation:
      `'I am the way, the truth, and the life. No one comes to the Father except through Me.' This is the most exclusive claim Jesus made. He is the way (unique path to the Father), the truth (the ultimate reality and revelation of God), and the life (the source of eternal life). The conclusion is uncompromising: only through Him can anyone come to the Father. This claim is rooted in His identity — if Jesus is God incarnate, He must be the only way to God.`,
    learnMore:
      `This is in response to Thomas asking how to know the way. Jesus' answer: He IS the way. The three terms form an interconnected reality: the way of salvation is through the truth of the gospel that gives life. Acts 4:12 echoes the claim: 'Salvation is found in no one else.' For a deeper study of the exclusivity of Christ and its implications for mission, see the resources at https://www.biblegateway.com/passage/?search=John+14&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2, 3]",
  },
  {
    bookName: "Acts",
    chapter: 1,
    verseNumber: 8,
    explanation:
      `Jesus' final words: power through the Holy Spirit for worldwide witness. The Greek word for 'power' (denasmis) means enablement for action — not natural talent but supernatural ability from the Holy Spirit at Pentecost. The geographical progression outlines the book of Acts: Jerusalem, Judea and Samaria, and the ends of the earth. The mission is the church's central purpose. The Spirit equips, believers depend, and the expansion begins. This is the Great Commission.`,
    learnMore:
      `Acts 1:8 serves as the table of contents for Acts: Jerusalem (chapters 1-2), Judea and Samaria (chapter 8), ends of the earth (chapters 13-28). The phrase 'ends of the earth' echoes Isaiah 49:6. The historical progression from 120 disciples in an upper room to a global faith testifies to the Spirit's power through human witnesses. For a thorough study of Acts and the spread of the gospel, see the resources at https://www.biblegateway.com/passage/?search=Acts+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Acts",
    chapter: 2,
    verseNumber: 38,
    explanation:
      `Peter commands repentance and baptism in the name of Jesus Christ for the forgiveness of sins and the gift of the Holy Spirit. Repentance means a change of heart and direction — turning from sin to God. Baptism identifies the believer with Jesus in His death and resurrection. The promise is dual: forgiveness and the Holy Spirit. The Spirit is not just for a few but for all who repent and believe. This is the pattern of conversion and the entry into the new community of faith.`,
    learnMore:
      `Acts 2:38 is critical for understanding the apostolic message. The audience was convicted by the Spirit after the Pentecost sermon and asked 'What must we do?' (verse 37). The pattern — repentance, baptism, forgiveness, Spirit — is the pattern for conversion in Acts. Baptism is not baptismal regeneration but the outward response to the gospel preceded by repentance. For an in-depth analysis of the conversion model in Acts, see the resources at https://www.biblegateway.com/passage/?search=Acts+2&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1]",
  },
  {
    bookName: "Romans",
    chapter: 5,
    verseNumber: 8,
    explanation:
      `God shows His love for us: while we were still sinners, Christ died for us. The Greek word 'synistesi' means to demonstrate, prove, or establish beyond doubt. The cross is the definitive proof of God's love — not words but actions, not blessing our merit but Christ dying while we rebel. The timing is crucial: 'while we were still sinners' — before we cleaned up our lives or made ourselves worthy. This is the opposite of human love, which loves what is lovable. God's love is unconditional because it is based on His character, not our merit.`,
    learnMore:
      `The verse reasons from the greater to the lesser (argument from the greater to the lesser) — if God did the more difficult thing (saving sinners), He will surely do the easier thing (preserving us as His children). This is one of the most reassuring passages about the nature of divine love. For a thorough study of this verse in the context of Romans 5, see the resources at https://www.biblegateway.com/passage/?search=Romans+5&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Romans",
    chapter: 12,
    verseNumber: 1,
    explanation:
      `Paul appeals by God's mercies: present your bodies as living sacrifices, holy and pleasing to God — your spiritual worship. The 'therefore' connects to all Paul has said about God's grace (chapters 1-11). The 'living sacrifice' is a consecrated life. The phrase 'renewal of your mind' leads to transformation, not conformity to the world. This shift from doctrinal to practical (chapters 12-16) shows that right belief leads to right living.`,
    learnMore:
      `Romans 12:1 marks the transition from doctrinal exposition to practical application. The body represents the whole person, including action in the world. According to Greek understanding, 'spiritual worship' (logike latreia) means rational, reasonable service. The transformation starts with the renewal of the mind — thinking differently. For a comprehensive study of the Christian life and worship, see the resources at https://www.biblegateway.com/passage/?search=Romans+12&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "1 Corinthians",
    chapter: 15,
    verseNumber: 3,
    explanation:
      `Paul delivers the core gospel: Christ died for our sins according to the Scriptures, was buried, and raised on the third day according to the Scriptures. The phrase 'of primary importance' indicates the gospel is the foundation of everything else. Christ's death is 'for our sins' — substitutionary atonement. His burial confirms His real death. His resurrection on the third day vindicates His claims and demonstrates victory over death. This is the gospel — not one truth among many but the central truth of Christianity.`,
    learnMore:
      `This is one of the earliest creedal statements in the New Testament, dating to within a few years of the resurrection. The repeated 'according to the Scriptures' shows the gospel's fulfillment of Old Testament prophecy. The three events — died, buried, raised — form the foundational facts of the Christian faith. For a thorough study of the gospel according to Paul, see the resources at https://www.biblegateway.com/passage/?search=1+Corinthians+15&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2]",
  },
  {
    bookName: "Galatians",
    chapter: 5,
    verseNumber: 22,
    explanation:
      `The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control. The singular 'fruit' (not 'fruits') means these are a unified cluster of Christlike character produced by the Holy Spirit, not human effort. This fruit is the visible manifestation of the Spirit's work in the believer's life, contrasting with the works of the flesh (verses 19-21). The fruit is produced by the Spirit; the believer's role is to remain in Christ and walk by the Spirit.`,
    learnMore:
      `The list of nine virtues reflects the character of Jesus Christ. Unlike the 'works of the law' which are human effort, the fruit is produced by the Spirit's presence. The phrase 'against such there is no law' indicates these qualities are the goal of the Christian life. Paul describes the contrast between depending on the Spirit for transformation versus relying on human ability. For a thorough study of the fruit of the Spirit, see the resources at https://www.biblegateway.com/passage/?search=Galatians+5&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "Ephesians",
    chapter: 2,
    verseNumber: 8,
    explanation:
      `By grace you have been saved through faith, and this is not from yourselves — it is the gift of God, not by works, so that no one can boast. This is the classic statement of salvation by grace through faith. Grace is the source: God's unmerited favor. Faith is the means: the instrument that receives salvation. Salvation is a gift, not a wage earned by works. The purpose is to eliminate boasting — if works saved, we could boast in our achievement. But because it is all grace, glory goes to God alone.`,
    learnMore:
      `This passage sparked the Protestant Reformation. The order is: grace (source), faith (means), salvation (result). 'Not by works' means works contribute nothing to our salvation — we are saved for good works, not by them (verse 10). The exclusivity of grace humbles all human pride. For a comprehensive study of salvation by grace through faith, see the resources at https://www.biblegateway.com/passage/?search=Ephesians+2&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2, 3]",
  },
  {
    bookName: "Philippians",
    chapter: 3,
    verseNumber: 7,
    explanation:
      `Paul considers everything — his religious credentials, status, achievements — as loss for the sake of knowing Christ Jesus. The word for 'loss' (zemia) means damage, loss, or forfeiture — everything Paul once valued is now counted as rubbish (skubalon, refuse, dung) compared to the surpassing value of knowing Christ. This radical reevaluation comes from encountering the risen Lord. Knowing Christ is not a mental exercise but an intimate, personal relationship that overshadows everything. Everything that seemed valuable before is worthless compared to this priceless treasure.`,
    learnMore:
      `Paul lists his credentials in verses 5-6: circumcised on the eighth day, Israelite, Benjaminite, Hebrew, Pharisee, persecutor of the church, righteous under the Law. He was at the top of every category, but these all pale in comparison to knowing Christ. The word 'skubala' (rubbish) is a strong term. Paul is not saying these things are inherently bad but that they are worthless for salvation compared to the surpassing value of Christ. For a thorough study of the powers and the limits of human achievement, see the resources at https://www.biblegateway.com/passage/?search=Philippians+3&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 6,
    explanation:
      `Instead of being anxious, present your requests to God with gratitude, and the peace of God which surpasses understanding will guard your hearts and minds in Christ Jesus. The Greek word for 'anxious' means to be pulled apart or distracted. Prayer is the antidote: presenting everything to God. The phrase 'peace of God' means the peace that belongs to God and flows from Him. 'Guards' is a military term — the peace posts sentries around the believer's heart and mind. This promise transforms worry into worship.`,
    learnMore:
      `Peace that 'surpasses understanding' means it transcends our ability to explain it — the believer has peace even when circumstances suggest no peace should exist. The connection between supplication (prayer) and thanksgiving is important: gratitude protects the heart from self-centered requests. 'In Christ Jesus' is the sphere in which this peace operates. For a thorough study of anxiety and peace, see the resources at https://www.biblegateway.com/passage/?search=Philippians+4&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "Hebrews",
    chapter: 12,
    verseNumber: 1,
    explanation:
      `Surrounded by a cloud of witnesses, we should lay aside every weight and sin and run with endurance the race set before us, fixing our eyes on Jesus, the author and perfecter of faith. The 'cloud of witnesses' are the heroes of faith from chapter 11. As they cheer us forward, we shed every hindrance and sin. The Greek word for 'run' conveys not leisurely but directed, purposeful movement. The text affirms that faith is inspired and completed by Jesus, who endured the cross for the joy set before Him.`,
    learnMore:
      `The author of Hebrews writes to believers tempted to give up. The imagery is of a race: you cannot run well carrying unnecessary weight. The 'sin which so easily ensnares' (hamartia euperistasis) suggests sin wraps around like a flowing garment that trips you. The key is fixing your eyes on Jesus — not on circumstances or on other people. He is the author (originator) and perfecter (completer) of our faith. For a comprehensive study of this passage, see the resources at https://www.biblegateway.com/passage/?search=Hebrews+12&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "James",
    chapter: 1,
    verseNumber: 2,
    explanation:
      `Count it all joy when you meet trials of various kinds, knowing that the testing of faith produces steadfastness, and steadfastness must have its full effect so you may be perfect and complete, lacking nothing. James calls for joy in trials — not because trials are good in themselves but because they produce God's good purpose in us. The Greek word for 'testing' (dokimion) means proving or approving — like testing metal to verify its quality. Steadfastness (hypomone) is persevering endurance that matures character.`,
    learnMore:
      `James addresses believers scattered by persecution. This is one of the most counter-cultural teachings in Scripture: find joy in difficulties because of what they produce. The progression: trial produces, perseverance produces maturity, and maturity leads to 'perfect and complete' lacking nothing. This does not require pretending trials don't hurt but seeing their purpose. For a thorough study of the role of trials in the Christian life, see the resources at https://www.biblegateway.com/passage/?search=James+1&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2]",
  },
  {
    bookName: "1 Peter",
    chapter: 5,
    verseNumber: 6,
    explanation:
      `Humble yourselves under the mighty hand of God so He may exalt you at the proper time by casting all your worries on Him because He cares for you. Humility is the path to exaltation. The 'mighty hand of God' echoes the Red Sea deliverance — God who delivers can be trusted with every need. Casting cares is an active choice, not passive waiting. Because He 'cares for you' — the verb (melo) means He is concerned, show interest, and bears our well-being. Our worries are welcome with God; He can be trusted with them.`,
    learnMore:
      `The context is Peter's instruction to 'younger men' and to 'all' (verse 5). Humility is to be mutual submission. The 'mighty hand' is both discipline and deliverance — the same hand that humbles exalts. The phrase 'casting all your worries' uses the verb (epiripto) meaning to throw on, to toss onto. The asyndeton (no connecting word) suggests immediacy. For a comprehensive study of the sovereign care of God for His people, see the resources at https://www.biblegateway.com/passage/?search=1+Peter+5&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[2, 3]",
  },
  {
    bookName: "1 John",
    chapter: 4,
    verseNumber: 9,
    explanation:
      `God's love was revealed among us: He sent His one and only Son into the world so that we might live through Him. This is love: not that we loved God but that He loved us and sent His Son as an atoning sacrifice for our sins. The initiative is God's. The Father sent His Son first — while we were indifferent and hostile. The word 'propitiation' (hilasmos) means the sacrifice that turns aside wrath and satisfies justice. Our love is a response; His love is the source. This passage is the fullest explanation of divine love in the New Testament.`,
    learnMore:
      `The word 'love' (agape) appears over 50 times in 1 John. John emphasizes both the origin (God is love, verse 8 and 16) and the demonstration (He sent His Son truly, verse 10). The three phases are: God is love, love was revealed, we should love one another. 'Propitiation' is a theological term that describes the cross as satisfying God's just demands and removing the barrier of wrath. John quotes Jesus in John 3:16, focusing on the relationship between love and the atoning sacrifice. For a detailed study, see the resources at https://www.biblegateway.com/passage/?search=1+John+4&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[1, 2, 3]",
  },
  {
    bookName: "Revelation",
    chapter: 21,
    verseNumber: 1,
    explanation:
      `John sees new heaven and new earth — the first heaven and earth had passed away, and the sea was no more. The holy city descends from heaven, and a loud voice announces: 'The dwelling of God is with humanity.' The Greek word for 'new' (kaine) means new in quality, not just time. The absence of the sea symbolizes the removal of what separates — chaos, danger, death. The tabernacle language echoes the Exodus: as God dwelt among Israel, He will dwell among all redeemed humanity. This is the goal of creation.`,
    learnMore:
      `The first heaven and earth have passed away — this is the end of the old order of sin, rebellion, and separation. The 'new' creation is a new quality of existence, not a replacement. The sea may represent that which made creation unstable and dangerous (as in Ancient Near Eastern mythology). The city coming down from heaven shows that salvation's goal is not us going up but God coming down. For a detailed exposition of Revelation 21, see the commentaries by G.K. Beale and Craig Keener at https://www.biblegateway.com/passage/?search=Revelation+21&version=BSB`,
    bibleVersion: "BSB",
    promptIds: "[3]",
  },
];
