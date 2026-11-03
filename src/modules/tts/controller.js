import * as ttsService from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";

export const speak = async (req, res) => {
  try {
    const { text, voiceId, speed, provider, lang, language } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "Text is required" }));
    }
    // Clamp speed so the client cannot request garbled (>2x) or unusable
    // (<0.5x) playback; Lordsbook clamps on the way through, but guard at the
    // edge too so Edge and any future provider are protected.
    const clampedSpeed = Math.min(2.0, Math.max(0.5, Number(speed) || 1));
    const result = await ttsService.synthesize(
      text,
      voiceId,
      clampedSpeed,
      provider,
      lang || language,
    );
    const audioBuffer = Buffer.isBuffer(result) ? result : result.audioBuffer;
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "X-TTS-Provider": result.provider || provider || "unknown",
    });
    res.send(audioBuffer);
  } catch (error) {
    const status = error?.statusCode || 500;
    console.warn(
      `[TTS] speak failed (${error?.code || "error"}): ${error.message}`,
    );
    return res.status(status).json(formatApiResponse({ status, message: "TTS synthesis failed: " + error.message }));
  }
};

export const speakWithTimings = async (req, res) => {
  try {
    const { text, voiceId, speed } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "Text is required" }));
    }
    // Clamp speed the same way as `speak` so playback never runs at garbled
    // rates, regardless of which provider serves the track.
    const clampedSpeed = Math.min(2.0, Math.max(0.5, Number(speed) || 1));
    const result = await ttsService.synthesizeWithTimings(
      text,
      voiceId,
      clampedSpeed,
      req.body.priority === "high" ? "high" : "low",
      req.body.provider,
      req.body.lang || req.body.language,
    );
    return res.status(200).json({
      audioBase64: result.audioBuffer.toString("base64"),
      wordOffsetsMs: result.wordOffsetsMs,
      provider: result.provider,
    });
  } catch (error) {
    // Silence / failed conversion for Lordsbook, Edge rate-limits and network
    // timeouts are all retryable: surface 503 so the client falls back to
    // device TTS instead of treating the audio as permanently broken.
    const isRetryable =
      error?.statusCode === 503 ||
      /silent|empty audio|conversion failed|timeout/i.test(error.message);
    const status = isRetryable
      ? 503
      : error?.statusCode || (req.body.provider ? 503 : 500);
    console.warn(
      `[TTS] timed speak failed (${error?.code || "error"}): ${error.message}`,
    );
    return res.status(status).json(formatApiResponse({ status, message: "Timed TTS synthesis failed: " + error.message }));
  }
};

export const getVoices = async (req, res) => {
  try {
    const voices = await ttsService.getVoices();
    return res.status(200).json(formatApiResponse({ status: 200, message: "Voices fetched", data: voices }));
  } catch (error) {
    console.error("TTS voices error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: "Failed to fetch voices: " + error.message }));
  }
};

export const getStatus = async (req, res) => {
  try {
    const status = ttsService.getStatus();
    return res.status(200).json(formatApiResponse({ status: 200, message: "TTS status", data: status }));
  } catch (error) {
    console.error("TTS status error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: "Failed to get TTS status: " + error.message }));
  }
};
