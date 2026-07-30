# Local AI Explain‑Verse – Zero‑Cost, Fully Self‑Hosted

**Goal** – Generate an *Intro, Lesson, Application, Prayer* for any selected verse(s) using a locally‑run LLM. No external API, no extra cost after the one‑time model download.

---

## 1. Files you will add / modify
| Path | Purpose |
|------|---------|
| `backend/.dockerignore` | Excludes unnecessary files from Docker build context (node_modules, .git, docs, etc.). |
| `backend/Dockerfile` | Builds the container, copies the Ollama binary, waits for Ollama readiness, then starts the Node server. |
| `backend/scripts/start-llm.sh` | Bash script that pulls the model (if missing) and starts Ollama. |
| `backend/src/modules/ai/service.js` | Builds the prompt, calls `http://localhost:11434/api/generate`, parses JSON, caches result. |
| `backend/src/modules/ai/controller.js` | Validates input, invokes the service, returns `formatApiResponse`. |
| `backend/src/modules/ai/route.js` | Registers `POST /ai/explain`. |
| `backend/src/modules/ai/validation.js` | Zod schema (`verses` array with `ref` & `text`). |
| `backend/src/server.js` | `app.use('/ai', aiRouter);` to mount the new route. |
| `backend/.env.example` | Adds `OLLAMA_HOME` variable for Render persistent disk. |
| `backend/package.json` (scripts section) | Adds `"llm:start": "bash scripts/start-llm.sh"` for local dev. |

---

## 2. Install Ollama (once, on any machine that builds the image)
```bash
# macOS – Homebrew
brew install ollama
# Verify installation
ollama --version
```
*Ollama works on Linux too; the binary is copied into the Docker image (see Dockerfile).*

---

## 3. Pull the model (only the first time)
```bash
# This pulls the 8 B parameter model (~4 GB). You can swap for a quantised version later.
ollama pull llama3:8b
```
**Tip:** to keep the image small, use a quantised model:
```bash
ollama pull llama3:8b-q4   # ~1.5 GB, still very capable
```
The script below will automatically pull the model if it is not already present on the persistent disk.

---

## 4. `scripts/start-llm.sh`
```bash
#!/usr/bin/env bash
set -e

MODEL="${LLM_MODEL:-llama3.2:3b}"

if ! ollama list 2>/dev/null | grep -q "$MODEL"; then
  echo "Pulling $MODEL (first run)…"
  ollama pull "$MODEL"
fi

echo "Starting Ollama server for $MODEL …"
ollama serve &

# Wait for Ollama to be ready
for i in $(seq 1 30); do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama ready"
    break
  fi
  sleep 1
done

wait
```
Make it executable:
```bash
chmod +x backend/scripts/start-llm.sh
```
Add to `package.json`:
```json
"scripts": { "llm:start": "bash scripts/start-llm.sh" }
```

---

## 5. `.dockerignore`
```
node_modules
.git
.gitignore
docs
.env
.env.example
*.md
node_modules/
.git/
```

---

## 6. Dockerfile
```Dockerfile
# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# ---------- Add Ollama binary ----------
RUN apk add --no-cache curl && \
    curl -L https://ollama.com/download/Ollama-linux-amd64.tar.gz | tar xz && \
    mv ollama /usr/local/bin/ollama && \
    chmod +x /usr/local/bin/ollama

# ---------- Runtime ----------
FROM alpine:3.20
RUN apk add --no-cache curl ca-certificates
COPY --from=builder /usr/local/bin/ollama /usr/local/bin/ollama
COPY --from=builder /app /app
COPY scripts/start-llm.sh /usr/local/bin/start-llm.sh
RUN chmod +x /usr/local/bin/start-llm.sh

WORKDIR /app
EXPOSE 5001
ENV NODE_ENV=production

CMD ["/bin/sh", "-c", "start-llm.sh & node src/server.js"]
```
**Important:** Do **not** copy the model files into the image. They will be stored on a Render **persistent disk** (see next section).

---

## 7. Persistent disk on Render (keeps the model off the image)
1. In the Render dashboard → **New → Disk** → give it a name (e.g., `ollama-models`) and allocate **2 GB** (enough for the quantised model).
2. Attach the disk to your backend service (Settings → Disks → Attach).
3. The disk mounts at `/var/lib/render`.
4. Tell Ollama to use that location: add an env var
```env
OLLAMA_HOME=/var/lib/render/.ollama
```
When the container starts, `start-llm.sh` will pull the model onto that disk if it isn't there yet. The disk persists across redeploys, so the download happens only once.

---

## 8. Backend AI module

```js
// backend/src/modules/ai/service.js
import crypto from "crypto";
import { cache } from "../../services/cacheService.js";

const PROMPT = `You are a biblical teacher. For each verse below produce a JSON object with four keys:
  "intro": brief historical/literary context (1-2 sentences),
  "lesson": core doctrinal teaching (1-2 sentences),
  "application": practical life-application (1-2 sentences),
  "prayer": a short prayer reflecting the lesson.
Return ONLY valid JSON.

Verses:
{{VERSES}}
`;

const OLLAMA_URL = "http://localhost:11434/api/generate";
const TIMEOUT_MS = 60_000;
const CACHE_TTL = 12 * 60 * 60; // 12 hours

export async function explainVerses(verses) {
  const model = process.env.LLM_MODEL || "llama3.2:3b";
  const cacheKey = `${model}:${crypto.createHash("sha256").update(JSON.stringify(verses)).digest("hex")}`;

  const cached = await cache.get("ai", cacheKey);
  if (cached) return cached;

  const versesText = verses.map(v => `${v.ref}: ${v.text}`).join("\n");
  const prompt = PROMPT.replace("{{VERSES}}", versesText);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let result;
  try {
    const resp = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!resp.ok) {
      throw new Error(`Ollama returned ${resp.status}`);
    }
    const data = await resp.json();
    const raw = data?.response?.trim();
    if (!raw) throw new Error("Empty response from Ollama");

    result = JSON.parse(raw);
  } catch (err) {
    console.error("AI explain error:", err.message);
    result = { intro: "", lesson: "", application: "", prayer: "" };
  } finally {
    clearTimeout(timer);
  }

  await cache.set("ai", cacheKey, result, CACHE_TTL);
  return result;
}
```

```js
// backend/src/modules/ai/controller.js
import { explainVerses } from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";
import { asyncHandler } from "../../middlewares/validate.middleware.js";

export const explain = asyncHandler(async (req, res) => {
  const { verses } = req.body;
  const result = await explainVerses(verses);
  res.json(formatApiResponse({ status: 200, message: "Explanation generated", data: result }));
});
```

```js
// backend/src/modules/ai/route.js
import { Router } from "express";
import { explain } from "./controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { explainSchema } from "./validation.js";

const router = Router();
router.post("/explain", validate(explainSchema), explain);
export default router;
```

```js
// backend/src/modules/ai/validation.js
import { z } from "zod";
export const explainSchema = z.object({
  verses: z.array(z.object({ ref: z.string(), text: z.string() })).min(1),
});
```

---

## 9. Mount route in server.js

```js
import aiRouter from "./modules/ai/route.js";
// add alongside other routers:
app.use("/ai", aiRouter);
```

---

## 10. `package.json` scripts addition

```json
"scripts": {
  // ... existing scripts ...
  "llm:start": "bash scripts/start-llm.sh"
}
```

---

## 11. Quick dev workflow
```bash
# 1. Start Ollama (model will be pulled on first run)
npm run llm:start &
# 2. Start backend API
npm run dev
# 3. Test endpoint
curl -X POST http://localhost:5001/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"verses":[{"ref":"John 3:16","text":"For God so loved the world…"}]}'
```
When you push to the repo, Render will rebuild the Docker image, attach the persistent disk, run `start-llm.sh`, and the LLM will be ready shortly after the backend starts listening.

---

## 12. Summary checklist
- Model lives on a **Render persistent disk**, not in Git or the Docker image.
- **Zero per-request cost** after the one-time model download.
- **Endpoint** `POST /ai/explain`.
- **Startup order**: `start-llm.sh` pulls (if needed) → waits for Ollama readiness → Node server starts.
