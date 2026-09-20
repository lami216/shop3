import assert from "node:assert/strict";
import test from "node:test";

import { ENV_FILE_PATH, loadEnvironment, validateEnvironment } from "../backend/config/environment.js";

test("environment loader uses the single protected production path", () => {
  const calls = [];
  loadEnvironment({
    configure: (options) => {
      calls.push(options);
      return { parsed: {} };
    },
  });

  assert.equal(ENV_FILE_PATH, "/etc/shop3/.env");
  assert.deepEqual(calls, [{ path: "/etc/shop3/.env" }]);
});

test("environment validation reports names but never secret values", () => {
  assert.throws(
    () => validateEnvironment({ MONGO_URI: "mongodb://secret-value" }),
    (error) => {
      assert.match(error.message, /UPSTASH_REDIS_URL/);
      assert.match(error.message, /ACCESS_TOKEN_SECRET/);
      assert.doesNotMatch(error.message, /secret-value/);
      return true;
    }
  );
});

test("environment loader fails closed when the configured file cannot be read", () => {
  assert.throws(
    () => loadEnvironment({ configure: () => ({ error: new Error("missing env") }) }),
    /missing env/
  );
});
