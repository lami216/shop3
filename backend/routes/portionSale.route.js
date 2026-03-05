import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getPortionSalesSummary } from "../controllers/portionSale.controller.js";

const router = express.Router();

router.get("/summary", protectRoute, adminRoute, getPortionSalesSummary);

export default router;
