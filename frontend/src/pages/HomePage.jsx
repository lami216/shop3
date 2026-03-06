import { useEffect, useMemo, useState } from "react";
import useTranslation from "../hooks/useTranslation";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";
import { useCategoryStore } from "../stores/useCategoryStore";
import HeroSlider from "../components/HeroSlider";
import SearchBanner from "../components/SearchBanner";
import ProductCard from "../components/ProductCard";
import { useHeroSliderStore } from "../stores/useHeroSliderStore";

const HomePage = () => {
        const {
                fetchAllProducts,
                products,
                loading: productsLoading,
                searchResults,
                searchLoading,
                searchProducts,
                clearSearchResults,
        } = useProductStore();
        const fetchCategories = useCategoryStore((state) => state.fetchCategories);
        const categoriesLoading = useCategoryStore((state) => state.loading);
        const categories = useCategoryStore((state) => state.categories);
        const { slides: heroSlides, fetchSlides } = useHeroSliderStore();
        const { t } = useTranslation();
        const [searchQuery, setSearchQuery] = useState("");

        useEffect(() => {
                fetchAllProducts();
        }, [fetchAllProducts]);

        useEffect(() => {
                fetchCategories();
        }, [fetchCategories]);

        useEffect(() => {
                fetchSlides();
        }, [fetchSlides]);

        const offersSectionData = useMemo(() => (Array.isArray(heroSlides) ? heroSlides : []), [heroSlides]);

        const normalizedQuery = searchQuery.trim().toLowerCase();
        const showOnlySearchResults = normalizedQuery.length > 0;

        const bestSellerProducts = useMemo(() => {
                if (!Array.isArray(products)) return [];

                const sortedProducts = [...products].sort(
                        (a, b) => Number(b?.totalSales || 0) - Number(a?.totalSales || 0)
                );

                const topSales = Number(sortedProducts[0]?.totalSales || 0);
                const secondSales = Number(sortedProducts[1]?.totalSales || 0);
                const hasRealBestSeller = sortedProducts.length > 0 && topSales > secondSales;

                if (hasRealBestSeller) {
                        return sortedProducts.slice(0, 4);
                }

                const shuffledProducts = [...products].sort(() => Math.random() - 0.5);
                return shuffledProducts.slice(0, 4);
        }, [products]);

        const selectedProducts = useMemo(() => {
                if (!Array.isArray(products)) return [];
                return products.slice(4, 10);
        }, [products]);

        const firstRowCategories = useMemo(
                () => categories.filter((category) => (category.displayRow === 2 ? false : true)),
                [categories]
        );

        const secondRowCategories = useMemo(
                () => categories.filter((category) => category.displayRow === 2),
                [categories]
        );

        const handleQueryChange = (value) => {
                setSearchQuery(value);
        };

        const handleClearSearch = () => {
                setSearchQuery("");
                clearSearchResults();
        };

        useEffect(() => {
                const handler = setTimeout(() => {
                        if (showOnlySearchResults) {
                                searchProducts({
                                        query: searchQuery,
                                }).catch(() => {});
                        } else {
                                clearSearchResults();
                        }
                }, 400);

                return () => clearTimeout(handler);
        }, [showOnlySearchResults, searchProducts, searchQuery, clearSearchResults]);

        return (
                <div className='relative min-h-screen bg-brand-bg text-brand-text'>
                        <div className='relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-24 pt-6 sm:px-6 lg:px-8'>
                                <SearchBanner
                                        query={searchQuery}
                                        onQueryChange={handleQueryChange}
                                        onClear={handleClearSearch}
                                        isLoading={showOnlySearchResults && searchLoading}
                                />

                                {offersSectionData.length > 0 && <HeroSlider slides={offersSectionData} />}

                                <div className='main-content space-y-10'>
                                        {showOnlySearchResults ? (
                                                <section className='space-y-6 py-10'>
                                                        <header className='text-right'>
                                                                <h2 className='text-2xl font-semibold text-[#111111]'>نتائج البحث</h2>
                                                        </header>
                                                        {searchLoading ? (
                                                                <p className='rounded-2xl bg-white px-6 py-10 text-center text-brand-muted shadow-sm'>
                                                                        {t("common.loading")}
                                                                </p>
                                                        ) : searchResults.length === 0 ? (
                                                                <p className='rounded-2xl bg-white px-6 py-10 text-center text-brand-muted shadow-sm'>
                                                                        {t("home.search.noResults")}
                                                                </p>
                                                        ) : (
                                                                <div className='grid gap-4 grid-cols-2 lg:grid-cols-3'>
                                                                        {searchResults.map((product) => (
                                                                                <ProductCard key={product._id} product={product} />
                                                                        ))}
                                                                </div>
                                                        )}
                                                </section>
                                        ) : (
                                                <>
                                                        <FeaturedProducts featuredProducts={bestSellerProducts} />

                                                        <div className='flex justify-center'>
                                                                <a
                                                                        href='/products'
                                                                        className='golden-button w-full max-w-sm justify-center text-base font-semibold'
                                                                        onClick={handleClearSearch}
                                                                >
                                                                        كل المنتجات
                                                                </a>
                                                        </div>

                                                        <section className='space-y-6 py-10'>
                                                                <header className='text-right'>
                                                                        <h2 className='text-2xl font-semibold text-[#111111]'>فئاتنا</h2>
                                                                </header>

                                                                <div className='space-y-4'>
                                                                        {categories.length === 0 && !categoriesLoading && (
                                                                                <div className='rounded-2xl bg-white px-6 py-10 text-center text-brand-muted shadow-sm'>
                                                                                        {t("categories.manager.list.empty")}
                                                                                </div>
                                                                        )}

                                                                        <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
                                                                                <div className='flex min-w-max gap-4 pb-2'>
                                                                                        {firstRowCategories.map((category) => (
                                                                                                <div className='w-40 flex-shrink-0 sm:w-48' key={category._id}>
                                                                                                        <CategoryItem category={category} />
                                                                                                </div>
                                                                                        ))}
                                                                                </div>
                                                                        </div>

                                                                        <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
                                                                                <div className='flex min-w-max gap-4 pb-2'>
                                                                                        {secondRowCategories.map((category) => (
                                                                                                <div className='w-40 flex-shrink-0 sm:w-48' key={category._id}>
                                                                                                        <CategoryItem category={category} />
                                                                                                </div>
                                                                                        ))}
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </section>

                                                        {!productsLoading && selectedProducts.length > 0 && (
                                                                <section className='space-y-6 py-10'>
                                                                        <header className='text-right'>
                                                                                <h2 className='text-2xl font-semibold text-[#111111]'>منتجات مختارة</h2>
                                                                        </header>
                                                                        <div className='grid gap-4 grid-cols-2 lg:grid-cols-3'>
                                                                                {selectedProducts.map((product) => (
                                                                                        <ProductCard key={product._id} product={product} />
                                                                                ))}
                                                                        </div>
                                                                </section>
                                                        )}
                                                </>
                                        )}
                                </div>
                        </div>
                </div>
        );
};

export default HomePage;
