import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { createOrderSupportWhatsAppUrl } from "../lib/whatsapp";

const TrackingPage = () => {
        const { trackingCode: trackingFromRoute } = useParams();
        const [trackingCode, setTrackingCode] = useState(trackingFromRoute || "");
        const [order, setOrder] = useState(null);

        const fetchTracking = async () => {
                if (!trackingCode.trim()) return;
                try {
                        const data = await apiClient.get(`/orders/tracking/${trackingCode.trim()}`);
                        setOrder(data);
                } catch (error) {
                        toast.error(error.response?.data?.message || "تعذر العثور على الطلب");
                }
        };

        return (
                <div className='mx-auto max-w-3xl px-4 py-10 text-white'>
                        <h1 className='text-2xl font-bold text-payzone-gold'>تتبع الطلب</h1>
                        <div className='mt-4 flex gap-2'>
                                <input
                                        value={trackingCode}
                                        onChange={(event) => setTrackingCode(event.target.value)}
                                        placeholder='أدخل رمز التتبع'
                                        className='flex-1 rounded border border-white/20 bg-transparent p-2'
                                />
                                <button onClick={fetchTracking} className='rounded bg-payzone-gold px-4 py-2 text-payzone-navy'>
                                        تتبع
                                </button>
                        </div>

                        {order && (
                                <div className='mt-6 rounded border border-white/20 p-4'>
                                        <p>رقم الطلب: {order.orderNumber}</p>
                                        <p>الحالة: {order.status}</p>
                                        <p>المبلغ: {order.totalAmount}</p>
                                        {order.status === "NEEDS_MANUAL_REVIEW" && (
                                                <a
                                                        href={createOrderSupportWhatsAppUrl({ trackingCode: order.trackingCode })}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                        className='mt-4 inline-block rounded bg-green-500 px-3 py-2 font-semibold text-black'
                                                >
                                                        تواصل عبر واتساب
                                                </a>
                                        )}
                                </div>
                        )}
                </div>
        );
};

export default TrackingPage;
