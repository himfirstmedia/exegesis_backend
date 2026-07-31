import { prisma } from "../../config/db.js";
import { cache } from "../../services/cacheService.js";

const memCache = new Map();
const CACHE_TTL = 12 * 60 * 60;

const BOOK_ALIASES = {
  "1 samuel": "1 Samuel", "2 samuel": "2 Samuel",
  "1 kings": "1 Kings", "2 kings": "2 Kings",
  "1 chronicles": "1 Chronicles", "2 chronicles": "2 Chronicles",
  "1 corinthians": "1 Corinthians", "2 corinthians": "2 Corinthians",
  "1 peter": "1 Peter", "2 peter": "2 Peter",
  "1 john": "1 John", "2 john": "2 John", "3 john": "3 John",
  "1 thessalonians": "1 Thessalonians", "2 thessalonians": "2 Thessalonians",
  "1 timothy": "1 Timothy", "2 timothy": "2 Timothy",
  "1 cor": "1 Corinthians", "2 cor": "2 Corinthians",
  "1 thes": "1 Thessalonians", "2 thes": "2 Thessalonians",
  "1 tim": "1 Timothy", "2 tim": "2 Timothy",
  "song of solomon": "Song of Solomon",
  "song of songs": "Song of Solomon",
  "psalm": "Psalms", "psalms": "Psalms",
  "ecclesiastes": "Ecclesiastes",
  "revelation": "Revelation",
  "genesis": "Genesis", "exodus": "Exodus",
  "numbers": "Numbers", "deuteronomy": "Deuteronomy",
  "isaiah": "Isaiah", "jeremiah": "Jeremiah",
  "heb": "Hebrews", "eph": "Ephesians", "phil": "Philippians",
  "col": "Colossians", "gal": "Galatians",
};

function normalizeBook(book) {
  return BOOK_ALIASES[book.toLowerCase().trim()] || book;
}

const BOOK_GENRES = {
  "Genesis": "law", "Exodus": "law", "Leviticus": "law", "Numbers": "law", "Deuteronomy": "law",
  "Joshua": "history", "Judges": "history", "Ruth": "history",
  "1 Samuel": "history", "2 Samuel": "history", "1 Kings": "history", "2 Kings": "history",
  "1 Chronicles": "history", "2 Chronicles": "history", "Ezra": "history", "Nehemiah": "history", "Esther": "history",
  "Job": "poetry", "Psalms": "poetry", "Proverbs": "poetry", "Ecclesiastes": "poetry", "Song of Solomon": "poetry",
  "Isaiah": "prophecy", "Jeremiah": "prophecy", "Lamentations": "prophecy", "Ezekiel": "prophecy", "Daniel": "prophecy",
  "Hosea": "prophecy", "Joel": "prophecy", "Amos": "prophecy", "Obadiah": "prophecy", "Jonah": "prophecy",
  "Micah": "prophecy", "Nahum": "prophecy", "Habakkuk": "prophecy", "Zephaniah": "prophecy", "Haggai": "prophecy",
  "Zechariah": "prophecy", "Malachi": "prophecy",
  "Matthew": "gospel", "Mark": "gospel", "Luke": "gospel", "John": "gospel",
  "Acts": "history",
  "Romans": "epistle", "1 Corinthians": "epistle", "2 Corinthians": "epistle", "Galatians": "epistle",
  "Ephesians": "epistle", "Philippians": "epistle", "Colossians": "epistle",
  "1 Thessalonians": "epistle", "2 Thessalonians": "epistle",
  "1 Timothy": "epistle", "2 Timothy": "epistle", "Titus": "epistle", "Philemon": "epistle",
  "Hebrews": "epistle", "James": "epistle", "1 Peter": "epistle", "2 Peter": "epistle",
  "1 John": "epistle", "2 John": "epistle", "3 John": "epistle", "Jude": "epistle",
  "Revelation": "apocalyptic",
};

function detectGenre(bookName) {
  return BOOK_GENRES[bookName] || "epistle";
}

const THEME_CHECKS = {
  love:     /\b(love|loved|loving|charity)\b/gi,
  faith:    /\b(faith|believe|believed|believing|trust)\b/gi,
  life:     /\b(life|live|living|save|salvation|eternal|savior)\b/gi,
  light:    /\b(light|darkness|dark|shine|radiance)\b/gi,
  judgment: /\b(sin|sinner|judgment|condemn|condemned|wrath|judge)\b/gi,
  hope:     /\b(hope|hoped|promise|promised|covenant|blessed|blessing)\b/gi,
  grace:    /\b(grace|gracious|mercy|merciful|forgive|forgiveness|redemption|redeem)\b/gi,
  power:    /\b(power|mighty|authority|strength|kingdom)\b/gi,
  peace:    /\b(peace|peaceful|rest|comfort|comforted)\b/gi,
  fear:     /\b(fear|afraid|anxious|worry)\b/gi,
  obedience: /\b(obey|obedience|command|commandment|keep|law|statute)\b/gi,
  warning:  /\b(warn|warning|woe|beware|repent|repentance)\b/gi,
  praise:   /\b(rejoice|praise|thank|thanksgiving|sing|song|glory|glorify)\b/gi,
  suffering: /\b(suffer|suffering|pain|trouble|tribulation|affliction|persecute)\b/gi,
  healing:  /\b(heal|healed|healing|health|whole|restore|restored)\b/gi,
  death:    /\b(death|die|dead|grave|perish|destroy|destruction)\b/gi,
  kingship: /\b(king|kingdom|reign|throne|ruler|lord)\b/gi,
  wisdom:   /\b(wisdom|wise|understanding|knowledge|truth|instruct|teach|teacher)\b/gi,
};

function detectThemes(text) {
  const scores = {};
  for (const [theme, regex] of Object.entries(THEME_CHECKS)) {
    const matches = text.match(regex);
    if (matches) scores[theme] = matches.length;
  }
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);
}

function extractPhrases(text) {
  if (!text) return { opener: "", keyClause: "", verseEnd: "" };
  const words = text.split(/\s+/).filter(Boolean);
  const opener = words.slice(0, Math.min(4, words.length)).join(" ");
  let keyClause = "";
  const markers = ["so that", "for God", "for the", "because", "but whoever", "and this", "that whoever", "that whosoever", "in order that"];
  for (const m of markers) {
    const idx = text.toLowerCase().indexOf(m);
    if (idx > 3 && idx < text.length * 0.85) {
      keyClause = text.slice(idx, idx + 100).split(/[.!?;,]/)[0].trim();
      break;
    }
  }
  const verseEnd = words.slice(-3).join(" ");
  return { opener, keyClause, verseEnd, wordCount: words.length };
}

function idx(ref) {
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = ((h << 5) - h) + ref.charCodeAt(i);
  return Math.abs(h);
}

const GENRE_INTROS = {
  poetry:    "invites us into a moment of sacred song, where the heart of the poet meets the heart of God.",
  gospel:    "presents us with the very words and works of Jesus — the Word made flesh who dwells among us.",
  epistle:   "brings us apostolic teaching, written to guide the early church and to instruct us in the faith.",
  prophecy:  "carries the weight of divine proclamation — a message from God through His chosen messenger.",
  law:       "grounds us in the foundations of God's covenant with His people — His commands, His promises, His call.",
  history:   "records the unfolding story of God's faithfulness through the triumphs and failures of His people.",
  apocalyptic: "opens a window into the unseen realm, revealing the sovereign purposes of God in symbols and visions.",
};

function buildIntro(ref, text, prologue, phrases, genre, contextVerses, verseNum) {
  const i = idx(ref);
  const variant = i % 4;
  const opener = phrases.opener;

  const contextNote = contextVerses?.filter(v => v.verse !== verseNum)
    .slice(0, 2).map(v => v.verseText.split(" ").slice(0, 5).join(" ") + "...").join("; ") || "";

  if (variant === 0) {
    if (prologue) {
      const base = `${ref} opens with a profound declaration: "${text}" ${prologue.author ? `${prologue.author}, ` : ""}writing ${prologue.dateWritten ? `around ${prologue.dateWritten}` : ""}${prologue.audience ? ` to ${prologue.audience}` : ""}, sets before us a truth that has shaped the faith of believers for generations.`;
      return contextNote ? `${base} The surrounding passage reminds us that "${contextNote}"` : base;
    }
    const base = `"${opener}..." With these words, ${ref} ${GENRE_INTROS[genre] || "invites us into a truth that has resonated with believers across every generation."}`;
    return contextNote ? `${base} The surrounding verses set the scene: "${contextNote}"` : base;
  }
  if (variant === 1) {
    if (prologue) {
      const base = `The message of ${ref} emerges from ${prologue.bookName}, a book that emphasizes ${prologue.keyTheme ? prologue.keyTheme.toLowerCase() : "the character and purposes of God"}. ${prologue.purpose ? prologue.purpose.charAt(0).toUpperCase() + prologue.purpose.slice(1) + "." : ""} Here the Scripture declares: "${text}"`;
      return contextNote ? `${base} This comes in the context of: "${contextNote}"` : base;
    }
    const base = `${ref} speaks directly to the human heart: "${text}" These words carry weight far beyond their simple expression.`;
    return contextNote ? `${base} The surrounding verses remind us: "${contextNote}"` : base;
  }
  if (variant === 2) {
    if (prologue) {
      const base = `${ref} comes from a pivotal moment in redemptive history. ${prologue.summary ? prologue.summary.split(".")[0] + "." : ""} ${prologue.author ? `${prologue.author}, ` : ""}writing ${prologue.dateWritten ? `around ${prologue.dateWritten}` : ""}, brings us these words: "${text}"`;
      return contextNote ? `${base} The immediate context shows: "${contextNote}"` : base;
    }
    return `There are verses that stop us in our tracks, and ${ref} is one of them. "${text}" It demands our attention and invites our response.`;
  }
  if (prologue) {
    const base = `In ${ref}, we encounter one of the most significant statements of Scripture. "${text}" As part of ${prologue.bookName}${prologue.dateWritten ? `, written around ${prologue.dateWritten}` : ""}${prologue.author ? ` by ${prologue.author}` : ""}, this verse carries the full weight of divine revelation.`;
    return contextNote ? `${base} The context around it says: "${contextNote}"` : base;
  }
  const base = `${ref} presents a truth that has anchored believers throughout the ages. "${text}" These are words to live by.`;
  return contextNote ? `${base} The verses around it echo this: "${contextNote}"` : base;
}

function buildLesson(ref, text, prologue, phrases, themes, genre) {
  const i = idx(ref);
  const variant = i % 3;
  const christConn = prologue?.christConnection || "";
  const theme1 = themes[0] || "";
  const theme2 = themes[1] || "";
  const keyClause = phrases.keyClause;

  const genreTag = {
    poetry: "This is the language of the soul, set to the music of faith.",
    epistle: "This is the voice of apostolic authority, speaking truth to the church.",
    gospel: "This is the testimony of eyewitnesses, recording the words and works of Jesus.",
    prophecy: "This is the word of the Lord — urgent, necessary, and alive.",
    law: "This is the foundation of covenant, revealing both God's holiness and His grace.",
    history: "This is the testimony of God's faithfulness, written for our instruction.",
    apocalyptic: "This is the unveiling of heaven's perspective on earth's reality.",
  }[genre] || "";

  const themeLessons = {
    love: `At the heart of this verse is love — not the fragile, conditional love the world offers, but the steadfast, self-giving love that defines God Himself. ${keyClause ? `The phrase "${keyClause.toLowerCase()}" reveals the very heart of the gospel: God did not wait for us to earn His love; He took the initiative, giving His best while we were still undeserving.` : ""} This transforms how we understand everything — our purpose, our relationships, and our eternal destiny. ${christConn}`,
    grace: `Here we encounter grace — not as a doctrine to be studied, but as a reality to be received. Grace means God's goodness is not a reward for the righteous but a gift to the undeserving. ${keyClause ? `The words "${keyClause.toLowerCase()}" capture this stunning truth.` : ""} This is the scandal of the gospel: we don't climb up to God; He comes down to us. And this grace doesn't make us careless — it makes us grateful. And gratitude changes everything. ${christConn}`,
    faith: `Faith — the confident trust in God and His Word — runs through this passage like a golden thread. ${keyClause ? `"${keyClause.toLowerCase()}" — this is the language of trust, the response that opens the door to all God has for us.` : ""} It calls us to move from what we can see to what we know is true, from the shifting sands of our feelings to the solid rock of God's character. ${christConn}`,
    life: `Life — not mere existence, but the abundant, eternal life that flows from God Himself. ${keyClause ? `"${keyClause.toLowerCase()}" — these words pulse with the promise of a life that transcends our circumstances.` : ""} This is the heartbeat of the gospel: death defeated, life unleashed, hope secured. The life God offers begins now, not after death, and it changes everything about how we live today. ${christConn}`,
    hope: `Hope rises from this verse like dawn after a long night. ${keyClause ? `"${keyClause.toLowerCase()}" — this is not wishful thinking; it is the confident expectation that God will do what He has promised.` : ""} Hope anchors us in the certainty of God's character, giving us strength to endure and courage to press on. It is the lifeline for the weary soul. ${christConn}`,
    peace: `Peace flows through this verse — not the absence of trouble, but the deep, settled confidence that comes from knowing who God is. ${keyClause ? `"${keyClause.toLowerCase()}" — this is where peace finds its grounding.` : ""} It speaks to the restless heart, offering rest for the weary soul and stillness for the anxious mind. ${christConn}`,
    judgment: `This verse confronts us with the weight of our choices and the holiness of God. ${keyClause ? `"${keyClause.toLowerCase()}" — these words remind us that our actions have eternal significance.` : ""} Yet even in the sobering reality of judgment, the thread of grace runs through: God's warnings are not meant to frighten us but to protect us. He warns because He loves. ${christConn}`,
    fear: `This verse speaks directly into our fears. ${keyClause ? `"${keyClause.toLowerCase()}" — here is the antidote to the anxiety that so often grips our hearts.` : ""} Fear loses its power when we know who holds the future. The presence of God doesn't mean the absence of danger, but it does mean the presence of peace in the midst of it. ${christConn}`,
    suffering: `Suffering is not meaningless, and this verse helps us see why. ${keyClause ? `"${keyClause.toLowerCase()}" — in these words we find a framework for understanding our pain.` : ""} It reframes our trials in light of God's greater purposes, reminding us that He walks with us through the fire and that our afflictions are producing something eternal — a weight of glory beyond all comparison. ${christConn}`,
    praise: `This verse erupts with praise, calling us to lift our eyes from our circumstances to the God who is worthy. ${keyClause ? `"${keyClause.toLowerCase()}" — this is the language of worship, the response of a heart overwhelmed by God's goodness.` : ""} Worship is not just something we do; it is who we were made to be — a response to the greatness of our God. ${christConn}`,
    power: `Power — not the brute force of the world, but the quiet, unshakeable power of God — is on display here. ${keyClause ? `"${keyClause.toLowerCase()}" — this is the power that created galaxies, that raised Christ from the dead, and that now works in us.` : ""} We were never meant to live in our own strength. This verse invites us to draw on a power greater than ourselves. ${christConn}`,
    wisdom: `Wisdom calls out from this verse, inviting us to see the world as God sees it. ${keyClause ? `"${keyClause.toLowerCase()}" — this is the voice of true understanding.` : ""} It challenges our assumptions and offers a better way — the way of truth, understanding, and the fear of the Lord, which is the beginning of all wisdom. ${christConn}`,
    kingship: `This verse declares the sovereignty of God — not a distant, indifferent ruler, but a King who is intimately involved in His creation. ${keyClause ? `"${keyClause.toLowerCase()}" — this is the language of His reign.` : ""} His kingdom brings order, justice, and peace, and we are invited to live under His gracious authority. ${christConn}`,
    healing: `Healing flows through this verse like a river of life. ${keyClause ? `"${keyClause.toLowerCase()}" — these words carry the promise of restoration.` : ""} God is not distant from our pain; He is the one who mends what is broken, restores what is lost, and makes whole what has been shattered. ${christConn}`,
    death: `This verse speaks directly to the reality that none of us can escape — death. ${keyClause ? `"${keyClause.toLowerCase()}" — here we find the only real answer to the grave's finality.` : ""} But the gospel does not leave us in the tomb. It announces that death has been defeated, that the grave could not hold Him, and that because He lives, we too shall live. ${christConn}`,
    obedience: `This verse highlights the unbreakable connection between what we believe and how we live. ${keyClause ? `"${keyClause.toLowerCase()}" — this is the call to a faith that works through love.` : ""} Obedience is not legalism; it is love in action. When we truly understand God's heart, His commands cease to be burdens and become the path to freedom. ${christConn}`,
    warning: `This verse comes as a wake-up call, urging us to take our spiritual lives seriously. ${keyClause ? `"${keyClause.toLowerCase()}" — these words are a gift, meant to protect us from harm.` : ""} Warnings are not meant to frighten us; they are the voice of love crying out, "There is danger ahead — turn back." ${christConn}`,
    light: `Light and darkness — this verse sets them before us as the two paths that lie before every human soul. ${keyClause ? `"${keyClause.toLowerCase()}" — this is the call to walk in the light.` : ""} Light exposes what is hidden and guides the steps of those who follow it. And the Light of the World has come. ${christConn}`,
  };

  const defaultLesson = `This verse reveals something essential about who God is and who we are in relation to Him. ${keyClause ? `The phrase "${keyClause.toLowerCase()}" captures the heart of the matter.` : ""} It invites us to see beyond the surface of our circumstances and encounter the living God who speaks through His Word. ${genreTag ? `\n\n${genreTag}` : ""} ${christConn}`;

  const primary = themeLessons[theme1] || defaultLesson;
  const primaryWithGenre = genreTag && !primary.includes(genreTag)
    ? `${primary}\n\n${genreTag}`
    : primary;
  const secondary = theme2 && themeLessons[theme2]
    ? `\n\n${themeLessons[theme2].split(". ").slice(1, 3).join(". ")}`
    : "";

  return primaryWithGenre + secondary;
}

function buildApplication(text, phrases, themes) {
  const i = idx(text || "");
  const variant = i % 3;
  const theme1 = themes[0] || "";
  const keyClause = phrases.keyClause;
  const opener = phrases.opener;

  const apps = {
    love: [
      `God's love is not meant to be merely admired — it is meant to be channeled. Who in your life needs to experience God's love through you today? Perhaps a patient word, a generous gesture, or the gift of your undivided attention. ${keyClause ? `"${keyClause}" — this is the kind of love you are called to extend.` : ""} Let this verse move from your head to your hands.`,
      `The measure of our love for God is the love we show to others. Before this day ends, find one concrete way to demonstrate love to someone who is difficult to love. That is the gospel in action. ${keyClause ? `The love described here — "${keyClause}" — is now the love you are called to live.` : ""}`,
      `Love is not a feeling to wait for; it is a choice to make. Think of one person you encounter regularly who tries your patience. Now pray for them — and look for an opportunity this week to serve them.`,
    ],
    faith: [
      `Faith grows when it is exercised like a muscle. Where are you trusting your own understanding instead of God's faithfulness? This week, identify one area where you will intentionally rely on God rather than yourself. ${opener ? `Let "${opener}..." be the starting point of your trust.` : ""}`,
      `Faith without action is incomplete. What would you attempt for God if you knew He would not fail you? Take the first step toward that thing today, trusting Him with the outcome.`,
      `Believing is not a one-time event; it is a daily decision. What circumstance is challenging your faith right now? Bring it before God and ask Him to strengthen your trust in Him.`,
    ],
    grace: [
      `You have received grace freely — not because you earned it, but because God is gracious. Now the question that demands an answer: who needs to receive that same grace from you? Is there someone you need to forgive, or someone you have been withholding kindness from? Let grace flow through you as freely as it has been given to you.`,
      `Grace received must become grace extended. Think of the person who has wronged you most recently. Now imagine extending to them the same undeserved favor God has shown you. That is the hard work of grace — and it is the work of the gospel.`,
      `The grace that saved you is also the grace that sustains you. Stop striving to earn what has already been given. Rest in the finished work of Christ, and let that rest overflow into peace with others.`,
    ],
    hope: [
      `What feels hopeless in your life right now? Name it honestly before God. Then ask Him to renew your hope — not by changing your circumstances, but by reminding you of His faithfulness. ${keyClause ? `"${keyClause}" — hold onto this promise today.` : ""}`,
      `Hope is not optimism; it is certainty anchored in God's character. What situation has been stealing your hope? Bring it before God and ask Him to show you where He is at work, even when you cannot see it.`,
      `When hope feels distant, go back to what you know to be true about God. Write down three promises He has kept in your life. Let the past faithfulness of God fuel your hope for the future.`,
    ],
    life: [
      `Eternal life begins now, not after death. How would you live differently today if you truly believed that? Look at your calendar, your worries, your ambitions — do they reflect a life that will outlast the grave? ${opener ? `"${opener}..." — these words call you to live in light of eternity.` : ""}`,
      `You have been given real, eternal life. Does your daily schedule reflect that? Take an honest look at how you spend your time and ask: am I investing in what will last forever?`,
      `The life God gives is not just for the future — it is for today. What would it look like for you to live abundantly right now, in your current circumstances?`,
    ],
    peace: [
      `Peace is not the absence of chaos but the presence of Christ. What is stealing your peace today? Take it to God in prayer, and choose to trust Him with it. ${keyClause ? `"${keyClause}" — let this truth settle your heart.` : ""}`,
      `You cannot control everything, but you can trust the One who does. Identify one source of anxiety in your life and deliberately release it to God. Then refuse to pick it back up.`,
    ],
    fear: [
      `Fear loses its grip when we face it with faith. What are you afraid of? Write it down, pray over it, and remind yourself of God's faithfulness. Then take one step forward despite the fear. ${opener ? `"${opener}..." — these words are stronger than your fear.` : ""}`,
      `Name your fear out loud. Once it is spoken, it loses much of its power. Then remind yourself of this truth: the One who is for you is greater than everything against you.`,
    ],
    suffering: [
      `Your pain is not pointless. Ask God to show you what He is doing in the midst of your struggle. Look for how He might be shaping your character, deepening your compassion, or drawing you closer to Him. ${keyClause ? `"${keyClause}" — hold onto this promise in the pain.` : ""}`,
      `Suffering can either make us bitter or make us better. The difference is not our circumstances but our response. Choose today to trust that God is working in your trial, even when you cannot see it.`,
    ],
    praise: [
      `Take five minutes right now to stop and worship. Not for what God has given you, but for who He is. Let praise shift your perspective from your problems to His greatness.`,
      `Gratitude is the gateway to joy. Before the day ends, write down five things you are thankful for — and let thankfulness lead you into worship.`,
    ],
    wisdom: [
      `Knowledge is knowing what to say; wisdom is knowing when and how to say it. Where do you need God's wisdom today? Ask Him, then listen for His answer through His Word and through godly counsel. ${keyClause ? `"${keyClause}" — let this guide your decision.` : ""}`,
      `The fear of the Lord is the beginning of wisdom. Before making your next important decision, pause and ask: what does it mean to honor God in this choice?`,
    ],
    obedience: [
      `Is there something God has been asking you to do that you have been putting off? Obedience opens the door to blessing. Take that step today, even if it feels small. ${opener ? `"${opener}..." — let these words move you to action.` : ""}`,
      `Obedience is not about perfection; it is about direction. What is one step of obedience God is calling you to take today? Do not wait for the perfect moment — step out now.`,
    ],
    power: [
      `You were not meant to live in your own strength. What challenge are you facing that feels too big for you? Good — it is the perfect opportunity to experience God's power at work in and through you. ${opener ? `"${opener}..." — draw on this power today.` : ""}`,
      `God's power is made perfect in weakness. What weakness are you trying to hide or overcome on your own? Surrender it to Him and watch what He can do through your yieldedness.`,
    ],
    kingship: [
      `God is sovereign over every situation you face. What circumstance has been causing you anxiety? Remind yourself that the King of Kings is on the throne, and nothing happens apart from His permission. ${keyClause ? `"${keyClause}" — let this truth settle your heart.` : ""}`,
      `If Jesus is Lord, then He is Lord of your schedule, your relationships, your finances, and your future. Is there an area of your life where you have not yet surrendered to His authority?`,
    ],
    healing: [
      `God is in the business of restoration. What is broken in your life — a relationship, a dream, your health? Bring it before the Healer and trust Him to do what only He can do. ${keyClause ? `"${keyClause}" — this is His promise to you.` : ""}`,
      `Healing often comes gradually, and it often comes through community. Who can you invite into your journey of restoration? Do not walk this road alone.`,
    ],
    death: [
      `Death is not the end — it is the beginning. How would you live differently today if you truly believed that eternity awaits? Let the reality of the resurrection shape your priorities and quiet your fears. ${keyClause ? `"${keyClause}" — let these words echo in your heart.` : ""}`,
      `Because Christ conquered the grave, we can face our own mortality with hope. Is there anything you would change about how you are living if you knew your time was short?`,
    ],
    warning: [
      `A warning is a gift. Is there an area of your life where you have been ignoring the warning signs? Take a moment to examine your heart and ask God to show you what needs to change. ${opener ? `"${opener}..." — let these words speak to you.` : ""}`,
      `God's warnings are not meant to restrict your joy but to protect it. Where have you been pushing against healthy boundaries? Invite God to realign your path.`,
    ],
    light: [
      `You are called to walk in the light — and to be light for others. What darkness have you been hiding? Bring it into the light of God's presence, and let His forgiveness set you free. ${keyClause ? `"${keyClause}" — this is your calling today.` : ""}`,
      `The light shines in the darkness, and the darkness has not overcome it. What dark situation in your life needs the light of God's truth? Let His Word illuminate your path.`,
    ],
  };

  const defaultApps = [
    `This verse is not merely information to know — it is truth to live. What is one specific way you can respond to this passage before the day ends? Let it change how you think, speak, or act.`,
    `The best response to God's Word is obedience. What is one truth from this verse that you can apply starting today? Do not merely hear it — live it out.`,
    `God's Word is meant to be done, not just discussed. What is one concrete action you can take in response to what you have just read? Make it specific, measurable, and immediate.`,
  ];

  const pool = apps[theme1] || defaultApps;
  return pool[variant % pool.length];
}

function buildPrayer(ref, text, phrases, themes) {
  const i = idx(ref);
  const variant = i % 2;
  const theme1 = themes[0] || "";
  const opener = phrases.opener;
  const keyClause = phrases.keyClause;

  const prayers = {
    love: [
      `Father, thank You for loving us not because we are lovable, but because You are love. Help us to receive Your love fully — to stop striving and simply rest in it. And then empower us to extend that same love to everyone we encounter. ${keyClause ? `May "${keyClause}" become the rhythm of our lives.` : ""} In Jesus' name, Amen.`,
      `Lord, let the love described in this verse become the defining mark of our lives. Help us to love as we have been loved — sacrificially, patiently, without condition. Let others see Jesus in the way we love one another. Amen.`,
    ],
    grace: [
      `Gracious God, we stand in awe of Your mercy. You have given us what we do not deserve and withheld what we do. Let this grace transform us from the inside out — making us as generous and forgiving toward others as You have been toward us. ${opener ? `"${opener}..." — may these words shape our hearts.` : ""} Amen.`,
      `Thank You, Lord, for grace that meets us where we are but refuses to leave us there. Train us by Your grace to say no to ungodliness and to live self-controlled, upright lives. May we never take such love for granted. Amen.`,
    ],
    faith: [
      `Lord, we believe — help our unbelief. When doubts rise and circumstances scream otherwise, anchor us in the truth of who You are. Give us the courage to trust You even when we cannot trace You. ${keyClause ? `Let "${keyClause}" be our confession today.` : ""} Amen.`,
      `Father, increase our faith. Help us to trust You not only when we see, but when we do not see. Give us the confidence to step out, the patience to wait, and the peace to rest in Your will. Amen.`,
    ],
    hope: [
      `God of hope, fill our hearts with confidence in Your promises. When we are tempted to despair, remind us that You are working all things for our good. Let hope rise in us like the morning sun, dispelling the darkness of doubt. ${opener ? `"${opener}..." — anchor us in this truth.` : ""} Amen.`,
      `Lord, anchor our souls in the hope that does not disappoint. When life feels uncertain, remind us that You are our sure foundation. Let this hope sustain us and spill over to everyone around us. Amen.`,
    ],
    life: [
      `Father of life, thank You for the gift of eternal life through Your Son. Help us to live today in the light of eternity, investing our time and energy in what truly matters. ${opener ? `"${opener}..." — let these words shape our priorities.` : ""} May our lives reflect the hope we have in You. Amen.`,
      `Thank You, Father, for the abundant life You offer — life that begins now and extends forever. Help us to stop merely existing and start truly living: pursuing Your purposes, enjoying Your presence, and sharing Your love. In Jesus' name, Amen.`,
    ],
    peace: [
      `Prince of Peace, calm the storms that rage within us. Quiet our anxious hearts and settle our restless minds. Help us to rest in the knowledge that You are in control, even when our world feels out of control. ${keyClause ? `"${keyClause}" — let this be our peace today.` : ""} Amen.`,
      `Lord, in a world of chaos, You are our peace. Teach us to cast our anxieties on You, to breathe in Your presence, and to trust You with what we cannot control. Amen.`,
    ],
    fear: [
      `Lord, when fear knocks at the door of our hearts, let faith answer. Remind us that You have not given us a spirit of fear, but of power, love, and a sound mind. ${opener ? `"${opener}..." — let these words silence our fears.` : ""} Help us to face today with courage because You are with us. Amen.`,
      `Father, we give You our fears — every what-if and worst-case scenario. Replace our anxiety with Your peace, our worry with worship, our fear with faith. You are bigger than anything we face. Amen.`,
    ],
    suffering: [
      `God of all comfort, be near to those who are suffering. When we walk through the valley of pain, remind us that You walk with us — not distant, not detached, but present. Use our trials to shape us and the comfort we receive to serve others. ${keyClause ? `"${keyClause}" — hold us to this promise.` : ""} Amen.`,
      `Lord, when pain feels pointless, help us to trust Your purposes. Give us grace to endure, eyes to see what You are doing, and strength to persevere. Let our suffering produce perseverance, character, and hope. Amen.`,
    ],
    praise: [
      `Worthy is Your name, O Lord. We praise You not just for what You have done, but for who You are. Let our lives be a continual offering of praise, pointing others to Your greatness. ${opener ? `"${opener}..." — let this be our song.` : ""} Amen.`,
      `Lord, tune our hearts to sing Your praise. When we are distracted by our problems, lift our eyes to Your throne. You are worthy of all honor, all glory, all praise — now and forever. Amen.`,
    ],
    power: [
      `Almighty God, we acknowledge that all power belongs to You. When we feel weak, be our strength. When we feel insufficient, be our sufficiency. Let Your power be made perfect in our weakness, so that the world may see that our strength comes from You. ${opener ? `"${opener}..." — let this truth empower us today.` : ""} Amen.`,
      `Lord, we confess that we often try to live in our own strength. Teach us to depend on You, to draw from Your power, and to boast only in what You have done. Your power is made perfect in our weakness. Amen.`,
    ],
    wisdom: [
      `Lord, grant us wisdom from above — pure, peaceable, gentle, and full of mercy. Help us to see life from Your perspective and to make choices that honor You. Give us discernment for the decisions we face today. ${keyClause ? `"${keyClause}" — guide us by Your truth.` : ""} Amen.`,
      `Father, we need Your wisdom. The world offers so many voices, but You alone speak truth. Help us to hear Your voice above the noise and to follow Your wisdom, even when it seems foolish to the world. Amen.`,
    ],
    kingship: [
      `Sovereign Lord, You reign over all. Help us to live under Your authority with joy and confidence, knowing that the King of Kings is our Father. Let Your kingdom come, let Your will be done, in our lives as it is in heaven. ${opener ? `"${opener}..." — let this be our declaration.` : ""} Amen.`,
      `Lord, You are the King above all kings. Help us to submit to Your reign, to trust Your rule, and to find our freedom in serving You. Your kingdom is an everlasting kingdom, and Your dominion endures through all generations. Amen.`,
    ],
    healing: [
      `Lord, You are the God who heals. We bring before You our brokenness — physical, emotional, relational — and ask for Your restoring touch. ${keyClause ? `"${keyClause}" — we hold onto Your promise of restoration.` : ""} Heal us, Lord, and we will be healed. Save us, and we will be saved. Amen.`,
      `Father, we pray for healing — for ourselves, for those we love, for a broken world. Trusting that You make all things new, we ask for Your restoring power to be at work in us and through us. In Jesus' name, Amen.`,
    ],
    death: [
      `Lord, thank You that death is not the end. Because You live, we too shall live. Help us to face our mortality not with fear, but with hope, knowing that You have conquered the grave. ${opener ? `"${opener}..." — let this truth comfort our hearts.` : ""} Amen.`,
      `Father, we thank You that Jesus has defeated death once and for all. Help us to live without fear of the grave, with our eyes fixed not on what is seen but on what is unseen — the eternal glory that awaits us. Amen.`,
    ],
    obedience: [
      `Lord, help us to obey Your Word not out of obligation but out of love. When Your commands seem difficult, remind us that they are given for our good. Give us hearts that delight to do Your will. ${keyClause ? `"${keyClause}" — let these words guide our steps.` : ""} Amen.`,
      `Father, we confess that obedience is hard. Give us the grace to do what You ask, the wisdom to know when to act, and the faith to trust that Your way is always best. Shape us into people who joyfully follow You. Amen.`,
    ],
    warning: [
      `Lord, thank You for the warnings in Your Word — evidence of Your love. Give us ears to hear, hearts to respond, and the humility to turn from anything that leads us away from You. ${opener ? `"${opener}..." — wake us up to Your truth.` : ""} Amen.`,
      `Father, we thank You that You do not leave us in our sin. Your warnings are invitations to life. Give us the wisdom to heed them and the grace to walk in Your ways. Amen.`,
    ],
    light: [
      `Lord, You are the Light of the World. Dispel the darkness in our hearts, guide our steps, and help us to walk as children of light. Let our lives shine before others so they may see Your goodness. ${keyClause ? `"${keyClause}" — let this be our prayer.` : ""} Amen.`,
      `Father, we ask You to fill us with Your light. Expose the darkness in our hearts, guide our path, and help us to reflect Your glory to a world in need of hope. In Jesus' name, Amen.`,
    ],
  };

  const defaultPrayers = [
    `Heavenly Father, thank You for speaking to us through Your Word. May the truth of this passage take root in our hearts and bear fruit in our lives. Help us not merely to hear Your Word, but to do it — for Your glory and our good. In Jesus' name, Amen.`,
    `Lord, let this verse not merely inform us, but transform us. Shape our thoughts, guide our steps, and mold our hearts to be more like Yours. We ask this in the name of Jesus, our Savior and Lord. Amen.`,
  ];

  const pool = prayers[theme1] || defaultPrayers;
  return pool[variant % pool.length];
}

function buildWordStudy(verseResource) {
  if (!verseResource?.wordStudies) return null;
  try {
    const raw = JSON.parse(verseResource.wordStudies);
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.slice(0, 2).map(w => {
      const term = w.word || w.term || w.strongs || "";
      const def = w.meaning || w.definition || w.text || w.description || "";
      return term && def ? `**${term}** — ${def}` : null;
    }).filter(Boolean).join("\n\n");
  } catch { return null; }
}

function buildCrossReferences(verseResource) {
  if (!verseResource?.crossReferences) return null;
  try {
    const raw = JSON.parse(verseResource.crossReferences);
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.slice(0, 3).map(r => {
      const ref = r.ref || r.reference || r.verse || "";
      const text = r.text || r.summary || r.meaning || "";
      return ref ? `${ref}${text ? `: ${text}` : ""}` : null;
    }).filter(Boolean).join("\n\n");
  } catch { return null; }
}

function buildOriginalWordStudy(wordStudyEntries) {
  if (!wordStudyEntries?.length) return null;
  const entries = wordStudyEntries
    .filter(w => w.strongs?.shortDefinition)
    .slice(0, 3);
  if (!entries.length) return null;
  return entries.map(w => {
    const s = w.strongs;
    const term = s.originalWord || w.lemma || w.surfaceText;
    const translit = s.transliteration ? ` (${s.transliteration})` : "";
    const def = s.shortDefinition;
    return term ? `**${term}**${translit} — ${def}` : null;
  }).filter(Boolean).join("\n\n");
}

function buildChapterInsights(chapterTools) {
  if (!chapterTools?.length) return null;
  const labels = {
    PROMISE: "Key Promise",
    COMMAND: "Key Command",
    WARNING: "Key Warning",
    REPEATED_WORD: "Key Repeated Word",
    TRANSITION: "Key Transition",
    CONTRAST: "Key Contrast",
  };
  return chapterTools.slice(0, 4).map(t => {
    const label = labels[t.toolType] || t.toolType;
    const desc = t.description || t.label;
    return `**${label}**: ${desc}`;
  }).join("\n\n");
}

function buildContextField(contextVerses, verseNum) {
  if (!contextVerses?.length) return null;
  const byVerse = {};
  for (const v of contextVerses) {
    const key = Number(v.verse);
    if (key === verseNum) continue;
    if (!byVerse[key] || v.translation === "BSB") {
      byVerse[key] = v;
    }
  }
  const vals = Object.values(byVerse).sort((a, b) => Number(a.verse) - Number(b.verse));
  if (!vals.length) return null;
  return vals.map(v => `**Verse ${Number(v.verse)}:** ${v.verseText}`).join("\n\n");
}

function blendSources({ dailyExegesis, verseExplanation, verseResource, prologue, verseText, ref, depth, themes, genre, contextVerses, chapterTools, wordStudyEntries, verseNum }) {
  const phrases = extractPhrases(verseText);
  const isDetailed = depth === "detailed";
  const isBrief = depth === "brief";

  const result = { ref, text: verseText || "" };

  result.intro = (dailyExegesis?.introduction || dailyExegesis?.contextSummary)
    || buildIntro(ref, verseText, prologue, phrases, genre, contextVerses, verseNum);

  const lessonParts = [];
  if (dailyExegesis?.teachingBody) lessonParts.push(dailyExegesis.teachingBody);
  if (verseExplanation?.explanation) {
    const expl = verseExplanation.explanation;
    if (!lessonParts.length || !lessonParts[0].includes(expl.slice(0, 60))) {
      lessonParts.push(expl);
    }
  }
  if (!lessonParts.length) {
    lessonParts.push(buildLesson(ref, verseText, prologue, phrases, themes, genre));
  }
  if (isDetailed && verseResource?.commentaries) {
    try {
      const comms = JSON.parse(verseResource.commentaries);
      if (Array.isArray(comms) && comms[0]?.text) {
        const snippet = typeof comms[0].text === "string" ? comms[0].text.slice(0, 350).trim() : "";
        if (snippet) lessonParts.push(snippet);
      }
    } catch {}
  }
  if (verseExplanation?.learnMore && !lessonParts.some(p => p.includes(verseExplanation.learnMore))) {
    lessonParts.push(`For further study: ${verseExplanation.learnMore}`);
  }
  result.explanation = lessonParts.join("\n\n");

  if (!isBrief && dailyExegesis?.application) {
    result.application = dailyExegesis.application;
  } else if (!isBrief) {
    result.application = buildApplication(verseText, phrases, themes);
  }

  result.prayer = dailyExegesis?.prayer || buildPrayer(ref, verseText, phrases, themes);

  if (isDetailed) {
    const ws = buildWordStudy(verseResource);
    const ows = buildOriginalWordStudy(wordStudyEntries);
    if (ws) {
      result.wordStudy = ws;
    } else if (ows) {
      result.wordStudy = ows;
    } else {
      const raw = wordStudyEntries?.filter(w => w.strongs?.shortDefinition)?.slice(0, 3)
        .map(w => `**${w.strongs.originalWord || w.lemma || w.surfaceText}**${w.strongs.transliteration ? ` (${w.strongs.transliteration})` : ""} — ${w.strongs.shortDefinition}`)
        .join("\n\n");
      if (raw) result.wordStudy = raw;
    }
    const cr = buildCrossReferences(verseResource);
    if (cr) result.crossReferences = cr;
    const ctx = buildContextField(contextVerses, verseNum);
    if (ctx) result.context = ctx;
    const ci = buildChapterInsights(chapterTools);
    if (ci) result.chapterInsights = ci;
  }

  return result;
}

/**
 * Build a prompt-specific answer for LookStage reflection prompts.
 * Uses existing AI analysis data to generate relevant observations
 * based on the prompt type (index 0-5).
 */
function buildPromptAnswer(promptIdx, {
  ref, verseText, themes, chapterTools, wordStudy, prologue, genre,
  explanation, intro, crossReferences, chapterInsights, context, contextVersesStr,
}) {
  const theme1 = themes[0] || "";
  const theme2 = themes[1] || "";
  const genreName = genre || "scripture";

  // Build a rich picture of the passage from the available data
  const words = verseText ? verseText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const opener = words.slice(0, Math.min(5, wordCount)).join(" ");
  const closer = words.slice(-3).join(" ");

  const hasCommand = chapterTools?.some(t => t.toolType === "COMMAND");
  const hasPromise = chapterTools?.some(t => t.toolType === "PROMISE");
  const hasWarning = chapterTools?.some(t => t.toolType === "WARNING");
  const hasContrast = chapterTools?.some(t => t.toolType === "CONTRAST");
  const hasRepeatedWord = chapterTools?.some(t => t.toolType === "REPEATED_WORD");
  const hasTransition = chapterTools?.some(t => t.toolType === "TRANSITION");

  const answers = [
    // Prompt 0: "What specific words or phrases stand out to you in this passage?"
    () => {
      const parts = [];

      // Use the AI intro to give context about key words
      if (intro) {
        const firstSentence = intro.split(/[.!?]/)[0];
        parts.push(`**Passage context:** ${firstSentence}.`);
      }

      // Word study terms with their definitions
      if (wordStudy) {
        const studyLines = wordStudy.split("\n\n").filter(Boolean);
        if (studyLines.length > 0) {
          parts.push(`**Key terms to observe:**\n${studyLines.slice(0, 3).join("\n")}`);
        }
      }

      // Quote the actual verse text with specific words highlighted
      if (verseText) {
        // Find the most significant word (longest unique word)
        const significantWords = verseText.match(/\b[A-Z]\w{4,}\b|[a-z]\w{7,}\b/g)?.slice(0, 5) || [];
        if (significantWords.length > 0) {
          parts.push(`**Significant words in ${ref}:** "${significantWords.join(", ")}" — these carry the weight of the passage.`);
        }
        // Quote the opening and closing phrases
        if (opener) {
          parts.push(`The verse opens with **"${opener}…"** which immediately establishes the subject and tone.`);
        }
        if (closer && wordCount > 5) {
          parts.push(`It concludes with **"…${closer}"**, leaving the reader with this final emphasis.`);
        }
      }

      // Add cross-references if available for deeper word study
      if (crossReferences) {
        const refs = crossReferences.split("\n\n").filter(Boolean);
        if (refs.length > 0) {
          parts.push(`**Connected passages:** These related verses shed light on key terms:\n${refs.slice(0, 2).join("\n")}`);
        }
      }

      // Show surrounding verses for context
      if (contextVersesStr) {
        parts.push(`**Surrounding verses for context:**\n${contextVersesStr}`);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `In ${ref || "this passage"}, pay close attention to the opening words and any terms that carry significant theological weight. The original language layer (Hebrew/Greek) often reveals depth that English translations cannot fully capture. Ask: which words would I circle if I were marking up this verse?`;
    },

    // Prompt 1: "Who is speaking? Who is listening or being addressed?"
    () => {
      const parts = [];

      // Use the intro for speaker context
      if (intro) {
        const introLines = intro.split(/[.!?]+/).filter(Boolean);
        if (introLines.length > 0) {
          parts.push(introLines.slice(0, 2).join(". ") + ".");
        }
      }

      // Prologue details from the book
      if (prologue) {
        if (prologue.author) parts.push(`**Author:** ${prologue.author}.`);
        if (prologue.audience) parts.push(`**Original audience:** ${prologue.audience}.`);
        if (prologue.dateWritten) parts.push(`**Written:** ${prologue.dateWritten}.`);
        if (prologue.locationWritten) parts.push(`**Location:** ${prologue.locationWritten}.`);
        if (prologue.purpose) parts.push(`**Purpose of this book:** ${prologue.purpose}`);
      }

      // Genre-based analysis of voice
      if (genreName === "gospel") {
        parts.push(`**Gospel voice:** This is the testimony of an eyewitness — recording the very words and works of Jesus. The Gospels present Christ as the central speaker and subject. Notice whether Jesus is speaking, or whether the narrative is describing His actions.`);
      } else if (genreName === "epistle") {
        parts.push(`**Apostolic voice:** An apostle or church leader writes with authority to address specific needs in the early church. The letter format means the author is speaking directly to a community — and through Scripture, to us.`);
      } else if (genreName === "prophecy") {
        parts.push(`**Prophetic voice:** The prophet speaks as God's messenger — "Thus says the Lord." The word comes with divine authority, calling God's people to repentance, hope, and faithful living.`);
      } else if (genreName === "law") {
        parts.push(`**Covenant voice:** God Himself speaks through Moses, establishing His covenant and instructing His people in the way of life. These are not suggestions — they are the terms of relationship with the living God.`);
      } else if (genreName === "poetry") {
        parts.push(`**Poetic voice:** This is the language of the heart — the psalmist or sage speaking to God, about God, or about the human condition. Poetry invites you not just to understand, but to feel and respond.`);
      } else if (genreName === "history") {
        parts.push(`**Narrative voice:** The historical books record God's actions in and through His people. Ask: what is God doing in this moment? How are His purposes unfolding through these events?`);
      } else if (genreName === "apocalyptic") {
        parts.push(`**Apocalyptic voice:** Visions and symbols reveal the heavenly perspective on earthly reality. The veil is pulled back to show that God is sovereign over history.`);
      }

      // Show surrounding context if available
      if (context) {
        parts.push(`**What the surrounding verses say:**\n${context}`);
      }

      // Use the verse text to identify the speaker from content
      if (verseText) {
        const firstWords = words.slice(0, 3).join(" ");
        if (verseText.startsWith("\"") || verseText.startsWith("'")) {
          parts.push(`**Note:** This verse contains direct speech (quotation marks), indicating someone is speaking directly. Consider who is being quoted.`);
        }
        if (/^Jesus\b|^He\s+said|^And\s+he\s+said|^Then\s+he/i.test(verseText)) {
          parts.push(`**Key observation:** The verse reports speech. Look at who is introduced as speaking in the surrounding context.`);
        }
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Consider who is speaking in ${ref || "this passage"} and who the intended audience is. The ${genreName} genre shapes how we hear the message. Is this a direct command? A narrative account? A poetic expression? The answer shapes how we respond.`;
    },

    // Prompt 2: "What commands, promises, warnings, or truths do you see?"
    () => {
      const parts = [];

      // Use chapter study tools if available (most specific)
      if (hasCommand || hasPromise || hasWarning) {
        if (hasCommand) {
          const cmds = chapterTools.filter(t => t.toolType === "COMMAND");
          parts.push(`**Commands to obey:**\n${cmds.map(c => `• ${c.label}${c.description ? ` — ${c.description}` : ""}`).join("\n")}`);
        }
        if (hasPromise) {
          const prs = chapterTools.filter(t => t.toolType === "PROMISE");
          parts.push(`**Promises to claim:**\n${prs.map(p => `• ${p.label}${p.description ? ` — ${p.description}` : ""}`).join("\n")}`);
        }
        if (hasWarning) {
          const wrns = chapterTools.filter(t => t.toolType === "WARNING");
          parts.push(`**Warnings to heed:**\n${wrns.map(w => `• ${w.label}${w.description ? ` — ${w.description}` : ""}`).join("\n")}`);
        }
      } else {
        // Use the AI explanation to extract the key teaching
        if (explanation) {
          const explLines = explanation.split("\n\n").filter(Boolean);
          if (explLines.length > 0) {
            parts.push(`**The central teaching:** ${explLines[0]}`);
          }
          if (explLines.length > 1) {
            parts.push(`**Further insight:** ${explLines[1]}`);
          }
        }
      }

      // Use chapterInsights for transitions that highlight key moments
      if (hasTransition) {
        const trans = chapterTools.filter(t => t.toolType === "TRANSITION");
        const transText = trans.map(t => `• ${t.label}${t.description ? ` — ${t.description}` : ""}`).join("\n");
        parts.push(`**Structural clues:**\n${transText}`);
      }

      // Check the actual verse text for commands (imperatives) and promises
      if (verseText) {
        const imperativeMarkers = /\b(do|do not|go|come|listen|hear|see|believe|follow|love|keep|remember|be|let|must|shall|should|will you|you shall|you will)/gi;
        const imperatives = verseText.match(imperativeMarkers);
        if (imperatives && imperatives.length > 0) {
          const uniqueCmds = [...new Set(imperatives.map(i => i.toLowerCase()))].slice(0, 4);
          parts.push(`**Directives in the text:** The verse contains words like "${uniqueCmds.join(", ")}" — these indicate action or response.`);
        }
      }

      // Use theme analysis
      if (!hasCommand && !hasPromise && !hasWarning) {
        if (explanation && !parts.some(p => p.includes("The central teaching"))) {
          // Fallback themes if no explanation either
          const themeDescriptions = {
            love: `The central revelation here is **love** — not an abstract concept, but the very nature of God made actionable. This is both a promise (God loves you) and a command (love one another). In ${ref}, love takes center stage.`,
            faith: `**Faith** is the thread. This verse calls for trust in God's character and promises, even when circumstances remain unclear or difficult.`,
            grace: `**Grace** is on display — God's unearned favor. This is not merely a doctrine but a reality that transforms how we live and relate to God and others.`,
            hope: `**Hope** anchors this passage. Not wishful thinking, but confident expectation rooted in God's faithfulness and the certainty of His promises.`,
            judgment: `There is a **sober truth** here about the consequences of sin and the holiness of God. Yet woven through is the thread of grace — God's warnings are acts of love meant to protect.`,
            life: `**Life** — abundant, eternal, transformative — pulses through these words. The passage points beyond mere existence to the life that flows from God Himself.`,
            kingship: `**God's sovereign rule** is central. His kingdom brings order, justice, and peace, and we are called to live under His gracious authority.`,
            wisdom: `**Wisdom** calls out — the fear of the Lord that is the beginning of understanding. This passage invites you to see reality from God's perspective.`,
            obedience: `**Obedience** emerges as a key theme. The passage connects what we believe with how we live, showing that true faith expresses itself through faithful action.`,
          };
          const desc = themeDescriptions[theme1];
          if (desc) parts.push(desc);
        }
      }

      // Ground it in the actual verse text
      if (verseText && wordCount > 5) {
        parts.push(`**What the verse actually says:** "${words.slice(0, 10).join(" ")}..." This is the raw material for your observation.`);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Read ${ref || "this passage"} carefully and identify: Is there a **command** to follow? A **promise** to claim? A **warning** to heed? A **truth** to believe? These four elements form the backbone of biblical teaching.`;
    },

    // Prompt 3: "What is repeated in this passage?"
    () => {
      const parts = [];

      if (hasRepeatedWord) {
        const reps = chapterTools.filter(t => t.toolType === "REPEATED_WORD");
        parts.push(`**Notable repetitions in this chapter:**\n${reps.map(r => `• "${r.label}"${r.description ? ` — ${r.description}` : ""}`).join("\n")}`);
      }

      // Word frequency from the actual verse text
      if (verseText) {
        const cleaned = verseText.toLowerCase().replace(/[^a-z\s]/g, "");
        const wordFreq = {};
        cleaned.split(/\s+/).forEach(w => {
          if (w.length > 2) wordFreq[w] = (wordFreq[w] || 0) + 1;
        });
        const repeated = Object.entries(wordFreq)
          .filter(([, c]) => c > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        if (repeated.length > 0) {
          parts.push(`**Words repeated in this verse:**\n${repeated.map(([w, c]) => `• "${w}" appears ${c} times`).join("\n")}`);
          parts.push(`Repetition in Scripture signals emphasis. When a biblical author repeats a word, they are saying: "Pay attention — this matters."`);
        } else if (wordCount > 3) {
          // No exact word repetition, but note unique key terms
          const uniqueWords = [...new Set(verseText.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(w => w.length > 3))];
          if (uniqueWords.length > 0) {
            parts.push(`While no single word repeats in this verse, the key concepts are: **${uniqueWords.slice(0, 5).join(", ")}**. Notice how each contributes to the single message the verse delivers.`);
          }
        }
      }

      // Use themes as conceptual repetition
      if (theme1 || theme2) {
        const themeNames = [theme1, theme2].filter(Boolean).map(t => `**${t}**`).join(" and ");
        parts.push(`**Thematic repetition:** The ${themeNames} theme${theme2 ? "s" : ""} recur${theme2 ? "" : "s"} throughout, suggesting this is the central concern of the passage. Biblical authors emphasize by repetition — what appears once can be noted, but what appears twice demands reflection.`);
      }

      // Use chapterInsights for repeated words from admin-curated tools
      if (chapterInsights && !parts.some(p => p.includes("Notable repetitions"))) {
        const insightLines = chapterInsights.split("\n\n").filter(Boolean);
        const repeatedInsights = insightLines.filter(l => l.toLowerCase().includes("repeat"));
        if (repeatedInsights.length > 0) {
          parts.push(`**From study insights:**\n${repeatedInsights.slice(0, 2).join("\n\n")}`);
        }
      }

      return parts.length > 1
        ? parts.join("\n\n")
        : `Read ${ref || "this passage"} again and notice what ideas, words, or phrases echo. Hebrew poetry and biblical teaching often use repetition for emphasis — if something appears more than once, it's the author signaling its importance.`;
    },

    // Prompt 4: "What contrasts do you notice (light/darkness, before/after, etc.)?"
    () => {
      const parts = [];

      if (hasContrast) {
        const conts = chapterTools.filter(t => t.toolType === "CONTRAST");
        parts.push(`**Recognized contrasts in this chapter:**\n${conts.map(c => `• ${c.label}${c.description ? ` — ${c.description}` : ""}`).join("\n")}`);
      }

      // Scan verse text for common biblical contrast pairs
      const contrastPairs = {
        "light": "darkness", "life": "death", "love": "hate",
        "good": "evil", "truth": "lie", "bless": "curse",
        "faith": "fear", "grace": "law", "wisdom": "folly",
        "flesh": "spirit", "heaven": "earth", "old": "new",
        "rich": "poor", "first": "last", "before": "after",
        "strength": "weakness", "kingdom": "world", "obey": "disobey",
      };

      const foundContrasts = [];
      if (verseText) {
        const lower = verseText.toLowerCase();
        for (const [a, b] of Object.entries(contrastPairs)) {
          if (lower.includes(a) && lower.includes(b)) {
            // Highlight the exact phrase where the contrast appears
            const matchIdx = Math.min(lower.indexOf(a), lower.indexOf(b));
            const snippet = verseText.slice(Math.max(0, matchIdx), matchIdx + 80).split(/[.!?;,]/)[0];
            foundContrasts.push(`"${snippet.trim()}" (${a}/${b})`);
          }
        }
      }

      if (foundContrasts.length > 0) {
        parts.push(`**Contrasts detected in the verse itself:**\n${foundContrasts.slice(0, 3).join("\n\n")}`);
        parts.push(`Biblical contrasts aren't merely literary devices — they present two paths, two natures, two destinies. They call for a choice. Which side of the contrast does this passage call you to embrace?`);
      }

      // Specific theme-based contrast analysis
      const themeContrasts = {
        light: `${ref} engages the light/darkness contrast, which is foundational in Scripture. Light represents truth, holiness, and the presence of God; darkness represents ignorance, evil, and separation from God. This passage likely calls you to choose which realm you will walk in.`,
        love: `The love/hate contrast here isn't about emotion — it's about covenant loyalty. To love God is to be faithful to Him; to hate is to reject His ways. This verse presents a decision about allegiance.`,
        life: `Life/death is the ultimate biblical contrast. The gospel announces that death has been defeated and life — real, eternal life — has won. This passage stands in that victory.`,
        judgment: `The judgment/grace contrast runs through this passage. God's holiness demands accountability, but His mercy offers redemption. Both are real; both demand a response.`,
      };

      const contrastText = themeContrasts[theme1];
      if (contrastText && !parts.some(p => p.includes("light/darkness") || p.includes("love/hate") || p.includes("life/death"))) {
        parts.push(contrastText);
      }

      return parts.length > 0
        ? parts.join("\n\n")
        : `Biblical writers often use contrasts to sharpen understanding — light vs. darkness, flesh vs. spirit, the way of wisdom vs. the way of folly. Read ${ref || "this passage"} looking for opposing ideas. They reveal the choices set before us and the stakes involved.`;
    },

    // Prompt 5: "What questions does this passage raise in your mind?"
    () => {
      const parts = [];

      if (verseText) {
        const phrase = words.slice(0, 12).join(" ");

        // Generate passage-specific questions based on the verse content
        const themeQuestions = {
          love: `Since this passage centers on **love**, ask yourself: What kind of love is being described here? Is it God's love for us, our love for God, or our love for one another? What does this love look like in action? Does it comfort, command, or challenge you?`,
          faith: `With **faith** at the center: What is this passage calling you to trust God for? Is the emphasis on believing a specific truth, trusting in a promise, or stepping out in obedience? What would change if you fully believed this?`,
          grace: `**Grace** raises profound questions: What does this reveal about God's character that you couldn't know otherwise? How does undeserved favor change your identity? Is there someone you need to extend this same grace to?`,
          hope: `**Hope** prompts these questions: What does this passage tell you about God's faithfulness? How does this hope change how you face your current circumstances? Is your hope built on feelings or on God's promises?`,
          life: `**Life** — eternal and abundant — raises the question: Does your daily life reflect the reality of eternity? What would change if you truly believed that real life begins now and extends forever?`,
          judgment: `**Judgment** confronts us: Does this passage make you uncomfortable? Why? Is there sin to confess, a relationship to make right, or a warning you've been ignoring? How does grace intersect with the sobering truths here?`,
          kingship: `**God's sovereignty** invites reflection: Is there an area of your life where you've resisted His authority? What would it look like to truly live under His reign today? How does His kingship change your perspective on current events?`,
          wisdom: `**Wisdom** calls for discernment: Where do you need God's wisdom right now? What would it look like to apply this passage's truth to a specific decision you're facing? Are you listening to God's voice or the world's noise?`,
          obedience: `**Obedience** raises the question: What is God asking you to do that you've been putting off? Is there a step of faith you need to take? Remember, obedience is not about perfection — it's about direction.`,
        };

        const themeQ = themeQuestions[theme1];
        if (themeQ) {
          parts.push(`**Questions this passage raises for you:**\n${themeQ}`);
        }

        // Always add these universal reflection questions, grounded in the specific text
        parts.push(`**Deeper reflection questions for ${ref}:**\n\n`);
        parts.push(`1. **About God —** The text says "${phrase}..." What does this reveal about God's character? Is He acting, commanding, promising, warning, or revealing? What does this tell me about His heart toward humanity?\n\n`);
        parts.push(`2. **About humanity —** What does this say about who we are — our condition, our need, our purpose? Does it confront me, comfort me, or challenge me to grow?\n\n`);
        parts.push(`3. **About response —** What does this passage require of me? Is there something to believe, something to do, something to change, or something to share? Make it specific.\n\n`);
        parts.push(`4. **About Christ —** Even if Jesus isn't mentioned directly, how does this passage point to Him? All Scripture ultimately testifies of Christ — the one who fulfills every promise, embodies every truth, and answers every human need.\n\n`);
        parts.push(`5. **The Spirit's question —** The most important question is the one the Holy Spirit is pressing on your heart right now. What is it? Take a moment to be still and listen.`);

        // Use explanation to generate additional passage-specific questions
        if (explanation) {
          const shortExpl = explanation.split(".").slice(0, 2).join(".");
          parts.push(`**One more thought:** ${shortExpl}. What does this insight reveal that you hadn't considered before?`);
        }
      } else {
        parts.push(`Approach ${ref || "this passage"} with these framing questions:\n\n`);
        parts.push(`1. **What does this teach me about God?** — His character, His ways, His heart toward me.\n\n`);
        parts.push(`2. **What does this teach me about humanity?** — our condition, our need, our hope in Christ.\n\n`);
        parts.push(`3. **How does this point to Christ?** — All Scripture, in some way, testifies of Jesus.\n\n`);
        parts.push(`4. **What must I do?** — Where is the call to believe, obey, repent, or share?\n\n`);
        parts.push(`5. **What is the Spirit saying to me?** — Pause, be still, and listen for His voice.`);
      }

      return parts.join("");
    },
  ];

  const answer = answers[promptIdx];
  return answer ? answer() : `Reflect on ${ref || "this passage"} with an open heart. What does the Spirit seem to be emphasizing to you personally as you read these words?`;
}

export async function explainVerses(book, chapter, verse, depth = "standard") {
  const bookName = normalizeBook(book);
  const cacheKey = `ai:${bookName}:${chapter}:${verse}:${depth}`;

  if (memCache.has(cacheKey)) return memCache.get(cacheKey);
  const cached = await cache.get("ai", cacheKey);
  if (cached) {
    memCache.set(cacheKey, cached);
    return cached;
  }

  const ref = `${bookName} ${chapter}:${verse}`;
  const genre = detectGenre(bookName);
  const isDetailed = depth === "detailed";

  const [verseRow, prologue, dailyExegesis, verseExplanation, verseResource, contextVerses, chapterTools, wordStudyEntries] = await Promise.all([
    prisma.searchIndex.findFirst({
      where: { bookName, chapter, verse },
      select: { verseText: true },
    }),
    prisma.bookPrologue.findUnique({ where: { bookName } }),
    prisma.dailyExegesis.findFirst({
      where: { passageReference: ref },
      select: { introduction: true, contextSummary: true, teachingBody: true, application: true, prayer: true },
    }),
    prisma.verseExplanation.findUnique({
      where: { bookName_chapter_verseNumber: { bookName, chapter, verseNumber: verse } },
      select: { explanation: true, learnMore: true },
    }),
    prisma.verseResource.findFirst({
      where: { bookName, chapter, verseStart: { lte: verse }, OR: [{ verseEnd: null }, { verseEnd: { gte: verse } }] },
      select: { commentaries: true, crossReferences: true, wordStudies: true },
    }),
    prisma.searchIndex.findMany({
      where: { bookName, chapter, verse: { gte: Math.max(1, verse - 2), lte: verse + 2 } },
      select: { verse: true, verseText: true, translation: true },
      orderBy: [{ verse: "asc" }, { translation: "asc" }],
    }),
    isDetailed ? prisma.chapterStudyTool.findMany({
      where: { bookName: bookName, chapter },
      select: { toolType: true, label: true, description: true },
      orderBy: { order: "asc" },
    }) : [],
    isDetailed ? prisma.verseWord.findMany({
      where: { bookName: bookName, chapter, verse },
      select: {
        surfaceText: true,
        lemma: true,
        strongs: { select: { originalWord: true, transliteration: true, shortDefinition: true } },
      },
      orderBy: { wordOrder: "asc" },
    }) : [],
  ]);

  const verseText = verseRow?.verseText || "";
  const themes = detectThemes(verseText);

  const result = blendSources({
    dailyExegesis, verseExplanation, verseResource, prologue,
    verseText, ref, depth, themes, genre,
    contextVerses: contextVerses || [],
    chapterTools: chapterTools || [],
    wordStudyEntries: wordStudyEntries || [],
    verseNum: verse,
  });

  memCache.set(cacheKey, result);
  await cache.set("ai", cacheKey, result, CACHE_TTL);
  return result;
}

export async function generatePromptAnswer(book, chapter, verse, promptIdx) {
  const idx = parseInt(promptIdx, 10);
  if (isNaN(idx) || idx < 0 || idx > 5) {
    return { error: "Invalid prompt index. Must be 0-5." };
  }

  const bookName = normalizeBook(book);
  const ch = parseInt(chapter, 10);
  const vs = parseInt(verse, 10);
  const genre = detectGenre(bookName);

  // Fetch prologue separately — it's NOT returned by explainVerses
  const [prologue, analysis] = await Promise.all([
    prisma.bookPrologue.findUnique({ where: { bookName } }),
    explainVerses(bookName, ch, vs, "detailed"),
  ]);

  if (!analysis) {
    return { error: "Could not generate analysis for this passage." };
  }

  // Re-fetch for the prompt builder — get full verse text and chapter-level tools
  const [verseRow, chapterTools, contextVerses] = await Promise.all([
    prisma.searchIndex.findFirst({
      where: { bookName, chapter: ch, verse: vs },
      select: { verseText: true },
    }),
    prisma.chapterStudyTool.findMany({
      where: { bookName, chapter: ch },
      select: { toolType: true, label: true, description: true },
      orderBy: { order: "asc" },
    }),
    prisma.searchIndex.findMany({
      where: { bookName, chapter: ch, verse: { gte: Math.max(1, vs - 3), lte: vs + 3 } },
      select: { verse: true, verseText: true },
      orderBy: { verse: "asc" },
      take: 7,
    }),
  ]);

  const verseText = verseRow?.verseText || analysis.text || "";
  const themes = detectThemes(verseText);

  // Build context verses display string for chapter-level awareness
  const ctxVerses = (contextVerses || [])
    .filter(v => Number(v.verse) !== vs)
    .slice(0, 4)
    .map(v => `Verse ${v.verse}: "${v.verseText}"`)
    .join("\n");

  const answer = buildPromptAnswer(idx, {
    ref: analysis.ref,
    verseText,
    themes,
    chapterTools: chapterTools || [],
    wordStudy: analysis.wordStudy,
    prologue,
    genre,
    // NEW: pass the full AI analysis for deeper verse-specific answers
    explanation: analysis.explanation,
    intro: analysis.intro,
    crossReferences: analysis.crossReferences,
    context: analysis.context,
    chapterInsights: analysis.chapterInsights,
    contextVersesStr: ctxVerses,
  });

  return {
    promptIdx: idx,
    answer,
    verseRef: analysis.ref,
  };
}
