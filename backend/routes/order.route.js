import express from "express";
import multer from "multer";
import { adminRoute, optionalAuth, protectRoute } from "../middleware/auth.middleware.js";
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

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", optionalAuth, createOrder);
router.post("/claim", protectRoute, claimGuestOrder);
router.get("/my", protectRoute, getMyOrders);
router.get("/tracking/:trackingCode", optionalAuth, getOrderByTracking);
router.get("/tracking/:trackingCode/details", optionalAuth, getOrderDetailsByTracking);
router.get("/tracking/:trackingCode/payment-session", getOrderPaymentSessionByTracking);
router.get("/:id/payment-session", getOrderPaymentSession);
router.post("/:id/payment-proof", upload.single("receiptImage"), submitPaymentProof);
router.get("/admin/all", protectRoute, adminRoute, getAdminOrders);
router.post("/admin/pos-invoice", protectRoute, adminRoute, createPosInvoice);
router.patch("/:id/approve", protectRoute, adminRoute, approveOrder);
router.patch("/:id/reject", protectRoute, adminRoute, rejectOrder);

export default router;
