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
                parentCategory: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Category",
                        default: null,
                        index: true,
                },
        },
        { timestamps: true }
);

categorySchema.index({ parentCategory: 1, name: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
