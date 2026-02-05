import { useEffect, useState } from "react";
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

        if (product.image) {
                return product.image;
        }

        if (Array.isArray(product.images) && product.images.length > 0) {
                const [firstImage] = product.images;
                return typeof firstImage === "string" ? firstImage : firstImage?.url || null;
        }

        return null;
};

const mapGalleryImages = (product) => {
        if (!product) return [];

        if (Array.isArray(product.images) && product.images.length > 0) {
                return product.images
                        .map((image) => (typeof image === "string" ? image : image?.url))
                        .filter(Boolean);
        }

        return product.image ? [product.image] : [];
};

const ProductDetailPage = () => {
        const { id } = useParams();
        const { selectedProduct, fetchProductById, productDetailsLoading, clearSelectedProduct } = useProductStore(
                (state) => ({
                        selectedProduct: state.selectedProduct,
                        fetchProductById: state.fetchProductById,
                        productDetailsLoading: state.productDetailsLoading,
                        clearSelectedProduct: state.clearSelectedProduct,
                })
        );
        const addToCart = useCartStore((state) => state.addToCart);
        const { t } = useTranslation();
        const [activeImage, setActiveImage] = useState(null);
        const [quantity, setQuantity] = useState(1);
        const inventory = useInventoryStore((state) => state.publicMap[id]);
        const available = inventory?.availableQuantity ?? 0;
        const reserved = inventory?.reservedQuantity ?? 0;

        useEffect(() => {
                let isMounted = true;

                fetchProductById(id)
                        .then((product) => {
                                if (isMounted) {
                                        setActiveImage(resolveCoverImage(product));
                                }
                        })

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

        if (productDetailsLoading && !selectedProduct) {
                return <LoadingSpinner />;
        }

        if (!selectedProduct) {
                return (
                        <div className='relative min-h-screen bg-brand-bg text-brand-text'>
                                <div className='relative z-10 mx-auto max-w-4xl px-4 py-24 text-center'>
                                        <h1 className='text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-brand-primary'>
                                                {t("products.detail.notFound.title")}
                                        </h1>
                                        <p className='mt-4 text-brand-muted'>{t("products.detail.notFound.description")}</p>
                                </div>
                        </div>
                );
        }

        const galleryImages = mapGalleryImages(selectedProduct);
        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(selectedProduct);

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

        const handleDecreaseQuantity = () => {
                setQuantity((prev) => Math.max(1, prev - 1));
        };

        const handleIncreaseQuantity = () => {
                setQuantity((prev) => prev + 1);
        };

        return (
                <div className='relative min-h-screen overflow-hidden bg-brand-bg text-brand-text'>
                        <div className='relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8'>
                                <div className='grid gap-12 lg:grid-cols-2'>
                                        <div>
                                                <div className='relative flex h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-brand-primary/25 bg-black/60 shadow-golden'>
                                                        {isDiscounted && (
                                                                <span className='absolute right-6 top-6 rounded-full bg-brand-accent px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-text shadow-golden'>
                                                                        -{discountPercentage}%
                                                                </span>
                                                        )}
                                                        {activeImage ? (
                                                                <img src={activeImage} alt={selectedProduct.name} className='h-full w-full object-contain p-6' />
                                                        ) : (
                                                                <div className='text-brand-muted'>{t("common.status.noImage")}</div>
                                                        )}
                                                </div>
                                                {galleryImages.length > 1 && (
                                                        <div className='mt-5 flex gap-3 overflow-x-auto pb-2'>
                                                                {galleryImages.map((imageUrl, index) => {
                                                                        const isActive = imageUrl === activeImage;
                                                                        const localizedIndex = new Intl.NumberFormat("ar").format(index + 1);
                                                                        return (
                                                                                <button
                                                                                        key={`${imageUrl}-${index}`}
                                                                                        type='button'
                                                                                        onClick={() => setActiveImage(imageUrl)}
                                                                                        className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition duration-150 ease-out ${
                                                                                                isActive
                                                                                                        ? "border-brand-primary shadow-golden"
                                                                                                        : "border-brand-primary/20 hover:border-brand-primary/60"
                                                                                        }`}
                                                                                        aria-label={t("products.detail.viewImage", { index: localizedIndex })}
                                                                                >
                                                                                        <img src={imageUrl} alt='' className='h-full w-full object-cover' />
                                                                                </button>
                                                                        );
                                                                })}
                                                        </div>
                                                )}
                                        </div>

                                        <div className='flex flex-col gap-8 rounded-3xl border border-brand-primary/15 bg-black/40 px-6 py-8 shadow-golden lg:pl-8'>
                                                <div className='space-y-6'>
                                                        {Array.isArray(selectedProduct.categoryDetails) && selectedProduct.categoryDetails.length > 0 ? (
                                                                <div className='flex flex-wrap gap-2'>
                                                                        {selectedProduct.categoryDetails.map((category) => {
                                                                                const label = category?.name || category?.slug;
                                                                                if (!label) return null;

                                                                                return (
                                                                                        <span
                                                                                                key={category._id || label}
                                                                                                className='rounded-full border border-brand-primary/40 bg-black/50 px-3 py-1 text-xs uppercase tracking-[0.35em] text-brand-muted'
                                                                                        >
                                                                                                {label}
                                                                                        </span>
                                                                                );
                                                                        })}
                                                                </div>
                                                        ) : (
                                                                selectedProduct.category && (
                                                                        <p className='text-xs uppercase tracking-[0.45em] text-brand-muted'>
                                                                                {selectedProduct.category}
                                                                        </p>
                                                                )
                                                        )}
                                                        <div className='space-y-2'>
                                                                <p className='text-xs uppercase tracking-[0.45em] text-brand-muted'>الإسم</p>
                                                                <h1 className='text-[clamp(2rem,4vw,3rem)] font-semibold text-brand-primary'>{selectedProduct.name}</h1>
                                                        </div>
                                                        <div className='space-y-2'>
                                                                <p className='text-xs uppercase tracking-[0.45em] text-brand-muted'>السعر</p>
                                                                <div className='flex flex-wrap items-center gap-4 text-3xl font-semibold text-brand-primary'>
                                                                        {isDiscounted ? (
                                                                                <>
                                                                                        <span className='text-base font-normal text-brand-muted line-through'>
                                                                                                {formatMRU(price)}
                                                                                        </span>
                                                                                        <span className='text-4xl font-bold text-brand-primary'>
                                                                                                {formatMRU(discountedPrice)}
                                                                                        </span>
                                                                                        <span className='rounded-full border border-brand-accent bg-brand-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-text'>
                                                                                                -{discountPercentage}%
                                                                                        </span>
                                                                                </>
                                                                        ) : (
                                                                                <span>{formatMRU(price)}</span>
                                                                        )}
                                                                </div>
                                                        </div>
                                                </div>

                                                <div className='flex flex-wrap items-center gap-4 text-brand-text'>
                                                        <span className='text-xs uppercase tracking-[0.35em] text-brand-muted'>
                                                                {t("cart.item.chooseQuantity")}
                                                        </span>
                                                        <div className='flex items-center gap-3'>
                                                                <button
                                                                        type='button'
                                                                        onClick={handleDecreaseQuantity}
                                                                        className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 bg-black/60 text-brand-text transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/10'
                                                                        aria-label={t("cart.item.decrease")}
                                                                >
                                                                        <Minus className='h-4 w-4' />
                                                                </button>
                                                                <span className='flex h-10 min-w-[3rem] items-center justify-center rounded-2xl border border-brand-primary/20 bg-black/60 text-base font-semibold text-brand-text'>
                                                                        {quantity}
                                                                </span>
                                                                <button
                                                                        type='button'
                                                                        onClick={handleIncreaseQuantity}
                                                                        className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 bg-black/60 text-brand-text transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/10'
                                                                        aria-label={t("cart.item.increase")}
                                                                >
                                                                        <Plus className='h-4 w-4' />
                                                                </button>
                                                        </div>
                                                </div>

                                                <div className='space-y-3 text-brand-muted'>
                                                        <h2 className='text-lg font-semibold text-brand-primary'>
                                                                {t("products.detail.descriptionTitle")}
                                                        </h2>
                                                        <p className='text-base leading-relaxed text-brand-text/90'>
                                                                {selectedProduct.description || t("products.detail.descriptionFallback")}
                                                        </p>
                                                </div>

                                                <p className='text-sm text-brand-muted'>{available <= 0 ? 'Out of stock' : available <= (inventory?.lowStockThreshold ?? 3) ? `Only ${available} left${reserved > 0 ? `, ${reserved} reserved` : ''}` : reserved > 0 ? `${available} available, ${reserved} reserved` : `${available} available`}</p>
                                                <button disabled={available <= 0} onClick={handleAddToCart} className='golden-button text-xs uppercase tracking-[0.45em] disabled:opacity-50'>
                                                        {t("common.actions.addToCart")}
                                                </button>
                                        </div>
                                </div>

                                <div className='mt-20'>
                                        <PeopleAlsoBought productId={selectedProduct._id} category={selectedProduct.category} />
                                </div>
                        </div>
                </div>
        );
};

export default ProductDetailPage;
