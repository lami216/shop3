import HeroSlide from "../models/heroSlide.model.js";
import { deleteImage, uploadImage } from "../lib/imagekit.js";

const hasImageKitConfig =
        Boolean(process.env.IMAGEKIT_PUBLIC_KEY) &&
        Boolean(process.env.IMAGEKIT_PRIVATE_KEY) &&
        Boolean(process.env.IMAGEKIT_URL_ENDPOINT);

const sanitizeString = (value) => {
        if (typeof value !== "string") return "";
        return value.trim();
};

const isValidUrl = (value) => {
        if (typeof value !== "string") return false;
        const trimmed = value.trim();
        if (!trimmed) return false;

        try {
                const url = new URL(trimmed);
                return ["http:", "https:"].includes(url.protocol);
        } catch {
                return false;
        }
};

const normalizeSlide = (slide) => {
        if (!slide) return null;
        const payload =
                typeof slide.toObject === "function"
                        ? slide.toObject({ virtuals: true })
                        : slide;

        return {
                _id: payload._id?.toString?.() ?? payload._id,
                title: payload.title ?? "",
                subtitle: payload.subtitle ?? "",
                ctaLabel: payload.ctaLabel ?? "",
                ctaUrl: payload.ctaUrl ?? "",
                price: typeof payload.price === "number" ? payload.price : null,
                order: typeof payload.order === "number" ? payload.order : 0,
                image: payload.image
                        ? {
                                  url: payload.image.url,
                                  fileId: payload.image.fileId ?? null,
                          }
                        : null,
                createdAt: payload.createdAt ?? null,
                updatedAt: payload.updatedAt ?? null,
        };
};

export const listHeroSlides = async (req, res) => {
        try {
                const slides = await HeroSlide.find()
                        .sort({ order: 1, createdAt: 1 })
                        .lean();

                res.json({ slides: slides.map(normalizeSlide) });
        } catch (error) {
                console.log("Error in listHeroSlides controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

const prepareImagePayload = async (image) => {
        if (typeof image !== "string" || !image.trim()) {
                throw new Error("INVALID_IMAGE");
        }

        const trimmed = image.trim();

        if (trimmed.startsWith("data:")) {
                if (!hasImageKitConfig) {
                        return { url: trimmed, fileId: null };
                }

                try {
                        const { url, fileId } = await uploadImage(trimmed, "hero-slides");
                        return { url, fileId: fileId ?? null };
                } catch (error) {
                        console.warn("[HeroSlide] Falling back to inline image due to upload error:", error.message);
                        return { url: trimmed, fileId: null };
                }
        }

        if (isValidUrl(trimmed)) {
                return { url: trimmed, fileId: null };
        }

        throw new Error("INVALID_IMAGE");
};

export const createHeroSlide = async (req, res) => {
        try {
                const { title, subtitle, image, ctaLabel, ctaUrl, order, price } = req.body;

                if (typeof image !== "string" || !image.trim()) {
                        return res.status(400).json({ message: "Image is required" });
                }

                const numericPrice = Number(price);
                if (price !== undefined && price !== null && price !== "") {
                        if (!Number.isFinite(numericPrice) || Number.isNaN(numericPrice) || numericPrice < 0) {
                                return res.status(400).json({ message: "price must be a valid non-negative number" });
                        }
                }

                let storedImage;

                try {
                        storedImage = await prepareImagePayload(image);
                } catch (error) {
                        return res.status(400).json({ message: "Invalid image provided" });
                }

                const slidesCount = await HeroSlide.countDocuments();
                const numericOrder = Number(order);

                const slide = await HeroSlide.create({
                        title: sanitizeString(title),
                        subtitle: sanitizeString(subtitle),
                        image: storedImage,
                        ctaLabel: sanitizeString(ctaLabel),
                        ctaUrl: isValidUrl(ctaUrl) ? ctaUrl.trim() : "",
                        price:
                                price === undefined || price === null || price === ""
                                        ? null
                                        : Number.isNaN(numericPrice) || !Number.isFinite(numericPrice)
                                        ? null
                                        : numericPrice,
                        order: Number.isFinite(numericOrder) ? numericOrder : slidesCount,
                });

                res.status(201).json(normalizeSlide(slide));
        } catch (error) {
                console.log("Error in createHeroSlide controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const updateHeroSlide = async (req, res) => {
        try {
                const { id } = req.params;
                const { title, subtitle, image, ctaLabel, ctaUrl, order, price } = req.body;

                const slide = await HeroSlide.findById(id);

                if (!slide) {
                        return res.status(404).json({ message: "Slide not found" });
                }

                if (title !== undefined) {
                        slide.title = sanitizeString(title);
                }

                if (subtitle !== undefined) {
                        slide.subtitle = sanitizeString(subtitle);
                }

                if (ctaLabel !== undefined) {
                        slide.ctaLabel = sanitizeString(ctaLabel);
                }

                if (ctaUrl !== undefined) {
                        slide.ctaUrl = isValidUrl(ctaUrl) ? ctaUrl.trim() : "";
                }

                if (order !== undefined) {
                        const numericOrder = Number(order);
                        if (Number.isNaN(numericOrder)) {
                                return res.status(400).json({ message: "order must be a valid number" });
                        }
                        slide.order = numericOrder;
                }

                if (price !== undefined) {
                        if (price === null || price === "") {
                                slide.price = null;
                        } else {
                                const numericPrice = Number(price);
                                if (!Number.isFinite(numericPrice) || Number.isNaN(numericPrice) || numericPrice < 0) {
                                        return res.status(400).json({ message: "price must be a valid non-negative number" });
                                }
                                slide.price = numericPrice;
                        }
                }

                if (image !== undefined) {
                        if (typeof image !== "string" || !image.trim()) {
                                return res.status(400).json({ message: "Image is required" });
                        }

                        const previousFileId = slide.image?.fileId;

                        try {
                                const updatedImage = await prepareImagePayload(image);
                                slide.image = updatedImage;
                                await slide.save();

                                if (previousFileId) {
                                        await deleteImage(previousFileId).catch(() => {});
                                }

                                return res.json(normalizeSlide(slide));
                        } catch (error) {
                                return res.status(400).json({ message: "Invalid image provided" });
                        }
                }

                await slide.save();

                res.json(normalizeSlide(slide));
        } catch (error) {
                console.log("Error in updateHeroSlide controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const deleteHeroSlide = async (req, res) => {
        try {
                const { id } = req.params;
                const slide = await HeroSlide.findByIdAndDelete(id);

                if (!slide) {
                        return res.status(404).json({ message: "Slide not found" });
                }

                const fileId = slide.image?.fileId;
                if (fileId) {
                        await deleteImage(fileId).catch(() => {});
                }

                res.json({ success: true });
        } catch (error) {
                console.log("Error in deleteHeroSlide controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};
