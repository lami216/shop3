import { useState } from "react";
import { motion } from "framer-motion";
import { Trash, Star, Edit3 } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useProductStore } from "../stores/useProductStore";
import { formatMRU } from "../lib/formatMRU";

const SWIPE_REVEAL_X = -84;

const ProductsList = ({ onEdit }) => {
        const { deleteProduct, toggleFeaturedProduct, products, setSelectedProduct } = useProductStore();
        const { t } = useTranslation();
        const [openSwipeProductId, setOpenSwipeProductId] = useState(null);

        const handleEdit = (product) => {
                const confirmed = window.confirm(
                        t("admin.productsTable.confirmations.edit", { name: product.name })
                );

                if (!confirmed) return;

                setSelectedProduct(product);
                if (typeof onEdit === "function") {
                        onEdit();
                }
        };

        const handleDelete = (product) => {
                const confirmed = window.confirm(
                        t("admin.productsTable.confirmations.delete", { name: product.name })
                );

                if (!confirmed) return;

                deleteProduct(product._id);
        };

        const getCategoryLabel = (product) => {
                const details = Array.isArray(product.categoryDetails) ? product.categoryDetails : [];
                const labels = details.map((category) => category?.name || category?.slug).filter(Boolean);

                if (labels.length) {
                        return labels.join("، ");
                }

                return t("admin.productsTable.noCategory");
        };

        return (
                <motion.div
                        className='mx-auto max-w-4xl overflow-hidden rounded-xl border border-payzone-indigo/40 bg-white/5 shadow-lg backdrop-blur-sm'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                >
                        <div className='md:hidden'>
                                <div className='divide-y divide-white/10'>
                                        {products?.map((product) => (
                                                <div key={product._id} className='relative overflow-hidden'>
                                                        <div className='absolute inset-y-0 left-0 flex w-24 items-center justify-evenly bg-payzone-navy/85'>
                                                                <button
                                                                        onClick={() => handleEdit(product)}
                                                                        className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-payzone-gold/90 text-payzone-navy'
                                                                        aria-label='تعديل'
                                                                >
                                                                        <Edit3 className='h-4 w-4' />
                                                                </button>
                                                                <button
                                                                        onClick={() => handleDelete(product)}
                                                                        className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500/90 text-white'
                                                                        aria-label='حذف'
                                                                >
                                                                        <Trash className='h-4 w-4' />
                                                                </button>
                                                        </div>
                                                        <motion.div
                                                                className='relative z-10 bg-payzone-navy/25 px-4 py-4'
                                                                drag='x'
                                                                dragConstraints={{ left: SWIPE_REVEAL_X, right: 0 }}
                                                                dragElastic={0.08}
                                                                dragMomentum={false}
                                                                animate={{ x: openSwipeProductId === product._id ? SWIPE_REVEAL_X : 0 }}
                                                                onTap={() => {
                                                                        if (openSwipeProductId === product._id) {
                                                                                setOpenSwipeProductId(null);
                                                                        }
                                                                }}
                                                                onDragEnd={(_, info) => {
                                                                        if (info.offset.x <= -36 || info.velocity.x < -220) {
                                                                                setOpenSwipeProductId(product._id);
                                                                                return;
                                                                        }

                                                                        setOpenSwipeProductId(null);
                                                                }}
                                                        >
                                                                <div className='flex items-start justify-between gap-3'>
                                                                        <div className='flex items-center gap-3'>
                                                                                <img
                                                                                        className='h-12 w-12 rounded-full object-cover ring-1 ring-payzone-indigo/40'
                                                                                        src={product.image}
                                                                                        alt={product.name}
                                                                                />
                                                                                <div>
                                                                                        <p className='text-sm font-semibold text-white'>{product.name}</p>
                                                                                        <p className='mt-1 text-xs text-white/60'>{getCategoryLabel(product)}</p>
                                                                                </div>
                                                                        </div>
                                                                        <button
                                                                                onClick={() => toggleFeaturedProduct(product._id)}
                                                                                className={`rounded-full p-1 transition-colors duration-200 ${
                                                                                        product.isFeatured
                                                                                                ? "bg-payzone-gold text-payzone-navy"
                                                                                                : "bg-payzone-navy/60 text-white/70"
                                                                                }`}
                                                                        >
                                                                                <Star className='h-4 w-4' />
                                                                        </button>
                                                                </div>
                                                                <div className='mt-3 flex items-center justify-between'>
                                                                        <div className='text-xs text-white/70'>
                                                                                {product.isDiscounted && product.discountPercentage > 0
                                                                                        ? `-${product.discountPercentage}%`
                                                                                        : "—"}
                                                                        </div>
                                                                        <div className='text-sm font-semibold text-payzone-gold'>
                                                                                {formatMRU(product.discountedPrice ?? product.price)}
                                                                        </div>
                                                                </div>
                                                        </motion.div>
                                                </div>
                                        ))}
                                </div>
                        </div>

                        <table className='hidden min-w-full divide-y divide-white/10 md:table'>
                                <thead className='bg-payzone-navy/80'>
                                        <tr>
                                                {[
                                                        t("admin.productsTable.headers.product"),
                                                        t("admin.productsTable.headers.price"),
                                                        t("admin.productsTable.headers.discount"),
                                                        t("admin.productsTable.headers.categories"),
                                                        t("admin.productsTable.headers.featured"),
                                                        t("admin.productsTable.headers.actions"),
                                                ].map((heading) => (
                                                        <th
                                                                key={heading}
                                                                scope='col'
                                                                className='px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70'
                                                        >
                                                                {heading}
                                                        </th>
                                                ))}
                                        </tr>
                                </thead>

                                <tbody className='divide-y divide-white/10 bg-white/5'>
                                        {products?.map((product) => (
                                                <tr key={product._id} className='transition-colors duration-200 hover:bg-payzone-navy/40'>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <div className='flex items-center gap-3'>
                                                                        <div className='h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-payzone-indigo/40'>
                                                                                <img className='h-full w-full object-cover' src={product.image} alt={product.name} />
                                                                        </div>
                                                                        <div>
                                                                                <div className='text-sm font-medium text-white'>{product.name}</div>
                                                                        </div>
                                                                </div>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <div className='flex flex-col items-end text-sm'>
                                                                        {product.isDiscounted && product.discountPercentage > 0 ? (
                                                                                <span className='text-xs text-white/60 line-through'>
                                                                                        {formatMRU(product.price)}
                                                                                </span>
                                                                        ) : (
                                                                                <span className='text-payzone-gold'>
                                                                                        {formatMRU(product.price)}
                                                                                </span>
                                                                        )}
                                                                </div>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                {product.isDiscounted && product.discountPercentage > 0 ? (
                                                                        <div className='flex items-center justify-end gap-2'>
                                                                                <span className='rounded-full bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-200'>
                                                                                        -{product.discountPercentage}%
                                                                                </span>
                                                                                <span className='text-sm text-red-200'>
                                                                                        {formatMRU(product.discountedPrice ?? product.price)}
                                                                                </span>
                                                                        </div>
                                                                ) : (
                                                                        <span className='text-sm text-white/60'>—</span>
                                                                )}
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <div className='text-sm text-white/70'>{getCategoryLabel(product)}</div>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <button
                                                                        onClick={() => toggleFeaturedProduct(product._id)}
                                                                        className={`rounded-full p-1 transition-colors duration-200 ${
                                                                                product.isFeatured
                                                                                        ? "bg-payzone-gold text-payzone-navy"
                                                                                        : "bg-payzone-navy/60 text-white/70"
                                                                        } hover:ring-2 hover:ring-payzone-indigo/40`}
                                                                >
                                                                        <Star className='h-5 w-5' />
                                                                </button>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
                                                                <div className='flex items-center justify-end gap-4'>
                                                                        <button
                                                                                onClick={() => handleEdit(product)}
                                                                                className='inline-flex items-center text-white/80 transition-colors duration-200 hover:text-payzone-gold'
                                                                        >
                                                                                <Edit3 className='h-5 w-5' />
                                                                        </button>
                                                                        <button
                                                                                onClick={() => handleDelete(product)}
                                                                                className='text-red-400 transition-colors duration-200 hover:text-red-300'
                                                                        >
                                                                                <Trash className='h-5 w-5' />
                                                                        </button>
                                                                </div>
                                                        </td>
                                                </tr>
                                        ))}
                                </tbody>
                        </table>
                </motion.div>
        );
};

export default ProductsList;
