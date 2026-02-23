import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";
import { useUserStore } from "../stores/useUserStore";
import { formatMRU } from "../lib/formatMRU";
import { canOpenPaymentPage, formatMmSs, getOrderDisplayNumber, getOrderStatusLabelAr } from "../lib/orderStatus";
import { formatDateTimeFr } from "../lib/localeFormat";

const TrackingPage = () => {
  const { trackOrder, fetchMyOrders, myOrders } = useOrderStore();
  const user = useUserStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState("");
  const [order, setOrder] = useState(null);
  const [now, setNow] = useState(Date.now());

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
              const remaining = myOrder.reservationExpiresAt
                ? Math.max(new Date(myOrder.reservationExpiresAt).getTime() - now, 0)
                : 0;
              return (
                <div key={myOrder._id} className='rounded border border-white/10 bg-white/5 p-4'>
                  <p className='mb-1'>الحالة: {getOrderStatusLabelAr(myOrder.status)}</p>
                  <p className='mb-1'>رقم الطلب: {getOrderDisplayNumber(myOrder)}</p>
                  <p className='mb-1'>رمز التتبع: {myOrder.trackingCode}</p>
                  <p className='mb-1'>تاريخ الإنشاء: {formatDateTimeFr(myOrder.createdAt)}</p>
                  <p className='mb-3'>المبلغ الإجمالي: {formatMRU(myOrder.totalAmount)}</p>

                  {canPay ? (
                    <div className='flex items-center gap-3'>
                      <Link className='rounded bg-payzone-gold px-3 py-1.5 font-semibold text-payzone-navy' to={`/pay/${myOrder.trackingCode}`}>
                        إكمال الدفع
                      </Link>
                      <span className='text-sm text-payzone-gold'>المتبقي: {formatMmSs(remaining)}</span>
                    </div>
                  ) : (
                    <Link className='rounded border border-payzone-gold/60 px-3 py-1.5 text-payzone-gold' to={`/order/${myOrder.trackingCode}`}>
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
          <p className='mb-1'>رقم الطلب: {getOrderDisplayNumber(order)}</p>
          <p className='mb-1'>رمز التتبع: {order.trackingCode}</p>
          <p className='mb-1'>تاريخ الإنشاء: {formatDateTimeFr(order.createdAt)}</p>
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
