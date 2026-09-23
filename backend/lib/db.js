import mongoose from "mongoose";

const dropLegacyStripeSessionIndex = async () => {
  try {
    await mongoose.connection.db.collection("orders").dropIndex("stripeSessionId_1");
    console.info("Dropped legacy stripeSessionId_1 index from orders");
  } catch (error) {
    if (error?.codeName !== "IndexNotFound") {
      console.warn("Failed to drop legacy stripeSessionId_1 index", error);
    }
  }
};

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  const connection = await mongoose.connect(process.env.MONGO_URI, { dbName: "test3" });
  console.info(`MongoDB connected: ${connection.connection.host}`);
  await dropLegacyStripeSessionIndex();
  return connection;
};

export const disconnectDB = () => mongoose.disconnect();
