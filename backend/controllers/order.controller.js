import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import sendTelegramMessage from "../services/telegram.service.js";
import {
  consumeOrderReservation,
  deductInventoryFIFO,
  releaseOrderReservation,
  reserveInventoryForOrder,
} from "../services/inventory.service.js";

const randomCode = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Cart is empty" });

    const ids = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: ids } }).lean();
    const map = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = items.map((item) => {
      const p = map.get(item.productId);
      if (!p) throw new Error("Product missing");
      const price = p.isDiscounted && p.discountPercentage > 0 ? Number((p.price * (1 - p.discountPercentage / 100)).toFixed(2)) : p.price;
      return { product: p._id, quantity: item.quantity, price, lineRevenue: price * item.quantity };
    });

    const totalAmount = orderItems.reduce((sum, x) => sum + x.price * x.quantity, 0);
    const order = await Order.create({
      user: req.user?._id,
      customer: { name: customerName, phone, address },
      products: orderItems,
      totalAmount,
      orderNumber: randomCode("ORD-"),
      trackingCode: randomCode("TRK-"),
      status: "CREATED",
      source: "ONLINE",
    });

    res.status(201).json({ orderId: order._id, orderNumber: order.orderNumber, trackingCode: order.trackingCode, status: order.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderPaymentSession = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("products.product", "name image");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "CREATED") {
      const expiresAt = await reserveInventoryForOrder(order, 15);
      order.status = "AWAITING_PAYMENT";
      order.reservationStartedAt = new Date();
      order.reservationExpiresAt = expiresAt;
      await order.save();
    }

    const methods = await PaymentMethod.find({ isActive: true });
    res.json({ order, paymentMethods: methods });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const submitPaymentProof = async (req, res) => {
  try {
    const { paymentMethodId, paymentProofImage, senderAccount } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!paymentProofImage) return res.status(400).json({ message: "Payment proof is required" });
    if (!order.paymentMethod && !paymentMethodId) {
      return res.status(400).json({ message: "Payment method is required" });
    }
    if (!["AWAITING_PAYMENT", "NEEDS_MANUAL_REVIEW"].includes(order.status)) {
      return res.status(400).json({ message: "Order is not payable" });
    }

    const method = paymentMethodId ? await PaymentMethod.findById(paymentMethodId) : null;
    if (paymentMethodId && !method) return res.status(400).json({ message: "Payment method invalid" });

    if (method?._id) {
      order.paymentMethod = method._id;
    }
    order.paymentProofImage = paymentProofImage;
    order.paymentSenderAccount = senderAccount || "";
    order.status = "PAYMENT_SUBMITTED";
    await order.save();

    await sendTelegramMessage(`PAYMENT_SUBMITTED ${order.orderNumber} amount ${order.totalAmount}`);
    res.json({ success: true, status: order.status, orderNumber: order.orderNumber, trackingCode: order.trackingCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminOrders = async (_req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 }).populate("products.product", "name").populate("paymentMethod");
  res.json({ orders });
};

export const approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["PAYMENT_SUBMITTED", "NEEDS_MANUAL_REVIEW"].includes(order.status)) {
      return res.status(400).json({ message: "Order status invalid" });
    }
    if (order.source !== "POS" && !order.paymentProofImage) {
      return res.status(400).json({ message: "Payment proof is required before approval" });
    }

    const deductions = await deductInventoryFIFO(order);
    const costMap = new Map(deductions.map((d) => [d.productId, d.lineCost]));

    let totalCost = 0;
    order.products = order.products.map((item) => {
      const lineCost = costMap.get(item.product.toString()) || 0;
      const lineRevenue = item.price * item.quantity;
      const lineProfit = lineRevenue - lineCost;
      totalCost += lineCost;
      return { ...item.toObject(), lineCost, lineRevenue, lineProfit, unitCost: lineCost / item.quantity };
    });

    order.totalCost = totalCost;
    order.totalProfit = order.totalAmount - totalCost;
    order.status = "APPROVED";
    order.approvedAt = new Date();
    order.reviewedAt = new Date();
    await order.save();
    await consumeOrderReservation(order._id);

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!["PAYMENT_SUBMITTED", "NEEDS_MANUAL_REVIEW", "AWAITING_PAYMENT"].includes(order.status)) {
    return res.status(400).json({ message: "Order status invalid" });
  }

  order.status = "REJECTED";
  order.rejectedAt = new Date();
  order.reviewedAt = new Date();
  await order.save();
  await releaseOrderReservation(order._id);
  res.json({ success: true, order });
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
};

export const getOrderByTracking = async (req, res) => {
  const order = await Order.findOne({ trackingCode: req.params.trackingCode }).populate("paymentMethod", "name accountNumber");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ order });
};

export const createPosInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { customerName, phone, address, paymentMethodId, lines } = req.body;
    if (!Array.isArray(lines) || !lines.length) return res.status(400).json({ message: "Invoice lines are required" });

    const ids = lines.map((line) => line.productId);
    const products = await Product.find({ _id: { $in: ids } }).select("name").lean();
    const productMap = new Map(products.map((x) => [x._id.toString(), x]));

    const method = paymentMethodId ? await PaymentMethod.findById(paymentMethodId).lean() : null;
    if (paymentMethodId && !method) return res.status(400).json({ message: "Payment method invalid" });

    const orderItems = lines.map((line) => {
      const product = productMap.get(line.productId);
      if (!product) throw new Error("Product missing");
      const quantity = Number(line.quantity);
      const price = Number(line.price);
      if (!quantity || quantity <= 0) throw new Error("Quantity must be greater than zero");
      if (Number.isNaN(price) || price < 0) throw new Error("Price is invalid");
      return {
        product: line.productId,
        quantity,
        price,
        lineRevenue: quantity * price,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.lineRevenue, 0);

    let order;
    await session.withTransaction(async () => {
      [order] = await Order.create(
        [
          {
            user: req.user?._id,
            customer: {
              name: customerName?.trim() || "Boutique walk-in",
              phone: phone?.trim() || "N/A",
              address: address?.trim() || "Boutique POS",
            },
            products: orderItems,
            totalAmount,
            orderNumber: randomCode("POS-"),
            trackingCode: randomCode("TRK-"),
            paymentMethod: method?._id,
            paymentProofImage: "POS_MANUAL",
            status: "PAYMENT_SUBMITTED",
            source: "POS",
            reviewedAt: new Date(),
          },
        ],
        { session }
      );
    });

    const deductions = await deductInventoryFIFO(order);
    const costMap = new Map(deductions.map((d) => [d.productId, d.lineCost]));

    let totalCost = 0;
    order.products = order.products.map((item) => {
      const lineCost = costMap.get(item.product.toString()) || 0;
      const lineRevenue = item.price * item.quantity;
      const lineProfit = lineRevenue - lineCost;
      totalCost += lineCost;
      return { ...item.toObject(), lineCost, lineRevenue, lineProfit, unitCost: lineCost / item.quantity };
    });

    order.totalCost = totalCost;
    order.totalProfit = order.totalAmount - totalCost;
    order.status = "APPROVED";
    order.approvedAt = new Date();
    order.reviewedAt = new Date();
    await order.save();

    res.status(201).json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      trackingCode: order.trackingCode,
      status: order.status,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};
