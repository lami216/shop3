import { Link } from "react-router-dom";

const CategoryItem = ({ category }) => {
        return (
                <Link
                        to={`/category/${category.slug}`}
                        className='block overflow-hidden rounded-2xl bg-white shadow-sm transition duration-150 ease-out hover:shadow-md'
                >
                        <div className='aspect-square w-full overflow-hidden bg-[#fafafa]'>
                                <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className='block h-full w-full object-cover object-center'
                                        loading='lazy'
                                />
                        </div>
                        <div className='p-3 text-center'>
                                <h3 className='text-sm font-semibold text-[#111111] sm:text-base'>{category.name}</h3>
                        </div>
                </Link>
        );
};

export default CategoryItem;
