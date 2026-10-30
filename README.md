# Exegesis Backend

Shared Express/Prisma/PostgreSQL API for the Exegesis mobile and web applications.

## Documentation

- [Complete backend and integrations manual](docs/PLATFORM_GUIDE.md).
- [Support notification setup, delivery diagnostics and acceptance tests](docs/support-push.md).
- [R2 account migration and verification](docs/R2_ACCOUNT_MIGRATION.md).
- [Existing API reference](docs/API.md); verify endpoint details against current routers.
- [Cross-platform documentation and PDF export instructions](../PROJECT_DOCUMENTATION.md).

The platform manual covers Google/JWT authentication, Scripture catalogues,
user data, study resources, plans, Lab, journal/export, trivia, support/realtime,
Cloudflare R2, Firebase push, Stripe, email, translation and narration.

Support pushes require Firebase Admin credentials on the backend handling the
admin reply. Run `node scripts/check-push-config.js`, then authenticated
`POST /push/test` for the intended reader. Message persistence, live sockets,
Firebase acceptance and actual phone display are separate outcomes. A working
native Daily Verse alarm does not verify server push. Keep Admin keys in ignored
local configuration or deployment secrets, never in Git or Docker images.

## Development

Configure a local ignored `.env` using `.env.example` and provision the database
and required content. Use Node.js 22 LTS (22.12 or later); Docker and CI use
Node 22 too. From this directory:

```bash
nvm install
nvm use
npm install
npx prisma generate
npm run dev
```

After switching Node versions, stop the old development server and run
`npm run dev` again. An already-running Node 20/nodemon process keeps its old
runtime even after a new terminal switches to Node 22. Production needs a
redeploy to rebuild the updated Docker image.

Tests: `npm test`. The production `npm start` script runs
`prisma migrate deploy` (never `prisma db push`) before starting the service.
Baseline the existing Railway database once with `npm run db:baseline` — see
[the platform manual](docs/PLATFORM_GUIDE.md#database-migrations).
