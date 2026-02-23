import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3 } from "lucide-react";
import apiClient from "../lib/apiClient";
import { getGuestPendingOrders, setGuestPendingOrders } from "../lib/guestPendingOrders";
import { useUserStore } from "../stores/useUserStore";

const ACTIVE_PENDING_STATUSES = ["PENDING_PAYMENT", "pending_payment"];
const REFRESH_EVENT = "pending-orders:refresh";

const isActivePendingOrder = (order) => {
  if (!order || !ACTIVE_PENDING_STATUSES.includes(order.status)) return false;
  if (!order.reservationExpiresAt) return true;
  return new Date(order.reservationExpiresAt).getTime() > Date.now();
};

const getRemainingMs = (reservationExpiresAt) => {
  if (!reservationExpiresAt) return null;
  return Math.max(new Date(reservationExpiresAt).getTime() - Date.now(), 0);
};

const formatRemaining = (remainingMs) => {
  if (remainingMs == null) return "";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const GuestPendingOrdersFab = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (user) return undefined;

    const refresh = () => setOrders(getGuestPendingOrders());
    refresh();

    const onStorage = (event) => {
      if (event.key && event.key !== "guest_pending_orders") return;
      refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("guest-pending-orders:changed", refresh);
    window.addEventListener(REFRESH_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("guest-pending-orders:changed", refresh);
      window.removeEventListener(REFRESH_EVENT, refresh);
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const refreshPendingOrders = async () => {
      if (user) {
        try {
          const data = await apiClient.get("/orders/my");
          if (cancelled) return;
          const activeOrders = (data.orders || []).filter(isActivePendingOrder);
          setOrders(activeOrders);
        } catch {
          if (!cancelled) setOrders([]);
        }
        return;
      }

      const currentOrders = getGuestPendingOrders();
      if (!currentOrders.length) {
        if (!cancelled) setOrders([]);
        return;
      }

      const checks = await Promise.all(
        currentOrders.map(async (entry) => {
          try {
            const data = await apiClient.get(`/orders/tracking/${entry.trackingCode}`);
            return isActivePendingOrder(data.order) ? data.order : null;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;
      const nextOrders = checks.filter(Boolean);
      setOrders(nextOrders);
      if (nextOrders.length !== currentOrders.length) {
        setGuestPendingOrders(nextOrders.map((order) => ({ trackingCode: order.trackingCode, createdAt: order.createdAt })));
      }
    };

    refreshPendingOrders();
    window.addEventListener(REFRESH_EVENT, refreshPendingOrders);
    const interval = window.setInterval(refreshPendingOrders, 30 * 1000);

    return () => {
      cancelled = true;
      window.removeEventListener(REFRESH_EVENT, refreshPendingOrders);
      window.clearInterval(interval);
    };
  }, [user]);

  const activeOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (!isActivePendingOrder(order)) return false;
        if (!order.reservationExpiresAt) return true;
        return new Date(order.reservationExpiresAt).getTime() > now;
      }),
    [orders, now]
  );

  const latest = useMemo(() => activeOrders[0] || null, [activeOrders]);
  const latestRemaining = getRemainingMs(latest?.reservationExpiresAt);

  const openOrder = (trackingCode) => {
    if (!trackingCode) return;
    setIsOpen(false);
    navigate(`/pay/${trackingCode}`);
  };

  if (!activeOrders.length) return null;

  return (
    <>
      <button
        type='button'
        onClick={() => {
          if (activeOrders.length === 1) {
            openOrder(latest?.trackingCode);
            return;
          }
          setIsOpen(true);
        }}
        className='fixed bottom-6 right-6 z-[90] inline-flex items-center gap-2 rounded-full bg-payzone-gold px-5 py-3 font-semibold text-payzone-navy shadow-xl transition hover:scale-[1.02]'
      >
        <Clock3 size={18} />
        لديك طلب غير مكتمل
        {latestRemaining != null ? <span className='rounded-full bg-payzone-navy/90 px-2 py-0.5 text-xs text-white'>{formatRemaining(latestRemaining)}</span> : null}
      </button>

      {isOpen ? (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4'>
          <div className='w-full max-w-md rounded-xl border border-payzone-indigo/40 bg-brand-bg p-5 text-white shadow-2xl'>
            <h3 className='text-xl font-bold text-payzone-gold'>لديك طلبات غير مكتملة</h3>
            <p className='mt-1 text-sm text-white/70'>اختر الطلب الذي تريد إكماله.</p>

            <div className='mt-4 space-y-2'>
              {activeOrders.map((order) => {
                const remaining = getRemainingMs(order.reservationExpiresAt);
                return (
                  <button
                    key={order.trackingCode}
                    type='button'
                    onClick={() => openOrder(order.trackingCode)}
                    className='w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-payzone-gold/70 hover:bg-white/10'
                  >
                    <p className='font-semibold'>Tracking: {order.trackingCode}</p>
                    {remaining != null ? <p className='text-xs text-payzone-gold'>المتبقي: {formatRemaining(remaining)}</p> : null}
                  </button>
                );
              })}
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
