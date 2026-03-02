import { useEffect } from "react";
import useTranslation from "../hooks/useTranslation";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";

const AllProductsPage = () => {
        const { fetchAllProducts, products, loading } = useProductStore();
        const { t } = useTranslation();

        useEffect(() => {
                fetchAllProducts();
        }, [fetchAllProducts]);

        const hasProducts = Array.isArray(products) && products.length > 0;

        return (
                <div className='min-h-screen bg-[#fafafa] text-[#111111]'>
                        <section className='mx-auto max-w-6xl px-4 py-10'>
                                <div className='mb-8 text-center'>
                                        <h1 className='text-3xl font-semibold text-[#111111]'>{t("allProducts.title")}</h1>
                                </div>

                                {loading ? (
                                        <div className='rounded-2xl bg-white px-6 py-10 text-center text-[#6b7280] shadow-sm'>
                                                {t("allProducts.loading")}
                                        </div>
                                ) : !hasProducts ? (
                                        <div className='rounded-2xl bg-white px-6 py-10 text-center text-[#6b7280] shadow-sm'>
                                                {t("allProducts.empty")}
                                        </div>
                                ) : (
                                        <div className='grid grid-cols-2 gap-4'>
                                                {products.map((product) => (
                                                        <ProductCard key={product._id} product={product} />
                                                ))}
                                        </div>
                                )}
                        </section>
                </div>
        );
};

export default AllProductsPage;
