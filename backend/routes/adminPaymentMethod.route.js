import express from "express";
import multer from "multer";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createPaymentMethod, getAdminPaymentMethods, togglePaymentMethod } from "../controllers/paymentMethod.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protectRoute, adminRoute, getAdminPaymentMethods);
router.post("/", protectRoute, adminRoute, upload.single("image"), createPaymentMethod);
router.patch("/:id", protectRoute, adminRoute, togglePaymentMethod);

export default router;
