# Number-locale packs

Static public display metadata for all 39 app languages. No database/translation-provider access is needed to generate the files, and no account/user data is included. See `app/docs/NUMBER_LOCALIZATION.md` in the parent workspace for presentation boundaries and date/time semantics.

Endpoints:

- `GET /translation/number-packs/:language/manifest`
- `GET /translation/number-packs/:language/file?revision=<12 lowercase hex characters>`

Current files are deterministic packaged data and remain downloadable before optional R2 publication. A matching published manifest selects the public CDN URL when configured; otherwise the backend file endpoint serves the same bytes. Historical files may be streamed from R2. Unsupported languages/unsafe revisions are rejected. Download routes never translate, publish, or mutate the DB.

```bash
npm run build:number-packs -- --dry-run
npm run build:number-packs
```

The first command is read-only. The second publishes all language files and manifests using existing R2 settings. Object keys are `number-packs/<revision>/<language>.json` and `number-packs/manifests/<language>.json`. Files are compressed and immutable; the manifest is written last. Deploy backend before expecting the app's number-pack downloads to succeed; bundled digits still work against older/offline backends. Existing UI/overview packs do not need rebuilding for this feature.
