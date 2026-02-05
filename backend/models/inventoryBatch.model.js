import mongoose from "mongoose";

const inventoryBatchSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
			index: true,
		},
		initialQuantity: {
			type: Number,
			required: true,
			min: 0,
		},
		remainingQuantity: {
			type: Number,
			required: true,
			min: 0,
		},
		reservedQuantity: {
			type: Number,
			default: 0,
			min: 0,
		},
		costPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		receivedAt: {
			type: Date,
			default: Date.now,
			index: true,
		},
		notes: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true }
);

inventoryBatchSchema.index({ product: 1, receivedAt: 1, createdAt: 1 });

const InventoryBatch = mongoose.model("InventoryBatch", inventoryBatchSchema);

export default InventoryBatch;
