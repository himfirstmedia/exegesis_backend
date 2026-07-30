import { prisma } from "../../config/db.js";
import { cache } from "../../services/cacheService.js";
import crypto from "crypto";

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
  "psalm": "Psalms",
  "psalms": "Psalms",
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

function detectThemes(text) {
  const t = text.toLowerCase();
  const themes = [];
  if (/\blove\b|\bloved\b|\bloving\b|\bcharity\b/i.test(t)) themes.push("love");
  if (/\bfaith\b|\bbelieve\b|\bbelieved\b|\bbelieving\b|\btrust\b|\bconfidence\b/i.test(t)) themes.push("faith");
  if (/\blife\b|\blive\b|\bliving\b|\bsave\b|\bsavior\b|\bsalvation\b|\beternal\b|\bimmortal\b/i.test(t)) themes.push("life");
  if (/\blight\b|\bdarkness\b|\bdark\b|\bshine\b|\bradiance\b/i.test(t)) themes.push("light");
  if (/\bsin\b|\bsinner\b|\bjudgment\b|\bcondemn\b|\bcondemned\b|\bwrath\b|\bjudge\b/i.test(t)) themes.push("judgment");
  if (/\bhope\b|\bhoped\b|\bpromise\b|\bpromised\b|\bblessed\b|\bblessing\b|\bcovenant\b/i.test(t)) themes.push("hope");
  if (/\bgrace\b|\bgracious\b|\bmercy\b|\bmerciful\b|\bforgive\b|\bforgiven\b|\bforgiveness\b|\bredemption\b|\bredeem\b/i.test(t)) themes.push("grace");
  if (/\bpower\b|\bmighty\b|\bauthority\b|\bstrength\b|\bkingdom\b/i.test(t)) themes.push("power");
  if (/\bpeace\b|\bpeaceful\b|\brest\b|\bcomfort\b|\bcomforted\b/i.test(t)) themes.push("peace");
  if (/\bfear\b|\bafraid\b|\banxious\b|\bworry\b/i.test(t)) themes.push("fear");
  if (/\bobey\b|\bobedience\b|\bcommand\b|\bcommandment\b|\bkeep\b|\blaw\b|\bstatute\b/i.test(t)) themes.push("obedience");
  if (/\bwarn\b|\bwarning\b|\bwoe\b|\bbeware\b|\brepent\b|\brepentance\b/i.test(t)) themes.push("warning");
  if (/\brejoice\b|\brejoiced\b|\bpraise\b|\bpraised\b|\bthank\b|\bthanksgiving\b|\bsing\b|\bsong\b|\bglory\b|\bglorify\b/i.test(t)) themes.push("praise");
  if (/\bsuffer\b|\bsuffering\b|\bpain\b|\btrouble\b|\btribulation\b|\baffliction\b|\bpersecute\b/i.test(t)) themes.push("suffering");
  if (/\bheal\b|\bhealed\b|\bhealing\b|\bhealth\b|\bwhole\b|\brestore\b|\brestored\b/i.test(t)) themes.push("healing");
  if (/\bdeath\b|\bdie\b|\bdead\b|\bgrave\b|\bperish\b|\bdestroy\b|\bdestruction\b/i.test(t)) themes.push("death");
  if (/\bking\b|\bkingdom\b|\breign\b|\bthrone\b|\bruler\b|\blord\b/i.test(t)) themes.push("kingship");
  if (/\bwisdom\b|\bwise\b|\bunderstanding\b|\bknowledge\b|\btruth\b|\binstruct\b|\bteach\b|\bteacher\b/i.test(t)) themes.push("wisdom");
  return themes;
}

function idx(ref) {
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = ((h << 5) - h) + ref.charCodeAt(i);
  return Math.abs(h);
}

function buildFromVerse(ref, text, p) {
  const themes = detectThemes(text);
  const i = idx(ref);

  const introPool = [
    () => p
      ? `In ${ref}, we find one of the most significant statements in ${p.bookName}. The verse reads: "${text}" As part of a letter written ${p.dateWritten ? `around ${p.dateWritten}` : ""} ${p.author ? `by ${p.author}` : ""}, it carries the weight of divine revelation intended for all who would read it.`
      : `${ref} presents us with a truth that has resonated with believers throughout the ages. The scripture says: "${text}"`,
    () => p
      ? `The words of ${ref} come to us from ${p.bookName}, a book that emphasizes ${p.keyTheme ? p.keyTheme.toLowerCase() : "God's relationship with His people"}. ${p.purpose ? p.purpose.charAt(0).toUpperCase() + p.purpose.slice(1) + "." : ""}`
      : `At ${ref}, Scripture opens a window into the heart of God. "${text}"`,
    () => p
      ? `${ref} emerges from a specific moment in redemptive history. ${p.bookName}, ${p.dateWritten ? `written around ${p.dateWritten}` : ""} ${p.author ? `by ${p.author}` : ""}, brings us this message: "${text}" ${p.summary ? p.summary.split(".")[0] + "." : ""}`
      : `There are verses that stop us in our tracks, and ${ref} is one of them. "${text}"`,
  ];

  const lessonPool = [
    () => {
      if (themes.includes("love")) return `At the heart of this verse is love — not a shallow emotion, but the kind of self-giving love that defines God Himself. It tells us that God does not merely possess love; He is love. This transforms how we understand everything: our purpose, our relationships, and our eternal destiny. ${p?.christConnection || ""}`;
      if (themes.includes("grace")) return `This verse showcases grace — unearned, undeserved, and unabashedly generous. It reminds us that we don't earn God's favor; we receive it. The ground is level at the foot of the cross, and this passage calls us to live in humble response to the grace we have been shown. ${p?.christConnection || ""}`;
      if (themes.includes("faith")) return `Faith is the thread that runs through this verse. Not faith in ourselves or our abilities, but a confident trust in the God who keeps His promises. This passage calls us to move from seeing to believing, from doubting to trusting, from fear to faith. ${p?.christConnection || ""}`;
      if (themes.includes("life")) return `This verse pulses with life — not just existence, but the abundant, eternal life that flows from God Himself. It declares that the life we were made for is found not in things, but in Him. This is the heartbeat of the gospel: death defeated, life unleashed, hope secured. ${p?.christConnection || ""}`;
      if (themes.includes("hope")) return `Hope rises from this verse like the dawn after a long night. It anchors us in the certainty of God's promises, giving us strength to endure and courage to press on. This is not wishful thinking; it is the confident expectation that God will do what He has said. ${p?.christConnection || ""}`;
      if (themes.includes("peace")) return `Peace flows through this verse — not the absence of trouble, but the deep, settled confidence that comes from knowing who God is. It speaks to the restless heart and offers rest for the weary soul. ${p?.christConnection || ""}`;
      if (themes.includes("warning")) return `This verse comes as a wake-up call, urging us to take our spiritual lives seriously. It reminds us that our choices matter and that the path of disobedience leads to destruction. But even in the warning, there is love — God does not warn us to frighten us, but to protect us. ${p?.christConnection || ""}`;
      if (themes.includes("praise")) return `This verse erupts with praise, calling us to lift our eyes from our circumstances and fix them on the God who is worthy. Worship is not just something we do; it is a response to who God is and what He has done. ${p?.christConnection || ""}`;
      if (themes.includes("fear")) return `This verse speaks directly to our fears. It reminds us that fear has no place in the presence of God. When we know who holds the future, we can face the present with courage. ${p?.christConnection || ""}`;
      if (themes.includes("suffering")) return `Suffering is not meaningless, and this verse helps us see why. It reframes our pain in light of God's purposes, reminding us that He walks with us through the fire and that our trials produce something eternal. ${p?.christConnection || ""}`;
      if (themes.includes("kingship")) return `This verse declares the sovereignty of God. He is not a distant ruler but a King who is actively involved in His creation. His reign brings order, justice, and peace, and we are invited to live under His gracious authority. ${p?.christConnection || ""}`;
      if (themes.includes("wisdom")) return `Wisdom calls out from this verse, inviting us to see the world as God sees it. It challenges our assumptions and offers a better way — the way of truth, understanding, and reverent fear of the Lord. ${p?.christConnection || ""}`;
      if (themes.includes("obedience")) return `This verse highlights the connection between what we believe and how we live. Obedience is not legalism; it is love in action. When we truly understand God's heart, our desire to follow His commands becomes a joyful response rather than a reluctant duty. ${p?.christConnection || ""}`;
      return `This verse reveals something essential about who God is and who we are in relation to Him. It invites us to see beyond the surface and encounter the living God who speaks through His Word. ${p?.christConnection || ""}`;
    },
    () => {
      if (themes.includes("love")) return `Love — the kind that gives, serves, and sacrifices — is the centerpiece of this passage. It challenges our casual understanding of love and calls us to something deeper: a love that mirrors God's own heart. This is the love that sent Jesus to the cross and the love that now lives in everyone who belongs to Him. ${p?.christConnection || ""}`;
      if (themes.includes("grace")) return `Grace breaks through in this verse like sunlight through storm clouds. It tells us that God's goodness is not a reward for the righteous but a gift to the undeserving. Understanding this grace doesn't make us careless; it makes us grateful. And gratitude changes everything. ${p?.christConnection || ""}`;
      if (themes.includes("faith")) return `Believing is the door through which everything flows in this verse. Not a blind leap, but a reasoned trust in the God who has proven Himself faithful again and again. This passage calls us to step out of the boat, to trust the unseen, and to rest in the certainty of God's character. ${p?.christConnection || ""}`;
      if (themes.includes("life")) return `Life — real, eternal, abundant life — is the promise held out in this verse. It speaks of a quality of existence that transcends our circumstances, a life that begins now and extends forever. This is not just survival; it is flourishing in the presence of God. ${p?.christConnection || ""}`;
      if (themes.includes("power")) return `Power is on display in this verse — not the raw, forceful power of the world, but the quiet, unshakeable power of God. It is the power that created the universe, that raised Christ from the dead, and that now works in us. This verse invites us to draw on a strength greater than our own. ${p?.christConnection || ""}`;
      if (themes.includes("hope")) return `This verse is a lifeline for the weary soul. It anchors us in the reality of God's promises, giving us something to hold onto when everything else feels uncertain. Hope in God is not passive; it is an active trust that shapes how we live today. ${p?.christConnection || ""}`;
      return `This passage illuminates a truth that has the power to reshape our lives. It invites us to see God more clearly, love Him more deeply, and follow Him more faithfully. ${p?.christConnection || ""}`;
    },
  ];

  const applicationPool = [
    () => {
      if (themes.includes("love")) return `God's love is not meant to be merely studied — it is meant to be shared. Who in your life needs to experience God's love through you today? A kind word, a patient response, a sacrifice of your time. Let this verse move from your head to your hands.`;
      if (themes.includes("faith")) return `Faith grows when it is exercised. Where are you trusting your own strength instead of God's? Pick one area of your life this week where you will intentionally rely on God rather than yourself.`;
      if (themes.includes("grace")) return `You have received grace freely. Now the question is: who needs you to extend that same grace? Is there someone you need to forgive, or someone you've been withholding kindness from? Let grace flow through you.`;
      if (themes.includes("hope")) return `What feels hopeless in your life right now? Bring that situation before God and ask Him to renew your hope. Then look for one small sign of His faithfulness today.`;
      if (themes.includes("life")) return `Eternal life begins now, not after death. How would you live differently today if you truly believed that? What would you stop worrying about? What would you start pursuing?`;
      if (themes.includes("peace")) return `Peace is not the absence of chaos but the presence of Christ. What is stealing your peace today? Take it to God in prayer, and choose to trust Him with it.`;
      if (themes.includes("fear")) return `Fear loses its grip when we face it with faith. What are you afraid of? Write it down, pray over it, and remind yourself of God's faithfulness. Then take one step forward despite the fear.`;
      if (themes.includes("suffering")) return `Your pain is not pointless. Ask God to show you what He is doing in the midst of your struggle. Look for how He might be shaping your character, deepening your compassion, or drawing you closer to Him.`;
      if (themes.includes("praise")) return `Take five minutes right now to stop and worship. Not for what God has given you, but for who He is. Let praise shift your perspective from your problems to His greatness.`;
      if (themes.includes("wisdom")) return `Knowledge is knowing what to say; wisdom is knowing when and how to say it. Where do you need God's wisdom today? Ask Him, then listen for His answer through His Word and through godly counsel.`;
      if (themes.includes("obedience")) return `Is there something God has been asking you to do that you have been putting off? Obedience opens the door to blessing. Take that step today, even if it feels small.`;
      if (themes.includes("power")) return `You were not meant to live in your own strength. What challenge are you facing that feels too big for you? Good — it is the perfect opportunity to experience God's power at work in and through you.`;
      return `This verse is not just information to know; it is truth to live. What is one specific way you can respond to this passage today? Let it change how you think, speak, or act.`;
    },
    () => {
      if (themes.includes("love")) return `The measure of our love for God is the love we show to others. Before the day ends, find one concrete way to demonstrate love to someone who is difficult to love. That is the gospel in action.`;
      if (themes.includes("faith")) return `Faith without action is incomplete. What would you attempt for God if you knew He would not fail you? Take the first step toward that thing today, trusting Him with the outcome.`;
      if (themes.includes("life")) return `You have been given life — real, eternal life. Does your daily schedule reflect that? Look at your calendar and ask: am I investing my time in things that matter for eternity?`;
      return `The best response to God's Word is obedience. What is one truth from this verse that you can apply starting today? Do not just hear it — live it.`;
    },
  ];

  const prayerPool = [
    () => {
      if (themes.includes("love")) return `Father, thank You for loving us not because we are lovable, but because You are love. Help us to receive Your love fully and to extend it freely to everyone we encounter. May our lives be shaped by the love You have shown us in Christ. Amen.`;
      if (themes.includes("grace")) return `Gracious God, we stand in awe of Your mercy. You have given us what we do not deserve and withheld what we do. Let this grace transform us from the inside out, making us generous and forgiving as You have been toward us. In Jesus' name, Amen.`;
      if (themes.includes("faith")) return `Lord, we believe — help our unbelief. When doubts arise and circumstances scream otherwise, anchor us in the truth of who You are. Give us the courage to trust You even when we cannot trace You. Amen.`;
      if (themes.includes("hope")) return `God of all hope, fill our hearts with confidence in Your promises. When we are tempted to despair, remind us that You are working all things for good. Let hope rise in us like the morning sun. In Jesus' name, Amen.`;
      if (themes.includes("peace")) return `Prince of Peace, calm the storms that rage within us. Quiet our anxious hearts and settle our restless minds. Help us to rest in the knowledge that You are in control. Amen.`;
      if (themes.includes("life")) return `Father of life, thank You for the gift of eternal life through Your Son. Help us to live today in the light of eternity, investing our time and energy in what truly matters. May our lives reflect the hope we have in You. Amen.`;
      if (themes.includes("fear")) return `Lord, when fear knocks at the door of our hearts, let faith answer. Remind us that You have not given us a spirit of fear, but of power, love, and a sound mind. Help us to face today with courage because You are with us. Amen.`;
      if (themes.includes("suffering")) return `God of all comfort, be near to those who are suffering. When we walk through the valley of pain, remind us that You walk with us. Use our trials to shape us and our comfort to serve others. In Jesus' name, Amen.`;
      if (themes.includes("praise")) return `Worthy is Your name, O Lord. We praise You not just for what You have done, but for who You are. Let our lives be a continual offering of praise, pointing others to Your greatness. Amen.`;
      if (themes.includes("wisdom")) return `Lord, grant us wisdom from above — pure, peaceable, gentle, and full of mercy. Help us to see life from Your perspective and to make choices that honor You. Give us discernment for the decisions we face today. Amen.`;
      if (themes.includes("power")) return `Almighty God, we acknowledge that all power belongs to You. When we feel weak, be our strength. When we feel insufficient, be our sufficiency. Let Your power be made perfect in our weakness. Amen.`;
      return `Heavenly Father, thank You for speaking to us through Your Word. May the truth of this passage take root in our hearts and bear fruit in our lives. Help us not just to hear Your Word, but to do it. In Jesus' name, Amen.`;
    },
    () => {
      if (themes.includes("love")) return `Lord, let the love described in this verse become the defining mark of our lives. Help us to love as we have been loved — sacrificially, patiently, and without condition. Let others see Jesus in the way we love. Amen.`;
      if (themes.includes("faith")) return `Father, increase our faith. Help us to trust You not only when we see, but when we do not. Give us the confidence to step out, the patience to wait, and the peace to rest in Your will. Amen.`;
      if (themes.includes("grace")) return `Thank You, Lord, for grace that meets us where we are but does not leave us there. Let Your grace train us to say no to ungodliness and to live self-controlled, upright lives. May we never take Your grace for granted. Amen.`;
      if (themes.includes("hope")) return `Lord, anchor our souls in the hope that does not disappoint. When life feels uncertain, remind us that You are our sure foundation. Let this hope sustain us and spill over to those around us. Amen.`;
      if (themes.includes("life")) return `Thank You, Father, for the abundant life You offer. Help us to stop merely existing and start truly living — pursuing Your purposes, enjoying Your presence, and sharing Your love. In Jesus' name, Amen.`;
      return `Lord, let this verse not just inform us, but transform us. Shape our thoughts, guide our steps, and mold our hearts to be more like Yours. We ask this in the name of Jesus, our Savior and Lord. Amen.`;
    },
  ];

  const pick = (pool, ref) => {
    const variant = i % pool.length;
    return pool[variant]();
  };

  return {
    intro: pick(introPool, ref),
    lesson: pick(lessonPool, ref),
    application: pick(applicationPool, ref),
    prayer: pick(prayerPool, ref),
  };
}

export async function explainVerses(book, chapter, verse) {
  const bookName = normalizeBook(book);
  const cacheKey = `${bookName}:${chapter}:${verse}`;

  if (memCache.has(cacheKey)) return memCache.get(cacheKey);
  const cached = await cache.get("ai", cacheKey);
  if (cached) {
    memCache.set(cacheKey, cached);
    return cached;
  }

  const ref = `${bookName} ${chapter}:${verse}`;

  const [verseRow, prologue, dailyExegesis, verseExplanation, verseResource] = await Promise.all([
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
      where: {
        bookName_chapter_verseNumber: { bookName, chapter, verseNumber: verse },
      },
      select: { explanation: true, learnMore: true },
    }),
    prisma.verseResource.findFirst({
      where: { bookName, chapter, verseStart: { lte: verse }, OR: [{ verseEnd: null }, { verseEnd: { gte: verse } }] },
      select: { commentaries: true, crossReferences: true, wordStudies: true },
    }),
  ]);

  const verseText = verseRow?.verseText || "";
  const result = { ref, text: verseText };

  if (dailyExegesis) {
    result.intro = dailyExegesis.introduction || dailyExegesis.contextSummary || `A passage from ${ref}.`;
    result.lesson = dailyExegesis.teachingBody;
    result.application = dailyExegesis.application || `Reflect on ${ref} and let its truth shape your life.`;
    result.prayer = dailyExegesis.prayer || `Lord, thank You for the truth of ${ref}. Amen.`;
  } else if (verseExplanation?.explanation) {
    result.intro = `${ref} carries profound meaning within the biblical narrative.`;
    result.lesson = verseExplanation.explanation;
    result.application = verseExplanation.learnMore
      ? `For deeper study: ${verseExplanation.learnMore}`
      : `Let the truth of ${ref} shape your heart and actions today.`;
    result.prayer = `Lord, thank You for the profound truth of ${ref}. Help us to understand it deeply and live it faithfully. In Jesus' name, Amen.`;
  } else {
    let extra = "";
    if (verseResource?.commentaries) {
      try { const c = JSON.parse(verseResource.commentaries); if (c[0]?.text) extra = c[0].text.slice(0, 300); } catch {}
    }
    Object.assign(result, buildFromVerse(ref, verseText, prologue));
    if (extra) result.lesson = extra + "\n\n" + result.lesson;
  }

  memCache.set(cacheKey, result);
  await cache.set("ai", cacheKey, result, CACHE_TTL);
  return result;
}
