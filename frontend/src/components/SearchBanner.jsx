import { Loader2, Search, X } from "lucide-react";
import useTranslation from "../hooks/useTranslation";

const SearchBanner = ({
        query,
        onQueryChange,
        onClear,
        isLoading = false,
}) => {
        const { t } = useTranslation();

        return (
                <section className='relative z-10 w-full rounded-3xl border border-brand-primary/25 bg-white p-4 shadow-sm sm:p-6'>
                        <div className='w-full'>
                                <label htmlFor='instant-search' className='sr-only'>بحث عن المنتجات</label>
                                <div className='relative flex items-center rounded-full border border-brand-primary/50 bg-white px-4 py-3 text-brand-text shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] transition focus-within:border-brand-primary focus-within:shadow-golden'>
                                        <Search className='ml-3 h-5 w-5 text-brand-primary' />
                                        <input
                                                id='instant-search'
                                                type='search'
                                                value={query}
                                                onChange={(event) => onQueryChange?.(event.target.value)}
                                                placeholder='ابحث عن العطور أو الكلمات المناسبة'
                                                className='w-full bg-transparent text-sm text-brand-text placeholder:text-brand-muted focus:outline-none'
                                        />
                                        {query && (
                                                <button
                                                        type='button'
                                                        onClick={onClear}
                                                        className='mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-primary/40 text-brand-primary transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/10'
                                                        aria-label='مسح البحث'
                                                >
                                                        <X size={16} />
                                                </button>
                                        )}
                                        {isLoading && <Loader2 className='h-5 w-5 animate-spin text-brand-primary' />}
                                </div>
                        </div>
                        <p className='mt-3 text-xs text-brand-muted'>
                                {t("home.hero.offerFallback")}
                        </p>
                </section>
        );
};

export default SearchBanner;
