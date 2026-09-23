import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { buildLegacyGuestClaimUrl } from "../lib/legacyGuestClaim";
import { useOrderStore } from "../stores/useOrderStore";

const REVIEWABLE_STATUSES = ["UNDER_REVIEW", "pending_payment", "PENDING_PAYMENT", "pending_approval", "PENDING_APPROVAL"];

const OrdersTab = () => {
  const { adminOrders, fetchAdminOrders, approveOrder, rejectOrder, issueLegacyGuestClaim } = useOrderStore();
  const [claimLinks, setClaimLinks] = useState({});
  const [issuingClaimFor, setIssuingClaimFor] = useState(null);

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

  const createLegacyClaimLink = async (order) => {
    if (!window.confirm("Confirm that this legacy guest order was manually verified before issuing a recovery link.")) {
      return;
    }

    setIssuingClaimFor(order._id);
    try {
      const issued = await issueLegacyGuestClaim(order._id);
      const claimLink = buildLegacyGuestClaimUrl(window.location.origin, issued.claimPath);
      setClaimLinks((current) => ({ ...current, [order._id]: claimLink }));
      await navigator.clipboard?.writeText(claimLink);
      toast.success("72-hour one-time claim link created and copied");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to issue a legacy claim link");
    } finally {
      setIssuingClaimFor(null);
    }
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
            {order.source === "ONLINE" && !order.user ? (
              <div className='mt-3 rounded border border-amber-400/40 bg-amber-950/30 p-3'>
                <button
                  className='rounded bg-amber-600 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={issuingClaimFor === order._id}
                  onClick={() => createLegacyClaimLink(order)}
                >
                  {issuingClaimFor === order._id ? "Issuing…" : "Issue verified legacy claim link"}
                </button>
                {claimLinks[order._id] ? (
                  <input
                    aria-label='One-time legacy claim link'
                    className='mt-2 w-full rounded bg-black/30 px-2 py-1 text-xs text-white'
                    dir='ltr'
                    readOnly
                    value={claimLinks[order._id]}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                ) : null}
              </div>
            ) : null}
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
