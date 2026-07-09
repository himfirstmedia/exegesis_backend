import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const verseResources = [
  // ── Genesis 1:1 ─────────────────────────────────────────────────
  {
    bookName: 'Genesis',
    chapter: 1,
    verseStart: 1,
    verseEnd: 1,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Concise Commentary', text: 'The first verse of the Bible gives us a satisfying and unquestionable account of the origin of the universe. The world was not eternal, nor did it come into being by chance. God, the eternal, self-existent Being, by His sovereign power and wisdom, created the heavens and the earth. This truth is the foundation of all true religion and the basis of our faith. The Hebrew word \"bara\" (created) signifies to make something out of nothing - a divine prerogative.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on Genesis', text: 'Moses relates that the world was created by God, and that the heavens and the earth were made out of nothing. The eternity of the world is thus refuted, and the majesty of God is set before our eyes. By the word \"beginning,\" he means that period when God first began to create the universe, which had no previous existence. This beginning is not measured by time, but rather time itself began with the creation.' },
      { author: 'C.H. Spurgeon', title: 'The Treasury of the Bible', text: '\"In the beginning God\" - these four words are the foundation of all knowledge, the pillar of all wisdom, and the gateway to all truth. Before the mountains were brought forth, before the stars sang together, God was. He is the Alpha, the starting point of all things. If we do not begin here, we cannot rightly understand anything else.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'John 1:1-3', text: 'In the beginning was the Word, and the Word was with God, and the Word was God. He was with God in the beginning. Through him all things were made; without him nothing was made that has been made.' },
      { ref: 'Psalm 90:2', text: 'Before the mountains were born or you brought forth the whole world, from everlasting to everlasting you are God.' },
      { ref: 'Isaiah 45:12', text: 'It is I who made the earth and created mankind upon it. My own hands stretched out the heavens; I marshaled their starry hosts.' },
      { ref: 'Hebrews 11:3', text: 'By faith we understand that the universe was formed at God\'s command, so that what is seen was not made out of what was visible.' },
      { ref: 'Colossians 1:16-17', text: 'For in him all things were created: things in heaven and on earth, visible and invisible... all things have been created through him and for him.' },
      { ref: 'Acts 17:24', text: 'The God who made the world and everything in it is the Lord of heaven and earth and does not live in temples built by human hands.' },
      { ref: 'Nehemiah 9:6', text: 'You alone are the Lord. You made the heavens, even the highest heavens, and all their starry host, the earth and all that is on it...' },
      { ref: 'Psalm 33:6', text: 'By the word of the Lord the heavens were made, their starry host by the breath of his mouth.' },
      { ref: 'Isaiah 40:28', text: 'Do you not know? Have you not heard? The Lord is the everlasting God, the Creator of the ends of the earth.' },
      { ref: 'Revelation 4:11', text: 'You are worthy, our Lord and God, to receive glory and honor and power, for you created all things, and by your will they were created and have their being.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05d1\u05bc\u05b0\u05e8\u05b5\u05d0\u05e9\u05c1\u05b4\u05d9\u05ea (Bereshit)', transliteration: 'Bereshit', meaning: 'The Hebrew word for \"In the beginning.\" It consists of the preposition \"be\" (in/at) and \"reshit\" (first/beginning/chief). This word establishes a temporal framework for all of creation and implies a definite starting point for time and space. The Rabbis noted that the Torah begins with the second letter of the Hebrew alphabet (Bet) rather than the first (Aleph), suggesting that some aspects of God\'s nature are beyond human comprehension.', strongs: 'H7225' },
      { word: '\u05d1\u05bc\u05b8\u05e8\u05b8\u05d0 (Bara)', transliteration: 'Bara', meaning: 'The Hebrew verb for \"created.\" This word is used exclusively with God as its subject, signifying divine creation that brings something entirely new into existence. Unlike other Hebrew words for making or forming (asah, yatsar), bara emphasizes creation out of nothing (creatio ex nihilo). It appears in the Bible approximately 50 times, always with God as the actor.', strongs: 'H1254' },
      { word: '\u05d0\u05b1\u05dc\u05b9\u05d4\u05b4\u05d9\u05dd (Elohim)', transliteration: 'Elohim', meaning: 'The Hebrew word for God used here. Though plural in form, it takes a singular verb when referring to the one true God. This plural form hints at the complexity within the Godhead, later revealed as the Trinity. The word emphasizes God\'s power, majesty, and role as the supreme Judge and Creator. Its plural form with singular verb is unique to the God of Israel.', strongs: 'H430' },
      { word: '\u05e9\u05c1\u05b8\u05de\u05b7\u05d9\u05b4\u05dd (Shamayim)', transliteration: 'Shamayim', meaning: 'The Hebrew word for \"heavens.\" A dual noun (always plural in form) suggesting the heavens have multiple layers or dimensions - the atmospheric sky, the stellar universe, and the spiritual dwelling place of God. The word may derive from \"sham\" (there) and \"mayim\" (waters), referring to the waters above the firmament described later in this chapter.', strongs: 'H8064' },
      { word: '\u05d0\u05b6\u05e8\u05b6\u05e5 (Eretz)', transliteration: 'Eretz', meaning: 'The Hebrew word for \"earth\" or \"land.\" In Genesis 1, it refers to the created material world, initially formless and empty. Throughout Scripture, this word carries both the physical meaning of the planet and the relational meaning of the Promised Land. It appears over 2,500 times in the Hebrew Bible.', strongs: 'H776' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Creation Ex Nihilo', pronunciation: 'kre\u026a\u02c8e\u026a\u0283\u0259n \u025bks \u02c8n\u026ah\u026alo\u028a', definition: 'The theological doctrine that God created the universe out of nothing, without using any pre-existing material.', description: 'Latin for \"creation out of nothing.\" This doctrine distinguishes biblical creation from other ancient creation myths where gods fashion the world from pre-existing chaos or matter. The concept is foundational to Christian theology, affirming God\'s absolute sovereignty and the complete dependence of all created things on Him. It is supported by Genesis 1:1, John 1:3, and Hebrews 11:3.' },
      { term: 'Theistic Evolution', pronunciation: '\u03b8i\u02c8\u026ast\u026ak \u02cc\u025bv\u0259\u02c8lu\u0283\u0259n', definition: 'The belief that God used evolutionary processes to bring about the diversity of life while remaining the ultimate Creator.', description: 'This view attempts to reconcile scientific observations of evolution with belief in God as Creator. It holds that Genesis describes the fact of creation rather than the specific method, allowing for an ancient earth and common descent while affirming that God initiated and guided the process.' },
      { term: 'Cosmogony', pronunciation: 'k\u0252z\u02c8m\u0252\u0261\u0259ni', definition: 'The study of the origin and development of the universe as described in various cultural and religious traditions.', description: 'From Greek \"kosmos\" (world/universe) and \"gonia\" (birth). Biblical cosmogony differs from ancient Near Eastern accounts by presenting a single, sovereign God who creates by divine fiat rather than through conflict or procreation. The Genesis account is distinct in its monotheistic framework and its emphasis on the inherent goodness of creation.' },
      { term: 'Divine Fiat', pronunciation: 'd\u026a\u02c8va\u026an \u02c8fi\u02d0\u0259t', definition: 'The creative command of God that brings something into existence simply by His spoken word.', description: 'From Latin \"let it be done.\" Throughout Genesis 1, God speaks creation into existence - \"Let there be light\" - demonstrating that His word carries creative power. This theme continues in the New Testament where Jesus calms storms and raises the dead by His spoken word, and where Scripture speaks of Christ as the \"Word\" through whom all things were made (John 1:1-3).' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u05d1\u05bc\u05b0\u05e8\u05b5\u05d0\u05e9\u05c1\u05b4\u05d9\u05ea', strongs: 'H7225', transliteration: 'Bereshit', translation: 'In the beginning' },
      { original: '\u05d1\u05bc\u05b8\u05e8\u05b8\u05d0', strongs: 'H1254', transliteration: 'Bara', translation: 'created' },
      { original: '\u05d0\u05b1\u05dc\u05b9\u05d4\u05b4\u05d9\u05dd', strongs: 'H430', transliteration: 'Elohim', translation: 'God' },
      { original: '\u05d0\u05b5\u05ea', strongs: 'H853', transliteration: 'Et', translation: '[direct object marker]' },
      { original: '\u05d4\u05b7\u05e9\u05c1\u05b8\u05de\u05b7\u05d9\u05b4\u05dd', strongs: 'H8064', transliteration: 'HaShamayim', translation: 'the heavens' },
      { original: '\u05d5\u05b0\u05d0\u05b5\u05ea', strongs: 'H853', transliteration: 'VeEt', translation: 'and [direct object]' },
      { original: '\u05d4\u05b8\u05d0\u05b8\u05e8\u05b6\u05e5', strongs: 'H776', transliteration: 'HaAretz', translation: 'the earth' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Creation' }, { name: 'God as Creator' }, { name: 'Origins' }, { name: 'Divine Sovereignty' }, { name: 'Ex Nihilo Creation' }, { name: 'Biblical Cosmology' }, { name: 'The Trinity' },
    ]),
  },
  // ── Genesis 1:2 ─────────────────────────────────────────────────
  {
    bookName: 'Genesis',
    chapter: 1,
    verseStart: 2,
    verseEnd: 2,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Concise Commentary', text: 'The earth was without form and void - tohu and bohu in Hebrew, meaning confusion and emptiness. The Spirit of God moved upon the face of the waters, as a hen gathers her brood under her wings, or as the eagle stirs up her nest. This moving of the Spirit prepared the material world for the work of the six days of creation that follow. Darkness was upon the face of the deep, representing the chaotic state of the yet-unformed creation.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on Genesis', text: 'Moses describes the earth as being \"without form and void\" - a confused mass, devoid of the beauty and order we now see. But the Spirit of God was hovering, preparing to bring life and organization out of chaos. The word \"hovering\" (merachephet) is the same used in Deuteronomy 32:11 of an eagle stirring its young. This clearly indicates the creative energy of the Holy Spirit preparing to bring order to the universe.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Jeremiah 4:23', text: 'I looked at the earth, and it was formless and empty; and at the heavens, and their light was gone.' },
      { ref: 'Psalm 33:6', text: 'By the word of the Lord the heavens were made, their starry host by the breath of his mouth.' },
      { ref: 'Isaiah 45:18', text: 'For this is what the Lord says - he who created the heavens, he is God; he who fashioned and made the earth, he founded it; he did not create it to be empty, but formed it to be inhabited.' },
      { ref: 'Genesis 6:3', text: 'Then the Lord said, \"My Spirit will not contend with humans forever...\"' },
      { ref: 'Psalm 104:30', text: 'When you send your Spirit, they are created, and you renew the face of the ground.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05ea\u05bc\u05b9\u05d4\u05d5 \u05d5\u05b8\u05d1\u05b9\u05d4\u05d5 (Tohu vaVohu)', transliteration: 'Tohu vaVohu', meaning: 'A Hebrew phrase meaning \"formless and empty\" or \"waste and void.\" Tohu implies desolation, emptiness, and formlessness - a state of raw potential without structure. Bohu reinforces and intensifies the meaning, suggesting vacant emptiness. Together they describe the primordial state before God\'s creative ordering. The phrase appears elsewhere only in Jeremiah 4:23 to describe judgment.', strongs: 'H8414/H922' },
      { word: '\u05ea\u05bc\u05b0\u05d4\u05d5\u05b9\u05dd (Tehom)', transliteration: 'Tehom', meaning: 'The Hebrew word for \"deep\" - referring to the primordial waters or abyss. This word is cognate with the Akkadian \"Tiamat,\" the chaos monster of Babylonian mythology. However, in Genesis there is no battle - God simply rules over the deep. The word appears throughout the Old Testament referring to the deep seas and the subterranean waters.', strongs: 'H8415' },
      { word: '\u05e8\u05b8\u05d7\u05b7\u05e3 (Rachaph)', transliteration: 'Rachaph', meaning: 'The Hebrew verb for \"hovering\" or \"brooding,\" used of the Spirit of God moving over the waters. The same word describes an eagle stirring up its nest in Deuteronomy 32:11, suggesting a gentle, nurturing, life-giving movement. This implies the Spirit\'s role in creation was not merely passive observation but active preparation and empowerment.', strongs: 'H7363' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Chaos Theory (Theological)', pronunciation: '\u02c8ke\u026a\u0252s \u02c8\u03b8\u026a\u0259ri', definition: 'The theological concept that God brings order out of chaos, both in creation and in redemption.', description: 'Unlike ancient Near Eastern myths where chaos is a hostile force to be defeated, the Genesis account presents chaos as a passive state that God sovereignly organizes. This theme continues throughout Scripture - God brings light out of darkness, life out of death, and order out of confusion. The same creative Spirit who hovered over the waters now works to bring order to human hearts.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u05d5\u05b0\u05d4\u05b8\u05d0\u05b8\u05e8\u05b6\u05e5', strongs: 'H776', transliteration: 'VeHaAretz', translation: 'And the earth' },
      { original: '\u05d4\u05b8\u05d9\u05b0\u05ea\u05b8\u05d4', strongs: 'H1961', transliteration: 'Hayetah', translation: 'was' },
      { original: '\u05ea\u05bc\u05b9\u05d4\u05d5', strongs: 'H8414', transliteration: 'Tohu', translation: 'formless' },
      { original: '\u05d5\u05b8\u05d1\u05b9\u05d4\u05d5', strongs: 'H922', transliteration: 'VaVohu', translation: 'and empty' },
      { original: '\u05d5\u05b0\u05d7\u05b9\u05e9\u05c1\u05b6\u05da\u05b0', strongs: 'H2822', transliteration: 'VeChoshech', translation: 'and darkness' },
      { original: '\u05e2\u05b7\u05dc-\u05e4\u05bc\u05b0\u05e0\u05b5\u05d9', strongs: 'H6440', transliteration: 'Al-Penei', translation: 'upon the face of' },
      { original: '\u05ea\u05bc\u05b0\u05d4\u05d5\u05b9\u05dd', strongs: 'H8415', transliteration: 'Tehom', translation: 'the deep' },
      { original: '\u05d5\u05b0\u05e8\u05d5\u05bc\u05d7\u05b7', strongs: 'H7307', transliteration: 'VeRuach', translation: 'and the Spirit' },
      { original: '\u05d0\u05b1\u05dc\u05b9\u05d4\u05b4\u05d9\u05dd', strongs: 'H430', transliteration: 'Elohim', translation: 'of God' },
      { original: '\u05de\u05b0\u05e8\u05b7\u05d7\u05b6\u05e4\u05bc\u05b6\u05ea', strongs: 'H7363', transliteration: 'Merachephet', translation: 'was hovering' },
      { original: '\u05e2\u05b7\u05dc-\u05e4\u05bc\u05b0\u05e0\u05b5\u05d9', strongs: 'H6440', transliteration: 'Al-Penei', translation: 'over the face of' },
      { original: '\u05d4\u05b7\u05de\u05bc\u05b8\u05d9\u05b4\u05dd', strongs: 'H4325', transliteration: 'HaMayim', translation: 'the waters' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Holy Spirit' }, { name: 'Chaos and Order' }, { name: 'Divine Creation' }, { name: 'Primordial Waters' },
    ]),
  },
  // ── Genesis 1:3-5 (Day 1 - Light) ───────────────────────────────
  {
    bookName: 'Genesis',
    chapter: 1,
    verseStart: 3,
    verseEnd: 5,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Concise Commentary', text: 'The first day of creation begins with light. God said, \"Let there be light\" - and instantly there was light. This light was not the sun (which was created on the fourth day) but a primal light that dispelled the darkness and established the cycle of day and night. God saw the light was good - even before it was organized into its later purposes. The separation of light from darkness established the first distinction in creation, and the naming of them shows God\'s authority over His works.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on Genesis', text: 'The light was created by the command of God alone. We must remember that this light was not of the same kind as we now enjoy from the sun. It was a temporary light that served until the sun was created on the fourth day. The fact that light was created before the luminaries teaches us that God is not dependent on secondary causes but works by His own power. The evening and morning mark the first complete day, measured from evening to evening according to Hebrew custom.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: '2 Corinthians 4:6', text: 'For God, who said, \"Let light shine out of darkness,\" made his light shine in our hearts to give us the light of the knowledge of God\'s glory displayed in the face of Christ.' },
      { ref: 'Psalm 74:16', text: 'The day is yours, and also the night; you established the sun and moon.' },
      { ref: 'John 1:4-5', text: 'In him was life, and that life was the light of all mankind. The light shines in the darkness, and the darkness has not overcome it.' },
      { ref: 'Isaiah 45:7', text: 'I form the light and create darkness, I bring prosperity and create disaster; I, the Lord, do all these things.' },
      { ref: '1 John 1:5', text: 'This is the message we have heard from him and declare to you: God is light; in him there is no darkness at all.' },
      { ref: 'James 1:17', text: 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05d0\u05d5\u05b9\u05e8 (Or)', transliteration: 'Or', meaning: 'The Hebrew word for \"light.\" In this context, it refers to the primal light created before the sun, moon, and stars. Throughout Scripture, light becomes a powerful metaphor for God\'s presence, truth, goodness, and salvation. The word appears over 200 times in the Old Testament and carries deep theological significance, particularly in the Psalms and Isaiah.', strongs: 'H216' },
      { word: '\u05d9\u05d5\u05b9\u05dd (Yom)', transliteration: 'Yom', meaning: 'The Hebrew word for \"day.\" It can mean a 24-hour day, the daylight hours, or an extended period of time depending on context. In Genesis 1, the phrase \"evening and morning\" bounds each creative day, suggesting a literal 24-hour period. However, the word is also used elsewhere in Scripture for longer periods (\"the day of the Lord\"). The interpretation of \"yom\" in Genesis 1 remains a key point of discussion.', strongs: 'H3117' },
      { word: '\u05e2\u05b6\u05e8\u05b6\u05d1 (Erev)', transliteration: 'Erev', meaning: 'The Hebrew word for \"evening\" or \"sunset.\" It derives from a root meaning \"to mix\" - referring to the mixing of light and darkness at twilight. The Jewish day begins at evening, following the pattern established here: \"there was evening and there was morning, the first day.\"', strongs: 'H6153' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Fiat Lux', pronunciation: '\u02c8fi\u02d0\u0259t \u02c8l\u028cks', definition: 'Latin for \"Let there be light\" - the divine command that initiated the first act of creation.', description: 'This phrase (from the Latin Vulgate translation of Genesis 1:3) has become a universal symbol of enlightenment, discovery, and divine creative power. The phrase is used in various contexts from scientific mottos to academic seals, representing the moment when order emerges from chaos through divine or intellectual activity.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u05d5\u05b7\u05d9\u05bc\u05b9\u05d0\u05de\u05b6\u05e8', strongs: 'H559', transliteration: 'VaYomer', translation: 'And said' },
      { original: '\u05d0\u05b1\u05dc\u05b9\u05d4\u05b4\u05d9\u05dd', strongs: 'H430', transliteration: 'Elohim', translation: 'God' },
      { original: '\u05d9\u05b0\u05d4\u05b4\u05d9', strongs: 'H1961', transliteration: 'Yehi', translation: 'Let there be' },
      { original: '\u05d0\u05d5\u05b9\u05e8', strongs: 'H216', transliteration: 'Or', translation: 'light' },
      { original: '\u05d5\u05b7\u05d9\u05bc\u05b0\u05d4\u05b4\u05d9-\u05d0\u05d5\u05b9\u05e8', strongs: 'H216', transliteration: 'VaYehi-Or', translation: 'And there was light' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Light and Darkness' }, { name: 'God\'s Creative Word' }, { name: 'Days of Creation' }, { name: 'Evening and Morning' }, { name: 'Divine Speech' },
    ]),
  },
  // ── Genesis 1:6-8 (Day 2 - Firmament) ───────────────────────────
  {
    bookName: 'Genesis',
    chapter: 1,
    verseStart: 6,
    verseEnd: 8,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Concise Commentary', text: 'On the second day, God created the firmament - an expanse that divided the waters above from the waters below. This firmament He called \"Heaven\" (shamayim). The firmament is the atmospheric sky that separates the clouds above from the seas below. God called it \"Heaven\" - the same word used in verse 1 for the spiritual heavens, though here it refers to the visible firmament. The creation of the atmosphere was essential for all subsequent life.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on Genesis', text: 'The firmament (raqia in Hebrew) signifies an expanse or stretching out. Moses describes it as a vast space placed between the waters, separating those above from those below. The waters above likely refer to clouds and atmospheric moisture, while the waters below are the seas. This division was necessary to prepare the earth for habitation. The firmament is called \"heaven\" not because it is the highest heaven, but because it is the heaven visible to us, the region of the clouds and birds.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Psalm 19:1', text: 'The heavens declare the glory of God; the skies proclaim the work of his hands.' },
      { ref: 'Job 37:18', text: 'Can you join him in spreading out the skies, hard as a mirror of cast bronze?' },
      { ref: 'Psalm 150:1', text: 'Praise the Lord. Praise God in his sanctuary; praise him in his mighty heavens.' },
      { ref: 'Psalm 148:4', text: 'Praise him, you highest heavens and you waters above the skies.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05e8\u05b8\u05e7\u05b4\u05d9\u05e2\u05b7 (Raqia)', transliteration: 'Raqia', meaning: 'The Hebrew word for \"firmament\" or \"expanse.\" It comes from the root \"raqa\" meaning \"to spread out, stamp, or beat thin\" - like hammering metal into a thin sheet. This suggests something stretched out or expanded. The Septuagint translates it as \"stereoma\" (solid structure), while the Vulgate uses \"firmamentum.\" Modern translations prefer \"expanse\" or \"vault.\"', strongs: 'H7549' },
    ]),
    interlinearWords: JSON.stringify([]),
    relatedTopics: JSON.stringify([
      { name: 'Heavens' }, { name: 'Atmosphere' }, { name: 'Waters Above' }, { name: 'Firmament' },
    ]),
  },
  // ── Genesis 1:9-10 (Day 3 - Dry Land and Seas) ──────────────────
  {
    bookName: 'Genesis',
    chapter: 1,
    verseStart: 9,
    verseEnd: 10,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Concise Commentary', text: 'On the third day, God gathered the waters together, causing dry land to appear. The waters were collected into seas, and the dry ground He called \"Earth.\" This separation of land from sea completed the basic structure of the world. God saw that it was good. This day marks the beginning of the earth becoming habitable, preparing for the vegetation that would appear later on this same day. The naming of both the earth and the seas shows God\'s sovereignty over His creation.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on Genesis', text: 'The gathering of the waters and the appearance of dry land was a wonderful work of God. The waters by nature would have covered the entire globe, but by God\'s command they were drawn together into specific basins, leaving the land dry and habitable. This demonstrates that the earth was not formed by natural processes but by the express command of God. The names \"Earth\" and \"Seas\" given by God Himself show His dominion over the physical world.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Psalm 95:5', text: 'The sea is his, for he made it, and his hands formed the dry land.' },
      { ref: 'Psalm 33:7', text: 'He gathers the waters of the sea into jars; he puts the deep into storehouses.' },
      { ref: 'Job 38:8-11', text: 'Who shut up the sea behind doors when it burst forth from the womb... when I said, \"This far you may come and no farther; here is where your proud waves halt\"?' },
      { ref: 'Proverbs 8:29', text: 'When he gave the sea its boundary so the waters would not overstep his command, and when he marked out the foundations of the earth.' },
      { ref: 'Psalm 136:6', text: 'Who spread out the earth upon the waters, His love endures forever.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05d9\u05b7\u05d1\u05bc\u05b8\u05e9\u05c1\u05b8\u05d4 (Yabbashah)', transliteration: 'Yabbashah', meaning: 'The Hebrew word for \"dry land\" or \"dry ground.\" It comes from the root \"yabesh\" meaning \"to be dry, to dry up.\" This word appears approximately 14 times in the Old Testament, often in contexts describing God\'s power over the waters - as in the parting of the Red Sea (Exodus 14:16) where the Israelites walked on dry ground.', strongs: 'H3004' },
      { word: '\u05d9\u05b7\u05de\u05bc\u05b4\u05d9\u05dd (Yamim)', transliteration: 'Yamim', meaning: 'The plural of \"yam\" (sea). In Hebrew, \"yamim\" can refer to the gathered bodies of water, the Mediterranean Sea (the Great Sea), and poetically to large rivers like the Nile and Euphrates. God naming the seas demonstrates His authority over the chaotic waters that ancient cultures feared and deified.', strongs: 'H3220' },
    ]),
    interlinearWords: JSON.stringify([]),
    relatedTopics: JSON.stringify([
      { name: 'Dry Land' }, { name: 'Seas' }, { name: 'Continents' }, { name: 'Geology' }, { name: 'God\'s Sovereignty over Nature' },
    ]),
  },
  // ── Psalm 23:1-4 (The Shepherd Psalm) ────────────────────────────
  {
    bookName: 'Psalm',
    chapter: 23,
    verseStart: 1,
    verseEnd: 4,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Concise Commentary', text: 'This psalm is a precious pearl of comfort for all who trust in the Lord. David, having experienced God\'s guidance through many dangers, declares with confidence, \"The Lord is my shepherd; I shall not want.\" As a shepherd leads, feeds, and protects his flock, so God provides for all our needs - spiritual and temporal. The green pastures and still waters represent the peaceful rest and refreshing grace God gives to His people. Even in the darkest trials, the shepherd\'s rod and staff give comfort, for He is with us. This psalm has been the consolation of countless saints on their deathbeds.' },
      { author: 'C.H. Spurgeon', title: 'The Treasury of David', text: 'This is the pearl of psalms whose soft and pure radiance delights every eye. What a condescension is this - that the Infinite God should become a Shepherd to His people! The Lord is my Shepherd - not was, not may be, but is. He is now my Shepherd, and I am now His sheep. By this, David declares his personal interest in God\'s care. \"I shall not want\" - what more can I desire? If the Shepherd is mine, I have all things. The \"green pastures\" are the Scriptures, where the soul feeds and grows strong. The \"still waters\" are the Spirit\'s quiet influences, refreshing the soul. \"Yea, though I walk through the valley of the shadow of death\" - the darkest path leads to a safe home, for the Shepherd is there.' },
      { author: 'John Calvin', title: 'Commentary on the Book of Psalms', text: 'David sets forth the singular blessings which God bestows upon those who are under His government and protection. He compares God to a shepherd, whose office it is to provide pasture for his flock. This metaphor is highly appropriate, for sheep are creatures which are least able to provide for themselves. By this, David teaches us that our safety and welfare depend entirely upon God\'s guidance. The rod and staff denote God\'s Word and Spirit by which He rules, defends, and comforts His people. The valley of death is the figure of the most imminent dangers, yet the presence of the Shepherd turns it into a place of security.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'John 10:11', text: 'I am the good shepherd. The good shepherd lays down his life for the sheep.' },
      { ref: 'Revelation 7:17', text: 'For the Lamb at the center of the throne will be their shepherd; he will lead them to springs of living water. And God will wipe away every tear from their eyes.' },
      { ref: 'Philippians 4:19', text: 'And my God will meet all your needs according to the riches of his glory in Christ Jesus.' },
      { ref: 'Isaiah 49:10', text: 'They will neither hunger nor thirst, nor will the desert heat or the sun beat down on them. He who has compassion on them will guide them and lead them beside springs of water.' },
      { ref: 'Psalm 34:9-10', text: 'Fear the Lord, you his holy people, for those who fear him lack nothing. The lions may grow weak and hungry, but those who seek the Lord lack no good thing.' },
      { ref: 'Hebrews 13:5-6', text: 'God has said, \"Never will I leave you; never will I forsake you.\" So we say with confidence, \"The Lord is my helper; I will not be afraid.\"' },
      { ref: 'Isaiah 43:2', text: 'When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you. When you walk through the fire, you will not be burned; the flames will not set you ablaze.' },
      { ref: 'Ezekiel 34:12', text: 'As a shepherd looks after his scattered flock when he is with them, so will I look after my sheep. I will rescue them from all the places where they were scattered on a day of clouds and darkness.' },
      { ref: '1 Peter 2:25', text: 'For you were like sheep going astray, but now you have returned to the Shepherd and Overseer of your souls.' },
      { ref: 'Psalm 84:11', text: 'For the Lord God is a sun and shield; the Lord bestows favor and honor; no good thing does he withhold from those whose walk is blameless.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05e8\u05b9\u05e2\u05b4\u05d9 (Ro\'i)', transliteration: 'Ro\'i', meaning: 'The Hebrew word for \"my shepherd.\" It is a participle from the root \u05e8\u05e2\u05d4 (ra\'ah - H7462), meaning \"to pasture, tend, feed, graze.\" In the ancient Near East, the shepherd metaphor was commonly used for kings and deities who cared for their people. David\'s use is intensely personal - \"my\" shepherd emphasizes a covenantal relationship. The participle form indicates habitual, continuous action - God is always my Shepherd. This same metaphor is picked up by Jesus in John 10 and by the author of Hebrews.', strongs: 'H7462' },
      { word: '\u05de\u05b0\u05e0\u05bb\u05d7\u05d5\u05b9\u05ea (Menuchot)', transliteration: 'Menuchot', meaning: 'The Hebrew word (plural of menuchah - H4496) meaning \"resting places\" or \"still waters.\" It describes waters that are calm, quiet, and peaceful - not rushing or turbulent. The word carries connotations of settled rest, tranquility, and refreshment. In a spiritual sense, these \"still waters\" represent the peace that God gives to the soul that trusts in Him - the quiet confidence that comes from resting in His provision. The same root is used in Psalm 116:7 for \"return to your rest, O my soul.\"', strongs: 'H4496' },
      { word: '\u05d9\u05b0\u05e9\u05c1\u05d5\u05b9\u05d1\u05b5\u05d1 \u05e0\u05b7\u05e4\u05b0\u05e9\u05c1\u05b4\u05d9 (Yeshovev Nafshi)', transliteration: 'Yeshovev Nafshi', meaning: 'The phrase \"He restores my soul.\" The verb \u05e9\u05c1\u05d5\u05bc\u05d1 (shuv - H7725) is a common Hebrew verb meaning \"to turn back, return, restore, refresh.\" In the Piel stem (intensive), it means \"to bring back, restore to a former state.\" \u05e0\u05b6\u05e4\u05b6\u05e9\u05c1 (nephesh - H5315) means \"soul, life, self, being.\" Together, the phrase speaks of God\'s restorative work - He revives the weary soul, brings back the wandering heart, and renews spiritual vitality. This is not merely refreshment but full restoration to life and purpose.', strongs: 'H7725/H5315' },
      { word: '\u05d2\u05bc\u05b5\u05d9\u05d0 \u05e6\u05b7\u05dc\u05b0\u05de\u05b8\u05d5\u05b6\u05ea (Gei Tzalmavet)', transliteration: 'Gei Tzalmavet', meaning: 'The Hebrew phrase for \"valley of the shadow of death.\" \u05d2\u05bc\u05b5\u05d9 (gei) is a valley or ravine. \u05e6\u05b7\u05dc\u05b0\u05de\u05b8\u05d5\u05b6\u05ea (tsalmavet - H6757) is a compound word: \u05e6\u05b5\u05dc (tsel - shadow) + \u05de\u05b8\u05d5\u05b6\u05ea (mavet - death), meaning \"death-shadow\" or \"deep darkness.\" It can refer to physical death, mortal danger, or deep spiritual darkness. The word appears 18 times in the Old Testament, often describing the darkest, most terrifying circumstances. In this psalm, the valley is something to walk THROUGH - not to stay in - because the Shepherd is present. The same word is used in Job 10:21-22 and Jeremiah 2:6.', strongs: 'H6757' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'The Shepherd Metaphor', pronunciation: '\u00f0\u0259 \u02c8\u0283\u025bp\u0259rd \u02c8m\u025bt\u0259f\u0254r', definition: 'A biblical figure comparing God\'s relationship to His people to that of a shepherd caring for his flock.', description: 'This metaphor pervades both Testaments. In the Old Testament, God is the Shepherd of Israel (Psalm 80:1, Isaiah 40:11), and human leaders are called to shepherd God\'s people (Ezekiel 34). In the New Testament, Jesus declares Himself the Good Shepherd (John 10:11-18), and church leaders are called shepherds (pastors) after Christ\'s model (1 Peter 5:2-4). The shepherd\'s duties - leading, feeding, protecting, seeking the lost - perfectly illustrate God\'s providential care.' },
      { term: 'Providence', pronunciation: '\u02c8pr\u0252v\u026ad\u0259ns', definition: 'The protective care of God over His creation, guiding all things toward His purposes.', description: 'From Latin \"providentia\" (foresight). The doctrine of providence affirms that God not only created the world but continually sustains and governs it. Psalm 23 beautifully illustrates this: the Shepherd provides, guides, protects, and shepherds His sheep through every circumstance. Providence includes preservation (sustaining existence), concurrence (working through secondary causes), and government (directing all things to their appointed end).' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u05d9\u05b0\u05d4\u05d5\u05b8\u05d4', strongs: 'H3068', transliteration: 'YHWH', translation: 'The LORD' },
      { original: '\u05e8\u05b9\u05e2\u05b4\u05d9', strongs: 'H7462', transliteration: 'Ro\'i', translation: 'is my shepherd' },
      { original: '\u05dc\u05b9\u05d0', strongs: 'H3808', transliteration: 'Lo', translation: 'not' },
      { original: '\u05d0\u05b6\u05d7\u05b0\u05e1\u05b8\u05e8', strongs: 'H2637', transliteration: 'Echsar', translation: 'I shall want' },
      { original: '\u05d1\u05bc\u05b4\u05e0\u05b0\u05d0\u05d5\u05b9\u05ea', strongs: 'H4999', transliteration: 'Bin\'ot', translation: 'in green pastures' },
      { original: '\u05d3\u05bc\u05b6\u05e9\u05c1\u05b6\u05d0', strongs: 'H1877', transliteration: 'Deshe\'', translation: 'grass, pasture' },
      { original: '\u05de\u05b7\u05e8\u05b0\u05d1\u05bc\u05b4\u05d9\u05e5', strongs: 'H7257', transliteration: 'Yarbitzeni', translation: 'He makes me lie down' },
      { original: '\u05e2\u05b7\u05dc-\u05de\u05b5\u05d9', strongs: 'H5921/H4325', transliteration: 'Al-Mei', translation: 'beside waters' },
      { original: '\u05de\u05b0\u05e0\u05bb\u05d7\u05d5\u05b9\u05ea', strongs: 'H4496', transliteration: 'Menuchot', translation: 'still, of rest' },
      { original: '\u05d9\u05b0\u05e0\u05b7\u05d4\u05b2\u05dc\u05b5\u05e0\u05b4\u05d9', strongs: 'H5095', transliteration: 'Yenahaleni', translation: 'He leads me' },
      { original: '\u05e0\u05b7\u05e4\u05b0\u05e9\u05c1\u05b4\u05d9', strongs: 'H5315', transliteration: 'Nafshi', translation: 'my soul' },
      { original: '\u05d9\u05b0\u05e9\u05c1\u05d5\u05b9\u05d1\u05b5\u05d1', strongs: 'H7725', transliteration: 'Yeshovev', translation: 'He restores' },
      { original: '\u05d2\u05bc\u05b5\u05d9\u05d0', strongs: 'H1516', transliteration: 'Gei', translation: 'valley of' },
      { original: '\u05e6\u05b7\u05dc\u05b0\u05de\u05b8\u05d5\u05b6\u05ea', strongs: 'H6757', transliteration: 'Tzalmavet', translation: 'the shadow of death' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Shepherd' }, { name: 'God\'s Provision' }, { name: 'Comfort in Affliction' }, { name: 'Fear of Death' }, { name: 'Divine Guidance' }, { name: 'Rest and Peace' }, { name: 'Trust in God' },
    ]),
  },
  // ── John 3:16 ───────────────────────────────────────────────────
  {
    bookName: 'John',
    chapter: 3,
    verseStart: 16,
    verseEnd: 16,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Commentary on John', text: 'This is the great gospel text - the sum and substance of the whole Bible. Here we have the fountain of all redemption: God\'s love. He loved the world - not the Jewish nation only, but the whole world of mankind. He gave His only begotten Son - the most precious gift that could be given, the greatest expression of love that ever was. The design of this gift is that whosoever believes in Him should not perish - the dreadful consequence of sin is escaped - but have everlasting life - a life of eternal happiness and glory. Here is love: not that we loved God, but that He loved us and gave His Son.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on John', text: 'Christ opens the cause of our salvation, namely the love of God the Father. The love of God is the supreme cause and source of all blessings. He loved the world, that is, the fallen and lost race of mankind. The giving of His Son is the manifestation of this love. The word \"whosoever\" extends the promise without distinction to all who believe, whether Jew or Gentile. Faith is the means by which we receive the benefit of Christ\'s death. \"Not perish\" - this is the deliverance from eternal death which we deserve. \"Everlasting life\" is not merely endless existence but blessed communion with God.' },
      { author: 'John Wesley', title: 'Wesley\'s Explanatory Notes on John', text: '\"God so loved the world\" - He, the great God, loved the poor, sinful, miserable world. He so loved it as to give His only Son, His Son in a peculiar and unparalleled manner. The gift of Christ is the fruit of God\'s love, not the cause of it. \"That whosoever believeth in him\" - this faith is the condition of salvation, not a mere intellectual assent but a living trust in Christ. \"Should not perish\" - the second death, the loss of God and the torment of the soul. \"But have everlasting life\" - beginning now in the knowledge and love of God, and perfected in heaven.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Genesis 22:2', text: 'Then God said, \"Take your son, your only son, whom you love - Isaac - and go to the region of Moriah. Sacrifice him there as a burnt offering on a mountain I will show you.\"' },
      { ref: 'Romans 5:8', text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.' },
      { ref: '1 John 4:9-10', text: 'This is how God showed his love among us: He sent his one and only Son into the world that we might live through him. This is love: not that we loved God, but that he loved us and sent his Son as an atoning sacrifice for our sins.' },
      { ref: 'Numbers 21:9', text: 'So Moses made a bronze snake and put it up on a pole. Then when anyone was bitten by a snake and looked at the bronze snake, they lived.' },
      { ref: 'Romans 8:32', text: 'He who did not spare his own Son, but gave him up for us all - how will he not also, along with him, graciously give us all things?' },
      { ref: '1 John 5:11-13', text: 'And this is the testimony: God has given us eternal life, and this life is in his Son. Whoever has the Son has life; whoever does not have the Son of God does not have life.' },
      { ref: 'John 1:12', text: 'Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God.' },
      { ref: 'John 10:28', text: 'I give them eternal life, and they shall never perish; no one will snatch them out of my hand.' },
      { ref: 'Ephesians 2:4-5', text: 'But because of his great love for us, God, who is rich in mercy, made us alive with Christ even when we were dead in transgressions - it is by grace you have been saved.' },
      { ref: '2 Peter 3:9', text: 'The Lord is not slow in keeping his promise, as some understand slowness. Instead he is patient with you, not wanting anyone to perish, but everyone to come to repentance.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u1f00\u03b3\u03b1\u03c0\u03ac\u03c9 (Agapao)', transliteration: 'Agapao', meaning: 'The Greek verb for divine, self-sacrificing love. Unlike phileo (brotherly affection) or eros (romantic desire), agapao denotes a conscious, deliberate love that seeks the highest good of the beloved regardless of their merit or response. It is the love of choice, not emotion. This word describes God\'s character: His love is unconditional, sacrificial, and redemptive. In the New Testament, agapao appears over 140 times and becomes the defining characteristic of the Christian life.', strongs: 'G25' },
      { word: '\u03bc\u03bf\u03bd\u03bf\u03b3\u03b5\u03bd\u03ae\u03c2 (Monogenes)', transliteration: 'Monogenes', meaning: 'A compound of monos (only) and genos (kind/offspring), meaning \"only begotten,\" \"unique,\" or \"one of a kind.\" It describes Christ\'s unique relationship to the Father - not merely the firstborn of creation but the eternal, only-begotten Son of God. The word emphasizes both Christ\'s uniqueness (there is no other like Him) and His divine origin (He is the natural Son of God, as opposed to adopted sons like believers). It appears nine times in the New Testament, always describing Christ or, in Luke 7:12 and 8:42, an only child.', strongs: 'G3439' },
      { word: '\u03c0\u03b9\u03c3\u03c4\u03b5\u03cd\u03c9 (Pisteuo)', transliteration: 'Pisteuo', meaning: 'The Greek verb for \"to believe, trust, have faith in.\" Unlike mere intellectual assent (doxazo - to think), pisteuo implies personal trust, reliance, and commitment. It is often followed by eis (into) in John\'s Gospel, indicating a movement of the whole person into a relationship of trust in Christ. This active, saving faith is the sole condition for receiving eternal life. The noun form pistis (faith) is the means of justification (Romans 5:1) and the substance of the Christian life.', strongs: 'G4100' },
      { word: '\u03b1\u1f30\u03ce\u03bd\u03b9\u03bf\u03c2 (Aionios)', transliteration: 'Aionios', meaning: 'The Greek adjective for \"eternal\" or \"everlasting.\" It describes not only endless duration but a quality of life belonging to the coming age (aion). Eternal life is not simply unending existence but participation in the life of God Himself - the life of the age to come breaking into the present. It begins now for the believer (John 5:24) and will be fully realized in the resurrection. The word carries both quantitative (endless) and qualitative (divine) dimensions.', strongs: 'G166' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Propitiation', pronunciation: 'pr\u0259\u02ccp\u026a\u0283i\u02c8e\u026a\u0283\u0259n', definition: 'The atoning sacrifice of Christ that satisfies the righteous wrath of God against sin and restores the sinner to His favor.', description: 'From Latin \"propitiatio\" (appeasement). In Greek, hilasterion (Romans 3:25) and hilasmos (1 John 2:2, 4:10). The concept involves both the removal of sin\'s guilt and the appeasement of divine wrath through a substitutionary sacrifice. Christ is both the offerer and the offering - He propitiates the Father\'s justice by bearing the penalty of sin Himself. This differs from pagan propitiation in that it is God Himself who provides the sacrifice, demonstrating that His love and justice are equally satisfied at the cross.' },
      { term: 'Eternal Life', pronunciation: '\u026a\u02c8t\u025c\u02d0rn\u0259l la\u026af', definition: 'The gift of God through Christ - a quality of life characterized by intimate knowledge of God and endless communion with Him.', description: 'In John\'s Gospel, eternal life is not merely life without end but life of a different order - the very life of God imparted to the believer. It begins at the moment of faith (John 3:36, 5:24) and culminates in the resurrection of the body. Jesus defines it in John 17:3: \"This is eternal life: that they may know you, the only true God, and Jesus Christ, whom you have sent.\" It is a relational concept, not merely a temporal one.' },
      { term: 'Only Begotten', pronunciation: '\u02c8o\u028anli b\u026a\u02c8\u0261\u0252t\u0259n', definition: 'The theological term describing the unique, eternal generation of the Son from the Father.', description: 'From the Greek monogenes. This term affirms that Jesus Christ is the Son of God in a sense entirely different from believers who become children by adoption. Christ is the natural, eternal, only-begotten Son of the Father - begotten, not made, as the Nicene Creed affirms. The term safeguards both Christ\'s full divinity and His personal distinction from the Father within the Trinity.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u03bf\u1f55\u03c4\u03c9\u03c2', strongs: 'G3779', transliteration: 'Houtos', translation: 'So' },
      { original: '\u1f20\u03b3\u03ac\u03c0\u03b7\u03c3\u03b5\u03bd', strongs: 'G25', transliteration: 'Egapesen', translation: 'loved' },
      { original: '\u1f41 \u03b8\u03b5\u03cc\u03c2', strongs: 'G2316', transliteration: 'Ho Theos', translation: 'God' },
      { original: '\u03c4\u03cc\u03bd \u03ba\u03cc\u03c3\u03bc\u03bf\u03bd', strongs: 'G2889', transliteration: 'Ton Kosmon', translation: 'the world' },
      { original: '\u1f65\u03c3\u03c4\u03b5', strongs: 'G5620', transliteration: 'Hoste', translation: 'that' },
      { original: '\u03c4\u03cc\u03bd \u03c5\u1f31\u03cc\u03bd', strongs: 'G5207', transliteration: 'Ton Huion', translation: 'the Son' },
      { original: '\u03bc\u03bf\u03bd\u03bf\u03b3\u03b5\u03bd\u1fc6', strongs: 'G3439', transliteration: 'Monogene', translation: 'only begotten' },
      { original: '\u1f14\u03b4\u03c9\u03ba\u03b5\u03bd', strongs: 'G1325', transliteration: 'Edoken', translation: 'He gave' },
      { original: '\u1f35\u03bd\u03b1', strongs: 'G2443', transliteration: 'Hina', translation: 'that' },
      { original: '\u1f41 \u03c0\u03b9\u03c3\u03c4\u03b5\u03cd\u03c9\u03bd', strongs: 'G4100', transliteration: 'Ho Pisteuon', translation: 'whosoever believes' },
      { original: '\u03b5\u1f30\u03c2 \u03b1\u1f50\u03c4\u03cc\u03bd', strongs: 'G1519/G846', transliteration: 'Eis Auton', translation: 'in him' },
      { original: '\u03bc\u1f74 \u1f00\u03c0\u03cc\u03bb\u03b7\u03c4\u03b1\u03b9', strongs: 'G3361/G622', transliteration: 'Me Apoletai', translation: 'should not perish' },
      { original: '\u1f00\u03bb\u03bb\u1f70', strongs: 'G235', transliteration: 'Alla', translation: 'but' },
      { original: '\u1f14\u03c7\u1fc3', strongs: 'G2192', transliteration: 'Eche', translation: 'have' },
      { original: '\u03b6\u03c9\u1f74\u03bd', strongs: 'G2222', transliteration: 'Zo\u0113n', translation: 'life' },
      { original: '\u03b1\u1f30\u03ce\u03bd\u03b9\u03bf\u03bd', strongs: 'G166', transliteration: 'Ai\u014dnion', translation: 'eternal' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'God\'s Love' }, { name: 'Salvation' }, { name: 'Faith' }, { name: 'Eternal Life' }, { name: 'Atonement' }, { name: 'The Cross' }, { name: 'Divine Sacrifice' },
    ]),
  },
  // ── Romans 8:28 ─────────────────────────────────────────────────
  {
    bookName: 'Romans',
    chapter: 8,
    verseStart: 28,
    verseEnd: 28,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Commentary on Romans', text: 'This is a precious promise to all who love God and are called according to His purpose. All things - even the most painful and perplexing events - work together for good to such. Not separately, but together, and by the overruling providence of God. The good intended is spiritual and eternal good - conformity to Christ and participation in His glory. This promise does not guarantee that all things are good in themselves, but that God in His wisdom makes them work together for the ultimate good of His people. The condition is true love to God and effectual calling according to His purpose.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on Romans', text: 'Paul teaches that the cross and afflictions are not obstacles to believers\' salvation but rather aids and helps toward it. \"All things work together\" - this includes not only the things that seem prosperous but also those that seem adverse. Nothing happens by chance to the saints; all is governed by the secret counsel of God. The love of God toward His elect is the foundation of this assurance. Those who love God are those whom He has first loved and called. The purpose of God is the unchangeable decree by which He determined to save His people.' },
      { author: 'C.H. Spurgeon', title: 'Spurgeon\'s Sermons on Romans', text: 'Here is the believer\'s comfort in every storm. \"All things\" - not some things, not a few things, but ALL things, whether they smile or frown, whether they come from the right hand or the left. They all WORK - not idly, not uselessly, but effectually. They work TOGETHER - not each for itself alone, but conspiring in one harmonious design. They work together for GOOD - the highest, richest, most lasting good. And this is for those who love God - this is the character and the condition. The doctrine of God\'s purpose is not a pillow for sloth but a pillow for peace.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Genesis 50:20', text: 'You intended to harm me, but God intended it for good to accomplish what is now being done, the saving of many lives.' },
      { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
      { ref: 'Ephesians 1:11', text: 'In him we were also chosen, having been predestined according to the plan of him who works out everything in conformity with the purpose of his will.' },
      { ref: '2 Timothy 1:9', text: 'He has saved us and called us to a holy life - not because of anything we have done but because of his own purpose and grace.' },
      { ref: 'Psalm 57:2', text: 'I cry out to God Most High, to God, who vindicates me.' },
      { ref: 'Ephesians 3:1', text: 'For this reason I, Paul, the prisoner of Christ Jesus for the sake of you Gentiles...' },
      { ref: 'Philippians 1:12', text: 'Now I want you to know, brothers and sisters, that what has happened to me has actually served to advance the gospel.' },
      { ref: '1 Peter 1:6-7', text: 'In all this you greatly rejoice, though now for a little while you may have had to suffer grief in all kinds of trials. These have come so that the proven genuineness of your faith... may result in praise, glory and honor when Jesus Christ is revealed.' },
      { ref: 'Psalm 84:11', text: 'For the Lord God is a sun and shield; the Lord bestows favor and honor; no good thing does he withhold from those whose walk is blameless.' },
      { ref: 'Proverbs 16:4', text: 'The Lord works out everything to its proper end - even the wicked for a day of disaster.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u03c3\u03c5\u03bd\u03b5\u03c1\u03b3\u03ad\u03c9 (Synergeo)', transliteration: 'Synergeo', meaning: 'A compound Greek verb from syn (together) and ergon (work), meaning \"to work together, cooperate.\" It implies the conspiring of multiple factors toward a single result. In Romans 8:28, it means that all circumstances - joys, sorrows, successes, failures, blessings, trials - work cooperatively under God\'s sovereignty to produce good for the believer. Paul uses the same word in 1 Corinthians 16:16 and 2 Corinthians 6:1. The noun form synergos means \"fellow worker.\"', strongs: 'G4903' },
      { word: '\u03c0\u03c1\u03cc\u03b8\u03b5\u03c3\u03b9\u03c2 (Prothesis)', transliteration: 'Prothesis', meaning: 'A compound of pro (before) and thesis (placing), meaning \"a purpose, plan, intention set before.\" It refers to God\'s eternal, predetermined plan - the deliberate design He established before the foundation of the world. In Paul\'s writings, prothesis always refers to God\'s sovereign purpose of salvation (Romans 9:11, Ephesians 1:11, 3:11, 2 Timothy 1:9). It conveys the idea of something displayed or set forth publicly - God\'s purpose is not hidden but revealed in the gospel.', strongs: 'G4286' },
      { word: '\u03ba\u03bb\u03b7\u03c4\u03cc\u03c2 (Kletos)', transliteration: 'Kletos', meaning: 'A verbal adjective from kaleo (to call), meaning \"called, invited, summoned.\" In Paul\'s usage, it refers to those effectually called by God to salvation - not merely an external invitation but an inward, irresistible summons that produces faith and obedience. The called are those whom God has purposed to save and who respond to the gospel. Paul uses this word in Romans 1:6-7, 8:28, and 1 Corinthians 1:2, 24. In each case, the calling is grounded in God\'s eternal purpose.', strongs: 'G2822' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Predestination', pronunciation: 'pr\u026a\u02ccd\u025bst\u026a\u02c8ne\u026a\u0283\u0259n', definition: 'The divine decree by which God has determined from eternity the ultimate destiny of His creatures.', description: 'From Latin \"praedestinare\" (to determine beforehand). In Romans 8:28-30, Paul presents predestination as part of the golden chain of salvation: foreknew, predestined, called, justified, glorified. The doctrine teaches that God\'s purpose is the foundation of salvation - He chose His people before the foundation of the world (Ephesians 1:4). The Reformers emphasized that predestination is the source of comfort and assurance: our salvation rests on God\'s unchangeable decree, not on human effort.' },
      { term: 'Theodicy', pronunciation: '\u03b8i\u02c8\u0252d\u026asi', definition: 'The theological attempt to reconcile the goodness and omnipotence of God with the existence of evil and suffering.', description: 'From Greek theos (God) and dike (justice). Romans 8:28 is a key text in Christian theodicy: it does not explain why evil exists but assures believers that God works through all circumstances for their ultimate good. This differs from philosophical theodicies by grounding hope not in abstract arguments but in the character of God and His redemptive purpose revealed in Christ.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u03bf\u1f34\u03b4\u03b1\u03bc\u03b5\u03bd', strongs: 'G1492', transliteration: 'Oidamen', translation: 'We know' },
      { original: '\u03b4\u1f72', strongs: 'G1161', transliteration: 'De', translation: 'and' },
      { original: '\u1f45\u03c4\u03b9', strongs: 'G3754', transliteration: 'Hoti', translation: 'that' },
      { original: '\u03c4\u03bf\u1fd6\u03c2 \u1f00\u03b3\u03b1\u03c0\u1ff6\u03c3\u03b9', strongs: 'G25', transliteration: 'Tois Agaposi', translation: 'to those who love' },
      { original: '\u03c4\u1f78\u03bd \u03b8\u03b5\u03cc\u03bd', strongs: 'G2316', transliteration: 'Ton Theon', translation: 'God' },
      { original: '\u03c0\u03ac\u03bd\u03c4\u03b1', strongs: 'G3956', transliteration: 'Panta', translation: 'all things' },
      { original: '\u03c3\u03c5\u03bd\u03b5\u03c1\u03b3\u03b5\u1fd6', strongs: 'G4903', transliteration: 'Synergei', translation: 'work together' },
      { original: '\u03b5\u1f30\u03c2 \u1f00\u03b3\u03b1\u03b8\u03cc\u03bd', strongs: 'G1519/G18', transliteration: 'Eis Agathon', translation: 'for good' },
      { original: '\u03c4\u03bf\u1fd6\u03c2', strongs: 'G3588', transliteration: 'Tois', translation: 'to those' },
      { original: '\u03ba\u03b1\u03c4\u1f70', strongs: 'G2596', transliteration: 'Kata', translation: 'according to' },
      { original: '\u03c0\u03c1\u03cc\u03b8\u03b5\u03c3\u03b9\u03bd', strongs: 'G4286', transliteration: 'Prothesin', translation: 'purpose' },
      { original: '\u03ba\u03bb\u03b7\u03c4\u03bf\u1fd6\u03c2', strongs: 'G2822', transliteration: 'Kletois', translation: 'called' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'God\'s Sovereignty' }, { name: 'Providence' }, { name: 'Suffering' }, { name: 'Divine Purpose' }, { name: 'Assurance' }, { name: 'Predestination' }, { name: 'Love for God' },
    ]),
  },
  // ── Exodus 20:1-17 (The Ten Commandments) ────────────────────────
  {
    bookName: 'Exodus',
    chapter: 20,
    verseStart: 1,
    verseEnd: 17,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Concise Commentary', text: 'God spoke these words to His people, not by angels but directly, with a terrible majesty. The law was given to show them their duty and to convince them of their inability to keep it perfectly, driving them to seek grace in Christ. The Ten Commandments are a summary of the moral law, binding all people in all ages. The first four concern our duty to God; the last six our duty to our neighbor. The preface reminds Israel that God is their Redeemer, having brought them out of Egypt, and therefore they are bound to obey Him. The law was given with thunder and lightning to impress upon them its solemnity and importance.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on Exodus', text: 'God did not deliver the law through the intercession of Moses but spoke with His own voice, that the people might be more deeply affected. The Decalogue contains the perfect rule of righteousness. The preface, \"I am the Lord your God who brought you out of Egypt,\" establishes both God\'s authority and His grace as the foundation for obedience. The commandments are not arbitrary but flow from God\'s redemptive relationship with His people. The law serves three purposes: to show God\'s righteousness, to convict of sin, and to guide the believer in holy living. The whole law is summed up in love - love to God and love to neighbor.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Deuteronomy 5:6-21', text: 'The parallel account of the Ten Commandments given to the new generation before entering the Promised Land, with slight variations in wording and emphasis.' },
      { ref: 'Matthew 22:37-40', text: 'Jesus replied: \"Love the Lord your God with all your heart and with all your soul and with all your mind.\" This is the first and greatest commandment. And the second is like it: \"Love your neighbor as yourself.\" All the Law and the Prophets hang on these two commandments.' },
      { ref: 'Romans 13:9-10', text: 'The commandments... are summed up in this one command: \"Love your neighbor as yourself.\" Love does no harm to a neighbor. Therefore love is the fulfillment of the law.' },
      { ref: 'Deuteronomy 4:13', text: 'He declared to you his covenant, the Ten Commandments, which he commanded you to follow and then wrote them on two stone tablets.' },
      { ref: 'Exodus 34:28', text: 'Moses was there with the Lord forty days and forty nights without eating bread or drinking water. And he wrote on the tablets the words of the covenant - the Ten Commandments.' },
      { ref: 'Psalm 19:7-8', text: 'The law of the Lord is perfect, refreshing the soul. The statutes of the Lord are trustworthy, making wise the simple. The precepts of the Lord are right, giving joy to the heart. The commands of the Lord are radiant, giving light to the eyes.' },
      { ref: 'Romans 3:20', text: 'Therefore no one will be declared righteous in God\'s sight by the works of the law; rather, through the law we become conscious of our sin.' },
      { ref: 'Galatians 3:24', text: 'So the law was our guardian until Christ came that we might be justified by faith.' },
      { ref: 'Jeremiah 31:33', text: '\"This is the covenant I will make with the people of Israel after that time,\" declares the Lord. \"I will put my law in their minds and write it on their hearts. I will be their God, and they will be my people.\"' },
      { ref: 'Matthew 5:17', text: 'Do not think that I have come to abolish the Law or the Prophets; I have not come to abolish them but to fulfill them.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05e2\u05b2\u05e9\u05c2\u05b6\u05e8\u05b6\u05ea \u05d4\u05b7\u05d3\u05bc\u05b0\u05d1\u05b8\u05e8\u05b4\u05d9\u05dd (Aseret HaD\'varim)', transliteration: 'Aseret HaD\'varim', meaning: 'The Hebrew phrase for \"The Ten Words\" or \"The Ten Commandments.\" Literally \"the ten words/sayings\" (from dabar - word/speech). In Hebrew tradition, these are not called \"commandments\" (mitzvot) but \"words\" (d\'varim), emphasizing that they are divine revelation as well as law. The Septuagint translates it as \"deka logoi\" (ten words), from which we get \"Decalogue.\" The phrase emphasizes that these are God\'s personal communication to His covenant people, not merely legal statutes.', strongs: 'H1697' },
      { word: '\u05e7\u05b8\u05e0\u05b8\u05d4 (Kanah)', transliteration: 'Kanah', meaning: 'The Hebrew verb meaning \"to acquire, buy, possess, create.\" In the Decalogue\'s prohibition of coveting, the related noun is used. The tenth commandment uses the verb \u05d7\u05b8\u05de\u05b7\u05d3 (chamad - H2530) meaning \"to covet, desire, delight in.\" Chamad is not inherently negative (it can mean desirable, as in Genesis 2:9) but becomes sinful when directed toward what belongs to another. This commandment addresses the inner disposition - the heart\'s desires - showing that God\'s law governs not only actions but thoughts and intentions.', strongs: 'H7069' },
      { word: '\u05e9\u05c1\u05b8\u05d1\u05b8\u05ea (Shabbat)', transliteration: 'Shabbat', meaning: 'The Hebrew word meaning \"to cease, rest, desist.\" The fourth commandment institutes the Sabbath as a day of rest, rooted in God\'s own rest after creation (Exodus 20:11). The word derives from the verb shavat (H7673) - \"to cease from labor.\" In the Exodus version, the Sabbath is tied to creation; in Deuteronomy 5:15, it is tied to redemption from Egypt. Jesus declared Himself \"Lord of the Sabbath\" (Matthew 12:8) and reoriented its observance around mercy and necessity, fulfilling its true purpose as a gift for human flourishing.', strongs: 'H7676' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Decalogue', pronunciation: '\u02c8d\u025bk\u0259l\u0252\u0261', definition: 'Another name for the Ten Commandments, derived from the Greek \"deka logoi\" (ten words).', description: 'The Decalogue is recorded in Exodus 20:1-17 and Deuteronomy 5:6-21. It forms the foundation of biblical ethics and has been recognized throughout Judeo-Christian history as the moral law of God. Jewish tradition divides the commandments differently from Christian traditions (the Jewish enumeration counts the preface as the first word). In Christian theology, the Decalogue retains its authority as moral instruction while its ceremonial and civil applications are fulfilled in Christ. The Reformers emphasized the threefold use of the law: civil (restraining evil), pedagogical (convicting of sin), and didactic (guiding the believer).' },
      { term: 'Covenant', pronunciation: '\u02c8k\u028cv\u0259n\u0259nt', definition: 'A solemn, binding agreement between God and His people, establishing relationship and defining obligations.', description: 'From Hebrew berith (H1285). The Ten Commandments are embedded within the Mosaic Covenant made at Sinai. Unlike modern contracts, biblical covenants are initiated by God, involve promises and obligations, and are sealed with signs (circumcision, the Sabbath, baptism, the Lord\'s Supper). The Mosaic Covenant was conditional (blessings for obedience, curses for disobedience) and served as a guardian until the New Covenant promised in Jeremiah 31:31-34 and established by Christ\'s blood. In the New Covenant, God\'s law is written on hearts, not stone.' },
      { term: 'Sabbath', pronunciation: '\u02c8s\u00e6b\u0259\u03b8', definition: 'The seventh day of the week, set apart as a day of rest and worship, commanded in the fourth commandment.', description: 'From Hebrew shabbat (cessation). The Sabbath was instituted at creation (Genesis 2:2-3) and incorporated into the Decalogue as a sign of the Mosaic Covenant. It was a day of physical rest, spiritual refreshment, and communal worship. In the New Testament, Christians began worshipping on the Lord\'s Day (Sunday), commemorating Christ\'s resurrection, while the principle of one day in seven for rest and worship continued. The Sabbath\'s deeper significance points to the rest of salvation in Christ (Hebrews 4:9-10).' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u05d0\u05b8\u05e0\u05b9\u05db\u05b4\u05d9', strongs: 'H595', transliteration: 'Anokhi', translation: 'I' },
      { original: '\u05d9\u05b0\u05d4\u05d5\u05b8\u05d4', strongs: 'H3068', transliteration: 'YHWH', translation: 'the LORD' },
      { original: '\u05d0\u05b1\u05dc\u05b9\u05d4\u05b6\u05d9\u05da\u05b8', strongs: 'H430', transliteration: 'Eloheikha', translation: 'your God' },
      { original: '\u05dc\u05b9\u05d0 \u05ea\u05bc\u05b4\u05e8\u05b0\u05e6\u05b8\u05d7', strongs: 'H3808/H7523', transliteration: 'Lo Tirtzach', translation: 'You shall not murder' },
      { original: '\u05dc\u05b9\u05d0 \u05ea\u05bc\u05b4\u05e0\u05b0\u05d0\u05b8\u05e3', strongs: 'H3808/H5003', transliteration: 'Lo Tin\'af', translation: 'You shall not commit adultery' },
      { original: '\u05dc\u05b9\u05d0 \u05ea\u05bc\u05b4\u05d2\u05b0\u05e0\u05b9\u05bc\u05d1', strongs: 'H3808/H1589', transliteration: 'Lo Tignov', translation: 'You shall not steal' },
      { original: '\u05dc\u05b9\u05d0 \u05ea\u05bc\u05b7\u05d7\u05b0\u05de\u05b9\u05d3', strongs: 'H3808/H2530', transliteration: 'Lo Tachmod', translation: 'You shall not covet' },
      { original: '\u05db\u05bc\u05b7\u05d1\u05bc\u05b5\u05d3', strongs: 'H3513', transliteration: 'Kabeid', translation: 'Honor' },
      { original: '\u05d6\u05b8\u05db\u05d5\u05b9\u05e8', strongs: 'H2142', transliteration: 'Zachor', translation: 'Remember' },
      { original: '\u05d9\u05d5\u05b9\u05dd \u05d4\u05b7\u05e9\u05c1\u05b7\u05bc\u05d1\u05b8\u05bc\u05ea', strongs: 'H3117/H7676', transliteration: 'Yom HaShabbat', translation: 'the Sabbath day' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'The Law' }, { name: 'The Decalogue' }, { name: 'Sinai' }, { name: 'Covenant' }, { name: 'Moral Law' }, { name: 'Obedience' }, { name: 'Worship' }, { name: 'Love for Neighbor' },
    ]),
  },
  // ── Isaiah 53:5 ─────────────────────────────────────────────────
  {
    bookName: 'Isaiah',
    chapter: 53,
    verseStart: 5,
    verseEnd: 5,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Commentary on Isaiah', text: 'Here is the great doctrine of Christ\'s substitutionary atonement. He was wounded for OUR transgressions, bruised for OUR iniquities - not His own, for He had none. The chastisement of our peace was upon Him - the punishment that purchased our reconciliation with God fell upon Him. And by His stripes we are healed - the scourging and crucifixion of Christ are the means of our spiritual healing. This verse is the very heart of the gospel, declaring that the Suffering Servant bore what we deserved so that we might receive what He deserved. Every phrase speaks of vicarious suffering: the innocent suffering for the guilty.' },
      { author: 'C.H. Spurgeon', title: 'Spurgeon\'s Commentary on Isaiah', text: 'This is the most evangelical verse in all the Old Testament. \"He was wounded for our transgressions\" - the wounds were the penalty of OUR sins; they were not His due but ours. \"He was bruised\" - crushed under the weight of divine wrath, ground as in a mortar. \"The chastisement of our peace was upon Him\" - the strokes that secured our peace with God fell on Him. \"And with His stripes we are healed\" - His bruises are our medicines; His death is our life. The Hebrew word for \"stripes\" (chaburah) means a black-and-blue mark from a severe blow - every lash He bore purchased our spiritual health. Here is atonement in all its fulness and freeness.' },
      { author: 'John Wesley', title: 'Wesley\'s Explanatory Notes on Isaiah', text: 'The sufferings of Christ are here described with remarkable precision. \"Wounded\" - literally \"pierced through,\" as with nails and spear. \"Transgressions\" - our rebellions against God\'s law. \"Bruised\" - crushed under the weight of Divine justice. \"The chastisement of our peace\" - the punishment which was to procure our peace with God. \"By his stripes\" - the stripes and wounds He received. \"We are healed\" - pardoned, sanctified, and saved. The words run in the plural number - OUR transgressions, OUR iniquities, OUR peace, WE are healed - to show that each individual believer has a personal interest in the sufferings of Christ.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: '1 Peter 2:24', text: 'He himself bore our sins in his body on the cross, so that we might die to sins and live for righteousness; by his wounds you have been healed.' },
      { ref: 'Romans 4:25', text: 'He was delivered over to death for our sins and was raised to life for our justification.' },
      { ref: 'Matthew 8:16-17', text: 'When evening came, many who were demon-possessed were brought to him... This was to fulfill what was spoken through the prophet Isaiah: \"He took up our infirmities and bore our diseases.\"' },
      { ref: '2 Corinthians 5:21', text: 'God made him who had no sin to be sin for us, so that in him we might become the righteousness of God.' },
      { ref: 'Isaiah 53:3-4', text: 'He was despised and rejected by mankind, a man of suffering, and familiar with pain... Surely he took up our pain and bore our suffering...' },
      { ref: 'Ephesians 2:14-16', text: 'For he himself is our peace, who has made the two groups one and has destroyed the barrier, the dividing wall of hostility... by setting aside in his flesh the law with its commands and regulations.' },
      { ref: 'Galatians 3:13', text: 'Christ redeemed us from the curse of the law by becoming a curse for us, for it is written: \"Cursed is everyone who is hung on a pole.\"' },
      { ref: 'Mark 10:45', text: 'For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.' },
      { ref: 'Colossians 1:20', text: 'And through him to reconcile to himself all things, whether things on earth or things in heaven, by making peace through his blood, shed on the cross.' },
      { ref: 'Hebrews 9:28', text: 'So Christ was sacrificed once to take away the sins of many; and he will appear a second time, not to bear sin, but to bring salvation to those who are waiting for him.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u05d7\u05b8\u05dc\u05b7\u05dc (Chalal)', transliteration: 'Chalal', meaning: 'The Hebrew verb meaning \"to pierce, wound, profane.\" It is used here in the intensive (Pual) stem: \"he was pierced\" or \"he was fatally wounded.\" The word conveys a violent, mortal wounding - not a mere scratch but a piercing through. This word vividly anticipates the crucifixion of Christ - His hands, feet, and side pierced. The same root appears in Zechariah 12:10: \"They will look on me whom they have pierced.\" The Septuagint translates it as \"etraumatisthe\" - He was traumatized, wounded.', strongs: 'H2490' },
      { word: '\u05d3\u05bc\u05b8\u05db\u05b8\u05d0 (Daka\')', transliteration: 'Daka\'', meaning: 'The Hebrew verb meaning \"to crush, break in pieces, oppress.\" Used here in the Pual stem: \"he was crushed\" or \"he was bruised.\" This is an even stronger word than chalal - it means to be ground to powder, shattered, broken into fragments. It conveys the totality of Christ\'s suffering - not merely wounded but completely crushed under the weight of divine judgment. The word is used elsewhere of the poor and brokenhearted (Psalm 34:18, 51:17), but only here of the Messiah\'s substitutionary suffering.', strongs: 'H1792' },
      { word: '\u05e9\u05c1\u05b8\u05dc\u05d5\u05b9\u05dd (Shalom)', transliteration: 'Shalom', meaning: 'The Hebrew word for \"peace, wholeness, well-being, completeness.\" In this context, \"the chastisement of our shalom\" means the punishment that secured our complete well-being and reconciliation with God. Hebrew shalom is far more than the absence of conflict; it encompasses total well-being - physical health, spiritual peace, social harmony, and covenantal blessing. The Messiah\'s suffering purchases this comprehensive peace for His people. The same word is used for peace offerings (shelamim) and in the Aaronic blessing (Numbers 6:26).', strongs: 'H7965' },
      { word: '\u05d7\u05b2\u05d1\u05bb\u05e8\u05b8\u05d4 (Chaburah)', transliteration: 'Chaburah', meaning: 'The Hebrew noun for \"stripe, bruise, wound, weal.\" It refers to the marks left by a severe beating - the black-and-blue weals from scourging. This word is used specifically of the stripes inflicted by a whip or rod. The phrase \"by his stripes\" (chaburato) speaks of the particular suffering Christ endured through Roman flogging. The medical imagery is powerful: the wounds of the Physician become the medicine for the sick. Peter directly quotes this in 1 Peter 2:24: \"by whose stripes you were healed.\"', strongs: 'H2250' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Substitutionary Atonement', pronunciation: '\u02ccs\u028cb\u0259\u02cct\u026a\u02d0\u0283\u0259n\u025bri \u0259\u02c8to\u028anm\u0259nt', definition: 'The doctrine that Christ suffered the penalty of sin as a substitute for sinners, satisfying the demands of divine justice.', description: 'Isaiah 53:5 is the classic Old Testament text for substitutionary atonement. The Hebrew prepositions (min - \"for\" or \"because of\") indicate that Christ suffered in our place and on our account. This doctrine holds that Christ\'s death was not merely exemplary but actually substitutionary - He took our place, bore our penalty, and secured our salvation. The New Testament development (Romans 3:25, 2 Corinthians 5:21, 1 Peter 2:24, 3:18) consistently presents Christ\'s death as a vicarious sacrifice for sins.' },
      { term: 'Vicarious Suffering', pronunciation: 'va\u026a\u02c8k\u025bri\u0259s \u02c8s\u028cf\u0259r\u026a\u014b', definition: 'Suffering endured by one person on behalf of another, taking their place and bearing their penalty.', description: 'From Latin \"vicarius\" (substitute). The concept pervades the Old Testament sacrificial system, where an innocent animal died in place of the guilty offerer. Isaiah 53 presents the ultimate vicarious suffering - the Messiah bears sins He did not commit, suffers punishments He did not deserve, and dies for transgressions He did not commit. The key phrase \"for\" (min) appears repeatedly: \"for our transgressions,\" \"for our iniquities.\" This vicarious principle reaches its culmination in Christ\'s once-for-all sacrifice (Hebrews 9:26-28).' },
      { term: 'Peace with God', pronunciation: 'pi\u02d0s w\u026a\u00f0 \u0261\u0252d', definition: 'The state of reconciliation and friendship with God, secured through the atoning work of Christ.', description: 'In Romans 5:1, Paul declares that being justified by faith, we have peace with God through our Lord Jesus Christ. This peace is not a feeling but an objective status - the end of hostility between God and the sinner. Isaiah 53:5 says this peace was purchased by the Messiah\'s chastisement. The Hebrew shalom implies not just the cessation of enmity but the establishment of a positive, covenant relationship of well-being and blessing.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u05d5\u05b0\u05d4\u05d5\u05bc\u05d0', strongs: 'H1931', transliteration: 'VeHu', translation: 'But He' },
      { original: '\u05de\u05b0\u05d7\u05b9\u05dc\u05b8\u05dc', strongs: 'H2490', transliteration: 'Mecholal', translation: 'was pierced' },
      { original: '\u05de\u05b4\u05e4\u05bc\u05b0\u05e9\u05c1\u05b8\u05e2\u05b5\u05d9\u05e0\u05d5\u05bc', strongs: 'H6588', transliteration: 'Mipeshaeinu', translation: 'for our transgressions' },
      { original: '\u05de\u05b0\u05d3\u05bb\u05db\u05bc\u05b8\u05d0', strongs: 'H1792', transliteration: 'Meduka', translation: 'was crushed' },
      { original: '\u05de\u05b5\u05e2\u05b2\u05d5\u05b9\u05e0\u05b9\u05ea\u05b5\u05d9\u05e0\u05d5\u05bc', strongs: 'H5771', transliteration: 'Me\'avonoteinu', translation: 'for our iniquities' },
      { original: '\u05de\u05d5\u05bc\u05e1\u05b7\u05e8', strongs: 'H4148', transliteration: 'Musar', translation: 'the chastisement' },
      { original: '\u05e9\u05c1\u05b0\u05dc\u05d5\u05b9\u05de\u05b5\u05e0\u05d5\u05bc', strongs: 'H7965', transliteration: 'Shelomeinu', translation: 'of our peace' },
      { original: '\u05e2\u05b8\u05dc\u05b8\u05d9\u05d5', strongs: 'H5921', transliteration: 'Alav', translation: 'was upon Him' },
      { original: '\u05d5\u05bc\u05d1\u05b7\u05d7\u05b2\u05d1\u05bb\u05e8\u05b8\u05ea\u05d5\u05b9', strongs: 'H2250', transliteration: 'Uvachaburato', translation: 'and by His stripes' },
      { original: '\u05e0\u05b4\u05e8\u05b0\u05e4\u05bc\u05b8\u05d0', strongs: 'H7495', transliteration: 'Nirpa', translation: 'we are healed' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Atonement' }, { name: 'Substitution' }, { name: 'The Cross' }, { name: 'Suffering Servant' }, { name: 'Peace with God' }, { name: 'Healing' }, { name: 'Salvation' }, { name: 'Prophecy Fulfilled' },
    ]),
  },
  // ── Matthew 5:3-12 (The Beatitudes) ─────────────────────────────
  {
    bookName: 'Matthew',
    chapter: 5,
    verseStart: 3,
    verseEnd: 12,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Commentary on Matthew', text: 'Christ begins His sermon with blessings, not curses - coming from Sinai with blessings in His mouth. The Beatitudes contain the sum of true Christianity, describing the character of those who are truly blessed. Each beatitude begins with \"Blessed\" - not with a command but with a benediction, showing that grace is the foundation of all true obedience. The poor in spirit are those who are humble, self-distrusting, and dependent on God. Those who mourn are blessed - not for the mourning itself but for the comfort that follows. The meek are those who are gentle and patient under provocation. The Beatitudes turn the world\'s values upside down, pronouncing blessed those whom the world considers unfortunate.' },
      { author: 'John Wesley', title: 'Wesley\'s Explanatory Notes on the New Testament', text: 'Our Lord begins His teaching with eight beatitudes, which are the foundation of all His doctrine. By these, He shows who are the true heirs of the promises. \"Blessed\" (makarios) signifies happy - truly, supremely happy. The poor in spirit are those who feel their spiritual poverty and need of Christ. The mourners are those who sorrow for sin - their own and others\'. The meek are those who do not assert their own rights but submit to God and bear injuries patiently. Those who hunger and thirst after righteousness are those who desire above all things to be holy as God is holy. The pure in heart are those whose motives are unmixed and whose affections are set on God. The peacemakers are those who promote peace between God and man and between man and man. The persecuted are blessed because great is their reward in heaven.' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on the Harmony of the Gospels', text: 'In these beatitudes, Christ explains the nature of true happiness, which the world seeks in vain in riches, honors, and pleasures. He shows that happiness is found in the opposite direction - in poverty of spirit, mourning, meekness, and persecution. The kingdom of heaven belongs to the poor in spirit, for they who trust not in themselves are prepared to receive God\'s grace. The comfort promised to mourners is the joy of the Holy Spirit. The earth that the meek shall inherit is the renewed creation. Mercy is the fruit of faith, and the merciful shall obtain mercy. The pure in heart shall see God - not with bodily eyes but with the understanding enlightened by the Spirit. Persecution for righteousness\' sake is a seal of our adoption.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Luke 6:20-23', text: 'Luke\'s parallel account of the Beatitudes, which includes corresponding woes: \"Blessed are you who are poor, for yours is the kingdom of God... But woe to you who are rich, for you have already received your comfort.\"' },
      { ref: 'Psalm 37:11', text: 'But the meek will inherit the land and enjoy peace and prosperity.' },
      { ref: 'Psalm 34:18', text: 'The Lord is near to the brokenhearted and saves those who are crushed in spirit.' },
      { ref: 'Psalm 24:3-4', text: 'Who may ascend the mountain of the Lord? Who may stand in his holy place? The one who has clean hands and a pure heart...' },
      { ref: 'Psalm 119:1-2', text: 'Blessed are those whose ways are blameless, who walk according to the law of the Lord. Blessed are those who keep his statutes and seek him with all their heart.' },
      { ref: 'Philippians 3:20', text: 'But our citizenship is in heaven. And we eagerly await a Savior from there, the Lord Jesus Christ.' },
      { ref: 'Hebrews 12:14', text: 'Make every effort to live in peace with everyone and to be holy; without holiness no one will see the Lord.' },
      { ref: 'James 2:13', text: 'Because judgment without mercy will be shown to anyone who has not been merciful. Mercy triumphs over judgment.' },
      { ref: '1 Peter 3:14', text: 'But even if you should suffer for what is right, you are blessed. \"Do not fear their threats; do not be frightened.\"' },
      { ref: 'Isaiah 61:1-3', text: 'The Spirit of the Sovereign Lord is on me... to proclaim good news to the poor... to comfort all who mourn... to bestow on them a crown of beauty instead of ashes...' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u03bc\u03b1\u03ba\u03ac\u03c1\u03b9\u03bf\u03c2 (Makarios)', transliteration: 'Makarios', meaning: 'The Greek adjective meaning \"blessed, happy, fortunate.\" Unlike eudaimon (prosperous) or tycheros (lucky), makarios describes a state of well-being that is independent of outward circumstances. It is the happiness that comes from God and from being in a right relationship with Him. In the Greek Old Testament (Septuagint), makarios translates the Hebrew ashrei (Psalm 1:1), which describes the person whose delight is in God\'s law. The word implies divine favor - not based on merit but on God\'s gracious evaluation.', strongs: 'G3107' },
      { word: '\u03c0\u03c4\u03c9\u03c7\u03cc\u03c2 (Ptochos)', transliteration: 'Ptochos', meaning: 'The Greek adjective for \"poor, destitute, beggarly.\" Unlike penes (a poor person who works for a living), ptochos describes one who is so utterly destitute that he must beg. In the context of \"poor in spirit,\" it means those who recognize their complete spiritual bankruptcy before God - those who have no spiritual resources of their own and must beg for grace. This is the foundational beatitude because no one enters the kingdom without first acknowledging their spiritual poverty. The contrast with the Laodicean church (Revelation 3:17) who thought they were \"rich\" but were actually \"wretched, pitiable, poor, blind, and naked\" is striking.', strongs: 'G4434' },
      { word: '\u03c0\u03c1\u03b1\u03cb\u03c2 (Praus)', transliteration: 'Praus', meaning: 'The Greek adjective for \"meek, gentle, humble.\" In classical Greek, it was used of a wild animal that had been tamed - power under control. Meekness is not weakness but strength submitted to God\'s will. It is the opposite of self-assertiveness and arrogance. Aristotle defined it as the mean between excessive anger and excessive angerlessness. In the New Testament, Christ describes Himself as \"gentle and humble in heart\" (Matthew 11:29), and Moses is called the meekest man on earth (Numbers 12:3). The meek do not demand their rights but trust God to vindicate them.', strongs: 'G4239' },
      { word: '\u03b4\u03b9\u03c9\u03ba\u03ce (Dioko)', transliteration: 'Dioko', meaning: 'The Greek verb meaning \"to pursue, persecute, press forward.\" In the eighth beatitude, it means \"to persecute, harass, cause to flee.\" The passive participle (dediogmenoi) indicates those who have been persecuted. The word carries the sense of hostile pursuit. Remarkably, Christ pronounces blessing on those who are pursued for righteousness\' sake. The same verb is used positively in Philippians 3:14: \"I press on (dioko) toward the goal.\" The righteous are those who pursue God, and in turn are pursued by the world\'s hostility.', strongs: 'G1377' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Beatitude', pronunciation: 'bi\u02c8\u00e6t\u026atju\u02d0d', definition: 'One of the eight declarations of blessedness pronounced by Jesus in the Sermon on the Mount.', description: 'From Latin beatitudo (blessedness, happiness), translating the Greek makarios. The Beatitudes (Matthew 5:3-12, with a parallel in Luke 6:20-23) form the opening of Jesus\' most famous discourse. They have been called \"the beautitudes\" for their description of beautiful Christian character. Each follows a pattern: \"Blessed are the [character quality], for they shall [promise].\" They present an \"upside-down\" kingdom where the poor, mourning, meek, and persecuted are called blessed. Augustine, Luther, Calvin, Wesley, and countless others have written extensively on the Beatitudes as the essence of Christian ethics.' },
      { term: 'Sermon on the Mount', pronunciation: '\u02c8s\u025crm\u0259n \u0252n \u00f0\u0259 ma\u028ant', definition: 'Jesus\' most extensive collection of ethical and spiritual teachings, recorded in Matthew 5-7.', description: 'Delivered on a mountainside in Galilee, likely near Capernaum. The Sermon begins with the Beatitudes and includes teachings on salt and light, the fulfillment of the Law, anger and reconciliation, adultery and lust, divorce, oaths, non-retaliation, love for enemies, giving to the needy, prayer (including the Lord\'s Prayer), fasting, treasures in heaven, worry, judging others, the Golden Rule, the narrow gate, false prophets, and building on the rock. It concludes with the people astonished at Jesus\' authority (Matthew 7:28-29).' },
      { term: 'Kingdom of Heaven', pronunciation: '\u02c8k\u026a\u014bd\u0259m \u0252v \u02c8h\u025bv\u0259n', definition: 'The sovereign rule of God over His people, inaugurated by Christ and to be consummated at His return.', description: 'Matthew\'s characteristic phrase for the \"kingdom of God\" (reflecting Jewish reverence for the divine name). The kingdom is both present (already) and future (not yet). It is present wherever God\'s rule is acknowledged and Christ is Lord, yet awaits full manifestation when Christ returns. The Beatitudes describe the character of those who belong to this kingdom. Entrance is by grace through faith, and membership is marked by humility, righteousness, mercy, purity, and peacemaking.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u03bc\u03b1\u03ba\u03ac\u03c1\u03b9\u03bf\u03b9', strongs: 'G3107', transliteration: 'Makarioi', translation: 'Blessed' },
      { original: '\u03bf\u1f31 \u03c0\u03c4\u03c9\u03c7\u03bf\u1f76', strongs: 'G4434', transliteration: 'Hoi Ptochoi', translation: 'are the poor' },
      { original: '\u03c4\u1ff7 \u03c0\u03bd\u03b5\u03cd\u03bc\u03b1\u03c4\u03b9', strongs: 'G4151', transliteration: 'To Pneumati', translation: 'in spirit' },
      { original: '\u03b1\u1f50\u03c4\u1ff6\u03bd', strongs: 'G846', transliteration: 'Aiton', translation: 'theirs' },
      { original: '\u1f21 \u03b2\u03b1\u03c3\u03b9\u03bb\u03b5\u03af\u03b1', strongs: 'G932', transliteration: 'He Basileia', translation: 'the kingdom' },
      { original: '\u03c4\u1ff6\u03bd \u03bf\u1f50\u03c1\u03b1\u03bd\u1ff6\u03bd', strongs: 'G3772', transliteration: 'Ton Ouranon', translation: 'of heaven' },
      { original: '\u03bf\u1f31 \u03c0\u03c1\u03b1\u03b5\u1fd6\u03c2', strongs: 'G4239', transliteration: 'Hoi Praeis', translation: 'the meek' },
      { original: '\u03ba\u03bb\u03b7\u03c1\u03bf\u03bd\u03bf\u03bc\u03ae\u03c3\u03bf\u03c5\u03c3\u03b9', strongs: 'G2816', transliteration: 'Kleronomesousi', translation: 'will inherit' },
      { original: '\u03c4\u1f74\u03bd \u03b3\u1fc6\u03bd', strongs: 'G1093', transliteration: 'Ten Gen', translation: 'the earth' },
      { original: '\u03bf\u1f31 \u03b5\u1f30\u03c1\u03b7\u03bd\u03bf\u03c0\u03bf\u03b9\u03bf\u03af', strongs: 'G1518', transliteration: 'Hoi Eirenopoioi', translation: 'the peacemakers' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Sermon on the Mount' }, { name: 'Kingdom of Heaven' }, { name: 'Humility' }, { name: 'Meekness' }, { name: 'Mercy' }, { name: 'Purity of Heart' }, { name: 'Peacemaking' }, { name: 'Persecution' }, { name: 'Christian Character' },
    ]),
  },
  // ── John 1:1 ────────────────────────────────────────────────────
  {
    bookName: 'John',
    chapter: 1,
    verseStart: 1,
    verseEnd: 1,
    commentaries: JSON.stringify([
      { author: 'Matthew Henry', title: 'Matthew Henry\'s Commentary on John', text: 'The evangelist begins with the eternity of Christ, the eternal Word. He does not begin with the genealogy of Christ\'s humanity as Matthew and Luke do, but with the account of His divinity. \"In the beginning was the Word\" - this speaks of His existence before all creation. He was with God - in distinct personality and communion with the Father. He was God - of the same nature and essence with the Father. These three declarations are the foundation of all Christian theology: Christ\'s eternity, His distinct personhood, and His full divinity. The same Word that was with God and was God is the One who became flesh and dwelt among us (John 1:14).' },
      { author: 'John Calvin', title: 'Calvin\'s Commentary on John', text: 'John, intending to prove that Christ is the eternal God, begins with the Word. \"In the beginning\" refers to the beginning of time, or more precisely, to that eternity before time existed. The Word was not merely before Christ\'s incarnation but before all ages. \"The Word was with God\" means He was in God, dwelling in His bosom, distinct in person yet inseparable in essence. \"The Word was God\" declares plainly His divine nature. John does not say the Word was in God but was God - making the unity of essence unmistakable. This is the key that unlocks the whole Gospel: the One who walked among men is the eternal God incarnate.' },
      { author: 'C.H. Spurgeon', title: 'Spurgeon\'s Sermons on John', text: '\"In the beginning was the Word\" - Christ is no upstart deity; He was before all things. When the morning stars sang together, He was there. When this world was formed, He was the Architect. \"And the Word was with God\" - face to face with God, in the joyous fellowship of the eternal Trinity. What love must have existed between the Father and the Son from all eternity! \"And the Word was God\" - the highest, the most absolute, the most unquestionable declaration of the Godhead of our Lord. Not a secondary god, not a created god, but very God of very God. This is the cornerstone of our faith; if Christ is not God, our preaching is vain and your faith is also vain.' },
    ]),
    crossReferences: JSON.stringify([
      { ref: 'Genesis 1:1', text: 'In the beginning God created the heavens and the earth.' },
      { ref: 'Colossians 1:15-17', text: 'The Son is the image of the invisible God, the firstborn over all creation. For in him all things were created... He is before all things, and in him all things hold together.' },
      { ref: 'Philippians 2:6-7', text: 'Who, being in very nature God, did not consider equality with God something to be used to his own advantage; rather, he made himself nothing by taking the very nature of a servant, being made in human likeness.' },
      { ref: 'Hebrews 1:1-3', text: 'In the past God spoke to our ancestors through the prophets at many times and in various ways, but in these last days he has spoken to us by his Son... The Son is the radiance of God\'s glory and the exact representation of his being, sustaining all things by his powerful word.' },
      { ref: '1 John 1:1-2', text: 'That which was from the beginning, which we have heard, which we have seen with our eyes, which we have looked at and our hands have touched - this we proclaim concerning the Word of life.' },
      { ref: 'Revelation 19:13', text: 'He is dressed in a robe dipped in blood, and his name is the Word of God.' },
      { ref: 'Proverbs 8:22-23', text: 'The Lord brought me forth as the first of his works, before his deeds of old; I was formed long ages ago, at the very beginning, when the world came to be.' },
      { ref: 'John 8:58', text: 'Very truly I tell you, Jesus answered, before Abraham was, I AM.' },
      { ref: 'Micah 5:2', text: 'But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come for me one who will be ruler over Israel, whose origins are from of old, from ancient times.' },
      { ref: 'Isaiah 9:6', text: 'For to us a child is born, to us a son is given, and the government will be on his shoulders. And he will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.' },
    ]),
    wordStudies: JSON.stringify([
      { word: '\u039b\u03cc\u03b3\u03bf\u03c2 (Logos)', transliteration: 'Logos', meaning: 'The Greek term translated \"Word.\" In classical Greek philosophy (Heraclitus, Stoics), Logos meant the rational principle that ordered the universe. For Philo of Alexandria, Logos was the intermediate being between God and creation. John takes this rich concept and fills it with Hebrew meaning: the Logos is the personal, creative Word of God (Hebrew dabar) that spoke creation into existence (Genesis 1), the Wisdom of God personified (Proverbs 8), and the Word of the Lord that came to the prophets. John\'s radical innovation is that this Logos became flesh in Jesus Christ. The Logos is eternal (\"was\" in the beginning), personal (\"with\" God implying relationship), and divine (\"was\" God). This identifies Jesus as the full and final self-revelation of God.', strongs: 'G3056' },
      { word: '\u1f00\u03c1\u03c7\u03ae (Arche)', transliteration: 'Arche', meaning: 'The Greek noun meaning \"beginning, origin, first principle, ruler.\" The phrase \"In the beginning\" (En arche) echoes the opening words of Genesis 1:1 in the Septuagint. By using this phrase, John deliberately connects his prologue to the creation account. But while Genesis speaks of the beginning of creation, John speaks of the beginning of all things - a beginning that predates creation itself. The Word already \"was\" at this beginning; He did not come into being at the beginning. Arche can also mean \"first principle\" or \"source,\" suggesting that Christ is the source and origin of all things.', strongs: 'G746' },
      { word: '\u03c0\u03c1\u03cc\u03c2 (Pros)', transliteration: 'Pros', meaning: 'The Greek preposition meaning \"toward, with, face-to-face, in the presence of.\" When used with the accusative case (as in John 1:1b: pros ton Theon), it implies not merely proximity but intimate, face-to-face relationship. It suggests communion, fellowship, and personal interaction. This preposition indicates the distinction of persons within the Godhead: the Word is not the Father but is in eternal, loving communion with the Father. The same construction is used in Mark 6:3 (the people were \"against\" Jesus, pros with hostile intent) and 1 Thessalonians 3:4 (we told you \"beforehand\"), but here it conveys the deepest intimacy.', strongs: 'G4314' },
      { word: '\u0398\u03b5\u03cc\u03c2 (Theos)', transliteration: 'Theos', meaning: 'The Greek word for \"God.\" In John 1:1c, \"the Word was God\" (Theos en ho Logos). The absence of the definite article before Theos (anarthrous construction) distinguishes the person of the Word from the person of the Father while affirming His full divine nature. As Greek grammar requires, the predicate nominative (Theos) precedes the verb to emphasize quality or essence: the Word possesses the very nature and essence of God. This was a key text in the Arian controversy: Athanasius argued against Arius that John 1:1 proves Christ is fully God, not a created being. The same anarthrous Theos construction appears in John 1:18 and Romans 9:5.', strongs: 'G2316' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Logos Theology', pronunciation: '\u02c8l\u0252\u0261\u0252s \u03b8i\u02c8\u0252l\u0259d\u0292i', definition: 'The theological understanding of Jesus Christ as the eternal Word (Logos) of God, the full and final revelation of God to humanity.', description: 'The Logos concept has deep roots in both Greek philosophy and Hebrew Scripture. Heraclitus (c. 500 BC) first used Logos as the rational principle governing the universe. The Stoics developed it further as the animating principle of all reality. Philo of Alexandria (c. 20 BC - AD 50) synthesized Greek philosophy with Hebrew Scripture, describing the Logos as God\'s agent in creation and revelation. John\'s prologue transforms this concept: the Logos is not an abstract principle but a concrete person - Jesus Christ. The Logos is eternal, personal, divine, and incarnate. This became foundational for Trinitarian theology and christology.' },
      { term: 'Hypostatic Union', pronunciation: '\u02ccha\u026ap\u0259\u02c8st\u00e6t\u026ak \u02c8ju\u02d0nj\u0259n', definition: 'The union of the divine and human natures in the one person of Jesus Christ. John 1:1 and 1:14 together affirm both Christ\'s full deity (the Word was God) and His full humanity (the Word became flesh). The hypostatic union means the two natures are united without confusion, change, division, or separation - as defined by the Council of Chalcedon (AD 451). This union is eternal and indivisible; the person of Christ is one, possessing both a divine nature (from eternity) and a human nature (assumed at the incarnation).', strongs: 'G5287' },
      { term: 'Pre-existence of Christ', pronunciation: '\u02ccpri\u02d0\u0261z\u026a\u02c8st\u0259ns \u0252v kra\u026ast', definition: 'The doctrine that Jesus Christ existed eternally before His incarnation, as the second person of the Trinity.', description: 'John 1:1 is the definitive proof text for Christ\'s pre-existence: the Word \"was\" at the beginning, not \"came to be.\" This pre-existence is eternal, not temporal - Christ did not merely exist before His birth but before all creation. Other key texts include John 8:58 (\"before Abraham was, I AM\"), John 17:5 (the glory Christ had with the Father before the world existed), Colossians 1:17 (He is before all things), and Micah 5:2 (His origins are from ancient times). This doctrine distinguishes Christianity from unitarianism and Arianism.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: '\u1f18\u03bd \u1f00\u03c1\u03c7\u1fc7', strongs: 'G1722/G746', transliteration: 'En Arche', translation: 'In the beginning' },
      { original: '\u1f26\u03bd', strongs: 'G2258', transliteration: 'En', translation: 'was' },
      { original: '\u1f41 \u039b\u03cc\u03b3\u03bf\u03c2', strongs: 'G3056', transliteration: 'Ho Logos', translation: 'the Word' },
      { original: '\u03ba\u03b1\u1f76', strongs: 'G2532', transliteration: 'Kai', translation: 'and' },
      { original: '\u1f41 \u039b\u03cc\u03b3\u03bf\u03c2', strongs: 'G3056', transliteration: 'Ho Logos', translation: 'the Word' },
      { original: '\u1f26\u03bd', strongs: 'G2258', transliteration: 'En', translation: 'was' },
      { original: '\u03c0\u03c1\u1f78\u03c2', strongs: 'G4314', transliteration: 'Pros', translation: 'with (face to face with)' },
      { original: '\u03c4\u1f78\u03bd \u0398\u03b5\u03cc\u03bd', strongs: 'G2316', transliteration: 'Ton Theon', translation: 'God' },
      { original: '\u03ba\u03b1\u1f76 \u0398\u03b5\u1f78\u03c2', strongs: 'G2316', transliteration: 'Kai Theos', translation: 'and God' },
      { original: '\u1f26\u03bd', strongs: 'G2258', transliteration: 'En', translation: 'was' },
      { original: '\u1f41 \u039b\u03cc\u03b3\u03bf\u03c2', strongs: 'G3056', transliteration: 'Ho Logos', translation: 'the Word' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'The Word (Logos)' }, { name: 'Deity of Christ' }, { name: 'Trinity' }, { name: 'Pre-existence of Christ' }, { name: 'Creation' }, { name: 'Incarnation' }, { name: 'Eternal Generation' }, { name: 'Hypostatic Union' },
    ]),
  },
];

async function main() {
  console.log('Seeding verse resources...');

  for (const resource of verseResources) {
    try {
      const { bookName, chapter, verseStart } = resource;
      const existing = await prisma.verseResource.findFirst({
        where: {
          bookName,
          chapter,
          verseStart,
        },
      });

      if (existing) {
        await prisma.verseResource.update({
          where: { id: existing.id },
          data: resource,
        });
        console.log(`  \u2713 Updated ${bookName} ${chapter}:${verseStart}${resource.verseEnd !== resource.verseStart ? '-' + resource.verseEnd : ''}`);
      } else {
        await prisma.verseResource.create({ data: resource });
        console.log(`  \u2713 Created ${bookName} ${chapter}:${verseStart}${resource.verseEnd !== resource.verseStart ? '-' + resource.verseEnd : ''}`);
      }
    } catch (err) {
      const { bookName, chapter, verseStart } = resource;
      console.error(`  \u2717 Failed for ${bookName} ${chapter}:${verseStart}:`, err.message);
    }
  }

  console.log('\n\u2705 Verse resources seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
