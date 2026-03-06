import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatMRU } from "../lib/formatMRU";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import useTranslation from "../hooks/useTranslation";
import { getProductPricing } from "../lib/getProductPricing";
import { useInventoryStore } from "../stores/useInventoryStore";
import AvailabilityBadge from "../components/AvailabilityBadge";

const getProductImages = (product) => {
        if (!product) return [];

        const normalized = Array.isArray(product.images)
                ? product.images
                          .map((image) => (typeof image === "string" ? image : image?.url))
                          .filter((image) => typeof image === "string" && image.length > 0)
                : [];

        if (product.image && !normalized.includes(product.image)) {
                return [product.image, ...normalized];
        }

        return normalized;
};

const ProductDetailPage = () => {
        const { id } = useParams();

        const { selectedProduct, fetchProductById, productDetailsLoading, clearSelectedProduct } = useProductStore((state) => ({
                selectedProduct: state.selectedProduct,
                fetchProductById: state.fetchProductById,
                productDetailsLoading: state.productDetailsLoading,
                clearSelectedProduct: state.clearSelectedProduct,
        }));

        const addToCart = useCartStore((state) => state.addToCart);
        const { t } = useTranslation();
        const [activeImage, setActiveImage] = useState(null);
        const [quantity, setQuantity] = useState(1);
        const [touchStartX, setTouchStartX] = useState(null);
        const [selectedPurchaseOption, setSelectedPurchaseOption] = useState("full");
        const inventory = useInventoryStore((state) => state.publicMap[id]);
        const available = inventory?.availableQuantity ?? 0;

        const productImages = useMemo(() => getProductImages(selectedProduct), [selectedProduct]);

        useEffect(() => {
                let isMounted = true;

                fetchProductById(id).then((product) => {
                        if (isMounted) {
                                const images = getProductImages(product);
                                setActiveImage(images[0] || null);
                        }
                });

                return () => {
                        isMounted = false;
                        clearSelectedProduct();
                };
        }, [fetchProductById, id, clearSelectedProduct]);

        useEffect(() => {
                if (productImages.length === 0) {
                        setActiveImage(null);
                        return;
                }

                if (!activeImage || !productImages.includes(activeImage)) {
                        setActiveImage(productImages[0]);
                }
        }, [productImages, activeImage]);

        useEffect(() => {
                if (selectedProduct) {
                        setQuantity(1);
                        setSelectedPurchaseOption("full");
                }
        }, [selectedProduct]);

        if (productDetailsLoading && !selectedProduct) {
                return <LoadingSpinner />;
        }

        if (!selectedProduct) {
                return (
                        <div className='min-h-screen bg-[#fafafa] text-[#111111]'>
                                <div className='mx-auto max-w-4xl px-4 py-24 text-center'>
                                        <h1 className='text-3xl font-semibold text-[#111111]'>{t("products.detail.notFound.title")}</h1>
                                        <p className='mt-4 text-[#6b7280]'>{t("products.detail.notFound.description")}</p>
                                </div>
                        </div>
                );
        }

        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(selectedProduct);
        const portions = Array.isArray(selectedProduct.portions) ? selectedProduct.portions : [];
        const hasPortions = Boolean(selectedProduct.hasPortions) && portions.length > 0;
        const selectedPortion =
                selectedPurchaseOption === "full"
                        ? null
                        : portions.find((portion) => Number(portion.size_ml) === Number(selectedPurchaseOption));
        const isPortionSelection = selectedPortion !== null;
        const stockValue = Number(selectedProduct.stock ?? available ?? 0);
        const outOfStock = isPortionSelection ? false : stockValue <= 0;
        const currentPrice = isPortionSelection
                ? Number(selectedPortion.price || 0)
                : isDiscounted
                        ? discountedPrice
                        : price;

        const activeImageIndex = productImages.findIndex((image) => image === activeImage);

        const selectImageAt = (index) => {
                if (!productImages.length) return;
                const normalizedIndex = (index + productImages.length) % productImages.length;
                setActiveImage(productImages[normalizedIndex]);
        };

        const handleTouchStart = (event) => {
                setTouchStartX(event.touches[0]?.clientX ?? null);
        };

        const handleTouchEnd = (event) => {
                if (touchStartX === null) return;

                if (productImages.length < 2) {
                        setTouchStartX(null);
                        return;
                }

                const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
                const delta = touchStartX - touchEndX;

                if (Math.abs(delta) > 40) {
                        if (delta > 0) {
                                selectImageAt(activeImageIndex + 1);
                        } else {
                                selectImageAt(activeImageIndex - 1);
                        }
                }

                setTouchStartX(null);
        };

        const handleAddToCart = async () => {
                await addToCart(
                        {
                                ...selectedProduct,
                                discountedPrice,
                                isDiscounted,
                                discountPercentage,
                                cartType: isPortionSelection ? "portion" : "full",
                                portionSizeMl: isPortionSelection ? Number(selectedPortion.size_ml) : null,
                                cartUnitPrice: currentPrice,
                                cartLineName: isPortionSelection
                                        ? `${selectedProduct.name} (${selectedPortion.size_ml}ml)`
                                        : selectedProduct.name,
                        },
                        quantity
                );
                setQuantity(1);
        };

        return (
                <div className='min-h-screen bg-[#fafafa] pb-24 text-[#111111]'>
                        <section className='mx-auto max-w-6xl px-4 py-10'>
                                <div className='mx-auto max-w-xl space-y-5'>
                                        <div
                                                className='overflow-hidden rounded-xl bg-white p-2 shadow-sm'
                                                onTouchStart={handleTouchStart}
                                                onTouchEnd={handleTouchEnd}
                                        >
                                                {activeImage ? (
                                                        <img src={activeImage} alt={selectedProduct.name} className='h-[360px] w-full rounded-md object-cover' />
                                                ) : (
                                                        <div className='flex h-[360px] w-full items-center justify-center text-sm text-[#6b7280]'>
                                                                {t("common.status.noImage")}
                                                        </div>
                                                )}
                                        </div>

                                        {productImages.length > 1 && (
                                                <div className='flex gap-2 overflow-x-auto pb-1'>
                                                        {productImages.map((image, index) => (
                                                                <button
                                                                        key={`${image}-${index}`}
                                                                        type='button'
                                                                        onClick={() => selectImageAt(index)}
                                                                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                                                                                image === activeImage ? "border-brand-primary" : "border-transparent"
                                                                        }`}
                                                                >
                                                                        <img src={image} alt={`${selectedProduct.name} ${index + 1}`} className='h-full w-full object-cover' />
                                                                </button>
                                                        ))}
                                                </div>
                                        )}

                                        <h1 className='text-2xl font-semibold text-[#111111]'>{selectedProduct.name}</h1>

                                        <div className='flex items-baseline gap-2'>
                                                {!isPortionSelection && isDiscounted && <span className='text-sm text-[#6b7280] line-through'>{formatMRU(price)}</span>}
                                                <span className='text-[2rem] font-semibold text-brand-primary'>{formatMRU(currentPrice)}</span>
                                        </div>

                                        <AvailabilityBadge hasPortions={hasPortions} stock={stockValue} />

                                        {hasPortions && (
                                                <div className='space-y-2'>
                                                        <label className='text-sm font-semibold text-[#111111]'>اختر الحجم</label>
                                                        <select
                                                                value={selectedPurchaseOption}
                                                                onChange={(event) => setSelectedPurchaseOption(event.target.value)}
                                                                className='w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#111111]'
                                                        >
                                                                <option value='full'>كامل</option>
                                                                {portions.map((portion, index) => (
                                                                        <option key={`${portion.size_ml}-${index}`} value={portion.size_ml}>
                                                                                {portion.size_ml}ml
                                                                        </option>
                                                                ))}
                                                        </select>
                                                </div>
                                        )}


                                        <div className='flex items-center gap-3'>
                                                <button
                                                        type='button'
                                                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                                        className='inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#111111] shadow-sm'
                                                        aria-label={t("cart.item.decrease")}
                                                >
                                                        <Minus className='h-4 w-4' />
                                                </button>
                                                <span className='flex h-10 min-w-[3rem] items-center justify-center rounded-md bg-white px-3 text-base font-semibold shadow-sm'>
                                                        {quantity}
                                                </span>
                                                <button
                                                        type='button'
                                                        onClick={() => setQuantity((prev) => prev + 1)}
                                                        className='inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#111111] shadow-sm'
                                                        aria-label={t("cart.item.increase")}
                                                >
                                                        <Plus className='h-4 w-4' />
                                                </button>
                                        </div>

                                        <button
                                                disabled={outOfStock}
                                                onClick={handleAddToCart}
                                                className='inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#bf9951] disabled:opacity-50'
                                        >
                                                {t("common.actions.addToCart")}
                                        </button>

                                        <div className='space-y-1 text-xs text-[#6b7280]'>
                                                <p>✔ 100% Original</p>
                                                <p>✔ Fast shipping</p>
                                                <p>✔ Secure payment</p>
                                        </div>

                                        <div className='grid grid-cols-3 gap-3 max-[360px]:grid-cols-2'>
                                                {[
                                                        { label: "التركيز", value: selectedProduct.concentration },
                                                        { label: "الجنس", value: selectedProduct.gender },
                                                        { label: "الحجم", value: selectedProduct.size },
                                                ].map((attribute) => (
                                                        <div key={attribute.label} className='space-y-1'>
                                                                <p className='mb-1 text-center text-[13px] text-[#555555]'>{attribute.label}</p>
                                                                <div className='min-h-[46px] rounded-[8px] border border-[#dddddd] bg-white p-[10px] text-center text-sm text-[#374151]'>
                                                                        {attribute.value || "—"}
                                                                </div>
                                                        </div>
                                                ))}
                                        </div>

                                        <div className='space-y-2 pt-1'>
                                                <h2 className='text-base font-medium text-[#111111]'>عن المنتج</h2>
                                                <p className='text-sm leading-relaxed text-[#6b7280]'>
                                                        {selectedProduct.description || t("products.detail.descriptionFallback")}
                                                </p>
                                        </div>
                                </div>

                                <PeopleAlsoBought productId={selectedProduct._id} category={selectedProduct.category} />
                        </section>

                        <div className='fixed inset-x-0 bottom-0 z-40 bg-white px-4 py-3 shadow-[0_-4px_14px_rgba(17,17,17,0.08)]'>
                                <div className='mx-auto flex max-w-6xl items-center justify-between gap-3'>
                                        <p className='text-xl font-semibold text-brand-primary'>{formatMRU(currentPrice)}</p>
                                        <button
                                                disabled={outOfStock}
                                                onClick={handleAddToCart}
                                                className='inline-flex h-11 min-w-[9rem] items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#bf9951] disabled:opacity-50'
                                        >
                                                إضافة للسلة
                                        </button>
                                </div>
                        </div>
                </div>
        );
};

export default ProductDetailPage;
