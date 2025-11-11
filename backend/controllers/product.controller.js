import mongoose from "mongoose";
import { redis } from "../lib/redis.js";
import { uploadImage, deleteImage } from "../lib/imagekit.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

const toBoolean = (value) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
                const normalized = value.trim().toLowerCase();
                return ["true", "1", "yes", "on"].includes(normalized);
        }
        return false;
};

const normalizeDiscountSettings = ({
        rawIsDiscounted,
        rawDiscountPercentage,
        fallbackPercentage = 0,
        fallbackIsDiscounted = false,
}) => {
        const hasFlag = rawIsDiscounted !== undefined && rawIsDiscounted !== null;
        const hasPercentage =
                rawDiscountPercentage !== undefined &&
                rawDiscountPercentage !== null &&
                rawDiscountPercentage !== "";

        const isDiscounted = hasFlag ? toBoolean(rawIsDiscounted) : fallbackIsDiscounted;
        const percentageValue = hasPercentage
                ? Number(rawDiscountPercentage)
                : Number(fallbackPercentage);

        if (isDiscounted) {
                if (Number.isNaN(percentageValue)) {
                        return { error: "Discount percentage must be a valid number" };
                }

                if (percentageValue <= 0 || percentageValue >= 100) {
                        return { error: "Discount percentage must be between 1 and 99" };
                }

                return {
                        isDiscounted: true,
                        discountPercentage: Number(percentageValue.toFixed(2)),
                };
        }

        return { isDiscounted: false, discountPercentage: 0 };
};

const getImageIdentifier = (image) => {
        if (!image) return null;
        if (typeof image === "string") return image;
        if (typeof image === "object") {
                return image.fileId || image.public_id || image.url || null;
        }
        return null;
};

const normalizeStoredImage = (image) => {
        if (!image) return null;
        if (typeof image === "string") {
                return { url: image, fileId: null, public_id: null };
        }

        if (typeof image === "object") {
                const url = image.url || image.secure_url || "";
                if (!url) {
                        return null;
                }

                const fileId = image.fileId ?? null;
                const publicId = image.public_id ?? null;

                return {
                        url,
                        fileId,
                        public_id: publicId,
                };
        }

        return null;
};

const prepareImageForStorage = (image) => {
        if (!image) return null;
        const normalized = normalizeStoredImage(image);
        if (!normalized) return null;

        const payload = {
                url: normalized.url,
        };

        if (normalized.fileId) {
                payload.fileId = normalized.fileId;
                payload.public_id = normalized.fileId;
        } else if (normalized.public_id) {
                payload.public_id = normalized.public_id;
        }

        return payload;
};

const normalizeImagesForResponse = (images) => {
        if (!Array.isArray(images)) return [];
        return images
                .map((image) => {
                        const normalized = normalizeStoredImage(image);
                        if (!normalized) return null;

                        const response = { url: normalized.url };

                        if (normalized.fileId) {
                                response.fileId = normalized.fileId;
                        }

                        if (normalized.public_id) {
                                response.public_id = normalized.public_id;
                        }

                        return response;
                })
                .filter(Boolean);
};

const finalizeProductPayload = (product) => {
        if (!product) return product;

        const price = Number(product.price) || 0;
        const percentage = Number(product.discountPercentage) || 0;
        const isDiscounted = Boolean(product.isDiscounted) && percentage > 0;
        const effectivePercentage = isDiscounted ? Number(percentage.toFixed(2)) : 0;
        const discountedPrice = isDiscounted
                ? Number((price - price * (effectivePercentage / 100)).toFixed(2))
                : price;

        const normalizedImages = normalizeImagesForResponse(product.images);
        const coverImageUrl = product.image || normalizedImages[0]?.url || "";

        const categorySource = Array.isArray(product.categoryDetails)
                ? product.categoryDetails
                : Array.isArray(product.categories)
                        ? product.categories
                        : [];

        const normalizeCategory = (category) => {
                if (!category) return null;

                if (typeof category === "object") {
                        const id =
                                category._id?.toString?.() ??
                                category.id?.toString?.() ??
                                (typeof category === "string" ? category : null);

                        if (!id) return null;

                        const parent =
                                typeof category.parentCategory === "object"
                                        ? category.parentCategory?._id?.toString?.() ??
                                          category.parentCategory?.id?.toString?.() ??
                                          category.parentCategory?.toString?.() ??
                                          null
                                        : category.parentCategory ?? null;

                        return {
                                _id: id,
                                name: category.name ?? "",
                                slug: category.slug ?? "",
                                parentCategory: parent,
                        };
                }

                if (typeof category === "string") {
                        return {
                                _id: category,
                                name: "",
                                slug: "",
                                parentCategory: null,
                        };
                }

                return null;
        };

        const categoryDetails = categorySource
                .map((category) => normalizeCategory(category))
                .filter(Boolean);
        const categoryIds = categoryDetails.map((category) => category._id);
        const primaryCategorySlug = categoryDetails.find((category) => category.slug)?.slug || null;

        return {
                ...product,
                isDiscounted,
                discountPercentage: effectivePercentage,
                discountedPrice,
                image: coverImageUrl,
                images: normalizedImages,
                categories: categoryIds,
                categoryDetails,
                category: primaryCategorySlug,
        };
};

const serializeProduct = (product) => {
        if (!product) return product;
        const serialized =
                typeof product.toObject === "function"
                        ? product.toObject({ virtuals: true })
                        : product;

        return finalizeProductPayload(serialized);
};

const resolveCategoryIdentifiers = async (rawCategories, fallbackCategory = null) => {
        const collected = [];

        if (Array.isArray(rawCategories)) {
                collected.push(...rawCategories);
        } else if (rawCategories !== undefined && rawCategories !== null) {
                collected.push(rawCategories);
        }

        if (
                (!collected.length || collected.every((item) => item === null || item === "")) &&
                typeof fallbackCategory === "string" &&
                fallbackCategory.trim().length
        ) {
                collected.push(fallbackCategory);
        }

        const trimmed = collected
                .map((value) => (typeof value === "string" ? value.trim() : ""))
                .filter(
                        (value) =>
                                value.length > 0 && !["null", "root"].includes(value.toLowerCase())
                );

        if (!trimmed.length) {
                return [];
        }

        const uniqueValues = [...new Set(trimmed)];

        const objectIdValues = uniqueValues
                .filter((value) => mongoose.Types.ObjectId.isValid(value))
                .map((value) => new mongoose.Types.ObjectId(value));
        const slugValues = uniqueValues.filter((value) => !mongoose.Types.ObjectId.isValid(value));

        const orConditions = [];

        if (objectIdValues.length) {
                orConditions.push({ _id: { $in: objectIdValues } });
        }

        if (slugValues.length) {
                orConditions.push({ slug: { $in: slugValues } });
        }

        if (!orConditions.length) {
                return [];
        }

        const categories = await Category.find({ $or: orConditions })
                .select("_id slug")
                .lean();

        const resolutionMap = new Map();

        categories.forEach((category) => {
                if (!category?._id) return;
                const idString = category._id.toString();
                resolutionMap.set(idString, idString);
                if (category.slug) {
                        resolutionMap.set(category.slug, idString);
                }
        });

        const resolvedIds = uniqueValues.map((value) => resolutionMap.get(value));

        if (resolvedIds.some((value) => !value)) {
                const missing = uniqueValues.filter((value, index) => !resolvedIds[index]);
                return {
                        error:
                                missing.length === 1
                                        ? `Category \"${missing[0]}\" was not found`
                                        : `Categories not found: ${missing.join(", ")}`,
                };
        }

        return [...new Set(resolvedIds.filter(Boolean))];
};

const UNCATEGORIZED_FILTER = {
        $or: [{ categories: { $exists: false } }, { categories: { $size: 0 } }],
};

export const getAllProducts = async (req, res) => {
        try {
                const { category: categorySlug, uncategorized } = req.query;
                const filter = {};

                if (typeof uncategorized !== "undefined" && toBoolean(uncategorized)) {
                        Object.assign(filter, UNCATEGORIZED_FILTER);
                } else if (typeof categorySlug === "string" && categorySlug.trim()) {
                        const normalizedSlug = categorySlug.trim().toLowerCase();
                        const category = await Category.findOne({ slug: normalizedSlug })
                                .select("_id")
                                .lean();

                        if (!category) {
                                return res.json({ products: [] });
                        }

                        filter.categories = category._id;
                }

                const products = await Product.find(filter)
                        .populate({ path: "categories", select: "name slug parentCategory" })
                        .lean({ virtuals: true });

                res.json({ products: products.map(finalizeProductPayload) });
        } catch (error) {
                console.log("Error in getAllProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getFeaturedProducts = async (req, res) => {
        try {
                let featuredProducts = await redis.get("featured_products");
                if (featuredProducts) {
                        const parsed = JSON.parse(featuredProducts);
                        return res.json(parsed.map(finalizeProductPayload));
                }

                featuredProducts = await Product.find({ isFeatured: true })
                        .populate({ path: "categories", select: "name slug parentCategory" })
                        .lean({ virtuals: true });

                if (!featuredProducts || !featuredProducts.length) {
                        return res.status(404).json({ message: "No featured products found" });
                }

                const finalized = featuredProducts.map(finalizeProductPayload);

                await redis.set("featured_products", JSON.stringify(finalized));

                res.json(finalized);
        } catch (error) {
                console.log("Error in getFeaturedProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const createProduct = async (req, res) => {
        try {
                const {
                        name,
                        description,
                        price,
                        categories: rawCategories,
                        category: legacyCategory,
                        images,
                        isDiscounted,
                        discountPercentage,
                } = req.body;

                const trimmedName = typeof name === "string" ? name.trim() : "";
                const trimmedDescription =
                        typeof description === "string" ? description.trim() : "";

                if (!trimmedName) {
                        return res.status(400).json({ message: "Product name is required" });
                }

                if (!trimmedDescription) {
                        return res.status(400).json({ message: "Product description is required" });
                }

                if (!Array.isArray(images) || images.length === 0) {
                        return res.status(400).json({ message: "At least one product image is required" });
                }

                if (images.length > 3) {
                        return res.status(400).json({ message: "You can upload up to 3 images per product" });
                }

                const sanitizedImages = images
                        .filter((image) => typeof image === "string" && image.trim().length > 0)
                        .slice(0, 3);

                if (!sanitizedImages.length) {
                        return res.status(400).json({ message: "Provided images are not valid" });
                }

                const numericPrice = Number(price);

                if (Number.isNaN(numericPrice)) {
                        return res.status(400).json({ message: "Price must be a valid number" });
                }

                const discountSettings = normalizeDiscountSettings({
                        rawIsDiscounted: isDiscounted,
                        rawDiscountPercentage: discountPercentage,
                });

                if (discountSettings.error) {
                        return res.status(400).json({ message: discountSettings.error });
                }

                const resolvedCategories = await resolveCategoryIdentifiers(
                        rawCategories,
                        legacyCategory
                );

                if (resolvedCategories?.error) {
                        return res.status(400).json({ message: resolvedCategories.error });
                }

                const uploadedImages = [];

                try {
                        for (const base64Image of sanitizedImages) {
                                if (!base64Image.startsWith("data:")) {
                                        throw new Error("INVALID_IMAGE_FORMAT");
                                }

                                const { url, fileId } = await uploadImage(base64Image, "products");
                                uploadedImages.push({ url, fileId });
                        }
                } catch (uploadError) {
                        await Promise.all(
                                uploadedImages
                                        .map((image) => image.fileId)
                                        .filter(Boolean)
                                        .map((fileId) => deleteImage(fileId).catch(() => {}))
                        );

                        if (uploadError.message === "INVALID_IMAGE_FORMAT") {
                                return res.status(400).json({ message: "Invalid product image format" });
                        }

                        throw uploadError;
                }

                const storedImages = uploadedImages
                        .map((image) => prepareImageForStorage(image))
                        .filter(Boolean);

                const product = await Product.create({
                        name: trimmedName,
                        description: trimmedDescription,
                        price: numericPrice,
                        image: storedImages[0]?.url || "",
                        images: storedImages,
                        categories: resolvedCategories,
                        isDiscounted: discountSettings.isDiscounted,
                        discountPercentage: discountSettings.discountPercentage,
                });

                await product.populate({
                        path: "categories",
                        select: "name slug parentCategory",
                });

                res.status(201).json(serializeProduct(product));
        } catch (error) {
                console.log("Error in createProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const updateProduct = async (req, res) => {
        try {
                const { id } = req.params;
                const {
                        name,
                        description,
                        price,
                        categories: rawCategories,
                        category: legacyCategory,
                        existingImages,
                        newImages,
                        cover,
                        isDiscounted,
                        discountPercentage,
                } = req.body;

                const product = await Product.findById(id);

                if (!product) {
                        return res.status(404).json({ message: "Product not found" });
                }

                const trimmedName = typeof name === "string" ? name.trim() : product.name;
                const trimmedDescription =
                        typeof description === "string" ? description.trim() : product.description;

                if (!trimmedName) {
                        return res.status(400).json({ message: "Product name is required" });
                }

                if (!trimmedDescription) {
                        return res.status(400).json({ message: "Product description is required" });
                }

                const existingImageIds = Array.isArray(existingImages)
                        ? existingImages
                                  .map((image) => {
                                          if (typeof image === "string") return image;
                                          if (typeof image === "object") {
                                                  return (
                                                          image.fileId ||
                                                          image.public_id ||
                                                          image.url ||
                                                          null
                                                  );
                                          }
                                          return null;
                                  })
                                  .filter(Boolean)
                        : [];

                const sanitizedNewImages = Array.isArray(newImages)
                        ? newImages
                                  .filter((image) => typeof image === "string" && image.trim().length > 0)
                                  .slice(0, 3)
                        : [];

                const currentImages = Array.isArray(product.images)
                        ? product.images.map((image) => normalizeStoredImage(image)).filter(Boolean)
                        : [];
                const retainedImages = currentImages.filter((image) =>
                        existingImageIds.includes(getImageIdentifier(image))
                );
                const removedImages = currentImages.filter(
                        (image) => !existingImageIds.includes(getImageIdentifier(image))
                );

                const totalImagesCount = retainedImages.length + sanitizedNewImages.length;

                if (totalImagesCount === 0) {
                        return res.status(400).json({ message: "At least one product image is required" });
                }

                if (totalImagesCount > 3) {
                        return res.status(400).json({ message: "You can upload up to 3 images per product" });
                }

                if (removedImages.length) {
                        await Promise.all(
                                removedImages
                                        .map((image) => image.fileId)
                                        .filter(Boolean)
                                        .map((fileId) =>
                                                deleteImage(fileId).catch((error) => {
                                                        console.log(
                                                                "Error deleting removed images from ImageKit",
                                                                error
                                                        );
                                                })
                                        )
                        );
                }

                const uploadedImages = [];

                for (const base64Image of sanitizedNewImages) {
                        try {
                                if (!base64Image.startsWith("data:")) {
                                        throw new Error("INVALID_IMAGE_FORMAT");
                                }

                                const { url, fileId } = await uploadImage(base64Image, "products");

                                uploadedImages.push({
                                        url,
                                        fileId,
                                });
                        } catch (uploadError) {
                                await Promise.all(
                                        uploadedImages
                                                .map((image) => image.fileId)
                                                .filter(Boolean)
                                                .map((fileId) => deleteImage(fileId).catch(() => {}))
                                );

                                if (uploadError.message === "INVALID_IMAGE_FORMAT") {
                                        return res.status(400).json({ message: "Invalid product image format" });
                                }

                                throw uploadError;
                        }
                }

                const imageLookup = retainedImages.reduce((accumulator, image) => {
                        const identifier = getImageIdentifier(image);
                        if (identifier) {
                                accumulator[identifier] = image;
                        }
                        return accumulator;
                }, {});

                const orderedRetainedImages = existingImageIds
                        .map((identifier) => imageLookup[identifier])
                        .filter(Boolean);

                const coverPreference =
                        cover && typeof cover === "object" ? cover : { source: null, index: 0 };
                const coverSource =
                        typeof coverPreference.source === "string"
                                ? coverPreference.source.toLowerCase()
                                : null;

                let finalImages = [];

                if (coverSource === "new" && uploadedImages.length) {
                        const [coverImage, ...restUploaded] = uploadedImages;
                        finalImages = [coverImage, ...orderedRetainedImages, ...restUploaded];
                } else if (orderedRetainedImages.length) {
                        const [coverImage, ...restRetained] = orderedRetainedImages;
                        finalImages = [coverImage, ...restRetained, ...uploadedImages];
                } else {
                        finalImages = [...uploadedImages];
                }

                const numericPrice =
                        price === undefined || price === null ? product.price : Number(price);

                if (Number.isNaN(numericPrice)) {
                        return res.status(400).json({ message: "Price must be a valid number" });
                }

                let nextCategories = product.categories;

                if (rawCategories !== undefined || legacyCategory !== undefined) {
                        const resolvedCategories = await resolveCategoryIdentifiers(
                                rawCategories,
                                legacyCategory
                        );

                        if (resolvedCategories?.error) {
                                return res.status(400).json({ message: resolvedCategories.error });
                        }

                        nextCategories = resolvedCategories;
                }

                const discountSettings = normalizeDiscountSettings({
                        rawIsDiscounted: isDiscounted,
                        rawDiscountPercentage: discountPercentage,
                        fallbackIsDiscounted: product.isDiscounted,
                        fallbackPercentage: product.discountPercentage,
                });

                if (discountSettings.error) {
                        return res.status(400).json({ message: discountSettings.error });
                }

                product.name = trimmedName;
                product.description = trimmedDescription;
                product.price = numericPrice;
                product.categories = nextCategories;
                const storedImages = finalImages
                        .map((image) => prepareImageForStorage(image))
                        .filter(Boolean);

                product.images = storedImages;
                product.image = storedImages[0]?.url || product.image;
                product.isDiscounted = discountSettings.isDiscounted;
                product.discountPercentage = discountSettings.discountPercentage;

                const updatedProduct = await product.save();

                await updatedProduct.populate({
                        path: "categories",
                        select: "name slug parentCategory",
                });

                if (updatedProduct.isFeatured) {
                        await updateFeaturedProductsCache();
                }

                res.json(serializeProduct(updatedProduct));
        } catch (error) {
                console.log("Error in updateProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const deleteProduct = async (req, res) => {
        try {
                const product = await Product.findById(req.params.id);

                if (!product) {
                        return res.status(404).json({ message: "Product not found" });
                }

                const fileIds = Array.isArray(product.images)
                        ? product.images
                                  .map((image) => normalizeStoredImage(image))
                                  .filter((image) => image?.fileId)
                                  .map((image) => image.fileId)
                        : [];

                await Promise.all(
                        fileIds.map((fileId) =>
                                deleteImage(fileId).catch((error) => {
                                        console.log("Error deleting images from ImageKit", error);
                                })
                        )
                );

                await Product.findByIdAndDelete(req.params.id);

                if (product.isFeatured) {
                        await updateFeaturedProductsCache();
                }

                res.json({ message: "Product and images deleted successfully" });
        } catch (error) {
                console.log("Error in deleteProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getProductById = async (req, res) => {
        try {
                const product = await Product.findById(req.params.id).populate({
                        path: "categories",
                        select: "name slug parentCategory",
                });

                if (!product) {
                        return res.status(404).json({ message: "Product not found" });
                }

                res.json(serializeProduct(product));
        } catch (error) {
                console.log("Error in getProductById controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getRecommendedProducts = async (req, res) => {
        try {
                const { productId, category } = req.query;
                const sampleSize = 4;

                let targetCategorySlug =
                        typeof category === "string" && category.trim()
                                ? category.trim().toLowerCase()
                                : null;
                let targetCategoryId = null;
                const excludedIds = [];

                if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                        excludedIds.push(new mongoose.Types.ObjectId(productId));

                        if (!targetCategorySlug) {
                                const product = await Product.findById(productId)
                                        .select("categories")
                                        .lean();
                                if (product?.categories?.length) {
                                        const populated = await Category.find({
                                                _id: { $in: product.categories },
                                        })
                                                .select("slug")
                                                .lean();
                                        targetCategorySlug = populated[0]?.slug || null;
                                }
                        }
                }

                let recommendations = [];

                if (targetCategorySlug) {
                        const categoryDoc = await Category.findOne({ slug: targetCategorySlug })
                                .select("_id")
                                .lean();

                        if (categoryDoc) {
                                targetCategoryId = categoryDoc._id;
                        }
                }

                const buildSamplePipeline = (matchFilter) => {
                        const pipeline = [{ $sample: { size: sampleSize } }];

                        if (matchFilter) {
                                pipeline.unshift({ $match: matchFilter });
                        }

                        return pipeline;
                };

                if (targetCategoryId) {
                        const matchStage = {
                                categories: targetCategoryId,
                                ...(excludedIds.length ? { _id: { $nin: excludedIds } } : {}),
                        };

                        recommendations = await Product.aggregate(
                                buildSamplePipeline(matchStage)
                        );
                }

                if (!recommendations.length) {
                        const fallbackMatch = excludedIds.length ? { _id: { $nin: excludedIds } } : null;
                        recommendations = await Product.aggregate(
                                buildSamplePipeline(fallbackMatch)
                        );
                }

                const populatedRecommendations = await Product.populate(recommendations, {
                        path: "categories",
                        select: "name slug parentCategory",
                });

                res.json(populatedRecommendations.map(finalizeProductPayload));
        } catch (error) {
                console.log("Error in getRecommendedProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getProductsByCategory = async (req, res) => {
        const { category } = req.params;
        try {
                if (!category) {
                        return res.json({ products: [] });
                }

                if (category.toLowerCase() === "uncategorized") {
                        const uncategorizedProducts = await Product.find(UNCATEGORIZED_FILTER)
                                .populate({
                                        path: "categories",
                                        select: "name slug parentCategory",
                                })
                                .lean({ virtuals: true });

                        return res.json({
                                products: uncategorizedProducts.map(finalizeProductPayload),
                        });
                }

                const normalizedSlug = category.trim().toLowerCase();
                const categoryDoc = await Category.findOne({ slug: normalizedSlug })
                        .select("_id")
                        .lean();

                if (!categoryDoc) {
                        return res.json({ products: [] });
                }

                const products = await Product.find({ categories: categoryDoc._id })
                        .populate({ path: "categories", select: "name slug parentCategory" })
                        .lean({ virtuals: true });
                res.json({ products: products.map(finalizeProductPayload) });
        } catch (error) {
                console.log("Error in getProductsByCategory controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const toggleFeaturedProduct = async (req, res) => {
        try {
                const product = await Product.findById(req.params.id);
                if (product) {
                        product.isFeatured = !product.isFeatured;
                        const updatedProduct = await product.save();
                        await updatedProduct.populate({
                                path: "categories",
                                select: "name slug parentCategory",
                        });
                        await updateFeaturedProductsCache();
                        res.json(serializeProduct(updatedProduct));
                } else {
                        res.status(404).json({ message: "Product not found" });
                }
        } catch (error) {
                console.log("Error in toggleFeaturedProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

async function updateFeaturedProductsCache() {
        try {
                const featuredProducts = await Product.find({ isFeatured: true })
                        .populate({ path: "categories", select: "name slug parentCategory" })
                        .lean({ virtuals: true });
                await redis.set(
                        "featured_products",
                        JSON.stringify(featuredProducts.map(finalizeProductPayload))
                );
        } catch (error) {
                console.log("error in update cache function", error.message);
        }
}
