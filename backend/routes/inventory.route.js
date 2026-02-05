import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { addInventoryBatch, getInventoryOverview, getProductBatches, getPublicInventorySummary } from "../controllers/inventory.controller.js";

const router = express.Router();

router.get("/public-summary", getPublicInventorySummary);
router.get("/overview", protectRoute, adminRoute, getInventoryOverview);
router.get("/product/:productId/batches", protectRoute, adminRoute, getProductBatches);
router.post("/batch", protectRoute, adminRoute, addInventoryBatch);

export default router;
