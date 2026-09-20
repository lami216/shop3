const createReadiness = () => {
  let ready = false;
  return {
    isReady: () => ready,
    markReady: () => { ready = true; },
    markNotReady: () => { ready = false; },
  };
};

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

export const startApplication = async ({
  app,
  connectDB,
  disconnectDB,
  closeRedis,
  startJobs,
  host,
  port,
  readiness = createReadiness(),
  registerSignalHandlers = true,
  logger = console,
}) => {
  await connectDB();

  let server;
  await new Promise((resolve, reject) => {
    server = app.listen(port, host, resolve);
    server.once?.("error", reject);
  });

  readiness.markReady();
  startJobs();
  logger.info(`Server listening on http://${host}:${port}`);

  let shutdownPromise;
  const shutdown = (signal = "shutdown") => {
    if (shutdownPromise) return shutdownPromise;
    readiness.markNotReady();
    logger.info(`Graceful shutdown started (${signal})`);
    shutdownPromise = (async () => {
      await closeServer(server);
      await disconnectDB();
      await closeRedis();
      logger.info("Graceful shutdown completed");
    })();
    return shutdownPromise;
  };

  if (registerSignalHandlers) {
    for (const signal of ["SIGTERM", "SIGINT"]) {
      process.once(signal, () => {
        shutdown(signal)
          .then(() => process.exit(0))
          .catch((error) => {
            logger.error("Graceful shutdown failed", error);
            process.exit(1);
          });
      });
    }
  }

  return { server, shutdown, readiness };
};

export { createReadiness };
