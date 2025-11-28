import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";

const CategoryItem = ({ category }) => {
        const { t } = useTranslation();
        return (
                <div className='group relative aspect-square w-full overflow-hidden rounded-2xl border border-brand-primary/25 bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-golden'>
                        <Link to={`/category/${category.slug}`} className='absolute inset-0 block'>
                                <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className='h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105'
                                        loading='lazy'
                                />
                                <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 text-right'>
                                        <span className='inline-flex items-center rounded-full border border-brand-primary/30 bg-black/60 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white'>
                                                collection
                                        </span>
                                        <h3 className='mt-2 text-lg font-semibold text-brand-primary drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]'>{category.name}</h3>
                                        <p className='text-xs text-white/90 drop-shadow'>
                                                {t("categories.explore", { category: category.name })}
                                        </p>
                                </div>
                        </Link>
                </div>
        );
};

export default CategoryItem;
