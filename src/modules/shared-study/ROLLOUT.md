# Shared-study rollout checklist

This is an additive, staged migration. **The feature modules still use legacy
storage. The new repository/client are not a completed cutover.** Do not remove
legacy content or run the backfill against production.

## Verified locally at the original backfill checkpoint

- 62 sources have immutable migration evidence; source hashes still match.
- 58 linked sources round-trip through `hydrateStudies` in their legacy DTOs.
- Four pending sources remain unlinked and preserve their own text.
- Shared writes and source links run in the caller's transaction. New attachments
  may only merge missing/equal content; populated conflicts abort the transaction.
- Linked editorial replacement requires the current shared-study version.
- Compound Strong's identifiers survive; missing dictionary entries remain
  unresolved identifiers rather than fabricated definitions.
- A forced local rollback restores shared content, child rows, source links and
  identifier additions. Verification imports Prisma only, not application startup
  or email/push/publishing workers.

Run unit checks with `npx jest --runInBand src/modules/shared-study`.
Run guarded local verification with `node scripts/verify-local-studies.mjs`.
The latter checks the pre-cutover migration inventory and intentionally refuses
changed source hashes. It is not a repair or post-editorial reconciliation script.

## Latest deployment assessment — 2026-11-17

**NO-GO for deploying the completed normalization rollout.** See
`DEPLOYMENT_CHECK.md` in this directory for the full test results and blockers.
The immutable-snapshot verification now correctly fails for daily verse `70`:
its source was edited after the backfill, and its shared word studies are stale.
Do not overwrite that edit or modify the original receipt to hide the difference.

For a complete read-only inventory (rather than stopping at the first mismatch):

```sh
node scripts/audit-local-study-migration.mjs --report=/tmp/opencode/exegesis-local-migration/deployment-migration-audit.json
```

This audit exits nonzero while data/integration gates remain open. It checks
migration checksums, immutable evidence, pending sources and populated-content
differences. Equal `sortOrder` children that only arrive in a different SQL row
order are reported separately from actual source edits.

## Integration gates (all pending)

| Consumer | Required before switching storage |
| --- | --- |
| `admin/service.js` | Transactional daily verse/devotion create/update; hydrated lists and localized `source` edit DTOs; 409 responses for reviewed-content conflicts; deletion must retain shared studies. |
| `bible/service.js` | Explanation CRUD in the same transaction; no fabricated lexical entries; daily/date/list readers; root-only rich fallback; preserve passage range and editorial edition. |
| `bible/dailyContentTranslation.js` | Structured cross-reference quotation/commentary translation, without translating passage identity or Strong's IDs. |
| `landing/service.js` | Shared explanation/application in public daily verse before shaping/caching. |
| `push/service.js` | Hydrate daily content before formatting; test the formatter only, never send to copied recipients. |
| `ai/service.js` | Add shared link to narrow explanation selects; shared hydration before context generation; invalidate in-memory as well as Redis caches. |
| `verse-resources/service.js` | Hydrated rich explanation composition and exports; distinguish independent resource editorial content from linked study content. |
| `strongs/editorialWords.js` | Read shared contextual words (including compound/unresolved IDs), suppress superseded legacy links and retain standalone/resource attachments. |
| `services/accountDeletion.js` | Delete owned feature rows only; shared studies and migration evidence must survive. Review any source-evidence privacy/redaction policy separately. |
| Caches | Invalidate all dependent dates/languages, Bible explanations, landing, resources and AI after successful shared commits; never invalidate as proof of a failed commit. Prevent stale in-flight refill. |
| Backfill | Once editors write, source fingerprints necessarily diverge. Do not rerun the immutable-snapshot backfill as a synchronization job. |

Count/filter-only queries do not need DTO hydration. Selected-field readers can
use `sharedStudyReaders`; daily writes can use `writeDailyContent`. Do not switch
reads independently of writers and cache invalidation: legacy-only saves would
otherwise silently leave shared content stale.

## Pending source review

- Explanation `137`, Psalms 1:3: cross-reference `9` is Isaiah 12:0.
- Devotions `1`, `4`, `5`: differing populated study sections for an existing
  same-passage/edition study. No automatic source winner is authorized.

## End-to-end gates

Use the local Railway snapshot only. Start HTTP routes without normal bootstrap
jobs; service settings remain unchanged. Verify reader/admin web and adb/Metro
flows only after the integration gates pass. Never save to production, send
notifications, or run copied-recipient queues as part of normalization tests.
