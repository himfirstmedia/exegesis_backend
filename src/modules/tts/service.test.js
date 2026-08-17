import { getVoices, getStatus, DEFAULT_EDGE_VOICE } from './service.js';

describe('TTS voice defaults', () => {
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
