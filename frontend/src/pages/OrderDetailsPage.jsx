import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";
import { getOrderDisplayNumber, getOrderStatusLabelAr } from "../lib/orderStatus";
import { formatDateTimeFr } from "../lib/localeFormat";

const blockBorderClass = "border border-[#dcdcdc]";
const sectionBarClass = "flex h-9 items-center bg-[#0f766e] px-4 text-sm font-bold text-white";

const MetaGridRow = ({ label, value }) => (
  <div className='grid grid-cols-2 border-b border-[#dcdcdc] text-sm last:border-b-0'>
    <div className='border-l border-[#dcdcdc] px-3 py-3 font-semibold text-[#111111]'>{value}</div>
    <div className='px-3 py-3 text-[#6b7280]'>{label}</div>
  </div>
);

const InfoGridRow = ({ label, value }) => (
  <div className='grid grid-cols-2 border-b border-[#dcdcdc] text-sm last:border-b-0'>
    <div className='border-l border-[#dcdcdc] px-3 py-3 font-semibold text-[#111111]'>{value || "—"}</div>
    <div className='px-3 py-3 text-[#6b7280]'>{label}</div>
  </div>
);

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

  if (loading) return <div className='min-h-[60vh] bg-white px-4 py-16 text-center text-[#6b7280]'>Loading...</div>;
  if (!order) return <div className='min-h-[60vh] bg-white px-4 py-16 text-center text-[#6b7280]'>لم يتم العثور على الطلب</div>;

  const statusBadge = (
    <span className='inline-flex items-center gap-2 rounded-full bg-[#f0f5f4] px-2.5 py-1 text-xs font-semibold text-[#111111]'>
      {isUnderReview ? <span className='h-1.5 w-1.5 rounded-full bg-[#c8a45d]' /> : null}
      {getOrderStatusLabelAr(order.status)}
    </span>
  );

  return (
    <div className='min-h-screen bg-white px-4 py-8 sm:py-12'>
      <div className='mx-auto w-full max-w-5xl text-right'>
        <header className='mb-8 text-center'>
          <p className='text-lg font-semibold tracking-[0.18em] text-[#111111]'>الصاحب</p>
          <p className='mt-1 text-sm font-medium tracking-[0.4em] text-[#111111]'>MAISON DE PARFUM</p>
          <p className='mt-3 text-sm text-[#111111]'>فاتورة طلب</p>
          <div className='mx-auto mt-4 h-px w-20 bg-[#c8a45d]/80' />
        </header>

        <div className='grid gap-6 md:grid-cols-2'>
          <section className={blockBorderClass}>
            <div className={sectionBarClass}>بيانات الطلب</div>
            <div className='bg-white'>
              <MetaGridRow label='رقم الطلب' value={getOrderDisplayNumber(order)} />
              <MetaGridRow label='تاريخ الإنشاء' value={formatDateTimeFr(order.createdAt)} />
              <MetaGridRow label='الحالة' value={statusBadge} />
              <MetaGridRow label='رمز التتبع' value={order.trackingCode || "—"} />
              <MetaGridRow label='وسيلة الدفع' value={order.paymentMethod?.name || "غير محددة"} />
            </div>
          </section>

          <section className={blockBorderClass}>
            <div className={sectionBarClass}>بيانات البائع</div>
            <div className='bg-white'>
              <InfoGridRow label='اسم المتجر' value='الصاحب | MAISON DE PARFUM' />
            </div>
          </section>
        </div>

        <section className='mt-6 border border-[#dcdcdc]'>
          <div className={sectionBarClass}>بيانات العميل</div>
          <div className='bg-white'>
            <InfoGridRow label='الاسم' value={order.customer?.name || "—"} />
            <InfoGridRow label='رقم الهاتف' value={order.customer?.phone || "—"} />
            <InfoGridRow label='العنوان' value={order.customer?.address || "—"} />
          </div>
        </section>

        <section className='mt-6 border border-[#dcdcdc]'>
          <div className={sectionBarClass}>البيان / المنتجات</div>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[580px] text-sm'>
              <thead>
                <tr className='bg-[#edf5f4] text-[#111111]'>
                  <th className='border-b border-l border-[#dcdcdc] px-3 py-3 text-right font-bold'>البيان</th>
                  <th className='border-b border-l border-[#dcdcdc] px-3 py-3 text-right font-bold'>السعر</th>
                  <th className='border-b border-l border-[#dcdcdc] px-3 py-3 text-right font-bold'>الكمية</th>
                  <th className='border-b border-[#dcdcdc] px-3 py-3 text-right font-bold'>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((item, index) => {
                  const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
                  return (
                    <tr key={`${item.product?._id || item.product || index}`} className='text-[#111111]'>
                      <td className='border-b border-l border-[#dcdcdc] px-3 py-3.5 font-semibold'>{item.product?.name || "—"}</td>
                      <td className='border-b border-l border-[#dcdcdc] px-3 py-3.5 tabular-nums'>{formatMRU(item.price)}</td>
                      <td className='border-b border-l border-[#dcdcdc] px-3 py-3.5 tabular-nums'>{item.quantity || 0}</td>
                      <td className='border-b border-[#dcdcdc] px-3 py-3.5 font-medium tabular-nums'>{formatMRU(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className='mt-6 flex justify-end'>
          <div className='w-full max-w-sm border border-[#dcdcdc]'>
            <div className={sectionBarClass}>الإجماليات</div>
            <div className='grid grid-cols-2 border-b border-[#dcdcdc] text-sm'>
              <span className='border-l border-[#dcdcdc] px-3 py-3 font-semibold text-[#111111]'>{formatMRU(subtotal)}</span>
              <span className='px-3 py-3 text-[#6b7280]'>المجموع الفرعي</span>
            </div>
            <div className='grid grid-cols-2 border-b border-[#dcdcdc] text-sm'>
              <span className='border-l border-[#dcdcdc] px-3 py-3 font-semibold text-[#111111]'>{formatMRU(0)}</span>
              <span className='px-3 py-3 text-[#6b7280]'>الشحن</span>
            </div>
            <div className='h-0.5 bg-[#c8a45d]/60' />
            <div className='grid grid-cols-2 text-sm'>
              <span className='border-l border-[#dcdcdc] px-3 py-3 text-lg font-bold tabular-nums text-[#c8a45d]'>{formatMRU(order.totalAmount)}</span>
              <span className='px-3 py-3 font-semibold text-[#111111]'>الإجمالي الكلي</span>
            </div>
          </div>
        </section>

        <div className='mt-8'>
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
