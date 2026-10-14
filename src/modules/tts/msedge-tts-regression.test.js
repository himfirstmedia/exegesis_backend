import { MsEdgeTTS } from "msedge-tts";

describe("msedge-tts connection failures", () => {
  test("routes a rejected send through the audio stream", async () => {
    const client = new MsEdgeTTS();
    const rateLimitError = new Error(
      "Edge TTS WebSocket error: Unexpected server response: 429",
    );
    client._metadataCheck = jest.fn();
    client._send = jest.fn().mockRejectedValue(rateLimitError);

    const { audioStream } = client._rawSSMLRequest("<speak>Test</speak>");
    const streamError = await new Promise((resolve) => {
      audioStream.once("error", resolve);
    });

    expect(streamError).toBe(rateLimitError);
    expect(client._send).toHaveBeenCalledTimes(1);
  });
});
