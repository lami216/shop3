import { loadEnvironment, validateEnvironment } from "./config/environment.js";

loadEnvironment();
validateEnvironment();

const [
  { createApp },
  { connectDB, disconnectDB },
  { closeRedis },
  { createReadiness, startApplication },
  { startOrderLifecycleJobs },
] = await Promise.all([
  import("./app.js"),
  import("./lib/db.js"),
  import("./lib/redis.js"),
  import("./runtime/startApplication.js"),
  import("./services/orderLifecycle.service.js"),
]);

const HOST = "127.0.0.1";
const PORT = 10003;
const readiness = createReadiness();
const app = createApp({ readiness });

try {
  await startApplication({
    app,
    connectDB,
    disconnectDB,
    closeRedis,
    startJobs: startOrderLifecycleJobs,
    host: HOST,
    port: PORT,
    readiness,
  });
} catch (error) {
  console.error("Application startup failed", error);
  process.exit(1);
}
