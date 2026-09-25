import * as ttsService from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";

export const speak = async (req, res) => {
  try {
    const { text, voiceId, speed, provider } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "Text is required" }));
    }
    const result = await ttsService.synthesize(
      text,
      voiceId,
      speed,
      provider,
    );
    const audioBuffer = Buffer.isBuffer(result) ? result : result.audioBuffer;
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "X-TTS-Provider": result.provider || provider || "unknown",
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error("TTS speak error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: "TTS synthesis failed: " + error.message }));
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
    );
    return res.status(200).json({
      audioBase64: result.audioBuffer.toString("base64"),
      wordOffsetsMs: result.wordOffsetsMs,
      provider: result.provider,
    });
  } catch (error) {
    console.error("Timed TTS speak error:", error);
    const status = req.body.provider ? 503 : 500;
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
