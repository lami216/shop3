import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
        {
                name: {
                        type: String,
                        required: true,
                },
                description: {
                        type: String,
                        default: "",
                },
                slug: {
                        type: String,
                        required: true,
                        unique: true,
                },
                imageUrl: {
                        type: String,
                        required: true,
                },
                imageFileId: {
                        type: String,
                        default: null,
                },
                imagePublicId: {
                        type: String,
                        default: null,
                },
                displayRow: {
                        type: Number,
                        enum: [1, 2],
                        default: 1,
                },
        },
        { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
