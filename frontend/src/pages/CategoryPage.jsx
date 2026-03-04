import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams } from "react-router-dom";
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

        const categoryDescription = useMemo(() => {
                if (!currentCategory?.description) {
                        return "";
                }

                return currentCategory.description.trim();
        }, [currentCategory]);

        return (
                <div className='min-h-screen bg-[#fafafa] text-[#111111]'>
                        <section className='mx-auto max-w-6xl px-4 py-10'>
                                <div className='mb-8 text-center'>
                                        <h1 className='text-3xl font-semibold text-[#111111]'>{categoryName}</h1>
                                        {categoryDescription && (
                                                <p className='mt-2 text-sm text-[#6b7280]'>{categoryDescription}</p>
                                        )}
                                </div>

                                {products?.length === 0 ? (
                                        <div className='rounded-xl bg-white px-6 py-10 text-center text-[#6b7280] shadow-sm'>
                                                {t("categoryPage.noProducts")}
                                        </div>
                                ) : (
                                        <div className='grid grid-cols-2 gap-4'>
                                                {products?.map((product) => (
                                                        <ProductCard key={product._id} product={product} />
                                                ))}
                                        </div>
                                )}
                        </section>
                </div>
        );
};

export default CategoryPage;
