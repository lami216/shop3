import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import path from "path";

import analyticsRoutes from "./routes/analytics.route.js";
import authRoutes from "./routes/auth.route.js";
import cartRoutes from "./routes/cart.route.js";
import categoryRoutes from "./routes/category.route.js";
import couponRoutes from "./routes/coupon.route.js";
import { createHealthRouter } from "./routes/health.route.js";
import heroSlideRoutes from "./routes/heroSlide.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import orderRoutes from "./routes/order.route.js";
import paymentMethodRoutes from "./routes/paymentMethod.route.js";
import paymentRoutes from "./routes/payment.route.js";
import portionSaleRoutes from "./routes/portionSale.route.js";
import productRoutes from "./routes/product.route.js";
import publicConfigRoutes from "./routes/publicConfig.route.js";

const mountApplicationRoutes = (app) => {
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
  app.use("/api/orders", orderRoutes);
  app.use("/api/portion-sales", portionSaleRoutes);
};

export const createApp = ({ readiness, registerRoutes = mountApplicationRoutes, logger = console } = {}) => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", "loopback");

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:", "https:"],
        },
      },
    })
  );
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));
  app.use(cookieParser());
  app.use(createHealthRouter(readiness));

  registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    const frontendDist = path.resolve("frontend", "dist");
    app.use(express.static(frontendDist));
    app.get("*", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
  }

  app.use((error, _req, res, _next) => {
    logger.error("Unhandled request error", error);
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Receipt image is too large" });
    }
    if (["UNSUPPORTED_RECEIPT_TYPE", "INVALID_RECEIPT_CONTENT"].includes(error?.code)) {
      return res.status(400).json({ message: "Invalid receipt image" });
    }
    return res.status(500).json({ message: "Internal server error" });
  });

  return app;
};
