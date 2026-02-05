import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
	approveOrder,
	createOrder,
	getMyOrders,
	getOrderByTracking,
	getOrderForUser,
	rejectOrder,
	submitPaymentProof,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", protectRoute, createOrder);
router.get("/my", protectRoute, getMyOrders);
router.get("/tracking/:trackingCode", getOrderByTracking);
router.get("/:orderId", protectRoute, getOrderForUser);
router.post("/:orderId/payment-proof", protectRoute, submitPaymentProof);

router.post("/:orderId/approve", protectRoute, adminRoute, approveOrder);
router.post("/:orderId/reject", protectRoute, adminRoute, rejectOrder);

export default router;
