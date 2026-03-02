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
      className='space-y-5 rounded-3xl border border-brand-primary/10 bg-white p-6 text-brand-text shadow-sm'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      dir='rtl'
    >
      <h2 className='text-[clamp(1.4rem,3.2vw,1.7rem)] font-semibold text-[#111111] text-right'>
        {t("cart.summary.title")}
      </h2>

      <div className='space-y-3 rounded-2xl border border-brand-primary/10 bg-white p-5 text-[clamp(0.95rem,2.4vw,1rem)] text-[#6b7280]'>
        <div className='flex items-center justify-between'>
          <span>{t("cart.summary.productsCount")}</span>
          <span className='text-[clamp(1.05rem,2.6vw,1.2rem)] font-semibold text-[#111111]'>
            {formatNumberEn(totalQuantity)}
          </span>
        </div>
        <div className='flex items-center justify-between border-t border-brand-primary/15 pt-3 text-[clamp(1.1rem,2.8vw,1.3rem)] font-semibold'>
          <span className='text-payzone-gold'>{t("cart.summary.grandTotal")}</span>
          <span className='text-[clamp(1.3rem,3.4vw,1.6rem)] text-payzone-gold'>{formatMRU(total)}</span>
        </div>
      </div>

      <button
        type='button'
        className='w-full rounded-xl bg-payzone-gold px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#b8873d] focus:outline-none focus-visible:ring-2 focus-visible:ring-payzone-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60'
        onClick={handleCheckout}
        disabled={isDisabled}
      >
        {t("cart.summary.proceed")}
      </button>
    </motion.section>
  );
};

export default OrderSummary;
