import mongoose from "mongoose";

const inventoryReservationSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["ACTIVE", "RELEASED", "CONSUMED"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

const InventoryReservation = mongoose.model("InventoryReservation", inventoryReservationSchema);
export default InventoryReservation;
