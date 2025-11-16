import { Link } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import useTranslation from "../hooks/useTranslation";

const SearchBanner = ({
        query,
        onQueryChange,
        onClear,
        isLoading = false,
        priceRange = { min: "", max: "" },
        onPriceChange,
        allProductsPath = "/products",
}) => {
        const { t } = useTranslation();

        const handlePriceChange = (key, value) => {
                if (typeof onPriceChange !== "function") return;
                onPriceChange({ ...priceRange, [key]: value });
        };

        return (
                <section className='relative z-10 -mt-10 w-full rounded-3xl border border-brand-primary/25 bg-brand-bg/95 p-4 shadow-golden backdrop-blur-md sm:-mt-14 sm:p-6'>
                        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                                <div className='w-full max-w-xl'>
                                        <label htmlFor='instant-search' className='sr-only'>بحث عن المنتجات</label>
                                        <div className='relative flex items-center rounded-full border border-brand-primary/40 bg-black/60 px-4 py-3 text-brand-text shadow-golden transition focus-within:border-brand-primary'>
                                                <Search className='mr-3 h-5 w-5 text-brand-primary' />
                                                <input
                                                        id='instant-search'
                                                        type='search'
                                                        value={query}
                                                        onChange={(event) => onQueryChange?.(event.target.value)}
                                                        placeholder='ابحث عن العطور، المجموعات أو الكلمات المفتاحية'
                                                        className='w-full bg-transparent text-sm text-brand-text placeholder:text-brand-muted focus:outline-none'
                                                />
                                                {query && (
                                                        <button
                                                                type='button'
                                                                onClick={onClear}
                                                                className='ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-primary/30 text-brand-primary transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/10'
                                                                aria-label='مسح البحث'
                                                        >
                                                                <X size={16} />
                                                        </button>
                                                )}
                                                {isLoading && (
                                                        <Loader2 className='ml-2 h-5 w-5 animate-spin text-brand-primary' />
                                                )}
                                        </div>
                                </div>
                                <Link to={allProductsPath} className='golden-button text-xs uppercase tracking-[0.45em]'>
                                        {t("home.search.allProductsButton")}
                                </Link>
                        </div>

                        <div className='mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-brand-muted'>
                                <label className='flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-[0.7rem] text-brand-text sm:text-xs'>
                                        <span className='text-brand-muted'>{t("home.search.filters.minPrice")}</span>
                                        <input
                                                type='number'
                                                value={priceRange.min}
                                                onChange={(event) => handlePriceChange("min", event.target.value)}
                                                className='w-20 bg-transparent text-right text-brand-text outline-none'
                                                placeholder={t("home.search.filters.minPlaceholder")}
                                        />
                                </label>
                                <label className='flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-[0.7rem] text-brand-text sm:text-xs'>
                                        <span className='text-brand-muted'>{t("home.search.filters.maxPrice")}</span>
                                        <input
                                                type='number'
                                                value={priceRange.max}
                                                onChange={(event) => handlePriceChange("max", event.target.value)}
                                                className='w-20 bg-transparent text-right text-brand-text outline-none'
                                                placeholder={t("home.search.filters.maxPlaceholder")}
                                        />
                                </label>
                        </div>
                </section>
        );
};

export default SearchBanner;
