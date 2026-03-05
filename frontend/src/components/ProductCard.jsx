import { useMemo, useState } from "react";
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
        const portions = useMemo(
                () =>
                        (Array.isArray(product.portions) ? [...product.portions] : [])
                                .map((portion) => ({
                                        size_ml: Number(portion?.size_ml || 0),
                                        price: Number(portion?.price || 0),
                                }))
                                .filter((portion) => portion.size_ml > 0)
                                .sort((a, b) => a.size_ml - b.size_ml),
                [product.portions]
        );
        const totalStockMl = Number(product.totalStockMl || 0);
        const smallest = portions[0]?.size_ml || 0;
        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(product);

        const initialSize = portions.find((portion) => portion.size_ml <= totalStockMl)?.size_ml || portions[0]?.size_ml || 0;
        const [selectedSize, setSelectedSize] = useState(initialSize);
        const [purchaseType, setPurchaseType] = useState("portion");
        const selectedPortion = portions.find((portion) => portion.size_ml === selectedSize) || portions[0];
        const fullBottlePrice = isDiscounted ? discountedPrice : price;
        const displayPrice = product.hasPortions
                ? purchaseType === "full"
                        ? Number(fullBottlePrice || 0)
                        : Number(selectedPortion?.price || 0)
                : isDiscounted
                        ? discountedPrice
                        : price;
        const outOfStock = product.hasPortions
                ? purchaseType === "full"
                        ? totalStockMl < Number(product.totalVolumeMl || 0)
                        : totalStockMl < smallest || smallest <= 0
                : available <= 0;

        const productForCart = {
                ...product,
                discountedPrice,
                isDiscounted,
                discountPercentage,
                selectedPortionSizeMl: product.hasPortions && purchaseType === "portion" ? Number(selectedPortion?.size_ml || 0) : 0,
                type: product.hasPortions ? purchaseType : "full",
                price: displayPrice,
        };

        const coverImage =
                product.image ||
                (Array.isArray(product.images) && product.images.length > 0
                        ? typeof product.images[0] === "string"
                                ? product.images[0]
                                : product.images[0]?.url
                        : "");

        return (
                <article className='flex h-full min-h-[21rem] w-full flex-col justify-between overflow-hidden rounded-xl bg-white p-0 shadow-sm'>
                        <Link to={`/products/${product._id}`} className='w-full' aria-label={t("product.viewDetails", { name: product.name })}>
                                <div className='aspect-square w-full overflow-hidden bg-[#fafafa]'>
                                        {coverImage ? <img className='block h-full w-full object-cover object-center' src={coverImage} alt={product.name} /> : <div className='flex h-full w-full items-center justify-center text-sm text-[#6b7280]'>{t("common.status.noImage")}</div>}
                                </div>
                        </Link>

                        <div className='flex flex-1 flex-col gap-2 p-4'>
                                <Link to={`/products/${product._id}`}>
                                        <h5 className='text-sm font-semibold text-[#111111]'>{product.name}</h5>
                                </Link>

                                <div className='flex items-baseline gap-2'>
                                        {!product.hasPortions && isDiscounted && <span className='text-xs text-[#6b7280] line-through'>{formatMRU(price)}</span>}
                                        <span className='text-lg font-semibold text-brand-primary'>{formatMRU(displayPrice)}</span>
                                </div>
                                {displayPrice >= 1000 && <p className='text-xs text-[#16a34a]'>السعر شامل التوصيل</p>}

                                {product.hasPortions ? (
                                        <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${outOfStock ? "bg-red-100 text-[#dc2626]" : "bg-yellow-100 text-[#f59e0b]"}`}>
                                                {outOfStock ? "غير متوفر" : "متوفر بالتقسيمة"}
                                        </span>
                                ) : (
                                        <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${outOfStock ? "bg-red-100 text-[#dc2626]" : "bg-green-100 text-[#16a34a]"}`}>
                                                {outOfStock ? "غير متوفر" : "متوفر"}
                                        </span>
                                )}

                                {product.hasPortions && (
                                        <div className='flex flex-wrap gap-2'>
                                                <button type='button' onClick={() => setPurchaseType("portion")} className={`rounded-full border px-2 py-1 text-xs ${purchaseType === "portion" ? "border-brand-primary text-brand-primary" : "border-gray-300 text-gray-700"}`}>تقسيمة</button>
                                                <button type='button' onClick={() => setPurchaseType("full")} disabled={totalStockMl < Number(product.totalVolumeMl || 0)} className={`rounded-full border px-2 py-1 text-xs ${purchaseType === "full" ? "border-brand-primary text-brand-primary" : "border-gray-300 text-gray-700"} disabled:opacity-40`}>زجاجة كاملة</button>
                                        </div>
                                )}

                                {product.hasPortions && purchaseType === "portion" && (
                                        <div className='flex flex-wrap gap-2'>
                                                {portions.map((portion) => {
                                                        const disabled = totalStockMl < portion.size_ml;
                                                        return (
                                                                <button
                                                                        key={portion.size_ml}
                                                                        type='button'
                                                                        disabled={disabled}
                                                                        onClick={() => setSelectedSize(portion.size_ml)}
                                                                        className={`rounded-full border px-2 py-1 text-xs ${selectedSize === portion.size_ml ? "border-brand-primary text-brand-primary" : "border-gray-300 text-gray-700"} disabled:opacity-40`}
                                                                >
                                                                        {portion.size_ml}ml
                                                                </button>
                                                        );
                                                })}
                                        </div>
                                )}

                                <button disabled={outOfStock} className='mt-auto inline-flex w-full items-center justify-center rounded-md bg-brand-primary py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#bf9951] disabled:opacity-50' onClick={() => addToCart(productForCart)}>
                                        إضافة للسلة
                                </button>
                        </div>
                </article>
        );
};

export default ProductCard;
