import * as ttsService from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";

export const speak = async (req, res) => {
  try {
    const { text, voiceId, speed } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "Text is required" }));
    }
    const audioBuffer = await ttsService.synthesize(text, voiceId, speed);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error("TTS speak error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: "TTS synthesis failed: " + error.message }));
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
