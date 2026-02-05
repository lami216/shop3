import Order from "../models/order.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import Product from "../models/product.model.js";
import {
	assertStockAvailability,
	consumeReservedInventoryFIFO,
	releaseReservation,
	reserveInventory,
} from "../services/inventory.service.js";
import {
	ORDER_RESERVATION_MINUTES,
	expandOrderItemsToInventoryRequirements,
	generateOrderNumber,
	generateTrackingCode,
} from "../services/order.service.js";
import { sendTelegramMessage } from "../services/telegram.service.js";

const getReservationBreakdownRequirements = (order) => {
	const requirementsMap = new Map();
	for (const item of order.products) {
		for (const breakdown of item.reservationBreakdown || []) {
			const key = String(breakdown.product);
			requirementsMap.set(key, (requirementsMap.get(key) || 0) + breakdown.quantity);
		}
	}
	return [...requirementsMap.entries()].map(([productId, quantity]) => ({ productId, quantity }));
};

export const createOrder = async (req, res) => {
	try {
		const { items = [], paymentMethodCode } = req.body;
		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: "Order items are required" });
		}

		const normalizedInputItems = [];
		for (const item of items) {
			if (item.itemType === "BUNDLE") {
				normalizedInputItems.push({ itemType: "BUNDLE", bundleId: item.bundleId, quantity: Number(item.quantity) || 1 });
				continue;
			}
			const product = await Product.findById(item.productId || item.id);
			if (!product) {
				return res.status(404).json({ message: "Product not found" });
			}
			normalizedInputItems.push({
				itemType: "PRODUCT",
				productId: product._id,
				name: product.name,
				quantity: Number(item.quantity) || 1,
				price: Number(item.price ?? product.discountedPrice ?? product.price),
			});
		}

		const { requirements, normalizedItems } = await expandOrderItemsToInventoryRequirements(normalizedInputItems);
		await assertStockAvailability(requirements);
		await reserveInventory(requirements);

		const paymentMethod = paymentMethodCode
			? await PaymentMethod.findOne({ code: paymentMethodCode.toUpperCase(), isActive: true })
			: null;

		const totalAmount = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
		const reservedUntil = new Date(Date.now() + ORDER_RESERVATION_MINUTES * 60 * 1000);

		const order = await Order.create({
			user: req.user._id,
			orderNumber: generateOrderNumber(),
			trackingCode: generateTrackingCode(),
			products: normalizedItems,
			totalAmount,
			status: "PENDING_PAYMENT",
			reservedUntil,
			paymentMethod: paymentMethod?._id,
		});

		return res.status(201).json(order);
	} catch (error) {
		console.error("Error createOrder", error.message);
		return res.status(500).json({ message: error.message || "Failed to create order" });
	}
};

export const submitPaymentProof = async (req, res) => {
	try {
		const { orderId } = req.params;
		const { paymentProofImage, senderAccount } = req.body;
		if (!paymentProofImage || !senderAccount) {
			return res.status(400).json({ message: "paymentProofImage and senderAccount are required" });
		}

		const order = await Order.findOne({ _id: orderId, user: req.user._id });
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}
		if (!["PENDING_PAYMENT", "PAYMENT_SUBMITTED", "NEEDS_MANUAL_REVIEW"].includes(order.status)) {
			return res.status(400).json({ message: "Order is not eligible for payment submission" });
		}

		order.paymentProofImage = paymentProofImage;
		order.senderAccount = senderAccount;
		order.status = "PAYMENT_SUBMITTED";
		order.reservedUntil = null;
		await order.save();

		await sendTelegramMessage(`💳 Payment submitted for ${order.orderNumber} (${order.totalAmount})`);

		return res.json(order);
	} catch (error) {
		console.error("Error submitPaymentProof", error.message);
		return res.status(500).json({ message: "Failed to submit payment proof" });
	}
};

export const getMyOrders = async (req, res) => {
	const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
	return res.json(orders);
};

export const getOrderByTracking = async (req, res) => {
	const { trackingCode } = req.params;
	const order = await Order.findOne({ trackingCode }).select("orderNumber trackingCode status totalAmount createdAt reservedUntil paymentMethod paymentProofImage");
	if (!order) {
		return res.status(404).json({ message: "Order not found" });
	}
	return res.json(order);
};

export const approveOrder = async (req, res) => {
	try {
		const order = await Order.findById(req.params.orderId);
		if (!order) return res.status(404).json({ message: "Order not found" });
		if (!["PAYMENT_SUBMITTED", "NEEDS_MANUAL_REVIEW"].includes(order.status)) {
			return res.status(400).json({ message: "Order is not awaiting manual approval" });
		}

		const requirements = getReservationBreakdownRequirements(order);
		const costBreakdown = await consumeReservedInventoryFIFO(requirements);
		const totalCost = costBreakdown.reduce((sum, line) => sum + line.lineCost, 0);
		order.costBreakdown = costBreakdown;
		order.totalCost = totalCost;
		order.profit = order.totalAmount - totalCost;
		order.status = "APPROVED";
		order.approvedAt = new Date();
		order.approvedBy = req.user._id;
		await order.save();

		return res.json(order);
	} catch (error) {
		console.error("Error approveOrder", error.message);
		return res.status(500).json({ message: error.message || "Failed to approve order" });
	}
};

export const rejectOrder = async (req, res) => {
	try {
		const order = await Order.findById(req.params.orderId);
		if (!order) return res.status(404).json({ message: "Order not found" });
		if (!["PENDING_PAYMENT", "PAYMENT_SUBMITTED", "NEEDS_MANUAL_REVIEW"].includes(order.status)) {
			return res.status(400).json({ message: "Order cannot be rejected" });
		}

		const requirements = getReservationBreakdownRequirements(order);
		await releaseReservation(requirements);

		order.status = "REJECTED";
		order.reservationReleasedAt = new Date();
		await order.save();

		return res.json(order);
	} catch (error) {
		console.error("Error rejectOrder", error.message);
		return res.status(500).json({ message: "Failed to reject order" });
	}
};

export const getOrderForUser = async (req, res) => {
	const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
	if (!order) return res.status(404).json({ message: "Order not found" });
	return res.json(order);
};
