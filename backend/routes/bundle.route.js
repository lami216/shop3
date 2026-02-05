import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createBundle, listBundles } from "../controllers/bundle.controller.js";

const router = express.Router();

router.get("/", listBundles);
router.post("/", protectRoute, adminRoute, createBundle);

export default router;
