export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const supportedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const uploadError = (code, message) => Object.assign(new Error(message), { code });

export const receiptFileFilter = (_req, file, callback) => {
  if (!supportedTypes.has(file?.mimetype)) {
    callback(uploadError("UNSUPPORTED_RECEIPT_TYPE", "Unsupported receipt image type"), false);
    return;
  }

  callback(null, true);
};

const hasPrefix = (buffer, bytes) =>
  Buffer.isBuffer(buffer) &&
  buffer.length >= bytes.length &&
  bytes.every((byte, index) => buffer[index] === byte);

const detectImageType = (buffer) => {
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return "jpg";
  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
};

export const validateReceiptImage = (file) => {
  const detected = detectImageType(file?.buffer);
  const expected = supportedTypes.get(file?.mimetype);
  if (!detected || detected !== expected) {
    throw uploadError("INVALID_RECEIPT_CONTENT", "Receipt content does not match its image type");
  }
  return detected;
};
