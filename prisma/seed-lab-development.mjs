import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const passage = (bookName, chapter, verseStart, verseEnd, assignedReading) => ({
  bookName, chapter, verseStart, verseEnd,
  reference: `${bookName} ${chapter}:${verseStart}${verseStart === verseEnd ? '' : `–${verseEnd}`}`,
  ...(assignedReading ? { assignedReading } : {}),
});
const study = (id, pathway, title, purpose, scope, sessions) => ({ id, pathway, title, purpose, scope, sessions });
const entries = [
  study('book-john', 'book-by-book', 'The Gospel of John', 'Follow John’s testimony about Jesus.', 'Two starter sessions in John 1.', [
    passage('John', 1, 1, 18), passage('John', 1, 19, 34),
  ]),
  study('book-mark', 'book-by-book', 'The Gospel of Mark', 'Explore the beginning of Jesus’ ministry.', 'Two starter sessions in Mark 1.', [
    passage('Mark', 1, 1, 13), passage('Mark', 1, 14, 20),
  ]),
  study('book-ruth', 'book-by-book', 'Ruth', 'Explore loyalty and care in the story of Ruth and Naomi.', 'Two starter sessions in Ruth.', [
    passage('Ruth', 1, 1, 18), passage('Ruth', 2, 1, 13),
  ]),
  study('dev-lab-hope-plan', 'reading-plan', 'Hope in Three Days', 'Read three chapters about hope and perseverance.', 'Read the assigned chapter, then study the focus passage in the Lab.', [
    passage('Psalms', 42, 1, 5, 'Psalm 42'), passage('Romans', 5, 1, 5, 'Romans 5'), passage('1 Peter', 1, 3, 9, '1 Peter 1'),
  ]),
  study('dev-lab-prayer', 'topical', 'Learning to Pray', 'Explore what Scripture teaches about prayer.', 'Three passages on how to pray, persistence, and thanksgiving.', [
    passage('Matthew', 6, 5, 13), passage('Luke', 18, 1, 8), passage('Philippians', 4, 4, 7),
  ]),
  study('dev-lab-survey', 'survey', 'The Story of the Bible', 'Trace creation, promise, and restoration.', 'Three selected passages from across Scripture.', [
    passage('Genesis', 1, 1, 5), passage('Genesis', 12, 1, 3), passage('Revelation', 21, 1, 5),
  ]),
];

const url = new URL(process.env.DATABASE_URL || 'invalid:');
const loopback = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
const allowRemote = process.argv.includes('--allow-remote');
if (!['postgres:', 'postgresql:'].includes(url.protocol) || (!loopback.has(url.hostname) && !allowRemote)) {
  throw new Error('Set DATABASE_URL to PostgreSQL. Remote development seeding requires --allow-remote.');
}
const { prisma } = await import('../src/config/db.js');
try {
  const [target] = await prisma.$queryRaw`SELECT current_database() AS name, host(inet_server_addr()) AS address`;
  if (!allowRemote && !loopback.has(target?.address)) throw new Error('PostgreSQL did not identify itself as local; nothing written.');
  const admins = await prisma.systemUser.findMany({
    where: { email: { equals: 'admin@gmail.com', mode: 'insensitive' }, userRole: 1n, status: true, accountStatus: 'active' },
    select: { id: true }, take: 2,
  });
  if (admins.length !== 1) throw new Error('Expected exactly one active admin@gmail.com administrator; nothing written.');
  const [{ id: createdBy }] = admins;
  const plan = entries.find(entry => entry.id === 'dev-lab-hope-plan');
  await prisma.$transaction([
    prisma.labStudy.createMany({ data: entries, skipDuplicates: true }),
    prisma.readingPlan.upsert({
      where: { planId: plan.id }, update: {},
      create: {
        planId: plan.id, title: plan.title, description: plan.purpose, category: 'hope', difficulty: 'beginner',
        totalDays: plan.sessions.length, createdOn: new Date(), createdBy,
        dailyAssignments: { create: plan.sessions.map((session, i) => ({
          dayNumber: i + 1, title: session.assignedReading, chaptersJson: JSON.stringify([{ book: session.bookName, chapter: session.chapter }]), createdBy,
        })) },
      },
    }),
  ]);
  console.log(`Seeded ${entries.length} Lab catalog entries and one Reading Plan on ${url.hostname}/${target.name}.`);
} finally {
  await prisma.$disconnect();
}
