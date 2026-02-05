import { useState } from "react";
import { useOrderStore } from "../stores/useOrderStore";

const TrackingPage = () => {
  const { trackOrder } = useOrderStore();
  const [trackingCode, setTrackingCode] = useState("");
  const [order, setOrder] = useState(null);

  const search = async (e) => {
    e.preventDefault();
    const data = await trackOrder(trackingCode);
    setOrder(data.order);
  };

  return (
    <div className='container mx-auto px-4 py-16 max-w-2xl text-white'>
      <h1 className='text-3xl font-bold text-payzone-gold mb-4'>Order Tracking</h1>
      <form onSubmit={search} className='flex gap-2 mb-6'>
        <input className='flex-1 rounded bg-payzone-navy/60 p-2' placeholder='Tracking code' value={trackingCode} onChange={(e)=>setTrackingCode(e.target.value)} />
        <button className='rounded bg-payzone-gold text-payzone-navy px-4'>Track</button>
      </form>
      {order && (
        <div className='rounded border border-white/10 bg-white/5 p-4'>
          <p>Status: {order.status}</p>
          <p>Order: {order.orderNumber}</p>
          {(order.status === "NEEDS_MANUAL_REVIEW") && <a className='text-payzone-gold underline' href='https://wa.me/22200000000' target='_blank' rel='noreferrer'>Contact administration (WhatsApp)</a>}
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
