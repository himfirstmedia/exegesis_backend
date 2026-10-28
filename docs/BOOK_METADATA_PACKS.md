# Offline book names and chapter counts

From `backend/`, using your existing `.env` R2 configuration:

```bash
npm run build:book-packs
```

The script builds all catalogued editions from the existing XML/index metadata,
plus all 39 bundled book-name languages. No translation provider is called.
Actual edition availability and chapter counts are preserved (including NT-only
editions); no missing edition is replaced with a generic 66-book list.
Localized name provenance and provisional minority-language names remain as
documented in `src/modules/bible/bookNames.js`.

Validated metadata is published compressed to
`book-packs/<content-revision>/catalog.json`, then `book-packs/manifest.json`
is replaced last. A failed build exits nonzero and does not advertise partial
metadata. Run one publisher at a time. Re-running identical input uses the same
content revision. This command publishes data; it does not deploy the backend/app.

Deploy the updated backend and app. Public read-only endpoints:
`GET /translations/book-packs/manifest` and
`GET /translations/book-packs/file?revision=<revision>`.
If R2's public base URL is configured, the manifest points directly to R2;
otherwise the backend streams the file from the private bucket.

The root coordinator hydrates cached metadata and syncs while active/online,
including before login. Metadata contains no Bible text or user information.
Bible XML downloads remain gated by login/guest entry. The app stores validated
metadata in AsyncStorage, checks for revisions daily and retries failures after
one minute. Installed book metadata is used before connectivity checks, HTTP or
XML parsing. Missing/corrupt packs retain the previous book-loading fallback.

## Payment-success translation update

The Sower feedback modal now uses translated templates before interpolating
plan names. Its two new templates update the UI catalogue to revision
`f49dc01cf8f4` (3,009 strings). Publish matching UI packs before rolling out:

```bash
npm run build:ui-packs -- --all --concurrency 2 --provider google-free
```

Book packs and UI packs are separate publications. Older UI revisions are not
deleted by rebuilding, so already-released apps can keep using them.
