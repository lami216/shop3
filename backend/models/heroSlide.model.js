import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema(
        {
                title: {
                        type: String,
                        default: "",
                        trim: true,
                },
                subtitle: {
                        type: String,
                        default: "",
                        trim: true,
                },
                ctaLabel: {
                        type: String,
                        default: "",
                        trim: true,
                },
                ctaUrl: {
                        type: String,
                        default: "",
                        trim: true,
                },
                price: {
                        type: Number,
                        default: null,
                        min: 0,
                },
                order: {
                        type: Number,
                        default: 0,
                },
                image: {
                        url: {
                                type: String,
                                required: true,
                        },
                        fileId: {
                                type: String,
                        },
                },
        },
        {
                timestamps: true,
        }
);

heroSlideSchema.index({ order: 1, createdAt: 1 });

const HeroSlide = mongoose.model("HeroSlide", heroSlideSchema);

export default HeroSlide;
