import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { getProductPricing } from "../lib/getProductPricing";

const ProductCard = ({ product }) => {
        const { addToCart } = useCartStore();
        const { t } = useTranslation();
        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(product);
        const productForCart = {
                ...product,
                discountedPrice,
                isDiscounted,
                discountPercentage,
        };
        const coverImage =
                product.image ||
                (Array.isArray(product.images) && product.images.length > 0
                        ? typeof product.images[0] === "string"
                                ? product.images[0]
                                : product.images[0]?.url
                        : "");

        const handleAddToCart = () => {
                addToCart(productForCart);
        };

        return (
                <div className='group relative flex w-full flex-col overflow-hidden rounded-3xl border border-brand-primary/25 bg-white p-4 text-brand-text shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-golden'>
                        <Link
                                to={`/products/${product._id}`}
                                className='relative block overflow-hidden rounded-2xl bg-white'
                                aria-label={t("product.viewDetails", { name: product.name })}
                        >
                                {isDiscounted && (
                                        <span className='absolute right-4 top-4 z-10 rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-text shadow-golden'>
                                                -{discountPercentage}%
                                        </span>
                                )}
                                {coverImage ? (
                                        <img
                                                className='h-60 w-full object-cover transition duration-500 ease-out group-hover:scale-105'
                                                src={coverImage}
                                                alt={product.name}
                                        />
                                ) : (
                                        <div className='flex h-60 w-full items-center justify-center bg-brand-bg text-sm text-brand-muted'>
                                                {t("common.status.noImage")}
                                        </div>
                                )}
                        </Link>

                        <div className='flex flex-1 flex-col gap-4 pt-6'>
                                <Link to={`/products/${product._id}`} className='transition duration-150 ease-out hover:text-brand-primary'>
                                        <h5 className='text-lg font-semibold tracking-wide'>{product.name}</h5>
                                </Link>
                                <p className='min-h-[3.5rem] text-sm leading-relaxed text-brand-muted'>
                                        {product.description || t("products.detail.descriptionFallback")}
                                </p>
                                <div className='flex flex-wrap items-baseline gap-3'>
                                        {isDiscounted ? (
                                                <>
                                                        <span className='text-sm text-brand-muted line-through'>{formatMRU(price)}</span>
                                                        <span className='text-2xl font-semibold text-brand-primary'>{formatMRU(discountedPrice)}</span>
                                                </>
                                        ) : (
                                                <span className='text-2xl font-semibold text-brand-primary'>{formatMRU(price)}</span>
                                        )}
                                </div>
                                <button className='golden-button mt-auto text-xs uppercase tracking-[0.35em]' onClick={handleAddToCart}>
                                        <ShoppingCart size={18} />
                                        {t("common.actions.addToCart")}
                                </button>
                        </div>
                </div>
        );
};
export default ProductCard;
