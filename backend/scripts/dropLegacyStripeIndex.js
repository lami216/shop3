import { loadEnvironment, validateEnvironment } from "../config/environment.js";

loadEnvironment();
validateEnvironment();
const mongoose = (await import("mongoose")).default;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "test3" });
    const result = await mongoose.connection.db.collection("orders").dropIndex("stripeSessionId_1");
    console.info("Dropped index:", result);
  } catch (error) {
    if (error?.codeName === "IndexNotFound") {
      console.info("stripeSessionId_1 index does not exist, nothing to drop");
    } else {
      console.error("Failed to drop legacy index");
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
};

await run();
