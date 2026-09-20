import assert from "node:assert/strict";
import test from "node:test";

import {
  RECEIPT_ACCEPT_ATTRIBUTE,
  isSupportedReceiptFile,
} from "../frontend/src/lib/receiptUpload.js";

test("frontend receipt rules match the backend JPEG, PNG and WebP allowlist", () => {
  assert.equal(RECEIPT_ACCEPT_ATTRIBUTE, "image/jpeg,image/png,image/webp");
  assert.equal(isSupportedReceiptFile({ type: "image/jpeg", size: 1 }), true);
  assert.equal(isSupportedReceiptFile({ type: "image/png", size: 5 * 1024 * 1024 }), true);
  assert.equal(isSupportedReceiptFile({ type: "image/webp", size: 1 }), true);
  assert.equal(isSupportedReceiptFile({ type: "image/gif", size: 1 }), false);
  assert.equal(isSupportedReceiptFile({ type: "image/heic", size: 1 }), false);
  assert.equal(isSupportedReceiptFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), false);
});
