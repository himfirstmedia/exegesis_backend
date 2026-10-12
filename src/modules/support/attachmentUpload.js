// Support attachments — screenshots (jpg/png/webp) and PDFs, sent as base64
// from the app/web clients (the same transport the profile-photo upload uses).
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Magic-byte detection — never trust the client's declared file type. */
const detectExtension = (buffer) => {
  if (
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpg";
  }
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (buffer.length > 4 && buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    return "pdf";
  }
  return null;
};

const stripDataUrl = (value) =>
  value.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");

/** Keep the original name for display, but never let it dictate the storage path. */
export const safeAttachmentName = (name, extension) => {
  const cleaned = String(name ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "-")
    .trim()
    .slice(0, 120);
  return cleaned || `attachment.${extension}`;
};

/**
 * @returns {{ buffer: Buffer, extension: string, name: string } | { error: { status: number, message: string } }}
 */
export const decodeAttachmentUpload = (base64, fileName) => {
  if (!base64 || typeof base64 !== "string" || base64.length === 0) {
    return { error: { status: 400, message: "Attachment (base64) is required" } };
  }

  const payload = stripDataUrl(base64);
  const sizeInBytes = Math.floor((payload.length * 3) / 4);
  if (sizeInBytes > MAX_ATTACHMENT_BYTES) {
    return {
      error: { status: 400, message: "Attachment is too large (max 5MB)" },
    };
  }

  let buffer;
  try {
    buffer = Buffer.from(payload, "base64");
  } catch {
    return { error: { status: 400, message: "Invalid attachment data" } };
  }
  if (buffer.length === 0) {
    return { error: { status: 400, message: "Invalid attachment data" } };
  }

  const extension = detectExtension(buffer);
  if (!extension) {
    return {
      error: {
        status: 400,
        message: "Unsupported file type. Attach a jpg, png, webp or pdf.",
      },
    };
  }

  return { buffer, extension, name: safeAttachmentName(fileName, extension) };
};

export const MAX_ATTACHMENT_SIZE = MAX_ATTACHMENT_BYTES;
