import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";
import { getProductPricing } from "../lib/getProductPricing";

const CartItem = ({ item }) => {
        const { removeFromCart, updateQuantity } = useCartStore();
        const { t } = useTranslation();

        const { price: originalPrice, discountedPrice, isDiscounted, discountPercentage } =
                getProductPricing(item);
        const priceValue = Number(discountedPrice) || 0;
        const quantityValue = Number(item.quantity) || 0;
        const handleDecrease = () => {
                const nextQuantity = Math.max(1, quantityValue - 1);
                updateQuantity(item._id, nextQuantity);
        };

        const handleIncrease = () => {
                updateQuantity(item._id, quantityValue + 1);
        };

        const handleRemove = () => {
                removeFromCart(item._id);
        };

        return (
                <article
                        className='grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-brand-primary/20 bg-white p-4 text-brand-text shadow-sm transition duration-300 hover:shadow-golden sm:grid-cols-[96px_minmax(0,1fr)] sm:p-5'
                        dir='rtl'
                >
                        <Link
                                to={`/products/${item._id}`}
                                className='block h-20 w-20 overflow-hidden rounded-xl border border-brand-primary/20 bg-brand-bg shadow-inner transition hover:border-brand-primary sm:h-24 sm:w-24'
                        >
                                {item.image ? (
                                        <img src={item.image} alt={item.name} className='h-full w-full object-cover' />
                                ) : (
                                        <div className='flex h-full w-full items-center justify-center text-brand-muted'>
                                                <span className='text-xs'>{t("common.status.noImage")}</span>
                                        </div>
                                )}
                        </Link>

                        <div className='flex flex-col gap-3'>
                                <div className='flex items-start justify-between gap-3'>
                                        <h3 className='text-[clamp(1.05rem,2.4vw,1.25rem)] font-semibold text-brand-text'>{item.name}</h3>
                                        {isDiscounted && (
                                                <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700'>
                                                        -{discountPercentage}%
                                                </span>
                                        )}
                                </div>

                                <div className='flex flex-wrap items-center gap-2 text-sm text-brand-muted'>
                                        <span>{t("cart.item.unitPrice")}</span>
                                        <div className='flex items-center gap-2 text-lg font-semibold text-payzone-gold'>
                                                {isDiscounted && (
                                                        <span className='text-xs font-medium text-brand-muted line-through'>
                                                                {formatMRU(originalPrice)}
                                                        </span>
                                                )}
                                                <span className='text-[clamp(1rem,2.2vw,1.15rem)]'>{formatMRU(priceValue)}</span>
                                        </div>
                                </div>

                                <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-primary/20 bg-brand-bg px-3 py-2 text-sm text-brand-text'>
                                        <div className='flex items-center gap-2'>
                                                <label className='sr-only' htmlFor={`quantity-${item._id}`}>
                                                        {t("cart.item.chooseQuantity")}
                                                </label>
                                                <button
                                                        type='button'
                                                        onClick={handleDecrease}
                                                        className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-primary/30 bg-white text-brand-text transition hover:border-brand-primary hover:shadow-golden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70'
                                                        aria-label={t("cart.item.decrease")}
                                                >
                                                        <Minus className='h-3.5 w-3.5' />
                                                </button>
                                                <span
                                                        id={`quantity-${item._id}`}
                                                        className='flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg bg-brand-bg text-sm font-semibold text-brand-text'
                                                >
                                                        {formatNumberEn(quantityValue)}
                                                </span>
                                                <button
                                                        type='button'
                                                        onClick={handleIncrease}
                                                        className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-primary/30 bg-white text-brand-text transition hover:border-brand-primary hover:shadow-golden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70'
                                                        aria-label={t("cart.item.increase")}
                                                >
                                                        <Plus className='h-3.5 w-3.5' />
                                                </button>
                                        </div>

                                        <button
                                                type='button'
                                                onClick={handleRemove}
                                                className='inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300'
                                                aria-label={t("cart.item.remove")}
                                        >
                                                <Trash2 className='h-3.5 w-3.5' />
                                                <span className='hidden sm:inline'>{t("cart.item.remove")}</span>
                                        </button>
                                </div>
                        </div>
                </article>
        );
};
export default CartItem;
