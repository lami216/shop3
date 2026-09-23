import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";

import { createHealthRouter } from "../backend/routes/health.route.js";
import { createReadiness } from "../backend/runtime/startApplication.js";

test("health is live while readiness follows startup and shutdown state", async () => {
  const readiness = createReadiness();
  const app = express();
  app.use(createHealthRouter(readiness));

  const live = await request(app).get("/healthz");
  assert.equal(live.status, 200);
  assert.deepEqual(live.body, { status: "ok" });

  const unavailable = await request(app).get("/readyz");
  assert.equal(unavailable.status, 503);
  assert.deepEqual(unavailable.body, { status: "not_ready" });

  readiness.markReady();
  const ready = await request(app).get("/readyz");
  assert.equal(ready.status, 200);
  assert.deepEqual(ready.body, { status: "ready" });
});
