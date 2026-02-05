import mongoose from "mongoose";
import Product from "../models/product.model.js";
import InventoryBatch from "../models/inventoryBatch.model.js";
import { getInventorySummaries } from "../services/inventory.service.js";

export const getInventoryOverview = async (_req, res) => {
  try {
    const products = await Product.find({}).select("name image price").lean();
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
