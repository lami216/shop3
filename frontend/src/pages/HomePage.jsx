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

        const bestSellerProducts = useMemo(() => {
                if (!Array.isArray(products) || products.length === 0) return [];

                const productsWithSales = products
                        .slice()
                        .sort((a, b) => Number(b?.totalSales || 0) - Number(a?.totalSales || 0));

                const topProduct = productsWithSales[0];

                if (Number(topProduct?.totalSales || 0) >= 2) {
                        return productsWithSales.slice(0, 4);
                }

                const randomizedProducts = products.slice();
                for (let index = randomizedProducts.length - 1; index > 0; index -= 1) {
                        const randomIndex = Math.floor(Math.random() * (index + 1));
                        [randomizedProducts[index], randomizedProducts[randomIndex]] = [
                                randomizedProducts[randomIndex],
                                randomizedProducts[index],
                        ];
                }

                return randomizedProducts.slice(0, 4);
        }, [products]);

        const featuredOffers = useMemo(() => {
                if (!Array.isArray(products)) return [];
                return products.filter((product) => product?.isFeatured === true);
        }, [products]);

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

                                <HeroSlider slides={slides} />

                                <div className='space-y-10'>
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
                                                        {!productsLoading && bestSellerProducts.length > 0 && (
                                                                <FeaturedProducts featuredProducts={bestSellerProducts} />
                                                        )}

                                                        <section className='space-y-6 py-10'>
                                                                <header className='text-right'>
                                                                        <h2 className='text-2xl font-semibold text-[#111111]'>فئاتنا</h2>
                                                                </header>

                                                                <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
                                                                        <div className='flex min-w-max gap-4 pb-2'>
                                                                                {categories.length === 0 && !categoriesLoading && (
                                                                                        <div className='rounded-2xl bg-white px-6 py-10 text-center text-brand-muted shadow-sm'>
                                                                                                {t("categories.manager.list.empty")}
                                                                                        </div>
                                                                                )}
                                                                                {categories.map((category) => (
                                                                                        <div className='w-40 flex-shrink-0 sm:w-48' key={category._id}>
                                                                                                <CategoryItem category={category} />
                                                                                        </div>
                                                                                ))}
                                                                        </div>
                                                                </div>
                                                        </section>

                                                        {!productsLoading && featuredOffers.length > 0 && (
                                                                <section className='space-y-6 py-10'>
                                                                        <header className='text-right'>
                                                                                <h2 className='text-2xl font-semibold text-[#111111]'>العروض المميزة</h2>
                                                                        </header>
                                                                        <div className='grid gap-4 grid-cols-2 lg:grid-cols-3'>
                                                                                {featuredOffers.slice(0, 6).map((product) => (
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
