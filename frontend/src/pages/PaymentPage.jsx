import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";
import { formatMRU } from "../lib/formatMRU";

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPaymentSession, submitPaymentProof } = useOrderStore();
  const [session, setSession] = useState(null);
  const [methodId, setMethodId] = useState("");
  const [paymentProofImage, setPaymentProofImage] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPaymentSession(id);
        setSession(data);
        if (data.paymentMethods?.[0]) setMethodId(data.paymentMethods[0]._id);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load payment session");
        navigate("/track-order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, getPaymentSession, navigate]);

  const secondsLeft = useMemo(() => {
    if (!session?.order?.reservationExpiresAt) return 0;
    return Math.max(Math.floor((new Date(session.order.reservationExpiresAt).getTime() - Date.now()) / 1000), 0);
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setSession((x) => (x ? { ...x } : x)), 1000);
    return () => clearInterval(timer);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await submitPaymentProof(id, { paymentMethodId: methodId, paymentProofImage, senderAccount });
      toast.success("Payment proof submitted");
      navigate("/purchase-success", {
        state: {
          order: {
            orderNumber: data.orderNumber || session.order.orderNumber,
            trackingCode: data.trackingCode || session.order.trackingCode,
            status: data.status,
          },
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit payment proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) return <div className='container mx-auto px-4 py-16 text-white'>Loading...</div>;

  const isExpired = session.order.status === "EXPIRED" || secondsLeft <= 0;

  return (
    <div className='container mx-auto px-4 py-16 text-white max-w-3xl'>
      <h1 className='text-3xl font-bold text-payzone-gold mb-4'>Payment</h1>
      <p className='mb-2'>Order: {session.order.orderNumber}</p>
      <p className='mb-2'>Tracking code: {session.order.trackingCode}</p>
      <p className='mb-2'>Total amount: {formatMRU(session.order.totalAmount)}</p>
      <p className='mb-6 text-red-300'>You have 15 minutes to confirm payment — {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</p>

      {isExpired ? (
        <div className='rounded-xl border border-red-400/40 bg-red-400/10 p-4'>
          <p className='mb-2'>Reservation expired. Please create a new order.</p>
          <Link className='text-payzone-gold underline' to='/cart'>Return to cart</Link>
        </div>
      ) : (
        <form onSubmit={submit} className='space-y-4 rounded-xl border border-white/10 bg-white/5 p-4'>
          <select className='w-full rounded bg-payzone-navy/60 p-2' value={methodId} onChange={(e) => setMethodId(e.target.value)} required>
            {session.paymentMethods.map((m) => <option key={m._id} value={m._id}>{m.name} — {m.accountNumber}</option>)}
          </select>
          <input className='w-full rounded bg-payzone-navy/60 p-2' placeholder='Sender account/number' value={senderAccount} onChange={(e) => setSenderAccount(e.target.value)} required />
          <input className='w-full rounded bg-payzone-navy/60 p-2' placeholder='Payment proof image URL or base64' value={paymentProofImage} onChange={(e) => setPaymentProofImage(e.target.value)} required />
          <button disabled={submitting} className='rounded bg-payzone-gold text-payzone-navy px-4 py-2 font-semibold disabled:opacity-60'>
            {submitting ? "Submitting..." : "Submit payment proof"}
          </button>
        </form>
      )}
    </div>
  );
};

export default PaymentPage;
