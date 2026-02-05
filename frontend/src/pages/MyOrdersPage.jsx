import { useEffect } from "react";
import { useOrderStore } from "../stores/useOrderStore";

const MyOrdersPage = () => {
  const { myOrders, fetchMyOrders } = useOrderStore();
  useEffect(() => { fetchMyOrders(); }, [fetchMyOrders]);

  return (
    <div className='container mx-auto px-4 py-16 text-white'>
      <h1 className='text-3xl font-bold text-payzone-gold mb-4'>My Orders</h1>
      <div className='space-y-3'>
        {myOrders.map((o)=><div key={o._id} className='rounded border border-white/10 bg-white/5 p-4'>
          <p>{o.orderNumber} - {o.status}</p>
          <p className='text-xs opacity-70'>Tracking: {o.trackingCode}</p>
        </div>)}
      </div>
    </div>
  );
};

export default MyOrdersPage;
