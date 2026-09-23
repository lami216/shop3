import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createLogout } from "../backend/controllers/auth.controller.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("logout clears cookies and succeeds even when refresh-token revocation fails", async () => {
  const cleared = [];
  const response = {
    clearCookie: (name, options) => cleared.push({ name, options }),
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  const logout = createLogout({
    redisClient: { del: async () => { throw new Error("redis unavailable"); } },
    jwtLibrary: { verify: () => ({ userId: "user-1", exp: 9999999999 }) },
    logger: { error: () => {} },
  });

  await logout({ cookies: { refreshToken: "opaque" } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(cleared.map(({ name }) => name), ["accessToken", "refreshToken"]);
  assert.deepEqual(response.payload, { message: "Logged out successfully" });
});

test("logout does not share the login abuse rate-limit bucket", () => {
  const source = fs.readFileSync(path.join(projectRoot, "backend/routes/auth.route.js"), "utf8");
  assert.doesNotMatch(source, /post\("\/logout",\s*authRateLimiter/);
});
