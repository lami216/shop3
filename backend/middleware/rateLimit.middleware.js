import { rateLimit } from "express-rate-limit";

const genericMessage = { message: "Too many requests, please try again later" };

export const createRouteRateLimiter = ({ windowMs, limit }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: genericMessage,
  });

export const authRateLimiter = createRouteRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });
export const trackingRateLimiter = createRouteRateLimiter({ windowMs: 15 * 60 * 1000, limit: 30 });
export const paymentProofRateLimiter = createRouteRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });
