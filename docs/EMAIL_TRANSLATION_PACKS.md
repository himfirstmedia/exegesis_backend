# Localized transactional-email packs

## What changes

Transactional emails are rendered **at enqueue time** in the recipient's app
language, then stored in the `messages` table and delivered later by the email
scheduler. The language must be resolved when the message row is created,
because the scheduler only sends the stored `subject`/`message` HTML.

The English copy lives in `src/utils/email-pack-data.js` and is the single
source of truth. It uses `{{placeholder}}` tokens (for example
`Hello {{firstName}},`), which the shared pack pipeline protects and restores
byte-for-byte. English is always the fallback: a missing, corrupt or
unreachable pack never blocks an email.

The shared footer (`© {{year}} {{company}}`) is part of the same catalogue, so
the whole copyright line is translated, not just the brand. `{{year}}` is the
current year and `{{company}}` is `COMPANY_ADDRESS` (defaulting to
`emailCopy.shared.company`) passed through the translator; an operator override
that does not match a source string is rendered verbatim.

## Recipient language

The app already sends `lang` in request bodies. Each enqueue site passes it to
the template:

- `POST /auth/register`, `POST /auth/login` (unverified resend),
  `POST /auth/resend-verification`, `POST /auth/forgot-password`
- `POST /admin/users` (admin-created accounts; best effort — the recipient's
  language is not known server-side, so English is used when the admin request
  does not carry one)
- Support ticket admin notification (best effort, same caveat)

`resolveEmailLanguage()` accepts `fr`, `fr-FR`, `pt_BR`, etc., maps to a
supported primary language and defaults to `en`. There is no per-user language
column; `Activity.locale` is only a device hint, and the app-side `lang` value
is authoritative.

## Source generation and build

Run from `backend/`:

```sh
# All app languages, runtime translation chain (same as /translation/batch):
npm run build:email-packs -- --all --concurrency 3

# Specific languages:
npm run build:email-packs -- --languages en,fr,sw --concurrency 2

# Explicit free Google build-time provider (without changing runtime priority):
npm run build:email-packs -- --languages ar --provider google-free

# Ignore the published pack and carry record and re-translate every string:
npm run build:email-packs -- --languages ar --provider google-free --refresh
```

The builder mirrors `build-ui-packs.mjs`:

- bounded batches (50 strings / 10,000 characters),
- a renewable Redis lock per language,
- validated checkpoints (`-partial.json`) that resume after interruption,
- carry records that reuse unchanged copy from the previous revision,
- gzip + immutable cache on the completed pack,
- the manifest is written **only after** the complete pack uploads.

`--refresh` is for correcting a previously published pack (for example after a
provider returns truncated output). Without it, a complete pack and its carry
record are reused and no provider request is made.

Publication is an explicit admin action. Runtime request handlers only read
packs; they never generate or upload translations.

## R2 layout

```
email-packs/app-<12-hex-source-revision>/fr.json
email-packs/app-<12-hex-source-revision>/fr-partial.json
email-packs/app-<12-hex-source-revision>/fr-manifest.json
email-packs/carry/fr.json
```

The revision is derived from the English source catalogue, so editing copy
publishes a new namespace and leaves older packs intact. `objectStorage.js`
allows only these key shapes for pack objects.

## Runtime rendering

`src/utils/emailTemplates.js` exposes async template functions that accept a
language as their final argument:

```js
const { subject, html } = await emailTemplates.verification(code, firstName, lang);
```

The renderer reads `email-packs/app-<revision>/<language>.json` through
`readUiPackObject`, validates it with `completeEmailPack` (exact source count,
language, revision and token set), and builds a source→translation map. Packs
are cached in memory for five minutes per language; concurrent first loads are
single-flighted. Any failure logs a warning and renders the English source.

The HTML document's `lang` attribute is set to the resolved language. User
data (names, ticket text) is HTML-escaped before interpolation; email subjects
are filled without HTML escaping.

## Verification

```sh
npx jest --runInBand src/utils/email-pack-data.test.js \
  src/utils/emailTemplates.test.js src/utils/email-pack-builder.test.js
npx jest --runInBand
```

Tests cover source integrity, token validation, English fallback, localized
rendering, regional/unsupported tags, storage failure, escaping, builder
batches/manifest-last publication, reuse and `--refresh`.

Placeholder preservation rejects incomplete output but cannot prove linguistic
quality. Review published translations before release; `--refresh` exists so a
language can be regenerated with a different provider without deleting objects.