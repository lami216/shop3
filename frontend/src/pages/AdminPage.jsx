import { BarChart, PlusCircle, ShoppingBasket, FolderTree } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useTranslation from "../hooks/useTranslation";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import CategoryManager from "../components/CategoryManager";
import { useProductStore } from "../stores/useProductStore";

const AdminPage = () => {
        const [activeTab, setActiveTab] = useState("create");
        const { fetchAllProducts } = useProductStore();
        const { t } = useTranslation();

        useEffect(() => {
                fetchAllProducts();
        }, [fetchAllProducts]);

        const tabs = useMemo(
                () => [
                        { id: "create", label: t("admin.tabs.create"), icon: PlusCircle },
                        { id: "products", label: t("admin.tabs.products"), icon: ShoppingBasket },
                        { id: "categories", label: t("admin.tabs.categories"), icon: FolderTree },
                        { id: "analytics", label: t("admin.tabs.analytics"), icon: BarChart },
                ],
                [t]
        );

        return (
                <div className='relative min-h-screen overflow-hidden'>
                        <div className='container relative z-10 mx-auto px-4 py-16'>
                                <motion.h1
                                        className='mb-8 text-center text-4xl font-bold text-payzone-gold'
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8 }}
                                >
                                        {t("admin.dashboardTitle")}
                                </motion.h1>

                                <div className='flex justify-center mb-8'>
                                        {tabs.map((tab) => (
                                                <button
                                                        key={tab.id}
                                                        onClick={() => setActiveTab(tab.id)}
                                                        className={`mx-2 flex items-center rounded-md px-4 py-2 transition-colors duration-200 ${
                                                                activeTab === tab.id
                                                                        ? "bg-payzone-gold text-payzone-navy"
                                                                        : "bg-white/10 text-white/80 hover:bg-white/20"
                                                        }`}
                                                >
                                                        <tab.icon className='ml-2 h-5 w-5' />
                                                        {tab.label}
                                                </button>
                                        ))}
                                </div>
                                {activeTab === "create" && <CreateProductForm />}
                                {activeTab === "products" && <ProductsList onEdit={() => setActiveTab("create")} />}
                                {activeTab === "categories" && <CategoryManager />}
                                {activeTab === "analytics" && <AnalyticsTab />}
                        </div>
                </div>
        );
};
export default AdminPage;
