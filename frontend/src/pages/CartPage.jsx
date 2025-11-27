import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import CartItem from "../components/CartItem";
import OrderSummary from "../components/OrderSummary";

const CartPage = () => {
        const { cart } = useCartStore();
        const { t } = useTranslation();
        const leadText = t("cart.summary.lead");

        return (
                <div className='min-h-screen bg-brand-bg py-10 text-brand-text sm:py-16' dir='rtl'>
                        <div className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
                                <header className='space-y-2 text-center md:text-right'>
                                        <h1 className='text-[clamp(2rem,4vw,2.6rem)] font-bold text-brand-text'>{t("cart.title")}</h1>
                                        {leadText && <p className='text-sm text-brand-muted'>{leadText}</p>}
                                </header>

                                <section className='mt-8 space-y-5'>
                                        {cart.length === 0 ? (
                                                <EmptyCartUI t={t} />
                                        ) : (
                                                <div className='space-y-4'>
                                                        {cart.map((item) => (
                                                                <CartItem key={item._id} item={item} />
                                                        ))}
                                                </div>
                                        )}
                                </section>

                                {cart.length > 0 && (
                                        <div className='mt-10'>
                                                <OrderSummary />
                                        </div>
                                )}
                        </div>
                </div>
        );
};
export default CartPage;

const EmptyCartUI = ({ t }) => (
        <motion.div
                className='flex flex-col items-center justify-center space-y-4 rounded-3xl border border-brand-primary/20 bg-white px-8 py-16 text-center shadow-sm'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
        >
                <ShoppingCart className='h-20 w-20 text-brand-primary' />
                <h3 className='text-[clamp(1.5rem,3vw,1.9rem)] font-semibold text-brand-text'>{t("cart.empty.title")}</h3>
                <p className='max-w-md text-sm text-brand-muted'>{t("cart.empty.description")}</p>
                <Link
                        className='mt-4 inline-flex min-h-[3rem] min-w-[12rem] items-center justify-center rounded-full bg-brand-primary px-6 text-sm font-semibold text-brand-text transition duration-300 hover:shadow-golden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                        to='/'
                >
                        {t("cart.empty.cta")}
                </Link>
        </motion.div>
);
