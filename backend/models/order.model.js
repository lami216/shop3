import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, default: "" },
    type: { type: String, enum: ["full", "portion"], default: "full" },
    portionSizeMl: { type: Number, default: null },
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
    orderNumberSeq: { type: Number, required: false, index: true },
    orderNumberDisplay: { type: String, required: false },
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
        "PENDING_APPROVAL",
        "pending_approval",
        "PENDING_PAYMENT",
        "pending_payment",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
      ],
      default: "pending_approval",
      index: true,
    },
    paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod", required: false },
    stripeSessionId: { type: String, required: false, default: undefined },
    reservationExpiresAt: { type: Date, default: null },
    reservationStartedAt: { type: Date, default: null },
    receiptImageUrl: { type: String, default: "" },
    receiptSubmittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    source: { type: String, enum: ["ONLINE", "POS"], default: "ONLINE" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
