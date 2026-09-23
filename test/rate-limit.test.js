import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";

import { createRouteRateLimiter } from "../backend/middleware/rateLimit.middleware.js";

test("route limiter returns a generic 429 after the configured request budget", async () => {
  const app = express();
  app.set("trust proxy", false);
  app.get("/limited", createRouteRateLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) => {
    res.json({ ok: true });
  });

  assert.equal((await request(app).get("/limited")).status, 200);
  assert.equal((await request(app).get("/limited")).status, 200);
  const blocked = await request(app).get("/limited");

  assert.equal(blocked.status, 429);
  assert.deepEqual(blocked.body, { message: "Too many requests, please try again later" });
  assert.equal(blocked.headers["x-ratelimit-limit"], undefined);
  assert.match(blocked.headers["ratelimit"], /r=0/);
});
