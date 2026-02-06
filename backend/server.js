import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import categoryRoutes from "./routes/category.route.js";
import publicConfigRoutes from "./routes/publicConfig.route.js";
import heroSlideRoutes from "./routes/heroSlide.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import paymentMethodRoutes from "./routes/paymentMethod.route.js";
import adminPaymentMethodRoutes from "./routes/adminPaymentMethod.route.js";
import orderRoutes from "./routes/order.route.js";
import { startOrderLifecycleJobs } from "./services/orderLifecycle.service.js";

import { connectDB } from "./lib/db.js";

// 🟢 نحمّل ملف البيئة من /etc/shop3/.env
dotenv.config({ path: "/etc/shop3/.env" });

const app = express();
const PORT = process.env.PORT || 10003;
const __dirname = path.resolve();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/public-config", publicConfigRoutes);
app.use("/api/hero-slides", heroSlideRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/admin/payment-methods", adminPaymentMethodRoutes);
app.use("/api/orders", orderRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT, () => {
	console.log(`🟢 Server is running on http://localhost:${PORT}`);
	connectDB();
	startOrderLifecycleJobs();
});
