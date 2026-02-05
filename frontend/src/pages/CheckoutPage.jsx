import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";
import { getProductPricing } from "../lib/getProductPricing";
import apiClient from "../lib/apiClient";

const CheckoutPage = () => {
        const { cart, total, subtotal, clearCart } = useCartStore();
        const navigate = useNavigate();
        const [isSubmitting, setIsSubmitting] = useState(false);
        const { t } = useTranslation();

        useEffect(() => {
                if (cart.length === 0) {
                        toast.error(t("common.messages.cartEmptyToast"));
                        navigate("/cart", { replace: true });
                }
        }, [cart, navigate, t]);

        const handleSubmit = async (event) => {
                event.preventDefault();
                if (cart.length === 0) return;

                setIsSubmitting(true);
                try {
                        const items = cart.map((item) => {
                                const { discountedPrice } = getProductPricing(item);
                                return {
                                        productId: item._id,
                                        quantity: item.quantity,
                                        price: discountedPrice,
                                };
                        });

                        const order = await apiClient.post("/orders", {
                                items,
                        });

                        await clearCart();
                        toast.success("تم إنشاء طلبك بنجاح. يرجى رفع إثبات الدفع.");
                        navigate(`/orders/${order._id}/payment`, { state: { order } });
                } catch (error) {
                        toast.error(error.response?.data?.message || "تعذر إنشاء الطلب");
                } finally {
                        setIsSubmitting(false);
                }
        };

        const savings = Math.max(subtotal - total, 0);

        return (
                <div className='py-10'>
                        <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 lg:flex-row'>
                                <motion.section className='w-full rounded-xl border border-payzone-indigo/40 bg-white/5 p-6 shadow-lg backdrop-blur-sm'>
                                        <h1 className='mb-4 text-2xl font-bold text-payzone-gold'>{t("checkout.title")}</h1>
                                        <p className='mb-6 text-sm text-white/70'>
                                                سيتم إنشاء طلبك في النظام وحجز المخزون لمدة 15 دقيقة حتى رفع إثبات الدفع.
                                        </p>
                                        <button
                                                type='button'
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || cart.length === 0}
                                                className='w-full rounded-lg bg-payzone-gold px-5 py-3 text-base font-semibold text-payzone-navy transition duration-300 hover:bg-[#b8873d] disabled:opacity-50'
                                        >
                                                {isSubmitting ? "جاري إنشاء الطلب..." : "إنشاء الطلب والمتابعة للدفع"}
                                        </button>
                                </motion.section>

                                <motion.aside className='w-full rounded-xl border border-payzone-indigo/40 bg-white/5 p-6 shadow-lg backdrop-blur-sm lg:max-w-sm'>
                                        <h2 className='text-xl font-semibold text-payzone-gold'>{t("checkout.summary.title")}</h2>
                                        <ul className='mt-4 space-y-3 text-sm text-white/70'>
                                                {cart.map((item) => {
                                                        const { price, discountedPrice, isDiscounted } = getProductPricing(item);
                                                        return (
                                                                <li key={item._id} className='flex justify-between gap-4'>
                                                                        <span className='font-medium text-white'>{item.name}</span>
                                                                        <span className='flex flex-col items-end'>
                                                                                {isDiscounted && (
                                                                                        <span className='text-xs text-white/50 line-through'>
                                                                                                {formatNumberEn(item.quantity)} × {formatMRU(price)}
                                                                                        </span>
                                                                                )}
                                                                                <span>
                                                                                        {formatNumberEn(item.quantity)} × {formatMRU(discountedPrice)}
                                                                                </span>
                                                                        </span>
                                                                </li>
                                                        );
                                                })}
                                        </ul>
                                        <div className='mt-6 space-y-2 border-t border-white/10 pt-4 text-sm text-white/70'>
                                                <div className='flex justify-between'>
                                                        <span>{t("checkout.summary.subtotal")}</span>
                                                        <span>{formatMRU(subtotal)}</span>
                                                </div>
                                                {savings > 0 && (
                                                        <div className='flex justify-between text-payzone-gold'>
                                                                <span>{t("checkout.summary.savings")}</span>
                                                                <span>-{formatMRU(savings)}</span>
                                                        </div>
                                                )}
                                                <div className='flex justify-between text-base font-semibold text-white'>
                                                        <span>{t("checkout.summary.total")}</span>
                                                        <span>{formatMRU(total)}</span>
                                                </div>
                                        </div>
                                </motion.aside>
                        </div>
                </div>
        );
};

export default CheckoutPage;
