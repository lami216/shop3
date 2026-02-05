import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";

const OrdersTab = () => {
  const { adminOrders, fetchAdminOrders, approveOrder, rejectOrder } = useOrderStore();

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  const guardTransition = (order, action) => {
    if (order.status !== "PAYMENT_SUBMITTED") {
      toast.error("يجب رفع إثبات الدفع أولاً");
      return;
    }
    action();
  };

  return (
    <div className='space-y-3'>
      {adminOrders.map((order) => {
        const canReview = order.status === "PAYMENT_SUBMITTED";
        return (
          <div key={order._id} className='rounded-xl border border-white/10 bg-white/5 p-4 text-white'>
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
            {order.paymentProofImage ? <img src={order.paymentProofImage} alt='proof' className='mt-3 h-32 rounded' /> : null}
            <div className='mt-3 flex gap-2'>
              <button
                className='rounded bg-green-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50'
                title={canReview ? "" : "يجب رفع إثبات الدفع أولاً"}
                disabled={!canReview}
                onClick={() => guardTransition(order, () => approveOrder(order._id))}
              >
                Approve
              </button>
              <button
                className='rounded bg-red-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50'
                title={canReview ? "" : "يجب رفع إثبات الدفع أولاً"}
                disabled={!canReview}
                onClick={() => guardTransition(order, () => rejectOrder(order._id))}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrdersTab;
