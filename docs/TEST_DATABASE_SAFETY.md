# Database-safe tests

`npm test` runs unit tests without the two database-dependent Bible suites.
The test setup overwrites inherited database/Redis connection settings with
unusable loopback targets. Unit tests must mock persistence. The cache service
does not open Redis connections under `NODE_ENV=test`.

Integration tests are explicit:

```sh
RUN_DB_INTEGRATION=1 TEST_DATABASE_URL='postgresql://localhost/exegesis_test' CONFIRM_DISPOSABLE_TEST_DATABASE=1 npm run test:integration
```

Use **only a disposable database**. The database name must contain a separate
`test` segment. Never reuse a production or shared development database, even
if its name matches. The confirmation is an operator assertion, not proof that
the target is disposable. A database name alone cannot establish safety.

Apply the schema and seed required Bible explanation fixtures in that disposable
database before invoking the integration suites. No migrations or seeding are
automatically run by the test command. The highlight suite creates/removes its
own uniquely named test user; the explanation suite still needs seeded content.

Do not use backend APIs to create user-facing test entries in shared environments.
