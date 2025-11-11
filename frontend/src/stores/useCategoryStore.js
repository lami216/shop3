import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { translate } from "../lib/locale";

export const useCategoryStore = create((set) => ({
        categories: [],
        loading: false,
        error: null,
        selectedCategory: null,

        setSelectedCategory: (category) => set({ selectedCategory: category }),
        clearSelectedCategory: () => set({ selectedCategory: null }),

        fetchCategories: async (options = {}) => {
                set({ loading: true, error: null });
                try {
                        const { parent } = options;
                        let query = "";

                        if (parent === null) {
                                query = "?parent=null";
                        } else if (typeof parent === "string" && parent.trim()) {
                                query = `?parent=${parent.trim()}`;
                        }

                        const data = await apiClient.get(`/categories${query}`);
                        set({ categories: data?.categories ?? [], loading: false });
                } catch (error) {
                        set({ loading: false, error: error.response?.data?.message || "Failed to fetch categories" });
                        toast.error(translate("toast.categoryFetchError"));
                }
        },

        createCategory: async (payload) => {
                set({ loading: true, error: null });
                try {
                        const data = await apiClient.post(`/categories`, payload);
                        set((state) => ({
                                categories: [...state.categories, data],
                                loading: false,
                        }));
                        toast.success(translate("common.messages.categoryCreated"));
                        return data;
                } catch (error) {
                        set({ loading: false });
                        toast.error(error.response?.data?.message || translate("toast.categoryCreateError"));
                        throw error;
                }
        },

        updateCategory: async (id, payload) => {
                set({ loading: true, error: null });
                try {
                        const data = await apiClient.put(`/categories/${id}`, payload);
                        set((state) => ({
                                categories: state.categories.map((category) =>
                                        category._id === id ? data : category
                                ),
                                selectedCategory: null,
                                loading: false,
                        }));
                        toast.success(translate("common.messages.categoryUpdated"));
                        return data;
                } catch (error) {
                        set({ loading: false });
                        toast.error(error.response?.data?.message || translate("toast.categoryUpdateError"));
                        throw error;
                }
        },

        deleteCategory: async (id) => {
                set({ loading: true, error: null });
                try {
                        await apiClient.delete(`/categories/${id}`);
                        set((state) => ({
                                categories: state.categories
                                        .filter((category) => category._id !== id)
                                        .map((category) =>
                                                (() => {
                                                        const parent = category.parentCategory;
                                                        const parentId =
                                                                typeof parent === "object" && parent !== null
                                                                        ? parent._id ?? parent.toString?.() ?? null
                                                                        : parent;

                                                        if (parentId === id) {
                                                                return { ...category, parentCategory: null };
                                                        }

                                                        return category;
                                                })()
                                        ),
                                selectedCategory: state.selectedCategory?._id === id ? null : state.selectedCategory,
                                loading: false,
                        }));
                        toast.success(translate("common.messages.categoryDeleted"));
                } catch (error) {
                        set({ loading: false });
                        toast.error(error.response?.data?.message || translate("toast.categoryDeleteError"));
                        throw error;
                }
        },
}));
