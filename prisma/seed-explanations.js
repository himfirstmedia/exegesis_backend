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
    learnMore:
      "The doctrine of creation ex nihilo (creation out of nothing) is a cornerstone of Christian theology, affirmed by the early church fathers such as Irenaeus, Augustine, and Athanasius. Unlike Greek philosophers who believed in eternal matter or the Gnostics who viewed the material world as evil, Christianity has always maintained that God created the universe freely, out of nothing, by His word alone. This truth has profound implications for how we understand human dignity, the value of the physical world, and the basis for scientific inquiry. The phrase 'the heavens and the earth' is a merism — a figure of speech where two opposites encompass the whole, meaning everything that exists. For a deeper study of Genesis 1:1 in its original Hebrew context and how it compares with other ancient Near Eastern creation accounts, see the Berean Study Bible commentary and the works of Old Testament scholars like Gordon Wenham and John Walton at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 2,
    explanation:
      "This verse describes the initial state of creation as 'formless and void' (tohu wa-bohu in Hebrew) — not a chaotic or evil condition, but an unshaped, unpopulated raw material awaiting God's creative ordering. The deep waters (tehom) evoke the primordial oceans of ancient Near Eastern cosmology, but unlike neighboring creation myths where the sea represents a hostile chaos deity to be conquered, Genesis presents the deep as simply part of God's creation, passive and obedient before His word. The Spirit of God 'hovering' over the waters uses the Hebrew verb rachaph, which appears elsewhere only in Deuteronomy 32:11 where an eagle stirs up its nest and hovers over its young — an image of tender, life-giving care. This verse thus establishes that the Triune God was actively present and preparing to bring order, beauty, and life out of what was formless and empty, foreshadowing the work of redemption where God brings new creation out of the chaos of sin and death.",
    learnMore:
      "The Hebrew phrase 'tohu wa-bohu' appears in only one other place in the Old Testament — Jeremiah 4:23, where the prophet uses it to describe Judah's impending judgment as a return to primordial desolation. This connection reveals that God's judgment is a reversal of creation, while His salvation is a new creation. The Spirit's hovering (rachaph) is the same verb used in Deuteronomy 32:11 of an eagle stirring its nest, suggesting not passive presence but active, nurturing engagement. Early church fathers like Basil the Great in his Hexaemeron saw in this verse a revelation of the Trinity: the Father speaking, the Word creating, and the Spirit hovering. The 'deep' (tehom) connects etymologically to the Babylonian goddess Tiamat, yet Genesis deliberately demythologizes the sea — it is not a deity but a creature, subject to its Maker. For more on the theological significance of the Spirit's role in creation and the Hebrew cosmology of the deep, see the commentary by Derek Kidner in the Tyndale Old Testament Commentary series and the theological exposition at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 3,
    explanation:
      "As God's first creative command, 'Let there be light' demonstrates that God creates by the power of His spoken word — a theme that resonates throughout Scripture (Psalm 33:6, Hebrews 11:3). This light, created before the sun and moon on the fourth day, is not merely physical illumination but signifies the beginning of order, beauty, and distinction in creation. The separation of light from darkness establishes the foundational pattern of differentiation that characterizes the entire creation week. Theologians have noted that this first creative act foreshadows the coming of Christ, who is described as 'the Light of the world' (John 8:12), and the new creation where God's people will walk in His light forever (Revelation 21:23-24).",
    learnMore:
      "The light created on day one is distinct from the sun and moon created on day four, leading many theologians to identify this primordial light with the Shekinah glory of God — the same divine light that filled the tabernacle (Exodus 40:34), appeared to Moses on Mount Sinai (Exodus 34:29-35), and was manifest in the person of Jesus Christ at His transfiguration (Matthew 17:2). The Apostle Paul explicitly connects this creative light with the light of the gospel in 2 Corinthians 4:6: 'For God, who said, 'Let light shine out of darkness,' made His light shine in our hearts to give us the light of the knowledge of the glory of God in the face of Jesus Christ.' The Hebrew word for light ('or) appears over 200 times in the Old Testament and consistently carries moral and spiritual connotations beyond simple illumination. The rabbinic tradition understood this creation light as a special light that allowed Adam to see from one end of creation to the other, which was later hidden and reserved for the righteous in the age to come. For further study on the theological significance of light in Scripture from creation to the new creation, see the Berean Study Bible notes and the detailed exposition at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 4,
    explanation:
      "Three times in this verse God makes an assessment of His creative work, and each time He declares it 'good' — a word that in Hebrew (tov) conveys not merely moral goodness but beauty, order, functionality, and delight. The separation of light from darkness is the first of several acts of division that structure the creation week, establishing boundaries and categories that bring order out of the original formlessness. This divine evaluation is significant: the material world is not inherently evil or inferior (as some ancient philosophies taught) but is pronounced good by its Creator. The repeated declaration that creation is good establishes a biblical framework for appreciating the physical world, human embodiment, and the goodness of God's gifts while also setting the stage for the even greater declaration of 'very good' at the completion of creation in verse 31. God's ability to see and affirm goodness in His work also serves as a model for human beings created in His image.",
    learnMore:
      "The Hebrew word 'tov' (good) encompasses far more than moral purity — it conveys wholeness, beauty, suitability for purpose, and delight. When God sees that the light is 'tov,' He is affirming that it fulfills its designed function perfectly. This same word is used in Genesis 2:18 when God says it is not 'tov' for Adam to be alone, and in Exodus 2:2 when Moses' mother sees that her son is 'tov' (beautiful/healthy). The concept of God declaring creation good is crucial for developing a biblical theology of the body and the material world. Early church heresies like Gnosticism and Docetism denied the goodness of physical matter, but Genesis stands as a perpetual correction to such views. The separation of light from darkness is the first of three major separations in chapter one (followed by the waters above/below on day two and the sea/dry land on day three), establishing a pattern of distinction and order that undergirds the entire biblical worldview, including later distinctions between holy and common, clean and unclean, Israel and the nations. For a comprehensive treatment of the goodness of creation in the Genesis narrative and its implications for Christian living, consult the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 5,
    explanation:
      "In the act of naming, God exercises His sovereign authority over creation — in ancient Near Eastern thought, to name something was to assert dominion over it. By calling the light 'day' and the darkness 'night,' God establishes the foundational rhythm of time itself, creating the cycle of light and darkness that structures all of life. The refrain 'there was evening, and there was morning — the first day' is profoundly significant. The Hebrew day begins at evening (sunset), following the creation pattern where darkness precedes light, which Paul later reflects upon in describing the new creation: 'For God, who said, 'Let light shine out of darkness,' made His light shine in our hearts' (2 Corinthians 4:6). The ordinal numbering of days — first, second, third — establishes the seven-day week as the fundamental unit of time in Scripture, grounding the Sabbath command in the pattern of creation itself. This also refutes ancient cyclical views of time and establishes a linear, purposeful progression of history toward God's intended goals.",
    learnMore:
      "The creation of the 24-hour day with its evening-morning cycle established the rhythm of life that Scripture consistently affirms. The Jewish practice of beginning the day at sunset (Leviticus 23:32) is rooted in this passage, as is the seven-day week that distinguishes Israel from surrounding cultures that used lunar months or other calendrical systems. The repeated refrain 'there was evening, and there was morning' over six days serves multiple literary and theological purposes: it emphasizes the sequential, ordered nature of creation; it reinforces that each day is a complete unit of ordinary time (arguing against interpretations that these are long geological ages); and it creates a rhythmic structure that builds anticipation for the climactic seventh day. The fact that day one is counted before the sun is created on day four refutes ancient sun-worship practices (common in Egypt and Mesopotamia) by demonstrating that light and time originate from God, not from the heavenly bodies. For more on the theological significance of the creation week structure and its relationship to the Sabbath commandment, see the detailed analysis at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 6,
    explanation:
      "On the second day, God speaks into existence the 'expanse' (raqia in Hebrew) — a term that conveys the idea of something stretched out or spread thin, like hammered metal. The ancient Israelites understood this as a solid dome or vault that separated the waters above from the waters below, forming a cosmic canopy. While modern readers recognize this as the atmosphere or sky, the theological truth remains powerful: God establishes boundaries and order in creation, creating habitable space where life can flourish. The waters above would be released as rain, while the waters below would be gathered to form seas on the third day. This act of separation continues the pattern established on day one — God is a God of order who brings structure out of formlessness. The image of a firmament also carries temple imagery in Scripture, as the heavens are described as God's dwelling place and the earthly tabernacle was built as a copy of the heavenly reality (Hebrews 8:5).",
    learnMore:
      "The Hebrew word 'raqia' comes from the verb 'raqa,' meaning to spread out, stamp, or beat thin — like a metalworker hammering gold into sheets (Exodus 39:3, Isaiah 40:19). This imagery of the sky as a solid dome was common across ancient Near Eastern cultures, but Genesis uniquely demythologizes it: the firmament is not the body of a deity but a creature made by God's word. Biblical language often uses this same verb to describe God's creative power, as in Isaiah 42:5 ('He who created the heavens and stretched them out') and Psalm 104:2 ('He stretches out the heavens like a tent'). The two occurrences of the word 'heavens' (shamayim) in verse 8 use the dual form, reflecting the Hebrew conception of multiple heavens. The apostle Paul references a 'third heaven' in 2 Corinthians 12:2, and Jewish tradition often spoke of seven heavens. The firmament also functions as a boundary that keeps the chaotic waters at bay, much like God's covenant promises hold back the chaos of sin in the lives of believers. For a careful study of the Hebrew cosmology of Genesis and how it relates to modern scientific understanding, see the theological resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 7,
    explanation:
      "This verse records the execution of God's creative command from verse 6. The separation of waters above from waters below by the expanse is one of the great structural divisions of the cosmos in the Genesis creation account. The Hebrew cosmology presented here is not intended as a scientific description but as a theological declaration that the world is ordered, stable, and governed by its Creator. In the ancient world, the waters above the firmament were understood as the source of rain and precipitation, held back by the 'windows of heaven' that God could open or close (Genesis 7:11, Malachi 3:10). The obedience of the waters to God's word stands in stark contrast to ancient Near Eastern myths where the sea gods must be subdued in battle. Here, God simply speaks and it is done — there is no struggle, no resistance, no competing power. This quiet, effortless sovereignty is a profound reassurance that the God who orders the cosmos is also able to order the lives of His people and is worthy of their complete trust.",
    learnMore:
      "The separation of waters above from waters below establishes the hydrological cycle that sustains life on earth — evaporation, condensation, and precipitation. While the ancient Hebrews described this in the language of their time (waters above the firmament, windows of heaven), the underlying truth is that God established the natural order that governs weather and climate. References to the 'storehouses of snow and hail' (Job 38:22) and the 'treasuries of the rain' (Jeremiah 10:13) poetically affirm God's providential control over weather patterns. The flood narrative in Genesis 7:11 explicitly describes the breaking open of the 'fountains of the great deep' and the 'windows of heaven' — a reversal of the creative separation, returning the world to its pre-creation watery state as an act of judgment. This connection between creation and judgment underscores the biblical theme that God is both Creator and Judge, and that His creative order is sustained by His ongoing faithfulness. For further study on the relationship between creation, providence, and judgment in the Genesis narrative, consult the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 8,
    explanation:
      "God names the expanse 'sky' (shamayim in Hebrew), once again exercising His sovereign authority over creation through naming. The Hebrew word shamayim is dual in form, perhaps reflecting the ancient conception of multiple heavens — the atmospheric sky, the stellar heavens, and the dwelling place of God (referred to in the New Testament as the 'third heaven' in 2 Corinthians 12:2). The completion of the second day marks another step in the transformation of the original 'formless and void' state into an ordered, inhabited world. It is worth noting that unlike the other days of creation week, day two receives no explicit declaration of 'it was good.' This omission has intrigued interpreters throughout church history. Some suggest it is because the work of day two was incomplete — the waters below had not yet been gathered and the dry land had not yet appeared. Others see a symbolic connection to the fact that the sky was associated with spiritual forces of darkness in Scripture (Ephesians 6:12), although Israel was strictly forbidden from worshiping the heavenly bodies that inhabit this realm (Deuteronomy 4:19).",
    learnMore:
      "The omission of 'it was good' on day two has generated extensive discussion among biblical commentators. Augustine suggested that the number two symbolizes division and imperfection in contrast to the unity represented by one and the perfection represented by three. Others have noted that the work of day two is incomplete until day three when the dry land appears, making the week symmetrical: days one-three establish realms (light/darkness, sky, land/sea) while days four-six populate those realms (lights, fish/birds, animals/humans). The dual form of shamayim has been understood variously: some see it as a reference to the two heavens (atmospheric and celestial), others as a poetic form indicating greatness or plurality. Jewish tradition in the Talmud (Chagigah 12b) describes seven heavens: Vilon, Rakia, Shechakim, Zevul, Ma'on, Machon, and Aravot — each with its own function and inhabitants. The New Testament reference to the 'third heaven' (2 Corinthians 12:2) reflects this multi-tiered understanding. For a thorough examination of the Hebrew concept of heaven and its development throughout Scripture, see the commentary resources available at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 9,
    explanation:
      "On the third day, God's creative work shifts from separating to gathering. The command for the waters under the sky to gather into one place marks the emergence of dry land from the primordial sea. This act of gathering is the third great separation in the creation account: light from darkness (day one), waters above from waters below (day two), and now dry land from the seas (day three). The emergence of dry land from the waters echoes the exodus theme where God parts the Red Sea to bring His people into the promised land, and looks forward to the new creation where the sea will be no more (Revelation 21:1). The gathering of the waters demonstrates that the physical world is being prepared as a habitable dwelling place for living creatures and ultimately for humanity. This is the first day of creation where a second creative act follows in the same day (the appearance of vegetation in verse 11), indicating that this day carries special significance as the foundation for biological life.",
    learnMore:
      "The gathering of the waters into 'one place' is noteworthy — although we have oceans with different names (Atlantic, Pacific, Indian, Arctic), they are all connected as one global ocean. Modern oceanography confirms what Genesis implies: the continents are surrounded by an interconnected body of water. The emergence of dry land from the sea is a powerful image of salvation throughout Scripture. The parting of the Red Sea (Exodus 14), the crossing of the Jordan (Joshua 3), and the stilling of the storm (Mark 4) all echo this creative act where God demonstrates His power over the waters to deliver His people. The prophet Isaiah connects this directly with the new creation: 'For I am about to create new heavens and a new earth; the former things shall not be remembered' (Isaiah 65:17-18). In the new Jerusalem, the sea is no more (Revelation 21:1), signifying the removal of all chaos, danger, and separation — the full restoration of creation to its intended state of peace and order. The third day also holds special significance in redemptive history as the day of resurrection: Jesus rose from the dead 'on the third day' (1 Corinthians 15:4), inaugurating the new creation. For further study on the typological significance of the third day throughout Scripture, see the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 3]',
  },
  {
    bookName: "Genesis",
    chapter: 1,
    verseNumber: 10,
    explanation:
      "God completes the third day of creation by naming the dry land 'earth' (eretz) and the gathered waters 'seas' (yamim). This final act of naming in the creation account establishes the basic geographical categories of the habitable world. The Hebrew word eretz can refer to the whole earth, a specific land, or the ground underfoot — its usage here encompasses all these meanings. The naming of the seas is particularly significant in light of ancient Near Eastern culture, where the sea was often personified as a chaotic deity (like Tiamat in Mesopotamian myth or Yam in Canaanite religion). By naming the seas, God asserts His sovereignty over them — they are not gods to be feared but part of His creation, subject to His authority. This theme of God's dominion over the sea recurs throughout Scripture in passages like Psalm 89:9 ('You rule the raging sea') and Mark 4:39, where Jesus demonstrates His divine identity by rebuking the wind and the waves. The declaration that this was 'good' affirms that the physical world, with all its boundaries and structures, reflects the wisdom and goodness of its Creator.",
    learnMore:
      "The Hebrew word 'eretz' is remarkably flexible, appearing over 2,500 times in the Old Testament with meanings ranging from 'ground' (Genesis 2:7 — Adam formed from the 'dust of the ground') to 'land' (the land of Israel) to 'whole earth' (all nations). This semantic range reflects a theological truth: the same God who created the entire earth also cares for specific lands and places. The naming of the seas as 'yamim' (plural of yam) is a deliberate demythologization. In Ugaritic texts, Yam is a powerful sea god who battles Baal for supremacy. By having God name the seas, Genesis declares that the supposed deities of pagan nations are merely creatures of Yahweh. This theme of God's sovereignty over the sea is picked up throughout Scripture: Job 38:8-11 describes God setting boundaries for the sea; Psalm 104:25-26 speaks of the sea as a place where Leviathan (another Canaanite chaos monster) plays, reducing it to a pet; and Jesus' act of calming the storm (Mark 4:35-41) is presented as a divine act, causing His disciples to ask, 'Who is this, that even the wind and the sea obey Him?' The sea also serves as an important eschatological symbol in Daniel 7 and Revelation 13, representing the turbulent nations from which beastly kingdoms arise. For a comprehensive study of the biblical theology of the sea and God's sovereignty over creation, see the resources at https://www.biblegateway.com/passage/?search=Genesis+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2, 3]',
  },
  {
    bookName: "Exodus",
    chapter: 20,
    verseNumber: 3,
    explanation:
      "This is the first of the Ten Commandments and establishes the foundational principle of exclusive loyalty to Yahweh. In the ancient Near Eastern context, polytheism was the norm, and each nation had its own patron deities. God's command 'You shall have no other gods before Me' demands not merely monotheistic belief but wholehearted covenant loyalty. The Hebrew phrase 'before Me' can also be translated 'besides Me' or 'in My presence,' emphasizing that God recognizes no rivals and will not share His glory with another. This commandment sets the tone for the entire Decalogue and establishes the fundamental relationship between God and His people — one of exclusive devotion, trust, and obedience.",
    learnMore:
      "The Ten Commandments, known in Hebrew as the 'Aseret HaDibrot' (Ten Words), form the core of the Sinai covenant and have been foundational for Jewish and Christian ethics for three millennia. The first commandment establishes the principle of monotheistic exclusive loyalty that distinguishes Israel from all surrounding nations. The phrase 'before Me' (al-panai) can also be translated 'in My presence,' 'besides Me,' or 'over against Me,' suggesting that God tolerates no rivals in the lives of His people. This commandment is not merely about belief in one God (monotheism) but about covenant faithfulness (monolatry) — Israel is to worship Yahweh alone because He alone is their Redeemer who brought them out of Egypt. Jesus summarized this commandment in His teaching: 'Love the Lord your God with all your heart and with all your soul and with all your mind' (Matthew 22:37). The first commandment addresses the vertical relationship with God, while the remaining commandments address horizontal relationships with others. Breaking this commandment is considered the most serious sin in Israelite religion, often described as adultery in the prophetic tradition (Hosea, Jeremiah, Ezekiel) because Israel was in a covenant marriage relationship with Yahweh. For more on the historical and theological context of the Ten Commandments, including how the ancient Near Eastern suzerain-vassal treaty format informs our understanding of the Decalogue, see the detailed commentary at https://www.biblegateway.com/passage/?search=Exodus+20&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Psalms",
    chapter: 23,
    verseNumber: 1,
    explanation:
      "This beloved psalm opens with the tender metaphor of the Lord as a shepherd, a image deeply familiar to David's original audience. In ancient Israel, shepherds were known for their intimate care, guidance, and protection of their sheep — animals that are completely dependent on their keeper for survival. By declaring 'I shall not want,' David expresses complete trust in God's provision, echoing God's faithfulness to Israel during their wilderness journey when He provided manna, water, and guidance. The personal pronoun 'my' makes this not just a general theological truth but a deeply personal relationship. This opening verse sets the stage for the entire psalm, which portrays a life of peace, security, and blessing that flows from trusting in the Good Shepherd — a title Jesus later applies to Himself in John 10, identifying Himself as the fulfillment of this ancient promise.",
    learnMore:
      "Psalm 23 is arguably the most beloved and widely known passage in the Old Testament, cherished by believers and quoted even in secular contexts for its profound comfort. The shepherd metaphor would have been immediately meaningful to David, who himself served as a shepherd before becoming king (1 Samuel 16:11). Shepherding in ancient Israel was a demanding occupation — shepherds led their flocks to pasture and water, protected them from predators (lions, bears, wolves), searched for lost sheep, and cared for the injured and weak. The relationship between shepherd and sheep is one of complete dependence and trust. The prophets also used this imagery: Isaiah 40:11 describes God as a shepherd who 'gathers the lambs in His arms,' and Ezekiel 34 condemns the false shepherds of Israel who exploit the flock. Jesus' declaration 'I am the good shepherd' (John 10:11) directly identifies Him with Yahweh of Psalm 23, making an implicit claim to divinity. The good shepherd 'lays down His life for the sheep,' connecting the pastoral imagery of provision and protection to the ultimate sacrifice of the cross. For a rich devotional and theological exploration of Psalm 23 and its fulfillment in Christ, see the commentary resources available at https://www.biblegateway.com/passage/?search=Psalm+23&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2, 3]',
  },
  {
    bookName: "Psalms",
    chapter: 119,
    verseNumber: 105,
    explanation:
      "This poetic verse uses the vivid imagery of light to describe the transformative power of God's Word in guiding human life. In ancient times, travelers would carry a lamp to illuminate their immediate steps and a larger torch or lantern to see the path ahead. Similarly, God's Word provides both immediate guidance for today's decisions ('a lamp to my feet') and broader direction for life's journey ('a light to my path'). This metaphor emphasizes that Scripture is not merely informational but practical and directional — it illuminates the moral and spiritual landscape, revealing pitfalls, showing the right way, and exposing the deceptions of sin. The verse also implies human inadequacy without divine revelation: we walk in darkness apart from God's Word, needing constant illumination to navigate the complexities of life in a fallen world.",
    learnMore:
      "Psalm 119 is an acrostic poem — the longest chapter in the Bible — with 176 verses arranged in 22 stanzas corresponding to the 22 letters of the Hebrew alphabet. Each stanza contains 8 verses that all begin with the same Hebrew letter. This intricate structure demonstrates the comprehensive nature of God's Word: from Aleph to Tav (A to Z), every aspect of life is covered by Scripture. The psalm uses at least eight different Hebrew terms for God's revelation: Torah (law/instruction), Edot (testimonies), Pikkudim (precepts), Mitzvot (commandments), Chukim (statutes), Mishpatim (judgments/rules), Dvar (word/promise), and Imrah (saying). Each term emphasizes a different facet of Scripture's character and function. The lamp (ner) mentioned in verse 105 would have been a small clay oil lamp that provided just enough light for the next step, while the light (or) for the path suggests broader illumination. This imagery of God's Word as light is echoed in Proverbs 6:23 ('For this command is a lamp, this teaching is a light') and 2 Peter 1:19 ('as to a lamp shining in a dark place, until the day dawns and the morning star rises in your hearts'). For an in-depth study of the literary structure and theology of Psalm 119, consult the resources at https://www.biblegateway.com/passage/?search=Psalm+119&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Proverbs",
    chapter: 3,
    verseNumber: 5,
    explanation:
      "This wisdom saying strikes at the heart of human self-sufficiency and pride. To 'trust in the Lord with all your heart' means to rely completely on God's character, promises, and providence rather than on human understanding, which is inherently limited and corrupted by sin. The heart in Hebrew thought represents the whole inner person — mind, will, emotions, and intentions. Therefore, trusting with 'all your heart' demands total, undivided commitment. The second line, 'lean not on your own understanding,' does not forbid the use of reason but warns against making human reason the ultimate arbiter of truth and wisdom. This proverb calls believers to a posture of humble dependence, acknowledging that God's ways are higher than our ways and that true wisdom begins with the fear of the Lord (Proverbs 9:10).",
    learnMore:
      "Proverbs 3:5-6 forms one of the most memorized and quoted passages in the wisdom literature of the Bible. The context is crucial: chapters 1-9 of Proverbs are a father's instruction to his son, urging him to pursue wisdom and avoid folly. The command to 'trust in the Lord with all your heart' uses the Hebrew verb 'batach,' which conveys a sense of security, confidence, and reckless abandon — the same word used in Psalm 56:11 ('In God I trust; I will not be afraid'). The word 'lean' (shaan) in the second line suggests leaning on something for support, like a staff or crutch — we are not to make our own understanding our primary support. This does not mean abandoning reason or critical thinking but recognizing their limitations. The rest of the passage (verses 6-10) promises guidance, health, prosperity, and blessing to those who honor God with their resources and trust Him completely. The wider context of Proverbs presents wisdom as both a divine gift and a human pursuit, creating a dynamic tension between human effort and divine grace that characterizes the entire wisdom tradition. For a thorough exposition of Proverbs 3:5-6 in its literary and theological context, see the commentary by Bruce Waltke and the resources at https://www.biblegateway.com/passage/?search=Proverbs+3&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Isaiah",
    chapter: 40,
    verseNumber: 31,
    explanation:
      "Written to a people in exile who felt abandoned by God, this verse offers profound hope and encouragement. The metaphor of mounting up with wings like eagles draws from the observation of eagles soaring on thermal currents with seemingly effortless grace. Unlike smaller birds that constantly flap their wings, eagles catch the wind and rise above the storm. Similarly, those who 'wait upon the Lord' — the Hebrew word 'qavah' implies active, expectant waiting filled with hope and trust — receive supernatural strength that enables them to rise above life's difficulties. The progression from 'mount up' to 'run' to 'walk' is significant: faith does not always produce dramatic experiences; sometimes it provides the steady endurance needed for the ordinary, ongoing challenges of daily life. This verse assured Israel that God had not forgotten them and that those who trust in Him would find renewed strength to persevere.",
    learnMore:
      "Isaiah 40 marks a major turning point in the book of Isaiah, shifting from messages of judgment (chapters 1-39) to messages of comfort and hope (chapters 40-66). Chapter 40 opens with the famous words 'Comfort, comfort My people,' and the chapter as a whole presents a series of arguments for why Israel can trust God to fulfill His promises of restoration. The context of verse 31 is a contrast between human frailty and divine power (verses 27-31). Even the strongest humans 'grow weary and tired' and 'stumble and fall,' but those who wait on the Lord receive renewed strength. The Hebrew word 'qavah' for 'wait' carries the sense of twisting or binding together, like a rope maker, implying that waiting on God creates a connection of strength with Him. The same word is used in Psalm 25:3 and Lamentations 3:25. The eagle imagery is particularly powerful in the ancient Near East, where eagles were symbols of strength, speed, and royal majesty. Some translations render the Hebrew 'nesher' as 'eagle,' while others prefer 'vulture' or 'griffon-vulture,' though all convey the image of soaring flight. For a comprehensive examination of the themes of comfort, hope, and renewal in Isaiah 40, see the commentary resources at https://www.biblegateway.com/passage/?search=Isaiah+40&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[3]',
  },
  {
    bookName: "Jeremiah",
    chapter: 29,
    verseNumber: 11,
    explanation:
      "This verse, part of Jeremiah's letter to the exiles in Babylon, has become one of the most quoted assurances of God's benevolent intentions toward His people. However, its original context is crucial for proper interpretation. God was speaking to a community facing 70 years of exile — not an immediate deliverance but a long-term plan involving judgment, discipline, and eventual restoration. The 'plans to prosper you' refer not to material prosperity in the modern sense but to God's covenant faithfulness to preserve and restore His people according to His redemptive purposes. The 'hope and a future' ultimately point forward to the coming of Christ and the establishment of the new covenant. This verse teaches that God's plans are comprehensive and trustworthy, working through both difficult circumstances and seasons of blessing to accomplish His good purposes for His people.",
    learnMore:
      "Jeremiah 29:11 must be read in its full context (verses 1-23) to avoid misinterpretation. Jeremiah wrote to the exiles who had been deported to Babylon in 597 BC, telling them to settle down, build houses, plant gardens, marry, and seek the peace (shalom) of the city where they were exiled. This was shocking advice — false prophets were telling the people that the exile would be short (Jeremiah 28). Jeremiah's message was that God had a plan, but it involved 70 years of patient waiting. The Hebrew word for 'plans' (machashavah) means 'thoughts, intentions, purposes' — it speaks of God's deliberate design, not a vague wish. The phrase 'to prosper you' translates 'shalom,' which means much more than material prosperity: wholeness, peace, well-being, completeness in every dimension of life. The 'future and a hope' (acharit v'tikvah) refers to the final outcome of God's plan — restoration, return from exile, and ultimately the coming of the Messiah. This verse is quoted out of context more than almost any other in Scripture, often as a promise of personal success and prosperity. While it is legitimate to find encouragement in this verse, responsible interpretation requires understanding that it was a specific promise to a specific people in a specific historical situation, with principles that apply to us only through the broader redemptive story of Scripture. For a faithful exposition of Jeremiah's letter to the exiles and its application for today, see the resources at https://www.biblegateway.com/passage/?search=Jeremiah+29&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[3]',
  },
  {
    bookName: "John",
    chapter: 1,
    verseNumber: 1,
    explanation:
      "John's prologue opens with a profound theological declaration that echoes Genesis 1:1 while revealing the fuller identity of Jesus Christ. The term 'Logos' (Word) would resonate with both Jewish and Greek audiences: for Jews, it connected to the creative power of God's word and the personification of wisdom in Proverbs 8; for Greeks, it represented the rational principle that orders the universe. John's radical claim is that this Logos is not merely a concept but a divine Person — Jesus Christ — who has always existed in eternal relationship with God the Father and is Himself fully God. The phrase 'was with God' indicates distinct personhood within the Godhead, while 'was God' affirms His full deity. This verse establishes the foundation for the doctrine of the Trinity and the incarnation — that the eternal Word became flesh (verse 14) to dwell among us.",
    learnMore:
      "John 1:1 is one of the most theologically dense verses in all of Scripture and has been the subject of extensive commentary throughout church history. The Greek text uses three imperfect tense verbs ('was' — en) emphasizing the eternal, continuous existence of the Word. The phrase 'In the beginning' (en arche) deliberately echoes the opening words of the Greek translation of Genesis (LXX), establishing John's creation theology. The term 'Logos' had a rich background in both Jewish and Greek thought. Philo of Alexandria, a Jewish philosopher contemporary with John, used 'Logos' as an intermediary being between God and creation, but John goes further by identifying the Logos as fully divine and personally distinct from the Father. The early church wrestled with this verse in formulating the doctrine of the Trinity. Arius argued that 'the Word was a god' (using the absence of the definite article before 'theos' in Greek as support), while Athanasius and the Nicene fathers argued that the anarthrous 'theos' (God without the definite article) emphasizes the quality or nature of the Word — He is of the same essence (homoousios) as the Father. Modern scholarship confirms that Greek grammar supports the orthodox reading: the Word is fully God. The Christological controversies of the fourth century culminated in the Nicene Creed (AD 325) and the Chalcedonian Definition (AD 451), both of which affirm the full deity and full humanity of Christ as taught in this opening verse. For a comprehensive analysis of the Greek grammar and theological implications of John 1:1, see the detailed commentary resources at https://www.biblegateway.com/passage/?search=John+1&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2]',
  },
  {
    bookName: "John",
    chapter: 3,
    verseNumber: 16,
    explanation:
      "Often called 'the Gospel in a nutshell,' this verse summarizes the entire message of salvation in its most concentrated form. It reveals four essential truths about God and His plan of redemption. First, God's motivation is love — not merely an abstract attribute but a self-giving, sacrificial love that initiated salvation before any human response. Second, the scope of God's love is universal: 'the world,' meaning all humanity without distinction. Third, the cost of love is staggering: God 'gave His only begotten Son,' pointing to the incarnation and the cross as the ultimate expression of divine love. Fourth, the purpose of this gift is eternal life — not merely endless existence but a transformed quality of life in relationship with God that begins now and extends forever. The condition 'whoever believes' emphasizes that salvation is received through faith, making it accessible to anyone who trusts in Christ, regardless of background or merit.",
    learnMore:
      "John 3:16 is undoubtedly the most famous verse in the Bible, but its profound theological depth is often overlooked due to its familiarity. The verse is part of Jesus' nighttime conversation with Nicodemus, a Pharisee and member of the Sanhedrin (John 3:1-21). The immediate context is Jesus' teaching about the necessity of being 'born again' (or 'born from above') to see the kingdom of God. John 3:16 provides the theological basis for this new birth: God's love for the world. The Greek word for 'love' here is 'agape' — self-giving, unconditional love that seeks the highest good of the beloved. The word 'world' (kosmos) in John's Gospel often carries negative connotations of the fallen world system opposed to God (John 1:10, 15:18-19), but here it indicates the object of God's redemptive love. 'Only begotten' (monogenes) means 'unique, one of a kind' — it emphasizes the unparalleled nature of the Son as the eternal, beloved Son of the Father. The purpose of the Son's mission is not condemnation but salvation (verse 17), revealing God's heart for redemption rather than judgment. The phrase 'perish' (apollumi) means to be destroyed, lost, or ruined — the alternative to eternal life is not annihilation but eternal separation from God. This verse has been called 'the North Star of the Bible' by Martin Luther and 'the heart of the Gospel' by countless preachers throughout church history. For an in-depth study of John 3:16 in its original context and its significance for Christian theology, see the resources at https://www.biblegateway.com/passage/?search=John+3&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2, 3]',
  },
  {
    bookName: "Romans",
    chapter: 3,
    verseNumber: 23,
    explanation:
      "The Apostle Paul states the universal human condition with stark simplicity. 'All have sinned' means that every human being, without exception, has fallen short of God's moral standard. The Greek word for 'sin' (hamartia) originally meant 'to miss the mark,' like an archer failing to hit the target. Paul's point is that humanity was created to reflect God's glory — to live in perfect relationship with Him and to display His character — but sin has caused every person to fall short of this purpose. This verse establishes the universal need for salvation that Paul has been building toward in the first three chapters of Romans. Having demonstrated that both Jews and Gentiles are under sin, Paul levels the playing field: no one is righteous on their own merit. This diagnosis of the human condition is essential preparation for the remedy he presents in the following verses — justification by grace through faith in Jesus Christ.",
    learnMore:
      "Romans 3:23 is the key verse in Paul's argument that all humanity stands condemned before God and in desperate need of salvation. The first three chapters of Romans are structured like a courtroom prosecution: Gentiles are guilty (1:18-32), Jews are guilty (2:1-3:8), and the verdict is that 'all have sinned' (3:9-20). Paul's argument is devastating in its comprehensiveness — no one can claim innocence or special status before God. The Greek word 'hamartia' (sin) appears in the aorist tense, indicating a past action with continuing consequences: all have sinned and continue to fall short. The phrase 'fall short' (hystereo) means to come late, be behind, or lack — humanity was created to share in God's glory (doxa), but sin has caused us to fall short of that glorious destiny. This is not a loss of something we once had so much as a failure to attain what God intended. The good news arrives in verse 24: we are 'justified freely by His grace through the redemption that came by Christ Jesus.' Paul's theology of justification is that God declares sinners righteous not because of their works but because of Christ's atoning work received through faith. This doctrine became the spark of the Protestant Reformation when Martin Luther rediscovered it, transforming the church and launching a movement that emphasized salvation by grace alone through faith alone. For a thorough study of Paul's argument in Romans 1-3 and the doctrine of justification, see the commentary by John Stott, Douglas Moo, or the resources at https://www.biblegateway.com/passage/?search=Romans+3&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1]',
  },
  {
    bookName: "Romans",
    chapter: 8,
    verseNumber: 28,
    explanation:
      "This verse stands as one of the most comforting promises in all of Scripture, but it is often misunderstood. The promise that 'all things work together for good' is not a guarantee that everything that happens is good in itself, nor that believers will always be happy or comfortable. Rather, it assures us that God, in His sovereignty, is able to weave even the most painful and difficult circumstances into His redemptive purposes. The 'good' referred to here is defined in the next verse: being conformed to the likeness of Christ. The condition for this promise is love for God and being called according to His purpose — it is specifically for those who are in a covenant relationship with Him. This verse does not promise that all things will work out according to our preferences, but that God will use all things to accomplish our ultimate good: Christlikeness and eternal glory.",
    learnMore:
      "Romans 8:28 must be understood within its broader context — the magnificent eighth chapter of Romans that has been called 'the greatest chapter in the Bible' by many expositors. Chapter 8 opens with 'no condemnation' for those in Christ and closes with 'no separation' from the love of God. Verse 28 sits in a section dealing with suffering and hope (verses 18-30). Paul has just acknowledged that 'the whole creation has been groaning' (verse 22) and that believers 'groan inwardly' (verse 23) as we wait for our adoption as sons and the redemption of our bodies. Into this groaning, suffering world, Paul declares that God is at work in all things for our good. The Greek verb 'synergei' (works together) can be read two ways: either 'all things work together for good' or 'God works all things together for good.' The textual evidence supports the latter — God is the active agent who orchestrates all circumstances toward His purposes. The 'good' (agathos) is defined by the following verses: 'to be conformed to the likeness of His Son' (verse 29). This is God's ultimate purpose for every believer — not happiness, comfort, or prosperity, but Christlikeness. The golden chain of salvation in verses 29-30 (foreknew, predestined, called, justified, glorified) provides the theological foundation for this promise: God's purpose is certain because it is based on His eternal decree, not on human circumstances. For a comprehensive exposition of Romans 8 and the doctrine of God's sovereignty in salvation, see the commentary by Martyn Lloyd-Jones in his series on Romans and the resources at https://www.biblegateway.com/passage/?search=Romans+8&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2, 3]',
  },
  {
    bookName: "2 Corinthians",
    chapter: 5,
    verseNumber: 17,
    explanation:
      "Paul declares the transformative power of union with Christ. Being 'in Christ' is the central reality of the Christian life — a spiritual union that brings about an entirely new creation. The old order of life dominated by sin, guilt, and spiritual death has passed away, and something radically new has come into being. This is not merely moral improvement or religious reformation but a genuine new creation that is as fundamental as the original creation itself. The Greek word for 'new creation' (kaine ktisis) suggests something that is new in kind and quality, not just new in time. This transformation affects every aspect of the believer's identity: old patterns of thinking, old allegiances, old ways of relating to God and others are replaced by the new reality of life in Christ. This verse provides the foundation for Christian identity — we are not who we once were because we are united with Christ in His death and resurrection.",
    learnMore:
      "Second Corinthians 5:17 is a pivotal verse in Paul's theology of conversion and the Christian life. The immediate context (verses 14-21) presents the foundation for new creation: Christ's death for all means that 'all died' in Him (verse 14), and those who live no longer live for themselves but for Christ (verse 15). The 'old things that have passed away' (ta archaia) include the old way of evaluating people 'according to the flesh' (verse 16) — judging by worldly standards of status, ethnicity, or religious performance. The 'new creation' (kaine ktisis) language deliberately echoes the creation account of Genesis. Just as God spoke the original creation into existence, He speaks new creation into being through the gospel. The Greek word 'kaine' implies newness of quality and character, not just temporal newness. Paul's theology of new creation is cosmic in scope — it is not just individual believers who are made new but the entire creation is being renewed (Romans 8:19-22). The Spirit is the agent of this new creation (John 3:5-8, Titus 3:5), and the church is the firstfruits and demonstration of this new creation reality. The practical implication is profound: we must stop living according to our old identity and start living as who we truly are in Christ. For a thorough study of Pauline theology of new creation and its implications for Christian living, see the commentaries by Paul Barnett and Murray Harris, as well as the resources at https://www.biblegateway.com/passage/?search=2+Corinthians+5&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2]',
  },
  {
    bookName: "Philippians",
    chapter: 4,
    verseNumber: 13,
    explanation:
      "This verse is often quoted as a mantra for personal achievement, but its original context reveals a much deeper meaning. Paul writes from prison, having endured hardship, persecution, and deprivation. He has just stated that he has learned to be content in every circumstance — whether well-fed or hungry, living in plenty or in need. In this context, 'I can do all things' is not about accomplishing any goal we set for ourselves, but about being enabled by Christ to face any circumstance with contentment and faithfulness. The 'all things' refers specifically to enduring both prosperity and adversity without losing faith or joy. Paul's secret is not self-confidence but Christ-dependence: the strength to persevere, to be content, and to maintain joy in every situation comes not from within but from Christ who empowers him. This verse calls believers to a radical dependence on Christ that transcends outward circumstances.",
    learnMore:
      "Philippians 4:13 is probably the most frequently misused verse in Scripture, commonly ripped from its context and applied to everything from athletic achievement to business success. The original context (Philippians 4:10-20) is Paul's thank-you note to the Philippian church for their financial support. In these verses, Paul expresses gratitude not for the gift itself but for what it represents — their partnership in the gospel. He then makes the remarkable statement that he has 'learned the secret of being content in any and every situation.' The Greek word for 'secret' (mueomai) was used in pagan mystery religions for initiation into secret knowledge. Paul uses it ironically to describe the 'secret' he has learned: Christ-sufficiency. The verb 'endynamoo' (I can do/strengthen) is the same root used in Philippians 4:13 and 1 Timothy 1:12, where Paul says Christ 'strengthened' him. The 'all things' (panta) must be defined by the context: all things related to the circumstances Paul describes — living with abundance or scarcity, fullness or hunger. The phrase 'through Him who strengthens me' is key — the source of Paul's strength is not internal willpower or positive thinking but the indwelling Christ who supplies grace for every circumstance. For a faithful exposition of Philippians 4:13 in its original context and pastoral application, see the commentaries by Gordon Fee, D.A. Carson, and the resources at https://www.biblegateway.com/passage/?search=Philippians+4&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[2, 3]',
  },
  {
    bookName: "Hebrews",
    chapter: 11,
    verseNumber: 1,
    explanation:
      "The author of Hebrews provides the most comprehensive definition of faith in Scripture. Faith is described in two complementary ways: as the 'substance of things hoped for' and the 'evidence of things not seen.' The Greek word for 'substance' (hypostasis) carries the idea of a foundation, a title deed, or the essential reality underlying something. Faith, then, is not wishful thinking but the confident assurance that brings future promises into present reality. Similarly, 'evidence' (elegchos) suggests proof or conviction — faith provides convincing proof of realities that cannot be empirically verified. This definition establishes that biblical faith is not a blind leap in the dark but a reasoned trust based on the character and faithfulness of God. The rest of Hebrews 11 provides a hall of fame of Old Testament figures who lived by this kind of faith, demonstrating that faith has always been the means by which God's people please Him and receive His promises.",
    learnMore:
      "Hebrews 11 is one of the most beloved and powerful chapters in the New Testament, often called the 'Faith Hall of Fame' or the 'Westminster Abbey of the Old Testament.' The chapter presents a sweeping survey of Old Testament history, highlighting men and women who lived by faith. The definition in verse 1 establishes the theological framework for understanding all that follows. The Greek word 'hypostasis' (substance/assurance) is used elsewhere in the New Testament with legal connotations — it appears in Hebrews 1:3 where Christ is 'the exact imprint of God's very being (hypostasis).' In commercial papyri from the ancient world, hypostasis was used for a title deed — a document that guarantees ownership of property not yet physically possessed. Faith, then, is the 'title deed' to future realities, the legal guarantee that what God has promised will be delivered. 'Elegchos' (evidence/conviction) carries forensic overtones of proof that convinces a jury. Faith provides convincing evidence for realities that cannot be empirically verified. The chapter goes on to demonstrate that faith is not a uniquely Christian concept — it has always been the means by which God's people relate to Him. 'Without faith it is impossible to please God' (verse 6) because faith is the only appropriate response to a God who is both invisible and infinitely trustworthy. The heroes of faith listed in this chapter — Abel, Enoch, Noah, Abraham, Sarah, Isaac, Jacob, Joseph, Moses, Rahab, Gideon, Barak, Samson, Jephthah, David, Samuel, and the prophets — all died without receiving the fulfillment of God's promises, 'having seen them and welcomed them from a distance' (verse 13). This highlights a crucial aspect of faith: it perseveres even when the fulfillment is delayed. For a comprehensive study of the theology of faith in Hebrews and the examples of the Old Testament saints, see the commentaries by William Lane, F.F. Bruce, and the resources at https://www.biblegateway.com/passage/?search=Hebrews+11&version=BSB",
    bibleVersion: "BSB",
    promptIds: '[1, 2]',
  },
  {
    bookName: "Revelation",
    chapter: 21,
    verseNumber: 4,
    explanation:
      "This verse paints the glorious climax of redemptive history — the final victory of God over sin, suffering, and death. John's vision of the new heaven and new earth culminates with God dwelling directly among His people, wiping away every tear from their eyes. The imagery is deeply personal and tender: God Himself will personally comfort His people, removing the very causes of their suffering. The four things listed — death, mourning, crying, and pain — encompass the totality of human misery that entered the world through sin. Their removal signals the complete reversal of the Fall and the restoration of creation to its intended state of shalom. The declaration that 'the former things have passed away' echoes Isaiah 43:18-19 and 65:17, where God promises to create a new heavens and a new earth. This promise provides hope and endurance for believers facing present suffering, assuring them that their pain is temporary and that God's ultimate purpose is complete restoration.",
    learnMore:
      "Revelation 21:1-8 describes the final state of the redeemed — the new heaven and new earth that God has been working toward throughout redemptive history. The chapter opens with the dramatic declaration 'I saw a new heaven and a new earth, for the first heaven and the first earth had passed away' (verse 1). The Greek word for 'new' (kainos) means new in quality and character, not merely new in time — this is a renewed, transformed, glorified creation. The holy city, the New Jerusalem, descends from heaven to earth (verse 2), signifying that redeemed humanity's final dwelling is not in heaven but on a renewed earth where God dwells with His people. The tabernacle imagery in verse 3 ('the dwelling of God is with mankind') echoes the Old Testament tabernacle where God's presence dwelt among Israel, now fulfilled in its ultimate sense. The 'tears' that God wipes away include not only sorrow but everything that causes sorrow — the root causes of human suffering are eradicated. Death, the 'last enemy' (1 Corinthians 15:26), is finally destroyed, fulfilling Isaiah 25:8 where death is 'swallowed up forever.' The declaration 'Behold, I make all things new' (verse 5) comes from God Himself, seated on the throne, speaking with the authority of the Creator who has the power to bring about this complete renewal. The imagery of water from the spring of the water of life (verse 6) echoes the Garden of Eden (Genesis 2:10) and the gift of living water that Jesus promised to the Samaritan woman (John 4:14). For a detailed exposition of Revelation 21-22 and the biblical hope of the new creation, see the commentaries by G.K. Beale, Craig Keener, and the theological resources at https://www.biblegateway.com/passage/?search=Revelation+21&version=BSB",
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
