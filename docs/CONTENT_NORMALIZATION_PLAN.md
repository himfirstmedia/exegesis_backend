# Content normalization plan

Status: proposal only. No normalization schema changes, data migrations, or
production writes are authorized by this document.

## 1. What the current implementation actually does

Reviewed `prisma/schema.prisma`, admin content save services, Bible daily-content
readers, `dailyContentTranslation.js`, and `strongs/editorialWords.js`.

| Area | Current ownership | Problem |
| --- | --- | --- |
| VerseExplanation | Passage and edition; exegesis + metadata + ordered study relations | Closest to a reusable study, but has no editorial revision/publication boundary. |
| DailyVerse | Passage, date/time, publication flag, reflection and copied study fields | Scheduling and reusable study content live in the same record. No FK connects it to an explanation. |
| DailyDevotion | Title/body, optional passage, date/time and the same copied study fields | A devotion is a distinct editorial work, but repeatedly carries the same supporting study structure. |
| DailyExegesis | Separate title, free-text passage and teaching/body fields | Related editorial concept; do not merge it accidentally just because it contains an application. |

Specific observations:

- DailyVerse and DailyDevotion repeat introduction, explanation, application,
  background, word studies, cross references, themes, takeaways and final thoughts.
- Their collections are `String` fields containing JSON or newline text.
  Explanations use relational child tables for most collections, but takeaways
  are still JSON inside a text field. There are multiple serialization contracts.
- `VerseExplanation` is unique by book/chapter/**starting verse** only. Neither
  edition nor ending verse participates. A single-verse study and a range with
  the same start cannot coexist independently today.
- DailyDevotion has an optional single-verse reference, whereas DailyVerse and
  VerseExplanation now have optional ending verses in the working schema.
- `getVerseByDate` tries explanation-first resolution; `getTodaysVerse` uses
  embedded explanation first. `getVerseExplanationData` queries the root without
  its normalized child relations, then callers expect legacy explanation fields.
  Consequently, the existing fallback is not a reliable content-sharing link.
- DailyVerse save ignores the editor's submitted `verseText`; reader text is
  resolved from Scripture. This is an important ownership distinction to retain.
- Today's daily-verse query can choose a future publication (`displayDate >=
  today`) and falls back to a latest record. Scheduling semantics need a precise
  policy instead of carrying this ambiguity into a normalized design.
- `StrongsDictionary` is shared lexical data. `VerseWord` is imported word
  occurrence data. `VerseWordStudyEntry`, `VerseWordStudy`, `StudyToolWord` and
  legacy VerseResource JSON also hold editorial contextual study material.
  They are related but **not interchangeable**.
- Daily content translation currently parses strings and translates individual
  embedded fields. Changing storage alone would break that pipeline.
- Creator relations on DailyVerse/Devotion use `onDelete: SetNull` with required
  creator columns. Preserve attribution with nullable creator FKs or an explicit
  account-retention policy; do not retain this contradictory definition.

This is a source-code audit, not a production-data audit. Actual duplication
counts, parse failure rates and conflicting editorial variants must be measured.

## 2. Recommendation

**Separate reusable editorial content from daily publication, and share complete
content revisions explicitly—not by silently inheriting fields by passage.**

Three layers:

1. **Scripture identity:** canonical passage and Bible edition.
2. **Editorial content:** a reusable, versioned study or devotion with structured
   child collections.
3. **Publication:** schedule a specific reviewed revision for a daily channel.

Keep explanation, daily verse and devotion as distinct product experiences.
Normalize their supporting data, not their meaning.

Do not put everything in one enormous nullable `Content` table, and do not add
`ownerType/ownerId` polymorphic child records without real foreign keys. Also do
not force every devotion to reference a verse explanation: some have no passage,
and others intentionally present a different application of the same passage.

## 3. Proposed logical entities

Names below are conceptual, not a final Prisma migration.

### ScriptureBook / ScriptureEdition / ScripturePassage

- `ScriptureBook`: stable canonical key, canonical order, aliases such as
  Psalm/Psalms. Translated display names are presentation data.
- `ScriptureEdition`: stable edition identity and known aliases (BSB/Berean).
  Editorial language is not the same thing as Scripture edition.
- `ScripturePassage`: `bookId`, `startChapter`, `startVerse`, `endChapter`,
  `endVerse`. Single verse uses equal start/end, not a nullable identity field.
- Unique constraint on the full canonical tuple; validate boundaries against
  the supported book/edition verse inventory. For the first release, restrict
  editors to same-chapter ranges while allowing an extensible reference model.
- Passage identity is edition-independent. A content quotation separately names
  its edition. Do not use SearchIndex as the canonical Scripture FK: it is a
  replaceable search projection.

### EditorialContent

- Stable ID, `kind` (PASSAGE_STUDY or DEVOTION initially), source language,
  nullable primary passage FK, default quotation edition, audit attribution,
  optional `derivedFromContentId`, archive state.
- Passage-study content requires a primary passage. Devotions may omit it.
- Do not impose a global unique constraint on passage: different authors,
  editions or editorial approaches can legitimately cover the same verses.
- An explicit curated lookup/placement selects the default published study for
  a passage, locale and optional edition scope. Exact passage lookup first;
  covering-range fallback only through a documented deterministic policy.

### EditorialRevision

- `contentId`, revision number, workflow state (DRAFT/REVIEW/PUBLISHED/ARCHIVED),
  source language, audit fields and timestamps, optimistic concurrency version.
- Common study fields: introduction, explanation, application, contextual
  background author/book/context, reflection and final thoughts.
- Published revisions are immutable. Editing creates a new draft revision.
- At most one row per `(contentId, revisionNumber)`.
- A `DevotionRevision` one-to-one extension owns required title and body. Do not
  equate devotion body with explanation. Add an exegesis extension only in a
  later separately scoped migration.
- The existing VerseExegesis/VerseStudyMetadata 1:1 separation can be folded into
  the revision because those fields have the same owner and lifecycle. Keeping
  both 1:1 tables does not itself reduce duplication across daily content.

### Ordered revision children

All reference `revisionId` with real foreign keys and explicit ordering:

| Child | Fields and rules |
| --- | --- |
| ContentWordStudy | Surface text, contextual definition, order. Optional links to dictionary entries through ContentWordStudyStrong, permitting several IDs without duplicating the study paragraph. |
| ContentCrossReference | Passage FK, quotation edition, commentary, order; optional explicit quotation override and provenance. |
| ContentPracticalApplication | Text and order. Distinct from the main application paragraph. |
| ContentTakeaway | Text and order. One item can contain several paragraphs. |
| ContentTheme | Display text and order. Global Theme + join only if editorial/search requirements justify controlled vocabulary. |

Use relational rows for queryable identities/links and ordered collections.
Reserve `Json` for import provenance, immutable legacy archives and genuinely
variable metadata—not a new dumping ground for the whole editable document.

Dictionary definitions remain in StrongsDictionary. Context-specific meaning
belongs to ContentWordStudy. Never fabricate imported VerseWord occurrences or
overwrite global lexical definitions to save an editorial note. Unknown Strong's
IDs should be flagged for review, not silently inserted as authoritative entries.

Background about a book can optionally reference BookPrologue, but keep
passage-specific context on the revision. Do not automatically substitute a
book-wide overview for a verse's historical explanation.

### DailyPublication

- Stable ID, channel (`DAILY_VERSE` or `DAILY_DEVOTION`), `revisionId` FK,
  publication date (`date`), scheduled instant (`timestamptz`), editorial timezone,
  state, creator/updater and timestamps.
- Daily verse chooses a study revision and may have its own short promotional
  title/reflection through an explicit placement extension if genuinely needed.
- Reusing a revision for another day creates a publication, not another copy of
  all its study fields. A different contextual treatment creates new content.
- Pin publications to revision IDs. Updating a shared draft must not rewrite
  yesterday's verse or an already scheduled devotion unexpectedly.
- Initially define one published item per `(channel, publicationDate, audience)`;
  model audience only if multiple feeds are real requirements. Enforce the active
  uniqueness rule with a PostgreSQL partial unique index/custom SQL migration.
- Define publish eligibility as scheduled time reached + valid state. Never
  return future content as today's item. Make previous-item fallback explicit.
- Archive or restrict deletion of referenced revisions; never cascade-delete
  published history when an editor/account is removed.

### LocalizedRevision

- Links to an exact immutable source revision and normalized locale, with
  translation status, provider/editor provenance and source checksum.
- Translate editorial prose once per source revision/locale, not once per daily
  publication. Relational localized child rows reference stable source child IDs.
- Keep canonical passage IDs and Strong's IDs unchanged. Resolve Scripture text
  from the selected Bible edition, not generic machine translation.
- Language switching must not change which editorial revision was selected.

## 4. Sharing and editor workflow

1. Author a passage study in the content library, with shared structured inputs.
2. Review/publish a revision.
3. “Schedule as Daily Verse” creates a DailyPublication pointing to that revision.
4. “Use as supporting study” lets a devotion explicitly select a study revision.
   If sharing an entire study, use an explicit revision link rather than copying
   its children. A devotion's own contextual study is a separate revision.
5. Editing a scheduled item offers **edit this publication's content** (fork into
   a draft when necessary) versus **open shared source**. Show affected future
   publications before repointing them.
6. If combining devotion + supporting study in a reader, use labelled sections
   rather than invisible field-by-field fallback/merge.

Avoid granular inheritance/overrides initially. It makes “why is this paragraph
here?” harder to answer. Reuse a whole revision; fork when the work differs.

## 5. API and compatibility contract

- One validated canonical content DTO with typed arrays and passage references.
- One resolver for admin previews, today's endpoints, date endpoints and detail
  endpoints; no independent precedence rules in each controller.
- Preserve existing daily IDs and explanation routes using a legacy mapping
  table `(legacyType, legacyId) -> contentId/revisionId/publicationId`.
- Keep existing app/web response shapes through adapters during rollout; flatten
  common fields and serialize arrays to legacy strings only at that boundary.
- Existing clients must not unknowingly overwrite shared content. Legacy writes
  create/update a private draft and atomically repoint the appropriate publication.
- Use transactions, permission checks, revision numbers/ETags, and idempotency
  keys for schedule/save operations. Do not perpetually dual-write both schemas.
- Caches include revision, locale and edition; feed keys also include channel,
  audience and date/time policy. Invalidate on publish/repoint, not only raw edits.
- Include exports, push notifications, offline packs and read-only share links in
  compatibility testing—not just the editor forms.

## 6. Safe migration sequence

### Phase A — inventory and agreement

- Read-only report: row counts, duplicate passage keys, aliases, malformed JSON,
  empty-vs-null differences, repeated schedule days, Strong's IDs, and divergent
  content for the same passage. Sample all nonempty fields with editorial review.
- Record exact current endpoint contracts and publication timezone behavior.
- Agree on revision ownership, canonical-study selection and scheduling rules.
- Keep recent range-editor work separate: it is not a normalization migration.

### Phase B — additive storage and resolver

- Add the new tables/indexes and explicit source/legacy mappings. No drops or
  rewrites of old data. Dry-run migrations against a restored backup first.
- Implement DTO validation and the canonical resolver with compatibility adapters.

### Phase C — lossless, restartable backfill

- Import explanations and their children as complete revisions.
- For each daily verse/devotion, compare its complete editorial payload against
  candidate revisions. Reuse only a verified equivalent revision; otherwise keep
  a distinct content record with provenance. Same passage does not prove sameness.
- Do not strip HTML, merge paragraphs, collapse internal whitespace, discard
  learnMore/reflection, or translate text to decide equivalence.
- Convert takeaways/collections using reviewed parsers. Keep unparsed originals
  in migration quarantine linked to their source row; never skip them silently.
- Every source row gets a mapping; every nonempty field is accounted for.
- Deduplicate **publications** only with editorial approval, not by text hash.
- Persist batch checkpoints/checksums and an immutable source export for rollback.

### Phase D — shadow verification and cutover

- Compare old/new resolved responses for all historical records and sampled
  locales; review intentional differences explicitly.
- Enable new reads by feature flag, then editors/writes through the new service.
- Freeze or route old writes through adapters; track unsupported-client usage.
- Keep a bounded rollback window and mappings. If rollback is needed after new
  writes, export/project those writes first—do not simply switch to stale tables.

### Phase E — retirement

- After verified client adoption and backups, remove duplicated daily columns,
  obsolete child tables and fallback code in a separate reviewed migration.
- Migrate VerseResource/standalone word attachments later; imported VerseWord
  stays separate. DailyExegesis and ReadingPlan assignments remain out of phase 1.

## 7. Acceptance gates

- No nonempty legacy content lost; unresolved rows quarantined and reported.
- Daily scheduling reuses a revision without duplicating study children.
- Same verse with different editions/ranges/authors remains distinguishable.
- Draft edits cannot change published historical content.
- Single verse and range text, Strong's links, order, multiline takeaways and
  cross-reference commentary survive create/edit/read/export round trips.
- Today's/date/detail/admin endpoints resolve the same revision consistently.
- Old app/web clients keep working throughout staged rollout.
- Permission, transaction failure, concurrent edit, cache invalidation, timezone,
  unpublished/future content and translation-source-change tests pass.
- List endpoints paginate without N+1 collection loads; detail queries have
  measured query counts and indexes before rollout.

## 8. Recommended order of work

Approve content/publication ownership first; run the inventory second. Implement
the canonical resolver and typed DTO before changing editor storage. Then perform
an additive, reviewed backfill and staged cutover. **Do not begin by deleting the
repeated fields or automatically linking everything with the same verse.**
