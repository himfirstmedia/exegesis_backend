# LibreTranslate Backend and Railway Deployment Plan

## Objective

Add self-hosted LibreTranslate as the backend's primary translation provider while preserving Google Translate and MyMemory as configurable fallbacks during rollout.

The backend integration will be implemented and tested with mocked responses before LibreTranslate is deployed. It will then be tested against a local Docker container and finally connected to a private Railway service.

The React Native app should continue calling the existing backend translation endpoint rather than calling LibreTranslate directly.

## Current Translation Flow

The current implementation is in:

```text
backend/src/utils/translator.js
```

Current provider order:

```text
Google Translate through @vitalets/google-translate-api
        |
        v
MyMemory fallback
        |
        v
Original English text when both providers fail
```

Current supporting behavior:

- In-memory cache
- Redis cache
- Seven-day cache TTL
- In-flight request deduplication
- Two-request concurrency limit
- Retry for selected network and rate-limit errors
- Long-text chunking at 500 characters
- Batch translation helpers

LibreTranslate should be added without removing these protections.

## Target Architecture

```text
React Native app
        |
        v
Node backend on Railway
        |
        | Railway private network
        v
LibreTranslate service on Railway
        |
        v
Argos Translate language models
```

Google Translate and MyMemory remain temporary fallback providers until LibreTranslate coverage, quality, latency, and reliability have been verified.

## Licensing Note

LibreTranslate is licensed under AGPL-3.0 and is powered by Argos Translate.

Before production use:

- Preserve all required copyright and license notices.
- Do not remove LibreTranslate license information from a redistributed image.
- Review AGPL-3.0 source-availability requirements, especially if modifying LibreTranslate itself.
- Keep a record of the exact LibreTranslate source version used by the deployed image.
- Treat this section as an engineering reminder, not legal advice.

## Phase 1: Prepare the Backend Before LibreTranslate Is Running

### 1. Add provider configuration

Add the following variables to `backend/.env.example`:

```env
TRANSLATION_PROVIDER=google
TRANSLATION_FALLBACK_PROVIDERS=mymemory

LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_API_KEY=
LIBRETRANSLATE_TIMEOUT_MS=15000
LIBRETRANSLATE_MAX_CONCURRENCY=2
LIBRETRANSLATE_MODEL_VERSION=local

TRANSLATION_CACHE_TTL_SECONDS=604800
TRANSLATION_MAX_TEXT_LENGTH=20000
TRANSLATION_CHUNK_SIZE=1000
```

Keep `TRANSLATION_PROVIDER=google` initially. This allows backend changes to be deployed without requiring LibreTranslate to be online.

Target provider modes:

```text
TRANSLATION_PROVIDER=google
  -> Google
  -> configured fallbacks

TRANSLATION_PROVIDER=libretranslate
  -> LibreTranslate
  -> configured fallbacks
```

Recommended initial production rollout:

```env
TRANSLATION_PROVIDER=libretranslate
TRANSLATION_FALLBACK_PROVIDERS=google,mymemory
```

Long-term configuration after LibreTranslate is stable:

```env
TRANSLATION_PROVIDER=libretranslate
TRANSLATION_FALLBACK_PROVIDERS=mymemory
```

### 2. Refactor translator.js into provider adapters

Keep the existing public API:

```js
translateText(text, lang)
translateMany(texts, lang)
translateLongText(text, lang)
translateResult(result, lang)
```

Add provider-specific internal functions:

```js
translateWithLibreTranslate(text, sourceLang, targetLang)
translateManyWithLibreTranslate(texts, sourceLang, targetLang)
translateWithGoogle(text, targetLang)
translateWithMyMemory(text, targetLang)
getLibreTranslateLanguages()
```

Add one provider dispatcher responsible for:

- Selecting the configured primary provider.
- Trying fallbacks in configured order.
- Skipping providers that do not support the requested language.
- Recording provider failures without exposing internal errors to clients.
- Returning the original English text only after all configured providers fail.

### 3. Implement the LibreTranslate adapter

LibreTranslate translation endpoint:

```text
POST {LIBRETRANSLATE_URL}/translate
```

Request body:

```json
{
  "q": "In the beginning God created the heavens and the earth.",
  "source": "en",
  "target": "fr",
  "format": "text"
}
```

When an API key is configured, include:

```json
{
  "api_key": "configured-key"
}
```

Expected response:

```json
{
  "translatedText": "Au commencement, Dieu crea les cieux et la terre."
}
```

The adapter must:

- Use `AbortController` with `LIBRETRANSLATE_TIMEOUT_MS`.
- Validate source and target language codes.
- Reject empty `translatedText` values.
- Decode HTML entities only when required.
- Distinguish unsupported-language responses from temporary server failures.
- Retry only retryable failures.
- Never log API keys.
- Never expose `LIBRETRANSLATE_URL` to the mobile client.

### 4. Add language discovery and support checks

LibreTranslate language endpoint:

```text
GET {LIBRETRANSLATE_URL}/languages
```

The backend currently supports app translation files for these language codes:

```text
en, sw, ta, ru, es, bn, kn, ne, hi, it, de, ar, pt, pa,
ml, fr, gu, fil, mr, te, ur, el
```

LibreTranslate and Argos Translate may not support every language in this list.

The coverage goal is to enable every language supported by the pinned LibreTranslate release, not only the initial European-language subset. The backend should expose all loaded LibreTranslate targets and continue using Google or MyMemory for app languages that Argos does not support.

For maximum model discovery, do not set `LT_LOAD_ONLY`. Omitting it allows LibreTranslate to discover and install all available Argos models when model updates are enabled. Do not set it to an empty string, because an empty value may be interpreted differently from an omitted variable.

Create a language support matrix after local deployment:

| App code | LibreTranslate code | Supported | Fallback required |
| --- | --- | --- | --- |
| en | en | Required source | No |
| es | es | Verify | Yes if unavailable |
| fr | fr | Verify | Yes if unavailable |
| fil | tl or fil | Verify mapping | Yes if unavailable |
| sw | sw | Verify | Yes if unavailable |

Do not hardcode guessed support. Populate the final matrix from `/languages` returned by the exact deployed image and loaded model set.

Cache the language response in memory with a short TTL, such as five minutes. Refresh it after LibreTranslate reports an unsupported language or after deployment.

### 5. Add explicit language-code mapping

Create a provider-specific mapping rather than changing app language codes globally.

Examples to verify:

```js
{
  fil: 'tl'
}
```

Only add mappings confirmed by `/languages` and translation tests.

When a language is unsupported:

```text
Skip LibreTranslate immediately
        |
        v
Try Google or MyMemory fallback
```

### 6. Make cache keys provider-aware

The current key only contains a text hash and target language. Update it to include:

```text
cache-schema:provider:model-version:source:target:text-hash
```

Example:

```text
v2:libretranslate:1.6.5:en:fr:8afe31
```

This prevents Google translations cached under the old implementation from being returned as LibreTranslate results during comparison and rollout.

Provider-aware keys must be used for:

- In-memory cache
- Redis cache
- In-flight request deduplication

Do not delete the existing cache immediately. A new cache schema prefix safely separates old and new entries until they expire.

### 7. Update concurrency and batching

LibreTranslate is CPU-intensive. Begin with:

```env
LIBRETRANSLATE_MAX_CONCURRENCY=2
```

The current 600 ms delay exists to protect external providers from IP rate limiting. Do not apply that delay to private LibreTranslate calls unless benchmarking shows it is needed.

Use separate provider controls:

```text
LibreTranslate: bounded concurrency queue
Google: existing concurrency and minimum delay
MyMemory: existing concurrency and minimum delay
```

Test whether the deployed LibreTranslate version supports an array in `q`. If supported and reliable, update `translateMany()` to send batches instead of one request per string.

Batch requirements:

- Preserve input ordering.
- Reject mismatched response counts.
- Limit the number of strings and total characters.
- Fall back per item when only some results fail.
- Do not create an unbounded Promise.all operation.

### 8. Revisit long-text chunking

The current 500-character limit mainly protects the MyMemory fallback.

Use provider-specific chunking:

```text
LibreTranslate: begin testing at 1,000 characters
Google: preserve a conservative tested limit
MyMemory: retain 500 characters
```

Continue splitting near sentence boundaries. Translation quality should be compared at 500, 1,000, and 2,000 characters before changing production defaults.

### 9. Improve translation endpoint safety

The Bible translation routes currently define both:

```text
POST /translate-text
GET  /translate-text
```

`getTranslationText` reads `req.body`, making the GET version unreliable because GET requests normally do not contain a request body.

Plan:

- Keep `POST /translate-text` as the supported endpoint.
- Remove the duplicate GET route after confirming no client depends on it.
- Alternatively, make GET read `req.query` during a deprecation period.
- Validate `text` as a non-empty string.
- Validate `lang` against the app-supported language list.
- Enforce `TRANSLATION_MAX_TEXT_LENGTH`.
- Add rate limiting.
- Preserve guest access only if required by current app behavior.
- Return an appropriate 400 response for invalid input instead of HTTP 200 with `success: false`.

## Phase 2: Test the Backend Without LibreTranslate

Add focused tests for `backend/src/utils/translator.js` with mocked `global.fetch`.

Required tests:

- LibreTranslate request uses `/translate`.
- Request includes `q`, `source`, `target`, and `format`.
- API key is included only when configured.
- Empty translated text is rejected.
- Timeout aborts the request.
- Unsupported languages skip LibreTranslate.
- Language mappings are provider-specific.
- Google fallback runs when LibreTranslate fails.
- MyMemory fallback runs after Google fails.
- Original text is returned only after all providers fail.
- Provider-aware cache keys prevent cross-provider collisions.
- Redis cache avoids an API call.
- In-flight duplicate requests share one promise.
- Batch result ordering is preserved.
- Long text is split and rejoined correctly.
- `TRANSLATION_PROVIDER=google` preserves current production behavior.

Acceptance criteria:

```text
All translation tests pass while no LibreTranslate container is running.
Production remains on TRANSLATION_PROVIDER=google.
```

## Phase 3: Run LibreTranslate Locally with Docker

### 1. Select and pin an official image

Start from the official image:

```text
libretranslate/libretranslate:<release-tag>
```

Do not deploy `latest` permanently. Record the tested image digest before Railway deployment.

### 2. Discover the maximum language set

Do not set `LT_LOAD_ONLY` during the maximum-coverage discovery run. With `LT_UPDATE_MODELS=true`, LibreTranslate can discover and install every Argos model available to the pinned release.

Maximum coverage increases:

- First startup time
- Model download time
- Persistent disk usage
- Memory usage
- Health-check startup timeout requirements
- Railway operating cost

Use a persistent Docker volume locally so the model set is downloaded once. After startup, use `/languages` to record the exact source and target pairs. The final production set is every working English-to-target pair, plus provider fallbacks for unsupported app languages.

### 3. Run locally

Example local command:

```bash
sudo docker run --rm \
  --name libretranslate \
  --cpus=8 \
  --memory=16g \
  -p 5000:5000 \
  -v libretranslate-models:/home/libretranslate/.local \
  -e LT_HOST=0.0.0.0 \
  -e LT_PORT=5000 \
  -e LT_THREADS=8 \
  -e LT_UPDATE_MODELS=true \
  -e LT_DISABLE_WEB_UI=true \
  -e LT_DISABLE_FILES_TRANSLATION=true \
  libretranslate/libretranslate:<release-tag>
```

The first startup may take substantially longer while all available Argos models are downloaded and prepared. If the machine has fewer resources, reduce `--cpus`, `--memory`, and `LT_THREADS`, but expect slower installation and translation.

### 4. Verify languages

```bash
curl http://localhost:5000/languages
```

Record the returned language codes and supported target lists.

### 5. Verify translation

```bash
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{
    "q": "In the beginning God created the heavens and the earth.",
    "source": "en",
    "target": "fr",
    "format": "text"
  }'
```

### 6. Test through the Node backend

Set local backend variables:

```env
TRANSLATION_PROVIDER=libretranslate
TRANSLATION_FALLBACK_PROVIDERS=google,mymemory
LIBRETRANSLATE_URL=http://localhost:5000
```

Test the existing backend route instead of only calling LibreTranslate directly:

```text
POST /bible-translations/translate-text
```

Confirm that the backend response contract remains compatible with the app.

## Phase 4: Translation Quality Evaluation

Machine translation quality is important because the project contains Scripture, theological explanations, reading plans, questions, and devotional text.

Build a representative evaluation dataset containing:

- Short Bible verses
- Long Bible passages
- Names such as Nebuchadnezzar and Melchizedek
- Book names and references
- Theological terms such as justification, sanctification, covenant, atonement, and resurrection
- Questions
- Bullet lists
- Quoted text
- Numbers and chapter references
- Long devotional paragraphs

Compare LibreTranslate with the existing Google output for every supported language.

Review:

- Meaning preservation
- Names and proper nouns
- Scripture references
- Punctuation
- Paragraph structure
- Missing sentences
- Repeated text
- Untranslated English fragments
- Theological terminology

Do not enable LibreTranslate for a language solely because `/languages` reports that it is supported.

## Phase 5: Benchmark Locally

Test:

| Workload | Input |
| --- | --- |
| Short | One UI message |
| Medium | One Bible verse explanation |
| Long | One devotional paragraph |
| Batch | 10, 50, and 100 short strings |

Measure:

- Cold startup time
- First uncached translation latency
- Warm translation latency
- Two-request concurrency
- Four-request concurrency
- CPU usage
- Peak memory
- Model disk usage
- Redis cache hit latency

For the all-language model set, start benchmarking with 8 vCPU, 12-16 GB RAM, and two concurrent requests. Adjust only after collecting metrics. A reduced language shard can start with fewer resources.

## Phase 6: Create a Reproducible Docker Image

Create a new deployment directory, separate from the Node backend image:

```text
libretranslate-image/
```

Initial wrapper Dockerfile:

```dockerfile
FROM libretranslate/libretranslate:<release-tag-or-digest>

ENV LT_HOST=0.0.0.0 \
    LT_PORT=5000 \
    LT_DISABLE_WEB_UI=true \
    LT_DISABLE_FILES_TRANSLATION=true

EXPOSE 5000
```

Do not bake API secrets into the image.

Two model strategies are available:

### Strategy A: Railway volume

Use the official image and persist downloaded models at:

```text
/home/libretranslate/.local
```

Advantages:

- Smaller custom wrapper image
- Easier model updates

Disadvantages:

- First deployment needs model downloads
- Startup depends on the volume being populated
- Model versions can change unless controlled

### Strategy B: Models baked into a custom image

Download only approved language models during Docker build.

Advantages:

- Reproducible deployment
- No model download on startup
- Easier rollback by image tag

Disadvantages:

- Larger image
- Slower Docker builds and pushes
- Every model update requires a new image

Use Strategy A for initial testing. Move to Strategy B after the language list and model versions are stable.

## Phase 7: Deploy LibreTranslate on Railway

### 1. Create a separate service

Inside the same Railway project as the Node backend:

1. Select **New Service**.
2. Select **Docker Image**.
3. Enter the pinned LibreTranslate image or the custom Docker Hub image.
4. Name the service `libretranslate`.
5. Deploy it in the same Railway region as the Node backend.
6. Keep one replica initially.
7. Configure port `5000`.
8. Disable sleeping if low-latency translation is required.

Recommended starting resources for maximum language coverage:

```text
CPU: 8 vCPU
Memory: 12-16 GB
Replicas: 1
Model volume: begin at 20 GB and monitor actual usage
```

Actual requirements depend heavily on the number and size of available Argos models. Benchmark the pinned release before finalizing Railway limits. A paid Railway plan is required for a model set of this size.

### 2. Add a Railway volume

For the initial model strategy, mount a Railway volume at:

```text
/home/libretranslate/.local
```

This prevents model downloads after every deployment.

### 3. Configure Railway variables

Initial variables:

```env
PORT=5000
LT_HOST=0.0.0.0
LT_PORT=5000
LT_THREADS=8
LT_UPDATE_MODELS=true
LT_DISABLE_WEB_UI=true
LT_DISABLE_FILES_TRANSLATION=true
LT_CHAR_LIMIT=20000
LT_BATCH_LIMIT=100
```

Do not add `LT_LOAD_ONLY` to the maximum-coverage service. Its absence is intentional.

After the volume is populated and verified, consider changing:

```env
LT_UPDATE_MODELS=false
```

This prevents unplanned model updates during normal restarts.

### 4. Shard languages if one service is too large

If one all-language service exceeds Railway memory, storage, startup, or cost limits, deploy multiple private LibreTranslate services. Each service should load English plus a language group.

Example service groups:

```text
libretranslate-europe
libretranslate-indic
libretranslate-asia
libretranslate-other
```

The backend language router should map each target language to the appropriate private service URL. Every shard must include English because the project's dynamic content is translated from English.

Suggested backend variables:

```env
LIBRETRANSLATE_EUROPE_URL=http://libretranslate-europe.railway.internal:5000
LIBRETRANSLATE_INDIC_URL=http://libretranslate-indic.railway.internal:5000
LIBRETRANSLATE_ASIA_URL=http://libretranslate-asia.railway.internal:5000
LIBRETRANSLATE_OTHER_URL=http://libretranslate-other.railway.internal:5000
```

Sharding is preferred over removing languages when maximum coverage is a project requirement.

### 5. Configure health checking

Use:

```text
/languages
```

Allow a long health-check timeout on the first deployment because models may need to download and initialize.

### 6. Keep LibreTranslate private

Generate a public domain only for initial Postman testing. Remove it after the backend integration succeeds.

Add a Railway reference variable to the Node service:

```env
LIBRETRANSLATE_URL=http://${{libretranslate.RAILWAY_PRIVATE_DOMAIN}}:5000
```

If a direct private hostname is required:

```env
LIBRETRANSLATE_URL=http://libretranslate.railway.internal:5000
```

## Phase 8: Railway Verification

Test LibreTranslate directly during initial deployment:

```text
GET  /languages
POST /translate
```

Then test only through the Node backend:

```text
POST /bible-translations/translate-text
```

Verify:

- Loaded languages match the approved list.
- English-to-target translation works.
- Unsupported languages use fallback providers.
- Redis serves repeated translations.
- Batch translation preserves ordering.
- Long text is complete and correctly joined.
- Private networking works after the public domain is removed.
- No private domain or API key appears in client responses.

## Phase 9: Staged Production Rollout

Use this rollout order:

1. Add provider abstraction with `TRANSLATION_PROVIDER=google`.
2. Deploy backend changes while production remains on Google.
3. Test LibreTranslate locally.
4. Approve the initial language support matrix.
5. Deploy LibreTranslate privately on Railway.
6. Test through a staging backend.
7. Enable LibreTranslate for one or two approved languages.
8. Compare quality, latency, and errors for at least seven days.
9. Expand to additional approved languages gradually.
10. Keep Google and MyMemory fallbacks enabled during rollout.
11. Remove Google only after LibreTranslate coverage is sufficient.

Immediate rollback:

```env
TRANSLATION_PROVIDER=google
TRANSLATION_FALLBACK_PROVIDERS=mymemory
```

The mobile app should not require a new release for provider rollback.

## Phase 10: Monitoring and Cost

Track:

- Translation latency by provider
- Translation latency by language
- LibreTranslate request count
- Unsupported-language fallback count
- Google fallback count
- MyMemory fallback count
- Complete provider failure count
- Cache hit rate
- Redis failures
- LibreTranslate CPU usage
- LibreTranslate memory usage
- LibreTranslate restarts
- Model volume size
- Railway monthly cost

Do not log complete private user text in production metrics.

## Security Requirements

- Keep LibreTranslate private after testing.
- Keep translation requests behind the Node backend.
- Add input-length limits.
- Add request-rate limits.
- Validate target language codes.
- Disable file translation if unused.
- Disable the web UI in production.
- Do not bake secrets into the Docker image.
- Pin the Docker image and model versions.
- Restrict public access before enabling API-key mode as the only defense.
- Preserve required AGPL notices and source information.

## Final Acceptance Criteria

The migration is complete when:

- Backend tests pass without a running LibreTranslate service.
- Local LibreTranslate translates approved languages correctly.
- Unsupported app languages reliably use fallback providers.
- Cache keys cannot mix Google, MyMemory, and LibreTranslate results.
- The language support matrix is documented and quality-reviewed.
- Long text and batch translation preserve all input content.
- LibreTranslate runs privately on Railway.
- Argos models persist across deployments.
- The backend can switch providers using environment variables.
- Production can roll back to Google without a mobile release.
- Railway latency, CPU, memory, storage, and cost are acceptable after observation.
