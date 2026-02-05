import mongoose from "mongoose";

const inventoryBatchSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    remainingQuantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

inventoryBatchSchema.index({ product: 1, createdAt: 1 });

const InventoryBatch = mongoose.model("InventoryBatch", inventoryBatchSchema);
export default InventoryBatch;
