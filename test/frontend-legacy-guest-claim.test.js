import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLegacyGuestClaimUrl,
  consumeLegacyGuestOrderClaim,
  getLegacyClaimTokenFromHash,
  removeLegacyClaimTokenFromAddress,
} from "../frontend/src/lib/legacyGuestClaim.js";

test("claim landing removes the raw fragment before exchanging it", () => {
  const calls = [];
  removeLegacyClaimTokenFromAddress(
    { state: { key: "state" }, replaceState: (...args) => calls.push(args) },
    { pathname: "/claim-legacy-order/order-1", search: "" }
  );
  assert.deepEqual(calls, [[{ key: "state" }, "", "/claim-legacy-order/order-1"]]);
});

test("claim tokens are read from a URL fragment that is not sent to servers", () => {
  assert.equal(getLegacyClaimTokenFromHash("#token=one-time-secret"), "one-time-secret");
  assert.equal(getLegacyClaimTokenFromHash(""), null);
});

test("admin claim paths are converted into shareable same-origin links", () => {
  assert.equal(
    buildLegacyGuestClaimUrl("https://alsahib.example/", "/claim-legacy-order/order-1#token=secret"),
    "https://alsahib.example/claim-legacy-order/order-1#token=secret"
  );
});

test("claim landing exchanges the one-time token and persists the normal guest capability", async () => {
  const requests = [];
  const persisted = [];
  const apiClient = {
    async post(path, body) {
      requests.push({ path, body });
      return {
        orderId: "order-1",
        trackingCode: "TRK-legacy",
        guestAccessToken: "normal-guest-capability",
      };
    },
  };

  const result = await consumeLegacyGuestOrderClaim({
    apiClient,
    orderId: "order-1",
    claimToken: "one-time-token",
    persistGuestOrder: (trackingCode, accessToken) => persisted.push({ trackingCode, accessToken }),
  });

  assert.deepEqual(requests, [{
    path: "/orders/order-1/legacy-guest-claim",
    body: { token: "one-time-token" },
  }]);
  assert.deepEqual(persisted, [{
    trackingCode: "TRK-legacy",
    accessToken: "normal-guest-capability",
  }]);
  assert.deepEqual(result, {
    orderId: "order-1",
    trackingCode: "TRK-legacy",
    guestAccessToken: "normal-guest-capability",
  });
});
