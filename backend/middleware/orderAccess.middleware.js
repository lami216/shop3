import { isOrderAccessAllowed } from "../security/orderAccess.js";

export const createRequireOrderAccess = (loadOrder, { logger = console } = {}) => async (req, res, next) => {
  try {
    const order = await loadOrder(req);
    if (!order || !isOrderAccessAllowed(req, order)) {
      return res.status(404).json({ message: "Order not found" });
    }

    req.order = order;
    return next();
  } catch (error) {
    logger.error("Failed to authorize order access", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
