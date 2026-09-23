import crypto from "node:crypto";
import { createOrderAccessCredential } from "../security/orderAccess.js";

export const LEGACY_GUEST_CLAIM_TTL_MS = 72 * 60 * 60 * 1000;

export const issueLegacyGuestClaim = async ({ OrderModel, orderId, now = new Date() }) => {
  const claim = createOrderAccessCredential();
  const expiresAt = new Date(now.getTime() + LEGACY_GUEST_CLAIM_TTL_MS);
  const order = await OrderModel.findOneAndUpdate(
    {
      _id: orderId,
      user: null,
      guestAccessTokenHash: { $exists: false },
    },
    {
      $set: {
        "legacyGuestClaim.tokenHash": claim.tokenHash,
        "legacyGuestClaim.expiresAt": expiresAt,
        "legacyGuestClaim.consumedAt": null,
      },
    },
    { new: true }
  );

  if (!order) return null;
  return { order, claimToken: claim.token, expiresAt };
};

export const consumeLegacyGuestClaim = async ({ OrderModel, orderId, claimToken, now = new Date() }) => {
  if (typeof claimToken !== "string" || !claimToken) return null;

  const access = createOrderAccessCredential();
  const claimTokenHash = crypto.createHash("sha256").update(claimToken).digest("hex");
  const order = await OrderModel.findOneAndUpdate(
    {
      _id: orderId,
      user: null,
      guestAccessTokenHash: { $exists: false },
      "legacyGuestClaim.tokenHash": claimTokenHash,
      "legacyGuestClaim.expiresAt": { $gt: now },
      "legacyGuestClaim.consumedAt": null,
    },
    {
      $set: {
        guestAccessTokenHash: access.tokenHash,
        "legacyGuestClaim.consumedAt": now,
      },
    },
    { new: true }
  );

  if (!order) return null;
  return {
    orderId: String(order._id),
    trackingCode: order.trackingCode,
    guestAccessToken: access.token,
  };
};
