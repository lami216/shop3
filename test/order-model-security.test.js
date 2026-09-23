import assert from "node:assert/strict";
import test from "node:test";

import Order from "../backend/models/order.model.js";

test("guest order capability hash is hidden from normal queries and JSON", () => {
  const path = Order.schema.path("guestAccessTokenHash");
  assert.equal(path.options.select, false);

  const order = new Order({
    orderNumber: "ORD-1",
    trackingCode: "TRK-1",
    products: [],
    totalAmount: 1,
    customer: { name: "Guest", phone: "00000000", address: "Address" },
    guestAccessTokenHash: "sensitive-hash",
  });
  assert.equal(order.toJSON().guestAccessTokenHash, undefined);
});

test("orders without recovery attempts do not expose claim metadata", () => {
  const order = new Order({
    orderNumber: "ORD-current",
    trackingCode: "TRK-current",
    products: [],
    totalAmount: 1,
    customer: { name: "Guest", phone: "00000000", address: "Address" },
  });

  assert.equal(order.toJSON().legacyGuestClaim, undefined);
});

test("legacy guest claim secrets are hidden from normal queries and JSON", () => {
  const tokenPath = Order.schema.path("legacyGuestClaim.tokenHash");
  assert.equal(tokenPath.options.select, false);

  const order = new Order({
    orderNumber: "ORD-legacy",
    trackingCode: "TRK-legacy",
    products: [],
    totalAmount: 1,
    customer: { name: "Guest", phone: "00000000", address: "Address" },
    legacyGuestClaim: {
      tokenHash: "sensitive-claim-hash",
      expiresAt: new Date("2026-01-04T00:00:00.000Z"),
      consumedAt: null,
    },
  });

  assert.equal(order.toJSON().legacyGuestClaim.tokenHash, undefined);
  assert.equal(order.toJSON().legacyGuestClaim.expiresAt.toISOString(), "2026-01-04T00:00:00.000Z");
  assert.equal(order.toJSON().legacyGuestClaim.consumedAt, null);
});
