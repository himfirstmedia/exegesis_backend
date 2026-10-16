jest.mock("msedge-tts", () => {
  const { PassThrough, Readable } = jest.requireActual("stream");
  class FakeMsEdgeTTS {
    setMetadata() {}
    close() {}
    toStream(text) {
      if (text === "stalled stream") {
        return {
          audioStream: new PassThrough(),
          metadataStream: Readable.from([]),
        };
      }
      if (text === "rate limited") {
        const error = new Error(
          "Edge TTS WebSocket error: Unexpected server response: 429",
        );
        error.cause = { status: 429 };
        throw error;
      }
      return {
        audioStream: Readable.from([Buffer.alloc(2000, 1)]),
        metadataStream: Readable.from([]),
      };
    }
  }
  return {
    MsEdgeTTS: FakeMsEdgeTTS,
    OUTPUT_FORMAT: { AUDIO_24KHZ_48KBITRATE_MONO_MP3: "mp3" },
  };
});

import {
  getVoices,
  getStatus,
  DEFAULT_EDGE_VOICE,
  DEFAULT_TTS_SPEED,
  buildEdgeSynthUrl,
  synthesize,
  synthesizeWithTimings,
  resetLordsbookBreaker,
  resolveEdgeVoiceForLanguage,
  defaultEdgeVoiceForLanguage,
  classifyEdgeError,
  getEdgeCooldown,
  resetEdgeCooldown,
} from "./service.js";

describe("TTS voice defaults", () => {
  const originalProvider = process.env.TTS_PROVIDER;
  const originalTtsEnable = process.env.LORDSBOOK_TTS_ENABLE;

  beforeEach(() => {
    process.env.TTS_PROVIDER = "edge";
    process.env.LORDSBOOK_TTS_ENABLE = "false";
    resetLordsbookBreaker();
    resetEdgeCooldown();
  });

  afterAll(() => {
    if (originalProvider === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalProvider;
    if (originalTtsEnable === undefined)
      delete process.env.LORDSBOOK_TTS_ENABLE;
    else process.env.LORDSBOOK_TTS_ENABLE = originalTtsEnable;
  });

  test("Ryan is the app default voice", () => {
    expect(DEFAULT_EDGE_VOICE).toBe("en-GB-RyanNeural");
  });

  test("backend narration defaults to 0.75 speed", () => {
    expect(DEFAULT_TTS_SPEED).toBe(0.75);
  });

  test("getVoices returns Ryan first so client fallbacks land on it", async () => {
    const voices = await getVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0].voiceId).toBe("en-GB-RyanNeural");
    expect(voices[0].name).toContain("Ryan");
    expect(voices.some((v) => v.voiceId === "en-GB-RyanNeural")).toBe(true);
  });

  test("getVoices exposes multilingual Edge narrators", async () => {
    const voices = await getVoices();
    const ru = voices.find((v) => v.voiceId === "ru-RU-DmitryNeural");
    expect(ru).toBeDefined();
    expect(ru.language).toBe("ru");
  });

  test("resolves a language-appropriate Edge voice so non-English text is not silent", () => {
    // A stale English narrator must not be used for Cyrillic text.
    expect(resolveEdgeVoiceForLanguage("en-US-ChristopherNeural", "ru")).toBe(
      "ru-RU-DmitryNeural",
    );
    // An explicit voice already in the requested language is preserved.
    expect(resolveEdgeVoiceForLanguage("ru-RU-SvetlanaNeural", "ru")).toBe(
      "ru-RU-SvetlanaNeural",
    );
    expect(resolveEdgeVoiceForLanguage("en-GB-RyanNeural", "en")).toBe(
      "en-GB-RyanNeural",
    );
    // Accepts region-tagged codes.
    expect(resolveEdgeVoiceForLanguage("en-GB-RyanNeural", "ru-RU")).toBe(
      "ru-RU-DmitryNeural",
    );
    // No language (or an unsupported one) keeps the old resolution behavior.
    expect(resolveEdgeVoiceForLanguage("en-GB-RyanNeural", null)).toBe(
      "en-GB-RyanNeural",
    );
    expect(resolveEdgeVoiceForLanguage("en-GB-RyanNeural", "xx")).toBe(
      "en-GB-RyanNeural",
    );
  });

  test("defaultEdgeVoiceForLanguage maps supported languages", () => {
    expect(defaultEdgeVoiceForLanguage("ru")).toBe("ru-RU-DmitryNeural");
    expect(defaultEdgeVoiceForLanguage("hi")).toBe("hi-IN-MadhurNeural");
    expect(defaultEdgeVoiceForLanguage("xx")).toBe(DEFAULT_EDGE_VOICE);
    expect(defaultEdgeVoiceForLanguage(null)).toBe(DEFAULT_EDGE_VOICE);
  });

  test("getStatus reports TTS enabled", () => {
    const status = getStatus();
    expect(status.enabled).toBe(true);
    expect(status.provider).toBe("edge");
  });

  test("uses Microsoft's current Edge synthesis endpoint", async () => {
    const url = new URL(await buildEdgeSynthUrl());

    expect(url.host).toBe("api.msedgeservices.com");
    expect(url.searchParams.has("Ocp-Apim-Subscription-Key")).toBe(true);
    expect(url.searchParams.has("TrustedClientToken")).toBe(false);
    expect(url.searchParams.get("Sec-MS-GEC")).toMatch(/^[A-F0-9]{64}$/);
  });

  test("disabled Lordsbook flag keeps Edge even when legacy provider says Lordsbook", () => {
    process.env.TTS_PROVIDER = "lordsbook";
    expect(getStatus().provider).toBe("edge");
  });

  test("classifies Edge failures into stable, actionable codes", () => {
    const rateLimited = new Error(
      "Edge TTS WebSocket error: Unexpected server response: 429",
    );
    rateLimited.cause = { status: 429 };
    expect(classifyEdgeError(rateLimited)).toEqual({
      code: "rate_limited",
      retryable: true,
    });

    const timedOut = new Error("Edge TTS WebSocket error: (code=ETIMEDOUT)");
    timedOut.cause = { code: "ETIMEDOUT" };
    expect(classifyEdgeError(timedOut)).toEqual({
      code: "timeout",
      retryable: true,
    });

    expect(
      classifyEdgeError(new Error("Silent audio received from Edge TTS")),
    ).toEqual({ code: "silent_audio", retryable: false });
  });

  test("a rate limit opens a cooldown so Edge is not hammered", async () => {
    await expect(
      synthesizeWithTimings(
        "rate limited",
        DEFAULT_EDGE_VOICE,
        DEFAULT_TTS_SPEED,
        "high",
        "edge",
      ),
    ).rejects.toMatchObject({ cause: { status: 429 } });

    expect(getEdgeCooldown().remainingMs).toBeGreaterThan(0);

    // A follow-up request fails fast (503) instead of retrying the endpoint.
    await expect(
      synthesizeWithTimings(
        "In the beginning",
        DEFAULT_EDGE_VOICE,
        DEFAULT_TTS_SPEED,
        "high",
        "edge",
      ),
    ).rejects.toMatchObject({ code: "TTS_EDGE_COOLDOWN", statusCode: 503 });
  });

  test("cached audio is still served while Edge is cooling down", async () => {
    // Populate the cache, then trip the cooldown; the cached track must play.
    const first = await synthesizeWithTimings(
      "cached verse",
      DEFAULT_EDGE_VOICE,
      DEFAULT_TTS_SPEED,
      "high",
      "edge",
    );
    expect(first.audioBuffer.length).toBeGreaterThanOrEqual(1_000);

    await expect(
      synthesizeWithTimings(
        "rate limited",
        DEFAULT_EDGE_VOICE,
        DEFAULT_TTS_SPEED,
        "high",
        "edge",
      ),
    ).rejects.toMatchObject({ cause: { status: 429 } });

    await expect(
      synthesizeWithTimings(
        "cached verse",
        DEFAULT_EDGE_VOICE,
        DEFAULT_TTS_SPEED,
        "high",
        "edge",
      ),
    ).resolves.toMatchObject({ provider: "edge" });
  });

  test("timed synthesis reports the provider used", async () => {
    const result = await synthesizeWithTimings(
      "In the beginning",
      DEFAULT_EDGE_VOICE,
      DEFAULT_TTS_SPEED,
      "high",
      "edge",
    );

    expect(result.provider).toBe("edge");
    expect(result.audioBuffer.length).toBeGreaterThanOrEqual(1_000);
  });

  test("timed synthesis honors a locked disabled provider", async () => {
    await expect(
      synthesizeWithTimings(
        "In the beginning",
        "af_alloy",
        DEFAULT_TTS_SPEED,
        "high",
        "lordsbook",
      ),
    ).rejects.toThrow("Lordsbook is disabled");
  });

  test("timed synthesis rejects a stalled Edge stream", async () => {
    jest.useFakeTimers();
    try {
      const synthesis = synthesizeWithTimings(
        "stalled stream",
        DEFAULT_EDGE_VOICE,
        DEFAULT_TTS_SPEED,
        "high",
        "edge",
      );
      const rejection = expect(synthesis).rejects.toThrow(
        "Edge TTS synthesis timed out",
      );
      await jest.advanceTimersByTimeAsync(45_000);
      await rejection;
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("Lordsbook voice discovery", () => {
  const originalProvider = process.env.TTS_PROVIDER;
  const originalTtsEnable = process.env.LORDSBOOK_TTS_ENABLE;
  const originalApiKey = process.env.LORDSBOOK_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalProvider;
    if (originalTtsEnable === undefined)
      delete process.env.LORDSBOOK_TTS_ENABLE;
    else process.env.LORDSBOOK_TTS_ENABLE = originalTtsEnable;
    if (originalApiKey === undefined) delete process.env.LORDSBOOK_API_KEY;
    else process.env.LORDSBOOK_API_KEY = originalApiKey;
    global.fetch = originalFetch;
  });

  test("returns every voice supplied by the gateway", async () => {
    // The enable flag is authoritative even when the legacy provider value
    // still says Edge.
    process.env.TTS_PROVIDER = "edge";
    process.env.LORDSBOOK_TTS_ENABLE = "true";
    process.env.LORDSBOOK_API_KEY = "test-key";
    const upstreamVoices = [
      "af_alloy",
      "am_adam",
      "bf_emma",
      "jm_kumo",
      "zf_xiaobei",
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: { voices: upstreamVoices },
        statusCode: 200,
        message: "Voices retrieved",
        success: true,
      }),
    });

    const voices = await getVoices();

    expect(getStatus().provider).toBe("lordsbook");
    expect(voices.map((voice) => voice.voiceId)).toEqual(upstreamVoices);
    expect(voices.every((voice) => voice.source === "api")).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://translate-api.lordsbook.com/voices",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-API-Key": "test-key" }),
      }),
    );
  });
});

describe("Lordsbook TTS breaker", () => {
  const originalProvider = process.env.TTS_PROVIDER;
  const originalTtsEnable = process.env.LORDSBOOK_TTS_ENABLE;
  const originalRetries = process.env.LORDSBOOK_RETRY_ATTEMPTS;
  const originalApiKey = process.env.LORDSBOOK_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.TTS_PROVIDER = "lordsbook";
    process.env.LORDSBOOK_TTS_ENABLE = "true";
    process.env.LORDSBOOK_RETRY_ATTEMPTS = "1";
    process.env.LORDSBOOK_API_KEY = "test-key";
    resetLordsbookBreaker();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ message: "Upstream service unavailable" }),
    });
  });

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalProvider;
    if (originalTtsEnable === undefined)
      delete process.env.LORDSBOOK_TTS_ENABLE;
    else process.env.LORDSBOOK_TTS_ENABLE = originalTtsEnable;
    if (originalRetries === undefined)
      delete process.env.LORDSBOOK_RETRY_ATTEMPTS;
    else process.env.LORDSBOOK_RETRY_ATTEMPTS = originalRetries;
    if (originalApiKey === undefined) delete process.env.LORDSBOOK_API_KEY;
    else process.env.LORDSBOOK_API_KEY = originalApiKey;
    resetLordsbookBreaker();
    global.fetch = originalFetch;
  });

  test("getVoices returns Kokoro voices while the breaker is healthy", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: { voices: ["af_alloy", "bm_george"] },
        statusCode: 200,
        message: "Voices retrieved",
        success: true,
      }),
    });
    const voices = await getVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices.some((voice) => voice.source === "api")).toBe(true);
    expect(voices.some((voice) => voice.source === "edge")).toBe(false);
  });

  test("timed synthesis only falls back when the provider is not locked", async () => {
    await expect(
      synthesizeWithTimings(
        "locked provider verse",
        "bm_george",
        1.0,
        "high",
        "lordsbook",
      ),
    ).rejects.toThrow("Upstream service unavailable");

    const fallback = await synthesizeWithTimings(
      "unlocked provider verse",
      "bm_george",
      1.0,
      "high",
    );
    expect(fallback.provider).toBe("edge");
    expect(fallback.audioBuffer.length).toBeGreaterThanOrEqual(1_000);
  });

  test("opens the circuit after repeated failures and stops calling the upstream", async () => {
    for (let i = 0; i < 5; i += 1) {
      await synthesize(`breaker verse ${i}`, "bm_george", 1.0);
    }
    const callsAfterFive = global.fetch.mock.calls.length;

    // The sixth request must short-circuit (breaker open → Edge fallback)
    // without a fresh upstream call.
    await synthesize("breaker verse done", "bm_george", 1.0);
    expect(global.fetch.mock.calls.length).toBe(callsAfterFive);
  }, 30000);

  test("getVoices returns Edge voices while the breaker is open even if the upstream recovers", async () => {
    for (let i = 0; i < 5; i += 1) {
      await synthesize(`breaker voices ${i}`, "bm_george", 1.0);
    }

    // If the upstream comes back healthy, the voice list must STAY on Edge
    // until the breaker recovers — otherwise the app would highlight a Kokoro
    // narrator while audio is still synthesized by Edge, making the reading
    // voice alternate per verse.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: { voices: ["af_alloy", "bm_george"] },
        statusCode: 200,
        message: "Voices retrieved",
        success: true,
      }),
    });

    const voices = await getVoices();
    expect(voices.some((voice) => voice.source === "api")).toBe(false);
    expect(voices.every((voice) => voice.source === "edge")).toBe(true);
    expect(voices[0].voiceId).toBe("en-GB-RyanNeural");
  }, 30000);

  test("a voice refresh closes the breaker after the recovery probe interval", async () => {
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    for (let i = 0; i < 3; i += 1) {
      await synthesize(`recovery probe ${i}`, "bm_george", 1.0);
    }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: { voices: ["af_alloy", "bm_george"] },
        statusCode: 200,
        message: "Voices retrieved",
        success: true,
      }),
    });
    now.mockReturnValue(1_016_000);

    const voices = await getVoices();
    expect(voices.every((voice) => voice.source === "api")).toBe(true);
    expect(voices.map((voice) => voice.voiceId)).toEqual([
      "af_alloy",
      "bm_george",
    ]);
    now.mockRestore();
  }, 30000);
});
