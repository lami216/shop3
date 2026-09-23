import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  LEGACY_GUEST_CLAIM_TTL_MS,
  consumeLegacyGuestClaim,
  issueLegacyGuestClaim,
} from "../backend/services/legacyGuestClaim.service.js";

const fixedNow = new Date("2026-01-01T00:00:00.000Z");

const createIssuanceModel = ({ result = { _id: "order-1", trackingCode: "TRK-legacy" } } = {}) => {
  const calls = [];
  return {
    calls,
    async findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return result;
    },
  };
};

test("admin issuance stores only a claim hash with an exact 72-hour expiry", async () => {
  const OrderModel = createIssuanceModel();

  const issued = await issueLegacyGuestClaim({
    OrderModel,
    orderId: "order-1",
    now: fixedNow,
  });

  assert.equal(LEGACY_GUEST_CLAIM_TTL_MS, 72 * 60 * 60 * 1000);
  assert.equal(typeof issued.claimToken, "string");
  assert.equal(issued.claimToken.length >= 43, true);
  assert.equal(issued.expiresAt.toISOString(), "2026-01-04T00:00:00.000Z");

  const [{ filter, update, options }] = OrderModel.calls;
  assert.deepEqual(filter, {
    _id: "order-1",
    user: null,
    guestAccessTokenHash: { $exists: false },
  });
  assert.equal(update.$set["legacyGuestClaim.tokenHash"], crypto.createHash("sha256").update(issued.claimToken).digest("hex"));
  assert.equal(update.$set["legacyGuestClaim.expiresAt"].toISOString(), "2026-01-04T00:00:00.000Z");
  assert.equal(update.$set["legacyGuestClaim.consumedAt"], null);
  assert.equal(JSON.stringify(update).includes(issued.claimToken), false);
  assert.deepEqual(options, { new: true });
});

test("issuance refuses orders that are not unclaimed legacy guest orders", async () => {
  const OrderModel = createIssuanceModel({ result: null });

  const issued = await issueLegacyGuestClaim({
    OrderModel,
    orderId: "owned-or-capable-order",
    now: fixedNow,
  });

  assert.equal(issued, null);
});

test("a valid claim is atomically consumed into a normal guest capability", async () => {
  const calls = [];
  const OrderModel = {
    async findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return { _id: "order-1", trackingCode: "TRK-legacy" };
    },
  };

  const result = await consumeLegacyGuestClaim({
    OrderModel,
    orderId: "order-1",
    claimToken: "one-time-claim-token",
    now: fixedNow,
  });

  assert.equal(result.orderId, "order-1");
  assert.equal(result.trackingCode, "TRK-legacy");
  assert.equal(typeof result.guestAccessToken, "string");
  assert.equal(result.guestAccessToken.length >= 43, true);

  const [{ filter, update, options }] = calls;
  assert.deepEqual(filter, {
    _id: "order-1",
    user: null,
    guestAccessTokenHash: { $exists: false },
    "legacyGuestClaim.tokenHash": crypto.createHash("sha256").update("one-time-claim-token").digest("hex"),
    "legacyGuestClaim.expiresAt": { $gt: fixedNow },
    "legacyGuestClaim.consumedAt": null,
  });
  assert.equal(update.$set.guestAccessTokenHash, crypto.createHash("sha256").update(result.guestAccessToken).digest("hex"));
  assert.equal(update.$set["legacyGuestClaim.consumedAt"], fixedNow);
  assert.equal(JSON.stringify(update).includes(result.guestAccessToken), false);
  assert.deepEqual(options, { new: true });
});

for (const scenario of ["replayed", "expired", "wrong-order"]) {
  test(`${scenario} legacy claim tokens are rejected`, async () => {
    let attempts = 0;
    const OrderModel = {
      async findOneAndUpdate() {
        attempts += 1;
        return null;
      },
    };

    const result = await consumeLegacyGuestClaim({
      OrderModel,
      orderId: scenario === "wrong-order" ? "order-2" : "order-1",
      claimToken: "unusable-claim-token",
      now: fixedNow,
    });

    assert.equal(result, null);
    assert.equal(attempts, 1);
  });
}
