import mongoose from "mongoose";

const portionSaleSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    portion_size_ml: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

portionSaleSchema.index({ created_at: -1 });

const PortionSale = mongoose.model("PortionSale", portionSaleSchema);

export default PortionSale;
