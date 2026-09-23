import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { cache as redisCache } from "../../services/cacheService.js";
import {
  getLordsbookVoices,
  synthesizeLordsbookSpeech,
} from "../../services/lordsbookGateway.js";

const ELEVENLABS_API_KEY = "";
const ELEVENLABS_ENABLED = false;
const ELEVENLABS_BASE = "";

const REDIS_CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL, 10) || 86400; // 24h
const REDIS_NAMESPACE = "tts";
const LORDSBOOK_VOICE_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LORDSBOOK_VOICE = "bm_george";

const getTtsProvider = () => {
  const lordsbookEnabled =
    (process.env.LORDSBOOK_TTS_ENABLE ?? "false").trim().toLowerCase() ===
    "true";
  return lordsbookEnabled ? "lordsbook" : "edge";
};

const getDefaultLordsbookVoice = () =>
  process.env.LORDSBOOK_DEFAULT_VOICE || DEFAULT_LORDSBOOK_VOICE;

// ── In-memory TTS cache ────────────────────────────────────────────────────
const TTS_CACHE = new Map();
const CACHE_MAX = 50;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getCacheKey = (text, voiceId, speed, provider = "edge") => {
  const hash = crypto.createHash("md5").update(text).digest("hex");
  return `v2:${provider}:${hash}:${voiceId || "default"}:${speed || 1.0}`;
};

// ── Sentence-pause compression (Edge TTS) ─────────────────────────────────
// Edge TTS inserts ~1.2s of silence at every sentence boundary ("full stop
// pause"), which makes verse playback drag. The free endpoint rejects
// <break> and mstts:silence (silently returns empty audio), so the only
// reliable lever is text-level: converting sentence-ending periods into
// commas cuts the pause to ~250ms while ? and ! keep their natural
// question/exclamation intonation. Applied ONLY to Edge synthesis
// (SSML-based); ElevenLabs handles pacing on its own.
const ABBREVIATIONS =
  /\b(mr|mrs|ms|dr|prof|sr|jr|st|mt|cf|vs|vol|ch|pp|no|approx|etc|e\.g|i\.e)\./gi;
const DOT_PLACEHOLDER = "\u0001";

const transformTextForEdge = (text) => {
  // Protect known abbreviations so their periods are never mistaken for
  // sentence boundaries ("Mr. Smith", "cf. John 3:16")
  const masked = text.replace(ABBREVIATIONS, (m) =>
    m.replace(/\./g, DOT_PLACEHOLDER),
  );
  return (
    masked
      // 1) Periods ending a sentence — or sitting before a closing
      //    quote/paren ("...light." / "...so.)") — become commas
      //    (~1.2s pause -> ~250ms). Requires 2+ preceding letters so single
      //    initials ("v. 2", "U.S.") survive. ? and ! keep their natural
      //    question/exclamation intonation.
      .replace(/([a-z\u00C0-\u024F]{2,}|["”')\]])\.(?=[\s"”')\]])/gi, "$1,")
      // 2) Prefer the comma after a closing quote/paren for cleaner phrasing:
      //    'light," next' -> 'light", next'
      .replace(/,(["”')\]])/g, "$1,")
      // 3) Collapse any doubled spaces left behind
      .replace(/\s{2,}/g, " ")
      .trim()
      // Restore abbreviation periods
      .replace(/\u0001/g, ".")
  );
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
    if (
      data &&
      typeof data.audioBase64 === "string" &&
      data.audioBase64.length > 0
    ) {
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
    if (
      data &&
      typeof data.audioBase64 === "string" &&
      data.audioBase64.length > 0
    ) {
      return {
        audioBuffer: Buffer.from(data.audioBase64, "base64"),
        wordOffsetsMs: Array.isArray(data.wordOffsetsMs)
          ? data.wordOffsetsMs
          : [],
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
  {
    name: "Ryan (Male)",
    voiceId: "en-GB-RyanNeural",
    source: "edge",
    category: "Neural",
  },
  {
    name: "Jenny (Female)",
    voiceId: "en-US-JennyNeural",
    source: "edge",
    category: "Neural",
  },
  {
    name: "Aria (Female)",
    voiceId: "en-US-AriaNeural",
    source: "edge",
    category: "Neural",
  },
  {
    name: "Guy (Male)",
    voiceId: "en-US-GuyNeural",
    source: "edge",
    category: "Neural",
  },
  {
    name: "Christopher (Male)",
    voiceId: "en-US-ChristopherNeural",
    source: "edge",
    category: "Neural",
  },
  {
    name: "Emma (Female)",
    voiceId: "en-US-EmmaNeural",
    source: "edge",
    category: "Neural",
  },
  {
    name: "Brian (Male)",
    voiceId: "en-US-BrianNeural",
    source: "edge",
    category: "Neural",
  },
  {
    name: "Sonia (Female)",
    voiceId: "en-GB-SoniaNeural",
    source: "edge",
    category: "Neural",
  },
];

const LORDSBOOK_VOICE_PREFIXES = {
  af: { locale: "American English", gender: "Female" },
  am: { locale: "American English", gender: "Male" },
  bf: { locale: "British English", gender: "Female" },
  bm: { locale: "British English", gender: "Male" },
  ef: { locale: "Spanish", gender: "Female" },
  em: { locale: "Spanish", gender: "Male" },
  ff: { locale: "French", gender: "Female" },
  fm: { locale: "French", gender: "Male" },
  hf: { locale: "Hindi", gender: "Female" },
  hm: { locale: "Hindi", gender: "Male" },
  if: { locale: "Italian", gender: "Female" },
  im: { locale: "Italian", gender: "Male" },
  jf: { locale: "Japanese", gender: "Female" },
  jm: { locale: "Japanese", gender: "Male" },
  pf: { locale: "Portuguese", gender: "Female" },
  pm: { locale: "Portuguese", gender: "Male" },
  zf: { locale: "Mandarin Chinese", gender: "Female" },
  zm: { locale: "Mandarin Chinese", gender: "Male" },
};

const LEGACY_LORDSBOOK_VOICE_ALIASES = {
  "en-GB-RyanNeural": "bm_george",
  "en-US-JennyNeural": "af_heart",
  "en-US-AriaNeural": "af_nova",
  "en-US-GuyNeural": "am_adam",
  "en-US-ChristopherNeural": "am_michael",
  "en-US-EmmaNeural": "bf_emma",
  "en-US-BrianNeural": "bm_daniel",
  "en-GB-SoniaNeural": "bf_alice",
  "en-US-DavisNeural": "am_eric",
  "21m00Tcm4TlvDq8ikWAM": "af_heart",
  pNInz6obpgDQGcFmaJgB: "am_adam",
  EXAVITQu4vr2J3Ql38jY: "af_bella",
  piTKgcLEGmPE4e6mEKli: "af_nicole",
};

// Reverse lookup: a Kokoro voice id back to its legacy Edge narrator, so an
// Edge fallback keeps the same narrator identity the user actually picked.
const LORDSBOOK_TO_LEGACY_VOICES = Object.fromEntries(
  Object.entries(LEGACY_LORDSBOOK_VOICE_ALIASES).map(([legacy, lordsbook]) => [
    lordsbook,
    legacy,
  ]),
);

let lordsbookVoiceCache = null;
let lordsbookVoiceRequest = null;
const lordsbookSynthesisInFlight = new Map();

// ── Lordsbook TTS load guard ────────────────────────────────────────────────
// Kokoro synthesis is ~real-time (a verse costs seconds of CPU/GPU). Firing
// every prefetch window at the upstream simultaneously overflows its queue and
// triggers 502s, so network calls are concurrency-capped. A circuit breaker
// turns Lordsbook off (dropping to Edge) after repeated failures so a slow or
// half-open upstream can't stall the reader for minutes.
const readPositiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

// The live Lordsbook endpoint is substantially faster when requests are
// serialized (~12s/verse versus ~63s for three concurrent verses).
const LORDSBOOK_MAX_CONCURRENCY = readPositiveInt(
  "LORDSBOOK_MAX_CONCURRENCY",
  1,
);
const BREAKER_WINDOW_MS = 60_000;
const BREAKER_THRESHOLD = readPositiveInt("LORDSBOOK_BREAKER_THRESHOLD", 3);
const BREAKER_COOLDOWN_MS = readPositiveInt(
  "LORDSBOOK_BREAKER_COOLDOWN_MS",
  5 * 60_000,
);
const BREAKER_PROBE_INTERVAL_MS = readPositiveInt(
  "LORDSBOOK_BREAKER_PROBE_INTERVAL_MS",
  15_000,
);

let lordsbookActive = 0;
const lordsbookQueue = [];
let lordsbookBreaker = { failures: [], cooldownUntil: 0 };
let lordsbookLastProbeAt = 0;

const pollLordsbookQueue = () => {
  while (lordsbookActive < LORDSBOOK_MAX_CONCURRENCY && lordsbookQueue.length) {
    const { job, resolve, reject } = lordsbookQueue.shift();
    lordsbookActive += 1;
    job()
      .then(resolve, reject)
      .finally(() => {
        lordsbookActive -= 1;
        pollLordsbookQueue();
      });
  }
};

const runLordsbookConstrained = (job, priority = "low") =>
  new Promise((resolve, reject) => {
    const item = { job, resolve, reject, priority };
    if (priority === "high") {
      const firstLow = lordsbookQueue.findIndex(
        (queued) => queued.priority !== "high",
      );
      lordsbookQueue.splice(
        firstLow === -1 ? lordsbookQueue.length : firstLow,
        0,
        item,
      );
    } else {
      lordsbookQueue.push(item);
    }
    pollLordsbookQueue();
  });

const lordsbookBreakerOpen = () => Date.now() < lordsbookBreaker.cooldownUntil;

const recordLordsbookSuccess = () => {
  lordsbookBreaker.failures = [];
};

const recordLordsbookFailure = () => {
  const now = Date.now();
  lordsbookBreaker.failures = [
    ...lordsbookBreaker.failures.filter((t) => now - t < BREAKER_WINDOW_MS),
    now,
  ];
  if (lordsbookBreaker.failures.length >= BREAKER_THRESHOLD) {
    lordsbookBreaker.cooldownUntil = now + BREAKER_COOLDOWN_MS;
    lordsbookLastProbeAt = now;
    console.warn(
      `[TTS] Lordsbook breaker tripped after ${BREAKER_THRESHOLD} failures; using Edge for ${BREAKER_COOLDOWN_MS / 1000}s`,
    );
  }
};

// The provider the app is told about must match the provider that actually
// synthesizes, otherwise a reading alternates narrators per verse. While the
// Lordsbook breaker is open we therefore report and use Edge for EVERYTHING
// (voice list + synthesis), so a degraded window plays one coherent narrator.
const getEffectiveTtsProvider = () => {
  if (getTtsProvider() !== "lordsbook") return "edge";
  return lordsbookBreakerOpen() ? "edge" : "lordsbook";
};

export const resetLordsbookBreaker = () => {
  lordsbookBreaker.failures = [];
  lordsbookBreaker.cooldownUntil = 0;
  lordsbookLastProbeAt = 0;
};

const formatVoiceName = (voiceId) => {
  const [prefix, ...nameParts] = voiceId.split("_");
  const metadata = LORDSBOOK_VOICE_PREFIXES[prefix];
  const displayName = nameParts
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return metadata
    ? `${displayName} (${metadata.locale}, ${metadata.gender})`
    : displayName || voiceId;
};

const formatLordsbookVoice = (voiceId) => {
  const metadata = LORDSBOOK_VOICE_PREFIXES[voiceId.slice(0, 2)];
  return {
    name: formatVoiceName(voiceId),
    voiceId,
    source: "api",
    category: metadata ? `Kokoro · ${metadata.locale}` : "Kokoro",
  };
};

const loadLordsbookVoiceIds = async () => {
  if (
    lordsbookVoiceCache &&
    Date.now() - lordsbookVoiceCache.loadedAt < LORDSBOOK_VOICE_CACHE_TTL_MS
  ) {
    return lordsbookVoiceCache.voices;
  }
  if (lordsbookVoiceRequest) return lordsbookVoiceRequest;

  lordsbookVoiceRequest = getLordsbookVoices()
    .then((voices) => {
      lordsbookVoiceCache = { voices, loadedAt: Date.now() };
      return voices;
    })
    .finally(() => {
      lordsbookVoiceRequest = null;
    });
  return lordsbookVoiceRequest;
};

const resolveLordsbookVoice = (voiceId) => {
  if (/^[a-z]{2}_[a-z0-9_]+$/i.test(voiceId || "")) return voiceId;
  return LEGACY_LORDSBOOK_VOICE_ALIASES[voiceId] || getDefaultLordsbookVoice();
};

// ── ElevenLabs voices (paid) ───────────────────────────────────────────────
const ELEVENLABS_VOICE_IDS = {
  Rachel: "21m00Tcm4TlvDq8ikWAM",
  Adam: "pNInz6obpgDQGcFmaJgB",
  Antoni: "ErXwobaYiN019PkySvjV",
  Bella: "EXAVITQu4vr2J3Ql38jY",
  Josh: "TxGEqnHWrfWFTfGW9XjX",
  Nicole: "piTKgcLEGmPE4e6mEKli",
  Serena: "pMsXgVXv3BLzN3jMGXJd",
};

export const DEFAULT_EDGE_VOICE = "en-GB-RyanNeural";
export const DEFAULT_TTS_SPEED = 0.75;
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
let _workPool = []; // up to WORK_POOL_SIZE background clients
let _queue = []; // { voice, high, job, resolve, reject }
let _dispatching = false;
let _expressConnecting = null; // in-flight connection promise (dedupes races)
let _workConnecting = null;

const setupClient = (client, voice) =>
  client.setMetadata(voice, TIMED_FORMAT, { wordBoundaryEnabled: true });

const closeClient = (entry) => {
  try {
    entry.client.close();
  } catch {}
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
        try {
          client.close();
        } catch {}
      }
    })().finally(() => {
      _expressConnecting = null;
    });
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
          try {
            client.close();
          } catch {}
        }
      })().finally(() => {
        _workConnecting = null;
      });
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
    if (getEffectiveTtsProvider() === "lordsbook") {
      await loadLordsbookVoiceIds();
      return;
    }
    await ensureExpress();
    await ensureWorkPool();
  } catch {
    // Best-effort; provider discovery/connections retry on the first request.
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────

const isEdgeVoice = (voiceId) => EDGE_VOICES.some((v) => v.voiceId === voiceId);

const isElevenLabsVoice = (voiceId) => false;

// The Edge narrator that best matches a requested voice id: keep the exact
// Edge voice if that is what was asked for, else translate a Kokoro voice back
// to its legacy Edge counterpart so the fallback never swaps narrators.
const edgeVoiceFromRequest = (voiceId) => {
  if (voiceId && isEdgeVoice(voiceId)) return voiceId;
  return LORDSBOOK_TO_LEGACY_VOICES[voiceId] || DEFAULT_EDGE_VOICE;
};

// ── Public API ─────────────────────────────────────────────────────────────

// ── Public API ─────────────────────────────────────────────────────────────

export const getStatus = () => ({
  enabled: true,
  provider: getEffectiveTtsProvider(),
  elevenLabsEnabled: false,
});

export const getVoices = async () => {
  if (getTtsProvider() === "lordsbook" && lordsbookBreakerOpen()) {
    const now = Date.now();
    if (now - lordsbookLastProbeAt < BREAKER_PROBE_INTERVAL_MS) {
      return EDGE_VOICES;
    }
    lordsbookLastProbeAt = now;
    try {
      // Voice selection is an explicit provider refresh from the app. Bypass
      // the cached list so a recovered upstream can close the breaker early.
      const voiceIds = await getLordsbookVoices();
      lordsbookVoiceCache = { voices: voiceIds, loadedAt: now };
      recordLordsbookSuccess();
      lordsbookBreaker.cooldownUntil = 0;
      console.info("[TTS] Lordsbook recovered; circuit breaker closed");
      return voiceIds.map(formatLordsbookVoice);
    } catch (error) {
      console.warn("[TTS] Lordsbook recovery probe failed:", error.message);
      return EDGE_VOICES;
    }
  }

  if (getEffectiveTtsProvider() === "lordsbook") {
    try {
      const voiceIds = await loadLordsbookVoiceIds();
      return voiceIds.map(formatLordsbookVoice);
    } catch (error) {
      console.warn("[TTS] Lordsbook voice discovery failed:", error.message);
      return EDGE_VOICES;
    }
  }

  return EDGE_VOICES;
};

const transcodeWavToMp3 = (wavBuffer) =>
  new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "wav",
        "-i",
        "pipe:0",
        "-ac",
        "1",
        "-ar",
        "24000",
        "-b:a",
        "48k",
        "-f",
        "mp3",
        "pipe:1",
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    const output = [];
    const errors = [];
    let settled = false;
    const timeout = setTimeout(() => {
      ffmpeg.kill("SIGKILL");
      if (!settled) {
        settled = true;
        reject(new Error("TTS audio conversion timed out"));
      }
    }, 30000);

    ffmpeg.stdout.on("data", (chunk) => output.push(chunk));
    ffmpeg.stderr.on("data", (chunk) => errors.push(chunk));
    ffmpeg.on("error", (error) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(new Error(`Unable to start FFmpeg: ${error.message}`));
      }
    });
    ffmpeg.on("close", (code) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      const mp3Buffer = Buffer.concat(output);
      if (code !== 0 || mp3Buffer.length < 1_000) {
        const detail = Buffer.concat(errors).toString("utf8").trim();
        reject(
          new Error(
            detail
              ? `TTS audio conversion failed: ${detail}`
              : "TTS audio conversion returned empty audio",
          ),
        );
        return;
      }
      resolve(mp3Buffer);
    });

    ffmpeg.stdin.on("error", () => {});
    ffmpeg.stdin.end(wavBuffer);
  });

const synthesizeLordsbook = async (
  text,
  voiceId,
  speed = DEFAULT_TTS_SPEED,
  priority = "low",
) => {
  const voice = resolveLordsbookVoice(voiceId);
  const cacheKey = getCacheKey(text, voice, speed, "lordsbook-mp3");
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const pending = lordsbookSynthesisInFlight.get(cacheKey);
  if (pending) return pending;
  if (lordsbookBreakerOpen()) {
    throw new Error("Lordsbook TTS breaker is open");
  }

  const request = (async () => {
    try {
      return await runLordsbookConstrained(async () => {
        if (lordsbookBreakerOpen()) {
          throw new Error("Lordsbook TTS breaker is open");
        }
        const redisAudio = await getRedisAudio(cacheKey);
        if (redisAudio) {
          setInCache(cacheKey, redisAudio);
          recordLordsbookSuccess();
          return redisAudio;
        }

        const { audioBuffer: wavBuffer } = await synthesizeLordsbookSpeech({
          text,
          voice,
          speed,
        });
        const mp3Buffer = await transcodeWavToMp3(wavBuffer);
        setInCache(cacheKey, mp3Buffer);
        void setRedisAudio(cacheKey, mp3Buffer);
        recordLordsbookSuccess();
        return mp3Buffer;
      }, priority);
    } catch (error) {
      if (error.message !== "Lordsbook TTS breaker is open") {
        recordLordsbookFailure();
      }
      throw error;
    } finally {
      if (lordsbookSynthesisInFlight.get(cacheKey) === request) {
        lordsbookSynthesisInFlight.delete(cacheKey);
      }
    }
  })();

  lordsbookSynthesisInFlight.set(cacheKey, request);
  return request;
};

// ── Edge TTS synthesis (serialized client pool) ───────────────────────────

const synthesizeEdge = async (
  text,
  voiceId = DEFAULT_EDGE_VOICE,
  speed = DEFAULT_TTS_SPEED,
) => {
  const cacheKey = getCacheKey(text, voiceId, speed, "edge-mp3");
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const redisAudio = await getRedisAudio(cacheKey);
  if (redisAudio) {
    setInCache(cacheKey, redisAudio);
    return redisAudio;
  }

  // Edge TTS rate: "+0%" = normal, "+20%" = 1.2x, "-20%" = 0.8x
  const ratePercent = Math.round((speed - 1) * 100);
  const rate =
    ratePercent === 0 ? "+0%" : `${ratePercent > 0 ? "+" : ""}${ratePercent}%`;
  // Compress sentence-boundary pauses before synthesis (see helper comment)
  const transformedText = transformTextForEdge(text);

  try {
    const buffer = await acquireTimedClient(voiceId, false, async (tts) => {
      const { audioStream, metadataStream } = tts.toStream(transformedText, {
        rate,
      });
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
  speed = DEFAULT_TTS_SPEED,
  priority = "low",
) => {
  if (getEffectiveTtsProvider() === "lordsbook") {
    try {
      return {
        audioBuffer: await synthesizeLordsbook(
          text,
          voiceId,
          speed,
          priority,
        ),
        wordOffsetsMs: [],
      };
    } catch (error) {
      console.warn(
        `[TTS] Lordsbook timed synthesis failed; using Edge fallback: ${error.message}`,
      );
    }
  }

  const candidates = [edgeVoiceFromRequest(voiceId), DEFAULT_EDGE_VOICE];
  for (const candidate of candidates) {
    const edgeVoice = edgeVoiceFromRequest(candidate);
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
  const cacheKey = getCacheKey(text, edgeVoice, speed, "edge-timings-mp3");

  const mem = getTimingsFromCache(cacheKey);
  if (mem)
    return { audioBuffer: mem.audioBuffer, wordOffsetsMs: mem.wordOffsetsMs };

  const redis = await getRedisTimings(cacheKey);
  if (redis) {
    setTimingsInCache(cacheKey, redis.audioBuffer, redis.wordOffsetsMs);
    return redis;
  }

  const ratePercent = Math.round((speed - 1) * 100);
  const rate =
    ratePercent === 0 ? "+0%" : `${ratePercent > 0 ? "+" : ""}${ratePercent}%`;
  // Compress sentence-boundary pauses before synthesis (see helper comment)
  const transformedText = transformTextForEdge(text);

  const result = await acquireTimedClient(
    edgeVoice,
    priority === "high",
    async (tts) => {
      const { audioStream, metadataStream } = tts.toStream(transformedText, {
        rate,
      });
      const audioChunks = [];
      const wordOffsetsMs = [];
      let audioEnded = false;
      let resolveMeta;
      const metadataDone = new Promise((resolve) => {
        resolveMeta = resolve;
      });

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
      if (audioBuffer.length === 0)
        throw new Error("Empty audio received from Edge TTS");
      return { audioBuffer, wordOffsetsMs };
    },
  );

  setTimingsInCache(cacheKey, result.audioBuffer, result.wordOffsetsMs);
  setRedisTimings(cacheKey, result.audioBuffer, result.wordOffsetsMs);
  return result;
};

// ── ElevenLabs synthesis ───────────────────────────────────────────────────

const synthesizeElevenLabs = async () => {
  throw new Error("ElevenLabs is disabled");
};

// ── Main synthesize ────────────────────────────────────────────────────────

export const synthesize = async (text, voiceId, speed = DEFAULT_TTS_SPEED) => {
  if (getEffectiveTtsProvider() === "lordsbook") {
    try {
      return await synthesizeLordsbook(text, voiceId, speed, "high");
    } catch (error) {
      console.warn(
        `[TTS] Lordsbook synthesis failed; using Edge fallback: ${error.message}`,
      );
    }
  }

  const edgeVoice = edgeVoiceFromRequest(voiceId);
  return synthesizeEdge(text, edgeVoice, speed);
};
