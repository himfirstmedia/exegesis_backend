# Downloadable book overviews (database → R2 → app)

## Build from the existing database

From `backend/`:

```bash
# Read-only inspection: no translations and no R2 writes.
npm run build:book-overview-packs -- --dry-run

# Publish every supported language using the free Google build provider.
npm run build:book-overview-packs -- --all --concurrency 2 --provider google-free

# Or publish only selected languages.
npm run build:book-overview-packs -- --languages en,fr,sw --concurrency 2
```

The script is `scripts/build-book-overview-packs.mjs`. It loads `backend/.env`
directly, then reads `DATABASE_URL` and the existing `R2_*` settings. No new
credentials, manual JSON export, database migration, or UI-pack rebuild is
required. Production uses its own injected environment variables.

There is no `isPublished` column on `BookPrologue`: the existing public prologue
API exposes saved records. Packs use those same saved prologues, with an explicit
allowlist that excludes editor IDs/timestamps and all user data. A read-only
inspection during implementation found **46 available / 20 missing**; these are
not permanent counts. Missing source books are explicitly listed, never invented
or treated as failed translations. Deleting the last record can publish an empty
catalogue with all 66 books listed as missing.

## Automatic admin updates

Automatic publication is **enabled by default when R2 is configured**:

1. Admin adds/edits/deletes a prologue through the existing backend API.
2. The database mutation succeeds; the publisher is notified without waiting for
   translation or uploads on the admin request.
3. Obsolete in-flight work is cancelled/coalesced. The publisher reads the latest
   DB snapshot and rebuilds language packs, at most two languages concurrently.
4. Unchanged books reuse their completed translations. Changed books reuse valid
   chunk checkpoints and translate the remaining commentary.
5. A complete immutable language file is uploaded first, then its manifest.
6. Active online apps check for updated manifests every minute and install only
   their selected language. Opening/changing language also triggers hydration
   and a background check when due.

The DB snapshot is the durable pending-work record. A startup/minute sweep
compares DB source revisions with published language manifests, recovering after
restarts, missed notifications, storage/provider outages and direct DB edits.
No volatile queue is the sole record of an admin change. Direct DB edits are
picked up on the next sweep rather than an immediate API notification.

**Immediate means publishing is triggered immediately, not that 39 translations
finish instantly.** English needs no translation. Other languages become current
as their builds succeed. Devices must be active/online to receive updates;
offline devices retain their last valid installation.

Optional environment overrides (defaults need no `.env` changes):

```dotenv
BOOK_OVERVIEW_PACK_AUTO_PUBLISH=true
BOOK_OVERVIEW_PACK_PROVIDER=google-free
```

Set `BOOK_OVERVIEW_PACK_AUTO_PUBLISH=false` to disable automatic work temporarily.
`runtime` uses the existing translation service chain; `google-free` explicitly
uses the free endpoint without modifying runtime provider order or selecting
paid Cloud Translation even if Cloud credentials exist.

Redis leases serialize publishers per language across instances, with renewal
and ownership checks. **Without Redis, run one backend/publisher process only**;
the existing cache lock implementation degrades to process-local operation.
Avoid starting a manual build alongside an automatic build; busy languages fail
explicitly and can be retried. Ctrl+C releases owned locks and retains completed
work; a second Ctrl+C forces exit. Crashed leases expire within 120 seconds.

## Contents and safety

Packs contain author/audience/date/location details, summary, background,
purpose, themes, lessons, applications, structure, key people, Christ connection,
and the translated book designation. Canonical book names/IDs and reference
coordinates remain unchanged for navigation.

Quoted `keyScripture` and `keyVerses` retain their original text, reference and
Bible-version attribution. They are **not machine-translated and relabelled as
a published Bible edition**. Packs translate commentary, not Scripture.

Storage layout:

```text
book-overview-packs/<source-revision>/<language>.json
book-overview-packs/manifests/<language>.json
book-overview-packs/books/<book-revision>/<language>.json
book-overview-packs/books/<book-revision>/<language>-partial.json
```

Checkpoints are not exposed by the public file route. Every final pack must cover
the source snapshot completely, including structured fields. Empty/altered-token
translations are not certified as complete; successful chunks survive failures.
Proper names and a small known French cognate allowlist may remain unchanged.
Machine translation still requires editorial review for theological accuracy.

The publisher rechecks the current DB source before publishing a manifest. Source
changes during a build leave that manifest untouched and are retried. Failed
languages retain their previous published pack. Unchanged source uses the same
revision; old revisions are not deleted.

## Read-only delivery and mobile integration

Public endpoints (available before login):

```text
GET /book-prologues/packs/:language/manifest
GET /book-prologues/packs/:language/file?revision=<12-character-revision>
```

The manifest includes revision, available count, missing books, byte count and
SHA-256. With `R2_PUBLIC_BASE_URL`, files download directly from R2/CDN. Private
buckets use the backend stream route. No bearer token is sent to the CDN.

The mobile service is `app/src/services/translation/bookOverviewPackService.ts`.
It saves files with RNFS, verifies SHA-256/schema/coverage, then commits a small
AsyncStorage installation pointer last. Interrupted/corrupt updates never replace
the old working pointer. Valid installed packs do not expire after seven days;
previously installed languages remain available offline.

`UiPackCoordinator` hydrates/syncs overviews before login without blocking app
startup. `useBookOverview` renders installed content before trying the older
per-book stream/cache fallback, and reacts to installed revisions while open.
An explicit missing-source entry shows the empty state instead of resurrecting
an older cached/deleted prologue. Without an installed pack, the existing stream
remains the compatibility fallback.

Deploy the updated backend and install the updated app to enable this flow.
Publishing files alone does not change an already-released app. Offline users
cannot receive new edits until they reconnect.

## Troubleshooting

The CLI exits nonzero for failures and reports safe codes such as
`INCOMPLETE_TRANSLATION`, `SOURCE_CHANGED`, `PUBLISHER_BUSY`, `LEASE_LOST`, or
`PROVIDER_OR_STORAGE_ERROR`, plus per-book progress. It never prints connection
strings or raw provider responses. Retry the same command to resume valid work.
Automatic logs use `[overview-packs]` and retry pending languages on later
sweeps. Check DB/R2 connectivity and provider availability if publication remains
pending. Inspect `--dry-run` to distinguish missing source records from missing
translations. Do not delete another publisher's active Redis locks.
