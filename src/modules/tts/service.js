import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import crypto from "node:crypto";
import { cache as redisCache } from "../../services/cacheService.js";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_ENABLED = process.env.ELEVENLABS_ENABLED === "true";
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

const REDIS_CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL, 10) || 86400; // 24h
const REDIS_NAMESPACE = "tts";

// ── In-memory TTS cache ────────────────────────────────────────────────────
const TTS_CACHE = new Map();
const CACHE_MAX = 50;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getCacheKey = (text, voiceId, speed) => {
  const hash = crypto.createHash("md5").update(text).digest("hex");
  return `${hash}:${voiceId || "default"}:${speed || 1.0}`;
};

const getFromCache = (key) => {
  const entry = TTS_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL_MS) {
    TTS_CACHE.delete(key);
    return null;
  }
  entry.time = Date.now(); // refresh on access
  return entry.buffer;
};

const setInCache = (key, buffer) => {
  if (TTS_CACHE.size >= CACHE_MAX) {
    const oldest = TTS_CACHE.keys().next().value;
    if (oldest) TTS_CACHE.delete(oldest);
  }
  TTS_CACHE.set(key, { buffer, time: Date.now() });
};

// ── In-memory timings cache (audio + word offsets) ─────────────────────────
const TTS_TIMINGS_CACHE = new Map();

const getTimingsFromCache = (key) => {
  const entry = TTS_TIMINGS_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL_MS) {
    TTS_TIMINGS_CACHE.delete(key);
    return null;
  }
  entry.time = Date.now(); // refresh on access
  return entry;
};

const setTimingsInCache = (key, audioBuffer, wordOffsetsMs) => {
  if (TTS_TIMINGS_CACHE.size >= CACHE_MAX) {
    const oldest = TTS_TIMINGS_CACHE.keys().next().value;
    if (oldest) TTS_TIMINGS_CACHE.delete(oldest);
  }
  TTS_TIMINGS_CACHE.set(key, { audioBuffer, wordOffsetsMs, time: Date.now() });
};

// ── Redis-backed cache (survives restarts, shared across instances) ────────
const getRedisAudio = async (key) => {
  try {
    const data = await redisCache.get(REDIS_NAMESPACE, `${key}:audio`);
    if (data && typeof data.audioBase64 === "string" && data.audioBase64.length > 0) {
      return Buffer.from(data.audioBase64, "base64");
    }
  } catch {}
  return null;
};

const setRedisAudio = async (key, audioBuffer) => {
  try {
    await redisCache.set(
      REDIS_NAMESPACE,
      `${key}:audio`,
      { audioBase64: audioBuffer.toString("base64") },
      REDIS_CACHE_TTL,
    );
  } catch {}
};

const getRedisTimings = async (key) => {
  try {
    const data = await redisCache.get(REDIS_NAMESPACE, `${key}:timings`);
    if (data && typeof data.audioBase64 === "string" && data.audioBase64.length > 0) {
      return {
        audioBuffer: Buffer.from(data.audioBase64, "base64"),
        wordOffsetsMs: Array.isArray(data.wordOffsetsMs) ? data.wordOffsetsMs : [],
      };
    }
  } catch {}
  return null;
};

const setRedisTimings = async (key, audioBuffer, wordOffsetsMs) => {
  try {
    await redisCache.set(
      REDIS_NAMESPACE,
      `${key}:timings`,
      { audioBase64: audioBuffer.toString("base64"), wordOffsetsMs },
      REDIS_CACHE_TTL,
    );
  } catch {}
};

// ── Edge TTS voices (free, Microsoft Neural) ──────────────────────────────
// Ryan is deliberately FIRST: it is the app's default reading voice, and any
// client-side "pick the first voice" fallback must land on it.
const EDGE_VOICES = [
  { name: "Ryan (Male)",     voiceId: "en-GB-RyanNeural",    source: "edge", category: "Neural" },
  { name: "Jenny (Female)",  voiceId: "en-US-JennyNeural",   source: "edge", category: "Neural" },
  { name: "Aria (Female)",   voiceId: "en-US-AriaNeural",    source: "edge", category: "Neural" },
  { name: "Guy (Male)",      voiceId: "en-US-GuyNeural",     source: "edge", category: "Neural" },
  { name: "Christopher (Male)", voiceId: "en-US-ChristopherNeural", source: "edge", category: "Neural" },
  { name: "Emma (Female)",   voiceId: "en-US-EmmaNeural",    source: "edge", category: "Neural" },
  { name: "Brian (Male)",    voiceId: "en-US-BrianNeural",   source: "edge", category: "Neural" },
  { name: "Sonia (Female)",  voiceId: "en-GB-SoniaNeural",   source: "edge", category: "Neural" },
];

// ── ElevenLabs voices (paid) ───────────────────────────────────────────────
const ELEVENLABS_VOICE_IDS = {
  "Rachel": "21m00Tcm4TlvDq8ikWAM",
  "Adam":   "pNInz6obpgDQGcFmaJgB",
  "Antoni": "ErXwobaYiN019PkySvjV",
  "Bella":  "EXAVITQu4vr2J3Ql38jY",
  "Josh":   "TxGEqnHWrfWFTfGW9XjX",
  "Nicole": "piTKgcLEGmPE4e6mEKli",
  "Serena": "pMsXgVXv3BLzN3jMGXJd",
};

export const DEFAULT_EDGE_VOICE = "en-GB-RyanNeural";
const DEFAULT_ELEVENLABS_VOICE = "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

// ── Serialized Edge TTS client pool ────────────────────────────────────────
// The msedge-tts library multiplexes concurrent stream requests over one
// WebSocket by requestId, but it DELETES a stream's entry from its map as soon
// as that stream closes. If any late metadata/audio frame arrives afterwards,
// its socket handler throws an uncaught TypeError ("Cannot read properties of
// undefined (reading 'metadata'/'audio')") that crashes the whole process.
//
// We therefore never run two streams on the same socket: every client below is
// held by exactly one synthesis at a time. A dedicated "express" client serves
// high-priority (currently-playing) tracks so the reader never waits for
// background prefetch windows to finish first.
const TIMED_FORMAT = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
const WORK_POOL_SIZE = 2;

let _express = null; // { client, busy, voice } — high-priority only
let _workPool = [];  // up to WORK_POOL_SIZE background clients
let _queue = [];     // { voice, high, job, resolve, reject }
let _dispatching = false;
let _expressConnecting = null; // in-flight connection promise (dedupes races)
let _workConnecting = null;

const setupClient = (client, voice) =>
  client.setMetadata(voice, TIMED_FORMAT, { wordBoundaryEnabled: true });

const closeClient = (entry) => {
  try { entry.client.close(); } catch {}
};

const ensureExpress = async () => {
  if (_express) return;
  if (!_expressConnecting) {
    _expressConnecting = (async () => {
      const client = new MsEdgeTTS();
      await setupClient(client, DEFAULT_EDGE_VOICE);
      if (!_express) {
        _express = { client, busy: false, voice: DEFAULT_EDGE_VOICE };
      } else {
        try { client.close(); } catch {}
      }
    })().finally(() => { _expressConnecting = null; });
  }
  return _expressConnecting;
};

const ensureWorkPool = async () => {
  while (_workPool.length < WORK_POOL_SIZE) {
    if (!_workConnecting) {
      _workConnecting = (async () => {
        const client = new MsEdgeTTS();
        await setupClient(client, DEFAULT_EDGE_VOICE);
        if (_workPool.length < WORK_POOL_SIZE) {
          _workPool.push({ client, busy: false, voice: DEFAULT_EDGE_VOICE });
        } else {
          try { client.close(); } catch {}
        }
      })().finally(() => { _workConnecting = null; });
    }
    await _workConnecting;
  }
};

// Point a client at `voice`, closing the old socket first so the library's
// setMetadata reconnect path doesn't leak the previous WebSocket.
const prepEntry = async (entry, voice) => {
  if (entry.voice === voice) return;
  closeClient(entry);
  entry.client = new MsEdgeTTS();
  await setupClient(entry.client, voice);
  entry.voice = voice;
};

const dropEntry = (entry) => {
  if (entry === _express) {
    _express = null;
  } else {
    const idx = _workPool.indexOf(entry);
    if (idx >= 0) _workPool.splice(idx, 1);
  }
  closeClient(entry);
  // Refill asynchronously so surviving clients keep working while the
  // replacement socket connects in the background.
  void recreateEntry(entry === _express);
};

const recreateEntry = async (isExpress) => {
  try {
    if (isExpress) {
      await ensureExpress();
    } else {
      await ensureWorkPool();
    }
    dispatchTimed();
  } catch {
    // Connection refused (or similar) — leave the pool short; the next
    // acquire attempt will retry.
  }
};

const dispatchTimed = () => {
  if (_dispatching) return;
  _dispatching = true;
  void (async () => {
    try {
      while (_queue.length > 0) {
        const highIdx = _queue.findIndex((q) => q.high);
        const lowIdx = _queue.findIndex((q) => !q.high);
        let item = null;
        let entry = null;

        if (highIdx !== -1 && _express && !_express.busy) {
          item = _queue.splice(highIdx, 1)[0];
          entry = _express;
        } else if (lowIdx !== -1) {
          const freeWork = _workPool.find((c) => !c.busy);
          if (freeWork) {
            item = _queue.splice(lowIdx, 1)[0];
            entry = freeWork;
          }
        }

        if (!item || !entry) break;

        entry.busy = true;
        void (async () => {
          try {
            await prepEntry(entry, item.voice);
            item.resolve(await item.job(entry.client));
          } catch (err) {
            // A dead socket must not poison the pool — drop and recreate it.
            dropEntry(entry);
            item.reject(err);
          } finally {
            entry.busy = false;
            dispatchTimed();
          }
        })();
      }
    } finally {
      _dispatching = false;
    }
  })();
};

// Runs `job` on a client configured for `voice`. High-priority jobs go to the
// dedicated express client (never blocked behind prefetch windows).
const acquireTimedClient = async (voice, high, job) => {
  try {
    if (high) {
      await ensureExpress();
    } else {
      await ensureWorkPool();
    }
  } catch {
    // fall through — dispatch below will surface connection failures
  }

  if (high && !_express) {
    throw new Error("No Edge TTS express client available");
  }
  if (!high && _workPool.length === 0) {
    throw new Error("No Edge TTS client available");
  }

  return new Promise((resolve, reject) => {
    const item = { voice, high, job, resolve, reject };
    if (high) {
      const idx = _queue.findIndex((q) => !q.high);
      _queue.splice(idx === -1 ? _queue.length : idx, 0, item);
    } else {
      _queue.push(item);
    }
    dispatchTimed();
  });
};

/** Warms up the pool so the first request after boot doesn't pay the socket
 *  connection+handshake cost (~2s). Call once at server startup. */
export const warmUpTTS = async () => {
  try {
    await ensureExpress();
    await ensureWorkPool();
  } catch {
    // best-effort; the pool reconnects lazily on first real request
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────

const isEdgeVoice = (voiceId) => EDGE_VOICES.some((v) => v.voiceId === voiceId);

const isElevenLabsVoice = (voiceId) => {
  const knownIds = Object.values(ELEVENLABS_VOICE_IDS);
  const isUuid = /^[0-9a-f]{20,}$/i.test(voiceId);
  return knownIds.includes(voiceId) || isUuid;
};

// ── Public API ─────────────────────────────────────────────────────────────

export const getStatus = () => ({
  enabled: true,
  hasApiKey: !!ELEVENLABS_API_KEY,
  elevenLabsEnabled: ELEVENLABS_ENABLED && !!ELEVENLABS_API_KEY,
});

export const getVoices = async () => {
  const edgeVoices = EDGE_VOICES;

  if (!ELEVENLABS_ENABLED || !ELEVENLABS_API_KEY) {
    return edgeVoices;
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE}/voices`, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    });
    if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);
    const data = await response.json();
    const elVoices = data.voices.map((v) => ({
      name: v.name,
      voiceId: v.voice_id,
      category: v.category,
      source: "elevenlabs",
    }));
    return [...edgeVoices, ...elVoices];
  } catch {
    return edgeVoices;
  }
};

// ── Edge TTS synthesis (serialized client pool) ───────────────────────────

const synthesizeEdge = async (text, voiceId = DEFAULT_EDGE_VOICE, speed = 1.0) => {
  const cacheKey = getCacheKey(text, voiceId, speed);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const redisAudio = await getRedisAudio(cacheKey);
  if (redisAudio) {
    setInCache(cacheKey, redisAudio);
    return redisAudio;
  }

  // Edge TTS rate: "+0%" = normal, "+20%" = 1.2x, "-20%" = 0.8x
  const ratePercent = Math.round((speed - 1) * 100);
  const rate = ratePercent === 0 ? "+0%" : `${ratePercent > 0 ? "+" : ""}${ratePercent}%`;

  try {
    const buffer = await acquireTimedClient(voiceId, false, async (tts) => {
      const { audioStream, metadataStream } = tts.toStream(text, { rate });
      // Pool sockets have word-boundary metadata enabled; consume the metadata
      // stream so it doesn't buffer data nobody reads.
      metadataStream?.on("data", () => {});

      const chunks = [];
      await new Promise((resolve, reject) => {
        audioStream.on("data", (d) => chunks.push(d));
        audioStream.on("end", resolve);
        audioStream.on("error", reject);
      });

      const buf = Buffer.concat(chunks);
      if (buf.length === 0) {
        throw new Error("Empty audio received from Edge TTS");
      }
      // An MP3 stream that finishes with almost no data is a silent/failed synth
      if (buf.length < 1_000) {
        throw new Error("Silent audio received from Edge TTS");
      }
      return buf;
    });

    setInCache(cacheKey, buffer);
    setRedisAudio(cacheKey, buffer);
    return buffer;
  } catch (err) {
    // The pool drops any broken socket; retry once with the default voice.
    console.warn(`[TTS] Edge TTS failed for voice "${voiceId}":`, err.message);

    if (voiceId !== DEFAULT_EDGE_VOICE) {
      console.warn(`[TTS] Retrying with default voice "${DEFAULT_EDGE_VOICE}"`);
      return synthesizeEdge(text, DEFAULT_EDGE_VOICE, speed);
    }
    throw err;
  }
};

export const synthesizeWithTimings = async (
  text,
  voiceId = DEFAULT_EDGE_VOICE,
  speed = 1.0,
  priority = "low",
) => {
  const candidates = [voiceId, DEFAULT_EDGE_VOICE];
  for (const candidate of candidates) {
    const edgeVoice =
      candidate && isEdgeVoice(candidate) ? candidate : DEFAULT_EDGE_VOICE;
    try {
      return await synthesizeWithTimingsOnce(text, edgeVoice, speed, priority);
    } catch (err) {
      if (edgeVoice === DEFAULT_EDGE_VOICE) throw err;
      console.warn(
        `[TTS] Timed Edge TTS failed for voice "${edgeVoice}":`,
        err.message,
      );
      console.warn(`[TTS] Retrying with default voice "${DEFAULT_EDGE_VOICE}"`);
    }
  }
  throw new Error("Timed Edge TTS synthesis failed");
};

const synthesizeWithTimingsOnce = async (
  text,
  edgeVoice,
  speed,
  priority = "low",
) => {
  const cacheKey = getCacheKey(text, edgeVoice, speed);

  const mem = getTimingsFromCache(cacheKey);
  if (mem) return { audioBuffer: mem.audioBuffer, wordOffsetsMs: mem.wordOffsetsMs };

  const redis = await getRedisTimings(cacheKey);
  if (redis) {
    setTimingsInCache(cacheKey, redis.audioBuffer, redis.wordOffsetsMs);
    return redis;
  }

  const ratePercent = Math.round((speed - 1) * 100);
  const rate = ratePercent === 0 ? "+0%" : `${ratePercent > 0 ? "+" : ""}${ratePercent}%`;

  const result = await acquireTimedClient(edgeVoice, priority === "high", async (tts) => {
    const { audioStream, metadataStream } = tts.toStream(text, { rate });
    const audioChunks = [];
    const wordOffsetsMs = [];
    let audioEnded = false;
    let resolveMeta;
    const metadataDone = new Promise((resolve) => { resolveMeta = resolve; });

    const audioComplete = new Promise((resolve, reject) => {
      audioStream.on("data", (chunk) => audioChunks.push(chunk));
      audioStream.on("end", () => {
        audioEnded = true;
        resolveMeta(); // metadata stream never emits "end"; stop waiting once audio is done
        resolve();
      });
      audioStream.on("error", reject);
    });

    metadataStream?.on("data", (chunk) => {
      if (audioEnded) return;
      try {
        const payload = JSON.parse(chunk.toString());
        for (const item of payload.Metadata || []) {
          if (item.Type === "WordBoundary") {
            wordOffsetsMs.push(item.Data.Offset / 10_000);
          }
        }
      } catch {}
    });
    metadataStream?.on("error", () => resolveMeta());

    await audioComplete;
    await metadataDone;

    const audioBuffer = Buffer.concat(audioChunks);
    if (audioBuffer.length === 0) throw new Error("Empty audio received from Edge TTS");
    return { audioBuffer, wordOffsetsMs };
  });

  setTimingsInCache(cacheKey, result.audioBuffer, result.wordOffsetsMs);
  setRedisTimings(cacheKey, result.audioBuffer, result.wordOffsetsMs);
  return result;
};

// ── ElevenLabs synthesis ───────────────────────────────────────────────────

const synthesizeElevenLabs = async (text, voiceId, speed = 1.0) => {
  const cacheKey = getCacheKey(text, voiceId, speed);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const redisAudio = await getRedisAudio(cacheKey);
  if (redisAudio) {
    setInCache(cacheKey, redisAudio);
    return redisAudio;
  }

  const body = {
    text,
    model_id: ELEVENLABS_MODEL,
    voice_settings: {
      stability: 0.60,
      similarity_boost: 0.85,
      style: 0.40,
      use_speaker_boost: true,
    },
  };
  if (speed !== 1.0) body.voice_settings.speed = speed;

  const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${err}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  setInCache(cacheKey, buffer);
  setRedisAudio(cacheKey, buffer);
  return buffer;
};

// ── Main synthesize ────────────────────────────────────────────────────────

export const synthesize = async (text, voiceId, speed = 1.0) => {
  if (ELEVENLABS_ENABLED && ELEVENLABS_API_KEY && voiceId && isElevenLabsVoice(voiceId)) {
    return synthesizeElevenLabs(text, voiceId, speed);
  }

  const edgeVoice = (voiceId && isEdgeVoice(voiceId)) ? voiceId : DEFAULT_EDGE_VOICE;
  return synthesizeEdge(text, edgeVoice, speed);
};
