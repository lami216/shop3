import InventoryBatch from "../models/inventoryBatch.model.js";
import InventoryReservation from "../models/inventoryReservation.model.js";
import sendTelegramMessage from "./telegram.service.js";

let lastSentAt = 0;

export const processLowInventoryAlerts = async () => {
  const now = Date.now();
  if (now - lastSentAt < 30 * 60 * 1000) return;

  const totals = await InventoryBatch.aggregate([
    {
      $group: {
        _id: "$product",
        total: { $sum: "$quantity" },
        remaining: { $sum: "$remainingQuantity" },
      },
    },
  ]);
  const reserved = await InventoryReservation.aggregate([
    { $match: { status: "ACTIVE" } },
    { $group: { _id: "$product", reserved: { $sum: "$quantity" } } },
  ]);

  const reservedMap = new Map(reserved.map((x) => [x._id.toString(), x.reserved]));
  const lows = totals.filter((x) => {
    const reservedQty = reservedMap.get(x._id.toString()) || 0;
    const soldQty = Math.max((x.total || 0) - (x.remaining || 0), 0);
    const availableQty = (x.total || 0) - reservedQty - soldQty;
    return availableQty <= 3;
  });
  if (lows.length) {
    lastSentAt = now;
    await sendTelegramMessage(`Low inventory alert for ${lows.length} products`);
  }
};
