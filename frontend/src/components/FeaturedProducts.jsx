import { useMemo } from "react";
import ProductCard from "./ProductCard";

const FeaturedProducts = ({ featuredProducts }) => {
        const products = useMemo(() => (Array.isArray(featuredProducts) ? featuredProducts : []), [featuredProducts]);

        if (!products.length) {
                return null;
        }

        return (
                <section className='space-y-6 bg-white py-10'>
                        <header className='text-right'>
                                <h2 className='text-2xl font-semibold text-[#111111]'>الأكثر مبيعاً</h2>
                        </header>
                        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                                {products.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                ))}
                        </div>
                </section>
        );
};

export default FeaturedProducts;
