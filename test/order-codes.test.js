import assert from "node:assert/strict";
import test from "node:test";

import { createPublicOrderCode } from "../backend/security/orderCodes.js";

test("order and tracking codes use high-entropy cryptographic identifiers", () => {
  const values = Array.from({ length: 1000 }, () => createPublicOrderCode("TRK-"));
  assert.equal(new Set(values).size, values.length);
  for (const value of values) {
    assert.match(value, /^TRK-[A-Za-z0-9_-]{22}$/);
  }
});
