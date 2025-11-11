import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { translate } from "../lib/locale";

const resolveParentCategoryId = (value) => {
        if (value === null || value === undefined) {
                return null;
        }

        if (typeof value === "string") {
                const trimmed = value.trim();
                return trimmed.length > 0 ? trimmed : null;
        }

        if (typeof value === "object") {
                if (value === null) {
                        return null;
                }

                if (typeof value._id === "string" && value._id.length > 0) {
                        return value._id;
                }

                if (value._id && typeof value._id.toString === "function") {
                        return value._id.toString();
                }

                if (typeof value.toString === "function") {
                        const stringified = value.toString();
                        return stringified && stringified !== "[object Object]" ? stringified : null;
                }
        }

        return null;
};

export const isRootCategory = (category) => {
        if (!category) {
                return false;
        }

        return resolveParentCategoryId(category.parentCategory) === null;
};

export const selectRootCategories = (state) =>
        state.categories.filter((category) => isRootCategory(category));

const buildCategoriesQuery = ({ parent, rootOnly }) => {
        const params = new URLSearchParams();

        if (parent !== undefined) {
                if (parent === null) {
                        params.set("parent", "null");
                } else if (typeof parent === "string" && parent.trim()) {
                        params.set("parent", parent.trim());
                }
        } else if (rootOnly === true) {
                params.set("rootOnly", "true");
        } else if (rootOnly === false) {
                params.set("rootOnly", "false");
        }

        const query = params.toString();
        return query ? `?${query}` : "";
};

export const useCategoryStore = create((set, get) => ({
        categories: [],
        loading: false,
        error: null,
        selectedCategory: null,

        setSelectedCategory: (category) => set({ selectedCategory: category }),
        clearSelectedCategory: () => set({ selectedCategory: null }),

        fetchCategories: async (options = {}) => {
                set({ loading: true, error: null });
                try {
                        const { parent, rootOnly = true } = options;
                        const query = buildCategoriesQuery({ parent, rootOnly });
                        const data = await apiClient.get(`/categories${query}`);
                        const fetchedCategories = Array.isArray(data?.categories)
                                ? data.categories
                                : [];

                        const categories = rootOnly
                                ? fetchedCategories.filter((category) => isRootCategory(category))
                                : fetchedCategories;

                        set({ categories, loading: false });
                } catch (error) {
                        set({
                                loading: false,
                                error: error.response?.data?.message || "Failed to fetch categories",
                        });
                        toast.error(translate("toast.categoryFetchError"));
                }
        },

        fetchCategoryChildren: async (parentId) => {
                if (!parentId) {
                        return [];
                }

                try {
                        const data = await apiClient.get(`/categories/${parentId}/children`);
                        return Array.isArray(data?.categories) ? data.categories : [];
                } catch (error) {
                        throw error;
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
                                        .map((category) => {
                                                const parentId = resolveParentCategoryId(category.parentCategory);

                                                if (parentId === id) {
                                                        return { ...category, parentCategory: null };
                                                }

                                                return category;
                                        }),
                                selectedCategory:
                                        state.selectedCategory?._id === id ? null : state.selectedCategory,
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

export default useCategoryStore;
