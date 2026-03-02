import { useEffect, useRef, useState } from "react";
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

const resolveCoverImage = (product) => {
        if (!product) return null;
        if (product.image) return product.image;

        if (Array.isArray(product.images) && product.images.length > 0) {
                const [firstImage] = product.images;
                return typeof firstImage === "string" ? firstImage : firstImage?.url || null;
        }

        return null;
};

const mapGalleryImages = (product) => {
        if (!product) return [];

        if (Array.isArray(product.images) && product.images.length > 0) {
                return product.images.map((image) => (typeof image === "string" ? image : image?.url)).filter(Boolean);
        }

        return product.image ? [product.image] : [];
};

const ProductDetailPage = () => {
        const { id } = useParams();
        const imageSectionRef = useRef(null);
        const [showStickyAddToCart, setShowStickyAddToCart] = useState(false);

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
        const inventory = useInventoryStore((state) => state.publicMap[id]);
        const available = inventory?.availableQuantity ?? 0;

        useEffect(() => {
                let isMounted = true;

                fetchProductById(id).then((product) => {
                        if (isMounted) {
                                setActiveImage(resolveCoverImage(product));
                        }
                });

                return () => {
                        isMounted = false;
                        clearSelectedProduct();
                };
        }, [fetchProductById, id, clearSelectedProduct]);

        useEffect(() => {
                if (selectedProduct && !activeImage) {
                        setActiveImage(resolveCoverImage(selectedProduct));
                }
        }, [selectedProduct, activeImage]);

        useEffect(() => {
                if (selectedProduct) {
                        setQuantity(1);
                }
        }, [selectedProduct]);

        useEffect(() => {
                if (!selectedProduct) return undefined;

                const handleScroll = () => {
                        const imageSection = imageSectionRef.current;
                        const footer = document.querySelector("footer");
                        if (!imageSection) return;

                        const imageBottom = imageSection.getBoundingClientRect().bottom;
                        const footerTop = footer ? footer.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
                        const passedImage = imageBottom <= 0;
                        const closeToFooter = footerTop <= window.innerHeight + 16;

                        setShowStickyAddToCart(passedImage && !closeToFooter);
                };

                handleScroll();
                window.addEventListener("scroll", handleScroll, { passive: true });
                window.addEventListener("resize", handleScroll);

                return () => {
                        window.removeEventListener("scroll", handleScroll);
                        window.removeEventListener("resize", handleScroll);
                };
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

        const galleryImages = mapGalleryImages(selectedProduct);
        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(selectedProduct);
        const currentPrice = isDiscounted ? discountedPrice : price;

        const handleAddToCart = async () => {
                await addToCart(
                        {
                                ...selectedProduct,
                                discountedPrice,
                                isDiscounted,
                                discountPercentage,
                        },
                        quantity
                );
                setQuantity(1);
        };

        return (
                <div className='min-h-screen bg-[#fafafa] text-[#111111]'>
                        <section className='mx-auto max-w-6xl px-4 py-10'>
                                <div className='grid gap-8 lg:grid-cols-2'>
                                        <div ref={imageSectionRef}>
                                                <div className='overflow-hidden rounded-2xl bg-white shadow-sm'>
                                                        {activeImage ? (
                                                                <img src={activeImage} alt={selectedProduct.name} className='h-[360px] w-full object-cover' />
                                                        ) : (
                                                                <div className='flex h-[360px] items-center justify-center text-sm text-[#6b7280]'>
                                                                        {t("common.status.noImage")}
                                                                </div>
                                                        )}
                                                </div>

                                                {galleryImages.length > 1 && (
                                                        <div className='mt-4 grid grid-cols-4 gap-2'>
                                                                {galleryImages.map((image) => (
                                                                        <button
                                                                                key={image}
                                                                                type='button'
                                                                                onClick={() => setActiveImage(image)}
                                                                                className={`overflow-hidden rounded-lg bg-white shadow-sm ${
                                                                                        activeImage === image ? "ring-1 ring-brand-primary" : ""
                                                                                }`}
                                                                        >
                                                                                <img src={image} alt={selectedProduct.name} className='h-16 w-full object-cover' />
                                                                        </button>
                                                                ))}
                                                        </div>
                                                )}
                                        </div>

                                        <div className='space-y-6'>
                                                <h1 className='text-2xl font-semibold'>{selectedProduct.name}</h1>

                                                <div className='flex items-baseline gap-2'>
                                                        {isDiscounted && <span className='text-sm text-[#6b7280] line-through'>{formatMRU(price)}</span>}
                                                        <span className='text-3xl font-semibold text-brand-primary'>{formatMRU(currentPrice)}</span>
                                                </div>

                                                <div className='flex items-center gap-3'>
                                                        <button
                                                                type='button'
                                                                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                                                className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111111] shadow-sm'
                                                                aria-label={t("cart.item.decrease")}
                                                        >
                                                                <Minus className='h-4 w-4' />
                                                        </button>
                                                        <span className='flex h-10 min-w-[3rem] items-center justify-center rounded-lg bg-white px-3 text-base font-semibold shadow-sm'>
                                                                {quantity}
                                                        </span>
                                                        <button
                                                                type='button'
                                                                onClick={() => setQuantity((prev) => prev + 1)}
                                                                className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111111] shadow-sm'
                                                                aria-label={t("cart.item.increase")}
                                                        >
                                                                <Plus className='h-4 w-4' />
                                                        </button>
                                                </div>

                                                <div className='space-y-2 py-2'>
                                                        <h2 className='text-lg font-semibold text-[#111111]'>{t("products.detail.descriptionTitle")}</h2>
                                                        <p className='text-sm leading-relaxed text-[#6b7280]'>
                                                                {selectedProduct.description || t("products.detail.descriptionFallback")}
                                                        </p>
                                                </div>

                                                <button
                                                        disabled={available <= 0}
                                                        onClick={handleAddToCart}
                                                        className='golden-button w-full rounded-md py-3 text-sm disabled:opacity-50'
                                                >
                                                        {t("common.actions.addToCart")}
                                                </button>
                                        </div>
                                </div>

                                <PeopleAlsoBought productId={selectedProduct._id} category={selectedProduct.category} />
                        </section>

                        {showStickyAddToCart && (
                                <div className='fixed inset-x-0 bottom-0 z-40 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(17,17,17,0.08)]'>
                                        <div className='mx-auto flex max-w-6xl items-center justify-between gap-3'>
                                                <div className='min-w-0'>
                                                        <p className='truncate text-xs text-[#6b7280]'>{selectedProduct.name}</p>
                                                        <p className='text-lg font-semibold text-brand-primary'>{formatMRU(currentPrice)}</p>
                                                </div>
                                                <button
                                                        disabled={available <= 0}
                                                        onClick={handleAddToCart}
                                                        className='golden-button h-11 min-w-[9rem] rounded-md px-4 py-0 text-sm disabled:opacity-50'
                                                >
                                                        إضافة للسلة
                                                </button>
                                        </div>
                                </div>
                        )}
                </div>
        );
};

export default ProductDetailPage;
