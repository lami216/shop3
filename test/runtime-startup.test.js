import assert from "node:assert/strict";
import test from "node:test";

import { startApplication } from "../backend/runtime/startApplication.js";

test("startup waits for MongoDB before listening on the loopback production address", async () => {
  const events = [];
  const server = {
    close(callback) {
      events.push("server-close");
      callback();
    },
  };
  const app = {
    listen(port, host, callback) {
      events.push(`listen:${host}:${port}`);
      callback();
      return server;
    },
  };

  const runtime = await startApplication({
    app,
    connectDB: async () => events.push("db-connect"),
    disconnectDB: async () => events.push("db-close"),
    closeRedis: async () => events.push("redis-close"),
    startJobs: () => events.push("jobs-start"),
    host: "127.0.0.1",
    port: 10003,
    registerSignalHandlers: false,
    logger: { info: () => {}, error: () => {} },
  });

  assert.deepEqual(events.slice(0, 3), ["db-connect", "listen:127.0.0.1:10003", "jobs-start"]);
  assert.equal(runtime.readiness.isReady(), true);

  await runtime.shutdown("test");
  assert.equal(runtime.readiness.isReady(), false);
  assert.deepEqual(events.slice(3), ["server-close", "db-close", "redis-close"]);
});

test("startup never listens when MongoDB connection fails", async () => {
  let listened = false;
  await assert.rejects(
    startApplication({
      app: { listen: () => { listened = true; } },
      connectDB: async () => { throw new Error("mongo unavailable"); },
      disconnectDB: async () => {},
      closeRedis: async () => {},
      startJobs: () => {},
      host: "127.0.0.1",
      port: 10003,
      registerSignalHandlers: false,
      logger: { info: () => {}, error: () => {} },
    }),
    /mongo unavailable/
  );
  assert.equal(listened, false);
});
