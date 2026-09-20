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
