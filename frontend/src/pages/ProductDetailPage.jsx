import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatMRU } from "../lib/formatMRU";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import useTranslation from "../hooks/useTranslation";
import { getProductPricing } from "../lib/getProductPricing";
import { useInventoryStore } from "../stores/useInventoryStore";

const resolveCoverImage = (product) => {
  if (!product) return null;
  if (product.image) return product.image;
  if (Array.isArray(product.images) && product.images.length > 0) {
    const [firstImage] = product.images;
    return typeof firstImage === "string" ? firstImage : firstImage?.url || null;
  }
  return null;
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const { selectedProduct, fetchProductById, productDetailsLoading, clearSelectedProduct } = useProductStore((state) => ({
    selectedProduct: state.selectedProduct,
    fetchProductById: state.fetchProductById,
    productDetailsLoading: state.productDetailsLoading,
    clearSelectedProduct: state.clearSelectedProduct,
  }));

  const addToCart = useCartStore((state) => state.addToCart);
  const { t } = useTranslation();
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(0);
  const inventory = useInventoryStore((state) => state.publicMap[id]);
  const available = inventory?.availableQuantity ?? 0;

  useEffect(() => {
    let isMounted = true;
    fetchProductById(id).then((product) => {
      if (isMounted) setActiveImage(resolveCoverImage(product));
    });
    return () => {
      isMounted = false;
      clearSelectedProduct();
    };
  }, [fetchProductById, id, clearSelectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    if (!selectedProduct.hasPortions) {
      setSelectedSize(0);
      return;
    }

    const portions = (Array.isArray(selectedProduct.portions) ? [...selectedProduct.portions] : [])
      .map((portion) => ({ size_ml: Number(portion?.size_ml || 0), price: Number(portion?.price || 0) }))
      .filter((portion) => portion.size_ml > 0)
      .sort((a, b) => a.size_ml - b.size_ml);

    const totalStockMl = Number(selectedProduct.totalStockMl || 0);
    const defaultPortion = portions.find((portion) => totalStockMl >= portion.size_ml) || portions[0];
    setSelectedSize(defaultPortion?.size_ml || 0);
  }, [selectedProduct]);

  if (productDetailsLoading && !selectedProduct) return <LoadingSpinner />;
  if (!selectedProduct) return <div className='min-h-screen bg-[#fafafa] text-[#111111]' />;

  const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(selectedProduct);
  const isPortionProduct = Boolean(selectedProduct.hasPortions);
  const portions = (Array.isArray(selectedProduct.portions) ? [...selectedProduct.portions] : [])
    .map((portion) => ({ size_ml: Number(portion?.size_ml || 0), price: Number(portion?.price || 0) }))
    .filter((portion) => portion.size_ml > 0)
    .sort((a, b) => a.size_ml - b.size_ml);
  const totalStockMl = Number(selectedProduct.totalStockMl || 0);
  const smallest = portions[0]?.size_ml || 0;
  const outOfStock = isPortionProduct ? totalStockMl < smallest || smallest <= 0 : available <= 0;

  const selectedPortion = portions.find((portion) => portion.size_ml === selectedSize) || portions[0];
  const currentPrice = isPortionProduct ? Number(selectedPortion?.price || 0) : isDiscounted ? discountedPrice : price;

  const handleAddToCart = async () => {
    await addToCart({ ...selectedProduct, discountedPrice, isDiscounted, discountPercentage, selectedPortionSizeMl: isPortionProduct ? Number(selectedPortion?.size_ml || 0) : 0, price: currentPrice }, quantity);
    setQuantity(1);
  };

  return (
    <div className='min-h-screen bg-[#fafafa] pb-24 text-[#111111]'>
      <section className='mx-auto max-w-6xl px-4 py-10'>
        <div className='mx-auto max-w-xl space-y-5'>
          <div className='overflow-hidden rounded-xl bg-white p-2 shadow-sm'>
            {activeImage ? <img src={activeImage} alt={selectedProduct.name} className='h-[360px] w-full rounded-md object-cover' /> : <div className='flex h-[360px] w-full items-center justify-center text-sm text-[#6b7280]'>{t("common.status.noImage")}</div>}
          </div>
          <h1 className='text-2xl font-semibold text-[#111111]'>{selectedProduct.name}</h1>
          <div className='flex items-baseline gap-2'>
            {!isPortionProduct && isDiscounted && <span className='text-sm text-[#6b7280] line-through'>{formatMRU(price)}</span>}
            <span className='text-[2rem] font-semibold text-brand-primary'>{formatMRU(currentPrice)}</span>
          </div>
          {currentPrice >= 1000 && <p className='text-sm text-[#16a34a]'>السعر شامل التوصيل</p>}
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${outOfStock ? "bg-red-100 text-[#dc2626]" : isPortionProduct ? "bg-yellow-100 text-[#f59e0b]" : "bg-green-100 text-[#16a34a]"}`}>
            {outOfStock ? "غير متوفر" : isPortionProduct ? "متوفر بالتقسيمة" : "متوفر"}
          </span>
          {isPortionProduct && <div><p className='text-sm font-medium'>اختر حجم التقسيمة</p><div className='mt-2 flex flex-wrap gap-2'>{portions.map((portion) => <button key={portion.size_ml} type='button' disabled={totalStockMl < portion.size_ml} onClick={() => setSelectedSize(portion.size_ml)} className={`rounded-full border px-3 py-1 text-sm ${selectedSize === portion.size_ml ? "border-brand-primary text-brand-primary" : "border-gray-300 text-gray-700"} disabled:opacity-40`}>{portion.size_ml}ml</button>)}</div></div>}
          <div className='flex items-center gap-3'>
            <button type='button' onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} className='inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#111111] shadow-sm' aria-label={t("cart.item.decrease")}><Minus className='h-4 w-4' /></button>
            <span className='flex h-10 min-w-[3rem] items-center justify-center rounded-md bg-white px-3 text-base font-semibold shadow-sm'>{quantity}</span>
            <button type='button' onClick={() => setQuantity((prev) => prev + 1)} className='inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#111111] shadow-sm' aria-label={t("cart.item.increase")}><Plus className='h-4 w-4' /></button>
          </div>
          <button disabled={outOfStock} onClick={handleAddToCart} className='inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#bf9951] disabled:opacity-50'>{t("common.actions.addToCart")}</button>
        </div>
        <PeopleAlsoBought productId={selectedProduct._id} category={selectedProduct.category} />
      </section>
    </div>
  );
};

export default ProductDetailPage;
