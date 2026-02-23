import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Upload } from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";
import apiClient from "../lib/apiClient";
import { removeGuestPendingOrder } from "../lib/guestPendingOrders";
import { canOpenPaymentPage, formatMmSs, getOrderDisplayNumber, getOrderStatusLabelAr } from "../lib/orderStatus";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const PaymentPage = () => {
  const { trackingCode } = useParams();
  const { getPaymentSessionByTracking, submitPaymentProof, getOrderDetailsByTracking } = useOrderStore();
  const [session, setSession] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [methodId, setMethodId] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPaymentSessionByTracking(trackingCode);
        setSession(data);
      } catch (error) {
        const message = error.response?.data?.message || "Failed to load payment session";
        if (message === "Order is under review" || message === "Order is not payable") {
          try {
            const detailsData = await getOrderDetailsByTracking(trackingCode);
            setOrderDetails(detailsData.order);
            removeGuestPendingOrder(trackingCode);
            window.dispatchEvent(new CustomEvent("pending-orders:refresh"));
          } catch {
            setLoadError(message);
          }
        } else {
          setLoadError(message);
        }
        setLoading(false);
        return;
      }

      try {
        const methodsData = await apiClient.get("/payment-methods");
        const methods = methodsData.methods || [];
        setPaymentMethods(methods);
        if (methods[0]) {
          setMethodId(methods[0]._id);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trackingCode, getPaymentSessionByTracking, getOrderDetailsByTracking]);

  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method._id === methodId) || null,
    [paymentMethods, methodId]
  );

  const secondsLeft = useMemo(() => {
    if (!session?.order?.reservationExpiresAt) return 0;
    return Math.floor(Math.max(new Date(session.order.reservationExpiresAt).getTime() - now, 0) / 1000);
  }, [session, now]);

  const progressPercent = useMemo(() => {
    if (!session?.order?.reservationStartedAt || !session?.order?.reservationExpiresAt) return 0;
    const start = new Date(session.order.reservationStartedAt).getTime();
    const end = new Date(session.order.reservationExpiresAt).getTime();
    const total = Math.max(end - start, 1);
    const remaining = Math.max(end - now, 0);
    return Math.round((remaining / total) * 100);
  }, [session, now]);

  const copyValue = async (value, successText) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      toast.success(successText);
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const onProofChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProofFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("الملف يجب أن يكون صورة فقط");
      event.target.value = "";
      setProofFile(null);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5MB");
      event.target.value = "";
      setProofFile(null);
      return;
    }

    setProofFile(file);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!methodId) {
      toast.error("اختر طريقة الدفع");
      return;
    }
    if (!proofFile) {
      toast.error("يرجى رفع صورة إثبات الدفع");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("paymentMethodId", methodId);
      payload.append("receiptImage", proofFile);
      const data = await submitPaymentProof(session.order._id, payload);
      removeGuestPendingOrder(session.order.trackingCode);
      window.dispatchEvent(new CustomEvent("guest-pending-orders:changed"));
      window.dispatchEvent(new CustomEvent("pending-orders:refresh"));
      setSubmittedOrder({
        ...session.order,
        status: data.status || "UNDER_REVIEW",
        orderNumber: data.orderNumber || session.order.orderNumber,
        trackingCode: data.trackingCode || session.order.trackingCode,
      });
      setSession(null);
      toast.success("تم استلام إثبات الدفع ✅");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit payment proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>Loading...</div>;

  const displayOrder = submittedOrder || orderDetails;
  if (displayOrder) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>
        <h1 className='mb-4 text-3xl font-bold text-payzone-gold'>حالة الطلب</h1>
        <div className='rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-5'>
          <h2 className='mb-3 text-xl font-semibold text-emerald-200'>تم استلام إثبات الدفع ✅</h2>
          <p className='mb-2'>الآن طلبك تحت المراجعة. سنقوم بتأكيده قريبًا.</p>
          <p className='mb-1'>الحالة: {getOrderStatusLabelAr(displayOrder.status || "UNDER_REVIEW")}</p>
          <p className='mb-1'>رقم الطلب: {getOrderDisplayNumber(displayOrder)}</p>
          <p className='mb-4'>رمز التتبع: {displayOrder.trackingCode}</p>
          <div className='flex gap-3'>
            <Link
              to={`/track?code=${encodeURIComponent(displayOrder.trackingCode)}`}
              className='inline-flex rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy'
            >
              متابعة حالة الطلب
            </Link>
            <Link to={`/order/${displayOrder.trackingCode}`} className='inline-flex rounded border border-white/30 px-4 py-2'>
              تفاصيل الطلب
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !session) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>
        <div className='rounded-xl border border-red-400/40 bg-red-400/10 p-4'>
          <p className='mb-2'>{loadError || "Payment session unavailable"}</p>
          <Link className='text-payzone-gold underline' to='/track'>العودة لصفحة التتبع</Link>
        </div>
      </div>
    );
  }

  const isPayable = canOpenPaymentPage(session.order);
  if (!isPayable) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>
        <div className='rounded-xl border border-payzone-indigo/40 bg-payzone-navy/30 p-5'>
          <h2 className='mb-2 text-xl font-semibold'>هذه الطلبية غير قابلة للدفع الآن</h2>
          <p className='mb-2'>الحالة الحالية: {getOrderStatusLabelAr(session.order.status)}</p>
          <p className='mb-4'>يمكنك متابعة تفاصيلها من صفحة التتبع.</p>
          <Link to={`/order/${session.order.trackingCode}`} className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy'>
            تفاصيل الطلب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>
      <h1 className='mb-4 text-3xl font-bold text-payzone-gold'>إتمام الدفع</h1>

      <form onSubmit={submit} className='space-y-4'>
        <div className='rounded-xl border border-payzone-indigo/40 bg-payzone-navy/30 p-4'>
          <p className='mb-2 text-lg font-semibold'>أكمل التحويل خلال: {formatMmSs(secondsLeft * 1000)}</p>
          <p>رقم الطلب: {getOrderDisplayNumber(session.order)}</p>
          <p>رمز التتبع: {session.order.trackingCode}</p>
          <p className='mt-2 text-sm text-white/70'>المبلغ المطلوب</p>
          <p className='text-2xl font-bold text-payzone-gold'>{formatMRU(session.order.totalAmount)}</p>
          <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-white/15'>
            <div className='h-2 rounded-full bg-payzone-gold transition-all' style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className='rounded-xl border border-payzone-gold/30 bg-payzone-gold/10 p-4'>
          <h3 className='mb-3 text-lg font-semibold text-payzone-gold'>تعليمات التحويل</h3>
          <ol className='list-decimal space-y-2 pr-5 text-sm'>
            <li>افتح تطبيق ({selectedMethod?.name || "Bankili"}).</li>
            <li>حوّل المبلغ الكامل: {formatMRU(session.order.totalAmount)}.</li>
            <li>
              أرسل التحويل إلى الرقم: {selectedMethod?.accountNumber || "01837363"}
              <div className='mt-2 flex gap-2'>
                <button type='button' onClick={() => copyValue(selectedMethod?.accountNumber || "01837363", "تم النسخ")} className='rounded bg-white/10 px-2 py-1 text-xs'>
                  نسخ الرقم
                </button>
                <button type='button' onClick={() => copyValue(formatMRU(session.order.totalAmount), "تم النسخ")} className='rounded bg-white/10 px-2 py-1 text-xs'>
                  نسخ المبلغ
                </button>
              </div>
            </li>
            <li>صوّر/احفظ إيصال التحويل ثم ارفعه هنا.</li>
          </ol>
          <p className='mt-3 text-xs text-white/70'>ملاحظة: الطلب ينتقل للمراجعة فور رفع الإثبات.</p>
        </div>

        <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
          <label className='mb-2 block text-sm text-white/80'>طريقة الدفع</label>
          {paymentMethods.length === 0 ? (
            <p className='rounded border border-white/10 bg-black/20 p-3 text-sm text-white/70'>No payment methods available</p>
          ) : (
            <select
              className='w-full rounded border border-payzone-indigo/40 bg-payzone-navy/60 p-2 text-white'
              value={methodId}
              onChange={(event) => setMethodId(event.target.value)}
              required
            >
              {paymentMethods.map((method) => (
                <option key={method._id} value={method._id}>
                  {method.name} — {method.accountNumber}
                </option>
              ))}
            </select>
          )}

          <label htmlFor='receiptImage' className='mt-4 inline-flex cursor-pointer items-center gap-2 rounded bg-payzone-indigo px-3 py-2 text-sm font-semibold'>
            <Upload size={16} /> اختر صورة الإيصال
          </label>
          <input id='receiptImage' type='file' accept='image/*' className='hidden' onChange={onProofChange} required />
          {proofFile ? <p className='mt-2 text-xs text-white/70'>{proofFile.name}</p> : <p className='mt-2 text-xs text-white/60'>الحد الأقصى 5MB - صور فقط</p>}

          <button disabled={submitting || paymentMethods.length === 0} className='mt-4 rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy disabled:opacity-60'>
            {submitting ? "جاري الإرسال..." : "إرسال إثبات الدفع"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentPage;
