import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_ENABLED = process.env.ELEVENLABS_ENABLED === "true";
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// ── Edge TTS voices (free, Microsoft Neural) ──────────────────────────────
const EDGE_VOICES = [
  { name: "Aria (Female)",   voiceId: "en-US-AriaNeural",    source: "edge", category: "Neural" },
  { name: "Jenny (Female)",  voiceId: "en-US-JennyNeural",   source: "edge", category: "Neural" },
  { name: "Guy (Male)",      voiceId: "en-US-GuyNeural",     source: "edge", category: "Neural" },
  { name: "Davis (Male)",    voiceId: "en-US-DavisNeural",   source: "edge", category: "Neural" },
  { name: "Emma (Female)",   voiceId: "en-US-EmmaNeural",    source: "edge", category: "Neural" },
  { name: "Brian (Male)",    voiceId: "en-US-BrianNeural",   source: "edge", category: "Neural" },
  { name: "Jane (Female)",   voiceId: "en-GB-SoniaNeural",   source: "edge", category: "Neural" },
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

const DEFAULT_EDGE_VOICE = "en-US-DavisNeural";
const DEFAULT_ELEVENLABS_VOICE = "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

// ── Helpers ────────────────────────────────────────────────────────────────

const isEdgeVoice = (voiceId) => EDGE_VOICES.some((v) => v.voiceId === voiceId);

const isElevenLabsVoice = (voiceId) => {
  const knownIds = Object.values(ELEVENLABS_VOICE_IDS);
  const isUuid = /^[0-9a-f]{20,}$/i.test(voiceId);
  return knownIds.includes(voiceId) || isUuid;
};

// ── Public API ─────────────────────────────────────────────────────────────

export const getStatus = () => ({
  enabled: true, // Edge TTS is always available
  hasApiKey: !!ELEVENLABS_API_KEY,
  elevenLabsEnabled: ELEVENLABS_ENABLED && !!ELEVENLABS_API_KEY,
});

export const getVoices = async () => {
  const edgeVoices = EDGE_VOICES;

  if (!ELEVENLABS_ENABLED || !ELEVENLABS_API_KEY) {
    return edgeVoices;
  }

  // Fetch ElevenLabs voices and prepend Edge voices
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

// ── Edge TTS synthesis ─────────────────────────────────────────────────────

const synthesizeEdge = async (text, voiceId = DEFAULT_EDGE_VOICE, speed = 1.0) => {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // Edge TTS rate: "+0%" = normal, "+20%" = 1.2x, "-20%" = 0.8x
  const ratePercent = Math.round((speed - 1) * 100);
  const rate = ratePercent === 0 ? "+0%" : `${ratePercent > 0 ? "+" : ""}${ratePercent}%`;

  const { audioStream } = await tts.toStream(text, { rate });

  const chunks = [];
  await new Promise((resolve, reject) => {
    audioStream.on("data", (d) => chunks.push(d));
    audioStream.on("end", resolve);
    audioStream.on("error", reject);
  });

  return Buffer.concat(chunks);
};

// ── ElevenLabs synthesis ───────────────────────────────────────────────────

const synthesizeElevenLabs = async (text, voiceId, speed = 1.0) => {
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

  return Buffer.from(await response.arrayBuffer());
};

// ── Main synthesize ────────────────────────────────────────────────────────

export const synthesize = async (text, voiceId, speed = 1.0) => {
  // Route to ElevenLabs if enabled and voice is an ElevenLabs voice
  if (ELEVENLABS_ENABLED && ELEVENLABS_API_KEY && voiceId && isElevenLabsVoice(voiceId)) {
    return synthesizeElevenLabs(text, voiceId, speed);
  }

  // Default: Edge TTS (free, neural)
  const edgeVoice = (voiceId && isEdgeVoice(voiceId)) ? voiceId : DEFAULT_EDGE_VOICE;
  return synthesizeEdge(text, edgeVoice, speed);
};
