import InventoryBatch from "../models/inventoryBatch.model.js";
import InventoryReservation from "../models/inventoryReservation.model.js";
import sendTelegramMessage from "./telegram.service.js";

let lastSentAt = 0;

export const processLowInventoryAlerts = async () => {
  const now = Date.now();
  if (now - lastSentAt < 30 * 60 * 1000) return;

  const totals = await InventoryBatch.aggregate([
    { $group: { _id: "$product", total: { $sum: "$remainingQuantity" } } },
  ]);
  const reserved = await InventoryReservation.aggregate([
    { $match: { status: "ACTIVE", expiresAt: { $gt: new Date() } } },
    { $group: { _id: "$product", reserved: { $sum: "$quantity" } } },
  ]);

  const reservedMap = new Map(reserved.map((x) => [x._id.toString(), x.reserved]));
  const lows = totals.filter((x) => (x.total - (reservedMap.get(x._id.toString()) || 0)) <= 3);
  if (lows.length) {
    lastSentAt = now;
    await sendTelegramMessage(`Low inventory alert for ${lows.length} products`);
  }
};
