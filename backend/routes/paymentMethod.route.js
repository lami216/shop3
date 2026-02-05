import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createPaymentMethod, getPaymentMethods, updatePaymentMethod } from "../controllers/paymentMethod.controller.js";

const router = express.Router();

router.get("/", getPaymentMethods);
router.post("/", protectRoute, adminRoute, createPaymentMethod);
router.put("/:id", protectRoute, adminRoute, updatePaymentMethod);

export default router;
