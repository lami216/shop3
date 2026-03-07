import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useOrderStore } from "../stores/useOrderStore";

const REVIEWABLE_STATUSES = ["UNDER_REVIEW", "pending_payment", "PENDING_PAYMENT", "pending_approval", "PENDING_APPROVAL"];

const OrdersTab = () => {
  const { adminOrders, fetchAdminOrders, approveOrder, rejectOrder } = useOrderStore();

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  const guardTransition = (order, action) => {
    if (!REVIEWABLE_STATUSES.includes(order.status)) {
      toast.error("Order is not ready for review");
      return;
    }
    action();
  };

  return (
    <div className='space-y-3'>
      {adminOrders.map((order) => {
        const canReview = REVIEWABLE_STATUSES.includes(order.status);
        const hasProof = Boolean(order.receiptImageUrl) && order.receiptImageUrl !== "POS_MANUAL";
        const computedProfit = (Number(order.totalAmount) || 0) - (Number(order.totalCost) || 0);
        return (
          <div key={order._id} className='rounded-xl border border-white/10 bg-white/5 p-4 text-white'>
            <div className='flex justify-between'>
              <div>
                <p className='font-semibold'>{order.orderNumber}</p>
                <p className='text-xs opacity-70'>Tracking: {order.trackingCode}</p>
                <p className='text-xs opacity-70'>Source: {order.source}</p>
                <p className='text-xs opacity-70'>Status: {order.status}</p>
                <p className='text-xs opacity-70'>Profit: {computedProfit}</p>
              </div>
              <div className='text-right'>
                <p>{order.customer?.name}</p>
                <p className='text-xs opacity-70'>{order.customer?.phone}</p>
              </div>
            </div>
            {order.paymentMethod ? (
              <div className='mt-3 flex items-center gap-3 rounded border border-white/10 bg-black/20 p-2 text-sm'>
                {order.paymentMethod.imageUrl ? (
                  <div className='h-12 w-12 overflow-hidden rounded-md bg-white p-0'><img src={order.paymentMethod.imageUrl} alt={order.paymentMethod.name} className='block h-full w-full object-contain object-center' /></div>
                ) : null}
                <div>
                  <p className='font-semibold'>{order.paymentMethod.name}</p>
                  <p className='text-xs opacity-70'>{order.paymentMethod.accountNumber}</p>
                </div>
              </div>
            ) : null}
            {hasProof ? <div className='mt-3 h-32 overflow-hidden rounded-md'><img src={order.receiptImageUrl} alt='proof' className='block h-full w-full object-cover object-center' /></div> : null}
            <div className='mt-3 flex gap-2'>
              <button
                className='rounded bg-green-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50'
                title={canReview ? "" : "Order is not ready for review"}
                disabled={!canReview}
                onClick={() => guardTransition(order, () => approveOrder(order._id))}
              >
                Approve
              </button>
              <button
                className='rounded bg-red-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50'
                title={canReview ? "" : "Order is not ready for review"}
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
