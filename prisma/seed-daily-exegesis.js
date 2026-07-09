import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const entries = [
  {
    title: 'In the Beginning, God',
    passageReference: 'Genesis 1:1-5',
    introduction:
      'Genesis opens Scripture by placing God before everything else. Before light, land, sea, creature, or human life, there is God: eternal, sovereign, and speaking.',
    contextSummary:
      'Genesis 1 is the first creation account. It introduces God as Creator, the goodness of creation, and the ordered rhythm of His word bringing form, light, and life.',
    teachingBody:
      'The first words of the Bible do not argue for God; they announce Him. Creation is not accidental or chaotic. It begins with the living God who speaks. The earth is described as formless and empty, yet God is not absent from it. His Spirit hovers over the waters, and His word brings light into darkness. The first divine command, "Let there be light," shows that God rules by His word. Light is called good before the sun is even mentioned, teaching us that goodness begins in God Himself, not in created things. The separation of light from darkness establishes order, boundaries, and purpose.',
    application:
      'Begin your day with God before the tasks, noise, and demands. Ask where your life feels formless or dark, then invite the Lord to bring order through His word.',
    prayer:
      'Creator God, speak light into the places of confusion and darkness in me. Teach me to trust Your word as the beginning of order, life, and goodness.',
    tags: 'Genesis,Creation,Light,Gods Word',
  },
  {
    title: 'The God Who Orders the Waters',
    passageReference: 'Genesis 1:6-13',
    introduction:
      'The second and third days of creation show God forming spaces where life can flourish. He separates, gathers, names, and fills the world with fruit-bearing potential.',
    contextSummary:
      'After creating light, God continues shaping creation by separating waters, revealing dry land, and causing vegetation to spring forth according to its kinds.',
    teachingBody:
      'God separates the waters above from the waters below, then gathers the lower waters so dry land appears. These acts show that creation is not merely about making things, but about ordering them for life. God names the sky, land, and seas, showing His authority over every realm. Then the earth brings forth vegetation, seed-bearing plants, and fruit trees. The repeated phrase "according to its kind" reveals both diversity and order. God delights in a world that is fruitful, structured, and capable of multiplying life. The land does not produce randomly; it responds to God\'s command.',
    application:
      'Consider where God may be setting boundaries in your life for your flourishing. Not every separation is loss; some separations make room for fruit.',
    prayer:
      'Lord, order my life according to Your wisdom. Gather what is scattered, reveal what is hidden, and make my life fruitful in the places You have prepared.',
    tags: 'Genesis,Creation,Order,Fruitfulness',
  },
  {
    title: 'Lights for Signs and Seasons',
    passageReference: 'Genesis 1:14-19',
    introduction:
      'On the fourth day, God appoints lights in the heavens. They do not rule apart from Him; they serve His ordered purpose for time, signs, days, and seasons.',
    contextSummary:
      'Genesis 1:14-19 describes the creation of the greater light, lesser light, and stars. These lights govern day and night under God\'s command.',
    teachingBody:
      'The sun, moon, and stars are created as servants, not gods. In the ancient world, heavenly bodies were often worshiped, but Genesis quietly demotes them. They are made by God and assigned their function by God. They mark days, years, seasons, and signs. Time itself is placed under divine order. This means human life is not meant to float without rhythm. God gives creation patterns: work and rest, day and night, seedtime and harvest. The stars are mentioned almost briefly, reminding us that what seems vast to us is effortless to Him.',
    application:
      'Receive your limits as gifts. Let God shape your days with rhythms of worship, work, rest, and attention to His appointed seasons.',
    prayer:
      'Father, teach me to number my days with wisdom. Free me from worshiping created things, and help me live under Your faithful rule.',
    tags: 'Genesis,Creation,Time,Seasons',
  },
  {
    title: 'Life That Multiplies',
    passageReference: 'Genesis 1:20-25',
    introduction:
      'God fills the waters, skies, and land with living creatures. The Creator does not make a barren world, but one teeming with movement, blessing, and life.',
    contextSummary:
      'The fifth and sixth days begin with living creatures in sea and sky, followed by land animals. God blesses the creatures and commands multiplication.',
    teachingBody:
      'God\'s creation moves from formed spaces to filled spaces. The seas swarm, birds fly, and the land brings forth living creatures. Life is not sparse; it overflows. For the first time in Genesis, God blesses His creatures and commands them to be fruitful and multiply. Blessing is tied to life-giving abundance. The repeated approval, "God saw that it was good," shows that physical creation matters to God.',
    application:
      'Notice the abundance of God around you. Practice gratitude for ordinary created life, and ask how your own life can multiply goodness rather than consume it.',
    prayer:
      'God of life, make me attentive to Your abundance. Let my words, work, and relationships become places where Your goodness multiplies.',
    tags: 'Genesis,Creation,Blessing,Life',
  },
  {
    title: 'Made in the Image of God',
    passageReference: 'Genesis 1:26-31',
    introduction:
      'The creation account reaches its crown in humanity. Men and women are made in God\'s image, blessed, commissioned, and placed within a very good creation.',
    contextSummary:
      'Genesis 1:26-31 describes the creation of humanity, the image of God, the human vocation to rule under God, and the declaration that creation is very good.',
    teachingBody:
      'Humanity is introduced by divine counsel: "Let us make man in our image." Unlike the rest of creation, humans are made to represent God within the world. The image of God gives every person dignity before any achievement, status, or role. Male and female together bear this image. God blesses them and gives a vocation: be fruitful, multiply, fill the earth, subdue it, and rule over living creatures. This rule is not tyranny; it is stewardship under the Creator\'s authority.',
    application:
      'Treat every person today as an image-bearer. Ask whether your authority, work, and relationships reflect God\'s care or merely your own control.',
    prayer:
      'Lord, restore in me the joy and responsibility of bearing Your image. Teach me to steward my life and relationships in a way that reflects Your goodness.',
    tags: 'Genesis,Image of God,Humanity,Stewardship',
  },
  {
    title: 'The Fall of Humanity',
    passageReference: 'Genesis 3:1-13',
    introduction:
      'The serpent enters the garden, and the perfect harmony between God, humanity, and creation is shattered by doubt, disobedience, and blame.',
    contextSummary:
      'Genesis 3 records the temptation of Eve, the fall of Adam and Eve, and the immediate consequences of sin entering the world.',
    teachingBody:
      'The serpent\'s strategy is subtle: he first questions God\'s word, then contradicts it, then offers an alternative path to wisdom. Eve responds by adding to God\'s command, showing that even a small deviation from God\'s word opens the door to deception. Adam, who was with her, fails to lead or intervene. When confronted by God, both Adam and Eve deflect responsibility — Adam blames Eve and ultimately God, and Eve blames the serpent. Sin immediately disrupts relationship with God, with each other, and with creation.',
    application:
      'Examine the areas where you are tempted to doubt God\'s word. Ask whether you add to or subtract from what He has clearly said. Practice taking responsibility rather than shifting blame.',
    prayer:
      'Merciful God, protect me from the deception of the enemy. Give me the humility to take responsibility for my sin and the faith to trust Your word completely.',
    tags: 'Genesis,Fall,Sin,Temptation',
  },
  {
    title: 'The Call of Abraham',
    passageReference: 'Genesis 12:1-9',
    introduction:
      'God calls a man named Abram to leave everything familiar and follow Him into an unknown land, promising blessing that would reach all nations.',
    contextSummary:
      'Genesis 12 marks a major turning point. After the scattering at Babel, God narrows His focus to one man through whom He will bless all the families of the earth.',
    teachingBody:
      'God\'s call to Abram is both a command and a promise: "Go from your country, your people and your father\'s household to the land I will show you." Abram must leave behind everything that defines his identity — homeland, family, security — and trust God\'s word alone. The promises are staggering: a great nation, a great name, divine blessing, and the promise that all peoples on earth will be blessed through him. Abram\'s response is immediate faith: he goes. This chapter introduces the theme of faith that will define God\'s people throughout Scripture.',
    application:
      'What is God calling you to leave behind in order to follow Him fully? Trust that His promises are greater than what you are asked to surrender.',
    prayer:
      'Lord, give me the faith of Abraham — willing to leave behind comfort and security to follow wherever You lead. Make me a blessing to others.',
    tags: 'Genesis,Abraham,Faith,Calling',
  },
  {
    title: 'The Birth of Moses and God\'s Deliverance',
    passageReference: 'Exodus 2:1-10',
    introduction:
      'In the midst of oppression and death, a Hebrew baby is born and placed in a basket on the Nile — the beginning of God\'s plan to deliver His people.',
    contextSummary:
      'Exodus 2 records the birth of Moses, his rescue by Pharaoh\'s daughter, and his upbringing in the Egyptian palace, setting the stage for the exodus.',
    teachingBody:
      'The story of Moses\' birth is a story of courageous faith. His parents defy Pharaoh\'s decree and hide him for three months. When they can no longer hide him, they place him in a papyrus basket coated with tar and set it among the reeds of the Nile. Miriam, Moses\' sister, watches from a distance. Pharaoh\'s daughter discovers the baby, has compassion on him, and unknowingly hires Moses\' own mother to nurse him. God works through ordinary acts of courage, compassion, and even the household of the oppressor to accomplish His purposes.',
    application:
      'Trust that God is working even in impossible circumstances. Your acts of faithfulness — even small ones — may be part of a much larger deliverance.',
    prayer:
      'Sovereign God, You work through the courageous acts of ordinary people. Give me faith to act boldly and trust that You are orchestrating events for Your purposes.',
    tags: 'Exodus,Moses,Deliverance,Freedom',
  },
  {
    title: 'The Passover',
    passageReference: 'Exodus 12:1-14',
    introduction:
      'The night of the Passover marks the decisive moment of Israel\'s deliverance from Egypt — a lamb slain, blood applied, and death passing over those covered by the blood.',
    contextSummary:
      'Exodus 12 records God\'s institution of the Passover on the night of the tenth plague, the death of the firstborn, which finally breaks Pharaoh\'s resistance.',
    teachingBody:
      'The Passover is both a historical event and a theological pattern. Each household must take a lamb without blemish, slaughter it, and apply its blood to the doorposts. The lamb must be roasted and eaten with unleavened bread and bitter herbs, eaten in haste with sandals on and staff in hand. The blood is the sign of protection: when God sees the blood, He passes over that house. This event becomes the foundational act of redemption in the Old Testament, celebrated annually and pointing forward to Christ.',
    application:
      'Reflect on the cost of your salvation. The Lamb of God was slain so that judgment might pass over you. Receive His sacrifice with gratitude and live as one who has been redeemed.',
    prayer:
      'Lamb of God, thank You for Your sacrifice that delivers me from judgment. Help me to live as a person who has been passed over and set free.',
    tags: 'Exodus,Passover,Redemption,Lamb',
  },
  {
    title: 'The Ten Commandments',
    passageReference: 'Exodus 20:1-17',
    introduction:
      'At Mount Sinai, God gives His people the Ten Commandments — a covenant charter that defines the relationship between God and His people and between people and their neighbors.',
    contextSummary:
      'Exodus 20 records God\'s direct revelation of the Ten Commandments to Israel at Mount Sinai, establishing the moral foundation of the covenant.',
    teachingBody:
      'The Ten Commandments begin with God\'s identity as Redeemer: "I am the LORD your God, who brought you out of Egypt." Grace precedes law. The commands are divided into two tables: the first four address humanity\'s relationship with God (no other gods, no idols, honor God\'s name, keep the Sabbath), and the last six address relationships with others (honor parents, no murder, adultery, theft, false witness, or coveting). Jesus later summarizes these as loving God with all your heart and loving your neighbor as yourself.',
    application:
      'Read the Ten Commandments as a description of the life God\'s redeemed people are called to live. Ask the Holy Spirit to reveal areas where you fall short.',
    prayer:
      'Lord, thank You for giving me clear boundaries for life. Write Your law on my heart and help me to love You and my neighbor in all I do.',
    tags: 'Exodus,Ten Commandments,Law,Covenant',
  },
  {
    title: 'Crossing the Jordan',
    passageReference: 'Joshua 3:1-17',
    introduction:
      'After forty years in the wilderness, Israel stands at the Jordan River. God parts the waters as He did at the Red Sea, confirming Joshua\'s leadership and inviting His people into the Promised Land.',
    contextSummary:
      'Joshua 3 describes the miraculous crossing of the Jordan River at flood stage, marking Israel\'s entry into Canaan under Joshua\'s leadership.',
    teachingBody:
      'The crossing of the Jordan is a second exodus. God commands the priests carrying the ark of the covenant to step into the river first — the waters part only when their feet touch the water. This requires faith that acts before seeing the miracle. Twelve stones are taken from the riverbed as a memorial for future generations. God exalts Joshua in the eyes of Israel just as He had Moses, demonstrating that the same God who led them out of Egypt will bring them into the Promised Land.',
    application:
      'What step of faith is God asking you to take before you see the outcome? Trust that when you step out in obedience, He will make a way.',
    prayer:
      'Lord, give me the courage to step into the water before it parts. I trust that You who have been faithful in the past will be faithful in this new season.',
    tags: 'Joshua,Jordan,Faith,Promised Land',
  },
  {
    title: 'David and Goliath',
    passageReference: '1 Samuel 17:32-50',
    introduction:
      'A young shepherd boy armed with only a sling and five smooth stones faces the Philistine giant Goliath, demonstrating that God saves not by sword or spear but by His own power.',
    contextSummary:
      '1 Samuel 17 records the famous battle between David and Goliath, where David\'s faith in God overcomes the military might of the Philistine champion.',
    teachingBody:
      'David approaches Goliath with a radically different perspective. While the army of Israel sees only the giant\'s size and strength, David sees an enemy of God who has defied the armies of the living Lord. David\'s confidence is not in his own skill but in God\'s power: "The battle is the Lord\'s." He refuses Saul\'s armor, choosing instead the weapons he has proven in his battles as a shepherd — his sling and stones. David\'s victory demonstrates that faith in God is more powerful than the world\'s might.',
    application:
      'What "giants" are standing against you today? Face them not in your own strength but in the name of the Lord, who has already won the victory.',
    prayer:
      'Lord of Hosts, teach me to see my battles through Your eyes. Give me faith to face the giants in my life, trusting that the battle is Yours.',
    tags: 'David,Goliath,Faith,Courage',
  },
  {
    title: 'The Stillness of the Shepherd',
    passageReference: 'Psalm 23:1-6',
    introduction:
      'David\'s most beloved psalm paints a portrait of God as the Good Shepherd who leads, provides, protects, and restores His sheep in every season of life.',
    contextSummary:
      'Psalm 23 is a psalm of trust in God\'s provision and protection, using the shepherd metaphor to describe God\'s faithful care throughout life\'s journey.',
    teachingBody:
      'The psalm moves through three landscapes of trust. First, green pastures and still waters — images of rest and restoration. The Shepherd leads, and the sheep follow because they know His voice. Second, the valley of the shadow of death — a place of danger and fear, yet the Shepherd is present with rod and staff for comfort and protection. Third, the table prepared in the presence of enemies — unexpected abundance and hospitality even in the midst of opposition. The psalm ends with the confident declaration that goodness and mercy will pursue the psalmist all the days of his life, and he will dwell in God\'s house forever.',
    application:
      'Identify which landscape you are in today: rest, valley, or table. Trust that the Shepherd is with you in every season and His goodness will pursue you.',
    prayer:
      'Good Shepherd, lead me beside still waters and restore my soul. When I walk through dark valleys, remind me that You are with me. Let Your goodness and mercy follow me today.',
    tags: 'Psalms,Shepherd,Trust,Comfort',
  },
  {
    title: 'The Suffering Servant',
    passageReference: 'Isaiah 53:1-6',
    introduction:
      'Isaiah\'s prophecy of the Suffering Servant describes the Messiah\'s atoning death with stunning detail — written seven centuries before Christ — revealing the heart of God\'s redemptive plan.',
    contextSummary:
      'Isaiah 53 is the fourth Servant Song, predicting the suffering, rejection, substitutionary death, and exaltation of the Messiah.',
    teachingBody:
      'The Servant described here is both shocking and beautiful. He grows up like a tender shoot, with nothing in His appearance to attract us. He is despised, rejected, and acquainted with grief. Yet His suffering is not for His own sin but for ours: "He was pierced for our transgressions, He was crushed for our iniquities." The language of substitution is unmistakable. The Lord lays on Him the iniquity of us all. Through His wounds, we are healed. This chapter is the theological heart of the Old Testament\'s understanding of the atonement.',
    application:
      'Spend time meditating on the suffering of Christ. Let the truth that He bore your sins and carried your sorrows deepen your love and gratitude.',
    prayer:
      'Lord Jesus, Suffering Servant, thank You for taking my sins upon Yourself. By Your wounds I am healed. Help me to live in the freedom Your sacrifice has purchased.',
    tags: 'Isaiah,Suffering Servant,Atonement,Prophecy',
  },
  {
    title: 'The New Covenant',
    passageReference: 'Jeremiah 31:31-34',
    introduction:
      'In the midst of judgment and exile, Jeremiah announces a new covenant that will not be like the old one — written on hearts rather than stone, based on forgiveness rather than human performance.',
    contextSummary:
      'Jeremiah 31:31-34 is the climactic promise of the new covenant, foretelling a day when God\'s law will be internalized and all people will know Him directly.',
    teachingBody:
      'The new covenant is God\'s response to the failure of the old covenant due to human sinfulness. The problem was not with the law but with human hearts. The new covenant promises transformation from the inside out: God will put His law within them and write it on their hearts. The knowledge of God will become universal, from the least to the greatest. And the foundation of this new covenant is complete forgiveness: "I will forgive their wickedness and will remember their sins no more." The old covenant was broken; the new covenant is guaranteed by God\'s grace.',
    application:
      'Thank God that your relationship with Him is not based on your performance but on the finished work of Christ. Ask the Spirit to write God\'s truth on your heart.',
    prayer:
      'Lord, thank You for the new covenant sealed in Christ\'s blood. Write Your law on my heart and draw me into deeper knowledge of You. I receive Your complete forgiveness.',
    tags: 'Jeremiah,New Covenant,Forgiveness,Heart',
  },
  {
    title: 'The Beatitudes',
    passageReference: 'Matthew 5:1-12',
    introduction:
      'Jesus begins His Sermon on the Mount with a series of blessings that turn the world\'s values upside down, pronouncing God\'s favor on the humble, the mourners, the meek, and the persecuted.',
    contextSummary:
      'Matthew 5:1-12 records the Beatitudes, the opening of Jesus\' Sermon on the Mount, describing the character and blessings of citizens of the kingdom of heaven.',
    teachingBody:
      'The Beatitudes paint a portrait of the kingdom citizen. Blessed are the poor in spirit — those who recognize their spiritual bankruptcy before God — for theirs is the kingdom of heaven. Blessed are those who mourn over sin — theirs is the comfort of forgiveness. The meek, those who entrust their rights to God, will inherit the earth. Those who hunger and thirst for righteousness will be satisfied. The merciful will receive mercy, and the pure in heart will see God. The peacemakers are called children of God, and those persecuted for righteousness are assured of their reward. Each beatitude promises that what we lack now, God will supply in His kingdom.',
    application:
      'Examine which beatitude describes your current spiritual state. Receive the blessing Jesus pronounces and trust that the kingdom values are the true reality.',
    prayer:
      'Lord, transform my heart to reflect the values of Your kingdom. Make me poor in spirit, pure in heart, and hungry for righteousness. Bless me with Your kingdom perspective.',
    tags: 'Sermon on the Mount,Beatitudes,Kingdom,Blessing',
  },
  {
    title: 'The Good Samaritan',
    passageReference: 'Luke 10:25-37',
    introduction:
      'When an expert in the law tests Jesus about inheriting eternal life, Jesus tells a parable that redefines who our neighbor is and what love demands.',
    contextSummary:
      'Luke 10:25-37 records the parable of the Good Samaritan, Jesus\' response to the question "Who is my neighbor?" It illustrates that true love crosses social, ethnic, and religious boundaries.',
    teachingBody:
      'The parable begins with a man beaten and left for dead on the road to Jericho. A priest and a Levite — religious leaders who should have helped — both pass by on the other side. But a Samaritan, despised by Jews as a half-breed heretic, stops and cares for the man. He bandages his wounds, takes him to an inn, and pays for his care with a promise to cover any additional expenses. The Samaritan\'s compassion costs him time, resources, and crosses cultural barriers. Jesus\' question, "Which of these proved to be a neighbor?" shifts the focus from determining who qualifies as our neighbor to asking whether we are being a neighbor to those in need.',
    application:
      'Look for opportunities today to be a neighbor to someone in need. Be willing to cross boundaries of comfort, culture, and convenience to show mercy.',
    prayer:
      'Lord, open my eyes to see the needs of others. Give me a heart of compassion and the willingness to act, even when it costs me something.',
    tags: 'Luke,Parable,Samaritan,Mercy',
  },
  {
    title: 'The Prodigal Son',
    passageReference: 'Luke 15:11-32',
    introduction:
      'Jesus tells a story of a rebellious son, a waiting father, and a resentful brother — revealing the heart of God the Father who runs to welcome repentant sinners home.',
    contextSummary:
      'Luke 15:11-32 is the parable of the prodigal son, the third in a trilogy of parables about lost things being found. It depicts God\'s extravagant grace toward sinners and challenges religious self-righteousness.',
    teachingBody:
      'The younger son demands his inheritance early, effectively saying he wishes his father were dead. He wastes everything in wild living until a famine forces him to feed pigs — the lowest possible occupation for a Jewish man. When he comes to his senses and returns home hoping to be a hired servant, the father runs to him, embraces him, and throws a lavish celebration. The older brother, representing the Pharisees, refuses to join the celebration, angry that his father would welcome such a sinner. The father\'s response to both sons reveals the heart of God: He rejoices over repentant sinners and pleads with the self-righteous to share in His joy.',
    application:
      'Do you identify more with the younger son or the older brother? Whether you need to return to the Father or release your resentment, He invites you to the celebration.',
    prayer:
      'Father, thank You for running to meet me when I return. Whether I have wandered into sin or hardened my heart in self-righteousness, draw me into Your joy.',
    tags: 'Luke,Prodigal Son,Grace,Forgiveness',
  },
  {
    title: 'The Good Shepherd',
    passageReference: 'John 10:1-18',
    introduction:
      'Jesus declares Himself to be the Good Shepherd who knows His sheep, lays down His life for them, and brings them into one flock under one Shepherd.',
    contextSummary:
      'John 10 is part of Jesus\' discourse following the healing of the blind man. Jesus contrasts Himself as the Good Shepherd with the hired hands and thieves who do not truly care for the sheep.',
    teachingBody:
      'Jesus uses the familiar imagery of shepherding to describe His relationship with His followers. The Good Shepherd enters by the door, calls His own sheep by name, and leads them out. His sheep know His voice and follow Him, but they will not follow a stranger. Jesus contrasts Himself with the hired hand who abandons the sheep when danger comes. The Good Shepherd lays down His life for the sheep — a voluntary, sacrificial act. Jesus also speaks of other sheep not of this fold, whom He must bring as well, showing that His mission extends to Gentiles. The unity of the flock under one Shepherd is God\'s ultimate purpose.',
    application:
      'Take time to listen for the Shepherd\'s voice through Scripture, prayer, and the Holy Spirit. Trust that He knows you by name and will lead you well.',
    prayer:
      'Good Shepherd, I know Your voice and I choose to follow You. Thank You for laying down Your life for me. Lead me in the paths of righteousness for Your name\'s sake.',
    tags: 'John,Shepherd,Sheep,Life',
  },
  {
    title: 'The Vine and the Branches',
    passageReference: 'John 15:1-8',
    introduction:
      'Jesus uses the image of a vine and its branches to teach the essential truth of abiding in Him — apart from Him we can do nothing of eternal value.',
    contextSummary:
      'John 15:1-8 is part of Jesus\' farewell discourse to His disciples on the night before His crucifixion, focusing on the necessity of remaining in vital union with Him.',
    teachingBody:
      'The vine and branches metaphor illustrates the believer\'s complete dependence on Christ. He is the true vine, the Father is the vinedresser, and believers are the branches. The branch cannot bear fruit by itself — it must remain connected to the vine to receive life and nourishment. Fruitfulness is the evidence of abiding. The Father prunes every branch that bears fruit to make it bear more fruit. Pruning involves cutting away what hinders growth, a process that is painful but productive. Those who do not abide are cut off and burned, but those who abide bear much fruit and bring glory to the Father.',
    application:
      'Are you trying to produce spiritual fruit in your own strength? Stop striving and focus on abiding in Christ through prayer, His Word, and dependence on the Spirit.',
    prayer:
      'Lord Jesus, teach me to abide in You. Prune away everything that hinders my fruitfulness. Let my life be so connected to Yours that fruit is the natural result.',
    tags: 'John,Vine,Fruitfulness,Abiding',
  },
  {
    title: 'The Day of Pentecost',
    passageReference: 'Acts 2:1-13',
    introduction:
      'Fifty days after the resurrection, the Holy Spirit descends on the disciples with the sound of a rushing wind and tongues of fire, empowering them for global witness.',
    contextSummary:
      'Acts 2 records the coming of the Holy Spirit at Pentecost, marking the birth of the church and the beginning of the apostles\' public ministry.',
    teachingBody:
      'Pentecost fulfills the promise Jesus made about the coming of the Holy Spirit. The sound of a mighty rushing wind fills the house, and what looks like tongues of fire rest on each disciple. They are filled with the Holy Spirit and begin to speak in other languages, enabling the international crowd gathered in Jerusalem for the feast to hear the wonders of God in their own languages. This event reverses the scattering of Babel — where human languages were confused in judgment, now the same languages are used to declare God\'s mighty works in grace. Peter\'s sermon, empowered by the Spirit, results in three thousand conversions.',
    application:
      'Ask the Holy Spirit to fill you afresh today for witness. You don\'t need to speak in tongues to be empowered — you simply need to be yielded to the Spirit\'s control.',
    prayer:
      'Holy Spirit, fill me as You filled the disciples at Pentecost. Give me boldness to declare the wonders of God and power to be a witness for Christ.',
    tags: 'Acts,Pentecost,Holy Spirit,Church',
  },
  {
    title: 'Justified by Faith',
    passageReference: 'Romans 3:21-31',
    introduction:
      'Paul announces the great revelation of the gospel: the righteousness of God is available to all who believe in Jesus Christ, apart from the works of the law.',
    contextSummary:
      'Romans 3:21-31 presents the heart of Paul\'s gospel — justification by grace through faith in Christ\'s atoning work.',
    teachingBody:
      'After demonstrating that all humanity — Jew and Gentile — is under sin, Paul now announces the good news. A righteousness from God has been made known apart from the law. This righteousness is received through faith in Jesus Christ and is available to all who believe. All have sinned, but all are justified freely by God\'s grace through the redemption that comes in Christ Jesus. God presented Christ as a propitiation — a sacrifice that turns away wrath — through the shedding of His blood. This demonstrates God\'s justice in passing over former sins and His righteousness in justifying the one who has faith in Jesus. Paul concludes that justification is by faith apart from works of the law, so that God is both just and the justifier of those who believe.',
    application:
      'Rest in the finished work of Christ. Your standing before God is not based on your performance but on Christ\'s righteousness credited to you through faith.',
    prayer:
      'Lord, thank You that I am justified freely by Your grace through faith in Jesus. Help me to live in the freedom and confidence that comes from being declared righteous in Christ.',
    tags: 'Romans,Justification,Faith,Grace',
  },
  {
    title: 'No Condemnation in Christ',
    passageReference: 'Romans 8:1-4',
    introduction:
      'One of the most liberating declarations in all of Scripture: for those who are in Christ Jesus, there is no condemnation — the law of the Spirit of life has set us free from the law of sin and death.',
    contextSummary:
      'Romans 8 opens with the triumphant conclusion to Paul\'s discussion of the struggle with sin in Romans 7. It declares the believer\'s freedom from condemnation through union with Christ.',
    teachingBody:
      'This verse is the bridge from despair to hope. In Romans 7, Paul described the painful struggle of trying to keep the law in his own strength. But here he announces that the battle has already been won. "No condemnation" means that for those in Christ, the verdict of guilty has been permanently removed. The law of the Spirit of life has set us free from the law of sin and death. What the law could not do because of the weakness of human flesh, God did by sending His own Son. God condemned sin in the flesh of Christ so that the righteous requirement of the law might be fulfilled in us who walk according to the Spirit.',
    application:
      'Receive the gift of no condemnation today. Stop living under guilt and shame. The verdict has been declared — you are free in Christ.',
    prayer:
      'Father, thank You that there is no condemnation for me because I am in Christ Jesus. Help me to walk by the Spirit and experience the freedom You have given me.',
    tags: 'Romans,No Condemnation,Freedom,Spirit',
  },
  {
    title: 'The Armor of God',
    passageReference: 'Ephesians 6:10-18',
    introduction:
      'Paul concludes his letter to the Ephesians with a call to spiritual warfare, describing the full armor of God that enables believers to stand against the schemes of the devil.',
    contextSummary:
      'Ephesians 6:10-18 describes the spiritual battle believers face and the divine armor God provides for victory.',
    teachingBody:
      'Paul makes it clear that our struggle is not against flesh and blood but against spiritual forces of evil. Therefore, human strength and strategies are insufficient. God provides a complete suit of armor: the belt of truth, the breastplate of righteousness, shoes of the gospel of peace, the shield of faith, the helmet of salvation, and the sword of the Spirit which is the Word of God. Each piece corresponds to a spiritual reality that protects and enables the believer. Prayer is the atmosphere in which the armor is worn — praying at all times in the Spirit with all perseverance. This passage reminds us that the Christian life is not passive but an active battle requiring vigilance, faith, and dependence on God.',
    application:
      'Put on the full armor of God each day through prayer, truth, righteousness, faith, and the Word. Stand firm against the enemy\'s schemes.',
    prayer:
      'Lord, clothe me with Your armor today. Help me to stand firm in truth and righteousness, to take up the shield of faith, and to wield Your Word against the lies of the enemy.',
    tags: 'Ephesians,Armor,Spiritual Warfare,Victory',
  },
  {
    title: 'Faith and Works',
    passageReference: 'James 2:14-26',
    introduction:
      'James challenges any notion of faith that does not produce works, insisting that genuine saving faith is demonstrated by the way we live.',
    contextSummary:
      'James 2:14-26 addresses the relationship between faith and works, arguing that faith without works is dead, using Abraham and Rahab as examples.',
    teachingBody:
      'James confronts the idea that intellectual belief alone is sufficient for salvation. He argues that even demons believe in God — they know He exists and they shudder — but their belief does not save them. True saving faith is living and active; it produces the fruit of obedience. Abraham\'s faith was demonstrated when he offered Isaac on the altar. Rahab\'s faith was demonstrated when she hid the spies. These works did not earn salvation but proved that their faith was genuine. Paul and James do not contradict each other: Paul emphasizes that justification is by faith alone, apart from works, while James emphasizes that the faith that justifies is never alone but is accompanied by works.',
    application:
      'Examine your faith today. Is it producing the fruit of love, obedience, and good works? Ask God to make your faith alive and active.',
    prayer:
      'Lord, give me a faith that is alive and active. Let my works be the natural outgrowth of a genuine relationship with You, not an attempt to earn Your favor.',
    tags: 'James,Faith,Works,Obedience',
  },
  {
    title: 'The New Heaven and New Earth',
    passageReference: 'Revelation 21:1-8',
    introduction:
      'The Bible ends with a vision of a new creation: a new heaven and a new earth, the New Jerusalem descending as a bride, and God dwelling with His people forever.',
    contextSummary:
      'Revelation 21 describes John\'s vision of the new creation, the New Jerusalem, and the final state of the redeemed where God makes all things new.',
    teachingBody:
      'After the final judgment, John sees a new heaven and a new earth because the first heaven and earth had passed away. The sea — representing chaos, danger, and separation — is no more. The Holy City, the New Jerusalem, descends from heaven prepared as a bride adorned for her husband. The voice from the throne declares the most profound reality: "Look, God\'s dwelling place is now among the people, and He will dwell with them. They will be His people, and God Himself will be with them and be their God." He will wipe every tear from their eyes. There will be no more death, mourning, crying, or pain, for the old order of things has passed away. God makes all things new.',
    application:
      'Live with the hope of the new creation. Let the promise of a world without pain, death, or tears shape your perspective on present suffering.',
    prayer:
      'Lord, I long for the day when You make all things new. Until then, give me hope and perseverance. Let the vision of the New Jerusalem sustain me in every trial.',
    tags: 'Revelation,New Creation,Heaven,Hope',
  },
  {
    title: 'The Prayer of Hannah',
    passageReference: '1 Samuel 1:9-20',
    introduction:
      'Hannah, a woman deeply distressed by her barrenness, pours out her soul to the Lord at the tabernacle — a prayer so fervent that Eli mistakes her for being drunk.',
    contextSummary:
      '1 Samuel 1 records Hannah\'s anguished prayer for a son, her vow to dedicate him to the Lord, and God\'s answer in the birth of Samuel.',
    teachingBody:
      'Hannah\'s prayer is a model of honest, persistent, and sacrificial petition. She is provoked by her rival Peninnah and deeply grieved by her inability to bear children. Rather than turning bitter, she turns to God. She goes to the tabernacle and weeps before the Lord, making a vow that if God gives her a son, she will dedicate him to the Lord\'s service for his entire life. Her prayer is so intense that Eli thinks she is drunk. When Eli blesses her, her countenance changes — she has entrusted her request to God. The Lord remembers her, and she gives birth to Samuel, whose name means "heard of God." She fulfills her vow.',
    application:
      'Bring your deepest longings to God with honesty and persistence. Trust that He hears and that you can leave your burden with Him, regardless of the outcome.',
    prayer:
      'Lord, like Hannah I pour out my soul before You. Hear my cry, remember me, and give me the grace to entrust my deepest desires into Your hands.',
    tags: '1 Samuel,Hannah,Prayer,Faithfulness',
  },
  {
    title: 'The Valley of Dry Bones',
    passageReference: 'Ezekiel 37:1-14',
    introduction:
      'Ezekiel is set down in a valley full of dry bones and asked whether they can live. The vision becomes a powerful picture of spiritual resurrection and national restoration.',
    contextSummary:
      'Ezekiel 37 records the prophet\'s vision of the valley of dry bones, symbolizing Israel\'s hopeless condition in exile and God\'s promise of restoration through His Spirit.',
    teachingBody:
      'The vision begins with death — a valley of very dry bones, representing the nation of Israel in exile, cut off and without hope. God asks Ezekiel, "Can these bones live?" The prophet answers wisely: "Lord God, You know." Ezekiel is commanded to prophesy to the bones, and as he speaks, the bones come together with sinews, flesh, and skin. But there is no breath in them. Then Ezekiel prophesies to the breath (wind/Spirit), and the breath enters them, and they live — a vast army. The vision teaches that God alone can bring life from death. It is a promise of national restoration and a foreshadowing of spiritual resurrection through the Spirit.',
    application:
      'What feels dead in your life — a relationship, a dream, a calling? Trust that the God who raises the dead can bring life to any situation.',
    prayer:
      'Lord, breathe Your Spirit into the dry places of my life. I trust that You alone can bring life from death and restoration from ruin.',
    tags: 'Ezekiel,Dry Bones,Spirit,Restoration',
  },
  {
    title: 'The Great Commission',
    passageReference: 'Matthew 28:16-20',
    introduction:
      'The risen Jesus appears to His disciples on a mountain in Galilee and gives them a commission that defines the mission of the church for all time.',
    contextSummary:
      'Matthew 28:16-20 records Jesus\' final words to His disciples before His ascension — the Great Commission to make disciples of all nations.',
    teachingBody:
      'Jesus begins with a declaration of His authority: "All authority in heaven and on earth has been given to Me." This authority is the basis for the commission that follows. On the foundation of His absolute sovereignty, Jesus commands His disciples to go and make disciples of all nations. This command involves three activities: going, baptizing, and teaching. Baptism signifies identification with the triune God — the Father, Son, and Holy Spirit. Teaching involves obedience to everything Jesus commanded, not just information but transformation. The commission ends with the most comforting promise: "And surely I am with you always, to the very end of the age." The mission is empowered by Christ\'s presence.',
    application:
      'You are sent. Every relationship, conversation, and circumstance is an opportunity to make disciples. Share what you have learned and point others to Jesus.',
    prayer:
      'Lord Jesus, I receive Your commission to make disciples. Give me boldness to go, wisdom to teach, and the assurance of Your presence every step of the way.',
    tags: 'Matthew,Great Commission,Mission,Discipleship',
  },
];

const today = new Date();
today.setHours(0, 0, 0, 0);

try {
  const admin = await prisma.systemUser.findFirst({
    where: { email: 'admin@gmail.com' },
    select: { id: true },
  });

  for (const [index, entry] of entries.entries()) {
    const displayDate = new Date(today);
    displayDate.setDate(today.getDate() + index);

    const existing = await prisma.dailyExegesis.findFirst({
      where: { title: entry.title, passageReference: entry.passageReference },
    });

    const payload = {
      ...entry,
      displayDate,
      isPublished: true,
      createdBy: admin?.id ?? null,
      updatedBy: admin?.id ?? null,
    };

    if (existing) {
      await prisma.dailyExegesis.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.dailyExegesis.create({ data: payload });
    }
  }

  console.log(`Seeded ${entries.length} daily exegesis entries.`);
} finally {
  await prisma.$disconnect();
}
