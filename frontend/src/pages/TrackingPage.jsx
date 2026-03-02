import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { PackageSearch } from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import { useUserStore } from "../stores/useUserStore";
import { formatMRU } from "../lib/formatMRU";
import { canOpenPaymentPage, formatMmSs, getOrderDisplayNumber, getOrderStatusLabelAr } from "../lib/orderStatus";
import { formatDateTimeFr } from "../lib/localeFormat";

const statusBadgeClasses = {
  UNDER_REVIEW: "bg-[#f7ecd8] text-[#9a6a22]",
  COMPLETED: "bg-[#e8f6ee] text-[#1f7a45]",
  REJECTED: "bg-[#fbeaea] text-[#9f2f2f]",
};

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

  const renderOrderCard = (currentOrder) => {
    const canPay = canOpenPaymentPage(currentOrder);
    const remaining = currentOrder.reservationExpiresAt
      ? Math.max(new Date(currentOrder.reservationExpiresAt).getTime() - now, 0)
      : 0;
    const badgeClass = statusBadgeClasses[currentOrder.status] || "bg-[#f3f4f6] text-[#4b5563]";

    return (
      <article key={currentOrder._id || currentOrder.trackingCode} className='mb-5 rounded-2xl bg-white p-5 shadow-sm'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <h3 className='text-lg font-bold text-[#111111]'>طلب #{getOrderDisplayNumber(currentOrder)}</h3>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${badgeClass}`}>
            {getOrderStatusLabelAr(currentOrder.status)}
          </span>
        </div>

        <div className='space-y-1'>
          <p className='text-sm text-[#6b7280]'>رمز التتبع: {currentOrder.trackingCode}</p>
          <p className='text-xs text-[#9ca3af]'>تاريخ الإنشاء: {formatDateTimeFr(currentOrder.createdAt)}</p>
        </div>

        <div className='my-3 h-px bg-[#f1f1f1]' />

        <div className='mb-4 flex items-end justify-between gap-3'>
          <p className='text-sm font-medium text-[#6b7280]'>المبلغ الإجمالي</p>
          <p className='text-2xl font-bold text-payzone-gold'>{formatMRU(currentOrder.totalAmount)}</p>
        </div>

        {canPay ? (
          <div className='mb-3 rounded-xl bg-[#faf7f1] px-3 py-2 text-sm text-[#9a6a22]'>
            المتبقي لإكمال الدفع: {formatMmSs(remaining)}
          </div>
        ) : null}

        <Link
          className='inline-flex w-full items-center justify-center rounded-xl border border-payzone-gold px-4 py-2.5 font-semibold text-payzone-gold transition-colors duration-200 hover:bg-[#faf7f1]'
          to={canPay ? `/pay/${currentOrder.trackingCode}` : `/order/${currentOrder.trackingCode}`}
        >
          تفاصيل الطلب
        </Link>
      </article>
    );
  };

  return (
    <div className='bg-[#fafafa] py-10'>
      <div className='container mx-auto max-w-4xl px-4'>
        <header className='mb-8'>
          <h1 className='text-3xl font-bold text-[#111111]'>تتبع الطلبات</h1>
          <div className='mt-3 h-1.5 w-24 rounded-full bg-payzone-gold' />
          <p className='mt-3 text-sm text-[#6b7280]'>جميع طلباتك في مكان واحد</p>
        </header>

        {user ? (
          sortedOrders.length ? (
            <section>{sortedOrders.map((myOrder) => renderOrderCard(myOrder))}</section>
          ) : (
            <div className='rounded-2xl bg-white p-10 text-center shadow-sm'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#faf7f1] text-payzone-gold'>
                <PackageSearch size={22} />
              </div>
              <p className='text-lg font-semibold text-[#111111]'>لا توجد طلبات حتى الآن</p>
              <p className='mt-1 text-sm text-[#6b7280]'>عند إنشاء طلب جديد سيظهر هنا</p>
            </div>
          )
        ) : (
          <section>
            <form onSubmit={search} className='mb-6 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row'>
              <input
                className='flex-1 rounded-xl border border-[#ececec] bg-white px-4 py-2.5 text-[#111111] placeholder:text-[#9ca3af] focus:border-payzone-gold focus:outline-none'
                placeholder='أدخل رمز التتبع'
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value)}
              />
              <button className='rounded-xl border border-payzone-gold px-5 py-2.5 font-semibold text-payzone-gold'>تتبع</button>
            </form>

            {order ? (
              renderOrderCard(order)
            ) : (
              <div className='rounded-2xl bg-white p-10 text-center shadow-sm'>
                <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#faf7f1] text-payzone-gold'>
                  <PackageSearch size={22} />
                </div>
                <p className='text-lg font-semibold text-[#111111]'>لا توجد طلبات حتى الآن</p>
                <p className='mt-1 text-sm text-[#6b7280]'>عند إنشاء طلب جديد سيظهر هنا</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
