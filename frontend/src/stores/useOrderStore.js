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
  approveOrder: async (id) => {
    try {
      const data = await apiClient.patch(`/orders/${id}/approve`);
      set((state) => ({
        adminOrders: state.adminOrders.map((order) => (order._id === id ? data.order : order)),
      }));
      toast.success("Order approved");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve order");
      throw error;
    }
  },
  rejectOrder: async (id) => {
    try {
      const data = await apiClient.patch(`/orders/${id}/reject`);
      set((state) => ({
        adminOrders: state.adminOrders.map((order) => (order._id === id ? (data.order || { ...order, status: "REJECTED" }) : order)),
      }));
      toast.success("Order rejected");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject order");
      throw error;
    }
  },
  createPosInvoice: async (payload) => {
    return apiClient.post("/orders/admin/pos-invoice", payload);
  },
  fetchMyOrders: async () => {
    const data = await apiClient.get("/orders/my");
    set({ myOrders: data.orders || [] });
  },
  trackOrder: async (trackingCode) => apiClient.get(`/orders/tracking/${trackingCode}`),
}));
