import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, default: 0 },
    lineCost: { type: Number, default: 0 },
    lineRevenue: { type: Number, default: 0 },
    lineProfit: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    orderNumber: { type: String, required: true, unique: true },
    trackingCode: { type: String, required: true, unique: true, index: true },
    products: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "AWAITING_PAYMENT",
        "PAYMENT_SUBMITTED",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
        "NEEDS_MANUAL_REVIEW",
      ],
      default: "CREATED",
      index: true,
    },
    paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod", required: false },
    reservationExpiresAt: { type: Date, default: null },
    reservationStartedAt: { type: Date, default: null },
    paymentProofImage: { type: String, default: "" },
    paymentSenderAccount: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
