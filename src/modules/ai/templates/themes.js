// ─────────────────────────────────────────────────────────────────────────────
// Theme data for the AI template engine.
// The engine detects up to two themes per passage; every theme below has a
// matching lesson, application, prayer, description, contrast, and question so
// the generated answers stay specific to what the passage is actually about.
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_CHECKS = {
  love: /\b(love|loved|loving|charity)\b/gi,
  faith: /\b(faith|believe|believed|believing)\b/gi,
  life: /\b(life|live|living|save|salvation|eternal|savior)\b/gi,
  light: /\b(light|darkness|dark|shine|radiance)\b/gi,
  judgment: /\b(sin(?![\s-]+offering)|sinner|judgment|condemn|condemned|wrath|judge)\b/gi,
  hope: /\b(hope|hoped|promise|promised|covenant)\b/gi,
  grace: /\b(grace|gracious|mercy|merciful|forgive|forgiveness|redemption|redeem)\b/gi,
  power: /\b(power|mighty|authority|strength|kingdom)\b/gi,
  peace: /\b(peace|peaceful|rest|comfort|comforted)\b/gi,
  fear: /\b(fear|afraid|anxious|worry)\b/gi,
  obedience: /\b(obey|obedience|command|commandment|keep|law|statute)\b/gi,
  warning: /\b(warn|warning|woe|beware|repent|repentance)\b/gi,
  praise: /\b(rejoice|praise|thank|thanksgiving|sing|song|glory|glorify)\b/gi,
  suffering: /\b(suffer|suffering|pain|trouble|tribulation|affliction|persecute)\b/gi,
  healing: /\b(heal|healed|healing|health|whole|restore|restored)\b/gi,
  death: /\b(death|die|dead|grave|perish|destroy|destruction)\b/gi,
  kingship: /\b(king|kingdom|reign|throne|ruler|lord)\b/gi,
  wisdom: /\b(wisdom|wise|understanding|knowledge|truth|instruct|teach|teacher)\b/gi,
  blessing: /\b(blessed|blessing|bless|inherit|inheritance)\b/gi,
  providence: /\b(providence|providential|sovereign|sovereignty|orchestrate|orchestrated|orchestrating|appointed|prepared|foreordained|predestined|guided|guidance|directed|directs|provide|provided|provides|provision|work together|works together|meant it for good|intended it for good|for such a time as this|trust|trusted|trusting|rely|relied|relies|confidence|depend|depends|redeemer|chosen|purpose|went before|made a way)\b/gi,
  justice: /\b(justice|justly|righteous|righteousness|upright|uprightness|integrity|impartial|equity|oppress|oppressed|injustice|unjust)\b/gi,
  humility: /\b(humble|humility|humbly|meek|meekness|meekly|lowly|lowliness|gentle|gentleness|contrite)\b/gi,
  holiness: /\b(holy|holiness|sanctify|sanctified|sanctification|sanctuary|pure|purity|purify|consecrate|consecrated|set apart|unclean)\b/gi,
  unity: /\b(unity|united|unite|one accord|one heart|one mind|fellowship|brotherly|harmony|togetherness)\b/gi,
  joy: /\b(joy|joyful|joyfully|glad|gladness|rejoice|rejoiced|delight|delighted|delights)\b/gi,
};

/**
 * Anchor words that carry the weight of a theme. When one of these appears,
 * the theme scores double — so a single "blessed" in the Beatitudes outweighs
 * incidental overlaps (e.g. "kingdom" matching both power and kingship), and
 * the detected themes stay true to what the passage is actually about.
 */
export const THEME_ANCHORS = {
  love: ["love", "loved", "loving", "charity"],
  faith: ["faith", "believe", "believed", "believing"],
  life: ["life", "live", "living", "save", "salvation", "eternal", "savior"],
  light: ["light", "darkness", "dark", "shine", "radiance"],
  judgment: ["sin", "sinner", "judgment", "condemn", "condemned", "wrath", "judge"],
  hope: ["hope", "hoped", "promise", "promised", "covenant"],
  grace: ["grace", "gracious", "mercy", "merciful", "forgive", "forgiveness", "redemption", "redeem"],
  power: ["power", "mighty", "authority", "strength"],
  peace: ["peace", "peaceful", "rest", "comfort", "comforted"],
  fear: ["fear", "afraid", "anxious", "worry"],
  obedience: ["obey", "obedience", "command", "commandment", "keep", "law", "statute"],
  warning: ["warn", "warning", "woe", "beware", "repent", "repentance"],
  praise: ["rejoice", "praise", "thank", "thanksgiving", "sing", "song", "glory", "glorify"],
  suffering: ["suffer", "suffering", "pain", "trouble", "tribulation", "affliction", "persecute"],
  healing: ["heal", "healed", "healing", "health", "whole", "restore", "restored"],
  death: ["death", "die", "dead", "grave", "perish", "destroy", "destruction"],
  // "lord"/"LORD" stays in the kingship REGEX (it is a kingly title) but is
  // NOT an anchor: it appears generically in most books, and doubling it made
  // kingship dominate narrative passages (e.g. Psalms, Ruth) that mention the
  // LORD without being about kingship.
  kingship: ["king", "kingdom", "reign", "throne", "ruler"],
  wisdom: ["wisdom", "wise", "understanding", "knowledge", "truth", "instruct", "teach", "teacher"],
  blessing: ["blessed", "blessing", "bless", "inherit", "inheritance"],
  providence: ["providence", "providential", "sovereign", "sovereignty", "orchestrate", "orchestrated", "orchestrating", "appointed", "prepared", "foreordained", "predestined", "guided", "guidance", "directed", "directs", "provide", "provided", "provides", "provision", "work together", "works together", "meant it for good", "intended it for good", "for such a time as this", "trust", "trusted", "trusting", "rely", "relied", "relies", "confidence", "depend", "depends", "redeemer", "chosen", "purpose", "went before", "made a way"],
  justice: ["justice", "justly", "righteous", "righteousness", "upright", "uprightness", "integrity", "impartial", "equity", "oppressed", "injustice"],
  humility: ["humble", "humility", "humbly", "meek", "meekness", "meekly", "lowly", "lowliness", "gentle", "gentleness", "contrite"],
  holiness: ["holy", "holiness", "sanctify", "sanctified", "sanctification", "pure", "purity", "purify", "consecrate", "consecrated", "set apart", "unclean"],
  unity: ["unity", "united", "unite", "one accord", "one heart", "one mind", "fellowship", "brotherly", "harmony"],
  joy: ["joy", "joyful", "joyfully", "glad", "gladness", "rejoice", "rejoiced", "delight", "delighted", "delights"],
};

export function detectThemes(text) {
  const scores = {};
  for (const [theme, regex] of Object.entries(THEME_CHECKS)) {
    const matches = text.match(regex);
    if (!matches) continue;
    const anchors = THEME_ANCHORS[theme] || [];
    scores[theme] = matches.reduce(
      (sum, m) => sum + (anchors.includes(m.toLowerCase()) ? 2 : 1),
      0
    );
  }
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);
}

// ── Explain lessons (used by buildLesson) ───────────────────────────────────

export const THEME_LESSONS = {
  love: `At the heart of this verse is love — not the fragile, conditional love the world offers, but the steadfast, self-giving love that defines God Himself. The phrase "{{keyClause}}" reveals the very heart of the gospel: God did not wait for us to earn His love; He took the initiative, giving His best while we were still undeserving. This transforms how we understand everything — our purpose, our relationships, and our eternal destiny. {{christConn}}`,
  grace: `Here we encounter grace — not as a doctrine to be studied, but as a reality to be received. Grace means God's goodness is not a reward for the righteous but a gift to the undeserving. The words "{{keyClause}}" capture this stunning truth. This is the scandal of the gospel: we don't climb up to God; He comes down to us. And this grace doesn't make us careless — it makes us grateful. And gratitude changes everything. {{christConn}}`,
  faith: `Faith — the confident trust in God and His Word — runs through this passage like a golden thread. "{{keyClause}}" — this is the language of trust, the response that opens the door to all God has for us. It calls us to move from what we can see to what we know is true, from the shifting sands of our feelings to the solid rock of God's character. {{christConn}}`,
  life: `Life — not mere existence, but the abundant, eternal life that flows from God Himself. "{{keyClause}}" — these words pulse with the promise of a life that transcends our circumstances. This is the heartbeat of the gospel: death defeated, life unleashed, hope secured. The life God offers begins now, not after death, and it changes everything about how we live today. {{christConn}}`,
  hope: `Hope rises from this verse like dawn after a long night. "{{keyClause}}" — this is not wishful thinking; it is the confident expectation that God will do what He has promised. Hope anchors us in the certainty of God's character, giving us strength to endure and courage to press on. It is the lifeline for the weary soul. {{christConn}}`,
  peace: `Peace flows through this verse — not the absence of trouble, but the deep, settled confidence that comes from knowing who God is. "{{keyClause}}" — this is where peace finds its grounding. It speaks to the restless heart, offering rest for the weary soul and stillness for the anxious mind. {{christConn}}`,
  judgment: `This verse confronts us with the weight of our choices and the holiness of God. "{{keyClause}}" — these words remind us that our actions have eternal significance. Yet even in the sobering reality of judgment, the thread of grace runs through: God's warnings are not meant to frighten us but to protect us. He warns because He loves. {{christConn}}`,
  fear: `This verse speaks directly into our fears. "{{keyClause}}" — here is the antidote to the anxiety that so often grips our hearts. Fear loses its power when we know who holds the future. The presence of God doesn't mean the absence of danger, but it does mean the presence of peace in the midst of it. {{christConn}}`,
  suffering: `Suffering is not meaningless, and this verse helps us see why. "{{keyClause}}" — in these words we find a framework for understanding our pain. It reframes our trials in light of God's greater purposes, reminding us that He walks with us through the fire and that our afflictions are producing something eternal — a weight of glory beyond all comparison. {{christConn}}`,
  praise: `This verse erupts with praise, calling us to lift our eyes from our circumstances to the God who is worthy. "{{keyClause}}" — this is the language of worship, the response of a heart overwhelmed by God's goodness. Worship is not just something we do; it is who we were made to be — a response to the greatness of our God. {{christConn}}`,
  power: `Power — not the brute force of the world, but the quiet, unshakeable power of God — is on display here. "{{keyClause}}" — this is the power that created galaxies, that raised Christ from the dead, and that now works in us. We were never meant to live in our own strength. This verse invites us to draw on a power greater than ourselves. {{christConn}}`,
  wisdom: `Wisdom calls out from this verse, inviting us to see the world as God sees it. "{{keyClause}}" — this is the voice of true understanding. It challenges our assumptions and offers a better way — the way of truth, understanding, and the fear of the Lord, which is the beginning of all wisdom. {{christConn}}`,
  kingship: `This verse declares the sovereignty of God — not a distant, indifferent ruler, but a King who is intimately involved in His creation. "{{keyClause}}" — this is the language of His reign. His kingdom brings order, justice, and peace, and we are invited to live under His gracious authority. {{christConn}}`,
  healing: `Healing flows through this verse like a river of life. "{{keyClause}}" — these words carry the promise of restoration. God is not distant from our pain; He is the one who mends what is broken, restores what is lost, and makes whole what has been shattered. {{christConn}}`,
  death: `This verse speaks directly to the reality that none of us can escape — death. "{{keyClause}}" — here we find the only real answer to the grave's finality. But the gospel does not leave us in the tomb. It announces that death has been defeated, that the grave could not hold Him, and that because He lives, we too shall live. {{christConn}}`,
  obedience: `This verse highlights the unbreakable connection between what we believe and how we live. "{{keyClause}}" — this is the call to a faith that works through love. Obedience is not legalism; it is love in action. When we truly understand God's heart, His commands cease to be burdens and become the path to freedom. {{christConn}}`,
  warning: `This verse comes as a wake-up call, urging us to take our spiritual lives seriously. "{{keyClause}}" — these words are a gift, meant to protect us from harm. Warnings are not meant to frighten us; they are the voice of love crying out, "There is danger ahead — turn back." {{christConn}}`,
  blessing: `Blessing lies at the heart of this verse — not the world's fragile luck, but the settled favor of God poured out on His people. "{{keyClause}}" — this is what a life under God's blessing actually looks like: not exemption from hardship, but the presence and promise of the One who blesses. It is a gift to receive, not a prize to earn, and it is meant to be passed on — we are blessed to be a blessing. {{christConn}}`,
  providence: `Providence runs through this verse like a quiet current — the unseen hand of God ordering people, timing, and circumstances toward His purposes. "{{keyClause}}" — this is not the world's blind chance, but the careful work of a Father who is never late and never caught off guard. He works through ordinary days, ordinary people, and even ordinary mistakes to accomplish what He has planned. The response providence calls for is trust: to rest in the One who sees the end from the beginning, even when we only see the next step. {{christConn}}`,
  light: `Light and darkness — this verse sets them before us as the two paths that lie before every human soul. "{{keyClause}}" — this is the call to walk in the light. Light exposes what is hidden and guides the steps of those who follow it. And the Light of the World has come. {{christConn}}`,
  justice: `Righteousness and justice stand at the center of this verse — not as cold abstractions, but as the very character of God in action. "{{keyClause}}" — this is the language of a God who cannot look away from wrong, and who moves heaven and earth to make things right. His justice is never cruel and His mercy is never careless; in Christ, both meet. And because we belong to Him, we are invited to become people who love what He loves and pursue what He pursues. {{christConn}}`,
  humility: `Humility lies at the heart of this verse — not self-diminishment, but the honest recognition of who God is and who we are. "{{keyClause}}" — this is the posture that makes room for grace. Pride builds walls; humility opens doors. The way up in God's kingdom is always the way down, and the One who is gentle and lowly in heart calls us to walk that road with Him. {{christConn}}`,
  holiness: `Holiness is the theme that rises from this verse — not a list of rules, but the radiant otherness of God set before us. "{{keyClause}}" — these words call us to be set apart, not because we are better, but because we have been bought. Holiness is less about avoiding dirt and more about belonging to a holy God; it is the atmosphere of heaven beginning to take hold of earth. {{christConn}}`,
  unity: `Unity runs through this verse like a quiet refrain — the people of God bound together as one. "{{keyClause}}" — this is not the sameness of conformity but the harmony of many parts under one Head. When brothers and sisters dwell together in unity, something of heaven is made visible on earth, and the world takes notice. {{christConn}}`,
  joy: `Joy pulses through this verse — not the fleeting happiness of good circumstances, but the deep gladness that flows from knowing God. "{{keyClause}}" — this is joy that survives sorrow, that sings in the dark, that is rooted not in what we have but in whose we are. It is a fruit of the Spirit and a foretaste of heaven. {{christConn}}`,
};

export const DEFAULT_LESSON =
  "This verse reveals something essential about who God is and who we are in relation to Him. It invites us to see beyond the surface of our circumstances and encounter the living God who speaks through His Word.";

// ── Applications (used by buildApplication) ─────────────────────────────────

export const THEME_APPLICATIONS = {
  love: [
    `God's love is not meant to be merely admired — it is meant to be channeled. Who in your life needs to experience God's love through you today? Perhaps a patient word, a generous gesture, or the gift of your undivided attention. "{{keyClause}}" — this is the kind of love you are called to extend. Let this verse move from your head to your hands.`,
    `The measure of our love for God is the love we show to others. Before this day ends, find one concrete way to demonstrate love to someone who is difficult to love. That is the gospel in action. The love described here — "{{keyClause}}" — is now the love you are called to live.`,
    `Love is not a feeling to wait for; it is a choice to make. Think of one person you encounter regularly who tries your patience. Now pray for them — and look for an opportunity this week to serve them.`,
  ],
  faith: [
    `Faith grows when it is exercised like a muscle. Where are you trusting your own understanding instead of God's faithfulness? This week, identify one area where you will intentionally rely on God rather than yourself. Let "{{opener}}" be the starting point of your trust.`,
    `Faith without action is incomplete. What would you attempt for God if you knew He would not fail you? Take the first step toward that thing today, trusting Him with the outcome.`,
    `Believing is not a one-time event; it is a daily decision. What circumstance is challenging your faith right now? Bring it before God and ask Him to strengthen your trust in Him.`,
  ],
  grace: [
    `You have received grace freely — not because you earned it, but because God is gracious. Now the question that demands an answer: who needs to receive that same grace from you? Is there someone you need to forgive, or someone you have been withholding kindness from? Let grace flow through you as freely as it has been given to you.`,
    `Grace received must become grace extended. Think of the person who has wronged you most recently. Now imagine extending to them the same undeserved favor God has shown you. That is the hard work of grace — and it is the work of the gospel.`,
    `The grace that saved you is also the grace that sustains you. Stop striving to earn what has already been given. Rest in the finished work of Christ, and let that rest overflow into peace with others.`,
  ],
  hope: [
    `What feels hopeless in your life right now? Name it honestly before God. Then ask Him to renew your hope — not by changing your circumstances, but by reminding you of His faithfulness. "{{keyClause}}" — hold onto this promise today.`,
    `Hope is not optimism; it is certainty anchored in God's character. What situation has been stealing your hope? Bring it before God and ask Him to show you where He is at work, even when you cannot see it.`,
    `When hope feels distant, go back to what you know to be true about God. Write down three promises He has kept in your life. Let the past faithfulness of God fuel your hope for the future.`,
  ],
  life: [
    `Eternal life begins now, not after death. How would you live differently today if you truly believed that? Look at your calendar, your worries, your ambitions — do they reflect a life that will outlast the grave? "{{opener}}" — these words call you to live in light of eternity.`,
    `You have been given real, eternal life. Does your daily schedule reflect that? Take an honest look at how you spend your time and ask: am I investing in what will last forever?`,
    `The life God gives is not just for the future — it is for today. What would it look like for you to live abundantly right now, in your current circumstances?`,
  ],
  peace: [
    `Peace is not the absence of chaos but the presence of Christ. What is stealing your peace today? Take it to God in prayer, and choose to trust Him with it. "{{keyClause}}" — let this truth settle your heart.`,
    `You cannot control everything, but you can trust the One who does. Identify one source of anxiety in your life and deliberately release it to God. Then refuse to pick it back up.`,
    `Peace is a gift that must be guarded. What habits — the late-night scroll, the replay of an old offense, the habit of comparison — are eroding your peace? Name one and replace it this week with a practice of gratitude and rest in God's presence.`,
  ],
  judgment: [
    `God's warnings are invitations, not rejections. Is there an area of your life where you have been living as if your choices don't matter? Bring it into the light today, confess it, and receive the grace He offers.`,
    `The holiness of God calls for honesty. What sin have you been excusing that the Spirit has been gently exposing? Name it before God and let His grace meet you there.`,
    `Because judgment is real, so is urgency. Is there a relationship you have left broken, an apology you have left unspoken, or a habit you have left unchallenged? Do today what you would want done before tomorrow.`,
  ],
  fear: [
    `Fear loses its grip when we face it with faith. What are you afraid of? Write it down, pray over it, and remind yourself of God's faithfulness. Then take one step forward despite the fear. "{{opener}}" — these words are stronger than your fear.`,
    `Name your fear out loud. Once it is spoken, it loses much of its power. Then remind yourself of this truth: the One who is for you is greater than everything against you.`,
    `Fear narrows our world to the size of our worries; faith widens it to the size of God. What would you attempt this year if fear were not in the driver's seat? Write it down — and take the first small step today.`,
  ],
  suffering: [
    `Your pain is not pointless. Ask God to show you what He is doing in the midst of your struggle. Look for how He might be shaping your character, deepening your compassion, or drawing you closer to Him. "{{keyClause}}" — hold onto this promise in the pain.`,
    `Suffering can either make us bitter or make us better. The difference is not our circumstances but our response. Choose today to trust that God is working in your trial, even when you cannot see it.`,
    `Suffering grows compassion when we let it. Who else is walking through what you have walked through? Reach out this week — a message, a meal, a listening ear. The comfort you received is meant to be passed on.`,
  ],
  praise: [
    `Take five minutes right now to stop and worship. Not for what God has given you, but for who He is. Let praise shift your perspective from your problems to His greatness.`,
    `Gratitude is the gateway to joy. Before the day ends, write down five things you are thankful for — and let thankfulness lead you into worship.`,
    `Praise is most powerful when it costs something. When life is hard and you least feel like worshiping, sing anyway — even a whispered 'You are good.' That is the sacrifice of praise, and God inhabits it.`,
  ],
  wisdom: [
    `Knowledge is knowing what to say; wisdom is knowing when and how to say it. Where do you need God's wisdom today? Ask Him, then listen for His answer through His Word and through godly counsel. "{{keyClause}}" — let this guide your decision.`,
    `The fear of the Lord is the beginning of wisdom. Before making your next important decision, pause and ask: what does it mean to honor God in this choice?`,
    `Wisdom is learned at the feet of the wise. Who in your life models godly discernment? Invite them for coffee this month and come prepared with real questions — the right counsel is a crown to the wise.`,
  ],
  obedience: [
    `Is there something God has been asking you to do that you have been putting off? Obedience opens the door to blessing. Take that step today, even if it feels small. "{{opener}}" — let these words move you to action.`,
    `Obedience is not about perfection; it is about direction. What is one step of obedience God is calling you to take today? Do not wait for the perfect moment — step out now.`,
    `Obedience often begins where understanding ends. God rarely explains everything before He asks anything. What has He asked of you that does not fully make sense yet? Trust His character and take the step — clarity usually follows obedience, not the other way around.`,
  ],
  power: [
    `You were not meant to live in your own strength. What challenge are you facing that feels too big for you? Good — it is the perfect opportunity to experience God's power at work in and through you. "{{opener}}" — draw on this power today.`,
    `God's power is made perfect in weakness. What weakness are you trying to hide or overcome on your own? Surrender it to Him and watch what He can do through your yieldedness.`,
    `Power is not for show; it is for service. God's strength in you is meant to overflow as help for others. Who needs someone strong to stand beside them this week — a young believer, a weary friend, a struggling neighbor? Be that strength for them.`,
  ],
  kingship: [
    `God is sovereign over every situation you face. What circumstance has been causing you anxiety? Remind yourself that the King of Kings is on the throne, and nothing happens apart from His permission. "{{keyClause}}" — let this truth settle your heart.`,
    `If Jesus is Lord, then He is Lord of your schedule, your relationships, your finances, and your future. Is there an area of your life where you have not yet surrendered to His authority?`,
    `Citizens of the kingdom live by a different set of rules than the kingdoms of this world — the first shall be last, and greatness is measured by servanthood. Where has the world's ladder been determining your decisions? Invite the King back onto that throne today.`,
  ],
  healing: [
    `God is in the business of restoration. What is broken in your life — a relationship, a dream, your health? Bring it before the Healer and trust Him to do what only He can do. "{{keyClause}}" — this is His promise to you.`,
    `Healing often comes gradually, and it often comes through community. Who can you invite into your journey of restoration? Do not walk this road alone.`,
    `Healing sometimes means receiving help. If God has placed people around you who offer care — a counselor, a pastor, a trusted friend — receiving their help is not weakness; it is wisdom. Who has God put in your corner? Reach out this week.`,
  ],
  death: [
    `Death is not the end — it is the beginning. How would you live differently today if you truly believed that eternity awaits? Let the reality of the resurrection shape your priorities and quiet your fears. "{{keyClause}}" — let these words echo in your heart.`,
    `Because Christ conquered the grave, we can face our own mortality with hope. Is there anything you would change about how you are living if you knew your time was short?`,
    `The hope of resurrection changes how we grieve — we do not grieve as those without hope. Who around you is mourning right now? Your steady, hopeful presence — not your perfect words — is one of the greatest gifts you can give.`,
  ],
  warning: [
    `A warning is a gift. Is there an area of your life where you have been ignoring the warning signs? Take a moment to examine your heart and ask God to show you what needs to change. "{{opener}}" — let these words speak to you.`,
    `God's warnings are not meant to restrict your joy but to protect it. Where have you been pushing against healthy boundaries? Invite God to realign your path.`,
    `Warnings lose their power when they are ignored repeatedly. If you keep sensing the same gentle alarm — about a habit, a relationship, a compromise — do not wait for the volume to increase. Address it while it is still small.`,
  ],
  blessing: [
    `You have been blessed — not because you earned it, but because God is good. Now the question: who are you meant to bless in return? The pattern of Scripture is that blessing always travels — from God to you, and from you to someone else. Before this day ends, find one concrete way to be a blessing: a kind word, a generous act, a patient ear. "{{keyClause}}" — this is the blessed life put into motion.`,
    `Blessing is a gift to receive, not a status to guard. Take a moment to count three ways God has blessed you that you've stopped noticing. Then thank Him for them — gratitude is how a blessed heart stays soft instead of entitled.`,
    `The blessed life is marked by humility, hunger for God, and mercy toward others — not by comfort or ease. Where is God inviting you to grow in one of those? Pick one and take a small step today.`,
  ],
  providence: [
    `Nothing in your life is accidental. Where have you assumed God wasn't at work — a closed door, a delay, an unexpected meeting? Look back and name one moment you once called luck but now recognize as providence. Thank God for it, and let it grow your trust for what He is arranging right now. "{{keyClause}}" — this is the promise you can rest on.`,
    `Trust is the posture providence calls for. What are you trying to orchestrate yourself that God has already promised to arrange? Identify one area — a decision, a relationship, a worry — and deliberately hand it to Him this week. Trust is not passivity; it is active dependence on a faithful God.`,
    `God often works through ordinary people and ordinary days. Who in your life might you be part of God's provision for — a word of encouragement, practical help, a door you can open? Be the answer to someone's prayer today; that is what being used by providence looks like.`,
  ],
  light: [
    `You are called to walk in the light — and to be light for others. What darkness have you been hiding? Bring it into the light of God's presence, and let His forgiveness set you free. "{{keyClause}}" — this is your calling today.`,
    `The light shines in the darkness, and the darkness has not overcome it. What dark situation in your life needs the light of God's truth? Let His Word illuminate your path.`,
    `Light reveals and light guides. Is there an area of your life where you have been content with shadows — a half-truth, a hidden struggle, a secret compromise? Step fully into the light this week; it is the safest place to live.`,
  ],
  justice: [
    `Righteousness is not just admired; it is to be practiced. Is there an injustice in your circle — a person treated unfairly, a voice ignored, a wrong left unaddressed? What is one small way you can be part of making it right? "{{keyClause}}" — this is the call to live justly.`,
    `God is the judge of all the earth, and He does right. Where have you been carrying resentment about an injustice done to you? Release it to the One who sees all and will settle every account — then ask Him what faithful living looks like in the meantime.`,
    `Righteousness begins at home. Before you look at the systems around you, look at your own life: your words, your business dealings, your treatment of the powerless. Where is God calling you to be more upright this week?`,
  ],
  humility: [
    `Humility is the posture that receives grace. Where have you been striving to prove yourself — to God, to others, to yourself? Lay the striving down and receive what He freely gives. "{{keyClause}}" — this is the humble way.`,
    `The humble heart asks for help. What are you trying to carry alone that you were never meant to carry? Admit it — to God in prayer and to one trusted person — and let the walls of self-sufficiency come down.`,
    `Humility looks like preferring others. This week, find a quiet way to serve someone with no recognition attached — wash the dishes, send the encouraging note, give up the credit. The Father who sees in secret sees it.`,
  ],
  holiness: [
    `Holiness is not a list; it is a belonging. You have been set apart for God — not to be better than others, but to be wholly His. What in your life blurs that line? Invite Him to cleanse it. "{{keyClause}}" — this is your calling.`,
    `Being set apart means being available. Is there something God is asking you to consecrate — a talent, a relationship, a resource, a season? Lay it on the altar this week and watch what He does with it.`,
    `Purity is a daily choice, not a one-time decision. What small compromises have been quietly eroding your walk with God? Name one, confess it, and put a healthy boundary in its place today.`,
  ],
  unity: [
    `Unity requires intentionality. Is there a relationship — in your family, church, or workplace — where division has crept in? Take the first step toward peace this week, even if the other person never does. "{{keyClause}}" — this is what dwelling together looks like.`,
    `We belong to one another. Who around you is isolated or unseen? Pull them in — an invitation to the table, a phone call, a seat beside you. Unity is built one small welcome at a time.`,
    `Unity does not mean uniformity. Celebrate the difference God has placed beside you — the gift, the perspective, the personality that stretches you. Thank God for one person who is unlike you and pray for them this week.`,
  ],
  joy: [
    `Joy is deeper than happiness — it is rooted in who God is, not what happens to you. What has been stealing your joy? Bring it honestly before the Lord and let Him restore the gladness of His salvation. "{{keyClause}}" — let this truth rekindle your delight.`,
    `Rejoicing is a discipline before it is a feeling. Even when your emotions lag behind, choose gratitude: name three gifts of today out loud. Joy often follows the choice to give thanks.`,
    `Joy is contagious. Who needs your joy this week — the discouraged coworker, the grieving friend, the restless child? Let the gladness God gives you spill over onto them.`,
  ],
};

export const DEFAULT_APPS = [
  `This verse is not merely information to know — it is truth to live. What is one specific way you can respond to this passage before the day ends? Let it change how you think, speak, or act.`,
  `The best response to God's Word is obedience. What is one truth from this verse that you can apply starting today? Do not merely hear it — live it out.`,
  `God's Word is meant to be done, not just discussed. What is one concrete action you can take in response to what you have just read? Make it specific, measurable, and immediate.`,
];

// ── Prayers (used by buildPrayer) ───────────────────────────────────────────

export const THEME_PRAYERS = {
  love: [
    `Father, thank You for loving us not because we are lovable, but because You are love. Help us to receive Your love fully — to stop striving and simply rest in it. And then empower us to extend that same love to everyone we encounter. May "{{keyClause}}" become the rhythm of our lives. In Jesus' name, Amen.`,
    `Lord, let the love described in this verse become the defining mark of our lives. Help us to love as we have been loved — sacrificially, patiently, without condition. Let others see Jesus in the way we love one another. Amen.`,
    `Father, we confess that our love runs thin. Where we have grown cold, rekindle us; where we have withheld grace, soften us. Make our love specific today — put one person on our hearts whom You are calling us to serve, and give us the courage to act. Amen.`,
  ],
  grace: [
    `Gracious God, we stand in awe of Your mercy. You have given us what we do not deserve and withheld what we do. Let this grace transform us from the inside out — making us as generous and forgiving toward others as You have been toward us. "{{opener}}" — may these words shape our hearts. Amen.`,
    `Thank You, Lord, for grace that meets us where we are but refuses to leave us there. Train us by Your grace to say no to ungodliness and to live self-controlled, upright lives. May we never take such love for granted. Amen.`,
    `Father, where we have been slow to forgive, forgive us — and give us the grace to release the one we have been holding. You forgave us everything; help us to forgive the small and the great alike, as an act of worship. Amen.`,
  ],
  faith: [
    `Lord, we believe — help our unbelief. When doubts rise and circumstances scream otherwise, anchor us in the truth of who You are. Give us the courage to trust You even when we cannot trace You. Let "{{keyClause}}" be our confession today. Amen.`,
    `Father, increase our faith. Help us to trust You not only when we see, but when we do not see. Give us the confidence to step out, the patience to wait, and the peace to rest in Your will. Amen.`,
    `Lord, we hand You the thing we have been trying to control — the outcome, the relationship, the future. We believe, help our unbelief, and give us the joy of watching You work while we simply follow. Amen.`,
  ],
  hope: [
    `God of hope, fill our hearts with confidence in Your promises. When we are tempted to despair, remind us that You are working all things for our good. Let hope rise in us like the morning sun, dispelling the darkness of doubt. "{{opener}}" — anchor us in this truth. Amen.`,
    `Lord, anchor our souls in the hope that does not disappoint. When life feels uncertain, remind us that You are our sure foundation. Let this hope sustain us and spill over to everyone around us. Amen.`,
    `Father, where our hope has grown weary, renew it. Remind us of the promises You have already kept, and let them become the evidence we stand on for the ones still waiting. You are faithful. Amen.`,
  ],
  life: [
    `Father of life, thank You for the gift of eternal life through Your Son. Help us to live today in the light of eternity, investing our time and energy in what truly matters. "{{opener}}" — let these words shape our priorities. May our lives reflect the hope we have in You. Amen.`,
    `Thank You, Father, for the abundant life You offer — life that begins now and extends forever. Help us to stop merely existing and start truly living: pursuing Your purposes, enjoying Your presence, and sharing Your love. In Jesus' name, Amen.`,
    `Lord, teach us to number our days and gain a heart of wisdom. Where we are wasting what You have given, redirect us; where we are hoarding it, loosen our grip — for we live for a kingdom that will not end. Amen.`,
  ],
  peace: [
    `Prince of Peace, calm the storms that rage within us. Quiet our anxious hearts and settle our restless minds. Help us to rest in the knowledge that You are in control, even when our world feels out of control. "{{keyClause}}" — let this be our peace today. Amen.`,
    `Lord, in a world of chaos, You are our peace. Teach us to cast our anxieties on You, to breathe in Your presence, and to trust You with what we cannot control. Amen.`,
    `Father, we lay before You every racing thought and sleepless worry. Exchange our anxiety for Your peace that passes understanding, and guard our hearts and minds in Christ Jesus tonight. Amen.`,
  ],
  judgment: [
    `Holy God, search our hearts. Where we have sinned, forgive us. Where we have drifted, draw us back. Thank You that Your judgment is never the final word — Your mercy triumphs, because Christ took our place. Amen.`,
    `Father, thank You for the cross. Because Jesus bore the judgment we deserved, we can approach You without fear. Help us to live as forgiven people — honest about sin, quick to repent, and slow to condemn others. Amen.`,
    `Lord, give us the honesty to examine our lives without self-deception and the humility to change what we find. Thank You that conviction is not condemnation — it is the voice of Your love calling us home. Amen.`,
  ],
  fear: [
    `Lord, when fear knocks at the door of our hearts, let faith answer. Remind us that You have not given us a spirit of fear, but of power, love, and a sound mind. "{{opener}}" — let these words silence our fears. Help us to face today with courage because You are with us. Amen.`,
    `Father, we give You our fears — every what-if and worst-case scenario. Replace our anxiety with Your peace, our worry with worship, our fear with faith. You are bigger than anything we face. Amen.`,
    `Lord, You are with us in the valley and on the mountain. When our minds rehearse every disaster, interrupt those thoughts with the truth of who You are. We are not alone, and we will not be overwhelmed. Amen.`,
  ],
  suffering: [
    `God of all comfort, be near to those who are suffering. When we walk through the valley of pain, remind us that You walk with us — not distant, not detached, but present. Use our trials to shape us and the comfort we receive to serve others. "{{keyClause}}" — hold us to this promise. Amen.`,
    `Lord, when pain feels pointless, help us to trust Your purposes. Give us grace to endure, eyes to see what You are doing, and strength to persevere. Let our suffering produce perseverance, character, and hope. Amen.`,
    `Father, we do not understand all Your ways, but we trust Your heart. Sustain us through this season, give us strength for today, and use our story of comfort to become someone else's hope. Amen.`,
  ],
  praise: [
    `Worthy is Your name, O Lord. We praise You not just for what You have done, but for who You are. Let our lives be a continual offering of praise, pointing others to Your greatness. "{{opener}}" — let this be our song. Amen.`,
    `Lord, tune our hearts to sing Your praise. When we are distracted by our problems, lift our eyes to Your throne. You are worthy of all honor, all glory, all praise — now and forever. Amen.`,
    `Father, even when our circumstances are hard, You remain good. Teach us to praise You in the storm — not pretending the pain is absent, but declaring that You are greater than it. Let thanksgiving be our sacrifice. Amen.`,
  ],
  power: [
    `Almighty God, we acknowledge that all power belongs to You. When we feel weak, be our strength. When we feel insufficient, be our sufficiency. Let Your power be made perfect in our weakness, so that the world may see that our strength comes from You. "{{opener}}" — let this truth empower us today. Amen.`,
    `Lord, we confess that we often try to live in our own strength. Teach us to depend on You, to draw from Your power, and to boast only in what You have done. Your power is made perfect in our weakness. Amen.`,
    `Father, we stop striving and surrender. Work in us both to will and to do Your good pleasure, and let the power of Your Spirit be evident in our ordinary obedience today. Amen.`,
  ],
  wisdom: [
    `Lord, grant us wisdom from above — pure, peaceable, gentle, and full of mercy. Help us to see life from Your perspective and to make choices that honor You. Give us discernment for the decisions we face today. "{{keyClause}}" — guide us by Your truth. Amen.`,
    `Father, we need Your wisdom. The world offers so many voices, but You alone speak truth. Help us to hear Your voice above the noise and to follow Your wisdom, even when it seems foolish to the world. Amen.`,
    `Lord, we bring our decisions before You — the ones we are facing and the ones we are avoiding. Order our steps, open and close doors as You see fit, and give us peace as we wait on You. Amen.`,
  ],
  kingship: [
    `Sovereign Lord, You reign over all. Help us to live under Your authority with joy and confidence, knowing that the King of Kings is our Father. Let Your kingdom come, let Your will be done, in our lives as it is in heaven. "{{opener}}" — let this be our declaration. Amen.`,
    `Lord, You are the King above all kings. Help us to submit to Your reign, to trust Your rule, and to find our freedom in serving You. Your kingdom is an everlasting kingdom, and Your dominion endures through all generations. Amen.`,
    `Father, we crown You again in the areas where we have been sitting on the throne. Take the scepter of our schedule, our money, our ambitions, and our relationships — rule over all of it, for Your kingdom is better than ours. Amen.`,
  ],
  healing: [
    `Lord, You are the God who heals. We bring before You our brokenness — physical, emotional, relational — and ask for Your restoring touch. "{{keyClause}}" — we hold onto Your promise of restoration. Heal us, Lord, and we will be healed. Save us, and we will be saved. Amen.`,
    `Father, we pray for healing — for ourselves, for those we love, for a broken world. Trusting that You make all things new, we ask for Your restoring power to be at work in us and through us. In Jesus' name, Amen.`,
    `Lord, You mend what is broken and raise what has fallen. We bring You the places we have given up on — the relationship, the dream, the health — and ask You to do what only You can do. We will wait on You. Amen.`,
  ],
  death: [
    `Lord, thank You that death is not the end. Because You live, we too shall live. Help us to face our mortality not with fear, but with hope, knowing that You have conquered the grave. "{{opener}}" — let this truth comfort our hearts. Amen.`,
    `Father, we thank You that Jesus has defeated death once and for all. Help us to live without fear of the grave, with our eyes fixed not on what is seen but on what is unseen — the eternal glory that awaits us. Amen.`,
    `Lord, we grieve with hope for those we have lost and prepare our own hearts for what is to come. Until that day, help us to live with eternity in view — loving boldly, forgiving quickly, and storing treasure where moth and rust cannot destroy. Amen.`,
  ],
  obedience: [
    `Lord, help us to obey Your Word not out of obligation but out of love. When Your commands seem difficult, remind us that they are given for our good. Give us hearts that delight to do Your will. "{{keyClause}}" — let these words guide our steps. Amen.`,
    `Father, we confess that obedience is hard. Give us the grace to do what You ask, the wisdom to know when to act, and the faith to trust that Your way is always best. Shape us into people who joyfully follow You. Amen.`,
    `Lord, we know the step You are asking of us. Quiet our fear and strengthen our resolve — we will obey, and we trust You with the outcome. Make our willing hearts joyful ones. Amen.`,
  ],
  warning: [
    `Lord, thank You for the warnings in Your Word — evidence of Your love. Give us ears to hear, hearts to respond, and the humility to turn from anything that leads us away from You. "{{opener}}" — wake us up to Your truth. Amen.`,
    `Father, we thank You that You do not leave us in our sin. Your warnings are invitations to life. Give us the wisdom to heed them and the grace to walk in Your ways. Amen.`,
    `Lord, where we have been drifting, pull us back. Where we have been deaf to Your warnings, open our ears; where we have been proud, humble us. Do whatever it takes to keep us near to You. Amen.`,
  ],
  blessing: [
    `Father, thank You for blessing us beyond what we deserve — not for our goodness, but for Yours. Teach us to receive Your favor with open hands instead of grasping for it, and to become a blessing to everyone You place in our path. Let "{{opener}}" be the way we live today. In Jesus' name, Amen.`,
    `Lord, we are the undeserving recipients of Your blessing. Keep us humble enough to receive it and generous enough to pass it on — to our families, our neighbors, our churches. Make our lives a channel of Your goodness. Amen.`,
    `Father, we do not want to be a cul-de-sac of blessing. Show us one person or one need You want us to be a gift to this week, and give us the joy of giving. We have freely received; help us freely give. Amen.`,
  ],
  providence: [
    `Father, we confess that we often see only circumstances while You see the whole story. Teach us to trust Your providence — to believe that nothing in our lives is accidental and that You are working all things for good. When we cannot see Your hand, help us to trust Your heart. Let "{{opener}}" be our confession of dependence today. In Jesus' name, Amen.`,
    `Lord, You were at work in this story before anyone could see it — arranging, guiding, providing. Help us to live with that same confidence: that You are before us, behind us, and with us in every step. Give us quiet, unhurried trust in Your perfect timing. Amen.`,
    `Father, we stop trying to orchestrate every detail and hand You the pen. Write our story as You see fit — and give us the peace of knowing that the Author is good, wise, and never late. Amen.`,
  ],
  light: [
    `Lord, You are the Light of the World. Dispel the darkness in our hearts, guide our steps, and help us to walk as children of light. Let our lives shine before others so they may see Your goodness. "{{keyClause}}" — let this be our prayer. Amen.`,
    `Father, we ask You to fill us with Your light. Expose the darkness in our hearts, guide our path, and help us to reflect Your glory to a world in need of hope. In Jesus' name, Amen.`,
    `Lord, we turn from the shadows we have been hiding in. Shine Your light into every corner of our lives and make us people of honest, radiant faith. Amen.`,
  ],
  justice: [
    `Righteous Father, You judge with perfect justice and Your ways are right. Teach us to love what You love — to defend the helpless, lift the fallen, and pursue what is true. "{{keyClause}}" — let this shape how we live and how we love. In Jesus' name, Amen.`,
    `Lord, we bring You the injustices we have suffered and the injustices we have ignored. Vindicate what needs vindicating, and give us courage to be part of Your justice — in our homes, our churches, and our world. Amen.`,
    `Father, make us people of integrity — whose yes is yes, whose dealings are honest, and whose lives match our words. Where we have cut corners, forgive us and restore us to the straight path. Amen.`,
  ],
  humility: [
    `Lord, You oppose the proud but give grace to the humble. Strip away our pride — the need to be right, seen, and praised — and give us the freedom of a lowly heart. "{{keyClause}}" — teach us this way. Amen.`,
    `Father, we confess our self-sufficiency. We have tried to be our own savior. Remind us that we are dependent on You for every breath, and make us people who ask for help — from You and from one another. Amen.`,
    `Lord, give us the humility to serve without being noticed, to learn from those we would rather teach, and to take the lowest place with joy. In Your gentleness, make us gentle. Amen.`,
  ],
  holiness: [
    `Holy God, You are set apart and worthy of all reverence. Cleanse us, sanctify us, and make us wholly Yours — not for our glory, but so that Your holiness might be seen in us. "{{keyClause}}" — this is our calling. In Jesus' name, Amen.`,
    `Father, we offer ourselves to You as a living sacrifice, holy and acceptable. Take our hands, our words, our time, and our treasure — set them apart for Your purposes today. Amen.`,
    `Lord, purify what has become common in our lives. Where we have let the world blur the lines You drew, sharpen them again. Make us people who take holiness seriously because we take You seriously. Amen.`,
  ],
  unity: [
    `Father, You call Your people to dwell together in unity. Heal our divisions, soften our hard hearts, and make us one — as You and the Son are one. "{{keyClause}}" — let this become true of us. In Jesus' name, Amen.`,
    `Lord, we confess where we have built walls instead of bridges. Give us the humility to apologize, the grace to forgive, and the wisdom to walk together even when we disagree. Amen.`,
    `Father, unite Your church around the essentials and grant us patience in the non-essentials. Let our love for one another be so evident that the world knows we belong to You. Amen.`,
  ],
  joy: [
    `God of joy, You are the fountain of all gladness. Restore to us the joy of Your salvation, and let it overflow in our lives regardless of our circumstances. "{{keyClause}}" — this is our reason to rejoice. In Jesus' name, Amen.`,
    `Lord, our joy is in You, not in our situation. When we are tempted to grumble, give us grateful hearts; when sorrow weighs us down, remind us of the joy set before us. Amen.`,
    `Father, make our lives a song of praise. Let the joy You place within us be visible to everyone around us — a quiet testimony that You are good. Amen.`,
  ],
};

export const DEFAULT_PRAYERS = [
  `Heavenly Father, thank You for speaking to us through Your Word. May the truth of this passage take root in our hearts and bear fruit in our lives. Help us not merely to hear Your Word, but to do it — for Your glory and our good. In Jesus' name, Amen.`,
  `Lord, let this verse not merely inform us, but transform us. Shape our thoughts, guide our steps, and mold our hearts to be more like Yours. We ask this in the name of Jesus, our Savior and Lord. Amen.`,
];

// ── Prompt-specific theme data ──────────────────────────────────────────────

/** One-liners used by Prompt 2 when no chapter tools exist. */
export const THEME_DESCRIPTIONS = {
  love: `The central revelation here is love — not an abstract concept, but the very nature of God made actionable. This is both a promise (God loves you) and a command (love one another). In this passage, love takes center stage.`,
  faith: `Faith is the thread. This verse calls for trust in God's character and promises, even when circumstances remain unclear or difficult.`,
  grace: `Grace is on display — God's unearned favor. This is not merely a doctrine but a reality that transforms how we live and relate to God and others.`,
  hope: `Hope anchors this passage. Not wishful thinking, but confident expectation rooted in God's faithfulness and the certainty of His promises.`,
  judgment: `There is a sober truth here about the consequences of sin and the holiness of God. Yet woven through is the thread of grace — God's warnings are acts of love meant to protect.`,
  life: `Life — abundant, eternal, transformative — pulses through these words. The passage points beyond mere existence to the life that flows from God Himself.`,
  kingship: `God's sovereign rule is central. His kingdom brings order, justice, and peace, and we are called to live under His gracious authority.`,
  wisdom: `Wisdom calls out — the fear of the Lord that is the beginning of understanding. This passage invites you to see reality from God's perspective.`,
  obedience: `Obedience emerges as a key theme. The passage connects what we believe with how we live, showing that true faith expresses itself through faithful action.`,
  peace: `Peace is the promise of this passage — not the absence of trouble, but the settled confidence that comes from knowing who God is.`,
  power: `Power — the quiet, unshakeable power of God — is on display. We were never meant to live in our own strength; this passage calls us to draw on His.`,
  fear: `Fear is directly addressed. The passage offers the antidote to anxiety: the presence and faithfulness of a God who holds the future.`,
  suffering: `Suffering is reframed here. What seems meaningless is producing something eternal, and the passage calls us to trust God's purposes in the pain.`,
  healing: `Healing and restoration flow through this passage. God mends what is broken and makes whole what has been shattered.`,
  death: `Death is confronted with gospel hope. The passage announces that the grave has been defeated and that because Christ lives, we shall live also.`,
  praise: `Praise is the fitting response. The passage calls us to lift our eyes from our circumstances to the God who is worthy.`,
  warning: `There is a loving warning here — not to frighten us, but to protect us. God alerts us to danger because He loves us.`,
  blessing: `Blessing is the heart of this passage — God's settled favor, freely given to His people. It is a gift to receive with gratitude and to pass on with generosity, not a status to hoard.`,
  providence: `Providence is the quiet engine of this passage — God's unseen hand ordering people, timing, and circumstances toward His purposes. The call on us is trust: to rest in the One who is never late and never caught off guard.`,
  light: `Light and darkness stand in contrast. The passage calls us to walk in the light that reveals truth and guides our steps.`,
  justice: `Righteousness and justice are the theme — the character of God made visible in how we treat one another. The passage calls us to love what God loves: what is true, fair, and upright.`,
  humility: `Humility is the heart of this passage — the honest posture that knows who God is and who we are. It is not weakness but the doorway through which grace enters.`,
  holiness: `Holiness is the theme — being set apart for God. Not a list of prohibitions, but belonging to a holy God and reflecting His character in a world that has forgotten Him.`,
  unity: `Unity is the theme — the people of God living as one. Not sameness, but harmony: many members, one body, bound together in love.`,
  joy: `Joy is the theme of this passage — not fleeting happiness, but the deep gladness that flows from knowing God. It is a fruit of the Spirit and a foretaste of heaven.`,
};

/** Used by Prompt 4 when the verse itself contains a contrast. */
export const THEME_CONTRASTS = {
  light: `This passage engages the light/darkness contrast, which is foundational in Scripture. Light represents truth, holiness, and the presence of God; darkness represents ignorance, evil, and separation from God. This passage calls you to choose which realm you will walk in.`,
  love: `The love/hate contrast here isn't about emotion — it's about covenant loyalty. To love God is to be faithful to Him; to hate is to reject His ways. This verse presents a decision about allegiance.`,
  life: `Life/death is the ultimate biblical contrast. The gospel announces that death has been defeated and life — real, eternal life — has won. This passage stands in that victory.`,
  judgment: `The judgment/grace contrast runs through this passage. God's holiness demands accountability, but His mercy offers redemption. Both are real; both demand a response.`,
  grace: `Grace vs. earning is the contrast at work here. Either we receive God's favor as a gift, or we try to deserve it — and the two paths lead very different places.`,
  faith: `Faith vs. fear is the contrast to notice. One looks at circumstances and trembles; the other looks at God and trusts. This passage sets those two responses side by side.`,
  power: `Human weakness vs. divine power — this is the contrast on display. The passage invites you to stop pretending you are strong enough on your own.`,
  obedience: `Obedience vs. rebellion is the fork in the road. One leads to blessing and life; the other to consequence. The passage makes the stakes clear.`,
  blessing: `Blessing vs. curse — the two ways set before God's people. Blessing comes through humble dependence on God; the curse, through trusting in oneself. The passage makes the choice unmistakable.`,
  providence: `Chance vs. providence — what looks like coincidence to us is appointment to God. The passage invites you to trade anxious self-management for restful trust in the One who orders all things.`,
  justice: `Justice vs. injustice — the righteous and the wicked walk different roads. Scripture is clear that God sees every wrong, and that righteousness exalts a nation while sin is a reproach. The passage calls you to choose whose road you walk.`,
  humility: `Pride vs. humility is the contrast at the heart of this passage. One builds a tower to reach heaven and ends in a fall; the other bows low and is lifted up. The choice is unmistakable.`,
  holiness: `Holy vs. common — the clean and the unclean set apart. The passage draws a line that the world says does not exist, and calls you to live on the side of what God has consecrated.`,
  unity: `Unity vs. division — the way of life together and the way of scattered isolation. Scripture sets them side by side and shows which one carries the blessing of God.`,
  joy: `Joy vs. sorrow — the passage reminds us that weeping may endure for a night, but joy comes in the morning. Both are real, but they do not have the last word equally.`,
  hope: `Hope vs. despair is the contrast at work here. One looks at circumstances and concludes it is over; the other looks at God and waits with confidence. The passage sets those two readings of the same situation side by side.`,
  peace: `Peace vs. turmoil — the world's restlessness against the settled confidence that comes from knowing God. The passage invites you to trade anxious striving for the rest only He can give.`,
  fear: `Fear vs. faith — the same unknown, two very different responses. One shrinks back and worries; the other looks at who God is and steps forward. The passage is an invitation to choose which one will shape you.`,
  warning: `Warning vs. blessing runs through this passage — the hard road and the good road set before God's people. The warning exists to guard the blessing, not to cancel it. Heed the one, and you walk into the other.`,
  praise: `Praise vs. silence — the heart that speaks up and the heart that stays quiet. The passage calls you from the silence of forgetfulness to the gladness of declaring who God is.`,
  suffering: `Suffering vs. glory is the contrast this passage holds out — present pain against the weight of glory being prepared. They are not equal, and they do not last the same length of time.`,
  healing: `Sickness vs. wholeness — what is broken against what God restores. The passage draws the line between the world's woundedness and the Maker's mending hand.`,
  death: `Death vs. life — the grave's finality against the resurrection's victory. The gospel announces that the two have met, and life has won. This passage stands on the winning side.`,
  kingship: `The kingdom of God vs. the kingdoms of this world — two governments, two sets of values, two ends. The passage calls you to see which kingdom is finally standing and to live accordingly.`,
  wisdom: `Wisdom vs. folly — the house built on rock and the house built on sand. Both look similar while being built; only the storm reveals the difference. The passage invites you to build wisely.`,
};

/** Pairings scanned for inside the verse text by Prompt 4. */
export const CONTRAST_PAIRS = {
  light: "darkness", life: "death", love: "hate",
  good: "evil", truth: "lie", bless: "curse",
  faith: "fear", grace: "law", wisdom: "folly",
  flesh: "spirit", heaven: "earth", old: "new",
  rich: "poor", first: "last", before: "after",
  strength: "weakness", kingdom: "world", obey: "disobey",
  chance: "providence",
  righteous: "wicked", just: "unjust", humble: "proud",
  holy: "common", clean: "unclean", joy: "sorrow",
  unity: "division", together: "scattered", wise: "foolish",
  peace: "strife", freedom: "bondage", reward: "punishment",
};

/** Used by Prompt 5 to raise theme-appropriate questions. */
export const THEME_QUESTIONS = {
  love: `Since this passage centers on love, ask yourself: What kind of love is being described here? Is it God's love for us, our love for God, or our love for one another? What does this love look like in action? Does it comfort, command, or challenge you?`,
  faith: `With faith at the center: What is this passage calling you to trust God for? Is the emphasis on believing a specific truth, trusting in a promise, or stepping out in obedience? What would change if you fully believed this?`,
  grace: `Grace raises profound questions: What does this reveal about God's character that you couldn't know otherwise? How does undeserved favor change your identity? Is there someone you need to extend this same grace to?`,
  hope: `Hope prompts these questions: What does this passage tell you about God's faithfulness? How does this hope change how you face your current circumstances? Is your hope built on feelings or on God's promises?`,
  life: `Life — eternal and abundant — raises the question: Does your daily life reflect the reality of eternity? What would change if you truly believed that real life begins now and extends forever?`,
  judgment: `Judgment confronts us: Does this passage make you uncomfortable? Why? Is there sin to confess, a relationship to make right, or a warning you've been ignoring? How does grace intersect with the sobering truths here?`,
  kingship: `God's sovereignty invites reflection: Is there an area of your life where you've resisted His authority? What would it look like to truly live under His reign today? How does His kingship change your perspective on current events?`,
  wisdom: `Wisdom calls for discernment: Where do you need God's wisdom right now? What would it look like to apply this passage's truth to a specific decision you're facing? Are you listening to God's voice or the world's noise?`,
  obedience: `Obedience raises the question: What is God asking you to do that you've been putting off? Is there a step of faith you need to take? Remember, obedience is not about perfection — it's about direction.`,
  peace: `Peace invites the question: What is stealing your peace right now? Is it a situation you can change, or one you must trust God with? What would resting in Him look like today?`,
  power: `Power prompts the question: Where are you trying to be strong on your own? What would change if you truly depended on God's strength rather than your own?`,
  fear: `Fear asks: What are you afraid of — and is that fear bigger than your God? What would you do differently if you truly believed He is with you?`,
  suffering: `Suffering raises the hardest questions: Is God good in this pain? What might He be producing in you through it? How can you receive comfort now, and extend it to others later?`,
  healing: `Healing asks: What in your life needs God's restoring touch — and have you brought it to Him? Who might God be inviting you to journey toward wholeness with?`,
  death: `Death raises the ultimate question: Because Christ conquered the grave, how should we live today? What fears would lose their power if you truly believed death is not the end?`,
  praise: `Praise prompts the question: What has God done that you have failed to thank Him for? How would your perspective shift if you led with gratitude today?`,
  warning: `Warning asks: Is there a warning sign in your life you've been ignoring? What would it cost to heed it now — and what might it cost not to?`,
  blessing: `Blessing raises these questions: What does God's favor look like in your life right now — and have you stopped noticing it? How is a blessed life different from a comfortable one? And who are you meant to be a blessing to this week?`,
  providence: `Providence prompts these questions: Where in your life have you assumed God wasn't at work — and might He have been arranging things all along? What are you trying to control that He has promised to guide? How would your worry change if you truly believed that nothing in your life is accidental?`,
  light: `Light raises the question: What darkness in your life needs to be brought into the light? What would change if you stopped hiding and started walking openly with God?`,
  justice: `Justice asks: Is there an injustice in your life you have stopped noticing? Where is God calling you to be more upright — in your words, your business, your treatment of others? And how does the cross show you both the seriousness of sin and the depth of mercy?`,
  humility: `Humility asks: Where has pride been running your life — the need to be right, seen, or praised? What would it look like to take the low place this week? And what might God be able to do through you if you stopped insisting on your own way?`,
  holiness: `Holiness asks: Is there an area of your life you have not yet set apart for God? Where has the line between holy and common grown blurry? What would change if you took His call to be set apart seriously starting today?`,
  unity: `Unity asks: Where is division at work in your life — a grudge, a faction, a wall you have built? What is one step toward reconciliation you can take this week? And are you willing to be the one who moves first?`,
  joy: `Joy asks: What has been stealing your joy — and is it worth the trade? Where have you been looking for happiness in things that cannot deliver? What would change if you rooted your gladness in who God is rather than in what happens to you?`,
};
