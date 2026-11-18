# Monthly plans, billing verification and deleted accounts

## Published offers

| Plan | USD price | Billing |
| --- | --- | --- |
| Free Reader | $0 | No subscription |
| Legacy Sower | $3.33 | Monthly |
| Covenant Sower | $7.77 | Monthly |

New paid checkout accepts monthly billing only and checks Stripe's active price,
currency, amount in cents, interval and interval count before creating/updating
billing. It must not charge $7.78 while advertising $7.77. Public tiers are
filtered to approved offers. Historical annual subscriptions remain resolvable
for status, cancellation and invoice history, but are not new offers.

### Environment and bounded changes — November 18, 2026

The configured database is Railway. The configured Stripe key/objects are **test
mode**, not live payment mode. The database now has active monthly tier rows
linked to Stripe's 333-cent and 777-cent prices. The old 778-cent price and known
annual prices were archived in Stripe; historical tier rows were deactivated,
not deleted. Existing subscriptions and invoices were not canceled or deleted.
Database monthly price mappings take precedence over deployment environment
fallbacks. A stale/archived configured price also resolves through its own Stripe
product to an active exact approved monthly price; unrelated products and $7.78
are never accepted. This covers deployments still configured with an old price ID.
The local Covenant monthly price environment fallback was corrected;
no secrets are stored in this report or committed.

Three database accounts linked to already-canceled Stripe subscriptions were
reconciled through the existing status service to Free with no expiry or active
subscription link. Three active monthly accounts retained access and their real
Stripe expiry dates. One historical subscription ID returned `resource_missing`;
it was not guessed, deleted, or automatically downgraded. It needs billing review.
No blanket deletion of test users, accounts or subscription history was performed.

## Cancellation semantics

- `active`/`trialing` with cancellation scheduled at period end keeps access until
  that period ends. A scheduled cancellation does not mean immediate Free.
- A canceled subscription with no newer active replacement clears paid access,
  expiry and the stored subscription link on status reconciliation.
- App/web refresh subscription status after checkout/portal return or app focus.
- Account deletion continues to cancel billing and tombstone the user, rather
  than letting a subsequent signup adopt the deleted account's subscription.

## Deleted-account list

`admin/get-users-by-admin` excludes `accountStatus=deleted`, non-null `deletedAt`,
and tombstone email addresses by default. Search, pagination and total counts use
the same exclusion. `accountView=deleted` explicitly selects those archived rows.
The admin-only web page `/admin/deleted-users` is read-only; there are no activate,
role-change or destructive controls. Ordinary inactive accounts remain visible
in User Management. Data is retained, not erased to clean the list.

## Dates and tests

App/web shared English full-date format is **Nov 17, 2026** (US month, day, year),
including default formatting and numeric full-date option calls. Other UI
languages retain their locale and numeral conventions. Storage/API timestamps
and date-input values are unchanged.

- Backend: 101 suites, 911 tests passed.
- Web: 83 files, 498 tests passed; production build and TypeScript passed.
- App: 228 suites, 1,985 tests and 6 snapshots passed; zero typecheck errors.
- Actual Stripe test API + disposable localhost database cancellation check passed:
  exact $7.77 price, trial activation, scheduled cancellation, immediate cancellation,
  and persisted status. Temporary customer/subscription/user were cleaned up.

Repeat only with an explicitly disposable local database:

```sh
E2E_DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/NAME_e2e' \
  node scripts/verify-monthly-stripe-test.mjs --run
```

The script refuses a remote/non-`_e2e` database and live-mode Stripe prices.
