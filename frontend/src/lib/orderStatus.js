const PAYABLE_STATUSES = ["PENDING_PAYMENT", "pending_payment"];

export const isPayableOrderStatus = (status) => PAYABLE_STATUSES.includes(status);

export const canOpenPaymentPage = (order) => {
  if (!order || !isPayableOrderStatus(order.status)) return false;
  if (!order.reservationExpiresAt) return true;
  return new Date(order.reservationExpiresAt).getTime() > Date.now();
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
