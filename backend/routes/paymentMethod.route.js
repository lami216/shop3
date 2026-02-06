import express from "express";
import { getPublicPaymentMethods } from "../controllers/paymentMethod.controller.js";

const router = express.Router();

router.get("/", getPublicPaymentMethods);

export default router;
