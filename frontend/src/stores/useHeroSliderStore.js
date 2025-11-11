import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { translate } from "../lib/locale";

export const useHeroSliderStore = create((set) => ({
        slides: [],
        loading: false,
        formLoading: false,

        fetchSlides: async () => {
                set({ loading: true });
                try {
                        const data = await apiClient.get(`/hero-slides`);
                        const slides = Array.isArray(data?.slides) ? data.slides : [];
                        set({ slides, loading: false });
                } catch (error) {
                        set({ loading: false });
                        toast.error(
                                translate("toast.heroSlidesFetchError") ||
                                        translate("toast.genericError")
                        );
                        throw error;
                }
        },

        createSlide: async (payload) => {
                set({ formLoading: true });
                try {
                        const data = await apiClient.post(`/hero-slides`, payload);
                        set((state) => ({ slides: [...state.slides, data], formLoading: false }));
                        toast.success(translate("common.messages.slideCreated"));
                        return data;
                } catch (error) {
                        set({ formLoading: false });
                        toast.error(
                                translate("toast.heroSlidesCreateError") ||
                                        translate("toast.genericError")
                        );
                        throw error;
                }
        },

        updateSlide: async (id, payload) => {
                if (!id) return null;
                set({ formLoading: true });
                try {
                        const data = await apiClient.put(`/hero-slides/${id}`, payload);
                        set((state) => ({
                                slides: state.slides.map((slide) => (slide._id === id ? data : slide)),
                                formLoading: false,
                        }));
                        toast.success(translate("common.messages.slideUpdated"));
                        return data;
                } catch (error) {
                        set({ formLoading: false });
                        toast.error(
                                translate("toast.heroSlidesUpdateError") ||
                                        translate("toast.genericError")
                        );
                        throw error;
                }
        },

        deleteSlide: async (id) => {
                if (!id) return;
                set({ formLoading: true });
                try {
                        await apiClient.delete(`/hero-slides/${id}`);
                        set((state) => ({
                                slides: state.slides.filter((slide) => slide._id !== id),
                                formLoading: false,
                        }));
                        toast.success(translate("common.messages.slideDeleted"));
                } catch (error) {
                        set({ formLoading: false });
                        toast.error(
                                translate("toast.heroSlidesDeleteError") ||
                                        translate("toast.genericError")
                        );
                        throw error;
                }
        },
}));

export default useHeroSliderStore;
