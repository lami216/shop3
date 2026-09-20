import assert from "node:assert/strict";
import test from "node:test";

import {
  createOrderAccessCredential,
  createOrderAccessForUser,
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

test("guest order creation stores only a hash and returns the raw capability once", () => {
  const access = createOrderAccessForUser(null);

  assert.equal(typeof access.responseToken, "string");
  assert.equal(access.responseToken.length >= 43, true);
  assert.equal(typeof access.orderFields.guestAccessTokenHash, "string");
  assert.notEqual(access.orderFields.guestAccessTokenHash, access.responseToken);
});

test("authenticated order creation does not issue a guest capability", () => {
  assert.deepEqual(createOrderAccessForUser({ _id: "user-1" }), {
    responseToken: undefined,
    orderFields: {},
  });
});

test("wrong guest capability is rejected", () => {
  const credential = createOrderAccessCredential();
  const order = { user: null, guestAccessTokenHash: credential.tokenHash };
  const req = { headers: { "x-order-access-token": "wrong-token" } };

  assert.equal(isOrderAccessAllowed(req, order), false);
});
