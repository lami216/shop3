import dotenv from "dotenv";
import path from "path";
import Redis from "ioredis";

dotenv.config({ path: path.resolve("./backend/.env") });

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
