import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { getProductPricing } from "../lib/getProductPricing";
import { useInventoryStore } from "../stores/useInventoryStore";

const ProductCard = ({ product }) => {
        const { addToCart } = useCartStore();
        const { t } = useTranslation();
        const inventory = useInventoryStore((state) => state.publicMap[product._id]);
        const available = inventory?.availableQuantity ?? 0;
        const outOfStock = available <= 0;
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

        const volumeValue = product.size ?? product.volume ?? product.capacity ?? "";
        const volumeText = volumeValue ? `${volumeValue} مل` : "";

        return (
                <article className='flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white p-4 text-brand-text shadow-sm'>
                        <Link
                                to={`/products/${product._id}`}
                                className='relative block overflow-hidden rounded-xl bg-[#fafafa]'
                                aria-label={t("product.viewDetails", { name: product.name })}
                        >
                                {coverImage ? (
                                        <img className='h-44 w-full object-cover sm:h-52' src={coverImage} alt={product.name} />
                                ) : (
                                        <div className='flex h-44 w-full items-center justify-center text-sm text-brand-muted sm:h-52'>
                                                {t("common.status.noImage")}
                                        </div>
                                )}
                        </Link>

                        <div className='flex flex-1 flex-col gap-2 pt-4'>
                                <Link to={`/products/${product._id}`}>
                                        <h5 className='text-sm font-semibold text-[#111111] sm:text-base'>{product.name}</h5>
                                </Link>
                                {volumeText && <p className='text-xs text-[#6b7280]'>{volumeText}</p>}
                                <div className='flex items-baseline gap-2'>
                                        {isDiscounted && <span className='text-xs text-[#6b7280] line-through'>{formatMRU(price)}</span>}
                                        <span className='text-xl font-semibold text-brand-primary sm:text-2xl'>
                                                {formatMRU(isDiscounted ? discountedPrice : price)}
                                        </span>
                                </div>
                                <button
                                        disabled={outOfStock}
                                        className='golden-button mt-auto w-full rounded-lg py-3 text-sm disabled:opacity-50'
                                        onClick={handleAddToCart}
                                >
                                        <ShoppingCart size={18} />
                                        إضافة للسلة
                                </button>
                        </div>
                </article>
        );
};

export default ProductCard;
