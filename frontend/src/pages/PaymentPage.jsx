import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Camera, Copy } from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";
import { removeGuestPendingOrder } from "../lib/guestPendingOrders";
import { canOpenPaymentPage, formatMmSs, getOrderDisplayNumber, getOrderStatusLabelAr } from "../lib/orderStatus";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const PaymentPage = () => {
  const { trackingCode } = useParams();
  const { getPaymentSessionByTracking, submitPaymentProof, getOrderDetailsByTracking } = useOrderStore();
  const [session, setSession] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trackingCode, getPaymentSessionByTracking, getOrderDetailsByTracking]);

  const secondsLeft = useMemo(() => {
    if (!session?.order?.reservationExpiresAt) return 0;
    return Math.floor(Math.max(new Date(session.order.reservationExpiresAt).getTime() - now, 0) / 1000);
  }, [session, now]);

  const copyValue = async (value, successText) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(value));
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = String(value);
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
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

    if (!proofFile) {
      toast.error("يرجى رفع صورة إثبات الدفع");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      const selectedMethodId = session?.order?.paymentMethod?._id || session?.order?.paymentMethod;
      if (selectedMethodId) {
        payload.append("paymentMethodId", selectedMethodId);
      }
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
      toast.success("تم استلام إثبات الدفع");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit payment proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className='container mx-auto max-w-4xl px-4 py-16 text-[#111111]'>Loading...</div>;

  const displayOrder = submittedOrder || orderDetails;
  if (displayOrder) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-12 sm:py-16'>
        <h1 className='mb-4 text-3xl font-bold text-[#111111]'>حالة الطلب</h1>
        <div className='rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm'>
          <div className='mb-4 h-1.5 w-20 rounded-full bg-payzone-gold' />
          <h2 className='mb-3 text-xl font-semibold text-[#111111]'>تم استلام إثبات التحويل</h2>
          <p className='mb-4 text-[#6b7280]'>يجري التحقق من الدفع حالياً. سيتم تأكيد الطلب عبر واتساب خلال وقت قصير.</p>
          <p className='mb-1 text-[#111111]'>الحالة: {getOrderStatusLabelAr(displayOrder.status || "UNDER_REVIEW")}</p>
          <p className='mb-1 text-[#111111]'>رقم الطلب: {getOrderDisplayNumber(displayOrder)}</p>
          <p className='mb-5 text-[#111111]'>رمز التتبع: {displayOrder.trackingCode}</p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Link
              to={`/order/${displayOrder.trackingCode}`}
              className='inline-flex items-center justify-center rounded-xl border border-payzone-gold/60 px-4 py-2.5 font-semibold text-payzone-gold'
            >
              تفاصيل الطلب
            </Link>
            <Link
              to={`/track?code=${encodeURIComponent(displayOrder.trackingCode)}`}
              className='inline-flex items-center justify-center rounded-xl bg-payzone-gold px-4 py-2.5 font-semibold text-white transition-colors duration-200 hover:bg-[#b8873d]'
            >
              متابعة حالة الطلب
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !session) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-16 text-[#111111]'>
        <div className='rounded-xl border border-red-300 bg-red-50 p-4'>
          <p className='mb-2'>{loadError || "Payment session unavailable"}</p>
          <Link className='text-payzone-gold underline' to='/track'>العودة لصفحة التتبع</Link>
        </div>
      </div>
    );
  }

  const isPayable = canOpenPaymentPage(session.order);
  if (!isPayable) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-16 text-[#111111]'>
        <div className='rounded-xl border border-brand-primary/20 bg-white p-5 shadow-sm'>
          <h2 className='mb-2 text-xl font-semibold'>هذه الطلبية غير قابلة للدفع الآن</h2>
          <p className='mb-2'>الحالة الحالية: {getOrderStatusLabelAr(session.order.status)}</p>
          <p className='mb-4'>يمكنك متابعة تفاصيلها من صفحة التتبع.</p>
          <Link to={`/order/${session.order.trackingCode}`} className='rounded-xl bg-payzone-gold px-4 py-2 font-semibold text-white'>
            تفاصيل الطلب
          </Link>
        </div>
      </div>
    );
  }

  const accountNumber = session?.order?.paymentMethod?.accountNumber || "01837363";
  return (
    <div className='bg-[#fafafa] py-12'>
      <div className='container mx-auto max-w-4xl px-4 text-[#111111]'>
        <h1 className='text-3xl font-bold text-[#111111]'>إتمام الدفع</h1>

        <form onSubmit={submit} className='mt-6 space-y-5'>
          <div className='rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-sm'>
            <p className='text-sm text-[#6b7280]'>المبلغ المطلوب</p>
            <p className='my-3 text-3xl font-bold text-payzone-gold'>{formatMRU(session.order.totalAmount)}</p>
            <div className='my-5'>
              <p className='text-sm text-[#6b7280]'>يرجى إتمام التحويل خلال</p>
              <p className='mt-2 text-3xl font-bold text-[#111111]'>{formatMmSs(secondsLeft * 1000)}</p>
            </div>
            <p className='mt-1 text-sm text-[#6b7280]'>رقم الطلب: {getOrderDisplayNumber(session.order)}</p>
            <p className='mt-1 text-sm text-[#6b7280]'>رمز التتبع: {session.order.trackingCode}</p>
          </div>

          <div className='rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-sm'>
            <h3 className='mb-3 text-lg font-semibold text-[#111111]'>خطوات التحويل</h3>
            <ol className='list-decimal space-y-2 pr-5 text-sm text-[#111111]'>
              <li>افتح تطبيق Bankili</li>
              <li>حوّل البيانات التالية</li>
            </ol>

            <div className='mt-4 space-y-3'>
              <button
                type='button'
                onClick={() => copyValue(formatMRU(session.order.totalAmount), "تم نسخ المبلغ")}
                className='flex w-full items-center justify-between rounded-xl border border-payzone-gold/70 bg-white px-4 py-3 text-sm'
              >
                <span className='font-semibold text-payzone-gold'>{formatMRU(session.order.totalAmount)}</span>
                <Copy size={16} className='text-payzone-gold' />
              </button>
              <button
                type='button'
                onClick={() => copyValue(accountNumber, "تم نسخ الرقم")}
                className='flex w-full items-center justify-between rounded-xl border border-payzone-gold/70 bg-white px-4 py-3 text-sm'
              >
                <span className='font-medium text-[#111111]'>{accountNumber}</span>
                <Copy size={16} className='text-payzone-gold' />
              </button>
            </div>

            <label htmlFor='receiptImage' className='mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-payzone-gold px-4 py-2.5 text-sm font-semibold text-white'>
              <Camera size={16} /> ارفع لقطة شاشة الدفع
            </label>
            <input id='receiptImage' type='file' accept='image/*' className='hidden' onChange={onProofChange} required />
            {proofFile ? <p className='mt-2 text-xs text-[#6b7280]'>{proofFile.name}</p> : <p className='mt-2 text-xs text-[#6b7280]'>PNG / JPG حتى 5MB</p>}

            <button disabled={submitting} className='mt-6 w-full rounded-xl bg-payzone-gold px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#b8873d] disabled:opacity-60'>
              {submitting ? "جاري الإرسال..." : "إرسال إثبات الدفع"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
