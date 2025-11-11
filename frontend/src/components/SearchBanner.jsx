import { Link } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import useTranslation from "../hooks/useTranslation";

const SearchBanner = ({
        query,
        onQueryChange,
        onClear,
        hasResults,
        totalCount,
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
                <section className='relative z-10 -mt-12 w-full rounded-3xl border border-brand-primary/25 bg-brand-bg/90 p-6 shadow-golden backdrop-blur-md sm:-mt-16 sm:p-10'>
                        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
                                <div className='space-y-3'>
                                        <p className='text-sm uppercase tracking-[0.55em] text-brand-muted'>
                                                اكتشف عطر أحلامك
                                        </p>
                                        <h2 className='text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-brand-text'>
                                                ابحث وصنّف ضمن تشكيلة &quot;الصاحب&quot;
                                        </h2>
                                        <p className='max-w-2xl text-sm text-brand-muted'>
                                                النتائج تظهر مباشرة أثناء الكتابة، ويمكنك تصفح جميع المنتجات بضغطة واحدة.
                                        </p>
                                </div>
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
                        </div>

                        <div className='mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6 text-sm text-brand-muted'>
                                <div className='flex items-center gap-2'>
                                        <span className='inline-flex h-8 items-center rounded-full border border-brand-primary/40 px-3 uppercase tracking-[0.35em] text-xs text-brand-muted'>
                                                live search
                                        </span>
                                        {isLoading ? (
                                                <span className='flex items-center gap-2 text-brand-muted'>
                                                        <Loader2 className='h-4 w-4 animate-spin text-brand-primary' />
                                                        <span>جاري جلب النتائج...</span>
                                                </span>
                                        ) : hasResults ? (
                                                <span>
                                                        تم العثور على <strong className='text-brand-primary'>{totalCount}</strong> عنصر
                                                </span>
                                        ) : (
                                                <span>ابدأ الكتابة لمشاهدة النتائج الفورية</span>
                                        )}
                                </div>
                                <div className='flex flex-col gap-4 text-xs uppercase tracking-[0.35em] text-brand-muted sm:flex-row sm:items-center sm:gap-6'>
                                        <div className='flex flex-wrap items-center gap-3 text-[0.7rem] normal-case sm:text-xs'>
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
                                        <Link to={allProductsPath} className='golden-button text-xs uppercase tracking-[0.45em]'>
                                                {t("home.search.allProductsButton")}
                                        </Link>
                                </div>
                        </div>
                </section>
        );
};

export default SearchBanner;
