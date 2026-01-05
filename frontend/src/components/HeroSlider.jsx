import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { formatMRU } from "../lib/formatMRU";
import { createOfferWhatsAppUrl } from "../lib/whatsapp";

const AUTO_PLAY_INTERVAL = 6500;
const SWIPE_THRESHOLD_PX = 12;

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
        const pointerStateRef = useRef({
                pointerId: null,
                startX: 0,
                startY: 0,
                isDragging: false,
                swipeDeltaX: 0,
        });
        const blockClickRef = useRef(false);

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

        const handlePointerDown = (event) => {
                pointerStateRef.current = {
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startY: event.clientY,
                        isDragging: false,
                        swipeDeltaX: 0,
                };
                if (event.currentTarget.setPointerCapture) {
                        event.currentTarget.setPointerCapture(event.pointerId);
                }
        };

        const handlePointerMove = (event) => {
                if (pointerStateRef.current.pointerId !== event.pointerId) return;
                const deltaX = event.clientX - pointerStateRef.current.startX;
                const deltaY = event.clientY - pointerStateRef.current.startY;
                if (
                        !pointerStateRef.current.isDragging &&
                        Math.abs(deltaX) > SWIPE_THRESHOLD_PX &&
                        Math.abs(deltaX) > Math.abs(deltaY)
                ) {
                        pointerStateRef.current.isDragging = true;
                        blockClickRef.current = true;
                }
                if (pointerStateRef.current.isDragging) {
                        pointerStateRef.current.swipeDeltaX = deltaX;
                }
        };

        const handlePointerEnd = (event) => {
                if (pointerStateRef.current.pointerId !== event.pointerId) return;
                if (pointerStateRef.current.isDragging) {
                        if (pointerStateRef.current.swipeDeltaX < 0) {
                                goTo("next");
                        } else {
                                goTo("prev");
                        }
                }
                pointerStateRef.current = {
                        pointerId: null,
                        startX: 0,
                        startY: 0,
                        isDragging: false,
                        swipeDeltaX: 0,
                };
        };

        const handleClick = (event) => {
                if (blockClickRef.current) {
                        event.preventDefault();
                        event.stopPropagation();
                        blockClickRef.current = false;
                }
        };

        return (
                <section className='relative h-[42vh] min-h-[280px] w-full overflow-hidden rounded-3xl border border-brand-primary/25 bg-white shadow-sm sm:h-[55vh] sm:min-h-[360px] lg:h-[65vh]'>
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
                                                        isActive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                                                }`}
                                                aria-hidden={!isActive}
                                        >
                                                {item.image ? (
                                                        <a
                                                                href={whatsappUrl}
                                                                target='_blank'
                                                                rel='noopener noreferrer'
                                                                className='block h-full w-full touch-pan-y'
                                                                aria-label={t("home.hero.whatsappCtaAria", { title: title || t("home.hero.offerFallback") })}
                                                                onPointerDown={handlePointerDown}
                                                                onPointerMove={handlePointerMove}
                                                                onPointerUp={handlePointerEnd}
                                                                onPointerCancel={handlePointerEnd}
                                                                onClick={handleClick}
                                                        >
                                                                <img
                                                                        src={item.image}
                                                                        alt={item.title || item.name || "عرض العطور"}
                                                                        className='h-full w-full object-cover'
                                                                />
                                                        </a>
                                                ) : (
                                                        <div
                                                                className='flex h-full w-full items-center justify-center bg-black/60 text-brand-muted'
                                                                onPointerDown={handlePointerDown}
                                                                onPointerMove={handlePointerMove}
                                                                onPointerUp={handlePointerEnd}
                                                                onPointerCancel={handlePointerEnd}
                                                        >
                                                                لا توجد صورة للعرض
                                                        </div>
                                                )}
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
                                                className='absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-brand-text backdrop-blur transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/20 md:left-6 md:h-11 md:w-11'
                                                aria-label='السابق'
                                        >
                                                <ChevronLeft size={26} />
                                        </button>
                                        <button
                                                type='button'
                                                onClick={() => goTo("next")}
                                                className='absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-brand-text backdrop-blur transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/20 md:right-6 md:h-11 md:w-11'
                                                aria-label='التالي'
                                        >
                                                <ChevronRight size={26} />
                                        </button>
                                </>
                        )}
                </section>
        );
};

export default HeroSlider;
