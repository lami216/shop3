import mongoose from "mongoose";

const dropLegacyStripeSessionIndex = async () => {
	try {
		await mongoose.connection.db.collection("orders").dropIndex("stripeSessionId_1");
		console.log("Dropped legacy stripeSessionId_1 index from orders.");
	} catch (error) {
		if (error?.codeName !== "IndexNotFound") {
			console.log("Failed to drop stripeSessionId_1 index", error.message);
		}
	}
};

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(`MongoDB connected: ${conn.connection.host}`);
		await dropLegacyStripeSessionIndex();
	} catch (error) {
		console.log("Error connecting to MONGODB", error.message);
		process.exit(1);
	}
};
