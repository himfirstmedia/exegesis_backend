# Kokoro TTS Backend and Railway Deployment Plan

## Objective

Replace the backend's direct dependency on Microsoft Edge TTS with a provider-based TTS implementation that can use Kokoro-FastAPI.

The backend work starts before Kokoro is deployed. Kokoro calls will be tested with mocked HTTP responses first, then with a local CPU container, and finally with a private Kokoro service on Railway.

The React Native app must continue using the existing backend routes:

```text
POST /tts/speak
POST /tts/speak-with-timings
GET  /tts/voices
GET  /tts/status
```

## Target Architecture

```text
React Native app
        |
        v
Node backend on Railway
        |
        | Railway private network
        v
Kokoro-FastAPI CPU service on Railway
```

The mobile app must not call Kokoro directly. The Node backend remains responsible for authentication, validation, provider selection, caching, fallback behavior, and response formatting.

## Phase 1: Prepare the Backend Before Kokoro Is Running

### 1. Add provider configuration

Add the following variables to `backend/.env.example`:

```env
TTS_PROVIDER=edge
TTS_FALLBACK_PROVIDER=edge
KOKORO_URL=http://localhost:8880
KOKORO_MODEL=kokoro
KOKORO_DEFAULT_VOICE=bm_george
KOKORO_TIMEOUT_MS=60000
KOKORO_MAX_CONCURRENCY=2
KOKORO_IMAGE_VERSION=local
```

Keep `TTS_PROVIDER=edge` as the initial default. This allows all backend changes to be deployed without requiring Kokoro to be online.

Provider behavior:

```text
TTS_PROVIDER=edge
  -> use the existing Edge implementation

TTS_PROVIDER=kokoro
  -> try Kokoro
  -> use Edge only when fallback is enabled and Kokoro fails
```

### 2. Refactor the current TTS service into provider functions

Update `backend/src/modules/tts/service.js` without changing its public exports.

Keep the existing public functions:

```js
synthesize(text, voiceId, speed)
synthesizeWithTimings(text, voiceId, speed, priority)
getVoices()
getStatus()
warmUpTTS()
```

Create internal provider-specific functions:

```js
synthesizeEdge(text, voiceId, speed)
synthesizeEdgeWithTimings(text, voiceId, speed, priority)
getEdgeVoices()

synthesizeKokoro(text, voiceId, speed)
synthesizeKokoroWithTimings(text, voiceId, speed)
getKokoroVoices()
```

Do not remove Edge during the first Kokoro release. It is needed as a rollback and temporary fallback provider.

### 3. Implement the Kokoro speech adapter

`synthesizeKokoro()` will call:

```text
POST {KOKORO_URL}/v1/audio/speech
```

Request body:

```json
{
  "model": "kokoro",
  "input": "In the beginning God created the heavens and the earth.",
  "voice": "bm_george",
  "response_format": "mp3",
  "speed": 1
}
```

The adapter must:

- Use `AbortController` with `KOKORO_TIMEOUT_MS`.
- Validate that text is not empty.
- Validate the requested voice against the Kokoro voice list when available.
- Use `KOKORO_DEFAULT_VOICE` for missing or unsupported voice IDs.
- Convert the response `ArrayBuffer` to a Node `Buffer`.
- Reject empty or unusually small audio responses.
- Include the HTTP status and a short response message in logged errors.
- Never return Kokoro's internal URL or internal errors to the mobile client.

### 4. Implement the Kokoro timing adapter

`synthesizeKokoroWithTimings()` will call:

```text
POST {KOKORO_URL}/dev/captioned_speech
```

Initial request body:

```json
{
  "model": "kokoro",
  "input": "In the beginning God created the heavens and the earth.",
  "voice": "bm_george",
  "response_format": "mp3",
  "speed": 1,
  "stream": false
}
```

The adapter must convert Kokoro's response to the contract already expected by `controller.js`:

```js
{
  audioBuffer: Buffer,
  wordOffsetsMs: number[]
}
```

Conversion requirements:

- Decode Kokoro's base64 audio into a `Buffer`.
- Extract each word's start timestamp.
- Convert seconds to milliseconds.
- Return offsets in ascending order.
- Reject malformed timestamp entries.
- Log when the number of timestamps does not match the normalized spoken words.
- Keep Edge timed synthesis as fallback until highlighting is verified in the app.

`/dev/captioned_speech` is not a stable Kokoro API. The production Docker image must therefore be pinned to a release tag or digest.

### 5. Implement the Kokoro voice adapter

`getKokoroVoices()` will call:

```text
GET {KOKORO_URL}/v1/audio/voices
```

Convert each result to the backend's existing voice format:

```json
{
  "name": "George",
  "voiceId": "bm_george",
  "source": "kokoro",
  "category": "British Male"
}
```

Initial voices to evaluate for Bible narration:

```text
bm_george
bm_lewis
am_michael
bf_emma
af_heart
```

Do not choose the final default based only on a short sentence. Test complete verses, names, numbers, references, headings, and at least one full chapter.

### 6. Add provider-aware cache keys

The existing cache key must include the provider and model version.

Target format:

```text
provider:model-version:text-hash:voiceId:speed
```

Example:

```text
kokoro:v1.0:98ae21:bm_george:1
```

This prevents cached Ryan audio from being returned for a Kokoro request containing the same text.

Use the same provider-aware key for:

- In-memory audio cache
- In-memory timing cache
- Redis audio cache
- Redis timing cache

### 7. Add a Kokoro concurrency limit

Start with `KOKORO_MAX_CONCURRENCY=2`.

Requests above the limit should wait in a bounded queue. The backend should reject requests when the queue is full instead of consuming unlimited memory.

Track:

- Active Kokoro requests
- Queued Kokoro requests
- Completed Kokoro requests
- Failed Kokoro requests
- Edge fallback count

### 8. Preserve current controllers and routes

The following files should require little or no behavioral change:

```text
backend/src/modules/tts/controller.js
backend/src/modules/tts/route.js
```

The provider logic belongs in `service.js`. Existing response contracts should remain unchanged so the mobile app can be migrated separately.

### 9. Extend TTS status output

Update `getStatus()` to report non-secret provider information:

```json
{
  "enabled": true,
  "provider": "kokoro",
  "fallbackProvider": "edge",
  "kokoroConfigured": true
}
```

Do not expose `KOKORO_URL`, Railway internal domains, credentials, or stack traces.

## Phase 2: Test the Backend Without Kokoro

Update `backend/src/modules/tts/service.test.js` and mock `global.fetch`.

Required tests:

- Kokoro speech request contains model, text, voice, format, and speed.
- MP3 `ArrayBuffer` is converted to a `Buffer`.
- Captioned audio base64 is decoded correctly.
- Timestamp seconds are converted to milliseconds.
- Kokoro voice responses are mapped to the app voice format.
- Empty Kokoro audio is rejected.
- Unsupported voice IDs use the configured default.
- Kokoro timeout aborts the request.
- Kokoro failure invokes Edge when fallback is enabled.
- Kokoro failure does not invoke Edge when fallback is disabled.
- Cache keys include provider, model version, voice, and speed.
- Repeated identical requests use the cache.
- Concurrent identical requests are deduplicated.
- `TTS_PROVIDER=edge` preserves current behavior.

Acceptance criteria:

```text
The backend compiles and all TTS tests pass while no Kokoro container is running.
Production can remain on TTS_PROVIDER=edge.
```

## Phase 3: Run Kokoro Locally on CPU

The attempted GPU command failed with:

```text
failed to discover GPU vendor from CDI: no known GPU vendor found
```

This means Docker cannot use an NVIDIA GPU on the machine. That is not a blocker because Railway will use the CPU image.

### 1. Pull the CPU image

```bash
sudo docker pull ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

### 2. Run with Railway-like limits

```bash
sudo docker run \
  --rm \
  --name kokoro-cpu \
  --cpus=4 \
  --memory=6g \
  -p 8880:8880 \
  ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

Do not use `--gpus all` with the CPU image.

### 3. Verify the API

```bash
curl http://localhost:8880/v1/audio/voices
```

API documentation:

```text
http://localhost:8880/docs
```

### 4. Generate a test MP3

```bash
curl -X POST http://localhost:8880/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kokoro",
    "input": "In the beginning God created the heavens and the earth.",
    "voice": "bm_george",
    "response_format": "mp3",
    "speed": 1
  }' \
  --output kokoro-test.mp3
```

### 5. Test the backend against local Kokoro

Set local backend variables:

```env
TTS_PROVIDER=kokoro
TTS_FALLBACK_PROVIDER=edge
KOKORO_URL=http://localhost:8880
KOKORO_DEFAULT_VOICE=bm_george
```

Test through the Node backend, not only through Kokoro directly:

```text
GET  /tts/status
GET  /tts/voices
POST /tts/speak
POST /tts/speak-with-timings
```

This confirms that the Node adapter and response contracts work before Railway deployment.

## Phase 4: Benchmark Kokoro Locally

Test these workloads:

| Workload | Test input |
| --- | --- |
| Short | One Bible verse |
| Medium | Ten Bible verses |
| Long | One complete chapter |

Monitor the container:

```bash
sudo docker stats kokoro-cpu
```

Measure:

- First response latency
- Total synthesis time
- CPU usage
- Peak memory
- MP3 size
- Timestamp accuracy
- One-request performance
- Two-request concurrency
- Four-request concurrency

Initial success targets:

- No out-of-memory restarts at 6 GB RAM.
- One verse begins processing within an acceptable reader delay.
- Two simultaneous requests complete without failure.
- Word highlighting remains aligned for a complete chapter.

## Phase 5: Update Mobile Voice Compatibility

The React Native app currently persists Edge IDs such as:

```text
en-GB-RyanNeural
```

Kokoro does not recognize those IDs.

Update:

```text
app/src/api/tts-service.ts
app/src/utilits/bibleTTS.ts
app/src/utilits/tts/types.ts
app/src/hooks/useVoiceReading.ts
app/src/hooks/usePlaybackSettings.ts
```

Required changes:

- Add `kokoro` to `TTSVoice.source`.
- Replace the hardcoded Edge fallback list when the backend provider is Kokoro.
- Validate the persisted voice against `/tts/voices`.
- Replace an unsupported persisted Edge ID with the backend default Kokoro voice.
- Persist the selected Kokoro voice ID.
- Ensure voice changes invalidate audio buffers.
- Ensure playback restarts from the current verse after a voice change.
- Confirm that the selected voice remains selected after restarting the app.

The existing `edgeVoiceId` property can remain temporarily for compatibility, but it should later be renamed to a provider-neutral `voiceId`.

## Phase 6: Pin the Kokoro Docker Image

Do not deploy `latest` to production.

Select a stable Kokoro-FastAPI release:

```text
ghcr.io/remsky/kokoro-fastapi-cpu:<release-tag>
```

For maximum reproducibility, pin the digest:

```text
ghcr.io/remsky/kokoro-fastapi-cpu@sha256:<cpu-image-digest>
```

The first Railway deployment can use the published image directly. A custom image is not required initially.

If a repository-controlled image is desired later, create a small Dockerfile:

```dockerfile
FROM ghcr.io/remsky/kokoro-fastapi-cpu:<release-tag>

ENV PORT=8880
EXPOSE 8880
```

The base image's command should be inherited rather than replaced.

## Phase 7: Deploy Kokoro as a Railway Service

### 1. Create the service

Inside the same Railway project as the Node backend:

1. Select **New Service**.
2. Select **Docker Image**.
3. Enter the pinned Kokoro CPU image.
4. Name the service `kokoro`.
5. Configure port `8880` if Railway asks for a target port.
6. Keep one replica initially.
7. Deploy it in the same region as the Node backend.
8. Disable sleeping or serverless mode to avoid model cold starts.
9. Do not override the image start command.

Recommended starting resources:

```text
CPU:     4 vCPU
Memory:  6-8 GB
Replica: 1
```

The published image contains the model, so a persistent volume should not initially be required.

### 2. Configure health checking

Use:

```text
/v1/audio/voices
```

Allow enough startup time for model initialization before Railway marks the deployment unhealthy.

### 3. Keep the service private

Do not expose Kokoro directly to the internet. The public mobile API remains the Node backend.

Add this reference variable to the Node service:

```env
KOKORO_URL=http://${{kokoro.RAILWAY_PRIVATE_DOMAIN}}:8880
```

If Railway reference variables are unavailable, use the generated private domain:

```env
KOKORO_URL=http://kokoro.railway.internal:8880
```

### 4. Deploy with Edge still active

Keep production on:

```env
TTS_PROVIDER=edge
```

Use a staging backend or temporary test environment with:

```env
TTS_PROVIDER=kokoro
TTS_FALLBACK_PROVIDER=edge
```

Verify that the Node service can reach Kokoro over the Railway private network before switching production.

## Phase 8: Railway Integration Verification

Test these requests through the public Node backend:

- `/tts/status` reports Kokoro configuration.
- `/tts/voices` returns Kokoro voices.
- `/tts/speak` returns playable MP3 audio.
- `/tts/speak-with-timings` returns audio and ordered offsets.
- The same request uses Redis cache on the second call.
- An invalid voice uses the configured default.
- A stopped Kokoro service invokes Edge fallback.
- No Railway private URL appears in API responses or logs sent to clients.

Monitor:

- Node-to-Kokoro request latency
- Kokoro CPU usage
- Kokoro memory usage
- Container restarts
- Request queue depth
- Cache hit rate
- Kokoro timeout count
- Edge fallback count

## Phase 9: Staged Production Rollout

Use this rollout order:

1. Merge backend provider abstraction with `TTS_PROVIDER=edge`.
2. Deploy backend changes while production remains on Edge.
3. Run and verify local Kokoro CPU integration.
4. Deploy the private Kokoro Railway service.
5. Test Kokoro through a staging backend.
6. Test the React Native development build.
7. Enable Kokoro for internal users.
8. Switch production to `TTS_PROVIDER=kokoro`.
9. Keep Edge fallback enabled for at least seven days.
10. Review errors, latency, highlighting, and Railway cost.
11. Disable Edge fallback only after Kokoro is stable.

Immediate rollback:

```env
TTS_PROVIDER=edge
```

No mobile release should be required for provider rollback if the backend response contracts remain unchanged.

## Phase 10: Cost and Scaling Review

Railway is suitable when:

- Traffic is low or moderate.
- Redis serves repeated Bible passages.
- Easy deployment is more important than fixed monthly cost.
- CPU usage is intermittent.

Move Kokoro to a fixed-price CPU VPS when:

- Kokoro runs continuously.
- Railway CPU cost becomes higher than a VPS.
- Several users synthesize chapters concurrently.
- Dedicated CPU performance is required.
- Railway cold starts or resource contention affect playback.

The Node backend can remain on Railway if Kokoro later moves to a VPS. Only `KOKORO_URL` and network security would change.

## Security Requirements

- Keep Kokoro private whenever possible.
- Do not let the mobile app call Kokoro directly.
- Apply text-length limits in the Node controller.
- Keep existing authentication behavior for TTS routes.
- Add rate limiting before enabling Kokoro broadly.
- Do not log complete private user text in production.
- Never expose Railway internal domains in client responses.
- Pin the Docker image version.
- Keep dependencies and the base image updated deliberately.

## Final Acceptance Criteria

The migration is complete when:

- Backend TTS tests pass without a running Kokoro service.
- Local CPU Kokoro generates playable MP3 audio.
- Kokoro timestamps drive accurate Bible word highlighting.
- The backend can switch between Edge and Kokoro with environment variables.
- Cache keys cannot mix Edge and Kokoro audio.
- Persisted Edge voice IDs migrate safely to Kokoro voices.
- Kokoro runs privately on Railway.
- Production can roll back to Edge without a mobile release.
- Railway CPU, memory, latency, and cost are acceptable after a seven-day observation period.
