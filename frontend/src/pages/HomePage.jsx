import { useEffect, useMemo, useState } from "react";
import useTranslation from "../hooks/useTranslation";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";
import { selectRootCategories, useCategoryStore } from "../stores/useCategoryStore";
import HeroSlider from "../components/HeroSlider";
import SearchBanner from "../components/SearchBanner";
import ProductCard from "../components/ProductCard";

const HomePage = () => {
        const { fetchFeaturedProducts, products, loading: productsLoading } = useProductStore();
        const fetchCategories = useCategoryStore((state) => state.fetchCategories);
        const categoriesLoading = useCategoryStore((state) => state.loading);
        const rootCategories = useCategoryStore(selectRootCategories);
        const { t } = useTranslation();
        const [searchQuery, setSearchQuery] = useState("");
        const [showAllProducts, setShowAllProducts] = useState(false);

        useEffect(() => {
                fetchFeaturedProducts();
        }, [fetchFeaturedProducts]);

        useEffect(() => {
                fetchCategories({ rootOnly: true });
        }, [fetchCategories]);

        const slides = useMemo(() => {
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

        const normalizedQuery = searchQuery.trim().toLowerCase();

        const filteredProducts = useMemo(() => {
                if (!Array.isArray(products)) return [];
                if (!normalizedQuery) return products;

                return products.filter((product) => {
                        const name = String(product.name || "").toLowerCase();
                        const description = String(product.description || "").toLowerCase();
                        const categories = Array.isArray(product.categoryDetails)
                                ? product.categoryDetails.map((category) => category?.name || "").join(" ").toLowerCase()
                                : String(product.category || "").toLowerCase();

                        return (
                                name.includes(normalizedQuery) ||
                                description.includes(normalizedQuery) ||
                                categories.includes(normalizedQuery)
                        );
                });
        }, [normalizedQuery, products]);

        const showOnlySearchResults = normalizedQuery.length > 0;

        const visibleProducts = useMemo(() => {
                if (showOnlySearchResults) return filteredProducts;
                if (showAllProducts) return products;
                return Array.isArray(products) ? products.slice(0, 6) : [];
        }, [filteredProducts, products, showAllProducts, showOnlySearchResults]);

        const handleQueryChange = (value) => {
                setSearchQuery(value);
                if (value.trim()) {
                        setShowAllProducts(false);
                }
        };

        const handleClearSearch = () => {
                setSearchQuery("");
        };

        const handleShowAll = () => {
                setShowAllProducts(true);
                setSearchQuery("");
        };

        return (
                <div className='relative min-h-screen overflow-hidden bg-brand-bg text-brand-text'>
                        <div className='relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-8 sm:px-6 lg:px-8'>
                                <HeroSlider slides={slides} />

                                <SearchBanner
                                        query={searchQuery}
                                        onQueryChange={handleQueryChange}
                                        onClear={handleClearSearch}
                                        onShowAll={handleShowAll}
                                        hasResults={showOnlySearchResults ? filteredProducts.length > 0 : showAllProducts}
                                        totalCount={showOnlySearchResults ? filteredProducts.length : products?.length || 0}
                                />

                                {showOnlySearchResults ? (
                                        <section className='space-y-8'>
                                                <header className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
                                                        <h2 className='text-[clamp(1.5rem,3vw,2.25rem)] font-semibold text-brand-primary'>
                                                                نتائج البحث
                                                        </h2>
                                                        <span className='text-sm text-brand-muted'>
                                                                {filteredProducts.length}
                                                                <span className='mr-2 text-brand-muted/70'>عناصر مطابقة</span>
                                                        </span>
                                                </header>
                                                {filteredProducts.length === 0 ? (
                                                        <p className='rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-brand-muted'>
                                                                {t("categories.manager.list.empty")}
                                                        </p>
                                                ) : (
                                                        <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
                                                                {filteredProducts.map((product) => (
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

                                                <section className='space-y-8 rounded-3xl border border-brand-primary/15 bg-black/50 px-6 py-10 shadow-golden sm:px-10'>
                                                        <header className='flex flex-col gap-2 text-right'>
                                                                <p className='text-sm uppercase tracking-[0.55em] text-brand-muted'>
                                                                        الفئات المميزة
                                                                </p>
                                                                <h2 className='text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-brand-primary'>
                                                                        استكشف عالم الصاحب للعطور
                                                                </h2>
                                                                <p className='text-sm text-brand-muted'>
                                                                        اختر فئة لتتعرف على تشكيلتها الخاصة من العطور المنتقاة بعناية.
                                                                </p>
                                                        </header>

                                                        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                                                                {rootCategories.length === 0 && !categoriesLoading && (
                                                                        <div className='col-span-full rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-brand-muted'>
                                                                                {t("categories.manager.list.empty")}
                                                                        </div>
                                                                )}
                                                                {rootCategories.map((category) => (
                                                                        <CategoryItem category={category} key={category._id} />
                                                                ))}
                                                        </div>
                                                </section>
                                        </>
                                )}
                        </div>
                </div>
        );
};
export default HomePage;
