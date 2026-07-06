import { prisma } from '../src/config/db.js';

const prologues = [
  {
    bookName: 'Genesis',
    author: 'Moses, according to Jewish and Christian tradition',
    audience: 'Israel, being formed as God\'s covenant people',
    dateWritten: 'Traditionally placed during the wilderness period after the exodus',
    locationWritten: 'Wilderness journey context',
    purpose: 'To reveal God as Creator, explain the beginning of covenant history, and ground Israel\'s identity in God\'s promises.',
    keyTheme: 'Beginnings, creation, fall, promise, covenant, and blessing',
    summary: 'Genesis introduces the God who creates, speaks, judges sin, preserves life, and begins a covenant family through Abraham that will bless all nations.',
    mainThemes: ['Creation', 'Human dignity', 'Sin and judgment', 'Covenant promise', 'Blessing to the nations'],
    christConnection: 'Genesis anticipates Christ through the promised seed who will crush the serpent, the covenant blessing to all nations, and the pattern of God preserving life through judgment.',
  },
  {
    bookName: 'John',
    author: 'The apostle John, the beloved disciple',
    audience: 'Believers and seekers who need to see Jesus as the Christ, the Son of God',
    dateWritten: 'Approx. AD 85-95',
    locationWritten: 'Often associated with Ephesus in early Christian tradition',
    purpose: 'That readers may believe Jesus is the Christ, the Son of God, and have life in His name.',
    keyTheme: 'Jesus, the eternal Word and Son of God, gives life to those who believe',
    summary: 'John presents selected signs, conversations, teachings, death, and resurrection of Jesus to reveal His divine identity and invite saving faith.',
    mainThemes: ['The Word became flesh', 'Signs of Christ', 'Belief and unbelief', 'Light and darkness', 'Eternal life'],
    christConnection: 'John directly reveals Jesus as the eternal Word, the Lamb of God, the I AM, and the risen Lord who brings eternal life.',
  },
];

for (const item of prologues) {
  await prisma.bookPrologue.upsert({
    where: { bookName: item.bookName },
    update: item,
    create: item,
  });
}

console.log(`Seeded ${prologues.length} book prologues`);
await prisma.$disconnect();
