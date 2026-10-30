# Offline app UI translation packs

## What changes

The app prefetches a **single versioned UI language pack before login**, as soon
as a selected/persisted language and connectivity are available. This covers
onboarding, login, registration and password reset on a fresh installation.
Preferred-language Bible downloads still require login or guest entry; the
existing chapter-heading coordinator is unchanged. Language changes and reconnect/foreground retry
failed downloads. Existing services deduplicate Bible downloads; the new root
coordinator does not override a reader's manually selected edition.

The UI pack contains authored static text, not Bible passages, trivia questions
returned by the API, support messages, journal entries or other user data.
Trivia's interface uses its existing locale hook; Support's labels, categories,
FAQ questions/answers and steps use the existing support translator. Global UI
copy and all 14 screen locale hooks consume downloaded packs through the new
static-copy hook. Dynamic content continues through its current API pipeline.

`app/src/hooks/useTranslation.ts` is now an actual synchronous React hook (the
previous unused async helper posted to a legacy translate-text endpoint):

```tsx
const title = useTranslation('Support');
const copy = useTranslation(englishAuthoredCopy, bundledLocalizedFallback);
```

It renders the bundled fallback immediately and reacts when a pack installs.
Never pass user input, route IDs, API data objects or Scripture to this hook:
it recursively maps authored string values. Existing string-cache hooks consult
the same downloaded dictionary before making `/translation/batch` requests.
This preserves the current runtime provider order; it is not a provider switch.

Hard-coded JSX does not become translated merely because it was extracted.
New/static UI must use the global locale catalogue, a screen locale hook,
`useTranslation`, or Support's authored-copy mapper. The scanner collects
candidates, not executable rewrites; templates built from runtime data should
be represented as authored strings with placeholders.

## Source generation and build

Run from `backend/`, with the sibling `app/` source checkout available:

```sh
npm run extract:ui-packs
npm run check:ui-packs
npm run build:ui-packs -- --languages en,fr,sw --concurrency 2
```

The extractor merges the global English JSON, every screen's English JSON,
and authored UI string candidates in screens/hooks/components/constants. It
does not execute app code or scan `.env`, downloaded content, assets, services,
tests or credentials. Authored copy constants (`BASE_COPY`, `EXTRA_COPY`,
`SOWER_COPY`, `sharedCopy`, `inboxCopy`, …) contribute every value literal
(object values and array elements) so short labels and placeholder-led
templates (e.g. `{count} in a row`, `{count} messages`) are pack-complete even
when they do not look like sentences, as do support FAQ `keywords`. It writes
identical source catalogues to the app and
backend, with a content-derived revision. Commit both generated files and
release them together. CI can run `check:ui-packs` to catch stale catalogues.

The default builder calls the **same service as `/translation/batch`** locally,
in bounded batches (50 strings / 10,000 characters), so there is no localhost
HTTP/auth dependency. It respects existing translation configuration. To choose
the existing **free Google build-time provider explicitly**, without altering
runtime priority or selecting paid Cloud Translation:

```sh
npm run build:ui-packs -- --languages fr,sw --provider google-free
# Explicit full publication (potentially many requests):
npm run build:ui-packs -- --all --concurrency 2 --provider google-free
```

Interpolation placeholders (`{count}`, `{{name}}`, printf tokens and simple markup)
are protected before translation and restored byte-for-byte. If a provider still
alters a protection marker, that one item's literal text spans are translated
separately while its original placeholders stay out of the provider request.
Successful items are checkpointed even when another item fails; diagnostics name
the exact source index and text. No partial pack is published as complete.

Use one builder process. A normal Ctrl+C now stops scheduling, releases owned
locks and retains checkpoints. A second Ctrl+C forces immediate exit. After an
older forcibly interrupted process, allow **up to 120 seconds after it exits**
for its Redis leases to expire. Do not delete other processes' active locks.
Restarting the same command resumes valid checkpoints automatically. The Node
20 AWS SDK deprecation warning is independent of translation validation; move
to Node 22+ for future SDK releases, but it is not the cause of placeholder errors.

Use the current `backend/.env` R2 credentials, bucket and optional public base URL;
no new secrets or configuration keys are required. The script loads dotenv just
like `build-heading-packs.mjs`. Production requires complete R2 configuration.
Without R2 in development, it writes under `backend/uploads/ui-packs/` and the
API streams the file. **Publication is an explicit admin action**: app login and
HTTP GET handlers never generate or upload translations.

Existing heading publication is unchanged:

```sh
npm run build:heading-packs -- --languages en,fr,sw
```

Publish both kinds of packs for the languages you deploy. Bible versions continue
through the existing catalogue/XML download path; they are not machine-translated.

## R2 layout and API

```
ui-packs/app-<12-hex-source-revision>/fr.json
ui-packs/app-<12-hex-source-revision>/fr-partial.json
ui-packs/app-<12-hex-source-revision>/fr-manifest.json
```

Completed packs are gzip-encoded with immutable caching. A renewable Redis lock
avoids concurrent generation, validated checkpoints resume failed batches, and
the manifest is written **only after** the full file uploads. If Redis is not
available, run only one builder process. Do not serve partial files via a public
listing. A generation failure never advertises a complete pack.

- `GET /translation/ui-packs/:language/manifest?sourceRevision=<app revision>`
  returns ready metadata, revision, total count and CDN URL. An optional
  `revision=<installed revision>` sets `unchanged` when appropriate.
- `GET /translation/ui-packs/:language/file?revision=<revision>` streams the
  private-bucket/development fallback. Public R2 URLs bypass the API for file data.
- 400: unsupported language/unsafe revision; 404: not published; 409: app source
  revision differs from the deployed backend; 503: storage unavailable.

The manifest uses no-store; files use immutable revision URLs. Deploying a newer
backend does not certify a pack against an older app catalogue: old apps retain
their installed pack and fall back normally if a revision is unavailable. Keep
old immutable files while old app releases are in use. Supporting multiple
manifest source revisions concurrently would require an explicit release index;
the current manifest API advertises the deployed revision only.

## App installation and offline behavior

The app checks a manifest, downloads without forwarding its API bearer token to
R2, validates schema/language/revision, exact string count and placeholders, then
installs a temporary file before committing the metadata pointer. Files live in
RNFS `DocumentDirectoryPath/ui-packs`. On future launches, disk hydration supplies
static text offline. Manifest refresh is limited to once per day in-process;
failures retry after a minute or on an explicit forced sync. No screen transition
downloads the full file again.

English is already bundled and needs no UI pack network request. Missing,
incompatible or corrupt non-English packs never get installed as ready. Bundled
screen translations remain available; runtime text hooks still use their existing
confirmed cache and `/translation/batch` for missing content. A source catalog
candidate that is never passed through a localization hook is not magically
rewritten. Placeholder preservation rejects incomplete output but cannot prove
linguistic quality; review published translations before release.

## Verification

```sh
# backend
npx jest --runInBand ui-pack heading-pack text-to-text-translation
npm run check:ui-packs

# app
npx tsc --noEmit
npx jest --runInBand
```

Tests cover bounded generation, checkpoints, manifest-last publication, upload
failure, placeholders, unsupported requests, offline hydration, corrupt pack
rejection, download deduplication, language separation, reactive hooks, and
login/reconnect/language-change bootstrap. Native device/CDN tests remain part
of deployment acceptance; unit tests do not prove a bucket is published.
