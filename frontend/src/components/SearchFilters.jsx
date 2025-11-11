import { SlidersHorizontal } from "lucide-react";
import useTranslation from "../hooks/useTranslation";

const SearchFilters = ({
        categories = [],
        selectedCategories = [],
        onCategoriesChange,
        priceRange = { min: "", max: "" },
        onPriceChange,
        onReset,
        showPriceFilter = true,
}) => {
        const { t } = useTranslation();

        const handleCategoryToggle = (categoryId) => {
                if (!categoryId) return;
                if (typeof onCategoriesChange !== "function") return;

                const exists = selectedCategories.includes(categoryId);
                if (exists) {
                        onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
                } else {
                        onCategoriesChange([...selectedCategories, categoryId]);
                }
        };

        const handlePriceChange = (key, value) => {
                if (typeof onPriceChange !== "function") return;
                onPriceChange({ ...priceRange, [key]: value });
        };

        return (
                <section className='rounded-3xl border border-brand-primary/20 bg-black/40 p-6 shadow-golden sm:p-8'>
                        <header className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='flex items-center gap-3 text-brand-text'>
                                        <span className='flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary'>
                                                <SlidersHorizontal size={20} />
                                        </span>
                                        <div>
                                                <p className='text-sm uppercase tracking-[0.45em] text-brand-muted'>
                                                        {t("home.search.filters.label")}
                                                </p>
                                                <h3 className='text-lg font-semibold text-brand-text'>
                                                        {t("home.search.filters.title")}
                                                </h3>
                                        </div>
                                </div>
                                <button
                                        type='button'
                                        onClick={onReset}
                                        className='text-xs font-medium uppercase tracking-[0.35em] text-brand-muted transition duration-150 ease-out hover:text-brand-primary'
                                >
                                        {t("home.search.filters.reset")}
                                </button>
                        </header>

                        <div className='grid gap-6 md:grid-cols-[2fr,1fr]'>
                                <div>
                                        <h4 className='mb-3 text-sm font-semibold text-brand-text'>
                                                {t("home.search.filters.categories")}
                                        </h4>
                                        <div className='flex flex-wrap gap-3'>
                                                {categories.length === 0 ? (
                                                        <p className='text-sm text-brand-muted'>
                                                                {t("home.search.filters.noCategories")}
                                                        </p>
                                                ) : (
                                                        categories.map((category) => {
                                                                const isSelected = selectedCategories.includes(category.value);
                                                                return (
                                                                        <button
                                                                                key={category.value}
                                                                                type='button'
                                                                                onClick={() => handleCategoryToggle(category.value)}
                                                                                className={`rounded-full border px-4 py-2 text-sm transition duration-150 ease-out ${
                                                                                        isSelected
                                                                                                ? "border-brand-primary bg-brand-primary/20 text-brand-primary shadow-golden"
                                                                                                : "border-white/10 bg-white/5 text-brand-muted hover:border-brand-primary/40"
                                                                                }`}
                                                                        >
                                                                                {category.label}
                                                                        </button>
                                                                );
                                                        })
                                                )}
                                        </div>
                                </div>

                                {showPriceFilter && (
                                        <div className='space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4'>
                                                <h4 className='text-sm font-semibold text-brand-text'>
                                                        {t("home.search.filters.price")}
                                                </h4>
                                                <div className='space-y-3'>
                                                        <label className='flex flex-col text-sm text-brand-muted'>
                                                                {t("home.search.filters.minPrice")}
                                                                <input
                                                                        type='number'
                                                                        value={priceRange.min}
                                                                        onChange={(event) => handlePriceChange("min", event.target.value)}
                                                                        className='mt-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-brand-text outline-none transition focus:border-brand-primary'
                                                                        placeholder={t("home.search.filters.minPlaceholder")}
                                                                />
                                                        </label>
                                                        <label className='flex flex-col text-sm text-brand-muted'>
                                                                {t("home.search.filters.maxPrice")}
                                                                <input
                                                                        type='number'
                                                                        value={priceRange.max}
                                                                        onChange={(event) => handlePriceChange("max", event.target.value)}
                                                                        className='mt-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-brand-text outline-none transition focus:border-brand-primary'
                                                                        placeholder={t("home.search.filters.maxPlaceholder")}
                                                                />
                                                        </label>
                                                </div>
                                        </div>
                                )}
                        </div>
                </section>
        );
};

export default SearchFilters;
