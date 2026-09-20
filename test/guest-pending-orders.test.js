import assert from "node:assert/strict";
import test from "node:test";

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  },
  dispatchEvent: () => {},
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};

const {
  addGuestPendingOrder,
  getGuestOrderAccessToken,
  getGuestPendingOrders,
  setGuestPendingOrders,
} = await import("../frontend/src/lib/guestPendingOrders.js");

test.beforeEach(() => storage.clear());

test("guest order capability is persisted with its tracking code", () => {
  addGuestPendingOrder("TRK-1", "capability-1");

  assert.deepEqual(getGuestPendingOrders().map(({ trackingCode, accessToken }) => ({ trackingCode, accessToken })), [
    { trackingCode: "TRK-1", accessToken: "capability-1" },
  ]);
  assert.equal(getGuestOrderAccessToken("TRK-1"), "capability-1");
});

test("entries without a capability are discarded instead of enabling public tracking", () => {
  setGuestPendingOrders([{ trackingCode: "TRK-legacy", createdAt: new Date().toISOString() }]);
  assert.deepEqual(getGuestPendingOrders(), []);
});
