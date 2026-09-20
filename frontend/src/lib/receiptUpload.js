export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const RECEIPT_ACCEPT_ATTRIBUTE = RECEIPT_MIME_TYPES.join(",");

export const isSupportedReceiptFile = (file) =>
  Boolean(
    file &&
    RECEIPT_MIME_TYPES.includes(file.type) &&
    Number.isFinite(file.size) &&
    file.size > 0 &&
    file.size <= MAX_RECEIPT_BYTES
  );
