import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  addInventoryBatch,
  createInventoryIntake,
  getInventoryIntakes,
  getInventoryOverview,
  getProductBatches,
  getPublicInventorySummary,
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.get("/public-summary", getPublicInventorySummary);
router.get("/overview", protectRoute, adminRoute, getInventoryOverview);
router.get("/intakes", protectRoute, adminRoute, getInventoryIntakes);
router.get("/product/:productId/batches", protectRoute, adminRoute, getProductBatches);
router.post("/batch", protectRoute, adminRoute, addInventoryBatch);
router.post("/intakes", protectRoute, adminRoute, createInventoryIntake);

export default router;
