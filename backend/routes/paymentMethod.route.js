import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createPaymentMethod, listPaymentMethods } from "../controllers/paymentMethod.controller.js";

const router = express.Router();

router.get("/", listPaymentMethods);
router.post("/", protectRoute, adminRoute, createPaymentMethod);

export default router;
