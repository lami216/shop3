import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";

const CategoryItem = ({ category }) => {
        const { t } = useTranslation();
        return (
                <div className='group relative h-80 w-full overflow-hidden rounded-3xl border border-brand-primary/20 bg-black/60 shadow-golden transition duration-200 ease-out hover:border-brand-primary/60 hover:shadow-golden-strong'>
                        <Link to={`/category/${category.slug}`} className='block h-full w-full'>
                                <div className='relative h-full w-full'>
                                        <div className='absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/40 to-black/90 transition-opacity duration-500 group-hover:opacity-95' />
                                        <img
                                                src={category.imageUrl}
                                                alt={category.name}
                                                className='h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110'
                                                loading='lazy'
                                        />
                                        <div className='absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-6 text-brand-text'>
                                                <span className='inline-flex w-max items-center rounded-full border border-brand-primary/40 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.35em] text-brand-muted backdrop-blur'>
                                                        collection
                                                </span>
                                                <h3 className='text-2xl font-semibold text-brand-text'>{category.name}</h3>
                                                <p className='text-sm text-brand-muted'>
                                                        {t("categories.explore", { category: category.name })}
                                                </p>
                                        </div>
                                </div>
                        </Link>
                </div>
        );
};

export default CategoryItem;
