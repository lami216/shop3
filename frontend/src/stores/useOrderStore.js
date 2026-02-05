import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

export const useOrderStore = create((set) => ({
  adminOrders: [],
  myOrders: [],
  loading: false,
  createOrder: async (payload) => {
    return apiClient.post("/orders", payload);
  },
  getPaymentSession: async (orderId) => {
    return apiClient.get(`/orders/${orderId}/payment-session`);
  },
  submitPaymentProof: async (orderId, payload) => {
    return apiClient.post(`/orders/${orderId}/payment-proof`, payload);
  },
  fetchAdminOrders: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get("/orders/admin/all");
      set({ adminOrders: data.orders || [], loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to load orders");
    }
  },
  approveOrder: async (id) => apiClient.patch(`/orders/${id}/approve`),
  rejectOrder: async (id) => apiClient.patch(`/orders/${id}/reject`),
  fetchMyOrders: async () => {
    const data = await apiClient.get("/orders/my");
    set({ myOrders: data.orders || [] });
  },
  trackOrder: async (trackingCode) => apiClient.get(`/orders/tracking/${trackingCode}`),
}));
