import express from "express";
import { login, logout, signup, refreshToken, getProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
router.post("/logout", logout);
router.post("/refresh-token", authRateLimiter, refreshToken);
router.get("/profile", protectRoute, getProfile);

export default router;
