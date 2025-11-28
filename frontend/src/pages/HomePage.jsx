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
                fetchFeaturedProducts,
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
                fetchFeaturedProducts();
        }, [fetchFeaturedProducts]);

        useEffect(() => {
                fetchCategories();
        }, [fetchCategories]);

        useEffect(() => {
                fetchSlides();
        }, [fetchSlides]);

        const productSlides = useMemo(() => {
                if (!Array.isArray(products)) return [];

                return products.slice(0, 5).map((product) => {
                        const coverImage =
                                product.image ||
                                (Array.isArray(product.images) && product.images.length > 0
                                        ? typeof product.images[0] === "string"
                                                ? product.images[0]
                                                : product.images[0]?.url
                                        : "");

                        return {
                                ...product,
                                title: product.name,
                                description: product.description,
                                image: coverImage,
                        };
                });
        }, [products]);

        const slides = useMemo(() => {
                if (Array.isArray(heroSlides) && heroSlides.length) {
                        return heroSlides;
                }

                return productSlides;
        }, [heroSlides, productSlides]);

        const normalizedQuery = searchQuery.trim().toLowerCase();

        const showOnlySearchResults = normalizedQuery.length > 0;

        const visibleProducts = useMemo(() => {
                if (showOnlySearchResults) return searchResults;
                return Array.isArray(products) ? products.slice(0, 6) : [];
        }, [products, searchResults, showOnlySearchResults]);

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
                <div className='relative min-h-screen overflow-hidden bg-brand-bg text-brand-text'>
                        <div className='relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-24 pt-6 sm:px-6 lg:px-8'>
                                <SearchBanner
                                        query={searchQuery}
                                        onQueryChange={handleQueryChange}
                                        onClear={handleClearSearch}
                                        isLoading={showOnlySearchResults && searchLoading}
                                />

                                <HeroSlider slides={slides} />

                                <div className='space-y-6'>
                                        <div className='flex justify-center'>
                                                <a
                                                        href='/products'
                                                        className='golden-button w-full max-w-sm justify-center text-base font-semibold'
                                                        onClick={handleClearSearch}
                                                >
                                                        كل المنتجات
                                                </a>
                                        </div>

                                {showOnlySearchResults ? (
                                        <section className='space-y-8'>
                                                <header className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
                                                        <h2 className='text-[clamp(1.5rem,3vw,2.25rem)] font-semibold text-brand-primary'>
                                                                نتائج البحث
                                                        </h2>
                                                        <span className='text-sm text-brand-muted'>
                                                                {searchResults.length}
                                                                <span className='mr-2 text-brand-muted/70'>عناصر مطابقة</span>
                                                        </span>
                                                </header>
                                                {searchLoading ? (
                                                        <p className='rounded-2xl border border-brand-primary/15 bg-white px-6 py-10 text-center text-brand-muted shadow-sm'>
                                                                {t("common.loading")}
                                                        </p>
                                                ) : searchResults.length === 0 ? (
                                                        <p className='rounded-2xl border border-brand-primary/15 bg-white px-6 py-10 text-center text-brand-muted shadow-sm'>
                                                                {t("home.search.noResults")}
                                                        </p>
                                                ) : (
                                                        <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
                                                                {searchResults.map((product) => (
                                                                        <ProductCard key={product._id} product={product} />
                                                                ))}
                                                        </div>
                                                )}
                                        </section>
                                ) : (
                                        <>
                                                {!productsLoading && Array.isArray(visibleProducts) && visibleProducts.length > 0 && (
                                                        <FeaturedProducts featuredProducts={visibleProducts} />
                                                )}

                                                <section className='space-y-8 rounded-3xl border border-brand-primary/15 bg-white px-6 py-10 shadow-sm sm:px-10'>
                                                        <header className='flex flex-col gap-2 text-right'>
                                                                <p className='text-sm uppercase tracking-[0.55em] text-brand-muted'>
                                                                        الفئات المميزة
                                                                </p>
                                                                <h2 className='text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-brand-text'>
                                                                        استكشف عالم الصاحب للعطور
                                                                </h2>
                                                                <p className='text-sm text-brand-muted'>
                                                                        اختر فئة لتتعرف على تشكيلتها الخاصة من العطور المنتقاة بعناية.
                                                                </p>
                                                        </header>

                                                        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
                                                                {categories.length === 0 && !categoriesLoading && (
                                                                        <div className='col-span-full rounded-2xl border border-brand-primary/15 bg-white px-6 py-10 text-center text-brand-muted shadow-sm'>
                                                                                {t("categories.manager.list.empty")}
                                                                        </div>
                                                                )}
                                                                {categories.map((category) => (
                                                                        <CategoryItem category={category} key={category._id} />
                                                                ))}
                                                        </div>
                                                </section>
                                        </>
                                )}
                                </div>
                        </div>
                </div>
        );
};
export default HomePage;
