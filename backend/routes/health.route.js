import express from "express";

export const createHealthRouter = (readiness) => {
  const router = express.Router();

  router.get("/healthz", (_req, res) => res.json({ status: "ok" }));
  router.get("/readyz", (_req, res) => {
    if (!readiness.isReady()) {
      return res.status(503).json({ status: "not_ready" });
    }
    return res.json({ status: "ready" });
  });

  return router;
};
