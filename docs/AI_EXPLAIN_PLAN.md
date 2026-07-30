# Local AI Explain‑Verse – Zero‑Cost, Fully Self‑Hosted

**Goal** – Generate an *Intro, Lesson, Application, Prayer* for any selected verse(s) using a locally‑run LLM. No external API, no extra cost after the one‑time model download.

---

## 1. Files you will add / modify
| Path | Purpose |
|------|---------|
| `backend/scripts/start-llm.sh` | Bash script that pulls the model (if missing) and starts Ollama. |
| `backend/Dockerfile` | Builds the container, copies the Ollama binary, and runs `start-llm.sh` alongside the Node server. |
| `backend/src/modules/ai/service.js` | Builds the prompt, calls `http://localhost:11434/api/generate`, parses JSON, caches result. |
| `backend/src/modules/ai/controller.js` | Validates input, invokes the service, returns `formatApiResponse`. |
| `backend/src/modules/ai/route.js` | Registers `POST /api/ai/explain`. |
| `backend/src/modules/ai/validation.js` | Simple schema (`verses` array with `ref` & `text`). |
| `backend/src/server.js` (or wherever you build the Express app) | `app.use('/api/ai', aiRouter);` to mount the new route. |
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
# This pulls the 8 B parameter model (~4 GB). You can swap for a quantised version later.
ollama pull llama3:8b
```
**Tip:** to keep the image small, use a quantised model:
```bash
ollama pull llama3:8b-q4   # ~1.5 GB, still very capable
```
The script below will automatically pull the model if it is not already present on the persistent disk.

---

## 4. `scripts/start-llm.sh`
```bash
#!/usr/bin/env bash
set -e

# Which model to use – can be overridden with env var LLM_MODEL
MODEL="${LLM_MODEL:-llama3:8b}"

# Pull the model only when it does not exist on the mounted volume
if ! ollama list | grep -q "$MODEL"; then
  echo "🧠 Pulling $MODEL (first run)…"
  ollama pull "$MODEL"
fi

# Start Ollama in the background (listens on localhost:11434)
echo "🚀 Starting Ollama server for $MODEL …"
ollama serve &

# Keep the script alive while the Node process runs
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
During local development you run `npm run llm:start & npm run dev`.

---

## 5. Dockerfile (minimal changes)
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
    mv Ollama /usr/local/bin/ollama && \
    chmod +x /usr/local/bin/ollama

# ---------- Runtime ----------
EXPOSE 3000
ENV NODE_ENV=production
# Copy built app (if you have a build step, adjust accordingly)
COPY --from=builder /app .

# Ensure the start‑script is present and executable
COPY scripts/start-llm.sh /usr/local/bin/start-llm.sh
RUN chmod +x /usr/local/bin/start-llm.sh

# Run both Ollama and the Node server
CMD ["/bin/sh", "-c", "start-llm.sh & npm start"]
```
**Important:** Do **not** copy the model files into the image. They will be stored on a Render **persistent disk** (see next section).

---

## 6. Persistent disk on Render (keeps the model off the image)
1. In the Render dashboard → **New → Disk** → give it a name (e.g., `ollama-models`) and allocate **2 GB** (enough for the quantised model).  
2. Attach the disk to your backend service (Settings → Disks → Attach).  
3. The disk mounts at `/var/lib/render`.  
4. Tell Ollama to use that location (optional, but recommended): add an env var
```env
OLLAMA_HOME=/var/lib/render/.ollama
```
When the container starts, `start-llm.sh` will pull the model onto that disk if it isn’t there yet. The disk persists across redeploys, so the download happens only once.

---

## 7. Backend AI module (skeletons – copy into the indicated paths)
```js
// backend/src/modules/ai/service.js
import fetch from "node-fetch"; // or built‑in fetch in newer Node
import crypto from "crypto";
import cache from "../../services/cacheService.js"; // existing helper or simple Map

const PROMPT = `You are a biblical teacher. For each verse below produce a JSON object with four keys:
  "intro": brief historical/literary context (1‑2 sentences),
  "lesson": core doctrinal teaching (1‑2 sentences),
  "application": practical life‑application (1‑2 sentences),
  "prayer": a short prayer reflecting the lesson.
Return ONLY valid JSON.

Verses:
{{VERSes}}
`;

export async function explainVerses(verses) {
  const hash = crypto.createHash("sha256").update(JSON.stringify(verses)).digest("hex");
  const cached = await cache.get(`explain:${hash}`);
  if (cached) return JSON.parse(cached);

  const versesText = verses.map(v => `${v.ref}: ${v.text}`).join("\n");
  const prompt = PROMPT.replace("{{VERSes}}", versesText);

  const resp = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.LLM_MODEL || "llama3:8b", prompt, stream: false })
  });
  const data = await resp.json();
  // Ollama returns {response: "...raw text..."}
  const raw = data.response.trim();
  let result;
  try { result = JSON.parse(raw); }
  catch {
    // deterministic fallback
    result = { intro: "", lesson: "", application: "", prayer: "" };
  }
  await cache.set(`explain:${hash}`, JSON.stringify(result), 12 * 60 * 60);
  return result;
}
```
```js
// backend/src/modules/ai/controller.js
import { explainVerses } from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";
import { asyncHandler } from "../../middlewares/validate.middleware.js";
import { ValidationError } from "../../utils/AppError.js";

export const explain = asyncHandler(async (req, res) => {
  const { verses } = req.body;
  if (!Array.isArray(verses) || verses.length === 0) {
    throw new ValidationError("'verses' array is required");
  }
  const result = await explainVerses(verses);
  res.json(formatApiResponse(result));
});
```
```js
// backend/src/modules/ai/route.js
import { Router } from "express";
import { explain } from "./controller.js";

const router = Router();
router.post("/explain", explain);
export default router;
```
```js
// backend/src/modules/ai/validation.js
// (optional – you can also validate inline in the controller)
import { z } from "zod";
export const explainSchema = z.object({
  verses: z.array(z.object({ ref: z.string(), text: z.string() })).min(1)
});
```
Add to server:
```js
import aiRouter from "./modules/ai/route.js";
app.use("/api/ai", aiRouter);
```

---

## 8. Quick dev workflow
```bash
# 1️⃣ Start Ollama (model will be pulled on first run)
npm run llm:start &
# 2️⃣ Start backend API
npm run dev   # your existing dev script (e.g., nodemon src/server.js)
# 3️⃣ Test endpoint
curl -X POST http://localhost:3000/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"verses":[{"ref":"John 3:16","text":"For God so loved the world…"}]}'
```
When you push to the repo, Render will rebuild the Docker image, attach the persistent disk, run `start-llm.sh`, and the LLM will be ready **as soon as the backend is listening**.

---

## 9. Summary checklist
- **No repo bloat** – only script + Dockerfile changes.
- **Model lives on a Render persistent disk**, not in Git or a database.
- **Zero per‑request cost** after the one‑time model download.
- **Endpoint** remains `POST /api/ai/explain`; front‑end code unchanged.
- **Startup order**: `start-llm.sh` pulls (if needed) → `ollama serve` → Node server → ready.

---

*All steps above are self‑contained; after pushing the changes the backend on Render will automatically have a local LLM ready to answer verse‑explain requests without any external dependency.*
