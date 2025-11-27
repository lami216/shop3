import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";

const OrderSummary = () => {
        const { cart, total } = useCartStore();
        const navigate = useNavigate();
        const { t } = useTranslation();

        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        const isDisabled = totalQuantity === 0;

        const handleCheckout = () => {
                if (isDisabled) return;
                navigate("/checkout");
        };

        return (
                <motion.section
                        className='space-y-5 rounded-3xl border border-brand-primary/20 bg-white p-6 text-brand-text shadow-sm'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        dir='rtl'
                >
                        <h2 className='text-[clamp(1.4rem,3.2vw,1.7rem)] font-semibold text-brand-text text-right'>
                                {t("cart.summary.title")}
                        </h2>

                        <div className='space-y-3 rounded-2xl border border-brand-primary/15 bg-brand-bg p-5 text-[clamp(0.95rem,2.4vw,1rem)] text-brand-text shadow-sm'>
                                <div className='flex items-center justify-between'>
                                        <span>{t("cart.summary.productsCount")}</span>
                                        <span className='text-[clamp(1.05rem,2.6vw,1.2rem)] font-semibold text-brand-text'>
                                                {formatNumberEn(totalQuantity)}
                                        </span>
                                </div>
                                <div className='flex items-center justify-between border-t border-brand-primary/20 pt-3 text-[clamp(1.1rem,2.8vw,1.3rem)] font-semibold'>
                                        <span className='text-brand-primary'>{t("cart.summary.grandTotal")}</span>
                                        <span className='text-brand-text'>{formatMRU(total)}</span>
                                </div>
                        </div>

                        <motion.button
                                type='button'
                                className='w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-brand-text transition-colors duration-300 hover:shadow-golden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 md:w-1/2 md:self-end'
                                whileHover={!isDisabled ? { scale: 1.02 } : undefined}
                                whileTap={!isDisabled ? { scale: 0.97 } : undefined}
                                onClick={handleCheckout}
                                disabled={isDisabled}
                        >
                                {t("cart.summary.proceed")}
                        </motion.button>
                </motion.section>
        );
};
export default OrderSummary;
