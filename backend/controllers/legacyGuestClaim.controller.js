import {
  consumeLegacyGuestClaim,
  issueLegacyGuestClaim,
} from "../services/legacyGuestClaim.service.js";

export const createLegacyGuestClaimHandlers = ({ OrderModel, now = () => new Date() }) => ({
  issue: async (req, res) => {
    try {
      const issued = await issueLegacyGuestClaim({
        OrderModel,
        orderId: req.params.id,
        now: now(),
      });
      if (!issued) {
        return res.status(404).json({ message: "Order not found" });
      }

      const claimPath = `/claim-legacy-order/${encodeURIComponent(String(issued.order._id))}#token=${encodeURIComponent(issued.claimToken)}`;
      return res.status(201).json({
        claimToken: issued.claimToken,
        claimPath,
        expiresAt: issued.expiresAt,
      });
    } catch (_error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  consume: async (req, res) => {
    try {
      const claimed = await consumeLegacyGuestClaim({
        OrderModel,
        orderId: req.params.id,
        claimToken: req.body?.token,
        now: now(),
      });
      if (!claimed) {
        return res.status(404).json({ message: "Claim link is invalid or expired" });
      }

      return res.json(claimed);
    } catch (_error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
});
