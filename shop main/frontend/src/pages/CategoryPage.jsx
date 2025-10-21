import { useEffect, useMemo } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import useTranslation from "../hooks/useTranslation";
import ProductCard from "../components/ProductCard";
import { useCategoryStore } from "../stores/useCategoryStore";

const CategoryPage = () => {
        const { fetchProductsByCategory, products } = useProductStore();
        const { categories, fetchCategories } = useCategoryStore();
        const { category } = useParams();
        const { t } = useTranslation();

        useEffect(() => {
                fetchProductsByCategory(category);
        }, [fetchProductsByCategory, category]);

        useEffect(() => {
                if (!categories.length) {
                        fetchCategories();
                }
        }, [categories.length, fetchCategories]);

        const categoryName = useMemo(() => {
                const match = categories.find((item) => item.slug === category);
                if (match) {
                        return match.name;
                }
                const fallback = category ? category.charAt(0).toUpperCase() + category.slice(1) : "";
                return fallback;
        }, [categories, category]);

        return (
                <div className='min-h-screen'>
                        <div className='relative z-10 mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8'>
                                <motion.h1
                                        className='mb-8 text-center text-4xl font-bold text-payzone-gold sm:text-5xl'
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8 }}
                                >
                                        {categoryName}
                                </motion.h1>

                                <motion.div
                                        className='grid grid-cols-2 gap-6 lg:grid-cols-3 justify-items-center'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                >
                                        {products?.length === 0 && (
                                                <h2 className='col-span-full text-center text-3xl font-semibold text-white/70'>
                                                        {t("categoryPage.noProducts")}
                                                </h2>
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
