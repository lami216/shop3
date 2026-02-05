import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

export const usePaymentMethodStore = create((set) => ({
  methods: [],
  loading: false,
  fetchMethods: async (activeOnly = false) => {
    set({ loading: true });
    try {
      const data = await apiClient.get(`/payment-methods${activeOnly ? "?active=1" : ""}`);
      set({ methods: data.methods || [], loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to load payment methods");
    }
  },
  createMethod: async (payload) => {
    await apiClient.post("/payment-methods", payload);
  },
  updateMethod: async (id, payload) => {
    await apiClient.put(`/payment-methods/${id}`, payload);
  },
}));
