import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Copy } from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PaymentPage = () => {
  const { trackingCode } = useParams();
  const navigate = useNavigate();
  const { getPaymentSessionByTracking, submitPaymentProofByTracking } = useOrderStore();
  const [session, setSession] = useState(null);
  const [methodId, setMethodId] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [paymentProofImage, setPaymentProofImage] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPaymentSessionByTracking(trackingCode);
        setSession(data);
        if (data.paymentMethods?.[0]) {
          setMethodId(data.paymentMethods[0]._id);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load payment session");
        navigate("/track", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trackingCode, getPaymentSessionByTracking, navigate]);

  const secondsLeft = useMemo(() => {
    if (!session?.order?.reservationExpiresAt) return 0;
    return Math.max(Math.floor((new Date(session.order.reservationExpiresAt).getTime() - Date.now()) / 1000), 0);
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setSession((x) => (x ? { ...x } : x)), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedMethod = useMemo(
    () => session?.paymentMethods?.find((method) => method._id === methodId) || null,
    [session, methodId]
  );

  const copyAccount = async () => {
    if (!selectedMethod?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(selectedMethod.accountNumber);
      toast.success("تم نسخ رقم الحساب");
    } catch {
      toast.error("تعذر نسخ رقم الحساب");
    }
  };

  const onProofChange = async (event) => {
    const file = event.target.files?.[0];
    setProofFile(file || null);
    if (!file) {
      setPaymentProofImage("");
      return;
    }

    try {
      const encoded = await toBase64(file);
      setPaymentProofImage(encoded);
    } catch {
      toast.error("تعذر قراءة صورة الإثبات");
      setPaymentProofImage("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!methodId) {
      toast.error("اختر طريقة الدفع");
      return;
    }
    if (!paymentProofImage) {
      toast.error("يرجى رفع صورة إثبات الدفع");
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitPaymentProofByTracking(trackingCode, {
        paymentMethodId: methodId,
        paymentProofImage,
        senderAccount,
      });
      setSubmittedOrder({
        orderNumber: data.orderNumber || session.order.orderNumber,
        trackingCode: data.trackingCode || session.order.trackingCode,
      });
      toast.success("تم إرسال إثبات الدفع بنجاح");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit payment proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) return <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>Loading...</div>;

  const isExpired = session.order.status === "EXPIRED" || secondsLeft <= 0;

  return (
    <div className='container mx-auto max-w-4xl px-4 py-16 text-white'>
      <h1 className='mb-4 text-3xl font-bold text-payzone-gold'>إتمام الدفع</h1>
      <div className='mb-6 rounded-xl border border-white/10 bg-white/5 p-4'>
        <p className='mb-1'>رقم الطلب: {session.order.orderNumber}</p>
        <p className='mb-1'>رمز التتبع: {session.order.trackingCode}</p>
        <p className='mb-2 text-lg font-semibold'>الإجمالي: {formatMRU(session.order.totalAmount)}</p>
        <p className='text-red-300'>
          وقت الحجز المتبقي 15 دقيقة — {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
        </p>
      </div>

      {submittedOrder ? (
        <div className='rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-5'>
          <h2 className='mb-3 text-xl font-semibold text-emerald-200'>تم استلام إثبات الدفع</h2>
          <p className='mb-1'>Order Number: {submittedOrder.orderNumber}</p>
          <p className='mb-4'>Tracking Code: {submittedOrder.trackingCode}</p>
          <Link
            to={`/track?code=${encodeURIComponent(submittedOrder.trackingCode)}`}
            className='inline-flex rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy'
          >
            متابعة حالة الطلب
          </Link>
        </div>
      ) : isExpired ? (
        <div className='rounded-xl border border-red-400/40 bg-red-400/10 p-4'>
          <p className='mb-2'>انتهت مدة الحجز. يرجى إنشاء طلب جديد.</p>
          <Link className='text-payzone-gold underline' to='/cart'>
            العودة إلى السلة
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className='space-y-4 rounded-xl border border-white/10 bg-white/5 p-4'>
          <label className='block text-sm text-white/80'>طريقة الدفع</label>
          <select
            className='w-full rounded border border-payzone-indigo/40 bg-payzone-navy/60 p-2 text-white'
            value={methodId}
            onChange={(event) => setMethodId(event.target.value)}
            required
          >
            {session.paymentMethods.map((method) => (
              <option key={method._id} value={method._id}>
                {method.name}
              </option>
            ))}
          </select>

          {selectedMethod ? (
            <div className='rounded border border-white/10 bg-black/20 p-3'>
              <p className='mb-2 text-sm text-white/70'>بيانات التحويل</p>
              <p className='font-semibold'>{selectedMethod.name}</p>
              <div className='mt-1 flex items-center gap-2'>
                <p>{selectedMethod.accountNumber}</p>
                <button
                  type='button'
                  onClick={copyAccount}
                  className='inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs'
                >
                  <Copy size={14} /> نسخ
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <label className='mb-1 block text-sm text-white/80'>رقم الحساب/الهاتف المرسل منه</label>
            <input
              className='w-full rounded border border-payzone-indigo/40 bg-payzone-navy/60 p-2 text-white'
              placeholder='مثال: 22123456'
              value={senderAccount}
              onChange={(event) => setSenderAccount(event.target.value)}
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-white/80'>صورة إثبات الدفع</label>
            <input
              type='file'
              accept='image/*'
              className='w-full rounded border border-payzone-indigo/40 bg-payzone-navy/60 p-2 text-white file:mr-3 file:rounded file:border-0 file:bg-payzone-gold file:px-3 file:py-1 file:text-payzone-navy'
              onChange={onProofChange}
              required
            />
            {proofFile ? <p className='mt-1 text-xs text-white/70'>{proofFile.name}</p> : null}
          </div>

          <button disabled={submitting} className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy disabled:opacity-60'>
            {submitting ? "جاري الإرسال..." : "إرسال إثبات الدفع"}
          </button>
        </form>
      )}
    </div>
  );
};

export default PaymentPage;
