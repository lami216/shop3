import mongoose from "mongoose";

const inventoryIntakeItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, min: 0 },
  },
  { _id: false }
);

const inventoryIntakeSchema = new mongoose.Schema(
  {
    invoiceDate: { type: Date, default: Date.now },
    reference: { type: String, trim: true, default: "" },
    items: { type: [inventoryIntakeItemSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    totalQuantity: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

inventoryIntakeSchema.index({ createdAt: -1 });

const InventoryIntake = mongoose.model("InventoryIntake", inventoryIntakeSchema);

export default InventoryIntake;
