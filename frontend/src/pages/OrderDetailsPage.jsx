import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";
import { getOrderDisplayNumber, getOrderStatusLabelAr } from "../lib/orderStatus";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ar-MR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderDetailsPage = () => {
  const { trackingCode } = useParams();
  const { getOrderDetailsByTracking } = useOrderStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getOrderDetailsByTracking(trackingCode);
        setOrder(data.order);
      } catch (error) {
        toast.error(error.response?.data?.message || "تعذر تحميل تفاصيل الطلب");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getOrderDetailsByTracking, trackingCode]);

  const lines = useMemo(() => order?.products || [], [order]);

  if (loading) return <div className='container mx-auto max-w-5xl px-4 py-16 text-white'>Loading...</div>;
  if (!order) return <div className='container mx-auto max-w-5xl px-4 py-16 text-white'>لم يتم العثور على الطلب</div>;

  return (
    <div className='container mx-auto max-w-5xl space-y-4 px-4 py-16 text-white'>
      <h1 className='text-3xl font-bold text-payzone-gold'>تفاصيل الطلب</h1>

      <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
        <p>رقم الطلب: {getOrderDisplayNumber(order)}</p>
        <p>الكود الداخلي: {order.orderNumber || "—"}</p>
        <p>رمز التتبع: {order.trackingCode}</p>
        <p>الحالة: {getOrderStatusLabelAr(order.status)}</p>
        <p>تاريخ الإنشاء: {formatDateTime(order.createdAt)}</p>
      </div>

      <div className='rounded-xl border border-payzone-gold/30 bg-payzone-gold/10 p-5'>
        <h2 className='mb-2 text-xl font-semibold text-payzone-gold'>تعليمات التحويل</h2>
        <p>1) افتح تطبيق {order.paymentMethod?.name || "Bankili"}</p>
        <p>2) حوّل المبلغ الكامل: {formatMRU(order.totalAmount)}</p>
        <p>3) الرقم المستهدف: {order.paymentMethod?.accountNumber || "—"}</p>
        <p>4) ارفع الإيصال وانتظر المراجعة</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
          <p>الاسم: {order.customer?.name || "—"}</p>
          <p>الهاتف: {order.customer?.phone || "—"}</p>
          <p>العنوان: {order.customer?.address || "—"}</p>
          <p>وسيلة الدفع: {order.paymentMethod?.name || "—"}</p>
          <p>رقم الحساب الكامل: {order.paymentMethod?.accountNumber || "—"}</p>
        </div>

        <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
          <h3 className='mb-2 font-semibold'>إثبات الدفع</h3>
          {order.receiptImageUrl ? (
            <a href={order.receiptImageUrl} target='_blank' rel='noreferrer' className='inline-block'>
              <img src={order.receiptImageUrl} alt='إيصال الدفع' className='h-40 w-40 rounded-lg border border-white/20 object-cover' />
              <p className='mt-2 text-sm text-payzone-gold underline'>فتح بالحجم الكامل</p>
            </a>
          ) : (
            <p className='text-white/70'>لا يوجد إيصال مرفوع</p>
          )}
        </div>
      </div>

      <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
        <h2 className='mb-3 text-xl font-semibold text-payzone-gold'>المنتجات</h2>
        <div className='space-y-2'>
          {lines.map((item, index) => {
            const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
            return (
              <div key={`${item.product?._id || item.product || index}`} className='rounded border border-white/10 p-3'>
                <p>المنتج: {item.product?.name || "—"}</p>
                <p>الكمية: {item.quantity}</p>
                <p>سعر الوحدة: {formatMRU(item.price)}</p>
                <p>الإجمالي: {formatMRU(lineTotal)}</p>
              </div>
            );
          })}
        </div>
        <p className='mt-4 text-lg font-semibold'>الإجمالي الكلي: {formatMRU(order.totalAmount)}</p>
      </div>

      <Link to='/track' className='inline-flex rounded border border-payzone-gold/60 px-4 py-2 text-payzone-gold'>
        العودة للتتبع
      </Link>
    </div>
  );
};

export default OrderDetailsPage;
