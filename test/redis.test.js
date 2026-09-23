import assert from "node:assert/strict";
import test from "node:test";

import { createRedisClient } from "../backend/lib/redis.js";

test("Redis client is created lazily so imports cannot open network connections", () => {
  const calls = [];
  class FakeRedis {
    constructor(url, options) {
      calls.push({ url, options });
    }
  }

  createRedisClient("rediss://cache.example", FakeRedis);
  assert.deepEqual(calls, [
    { url: "rediss://cache.example", options: { lazyConnect: true, maxRetriesPerRequest: 2 } },
  ]);
});
