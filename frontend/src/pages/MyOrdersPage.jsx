import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";
import { getOrderDisplayNumber } from "../lib/orderStatus";

const STATUS_STYLE_MAP = {
  UNDER_REVIEW: {
    label: "Under Review",
    classes: "bg-[#f7efe0] text-[#b48a3f]",
  },
  APPROVED: {
    label: "Completed",
    classes: "bg-[#eaf7ef] text-[#2f8f57]",
  },
  REJECTED: {
    label: "Rejected",
    classes: "bg-[#fdeeee] text-[#b34a4a]",
  },
};

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatCreatedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const getStatusPresentation = (status) => {
  const key = String(status || "").toUpperCase();
  return STATUS_STYLE_MAP[key] || { label: key || "Unknown", classes: "bg-[#f2f2f2] text-[#707070]" };
};

const MyOrdersPage = () => {
  const { myOrders, fetchMyOrders } = useOrderStore();

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({ from: "", to: "" });

  const hasDraftRange = fromDate || toDate;

  const filteredOrders = useMemo(() => {
    return myOrders.filter((order) => {
      if (!appliedRange.from && !appliedRange.to) return true;

      const created = toIsoDate(order.createdAt);
      if (!created) return false;

      if (appliedRange.from && created < appliedRange.from) return false;
      if (appliedRange.to && created > appliedRange.to) return false;
      return true;
    });
  }, [myOrders, appliedRange]);

  const applyFilter = () => {
    if (!fromDate && !toDate) {
      setAppliedRange({ from: "", to: "" });
      return;
    }

    setAppliedRange({ from: fromDate, to: toDate });
  };

  const clearAndAutoReset = (nextFrom, nextTo) => {
    if (!nextFrom && !nextTo) {
      setAppliedRange({ from: "", to: "" });
    }
  };

  return (
    <div className='bg-[#fafafa] py-10 text-[#2f2f2f]'>
      <div className='container mx-auto px-4 sm:px-5'>
        <header className='mb-6'>
          <h1 className='text-3xl font-bold sm:text-4xl'>تتبع الطلبات</h1>
          <div className='mt-2 h-[2px] w-20 rounded-full bg-[#c8a45d]' />
          <p className='mt-3 text-sm text-[#767676]'>جميع طلباتك في مكان واحد</p>
        </header>

        <section className='mb-6 rounded-xl bg-white p-4 shadow-sm'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <label className='text-xs font-medium text-[#757575]'>
              من تاريخ
              <input
                type='date'
                value={fromDate}
                onChange={(event) => {
                  const nextFrom = event.target.value;
                  setFromDate(nextFrom);
                  clearAndAutoReset(nextFrom, toDate);
                }}
                className='mt-1 w-full rounded-xl border border-[#ececec] px-3 py-2 text-sm focus:border-[#c8a45d] focus:outline-none'
              />
            </label>

            <label className='text-xs font-medium text-[#757575]'>
              إلى تاريخ
              <input
                type='date'
                value={toDate}
                onChange={(event) => {
                  const nextTo = event.target.value;
                  setToDate(nextTo);
                  clearAndAutoReset(fromDate, nextTo);
                }}
                className='mt-1 w-full rounded-xl border border-[#ececec] px-3 py-2 text-sm focus:border-[#c8a45d] focus:outline-none'
              />
            </label>
          </div>

          <button
            type='button'
            onClick={applyFilter}
            className='mt-3 rounded-xl border border-[#c8a45d] px-4 py-2 text-sm font-semibold text-[#c8a45d] transition hover:bg-[#fcf8ef]'
            disabled={!hasDraftRange && !appliedRange.from && !appliedRange.to}
          >
            تطبيق
          </button>
        </section>

        {filteredOrders.length === 0 ? (
          <div className='mx-auto flex max-w-xl flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm'>
            <Package className='mb-3 h-10 w-10 text-[#c8a45d]' strokeWidth={1.7} />
            <p className='text-lg font-semibold text-[#333333]'>لا توجد طلبات حتى الآن</p>
            <p className='mt-2 text-sm text-[#848484]'>عند إنشاء طلب جديد سيظهر هنا</p>
          </div>
        ) : (
          <div className='space-y-5'>
            {filteredOrders.map((order) => {
              const status = getStatusPresentation(order.status);

              return (
                <article key={order._id} className='rounded-2xl bg-white p-5 shadow-sm'>
                  <div className='mb-4 flex items-start justify-between gap-3'>
                    <h2 className='text-lg font-bold text-[#202020]'>Order #{getOrderDisplayNumber(order)}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span>
                  </div>

                  <div className='space-y-1.5 text-sm text-[#888888]'>
                    <p>Tracking: {order.trackingCode || "—"}</p>
                    <p className='text-xs'>تاريخ الإنشاء: {formatCreatedAt(order.createdAt)}</p>
                  </div>

                  <hr className='my-3 border-[#efefef]' />

                  <div className='mb-4 flex items-end justify-between gap-4'>
                    <p className='text-sm font-medium text-[#666666]'>المبلغ الإجمالي</p>
                    <p className='text-2xl font-bold text-[#c8a45d]'>{formatMRU(Number(order.totalAmount) || 0)}</p>
                  </div>

                  <Link
                    to={`/order/${order.trackingCode}`}
                    className='block w-full rounded-xl border border-[#c8a45d] py-2.5 text-center text-sm font-semibold text-[#c8a45d] transition hover:bg-[#fcf8ef]'
                  >
                    تفاصيل الطلب
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
