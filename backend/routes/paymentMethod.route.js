import express from "express";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from "../controllers/paymentMethod.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  if (req.query.includeInactive === "true") {
    return protectRoute(req, res, () => adminRoute(req, res, next));
  }
  return next();
}, getPaymentMethods);
router.post("/", protectRoute, adminRoute, createPaymentMethod);
router.patch("/:id", protectRoute, adminRoute, updatePaymentMethod);
router.delete("/:id", protectRoute, adminRoute, deletePaymentMethod);

export default router;
