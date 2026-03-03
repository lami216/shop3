import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";
import { getOrderDisplayNumber, getOrderStatusLabelAr } from "../lib/orderStatus";
import { formatDateTimeFr } from "../lib/localeFormat";

const labelClassName = "text-xs font-medium text-[#6b7280]";
const valueClassName = "mt-1 text-sm font-semibold text-[#111111]";

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
  const isUnderReview = String(order?.status || "").toUpperCase() === "UNDER_REVIEW";
  const subtotal = lines.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  if (loading) return <div className='min-h-[60vh] bg-[#fafafa] px-4 py-16 text-center text-[#6b7280]'>Loading...</div>;
  if (!order) return <div className='min-h-[60vh] bg-[#fafafa] px-4 py-16 text-center text-[#6b7280]'>لم يتم العثور على الطلب</div>;

  return (
    <div className='min-h-screen bg-white px-4 py-8 sm:py-12'>
      <div className='mx-auto w-full max-w-4xl bg-white'>
        <header className='pb-6 text-center'>
          <p className='text-lg font-semibold tracking-[0.18em] text-[#111111]'>الصاحب</p>
          <p className='mt-1 text-sm font-medium tracking-[0.4em] text-[#111111]'>MAISON DE PARFUM</p>
          <p className='mt-3 text-xs text-[#6b7280]'>فاتورة طلب</p>
          <div className='mx-auto mt-4 h-px w-28 bg-[#c8a45d]/70' />
        </header>

        <section className='mt-2 grid gap-6 border-b border-[#f1f1f1] pb-6 text-right md:grid-cols-2'>
          <div className='space-y-4'>
            <div>
              <p className={labelClassName}>رقم الطلب</p>
              <p className={valueClassName}>{getOrderDisplayNumber(order)}</p>
            </div>
            <div>
              <p className={labelClassName}>تاريخ الإنشاء</p>
              <p className={valueClassName}>{formatDateTimeFr(order.createdAt)}</p>
            </div>
            <div>
              <p className={labelClassName}>الحالة</p>
              <p className='mt-1 inline-flex items-center gap-2 rounded-full bg-[#f8f6f2] px-3 py-1 text-sm font-semibold text-[#111111]'>
                {isUnderReview ? <span className='h-1.5 w-1.5 rounded-full bg-[#c8a45d]' /> : null}
                {getOrderStatusLabelAr(order.status)}
              </p>
            </div>
            <div>
              <p className={labelClassName}>رمز التتبع</p>
              <p className={valueClassName}>{order.trackingCode || "—"}</p>
            </div>
            <div>
              <p className={labelClassName}>وسيلة الدفع</p>
              <p className={valueClassName}>{order.paymentMethod?.name || "—"}</p>
            </div>
          </div>

          {(order.customer?.name || order.customer?.phone || order.customer?.address) ? (
            <div className='space-y-4'>
              <h2 className='text-base font-bold text-[#111111]'>بيانات العميل</h2>
              <div>
                <p className={labelClassName}>الاسم</p>
                <p className={valueClassName}>{order.customer?.name || "—"}</p>
              </div>
              <div>
                <p className={labelClassName}>رقم الهاتف</p>
                <p className={valueClassName}>{order.customer?.phone || "—"}</p>
              </div>
              <div>
                <p className={labelClassName}>العنوان</p>
                <p className={valueClassName}>{order.customer?.address || "—"}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className='mt-6 border-b border-[#f1f1f1] pb-6 text-right'>
          <h2 className='mb-4 text-base font-bold text-[#111111]'>المنتجات</h2>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[560px] text-sm'>
              <thead>
                <tr className='border-b border-[#f1f1f1] text-[#6b7280]'>
                  <th className='py-2 text-right font-medium'>المنتج</th>
                  <th className='py-2 text-right font-medium'>الكمية</th>
                  <th className='py-2 text-right font-medium'>سعر الوحدة</th>
                  <th className='py-2 text-right font-medium'>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((item, index) => {
                  const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
                  return (
                    <tr key={`${item.product?._id || item.product || index}`} className='border-b border-[#f1f1f1] text-[#111111]'>
                      <td className='py-3'>{item.product?.name || "—"}</td>
                      <td className='py-3'>{item.quantity || 0}</td>
                      <td className='py-3'>{formatMRU(item.price)}</td>
                      <td className='py-3 font-medium'>{formatMRU(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className='mt-6 pb-6 text-right'>
          <div className='ml-auto w-full max-w-sm space-y-3'>
            <div className='flex items-center justify-between gap-2 text-sm text-[#6b7280]'>
              <span>المجموع الفرعي</span>
              <span className='text-[#111111]'>{formatMRU(subtotal)}</span>
            </div>
            <div className='flex items-center justify-between gap-2 text-sm text-[#6b7280]'>
              <span>الشحن</span>
              <span className='text-[#111111]'>{formatMRU(0)}</span>
            </div>
            <div className='h-px bg-[#f1f1f1]' />
            <div className='flex items-center justify-between gap-2 pt-1'>
              <span className='text-base font-semibold text-[#111111]'>الإجمالي الكلي</span>
              <span className='text-xl font-bold text-[#c8a45d]'>{formatMRU(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        <div className='mt-6'>
          <Link
            to='/'
            className='flex h-[52px] w-full items-center justify-center rounded-xl bg-[#c8a45d] text-center text-sm font-semibold text-white transition hover:bg-[#b8934d]'
          >
            العودة إلى المتجر
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
