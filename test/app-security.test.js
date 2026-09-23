import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

import { createApp } from "../backend/app.js";
import { createReadiness } from "../backend/runtime/startApplication.js";

test("application enables Helmet and does not expose Express", async () => {
  const app = createApp({
    readiness: createReadiness(),
    registerRoutes: (target) => target.get("/probe", (_req, res) => res.json({ ok: true })),
  });

  const response = await request(app).get("/probe");
  assert.equal(response.status, 200);
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "SAMEORIGIN");
});

test("unexpected errors return a generic response without internal messages", async () => {
  const app = createApp({
    readiness: createReadiness(),
    registerRoutes: (target) => target.get("/boom", () => {
      throw new Error("database host and internal stack details");
    }),
    logger: { error: () => {} },
  });

  const response = await request(app).get("/boom");
  assert.equal(response.status, 500);
  assert.deepEqual(response.body, { message: "Internal server error" });
  assert.doesNotMatch(JSON.stringify(response.body), /database|stack/i);
});
