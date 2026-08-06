import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import crypto from "node:crypto";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_ENABLED = process.env.ELEVENLABS_ENABLED === "true";
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

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

// ── Edge TTS voices (free, Microsoft Neural) ──────────────────────────────
const EDGE_VOICES = [
  { name: "Jenny (Female)",  voiceId: "en-US-JennyNeural",   source: "edge", category: "Neural" },
  { name: "Aria (Female)",   voiceId: "en-US-AriaNeural",    source: "edge", category: "Neural" },
  { name: "Guy (Male)",      voiceId: "en-US-GuyNeural",     source: "edge", category: "Neural" },
  { name: "Davis (Male)",    voiceId: "en-US-DavisNeural",   source: "edge", category: "Neural" },
  { name: "Emma (Female)",   voiceId: "en-US-EmmaNeural",    source: "edge", category: "Neural" },
  { name: "Brian (Male)",    voiceId: "en-US-BrianNeural",   source: "edge", category: "Neural" },
  { name: "Sonia (Female)",  voiceId: "en-GB-SoniaNeural",   source: "edge", category: "Neural" },
  { name: "Ryan (Male)",     voiceId: "en-GB-RyanNeural",    source: "edge", category: "Neural" },
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

const DEFAULT_EDGE_VOICE = "en-GB-RyanNeural";
const DEFAULT_ELEVENLABS_VOICE = "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

// ── Reusable Edge TTS client ──────────────────────────────────────────────
let _edgeClient = null;
let _clientVoice = null;
let _clientFormat = null;

const getOrCreateEdgeClient = async (voiceId, outputFormat) => {
  if (
    _edgeClient &&
    _clientVoice === voiceId &&
    _clientFormat === outputFormat
  ) {
    return _edgeClient;
  }
  // Close old connection before creating a new one
  if (_edgeClient) {
    try { _edgeClient.close(); } catch {}
  }
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceId, outputFormat);
  _edgeClient = tts;
  _clientVoice = voiceId;
  _clientFormat = outputFormat;
  return tts;
};

const resetEdgeClient = () => {
  if (_edgeClient) {
    try { _edgeClient.close(); } catch {}
  }
  _edgeClient = null;
  _clientVoice = null;
  _clientFormat = null;
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

// ── Edge TTS synthesis (reusable client) ──────────────────────────────────

const synthesizeEdge = async (text, voiceId = DEFAULT_EDGE_VOICE, speed = 1.0) => {
  const cacheKey = getCacheKey(text, voiceId, speed);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const format = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;

  // Edge TTS rate: "+0%" = normal, "+20%" = 1.2x, "-20%" = 0.8x
  const ratePercent = Math.round((speed - 1) * 100);
  const rate = ratePercent === 0 ? "+0%" : `${ratePercent > 0 ? "+" : ""}${ratePercent}%`;

  try {
    const tts = await getOrCreateEdgeClient(voiceId, format);
    const { audioStream } = await tts.toStream(text, { rate });

    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on("data", (d) => chunks.push(d));
      audioStream.on("end", resolve);
      audioStream.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      throw new Error("Empty audio received from Edge TTS");
    }
    setInCache(cacheKey, buffer);
    return buffer;
  } catch (err) {
    // On WebSocket/connection error, reset the client and fall back to default voice
    console.warn(`[TTS] Edge TTS failed for voice "${voiceId}":`, err.message);
    resetEdgeClient();

    // If this was not the default voice, retry once with default
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
) => {
  const edgeVoice = voiceId && isEdgeVoice(voiceId) ? voiceId : DEFAULT_EDGE_VOICE;
  const format = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
  const ratePercent = Math.round((speed - 1) * 100);
  const rate = ratePercent === 0 ? "+0%" : `${ratePercent > 0 ? "+" : ""}${ratePercent}%`;
  const tts = new MsEdgeTTS();

  try {
    await tts.setMetadata(edgeVoice, format, { wordBoundaryEnabled: true });
    const { audioStream, metadataStream } = tts.toStream(text, { rate });
    const audioChunks = [];
    const wordOffsetsMs = [];

    await Promise.all([
      new Promise((resolve, reject) => {
        audioStream.on("data", (chunk) => audioChunks.push(chunk));
        audioStream.on("end", resolve);
        audioStream.on("error", reject);
      }),
      new Promise((resolve, reject) => {
        if (!metadataStream) return resolve();
        metadataStream.on("data", (chunk) => {
          const payload = JSON.parse(chunk.toString());
          for (const item of payload.Metadata || []) {
            if (item.Type === "WordBoundary") {
              wordOffsetsMs.push(item.Data.Offset / 10_000);
            }
          }
        });
        metadataStream.on("end", resolve);
        metadataStream.on("error", reject);
      }),
    ]);

    const audioBuffer = Buffer.concat(audioChunks);
    if (audioBuffer.length === 0) throw new Error("Empty audio received from Edge TTS");
    return { audioBuffer, wordOffsetsMs };
  } finally {
    tts.close();
  }
};

// ── ElevenLabs synthesis ───────────────────────────────────────────────────

const synthesizeElevenLabs = async (text, voiceId, speed = 1.0) => {
  const cacheKey = getCacheKey(text, voiceId, speed);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

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
