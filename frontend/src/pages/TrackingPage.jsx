import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";
import { useUserStore } from "../stores/useUserStore";
import { formatMRU } from "../lib/formatMRU";
import { canOpenPaymentPage, getOrderStatusLabelAr } from "../lib/orderStatus";

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

const TrackingPage = () => {
  const { trackOrder, fetchMyOrders, myOrders } = useOrderStore();
  const user = useUserStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fromQuery = searchParams.get("code");
    if (fromQuery) {
      setTrackingCode(fromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    fetchMyOrders();
  }, [fetchMyOrders, user]);

  const search = async (event) => {
    event.preventDefault();
    try {
      const data = await trackOrder(trackingCode.trim());
      setOrder(data.order);
    } catch (error) {
      toast.error(error.response?.data?.message || "Order not found");
      setOrder(null);
    }
  };

  const sortedOrders = useMemo(
    () => [...myOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [myOrders]
  );

  return (
    <div className='container mx-auto max-w-3xl px-4 py-16 text-white'>
      <h1 className='mb-4 text-3xl font-bold text-payzone-gold'>تتبع الطلب</h1>

      {user ? (
        <div className='mb-6 space-y-3'>
          <h2 className='text-lg font-semibold'>طلباتك</h2>
          {sortedOrders.length ? (
            sortedOrders.map((myOrder) => {
              const canPay = canOpenPaymentPage(myOrder);
              return (
                <div key={myOrder._id} className='rounded border border-white/10 bg-white/5 p-4'>
                  <p className='mb-1'>الحالة: {getOrderStatusLabelAr(myOrder.status)}</p>
                  <p className='mb-1'>رقم الطلب: {myOrder.orderNumber}</p>
                  <p className='mb-1'>رمز التتبع: {myOrder.trackingCode}</p>
                  <p className='mb-1'>تاريخ الإنشاء: {formatDateTime(myOrder.createdAt)}</p>
                  <p className='mb-3'>المبلغ الإجمالي: {formatMRU(myOrder.totalAmount)}</p>

                  {canPay ? (
                    <Link className='text-payzone-gold underline' to={`/pay/${myOrder.trackingCode}`}>
                      فتح صفحة الدفع
                    </Link>
                  ) : (
                    <Link className='text-payzone-gold underline' to={`/order/${myOrder.trackingCode}`}>
                      تفاصيل الطلب
                    </Link>
                  )}
                </div>
              );
            })
          ) : (
            <p className='rounded border border-white/10 bg-white/5 p-4 text-sm text-white/70'>لا توجد طلبات مرتبطة بحسابك.</p>
          )}
        </div>
      ) : (
        <form onSubmit={search} className='mb-6 flex gap-2'>
          <input
            className='flex-1 rounded border border-white/20 bg-payzone-navy/60 p-2 text-white placeholder:text-white/60'
            placeholder='أدخل رمز التتبع'
            value={trackingCode}
            onChange={(event) => setTrackingCode(event.target.value)}
          />
          <button className='rounded bg-payzone-gold px-4 text-payzone-navy'>تتبع</button>
        </form>
      )}

      {!user && order && (
        <div className='rounded border border-white/10 bg-white/5 p-4 text-white'>
          <p className='mb-1'>الحالة: {getOrderStatusLabelAr(order.status)}</p>
          <p className='mb-1'>رقم الطلب: {order.orderNumber}</p>
          <p className='mb-1'>رمز التتبع: {order.trackingCode}</p>
          <p className='mb-1'>تاريخ الإنشاء: {formatDateTime(order.createdAt)}</p>
          <p className='mb-3'>المبلغ الإجمالي: {formatMRU(order.totalAmount)}</p>
          <Link className='text-payzone-gold underline' to={`/order/${order.trackingCode}`}>
            تفاصيل الطلب
          </Link>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
