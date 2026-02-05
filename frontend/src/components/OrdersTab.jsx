import { useEffect } from "react";
import { useOrderStore } from "../stores/useOrderStore";

const OrdersTab = () => {
  const { adminOrders, fetchAdminOrders, approveOrder, rejectOrder } = useOrderStore();

  useEffect(() => { fetchAdminOrders(); }, [fetchAdminOrders]);

  return (
    <div className='space-y-3'>
      {adminOrders.map((order) => <div key={order._id} className='rounded-xl border border-white/10 bg-white/5 p-4 text-white'>
        <div className='flex justify-between'>
          <div>
            <p className='font-semibold'>{order.orderNumber}</p>
            <p className='text-xs opacity-70'>Tracking: {order.trackingCode}</p>
            <p className='text-xs opacity-70'>Status: {order.status}</p>
            <p className='text-xs opacity-70'>Profit: {order.totalProfit || 0}</p>
          </div>
          <div className='text-right'>
            <p>{order.customer?.name}</p>
            <p className='text-xs opacity-70'>{order.customer?.phone}</p>
          </div>
        </div>
        {order.paymentProofImage ? <img src={order.paymentProofImage} alt='proof' className='h-32 mt-3 rounded' /> : null}
        <div className='mt-3 flex gap-2'>
          <button className='rounded bg-green-600 px-3 py-1 disabled:opacity-50' disabled={order.status === "APPROVED"} onClick={() => approveOrder(order._id)}>Approve</button>
          <button className='rounded bg-red-600 px-3 py-1 disabled:opacity-50' disabled={order.status === "REJECTED"} onClick={() => rejectOrder(order._id)}>Reject</button>
        </div>
      </div>)}
    </div>
  );
};

export default OrdersTab;
