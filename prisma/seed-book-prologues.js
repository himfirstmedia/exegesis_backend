import { prisma } from '../src/config/db.js';

const prologues = [
  {
    bookName: 'Genesis',
    author: 'Moses',
    authorDetail:
      'Jewish and Christian tradition identifies Moses as the author of Genesis and the other books of the Pentateuch.\n\nBecause Moses lived long after many of the events described in Genesis, the book records history that preceded his lifetime. Christians have traditionally understood Moses to have written under the inspiration of God, potentially incorporating genealogies, historical records, and traditions preserved among God\'s people.\n\nGenesis therefore presents not merely information about ancient people but part of God\'s inspired revelation explaining the beginning of His redemptive work in human history.',
    audience:
      'Genesis was originally given to the people of Israel as part of the Law associated with Moses. The Israelites needed to understand who their God was, where they came from, and why they were God\'s covenant people.\n\nThey were surrounded by nations with competing gods, creation accounts, religions, and cultural practices. Genesis taught Israel that the LORD was not merely another regional deity. He is the Creator of heaven and earth. The God who called Abraham, Isaac, and Jacob was the same God who created everything.\n\nGenesis also explained Israel\'s identity. They were descendants of Abraham, Isaac, and Jacob and heirs to covenant promises God had established generations earlier.',
    dateWritten: 'Traditionally placed during the wilderness period after the exodus',
    locationWritten: 'Wilderness journey context',
    chapters: 50,
    purpose:
      'Genesis was written to reveal the beginning of God\'s relationship with humanity and the foundation of His plan of redemption. It explains where the world came from, where humanity came from, how sin entered the world, why judgment became necessary, and how God began unfolding His plan to redeem fallen humanity.\n\nGenesis also establishes God\'s covenant relationship with Abraham and his descendants. Throughout the book, God demonstrates that He keeps His promises even when circumstances appear impossible. Abraham and Sarah were elderly, yet God gave them Isaac. Joseph was sold into slavery, yet God raised him to leadership in Egypt. A famine threatened Jacob\'s family, yet God had already positioned Joseph to preserve them.\n\nGenesis repeatedly demonstrates that God\'s purposes cannot ultimately be defeated by human weakness, failure, opposition, or evil.',
    keyTheme: 'Beginnings, creation, fall, promise, covenant, and blessing',
    summary:
      'The book of Genesis is the beginning of the biblical story and the foundation upon which the rest of Scripture is built. The name Genesis means beginning or origin, which is fitting because the book explains the beginning of creation, humanity, marriage, sin, nations, God\'s covenant promises, and the nation through which God would ultimately bring the Messiah into the world.\n\nGenesis opens with one of the most foundational declarations in all of Scripture:\n\nGenesis 1:1 (BSB)\nIn the beginning God created the heavens and the earth.\n\nBefore anything existed, God was already there. Genesis presents God as the eternal Creator who speaks creation into existence and establishes order, purpose, and life.\n\nThe opening chapters describe God creating the heavens and the earth and creating humanity in His own image. Adam and Eve were placed in the Garden of Eden, where they enjoyed fellowship with God. However, when they disobeyed God, sin entered human experience, bringing separation, suffering, and death.\n\nEven in the account of humanity\'s fall, God revealed the beginning of His plan of redemption. Genesis 3:15 points forward to the eventual defeat of the serpent through the promised offspring. This theme of redemption continues to unfold throughout the rest of Scripture.\n\nAs humanity multiplied, sin also increased. Genesis records Cain\'s murder of Abel and eventually describes a world so corrupted by wickedness that God brought judgment through the Flood. Yet Noah found favor in the eyes of the LORD. God preserved Noah, his family, and representatives of the animal world through the ark.\n\nAfter the Flood, God established a covenant with Noah and promised never again to destroy all life with a flood, giving the rainbow as the sign of that covenant.\n\nHuman rebellion continued at the Tower of Babel, where people attempted to make a name for themselves rather than honoring God. God confused their language and scattered humanity across the earth.\n\nBeginning in Genesis 12, the focus changes dramatically from humanity generally to one man and his descendants.\n\nGod called Abram, later named Abraham, to leave his homeland and go to a land God would show him. God promised Abraham that He would make him into a great nation, bless him, make his name great, and ultimately bless all the families of the earth through him.\n\nThis covenant becomes one of the central themes of the Bible.\n\nGenesis then follows the lives of the patriarchs:\n\nAbraham → Isaac → Jacob → Joseph\n\nGod miraculously provided Abraham and Sarah with their promised son, Isaac. Isaac became the father of Jacob, whose name God changed to Israel. Jacob\'s twelve sons became the foundation of the twelve tribes of Israel.\n\nThe final portion of Genesis focuses heavily on Joseph. His brothers, motivated by jealousy, sold him into slavery. Joseph was taken to Egypt, falsely accused, imprisoned, and eventually elevated by God to become a powerful leader under Pharaoh. Through Joseph, God preserved Jacob\'s family during a devastating famine and brought the family of Israel into Egypt.\n\nJoseph\'s story demonstrates one of Genesis\'s greatest themes: God\'s sovereignty and providence.\n\nGenesis 50:20 (BSB)\nAs for you, what you intended against me for evil, God intended for good, in order to accomplish a day like this—to preserve the lives of many people.\n\nGenesis therefore begins with God creating the world and concludes with God preserving the family through whom His redemptive plan would continue. The book establishes essential biblical truths about God, creation, humanity, sin, judgment, grace, faith, covenant, obedience, redemption, and God\'s sovereign plan.',
    keyScripture: [
      { reference: 'Genesis 1:1 (BSB)', text: 'In the beginning God created the heavens and the earth.' },
      { reference: 'Genesis 50:20 (BSB)', text: 'As for you, what you intended against me for evil, God intended for good, in order to accomplish a day like this—to preserve the lives of many people.' },
    ],
    background:
      'Genesis is the first of the five books traditionally known as the Pentateuch, meaning "five books." These books are: Genesis, Exodus, Leviticus, Numbers, and Deuteronomy. Together, they establish the historical and theological foundation for Israel and much of the rest of Scripture.\n\nGenesis covers an enormous period of history. It begins with creation itself and ends with the death of Joseph in Egypt. The book can broadly be divided into two major sections.\n\nGenesis 1–11 — The Beginning of Humanity\nThese chapters describe foundational events affecting the entire human race:\n\u2022 Creation\n\u2022 Adam and Eve\n\u2022 The Fall\n\u2022 Cain and Abel\n\u2022 The generations following Adam\n\u2022 Noah and the Flood\n\u2022 God\'s covenant with Noah\n\u2022 The Tower of Babel\n\u2022 The development and scattering of nations\n\nThese chapters explain why the world exists, why humanity is uniquely created in God\'s image, how sin entered human experience, and why mankind desperately needs redemption.\n\nGenesis 12–50 — The Beginning of Israel\nBeginning with Abraham, Genesis narrows its focus to the family God chose for a special covenant purpose. God called Abraham and promised him land, descendants, blessing, and a worldwide purpose. That promise continued through Isaac and Jacob. Jacob became known as Israel, and his twelve sons became the fathers of the twelve tribes of Israel. The account of Joseph explains how Israel\'s family eventually arrived in Egypt. This provides the historical bridge into the next biblical book, Exodus, where Abraham\'s descendants have multiplied greatly but have become enslaved by the Egyptians.\n\nGenesis therefore does much more than record ancient history. It establishes the framework necessary for understanding the entire biblical message. Without Genesis, we would not properly understand creation, humanity\'s relationship with God, the origin and seriousness of sin, God\'s judgment, His grace, His covenant promises, the origin of Israel, or the unfolding promise of the Messiah.',
    structure: [
      { range: '1–11', title: 'Creation and early human history' },
      { range: '12–25', title: 'Abraham' },
      { range: '26–27', title: 'Isaac' },
      { range: '28–36', title: 'Jacob' },
      { range: '37–50', title: 'Joseph and the family of Israel' },
    ],
    lessons:
      'Genesis teaches us first that everything begins with God. Our understanding of life, identity, purpose, marriage, morality, sin, salvation, and eternity must begin with our Creator.\n\nGenesis also teaches us the devastating consequences of sin. Adam and Eve\'s rebellion affected humanity profoundly, and the accounts that follow demonstrate how quickly sin spreads when mankind turns away from God.\n\nYet Genesis is equally a book about God\'s grace and faithfulness. God provided for Adam and Eve. God preserved Noah. God called Abraham. God remained faithful to Isaac. God transformed Jacob. God preserved Joseph. Again and again, imperfect people encounter a perfectly faithful God.\n\nGenesis also teaches the importance of faith and obedience. Abraham had to leave what was familiar and follow God\'s direction. Noah built the ark in obedience to God. Joseph remained faithful through years of hardship without knowing exactly how his circumstances would end.\n\nFor believers today, Genesis reminds us that God is still sovereign, faithful, and worthy of our trust. We may not understand everything God is doing while we are walking through it. Joseph certainly could not have understood God\'s complete plan while sitting in a prison cell. Yet years later, he could look backward and recognize God\'s providential hand. The same principle encourages believers today: what we cannot understand in the moment may still be part of God\'s greater purpose.\n\nMost importantly, Genesis begins the biblical story of redemption. The promise of the coming offspring appears after humanity\'s fall. God\'s covenant promises continue through Abraham and his descendants. Those promises ultimately point forward to Jesus Christ, through whom God\'s plan of salvation extends to the nations.\n\nGenesis begins with:\n\nGenesis 1:1 (BSB)\nIn the beginning God created the heavens and the earth. From that beginning, Scripture unfolds the story of the Creator working out His sovereign plan to redeem fallen humanity.',
    applications: [
      'God created us.',
      'God defines our purpose.',
      'Sin has consequences.',
      'God extends grace.',
      'God keeps His promises.',
      'Faith produces obedience.',
      'God remains sovereign even during suffering.',
      'God can accomplish His purposes even through difficult circumstances.',
      'God\'s plan of redemption ultimately points us to Jesus Christ.',
    ],
    mainThemes: ['Creation', 'Human dignity', 'Sin and judgment', 'Covenant promise', 'Blessing to the nations', 'Faith and obedience'],
    keyPeople: ['Adam and Eve', 'Noah', 'Abraham and Sarah', 'Isaac and Rebekah', 'Jacob and Esau', 'Joseph'],
    keyVerses: ['Genesis 1:1 (BSB) — In the beginning God created the heavens and the earth.', 'Genesis 3:15 (BSB) — The promised Seed who will crush the serpent.', 'Genesis 12:1-3 (BSB) — God\'s covenant call and blessing of Abraham.', 'Genesis 22:14 (BSB) — The LORD Will Provide, foreshadowing the sacrifice of Christ.', 'Genesis 50:20 (BSB) — God intended it for good.'],
    christConnection: 'Genesis anticipates Christ through the promised seed who will crush the serpent, the covenant blessing to all nations through Abraham, and the pattern of God preserving life through judgment as a foreshadowing of the gospel.',
  },
  {
    bookName: 'Exodus',
    author: 'Moses',
    authorDetail:
      'Jewish and Christian tradition identifies Moses as the author of Exodus and the other books of the Pentateuch.\n\nUnlike Genesis, which records events that preceded Moses\' lifetime, Exodus records events Moses himself experienced and led. He was raised in Pharaoh\'s household, fled to Midian, and was called by God at the burning bush to confront the most powerful ruler of his age.\n\nChristians have traditionally understood Moses to have written under the inspiration of God, recording the plagues, the Passover, the Red Sea crossing, the giving of the Law, and the construction of the tabernacle as an eyewitness and leader of the people he served.',
    audience:
      'Exodus was given to Israel as the redeemed and covenanted people of God. The Israelites needed to know who had delivered them, on what terms they would live as God\'s people, and how the holy God would dwell in their midst.\n\nThe book taught Israel that their identity was rooted not in Egypt or in their own strength, but in the redeeming acts of the LORD, who heard their cry, remembered His covenant with Abraham, Isaac, and Jacob, and brought them out with a mighty hand.\n\nExodus also instructed the surrounding generations that the God of Israel is the only true God, sovereign over Pharaoh, the forces of nature, and the gods of Egypt.',
    dateWritten: 'Approx. 1446–1406 BC',
    locationWritten: 'Wilderness of Sinai',
    chapters: 40,
    purpose:
      'To record God\'s mighty deliverance of Israel from Egypt, the establishment of the Mosaic covenant, and the instructions for the tabernacle as God\'s dwelling place among His people.\n\nExodus answers three great questions: Who is the God who redeems? How does He constitute His people? And how does the holy God dwell among an imperfect people? The book shows that redemption comes first, and covenant relationship and worship follow from it.',
    keyTheme: 'Redemption, covenant, law, and the presence of God',
    summary:
      'Exodus opens with Israel enslaved and oppressed in Egypt, their cries rising to God under harsh bondage. God raised up Moses to confront Pharaoh and to lead His people out. The book records God\'s self-revelation to Moses at the burning bush:\n\nExodus 3:14 (BSB)\nGod said to Moses, "I AM WHO I AM." And He said, "You shall say to the children of Israel, \'I AM has sent me to you.\'"\n\nThrough a series of ten plagues, God judged Egypt and its gods, culminating in the Passover, when the blood of the lamb spared Israel from the destroyer. Pharaoh finally released the people, only to pursue them to the Red Sea, where God parted the waters and drowned the Egyptian army.\n\nExodus 14:14 (BSB)\nThe LORD will fight for you; you need only to be still.\n\nIn the wilderness, God provided manna from heaven, water from the rock, and guidance by cloud and fire. At Mount Sinai, He entered covenant with Israel, giving the Ten Commandments and the Book of the Covenant. Even as the covenant was being established, Israel made the golden calf, revealing the depth of their need for atonement and for a mediator.\n\nThe final third of the book records God\'s gracious solution: the tabernacle, with its sacrifices, priesthood, and the mercy seat, so that the holy God could dwell in the midst of His people. Exodus ends with the glory of the LORD filling the completed tabernacle.',
    keyScripture: [
      { reference: 'Exodus 3:14 (BSB)', text: 'God said to Moses, "I AM WHO I AM." And He said, "You shall say to the children of Israel, \'I AM has sent me to you.\'"' },
      { reference: 'Exodus 14:14 (BSB)', text: 'The LORD will fight for you; you need only to be still.' },
      { reference: 'Exodus 20:2-3 (BSB)', text: 'I am the LORD your God, who brought you out of the land of Egypt, out of the house of slavery. You shall have no other gods before Me.' },
    ],
    background:
      'Exodus continues the story that Genesis began. After Joseph\'s death, the family of Israel multiplied in Egypt until a new Pharaoh, who did not know Joseph, enslaved them. The book covers roughly 430 years of sojourn in Egypt and about eighty years of the life of Moses, then the exodus and the year at Sinai.\n\nThe book can broadly be divided into three major sections:\n\nExodus 1–18 — Redemption from Egypt\nThese chapters describe Israel\'s oppression, Moses\' birth and call, the ten plagues, the Passover, the crossing of the Red Sea, and the journey to Sinai. They answer the question: how did God make Israel His people?\n\nExodus 19–24 — The Covenant at Sinai\nGod constituted Israel as His covenant nation, giving the Ten Commandments and the Book of the Covenant. He called His people to be a kingdom of priests and a holy nation.\n\nExodus 25–40 — The Tabernacle and the Presence of God\nGod gave detailed instructions for the tabernacle, the priesthood, and worship, so that He could dwell among His people. The book concludes with the glory of the LORD filling the tabernacle.\n\nExodus is therefore the theological foundation for the rest of the Old Testament: the God who redeems is also the God who commands, and the God who commands is also the God who provides the way for His people to dwell with Him.',
    structure: [
      { range: '1–4', title: 'Oppression in Egypt and the birth and call of Moses' },
      { range: '5–11', title: 'Moses and Pharaoh: the plagues' },
      { range: '12–18', title: 'The Passover, the exodus, and the journey to Sinai' },
      { range: '19–24', title: 'The covenant at Sinai and the Law' },
      { range: '25–40', title: 'The tabernacle, the priesthood, and the glory of God' },
    ],
    lessons:
      'Exodus teaches us that God sees the suffering of His people and hears their cries. The LORD is not distant or indifferent; He remembers His covenant and acts in history to deliver.\n\nThe book also reveals that redemption comes first and obedience follows. God saved Israel before He gave them the Law. Grace establishes the relationship; the commands shape the life of the redeemed.\n\nExodus teaches the holiness of God. The golden calf, the repeated warnings, and the careful instructions for the tabernacle all show that the holy God must be approached on His own terms, through the way He provides.\n\nThe book also demonstrates God\'s patient provision. Manna each morning, water from the rock, cloud by day and fire by night — God sustained His people every step of the wilderness journey.\n\nMost of all, Exodus shows that the goal of redemption is not merely freedom from slavery but the presence of God. The exodus ends not at the edge of the wilderness but in the tabernacle, with the glory of the LORD filling His dwelling place among His people.\n\nThe same pattern holds for believers today: God redeems us, gives us His Word, and dwells with us by His Spirit, and our whole lives are a response to His saving grace.',
    applications: [
      'God sees the suffering of His people and hears their cries.',
      'Redemption comes first; obedience flows from grace.',
      'The holy God must be approached on His own terms.',
      'God provides daily bread for the journey of faith.',
      'The presence of God, not merely freedom, is the goal of salvation.',
      'God is sovereign over rulers, powers, and the forces of nature.',
      'Worship is the fitting response of a redeemed people.',
      'God remembers His covenant promises even in the darkest seasons.',
    ],
    mainThemes: ['Divine deliverance', 'Covenant establishment', 'The Law', 'Divine presence', 'Worship and priesthood', 'God\'s faithfulness'],
    keyPeople: ['Moses', 'Aaron', 'Miriam', 'Pharaoh', 'Joshua', 'Shiphrah and Puah', 'Jethro'],
    keyVerses: [
      'Exodus 3:14 (BSB) — "I AM WHO I AM" — God\'s covenant name revealed.',
      'Exodus 12:13 (BSB) — The blood of the Passover lamb protects from judgment.',
      'Exodus 14:14 (BSB) — The LORD will fight for you; you need only to be still.',
      'Exodus 20:2-3 (BSB) — The preamble and first command of the Decalogue.',
      'Exodus 34:6-7 (BSB) — The LORD, the compassionate and gracious God, slow to anger, abounding in loving devotion.',
    ],
    christConnection: 'Exodus foreshadows Christ through the Passover lamb, whose blood spares from judgment (1 Corinthians 5:7); the bread from heaven, which Jesus identifies as Himself (John 6); the rock that gave water, which Paul identifies as Christ (1 Corinthians 10:4); the intercessory role of Moses; and the tabernacle, where God dwelt among His people — all fulfilled in Jesus, who tabernacled among us and whose glory we behold (John 1:14).',
  },
  {
    bookName: 'Leviticus',
    author: 'Moses',
    authorDetail:
      'Jewish and Christian tradition identifies Moses as the author of Leviticus and the other books of the Pentateuch.\n\nLeviticus was given at Mount Sinai as part of the covenant law delivered to Israel through Moses. It records the instructions God gave for worship, sacrifice, and holiness, addressed especially to Aaron and his sons, the priests who would mediate between God and the people.\n\nBecause the book concerns the worship of the tabernacle, which Moses himself oversaw the construction of, he is understood to have written it under divine inspiration as the divinely appointed mediator of the covenant.',
    audience:
      'Leviticus was given primarily to the priests and the people of Israel as the manual for worship and holy living. The priests needed to know how to offer the sacrifices, distinguish between clean and unclean, and guard the holiness of the sanctuary.\n\nThe people needed to know how to approach God, how to be restored after sin, and how to live as a distinct people set apart to the LORD.\n\nLeviticus taught Israel that every area of life — worship, diet, relationships, sexuality, economics, and even the treatment of the poor — was to reflect the holiness of the God who dwelt in their midst.',
    dateWritten: 'Approx. 1446–1406 BC',
    locationWritten: 'Wilderness of Sinai',
    chapters: 27,
    purpose:
      'To instruct Israel in holiness, worship, and fellowship with God through the sacrificial system and priestly mediation.\n\nLeviticus answers a pressing question left by Exodus: how can a holy God dwell among a sinful people? The answer unfolds through the offerings, the priesthood, the laws of purity, and especially the Day of Atonement, which together make continued fellowship with God possible.',
    keyTheme: 'Holiness, atonement, worship, and obedience',
    summary:
      'Leviticus is the manual for Israel\'s worship life, given at the foot of Mount Sinai as God prepared to dwell among His people. The book opens with the five main offerings — the burnt, grain, peace, sin, and guilt offerings — each teaching something about how sin is atoned for and how fellowship with God is restored.\n\nThe consecration of Aaron and his sons established the priesthood, and the sober account of Nadab and Abihu, who offered unauthorized fire before the LORD, showed that worship must be offered on God\'s terms.\n\nThe central chapter of the book is the Day of Atonement, when the high priest entered the Most Holy Place to make atonement for the sins of the whole nation:\n\nLeviticus 16:30 (BSB)\nFor on this day atonement will be made for you to cleanse you, and you will be clean from all your sins in the presence of the LORD.\n\nChapters 17–27 apply holiness to everyday life. The holiness code reaches its most famous command:\n\nLeviticus 19:18 (BSB)\nDo not seek revenge or bear a grudge against any of your people, but love your neighbor as yourself. I am the LORD.\n\nThe repeated refrain "Be holy, because I am holy" (Leviticus 11:44; 19:2; 20:26) summarizes the whole book: God\'s people are called to reflect the character of the God they worship in every area of life.',
    keyScripture: [
      { reference: 'Leviticus 19:2 (BSB)', text: 'Speak to the whole congregation of Israel and tell them: Be holy because I, the LORD your God, am holy.' },
      { reference: 'Leviticus 19:18 (BSB)', text: 'Do not seek revenge or bear a grudge against any of your people, but love your neighbor as yourself. I am the LORD.' },
      { reference: 'Leviticus 17:11 (BSB)', text: 'For the life of the flesh is in the blood, and I have given it to you to make atonement for your souls upon the altar; for it is the blood that makes atonement for the soul.' },
    ],
    background:
      'Leviticus continues directly from Exodus. The tabernacle has been built and the glory of the LORD has filled it; now God speaks from the tent of meeting to give His people the instructions for living in His presence. The entire book takes place at Mount Sinai over roughly a month, before Israel departed for the Promised Land.\n\nThe book can broadly be divided into two major sections:\n\nLeviticus 1–16 — The Way to God: Sacrifice and Atonement\nThese chapters describe the five offerings, the consecration of the priests, the laws of clean and unclean, and the Day of Atonement. They answer the question: how does a sinful people approach a holy God?\n\nLeviticus 17–27 — The Walk with God: Holiness in Daily Life\nThese chapters apply holiness to everyday conduct — sexual morality, justice, treatment of the poor, the feasts of the LORD, the Sabbatical and Jubilee years, and the blessings and curses that attend obedience and disobedience.\n\nLeviticus is therefore not merely a list of ancient rituals. It is the theological heart of the Pentateuch, explaining the holiness of God, the seriousness of sin, and the gracious provision God makes for His people to dwell with Him.',
    structure: [
      { range: '1–7', title: 'The five offerings' },
      { range: '8–10', title: 'The consecration of the priests' },
      { range: '11–15', title: 'Laws of purity and uncleanness' },
      { range: '16', title: 'The Day of Atonement' },
      { range: '17–27', title: 'The holiness code and the feasts of the LORD' },
    ],
    lessons:
      'Leviticus teaches first that God is holy and that His holiness is not a minor theme but the foundation of everything else. The repeated command "Be holy, because I am holy" calls God\'s people to reflect His character in every area of life.\n\nThe book also teaches the seriousness of sin. Sin is not a small thing; it disrupts relationship with God, defiles the community, and requires atonement. Yet Leviticus equally teaches the graciousness of God, who provides a way of atonement and restoration rather than leaving His people in their sin.\n\nLeviticus teaches that worship is not a casual matter. The judgment of Nadab and Abihu and the careful instructions for the sanctuary show that God is to be approached on His own terms, with reverence and obedience.\n\nThe book grounds ethics in the character of God. The commands to love your neighbor, care for the poor, deal honestly, and keep the feasts are all rooted in the repeated refrain "I am the LORD." Our treatment of others flows from our knowledge of God.\n\nFor believers today, Leviticus reveals how deep our need for atonement is — and how complete the provision of Christ must be. Every sacrifice and every feast pointed toward the once-for-all sacrifice that Jesus would offer.',
    applications: [
      'God is holy, and His people are called to be holy.',
      'Sin is serious and requires atonement.',
      'God graciously provides the way of restoration.',
      'Worship must be offered on God\'s terms, with reverence.',
      'Love your neighbor as yourself.',
      'Ethics are rooted in the character of God.',
      'Distinctiveness is part of God\'s calling on His people.',
      'The sacrificial system points to the once-for-all sacrifice of Christ.',
    ],
    mainThemes: ['Holiness of God', 'Atonement through sacrifice', 'Priestly mediation', 'Purity and cleanliness', 'Love your neighbor', 'Distinctiveness of God\'s people'],
    keyPeople: ['Moses', 'Aaron', 'Nadab and Abihu', 'Eleazar', 'Ithamar'],
    keyVerses: [
      'Leviticus 19:2 (BSB) — "Be holy because I, the LORD your God, am holy."',
      'Leviticus 17:11 (BSB) — "It is the blood that makes atonement for the soul."',
      'Leviticus 16:30 (BSB) — "On this day atonement will be made for you... you will be clean from all your sins."',
      'Leviticus 19:18 (BSB) — "Love your neighbor as yourself. I am the LORD."',
      'Leviticus 11:44 (BSB) — "Consecrate yourselves, therefore, and be holy, because I am holy."',
    ],
    christConnection: 'Leviticus points to Christ as the perfect High Priest who offers Himself as the ultimate sacrifice for sin. The sacrificial system, the priesthood, the laws of purity, and especially the Day of Atonement all find their fulfillment in Jesus\' once-for-all sacrifice (Hebrews 9–10). Jesus is the Lamb of God, our great High Priest, and the one whose blood cleanses us from all sin.',
  },
  {
    bookName: 'Numbers',
    author: 'Moses',
    authorDetail:
      'Jewish and Christian tradition identifies Moses as the author of Numbers and the other books of the Pentateuch.\n\nNumbers records events Moses himself lived through: the census at Sinai, the journey through the wilderness, the rebellion of the people, and the forty years of wandering. Moses is the central figure of the narrative and is described as writing down the stages of Israel\'s journey at the LORD\'s command (Numbers 33:2).\n\nChristians have traditionally understood Moses to have written under the inspiration of God, giving an honest account that includes his own failure and exclusion from the Promised Land.',
    audience:
      'Numbers was written to the people of Israel in the wilderness, preparing them to enter the Promised Land. The older generation that had grumbled against God was dying in the wilderness; the book was given especially to the new generation that would inherit the land.\n\nNumbers taught this generation that the LORD who had redeemed them from Egypt was faithful to guide, provide, and protect them — and that unbelief had consequences.\n\nIt also established the order of the camp, the duties of the Levites, and the boundaries of the inheritance, so that the nation would enter the land as an ordered, holy people.',
    dateWritten: 'Approx. 1446–1406 BC',
    locationWritten: 'Wilderness wanderings (Sinai to the plains of Moab)',
    chapters: 36,
    purpose:
      'To document Israel\'s journey from Mount Sinai to the edge of Canaan, demonstrating both God\'s faithfulness and the consequences of unbelief.\n\nNumbers records the transition from the generation that came out of Egypt to the generation that would enter the land, showing that God\'s purposes are not defeated by human failure — He disciplines, preserves, and prepares His people.',
    keyTheme: 'Wilderness journey, faith and unbelief, divine discipline',
    summary:
      'Numbers, whose name comes from the two censuses it records, opens with Israel at Mount Sinai preparing to enter the Promised Land. The book counts the tribes, organizes the camp, and establishes the duties of the Levites around the tabernacle.\n\nBut at Kadesh-barnea, when the twelve spies returned with their report, the people refused to trust God\'s promise. Only Joshua and Caleb urged faith. The nation\'s unbelief brought God\'s judgment: the entire adult generation would die in the wilderness, and the people would wander forty years, one year for each day the spies had explored the land.\n\nThe wilderness years were marked by both rebellion and provision. Korah led a revolt against Moses and Aaron. The people grumbled for water and meat, and God provided. When venomous snakes bit the people, God instructed Moses to lift up a bronze serpent, and whoever looked at it lived — a striking picture of salvation by faith.\n\nThe second half of the book records the journey of the new generation. Balaam, hired to curse Israel, could only bless them:\n\nNumbers 23:19 (BSB)\nGod is not a man, that He should lie, nor a son of man, that He should change His mind. Does He speak and not act? Does He promise and not fulfill?\n\nNumbers ends with the new generation encamped on the plains of Moab, poised at the Jordan, ready to enter the land under the leadership of Joshua, a man in whom was the Spirit of God.',
    keyScripture: [
      { reference: 'Numbers 6:24-26 (BSB)', text: 'The LORD bless you and keep you; the LORD make His face shine upon you and be gracious to you; the LORD lift up His countenance upon you and give you peace.' },
      { reference: 'Numbers 23:19 (BSB)', text: 'God is not a man, that He should lie, nor a son of man, that He should change His mind. Does He speak and not act? Does He promise and not fulfill?' },
    ],
    background:
      'Numbers bridges the giving of the Law at Sinai and the conquest of Canaan. It covers roughly thirty-eight to forty years, the longest period recorded in the Pentateuch, yet the narrative focuses on only two main episodes: the preparation at Sinai and the final year of the journey to Moab. The long middle years of wandering are summarized, because the wilderness years were primarily a period of judgment and the raising of a new generation.\n\nThe book can broadly be divided into two major sections:\n\nNumbers 1–14 — From Sinai to Kadesh: The Failure of the First Generation\nThese chapters record the census, the organization of the camp, the departure from Sinai, and the tragedy of Kadesh-barnea, where unbelief cost the generation their inheritance.\n\nNumbers 15–36 — From Kadesh to Moab: The Preparation of the New Generation\nThese chapters record the wanderings, the rebellion of Korah, the death of Aaron, the bronze serpent, the blessings of Balaam, the second census, and the appointment of Joshua. The book ends with the new generation ready to enter the land.\n\nNumbers therefore shows both sides of God\'s character: He is faithful to His promises and holy in His judgments, disciplining His people so that a new generation may inherit what the old generation forfeited by unbelief.',
    structure: [
      { range: '1–4', title: 'The first census and the order of the camp' },
      { range: '5–10', title: 'Laws of purity and the departure from Sinai' },
      { range: '11–14', title: 'Grumbling, the spies, and the judgment at Kadesh' },
      { range: '15–21', title: 'The years of wandering and rebellion' },
      { range: '22–36', title: 'Balaam, the second census, and preparation to enter the land' },
    ],
    lessons:
      'Numbers teaches the high cost of unbelief. The generation that saw the plagues, crossed the Red Sea, and ate manna from heaven still refused to trust God at Kadesh-barnea — and forfeited the inheritance. The warning is sobering: unbelief, not difficulty, kept them out of the land.\n\nThe book also teaches the faithfulness of God. Despite the people\'s repeated rebellion, God never abandoned them. He disciplined them, but He also provided water, manna, and protection, and He preserved a new generation to inherit the promise.\n\nNumbers teaches that God\'s purposes are not defeated by human failure. Korah\'s rebellion was judged, Balaam\'s curses became blessings, and even Moses\' failure at Meribah did not derail God\'s plan — Joshua, a man filled with the Spirit, would lead the people in.\n\nThe book also models faithful leadership. Joshua and Caleb stand out as men who followed the LORD wholeheartedly, willing to stand against the majority. Their courage, grounded in trust in God\'s promise, is held up as the pattern for God\'s people.\n\nFor believers today, Numbers is a call to trust God\'s promises rather than be ruled by fear, and a reminder that God is both faithful to His word and holy in His ways.',
    applications: [
      'Unbelief, not circumstance, keeps us from God\'s promises.',
      'God is faithful even when His people are not.',
      'God\'s purposes are not defeated by human failure.',
      'Follow the LORD wholeheartedly, as Joshua and Caleb did.',
      'God provides for His people in the wilderness.',
      'Divine discipline is an expression of covenant love.',
      'A new generation can inherit what unbelief forfeited.',
      'Salvation comes by looking to the provision God lifts up.',
    ],
    mainThemes: ['Faith versus unbelief', 'God\'s guidance', 'Leadership and rebellion', 'Divine discipline', 'Preparation for inheritance', 'God\'s provision in the wilderness'],
    keyPeople: ['Moses', 'Aaron', 'Miriam', 'Joshua', 'Caleb', 'Korah', 'Balaam'],
    keyVerses: [
      'Numbers 6:24-26 (BSB) — The Aaronic blessing of peace.',
      'Numbers 14:8-9 (BSB) — "Do not be afraid... The LORD is with us."',
      'Numbers 21:8-9 (BSB) — The bronze serpent lifted up for healing.',
      'Numbers 23:19 (BSB) — "God is not a man, that He should lie... Does He promise and not fulfill?"',
      'Numbers 27:18 (BSB) — Joshua, a man in whom is the Spirit, appointed to lead.',
    ],
    christConnection: 'Numbers prefigures Christ through the bronze serpent lifted up for healing, which Jesus explicitly identifies as a picture of His own lifting up on the cross (John 3:14-15); the rock that gave water in the wilderness, which Paul identifies as Christ (1 Corinthians 10:4); the manna from heaven, which Jesus surpasses as the true bread of life (John 6); and Joshua — whose name is the Hebrew form of Jesus — who leads God\'s people into their inheritance and rest.',
  },
  {
    bookName: 'Deuteronomy',
    author: 'Moses',
    authorDetail:
      'Jewish and Christian tradition identifies Moses as the author of Deuteronomy and the other books of the Pentateuch.\n\nDeuteronomy consists of Moses\' farewell addresses to Israel, delivered on the plains of Moab as the nation prepared to cross the Jordan without him. The name Deuteronomy means "second law," because the book restates and expands the covenant law given at Sinai for the new generation.\n\nThe book closes with an account of Moses\' death on Mount Nebo, written as a tribute to the man of God, and is understood by Christians to have been completed under divine inspiration.\n\nDeuteronomy\'s structure mirrors ancient covenant treaties: a preamble, a historical prologue, covenant stipulations, blessings and curses, and witnesses — which is why it is often called the covenant book of the Old Testament.',
    audience:
      'Deuteronomy was addressed to the new generation of Israel — those who had been children when the exodus occurred and who would now enter the Promised Land. The generation that had refused to trust God at Kadesh-barnea had died in the wilderness; Moses now spoke to their sons and daughters.\n\nMoses preached the covenant to this generation so that they would love the LORD, obey His commands, and teach them to their children. The book repeatedly calls Israel to remember what God had done, to choose life, and to pass the faith on to the next generation.\n\nDeuteronomy\'s commands about teaching children, writing the Law, and renewing the covenant at Shechem show that the book was intended to shape the identity of the nation for generations to come.',
    dateWritten: 'Approx. 1406 BC',
    locationWritten: 'Plains of Moab, east of the Jordan',
    chapters: 34,
    purpose:
      'To rehearse God\'s covenant with the new generation, renew their commitment, and call them to love and obey God wholeheartedly in the land they are about to possess.\n\nDeuteronomy is Moses\' final sermon to Israel: a review of God\'s faithfulness, a restatement of the covenant law, and a summons to love the LORD with all the heart, soul, and strength — and to teach that love to the next generation.',
    keyTheme: 'Covenant renewal, love, obedience, and blessing',
    summary:
      'Deuteronomy records Moses\' farewell addresses to Israel on the plains of Moab, as the nation prepared to enter the land he would not enter with them. Moses reviewed the forty years in the wilderness, restated the Ten Commandments, and expanded the covenant law for life in the land.\n\nAt the heart of the book stands the great commandment that Jesus called the first and greatest of all:\n\nDeuteronomy 6:4-5 (BSB)\nHear, O Israel: The LORD our God, the LORD is One. Love the LORD your God with all your heart and with all your soul and with all your strength.\n\nMoses urged the people to teach these words diligently to their children, to bind them as a sign on their hands and foreheads, and to write them on the doorposts of their houses.\n\nThe book sets before Israel a choice between blessing and curse, life and death. Moses summoned them:\n\nDeuteronomy 30:19-20 (BSB)\nI call heaven and earth as witnesses against you today, that I have set before you life and death, blessing and curse. Therefore choose life, so that you and your descendants may live, and that you may love the LORD your God, obey Him, and hold fast to Him.\n\nDeuteronomy also contains one of the great prophecies of the coming Messiah:\n\nDeuteronomy 18:15 (BSB)\nThe LORD your God will raise up for you a prophet like me from among your brothers. You must listen to him.\n\nThe book ends with Moses viewing the Promised Land from Mount Nebo, blessing the tribes, and dying in the land of Moab — while Joshua, filled with the spirit of wisdom, prepared to lead the people in.',
    keyScripture: [
      { reference: 'Deuteronomy 6:4-5 (BSB)', text: 'Hear, O Israel: The LORD our God, the LORD is One. Love the LORD your God with all your heart and with all your soul and with all your strength.' },
      { reference: 'Deuteronomy 18:15 (BSB)', text: 'The LORD your God will raise up for you a prophet like me from among your brothers. You must listen to him.' },
      { reference: 'Deuteronomy 30:19-20 (BSB)', text: 'I call heaven and earth as witnesses against you today, that I have set before you life and death, blessing and curse. Therefore choose life, so that you and your descendants may live.' },
    ],
    background:
      'Deuteronomy is the final book of the Pentateuch and the bridge between the wilderness and the land. Its setting is the plains of Moab, east of the Jordan, in the fortieth year after the exodus, as the new generation prepared to cross into Canaan under Joshua.\n\nThe book takes the form of three addresses by Moses:\n\nDeuteronomy 1–4 — The First Address: Review\nMoses rehearsed the wilderness journey from Sinai to Moab, reminding Israel of God\'s faithfulness and of the judgment that fell on the unbelieving generation, and calling the new generation to obedience.\n\nDeuteronomy 5–26 — The Second Address: The Covenant Law\nMoses restated the Ten Commandments and expanded the covenant law for life in the land — worship, leadership, justice, marriage, economics, and warfare — grounding every command in the love of God.\n\nDeuteronomy 27–34 — The Third Address: Blessing and Curse\nMoses set the covenant blessings and curses before the people, renewed the covenant, commissioned Joshua, and closed with his song, his blessing of the tribes, and his death on Mount Nebo.\n\nDeuteronomy is therefore the covenant document of the Old Testament: it calls God\'s people to love, obey, and remember, and it looks forward to the day when God would raise up a prophet like Moses and write His law on human hearts.',
    structure: [
      { range: '1–4', title: 'Moses\' first address: reviewing the wilderness journey' },
      { range: '5–26', title: 'Moses\' second address: the covenant law restated' },
      { range: '27–30', title: 'Blessings and curses: the choice set before Israel' },
      { range: '31–34', title: 'Moses\' final words, his death, and the commissioning of Joshua' },
    ],
    lessons:
      'Deuteronomy teaches that love for God is the heart of obedience. The commandments are not a burdensome list to be kept out of fear; they are the shape of a life that loves the LORD with all the heart, soul, and strength. Jesus Himself identified this as the greatest commandment.\n\nThe book teaches the importance of remembering. Moses repeatedly told Israel to remember what God had done — the exodus, the wilderness, the provision, the discipline — because forgetfulness is the root of unfaithfulness.\n\nDeuteronomy teaches the duty of passing faith to the next generation. The commands to teach children diligently, to talk of God\'s words at home and on the road, and to write them on doorposts show that faith is meant to be lived and transmitted in ordinary life.\n\nThe book also teaches that obedience and blessing are linked. Israel was set before a choice: life and blessing, or death and curse. God\'s commands were given for their good, "so that you and your descendants may live."\n\nMost of all, Deuteronomy teaches the grace behind the law. Israel\'s obedience was to flow from the redemption God had already accomplished — He had brought them out of Egypt first, and the commands were the response of a redeemed people. The same pattern stands for believers: grace first, then grateful obedience.',
    applications: [
      'Love the LORD your God with all your heart, soul, and strength.',
      'Remember what God has done; forgetfulness breeds unfaithfulness.',
      'Teach the faith diligently to the next generation.',
      'Choose life: obedience to God is for our good.',
      'Let grace come first; let obedience flow from gratitude.',
      'God\'s commands are not burdens but the path of blessing.',
      'Hold fast to the LORD; He is your life.',
      'Hear the prophet God raises up — and listen to Him.',
    ],
    mainThemes: ['The love of God', 'Covenant faithfulness', 'Obedience and blessing', 'Choice and consequences', 'Teaching the next generation', 'The centrality of God\'s Word'],
    keyPeople: ['Moses', 'Joshua', 'Caleb', 'Eleazar the priest', 'The Levites'],
    keyVerses: [
      'Deuteronomy 6:4-5 (BSB) — The Shema: "Hear, O Israel... Love the LORD your God."',
      'Deuteronomy 18:15 (BSB) — "The LORD your God will raise up for you a prophet like me."',
      'Deuteronomy 30:19-20 (BSB) — "I have set before you life and death... choose life."',
      'Deuteronomy 32:4 (BSB) — "The Rock! His work is perfect, for all His ways are just."',
      'Deuteronomy 34:10 (BSB) — "No prophet has arisen in Israel like Moses."',
    ],
    christConnection: 'Deuteronomy points to Christ as the greater Prophet like Moses (18:15-19), whom Peter and Stephen identified as Jesus (Acts 3:22; 7:37); the perfect Son who obeys where Israel failed; the one who takes the curse of the Law upon Himself (Galatians 3:13); and the fulfillment of the new covenant in which God writes His law on human hearts (Jeremiah 31, Hebrews 8). Jesus quoted Deuteronomy extensively during His temptation in the wilderness.',
  },
  {
    bookName: 'Joshua',
    author: 'Joshua, with later editorial additions',
    authorDetail:
      'The book of Joshua is attributed to Joshua himself, the servant of Moses and Israel\'s commander during the conquest, with later editorial additions by priests or scribes.\n\nJoshua was one of the two faithful spies who urged Israel to trust God at Kadesh-barnea, and he had served at Moses\' side for forty years in the wilderness. The book records that Joshua wrote the covenant words "in the book of the Law of God" at Shechem (Joshua 24:26).\n\nThe account of Joshua\'s death and the references to events after him (such as the burial of Joseph\'s bones and the service of the elders who outlived him) indicate that the book received final editorial touches after Joshua\'s lifetime.',
    audience:
      'Joshua was written to Israel as they settled in the Promised Land, to establish that the conquest and division of Canaan were the fulfillment of God\'s covenant promises to Abraham.\n\nThe book taught the tribes that the land was a gift from the LORD — won not by their own strength but by His power — and that continued possession of the land depended on continued faithfulness to the covenant.\n\nIt also provided a permanent record of the tribal inheritances and the boundaries of the land, so that each family could know its portion of the promise.',
    dateWritten: 'Approx. 1400–1370 BC',
    locationWritten: 'Canaan',
    chapters: 24,
    purpose:
      'To record the conquest and division of the Promised Land as the fulfillment of God\'s covenant promises to the patriarchs.\n\nJoshua demonstrates that God keeps His word: the land promised to Abraham centuries earlier was given to his descendants. The book also shows that success in the conquest came through obedience to God\'s commands and trust in His promises, and it calls the nation to covenant faithfulness.',
    keyTheme: 'Faith, conquest, inheritance, and covenant faithfulness',
    summary:
      'Joshua opens with the LORD commissioning Joshua after the death of Moses, with a charge that has encouraged believers ever since:\n\nJoshua 1:9 (BSB)\nHave I not commanded you to be strong and courageous? Do not be afraid; do not be discouraged, for the LORD your God is with you wherever you go.\n\nUnder Joshua\'s leadership, Israel crossed the Jordan on dry ground, as God had parted the Red Sea for the previous generation. At Jericho, the walls fell after the people marched around the city in obedience — and Rahab, who had hidden the spies and trusted the God of Israel, was spared with her family.\n\nAfter the defeat at Ai, caused by Achan\'s sin, Israel learned that the presence of God could not be taken for granted in the midst of disobedience. Once the sin was dealt with, the conquest continued through the campaigns of the south and the north.\n\nThe second half of the book records the division of the land among the twelve tribes, the cities of refuge, and the Levitical cities. The book closes with Joshua\'s farewell address and his famous challenge to the nation at Shechem:\n\nJoshua 24:15 (BSB)\nBut if it is unpleasing in your sight to serve the LORD, then choose for yourselves this day whom you will serve... But as for me and my house, we will serve the LORD.\n\nJoshua records the summary of the whole book: "Not one of all the LORD\'s good promises to the house of Israel failed; everything was fulfilled" (Joshua 21:45).',
    keyScripture: [
      { reference: 'Joshua 1:9 (BSB)', text: 'Have I not commanded you to be strong and courageous? Do not be afraid; do not be discouraged, for the LORD your God is with you wherever you go.' },
      { reference: 'Joshua 21:45 (BSB)', text: 'Not one of all the LORD\'s good promises to the house of Israel failed; everything was fulfilled.' },
      { reference: 'Joshua 24:15 (BSB)', text: 'But as for me and my house, we will serve the LORD.' },
    ],
    background:
      'Joshua continues the story of Deuteronomy and covers about twenty-five years, from Israel\'s entry into Canaan to Joshua\'s death. It records the fulfillment of the promise made to Abraham that his descendants would possess the land (Genesis 15:18-21).\n\nThe book can broadly be divided into three major sections:\n\nJoshua 1–5 — Entering the Land\nIsrael crossed the Jordan, renewed the covenant by circumcision, and celebrated the Passover at Gilgal — the manna ceased the day they ate the produce of the land.\n\nJoshua 6–12 — The Conquest of the Land\nThe fall of Jericho, the defeat at Ai and Achan\'s sin, the treaty with Gibeon, and the southern and northern campaigns brought the major powers of Canaan under Israel\'s control.\n\nJoshua 13–24 — The Division of the Land and the Renewal of the Covenant\nThe inheritances of the tribes were allotted by lot, the cities of refuge were established, and Joshua renewed the covenant at Shechem, where the people declared, "We will serve the LORD our God and obey Him."\n\nJoshua is therefore the book of God\'s faithfulness: what He promised, He performed, and the land became the inheritance of His people.',
    structure: [
      { range: '1–5', title: 'Entering the land: the Jordan crossing and covenant renewal' },
      { range: '6–12', title: 'The conquest: Jericho, Ai, and the campaigns' },
      { range: '13–21', title: 'The division of the land among the tribes' },
      { range: '22–24', title: 'Covenant renewal and Joshua\'s farewell' },
    ],
    lessons:
      'Joshua teaches that God keeps His promises. The land was promised to Abraham centuries before it was possessed; the book\'s summary verse declares that not one of the LORD\'s good promises failed. What God has promised, God performs.\n\nThe book teaches that courage is rooted in the presence of God. "Be strong and courageous" is not a command to self-reliance; it is grounded in the promise, "the LORD your God is with you wherever you go." Strength flows from presence.\n\nJoshua teaches that obedience precedes victory. Jericho fell because Israel obeyed — even instructions that seemed strange. Ai was lost because of hidden sin in the camp. Obedience opens the door to God\'s power; unconfessed sin closes it.\n\nThe book also teaches the danger of presumption. After the victory at Jericho, Israel assumed Ai would fall easily, without seeking the LORD — and they were defeated. Every battle required dependence on God.\n\nFinally, Joshua teaches that faith is a choice that must be renewed. "Choose for yourselves this day whom you will serve" remains the standing challenge to every generation of God\'s people.',
    applications: [
      'Be strong and courageous, for the LORD your God is with you.',
      'Trust that God keeps every one of His promises.',
      'Obey God\'s instructions, even when they seem strange.',
      'Deal with sin decisively; hidden sin robs victory.',
      'Never presume on past victories; seek the LORD daily.',
      'Claim the inheritance God has given you.',
      'Renew your commitment: choose this day whom you will serve.',
      'God\'s grace reaches outsiders who trust Him, like Rahab.',
    ],
    mainThemes: ['Courage and faith', 'God\'s faithfulness to promises', 'Holy war and judgment', 'Inheritance and rest', 'Covenant loyalty', 'Leadership transition'],
    keyPeople: ['Joshua', 'Rahab', 'Caleb', 'Achan', 'Phinehas', 'The elders of Israel'],
    keyVerses: [
      'Joshua 1:8-9 (BSB) — Meditate on the Law; be strong and courageous.',
      'Joshua 21:45 (BSB) — "Not one of all the LORD\'s good promises... failed."',
      'Joshua 24:15 (BSB) — "As for me and my house, we will serve the LORD."',
      'Joshua 5:13-15 (BSB) — Joshua meets the Commander of the LORD\'s army.',
      'Joshua 2:11 (BSB) — Rahab: "The LORD your God is God in heaven above and on earth below."',
    ],
    christConnection: 'Joshua points to Christ as the greater Joshua — Yeshua, the same name as Jesus — who leads God\'s people into true rest (Hebrews 4:8-9). The conquest of Canaan foreshadows the victory of Christ over sin and death, won not by human strength but by the power of God. Rahab\'s inclusion in the genealogy of Jesus (Matthew 1:5) shows that God\'s grace reaches Gentiles and outcasts, and the Commander of the LORD\'s army who appeared to Joshua is understood as a pre-incarnate appearance of the Son of God.',
  },
  {
    bookName: 'Judges',
    author: 'Unknown, traditionally attributed to Samuel',
    authorDetail:
      'The author of Judges is unknown. Jewish tradition attributes the book to the prophet Samuel, the last of the judges, who could have written or compiled it from earlier sources.\n\nThe book itself draws on the records of the individual judges and on the period\'s oral traditions, and its repeated refrain "In those days there was no king in Israel" suggests it was compiled during the early monarchy, looking back on the chaos of the judges era.\n\nThe mention of the Jebusites still dwelling in Jerusalem (Judges 1:21) and other details indicate the book reached its final form after David captured the city, while the earlier material preserves the authentic witness of the period.',
    audience:
      'Judges was written to Israel during the turbulent centuries between Joshua\'s death and the rise of the monarchy, and later to every generation of God\'s people.\n\nThe book taught Israel that the cycle of apostasy, oppression, and deliverance was rooted in covenant unfaithfulness: when the people abandoned the LORD, they lost His protection; when they cried out, He raised up deliverers.\n\nJudges also exposed the spiritual chaos that results when "everyone did what was right in his own eyes," demonstrating the deep need for a righteous king — and ultimately pointing to the need for a perfect King.',
    dateWritten: 'Approx. 1050–1000 BC',
    locationWritten: 'Canaan',
    chapters: 21,
    purpose:
      'To demonstrate the consequences of Israel\'s cycle of apostasy and the need for righteous leadership.\n\nJudges documents the downward spiral of Israel during the period of the judges — the repeated pattern of sin, oppression, crying out, and deliverance — and shows that the nation\'s deepest need was not merely a stronger judge but a righteous king, pointing forward to the monarchy and ultimately to the Messiah.',
    keyTheme: 'Cycles of sin, judgment, repentance, and deliverance',
    summary:
      'Judges covers the turbulent period between Joshua\'s death and the rise of the monarchy, roughly three hundred years in which Israel repeatedly fell into idolatry, suffered oppression, cried out to God, and received deliverance.\n\nThe book is structured around a tragic cycle: Israel did evil in the eyes of the LORD; God gave them into the hands of their enemies; the people cried out in their distress; and God raised up judges who delivered them. But as soon as the judge died, the people returned to their corrupt ways.\n\nThe book introduces a series of deliverers, each weaker and more flawed than the last: Othniel, Ehud, Deborah and Barak, Gideon, Jephthah, and finally Samson, whose strength was matched by his moral failure.\n\nJudges also exposes the deep spiritual decay of the age. The story of Micah\'s household gods, the corruption of the Levite, and the atrocity at Gibeah against the concubine illustrate how far the nation had fallen.\n\nThe book\'s grim refrain summarizes its message:\n\nJudges 21:25 (BSB)\nIn those days there was no king in Israel; everyone did what was right in his own eyes.\n\nYet even in the darkest chapters, the book shows God\'s mercy. When the people cried out, He raised up deliverers again and again, and the book closes with the hope that a king would one day come to give Israel the leadership they lacked.',
    keyScripture: [
      { reference: 'Judges 2:16 (BSB)', text: 'Then the LORD raised up judges, who saved them from the hands of those who plundered them.' },
      { reference: 'Judges 21:25 (BSB)', text: 'In those days there was no king in Israel; everyone did what was right in his own eyes.' },
    ],
    background:
      'Judges continues the story of Joshua and covers the centuries between the settlement of Canaan and the anointing of Israel\'s first king. The period was marked by the incomplete conquest: the tribes failed to drive out all the inhabitants of the land, and the surviving Canaanite nations became a snare to Israel, leading them into idolatry.\n\nThe book can broadly be divided into three major sections:\n\nJudges 1–2 — The Setting: Incomplete Conquest and the Cycle Begins\nThese chapters record the tribes\' failure to complete the conquest, God\'s announcement of judgment, and the introduction of the cycle of apostasy and deliverance.\n\nJudges 3–16 — The Judges: Cycles of Deliverance\nThese chapters tell the stories of the major judges — Othniel, Ehud, Deborah and Barak, Gideon, Abimelech, Jephthah, and Samson — each following the same tragic pattern of sin, oppression, crying out, and deliverance.\n\nJudges 17–21 — The Chaos: Everyone Did What Was Right in His Own Eyes\nThese closing chapters record the religious corruption of Micah and the Levite, and the civil war against the tribe of Benjamin — vivid demonstrations of the moral chaos that follows when Israel has no king and abandons God\'s covenant.\n\nJudges is therefore a history of failure that points to the need for redemption: the cycle of sin and deliverance could not save Israel, only a righteous King could.',
    structure: [
      { range: '1–2', title: 'The incomplete conquest and the beginning of the cycle' },
      { range: '3–16', title: 'The judges: cycles of sin, oppression, and deliverance' },
      { range: '17–21', title: 'The moral chaos of the age: "everyone did what was right in his own eyes"' },
    ],
    lessons:
      'Judges teaches the devastating consequences of covenant unfaithfulness. The cycle is relentless: when Israel abandoned the LORD, they lost His protection; when they served other gods, they suffered the oppression of foreign powers. Sin always has consequences.\n\nThe book also teaches the mercy of God. Again and again, when the people cried out in their distress, God raised up deliverers. His patience and compassion are displayed even in the darkest periods of Israel\'s history.\n\nJudges teaches that the source of victory is the LORD, not human strength. Gideon\'s army was reduced to three hundred men so that Israel would know that salvation was from God. Samson\'s strength was a gift of the Spirit, and his story warns that God\'s gifts can be squandered by moral compromise.\n\nThe book demonstrates the danger of doing what is right in one\'s own eyes. Without a standard beyond personal preference — without the Word of God and godly leadership — individuals and nations spiral into chaos.\n\nMost of all, Judges reveals the depth of humanity\'s need for a righteous King. The flawed judges, the tragic cycle, and the closing refrain all cry out for a deliverer who would not fail — the longing that God answered in His Son.',
    applications: [
      'Sin against God always carries consequences.',
      'Cry out to God in distress; He is merciful to hear.',
      'Victory comes from the LORD, not from human strength.',
      'Do not squander God\'s gifts through moral compromise.',
      'Live by God\'s Word, not by what seems right in your own eyes.',
      'Drift is gradual: small compromises lead to deep apostasy.',
      'God can raise up deliverers from the most unlikely people.',
      'Human leadership will always fail; we need a perfect King.',
    ],
    mainThemes: ['Sin and its consequences', 'God\'s mercy and deliverance', 'The need for leadership', 'Human depravity', 'Covenant unfaithfulness', 'God\'s sovereignty over history'],
    keyPeople: ['Othniel', 'Ehud', 'Deborah and Barak', 'Gideon', 'Jephthah', 'Samson', 'Samuel (the last judge)'],
    keyVerses: [
      'Judges 2:16 (BSB) — "Then the LORD raised up judges, who saved them."',
      'Judges 6:12 (BSB) — "The LORD is with you, mighty warrior."',
      'Judges 7:2 (BSB) — God reduces Gideon\'s army so Israel knows salvation is from Him.',
      'Judges 21:25 (BSB) — "Everyone did what was right in his own eyes."',
      'Judges 13:5 (BSB) — The birth of Samson, set apart to begin delivering Israel.',
    ],
    christConnection: 'Judges reveals humanity\'s desperate need for a perfect King. The flawed judges — each a partial, failing deliverer — and the book\'s refrain of moral chaos point to the need for Christ, the righteous Judge and perfect King who breaks the cycle of sin permanently. The author of Hebrews lists several judges among the heroes of faith (Hebrews 11:32), and the Deliverer Israel longed for finds His fulfillment in Jesus, who saves His people from their sins.',
  },
  {
    bookName: 'Ruth',
    author: 'Unknown, traditionally attributed to Samuel',
    authorDetail:
      'The author of Ruth is unknown. Jewish tradition attributes the book to the prophet Samuel, while many scholars suggest it was written during the reign of David or Solomon.\n\nThe book opens by placing its story "in the days when the judges ruled" (Ruth 1:1), yet it reads like a deliberate contrast to the moral chaos of that era — a story of loyalty, kindness, and covenant faithfulness in a time when "everyone did what was right in his own eyes."\n\nThe genealogy at the end, which traces the line from Perez to David, indicates the book was written no earlier than David\'s reign and was designed to show how God preserved the family line that would produce Israel\'s greatest king.',
    audience:
      'Ruth was written to Israel to demonstrate God\'s providence, His loyalty to His covenant, and His grace to outsiders.\n\nIn a book set during the dark period of the judges, Ruth shines as a story of hesed — loyal, covenant love — shown by a Moabite woman to her Israelite mother-in-law, and by Boaz to the women of Naomi\'s family.\n\nThe book taught Israel that God works through ordinary, faithful people, that His providence is at work even in grief and hardship, and that His purposes extend beyond ethnic boundaries — a lesson that prepares the way for the inclusion of the Gentiles in the gospel.',
    dateWritten: 'Approx. 1000 BC',
    locationWritten: 'Bethlehem and the land of Moab',
    chapters: 4,
    purpose:
      'To show God\'s providence and loyalty in preserving a family line that leads to King David and ultimately to the Messiah.\n\nRuth demonstrates that God is at work in the ordinary events of life — loss, migration, gleaning, and marriage — to accomplish His redemptive purposes, and that His covenant loyalty extends even to those outside Israel who put their trust in Him.',
    keyTheme: 'Loyal love, redemption, providence, and inclusion',
    summary:
      'Set during the dark period of the judges, Ruth tells the story of a Moabite widow whose extraordinary loyalty leads her into the very lineage of Israel\'s greatest king.\n\nFamine drove Elimelech and Naomi from Bethlehem to Moab, where their sons married Moabite women. Within ten years, Elimelech and both sons had died, leaving Naomi and her two daughters-in-law widowed and destitute. When Naomi decided to return to Bethlehem, Ruth refused to leave her, uttering one of the most beloved declarations of loyalty in Scripture:\n\nRuth 1:16-17 (BSB)\nBut Ruth replied, "Do not urge me to leave you or to turn from following you. For wherever you go, I will go, and wherever you live, I will live. Your people will be my people, and your God will be my God. Where you die, I will die, and there I will be buried. May the LORD punish me, and ever so severely, if anything but death separates you and me."\n\nIn Bethlehem, Ruth gleaned in the fields of Boaz, a wealthy relative of Naomi. Boaz noticed her faithfulness and extended to her the protection of the LORD:\n\nRuth 2:12 (BSB)\nMay the LORD repay your work, and may you receive a full reward from the LORD, the God of Israel, under whose wings you have come to take refuge.\n\nWhen Naomi recognized Boaz as a kinsman-redeemer, she guided Ruth to appeal to him. Boaz, after giving the nearer redeemer the legal right of refusal, redeemed Naomi\'s land and took Ruth as his wife.\n\nRuth bore a son, Obed — the grandfather of King David. The book closes with the genealogy that places Ruth, a Moabite, in the royal line of Israel, a sign that God\'s redemptive purposes have always reached beyond the borders of Israel.',
    keyScripture: [
      { reference: 'Ruth 1:16-17 (BSB)', text: 'But Ruth replied, "Do not urge me to leave you or to turn from following you. For wherever you go, I will go, and wherever you live, I will live. Your people will be my people, and your God will be my God."' },
      { reference: 'Ruth 2:12 (BSB)', text: 'May the LORD repay your work, and may you receive a full reward from the LORD, the God of Israel, under whose wings you have come to take refuge.' },
    ],
    background:
      'Ruth is set "in the days when the judges ruled" (Ruth 1:1), a period of moral and spiritual decline in Israel. Against that dark backdrop, the book tells a story of remarkable covenant loyalty.\n\nThe story depends on the Old Testament institution of the kinsman-redeemer: a close relative who could redeem family land that had been sold, marry the widow of a deceased relative to preserve the family name and inheritance (Leviticus 25:25; Deuteronomy 25:5-10), and act as the family\'s advocate. Boaz, as the kinsman-redeemer, both restored Naomi\'s inheritance and raised up offspring for the family line.\n\nThe book can be read in four short scenes:\n\nRuth 1 — The Return: Naomi\'s loss and Ruth\'s loyalty\nRuth 2 — The Meeting: Ruth gleans in Boaz\'s field\nRuth 3 — The Appeal: Ruth asks Boaz to act as redeemer\nRuth 4 — The Redemption: Boaz redeems, and the family line continues\n\nRuth is a story of God\'s providence working through human loyalty, kindness, and obedience — and of His grace reaching a Moabite woman who became the great-grandmother of David and an ancestor of Jesus.',
    structure: [
      { range: '1', title: 'Naomi\'s loss in Moab and Ruth\'s loyal return to Bethlehem' },
      { range: '2', title: 'Ruth gleans in the field of Boaz' },
      { range: '3', title: 'Ruth appeals to Boaz as kinsman-redeemer' },
      { range: '4', title: 'Boaz redeems; the family line continues to David' },
    ],
    lessons:
      'Ruth teaches the beauty of hesed — loyal, covenant love. Ruth\'s devotion to Naomi, expressed in the words "wherever you go, I will go," is held up as a model of selfless faithfulness, and Boaz\'s kindness reflects the loyal love of God Himself.\n\nThe book teaches the reality of God\'s providence. The story is woven from ordinary events — a famine, a journey, gleaning in a field — yet God was directing every detail to preserve a family line and accomplish His purposes. Providence works through the ordinary.\n\nRuth teaches that God cares for the vulnerable. The book quietly celebrates the laws of gleaning and redemption, which protected the poor, widows, and foreigners, and it shows God honoring those who act with such covenant kindness.\n\nThe book also demonstrates that God\'s grace extends beyond ethnic boundaries. Ruth, a Moabite, was welcomed into Israel, became part of the line of David, and appears in the genealogy of Jesus. God has always been at work gathering a people from every nation.\n\nMost of all, Ruth teaches that God writes redemptive stories out of human grief. The book opens with death and emptiness — "the Almighty has dealt very bitterly with me" — and closes with blessing and the birth of a son. Redemption is the theme of the whole book, and of the whole Bible.',
    applications: [
      'Show loyal, covenant love in your relationships.',
      'Trust God\'s providence at work in ordinary events.',
      'Extend kindness and protection to the vulnerable.',
      'God welcomes outsiders who put their trust in Him.',
      'Faithfulness in small things is used by God for great purposes.',
      'Grief is not the end of the story; God brings redemption.',
      'Live with integrity, as Boaz did, in a corrupt generation.',
      'Follow God even when it costs you, as Ruth did.',
    ],
    mainThemes: ['Loyal love and kindness', 'Divine providence', 'Redemption and kinship', 'Inclusion of Gentiles', 'Faithfulness in difficult times', 'God working through ordinary people'],
    keyPeople: ['Naomi', 'Ruth', 'Boaz', 'Orpah', 'Obed', 'Elimelech'],
    keyVerses: [
      'Ruth 1:16-17 (BSB) — "Wherever you go, I will go... Your people will be my people, and your God will be my God."',
      'Ruth 2:12 (BSB) — "Under whose wings you have come to take refuge."',
      'Ruth 3:11 (BSB) — "All my fellow townsmen know that you are a woman of noble character."',
      'Ruth 4:14-15 (BSB) — "Praise be to the LORD... may he become famous throughout Israel."',
      'Ruth 4:17 (BSB) — "A son has been born to Naomi... the father of David."',
    ],
    christConnection: 'Ruth points to Christ as the greater Kinsman-Redeemer. Just as Boaz redeemed Ruth and restored Naomi\'s family line, Christ redeems His bride from spiritual poverty and secures an eternal inheritance for her. Ruth\'s inclusion in the genealogy of Jesus (Matthew 1:5) underscores that the Messiah came for all nations, and the theme of redemption woven through the book finds its ultimate fulfillment in Jesus, who paid the price to redeem His people.',
  },
  {
    bookName: '1 Samuel',
    author: 'Unknown, drawing on prophetic source material',
    authorDetail:
      'The author of 1 Samuel is unknown. The book draws on the records of Samuel, Nathan, and Gad (1 Chronicles 29:29) and on the annals of the kings, and Jewish tradition attributes its compilation to Samuel and the prophets who followed him.\n\nThe narrative spans Samuel\'s birth and ministry, the rise and fall of Saul, and the anointing and early years of David — a period of roughly a century. Because the book records events after Samuel\'s death (including Saul\'s final battle), it was completed by later prophetic editors writing under divine inspiration.\n\nThe book\'s perspective is thoroughly prophetic: it evaluates kings not by their military success but by their obedience to the Word of the LORD.',
    audience:
      '1 Samuel was written to Israel during the transition from the period of the judges to the monarchy, and to every generation that needs to understand how God governs His people.\n\nThe book taught Israel that their king stood under God\'s authority. Israel had asked for a king "like all the nations," but Samuel warned them that they were rejecting not merely a judge but the LORD Himself as their King.\n\n1 Samuel also taught that God evaluates leaders by the heart: Saul, outwardly impressive, was rejected for his disobedience, while David, a shepherd from Bethlehem, was chosen because he was "a man after God\'s own heart."',
    dateWritten: 'Approx. 930–720 BC',
    locationWritten: 'Israel (Shiloh, Ramah, Gibeah, and the hill country of Judah)',
    chapters: 31,
    purpose:
      'To record the transition from the period of the judges to the monarchy, highlighting God\'s sovereignty in raising up and rejecting kings.\n\n1 Samuel answers the question of what godly leadership looks like. It contrasts Saul, who had every outward qualification but a disobedient heart, with David, the shepherd-king whom God chose and anointed — showing that God looks at the heart and that obedience matters more than religious activity.',
    keyTheme: 'Leadership, obedience, and the heart after God',
    summary:
      '1 Samuel opens with the barren Hannah weeping in the tabernacle at Shiloh and praying for a son. God answered with Samuel, whom Hannah dedicated to the LORD — "Because I asked for him from the LORD" (1 Samuel 1:20).\n\nSamuel grew up in the house of the LORD and heard the voice of God for the first time as a boy:\n\n1 Samuel 3:10 (BSB)\nThen the LORD came and stood there, calling as He had done the other times, "Samuel! Samuel!" And Samuel said, "Speak, for Your servant is listening."\n\nSamuel became the last and greatest of the judges, but the people demanded a king like the other nations. God granted their request, and Saul, a tall and handsome man from the tribe of Benjamin, was anointed as Israel\'s first king.\n\nSaul began well but quickly unraveled. He offered a sacrifice he was not permitted to offer, and when he spared the Amalekite king and the best of the livestock against God\'s explicit command, Samuel delivered God\'s verdict:\n\n1 Samuel 15:22 (BSB)\nDoes the LORD delight in burnt offerings and sacrifices as much as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to heed is better than the fat of rams.\n\nGod rejected Saul and sent Samuel to anoint David, the youngest son of Jesse, as king. The LORD explained His choice:\n\n1 Samuel 16:7 (BSB)\nBut the LORD said to Samuel, "Do not consider his appearance or his height, for I have rejected him. The LORD does not see as man does. For man sees the outward appearance, but the LORD sees the heart."\n\nDavid entered Saul\'s service, defeated Goliath in the name of the LORD, and became the darling of Israel — and the object of Saul\'s murderous jealousy. The second half of the book records Saul\'s obsessive pursuit of David through the wilderness, David\'s restraint in sparing Saul\'s life twice, and the tragic death of Saul and Jonathan on Mount Gilboa.\n\nThe book closes with David weeping over the fallen king and his beloved friend Jonathan, and with the throne of Israel waiting for the shepherd-king God had chosen.',
    keyScripture: [
      { reference: '1 Samuel 15:22 (BSB)', text: 'Does the LORD delight in burnt offerings and sacrifices as much as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to heed is better than the fat of rams.' },
      { reference: '1 Samuel 16:7 (BSB)', text: 'But the LORD said to Samuel, "Do not consider his appearance or his height, for I have rejected him. The LORD does not see as man does. For man sees the outward appearance, but the LORD sees the heart."' },
    ],
    background:
      '1 Samuel covers the hinge of Old Testament history: the end of the judges and the beginning of the monarchy. The setting moves from Shiloh, where the tabernacle stood, to the battlefields of the Philistine wars, to the wilderness of Judah where David fled from Saul.\n\nThe book can broadly be divided into three major sections:\n\n1 Samuel 1–7 — Samuel, the Last Judge\nHannah\'s prayer, Samuel\'s birth and call, the corruption of Eli\'s sons, the capture of the ark, and the ark\'s return. Samuel led Israel to victory over the Philistines at Ebenezer.\n\n1 Samuel 8–15 — Saul, the People\'s King\nIsrael demanded a king, Saul was anointed, and after initial victories he disobeyed God\'s commands, leading to his rejection.\n\n1 Samuel 16–31 — David, the LORD\'s Anointed\nDavid was anointed, defeated Goliath, rose in the people\'s esteem, and was hunted by Saul for years. The book ends with Saul\'s death on Mount Gilboa.\n\n1 Samuel is therefore the story of a kingdom in transition, and of the God who raises up and brings down leaders according to His own purposes.',
    structure: [
      { range: '1–7', title: 'Samuel the last judge: birth, call, and ministry' },
      { range: '8–15', title: 'Israel demands a king: the rise and rejection of Saul' },
      { range: '16–31', title: 'David the anointed: Goliath, the wilderness, and Saul\'s death' },
    ],
    lessons:
      '1 Samuel teaches that God hears the prayers of the humble. Hannah\'s barrenness became the occasion of Samuel\'s birth, and her prayer became a model of pouring out one\'s heart to the LORD.\n\nThe book teaches that obedience matters more than religious activity. "To obey is better than sacrifice" is one of the most searching statements in Scripture: God is not impressed by offerings offered in disobedience. Partial obedience is disobedience.\n\n1 Samuel teaches that God looks at the heart. Saul was chosen for his appearance; David was chosen for his heart. Human judgment is swayed by outward qualifications; God evaluates character, faith, and devotion.\n\nThe book also teaches the sovereignty of God over leaders and nations. God raised up Saul and rejected him; God chose David and preserved him through years of pursuit. Kings come and go; the purposes of the LORD stand.\n\nThe friendship of David and Jonathan models faithful covenant love, and David\'s restraint in sparing Saul\'s life — twice — models trust in God\'s timing rather than taking matters into one\'s own hands.\n\nFor believers, 1 Samuel is a call to cultivate a heart after God, to obey His Word fully, and to trust His sovereign purposes even when the way forward seems blocked.',
    applications: [
      'Pour out your heart to God in prayer; He hears the humble.',
      'Obey God fully; partial obedience is disobedience.',
      'Cultivate a heart after God\'s own heart.',
      'Do not judge by outward appearance; God sees the heart.',
      'Trust God\'s timing; do not take matters into your own hands.',
      'Honor God-given authority, even when it is flawed.',
      'God raises up and brings down leaders according to His purposes.',
      'Walk in faithful friendship and covenant loyalty.',
    ],
    mainThemes: ['The sovereignty of God over nations', 'Obedience versus sacrifice', 'The heart matters most', 'Faithful leadership', 'The Spirit of God', 'Divine election and rejection'],
    keyPeople: ['Samuel', 'Hannah', 'Eli', 'Saul', 'David', 'Jonathan', 'Goliath', 'Michal'],
    keyVerses: [
      '1 Samuel 3:10 (BSB) — "Speak, for Your servant is listening."',
      '1 Samuel 15:22 (BSB) — "To obey is better than sacrifice."',
      '1 Samuel 16:7 (BSB) — "The LORD sees the heart."',
      '1 Samuel 17:45-47 (BSB) — "The battle is the LORD\'s."',
      '1 Samuel 2:2 (BSB) — "There is no one holy like the LORD."',
    ],
    christConnection: 'David\'s anointing as king prefigures Christ, the greater Son of David. David\'s role as shepherd-king, his suffering at the hands of enemies, his restraint and faithfulness, and his heart after God all point forward to Jesus — the ultimate Shepherd-King, the anointed one (Messiah) whose kingdom will never end, and the greater Son of David whom the prophets promised.',
  },
  {
    bookName: '2 Samuel',
    author: 'Unknown, possibly the prophet Nathan or Gad',
    authorDetail:
      'The author of 2 Samuel is unknown. The book continues the narrative of 1 Samuel and is drawn from the prophetic records of Nathan and Gad (1 Chronicles 29:29) and the annals of King David.\n\nThe book covers David\'s reign of forty years — his rise to power, his establishment of Jerusalem as the capital, his sin with Bathsheba, and the family turmoil and rebellion that followed.\n\nBecause the account is remarkably candid about David\'s failures, it bears the marks of prophetic historiography: it neither flatters the king nor hides his sins, but tells the truth so that every generation may learn from it.',
    audience:
      '2 Samuel was written to Israel under David\'s reign and to every generation of God\'s people, to show both the glory and the cost of the kingdom.\n\nThe book established for Israel the Davidic covenant — God\'s promise that David\'s throne would endure forever — which became the foundation of messianic hope throughout the Old Testament.\n\n2 Samuel also taught Israel the sober lesson that even a man after God\'s own heart could fall into grievous sin, that sin has far-reaching consequences, and that repentance opens the door to restoration.',
    dateWritten: 'Approx. 930–720 BC',
    locationWritten: 'Jerusalem (Hebron, Mahanaim, and the royal court)',
    chapters: 24,
    purpose:
      'To chronicle David\'s reign as king over Israel — his triumphs, his sin, and the establishment of the Davidic covenant.\n\n2 Samuel shows the kingdom of Israel at its height under David, the promise of an eternal throne, and the devastating consequences of sin within the royal family. It demonstrates both the faithfulness of God to His covenant and the reality of divine discipline.',
    keyTheme: 'Kingship, covenant, sin, repentance, and restoration',
    summary:
      '2 Samuel opens with David mourning the deaths of Saul and Jonathan, then records his anointing as king over Judah at Hebron and, after seven years of conflict, over all Israel. David captured Jerusalem and made it the city of David, and he brought the ark of the LORD to the city with great celebration.\n\nDavid desired to build a house for the LORD, but God instead promised to build a house for David — an eternal dynasty:\n\n2 Samuel 7:16 (BSB)\nYour house and kingdom will endure forever before Me, and your throne will be established forever.\n\nThis Davidic covenant became the foundation of messianic hope. But the book also records David\'s greatest failure: his adultery with Bathsheba and the murder of her husband Uriah. When the prophet Nathan confronted him with the parable of the poor man\'s lamb and declared, "You are the man!" David confessed:\n\n2 Samuel 12:13 (BSB)\nThen David said to Nathan, "I have sinned against the LORD." And Nathan replied, "The LORD has taken away your sin; you will not die."\n\nThough forgiven, David reaped what he had sown. The sword never departed from his house: the rape of Tamar, the murder of Amnon, the rebellion of Absalom, and the bitter civil war that drove David weeping from Jerusalem.\n\nThe book closes with David restored to the throne, his song of deliverance, his mighty men, and his final words — ending with the purchase of the threshing floor of Araunah, where the temple would later be built. The last lines record David\'s death and the succession of Solomon, with the promise of the everlasting throne still standing.',
    keyScripture: [
      { reference: '2 Samuel 7:16 (BSB)', text: 'Your house and kingdom will endure forever before Me, and your throne will be established forever.' },
      { reference: '2 Samuel 12:13 (BSB)', text: 'Then David said to Nathan, "I have sinned against the LORD." And Nathan replied, "The LORD has taken away your sin; you will not die."' },
    ],
    background:
      '2 Samuel covers David\'s forty-year reign, from the death of Saul to the succession of Solomon. It is the story of the kingdom of Israel at its height — and of the human cost of sin.\n\nThe book can broadly be divided into two major sections:\n\n2 Samuel 1–10 — The Triumphs of David\nDavid became king over all Israel, captured Jerusalem, brought the ark to the city, received the Davidic covenant, and subdued the surrounding nations. The ark of the covenant and the worship of God were central to his reign.\n\n2 Samuel 11–24 — The Troubles of David\nDavid\'s sin with Bathsheba and the murder of Uriah brought God\'s judgment on his house. The rape of Tamar, the murder of Amnon, Absalom\'s rebellion, and Sheba\'s revolt followed. The book ends with David\'s song, his mighty men, his census sin, and the purchase of the temple site.\n\n2 Samuel is therefore the story of a covenant-keeping God and a covenant-breaking king: God\'s promise of an eternal throne stands, even when the king falls, because the ultimate fulfillment would come in a Son of David greater than David himself.',
    structure: [
      { range: '1–10', title: 'David\'s triumphs: king over all Israel, the ark, and the covenant' },
      { range: '11–12', title: 'David\'s fall: Bathsheba, Uriah, and Nathan\'s rebuke' },
      { range: '13–20', title: 'The consequences: Tamar, Amnon, and Absalom\'s rebellion' },
      { range: '21–24', title: 'Final reflections: songs, mighty men, and the temple site' },
    ],
    lessons:
      '2 Samuel teaches that God is faithful to His covenant even when His people are not. The Davidic covenant — an everlasting throne — was given freely by grace and stands despite David\'s sin, pointing to a greater fulfillment in Christ.\n\nThe book teaches the tragic reach of sin. One night of adultery led to murder, the sword never departing from David\'s house, and years of family devastation. Sin is never private; its consequences ripple through families, nations, and generations.\n\n2 Samuel also teaches the reality of repentance and restoration. David\'s confession — "I have sinned against the LORD" — was met with forgiveness. Though the consequences remained, the relationship was restored, and David\'s psalms of penitence (Psalm 51) have guided repentant believers ever since.\n\nThe book teaches the importance of wholehearted worship. David\'s joy in bringing the ark to Jerusalem, his dancing before the LORD, and his desire to build a house for God reveal a heart that delighted in the presence of God.\n\nFinally, 2 Samuel teaches that leadership is a stewardship under God. David, the man after God\'s own heart, still had to answer for his sins. No position exempts a person from accountability to the LORD.',
    applications: [
      'God keeps His covenant promises even when we fail.',
      'Sin has far-reaching consequences; take it seriously.',
      'Confess sin quickly; repentance opens the door to restoration.',
      'Worship God wholeheartedly, as David did.',
      'Lead with humility and accountability under God.',
      'Trust God\'s promises of an enduring kingdom.',
      'Forgiveness does not erase consequences, but it restores relationship.',
      'Guard your heart; even the godly can fall.',
    ],
    mainThemes: ['God\'s covenant faithfulness', 'Sin and consequences', 'Repentance and restoration', 'The kingdom of God', 'Leadership and failure', 'Grace in the midst of judgment'],
    keyPeople: ['David', 'Bathsheba', 'Uriah', 'Nathan', 'Joab', 'Absalom', 'Mephibosheth', 'Abishai', 'Solomon'],
    keyVerses: [
      '2 Samuel 7:16 (BSB) — "Your house and kingdom will endure forever before Me."',
      '2 Samuel 12:13 (BSB) — "I have sinned against the LORD."',
      '2 Samuel 22:2-3 (BSB) — "The LORD is my rock, my fortress, and my deliverer."',
      '2 Samuel 24:24 (BSB) — "I will not offer to the LORD my God burnt offerings that cost me nothing."',
      '2 Samuel 6:21-22 (BSB) — David dancing before the LORD.',
    ],
    christConnection: '2 Samuel establishes the Davidic covenant, promising an eternal kingdom and throne. This covenant finds its ultimate fulfillment in Jesus Christ, the Son of David, whose kingdom will never end (Luke 1:32-33). David\'s role as a suffering yet victorious king — weeping over Absalom, hunted and restored — prefigures Christ\'s passion and exaltation, and the prophets repeatedly look back to David\'s line when they announce the coming Messiah.',
  },
  {
    bookName: 'Psalms',
    author: 'David, Asaph, the Sons of Korah, Solomon, Moses, Heman, Ethan, and others',
    authorDetail:
      'The Psalms are a divinely inspired collection of 150 songs and prayers gathered over nearly a millennium. Their chief human author is David, the shepherd-king of Israel, to whom seventy-three psalms are attributed. Other named authors include Moses, who wrote the oldest psalm (Psalm 90); Solomon; Asaph, the chief Levitical musician; the Sons of Korah, the temple singers; Heman the Ezrahite; and Ethan the Ezrahite.\n\nMany psalms carry superscriptions describing their occasion — David\'s flight from Saul, his sin with Bathsheba, and his dedication of the temple site — while others were composed anonymously by the worship leaders of Israel.\n\nThe Psalter reached its final form after the exile, arranged into five books, each closing with a doxology, in deliberate echo of the five books of Moses. Under divine inspiration, the whole collection became the prayer and songbook of God\'s people.',
    audience:
      'The Psalms were given to Israel as the hymnbook of the sanctuary and the prayer book of the covenant people, and they have served every generation of believers since.\n\nThe psalms taught Israel how to worship — to praise God for who He is, to thank Him for what He has done, to confess sin, to lament suffering, and to trust Him in every circumstance of life.\n\nBecause the psalms give voice to the full range of human emotion, they teach believers that honest prayer is welcome before God: joy, grief, fear, anger, doubt, and hope can all be brought to Him in faith.',
    dateWritten: 'Approx. 1440–400 BC',
    locationWritten: 'Various locations in Israel',
    chapters: 150,
    purpose:
      'To provide the prayer and songbook of God\'s people, expressing the full range of human emotion in response to God — praise, lament, thanksgiving, confession, and trust.\n\nThe Psalms summon the congregation to worship the LORD, teach the heart to trust Him in suffering, rehearse His mighty acts in history, and proclaim His reign over all creation — while looking forward to the coming King, the Messiah.',
    keyTheme: 'Worship, lament, praise, trust, and the reign of God',
    summary:
      'The book of Psalms is the hymnbook of the Bible: 150 inspired songs and prayers spanning nearly a millennium, from the days of Moses to the return from exile. They cover every human emotion and circumstance — joy in creation, anguish in suffering, confidence in danger, sorrow over sin, and exuberant praise.\n\nThe book opens with the two ways set before every person:\n\nPsalm 1:1-2 (BSB)\nBlessed is the man who does not walk in the counsel of the wicked, or set foot on the path of sinners, or sit in the seat of mockers. But his delight is in the law of the LORD, and on His law he meditates day and night.\n\nThe Psalms are filled with prayers for deliverance, songs of thanksgiving, royal psalms celebrating the LORD\'s reign, and laments that cry out from the depths of suffering. Some of the most beloved passages in all Scripture are found here:\n\nPsalm 23:1 (BSB)\nThe LORD is my shepherd; I shall not want.\n\nThe middle of the book contains psalms of deep penitence, such as David\'s confession after his sin with Bathsheba:\n\nPsalm 51:10 (BSB)\nCreate in me a clean heart, O God, and renew a right spirit within me.\n\nThe Psalter closes with a crescendo of praise as every living thing is summoned to worship:\n\nPsalm 150:6 (BSB)\nLet everything that has breath praise the LORD! Hallelujah!\n\nThe Psalms teach believers to center their lives on God, to bring every emotion honestly before Him, and to rehearse His faithfulness from generation to generation.',
    keyScripture: [
      { reference: 'Psalm 23:1 (BSB)', text: 'The LORD is my shepherd; I shall not want.' },
      { reference: 'Psalm 51:10 (BSB)', text: 'Create in me a clean heart, O God, and renew a right spirit within me.' },
      { reference: 'Psalm 150:6 (BSB)', text: 'Let everything that has breath praise the LORD! Hallelujah!' },
    ],
    background:
      'The Psalms were composed across nearly a thousand years, from the wilderness of Moses to the rebuilt temple of the returned exiles. David organized the Levitical musicians for the tabernacle worship, and his psalms — more than half the collection — were written in the cave, the palace, and the wilderness.\n\nThe book is arranged into five smaller books, each ending in a doxology, in deliberate parallel to the five books of the Pentateuch:\n\nPsalms 1–41 — Book One\nPsalms attributed mainly to David, opening with the two ways and including many psalms of deliverance and trust.\n\nPsalms 42–72 — Book Two\nPsalms of the Sons of Korah and David, including the great penitential Psalm 51 and royal psalms of the coming King.\n\nPsalms 73–89 — Book Three\nPsalms of Asaph and the Sons of Korah, wrestling with the prosperity of the wicked and the faithfulness of God to His covenant.\n\nPsalms 90–106 — Book Four\nPsalms of Moses and the LORD\'s reign, answering the despair of the exile by declaring that the LORD has been our dwelling place in every generation.\n\nPsalms 107–150 — Book Five\nThanksgiving psalms, the great Torah psalm (119), the Songs of Ascents for pilgrims going up to Jerusalem, and the Hallelujah psalms that close the book.\n\nThe Psalms are therefore the worship of the covenant people organized for every generation: they teach, lament, thank, and praise, and they prepare the way for the coming Messiah.',
    structure: [
      { range: '1–41', title: 'Book One: psalms of David — the two ways, deliverance, and trust' },
      { range: '42–72', title: 'Book Two: Korah and David — lament, penitence, and the coming King' },
      { range: '73–89', title: 'Book Three: Asaph — the problem of evil and God\'s covenant faithfulness' },
      { range: '90–106', title: 'Book Four: Moses and the LORD\'s reign in every generation' },
      { range: '107–150', title: 'Book Five: thanksgiving, the Law, pilgrim songs, and the great Hallelujah' },
    ],
    lessons:
      'The Psalms teach that worship is the center of the Christian life. The psalms are not merely ancient songs; they are the God-given vocabulary for prayer, teaching believers to praise, lament, confess, and trust.\n\nThe book teaches that every emotion may be brought honestly before God. The psalmists were not afraid to cry out in anguish, to ask why, or to plead for deliverance. Honest lament is a form of faith — it takes God seriously enough to bring Him our pain.\n\nThe Psalms teach the practice of remembering. Again and again the psalmists rehearse what God has done — creation, the exodus, the covenant, deliverance from enemies — because remembering God\'s faithfulness in the past sustains trust in the present.\n\nThe book teaches that the Word of God is the path of blessing. Psalm 1 pictures the blessed man meditating on the Law day and night; Psalm 119 celebrates the Word as lamp, treasure, and delight.\n\nThe Psalms also teach trust in the LORD as refuge and shepherd. The most beloved images of the book — the shepherd, the rock, the fortress, the hiding place — all speak of a God who is near, faithful, and able to save.\n\nMost of all, the Psalms teach that praise is the end of the story. Even the darkest laments move toward trust, and the book closes with everything that has breath praising the LORD.',
    applications: [
      'Make the psalms your prayer book: bring every emotion before God.',
      'Lament honestly; God welcomes your cries.',
      'Meditate on the Word of God day and night.',
      'Remember God\'s faithfulness in the past to sustain trust today.',
      'Take refuge in the LORD; He is your shepherd, rock, and fortress.',
      'Confess sin quickly, as David did.',
      'Sing praise to God in the assembly of His people.',
      'End every lament with hope in the LORD.',
    ],
    mainThemes: ['Worship and praise', 'Lament and suffering', 'Trust in God', 'God\'s sovereignty', 'The Law as delight', 'Covenant love and faithfulness'],
    keyPeople: ['David', 'Asaph', 'The Sons of Korah', 'Solomon', 'Moses', 'Heman and Ethan the Ezrahites'],
    keyVerses: [
      'Psalm 1:1-2 (BSB) — "Blessed is the man who does not walk in the counsel of the wicked... his delight is in the law of the LORD."',
      'Psalm 23:1 (BSB) — "The LORD is my shepherd; I shall not want."',
      'Psalm 51:10 (BSB) — "Create in me a clean heart, O God."',
      'Psalm 103:1 (BSB) — "Bless the LORD, O my soul, and all that is within me, bless His holy name."',
      'Psalm 119:105 (BSB) — "Your word is a lamp to my feet and a light to my path."',
    ],
    christConnection: 'The Psalms are profoundly messianic, foretelling Christ\'s betrayal (Psalm 22, 41, 69), His resurrection (Psalm 16), His priesthood (Psalm 110), His role as the cornerstone (Psalm 118), and His eternal reign (Psalm 2, 72, 110). Jesus quoted the Psalms extensively — on the cross He cried out the opening words of Psalm 22 — and the New Testament cites the Psalms as fulfilled in Him more than any other Old Testament book.',
  },
  {
    bookName: 'Proverbs',
    author: 'Solomon, Agur, Lemuel, and other wise men',
    authorDetail:
      'The book of Proverbs is the work of many wise men under the inspiration of God. Its principal author is Solomon, the son of David and king of Israel, whose wisdom the Scriptures describe as exceeding that of all the wise of the east (1 Kings 4:29-34). Solomon composed three thousand proverbs, and the opening collection of the book bears his name (Proverbs 1:1).\n\nThe book also preserves the sayings of other sages: "the words of the wise" (Proverbs 22:17), "more proverbs of Solomon, which the men of Hezekiah king of Judah copied" (Proverbs 25:1), the words of Agur son of Jakeh (Proverbs 30), and the sayings of King Lemuel (Proverbs 31).\n\nChristians have traditionally understood the book to have been compiled under divine inspiration, gathering Israel\'s accumulated wisdom into a permanent guide for godly living.',
    audience:
      'Proverbs was written for the young — sons and daughters beginning the journey of life — and for everyone who wishes to live skillfully in the fear of the Lord.\n\nThe book repeatedly addresses its readers as "my son," calling them to hear instruction, honor their parents, guard their hearts, and walk in the way of wisdom. It was given to the covenant people of Israel and, through them, to every generation of believers.\n\nProverbs teaches that wisdom is practical: it applies the fear of the Lord to money, work, speech, marriage, friendship, discipline, and the ordinary decisions of daily life.',
    dateWritten: 'Approx. 970–700 BC',
    locationWritten: 'Jerusalem',
    chapters: 31,
    purpose:
      'To impart wisdom, discipline, and understanding for living skillfully in the fear of the Lord.\n\nProverbs aims to give the reader "prudence to the simple, knowledge and discretion to the young" (Proverbs 1:4) and to train the heart in the way of righteousness, justice, and integrity — so that life is lived well, for the glory of God and the good of others.',
    keyTheme: 'Wisdom, fear of the Lord, discipline, and righteous living',
    summary:
      'Proverbs is a collection of inspired sayings that apply the fear of the Lord to every area of life. The book opens by stating its foundational principle:\n\nProverbs 1:7 (BSB)\nThe fear of the LORD is the beginning of knowledge, but fools despise wisdom and discipline.\n\nThe first nine chapters consist of extended addresses in which wisdom, personified as a woman, calls out in the streets and invites all who will listen:\n\nProverbs 3:5-6 (BSB)\nTrust in the LORD with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He will make your paths straight.\n\nThe heart of the book — chapters 10 through 29 — is a treasury of short proverbs contrasting the wise and the foolish, the diligent and the lazy, the righteous and the wicked. They cover speech, money, work, pride, anger, friendship, marriage, and the discipline of children.\n\nThe book closes with the words of Agur, the sayings of King Lemuel, and the famous portrait of the noble wife:\n\nProverbs 31:10 (BSB)\nA wife of noble character, who can find? She is far more precious than rubies.\n\nProverbs is therefore the Bible\'s practical manual for wisdom: it shows that the fear of the Lord shapes not only worship but the smallest decisions of daily life.',
    keyScripture: [
      { reference: 'Proverbs 1:7 (BSB)', text: 'The fear of the LORD is the beginning of knowledge, but fools despise wisdom and discipline.' },
      { reference: 'Proverbs 3:5-6 (BSB)', text: 'Trust in the LORD with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He will make your paths straight.' },
      { reference: 'Proverbs 31:10 (BSB)', text: 'A wife of noble character, who can find? She is far more precious than rubies.' },
    ],
    background:
      'Proverbs belongs to the wisdom literature of the Old Testament, alongside Job and Ecclesiastes. While the Law taught Israel how to worship and the Prophets called them back to covenant faithfulness, the wisdom books taught God\'s people how to live skillfully in a world that often seems unpredictable.\n\nThe book was compiled over several centuries. Solomon, who reigned in Jerusalem around 970–931 BC, composed the core collections, and the men of Hezekiah copied additional proverbs around 700 BC — showing that Israel treasured and preserved this wisdom across generations.\n\nThe book can broadly be divided into four major sections:\n\nProverbs 1–9 — Wisdom\'s Call\nExtended discourses in which wisdom, personified as a woman, calls the young to fear the LORD, flee folly, and embrace instruction.\n\nProverbs 10–24 — The Proverbs of Solomon\nShort, pithy sayings contrasting the wise and the foolish across every area of daily life.\n\nProverbs 25–29 — Proverbs Copied by Hezekiah\nMore of Solomon\'s proverbs, preserved by the scribes of King Hezekiah.\n\nProverbs 30–31 — The Words of Agur and Lemuel\nThe sayings of Agur, the words of King Lemuel, and the portrait of the noble wife.\n\nProverbs is therefore the accumulated wisdom of Israel\'s greatest sages, gathered under divine inspiration to train the next generation in the fear of the Lord.',
    structure: [
      { range: '1–9', title: 'Wisdom\'s call: the fear of the Lord and the path of life' },
      { range: '10–24', title: 'The proverbs of Solomon: wise and foolish living' },
      { range: '25–29', title: 'Proverbs copied by the men of Hezekiah' },
      { range: '30–31', title: 'The words of Agur and Lemuel, and the noble wife' },
    ],
    lessons:
      'Proverbs teaches that the fear of the Lord is the beginning of wisdom. Every skill, every decision, and every relationship is to be ordered around the reverent acknowledgment of God. Wisdom begins not with cleverness but with worship.\n\nThe book teaches the power of the tongue. Proverbs returns again and again to speech: "Life and death are in the power of the tongue" (Proverbs 18:21). A soft answer turns away wrath; a word fitly spoken is like apples of gold in settings of silver.\n\nProverbs teaches diligence and warns against laziness. The ant is held up as a teacher (Proverbs 6:6), and the sluggard is warned that poverty will come upon him like a robber.\n\nThe book teaches the discipline of the heart. "Guard your heart with all diligence, for from it flow the springs of life" (Proverbs 4:23). The wise person watches over the inner life, because behavior flows from the heart.\n\nProverbs also teaches the danger of pride and the beauty of humility. "Pride goes before destruction, and a haughty spirit before a fall" (Proverbs 16:18), while "before honor comes humility" (Proverbs 15:33).\n\nMost of all, Proverbs teaches that wisdom is a person as well as a path. Wisdom calls aloud in the streets, and the New Testament reveals that Christ is the wisdom of God in whom all the treasures of wisdom and knowledge are hidden.',
    applications: [
      'Begin all knowledge with the fear of the Lord.',
      'Guard your heart, for from it flow the springs of life.',
      'Use your tongue to build up, not to destroy.',
      'Work diligently; flee laziness.',
      'Walk in humility; pride goes before destruction.',
      'Trust in the LORD with all your heart in every decision.',
      'Discipline and instruction are expressions of love.',
      'Choose friends and companions who walk in wisdom.',
    ],
    mainThemes: ['Fear of the Lord', 'Wisdom versus folly', 'Discipline and instruction', 'Righteous speech', 'Diligence and laziness', 'Marriage and family'],
    keyPeople: ['Solomon', 'The wise woman (Lady Wisdom)', 'The foolish woman (Lady Folly)', 'Agur son of Jakeh', 'King Lemuel', 'The noble wife'],
    keyVerses: [
      'Proverbs 1:7 (BSB) — "The fear of the LORD is the beginning of knowledge."',
      'Proverbs 3:5-6 (BSB) — "Trust in the LORD with all your heart... He will make your paths straight."',
      'Proverbs 9:10 (BSB) — "The fear of the LORD is the beginning of wisdom."',
      'Proverbs 16:18 (BSB) — "Pride goes before destruction, and a haughty spirit before a fall."',
      'Proverbs 31:30 (BSB) — "Charm is deceptive and beauty is fleeting, but a woman who fears the LORD is to be praised."',
    ],
    christConnection: 'Proverbs prepares for Christ as the embodiment of divine wisdom. Paul calls Christ "the wisdom of God" (1 Corinthians 1:24), and in Proverbs 8, wisdom personified speaks of being present at creation — pointing to Christ, the eternal Word through whom all things were made. Jesus is the greater Teacher who fulfills and surpasses the wisdom of Solomon (Matthew 12:42), and in Him are hidden all the treasures of wisdom and knowledge (Colossians 2:3).',
  },
  {
    bookName: 'Isaiah',
    author: 'Isaiah son of Amoz',
    authorDetail:
      'The book of Isaiah is the work of the prophet Isaiah, son of Amoz, who ministered in Jerusalem for more than forty years during the reigns of Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah (Isaiah 1:1).\n\nIsaiah was a man of the royal court and the city — he counseled kings, confronted the nation\'s sin, and was faithful through the Assyrian crisis that threatened to destroy Jerusalem. His call is recorded in one of the most moving passages of Scripture, when he saw the LORD high and lifted up in the temple (Isaiah 6).\n\nJewish and Christian tradition agree in attributing the whole book to Isaiah, who wrote under the inspiration of God and foretold events — including the fall of Babylon and the rise of Cyrus — that lay far in the future. The New Testament repeatedly cites the book as the prophet Isaiah\'s testimony to the Messiah.',
    audience:
      'Isaiah was written to the people of Judah in the eighth century BC, warning them of coming judgment and promising future restoration.\n\nThe book addressed a nation that trusted in military alliances, foreign gods, and religious ritual while neglecting justice and righteousness. Isaiah called Judah to trust the LORD alone, warned that their sin would bring the Assyrian and Babylonian judgments, and promised that God would preserve a remnant and restore His people.\n\nBecause the book looks beyond the exile to the coming Messiah and the new creation, it speaks to every generation of believers who await the fulfillment of God\'s promises.',
    dateWritten: 'Approx. 740–680 BC',
    locationWritten: 'Jerusalem',
    chapters: 66,
    purpose:
      'To call Judah to repentance, announce judgment on sin, and proclaim the coming redemption through the Messiah.\n\nIsaiah is the gospel of the Old Testament: it declares the holiness of God, the sinfulness of the people, the certainty of judgment, and the glorious promise of a Redeemer — the suffering Servant who would bear the sins of many and establish an everlasting kingdom.',
    keyTheme: 'Judgment, redemption, the holiness of God, and the coming Servant',
    summary:
      'Isaiah is the longest and most comprehensive of the prophetic books. The first half proclaims judgment against Judah and the surrounding nations, while the second half announces comfort, restoration, and the coming of the Messiah.\n\nThe book opens with God\'s indictment of a rebellious nation, and it is anchored in Isaiah\'s vision of the holiness of God:\n\nIsaiah 6:8 (BSB)\nThen I heard the voice of the Lord saying, "Whom shall I send? And who will go for Us?" "Here am I," I said. "Send me!"\n\nIsaiah foretold the virgin birth of the Messiah and His reign:\n\nIsaiah 9:6-7 (BSB)\nFor unto us a child is born, unto us a son is given, and the government will be upon His shoulders. And He will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.\n\nThe second half of the book proclaims the comfort of God to a people facing exile. It promises the servant of the LORD who would bring salvation to the nations, and it reaches its summit in the portrait of the suffering Servant:\n\nIsaiah 53:5 (BSB)\nBut He was pierced for our transgressions, He was crushed for our iniquities; the punishment that brought us peace was upon Him, and by His stripes we are healed.\n\nThe book closes with the promise of new heavens and a new earth, where sorrow and sighing will flee away. Isaiah therefore traces the whole arc of redemption: judgment on sin, the coming of the Servant, and the final restoration of all things.',
    keyScripture: [
      { reference: 'Isaiah 6:8 (BSB)', text: 'Then I heard the voice of the Lord saying, "Whom shall I send? And who will go for Us?" "Here am I," I said. "Send me!"' },
      { reference: 'Isaiah 9:6 (BSB)', text: 'For unto us a child is born, unto us a son is given, and the government will be upon His shoulders. And He will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.' },
      { reference: 'Isaiah 53:5 (BSB)', text: 'But He was pierced for our transgressions, He was crushed for our iniquities; the punishment that brought us peace was upon Him, and by His stripes we are healed.' },
    ],
    background:
      'Isaiah ministered during one of the most turbulent centuries in Judah\'s history. The northern kingdom of Israel fell to Assyria in 722 BC, and Judah itself was threatened when the Assyrian army surrounded Jerusalem in 701 BC. Isaiah urged King Hezekiah to trust the LORD rather than Egypt, and God delivered the city miraculously.\n\nBeyond the Assyrian crisis, Isaiah saw further into the future: the Babylonian exile, the return under Cyrus, and the coming of the Messiah. The book can broadly be divided into two major sections:\n\nIsaiah 1–39 — The Book of Judgment\nThese chapters contain oracles of judgment against Judah and the nations, the promise of the coming King (chapters 7–12), and the historical account of Hezekiah and the Assyrian crisis (chapters 36–39).\n\nIsaiah 40–66 — The Book of Comfort\nThese chapters announce the end of exile, the coming of the servant of the LORD, the suffering Servant who bears the sins of His people (chapter 53), the new covenant, and the new heavens and new earth.\n\nIsaiah is therefore the most complete Old Testament portrait of the gospel: God\'s holiness, human sin, divine judgment, and the Redeemer who brings salvation to the ends of the earth.',
    structure: [
      { range: '1–12', title: 'Judgment on Judah and the promise of the coming King' },
      { range: '13–27', title: 'Oracles against the nations and the triumph of God\'s kingdom' },
      { range: '28–39', title: 'Woes on Jerusalem, Hezekiah, and the Assyrian crisis' },
      { range: '40–55', title: 'Comfort for exiles: the servant of the LORD and the suffering Servant' },
      { range: '56–66', title: 'The new covenant, the new heavens, and the new earth' },
    ],
    lessons:
      'Isaiah teaches the holiness of God. In Isaiah\'s vision, the seraphim cry "Holy, holy, holy is the LORD of Hosts," and the prophet\'s first response is to confess his own uncleanness. The greatness and purity of God are the foundation of everything else in the book.\n\nThe book teaches the seriousness of sin and the certainty of judgment. Isaiah does not flatter the nation: their worship is empty, their hands are full of blood, and judgment is coming. Sin against the holy God must be dealt with.\n\nIsaiah equally teaches the grace of God. Judgment is never God\'s final word. The book proclaims comfort to the exiled, redemption to the sinner, and a new creation to the broken world. Grace runs deeper than judgment.\n\nThe book teaches trust in God rather than human alliances. Judah was tempted to lean on Egypt and Assyria; Isaiah called the nation to trust the LORD alone, and history proved him right when God delivered Jerusalem without a single arrow being fired.\n\nMost of all, Isaiah teaches that salvation comes through the suffering Servant. The message of chapter 53 — the righteous Servant bearing the iniquities of His people — is the heart of the gospel, fulfilled in Jesus Christ.\n\nFor believers, Isaiah is a summons to holiness, a call to trust God completely, and a promise that the purposes of God will triumph in the end.',
    applications: [
      'Behold the holiness of God and confess your own sin.',
      'Trust the LORD rather than human strength and alliances.',
      'Respond to God\'s call: "Here am I. Send me."',
      'Find comfort in God\'s promises of restoration.',
      'Hope in the Messiah who was pierced for our transgressions.',
      'Walk in justice and righteousness, not empty religion.',
      'Wait for the new heavens and the new earth.',
      'Bring the good news of the Servant to the nations.',
    ],
    mainThemes: ['The holiness of God', 'Judgment and hope', 'The remnant', 'The Messiah and His kingdom', 'Salvation for all nations', 'The new creation'],
    keyPeople: ['Isaiah', 'King Uzziah', 'King Ahaz', 'King Hezekiah', 'The Assyrian king (Sennacherib)', 'Cyrus of Persia (foretold)'],
    keyVerses: [
      'Isaiah 6:8 (BSB) — "Whom shall I send? ... Here am I. Send me!"',
      'Isaiah 7:14 (BSB) — "The virgin will be with child and will give birth to a son, and will call Him Immanuel."',
      'Isaiah 9:6-7 (BSB) — "For unto us a child is born... Prince of Peace."',
      'Isaiah 40:31 (BSB) — "Those who wait upon the LORD will renew their strength."',
      'Isaiah 53:5 (BSB) — "He was pierced for our transgressions, He was crushed for our iniquities."',
    ],
    christConnection: 'Isaiah contains the richest messianic prophecies in the Old Testament: the virgin birth (7:14), the child who is Mighty God and Prince of Peace (9:6-7), the Spirit-anointed Servant (11:1-2; 42:1-4; 61:1-3), and the suffering Servant who bears our sins (52:13–53:12). Jesus quoted Isaiah more than any other prophet, and the Gospels and Acts repeatedly show His life, death, and resurrection fulfilling the words of Isaiah.',
  },
  {
    bookName: 'Jeremiah',
    author: 'Jeremiah, with Baruch the scribe',
    authorDetail:
      'The book of Jeremiah is the work of the prophet Jeremiah, son of Hilkiah, a priest of Anathoth, who ministered in Jerusalem for more than forty years — from the thirteenth year of King Josiah (627 BC) until after the fall of Jerusalem in 586 BC.\n\nJeremiah dictated his prophecies to his faithful scribe Baruch, who wrote them on a scroll (Jeremiah 36), and the book preserves both the prophet\'s words and the account of his suffering ministry.\n\nChristians have traditionally understood the book to have been compiled under divine inspiration, combining Jeremiah\'s oracles, his personal laments — the so-called confessions of Jeremiah — and biographical narratives written from the prophet\'s own testimony.',
    audience:
      'Jeremiah was written to the people of Judah in the final decades before the Babylonian exile, and to the exiles in Babylon who needed to hear God\'s word of judgment and promise.\n\nThe book warned a nation that had forsaken the LORD and trusted in idols, foreign alliances, and the false security of the temple. Jeremiah called Judah to repent, announced that judgment was certain, and — when the city fell — gave the exiles instructions to settle, pray, and hope in Babylon.\n\nBecause the book promises a new covenant written on the heart, it speaks to every generation of believers who await the full redemption of God\'s people.',
    dateWritten: 'Approx. 627–580 BC',
    locationWritten: 'Jerusalem and Egypt',
    chapters: 52,
    purpose:
      'To warn Judah of impending judgment, call for repentance, and promise a new covenant after the exile.\n\nJeremiah was appointed by God "to uproot and tear down, to destroy and overthrow, to build and to plant" (Jeremiah 1:10). The book announces the certain judgment of a sinful nation and, at the same time, proclaims the gracious promise of restoration and a new covenant written on human hearts.',
    keyTheme: 'Judgment, the new covenant, lament, and God\'s enduring love',
    summary:
      'Jeremiah, the "weeping prophet," ministered during Judah\'s final decades before the Babylonian destruction of Jerusalem. From his call as a young man, God\'s word to him was of both judgment and hope:\n\nJeremiah 29:11 (BSB)\nFor I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, to give you a future and a hope.\n\nJeremiah courageously proclaimed God\'s judgment despite persecution, imprisonment, and rejection. He used vivid object lessons — a ruined linen belt, shattered clay jars, a yoke around his neck — to dramatize the message that Babylon would conquer Judah. He warned against trusting Egypt or false prophets who promised peace when there was no peace.\n\nAt the heart of the book stands the promise of a new covenant, the most important single prophecy of Jeremiah:\n\nJeremiah 31:33 (BSB)\n"But this is the covenant I will make with the house of Israel after those days," declares the LORD. "I will put My law in their minds and inscribe it on their hearts. And I will be their God, and they will be My people."\n\nWhen Jerusalem fell and the people were carried into exile, Jeremiah wrote to the exiles urging them to settle in Babylon and seek its welfare, because God had plans to restore them after seventy years.\n\nJeremiah\'s faithfulness in suffering — beaten, imprisoned in a cistern, and finally carried to Egypt against his will — makes him a powerful example of costly obedience. The book closes with the fall of Jerusalem and the release of King Jehoiachin, a small sign that God\'s purposes were not finished.',
    keyScripture: [
      { reference: 'Jeremiah 29:11 (BSB)', text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, to give you a future and a hope.' },
      { reference: 'Jeremiah 31:33 (BSB)', text: '"But this is the covenant I will make with the house of Israel after those days," declares the LORD. "I will put My law in their minds and inscribe it on their hearts. And I will be their God, and they will be My people."' },
      { reference: 'Jeremiah 9:23-24 (BSB)', text: 'Let not the wise man boast in his wisdom, nor the strong man in his strength, nor the wealthy man in his riches. But let him who boasts boast in this, that he understands and knows Me, that I am the LORD, who exercises loving devotion, justice, and righteousness on the earth.' },
    ],
    background:
      'Jeremiah ministered through one of the most tragic periods of Israel\'s history. He began under the reforming king Josiah, watched Josiah\'s successors reverse the reforms, and lived through the siege and destruction of Jerusalem by the Babylonians in 586 BC.\n\nThe book weaves together three kinds of material: Jeremiah\'s poetic oracles, his personal confessions (lamenting the cost of his calling), and biographical narratives about the prophet, largely concerning his scribe Baruch.\n\nThe book can broadly be divided into four major sections:\n\nJeremiah 1–25 — Oracles against Judah\nJeremiah\'s early messages: calls to repentance, warnings of the Babylonians, object lessons, and his confessions.\n\nJeremiah 26–45 — The Prophet and the Nation\nThe biographical narrative: Jeremiah\'s conflicts with kings and false prophets, the writing of the scroll, the fall of Jerusalem, and his ministry to the remnant.\n\nJeremiah 46–51 — Oracles against the Nations\nJudgments announced against Egypt, Philistia, Moab, Ammon, Edom, Babylon, and the other nations.\n\nJeremiah 52 — The Fall of Jerusalem\nA historical appendix recording the destruction of the city and the temple and the exile of the people.\n\nJeremiah is therefore the most personal of the prophetic books: it shows the cost of faithfulness and the depth of God\'s grief over His people, even as He announces judgment.',
    structure: [
      { range: '1–25', title: 'Oracles against Judah: calls to repentance and warnings of judgment' },
      { range: '26–45', title: 'The prophet\'s ministry: conflicts, the scroll, and the fall of Jerusalem' },
      { range: '46–51', title: 'Oracles against the nations' },
      { range: '52', title: 'The fall of Jerusalem and the exile' },
    ],
    lessons:
      'Jeremiah teaches the cost of faithfulness. The weeping prophet preached for forty years, was ignored, mocked, beaten, and imprisoned, and saw everything he warned about come true. Faithfulness to God is not measured by popularity or results but by obedience.\n\nThe book teaches the seriousness of sin and the certainty of judgment. Judah\'s idolatry, injustice, and false security in the temple brought the judgment Jeremiah announced. Sin against the holy God cannot be covered by religious ritual.\n\nJeremiah equally teaches the faithfulness of God\'s love. The book that announces judgment is also the book of the new covenant: God promises to write His law on the heart, to forgive iniquity and remember sin no more. Judgment is not God\'s final word.\n\nThe book teaches the danger of false security and false prophets. Jeremiah confronted those who said "Peace, peace" when there was no peace. God\'s people must build their confidence on the word of God, not on comfortable messages or religious symbols.\n\nMost of all, Jeremiah teaches that the human heart stands in desperate need of transformation. The problem is not merely bad behavior but a hard heart: "The heart is deceitful above all things" (Jeremiah 17:9). That is why God promises a new covenant — not a better law, but a new heart.\n\nFor believers, Jeremiah is a call to costly faithfulness, honest lament, and hope in the new covenant fulfilled in Christ.',
    applications: [
      'Remain faithful even when obedience is costly.',
      'Build your life on the word of God, not on comfortable messages.',
      'Trust the LORD with a future and a hope.',
      'Do not trust in religious ritual or false security.',
      'Bring your honest laments to God.',
      'Boast in knowing God, not in wisdom, strength, or riches.',
      'Hope in the new covenant written on the heart.',
      'Seek the welfare of the place where God has planted you.',
    ],
    mainThemes: ['Divine judgment on sin', 'The hardness of the human heart', 'A new covenant', 'Faithfulness under persecution', 'Lament and hope', 'God\'s relentless love'],
    keyPeople: ['Jeremiah', 'Baruch the scribe', 'King Josiah', 'King Jehoiakim', 'King Zedekiah', 'Ebed-Melech the Cushite'],
    keyVerses: [
      'Jeremiah 1:5 (BSB) — "Before I formed you in the womb I knew you... I appointed you as a prophet to the nations."',
      'Jeremiah 9:23-24 (BSB) — "Let him who boasts boast in this, that he understands and knows Me."',
      'Jeremiah 29:11 (BSB) — "Plans to prosper you... to give you a future and a hope."',
      'Jeremiah 31:31-33 (BSB) — "I will make a new covenant... I will put My law in their minds and inscribe it on their hearts."',
      'Jeremiah 33:3 (BSB) — "Call to Me, and I will answer and show you great and unsearchable things you do not know."',
    ],
    christConnection: 'Jeremiah points to Christ as the righteous Branch from David\'s line (23:5-6; 33:15-16), whose name is "The LORD Our Righteousness," and as the mediator of the new covenant (31:31-34) that is fulfilled in Jesus\' blood. At the Last Supper, Jesus declared that His blood inaugurated the new covenant promised through Jeremiah (Luke 22:20). Jeremiah\'s own suffering as a rejected prophet prefigures the rejection and suffering of Christ.',
  },
  {
    bookName: '1 Kings',
    author: 'Unknown, traditionally attributed to Jeremiah',
    authorDetail:
      'The author of 1 Kings is unknown. Jewish tradition attributes the book to the prophet Jeremiah, and scholars commonly describe the author as a Deuteronomic historian — one who wrote under the inspiration of God in the spirit of the book of Deuteronomy, evaluating kings by their faithfulness to the covenant.\n\nThe book draws on official records — "the book of the annals of Solomon" and "the book of the annals of the kings of Israel and Judah" — and weaves them into a single narrative tracing the kingdom from Solomon\'s glory to its division.\n\nThe history was compiled with a prophet\'s eye: it measures every king not by military or economic success but by whether he "did what was right in the eyes of the LORD" or "did evil in the eyes of the LORD."',
    audience:
      '1 Kings was written to the people of Israel and Judah in the years surrounding the exile, to explain why the kingdom had fallen and how God had been faithful throughout.\n\nThe book taught the covenant people that obedience to the LORD brought blessing and that idolatry and covenant unfaithfulness brought judgment — the pattern announced in Deuteronomy.\n\nIt also preserved the memory of Solomon\'s temple, the prophets of the LORD, and the divided kingdom, so that later generations would understand both the glory and the tragedy of Israel\'s history.',
    dateWritten: 'Approx. 971–852 BC (compiled later)',
    locationWritten: 'Judah (compiled in Jerusalem)',
    chapters: 22,
    purpose:
      'To record the reign of Solomon, the division of the kingdom, and the ministries of the prophets, demonstrating that the fate of the nation rose and fell with its faithfulness to the LORD.\n\n1 Kings shows the height of Israel\'s glory under Solomon — the temple, the wisdom, the wealth — and the swift unraveling that followed when Solomon\'s heart turned after other gods, dividing the kingdom his father had united.',
    keyTheme: 'The glory and fall of Solomon\'s kingdom; covenant faithfulness and judgment',
    summary:
      '1 Kings opens with David\'s death and the accession of his son Solomon, whose reign marked the zenith of Israel\'s power. When Solomon asked for wisdom rather than wealth, God granted both:\n\n1 Kings 3:9-10 (BSB)\n"Give Your servant an understanding heart to judge Your people and to discern between good and evil." And it pleased the Lord that Solomon had made this request.\n\nSolomon built the temple in Jerusalem, the dwelling place of the LORD among His people. At its dedication, the glory of the LORD filled the house, and Solomon prayed one of the great prayers of Scripture. But the book also records Solomon\'s downfall: his many foreign wives turned his heart after other gods, and the LORD announced that the kingdom would be torn from his son.\n\nAfter Solomon\'s death, the kingdom split. Rehoboam\'s harshness drove the ten northern tribes to follow Jeroboam, who set up golden calves at Dan and Bethel. The rest of the book traces the kings of the divided kingdom — the dynasty of Omri in the north and the line of David in the south — culminating in the ministry of the prophet Elijah, who confronted Ahab and the prophets of Baal on Mount Carmel:\n\n1 Kings 18:21 (BSB)\nThen Elijah approached all the people and said, "How long will you waver between two opinions? If the LORD is God, follow Him; but if Baal is God, follow him." But the people did not answer a word.\n\nThe book ends with Ahab slain in battle and the word of the LORD still burning in the mouth of Elijah — the history of a kingdom that refused to learn that the LORD alone is God.',
    keyScripture: [
      { reference: '1 Kings 3:9-10 (BSB)', text: '"Give Your servant an understanding heart to judge Your people and to discern between good and evil." And it pleased the Lord that Solomon had made this request.' },
      { reference: '1 Kings 8:27 (BSB)', text: 'But will God indeed dwell upon the earth? Even heaven, the highest heaven, cannot contain You, much less this temple I have built.' },
      { reference: '1 Kings 18:21 (BSB)', text: 'Then Elijah approached all the people and said, "How long will you waver between two opinions? If the LORD is God, follow Him; but if Baal is God, follow him."' },
    ],
    background:
      '1 Kings continues the story that ended in 2 Samuel. It covers roughly 120 years, from the last days of David around 971 BC to the death of Ahab around 852 BC. The book spans the golden age of Solomon, the division of the kingdom, and the beginning of the long conflict between the worship of the LORD and the worship of Baal.\n\nThe book can broadly be divided into three major sections:\n\n1 Kings 1–11 — Solomon and the Golden Age\nThe succession of Solomon, his wisdom and wealth, the building and dedication of the temple, and the turning of his heart after other gods.\n\n1 Kings 12–16 — The Division of the Kingdom\nThe split between Judah and Israel, Jeroboam\'s golden calves, and the early kings of both kingdoms, evaluated by their faithfulness to the LORD.\n\n1 Kings 17–22 — Elijah and the Conflict with Baal\nThe ministry of the prophet Elijah: the drought, the widow of Zarephath, the contest on Mount Carmel, and the confrontation with Ahab and Jezebel.\n\n1 Kings therefore tells the story of a nation that had every reason to trust the LORD — and the prophets God sent to call them back when they did not.',
    structure: [
      { range: '1–11', title: 'Solomon: wisdom, the temple, and the turning of his heart' },
      { range: '12–16', title: 'The divided kingdom: Rehoboam, Jeroboam, and the golden calves' },
      { range: '17–19', title: 'Elijah: the drought, Carmel, and the still small voice' },
      { range: '20–22', title: 'Ahab, the word of the LORD, and the prophet\'s mantle' },
    ],
    lessons:
      '1 Kings teaches that the heart is the battleground of faithfulness. Solomon began with a humble request for wisdom and ended with his heart turned after other gods. The book warns that prosperity and success can become the very instruments of spiritual decline.\n\nThe book teaches that obedience and blessing are linked. The history of the kings is told with a prophet\'s measuring line: those who walked in the ways of David did what was right; those who walked in the ways of Jeroboam led the people into sin.\n\n1 Kings teaches the sovereignty of God over rulers. God raised up Solomon, tore the kingdom from his son, and raised up Jeroboam and Ahab — and His word through the prophets shaped every turn of the story. Kings come and go; the word of the LORD stands.\n\nThe book teaches the power of faithful witness. Elijah stood alone against four hundred and fifty prophets of Baal, and the LORD answered by fire. One faithful prophet, armed with the word of God, was more than a match for the court of Ahab.\n\nThe book also teaches that God is not confined to temples. Solomon\'s own prayer confesses that the highest heaven cannot contain God. The temple was a sign of God\'s presence, not a limit upon it.\n\nMost of all, 1 Kings teaches the exclusiveness of true worship. "If the LORD is God, follow Him" — the call of Elijah remains the standing challenge to every generation of God\'s people.',
    applications: [
      'Guard your heart; prosperity can turn the wisest away from God.',
      'Ask God for wisdom before wealth or honor.',
      'Measure every decision by faithfulness to the LORD.',
      'Stand for the LORD even when you stand alone.',
      'Do not waver between two opinions; follow the LORD wholly.',
      'Remember that no temple, church, or institution contains God.',
      'Pass a legacy of faithfulness to the next generation.',
      'Hear the still small voice of God in the silence.',
    ],
    mainThemes: ['The glory and fall of Solomon', 'The divided kingdom', 'Covenant faithfulness and judgment', 'The exclusiveness of true worship', 'The ministry of the prophets', 'The sovereignty of God over history'],
    keyPeople: ['Solomon', 'David', 'Rehoboam', 'Jeroboam', 'Elijah', 'Ahab and Jezebel', 'Elisha'],
    keyVerses: [
      '1 Kings 3:9-10 (BSB) — "Give Your servant an understanding heart."',
      '1 Kings 8:27 (BSB) — "Even heaven, the highest heaven, cannot contain You."',
      '1 Kings 9:3 (BSB) — "I have heard your prayer and your petition... I have consecrated this temple."',
      '1 Kings 18:21 (BSB) — "How long will you waver between two opinions?"',
      '1 Kings 19:12 (BSB) — The still small voice after the wind, earthquake, and fire.',
    ],
    christConnection: '1 Kings points to Christ as the greater Son of David who builds the true temple — not a house of stone but the temple of His body (John 2:19-21). Solomon, the prince of peace who built the house of the LORD, foreshadows Jesus, the Prince of Peace who is Himself the dwelling place of God among men. The wisdom of Solomon surpasses all others, yet Jesus declares that One greater than Solomon is here (Matthew 12:42).',
  },
  {
    bookName: '2 Kings',
    author: 'Unknown, traditionally attributed to Jeremiah',
    authorDetail:
      'The author of 2 Kings is unknown. Like 1 Kings, it is attributed by Jewish tradition to the prophet Jeremiah, and scholars recognize it as the work of the Deuteronomic historian — written under the inspiration of God in the spirit of the covenant book of Deuteronomy.\n\nThe book draws on the official annals of the kings of Israel and Judah and on the records of the prophets, weaving them into a unified history that extends from the last days of Elijah to the fall of Jerusalem.\n\nIts perspective is prophetic throughout: the rise and fall of every king is measured by his obedience to the word of the LORD, and the prophets — Elisha, Isaiah, and others — stand at the center of the nation\'s story.',
    audience:
      '2 Kings was written to the people of Israel and Judah, especially to the exiles in Babylon, to explain the judgment that had overtaken the nation.\n\nThe book answers a painful question: why did Israel and Judah fall? Its answer is consistent and sobering — because they forsook the LORD, worshiped idols, and refused to listen to the prophets.\n\nAt the same time, the book preserved the hope of restoration: the line of David continued, the LORD remembered His covenant, and the closing release of Jehoiachin in Babylon hinted that God\'s purposes were not finished.',
    dateWritten: 'Approx. 852–586 BC (compiled after the exile began)',
    locationWritten: 'Judah and Babylon (compiled among the exiles)',
    chapters: 25,
    purpose:
      'To record the final two centuries of the divided kingdoms and the exile, demonstrating that covenant unfaithfulness brings judgment — and that God remains faithful to His promises even in judgment.\n\n2 Kings traces the fall of the northern kingdom to Assyria in 722 BC and the fall of Jerusalem to Babylon in 586 BC, showing that the prophets\' warnings were true and that the LORD alone is God.',
    keyTheme: 'The fall of Israel and Judah; the word of the LORD fulfilled',
    summary:
      '2 Kings opens with the translation of Elijah and the anointing of Elisha, who received a double portion of his master\'s spirit. Elisha\'s ministry was marked by wonders — the parting of the Jordan, the widow\'s oil, the healing of Naaman the Syrian, and the raising of the Shunammite\'s son — demonstrating that the God of Israel rules over all nations:\n\n2 Kings 5:15 (BSB)\nThen Naaman and all his attendants went back to the man of God, stood before him, and declared, "Now I know that there is no God in all the world except in Israel."\n\nThe book then traces the slow decline of both kingdoms. In the north, dynasty followed dynasty in bloodshed, and the people continued in the sins of Jeroboam. In the south, a few good kings — Hezekiah and Josiah — brought reform, but the nation\'s heart was not changed.\n\nHezekiah trusted the LORD when the Assyrian army surrounded Jerusalem, and God delivered the city miraculously. Josiah rediscovered the Book of the Law and led the greatest reform since David, but judgment was already certain.\n\nThe northern kingdom fell to Assyria in 722 BC, and the southern kingdom fell to Babylon in 586 BC. Jerusalem and the temple were destroyed, and the people were carried into exile. The book ends with a small but significant sign of hope:\n\n2 Kings 25:29-30 (BSB)\nAnd Jehoiachin changed out of his prison clothes and dined at the king\'s table for the rest of his life. And the king provided for him a daily portion for the rest of his life.\n\nThe line of David was not extinguished; the LORD\'s promises were not finished.',
    keyScripture: [
      { reference: '2 Kings 5:15 (BSB)', text: 'Then Naaman and all his attendants went back to the man of God, stood before him, and declared, "Now I know that there is no God in all the world except in Israel."' },
      { reference: '2 Kings 17:13 (BSB)', text: 'Yet the LORD warned Israel and Judah through all the prophets and seers: "Turn from your evil ways and keep My commandments and statutes, according to the entire Law that I commanded your fathers and sent to you through My servants the prophets."' },
      { reference: '2 Kings 19:19 (BSB)', text: 'But now, O LORD our God, please save us from his hand, so that all the kingdoms of the earth may know that You alone, O LORD, are God.' },
    ],
    background:
      '2 Kings continues the history of 1 Kings, covering roughly 265 years — from the last days of Elisha\'s master Elijah to the Babylonian exile. It is the tragic record of a nation that refused to learn, ending with the fulfillment of every warning the prophets had spoken.\n\nThe book can broadly be divided into four major sections:\n\n2 Kings 1–13 — Elisha and the Last Years of the Northern Kingdom\nThe ministry of Elisha, the dynasty of Jehu, and the slow decline of Israel toward Assyria.\n\n2 Kings 14–17 — The Fall of Israel\nThe final kings of the northern kingdom and its conquest by Assyria in 722 BC, explained as the result of covenant unfaithfulness.\n\n2 Kings 18–23 — Judah from Hezekiah to Josiah\nThe deliverance of Jerusalem under Hezekiah, the reforms of Josiah, and the discovery of the Book of the Law.\n\n2 Kings 24–25 — The Fall of Judah and the Exile\nThe Babylonian invasions, the destruction of Jerusalem and the temple in 586 BC, and the deportation of the people.\n\n2 Kings therefore records the cost of unbelief: the word of the LORD, spoken through the prophets for centuries, was fulfilled to the letter.',
    structure: [
      { range: '1–8', title: 'Elisha: the double portion and the wonders of the LORD' },
      { range: '9–13', title: 'Jehu\'s purge and the decline of the northern kingdom' },
      { range: '14–17', title: 'The fall of Israel to Assyria' },
      { range: '18–23', title: 'Judah: Hezekiah\'s faith and Josiah\'s reform' },
      { range: '24–25', title: 'The fall of Jerusalem and the Babylonian exile' },
    ],
    lessons:
      '2 Kings teaches that the word of the LORD is true. Every warning of the prophets — from the days of Elijah to the final days of Jerusalem — was fulfilled. God\'s word may seem slow, but it never fails.\n\nThe book teaches the cost of unbelief and idolatry. The northern kingdom fell to Assyria and the southern to Babylon for the same reason: they forsook the LORD and worshiped other gods. Judgment is not arbitrary; it is the harvest of covenant unfaithfulness.\n\n2 Kings teaches that genuine faith trusts God in the face of overwhelming odds. Hezekiah spread the Assyrian threat before the LORD, and God delivered Jerusalem. Naaman came to the man of God in humility and was healed. Faith takes God at His word.\n\nThe book teaches the danger of religious reform without heart change. Josiah was the most faithful king since David, yet the LORD\'s judgment on Judah was not turned aside — the people\'s hearts had not truly returned to God.\n\nThe book also teaches that the LORD is God over all nations. The wonders of Elisha and the deliverance of Hezekiah were signs to the nations that the God of Israel alone is God.\n\nMost of all, 2 Kings teaches hope in the midst of judgment. The book ends in exile — but with the king of Judah alive and honored in Babylon, a sign that God had not forgotten His covenant with David.',
    applications: [
      'Take the warnings of God\'s word seriously; they will be fulfilled.',
      'Forsake every idol and serve the LORD alone.',
      'Trust God when the odds seem overwhelming.',
      'Seek heart change, not merely outward reform.',
      'Spread your fears before the LORD in prayer, as Hezekiah did.',
      'Remember that God is Lord over all nations and powers.',
      'Hope in God even in the darkest of circumstances.',
      'Preserve and obey the Book of the Law, as Josiah did.',
    ],
    mainThemes: ['The word of the LORD fulfilled', 'Judgment on covenant unfaithfulness', 'The exclusiveness of true worship', 'Faith in the face of overwhelming odds', 'The faithfulness of God to His covenant', 'Hope after exile'],
    keyPeople: ['Elisha', 'Jehu', 'Hezekiah', 'Isaiah the prophet', 'Manasseh', 'Josiah', 'Jeremiah the prophet'],
    keyVerses: [
      '2 Kings 5:15 (BSB) — "Now I know that there is no God in all the world except in Israel."',
      '2 Kings 6:16 (BSB) — "Do not be afraid, for those who are with us are more than those who are with them."',
      '2 Kings 17:13 (BSB) — "Turn from your evil ways and keep My commandments."',
      '2 Kings 19:19 (BSB) — "You alone, O LORD, are God."',
      '2 Kings 25:29-30 (BSB) — Jehoiachin honored at the king\'s table in Babylon.',
    ],
    christConnection: '2 Kings points to Christ as the true King who, unlike the failed kings of Israel and Judah, always does what is right in the eyes of the LORD. The line of David survived the exile — Jehoiachin lived on in Babylon — so that the Messiah could one day come from David\'s house. The prophets who called the nation to return to God point to Jesus, who is Himself the Word of the LORD made flesh, and the temple destroyed in 586 BC foreshadows the temple of His body, destroyed and raised in three days.',
  },
  {
    bookName: '1 Chronicles',
    author: 'Unknown, traditionally attributed to Ezra',
    authorDetail:
      'The author of 1 Chronicles is unknown, but Jewish tradition attributes it to Ezra the scribe, who led the return from exile and taught the people the Law of Moses.\n\nThe Chronicler wrote from a priestly and Levitical perspective, emphasizing the temple, worship, and the line of David. He drew on the books of Samuel and Kings and on the official genealogical records of Israel, compiling them under divine inspiration for the generation that had returned from Babylon.\n\nThe book\'s genealogies, lists of Levites, and attention to temple worship show a writer whose heart was set on the worship of the LORD in the house He had promised to David.',
    audience:
      '1 Chronicles was written to the people of Israel after the exile, the generation that had returned to a ruined land and a rebuilt temple.\n\nThe book reminded them who they were — the descendants of Abraham, heirs of the promises, and a people called to worship the LORD. It traced their genealogies from Adam, celebrated the line of David, and showed that the temple and its worship stood at the center of their identity.\n\nThe book encouraged the returned exiles to rebuild their life around the worship of God, just as David had organized the Levites and prepared for the temple.',
    dateWritten: 'Approx. 450–430 BC',
    locationWritten: 'Jerusalem (after the return from exile)',
    chapters: 29,
    purpose:
      'To record the genealogies of Israel and the reign of David, emphasizing the temple, worship, and the promises of God to the house of David.\n\n1 Chronicles retells the history of Israel from a priestly perspective to encourage the returned exiles: the people of God have a glorious heritage, a faithful God, and a calling to worship Him in His house.',
    keyTheme: 'The line of David, the temple, and worship; God\'s faithfulness to His people',
    summary:
      '1 Chronicles opens with nine chapters of genealogies, tracing the people of God from Adam through Abraham, Isaac, and Jacob, through the tribes of Israel, and down to the line of David. These lists were not dry records for the returned exiles; they were the proof that God had kept His promises — the nation was still the people of the covenant.\n\nThe book then turns to the reign of David, told not as a political history but as the story of a king whose heart was set on the worship of the LORD. When David brought the ark of the covenant to Jerusalem, the people celebrated with singing and sacrifice. David\'s prayer of praise captures the heart of the book:\n\n1 Chronicles 16:34 (BSB)\nGive thanks to the LORD, for He is good; His loving devotion endures forever.\n\nDavid desired to build a house for the LORD, and God responded with a promise that shaped the rest of biblical history:\n\n1 Chronicles 17:11-12 (BSB)\n"And when your days are fulfilled and you go to be with your fathers, I will raise up your offspring after you, one of your own sons, and I will establish his kingdom. He will build a house for Me, and I will establish his throne forever."\n\nThe book closes with David\'s final preparations: the organization of the Levites for temple service, the gifts for the building, and the coronation of Solomon. David\'s charge to his son is the heart of the book:\n\n1 Chronicles 28:9 (BSB)\n"And you, my son Solomon, know the God of your father, and serve Him with a whole heart and a willing mind, for the LORD searches every heart and understands the intent of every thought."',
    keyScripture: [
      { reference: '1 Chronicles 16:34 (BSB)', text: 'Give thanks to the LORD, for He is good; His loving devotion endures forever.' },
      { reference: '1 Chronicles 17:11-12 (BSB)', text: '"I will raise up your offspring after you, one of your own sons, and I will establish his kingdom. He will build a house for Me, and I will establish his throne forever."' },
      { reference: '1 Chronicles 28:9 (BSB)', text: '"Know the God of your father, and serve Him with a whole heart and a willing mind, for the LORD searches every heart and understands the intent of every thought."' },
    ],
    background:
      '1 and 2 Chronicles were written after the exile, probably by Ezra the scribe, to encourage the returned community. Where Samuel and Kings trace the political history of the monarchy, Chronicles retells the story from the standpoint of worship: the temple, the priesthood, and the line of David stand at the center.\n\nThe book can broadly be divided into two major sections:\n\n1 Chronicles 1–9 — The Genealogies\nThe descent of the people of God from Adam to the return from exile, emphasizing the tribes of Israel, the Levites, and the line of David.\n\n1 Chronicles 10–29 — The Reign of David\nThe death of Saul, David\'s coronation, the bringing of the ark to Jerusalem, the promise of an eternal throne, David\'s mighty men, and his final preparations for the temple.\n\n1 Chronicles therefore tells the story of David the worshiper: the king who brought the ark home, organized the Levites, prepared for the temple, and handed his son a legacy of wholehearted service to the LORD.',
    structure: [
      { range: '1–9', title: 'The genealogies: from Adam to the return from exile' },
      { range: '10–12', title: 'The death of Saul and the rise of David' },
      { range: '13–17', title: 'The ark in Jerusalem and the covenant with David' },
      { range: '18–21', title: 'David\'s victories, his mighty men, and his census' },
      { range: '22–29', title: 'Preparations for the temple and the coronation of Solomon' },
    ],
    lessons:
      '1 Chronicles teaches the faithfulness of God across generations. The genealogies are a monument to covenant faithfulness: through exile, ruin, and return, the people of God endured because God kept His promises.\n\nThe book teaches the priority of worship. The Chronicler tells the story of David around the ark, the Levites, and the temple. Worship is not one activity among many; it is the center of the people\'s life.\n\n1 Chronicles teaches wholehearted devotion. David\'s charge to Solomon — to know God and serve Him with a whole heart and a willing mind — is the book\'s summons to every reader. God searches every heart and understands every thought.\n\nThe book teaches that God looks for faithfulness in ordinary service. Chapters of Levites, gatekeepers, musicians, and temple servants show that every role in the worship of God matters.\n\nThe book also teaches thanksgiving. "Give thanks to the LORD, for He is good" is the refrain of the book: gratitude is the fitting response of a people who know God\'s loving devotion endures forever.\n\nMost of all, 1 Chronicles teaches that the promises of God are sure. The covenant with David — an eternal throne — was given by grace, survived the exile, and pointed forward to the Messiah.',
    applications: [
      'Know the God of your fathers and serve Him wholeheartedly.',
      'Make worship the center of your life.',
      'Give thanks to the LORD, for His loving devotion endures forever.',
      'Serve faithfully in whatever role God has given you.',
      'Pass a legacy of faith to the next generation.',
      'Remember that God searches every heart.',
      'Trust the promises of God across generations.',
      'Prepare the way for the next generation, as David did for Solomon.',
    ],
    mainThemes: ['The faithfulness of God across generations', 'The line of David', 'Worship and the temple', 'Wholehearted devotion', 'Thanksgiving and praise', 'Preparation for the house of the LORD'],
    keyPeople: ['David', 'Solomon', 'Saul', 'The Levites', 'Zadok the priest', 'Asaph the musician', 'Joab'],
    keyVerses: [
      '1 Chronicles 16:34 (BSB) — "Give thanks to the LORD, for He is good; His loving devotion endures forever."',
      '1 Chronicles 17:11-12 (BSB) — "I will establish his throne forever."',
      '1 Chronicles 28:9 (BSB) — "Serve Him with a whole heart and a willing mind."',
      '1 Chronicles 4:10 (BSB) — Jabez: "Oh that You would bless me and enlarge my territory!"',
      '1 Chronicles 29:11 (BSB) — "Yours, O LORD, is the greatness and the power and the glory."',
    ],
    christConnection: '1 Chronicles points to Christ through the covenant with David: God promised an eternal throne to David\'s house, and Jesus Christ is the Son of David whose kingdom will never end. The temple that David prepared and Solomon built foreshadows Christ, who is the true temple of God, and the worship of the LORD that stands at the center of Chronicles finds its fulfillment in Jesus, through whom believers offer spiritual sacrifices acceptable to God.',
  },
  {
    bookName: '2 Chronicles',
    author: 'Unknown, traditionally attributed to Ezra',
    authorDetail:
      'The author of 2 Chronicles is unknown, but Jewish tradition attributes it, with 1 Chronicles, to Ezra the scribe.\n\nWriting after the exile for the returned community, the Chronicler told the story of the southern kingdom of Judah with a single focus: the temple, its worship, and the faithfulness of the kings to the LORD. He drew on the books of Kings and on the records of the prophets — Isaiah, Jeremiah, and others — compiling them under divine inspiration.\n\nThe book\'s recurring evaluation of the kings — "he did what was right in the eyes of the LORD" or "he did evil" — shows a writer measuring all of history by the standard of covenant faithfulness.',
    audience:
      '2 Chronicles was written to the people of Israel after the exile, who had returned to Jerusalem to rebuild the temple and the city.\n\nThe book encouraged them by showing that the temple stood at the center of the nation\'s history and that seeking the LORD had always brought blessing. It called the returned community to learn from the kings: those who humbled themselves and sought God were delivered; those who forsook Him were judged.\n\nThe book closed with the decree of Cyrus, which the returned exiles were themselves fulfilling — the LORD had kept His word and brought His people home.',
    dateWritten: 'Approx. 450–430 BC',
    locationWritten: 'Jerusalem (after the return from exile)',
    chapters: 36,
    purpose:
      'To record the history of the kings of Judah and the temple, emphasizing the blessing of seeking the LORD and the judgment of forsaking Him.\n\n2 Chronicles retells the story of the southern kingdom with a priestly heart: the temple, its worship, and the faithfulness of the kings stand at the center, and the book ends with the decree of Cyrus that sent the exiles home to rebuild the house of the LORD.',
    keyTheme: 'The temple and the kings of Judah; seeking the LORD brings blessing',
    summary:
      '2 Chronicles opens with the reign of Solomon, whose first act was to seek the LORD at Gibeon. When God asked what he desired, Solomon answered:\n\n2 Chronicles 1:10 (BSB)\n"Give me wisdom and knowledge, that I may lead this people, for who can judge this great people of Yours?"\n\nSolomon built the temple in Jerusalem, and at its dedication the glory of the LORD filled the house. The book records Solomon\'s prayer and the LORD\'s answer, which contains one of the most-quoted promises in Scripture:\n\n2 Chronicles 7:14 (BSB)\n"And if My people who are called by My name humble themselves and pray and seek My face and turn from their wicked ways, then I will hear from heaven, forgive their sin, and heal their land."\n\nAfter Solomon, the book traces the kings of Judah — Rehoboam, Abijah, Asa, Jehoshaphat, Joash, Hezekiah, Manasseh, Josiah, and the rest. Some kings sought the LORD and brought revival; others forsook Him and brought judgment. The book is full of turning points: Asa\'s reform, Jehoshaphat\'s faith in battle, Hezekiah\'s Passover and deliverance from Assyria, and Josiah\'s rediscovery of the Book of the Law.\n\nBut the nation\'s unfaithfulness finally brought the judgment the prophets had warned of. Jerusalem fell to Babylon in 586 BC, the temple was burned, and the people were carried into exile.\n\nThe book ends with a note of hope that the returned exiles were living out:\n\n2 Chronicles 36:23 (BSB)\n"This is what Cyrus king of Persia says: The LORD, the God of heaven, has given me all the kingdoms of the earth and has appointed me to build a house for Him at Jerusalem in Judah. Whoever among you belongs to His people, may the LORD his God be with him, and may he go up."\n\nThe temple was rebuilt, and the people of God were home.',
    keyScripture: [
      { reference: '2 Chronicles 7:14 (BSB)', text: '"And if My people who are called by My name humble themselves and pray and seek My face and turn from their wicked ways, then I will hear from heaven, forgive their sin, and heal their land."' },
      { reference: '2 Chronicles 16:9 (BSB)', text: 'For the eyes of the LORD roam throughout the earth to show Himself strong on behalf of those whose hearts are fully devoted to Him.' },
      { reference: '2 Chronicles 20:15 (BSB)', text: 'He said, "Listen, all you people of Judah and Jerusalem! ... Do not be afraid or discouraged because of this vast army. For the battle is not yours, but God\'s."' },
    ],
    background:
      '2 Chronicles continues the history of 1 Chronicles, covering the reign of Solomon and the kings of Judah from the division of the kingdom to the exile — roughly four centuries, from about 971 BC to 586 BC.\n\nWhere the book of Kings covers both the northern and southern kingdoms, Chronicles focuses entirely on Judah and the temple. The book can broadly be divided into three major sections:\n\n2 Chronicles 1–9 — Solomon and the Temple\nSolomon\'s wisdom, the building and dedication of the temple, and the glory of his reign.\n\n2 Chronicles 10–28 — The Kings of Judah to Hezekiah\nThe division of the kingdom and the reigns of the kings of Judah, with the recurring pattern of faithfulness and apostasy.\n\n2 Chronicles 29–36 — From Hezekiah to the Exile\nHezekiah\'s reform and deliverance, Manasseh\'s repentance, Josiah\'s reform, the fall of Jerusalem, and the decree of Cyrus.\n\n2 Chronicles therefore tells the story of the temple and the kings who honored or dishonored it — and of a God who hears the prayers of those who humble themselves and seek His face.',
    structure: [
      { range: '1–9', title: 'Solomon: wisdom, the temple, and the glory of the LORD' },
      { range: '10–16', title: 'The divided kingdom and the early kings of Judah' },
      { range: '17–28', title: 'Jehoshaphat to Ahaz: faithfulness and apostasy in Judah' },
      { range: '29–33', title: 'Hezekiah\'s reform and Manasseh\'s repentance' },
      { range: '34–36', title: 'Josiah\'s reform, the fall of Jerusalem, and the decree of Cyrus' },
    ],
    lessons:
      '2 Chronicles teaches that seeking the LORD is the way of blessing. The book\'s recurring testimony is that kings who sought God were delivered and kings who forsook Him were judged. The eyes of the LORD roam the earth to show Himself strong on behalf of those whose hearts are fully devoted to Him.\n\nThe book teaches the power of humility and prayer. The promise of 2 Chronicles 7:14 — humble yourselves, pray, seek My face, turn from wicked ways — is the divinely given prescription for revival and healing.\n\n2 Chronicles teaches that it is never too late to return to God. Manasseh, the most wicked king of Judah, humbled himself in exile and was restored. The worst history can be redeemed by repentance.\n\nThe book teaches that the battle is the LORD\'s. Jehoshaphat faced a vast army with nothing but prayer and praise, and God fought for Judah. Faith begins where self-sufficiency ends.\n\nThe book teaches the importance of the Word of God. Josiah\'s reform began with the discovery of the Book of the Law; the nation was changed when the Word was read and obeyed.\n\nMost of all, 2 Chronicles teaches the steadfast love of God. Even when the nation\'s unfaithfulness brought judgment, God remembered His covenant — and the book ends with the decree that sent His people home.',
    applications: [
      'Seek the LORD with your whole heart; His eyes roam the earth for the devoted.',
      'Humble yourself, pray, and turn from wicked ways.',
      'Let the battle be the LORD\'s; trust Him with overwhelming odds.',
      'Restore the Word of God to the center of your life.',
      'Repent and return, no matter how far you have fallen.',
      'Rebuild what sin has torn down.',
      'Pass on a legacy of seeking God to the next generation.',
      'Give thanks: the LORD keeps His promises to His people.',
    ],
    mainThemes: ['The temple and its worship', 'Seeking the LORD brings blessing', 'Humility, prayer, and revival', 'The faithfulness of God to His covenant', 'The kings of Judah', 'Hope after judgment'],
    keyPeople: ['Solomon', 'Rehoboam', 'Asa', 'Jehoshaphat', 'Hezekiah', 'Manasseh', 'Josiah'],
    keyVerses: [
      '2 Chronicles 7:14 (BSB) — "If My people... humble themselves and pray... I will heal their land."',
      '2 Chronicles 16:9 (BSB) — "The eyes of the LORD roam throughout the earth."',
      '2 Chronicles 20:15 (BSB) — "The battle is not yours, but God\'s."',
      '2 Chronicles 30:9 (BSB) — "The LORD your God is gracious and merciful."',
      '2 Chronicles 36:23 (BSB) — The decree of Cyrus: "May the LORD his God be with him, and may he go up."',
    ],
    christConnection: '2 Chronicles points to Christ through the temple, the house of the LORD that Solomon built and the exiles rebuilt — foreshadowing Jesus, who is the true temple of God and in whom God dwells among His people. The promise to David of an eternal throne is fulfilled in Jesus, the Son of David. The book\'s call to humble ourselves, pray, seek God\'s face, and turn from wicked ways is answered fully in Christ, through whom God hears, forgives, and heals His people.',
  },
  {
    bookName: 'Ezra',
    author: 'Ezra the scribe',
    authorDetail:
      'The book of Ezra was written by Ezra the scribe, a priest and expert in the Law of Moses who led the second return of exiles to Jerusalem around 458 BC. Ezra is described as one "who had devoted himself to the study and observance of the Law of the LORD, and to teaching its statutes and ordinances in Israel" (Ezra 7:10).\n\nThe book bears the marks of his hand: the first part draws on official Persian records and the lists of returning exiles, while the second part is written in the first person as Ezra himself records his journey to Jerusalem and his reforms.\n\nJewish tradition also attributes the books of Chronicles and Nehemiah to Ezra, and Christians have traditionally understood the book to have been written under the inspiration of God.',
    audience:
      'Ezra was written to the people of Israel who had returned from Babylonian exile, and to every generation of God\'s people.\n\nThe book encouraged the returned community to rebuild the temple and to rebuild their lives around the Word of God. It showed that the LORD had kept His promises — He had stirred the heart of Cyrus to send His people home — and that He was faithful to those who sought Him.\n\nThe reforms of Ezra also taught the returned community that holiness matters: the people of God were to be distinct, faithful, and obedient to the covenant.',
    dateWritten: 'Approx. 538–457 BC',
    locationWritten: 'Jerusalem (with records from Babylon and Persia)',
    chapters: 10,
    purpose:
      'To record the return of the Jews from exile, the rebuilding of the temple, and the reformation of the people through the Word of God.\n\nEzra shows that God is faithful to His promises — He moved the heart of a pagan king to send His people home, preserved them through opposition, and raised up Ezra to restore the nation around the Law of the LORD.',
    keyTheme: 'Return from exile, the rebuilt temple, and restoration through the Word',
    summary:
      'Ezra opens with the decree of Cyrus in 538 BC, which fulfilled the prophecy of Jeremiah that the exile would last seventy years:\n\nEzra 1:2-3 (BSB)\n"This is what Cyrus king of Persia says: The LORD, the God of heaven, has given me all the kingdoms of the earth and has appointed me to build a house for Him at Jerusalem in Judah. Whoever among you belongs to His people, may the LORD his God be with him, and may he go up."\n\nNearly fifty thousand exiles returned under Zerubbabel and Joshua the high priest. They rebuilt the altar, laid the foundation of the temple, and wept and shouted together as the new foundation was laid. When opposition from surrounding peoples stalled the work, the prophets Haggai and Zechariah stirred the people to finish it, and the temple was completed and dedicated in 516 BC.\n\nThe second half of the book records the return of Ezra himself around 458 BC. Ezra was a scribe skilled in the Law of Moses:\n\nEzra 7:10 (BSB)\nFor Ezra had devoted himself to the study and observance of the Law of the LORD, and to teaching its statutes and ordinances in Israel.\n\nWhen Ezra learned that the people had intermarried with the surrounding nations and adopted their practices, he prayed a great prayer of confession and led the community to put away the foreign marriages and renew their covenant with God. The book closes with the people restored around the Word of the LORD — the temple rebuilt, and the community recommitted to holiness.',
    keyScripture: [
      { reference: 'Ezra 1:2-3 (BSB)', text: '"This is what Cyrus king of Persia says: The LORD, the God of heaven, has given me all the kingdoms of the earth and has appointed me to build a house for Him at Jerusalem in Judah. Whoever among you belongs to His people, may the LORD his God be with him, and may he go up."' },
      { reference: 'Ezra 7:10 (BSB)', text: 'For Ezra had devoted himself to the study and observance of the Law of the LORD, and to teaching its statutes and ordinances in Israel.' },
      { reference: 'Ezra 9:15 (BSB)', text: 'O LORD, God of Israel, You are righteous! For we remain as a remnant today, here we are before You in our guilt, though because of it no one can stand in Your presence.' },
    ],
    background:
      'Ezra records the first chapters of the restoration of Israel after the Babylonian exile. The book covers roughly eighty years, from the decree of Cyrus in 538 BC to the reforms of Ezra around 457 BC. It is the story of two returns: the first under Zerubbabel to rebuild the temple, and the second under Ezra to rebuild the people.\n\nThe book can broadly be divided into two major sections:\n\nEzra 1–6 — The Return and the Rebuilt Temple\nThe decree of Cyrus, the return under Zerubbabel, the laying of the foundation, the opposition that stalled the work, and the completion of the temple under Haggai and Zechariah in 516 BC.\n\nEzra 7–10 — The Return of Ezra and the Reformation of the People\nEzra\'s journey to Jerusalem, his prayer of confession, and the covenant renewal that separated the community from the practices of the surrounding nations.\n\nEzra therefore tells the story of restoration in two movements: the house of God rebuilt, and the people of God reformed.',
    structure: [
      { range: '1–2', title: 'The decree of Cyrus and the first return under Zerubbabel' },
      { range: '3–6', title: 'Rebuilding the temple: foundation, opposition, and dedication' },
      { range: '7–8', title: 'The return of Ezra and his journey to Jerusalem' },
      { range: '9–10', title: 'Confession, covenant renewal, and the reformation of the people' },
    ],
    lessons:
      'Ezra teaches that God is sovereign over the nations. He moved the heart of Cyrus, the most powerful ruler on earth, to send His people home. God works through the decisions of kings to accomplish His purposes.\n\nThe book teaches the priority of the Word of God. Ezra devoted himself to the study, observance, and teaching of the Law — and the restoration of the people followed. A revived people is a people restored to the Word.\n\nEzra teaches the power of prayer and confession. When Ezra learned of the people\'s sin, he did not minimize it or despair; he prayed, confessed, and led the community back to covenant faithfulness.\n\nThe book teaches perseverance through opposition. The returned exiles faced opposition, discouragement, and delay — but the prophets stirred them, and they finished the work. The temple was completed in the face of every obstacle.\n\nThe book teaches the importance of holiness. Ezra\'s reforms remind the people of God that they are called to be distinct — faithful to God in a world of competing allegiances.\n\nMost of all, Ezra teaches that God keeps His promises. Jeremiah had prophesied seventy years of exile; Cyrus\'s decree fulfilled it. The LORD who promised to restore His people did exactly what He said.',
    applications: [
      'Devote yourself to the study, observance, and teaching of God\'s Word.',
      'Trust God\'s sovereignty over rulers and nations.',
      'Pray and confess sin honestly; do not minimize it.',
      'Persevere through opposition; finish the work God gives you.',
      'Rebuild what has been torn down.',
      'Live as a distinct people, faithful to the covenant.',
      'Give God the glory for every restoration.',
      'Remember: God keeps His promises.',
    ],
    mainThemes: ['God\'s sovereignty over the nations', 'Restoration after exile', 'The rebuilt temple', 'The priority of the Word', 'Prayer and confession', 'Holiness and covenant faithfulness'],
    keyPeople: ['Ezra', 'Zerubbabel', 'Joshua the high priest', 'Haggai the prophet', 'Zechariah the prophet', 'Cyrus king of Persia', 'Artaxerxes king of Persia'],
    keyVerses: [
      'Ezra 1:2-3 (BSB) — "Whoever among you belongs to His people, may he go up."',
      'Ezra 3:11 (BSB) — "For He is good; His loving devotion to Israel endures forever."',
      'Ezra 6:14 (BSB) — The elders finished building, "for they prospered through the prophesying of Haggai and Zechariah."',
      'Ezra 7:10 (BSB) — "Ezra had devoted himself to the study and observance of the Law of the LORD."',
      'Ezra 9:15 (BSB) — "O LORD, God of Israel, You are righteous!"',
    ],
    christConnection: 'Ezra points to Christ as the true restorer of God\'s people. The temple that Zerubbabel rebuilt and Ezra re-consecrated foreshadows Jesus, who declared that He Himself is the temple of God and who cleansed the temple as an act of divine authority. Ezra, the scribe who taught the people the Word of the LORD, points to Jesus, the Word made flesh who teaches with authority. And the restoration of the exiles to Jerusalem prefigures the gathering of God\'s people in Christ.',
  },
  {
    bookName: 'Nehemiah',
    author: 'Nehemiah, with Ezra the scribe',
    authorDetail:
      'The book of Nehemiah was written by Nehemiah, the son of Hachaliah, a Jewish cupbearer to the Persian king Artaxerxes who was appointed governor of Judah around 445 BC. Much of the book is written in the first person from Nehemiah\'s own memoirs, giving a vivid and honest account of his leadership.\n\nNehemiah recorded his famous short prayers throughout the book — "Remember me, O my God, for good" — showing a leader who combined bold action with constant dependence on God.\n\nThe book also contains the records of Ezra the scribe, including the reading of the Law and the covenant renewal at the end of the book, and Christians have traditionally understood it to have been written under the inspiration of God.',
    audience:
      'Nehemiah was written to the people of Israel who had returned from exile and rebuilt the temple, and to every generation of God\'s people.\n\nThe book encouraged the returned community to complete the work of restoration — not only the wall of Jerusalem but the life of the people. It showed that God answers the prayers of His people and gives them courage for the work He calls them to do.\n\nNehemiah also taught the community that the Word of God must stand at the center: when the people heard the Law read, they wept, repented, and renewed their covenant with the LORD.',
    dateWritten: 'Approx. 445–432 BC',
    locationWritten: 'Jerusalem (with the court of Persia)',
    chapters: 13,
    purpose:
      'To record the rebuilding of the walls of Jerusalem and the spiritual reformation of the people under Nehemiah\'s leadership.\n\nNehemiah shows what God can do through a man of prayer and action: the walls were rebuilt in fifty-two days, and the people were restored to the Word, the worship, and the covenant of the LORD.',
    keyTheme: 'Rebuilding the walls; prayer, leadership, and covenant renewal',
    summary:
      'Nehemiah opens in the Persian capital, where Nehemiah, the king\'s cupbearer, received word that Jerusalem lay in ruins:\n\nNehemiah 1:4 (BSB)\nWhen I heard these words, I sat down and wept. I mourned for days, fasting and praying before the God of heaven.\n\nAfter four months of prayer, the king granted Nehemiah\'s request to return to Jerusalem and rebuild the city. Nehemiah inspected the walls by night, then rallied the people with words that still inspire God\'s people:\n\nNehemiah 2:20 (BSB)\nI answered them, "The God of heaven will grant us success. We, His servants, will start rebuilding."\n\nDespite the mockery of Sanballat, Tobiah, and Geshem, and despite threats of attack, the people worked with one hand and held a weapon with the other — and the wall was completed in fifty-two days.\n\nBut Nehemiah knew the wall was not enough. He called Ezra to read the Book of the Law to the assembled people. The people stood from early morning until midday to hear the Word, and they wept when they understood it. Ezra and Nehemiah urged them:\n\nNehemiah 8:10 (BSB)\nThen Nehemiah told them, "Go and eat what is rich, drink what is sweet, and send portions to those who have nothing prepared. This day is holy to our Lord. Do not grieve, for the joy of the LORD is your strength."\n\nThe people celebrated the Feast of Tabernacles, confessed their sins, and renewed the covenant. Nehemiah closed his memoirs with further reforms — the separation of the people from foreign practices, the restoration of the tithe, and the keeping of the Sabbath — and with his repeated prayer: "Remember me with favor, O my God" (Nehemiah 13:31).',
    keyScripture: [
      { reference: 'Nehemiah 2:20 (BSB)', text: 'I answered them, "The God of heaven will grant us success. We, His servants, will start rebuilding."' },
      { reference: 'Nehemiah 8:10 (BSB)', text: 'Then Nehemiah told them, "Go and eat what is rich, drink what is sweet, and send portions to those who have nothing prepared. This day is holy to our Lord. Do not grieve, for the joy of the LORD is your strength."' },
      { reference: 'Nehemiah 9:6 (BSB)', text: 'You alone are the LORD. You created the heavens, even the highest heavens, and all their host; the earth and all that is upon it, the seas and all that is in them. You give life to all things, and the host of heaven worships You.' },
    ],
    background:
      'Nehemiah continues the story of Ezra. The temple had been rebuilt in 516 BC, but the walls of Jerusalem still lay in ruins, leaving the city defenseless and the people discouraged. Nehemiah, a high official in the Persian court, was moved by the report from Jerusalem to act.\n\nThe book can broadly be divided into two major sections:\n\nNehemiah 1–7 — Rebuilding the Wall\nNehemiah\'s prayer, his commission from the king, the inspection of the ruins, the organization of the work, the opposition of Sanballat and Tobiah, and the completion of the wall in fifty-two days.\n\nNehemiah 8–13 — Rebuilding the People\nThe reading of the Law by Ezra, the celebration of the feasts, confession and covenant renewal, the repopulation of Jerusalem, the dedication of the wall, and Nehemiah\'s final reforms.\n\nNehemiah therefore tells one story in two movements: the walls rebuilt so the city was secure, and the people renewed so the covenant was kept.',
    structure: [
      { range: '1–2', title: 'Nehemiah\'s prayer, his commission, and the night inspection' },
      { range: '3–4', title: 'Rebuilding the wall amid opposition and threats' },
      { range: '5–7', title: 'Justice among the people and the completion of the wall' },
      { range: '8–10', title: 'The reading of the Law, confession, and covenant renewal' },
      { range: '11–13', title: 'Dedication, reforms, and Nehemiah\'s final memoirs' },
    ],
    lessons:
      'Nehemiah teaches the power of prayer combined with action. Nehemiah prayed before he spoke to the king, prayed as he worked, and prayed when he was opposed. His constant prayer — "Remember me, O my God" — was the engine of his leadership.\n\nThe book teaches that God honors those who act on their compassion. Nehemiah did not merely weep over Jerusalem; he inspected the ruins, organized the work, and rebuilt the wall. Faith works.\n\nNehemiah teaches perseverance through opposition. Sanballat mocked, Tobiah schemed, and enemies threatened attack — but Nehemiah kept the people focused: "I am carrying on a great work, so I cannot come down" (Nehemiah 6:3). Great work requires refusing distraction.\n\nThe book teaches that physical restoration is not enough. Nehemiah knew the wall meant nothing without the Word. He brought Ezra to read the Law, and the people were transformed when they heard and understood the Scriptures.\n\nThe book teaches the joy of the LORD. "The joy of the LORD is your strength" — the people were strengthened not by their circumstances but by their God.\n\nMost of all, Nehemiah teaches servant leadership: a leader who prays, works alongside the people, refuses to exploit his position, and gives God the glory.',
    applications: [
      'Pray before you act, and act on your prayers.',
      'Weep over what breaks God\'s heart, then go rebuild it.',
      'Carry on a great work; do not come down to every distraction.',
      'Work with one hand and hold a weapon with the other.',
      'Put the Word of God at the center of restoration.',
      'Let the joy of the LORD be your strength.',
      'Lead by serving, not by exploiting.',
      'Finish the work God has given you.',
    ],
    mainThemes: ['Prayer and dependence on God', 'Rebuilding and restoration', 'Courageous leadership', 'Perseverance through opposition', 'The centrality of the Word', 'Covenant renewal'],
    keyPeople: ['Nehemiah', 'Ezra', 'Artaxerxes king of Persia', 'Sanballat', 'Tobiah', 'Geshem', 'The people of Jerusalem'],
    keyVerses: [
      'Nehemiah 1:4 (BSB) — "I sat down and wept... fasting and praying before the God of heaven."',
      'Nehemiah 2:20 (BSB) — "The God of heaven will grant us success. We, His servants, will start rebuilding."',
      'Nehemiah 6:3 (BSB) — "I am carrying on a great work, so I cannot come down."',
      'Nehemiah 8:10 (BSB) — "The joy of the LORD is your strength."',
      'Nehemiah 13:31 (BSB) — "Remember me with favor, O my God."',
    ],
    christConnection: 'Nehemiah points to Christ as the great restorer of God\'s people. Just as Nehemiah left the comfort of the Persian court to rebuild the ruins of Jerusalem, Christ left the glory of heaven to restore the ruins of fallen humanity. The walls of Jerusalem rebuilt for the protection of God\'s people foreshadow the salvation with which Christ protects His church, and the joy of the LORD that strengthened the returned exiles is the joy of salvation that strengthens all who trust in Him.',
  },
  {
    bookName: 'Esther',
    author: 'Unknown, traditionally attributed to Mordecai or Ezra',
    authorDetail:
      'The author of the book of Esther is unknown. Jewish tradition attributes it to Mordecai, one of the central figures of the story, or to Ezra the scribe. The author was clearly a Jew who knew the Persian court well and wrote under the inspiration of God to preserve the account of the deliverance of the Jews.\n\nThe book displays remarkable knowledge of Persian customs, the palace at Susa, and the workings of the royal court, and it explains the origin of the feast of Purim, which Jews have observed ever since.\n\nNotably, the book never mentions the name of God — yet His providence is woven through every line: the right person, in the right place, at the right time, guiding the deliverance of His people.',
    audience:
      'Esther was written to the Jewish people scattered throughout the Persian empire, and to every generation of God\'s people.\n\nThe book taught the Jews of the dispersion that God had not forgotten them — even in a foreign land, under a pagan king, His providence was at work. It established the feast of Purim so that the deliverance would be remembered and celebrated forever.\n\nFor believers, Esther is the classic demonstration that God works behind the scenes, using ordinary people in ordinary positions to accomplish extraordinary purposes.',
    dateWritten: 'Approx. 465–460 BC',
    locationWritten: 'Persia (the royal citadel of Susa)',
    chapters: 10,
    purpose:
      'To record the deliverance of the Jews from Haman\'s plot and to explain the origin of the feast of Purim.\n\nEsther demonstrates the providence of God: though His name is never mentioned, His hand is unmistakable — raising Esther "for such a time as this" to save His people from destruction.',
    keyTheme: 'Divine providence, courage, and the deliverance of God\'s people',
    summary:
      'Esther is set in the Persian empire during the reign of King Ahasuerus (Xerxes I). When Queen Vashti was deposed, the king sought a new queen, and a young Jewish woman named Esther was chosen — though she kept her identity hidden at the urging of her cousin Mordecai.\n\nThe villain of the story is Haman, a high official who was enraged when Mordecai refused to bow to him. Haman cast lots (pur) to choose the day for destroying the Jews and persuaded the king to issue a decree of annihilation.\n\nMordecai sent word to Esther that she must risk her life to approach the king, and his words have echoed through the centuries:\n\nEsther 4:14 (BSB)\n"For if you remain silent at this time, relief and deliverance will arise for the Jews from another place, but you and your father\'s house will perish. And who knows if perhaps you have come to the kingdom for such a time as this?"\n\nEsther fasted, approached the king uninvited, and was received with favor. Through two banquets she exposed Haman\'s plot before the king, and Haman was hanged on the very gallows he had built for Mordecai.\n\nThe king issued a new decree allowing the Jews to defend themselves, and the tables were turned on their enemies. The Jews celebrated their deliverance with feasting and gladness:\n\nEsther 8:17 (BSB)\nAnd many of the people of the land became Jews, because the fear of the Jews had fallen upon them.\n\nThe book closes with the institution of the feast of Purim — named for the lots Haman had cast — a permanent reminder that God turned the intended destruction of His people into their deliverance.',
    keyScripture: [
      { reference: 'Esther 4:14 (BSB)', text: '"For if you remain silent at this time, relief and deliverance will arise for the Jews from another place, but you and your father\'s house will perish. And who knows if perhaps you have come to the kingdom for such a time as this?"' },
      { reference: 'Esther 4:16 (BSB)', text: '"Go, gather together all the Jews who are in Susa, and fast for me. Do not eat or drink for three days, night or day. I and my maidens will fast as you do. And when this is done, I will go to the king, even though it is against the law. And if I perish, I perish."' },
      { reference: 'Esther 8:17 (BSB)', text: 'And many of the people of the land became Jews, because the fear of the Jews had fallen upon them.' },
    ],
    background:
      'Esther is set in the royal citadel of Susa during the reign of Ahasuerus, generally identified with Xerxes I, who ruled Persia from 486 to 465 BC. The Jewish people had remained in Persia after the return to Jerusalem, and the book records the threat that faced them in the diaspora.\n\nThe book can broadly be divided into three major sections:\n\nEsther 1–2 — The Setting: Esther Becomes Queen\nThe deposition of Vashti, the search for a new queen, and the elevation of Esther, with Mordecai uncovering a plot against the king.\n\nEsther 3–7 — The Crisis: Haman\'s Plot and Esther\'s Courage\nHaman\'s decree of annihilation, Mordecai\'s challenge, Esther\'s fasting and appeal, the two banquets, and the exposure and execution of Haman.\n\nEsther 8–10 — The Deliverance: The Jews Saved and Purim Instituted\nThe new decree, the triumph of the Jews over their enemies, the establishment of the feast of Purim, and the exaltation of Mordecai.\n\nEsther is therefore the story of a deliverance so complete that it is still celebrated: the feast of Purim, a permanent witness to the providence of God.',
    structure: [
      { range: '1–2', title: 'The setting: Vashti deposed and Esther made queen' },
      { range: '3', title: 'The crisis: Haman\'s decree against the Jews' },
      { range: '4–7', title: 'The courage: Esther\'s fast, her appeal, and the fall of Haman' },
      { range: '8–10', title: 'The deliverance: the Jews saved and the feast of Purim' },
    ],
    lessons:
      'Esther teaches the providence of God. God\'s name never appears in the book, yet His hand is everywhere: the right orphan girl became queen, the right sleepless night reminded the king of Mordecai\'s loyalty, and the right moment exposed Haman. God works behind the scenes of ordinary life.\n\nThe book teaches that God places His people for a purpose. "Who knows if perhaps you have come to the kingdom for such a time as this?" — Esther was not randomly positioned; she was providentially placed for the deliverance of her people.\n\nEsther teaches the courage that comes from faith. Esther risked her life by approaching the king uninvited. "If I perish, I perish" is the language of a faith that counts the cost and obeys anyway.\n\nThe book teaches the importance of wise counsel and faithful friends. Mordecai\'s challenge and Esther\'s obedience show the power of godly relationships in moments of crisis.\n\nThe book teaches that pride is destroyed and humility exalted. Haman built gallows for Mordecai and was hanged on them himself; the man who sought his own honor was brought down, and the faithful servant was raised up.\n\nMost of all, Esther teaches that the purposes of God cannot be defeated. Haman cast lots to destroy the Jews, but the LORD turned the plot into their deliverance — and the feast of Purim still celebrates it.',
    applications: [
      'Trust God\'s providence in the ordinary events of life.',
      'Recognize that God may have placed you where you are for such a time as this.',
      'Act with courage when faithfulness requires risk.',
      'Fast and pray in times of crisis.',
      'Give wise counsel and receive it.',
      'Refuse pride; walk in humility.',
      'Celebrate and remember God\'s deliverances.',
      'Stand with God\'s people in their hour of need.',
    ],
    mainThemes: ['Divine providence', 'Courage and risk for God\'s people', 'Pride versus humility', 'The deliverance of God\'s people', 'Faithfulness in a foreign land', 'Remembering God\'s mighty acts'],
    keyPeople: ['Esther', 'Mordecai', 'King Ahasuerus (Xerxes)', 'Haman', 'Vashti', 'The Jews of the empire'],
    keyVerses: [
      'Esther 4:14 (BSB) — "Who knows if perhaps you have come to the kingdom for such a time as this?"',
      'Esther 4:16 (BSB) — "If I perish, I perish."',
      'Esther 6:13 (BSB) — "If Mordecai, before whom you have begun to fall, is of Jewish descent, you will not overcome him."',
      'Esther 8:17 (BSB) — "Many of the people of the land became Jews."',
      'Esther 9:22 (BSB) — The days "on which the Jews gained relief from their enemies... as a day for feasting and joy."',
    ],
    christConnection: 'Esther points to Christ as the great Deliverer of God\'s people. Just as Esther risked her life to save her people from destruction, Christ laid down His life to save His people from sin and death. The providence that raised Esther to the throne "for such a time as this" finds its ultimate expression in the cross, where God turned the worst evil of history into the greatest good — the salvation of the world.',
  },
  {
    bookName: 'Job',
    author: 'Unknown (the events concern Job; the book may have been written by Job, Moses, or another inspired author)',
    authorDetail:
      'The author of the book of Job is unknown. Jewish tradition has variously attributed it to Moses, to Job himself, or to Elihu, and modern scholarship generally regards the author as an unnamed Israelite sage who wrote under the inspiration of God.\n\nThe book shows deep familiarity with the wisdom traditions of the ancient Near East, yet its theology is uniquely biblical: it demolishes the easy assumption that suffering is always the punishment for personal sin.\n\nThe events of the book are set in the patriarchal age — the land of Uz, sacrifices offered by a family head, and wealth measured in livestock — suggesting a very early setting, while the book\'s final form may date from the time of Solomon or later.',
    audience:
      'Job was written to the people of God in every age who wrestle with the problem of suffering.\n\nThe book addresses one of the most difficult questions of human existence: why do the righteous suffer? It was given to correct the simplistic teaching that suffering is always the result of personal sin, and to teach God\'s people to trust Him even when His ways are beyond understanding.\n\nFor believers facing loss, illness, and inexplicable pain, Job speaks with unusual honesty — and points beyond the storm to the sovereign God who is worthy of trust.',
    dateWritten: 'Uncertain; events of the patriarchal age, written later',
    locationWritten: 'The land of Uz (east of Israel)',
    chapters: 42,
    purpose:
      'To explore the problem of human suffering and the sovereignty of God, demonstrating that God is worthy of trust even when His purposes are hidden.\n\nJob shows that suffering is not always the consequence of personal sin, that human wisdom cannot fully explain God\'s ways, and that the right response to inexplicable suffering is humble trust in the God who knows what He is doing.',
    keyTheme: 'Suffering, the sovereignty of God, and faithful endurance',
    summary:
      'Job opens with a scene in heaven that the sufferer on earth never sees. Satan challenged God: does Job fear God for nothing, or only because he has been blessed? God allowed Satan to test Job, confident in His servant\'s faith.\n\nIn a single day, Job lost his livestock, his servants, and all ten of his children. He responded with words that have comforted mourners ever since:\n\nJob 1:21 (BSB)\n"Naked I came from my mother\'s womb, and naked I will return. The LORD gives, and the LORD takes away. Blessed be the name of the LORD."\n\nStruck with painful sores, Job sat in ashes, and his three friends came to comfort him. But their comfort became accusation: they insisted that his suffering must be punishment for hidden sin. Job protested his innocence, demanded an audience with God, and wrestled honestly with the darkness.\n\nAfter the friends exhausted their arguments and the young Elihu spoke, God Himself answered Job out of the whirlwind, overwhelming him with questions about the creation He alone governs. Job could not answer — but he could repent of his presumption and trust:\n\nJob 42:5-6 (BSB)\n"My ears had heard of You, but now my eyes have seen You. Therefore I retract my words, and I repent in dust and ashes."\n\nThe book closes with God\'s rebuke of the friends and His restoration of Job — twice the wealth he had before, seven sons and three daughters, and a long and full life. The man who trusted God without understanding was vindicated, and the book\'s great confession stands:\n\nJob 19:25 (BSB)\nBut I know that my Redeemer lives, and in the end He will stand upon the earth.',
    keyScripture: [
      { reference: 'Job 1:21 (BSB)', text: '"Naked I came from my mother\'s womb, and naked I will return. The LORD gives, and the LORD takes away. Blessed be the name of the LORD."' },
      { reference: 'Job 19:25 (BSB)', text: 'But I know that my Redeemer lives, and in the end He will stand upon the earth.' },
      { reference: 'Job 42:5-6 (BSB)', text: '"My ears had heard of You, but now my eyes have seen You. Therefore I retract my words, and I repent in dust and ashes."' },
    ],
    background:
      'Job belongs to the wisdom literature of the Old Testament, alongside Proverbs and Ecclesiastes. Its setting is the land of Uz, east of Israel, in the patriarchal age — a time when the family head offered sacrifices and wealth was counted in flocks and herds.\n\nThe book can broadly be divided into five major sections:\n\nJob 1–2 — The Prologue in Heaven and on Earth\nThe heavenly dialogue between God and Satan, Job\'s losses, his affliction, and the arrival of his three friends.\n\nJob 3–31 — The Dialogues\nJob\'s lament, the three cycles of speeches between Job and Eliphaz, Bildad, and Zophar, and Job\'s final speeches, including his great confession of the living Redeemer.\n\nJob 32–37 — The Speeches of Elihu\nThe young Elihu challenges both Job and the friends, insisting that God is just and that suffering can be a means of instruction.\n\nJob 38–41 — The Voice of God\nGod answers Job out of the whirlwind, questioning him about the creation and the creatures that only God can govern.\n\nJob 42 — The Restoration\nJob\'s repentance, God\'s rebuke of the friends, and the restoration of Job\'s fortune and family.\n\nJob is therefore the Bible\'s most searching treatment of suffering — an honest book that refuses easy answers and points to the sovereign God.',
    structure: [
      { range: '1–2', title: 'The prologue: the heavenly challenge and Job\'s losses' },
      { range: '3–31', title: 'The dialogues: Job and his three friends' },
      { range: '32–37', title: 'The speeches of Elihu' },
      { range: '38–41', title: 'The voice of God from the whirlwind' },
      { range: '42', title: 'Job\'s repentance and the restoration of his fortunes' },
    ],
    lessons:
      'Job teaches that suffering is not always the punishment for sin. The friends were certain Job\'s pain was caused by hidden transgression — and God said they were wrong. The righteous can and do suffer, and their pain is not a verdict on their character.\n\nThe book teaches the sovereignty of God. God does not explain His purposes to Job; He reveals His power and wisdom instead. The message is not that we will always understand, but that we can always trust the One who does.\n\nJob teaches honest lament. Job raged, questioned, and wept — and God received his cries. The book gives believers permission to bring their deepest pain and hardest questions to God.\n\nThe book teaches the danger of false comfort. The friends spoke orthodox-sounding words, but their counsel was cruel and wrong. True comfort does not presume to explain another\'s suffering.\n\nJob teaches faithful endurance. "The LORD gives, and the LORD takes away. Blessed be the name of the LORD" — Job worshiped in his worst moment, and his perseverance became a model for the faithful.\n\nMost of all, Job teaches hope in the Redeemer. In the depths of his suffering, Job confessed that his Redeemer lives — a hope that finds its fulfillment in Jesus Christ, the Redeemer who stood upon the earth and rose from the dead.',
    applications: [
      'Trust God when you cannot understand His ways.',
      'Bring your honest pain and questions to God.',
      'Do not presume to explain another person\'s suffering.',
      'Worship God in the midst of loss.',
      'Refuse the lie that suffering always means hidden sin.',
      'Hold fast to the hope of the living Redeemer.',
      'Endure with faith; the end of the story is restoration.',
      'Speak truth, but speak it with compassion.',
    ],
    mainThemes: ['The problem of suffering', 'The sovereignty of God', 'Honest lament', 'The wisdom of God versus human wisdom', 'Faithful endurance', 'Hope in the Redeemer'],
    keyPeople: ['Job', 'Eliphaz the Temanite', 'Bildad the Shuhite', 'Zophar the Naamathite', 'Elihu', 'Satan', 'Job\'s wife'],
    keyVerses: [
      'Job 1:21 (BSB) — "The LORD gives, and the LORD takes away. Blessed be the name of the LORD."',
      'Job 13:15 (BSB) — "Though He slay me, yet will I trust in Him."',
      'Job 19:25 (BSB) — "I know that my Redeemer lives."',
      'Job 23:10 (BSB) — "He knows the way I take; when He has tested me, I will come forth as gold."',
      'Job 42:5-6 (BSB) — "My ears had heard of You, but now my eyes have seen You."',
    ],
    christConnection: 'Job points to Christ as the living Redeemer — the Goel who stands upon the earth and gives His people hope beyond the grave (Job 19:25). Jesus is the righteous sufferer whom Job foreshadows: like Job, He was tested and afflicted, yet without sin, and through His suffering He accomplished a redemption that Job could only glimpse. The restored fortunes of Job foreshadow the full restoration that Christ brings to all who trust in Him.',
  },
  {
    bookName: 'Ecclesiastes',
    author: 'Solomon ("the Teacher")',
    authorDetail:
      'The book of Ecclesiastes was written by "the Teacher" — in Hebrew, Qoheleth — who identifies himself as "son of David, king in Jerusalem" (Ecclesiastes 1:1). Jewish and Christian tradition identify him with Solomon, the son of David, whose wealth, wisdom, and experience uniquely qualify him to speak on the meaning of life.\n\nSolomon had everything — wisdom, riches, pleasure, power, and the temple he built — and he tested them all. The book is his honest report from the other side of that experiment: he found that every pursuit "under the sun" ends in vanity.\n\nWritten under the inspiration of God, the book gathers the Teacher\'s searching reflections and closes with the counsel that has guided God\'s people ever since: fear God and keep His commandments.',
    audience:
      'Ecclesiastes was written to the people of God and to every searcher who has ever asked whether life has meaning.\n\nThe book speaks to those who have pursued success, pleasure, wisdom, or wealth and found them hollow. It addresses the honest questions of the human heart — what is the point of all our labor, and what endures after death?\n\nFor believers, Ecclesiastes is the wisdom that keeps the world in perspective: life under the sun is fleeting, but life lived in the fear of God is meaningful, joyful, and eternal.',
    dateWritten: 'Approx. 935 BC (the reign of Solomon)',
    locationWritten: 'Jerusalem',
    chapters: 12,
    purpose:
      'To demonstrate the vanity of life lived "under the sun" — apart from God — and to call readers to fear God and keep His commandments.\n\nEcclesiastes is the honest account of a man who tried everything the world offers and found it all vanity, so that his readers might learn without repeating the experiment: meaning is found not in the things of this world but in God.',
    keyTheme: 'The vanity of life under the sun; the fear of God as the whole of man',
    summary:
      'Ecclesiastes opens with the Teacher\'s startling verdict on life lived apart from God:\n\nEcclesiastes 1:2 (BSB)\n"Futility of futilities," says the Teacher, "futility of futilities! Everything is futile."\n\nThe Teacher then reports his great experiment. He pursued wisdom and knowledge, and found that much wisdom brings much sorrow. He built houses, planted vineyards, amassed silver and gold, and gathered singers and pleasures — and found it all vanity, a chasing after the wind. He observed that death comes to the wise and the foolish alike, and that human toil is soon forgotten.\n\nYet the book is not cynicism; it is realism that points beyond itself. The Teacher finds that the good gifts of life — food, work, and companionship — are to be received with gratitude from the hand of God:\n\nEcclesiastes 3:1 (BSB)\nTo everything there is a season, and a time for every purpose under heaven.\n\nHe urges his readers to enjoy life as God\'s gift while it lasts:\n\nEcclesiastes 9:7 (BSB)\nGo, eat your bread with joy, and drink your wine with a cheerful heart, for God has already approved your works.\n\nThe book closes with the Teacher\'s final word, the conclusion of the whole matter:\n\nEcclesiastes 12:13-14 (BSB)\nWhen all has been heard, the conclusion of the matter is this: Fear God and keep His commandments, for this is the whole duty of man. For God will bring every deed into judgment, along with every hidden thing, whether good or evil.\n\nEcclesiastes therefore leads the reader through the vanity of everything under the sun — to the one thing that endures: the fear of God.',
    keyScripture: [
      { reference: 'Ecclesiastes 1:2 (BSB)', text: '"Futility of futilities," says the Teacher, "futility of futilities! Everything is futile."' },
      { reference: 'Ecclesiastes 3:1 (BSB)', text: 'To everything there is a season, and a time for every purpose under heaven.' },
      { reference: 'Ecclesiastes 12:13-14 (BSB)', text: 'When all has been heard, the conclusion of the matter is this: Fear God and keep His commandments, for this is the whole duty of man. For God will bring every deed into judgment, along with every hidden thing, whether good or evil.' },
    ],
    background:
      'Ecclesiastes belongs to the wisdom literature of the Old Testament, and its author is identified as the Teacher, the son of David, king in Jerusalem — understood as Solomon. It reflects the unique vantage point of a man who had every advantage the world can offer and used them to test what truly satisfies.\n\nThe book can broadly be divided into three major sections:\n\nEcclesiastes 1–2 — The Problem Stated\nThe vanity of all things, the Teacher\'s experiment with wisdom, pleasure, and wealth, and his conclusion that all is vanity.\n\nEcclesiastes 3–11 — The Search Explored\nThe seasons of life, the injustices under the sun, the limits of human wisdom, the brevity of life, and the counsel to enjoy God\'s gifts and work diligently.\n\nEcclesiastes 12 — The Conclusion\nThe coming of old age, the whole duty of man, and the final judgment.\n\nEcclesiastes is therefore the Bible\'s realism: it refuses to pretend that the world apart from God offers lasting meaning, and it points the searching heart to the only sure foundation.',
    structure: [
      { range: '1–2', title: 'The vanity of all things and the Teacher\'s experiment' },
      { range: '3–5', title: 'The seasons of life and the fear of God' },
      { range: '6–8', title: 'The limits of wealth and wisdom under the sun' },
      { range: '9–11', title: 'Enjoy God\'s gifts and cast your bread upon the waters' },
      { range: '12', title: 'The conclusion: fear God and keep His commandments' },
    ],
    lessons:
      'Ecclesiastes teaches the vanity of life without God. The Teacher tested wisdom, pleasure, wealth, and work — and found them all futile in themselves. The book warns against building a life on anything under the sun.\n\nThe book teaches that the good gifts of life are from God. Food, work, marriage, and the simple joys of daily life are not distractions from meaning; received with gratitude, they are God\'s gifts to be enjoyed.\n\nEcclesiastes teaches the brevity of life. "To everything there is a season" — the book urges readers to number their days and live wisely, because life is short and death comes to all.\n\nThe book teaches the fear of God as the beginning of wisdom. After all the searching, the conclusion is simple and profound: fear God and keep His commandments. This is the whole duty of man.\n\nThe book teaches the reality of judgment. "God will bring every deed into judgment, along with every hidden thing" — life under the sun is not the whole story; there is an accounting to come.\n\nMost of all, Ecclesiastes teaches that meaning is found beyond the sun. The book\'s honest pessimism about life "under the sun" is designed to drive the reader to the God who is above the sun.',
    applications: [
      'Do not build your life on anything under the sun.',
      'Receive the good gifts of life with gratitude from God.',
      'Work diligently, for the night is coming when no one can work.',
      'Number your days and gain a heart of wisdom.',
      'Fear God and keep His commandments.',
      'Enjoy the life God has given you while you have it.',
      'Live in light of the final judgment.',
      'Find meaning in God, not in the things of this world.',
    ],
    mainThemes: ['The vanity of life under the sun', 'The brevity of life', 'The gifts of God to be enjoyed', 'The limits of human wisdom', 'The fear of God', 'The final judgment'],
    keyPeople: ['The Teacher (Solomon)', 'The people of the land', 'The young man addressed throughout'],
    keyVerses: [
      'Ecclesiastes 1:2 (BSB) — "Futility of futilities! Everything is futile."',
      'Ecclesiastes 3:1 (BSB) — "To everything there is a season."',
      'Ecclesiastes 5:15 (BSB) — "As he came from his mother\'s womb, so he will depart."',
      'Ecclesiastes 9:7 (BSB) — "Go, eat your bread with joy... for God has already approved your works."',
      'Ecclesiastes 12:13-14 (BSB) — "Fear God and keep His commandments, for this is the whole duty of man."',
    ],
    christConnection: 'Ecclesiastes points to Christ as the one who gives meaning to life under the sun. The Teacher searched for lasting significance in wisdom, pleasure, and work and found vanity; Jesus offers the life that is not vanity — eternal life in knowing God. Christ is the wisdom of God who came from above the sun to redeem those who live under it, and He will return to bring every deed into judgment, as the Teacher foretold.',
  },
  {
    bookName: 'Song of Solomon',
    author: 'Solomon',
    authorDetail:
      'The Song of Solomon (also called the Song of Songs, meaning the greatest song) is attributed to Solomon, the son of David and king of Israel, in its opening verse: "The Song of Songs, which is Solomon\'s" (Song of Solomon 1:1).\n\nSolomon was renowned for his wisdom and composed 1,005 songs (1 Kings 4:32), and this song — the greatest of them all — celebrates the beauty and sanctity of marital love.\n\nThe book is written as a dramatic poem featuring a young woman (the Shulamite), her beloved shepherd, and the daughters of Jerusalem. Christians have traditionally understood it to have been written under the inspiration of God and included in Scripture to teach the goodness of love within marriage.',
    audience:
      'The Song of Solomon was written to the people of Israel and to every generation of God\'s people, to celebrate the gift of love and marriage.\n\nIn a world that has always distorted love — ancient fertility cults, and modern license — the Song holds up the beauty of committed, exclusive, marital love as a gift from God.\n\nThe book also speaks of the love between God and His people: the prophets pictured Israel as the bride of the LORD, and the New Testament pictures the church as the bride of Christ. The Song has therefore been treasured as a picture of that covenant love.',
    dateWritten: 'Approx. 965 BC (the reign of Solomon)',
    locationWritten: 'Israel (Jerusalem and the countryside)',
    chapters: 8,
    purpose:
      'To celebrate the beauty, sanctity, and joy of marital love as a gift from God.\n\nThe Song of Solomon affirms that romantic love and sexual intimacy are good when enjoyed within the covenant of marriage, and it pictures — in its deepest sense — the love between the LORD and His people, and between Christ and His bride, the church.',
    keyTheme: 'The beauty and sanctity of marital love; the love of God for His people',
    summary:
      'The Song of Solomon is a collection of love poems celebrating the romance and marriage of a young woman and her beloved. It opens with the bride\'s longing and the mutual delight of the lovers:\n\nSong of Solomon 2:16 (BSB)\nMy beloved is mine and I am his; he pastures his flock among the lilies.\n\nThe song moves through courtship and wedding to the deepening intimacy of marriage, with some of the most beautiful poetry in Scripture. The lovers praise one another with lavish imagery — gardens, vineyards, doves, and lilies — and the bride declares the exclusiveness and power of love:\n\nSong of Solomon 8:6-7 (BSB)\nSet me as a seal upon your heart, as a seal upon your arm; for love is as strong as death, jealousy is as unrelenting as Sheol. Its flashes are flashes of fire, a blazing flame. Mighty waters cannot quench love; rivers cannot sweep it away.\n\nThe book closes with the lovers united and the bride\'s invitation to her beloved to come and enjoy the garden of their love.\n\nBecause the book pictures love as "a blazing flame" that "mighty waters cannot quench," it has always been read as more than a human romance: it is also the song of the covenant love between God and His people — a love that nothing can destroy.',
    keyScripture: [
      { reference: 'Song of Solomon 2:16 (BSB)', text: 'My beloved is mine and I am his; he pastures his flock among the lilies.' },
      { reference: 'Song of Solomon 8:6-7 (BSB)', text: 'Set me as a seal upon your heart, as a seal upon your arm; for love is as strong as death... Mighty waters cannot quench love; rivers cannot sweep it away.' },
    ],
    background:
      'The Song of Solomon is unique among the books of the Bible: it is a love poem with no mention of the Law, the covenant, or the name of God. Its place in Scripture testifies that the physical, romantic love of a husband and wife is a good gift of the Creator.\n\nThe book can be read in several movements, following the story of the lovers:\n\nSong of Solomon 1–3 — The Courtship\nThe bride\'s longing, the mutual admiration of the lovers, the search in the city, and the wedding day.\n\nSong of Solomon 3–5 — The Wedding and the Wedding Night\nThe procession of the king, the celebration of the marriage, and the delight of the lovers.\n\nSong of Solomon 5–8 — The Deepening of Love\nA brief separation, the bride\'s longing and search, the praise of the beloved, and the final union of the lovers.\n\nThe Song therefore celebrates the whole of marital love — longing, pursuit, commitment, intimacy, and the permanence of covenant love.',
    structure: [
      { range: '1–2', title: 'The courtship: longing, praise, and the garden of love' },
      { range: '3–4', title: 'The wedding: the procession and the wedding day' },
      { range: '5–7', title: 'The deepening: separation, longing, and reconciliation' },
      { range: '8', title: 'The seal of love: love as strong as death' },
    ],
    lessons:
      'The Song of Solomon teaches that love is a gift of God. In a world that has always debased love, the Song celebrates the beauty of committed, exclusive, marital love without embarrassment or shame.\n\nThe book teaches the sanctity of marriage. The love it celebrates is not casual or fleeting; it is covenant love — exclusive, faithful, and permanent. The bride declares, "My beloved is mine and I am his."\n\nThe Song teaches the power of love. "Love is as strong as death... Mighty waters cannot quench love" — the love celebrated here is not a passing emotion but a consuming, unquenchable commitment.\n\nThe book teaches the goodness of physical intimacy within marriage. Scripture does not blush at the Song; it honors the union of husband and wife as created by God.\n\nThe Song also teaches the love of God for His people. Read in the light of the prophets and the New Testament, the book pictures the covenant love of the LORD for Israel and of Christ for His bride, the church — a love that nothing can separate.\n\nMost of all, the Song teaches that love is to be cherished and guarded. "Set me as a seal upon your heart" — love is to be protected, treasured, and kept.',
    applications: [
      'Receive love and marriage as gifts of God.',
      'Guard the exclusiveness and permanence of covenant love.',
      'Celebrate and enjoy the intimacy of marriage.',
      'Let your love be as strong as death and unquenchable.',
      'Keep your heart and your vows faithfully.',
      'Reflect the love of God for His people in your relationships.',
      'Delight in your beloved as the lovers of the Song do.',
      'Cherish love as a seal upon your heart.',
    ],
    mainThemes: ['The sanctity of marital love', 'Covenant commitment', 'The joy of intimacy', 'Exclusive devotion', 'The love of God for His people', 'The permanence of true love'],
    keyPeople: ['The Shulamite (the bride)', 'The beloved (the groom)', 'The daughters of Jerusalem', 'King Solomon'],
    keyVerses: [
      'Song of Solomon 2:16 (BSB) — "My beloved is mine and I am his."',
      'Song of Solomon 4:7 (BSB) — "You are altogether beautiful, my darling; in you there is no flaw."',
      'Song of Solomon 6:3 (BSB) — "I am my beloved\'s and my beloved is mine."',
      'Song of Solomon 8:6-7 (BSB) — "Love is as strong as death... Mighty waters cannot quench love."',
    ],
    christConnection: 'The Song of Solomon pictures the love of Christ for His bride, the church. Just as the bride declares "My beloved is mine and I am his," Christ loves His people with an exclusive, covenant love, and believers belong to Him forever. The love that is "as strong as death" and that "mighty waters cannot quench" is a picture of the love of Christ — a love that even the cross could not extinguish, and that death itself cannot separate from His people (Romans 8:38-39).',
  },
  {
    bookName: 'Lamentations',
    author: 'Jeremiah the prophet',
    authorDetail:
      'The book of Lamentations was written by the prophet Jeremiah, according to Jewish tradition, and the book has been attributed to him throughout church history.\n\nJeremiah had prophesied for forty years that Jerusalem would fall if the nation did not repent — and he lived to see his warnings fulfilled when the Babylonians destroyed the city and the temple in 586 BC. The book is his inspired elegy over the ruins.\n\nThe book\'s five chapters are five lament poems, the first four written as acrostics in which each verse begins with a successive letter of the Hebrew alphabet — a deliberate, artful structure that gives the grief a shape and completeness.',
    audience:
      'Lamentations was written to the people of Judah who had survived the destruction of Jerusalem and were now in exile.\n\nThe book gave the survivors words for their grief and taught them to interpret their suffering: the catastrophe was the judgment of God upon the nation\'s sin, yet even in judgment, the LORD\'s mercies were new every morning.\n\nFor every generation of God\'s people who has faced devastation, Lamentations models honest grief, humble confession, and hope that clings to the faithfulness of God.',
    dateWritten: 'Approx. 586–585 BC (after the fall of Jerusalem)',
    locationWritten: 'Jerusalem (among the ruins)',
    chapters: 5,
    purpose:
      'To lament the destruction of Jerusalem and to teach God\'s people how to grieve, confess, and hope in the midst of judgment.\n\nLamentations gives voice to the sorrow of a devastated city, acknowledges that the catastrophe was the righteous judgment of God upon sin, and — at the very center of the book — clings to the mercy of the LORD, which is new every morning.',
    keyTheme: 'Grief over Jerusalem\'s fall; the steadfast love of the LORD in judgment',
    summary:
      'Lamentations opens with the city of Jerusalem personified as a widow sitting alone among the ruins:\n\nLamentations 1:1 (BSB)\nHow lonely lies the city, once so full of people! She who was great among the nations has become like a widow.\n\nThe book is a series of five laments over the destruction of Jerusalem and the temple in 586 BC. Jeremiah describes the horrors of the siege — famine, slaughter, and exile — and confesses that the catastrophe was the judgment of the LORD upon the nation\'s sin:\n\nLamentations 1:18 (BSB)\n"The LORD is righteous, for I have rebelled against His command. Listen, all you peoples; consider my suffering. My young men and maidens have gone into captivity."\n\nBut at the very center of the book stands one of the most beloved passages in all Scripture — the confession of hope in the midst of grief:\n\nLamentations 3:22-23 (BSB)\nBecause of the loving devotion of the LORD we are not consumed, for His mercies never fail. They are new every morning; great is Your faithfulness!\n\nThe poet urges the suffering people to wait quietly for the salvation of the LORD:\n\nLamentations 3:25-26 (BSB)\nThe LORD is good to those who wait for Him, to the soul who seeks Him. It is good to wait quietly for the salvation of the LORD.\n\nThe book closes with a final plea for restoration:\n\nLamentations 5:21 (BSB)\nRestore us to Yourself, O LORD, that we may be restored; renew our days as of old.\n\nLamentations therefore walks the path that every grieving believer must walk: honest sorrow, humble confession, and hope fixed on the mercies of God.',
    keyScripture: [
      { reference: 'Lamentations 1:18 (BSB)', text: '"The LORD is righteous, for I have rebelled against His command. Listen, all you peoples; consider my suffering. My young men and maidens have gone into captivity."' },
      { reference: 'Lamentations 3:22-23 (BSB)', text: 'Because of the loving devotion of the LORD we are not consumed, for His mercies never fail. They are new every morning; great is Your faithfulness!' },
      { reference: 'Lamentations 3:25-26 (BSB)', text: 'The LORD is good to those who wait for Him, to the soul who seeks Him. It is good to wait quietly for the salvation of the LORD.' },
    ],
    background:
      'Lamentations was written in the immediate aftermath of the most devastating event in Old Testament history: the Babylonian destruction of Jerusalem in 586 BC. The city walls were broken, the temple was burned, the king was blinded and led away in chains, and the people were carried into exile.\n\nThe book\'s five chapters correspond to five lament poems, and its structure is striking:\n\nLamentations 1–2 — The Sorrow of Zion\nTwo acrostic laments describing the desolation of Jerusalem and the LORD\'s righteous anger against His people.\n\nLamentations 3 — The Hope in the Midst of Grief\nThe great central poem: the poet\'s affliction, his remembrance of the LORD\'s mercies, and his counsel to wait quietly for salvation.\n\nLamentations 4–5 — The Confession and the Plea\nThe horrors of the siege recalled, the confession of the nation\'s sin, and the closing prayer for restoration.\n\nLamentations is therefore the Bible\'s book of grief: it teaches God\'s people that sorrow may be brought honestly before God, and that even in the darkest judgment, His mercies are new every morning.',
    structure: [
      { range: '1', title: 'The desolation of Jerusalem and the tears of Zion' },
      { range: '2', title: 'The anger of the LORD and the destruction of the city' },
      { range: '3', title: 'The center of hope: new mercies and waiting for salvation' },
      { range: '4', title: 'The horrors of the siege and the confession of sin' },
      { range: '5', title: 'The closing plea: restore us, O LORD' },
    ],
    lessons:
      'Lamentations teaches that grief may be brought honestly to God. The book does not hide its sorrow or rush to comfort; it weeps, questions, and remembers. God receives the honest lament of His people.\n\nThe book teaches that suffering is not meaningless. The poet interprets the catastrophe as the righteous judgment of God upon the nation\'s sin. There is a moral order to the universe, and sin has consequences.\n\nLamentations teaches the mercy of God in the midst of judgment. "Because of the loving devotion of the LORD we are not consumed, for His mercies never fail" — even in the worst devastation, God\'s people were not utterly destroyed, and His faithfulness endured.\n\nThe book teaches patient waiting on God. "It is good to wait quietly for the salvation of the LORD" — the response to devastation is not frantic self-rescue but humble trust in the God who saves.\n\nThe book teaches confession. "The LORD is righteous, for I have rebelled" — the way back to God begins with owning our sin rather than blaming Him.\n\nMost of all, Lamentations teaches hope. The darkest book of the Bible contains the brightest promise: the mercies of the LORD are new every morning, and great is His faithfulness.',
    applications: [
      'Bring your honest grief to God; He receives lament.',
      'Confess your sin rather than blaming God.',
      'Hold fast to the mercy of the LORD, new every morning.',
      'Wait quietly for the salvation of the LORD.',
      'Sing of God\'s faithfulness in the darkest night.',
      'Let judgment drive you to repentance, not despair.',
      'Pray for restoration: "Restore us to Yourself, O LORD."',
      'Comfort the grieving with hope, not platitudes.',
    ],
    mainThemes: ['Honest lament and grief', 'The judgment of God on sin', 'The mercies of the LORD', 'Waiting on God', 'Confession and repentance', 'Hope in the midst of devastation'],
    keyPeople: ['Jeremiah (the weeping poet)', 'The personified city of Jerusalem (Zion)', 'The survivors of the siege', 'The LORD'],
    keyVerses: [
      'Lamentations 1:1 (BSB) — "How lonely lies the city, once so full of people!"',
      'Lamentations 1:18 (BSB) — "The LORD is righteous, for I have rebelled against His command."',
      'Lamentations 3:22-23 (BSB) — "His mercies never fail. They are new every morning; great is Your faithfulness!"',
      'Lamentations 3:25-26 (BSB) — "It is good to wait quietly for the salvation of the LORD."',
      'Lamentations 5:21 (BSB) — "Restore us to Yourself, O LORD, that we may be restored."',
    ],
    christConnection: 'Lamentations points to Christ, the man of sorrows who was acquainted with grief. Jesus wept over Jerusalem — the city that would again be destroyed — and He Himself bore the judgment that Lamentations describes, taking the cup of God\'s wrath upon the cross. The mercies that are new every morning find their fullest expression in Christ, and the plea "Restore us to Yourself, O LORD" is answered in Him, through whom God restores His people and makes all things new.',
  },
  {
    bookName: 'Ezekiel',
    author: 'Ezekiel the priest and prophet',
    authorDetail:
      'The book of Ezekiel was written by Ezekiel, the son of Buzi, a priest who was carried into exile to Babylon in 597 BC, eleven years before the fall of Jerusalem. He received his prophetic call in the fifth year of his exile, by the Kebar River in Babylon, and ministered among the exiles for more than twenty years.\n\nEzekiel\'s double identity shaped his message: as a priest, he was consumed with the holiness of God and the glory of the temple; as a prophet, he announced the judgment that was coming upon an unclean nation and the restoration that God would accomplish.\n\nThe book is written almost entirely in the first person from Ezekiel\'s own testimony, and its visions, symbolic acts, and dates mark it as the carefully recorded ministry of an eyewitness, written under the inspiration of God.',
    audience:
      'Ezekiel was written to the people of Israel in exile in Babylon, and to the remnant still in Jerusalem before its fall.\n\nThe exiles needed to understand why the judgment had come: because the people had defiled the temple and forsaken the LORD, the glory of God had departed, and the city would fall. Ezekiel announced this in vivid visions and symbolic acts.\n\nBut Ezekiel also spoke hope. After the judgment, the book proclaims restoration: a new heart, a new spirit, a reunited people, and the glory of the LORD returning to a new temple — promises that sustained the exiles and point forward to the new covenant.',
    dateWritten: 'Approx. 593–571 BC',
    locationWritten: 'Babylon (among the exiles by the Kebar River)',
    chapters: 48,
    purpose:
      'To announce the judgment of God upon unfaithful Israel and the nations, and to proclaim the restoration that God would accomplish for His people.\n\nEzekiel declares that the LORD is holy and will vindicate His name, that the house of Israel will be judged for its sin, and that God will one day give His people a new heart and a new spirit, gather them from exile, and dwell among them forever.',
    keyTheme: 'The glory of the LORD, judgment on sin, and the promise of restoration',
    summary:
      'Ezekiel opens with one of the most awe-inspiring visions in Scripture: the glory of the LORD revealed in a storm cloud, with wheels within wheels and four living creatures, and a throne above them all. Ezekiel fell on his face, and the LORD called him to be a watchman for the house of Israel.\n\nMuch of the first half of the book consists of symbolic acts and visions announcing judgment. Ezekiel lay on his side to picture the siege of Jerusalem, ate bread baked over cow dung to picture the famine, and shaved his head to picture the scattering of the people. He declared that the city would fall — and it did, in 586 BC.\n\nThe heart of the book is the promise of spiritual transformation. God announced that He would give His people a new heart and a new spirit:\n\nEzekiel 36:26-27 (BSB)\n"I will give you a new heart and put a new spirit within you; I will remove your heart of stone and give you a heart of flesh. And I will put My Spirit within you and cause you to walk in My statutes and to carefully observe My ordinances."\n\nThe book also contains the vision of the valley of dry bones, where God brought an army of dead bones back to life — a picture of the restoration of the whole house of Israel:\n\nEzekiel 37:5 (BSB)\nThis is what the Lord GOD says to these bones: "I will cause breath to enter you, and you will live."\n\nEzekiel closes with the glorious vision of a new temple, the glory of the LORD returning to fill it, and a river of life flowing from the sanctuary to heal the land. The book ends with the name of the renewed city: "The LORD Is There" (Ezekiel 48:35).',
    keyScripture: [
      { reference: 'Ezekiel 36:26-27 (BSB)', text: '"I will give you a new heart and put a new spirit within you; I will remove your heart of stone and give you a heart of flesh. And I will put My Spirit within you and cause you to walk in My statutes and to carefully observe My ordinances."' },
      { reference: 'Ezekiel 37:5 (BSB)', text: 'This is what the Lord GOD says to these bones: "I will cause breath to enter you, and you will live."' },
      { reference: 'Ezekiel 11:19-20 (BSB)', text: '"I will give them singleness of heart and put a new spirit within them; I will remove their heart of stone and give them a heart of flesh, so that they may follow My statutes, keep My ordinances, and practice them. Then they will be My people, and I will be their God."' },
    ],
    background:
      'Ezekiel ministered among the exiles in Babylon during the most traumatic period of Israel\'s history. He was taken into exile in 597 BC with the first wave of captives, and his prophetic ministry spanned the final years of Jerusalem and the early years of the exile.\n\nThe book is carefully dated — more than any other prophetic book — and can broadly be divided into four major sections:\n\nEzekiel 1–24 — Judgment on Jerusalem\nEzekiel\'s call, the visions of the glory of God, the symbolic acts, and the oracles announcing the fall of Jerusalem and the departure of the glory of the LORD from the temple.\n\nEzekiel 25–32 — Judgment on the Nations\nOracles against Ammon, Moab, Edom, Philistia, Tyre, Sidon, and Egypt.\n\nEzekiel 33–39 — Restoration for Israel\nThe watchman\'s call, the shepherds of Israel, the new heart and new spirit, the valley of dry bones, and the defeat of Gog.\n\nEzekiel 40–48 — The Vision of the New Temple\nThe detailed vision of a new temple, the return of the glory of the LORD, the river of life, and the division of the land.\n\nEzekiel therefore spans the whole arc of God\'s dealings with His people: judgment for sin, and restoration by grace.',
    structure: [
      { range: '1–3', title: 'The call: the vision of the glory of the LORD' },
      { range: '4–24', title: 'Judgment on Jerusalem: symbolic acts and oracles' },
      { range: '25–32', title: 'Judgment on the nations' },
      { range: '33–39', title: 'Restoration: the new heart, dry bones, and the Spirit' },
      { range: '40–48', title: 'The new temple, the glory of the LORD, and the river of life' },
    ],
    lessons:
      'Ezekiel teaches the holiness and glory of God. The book opens with a vision of the glory of the LORD that leaves the prophet on his face, and its closing vision is the glory returning to the temple. God is holy, and His glory is the center of all things.\n\nThe book teaches the seriousness of sin. Ezekiel\'s symbolic acts — the siege, the famine, the shaved head — dramatize the cost of the nation\'s unfaithfulness. The glory of God departed from the temple because of sin.\n\nEzekiel teaches personal responsibility. "The soul who sins is the one who will die" (Ezekiel 18:20) — the book insists that each person is accountable before God, and that the righteous who turns from his righteousness and the wicked who turns from his wickedness will each be judged by his own ways.\n\nThe book teaches the grace of God\'s initiative. The new heart and new spirit are God\'s work: "I will give you a new heart... I will put My Spirit within you." Salvation is not a human achievement but a divine gift.\n\nEzekiel teaches hope beyond judgment. The valley of dry bones shows that God can bring life where there is nothing but death, and the river of life shows that His presence brings healing to the whole land.\n\nMost of all, Ezekiel teaches that God acts for His own name\'s sake. Again and again the book says, "Then they will know that I am the LORD." History is moving toward the knowledge of God — and toward the day when the LORD dwells with His people forever.',
    applications: [
      'Behold the glory and holiness of God; let it shape your life.',
      'Take sin seriously; it drives the presence of God away.',
      'Take personal responsibility for your walk with God.',
      'Receive the new heart and new spirit God gives.',
      'Hope in God, who raises the dead and restores the hopeless.',
      'Be a watchman: warn others faithfully.',
      'Long for the presence of God, the river of life.',
      'Live so that others may know that the LORD is God.',
    ],
    mainThemes: ['The glory and holiness of God', 'Judgment on sin', 'Personal responsibility', 'The new heart and new spirit', 'The restoration of Israel', 'The presence of God with His people'],
    keyPeople: ['Ezekiel', 'The house of Israel in exile', 'The elders of Israel', 'The glory of the LORD', 'Gog of Magog'],
    keyVerses: [
      'Ezekiel 11:19-20 (BSB) — "I will give them singleness of heart and put a new spirit within them."',
      'Ezekiel 18:20 (BSB) — "The soul who sins is the one who will die."',
      'Ezekiel 36:26-27 (BSB) — "I will give you a new heart... I will put My Spirit within you."',
      'Ezekiel 37:5 (BSB) — "I will cause breath to enter you, and you will live."',
      'Ezekiel 48:35 (BSB) — The city shall be called: "The LORD Is There."',
    ],
    christConnection: 'Ezekiel points to Christ as the true Shepherd of Israel — the one whom God promised to set over His flock, who will feed His sheep and be their Prince (Ezekiel 34:23-24). The new heart and new spirit promised through Ezekiel are the heart of the new covenant fulfilled in Christ and applied by the Holy Spirit (John 3:5; 2 Corinthians 3:3-6). The river of life from the temple pictures the living water Jesus gives (John 7:37-39), and the glory of the LORD returning to the temple is fulfilled in Jesus, the true temple in whom the glory of God dwells.',
  },
  {
    bookName: 'Daniel',
    author: 'Daniel the prophet',
    authorDetail:
      'The book of Daniel was written by Daniel himself, a young nobleman of Judah who was carried into exile to Babylon in 605 BC. Taken to the court of King Nebuchadnezzar, Daniel rose to become a trusted counselor of Babylonian and Persian kings, and his book records his life and visions over more than sixty years.\n\nDaniel is described as a man of exceptional wisdom and, above all, of faithful devotion to God — praying three times a day even when it cost him the lions\' den. Jesus Himself called Daniel "the prophet Daniel" (Matthew 24:15), confirming the book\'s prophetic character.\n\nThe book\'s first half is written largely in the third person, the second half in the first person from Daniel\'s own visions, and Christians have traditionally understood the whole to have been written under the inspiration of God.',
    audience:
      'Daniel was written to the people of God living in exile under pagan empires, and to every generation of believers who must remain faithful in a hostile world.\n\nThe book encouraged the exiles that God was sovereign over the empires of the world — that Babylon, Persia, Greece, and Rome rose and fell according to His purposes, and that His kingdom would one day fill the earth.\n\nFor believers facing pressure to conform, Daniel models uncompromising faithfulness: a young man who would not defile himself, three friends who would not bow to an idol, and a prophet who prayed to God rather than to a king.',
    dateWritten: 'Approx. 605–536 BC',
    locationWritten: 'Babylon (and the Persian court)',
    chapters: 12,
    purpose:
      'To show God\'s sovereignty over the empires of the world and to encourage God\'s people to remain faithful through exile and persecution.\n\nDaniel demonstrates that the Most High rules over the kingdoms of men, that He delivers those who trust Him, and that His kingdom — established by the Son of Man — will never be destroyed.',
    keyTheme: 'The sovereignty of God over the nations; faithfulness in exile',
    summary:
      'Daniel opens with the young prophet in Babylon, where he and his friends resolved not to defile themselves with the king\'s food. God gave them wisdom beyond all the wise men of Babylon, and Daniel interpreted the dreams and visions of the kings.\n\nWhen Nebuchadnezzar saw a statue of gold, silver, bronze, iron, and clay — the kingdoms of the world — Daniel declared that the God of heaven would set up a kingdom that would never be destroyed:\n\nDaniel 2:44 (BSB)\n"In the days of those kings, the God of heaven will set up a kingdom that will never be destroyed, nor will it be left to another people. It will shatter all these kingdoms and bring them to an end, and it will stand forever."\n\nDaniel\'s three friends, Shadrach, Meshach, and Abednego, refused to bow to the golden image and were thrown into the fiery furnace — where the Son of God walked with them. Daniel himself, faithful to his daily prayers, was thrown into the lions\' den:\n\nDaniel 6:22 (BSB)\n"My God sent His angel and shut the mouths of the lions. They have not harmed me, because I was found innocent in His sight."\n\nThe second half of the book records Daniel\'s visions of the empires of the world and the coming kingdom: the ram and the goat, the seventy weeks that would lead to the Messiah, and the great visions of the end. The book closes with the promise to Daniel himself:\n\nDaniel 12:3 (BSB)\n"And those who are wise will shine like the brightness of the heavens, and those who lead many to righteousness, like the stars forever and ever."',
    keyScripture: [
      { reference: 'Daniel 2:44 (BSB)', text: '"In the days of those kings, the God of heaven will set up a kingdom that will never be destroyed, nor will it be left to another people. It will shatter all these kingdoms and bring them to an end, and it will stand forever."' },
      { reference: 'Daniel 6:22 (BSB)', text: '"My God sent His angel and shut the mouths of the lions. They have not harmed me, because I was found innocent in His sight."' },
      { reference: 'Daniel 12:3 (BSB)', text: '"And those who are wise will shine like the brightness of the heavens, and those who lead many to righteousness, like the stars forever and ever."' },
    ],
    background:
      'Daniel ministered in Babylon and Persia for more than sixty years, from the first deportation in 605 BC to the third year of Cyrus. He served as a counselor to Nebuchadnezzar, Belshazzar, and Darius, witnessing the fall of Babylon to the Medes and Persians and living to see the return of the exiles begin.\n\nThe book can broadly be divided into two major sections:\n\nDaniel 1–6 — The Stories of Faithfulness\nCourt narratives: Daniel\'s resolve, the interpretation of Nebuchadnezzar\'s dream, the fiery furnace, the humbling of Nebuchadnezzar, the handwriting on the wall, and the lions\' den.\n\nDaniel 7–12 — The Visions of the Future\nDaniel\'s apocalyptic visions: the four beasts, the ram and the goat, the seventy weeks, the vision of the kings of the north and south, and the promise of resurrection.\n\nDaniel therefore spans both history and prophecy: the faithful servant of God in the courts of Babylon, and the seer who looked down the corridors of time to the coming kingdom of the Son of Man.',
    structure: [
      { range: '1', title: 'Daniel\'s resolve: faithfulness in the Babylonian court' },
      { range: '2–5', title: 'The dreams and visions of the kings: from Nebuchadnezzar to Belshazzar' },
      { range: '6', title: 'The lions\' den: the deliverance of the faithful' },
      { range: '7–9', title: 'Daniel\'s visions: the beasts, the ram and the goat, and the seventy weeks' },
      { range: '10–12', title: 'The final visions: the kings of the north and south, and the resurrection' },
    ],
    lessons:
      'Daniel teaches the sovereignty of God over the nations. Empire after empire — Babylon, Persia, Greece, Rome — appears and falls in the book, and God raises up and brings down every ruler. "The Most High rules over the kingdom of men" (Daniel 4:17).\n\nThe book teaches uncompromising faithfulness. Daniel would not defile himself; his friends would not bow to the idol; Daniel prayed to God rather than to the king. Their faithfulness was not reckless — it was costly, and God honored it.\n\nDaniel teaches the power of prayer. Daniel prayed three times a day, and his visions and the deliverances of the book flow from a life of prayer. The book records Daniel\'s great prayer of confession and his visions given in answer to prayer.\n\nThe book teaches that God delivers His people. The furnace and the lions\' den are the classic demonstrations that God is able to save — and that even when He does not, His servants will not bow to idols.\n\nDaniel teaches that history is moving toward the kingdom of God. The statue of the nations crumbles, and the stone cut without hands becomes a mountain filling the earth. The kingdoms of this world are becoming the kingdom of our Lord.\n\nMost of all, Daniel teaches the hope of resurrection. "Many who sleep in the dust of the earth will awake" (Daniel 12:2) — Daniel looks beyond history to the resurrection and the shining of the wise like the stars forever.',
    applications: [
      'Trust God\'s sovereignty over the nations and your circumstances.',
      'Resolve not to defile yourself; stay faithful in a hostile world.',
      'Make prayer the habit of your life.',
      'Stand firm when faithfulness is costly.',
      'Trust God to deliver — and refuse to bow to idols even if He does not.',
      'Study the Scriptures, as Daniel studied the prophecies.',
      'Live in the hope of the resurrection.',
      'Lead many to righteousness and shine like the stars.',
    ],
    mainThemes: ['The sovereignty of God over the nations', 'Faithfulness under pressure', 'The power of prayer', 'Divine deliverance', 'The kingdom of God', 'Resurrection and final hope'],
    keyPeople: ['Daniel', 'Shadrach, Meshach, and Abednego', 'Nebuchadnezzar', 'Belshazzar', 'Darius the Mede', 'Cyrus of Persia'],
    keyVerses: [
      'Daniel 2:44 (BSB) — "The God of heaven will set up a kingdom that will never be destroyed."',
      'Daniel 3:17-18 (BSB) — "Our God is able to deliver us... But even if He does not, we will not serve your gods."',
      'Daniel 4:17 (BSB) — "The Most High rules over the kingdom of men."',
      'Daniel 6:22 (BSB) — "My God sent His angel and shut the mouths of the lions."',
      'Daniel 12:3 (BSB) — "Those who are wise will shine like the brightness of the heavens."',
    ],
    christConnection: 'Daniel points to Christ as the Son of Man — the one to whom was given dominion, glory, and an everlasting kingdom (Daniel 7:13-14), a title Jesus took for Himself (Mark 14:62). The seventy weeks of Daniel lead to "Messiah the Prince" (Daniel 9:25), and the stone cut without hands that fills the earth pictures the kingdom of Christ that will never be destroyed. Daniel\'s three friends met the Son of God in the furnace, and Daniel looked forward to the resurrection that Christ would accomplish — the firstfruits of those who sleep.',
  },
  {
    bookName: 'Hosea',
    author: 'Hosea the prophet',
    authorDetail:
      'The book of Hosea was written by the prophet Hosea, son of Beeri, who ministered to the northern kingdom of Israel during the eighth century BC — in the days of Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah, and of Jeroboam son of Joash, king of Israel (Hosea 1:1).\n\nHosea\'s prophetic ministry is unique in Scripture: God commanded him to marry a woman who would be unfaithful, so that his own marriage would become a living parable of the LORD\'s covenant with unfaithful Israel.\n\nHosea ministered during the final decades of the northern kingdom, which fell to Assyria in 722 BC — and his book is the passionate record of a God who loves His people with an undying love, even when they break His heart.',
    audience:
      'Hosea was written to the northern kingdom of Israel in its final years, a nation that had turned from the LORD to idols and trusted in foreign alliances.\n\nThe book confronted Israel with its spiritual adultery — worshiping Baal and other gods — and announced the judgment that would come. But Hosea also proclaimed God\'s unfailing love: even after judgment, the LORD would heal His people and restore them.\n\nFor every generation of God\'s people, Hosea reveals the heart of God — wounded by unfaithfulness, yet unwilling to give up on those He loves.',
    dateWritten: 'Approx. 750–722 BC',
    locationWritten: 'The northern kingdom of Israel',
    chapters: 14,
    purpose:
      'To expose Israel\'s spiritual unfaithfulness, announce the coming judgment, and proclaim the undying love of God that will one day restore His people.\n\nHosea demonstrates that the LORD\'s covenant love is stronger than His people\'s sin: though Israel had played the harlot with other gods, God would woo her back, heal her, and love her freely.',
    keyTheme: 'The faithful love of God for unfaithful Israel',
    summary:
      'Hosea opens with God\'s astonishing command to the prophet:\n\nHosea 1:2 (BSB)\n"Go, take for yourself a wife of prostitution and children of unfaithfulness, because the land is committing flagrant acts of prostitution by forsaking the LORD."\n\nHosea\'s marriage to Gomer became a living parable: just as Gomer was unfaithful to Hosea, Israel was unfaithful to the LORD, running after Baal and the gods of the nations. The children of the marriage were given symbolic names — Jezreel, Lo-ruhamah ("no mercy"), and Lo-ammi ("not my people") — each announcing judgment.\n\nYet at the heart of the book stands God\'s undying love. Even in judgment, God\'s heart yearns for His people:\n\nHosea 11:8-9 (BSB)\n"How can I give you up, O Ephraim? How can I hand you over, O Israel? ... My heart is turned within Me; all My compassion is aroused. I will not execute the fury of My anger... For I am God and not man — the Holy One among you."\n\nThe book ends with a summons to return and a promise of restoration:\n\nHosea 14:4 (BSB)\n"I will heal their apostasy; I will love them freely, for My anger has turned away from them."\n\nHosea therefore reveals the deepest mystery of God\'s character: the Holy One who must judge sin is also the Lover who will not let His people go.',
    keyScripture: [
      { reference: 'Hosea 1:2 (BSB)', text: '"Go, take for yourself a wife of prostitution and children of unfaithfulness, because the land is committing flagrant acts of prostitution by forsaking the LORD."' },
      { reference: 'Hosea 11:8-9 (BSB)', text: '"How can I give you up, O Ephraim? How can I hand you over, O Israel? ... My heart is turned within Me; all My compassion is aroused. I will not execute the fury of My anger... For I am God and not man — the Holy One among you."' },
      { reference: 'Hosea 14:4 (BSB)', text: '"I will heal their apostasy; I will love them freely, for My anger has turned away from them."' },
    ],
    background:
      'Hosea ministered in the northern kingdom of Israel during its final decades, a period of political turmoil, moral decay, and rampant idolatry. The nation worshiped Baal, trusted in military alliances with Assyria and Egypt rather than the LORD, and oppressed the poor.\n\nThe book can broadly be divided into two major sections:\n\nHosea 1–3 — The Parable of Hosea\'s Marriage\nGod commands Hosea to marry the unfaithful Gomer, the children are given symbolic names, and Hosea redeems Gomer back — a living picture of God\'s love for His unfaithful people.\n\nHosea 4–14 — The Indictment and the Promise\nHosea\'s charges against Israel — idolatry, injustice, and empty religion — the announcement of judgment, and the final promise of healing and restoration.\n\nHosea is therefore the prophet of God\'s wounded love: the book that shows how deeply God grieves over sin, and how faithfully He pursues His people.',
    structure: [
      { range: '1–3', title: 'The parable: Hosea\'s marriage to unfaithful Gomer' },
      { range: '4–7', title: 'The indictment: Israel\'s idolatry and emptiness' },
      { range: '8–11', title: 'The judgment: sowing the wind and reaping the whirlwind' },
      { range: '12–14', title: 'The promise: return, healing, and the love of God' },
    ],
    lessons:
      'Hosea teaches the heart of God. More than any other prophet, Hosea reveals God\'s inner life: His grief over His people\'s unfaithfulness, His longing for them, and His unwillingness to give them up. "My heart is turned within Me; all My compassion is aroused."\n\nThe book teaches the seriousness of spiritual adultery. Israel\'s idolatry is not a minor lapse; it is covenant-breaking, the betrayal of a marriage. The LORD is a jealous God who will not share His glory.\n\nHosea teaches the cost of unfaithfulness. The judgment announced in the book — exile, scattering, the loss of everything — was real, and it came. Sin against God\'s love has devastating consequences.\n\nThe book teaches the depth of God\'s grace. Hosea redeemed Gomer — bought back the wife who had betrayed him — and God promises to heal and love His people freely. Grace does not wait for the sinner to become worthy.\n\nThe book teaches that judgment and love are not opposites in God. The same God who must judge sin is the God whose compassion is aroused. His holiness and His love are both real, and both are revealed at the cross.\n\nMost of all, Hosea teaches that God loves His people with a love that will not let them go — a love that pursues, redeems, and restores.',
    applications: [
      'Know that God\'s love for you is faithful even when you are not.',
      'Treat your relationship with God as a covenant, not a convenience.',
      'Return to the LORD; He promises to heal your unfaithfulness.',
      'Grieve over sin as God grieves over it.',
      'Refuse spiritual adultery: no idols, no divided heart.',
      'Love the unfaithful with God\'s redeeming love.',
      'Sow righteousness and reap the steadfast love of God.',
      'Trust the God whose compassion is aroused for His people.',
    ],
    mainThemes: ['The faithful love of God', 'Spiritual unfaithfulness and idolatry', 'Judgment on sin', 'Redeeming love', 'Restoration and healing', 'The knowledge of God'],
    keyPeople: ['Hosea', 'Gomer', 'Jezreel, Lo-ruhamah, and Lo-ammi', 'The northern kingdom of Israel', 'Jeroboam II'],
    keyVerses: [
      'Hosea 2:19-20 (BSB) — "I will betroth you to Me forever... in loving devotion and compassion."',
      'Hosea 6:6 (BSB) — "For I desire mercy, not sacrifice, and the knowledge of God rather than burnt offerings."',
      'Hosea 11:8 (BSB) — "How can I give you up, O Ephraim?"',
      'Hosea 14:4 (BSB) — "I will heal their apostasy; I will love them freely."',
    ],
    christConnection: 'Hosea points to Christ as the faithful Husband who loves His unfaithful bride. Just as Hosea redeemed Gomer at a price, Christ redeemed His people — the church, His bride — at the price of His own blood. The promise that God will "betroth" His people "in righteousness, justice, loving devotion, and compassion" (Hosea 2:19) is fulfilled in the new covenant of Christ, and Hosea 11:1 — "Out of Egypt I called My son" — is quoted by Matthew of the infant Jesus (Matthew 2:15).',
  },
  {
    bookName: 'Joel',
    author: 'Joel the prophet, son of Pethuel',
    authorDetail:
      'The book of Joel was written by Joel, the son of Pethuel, about whom little else is known. His name means "the LORD is God," and his book shows a deep knowledge of the temple, its priests, and its worship.\n\nJoel ministered in Judah, probably in the ninth or eighth century BC, and his prophecy is built around a devastating locust plague that swept the land — a catastrophe he interpreted as the harbinger of the coming day of the LORD.\n\nWritten under the inspiration of God, the book moves from a national disaster to the great day of the LORD, and it contains one of the most important promises in the Old Testament: the outpouring of the Spirit of God on all flesh.',
    audience:
      'Joel was written to the people of Judah in the aftermath of a catastrophic locust plague and famine.\n\nThe book called the nation to national repentance — a fast, a solemn assembly, and a return to the LORD with all the heart. It warned that the locust plague was only a foretaste of the greater judgment of the day of the LORD.\n\nJoel also spoke hope: for those who repent, God promises restoration, the outpouring of His Spirit, and deliverance on the day of the LORD — promises that the New Testament declares were fulfilled at Pentecost.',
    dateWritten: 'Approx. 835–796 BC (uncertain)',
    locationWritten: 'Judah (Jerusalem)',
    chapters: 3,
    purpose:
      'To call Judah to repentance in the face of the locust plague, to warn of the coming day of the LORD, and to promise the outpouring of the Spirit and the restoration of God\'s people.\n\nJoel interprets the national disaster as a divine summons to return to the LORD, and he looks beyond judgment to the day when God pours out His Spirit on all people and dwells in the midst of His redeemed Zion.',
    keyTheme: 'The day of the LORD, repentance, and the outpouring of the Spirit',
    summary:
      'Joel opens with a vivid description of a locust plague that devastated the land of Judah — fields stripped, vines ruined, and joy dried up. The prophet summons the nation to respond not with despair but with repentance:\n\nJoel 1:14 (BSB)\nConsecrate a fast, proclaim a sacred assembly! Gather the elders and all the people of the land to the house of the LORD your God, and cry out to the LORD.\n\nJoel interprets the locusts as the forerunner of a greater judgment — the day of the LORD, a day of darkness and gloom when the LORD Himself comes to judge. But the center of the book is God\'s call to return:\n\nJoel 2:13 (BSB)\nSo rend your hearts and not your garments, and return to the LORD your God. For He is gracious and compassionate, slow to anger, abounding in loving devotion, and He relents from sending disaster.\n\nThen comes the promise that marks the turning point of the book — and of the whole Bible:\n\nJoel 2:28-29 (BSB)\n"And afterward, I will pour out My Spirit on all people. Your sons and daughters will prophesy, your old men will dream dreams, your young men will see visions. Even on My menservants and maidservants, I will pour out My Spirit in those days."\n\nJoel closes with the judgment of the nations in the valley of decision and the promise of deliverance for the LORD\'s people:\n\nJoel 3:17 (BSB)\n"Then you will know that I, the LORD your God, dwell in Zion, My holy mountain. Jerusalem will be holy, and foreigners will never again pass through her."\n\nJoel therefore moves from disaster to deliverance: the day of the LORD is coming, but the LORD is gracious — and He will pour out His Spirit on all who call on His name.',
    keyScripture: [
      { reference: 'Joel 2:13 (BSB)', text: 'So rend your hearts and not your garments, and return to the LORD your God. For He is gracious and compassionate, slow to anger, abounding in loving devotion, and He relents from sending disaster.' },
      { reference: 'Joel 2:28-29 (BSB)', text: '"And afterward, I will pour out My Spirit on all people. Your sons and daughters will prophesy, your old men will dream dreams, your young men will see visions. Even on My menservants and maidservants, I will pour out My Spirit in those days."' },
      { reference: 'Joel 2:32 (BSB)', text: 'And everyone who calls on the name of the LORD will be saved; for on Mount Zion and in Jerusalem there will be deliverance, as the LORD has promised.' },
    ],
    background:
      'Joel ministered in Judah at a time of crisis: a plague of locusts had destroyed the harvest, followed by famine and drought. The prophet saw in this disaster a picture of the greater judgment to come — the day of the LORD.\n\nThe book can broadly be divided into three major sections:\n\nJoel 1 — The Locust Plague\nThe devastation of the land described vividly, and the call to national lament and repentance.\n\nJoel 2:1–17 — The Day of the LORD\nThe locusts pictured as an army of judgment, and the urgent call: "Return to the LORD your God."\n\nJoel 2:18–3 — The Promise and the Deliverance\nThe LORD\'s compassion, the restoration of the land, the outpouring of the Spirit, the judgment of the nations, and the blessedness of Zion.\n\nJoel is therefore a book of both warning and promise: the day of the LORD is certain, and so is the mercy of the LORD for all who call on His name.',
    structure: [
      { range: '1', title: 'The locust plague: devastation and the call to lament' },
      { range: '2:1–17', title: 'The day of the LORD: judgment and the call to return' },
      { range: '2:18–27', title: 'The LORD\'s compassion: the restoration of the land' },
      { range: '2:28–3', title: 'The Spirit poured out, the nations judged, and Zion delivered' },
    ],
    lessons:
      'Joel teaches that disasters can be God\'s summons to repentance. The locust plague was not merely a natural catastrophe; it was a call to the nation to return to the LORD with all its heart.\n\nThe book teaches the character of God. "He is gracious and compassionate, slow to anger, abounding in loving devotion, and He relents from sending disaster" — Joel\'s description of God is one of the great confessions of Scripture.\n\nJoel teaches that true repentance is inward. "Rend your hearts and not your garments" — God is not impressed by outward shows of mourning but by hearts turned back to Him.\n\nThe book teaches the reality of the day of the LORD. The locusts were a foretaste; the day of the LORD is the full judgment. History is moving toward that day, and the wise will be ready.\n\nJoel teaches the promise of the Spirit. "I will pour out My Spirit on all people" — the promise that Peter declared fulfilled at Pentecost (Acts 2:16-21). The Spirit is God\'s great gift to His people in the last days.\n\nMost of all, Joel teaches salvation by calling on the name of the LORD. "Everyone who calls on the name of the LORD will be saved" — the promise that spans the whole Bible, from Joel to Paul to the church today.',
    applications: [
      'Rend your heart, not your garments: repent inwardly.',
      'Return to the LORD, for He is gracious and compassionate.',
      'See in life\'s disasters a call to seek God.',
      'Call on the name of the LORD and be saved.',
      'Receive the Spirit God pours out on His people.',
      'Prepare for the day of the LORD.',
      'Restore what the locusts have eaten; God restores the years.',
      'Live as one who dwells in Zion with God.',
    ],
    mainThemes: ['The day of the LORD', 'Repentance and the character of God', 'The outpouring of the Spirit', 'Salvation by calling on the LORD', 'Judgment on the nations', 'The restoration of Zion'],
    keyPeople: ['Joel', 'The priests of Judah', 'The elders of the land', 'The people of Judah', 'The nations gathered for judgment'],
    keyVerses: [
      'Joel 1:14 (BSB) — "Consecrate a fast, proclaim a sacred assembly."',
      'Joel 2:13 (BSB) — "Rend your hearts and not your garments."',
      'Joel 2:28 (BSB) — "I will pour out My Spirit on all people."',
      'Joel 2:32 (BSB) — "Everyone who calls on the name of the LORD will be saved."',
      'Joel 3:17 (BSB) — "Then you will know that I, the LORD your God, dwell in Zion."',
    ],
    christConnection: 'Joel points to Christ through the promise of the Spirit: at Pentecost, Peter declared that the outpouring foretold by Joel had come in the exaltation of Jesus (Acts 2:16-36). "Everyone who calls on the name of the LORD will be saved" is fulfilled in Jesus Christ, the Lord whose name saves — the same name Paul declares is upon all who call on Him (Romans 10:12-13). And the deliverance of Zion points to the salvation Christ brings to His people.',
  },
  {
    bookName: 'Amos',
    author: 'Amos the shepherd and herdsman',
    authorDetail:
      'The book of Amos was written by Amos, a shepherd and dresser of sycamore-fig trees from Tekoa in Judah, whom the LORD called to prophesy to the northern kingdom of Israel (Amos 1:1; 7:14-15).\n\nAmos was not a professional prophet or the son of a prophet — he was a working man taken from the flocks and fields to carry God\'s word. His background shaped his message: his images come from the countryside — the lion, the plumb line, the basket of summer fruit, the crushing of the poor.\n\nAmos ministered during the reign of Jeroboam II, when Israel was prosperous and outwardly religious but rotten with injustice, and his book thunders against the oppression of the poor and the emptiness of worship divorced from righteousness.',
    audience:
      'Amos was written to the northern kingdom of Israel in the eighth century BC, a time of great prosperity and great hypocrisy.\n\nThe people were religious — busy with feasts, offerings, and songs — but they trampled the poor, perverted justice, and trusted in their wealth. Amos confronted them with the word of the LORD: their worship was hateful to God, and their luxury would not save them.\n\nThe book also speaks to every generation that separates worship from righteousness, teaching that God desires justice, not merely religious activity.',
    dateWritten: 'Approx. 760–750 BC',
    locationWritten: 'The northern kingdom of Israel (from Tekoa in Judah)',
    chapters: 9,
    purpose:
      'To announce the judgment of the LORD upon Israel for its injustice and empty religion, and to call the people to seek the LORD and live.\n\nAmos declares that the day of the LORD will be darkness, not light, for those who oppress the poor while worshiping with empty ritual — and that the only hope is to seek the LORD, love good, and establish justice.',
    keyTheme: 'The judgment of the LORD on injustice; justice and righteousness',
    summary:
      'Amos opens with a roar: "The LORD roars from Zion" (Amos 1:2), and the prophet announces judgment on the nations surrounding Israel — Damascus, Gaza, Tyre, Edom, Ammon, and Moab. Then the hammer falls on Israel itself, for the sins the prophet catalogues in detail: selling the righteous for silver and the needy for a pair of sandals, trampling the heads of the poor, and turning aside the way of the afflicted.\n\nAmos exposes the emptiness of Israel\'s religion. The people crowded the sanctuaries, but God declared:\n\nAmos 5:21-24 (BSB)\n"I hate and despise your feasts; I am not pleased with your solemn assemblies... But let justice roll on like a river, and righteousness like an ever-flowing stream."\n\nThe book is punctuated with visions — the locusts, the fire, the plumb line, the basket of summer fruit — each announcing that Israel was ripe for judgment. Amaziah, the priest of Bethel, tried to silence Amos, but the prophet answered:\n\nAmos 7:15 (BSB)\n"But the LORD took me from following the flock and said to me, \'Go, prophesy to My people Israel.\'"\n\nAmos closes with a brief but glorious word of hope: after the judgment, the LORD will restore the fallen tent of David, rebuild it, and plant His people in their land again (Amos 9:11-15).',
    keyScripture: [
      { reference: 'Amos 5:21-24 (BSB)', text: '"I hate and despise your feasts; I am not pleased with your solemn assemblies... But let justice roll on like a river, and righteousness like an ever-flowing stream."' },
      { reference: 'Amos 7:15 (BSB)', text: '"But the LORD took me from following the flock and said to me, \'Go, prophesy to My people Israel.\'"' },
      { reference: 'Amos 9:11 (BSB)', text: '"In that day I will restore the fallen tent of David. I will repair its gaps, restore its ruins, and rebuild it as in the days of old."' },
    ],
    background:
      'Amos prophesied during the reign of Jeroboam II (about 793–753 BC), when the northern kingdom of Israel enjoyed a period of military success and economic prosperity. But the wealth was concentrated in the hands of the few, the courts were corrupt, and the poor were crushed.\n\nThe book can broadly be divided into three major sections:\n\nAmos 1–2 — Judgment on the Nations and on Israel\nOracles against Damascus, Gaza, Tyre, Edom, Ammon, Moab, and Judah — then the extended indictment of Israel itself.\n\nAmos 3–6 — The Indictment of Israel\nThree messages of judgment: the LORD\'s case against Israel, the emptiness of its religion, and the woe pronounced on the complacent and luxurious.\n\nAmos 7–9 — The Visions and the Promise\nThe five visions of judgment, the confrontation with Amaziah, and the closing promise of the restoration of David\'s fallen tent.\n\nAmos is therefore the prophet of justice: the book that insists that worship without righteousness is an offense to God.',
    structure: [
      { range: '1–2', title: 'Judgment on the nations and the indictment of Israel' },
      { range: '3–4', title: 'The LORD\'s case against Israel: privilege and accountability' },
      { range: '5–6', title: 'Woe to the complacent: justice and the day of the LORD' },
      { range: '7–9', title: 'The visions of judgment and the restoration of David\'s tent' },
    ],
    lessons:
      'Amos teaches that God cares about justice. The book\'s central demand — "Let justice roll on like a river, and righteousness like an ever-flowing stream" — shows that God is not indifferent to the oppression of the poor.\n\nThe book teaches that religious activity cannot replace righteousness. Israel was busy with feasts, offerings, and songs — and God said He hated them, because the worshipers trampled the needy. Worship without obedience is an abomination.\n\nAmos teaches the danger of complacent prosperity. The wealthy of Israel lay on beds of ivory, drank wine by the bowlful, and "were not grieved over the ruin of Joseph" (Amos 6:6). Comfort can blind a nation to its own judgment.\n\nThe book teaches that privilege brings accountability. "You only have I known of all the families of the earth; therefore I will punish you for all your iniquities" (Amos 3:2) — those who know God\'s ways are more responsible, not less.\n\nAmos teaches the courage of the prophet. A shepherd from Tekoa stood before the priest of Bethel and declared the word of the LORD without flinching. God calls ordinary people for extraordinary tasks.\n\nMost of all, Amos teaches that judgment is not God\'s final word. The book ends with the promise to restore the fallen tent of David — a word of hope that the New Testament sees fulfilled in the risen Christ and the inclusion of the Gentiles.',
    applications: [
      'Let justice roll on like a river in your life and community.',
      'Refuse to separate worship from righteousness.',
      'Care for the poor; do not trample the needy.',
      'Guard against complacent prosperity.',
      'Embrace the accountability that comes with knowing God.',
      'Speak the truth courageously, even when it is unpopular.',
      'Seek the LORD and live.',
      'Hope in the restoration of David\'s fallen tent.',
    ],
    mainThemes: ['Justice and righteousness', 'The emptiness of religious ritual without obedience', 'Judgment on complacency', 'The day of the LORD', 'The sovereignty of God', 'Restoration after judgment'],
    keyPeople: ['Amos', 'Jeroboam II', 'Amaziah the priest of Bethel', 'The wealthy of Israel', 'The poor and righteous of Israel'],
    keyVerses: [
      'Amos 3:2 (BSB) — "You only have I known of all the families of the earth; therefore I will punish you for all your iniquities."',
      'Amos 5:24 (BSB) — "Let justice roll on like a river, and righteousness like an ever-flowing stream."',
      'Amos 5:4 (BSB) — "Seek Me and live."',
      'Amos 7:15 (BSB) — "The LORD took me from following the flock."',
      'Amos 9:11 (BSB) — "I will restore the fallen tent of David."',
    ],
    christConnection: 'Amos points to Christ through the promise of the restoration of the fallen tent of David (Amos 9:11). At the Jerusalem Council, James quoted this verse to show that the inclusion of the Gentiles fulfilled the promise that David\'s dynasty would be restored and rebuilt in Christ (Acts 15:16-17). Jesus is the greater Son of David in whom the fallen tent is restored, and He is the one who brings the justice and righteousness that Amos demanded — establishing them fully in His kingdom.',
  },
  {
    bookName: 'Obadiah',
    author: 'Obadiah the prophet',
    authorDetail:
      'The book of Obadiah was written by the prophet Obadiah, whose name means "servant of the LORD." Nothing is known of his life beyond the book itself, and the date of his prophecy is debated — it may follow the fall of Jerusalem in 586 BC, or an earlier invasion of Judah.\n\nThe book is the shortest in the Old Testament, a single chapter of twenty-one verses, and it is a prophecy of judgment against Edom, the descendants of Esau and the brother-nation of Israel.\n\nWritten under the inspiration of God, Obadiah\'s message is twofold: Edom\'s pride and violence against its brother will be repaid, and the LORD will deliver Zion and establish His kingdom.',
    audience:
      'Obadiah was written to the people of Judah, who had been betrayed by their brother-nation Edom, and to Edom itself.\n\nThe book assured Judah that God had seen Edom\'s treachery — standing aloof while Jerusalem was sacked, rejoicing over the disaster, and looting the city — and that the LORD would repay Edom for its pride.\n\nFor every generation of God\'s people, Obadiah teaches that God sees the proud and vindicates His own: "The pride of your heart has deceived you" — and the day of the LORD belongs to the LORD.',
    dateWritten: 'Approx. 586–550 BC (uncertain)',
    locationWritten: 'Judah',
    chapters: 1,
    purpose:
      'To announce the judgment of the LORD upon Edom for its pride and its violence against Israel, and to promise the deliverance and restoration of Zion.\n\nObadiah declares that the proud will be brought low, that those who rejoiced over the downfall of God\'s people will themselves fall, and that the LORD will one day rule over His restored people in His kingdom.',
    keyTheme: 'Pride brought low; the judgment of Edom and the deliverance of Zion',
    summary:
      'Obadiah is the Bible\'s shortest book, a single chapter pronouncing judgment on Edom. The Edomites, descendants of Esau, were the brother-nation of Israel — yet when Jerusalem fell, they rejoiced, looted, and handed over fugitives. The prophet declares God\'s verdict:\n\nObadiah 1:3-4 (BSB)\n"The pride of your heart has deceived you, O dwellers in the clefts of the rocks, whose habitation is high above — who say in your heart, \'Who can bring me down to the ground?\' Though you soar like the eagle and make your nest among the stars, even from there I will bring you down," declares the LORD.\n\nThe book announces the universal law of divine justice: as Edom did, so it will be done to Edom:\n\nObadiah 1:15 (BSB)\n"For the day of the LORD is near for all the nations. As you have done, it will be done to you; your deeds will return upon your own head."\n\nBut the book closes with hope for God\'s people. Deliverance will arise on Mount Zion, the kingdom will be the LORD\'s, and the house of Jacob will possess their inheritance:\n\nObadiah 1:21 (BSB)\n"Those who have escaped will go up to Mount Zion to rule over Mount Esau. And the kingdom will be the LORD\'s."\n\nObadiah therefore teaches one of the Bible\'s great lessons in miniature: pride goes before destruction, and the LORD is the defender of His people.',
    keyScripture: [
      { reference: 'Obadiah 1:3-4 (BSB)', text: '"The pride of your heart has deceived you, O dwellers in the clefts of the rocks, whose habitation is high above — who say in your heart, \'Who can bring me down to the ground?\' Though you soar like the eagle and make your nest among the stars, even from there I will bring you down," declares the LORD.' },
      { reference: 'Obadiah 1:15 (BSB)', text: '"For the day of the LORD is near for all the nations. As you have done, it will be done to you; your deeds will return upon your own head."' },
      { reference: 'Obadiah 1:21 (BSB)', text: '"Those who have escaped will go up to Mount Zion to rule over Mount Esau. And the kingdom will be the LORD\'s."' },
    ],
    background:
      'The background of Obadiah is the ancient hostility between Israel and Edom, rooted in the rivalry of Jacob and Esau. When Jerusalem was attacked and plundered, Edom — the brother nation — stood by, rejoiced over Judah\'s downfall, and even helped the invaders.\n\nThe book can broadly be divided into two major sections:\n\nObadiah 1–14 — The Judgment of Edom\nThe announcement of Edom\'s coming humiliation, the indictment of its pride and its violence against its brother Israel, and the certainty of its fall.\n\nObadiah 15–21 — The Day of the LORD and the Deliverance of Zion\nThe day of the LORD for all nations, the principle of retribution, the deliverance of the house of Jacob, and the kingdom of the LORD.\n\nObadiah is therefore a book of divine justice: the pride of Edom is answered with judgment, and the betrayed people of God are vindicated by the LORD.',
    structure: [
      { range: '1–9', title: 'The judgment of Edom: pride brought down from the rocks' },
      { range: '10–14', title: 'The indictment: Edom\'s violence against its brother Israel' },
      { range: '15–21', title: 'The day of the LORD and the deliverance of Zion' },
    ],
    lessons:
      'Obadiah teaches the danger of pride. Edom trusted in its mountain fortresses — "Who can bring me down?" — and the LORD declared He would bring it down from the stars. Pride deceives the heart into thinking it is beyond judgment.\n\nThe book teaches the principle of retribution. "As you have done, it will be done to you" — the book applies to nations what Scripture teaches about individuals: we reap what we sow.\n\nObadiah teaches that God sees the betrayal of His people. Edom rejoiced over Judah\'s downfall, but the LORD saw, and the LORD remembered. No injustice against God\'s people is hidden from Him.\n\nThe book teaches solidarity in suffering. Edom\'s crime was not only its hostility but its refusal to help — standing aloof, gloating, and looting while Jerusalem fell. God\'s people are called to stand with the suffering, not to profit from their downfall.\n\nObadiah teaches the vindication of God\'s people. Deliverance arises on Mount Zion, and the kingdom becomes the LORD\'s. The proud are brought down, and the people of God inherit the kingdom.\n\nMost of all, Obadiah teaches that the LORD is king. The book ends with the kingdom belonging to the LORD — the sure hope that all of history is moving toward His reign.',
    applications: [
      'Humble yourself; pride deceives the heart.',
      'Do not rejoice over the downfall of others.',
      'Stand with the suffering; do not stand aloof.',
      'Remember that God sees every injustice against His people.',
      'Trust the principle of divine justice: what you sow, you reap.',
      'Look to Zion for deliverance.',
      'Live as citizens of the kingdom that is the LORD\'s.',
    ],
    mainThemes: ['The judgment of pride', 'Divine retribution', 'The betrayal of God\'s people', 'The day of the LORD', 'The deliverance of Zion', 'The kingdom of the LORD'],
    keyPeople: ['Obadiah', 'Edom (the descendants of Esau)', 'The house of Jacob (Israel)', 'The nations of the day of the LORD'],
    keyVerses: [
      'Obadiah 1:3-4 (BSB) — "The pride of your heart has deceived you... even from there I will bring you down."',
      'Obadiah 1:15 (BSB) — "As you have done, it will be done to you."',
      'Obadiah 1:21 (BSB) — "And the kingdom will be the LORD\'s."',
    ],
    christConnection: 'Obadiah points to Christ, the deliverer who comes from Mount Zion and whose kingdom will be the LORD\'s. The promise that "those who have escaped will go up to Mount Zion" finds its fulfillment in the salvation Christ brings to His people, and the judgment of the proud — even Edom, "whom God hated" (Romans 9:13) — shows the justice that Christ bore on behalf of His people at the cross, so that the kingdom belongs to the LORD forever.',
  },
  {
    bookName: 'Jonah',
    author: 'Jonah the prophet, son of Amittai',
    authorDetail:
      'The book of Jonah is the account of the prophet Jonah, son of Amittai, from Gath-hepher in Galilee. He is the same Jonah who prophesied during the reign of Jeroboam II, king of Israel (2 Kings 14:25), in the eighth century BC.\n\nUnlike the other prophetic books, Jonah is a narrative — the story of a prophet who ran from God\'s command, was swallowed by a great fish, repented, and finally carried God\'s word to Nineveh, where the greatest city of the age repented at his preaching.\n\nJesus Himself treated the book as history, pointing to "the sign of Jonah" and the repentance of the Ninevites (Matthew 12:39-41), and Christians have traditionally understood it to have been written under the inspiration of God.',
    audience:
      'Jonah was written to the people of Israel, who needed to learn that the mercy of God extends beyond their borders.\n\nIsrael was tempted to believe that the LORD was only their God and that the nations deserved only judgment. Jonah showed them the shocking truth: God loved Nineveh, the cruel enemy capital, and sent a prophet to call it to repentance.\n\nFor every generation, Jonah reveals the heart of God — a God of mercy who delights in the repentance of sinners, even the unlikeliest — and the reluctant heart of His people, who must learn to share that mercy.',
    dateWritten: 'Approx. 780–750 BC (events); written later',
    locationWritten: 'Israel (the events span Joppa, the sea, Nineveh, and beyond)',
    chapters: 4,
    purpose:
      'To demonstrate the mercy of God toward the nations and to rebuke the narrowness of God\'s people.\n\nJonah shows that the LORD is the God of all the earth — that His mercy extends even to Nineveh, Israel\'s dreaded enemy — and that His people are called to share His compassion rather than resent His grace.',
    keyTheme: 'The mercy of God for the nations; reluctant obedience transformed',
    summary:
      'Jonah opens with a divine command and a prophet\'s flight:\n\nJonah 1:1-3 (BSB)\nThen the word of the LORD came to Jonah son of Amittai: "Get up! Go to the great city of Nineveh and preach against it, because its wickedness has come up before Me." But Jonah got up to flee to Tarshish, away from the presence of the LORD.\n\nJonah boarded a ship for Tarshish, but the LORD hurled a great wind upon the sea. When the sailors cast lots, the lot fell on Jonah, who confessed that he was fleeing from the LORD and told them to throw him overboard. The sea grew calm, and "the LORD appointed a great fish to swallow Jonah" (Jonah 1:17).\n\nFrom the belly of the fish, Jonah prayed — and the LORD commanded the fish to vomit him onto dry land. The second time, Jonah obeyed. He walked into Nineveh, the city of more than a hundred and twenty thousand people, and preached a five-word sermon:\n\nJonah 3:4 (BSB)\n"Forty more days and Nineveh will be overturned!"\n\nThe people of Nineveh believed God. From the greatest to the least, they declared a fast and put on sackcloth, and the king himself repented. And God relented:\n\nJonah 3:10 (BSB)\nWhen God saw their actions — that they had turned from their evil ways — God relented from the disaster He had threatened to bring upon them.\n\nThe book closes with Jonah angry that God had spared Nineveh — and with God\'s gentle rebuke, revealing His heart:\n\nJonah 4:11 (BSB)\n"But Nineveh has more than a hundred and twenty thousand people who cannot tell their right hand from their left, and many cattle as well. Should I not care about that great city?"',
    keyScripture: [
      { reference: 'Jonah 1:3 (BSB)', text: 'But Jonah got up to flee to Tarshish, away from the presence of the LORD.' },
      { reference: 'Jonah 3:10 (BSB)', text: 'When God saw their actions — that they had turned from their evil ways — God relented from the disaster He had threatened to bring upon them.' },
      { reference: 'Jonah 4:11 (BSB)', text: '"But Nineveh has more than a hundred and twenty thousand people who cannot tell their right hand from their left, and many cattle as well. Should I not care about that great city?"' },
    ],
    background:
      'Jonah was sent to Nineveh, the capital of Assyria — the empire that would one day destroy the northern kingdom of Israel. His refusal to go is understandable: why would a prophet of Israel carry a message of mercy to the nation that threatened his people?\n\nThe book\'s four chapters tell one story in four movements:\n\nJonah 1 — The Flight\nJonah flees from the LORD, is caught in the storm, and is thrown into the sea, where the great fish swallows him.\n\nJonah 2 — The Prayer\nFrom the belly of the fish, Jonah prays, and the LORD delivers him.\n\nJonah 3 — The Preaching\nJonah preaches in Nineveh, the city repents, and God relents.\n\nJonah 4 — The Lesson\nJonah sulks over God\'s mercy, and God teaches him about His compassion for the city and its children.\n\nJonah is therefore a book about God as much as about the prophet: it reveals the LORD\'s sovereignty over the sea, the fish, the plant, and the worm — and His mercy toward the nations.',
    structure: [
      { range: '1', title: 'The flight: Jonah runs from the LORD and is swallowed' },
      { range: '2', title: 'The prayer: Jonah cries out from the belly of the fish' },
      { range: '3', title: 'The preaching: Nineveh repents and God relents' },
      { range: '4', title: 'The lesson: God teaches Jonah about His mercy' },
    ],
    lessons:
      'Jonah teaches the mercy of God for all people. The book\'s great revelation is that God cares about Nineveh — the enemy capital, with its hundred and twenty thousand who cannot tell their right hand from their left. His mercy extends to the nations.\n\nThe book teaches that you cannot run from God. Jonah fled "away from the presence of the LORD," but the LORD hurled the storm, appointed the fish, and brought him back. God\'s purposes will not be defeated by His servant\'s disobedience.\n\nJonah teaches the power of repentance. Nineveh — the brutal enemy — repented at a single sermon, from the king to the cattle. God relents toward those who turn from their evil ways.\n\nThe book teaches the danger of a narrow heart. Jonah was the most reluctant evangelist in history: he obeyed God\'s command but hated God\'s mercy. God\'s people must learn to rejoice in the salvation of others, not resent it.\n\nJonah teaches the sovereignty of God. The LORD commands the wind, the fish, the plant, the worm, and the scorching east wind. Nothing in creation is outside His control.\n\nMost of all, Jonah teaches the heart of God: "Should I not care about that great city?" — the question that reveals the heart of the God who desires all people to be saved.',
    applications: [
      'Obey God\'s call, even when you disagree with it.',
      'Trust that God\'s mercy extends to the unlikeliest people.',
      'Repent quickly, as Nineveh did at the preaching of the word.',
      'Rejoice in the salvation of others, even your enemies.',
      'Do not run from God; you cannot escape His presence.',
      'Carry the message of mercy to the nations.',
      'Let your heart break for the lost, as God\'s does.',
    ],
    mainThemes: ['The mercy of God for the nations', 'The futility of fleeing from God', 'Repentance and divine relenting', 'The reluctant prophet', 'The sovereignty of God over creation', 'The heart of God for the lost'],
    keyPeople: ['Jonah', 'The sailors of the ship', 'The king of Nineveh', 'The people of Nineveh', 'The LORD'],
    keyVerses: [
      'Jonah 1:3 (BSB) — "Jonah got up to flee to Tarshish, away from the presence of the LORD."',
      'Jonah 2:9 (BSB) — "Salvation is of the LORD."',
      'Jonah 3:10 (BSB) — "God relented from the disaster He had threatened."',
      'Jonah 4:2 (BSB) — "You are a gracious and compassionate God, slow to anger, abounding in loving devotion."',
      'Jonah 4:11 (BSB) — "Should I not care about that great city?"',
    ],
    christConnection: 'Jonah points to Christ more directly than any other prophet: Jesus said, "As Jonah was three days and three nights in the belly of the great fish, so the Son of Man will be three days and three nights in the heart of the earth" (Matthew 12:40). Jonah emerged from the fish to preach deliverance to Nineveh; Christ rose from the grave to bring salvation to the world. And where Jonah preached reluctantly, Jesus — the greater prophet — came willingly, moved by the love of God for the lost.',
  },
  {
    bookName: 'Micah',
    author: 'Micah the prophet of Moresheth',
    authorDetail:
      'The book of Micah was written by Micah of Moresheth, a prophet from the lowlands of Judah who ministered during the reigns of Jotham, Ahaz, and Hezekiah, kings of Judah — a contemporary of Isaiah in the eighth century BC.\n\nMicah was a country prophet who spoke for the small farmer and the poor, and his message combined scorching judgment with some of the most beautiful promises in the Old Testament — including the prophecy of the Messiah\'s birth in Bethlehem.\n\nHis name means "who is like the LORD?" — a fitting name for the prophet who ends his book with the question that is its theme: "Who is a God like You, who pardons iniquity?"',
    audience:
      'Micah was written to the people of Israel and Judah in the eighth century BC, a time of prosperity for the powerful and oppression for the poor.\n\nThe book confronted the rulers, priests, and prophets who cheated the people and led them astray, announcing that the LORD would judge Samaria and Jerusalem. But Micah also promised restoration: a remnant gathered, a ruler born in Bethlehem, and a people forgiven by a God who delights in mercy.\n\nFor every generation, Micah sets the standard of true religion: "To act justly, to love mercy, and to walk humbly with your God."',
    dateWritten: 'Approx. 735–700 BC',
    locationWritten: 'Judah (Moresheth and Jerusalem)',
    chapters: 7,
    purpose:
      'To announce judgment on the injustice and idolatry of Israel and Judah, and to promise the restoration of God\'s people through a ruler from Bethlehem.\n\nMicah exposes the corruption of the powerful, calls the nation to justice, mercy, and humility, and looks forward to the day when the LORD gathers His remnant, forgives their sins, and reigns from Jerusalem.',
    keyTheme: 'Judgment on injustice; the promise of the ruler from Bethlehem',
    summary:
      'Micah opens with the LORD coming in judgment: "The LORD is coming from His dwelling place; He will come down and trample the high places of the earth" (Micah 1:3). The prophet denounces Samaria and Jerusalem for their idols and their oppression of the poor.\n\nMicah is brutally specific about the nation\'s sins — rulers who tear the skin from the people, prophets who preach for money, merchants who cheat with false weights. He announces that the land will be lost and the people carried into exile. But even in judgment, hope breaks through. In one of the most beloved passages of the Old Testament, Micah asks what the LORD requires:\n\nMicah 6:8 (BSB)\nHe has shown you, O man, what is good. And what does the LORD require of you but to act justly, to love mercy, and to walk humbly with your God?\n\nAnd in the book\'s most famous prophecy, Micah foretells the birthplace of the Messiah:\n\nMicah 5:2 (BSB)\n"But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come forth for Me One who will be ruler over Israel, whose origins are from of old, from the days of eternity."\n\nMicah closes with a confession of trust in the God of mercy:\n\nMicah 7:18-19 (BSB)\nWho is a God like You, who pardons iniquity and passes over the transgression of the remnant of His inheritance? ... You will again have compassion on us; You will vanquish our iniquities and cast all our sins into the depths of the sea.',
    keyScripture: [
      { reference: 'Micah 5:2 (BSB)', text: '"But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come forth for Me One who will be ruler over Israel, whose origins are from of old, from the days of eternity."' },
      { reference: 'Micah 6:8 (BSB)', text: 'He has shown you, O man, what is good. And what does the LORD require of you but to act justly, to love mercy, and to walk humbly with your God?' },
      { reference: 'Micah 7:18-19 (BSB)', text: 'Who is a God like You, who pardons iniquity and passes over the transgression of the remnant of His inheritance? ... You will again have compassion on us; You will vanquish our iniquities and cast all our sins into the depths of the sea.' },
    ],
    background:
      'Micah prophesied during the same period as Isaiah and Hosea, when the Assyrian empire was rising and the kingdoms of Israel and Judah were marked by corruption. He ministered in Judah, but his message reached Samaria as well — the northern capital that fell to Assyria in 722 BC.\n\nThe book can broadly be divided into three major sections, each moving from judgment to hope:\n\nMicah 1–2 — Judgment and Hope for Samaria and Judah\nThe LORD\'s coming in judgment, the indictment of the oppressors, and the promise to gather the remnant.\n\nMicah 3–5 — The Leaders Condemned and the Ruler Promised\nThe rulers, priests, and prophets condemned; the nations summoned; and the great promise of the ruler from Bethlehem.\n\nMicah 6–7 — The LORD\'s Case and the God of Mercy\nThe covenant lawsuit against the people, the famous summary of true religion, and the closing confession of the God who pardons iniquity.\n\nMicah is therefore a book of both demand and grace: the LORD requires justice, mercy, and humility — and the LORD pardons, forgives, and restores.',
    structure: [
      { range: '1–2', title: 'Judgment on Samaria and Judah; the promise of the remnant' },
      { range: '3', title: 'The condemnation of the rulers, priests, and prophets' },
      { range: '4–5', title: 'The exaltation of Zion and the ruler from Bethlehem' },
      { range: '6–7', title: 'The covenant lawsuit, true religion, and the God of mercy' },
    ],
    lessons:
      'Micah teaches that true religion is ethical. "To act justly, to love mercy, and to walk humbly with your God" — the most famous summary of godliness in the Old Testament — shows that God is not satisfied with ritual, sacrifice, or words. He requires a life of justice, compassion, and humility.\n\nThe book teaches that God opposes the oppression of the poor. Micah\'s indictments are specific: rulers who plunder, merchants who cheat, judges who take bribes. God sees the abuse of the powerless and will act.\n\nMicah teaches the certainty of judgment and the reality of hope. The book alternates between oracles of doom and oracles of promise, showing that judgment is not God\'s final word — the remnant will be gathered, and the ruler from Bethlehem will come.\n\nThe book teaches the greatness of God\'s mercy. "Who is a God like You, who pardons iniquity... and casts all our sins into the depths of the sea?" — the question is rhetorical: there is no God like the LORD.\n\nMicah teaches that the LORD is the shepherd of His people. "He will shepherd His flock with His staff" (Micah 7:14) — the image of the shepherd-king who gathers, feeds, and protects His people.\n\nMost of all, Micah teaches humility before God. The one who would walk with God must walk humbly — not trusting in wealth, power, or privilege, but in the mercy of the LORD.',
    applications: [
      'Act justly, love mercy, and walk humbly with your God.',
      'Defend the poor; do not oppress the powerless.',
      'Refuse corrupt gain, false weights, and bribes.',
      'Hope in the Ruler from Bethlehem.',
      'Trust the God who pardons iniquity and casts sins into the sea.',
      'Walk humbly; do not trust in your own strength.',
      'Let the LORD shepherd you; He is faithful to His flock.',
    ],
    mainThemes: ['Justice, mercy, and humility', 'Judgment on oppression and idolatry', 'The remnant and restoration', 'The Ruler from Bethlehem', 'The greatness of God\'s mercy', 'The LORD as shepherd'],
    keyPeople: ['Micah', 'The rulers, priests, and prophets of Israel and Judah', 'The remnant of God\'s people', 'The oppressors of the poor'],
    keyVerses: [
      'Micah 4:2 (BSB) — "Many nations will come and say, \'Come, let us go up to the mountain of the LORD...\'"',
      'Micah 5:2 (BSB) — "But you, Bethlehem Ephrathah... out of you will come forth for Me One who will be ruler over Israel."',
      'Micah 6:8 (BSB) — "To act justly, to love mercy, and to walk humbly with your God."',
      'Micah 7:18-19 (BSB) — "Who is a God like You, who pardons iniquity... and casts all our sins into the depths of the sea?"',
    ],
    christConnection: 'Micah points to Christ as the Ruler from Bethlehem, whose origins are "from the days of eternity" (Micah 5:2) — the prophecy the chief priests cited when Herod asked where the Messiah was to be born (Matthew 2:5-6). Jesus was born in Bethlehem and is the eternal Son of God, the Shepherd-King who feeds His flock with justice and mercy, and the one through whom God pardons iniquity and casts all our sins into the depths of the sea.',
  },
  {
    bookName: 'Nahum',
    author: 'Nahum the prophet of Elkosh',
    authorDetail:
      'The book of Nahum was written by Nahum, the Elkoshite, a prophet of Judah whose name means "comforter." Nothing is known of his life beyond the book itself, but his message was one of comfort to the people of Judah: the cruel empire of Assyria, with its capital at Nineveh, was about to fall.\n\nNahum prophesied after the fall of Thebes in 663 BC and before the fall of Nineveh in 612 BC, and his book is the sequel to Jonah — the same city that repented at Jonah\'s preaching a century earlier had returned to its violence, and now its judgment was certain.\n\nWritten under the inspiration of God, Nahum is a vivid prophecy of the destruction of Nineveh and a declaration of the justice of the LORD.',
    audience:
      'Nahum was written to the people of Judah, who had suffered under the cruelty of the Assyrian empire — the power that had destroyed the northern kingdom of Israel and terrorized the region for generations.\n\nThe book assured Judah that the LORD had seen Assyria\'s violence and would judge it. Nineveh, the city of bloodshed, would fall, and the yoke of Assyria would be broken.\n\nFor every generation of God\'s people who has suffered under tyranny, Nahum teaches that God is just, that He is slow to anger but will not leave the guilty unpunished, and that He is a refuge for those who trust in Him.',
    dateWritten: 'Approx. 663–612 BC',
    locationWritten: 'Judah',
    chapters: 3,
    purpose:
      'To announce the judgment of the LORD upon Nineveh and the Assyrian empire, and to comfort God\'s people with the justice of the LORD.\n\nNahum declares that the LORD is a jealous and avenging God who will not leave the guilty unpunished — that Nineveh\'s violence, lies, and cruelty have reached their end, and that the yoke of Assyria will be broken from the neck of Judah.',
    keyTheme: 'The judgment of Nineveh; the justice and power of the LORD',
    summary:
      'Nahum opens with a declaration of the character of the God who is about to act:\n\nNahum 1:3 (BSB)\nThe LORD is slow to anger and great in power; the LORD will by no means leave the guilty unpunished. His path is in the whirlwind and storm, and the clouds are the dust of His feet.\n\nThe prophet describes the coming destruction of Nineveh in vivid detail — the flashing spears, the burning chariots, the city of bloodshed filled with plunder. The reason for the judgment is spelled out: the city\'s endless cruelty and violence:\n\nNahum 3:1 (BSB)\nWoe to the city of blood, full of lies, full of plunder, never without victims!\n\nNahum compares the doomed empire to Thebes, which fell despite its defenses, and declares that Nineveh will fall the same way — there is no healing for its wound, no escape from the judgment of the LORD.\n\nYet the book is not only judgment; it is also comfort for the people of God. In the midst of the oracle stands a promise for Judah:\n\nNahum 1:7 (BSB)\nThe LORD is good, a stronghold in the day of distress; He cares for those who take refuge in Him.\n\nNahum therefore teaches both sides of God\'s character in one book: He is a refuge for those who trust in Him, and a consuming fire against those who oppose Him.',
    keyScripture: [
      { reference: 'Nahum 1:3 (BSB)', text: 'The LORD is slow to anger and great in power; the LORD will by no means leave the guilty unpunished. His path is in the whirlwind and storm, and the clouds are the dust of His feet.' },
      { reference: 'Nahum 1:7 (BSB)', text: 'The LORD is good, a stronghold in the day of distress; He cares for those who take refuge in Him.' },
      { reference: 'Nahum 3:1 (BSB)', text: 'Woe to the city of blood, full of lies, full of plunder, never without victims!' },
    ],
    background:
      'Nahum prophesied in the late seventh century BC, when the Assyrian empire — long the terror of the ancient world — was beginning to totter. Nineveh, its magnificent capital, was destroyed in 612 BC, just as Nahum foretold.\n\nThe book can broadly be divided into three major sections:\n\nNahum 1 — The Character of the LORD and the Decree of Judgment\nA psalm-like declaration of God\'s justice and power, the decree against Nineveh, and the promise of good news for Judah.\n\nNahum 2 — The Siege and Fall of Nineveh\nThe vivid description of the assault on the city — the shields, the chariots, the gates flung open, and the city plundered.\n\nNahum 3 — The Reasons for the Judgment\nThe indictment of the city of blood, the comparison with Thebes, and the certainty that Nineveh\'s wound is incurable.\n\nNahum is therefore the prophet of divine justice: the same God who spared Nineveh in the days of Jonah now brings it down in the days of Nahum, because His patience had run its course.',
    structure: [
      { range: '1', title: 'The character of the LORD and the decree against Nineveh' },
      { range: '2', title: 'The siege and fall of Nineveh described' },
      { range: '3', title: 'The indictment: the city of blood and its certain end' },
    ],
    lessons:
      'Nahum teaches the justice of God. The LORD is slow to anger — Jonah\'s Nineveh had a century of mercy — but He will by no means leave the guilty unpunished. God\'s patience is real, but it is not infinite.\n\nThe book teaches that God defends the oppressed. Nineveh\'s crime was violence — "never without victims" — and the LORD, who sees every victim, brought the empire down. No tyranny is beyond the judgment of God.\n\nNahum teaches the comfort of God for His people. "The LORD is good, a stronghold in the day of distress; He cares for those who take refuge in Him" — the promise at the heart of the book was spoken to a people who had suffered under Assyria for generations.\n\nThe book teaches the certainty of God\'s word. Nahum foretold the fall of Nineveh in vivid detail, and it happened in 612 BC. What the LORD has spoken, He will perform.\n\nNahum teaches that power does not protect the wicked. Nineveh trusted in its walls, its army, and its wealth — and none of it saved it. The strongholds of the proud are no match for the LORD.\n\nMost of all, Nahum teaches the whole character of God: a refuge for those who trust in Him, and a consuming fire for those who oppose Him — the same God, revealed in the same book.',
    applications: [
      'Take refuge in the LORD, the stronghold in the day of distress.',
      'Do not presume on God\'s patience; He will not leave the guilty unpunished.',
      'Trust that God sees every victim and will bring justice.',
      'Do not trust in power, wealth, or walls to protect you.',
      'Bring comfort to the oppressed: their God is good.',
      'Live in the light of the certainty of God\'s word.',
    ],
    mainThemes: ['The justice of God', 'Judgment on tyranny and violence', 'The patience of God and its limits', 'The LORD as refuge', 'The certainty of God\'s word', 'Comfort for the oppressed'],
    keyPeople: ['Nahum', 'Nineveh and the Assyrian empire', 'The people of Judah', 'The king of Assyria'],
    keyVerses: [
      'Nahum 1:3 (BSB) — "The LORD is slow to anger and great in power... will by no means leave the guilty unpunished."',
      'Nahum 1:7 (BSB) — "The LORD is good, a stronghold in the day of distress."',
      'Nahum 1:15 (BSB) — "Behold, on the mountains the feet of one who brings good news... Celebrate your feasts, O Judah!"',
      'Nahum 3:1 (BSB) — "Woe to the city of blood."',
    ],
    christConnection: 'Nahum points to Christ as the bringer of good news: "Behold, on the mountains the feet of one who brings good news, who proclaims peace!" (Nahum 1:15) — the very words Isaiah uses for the messenger of salvation, which Paul applies to those who preach the gospel of Christ (Romans 10:15). The justice that Nahum declares against Nineveh was borne by Christ at the cross for all who trust in Him, so that the LORD is both a consuming fire against sin and a refuge for sinners who take refuge in the Savior.',
  },
  {
    bookName: 'Habakkuk',
    author: 'Habakkuk the prophet',
    authorDetail:
      'The book of Habakkuk was written by the prophet Habakkuk, about whom almost nothing is known beyond his name and his book. He ministered in Judah in the late seventh century BC, in the years before the Babylonian invasion.\n\nHabakkuk is unique among the prophets: his book is not a series of oracles to the people but a dialogue with God. The prophet brings his hardest questions to the LORD, and God answers — not with explanations but with Himself.\n\nThe book ends with a psalm of trust that has sustained God\'s people through every age, and it contains one of the most important verses in the New Testament: "The righteous will live by his faith."',
    audience:
      'Habakkuk was written to the people of Judah in the years before the Babylonian invasion, and to every believer who has ever wrestled with the problem of evil.\n\nThe book gives voice to the hardest questions of faith: Why does God allow injustice to continue? Why does He use the wicked to punish the less wicked? Habakkuk teaches that these questions may be brought to God — and that the answer is not an explanation but a summons to trust.\n\nFor every generation, Habakkuk models the journey from questioning to trust, and its great verse — "the righteous will live by his faith" — became the watchword of the Reformation.',
    dateWritten: 'Approx. 609–605 BC',
    locationWritten: 'Judah (Jerusalem)',
    chapters: 3,
    purpose:
      'To wrestle with the problem of evil and the justice of God, and to call God\'s people to live by faith.\n\nHabakkuk brings his complaint to the LORD, receives the LORD\'s surprising answer, and moves from questioning to worship — concluding that the righteous live by faith, and that the LORD is the strength of His people even when the fig tree does not bud.',
    keyTheme: 'Living by faith; the justice of God and the problem of evil',
    summary:
      'Habakkuk opens with the prophet\'s cry of complaint:\n\nHabakkuk 1:2-3 (BSB)\n"How long, O LORD, must I call for help, but You do not listen? Or cry out to You, \'Violence!\' but You do not save? Why do You make me look at iniquity, and why do You tolerate wrongdoing?"\n\nThe LORD answers with a shocking announcement: He is raising up the Babylonians, a bitter and hasty nation, to execute judgment. This only deepens the prophet\'s perplexity — how can a holy God use a nation more wicked than Judah to punish His people?\n\nHabakkuk climbs to his watchtower to await the answer, and the LORD responds. The wicked are proud; the righteous live by faith:\n\nHabakkuk 2:4 (BSB)\n"Behold, as for the wicked, his soul is proud within him; but the righteous will live by his faith."\n\nThe LORD pronounces five woes upon Babylon — upon plunder, extortion, bloodshed, shame, and idolatry — and declares that the earth will be filled with the knowledge of the glory of the LORD as the waters cover the sea.\n\nHabakkuk closes with a psalm of surrender and trust, one of the most moving passages in the Old Testament:\n\nHabakkuk 3:17-19 (BSB)\nThough the fig tree does not bud and no fruit is on the vines, though the olive crop fails and the fields produce no food, though the sheep are cut off from the fold and no cattle stand in the stalls, yet I will exult in the LORD; I will rejoice in the God of my salvation! GOD the Lord is my strength; He makes my feet like those of a deer; He prepares me for the heights.',
    keyScripture: [
      { reference: 'Habakkuk 1:2-3 (BSB)', text: '"How long, O LORD, must I call for help, but You do not listen? Or cry out to You, \'Violence!\' but You do not save? Why do You make me look at iniquity, and why do You tolerate wrongdoing?"' },
      { reference: 'Habakkuk 2:4 (BSB)', text: '"Behold, as for the wicked, his soul is proud within him; but the righteous will live by his faith."' },
      { reference: 'Habakkuk 3:17-18 (BSB)', text: 'Though the fig tree does not bud and no fruit is on the vines... yet I will exult in the LORD; I will rejoice in the God of my salvation!' },
    ],
    background:
      'Habakkuk ministered in Judah in the last years before the Babylonian invasion, when the kingdom was corrupt and the Chaldeans were rising to power on the world stage. His book records his personal dialogue with God about the apparent triumph of evil.\n\nThe book can broadly be divided into three major sections:\n\nHabakkuk 1 — The Prophet\'s Complaint and God\'s First Answer\nHabakkuk cries out against injustice; the LORD announces the coming of the Babylonians; and the prophet protests that this only makes things worse.\n\nHabakkuk 2 — The Watchtower and the Woes\nThe prophet waits for the answer and receives the great word — the righteous will live by faith — followed by five woes upon the proud oppressor.\n\nHabakkuk 3 — The Psalm of Trust\nThe prophet\'s prayer, the vision of the LORD coming in power, and the final confession of trust that rejoices in the God of salvation even when everything fails.\n\nHabakkuk is therefore the prophet of faith: the book that moves from "How long, O LORD?" to "I will rejoice in the God of my salvation."',
    structure: [
      { range: '1', title: 'The complaint: "How long, O LORD?" and God\'s surprising answer' },
      { range: '2', title: 'The watchtower: the righteous live by faith, and the five woes' },
      { range: '3', title: 'The psalm: trusting God when everything fails' },
    ],
    lessons:
      'Habakkuk teaches that honest questions belong in the presence of God. The prophet complained, protested, and demanded an answer — and God did not rebuke him for it. Faith is not the absence of questions but the bringing of them to God.\n\nThe book teaches that the righteous live by faith. The great verse of the book — quoted three times in the New Testament (Romans 1:17; Galatians 3:11; Hebrews 10:38) — is the answer to the problem of evil: not explanations, but trust in the righteous God.\n\nHabakkuk teaches the sovereignty of God over history. God is raising up and bringing down nations — Babylon was His instrument of judgment, and Babylon itself would fall. The proud will be brought low, and the earth will be filled with the knowledge of the glory of the LORD.\n\nThe book teaches that God is known in the silence. Habakkuk climbed to the watchtower to wait — and the answer came to the waiting prophet. Sometimes the LORD speaks most clearly after we have stopped demanding and started waiting.\n\nThe book teaches joy that transcends circumstances. "Though the fig tree does not bud... yet I will exult in the LORD." Habakkuk\'s final psalm is the highest expression of faith: joy in God Himself, apart from any visible blessing.\n\nMost of all, Habakkuk teaches the strength of God. "GOD the Lord is my strength; He makes my feet like those of a deer; He prepares me for the heights" — the God who cannot be seen is the strength of those who trust Him.',
    applications: [
      'Bring your hardest questions to God; He welcomes honest faith.',
      'Live by faith, not by what you can see.',
      'Wait for the LORD in the watchtower of prayer.',
      'Rejoice in God Himself, not only in His gifts.',
      'Trust that God is sovereign over the chaos of history.',
      'Let God be your strength when everything else fails.',
      'Live for the day when the earth is filled with the glory of the LORD.',
    ],
    mainThemes: ['The problem of evil and the justice of God', 'Living by faith', 'The sovereignty of God over nations', 'Waiting on God', 'Joy beyond circumstances', 'The glory of the LORD filling the earth'],
    keyPeople: ['Habakkuk', 'The LORD', 'The Babylonians (Chaldeans)', 'The wicked of Judah'],
    keyVerses: [
      'Habakkuk 1:2 (BSB) — "How long, O LORD, must I call for help, but You do not listen?"',
      'Habakkuk 2:4 (BSB) — "The righteous will live by his faith."',
      'Habakkuk 2:14 (BSB) — "The earth will be filled with the knowledge of the glory of the LORD as the waters cover the sea."',
      'Habakkuk 3:17-18 (BSB) — "Yet I will exult in the LORD; I will rejoice in the God of my salvation!"',
      'Habakkuk 3:19 (BSB) — "GOD the Lord is my strength; He makes my feet like those of a deer."',
    ],
    christConnection: 'Habakkuk points to Christ through its great verse: "The righteous will live by his faith" — the text that Paul makes the foundation of the doctrine of justification by faith in Christ (Romans 1:17; Galatians 3:11) and that Hebrews applies to the perseverance of believers (Hebrews 10:38). The Babylonians whom God raised up were judged in turn; Christ bore the judgment of God upon sin at the cross, so that the righteous may live by faith in Him. And the joy beyond circumstances that Habakkuk learned is the joy of those who rejoice in the God of their salvation.',
  },
  {
    bookName: 'Zephaniah',
    author: 'Zephaniah the prophet',
    authorDetail:
      'The book of Zephaniah was written by the prophet Zephaniah, whose genealogy is traced back four generations to Hezekiah (Zephaniah 1:1) — suggesting he was of royal descent. He ministered during the reign of Josiah, king of Judah, in the late seventh century BC, before the great reform that Josiah led.\n\nZephaniah\'s prophecy is dominated by the coming "day of the LORD" — a day of darkness and judgment upon Judah and the nations. But his book ends with one of the most beautiful promises of restoration in the prophets: the LORD rejoicing over His redeemed people with singing.\n\nWritten under the inspiration of God, Zephaniah was the prophet who prepared the way for Josiah\'s reform, calling the nation to seek the LORD before the day of His anger came.',
    audience:
      'Zephaniah was written to the people of Judah in the years before the Babylonian judgment, when the nation was still worshiping idols and trusting in the gods of the nations.\n\nThe book warned Judah that the day of the LORD was near — a day of darkness and gloom, of trumpet and battle cry against the fortified cities. It called the nation to seek the LORD, to seek righteousness and humility, so that they might be hidden in the day of His anger.\n\nZephaniah also spoke hope: the LORD would gather His scattered people, dwell in their midst, and rejoice over them with singing.',
    dateWritten: 'Approx. 640–620 BC',
    locationWritten: 'Judah (Jerusalem)',
    chapters: 3,
    purpose:
      'To warn of the coming day of the LORD and to call the nation to seek righteousness and humility before the judgment falls.\n\nZephaniah announces judgment on Judah and the nations, summons the humble to seek the LORD, and promises that God will gather, save, and rejoice over His restored people.',
    keyTheme: 'The day of the LORD; judgment, humility, and restoration',
    summary:
      'Zephaniah opens with a sweeping declaration of judgment:\n\nZephaniah 1:14-15 (BSB)\n"The great day of the LORD is near — near and coming quickly. Listen! The cry on the day of the LORD will be bitter, the shouting of the mighty warrior there. That day will be a day of wrath, a day of trouble and distress, a day of destruction and desolation, a day of darkness and gloom, a day of clouds and blackness."\n\nThe prophet indicts Judah for its idolatry, its violence, and its complacency — those who say in their hearts, "The LORD will not do good, nor will He do evil" (Zephaniah 1:12). He announces judgment on the nations as well — Philistia, Moab, Ammon, Cush, and Assyria — and he calls the humble to seek the LORD:\n\nZephaniah 2:3 (BSB)\nSeek the LORD, all you humble of the earth who carry out His justice. Seek righteousness; seek humility. Perhaps you will be concealed on the day of the anger of the LORD.\n\nThen the book turns from judgment to promise. The LORD will gather His people, purify their lips, and dwell in their midst:\n\nZephaniah 3:17 (BSB)\nThe LORD your God is among you; He is mighty to save. He will rejoice over you with gladness; He will quiet you with His love; He will rejoice over you with singing.\n\nZephaniah therefore moves from the dark day of the LORD to the bright promise of restoration — a God who judges sin, saves the humble, and rejoices over His people with singing.',
    keyScripture: [
      { reference: 'Zephaniah 1:14-15 (BSB)', text: '"The great day of the LORD is near — near and coming quickly... That day will be a day of wrath, a day of trouble and distress, a day of destruction and desolation, a day of darkness and gloom, a day of clouds and blackness."' },
      { reference: 'Zephaniah 2:3 (BSB)', text: 'Seek the LORD, all you humble of the earth who carry out His justice. Seek righteousness; seek humility. Perhaps you will be concealed on the day of the anger of the LORD.' },
      { reference: 'Zephaniah 3:17 (BSB)', text: 'The LORD your God is among you; He is mighty to save. He will rejoice over you with gladness; He will quiet you with His love; He will rejoice over you with singing.' },
    ],
    background:
      'Zephaniah prophesied during the reign of Josiah, before the king\'s great reform of 622 BC. The nation was still steeped in idolatry — worshiping Baal, the starry host, and Milcom — and corrupt in its leadership. Zephaniah\'s message of the day of the LORD helped prepare the way for the reform.\n\nThe book can broadly be divided into three major sections:\n\nZephaniah 1 — The Day of the LORD upon Judah\nThe sweeping decree of judgment upon the land for its idolatry, violence, and complacency.\n\nZephaniah 2 — The Day of the LORD upon the Nations\nJudgment upon Philistia, Moab, Ammon, Cush, and Assyria — and the summons to the humble to seek the LORD.\n\nZephaniah 3 — The Restoration of the People\nThe indictment of Jerusalem, the promise of a purified remnant, and the closing picture of the LORD rejoicing over His people with singing.\n\nZephaniah is therefore a book of the great day: the darkest prophecy of judgment in the Old Testament contains one of its brightest promises of grace.',
    structure: [
      { range: '1', title: 'The day of the LORD: judgment upon Judah' },
      { range: '2', title: 'Judgment upon the nations and the call to the humble' },
      { range: '3', title: 'Restoration: a purified remnant and the rejoicing of the LORD' },
    ],
    lessons:
      'Zephaniah teaches the reality of the day of the LORD. The book\'s repeated refrain — the day is near, a day of wrath, darkness, and gloom — is a sobering reminder that judgment is real and that the LORD will act in history.\n\nThe book teaches the danger of complacency. Zephaniah indicts those who say, "The LORD will not do good, nor will He do evil" — the comfortable assumption that God is distant and indifferent. The LORD is not indifferent.\n\nZephaniah teaches the call to humility. "Seek righteousness; seek humility" — the way to be concealed in the day of the LORD\'s anger is not self-confidence but humble seeking of God.\n\nThe book teaches the grace of God toward the humble. The same LORD who pours out wrath on the proud gathers, saves, and rejoices over the humble remnant. "He is mighty to save."\n\nZephaniah teaches the joy of God. The closing picture is astonishing: the LORD rejoices over His people with gladness, quiets them with His love, and rejoices over them with singing. God is not merely tolerant of His redeemed; He delights in them.\n\nMost of all, Zephaniah teaches that the day of darkness gives way to the day of joy — that the God who judges sin is the God who saves and sings over His people.',
    applications: [
      'Take the day of the LORD seriously; judgment is real.',
      'Seek the LORD, seek righteousness, seek humility.',
      'Refuse complacency; do not assume God is indifferent.',
      'Trust the God who is mighty to save.',
      'Rest in the quieting love of God.',
      'Know that the LORD rejoices over His people with singing.',
      'Live as the purified remnant of God.',
    ],
    mainThemes: ['The day of the LORD', 'Judgment on sin and idolatry', 'Humility and seeking God', 'The remnant and purification', 'The saving power of the LORD', 'The rejoicing of God over His people'],
    keyPeople: ['Zephaniah', 'Josiah king of Judah', 'The people of Judah', 'The nations (Philistia, Moab, Ammon, Cush, Assyria)', 'The remnant of Israel'],
    keyVerses: [
      'Zephaniah 1:14-15 (BSB) — "The great day of the LORD is near... a day of darkness and gloom."',
      'Zephaniah 2:3 (BSB) — "Seek righteousness; seek humility."',
      'Zephaniah 3:9 (BSB) — "For then I will restore to the peoples a pure speech, that they may all call upon the name of the LORD."',
      'Zephaniah 3:17 (BSB) — "He will rejoice over you with gladness; He will quiet you with His love; He will rejoice over you with singing."',
    ],
    christConnection: 'Zephaniah points to Christ as the mighty Savior in whom the LORD is among His people: "The LORD your God is among you; He is mighty to save" (Zephaniah 3:17) is fulfilled in Jesus, Immanuel, God with us, who saves His people from their sins. The promise of a purified people with a pure speech, calling on the name of the LORD, is fulfilled in the church gathered from all nations in Christ. And the picture of God rejoicing over His redeemed with singing is the joy of the Father over every sinner who repents, and of the Bridegroom over His bride.',
  },
  {
    bookName: 'Haggai',
    author: 'Haggai the prophet',
    authorDetail:
      'The book of Haggai was written by the prophet Haggai, who ministered in Jerusalem in 520 BC, in the second year of the Persian king Darius. He was a contemporary of the prophet Zechariah and of Zerubbabel the governor and Joshua the high priest.\n\nHaggai is the most precisely dated of the prophets — his four messages are all dated to the day — and his entire prophecy is a single, focused summons: rebuild the house of the LORD.\n\nThe people had returned from exile and rebuilt their own houses, but the temple still lay in ruins. Haggai\'s short book called them to put God\'s house first, and the temple was completed four years later, in 516 BC.',
    audience:
      'Haggai was written to the returned exiles in Jerusalem — the people of God who had come home from Babylon but had left the temple unrebuilt.\n\nThe people had concluded that "the time has not come" to rebuild the house of the LORD, while they paneled their own houses. Haggai confronted their misplaced priorities: they were living in paneled houses while the house of the LORD lay in ruins.\n\nThe book called the people to consider their ways, to put God first, and to be strong — and it assured them that the LORD was with them and would fill His house with glory.',
    dateWritten: 'Approx. 520 BC',
    locationWritten: 'Jerusalem',
    chapters: 2,
    purpose:
      'To call the returned exiles to rebuild the temple and to put the house of the LORD first in their priorities.\n\nHaggai shows that blessing follows obedience: the people had sown much and harvested little because they neglected the house of the LORD, and the promise of the book is that from the day they began to rebuild, God would bless them — and would fill His house with glory.',
    keyTheme: 'Rebuild the house of the LORD; seek first the kingdom of God',
    summary:
      'Haggai opens with the LORD\'s challenge to the returned exiles:\n\nHaggai 1:4-5 (BSB)\n"Is it a time for you yourselves to dwell in your paneled houses, while this house lies in ruins? Now therefore, this is what the LORD of Hosts says: \'Consider your ways.\'"\n\nThe people had said the time had not come to rebuild the temple — yet they had built their own houses. Haggai showed them the consequences: they sowed much and harvested little, earned wages only to put them in a bag with holes, because the house of the LORD lay in ruins.\n\nThe people responded. Zerubbabel, Joshua, and the whole remnant obeyed the voice of the LORD, and the work on the temple began again. Then came the promise:\n\nHaggai 2:9 (BSB)\n"The latter glory of this house will be greater than the former," says the LORD of Hosts. "And in this place I will grant peace," declares the LORD of Hosts.\n\nHaggai also spoke to the discouraged — those who remembered the glory of the former temple and wept at the smallness of the new one. The LORD encouraged them to be strong, for He was with them:\n\nHaggai 2:4-5 (BSB)\n"Be strong, all you people of the land," declares the LORD. "Work! For I am with you," declares the LORD of Hosts. "This is the promise I made you when you came out of Egypt. And My Spirit remains among you; do not be afraid."\n\nThe book closes with a word to Zerubbabel, the governor — the signet ring of the LORD, chosen by Him — pointing forward to the day when the LORD would overthrow the nations and establish His kingdom.',
    keyScripture: [
      { reference: 'Haggai 1:4-5 (BSB)', text: '"Is it a time for you yourselves to dwell in your paneled houses, while this house lies in ruins? Now therefore, this is what the LORD of Hosts says: \'Consider your ways.\'"' },
      { reference: 'Haggai 2:4-5 (BSB)', text: '"Be strong, all you people of the land," declares the LORD. "Work! For I am with you," declares the LORD of Hosts. "This is the promise I made you when you came out of Egypt. And My Spirit remains among you; do not be afraid."' },
      { reference: 'Haggai 2:9 (BSB)', text: '"The latter glory of this house will be greater than the former," says the LORD of Hosts. "And in this place I will grant peace," declares the LORD of Hosts.' },
    ],
    background:
      'Haggai ministered in 520 BC, sixteen years after the first wave of exiles had returned to Jerusalem and laid the foundation of the temple — and then stopped. Opposition had stalled the work, and the people had turned to building their own houses.\n\nThe book records four dated messages from the LORD through Haggai:\n\nHaggai 1:1–11 — The First Message: Consider Your Ways\nThe call to rebuild the house of the LORD, with the evidence that the people\'s poverty was the fruit of their misplaced priorities.\n\nHaggai 1:12–15 — The Response\nThe people obey, and the work on the temple begins.\n\nHaggai 2:1–9 — The Second Message: Be Strong\nEncouragement for those who mourned the smallness of the new temple, with the promise that its latter glory would be greater.\n\nHaggai 2:10–23 — The Third and Fourth Messages: Blessing and the Signet Ring\nThe teaching that holiness is not contagious but defilement is — the people must obey — and the promise to Zerubbabel.\n\nHaggai is therefore the prophet of priority: a short book with a single message — put the house of the LORD first, and God will bless.',
    structure: [
      { range: '1:1–11', title: 'Consider your ways: the call to rebuild the temple' },
      { range: '1:12–15', title: 'The response: the people obey and the work begins' },
      { range: '2:1–9', title: 'Be strong: the promise of the latter glory' },
      { range: '2:10–23', title: 'Blessing and the signet ring: the promises to the obedient' },
    ],
    lessons:
      'Haggai teaches the priority of God. The people lived in paneled houses while the house of the LORD lay in ruins — and their whole lives suffered for it. Jesus spoke the same truth in the New Testament: "Seek first the kingdom of God and His righteousness" (Matthew 6:33).\n\nThe book teaches that misplaced priorities have visible consequences. "Consider your ways" — the people sowed much and harvested little, earned wages that slipped away, because God was not first. Our priorities show in our harvests.\n\nHaggai teaches the principle of blessing through obedience. "From this day on I will bless you" (Haggai 2:19) — the promise came when the people began to build. Obedience opens the channel of God\'s blessing.\n\nThe book teaches encouragement for the discouraged. Those who wept over the small new temple were told, "Be strong... Work! For I am with you." God\'s presence, not the size of the work, is the source of strength.\n\nHaggai teaches that God is with His people. "My Spirit remains among you; do not be afraid" — the promise that sustained the builders is the promise of the Spirit to the church.\n\nMost of all, Haggai teaches that small beginnings are not small to God. The new temple seemed like nothing compared to Solomon\'s — but the LORD declared its latter glory would be greater. God honors faithful obedience, whatever its size.',
    applications: [
      'Put God\'s house first; seek first His kingdom.',
      'Consider your ways: examine your priorities honestly.',
      'Be strong and work; the LORD is with you.',
      'Do not despise small beginnings.',
      'Obey, and expect the blessing of God.',
      'Do not be afraid; My Spirit remains among you.',
      'Rebuild what has been left in ruins.',
    ],
    mainThemes: ['The priority of God\'s house', 'Obedience and blessing', 'Encouragement for the discouraged', 'The presence of God with His people', 'Small beginnings and latter glory', 'The coming kingdom'],
    keyPeople: ['Haggai', 'Zerubbabel the governor', 'Joshua the high priest', 'The remnant of the returned exiles', 'Darius king of Persia'],
    keyVerses: [
      'Haggai 1:4-5 (BSB) — "Is it a time for you yourselves to dwell in your paneled houses, while this house lies in ruins?"',
      'Haggai 1:7 (BSB) — "Consider your ways."',
      'Haggai 2:4-5 (BSB) — "Be strong... Work! For I am with you."',
      'Haggai 2:9 (BSB) — "The latter glory of this house will be greater than the former."',
      'Haggai 2:19 (BSB) — "From this day on I will bless you."',
    ],
    christConnection: 'Haggai points to Christ as the glory of the temple: the Lord whom the returned exiles sought came suddenly to His house, and Jesus declared that He Himself is greater than the temple (Matthew 12:6). The promise that the latter glory of the house would be greater than the former was fulfilled when the Lord of glory Himself entered the temple courts in the flesh. And Zerubbabel, the LORD\'s signet ring, points to Christ, the greater Son of David in whom God establishes His kingdom forever.',
  },
  {
    bookName: 'Zechariah',
    author: 'Zechariah the prophet, son of Berechiah',
    authorDetail:
      'The book of Zechariah was written by the prophet Zechariah, son of Berechiah, the grandson of Iddo the priest (Zechariah 1:1). He ministered in Jerusalem alongside Haggai in 520–518 BC, encouraging the returned exiles to complete the rebuilding of the temple.\n\nZechariah was both a priest and a prophet, and his book is the longest and most messianic of the post-exilic prophecies. Its opening chapters are a series of eight night visions; its closing chapters are extended oracles of the coming King.\n\nWritten under the inspiration of God, Zechariah is quoted in the New Testament more than any other minor prophet — his prophecies of the humble King, the thirty pieces of silver, and the piercing of the Shepherd are all fulfilled in Jesus Christ.',
    audience:
      'Zechariah was written to the returned exiles in Jerusalem who were rebuilding the temple, and to every generation of God\'s people who needs encouragement to finish the work and hope in the coming King.\n\nThe book encouraged the builders that God was with them, that He would judge the nations that had scattered His people, and that Jerusalem would be restored and blessed.\n\nZechariah also spoke far beyond his own day: his visions and oracles look forward to the coming of the Messiah — the Branch, the humble King, the pierced Shepherd, and the fountain opened for sin.',
    dateWritten: 'Approx. 520–480 BC',
    locationWritten: 'Jerusalem',
    chapters: 14,
    purpose:
      'To encourage the returned exiles to rebuild the temple and to proclaim the coming of the Messiah and the kingdom of God.\n\nZechariah assures God\'s people that the LORD is with them, that He will complete what He has begun, and that the future belongs to the Messiah — the Branch who will build the temple, the humble King who comes to Jerusalem, and the Shepherd who is pierced for His people.',
    keyTheme: 'The rebuilding of the temple; the coming of the Messiah and His kingdom',
    summary:
      'Zechariah opens with a summons that sets the tone for the book:\n\nZechariah 1:3 (BSB)\n"Therefore tell the people: This is what the LORD of Hosts says: \'Return to Me,\' declares the LORD of Hosts, \'and I will return to you.\'"\n\nThe prophet then receives a series of eight night visions, each a promise of God\'s presence and purposes: the horseman among the myrtle trees, the four horns and the four craftsmen, the man with the measuring line, the cleansing of Joshua the high priest, the golden lampstand, the flying scroll, the woman in the basket, and the four chariots. Together they assure Israel that God is at work — judging the nations, cleansing His people, and restoring Jerusalem.\n\nThe center of the book contains its great messianic promises. The LORD declares He will raise up His servant, the Branch:\n\nZechariah 6:12 (BSB)\n"Behold, the man whose name is the Branch — He will branch out from His place and build the temple of the LORD."\n\nThe book proclaims the coming of the humble King:\n\nZechariah 9:9 (BSB)\n"Rejoice greatly, O daughter of Zion! Shout in triumph, O daughter of Jerusalem! Behold, your King is coming to you; He is righteous and victorious, humble and riding on a donkey, on a colt, the foal of a donkey."\n\nAnd it foretells the Shepherd who is pierced for His people:\n\nZechariah 12:10 (BSB)\n"And I will pour out on the house of David and on the residents of Jerusalem a spirit of grace and supplication. They will look on Me, the One they have pierced, and they will mourn for Him as one mourns for an only child."\n\nZechariah closes with the day of the LORD — the nations gathered against Jerusalem, the LORD fighting for His people, and the LORD reigning as King over all the earth. On that day, "The LORD will be King over all the earth" (Zechariah 14:9), and Jerusalem will be holy to the LORD.',
    keyScripture: [
      { reference: 'Zechariah 1:3 (BSB)', text: '"Therefore tell the people: This is what the LORD of Hosts says: \'Return to Me,\' declares the LORD of Hosts, \'and I will return to you.\'"' },
      { reference: 'Zechariah 9:9 (BSB)', text: '"Rejoice greatly, O daughter of Zion! Shout in triumph, O daughter of Jerusalem! Behold, your King is coming to you; He is righteous and victorious, humble and riding on a donkey, on a colt, the foal of a donkey."' },
      { reference: 'Zechariah 12:10 (BSB)', text: '"And I will pour out on the house of David and on the residents of Jerusalem a spirit of grace and supplication. They will look on Me, the One they have pierced, and they will mourn for Him as one mourns for an only child."' },
    ],
    background:
      'Zechariah began ministering in 520 BC, two months after Haggai, encouraging the returned exiles who were rebuilding the temple. His opening visions (chapters 1–6) came in 520–518 BC; the later oracles (chapters 9–14) may come from his later years.\n\nThe book can broadly be divided into two major sections:\n\nZechariah 1–8 — The Night Visions and the Messages\nEight night visions of God\'s purposes for Jerusalem, the crowning of Joshua the high priest, and the call to return to the LORD.\n\nZechariah 9–14 — The Oracles of the Coming King\nThe coming of the humble King, the judgment of the nations, the rejection and piercing of the Shepherd, the cleansing fountain for sin, and the day when the LORD reigns over all the earth.\n\nZechariah is therefore the most messianic of the minor prophets — the book that looks beyond the rebuilt temple to the coming King and His eternal kingdom.',
    structure: [
      { range: '1–6', title: 'The night visions: God\'s purposes for Jerusalem' },
      { range: '7–8', title: 'The call to return: fasting, justice, and mercy' },
      { range: '9–11', title: 'The coming King and the rejected Shepherd' },
      { range: '12–14', title: 'The day of the LORD: the pierced One, the fountain, and the King over all the earth' },
    ],
    lessons:
      'Zechariah teaches the priority of returning to God. "Return to Me, and I will return to you" — the book opens with the same summons that runs through all the prophets: the way to blessing is turning back to the LORD.\n\nThe book teaches the presence of God with His people. The vision of the lampstand declares, "Not by might nor by power, but by My Spirit" (Zechariah 4:6) — the temple and the work of God are accomplished by the Spirit of God, not by human strength.\n\nZechariah teaches the grace of God in cleansing. In the vision of Joshua the high priest, filthy garments are removed and clean ones put on — "See, I have removed your iniquity" (Zechariah 3:4). God not only forgives; He cleanses and clothes His people.\n\nThe book teaches the coming of the humble King. The Messiah does not come in proud display but riding on a donkey — righteous and victorious, yet humble. The cross is the crown of the King.\n\nZechariah teaches the cost of redemption. The Shepherd is pierced for His people, and the fountain is opened "to cleanse them from sin and impurity" (Zechariah 13:1). Salvation is not cheap; it flows from the pierced One.\n\nMost of all, Zechariah teaches the certainty of the kingdom. The LORD will be King over all the earth — every vision and oracle in the book moves toward that day, and the New Testament shows them fulfilled in Jesus Christ.',
    applications: [
      'Return to the LORD; He promises to return to you.',
      'Rely on the Spirit: "Not by might nor by power."',
      'Receive the cleansing God gives; He removes iniquity.',
      'Welcome the humble King who comes to you.',
      'Look on the pierced One and mourn for your sin.',
      'Drink from the fountain opened for sin and impurity.',
      'Live in hope of the day the LORD reigns over all the earth.',
    ],
    mainThemes: ['Return to the LORD', 'The presence and Spirit of God', 'The cleansing of sin', 'The coming Messiah and King', 'The pierced Shepherd', 'The kingdom of God over all the earth'],
    keyPeople: ['Zechariah', 'Zerubbabel the governor', 'Joshua the high priest', 'Haggai the prophet', 'The returned exiles', 'The nations of the day of the LORD'],
    keyVerses: [
      'Zechariah 1:3 (BSB) — "Return to Me... and I will return to you."',
      'Zechariah 4:6 (BSB) — "Not by might nor by power, but by My Spirit."',
      'Zechariah 6:12 (BSB) — "Behold, the man whose name is the Branch."',
      'Zechariah 9:9 (BSB) — "Your King is coming to you... humble and riding on a donkey."',
      'Zechariah 12:10 (BSB) — "They will look on Me, the One they have pierced."',
    ],
    christConnection: 'Zechariah is the most messianic of the minor prophets. Its promises are fulfilled in Jesus Christ: the Branch who builds the temple (John 2:19-21); the humble King who entered Jerusalem riding on a donkey (Matthew 21:4-5); the thirty pieces of silver and the potter\'s field (Matthew 27:9-10); the Shepherd struck and the sheep scattered (Matthew 26:31); the One pierced, whom we look on with mourning (John 19:37); and the fountain opened for sin, in which Christ cleanses His people by His blood.',
  },
  {
    bookName: 'Malachi',
    author: 'Malachi the prophet',
    authorDetail:
      'The book of Malachi was written by the prophet Malachi, whose name means "my messenger." Nothing is known of his life beyond the book itself, but his prophecy is dated to the period after the return from exile, around 430 BC — after the temple was rebuilt and the reforms of Ezra and Nehemiah had begun to fade.\n\nMalachi is the last book of the Old Testament, and it stands as the bridge between the prophets and the four hundred years of silence that preceded the coming of Christ.\n\nHis book takes the form of a series of disputes — the LORD makes a charge, the people answer with a question, and the LORD responds. It confronts a complacent people with the holiness of God, the emptiness of their worship, and the coming of the messenger who would prepare the way for the Lord.',
    audience:
      'Malachi was written to the people of Judah in the post-exilic period, a generation that had grown weary and complacent in its worship of the LORD.\n\nThe priests were offering blemished sacrifices, the people were withholding their tithes, and many were questioning whether God really loved them or whether serving Him was worthwhile. Malachi confronted each of these with the word of the LORD.\n\nFor every generation, Malachi exposes the drift of a complacent heart — and it ends the Old Testament with a promise: the LORD will send His messenger, and the day of His coming will burn like a furnace for the proud and rise with healing for those who fear His name.',
    dateWritten: 'Approx. 430–420 BC',
    locationWritten: 'Jerusalem',
    chapters: 4,
    purpose:
      'To confront the complacency and unfaithfulness of post-exilic Judah and to announce the coming of the LORD\'s messenger.\n\nMalachi indicts the priests and the people for their blemished sacrifices, withheld tithes, and faithless marriages, calls them to return to the LORD, and promises the coming of the messenger who will prepare the way for the Lord — the bridge from the Old Testament to the New.',
    keyTheme: 'The holiness of God; the corruption of worship; the coming Messenger',
    summary:
      'Malachi opens with a question that exposes the people\'s doubt:\n\nMalachi 1:2 (BSB)\n"I have loved you," says the LORD. But you ask, "How have You loved us?"\n\nThe book is a series of disputes in which the LORD confronts the people\'s complacency. The priests were offering blemished animals on the altar, and the LORD declared that He would rather the doors of the temple be shut than receive such offerings:\n\nMalachi 1:10 (BSB)\n"Oh, that one of you would shut the temple doors, so that you would no longer kindle useless fires on My altar! I take no pleasure in you," says the LORD of Hosts, "and I will accept no offering from your hands."\n\nThe people were robbing God by withholding tithes, and they had grown cynical: "It is futile to serve God" (Malachi 3:14). The LORD summoned them to return and promised to pour out blessing:\n\nMalachi 3:10 (BSB)\n"Bring the full tithe into the storehouse, so that there may be food in My house. Test Me in this," says the LORD of Hosts, "and see if I will not open the windows of heaven and pour out blessing for you without measure."\n\nThe book closes with the great promise that bridges the Testaments. The LORD will send His messenger to prepare the way:\n\nMalachi 3:1 (BSB)\n"Behold, I will send My messenger, who will prepare the way before Me. Then the Lord you are seeking will suddenly come to His temple — the Messenger of the covenant, in whom you delight."\n\nAnd the last words of the Old Testament promise the forerunner of the Messiah:\n\nMalachi 4:5-6 (BSB)\n"Behold, I will send you Elijah the prophet before the coming of the great and awesome day of the LORD. And he will turn the hearts of the fathers to their children, and the hearts of the children to their fathers."',
    keyScripture: [
      { reference: 'Malachi 1:2 (BSB)', text: '"I have loved you," says the LORD. But you ask, "How have You loved us?"' },
      { reference: 'Malachi 3:10 (BSB)', text: '"Bring the full tithe into the storehouse, so that there may be food in My house. Test Me in this," says the LORD of Hosts, "and see if I will not open the windows of heaven and pour out blessing for you without measure."' },
      { reference: 'Malachi 4:5-6 (BSB)', text: '"Behold, I will send you Elijah the prophet before the coming of the great and awesome day of the LORD. And he will turn the hearts of the fathers to their children, and the hearts of the children to their fathers."' },
    ],
    background:
      'Malachi ministered in Jerusalem in the mid-fifth century BC, more than eighty years after the temple was rebuilt. The enthusiasm of the return had faded; the reforms of Ezra and Nehemiah had not held; and the people had settled into a weary, formal religion.\n\nThe book can broadly be divided into six disputes, each following the pattern of charge, question, and answer:\n\nMalachi 1:2-5 — The LORD\'s Love Questioned\n"How have You loved us?" — answered by the contrast between Jacob and Esau.\n\nMalachi 1:6–2:9 — The Priests\' Worship Despised\nThe blemished sacrifices and the corruption of the priesthood.\n\nMalachi 2:10-16 — The Covenant of Marriage Broken\nThe faithlessness of Judah in marriage and the divorce of the covenant.\n\nMalachi 2:17–3:6 — The Justice of God Questioned\n"Where is the God of justice?" — answered by the coming of the Messenger.\n\nMalachi 3:7-12 — The Robbery of God\nThe withheld tithes and the promise of blessing.\n\nMalachi 3:13–4:6 — The Day of the LORD\nThe futility of serving God questioned, the book of remembrance, and the promise of Elijah.\n\nMalachi is therefore the Old Testament\'s final summons — and its final promise: the Messenger is coming, and the day of the LORD will burn for the proud and heal for those who fear His name.',
    structure: [
      { range: '1:1–5', title: 'The first dispute: "How have You loved us?"' },
      { range: '1:6–2:9', title: 'The priests condemned: blemished sacrifices and corrupted worship' },
      { range: '2:10–16', title: 'The covenant broken: faithlessness in marriage' },
      { range: '2:17–3:12', title: 'The coming Messenger, the robbery of God, and the promised blessing' },
      { range: '3:13–4:6', title: 'The day of the LORD, the book of remembrance, and the promise of Elijah' },
    ],
    lessons:
      'Malachi teaches the love of God. The book opens with God\'s declaration — "I have loved you" — even as His people doubted it. The entire book is the argument of a God who loves His people and longs for them to return to Him.\n\nThe book teaches the holiness of worship. God would not accept blemished offerings — He would rather the temple doors be shut than receive half-hearted worship. God is to be honored with our best, not our leftovers.\n\nMalachi teaches the reality of spiritual drift. The people had not abandoned the temple; they had simply stopped caring — weary, formal, cynical. Drift is often quiet, and Malachi exposes it with surgical precision.\n\nThe book teaches the importance of faithfulness in the small things. The tithe, the sacrifices, the marriages — the book deals in the ordinary duties that reveal the state of the heart.\n\nMalachi teaches the promise of blessing for obedience. "Test Me in this" — the only place in Scripture where God invites His people to test Him — and the promise is blessing poured out without measure.\n\nMost of all, Malachi teaches the coming of the Lord. The book ends the Old Testament looking forward: the Messenger will come, Elijah will prepare the way, and the day of the LORD will bring healing for those who fear His name. The New Testament opens with that promise fulfilled in John the Baptist and Jesus Christ.',
    applications: [
      'Know that God loves you, even when you doubt it.',
      'Give God your best, not your leftovers.',
      'Beware the quiet drift of a complacent heart.',
      'Be faithful in the small duties of the Christian life.',
      'Return to the LORD; He promises to return to you.',
      'Honor the covenant of marriage.',
      'Prepare for the coming of the Lord.',
      'Fear the LORD\'s name, and let His healing rise like the sun.',
    ],
    mainThemes: ['The love of God questioned and defended', 'The holiness of worship', 'Spiritual complacency and drift', 'Faithfulness in marriage and the tithe', 'The coming Messenger', 'The day of the LORD and the book of remembrance'],
    keyPeople: ['Malachi', 'The priests of Judah', 'The people of Judah', 'The faithless of the covenant', 'Elijah the prophet (promised)'],
    keyVerses: [
      'Malachi 1:2 (BSB) — "I have loved you," says the LORD.',
      'Malachi 1:10 (BSB) — "I will accept no offering from your hands."',
      'Malachi 3:1 (BSB) — "I will send My messenger, who will prepare the way before Me."',
      'Malachi 3:10 (BSB) — "Test Me in this... and see if I will not open the windows of heaven."',
      'Malachi 4:2 (BSB) — "The sun of righteousness will rise with healing in its wings."',
    ],
    christConnection: 'Malachi points to Christ as the Messenger of the covenant who suddenly comes to His temple (Malachi 3:1) — fulfilled when Jesus, the Lord whom Israel sought, entered the temple as a child and cleansed it as the Messiah. The promise of Elijah the forerunner was fulfilled in John the Baptist, of whom Jesus said, "He is Elijah who was to come" (Matthew 11:14; 17:11-13). And "the sun of righteousness" rising "with healing in its wings" (Malachi 4:2) is the risen Christ, who brings healing and life to all who fear His name.',
  },
  {
    bookName: 'Matthew',
    author: 'Matthew (Levi), the tax collector and apostle',
    authorDetail:
      'The first Gospel was written by Matthew, also called Levi, the son of Alphaeus, who was a tax collector before Jesus called him to follow (Matthew 9:9; Mark 2:14). Tax collectors were despised by the Jews as agents of the Roman occupiers, and Matthew\'s own Gospel preserves the memory of his former life — he is the only Gospel writer who records the parable of the unforgiving servant and the payment of the temple tax.\n\nMatthew was one of the twelve apostles, an eyewitness of Jesus\' ministry, death, and resurrection. The early church unanimously attributed the first Gospel to him and understood it to have been written primarily for Jewish readers to demonstrate that Jesus is the promised Messiah.\n\nChristians have traditionally understood Matthew to have written under the inspiration of God, arranging his eyewitness material into five great discourses that echo the five books of Moses.',
    audience:
      'Matthew was written to Jewish Christians who needed to see that Jesus of Nazareth is the promised Messiah of the Old Testament. The book repeatedly connects Jesus to the Scriptures — "All this took place to fulfill what the Lord had said through the prophet" — and traces His genealogy from Abraham and David.\n\nThe Gospel also speaks to the whole church: it shows that the kingdom of heaven, first offered to Israel, extends to all nations, and it closes with the Great Commission to make disciples of every people.\n\nMatthew therefore addressed believers who needed assurance that their faith in Jesus rested on the fulfillment of God\'s ancient promises.',
    dateWritten: 'Approx. AD 50–70',
    locationWritten: 'Probably Antioch or Palestine',
    chapters: 28,
    purpose:
      'To demonstrate that Jesus of Nazareth is the promised Messiah, the Son of David, the Son of Abraham, who fulfills the Old Testament Scriptures and establishes the kingdom of heaven.\n\nMatthew presents Jesus as the authoritative Teacher, the King who has come to His people, and the Son of God who dies for sinners and rises in victory — calling His disciples to hear, obey, and follow Him to the ends of the earth.',
    keyTheme: 'Jesus as the Messiah-King who fulfills prophecy',
    summary:
      'Matthew presents Jesus as the promised King who fulfills the Old Testament. The Gospel opens with the genealogy that traces Jesus from Abraham through David, and with the announcement of His virgin birth:\n\nMatthew 1:23 (BSB)\n"Behold, the virgin will be with child and will give birth to a son, and they will call Him Immanuel" (which means, "God with us").\n\nAfter His baptism and temptation, Jesus began His Galilean ministry, preaching, "Repent, for the kingdom of heaven is near" (Matthew 4:17). He called twelve disciples and taught with an authority that amazed the crowds. The Gospel is structured around five great discourses — the Sermon on the Mount, the mission of the twelve, the parables of the kingdom, the life of the community, and the Olivet Discourse.\n\nAt Caesarea Philippi, Peter confessed Him:\n\nMatthew 16:16 (BSB)\nSimon Peter replied, "You are the Christ, the Son of the living God."\n\nFrom that point the Gospel moves toward the cross. Jesus predicted His death, taught the cost of discipleship, and entered Jerusalem in triumph. After His betrayal, trial, and crucifixion, the tomb was found empty, and the risen Jesus commissioned His disciples:\n\nMatthew 28:19-20 (BSB)\n"Therefore go and make disciples of all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age."\n\nMatthew therefore presents Jesus as Emmanuel — God with us — who establishes the kingdom of heaven and sends His disciples into all the world.',
    keyScripture: [
      { reference: 'Matthew 1:23 (BSB)', text: '"Behold, the virgin will be with child and will give birth to a son, and they will call Him Immanuel" (which means, "God with us").' },
      { reference: 'Matthew 16:16 (BSB)', text: 'Simon Peter replied, "You are the Christ, the Son of the living God."' },
      { reference: 'Matthew 28:19-20 (BSB)', text: '"Therefore go and make disciples of all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Spirit, and teaching them to obey everything I have commanded you."' },
    ],
    background:
      'Matthew wrote primarily for Jewish readers, and the whole Gospel is designed to show Jesus as the fulfillment of Israel\'s hopes. He quotes the Old Testament more than any other Gospel writer — more than sixty times — often with the formula "that it might be fulfilled."\n\nThe Gospel is deliberately structured around five great discourses of Jesus, echoing the five books of Moses, each discourse followed by a narrative section. The five discourses are: the Sermon on the Mount (chapters 5–7), the mission discourse (chapter 10), the parables of the kingdom (chapter 13), the community discourse (chapter 18), and the Olivet Discourse (chapters 24–25).\n\nThe book can broadly be divided into three major sections:\n\nMatthew 1–4 — The Coming of the King\nThe genealogy, the virgin birth, the visit of the Magi, the flight to Egypt, John the Baptist, and the baptism and temptation of Jesus.\n\nMatthew 5–25 — The Ministry of the King\nThe Galilean ministry, the five discourses, the miracles, the opposition of the religious leaders, and the journey to Jerusalem.\n\nMatthew 26–28 — The Passion and Resurrection of the King\nThe Last Supper, the arrest, the trials, the crucifixion, the empty tomb, and the Great Commission.\n\nMatthew therefore presents the gospel of the King: the King has come, the King has taught, the King has died and risen, and His kingdom will never end.',
    structure: [
      { range: '1–2', title: 'The birth of the King: genealogy, Magi, and flight to Egypt' },
      { range: '3–4', title: 'The preparation of the King: baptism, temptation, and the call of the disciples' },
      { range: '5–20', title: 'The ministry of the King: the five discourses, miracles, and growing opposition' },
      { range: '21–27', title: 'The passion of the King: entry into Jerusalem, trial, and crucifixion' },
      { range: '28', title: 'The resurrection and the Great Commission' },
    ],
    lessons:
      'Matthew teaches that Jesus is the fulfillment of all God\'s promises. Genealogy after genealogy, prophecy after prophecy, Matthew shows that the entire Old Testament pointed to Jesus — the Son of Abraham, the Son of David, the promised Messiah.\n\nThe book teaches the ethics of the kingdom. The Sermon on the Mount sets the standard of the kingdom: blessed are the poor in spirit, the meek, the merciful, the pure in heart. Kingdom living is characterized by humility, love of enemies, and righteousness that surpasses mere external religion.\n\nMatthew teaches the authority of Jesus. He taught as one having authority, healed the sick, calmed the storm, forgave sins, and claimed to be the Son of God. The Gospel calls readers to decide: either Jesus is who He claims to be, or He is not.\n\nThe book teaches the cost of discipleship. "If anyone would come after Me, let him deny himself and take up his cross and follow Me" (Matthew 16:24). Following Jesus means losing one\'s life to find it, and the kingdom is worth selling everything to possess.\n\nMatthew also teaches the mercy of the King. The same Gospel that pronounces judgment on the hypocritical religious leaders welcomes tax collectors, sinners, and Gentiles. Jesus came to call sinners, and the invitation of the kingdom is extended to all.\n\nMost of all, Matthew teaches the presence of the King: "I am with you always, to the very end of the age." The Gospel that begins with Emmanuel — God with us — ends with the risen Christ promising His presence to His people forever.',
    applications: [
      'See Jesus as the fulfillment of all God\'s promises.',
      'Seek first the kingdom of God and His righteousness.',
      'Hear and obey the words of Jesus with authority.',
      'Take up your cross and follow Christ daily.',
      'Extend mercy and forgiveness as you have received them.',
      'Live as salt and light in the world.',
      'Make disciples of all nations.',
      'Rest in the promise: "I am with you always."',
    ],
    mainThemes: ['Fulfillment of prophecy', 'The kingdom of heaven', 'Jesus\' authority', 'Discipleship and obedience', 'Grace to all nations', 'Judgment and mercy'],
    keyPeople: ['Jesus', 'Mary and Joseph', 'John the Baptist', 'Peter', 'Judas Iscariot', 'The twelve disciples'],
    keyVerses: [
      'Matthew 1:23 (BSB) — "They will call Him Immanuel... God with us."',
      'Matthew 5:3 (BSB) — "Blessed are the poor in spirit, for theirs is the kingdom of heaven."',
      'Matthew 11:28 (BSB) — "Come to Me, all you who are weary and burdened, and I will give you rest."',
      'Matthew 16:16 (BSB) — "You are the Christ, the Son of the living God."',
      'Matthew 28:19-20 (BSB) — The Great Commission.',
    ],
    christConnection: 'Matthew directly presents Jesus as the fulfillment of Old Testament hope. He uses more Old Testament quotations than any Gospel, showing Jesus as the Messiah, the Son of David, Emmanuel, the King of the Jews, and the one in whom the prophecies of the suffering Servant and the coming King are fulfilled. Jesus is the greater Moses who gives the law of the kingdom, the greater David who inherits the eternal throne, and the Son of God who is with His people always.',
  },
  {
    bookName: 'Mark',
    author: 'John Mark, companion of Peter and Paul',
    authorDetail:
      'The second Gospel was written by John Mark, the son of a Jerusalem woman named Mary in whose house the early church gathered (Acts 12:12). Mark accompanied Paul and Barnabas on the first missionary journey and later served as Peter\'s companion and interpreter in Rome.\n\nThe early church consistently testified that Mark wrote his Gospel from the preaching of Peter, the apostle who was an eyewitness of Jesus\' ministry. The Gospel\'s vivid, eyewitness details — the green grass where the crowds sat, the exact number of loaves, the look Jesus gave Peter — bear the marks of Peter\'s firsthand account.\n\nMark later proved useful to Paul and was with him at the end of his life (2 Timothy 4:11). Christians have traditionally understood his Gospel to have been written under the inspiration of God for a Gentile, especially Roman, audience.',
    audience:
      'Mark was written for Gentile believers, especially Romans, who needed to see who Jesus is and what it means to follow Him.\n\nThe Gospel explains Jewish customs and translates Aramaic words for readers unfamiliar with them, and its opening — "The beginning of the gospel of Jesus Christ, the Son of God" — declares its theme plainly.\n\nMark addressed believers facing suffering and persecution, showing them a Savior who served, suffered, and died — and calling them to take up their own crosses and follow Him.',
    dateWritten: 'Approx. AD 55–65',
    locationWritten: 'Probably Rome',
    chapters: 16,
    purpose:
      'To present Jesus as the suffering Son of God who came to serve and give His life as a ransom for many.\n\nMark moves at a breathless pace to show the power of Jesus — then turns the whole Gospel toward the cross, where that power is most clearly displayed. The Gospel calls its readers to follow Jesus in faithful, costly discipleship.',
    keyTheme: 'Jesus the suffering Servant and powerful Son of God',
    summary:
      'Mark is the shortest and most action-packed Gospel. From its first verse it declares its subject:\n\nMark 1:1 (BSB)\nThis is the beginning of the gospel of Jesus Christ, the Son of God.\n\nThe narrative moves rapidly — the word "immediately" appears more than forty times — as Jesus calls disciples, heals the sick, casts out demons, calms storms, and teaches with an authority that astonishes the crowds. Early in His ministry Jesus calls His disciples to follow Him:\n\nMark 1:17 (BSB)\n"Come, follow Me," Jesus said, "and I will make you fishers of men."\n\nAt the midpoint of the Gospel, Peter makes the great confession:\n\nMark 8:29 (BSB)\n"You are the Christ," Peter answered.\n\nFrom that moment, Jesus begins to teach plainly that the Son of Man must suffer, die, and rise again, and He calls His disciples to the same path of self-denial:\n\nMark 8:34 (BSB)\nThen Jesus called the crowd to Him along with His disciples and said, "If anyone would come after Me, he must deny himself and take up his cross and follow Me."\n\nThe Gospel builds relentlessly toward the cross. Jesus is betrayed, tried, crucified, and buried — and the centurion at the cross confesses what the whole Gospel has been declaring:\n\nMark 15:39 (BSB)\nAnd when the centurion standing there in front of Jesus saw how He had breathed His last, he said, "Truly this man was the Son of God!"\n\nMark ends with the empty tomb and the message of the resurrection, calling every reader to the same confession and the same costly following.',
    keyScripture: [
      { reference: 'Mark 1:1 (BSB)', text: 'This is the beginning of the gospel of Jesus Christ, the Son of God.' },
      { reference: 'Mark 8:34 (BSB)', text: 'Then Jesus called the crowd to Him along with His disciples and said, "If anyone would come after Me, he must deny himself and take up his cross and follow Me."' },
      { reference: 'Mark 10:45 (BSB)', text: 'For even the Son of Man did not come to be served, but to serve, and to give His life as a ransom for many.' },
    ],
    background:
      'Mark is the earliest of the four Gospels, written for a Roman audience that valued action, power, and directness. It explains Jewish customs, translates Aramaic phrases, and uses Latin loanwords — details that point to readers in the Roman world.\n\nThe Gospel is built around a dramatic turning point. The first half presents the power of Jesus in Galilee; the second half presents His path of suffering in Jerusalem. The book can broadly be divided into three major sections:\n\nMark 1:1–8:30 — The Power of Jesus in Galilee\nJesus is baptized, tempted, calls disciples, performs miracles, and teaches with authority. The crowds wonder who He is, and Peter confesses Him as the Christ.\n\nMark 8:31–10:52 — The Journey to Jerusalem\nJesus teaches plainly about His coming suffering and death, transfigures before three disciples, and calls His followers to servanthood and self-denial.\n\nMark 11–16 — The Passion and Resurrection in Jerusalem\nThe entry into Jerusalem, the cleansing of the temple, the Olivet Discourse, the Last Supper, the arrest, the trials, the crucifixion, and the empty tomb.\n\nMark therefore presents the gospel in its most concentrated form: the Son of God who serves, suffers, and dies as a ransom for many, and rises again.',
    structure: [
      { range: '1:1–13', title: 'The preparation: John the Baptist, baptism, and temptation' },
      { range: '1:14–8:30', title: 'The Galilean ministry: power, miracles, and the confession of Peter' },
      { range: '8:31–10:52', title: 'The journey to Jerusalem: suffering, servanthood, and discipleship' },
      { range: '11–15', title: 'The passion: entry, trial, crucifixion, and death' },
      { range: '16', title: 'The resurrection and the empty tomb' },
    ],
    lessons:
      'Mark teaches who Jesus is. The whole Gospel answers the question the disciples kept asking — "Who is this?" — with the centurion\'s confession: "Truly this man was the Son of God." Jesus has authority over demons, disease, and death itself.\n\nThe book teaches that the cross is the center of the Christian faith. Mark devotes nearly half the Gospel to the final week of Jesus\' life. His power is most clearly displayed not in the miracles of Galilee but in the self-giving love of the cross.\n\nMark teaches the cost of discipleship. "Take up your cross and follow Me" is not a suggestion but the shape of following Jesus. Discipleship means self-denial, servanthood, and the willingness to lose one\'s life for the sake of Christ and the gospel.\n\nThe book teaches the danger of unbelief. Mark is honest about the disciples\' failures — their fear, hardness of heart, and desertion — and about the crowds who saw miracles yet did not believe. Faith, not miraculous display, is what Jesus seeks.\n\nMark also teaches faithful endurance under suffering. Written to believers facing persecution, the Gospel shows a Savior who suffered faithfully and a community called to watch, pray, and persevere to the end.\n\nMost of all, Mark teaches the gospel in action: Jesus came to serve, to give His life as a ransom for many, and to call sinners to follow Him.',
    applications: [
      'Confess Jesus as the Christ, the Son of God.',
      'Take up your cross daily and follow Christ.', 
      'Serve others as Jesus came to serve.',
      'Trust Jesus\' authority over every circumstance.',
      'Endure suffering with faithful perseverance.',
      'Watch and pray; the spirit is willing but the flesh is weak.',
      'Do not let the cares of the world choke the word.',
      'Tell the good news of the risen Christ.',
    ],
    mainThemes: ['The identity of Jesus', 'Servant leadership', 'The cost of discipleship', 'Faith and doubt', 'The kingdom breaking in', 'The cross as the center'],
    keyPeople: ['Jesus', 'Peter', 'John the Baptist', 'James and John', 'The twelve disciples', 'Pontius Pilate', 'The centurion'],
    keyVerses: [
      'Mark 1:17 (BSB) — "Come, follow Me... and I will make you fishers of men."',
      'Mark 8:29 (BSB) — "You are the Christ."',
      'Mark 8:34 (BSB) — "Deny himself and take up his cross and follow Me."',
      'Mark 10:45 (BSB) — "The Son of Man did not come to be served, but to serve, and to give His life as a ransom for many."',
      'Mark 15:39 (BSB) — "Truly this man was the Son of God!"',
    ],
    christConnection: 'Mark presents Jesus as both the powerful Son of God who commands demons, calms storms, and raises the dead, and the suffering Servant who gives His life as a ransom for many. This dual portrait shows that Christ\'s power is most clearly displayed in His sacrificial love: the Son of God is the suffering Servant, and the suffering Servant is the Son of God.',
  },
  {
    bookName: 'Luke',
    author: 'Luke, the physician and companion of Paul',
    authorDetail:
      'The third Gospel was written by Luke, the beloved physician and companion of the apostle Paul (Colossians 4:14; 2 Timothy 4:11; Philemon 24). Luke was a Gentile — the only New Testament writer who was not a Jew — and the most educated of the Gospel writers, writing in elegant Greek.\n\nLuke was not an eyewitness of Jesus\' earthly ministry, but he states plainly that he carefully investigated everything from the beginning, consulting eyewitnesses and ministers of the word (Luke 1:1-4). He traveled with Paul and had access to the apostles and to Mary herself, which explains the unique details of the birth narratives.\n\nLuke also wrote the book of Acts, and together the two volumes form a two-part history of Jesus and the early church. Christians have traditionally understood both to have been written under the inspiration of God.',
    audience:
      'Luke addressed his Gospel to "most excellent Theophilus" (Luke 1:3), a man of rank, and through him to a largely Gentile audience.\n\nThe Gospel was written so that Theophilus "may know the certainty of the things" he had been taught — assurance that the Christian faith rests on reliable, eyewitness history.\n\nLuke\'s Gospel especially emphasizes the universality of salvation: Jesus came for the poor, women, outcasts, Samaritans, and Gentiles as well as for Israel. The book shows that the good news is for all people.',
    dateWritten: 'Approx. AD 58–65',
    locationWritten: 'Probably Caesarea or Rome',
    chapters: 24,
    purpose:
      'To provide an orderly and historically verified account of Jesus\' life, ministry, death, and resurrection, showing His compassion for all people.\n\nLuke wrote so that his readers might have certainty about the gospel — that Jesus is the Savior for all humanity, who came to seek and save the lost, and who commissions His church to carry the good news to the ends of the earth.',
    keyTheme: 'Jesus the compassionate Savior for all humanity',
    summary:
      'Luke, the longest Gospel, provides the most complete account of Jesus\' life and ministry. It opens with the announcement of John the Baptist\'s birth and the annunciation to Mary, and the birth of Jesus is announced with words that capture Luke\'s theme:\n\nLuke 2:11 (BSB)\n"Today in the city of David a Savior has been born to you. He is Christ the Lord!"\n\nLuke alone preserves many of the most beloved stories of Jesus: the Good Samaritan, the Prodigal Son, the rich man and Lazarus, Zacchaeus, the ten lepers, and the road to Emmaus. He emphasizes Jesus\' compassion for the poor, women, Samaritans, and outcasts. Jesus declared His mission with words from Isaiah:\n\nLuke 4:18-19 (BSB)\n"The Spirit of the Lord is on Me, because He has anointed Me to preach good news to the poor. He has sent Me to proclaim freedom for the captives and recovery of sight for the blind, to release the oppressed, to proclaim the year of the Lord\'s favor."\n\nLuke gives the most detailed account of Jesus\' birth, His prayer life, and His journey to Jerusalem, and he alone records Jesus\' words of forgiveness from the cross: "Father, forgive them, for they do not know what they are doing" (Luke 23:34).\n\nThe Gospel closes with the risen Jesus opening the Scriptures to His disciples on the road to Emmaus and commissioning them to preach repentance and forgiveness to all nations, beginning in Jerusalem. Luke\'s story continues in the book of Acts, where the risen Christ works through His church to the ends of the earth.',
    keyScripture: [
      { reference: 'Luke 2:11 (BSB)', text: '"Today in the city of David a Savior has been born to you. He is Christ the Lord!"' },
      { reference: 'Luke 4:18 (BSB)', text: '"The Spirit of the Lord is on Me, because He has anointed Me to preach good news to the poor. He has sent Me to proclaim freedom for the captives and recovery of sight for the blind."' },
      { reference: 'Luke 19:10 (BSB)', text: 'For the Son of Man came to seek and to save the lost.' },
    ],
    background:
      'Luke wrote the most historically thorough of the Gospels, dating events by the reigns of rulers and carefully ordering the narrative "from the beginning." His account reflects the accuracy of a physician and the research of a historian.\n\nThe Gospel is the first volume of a two-part work continued in Acts. Together they trace the spread of the gospel from Bethlehem to Jerusalem, and from Jerusalem to Rome — from the cradle of the Savior to the capital of the empire.\n\nThe book can broadly be divided into four major sections:\n\nLuke 1–2 — The Birth Narratives\nThe announcements to Zechariah and Mary, the births of John and Jesus, the shepherds, the presentation in the temple, and the boy Jesus in the temple.\n\nLuke 3–9:50 — The Galilean Ministry\nThe ministry of John the Baptist, the baptism and temptation of Jesus, the Sermon on the Plain, miracles, the choosing of the twelve, and the confession of Peter.\n\nLuke 9:51–19:27 — The Journey to Jerusalem\nA long section unique to Luke\'s emphasis, in which Jesus teaches on the road — the parables of the Good Samaritan and the Prodigal Son, the mission of the seventy-two, and the growing opposition of the religious leaders.\n\nLuke 19:28–24 — The Passion, Resurrection, and Ascension\nThe entry into Jerusalem, the Last Supper, the arrest, the trials, the crucifixion, the resurrection, the Emmaus road, and the ascension.\n\nLuke therefore presents the gospel as history with a heart: the Savior who came for all people, who died for sinners, and who rose to send His witnesses to the world.',
    structure: [
      { range: '1–2', title: 'The birth narratives: John the Baptist and the birth of Jesus' },
      { range: '3–9:50', title: 'The Galilean ministry: baptism, teaching, miracles, and the twelve' },
      { range: '9:51–19:27', title: 'The journey to Jerusalem: parables of compassion and the cost of discipleship' },
      { range: '19:28–23', title: 'The passion: entry, Last Supper, trial, and crucifixion' },
      { range: '24', title: 'The resurrection, the Emmaus road, and the ascension' },
    ],
    lessons:
      'Luke teaches the universal love of God. More than any other Gospel, Luke shows Jesus reaching out to the poor, women, Samaritans, lepers, tax collectors, and sinners. No one is beyond the reach of the Savior\'s compassion.\n\nThe book teaches the value of the lost. The parables of the lost sheep, the lost coin, and the lost son reveal the heart of God: He rejoices over one sinner who repents. Jesus came to seek and to save the lost.\n\nLuke teaches the importance of prayer. Luke alone records many of Jesus\' prayers and parables about prayer — the friend at midnight, the persistent widow, the Pharisee and the tax collector. Jesus prayed at His baptism, before choosing the twelve, at the transfiguration, in Gethsemane, and from the cross.\n\nThe book teaches the dangers of wealth and the blessings of generosity. Luke\'s Gospel contains sober warnings about riches — the rich fool, the rich man and Lazarus — and celebrates those who give freely, like Zacchaeus, who gave half his possessions to the poor.\n\nLuke also teaches the joy of salvation. His Gospel is filled with rejoicing: the Magnificat, the angels\' song, the shepherd\'s return, the prodigal\'s homecoming, the women at the empty tomb. Salvation is good news that calls for celebration.\n\nMost of all, Luke teaches that Jesus is the Savior of all people — and that His followers are sent to be witnesses of His resurrection to the ends of the earth.',
    applications: [
      'Extend compassion to the poor, the outcast, and the overlooked.',
      'Rejoice over every sinner who repents.', 
      'Make prayer a constant habit, as Jesus did.',
      'Hold wealth loosely and give generously.',
      'Welcome those whom the world excludes.',
      'Look for Jesus in the Scriptures, as the Emmaus disciples did.',
      'Be a witness of the risen Christ to all nations.',
      'Live in the joy of salvation.',
    ],
    mainThemes: ['God\'s love for all people', 'Compassion for the marginalized', 'The work of the Holy Spirit', 'Prayer and worship', 'Joy and celebration', 'Salvation as good news for all'],
    keyPeople: ['Jesus', 'Mary', 'Elizabeth and Zechariah', 'John the Baptist', 'Peter', 'The twelve disciples', 'The women who followed Jesus'],
    keyVerses: [
      'Luke 1:46-47 (BSB) — "My soul magnifies the Lord, and my spirit rejoices in God my Savior."',
      'Luke 2:11 (BSB) — "A Savior has been born to you. He is Christ the Lord!"',
      'Luke 15:20 (BSB) — The father runs to the returning prodigal.',
      'Luke 19:10 (BSB) — "The Son of Man came to seek and to save the lost."',
      'Luke 24:6-7 (BSB) — "He is not here; He has risen!"',
    ],
    christConnection: 'Luke presents Jesus as the universal Savior who breaks down barriers of race, class, and gender. He is the fulfillment of Isaiah\'s anointed Servant who brings good news to the poor, liberty to the captives, and salvation to all nations; the Son of Man who came to seek and save the lost; the crucified Savior who prays for His executioners; and the risen Lord who opens the Scriptures and sends His witnesses to the ends of the earth.',
  },
  {
    bookName: 'John',
    author: 'The apostle John, the beloved disciple',
    authorDetail:
      'The fourth Gospel was written by the apostle John, the son of Zebedee, one of the twelve disciples and a member of Jesus\' inner circle along with Peter and James. John calls himself "the disciple whom Jesus loved" and records that he was present at the Last Supper, the cross, and the empty tomb.\n\nJohn was an eyewitness of everything he wrote. The Gospel contains precise details only an eyewitness would know — the sixth hour at the well, the number of water jars, the fragrance of the ointment, the names of the servants — and John states his purpose plainly: "These are written so that you may believe that Jesus is the Christ, the Son of God."\n\nEarly tradition places John\'s later ministry in Ephesus, where he cared for the churches of Asia Minor and wrote this Gospel near the end of the first century, under the inspiration of God.',
    audience:
      'John wrote his Gospel so that readers — believers and seekers alike — "may believe that Jesus is the Christ, the Son of God, and that by believing you may have life in His name" (John 20:31).\n\nThe Gospel was written to the wider world of the late first century, where Jews and Greeks alike needed to see who Jesus truly is. John writes for every reader who has not seen Jesus but is called to believe in Him.\n\nHis Gospel speaks especially to believers, deepening their faith by showing the divine identity of Christ and the eternal life that is found in Him alone.',
    dateWritten: 'Approx. AD 85–95',
    locationWritten: 'Often associated with Ephesus in early Christian tradition',
    chapters: 21,
    purpose:
      'That readers may believe Jesus is the Christ, the Son of God, and have life in His name.\n\nJohn selected seven miraculous signs and seven "I am" sayings of Jesus to reveal His divine identity, and he wove together sign, discourse, death, and resurrection to call his readers to saving faith in the eternal Son of God.',
    keyTheme: 'Jesus, the eternal Word and Son of God, gives life to those who believe',
    summary:
      'John presents Jesus as the eternal Word of God made flesh. The Gospel opens with a prologue that declares Jesus\' divine identity and His place in creation:\n\nJohn 1:14 (BSB)\nThe Word became flesh and made His dwelling among us. We have seen His glory, the glory of the one and only Son from the Father, full of grace and truth.\n\nJohn records seven miraculous signs — water turned to wine, the healing of the official\'s son, the healing at the pool, the feeding of the five thousand, walking on water, the healing of the man born blind, and the raising of Lazarus — each revealing who Jesus is. And he records Jesus\' seven "I am" sayings: the bread of life, the light of the world, the door, the good shepherd, the resurrection and the life, the way and the truth and the life, and the true vine.\n\nThe Gospel contains the most famous verse in Scripture:\n\nJohn 3:16 (BSB)\nFor God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.\n\nIn the upper room, Jesus comforted His disciples and promised the Holy Spirit, the Helper, who would lead them into all truth. He declared:\n\nJohn 14:6 (BSB)\nJesus answered, "I am the way and the truth and the life. No one comes to the Father except through Me."\n\nJohn\'s account of the cross emphasizes that Jesus was in control to the end — laying down His life of His own accord — and his account of the resurrection climaxes with Thomas falling before the risen Jesus:\n\nJohn 20:28 (BSB)\nThomas replied, "My Lord and my God!"\n\nJohn closes by explaining why he wrote: "These are written so that you may believe that Jesus is the Christ, the Son of God, and that by believing you may have life in His name" (John 20:31).',
    keyScripture: [
      { reference: 'John 1:14 (BSB)', text: 'The Word became flesh and made His dwelling among us. We have seen His glory, the glory of the one and only Son from the Father, full of grace and truth.' },
      { reference: 'John 3:16 (BSB)', text: 'For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.' },
      { reference: 'John 14:6 (BSB)', text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through Me."' },
    ],
    background:
      'John wrote later than the other Gospels, near the end of the first century, and his Gospel is the most theological of the four. Where Matthew, Mark, and Luke emphasize what Jesus did, John emphasizes who Jesus is — the eternal Son of God.\n\nJohn selects only a fraction of Jesus\' ministry: seven signs, seven "I am" sayings, and a series of extended conversations. The book can broadly be divided into four major sections:\n\nJohn 1 — The Prologue\nThe Word was with God, the Word was God, and the Word became flesh. John the Baptist bears witness, and the first disciples follow Jesus.\n\nJohn 2–12 — The Book of Signs\nSeven miracles and the discourses that explain them, moving from the wedding at Cana to the raising of Lazarus. Jesus\' public ministry reaches its climax and faces growing opposition.\n\nJohn 13–19 — The Book of Glory\nThe Last Supper and the farewell discourse, the promise of the Spirit, Jesus\' high-priestly prayer, the arrest, the trials, the crucifixion, and the burial.\n\nJohn 20–21 — The Resurrection\nThe empty tomb, the appearances of the risen Jesus, Thomas\' confession, and the restoration of Peter by the Sea of Galilee.\n\nJohn therefore presents the Gospel as a call to faith: the signs point to Jesus, the discourses explain Him, and the resurrection confirms Him.',
    structure: [
      { range: '1:1–18', title: 'The prologue: the Word made flesh' },
      { range: '1:19–12', title: 'The book of signs: seven miracles and the identity of Jesus' },
      { range: '13–19', title: 'The book of glory: the farewell discourse, the passion, and the cross' },
      { range: '20–21', title: 'The resurrection: appearances, belief, and the restoration of Peter' },
    ],
    lessons:
      'John teaches the deity of Christ. From the opening verse — "the Word was God" — to Thomas\' confession — "My Lord and my God" — the Gospel insists that Jesus is the eternal Son of God, one with the Father.\n\nThe book teaches the centrality of faith. John\'s whole purpose is stated in one sentence: believe that Jesus is the Christ, the Son of God, and have life in His name. Faith is not a vague optimism but confident trust in a specific Person.\n\nJohn teaches the new birth. Jesus told Nicodemus, "You must be born again" (John 3:7) — salvation is not self-improvement but a supernatural work of the Spirit that gives new life.\n\nThe book teaches the love of God. John 3:16 declares that the cross flows from the heart of the Father: God so loved the world that He gave. And Jesus commands His disciples, "Love one another as I have loved you" (John 13:34).\n\nJohn teaches life in the Spirit. Jesus promised the Helper, the Spirit of truth, who would dwell with believers, teach them all things, and bear witness to Christ.\n\nMost of all, John teaches that eternal life is not merely endless existence but a relationship: "This is eternal life, that they may know You, the only true God, and Jesus Christ, whom You have sent" (John 17:3).',
    applications: [
      'Believe that Jesus is the Christ, the Son of God.',
      'Be born again by the Spirit of God.',
      'Abide in Christ, the true vine.',
      'Walk in the light of the world.',
      'Love one another as Christ has loved you.',
      'Receive the Helper, the Holy Spirit.',
      'Find eternal life in knowing God through Christ.',
      'Worship Jesus as Lord and God.',
    ],
    mainThemes: ['The Word became flesh', 'Signs of Christ', 'Belief and unbelief', 'Light and darkness', 'Eternal life', 'The Holy Spirit as Helper'],
    keyPeople: ['Jesus', 'John the Baptist', 'Mary, Martha, and Lazarus', 'Nicodemus', 'Thomas', 'Peter', 'The woman at the well'],
    keyVerses: [
      'John 1:14 (BSB) — "The Word became flesh and made His dwelling among us."',
      'John 3:16 (BSB) — "God so loved the world that He gave His one and only Son."',
      'John 10:10 (BSB) — "I have come that they may have life, and have it in all its fullness."',
      'John 11:25 (BSB) — "I am the resurrection and the life."',
      'John 14:6 (BSB) — "I am the way and the truth and the life."',
    ],
    christConnection: 'John directly reveals Jesus as the eternal Word, the Lamb of God who takes away the sin of the world, the I AM, the bread of life, the light of the world, the good shepherd, the resurrection and the life, the way and the truth and the life, and the true vine. Every sign and every saying unveils the glory of the one and only Son, and the Gospel calls every reader to believe in Him and live.',
  },
  {
    bookName: 'Acts',
    author: 'Luke, the physician and companion of Paul',
    authorDetail:
      'The book of Acts was written by Luke, the beloved physician and companion of the apostle Paul, as the second volume of his two-part history that began with the Gospel of Luke.\n\nLuke was an eyewitness of much of what he records. In several passages the narrative shifts to the first person — "we" — showing that Luke traveled with Paul on parts of his journeys, including the voyage to Rome (Acts 16, 20, 21, 27, 28).\n\nLuke addressed both volumes to Theophilus, and Christians have traditionally understood Acts to have been written under the inspiration of God, recording the spread of the gospel from Jerusalem to Rome through the power of the Holy Spirit.',
    audience:
      'Acts was written to Theophilus and to the early Christian community, to show how the risen Christ continued His work through the church.\n\nThe book demonstrated to believers that the gospel is true, that its spread was directed by God Himself, and that the inclusion of the Gentiles was not an accident but the fulfillment of Jesus\' commission.\n\nActs also served as the church\'s founding story: it records the coming of the Spirit, the birth of the church at Pentecost, the courage of the apostles, and the pattern of witness that believers are called to continue to this day.',
    dateWritten: 'Approx. AD 62–70',
    locationWritten: 'Probably Rome',
    chapters: 28,
    purpose:
      'To record the birth and expansion of the early church from Jerusalem to Rome through the power of the Holy Spirit.\n\nActs shows the risen Christ continuing His work — through the Spirit, through the apostles, and through the church — as the gospel crosses every barrier of nation, culture, and language, according to Jesus\' promise: "You will be My witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth" (Acts 1:8).',
    keyTheme: 'The Holy Spirit, the spread of the gospel, and the birth of the church',
    summary:
      'Acts opens where the Gospel of Luke ends: the risen Jesus commissions His disciples and ascends into heaven. He promises them power for the mission that will fill the rest of the book:\n\nActs 1:8 (BSB)\n"But you will receive power when the Holy Spirit comes upon you, and you will be My witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth."\n\nTen days later, at Pentecost, the Holy Spirit came upon the disciples with wind and fire, and Peter preached the first gospel sermon. Three thousand people were baptized that day, and the church was born.\n\nThe first half of Acts centers on the apostles in Jerusalem. The community devoted themselves to the apostles\' teaching, fellowship, the breaking of bread, and prayer. The church grew despite persecution: Stephen became the first martyr, and a young Pharisee named Saul watched his death — and then set out to destroy the church.\n\nOn the road to Damascus, the risen Christ met Saul and transformed him. He became Paul, the apostle to the Gentiles, and the second half of Acts follows his three missionary journeys as the gospel spreads through Asia Minor, Greece, and the cities of the Mediterranean.\n\nThe book reaches its climax as Paul, arrested in Jerusalem and imprisoned for years, finally appeals to Caesar and is taken to Rome:\n\nActs 28:30-31 (BSB)\nPaul stayed there two full years in his own rented house, welcoming all who came to visit him. He proclaimed the kingdom of God and taught about the Lord Jesus Christ with all boldness and without hindrance.\n\nActs ends not with a conclusion but with a continuing mission: the gospel has reached the capital of the empire, and the witness of the church continues to the ends of the earth.',
    keyScripture: [
      { reference: 'Acts 1:8 (BSB)', text: '"But you will receive power when the Holy Spirit comes upon you, and you will be My witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth."' },
      { reference: 'Acts 2:38 (BSB)', text: 'Peter replied, "Repent and be baptized, every one of you, in the name of Jesus Christ for the forgiveness of your sins, and you will receive the gift of the Holy Spirit."' },
      { reference: 'Acts 16:31 (BSB)', text: 'They replied, "Believe in the Lord Jesus and you will be saved — you and your household."' },
    ],
    background:
      'Acts is the inspired history of the first thirty years of the church, roughly AD 30–62. It is the only New Testament book that records the church\'s birth and early expansion, and it provides the historical framework for the letters of Paul.\n\nThe book\'s structure follows Jesus\' commission in Acts 1:8 — Jerusalem, Judea and Samaria, and the ends of the earth:\n\nActs 1–7 — The Church in Jerusalem\nThe ascension, Pentecost, the birth of the church, the community\'s life, the arrest of the apostles, and the martyrdom of Stephen.\n\nActs 8–12 — The Church in Judea and Samaria\nPhilip in Samaria, the conversion of Saul, Peter and Cornelius — the first Gentile believers — and the church at Antioch.\n\nActs 13–20 — The Church to the Gentiles\nThe first, second, and third missionary journeys of Paul: the gospel spreads through Cyprus, Asia Minor, Macedonia, and Greece.\n\nActs 21–28 — The Journey to Rome\nPaul\'s arrest in Jerusalem, his trials before governors and kings, the shipwreck on the way to Rome, and his unhindered preaching in the imperial capital.\n\nActs therefore records the unstoppable spread of the gospel: the risen Christ, working through the Spirit and the church, takes the good news from Jerusalem to Rome — and to the ends of the earth.',
    structure: [
      { range: '1–7', title: 'The church in Jerusalem: Pentecost, the apostles, and Stephen' },
      { range: '8–12', title: 'The church spreads: Samaria, the conversion of Saul, and Cornelius' },
      { range: '13–20', title: 'The mission to the Gentiles: the journeys of Paul' },
      { range: '21–28', title: 'Paul\'s arrest, trials, and journey to Rome' },
    ],
    lessons:
      'Acts teaches that the church is the work of the risen Christ. The book is often called "the Acts of the Apostles," but its true subject is the continuing work of Jesus through the Holy Spirit — from the ascension to the ends of the earth.\n\nThe book teaches the power of the Holy Spirit. The disciples who fled at the cross were transformed at Pentecost into fearless witnesses. The Spirit empowers ordinary people for extraordinary mission.\n\nActs teaches that the gospel crosses every barrier. The Spirit fell on Jews and Gentiles alike; Philip preached to an Ethiopian official; Peter entered the house of a Roman centurion; Paul proclaimed Christ in the marketplaces of Athens. No nation, culture, or social class is outside the reach of the gospel.\n\nThe book teaches the reality of suffering in mission. Stephen was stoned, James was killed, Paul was beaten and imprisoned. Yet persecution scattered the church and spread the word: "those who had been scattered preached the word wherever they went" (Acts 8:4).\n\nActs also teaches the priority of prayer and the Word. The church devoted itself to the apostles\' teaching, fellowship, the breaking of bread, and prayer — and it grew because the word of God spread and multiplied.\n\nMost of all, Acts teaches that the mission continues. The book ends with Paul preaching in Rome, but the story is unfinished: the gospel is still spreading, and every believer is called to be a witness to the ends of the earth.',
    applications: [
      'Receive the power of the Holy Spirit for witness.',
      'Be a witness in your Jerusalem — your home, your city, your world.',
      'Devote yourself to teaching, fellowship, the breaking of bread, and prayer.',
      'Cross every barrier of race, culture, and class with the gospel.',
      'Expect and embrace suffering in mission.',
      'Pray boldly and preach the word faithfully.',
      'Welcome the outcasts, as the church welcomed the Gentiles.',
      'Remember that the mission is not finished — it continues through you.',
    ],
    mainThemes: ['The power of the Holy Spirit', 'Witness and mission', 'The church as a new community', 'Suffering and persecution', 'The inclusion of the Gentiles', 'God\'s sovereign plan of salvation'],
    keyPeople: ['Peter', 'Stephen', 'Philip', 'Paul (Saul)', 'Barnabas', 'James the brother of Jesus', 'Cornelius'],
    keyVerses: [
      'Acts 1:8 (BSB) — "You will be My witnesses... to the ends of the earth."',
      'Acts 2:42 (BSB) — "They devoted themselves to the apostles\' teaching and to the fellowship, to the breaking of bread and to prayer."',
      'Acts 4:12 (BSB) — "Salvation is found in no one else, for there is no other name under heaven given to mankind by which we must be saved."',
      'Acts 9:15 (BSB) — Paul: "This man is My chosen instrument to carry My name before the Gentiles and their kings."',
      'Acts 16:31 (BSB) — "Believe in the Lord Jesus and you will be saved — you and your household."',
    ],
    christConnection: 'Acts shows the risen Christ continuing His work through the Holy Spirit and the church. Jesus is exalted as Lord and Christ at Pentecost, Stephen sees Him standing at the right hand of God, and Saul meets Him on the road to Damascus. Paul\'s conversion demonstrates the power of the resurrected Christ to transform even the fiercest enemy of the church, and the whole book shows that the ascended Jesus is still building His church and extending His kingdom to the ends of the earth.',
  },
  {
    bookName: 'Romans',
    author: 'The Apostle Paul',
    authorDetail:
      'The letter to the Romans was written by the apostle Paul, the former Pharisee who persecuted the church until the risen Christ met him on the road to Damascus. Paul was the apostle to the Gentiles, and no other writer shaped the theology of the early church as deeply as he did.\n\nPaul wrote Romans from Corinth during his third missionary journey, as he prepared to carry the collection for the poor saints in Jerusalem and then to travel to Rome and on to Spain (Romans 15:24-28). He had not yet visited the church in Rome, so the letter served as his introduction and his most complete statement of the gospel.\n\nRomans was dictated to Tertius, who identifies himself in the closing greetings (Romans 16:22), and Christians have traditionally understood it to have been written under the inspiration of God.',
    audience:
      'Romans was written to the church in Rome, a community of both Jewish and Gentile believers gathered in the capital of the empire.\n\nPaul wrote to a church he had never visited, made up of believers from very different backgrounds — Jews who had grown up under the Law and Gentiles who had come out of pagan idolatry. The letter addresses the tensions between them and shows that Jews and Gentiles alike are saved the same way: by grace through faith in Christ.\n\nBecause Romans presents the gospel in its most complete form, it speaks to every generation of believers and has been used by God in the conversion and renewal of countless readers.',
    dateWritten: 'Approx. AD 57',
    locationWritten: 'Corinth (during Paul\'s third missionary journey)',
    chapters: 16,
    purpose:
      'To present the most systematic explanation of the gospel — the righteousness of God revealed through faith in Jesus Christ for all who believe.\n\nRomans explains how sinners are justified before God, how believers live in union with Christ through the Spirit, how God\'s promises to Israel are fulfilled, and how the gospel transforms daily life — so that the church in Rome (and every church) stands firm on the grace of God.',
    keyTheme: 'Justification by faith, salvation, sanctification, and the righteousness of God',
    summary:
      'Romans is Paul\'s greatest letter, the most complete explanation of the gospel in Scripture. Paul declares his theme in the opening chapter:\n\nRomans 1:16-17 (BSB)\nFor I am not ashamed of the gospel, because it is the power of God for salvation to everyone who believes, first to the Jew, then to the Greek. For the gospel reveals the righteousness of God that comes by faith from start to finish, just as it is written: "The righteous will live by faith."\n\nPaul begins by showing that all people — Gentiles and Jews alike — are under sin and deserve the judgment of God. No one is righteous on their own. Then he announces the heart of the gospel: justification by grace through faith.\n\nRomans 5:8 (BSB)\nBut God proves His love for us in this: While we were still sinners, Christ died for us.\n\nIn the central chapters, Paul describes the believer\'s new life: united with Christ, no longer slaves to sin but slaves to righteousness, and living by the Spirit. He wrestles with the problem of indwelling sin and concludes with a cry of hope:\n\nRomans 8:1 (BSB)\nTherefore, there is now no condemnation for those who are in Christ Jesus.\n\nPaul then takes up God\'s purposes for Israel, showing that God has not rejected His people and that their unbelief opened the way for the Gentiles — and will one day be reversed. He closes with the transformed life: "Offer your bodies as a living sacrifice" (Romans 12:1), and he ends with a doxology of praise to "the only wise God" through Jesus Christ (Romans 16:27).\n\nRomans therefore weaves together doctrine and duty: what God has done in Christ, and how that grace reshapes every area of life.',
    keyScripture: [
      { reference: 'Romans 1:16-17 (BSB)', text: 'For I am not ashamed of the gospel, because it is the power of God for salvation to everyone who believes, first to the Jew, then to the Greek. For the gospel reveals the righteousness of God that comes by faith from start to finish.' },
      { reference: 'Romans 3:23-24 (BSB)', text: 'For all have sinned and fall short of the glory of God, and are justified freely by His grace through the redemption that is in Christ Jesus.' },
      { reference: 'Romans 5:8 (BSB)', text: 'But God proves His love for us in this: While we were still sinners, Christ died for us.' },
    ],
    background:
      'Paul wrote Romans at the height of his ministry, around AD 57, after completing his work in the eastern Mediterranean. He planned to visit Rome on his way to Spain, and the letter served as his introduction to a church he had long wanted to see.\n\nThe church in Rome was a mixture of Jews and Gentiles, and Paul addresses both: he speaks of the Jews who had the Law and the Gentiles who did not, and he insists that both are saved by the same grace through the same faith.\n\nThe book can broadly be divided into four major sections:\n\nRomans 1–3:20 — The Need for the Gospel\nAll people, Jew and Gentile, are under sin and stand guilty before God. The whole world is accountable to Him.\n\nRomans 3:21–8 — The Provision of the Gospel\nJustification by grace through faith, the example of Abraham, peace with God in Christ, the new life of union with Christ, and freedom from condemnation through the Spirit.\n\nRomans 9–11 — The Purposes of God for Israel\nGod\'s sovereign election, Israel\'s present unbelief, and the promise of future restoration.\n\nRomans 12–16 — The Life of the Gospel\nThe transformed life: living sacrifice, spiritual gifts, love for one another, submission to authorities, and practical instructions, closing with greetings and a doxology.\n\nRomans is therefore the most systematic statement of the gospel in the New Testament — the letter that has shaped Christian theology more than any other.',
    structure: [
      { range: '1–3:20', title: 'The need for the gospel: all have sinned' },
      { range: '3:21–5', title: 'Justification by faith: the righteousness of God revealed' },
      { range: '6–8', title: 'Sanctification: union with Christ and life in the Spirit' },
      { range: '9–11', title: 'God\'s purposes for Israel and the Gentiles' },
      { range: '12–16', title: 'The transformed life: living sacrifice, love, and doxology' },
    ],
    lessons:
      'Romans teaches the universal need of salvation. Paul opens the letter with a devastating diagnosis: all have sinned and fall short of the glory of God. No one is saved by moral effort, religious heritage, or the Law — Jew and Gentile stand equally in need of grace.\n\nThe book teaches justification by faith alone. A person is declared righteous before God not by works but through faith in Christ, who paid the penalty for sin. This is the article by which the church stands or falls.\n\nRomans teaches the love of God displayed in the cross. "While we were still sinners, Christ died for us" — the cross is not a response to our worthiness but the demonstration of God\'s love for the unworthy.\n\nThe book teaches the new life of the believer. United with Christ in His death and resurrection, believers are no longer slaves to sin; they walk by the Spirit, and "there is now no condemnation for those who are in Christ Jesus" (Romans 8:1).\n\nRomans teaches the sovereignty of God in salvation. Chapters 9–11 show that salvation is from first to last the work of God, who is free to have mercy on whom He will — and whose purposes for Israel and the nations will not fail.\n\nMost of all, Romans teaches that grace transforms life. The mercies of God are the foundation for the ethics of chapters 12–16: because of what God has done, believers offer their bodies as living sacrifices, love one another, and live for the glory of God.\n\nRomans is therefore the gospel in its most complete form: the need, the provision, the life, and the praise.',
    applications: [
      'Receive the righteousness of God by faith alone.',
      'Rest in the love of God shown at the cross.',
      'Walk by the Spirit, not by the flesh.',
      'Live with no condemnation in Christ Jesus.',
      'Offer your body as a living sacrifice.',
      'Love one another and pursue peace.',
      'Trust God\'s sovereign purposes for His people.',
      'Live for the glory of the only wise God.',
    ],
    mainThemes: ['The righteousness of God', 'Justification by faith', 'Union with Christ', 'Life in the Spirit', 'God\'s sovereignty in salvation', 'Practical Christian living'],
    keyPeople: ['Paul', 'Tertius (the scribe)', 'Phoebe (the letter\'s carrier)', 'Priscilla and Aquila', 'Andronicus and Junia', 'The believers in Rome'],
    keyVerses: [
      'Romans 1:16-17 (BSB) — "The righteous will live by faith."',
      'Romans 3:23-24 (BSB) — "All have sinned... and are justified freely by His grace."',
      'Romans 5:8 (BSB) — "While we were still sinners, Christ died for us."',
      'Romans 8:1 (BSB) — "No condemnation for those who are in Christ Jesus."',
      'Romans 12:1 (BSB) — "Offer your bodies as a living sacrifice."',
    ],
    christConnection: 'Romans presents Christ as the second Adam who brings righteousness where the first Adam brought death; the propitiation for our sins whose blood satisfies the justice of God; the one who died and was raised for our justification; the Lord who is accessible to all who call upon His name; and the Savior whose love nothing can separate us from. No book more clearly explains why Christ\'s work is necessary and sufficient for salvation.',
  },
  {
    bookName: 'Revelation',
    author: 'The apostle John',
    authorDetail:
      'The book of Revelation was written by the apostle John, the beloved disciple and author of the fourth Gospel and the letters of John. He identifies himself simply as "John" (Revelation 1:1, 4, 9) and describes himself as "your brother and partner in the tribulation, kingdom, and perseverance" in Jesus.\n\nJohn received the visions of Revelation while exiled on the island of Patmos, "because of the word of God and the testimony of Jesus" (Revelation 1:9). Early tradition records that John was banished to Patmos under the emperor Domitian and later returned to Ephesus.\n\nChristians have traditionally understood Revelation to have been written under the inspiration of God, and the book itself claims to be "the revelation of Jesus Christ, which God gave Him to show His servants what must soon take place" (Revelation 1:1).',
    audience:
      'Revelation was written to the seven churches of Asia Minor — Ephesus, Smyrna, Pergamum, Thyatira, Sardis, Philadelphia, and Laodicea — and through them to the whole church in every age.\n\nThe churches faced pressure to compromise, false teaching, and persecution. Revelation was given to encourage believers to persevere in faithfulness, to warn against idolatry and compromise, and to reveal the final victory of the Lamb.\n\nBecause the book unveils the end of the age, it speaks to every generation of believers who await the return of Christ and the new creation.',
    dateWritten: 'Approx. AD 90–95',
    locationWritten: 'The island of Patmos',
    chapters: 22,
    purpose:
      'To reveal Jesus Christ in His exalted glory, to encourage believers facing persecution, to warn of coming judgment, and to show the ultimate triumph of God\'s kingdom.\n\nRevelation unmasks the spiritual conflict behind earthly events, calls the church to faithful endurance, and unveils the certain outcome of history: the Lamb who was slain reigns, evil is judged, and God makes all things new.',
    keyTheme: 'The revelation of Jesus Christ, judgment, and the new creation',
    summary:
      'Revelation is the unveiling of Jesus Christ in His glory and the triumph of His kingdom. John, exiled on Patmos, saw the risen Lord in dazzling majesty and received letters for seven churches. The letters call each church to faithfulness and warn against compromise.\n\nThen John was caught up into heaven and shown the throne room of God, where the Lamb who was slain — the crucified and risen Jesus — alone is worthy to open the scroll of history. What follows is a series of dramatic visions of judgment and salvation: seven seals, seven trumpets, seven bowls, the dragon and the beasts, the fall of Babylon, and the final defeat of evil.\n\nAmid the judgments, the book reveals the Lamb\'s victory:\n\nRevelation 21:4 (BSB)\n"He will wipe away every tear from their eyes, and there will be no more death or mourning or crying or pain, for the former things have passed away."\n\nThe book ends with the new heaven and the new earth, the New Jerusalem descending from heaven, and the invitation of the Spirit and the bride:\n\nRevelation 22:20 (BSB)\nHe who testifies to these things says, "Yes, I am coming soon." Amen. Come, Lord Jesus!\n\nRevelation therefore assures the church of the one certainty of history: Jesus Christ is Lord, evil will be judged, and God will dwell with His people forever.',
    keyScripture: [
      { reference: 'Revelation 1:8 (BSB)', text: '"I am the Alpha and the Omega," says the Lord God, "who is and who was and who is to come — the Almighty."' },
      { reference: 'Revelation 21:4 (BSB)', text: '"He will wipe away every tear from their eyes, and there will be no more death or mourning or crying or pain, for the former things have passed away."' },
      { reference: 'Revelation 22:20 (BSB)', text: 'He who testifies to these things says, "Yes, I am coming soon." Amen. Come, Lord Jesus!' },
    ],
    background:
      'Revelation was written near the end of the first century, when the churches of Asia Minor faced growing pressure to worship the emperor and conform to the pagan culture around them. John received the visions while banished to Patmos, a small island in the Aegean used as a place of exile.\n\nThe book uses the language of apocalyptic literature — visions, symbols, and numbers — which was familiar to its first readers. Its message is clear: behind the earthly conflict between the church and the world stands the spiritual conflict between the Lamb and the dragon, and the Lamb has already won.\n\nThe book can broadly be divided into four major sections:\n\nRevelation 1–3 — The Risen Christ and the Seven Churches\nJohn\'s vision of the glorified Christ and the letters to the seven churches of Asia Minor.\n\nRevelation 4–11 — The Throne and the Scroll\nThe throne room of heaven, the Lamb who opens the scroll, the seven seals, and the seven trumpets.\n\nRevelation 12–16 — The Conflict and the Bowls\nThe woman, the dragon, and the beast; the Lamb and His followers; and the seven bowls of God\'s wrath.\n\nRevelation 17–22 — The Triumph of the Lamb\nThe fall of Babylon, the return of Christ, the defeat of Satan, the final judgment, the new heaven and the new earth, and the New Jerusalem.\n\nRevelation is therefore the book of victory: no matter how dark the present age, the Lamb reigns and His kingdom is coming.',
    structure: [
      { range: '1–3', title: 'The risen Christ and the letters to the seven churches' },
      { range: '4–11', title: 'The throne of heaven: the scroll, the seals, and the trumpets' },
      { range: '12–16', title: 'The conflict: the dragon, the beasts, and the bowls of wrath' },
      { range: '17–20', title: 'The triumph: the fall of Babylon, the return of Christ, and the final judgment' },
      { range: '21–22', title: 'The new creation: the New Jerusalem and the coming of the Lord' },
    ],
    lessons:
      'Revelation teaches the glory of Christ. The book opens with a vision of the risen Lord — eyes like blazing fire, voice like many waters, the First and the Last. Jesus is not a distant figure of the past but the reigning Lord of the church and of history.\n\nThe book teaches the centrality of worship. The throne room scenes of Revelation are filled with worship — the four living creatures, the twenty-four elders, the angels, and every creature in heaven and on earth praising the Lamb. The book calls the church to worship God alone and to refuse every idol.\n\nRevelation teaches the reality of spiritual conflict. Behind the visible struggles of the church stands the dragon, the ancient serpent, who deceives the nations. Believers are called to be watchful, to overcome by the blood of the Lamb and the word of their testimony.\n\nThe book teaches the certainty of judgment. The visions of seals, trumpets, and bowls reveal that evil will not go unpunished. Babylon falls; the beast and the false prophet are thrown into the lake of fire; death and Hades give up their dead for judgment.\n\nRevelation equally teaches the victory of the Lamb. The Lamb who was slain is the Lion of Judah who reigns. His people overcome not by their own strength but by His blood. History moves not toward chaos but toward the wedding supper of the Lamb.\n\nMost of all, Revelation teaches the hope of the new creation. God will wipe away every tear; there will be no more death, mourning, crying, or pain; and the dwelling of God will be with His people forever. The book ends with the church\'s great cry: "Come, Lord Jesus!"\n\nFor believers facing suffering and pressure, Revelation is a call to persevere — because the one who is coming is faithful and true.',
    applications: [
      'Worship the Lamb who was slain and reigns.',
      'Hear what the Spirit says to the churches.',
      'Persevere in faithfulness under pressure.',
      'Refuse every idol and every compromise.',
      'Overcome by the blood of the Lamb and the word of your testimony.',
      'Live in the hope of the new creation.',
      'Keep watch; the Lord is coming soon.',
      'Cry with the Spirit and the bride: "Come, Lord Jesus!"',
    ],
    mainThemes: ['The glory of Christ', 'Worship in heaven', 'Judgment on evil', 'The final victory of God', 'Perseverance of the saints', 'The new creation'],
    keyPeople: ['Jesus Christ the risen Lord', 'John the apostle', 'The seven churches of Asia Minor', 'The twenty-four elders', 'The four living creatures', 'Michael the archangel'],
    keyVerses: [
      'Revelation 1:8 (BSB) — "I am the Alpha and the Omega... the Almighty."',
      'Revelation 3:20 (BSB) — "Behold, I stand at the door and knock."',
      'Revelation 5:12 (BSB) — "Worthy is the Lamb who was slain."',
      'Revelation 21:4 (BSB) — "He will wipe away every tear from their eyes."',
      'Revelation 22:20 (BSB) — "Yes, I am coming soon. Amen. Come, Lord Jesus!"',
    ],
    christConnection: 'Revelation unveils Jesus Christ in His full glory: the Alpha and Omega, the First and the Last, the Lion of Judah, the Lamb who was slain and who alone is worthy to open the scroll, the King of kings and Lord of lords, the Faithful and True, and the Bridegroom who returns for His bride. Every title and every vision exalts Christ as the center of history and the goal of creation.',
  },
];

// Canonical Bible order — used to sort listings so Genesis comes first.
const CANONICAL_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];
const canonicalIndex = new Map(CANONICAL_ORDER.map((name, index) => [name, index]));

for (const item of prologues) {
  await prisma.bookPrologue.upsert({
    where: { bookName: item.bookName },
    update: { ...item, sortOrder: canonicalIndex.get(item.bookName) ?? 9999 },
    create: { ...item, sortOrder: canonicalIndex.get(item.bookName) ?? 9999 },
  });
}

console.log(`Seeded ${prologues.length} book prologues`);
await prisma.$disconnect();
