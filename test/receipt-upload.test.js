import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RECEIPT_BYTES,
  receiptFileFilter,
  validateReceiptImage,
} from "../backend/security/receiptUpload.js";

const makeFile = (mimetype, buffer, originalname = "receipt") => ({ mimetype, buffer, originalname });

const runFilter = (file) => new Promise((resolve) => {
  receiptFileFilter({}, file, (error, accepted) => resolve({ error, accepted }));
});

test("receipt upload limit remains aligned with the 5MB frontend limit", () => {
  assert.equal(MAX_RECEIPT_BYTES, 5 * 1024 * 1024);
});

test("Multer filter accepts only supported image MIME types", async () => {
  assert.deepEqual(await runFilter(makeFile("image/jpeg", Buffer.alloc(0), "receipt.jpg")), { error: null, accepted: true });
  assert.deepEqual(await runFilter(makeFile("image/png", Buffer.alloc(0), "receipt.png")), { error: null, accepted: true });
  assert.deepEqual(await runFilter(makeFile("image/webp", Buffer.alloc(0), "receipt.webp")), { error: null, accepted: true });

  const rejected = await runFilter(makeFile("text/plain", Buffer.alloc(0), "receipt.txt"));
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.error?.code, "UNSUPPORTED_RECEIPT_TYPE");
});

test("actual JPEG, PNG and WebP signatures are accepted", () => {
  assert.equal(validateReceiptImage(makeFile("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0]))), "jpg");
  assert.equal(validateReceiptImage(makeFile("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))), "png");
  assert.equal(validateReceiptImage(makeFile("image/webp", Buffer.from("RIFF1234WEBP", "ascii"))), "webp");
});

test("a spoofed image MIME type is rejected after reading the bytes", () => {
  assert.throws(
    () => validateReceiptImage(makeFile("image/jpeg", Buffer.from("not-an-image"))),
    (error) => error?.code === "INVALID_RECEIPT_CONTENT"
  );
});
