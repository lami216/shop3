import assert from "node:assert/strict";
import test from "node:test";

import {
  createOrderAccessCredential,
  isOrderAccessAllowed,
} from "../backend/security/orderAccess.js";

test("owner can access an order without a guest capability", () => {
  const order = { user: "user-1", guestAccessTokenHash: "unused" };
  const req = { user: { _id: "user-1", role: "customer" }, headers: {} };

  assert.equal(isOrderAccessAllowed(req, order), true);
});

test("another authenticated user cannot access an order", () => {
  const order = { user: "user-1", guestAccessTokenHash: "unused" };
  const req = { user: { _id: "user-2", role: "customer" }, headers: {} };

  assert.equal(isOrderAccessAllowed(req, order), false);
});

test("guest capability grants access without storing the raw token", () => {
  const credential = createOrderAccessCredential();
  const order = { user: null, guestAccessTokenHash: credential.tokenHash };
  const req = {
    headers: { "x-order-access-token": credential.token },
  };

  assert.equal(credential.token.length >= 43, true);
  assert.notEqual(credential.tokenHash, credential.token);
  assert.equal(isOrderAccessAllowed(req, order), true);
});

test("wrong guest capability is rejected", () => {
  const credential = createOrderAccessCredential();
  const order = { user: null, guestAccessTokenHash: credential.tokenHash };
  const req = { headers: { "x-order-access-token": "wrong-token" } };

  assert.equal(isOrderAccessAllowed(req, order), false);
});
