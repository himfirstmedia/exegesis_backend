# Backend Performance and Speed Improvement Plan

> **Status:** Planning only
> **Priority:** High
> **Scope:** `backend/`
> **Constraint:** Preserve existing API behavior and client contracts unless a contract change is reviewed separately.

## 1. Goal

Improve backend response times, reduce long-tail latency, and keep the service responsive when database, Bible, translation, TTS, Stripe, email, and notification workloads happen at the same time.

The work should be measurement-driven. Before changing query behavior or infrastructure, establish which routes are slow, where they spend time, and whether the delay is caused by PostgreSQL, Redis, local processing, queue waiting, or an external provider.

## 2. Initial Findings

The following risks were found during a read-only code audit.

| Area | Current risk | Expected impact |
|------|--------------|-----------------|
| Observability | Requests do not have consistent route timing, request IDs, query counts, or dependency spans | Slow routes cannot be ranked reliably |
| Bible translations | Cold paths can read and scan 5-7 MB XML files; some searches parse and scan a full Bible | High CPU, memory, and cold-request latency |
| Translation and TTS | External calls retry and wait in process-local queues without a strict total request budget | Very high p95/p99 latency during provider degradation |
| Authentication and gating | Subscription-protected routes can query the same user twice before controller work | Extra database round trip on many requests |
| Database indexes | Several frequent filters, exact verse lookups, queues, and newest-first lists do not have matching indexes | Increasing latency as data grows |
| Strong's and analytics | Some services load a full matching data set and paginate or aggregate in Node.js | High memory usage and slow large-data requests |
| Redis | Cache fills are not deduplicated and deployment configuration is limited | Cache stampedes and repeated expensive work |
| Scheduled jobs | Email, push, and cleanup jobs run in the API process and can run in every replica | User requests compete with background work |
| Stripe | Some operations make remote and database calls sequentially for each record | Slow admin and subscription requests |
| Exports | PDFs and large exports are built fully in memory and returned as base64 | High memory, garbage collection, and response size |
| Startup | The HTTP server starts without awaiting the database connection | Instances can receive traffic before they are ready |

## 3. Performance Targets

Targets must be confirmed after production baselines are recorded. Initial targets:

| Request class | Initial target |
|---------------|----------------|
| Cached read request | p95 below 300 ms |
| Normal authenticated database request | p95 below 500 ms |
| Warm Bible chapter request | p95 below 300 ms |
| Cold Bible chapter request | p95 below 1 second |
| Search request | p95 below 750 ms for normal result sizes |
| Translation/TTS | Fixed total deadline; overload rejected instead of waiting indefinitely |
| Event-loop delay | p99 below 50 ms under representative load |
| Error rate | Below 1% excluding valid client errors and upstream outages |

Percentiles should be measured separately for cold and warm requests. Averages alone are not sufficient.

## 4. Phase 1: Establish a Baseline

### 4.1 Request measurements

Add structured request logging with:

- Request ID
- Route template rather than raw URL
- HTTP method and status
- Total request duration
- Authentication and gating duration
- Database query count and total database duration
- Redis duration and cache result
- External provider name and duration
- Queue wait duration
- Request and response size
- A non-reversible authenticated-user identifier for grouping, not personal data

Do not log authorization headers, passwords, tokens, complete request bodies, or private journal content.

### 4.2 Runtime measurements

Capture:

- Active requests
- Event-loop delay
- Process CPU
- Heap and resident memory
- Garbage-collection duration
- PostgreSQL pool usage and wait time
- Redis hit, miss, error, and reconnect rates
- Translation and TTS queue depth
- Scheduler duration and rows processed

### 4.3 Database measurements

Enable `pg_stat_statements` in a production-like environment and rank queries by:

- Total execution time
- Mean and p95 execution time
- Number of calls
- Rows examined versus rows returned
- Shared buffer reads
- Temporary disk usage

Use `EXPLAIN (ANALYZE, BUFFERS)` on representative data before adding an index or rewriting a query.

### 4.4 Baseline load tests

Create repeatable `k6` or `autocannon` scenarios for:

- Login and authenticated Home requests
- Daily verse, devotion, and exegesis
- Bible catalog, books, and chapter loading
- Bible search
- Strong's chapter and word requests
- Journal and reading-plan lists
- Translation requests
- TTS requests
- Subscription status
- Admin list and analytics requests

Run cold-start, warm-cache, provider-degraded, and concurrent-user scenarios separately.

## 5. Phase 2: Low-Risk Request Improvements

### 5.1 Consolidate authentication and subscription lookups

Current locations:

- `src/middlewares/auth.middleware.js`
- `src/middlewares/gating.middleware.js`

The authentication query should select account status, role, subscription tier, and access expiry once. Gating middleware should consume the attached request snapshot instead of querying the user again.

Expected outcome:

- One fewer query on gated requests
- Lower pool pressure
- Consistent account state throughout one request

### 5.2 Add endpoint-specific input limits

Define and test limits for:

- AI verse arrays
- Bible chapter batches and ranges
- Translation batch size and total characters
- TTS text size
- Verse-resource batches
- Pagination size
- Journal and PDF exports
- Generated response bytes

Return a clear `400`, `413`, or `429` response when a limit is exceeded.

### 5.3 Add bounded concurrency

Replace unbounded `Promise.all` and serial per-record loops with explicit bounded concurrency where work calls PostgreSQL or an external provider.

Apply this first to:

- AI verse batches
- Translation batches
- TTS generation
- Translation comparison
- Stripe synchronization
- Multi-chapter Bible operations
- Large resource lookups

### 5.4 Add response compression

Compress JSON, XML, and other large text responses at the proxy or application level. Do not recompress MP3, images, ZIP files, or other already-compressed formats.

Measure CPU impact and time to first byte before enabling compression globally.

## 6. Phase 3: Database Optimization

### 6.1 High-priority index candidates

Every index must be confirmed with an actual query plan.

| Table/model | Candidate index or constraint | Primary use |
|-------------|-------------------------------|-------------|
| `Highlight` | Unique `(createdBy, bookName, chapter, verseNumber)` | Exact highlight upsert and duplicate prevention |
| `Highlight` | `(createdBy, createdOn)` | Newest-first user highlights |
| `Favorite` | `(createdBy, createdOn)` | Newest-first favorites |
| `Note` | `(createdBy, createdOn)` | Newest-first notes |
| `ReadHistory` | `(createdBy, createdOn)` and `(createdBy, bookName, createdOn)` | Recent reading and book history |
| `Verification` | `(emailAddress, verificationType, status)` | Verification and password-reset lookup |
| `Verification` | `(emailAddress, code, verificationType, status)` | Code redemption |
| `SearchIndex` | Unique `(translation, bookName, chapter, verse)` | Exact verse retrieval |
| `SearchIndex` | `(bookName, chapter, verse, translation)` | Same verse across translations |
| Verse explanation child tables | `(explanationId, sortOrder)` | Ordered relation loading |
| `VerseWordStudyEntry` | `(strongsId, explanationId, sortOrder)` | Strong's reverse lookup |
| `Message` | Partial pending queue index on creation time | Email worker polling |
| `PushSetting` | Due reminder index or indexed `nextPushAt` | Reminder scheduling |
| `Activity` | `(userId, loggedInAt)` | User activity history |
| `SubscriptionEvent` | `(userId, createdOn)` | Subscription history |

### 6.2 Search indexes

The current Bible search combines full-text search with leading-wildcard `ILIKE`. The substring branch may prevent efficient use of the full-text index.

Plan:

1. Measure full-text and substring queries separately.
2. Use PostgreSQL full-text search as the primary path.
3. Add `pg_trgm` only if substring search remains a requirement.
4. Run substring fallback only when full-text search does not satisfy the request.
5. Avoid exact count queries on every search keystroke when `hasNext` is sufficient.
6. Move high-offset pagination to cursors.

### 6.3 Rewrite unbounded reads

Prioritize:

- Strong's unique words and book lookups
- Trivia statistics
- Reading-plan statistics
- Subscriber lists
- Journal exports
- Admin `all=true` requests
- User notes, answered-question IDs, and progress collections

Pagination, filtering, distinct counting, and aggregation should happen in PostgreSQL rather than after loading all rows into Node.js.

### 6.4 Reduce selected data

Use explicit Prisma `select` clauses to avoid retrieving:

- Password hashes in user lists and current-user responses
- Large content fields in list views
- Nested relations that are not returned
- Complete records for existence checks

Prefer `findUnique` for fields already protected by unique constraints.

### 6.5 Parallelize independent queries

Run count and page-data queries concurrently when an exact total is required. When an exact total is not required, request one extra row and return `hasNext`.

## 7. Phase 4: Bible Translation Performance

Current high-cost paths are mainly in:

- `src/modules/bible-translations/service.js`
- `src/modules/bible-translations/controller.js`
- `src/modules/bible-translations/discovery.js`

### 7.1 Short-term improvements

- Generate book and chapter metadata for every bundled translation during build or deployment.
- Add cache single-flight so concurrent misses share one file read or parse.
- Add strict limits to chapter batch and chapter-range endpoints.
- Use bounded concurrency for multi-chapter reads.
- Record cold/warm file-read, extraction, parsing, and cache durations.
- Avoid full-Bible parsing for metadata that can be generated ahead of time.

### 7.2 Long-term storage options

Preferred order for evaluation:

1. Prebuilt JSON files per translation/book/chapter.
2. Byte-offset indexes that read only the requested XML section.
3. PostgreSQL verse storage with full-text indexes.
4. SQLite artifacts for immutable Bible packages.

The selected format must preserve current translation IDs, verse text, book names, chapter numbers, download behavior, and API response contracts.

### 7.3 Bible search

Remove full XML parsing and JavaScript whole-Bible scans from live search requests. Search should use the populated `SearchIndex` table and database full-text search.

## 8. Phase 5: Redis and Cache Reliability

Current cache code: `src/services/cacheService.js`.

Planned improvements:

- Support `REDIS_URL`, authentication, and TLS.
- Define a reliable reconnect/recreation policy.
- Add per-key process-level single-flight.
- Add short distributed locks for expensive fills across replicas.
- Add TTL jitter to avoid simultaneous expiration.
- Add negative caching for safe not-found results.
- Do not block the response on nonessential cache writes.
- Report cache hit, miss, error, reconnect, payload-size, and fill-duration metrics.
- Keep cache keys versioned when response shape changes.

Cache changes must preserve correctness when Redis is unavailable.

## 9. Phase 6: Translation and TTS Controls

Primary locations:

- `src/modules/text-to-text-translation/`
- `src/modules/tts/`
- `src/services/lordsbookGateway.js`

### 9.1 Admission control

- Add per-user and per-IP rate limits.
- Require appropriate authentication or entitlement for expensive operations.
- Add maximum text and batch sizes.
- Add maximum queue length and per-user queued-work limits.
- Reject overload with `429` or `503` and `Retry-After`.

### 9.2 Deadlines and cancellation

- Add a total request deadline that includes queue wait and retries.
- Add a maximum queue age.
- Abort provider work when the client disconnects where safe.
- Add deadlines to Edge TTS stream completion.
- Keep provider retries inside the total request budget.

Initial budget candidates:

| Work | Candidate budget |
|------|------------------|
| Queue wait | 5 seconds |
| Text translation | 15-20 seconds total |
| TTS | 30 seconds total |

These values must be validated against real provider performance.

### 9.3 Caching and deduplication

- Deduplicate identical in-flight translation requests.
- Deduplicate identical Edge TTS requests.
- Record cache status, text length, provider, retry count, queue wait, and provider duration.
- Preserve the existing fallback behavior while preventing one provider from consuming the entire request budget.

## 10. Phase 7: Isolate Background Work

Move these workloads out of the API process:

- Email scheduler
- Daily Verse push scheduler
- Popular-search cleanup
- Stripe reconciliation
- Large PDF/export generation
- Heavy Bible indexing or parsing

Use a separate worker deployment or managed job runner.

### 10.1 Email queue

- Atomically claim a bounded batch.
- Use a `PROCESSING` state and lease expiry.
- Use `FOR UPDATE SKIP LOCKED` or an equivalent atomic claim.
- Reuse one SMTP transporter.
- Ensure multiple workers cannot send the same message.

### 10.2 Push reminders

Store an indexed `nextPushAt` value instead of scanning every enabled user every minute. Process a bounded due batch and update only users whose delivery succeeded.

### 10.3 Multi-replica safety

Process-local `isRunning` flags are not sufficient across replicas. Use distributed locks only for singleton maintenance tasks; use atomic row claiming for normal job queues.

## 11. Phase 8: Stripe Performance

- Cache price-to-tier mappings.
- Fetch independent prices concurrently with bounded concurrency.
- Deduplicate price IDs before requesting details.
- Paginate admin subscriber results.
- Avoid reading every Stripe subscription in normal user requests.
- Make webhooks maintain the local subscription state.
- Move full Stripe reconciliation to a worker.
- Record Stripe request count, page count, remote duration, and database query count.

Normal subscription-status requests should primarily read local database state.

## 12. Phase 9: Large Files, Uploads, and Exports

- Stream PDF and text exports instead of embedding base64 in JSON.
- For large exports, create a background job and return a temporary download URL.
- Use asynchronous filesystem APIs.
- Move durable uploads to object storage.
- Stream audio where supported.
- Set output-size and export-entry limits.
- Record generated bytes, heap growth, time to first byte, and total duration.

## 13. Phase 10: Startup and Deployment

### 13.1 Awaited bootstrap

Startup order:

1. Load and validate environment configuration.
2. Connect to PostgreSQL.
3. Verify required Bible/index artifacts.
4. Initialize Redis without making it mandatory for correctness.
5. Start the HTTP listener.
6. Mark the instance ready.

### 13.2 Health checks

- `/livez`: process is alive.
- `/readyz`: PostgreSQL and required local assets are available.

Configure Railway/container health checks and graceful termination. Add a maximum shutdown grace period so a stuck request cannot block deployment indefinitely.

### 13.3 Database lifecycle

- Run Prisma migrations as a release step.
- Do not use `prisma db push --accept-data-loss` during web-server startup.
- Size `connection_limit` from the database connection limit and maximum number of API and worker processes.
- Evaluate PgBouncer or provider pooling before adding replicas.

## 14. Implementation Order

### Milestone 1: Visibility and protection

- Add request IDs and structured duration logs.
- Add database, Redis, provider, queue, and event-loop measurements.
- Add input limits, rate limits, queue bounds, and total deadlines.
- Build baseline load tests.

### Milestone 2: Fast low-risk improvements

- Consolidate authentication and gating queries.
- Parallelize independent count/data work.
- Add response compression.
- Fix Redis configuration and cache single-flight.
- Await database readiness before listening.

### Milestone 3: Database improvements

- Capture production-like query plans.
- Add only verified indexes.
- Replace unbounded reads and in-memory pagination.
- Reduce over-fetching.
- Move search pagination to cursors where needed.

### Milestone 4: Bible and search architecture

- Prebuild indexes for every translation.
- Remove whole-Bible XML parsing from request paths.
- Route Bible search through indexed database search.
- Benchmark the artifact/storage options before migration.

### Milestone 5: Workload isolation

- Move schedulers and reconciliation to workers.
- Stream or asynchronously generate exports.
- Add distributed coordination and atomic queue claiming.

### Milestone 6: Deployment tuning

- Add readiness/liveness checks.
- Tune connection pools from measured concurrency.
- Run migration jobs separately.
- Load-test before considering horizontal scaling.

## 15. Verification for Every Change

Each performance change must include:

- A captured before measurement
- A captured after measurement using the same dataset and load
- Correctness tests for the affected endpoint
- API response contract comparison
- Query-plan comparison for database changes
- Memory and event-loop comparison for CPU/file changes
- Rollback instructions

Required release checks:

- Existing automated tests pass.
- Mobile and web clients continue to parse the same responses.
- Cache-disabled behavior remains correct.
- Provider failure behavior is bounded and documented.
- Multi-replica tests do not duplicate email, push, or webhook effects.
- No secrets or personal content appear in performance logs.

## 16. Rollout Strategy

1. Deploy instrumentation without changing endpoint behavior.
2. Collect at least several days of representative latency data.
3. Rank routes by total time consumed and p95/p99 latency.
4. Optimize one bottleneck class at a time.
5. Deploy behind configuration flags where behavior could change.
6. Canary the change and compare error and latency metrics.
7. Keep or remove the change based on measured improvement.
8. Update this document with actual measurements and completed milestones.

## 17. Information Needed Before Implementation

Collect the following before selecting the first implementation milestone:

- Three to five slow endpoint paths
- Typical and worst observed response times
- Whether delays occur only on the first request or every request
- Current Railway instance CPU and memory
- Number of API replicas
- PostgreSQL connection limit and region
- Redis deployment status and region
- Whether slow requests correlate with TTS, translation, email, or notification activity
- Approximate production row counts for the largest tables

This information will determine whether the first implementation should focus on Bible XML, PostgreSQL queries, external providers, caching, or deployment cold starts.
