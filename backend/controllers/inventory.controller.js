import mongoose from "mongoose";
import Product from "../models/product.model.js";
import InventoryBatch from "../models/inventoryBatch.model.js";
import InventoryIntake from "../models/inventoryIntake.model.js";
import { getInventorySummaries } from "../services/inventory.service.js";

export const getInventoryOverview = async (_req, res) => {
  try {
    const products = await Product.find({}).select("name image price hasPortions portionSizeMl portionPrice portionStock portionCost").lean();
    const productIds = products.map((p) => p._id);
    const summaries = await getInventorySummaries(productIds);

    const rows = products.map((p) => ({
      product: p,
      ...(summaries.get(p._id.toString()) || { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 }),
    }));

    res.json({ items: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addInventoryBatch = async (req, res) => {
  try {
    const { productId, quantity, purchasePrice } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const numericQty = Number(quantity);
    const numericCost = Number(purchasePrice);
    if (Number.isNaN(numericQty) || numericQty <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }
    if (Number.isNaN(numericCost) || numericCost < 0) {
      return res.status(400).json({ message: "Purchase price is invalid" });
    }

    const exists = await Product.findById(productId).select("_id");
    if (!exists) return res.status(404).json({ message: "Product not found" });

    const batch = await InventoryBatch.create({
      product: productId,
      quantity: numericQty,
      remainingQuantity: numericQty,
      purchasePrice: numericCost,
    });

    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductBatches = async (req, res) => {
  try {
    const { productId } = req.params;
    const batches = await InventoryBatch.find({ product: productId }).sort({ createdAt: -1 });
    res.json({ batches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInventoryIntake = async (req, res) => {
  try {
    const { invoiceDate, reference, items } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "items is required" });
    }

    const parsedItems = items.map((item) => ({
      product: item.product || item.productId,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost ?? item.purchasePrice),
      unitPrice: item.unitPrice === undefined || item.unitPrice === "" ? undefined : Number(item.unitPrice),
    }));

    for (const item of parsedItems) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: "Invalid product in items" });
      }
      if (Number.isNaN(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ message: "Item quantity must be greater than 0" });
      }
      if (Number.isNaN(item.unitCost) || item.unitCost < 0) {
        return res.status(400).json({ message: "Item unitCost is invalid" });
      }
      if (item.unitPrice !== undefined && (Number.isNaN(item.unitPrice) || item.unitPrice < 0)) {
        return res.status(400).json({ message: "Item unitPrice is invalid" });
      }
    }

    const productIds = [...new Set(parsedItems.map((item) => item.product.toString()))];
    const products = await Product.find({ _id: { $in: productIds } }).select("_id hasPortions portionStock portionCost");
    if (products.length !== productIds.length) {
      return res.status(404).json({ message: "One or more products not found" });
    }

    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    await InventoryBatch.insertMany(
      parsedItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        remainingQuantity: item.quantity,
        purchasePrice: item.unitCost,
      }))
    );

    for (const item of parsedItems) {
      const product = productMap.get(item.product.toString());
      if (!product?.hasPortions) continue;

      product.portionStock = Number(product.portionStock || 0) + Number(item.quantity || 0);
      product.portionCost = Number(item.unitCost || 0);
      await product.save();
    }

    const totalQuantity = parsedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = parsedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const intake = await InventoryIntake.create({
      invoiceDate: invoiceDate || new Date(),
      reference: reference || "",
      items: parsedItems,
      createdBy: req.user?._id,
      totalQuantity,
      totalCost,
    });

    return res.status(201).json({ intake });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInventoryIntakes = async (_req, res) => {
  try {
    const intakes = await InventoryIntake.find({})
      .populate("items.product", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.json({ intakes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getPublicInventorySummary = async (req, res) => {
  try {
    const rawIds = typeof req.query.ids === "string" ? req.query.ids.split(",").map((x)=>x.trim()).filter(Boolean) : [];
    const productIds = rawIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id)=>new mongoose.Types.ObjectId(id));
    if (!productIds.length) return res.json({ items: [] });
    const summaries = await getInventorySummaries(productIds);
    const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 3);
    const items = productIds.map((id) => ({ productId: id.toString(), lowStockThreshold, ...(summaries.get(id.toString()) || { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 }) }));
    res.json({ items, lowStockThreshold });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
