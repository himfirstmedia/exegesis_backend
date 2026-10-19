# Cloudflare R2 account migration

## Verified migration: October 19, 2026

The `exegesis` bucket was copied from the previous Cloudflare account to the
account configured in `backend/.env` for `app.himfirstmedia@gmail.com`.
R2 access is authenticated by the account endpoint and API credentials, not the
email address. The email ownership itself must be checked in Cloudflare.

| Prefix | Objects |
| --- | ---: |
| `covers/` | 12 |
| `profile-photos/` | 10 |
| `support/` | 3 |
| **Total** | **25** |

- Total size: **16,741,356 bytes**.
- All objects were SHA-256 verified against source bytes after copying.
- Content types, cache headers, custom metadata, and other supported HTTP
  content metadata were preserved and compared after copying.
- Source inventory was checked again after copying for concurrent changes.
- All 25 destination objects were also downloaded through the public URL and
  their SHA-256 hashes matched authenticated R2 downloads.
- Public base URL: `https://pub-43e3d79507e34e51a10793bd5a620284.r2.dev`.
- The database configured by `backend/.env` had 3 profile-photo URLs,
  4 cover-photo URLs, and 1 support-attachment URL rewritten transactionally.
- No old-domain URLs remained in `SystemUser.profilePhotoUrl`,
  `SystemUser.coverPhotoUrl`, `SupportMessage.attachment`, `Message.attachment`,
  or `Message.attachmentTwo` after the update.
- Source objects were retained.

R2 folders are key prefixes. Uploading objects creates the folder view; no
separate directory creation or catalog configuration is needed for this app.

## Re-running the migration

From `backend/`:

```bash
node scripts/migrate-r2-account.js
node scripts/migrate-r2-account.js --apply --rewrite-urls
```

The first command only inventories the buckets. The second copies missing or
changed objects, verifies every source object, then updates stored media URLs.
Destination-only objects are retained. The script refuses individual objects
larger than 256 MiB; those require a streaming or multipart migration instead.

Destination settings come from `R2_*` in `.env` or process environment variables.
Source settings come from `R2_SOURCE_ACCOUNT_ID`, `R2_SOURCE_ACCESS_KEY_ID`,
`R2_SOURCE_SECRET_ACCESS_KEY`, `R2_SOURCE_BUCKET`, `R2_SOURCE_ENDPOINT`, and
`R2_SOURCE_PUBLIC_BASE_URL`. It can also read the existing commented
`OLD EMAIL CONFIGURATION` R2 block in `.env` for this cutover. Credentials must
remain outside version control.

## Production cutover

The local `.env` already uses the new account. Railway was not linked on the
migration machine, so its deployed environment could not be checked or changed.

1. Set all six destination variables in the deployed backend: `R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, and
   `R2_PUBLIC_BASE_URL`, using the new values from local `.env`.
2. Redeploy/restart every backend instance so uploads use the new bucket.
3. Re-run the migration after the last old-backend instance stops writing, to
   catch any objects uploaded since the verified snapshot.
4. Verify profile-photo, cover-photo, and support-attachment upload/read flows.

If production uses a different database from local `DATABASE_URL`, repeat URL
migration against that database too. Objects are copied independently of the
database; absolute old-domain URLs need the database rewrite to use the new URL.
