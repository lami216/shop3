import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  approveOrder,
  createOrder,
  getAdminOrders,
  getMyOrders,
  getOrderByTracking,
  getOrderPaymentSession,
  rejectOrder,
  submitPaymentProof,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/my", protectRoute, getMyOrders);
router.get("/tracking/:trackingCode", getOrderByTracking);
router.get("/:id/payment-session", getOrderPaymentSession);
router.post("/:id/payment-proof", submitPaymentProof);
router.get("/admin/all", protectRoute, adminRoute, getAdminOrders);
router.patch("/:id/approve", protectRoute, adminRoute, approveOrder);
router.patch("/:id/reject", protectRoute, adminRoute, rejectOrder);

export default router;
