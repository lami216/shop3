import mongoose from "mongoose";

const ORDER_STATUSES = [
	"PENDING_PAYMENT",
	"PAYMENT_SUBMITTED",
	"NEEDS_MANUAL_REVIEW",
	"APPROVED",
	"REJECTED",
	"EXPIRED",
];

const orderItemSchema = new mongoose.Schema(
	{
		itemType: {
			type: String,
			enum: ["PRODUCT", "BUNDLE"],
			default: "PRODUCT",
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
		},
		bundle: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Bundle",
		},
		name: {
			type: String,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		reservationBreakdown: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
			},
		],
	},
	{ _id: false }
);

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		orderNumber: {
			type: String,
			required: true,
			unique: true,
		},
		trackingCode: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		products: [orderItemSchema],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ORDER_STATUSES,
			default: "PENDING_PAYMENT",
			index: true,
		},
		reservedUntil: {
			type: Date,
			index: true,
		},
		reservationReleasedAt: {
			type: Date,
		},
		paymentMethod: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "PaymentMethod",
		},
		paymentProofImage: {
			type: String,
			trim: true,
		},
		senderAccount: {
			type: String,
			trim: true,
		},
		approvedAt: {
			type: Date,
		},
		approvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		reviewReminderSentAt: {
			type: Date,
		},
		costBreakdown: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				costPrice: {
					type: Number,
					required: true,
					min: 0,
				},
				batch: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "InventoryBatch",
					required: true,
				},
				lineCost: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		totalCost: {
			type: Number,
			min: 0,
			default: 0,
		},
		profit: {
			type: Number,
			default: 0,
		},
		stripeSessionId: {
			type: String,
			unique: true,
			sparse: true,
		},
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export { ORDER_STATUSES };
export default Order;
