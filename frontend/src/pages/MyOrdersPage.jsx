import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useOrderStore } from "../stores/useOrderStore";

const PENDING_STATUSES = ["PENDING_PAYMENT", "pending_payment"];

const MyOrdersPage = () => {
  const { myOrders, fetchMyOrders } = useOrderStore();

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const { pendingOrders, otherOrders } = useMemo(() => {
    const pending = myOrders.filter((order) => PENDING_STATUSES.includes(order.status));
    const others = myOrders.filter((order) => !PENDING_STATUSES.includes(order.status));
    return { pendingOrders: pending, otherOrders: others };
  }, [myOrders]);

  return (
    <div className='container mx-auto px-4 py-16 text-white'>
      <h1 className='mb-6 text-3xl font-bold text-payzone-gold'>My Orders</h1>

      <section className='mb-8 rounded-xl border border-payzone-gold/40 bg-payzone-gold/10 p-4'>
        <h2 className='mb-3 text-xl font-semibold text-payzone-gold'>طلبات قيد الدفع</h2>
        {pendingOrders.length === 0 ? (
          <p className='text-white/70'>لا توجد طلبات تحتاج إكمال الدفع الآن.</p>
        ) : (
          <div className='space-y-3'>
            {pendingOrders.map((order) => (
              <div key={order._id} className='rounded border border-white/10 bg-white/5 p-4'>
                <p className='font-medium'>#{order.orderNumber}</p>
                <p className='text-sm opacity-80'>الحالة: {order.status}</p>
                <p className='text-xs opacity-70'>Tracking: {order.trackingCode}</p>
                <Link
                  to={`/pay/${order.trackingCode}`}
                  className='mt-3 inline-flex rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy'
                >
                  إكمال الدفع
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className='mb-3 text-xl font-semibold text-white'>كل الطلبات</h2>
        <div className='space-y-3'>
          {myOrders.map((order) => (
            <div key={order._id} className='rounded border border-white/10 bg-white/5 p-4'>
              <p>
                {order.orderNumber} - {order.status}
              </p>
              <p className='text-xs opacity-70'>Tracking: {order.trackingCode}</p>
              {PENDING_STATUSES.includes(order.status) ? (
                <Link to={`/pay/${order.trackingCode}`} className='mt-2 inline-flex text-sm text-payzone-gold underline'>
                  إكمال الدفع
                </Link>
              ) : null}
            </div>
          ))}
        </div>
        {myOrders.length > 0 && otherOrders.length === 0 ? (
          <p className='mt-3 text-xs text-white/60'>جميع طلباتك الحالية بانتظار الدفع أو المراجعة.</p>
        ) : null}
      </section>
    </div>
  );
};

export default MyOrdersPage;
