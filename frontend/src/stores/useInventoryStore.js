import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

export const useInventoryStore = create((set) => ({
  adminItems: [],
  intakes: [],
  publicMap: {},
  loading: false,
  fetchAdminOverview: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get("/inventory/overview");
      set({ adminItems: data.items || [], loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to load inventory");
    }
  },
  addBatch: async ({ productId, quantity, purchasePrice }) => {
    await apiClient.post("/inventory/batch", { productId, quantity, purchasePrice });
  },
  createIntake: async ({ invoiceDate, reference, items }) => {
    const data = await apiClient.post("/inventory/intakes", { invoiceDate, reference, items });
    return data.intake;
  },
  fetchIntakes: async () => {
    try {
      const data = await apiClient.get("/inventory/intakes");
      set({ intakes: data.intakes || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load inventory intakes");
    }
  },
  fetchPublicSummary: async (productIds) => {
    const ids = (productIds || []).filter(Boolean);
    if (!ids.length) return;
    try {
      const data = await apiClient.get(`/inventory/public-summary?ids=${ids.join(",")}`);
      const map = {};
      (data.items || []).forEach((x) => {
        map[x.productId] = x;
      });
      set((state) => ({ publicMap: { ...state.publicMap, ...map } }));
    } catch {
      // ignore
    }
  },
}));
