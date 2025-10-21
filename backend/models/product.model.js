import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
        {
                name: {
                        type: String,
                        required: true,
                },
                description: {
                        type: String,
                        required: true,
                },
                price: {
                        type: Number,
                        min: 0,
                        required: true,
                },
                image: {
                        type: String,
                        required: [true, "Image is required"],
                },
                images: {
                        type: [
                                {
                                        url: {
                                                type: String,
                                                required: true,
                                        },
                                        public_id: {
                                                type: String,
                                                required: true,
                                        },
                                },
                        ],
                        default: [],
                        validate: {
                                validator(images) {
                                        return images.length <= 3;
                                },
                                message: "A product can have up to 3 images only",
                        },
                },
                category: {
                        type: String,
                        required: true,
                },
                isFeatured: {
                        type: Boolean,
                        default: false,
                },
                isDiscounted: {
                        type: Boolean,
                        default: false,
                },
                discountPercentage: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0,
                },
        },
        {
                timestamps: true,
                toJSON: { virtuals: true },
                toObject: { virtuals: true },
        }
);

productSchema.virtual("discountedPrice").get(function getDiscountedPrice() {
        const price = Number(this.price) || 0;
        const discount = Number(this.discountPercentage) || 0;

        if (!this.isDiscounted || discount <= 0) {
                return price;
        }

        const discountValue = price * (discount / 100);
        const finalPrice = price - discountValue;

        return Number(finalPrice.toFixed(2));
});

const Product = mongoose.model("Product", productSchema);

export default Product;
