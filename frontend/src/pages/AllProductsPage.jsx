import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import useTranslation from "../hooks/useTranslation";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";

const AllProductsPage = () => {
        const { fetchAllProducts, products, loading } = useProductStore();
        const { t } = useTranslation();

        useEffect(() => {
                fetchAllProducts();
        }, [fetchAllProducts]);

        const hasProducts = Array.isArray(products) && products.length > 0;
        const productCount = useMemo(() => (hasProducts ? products.length : 0), [hasProducts, products]);

        return (
                <div className='min-h-screen bg-brand-bg text-brand-text'>
                        <div className='mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8'>
                                <motion.div
                                        className='mb-12 space-y-4 text-center'
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                >
                                        <span className='inline-flex items-center justify-center rounded-full border border-brand-primary/40 px-5 py-1 text-xs uppercase tracking-[0.45em] text-brand-muted'>
                                                collection
                                        </span>
                                        <h1 className='text-[clamp(2rem,5vw,3.25rem)] font-semibold text-brand-primary'>
                                                {t("allProducts.title")}
                                        </h1>
                                        <p className='mx-auto max-w-3xl text-sm text-brand-muted'>
                                                {t("allProducts.subtitle")}
                                        </p>
                                        {hasProducts && (
                                                <p className='text-xs uppercase tracking-[0.35em] text-brand-muted/70'>
                                                        {t("allProducts.count", { count: productCount })}
                                                </p>
                                        )}
                                </motion.div>

                                {loading ? (
                                        <div className='rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-brand-muted'>
                                                {t("allProducts.loading")}
                                        </div>
                                ) : !hasProducts ? (
                                        <div className='rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-brand-muted'>
                                                {t("allProducts.empty")}
                                        </div>
                                ) : (
                                        <motion.div
                                                className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: 0.15 }}
                                        >
                                                {products.map((product) => (
                                                        <ProductCard key={product._id} product={product} />
                                                ))}
                                        </motion.div>
                                )}
                        </div>
                </div>
        );
};

export default AllProductsPage;
