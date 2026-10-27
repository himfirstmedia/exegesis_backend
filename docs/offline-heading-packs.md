# Fast, prebuilt offline heading packs

## Release workflow

Generate headings **before users request them**, just like publishing a Bible
version file. HTTP requests never translate headings or queue generation work.

From `backend/`, with your normal `.env`/deployment environment:

```bash
# All app languages. Defaults to two language workers.
npm run build:heading-packs -- --all

# Or publish priority languages first.
npm run build:heading-packs -- --languages en,fr,sw --concurrency 2
```

The build requires the existing translation-provider models and R2 credentials.
It can take time, but that is an admin/build-time operation, never part of a
user's download. Failed languages are reported with a nonzero exit code, while
other languages continue. Re-run the command to resume stored checkpoints.
Previously generated complete packs are reused and republished compressed,
without translating them again. Do not add this command to server startup:
publish packs before releasing the app/backend instead.

No database migration or new packages are required. English remains bundled in
the app and needs no network, but the builder can publish it too.

## R2 and CDN setup

Use the existing R2 settings:

```dotenv
R2_ACCOUNT_ID=<account>
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET=<bucket>
R2_PUBLIC_BASE_URL=https://<your-public-r2-custom-domain>
```

`R2_ENDPOINT` can be used instead of `R2_ACCOUNT_ID`. The token needs Object Read
& Write access. The public base URL must actually serve the bucket; it is not
the private S3 API endpoint. Prefer a production R2 custom domain over `r2.dev`.

Enable a Cloudflare Cache Rule making **completed** `/heading-packs/.../*.json`
files cache-eligible and respecting origin Cache-Control. Exclude
`*-partial.json` and `*-manifest.json`. Completed objects have:

```
Content-Type: application/json
Content-Encoding: gzip
Cache-Control: public, max-age=31536000, immutable
```

Packs use revisioned URLs, so a source change gets a new URL rather than requiring
a cache purge. With no public domain configured, the app uses the read-only
backend file-stream route instead (still prebuilt and gzip-compressed in R2).
Private credentials and API auth tokens are never sent to the CDN.

Production requires R2. With every R2 setting blank, local development writes
uncompressed files under `backend/uploads` and serves them through the same
file-stream route. Never rely on ephemeral container disk for production packs.
Use shared Redis when running multiple builders; the renewable lock prevents
duplicate builders for a language. Without Redis, run only one builder process.

## File layout and content

```
heading-packs/bsb-<revision>/fr.json
heading-packs/bsb-<revision>/fr-manifest.json
heading-packs/bsb-<revision>/fr-partial.json
```

`fr.json` contains the **entire Bible's headings**, with canonical English book
keys, chapter keys and ordered `{ verse, heading }` entries. The manifest is
published only after the full pack upload succeeds. Checkpoints are builder-only
and are never advertised as downloadable language packs.

These are the existing shared public-domain BSB editorial section headings from
`src/modules/bible-translations/data/chapter-headings.json`, not each Bible
version's own headings or translated verses. One pack per app language therefore
works with every Bible version. If version-specific heading sets are introduced
later, use a separate heading-set identity and revision for each set.

The revision hashes the source dataset and format version. Changing the source
automatically creates a new revision. To intentionally regenerate translations
without changing the source, change the `v1:` hash salt in
`heading-pack-data.js`, then prebuild the new revision before deployment.

## Delivery API

`GET /translations/heading-packs/:language/manifest?revision=<installed-revision>`

- **200:** small `{ status: "ready", headingSet: "bsb", language, revision,
  totalBooks, bytes, url, unchanged }` descriptor, not the headings themselves.
- `unchanged: true` means the app keeps its installed pack, with no file download.
- `url` points directly at the complete CDN JSON file, or at the backend stream
  fallback when no public domain is configured.
- **404:** pack not published. Nothing is generated. Prebuild the language.
- **400:** unsupported language.
- **503:** storage outage; the app keeps any already-installed pack.

`GET /translations/heading-packs/:language/file?revision=<revision>` is the
public read-only file-stream fallback. Its explicit revision keeps the URL
immutable even across backend deployments.

The previous `GET /translations/heading-packs/:language` endpoint remains for
older apps, but is now read-only and never generates translations either.

## App behaviour

`HeadingPackCoordinator` runs independently of the active screen/login on first
launch, persisted-language hydration, language switches, reconnect and foreground.
It checks the small API manifest, then downloads **one file** directly from the
CDN using native networking (automatic gzip decoding). No generation polling or
per-chapter translation is involved. Profile shows download status and retry.

Packs are validated, installed under the persistent Documents `heading-packs`
directory, and only then registered in AsyncStorage. Existing offline files from
the previous implementation remain compatible. Revision checks run at most
daily per session and after app restart; failures retry with backoff. Chapter
navigation only reads memory/disk, and previously downloaded languages remain
available offline. Spoken chapter locations use bundled book names and UI labels.

If a language is not published or cannot be downloaded yet, section headings are
omitted rather than shown in the wrong language. Bible reading remains available.
Publish every selectable language before releasing if every language must be
immediately downloadable.

## Verification

1. Run the prebuild for a test language, configure the public domain and deploy.
2. Launch or switch to that language: network activity should show one small
   `/manifest` request and one CDN JSON request, never a generation/translation
   request for headings. The file contains all 66 books.
3. Navigate between chapters/books: no heading network requests should occur.
4. Force-close, disable networking and reopen: headings should still appear.
5. Switch away and back to an installed language: reuse its offline file.
6. Request an unpublished language: get an immediate 404 with no translation job.
