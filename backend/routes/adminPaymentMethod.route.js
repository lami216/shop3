import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createPaymentMethod, getAdminPaymentMethods, updatePaymentMethod } from "../controllers/paymentMethod.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAdminPaymentMethods);
router.post("/", protectRoute, adminRoute, createPaymentMethod);
router.put("/:id", protectRoute, adminRoute, updatePaymentMethod);

export default router;
