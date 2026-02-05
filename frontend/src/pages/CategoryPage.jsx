import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import useTranslation from "../hooks/useTranslation";
import ProductCard from "../components/ProductCard";
import { useCategoryStore } from "../stores/useCategoryStore";

const CategoryPage = () => {
        const { fetchProductsByCategory, products } = useProductStore();
        const categories = useCategoryStore((state) => state.categories);
        const fetchCategories = useCategoryStore((state) => state.fetchCategories);
        const { category } = useParams();
        const { t } = useTranslation();

        useEffect(() => {
                fetchProductsByCategory(category);
        }, [fetchProductsByCategory, category]);

        const [currentCategory, setCurrentCategory] = useState(null);

        useEffect(() => {
                if (!category) {
                        setCurrentCategory(null);
                        return;
                }

                const matchedCategory = categories.find((item) => item.slug === category);

                if (matchedCategory) {
                        setCurrentCategory(matchedCategory);
                        return;
                }

                if (categories.length === 0) {
                        setCurrentCategory(null);
                }
        }, [categories, category]);

        useEffect(() => {
                if (
                        !categories.length ||
                        (category && !categories.some((item) => item.slug === category))
                ) {
                        fetchCategories();
                }
        }, [categories, category, fetchCategories]);


        const categoryName = useMemo(() => {
                if (currentCategory) {
                        return currentCategory.name;
                }
                const fallback = category ? category.charAt(0).toUpperCase() + category.slice(1) : "";
                return fallback;
        }, [currentCategory, category]);

        return (
                <div className='min-h-screen bg-brand-bg text-brand-text'>
                        <div className='relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8'>
                                <motion.div
                                        className='mb-14 flex flex-col items-center gap-6 text-center'
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8 }}
                                >
                                        <span className='inline-flex rounded-full border border-brand-primary/40 px-4 py-1 text-xs uppercase tracking-[0.45em] text-brand-muted'>
                                                collection
                                        </span>
                                        <h1 className='text-[clamp(2rem,5vw,3.25rem)] font-semibold text-brand-primary'>
                                                {categoryName}
                                        </h1>
                                        <p className='max-w-3xl text-sm text-brand-muted'>
                                                {t("home.subtitle")}
                                        </p>
                                </motion.div>

                                <motion.div
                                        className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                >
                                        {products?.length === 0 && (
                                                <div className='col-span-full rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-brand-muted'>
                                                        {t("categoryPage.noProducts")}
                                                </div>
                                        )}

                                        {products?.map((product) => (
                                                <ProductCard key={product._id} product={product} />
                                        ))}
                                </motion.div>
                        </div>
                </div>
        );
};
export default CategoryPage;
