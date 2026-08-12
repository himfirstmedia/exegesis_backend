const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const detectImageExt = (buffer) => {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
};

export const decodeImageUpload = (base64, fieldName) => {
  if (!base64 || typeof base64 !== "string" || base64.length === 0) {
    return { error: { status: 400, message: `${fieldName} (base64) is required` } };
  }

  const sizeInBytes = Math.floor((base64.length * 3) / 4);
  if (sizeInBytes > MAX_IMAGE_BYTES) {
    return { error: { status: 400, message: "Image is too large (max 5MB)" } };
  }

  let buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    return { error: { status: 400, message: "Invalid image data" } };
  }

  const extension = detectImageExt(buffer);
  if (!extension) {
    return { error: { status: 400, message: "File is not a supported image (jpg/png/webp)" } };
  }

  return { buffer, extension };
};
