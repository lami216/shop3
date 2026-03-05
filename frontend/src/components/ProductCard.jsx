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
        const portionStock = Number(product.portionStock || 0);
        const outOfStock = product.hasPortions ? portionStock <= 0 : available <= 0;
        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(product);
        const displayPrice = product.hasPortions ? Number(product.portionPrice || 0) : isDiscounted ? discountedPrice : price;

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

        const volumeValue = product.size ?? product.volume ?? product.capacity ?? "";
        const volumeText = volumeValue ? `${volumeValue} مل` : "";

        return (
                <article className='flex h-full min-h-[21rem] w-full flex-col justify-between overflow-hidden rounded-xl bg-white p-0 shadow-sm'>
                        <Link
                                to={`/products/${product._id}`}
                                className='w-full'
                                aria-label={t("product.viewDetails", { name: product.name })}
                        >
                                <div className='aspect-square w-full overflow-hidden bg-[#fafafa]'>
                                        {coverImage ? (
                                                <img className='h-full w-full object-cover' src={coverImage} alt={product.name} />
                                        ) : (
                                                <div className='flex h-full w-full items-center justify-center text-sm text-[#6b7280]'>
                                                        {t("common.status.noImage")}
                                                </div>
                                        )}
                                </div>
                        </Link>

                        <div className='flex flex-1 flex-col gap-2 p-4'>
                                <Link to={`/products/${product._id}`}>
                                        <h5 className='text-sm font-semibold text-[#111111]'>{product.name}</h5>
                                </Link>
                                {volumeText && <p className='text-xs text-[#6b7280]'>{volumeText}</p>}

                                <div className='flex items-baseline gap-2'>
                                        {!product.hasPortions && isDiscounted && <span className='text-xs text-[#6b7280] line-through'>{formatMRU(price)}</span>}
                                        <span className='text-lg font-semibold text-brand-primary'>
                                                {formatMRU(displayPrice)}
                                        </span>
                                </div>

                                {product.hasPortions && (
                                        <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${outOfStock ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>
                                                {outOfStock ? "غير متوفر" : "متوفر بالتقسيمة"}
                                        </span>
                                )}

                                <button
                                        disabled={outOfStock}
                                        className='mt-auto inline-flex w-full items-center justify-center rounded-md bg-brand-primary py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#bf9951] disabled:opacity-50'
                                        onClick={() => addToCart(productForCart)}
                                >
                                        إضافة للسلة
                                </button>
                        </div>
                </article>
        );
};

export default ProductCard;
