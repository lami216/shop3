import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

export const usePaymentMethodStore = create((set) => ({
  methods: [],
  loading: false,
  fetchMethods: async ({ includeInactive = false } = {}) => {
    set({ loading: true });
    try {
      const endpoint = includeInactive ? "/payment-methods?includeInactive=true" : "/payment-methods";
      const data = await apiClient.get(endpoint);
      set({ methods: data.methods || [], loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to load payment methods");
    }
  },
  createMethod: async (payload) => {
    return apiClient.post("/payment-methods", payload);
  },
  updateMethod: async (id, payload) => {
    return apiClient.patch(`/payment-methods/${id}`, payload);
  },
  deleteMethod: async (id) => {
    return apiClient.delete(`/payment-methods/${id}`);
  },
}));
