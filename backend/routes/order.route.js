import express from "express";
import multer from "multer";
import {
  approveOrder,
  claimGuestOrder,
  createOrder,
  createPosInvoice,
  getAdminOrders,
  getMyOrders,
  getOrderByTracking,
  getOrderDetailsByTracking,
  getOrderPaymentSession,
  getOrderPaymentSessionByTracking,
  rejectOrder,
  submitPaymentProof,
} from "../controllers/order.controller.js";
import { adminRoute, optionalAuth, protectRoute } from "../middleware/auth.middleware.js";
import { createRequireOrderAccess } from "../middleware/orderAccess.middleware.js";
import {
  paymentProofRateLimiter,
  trackingRateLimiter,
} from "../middleware/rateLimit.middleware.js";
import Order from "../models/order.model.js";
import {
  MAX_RECEIPT_BYTES,
  receiptFileFilter,
} from "../security/receiptUpload.js";

export const createOrderRouter = ({ OrderModel = Order } = {}) => {
  const router = express.Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RECEIPT_BYTES, files: 1 },
    fileFilter: receiptFileFilter,
  });

  const requireOrderById = createRequireOrderAccess((req) =>
    OrderModel.findById(req.params.id).select("+guestAccessTokenHash")
  );
  const requireOrderByTracking = createRequireOrderAccess((req) =>
    OrderModel.findOne({ trackingCode: req.params.trackingCode }).select("+guestAccessTokenHash")
  );
  const requireClaimedOrder = createRequireOrderAccess((req) =>
    OrderModel.findOne({ trackingCode: String(req.body?.trackingCode || "").trim() }).select("+guestAccessTokenHash")
  );

  router.post("/", optionalAuth, createOrder);
  router.post("/claim", trackingRateLimiter, protectRoute, requireClaimedOrder, claimGuestOrder);
  router.get("/my", protectRoute, getMyOrders);
  router.get("/admin/all", protectRoute, adminRoute, getAdminOrders);
  router.post("/admin/pos-invoice", protectRoute, adminRoute, createPosInvoice);
  router.get("/tracking/:trackingCode", trackingRateLimiter, optionalAuth, requireOrderByTracking, getOrderByTracking);
  router.get(
    "/tracking/:trackingCode/details",
    trackingRateLimiter,
    optionalAuth,
    requireOrderByTracking,
    getOrderDetailsByTracking
  );
  router.get(
    "/tracking/:trackingCode/payment-session",
    trackingRateLimiter,
    optionalAuth,
    requireOrderByTracking,
    getOrderPaymentSessionByTracking
  );
  router.get("/:id/payment-session", trackingRateLimiter, optionalAuth, requireOrderById, getOrderPaymentSession);
  router.post(
    "/:id/payment-proof",
    paymentProofRateLimiter,
    optionalAuth,
    requireOrderById,
    upload.single("receiptImage"),
    submitPaymentProof
  );
  router.patch("/:id/approve", protectRoute, adminRoute, approveOrder);
  router.patch("/:id/reject", protectRoute, adminRoute, rejectOrder);

  return router;
};

export default createOrderRouter();
