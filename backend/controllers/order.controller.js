import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Counter from "../models/counter.model.js";
import Product from "../models/product.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import sendTelegramMessage from "../services/telegram.service.js";
import { uploadImage } from "../lib/imagekit.js";
import {
  consumeOrderReservation,
  deductInventoryFIFO,
  getInventorySummaries,
  hasActiveReservation,
  releaseOrderReservation,
  reserveInventoryForOrder,
} from "../services/inventory.service.js";

const randomCode = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const REVIEWABLE_STATUSES = ["UNDER_REVIEW", "pending_payment", "PENDING_PAYMENT"];
const PENDING_PAYMENT_STATUSES = ["PENDING_PAYMENT", "pending_payment"];

const isReservationActive = (reservationExpiresAt) => {
  if (!reservationExpiresAt) return false;
  return new Date(reservationExpiresAt).getTime() > Date.now();
};


const normalizeOrderLineType = (value) => {
  if (typeof value !== "string") return "full";
  const normalized = value.trim().toLowerCase();
  return normalized === "portion" ? "portion" : "full";
};

const resolveOrderItemForProduct = (product, line) => {
  const quantity = Number(line.quantity ?? line.qty);
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const lineType = product.hasPortions ? normalizeOrderLineType(line.type || (line.selectedPortionSizeMl ? "portion" : "full")) : "full";

  if (lineType === "portion") {
    const portions = (Array.isArray(product.portions) ? product.portions : [])
      .map((portion) => ({ size_ml: Number(portion?.size_ml || 0), price: Number(portion?.price || 0) }))
      .filter((portion) => portion.size_ml > 0)
      .sort((a, b) => a.size_ml - b.size_ml);

    if (!portions.length) {
      throw new Error("Portion options missing");
    }

    const selectedSize = Number(line.selectedPortionSizeMl || line.portionSizeMl || portions[0].size_ml);
    const selectedPortion = portions.find((portion) => Number(portion.size_ml) === selectedSize);

    if (!selectedPortion) {
      throw new Error("Selected portion is invalid");
    }

    const price = Number(selectedPortion.price || 0);
    return {
      product: product._id,
      quantity,
      type: "portion",
      selectedPortionSizeMl: Number(selectedPortion.size_ml),
      price,
      lineRevenue: price * quantity,
    };
  }

  const basePrice = product.isDiscounted && product.discountPercentage > 0
    ? Number((product.price * (1 - product.discountPercentage / 100)).toFixed(2))
    : Number(product.price || 0);

  return {
    product: product._id,
    quantity,
    type: "full",
    selectedPortionSizeMl: 0,
    price: basePrice,
    lineRevenue: basePrice * quantity,
  };
};
const getNextOrderNumber = async (session) => {
  await Counter.updateOne(
    { _id: "orderNumber" },
    { $setOnInsert: { seq: 35 } },
    { upsert: true, session }
  );

  const counter = await Counter.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  return {
    orderNumberSeq: counter.seq,
    orderNumberDisplay: String(counter.seq).padStart(5, "0"),
  };
};


export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { customerName, phone, address, paymentMethodId, items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Cart is empty" });

    const ids = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: ids } }).lean();
    const map = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = items.map((item) => {
      const p = map.get(item.productId);
      if (!p) throw new Error("Product missing");
      return resolveOrderItemForProduct(p, item);
    });

    const productIds = orderItems.map((item) => item.product);
    const summaries = await getInventorySummaries(productIds);
    for (const item of orderItems) {
      const product = map.get(item.product.toString());
      if (item.type === "portion") {
        const requiredMl = Number(item.selectedPortionSizeMl || 0) * Number(item.quantity || 0);
        if (Number(product?.totalStockMl || 0) < requiredMl) {
          return res.status(400).json({ message: `Insufficient stock for ${product?.name || "selected product"}` });
        }
        continue;
      }

      const summary = summaries.get(item.product.toString()) || { availableQuantity: 0 };
      if (summary.availableQuantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product?.name || "selected product"}` });
      }
    }

    const totalAmount = orderItems.reduce((sum, x) => sum + x.price * x.quantity, 0);

    const activeMethods = await PaymentMethod.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    if (!activeMethods.length) return res.status(400).json({ message: "No payment methods available" });

    let selectedMethod = null;
    if (paymentMethodId) {
      selectedMethod = activeMethods.find((method) => method._id.toString() === String(paymentMethodId));
      if (!selectedMethod) return res.status(400).json({ message: "Payment method invalid" });
    } else {
      selectedMethod = activeMethods[0];
    }

    let order;
    await session.withTransaction(async () => {
      const orderNumber = await getNextOrderNumber(session);
      [order] = await Order.create(
        [
          {
            user: req.user?._id,
            customer: { name: customerName, phone, address },
            products: orderItems,
            totalAmount,
            orderNumber: randomCode("ORD-"),
            orderNumberSeq: orderNumber.orderNumberSeq,
            orderNumberDisplay: orderNumber.orderNumberDisplay,
            trackingCode: randomCode("TRK-"),
            status: "PENDING_PAYMENT",
            source: "ONLINE",
            paymentMethod: selectedMethod._id,
          },
        ],
        { session }
      );

      const expiresAt = await reserveInventoryForOrder(order, 15, session);
      order.reservationStartedAt = new Date();
      order.reservationExpiresAt = expiresAt;
      await order.save({ session });
    });

    res.status(201).json({ orderId: order._id, orderNumber: order.orderNumber, trackingCode: order.trackingCode, status: order.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

export const getOrderPaymentSession = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("products.product", "name image")
      .populate("paymentMethod", "name accountNumber");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!PENDING_PAYMENT_STATUSES.includes(order.status)) {
      return res.status(400).json({ message: "Order is not payable" });
    }
    if (!isReservationActive(order.reservationExpiresAt)) {
      return res.status(400).json({ message: "Order is not payable" });
    }
    const hasReservation = await hasActiveReservation(order._id);
    if (!hasReservation) {
      return res.status(400).json({ message: "Order reservation missing" });
    }

    res.json({ order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getOrderPaymentSessionByTracking = async (req, res) => {
  try {
    const order = await Order.findOne({ trackingCode: req.params.trackingCode })
      .populate("products.product", "name image")
      .populate("paymentMethod", "name accountNumber");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "UNDER_REVIEW") {
      return res.status(400).json({ message: "Order is under review" });
    }
    if (!PENDING_PAYMENT_STATUSES.includes(order.status)) {
      return res.status(400).json({ message: "Order is not payable" });
    }
    if (!isReservationActive(order.reservationExpiresAt)) {
      return res.status(400).json({ message: "Order is not payable" });
    }
    const hasReservation = await hasActiveReservation(order._id);
    if (!hasReservation) {
      return res.status(400).json({ message: "Order reservation missing" });
    }

    res.json({ order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const submitPaymentProof = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!req.file) return res.status(400).json({ message: "Receipt image is required" });
    if (!order.paymentMethod && !paymentMethodId) {
      return res.status(400).json({ message: "Payment method is required" });
    }
    if (!PENDING_PAYMENT_STATUSES.includes(order.status)) {
      return res.status(400).json({ message: "Order is not payable" });
    }

    const methodQuery = paymentMethodId || order.paymentMethod;
    const method = methodQuery ? await PaymentMethod.findOne({ _id: methodQuery, isActive: true }) : null;
    if (methodQuery && !method) return res.status(400).json({ message: "Payment method invalid" });

    if (method?._id) {
      order.paymentMethod = method._id;
    }

    const receiptUpload = await uploadImage(req.file.buffer, "order-receipts");
    order.receiptImageUrl = receiptUpload.url;
    order.receiptSubmittedAt = new Date();
    order.status = "UNDER_REVIEW";
    await order.save();

    await sendTelegramMessage(`under_review ${order.orderNumber} amount ${order.totalAmount}`);
    res.json({ success: true, status: order.status, orderNumber: order.orderNumber, trackingCode: order.trackingCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminOrders = async (_req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate("products.product", "name")
    .populate("paymentMethod", "name accountNumber");
  res.json({ orders });
};

export const approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!REVIEWABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({ message: "Order status invalid" });
    }
    if (order.source !== "POS" && !order.receiptImageUrl) {
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

    const totalRevenue = Number(order.totalAmount) || 0;
    order.totalCost = totalCost;
    order.totalProfit = totalRevenue - totalCost;
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
  if (!REVIEWABLE_STATUSES.includes(order.status)) {
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
  const order = await Order.findOne({ trackingCode: req.params.trackingCode })
    .populate("paymentMethod", "name accountNumber")
    .populate("products.product", "name price image");
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (req.user && String(order.user || "") !== String(req.user._id)) {
    return res.status(403).json({ message: "Not allowed to view this order" });
  }

  res.json({ order });
};

export const getOrderDetailsByTracking = async (req, res) => {
  const order = await Order.findOne({ trackingCode: req.params.trackingCode })
    .populate("paymentMethod", "name accountNumber")
    .populate("products.product", "name price");

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (req.user && String(order.user || "") !== String(req.user._id)) {
    return res.status(403).json({ message: "Not allowed to view this order" });
  }

  res.json({ order });
};


export const claimGuestOrder = async (req, res) => {
  try {
    const { trackingCode, phone } = req.body;
    if (!trackingCode || !phone) {
      return res.status(400).json({ message: "trackingCode and phone are required" });
    }

    const order = await Order.findOne({ trackingCode: trackingCode.trim() });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user) return res.status(400).json({ message: "Order already linked to a user" });

    const normalizedInputPhone = String(phone).replace(/\D/g, "");
    const normalizedOrderPhone = String(order.customer?.phone || "").replace(/\D/g, "");
    if (!normalizedInputPhone || normalizedInputPhone !== normalizedOrderPhone) {
      return res.status(400).json({ message: "Phone does not match order owner" });
    }

    order.user = req.user._id;
    await order.save();

    res.json({ success: true, orderId: order._id, trackingCode: order.trackingCode, user: order.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPosInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { customerName, phone, address, paymentMethodId, lines, items } = req.body;
    const invoiceItems = Array.isArray(items) && items.length ? items : lines;
    if (!Array.isArray(invoiceItems) || !invoiceItems.length) return res.status(400).json({ message: "Invoice items are required" });
    if (!paymentMethodId) return res.status(400).json({ message: "Payment method is required" });

    const ids = invoiceItems.map((line) => line.productId);
    const products = await Product.find({ _id: { $in: ids } }).select("name price isDiscounted discountPercentage hasPortions portions totalStockMl").lean();
    const productMap = new Map(products.map((x) => [x._id.toString(), x]));

    const method = await PaymentMethod.findById(paymentMethodId).lean();
    if (!method) return res.status(400).json({ message: "Payment method invalid" });

    const orderItems = invoiceItems.map((line) => {
      const product = productMap.get(line.productId);
      if (!product) throw new Error("Product missing");
      const resolved = resolveOrderItemForProduct(product, line);
      const overridePrice = line.type === "full" ? Number(line.unitPrice ?? line.price) : Number.NaN;
      if (!Number.isNaN(overridePrice) && overridePrice >= 0 && resolved.type === "full") {
        resolved.price = overridePrice;
        resolved.lineRevenue = overridePrice * resolved.quantity;
      }
      return resolved;
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
            receiptImageUrl: "POS_MANUAL",
            status: "UNDER_REVIEW",
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

    const totalRevenue = Number(order.totalAmount) || 0;
    order.totalCost = totalCost;
    order.totalProfit = totalRevenue - totalCost;
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
