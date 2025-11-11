import { useMemo } from "react";
import { ShoppingCart } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { getProductPricing } from "../lib/getProductPricing";

const FeaturedProducts = ({ featuredProducts }) => {
        const { addToCart } = useCartStore();
        const { t } = useTranslation();

        const products = useMemo(() => (Array.isArray(featuredProducts) ? featuredProducts : []), [featuredProducts]);

        if (!products.length) {
                return null;
        }

        return (
                <section className='space-y-8 rounded-3xl border border-brand-primary/15 bg-black/40 px-6 py-10 shadow-golden sm:px-10'>
                        <header className='flex flex-col gap-3 text-right sm:flex-row sm:items-end sm:justify-between sm:text-left'>
                                <div>
                                        <p className='text-sm uppercase tracking-[0.55em] text-brand-muted'>
                                                {t("home.featuredTitle")}
                                        </p>
                                        <h2 className='text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-brand-primary'>
                                                مختاراتنا الفاخرة
                                        </h2>
                                </div>
                                <p className='max-w-xl text-sm text-brand-muted'>
                                        {t("home.subtitle")}
                                </p>
                        </header>

                        <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
                                {products.map((product) => {
                                        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(product);
                                        const coverImage =
                                                product.image ||
                                                (Array.isArray(product.images) && product.images.length > 0
                                                        ? typeof product.images[0] === "string"
                                                                ? product.images[0]
                                                                : product.images[0]?.url
                                                        : "");

                                        return (
                                                <article
                                                        key={product._id}
                                                        className='group flex h-full flex-col overflow-hidden rounded-3xl border border-brand-primary/20 bg-gradient-to-br from-white/5 via-black/40 to-black/70 p-4 shadow-golden transition duration-200 ease-out hover:border-brand-primary/60 hover:shadow-golden-strong'
                                                >
                                                        <div className='relative overflow-hidden rounded-2xl bg-black/40'>
                                                                {isDiscounted && (
                                                                        <span className='absolute right-4 top-4 z-10 rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-text shadow-golden'>
                                                                                -{discountPercentage}%
                                                                        </span>
                                                                )}
                                                                {coverImage ? (
                                                                        <img
                                                                                src={coverImage}
                                                                                alt={product.name}
                                                                                className='h-60 w-full object-cover transition duration-300 ease-out group-hover:scale-105'
                                                                        />
                                                                ) : (
                                                                        <div className='flex h-60 w-full items-center justify-center bg-black/40 text-sm text-brand-muted'>
                                                                                {t("common.status.noImage")}
                                                                        </div>
                                                                )}
                                                        </div>

                                                        <div className='flex flex-1 flex-col gap-4 px-2 pt-6'>
                                                                <h3 className='text-lg font-semibold text-brand-text'>{product.name}</h3>
                                                                <p className='min-h-[3.5rem] text-sm leading-relaxed text-brand-muted'>
                                                                        {product.description || t("products.detail.descriptionFallback")}
                                                                </p>

                                                                <div className='flex flex-wrap items-baseline gap-3 text-brand-primary'>
                                                                        {isDiscounted ? (
                                                                                <>
                                                                                        <span className='text-base text-brand-muted line-through'>{formatMRU(price)}</span>
                                                                                        <span className='text-2xl font-semibold text-brand-primary'>
                                                                                                {formatMRU(discountedPrice)}
                                                                                        </span>
                                                                                </>
                                                                        ) : (
                                                                                <span className='text-2xl font-semibold text-brand-primary'>{formatMRU(price)}</span>
                                                                        )}
                                                                </div>

                                                                <button
                                                                        onClick={() => addToCart({ ...product, discountedPrice, isDiscounted, discountPercentage })}
                                                                        className='golden-button mt-auto text-xs uppercase tracking-[0.35em]'
                                                                >
                                                                        <ShoppingCart size={18} />
                                                                        {t("common.actions.addToCart")}
                                                                </button>
                                                        </div>
                                                </article>
                                        );
                                })}
                        </div>
                </section>
        );
};
export default FeaturedProducts;
