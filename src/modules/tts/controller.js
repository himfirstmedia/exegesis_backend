import * as ttsService from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";

export const speak = async (req, res) => {
  try {
    const { text, voiceId, speed, provider, lang, language } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "Text is required" }));
    }
    const result = await ttsService.synthesize(
      text,
      voiceId,
      speed,
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
    const result = await ttsService.synthesizeWithTimings(
      text,
      voiceId,
      speed,
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
    // Retryable upstream failures (Edge rate limit / network timeout) surface
    // as 503 so the client can fall back to device TTS instead of treating it
    // as a hard error. Expected failures log one concise line, not a stack.
    const status = error?.statusCode || (req.body.provider ? 503 : 500);
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
