# AI Explain-Verse — Deterministic Exegesis Engine (Zero-Cost, No External API)

**Goal** — Generate an *Intro, Explanation, Application, Prayer* for any selected verse(s) using a fully **deterministic template engine**. There is **no LLM, no external AI API, no Ollama, and no model downloads** — the backend produces structured exegesis locally with zero per-request cost and no network dependency at runtime.

---

## 1. Architecture overview

The `/ai` module does **not** call any language model. Instead, `explainVerses`:

1. **Fetches** the verse and rich study data from the database:
   - verse text (`searchIndex`)
   - book prologue (`bookPrologue`)
   - daily exegesis (`dailyExegesis`)
   - verse explanations (`verseExplanation`)
   - verse resources / commentaries / cross-references / word studies (`verseResource`)
   - surrounding context verses (`searchIndex.findMany`)
   - chapter study tools (`chapterStudyTool`) — only for `depth: "detailed"`
   - original-language word studies (`verseWord`) — only for `depth: "detailed"`
2. **Blends** those sources through pure template builders (`buildIntro`, `buildLesson`, `buildApplication`, `buildPrayer`, `buildWordStudy`, `buildCrossReferences`, `buildContextField`, `buildChapterInsights`).
3. **Returns** structured sections — `intro`, `explanation`, `application`, `prayer` — with extra deep-study fields (`wordStudy`, `crossReferences`, `context`, `chapterInsights`) when `depth: "detailed"` is requested.

The same blended data feeds the LookStage reflection prompts through `generatePromptAnswer` (prompt indices 0–5), so no separate AI service is involved there either.

---

## 2. Files

| Path | Purpose |
|------|---------|
| `backend/src/modules/ai/service.js` | Data fetching + source blending + template builders. Exports `explainVerses` and `generatePromptAnswer`. |
| `backend/src/modules/ai/controller.js` | Express handlers `explain` and `generatePrompt`; wraps results with `formatApiResponse`. |
| `backend/src/modules/ai/route.js` | Registers `POST /ai/explain` and `POST /ai/generate-prompt`. |
| `backend/src/modules/ai/validation.js` | Zod schemas `explainSchema` and `generatePromptSchema`. |
| `backend/src/server.js` | `app.use("/ai", aiRouter)` mounts the module. |
| `backend/Dockerfile` | Single-stage `node:20-alpine`; postinstall runs `prisma generate`; starts `node src/server.js`. |

---

## 3. Endpoints

### `POST /ai/explain`

Single verse:
```json
{
  "book": "John",
  "chapter": 3,
  "verse": 16,
  "depth": "standard"
}
```

Batch (all resolved in parallel):
```json
{
  "verses": [{ "book": "John", "chapter": 3, "verse": 16 }],
  "depth": "detailed"
}
```

`depth` is one of `brief | standard | detailed` (defaults to `standard`).

### `POST /ai/generate-prompt`

```json
{
  "book": "John",
  "chapter": 3,
  "verse": 16,
  "promptIdx": 0
}
```

`promptIdx` is an integer `0–5`, mapping to the six LookStage reflection prompts (standout words, speaker/audience, commands/promises/warnings, repetition, contrasts, questions raised).

Both endpoints return the standard `formatApiResponse` envelope: `{ returnCode, returnMessage, returnData }`.

---

## 4. `service.js` — key functions

### `explainVerses(book, chapter, verse, depth = "standard")`

1. Normalizes the book name (`BOOK_ALIASES`) and detects its genre (`BOOK_GENRES` → `law`, `history`, `poetry`, `prophecy`, `gospel`, `epistle`, `apocalyptic`).
2. Checks `memCache` then the shared cache service (12-hour TTL) before querying.
3. Runs the DB lookups listed above in a single `Promise.all`.
4. Detects dominant themes from the verse text via keyword regexes (`THEME_CHECKS`).
5. Calls `blendSources(...)` to assemble the response object.

### `generatePromptAnswer(book, chapter, verse, promptIdx)`

Validates `promptIdx` (0–5), reuses `explainVerses(..., "detailed")`, then answers the selected prompt with the blended data (prologue, chapter tools, word study, context, themes, etc.).

---

## 5. Template builders (deterministic)

All builders are pure functions that take the fetched data and return markdown-formatted text. They vary output by hashing the reference (`idx(ref)`) so different verses get varied phrasings while remaining fully deterministic per verse:

- `buildIntro` — 4 intro variants; uses prologue when available, plus surrounding context snippets.
- `buildLesson` — theme-specific lessons (love, grace, faith, life, hope, peace, judgment, fear, suffering, praise, power, wisdom, kingship, healing, death, obedience, warning, light) with genre tags and Christ-connection notes.
- `buildApplication` — practical, verse-anchored application prompts.
- `buildPrayer` — short prayers themed to the verse.
- `buildWordStudy` / `buildOriginalWordStudy` — dictionary-style word studies (original language + transliteration + short definition).
- `buildCrossReferences` — related passages from verse resources.
- `buildContextField` — surrounding verses (prefers BSB translation).
- `buildChapterInsights` — admin-curated chapter tools (Promise / Command / Warning / Repeated Word / Transition / Contrast).

---

## 6. Caching

- In-memory `memCache` (Map) plus the shared Redis-backed `cache` service.
- Cache key: `ai:{book}:{chapter}:{verse}:{depth}`.
- TTL: 12 hours (`CACHE_TTL`).

---

## 7. Deployment (Docker)

`backend/Dockerfile` (single stage):

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy Prisma schema + config BEFORE installing deps so the
# `postinstall` script (`prisma generate`) can find the schema.
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install production dependencies (postinstall runs `prisma generate`)
RUN npm ci --omit=dev

# Copy the rest of the application source
COPY . .

EXPOSE 5001
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
```

Notes:
- `prisma` lives in `dependencies` (not devDependencies) because the `start` script runs `npx prisma db push` at runtime.
- Seed is configured in `prisma.config.ts` (`migrations.seed`), not in `package.json`.
- No extra binaries, models, or external services are bundled into the image.

---

## 8. Quick dev workflow

```bash
# 1. Start the backend
npm run dev

# 2. Test the explain endpoint
curl -X POST http://localhost:5001/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"book":"John","chapter":3,"verse":16,"depth":"standard"}'

# 3. Test a LookStage prompt
curl -X POST http://localhost:5001/ai/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{"book":"John","chapter":3,"verse":16,"promptIdx":0}'
```

---

## 9. Summary checklist

- No LLM / Ollama / external AI dependency — deterministic template engine.
- Endpoints: `POST /ai/explain` (single or batch, `depth` brief/standard/detailed) and `POST /ai/generate-prompt` (`promptIdx` 0–5).
- Response envelope: `{ returnCode, returnMessage, returnData }`.
- Results cached for 12 hours (mem + shared cache).
- Deployment: single-stage `node:20-alpine` Docker image; Prisma schema copied before `npm ci` so `postinstall` → `prisma generate` succeeds.
