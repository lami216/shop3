import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiClient from "../lib/apiClient";

const OrderPaymentPage = () => {
        const { orderId } = useParams();
        const navigate = useNavigate();
        const [order, setOrder] = useState(null);
        const [paymentProofImage, setPaymentProofImage] = useState("");
        const [senderAccount, setSenderAccount] = useState("");
        const [loading, setLoading] = useState(true);

        useEffect(() => {
                const fetchOrder = async () => {
                        try {
                                const data = await apiClient.get(`/orders/${orderId}`);
                                setOrder(data);
                        } catch (error) {
                                toast.error(error.response?.data?.message || "تعذر تحميل الطلب");
                                navigate("/cart");
                        } finally {
                                setLoading(false);
                        }
                };

                fetchOrder();
        }, [navigate, orderId]);

        const secondsLeft = useMemo(() => {
                if (!order?.reservedUntil) return 0;
                const diff = Math.floor((new Date(order.reservedUntil).getTime() - Date.now()) / 1000);
                return Math.max(diff, 0);
        }, [order]);

        useEffect(() => {
                if (!order?.reservedUntil) return undefined;
                const timer = setInterval(() => {
                        setOrder((prev) => (prev ? { ...prev } : prev));
                }, 1000);
                return () => clearInterval(timer);
        }, [order?.reservedUntil]);

        const countdownText = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

        const submitProof = async () => {
                if (!paymentProofImage || !senderAccount.trim()) {
                        toast.error("يرجى إدخال بيانات الدفع كاملة");
                        return;
                }

                try {
                        await apiClient.post(`/orders/${orderId}/payment-proof`, {
                                paymentProofImage,
                                senderAccount,
                        });
                        toast.success("تم رفع إثبات الدفع بنجاح");
                        navigate(`/tracking/${order.trackingCode}`);
                } catch (error) {
                        toast.error(error.response?.data?.message || "فشل رفع إثبات الدفع");
                }
        };

        if (loading) return <div className='px-4 py-10 text-white'>Loading...</div>;

        return (
                <div className='mx-auto max-w-3xl px-4 py-10 text-white'>
                        <h1 className='text-2xl font-bold text-payzone-gold'>الدفع للطلب {order.orderNumber}</h1>
                        <p className='mt-2 text-sm text-white/70'>رمز التتبع: {order.trackingCode}</p>
                        {order.reservedUntil && <p className='mt-4 text-lg text-payzone-gold'>الوقت المتبقي للحجز: {countdownText}</p>}

                        <div className='mt-6 space-y-4 rounded-lg border border-white/20 p-4'>
                                <input
                                        type='text'
                                        placeholder='حساب المُرسل'
                                        value={senderAccount}
                                        onChange={(event) => setSenderAccount(event.target.value)}
                                        className='w-full rounded border border-white/20 bg-transparent p-2'
                                />
                                <textarea
                                        placeholder='رابط/بيانات صورة إثبات الدفع (Base64 أو URL)'
                                        value={paymentProofImage}
                                        onChange={(event) => setPaymentProofImage(event.target.value)}
                                        className='h-32 w-full rounded border border-white/20 bg-transparent p-2'
                                />
                                <button onClick={submitProof} className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy'>
                                        إرسال إثبات الدفع
                                </button>
                        </div>

                        <Link to={`/tracking/${order.trackingCode}`} className='mt-6 inline-block text-payzone-gold underline'>
                                متابعة حالة الطلب
                        </Link>
                </div>
        );
};

export default OrderPaymentPage;
