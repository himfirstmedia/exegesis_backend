---
title: "Exegesis Subscription Data and Administration Snapshot"
subtitle: "Read-only verification of database, configured Stripe prices, and client behavior"
author: "Him First Media"
date: "2026-10-20"
lang: en
---

# Verification scope

This October 20, 2026 snapshot was obtained using read-only Prisma queries against the database
selected by local `backend/.env` and Stripe retrieval/list operations using that
environment's configured key. No accounts, tiers, subscriptions, products,
payments or prices were created, edited, refunded, synchronized or deleted.
No personal subscriber information is included.

**The Stripe records inspected are test-mode records (`livemode: false`).**
They verify this environment's configuration, not a live production charge or
the configuration of a different Railway environment.

# Verified pricing

| Plan | Internal base ID | Monthly USD | Yearly USD |
| --- | --- | ---: | ---: |
| Free Reader | `free` | 0.00 | 0.00 |
| Legacy Sower | `legacy_sower` | 3.33 | 33.33 |
| Covenant Sower | `covenant_sower` | **7.78** | 77.77 |

Paid amounts above were retrieved from the four price IDs configured by
`STRIPE_LEGACY_SOWER_PRICE_ID`, `STRIPE_LEGACY_SOWER_MONTHLY_PRICE_ID`,
`STRIPE_COVENANT_SOWER_PRICE_ID` and
`STRIPE_COVENANT_SOWER_MONTHLY_PRICE_ID`. All four prices were active and USD.
Stripe stores these amounts as 333, 3333, 778 and 7777 cents respectively;
the backend converts minor units to dollar amounts for tier responses.

**The requested Covenant amount of $7.77/month is a real discrepancy:** the
backend's emergency fallback tier is $7.77, while configured Stripe and the
web Sower fallback card use $7.78. This documentation records the discrepancy;
it does not silently change the amount customers would be charged.

Monthly user-entitlement IDs are `legacy_sower_monthly` and
`covenant_sower_monthly`. Monthly and yearly variants have equal feature rank
within the same family. They differ in billing cadence, expiry and price.

# Database rows observed

`SubscriptionTier` contained exactly these three records at inspection time:

| ID | Name | Price USD | Interval | Active | Slot cap |
| --- | --- | ---: | --- | --- | ---: |
| `free` | Free Reader | 0.00 | `none` | Yes | None |
| `legacy_sower` | Legacy Sower | 33.33 | `year` | Yes | 1000 |
| `covenant_sower` | Covenant Sower | 77.77 | `year` | Yes | None |

Their descriptions were null. Their feature arrays were:

- Free Reader: `Bible reading`, `Daily verse`, `Basic tools`.
- Legacy Sower: `Full Legacy Ledger and study tools`.
- Covenant Sower: `Full access and future modules`.

The two paid rows had Stripe product/price associations. Their product
associations were not the same products as the environment-configured yearly
prices inspected for the public tier API; the amounts matched, but the price
sources are not a single reconciled catalogue.

**No monthly `SubscriptionTier` rows were present.** That does not mean monthly
checkout is absent: public tier listing can synthesize monthly entries from
environment-configured Stripe prices. However, admin database tier lists do not
automatically show those synthesized monthly entries. If public listing falls
back to database-only records, mobile's card builder sees a missing monthly
amount and defaults that paid card to annual billing.

# Roles observed

| Role ID | Stored name | Meaning |
| --- | --- | --- |
| `1` | `ADMIN` | Administrator with full access |
| `2` | `USER` | Regular user with standard access |

Role and paid tier are independent. An administrator can have stored tier
`free` and still pass tier middleware through its administrator bypass.
A paying Covenant member does not thereby acquire the administrator role.

# How displayed data and checkout are selected

| Operation | Current selection behavior |
| --- | --- |
| `POST /subscriptions/tiers` | Environment-linked Stripe prices, cached up to five minutes; then database records; then emergency code defaults |
| `POST /admin/subscription-tiers/list` | Database tier rows, ordered by `sortOrder` |
| Checkout price resolution | Matching database row first; corresponding environment price ID second |
| Mobile Sower cards | Merge base and `_monthly` tier entries from public API; prefer base tier feature array |
| Web `/sower` cards | `SowerTiersGrid` renders the static `TIERS` array; loaded API plans are not passed into the grid |
| Web `/plans` comparison | Curated code feature matrix with landing-tier name/price overrides |

The environment-linked Stripe products inspected had **no `features` metadata**.
The public tier builder reads that metadata and constructs empty paid feature
arrays when it is absent. Thus rich web marketing lists, sparse database feature
arrays and mobile API-derived benefits can disagree without the underlying
subscription rank changing.

# Benefits: product description versus access enforcement

| Plan | Described capabilities | Verified implementation boundary |
| --- | --- | --- |
| Free Reader | Scripture, daily verse, basic search, notes/bookmarks | Personal saves require a signed-in account; API access is endpoint-specific |
| Legacy Sower | Advanced search, Lab, full journal/Legacy Ledger, plans/progress, journal export | Journal, Lab, reading-plan and advanced translation-search routes use Legacy-or-higher middleware |
| Covenant Sower | Legacy plus prayer/reflection, analytics, priority/future-feature messaging | Higher rank exists; no `requireTier('covenant_sower')` route was found in the audited backend |

Some explanation/Strong's/study-resource reads are public or have different
checks, despite premium wording on comparison cards. AI-labelled helpers are
currently template/context-based. Marketing text is not proof that an exclusive
external-AI service or a separately enforced Covenant-only API is deployed.

# Confirmed administration differences and follow-ups

1. Decide whether Covenant monthly billing should be $7.77 or $7.78; then align
   Stripe, code fallback, public pages and documentation. A Stripe amount change
   normally requires a new Price and a deliberate mapping/subscriber policy.
2. Reconcile monthly database rows, environment IDs and database-linked products.
   Editing a database tier can affect checkout while public listing still reads
   another environment-linked Stripe product/price.
3. Populate the intended plan descriptions/features in the actual source used
   by each client, not only in a marketing component.
4. Generic admin-created tier IDs do not automatically become purchasable:
   checkout currently accepts only the two paid base families and middleware
   uses a fixed rank map. Generic creation appends `_month`/`_year`, whereas
   monthly family entitlement IDs use `_monthly`.
5. Tier deletion removes the database row; it is not Stripe cancellation or
   subscriber migration. Updating a tier's price creates a new Stripe Price;
   it does not automatically move existing subscriptions to it.
6. Manual subscriber tier/expiry changes update the application record and event
   history, not a Stripe billable plan item. The Suspend action changes
   `accountStatus`; it does not cancel Stripe or set `status=false`.
7. The current auth/tier middleware does not establish that `accountStatus` set
   to `suspended` alone blocks every protected request. Account deactivation and
   subscription suspension are not equivalent operations.
8. Mobile's existing-day editor submits to the add-assignment endpoint; the
   backend add operation creates a new assignment even if `assignmentId` is sent.
   Existing-quiz changes are not submitted as update calls by that mobile hook.
   Web's dedicated edit page uses the assignment and quiz update routes.
9. Web exposes subscription-event history; the audited mobile subscriptions hook
   does not provide the same history workflow. Mobile subscription revenue is an
   estimate computed from counts and annual tier prices, not Stripe-settled revenue.
10. Web's Sower hook requests `/subscriptions/get-plans`, which is not registered
    in the current subscription router. Its static card grid masks the failed
    catalogue request; it is not a verified live price display.
11. Web `/plans` uses database-backed landing tiers. Without monthly rows,
    `buildTierOverrides()` divides the annual amount by 12 and the strip labels
    that result `/month`. For the inspected rows this yields **$2.78** and
    **$6.48**, not the configured monthly charges of $3.33 and $7.78. The page
    does not add a billed-annually qualifier in that strip. Treat this as a
    display/billing mismatch to resolve, not as a second verified monthly offer.

# Closure evidence to record

To close a pricing/admin discrepancy, capture the selected environment, timestamp,
tier/interval, database row, resolved Stripe amount/currency/mode, returned public
tier payload and both client displays. For operations, verify the resulting
record after reloading, rather than relying solely on a success toast.

Read-only pricing verification is not a payment test. Checkout, refunds, deletion,
role changes and plan edits were inspected in source, not executed on real users
or paid subscriptions during this documentation task.

# Source references

- [Public tiers and checkout controller](../src/modules/subscriptions/controller.js).
- [Admin tier and subscriber controllers](../src/modules/admin/controller.js).
- [Admin account service](../src/modules/admin/service.js).
- [Database schema](../prisma/schema.prisma).
- [Mobile tier-card builder](../../app/src/features/subscription/utils/utils.ts).
- [Mobile subscription administration](../../app/src/features/admin/AdminSubscriptions/hooks/useAdminSubscriptions.ts).
- [Web Sower card configuration](../../web/src/features/Subscription/components/SowerTierCards.tsx).
- [Web plan comparison matrix](../../web/src/features/Subscription/constants.ts).

Return to the [backend manual](PLATFORM_GUIDE.md) for endpoint tables and detailed
administrator workflows, or the [project guide](../../PROJECT_DOCUMENTATION.md).
