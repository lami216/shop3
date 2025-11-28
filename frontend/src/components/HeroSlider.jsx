import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { formatMRU } from "../lib/formatMRU";
import { createOfferWhatsAppUrl } from "../lib/whatsapp";

const AUTO_PLAY_INTERVAL = 6500;

const HeroSlider = ({ slides = [] }) => {
        const { t } = useTranslation();

        const items = useMemo(() => {
                return slides
                        .filter(Boolean)
                        .map((slide) => {
                                const normalizedImage =
                                        typeof slide.image === "object" && slide.image !== null
                                                ? slide.image.url
                                                : slide.image;
                                const numericPrice = Number(slide.price);
                                const hasValidPrice = !Number.isNaN(numericPrice) && Number.isFinite(numericPrice);

                                return {
                                        ...slide,
                                        image: normalizedImage || slide.cover || slide.background || "",
                                        price: hasValidPrice ? numericPrice : null,
                                };
                        });
        }, [slides]);
        const [activeIndex, setActiveIndex] = useState(0);

        useEffect(() => {
                if (!items.length) return undefined;

                const timer = setInterval(() => {
                        setActiveIndex((previous) => (previous + 1) % items.length);
                }, AUTO_PLAY_INTERVAL);

                return () => clearInterval(timer);
        }, [items.length]);

        useEffect(() => {
                setActiveIndex(0);
        }, [items.length]);

        if (!items.length) {
                return (
                        <section className='relative flex h-[42vh] min-h-[280px] w-full items-center justify-center overflow-hidden rounded-3xl border border-brand-primary/25 bg-white shadow-sm sm:h-[55vh] sm:min-h-[360px] lg:h-[65vh]'>
                                <div className='px-8 text-center md:px-12'>
                                        <h2 className='text-[clamp(2rem,4vw,3.25rem)] font-bold tracking-wide text-brand-text'>
                                                عالم عطور فاخر
                                        </h2>
                                        <p className='mt-4 text-lg text-brand-muted'>
                                                استكشف تشكيلتنا المختارة بعناية من أرقى العطور الشرقية والغربية.
                                        </p>
                                </div>
                        </section>
                );
        }

        const goTo = (direction) => {
                if (!items.length) return;
                setActiveIndex((previous) => {
                        if (direction === "next") {
                                return (previous + 1) % items.length;
                        }
                        return (previous - 1 + items.length) % items.length;
                });
        };

        return (
                <section className='relative h-[42vh] min-h-[280px] w-full overflow-hidden rounded-3xl border border-brand-primary/25 bg-white shadow-sm sm:h-[55vh] sm:min-h-[360px] lg:h-[65vh]'>
                        <div className='absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-transparent' aria-hidden='true' />
                        {items.map((item, index) => {
                                const isActive = index === activeIndex;
                                const title = item.title || item.name || "";
                                const priceFormatted =
                                        item.price !== null && item.price !== undefined
                                                ? formatMRU(item.price)
                                                : null;
                                const whatsappUrl = createOfferWhatsAppUrl({
                                        title,
                                        priceFormatted,
                                });

                                return (
                                        <article
                                                key={`${item._id || item.image || index}`}
                                                className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                                                        isActive ? "opacity-100" : "opacity-0"
                                                }`}
                                                aria-hidden={!isActive}
                                        >
                                                {item.image ? (
                                                        <img
                                                                src={item.image}
                                                                alt={item.title || item.name || "عرض العطور"}
                                                                className='h-full w-full object-cover'
                                                        />
                                                ) : (
                                                        <div className='flex h-full w-full items-center justify-center bg-black/60 text-brand-muted'>
                                                                لا توجد صورة للعرض
                                                        </div>
                                                )}
                                                <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent' />
                                                <div className='absolute inset-0 flex flex-col justify-end px-6 pb-10 text-brand-text sm:px-10 lg:px-16'>
                                                        <span className='mb-4 inline-flex w-max rounded-full border border-brand-primary/40 bg-white/80 px-4 py-1 text-xs uppercase tracking-[0.45em] text-brand-muted backdrop-blur-sm'>
                                                                offer
                                                        </span>
                                                        <h2 className='text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-tight text-brand-text'>
                                                                {title}
                                                        </h2>
                                                        {(whatsappUrl || priceFormatted) && (
                                                                <div className='mt-6 flex flex-wrap items-center gap-3 sm:gap-4'>
                                                                        {whatsappUrl && (
                                                                                <a
                                                                                        href={whatsappUrl}
                                                                                        target='_blank'
                                                                                        rel='noopener noreferrer'
                                                                                        className='golden-button inline-flex w-max items-center gap-2 text-xs uppercase tracking-[0.35em]'
                                                                                        aria-label={t("home.hero.whatsappCtaAria", { title: title || t("home.hero.offerFallback") })}
                                                                                >
                                                                                        {t("home.hero.whatsappCta")}
                                                                                </a>
                                                                        )}
                                                                        {priceFormatted && (
                                                                                <p className='ml-auto text-3xl font-bold text-brand-primary text-right sm:text-4xl'>
                                                                                        {t("home.hero.offerPrice", { price: priceFormatted })}
                                                                                </p>
                                                                        )}
                                                                </div>
                                                        )}
                                                </div>
                                        </article>
                                );
                        })}

                        <div className='absolute inset-x-0 bottom-6 flex items-center justify-center gap-3'>
                                {items.map((_, index) => {
                                        const isActive = index === activeIndex;
                                        return (
                                                <button
                                                        key={`indicator-${index}`}
                                                        type='button'
                                                        onClick={() => setActiveIndex(index)}
                                                        className={`h-2 rounded-full transition-all duration-200 ${
                                                                isActive
                                                                        ? "w-10 bg-brand-primary shadow-golden"
                                                                        : "w-3 bg-brand-primary/30 hover:bg-brand-primary/60"
                                                        }`}
                                                        aria-label={`عرض ${index + 1}`}
                                                />
                                        );
                                })}
                        </div>

                        {items.length > 1 && (
                                <>
                                        <button
                                                type='button'
                                                onClick={() => goTo("prev")}
                                                className='absolute left-6 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 text-brand-text transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/20 md:flex'
                                                aria-label='السابق'
                                        >
                                                <ChevronLeft size={24} />
                                        </button>
                                        <button
                                                type='button'
                                                onClick={() => goTo("next")}
                                                className='absolute right-6 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 text-brand-text transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/20 md:flex'
                                                aria-label='التالي'
                                        >
                                                <ChevronRight size={24} />
                                        </button>
                                </>
                        )}
                </section>
        );
};

export default HeroSlider;
