import Redis from "ioredis";

const redisOptions = { lazyConnect: true, maxRetriesPerRequest: 2 };

export const createRedisClient = (url, RedisClient = Redis) =>
  new RedisClient(url, redisOptions);

export const redis = createRedisClient(process.env.UPSTASH_REDIS_URL);

export const closeRedis = async () => {
  if (["end", "close"].includes(redis.status)) return;
  if (redis.status === "wait") {
    redis.disconnect();
    return;
  }
  await redis.quit();
};
