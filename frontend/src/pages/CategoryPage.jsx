import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import useTranslation from "../hooks/useTranslation";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";
import { useCategoryStore } from "../stores/useCategoryStore";

const CategoryPage = () => {
        const { fetchProductsByCategory, products } = useProductStore();
        const categories = useCategoryStore((state) => state.categories);
        const fetchCategories = useCategoryStore((state) => state.fetchCategories);
        const fetchCategoryChildren = useCategoryStore((state) => state.fetchCategoryChildren);
        const [childCategories, setChildCategories] = useState([]);
        const [childrenLoading, setChildrenLoading] = useState(false);
        const { category } = useParams();
        const { t } = useTranslation();

        useEffect(() => {
                fetchProductsByCategory(category);
        }, [fetchProductsByCategory, category]);

        const currentCategory = useMemo(
                () => categories.find((item) => item.slug === category),
                [categories, category]
        );

        useEffect(() => {
                if (!categories.length || (category && !currentCategory)) {
                        fetchCategories({ rootOnly: false });
                }
        }, [categories.length, category, currentCategory, fetchCategories]);

        const currentCategoryId = currentCategory?._id;

        useEffect(() => {
                let ignore = false;

                const loadChildren = async () => {
                        if (!currentCategoryId) {
                                setChildCategories([]);
                                return;
                        }

                        setChildrenLoading(true);
                        try {
                                const children = await fetchCategoryChildren(currentCategoryId);
                                if (!ignore) {
                                        setChildCategories(children);
                                }
                        } catch (error) {
                                if (!ignore) {
                                        setChildCategories([]);
                                        toast.error(t("toast.categoryFetchError"));
                                }
                        } finally {
                                if (!ignore) {
                                        setChildrenLoading(false);
                                }
                        }
                };

                loadChildren();

                return () => {
                        ignore = true;
                };
        }, [currentCategoryId, fetchCategoryChildren, t]);

        const categoryName = useMemo(() => {
                if (currentCategory) {
                        return currentCategory.name;
                }
                const fallback = category ? category.charAt(0).toUpperCase() + category.slice(1) : "";
                return fallback;
        }, [currentCategory, category]);

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

                                {currentCategory && (
                                        <motion.section
                                                className='mb-10'
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: 0.15 }}
                                        >
                                                <h2 className='mb-4 text-2xl font-semibold text-payzone-gold'>
                                                        {t("categoryPage.childrenTitle")}
                                                </h2>
                                                {childrenLoading ? (
                                                        <p className='text-sm text-white/70'>
                                                                {t("common.loading")}
                                                        </p>
                                                ) : childCategories.length > 0 ? (
                                                        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                                                {childCategories.map((child) => (
                                                                        <Link
                                                                                to={`/category/${child.slug}`}
                                                                                key={child._id}
                                                                                className='group overflow-hidden rounded-xl border border-white/10 bg-payzone-navy/40 transition hover:border-payzone-gold hover:bg-payzone-navy/60'
                                                                        >
                                                                                <div className='relative h-48 w-full'>
                                                                                        <img
                                                                                                src={child.imageUrl}
                                                                                                alt={child.name}
                                                                                                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                                                                                                loading='lazy'
                                                                                        />
                                                                                        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-payzone-navy/90 via-payzone-navy/50 to-transparent p-4'>
                                                                                                <p className='text-lg font-semibold text-white'>
                                                                                                        {child.name}
                                                                                                </p>
                                                                                                {child.description && (
                                                                                                        <p className='mt-1 text-xs text-white/70'>
                                                                                                                {child.description}
                                                                                                        </p>
                                                                                                )}
                                                                                        </div>
                                                                                </div>
                                                                        </Link>
                                                                ))}
                                                        </div>
                                                ) : (
                                                        <p className='text-sm text-white/70'>
                                                                {t("categoryPage.noChildren")}
                                                        </p>
                                                )}
                                        </motion.section>
                                )}

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
