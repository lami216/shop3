import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

export const usePaymentMethodStore = create((set) => ({
  methods: [],
  loading: false,
  fetchMethods: async ({ scope = "public" } = {}) => {
    set({ loading: true });
    try {
      const endpoint = scope === "admin" ? "/admin/payment-methods" : "/payment-methods";
      const data = await apiClient.get(endpoint);
      set({ methods: data.methods || [], loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to load payment methods");
    }
  },
  createMethod: async (payload) => {
    await apiClient.post("/admin/payment-methods", payload);
  },
  updateMethod: async (id, payload) => {
    await apiClient.patch(`/admin/payment-methods/${id}`, payload);
  },
}));
