# Normalization deployment assessment

Date: 2026-11-17. Target: the native **local** `exegesis` Railway snapshot.

## Verdict: not ready

The additive schema is applied locally, but the normalization rollout is not
complete. No production database changes or deployment were performed.

## Checks performed

| Check | Result |
| --- | --- |
| Backend complete unit suite | 99 suites, 895 tests passed |
| Web complete unit suite | 478 tests passed |
| Web TypeScript + production build | Passed; existing large Bible chunks and stale Browserslist warning |
| App complete unit suite | 218 suites passed, 5 failed; 1,938 tests passed, 16 failed |
| App typecheck | Passed, zero errors |
| Reader/admin login and HTTP smoke | 14 checks passed, including missing-token 401 and reader-to-admin 403 |
| Prisma validate | Passed; two existing required-creator/SetNull warnings |
| Prisma migrate status | All 28 local migrations applied |
| Prisma database-to-schema diff | No difference detected |
| New normalization migration checksums | Match applied records |
| Immutable source/backfill verification | Failed safely on edited daily verse `70` |
| Complete read-only migration/data audit | NO-GO: findings below |

The HTTP smoke mounted actual auth/admin/Bible routes on an ephemeral loopback
server, without importing application bootstrap or starting workers. Credentials
and JWTs were not written to test files or reports. Successful logins updated
local login metadata only; no editorial saves were made. These checks prove
current legacy API compatibility, **not** normalized end-to-end behavior.

ADB device connectivity was confirmed. No APK was built. Authenticated browser
and physical-device normalized flows remain unverified; the feature modules are
not yet wired to shared storage. Testing the currently production-targeted UI
would not validate the local normalization changes.

## Blocking findings

1. **Module integration remains pending.** Bible/admin CRUD, public/AI/resource/
   Strong's consumers, translation and dependent-cache handling must be connected
   and tested together. See `ROLLOUT.md` for the complete module matrix.
2. **Daily verse `70` changed after backfill.** The source's word studies differ
   from the shared study. Other raw changes include display time, collection JSON
   representation and modification timestamp. Preserve the source edit and
   original evidence; reconcile explicitly before enabling shared reads.
3. **Four original records require review.** Explanation `137` contains Isaiah
   12:0; devotions `1`, `4`, `5` contain conflicting populated study sections.
4. **Two historical migration checksums differ from repository files:**
   `20260506101147_add_journal_system` and
   `20260903000000_add_verse_explanation_normalized_sections`. Their recorded
   checksums were confirmed unchanged in the original Railway dump, so these
   mismatches predate the local normalization work. Review migration history;
   do not rewrite applied files or database checksums as an automatic repair.
5. **App test suite is not green.** Failures are in:
   - `app/__tests__/BibleGuestActions.test.tsx`: missing highlight data in the
     mocked multi-selection hook (7 failures).
   - `app/__tests__/adminHooksWave.test.tsx`: missing `useOptionalLanguage` mock
     (5 failures).
   - `app/__tests__/fileSizeConvention.test.ts`: two hooks exceed line limits
     (1 failure).
   - `app/__tests__/LegalScreenChunks.test.tsx`: expected skeleton absent
     (1 failure).
   - `app/__tests__/BibleReaderLoadingUi.test.tsx`: expected watermark opacities
     differ from the current lighter watermark (2 failures).

Explanation `137` also has an apparent raw fingerprint difference from tied
theme ordering. The six theme rows are otherwise identical; this is distinguished
from the actual editorial change on verse `70`. No evidence was rewritten.

## Private result artifacts

Under `/tmp/opencode/exegesis-local-migration/`:

- `backend-readiness-tests.json`
- `web-readiness-tests.json`
- `app-readiness-tests.json`
- `authenticated-http-smoke.json`
- `deployment-migration-audit.json`

Do not run the immutable-snapshot backfill as an editorial synchronization job.
Do not remove legacy columns, deploy the cutover, or enable notification workers
against copied real recipients on the strength of the schema checks alone.
