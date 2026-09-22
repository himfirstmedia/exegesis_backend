jest.mock('msedge-tts', () => {
  const { Readable } = jest.requireActual('stream');
  class FakeMsEdgeTTS {
    setMetadata() {}
    close() {}
    toStream() {
      return {
        audioStream: Readable.from([Buffer.alloc(2000, 1)]),
        metadataStream: Readable.from([]),
      };
    }
  }
  return {
    MsEdgeTTS: FakeMsEdgeTTS,
    OUTPUT_FORMAT: { AUDIO_24KHZ_48KBITRATE_MONO_MP3: 'mp3' },
  };
});

import { getVoices, getStatus, DEFAULT_EDGE_VOICE, synthesize } from './service.js';

describe('TTS voice defaults', () => {
  const originalProvider = process.env.TTS_PROVIDER;

  beforeEach(() => {
    process.env.TTS_PROVIDER = 'edge';
  });

  afterAll(() => {
    if (originalProvider === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalProvider;
  });

  test('Ryan is the app default voice', () => {
    expect(DEFAULT_EDGE_VOICE).toBe('en-GB-RyanNeural');
  });

  test('getVoices returns Ryan first so client fallbacks land on it', async () => {
    const voices = await getVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0].voiceId).toBe('en-GB-RyanNeural');
    expect(voices[0].name).toContain('Ryan');
    expect(voices.some((v) => v.voiceId === 'en-GB-RyanNeural')).toBe(true);
  });

  test('getStatus reports TTS enabled', () => {
    const status = getStatus();
    expect(status.enabled).toBe(true);
  });
});

describe('Lordsbook voice discovery', () => {
  const originalProvider = process.env.TTS_PROVIDER;
  const originalApiKey = process.env.LORDSBOOK_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalProvider;
    if (originalApiKey === undefined) delete process.env.LORDSBOOK_API_KEY;
    else process.env.LORDSBOOK_API_KEY = originalApiKey;
    global.fetch = originalFetch;
  });

  test('returns every voice supplied by the gateway', async () => {
    process.env.TTS_PROVIDER = 'lordsbook';
    process.env.LORDSBOOK_API_KEY = 'test-key';
    const upstreamVoices = [
      'af_alloy',
      'am_adam',
      'bf_emma',
      'jm_kumo',
      'zf_xiaobei',
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: { voices: upstreamVoices },
        statusCode: 200,
        message: 'Voices retrieved',
        success: true,
      }),
    });

    const voices = await getVoices();

    expect(voices.map((voice) => voice.voiceId)).toEqual(upstreamVoices);
    expect(voices.every((voice) => voice.source === 'api')).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://translate-api.lordsbook.com/voices',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
      }),
    );
  });
});

describe('Lordsbook TTS breaker', () => {
  const originalProvider = process.env.TTS_PROVIDER;
  const originalTtsEnable = process.env.LORDSBOOK_TTS_ENABLE;
  const originalRetries = process.env.LORDSBOOK_RETRY_ATTEMPTS;
  const originalApiKey = process.env.LORDSBOOK_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.TTS_PROVIDER = 'lordsbook';
    process.env.LORDSBOOK_TTS_ENABLE = 'true';
    process.env.LORDSBOOK_RETRY_ATTEMPTS = '1';
    process.env.LORDSBOOK_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ message: 'Upstream service unavailable' }),
    });
  });

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalProvider;
    if (originalTtsEnable === undefined) delete process.env.LORDSBOOK_TTS_ENABLE;
    else process.env.LORDSBOOK_TTS_ENABLE = originalTtsEnable;
    if (originalRetries === undefined) delete process.env.LORDSBOOK_RETRY_ATTEMPTS;
    else process.env.LORDSBOOK_RETRY_ATTEMPTS = originalRetries;
    if (originalApiKey === undefined) delete process.env.LORDSBOOK_API_KEY;
    else process.env.LORDSBOOK_API_KEY = originalApiKey;
    global.fetch = originalFetch;
  });

  test('opens the circuit after repeated failures and stops calling the upstream', async () => {
    for (let i = 0; i < 5; i += 1) {
      await synthesize(`breaker verse ${i}`, 'bm_george', 1.0);
    }
    const callsAfterFive = global.fetch.mock.calls.length;

    // The sixth request must short-circuit (breaker open → Edge fallback)
    // without a fresh upstream call.
    await synthesize('breaker verse done', 'bm_george', 1.0);
    expect(global.fetch.mock.calls.length).toBe(callsAfterFive);
  }, 30000);
});
