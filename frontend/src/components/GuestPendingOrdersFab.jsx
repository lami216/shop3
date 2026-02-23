import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3 } from "lucide-react";
import apiClient from "../lib/apiClient";
import { getGuestPendingOrders, setGuestPendingOrders } from "../lib/guestPendingOrders";

const ACTIVE_PENDING_STATUSES = ["PENDING_PAYMENT", "pending_payment"];

const isActivePendingOrder = (order) => {
  if (!order || !ACTIVE_PENDING_STATUSES.includes(order.status)) return false;
  if (!order.reservationExpiresAt) return true;
  return new Date(order.reservationExpiresAt).getTime() > Date.now();
};

const GuestPendingOrdersFab = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setOrders(getGuestPendingOrders());
    refresh();

    const onStorage = (event) => {
      if (event.key && event.key !== "guest_pending_orders") return;
      refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("guest-pending-orders:changed", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("guest-pending-orders:changed", refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const cleanupInactiveOrders = async () => {
      const currentOrders = getGuestPendingOrders();
      if (!currentOrders.length) return;

      const checks = await Promise.all(
        currentOrders.map(async (entry) => {
          try {
            const data = await apiClient.get(`/orders/tracking/${entry.trackingCode}`);
            return isActivePendingOrder(data.order) ? entry : null;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;
      const nextOrders = checks.filter(Boolean);
      if (nextOrders.length !== currentOrders.length) {
        setGuestPendingOrders(nextOrders);
      }
    };

    cleanupInactiveOrders();
    const interval = window.setInterval(cleanupInactiveOrders, 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const latest = useMemo(() => orders[0] || null, [orders]);

  const openOrder = (trackingCode) => {
    if (!trackingCode) return;
    setIsOpen(false);
    navigate(`/pay/${trackingCode}`);
  };

  if (!orders.length) return null;

  return (
    <>
      <button
        type='button'
        onClick={() => {
          if (orders.length === 1) {
            openOrder(latest?.trackingCode);
            return;
          }
          setIsOpen(true);
        }}
        className='fixed bottom-6 right-6 z-[90] inline-flex items-center gap-2 rounded-full bg-payzone-gold px-5 py-3 font-semibold text-payzone-navy shadow-xl transition hover:scale-[1.02]'
      >
        <Clock3 size={18} />
        اكمال الطلب
      </button>

      {isOpen ? (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4'>
          <div className='w-full max-w-md rounded-xl border border-payzone-indigo/40 bg-brand-bg p-5 text-white shadow-2xl'>
            <h3 className='text-xl font-bold text-payzone-gold'>اختر الطلب الذي تريد إكماله</h3>
            <p className='mt-1 text-sm text-white/70'>لديك طلبات معلقة كضيف.</p>

            <div className='mt-4 space-y-2'>
              {orders.map((order) => (
                <button
                  key={order.trackingCode}
                  type='button'
                  onClick={() => openOrder(order.trackingCode)}
                  className='w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-payzone-gold/70 hover:bg-white/10'
                >
                  <p className='font-semibold'>Tracking: {order.trackingCode}</p>
                  <p className='text-xs text-white/60'>تم الإنشاء: {new Date(order.createdAt).toLocaleString()}</p>
                </button>
              ))}
            </div>

            <div className='mt-4 flex justify-end'>
              <button type='button' onClick={() => setIsOpen(false)} className='rounded bg-white/10 px-4 py-2'>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GuestPendingOrdersFab;
