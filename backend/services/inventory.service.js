import InventoryBatch from "../models/inventoryBatch.model.js";
import InventoryReservation from "../models/inventoryReservation.model.js";
import Product from "../models/product.model.js";

export const getInventorySummaries = async (productIds = []) => {
  if (!productIds.length) return new Map();

  const [batchAgg, reservedAgg] = await Promise.all([
    InventoryBatch.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" },
          remainingQuantity: { $sum: "$remainingQuantity" },
        },
      },
    ]),
    InventoryReservation.aggregate([
      { $match: { product: { $in: productIds }, status: "ACTIVE" } },
      { $group: { _id: "$product", reservedQuantity: { $sum: "$quantity" } } },
    ]),
  ]);

  const reservedMap = new Map(reservedAgg.map((x) => [x._id.toString(), x.reservedQuantity]));
  const map = new Map();
  for (const batch of batchAgg) {
    const key = batch._id.toString();
    const reserved = reservedMap.get(key) || 0;
    const total = batch.totalQuantity || 0;
    const remaining = batch.remainingQuantity || 0;
    const sold = Math.max(total - remaining, 0);
    map.set(key, {
      totalQuantity: total,
      soldQuantity: sold,
      reservedQuantity: reserved,
      availableQuantity: Math.max(total - reserved - sold, 0),
    });
  }

  for (const [key, reserved] of reservedMap.entries()) {
    if (!map.has(key)) {
      map.set(key, { totalQuantity: 0, soldQuantity: 0, reservedQuantity: reserved, availableQuantity: 0 });
    }
  }

  return map;
};

export const reserveInventoryForOrder = async (order, minutes = 15, session = null) => {
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
    })),
    { session }
  );

  return expiresAt;
};

export const releaseOrderReservation = async (orderId) => {
  await InventoryReservation.updateMany({ order: orderId, status: "ACTIVE" }, { status: "RELEASED" });
};

export const consumeOrderReservation = async (orderId) => {
  await InventoryReservation.updateMany({ order: orderId, status: "ACTIVE" }, { status: "CONSUMED" });
};

export const hasActiveReservation = async (orderId) => {
  const now = new Date();
  return InventoryReservation.exists({ order: orderId, status: "ACTIVE", expiresAt: { $gt: now } });
};

export const deductInventoryFIFO = async (order) => {
  const deductions = [];

  for (const item of order.products) {
    const product = await Product.findById(item.product).select("hasPortions totalStockMl portionCost");
    if (!product) {
      throw new Error(`Product missing ${item.product.toString()}`);
    }

    if (product.hasPortions) {
      const portionSize = Number(item.selectedPortionSizeMl || 0);
      if (portionSize <= 0) {
        throw new Error(`Portion size is required for portion product ${item.product.toString()}`);
      }
      const requiredMl = portionSize * Number(item.quantity || 0);
      const currentStockMl = Number(product.totalStockMl || 0);
      if (currentStockMl < requiredMl) {
        throw new Error(`Insufficient portion stock for product ${item.product.toString()}`);
      }
      product.totalStockMl = Math.max(currentStockMl - requiredMl, 0);
      await product.save();

      const unitCost = Math.abs(Number(product.portionCost) || 0);
      deductions.push({ productId: item.product.toString(), lineCost: Math.max(unitCost * item.quantity, 0) });
      continue;
    }

    let needed = item.quantity;
    const batches = await InventoryBatch.find({ product: item.product, remainingQuantity: { $gt: 0 } }).sort({ createdAt: 1 });
    let lineCost = 0;

    for (const batch of batches) {
      if (needed <= 0) break;
      const taken = Math.min(batch.remainingQuantity, needed);
      batch.remainingQuantity -= taken;
      await batch.save();
      needed -= taken;
      const unitCost = Math.abs(Number(batch.purchasePrice) || 0);
      lineCost += taken * unitCost;
    }

    if (needed > 0) {
      throw new Error(`FIFO stock error for product ${item.product.toString()}`);
    }

    deductions.push({ productId: item.product.toString(), lineCost: Math.max(lineCost, 0) });
  }

  return deductions;
};
