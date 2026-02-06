import Order from "../models/order.model.js";
import sendTelegramMessage from "./telegram.service.js";
import { releaseOrderReservation } from "./inventory.service.js";
import { processLowInventoryAlerts } from "./inventoryAlerts.service.js";

let started = false;

const processOrderLifecycle = async () => {
  const now = new Date();

  const expiredOrders = await Order.find({ status: "PENDING_PAYMENT", reservationExpiresAt: { $lte: now } });
  for (const order of expiredOrders) {
    order.status = "EXPIRED";
    await order.save();
    await releaseOrderReservation(order._id);
  }

  if (now.getHours() === 23 && now.getMinutes() >= 50) {
    const pending = await Order.countDocuments({ status: "UNDER_REVIEW" });
    if (pending > 0) {
      await sendTelegramMessage(`${pending} UNDER_REVIEW orders pending before midnight`);
    }
  }

  await processLowInventoryAlerts();
};

export const startOrderLifecycleJobs = () => {
  if (started) return;
  started = true;
  setInterval(() => {
    processOrderLifecycle().catch((error) => console.log("order lifecycle job failed", error.message));
  }, 60 * 1000);
};
