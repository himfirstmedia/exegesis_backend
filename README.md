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
npm run dev
```

`npm run dev` first applies committed migrations with `prisma migrate deploy`,
then generates Prisma Client. Both development and production startup stop if
migrations fail, rather than running against an outdated schema. These commands
use the database in `DATABASE_URL`: use a local database for isolated development.
They never reset the database or seed/replace existing content.

To backfill **titles only** for books already in the database (without creating
missing books or replacing authored titles/content), preview then apply:

```bash
npm run seed:book-prologue-titles -- --dry-run
npm run seed:book-prologue-titles -- --apply
npm run build:book-overview-packs -- --all
npm run verify:book-overview-packs
```

Backfilled headings combine the existing book name and key theme. The publisher
reuses exact-source pre-title translations and their translated themes; custom
titles are translated normally. Packs and checksums are written before the live
manifest is updated. Missing source books remain explicitly unavailable.

If Prisma reports that `book_prologues.title` does not exist, stop the server,
run `npm run db:deploy`, then restart `npm run dev`. Do not use `prisma migrate
reset` or mark the new title migration as applied without actually running it.

After switching Node versions, stop the old development server and run
`npm run dev` again. An already-running Node 20/nodemon process keeps its old
runtime even after a new terminal switches to Node 22. Production needs a
redeploy to rebuild the updated Docker image.

Tests: `npm test`. The production `npm start` script runs
`prisma migrate deploy` (never `prisma db push`) before starting the service.
Baseline the existing Railway database once with `npm run db:baseline` — see
[the platform manual](docs/PLATFORM_GUIDE.md#database-migrations).
