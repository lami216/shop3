const STORAGE_KEY = "guest_pending_orders";

const isBrowser = typeof window !== "undefined";

const parseStored = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.trackingCode === "string" && item.trackingCode.trim())
      .map((item) => ({
        trackingCode: item.trackingCode.trim(),
        createdAt: item.createdAt || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
};

export const getGuestPendingOrders = () => {
  if (!isBrowser) return [];
  return parseStored(window.localStorage.getItem(STORAGE_KEY));
};

const saveGuestPendingOrders = (orders) => {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("guest-pending-orders:changed", { detail: orders }));
};

export const addGuestPendingOrder = (trackingCode) => {
  if (!isBrowser || !trackingCode) return;
  const current = getGuestPendingOrders();
  if (current.some((order) => order.trackingCode === trackingCode)) return;
  saveGuestPendingOrders([{ trackingCode, createdAt: new Date().toISOString() }, ...current]);
};

export const removeGuestPendingOrder = (trackingCode) => {
  if (!isBrowser) return;
  const filtered = getGuestPendingOrders().filter((order) => order.trackingCode !== trackingCode);
  saveGuestPendingOrders(filtered);
};

export const getLatestGuestPendingOrder = () => {
  const [latest] = getGuestPendingOrders();
  return latest || null;
};

export const clearGuestPendingOrders = () => {
  saveGuestPendingOrders([]);
};

export const GUEST_PENDING_ORDERS_STORAGE_KEY = STORAGE_KEY;
