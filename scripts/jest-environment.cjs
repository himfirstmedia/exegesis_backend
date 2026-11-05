// Default test runs must never inherit a developer's real database target.
// DB suites are opt-in and must explicitly identify a disposable test database.
const integration = process.env.RUN_DB_INTEGRATION === '1';
const target = process.env.TEST_DATABASE_URL;
if (integration) {
  if (!target || process.env.CONFIRM_DISPOSABLE_TEST_DATABASE !== '1') {
    throw new Error('DB tests require TEST_DATABASE_URL and CONFIRM_DISPOSABLE_TEST_DATABASE=1 for a disposable database.');
  }
  const url = new URL(target);
  if (!/^postgres(ql)?:$/.test(url.protocol) || !/(^|[_-])test([_-]|$)/i.test(url.pathname.slice(1))) {
    throw new Error('TEST_DATABASE_URL must be PostgreSQL with a database name containing a separate test segment.');
  }
  process.env.DATABASE_URL = target;
} else {
  // Fail closed even if an unmocked Prisma call slips into a unit test.
  process.env.DATABASE_URL = 'postgresql://unit:unit@127.0.0.1:1/exegesis_test?connect_timeout=1';
}
// Unit tests must not contact configured Redis instances either.
process.env.REDIS_URL = '';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '1';
