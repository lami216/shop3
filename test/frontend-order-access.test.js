import assert from "node:assert/strict";
import test from "node:test";

import { createOrderAccessConfig } from "../frontend/src/lib/orderAccess.js";

test("guest capability is sent only in the dedicated order access header", () => {
  assert.deepEqual(createOrderAccessConfig(" guest-token "), {
    headers: { "X-Order-Access-Token": "guest-token" },
  });
  assert.deepEqual(createOrderAccessConfig(""), {});
  assert.deepEqual(createOrderAccessConfig(null), {});
});
