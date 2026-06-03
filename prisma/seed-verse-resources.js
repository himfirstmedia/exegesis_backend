import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genesis1Resources = [
  // ── Verse 1:1 ─────────────────────────────────────────────────
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
      { word: 'בְּרֵאשִׁית (Bereshit)', transliteration: 'Bereshit', meaning: 'The Hebrew word for \"In the beginning.\" It consists of the preposition \"be\" (in/at) and \"reshit\" (first/beginning/chief). This word establishes a temporal framework for all of creation and implies a definite starting point for time and space. The Rabbis noted that the Torah begins with the second letter of the Hebrew alphabet (Bet) rather than the first (Aleph), suggesting that some aspects of God\'s nature are beyond human comprehension.', strongs: 'H7225' },
      { word: 'בָּרָא (Bara)', transliteration: 'Bara', meaning: 'The Hebrew verb for \"created.\" This word is used exclusively with God as its subject, signifying divine creation that brings something entirely new into existence. Unlike other Hebrew words for making or forming (asah, yatsar), bara emphasizes creation out of nothing (creatio ex nihilo). It appears in the Bible approximately 50 times, always with God as the actor.', strongs: 'H1254' },
      { word: 'אֱלֹהִים (Elohim)', transliteration: 'Elohim', meaning: 'The Hebrew word for God used here. Though plural in form, it takes a singular verb when referring to the one true God. This plural form hints at the complexity within the Godhead, later revealed as the Trinity. The word emphasizes God\'s power, majesty, and role as the supreme Judge and Creator. Its plural form with singular verb is unique to the God of Israel.', strongs: 'H430' },
      { word: 'שָׁמַיִם (Shamayim)', transliteration: 'Shamayim', meaning: 'The Hebrew word for \"heavens.\" A dual noun (always plural in form) suggesting the heavens have multiple layers or dimensions - the atmospheric sky, the stellar universe, and the spiritual dwelling place of God. The word may derive from \"sham\" (there) and \"mayim\" (waters), referring to the waters above the firmament described later in this chapter.', strongs: 'H8064' },
      { word: 'אֶרֶץ (Eretz)', transliteration: 'Eretz', meaning: 'The Hebrew word for \"earth\" or \"land.\" In Genesis 1, it refers to the created material world, initially formless and empty. Throughout Scripture, this word carries both the physical meaning of the planet and the relational meaning of the Promised Land. It appears over 2,500 times in the Hebrew Bible.', strongs: 'H776' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Creation Ex Nihilo', pronunciation: 'kreɪˈeɪʃən ɛks ˈnɪhɪloʊ', definition: 'The theological doctrine that God created the universe out of nothing, without using any pre-existing material.', description: 'Latin for \"creation out of nothing.\" This doctrine distinguishes biblical creation from other ancient creation myths where gods fashion the world from pre-existing chaos or matter. The concept is foundational to Christian theology, affirming God\'s absolute sovereignty and the complete dependence of all created things on Him. It is supported by Genesis 1:1, John 1:3, and Hebrews 11:3.' },
      { term: 'Theistic Evolution', pronunciation: 'θiˈɪstɪk ˌɛvəˈluʃən', definition: 'The belief that God used evolutionary processes to bring about the diversity of life while remaining the ultimate Creator.', description: 'This view attempts to reconcile scientific observations of evolution with belief in God as Creator. It holds that Genesis describes the fact of creation rather than the specific method, allowing for an ancient earth and common descent while affirming that God initiated and guided the process.' },
      { term: 'Cosmogony', pronunciation: 'kɒzˈmɒɡəni', definition: 'The study of the origin and development of the universe as described in various cultural and religious traditions.', description: 'From Greek \"kosmos\" (world/universe) and \"gonia\" (birth). Biblical cosmogony differs from ancient Near Eastern accounts by presenting a single, sovereign God who creates by divine fiat rather than through conflict or procreation. The Genesis account is distinct in its monotheistic framework and its emphasis on the inherent goodness of creation.' },
      { term: 'Divine Fiat', pronunciation: 'dɪˈvaɪn ˈfiːət', definition: 'The creative command of God that brings something into existence simply by His spoken word.', description: 'From Latin \"let it be done.\" Throughout Genesis 1, God speaks creation into existence - \"Let there be light\" - demonstrating that His word carries creative power. This theme continues in the New Testament where Jesus calms storms and raises the dead by His spoken word, and where Scripture speaks of Christ as the \"Word\" through whom all things were made (John 1:1-3).' },
    ]),
    interlinearWords: JSON.stringify([
      { original: 'בְּרֵאשִׁית', strongs: 'H7225', transliteration: 'Bereshit', translation: 'In the beginning' },
      { original: 'בָּרָא', strongs: 'H1254', transliteration: 'Bara', translation: 'created' },
      { original: 'אֱלֹהִים', strongs: 'H430', transliteration: 'Elohim', translation: 'God' },
      { original: 'אֵת', strongs: 'H853', transliteration: 'Et', translation: '[direct object marker]' },
      { original: 'הַשָּׁמַיִם', strongs: 'H8064', transliteration: 'HaShamayim', translation: 'the heavens' },
      { original: 'וְאֵת', strongs: 'H853', transliteration: 'VeEt', translation: 'and [direct object]' },
      { original: 'הָאָרֶץ', strongs: 'H776', transliteration: 'HaAretz', translation: 'the earth' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Creation' }, { name: 'God as Creator' }, { name: 'Origins' }, { name: 'Divine Sovereignty' }, { name: 'Ex Nihilo Creation' }, { name: 'Biblical Cosmology' }, { name: 'The Trinity' },
    ]),
  },
  // ── Verse 1:2 ─────────────────────────────────────────────────
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
      { word: 'תֹהוּ וָבֹהוּ (Tohu vaVohu)', transliteration: 'Tohu vaVohu', meaning: 'A Hebrew phrase meaning \"formless and empty\" or \"waste and void.\" Tohu implies desolation, emptiness, and formlessness - a state of raw potential without structure. Bohu reinforces and intensifies the meaning, suggesting vacant emptiness. Together they describe the primordial state before God\'s creative ordering. The phrase appears elsewhere only in Jeremiah 4:23 to describe judgment.', strongs: 'H8414/H922' },
      { word: 'תְּהוֹם (Tehom)', transliteration: 'Tehom', meaning: 'The Hebrew word for \"deep\" - referring to the primordial waters or abyss. This word is cognate with the Akkadian \"Tiamat,\" the chaos monster of Babylonian mythology. However, in Genesis there is no battle - God simply rules over the deep. The word appears throughout the Old Testament referring to the deep seas and the subterranean waters.', strongs: 'H8415' },
      { word: 'רָחַף (Rachaph)', transliteration: 'Rachaph', meaning: 'The Hebrew verb for \"hovering\" or \"brooding,\" used of the Spirit of God moving over the waters. The same word describes an eagle stirring up its nest in Deuteronomy 32:11, suggesting a gentle, nurturing, life-giving movement. This implies the Spirit\'s role in creation was not merely passive observation but active preparation and empowerment.', strongs: 'H7363' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Chaos Theory (Theological)', pronunciation: 'ˈkeɪɒs ˈθɪəri', definition: 'The theological concept that God brings order out of chaos, both in creation and in redemption.', description: 'Unlike ancient Near Eastern myths where chaos is a hostile force to be defeated, the Genesis account presents chaos as a passive state that God sovereignly organizes. This theme continues throughout Scripture - God brings light out of darkness, life out of death, and order out of confusion. The same creative Spirit who hovered over the waters now works to bring order to human hearts.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: 'וְהָאָרֶץ', strongs: 'H776', transliteration: 'VeHaAretz', translation: 'And the earth' },
      { original: 'הָיְתָה', strongs: 'H1961', transliteration: 'Hayetah', translation: 'was' },
      { original: 'תֹהוּ', strongs: 'H8414', transliteration: 'Tohu', translation: 'formless' },
      { original: 'וָבֹהוּ', strongs: 'H922', transliteration: 'VaVohu', translation: 'and empty' },
      { original: 'וְחֹשֶׁךְ', strongs: 'H2822', transliteration: 'VeChoshech', translation: 'and darkness' },
      { original: 'עַל־פְּנֵי', strongs: 'H6440', transliteration: 'Al-Penei', translation: 'upon the face of' },
      { original: 'תְּהוֹם', strongs: 'H8415', transliteration: 'Tehom', translation: 'the deep' },
      { original: 'וְרוּחַ', strongs: 'H7307', transliteration: 'VeRuach', translation: 'and the Spirit' },
      { original: 'אֱלֹהִים', strongs: 'H430', transliteration: 'Elohim', translation: 'of God' },
      { original: 'מְרַחֶפֶת', strongs: 'H7363', transliteration: 'Merachephet', translation: 'was hovering' },
      { original: 'עַל־פְּנֵי', strongs: 'H6440', transliteration: 'Al-Penei', translation: 'over the face of' },
      { original: 'הַמָּיִם', strongs: 'H4325', transliteration: 'HaMayim', translation: 'the waters' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Holy Spirit' }, { name: 'Chaos and Order' }, { name: 'Divine Creation' }, { name: 'Primordial Waters' },
    ]),
  },
  // ── Verse 1:3-5 (Day 1 - Light) ───────────────────────────────
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
      { word: 'אוֹר (Or)', transliteration: 'Or', meaning: 'The Hebrew word for \"light.\" In this context, it refers to the primal light created before the sun, moon, and stars. Throughout Scripture, light becomes a powerful metaphor for God\'s presence, truth, goodness, and salvation. The word appears over 200 times in the Old Testament and carries deep theological significance, particularly in the Psalms and Isaiah.', strongs: 'H216' },
      { word: 'יוֹם (Yom)', transliteration: 'Yom', meaning: 'The Hebrew word for \"day.\" It can mean a 24-hour day, the daylight hours, or an extended period of time depending on context. In Genesis 1, the phrase \"evening and morning\" bounds each creative day, suggesting a literal 24-hour period. However, the word is also used elsewhere in Scripture for longer periods (\"the day of the Lord\"). The interpretation of \"yom\" in Genesis 1 remains a key point of discussion.', strongs: 'H3117' },
      { word: 'עֶרֶב (Erev)', transliteration: 'Erev', meaning: 'The Hebrew word for \"evening\" or \"sunset.\" It derives from a root meaning \"to mix\" - referring to the mixing of light and darkness at twilight. The Jewish day begins at evening, following the pattern established here: \"there was evening and there was morning, the first day.\"', strongs: 'H6153' },
    ]),
    dictionaryTerms: JSON.stringify([
      { term: 'Fiat Lux', pronunciation: 'ˈfiːət ˈlʌks', definition: 'Latin for \"Let there be light\" - the divine command that initiated the first act of creation.', description: 'This phrase (from the Latin Vulgate translation of Genesis 1:3) has become a universal symbol of enlightenment, discovery, and divine creative power. The phrase is used in various contexts from scientific mottos to academic seals, representing the moment when order emerges from chaos through divine or intellectual activity.' },
    ]),
    interlinearWords: JSON.stringify([
      { original: 'וַיֹּאמֶר', strongs: 'H559', transliteration: 'VaYomer', translation: 'And said' },
      { original: 'אֱלֹהִים', strongs: 'H430', transliteration: 'Elohim', translation: 'God' },
      { original: 'יְהִי', strongs: 'H1961', transliteration: 'Yehi', translation: 'Let there be' },
      { original: 'אוֹר', strongs: 'H216', transliteration: 'Or', translation: 'light' },
      { original: 'וַיְהִי־אוֹר', strongs: 'H216', transliteration: 'VaYehi-Or', translation: 'And there was light' },
    ]),
    relatedTopics: JSON.stringify([
      { name: 'Light and Darkness' }, { name: 'God\'s Creative Word' }, { name: 'Days of Creation' }, { name: 'Evening and Morning' }, { name: 'Divine Speech' },
    ]),
  },
  // ── Verse 1:6-8 (Day 2 - Firmament) ───────────────────────────
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
      { word: 'רָקִיעַ (Raqia)', transliteration: 'Raqia', meaning: 'The Hebrew word for \"firmament\" or \"expanse.\" It comes from the root \"raqa\" meaning \"to spread out, stamp, or beat thin\" - like hammering metal into a thin sheet. This suggests something stretched out or expanded. The Septuagint translates it as \"stereoma\" (solid structure), while the Vulgate uses \"firmamentum.\" Modern translations prefer \"expanse\" or \"vault.\"', strongs: 'H7549' },
    ]),
    interlinearWords: JSON.stringify([]),
    relatedTopics: JSON.stringify([
      { name: 'Heavens' }, { name: 'Atmosphere' }, { name: 'Waters Above' }, { name: 'Firmament' },
    ]),
  },
  // ── Verse 1:9-10 (Day 3 - Dry Land and Seas) ──────────────────
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
      { word: 'יַבָּשָׁה (Yabbashah)', transliteration: 'Yabbashah', meaning: 'The Hebrew word for \"dry land\" or \"dry ground.\" It comes from the root \"yabesh\" meaning \"to be dry, to dry up.\" This word appears approximately 14 times in the Old Testament, often in contexts describing God\'s power over the waters - as in the parting of the Red Sea (Exodus 14:16) where the Israelites walked on dry ground.', strongs: 'H3004' },
      { word: 'יַמִּים (Yamim)', transliteration: 'Yamim', meaning: 'The plural of \"yam\" (sea). In Hebrew, \"yamim\" can refer to the gathered bodies of water, the Mediterranean Sea (the Great Sea), and poetically to large rivers like the Nile and Euphrates. God naming the seas demonstrates His authority over the chaotic waters that ancient cultures feared and deified.', strongs: 'H3220' },
    ]),
    interlinearWords: JSON.stringify([]),
    relatedTopics: JSON.stringify([
      { name: 'Dry Land' }, { name: 'Seas' }, { name: 'Continents' }, { name: 'Geology' }, { name: 'God\'s Sovereignty over Nature' },
    ]),
  },
];

async function main() {
  console.log('Seeding verse resources for Genesis 1:1-10...');
  
  for (const resource of genesis1Resources) {
    try {
      const existing = await prisma.verseResource.findFirst({
        where: {
          bookName: resource.bookName,
          chapter: resource.chapter,
          verseStart: resource.verseStart,
        },
      });
      
      if (existing) {
        await prisma.verseResource.update({
          where: { id: existing.id },
          data: resource,
        });
        console.log(`  ✓ Updated Genesis ${resource.chapter}:${resource.verseStart}${resource.verseEnd !== resource.verseStart ? '-' + resource.verseEnd : ''}`);
      } else {
        await prisma.verseResource.create({ data: resource });
        console.log(`  ✓ Created Genesis ${resource.chapter}:${resource.verseStart}${resource.verseEnd !== resource.verseStart ? '-' + resource.verseEnd : ''}`);
      }
    } catch (err) {
      console.error(`  ✗ Failed for Genesis ${resource.chapter}:${resource.verseStart}:`, err.message);
    }
  }
  
  console.log('\n✅ Verse resources seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
