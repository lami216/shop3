import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "/etc/shop3/.env" });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "test3" });
    const result = await mongoose.connection.db.collection("orders").dropIndex("stripeSessionId_1");
    console.log("Dropped index:", result);
  } catch (error) {
    if (error?.codeName === "IndexNotFound") {
      console.log("stripeSessionId_1 index does not exist, nothing to drop.");
    } else {
      console.error("Failed to drop index", error.message);
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
};

run();
