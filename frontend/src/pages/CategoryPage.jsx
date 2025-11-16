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
                        fetchCategories({ rootOnly: false });
                }
        }, [categories, category, fetchCategories]);

        const currentCategoryId = currentCategory?._id;

        useEffect(() => {
                setChildCategories([]);
        }, [category]);

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
                        } catch {
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

                                {currentCategory && (
                                        <motion.section
                                                className='mb-16 space-y-8 rounded-3xl border border-brand-primary/15 bg-black/50 px-6 py-8 shadow-golden sm:px-10'
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: 0.15 }}
                                        >
                                                <h2 className='text-[clamp(1.5rem,3vw,2.25rem)] font-semibold text-brand-primary'>
                                                        {t("categoryPage.childrenTitle")}
                                                </h2>
                                                {childrenLoading ? (
                                                        <p className='text-sm text-brand-muted'>{t("common.loading")}</p>
                                                ) : childCategories.length > 0 ? (
                                                        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                                                                {childCategories.map((child) => (
                                                                        <Link
                                                                                to={`/category/${child.slug}`}
                                                                                key={child._id}
                                                                                className='group overflow-hidden rounded-3xl border border-brand-primary/20 bg-black/50 transition duration-200 ease-out hover:border-brand-primary/60 hover:shadow-golden'
                                                                        >
                                                                                <div className='relative h-48 w-full'>
                                                                                        <img
                                                                                                src={child.imageUrl}
                                                                                                alt={child.name}
                                                                                                className='h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105'
                                                                                                loading='lazy'
                                                                                        />
                                                                                        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-brand-text'>
                                                                                                <p className='text-lg font-semibold'>{child.name}</p>
                                                                                                {child.description && (
                                                                                                        <p className='mt-1 text-xs text-brand-muted'>
                                                                                                                {child.description}
                                                                                                        </p>
                                                                                                )}
                                                                                        </div>
                                                                                </div>
                                                                        </Link>
                                                                ))}
                                                        </div>
                                                ) : (
                                                        <p className='rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-sm text-brand-muted'>
                                                                {t("categoryPage.noChildren")}
                                                        </p>
                                                )}
                                        </motion.section>
                                )}

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
