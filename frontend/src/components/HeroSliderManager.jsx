import { useEffect, useMemo, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, Trash } from "lucide-react";
import toast from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";
import { useHeroSliderStore } from "../stores/useHeroSliderStore";
import { formatMRU } from "../lib/formatMRU";

const createInitialFormState = () => ({
        title: "",
        price: "",
        imageData: "",
        previewUrl: "",
});

const HeroSliderManager = () => {
        const [formState, setFormState] = useState(createInitialFormState);
        const { t } = useTranslation();
        const { slides, fetchSlides, createSlide, deleteSlide, loading, formLoading } = useHeroSliderStore();

        useEffect(() => {
                fetchSlides();
        }, [fetchSlides]);

        const sortedSlides = useMemo(() => {
                if (!Array.isArray(slides)) return [];

                return [...slides].sort((a, b) => {
                        if (a.order !== b.order) {
                                return a.order - b.order;
                        }

                        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return aDate - bDate;
                });
        }, [slides]);

        const handleFileChange = (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                        reader.onloadend = () => {
                                setFormState((previous) => ({
                                        ...previous,
                                        imageData: reader.result,
                                        previewUrl: reader.result,
                                }));
                        };
                        reader.onerror = () => {
                                toast.error(t("admin.heroSlider.messages.imageReadError"));
                        };
                        reader.readAsDataURL(file);
        };

        const handleChange = (event) => {
                const { name, value } = event.target;
                setFormState((previous) => ({ ...previous, [name]: value }));
        };

        const resetForm = () => {
                setFormState(createInitialFormState);
        };

        const handleSubmit = async (event) => {
                event.preventDefault();
                if (!formState.imageData) {
                        toast.error(t("admin.heroSlider.messages.imageRequired"));
                        return;
                }

                if (!formState.title.trim()) {
                        toast.error(t("admin.heroSlider.messages.titleRequired"));
                        return;
                }

                if (formState.price === "") {
                        toast.error(t("admin.heroSlider.messages.priceRequired"));
                        return;
                }

                const numericPrice = Number(formState.price);
                if (Number.isNaN(numericPrice) || numericPrice < 0) {
                        toast.error(t("admin.heroSlider.messages.priceInvalid"));
                        return;
                }

                try {
                        await createSlide({
                                title: formState.title,
                                price: numericPrice,
                                image: formState.imageData,
                        });
                        resetForm();
                } catch {
                        // errors handled in store
                }
        };

        const handleDelete = (slide) => {
                const confirmed = window.confirm(t("admin.heroSlider.messages.deleteConfirm", { title: slide.title || t("admin.heroSlider.messages.untitled") }));
                if (!confirmed) return;
                deleteSlide(slide._id).catch(() => {});
        };

        return (
                <div className='space-y-12'>
                        <section className='rounded-3xl border border-payzone-indigo/40 bg-white/5 p-6 shadow-lg backdrop-blur-sm sm:p-10'>
                                <header className='mb-6 flex items-center gap-3'>
                                        <span className='flex h-12 w-12 items-center justify-center rounded-full border border-payzone-gold/40 bg-payzone-gold/20 text-payzone-gold'>
                                                <Camera size={22} />
                                        </span>
                                        <div>
                                                <p className='text-sm uppercase tracking-[0.45em] text-white/70'>
                                                        {t("admin.heroSlider.sectionLabel")}
                                                </p>
                                                <h2 className='text-2xl font-semibold text-payzone-gold'>
                                                        {t("admin.heroSlider.sectionTitle")}
                                                </h2>
                                        </div>
                                </header>

                                <form onSubmit={handleSubmit} className='grid gap-6 md:grid-cols-2'>
                                        <div className='space-y-4'>
                                                <label className='block text-sm text-white/80'>
                                                        {t("admin.heroSlider.fields.title")}
                                                        <input
                                                                type='text'
                                                                name='title'
                                                                value={formState.title}
                                                                onChange={handleChange}
                                                                className='mt-2 w-full rounded-lg border border-white/10 bg-payzone-navy/40 px-4 py-2 text-white outline-none transition focus:border-payzone-gold'
                                                                placeholder={t("admin.heroSlider.placeholders.title")}
                                                        />
                                                </label>
                                                <label className='block text-sm text-white/80'>
                                                        {t("admin.heroSlider.fields.price")}
                                                        <input
                                                                type='number'
                                                                name='price'
                                                                value={formState.price}
                                                                onChange={handleChange}
                                                                min='0'
                                                                className='mt-2 w-full rounded-lg border border-white/10 bg-payzone-navy/40 px-4 py-2 text-white outline-none transition focus:border-payzone-gold'
                                                                placeholder={t("admin.heroSlider.placeholders.price")}
                                                        />
                                                </label>
                                        </div>

                                        <div className='flex flex-col justify-between gap-6'>
                                                <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-payzone-gold/50 bg-payzone-navy/40 p-6 text-center text-white/70'>
                                                        {formState.previewUrl ? (
                                                                <img
                                                                        src={formState.previewUrl}
                                                                        alt='preview'
                                                                        className='h-48 w-full rounded-xl object-cover shadow-lg'
                                                                />
                                                        ) : (
                                                                <>
                                                                        <ImageIcon className='mb-4 h-10 w-10 text-payzone-gold' />
                                                                        <p>{t("admin.heroSlider.messages.noImage")}</p>
                                                                </>
                                                        )}
                                                        <label className='mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-payzone-gold/50 px-4 py-2 text-sm uppercase tracking-[0.35em] text-payzone-gold transition hover:bg-payzone-gold/20'>
                                                                <input type='file' accept='image/*' onChange={handleFileChange} className='hidden' />
                                                                {t("admin.heroSlider.actions.upload")}
                                                        </label>
                                                </div>
                                                <div className='flex gap-3'>
                                                        <button
                                                                type='submit'
                                                                disabled={formLoading}
                                                                className='flex-1 rounded-full bg-payzone-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-payzone-navy transition hover:bg-payzone-gold/90 disabled:cursor-not-allowed disabled:opacity-60'
                                                        >
                                                                {formLoading ? (
                                                                        <span className='flex items-center justify-center gap-2'>
                                                                                <Loader2 className='h-5 w-5 animate-spin' />
                                                                                {t("admin.heroSlider.actions.saving")}
                                                                        </span>
                                                                ) : (
                                                                        t("admin.heroSlider.actions.save")
                                                                )}
                                                        </button>
                                                        <button
                                                                type='button'
                                                                onClick={resetForm}
                                                                className='rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:border-payzone-gold hover:text-payzone-gold'
                                                        >
                                                                {t("admin.heroSlider.actions.reset")}
                                                        </button>
                                                </div>
                                        </div>
                                </form>
                        </section>

                        <section className='rounded-3xl border border-payzone-indigo/40 bg-white/5 p-6 shadow-lg backdrop-blur-sm sm:p-10'>
                                <header className='mb-6 flex items-center justify-between'>
                                        <h3 className='text-xl font-semibold text-payzone-gold'>
                                                {t("admin.heroSlider.list.title")}
                                        </h3>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin text-payzone-gold' />}
                                </header>

                                {sortedSlides.length === 0 ? (
                                        <p className='rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white/70'>
                                                {t("admin.heroSlider.list.empty")}
                                        </p>
                                ) : (
                                        <div className='grid gap-6 md:grid-cols-2'>
                                                {sortedSlides.map((slide) => (
                                                        <article
                                                                key={slide._id}
                                                                className='flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-payzone-navy/40 shadow-lg'
                                                        >
                                                                <div className='relative h-48 w-full overflow-hidden'>
                                                                        {slide.image?.url ? (
                                                                                <img
                                                                                        src={slide.image.url}
                                                                                        alt={slide.title || "slide"}
                                                                                        className='h-full w-full object-cover'
                                                                                />
                                                                        ) : (
                                                                        <div className='flex h-full w-full items-center justify-center text-sm text-white/60'>
                                                                                        {t("admin.heroSlider.messages.noImage")}
                                                                                </div>
                                                                        )}
                                                                </div>
                                                                <div className='flex flex-1 flex-col gap-3 p-5 text-white/80'>
                                                                        <div className='flex items-center justify-between text-xs uppercase tracking-[0.35em] text-payzone-gold'>
                                                                                <span>
                                                                                        {t("admin.heroSlider.list.order", { index: (Number.isFinite(slide.order) ? slide.order : 0) + 1 })}
                                                                                </span>
                                                                        </div>
                                                                        <h4 className='text-lg font-semibold text-white'>
                                                                                {slide.title || t("admin.heroSlider.messages.untitled")}
                                                                        </h4>
                                                                        {Number.isFinite(slide.price) && (
                                                                                <p className='text-sm text-payzone-gold'>
                                                                                        {t("admin.heroSlider.list.price", {
                                                                                                price: formatMRU(slide.price),
                                                                                        })}
                                                                                </p>
                                                                        )}
                                                                        <button
                                                                                type='button'
                                                                                onClick={() => handleDelete(slide)}
                                                                                className='mt-auto inline-flex items-center justify-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-xs uppercase tracking-[0.35em] text-red-200 transition hover:border-red-400 hover:text-red-100'
                                                                        >
                                                                                <Trash size={16} />
                                                                                {t("admin.heroSlider.actions.delete")}
                                                                        </button>
                                                                </div>
                                                        </article>
                                                ))}
                                        </div>
                                )}
                        </section>
                </div>
        );
};

export default HeroSliderManager;
