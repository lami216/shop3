import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";

const TrackingPage = () => {
  const { trackOrder } = useOrderStore();
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fromQuery = searchParams.get("code");
    if (fromQuery) {
      setTrackingCode(fromQuery);
    }
  }, [searchParams]);

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

  return (
    <div className='container mx-auto max-w-2xl px-4 py-16 text-white'>
      <h1 className='mb-4 text-3xl font-bold text-payzone-gold'>تتبع الطلب</h1>
      <form onSubmit={search} className='mb-6 flex gap-2'>
        <input
          className='flex-1 rounded border border-white/20 bg-payzone-navy/60 p-2 text-white placeholder:text-white/60'
          placeholder='أدخل رمز التتبع'
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
        />
        <button className='rounded bg-payzone-gold px-4 text-payzone-navy'>تتبع</button>
      </form>
      {order && (
        <div className='rounded border border-white/10 bg-white/5 p-4 text-white'>
          <p className='mb-1'>الحالة: {order.status}</p>
          <p className='mb-1'>رقم الطلب: {order.orderNumber}</p>
          <p className='mb-1'>رمز التتبع: {order.trackingCode}</p>
          <p className='mb-3'>المبلغ الإجمالي: {order.totalAmount}</p>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
