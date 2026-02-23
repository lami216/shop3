const PAYABLE_STATUSES = ["PENDING_PAYMENT", "pending_payment"];

export const isPayableOrderStatus = (status) => PAYABLE_STATUSES.includes(status);

export const canOpenPaymentPage = (order) => {
  if (!order || !isPayableOrderStatus(order.status)) return false;
  if (!order.reservationExpiresAt) return true;
  return new Date(order.reservationExpiresAt).getTime() > Date.now();
};

export const getRemainingReservationMs = (reservationExpiresAt) => {
  if (!reservationExpiresAt) return 0;
  return Math.max(new Date(reservationExpiresAt).getTime() - Date.now(), 0);
};

export const formatMmSs = (ms) => {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export const getOrderDisplayNumber = (order) => {
  if (!order) return "—";
  return order.orderNumberDisplay || order.orderNumber || "—";
};

export const getOrderStatusLabelAr = (status) => {
  const key = String(status || "").toUpperCase();
  switch (key) {
    case "PENDING_PAYMENT":
      return "بانتظار الدفع";
    case "UNDER_REVIEW":
      return "تحت المراجعة";
    case "APPROVED":
      return "معتمد";
    case "REJECTED":
      return "مرفوض";
    case "EXPIRED":
      return "منتهي";
    default:
      return status || "غير معروف";
  }
};
