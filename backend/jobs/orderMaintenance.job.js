import Order from "../models/order.model.js";
import { releaseReservation } from "../services/inventory.service.js";
import { sendTelegramMessage } from "../services/telegram.service.js";

const getRequirements = (order) => {
	const map = new Map();
	for (const item of order.products) {
		for (const breakdown of item.reservationBreakdown || []) {
			const key = String(breakdown.product);
			map.set(key, (map.get(key) || 0) + breakdown.quantity);
		}
	}
	return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
};

const shouldRunNoonPromotion = (now) => now.getHours() === 12 && now.getMinutes() < 5;
const shouldSendReminder = (now) => now.getHours() === 23 && now.getMinutes() >= 30;

export const runOrderMaintenance = async () => {
	const now = new Date();

	const expiredOrders = await Order.find({
		status: "PENDING_PAYMENT",
		reservedUntil: { $lte: now },
	});
	for (const order of expiredOrders) {
		await releaseReservation(getRequirements(order));
		order.status = "EXPIRED";
		order.reservationReleasedAt = now;
		await order.save();
	}

	if (shouldRunNoonPromotion(now)) {
		await Order.updateMany(
			{ status: "PAYMENT_SUBMITTED" },
			{ $set: { status: "NEEDS_MANUAL_REVIEW" } }
		);
	}

	if (shouldSendReminder(now)) {
		const reviewOrders = await Order.find({
			status: { $in: ["PAYMENT_SUBMITTED", "NEEDS_MANUAL_REVIEW"] },
			reviewReminderSentAt: { $exists: false },
		});
		if (reviewOrders.length > 0) {
			await sendTelegramMessage(`⏰ Pending manual reviews before midnight: ${reviewOrders.length} order(s).`);
			await Order.updateMany(
			{ _id: { $in: reviewOrders.map((o) => o._id) } },
			{ $set: { reviewReminderSentAt: now } }
			);
		}
	}
};

export const startOrderMaintenanceJob = () => {
	runOrderMaintenance().catch((error) => {
		console.error("Order maintenance startup run failed", error.message);
	});

	setInterval(() => {
		runOrderMaintenance().catch((error) => {
			console.error("Order maintenance run failed", error.message);
		});
	}, 60 * 1000);
};
