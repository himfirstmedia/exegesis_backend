---
title: "Exegesis Backend and Integrations Manual"
subtitle: "Volume 4 - APIs, Data, Services, Workflows, and Operations"
author: "Him First Media"
date: "2026-10-20"
lang: en
---

# Scope

This manual documents the Node.js backend shared by mobile and web. It includes
API modules, durable data, authorization, Bible sources, notifications, R2 media,
subscriptions, realtime support, translation, voice and operational workflows.
Use it with the [project guide](../../PROJECT_DOCUMENTATION.md),
[mobile manual](../../app/docs/APPLICATION_GUIDE.md) and
[web manual](../../web/docs/APPLICATION_GUIDE.md).

Source code and deployed configuration remain authoritative. The existence of
an endpoint does not mean all of its data/providers have been provisioned in a
particular environment.

# Architecture and startup

| Component | Responsibility |
| --- | --- |
| Node.js / Express 5 | HTTP server and feature routers |
| Prisma / PostgreSQL | Users, content, study state and operational records |
| XML files and indexes | Published Bible text and precomputed metadata |
| Redis / process caches | Optional reusable responses and feature caches |
| Firebase Admin | Push delivery and project-aware credentials |
| Cloudflare R2 | Persistent uploaded media |
| Stripe | Checkout, portal, subscription state and events |
| Nodemailer / SMTP | Account and scheduled email |
| Socket.IO | Authenticated user/admin realtime events |
| Translation/voice services | Non-Scripture localization and spoken content |
| PDF utilities | Journal and study-session exports |

`src/bootstrap.js` loads environment variables before importing the server.
`src/server.js` validates required configuration, initializes services, connects
the database, mounts routers, starts background tasks and attaches Socket.IO.
The default port is 5001. `/health` returns a timestamped health response; it
should not be treated as a full probe of every third-party integration.

JWT secret is required. Object-storage validation rejects incomplete R2 settings
and requires R2 in production. Firebase push initialization checks an explicit
service-account project against the configured expected project.

# API conventions

- Many operations use POST, including reads. Check each module's `route.js`
  rather than assuming REST verbs from a screen name.
- Application responses commonly use `returnCode`, `returnMessage` and
  `returnData`. Binary audio, PDFs, files and streamed media differ.
- Protected requests use `Authorization: Bearer <application JWT>`.
- Optional-auth routes can serve anonymous requests without granting all
  authenticated privileges.
- Clients can include a selected `lang`; content translation remains distinct
  from the requested Bible version.
- HTTP error status and the response envelope both matter to the clients.
- Transient database unavailability can produce `503` rather than invalidating
  a good session. Clients should only retry safe/explicitly opted-in requests.

The server accepts JSON/form bodies up to its configured 15 MB limit. Some
uploads have stricter feature validation. `/uploads` serves local development
files, `/assets` serves public static assets and `/media/<key>` proxies eligible
R2 objects when clients use that URL form.

# Module and capability directory

| Prefix | Capabilities |
| --- | --- |
| `/auth` | Registration, verification, login, Google completion, profile, passwords and media uploads |
| `/admin` | User/activity management, daily content and subscription administration |
| `/bible` | Highlights, favorites, notes, history, daily content and home statistics |
| `/translations` | Catalogue, metadata, XML downloads, verse retrieval and search |
| `/reading-plans` | Plans, daily assignments, quizzes and user progress |
| `/journal` | Entries, prompts/templates, discovery, likes, moderation and exports |
| `/exegesis` | Guided-study sessions, stage progress, resume/history and PDF |
| `/strongs` | Original-language dictionary, word and verse mappings |
| `/study-tools` | Chapter study content and administrative editing |
| `/book-prologues` | Book context/overview content |
| `/verse-resources` | Passage resources, comparisons and section counts |
| `/trivia` | Questions, answers, performance, offline packs and admin analytics |
| `/popular-searches` | Popular-search recording/query/maintenance features |
| `/ai` | Template/context-based explanations and prompt generation |
| `/translation` | Text/batch translation, detection, language and service status |
| `/tts` | Voice list, speech, timed speech and status |
| `/push` | Token registration/removal, settings and test notification |
| `/subscriptions` | Checkout, billing portal, tier list and status |
| `/landing` | Public landing-page content and summaries |
| `/support` | User tickets, admin inbox, attachments, unread state and replies |
| `/webhooks/stripe` | Raw-body, signature-verified billing events |

# Identity and authorization

## Email account lifecycle

```text
/auth/register -> persist account/verification -> email delivery
  -> /auth/verify-account or verification-code flow
  -> /auth/login -> profile, role, tier and application JWT
```

Other routes cover resend verification, refresh, logout, current-user retrieval,
profile update, forgotten/reset password, password setup/change and forced
password changes. Activity records retain login-related events and metadata.
Email delivery depends on SMTP and any pending-message scheduler state.

## Google identity

1. Client obtains a Google ID token from native Google Sign-In or the browser popup.
2. `OAuth2Client.verifyIdToken()` validates it against configured audiences.
3. Verified email/identity claims determine the account, not untrusted profile fields.
4. Existing users receive an application session.
5. New users receive a signed, short-lived `registrationProof` for completion.
6. Completion validates the proof and creates/finishes the application account.

The service retains transition compatibility paths, including the deprecated
`googleId` proof alias. Accepted client IDs are configured through
`GOOGLE_OAUTH_CLIENT_IDS`, `GOOGLE_CLIENT_ID` and `GOOGLE_WEB_CLIENT_ID`;
single-client settings are merged into the audience set, not used only when the
allowlist is absent. The committed example targets `exegesis-bd116` clients.

Changing these variables restricts accepted application audiences. It does not
restrict ordinary sign-in to one human Gmail address.

## Roles, tiers and account state

Required auth verifies the application JWT and checks the account exists and is
not disabled/deleted. Transient database errors fail protected access with an
appropriate service error. Admin middleware checks role `1` from authenticated
claims. Socket authentication additionally reads the current database role.

Tier ranks are Free, Legacy Sower and Covenant Sower, with monthly variants at
the corresponding rank. Tier middleware checks stored subscription/expiry;
administrators bypass tier gates. Journal, reading-plan and Lab APIs generally
require at least Legacy Sower. Some resource/read endpoints are public while
advanced search or mutations are gated. Do not infer a universal paywall from
one screen's client-side behavior.

Tokens default to no expiry under the documented configuration unless
`JWT_EXPIRES_IN` is set. Account-state checks, token storage and expiry policy
are separate operational concerns. CORS currently reflects/allows origins in
the server callback, even though it builds an origin list; that list is not
currently an enforced origin restriction.

# Data model and source ownership

| Domain | Important Prisma models |
| --- | --- |
| Identity | `SystemUser`, `Role`, `Activity`, `Verification` |
| Billing | `SubscriptionTier`, `SubscriptionEvent` and Stripe fields on users |
| Daily content | `DailyVerse`, `DailyDevotion`, `DailyExegesis` |
| Personal Scripture data | `ReadHistory`, `Favorite`, `Highlight`, `Note` |
| Explanations | `VerseExplanation`, study metadata, word studies, applications, cross-references and themes |
| Plans | `ReadingPlan`, `DailyAssignment`, `QuizQuestion`, `UserPlanProgress`, `UserQuizAnswer` |
| Journals | `JournalEntry`, `JournalLike`, `JournalPrompt`, `JournalTemplate` |
| Original-language study | `StrongsDictionary`, `VerseWord`, word-study relations |
| Guided Lab | `ExegesisSession` and optional linked journal entry |
| Search | `SearchIndex`, `BibleTopic`, `PopularSearchLog` |
| Study resources | `VerseResource`, `ChapterStudyTool`, `StudyToolWord`, `BookPrologue` |
| Trivia | `TriviaQuestion`, `TriviaAnswer` |
| Notifications | `PushToken`, `PushSetting` |
| Support | `SupportTicket`, `SupportMessage` |
| Operations | `Message` outbound email records and `SiteSetting` |

Published Scripture is also held in XML files rather than treating the user-data
tables as the only Bible source. User records and R2 objects must be backed up
and migrated separately. Mobile SQLite is a client cache/queue, not a replacement
for PostgreSQL shared state.

# Bible catalogue, reading and search

## Scripture sources

Bible XML is discovered from
`src/modules/bible-translations/Holy-Bible-XML-Format/`. The service normalizes IDs,
parses files, caches parsed documents with a bounded LRU and uses precomputed
books/chapter metadata. Committed/generated indexes avoid repeatedly scanning
large files. `BIBLE_INDEX_CACHE_DIR` can override the generated index location.

Useful routes include:

| Method and route | Purpose |
| --- | --- |
| `GET /translations/catalog` | Available texts, optional language filtering |
| `GET /translations/:translationId/metadata` | Translation metadata |
| `GET /translations/:translationId/download` | Download source XML |
| `POST /translations/:translationId/books-with-max` | Book/chapter-count metadata |
| `POST /translations/:translationId/verses` | Chapter verses |
| `POST /translations/:translationId/verses-batch` | Batch chapter retrieval |
| `POST /translations/:translationId/verse` | Individual reference lookup |
| `POST /translations/:translationId/search` | Basic single-version search |
| `POST /translations/search-fts` | Gated full-text search |
| `POST /translations/search-cross` | Gated cross-version search |

Advanced search uses indexed database content, including PostgreSQL `tsvector`
and GIN indexing. Its availability depends on index/data preparation. Basic XML
search and published-version retrieval are separate paths.

## Reader personal data

`/bible` provides authenticated add/get/delete operations for highlights,
favorites, notes and read history. It also exposes last-read position, home
statistics and recent activity. Full references and user ownership determine
personal data identity. Client offline queues eventually replay selected normal
API mutations; there is no separate general-purpose sync endpoint.

## Daily and study content

Daily verse/devotion/exegesis queries are available by today/date/reference as
implemented. Editorial publish state and schedule determine results. Study
modules provide explanations, book context, Strong's mappings and structured
resources. Missing study records must be represented as unavailable/empty data,
not fabricated original-language mappings.

# Journal, guided Lab, plans and trivia

## Journal lifecycle

```text
Create/update entry -> store original content and Scripture associations
  -> list/filter/favorite -> optionally publish/discover/like
  -> request localized view or raw content -> export selected/all entries
```

Journal routes include create/update/delete/get/get-all/get-by-verse, statistics,
favorite/like operations, public discovery, Strong's-related search and
TXT/JSON/PDF export.
Prompts/templates have separate administrative operations; admin routes also
support journal retrieval, publication and deletion.

Localized viewing is not the same as overwriting the user's original entry.
Content-language information and raw retrieval support correct editing/cache
behavior. List cards avoid translating every full entry merely to display a
summary. PDF outputs follow export services and available font/content support.

## Exegesis sessions

`/exegesis/start`, `/current`, `/history` and `/:id` manage session creation,
resume and review. `/:id/progress` saves without advancing a stage. Look, Listen,
Learn and Abide stage routes persist observation notes, listening/timer state,
learning notes, reflection, prayer, application and tags as appropriate.
Sessions can be abandoned or completed and linked to a journal entry.
`/:id/pdf` exports a session. Apply is a UI concept represented in application
fields, not a separate persisted backend stage route.

## Reading plans

User operations cover lists/categories/details, starting/removing a plan,
assignments, user progress, day completion, quiz submission and answer statistics.
Admin operations cover plan CRUD, assignments and quizzes. Plan content and user
progress are separate records; creating a plan without daily assignments does
not populate future readings automatically.

## Trivia

Trivia routes supply random/current questions, submissions, answered IDs,
statistics/performance and mobile offline packs. Admin CRUD and aggregate,
per-user and per-question analytics are separate operations. Cached packs allow
client-side offline participation; server submission still validates the result.

# Cloudflare R2 storage

## Storage contract

The backend receives supported media, validates it through upload helpers and
writes object bytes using the S3-compatible R2 client. Supported extension/MIME
handling includes JPEG, PNG, WebP and PDF, subject to each feature's restrictions.
Allowed key families are UUID-based objects under:

```text
profile-photos/<uuid>.<extension>
covers/<uuid>.<extension>
support/<uuid>.<extension>
```

These are prefixes, not separately created directories. The application does
not require R2 Data Catalog configuration for normal media storage.

| Variable | Meaning |
| --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account identifier |
| `R2_ACCESS_KEY_ID` | S3 API access key, backend-only |
| `R2_SECRET_ACCESS_KEY` | S3 API secret, backend-only |
| `R2_BUCKET` | Destination bucket, currently `exegesis` in the migration |
| `R2_ENDPOINT` | Account-specific S3 API URL |
| `R2_PUBLIC_BASE_URL` | Optional r2.dev/custom public URL |

When public base URL is configured, stored client-facing URLs use it. Otherwise
storage URL resolution can use `/media/<key>`, served by the backend proxy.
The proxy validates the key shape and streams the object. It is not a per-user
signed/private attachment access layer. Public bucket URLs are public as well.

With no R2 configuration outside production, uploads can fall back to local
`backend/uploads`. Once R2 is configured, upload errors are surfaced rather than
silently writing to ephemeral local disk.

## Account migration

The verified October 19 migration copied 25 objects/16,741,356 bytes, preserving
paths and content metadata. Source and destination were SHA-256 checked, all new
public URLs were downloaded/verified, and eight stored media URLs were rewritten.
These are dated results, not an automatic guarantee about later uploads.

The reusable migration script inventories all keys with pagination, copies
missing/changed objects, verifies content and supported metadata, checks source
inventory stability and optionally rewrites known database media fields inside
a transaction. It retains source and destination-only objects and refuses
individual objects over 256 MiB.

```bash
node scripts/migrate-r2-account.js
node scripts/migrate-r2-account.js --apply --rewrite-urls
```

Run from `backend/`. Source settings use `R2_SOURCE_*` or the existing commented
old-account block in local `.env`; destination uses active `R2_*` variables.
See [R2 migration instructions](R2_ACCOUNT_MIGRATION.md) for the production
cutover. Copying media does not migrate account ownership, bucket policies,
custom-domain DNS, CORS or the relational database itself.

# Firebase and push notifications

## Project configuration

Expected project is `exegesis-bd116`. Configure `FIREBASE_PROJECT_ID` and one of
`FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` using that
project's service account. The backend checks explicit project mismatch during
initialization. Mobile/web OAuth configuration and push sender must agree with
their intended project, but backend audience allowlisting is a separate setting.

SDK initialization alone is not proof that application-default credentials are
available on a host. Startup/send credential verification requests an access
token; unavailable credentials disable sending with an explicit diagnostic.
From `backend/`, run `node scripts/check-push-config.js` without printing private
keys or OAuth/device tokens. Restart the backend after changing its environment.
The Android `google-services.json`, enabled FCM V1 console setting and browser
VAPID public key do not replace the server's Admin credential. Configure that
credential on each actual deployment, not just in a developer's `.env`.

## Token lifecycle and delivery

Authenticated `/push/register-token` binds a platform/token to the current user
and accepts `platform` (`web`/`android`/`ios`) plus an optional IANA `timezone`.
`/unregister-token` removes only that user's matching registration. Settings and
updates are authenticated; invalid timezones return HTTP 400. Clients register
after login/restore, refresh rotated tokens and unregister on logout/disable.

Firebase Admin sends with `sendEach()`. Invalid or mismatched-sender tokens are
pruned according to send results. Tokens are project-specific; they cannot be
copied unchanged between Firebase senders. Payloads are sent high-priority with
Android channel/sound, APNs alert priority and a webpush urgency header; `data`
values are stringified and external links are rewritten to the `CLIENT_URL`
origin so a push cannot redirect a browser to an attacker-controlled host.

Authenticated `POST /push/test` targets the calling account's registered devices:

| Result | Meaning |
| --- | --- |
| HTTP 200 with `sent > 0` | Firebase accepted at least one token's send; not proof of phone display/read |
| HTTP 503 / disabled | Firebase Admin configuration or credential availability failed |
| HTTP 409 / no tokens | The account has no registered device token |
| HTTP 502 / rejected send | No token's send was accepted; inspect returned `errorCodes` and server logs |

This endpoint does not bypass account authentication or send to a caller-supplied
arbitrary token. The credential check script does not send a notification.
An optional `platform` (`web`, `android`, `ios`) scopes the test to that device
class; invalid values return HTTP 400. Browser controls use `platform: "web"`.

## Web daily-verse scheduler

The backend scheduler delivers **browser** reminders only. Native apps schedule
their own local notifications (see the app guide), so the server never duplicates
or reschedules a device alarm. The sweep runs every minute and:

1. Selects enabled `PushSetting` rows (all platforms considered, `web` tokens
   targeted at send time).
2. Computes each user's local clock in their stored IANA timezone.
3. Fires only within a 5-minute grace window after the saved `reminderTime`, so a
   briefly missed cron tick is recovered but a stale reminder hours later is not.
4. Deduplicates on the recipient's **local calendar day** (`lastPushedOn`
   compared in their timezone), not UTC midnight.
5. Claims the send with a compare-and-set `updateMany` over the exact setting
   row, which also prevents two backend replicas from sending the same user/day.
6. Releases the claim when no device accepted the notification, so the next tick
   can retry.

A user with no valid timezone or a malformed `reminderTime` is skipped. No
separate automated plan-reminder sweep exists; reading-plan reminders are local
to each device.

## Support-message push

Replying to a support ticket fans out a `support-message` push: a user reply
notifies active admins, and an admin reply notifies the ticket owner. The sender
is always excluded, so a user never pushes to themselves. The payload carries
`kind: "support-message"`, `audience`, `screen`, `ticketId`, `messageId`, a
per-message `notificationId`, notification title/body and a native `deepLink`
(`exegesis://support/<ticketId>?messageId=<messageId>`). The separate `link`
field points to `/support?ticketId=...` or `/admin/support?ticketId=...` on the
browser origin. Supported image payloads can carry an image URL; configure a
reachable `BACKEND_URL` for relative backend media and public/proxy access.

Push failures are logged but never undo the already-persisted message or the
realtime event. Admin reply data includes `pushDelivery.sent` and a status:
`accepted`, `unavailable`, `no_devices` or `failed`. The web inbox distinguishes
"reply saved" from "phone notification accepted by Firebase"; acceptance is not
an OS delivery/read receipt. Do not retry the message itself merely because push
failed, as that would create duplicate chat content. No durable per-support-push
retry queue is provided; reconnect recovery retrieves persisted messages.

FCM support delivery is independent of the daily-verse cron sweep and must not
be restricted to web tokens. Native daily reminders use local alarms, so a
successful Daily Verse alarm is not an Admin-credential test. See the detailed
[support push runbook](support-push.md) for environment alignment and live tests.

Web additionally needs a VAPID public key and supported worker/permission setup.
iOS needs APNs configuration. Android support push needs matching application
configuration, notification permission and the `exegesis-default` channel. The
separate user-granted `SCHEDULE_EXACT_ALARM` permission is for precise offline
reminders; it is not a permission requirement for remote support push.

# Text translation and narration

## Text translation

`/translation` provides single text, batch text, detection, language list and
status endpoints. Validation and request/character rate limiters apply. Supported
providers include LibreTranslate, optional Lordsbook text translation and
MyMemory fallback for uncovered language scenarios, controlled by configuration.
Provider queues, concurrency limits, time budgets, caches and circuit breakers
bound latency and recovery behavior.

Provider language coverage differs from the 39 registered client interface
languages. `fil`/`tl` mapping is one example. A registered interface code does
not guarantee every provider or Bible dataset exists for it. Source-language
fallback is preferable to presenting missing translated material as complete.

The web also uses Google Translate Element for rendered UI, independently of
these APIs. Published Scripture is retrieved from a selected Bible dataset; the
mobile reader does not machine-translate it merely because its UI language changed.

## TTS

Routes are `POST /tts/speak`, `POST /tts/speak-with-timings`,
`GET /tts/voices` and `GET /tts/status`. Audio responses differ from ordinary
JSON envelopes. Timed responses support playback synchronization where available.

`LORDSBOOK_TTS_ENABLE` is the authoritative provider flag. When disabled the
service uses Edge; legacy `TTS_PROVIDER` does not override that flag. When
Lordsbook is enabled but synthesis fails, Edge fallback can retain an appropriate
voice identity/language. Rate-limit handling, socket pooling, serialization,
timeouts and circuit breakers protect provider failures from cascading.

Mobile can fall back to installed device TTS. That fallback lives in the client,
not as a server download of every language's speech. Voice availability and
quality depend on the provider/device.

## AI-labelled study helpers

`/ai/explain` and `/ai/generate-prompt` currently use local templates, themes,
genre rules, Scripture text, prologue/context data and caches. No external
OpenAI/Azure model integration is implied by the module name. Document any future
provider change explicitly, including how generated content differs from curated
study resources and published Scripture.

# Subscriptions and Stripe

## Verified packages, intervals and amounts

The following amounts were checked by read-only database and Stripe requests
using the local backend environment on October 20, 2026. Stripe reported
**test mode**, not live production. See the
[subscription data snapshot](SUBSCRIPTION_DATA_SNAPSHOT.md) for evidence and
source differences.

| Package | Monthly USD | Annual USD | Entitlement IDs |
| --- | ---: | ---: | --- |
| Free Reader | 0.00 | 0.00 | `free` |
| Legacy Sower | 3.33 | 33.33 | `legacy_sower`, `legacy_sower_monthly` |
| Covenant Sower | **7.78** | 77.77 | `covenant_sower`, `covenant_sower_monthly` |

The database had three active rows: Free Reader (`none`, $0), Legacy Sower
(`year`, $33.33, `maxSlots=1000`) and Covenant Sower (`year`, $77.77, no cap).
There were **no monthly database rows**. Monthly prices were present through
the environment-linked Stripe prices. The emergency backend fallback still
specifies Covenant **$7.77/month**, so that value and the verified $7.78 charge
configuration must not be presented as already reconciled.

The database's benefits were "Bible reading / Daily verse / Basic tools",
"Full Legacy Ledger and study tools", and "Full access and future modules"
respectively. Descriptions were null. The environment-linked Stripe products
had no feature metadata, so the public Stripe-derived tier response can have
empty paid-benefit arrays even though the web displays curated feature copy.

## Benefit and access matrix

| Capability | Free | Legacy | Covenant |
| --- | --- | --- | --- |
| Published Bible reading, daily verse | Available routes | Included | Included |
| Personal highlights/favorites/notes/history | Authenticated user | Included | Included |
| Basic translation search | Available route | Included | Included |
| Advanced/cross-translation search | Tier gate | Legacy rank | Higher rank passes |
| Journal, full ledger, journal export | Tier gate | Legacy rank | Higher rank passes |
| Reading plans/progress and Lab sessions/PDF | Tier gate | Legacy rank | Higher rank passes |
| Prayer/reflection, advanced analytics, early access copy | Marketed as excluded | Marketed as excluded | Marketed as included |

The last row is product/comparison-page messaging, not proof of separate
Covenant-only endpoint enforcement. No Covenant-specific `requireTier` route was
found in the audited backend. Some explanation and word-study/resource reads
are public despite premium marketing wording. Monthly/yearly variants have
the same rank. Administrator role `1` bypasses tier checks even if that user's
stored paid tier is `free`; subscription and admin role are independent.

## Price and catalogue resolution

1. Public `POST /subscriptions/tiers` retrieves environment-linked Stripe products
   and yearly/monthly prices, with a five-minute process cache.
2. If those are unavailable, it returns ordered `SubscriptionTier` database rows.
3. If neither source yields tiers, it returns hard-coded fallback packages.
4. Admin `POST /admin/subscription-tiers/list` reads the database directly.
5. Checkout resolves the chosen family/interval's database row first, then its
   corresponding environment price ID.

Database-linked and environment-linked products currently differ. Therefore a
database tier edit, a public card, and checkout can read different price sources.
Database `price` is in dollars; Stripe `unit_amount` is in cents. Do not compare
`333` to `3.33` without conversion.

## Database fields administrators are managing

| Record | Important fields | Meaning |
| --- | --- | --- |
| `SubscriptionTier` | `id`, name/description, price/currency/interval, `features`, `isActive`, `sortOrder`, `maxSlots`, Stripe product/price IDs | Offer definition; not a user's current purchase |
| `SystemUser` | `subscriptionTier`, `accessExpiresAt`, `stripeCustomerId`, `stripeSubscriptionId`, `legacySowerSlot`, `supporterBadgeText` | User entitlement and billing association |
| `SubscriptionEvent` | User, event type, tier, Stripe event ID, metadata, timestamp | History/reconciliation record, not a second active subscription |
| `SystemUser` account controls | `userRole`, `status`, `emailVerified`, `accountStatus`, `mustChangePassword`, `deletedAt` | Role, activation, verification, suspension/deletion and first-login workflow |
| `Role` | Numeric ID, stored role name/description | ADMIN (`1`) or USER (`2`) in the inspected database |

Changing one field does not imply changing all others. For example, granting a
tier does not charge a card; promoting to ADMIN does not create a paid Stripe
subscription; recording `suspended` does not itself cancel billing; and deleting
the tier definition does not erase invoices or customer history.

## Customer checkout, upgrade and cancellation

```text
Authenticated user -> create-checkout-session -> Stripe-hosted checkout
  -> signed event to /webhooks/stripe -> persisted entitlement/events
  -> client refreshes /subscriptions/status
```

`create-checkout-session` accepts a base family (`legacy_sower` or
`covenant_sower`) and `interval` (`month` or `year`). It resolves/reuses a Stripe
customer rather than deliberately creating a new customer per purchase.
Legacy checkout checks the 1,000-subscriber cap. That check is currently a count
before checkout, not a transactional reservation of the final slot.

If there is an existing billable subscription, the controller can update its
price item in place using `create_prorations`; it does not intentionally create
a second concurrent subscription. Selecting an already-active identical price
returns a conflict. Downgrade attempts through checkout are rejected and directed
to the billing portal. Portal cancellation/interval changes are subject to its
configured Stripe options and resulting webhook events.

Web redirects use `FRONTEND_URL`; native returns use
`APP_DEEP_LINK_SCHEME`, default `exegesis://`, with a subscription-result query.
Mobile and web refresh status after returning. Cancelling checkout is not a
paid activation. Subscription cancellation is also different from an immediate
refund: portal settings/events determine period-end versus immediate access.

The webhook uses raw request bytes before the global JSON parser for signature
verification. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, configured price IDs
and correct frontend return origin are required. A successful redirect is not a
substitute for a verified webhook and stored subscription state.

## Tier administration and billing side effects

| Action | Data and effect |
| --- | --- |
| Create tier | Name, description, dollar price, currency, interval, features, active flag, sort order, optional slot limit; creates a database row and attempts Stripe product/price creation |
| Edit tier | Updates supplied database fields; name can update the associated product; price/interval changes create a new Stripe Price |
| Delete tier | Deletes a database row; does not cancel subscribers or automatically delete/archive Stripe objects |
| Seed defaults | Creates missing Free/Legacy/Covenant base rows; skips existing rows; does not seed monthly variants |
| Sync Stripe tiers | Imports active products/prices into database rows using metadata/name-derived IDs |
| List subscribers | Combines user/database subscription information with Stripe reconciliation details |
| Sync Stripe users | Links/reconciles matching customers/subscriptions with application users and reports results |
| Manual tier/expiry | Updates `SystemUser.subscriptionTier`/expiry and writes an event; does not edit a Stripe billable subscription item |
| Suspend/resume | Sets `accountStatus` to `suspended`/`active` and records an event; does not cancel billing or set `status=false` |
| Refund | Resolves a captured payment, issues a full refund, attempts subscription cancellation, returns user tier to Free and logs the refund |
| History | Returns recent subscription events for one user, newest first |

The refund lookup walks latest subscription invoice payment intent/charge,
customer charges and payment intents. Missing billing identifiers or refundable
payment returns an error. Refund is an actual financial mutation, unlike a
manual entitlement grant. The handler does not implement a custom partial-refund
amount form in the audited client workflows.

Generic tier creation derives IDs from name plus `_month`/`_year`. Checkout and
rank checks remain hard-coded to the two paid families and their `_monthly`
variants: creating an arbitrary tier does not automatically create a usable new
checkout family. Syncing tier data also requires care because monthly/yearly
prices from the same product can derive the same row ID in the current sync
implementation. Existing paid subscriptions are not migrated automatically when
a new price is created.

Suspension is a status label in this handler; the audited auth/tier middleware
does not establish that this label alone blocks all protected access. Use the
documented account-status controls according to their actual effect, not their
label. Account deactivation, billing cancellation and tier changes are distinct.

# Administrator operations handbook

## Entry, roles and dashboard

The database roles are numeric `1=ADMIN` and `2=USER`. Administrative API calls
require an application JWT and the router's admin check. A free-tier account
with role ADMIN has administrative access; a paid USER does not.

The dashboard loads user/content/activity statistics and links to management
areas. Mobile additionally exposes `freeTranslationsOnly` and
`defaultTranslationId` settings through its dashboard hook. Those are
`SiteSetting` values, not edits to XML Scripture or the language registry.

## Create a regular user or another administrator

```text
Existing administrator -> Create User -> identity fields + role
  -> /admin/create-user -> duplicate checks -> generated temporary password
  -> active, verified user with mustChangePassword=true
  -> queued credentials email -> user signs in -> required password change
```

Accepted fields include username, email, first/last names, phone, gender,
optional date of birth and numeric `userRole`. Selecting ADMIN sends `1`; USER
sends `2`. The backend stores `free` subscription for either role and associates
`createdBy` with the acting administrator. The form does not choose a password;
the backend generates/hashes it and queues the credentials email. Creation
success does not itself confirm SMTP delivery.

This is the audited admin workflow. It should not be confused with public
registration accepting privileged roles: public role assignment requires its
own authorization review and is not an approved admin-creation process.

## Find, edit, activate, verify and delete users

1. Search/list users and open the selected detail record.
2. Submit profile/email/role changes with the current username as lookup key.
3. Toggle account active status separately from email verification.
4. Review available login sessions and subscription events before taking action.
5. Delete only after selecting the intended user and confirming in the client.

User update accepts `roleName`/`roleId` for role changes and checks duplicate
email addresses. The status toggle rejects changes to the acting admin's own
status; the deletion service also refuses self-deletion.

Deletion is a **soft-delete workflow**, not erasure of every database row. It
attempts Stripe cancellation/customer anonymization, deletes specified activity,
reading/personal and related records, marks the user deleted/inactive, replaces
their email/username/password, clears access/media fields, attempts removal of
profile/cover R2 objects and records the event. Billing history remains, and the
original email is retained in the audit field. Some Stripe/media cleanup errors
are caught, so external cleanup must be verified rather than assumed from the
success message.

## Create a complete reading plan

```text
Plan metadata -> create returns planId -> create day assignments
  -> create per-day quiz questions -> reload plan detail/statistics
  -> readers start -> read/quiz/complete days -> admin reviews participation
```

Metadata: title, description, `totalDays`, `questionsEnabled`, category and
difficulty. Each assignment has `planId`, day number, optional title, chapter
objects (`book`, `chapter`) and reflection questions. Each plan quiz stores a
question, four-option editor data, zero-based correct-answer index and explanation.
Global trivia questions are a different feature/table.

Plan creation currently sets `isActive=true` in the backend. Builders save the
plan and its days/questions with separate requests, not a single atomic
transaction. A failed later request can leave a partially configured active plan.
Reload the plan and check actual saved days/questions instead of assuming
`totalDays` means all assignments already exist.

## Edit, activate/deactivate and delete a reading plan

- Update metadata using **`planId`**, not the numeric database `id`.
- Update an existing day using **`assignmentId`** and `/update-assignment`.
- Add a new day using `/add-assignment` and its plan/day number.
- Update an existing quiz using **`questionId`**; add and delete are separate calls.
- Set `isActive=false` to remove the plan from regular active-plan listings.
- Delete with `planId` to remove the plan; schema relations cascade to its daily
  assignments, quiz questions and user-plan progress.

The mobile edit-day hook currently routes even existing days to add-assignment,
which creates a new row. Sending `assignmentId` to that add endpoint does not
turn it into an update. Web's dedicated editor uses the update routes. Mobile
also only submits new quiz rows and deletes in that hook, rather than updating
all changed existing questions. These are implementation gaps, not documented
working parity.

Admin plan statistics include enrollment/completion counts, quiz accuracy,
difficult questions, enrollment/completion trends, plan structure and participant
progress/streak information.

## Add, edit, retire and delete trivia questions

Question fields: text, `optionsJson` array, zero-based `correctAnswer`,
explanation, category, difficulty (`easy`, `medium`, `hard`), optional Scripture
reference and active state for updates. Clients require at least two filled
answers; the mobile editor has four answer inputs. Keep correct-answer indexing
consistent with the serialized non-empty options.

Create -> reload list/detail -> edit by `id` -> reload -> deactivate via update
or permanently delete via `/trivia/delete`. The backend create handler uses its
default active state rather than applying a submitted `isActive` field; an
inactive draft cannot be assumed merely because a creation form carries that
field. Question and user performance tabs query separate analytics endpoints.

## Daily content editorial workflow

1. Select Daily Verse, Devotion or Daily Exegesis management.
2. Create a record or open an existing record in edit mode.
3. Choose reference/translation where applicable, display date and publish flag.
4. Fill study/reflection/teaching content; save and reload the record.
5. Verify it on the date/reference reader endpoint and only then rely on it for
   dashboard or daily-verse push content.

Daily Verse includes reflection/explanation and rich study sections. Devotion
contains its devotional material and Scripture linkage. Daily Exegesis includes
title, passage reference, introduction, context, teaching, application, prayer
and tags. The `add-*` handlers/services also support editing according to their
ID/upsert contract; deleting is a separate route.

## Study resources, book overviews and journals

| Area | Administrator process |
| --- | --- |
| Verse explanations | Select book/chapter/verse, edit explanation/application, study metadata, word studies, themes and cross-references; save, preview and delete by ID when needed |
| Chapter study tools | Select chapter, tool type/label/color/reference data, create or update tool/word entries, filter manager lists and delete selected tool |
| Book prologues | Select book, author/audience/date/purpose/background/theme, structure and application fields; add Scripture references with a selected Bible translation; upsert by book name and preview overview |
| Journal moderation | List/search entries, inspect detail, change publication state or delete through the admin endpoint |
| Journal prompts | Create/edit prompt text, category, ordering, active state and optional passage scope; delete separately |
| Journal templates | Create named/category-based prompt sets and delete selected templates; no standalone template-update route is registered |
| Support inbox | Filter/search tickets, inspect conversation/attachments, reply and update ticket status; receive unread/receipt events |

The legacy `/bible/add-verse-explanation` and delete routes currently require
authentication without `requireAdmin`; describing them as editor operations does
not imply that their server-side role restriction is complete.

## Administrator endpoint reference

All routes below are POST unless GET is explicitly shown. This table describes
the implemented route contract, not an instruction to execute mutations during
an audit.

| Operation | Endpoint |
| --- | --- |
| Users: list/detail, create, edit | `/admin/get-users-by-admin`, `/admin/create-user`, `/admin/update-user` |
| Users: status, verification, delete | `/admin/toggle-user-status`, `/admin/toggle-user-verification`, `/admin/delete-user` |
| Dashboard/activity | `/admin/get-admin-dashboard-stats`, `/admin/get-user-activity`, `/admin/get-all-activity`, `/admin/delete-activity` |
| Site settings | `/admin/get-site-setting`, `/admin/set-site-setting` |
| Daily content | `/admin/add-daily-verse`, `/admin/add-daily-devotion`, `/admin/add-daily-exegesis` and matching `get-all-*`/`delete-*` routes |
| Tiers | `/admin/subscription-tiers/list`, `/create`, `/update`, `/delete`, `/seed`, `/sync-stripe` under that prefix |
| Subscribers | `/admin/get-subscriptions-users`, `/admin/sync-stripe-users` |
| Subscriber actions | `/admin/subscriptions/update-user`, `/suspend`, `/refund`, `/history` under that prefix |
| Plan metadata | `/reading-plans/create`, `/update`, `/delete`, `/plan-detail`, `/admin-stats` under that prefix |
| Assignments/quizzes | `/reading-plans/add-assignment`, `/update-assignment`, `/add-quiz-questions`, `/update-quiz-question`, `/delete-quiz-question` under that prefix |
| Trivia management | `/trivia/create`, `/update`, `/delete`, `/get`, `/get-all` under that prefix |
| Trivia analytics | `/trivia/admin/overview`, `/user-performance`, `/user-performance-detail`, `/question-performance` under that admin prefix |
| Explanations | `/bible/add-verse-explanation`, `/get-all-verses-explanation`, `/delete-verse-explanation` under `/bible` |
| Chapter tools | `/study-tools/admin/chapter-study-tools/get-all`, `/create`, `/update`, `/upsert`, `/delete`; GET `/study-tools/admin/chapter-study-tools/:id` |
| Book prologues | `/book-prologues/admin/get-all`, `/upsert`, `/delete` under that admin prefix |
| Journal moderation | `/journal/admin/get-all`, `/get`, `/set-publication`, `/delete` under that admin prefix |
| Prompts | `/journal/prompts/get-all`, `/create`, `/update`, `/delete` under that prefix |
| Templates | `/journal/templates/get-all`, `/create`, `/delete` under that prefix |
| Support management | `/support/admin/get-tickets`, `/get-ticket`, `/reply`, `/update-status`, `/stats` under that admin prefix |

`username`, `userId`, `planId`, `assignmentId` and `questionId` are not
interchangeable. Use the field required by the selected operation. UI wording
such as "Delete user" or "Suspend" does not change these backend side effects.

## Example administrator request contracts

These are illustrative bodies, not commands executed during this review. Use an
authenticated ADMIN session and replace example identities with intended records
only when deliberately performing the operation.

**Create an administrator** - `POST /admin/create-user`:

```json
{
  "username": "new_admin_example",
  "email": "new.admin@example.com",
  "firstName": "Example",
  "lastName": "Administrator",
  "phoneNumber": "",
  "gender": "Not specified",
  "userRole": 1
}
```

No password is submitted. Role `2` creates a regular user instead.

**Create plan metadata** - `POST /reading-plans/create`:

```json
{
  "title": "Example Scripture Reading Plan",
  "description": "A three-day study with reflections and quizzes.",
  "totalDays": 3,
  "questionsEnabled": true,
  "category": "intro",
  "difficulty": "easy"
}
```

Use the returned `planId` in subsequent requests; duration alone creates no
assignment rows. **Add a day** - `POST /reading-plans/add-assignment`:

```json
{
  "planId": "<returned-plan-id>",
  "dayNumber": 1,
  "title": "Creation",
  "chapters": [{ "book": "Genesis", "chapter": 1 }],
  "reflectionQuestions": ["What does the passage reveal about God?"]
}
```

For editing, call `/reading-plans/update-assignment` with the returned
`assignmentId`, title, chapters and reflection questions instead. Add a plan
quiz through `/reading-plans/add-quiz-questions` with `planId`, `dayNumber` and a
`questions` array containing question/options/correctAnswer/explanation objects.

**Create a global trivia item** - `POST /trivia/create`:

```json
{
  "question": "Which book begins with the creation account?",
  "optionsJson": "[\"Genesis\",\"Ruth\",\"Acts\",\"Jude\"]",
  "correctAnswer": 0,
  "explanation": "Genesis opens with the creation account.",
  "category": "general",
  "difficulty": "easy",
  "bookName": "Genesis",
  "chapter": 1,
  "verseNumber": 1
}
```

Edit through `/trivia/update` with its `id`; delete through `/trivia/delete` with
`id`. A plan quiz instead uses the plan-specific endpoint and `questionId`.

**Manual entitlement change** - `POST /admin/subscriptions/update-user`:

```json
{
  "userId": "<existing-user-id>",
  "subscriptionTier": "legacy_sower_monthly",
  "accessExpiresAt": "2026-12-01T00:00:00.000Z"
}
```

This updates application access/history only; it does not create a $3.33 Stripe
payment. Omitting expiry preserves the existing value; explicit null clears it.

## Verified client-parity boundaries

| Function | Native application | Browser application |
| --- | --- | --- |
| User creation/role selection | Create User form, ADMIN/USER selector | Create User page, ADMIN/USER selector |
| User status/verification/deletion | List/detail actions and native confirmation | List/detail actions and browser dialogs |
| User-session lookup | Uses username | Current detail hook sends userId; backend expects username |
| Create plan/day/quiz | Native multi-step builder | Dedicated multi-step page |
| Edit existing day | Current hook calls add-assignment; duplication gap | Dedicated page calls update-assignment |
| Existing quiz edit | Not submitted as update by audited native edit hook | Dedicated page calls update-quiz-question |
| Plan/trivia analytics | Dedicated native detail/performance screens | Admin detail and tabular/performance pages |
| Journal publication | Native moderation list | List/detail publication plus deletion |
| Prompt/template editors | Dedicated native editor not established | Editors in Journal feature; APIs separate from moderation |
| Subscriber event history | Not exposed by audited subscriptions hook | Event history dialog |
| General activity/site settings | Native Activity/dashboard controls | User sessions exist; equivalent standalone controls not established |
| Support | Live user conversations | Live user conversations and dedicated admin inbox |

These are source-level findings. Mutating user, plan, trivia, tier, refund and
deletion operations were not executed on database records during this review.
The read-only database/Stripe inspection is documented in the snapshot rather
than being presented as end-to-end validation of every admin screen.

# Support and realtime integration

Support user endpoints provide upload, create, ticket list/detail, reply and
unread summary. Admin endpoints provide inbox filters, detail, reply, status and
statistics. Attachments use the R2 media service.

Socket.IO is attached to the same HTTP server at `/socket.io`, using polling
with WebSocket upgrade. It authenticates application JWTs, checks account state,
reads the current role and joins server-derived `user:<id>` and admin rooms.
Client-supplied topics cannot grant access to another user's room.

Support messages carry delivered/read timestamps. Connection-time delivery
updates and feature events notify appropriate users/admins. Authentication
identity changes require a fresh connection. The principal events are:

| Event | Purpose |
| --- | --- |
| `support:message` | New message plus ticket summary for direct state updates |
| `support:ticket:updated` / `support:unread` | Status, summary and unread reconciliation |
| `support:receipt` | Changed `messageIds`, `ticketIds`, and delivered/read timestamps sent back to the opposite party |
| `support:presence` | App-wide user/admin socket connection state; independent of opening a support screen |
| `support:sync` (client with acknowledgement) | Authorized durable conversation snapshot, optional read operation and connection-presence snapshot |

`support:sync` accepts a positive `ticketId` and boolean `markRead`. It dispatches
to the reader ownership-checked or current-role admin service, not to a user ID
chosen by the client. It responds with the service status/data and presence only
on success. Clients use snapshots on reconnect/foreground and periodic active
recovery; there is no promise that Socket.IO replays disconnected events.

The receipt fields record backend delivery/read semantics, not FCM transport
acknowledgements. Presence reports connected authenticated sockets, not physical
internet availability or whether the person is currently reading a bubble.
Socket rooms/presence are process-local in the current default adapter. Separate
backend deployments sharing PostgreSQL do not share these socket rooms or their
Firebase configuration; production scaling needs explicit adapter/routing design.

# Email, caching and background processing

- SMTP supports account verification/reset and configured outbound messages.
- Pending email processing runs on a 30-second cron with process-local overlap
  prevention and database-outage backoff up to five minutes.
- Push sweep runs every minute with its own process-local overlap guard.
- Popular-search cleanup starts alongside other scheduled jobs.
- Redis is optional; cache errors disable that path while modules can use their
  own in-process caches. These caches are not durable business records.
- TTS warmup pre-connects service resources to reduce the first-request delay.

Deployment scaling changes job multiplicity: these are not automatically
distributed task queues merely because the HTTP service has multiple replicas.

# Configuration and deployment

Use `.env.example` as the configuration inventory. Keep real database URLs,
service-account JSON, mail passwords, Stripe secrets and R2 credentials in local
ignored files or deployment secrets, never in client bundles or these manuals.

| Group | Main variables |
| --- | --- |
| Server | `PORT`, `NODE_ENV`, `BACKEND_URL`, `CLIENT_URL`, `FRONTEND_URL` |
| Database/auth | `DATABASE_URL`, `JWT_SECRET`, optional `JWT_EXPIRES_IN`, `VERIFICATION_CODE_SECRET` |
| Google | `GOOGLE_OAUTH_CLIENT_IDS`, `GOOGLE_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID` |
| Push | `FIREBASE_PROJECT_ID`, service-account source |
| Storage | `R2_ACCOUNT_ID`, key/secret, bucket, endpoint, public base URL |
| Email | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, sender/support settings |
| Stripe | Server/webhook secrets and configured price IDs |
| Cache | `REDIS_HOST`, `REDIS_PORT`, cache TTL |
| Translation | `LIBRETRANSLATE_*`, `MYMEMORY_*`, `LORDSBOOK_TEXT_*`, translation limits |
| Voice | `LORDSBOOK_TTS_ENABLE`, gateway/key, synthesis timeouts and concurrency settings |
| Bible metadata | `BIBLE_INDEX_CACHE_DIR` |

From `backend/`:

```bash
npm install
npx prisma generate
npm run dev
```

Provision PostgreSQL/schema and required seed/content data deliberately.
The current `npm start` runs `prisma db push`, regenerates Prisma and starts
`src/bootstrap.js`; understand that schema-update behavior before using it in
production. Dockerfile and Railway configuration are included in the repository.
Changing local `.env` does not change Railway's deployed secrets.

For production, align API origins/client builds, R2 persistent storage, Stripe
webhook URL, Firebase Admin credentials, SMTP, XML files/indexes and any provider
URLs. Restart/redeploy after environment changes. A static browser deployment
and native binary have their own separate release steps.

# Validation and operational checks

```bash
npm test
npm test -- src/modules/auth/__tests__/google-auth.test.js
npm test -- src/services/__tests__/objectStorage.test.ts
```

Useful checks include `/health`, voice/translation status, an authenticated test
push, a test media upload/read, Google login and new-user completion, Stripe test
checkout/webhook, journal export and a support conversation. Run provider tests
with appropriate non-production accounts/data.

| Symptom | Likely investigation |
| --- | --- |
| Login `503` | Database connectivity/pool and transient retry path |
| Google native error before API login | Client package/signing/OAuth/consent setup |
| Google ID token rejected by backend | Audience set, verified claims and token freshness |
| Media URL fails after R2 move | Destination key, public access, stored old-domain URLs and deployed variables |
| No push | Permission/token, Admin project, due time/date, published verse and platform credentials |
| Slow translated lists | Translation time budget, summary projection, cache/provider queues |
| Voice failure | Provider enable flag, status, rate limit, language/voice mapping and fallback |
| Paid screen rejects user | Stored tier/expiry, webhook delivery and status refresh |
| Duplicate cron effects after scaling | Multiple process-local schedulers running |

# Source map and related references

| Path relative to `backend/` | Responsibility |
| --- | --- |
| `src/bootstrap.js`, `src/server.js` | Environment loading, server, routes and jobs |
| `prisma/schema.prisma` | Durable domain model |
| `src/middlewares/auth.middleware.js` | Required/optional auth and admin role check |
| `src/middlewares/gating.middleware.js` | Subscription-tier/expiry checks |
| `src/modules/*/route.js` | Actual feature endpoints |
| `src/modules/subscriptions/routes.js` | Subscription endpoint definitions |
| `src/modules/auth/service.js` | Identity and Google registration proof |
| `src/services/objectStorage.js` | R2/local storage, media keys and URL resolution |
| `scripts/migrate-r2-account.js` | Cross-account copy, verification and media-URL rewrite |
| `prisma/migrate-uploads-to-r2.js` | Separate local-upload migration |
| `src/modules/push/service.js` | Admin messaging, token/settings operations |
| `src/services/pushNotificationScheduler.js` | Scheduled daily-verse pushes |
| `src/realtime/index.js` | Authenticated realtime server and support receipts |
| `src/modules/text-to-text-translation/` | Translation API and provider orchestration |
| `src/modules/tts/service.js` | Voice synthesis and fallback |
| `src/modules/ai/service.js` | Template/context explanation engine |
| `.env.example` | Shareable configuration inventory |

Related documents: [R2 migration report](R2_ACCOUNT_MIGRATION.md),
[Firebase migration runbook](../../FIREBASE_MIGRATION.md), and the existing
[API reference](API.md). Check older endpoint examples against current routers.
For printable exports of this manual, use the project guide's PDF commands.
