import InventoryBatch from "../models/inventoryBatch.model.js";
import InventoryReservation from "../models/inventoryReservation.model.js";

export const getInventorySummaries = async (productIds = []) => {
  if (!productIds.length) return new Map();

  const [batchAgg, reservedAgg] = await Promise.all([
    InventoryBatch.aggregate([
      { $match: { product: { $in: productIds } } },
      { $group: { _id: "$product", totalQuantity: { $sum: "$remainingQuantity" } } },
    ]),
    InventoryReservation.aggregate([
      { $match: { product: { $in: productIds }, status: "ACTIVE", expiresAt: { $gt: new Date() } } },
      { $group: { _id: "$product", reservedQuantity: { $sum: "$quantity" } } },
    ]),
  ]);

  const reservedMap = new Map(reservedAgg.map((x) => [x._id.toString(), x.reservedQuantity]));
  const map = new Map();
  for (const batch of batchAgg) {
    const key = batch._id.toString();
    const reserved = reservedMap.get(key) || 0;
    const total = batch.totalQuantity || 0;
    map.set(key, {
      totalQuantity: total,
      reservedQuantity: reserved,
      availableQuantity: Math.max(total - reserved, 0),
    });
  }

  for (const [key, reserved] of reservedMap.entries()) {
    if (!map.has(key)) {
      map.set(key, { totalQuantity: 0, reservedQuantity: reserved, availableQuantity: 0 });
    }
  }

  return map;
};

export const reserveInventoryForOrder = async (order, minutes = 15) => {
  const productIds = order.products.map((i) => i.product);
  const summaries = await getInventorySummaries(productIds);

  for (const item of order.products) {
    const summary = summaries.get(item.product.toString()) || { availableQuantity: 0 };
    if (summary.availableQuantity < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.product.toString()}`);
    }
  }

  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await InventoryReservation.insertMany(
    order.products.map((item) => ({
      order: order._id,
      product: item.product,
      quantity: item.quantity,
      expiresAt,
      status: "ACTIVE",
    }))
  );

  return expiresAt;
};

export const releaseOrderReservation = async (orderId) => {
  await InventoryReservation.updateMany({ order: orderId, status: "ACTIVE" }, { status: "RELEASED" });
};

export const consumeOrderReservation = async (orderId) => {
  await InventoryReservation.updateMany({ order: orderId, status: "ACTIVE" }, { status: "CONSUMED" });
};

export const deductInventoryFIFO = async (order) => {
  const deductions = [];

  for (const item of order.products) {
    let needed = item.quantity;
    const batches = await InventoryBatch.find({ product: item.product, remainingQuantity: { $gt: 0 } }).sort({ createdAt: 1 });
    let lineCost = 0;

    for (const batch of batches) {
      if (needed <= 0) break;
      const taken = Math.min(batch.remainingQuantity, needed);
      batch.remainingQuantity -= taken;
      await batch.save();
      needed -= taken;
      lineCost += taken * batch.purchasePrice;
    }

    if (needed > 0) {
      throw new Error(`FIFO stock error for product ${item.product.toString()}`);
    }

    deductions.push({ productId: item.product.toString(), lineCost });
  }

  return deductions;
};
