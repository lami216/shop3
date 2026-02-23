import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";
import { getOrderStatusLabelAr } from "../lib/orderStatus";

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

  if (loading) return <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>Loading...</div>;
  if (!order) return <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>لم يتم العثور على الطلب</div>;

  return (
    <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>
      <h1 className='mb-4 text-3xl font-bold text-payzone-gold'>تفاصيل الطلب</h1>
      <div className='space-y-3 rounded-xl border border-white/10 bg-white/5 p-5'>
        <p>رقم الطلب: {order.orderNumber}</p>
        <p>رمز التتبع: {order.trackingCode}</p>
        <p>الحالة: {getOrderStatusLabelAr(order.status)}</p>
        <p>تاريخ الإنشاء: {formatDateTime(order.createdAt)}</p>
        <p>الاسم: {order.customer?.name || "—"}</p>
        <p>الهاتف: {order.customer?.phone || "—"}</p>
        <p>العنوان: {order.customer?.address || "—"}</p>
        <p>وسيلة الدفع: {order.paymentMethod?.name || "—"}</p>
        <p>رقم الحساب: {order.paymentMethod?.accountNumber || "—"}</p>
      </div>

      <div className='mt-4 rounded-xl border border-white/10 bg-white/5 p-5'>
        <h2 className='mb-3 text-xl font-semibold text-payzone-gold'>المنتجات</h2>
        <div className='space-y-3'>
          {(order.products || []).map((item, index) => {
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

      <Link to='/track' className='mt-4 inline-flex text-payzone-gold underline'>
        العودة للتتبع
      </Link>
    </div>
  );
};

export default OrderDetailsPage;
