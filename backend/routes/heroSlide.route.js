import express from "express";
import {
        createHeroSlide,
        deleteHeroSlide,
        listHeroSlides,
        updateHeroSlide,
} from "../controllers/heroSlide.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", listHeroSlides);
router.post("/", protectRoute, adminRoute, createHeroSlide);
router.put("/:id", protectRoute, adminRoute, updateHeroSlide);
router.delete("/:id", protectRoute, adminRoute, deleteHeroSlide);

export default router;
