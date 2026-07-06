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
      'God separates the waters above from the waters below, then gathers the lower waters so dry land appears. These acts show that creation is not merely about making things, but about ordering them for life. God names the sky, land, and seas, showing His authority over every realm. Then the earth brings forth vegetation, seed-bearing plants, and fruit trees. The repeated phrase "according to its kind" reveals both diversity and order. God delights in a world that is fruitful, structured, and capable of multiplying life. The land does not produce randomly; it responds to God’s command. Fruitfulness is rooted in obedience to His creative word.',
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
      'Genesis 1:14-19 describes the creation of the greater light, lesser light, and stars. These lights govern day and night under God’s command.',
    teachingBody:
      'The sun, moon, and stars are created as servants, not gods. In the ancient world, heavenly bodies were often worshiped, but Genesis quietly demotes them. They are made by God and assigned their function by God. They mark days, years, seasons, and signs. Time itself is placed under divine order. This means human life is not meant to float without rhythm. God gives creation patterns: work and rest, day and night, seedtime and harvest. The lights govern, but only as delegated servants. God remains the true ruler. The stars are mentioned almost briefly, reminding us that what seems vast to us is effortless to Him.',
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
      'God’s creation moves from formed spaces to filled spaces. The seas swarm, birds fly, and the land brings forth living creatures. Life is not sparse; it overflows. For the first time in Genesis, God blesses His creatures and commands them to be fruitful and multiply. Blessing is tied to life-giving abundance. The repeated approval, "God saw that it was good," shows that physical creation matters to God. Animals are not afterthoughts; they are part of the goodness of His world. Yet this movement also prepares the reader for humanity, who will be made in God’s image and given a distinct calling.',
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
      'The creation account reaches its crown in humanity. Men and women are made in God’s image, blessed, commissioned, and placed within a very good creation.',
    contextSummary:
      'Genesis 1:26-31 describes the creation of humanity, the image of God, the human vocation to rule under God, and the declaration that creation is very good.',
    teachingBody:
      'Humanity is introduced by divine counsel: "Let us make man in our image." Unlike the rest of creation, humans are made to represent God within the world. The image of God gives every person dignity before any achievement, status, or role. Male and female together bear this image. God blesses them and gives a vocation: be fruitful, multiply, fill the earth, subdue it, and rule over living creatures. This rule is not tyranny; it is stewardship under the Creator’s authority. Humanity is meant to reflect God’s wise, life-giving care. The chapter ends not merely with goodness, but with "very good." Creation with image-bearers rightly placed under God is whole, ordered, and blessed.',
    application:
      'Treat every person today as an image-bearer. Ask whether your authority, work, and relationships reflect God’s care or merely your own control.',
    prayer:
      'Lord, restore in me the joy and responsibility of bearing Your image. Teach me to steward my life and relationships in a way that reflects Your goodness.',
    tags: 'Genesis,Image of God,Humanity,Stewardship',
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

  console.log(`Seeded ${entries.length} Genesis 1 daily exegesis entries.`);
} finally {
  await prisma.$disconnect();
}
