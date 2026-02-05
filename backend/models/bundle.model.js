import mongoose from "mongoose";

const bundleSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		sku: {
			type: String,
			trim: true,
			unique: true,
			sparse: true,
		},
		description: {
			type: String,
			trim: true,
		},
		bundlePrice: {
			type: Number,
			required: true,
			min: 0,
		},
		components: [
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
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

const Bundle = mongoose.model("Bundle", bundleSchema);

export default Bundle;
