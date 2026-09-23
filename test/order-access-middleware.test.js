import assert from "node:assert/strict";
import test from "node:test";

import { createRequireOrderAccess } from "../backend/middleware/orderAccess.middleware.js";
import { createOrderAccessCredential } from "../backend/security/orderAccess.js";

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("order access middleware rejects a missing capability without leaking existence details", async () => {
  const credential = createOrderAccessCredential();
  const order = { _id: "order-1", user: null, guestAccessTokenHash: credential.tokenHash };
  const middleware = createRequireOrderAccess(async () => order);
  const req = { headers: {}, params: { id: "order-1" } };
  const res = makeResponse();
  let nextCalled = false;

  await middleware(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: "Order not found" });
  assert.equal(req.order, undefined);
});

test("order access middleware attaches the order for a valid guest capability", async () => {
  const credential = createOrderAccessCredential();
  const order = { _id: "order-1", user: null, guestAccessTokenHash: credential.tokenHash };
  const middleware = createRequireOrderAccess(async () => order);
  const req = { headers: { "x-order-access-token": credential.token } };
  const res = makeResponse();
  let nextCalled = false;

  await middleware(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.order, order);
  assert.equal(res.body, null);
});

test("order access middleware maps loader failures to a generic server error", async () => {
  const middleware = createRequireOrderAccess(
    async () => {
      throw new Error("database connection string and internals");
    },
    { logger: { error: () => {} } }
  );
  const req = { headers: {} };
  const res = makeResponse();

  await middleware(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: "Internal server error" });
});
