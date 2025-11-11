import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_PLAY_INTERVAL = 6500;

const HeroSlider = ({ slides = [] }) => {
        const items = useMemo(() => slides.filter(Boolean), [slides]);
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
                        <section className='relative flex h-[60vh] min-h-[420px] w-full items-center justify-center overflow-hidden rounded-3xl border border-brand-primary/20 bg-brand-bg/40 shadow-golden backdrop-blur'>
                                <div className='px-8 text-center md:px-12'>
                                        <h2 className='text-gradient-gold text-[clamp(2rem,4vw,3.25rem)] font-bold tracking-wide'>
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
                <section className='relative h-[65vh] min-h-[460px] w-full overflow-hidden rounded-3xl border border-brand-primary/20 bg-black shadow-golden'>
                        <div className='absolute inset-0 bg-gradient-to-b from-black via-black/60 to-transparent' aria-hidden='true' />
                        {items.map((item, index) => {
                                const isActive = index === activeIndex;
                                return (
                                        <article
                                                key={`${item._id || item.image || index}`}
                                                className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                                                        isActive ? "opacity-100" : "opacity-0"
                                                }`}
                                                aria-hidden={!isActive}
                                        >
                                                <img
                                                        src={item.image || item.cover || item.background}
                                                        alt={item.name || "عرض العطور"}
                                                        className='h-full w-full object-cover'
                                                />
                                                <div className='absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20' />
                                                <div className='absolute inset-0 flex flex-col justify-end px-6 pb-16 text-brand-text sm:px-10 lg:px-16'>
                                                        <span className='mb-4 inline-flex w-max rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.45em] text-brand-muted backdrop-blur'>
                                                                offer
                                                        </span>
                                                        <h2 className='text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-tight text-brand-text'>
                                                                {item.title || item.name}
                                                        </h2>
                                                        {item.description && (
                                                                <p className='mt-4 max-w-2xl text-base text-brand-muted sm:text-lg'>
                                                                        {item.description}
                                                                </p>
                                                        )}
                                                </div>
                                        </article>
                                );
                        })}

                        <div className='absolute inset-x-0 bottom-8 flex items-center justify-center gap-3'>
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
                                                                        : "w-3 bg-white/40 hover:bg-brand-primary/60"
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
