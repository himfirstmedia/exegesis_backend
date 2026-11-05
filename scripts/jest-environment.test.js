import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/jest-environment.cjs'), 'utf8');
const run = (env) => {
  const context = { process: { env: { ...env } }, URL };
  vm.runInNewContext(source, context);
  return context.process.env;
};

test('unit tests replace inherited database and Redis targets', () => {
  const env = run({ DATABASE_URL: 'postgresql://real.example/production', REDIS_URL: 'redis://real.example' });
  expect(env.DATABASE_URL).toContain('127.0.0.1:1/exegesis_test');
  expect(env.REDIS_URL).toBe('');
});

test('integration tests fail closed without explicit disposable database confirmation', () => {
  expect(() => run({ RUN_DB_INTEGRATION: '1' })).toThrow('TEST_DATABASE_URL');
  expect(() => run({ RUN_DB_INTEGRATION: '1', TEST_DATABASE_URL: 'postgresql://localhost/production', CONFIRM_DISPOSABLE_TEST_DATABASE: '1' })).toThrow('test segment');
});

test('integration tests use only the explicit test database', () => {
  const target = 'postgresql://localhost/exegesis_test';
  expect(run({ RUN_DB_INTEGRATION: '1', TEST_DATABASE_URL: target, CONFIRM_DISPOSABLE_TEST_DATABASE: '1' }).DATABASE_URL).toBe(target);
});
